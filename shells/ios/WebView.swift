// WebView.swift — the WKWebView, its configuration, and the one load-mode switch.
import SwiftUI
import WebKit

enum LoadMode { case fileURL, customScheme, loopback }

let loadMode: LoadMode = .fileURL   // THE ONE SWITCH. Try .fileURL, then .customScheme, then .loopback (README).
let entryPage = "probe.html"        // the first page; "index.html" boots straight into the app
let appQuery = "sw=0&warn=0"        // no service worker inside the shell
let loopbackPort: UInt16 = 8765     // fixed on purpose: localStorage belongs to the origin, and the port is part of it

struct WebView: UIViewRepresentable {
    func makeCoordinator() -> WebCoordinator { WebCoordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.websiteDataStore = WKWebsiteDataStore.default()        // persistent localStorage
        let www = Bundle.main.url(forResource: "www", withExtension: nil)
        if let www, loadMode == .customScheme {
            config.setURLSchemeHandler(BundleSchemeHandler(root: www), forURLScheme: "lambdawaves")
        }
        let web = WKWebView(frame: .zero, configuration: config)
        web.isInspectable = true                                       // Mac Safari ▸ Develop ▸ <device> ▸ LambdaWaves
        web.scrollView.contentInsetAdjustmentBehavior = .never
        web.navigationDelegate = context.coordinator
        web.uiDelegate = context.coordinator
        context.coordinator.start(web, www: www)
        return web
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}
