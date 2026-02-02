use chrono::Local;
use sentry::IntoDsn;
use serde::Deserialize;
use std::fs::{self, File, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};

const SENTRY_DSN: &str = "https://3a30fa628bbd0e5f55d9d25f394076c0@o4506593499873280.ingest.us.sentry.io/4510817219444736";

/// Configuration loaded from ~/Library/Application Support/Langston Studio/config.json
#[derive(Debug, Deserialize, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    #[serde(default)]
    pub anthropic_api_key: Option<String>,
    #[serde(default)]
    pub openai_api_key: Option<String>,
}

fn get_config_dir() -> PathBuf {
    let home = dirs::home_dir().expect("Could not find home directory");
    home.join("Library/Application Support/Langston Studio")
}

fn get_config_path() -> PathBuf {
    get_config_dir().join("config.json")
}

fn load_config() -> AppConfig {
    let config_path = get_config_path();

    if !config_path.exists() {
        return AppConfig::default();
    }

    match fs::read_to_string(&config_path) {
        Ok(contents) => match serde_json::from_str(&contents) {
            Ok(config) => config,
            Err(_) => AppConfig::default(),
        },
        Err(_) => AppConfig::default(),
    }
}

struct AppState {
    opencode: Option<Child>,
    remotion: Option<Child>,
    log_file_path: PathBuf,
}

impl Drop for AppState {
    fn drop(&mut self) {
        if let Some(ref mut child) = self.opencode {
            let _ = child.kill();
        }
        if let Some(ref mut child) = self.remotion {
            let _ = child.kill();
        }
    }
}

fn get_logs_dir() -> PathBuf {
    let home = dirs::home_dir().expect("Could not find home directory");
    home.join("Library/Logs/Langston Studio")
}

fn get_username() -> String {
    std::env::var("USER")
        .or_else(|_| std::env::var("USERNAME"))
        .unwrap_or_else(|_| "unknown".to_string())
}

fn get_path_env() -> String {
    let home = dirs::home_dir().unwrap_or_default();
    let home_str = home.to_string_lossy();

    let paths = vec![
        format!("{}/.local/bin", home_str),
        format!("{}/.bun/bin", home_str),
        format!("{}/.nvm/versions/node/v22.14.0/bin", home_str),
        format!("{}/.nvm/versions/node/v20.18.0/bin", home_str),
        format!("{}/.nvm/versions/node/v18.20.0/bin", home_str),
        "/opt/homebrew/bin".to_string(),
        "/usr/local/bin".to_string(),
        "/usr/bin".to_string(),
        "/bin".to_string(),
        "/usr/sbin".to_string(),
        "/sbin".to_string(),
    ];

    paths.join(":")
}

fn create_log_file() -> (PathBuf, File) {
    let logs_dir = get_logs_dir();
    fs::create_dir_all(&logs_dir).expect("Failed to create logs directory");

    let timestamp = Local::now().format("%Y-%m-%d_%H-%M-%S");
    let username = get_username();
    let filename = format!("langston-studio_{}_{}.log", timestamp, username);
    let log_path = logs_dir.join(&filename);

    let file = OpenOptions::new()
        .create(true)
        .write(true)
        .append(true)
        .open(&log_path)
        .expect("Failed to create log file");

    (log_path, file)
}

fn write_log(state: &Mutex<AppState>, level: &str, message: &str) {
    let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S%.3f");
    let line = format!("[{}] [{}] {}\n", timestamp, level, message);

    if let Ok(guard) = state.lock() {
        if let Ok(mut file) = OpenOptions::new().append(true).open(&guard.log_file_path) {
            let _ = file.write_all(line.as_bytes());
        }
    }

    match level {
        "ERROR" => log::error!("{}", message),
        "WARN" => log::warn!("{}", message),
        _ => log::info!("{}", message),
    }
}

fn get_workspace_dir() -> PathBuf {
    let home = dirs::home_dir().expect("Could not find home directory");
    home.join("Documents/code/langston-videos")
}

const OPENCODE_PORT: u16 = 7501;
const REMOTION_PORT: u16 = 7500;

