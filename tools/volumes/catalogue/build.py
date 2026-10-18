"""build.py — THE CATALOGUE (iteration 004, row CAT; PLAN.md THE PIPELINE step 1) → <catalogue>/vol-1.candidates.json

Run the six collectors first (each caches, so a re-run asks the network nothing):
  node   tools/volumes/catalogue/app-own.mjs        the app's own 98, at their pinned geometries
  python -I tools/volumes/catalogue/fetch_chembl.py  ChEMBL approved small-molecule drugs + ATC
  python -I tools/volumes/catalogue/fetch_atc.py     the ATC classification's own words
  python -I tools/volumes/catalogue/chebi.py         ChEBI 3-star roles and structural classes
  python -I tools/volumes/catalogue/fetch_wikidata.py  Wikidata: every compound with an English Wikipedia article
  python -I tools/volumes/catalogue/fetch_who_eml.py   the WHO Model List of Essential Medicines (names)
then
  python -I tools/volumes/catalogue/build.py [--limit=N] [--no-geometry] [--refresh-geometry] [--out=FILE] [--prev=FILE] [--raw=DIR]

Every nomination is resolved through PubChem (a name or an InChIKey → a CID → its record; a salt or a charged form → PubChem's
own PARENT), merged by InChIKey (one entry per key, tags and sources from every nomination), filtered, given a geometry
(geom.py) and tagged from PLAN.md's vocabulary ONLY.  The run's numbers go to <catalogue>/vol-1.stats.json, which report.py
turns into research/iteration-004/CAT-BUILD.md.

THE TWO GUARDS (iteration 006 C2; guards.py says why): (a) a row whose id has a converged rung under raw/<id>/ keeps the exact atoms
it was solved at, even when PubChem's conformer has since arrived — --refresh-geometry lifts this, and every solved row that then
moves is named in the log, because the solver will solve it again from STO-3G; (b) a row keeps the id the previous candidates file
(--prev, default the current <catalogue>/vol-1.candidates.json) gave its InChIKey, and a new row's slug collision takes the suffix,
never an old row.  --out writes the candidates (and its .stats/.excluded siblings) elsewhere — vol-1.candidates.next.json — so the
running solvers' file is replaced only after check.py has passed the new one (check.py FILE --against PREV).
"""
import collections, datetime, json, os, re, sys, time
sys.path.insert(0, os.path.dirname(__file__))
from common import DATA, CACHE, read_json, write_json, sibling
import common as C
import pubchem as P
import geom as G
import guards as GU
import curated as CUR
from app_tags import APP, APP_REFUSED
from rdkit import Chem, RDLogger
from rdkit.Chem import rdMolDescriptors as RD
from rdkit.Chem.MolStandardize import rdMolStandardize
RDLogger.DisableLog('rdApp.*')

VOL, TODAY = 'vol-1', datetime.date.today().isoformat()
LIMIT = int(next((a.split('=')[1] for a in sys.argv if a.startswith('--limit=')), 0))
GEOMETRY = '--no-geometry' not in sys.argv
REFRESH = '--refresh-geometry' in sys.argv
def _opt(name, default):
    v = next((a.split('=', 1)[1] for a in sys.argv if a.startswith(f'--{name}=')), None)
    return os.path.expanduser(v) if v else default
OUT = _opt('out', os.path.join(DATA, f'{VOL}.candidates.json'))
PREV = _opt('prev', os.path.join(DATA, f'{VOL}.candidates.json'))
RAW = _opt('raw', GU.raw_dir(DATA))
VOCAB = ['medicine', 'painkiller', 'antibiotic', 'antiviral', 'heart', 'mind', 'cancer', 'allergy', 'anaesthetic', 'vitamin', 'hormone',
         'neurotransmitter', 'amino acid', 'nucleobase', 'sugar', 'fat', 'steroid', 'alkaloid', 'food', 'flavour', 'scent', 'sweetener',
         'colour', 'solvent', 'fuel', 'plastic', 'material', 'metal', 'gas', 'atmosphere', 'pollutant', 'toxin', 'pesticide', 'acid',
         'aromatic', 'ring', 'cage', 'classic', 'natural', 'life']
# a tag's rank when a molecule carries more than four: what it IS FOR first, what it IS second, how it is BUILT last
TAG_RANK = {t: i for i, t in enumerate([
    'medicine', 'painkiller', 'antibiotic', 'antiviral', 'heart', 'mind', 'cancer', 'allergy', 'anaesthetic', 'vitamin', 'hormone',
    'neurotransmitter', 'toxin', 'pesticide', 'pollutant', 'sweetener', 'flavour', 'scent', 'colour', 'food', 'fuel', 'solvent',
    'plastic', 'material', 'atmosphere', 'amino acid', 'nucleobase', 'sugar', 'fat', 'steroid', 'alkaloid', 'life', 'natural',
    'metal', 'gas', 'acid', 'cage', 'aromatic', 'ring', 'classic'])}
ATC_TAGS = [('N02', 'painkiller'), ('M01', 'painkiller'), ('M02', 'painkiller'), ('N01', 'anaesthetic'), ('N03', 'mind'), ('N05', 'mind'),
            ('N06', 'mind'), ('N07', 'mind'), ('B01', 'heart'), ('C', 'heart'), ('J01', 'antibiotic'), ('J04', 'antibiotic'),
            ('J05', 'antiviral'), ('L01', 'cancer'), ('L02', 'cancer'), ('R06', 'allergy'), ('H', 'hormone'), ('G03', 'hormone'),
            ('A11', 'vitamin')]
WD_USE_TAGS = {'insecticide': 'pesticide', 'herbicide': 'pesticide', 'fungicide': 'pesticide', 'rodenticide': 'pesticide',
               'acaricide': 'pesticide', 'pesticide': 'pesticide', 'nematicide': 'pesticide', 'molluscicide': 'pesticide',
               'industrial fungicides': 'pesticide', 'repellent': 'pesticide', 'food additive': 'food', 'acidity regulator': 'food',
               'food preservative': 'food', 'anticaking agent': 'food', 'food thickener': 'food', 'preservative': 'food',
               'food coloring': 'colour', 'dye': 'colour', 'pigment': 'colour', 'pH indicator': 'colour', 'flavor enhancer': 'flavour',
               'sweetener': 'sweetener', 'non-nutritive sweetener': 'sweetener', 'solvent': 'solvent', 'polar aprotic solvent': 'solvent',
               'polar protic solvent': 'solvent', 'fuel': 'fuel', 'liquid rocket propellant': 'fuel', 'hypergolic propellant': 'fuel',
               'lifting gas': 'fuel', 'plasticizer': 'plastic', 'polymer stabilizer': 'plastic', 'flame retardant': 'material',
               'refrigerant': 'atmosphere', 'aroma compound': 'scent', 'perfumery': 'scent', 'sunscreen': 'material',
               'detergent': 'material', 'medication': 'medicine', 'antibiotic': 'antibiotic', 'antioxidant': 'food',
               'nuclear reactor coolant': 'material', 'fertilizer': 'material', 'nitrogen fertilizer': 'material'}
WD_WEAPON_USES = {'nerve agent', 'V-agents', 'blister agent', 'chemical warfare agent', 'lachrymatory agent', 'incapacitating agent',
                  'vomiting agent', 'chemical weapon', 'riot control agent'}
WD_ILLICIT_USES = {'designer drug', 'recreational drug', 'entheogen', 'hallucinogen', 'drug of abuse', 'psychedelic drug'}
WIKIDATA_ONLY_MIN_SITELINKS = 12     # a molecule only Wikidata nominates must be in this many Wikipedias to count as recognisable
HAND_GEOM = set(G.HAND)              # the three the catalogue builds by hand (a sandwich, the bridged hydride)

