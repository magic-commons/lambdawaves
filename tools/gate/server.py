#!/usr/bin/env python3
"""Static HTTPS dev server for λWAVES: server.py <dir> <port>.

WAVE 106 · THE ARK.  This file, gatekit.mjs and drv.mjs beside it are VENDORED — they
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

THE LAN (0.5.0, after the 2026-10-08 security review, research/release-0.5.0/SECURITY-REVIEW.md
§3 fixes 1, 3, 5).  LW_HOST=0.0.0.0 puts this server on the Wi-Fi, and until this change it
served the WHOLE tree there — .certs/key.pem, .claude/handoffs, .tmp/ logs, directory listings.
Now: a path with a segment that starts with "." is 404 for everyone; directory listings are 404;
a client that is not loopback gets only /lab/ and /tools/perf/ (the lab's one import outside
lab/ is ../tools/perf/device-report.js); the pair lives OUTSIDE the tree by default
(~/.config/lambdawaves/certs — LW_CERTS/MB_CERTS still override) and is a leaf certificate
(CA:FALSE); the TLS handshake runs in the connection's own thread with a 15 s timeout, so one
idle `nc` can no longer park the accept loop for everyone; and non-loopback requests are logged
to stderr (the loopback gate stays quiet).
"""
import http.server, os, posixpath, ssl, subprocess, sys, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))          # tools/gate/ -> tools/ -> repo
CERTS = os.environ.get("LW_CERTS") or os.environ.get("MB_CERTS") or os.path.expanduser("~/.config/lambdawaves/certs")
APP = sys.argv[1] if len(sys.argv) > 1 else ROOT
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8701
HOST = os.environ.get("LW_HOST", "127.0.0.1")

CERT, KEY = os.path.join(CERTS, "cert.pem"), os.path.join(CERTS, "key.pem")
if not (os.path.exists(CERT) and os.path.exists(KEY)):
    os.makedirs(CERTS, exist_ok=True)
    try:
        subprocess.run(
            ["openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "825",
             "-keyout", KEY, "-out", CERT, "-subj", "/CN=127.0.0.1",
             "-addext", "subjectAltName=IP:127.0.0.1,DNS:localhost",
             "-addext", "basicConstraints=critical,CA:FALSE"],
            check=True, capture_output=True)
        print("made a self-signed pair in %s (825 days, 127.0.0.1 + localhost)" % CERTS, flush=True)
    except FileNotFoundError:
        sys.exit("no cert pair in %s and openssl is not on PATH.\n"
                 "Install openssl, or point LW_CERTS at a directory holding cert.pem and key.pem." % CERTS)
    except subprocess.CalledProcessError as e:
        sys.exit("openssl could not make a certificate:\n" + e.stderr.decode("utf-8", "replace"))


LOOPBACK = ("127.0.0.1", "::1", "::ffff:127.0.0.1")
LAN_PREFIXES = ("/lab/", "/tools/perf/")          # what a non-loopback client may read (see the header)
HANDSHAKE_S = 15


class H(http.server.SimpleHTTPRequestHandler):
    timeout = HANDSHAKE_S
    def __init__(self, *a, **k): super().__init__(*a, directory=APP, **k)
    def setup(self):
        # the handshake happens HERE, in this connection's thread, not in accept(): an idle client times out alone
        self.request.settimeout(HANDSHAKE_S)                     # self.connection exists only after super().setup()
        try: self.request.do_handshake()
        except (ssl.SSLError, OSError, ValueError): raise ConnectionAbortedError("tls handshake failed or timed out")
        super().setup()
    def loopback(self): return self.client_address[0] in LOOPBACK
    def allowed(self):
        # judged as translate_path will read it (unquoted, then normalized), so /%2Eclaude/ and /lab/%2E%2E/ are not a way round
        path = posixpath.normpath(urllib.parse.unquote(self.path.split("?", 1)[0].split("#", 1)[0]))
        if any(seg.startswith(".") for seg in path.split("/") if seg): return False      # .certs .claude .tmp .git …
        if self.loopback(): return True
        return (path + "/").startswith(LAN_PREFIXES)
    def send_head(self):
        if not self.allowed(): self.send_error(404); return None
        return super().send_head()
    def list_directory(self, path):
        self.send_error(404); return None
    def end_headers(self):
        # no-store, because the whole point of the gate is that it reads the bytes on disk
        self.send_header("Cache-Control", "no-store"); super().end_headers()
    def log_message(self, fmt, *a):
        if not self.loopback(): sys.stderr.write("%s %s — %s\n" % (self.client_address[0], self.log_date_time_string(), fmt % a)); sys.stderr.flush()


class Server(http.server.ThreadingHTTPServer):
    daemon_threads = True
    def handle_error(self, request, client_address):
        t = sys.exc_info()[0]
        if t is None or issubclass(t, (ConnectionAbortedError, ConnectionResetError, BrokenPipeError, TimeoutError, ssl.SSLError)): return
        super().handle_error(request, client_address)


httpd = Server((HOST, PORT), H)
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ctx.load_cert_chain(CERT, KEY)
httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True, do_handshake_on_connect=False)
print("λWAVES gate server on https://%s:%d/ -> %s" % (HOST, PORT, APP), flush=True)
httpd.serve_forever()
