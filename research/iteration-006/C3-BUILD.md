# C3 · THE CATALOGUE'S YESES (iteration 006)

Branch `it006-yeses` (from `dbf3420`), tools only — `tools/volumes/catalogue/{build,check,guards,curated,report,queues}.py`, `tools/volumes/solve.py` (one line),
`tools/volumes/{pack.mjs,themes.json}`, PLAN.md's TAGS line, CAT-BUILD.md regenerated. No `lab/` change was needed: the picker groups a
volume by whatever tags its index carries (`lab/picker.js`), so the ten new words show up there by themselves. Data stays outside git
in `~/Documents/LAMBDAWAVES-VOLUMES/`. Nothing pushed. PubChem was never asked: every build ran cache-only (`LW_OFFLINE=1`), niced
18, one thread.

Josh said yes (2026-10-18) to five things, then changed the compute plan three times while the row ran: "hold off on the compute … leave
Volume 1 unfinished" (no geometry upgrade; stop, don't restart), then "finish the ones we have left and then save up the rest for
Rent-A-GPU day" (restart on the cheap remainder only), then "push my GPU to 100%" (two GPU processes). What landed:

## 1 · THE TEN NEW TAGS

`build.py`: seven medicine words through the ATC map, on the drug's OWN, non-combination codes (`fetch_chembl.py`'s `atc`, as C2
fixed it) — `eye` S01 · `lung` R03/R05 · `skin` D01/D06/D07/D10/D11 · `stomach` A02/A03/A06/A07 · `diabetes` A10 · `parasite`
P01–P03 · `immune` L03/L04 — and three hand-list words in `curated.py`: `refrigerant` (the category tag of the `cfcs`, `hcfcs` and
`hfcs` lists: the CFC, HCFC, HFC and HFO rows), `battery` (the seven carbonates and three nitriles of `batteries and solvents`, item by
item; DME, GBL, sulfolane and the rest stay `solvent` + `material`), `explosive` (`curated.EXPLOSIVES`: eleven InChIKeys of textbook
explosives ALREADY in the catalogue — TNT, nitroglycerin, PETN, picric acid, RDX, HMX, tetryl, TATB, HNS, CL-20,
1,3,5-trinitrobenzene; `build.py` adds the word to the row of that key and nothing else, so the list can never bring a molecule in).
`check.py`'s vocabulary has the ten words; PLAN.md's TAGS list has an "iteration 006" line under it; `report.py`'s proposal section
is now the table of the ten words in use (CAT-BUILD.md).

**The cap.** Four tags stay the limit. The new words rank with the uses (`TAG_RANK`), so the cap cuts every origin and structure word
(amino acid … fat, steroid, alkaloid, life, natural, metal, gas, acid, cage, aromatic, ring, classic) before any of them:
`explosive`, `refrigerant` and `battery` right after `medicine` (short exact lists — nitroglycerin keeps `explosive` beside its heart
words), the seven ATC words after the uses already there. The second choice is deliberate: ranked above `food`, `flavour` and
`sweetener`, the new words cut those on 13 approved rows (citric acid, sorbitol, natamycin …), and the one-theme rule would then have
shelved them in Medicine; ranked after, no food word is lost. The price: a drug already carrying three drug-class words keeps them
and loses its organ word (the "cut" column).

Old = C2's file (`vol-1.candidates.before-c3.json`), new = the file in place; "cut" = rows that carried the word before the cap:

