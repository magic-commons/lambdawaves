# C7 · MORE MOLECULES (iteration 006)

Branch `it006-more` (from `214db92`), tools only — `tools/volumes/catalogue/{build,common,pubchem,curated,check,queues,report}.py`, and
`research/iteration-004/CAT-BUILD.md` regenerated. No `lab/` change. Data stays outside git in `~/Documents/LAMBDAWAVES-VOLUMES/`.
Nothing pushed. Every build and fetch ran niced 18 with `OMP_NUM_THREADS=1`.

Josh, 2026-10-18: *"add in whatever molecules you can. If it's not allowed by the safeguards then exclude it. But I do want to try
to get as many molecules in."* — and earlier, of the refused molecules: *"That's only the human's relation with the molecule that's
the problem."* (C6, the controlled-substance screen's removal, was never committed on `it006-return`; it is part of this row.)

## 1 · THE RULES NOW (`build.py`, ITERATION 006 C7 in its head)

1. **Recognisability is no longer a filter.** The rows refused as "too obscure — only Wikidata, in < 12 Wikipedias" and "only ChEBI
   (3-star), in no Wikipedia" are admitted: every named compound a nomination brings with a structure PubChem resolves.
   `recognisable()` now only ORDERS the rows: in each tier (the app's own · the WHO essential medicines · the rest) the recognisable
   rows come first, then the obscure ones; within each, the most recognisable and then the smallest first. Every row of the previous
   file is recognisable, so their order among themselves is unchanged.
2. **The use-word gate is gone.** A row no longer has to earn a use word (the C5 membership test, `use_words()`, refused 425). It must
   earn a STRUCTURE word (`structure_tags.py`) — a row that earns none is refused "no structure tag". The use words are still computed
   for the λWAVES blurb's last fallback (unchanged for every old row); a row with none falls back to its first structure word
   ("X: an amide.").
3. **A salt or a mixture is its neutral parent.** A Wikidata article's compound that PubChem counts as several covalent units is now
   folded onto its parent — the largest organic (else covalent) fragment, neutralised, looked up by InChIKey, else PubChem's own
   `cids_type=parent` — as every other source's nominations always were, and merged by InChIKey (so sodium chloride, magnesium sulfate
   and sodium acetate add nothing new: their parents are rows already). Such a nomination is marked `c7_salt`: it gives its parent no
   use word and no blurb, its Wikidata weapon use screens the skeleton exactly as the salt's own entry did before (so the CWC screen
   refuses what it refused), and a row that exists only through salts is named by PubChem's title of the parent (the salt's name only
   when that title is systematic and the row is new).
4. **A closed-shell ion keeps its charge.** An ion with no neutral parent — a quaternary ammonium, a flavylium, a thiazolium, a
   Wikidata article about the ion itself — is a row with its `charge` (RHF holds it; the app already carries NH₄⁺, OH⁻, CN⁻, B₁₂H₁₂²⁻).
   The electron count is Σ Z − charge (`check.py` always counted so); an xTB relaxation is told the charge.
5. **The heavy-atom cap is 70** (was 50; `build.py` `MAX_HEAVY`, `check.py`). `queues.py` puts every unfinished row of more than 20
   heavy atoms on the Rent-A-GPU-day queue, so the rows of 51–70 are only ever there.
