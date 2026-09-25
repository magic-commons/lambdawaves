#!/usr/bin/env python3
"""serve-lan.py — the lab over HTTPS for OTHER devices on the local network (an iPad on the same Wi-Fi).

    python3 serve-lan.py [port]        default 8710 (the λWAVES range is 8700–8799)

Binds every interface (0.0.0.0), unlike the kit's server2.py which is localhost-only.  Same self-signed cert pair
(MB_CERTS overrides the directory) — the tablet will warn once about the certificate; accept it.  The page needs
WebGPU: Safari on iPadOS 26 has it on by default; on iPadOS 18 enable it under Settings → Apps → Safari →
Advanced → Feature Flags → WebGPU.  Static files only, no-store, no directory index writing.

THE DEVICE REPORT (2026-09-25): the one write it accepts is a POST of lab/device-report.js' JSON to /report (or
/lab/report) — the page sends it after https://<this machine>:<port>/lab/?report=1&post=1 has measured the device.
The body is saved to research/device-reports/<UTC ISO time>-<device>.json (never overwriting), refused above 2 MB
or when it is not a JSON object, answered 204, and logged in one line.  Everything else is the static server above.
"""
import datetime, http.server, json, os, re, socket, ssl, sys
HERE = os.path.dirname(os.path.abspath(__file__))
CERTS = os.environ.get("MB_CERTS") or os.path.expanduser("~/mandelbrot/certs")
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8710
REPORTS = os.path.join(HERE, "research", "device-reports")
MAX_REPORT = 2 * 1024 * 1024

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=HERE, **k)
    def end_headers(self):
        self.send_header("Cache-Control", "no-store"); super().end_headers()
    def log_message(self, *a): pass

    def do_POST(self):
        if self.path.split("?", 1)[0] not in ("/report", "/lab/report"):
            self.send_error(404); return
        try:
            n = int(self.headers.get("Content-Length") or "")
        except ValueError:
            self.send_error(411, "Content-Length required"); return
        if n < 0 or n > MAX_REPORT:
            self.send_error(413, "a device report is at most 2 MB"); return
        body = self.rfile.read(n)
        try:
            data = json.loads(body.decode("utf-8"))
        except (UnicodeDecodeError, ValueError):
            self.send_error(400, "not JSON"); return
        if not isinstance(data, dict):
            self.send_error(400, "not a JSON object"); return
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
        print("report ← %s · %d B → research/device-reports/%s" % (self.client_address[0], n, name), flush=True)

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
