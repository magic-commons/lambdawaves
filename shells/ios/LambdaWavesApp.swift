// LambdaWavesApp.swift — the λWAVES iOS/iPadOS host (M0): one window, one WKWebView, nothing native.
import SwiftUI

@main
struct LambdaWavesApp: App {
    var body: some Scene {
        WindowGroup {
            WebView()
                .ignoresSafeArea()          // index.html uses viewport-fit=cover and pads itself with env(safe-area-inset-*)
                .statusBarHidden(false)
        }
    }
}
