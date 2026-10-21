> **SWAPPED IN 2026-10-21 13:37 by Josh's word (iteration 006, row C7 THE WIDER CATALOGUE; research/iteration-006/C7-BUILD.md §2–3): 29,509 molecules, the gate 0 complaints both ways, 3,848 solved rows at their solved atoms; the previous file is vol-1.candidates.before-c7.json (hard link), queues vol-1.{finish,gpu-day}.before-c7.json likewise. queues.py: finish 8,984 molecules (heavy ≤ 20) on the three local solvers from 13:37 under the zero-token babysitter (babysit/babysit-c7.sh); gpu-day 16,677 waits for Rent-A-GPU day. — PREVIOUSLY: FULL RUN, 2026-10-17 (iteration 006, row C2 THE FULL CATALOGUE; research/iteration-006/C2-BUILD.md has the guards, the swap and the solvers) — REBUILT FROM THE CACHE on 2026-10-18 by row C3 THE CATALOGUE'S YESES (research/iteration-006/C3-BUILD.md: the ten iteration-006 tags), by row C4 THE SCREEN GAP AND THE STRAY TAGS (research/iteration-006/C4-BUILD.md: both screens match on the InChIKey's first block, 10 rows refused; the drug-class words from evidence about the molecule itself) and by row C5 WHAT A MOLECULE IS (research/iteration-006/C5-BUILD.md; Josh: tags of structure or class only): every tag now says what the molecule IS — 35 words read off its own structure and its ChEBI structural class (THE TAGS below); no use word is a tag any more. 7,030 rows' tags changed and nothing else in any row: the same 7,070 ids, atoms, blurbs and priorities, the same 27,326 exclusions. No PubChem request was sent, no id moved, every solved row keeps the atoms it was solved at. Descriptions still exist for 1,101 CIDs only (PubChem went Black during C2's online run); a calm online re-run of build.py fills in the rest. The previous file is kept as vol-1.candidates.before-c5.json (C4's), before-c4 (C3's), before-c3 (C2's) and the 950 as vol-1.candidates.950.json.**

# CAT · THE CANDIDATE LIST (iteration 004, row CAT THE CATALOGUE)

`~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.candidates.json` — **29509 molecules**, built 2026-10-19T09:17:51-05:00, schema 1.
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
| PubChem | 29505 |
| Wikidata | 18323 |
| ChEBI | 14824 |
| ChEMBL | 2070 |
| curated | 1583 |
| WHO EML | 359 |
| λWAVES | 88 |

The combinations, most common first (PubChem is on every row and is left out of the key):

| sources | molecules |
|---|---|
| Wikidata | 12810 |
| ChEBI | 10806 |
| ChEBI + Wikidata | 2287 |
| ChEMBL + Wikidata | 778 |
| ChEBI + ChEMBL + Wikidata | 722 |
| Wikidata + curated | 688 |
| ChEBI + Wikidata + curated | 545 |
| ChEBI + ChEMBL + WHO EML + Wikidata | 199 |
| curated | 130 |
| ChEMBL | 108 |
| ChEMBL + WHO EML + Wikidata | 81 |
| ChEBI + curated | 71 |
| ChEBI + ChEMBL + Wikidata + curated | 70 |
| ChEBI + ChEMBL + WHO EML + Wikidata + curated | 33 |
| ChEBI + ChEMBL | 31 |
| Wikidata + λWAVES | 24 |
| ChEBI + Wikidata + λWAVES | 18 |
| ChEMBL + Wikidata + curated | 17 |

By tag (PLAN.md's TAGS since iteration 006 C5 — what the molecule IS, from its structure and its ChEBI class; a molecule carries 1–4; the vocabulary, its patterns and the cap: THE TAGS below):

| tag | molecules |
|---|---|
| heterocycle | 15840 |
| aromatic | 9350 |
| alcohol | 7019 |
| amine | 6922 |
| ether | 5970 |
| amide | 5549 |
| ketone | 5028 |
| ester | 4998 |
| alkene | 4986 |
| phenol | 4284 |
| acid | 3921 |
| chain | 3780 |
| halogen | 3578 |
| sulfur | 2365 |
| steroid | 2181 |
| terpene | 1703 |
| ring | 1532 |
| fat | 1476 |
| sugar | 1297 |
| amino acid | 1059 |
| alkaloid | 795 |
| ion | 654 |
| phosphorus | 610 |
| inorganic | 579 |
| aldehyde | 569 |
| nitro | 543 |
| nitrile | 493 |
| nucleotide | 363 |
| alkyne | 345 |
| alkane | 220 |
| metal | 198 |
| peptide | 185 |
| cage | 135 |
| nucleoside | 124 |
| nucleobase | 8 |

Tags per molecule: 1 tag: 672 · 2 tags: 5296 · 3 tags: 6769 · 4 tags: 16772

By heavy atoms:

| heavy atoms | molecules |
|---|---|
| ≤10 | 4101 |
| 11–20 | 8721 |
| 21–30 | 9860 |
| 31–40 | 4143 |
| 41–50 | 1555 |
| 51–60 | 707 |
| 61–70 | 422 |
| >70 | 0 |

By geometry:

| geometry | molecules |
|---|---|
| PubChem 3-D conformer | 26064 |
| RDKit ETKDGv3 + MMFF94 | 2789 |
| GFN2-xTB | 568 |
| app pinned | 88 |

THE GUARDS (guards.py). (a) 3485 rows already solved in `raw/` kept the exact atoms they were solved at
(PubChem 3-D conformer 3007 · RDKit ETKDGv3 + MMFF94 223 · GFN2-xTB 177 · app pinned 78); 246 of them have a PubChem 3-D conformer waiting, which `--refresh-geometry` would take (and those rows would then be solved again).
(b) 7070/7070 ids of the previous file kept; the ids came from new, its own slug 22067 · the previous file 6982 · new, suffixed past another new row 201 · new, suffixed past an old id 160 · the app 88 · raw/ (solved under it) 8 · an earlier file (it returns) 3.

By blurb:

| blurb written by | molecules |
|---|---|
| λWAVES | 13555 |
| ChEBI definition (CC BY 4.0) | 15954 |

## THE EXCLUSIONS

3003 nominations were refused, and every one is written down with its reason in
`~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.excluded.json`. By reason:

| reason | count |
|---|---|
| N heavy atoms, past the N the volume allows | 732 |
| an isotopically labelled compound | 332 |
| an element beyond krypton (I) | 303 |
| refused: on the Chemical Weapons Convention schedules or in a scheduled family | 241 |
| an odd electron count (N): an open shell, not an RHF molecule | 175 |
| PubChem has no compound under this name | 125 |
| not one molecule: PubChem counts N separate units, and it has no neutral parent | 83 |
| an element beyond krypton (Sn) | 59 |
| an element beyond krypton (Hg) | 54 |
| a radical (RDKit finds unpaired electrons): an open shell | 53 |
| an element beyond krypton (Te) | 37 |
| an element beyond krypton (Pb) | 36 |
| an element beyond krypton (Sb) | 32 |
| an element beyond krypton (Mo) | 26 |
| an element beyond krypton (Bi) | 26 |
| no N-D geometry: its build ran past N minutes and was stopped | 25 |
| an element beyond krypton (U) | 23 |
| an element beyond krypton (Tl) | 23 |
| an element beyond krypton (In) | 22 |
| an element beyond krypton (W) | 21 |
| no N-D geometry: PubChem has no conformer and neither MMFFN nor GFNN-xTB would build one | 21 |
| an element beyond krypton (Zr) | 20 |
| an element beyond krypton (Nb) | 19 |
| an element beyond krypton (Pt) | 18 |
| an element beyond krypton (Os) | 18 |
| its PubChem structure does not parse | 17 |

By the source that nominated it:

| source | refused |
|---|---|
| wikidata | 2101 |
| chebi | 455 |
| chebi/wikidata | 155 |
| who | 110 |
| curated | 55 |
| chembl/wikidata | 38 |
| chebi/chembl/wikidata | 19 |
| curated/wikidata | 17 |
| chembl | 12 |
| app | 10 |
| chebi/chembl/who/wikidata | 10 |
| chebi/who/wikidata | 8 |

THE SCREEN. **250** nominations were refused as Chemical Weapons Convention scheduled chemicals, listed precursors
or members of a scheduled family — by NAME (64 of the Annex's own names resolved through PubChem to an InChIKey
skeleton), by CLASS (five coarse substructure families, so a congener under another name is refused too) and by Wikidata's own
"chemical warfare agent" uses; each signal screens its whole connectivity skeleton (the InChIKey's FIRST BLOCK: racemate,
enantiomers, isotopologues, protonated forms) and, for a salt, its neutral parent's (29 first blocks carry a
signal; **4** rows were refused only through a skeleton-mate's). A row a screened skeleton holds stays only when it
is ITSELF an approved drug by ChEMBL: 1 rows, menthol (beside Menthol).
The Annex names and classes refuse outright, approved or not. This screen is unchanged since iteration 006 C4.

**The controlled-substance screen is removed** (iteration 006 C7, Josh's decision, 2026-10-18: "That's only the human's relation
with the molecule that's the problem"): the illicit-names list, ChEBI's hallucinogen and opioid roles, Wikidata's recreational-drug
uses and the controlled-medicine ATC groups refuse nothing now; those molecules are ordinary rows.

## MORE MOLECULES (iteration 006 C7: Josh, 2026-10-18 — "add in whatever molecules you can")

Recognisability no longer refuses a row (it orders the rows: the recognisable first in each tier); the use-word gate is gone; a
Wikidata article's salt or mixture is folded onto its neutral parent; a closed-shell ion is a row with its charge; the heavy-atom
cap is 70 (was 50; the rows of 51–70 wait for the Rent-A-GPU-day queue); the controlled-substance screen is
gone. **22439** rows are new against the previous file, by why the previous build refused them (or what this build does
differently):

| why the row is new | rows | for example |
|---|---|---|
| recognisability is no longer a filter: only ChEBI, in no Wikipedia | 10703 | thiamine-pyrophosphate-2 (Thiamine Pyrophosphate), abamectin (Abamectin), metaphosphoric-acid (Metaphosphoric Acid), p-toluenesulfonamide (P-Toluenesulfonamide), acriflavine (Acriflavine), lauryl-sulfate (Lauryl Sulfate) |
| recognisability is no longer a filter: only Wikidata, in < 12 Wikipedias | 10311 | chlormequat (Chlormequat), phosphocholine (Phosphocholine), metasilicic-acid (Metasilicic Acid), medronic-acid (Medronic Acid), thiomalic-acid (Thiomalic Acid), tetraethylenepentamine (Tetraethylenepentamine) |
| a salt or a mixture, as its neutral parent | 516 | aluminium-fluoride (Aluminium Fluoride), nickel-ii-fluoride (Nickel(II) Fluoride), sodium-stearoyl-lactylate (Sodium Stearoyl Lactylate), pheophytin-a (Pheophytin a), tetraborate (Tetraborate), murexide (Murexide) |
| the use-word gate is gone (it earns no use word) | 425 | glutaraldehyde (Glutaraldehyde), neon (Neon), silicon-carbide (Silicon Carbide), platelet-activating-factor (Platelet-activating Factor), boron-nitride (Boron Nitride), bromoacetone (Bromoacetone) |
| heavy 51–70 (the cap rose from 50 to 70) | 205 | azithromycin (Azithromycin), erythromycin (Erythromycin), clarithromycin (Clarithromycin), digoxin (Digoxin), rifampicin (Rifampicin), paclitaxel (Paclitaxel) |
| a closed-shell ion, kept with its charge | 158 | thiamine (Thiamine), neostigmine (Neostigmine), pyridostigmine (Pyridostigmine), suxamethonium-chloride (Suxamethonium Chloride), potassium-chloride (Potassium Chloride), methylene-blue (Methylene Blue) |
| returned: the controlled-substance screen is removed | 91 | heroin (Heroin), methamphetamine-2 (Methamphetamine), mdma (MDMA), lsd (LSD), mescaline (Mescaline), phencyclidine (Phencyclidine) |
| new this run (PubChem answered a name, a key or a parent the previous build had not) | 29 | iron-ii-oxide (Iron(II) Oxide), nickel-ii-chloride (Nickel(II) Chloride), zinc-fluoride (Zinc Fluoride), aluminium-bromide (Aluminium Bromide), aluminium-arsenide (Aluminium Arsenide), titanium-ii-chloride (Titanium(II) Chloride) |
| a hand skip lifted (curated.C7_LIFTED) | 1 | brevetoxin (Brevetoxin) |

The rows the controlled-substance screen had refused since C4 came back under the ids an earlier file gave them: `methorphan` (Methorphan), `levofenfluramine` (Levofenfluramine), `arketamine` (Arketamine), `levomethamphetamine` (Levomethamphetamine), `methamphetamine-2` (Methamphetamine), `tilidine` (Tilidine), `vinbarbital-2` (Vinbarbital), `esmodafinil` (Esmodafinil), `acetylmethadol` (Acetylmethadol), `pentazocine` (Pentazocine).

PubChem: 0 requests this run; PENDING (never asked; a calm run fills them): descriptions 25616 — 0 rows held back. Local geometries built this run: 0 (4 worker processes).

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
| `peptide` | 185 | 185 | 0 | 0 | ChEBI 185 — ChEBI peptide (CHEBI:16670) |
| `nucleotide` | 363 | 363 | 0 | 0 | ChEBI 363 — ChEBI nucleoside phosphate (CHEBI:25608) |
| `nucleoside` | 124 | 125 | 1 | 0 | ChEBI 124 — ChEBI nucleoside (CHEBI:33838) |
| `nucleobase` | 8 | 8 | 0 | 0 | ChEBI 8 — ChEBI nucleobase (CHEBI:18282) |
| `steroid` | 2181 | 2181 | 0 | 0 | ChEBI 1365 · structure 816 — ChEBI steroid (CHEBI:35341) · the cyclopenta[a]phenanthrene nucleus, rings C and D not aromatic, no fifth all-carbon ring of ≥ 5 atoms fused onto it |
| `amino acid` | 1059 | 1086 | 27 | 0 | ChEBI 732 · structure 327 — ChEBI α-amino acid (CHEBI:33704), β-amino acid (CHEBI:33706), γ-amino acid (CHEBI:33707), δ-amino acid (CHEBI:35931), ε-amino acid (CHEBI:35958) · an α-amino acid: a free amine (with H) on the carbon next to a carboxylic acid; a β-amino acid; a γ-amino acid (GABA, gabapentin, baclofen); a δ-amino acid (5-aminolevulinic acid); an ε-amino acid (aminocaproic acid, tranexamic acid) |
| `sugar` | 1297 | 1297 | 0 | 0 | ChEBI 1297 — ChEBI carbohydrate (CHEBI:16646) |
| `alkaloid` | 795 | 795 | 0 | 0 | ChEBI 795 — ChEBI alkaloid (CHEBI:22315) |
| `terpene` | 1703 | 1703 | 0 | 0 | ChEBI 1703 — ChEBI terpenoid (CHEBI:26873), terpene (CHEBI:35186) |
| `fat` | 1476 | 1476 | 0 | 0 | ChEBI 1476 — ChEBI fatty acid (CHEBI:35366), glyceride (CHEBI:47778), wax (CHEBI:73702) |
| `metal` | 198 | 198 | 0 | 0 | an atom of Li, Be, Na, Mg, Al, K, Ca or Sc–Ga |
| `ion` | 654 | 654 | 0 | 0 | a net charge |
| `cage` | 135 | 135 | 0 | 0 | three rings or more, every ring atom in two of them (a closed polyhedron) |
| `inorganic` | 579 | 579 | 0 | 0 | no carbon, or carbon only as CO, CO₂, CS₂, carbonic acid, a cyanide, a metal carbonyl or a carbide |
| `nitro` | 543 | 543 | 0 | 0 | a nitro group on carbon or nitrogen, or a nitrate ester |
| `nitrile` | 493 | 493 | 0 | 0 | a nitrile: C≡N on carbon |
| `alkyne` | 345 | 345 | 0 | 0 | a carbon–carbon triple bond |
| `aldehyde` | 569 | 662 | 93 | 0 | an aldehyde: CHO on carbon; formaldehyde |
| `phenol` | 4284 | 4284 | 0 | 0 | an OH on an aromatic ring |
| `ester` | 4998 | 5287 | 281 | 8 | an ester (a lactone, a carbonate or a carbamate too): C(=O)–O–C |
| `amide` | 5549 | 6048 | 476 | 23 | an amide (a lactam, an imide, a urea, a carbamate too): N–C(=O); a sulfonamide: N–S(=O)₂ |
| `ketone` | 5028 | 5218 | 81 | 109 | a ketone: C=O between two carbons (a quinone too) |
| `acid` | 3921 | 6728 | 2703 | 104 | a carboxylic acid; an oxoacid group: sulfonic, sulfuric, phosphoric, phosphonic, nitric, nitrous, chloric …; an OH on S, P, B, As, Se, Si, Cl or Br (sulfurous, boric, silicic, hypochlorous acid …); a hydrogen halide |
| `amine` | 6922 | 9262 | 2084 | 256 | an amine nitrogen (primary, secondary or tertiary; an aniline too); a quaternary ammonium on carbon |
| `alcohol` | 7019 | 10020 | 1773 | 1228 | an OH on an sp³ carbon |
| `ether` | 5970 | 10234 | 1571 | 2693 | an ether: C–O–C, neither carbon a carbonyl (an epoxide, an acetal too) |
| `halogen` | 3578 | 4654 | 0 | 1076 | an atom of F, Cl or Br |
| `phosphorus` | 610 | 1414 | 363 | 441 | an atom of P |
| `sulfur` | 2365 | 3607 | 0 | 1242 | an atom of S |
| `alkene` | 4986 | 9033 | 0 | 4047 | a carbon–carbon double bond outside an aromatic ring |
| `alkane` | 220 | 220 | 0 | 0 | carbon and hydrogen only, every bond single |
| `heterocycle` | 15840 | 15845 | 0 | 5 | a ring holding carbon and another element (organic rows) |
| `aromatic` | 9350 | 16465 | 0 | 7115 | an aromatic ring (RDKit's model; organic rows) |
| `ring` | 1532 | 3062 | 1530 | 0 | a ring, none aromatic and none a heterocycle |
| `chain` | 3780 | 5101 | 1321 | 0 | no ring, organic, two carbons or more (one carbon: only when nothing else fits) |

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
