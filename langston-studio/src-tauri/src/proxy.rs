//! Reverse proxy for OpenCode's web UI.
//!
//! WKWebView (Tauri's macOS webview engine) enforces aggressive HTTP connection
//! timeouts (~60-120s) on idle streaming connections. When OpenCode streams a
//! long LLM response via SSE, periods of inactivity (e.g., during model
//! "thinking") can exceed this timeout, causing the iframe to silently drop the
//! connection and appear frozen.
//!
//! This proxy sits between the webview and the OpenCode server, forwarding
//! requests with explicitly long timeouts (10 minutes) so the Rust-side
//! connection never times out. The webview sees fast, local responses from the
//! proxy and the proxy holds the long-lived upstream connection open.

use bytes::Bytes;
use chrono::Local;
use futures_util::StreamExt;
use http_body_util::{BodyExt, Full, StreamBody};
use hyper::body::Frame;
use hyper::server::conn::http1;
use hyper::service::service_fn;
use hyper::{Request, Response, StatusCode};
use hyper_util::rt::TokioIo;
use std::convert::Infallible;
use std::fs::OpenOptions;
use std::io::Write;
use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{Duration, Instant};
use tokio::net::TcpListener;

/// Maximum time to wait for upstream response headers.
const UPSTREAM_CONNECT_TIMEOUT: Duration = Duration::from_secs(30);
/// Maximum time to wait between body chunks from upstream (10 min).
const UPSTREAM_READ_TIMEOUT: Duration = Duration::from_secs(600);

/// Monotonic request counter for correlating log lines.
static REQUEST_COUNTER: AtomicU64 = AtomicU64::new(1);

/// JavaScript injected into every HTML response from upstream.
/// Overrides `window.fetch` for mutating HTTP methods (POST, PUT, PATCH, DELETE)
/// so those requests are relayed via `postMessage` to the parent Tauri webview.
/// The parent executes them through Rust's reqwest with a 10-minute timeout,
/// completely bypassing WKWebView's ~60s idle connection kill.
///
/// GET/HEAD/OPTIONS requests continue through native fetch (they're fast and
/// don't trigger the timeout issue).
const FETCH_OVERRIDE_SCRIPT: &str = r#"
(function() {
  var _origFetch = window.fetch;
  var _pending = {};

  window.addEventListener('message', function(e) {
    if (!e.data || !e.data.id) return;
    if (e.data.type === 'tauri-fetch-response' && _pending[e.data.id]) {
      _pending[e.data.id].resolve(e.data);
      delete _pending[e.data.id];
    }
    if (e.data.type === 'tauri-fetch-error' && _pending[e.data.id]) {
      _pending[e.data.id].reject(new Error(e.data.error));
      delete _pending[e.data.id];
    }
  });

  window.fetch = function(input, init) {
    var method = (init && init.method) ? init.method.toUpperCase() : 'GET';
    // Only intercept mutating methods — these are the ones that can block
    // for minutes while the LLM processes. GETs are fast or use SSE (streaming).
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return _origFetch.call(window, input, init);
    }

    // If we're not in an iframe (no parent), fall back to native fetch
    if (window === window.parent) {
      return _origFetch.call(window, input, init);
    }

    var url = typeof input === 'string' ? input : (input && input.url ? input.url : String(input));
    // Make relative URLs absolute
    if (url.startsWith('/')) {
      url = window.location.origin + url;
    }

    var id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    var headers = {};
    if (init && init.headers) {
      try {
        var h = new Headers(init.headers);
        h.forEach(function(v, k) { headers[k] = v; });
      } catch(ex) {
        // If headers aren't iterable, skip
      }
    }

    var body = (init && init.body) ? init.body : null;
    // Convert body to string if it's not already
    if (body && typeof body !== 'string') {
      try { body = JSON.stringify(body); } catch(ex) { body = String(body); }
    }

    console.log('[tauri-fetch] Relaying ' + method + ' ' + url + ' via postMessage (id: ' + id + ')');

    return new Promise(function(resolve, reject) {
      _pending[id] = { resolve: resolve, reject: reject };

      window.parent.postMessage({
        type: 'tauri-fetch',
        id: id,
        method: method,
        url: url,
        body: body,
        headers: headers
      }, '*');

      // Safety timeout: 10 minutes (matches Rust-side timeout)
      setTimeout(function() {
        if (_pending[id]) {
          console.error('[tauri-fetch] Timeout for ' + method + ' ' + url + ' (id: ' + id + ')');
          delete _pending[id];
          reject(new Error('tauri-fetch timeout after 600s'));
        }
      }, 600000);
    }).then(function(data) {
      console.log('[tauri-fetch] Got response for ' + method + ' ' + url + ': ' + data.status);
      return new Response(data.body, {
        status: data.status,
        headers: data.headers
      });
    });
  };

  console.log('[tauri-fetch] Fetch override active: POST/PUT/PATCH/DELETE -> Tauri relay');
})();
"#;