t0 = time.time()
def log(*a): print(f'[{time.time() - t0:7.1f}s]', *a, flush=True)
PTS = Chem.GetPeriodicTable()

def title_case(s):
    """the common name as people write it: 'acetic acid' → 'Acetic Acid', 'p-xylene' → 'p-Xylene', 'DDT' → 'DDT'"""
    small = {'of', 'and', 'in', 'on', 'for', 'with', 'to', 'a', 'an', 'the', 'from'}
    out = []
    for i, w in enumerate(s.split(' ')):
        if not w: continue
        if i and w.lower() in small: out.append(w.lower()); continue
        nup, nal = sum(c.isupper() for c in w), sum(c.isalpha() for c in w)
        if w.isupper() and nal > 4 and w.isalpha(): w = w.lower()                     # ChEMBL writes IBUPROFEN; people write Ibuprofen
        elif re.match(r'^[a-z][A-Z]', w) or (nup >= 2 and nup * 2 >= nal):
            out.append(w); continue                                                   # DDT · pH · NADH · 5CB · HFC-134a stay as they are
        m = re.match(r'^((?:tert|sec|iso|neo|cis|trans|ortho|meta|para|exo|endo|syn|anti|closo|nido|[omp]|n|N|O|S|P|C|D|L|R|E|Z|'
                     r'\([^)]*\)|[α-ω]|\d[\d,\'′a-z]*)[-,]\s*)+', w)
        head = m.group(0) if m else ''
        tail = w[len(head):]
        j = next((k for k, ch in enumerate(tail) if ch.isalpha()), None)
        out.append(head + (tail if j is None else tail[:j] + tail[j].upper() + tail[j + 1:]))
    return ' '.join(out)

def clean_wiki_title(t):
    return re.sub(r'\s*\((?:chemical|chemical compound|compound|molecule|drug|medication|pharmacology|medical use|biochemistry|'
                  r'chemistry|substance|data page|gas|element)[^)]*\)$', '', t).strip()

def hill(symbols):
    c = collections.Counter(symbols); keys = sorted(c)
    if 'C' in c: keys = ['C'] + (['H'] if 'H' in c else []) + sorted(k for k in c if k not in ('C', 'H'))
    return ''.join(k + (str(c[k]) if c[k] > 1 else '') for k in keys)

def sentences(text, n=2, cap=340):
    text = re.sub(r'<[^>]+>', '', re.sub(r'\s+', ' ', text or '')).strip()
    if not text: return ''
    parts = re.split(r'(?<=[a-z0-9\)\]])\.\s+(?=[A-Z(])', text)
    out = ''
    for p in parts[:n]:
        p = p.strip().rstrip('.') + '.'
        if out and len(out) + len(p) + 1 > cap: break
        out = (out + ' ' + p).strip()
    return out

# ── 0. INPUTS ────────────────────────────────────────────────────────────────────────────────────────────────────────
app = read_json(os.path.join(CACHE, 'app-own.json'))['molecules']
chembl = read_json(os.path.join(CACHE, 'chembl', 'approved.json'))
atc_words = read_json(os.path.join(CACHE, 'chembl', 'atc.json'))
chebi = read_json(os.path.join(CACHE, 'chebi', 'nominations.json'))
chebi_key = read_json(os.path.join(CACHE, 'chebi', 'by-inchikey.json'))['map']
wd = read_json(os.path.join(CACHE, 'wikidata', 'enwiki-compounds.json'))
who = read_json(os.path.join(CACHE, 'who-eml.json'))
log(f'inputs: app {len(app)} · ChEMBL parents {len(chembl["parents"])} · ChEBI {len(chebi["entities"])} '
    f'· Wikidata {len(wd["items"])} · WHO {len(who["items"])}')
wd_by_cid = {}
for it in wd['items']:
    for c in it['cids']:
        if c not in wd_by_cid or it['sitelinks'] > wd_by_cid[c]['sitelinks']: wd_by_cid[c] = it
# THE GUARDS' inputs: what the solver has solved (raw/<id>/meta.json) and the ids the previous candidates file gave
SOLVED = GU.solved(RAW)
prev_by_id, prev_id_by_key, prev_id_by_app = GU.previous(PREV)
raw_id_by_key = GU.raw_ids_by_key(SOLVED, prev_by_id)
log(f'guards: {len(prev_by_id)} rows in the previous file ({PREV}) · {len(SOLVED)} ids with a solved rung in {RAW} '
    f'({sum(1 for s in SOLVED.values() if s["exact"])} reproducible exactly)' + (' · --refresh-geometry: guard (a) is OFF' if REFRESH else ''))

# ── 1. NOMINATIONS ───────────────────────────────────────────────────────────────────────────────────────────────────
noms = []
def nominate(src, **kw): noms.append({'src': src, **kw})
for m in chembl['parents']:
    st = m.get('structures') or {}
    if not st.get('standard_inchi_key'): continue
    tags = []
    for code in m['atc']:
        for pre, t in ATC_TAGS:
            if code.startswith(pre) and t not in tags: tags.append(t)
    nominate('chembl', inchikey=st['standard_inchi_key'], smiles=st.get('canonical_smiles'), tags=tags, approved=True,
             ref={'db': 'ChEMBL', 'id': m['chembl'], **({'atc': m['atc']} if m['atc'] else {})}, chembl_name=m.get('pref_name'),
             synonyms=m.get('synonyms', []), withdrawn=m.get('withdrawn'), first_approval=m.get('first_approval'), atc=m['atc'])
uncharger, chooser = rdMolStandardize.Uncharger(), rdMolStandardize.LargestFragmentChooser(preferOrganic=True)
def parent_key(smiles):
    """the InChIKey of a SMILES' largest organic fragment, neutralised — ChEBI's conjugate bases merge onto their acid this way"""
    m = Chem.MolFromSmiles(smiles)
    if m is None: return None
    try: return Chem.MolToInchiKey(uncharger.uncharge(chooser.choose(m))) or None
    except Exception: return None
for e in chebi['entities']:
    if '*' in e['smiles'] or re.search(r'\[R\]|\*', e['smiles']): continue
    k = parent_key(e['smiles'])
    if not k: continue
    nominate('chebi', inchikey=k, tags=e['roleTags'] + e['classTags'], role_tags=e['roleTags'], class_tags=e['classTags'],
             screens=e['screens'], ref={'db': 'ChEBI', 'id': f'CHEBI:{e["chebi"]}'}, chebi_name=e['name'], definition=e['definition'],
             wikipedia=e['wikipedia'], synonyms=e['synonyms'][:8], iupac=e.get('iupac'))
for cat, spec in CUR.CATEGORIES.items():
    for it in spec['items']:
        name, extra, opts = (it, [], {}) if isinstance(it, str) else (it[0], it[1], it[2] if len(it) > 2 else {})
        if opts.get('skip'): nominate('curated-skip', name=name, why=opts['skip'], cat=cat); continue
        nominate('curated', name=name, query=opts.get('query', name), smiles=opts.get('smiles'), formula=opts.get('formula'),
                 tags=[t for t in spec['tags'] + extra if t in VOCAB], display=opts.get('display'), blurb=opts.get('blurb'),
                 cat_blurb=spec.get('blurb'), cat=cat, ref={'db': 'curated', 'list': cat})
for it in who['items']:
    n = re.sub(r'\s*\((?:medication|medical use|pharmacology|drug)\)$', '', it['name']).strip()
    if '/' in n or len(n) < 3: continue
    nominate('who', name=n, query=n, tags=[], who=True, ref={'db': 'WHO EML', 'name': it['name']})
