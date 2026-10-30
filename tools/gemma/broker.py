#!/usr/bin/env python3
"""tools/gemma/broker.py — THE BROKER (0.6.6 G3): a local Gemma 4 behind one HTTPS route, for λWAVES' ASK box.

    python3 tools/gemma/broker.py            (tools/gemma/start.sh runs it with nohup; tools/gemma/stop.sh stops it by pid)

Python 3 stdlib only.  HTTPS on 127.0.0.1:9443 (GEMMA_PORT); GEMMA_HOST=0.0.0.0 is the explicit LAN opt-in (the iPad reaches it by the
desktop's hostname), said at start.  A browser Origin must be loopback, this host's name, or listed in GEMMA_ORIGINS (comma-separated
exact origins) — anything else is 403 with no CORS headers; two asks run at once, a third is 429.  It uses the gate server's
own certificate pair (tools/gate/server.py's road: LW_CERTS, MB_CERTS, ~/.config/lambdawaves/certs, then .certs/ at the repo root —
never a second pair).  Routes:

    POST /ask      { text, inventory, history }  ->  { say, verbs, notebook?, ms, model }
    GET  /health   { ok, model, ollama, pulled }
    OPTIONS *      the CORS preflight (the allowed Origin echoed, never `*`; docs/GEMMA.md says so)

One ask is one Ollama POST /api/chat (127.0.0.1:11434, stream false, temperature 0.2, `format` = the reply JSON schema built from the
verb table, so the model's grammar is constrained to {say, verbs:[{verb, args}], notebook?}).  The system prompt is built ONCE at start
from `node tools/gemma/verb-doc.mjs` (the table, the reply schema, the catalogue of ids), so it never drifts from the tree.  Every verb
is validated against the table before the answer leaves (an unknown verb is dropped and said in `say`); each turn is one JSON line in
~/.cache/lambdawaves-gemma/log.jsonl (your words in it only with GEMMA_LOG=1).  The page runs the verbs through its own hand roads; the broker never touches the app.
"""
import http.server, json, os, socket, ssl, subprocess, sys, threading, time, urllib.error, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))                  # tools/gemma/ -> tools/ -> repo
MODEL = os.environ.get("GEMMA_MODEL", "gemma4:e4b")
PORT = int(os.environ.get("GEMMA_PORT", "9443"))
HOST = os.environ.get("GEMMA_HOST", "127.0.0.1")              # 0.0.0.0 = the LAN, by your word only
ORIGIN_HOSTS = {"127.0.0.1", "localhost", "::1", socket.gethostname().lower(), socket.gethostname().lower() + ".local"}
ORIGINS = {o.strip().rstrip("/") for o in os.environ.get("GEMMA_ORIGINS", "").split(",") if o.strip()}
LOG_TEXT = os.environ.get("GEMMA_LOG") == "1"                  # the raw prompt reaches the log only when asked for
BUSY = threading.BoundedSemaphore(2)                           # the request cap: a third concurrent ask is 429
CTX = int(os.environ.get("GEMMA_CTX", "8192"))                 # the prompt + catalogue is ~3 k tokens; 8 k leaves room for 6 turns
VERBS_MODULE = os.environ.get("GEMMA_VERBS", "")               # verb-doc's [module]; empty = lab/verbs.js, else the stub (warned)
OLLAMA = "http://127.0.0.1:11434"
TIMEOUT_S = 120
HISTORY_TURNS = 6
MAX_BODY = 256 * 1024
LOG_DIR = os.path.expanduser("~/.cache/lambdawaves-gemma")
LOG = os.path.join(LOG_DIR, "log.jsonl")
HANDSHAKE_S = 15

# ── the certificate: tools/gate/server.py's road, read only ─────────────────────────────────────────────────────────
def cert_pair():
    dirs = [os.environ.get("LW_CERTS"), os.environ.get("MB_CERTS"), os.path.expanduser("~/.config/lambdawaves/certs"), os.path.join(ROOT, ".certs")]
    for d in dirs:
        if d and os.path.exists(os.path.join(d, "cert.pem")) and os.path.exists(os.path.join(d, "key.pem")):
            return os.path.join(d, "cert.pem"), os.path.join(d, "key.pem")
    sys.exit("no cert pair (LW_CERTS, ~/.config/lambdawaves/certs or .certs/) — run tools/gate/server.py once to make the pair")

