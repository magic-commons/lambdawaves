# C5 · WHAT A MOLECULE IS (iteration 006)

Branch `it006-structure` (from `2d579ec`), tools only — `tools/volumes/catalogue/{structure_tags.py (new), build.py, chebi.py,
check.py, report.py, app_tags.py}`, `tools/volumes/pack.mjs`, `research/iteration-004/{PLAN.md, CAT-BUILD.md}`. No `lab/` change: the
picker draws a volume's tag chips from whatever its index carries (`lab/picker.js` paintTags). Data outside git in
`~/Documents/LAMBDAWAVES-VOLUMES/`. Nothing pushed. Every build ran cache-only (`LW_OFFLINE=1`), niced 18; PubChem was never asked
(no structure was missing). The three solvers (pids 358533, 358537, 359785) were never signalled.

Josh, 2026-10-18: *"it might be too many tags. I just wanted tags related to the molecules structure or class. The main organizer was
going to be through the volumes but we can just mash them all up for now."*

## 1 · THE TAGS SAY WHAT THE MOLECULE IS

Every use word is gone from the tags — medicine and the sixteen drug-class words, food, flavour, scent, sweetener, colour, solvent,
fuel, plastic, material, pesticide, toxin, pollutant, atmosphere, refrigerant, battery, explosive, gas, life, classic, natural,
vitamin, hormone, neurotransmitter. `tools/volumes/catalogue/structure_tags.py` computes a row's tags from two sources only:

1. **Its own structure** — RDKit 2026.09.1 on PubChem's SMILES (7,065 rows); for the 5 rows with no SMILES RDKit reads (MgH₂, the ice
   hexamer, the Li₄F₄ cube and closo-dodecaborate have none; RDKit refuses KrF₂'s `F[Kr]F`) the bonds `DetermineConnectivity` reads off
   the row's own atoms (covalent radii × 1.3). Ring analysis and the SMARTS below.
2. **Its ChEBI structural class** — `chebi.py` STRUCT_CLASSES through **CHECKED is_a relations only** (relation.tsv status 1; not
   OK, not SUBMITTED), for the 3-star entity of the row's InChIKey, or — when ChEBI has no entity of that key — every entity of its first
   block (the same skeleton in another stereo, isotope or protonation form). Written to `cache/chebi/structure-classes.json` (11,358
   InChIKeys); `chebi.py` was re-run from its cached flat files and its two old outputs came back **byte-identical**
   (`nominations.json` sha256 0a29c3af…, `by-inchikey.json` 6f2a60c3…), so no nomination — and no membership — moved.

**THE VOCABULARY — 35 words, in rank order** (the order the four-tag cap keeps them in). Counts over the 7,070 rows: *kept* = rows
that carry the word; *earned* = rows it fits before the two rules below.

