#!/usr/bin/env python3
"""tools/serve-lan.py — the lab over HTTPS for OTHER devices on the local network (an iPad on the same Wi-Fi).

    python3 tools/serve-lan.py [port]  default 8710 (the λWAVES range is 8700–8799)

Binds every interface (0.0.0.0), unlike tools/gate/server.py which is localhost-only.  It uses the gate server's self-signed
pair (LW_CERTS or MB_CERTS override the directory; run tools/serve.sh once to make it) — the tablet will warn once about the
certificate; accept it.  The page needs
WebGPU: Safari on iPadOS 26 has it on by default; on iPadOS 18 enable it under Settings → Apps → Safari →
Advanced → Feature Flags → WebGPU.  Static files only, no-store, no directory index writing.

THE DEVICE REPORT (2026-09-25): the one write it accepts is a POST of lab/device-report.js' JSON to /report (or
/lab/report) — the page sends it after https://<this machine>:<port>/lab/?report=1&post=1 has measured the device.
The body is saved to .tmp/device-reports/<UTC ISO time>-<device>.json (never overwriting), answered 204
and logged in one line.  THE CAPS (2026-10-08 security review §3 fix 4): Content-Type must be application/json (a web
page cannot send that cross-origin without a preflight this server does not answer), the body at most 512 KB (the
largest real report is 204,689 B), `kind` must be "lambdawaves-device-report", at most 50 reports per run and one per
client every 10 s.  The inbox is gitignored: keep a report elsewhere by hand after reading it.
THE SURFACE (§3 fixes 1, 3, 5): a path segment starting with "." is 404, directory listings are 404, a LAN client
reads only /lab/ and /tools/perf/, the TLS handshake runs in the connection's thread with a 15 s timeout, and every
request is logged to stderr.  Everything else is the static server above.
"""
import datetime, http.server, json, os, re, socket, ssl, sys, threading, time
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))     # the repository: this file is tools/serve-lan.py
CERTS = os.environ.get("LW_CERTS") or os.environ.get("MB_CERTS") or os.path.expanduser("~/.config/lambdawaves/certs")   # tools/gate/server.py's default
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8710
REPORTS = os.path.join(ROOT, ".tmp", "device-reports")     # gitignored
MAX_REPORT = 512 * 1024
MAX_REPORTS_PER_RUN, PER_CLIENT_S = 50, 10
LAN_PREFIXES = ("/lab/", "/tools/perf/")
HANDSHAKE_S = 15
_lock, _count, _last = threading.Lock(), [0], {}

class H(http.server.SimpleHTTPRequestHandler):
    timeout = HANDSHAKE_S
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def setup(self):
        self.request.settimeout(HANDSHAKE_S)                     # self.connection exists only after super().setup()
        try: self.request.do_handshake()
        except (ssl.SSLError, OSError, ValueError): raise ConnectionAbortedError("tls handshake failed or timed out")
        super().setup()
    def allowed(self):
        path = self.path.split("?", 1)[0].split("#", 1)[0]
        if any(seg.startswith(".") for seg in path.split("/") if seg): return False
        return path.startswith(LAN_PREFIXES)
    def send_head(self):
        if not self.allowed(): self.send_error(404); return None
        return super().send_head()
    def list_directory(self, path):
        self.send_error(404); return None
    def end_headers(self):
        self.send_header("Cache-Control", "no-store"); super().end_headers()
    def log_message(self, fmt, *a):
        sys.stderr.write("%s %s — %s\n" % (self.client_address[0], self.log_date_time_string(), fmt % a)); sys.stderr.flush()

    def do_POST(self):
        if self.path.split("?", 1)[0] not in ("/report", "/lab/report"):
            self.send_error(404); return
        if not (self.headers.get("Content-Type") or "").lower().startswith("application/json"):
            self.send_error(415, "a device report is application/json"); return
        try:
            n = int(self.headers.get("Content-Length") or "")
        except ValueError:
            self.send_error(411, "Content-Length required"); return
        if n < 0 or n > MAX_REPORT:
            self.send_error(413, "a device report is at most 512 KB"); return
        ip, now = self.client_address[0], time.monotonic()
        with _lock:
            if _count[0] >= MAX_REPORTS_PER_RUN: self.send_error(429, "this run has taken its %d reports" % MAX_REPORTS_PER_RUN); return
            if now - _last.get(ip, -1e9) < PER_CLIENT_S: self.send_error(429, "one report per device every %d s" % PER_CLIENT_S); return
            _last[ip] = now; _count[0] += 1
        body = self.rfile.read(n)
        try:
            data = json.loads(body.decode("utf-8"))
        except (UnicodeDecodeError, ValueError):
            self.send_error(400, "not JSON"); return
        if not isinstance(data, dict) or data.get("kind") != "lambdawaves-device-report":
            self.send_error(400, "not a λWAVES device report"); return
        who = data.get("device") or (data.get("platform") or {}).get("platform") or "device"
        label = re.sub(r"[^A-Za-z0-9_-]+", "-", str(who))[:40].strip("-") or "device"
        stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H-%M-%S.%f")[:-3] + "Z"
        os.makedirs(REPORTS, exist_ok=True)
        for k in range(100):
            name = "%s-%s%s.json" % (stamp, label, "" if k == 0 else "-%d" % k)
            try:
                with open(os.path.join(REPORTS, name), "xb") as f: f.write(body)
                break
            except FileExistsError:
                continue
        else:
            self.send_error(500, "could not name the report file"); return
        self.send_response(204); self.end_headers()
        print("report ← %s · %d B → .tmp/device-reports/%s  (read it, then keep it by hand)" % (self.client_address[0], n, name), flush=True)

def lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1)); return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()

class Server(http.server.ThreadingHTTPServer):
    daemon_threads = True
    def handle_error(self, request, client_address):
        t = sys.exc_info()[0]
        if t is None or issubclass(t, (ConnectionAbortedError, ConnectionResetError, BrokenPipeError, TimeoutError, ssl.SSLError)): return
        super().handle_error(request, client_address)

httpd = Server(("0.0.0.0", PORT), H)
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ctx.load_cert_chain(os.path.join(CERTS, "cert.pem"), os.path.join(CERTS, "key.pem"))
httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True, do_handshake_on_connect=False)
print("λWAVES on the LAN → https://%s:%d/lab/   (ctrl-c stops it)" % (lan_ip(), PORT), flush=True)
httpd.serve_forever()
