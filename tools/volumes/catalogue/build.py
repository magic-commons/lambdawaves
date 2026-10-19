"""build.py — THE CATALOGUE (iteration 004, row CAT; PLAN.md THE PIPELINE step 1) → <catalogue>/vol-1.candidates.json

Run the six collectors first (each caches, so a re-run asks the network nothing):
  node   tools/volumes/catalogue/app-own.mjs        the app's own 98, at their pinned geometries
  python -I tools/volumes/catalogue/fetch_chembl.py  ChEMBL approved small-molecule drugs + ATC
  python -I tools/volumes/catalogue/fetch_atc.py     the ATC classification's own words
  python -I tools/volumes/catalogue/chebi.py         ChEBI 3-star roles and structural classes
  python -I tools/volumes/catalogue/fetch_wikidata.py  Wikidata: every compound with an English Wikipedia article
  python -I tools/volumes/catalogue/fetch_who_eml.py   the WHO Model List of Essential Medicines (names)
then
  python -I tools/volumes/catalogue/build.py [--limit=N] [--no-geometry] [--refresh-geometry] [--rebuild-geometry] [--out=FILE] [--prev=FILE] [--raw=DIR]
                                             [--older=FILE,…] [--jobs=N] [--fetch-only]      (the last three: iteration 006 C7)

Every nomination is resolved through PubChem (a name or an InChIKey → a CID → its record; a salt or a charged form → PubChem's
own PARENT), merged by InChIKey (one entry per key, tags and sources from every nomination), filtered, given a geometry
(geom.py) and tagged from PLAN.md's vocabulary ONLY.  The run's numbers go to <catalogue>/vol-1.stats.json, which report.py
turns into research/iteration-004/CAT-BUILD.md.

THE TWO GUARDS (iteration 006 C2; guards.py says why): (a) a row whose id has a converged rung under raw/<id>/ keeps the exact atoms
it was solved at, even when PubChem's conformer has since arrived.  --refresh-geometry (narrowed in iteration 006 C3, Josh's yes) lifts
it for ONE kind of row only: a solved row on a local geometry (RDKit, xTB; never the app's pinned atoms, never a hand-built framework)
whose PubChem 3-D conformer exists and can be used, and only when the build's own rule then gives it a PubChem-based geometry that
DIFFERS from the solved atoms.  The moved rows are named in the log and in the stats (guards.solvedRowsMoved, guards.upgraded: old and
new source), because the solver will solve each again from STO-3G; any other solved row that moved stops the build.  The geometry
cache is untouched by it for every other row (--rebuild-geometry ignores the cache for the UNSOLVED rows, the old full rebuild);
(b) a row keeps the id the previous candidates file
(--prev, default the current <catalogue>/vol-1.candidates.json) gave its InChIKey, and a new row's slug collision takes the suffix,
never an old row.  --out writes the candidates (and its .stats/.excluded siblings) elsewhere — vol-1.candidates.next.json — so the
running solvers' file is replaced only after check.py has passed the new one (check.py FILE --against PREV).

ITERATION 006 C4: THE SCREENS MATCH ON THE SKELETON (step 5: every signal screens its InChIKey first block, an approved medicine in a
controlled ATC group screens its own; a skeleton-mate stays only when it is itself a ChEMBL approved drug) and THE DRUG-CLASS WORDS
COME FROM THE MOLECULE ITSELF (step 9: its own ATC codes, ChEBI roles curators checked on its own entity — never a salt's, a mixture's,
a counter-ion's, an is_a ancestor's or a SUBMITTED one).  Offline, a batched PubChem answer is found CID by CID (pubchem.py), so a
catalogue that loses a row keeps every other row's synonyms and descriptions.

ITERATION 006 C5: THE TAGS SAY WHAT THE MOLECULE IS (Josh, 2026-10-18: "I just wanted tags related to the molecules structure or
class").  A row's tags come from structure_tags.py only — its own structure (RDKit ring analysis and documented SMARTS) and its ChEBI
structural class (CHECKED is_a only, chebi.py's structure-classes.json) — never from a use (medicine, food, fuel …).  The use words
of iterations 004–006 C4 (USE_VOCAB) are still COMPUTED, never written: the catalogue's membership has always required a row to earn
one of them (425 nominations are refused for having none), and that test is kept so no molecule enters or leaves; and the last
fallback of a λWAVES blurb still names the first of them, so no blurb changes.

ITERATION 006 C7: MORE MOLECULES (Josh, 2026-10-18: "add in whatever molecules you can.  If it's not allowed by the safeguards then
exclude it").  One rebuild widens the catalogue; nothing already in it moves (the two guards):
  · RECOGNISABILITY IS NO LONGER A FILTER — a named compound only Wikidata (in < 12 Wikipedias) or only ChEBI (no Wikipedia) nominates
    is a row; recognisable() now only ORDERS the rows (the recognisable first in each tier, then small before large);
  · THE USE-WORD GATE IS GONE — a row no longer has to earn a use word (every row has a structure tag since C5); a row with no
    structure tag stays out;
  · A SALT OR A MIXTURE IS ITS NEUTRAL PARENT — a Wikidata article's compound that PubChem counts as several units is folded onto its
    largest organic (else covalent) fragment, neutralised, as every other source's always was, and merged by InChIKey; a row that
    exists only through salts is named by PubChem's title of the parent (the salt's name only when that title is systematic);
  · A CLOSED-SHELL ION KEEPS ITS CHARGE — an ion with no neutral parent (and a Wikidata article about the ion itself) is a row with its
    charge (RHF holds it; the electron count is Σ Z − charge, and an xTB relaxation is told the charge);
  · THE HEAVY-ATOM CAP IS 70 (was 50) — the rows of 51–70 heavy atoms go to the Rent-A-GPU-day queue only (queues.py);
  · THE CONTROLLED-SUBSTANCE SCREEN IS REMOVED (Josh's decision): a controlled medicine, a racemate beside one, a substance on the old
    illicit list are ordinary rows; the rows it refused come back under the ids an earlier file gave them (--older, guard (b)).  THE
    CWC SCREEN IS UNCHANGED, word for word.
  · Still out: the CWC screen's rows, an element past krypton, an odd electron count or a radical, an isotopically labelled compound,
    a row with no geometry or no structure tag.  A PubChem answer a cache-only run could not have (pubchem.PENDING) holds its row back
    as "pending", never as missing, and never builds a local geometry in place of a conformer not yet asked for.
  · --jobs=N (default 2): the local geometries (RDKit, xTB) are built by N worker processes, each one thread at the build's niceness.
  · --fetch-only: ask PubChem for what the rows that pass the filters want (records, parents, 3-D conformers, synonyms, descriptions)
    and stop, writing nothing — the asking can be spread over PubChem's calm hours (common.py stops at its Red or Black service
    status) and the one real build runs from the cache.
"""
import collections, datetime, json, os, re, sys, time
sys.path.insert(0, os.path.dirname(__file__))
from common import DATA, CACHE, read_json, write_json, sibling
import common as C
import pubchem as P
import geom as G
import guards as GU
import curated as CUR
import structure_tags as ST
from app_tags import APP, APP_REFUSED
from rdkit import Chem, RDLogger
from rdkit.Chem import rdMolDescriptors as RD
from rdkit.Chem.MolStandardize import rdMolStandardize
RDLogger.DisableLog('rdApp.*')

VOL, TODAY = 'vol-1', datetime.date.today().isoformat()
LIMIT = int(next((a.split('=')[1] for a in sys.argv if a.startswith('--limit=')), 0))
GEOMETRY = '--no-geometry' not in sys.argv
FETCH_ONLY = '--fetch-only' in sys.argv                            # C7: fill the PubChem cache for every row that passes, then stop
REFRESH = '--refresh-geometry' in sys.argv                         # move the waiting SOLVED rows onto PubChem's conformer (C3; see step 7)
REBUILD = '--rebuild-geometry' in sys.argv                         # ignore the geometry cache for the UNSOLVED rows (guard (a) stays on)
def _opt(name, default):
    v = next((a.split('=', 1)[1] for a in sys.argv if a.startswith(f'--{name}=')), None)
    return os.path.expanduser(v) if v else default
OUT = _opt('out', os.path.join(DATA, f'{VOL}.candidates.json'))
PREV = _opt('prev', os.path.join(DATA, f'{VOL}.candidates.json'))
RAW = _opt('raw', GU.raw_dir(DATA))
# iteration 006 C7: the EARLIER candidates files whose ids still hold for their InChIKeys (a row a screen once refused comes back
# under its old id); default every vol-1.candidates.<tag>.json kept beside the live file, newest first
def _older_default():
    import glob
    fs = [f for f in glob.glob(os.path.join(DATA, f'{VOL}.candidates.*.json')) if '.next' not in os.path.basename(f)]
    fs = [f for f in fs if os.path.abspath(f) not in (os.path.abspath(OUT), os.path.abspath(PREV))]
    return sorted(fs, key=os.path.getmtime, reverse=True)
