"""pubchem.py — the catalogue's PubChem PUG REST calls, batched (≤ 100 CIDs a request), cached (common.fetch), ≤ 5 req/s.
PubChem data: public domain (NCBI), computed properties and 3-D conformers by PubChem (OpenEye OMEGA, MMFF94s)."""
import gzip, json, os, sys, urllib.parse
sys.path.insert(0, os.path.dirname(__file__))
import common as C
from common import PUG, fetch, fetch_json, chunks

PROPS = ('MolecularFormula,MolecularWeight,ExactMass,SMILES,ConnectivitySMILES,InChI,InChIKey,IUPACName,XLogP,TPSA,'
         'HBondDonorCount,HBondAcceptorCount,RotatableBondCount,Complexity,HeavyAtomCount,Charge,Title,CovalentUnitCount,'
         'IsotopeAtomCount')

# OFFLINE, CID BY CID (iteration 006 C4).  A batched answer is cached under its exact list of CIDs, so a catalogue that loses or gains
# a row shifts every later batch: offline, each shifted batch misses (fetch answers 0) and the one-CID retries miss too — the first C4
# rebuild, ten rows lighter, lost the synonyms of 6,318 rows that way.  A cache-only run now answers a missed batch from EVERY cached
# answer of the same URL, by CID (the answer for a CID is the same whichever batch carried it; the first cached one is taken).
_INDEX = {}
def _cached_by_cid(url, parse):
    if url not in _INDEX:
        out = {}
        for (blob,) in C.db().execute('SELECT data FROM http WHERE url=? AND status=200 ORDER BY rowid', (url,)):
            got = {}
            try: parse(gzip.decompress(blob), got)
            except (ValueError, KeyError, UnicodeDecodeError): continue
            for k, v in got.items(): out.setdefault(k, v)
        _INDEX[url] = out
    return _INDEX[url]
def _offline_miss(st):
    return st == 0 and C.OFFLINE
def _parse_props(b, out):
    for p in json.loads(b)['PropertyTable']['Properties']: out[p['CID']] = p
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

def name_cids(name):
    """the CIDs PubChem's name service answers for `name` (first = its best match); [] when it knows none"""
    st, d = fetch_json(f'{PUG}/compound/name/cids/JSON', body={'name': name})
    return (d or {}).get('IdentifierList', {}).get('CID', []) if st == 200 else []

def smiles_cid(smiles):
    st, d = fetch_json(f'{PUG}/compound/smiles/cids/JSON', body={'smiles': smiles})
    cids = (d or {}).get('IdentifierList', {}).get('CID', []) if st == 200 else []
    return cids[0] if cids and cids[0] else None

def inchikey_cids(keys):
    """{InChIKey: [CID, …] ascending} for every key PubChem knows"""
    out = {}
    for ch in chunks(sorted(set(keys)), 100):
        st, d = fetch_json(f'{PUG}/compound/inchikey/property/InChIKey/JSON', body={'inchikey': ','.join(ch)})
        if st != 200:  # one bad key fails the batch: fall back to one at a time
            if len(ch) == 1: continue
            for k in ch: out.update(inchikey_cids([k]))
            continue
        for p in d['PropertyTable']['Properties']: out.setdefault(p['InChIKey'], []).append(p['CID'])
    return {k: sorted(v) for k, v in out.items()}

def parent_cid(cid):
    """PubChem's own 'parent' (salt-stripped, neutralised) CID, or None — a nicety, so a refusal is not fatal"""
    st, d = fetch_json(f'{PUG}/compound/cid/{cid}/cids/JSON?cids_type=parent', soft=True)
    cids = (d or {}).get('IdentifierList', {}).get('CID', []) if st == 200 else []
    return cids[0] if cids else None

def properties(cids):
    out = {}
    for ch in chunks(sorted(set(cids)), 100):
        url = f'{PUG}/compound/cid/property/{PROPS}/JSON'
        st, d = fetch_json(url, body={'cid': ','.join(map(str, ch))})
        if _offline_miss(st):
            idx = _cached_by_cid(url, _parse_props); out.update({c: idx[c] for c in ch if c in idx}); continue
        if st != 200:
            if len(ch) == 1: continue
            for c in ch: out.update(properties([c]))
            continue
        for p in d['PropertyTable']['Properties']: out[p['CID']] = p
    return out

def synonyms(cids):
    out = {}
    for ch in chunks(sorted(set(cids)), 50):
        url = f'{PUG}/compound/cid/synonyms/JSON'
        st, d = fetch_json(url, body={'cid': ','.join(map(str, ch))}, soft=True)
        if _offline_miss(st):
            idx = _cached_by_cid(url, _parse_synonyms); out.update({c: idx[c] for c in ch if c in idx}); continue
        if st != 200:
            if len(ch) == 1: continue
            for c in ch: out.update(synonyms([c]))
            continue
        for i in d['InformationList']['Information']: out[i['CID']] = i.get('Synonym', [])
    return out

def conformers(cids):
    """{CID: SDF text of PubChem's default 3-D conformer} — CIDs without one are simply absent"""
    out = {}
    for ch in chunks(sorted(set(cids)), 50):
        url = f'{PUG}/compound/cid/SDF?record_type=3d'
        st, data = fetch(url, body={'cid': ','.join(map(str, ch))}, soft=True)
        if _offline_miss(st):
            idx = _cached_by_cid(url, _parse_sdf); out.update({c: idx[c] for c in ch if c in idx}); continue
        if st != 200: continue
        _parse_sdf(data, out)
    return out

def descriptions(cids):
    """{CID: [{text, source, url}, …]} — PubChem's compiled descriptions, batched; each carries its own source to attribute"""
    out = {}
    for ch in chunks(sorted(set(cids)), 50):
        url = f'{PUG}/compound/cid/description/JSON'
        st, d = fetch_json(url, body={'cid': ','.join(map(str, ch))}, soft=True)
        if _offline_miss(st):
            idx = _cached_by_cid(url, _parse_descriptions); out.update({c: idx[c] for c in ch if c in idx}); continue
        if st != 200:
            if len(ch) == 1: continue
            for c in ch: out.update(descriptions([c]))
            continue
        for i in d.get('InformationList', {}).get('Information', []):
            if i.get('Description'):
                out.setdefault(i['CID'], []).append({'text': i['Description'], 'source': i.get('DescriptionSourceName', ''), 'url': i.get('DescriptionURL', '')})
    return out