# ── the prompt, built once from the tree ────────────────────────────────────────────────────────────────────────────
def verb_doc(*flags):
    cmd = ["node", os.path.join(HERE, "verb-doc.mjs")] + ([VERBS_MODULE] if VERBS_MODULE else []) + list(flags)
    r = subprocess.run(cmd, capture_output=True, text=True, cwd=ROOT)
    if r.stderr.strip(): print(r.stderr.strip(), file=sys.stderr, flush=True)
    if r.returncode: sys.exit("verb-doc.mjs %s failed (%d)" % (" ".join(flags), r.returncode))
    return r.stdout.strip()

LAW = ("Every number you write comes from INVENTORY. If a number is not there, say you cannot see it yet and emit the verb that would "
       "show it. Never invent a value, a name or a result. Prefer one to three verbs per answer. `say` is one short paragraph in plain "
       "words for a person looking at the stage. Put longer notes in `notebook` as Markdown.")
# measured 2026-10-15 on gemma4:e4b (G3-BUILD.md check d): with the law alone she answered "benzene's dipole?" with a DIFFERENT number
# from INVENTORY or a false line about the view; these two sentences made her say "I cannot see …" three times of three
SHARP = ("When the person asks for a quantity that INVENTORY does not carry (a dipole, an ionization energy, a bond length), your `say` "
         "begins with \"I cannot see\" and names the quantity; never answer with a different quantity instead. Do not emit a verb for "
         "what INVENTORY shows is already on the stage (the same molecule, the same view).")

def build_prompt():
    table, spec, cat = verb_doc(), json.loads(verb_doc("--json")), verb_doc("--catalogue")
    system = "\n\n".join([
        "You are Gemma inside λWAVES, a wave-mechanics instrument. You act ONLY by emitting verbs from this table:\n" + table,
        "THE GROUNDING LAW. " + LAW + " " + SHARP,
        "THE CATALOGUE — the only ids you may name in a verb's args:\n" + cat,
        "Answer with one JSON object {\"say\": string, \"verbs\": [{\"verb\": id, \"args\": {...}}], \"notebook\"?: string}. "
        "Each user turn ends with INVENTORY, the app's own readouts right now; it is the only source of numbers. "
        "The verbs run in order, so a request with several steps (a new project, then a molecule, then the camera) gets one verb per step."])
    return system, spec["ids"], spec["schema"], spec.get("args", {}), spec.get("source", ""), cat

SYSTEM, IDS, SCHEMA, ARGS, SOURCE, CATALOGUE = build_prompt()
MOLECULE_IDS = {}                                              # lower-case -> the catalogue's spelling (C6H6, H2O, alanine …)
for ln in CATALOGUE.splitlines():
    if ln.startswith("  ") and ":" in ln:
        for item in ln.split(":", 1)[1].split(";"):
            mid = item.strip().split(" = ", 1)[0].strip()
            if mid: MOLECULE_IDS[mid.lower()] = mid
    elif not ln.startswith("  ") and not ln.startswith("MOLECULES"):
        break

# ── Ollama ──────────────────────────────────────────────────────────────────────────────────────────────────────────
class BrokerError(Exception):
    def __init__(self, status, error): super().__init__(error); self.status, self.error = status, error