OLDER = [os.path.expanduser(f) for f in _opt('older', '').split(',') if f] or _older_default()
JOBS = int(_opt('jobs', '2'))
MAX_HEAVY = 70                                                     # iteration 006 C7 (was 50): 51–70 go to the Rent-A-GPU-day queue
VOCAB = ST.VOCAB                                                   # iteration 006 C5: THE TAGS — what the molecule IS (structure_tags.py)
# THE USE WORDS of iterations 004–006 C4 — no longer any row's tags (C5).  They are still computed (use_words, step 9): the
# catalogue's membership requires a row to earn one (it always has: "no plain tag of the vocabulary fits it"), and a λWAVES blurb's
# last fallback names the first of them by USE_RANK.  Kept exactly as they were, so neither the rows nor the blurbs move.
USE_VOCAB = ['medicine', 'painkiller', 'antibiotic', 'antiviral', 'heart', 'mind', 'cancer', 'allergy', 'anaesthetic', 'vitamin', 'hormone',
         'neurotransmitter', 'amino acid', 'nucleobase', 'sugar', 'fat', 'steroid', 'alkaloid', 'food', 'flavour', 'scent', 'sweetener',
         'colour', 'solvent', 'fuel', 'plastic', 'material', 'metal', 'gas', 'atmosphere', 'pollutant', 'toxin', 'pesticide', 'acid',
         'aromatic', 'ring', 'cage', 'classic', 'natural', 'life',
         # iteration 006 C3 (Josh's yes, 2026-10-18): seven medicine words from the ATC map, three hand-list words outside medicine
         'eye', 'lung', 'skin', 'stomach', 'diabetes', 'parasite', 'immune', 'refrigerant', 'battery', 'explosive']
# a use word's rank (iteration 006 C3): what it IS FOR first, what it IS second, how it is BUILT last — now only the order in which a
# blurb's last fallback picks its word
USE_RANK = {t: i for i, t in enumerate([
    'medicine', 'explosive', 'refrigerant', 'battery', 'painkiller', 'antibiotic', 'antiviral', 'heart', 'mind', 'cancer', 'allergy',
    'anaesthetic', 'vitamin', 'hormone', 'neurotransmitter', 'toxin', 'pesticide', 'pollutant', 'sweetener', 'flavour', 'scent',
    'colour', 'food', 'diabetes', 'parasite', 'immune', 'lung', 'stomach', 'eye', 'skin', 'fuel', 'solvent',
    'plastic', 'material', 'atmosphere', 'amino acid', 'nucleobase', 'sugar', 'fat', 'steroid', 'alkaloid', 'life', 'natural',
    'metal', 'gas', 'acid', 'cage', 'aromatic', 'ring', 'classic'])}
ATC_TAGS = [('N02', 'painkiller'), ('M01', 'painkiller'), ('M02', 'painkiller'), ('N01', 'anaesthetic'), ('N03', 'mind'), ('N05', 'mind'),
            ('N06', 'mind'), ('N07', 'mind'), ('B01', 'heart'), ('C', 'heart'), ('J01', 'antibiotic'), ('J04', 'antibiotic'),
            ('J05', 'antiviral'), ('L01', 'cancer'), ('L02', 'cancer'), ('R06', 'allergy'), ('H', 'hormone'), ('G03', 'hormone'),
            ('A11', 'vitamin'),
            # iteration 006 C3: on the drug's OWN, non-combination codes (fetch_chembl.py's `atc`, as C2 fixed it), like the rest
            ('S01', 'eye'), ('R03', 'lung'), ('R05', 'lung'), ('D01', 'skin'), ('D06', 'skin'), ('D07', 'skin'), ('D10', 'skin'),
            ('D11', 'skin'), ('A02', 'stomach'), ('A03', 'stomach'), ('A06', 'stomach'), ('A07', 'stomach'), ('A10', 'diabetes'),
            ('P01', 'parasite'), ('P02', 'parasite'), ('P03', 'parasite'), ('L03', 'immune'), ('L04', 'immune')]
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
# iteration 006 C7: the ids the EARLIER files gave (newest file first): a key's earlier id, when no later file and no solve in raw/
# gave that id to another molecule — so a row a screen refused in between comes back under its own id
older_id_by_key, older_ids = {}, set()
for _f in OLDER:
    _by_id, _by_key, _ = GU.previous(_f)
    older_ids |= set(_by_id)
    for _k, _i in _by_key.items():
        if _k in older_id_by_key: continue
        if (_i in prev_by_id and prev_by_id[_i].get('inchikey') != _k) or (_i in SOLVED and SOLVED[_i]['inchikey'] not in (None, _k)): continue
        older_id_by_key[_k] = _i