for it in wd['items']:
    tags = sorted({WD_USE_TAGS[u] for u in it['uses'] if u in WD_USE_TAGS})
    for c in it['cids']:
        nominate('wikidata', cid=c, tags=tags, uses=it['uses'], wd_title=it['title'], sitelinks=it['sitelinks'],
                 ref={'db': 'Wikidata', 'id': it['item'], 'sitelinks': it['sitelinks']})
log('nominations: ' + ' · '.join(f'{k} {v}' for k, v in collections.Counter(n['src'] for n in noms).items()))

# ── 2. RESOLVE through PubChem ───────────────────────────────────────────────────────────────────────────────────────
named = [n for n in noms if n['src'] in ('curated', 'who')]
for i, n in enumerate(named):
    n['cid'] = P.smiles_cid(n['smiles']) if n.get('smiles') else None
    if not n['cid']:
        cids = P.name_cids(n['query']) or (P.name_cids(n['name']) if n['query'] != n['name'] else [])
        n['cid'] = cids[0] if cids else None
    if i % 250 == 249: log(f'  names {i + 1}/{len(named)}')
log(f'names resolved: {sum(1 for n in named if n["cid"])}/{len(named)}')
keys = sorted({n['inchikey'] for n in noms if n.get('inchikey')})
key_cids = P.inchikey_cids(keys)
for n in noms:
    if 'cid' in n: continue
    if n.get('inchikey'):
        cs = key_cids.get(n['inchikey'])
        n['cid'] = cs[0] if cs else (P.smiles_cid(n['smiles']) if n.get('smiles') else None)
log(f'InChIKeys resolved: {len(key_cids)}/{len(keys)}')

# ── 3. RECORDS and PARENTS ───────────────────────────────────────────────────────────────────────────────────────────
cids = {n['cid'] for n in noms if n.get('cid')}
app_cid = {}
APP_QUERY = {'dihydrogen': 'hydrogen', 'dinitrogen': 'nitrogen', 'difluorine': 'fluorine', 'dichlorine': 'chlorine',
             'dibromine': 'bromine', 'dioxygen': 'oxygen', 'alane': 'alumane', 'beryllium dihydride': 'beryllium hydride',
             'magnesium dihydride': 'magnesium dihydride', 'ethene': 'ethylene', 'cyanide': 'cyanide ion',
             'hydroxide': 'hydroxide ion', 'ammonium': 'ammonium', 'lithium fluoride cube': None, 'water hexamer ring': None,
             'closo-dodecaborate': 'dodecahydrododecaborate(2-)', 'buckminsterfullerene': 'fullerene C60',
             'nickel tetracarbonyl': 'nickel tetracarbonyl', 'iron pentacarbonyl': 'iron pentacarbonyl'}
for a in app:
    c = (a.get('pubchem') or {}).get('cid')
    if not c:
        q = APP_QUERY.get(a['name'], a['name'])
        cs = P.name_cids(q) if q else []
        c = cs[0] if cs else None
    app_cid[a['id']] = c
    if c: cids.add(c)
props = P.properties(cids)
log(f'PubChem records: {len(props)}')
parent_of, want_parent = {}, []
for n in noms:
    c, p = n.get('cid'), props.get(n.get('cid'))
    if not p or n['src'] == 'wikidata': continue                       # a Wikidata nomination is already the article's own compound
    if n['src'] == 'curated' and n['name'] in HAND_GEOM: continue
    if (p.get('CovalentUnitCount', 1) or 1) > 1 or (p.get('Charge', 0) or 0) != 0:
        if c not in parent_of: want_parent.append(c)
want_parent = sorted(set(want_parent))
# first, locally: the largest organic fragment, neutralised, looked up by InChIKey in ONE batched call per hundred —
# this is what PubChem's `cids_type=parent` would say for a salt, at a fraction of the requests
local = {}
for c in want_parent:
    sm = props[c].get('SMILES') or props[c].get('ConnectivitySMILES')
    k = parent_key(sm) if sm else None
    if k and k != props[c].get('InChIKey'): local[c] = k
found = P.inchikey_cids(sorted(set(local.values())))
for c, k in local.items():
    if found.get(k): parent_of[c] = found[k][0]
rest = [c for c in want_parent if c not in parent_of]
log(f'parents: {len(want_parent)} wanted · {len(parent_of)} found by their own neutral fragment · {len(rest)} asked of PubChem')
for i, c in enumerate(rest):
    parent_of[c] = P.parent_cid(c)
    if i % 200 == 199: log(f'  parents {i + 1}/{len(rest)}')
new_cids = {v for v in parent_of.values() if v and v not in props}
props.update(P.properties(new_cids))
log(f'parents resolved: {sum(1 for v in parent_of.values() if v)} · new records {len(new_cids)}')
for n in noms:
    c = n.get('cid')
    if parent_of.get(c) and parent_of[c] != c: n['from_cid'], n['cid'] = c, parent_of[c]

# ── 4. MERGE by InChIKey ─────────────────────────────────────────────────────────────────────────────────────────────
entries, excluded = {}, []
def exclude(name, why, **kw): excluded.append({'name': name, 'why': why, **kw})
def entry_for(key, cid):
    e = entries.get(key)
    if e is None: e = entries[key] = {'key': key, 'cid': cid, 'noms': [], 'app': None}
    return e
for a in app:
    if a['multiplicity'] > 1: exclude(a['name'], 'open shell (multiplicity > 1): the app solves it by UHF, and a volume rung is RHF', src='app', id=a['id']); continue
    if a['disabled']: exclude(a['name'], 'disabled in the app — ' + (a['reason'] or ''), src='app', id=a['id']); continue
    if a['id'] in APP_REFUSED: exclude(a['name'], APP_REFUSED[a['id']], src='app', id=a['id']); continue
    cid = app_cid.get(a['id']); p = props.get(cid)
    formula = hill(PTS.GetElementSymbol(int(x[0])) for x in a['ang'])
    key = None
    if p and p.get('InChIKey') and re.sub(r'[+-]\d*$', '', p.get('MolecularFormula') or '') == formula: key = p['InChIKey']
    else: cid = None
    entry_for(key or 'APP-' + a['id'], cid)['app'] = a
for n in noms:
    if n['src'] == 'curated-skip': exclude(n['name'], 'left out by hand: ' + n['why'], src='curated', cat=n['cat']); continue
    c, p = n.get('cid'), props.get(n.get('cid'))
    if not c or not p:
        if n['src'] in ('curated', 'who'): exclude(n['name'], 'PubChem has no compound under this name', src=n['src'])
        elif n['src'] == 'chembl': exclude(n.get('chembl_name') or n['ref']['id'], 'PubChem does not carry this InChIKey', src='chembl')
        continue
    if not p.get('InChIKey') or not p.get('MolecularFormula'):
        exclude(n.get('name') or n.get('chembl_name') or str(c), 'PubChem\'s record for it carries no InChIKey or no formula', src=n['src'], cid=c); continue
    if n['src'] == 'curated' and n.get('formula') and p['MolecularFormula'] != n['formula']:
        exclude(n['name'], f'PubChem read the name as {p["MolecularFormula"]}, not the expected {n["formula"]}', src='curated'); continue
    entry_for(p['InChIKey'], c)['noms'].append(n)
log(f'merged: {len(entries)} unique InChIKeys')

