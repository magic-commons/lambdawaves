// BundleSchemeHandler.swift — serves www/ as lambdawaves://app/<path>; WWW is the file lookup + MIME table the loopback server shares.
import Foundation
import WebKit

final class BundleSchemeHandler: NSObject, WKURLSchemeHandler {
    let root: URL
    init(root: URL) { self.root = root }

    func webView(_ webView: WKWebView, start urlSchemeTask: any WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url else { urlSchemeTask.didFailWithError(URLError(.badURL)); return }
        let (status, body, type) = WWW.respond(root: root, path: url.path(percentEncoded: false))
        let head = ["Content-Type": type, "Content-Length": String(body.count), "Cache-Control": "no-store"]
        guard let response = HTTPURLResponse(url: url, statusCode: status, httpVersion: "HTTP/1.1", headerFields: head) else {
            urlSchemeTask.didFailWithError(URLError(.cannotParseResponse)); return
        }
        urlSchemeTask.didReceive(response)     // answered synchronously on the main thread: whole files, no ranges
        urlSchemeTask.didReceive(body)
        urlSchemeTask.didFinish()
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: any WKURLSchemeTask) {}   // nothing in flight to cancel
}

nonisolated enum WWW {
    static let types: [String: String] = [
        "html": "text/html; charset=utf-8", "js": "text/javascript; charset=utf-8", "mjs": "text/javascript; charset=utf-8",
        "css": "text/css; charset=utf-8", "json": "application/json", "webmanifest": "application/manifest+json",
        "woff2": "font/woff2", "png": "image/png", "svg": "image/svg+xml", "wgsl": "text/wgsl; charset=utf-8",
        "txt": "text/plain; charset=utf-8", "md": "text/plain; charset=utf-8", "": "text/plain; charset=utf-8",   // "" = LICENSE, NOTICE
    ]

    /// The file under `root` for a decoded URL path, or nil (missing, a directory, or an attempt to leave root).
    static func file(root: URL, path: String) -> URL? {
        var rel = path.hasPrefix("/") ? String(path.dropFirst()) : path
        if rel.isEmpty || rel.hasSuffix("/") { rel += "index.html" }
        let parts = rel.split(separator: "/", omittingEmptySubsequences: true)
        if parts.contains(where: { $0 == ".." || $0 == "." || $0.contains("\\") }) { return nil }
        let file = root.appending(path: parts.joined(separator: "/")).standardizedFileURL
        let base = root.standardizedFileURL.path(percentEncoded: false)
        guard file.path(percentEncoded: false).hasPrefix(base.hasSuffix("/") ? base : base + "/") else { return nil }
        var isDir: ObjCBool = false
        guard FileManager.default.fileExists(atPath: file.path(percentEncoded: false), isDirectory: &isDir), !isDir.boolValue else { return nil }
        return file
    }

    static func respond(root: URL, path: String) -> (status: Int, body: Data, type: String) {
        guard let file = WWW.file(root: root, path: path), let data = try? Data(contentsOf: file) else {
            return (404, Data("not found\n".utf8), "text/plain; charset=utf-8")
        }
        return (200, data, types[file.pathExtension.lowercased()] ?? "application/octet-stream")
    }
}