fn check_port_available(port: u16) -> bool {
    let output = Command::new("lsof")
        .args(["-i", &format!(":{}", port)])
        .output();

    match output {
        Ok(out) => out.stdout.is_empty(),
        Err(_) => true,
    }
}

fn kill_port(port: u16) {
    let _ = Command::new("sh")
        .args([
            "-c",
            &format!("lsof -ti:{} 2>/dev/null | xargs kill -9 2>/dev/null", port),
        ])
        .status();
}

fn git_auto_save(app: &AppHandle, workspace: &PathBuf, path_env: &str, message: &str) {
    let status_output = Command::new("git")
        .args(["status", "--porcelain"])
        .current_dir(workspace)
        .env("PATH", path_env)
        .output();

    let has_changes = match status_output {
        Ok(output) => !output.stdout.is_empty(),
        Err(_) => false,
    };

    if !has_changes {
        if let Some(state) = app.try_state::<Mutex<AppState>>() {
            write_log(&state, "INFO", "No changes to auto-save");
        }
        return;
    }

    if let Some(state) = app.try_state::<Mutex<AppState>>() {
        write_log(&state, "INFO", &format!("Auto-saving changes: {}", message));
    }

    let _ = Command::new("git")
        .args(["add", "-A"])
        .current_dir(workspace)
        .env("PATH", path_env)
        .status();

    let _ = Command::new("git")
        .args(["commit", "-m", message])
        .current_dir(workspace)
        .env("PATH", path_env)
        .env("GIT_AUTHOR_NAME", "Langston Studio")
        .env("GIT_AUTHOR_EMAIL", "studio@langston.co")
        .env("GIT_COMMITTER_NAME", "Langston Studio")
        .env("GIT_COMMITTER_EMAIL", "studio@langston.co")
        .status();
}

fn emit_status(app: &AppHandle, status: &str, progress: u8) {
    if let Some(state) = app.try_state::<Mutex<AppState>>() {
        write_log(
            &state,
            "INFO",
            &format!("Status: {} ({}%)", status, progress),
        );
    }

    let _ = app.emit(
        "setup-status",
        serde_json::json!({
            "status": status,
            "progress": progress
        }),
    );
}

