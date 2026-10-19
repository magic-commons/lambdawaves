"""pubchem.py — the catalogue's PubChem PUG REST calls, batched (≤ 100 CIDs a request), cached (common.fetch), ≤ 2.2 req/s.
PubChem data: public domain (NCBI), computed properties and 3-D conformers by PubChem (OpenEye OMEGA, MMFF94s).

CACHE FIRST, CID BY CID (iteration 006 C7; C4 did it for cache-only runs).  A batched answer is cached under its exact list of CIDs,
so a catalogue that gains or loses rows shifts every later batch.  Every batched call now first answers each CID (or InChIKey) from
EVERY cached answer of the same URL — the answer for a CID is the same whichever batch carried it; the first cached one is taken —
and knows which CIDs were already SETTLED: every CID of a 200 answer's request (a CID it carries no record for has none: no 3-D
conformer, no synonym), and a single CID's 404.  Only the CIDs never asked go to PubChem, in new batches.  So a widened catalogue
asks PubChem only for its new molecules, and a re-run asks nothing.

PENDING (C7).  When the run is cache-only — LW_OFFLINE=1, or common.stop() after PubChem's own status went Red or Black — a CID or
a name never asked is not "absent": it is PENDING[kind], so build.py can hold its row back as pending (a calm run fills it) instead
of calling it missing or building a local geometry for it."""
import collections, gzip, json, os, sys, urllib.parse
sys.path.insert(0, os.path.dirname(__file__))
import common as C
from common import PUG, fetch, fetch_json, chunks

PROPS = ('MolecularFormula,MolecularWeight,ExactMass,SMILES,ConnectivitySMILES,InChI,InChIKey,IUPACName,XLogP,TPSA,'
         'HBondDonorCount,HBondAcceptorCount,RotatableBondCount,Complexity,HeavyAtomCount,Charge,Title,CovalentUnitCount,'
         'IsotopeAtomCount')
PENDING = collections.defaultdict(set)                              # kind → the CIDs / names / keys a cache-only run could not answer

def _get(url, body=None, raw=False, soft=False, refresh=False):
    """fetch through the cache; a block (common.Blocked) turns the run cache-only and answers 0, like a cache-only miss"""
    try: return fetch(url, body, soft=soft, refresh=refresh) if raw else fetch_json(url, body, soft=soft, refresh=refresh)
    except C.Blocked as b:
        C.stop(str(b)); return 0, None if not raw else b''

def _miss(st): return st == 0 and C.OFFLINE

def _ids(body, field, cast):
    v = urllib.parse.parse_qs(body or '').get(field)
    return [cast(x) for x in v[0].split(',') if x] if v else []

_INDEX = {}
def _index(url, parse, field='cid', cast=int, settle_404_batch=False, trust_404=True):
    """(answers by id, settled ids) from every cached answer of `url` — see the module's head"""
    if url not in _INDEX:
        out, settled = {}, set()
        for body, status, blob in C.db().execute('SELECT body, status, data FROM http WHERE url=? ORDER BY rowid', (url,)):
            ids = _ids(body, field, cast)
            if status == 200:
                got = {}
                try: parse(gzip.decompress(blob), got)
                except (ValueError, KeyError, UnicodeDecodeError): continue
                for k, v in got.items(): out.setdefault(k, v)
                settled.update(ids)
            elif trust_404 and status in (400, 404) and (len(ids) == 1 or (status == 404 and settle_404_batch)): settled.update(ids)
        _INDEX[url] = (out, settled)
    return _INDEX[url]

def _parse_props(b, out):
    for p in json.loads(b)['PropertyTable']['Properties']: out[p['CID']] = p
def _parse_keys(b, out):
    for p in json.loads(b)['PropertyTable']['Properties']: out.setdefault(p['InChIKey'], []).append(p['CID'])
def _parse_synonyms(b, out):
    for i in json.loads(b)['InformationList']['Information']: out[i['CID']] = i.get('Synonym', [])
def _parse_descriptions(b, out):
    for i in json.loads(b).get('InformationList', {}).get('Information', []):
        if i.get('Description'):
            out.setdefault(i['CID'], []).append({'text': i['Description'], 'source': i.get('DescriptionSourceName', ''), 'url': i.get('DescriptionURL', '')})
def _parse_sdf(b, out):
    for rec in b.decode('utf-8', 'replace').split('$$$$'):
        rec = rec.strip('\n')
        if not rec.strip(): continue
        lines = rec.split('\n')
        try: cid = int(lines[lines.index('> <PUBCHEM_COMPOUND_CID>') + 1])
        except (ValueError, IndexError): continue
        out[cid] = rec + '\n$$$$\n'

