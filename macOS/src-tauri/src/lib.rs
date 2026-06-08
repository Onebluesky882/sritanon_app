mod vad;

use std::process::{Command, Stdio};
use std::io::{BufRead, BufReader, Read};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, State};
use serde::Serialize;

#[derive(Serialize, Clone)]
struct SpeechChunk {
    duration_ms: u32,
    pcm_base64: String,
    is_partial: bool,
}

#[derive(Serialize, Clone)]
struct AppEvent {
    kind: String,
    message: String,
}

struct AudioState {
    child_pid: Mutex<Option<u32>>,
}

impl AudioState {
    fn kill(&self) {
        let pid = self.child_pid.lock().unwrap().take();
        if let Some(pid) = pid {
            Command::new("kill").args(["-TERM", &pid.to_string()]).spawn().ok();
            eprintln!("🛑 Killed PID: {}", pid);
        }
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

#[tauri::command]
async fn check_permission() -> bool {
    let cwd = std::env::current_dir().unwrap();
    let swift_project = vec![
        cwd.join("../swift-audio"),
        cwd.parent().unwrap().join("swift-audio"),
    ].into_iter().find(|p| p.join("Package.swift").exists());

    let project = match swift_project {
        Some(p) => p,
        None => return false,
    };

    let mut child = match Command::new("swift")
        .args(["run"])
        .current_dir(&project)
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .spawn()
    {
        Ok(c) => c,
        Err(_) => return false,
    };

    let stderr = child.stderr.take().unwrap();
    let reader = BufReader::new(stderr);
    let mut result = false;

    for line in reader.lines() {
        if let Ok(line) = line {
            if line.contains("Audio capture started") { result = true; break; }
            if line.contains("PERMISSION_DENIED") || line.contains("denied") { break; }
        }
    }

    child.kill().ok();
    result
}

#[tauri::command]
async fn open_privacy_settings() {
    Command::new("open")
        .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture")
        .spawn().ok();
}

#[tauri::command]
async fn stop_audio_capture(state: State<'_, AudioState>) -> Result<(), String> {
    state.kill();
    Ok(())
}

#[tauri::command]
async fn clean_build_cache() -> Result<String, String> {
    let cwd = std::env::current_dir().map_err(|e| e.to_string())?;

    let output = Command::new("cargo")
        .arg("clean")
        .current_dir(&cwd)
        .output()
        .map_err(|e| format!("cargo clean failed: {}", e))?;

    let log = String::from_utf8_lossy(&output.stderr).trim().to_string();

    if output.status.success() {
        Ok(if log.is_empty() { "Build cache cleaned".to_string() } else { log })
    } else {
        Err(if log.is_empty() { "cargo clean failed".to_string() } else { log })
    }
}

#[tauri::command]
async fn start_audio_capture(app: AppHandle, state: State<'_, AudioState>) -> Result<String, String> {
    state.kill();

    let cwd = std::env::current_dir().unwrap();
    let swift_project = vec![
        cwd.join("../swift-audio"),
        cwd.parent().unwrap().join("swift-audio"),
    ].into_iter().find(|p| p.join("Package.swift").exists());

    let mut child = if let Some(project) = swift_project {
        eprintln!("✅ Using swift run at: {:?}", project);
        Command::new("swift")
            .args(["run"])
            .current_dir(&project)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("swift run failed: {}", e))?
    } else {
        return Err("swift-audio project not found".to_string());
    };

    *state.child_pid.lock().unwrap() = Some(child.id());
    eprintln!("✅ Swift PID: {}", child.id());

    let mut stdout = child.stdout.take().unwrap();
    let stderr_pipe = child.stderr.take().unwrap();

    let app_clone = app.clone();
    tauri::async_runtime::spawn(async move {
        let reader = BufReader::new(stderr_pipe);
        for line in reader.lines() {
            if let Ok(line) = line {
                eprintln!("🎤 Swift: {}", line);
                if line.contains("PERMISSION_DENIED") {
                    let _ = app_clone.emit("app-event", AppEvent {
                        kind: "permission_denied".to_string(),
                        message: "Screen Recording permission denied".to_string(),
                    });
                } else if line.contains("Audio capture started") {
                    let _ = app_clone.emit("app-event", AppEvent {
                        kind: "capture_started".to_string(),
                        message: "Audio capture started".to_string(),
                    });
                }
            }
        }
    });

    tauri::async_runtime::spawn(async move {
        let mut buf = vec![0u8; 4096];
        let mut vad = vad::Vad::new();
        let mut count = 0u32;
        let mut log_counter = 0u32;

        loop {
            match stdout.read(&mut buf) {
                Ok(0) => { eprintln!("⚠️ stdout closed"); break; }
                Ok(n) => {
                    log_counter += 1;
                    if log_counter % 50 == 0 {
                        let samples: Vec<f32> = buf[..n].chunks_exact(4)
                            .map(|b| f32::from_le_bytes([b[0], b[1], b[2], b[3]]))
                            .collect();
                        let rms = vad::compute_rms(&samples);
                        eprintln!("📊 RMS={:.4} speaking={}", rms, vad.is_speaking);
                    }

                    let (final_chunk, partial_chunk) = vad.process_with_partial(&buf[..n]);

                    if let Some(p) = partial_chunk {
                        let ms = (p.len() as f32 / 16000.0 * 1000.0) as u32;
                        let bytes: Vec<u8> = p.iter().flat_map(|f| f.to_le_bytes()).collect();
                        let _ = app.emit("speech-chunk", SpeechChunk {
                            duration_ms: ms,
                            pcm_base64: base64_encode(&bytes),
                            is_partial: true,
                        });
                    }

                    if let Some(f) = final_chunk {
                        let ms = (f.len() as f32 / 16000.0 * 1000.0) as u32;
                        count += 1;
                        eprintln!("🎤 Final #{} {}ms", count, ms);
                        let bytes: Vec<u8> = f.iter().flat_map(|f| f.to_le_bytes()).collect();
                        let _ = app.emit("speech-chunk", SpeechChunk {
                            duration_ms: ms,
                            pcm_base64: base64_encode(&bytes),
                            is_partial: false,
                        });
                    }
                }
                Err(e) => { eprintln!("❌ read error: {}", e); break; }
            }
        }
    });

    Ok("started".to_string())
}

fn base64_encode(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::new();
    for chunk in data.chunks(3) {
        let b0 = chunk[0] as usize;
        let b1 = if chunk.len() > 1 { chunk[1] as usize } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as usize } else { 0 };
        out.push(CHARS[b0 >> 2] as char);
        out.push(CHARS[((b0 & 3) << 4) | (b1 >> 4)] as char);
        out.push(if chunk.len() > 1 { CHARS[((b1 & 0xf) << 2) | (b2 >> 6)] as char } else { '=' });
        out.push(if chunk.len() > 2 { CHARS[b2 & 0x3f] as char } else { '=' });
    }
    out
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AudioState { child_pid: Mutex::new(None) })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            start_audio_capture,
            stop_audio_capture,
            check_permission,
            open_privacy_settings,
            clean_build_cache,
        ])
        // ← kill Swift เมื่อ window ปิด
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                if let Some(state) = window.try_state::<AudioState>() {
                    state.kill();
                    eprintln!("🛑 App closed — Swift process killed");
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
