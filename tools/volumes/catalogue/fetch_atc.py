"""fetch_atc.py — the WHO ATC classification as ChEMBL serves it (CC BY-SA 3.0): every level-5 code with the words of its
level-4 group, so an approved medicine's blurb can say what the medicine is FOR in the WHO's own words.  Cached."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from common import CACHE, fetch_json, write_json
rows, offset = {}, 0
while True:
    st, d = fetch_json(f'https://www.ebi.ac.uk/chembl/api/data/atc_class.json?limit=1000&offset={offset}')
    if st != 200: raise SystemExit(f'ChEMBL answered {st}')
    for r in d['atc']:
        rows[r['level5']] = {'who_name': r.get('who_name'), 'l4': r.get('level4_description'), 'l3': r.get('level3_description'),
                             'l2': r.get('level2_description'), 'l1': r.get('level1_description')}
    if not d['page_meta']['next']: break
    offset += 1000
os.makedirs(os.path.join(CACHE, 'chembl'), exist_ok=True)
write_json(os.path.join(CACHE, 'chembl', 'atc.json'), rows)
print('ATC codes:', len(rows))
