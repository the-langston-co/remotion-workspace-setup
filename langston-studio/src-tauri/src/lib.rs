use std::fs;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};

struct ServerProcesses {
    opencode: Option<Child>,
    remotion: Option<Child>,
}

impl Drop for ServerProcesses {
    fn drop(&mut self) {
        if let Some(ref mut child) = self.opencode {
            let _ = child.kill();
        }
        if let Some(ref mut child) = self.remotion {
            let _ = child.kill();
        }
    }
}

fn get_workspace_dir() -> PathBuf {
    let home = dirs::home_dir().expect("Could not find home directory");
    home.join("Documents/code/langston-videos")
}

fn emit_status(app: &AppHandle, status: &str, progress: u8) {
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

    if workspace.join("package.json").exists() {
        log::info!("Workspace already exists at {:?}", workspace);
        emit_status(app, "Workspace found", 100);
        return Ok(());
    }

    emit_status(app, "Setting up workspace...", 10);

    let resource_path = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {}", e))?
        .join("workspace-template");

    if !resource_path.exists() {
        return Err(format!(
            "Workspace template not found at {:?}",
            resource_path
        ));
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

    let npm_status = Command::new("npm")
        .args(["install"])
        .current_dir(&workspace)
        .env("npm_config_progress", "false")
        .status()
        .map_err(|e| format!("Failed to run npm install: {}", e))?;

    if !npm_status.success() {
        return Err("npm install failed".to_string());
    }

    emit_status(app, "Initializing version control...", 90);

    let _ = Command::new("git")
        .args(["init"])
        .current_dir(&workspace)
        .status();

    let _ = Command::new("git")
        .args(["add", "-A"])
        .current_dir(&workspace)
        .status();

    let _ = Command::new("git")
        .args(["commit", "-m", "Initial workspace setup"])
        .current_dir(&workspace)
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

fn spawn_opencode(workspace: &PathBuf) -> Option<Child> {
    log::info!("Starting OpenCode server at {:?}", workspace);

    Command::new("opencode")
        .args(["serve", "--port", "3001"])
        .current_dir(workspace)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| log::error!("Failed to start OpenCode: {}", e))
        .ok()
}

fn spawn_remotion(workspace: &PathBuf) -> Option<Child> {
    log::info!("Starting Remotion dev server at {:?}", workspace);

    Command::new("npm")
        .args(["run", "dev"])
        .current_dir(workspace)
        .env("BROWSER", "none")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| log::error!("Failed to start Remotion: {}", e))
        .ok()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .level(log::LevelFilter::Info)
                    .build(),
            )?;

            app.manage(Mutex::new(ServerProcesses {
                opencode: None,
                remotion: None,
            }));

            let app_handle = app.handle().clone();

            std::thread::spawn(move || {
                // Wait for webview to initialize and register event listeners
                std::thread::sleep(std::time::Duration::from_millis(500));

                match setup_workspace(&app_handle) {
                    Ok(_) => {
                        log::info!("Workspace setup complete");
                        let _ = app_handle.emit("setup-complete", ());

                        let workspace = get_workspace_dir();
                        let opencode_process = spawn_opencode(&workspace);
                        let remotion_process = spawn_remotion(&workspace);

                        if let Some(state) = app_handle.try_state::<Mutex<ServerProcesses>>() {
                            let mut guard = state.lock().unwrap();
                            guard.opencode = opencode_process;
                            guard.remotion = remotion_process;
                        }
                    }
                    Err(e) => {
                        log::error!("Workspace setup failed: {}", e);
                        let _ = app_handle.emit("setup-error", e);
                    }
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                log::info!("Window closing, cleaning up processes...");
                if let Some(processes) = window.app_handle().try_state::<Mutex<ServerProcesses>>() {
                    let mut guard = processes.lock().unwrap();
                    if let Some(ref mut child) = guard.opencode {
                        let _ = child.kill();
                    }
                    if let Some(ref mut child) = guard.remotion {
                        let _ = child.kill();
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
