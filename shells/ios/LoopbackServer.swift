// LoopbackServer.swift — GET-only HTTP/1.1 on 127.0.0.1:<port> serving www/ (Network.framework, one request per connection).
import Foundation
@preconcurrency import Network

nonisolated final class LoopbackServer: @unchecked Sendable {
    let root: URL
    let port: UInt16
    private let queue = DispatchQueue(label: "lambdawaves.loopback")   // every mutable field below is touched only on this queue
    private var listener: NWListener?
    private var everReady = false

    init(root: URL, port: UInt16) { self.root = root; self.port = port }

    /// Calls `onState(nil)` the first time it is listening, or `onState(reason)` if it never manages to.
    func start(onState: @escaping @MainActor @Sendable (String?) -> Void) {
        queue.async { self.listen(onState) }
    }

    private func listen(_ onState: @escaping @MainActor @Sendable (String?) -> Void) {
        let params = NWParameters.tcp
        params.requiredInterfaceType = .loopback            // never reachable from the network
        params.allowLocalEndpointReuse = true
        guard let nwPort = NWEndpoint.Port(rawValue: port), let l = try? NWListener(using: params, on: nwPort) else {
            fail("cannot listen on port \(port)", onState); return
        }
        l.stateUpdateHandler = { [weak self] state in
            guard let self else { return }
            switch state {
            case .ready:
                if !self.everReady { self.everReady = true; Task { @MainActor in onState(nil) } }
            case .failed(let error):
                self.listener?.cancel()
                self.fail("\(error)", onState)
            default: break
            }
        }
        l.newConnectionHandler = { [weak self] conn in self?.accept(conn) }
        listener = l
        l.start(queue: queue)
    }

    /// Before the first success the page is told; after it, iOS has reclaimed a suspended app's socket, so listen again (same port).
    private func fail(_ reason: String, _ onState: @escaping @MainActor @Sendable (String?) -> Void) {
        if everReady { queue.asyncAfter(deadline: .now() + 0.5) { self.listen(onState) } }
        else { Task { @MainActor in onState(reason) } }
    }

    private func accept(_ conn: NWConnection) {
        conn.start(queue: queue)
        receive(conn, Data())
    }

    private func receive(_ conn: NWConnection, _ sofar: Data) {
        conn.receive(minimumIncompleteLength: 1, maximumLength: 65536) { [weak self] data, _, isComplete, error in
            guard let self else { conn.cancel(); return }
            var buffer = sofar
            if let data { buffer.append(data) }
            if let end = buffer.range(of: Data("\r\n\r\n".utf8)) {
                self.reply(conn, head: String(decoding: buffer[..<end.lowerBound], as: UTF8.self))
            } else if isComplete || error != nil || buffer.count > 65536 {
                conn.cancel()
            } else {
                self.receive(conn, buffer)
            }
        }
    }

    private func reply(_ conn: NWConnection, head: String) {
        let words = (head.components(separatedBy: "\r\n").first ?? "").split(separator: " ")
        var status = 405, body = Data("GET only\n".utf8), type = "text/plain; charset=utf-8"
        if words.count >= 2, words[0] == "GET" {
            let target = words[1].split(separator: "?", maxSplits: 1, omittingEmptySubsequences: false).first.map { String($0) } ?? "/"
            let found = WWW.respond(root: root, path: target.removingPercentEncoding ?? target)
            status = found.status; body = found.body; type = found.type
        }
        let reason = [200: "OK", 404: "Not Found", 405: "Method Not Allowed"][status] ?? "Error"
        let header = "HTTP/1.1 \(status) \(reason)\r\nContent-Type: \(type)\r\nContent-Length: \(body.count)\r\n"
            + "Cache-Control: no-store\r\nConnection: close\r\n\r\n"
        var out = Data(header.utf8)
        out.append(body)
        conn.send(content: out, completion: .contentProcessed { _ in conn.cancel() })
    }
}
