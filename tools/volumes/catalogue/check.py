"""check.py — the gate on <catalogue>/vol-1.candidates.json: it refuses a file the solver could not trust.

  python -I tools/volumes/catalogue/check.py        (exit 0 = every row holds; it prints every complaint it has)

THE LAWS CHECKED, row by row: every field of PLAN.md's `meta` present and of the right kind · a unique id and a unique
InChIKey · 1–4 tags, each from PLAN.md's vocabulary · every element H–Kr · an even electron count (a closed shell) and
multiplicity 1 · ≤ 50 heavy atoms (an app molecule may be bigger and is listed as such) · the geometry: the stated element
multiset, no two nuclei closer than 0.5 Å, every atom bonded to something within 2.6 Å (3.4 Å for a metal or a cluster),
a finite coordinate · heavy and nAtoms agreeing with atomsAng · a blurb with a source · a unique priority, the app's own first.
"""
import collections, json, math, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from common import DATA, read_json

VOCAB = set(['medicine', 'painkiller', 'antibiotic', 'antiviral', 'heart', 'mind', 'cancer', 'allergy', 'anaesthetic', 'vitamin',
             'hormone', 'neurotransmitter', 'amino acid', 'nucleobase', 'sugar', 'fat', 'steroid', 'alkaloid', 'food', 'flavour',
             'scent', 'sweetener', 'colour', 'solvent', 'fuel', 'plastic', 'material', 'metal', 'gas', 'atmosphere', 'pollutant',
             'toxin', 'pesticide', 'acid', 'aromatic', 'ring', 'cage', 'classic', 'natural', 'life'])
FIELDS = ['id', 'name', 'iupac', 'synonyms', 'formula', 'charge', 'multiplicity', 'cid', 'inchi', 'inchikey', 'smiles', 'mw',
          'exactMass', 'heavy', 'nAtoms', 'xlogp', 'tpsa', 'hbd', 'hba', 'rotatable', 'complexity', 'tags', 'blurb', 'blurbSource',
          'atomsAng', 'geometrySource', 'sources', 'priority']
METALS = {3, 4, 11, 12, 13, 19, 20, *range(21, 32)}
doc = read_json(os.path.join(DATA, 'vol-1.candidates.json'))
bad = collections.Counter(); says = []
def fail(row, what):
    bad[what] += 1
    if bad[what] <= 4: says.append(f'  {what}: {row.get("id")} ({row.get("name")})')
ids, keys, prios, app_rows = set(), set(), [], []
for m in doc['molecules']:
    for f in FIELDS:
        if f not in m: fail(m, f'missing field {f}')
    if m['id'] in ids: fail(m, 'a repeated id')
    ids.add(m['id'])
    if m['inchikey']:
        if m['inchikey'] in keys: fail(m, 'a repeated InChIKey')
        keys.add(m['inchikey'])
    if not (1 <= len(m['tags']) <= 4): fail(m, 'not 1–4 tags')
    if any(t not in VOCAB for t in m['tags']): fail(m, 'a tag outside the vocabulary')
    if len(set(m['tags'])) != len(m['tags']): fail(m, 'a repeated tag')
    if len(m['synonyms']) > 6: fail(m, 'more than six synonyms')
    if m['multiplicity'] != 1: fail(m, 'multiplicity is not 1')
    if not m['blurb'] or not m['blurbSource']: fail(m, 'no blurb')
    if not m['geometrySource']: fail(m, 'no geometry source')
    if not m['sources']: fail(m, 'no source')
    A = m['atomsAng']
    if not A: fail(m, 'no atoms'); continue
    Z = [a[0] for a in A]
    if any(z < 1 or z > 36 for z in Z): fail(m, 'an element outside H–Kr')
    if (sum(Z) - m['charge']) % 2: fail(m, 'an odd electron count')
    if m['nAtoms'] != len(A): fail(m, 'nAtoms disagrees with atomsAng')
    if m['heavy'] != sum(1 for z in Z if z > 1): fail(m, 'heavy disagrees with atomsAng')
    is_app = any(s.get('db') == 'λWAVES' for s in m['sources'])
    if is_app: app_rows.append(m['priority'])
    if m['heavy'] > 50 and not is_app: fail(m, 'more than 50 heavy atoms')
    if any(not all(isinstance(v, (int, float)) and math.isfinite(v) for v in a[1:]) for a in A): fail(m, 'a coordinate that is not finite'); continue
    far, near = 0, 0
    for i in range(len(A)):
        d = min((math.dist(A[i][1:], A[j][1:]) for j in range(len(A)) if j != i), default=0)
        lim = 3.6 if (Z[i] in METALS or any(z in METALS for z in Z)) else 2.6
        if len(A) > 1 and d > lim: far += 1
        if len(A) > 1 and d < 0.5: near += 1
    if near: fail(m, 'two nuclei closer than 0.5 Å')
    if far: fail(m, 'an atom with no neighbour inside the bonding limit')
    prios.append(m['priority'])
if len(set(prios)) != len(prios): bad['a repeated priority'] += 1
if app_rows and sorted(app_rows) != list(range(len(app_rows))): bad["the app's own are not the first block of priorities"] += 1
print(f'{len(doc["molecules"])} rows checked · {sum(bad.values())} complaints')
for k, v in bad.most_common(): print(f'  {v:6d}  {k}')
for s in says[:60]: print(s)
sys.exit(1 if bad else 0)
