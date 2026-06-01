import Foundation
import ScreenCaptureKit
import AVFoundation

@available(macOS 13.0, *)
class AudioCapture: NSObject, SCStreamDelegate, SCStreamOutput {
    var stream: SCStream?

    func start() {
        SCShareableContent.getExcludingDesktopWindows(false, onScreenWindowsOnly: false) { content, error in
            guard let display = content?.displays.first else {
                fputs("❌ No display found\n", stderr)
                exit(1)
            }

            let filter = SCContentFilter(display: display, excludingWindows: [])
            let config = SCStreamConfiguration()
            config.capturesAudio = true
            config.sampleRate = 16000
            config.channelCount = 1

            self.stream = SCStream(filter: filter, configuration: config, delegate: self)

            do {
                try self.stream?.addStreamOutput(self, type: .audio, sampleHandlerQueue: .global())
                try self.stream?.startCapture()
                fputs("✅ Audio capture started\n", stderr)
            } catch {
                fputs("❌ Start error: \(error)\n", stderr)
                exit(1)
            }
        }
    }

    func stream(_ stream: SCStream, didOutputSampleBuffer buffer: CMSampleBuffer, of type: SCStreamOutputType) {
        guard type == .audio else { return }
        guard let blockBuffer = CMSampleBufferGetDataBuffer(buffer) else { return }

        var length = 0
        var dataPointer: UnsafeMutablePointer<Int8>?
        CMBlockBufferGetDataPointer(blockBuffer, atOffset: 0, lengthAtOffsetOut: nil, totalLengthOut: &length, dataPointerOut: &dataPointer)

        guard let ptr = dataPointer else { return }
        let data = Data(bytes: ptr, count: length)
        FileHandle.standardOutput.write(data)
    }
}

if #available(macOS 13.0, *) {
    let capture = AudioCapture()
    capture.start()
    RunLoop.main.run()
} else {
    fputs("❌ macOS 13+ required\n", stderr)
    exit(1)
}
