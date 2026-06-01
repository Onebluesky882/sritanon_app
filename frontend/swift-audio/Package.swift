// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "swift-audio",
    platforms: [
        .macOS(.v13)
    ],
    targets: [
        .executableTarget(
            name: "swift-audio",
            path: "Sources/swift-audio"
        )
    ]
)