fn setup_workspace(app: &AppHandle) -> Result<(), String> {
    let workspace = get_workspace_dir();
    let path_env = get_path_env();

    if let Some(state) = app.try_state::<Mutex<AppState>>() {
        write_log(
            &state,
            "INFO",
            &format!("Checking workspace at {:?}", workspace),
        );
        write_log(&state, "INFO", &format!("Using PATH: {}", path_env));
    }

    let resource_path = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {}", e))?
        .join("workspace-template");

    if workspace.join("package.json").exists() {
        if let Some(state) = app.try_state::<Mutex<AppState>>() {
            write_log(&state, "INFO", "Workspace already exists");
        }

        emit_status(app, "Cleaning up old processes...", 20);
        kill_port(OPENCODE_PORT);
        kill_port(REMOTION_PORT);

        emit_status(app, "Saving progress...", 40);
        git_auto_save(app, &workspace, &path_env, "Auto-save on session start");

        emit_status(app, "Updating config...", 60);
        let config_src = resource_path.join("opencode.jsonc");
        let config_dst = workspace.join("opencode.jsonc");
        if config_src.exists() {
            fs::copy(&config_src, &config_dst)
                .map_err(|e| format!("Failed to update opencode.jsonc: {}", e))?;
            if let Some(state) = app.try_state::<Mutex<AppState>>() {
                write_log(&state, "INFO", "Updated opencode.jsonc from template");
            }
        }

        let remotion_config_src = resource_path.join("remotion.config.ts");
        let remotion_config_dst = workspace.join("remotion.config.ts");
        if remotion_config_src.exists() {
            fs::copy(&remotion_config_src, &remotion_config_dst)
                .map_err(|e| format!("Failed to update remotion.config.ts: {}", e))?;
            if let Some(state) = app.try_state::<Mutex<AppState>>() {
                write_log(&state, "INFO", "Updated remotion.config.ts from template");
            }
        }

        git_auto_save(app, &workspace, &path_env, "Update app config");

        emit_status(app, "Workspace ready", 100);
        return Ok(());
    }

    emit_status(app, "Setting up workspace...", 10);

    if !resource_path.exists() {
        let err = format!("Workspace template not found at {:?}", resource_path);
        if let Some(state) = app.try_state::<Mutex<AppState>>() {
            write_log(&state, "ERROR", &err);
        }
        return Err(err);
    }

    emit_status(app, "Creating workspace directory...", 20);

    if let Some(parent) = workspace.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directory: {}", e))?;
    }

    emit_status(app, "Copying workspace template...", 30);

    copy_dir_recursive(&resource_path, &workspace)
        .map_err(|e| format!("Failed to copy workspace: {}", e))?;

    emit_status(
        app,
        "Installing dependencies (this may take a minute)...",
        50,
    );

    if let Some(state) = app.try_state::<Mutex<AppState>>() {
        write_log(&state, "INFO", "Running npm install...");
    }

    let npm_output = Command::new("npm")
        .args(["install"])
        .current_dir(&workspace)
        .env("PATH", &path_env)
        .env("npm_config_progress", "false")
        .output()
        .map_err(|e| format!("Failed to run npm install: {}", e))?;

    if let Some(state) = app.try_state::<Mutex<AppState>>() {
        if !npm_output.stdout.is_empty() {
            write_log(
                &state,
                "INFO",
                &format!(
                    "npm stdout: {}",
                    String::from_utf8_lossy(&npm_output.stdout)
                ),
            );
        }
        if !npm_output.stderr.is_empty() {
            write_log(
                &state,
                "WARN",
                &format!(
                    "npm stderr: {}",
                    String::from_utf8_lossy(&npm_output.stderr)
                ),
            );
        }
    }

    if !npm_output.status.success() {
        let err = "npm install failed".to_string();
        if let Some(state) = app.try_state::<Mutex<AppState>>() {
            write_log(&state, "ERROR", &err);
        }
        return Err(err);
    }

    emit_status(app, "Initializing version control...", 90);

    let _ = Command::new("git")
        .args(["init"])
        .current_dir(&workspace)
        .env("PATH", &path_env)
        .status();

    let _ = Command::new("git")
        .args(["add", "-A"])
        .current_dir(&workspace)
        .env("PATH", &path_env)
        .status();

    let _ = Command::new("git")
        .args(["commit", "-m", "Initial workspace setup"])
        .current_dir(&workspace)
        .env("PATH", &path_env)
        .env("GIT_AUTHOR_NAME", "Langston Studio")
        .env("GIT_AUTHOR_EMAIL", "studio@langston.co")
        .env("GIT_COMMITTER_NAME", "Langston Studio")
        .env("GIT_COMMITTER_EMAIL", "studio@langston.co")
        .status();

    emit_status(app, "Setup complete!", 100);

    Ok(())
}

fn copy_dir_recursive(src: &PathBuf, dst: &PathBuf) -> std::io::Result<()> {
    fs::create_dir_all(dst)?;

    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let file_type = entry.file_type()?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if file_type.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }

    Ok(())
}

fn spawn_opencode(
    app: &AppHandle,
    workspace: &PathBuf,
    config: &AppConfig,
) -> Result<Child, String> {
    if let Some(state) = app.try_state::<Mutex<AppState>>() {
        write_log(
            &state,
            "INFO",
            &format!(
                "Starting OpenCode server at {:?} on port {}",
                workspace, OPENCODE_PORT
            ),
        );

        let has_anthropic = config.anthropic_api_key.is_some();
        let has_openai = config.openai_api_key.is_some();
        write_log(
            &state,
            "INFO",
            &format!(
                "API keys configured - Anthropic: {}, OpenAI: {}",
                has_anthropic, has_openai
            ),
        );
    }

    if !check_port_available(OPENCODE_PORT) {
        if let Some(state) = app.try_state::<Mutex<AppState>>() {
            write_log(
                &state,
                "INFO",
                &format!("Port {} in use, cleaning up...", OPENCODE_PORT),
            );
        }
        kill_port(OPENCODE_PORT);
        std::thread::sleep(std::time::Duration::from_millis(500));
    }

    let path_env = get_path_env();

    let mut cmd = Command::new("opencode");
    cmd.args(["serve", "--port", &OPENCODE_PORT.to_string()])
        .current_dir(workspace)
        .env("PATH", &path_env)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    if let Some(ref key) = config.anthropic_api_key {
        cmd.env("ANTHROPIC_API_KEY", key);
    }
    if let Some(ref key) = config.openai_api_key {
        cmd.env("OPENAI_API_KEY", key);
    }

    match cmd.spawn() {
        Ok(child) => {
            if let Some(state) = app.try_state::<Mutex<AppState>>() {
                write_log(
                    &state,
                    "INFO",
                    &format!("OpenCode started with PID: {}", child.id()),
                );
            }
            Ok(child)
        }
        Err(e) => {
            let err = format!("Failed to start OpenCode: {}", e);
            if let Some(state) = app.try_state::<Mutex<AppState>>() {
                write_log(&state, "ERROR", &err);
            }
            Err(err)
        }
    }
}

