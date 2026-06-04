# Sritanon — Real-time Interview Assistant

> Capture system audio → transcribe with Whisper → assist interview answers in real-time

---

## What It Does

Sritanon listens to your interview in real-time, transcribes what's being said, and helps you craft better answers — bridging the gap between how you think (implementation-first) and how interviewers evaluate (fundamentals-first).

```
System Audio (speaker/mic)
        ↓
Swift Helper (ScreenCaptureKit)
        ↓ stdout PCM bytes
Rust / Tauri (VAD + buffering)
        ↓ audio chunks
Groq Whisper API (~300ms latency)
        ↓ transcribed text
React Frontend (answer suggestions)
```

---

## Tech Stack

| Layer           | Technology                            |
| --------------- | ------------------------------------- |
| Desktop App     | Tauri 2 (Rust + React)                |
| Audio Capture   | Swift + ScreenCaptureKit              |
| Speech-to-Text  | Groq Whisper large-v3                 |
| Voice Detection | VAD in Rust                           |
| Frontend        | React 19 + Tailwind CSS 4 + shadcn/ui |

---

## Requirements

- macOS 13.0+ (Ventura or later)
- Xcode Command Line Tools
- Node.js 18+
- pnpm
- Rust (latest stable)
- Swift 5.9+
- Groq API Key → https://console.groq.com

---

## Project Structure

```
sritanon_app/
├── src/                        # React frontend
│   ├── pages/
│   │   ├── homepage/           # Main capture UI
│   │   ├── setting/            # API key settings
│   │   └── profile.tsx/
│   ├── stores/
│   │   └── speech-store.ts     # Zustand audio state
│   └── services/
│       └── whisper.service.ts  # Groq API integration
├── src-tauri/                  # Rust backend
│   ├── src/
│   │   └── lib.rs              # Audio capture commands
│   ├── swift-audio-aarch64-apple-darwin   # Swift binary (bundled)
│   └── tauri.conf.json
└── swift-audio/                # Swift audio helper
    └── Sources/swift-audio/
        └── swift_audio.swift   # ScreenCaptureKit capture
```

---

## Setup — Step by Step

### Step 1: Clone & Install

```bash
git clone <repo>
cd sritanon_app
pnpm install
```

### Step 2: Build Swift Audio Helper

```bash
cd swift-audio
swift build -c release
cp .build/release/swift-audio ../src-tauri/swift-audio-aarch64-apple-darwin
cd ..
```

### Step 3: Set Groq API Key

```bash
export GROQ_API_KEY="your_key_here"
```

Or add to `.env` at project root:

```
GROQ_API_KEY=your_key_here
```

### Step 4: Grant Screen Recording Permission

macOS requires manual approval — this cannot be automated.

```
System Settings → Privacy & Security → Screen Recording → Enable Sritanon
```

Or reset and re-approve:

```bash
tccutil reset ScreenCapture
```

### Step 5: Run in Dev Mode

```bash
pnpm tauri dev
```

### Step 6: Build for Production

```bash
pnpm tauri build
```

---

## How Audio Capture Works

### Swift Side

- Uses `ScreenCaptureKit` to capture system audio (speaker output)
- Outputs raw PCM: `f32le`, 16kHz, mono — exactly what Whisper needs
- Writes to stdout as binary stream

### Rust Side

- Spawns Swift binary as child process
- Reads stdout in 4096-byte chunks
- Base64 encodes and emits to frontend via Tauri events (`audio-chunk`)

### Frontend Side

- Listens to `audio-chunk` events
- Accumulates buffer
- Sends to Groq Whisper API when speech pause detected (VAD)

---

## macOS Permission Notes

| Permission       | Why Needed                                    | How to Grant                                            |
| ---------------- | --------------------------------------------- | ------------------------------------------------------- |
| Screen Recording | Required by ScreenCaptureKit to capture audio | System Settings → Privacy & Security → Screen Recording |

> **Note:** Every machine needs to approve this manually. The app will open System Settings automatically if permission is missing.

---

## Architecture Decisions

### Why Swift instead of Rust for audio?

Rust has no stable macOS system audio API. Swift has first-class access to `ScreenCaptureKit` and `AVFoundation` with full Apple documentation and community support.

### Why Groq instead of local Whisper?

- Local `whisper-rs` latency: ~3-5s per chunk
- Groq Whisper latency: ~300ms per chunk
- For real-time interview assistance, 300ms is the difference between helpful and useless

### Why f32le 16kHz mono?

Whisper was trained on this format. Converting at capture time (in Swift) avoids resampling overhead later.

---

## Development Notes

### Test Audio Capture (standalone)

```bash
cd swift-audio
swift run > /tmp/audio.raw &
sleep 5
kill %1
ffplay -f f32le -ar 16000 -ch_layout mono /tmp/audio.raw
```

### Test Tauri Command (in app devtools)

```javascript
const { invoke } = window.__TAURI__.core;
await invoke("start_audio_capture");
```

### Verify Groq API

```bash
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY" | python3 -m json.tool | grep whisper
```

Expected: `"id": "whisper-large-v3"`

---

## Roadmap

- [x] Swift system audio capture
- [x] Rust spawn Swift + stream to frontend
- [x] VAD (Voice Activity Detection) in Rust
- [x] Groq Whisper API integration
- [ ] Interview answer suggestions (groq API)
      หลังจากได้รับข้อความ แปลงจากเสียง - จัดเก็บ array transcript - ai วิเคราะห์ คำถาม และสร้างคำตอบ พร้อม feedback - มีระบบ manual ด้วยและ auto - manual: ใช้ button ให้ user เลือก - auto: ใช้ ai วิเคราะห์และสร้างคำตอบ
       SpeechChunk[]  (rolling buffer 30 วิ)
          ↓
          render text to box preview  if client want Analyze คำถามชุดนี้ กดคลิก กล่องข้อความ 

        ตัวอย่าง 
                detect ข้อความจากเสียง 10-30 วิ หรือ เสียงหายเป็นเวลา 2 วินาที 

                ผู้ใช้งาน อ่านแล้ว ใช่คำถาม กด button state 

        ai suggestion 
                จบ [0]

                         detect ข้อความจากเสียง 10-30 วิ หรือ เสียงหายเป็นเวลา 2 วินาที 

        ผู้ใช้งาน อ่านแล้ว ใช่คำถาม กด button state 
               

        ai suggestion 
          จบ [1]
                     detect ข้อความจากเสียง 10-30 วิ หรือ เสียงหายเป็นเวลา 2 วินาที 

                ผู้ใช้งาน อ่านแล้ว ใช่คำถาม กด button state 

        ai suggestion 
                จบ [2]

                         detect ข้อความจากเสียง 10-30 วิ หรือ เสียงหายเป็นเวลา 2 วินาที 

        ผู้ใช้งาน อ่านแล้ว ใช่คำถาม กด button state 
               

        ai suggestion 
          จบ [3]
 
 
 
 
- [ ] Session history & replay
- [ ] Hotkey to toggle capture
- [ ] Permission check UI on first launch

---

## License

Private — All rights reserved
