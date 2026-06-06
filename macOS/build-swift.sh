#!/bin/bash
set -e

echo "🔨 Building Swift audio helper..."
cd swift-audio
swift build -c release
cd ..

echo "📋 Copying binary..."
cp swift-audio/.build/release/swift-audio src-tauri/swift-audio-aarch64-apple-darwin

echo "✍️ Signing with Developer ID..."
codesign --sign "Developer ID Application: wansing bunkiatsakul (DGD6RHZ3GC)" \
  --force \
  --options runtime \
  --entitlements src-tauri/entitlements.plist \
  src-tauri/swift-audio-aarch64-apple-darwin

echo "✅ Done"
codesign -dv src-tauri/swift-audio-aarch64-apple-darwin 2>&1 | grep Authority
