// WebCoordinator.swift — loads www/ by the chosen mode; links out, downloads to Files + share sheet, alert/confirm.
import UIKit
import WebKit

@MainActor
final class WebCoordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKDownloadDelegate {
    private weak var web: WKWebView?
    private var server: LoopbackServer?
    private var saving: [ObjectIdentifier: URL] = [:]

    func start(_ web: WKWebView, www: URL?) {
        self.web = web
        guard let www, FileManager.default.fileExists(atPath: www.appending(path: "index.html").path(percentEncoded: false)) else {
            show("www/index.html is not inside the app. README step 3: add www as a folder reference (Apply Once to Folder)."); return
        }
        switch loadMode {
        case .fileURL:
            let page = www.appending(path: entryPage)
            var parts = URLComponents(url: page, resolvingAgainstBaseURL: false)
            parts?.query = appQuery
            web.loadFileURL(parts?.url ?? page, allowingReadAccessTo: www)
        case .customScheme:
            web.load(URLRequest(url: URL(string: "lambdawaves://app/\(entryPage)?\(appQuery)")!))
        case .loopback:
            let s = LoopbackServer(root: www, port: loopbackPort)
            server = s
            s.start { [weak self] problem in
                if let problem { self?.show("loopback server: \(problem)"); return }
                self?.web?.load(URLRequest(url: URL(string: "http://127.0.0.1:\(loopbackPort)/\(entryPage)?\(appQuery)")!))
            }
        }
    }

    private func isOurs(_ url: URL) -> Bool {
        switch url.scheme?.lowercased() ?? "" {
        case "about", "blob", "data": return true
        case "file": return loadMode == .fileURL
        case "lambdawaves": return loadMode == .customScheme
        case "http": return loadMode == .loopback && url.host() == "127.0.0.1" && url.port == Int(loopbackPort)
        default: return false
        }
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, preferences: WKWebpagePreferences, decisionHandler: @escaping @MainActor @Sendable (WKNavigationActionPolicy, WKWebpagePreferences) -> Void) {
        if navigationAction.shouldPerformDownload { decisionHandler(.download, preferences); return }
        guard let url = navigationAction.request.url else { decisionHandler(.cancel, preferences); return }
        if isOurs(url) {
            decisionHandler(navigationAction.targetFrame == nil ? .cancel : .allow, preferences)   // same-origin target=_blank: no second window
        } else {
            UIApplication.shared.open(url)                                                         // the world opens in Safari
            decisionHandler(.cancel, preferences)
        }
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationResponse: WKNavigationResponse, decisionHandler: @escaping @MainActor @Sendable (WKNavigationResponsePolicy) -> Void) {
        let scheme = navigationResponse.response.url?.scheme ?? ""
        let asFile = !navigationResponse.canShowMIMEType || (navigationResponse.isForMainFrame && (scheme == "blob" || scheme == "data"))
        decisionHandler(asFile ? .download : .allow)
    }

    func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) { download.delegate = self }
    func webView(_ webView: WKWebView, navigationResponse: WKNavigationResponse, didBecome download: WKDownload) { download.delegate = self }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: any Error) {
        let e = error as NSError                                                                  // a cancel, or a load that became a download, is not a failure
        if e.code == NSURLErrorCancelled || (e.domain == "WebKitErrorDomain" && e.code == 102) { return }
        show("load failed: \(e.localizedDescription) [\(e.domain) \(e.code)]")
    }
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        show("The web content process ended (often memory). Write it in the acceptance row, then relaunch.")
    }

    func download(_ download: WKDownload, decideDestinationUsing response: URLResponse, suggestedFilename: String, completionHandler: @escaping @MainActor @Sendable (URL?) -> Void) {
        let name = suggestedFilename.isEmpty ? "download" : suggestedFilename.replacingOccurrences(of: "/", with: "_")
        let dest = URL.documentsDirectory.appending(path: name)
        try? FileManager.default.removeItem(at: dest)                                            // WebKit refuses an existing file
        saving[ObjectIdentifier(download)] = dest
        completionHandler(dest)
    }
    func downloadDidFinish(_ download: WKDownload) {
        guard let file = saving.removeValue(forKey: ObjectIdentifier(download)), let web else { return }
        let sheet = UIActivityViewController(activityItems: [file], applicationActivities: nil)
        sheet.popoverPresentationController?.sourceView = web                                   // iPad: a popover needs an anchor
        sheet.popoverPresentationController?.sourceRect = CGRect(x: web.bounds.midX, y: web.bounds.midY, width: 1, height: 1)
        present(sheet)
    }
    func download(_ download: WKDownload, didFailWithError error: any Error, resumeData: Data?) {
        saving.removeValue(forKey: ObjectIdentifier(download))
        ask("Download failed: \(error.localizedDescription)", cancel: false) { _ in }
    }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping @MainActor @Sendable () -> Void) {
        ask(message, cancel: false) { _ in completionHandler() }
    }
    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping @MainActor @Sendable (Bool) -> Void) {
        ask(message, cancel: true, completionHandler)
    }

    private func ask(_ message: String, cancel: Bool, _ done: @escaping @MainActor @Sendable (Bool) -> Void) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        if cancel { alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in done(false) }) }
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in done(true) })
        present(alert)
    }
    private func present(_ vc: UIViewController) {
        var top = web?.window?.rootViewController
        while let next = top?.presentedViewController { top = next }
        top?.present(vc, animated: true)
    }
    private func show(_ text: String) {
        let safe = text.replacingOccurrences(of: "&", with: "&amp;").replacingOccurrences(of: "<", with: "&lt;")
        web?.loadHTMLString("<meta name=viewport content='width=device-width'><body style='font:17px -apple-system;padding:64px 24px'><b>λWAVES shell</b><p>\(safe)</p>", baseURL: nil)
    }
}