| tag | old | new | cut | tag | old | new | cut |
|---|---|---|---|---|---|---|---|
| `aromatic` | 4019 | 3968 | 286 | `cage` | 128 | 127 | 7 |
| `medicine` | 2439 | 2439 | 0 | `solvent` | 123 | 123 | 4 |
| `acid` | 1438 | 1429 | 97 | `sugar` | 123 | 121 | 7 |
| `natural` | 1303 | 1293 | 73 | `metal` | 108 | 108 | 1 |
| `ring` | 1275 | 1261 | 157 | `gas` | 106 | 105 | 4 |
| `classic` | 626 | 624 | 42 | **`eye`** | 0 | **102** | 25 |
| `pesticide` | 579 | 579 | 4 | `plastic` | 88 | 88 | 2 |
| `cancer` | 444 | 443 | 39 | **`skin`** | 0 | **88** | 24 |
| `heart` | 371 | 371 | 0 | `atmosphere` | 72 | 72 | 1 |
| `mind` | 347 | 347 | 9 | `fuel` | 65 | 65 | 0 |
| `steroid` | 327 | 319 | 39 | `antiviral` | 61 | 61 | 0 |
| `life` | 297 | 295 | 28 | `allergy` | 59 | 59 | 7 |
| `food` | 294 | 294 | 22 | **`stomach`** | 0 | **58** | 13 |
| `pollutant` | 250 | 250 | 31 | **`parasite`** | 0 | **50** | 3 |
| `amino acid` | 223 | 222 | 10 | `vitamin` | 48 | 48 | 4 |
| `painkiller` | 218 | 218 | 0 | `anaesthetic` | 44 | 44 | 12 |
| `hormone` | 205 | 205 | 16 | **`lung`** | 0 | **42** | 10 |
| `fat` | 192 | 192 | 2 | `sweetener` | 32 | 32 | 0 |
| `antibiotic` | 185 | 185 | 0 | **`immune`** | 0 | **28** | 3 |
| `material` | 185 | 185 | 3 | **`diabetes`** | 0 | **26** | 7 |
| `toxin` | 183 | 183 | 3 | **`refrigerant`** | 0 | **23** | 0 |
| `colour` | 175 | 175 | 2 | `neurotransmitter` | 13 | 13 | 3 |
| `alkaloid` | 165 | 160 | 15 | **`explosive`** | 0 | **11** | 0 |
| `flavour` | 143 | 143 | 3 | `nucleobase` | 11 | 11 | 0 |
| `scent` | 135 | 135 | 0 | **`battery`** | 0 | **10** | 0 |

416 rows' tags changed (they gained only the ten words; they lost aromatic 51 · ring 14 · natural 10 · acid 9 · steroid 8 · alkaloid 5
· life 2 · sugar 2 · classic 2 · cancer 1 · amino acid 1 · cage 1 · gas 1). Tags per row: 1 · 1,346 — 2 · 2,431 — 3 · 1,990 — 4 ·
1,313 (was 1,355 · 2,604 · 1,948 · 1,173). Two blurbs changed (TATB, hexanitrostilbene: "an aromatic compound" → "an explosive": their
λWAVES fallback names the first tag). Nothing else in any row changed except the 41 geometries of section 3.

## 2 · ONE PRIMARY THEME PER MOLECULE

