App เปิดครั้งแรก
↓
ตรวจ Screen Recording permission
↓
ยังไม่มี → แสดง UI อธิบายว่าทำไมต้องการ
↓
ปุ่ม "เปิด System Settings" → พาไปหน้า Privacy โดยตรง
↓
User กลับมา app → ตรวจใหม่ → เริ่ม capture ได้

## วิธีทำให้ User Experience ดีที่สุด App ขอ permission พร้อม dialog อธิบาย

```swift

1. ตรวจสอบก่อนว่ามี permission ไหม

SCShareableContent.getExcludingDesktopWindows(false, onScreenWindowsOnly: false) { content, error in
    if error != nil {
        // เปิด System Settings ให้เลย
        NSWorkspace.shared.open(
            URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture")!
        )
    }
}
```