fn spawn_remotion(app: &AppHandle, workspace: &PathBuf) -> Result<Child, String> {
    if let Some(state) = app.try_state::<Mutex<AppState>>() {
        write_log(
            &state,
            "INFO",
            &format!(
                "Starting Remotion dev server at {:?} on port {}",
                workspace, REMOTION_PORT
            ),
        );
    }

    if !check_port_available(REMOTION_PORT) {
        if let Some(state) = app.try_state::<Mutex<AppState>>() {
            write_log(
                &state,
                "INFO",
                &format!("Port {} in use, cleaning up...", REMOTION_PORT),
            );
        }
        kill_port(REMOTION_PORT);
        std::thread::sleep(std::time::Duration::from_millis(500));
    }

    let path_env = get_path_env();

    match Command::new("npm")
        .args(["run", "dev"])
        .current_dir(workspace)
        .env("PATH", &path_env)
        .env("BROWSER", "none")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
    {
        Ok(child) => {
            if let Some(state) = app.try_state::<Mutex<AppState>>() {
                write_log(
                    &state,
                    "INFO",
                    &format!("Remotion started with PID: {}", child.id()),
                );
            }
            Ok(child)
        }
        Err(e) => {
            let err = format!("Failed to start Remotion: {}", e);
            if let Some(state) = app.try_state::<Mutex<AppState>>() {
                write_log(&state, "ERROR", &err);
            }
            Err(err)
        }
    }
}

#[tauri::command]
fn get_version(app: AppHandle) -> String {
    app.package_info().version.to_string()
}