def ollama(path, body=None, timeout=TIMEOUT_S):
    req = urllib.request.Request(OLLAMA + path, data=None if body is None else json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json"}, method="GET" if body is None else "POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r: return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        msg = e.read().decode("utf-8", "replace")
        if e.code == 404 and "not found" in msg:
            raise BrokerError(503, "model %s is not pulled — ~/ollama/bin/ollama pull %s (or tools/gemma/start.sh)" % (MODEL, MODEL))
        raise BrokerError(502, "ollama answered %d: %s" % (e.code, msg[:300]))
    except (urllib.error.URLError, ConnectionError) as e:
        if isinstance(getattr(e, "reason", None), TimeoutError) or isinstance(e, TimeoutError):
            raise BrokerError(504, "ollama took longer than %d s" % timeout)
        raise BrokerError(503, "ollama is not running — tools/gemma/start.sh")
    except TimeoutError:
        raise BrokerError(504, "ollama took longer than %d s" % timeout)

def health():
    try: ver = ollama("/api/version", timeout=3).get("version")
    except BrokerError: return {"ok": False, "model": MODEL, "ollama": None, "pulled": False}
    try: pulled = any(m.get("name") == MODEL or m.get("model") == MODEL for m in ollama("/api/tags", timeout=5).get("models", []))
    except BrokerError: pulled = False
    return {"ok": bool(ver and pulled), "model": MODEL, "ollama": ver, "pulled": pulled, "verbs": SOURCE}

def turns(history):
    """the last HISTORY_TURNS turns as user/assistant pairs; a turn is {text, say, verbs?} or {role, content}"""
    out = []
    for h in (history if isinstance(history, list) else [])[-HISTORY_TURNS * 2:]:
        if not isinstance(h, dict): continue
        if h.get("role") in ("user", "assistant") and isinstance(h.get("content"), str):
            out.append({"role": h["role"], "content": h["content"][:4000]}); continue
        q = h.get("text") or h.get("user") or h.get("ask"); a = h.get("say") or h.get("assistant") or h.get("reply")
        if isinstance(q, str) and q: out.append({"role": "user", "content": q[:4000]})
        if isinstance(a, str) and a:
            out.append({"role": "assistant", "content": json.dumps({"say": a, "verbs": h.get("verbs") if isinstance(h.get("verbs"), list) else []}, ensure_ascii=False)[:4000]})
    users = [i for i, m in enumerate(out) if m["role"] == "user"]
    return out[users[-HISTORY_TURNS]:] if len(users) > HISTORY_TURNS else out

def check_args(name, args):
    """args held to the table's spec: an enum value in the table's spelling, a required arg present; returns (args, why-not)"""
    args = dict(args)
    for k, a in (ARGS.get(name) or {}).items():
        if k not in args or args[k] is None:
            if not a.get("optional"): return args, "%s needs %s" % (name, k)
            args.pop(k, None); continue
        if a.get("values"):
            hit = next((x for x in a["values"] if isinstance(args[k], str) and x.lower() == args[k].lower()), None)
            if hit is None: return args, "%s %s=%s" % (name, k, args[k])
            args[k] = hit
    if name == "molecule" and isinstance(args.get("id"), str) and args["id"].lower() in MOLECULE_IDS:
        args["id"] = MOLECULE_IDS[args["id"].lower()]
    return args, None

def validate(reply):
    """the reply, held to the table: an unknown verb or a bad argument dropped and said; args always an object"""
    say = reply.get("say") if isinstance(reply.get("say"), str) else ""
    verbs, dropped, bad = [], [], []
    for v in reply.get("verbs") if isinstance(reply.get("verbs"), list) else []:
        if not isinstance(v, dict): continue
        name = v.get("verb")
        if name not in IDS: dropped.append(str(name)); continue
        args, why = check_args(name, v.get("args") if isinstance(v.get("args"), dict) else {})
        if why: bad.append(why); continue
        verbs.append({"verb": name, "args": args})
    if dropped: say = (say + " (I dropped a verb I do not have: %s)" % ", ".join(dropped)).strip()
    if bad: say = (say + " (I dropped a verb with an argument I cannot use: %s)" % "; ".join(bad)).strip()
    out = {"say": say, "verbs": verbs}
    if isinstance(reply.get("notebook"), str) and reply["notebook"].strip(): out["notebook"] = reply["notebook"]
    return out

def ask(body):
    text = body.get("text")
    if not isinstance(text, str) or not text.strip(): raise BrokerError(400, "an ask needs { text }")
    inv = json.dumps(body.get("inventory", {}), ensure_ascii=False)[:20000]
    messages = [{"role": "system", "content": SYSTEM}] + turns(body.get("history")) + [
        {"role": "user", "content": text.strip()[:4000] + "\n\nINVENTORY (what the app shows now):\n" + inv}]
    t0 = time.time()
    r = ollama("/api/chat", {"model": MODEL, "messages": messages, "stream": False, "format": SCHEMA, "think": False,
                             "options": {"temperature": 0.2, "num_ctx": CTX}})
    ms = round((time.time() - t0) * 1000)
    content = (r.get("message") or {}).get("content", "")
    try: reply = json.loads(content)
    except ValueError: raise BrokerError(502, "the model's answer was not JSON: %s" % content[:200])
    out = validate(reply if isinstance(reply, dict) else {})
    out.update(ms=ms, model=MODEL)
    log({"at": time.strftime("%Y-%m-%dT%H:%M:%S"), "text": text if LOG_TEXT else None, "say": out["say"], "verbs": out["verbs"],
         "notebook": out.get("notebook"), "raw": None if reply == out else content[:2000], "ms": ms, "model": MODEL})
    return out

def log(row):
    try:
        os.makedirs(LOG_DIR, exist_ok=True)
        with open(LOG, "a", encoding="utf-8") as f: f.write(json.dumps(row, ensure_ascii=False) + "\n")
    except OSError as e: print("log: %s" % e, file=sys.stderr, flush=True)

# ── HTTP ────────────────────────────────────────────────────────────────────────────────────────────────────────────
class H(http.server.BaseHTTPRequestHandler):
    timeout = HANDSHAKE_S
    server_version = "lambdawaves-gemma/0.6.6"
    def setup(self):
        self.request.settimeout(HANDSHAKE_S)               # the handshake in this connection's thread (server.py's lesson)
        try: self.request.do_handshake()
        except (ssl.SSLError, OSError, ValueError): raise ConnectionAbortedError("tls handshake failed or timed out")
        super().setup()
        self.request.settimeout(TIMEOUT_S + 10)
    def origin_ok(self):
        o = self.headers.get("Origin")
        if o is None: return True                               # not a browser page (curl, the replay tool)
        return o.rstrip("/") in ORIGINS or (urllib.parse.urlsplit(o).hostname or "").lower() in ORIGIN_HOSTS
    def cors(self):
        if not self.headers.get("Origin") or not self.origin_ok(): return
        self.send_header("Access-Control-Allow-Origin", self.headers["Origin"]); self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Private-Network", "true")
    def send(self, status, obj):
        b = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status); self.cors()
        self.send_header("Content-Type", "application/json; charset=utf-8"); self.send_header("Content-Length", str(len(b)))
        self.send_header("Cache-Control", "no-store"); self.end_headers(); self.wfile.write(b)
    def route(self): return self.path.split("?", 1)[0]
    def do_OPTIONS(self):
        if not self.origin_ok(): self.send(403, {"error": "origin not allowed (GEMMA_ORIGINS)"}); return
        self.send_response(204); self.cors(); self.send_header("Access-Control-Max-Age", "600"); self.end_headers()
    def do_GET(self):
        if self.route() == "/health": self.send(200, health())
        else: self.send(404, {"error": "only POST /ask (and GET /health)"})
    def do_POST(self):
        if self.route() != "/ask": self.send(404, {"error": "only POST /ask (and GET /health)"}); return
        if not self.origin_ok(): self.send(403, {"error": "origin not allowed (GEMMA_ORIGINS)"}); return
        if not BUSY.acquire(blocking=False): self.send(429, {"error": "two asks are already running"}); return
        try: self.answer()
        finally: BUSY.release()
    def answer(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n <= 0 or n > MAX_BODY: self.send(413 if n > MAX_BODY else 400, {"error": "a body of 1 byte to %d KiB" % (MAX_BODY // 1024)}); return
        try: body = json.loads(self.rfile.read(n).decode("utf-8"))
        except ValueError: self.send(400, {"error": "the body is not JSON"}); return
        try: self.send(200, ask(body if isinstance(body, dict) else {}))
        except BrokerError as e: self.send(e.status, {"error": e.error})
    def log_message(self, fmt, *a):
        sys.stderr.write("%s %s — %s\n" % (self.client_address[0], self.log_date_time_string(), fmt % a)); sys.stderr.flush()

class Server(http.server.ThreadingHTTPServer):
    daemon_threads = True
    def handle_error(self, request, client_address):
        t = sys.exc_info()[0]
        if t is None or issubclass(t, (ConnectionAbortedError, ConnectionResetError, BrokenPipeError, TimeoutError, ssl.SSLError)): return
        super().handle_error(request, client_address)

if __name__ == "__main__":
    cert, key = cert_pair()
    httpd = Server((HOST, PORT), H)
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER); ctx.load_cert_chain(cert, key)
    httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True, do_handshake_on_connect=False)
    print("λWAVES gemma broker on https://%s:%d/ask -> %s (%s) · verbs from %s · prompt %d chars"
          % (HOST, PORT, OLLAMA, MODEL, SOURCE, len(SYSTEM)), flush=True)
    if HOST not in ("127.0.0.1", "localhost", "::1"):
        print("LAN OPT-IN: bound to %s — anyone on this network can ask (browser pages only from %s)"
              % (HOST, ", ".join(sorted(ORIGIN_HOSTS | ORIGINS))), flush=True)
    httpd.serve_forever()