# ── 5. THE SCREENS ───────────────────────────────────────────────────────────────────────────────────────────────────
# Chemical Weapons Convention: every scheduled chemical and listed precursor is refused outright — by NAME (the Annex's own
# names, curated.CWC_NAMES, resolved through PubChem to an InChIKey skeleton) and by CLASS, so a congener under another name is
# refused too.  The class patterns below are deliberately coarse: they refuse a whole family rather than name a member of it.
WEAPON_CLASSES = [('a phosphorus–fluorine compound (CWC Schedule 1 and 1B families)', '[#15]-F'),
                  ('a phosphorus–cyanide compound (CWC Schedule 1 family)', '[#15]-C#N'),
                  ('an organoarsenic or arsenic-halide compound (CWC Schedule 1 and 2 families)', '[#33]-[#6,F,Cl,Br,I]'),
                  ('a 2-chloroethyl sulfide or amine (CWC Schedule 1 family)', 'Cl[CH2][CH2][#16X2,#7X3]'),
                  ('a phosphoramidic or phosphoramidate halide (CWC Schedule 2B family)', '[#15](=O)([F,Cl,Br])[N]')]
WEAPON_PATTERNS = [(w, Chem.MolFromSmarts(s)) for w, s in WEAPON_CLASSES]
def alkyl_arm(mol, start, avoid, limit=3):
    """the size of a plain saturated all-carbon arm (≤ limit atoms), else None — the Schedule 2B.4 alkyl test"""
    seen, stack = {avoid, start}, [start]
    while stack:
        a = mol.GetAtomWithIdx(stack.pop())
        if a.GetAtomicNum() != 6 or a.GetIsAromatic() or any(b.GetBondTypeAsDouble() != 1 for b in a.GetBonds()): return None
        for n in a.GetNeighbors():
            if n.GetIdx() not in seen: seen.add(n.GetIdx()); stack.append(n.GetIdx())
    seen.discard(avoid)
    return len(seen) if len(seen) <= limit else None
def weapon_class(mol):
    if mol is None: return None
    for why, pat in WEAPON_PATTERNS:
        if pat is not None and mol.HasSubstructMatch(pat): return why
    for a in mol.GetAtoms():
        if a.GetAtomicNum() == 15:
            cn = [n for n in a.GetNeighbors() if n.GetAtomicNum() == 6]
            if len(cn) == 1 and alkyl_arm(mol, cn[0].GetIdx(), a.GetIdx()): return 'a phosphorus centre carrying one short alkyl group and no other carbon (CWC Schedule 2B family)'
    return None
def skeleton(k): return k.split('-')[0]
def block_list(names):
    out = {}
    for nm in names:
        cs = P.name_cids(nm)
        if not cs: continue
        c = cs[0]
        if c not in props: props.update(P.properties([c]))
        if props.get(c, {}).get('InChIKey'): out.setdefault(skeleton(props[c]['InChIKey']), nm)
    return out
WEAPON_NAMED, ILLICIT_NAMED = block_list(CUR.CWC_NAMES), block_list(CUR.ILLICIT_NAMES)
log(f'screens: {len(WEAPON_NAMED)} scheduled chemicals and {len(ILLICIT_NAMED)} controlled substances resolved by name')

# ── 6. THE FILTERS ───────────────────────────────────────────────────────────────────────────────────────────────────
ACID_PATTERNS = [Chem.MolFromSmarts(s) for s in ('[CX3](=O)[OX2H1]', '[#16,#15,#7,#17,#35,#5](=O)[OX2H1]', '[F,Cl,Br][H]',
                                                 '[#16X4](=O)(=O)[OX2H1]', '[OX2H1][#16,#15,#5,#33,#34]')]
def recognisable(e):
    srcs = {n['src'] for n in e['noms']}
    if srcs & {'chembl', 'curated', 'who'}: return True, None
    wiki = any(n.get('wikipedia') for n in e['noms']) or e['cid'] in wd_by_cid or (chebi_key.get(e['key']) or [None, None, None, None])[3]
    if 'chebi' in srcs and wiki: return True, None
    if 'wikidata' in srcs:
        it = wd_by_cid.get(e['cid'])
        if it and (it['sitelinks'] >= WIKIDATA_ONLY_MIN_SITELINKS or any(n['tags'] for n in e['noms'])): return True, None
    links = wd_by_cid.get(e['cid'], {}).get('sitelinks')
    return False, ('too obscure to be a library row: nominated only by ' + '/'.join(sorted(srcs)) +
                   (f' and in {links} Wikipedias' if links else ' and in no Wikipedia'))

kept = []
for key, e in entries.items():
    a, p = e['app'], (props.get(e['cid']) if e['cid'] else None)
    srcs = sorted({n['src'] for n in e['noms']} | ({'app'} if a else set()))
    e['srcs'], e['approved'] = srcs, any(n.get('approved') for n in e['noms'])
    e['hand'] = any(n['src'] == 'curated' and n['name'] in HAND_GEOM for n in e['noms'])
    nm = (a['name'] if a else None) or next((n.get('display') or n.get('name') for n in e['noms'] if n['src'] == 'curated'), None) \
        or next((clean_wiki_title(n['wd_title']) for n in e['noms'] if n['src'] == 'wikidata'), None) \
        or (p or {}).get('Title') or next((n['chembl_name'] for n in e['noms'] if n.get('chembl_name')), None) or key
    e['nm'] = nm
    if a: kept.append(e); continue                                    # the app's own: kept at its pinned geometry, whatever its size
    ok, why = recognisable(e)
    if not ok: exclude(nm, why, src='/'.join(srcs), cid=e['cid']); continue
    smiles = p.get('SMILES') or p.get('ConnectivitySMILES')
    mol = Chem.MolFromSmiles(smiles) if smiles else None
    if mol is None and not e['hand']: exclude(nm, 'its PubChem structure does not parse', src='/'.join(srcs), cid=e['cid']); continue
    molH = Chem.AddHs(mol) if mol is not None else None
    e['mol'], e['molH'] = mol, molH
    # the screens first, so a refused substance is never described further
    w = WEAPON_NAMED.get(skeleton(key)) or (weapon_class(mol) if mol is not None else None)
    if w: exclude(nm, 'refused: on the Chemical Weapons Convention schedules or in a scheduled family — ' + w, src='/'.join(srcs), screen='CWC', key=key); continue
    if any(u in WD_WEAPON_USES for n in e['noms'] for u in n.get('uses', [])):
        exclude(nm, 'refused: Wikidata records it as a chemical warfare agent', src='/'.join(srcs), screen='CWC', key=key); continue
    if not e['approved']:
        il = ILLICIT_NAMED.get(skeleton(key))
        scr = {s for n in e['noms'] for s in n.get('screens', [])} & {'hallucinogen', 'opioid'}
        if il or scr or any(u in WD_ILLICIT_USES for n in e['noms'] for u in n.get('uses', [])):
            exclude(nm, 'refused: a controlled psychoactive substance that is not an approved medicine', src='/'.join(srcs), screen='illicit', key=key); continue
    Zs = [x.GetAtomicNum() for x in molH.GetAtoms()] if molH is not None else []
    heavy = p.get('HeavyAtomCount') or sum(1 for z in Zs if z > 1)
    why = None
    if p.get('IsotopeAtomCount'): why = 'an isotopically labelled compound'
    elif not e['hand'] and (p.get('CovalentUnitCount', 1) or 1) > 1: why = f'not one molecule: PubChem counts {p["CovalentUnitCount"]} separate units, and it has no neutral parent'
    elif not e['hand'] and (p.get('Charge', 0) or 0) != 0: why = f'an ion (charge {p["Charge"]}) with no neutral parent in PubChem'
    elif any(z > 36 for z in Zs): why = 'an element beyond krypton (' + ', '.join(sorted({PTS.GetElementSymbol(z) for z in Zs if z > 36})) + ')'
    elif heavy > 50: why = f'{heavy} heavy atoms, past the 50 the volume allows'
    elif heavy < 1: why = 'no heavy atom'
    elif sum(Zs) % 2: why = f'an odd electron count ({sum(Zs)}): an open shell, not an RHF molecule'
    elif mol is not None and not e['hand'] and sum(x.GetNumRadicalElectrons() for x in molH.GetAtoms()): why = 'a radical (RDKit finds unpaired electrons): an open shell'
    if why: exclude(nm, why, src='/'.join(srcs), cid=e['cid']); continue
    e['heavy'], e['Zs'] = heavy, Zs
    kept.append(e)