def _batched(kind, url, ids, n, parse, field='cid', fallback_one=True, settle_404_batch=False, soft=False, cast=int, trust_404=True):
    """{id: answer} for `ids`: the cache first (by id), then PubChem in batches of n for the ids never asked; a non-200 batch is asked
    again one id at a time (fallback_one), or — settle_404_batch — a 404 batch settles all its ids as having no answer"""
    idx, settled = _index(url, parse, field, cast, settle_404_batch, trust_404)
    want = sorted(set(ids))
    out = {i: idx[i] for i in want if i in idx}
    todo = [i for i in want if i not in idx and i not in settled]
    def one_round(batch):
        if C.OFFLINE: PENDING[kind].update(batch); return
        raw = parse is _parse_sdf
        st, d = _get(url, body={field: ','.join(map(str, batch))}, raw=raw, soft=soft, refresh=not trust_404)   # an untrusted cached 404 is asked again
        if _miss(st): PENDING[kind].update(batch); return
        if st == 200:
            got = {}
            try: parse(d if raw else json.dumps(d).encode(), got)
            except (ValueError, KeyError): got = {}
            for k, v in got.items():
                idx.setdefault(k, v)
                if k in batch or not isinstance(k, int): out.setdefault(k, idx[k])
            settled.update(batch)
            return
        if st in (400, 404) and (len(batch) == 1 or settle_404_batch): settled.update(batch); return   # PubChem's own "none"
        if len(batch) > 1 and fallback_one:
            for i in batch: one_round([i])
        else: PENDING[kind].update(batch)                            # a busy answer that outlasted its tries: ask again another day
    for ch in chunks(todo, n): one_round(ch)
    return out

def name_cids(name):
    """the CIDs PubChem's name service answers for `name` (first = its best match); [] when it knows none"""
    st, d = _get(f'{PUG}/compound/name/cids/JSON', body={'name': name})
    if _miss(st): PENDING['names'].add(name); return []
    return (d or {}).get('IdentifierList', {}).get('CID', []) if st == 200 else []

def smiles_cid(smiles):
    st, d = _get(f'{PUG}/compound/smiles/cids/JSON', body={'smiles': smiles})
    if _miss(st): PENDING['smiles'].add(smiles); return None
    cids = (d or {}).get('IdentifierList', {}).get('CID', []) if st == 200 else []
    return cids[0] if cids and cids[0] else None

def inchikey_cids(keys):
    """{InChIKey: [CID, …] ascending} for every key PubChem knows"""
    got = _batched('inchikeys', f'{PUG}/compound/inchikey/property/InChIKey/JSON', keys, 100, _parse_keys, field='inchikey', cast=str)
    return {k: sorted(set(v)) for k, v in got.items() if k in set(keys)}

def parent_cid(cid):
    """PubChem's own 'parent' (salt-stripped, neutralised) CID, or None — a nicety, so a refusal is not fatal"""
    st, d = _get(f'{PUG}/compound/cid/{cid}/cids/JSON?cids_type=parent', soft=True)
    if _miss(st): PENDING['parents'].add(cid); return None
    cids = (d or {}).get('IdentifierList', {}).get('CID', []) if st == 200 else []
    return cids[0] if cids else None

def properties(cids):
    return _batched('properties', f'{PUG}/compound/cid/property/{PROPS}/JSON', cids, 100, _parse_props)

def synonyms(cids):
    return _batched('synonyms', f'{PUG}/compound/cid/synonyms/JSON', cids, 50, _parse_synonyms, soft=True)

def conformers(cids):
    """{CID: SDF text of PubChem's default 3-D conformer} — CIDs without one are simply absent (a 404 batch: none of them has one)"""
    return _batched('conformers', f'{PUG}/compound/cid/SDF?record_type=3d', cids, 50, _parse_sdf, fallback_one=False,
                    settle_404_batch=True, soft=True)

def descriptions(cids):
    """{CID: [{text, source, url}, …]} — PubChem's compiled descriptions, batched; each carries its own source to attribute.
    A 404 is never trusted here (C7): it is not taken from the cache and does not settle a CID, so a calm run asks again.  The
    description service answers 404 when PubChem is loaded — the 404s cached on 2026-10-17 came as PubChem went Black, and asked
    again on 2026-10-18 the first such 50-CID batch (every CID a cached 404) answered 200 with 70 descriptions; on 2026-10-18 every
    batch asked in the minutes before PubChem said Black (16:10, 527 %) answered 404 too.  So a 404 batch is not asked again CID by
    CID (fifty requests into a loaded service): its CIDs stay PENDING for a calm run"""
    return _batched('descriptions', f'{PUG}/compound/cid/description/JSON', cids, 50, _parse_descriptions, soft=True, trust_404=False,
                    fallback_one=False)