/// Write a log line to the shared app log file.
/// This ensures proxy logs appear in the same file the Logs viewer reads.
fn plog(log_file: &PathBuf, level: &str, msg: &str) {
    let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S%.3f");
    let line = format!("[{}] [{}] {}\n", timestamp, level, msg);

    if let Ok(mut file) = OpenOptions::new().append(true).open(log_file) {
        let _ = file.write_all(line.as_bytes());
    }

    // Also emit via the log crate for stdout/Tauri console
    match level {
        "ERROR" => log::error!("{}", msg),
        "WARN" => log::warn!("{}", msg),
        _ => log::info!("{}", msg),
    }
}

/// Start the reverse proxy on `proxy_port`, forwarding all traffic to
/// `upstream_port` on localhost. This function runs forever and should be
/// spawned on a tokio runtime.
pub async fn run_proxy(
    proxy_port: u16,
    upstream_port: u16,
    log_file: PathBuf,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let addr = SocketAddr::from(([127, 0, 0, 1], proxy_port));
    let listener = TcpListener::bind(addr).await?;

    plog(
        &log_file,
        "INFO",
        &format!("[proxy] Listening on {} -> localhost:{}", addr, upstream_port),
    );

    let client = reqwest::Client::builder()
        .connect_timeout(UPSTREAM_CONNECT_TIMEOUT)
        .read_timeout(UPSTREAM_READ_TIMEOUT)
        .pool_idle_timeout(Duration::from_secs(600))
        .pool_max_idle_per_host(10)
        .no_proxy()
        .build()?;

    loop {
        let (stream, peer) = listener.accept().await?;
        let io = TokioIo::new(stream);
        let client = client.clone();
        let upstream = upstream_port;
        let lf = log_file.clone();

        tokio::spawn(async move {
            let service = service_fn(move |req: Request<hyper::body::Incoming>| {
                let client = client.clone();
                let lf = lf.clone();
                async move { handle_request(req, client, upstream, lf).await }
            });

            if let Err(e) = http1::Builder::new()
                .keep_alive(true)
                .serve_connection(io, service)
                .await
            {
                let msg = e.to_string();
                if !msg.contains("connection reset") && !msg.contains("broken pipe") {
                    // Can't easily pass log_file here, use log crate only
                    log::warn!("[proxy] Connection error ({}): {}", peer, msg);
                }
            }
        });
    }
}

/// Classify a request path for log readability.
fn classify_request(path: &str) -> &'static str {
    if path.contains("/api/session") && path.contains("/message") {
        "message (streaming)"
    } else if path.contains("/api/session") {
        "session API"
    } else if path.contains("/api/") {
        "API"
    } else if path.contains(".js") || path.contains(".css") || path.contains(".woff") {
        "static asset"
    } else if path == "/" || path.contains(".html") {
        "page"
    } else {
        "other"
    }
}

async fn handle_request(
    req: Request<hyper::body::Incoming>,
    client: reqwest::Client,
    upstream_port: u16,
    log_file: PathBuf,
) -> Result<
    Response<
        http_body_util::Either<
            Full<Bytes>,
            StreamBody<
                impl futures_util::Stream<Item = Result<Frame<Bytes>, Infallible>>,
            >,
        >,
    >,
    Infallible,