log(f'through the filters: {len(kept)} (excluded so far {len(excluded)})')
if LIMIT: kept = kept[:LIMIT]

# ── 7. GEOMETRY ──────────────────────────────────────────────────────────────────────────────────────────────────────
OMEGA = "PubChem's own 3-D conformer (OpenEye OMEGA, MMFF94s)"
GCACHE = os.path.join(CACHE, 'geometry.json')                       # keyed by InChIKey: an xTB relaxation is never repeated
gcache = read_json(GCACHE) if os.path.exists(GCACHE) else {}
gdirty = 0
need3d = sorted({e['cid'] for e in kept if not e['app'] and e['cid']})
conf = P.conformers(need3d) if GEOMETRY else {}
log(f'PubChem 3-D conformers: {len(conf)}/{len(need3d)}')
def elements_agree(atoms, Zs): return collections.Counter(x[0] for x in atoms) == collections.Counter(Zs)
def gkind(src):
    return ('app pinned' if src.startswith("the app's own") else 'PubChem 3-D conformer' if src.startswith('PubChem')
            else 'GFN2-xTB' if 'GFN2-xTB' in src else 'RDKit ETKDGv3 + MMFF94')
def row_key(e): return (props.get(e['cid']) or {}).get('InChIKey') if e['cid'] else None
def solved_id(e):
    """GUARD (a)'s question: the id guard (b) will give this entry, when raw/<that id>/ holds a converged rung of the same InChIKey
    at atoms a candidate file can hand back exactly — else None"""
    k = row_key(e)
    i = e['app']['id'] if e['app'] else (prev_id_by_key.get(k) or raw_id_by_key.get(k))
    s = SOLVED.get(i) if i else None
    return i if s and s['exact'] and s['inchikey'] == k else None
geom_counts, kept_solved, upgrade_waiting = collections.Counter(), collections.Counter(), []
for i, e in enumerate(kept):
    sid = solved_id(e)
    if sid and not REFRESH and (e['app'] or elements_agree(SOLVED[sid]['atomsAng'], e['Zs'])):
        # GUARD (a): a solved molecule keeps the atoms it was solved at — byte for byte, no rounding, the cache untouched
        s = SOLVED[sid]
        e['atoms'] = [[int(a[0]), a[1], a[2], a[3]] for a in s['atomsAng']]
        e['gsource'] = s['geometrySource'] or f'the atoms raw/{sid}/ was solved at'
        e['keptSolved'] = sid
        k = gkind(e['gsource']); geom_counts[k] += 1; kept_solved[k] += 1
        if not e['app'] and e['cid'] in conf and k != 'PubChem 3-D conformer': upgrade_waiting.append(sid)
        continue
    if e['app']:
        e['atoms'] = [[int(z), x, y, zz] for z, x, y, zz in e['app']['ang']]
        e['gsource'] = 'the app\'s own pinned geometry (lab/molecules.js / lab/library.json): ' + (e['app']['source'] or 'see the module')
        geom_counts['app pinned'] += 1
        continue
    if not GEOMETRY: e['atoms'], e['gsource'] = None, None; continue
    hit = gcache.get(e['key'])
    # a cached geometry stands, EXCEPT a locally built one for a molecule whose PubChem conformer has since arrived: PubChem's
    # own 3-D conformer is the preferred source (PLAN.md step 1), so that row is built again rather than left as it was.  An xTB
    # relaxation that already STARTED from PubChem's conformer (the inorganic and hypervalent rows) is not "since arrived": it stands,
    # so a re-run does not relax it again.  A FAILURE is cached too (iteration 006 C2: the few molecules no method embeds cost many
    # minutes of ETKDG each, every run) and is tried again only when a PubChem conformer has arrived since, or with --refresh-geometry
    if hit and hit['kind'] == 'failed' and not REFRESH and (e['cid'] not in conf or hit.get('hadConformer')):
        exclude(e['nm'], hit['source'], src='/'.join(e['srcs']), cid=e['cid'], cached=True)
        e['atoms'] = None; continue
    if hit and hit['kind'] != 'failed' and not REFRESH and (hit['kind'] == 'PubChem 3-D conformer' or e['cid'] not in conf or "from PubChem's 3-D conformer" in hit['source']):
        e['atoms'], e['gsource'] = hit['atoms'], hit['source']
        geom_counts[hit['kind']] += 1
        continue
    atoms = src = None
    pub = None
    if e['cid'] in conf:
        got, _ = G.from_sdf(conf[e['cid']])
        if got and elements_agree(got, e['Zs']): pub = got
    hand = next((n['name'] for n in e['noms'] if n['src'] == 'curated' and n['name'] in HAND_GEOM), None)
    if hand:
        start = G.HAND[hand]()
        out, _, ok = G.xtb_relax(start)
        if out: atoms, src = out, f'built here as the known {hand} framework, then relaxed with GFN2-xTB (tblite 0.7.0){"" if ok is True else " — the relaxation did not converge"}'
    elif e['mol'] is not None and G.needs_xtb(e['molH']):
        start = pub or G.vsepr_star(e['mol']) or G.embed_any(Chem.MolToSmiles(e['mol']))
        if start is not None:
            out, _, ok = G.xtb_relax(start, charge=0)
            if out and elements_agree(out, e['Zs']):
                if pub is not None and G.kabsch_rmsd(out, pub) <= 0.10: atoms, src = pub, OMEGA + ' — checked against a GFN2-xTB relaxation, which agrees within 0.10 Å'
                else:
                    atoms = out
                    src = ('GFN2-xTB relaxation (tblite 0.7.0) from ' +
                           ('PubChem\'s 3-D conformer' if pub is not None else 'a VSEPR start built here' if G.vsepr_star(e['mol']) else 'an RDKit ETKDGv3 embedding') +
                           '; MMFF94 has no parameters for this centre' + ('' if ok is True else ' — the relaxation did not converge'))
    if atoms is None and pub is not None: atoms, src = pub, OMEGA
    if atoms is None and e['mol'] is not None:
        got = G.etkdg_mmff(Chem.MolToSmiles(e['mol']))
        if got: atoms, src = got[0], f'RDKit ETKDGv3 + MMFF94, the lowest of ten embeddings, seed {G.SEED}'
    if atoms is None and e['mol'] is not None:
        start = G.embed_any(Chem.MolToSmiles(e['mol']))
        if start is not None:
            out, _, ok = G.xtb_relax(start)
            if out: atoms, src = out, f'RDKit ETKDGv3 embedding relaxed with GFN2-xTB (tblite 0.7.0){"" if ok is True else " — the relaxation did not converge"}'
    if atoms is None or not elements_agree(atoms, e['Zs']):
        why = 'no 3-D geometry: PubChem has no conformer and neither MMFF94 nor GFN2-xTB would build one'
        exclude(e['nm'], why, src='/'.join(e['srcs']), cid=e['cid'])
        gcache[e['key']] = {'atoms': None, 'source': why, 'kind': 'failed', 'hadConformer': e['cid'] in conf}; gdirty += 1
        e['atoms'] = None; continue
    e['atoms'], e['gsource'] = [[int(z), round(x, 5), round(y, 5), round(zz, 5)] for z, x, y, zz in atoms], src
    kind = 'PubChem 3-D conformer' if src.startswith('PubChem') else 'GFN2-xTB' if 'GFN2-xTB' in src else 'RDKit ETKDGv3 + MMFF94'
    geom_counts[kind] += 1
    gcache[e['key']] = {'atoms': e['atoms'], 'source': src, 'kind': kind}
    gdirty += 1
    if gdirty % 200 == 0: write_json(GCACHE, gcache)
    if i % 500 == 499: log(f'  geometry {i + 1}/{len(kept)} ({gdirty} built here)')