6. **The controlled-substance screen is removed** (Josh's decision): the illicit-names list, ChEBI's hallucinogen and opioid roles,
   Wikidata's recreational-drug uses and C4's controlled-medicine ATC groups (`curated.ILLICIT_NAMES`, `curated.CONTROLLED_ATC`, gone)
   refuse nothing. A row an earlier file carried comes back under the id that file gave it (`--older`, below).
   **The CWC screen is unchanged**: the Annex names, the five class patterns, the Wikidata weapon uses, the skeleton rule and its
   approved-drug exemption, word for word.
7. **Hand skips lifted** (`curated.C7_LIFTED`; the old reasons stay written beside each item): the cap (glycyrrhizin, crocin,
   chlorophyll a, triolein …), the salts (potassium bromate, monosodium glutamate …), the cations (choline, berberine, sanguinarine …)
   and muscimol and ibotenic acid. Every other skip stands (past krypton, open shells, mixtures, polymers, duplicates, the CWC skips).
8. **Still out:** the CWC screen's rows, an element past krypton (no basis), an odd electron count or a radical (the ladder is RHF),
   an isotopically labelled compound, a row with no geometry or no structure tag.

**GUARD (b), EARLIER IDS** (`--older`, default every `vol-1.candidates.<tag>.json` beside the live file, newest first): a row the
previous file does not carry but an earlier file did takes that file's id, when no later file and no solve in `raw/` gave it to another
molecule, and every earlier id is reserved against new slugs.

**THE LOCAL GEOMETRIES IN WORKERS** (`--jobs=N`, default 2): the rows with no standing cached geometry are built before the main pass —
PubChem's conformer taken as it is in the build's own process, the rest (RDKit ETKDGv3 + MMFF94, GFN2-xTB) by N forked workers, one
pipe each, one thread each at the build's niceness; the rule is the old `build_geometry`, split into `cached_geometry` /
`compute_geometry` / `remember_geometry`. An RDKit embedding has no time bound of its own (the first pass sat 30 minutes on one
molecule), so a build that runs past 20 minutes is stopped — its worker killed and replaced — and cached as "no 3-D geometry".

**PUBCHEM, CACHE FIRST** (`pubchem.py`): every batched call answers each CID (or InChIKey) from every cached answer of its URL and
knows which CIDs were already settled (in a 200 answer's request, or a single CID's 404); only the CIDs never asked go out, in new
batches of ≤ 100 (properties, InChIKeys) or 50 (conformers, synonyms, descriptions). `common.py`: ≤ 2.2 requests/s (0.46 s apart),
`X-Throttling-Control` obeyed, and a Red or Black **service** status — or Black anywhere — turns the run cache-only at once (the
answer in hand is kept): every later request answers "no answer", and `pubchem.PENDING` names what was never asked, so a row whose
record, parent or 3-D conformer is pending is held back as "pending" (never built on a local geometry in place of a conformer not yet
asked for). `--fetch-only` asks for everything the passing rows want and stops, writing nothing, so the asking can be spread over
PubChem's calm minutes before the one real build. A description 404 is never trusted (below).

## CHECKPOINT — 2026-10-18 19:31 (usage pause; the row is NOT finished)

**Done.** The code above (committed with this note). PubChem fetched, cache-first, one fetcher at a time, ≤ 2.2 req/s:
phase 1 (`--no-geometry`, 218 requests, stopped by PubChem's own status Black 1680 % at ~15:31) and `--fetch-only` passes 1–3
(1,410 · 249 · 329 requests; Black 693 % at 15:54, 527 % at 16:10, 263 % at 18:11). Cached now: every record, every parent,
26,398/29,465 3-D conformers, synonyms for 29,549 CIDs. **Pending: descriptions only** (≈ 25,659 CIDs) — the description service
answered "No description found" even for aspirin (CID 2244) at 18:1x, so its 404s are untrusted; a calm run fills them (blurbs only).
Filter counts (from the cache): 29,553 rows pass the filters (was 7,505), 2,957 exclusions before geometry.

**Running (safe to leave or kill: it writes only the geometry cache and /tmp scratch).** The local-geometry pass, pid 901502
(+ 4 forked workers), log `/tmp/c7/geo4.log`: `LW_OFFLINE=1 OMP_NUM_THREADS=1 nice -n 18 …/venv/bin/python -I
tools/volumes/catalogue/build.py --jobs=4 --geometry-minutes=6 --out=/tmp/c7/geo/vol-1.candidates.geo.json` — 1,400/2,092 hard builds
at 19:31 (15 failed, 9 of them stopped past 6 min; 17,719 PubChem conformers already taken). Every result goes to
`catalogue/cache/geometry.json` (saved every 25 hard builds), so a rerun of the same command resumes where it stopped.
**Untouched:** the live catalogue, the queues, the solvers (pids 358533, 358537, 359785 still on the old 1,248-row finish queue),
`dist/`.

**Remains, in order** (from this worktree, `V=~/Documents/LAMBDAWAVES-VOLUMES`, `PY=~/.local/share/lw-volumes/venv/bin/python`):
1. let the geometry pass end (or rerun the command above until "local geometries: … 0 to build");
2. the one real build, cache-only: `LW_OFFLINE=1 OMP_NUM_THREADS=1 nice -n 18 $PY -I tools/volumes/catalogue/build.py --jobs=4
   --out=$V/catalogue/vol-1.candidates.next.json > $V/catalogue/build-c7.log 2>&1` (minutes, all from cache);
3. stop the three solvers (read raw/solver.pid, solver-gpu.pid, solver-gpu2.pid; `ps -o etime=`; `kill -TERM`; second TERM after
   60 s; wait), `$PY -I tools/volumes/catalogue/guards.py --pin $V/catalogue/vol-1.candidates.next.json`, then
   `$PY -I tools/volumes/catalogue/check.py $V/catalogue/vol-1.candidates.next.json --against $V/catalogue/vol-1.candidates.json` → 0;
4. swap: hard-link `vol-1.{candidates,stats,excluded}.json` → `*.before-c7.json`, rename the `.next` files over them, gate again;
5. queues: hard-link `vol-1.{finish,gpu-day}.json` → `*.before-c7.json`, `$PY -I tools/volumes/catalogue/queues.py` (prints both sizes
   and the three-solver estimate);
6. restart from the integration checkout: `bash ~/.claude/jobs/2ea66c54/tmp/long-run-finish.sh`, `…/long-run-gpu-finish.sh 1 3`,
   `… 2 3`; confirm three "start: N molecules" lines in raw/solve.log;
7. `python report.py > research/iteration-004/CAT-BUILD.md`; `/tmp/c7/returned.py` on the live file (the ten C4 refusals back under
   their ids); repack `node tools/volumes/pack.mjs --candidates $V/catalogue/vol-1.candidates.json --volume vol-1 --numeral I --title
   'All the Molecules' --blurb '…(C5's)…' --sole --incremental`; finish this note; commit.

## 2 · RESUMED 2026-10-19: THE GEOMETRY, THE ONE BUILD, THE GATE — STOPPED BEFORE THE SWAP

The coordinator's brief for the resume: steps 1 and 2 only, then `guards.py --pin` and the gate; **no swap, no queue file, no
solver signal, no `dist/`** (Claude Yan had merged this branch's tool rules into `yan-c` and repacked VOL. I overnight). Josh
decides whether the solvers restart on the wider queue.

**The geometry.** The 19:31 pass had in fact run to its end before the pause took it (`/tmp/c7/geo4.log`: 2,092/2,092 hard builds
in 6,932 s, 31 failed, 19 of them stopped past 6 minutes), so every geometry was already in `cache/geometry.json`.

**One fix found by the scratch build's own guard** (`build.py`, `HAND_CIDS`): ferrocene's and bis(benzene)chromium's ids went missing.
PubChem draws a sandwich as a metal cation and two ring anions (three units), so C7's new rule folded ferrocene's Wikidata article onto
a "parent" — and the hand-built nomination of the same record with it. No nomination of a hand-built molecule's record is folded now;
both rows are back at their solved atoms, and diborane was never touched.

**The build** (`LW_OFFLINE=1 … build.py --jobs=4 --geometry-minutes=6 --out=…/vol-1.candidates.next.json`, 79 s from the cache, log
`catalogue/build-c7.log`): **29,509 molecules** (live 7,070) · 3,003 exclusions · guards 0 complaints. `guards.py --pin`: 0 rows.
`check.py vol-1.candidates.next.json --against vol-1.candidates.json` (`catalogue/check-c7.log`): **29509 rows checked · 0
complaints** — 7070/7070 previous ids with the same InChIKey · 3497/3497 rows solved in `raw/` at exactly their solved atoms (adrenaline
and menthol, the pilot's, are carried by no row, as before). The live files are untouched; `.next` waits beside them.

**New rows: 22,439**, by why the previous build refused them:

| why | rows |
|---|---|
| recognisability no longer a filter: only ChEBI, in no Wikipedia | 10,703 |
| recognisability no longer a filter: only Wikidata, in < 12 Wikipedias | 10,311 |
| a salt or a mixture, as its neutral parent | 516 |
| the use-word gate is gone | 425 |
| heavy 51–70 (the cap rose from 50) | 205 |
| a closed-shell ion, kept with its charge | 158 |
| returned: the controlled-substance screen is removed | 91 |
| new this run (PubChem answered a name, a key or a parent) | 29 |
| a hand skip lifted | 1 |

(heavy 51–70 rows in all: 1,129 — most came in as obscure rows.) The ten C4 refusals are back **under their old ids**: methamphetamine-2,
levomethamphetamine, methorphan, levofenfluramine, arketamine, tilidine and vinbarbital-2 (all seven solved in `raw/`, the two
methamphetamine solves untouched), esmodafinil, acetylmethadol, pentazocine. Of the 93 rows the controlled-substance screen refused in
C5, 91 are back; 25I-NBOMe and 2C-I contain iodine (past krypton).

**Still out: 3,003**, by reason: an element past krypton 1,140 · past 70 heavy atoms 732 · isotopically labelled 332 · **the CWC screen
250** (unchanged rules; 29 skeletons carry a signal, as in C4/C5 — the screen now also meets the obscure rows) · odd electron count 175
· PubChem has no compound under the name 125 · not one molecule (a salt whose neutral parent PubChem does not carry) 83 · a radical
53 · no 3-D geometry 46 (19 of them stopped past 6 minutes) · hand skips that stand 26 · structure does not parse 17 · PubChem record
with no InChIKey/formula 9 · open shell in the app 7 · no heavy atom 3 · disabled in the app 2 · 2 more. No row lacks a structure tag.

Heavy atoms: ≤10 4,101 · 11–20 8,721 · 21–30 9,860 · 31–40 4,143 · 41–50 1,555 · 51–60 707 · 61–70 422. Geometry: PubChem 3-D
conformer 26,064 · RDKit ETKDGv3 + MMFF94 2,789 · GFN2-xTB 568 · app pinned 88. **PubChem pending: descriptions only, 25,616 CIDs**
(blurbs fall back to ChEBI's definitions and λWAVES' own lines; a calm run fills them — PubChem went Black four times on 10-18).

**THE QUEUES, DRY** (`/tmp/c7/queues_dry.py`: queues.py's own `state()` and split on `.next`, writing nothing): finished 3,494 ·
**finish 9,338** (8,984 not in today's 1,242-row `vol-1.finish.json`; cost 1,602,087 units) · **gpu-day 16,677** (13,447 new; 1,128 of
51–70 heavy atoms; cost 96,385,819 units). Time for the finish queue: one solver at STATUS's 0.974 s/unit ≈ 18.1 days; **the three
solvers at what they finished in the last 8 h** (10,375 units/h · 30.1 molecules/h) **≈ 6.4 days by cost, ≈ 12.9 days by count** (the
count clock is the truer for small molecules).

**What is left (after Josh's word):** stop the three solvers (TERM the recorded pids), `guards.py --pin` + `check.py` again on `.next`,
hard-link `vol-1.{candidates,stats,excluded}.json` → `*.before-c7.json` and rename the `.next` files in, hard-link the queue files →
`*.before-c7.json`, `queues.py`, restart (`long-run-finish.sh`, `long-run-gpu-finish.sh 1 3` / `2 3`), `report.py` →
`research/iteration-004/CAT-BUILD.md`, repack `--sole --incremental`. (If the solvers finish more molecules first, the pin and the gate
before the swap carry them.)


## 3 · SWAPPED IN 2026-10-21 13:37 (Claude Sos's script, run by Josh's hand; Josh: "We can do as much as we can, I might be out for the day")

Last night's `vol-1.finish.json` (1,248) emptied at 23:38 under the zero-token babysitter (0 failed; VOL. I packed to 3,832 molecules with every picture).
The swap followed §2's "what is left" to the letter, as `~/.claude/jobs/8497d75b/tmp/c7/swap-c7.sh` (Josh ran it with `!`, because the auto-mode
classifier refused Sos every write under `LAMBDAWAVES-VOLUMES/`; log `babysit/swap-c7.log`): `guards.py --pin` 0 rows · `check.py .next --against live`
29,509 rows, 0 complaints (7070/7070 ids, 3848/3848 solved rows at their atoms; adrenaline and menthol carried by no row, as before) · hard links
`vol-1.{candidates,stats,excluded}.before-c7.json` and the `.next` files renamed in · the gate again, live against before-c7: 0 complaints · the queue
files hard-linked to `*.before-c7.json` · `queues.py --window-hours=24`: **finish 8,984** (cost 1,471,744 units) · **gpu-day 16,677** (96,385,819 units;
Rent-A-GPU day) · `solve.py --status` so STATUS.json reads the new queue. `report.py` → `research/iteration-004/CAT-BUILD.md` (29,509).
The three solvers (Yan's start scripts, same pid files) are up since 13:37 under `babysit/babysit-c7.sh` (log `babysit-c7.log`; at remaining 0 →
`finish-c7.sh`: pack → the missing pictures → pack → the note `DATABASE/CLAUDE/LAMBDAWAVES NIGHT-SHIFT 2026-10-21 (babysitter, c7).md`); a
`finish-c7.sh --now` pack + pictures runs beside them from 13:37 so the already-solved rows reach VOL. I today. The pause and resume lines are in
`raw/RESUME-NIGHT.md`. queues.py's clock for the finish queue on the three together: 14.3 days by cost, 32 by count (last night's 24 h were the
costliest tail; the small-molecule clock is the truer).
