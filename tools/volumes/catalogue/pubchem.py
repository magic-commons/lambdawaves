"""pubchem.py — the catalogue's PubChem PUG REST calls, batched (≤ 100 CIDs a request), cached (common.fetch), ≤ 5 req/s.
PubChem data: public domain (NCBI), computed properties and 3-D conformers by PubChem (OpenEye OMEGA, MMFF94s)."""
import json, os, sys, urllib.parse
sys.path.insert(0, os.path.dirname(__file__))
from common import PUG, fetch, fetch_json, chunks

PROPS = ('MolecularFormula,MolecularWeight,ExactMass,SMILES,ConnectivitySMILES,InChI,InChIKey,IUPACName,XLogP,TPSA,'
         'HBondDonorCount,HBondAcceptorCount,RotatableBondCount,Complexity,HeavyAtomCount,Charge,Title,CovalentUnitCount,'
         'IsotopeAtomCount')

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
        st, d = fetch_json(f'{PUG}/compound/cid/property/{PROPS}/JSON', body={'cid': ','.join(map(str, ch))})
        if st != 200:
            if len(ch) == 1: continue
            for c in ch: out.update(properties([c]))
            continue
        for p in d['PropertyTable']['Properties']: out[p['CID']] = p
    return out

def synonyms(cids):
    out = {}
    for ch in chunks(sorted(set(cids)), 50):
        st, d = fetch_json(f'{PUG}/compound/cid/synonyms/JSON', body={'cid': ','.join(map(str, ch))}, soft=True)
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
        st, data = fetch(f'{PUG}/compound/cid/SDF?record_type=3d', body={'cid': ','.join(map(str, ch))}, soft=True)
        if st != 200: continue
        for rec in data.decode('utf-8', 'replace').split('$$$$'):
            rec = rec.strip('\n')
            if not rec.strip(): continue
            lines = rec.split('\n')
            try: cid = int(lines[lines.index('> <PUBCHEM_COMPOUND_CID>') + 1])
            except (ValueError, IndexError): continue
            out[cid] = rec + '\n$$$$\n'
    return out

def descriptions(cids):
    """{CID: [{text, source, url}, …]} — PubChem's compiled descriptions, batched; each carries its own source to attribute"""
    out = {}
    for ch in chunks(sorted(set(cids)), 50):
        st, d = fetch_json(f'{PUG}/compound/cid/description/JSON', body={'cid': ','.join(map(str, ch))}, soft=True)
        if st != 200:
            if len(ch) == 1: continue
            for c in ch: out.update(descriptions([c]))
            continue
        for i in d.get('InformationList', {}).get('Information', []):
            if i.get('Description'):
                out.setdefault(i['CID'], []).append({'text': i['Description'], 'source': i.get('DescriptionSourceName', ''), 'url': i.get('DescriptionURL', '')})
    return out
