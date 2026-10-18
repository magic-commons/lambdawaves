"""check.py — the gate on <catalogue>/vol-1.candidates.json: it refuses a file the solver could not trust.

  python -I tools/volumes/catalogue/check.py [FILE] [--against PREV] [--raw DIR] [--allow-moved]
      (exit 0 = every row holds; it prints every complaint it has; FILE defaults to <catalogue>/vol-1.candidates.json)

THE LAWS CHECKED, row by row: every field of PLAN.md's `meta` present and of the right kind · a unique id and a unique
InChIKey · an id the solver takes as a file name ([A-Za-z0-9._+-], ≤ 80) · 1–4 tags, each from PLAN.md's vocabulary · every
element H–Kr · an even electron count (a closed shell) and multiplicity 1 · ≤ 50 heavy atoms (an app molecule may be bigger and
is listed as such) · the geometry: the stated element multiset, no two nuclei closer than 0.5 Å, every atom bonded to something
within 2.6 Å (3.6 Å for a metal or a cluster), a finite coordinate · heavy and nAtoms agreeing with atomsAng · a blurb with a
source · a unique priority, the app's own first.

THE GUARDS (iteration 006 C2, guards.py), with --against PREV (the file the solvers run on now): every id of PREV present, naming
the same InChIKey (a previous row a SAFETY SCREEN now refuses is named, not passed in silence) · no id pointing at a raw/<id>/ that
holds another molecule's solve · every row with a converged rung in raw/ (--raw, default the catalogue's sibling raw/) at EXACTLY
the atoms it was solved at — the solver's own test, float(Å) × ANGSTROM == meta.json's atomsBohr — except, with --allow-moved, the
rows a --refresh-geometry build LISTED in its stats (guards.solvedRowsMoved): each of them must have moved, onto a PubChem-based
geometry, and none may be an app row; any other solved row that moved is still a complaint (iteration 006 C3).
"""
import collections, json, math, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from common import DATA, read_json, sibling
import guards as GU

def _arg(flag):
    return next((sys.argv[i + 1] for i, a in enumerate(sys.argv) if a == flag and i + 1 < len(sys.argv)), None)
_flags = {'--against', '--raw'}
_pos = [a for i, a in enumerate(sys.argv[1:], 1) if not a.startswith('--') and sys.argv[i - 1] not in _flags]
FILE = os.path.expanduser(_pos[0]) if _pos else os.path.join(DATA, 'vol-1.candidates.json')
AGAINST, RAW = _arg('--against'), _arg('--raw') or GU.raw_dir(DATA)

# iteration 006 C5 (Josh, 2026-10-18: "tags related to the molecules structure or class"): WHAT THE MOLECULE IS — PLAN.md's TAGS,
# structure_tags.py's VOCAB (written out here again on purpose: the gate does not take the build's word for its own vocabulary)
VOCAB = set(['peptide', 'nucleotide', 'nucleoside', 'nucleobase', 'steroid', 'amino acid', 'sugar', 'alkaloid', 'terpene', 'fat',
             'metal', 'ion', 'cage', 'inorganic',
             'nitro', 'nitrile', 'alkyne', 'aldehyde', 'phenol', 'ester', 'amide', 'ketone', 'acid', 'amine', 'alcohol', 'ether',
             'halogen', 'phosphorus', 'sulfur', 'alkene', 'alkane',
             'heterocycle', 'aromatic', 'ring', 'chain'])
FIELDS = ['id', 'name', 'iupac', 'synonyms', 'formula', 'charge', 'multiplicity', 'cid', 'inchi', 'inchikey', 'smiles', 'mw',
          'exactMass', 'heavy', 'nAtoms', 'xlogp', 'tpsa', 'hbd', 'hba', 'rotatable', 'complexity', 'tags', 'blurb', 'blurbSource',
          'atomsAng', 'geometrySource', 'sources', 'priority']
METALS = {3, 4, 11, 12, 13, 19, 20, *range(21, 32)}
doc = read_json(FILE)
bad = collections.Counter(); says = []
def fail(row, what):
    bad[what] += 1
    if bad[what] <= 4: says.append(f'  {what}: {row.get("id")} ({row.get("name")})')
ids, keys, prios, app_rows = set(), set(), [], []
for m in doc['molecules']:
    for f in FIELDS:
        if f not in m: fail(m, f'missing field {f}')
    if m['id'] in ids: fail(m, 'a repeated id')
    if not GU.ID_OK(m['id']): fail(m, 'an id the solver will not take as a file name')
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
guard_notes = []
if AGAINST:                                                         # THE GUARDS: the new file against the one the solvers run on
    prev_by_id = GU.previous(os.path.expanduser(AGAINST))[0]
    ex_path = sibling(FILE, 'excluded')
    excluded = read_json(ex_path)['rows'] if os.path.exists(ex_path) else []
    S = GU.solved(RAW)
    chosen = []
    if '--allow-moved' in sys.argv:                                # the rows the --refresh-geometry build itself listed, and only those
        st_path = sibling(FILE, 'stats')
        chosen = (read_json(st_path).get('guards') or {}).get('solvedRowsMoved', []) if os.path.exists(st_path) else []
        if not chosen: bad['--allow-moved, but the build listed no moved row (its stats: guards.solvedRowsMoved)'] += 1
    gbad, guard_notes = GU.verify(doc, prev_by_id, S, excluded, allow_moved=chosen)
    guard_notes.append(f'{len(S)} ids with a converged rung in {RAW}')
    for what, s in gbad:
        bad[what] += 1
        if bad[what] <= 8: says.append(f'  {what}: {s}')
print(f'{FILE}: {len(doc["molecules"])} rows checked · {sum(bad.values())} complaints')
for s in guard_notes: print('  guards: ' + s)
for k, v in bad.most_common(): print(f'  {v:6d}  {k}')
for s in says[:60]: print(s)
sys.exit(1 if bad else 0)
