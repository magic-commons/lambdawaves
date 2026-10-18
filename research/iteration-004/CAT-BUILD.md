> **FULL RUN, 2026-10-17 (iteration 006, row C2 THE FULL CATALOGUE; research/iteration-006/C2-BUILD.md has the guards, the swap and the solvers) — REBUILT FROM THE CACHE on 2026-10-18 by row C3 THE CATALOGUE'S YESES (research/iteration-006/C3-BUILD.md: the ten iteration-006 tags) and again by row C4 THE SCREEN GAP AND THE STRAY TAGS (research/iteration-006/C4-BUILD.md): both screens match on the InChIKey's first block (10 rows refused: the methamphetamine racemate and nine other forms of controlled medicines), and the drug-class words come from evidence about the molecule itself (409 rows' tags changed: no salt's, mixture's, counter-ion's, inherited or SUBMITTED ChEBI role). No PubChem request was sent, no surviving id moved, every solved row keeps the atoms it was solved at. Descriptions still exist for 1,101 CIDs only (PubChem went Black during C2's online run); a calm online re-run of build.py fills in the rest. The previous file is kept as vol-1.candidates.before-c4.json (C3's), before-c3 (C2's) and the 950 as vol-1.candidates.950.json.**

# CAT · THE CANDIDATE LIST (iteration 004, row CAT THE CATALOGUE)

`~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.candidates.json` — **7070 molecules**, built 2026-10-18T08:53:00-05:00, schema 1.
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
| PubChem | 7066 |
| Wikidata | 6543 |
| ChEBI | 3864 |
| ChEMBL | 1940 |
| curated | 1554 |
| WHO EML | 320 |
| λWAVES | 88 |

The combinations, most common first (PubChem is on every row and is left out of the key):

| sources | molecules |
|---|---|
| ChEBI + Wikidata | 2049 |
| Wikidata | 1430 |
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
| aromatic | 4059 |
| medicine | 2436 |
| acid | 1460 |
| natural | 1305 |
| ring | 1293 |
| classic | 627 |
| pesticide | 582 |
| steroid | 338 |
| food | 310 |
| life | 304 |
| pollutant | 275 |
| mind | 269 |
| heart | 268 |
| amino acid | 228 |
| cancer | 221 |
| fat | 194 |
| material | 188 |
| toxin | 184 |
| hormone | 180 |
| colour | 176 |
| alkaloid | 161 |
| antibiotic | 151 |
| flavour | 146 |
| scent | 135 |
| cage | 129 |
| painkiller | 126 |
| solvent | 125 |
| sugar | 123 |
| eye | 116 |
| metal | 108 |
| gas | 107 |
| skin | 97 |
| plastic | 89 |
| atmosphere | 73 |
| fuel | 65 |
| stomach | 63 |
| antiviral | 61 |
| allergy | 57 |
| anaesthetic | 55 |
| vitamin | 52 |
| parasite | 51 |
| lung | 48 |
| sweetener | 32 |
| diabetes | 32 |
| immune | 30 |
| refrigerant | 23 |
| neurotransmitter | 16 |
| nucleobase | 11 |
| explosive | 11 |
| battery | 10 |

Tags per molecule: 1 tag: 1346 · 2 tags: 2474 · 3 tags: 2094 · 4 tags: 1156

By heavy atoms:

| heavy atoms | molecules |
|---|---|
| ≤10 | 1530 |
| 11–20 | 2300 |
| 21–30 | 2163 |
| 31–40 | 816 |
| 41–50 | 260 |
| >50 | 1 |

By geometry:

| geometry | molecules |
|---|---|
| PubChem 3-D conformer | 6384 |
| RDKit ETKDGv3 + MMFF94 | 409 |
| GFN2-xTB | 189 |
| app pinned | 88 |

THE GUARDS (guards.py). (a) 2665 rows already solved in `raw/` kept the exact atoms they were solved at
(PubChem 3-D conformer 2194 · RDKit ETKDGv3 + MMFF94 220 · GFN2-xTB 173 · app pinned 78); 246 of them have a PubChem 3-D conformer waiting, which `--refresh-geometry` would take (and those rows would then be solved again).
(b) 7070/7080 ids of the previous file kept; the ids came from the previous file 6982 · the app 88; MISSING: acetylmethadol, arketamine, esmodafinil, levofenfluramine, levomethamphetamine, methamphetamine-2, methorphan, pentazocine, tilidine, vinbarbital-2.

By blurb:

| blurb written by | molecules |
|---|---|
| λWAVES | 2386 |
| ChEBI definition (CC BY 4.0) | 4684 |

## THE EXCLUSIONS

27326 nominations were refused, and every one is written down with its reason in
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
| refused: a controlled psychoactive substance that is not an approved medicine | 93 |
| an isotopically labelled compound | 84 |
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
| wikidata | 15345 |
| chebi | 11197 |
| chebi/wikidata | 317 |
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
and by Wikidata's own "chemical warfare agent" uses. **93** were refused as controlled psychoactive
substances that are not approved medicines (51 names resolved, plus ChEBI's hallucinogen and opioid
roles and Wikidata's recreational-drug uses); an approved medicine passes the second screen, so morphine and fentanyl are in the
library as medicines and nothing else of that kind is.

Since iteration 006 C4 both screens match on the InChIKey's FIRST BLOCK (the connectivity skeleton): every signal — a name, a
Wikidata use, a ChEBI role, and for the second screen an approved medicine whose own ATC code sits in a controlled-drug group
(`curated.CONTROLLED_ATC`: opioids, central stimulants and anorectics, barbiturates, benzodiazepines and Z-drugs, ketamine) — screens
its whole skeleton (racemate, enantiomers, isotopologues, protonated forms) and, for a salt, its neutral parent's. 29
first blocks carry a CWC signal, 189 a controlled-substance signal; **10** rows were refused only
through a skeleton-mate's signal. A row a screened skeleton holds stays only when it is ITSELF an approved drug by ChEMBL (max_phase 4:
a ChEMBL approved parent whose structure is this row, never a salt folded onto it): 103 rows, 4
of them beside another form's signal — menthol (beside Menthol), Dextromethorphan (beside Levomethorphan), Levoamphetamine (beside Amphetamine), Levopropoxyphene (beside Dextropropoxyphene). The CWC's Annex
names and classes refuse outright, approved or not.

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
drug classes they refine, so they never send a food to Medicine. 2436 rows carry `medicine`; 29 carry nothing else.

| word | what it holds | from (ATC codes on the medicine rows) | rows | cut by the cap |
|---|---|---|---|---|
| `eye` | eye drops and eye medicines | S01 (134) | 116 | 11 |
| `lung` | asthma and cough medicines | R03 (44), R05 (18) | 48 | 4 |
| `skin` | creams, antifungals and acne medicines | D01/D06/D07/D10/D11 (130) | 97 | 14 |
| `stomach` | antacids, ulcer and gut medicines | A02/A03/A06/A07 (78) | 63 | 5 |
| `diabetes` | insulin-sparing and blood-sugar medicines | A10 (33) | 32 | 1 |
| `parasite` | malaria and worm medicines | P01/P02/P03 (53) | 51 | 2 |
| `immune` | immune suppressants and modifiers | L03/L04 (31) | 30 | 1 |
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
