# C2 · THE FULL CATALOGUE (iteration 006)

Branch `it006-catalogue` (from `264ea0e`), tools only — `tools/volumes/catalogue/` (build.py · check.py · guards.py, new · common.py ·
report.py). Data stays outside git in `~/Documents/LAMBDAWAVES-VOLUMES/`. Nothing pushed. The catalogue's own report, regenerated from
the full file by `report.py`, is `research/iteration-004/CAT-BUILD.md` (it replaces the 950-row WIP report there); this note is the
row's story: the guards, the run, the swap, the solvers, and Josh's calls.

**`vol-1.candidates.json` now holds 7,080 molecules** (it held 950). The solvers run on it: queue 7,080, 1,118 done at 21:58.

## THE TWO GUARDS (`guards.py`, used by `build.py` and `check.py`)

The solver names a molecule's raw directory by the candidate's id and starts a molecule over whenever its atoms move (`meta.json`'s
`atomsBohr` ≠ the candidate's). A rebuilt catalogue therefore must never move a solved molecule by accident, nor re-point an id.

**(a) A SOLVED MOLECULE KEEPS ITS GEOMETRY** — the cheap, reversible default of Josh's open question. A row whose id has a converged
rung under `raw/<id>/` keeps the exact atoms it was solved at: `meta.json`'s `candidate.atomsAng`, accepted only when it reproduces the
solver's own `atomsBohr` bit for bit (`float(Å) × ANGSTROM == atomsBohr`, the solver's test) and only for the same InChIKey — even when
PubChem's conformer has since arrived. `build.py --refresh-geometry` lifts it; the log then names every solved row that moved, because the
solver will solve each again from STO-3G. `guards.py --pin FILE` re-applies (a) against `raw/` as it is at the moment of the swap (solvers
stopped), so a molecule that got its first rung between the build and the stop is pinned too.

