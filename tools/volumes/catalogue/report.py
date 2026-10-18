"""report.py — <catalogue>/vol-1.stats.json → research/iteration-004/CAT-BUILD.md (the committed report of row CAT).

  python -I tools/volumes/catalogue/report.py [--candidates=FILE] [--note=TEXT] [> research/iteration-004/CAT-BUILD.md]

It prints the counts (by source, by tag, by heavy-atom bin, by geometry, by blurb source), the exclusions by reason and the
licences, from the numbers build.py measured — nothing is typed by hand here, so the report cannot drift from the file.
--candidates reads another build (vol-1.candidates.next.json and its .stats/.excluded siblings) before it is swapped in.
"""
import collections, datetime, json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from common import DATA, read_json, sibling

CFILE = os.path.expanduser(next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--candidates=')), os.path.join(DATA, 'vol-1.candidates.json')))
S = read_json(sibling(CFILE, 'stats'))
C = read_json(CFILE)
EX = read_json(sibling(CFILE, 'excluded'))
w = sys.stdout.write
def table(head, rows):
    w('| ' + ' | '.join(head) + ' |\n|' + '|'.join(['---'] * len(head)) + '|\n')
    for r in rows: w('| ' + ' | '.join(str(x) for x in r) + ' |\n')
    w('\n')

NOTE = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--note=')), None)
if NOTE: w(f'> **{NOTE}**\n\n')
w(f"""# CAT · THE CANDIDATE LIST (iteration 004, row CAT THE CATALOGUE)

`~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.candidates.json` — **{S['count']} molecules**, built {S['built']}, schema 1.
Scripts: `tools/volumes/catalogue/` (committed). Data, caches and the exclusion list: `~/Documents/LAMBDAWAVES-VOLUMES/catalogue/`
(never in git; every network answer is cached in `catalogue/cache/http.sqlite`, so a re-run is offline and asks PubChem nothing).

THE PIPELINE, step 1 of PLAN.md. Six collectors nominate, PubChem resolves, one entry survives per InChIKey:

```
node   tools/volumes/catalogue/app-own.mjs        the app's own 98, at their PINNED geometries (read from the module)
python -I tools/volumes/catalogue/fetch_chembl.py   ChEMBL approved small molecules (max_phase 4) + ATC
python -I tools/volumes/catalogue/fetch_atc.py      the WHO ATC classification's own words (for the blurbs)
python -I tools/volumes/catalogue/chebi.py          ChEBI 3-star roles and structural classes + definitions
python -I tools/volumes/catalogue/fetch_wikidata.py every compound with an English Wikipedia article (+ its sitelink count)
python -I tools/volumes/catalogue/fetch_who_eml.py  the WHO Model List of Essential Medicines (names only)
python -I tools/volumes/catalogue/build.py          resolve · screen · filter · geometry · tag · blurb · priority · write
python -I tools/volumes/catalogue/report.py         this report
```

## THE COUNTS

Rows per source (a molecule is counted once per source that nominates it; most carry several):

""")
table(['source', 'molecules'], sorted(S['bySource'].items(), key=lambda kv: -kv[1]))
w('The combinations, most common first (PubChem is on every row and is left out of the key):\n\n')
table(['sources', 'molecules'], list(S['bySourceSet'].items())[:18])
w('By tag (PLAN.md\'s vocabulary and its ten iteration-006 words only; a molecule carries 1–4):\n\n')
table(['tag', 'molecules'], list(S['byTag'].items()))
w('Tags per molecule: ' + ' · '.join(f'{k} tag{"s" if int(k) > 1 else ""}: {v}' for k, v in sorted(S['byTagCount'].items())) + '\n\n')
w('By heavy atoms:\n\n')
table(['heavy atoms', 'molecules'], list(S['byHeavyBin'].items()))
w('By geometry:\n\n')
table(['geometry', 'molecules'], list(S['byGeometry'].items()))
GD = S.get('guards')
if GD:                                                               # iteration 006 C2: the two guards, as this build measured them
    ks = GD['keptSolvedGeometry']
    w(f"""THE GUARDS (guards.py). (a) {sum(ks.values())} rows already solved in `raw/` kept the exact atoms they were solved at
({' · '.join(f'{k} {v}' for k, v in ks.items()) or 'none'}){f"; `--refresh-geometry` (iteration 006 C3) moved {len(GD.get('solvedRowsMoved', []))} solved rows from a local geometry onto PubChem's conformer — each is solved again — and {GD['keptSolvedWithConformerWaiting']} rows whose conformer gives their solved atoms stay (the list, old and new source: the stats' guards.upgraded)" if GD['refreshGeometry'] else f"; {GD['keptSolvedWithConformerWaiting']} of them have a PubChem 3-D conformer waiting, which `--refresh-geometry` would take (and those rows would then be solved again)"}.
{f"At the swap (solvers stopped) `guards.py --pin` put back {len(GD['pinnedAtSwap'])} more rows solved after the build had read `raw/`: {', '.join(GD['pinnedAtSwap'])}." + chr(10) if GD.get('pinnedAtSwap') else ''}(b) {GD['previousIdsPresent']}/{GD['previousRows']} ids of the previous file kept; the ids came from {' · '.join(f'{k} {v}' for k, v in GD['idsFrom'].items())}{'; MISSING: ' + ', '.join(GD['previousIdsMissing']) if GD['previousIdsMissing'] else ''}.

""")
w('By blurb:\n\n')
table(['blurb written by', 'molecules'], list(S['byBlurbSource'].items()))

w(f"""## THE EXCLUSIONS

{S['excludedCount']} nominations were refused, and every one is written down with its reason in
`~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.excluded.json`. By reason:

""")
table(['reason', 'count'], list(S['excludedByReason'].items())[:26])
w('By the source that nominated it:\n\n')
table(['source', 'refused'], list(S['excludedBySource'].items())[:12])
w(f"""THE TWO SCREENS. **{S['screens']['cwc']}** nominations were refused as Chemical Weapons Convention scheduled chemicals, listed
precursors or members of a scheduled family — by NAME ({S['screens']['namedScheduled']} of the Annex's own names resolved through
PubChem to an InChIKey skeleton) and by CLASS (five coarse substructure families, so a congener under another name is refused too),
and by Wikidata's own "chemical warfare agent" uses. **{S['screens']['illicit']}** were refused as controlled psychoactive
substances that are not approved medicines ({S['screens']['namedControlled']} names resolved, plus ChEBI's hallucinogen and opioid
roles and Wikidata's recreational-drug uses); an approved medicine passes the second screen, so morphine and fentanyl are in the
library as medicines and nothing else of that kind is.
""")
SC = S['screens']
if 'illicitSkeletons' in SC:                                         # iteration 006 C4: the screens on the skeleton
    key_of = {m['id']: m['inchikey'] for m in C['molecules']}
    mates = [r for r in SC['keptAsApprovedDrugs'] if r['via'] != key_of.get(r['id'])]
    w(f"""
Since iteration 006 C4 both screens match on the InChIKey's FIRST BLOCK (the connectivity skeleton): every signal — a name, a
Wikidata use, a ChEBI role, and for the second screen an approved medicine whose own ATC code sits in a controlled-drug group
(`curated.CONTROLLED_ATC`: opioids, central stimulants and anorectics, barbiturates, benzodiazepines and Z-drugs, ketamine) — screens
its whole skeleton (racemate, enantiomers, isotopologues, protonated forms) and, for a salt, its neutral parent's. {SC['cwcSkeletons']}
first blocks carry a CWC signal, {SC['illicitSkeletons']} a controlled-substance signal; **{SC['bySkeleton']}** rows were refused only
through a skeleton-mate's signal. A row a screened skeleton holds stays only when it is ITSELF an approved drug by ChEMBL (max_phase 4:
a ChEMBL approved parent whose structure is this row, never a salt folded onto it): {len(SC['keptAsApprovedDrugs'])} rows, {len(mates)}
of them beside another form's signal — {', '.join(f"{r['name']} (beside {r['viaName']})" for r in mates) or 'none'}. The CWC's Annex
names and classes refuse outright, approved or not.
""")
w("""
## THE TEN FIRST ROWS (priority order: the app's own, then the WHO essential medicines and the most recognisable names, then small before large)

""")
table(['priority', 'id', 'name', 'tags', 'heavy'],
      [[m['priority'], '`' + m['id'] + '`', m['name'], ' · '.join(m['tags']), m['heavy']] for m in C['molecules'][:10]])

# ── the ten words of iteration 006 (proposed here by CAT, applied by C3 on Josh's yes) ──────────────────────────────────
meds = [m for m in C['molecules'] if 'medicine' in m['tags']]
only_med = [m for m in meds if m['tags'] == ['medicine']]
atc_groups = collections.Counter()
for m in meds:
    for s in m['sources']:
        for c in (s.get('atc') or []): atc_groups[c[:3]] += 1
bt, cut = S['byTag'], S.get('tagCapCut', {})
w(f"""## THE TEN WORDS OF ITERATION 006 (CAT's proposal; in the file since C3, Josh's yes of 2026-10-18)

Seven medicine words from the drug's OWN, non-combination ATC codes, and three hand-list words outside medicine. They rank with the
uses, so the four-tag cap cuts a structure word (aromatic, ring, acid …) before any of them; they rank after the food words and the
drug classes they refine, so they never send a food to Medicine. {len(meds)} rows carry `medicine`; {len(only_med)} carry nothing else.

""")
words = [['`eye`', 'eye drops and eye medicines', f"S01 ({atc_groups['S01']})"],
         ['`lung`', 'asthma and cough medicines', f"R03 ({atc_groups['R03']}), R05 ({atc_groups['R05']})"],
         ['`skin`', 'creams, antifungals and acne medicines', f"D01/D06/D07/D10/D11 ({sum(atc_groups[g] for g in ('D01', 'D06', 'D07', 'D10', 'D11'))})"],
         ['`stomach`', 'antacids, ulcer and gut medicines', f"A02/A03/A06/A07 ({sum(atc_groups[g] for g in ('A02', 'A03', 'A06', 'A07'))})"],
         ['`diabetes`', 'insulin-sparing and blood-sugar medicines', f"A10 ({atc_groups['A10']})"],
         ['`parasite`', 'malaria and worm medicines', f"P01/P02/P03 ({sum(atc_groups[g] for g in ('P01', 'P02', 'P03'))})"],
         ['`immune`', 'immune suppressants and modifiers', f"L03/L04 ({sum(atc_groups[g] for g in ('L03', 'L04'))})"],
         ['`refrigerant`', 'the curated CFC, HCFC, HFC and HFO rows', 'curated.py: the cfcs, hcfcs and hfcs lists'],
         ['`battery`', 'the carbonate and nitrile electrolyte solvents', 'curated.py: batteries and solvents (those items only)'],
         ['`explosive`', 'the classic textbook explosives already in the catalogue', 'curated.py EXPLOSIVES (InChIKeys; adds no molecule)']]
table(['word', 'what it holds', 'from (ATC codes on the medicine rows)', 'rows', 'cut by the cap'],
      [r + [bt.get(r[0].strip('`'), 0), cut.get(r[0].strip('`'), 0)] for r in words])
w("""## THE LICENCES

""")
table(['source', 'what it gave', 'licence'], [[s['name'], s['what'], s['licence']] for s in S['sources']])
w(f"""Attribution the app must carry: ChEBI data from https://www.ebi.ac.uk/chebi (the release named above), CC BY 4.0 — every blurb
marked `ChEBI definition (CC BY 4.0)` is ChEBI's own words, trimmed to one or two sentences. ChEMBL and the ATC words are CC BY-SA
3.0 and are used as facts (a code, a group's name), not as text. PubChem is a U.S. Government work in the public domain. Wikidata
is CC0. The WHO Model List enters as NAMES only. Every other blurb is λWAVES' own (`blurbSource: 'λWAVES'`).

## WHAT A ROW CARRIES

`id · name · iupac · synonyms (≤6) · formula (Hill) · charge · multiplicity (1) · cid · inchi · inchikey · smiles · mw · exactMass ·
heavy · nAtoms · xlogp · tpsa · hbd · hba · rotatable · complexity · tags · blurb · blurbSource · atomsAng · geometrySource ·
sources · priority` — PLAN.md's `meta` for the .lwm header, plus the geometry the solver needs.
""")