if gdirty: write_json(GCACHE, gcache)
kept = [e for e in kept if e.get('atoms')]
log(f'with a geometry: {len(kept)} · ' + ' · '.join(f'{k} {v}' for k, v in geom_counts.most_common()))
refreshed_solved = sorted(sid for e in kept for sid in [solved_id(e)] if sid and GU.bohr(e['atoms']) != SOLVED[sid]['atomsBohr'])
if REFRESH:
    log(f'GUARD (a) OFF (--refresh-geometry): {len(refreshed_solved)} rows that have solved rungs got a NEW geometry — the solver will '
        f'solve each of them again from STO-3G (it sees "the atoms moved"): ' + ', '.join(refreshed_solved))
else:
    log(f'GUARD (a): {sum(kept_solved.values())} solved rows kept the exact atoms they were solved at (' +
        ' · '.join(f'{k} {v}' for k, v in kept_solved.most_common()) + f'); {len(upgrade_waiting)} of them now have a PubChem 3-D '
        f'conformer waiting — `build.py --refresh-geometry` would upgrade them, and those rows would then be solved again'
        + (f' · ! {len(refreshed_solved)} solved rows moved anyway: ' + ', '.join(refreshed_solved) if refreshed_solved else ''))

# ── 8. SYNONYMS, DESCRIPTIONS ────────────────────────────────────────────────────────────────────────────────────────
live = sorted({e['cid'] for e in kept if e['cid']})
PUBCHEM_STOPPED = None
def nicety(what, fn):
    """synonyms and descriptions are niceties: if PubChem refuses during them (common.Blocked), the run stops ASKING — from here on
    the cache is the whole world (a miss is "no answer") — and finishes, saying so; a calm re-run fills in the rest"""
    global PUBCHEM_STOPPED
    try: return fn(live)
    except C.Blocked as b:
        C.OFFLINE, PUBCHEM_STOPPED = True, f'{what}: {b}'
        log(f'! PubChem refused during the {what} round ({b}) — nothing more is asked of it; the rest of the run reads the cache only')
        return fn(live)
syn = nicety('synonyms', P.synonyms) if GEOMETRY else {}
desc = nicety('descriptions', P.descriptions) if GEOMETRY else {}
log(f'synonyms for {len(syn)} · descriptions for {len(desc)}')
CODEY = re.compile(r'^(?=.*\d)(?=.*[A-Z])[A-Z0-9][A-Z0-9\-\s/\.,\']{2,}$')
def pick_synonyms(e, name, iupac, n=6):
    """the recognisable names, in order of how a reader would meet them: ChEBI's own synonyms, then PubChem's first (most
    relevant) ones, then the rest — a CAS number, a registry code, an over-long name or a near-copy of the name is dropped."""
    chebi_syn = [s for n2 in e['noms'] if n2['src'] == 'chebi' for s in (n2.get('synonyms') or [])]
    chembl_syn = [s for n2 in e['noms'] if n2['src'] == 'chembl' for s in (n2.get('synonyms') or [])]
    pub = syn.get(e['cid'], [])
    pool = chebi_syn[:6] + pub[:10] + chembl_syn[:6] + pub[10:60]
    seen, out = {re.sub(r'[^a-z0-9]', '', (name or '').lower()), re.sub(r'[^a-z0-9]', '', (iupac or '').lower())}, []
    for s2 in pool:
        s2 = re.sub(r'\s+', ' ', s2).strip()
        flat = re.sub(r'[^a-z0-9]', '', s2.lower())
        if not s2 or flat in seen: continue
        if len(s2) > 40 or len(s2) < 3 or s2.count(' ') > 4: continue
        if re.fullmatch(r'[\d\-]+', s2) or re.match(r'^\d{2,7}-\d{2}-\d$', s2): continue              # a CAS number
        if sum(ch.isdigit() for ch in s2) > 4: continue                                                # a registry code
        if not re.search(r'[a-zA-Z]{3}', s2): continue
        if CODEY.match(s2) and ' ' not in s2 and any(ch.isdigit() for ch in s2): continue               # NSC123, SR-01…
        if s2.isupper() and len(s2) > 6: s2 = s2.lower()                                               # ACETYLSALICYLIC ACID
        seen.add(flat); out.append(s2)
        if len(out) >= n: break
    return out

# ── 9. TAGS ──────────────────────────────────────────────────────────────────────────────────────────────────────────
DRUG_TAGS = {'painkiller', 'antibiotic', 'antiviral', 'heart', 'mind', 'cancer', 'allergy', 'anaesthetic'}
def tags_for(e):
    if e['app']: return list(APP.get(e['app']['id'], (['classic'], ''))[0])
    t = set()
    for n in e['noms']:
        for x in n.get('tags', []):
            if x in VOCAB: t.add(x)
    if e['approved']: t.add('medicine')
    else: t -= DRUG_TAGS
    mol = e['mol']
    if mol is not None:
        ri = mol.GetRingInfo()
        if RD.CalcNumAromaticRings(mol): t.add('aromatic')
        elif ri.NumRings(): t.add('ring')
        if ri.NumRings() >= 3 and RD.CalcNumBridgeheadAtoms(mol) >= 2 and not RD.CalcNumAromaticRings(mol): t.add('cage')
        if any(a.GetAtomicNum() in G.METALS for a in mol.GetAtoms()): t.add('metal')
        if any(p is not None and mol.HasSubstructMatch(p) for p in ACID_PATTERNS): t.add('acid')
    if 'aromatic' in t: t.discard('ring')
    if len(t) > 4:
        keep = sorted(t, key=lambda x: TAG_RANK.get(x, 99))[:4]
        t = set(keep)
    return sorted(t, key=lambda x: TAG_RANK.get(x, 99))

# ── 10. BLURBS ───────────────────────────────────────────────────────────────────────────────────────────────────────
TAG_PHRASE = {'medicine': 'a medicine', 'aromatic': 'an aromatic compound', 'ring': 'a ring compound', 'cage': 'a cage molecule',
              'acid': 'an acid', 'metal': 'a molecule built around a metal atom', 'gas': 'a gas', 'solvent': 'a solvent',
              'fuel': 'a fuel', 'plastic': 'a molecule of the plastics industry', 'material': 'a material', 'food': 'a food molecule',
              'flavour': 'a flavour molecule', 'scent': 'a scent molecule', 'colour': 'a dye or pigment', 'toxin': 'a toxin',
              'pesticide': 'a pesticide', 'pollutant': 'a pollutant', 'atmosphere': 'a molecule of the atmosphere',
              'amino acid': 'an amino acid', 'nucleobase': 'a nucleobase', 'sugar': 'a sugar', 'fat': 'a fat or fatty acid',
              'steroid': 'a steroid', 'alkaloid': 'an alkaloid', 'life': 'a molecule of life', 'natural': 'a natural product',
              'vitamin': 'a vitamin', 'hormone': 'a hormone', 'neurotransmitter': 'a neurotransmitter', 'sweetener': 'a sweetener',
              'classic': 'a classic of the chemistry course'}