log(f'guards: {len(prev_by_id)} rows in the previous file ({PREV}) · {len(SOLVED)} ids with a solved rung in {RAW} '
    f'({sum(1 for s in SOLVED.values() if s["exact"])} reproducible exactly) · {len(older_ids)} ids in {len(OLDER)} earlier files'
    + (' · --refresh-geometry: guard (a) is OFF' if REFRESH else ''))

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
    nominate('chembl', inchikey=st['standard_inchi_key'], own_smiles=st.get('canonical_smiles'), smiles=st.get('canonical_smiles'), tags=tags, approved=True,
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
    nominate('chebi', inchikey=k, own_smiles=e['smiles'], tags=e['roleTags'] + e['classTags'], role_tags=e['roleTags'], own_role_tags=e.get('ownRoleTags'), class_tags=e['classTags'],
             screens=e['screens'], ref={'db': 'ChEBI', 'id': f'CHEBI:{e["chebi"]}'}, chebi_name=e['name'], definition=e['definition'],
             wikipedia=e['wikipedia'], synonyms=e['synonyms'][:8], iupac=e.get('iupac'))
for cat, spec in CUR.CATEGORIES.items():
    for it in spec['items']:
        name, extra, opts = (it, [], {}) if isinstance(it, str) else (it[0], it[1], it[2] if len(it) > 2 else {})
        if opts.get('skip') and name not in CUR.C7_LIFTED: nominate('curated-skip', name=name, why=opts['skip'], cat=cat); continue
        nominate('curated', name=name, query=opts.get('query', name), smiles=opts.get('smiles'), formula=opts.get('formula'),
                 tags=[t for t in spec['tags'] + extra if t in USE_VOCAB], display=opts.get('display'), blurb=opts.get('blurb'),
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
def several_units(p): return (p.get('CovalentUnitCount', 1) or 1) > 1
# the records of the hand-built molecules (ferrocene, bis(benzene)chromium, diborane): PubChem draws a sandwich as a metal cation and
# two ring anions — several units — but the molecule IS the sandwich, so no nomination of such a record is ever folded onto a "parent"
# (C7: a Wikidata article of ferrocene would otherwise carry the record, and the hand-built nomination with it, onto cyclopentadiene)
HAND_CIDS = {n.get('cid') for n in noms if n['src'] == 'curated' and n['name'] in HAND_GEOM and n.get('cid')}
for n in noms:
    c, p = n.get('cid'), props.get(n.get('cid'))
    if not p or c in HAND_CIDS: continue
    # a Wikidata nomination is the article's own compound — an ion's article is about the ion, kept with its charge — except a salt
    # or a mixture (several units), which is folded onto its neutral parent like every other source's (iteration 006 C7)
    if n['src'] == 'wikidata' and not several_units(p): continue
    if n['src'] == 'curated' and n['name'] in HAND_GEOM: continue
    if several_units(p) or (p.get('Charge', 0) or 0) != 0:
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
OLD_WANT = {n.get('cid') for n in noms if n['src'] != 'wikidata' and props.get(n.get('cid'))
            and not (n['src'] == 'curated' and n['name'] in HAND_GEOM)
            and (several_units(props[n['cid']]) or (props[n['cid']].get('Charge', 0) or 0) != 0)}
for n in noms:
    c = n.get('cid')
    if parent_of.get(c) and parent_of[c] != c:
        n['from_cid'], n['cid'] = c, parent_of[c]
        # a Wikidata article folded onto a parent only because it is a SALT (C7) — before C7 a Wikidata nomination was folded only
        # when another source's nomination of the same record asked for its parent
        if n['src'] == 'wikidata' and c not in OLD_WANT: n['c7_salt'] = True

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
        # iteration 006 C7: what a cache-only run could not ask is PENDING, not missing (pubchem.PENDING)
        pend = (c and c in P.PENDING['properties']) or (not c and (n.get('query') in P.PENDING['names'] or n.get('name') in P.PENDING['names']
                                                                   or n.get('inchikey') in P.PENDING['inchikeys'] or n.get('smiles') in P.PENDING['smiles']))
        if pend: exclude(n.get('name') or n.get('chembl_name') or n.get('wd_title') or n.get('chebi_name') or str(c),
                         'pending: PubChem was not asked for its record (the run was cache-only) — a calm run fills it', src=n['src'], cid=c)
        elif n['src'] in ('curated', 'who'): exclude(n['name'], 'PubChem has no compound under this name', src=n['src'])
        elif n['src'] == 'chembl': exclude(n.get('chembl_name') or n['ref']['id'], 'PubChem does not carry this InChIKey', src='chembl')
        continue
    if not p.get('InChIKey') or not p.get('MolecularFormula'):
        exclude(n.get('name') or n.get('chembl_name') or str(c), 'PubChem\'s record for it carries no InChIKey or no formula', src=n['src'], cid=c); continue
    if n['src'] == 'curated' and n.get('formula') and p['MolecularFormula'] != n['formula']:
        exclude(n['name'], f'PubChem read the name as {p["MolecularFormula"]}, not the expected {n["formula"]}', src='curated'); continue
    entry_for(p['InChIKey'], c)['noms'].append(n)
log(f'merged: {len(entries)} unique InChIKeys')
# THE MOLECULE ITSELF (iteration 006 C4).  A nomination can reach an entry through a SALT or a MIXTURE folded onto one of its fragments:
# ChEMBL keeps an inorganic or a mixed substance as its own "parent" (magnesium sulfate, lithium carbonate, calcium gluconate, the
# omega-3 ethyl esters), ChEBI files its salts and hydrates as entities, and the build folds each onto its largest organic fragment,
# neutralised (parent_key) or onto PubChem's parent of a salt (from_cid) — so magnesium sulfate's ChEBI roles (analgesic,
# anticonvulsant …) and ChEMBL's six metal sulfates landed on sulfuric acid, lithium citrate's and sodium citrate's on citric acid.
# A nomination is about the molecule ITSELF when its own structure is ONE molecule (a single component, water of crystallisation
# aside — a charged form of it, an acid's conjugate base, is the same molecule) and, for a name, PubChem did not have to take a salt's
# parent for it.  The test is the structure's, not the InChIKey's: ChEMBL draws tetracycline, minoxidil and chlordiazepoxide as other
# tautomers than PubChem's record, and atropine with other stereo flags, and each is still that drug.  Only such a nomination gives a
# row a drug-class word, and only a ChEMBL approved parent that IS the row makes it "itself an approved drug" for the screens below.
def one_molecule(smiles):
    parts = [s for s in (smiles or '').split('.') if s and s not in ('O', '[OH2]')]
    return len(parts) == 1
def is_own(n):
    if n['src'] in ('chembl', 'chebi'): return one_molecule(n.get('own_smiles'))
    return not n.get('from_cid')

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
def skeletons_of(p):
    """the InChIKey first block(s) a PubChem record stands for: its own and, for a salt or a charged form, its neutral parent's
    (the largest organic fragment, neutralised — parent_key), so a screened salt screens the molecule it is a salt of"""
    if not p or not p.get('InChIKey'): return []
    out = [skeleton(p['InChIKey'])]
    if (p.get('CovalentUnitCount', 1) or 1) > 1 or (p.get('Charge', 0) or 0) != 0:
        sm = p.get('SMILES') or p.get('ConnectivitySMILES')
        k = parent_key(sm) if sm else None
        if k and skeleton(k) not in out: out.append(skeleton(k))
    return out
def block_list(names):
    out = {}
    for nm in names:
        cs = P.name_cids(nm)
        if not cs: continue
        c = cs[0]
        if c not in props: props.update(P.properties([c]))
        for sk in skeletons_of(props.get(c)): out.setdefault(sk, nm)
    return out
WEAPON_NAMED = block_list(CUR.CWC_NAMES)
log(f'screens: {len(WEAPON_NAMED)} scheduled chemicals resolved by name (the controlled-substance screen is removed: iteration 006 C7)')
# THE SCREEN MATCHES ON THE SKELETON (iteration 006 C4).  The Annex names always matched on the InChIKey's first block (the
# connectivity skeleton); every other signal (Wikidata's weapon uses) screens its whole skeleton too — the racemate, the enantiomers,
# the isotopologues and protonated forms (one first block), and a salt's neutral parent (skeletons_of).  A row that shares a
# screened skeleton passes only when it is ITSELF an approved drug by ChEMBL (max_phase 4: a ChEMBL approved parent whose structure is
# this row — is_own()).  The class patterns are structural, so every member of a skeleton already meets them on its own; the CWC's
# Annex names and classes refuse outright, approved or not (the law: every scheduled agent and precursor).
# THE CONTROLLED-SUBSTANCE SCREEN (iterations 004–006 C4: the illicit names, ChEBI's hallucinogen and opioid roles, Wikidata's
# recreational-drug uses, the controlled-medicine ATC groups) IS REMOVED in iteration 006 C7, Josh's decision ("That's only the
# human's relation with the molecule that's the problem"): those molecules are ordinary rows.  The CWC screen is unchanged.
def cwc_signal(e):
    # (C7: a Wikidata SALT folded onto this entry carries its signal through the skeleton table below, exactly as the salt's own
    # entry did before C7 — so the screen refuses what it refused, no more and no less)
    uses = sorted({u for n in e['noms'] if not n.get('c7_salt') for u in n.get('uses', []) if u in WD_WEAPON_USES})
    return f'Wikidata records it as a chemical warfare agent ({", ".join(uses)})' if uses else None
def label(e):
    """a readable name for an entry the screen talks about (the row name rule comes later, in the filters)"""
    return (next((clean_wiki_title(n['wd_title']) for n in e['noms'] if n['src'] == 'wikidata'), None)
            or next((n.get('display') or n['name'] for n in e['noms'] if n['src'] == 'curated'), None)
            or (props.get(e['cid']) or {}).get('Title') or next((n['chebi_name'] for n in e['noms'] if n.get('chebi_name')), None)
            or next((n['chembl_name'] for n in e['noms'] if n.get('chembl_name')), None) or e['key'])
CWC_SKELETON = {}                                                   # first block → (the molecule that carries the signal, its key, the signal)
for key, e in entries.items():
    if e['app'] or not e['cid'] or key.startswith('APP-'): continue
    p = props.get(e['cid'])
    sig = cwc_signal(e)
    if sig:
        for sk in skeletons_of(p): CWC_SKELETON.setdefault(sk, (label(e), key, sig))
    # a Wikidata salt's own signal, as the salt's own entry gave it before C7: its skeleton and its neutral parent's (skeletons_of)
    for n in e['noms']:
        if not n.get('c7_salt'): continue
        uses = sorted({u for u in n.get('uses', []) if u in WD_WEAPON_USES})
        sp = props.get(n['from_cid'])
        if uses and sp:
            for sk in skeletons_of(sp):
                CWC_SKELETON.setdefault(sk, (clean_wiki_title(n['wd_title']), sp['InChIKey'], f'Wikidata records it as a chemical warfare agent ({", ".join(uses)})'))
log(f'screen by skeleton: {len(CWC_SKELETON)} first blocks carry a CWC signal')

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

kept, SCREEN_KEPT = [], []                                          # SCREEN_KEPT: rows a screened skeleton holds, kept as approved drugs
PARENT_PENDING = {c for c in want_parent if not parent_of.get(c) and c in P.PENDING['parents']}
def systematic(t):
    """a PubChem title that reads as a systematic name rather than a name people use (C7: a salt-only row's name rule)"""
    return not t or len(t) > 40 or '[' in t or t.count('-') >= 3 or bool(re.match(r'^[\d(]', t))
for key, e in entries.items():
    a, p = e['app'], (props.get(e['cid']) if e['cid'] else None)
    srcs = sorted({n['src'] for n in e['noms']} | ({'app'} if a else set()))
    e['srcs'], e['approved'] = srcs, any(n.get('approved') for n in e['noms'])
    e['hand'] = any(n['src'] == 'curated' and n['name'] in HAND_GEOM for n in e['noms'])
    # THE NAME: a nomination that reached this entry through a salt's PARENT (from_cid) names the salt — "Benzathine benzylpenicillin",
    # "Dimenhydrinate", "Lithium diisopropylamide" — so a curated or Wikidata name of the compound ITSELF comes first (C2, 2026-10-17: the
    # full run resolved those parents online and three old rows took their salt's name); the salt's name still beats PubChem's systematic
    # title, so a dye whose acid has no name of its own stays "Methyl Orange" rather than "Benzenesulfonic acid, 4-(2-(4-…".
    # Iteration 006 C7: a Wikidata article's SALT now reaches its parent too (c7_salt), and its title names the salt ("Sodium
    # valproate"): it comes after PubChem's own title of the parent — before it only when that title is systematic and the row is new
    # (a row of the previous file keeps the name the earlier rule gave it)
    own = lambda n: not n.get('from_cid')
    title = (p or {}).get('Title')
    salt_wd = next((clean_wiki_title(n['wd_title']) for n in e['noms'] if n['src'] == 'wikidata' and n.get('c7_salt')), None)
    nm = (a['name'] if a else None) or next((n.get('display') or n.get('name') for n in e['noms'] if n['src'] == 'curated' and own(n)), None) \
        or next((clean_wiki_title(n['wd_title']) for n in e['noms'] if n['src'] == 'wikidata' and own(n)), None) \
        or next((n.get('display') or n.get('name') for n in e['noms'] if n['src'] == 'curated'), None) \
        or next((clean_wiki_title(n['wd_title']) for n in e['noms'] if n['src'] == 'wikidata' and not n.get('c7_salt')), None) \
        or (salt_wd if salt_wd and systematic(title) and key not in prev_id_by_key else None) \
        or title or next((n['chembl_name'] for n in e['noms'] if n.get('chembl_name')), None) or salt_wd or key
    e['nm'] = nm
    if a: kept.append(e); continue                                    # the app's own: kept at its pinned geometry, whatever its size
    # RECOGNISABILITY (iteration 006 C7) no longer refuses a row: it orders the rows (step 11), the recognisable first
    e['recognisable'], e['obscure'] = recognisable(e)
    smiles = p.get('SMILES') or p.get('ConnectivitySMILES')
    mol = Chem.MolFromSmiles(smiles) if smiles else None
    if mol is None and not e['hand']: exclude(nm, 'its PubChem structure does not parse', src='/'.join(srcs), cid=e['cid']); continue
    molH = Chem.AddHs(mol) if mol is not None else None
    e['mol'], e['molH'] = mol, molH
    # the screens first, so a refused substance is never described further (iteration 006 C4: on the skeleton; see THE SCREENS)
    e['approvedSelf'] = any(n['src'] == 'chembl' and is_own(n) for n in e['noms'])
    sk = skeleton(key)
    w = WEAPON_NAMED.get(sk) or (weapon_class(mol) if mol is not None else None)
    if w: exclude(nm, 'refused: on the Chemical Weapons Convention schedules or in a scheduled family — ' + w, src='/'.join(srcs), screen='CWC', key=key); continue
    if cwc_signal(e):
        exclude(nm, 'refused: Wikidata records it as a chemical warfare agent', src='/'.join(srcs), screen='CWC', key=key); continue
    if sk in CWC_SKELETON and not e['approvedSelf']:
        who_, k_, sig = CWC_SKELETON[sk]
        exclude(nm, f'refused: it shares its connectivity skeleton with a molecule the CWC screen refuses, and is not itself an approved drug '
                    f'— {who_} ({k_}): {sig}; InChIKey first block {sk}', src='/'.join(srcs), screen='CWC', key=key, skeleton=sk, via=k_); continue
    if sk in CWC_SKELETON: SCREEN_KEPT.append({'name': nm, 'key': key, 'screen': 'CWC', 'via': CWC_SKELETON[sk][1], 'viaName': CWC_SKELETON[sk][0], 'signal': CWC_SKELETON[sk][2]})
    Zs = [x.GetAtomicNum() for x in molH.GetAtoms()] if molH is not None else []
    heavy = p.get('HeavyAtomCount') or sum(1 for z in Zs if z > 1)
    # iteration 006 C7: a closed-shell ION is a row with its charge (an ion whose neutral parent PubChem carries was folded onto it in
    # step 3, as always); the electron count is Σ Z − charge
    charge = 0 if e['hand'] else int(p.get('Charge', 0) or 0)
    nelec = sum(Zs) - charge
    why = None
    if p.get('IsotopeAtomCount'): why = 'an isotopically labelled compound'
    elif not e['hand'] and several_units(p) and e['cid'] in PARENT_PENDING:
        why = 'pending: a salt or a mixture whose neutral parent PubChem was not asked for (the run was cache-only) — a calm run fills it'
    elif not e['hand'] and several_units(p): why = f'not one molecule: PubChem counts {p["CovalentUnitCount"]} separate units, and it has no neutral parent'
    elif any(z > 36 for z in Zs): why = 'an element beyond krypton (' + ', '.join(sorted({PTS.GetElementSymbol(z) for z in Zs if z > 36})) + ')'
    elif heavy > MAX_HEAVY: why = f'{heavy} heavy atoms, past the {MAX_HEAVY} the volume allows'
    elif heavy < 1: why = 'no heavy atom'
    elif nelec % 2: why = f'an odd electron count ({nelec}): an open shell, not an RHF molecule'
    elif mol is not None and not e['hand'] and sum(x.GetNumRadicalElectrons() for x in molH.GetAtoms()): why = 'a radical (RDKit finds unpaired electrons): an open shell'
    if why: exclude(nm, why, src='/'.join(srcs), cid=e['cid']); continue
    e['heavy'], e['Zs'], e['charge'] = heavy, Zs, charge
    kept.append(e)
log(f'through the filters: {len(kept)} (excluded so far {len(excluded)})')
if LIMIT: kept = kept[:LIMIT]

# ── 7. GEOMETRY ──────────────────────────────────────────────────────────────────────────────────────────────────────
OMEGA = "PubChem's own 3-D conformer (OpenEye OMEGA, MMFF94s)"
GCACHE = os.path.join(CACHE, 'geometry.json')                       # keyed by InChIKey: an xTB relaxation is never repeated
gcache = read_json(GCACHE) if os.path.exists(GCACHE) else {}
gdirty = 0
need3d = sorted({e['cid'] for e in kept if not e['app'] and e['cid']})
conf = P.conformers(need3d) if GEOMETRY or FETCH_ONLY else {}
log(f'PubChem 3-D conformers: {len(conf)}/{len(need3d)}')
if FETCH_ONLY:
    # --fetch-only (iteration 006 C7): ask PubChem for everything the rows that passed the filters will want — their 3-D conformers,
    # synonyms and descriptions — into the cache, and stop: no geometry is built and nothing is written, so the asking can be spread over
    # PubChem's calm hours and the one real build then runs from the cache
    _cids = sorted({e['cid'] for e in kept if e['cid']})
    _syn, _desc = P.synonyms(_cids), P.descriptions(_cids)
    log(f'--fetch-only: conformers {len(conf)}/{len(need3d)} · synonyms {len(_syn)} · descriptions {len(_desc)} of {len(_cids)} CIDs · '
        f'{C._throttle["requests"]} requests · ' + (f'STOPPED: {C.STOPPED}' if C.STOPPED else 'PubChem never stopped us')
        + ' · pending ' + (', '.join(f'{k} {len(v)}' for k, v in sorted(P.PENDING.items()) if v) or 'nothing'))
    raise SystemExit(0)
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
geom_counts, kept_solved, upgrade_waiting, upgraded = collections.Counter(), collections.Counter(), [], {}
def pubchem_based(src): return bool(src) and (src.startswith('PubChem') or "from PubChem's 3-D conformer" in src)
def keep_solved(e, sid):
    """GUARD (a): a solved molecule keeps the atoms it was solved at — byte for byte, no rounding, the cache untouched"""
    s = SOLVED[sid]
    e['atoms'] = [[int(a[0]), a[1], a[2], a[3]] for a in s['atomsAng']]
    e['gsource'] = s['geometrySource'] or f'the atoms raw/{sid}/ was solved at'
    e['keptSolved'] = sid
    k = gkind(e['gsource']); geom_counts[k] += 1; kept_solved[k] += 1
def usable_conformer(e):
    """PubChem's 3-D conformer for this row when the build could actually use it (it exists and its elements agree), else None"""
    if e['app'] or e['cid'] not in conf: return None
    got, _ = G.from_sdf(conf[e['cid']])
    return got if got and elements_agree(got, e['Zs']) else None
def cached_geometry(e):
    """the geometry cache's answer for a row when it STANDS → (atoms, source, kind) or (None, why, 'failed, cached'); None when the
    row must be built (again)"""
    hit = gcache.get(e['key'])
    # a cached geometry stands, EXCEPT a locally built one for a molecule whose PubChem conformer has since arrived: PubChem's
    # own 3-D conformer is the preferred source (PLAN.md step 1), so that row is built again rather than left as it was.  An xTB
    # relaxation that already STARTED from PubChem's conformer (the inorganic and hypervalent rows) is not "since arrived": it stands,
    # so a re-run does not relax it again.  A FAILURE is cached too (iteration 006 C2: the few molecules no method embeds cost many
    # minutes of ETKDG each, every run) and is tried again only when a PubChem conformer has arrived since, or with --rebuild-geometry
    if hit and hit['kind'] == 'failed' and not REBUILD and (e['cid'] not in conf or hit.get('hadConformer')):
        return None, hit['source'], 'failed, cached'
    if hit and hit['kind'] != 'failed' and not REBUILD and (hit['kind'] == 'PubChem 3-D conformer' or e['cid'] not in conf or "from PubChem's 3-D conformer" in hit['source']):
        return hit['atoms'], hit['source'], hit['kind']
    return None
def geometry_job(e):
    """what THE BUILD'S OWN RULE needs of a row, picklable, so a worker process can build it (iteration 006 C7: --jobs)"""
    return {'key': e['key'], 'mol': e['mol'], 'molH': e['molH'], 'Zs': e['Zs'], 'pub': usable_conformer(e), 'charge': e.get('charge', 0),
            'hand': next((n['name'] for n in e['noms'] if n['src'] == 'curated' and n['name'] in HAND_GEOM), None),
            'hadConformer': e['cid'] in conf}
def compute_geometry(j):
    """THE BUILD'S OWN RULE for one row (no cache; a worker may run it) → (key, atoms Å, source, kind) or (key, None, why, 'failed').
    An ion is relaxed at its own charge (C7; every earlier row had charge 0)"""
    atoms = src = None
    pub, hand, mol, molH, q = j['pub'], j['hand'], j['mol'], j['molH'], j['charge']
    if hand:
        start = G.HAND[hand]()
        out, _, ok = G.xtb_relax(start)
        if out: atoms, src = out, f'built here as the known {hand} framework, then relaxed with GFN2-xTB (tblite 0.7.0){"" if ok is True else " — the relaxation did not converge"}'
    elif mol is not None and G.needs_xtb(molH):
        start = pub or G.vsepr_star(mol) or G.embed_any(Chem.MolToSmiles(mol))
        if start is not None:
            out, _, ok = G.xtb_relax(start, charge=q)
            if out and elements_agree(out, j['Zs']):
                if pub is not None and G.kabsch_rmsd(out, pub) <= 0.10: atoms, src = pub, OMEGA + ' — checked against a GFN2-xTB relaxation, which agrees within 0.10 Å'
                else:
                    atoms = out
                    src = ('GFN2-xTB relaxation (tblite 0.7.0) from ' +
                           ('PubChem\'s 3-D conformer' if pub is not None else 'a VSEPR start built here' if G.vsepr_star(mol) else 'an RDKit ETKDGv3 embedding') +
                           '; MMFF94 has no parameters for this centre' + ('' if ok is True else ' — the relaxation did not converge'))
    if atoms is None and pub is not None: atoms, src = pub, OMEGA
    if atoms is None and mol is not None:
        got = G.etkdg_mmff(Chem.MolToSmiles(mol))
        if got: atoms, src = got[0], f'RDKit ETKDGv3 + MMFF94, the lowest of ten embeddings, seed {G.SEED}'
    if atoms is None and mol is not None:
        start = G.embed_any(Chem.MolToSmiles(mol))
        if start is not None:
            out, _, ok = G.xtb_relax(start, charge=q)
            if out: atoms, src = out, f'RDKit ETKDGv3 embedding relaxed with GFN2-xTB (tblite 0.7.0){"" if ok is True else " — the relaxation did not converge"}'
    if atoms is None or not elements_agree(atoms, j['Zs']):
        return j['key'], None, 'no 3-D geometry: PubChem has no conformer and neither MMFF94 nor GFN2-xTB would build one', 'failed'
    atoms = [[int(z), round(x, 5), round(y, 5), round(zz, 5)] for z, x, y, zz in atoms]
    kind = 'PubChem 3-D conformer' if src.startswith('PubChem') else 'GFN2-xTB' if 'GFN2-xTB' in src else 'RDKit ETKDGv3 + MMFF94'
    return j['key'], atoms, src, kind
def remember_geometry(key, atoms, src, kind, had_conformer):
    global gdirty
    gcache[key] = ({'atoms': None, 'source': src, 'kind': 'failed', 'hadConformer': had_conformer} if atoms is None
                   else {'atoms': atoms, 'source': src, 'kind': kind})
    gdirty += 1
    if gdirty % 200 == 0: write_json(GCACHE, gcache)
def build_geometry(e):
    """THE BUILD'S OWN RULE for one row → (atoms Å, source, kind), or (None, why, 'failed' | 'failed, cached'); it reads and writes
    the geometry cache (keyed by InChIKey)"""
    got = cached_geometry(e)
    if got: return got
    j = geometry_job(e)
    _, atoms, src, kind = compute_geometry(j)
    remember_geometry(e['key'], atoms, src, kind, j['hadConformer'])
    return atoms, src, kind
# THE LOCAL BUILDS IN PARALLEL (iteration 006 C7).  The rows the cache has no standing geometry for — not solved, not the app's,
# not waiting on a conformer PubChem was not yet asked for — are built first by --jobs worker processes (fork; one thread each at the
# build's own niceness), the rule being compute_geometry itself; each answer goes to the cache, so the pass below finds it there.
def _to_build(e):
    if e['app'] or not GEOMETRY or e['cid'] in P.PENDING['conformers']: return False
    sid = solved_id(e)
    if sid and elements_agree(SOLVED[sid]['atomsAng'], e['Zs']): return False
    return cached_geometry(e) is None
JOBS_TODO = [geometry_job(e) for e in kept if _to_build(e)]
GEOM_BUILT = len(JOBS_TODO)
GEOM_LIMIT_S = int(float(_opt('geometry-minutes', '6')) * 60)          # C7: a molecule's build that runs past this is stopped (--geometry-minutes)
GEOM_STOPPED = []
def _geometry_worker(conn):
    """one worker process: build each job it is sent, send the answer back; None ends it"""
    while True:
        try: j = conn.recv()
        except EOFError: return
        if j is None: return
        try: r = compute_geometry(j)
        except Exception as ex: r = (j['key'], None, f'no 3-D geometry: the build raised {type(ex).__name__}', 'failed')
        conn.send(r)
def build_in_workers(jobs, n, limit_s, recycle=40):
    """THE LOCAL BUILDS, n at a time (iteration 006 C7): one forked worker per pipe, each sent one job at a time; a job that runs past
    limit_s is stopped — its worker killed and replaced — and answered "no 3-D geometry" (cached as a failure, as every failure is: an
    RDKit embedding has no time bound of its own, and a few molecules never finish one); a worker is replaced after `recycle` jobs.
    Yields (key, atoms, source, kind) as compute_geometry does."""
    import multiprocessing as mp
    from multiprocessing.connection import wait
    ctx = mp.get_context('fork')
    todo, workers = list(reversed(jobs)), {}                       # workers: conn → [process, job, started, jobs done]
    def spawn():
        a, b = ctx.Pipe()
        p = ctx.Process(target=_geometry_worker, args=(b,), daemon=True); p.start(); b.close()
        workers[a] = [p, None, 0.0, 0]
        return a
    def retire(c):
        try: c.send(None)
        except (OSError, ValueError): pass
        workers[c][0].join(10); workers[c][0].kill(); c.close(); del workers[c]
    def feed(c):
        if not todo: retire(c); return
        j = todo.pop(); workers[c][1], workers[c][2] = j, time.time(); c.send(j)
    for _ in range(min(n, len(todo))): feed(spawn())
    while workers:
        for c in wait(list(workers), timeout=10):
            p, j, t, k = workers[c]
            try: r = c.recv()
            except (EOFError, OSError):
                p.kill(); p.join(); c.close(); del workers[c]
                yield (j['key'], None, 'no 3-D geometry: the worker building it died', 'failed')
                if todo: feed(spawn())
                continue
            workers[c][1], workers[c][3] = None, k + 1
            if time.time() - t > 120:
                log(f'    slow: {j["key"]} · {sum(1 for z in j["Zs"] if z > 1)} heavy · {time.time() - t:.0f} s · {(r[2] or "")[:70]}')
            yield r
            if k + 1 >= recycle: retire(c); c = spawn() if todo else None
            if c is not None: feed(c)
        now = time.time()
        for c, (p, j, t, k) in list(workers.items()):
            if j is not None and now - t > limit_s:
                p.kill(); p.join(); c.close(); del workers[c]; GEOM_STOPPED.append(j['key'])
                yield (j['key'], None, f'no 3-D geometry: its build ran past {limit_s // 60} minutes and was stopped', 'failed')
                if todo: feed(spawn())
if JOBS_TODO:
    # the quick ones in this process — PubChem's conformer as it is (no xTB check, no hand-built framework) — the rest in workers
    _quick = [j for j in JOBS_TODO if j['pub'] is not None and not j['hand'] and (j['mol'] is None or not G.needs_xtb(j['molH']))]
    _hard = [j for j in JOBS_TODO if not (j['pub'] is not None and not j['hand'] and (j['mol'] is None or not G.needs_xtb(j['molH'])))]
    for j in _quick: remember_geometry(*compute_geometry(j), j['hadConformer'])
    log(f'local geometries: {len(_quick)} PubChem conformers taken as they are · {len(_hard)} to build, by {max(1, JOBS)} worker processes')
    _had = {j['key']: j['hadConformer'] for j in _hard}
    _tg, _nf = time.time(), 0
    for _n, (_k, _a, _s, _kd) in enumerate(build_in_workers(_hard, max(1, JOBS), GEOM_LIMIT_S), 1):
        remember_geometry(_k, _a, _s, _kd, _had[_k]); _nf += _a is None
        if _n % 25 == 0: write_json(GCACHE, gcache)                  # a hard build is minutes of work: keep it on disk soon
        if _n % 100 == 0 or _n == len(_hard):
            log(f'  built {_n}/{len(_hard)} ({time.time() - _tg:.0f} s; failed {_nf}, of them stopped past {GEOM_LIMIT_S // 60} min {len(GEOM_STOPPED)})')
    write_json(GCACHE, gcache)
JOBS_TODO = None
for i, e in enumerate(kept):
    sid = solved_id(e)
    if sid and (e['app'] or elements_agree(SOLVED[sid]['atomsAng'], e['Zs'])):
        # WAITING: a solved row on a LOCAL geometry (RDKit or xTB — never the app's pinned atoms, never a hand-built framework) whose
        # PubChem 3-D conformer exists and could be used.  --refresh-geometry (iteration 006 C3) lifts guard (a) for exactly these rows,
        # and keeps the new atoms only where the build's own rule gives a PubChem-based geometry (the conformer itself, or its GFN2-xTB
        # relaxation where MMFF94 has no parameters) that DIFFERS from the solved atoms; every other row keeps its solved atoms
        waiting = not e['app'] and not e['hand'] and gkind(SOLVED[sid]['geometrySource'] or '') != 'PubChem 3-D conformer' and usable_conformer(e) is not None
        if waiting: upgrade_waiting.append(sid)
        if REFRESH and waiting:
            atoms, src, kind = build_geometry(e)
            if atoms and pubchem_based(src) and GU.bohr(atoms) != SOLVED[sid]['atomsBohr']:
                e['atoms'], e['gsource'] = atoms, src; geom_counts[kind] += 1
                upgraded[sid] = {'from': SOLVED[sid]['geometrySource'], 'to': src, 'rungs': SOLVED[sid]['rungs']}
                continue
        keep_solved(e, sid); continue
    if e['app']:
        e['atoms'] = [[int(z), x, y, zz] for z, x, y, zz in e['app']['ang']]
        e['gsource'] = 'the app\'s own pinned geometry (lab/molecules.js / lab/library.json): ' + (e['app']['source'] or 'see the module')
        geom_counts['app pinned'] += 1
        continue
    if not GEOMETRY: e['atoms'], e['gsource'] = None, None; continue
    if e['cid'] in P.PENDING['conformers'] and (cached_geometry(e) or (None,))[0] is None:
        # iteration 006 C7: PubChem's conformer was never asked for (the run was cache-only) — the row waits; a local geometry built
        # now would be thrown away (and the row solved twice) once the conformer arrives
        exclude(e['nm'], 'pending: PubChem was not asked for its 3-D conformer (the run was cache-only) — a calm run fills it',
                src='/'.join(e['srcs']), cid=e['cid'])
        e['atoms'] = None; continue
    atoms, src, kind = build_geometry(e)
    if atoms is None:
        exclude(e['nm'], src, src='/'.join(e['srcs']), cid=e['cid'], **({'cached': True} if kind == 'failed, cached' else {}))
        e['atoms'] = None; continue
    e['atoms'], e['gsource'] = atoms, src; geom_counts[kind] += 1
    if gdirty and i % 500 == 499: log(f'  geometry {i + 1}/{len(kept)} ({gdirty} built here)')
if gdirty: write_json(GCACHE, gcache)
kept = [e for e in kept if e.get('atoms')]
log(f'with a geometry: {len(kept)} · ' + ' · '.join(f'{k} {v}' for k, v in geom_counts.most_common()))
refreshed_solved = sorted(sid for e in kept for sid in [solved_id(e)] if sid and GU.bohr(e['atoms']) != SOLVED[sid]['atomsBohr'])
log(f'GUARD (a): {sum(kept_solved.values())} solved rows kept the exact atoms they were solved at (' +
    ' · '.join(f'{k} {v}' for k, v in kept_solved.most_common()) + f'); {len(upgrade_waiting)} solved rows sit on a local geometry with a '
    'usable PubChem 3-D conformer waiting' + (f' — --refresh-geometry moved {len(upgraded)} of them onto it (each will be solved again '
    f'from STO-3G: the solver sees "the atoms moved"); for the other {len(upgrade_waiting) - len(upgraded)} the build\'s own rule gives '
    f'the atoms they were solved at, so they stay. Moved: ' + ', '.join(sorted(upgraded)) if REFRESH else ' — `build.py '
    '--refresh-geometry` would move them onto it, and those rows would then be solved again'))
if set(refreshed_solved) != set(upgraded):                          # the guard's own proof: nothing else moved
    raise SystemExit('guard (a): solved rows moved that --refresh-geometry did not choose: '
                     + ', '.join(sorted(set(refreshed_solved) ^ set(upgraded))) + ' — refusing to write')

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

# ── 9. TAGS: WHAT THE MOLECULE IS (iteration 006 C5) ─────────────────────────────────────────────────────────────────
# structure_tags.py on the row's own structure — PubChem's SMILES (the app rows: the matched record's), or, for a row with no SMILES
# RDKit reads (four app rows have none; RDKit refuses KrF₂'s), the bonds DetermineConnectivity reads off its own atoms — and the
# ChEBI structural classes (CHECKED is_a only) of the
# 3-star entity of its InChIKey, or, when ChEBI has no entity of that key, of every entity of its first block (another stereo,
# isotope or protonation form of the same skeleton).  The numbers go to the stats: what each word was earned by, what a class word
# subsumed, what the four-tag cap cut.
SCLASS = read_json(os.path.join(CACHE, 'chebi', 'structure-classes.json'))['byInchikey']
SCLASS_BLOCK = {}
for _k, _v in SCLASS.items(): SCLASS_BLOCK.setdefault(_k.split('-')[0], set()).update(_v)
def chebi_classes(key):
    if not key: return []
    if key in chebi_key: return SCLASS.get(key, [])
    return sorted(SCLASS_BLOCK.get(key.split('-')[0], ()))
TAG_EARNED, TAG_SUBSUMED, CAP_CUT, TAG_FROM = collections.Counter(), collections.Counter(), collections.Counter(), collections.Counter()
STRUCTURE_FROM = collections.Counter()
def structure_of(e, charge):
    """the row's own structure as RDKit reads it: PubChem's SMILES, else its atoms"""
    p = props.get(e['cid']) if e['cid'] else None
    mol = e.get('mol')
    if mol is None and p:
        sm = p.get('SMILES') or p.get('ConnectivitySMILES')
        mol = Chem.MolFromSmiles(sm) if sm else None
    if mol is not None: STRUCTURE_FROM['PubChem SMILES'] += 1; return mol
    STRUCTURE_FROM['its own atoms (DetermineConnectivity)'] += 1
    return ST.mol_from_atoms(e['atoms'], charge)
def tags_for(e, charge):
    mol = structure_of(e, charge)
    chebi = chebi_classes(row_key(e))
    kept, earned = ST.tags(mol, charge, chebi)
    TAG_EARNED.update(earned)
    after = set(earned)
    for w in earned:
        if w in ST.SUBSUMES: after -= ST.SUBSUMES[w]
    TAG_SUBSUMED.update(earned - after); CAP_CUT.update(after - set(kept))
    for w in kept:
        if w in ST.CHEBI_WORDS: TAG_FROM[(w, 'ChEBI' if w in chebi else 'structure')] += 1
    return kept

# ── 9a. THE USE WORDS (iterations 004–006 C4): computed, never written ───────────────────────────────────────────────────────
# use_words() is the tagger every earlier catalogue wrote.  Since C5 its words are no row's tags, but a row must still earn one to be
# in the catalogue (the 425 nominations "no plain tag of the vocabulary fits it" stay refused, and nothing new enters), and the last
# fallback of a λWAVES blurb names its first word.  Unchanged but for the names of its two constants.
DRUG_TAGS = {'painkiller', 'antibiotic', 'antiviral', 'heart', 'mind', 'cancer', 'allergy', 'anaesthetic',
             'eye', 'lung', 'skin', 'stomach', 'diabetes', 'parasite', 'immune'}
# THE DRUG-CLASS WORDS (iteration 006 C4) come from evidence about THIS molecule: its own ATC codes (a ChEMBL approved parent that IS
# this molecule — is_own(): one molecule, never a salt, a mixture or a counter-ion folded onto it), a ChEBI role its curators assert on
# the ChEBI entity that IS this molecule (chebi.py's ownRoleTags: has_role CHECKED or OK on the entity itself — not inherited down
# is_a, not SUBMITTED), or a hand list or a Wikidata statement naming the molecule itself.  Every other word keeps its old road — except
# onto an INORGANIC molecule (no C–H and no C–C bond: sulfuric, carbonic, nitric acid …) from the salt of a metal that is not an
# alkali metal: magnesium, calcium, zinc, thallium, copper, barium, lithium, silver … sulfate, carbonate or nitrate are that METAL's
# compounds, and what they do (thallium sulfate's `pesticide`, copper carbonate's `colour`, barium carbonate's `pesticide`) is not the
# anion's.  A sodium, potassium or ammonium salt still gives its anion its words (sodium nitrite, metabisulfite and the phosphates are
# food additives BY their anion; potassium permanganate and sodium arsenite act by theirs), and so does any salt of an organic acid.
CLASS_WORDS = DRUG_TAGS | {'hormone'}
SPECTATOR_IONS = {'[Na+]', '[K+]', '[NH4+]', '[H+]', 'O'}          # the counter-cations with no chemistry of their own (and water)
NONMETALS = {1, 2, 5, 6, 7, 8, 9, 10, 14, 15, 16, 17, 18, 33, 34, 35, 36, 52, 53, 54, 85, 86}
def inorganic(molH):
    return molH is not None and not any({b.GetBeginAtom().GetAtomicNum(), b.GetEndAtom().GetAtomicNum()} in ({6}, {1, 6}) for b in molH.GetBonds())
def active_cation(n):
    """the salt a nomination came from carries a cation that is its active part: any cation but H⁺, Na⁺, K⁺ and NH₄⁺ (Mg²⁺, Ca²⁺,
    Zn²⁺, Li⁺, Tl⁺, Ag⁺, Cu²⁺, Ba²⁺ …), or a lone metal atom"""
    smi = n.get('own_smiles') if n['src'] in ('chembl', 'chebi') else (props.get(n.get('from_cid')) or {}).get('SMILES')
    m = Chem.MolFromSmiles(smi) if smi else None
    if m is None: return False
    for f in Chem.GetMolFrags(m, asMols=True, sanitizeFrags=False):
        if Chem.MolToSmiles(f) in SPECTATOR_IONS: continue
        if sum(a.GetFormalCharge() for a in f.GetAtoms()) > 0: return True
        if f.GetNumAtoms() == 1 and f.GetAtomWithIdx(0).GetAtomicNum() not in NONMETALS: return True
    return False
def use_words(e):
    if e['app']: return list(APP.get(e['app']['id'], (['classic'], ''))[0])
    t = set()
    counter_ion = inorganic(e.get('molH'))
    for n in e['noms']:
        if n.get('c7_salt'): continue                                 # C7: a Wikidata salt's article says what the SALT is for
        mine = is_own(n)
        if counter_ion and not mine and active_cation(n): continue     # a metal salt's evidence landing on its anion
        for x in n.get('tags', []):
            if x not in USE_VOCAB: continue
            if x in CLASS_WORDS:
                if not mine: continue                                   # a salt's, a mixture's or a counter-ion's evidence
                if n['src'] == 'chebi' and x not in (n.get('own_role_tags') or []): continue   # inherited, or not checked by ChEBI
            t.add(x)
    if e['key'] in CUR.EXPLOSIVES: t.add('explosive')              # a hand list of InChIKeys already in the catalogue: it adds no molecule
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
    if len(t) > 4: t = set(sorted(t, key=lambda x: USE_RANK.get(x, 99))[:4])
    return sorted(t, key=lambda x: USE_RANK.get(x, 99))

# ── 10. BLURBS ───────────────────────────────────────────────────────────────────────────────────────────────────────
TAG_PHRASE = {'medicine': 'a medicine', 'aromatic': 'an aromatic compound', 'ring': 'a ring compound', 'cage': 'a cage molecule',
              'acid': 'an acid', 'metal': 'a molecule built around a metal atom', 'gas': 'a gas', 'solvent': 'a solvent',
              'fuel': 'a fuel', 'plastic': 'a molecule of the plastics industry', 'material': 'a material', 'food': 'a food molecule',
              'flavour': 'a flavour molecule', 'scent': 'a scent molecule', 'colour': 'a dye or pigment', 'toxin': 'a toxin',
              'pesticide': 'a pesticide', 'pollutant': 'a pollutant', 'atmosphere': 'a molecule of the atmosphere',
              'amino acid': 'an amino acid', 'nucleobase': 'a nucleobase', 'sugar': 'a sugar', 'fat': 'a fat or fatty acid',
              'steroid': 'a steroid', 'alkaloid': 'an alkaloid', 'life': 'a molecule of life', 'natural': 'a natural product',
              'vitamin': 'a vitamin', 'hormone': 'a hormone', 'neurotransmitter': 'a neurotransmitter', 'sweetener': 'a sweetener',
              'classic': 'a classic of the chemistry course', 'explosive': 'an explosive', 'refrigerant': 'a refrigerant',
              'battery': 'a solvent of battery electrolytes',
              # iteration 006 C7: a row that earns no use word (the gate is gone) falls back to its first STRUCTURE word
              'peptide': 'a peptide', 'nucleotide': 'a nucleotide', 'nucleoside': 'a nucleoside', 'terpene': 'a terpene or terpenoid',
              'ion': 'an ion', 'inorganic': 'an inorganic compound', 'nitro': 'a nitro compound', 'nitrile': 'a nitrile',
              'alkyne': 'an alkyne', 'aldehyde': 'an aldehyde', 'phenol': 'a phenol', 'ester': 'an ester', 'amide': 'an amide',
              'ketone': 'a ketone', 'amine': 'an amine', 'alcohol': 'an alcohol', 'ether': 'an ether', 'halogen': 'a halogen compound',
              'phosphorus': 'a phosphorus compound', 'sulfur': 'a sulfur compound', 'alkene': 'an alkene', 'alkane': 'an alkane',
              'heterocycle': 'a heterocyclic compound', 'chain': 'an open-chain compound'}
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
        if n['src'] == 'curated' and n.get('blurb') and not n.get('from_cid'): return n['blurb'], 'λWAVES'   # a salt's blurb is the salt's
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
    uses = [u for n in e['noms'] if not n.get('c7_salt') for u in n.get('uses', []) if u in WD_USE_TAGS]   # never a salt's use (C7)
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
    uses = use_words(e)                                              # the blurb's fallback only (step 9a), never written
    # iteration 006 C7: a row no longer has to earn a use word (that gate refused 425); it must earn a STRUCTURE word
    tags = tags_for(e, (a['charge'] if a else 0 if e['hand'] else (p or {}).get('Charge', 0)) or 0)
    if not tags:
        exclude(e['nm'], 'no structure tag: neither its structure nor its ChEBI class earns a word of the vocabulary', src='/'.join(e['srcs']), cid=e['cid']); continue
    e['uses'] = uses
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
    row['blurb'], row['blurbSource'] = blurb_for(e, name, uses or tags)   # the use words' first, as before C5: no blurb moves
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
reserved = set(prev_by_id) | set(SOLVED) | older_ids                # iteration 006 C7: an earlier file's id is never a new row's slug
seen_ids, id_from, RETURNED = {}, collections.Counter(), []
for e, row in rows:
    k = row['inchikey']
    pinned = row['id'] if e['app'] else prev_id_by_key.get(k) or raw_id_by_key.get(k)
    if pinned:
        if pinned in seen_ids: raise SystemExit(f'guard (b): the id {pinned} is claimed twice ({seen_ids[pinned]} and {k}) — refusing to write')
        row['id'] = pinned; seen_ids[pinned] = k; e['pinned'] = True
        id_from['the app' if e['app'] else 'the previous file' if k in prev_id_by_key else 'raw/ (solved under it)'] += 1
        if not e['app'] and k not in prev_id_by_key and older_id_by_key.get(k) == pinned: RETURNED.append({'id': pinned, 'name': row['name'], 'inchikey': k, 'from': 'raw/'})
# iteration 006 C7: a row an EARLIER file carried (a screen refused it in between) takes the id that file gave it, when it is free
for e, row in rows:
    if e.get('pinned'): continue
    k = row['inchikey']; old = older_id_by_key.get(k)
    if old and old not in seen_ids:
        row['id'] = old; seen_ids[old] = k; e['pinned'] = True; id_from['an earlier file (it returns)'] += 1
        RETURNED.append({'id': old, 'name': row['name'], 'inchikey': k, 'from': 'an earlier candidates file'})
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
# iteration 006 C7: in each tier the RECOGNISABLE rows come first (what used to be the whole catalogue), then the rows only an
# obscure Wikidata or ChEBI entry names; within each, the most recognisable and then the smallest first
rows.sort(key=lambda er: (tier(er[0]), 0 if er[0]['app'] or er[0].get('recognisable', True) else 1, -(score(er[0]) // 10), er[1]['heavy'], er[1]['name'].lower()))
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

id_by_key = {m['inchikey']: m['id'] for m in molecules if m['inchikey']}
bins = [('≤10', 0, 10), ('11–20', 11, 20), ('21–30', 21, 30), ('31–40', 31, 40), ('41–50', 41, 50), ('51–60', 51, 60), ('61–70', 61, 70),
        ('>70', 71, 10 ** 6)]
# ITERATION 006 C7: WHY EACH NEW ROW IS NEW — the reason the previous build refused it (its exclusion, found by the row's CID, or by
# InChIKey for a screened one), else what this build does differently (a salt's parent, an ion, the cap)
_pex_path = sibling(PREV, 'excluded')
_pex = read_json(_pex_path)['rows'] if os.path.exists(_pex_path) else []
_pex_by_cid, _pex_screen = {}, {}
for _x in _pex:
    if _x.get('cid') is not None: _pex_by_cid.setdefault(_x['cid'], _x['why'])
    if _x.get('screen') and _x.get('key'): _pex_screen.setdefault(_x['key'], _x['screen'])
def why_new(e, row):
    k = row['inchikey']
    if _pex_screen.get(k) == 'illicit': return 'returned: the controlled-substance screen is removed'
    w = _pex_by_cid.get(e['cid']) or ''
    if w.startswith('too obscure'):
        return 'recognisability is no longer a filter: ' + ('only Wikidata, in < 12 Wikipedias' if 'only by wikidata' in w
                                                          else 'only ChEBI, in no Wikipedia' if 'only by chebi' in w else 'another obscure entry')
    if w.startswith('no plain tag'): return 'the use-word gate is gone (it earns no use word)'
    if w.startswith('an ion'): return 'a closed-shell ion, kept with its charge'
    if 'past the 50' in w: return 'heavy 51–70 (the cap rose from 50 to 70)'
    if w.startswith('not one molecule') or any(n.get('c7_salt') for n in e['noms']): return 'a salt or a mixture, as its neutral parent'
    if any(n['src'] == 'curated' and n.get('name') in CUR.C7_LIFTED for n in e['noms']): return 'a hand skip lifted (curated.C7_LIFTED)'
    if row['charge']: return 'a closed-shell ion, kept with its charge'
    if row['heavy'] > 50: return 'heavy 51–70 (the cap rose from 50 to 70)'
    if w: return 'refused before for another reason: ' + re.sub(r'\d+', 'N', w.split('—')[0].strip())[:80]
    return 'new this run (PubChem answered a name, a key or a parent the previous build had not)'
C7_NEW = collections.Counter(); C7_SAMPLES = collections.defaultdict(list)
for e, row in rows:
    if e['app'] or row['inchikey'] in prev_id_by_key: continue
    r = why_new(e, row); C7_NEW[r] += 1
    if len(C7_SAMPLES[r]) < 15: C7_SAMPLES[r].append(f'{row["id"]} ({row["name"]})')
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
 'screens': {'cwc': sum(1 for e in excluded if e.get('screen') == 'CWC'),
             'namedScheduled': len(WEAPON_NAMED),
             # iteration 006 C7: the controlled-substance screen is removed (Josh's decision); the CWC screen is unchanged
             'controlledSubstanceScreen': 'removed in iteration 006 C7',
             # iteration 006 C4: the screen on the skeleton — how many first blocks carry a signal, how many rows a skeleton-mate's
             # signal refused, and the rows a screened skeleton holds that stay because each is ITSELF an approved drug by ChEMBL
             'cwcSkeletons': len(CWC_SKELETON),
             'bySkeleton': sum(1 for e in excluded if e.get('screen') and e.get('skeleton')),
             'keptAsApprovedDrugs': sorted((dict(r, id=id_by_key[r['key']]) for r in SCREEN_KEPT if r['key'] in id_by_key),
                                           key=lambda r: (r['screen'], r['name'].lower()))},
 'sources': SOURCES, 'tagVocabulary': VOCAB,
 'samples': [{'id': m['id'], 'name': m['name'], 'tags': m['tags'], 'heavy': m['heavy'], 'priority': m['priority']} for m in molecules[:40]],
 'guards': {'previous': PREV, 'previousRows': len(prev_by_id), 'previousIdsPresent': len(prev_by_id) - len(lost), 'previousIdsMissing': lost,
            'solvedInRaw': len(SOLVED), 'idsFrom': dict(id_from.most_common()), 'refreshGeometry': REFRESH,
            'keptSolvedGeometry': dict(kept_solved.most_common()), 'keptSolvedWithConformerWaiting': len(upgrade_waiting) - len(upgraded),
            'solvedRowsMoved': refreshed_solved, 'upgraded': upgraded},
 # iteration 006 C5: what the tags are made of — every word each row EARNED (structure_tags.raw_tags), the words a class word
 # SUBSUMED (an amino acid's acid and amine …), the words the four-tag cap then CUT, which source gave each kept class word, and where
 # each row's structure was read
 'tagRule': 'iteration 006 C5 (Josh: structure or class) — tools/volumes/catalogue/structure_tags.py',
 'tagEarned': dict(TAG_EARNED.most_common()), 'tagSubsumed': dict(TAG_SUBSUMED.most_common()), 'tagCapCut': dict(CAP_CUT.most_common()),
 'tagClassFrom': {w: {s: TAG_FROM[(w, s)] for s in ('ChEBI', 'structure') if TAG_FROM[(w, s)]} for w in VOCAB if w in ST.CHEBI_WORDS},
 'tagStructureFrom': dict(STRUCTURE_FROM.most_common()),
 'pubchem': {'conformers': len(conf), 'conformersAsked': len(need3d), 'synonymsFor': len(syn), 'descriptionsFor': len(desc), 'live': len(live),
             'cacheOnly': bool(C.OFFLINE), 'stopped': PUBCHEM_STOPPED or C.STOPPED,
             # iteration 006 C7: how many requests this run sent, the throttle's last word, and what a cache-only run left PENDING
             'requests': C._throttle['requests'], 'throttle': C._throttle['note'], 'pauses': C._throttle['pauses'],
             'pending': {k: len(v) for k, v in sorted(P.PENDING.items()) if v}},
 # iteration 006 C7: MORE MOLECULES — the new rows by why they are new, the rows that came back under an earlier id, the cap
 'c7': {'maxHeavy': MAX_HEAVY, 'newRows': sum(C7_NEW.values()), 'newByReason': dict(C7_NEW.most_common()),
        'newSamples': {k: v for k, v in C7_SAMPLES.items()}, 'returnedUnderEarlierIds': RETURNED,
        'earlierFiles': OLDER, 'localGeometriesBuilt': GEOM_BUILT, 'jobs': JOBS,
        'pendingRows': sum(1 for x in excluded if x['why'].startswith('pending'))},
}
write_json(sibling(OUT, 'stats'), stats, indent=1)
write_json(sibling(OUT, 'excluded'), {'built': out['built'], 'count': len(excluded), 'rows': excluded}, indent=1)
log(f'WROTE {OUT} — {len(molecules)} molecules, {len(excluded)} exclusions (and {sibling(OUT, "stats")}, {sibling(OUT, "excluded")})')
gbad, gnotes = GU.verify(out, prev_by_id, SOLVED, excluded, allow_moved=set(upgraded))
for s in gnotes: log('guards: ' + s)
for what, s in gbad[:40]: log(f'guards: ! {what}: {s}')
log(f'guards: {len(gbad)} complaints — check.py {OUT} --against {PREV} is the gate before the swap')
print('by tag:', stats['byTag'])
print('by heavy bin:', stats['byHeavyBin'])
print('by geometry:', stats['byGeometry'])
print('top exclusions:', list(stats['excludedByReason'].items())[:12])
