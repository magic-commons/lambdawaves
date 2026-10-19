"""tools/volumes/catalogue/common.py — the catalogue's shared plumbing (iteration 004, row CAT).

Every network answer is CACHED in one SQLite file (catalogue/cache/http.sqlite, keyed by method + URL + body), so a
re-run is offline and polite: a request is sent once, ever, unless --refresh asks again.  PubChem's etiquette is kept
(≤ 2.2 requests/s to PubChem — MIN_GAP — and its X-Throttling-Control obeyed; retry with backoff on 503/504/429 and on network
errors).  A BLOCK stops the run (iteration 006 C2): PubChem's blacklist answer, a 'Black' throttling state, or three PubChem
requests in a row that exhaust their tries raise Blocked, so a blocked machine is never asked again in a loop; every answer
already received is in the cache, so the next run resumes from it.  Data lives in ~/Documents/LAMBDAWAVES-VOLUMES/catalogue/
and never in git.

ITERATION 006 C7: ≤ 2.2 requests/s to PubChem (MIN_GAP 0.46 s), and PubChem's OWN state ends the asking: when the 'Service status'
of X-Throttling-Control reads Red or Black (PubChem as a whole overloaded — not this machine's own request count, which only
pauses it) or any part reads Black, the answer in hand is cached and kept, and from then on the run is cache-only (OFFLINE, with
the reason in STOPPED): every later fetch answers "no answer" at once, so the build finishes from the cache and pubchem.py names
what is left pending for a calm run.
"""
import gzip, hashlib, json, os, re, sqlite3, sys, time, urllib.error, urllib.parse, urllib.request

DATA = os.path.expanduser(os.environ.get('LW_CATALOGUE', '~/Documents/LAMBDAWAVES-VOLUMES/catalogue'))
CACHE = os.path.join(DATA, 'cache')
os.makedirs(CACHE, exist_ok=True)
UA = 'lambdawaves-catalogue/1 (offline research cache; https://github.com/)'
OFFLINE = os.environ.get('LW_OFFLINE') == '1'                     # a cache-only run: it asks nothing and never waits
STOPPED = None                                                    # why an online run turned cache-only (C7: PubChem Red/Black, a block)
PUG = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug'

_db = None
def db():
    global _db
    if _db is None:
        _db = sqlite3.connect(os.path.join(CACHE, 'http.sqlite'))
        _db.execute('CREATE TABLE IF NOT EXISTS http (k TEXT PRIMARY KEY, url TEXT, body TEXT, status INTEGER, data BLOB, at TEXT)')
    return _db

class Blocked(RuntimeError):
    """PubChem has blocked (or is refusing) this machine: stop asking, report, and let the cache carry what was received"""

_last, _throttle, _exhausted = {}, {'note': None, 'pauses': 0, 'requests': 0}, {}
MIN_GAP = {'pubchem.ncbi.nlm.nih.gov': 0.46, 'www.ebi.ac.uk': 0.15, 'default': 0.3}   # PubChem: ≤ 2.2 requests a second (C7)

def stop(reason):
    """turn the run cache-only from here on (C7): nothing more is asked of the network; the cache answers, a miss is pending"""
    global OFFLINE, STOPPED
    if not STOPPED: print(f'  ! {time.strftime("%H:%M:%S")} PubChem: no more asking this run — {reason}', file=sys.stderr, flush=True)
    OFFLINE, STOPPED = True, STOPPED or reason
def _pace(host):
    gap = MIN_GAP.get(host, MIN_GAP['default'])
    dt = time.time() - _last.get(host, 0)
    if dt < gap: time.sleep(gap - dt)
    _last[host] = time.time()

def _obey_throttle(headers):
    """PubChem states its own load in X-Throttling-Control ('Request Count status: Green (4%), Request Time status: Green (3%),
    Service status: Green (20%)').  Black anywhere, or a Red SERVICE status (PubChem itself overloaded), stops the asking (C7: the
    answer in hand is still kept); this machine's own counts Red or Yellow only pause it."""
    note = headers.get('X-Throttling-Control') or ''
    _throttle['note'] = note or _throttle['note']
    service = re.search(r'Service status:\s*(\w+)', note)
    if 'Black' in note or (service and service.group(1) in ('Red', 'Black')):
        stop(f'PubChem says {service.group(1) if service else "Black"}: {note}'); return
    if 'Red' in note: _throttle['pauses'] += 1; time.sleep(20)
    elif 'Yellow' in note: time.sleep(2)

