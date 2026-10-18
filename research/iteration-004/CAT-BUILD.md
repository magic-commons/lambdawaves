> **FULL RUN, 2026-10-17 (iteration 006, row C2 THE FULL CATALOGUE; research/iteration-006/C2-BUILD.md has the guards, the swap and the solvers) — REBUILT FROM THE CACHE on 2026-10-18 by row C3 THE CATALOGUE'S YESES (research/iteration-006/C3-BUILD.md: the ten iteration-006 tags), by row C4 THE SCREEN GAP AND THE STRAY TAGS (research/iteration-006/C4-BUILD.md: both screens match on the InChIKey's first block, 10 rows refused; the drug-class words from evidence about the molecule itself) and by row C5 WHAT A MOLECULE IS (research/iteration-006/C5-BUILD.md; Josh: tags of structure or class only): every tag now says what the molecule IS — 35 words read off its own structure and its ChEBI structural class (THE TAGS below); no use word is a tag any more. 7,030 rows' tags changed and nothing else in any row: the same 7,070 ids, atoms, blurbs and priorities, the same 27,326 exclusions. No PubChem request was sent, no id moved, every solved row keeps the atoms it was solved at. Descriptions still exist for 1,101 CIDs only (PubChem went Black during C2's online run); a calm online re-run of build.py fills in the rest. The previous file is kept as vol-1.candidates.before-c5.json (C4's), before-c4 (C3's), before-c3 (C2's) and the 950 as vol-1.candidates.950.json.**

# CAT · THE CANDIDATE LIST (iteration 004, row CAT THE CATALOGUE)

`~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.candidates.json` — **7070 molecules**, built 2026-10-18T11:27:15-05:00, schema 1.
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

By tag (PLAN.md's TAGS since iteration 006 C5 — what the molecule IS, from its structure and its ChEBI class; a molecule carries 1–4; the vocabulary, its patterns and the cap: THE TAGS below):

| tag | molecules |
|---|---|
| heterocycle | 3464 |
| aromatic | 2641 |
| amine | 1627 |
| amide | 1581 |
| alcohol | 1361 |
| ether | 1245 |
| acid | 1068 |
| halogen | 1058 |
| ketone | 1058 |
| ester | 1007 |
| chain | 984 |
| alkene | 970 |
| phenol | 867 |
| sulfur | 714 |
| steroid | 445 |
| ring | 347 |
| inorganic | 247 |
| amino acid | 246 |
| terpene | 230 |
| alkaloid | 193 |
| nitro | 193 |
| phosphorus | 191 |
| fat | 173 |
| nitrile | 151 |
| aldehyde | 127 |
| sugar | 117 |
| alkane | 106 |
| metal | 98 |
| alkyne | 85 |
| cage | 63 |
| nucleotide | 62 |
| nucleoside | 51 |
| peptide | 35 |
| nucleobase | 8 |
| ion | 5 |

Tags per molecule: 1 tag: 289 · 2 tags: 1440 · 3 tags: 1715 · 4 tags: 3626

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

THE GUARDS (guards.py). (a) 2783 rows already solved in `raw/` kept the exact atoms they were solved at
(PubChem 3-D conformer 2310 · RDKit ETKDGv3 + MMFF94 221 · GFN2-xTB 174 · app pinned 78); 246 of them have a PubChem 3-D conformer waiting, which `--refresh-geometry` would take (and those rows would then be solved again).
(b) 7070/7070 ids of the previous file kept; the ids came from the previous file 6982 · the app 88.

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
| 0 | `H2O` | Water | inorganic | 1 |
| 1 | `NH3` | Ammonia | inorganic | 1 |
| 2 | `urea` | Urea | amide | 4 |
| 3 | `N2O` | Nitrous Oxide | inorganic | 3 |
| 4 | `CO2` | Carbon Dioxide | inorganic | 3 |
| 5 | `CH4` | Methane | alkane | 1 |
| 6 | `glycine` | Glycine | amino acid · chain | 5 |
| 7 | `CO` | Carbon Monoxide | inorganic | 2 |
| 8 | `HCl` | Hydrogen Chloride | inorganic · acid · halogen | 1 |
| 9 | `H2O2` | Hydrogen Peroxide | inorganic | 2 |

## THE TAGS (iteration 006 C5: Josh, 2026-10-18 — "tags related to the molecules structure or class")

Every tag says what the molecule IS, never what it is for. `tools/volumes/catalogue/structure_tags.py` reads it off the row's own
structure (RDKit: PubChem's SMILES, or for the 5 rows
without a SMILES RDKit reads, the bonds DetermineConnectivity finds in their own atoms) and off its ChEBI structural class (CHECKED is_a relations only,
`cache/chebi/structure-classes.json`). 35 words, in RANK order — the order the four-tag cap keeps them in: a class of
molecules first, then what it is made of in kind, then its functional groups (rarest first), the elements, its carbon–carbon bonds,
and its shape last. A class word speaks for what it implies (an amino acid is not also `acid` and `amine`; a sugar not `alcohol`; a
steroid not `ring`; an alkaloid not `amine`: "subsumed"), and one shape word (cage, heterocycle, aromatic, ring, chain) always keeps a
place. "earned" = rows the word fits before either rule; "kept" = rows that carry it.

| tag | kept | earned | subsumed | cut by the cap | from |
|---|---|---|---|---|---|
| `peptide` | 35 | 35 | 0 | 0 | ChEBI 35 — ChEBI peptide (CHEBI:16670) |
| `nucleotide` | 62 | 62 | 0 | 0 | ChEBI 62 — ChEBI nucleoside phosphate (CHEBI:25608) |
| `nucleoside` | 51 | 51 | 0 | 0 | ChEBI 51 — ChEBI nucleoside (CHEBI:33838) |
| `nucleobase` | 8 | 8 | 0 | 0 | ChEBI 8 — ChEBI nucleobase (CHEBI:18282) |
| `steroid` | 445 | 445 | 0 | 0 | ChEBI 350 · structure 95 — ChEBI steroid (CHEBI:35341) · the cyclopenta[a]phenanthrene nucleus, rings C and D not aromatic, no fifth all-carbon ring of ≥ 5 atoms fused onto it |
| `amino acid` | 246 | 253 | 7 | 0 | ChEBI 189 · structure 57 — ChEBI α-amino acid (CHEBI:33704), β-amino acid (CHEBI:33706), γ-amino acid (CHEBI:33707), δ-amino acid (CHEBI:35931), ε-amino acid (CHEBI:35958) · an α-amino acid: a free amine (with H) on the carbon next to a carboxylic acid; a β-amino acid; a γ-amino acid (GABA, gabapentin, baclofen); a δ-amino acid (5-aminolevulinic acid); an ε-amino acid (aminocaproic acid, tranexamic acid) |
| `sugar` | 117 | 117 | 0 | 0 | ChEBI 117 — ChEBI carbohydrate (CHEBI:16646) |
| `alkaloid` | 193 | 193 | 0 | 0 | ChEBI 193 — ChEBI alkaloid (CHEBI:22315) |
| `terpene` | 230 | 230 | 0 | 0 | ChEBI 230 — ChEBI terpenoid (CHEBI:26873), terpene (CHEBI:35186) |
| `fat` | 173 | 173 | 0 | 0 | ChEBI 173 — ChEBI fatty acid (CHEBI:35366), glyceride (CHEBI:47778), wax (CHEBI:73702) |
| `metal` | 98 | 98 | 0 | 0 | an atom of Li, Be, Na, Mg, Al, K, Ca or Sc–Ga |
| `ion` | 5 | 5 | 0 | 0 | a net charge |
| `cage` | 63 | 63 | 0 | 0 | three rings or more, every ring atom in two of them (a closed polyhedron) |
| `inorganic` | 247 | 247 | 0 | 0 | no carbon, or carbon only as CO, CO₂, CS₂, carbonic acid, a cyanide, a metal carbonyl or a carbide |
| `nitro` | 193 | 193 | 0 | 0 | a nitro group on carbon or nitrogen, or a nitrate ester |
| `nitrile` | 151 | 151 | 0 | 0 | a nitrile: C≡N on carbon |
| `alkyne` | 85 | 85 | 0 | 0 | a carbon–carbon triple bond |
| `aldehyde` | 127 | 144 | 17 | 0 | an aldehyde: CHO on carbon; formaldehyde |
| `phenol` | 867 | 867 | 0 | 0 | an OH on an aromatic ring |
| `ester` | 1007 | 1024 | 17 | 0 | an ester (a lactone, a carbonate or a carbamate too): C(=O)–O–C |
| `amide` | 1581 | 1702 | 118 | 3 | an amide (a lactam, an imide, a urea, a carbamate too): N–C(=O); a sulfonamide: N–S(=O)₂ |
| `ketone` | 1058 | 1083 | 15 | 10 | a ketone: C=O between two carbons (a quinone too) |
| `acid` | 1068 | 1558 | 484 | 6 | a carboxylic acid; an oxoacid group: sulfonic, sulfuric, phosphoric, phosphonic, nitric, nitrous, chloric …; an OH on S, P, B, As, Se, Si, Cl or Br (sulfurous, boric, silicic, hypochlorous acid …); a hydrogen halide |
| `amine` | 1627 | 2182 | 494 | 61 | an amine nitrogen (primary, secondary or tertiary; an aniline too); a quaternary ammonium on carbon |
| `alcohol` | 1361 | 1783 | 226 | 196 | an OH on an sp³ carbon |
| `ether` | 1245 | 1824 | 180 | 399 | an ether: C–O–C, neither carbon a carbonyl (an epoxide, an acetal too) |
| `halogen` | 1058 | 1399 | 0 | 341 | an atom of F, Cl or Br |
| `phosphorus` | 191 | 331 | 62 | 78 | an atom of P |
| `sulfur` | 714 | 1070 | 0 | 356 | an atom of S |
| `alkene` | 970 | 1674 | 0 | 704 | a carbon–carbon double bond outside an aromatic ring |
| `alkane` | 106 | 106 | 0 | 0 | carbon and hydrogen only, every bond single |
| `heterocycle` | 3464 | 3465 | 0 | 1 | a ring holding carbon and another element (organic rows) |
| `aromatic` | 2641 | 4236 | 0 | 1595 | an aromatic ring (RDKit's model; organic rows) |
| `ring` | 347 | 716 | 369 | 0 | a ring, none aromatic and none a heterocycle |
| `chain` | 984 | 1140 | 156 | 0 | no ring, organic, two carbons or more (one carbon: only when nothing else fits) |

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
