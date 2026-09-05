#!/usr/bin/env python3
"""serve-lan.py — the lab over HTTPS for OTHER devices on the local network (an iPad on the same Wi-Fi).

    python3 serve-lan.py [port]        default 8710 (the λWAVES range is 8700–8799)

Binds every interface (0.0.0.0), unlike the kit's server2.py which is localhost-only.  Same self-signed cert pair
(MB_CERTS overrides the directory) — the tablet will warn once about the certificate; accept it.  The page needs
WebGPU: Safari on iPadOS 26 has it on by default; on iPadOS 18 enable it under Settings → Apps → Safari →
Advanced → Feature Flags → WebGPU.  Static files only, no-store, no directory index writing.
"""
import http.server, os, socket, ssl, sys
HERE = os.path.dirname(os.path.abspath(__file__))
CERTS = os.environ.get("MB_CERTS") or os.path.expanduser("~/mandelbrot/certs")
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8710

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=HERE, **k)
    def end_headers(self):
        self.send_header("Cache-Control", "no-store"); super().end_headers()
    def log_message(self, *a): pass

def lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1)); return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()

httpd = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), H)
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ctx.load_cert_chain(os.path.join(CERTS, "cert.pem"), os.path.join(CERTS, "key.pem"))
httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)
print("λWAVES on the LAN → https://%s:%d/lab/   (ctrl-c stops it)" % (lan_ip(), PORT), flush=True)
httpd.serve_forever()
