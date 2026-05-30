use std::process::{Command, Stdio};
use std::io::Read;
use tauri::{AppHandle, Emitter, Manager};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn start_audio_capture(app: AppHandle) -> Result<(), String> {
    let resource_path = app
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join("swift-audio");

    // dev mode fallback
    let swift_bin = if resource_path.exists() {
        resource_path
    } else {
        std::env::current_dir()
            .unwrap()
            .join("src-tauri/swift-audio")
    };

    let mut child = Command::new(&swift_bin)
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("Failed to spawn: {} at {:?}", e, swift_bin))?;

    let mut stdout = child.stdout.take().unwrap();

    tauri::async_runtime::spawn(async move {
        let mut buf = vec![0u8; 4096];
        loop {
            match stdout.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => {
                    let encoded = base64_encode(&buf[..n]);
                    let _ = app.emit("audio-chunk", encoded);
                }
                Err(_) => break,
            }
        }
    });

    Ok(())
}

fn base64_encode(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::new();
    for chunk in data.chunks(3) {
        let b0 = chunk[0] as usize;
        let b1 = if chunk.len() > 1 { chunk[1] as usize } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as usize } else { 0 };
        out.push(CHARS[(b0 >> 2)] as char);
        out.push(CHARS[((b0 & 3) << 4) | (b1 >> 4)] as char);
        out.push(if chunk.len() > 1 { CHARS[((b1 & 0xf) << 2) | (b2 >> 6)] as char } else { '=' });
        out.push(if chunk.len() > 2 { CHARS[b2 & 0x3f] as char } else { '=' });
    }
    out
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, start_audio_capture])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
