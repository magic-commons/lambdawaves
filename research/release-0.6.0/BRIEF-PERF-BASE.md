# BRIEF · THE `tools/perf` BASE PROFILE OF v0.5.4-alpha (THE ENGINE PLAN D.0 — "benchmarks first", A10; one Sonnet 5.5 @ high builder; measures, edits no code)

**Why:** every 0.6.x row is judged against THE STUTTER LAW (|Δ median| ≤ 3.536 ms/s on the pair) and the picture's floor. Those need a BASE taken on the tree the
rows will move, on a quiet rig, with the instruments the tree already has — nothing new is written but the profile.

**Read first, whole:** `tools/perf/main-thread.mjs` (header: the warm-up, the pair recipe, the load rule), `tools/perf/device-report.js` (the 30 s play scene; PAIR C's
FINGERPRINT row and its `only:'fingerprint'` digests), `research/release-0.5.2/R1-BUILD.md` §6 (the pair as run — A-boot · B-boot · A-D1 · B-D1 per round, 5 rounds, the
same-tree floor FIRST), `research/release-0.5.2/MEASURE.md` §1 and §6, `research/release-0.5.4/P-V-REPORT.md` §G-M (the pair the verifier just ran: your numbers must
sit beside its), `research/release-0.5.4/PAIR-B-BUILD.md` §4 (the field law's readings), `research/release-0.6.0/PLAN.md` D.0 and D.1's first rows (what will move:
the equalizer kernel, the BEAT grid, M11a's routes), `docs/NOTES-FOR-AGENTS.md`.

## The row (`research/release-0.6.0/measure/perf-base-0.5.4/` + `research/release-0.6.0/PERF-BASE.md`)
1. **The same-tree floor:** `tools/perf/main-thread.mjs --runs 5` on the v0.5.4-alpha tree (`git rev-parse v0.5.4-alpha`), boot scene, quiet rig (load < 4, no other
   browser; `rigfree.mjs` first) — median, spread, the five samples; the raw JSON beside it.
2. **The scenes, 5 runs each, interleaved as the pair recipe does but on ONE tree:** (a) the boot scene; (b) the MOLECULES scene (H₂O · ORBITAL · HOMO · AUTO-ROTATE · STAGE
   TEXT, R1's D1, `--sweep 10` if the tool has it); (c) a STATES scene (a TRANSITION A/B playing); (d) a packet scene (the hydrogen 1s+2pz drive or kick, as the tree
   enters it through the facade). Per scene: main-thread ms/s median (spread), script/layout/style attribution medians, presents per 30 s, held frames.
3. **The picture's floor and the device:** the device report once with `only:'fingerprint'` (adapter, driver, browser, features, limits, the two 64³ digests); the field
   law's four readings per molecule copied from PAIR-B-BUILD §4 (not re-measured) with the 96³ reading beside the 64³ one.
4. **The sizes:** `cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l`; the precache in `lab/sw.js`; `lab/library.json` bytes; `node tools/rack-deps.mjs --classes --no-write`'s
   two counts; boot-to-`__LW.ready` ms (median of 5 fresh pages, from the device report or main-thread's own log).
5. **`PERF-BASE.md`:** one table per item above, the git sha, the date, the rig line (RTX 3070 · Firefox/Chromium versions · load), and the rule each 0.6.x row is held to
   (the pair's 3.536 ms/s; the floor's metric). Nothing judged — a base states numbers.

## Laws
No code edit anywhere (`lab/`, `tools/`, `tests/` untouched; if an instrument lacks a scene, measure what it has and say so). Your gate server on 9113 by pid (`LW_PORT=9113
GD_PORT=5583`); `rigfree.mjs` before every run; one browser at a time; load < 4 read from `/proc/loadavg` before each run (a loaded rig is waited out, never measured through);
never pipe a gate into `head`; kill by pid, never `pkill -f`. One commit ("PERF BASE 0.5.4: …"); NO push. Hand back ≤ 200 words: the medians per scene, the floor run's spread,
the fingerprint's digests, the sizes, pids killed.
