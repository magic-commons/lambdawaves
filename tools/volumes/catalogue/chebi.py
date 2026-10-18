"""chebi.py — SOURCE 3, ChEBI ROLES AND CLASSES, from the ChEBI flat files (CC BY 4.0; release named in README).

Downloads (once, into catalogue/cache/chebi/) the TSV tables and computes, for every 3-STAR (manually curated) entity
that has a structure:
  · its EFFECTIVE ROLES — the has_role targets of the entity and of every is_a ancestor (ChEBI's roles inherit down is_a),
    closed upward through the role ontology's own is_a — matched against the plain-tag map ROLE_TAGS;
  · its ASSERTED ROLES (ownRoleTags, iteration 006 C4) — only the has_role relations ChEBI's curators CHECKED (or marked OK) on the
    entity itself, not inherited and not SUBMITTED, closed upward through the role ontology — the only ChEBI evidence build.py
    takes a drug-class word from;
  · its STRUCTURAL CLASSES — is_a ancestors matched against CLASS_TAGS;
  · its screen flags (SCREEN: nerve agents, vesicants, hallucinogens …) for build.py's exclusions.
Writes cache/chebi/nominations.json (entities with ≥ 1 tag or flag) and cache/chebi/by-inchikey.json (every 3-star
structure: id, name, definition, Wikipedia article) — the blurb and the recognisability lookup for every other source.

ITERATION 006 C5 (Josh, 2026-10-18: the tags say what a molecule IS — its structure or its class).  The roles and classes above
still decide which entities NOMINATE (so the catalogue's membership does not move), but no row's tag comes from them any more.  The
tags' ChEBI half is cache/chebi/structure-classes.json: for every 3-star structure, the STRUCTURAL CLASSES of STRUCT_CLASSES its
is_a ancestry reaches through CHECKED is_a relations only (status 1 — not OK, not SUBMITTED), keyed by InChIKey (the union over every
3-star entity of that key).  build.py reads it through structure_tags.py."""
import csv, gzip, html, json, os, re, sys, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
from common import CACHE, write_json

D = os.path.join(CACHE, 'chebi'); os.makedirs(D, exist_ok=True)
BASE = 'https://ftp.ebi.ac.uk/pub/databases/chebi/flat_files/'
FILES = ['README', 'LICENSE', 'compounds.tsv.gz', 'relation.tsv.gz', 'names.tsv.gz', 'chemical_data.tsv.gz',
         'database_accession.tsv.gz', 'structures.tsv.gz']
for f in FILES:
    p = os.path.join(D, f)
    if not os.path.exists(p):
        print('downloading', f); urllib.request.urlretrieve(BASE + f, p)
release = re.search(r'ChEBI Release:\s*(\d+)', open(os.path.join(D, 'README')).read())
release = release.group(1) if release else '?'

# role (ChEBI id) → plain tag.  A role's is_a descendants count as the role.
ROLE_TAGS = {
    33229: 'vitamin', 24621: 'hormone', 25512: 'neurotransmitter', 37958: 'colour', 26130: 'colour', 77182: 'colour',
    46787: 'solvent', 35617: 'flavour', 48318: 'scent', 50505: 'sweetener', 25944: 'pesticide', 24527: 'pesticide',
    24852: 'pesticide', 24127: 'pesticide', 33288: 'pesticide', 22153: 'pesticide', 25491: 'pesticide', 33904: 'pesticide',
    33292: 'fuel', 27026: 'toxin', 64909: 'toxin', 77962: 'food', 64047: 'food', 33284: 'food',
    76413: 'atmosphere', 78298: 'pollutant', 77853: 'pollutant', 74236: 'plastic', 79056: 'plastic',
    78675: 'life', 76924: 'natural', 76946: 'natural', 76507: 'natural', 76969: 'natural', 26013: 'natural',
    # drug roles — used only to add a function tag to an APPROVED medicine (build.py keeps them off everything else)
    35480: 'painkiller', 38867: 'anaesthetic', 36047: 'antibiotic', 36044: 'antiviral', 35610: 'cancer',
    50857: 'allergy', 35471: 'mind', 35623: 'mind', 35554: 'heart', 50249: 'heart', 35674: 'heart',
}
DRUG_ROLE_TAGS = {'painkiller', 'anaesthetic', 'antibiotic', 'antiviral', 'cancer', 'allergy', 'mind', 'heart'}
# structural class (ChEBI id) → plain tag (is_a descendants count)
CLASS_TAGS = {33709: 'amino acid', 18282: 'nucleobase', 16646: 'sugar', 35366: 'fat', 47778: 'fat', 73702: 'fat',
              35341: 'steroid', 22315: 'alkaloid', 33838: 'life', 36976: 'life', 23357: 'life'}
