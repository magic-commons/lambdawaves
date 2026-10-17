"""fetch_chembl.py — MEDICINE: every ChEMBL approved small-molecule drug (max_phase 4, molecule_type 'Small molecule'),
its ATC codes, and its PARENT (the salt-free, neutral form ChEMBL's molecule_hierarchy names), through the EBI ChEMBL
REST API (CC BY-SA 3.0).  Writes catalogue/cache/chembl/approved.json: one row per parent, the ATC codes and synonyms of
every approved form merged onto it.  Cached (common.fetch): a re-run asks nothing."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from common import CACHE, fetch_json, write_json, chunks

API = 'https://www.ebi.ac.uk/chembl/api/data/molecule.json'
ONLY = ('molecule_chembl_id,pref_name,atc_classifications,molecule_hierarchy,molecule_structures,molecule_properties,'
        'max_phase,molecule_type,first_approval,natural_product,oral,topical,parenteral,withdrawn_flag,inorganic_flag,'
        'polymer_flag,molecule_synonyms,prodrug,therapeutic_flag')
out_dir = os.path.join(CACHE, 'chembl'); os.makedirs(out_dir, exist_ok=True)

def page_all(params):
    rows, offset = [], 0
    while True:
        st, d = fetch_json(f'{API}?{params}&limit=1000&offset={offset}&only={ONLY}')
        if st != 200: raise SystemExit(f'ChEMBL answered {st}')
        rows += d['molecules']
        if not d['page_meta']['next']: return rows
        offset += 1000

approved = page_all('max_phase=4&molecule_type=Small%20molecule')
print('approved small molecules:', len(approved))
by_id = {m['molecule_chembl_id']: m for m in approved}
parent_of = lambda m: ((m.get('molecule_hierarchy') or {}).get('parent_chembl_id') or m['molecule_chembl_id'])
missing = sorted({parent_of(m) for m in approved} - set(by_id))
print('parents not themselves in the approved list:', len(missing))
for ch in chunks(missing, 50):
    st, d = fetch_json(f'{API}?molecule_chembl_id__in={",".join(ch)}&limit=1000&only={ONLY}')
    for m in d['molecules']: by_id[m['molecule_chembl_id']] = m

parents = {}
for m in approved:
    pid = parent_of(m); p = by_id.get(pid)
    if p is None: continue
    row = parents.setdefault(pid, {'chembl': pid, 'pref_name': p.get('pref_name'), 'structures': p.get('molecule_structures'),
                                   'properties': p.get('molecule_properties'), 'parent_max_phase': p.get('max_phase'),
                                   'parent_type': p.get('molecule_type'), 'natural_product': p.get('natural_product'),
                                   'first_approval': None, 'withdrawn': False, 'atc': set(), 'atcForms': set(), 'synonyms': [], 'forms': [],
                                   'inorganic': p.get('inorganic_flag'), 'polymer': p.get('polymer_flag')})
    row['forms'].append(m['molecule_chembl_id'])
    # ONLY the parent's own ATC codes, and never a COMBINATION code (the WHO's 5th level 50 and up is "this drug with
    # another"): merging every approved form's codes made paracetamol a heart drug and aspirin an antibiotic.
    row['atc'] |= {c for c in (p.get('atc_classifications') or []) if not (len(c) >= 7 and c[5:7].isdigit() and int(c[5:7]) >= 50)}
    row['atcForms'] |= set(m.get('atc_classifications') or []) | set(p.get('atc_classifications') or [])
    fa = m.get('first_approval')
    if fa and (row['first_approval'] is None or fa < row['first_approval']): row['first_approval'] = fa
    row['withdrawn'] = row['withdrawn'] or bool(m.get('withdrawn_flag'))
    for s in (p.get('molecule_synonyms') or []) + (m.get('molecule_synonyms') or []):
        n = s.get('molecule_synonym') or s.get('synonyms')
        if n and s.get('syn_type') in ('INN', 'USAN', 'BAN', 'JAN', 'FDA', 'OTHER', 'TRADE_NAME', 'USP', 'BNF', 'MERCK_INDEX', 'ATC') and n not in row['synonyms']:
            row['synonyms'].append(n)
for r in parents.values(): r['atc'], r['atcForms'] = sorted(r['atc']), sorted(r['atcForms'])
write_json(os.path.join(out_dir, 'approved.json'), {'source': 'ChEMBL ' + (fetch_json('https://www.ebi.ac.uk/chembl/api/data/status.json')[1] or {}).get('chembl_db_version', '?'),
                                                    'licence': 'CC BY-SA 3.0', 'parents': list(parents.values())}, indent=0)
print('parents written:', len(parents), '· with ATC:', sum(1 for r in parents.values() if r['atc']))