def blurb_for(e, name, tags):
    if e['app']:
        b = APP.get(e['app']['id'], (None, None))[1]
        if b: return b, 'λWAVES'
    row = chebi_key.get(e['key'])
    if row and row[2]: return sentences(row[2]), 'ChEBI definition (CC BY 4.0)'
    for n in e['noms']:
        if n['src'] == 'chebi' and n.get('definition'): return sentences(n['definition']), 'ChEBI definition (CC BY 4.0)'
    for d in desc.get(e['cid'], []):
        if d['source'] == 'ChEBI': return sentences(d['text']), 'ChEBI definition (CC BY 4.0)'
    for n in e['noms']:
        if n['src'] == 'curated' and n.get('blurb'): return n['blurb'], 'λWAVES'
    if e['approved']:
        codes = [c for n in e['noms'] for c in (n.get('atc') or [])]
        words = next((atc_words[c]['l4'] for c in codes if c in atc_words and atc_words[c].get('l4')), None)
        who_eml = any(n.get('who') for n in e['noms'])
        s = f'{name}: an approved medicine'
        if words: s += f', in the WHO ATC group “{words.lower()}”'
        if who_eml: s += '; it is on the WHO Model List of Essential Medicines'
        return s + '.', 'λWAVES'
    for n in e['noms']:
        if n['src'] == 'curated' and n.get('cat_blurb'): return n['cat_blurb'], 'λWAVES'
    uses = [u for n in e['noms'] for u in n.get('uses', []) if u in WD_USE_TAGS]
    if uses: return f'{name}: used as a {uses[0]}.', 'λWAVES'
    if tags: return f'{name}: {TAG_PHRASE.get(tags[0], "a molecule of the catalogue")}.', 'λWAVES'
    return f'{name}: a molecule of the catalogue.', 'λWAVES'

# ── 11. ROWS: ids, names, priority ───────────────────────────────────────────────────────────────────────────────────
def slug(s):
    s = re.sub(r'[′″\'"`]', '', s.lower())
    s = (s.replace('α', 'alpha').replace('β', 'beta').replace('γ', 'gamma').replace('δ', 'delta').replace('ω', 'omega')
          .replace('ε', 'epsilon').replace('μ', 'mu').replace('±', 'pm').replace('→', '-'))
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return (s or 'molecule')[:64]
def score(e):
    """recognisability: how many Wikipedias, how many independent sources, how many names people use for it"""
    it = wd_by_cid.get(e['cid'])
    s = (it['sitelinks'] if it else 0)
    s += 12 * len({n['ref']['db'] for n in e['noms']})
    s += min(len(e['row']['synonyms']), 6) * 2
    if e['approved']: s += 25
    if any(n.get('who') for n in e['noms']): s += 40
    return s

rows = []
for e in kept:
    p = props.get(e['cid']) if e['cid'] else None
    a = e['app']
    tags = tags_for(e)
    if not tags:
        exclude(e['nm'], 'no plain tag of the vocabulary fits it, so the library could not shelve it', src='/'.join(e['srcs']), cid=e['cid']); continue
    iupac = (p or {}).get('IUPACName') or next((n.get('iupac') for n in e['noms'] if n.get('iupac')), None)
    name = title_case(clean_wiki_title(e['nm']))
    atoms = e['atoms']
    formula = (p or {}).get('MolecularFormula') if p else None
    formula = re.sub(r'[+-]\d*$', '', formula) if formula else hill(PTS.GetElementSymbol(int(x[0])) for x in atoms)
    row = {'id': a['id'] if a else slug(name), 'name': name, 'iupac': iupac, 'synonyms': [], 'formula': formula,
           'charge': (a['charge'] if a else 0 if e['hand'] else (p or {}).get('Charge', 0)) or 0, 'multiplicity': 1,
           'cid': e['cid'], 'inchi': (p or {}).get('InChI'), 'inchikey': (p or {}).get('InChIKey'),
           'smiles': (p or {}).get('SMILES') or (p or {}).get('ConnectivitySMILES'),
           'mw': float((p or {}).get('MolecularWeight')) if (p or {}).get('MolecularWeight') else None,
           'exactMass': float((p or {}).get('ExactMass')) if (p or {}).get('ExactMass') else None,
           'heavy': sum(1 for x in atoms if x[0] > 1), 'nAtoms': len(atoms),
           'xlogp': (p or {}).get('XLogP'), 'tpsa': (p or {}).get('TPSA'), 'hbd': (p or {}).get('HBondDonorCount'),
           'hba': (p or {}).get('HBondAcceptorCount'), 'rotatable': (p or {}).get('RotatableBondCount'),
           'complexity': (p or {}).get('Complexity'), 'tags': tags, 'blurb': None, 'blurbSource': None,
           'atomsAng': atoms, 'geometrySource': e['gsource'], 'sources': [], 'priority': None, **({'app': a['id'], 'section': a['section']} if a else {})}
    row['synonyms'] = pick_synonyms(e, name, iupac)
    row['blurb'], row['blurbSource'] = blurb_for(e, name, tags)
    srcs = []
    if a:
        srcs.append({'db': 'λWAVES', 'id': a['id'], 'what': 'lab/library.json record row' if a['library'] or a['recordOnly'] else 'lab/molecules.js MOLECULES',
                     'section': a['section']})
    for n in e['noms']:
        r = dict(n['ref'])
        if n['src'] == 'chebi' and n.get('chebi_name'): r['name'] = n['chebi_name']
        if n['src'] == 'wikidata': r['article'] = n['wd_title']
        if n['src'] == 'curated': r['name'] = n['name']
        if r not in srcs: srcs.append(r)
    if e['cid']: srcs.append({'db': 'PubChem', 'id': f'CID {e["cid"]}'})
    row['sources'] = srcs
    e['row'] = row
    rows.append((e, row))
log(f'rows: {len(rows)}')

# GUARD (b): IDS ARE STABLE.  First every row the previous file (or raw/) already knows takes that id; then each new row takes its
# slug, suffixed past every id ever given — the previous file's, raw/'s and this run's — so a collision moves the NEW row, never an old one
reserved = set(prev_by_id) | set(SOLVED)
seen_ids, id_from = {}, collections.Counter()
for e, row in rows:
    k = row['inchikey']
    pinned = row['id'] if e['app'] else prev_id_by_key.get(k) or raw_id_by_key.get(k)
    if pinned:
        if pinned in seen_ids: raise SystemExit(f'guard (b): the id {pinned} is claimed twice ({seen_ids[pinned]} and {k}) — refusing to write')
        row['id'] = pinned; seen_ids[pinned] = k; e['pinned'] = True
        id_from['the app' if e['app'] else 'the previous file' if k in prev_id_by_key else 'raw/ (solved under it)'] += 1
for e, row in rows:
    if e.get('pinned'): continue
    base = row['id']
    if base in seen_ids or base in reserved:
        n = 2
        while f'{base}-{n}' in seen_ids or f'{base}-{n}' in reserved: n += 1
        row['id'] = f'{base}-{n}'
        id_from['new, suffixed past ' + ('an old id' if base in reserved else 'another new row')] += 1
    else: id_from['new, its own slug'] += 1
    seen_ids[row['id']] = row['inchikey']
lost = sorted(set(prev_by_id) - set(seen_ids))
log('GUARD (b): ids from ' + ' · '.join(f'{k} {v}' for k, v in id_from.most_common()) +
    f' · {len(prev_by_id) - len(lost)}/{len(prev_by_id)} previous ids present' + (f' · ! MISSING: ' + ', '.join(lost) if lost else ''))
def tier(e):
    if e['app']: return 0
    if any(n.get('who') for n in e['noms']): return 1
    return 2