# screens: roles that mark a substance build.py must refuse (CWC agents) or keep away unless approved (psychoactive)
SCREEN = {140423: 'nerve agent', 140424: 'nerve agent', 140425: 'nerve agent', 140422: 'nerve agent', 136185: 'nerve agent',
          78592: 'vesicant', 74136: 'lachrymator', 35499: 'hallucinogen', 35482: 'opioid'}
# iteration 006 C5: THE STRUCTURAL CLASSES a row's tags may name (structure_tags.py's vocabulary), each through CHECKED is_a only.
# Chosen against the catalogue's rows (C5-BUILD.md): `carbohydrate` and not the wider `carbohydrates and carbohydrate derivatives`
# (which takes in every glycoside drug); the α-, β-, γ-, δ- and ε-amino acids and not `amino acid` itself (ChEBI's "a carboxylic acid
# containing one or more amino groups" takes in diclofenac, bumetanide, mesalazine, EDTA and the quinolones); `terpenoid` and
# `terpene` (isoprenoids of biological origin; carotenoids are tetraterpenoids); `fatty acid`, `glyceride` and `wax` for `fat`; a
# nucleoside's phosphate (ATP, AMP, the nucleotides) is its own word
STRUCT_CLASSES = {35341: 'steroid', 26873: 'terpene', 35186: 'terpene', 22315: 'alkaloid', 16646: 'sugar',
                  33704: 'amino acid', 33706: 'amino acid', 33707: 'amino acid', 35931: 'amino acid', 35958: 'amino acid',
                  16670: 'peptide', 18282: 'nucleobase', 33838: 'nucleoside', 25608: 'nucleotide', 35366: 'fat', 47778: 'fat',
                  73702: 'fat'}

def tsv(name):
    f = gzip.open(os.path.join(D, name), 'rt', newline='', encoding='utf-8')
    r = csv.reader(f, delimiter='\t'); h = next(r)
    for row in r: yield dict(zip(h, row))
csv.field_size_limit(10 ** 9)
clean = lambda s: re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', s or ''))).strip().strip('"').strip()

comp = {}
for r in tsv('compounds.tsv.gz'):
    comp[int(r['id'])] = {'name': clean(r['name']), 'stars': int(r['stars'] or 0), 'definition': clean(r['definition']),
                          'ascii': r['ascii_name']}
isa, role = {}, {}
isa_checked = {}                                                     # iteration 006 C5: the is_a relations ChEBI's curators CHECKED
conj = {}
# iteration 006 C4: a has_role relation carries its own status (status.tsv: 1 CHECKED, 3 OK, 9 SUBMITTED).  A SUBMITTED one is a
# submission ChEBI's curators have not checked — D-glucopyranose has 21 of them in one block (cardiovascular drug, antineoplastic
# agent, anticonvulsant, antipsychotic agent, analgesic, anti-HIV agent …), which is how glucose became a painkiller, a heart drug and a
# mind drug.  ROLE_ASSERTED keeps only the roles CHECKED or OK on the entity ITSELF (never inherited down is_a): build.py takes a
# drug-class word from ChEBI only from those (ownRoleTags), every other word as before (roleTags)
ROLE_ASSERTED = {}
CURATED_STATUS = {'1', '3'}
for r in tsv('relation.tsv.gz'):
    t, a, b = int(r['relation_type_id']), int(r['init_id']), int(r['final_id'])
    if t == 5:
        isa.setdefault(a, set()).add(b)
        if r.get('status_id') == '1': isa_checked.setdefault(a, set()).add(b)
    elif t == 4:
        role.setdefault(a, set()).add(b)
        if r.get('status_id') in CURATED_STATUS: ROLE_ASSERTED.setdefault(a, set()).add(b)
    elif t in (6, 7, 11): conj.setdefault(a, set()).add(b)
memo = {}
def ancestors(c):
    if c in memo: return memo[c]
    memo[c] = set()                          # cycle guard
    out = set()
    for p in isa.get(c, ()):
        out.add(p); out |= ancestors(p)
    memo[c] = out
    return out
sys.setrecursionlimit(100000)
def target_hits(ids, table):
    hits = {}
    for i in ids:
        for j in {i} | ancestors(i):
            if j in table: hits.setdefault(table[j], set()).add(j)
    return hits

struct = {}
for r in tsv('structures.tsv.gz'):
    if r['default_structure'] != 'true': continue
    c = int(r['compound_id'])
    if r['smiles'] and r['standard_inchi_key']:
        struct[c] = {'smiles': r['smiles'], 'inchikey': r['standard_inchi_key']}