def fetch(url, body=None, refresh=False, tries=10, timeout=180, accept=None, soft=False):
    """GET (or POST when `body` is a dict/str) through the cache; returns (status, bytes).  A 400/404 is a cached answer.
    On 503 (PubChem's ServerBusy) it waits and asks again — up to `tries` times, the pause growing to two minutes; `soft`
    returns the failure to the caller instead of raising, for a call whose answer is a nicety rather than the row itself."""
    if isinstance(body, dict): body = urllib.parse.urlencode(body)
    k = hashlib.sha1(((body and 'POST ' or 'GET ') + url + '\n' + (body or '')).encode()).hexdigest()
    row = db().execute('SELECT status, data FROM http WHERE k=?', (k,)).fetchone()
    if row and not refresh: return row[0], gzip.decompress(row[1])
    if OFFLINE: return 0, b''                                     # LW_OFFLINE=1: the cache is the whole world; a miss is "no answer"
    host = urllib.parse.urlparse(url).netloc
    status, data = 0, b''
    for attempt in range(tries):
        if OFFLINE: return 0, b''                                     # stopped meanwhile (C7): nothing more is asked
        _pace(host)
        _throttle['requests'] += 1
        req = urllib.request.Request(url, data=body.encode() if body else None, headers={'User-Agent': UA, **({'Accept': accept} if accept else {})})
        if body: req.add_header('Content-Type', 'application/x-www-form-urlencoded')
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                status, data = r.status, r.read()
                _obey_throttle(r.headers)
        except urllib.error.HTTPError as e:
            status, data = e.code, e.read()
            try: _obey_throttle(e.headers)
            except Exception: pass
            if status in (429, 503) and b'blacklist' in data.lower():
                stop(f'PubChem blocked this machine ({status})')
                raise Blocked(f'PubChem blocked this machine ({status}): {data[:200]!r}')
            if status in (429, 500, 502, 503, 504):
                # a plain busy answer: back off and ask again (a blacklist answer has already stopped the run above)
                time.sleep(min(120, 5 * 2 ** attempt)); continue
        except Blocked: raise
        except Exception as e:                                        # a network hiccup: back off and ask again
            print(f'  ! {type(e).__name__} {url[:90]} — try {attempt + 1}', file=sys.stderr)
            time.sleep(min(120, 4 * 2 ** attempt)); continue
        db().execute('INSERT OR REPLACE INTO http VALUES (?,?,?,?,?,?)',
                     (k, url, body, status, gzip.compress(data), time.strftime('%Y-%m-%dT%H:%M:%S')))
        db().commit()
        _exhausted[host] = 0
        return status, data
    _exhausted[host] = _exhausted.get(host, 0) + 1
    if _exhausted[host] >= 3:
        stop(f'{host}: three requests in a row gave up after {tries} tries ({status})')
        raise Blocked(f'{host}: three requests in a row gave up after {tries} tries ({status}) — treated as a block')
    if soft: return status or 503, data
    raise RuntimeError(f'gave up after {tries} tries ({status}): {url}')

def fetch_json(url, body=None, **kw):
    status, data = fetch(url, body, **kw)
    if status != 200: return status, None
    return status, json.loads(data)

def write_json(path, obj, indent=None):
    tmp = path + '.tmp'
    with open(tmp, 'w') as f: json.dump(obj, f, ensure_ascii=False, indent=indent)
    os.replace(tmp, path)

def sibling(candidates_path, kind):
    """the stats / excluded file that goes with a candidates file: vol-1.candidates.next.json → vol-1.stats.next.json"""
    d, b = os.path.split(candidates_path)
    return os.path.join(d, b.replace('candidates', kind) if 'candidates' in b else b.rsplit('.json', 1)[0] + f'.{kind}.json')

def read_json(path):
    with open(path) as f: return json.load(f)

def chunks(seq, n):
    seq = list(seq)
    for i in range(0, len(seq), n): yield seq[i:i + n]
