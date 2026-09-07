#!/usr/bin/env python3
"""Static HTTPS dev server for λWAVES: server.py <dir> <port>.

WAVE 106 · THE ARK.  This file, gatekit.mjs and drv.js beside it are VENDORED — they
were the MANDELBROT app's mbgate kit (same author, same org; NOTICE records the lift),
reached by absolute path from serve.sh, test.sh and three test files.  That worked on
one laptop and nowhere else: a clone of this repo could not serve the lab or run one
browser block, because the three files it needed lived in a different, private project
and the TLS pair lived in a third directory outside both.  The repo is published now,
so the kit comes with it.

WHY HTTPS AT ALL, for a lab served to 127.0.0.1: WebGPU, service workers and the
clipboard are all SECURE-CONTEXT features.  http://localhost is a secure context by
fiat, but the gate drives a real Firefox at 127.0.0.1 and the PWA laws need a worker
to install, so a real certificate is simpler than arguing with each exception.

THE CERTIFICATE MAKES ITSELF.  LW_CERTS names a directory holding cert.pem + key.pem;
without it we use .certs/ at the repo root and GENERATE a self-signed pair there on
first run (openssl, 825 days — the CA/Browser Forum's ceiling, which is what Safari
enforces).  .certs/ is gitignored: a private key is never a repo's business.  The pair
is for 127.0.0.1 and localhost only and is trusted by nothing, which is correct — the
gate passes --ignore-certificate-errors' Firefox equivalent (acceptInsecureCerts), and
a human gets the one-time browser interstitial that a self-signed cert should produce.
"""
import http.server, os, ssl, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))          # tools/gate/ -> tools/ -> repo
CERTS = os.environ.get("LW_CERTS") or os.environ.get("MB_CERTS") or os.path.join(ROOT, ".certs")
APP = sys.argv[1] if len(sys.argv) > 1 else ROOT
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8701

CERT, KEY = os.path.join(CERTS, "cert.pem"), os.path.join(CERTS, "key.pem")
if not (os.path.exists(CERT) and os.path.exists(KEY)):
    os.makedirs(CERTS, exist_ok=True)
    try:
        subprocess.run(
            ["openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "825",
             "-keyout", KEY, "-out", CERT, "-subj", "/CN=127.0.0.1",
             "-addext", "subjectAltName=IP:127.0.0.1,DNS:localhost"],
            check=True, capture_output=True)
        print("made a self-signed pair in %s (825 days, 127.0.0.1 + localhost)" % CERTS, flush=True)
    except FileNotFoundError:
        sys.exit("no cert pair in %s and openssl is not on PATH.\n"
                 "Install openssl, or point LW_CERTS at a directory holding cert.pem and key.pem." % CERTS)
    except subprocess.CalledProcessError as e:
        sys.exit("openssl could not make a certificate:\n" + e.stderr.decode("utf-8", "replace"))


class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=APP, **k)
    def end_headers(self):
        # no-store, because the whole point of the gate is that it reads the bytes on disk
        self.send_header("Cache-Control", "no-store"); super().end_headers()
    def log_message(self, *a): pass


httpd = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), H)
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ctx.load_cert_chain(CERT, KEY)
httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)
print("λWAVES gate server on https://127.0.0.1:%d/ -> %s" % (PORT, APP), flush=True)
httpd.serve_forever()