| # | word | kept | earned | what earns it |
|---|---|---|---|---|
| 1 | peptide | 35 | 35 | ChEBI peptide (CHEBI:16670) |
| 2 | nucleotide | 62 | 62 | ChEBI nucleoside phosphate (CHEBI:25608: ATP, AMP, NAD, FMN …) |
| 3 | nucleoside | 51 | 51 | ChEBI nucleoside (CHEBI:33838) |
| 4 | nucleobase | 8 | 8 | ChEBI nucleobase (CHEBI:18282) |
| 5 | steroid | 445 | 445 | ChEBI steroid (CHEBI:35341) — 350; or the steroid nucleus (below) — 95 more |
| 6 | amino acid | 246 | 253 | ChEBI α-, β-, γ-, δ-, ε-amino acid (CHEBI:33704, 33706, 33707, 35931, 35958) — 189; or the pattern (below) — 57 more |
| 7 | sugar | 117 | 117 | ChEBI carbohydrate (CHEBI:16646) |
| 8 | alkaloid | 193 | 193 | ChEBI alkaloid (CHEBI:22315) |
| 9 | terpene | 230 | 230 | ChEBI terpenoid (CHEBI:26873) or terpene (CHEBI:35186) |
| 10 | fat | 173 | 173 | ChEBI fatty acid (CHEBI:35366), glyceride (CHEBI:47778) or wax (CHEBI:73702) |
| 11 | metal | 98 | 98 | an atom of Li, Be, Na, Mg, Al, K, Ca, Sc–Ga (geom.METALS) |
| 12 | ion | 5 | 5 | a net charge (the app's NH₄⁺, H₃O⁺, OH⁻, CN⁻, B₁₂H₁₂²⁻) |
| 13 | cage | 63 | 63 | ≥ 3 rings and every ring atom in ≥ 2 of them — a closed polyhedron |
| 14 | inorganic | 247 | 247 | no carbon; or carbon only with no H and only O, S, B, Si or metal neighbours, or as a terminal C≡N with O, S or metal neighbours |
| 15 | nitro | 193 | 193 | `[#6,#7,$([#8X2][#6])][$([NX3](=O)=O),$([NX3+](=O)[O-])]` |
| 16 | nitrile | 151 | 151 | `[#6][CX2]#[NX1]` |
| 17 | alkyne | 85 | 85 | `C#C` |
| 18 | aldehyde | 127 | 144 | `[CX3H1](=O)[#6]` · `[CX3H2]=O` |
| 19 | phenol | 867 | 867 | `[c][OX2H1]` |
| 20 | ester | 1,007 | 1,024 | `[#6X3](=[OX1])[#8X2H0][#6]` (lactones, carbonates, carbamates too) |
| 21 | amide | 1,581 | 1,702 | `[#7X3][#6X3]=[OX1]` · `[#7X3][#16X4](=[OX1])=[OX1]` (lactams, imides, ureas, sulfonamides too) |
| 22 | ketone | 1,058 | 1,083 | `[#6][#6X3](=[OX1])[#6]` (quinones too) |
| 23 | acid | 1,068 | 1,558 | `[CX3](=O)[OX2H1,OX1-]` · `[#16,#15,#7,#17,#35,#5,#33,#34](=O)[OX2H1]` · `[OX2H1][#16,#15,#5,#33,#34,#14,#17,#35]` · `[F,Cl,Br;H1]` |
| 24 | amine | 1,627 | 2,182 | `[NX3;!$(N~[!#6;!#1]);!$(N[#6,#16,#15]=[#7,#8,#16]);!$(N[#6]#[#7]);$(N[#6])]` · `[NX4+;!$(N~[!#6;!#1]);$(N[#6])]` |
| 25 | alcohol | 1,361 | 1,783 | `[CX4][OX2H1]` |
| 26 | ether | 1,245 | 1,824 | `[OX2;!$(O[#6]=[#7,#8,#16])]([#6])[#6]` |
| 27 | halogen | 1,058 | 1,399 | an atom of F, Cl or Br |
| 28 | phosphorus | 191 | 331 | an atom of P |
| 29 | sulfur | 714 | 1,070 | an atom of S |
| 30 | alkene | 970 | 1,674 | `C=C` (aliphatic carbons: outside an aromatic ring) |
| 31 | alkane | 106 | 106 | carbon and hydrogen only, every bond single |
| 32 | heterocycle | 3,464 | 3,465 | a ring holding carbon and another element (organic rows) |
| 33 | aromatic | 2,641 | 4,236 | an aromatic ring, RDKit's model (organic rows: RDKit calls white phosphorus aromatic) |
| 34 | ring | 347 | 716 | a ring, none aromatic and none a heterocycle |
| 35 | chain | 984 | 1,140 | no ring, organic, ≥ 2 carbons (one carbon: only when nothing else fits — methyl isocyanate) |

**The two class patterns.** *Steroid nucleus:* `[#6]1~[#6]~[#6]~[#6]2~[#6](~[#6]~1)~[#6]~[#6]~[#6;!a]1~[#6;!a]~2~[#6;!a]~[#6;!a]~[#6;!a]2~[#6;!a]~[#6;!a]~[#6;!a]~[#6;!a]~1~2`
— ChEBI's own definition (the cyclopenta[a]phenanthrene skeleton, any bonds), rings C and D not aromatic (diindenoperylene, a PAH,
has the same 6-6-6-5 shape), and **no fifth all-carbon ring of ≥ 5 atoms fused onto the four** (lupeol, betulin, betulinic acid,
hopane, diplopterol and zeorin hold the four rings inside a pentacyclic triterpenoid; the first pattern took them). A heterocycle
fused on (stanozolol's pyrazole, danazol's isoxazole, an acetonide's dioxolane) and drospirenone's cyclopropanes leave a steroid a
steroid. The 95 it adds are ChEBI-less or ChEBI-unchecked steroids: the esters (estradiol cypionate, testosterone undecanoate,
hydrocortisone acetate …), the bile-acid conjugates (glycocholic, taurocholic acid), cardenolides, batrachotoxin. *Amino acid:* a free
amine carrying a hydrogen — `[NX3;H1,H2;!$(N~[!#6;!#1]);!$(N[#6,#16,#15]=[#7,#8,#16]);!$(N[#6]#[#7])]` — then `[CX4]`, 0–4 × `[C]`,
then `[CX3](=O)[OX2H1,OX1-]`: an α- to ε-amino acid. It adds GABA's family where ChEBI is silent or unchecked (baclofen, gabapentin,
pregabalin, vigabatrin, tranexamic acid, aminocaproic acid, 5-aminolevulinic acid, β-alanine) and the amino-acid units inside larger
molecules (cephalosporin C's aminoadipyl, ritalinic acid, telotristat). ChEBI's plain `amino acid` (CHEBI:33709, "a carboxylic acid
containing one or more amino groups") was NOT used: it takes in diclofenac, bumetanide, mesalazine, EDTA and the quinolones.

**The four places.** Two rules, then rank:
- **A class word speaks for what it implies** (SUBSUMES): peptide ⊃ amide, amine, acid, amino acid · nucleotide ⊃ nucleoside,
  nucleobase, sugar, phosphorus, acid, alcohol, ether, amine, amide · nucleoside ⊃ nucleobase, sugar, alcohol, ether, amine, amide ·
  nucleobase ⊃ amine, amide · amino acid ⊃ acid, amine · sugar ⊃ alcohol, ether, aldehyde, ketone · steroid ⊃ ring · fat ⊃ acid,
  ester, chain, alkane · alkaloid ⊃ amine · cage ⊃ ring. So steroid beats alcohol, alkaloid beats amine, sugar beats alcohol and amino
  acid beats acid + amine by construction (and by rank). Subsumed: amine 494, acid 484, ring 369, alcohol 226, ether 180, chain 156,
  amide 118, phosphorus 62 …
- **One shape word always stays**: when the four best by rank hold none of cage · heterocycle · aromatic · ring · chain and the
  molecule has one, the best of them takes the fourth place (atenolol: `amide · amine · alcohol · aromatic`, not `… · ether`).
- Then rank. Cut by the cap: aromatic 1,595 (a heterocycle kept instead), alkene 704, ether 399, sulfur 356, halogen 341, alcohol
  196, phosphorus 78, amine 61 …

Every row earns at least one word. Tags per row: 1 · 289 — 2 · 1,440 — 3 · 1,715 — 4 · 3,626 (was 1,346 · 2,474 · 2,094 · 1,156:
a structure always has more to say than a use list did). Words in use: 50 → 35.

**Fifteen rows** (new ← old):

| row | tags now | before C5 |
|---|---|---|
| Water | inorganic | classic · life · solvent |
| Aspirin | ester · acid · aromatic | medicine · painkiller · heart · acid |
| Caffeine | alkaloid · amide · heterocycle · aromatic | medicine · mind · pollutant · flavour |
| Glucose | sugar · heterocycle | medicine · food · sugar · life |
| Cholesterol | steroid · alcohol · alkene | fat · steroid · life · ring |
| Testosterone | steroid · ketone · alcohol · alkene | medicine · hormone · steroid · ring |
| Morphine | alkaloid · phenol · alcohol · heterocycle | medicine · painkiller · heart · anaesthetic |
| ATP | nucleotide · heterocycle · aromatic | medicine · food · life · acid |
| Glycine | amino acid · chain | amino acid · life · classic |
| Oleic Acid | fat · alkene | medicine · food · solvent · fat |
| Aspartame | peptide · ester · aromatic | medicine · pollutant · sweetener · flavour |
| Adamantane | cage · alkane | cage · classic · material |
| Nitroglycerin | nitro · chain | medicine · explosive · heart · life |
| Sodium Chloride | metal · inorganic · halogen | classic · food · metal |
| Benzylpenicillin | amide · acid · sulfur · heterocycle | medicine · antibiotic · eye · acid |

## 2 · NOTHING ELSE MOVES

- **Membership.** A row has always had to earn a word of the OLD vocabulary to be in the catalogue (425 nominations are refused "no
  plain tag of the vocabulary fits it"). That test stays — `build.py` step 9a `use_words()`, the old tagger unchanged but for its
  constants' names (`USE_VOCAB`, `USE_RANK`) — so no molecule enters or leaves. Its words are computed, never written.
- **Blurbs.** A λWAVES blurb's last fallback names its row's first tag ("X: an aromatic compound."; 809 rows reach it). It still names
  the first USE word, so no blurb changes.
- **The app's own 88 rows** are tagged like every other row now; `app_tags.py`'s word lists only feed `use_words` (its blurbs stay the
  app rows' own).

## 3 · THE REBUILD, THE GATE, THE SWAP, THE QUEUES

- `LW_OFFLINE=1 nice -n 18 build.py --out=…/vol-1.candidates.next.json` (24 s; `catalogue/build-c5.log`): 7,070 rows, 27,326
  exclusions, guards 0 complaints. Against the live file (C4's): the same ids in the same order, and **one field differs —
  `tags`, on 7,030 rows** (40 kept the same words: indane's and tetralin's `aromatic`, tributyrin's `fat` …); the exclusion list identical row for row; file-level only
  `tagVocabulary` and `built`.
- `check.py …next.json --against vol-1.candidates.json` (`catalogue/check-c5.log`): **7070 rows checked · 0 complaints** — 7070/7070
  ids with the same InChIKey · 2794/2794 rows solved in `raw/` at exactly their solved atoms. `guards.py --pin`: 0 rows.
- **The swap, 11:28:02**: C4's files kept as **`vol-1.{candidates,stats,excluded}.before-c5.json`** (hard links, so the live name was
  never missing), the gated files renamed over the live ones (rename(2)); the gate again on the live file against `before-c5`: 0
  complaints.
- **Reproducible**: the committed code rebuilt into a scratch path gives the live file field for field (only `built` differs).
- **The queues.** `queues.py` copies whole catalogue rows, so `vol-1.finish.json` (1,242) and `vol-1.gpu-day.json` (3,230) carried the
  old tags. Rewritten in place — every row kept, same order, each checked equal to its catalogue row in every field but `tags`; 1,234 and
  3,221 rows retagged — to a tmp, then renamed; the old ones kept as `vol-1.{finish,gpu-day}.before-c5.json`. queues.py was NOT re-run
  (it would have dropped what has finished since). The running solvers keep their in-memory lists; nothing they read changed shape.

## 4 · ONE VOLUME FOR NOW

**`pack.mjs --sole`** (new). Without `--themes` the packer used to add or replace its one volume and leave the rest of `volumes.json`
standing. `--sole` says the volume(s) this run writes ARE the shelf: `volumes.json` lists them alone and, with `--incremental` (never
with `--only`), C4's prune empties every other `vol-<n>/` of the dist — and now also removes its emptied `m/`, `t/` and the folder
itself (anything not the packer's is named and left), and its `pack-report-<vol>.json` beside dist. `--themes` implies it. Tested first
in a sandbox dist (five molecules; planted stale `vol-1/m/stale.lwm`, `vol-2/`, `vol-3/` with a foreign `NOTES.txt`, two stale
pack reports, a three-volume `volumes.json`): one volume listed, every planted packer file gone, `NOTES.txt` named and kept.

**The run** (`/tmp/c5/run-pack.sh`), from this worktree at `cca293f`, niced 18, 11:32:34 → 12:38:53 (1 h 06 min wall, 3.0 GB peak RSS;
log `~/Documents/LAMBDAWAVES-VOLUMES/pack-c5.log`), no `--themes`:

```
node tools/volumes/pack.mjs --candidates ~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.candidates.json \
     --volume vol-1 --numeral I --title 'All the Molecules' \
     --blurb 'Every finished molecule of the catalogue in one volume, for now: each solved in RHF up the whole basis ladder STO-3G → 6-31+G*, with its identifiers and properties, and tagged by what it is — its structure and its class.' \
     --sole --incremental
```

Every molecule was packed again (its row's tags are in the header, so every `candSha256` moved). C4's themed shelf is kept as
`~/Documents/LAMBDAWAVES-VOLUMES/volumes.before-c5.json`.

| volume | title | molecules | bytes (.lwm) |
|---|---|---|---|
| VOL. I (`vol-1`) | **All the Molecules** | **2,815** | **1,876,270,400 (1,789.35 MiB)** |

(C4's five themed volumes held 2,698 · 1,703,084,872 B; 117 molecules have finished since.) On disk `dist/` is 1,878,448,669 B: the
2,815 `.lwm`, 28 pictures (the pilot's; no new thumbnails rendered) and a 2,082,235 B `index.json`. **Pruned: 2,164 files** — the 2,130
`.lwm` of `vol-2/`…`vol-5/` (404 + 840 + 378 + 508), their pictures, four `index.json`, the four emptied folders and
`pack-report-vol-{2,3,4,5}.json`. Afterwards `dist/` is `volumes.json` + `vol-1/{index.json, m/, t/}` and nothing else; checked file by
file: 2,843 files listed = 2,843 on disk, every size and sha-256 the index's, the shelf's `indexSha256` and `bytes` right, every row's
tags the catalogue's, none of C4's refused ids anywhere. 4,255 not packed: not finished (the two queues), and helium and argon (no
LUMO, `validateRecord` refuses "ground" — as in C3/C4). Three 6-31+G\* rungs refused by the orthonormality gate (diphenylacetylene
1.05e-7, biphenylene 5.8e-8, o-carborane 1.3e-8); those molecules ship five rungs.

The shelf's tag chips (rows of VOL. I): aromatic 1,040 · chain 813 · heterocycle 792 · acid 411 · halogen 409 · alkene 381 · amine 334
· amide 329 · sulfur 317 · alcohol 316 · inorganic 243 · ether 239 · phenol 235 · ketone 201 · amino acid 186 · ester 186 · ring 183 ·
metal 94 · aldehyde 87 · phosphorus 87 · fat 79 · sugar 78 · alkane 71 · nitro 71 · terpene 58 · alkaloid 49 · cage 48 · nitrile 34 ·
alkyne 28 · nucleobase 8 · steroid 6 · ion 5 · nucleoside 4 · peptide 2 (the solved molecules are the small ones: no nucleotide has
finished yet, and few steroids).

**When the finish queue is done**, the same command again (only new and changed molecules are packed; `--archive` adds the `.lwv`).

## LEFT FOR JOSH

1. **`themes.json` is kept in git, untouched, for later** — but its `precedence` names the old use words (medicine, food, vitamin …),
   which no row carries now: before themed volumes come back, its steps want rewriting in the new words (or the build could write the
   still-computed use words to a field of their own for the shelf to read).
2. **Four tags is still the cap**; 3,626 rows now carry four. One constant (`structure_tags.tags(n=4)`, and check.py's 1–4) makes it
   three.
3. **Where ChEBI's classes are broad, the words are ChEBI's.** `sugar` (its carbohydrate) takes in glycerol and the sugar alcohols
   and the sugar acids (tartaric, gluconic, glucuronic); `fat` (its fatty acid) the short chains (butyric, propionic acid, valproate,
   GHB); `alkaloid` nicotinic acid, nicotinamide, phenethylamine and tryptamine. Narrower would be one line each in STRUCT_CLASSES
   (e.g. `fat` = long- and medium-chain fatty acids, CHEBI:15904 + 59554, + glycerides).
4. **CHECKED is_a misses some**: 5′-methylthioadenosine is no `nucleoside` (its path is unchecked); ~95 steroids came only by the
   pattern. Taking OK relations too (status 3) would add 2–19 % per class over the rows' own entities (steroid 344 → 355, alkaloid
   182 → 186, peptide 34 → 37, terpenoid 177 → 210) — one line in chebi.py.
5. **`nucleotide`** is the 35th word (not on the suggested list): ATP, AMP, NAD, coenzyme A, the cyclic nucleotides. **`flavonoid`**
   (118 rows by ChEBI: quercetin, catechin, rutin …) and `porphyrin` were left out to stay at 35; each is one line.
6. **The 425 refused for no use word** stay refused (membership unchanged, as asked). Every one of them would earn a structure word
   now; letting them in is deleting the `use_words` gate — 425 more molecules for the solvers.
7. Unchanged from C4: helium and argon solve but do not pack (no LUMO → `validateRecord`: a `lab/` question); three of C4's four 6-31+G\*
   rungs refused by the orthonormality gate; descriptions for 1,101 CIDs only; no thumbnails rendered for the new molecules; no
   `--archive`; nothing pushed — `it006-structure` waits for the integrator.