`themes.json` (schema 2) states the rule in its own `rule` field and carries a `precedence` list that `pack.mjs` reads: the steps are
read in order and the FIRST step a molecule meets is its theme (`app`: the app's own table; `any`: one of these tags — unless it also
carries one of the step's `none`); no step → The Rest. `pack.mjs --candidates … --themes … --count-themes` prints the shelf the whole
catalogue would make.

| step | theme | a molecule that … |
|---|---|---|
| 1 | The Classics | is in the app's own table |
| 2 | Life and Food | carries `vitamin`, `nucleobase`, `food`, `flavour` or `sweetener` — even when it is an approved medicine |
| 3 | Life and Food | carries `amino acid`, `sugar` or `fat` and NO drug-class word (painkiller … immune) |
| 4 | Medicine | carries `medicine` or any medicine word (the drug classes, `hormone`, the seven ATC words) |
| 5 | The Classics | carries `classic` (the textbook molecules) |
| 6 | Materials, Atmosphere and Fuel | carries material, atmosphere, fuel, refrigerant, battery, explosive, plastic, solvent, gas or metal |
| 7 | Life and Food | carries life, steroid, neurotransmitter, scent, natural or alkaloid |
| 8 | Materials, Atmosphere and Fuel | carries pollutant, toxin, pesticide or colour |
| — | The Rest | everything else |

Over the 7,080 (the same packer code, `--count-themes`):

| theme | first match (C2's file and rule) | one primary theme (now) |
|---|---|---|
| The Classics | 658 | **632** |
| Medicine | 2,550 | **2,447** |
| Life and Food | 1,852 | **1,952** |
| Materials, Atmosphere and Fuel | 889 | **924** |
| The Rest | 1,131 | **1,125** |

176 rows changed shelf: Medicine → Life 115 (ascorbic acid, acetic acid, glycerol, riboflavin, retinol, nicotinamide, mannitol …) ·
Life → Materials 29 (bromomethane, limonene, sebacic acid, 2,5-dimethylfuran, farnesane, the bile acids ChEBI calls `material` …) ·
Classics → Life 14 (acetaldehyde, ethyl acetate, malic acid, propylene glycol …) · Classics → Medicine 12 (chloroform, chloroethane,
guanidine, phenolphthalein, piperazine …: approved drugs) · The Rest → Materials 6 (HMX, tetryl, TATB, HNS, CL-20, trinitrobenzene).

Step 3 is the one place I narrowed Josh's words. ChEBI files many drugs under `amino acid` or `fat` by STRUCTURE alone — mefenamic
acid, enoxacin, baclofen, vigabatrin, methyldopa, valproate, azelaic acid — and the literal rule ("amino acids … fats go to Life even
when approved") put 28 such drugs on the kitchen shelf. With the veto they stay medicines; ornithine, lipoic acid, xylose, DGLA (no
drug word) still go to Life. A drug whose drug-class word ChEMBL or the cap never gave it (aceclofenac, tolfenamic acid, foslevodopa,
carbocisteine, aminocaproic acid …, about nine) still lands in Life: the tags, not the rule, are short there.

## 3 · PUBCHEM'S SHAPE FOR THE SOLVED MOLECULES — built, run for seven minutes, then held (Josh: no compute)

**The tool stays.** `build.py --refresh-geometry` is now narrow (it used to lift guard (a) for every solved row and rebuild every
geometry ignoring the cache; that broad rebuild is `--rebuild-geometry` now, for the unsolved rows only). It lifts guard (a) for one
kind of row: SOLVED, on a local geometry (RDKit or xTB), never the app's pinned atoms, never a hand-built framework, whose PubChem 3-D
conformer is in the cache and usable; the build's own rule then gives it a geometry, kept only when it is PubChem-based (the conformer,
or its GFN2-xTB relaxation where MMFF94 has no parameters) and DIFFERS from the solved atoms. The moved rows are written to the stats
(`guards.solvedRowsMoved`; `guards.upgraded` with each row's old and new source); `check.py --allow-moved` accepts exactly that list
(each listed row must have moved, onto a PubChem-based geometry, and not be an app row; any other solved row that moved is still a
complaint), `guards.py --pin` leaves the listed rows where the build put them, and the build refuses to write if any other solved row
moved.

**What it found** (07:00, cache only): 286 solved rows waited; **247 moved**, all from RDKit ETKDGv3 + MMFF94 — 245 onto PubChem's own
conformer, phosphoric acid onto a GFN2-xTB relaxation of it (MMFF94 has no P(V) parameters), nitrous acid onto PubChem's conformer
checked against xTB (≤ 0.10 Å). The other 39 are xTB relaxations that already STARTED from PubChem's conformer: the rule gives them
their solved atoms. 131 xTB rows and 7 RDKit rows have no usable conformer. No app row and no id moved. Measured rung time of the 247:
19,621 s ≈ 5.45 solver-hours. Examples (old → new): aspirin, caffeine, paracetamol, ethanol, acetic acid, citric acid, ibuprofen,
dopamine (RDKit ETKDGv3 + MMFF94, seed 20261017 → PubChem's own conformer, OMEGA/MMFF94s), phosphoric acid (→ GFN2-xTB from PubChem's
conformer), nitrous acid (→ PubChem's, checked against xTB). That file went in at 07:03:42 with the solvers restarted on it.

**Then Josh held the compute** (the integrator's message reached me at ≈ 07:06). Every solved row keeps the atoms it is solved at, so
the file was rebuilt WITHOUT `--refresh-geometry` (07:11:24, `catalogue/build-c3-final.log`) and swapped in at 07:12:22. In the seven
minutes the CPU had re-solved 41 of the 247 at PubChem's conformer (it reached them smallest first; their old RDKit solves were
overwritten rung by rung): nitrous acid, ethanol, chloroethane, acetic acid, guanidine, chloroform, isopropyl alcohol, DMSO,
cysteamine, hydroxycarbamide, acetohydroxamic acid, phosphoric acid, methyl chloroform, fomepizole, halothane, glycerol, foscarnet,
4-aminopyridine, cycloserine, phenol, mesna, hydroquinone, benzyl alcohol, histamine, nicotinic acid, pyrazinamide, nicotinamide,
mequinol, 5-aminolevulinic acid, vigabatrin, ethchlorvynol, clomethiazole, enflurane, isoflurane, aminocaproic acid, salicylic acid,
tisopurine, isoniazid, acetanilide, deferiprone, trimethadione. Guard (a) keeps those 41 at the PubChem atoms they are now solved at
(trimethadione was left at 4 of 6 rungs and finished at 07:14 in the finish queue); the other 206 are back at their RDKit atoms and
their solves were never touched. Against C2's file the one in place differs in tags (416 rows), two blurbs and exactly those 41
geometries. Geometry over the file: PubChem 3-D conformer 6,354 → 6,394 · RDKit 450 → 409 · GFN2-xTB 188 → 189 · app pinned 88. The
upgrade, when Josh wants it, is still one command (section 5, LEFT FOR JOSH) and now moves 206 rows; the refreshed file is kept as
`vol-1.candidates.c3-refreshed.json` (with its stats: `guards.upgraded` lists all 247, old and new source).

## 4 · THE PACKER'S METADATA

`pack.mjs` (`candidateOf`) takes each molecule's row from the CURRENT `--candidates` file by id — names, tags, synonyms, blurb,
sources, priority — over `meta.candidate` (the row the solver last solved a rung from, which a finished molecule never refreshes);
`meta.candidate` is the fallback only for an id the file no longer has, and a field only the solved row carries (the pilot's
`symmetry`, `geometryMethod`) is kept, so H₂O still names its orbitals in C2v. Should the catalogue ever move a finished molecule's
atoms before the solver reaches it (a `--refresh-geometry` swap), the .lwm is packed at the atoms it was solved at with the geometry
words of the row it was solved from, and the run lists those ids — a file never names a geometry it does not carry. The
`--incremental` key now includes the row's digest (`header.source.candSha256`) beside the meta's, so a tag or name change repacks;
packer version `pack.mjs v3` (every v2 file repacks once).

## 5 · THE STOPS, THE SWAPS AND THE RESTARTS

All by the pids recorded in `raw/solver*.pid`, read at the moment, each age checked with `ps -o etime=`, `kill -TERM`, waited for;
never pkill. Scripts and logs in `/tmp/c3/` (`stop-bounded.sh`, `swap.sh`, `swap2.sh`, `stop-*.log`, `swap*.log`).

1. **First stop (for the upgrade swap).** GPU: `raw/solver-gpu.pid` → pid 302601, age 25:24; its rung in flight was pipotiazine
   palmitate 6-31+G* (1,065 AO), so the stop waited for that pid's next rung line (bounded 25 min): converged 07:03:01 (722 s), TERM
   at once, exited 07:03:03 — no GPU work lost. CPU: `raw/solver.pid` → pid 4154914, age 09:05:02; TERM right after acridone 6-31G*
   (07:03:35), exited 07:03:36. Pin 0 rows, gate 0 complaints (247/247 listed rows moved), C2's file kept as
   **`vol-1.candidates.before-c3.json`** (+ `.stats`/`.excluded`), the refreshed file renamed in 07:03:42, both restarted with their own
   scripts: CPU pid 343617, GPU pid 343624 — `start: 7080 molecules in the queue` (07:03:44 / 07:03:45), then `nitrous-acid: the atoms
   moved since the last solve — every rung is solved again` (07:03:46), ethanol, chloroethane, acetic acid … (41 in all).
2. **Second stop (Josh: hold the compute).** CPU pid 343617 (age 03:22): TERM at 07:07:10, the instant it logged mequinol 6-31+G* — and
   it DID NOT STOP (see LEFT FOR JOSH: the signal landed in `solve.py`'s point-group detection, whose `except Exception` swallows the
   `Stop`); a second TERM to the same pid at 07:10:30 (age 06:48) stopped it at 07:10:31 ("trimethadione: stopped by SIGTERM"). GPU pid
   343624 (age 06:55): TERM 07:10:38, exited 07:10:40 (fumonisin B1 at 1 of 6 rungs). Rebuilt without the upgrade, pin 0 rows, gate
   `check.py … --against vol-1.candidates.json` and `--against vol-1.candidates.before-c3.json`: **7080 rows checked · 0 complaints**
   each (7080/7080 ids with the same InChIKey · 2603/2603 solved rows at exactly their solved atoms); the refreshed file kept as
   `vol-1.candidates.c3-refreshed.json`, the final one renamed in at 07:12:22 (16,904,258 B).
3. **The queues** (Josh: "finish the ones we have left, then save up the rest for Rent-A-GPU day"), `tools/volumes/catalogue/queues.py`
   (the solver's own finished test; rows byte for byte, ids unchanged; the catalogue file stays whole for the packer):

```
catalogue 7080 · finished 2600 · not finished 4480 (half-climbed: 3: trimethadione, acridone, fumonisin-b1)
(a) vol-1.finish.json  1248 molecules · cost 420064.0 units · ≈ 50.5 h = 2.10 days for ONE solver at STATUS's 0.433 s/unit
(b) vol-1.gpu-day.json 3232 molecules · cost 9277867.3 units · ≈ 46.5 days for one solver at that rate
```

4. **Restart on (a) only** (07:13:59), from the integration checkout, pids where the scripts put them:
   `bash ~/.claude/jobs/2ea66c54/tmp/long-run-finish.sh` (long-run.sh with only the candidates path changed) → CPU **pid 358533**;
   `bash ~/.claude/jobs/2ea66c54/tmp/long-run-gpu-finish.sh 1 3` (the repo script's start line, candidates → `vol-1.finish.json`, pool
   3 GB, pid → `raw/solver-gpu.pid`) → GPU **pid 358537**; `long-run-gpu-finish.sh 2 3` (07:14:19, pid → `raw/solver-gpu2.pid`) →
   GPU **pid 359785**. `raw/solve.log`: `[358533] start: 1248 molecules in the queue … 8 threads` (07:14:00), `[358537] start: 1248
   molecules … gpu4pyscf … pool ≤ 3.0 GB` (07:14:01), `[359785] start: 1248 molecules …` (07:14:21). The repo's
   `tools/volumes/long-run-gpu.sh` is unchanged.

5. **How many GPU processes** (Josh: "push my GPU to 100%"; `/tmp/c3/gputhru.py` reads the rung lines of `raw/solve.log`;
   `nvidia-smi` sampled every 30 s into `/tmp/c3/nvsmi.csv`). The finish queue's top end, which `--largest-first` hands the GPU, is
   20-heavy-atom molecules of 136–150 AO at STO-3G and ≈ 460 AO at 6-31+G*, plus fumonisin B1 (the one half-climbed 50-atom ladder,
   GPU 1's since 07:14). Per-process rung seconds on matching rungs:

| rung (≈ nAO) | ONE process (history) | TWO processes (07:14–07:32) | THREE processes (07:32–07:47) |
|---|---|---|---|
| STO-6G (≈ 140) | — | icosane 182.6 s | 1-nonadecanol 258.9 s |
| STO-6G (≈ 310) | pipotiazine palmitate 475.9 s (06:35–06:43) | fumonisin B1 760.6 s | — |
| 6-31G (260) | — | icosane 52.6 s | 1-nonadecanol 77.3 s |
| 6-31G\* (371–384) | testosterone 66.9 s, capsaicin 54.0 s (G-BUILD) | icosane 79.4 s | 1-nonadecanol 115.3 s |
| 6-31+G\* (455–472) | testosterone 124.7 s, capsaicin 98.8 s (G-BUILD) | icosane 119.6 s | 1-nonadecanol 208.4 s |

   One → two: each process slows 1.0–1.6× (most on STO-6G, whose contracted integrals saturate the card's FP64), so two give
   **≈ 1.25–1.8× one** — kept. Two → three: each process slows a further 1.4–1.7×, so three give ≈ 3/1.5 = the same as two (no
   measurable gain), while taking two more of the 12 CPU threads the CPU solver (the finish queue's real workhorse: 33 molecules/h
   against the GPUs' 4–8/h) shares. The card held 100 % utilisation in every sample from 07:18 on, memory 2.1–4.2 GB of 8 GB with two
   and 2.7–4.8 GB with three — no memory limit was near. **The third was dropped**: `raw/solver-gpu3.pid` → pid 376303 (age 14:59), TERM at
   07:53:16 the moment it finished tetra-tert-butyltetrahedrane's STO-6G — 502.7 s for 136 AO, against icosane's 182.6 s for 142 AO
   with two processes, the last word on the card's saturation — exited 07:53:17 (no rung lost; the pid file keeps the dead pid).
   Running now: CPU pid 358533 (`raw/solver.pid`), GPU pids 358537 (`raw/solver-gpu.pid`) and 359785 (`raw/solver-gpu2.pid`), all on
   the 1,248-molecule finish queue. At 08:19 it stood at 46 done of 1,248 — ≈ 42 molecules an hour from the three, so roughly 29 hours
   for the other 1,202 (STATUS's own clock, one solver's rate: 43.6 h).

## 6 · THE SHELF, PACKED

`node tools/volumes/pack.mjs --candidates ~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.candidates.json --themes
tools/volumes/themes.json --incremental`, from this worktree (generator `2e4e6e1`) into `~/Documents/LAMBDAWAVES-VOLUMES/dist`, niced,
07:14 → 08:15 (1 h 01 min wall, 2.7 GB peak RSS; packer v3, so every pilot v2 file was packed again). No thumbnails rendered (28 rows
carry the pilot's existing pictures, copied by the packer); no `--archive`. The pilot's single-volume shelf is kept as
`~/Documents/LAMBDAWAVES-VOLUMES/volumes.before-c3.json`; `dist/volumes.json` is now the themed shelf of five.

| volume | title | molecules | bytes (.lwm) |
|---|---|---|---|
| VOL. I (`vol-1`) | The Classics | 564 | 200,971,048 (191.7 MiB) |
| VOL. II (`vol-2`) | Medicine | 406 | 378,907,176 (361.4 MiB) |
| VOL. III (`vol-3`) | Life and Food | 796 | 534,088,576 (509.4 MiB) |
| VOL. IV (`vol-4`) | Materials, Atmosphere and Fuel | 363 | 186,797,920 (178.1 MiB) |
| VOL. V (`vol-5`) | The Rest | 497 | 302,373,928 (288.4 MiB) |
| **total** | | **2,626** | **1,603,138,648 (1.60 GB)** |

4,454 not packed: 4,452 not finished (the two queues) and helium and argon, whose rungs the solver now finishes (the He/Ar fix)
but whose records the app's `validateRecord` refuses ("ground" — a closed-shell atom in a minimal basis has no LUMO; C2 said the fix
belongs to the packer and `lab/latex-state.js`: a `lab/` change, so it is named here, not made). Four 6-31+G\* rungs were REFUSED by the
packer's own orthonormality gate (max|CᵀSC − I| > 1e-8 in f64: diphenylacetylene 1.05e-7, biphenylene 5.8e-8, tricyclobutabenzene
2.0e-8, o-carborane 1.3e-8 — near-dependent diffuse sets); those molecules ship their other five rungs with that one recorded as
failed. The run named no molecule packed at moved atoms and none from `meta.candidate` alone. `vol-1/m/` keeps 19 pilot `.lwm`
files no row reaches any more (aspirin, caffeine … now in other volumes), as S-BUILD foresaw; the packer lists and does not delete
them. Spot check of the indexes: nitroglycerin `medicine · explosive · painkiller · heart` (VOL. II), HFC-134a `refrigerant ·
atmosphere · gas` and ethylene carbonate `battery · solvent · material · ring` (VOL. IV), ascorbic acid and citric acid in VOL. III.

## THE COMMANDS FOR LATER

**When the finish queue is done** (`raw/solve.log` shows `end: …` from both solvers, or `python tools/volumes/solve.py --candidates
~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.finish.json --status` says remaining 0), pack again — from a checkout that has this
branch's `pack.mjs` and `themes.json`:

```
node tools/volumes/pack.mjs --candidates ~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.candidates.json \
     --themes tools/volumes/themes.json --incremental
```

(only the new and changed molecules are packed again; `--archive` adds the `.lwv` per volume when the shelf goes to Drive.)

**Stopping** any solver: `kill -TERM $(cat ~/Documents/LAMBDAWAVES-VOLUMES/raw/solver.pid)` (and `solver-gpu.pid`, `solver-gpu2.pid`);
check it exited — until this branch's `solve.py` fix is merged and the solvers restarted, a TERM that lands while a molecule starts is
swallowed, and a second TERM is needed.

**Rent-A-GPU day** (the 3,232 molecules of `vol-1.gpu-day.json`). On THIS machine, the original scripts already do it: they run the full
catalogue, and the solver skips every finished molecule, so their queue IS the Rent-A-GPU list once the finish queue is done:

```
bash ~/.claude/jobs/2ea66c54/tmp/long-run.sh                                                   # the CPU, 8 threads
cd /home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/optimization-2026-09-24 && bash tools/volumes/long-run-gpu.sh start   # the GPU
```

On a RENTED card: copy `~/Documents/LAMBDAWAVES-VOLUMES/{catalogue/vol-1.gpu-day.json,bse}` and the repo there, then
`python tools/volumes/solve.py --candidates vol-1.gpu-day.json --gpu --gpu-memory <GB> --largest-first --threads <n>` (several processes
share one queue by its flock, as here), and bring each finished `raw/<id>/` back into `~/Documents/LAMBDAWAVES-VOLUMES/raw/` (the
solver's rungs are self-describing; the packer reads them as they are). Its one-solver estimate at this machine's rate: ≈ 46.5 days
of one CPU solver (cost 9.28 M units × 0.433 s); a rented card's own rate decides the real figure.

**The geometry upgrade, whenever compute allows** (still one command; it now moves the 206 rows the solver had not reached, ≈ 5.4
solver-hours by their measured rungs): stop the solvers as above, then

```
LW_OFFLINE=1 python -I tools/volumes/catalogue/build.py --refresh-geometry --out=~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.candidates.next.json
python -I tools/volumes/catalogue/check.py ~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.candidates.next.json --against ~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.candidates.json --allow-moved
python -I tools/volumes/catalogue/guards.py --pin ~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.candidates.next.json
# then rename vol-1.{candidates,stats,excluded}.next.json over vol-1.*.json, re-run queues.py, restart
```

## LEFT FOR JOSH

1. **Step 3 of the theme rule** — `amino acid` / `sugar` / `fat` go to Life only without a drug-class word (28 structural "amino
   acid" drugs stay in Medicine). Literal instead: delete that step's `none` in `themes.json`.
2. **Approved textbook molecules** (12: chloroform, chloroethane, guanidine, phenolphthalein, piperazine …) now sit in Medicine
   ("approved drugs stay in Medicine"); to keep textbook molecules in The Classics first, swap steps 4 and 5.
3. **Materials before the rest of Life** — 29 rows (limonene, α-pinene, the bile acids ChEBI calls `material`, farnesane …) moved Life
   → Materials; swap steps 6 and 7 to send them back.
4. **Glucose is in Medicine**: ChEBI's roles give it painkiller, heart and mind, and the four-tag cap cuts `sugar` (the cap already cut
   food words before this row: food 22, sugar 7, vitamin 4, flavour 3 rows). Ranking the food words above the drug classes in
   `TAG_RANK` would shelve those by food; it changes ≈ 40 rows' tags — your call.
5. **`explosive` is a short list** (11). Also in the catalogue, untagged: styphnic acid, DDNP, hexanitrobenzene,
   hexanitrodiphenylamine, erythritol tetranitrate — add their InChIKeys to `curated.EXPLOSIVES` if you want them.
6. **`solve.py`'s Stop** — fixed on this branch (`class Stop(BaseException)`); the running solvers use the integration checkout's copy,
   so it takes a merge and a restart. 5-aminolevulinic acid's meta carries `detectedGroup: null` from the swallowed TERM (its .lwm says
   no point group; it is C1 anyway).
7. **The geometry upgrade is held**, not dropped: 41 molecules are already on PubChem's conformer (solved there), 206 wait for
   compute (the command above).
8. **Helium and argon** solve now but do not pack (no LUMO → `validateRecord` refuses the record): a `lab/` question (library.js /
   latex-state.js), not changed here.
9. **Two catalogue quirks the shelf made visible** (C2's data, not touched here): `methamphetamine-2` (the racemate's InChIKey,
   nominated by Wikidata alone, tagged only `aromatic`) passed the controlled-substance screen because only the d-isomer is an approved
   medicine and the racemate is not on `ILLICIT_NAMES` — it is packed in VOL. V; sulfuric acid carries `painkiller · heart · mind`
   (six ChEMBL nominations, most likely sulfate salts that the build's parent step folds onto the acid —
   not traced here) and sits in Medicine. Say if either should change.
10. Unchanged from C2: PubChem descriptions for 1,101 CIDs only (a calm online re-run of `build.py` fills them; it moves no id and no
   solved geometry); thumbnails not rendered; no `--archive`; nothing pushed — `it006-yeses` waits for the integrator.