rows.sort(key=lambda er: (tier(er[0]), -(score(er[0]) // 10), er[1]['heavy'], er[1]['name'].lower()))
for i, (e, row) in enumerate(rows): row['priority'] = i
molecules = [row for _, row in rows]

# ── 12. WRITE ────────────────────────────────────────────────────────────────────────────────────────────────────────
SOURCES = [
 {'name': 'λWAVES itself (lab/molecules.js, lab/library.json)', 'what': "the app's own molecules at their pinned geometries, ids kept",
  'licence': 'the repository’s own (see LICENSE)', 'url': None, 'read': TODAY},
 {'name': 'PubChem (NCBI) PUG REST', 'what': 'identifiers, computed properties, 3-D conformers (OpenEye OMEGA / MMFF94s), descriptions',
  'licence': 'public domain (U.S. Government work); individual descriptions carry their own source and licence',
  'url': 'https://pubchem.ncbi.nlm.nih.gov/', 'read': TODAY},
 {'name': 'ChEMBL ' + (chembl.get('source') or '').replace('ChEMBL ', ''), 'what': 'approved small-molecule drugs (max_phase 4) and their ATC classifications',
  'licence': 'CC BY-SA 3.0', 'url': 'https://www.ebi.ac.uk/chembl/', 'read': TODAY},
 {'name': f'ChEBI release {chebi.get("release")}', 'what': 'roles and structural classes of 3-star (manually curated) entities, and their definitions (the blurbs marked so)',
  'licence': 'CC BY 4.0', 'url': 'https://www.ebi.ac.uk/chebi/', 'read': TODAY},
 {'name': 'WHO ATC classification, as ChEMBL serves it', 'what': 'the words of a medicine’s ATC group, used in λWAVES-written blurbs',
  'licence': 'CC BY-SA 3.0 (ChEMBL’s distribution)', 'url': 'https://www.ebi.ac.uk/chembl/', 'read': TODAY},
 {'name': 'Wikidata (via the QLever SPARQL endpoint)', 'what': 'which compounds have an English Wikipedia article, how many Wikipedias carry them (the recognisability measure), and their “has use” statements',
  'licence': 'CC0 1.0', 'url': 'https://www.wikidata.org/', 'read': TODAY},
 {'name': 'WHO Model List of Essential Medicines (names read from its English Wikipedia article)', 'what': 'which medicines are essential — names only, each resolved through PubChem',
  'licence': 'the names are facts; no article text is reproduced (the article itself is CC BY-SA 4.0)',
  'url': 'https://en.wikipedia.org/wiki/WHO_Model_List_of_Essential_Medicines', 'read': TODAY},
 {'name': 'λWAVES’ own curated lists (tools/volumes/catalogue/curated.py, app_tags.py)', 'what': 'the chemistry classics, cages, materials, atmosphere, food, colours, life and fuels — names resolved through PubChem — and the app’s own tags and blurbs',
  'licence': 'the repository’s own', 'url': None, 'read': TODAY},
 {'name': 'RDKit 2026.09.1 and tblite 0.7.0 (GFN2-xTB)', 'what': 'the geometries PubChem has no conformer for, and the inorganic and organometallic ones MMFF94 cannot hold',
  'licence': 'BSD-3-Clause (RDKit), LGPL-3.0 (tblite)', 'url': None, 'read': TODAY},
]
out = {'schema': 1, 'built': datetime.datetime.now().astimezone().isoformat(timespec='seconds'), 'volume': VOL,
       'generator': 'tools/volumes/catalogue/build.py (iteration 004, row CAT)', 'count': len(molecules),
       'tagVocabulary': VOCAB, 'sources': SOURCES, 'molecules': molecules}
os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
write_json(OUT, out)

bins = [('≤10', 0, 10), ('11–20', 11, 20), ('21–30', 21, 30), ('31–40', 31, 40), ('41–50', 41, 50), ('>50', 51, 10 ** 6)]
def binned(h):
    for nm, lo, hi in bins:
        if lo <= h <= hi: return nm
    return '?'
stats = {
 'built': out['built'], 'count': len(molecules),
 'bySource': dict(collections.Counter(db for m in molecules for db in sorted({s['db'] for s in m['sources']})).most_common()),
 'bySourceSet': dict(collections.Counter(' + '.join(sorted({s['db'] for s in m['sources']} - {'PubChem'})) for m in molecules).most_common()),
 'byTag': dict(collections.Counter(t for m in molecules for t in m['tags']).most_common()),
 'byTagCount': dict(collections.Counter(len(m['tags']) for m in molecules)),
 'byHeavyBin': {nm: sum(1 for m in molecules if binned(m['heavy']) == nm) for nm, _, _ in bins},
 'byGeometry': dict(collections.Counter(('app pinned' if g.startswith("the app's own") else 'PubChem 3-D conformer' if g.startswith('PubChem')
                                         else 'GFN2-xTB' if 'GFN2-xTB' in g else 'RDKit ETKDGv3 + MMFF94')
                                        for g in (m['geometrySource'] for m in molecules)).most_common()),
 'byBlurbSource': dict(collections.Counter(m['blurbSource'] for m in molecules)),
 'excludedCount': len(excluded),
 'excludedByReason': dict(collections.Counter(re.sub(r'\d+', 'N', e['why'].split('—')[0].strip())[:110] for e in excluded).most_common()),
 'excludedBySource': dict(collections.Counter(e.get('src', '?') for e in excluded).most_common()),
 'screens': {'cwc': sum(1 for e in excluded if e.get('screen') == 'CWC'), 'illicit': sum(1 for e in excluded if e.get('screen') == 'illicit'),
             'namedScheduled': len(WEAPON_NAMED), 'namedControlled': len(ILLICIT_NAMED)},
 'sources': SOURCES, 'tagVocabulary': VOCAB,
 'samples': [{'id': m['id'], 'name': m['name'], 'tags': m['tags'], 'heavy': m['heavy'], 'priority': m['priority']} for m in molecules[:40]],
 'guards': {'previous': PREV, 'previousRows': len(prev_by_id), 'previousIdsPresent': len(prev_by_id) - len(lost), 'previousIdsMissing': lost,
            'solvedInRaw': len(SOLVED), 'idsFrom': dict(id_from.most_common()), 'refreshGeometry': REFRESH,
            'keptSolvedGeometry': dict(kept_solved.most_common()), 'keptSolvedWithConformerWaiting': len(upgrade_waiting),
            'solvedRowsMoved': refreshed_solved},
 'pubchem': {'conformers': len(conf), 'conformersAsked': len(need3d), 'synonymsFor': len(syn), 'descriptionsFor': len(desc), 'live': len(live),
             'cacheOnly': bool(C.OFFLINE), 'stopped': PUBCHEM_STOPPED},
}
write_json(sibling(OUT, 'stats'), stats, indent=1)
write_json(sibling(OUT, 'excluded'), {'built': out['built'], 'count': len(excluded), 'rows': excluded}, indent=1)
log(f'WROTE {OUT} — {len(molecules)} molecules, {len(excluded)} exclusions (and {sibling(OUT, "stats")}, {sibling(OUT, "excluded")})')
gbad, gnotes = GU.verify(out, prev_by_id, SOLVED, excluded, allow_moved=REFRESH)
for s in gnotes: log('guards: ' + s)
for what, s in gbad[:40]: log(f'guards: ! {what}: {s}')
log(f'guards: {len(gbad)} complaints — check.py {OUT} --against {PREV} is the gate before the swap')
print('by tag:', stats['byTag'])
print('by heavy bin:', stats['byHeavyBin'])
print('by geometry:', stats['byGeometry'])
print('top exclusions:', list(stats['excludedByReason'].items())[:12])