**(b) IDS ARE STABLE.** A row keeps the id the previous candidates file gave its InChIKey (the app's own: its app id); a new row whose
InChIKey was already solved under some id in `raw/` takes that id; every other new row takes its slug, suffixed (`-2`, `-3` …) past every id
ever given — the previous file's, `raw/`'s and this run's. A collision moves the new row, never an old one.

**THE PROOF** (`check.py FILE --against PREV`): every id of PREV present naming the same InChIKey (a previous row a safety screen now refuses
would be named, not passed); no id pointing at a `raw/<id>/` that holds another molecule's solve; every row solved in `raw/` at exactly its
solved atoms; every id a file name the solver accepts. On the file now in place, at the second swap (21:58):

```
check.py vol-1.candidates.next.json --against vol-1.candidates.950.json
  7080 rows checked · 0 complaints
  guards: 950/950 previous ids present with the same InChIKey · 1120/1120 rows solved in raw/ at exactly their solved atoms
          · 3 solved ids in raw/ the file does not carry: adrenaline, limonene, menthol
check.py vol-1.candidates.next.json --against vol-1.candidates.json   (the first swapped-in 7,080)
  7080 rows checked · 0 complaints · 7080/7080 previous ids present with the same InChIKey · 1120/1120 at their solved atoms
```

The gate earned its place twice. Run against the old 950 file itself it found two molecules the pilot had solved at PubChem's conformer
under the same ids (capsaicin, beta-carotene: 6/6 rungs each, β-carotene's 6-31+G* alone 870 s) that the 950 file would have made the solver
redo — the new file carries their solved atoms. And the first full build, read against `raw/` an hour later, failed with 17 complaints
("a solved row moved"): the CPU had solved 17 more molecules meanwhile; `guards.py --pin` put them back and the gate passed.

The ids, against the 950: 862 rows by the previous file's InChIKey · 88 the app's own · 8 new rows took the id the pilot had solved them
under (glucose, styrene, acetone, vanillin, serotonin, cholesterol, naphthalene, testosterone — their solves are reused) · 6,000 new
rows their own slug · 101 suffixed past another new row · 21 suffixed past an old id. The pilot's `adrenaline` (= the catalogue's
`epinephrine`), `limonene` and `menthol` (other stereo-InChIKeys than the catalogue's rows) stay in `raw/`, unclaimed.

## THE RUN

- **One fetcher.** `pgrep -af "catalogue|pubchem|pilot"` showed only the two solvers (their command lines name the candidates file; they
  never fetch). PubChem answered 200, `X-Throttling-Control` all Green. The ATC fix was already in `cache/chembl/approved.json`
  (it carries `atcForms`; aspirin's codes no longer include the combinations), so `fetch_chembl.py` was not re-run.
- **Online, paced** (`common.py`, ≤ 2.2 req/s, throttling header obeyed): names and properties were cached from the first run; 308 parents
  asked (474 of 486 resolved — the 950 run had 295, offline), the two screens' names resolved (64 CWC, 51 controlled, against 1 and 0
  offline), 7,018 / 7,424 PubChem 3-D conformers in 150 batches, synonyms for 7,501 CIDs.
- **PubChem refused at 20:10, in the descriptions round**: `X-Throttling-Control … Service status: Black (333%)` — PubChem as a whole
  overloaded (this machine's own request count: Green 12%). The new circuit-breaker in `common.py` (`Blocked`: a blacklist answer, a
  Black state, or three requests in a row that exhaust their tries) stopped the run instead of retrying. Nothing was asked again: the file
  was finished from the cache (`LW_OFFLINE=1`). Descriptions exist for 1,101 CIDs; they are a nicety (a ChEBI-sourced description is a
  blurb fallback — 4,688 blurbs are ChEBI's own definitions anyway). A calm re-run of `build.py` fills in the rest and moves no id and no
  solved geometry. `build.py` now does this by itself: a refusal during the synonyms or descriptions round switches the run to the cache
  and records it in `stats.pubchem`. Note for that re-run: `pubchem.descriptions` falls back to one request per CID when a 50-CID batch
  answers 404 (20 of 61 batches did) — about one request per CID.
- **Geometry**: the first full build spent 69 minutes in the geometry stage (its xTB relaxations included), the two cache-only
  re-builds 46 and 49 — and nearly all of that was seven molecules no method will embed, which spend many minutes of ETKDG each, every
  run. Failures are now cached (retried only when a conformer arrives or with `--refresh-geometry`), and an xTB relaxation that started
  from PubChem's conformer is no longer redone: **a cache-only build now takes 23 seconds.**
- **Names**: resolving the salts' parents online brought the salts' names onto three old rows (benzylpenicillin → "Benzathine
  Benzylpenicillin", diphenhydramine → "Dimenhydrinate", sulfadiazine → "Silver Sulfadiazine"). The name rule now puts the compound's own
  curated or Wikidata name first, a salt's name next (so a dye stays "Methyl Orange", not PubChem's systematic title), then PubChem's title
  and ChEMBL's name. Nine names changed against the first swapped file, all to the compound's own name (also Pyrithione, Diisopropylamine
  for "Lithium Diisopropylamide", Norbornene, Thiosulfuric Acid, Stearic Acid, Lactobionic Acid); against the 950 only `Mesna` differs.
- Logs: `catalogue/build-online.log` (the fetching run, ends in the Black traceback), `build-cacheonly-1.log`, `build-cacheonly-2.log`,
  `build.log` (the file in place).

## THE COUNTS (the file in place; `CAT-BUILD.md` has every table)

**7,080 molecules** · 27,316 nominations refused, each with its reason in `vol-1.excluded.json` · 7,512 passed the filters, 7,505 got a
geometry (7 would not embed), 425 were dropped because no word of the vocabulary fits them.

| tag | rows | tag | rows | tag | rows | tag | rows |
|---|---|---|---|---|---|---|---|
| aromatic | 4019 | steroid | 327 | toxin | 183 | plastic | 88 |
| medicine | 2439 | life | 297 | colour | 175 | atmosphere | 72 |
| acid | 1438 | food | 294 | alkaloid | 165 | fuel | 65 |
| natural | 1303 | pollutant | 250 | flavour | 143 | antiviral | 61 |
| ring | 1275 | amino acid | 223 | scent | 135 | allergy | 59 |
| classic | 626 | painkiller | 218 | cage | 128 | vitamin | 48 |
| pesticide | 579 | hormone | 205 | solvent | 123 | anaesthetic | 44 |
| cancer | 444 | fat | 192 | sugar | 123 | sweetener | 32 |
| heart | 371 | material | 185 | metal | 108 | neurotransmitter | 13 |
| mind | 347 | antibiotic | 185 | gas | 106 | nucleobase | 11 |

Tags per row: 1 · 1,355 — 2 · 2,604 — 3 · 1,948 — 4 · 1,173.

| heavy atoms | ≤10 | 11–20 | 21–30 | 31–40 | 41–50 | >50 |
|---|---|---|---|---|---|---|
| rows | 1530 | 2308 | 2165 | 816 | 260 | 1 (C60, the app's own) |

| geometry | PubChem 3-D conformer | RDKit ETKDGv3 + MMFF94 | GFN2-xTB | the app's pinned |
|---|---|---|---|---|
| rows | 6354 | 450 | 188 | 88 |

Sources (a row counts once per source): PubChem 7,076 · Wikidata 6,553 · ChEBI 3,868 · ChEMBL 1,940 · curated 1,554 · WHO EML 320 ·
λWAVES 88. Blurbs: ChEBI's definition 4,688 · λWAVES' own 2,392.

Exclusions, the large ones: too obscure (only Wikidata, < 12 Wikipedias) 12,910 · too obscure (only ChEBI, no Wikipedia) 11,150 · not one
molecule 1,258 · no plain tag 425 · past 50 heavy atoms 371 · an ion with no neutral parent 176 · no PubChem compound for the name 122 ·
**CWC screen 119** (64 Annex names resolved) · beyond krypton 116 (iodine) and more · isotopically labelled 84 · **controlled-substance
screen 83** (51 names resolved) · open shells 86. No row of the 950 was refused by the newly resolved screens.

## THE SWAP AND THE RESTART

`solve.py` loads its queue once, at start (`queue()` in `main()`), so the file swap needs a stop and a restart. Both solvers run from the
`optimization-2026-09-24` worktree, whose `solve.py` and `long-run-gpu.sh` are byte-identical to this branch's.

1. **CPU (THE LONG SOLVE)**, pid 3509635 from `raw/solver.pid`: stopped by `/tmp/c2swap/stop-after-rung.sh`, which waits for the pid's next
   finished rung and sends TERM at once — after `cimetidine 6-31+g-star` at 21:01:45; it exited at 21:01:46 ("ticlopidine: stopped by
   SIGTERM — no rung was half-written"). `guards.py --pin` (17 rows), `check.py` (0 complaints), the 950 copied to
   `vol-1.candidates.950.json` (and its stats / excluded), the new file `mv`'d over the old at 21:01:54, and the CPU restarted with its own
   script (`bash ~/.claude/jobs/2ea66c54/tmp/long-run.sh`, `--threads 8 --max-memory 12000`): pid 4104838, "start: 7080 molecules in the
   queue" at 21:02:11, no "atoms moved" in its log.
2. **The name re-build** went in the same way: stopped after `pentalene 6-31g-star` at 21:57:54, pin (0 rows), the gate against both the
   first 7,080 and the 950 (0 complaints each), the first file kept as `vol-1.candidates.swap1.json`, `mv`, restarted at 21:58:30 —
   **pid 4154914**, "start: 7080 molecules in the queue", no "atoms moved".
3. **GPU**, pid 3780323 from `raw/solver-gpu.pid`, has been in one rung since 18:50: C60 at 6-31+G* (1,140 AO; its 6-31G* took 360 s,
   its STO-6G 2,603 s and 115 cycles). The new queue, `--largest-first`, would hand it C60 first again, so stopping it now would only throw
   that rung away. It was left to finish, and a detached handover (`setsid /tmp/c2swap/gpu-handover.sh`, log `raw/gpu-handover.log`)
   waits for that pid's next rung END (converged, FAILED, stopped, ERROR), sends TERM at once, waits for the exit and restarts it with
   `long-run-gpu.sh start` from the same checkout — on the file in place by then. A 24-hour deadline bounds the wait. Until then the GPU
   touches nothing but C60, whose atoms are the same in both files. **At 22:00 the rung was still in flight (3 h 10 min) and the handover
   armed** (pid 4105313). To see where it stands: `cat ~/Documents/LAMBDAWAVES-VOLUMES/raw/gpu-handover.log` and
   `bash tools/volumes/long-run-gpu.sh status`; once it has fired, the new GPU pid is in `raw/solver-gpu.pid` and its log line reads
   "start: 7080 molecules in the queue".

Never `pkill`: only the recorded pids were signalled.

## THE SOLVERS' PROJECTED TIME

`raw/STATUS.json` at 21:58:34: **queue 7,080 · done 1,118 · failed 1 · remaining 5,961 · `etaSeconds` 5,621,291 ≈ 65 days** for one
solver at 8 threads (its rate, 0.568 s per cost unit Σ(nAO/100)⁴, is measured over the molecules finished — mostly small ones, so it is a
rough clock). **With both solvers, roughly half: about a month**, and likely less, since the GPU works the costliest end where it is 1.7–2.7×
the CPU (G-BUILD.md).

## FOUND ON THE WAY (not this row's code)

- **Helium and argon error in `solve.py` every pass**: a closed-shell atom in a minimal basis has no virtual orbital (He STO-3G: 1 AO,
  nocc 1; Ar: 9 AO, nocc 9), so `gapEh = mo_energy[nocc] − mo_energy[nocc − 1]` raises IndexError after the rung's npz is written and before
  `meta.json` records it. Harmless (0.0 s each, logged as ERROR) but they never finish; the fix belongs to the solver and the packer (a
  "no LUMO" story — `lab/latex-state.js` also expects a gap).
- `1-3-5-hexatriyne` failed its 6-31+G* rung (DIIS 100, level shift 150, then "second order (newton) (0 cycles)" — newton ran no cycle).
- **The packer reads `meta.candidate`**, which the solver writes only when it solves a rung: the 1,118 finished molecules carry the
  candidate row they were solved from (for the 950, the offline run's: no synonyms, tags from before the ATC fix). Before packing, the
  pack step wants a refresh of `meta.candidate` from the catalogue (same id, same atoms) — a few lines, for the pack row.

## JOSH'S CALLS

1. **Should a solved molecule keep its geometry?** Default now: yes (guard a). **277 solved rows** sit on a local geometry (RDKit
   ETKDGv3 + MMFF94, or xTB) while PubChem's own conformer is now available. Upgrading them is `build.py --refresh-geometry`, the gate,
   the swap — and those 277 are solved again: about **5.5 solver-hours** (their measured rung seconds), small beside the month-long queue.
   Say the word and it is one command; the guard keeps everything else in place.
2. **CAT's proposed extra tags** — not applied; the file uses PLAN.md's forty words only. With the full file the medicine words would
   hold: `eye` 134 · `lung` 62 (R03 44, R05 18) · `skin` 130 · `stomach` 78 · `diabetes` 33 · `parasite` 53 · `immune` 31, and outside
   medicine `explosive`, `refrigerant`, `battery` (no counts — they need a list, not an ATC group). 28 rows carry `medicine` and nothing
   else.
3. **`themes.json`'s first-match rule** shelves a finished molecule on the FIRST theme whose words it carries, so a medicine that is also a
   natural product or a food lands in Medicine. Over the 7,080: **Medicine 2,550** · Life and Food 1,852 · The Rest 1,131 · Materials,
   Atmosphere and Fuel 889 · The Classics 658 (372 rows carry both a Medicine word and a Life word and go to Medicine). Keep first-match,
   reorder the themes, or give each row a primary theme — Josh's call; nothing changed here.
