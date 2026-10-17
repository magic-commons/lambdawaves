"""tools/volumes/catalogue/common.py — the catalogue's shared plumbing (iteration 004, row CAT).

Every network answer is CACHED in one SQLite file (catalogue/cache/http.sqlite, keyed by method + URL + body), so a
re-run is offline and polite: a request is sent once, ever, unless --refresh asks again.  PubChem's etiquette is kept
(≤ 5 requests/s across the whole process, retry with backoff on 503/504/429 and on network errors).  Data lives in
~/Documents/LAMBDAWAVES-VOLUMES/catalogue/ and never in git.
"""
import gzip, hashlib, json, os, sqlite3, sys, time, urllib.error, urllib.parse, urllib.request

DATA = os.path.expanduser(os.environ.get('LW_CATALOGUE', '~/Documents/LAMBDAWAVES-VOLUMES/catalogue'))
CACHE = os.path.join(DATA, 'cache')
os.makedirs(CACHE, exist_ok=True)
UA = 'lambdawaves-catalogue/1 (offline research cache; https://github.com/)'
OFFLINE = os.environ.get('LW_OFFLINE') == '1'                     # a cache-only run: it asks nothing and never waits
PUG = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug'

_db = None
def db():
    global _db
    if _db is None:
        _db = sqlite3.connect(os.path.join(CACHE, 'http.sqlite'))
        _db.execute('CREATE TABLE IF NOT EXISTS http (k TEXT PRIMARY KEY, url TEXT, body TEXT, status INTEGER, data BLOB, at TEXT)')
    return _db

_last, _throttle = {}, {'note': None, 'pauses': 0}
MIN_GAP = {'pubchem.ncbi.nlm.nih.gov': 0.45, 'www.ebi.ac.uk': 0.15, 'default': 0.3}
def _pace(host):
    gap = MIN_GAP.get(host, MIN_GAP['default'])
    dt = time.time() - _last.get(host, 0)
    if dt < gap: time.sleep(gap - dt)
    _last[host] = time.time()

def _obey_throttle(headers):
    """PubChem states its own load in X-Throttling-Control; when it says Yellow or Red, wait before asking again."""
    note = headers.get('X-Throttling-Control') or ''
    _throttle['note'] = note or _throttle['note']
    if 'Red' in note or 'Black' in note: _throttle['pauses'] += 1; time.sleep(20)
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
        _pace(host)
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
            if status in (429, 500, 502, 503, 504):
                # PubChem answers a rate block with "too many requests per second or blacklisted": wait it out, do not hammer
                time.sleep(120 if b'blacklist' in data.lower() else min(120, 5 * 2 ** attempt)); continue
        except Exception as e:                                        # a network hiccup: back off and ask again
            print(f'  ! {type(e).__name__} {url[:90]} — try {attempt + 1}', file=sys.stderr)
            time.sleep(min(120, 4 * 2 ** attempt)); continue
        db().execute('INSERT OR REPLACE INTO http VALUES (?,?,?,?,?,?)',
                     (k, url, body, status, gzip.compress(data), time.strftime('%Y-%m-%dT%H:%M:%S')))
        db().commit()
        return status, data
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

def read_json(path):
    with open(path) as f: return json.load(f)

def chunks(seq, n):
    seq = list(seq)
    for i in range(0, len(seq), n): yield seq[i:i + n]
