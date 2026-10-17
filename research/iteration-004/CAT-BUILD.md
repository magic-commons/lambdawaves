> **WIP, 2026-10-17 13:05 — a PARTIAL run. 7,534 molecules passed the filters; this file carries the first 950 of them (`build.py --limit=950`, cache-only). PubChem's rate limiter blocked this machine at 12:12 (two iteration-004 rows fetching at once), so these geometries are RDKit/xTB-built rather than PubChem's conformers, and the synonym and description rounds did not run. The exclusion counts are the WHOLE run's; every other count is the 950's. The ATC fix of 13:20 (only the parent's own, non-combination codes — it stops paracetamol being a heart drug) landed AFTER this run, so the next run's medicine tags will be cleaner. Re-run: `python -I tools/volumes/catalogue/build.py` once PubChem answers; everything else is cached.**

# CAT · THE CANDIDATE LIST (iteration 004, row CAT THE CATALOGUE)

`~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.candidates.json` — **950 molecules**, built 2026-10-17T13:05:52-05:00, schema 1.
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

| source | molecules |
|---|---|
| PubChem | 946 |
| Wikidata | 905 |
| ChEMBL | 875 |
| ChEBI | 601 |
| WHO EML | 181 |
| λWAVES | 88 |
| curated | 81 |

The combinations, most common first (PubChem is on every row and is left out of the key):

| sources | molecules |
|---|---|
| ChEBI + ChEMBL + Wikidata | 361 |
| ChEMBL + Wikidata | 244 |
| ChEBI + ChEMBL + WHO EML + Wikidata | 126 |
| ChEBI + ChEMBL + Wikidata + curated | 42 |
| Wikidata + λWAVES | 34 |
| ChEMBL + WHO EML + Wikidata | 31 |
| ChEMBL | 22 |
| ChEBI + Wikidata + λWAVES | 19 |
| ChEBI + ChEMBL + WHO EML + Wikidata + curated | 18 |
| ChEBI + Wikidata + curated + λWAVES | 9 |
| ChEBI + ChEMBL | 9 |
| ChEBI + ChEMBL + Wikidata + λWAVES | 6 |
| λWAVES | 6 |
| ChEMBL + Wikidata + curated | 6 |
| ChEBI + λWAVES | 4 |
| ChEBI + ChEMBL + WHO EML + Wikidata + λWAVES | 2 |
| ChEBI + ChEMBL + Wikidata + curated + λWAVES | 2 |
| ChEMBL + Wikidata + λWAVES | 2 |

By tag (PLAN.md's vocabulary only; a molecule carries 1–4):

| tag | molecules |
|---|---|
| medicine | 863 |
| aromatic | 601 |
| mind | 225 |
| heart | 214 |
| cancer | 211 |
| painkiller | 154 |
| acid | 141 |
| antibiotic | 94 |
| classic | 61 |
| ring | 57 |
| pollutant | 43 |
| life | 38 |
| amino acid | 36 |
| allergy | 33 |
| gas | 30 |
| anaesthetic | 30 |
| natural | 26 |
| antiviral | 26 |
| toxin | 25 |
| material | 21 |
| hormone | 18 |
| food | 14 |
| pesticide | 14 |
| metal | 13 |
| solvent | 12 |
| alkaloid | 11 |
| vitamin | 9 |
| atmosphere | 8 |
| flavour | 8 |
| cage | 7 |
| fat | 7 |
| fuel | 6 |
| nucleobase | 5 |
| colour | 4 |
| steroid | 4 |
| scent | 3 |
| plastic | 2 |
| neurotransmitter | 2 |
| sweetener | 2 |
| sugar | 1 |

Tags per molecule: 1 tag: 3 · 2 tags: 158 · 3 tags: 396 · 4 tags: 393

By heavy atoms:

| heavy atoms | molecules |
|---|---|
| ≤10 | 131 |
| 11–20 | 360 |
| 21–30 | 361 |
| 31–40 | 81 |
| 41–50 | 16 |
| >50 | 1 |

By geometry:

| geometry | molecules |
|---|---|
| RDKit ETKDGv3 + MMFF94 | 860 |
| app pinned | 88 |
| GFN2-xTB | 2 |

By blurb:

| blurb written by | molecules |
|---|---|
| λWAVES | 334 |
| ChEBI definition (CC BY 4.0) | 616 |

## THE EXCLUSIONS

26909 nominations were refused, and every one is written down with its reason in
`~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.excluded.json`. By reason:

| reason | count |
|---|---|
| too obscure to be a library row: nominated only by wikidata and in N Wikipedias | 12912 |
| too obscure to be a library row: nominated only by chebi and in no Wikipedia | 11146 |
| not one molecule: PubChem counts N separate units, and it has no neutral parent | 1347 |
| N heavy atoms, past the N the volume allows | 368 |
| an ion (charge N) with no neutral parent in PubChem | 150 |
| PubChem has no compound under this name | 123 |
| an element beyond krypton (I) | 118 |
| refused: on the Chemical Weapons Convention schedules or in a scheduled family | 93 |
| an isotopically labelled compound | 84 |
| an odd electron count (N): an open shell, not an RHF molecule | 57 |
| refused: a controlled psychoactive substance that is not an approved medicine | 54 |
| a radical (RDKit finds unpaired electrons): an open shell | 25 |
| an ion (charge -N) with no neutral parent in PubChem | 20 |
| an element beyond krypton (Te) | 17 |
| an element beyond krypton (Hg) | 17 |
| an element beyond krypton (Sn) | 17 |
| an element beyond krypton (Pb) | 17 |
| an element beyond krypton (Mo) | 14 |
| left out by hand: heavy atoms N | 12 |
| an element beyond krypton (W) | 11 |
| an element beyond krypton (Sb) | 11 |
| its PubChem structure does not parse | 10 |
| an element beyond krypton (Tl) | 10 |
| PubChem's record for it carries no InChIKey or no formula | 9 |
| an element beyond krypton (Re) | 9 |
| an element beyond krypton (U) | 9 |

By the source that nominated it:

| source | refused |
|---|---|
| wikidata | 14861 |
| chebi | 11198 |
| chebi/wikidata | 296 |
| who | 125 |
| curated | 102 |
| chembl/wikidata | 87 |
| chembl | 58 |
| chebi/chembl/wikidata | 39 |
| curated/wikidata | 37 |
| who/wikidata | 27 |
| chebi/chembl/who/wikidata | 23 |
| chembl/who/wikidata | 16 |

THE TWO SCREENS. **99** nominations were refused as Chemical Weapons Convention scheduled chemicals, listed
precursors or members of a scheduled family — by NAME (1 of the Annex's own names resolved through
PubChem to an InChIKey skeleton) and by CLASS (five coarse substructure families, so a congener under another name is refused too),
and by Wikidata's own "chemical warfare agent" uses. **54** were refused as controlled psychoactive
substances that are not approved medicines (0 names resolved, plus ChEBI's hallucinogen and opioid
roles and Wikidata's recreational-drug uses); an approved medicine passes the second screen, so morphine and fentanyl are in the
library as medicines and nothing else of that kind is.

## THE TEN FIRST ROWS (priority order: the app's own, then the WHO essential medicines and the most recognisable names, then small before large)

| priority | id | name | tags | heavy |
|---|---|---|---|---|
| 0 | `H2O` | Water | classic · life · solvent | 1 |
| 1 | `urea` | Urea | classic · life · material | 4 |
| 2 | `NH3` | Ammonia | gas · classic · material | 1 |
| 3 | `N2O` | Nitrous Oxide | gas · atmosphere · anaesthetic | 3 |
| 4 | `CO2` | Carbon Dioxide | gas · atmosphere · classic | 3 |
| 5 | `glycine` | Glycine | amino acid · life · classic | 5 |
| 6 | `CH4` | Methane | gas · fuel · atmosphere · classic | 1 |
| 7 | `CO` | Carbon Monoxide | gas · toxin · classic | 2 |
| 8 | `H2O2` | Hydrogen Peroxide | classic · medicine | 2 |
| 9 | `NaCl` | Sodium Chloride | classic · food · metal | 2 |

## WHAT THE VOCABULARY CANNOT SAY YET (a proposal, NOT used in the file)

863 rows carry `medicine`, and **2** of them carry nothing else, because PLAN.md's vocabulary has a word for
only eight of the ATC's fourteen first letters. The eight plain words below would shelve most of that remainder; every one is a
word a reader would use about themselves, and each maps to whole ATC groups already in the file. They are proposed here and are
NOT in `vol-1.candidates.json` — the file uses PLAN.md's vocabulary and nothing else.

| proposed word | what it would hold | ATC groups (rows carrying one) |
|---|---|---|
| `eye` | eye drops and eye medicines | S01 (85) |
| `lung` | asthma and cough medicines | R03 (24), R05 (7) |
| `skin` | creams, antifungals and acne medicines | D01/D06/D07/D10/D11 (65) |
| `stomach` | antacids, ulcer and gut medicines | A02/A03/A06/A07 (42) |
| `diabetes` | insulin-sparing and blood-sugar medicines | A10 (13) |
| `parasite` | malaria and worm medicines | P01/P02/P03 (35) |
| `immune` | immune suppressants and modifiers | L03/L04 (10) |
| `explosive` | TNT, PETN, nitroglycerin and their kin | none — they sit under `material` and `fuel` today |

Two more that would earn their place outside medicine, if Josh wants ten: `refrigerant` (the CFC, HCFC, HFC and HFO rows, which
are `atmosphere` + `gas` today) and `battery` (the carbonate and nitrile electrolyte solvents, now `material` + `solvent`).

## THE LICENCES

| source | what it gave | licence |
|---|---|---|
| λWAVES itself (lab/molecules.js, lab/library.json) | the app's own molecules at their pinned geometries, ids kept | the repository’s own (see LICENSE) |
| PubChem (NCBI) PUG REST | identifiers, computed properties, 3-D conformers (OpenEye OMEGA / MMFF94s), descriptions | public domain (U.S. Government work); individual descriptions carry their own source and licence |
| ChEMBL ChEMBL_37 | approved small-molecule drugs (max_phase 4) and their ATC classifications | CC BY-SA 3.0 |
| ChEBI release 256 | roles and structural classes of 3-star (manually curated) entities, and their definitions (the blurbs marked so) | CC BY 4.0 |
| WHO ATC classification, as ChEMBL serves it | the words of a medicine’s ATC group, used in λWAVES-written blurbs | CC BY-SA 3.0 (ChEMBL’s distribution) |
| Wikidata (via the QLever SPARQL endpoint) | which compounds have an English Wikipedia article, how many Wikipedias carry them (the recognisability measure), and their “has use” statements | CC0 1.0 |
| WHO Model List of Essential Medicines (names read from its English Wikipedia article) | which medicines are essential — names only, each resolved through PubChem | the names are facts; no article text is reproduced (the article itself is CC BY-SA 4.0) |
| λWAVES’ own curated lists (tools/volumes/catalogue/curated.py, app_tags.py) | the chemistry classics, cages, materials, atmosphere, food, colours, life and fuels — names resolved through PubChem — and the app’s own tags and blurbs | the repository’s own |
| RDKit 2026.09.1 and tblite 0.7.0 (GFN2-xTB) | the geometries PubChem has no conformer for, and the inorganic and organometallic ones MMFF94 cannot hold | BSD-3-Clause (RDKit), LGPL-3.0 (tblite) |

Attribution the app must carry: ChEBI data from https://www.ebi.ac.uk/chebi (the release named above), CC BY 4.0 — every blurb
marked `ChEBI definition (CC BY 4.0)` is ChEBI's own words, trimmed to one or two sentences. ChEMBL and the ATC words are CC BY-SA
3.0 and are used as facts (a code, a group's name), not as text. PubChem is a U.S. Government work in the public domain. Wikidata
is CC0. The WHO Model List enters as NAMES only. Every other blurb is λWAVES' own (`blurbSource: 'λWAVES'`).

## WHAT A ROW CARRIES

`id · name · iupac · synonyms (≤6) · formula (Hill) · charge · multiplicity (1) · cid · inchi · inchikey · smiles · mw · exactMass ·
heavy · nAtoms · xlogp · tpsa · hbd · hba · rotatable · complexity · tags · blurb · blurbSource · atomsAng · geometrySource ·
sources · priority` — PLAN.md's `meta` for the .lwm header, plus the geometry the solver needs.