> {
    let req_id = REQUEST_COUNTER.fetch_add(1, Ordering::Relaxed);
    let started = Instant::now();
    let method = req.method().clone();
    let uri = req.uri().to_string();
    let kind = classify_request(&uri);

    let upstream_url = format!("http://127.0.0.1:{}{}", upstream_port, req.uri());

    // Log all non-static requests
    if kind != "static asset" {
        plog(
            &log_file,
            "INFO",
            &format!("[proxy] #{} {} {} -> upstream ({})", req_id, method, uri, kind),
        );
    }

    // Build the upstream request preserving method, headers, and body
    let rw_method = match method.as_str() {
        "GET" => reqwest::Method::GET,
        "POST" => reqwest::Method::POST,
        "PUT" => reqwest::Method::PUT,
        "DELETE" => reqwest::Method::DELETE,
        "PATCH" => reqwest::Method::PATCH,
        "HEAD" => reqwest::Method::HEAD,
        "OPTIONS" => reqwest::Method::OPTIONS,
        _ => reqwest::Method::GET,
    };

    let mut upstream_req = client.request(rw_method, &upstream_url);

    // Forward headers (skip host, it'll be set by reqwest)
    let mut has_accept_stream = false;
    for (name, value) in req.headers() {
        if name == "host" {
            continue;
        }
        if name == "accept" {
            if let Ok(v) = value.to_str() {
                if v.contains("text/event-stream") || v.contains("text/x-component") {
                    has_accept_stream = true;
                }
            }
        }
        if let Ok(v) = value.to_str() {
            upstream_req = upstream_req.header(name.as_str(), v);
        }
    }

    if has_accept_stream {
        plog(
            &log_file,
            "INFO",
            &format!(
                "[proxy] #{} Client requested streaming response (Accept: event-stream/x-component)",
                req_id
            ),
        );
    }

    // Forward body
    let body_bytes = match req.into_body().collect().await {
        Ok(collected) => collected.to_bytes(),
        Err(e) => {
            plog(
                &log_file,
                "ERROR",
                &format!("[proxy] #{} Failed to read request body: {}", req_id, e),
            );
            Bytes::new()
        }
    };
    if !body_bytes.is_empty() && kind != "static asset" {
        plog(
            &log_file,
            "INFO",
            &format!("[proxy] #{} Request body: {} bytes", req_id, body_bytes.len()),
        );
        upstream_req = upstream_req.body(body_bytes);
    } else if !body_bytes.is_empty() {
        upstream_req = upstream_req.body(body_bytes);
    }

    // Send upstream request
    let upstream_resp = match upstream_req.send().await {
        Ok(resp) => resp,
        Err(e) => {
            let elapsed = started.elapsed();
            let is_timeout = e.is_timeout();
            let is_connect = e.is_connect();

            plog(
                &log_file,
                "ERROR",
                &format!(
                    "[proxy] #{} UPSTREAM ERROR after {:.1}s: {} (timeout={}, connect_err={})",
                    req_id,
                    elapsed.as_secs_f64(),
                    e,
                    is_timeout,
                    is_connect,
                ),
            );

            if is_timeout {
                plog(
                    &log_file,
                    "ERROR",
                    &format!(
                        "[proxy] #{} Upstream timed out — OpenCode took longer than {}s to respond",
                        req_id,
                        UPSTREAM_READ_TIMEOUT.as_secs(),
                    ),
                );
            }

            let body = Full::new(Bytes::from(format!("Proxy error: {}", e)));
            return Ok(Response::builder()
                .status(StatusCode::BAD_GATEWAY)
                .header("content-type", "text/plain")
                .body(http_body_util::Either::Left(body))
                .unwrap());
        }
    };

    let ttfb = started.elapsed();

    // Build response with same status and headers
    let status = StatusCode::from_u16(upstream_resp.status().as_u16())
        .unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);

    let content_type = upstream_resp
        .headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("unknown")
        .to_string();

    let content_length = upstream_resp
        .headers()
        .get("content-length")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    let is_chunked = upstream_resp
        .headers()
        .get("transfer-encoding")
        .and_then(|v| v.to_str().ok())
        .map(|v| v.contains("chunked"))
        .unwrap_or(false);

    if kind != "static asset" {
        plog(
            &log_file,
            "INFO",
            &format!(
                "[proxy] #{} <- {} {} (TTFB: {:.0}ms, type: {}, length: {}, chunked: {})",
                req_id,
                status.as_u16(),
                status.canonical_reason().unwrap_or(""),
                ttfb.as_secs_f64() * 1000.0,
                content_type,
                content_length.as_deref().unwrap_or("none"),
                is_chunked,
            ),
        );
    }

    if status.is_server_error() {
        plog(
            &log_file,
            "ERROR",
            &format!(
                "[proxy] #{} Upstream returned server error {} for {} {}",
                req_id,
                status.as_u16(),
                method,
                uri,
            ),
        );
    }

    let mut response_builder = Response::builder().status(status);

    // Copy headers but skip content-length for HTML (we'll modify the body)
    let is_html = content_type.contains("text/html");
    for (name, value) in upstream_resp.headers() {
        if let Ok(v) = value.to_str() {
            // Skip content-length for HTML since we'll inject a script
            if is_html && name == "content-length" {
                continue;
            }
            response_builder = response_builder.header(name.as_str(), v);
        }
    }

    // For HTML responses, buffer the body and inject the fetch-override script.
    // This script overrides window.fetch for POST/PUT/PATCH/DELETE so those
    // requests are relayed via postMessage to the parent Tauri webview, which
    // executes them through Rust's reqwest (bypassing WKWebView timeouts).
    if is_html {
        let html_bytes = match upstream_resp.bytes().await {
            Ok(b) => b,
            Err(e) => {
                plog(
                    &log_file,
                    "ERROR",
                    &format!("[proxy] #{} Failed to read HTML body: {}", req_id, e),
                );
                Bytes::from("Proxy error reading HTML")
            }
        };

        let html = String::from_utf8_lossy(&html_bytes);
        let inject_script = FETCH_OVERRIDE_SCRIPT;

        // Inject after <head> tag (or at the very beginning if no <head>)
        let modified = if let Some(pos) = html.find("<head>") {
            let insert_at = pos + "<head>".len();
            format!(
                "{}<script>{}</script>{}",
                &html[..insert_at],
                inject_script,
                &html[insert_at..]
            )
        } else if let Some(pos) = html.find("<HEAD>") {
            let insert_at = pos + "<HEAD>".len();
            format!(
                "{}<script>{}</script>{}",
                &html[..insert_at],
                inject_script,
                &html[insert_at..]
            )
        } else {
            format!("<script>{}</script>{}", inject_script, html)
        };

        plog(
            &log_file,
            "INFO",
            &format!(
                "[proxy] #{} Injected fetch-override script into HTML ({} -> {} bytes)",
                req_id,
                html_bytes.len(),
                modified.len(),
            ),
        );

        let body = Full::new(Bytes::from(modified));
        return Ok(response_builder
            .body(http_body_util::Either::Left(body))
            .unwrap());
    }

    // Stream the response body through without buffering.
    let is_streaming =
        is_chunked || content_type.contains("event-stream") || content_type.contains("x-component");
    let total_bytes = std::sync::Arc::new(AtomicU64::new(0));
    let chunk_count = std::sync::Arc::new(AtomicU64::new(0));
    let stream_started = Instant::now();

    let tb = total_bytes.clone();
    let cc = chunk_count.clone();
    let lf = log_file.clone();
    let log_req_id = req_id;
    let log_is_streaming = is_streaming;

    let byte_stream = upstream_resp.bytes_stream().map(move |result| {
        match result {
            Ok(chunk) => {
                let size = chunk.len() as u64;
                let prev_total = tb.fetch_add(size, Ordering::Relaxed);
                let n = cc.fetch_add(1, Ordering::Relaxed) + 1;

                // For streaming responses, log periodic progress
                if log_is_streaming && (n == 1 || n % 50 == 0) {
                    plog(
                        &lf,
                        "INFO",
                        &format!(
                            "[proxy] #{} streaming: chunk #{}, +{} bytes, total {} bytes, elapsed {:.1}s",
                            log_req_id,
                            n,
                            size,
                            prev_total + size,
                            stream_started.elapsed().as_secs_f64(),
                        ),
                    );
                }

                Ok(Frame::data(chunk))
            }
            Err(e) => {
                let elapsed = stream_started.elapsed();
                let total = tb.load(Ordering::Relaxed);
                let n = cc.load(Ordering::Relaxed);
                plog(
                    &lf,
                    "ERROR",
                    &format!(
                        "[proxy] #{} STREAM ERROR after {:.1}s ({} chunks, {} bytes): {}",
                        log_req_id,
                        elapsed.as_secs_f64(),
                        n,
                        total,
                        e,
                    ),
                );
                Ok(Frame::data(Bytes::new()))
            }
        }
    });

    // Log when the stream ends
    let tb_final = total_bytes.clone();
    let cc_final = chunk_count.clone();
    let lf_final = log_file.clone();
    let final_started = Instant::now();
    let log_kind = kind;

    let byte_stream = byte_stream.chain(futures_util::stream::once(async move {
        let elapsed = final_started.elapsed();
        let total = tb_final.load(Ordering::Relaxed);
        let n = cc_final.load(Ordering::Relaxed);
        if log_kind != "static asset" || elapsed.as_secs() > 5 {
            plog(
                &lf_final,
                "INFO",
                &format!(
                    "[proxy] #{} COMPLETE: {} chunks, {} bytes, {:.1}s total",
                    log_req_id, n, total, elapsed.as_secs_f64(),
                ),
            );
        }
        Ok(Frame::data(Bytes::new()))
    }));

    let stream_body = StreamBody::new(byte_stream);

    Ok(response_builder
        .body(http_body_util::Either::Right(stream_body))
        .unwrap())
}