#[tauri::command]
fn get_logs(state: tauri::State<'_, Mutex<AppState>>) -> Result<String, String> {
    let guard = state.lock().map_err(|e| e.to_string())?;
    fs::read_to_string(&guard.log_file_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_log_file_path(state: tauri::State<'_, Mutex<AppState>>) -> Result<String, String> {
    let guard = state.lock().map_err(|e| e.to_string())?;
    Ok(guard.log_file_path.to_string_lossy().to_string())
}

#[tauri::command]
fn open_logs_folder() -> Result<(), String> {
    let logs_dir = get_logs_dir();
    Command::new("open")
        .arg(&logs_dir)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_config_status() -> serde_json::Value {
    let config = load_config();
    let config_path = get_config_path();

    serde_json::json!({
        "configPath": config_path.to_string_lossy(),
        "configExists": config_path.exists(),
        "hasAnthropicKey": config.anthropic_api_key.is_some(),
        "hasOpenaiKey": config.openai_api_key.is_some(),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let version = env!("CARGO_PKG_VERSION");
    let username = get_username();

    let _sentry_guard = sentry::init((
        SENTRY_DSN.into_dsn().expect("Invalid Sentry DSN"),
        sentry::ClientOptions {
            release: Some(format!("langston-studio@{}", version).into()),
            environment: Some("production".into()),
            ..Default::default()
        },
    ));

    sentry::configure_scope(|scope| {
        scope.set_user(Some(sentry::User {
            username: Some(username.clone()),
            ..Default::default()
        }));
        scope.set_tag("platform", "macos");
    });

    let (log_file_path, mut log_file) = create_log_file();

    let startup_msg = format!(
        "=== Langston Studio Started ===\nTime: {}\nUser: {}\nVersion: {}\nLog file: {:?}\n",
        Local::now().format("%Y-%m-%d %H:%M:%S"),
        username,
        version,
        log_file_path
    );
    let _ = log_file.write_all(startup_msg.as_bytes());

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_version,
            get_logs,
            get_log_file_path,
            open_logs_folder,
            get_config_status
        ])
        .setup(move |app| {
            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .level(log::LevelFilter::Info)
                    .build(),
            )?;

            app.manage(Mutex::new(AppState {
                opencode: None,
                remotion: None,
                log_file_path: log_file_path.clone(),
            }));

            let app_handle = app.handle().clone();

            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(1500));

                if let Some(state) = app_handle.try_state::<Mutex<AppState>>() {
                    write_log(&state, "INFO", "Starting workspace setup...");
                }

                let config = load_config();
                let config_path = get_config_path();

                if let Some(state) = app_handle.try_state::<Mutex<AppState>>() {
                    write_log(&state, "INFO", &format!("Config path: {:?}", config_path));
                    write_log(
                        &state,
                        "INFO",
                        &format!("Config exists: {}", config_path.exists()),
                    );
                    write_log(
                        &state,
                        "INFO",
                        &format!(
                            "Anthropic key configured: {}",
                            config.anthropic_api_key.is_some()
                        ),
                    );
                    write_log(
                        &state,
                        "INFO",
                        &format!("OpenAI key configured: {}", config.openai_api_key.is_some()),
                    );
                }

                match setup_workspace(&app_handle) {
                    Ok(_) => {
                        if let Some(state) = app_handle.try_state::<Mutex<AppState>>() {
                            write_log(&state, "INFO", "Workspace setup complete");
                        }

                        let workspace = get_workspace_dir();

                        let opencode_result = spawn_opencode(&app_handle, &workspace, &config);
                        let remotion_result = spawn_remotion(&app_handle, &workspace);

                        match (&opencode_result, &remotion_result) {
                            (Ok(_), Ok(_)) => {
                                let _ = app_handle.emit("setup-complete", ());
                            }
                            (Err(e), _) | (_, Err(e)) => {
                                sentry::capture_message(e, sentry::Level::Error);
                                let _ = app_handle.emit("setup-error", e.clone());
                                return;
                            }
                        }

                        if let Some(state) = app_handle.try_state::<Mutex<AppState>>() {
                            let mut guard = state.lock().unwrap();
                            guard.opencode = opencode_result.ok();
                            guard.remotion = remotion_result.ok();
                        }
                    }
                    Err(e) => {
                        if let Some(state) = app_handle.try_state::<Mutex<AppState>>() {
                            write_log(&state, "ERROR", &format!("Workspace setup failed: {}", e));
                        }
                        sentry::capture_message(
                            &format!("Workspace setup failed: {}", e),
                            sentry::Level::Error,
                        );
                        let _ = app_handle.emit("setup-error", e);
                    }
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                if let Some(state) = window.app_handle().try_state::<Mutex<AppState>>() {
                    write_log(&state, "INFO", "Window closing, cleaning up processes...");
                    let mut guard = state.lock().unwrap();

                    if let Some(ref mut child) = guard.opencode {
                        write_log(&state, "INFO", &format!("Killing OpenCode (PID: {})", child.id()));
                        let _ = child.kill();
                    }
                    if let Some(ref mut child) = guard.remotion {
                        write_log(&state, "INFO", &format!("Killing Remotion (PID: {})", child.id()));
                        let _ = child.kill();
                    }
                    
                    write_log(&state, "INFO", &format!("Cleaning up ports {}, {}...", REMOTION_PORT, OPENCODE_PORT));
                    
                    // Spawn cleanup without blocking - use spawn() not status()
                    let _ = Command::new("sh")
                        .args(["-c", &format!("sleep 0.5 && lsof -ti:{},{} 2>/dev/null | xargs kill -9 2>/dev/null", OPENCODE_PORT, REMOTION_PORT)])
                        .spawn();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
