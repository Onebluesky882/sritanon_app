import Foundation
import ScreenCaptureKit
import AVFoundation

@available(macOS 13.0, *)
class AudioCapture: NSObject, SCStreamDelegate, SCStreamOutput {
    var stream: SCStream?

    func checkPermissionAndStart() {
        SCShareableContent.getExcludingDesktopWindows(false, onScreenWindowsOnly: false) { content, error in
            if let error = error {
                let msg = error.localizedDescription.lowercased()

                if msg.contains("denied") || msg.contains("tcc") || msg.contains("permission") {
                    // ส่ง signal พิเศษออก stdout เพื่อบอก Rust
                    fputs("PERMISSION_DENIED\n", stderr)
                    // เปิด System Settings ให้เลย
                    DispatchQueue.main.async {
                        NSWorkspace.shared.open(
                            URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture")!
                        )
                    }
                    // รอ 30 วิแล้วลองใหม่
                    fputs("⏳ Waiting 30s for permission...\n", stderr)
                    Thread.sleep(forTimeInterval: 30)
                    self.checkPermissionAndStart()
                    return
                }

                fputs("❌ Error: \(error.localizedDescription)\n", stderr)
                exit(1)
            }

            guard let display = content?.displays.first else {
                fputs("❌ No display found\n", stderr)
                exit(1)
            }

            self.startCapture(display: display)
        }
    }

    func startCapture(display: SCDisplay) {
        let filter = SCContentFilter(display: display, excludingWindows: [])
        let config = SCStreamConfiguration()
        config.capturesAudio = true
        config.sampleRate = 16000
        config.channelCount = 1

        stream = SCStream(filter: filter, configuration: config, delegate: self)

        let audioQueue = DispatchQueue(label: "com.sritanon.swift-audio.capture", qos: .utility)

        do {
            try stream?.addStreamOutput(self, type: .audio, sampleHandlerQueue: audioQueue)
            try stream?.startCapture()
            fputs("✅ Audio capture started\n", stderr)
        } catch {
            fputs("❌ Start error: \(error)\n", stderr)
            exit(1)
        }
    }

    func stream(_ stream: SCStream, didOutputSampleBuffer buffer: CMSampleBuffer, of type: SCStreamOutputType) {
        guard type == .audio else { return }
        guard let blockBuffer = CMSampleBufferGetDataBuffer(buffer) else { return }

        var length = 0
        var dataPointer: UnsafeMutablePointer<Int8>?
        CMBlockBufferGetDataPointer(blockBuffer, atOffset: 0, lengthAtOffsetOut: nil, totalLengthOut: &length, dataPointerOut: &dataPointer)

        guard let ptr = dataPointer, length > 0 else { return }
        // เขียนตรงจาก buffer pointer ผ่าน POSIX write — ตัด heap copy ของ Data(bytes:) ออก
        // เพื่อลด CPU ในงาน callback ที่ยิงถี่มาก
        ptr.withMemoryRebound(to: UInt8.self, capacity: length) { rawPtr in
            _ = write(FileHandle.standardOutput.fileDescriptor, rawPtr, length)
        }
    }

    // handle stream error — reconnect อัตโนมัติ
    func stream(_ stream: SCStream, didStopWithError error: Error) {
        fputs("⚠️ Stream stopped: \(error.localizedDescription)\n", stderr)
        fputs("🔄 Reconnecting in 3s...\n", stderr)
        Thread.sleep(forTimeInterval: 3)
        checkPermissionAndStart()
    }
}

if #available(macOS 13.0, *) {
    let capture = AudioCapture()
    capture.checkPermissionAndStart()
    RunLoop.main.run()
} else {
    fputs("❌ macOS 13+ required\n", stderr)
    exit(1)
}
