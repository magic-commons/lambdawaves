# B3b TILE · ORACLES · DEMO — build note (0.6.0 "Beat Equalizer")

Branch `b3b-tile-oracles-demo` from `8dc9a68` (yan-c). Commits `86ae3d5` FLOOR · `df364c1` ORACLES · `3ff176b` CHORD.

## What landed
1. **METERS · FLOOR** (`lab/meters.js:17–18`, the `dataset.m` loop `:21`). One static `readout`, written once at creation:
   label `FLOOR  f16 · the picture's own precision`, value `1 f16 ulp · toward zero`, sub
   `hydrogen 3e-6 RMS · 2e-4 worst voxel · density 2e-3 worst`. Each number is `toExponential(0)` of `FIELD_LAW` (`lab/status.js`, imported), not typed.
   It sits after LAST TIER and before the wide STATUS row. No test counts METERS' tiles, so no suite changed.
2. **The 6-31+G\* oracles** (0.5.4 §J-4 N4). `tools/orbital-library.mjs:524–531`: each live-only `oracles[id]` gains a nested
   `'6-31+g-star': { what, energy }` for the 19 converged molecules in `tests/fixtures/oracles/6-31+g-star-v1.json`. `what` and `energy` stay flat
   for STO-3G readers. `lab/chemview.js:603` `tell()` now passes `row ? null : basis === 'sto-3g' ? P.oracle : (P.oracle && P.oracle[basis]) || null`.
   **Key deviation:** the brief named the key `'6-31+g*'`, but the app's basis id is `'6-31+g-star'` (`BASIS_FILES`, chemview's `bSeg`).
   `P.oracle[basis]` only resolves under the id, so the id is the key.
   Water in 6-31+G\* (node, through `statusOf` with chemview's expression) now reads
   `DENSITY · NUMERICAL · energy agrees with PySCF to 2e-13 Eh · picture good to 0.2 % of ρmax`; before, it read UNCHECKED.
   `tests/library.test.mjs:161–162`, one case: the 19 nested energies equal the fixture's, and exactly 19 oracles carry one.
   `lab/library.json` grew from 107,154 B to 110,161 B (+3,007 B).
3. **The CHORD demo**: `lab/demos/chord.lambdawaves.json` (18,196 B) and `lab/demos/covers/chord.jpg` (17,080 B).
   Content: hydrogen 2s + 3p₀ + 4d₀ at unit amplitude, VIEW density (`mat.view` 0), RATE 40, WAVE DANCER's `obs` (yaw stored mod 2π), no routes.
   The beats at RATE 40 are 2↔3 0.442 Hz, 3↔4 0.155 Hz and 2↔4 0.597 Hz; T = 2π·288 a.u. = 45.2 s.
   It was made by the app's own road with a scratch driver in `.tmp/` (not committed): `?starter=home` (NEW), `api.clear()`, `api.paintModes([1,7,20])`,
   `clock.setRate(40)`, `setView('density')`, `restore()` with WAVE DANCER's obs, the notebook text, `projects.save('DEMOS/CHORD')` and `exportText`.
   `quality` and `camera` were then dropped, as no other demo carries them.
   Opening it by the DEMOS press and re-serializing matches the file on every PROJECT key: populated [1,7,20], rate 40, hydrogen, MOLECULES off,
   notebook open. The only differences are the WORKSPACE `layout.at`/`nb`, the device's `quality`/`camera`, `modulationBases`
   (written only by projectSnapshot), and the modulation model's optional fields, which re-serialize as `null`.
   STARTERS row `['chord', 'CHORD']` (`lab/project-store.js:158`, on the same line). The name is uppercase like its six siblings, not "Chord".
   The "six demos" comments in `lab/main.js` now say seven.

## Lines
`cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l`: 28,101 → **28,106 (+5)**: meters.js +3, and sw.js +2 precache rows (the demo and its cover).
chemview.js, project-store.js and main.js add 0. Precache: 370 files, 6.81 MiB → 372 files, 6.85 MiB.

## Commands run
- `node tests/pwa.test.mjs --write` after each feature: PASS (372 files, 6.85 MiB, 1.15 MiB under the ceiling).
- `node tests/status.test.mjs` GREEN; `node tests/library.test.mjs` GREEN; `node tests/molecule-head.test.mjs` GREEN (38 records).
  `node tests/project-formats.test.mjs` GREEN (it seeds every STARTER, CHORD included).
- `node tools/orbital-library.mjs --only H2O` wrote `lab/library.json` without re-solving rows. `--check --only H2O`: in step.
  Full `node tools/orbital-library.mjs --check` (re-solves all 38, 18 min 20 s): in step, 38 records, the gate passes every entry.
- `bash test.sh node`: exit 0. `node tools/new-project.mjs --check`: in step (16,117 B).
- `tests/opener.browser-test.mjs` (updated to seven covers, tests only): run 1 RED at scene 6, `.mir-opener-option[data-cover=water]`
  "covered by HTML", i.e. the suite's known headless-Firefox flake. Rerun alone: GREEN 7/7.
- `tests/molecule-demos.browser-test.mjs`: GREEN, 5 demos. Not extended: its list holds molecules with MOLECULES-owner assertions,
  and CHORD is hydrogen. The scratch open-and-diff above checked CHORD instead.
- `make-covers chord`: wrote the cover. Server on 9221 (own pid, stopped).

## Not done
- No `tests/catalogue.*`, no Rabi oracle test, no INFORMATIONAL sentences (E7/E8/E9 parts the BUILD-PLAN dropped or gave to other rows).
- `molecule-demos` was not extended (see above).