chem = {}
for r in tsv('chemical_data.tsv.gz'):
    chem[int(r['compound_id'])] = {'formula': r['formula'], 'charge': int(r['charge']) if re.fullmatch(r'-?\d+', r['charge'] or '') else None}
wiki = {}
for r in tsv('database_accession.tsv.gz'):
    if r['source_id'] == '87': wiki.setdefault(int(r['compound_id']), urllib.parse.unquote(r['accession_number']).replace('_', ' '))
syn, iupac = {}, {}
for r in tsv('names.tsv.gz'):
    c = int(r['compound_id'])
    if r['type'] in ('SYNONYM', 'INN', 'BRAND NAME') and r['language_code'] in ('en', ''):
        syn.setdefault(c, []).append(clean(r['name']))
    elif r['type'] == 'IUPAC NAME': iupac.setdefault(c, clean(r['name']))

noms, by_key = [], {}
for c, info in comp.items():
    if info['stars'] != 3 or c not in struct: continue
    s = struct[c]
    by_key.setdefault(s['inchikey'], [c, info['name'], info['definition'], wiki.get(c)])
    effective_roles = set()
    for a in {c} | ancestors(c): effective_roles |= role.get(a, set())
    roles = target_hits(effective_roles, ROLE_TAGS)
    asserted = target_hits(ROLE_ASSERTED.get(c, set()), ROLE_TAGS)   # the entity's OWN checked roles, closed up the role ontology only
    classes = {t: v for t, v in target_hits({c}, CLASS_TAGS).items()}
    screens = {SCREEN[j] for i in effective_roles for j in {i} | ancestors(i) if j in SCREEN}
    if not roles and not classes and not screens: continue
    noms.append({'chebi': c, 'name': info['name'], 'definition': info['definition'], 'smiles': s['smiles'], 'inchikey': s['inchikey'],
                 'formula': chem.get(c, {}).get('formula'), 'charge': chem.get(c, {}).get('charge'),
                 'roleTags': sorted(roles), 'ownRoleTags': sorted(asserted), 'classTags': sorted(classes), 'screens': sorted(screens),
                 'roleIds': sorted({j for v in roles.values() for j in v}), 'wikipedia': wiki.get(c),
                 'synonyms': syn.get(c, [])[:20], 'iupac': iupac.get(c)})
write_json(os.path.join(D, 'nominations.json'), {'release': release, 'licence': 'CC BY 4.0', 'entities': noms})
write_json(os.path.join(D, 'by-inchikey.json'), {'release': release, 'map': by_key})

# iteration 006 C5: every 3-star structure's STRUCTURAL CLASSES, through CHECKED is_a only (a separate ancestry: `ancestors` above
# walks every is_a, as the nominations always have)
memo_checked = {}
def ancestors_checked(c):
    if c in memo_checked: return memo_checked[c]
    memo_checked[c] = set()                  # cycle guard
    out = set()
    for p in isa_checked.get(c, ()):
        out.add(p); out |= ancestors_checked(p)
    memo_checked[c] = out
    return out
struct_by_key = {}
for c, info in comp.items():
    if info['stars'] != 3 or c not in struct: continue
    hit = sorted({STRUCT_CLASSES[j] for j in {c} | ancestors_checked(c) if j in STRUCT_CLASSES})
    if hit: struct_by_key.setdefault(struct[c]['inchikey'], set()).update(hit)
write_json(os.path.join(D, 'structure-classes.json'),
           {'release': release, 'licence': 'CC BY 4.0',
            'rule': 'for every 3-star ChEBI structure, the classes below its is_a ancestry reaches through CHECKED is_a relations only '
                    '(relation.tsv status 1), keyed by InChIKey (the union over the 3-star entities of that key); a key absent here has '
                    'none of them (by-inchikey.json lists every 3-star key)',
            'classes': {str(k): [comp[k]['name'], v] for k, v in STRUCT_CLASSES.items()},
            'byInchikey': {k: sorted(v) for k, v in sorted(struct_by_key.items())}})
from collections import Counter
ct = Counter(t for n in noms for t in n['roleTags'] + n['classTags'])
print(f'ChEBI release {release}: {len(noms)} 3-star entities nominated ({sum(1 for n in noms if n["wikipedia"])} with a Wikipedia article); '
      f'{len(by_key)} 3-star structures indexed by InChIKey')
print(' '.join(f'{k}:{v}' for k, v in ct.most_common()))
print('screens:', Counter(s for n in noms for s in n['screens']))
print(f'structural classes (CHECKED is_a) for {len(struct_by_key)} InChIKeys:', Counter(t for v in struct_by_key.values() for t in v))
