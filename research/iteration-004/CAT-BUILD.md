> **FULL RUN, 2026-10-17 (iteration 006, row C2 THE FULL CATALOGUE; research/iteration-006/C2-BUILD.md has the guards, the swap and the solvers) — REBUILT FROM THE CACHE on 2026-10-18 by row C3 THE CATALOGUE'S YESES (research/iteration-006/C3-BUILD.md): the ten iteration-006 tags. No geometry upgrade (Josh held the compute): every solved row keeps the atoms it was solved at; 41 rows the solver re-solved at PubChem's conformer in the seven minutes the upgrade was live keep those. No PubChem request was sent and no id moved. Descriptions still exist for 1,101 CIDs only (PubChem went Black during C2's online run); a calm online re-run of build.py fills in the rest. The previous file is kept as vol-1.candidates.before-c3.json, the 950 as vol-1.candidates.950.json.**

# CAT · THE CANDIDATE LIST (iteration 004, row CAT THE CATALOGUE)

`~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.candidates.json` — **7080 molecules**, built 2026-10-18T07:11:20-05:00, schema 1.
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
| PubChem | 7076 |
| Wikidata | 6553 |
| ChEBI | 3868 |
| ChEMBL | 1940 |
| curated | 1554 |
| WHO EML | 320 |
| λWAVES | 88 |

The combinations, most common first (PubChem is on every row and is left out of the key):

| sources | molecules |
|---|---|
| ChEBI + Wikidata | 2053 |
| Wikidata | 1436 |
| ChEMBL + Wikidata | 720 |
| ChEBI + ChEMBL + Wikidata | 683 |
| Wikidata + curated | 668 |
| ChEBI + Wikidata + curated | 534 |
| ChEBI + ChEMBL + WHO EML + Wikidata | 181 |
| ChEBI | 150 |
| curated | 133 |
| ChEMBL | 104 |
| ChEBI + curated | 72 |
| ChEMBL + WHO EML + Wikidata | 70 |
| ChEBI + ChEMBL + Wikidata + curated | 67 |
| ChEBI + ChEMBL | 35 |
| ChEBI + ChEMBL + WHO EML + Wikidata + curated | 33 |
| Wikidata + λWAVES | 32 |
| ChEBI + Wikidata + λWAVES | 17 |
| ChEMBL + Wikidata + curated | 16 |

By tag (PLAN.md's vocabulary and its ten iteration-006 words only; a molecule carries 1–4):

| tag | molecules |
|---|---|
| aromatic | 3968 |
| medicine | 2439 |
| acid | 1429 |
| natural | 1293 |
| ring | 1261 |
| classic | 624 |
| pesticide | 579 |
| cancer | 443 |
| heart | 371 |
| mind | 347 |
| steroid | 319 |
| life | 295 |
| food | 294 |
| pollutant | 250 |
| amino acid | 222 |
| painkiller | 218 |
| hormone | 205 |
| fat | 192 |
| material | 185 |
| antibiotic | 185 |
| toxin | 183 |
| colour | 175 |
| alkaloid | 160 |
| flavour | 143 |
| scent | 135 |
| cage | 127 |
| solvent | 123 |
| sugar | 121 |
| metal | 108 |
| gas | 105 |
| eye | 102 |
| plastic | 88 |
| skin | 88 |
| atmosphere | 72 |
| fuel | 65 |
| antiviral | 61 |
| allergy | 59 |
| stomach | 58 |
| parasite | 50 |
| vitamin | 48 |
| anaesthetic | 44 |
| lung | 42 |
| sweetener | 32 |
| immune | 28 |
| diabetes | 26 |
| refrigerant | 23 |
| neurotransmitter | 13 |
| nucleobase | 11 |
| explosive | 11 |
| battery | 10 |

Tags per molecule: 1 tag: 1346 · 2 tags: 2431 · 3 tags: 1990 · 4 tags: 1313

By heavy atoms:

| heavy atoms | molecules |
|---|---|
| ≤10 | 1530 |
| 11–20 | 2308 |
| 21–30 | 2165 |
| 31–40 | 816 |
| 41–50 | 260 |
| >50 | 1 |

By geometry:

| geometry | molecules |
|---|---|
| PubChem 3-D conformer | 6394 |
| RDKit ETKDGv3 + MMFF94 | 409 |
| GFN2-xTB | 189 |
| app pinned | 88 |

THE GUARDS (guards.py). (a) 2593 rows already solved in `raw/` kept the exact atoms they were solved at
(PubChem 3-D conformer 2128 · RDKit ETKDGv3 + MMFF94 214 · GFN2-xTB 173 · app pinned 78); 246 of them have a PubChem 3-D conformer waiting, which `--refresh-geometry` would take (and those rows would then be solved again).
(b) 7080/7080 ids of the previous file kept; the ids came from the previous file 6992 · the app 88.

By blurb:

| blurb written by | molecules |
|---|---|
| λWAVES | 2392 |
| ChEBI definition (CC BY 4.0) | 4688 |

## THE EXCLUSIONS

27316 nominations were refused, and every one is written down with its reason in
`~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.excluded.json`. By reason:

| reason | count |
|---|---|
| too obscure to be a library row: nominated only by wikidata and in N Wikipedias | 12910 |
| too obscure to be a library row: nominated only by chebi and in no Wikipedia | 11150 |
| not one molecule: PubChem counts N separate units, and it has no neutral parent | 1258 |
| no plain tag of the vocabulary fits it, so the library could not shelve it | 425 |
| N heavy atoms, past the N the volume allows | 371 |
| an ion (charge N) with no neutral parent in PubChem | 156 |
| PubChem has no compound under this name | 122 |
| an element beyond krypton (I) | 116 |
| refused: on the Chemical Weapons Convention schedules or in a scheduled family | 115 |
| an isotopically labelled compound | 84 |
| refused: a controlled psychoactive substance that is not an approved medicine | 83 |
| an odd electron count (N): an open shell, not an RHF molecule | 61 |
| a radical (RDKit finds unpaired electrons): an open shell | 25 |
| an ion (charge -N) with no neutral parent in PubChem | 20 |
| an element beyond krypton (Te) | 17 |
| an element beyond krypton (Hg) | 17 |
| an element beyond krypton (Sn) | 17 |
| an element beyond krypton (Pb) | 17 |
| an element beyond krypton (Mo) | 14 |
| left out by hand: heavy atoms N | 12 |
| an element beyond krypton (Sb) | 12 |
| an element beyond krypton (W) | 11 |
| its PubChem structure does not parse | 10 |
| an element beyond krypton (Tl) | 10 |
| PubChem's record for it carries no InChIKey or no formula | 9 |
| an element beyond krypton (Re) | 9 |

By the source that nominated it:

| source | refused |
|---|---|
| wikidata | 15339 |
| chebi | 11197 |
| chebi/wikidata | 313 |
| who | 114 |
| curated | 90 |
| chembl/wikidata | 65 |
| chembl | 47 |
| chebi/chembl/wikidata | 42 |
| chebi/chembl/who/wikidata | 26 |
| curated/wikidata | 19 |
| chebi/chembl | 15 |
| chembl/who/wikidata | 12 |

THE TWO SCREENS. **119** nominations were refused as Chemical Weapons Convention scheduled chemicals, listed
precursors or members of a scheduled family — by NAME (64 of the Annex's own names resolved through
PubChem to an InChIKey skeleton) and by CLASS (five coarse substructure families, so a congener under another name is refused too),
and by Wikidata's own "chemical warfare agent" uses. **83** were refused as controlled psychoactive
substances that are not approved medicines (51 names resolved, plus ChEBI's hallucinogen and opioid
roles and Wikidata's recreational-drug uses); an approved medicine passes the second screen, so morphine and fentanyl are in the
library as medicines and nothing else of that kind is.

## THE TEN FIRST ROWS (priority order: the app's own, then the WHO essential medicines and the most recognisable names, then small before large)

| priority | id | name | tags | heavy |
|---|---|---|---|---|
| 0 | `H2O` | Water | classic · life · solvent | 1 |
| 1 | `NH3` | Ammonia | gas · classic · material | 1 |
| 2 | `urea` | Urea | classic · life · material | 4 |
| 3 | `N2O` | Nitrous Oxide | gas · atmosphere · anaesthetic | 3 |
| 4 | `CO2` | Carbon Dioxide | gas · atmosphere · classic | 3 |
| 5 | `CH4` | Methane | gas · fuel · atmosphere · classic | 1 |
| 6 | `glycine` | Glycine | amino acid · life · classic | 5 |
| 7 | `CO` | Carbon Monoxide | gas · toxin · classic | 2 |
| 8 | `HCl` | Hydrogen Chloride | acid · gas · classic | 1 |
| 9 | `H2O2` | Hydrogen Peroxide | classic · medicine | 2 |

## THE TEN WORDS OF ITERATION 006 (CAT's proposal; in the file since C3, Josh's yes of 2026-10-18)

Seven medicine words from the drug's OWN, non-combination ATC codes, and three hand-list words outside medicine. They rank with the
uses, so the four-tag cap cuts a structure word (aromatic, ring, acid …) before any of them; they rank after the food words and the
drug classes they refine, so they never send a food to Medicine. 2439 rows carry `medicine`; 24 carry nothing else.

| word | what it holds | from (ATC codes on the medicine rows) | rows | cut by the cap |
|---|---|---|---|---|
| `eye` | eye drops and eye medicines | S01 (134) | 102 | 25 |
| `lung` | asthma and cough medicines | R03 (44), R05 (18) | 42 | 10 |
| `skin` | creams, antifungals and acne medicines | D01/D06/D07/D10/D11 (130) | 88 | 24 |
| `stomach` | antacids, ulcer and gut medicines | A02/A03/A06/A07 (78) | 58 | 13 |
| `diabetes` | insulin-sparing and blood-sugar medicines | A10 (33) | 26 | 7 |
| `parasite` | malaria and worm medicines | P01/P02/P03 (53) | 50 | 3 |
| `immune` | immune suppressants and modifiers | L03/L04 (31) | 28 | 3 |
| `refrigerant` | the curated CFC, HCFC, HFC and HFO rows | curated.py: the cfcs, hcfcs and hfcs lists | 23 | 0 |
| `battery` | the carbonate and nitrile electrolyte solvents | curated.py: batteries and solvents (those items only) | 10 | 0 |
| `explosive` | the classic textbook explosives already in the catalogue | curated.py EXPLOSIVES (InChIKeys; adds no molecule) | 11 | 0 |

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
