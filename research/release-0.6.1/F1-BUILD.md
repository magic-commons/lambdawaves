# F1 THE FACTOR ROAD + FROZEN-CORE COLUMNS + BUCKY — build note (0.6.1 "Factor Road")

Branch `f1-factor-road` from `612b409` (yan-c). Commits `73f78eb` (1) record · `4c15d11` (2) kernel · `67ae8f7` (3) session + card · `19f6af8` (4) BUCKY · this note.

## What landed
1. **The record.** `tools/library/frontier.py --occupied` (`occupied()`, :35–51) re-runs the frontier dump's C₆₀ RHF (same geometry, vendored decimals,
   tolerances 1e-11 / 1e-8) on 12 threads and writes `research/release-0.4.0/library-census/c60-occupied.json` (1,651,756 B, mode `x`): columns 0…182
   (180 occupied + the LUMO set) in the app's AO order and normalisation, ε for all 300, and PySCF's own `GTOval_cart` values of 23 sampled columns
   (0, 9, …, 171, 179, 180, 182) at the frontier dump's 92 points. **E = −2244.018782476829 Eh** (dump −2244.0187824768127; Δ 1.6e-11), max |Δε| 3.9e-11,
   18 cycles (the dump took 20), **wall 239 s** on 12 threads (the dump: 805 s on 2). Column orthonormality CᵀSC − I: 1.1e-13.
   `tools/orbital-library.mjs` `buildFrontier` (:451–) reads it when present: `cols` 0…182, `orbitals.C` n × 183 f64, the energy and ε the re-run's,
   the 92-point check on the sampled columns (max |Δψ| **1.1e-16**, bound 1e-10), level spreads from ε (< 2e-10 Eh), caps unchanged. Record
   `c2cefcad…` 706,671 B (was 8 columns). `lab/library.js` needed no change: validateRecord admits any ascending `cols`, decodeRecord lays C out n × n.
   `tests/library.test.mjs` §5c (the one law that pinned the 8 columns) now pins cols 0…182 against the occupied dump.
2. **The kernel** (`lab/field.js`). `FACTOR_WGSL` (:309–326) DERIVED from ORB_WGSL by three `once` anchors: `mat` read as `array<vec4<f32>>`, a K-block
   loop around the screened shell loop, φ for 32 columns in `array<vec4<f32>, 8>`; ρ = 2 Σ φ², texel (√ρ, 0), `dens` = ρ. `mat` is row-major n × K
   (K padded to 32 with zero columns; K = `P.r0`, the unused MP member — the struct is unchanged), so each block reads 8 contiguous vec4, uniform
   across lanes. Kind 4, `FAC = ORB + 1` (:913), compiled lazily by `facReady()` (:1109, after `eqReady`'s pattern; bind groups via `molBindFor`,
   binding 7 `cut`). `molMatBuf` FIXED at `MOL_LIMITS.ao × MOL_LIMITS.cols × 4` = 589,824 B (:995; `cols: 192` :782). `setMoleculeMatrix(M, { kind:
   'factor' })` (:1620) takes { C, K }, `molRoad()` (:1141) returns FAC for kind 4 at any nAO; kind 4 is never refused for want of a χ tile.
   B was measured: 16 (4 vec4) 72 ms and 64 (16 vec4, spills) 223 ms at 96³ against 32's 40 ms; scalar `array<f32, 32>` took 110 ms.
3. **Session + card.** `PRODUCT_KINDS` gains `'factor'` (`lab/molecular-session.js:46`). `lab/chemview.js`: `factor()` (:360) — no D, and `cols` holds every
   occupied index; `views()` (:362) offers DENSITY on it, Δρ stays refused (no reference); `pushMatrix` publishes `{ kind: 'factor', matrix:
   factorCols() }` (:501); `factorCols()` (:536) — VALENCE is the columns k ≥ coreCount(atoms), exact; `summed()` (:542) on the card's status
   ("180 orbitals summed" / "120 valence orbitals summed · 60 core frozen") and as `statusOf`'s existing `label` in `tell()` (:614), so the STATUS
   reads `DENSITY · exact · 180 orbitals summed · NUMERICAL · energy is PySCF's own · picture good to 0.2 % of ρmax`; `capability().observables.density`
   true (:887). No new branch in `lab/status.js`. ORBITAL on C₆₀ unchanged (its dial now spans 1…183).
4. **BUCKY.** `lab/demos/bucky.lambdawaves.json` (made by the app: `?starter=benzene`, install C60, solve, VIEW density, notebook, `projects.save` +
   `exportText`, quality/camera dropped as CHORD did) + `covers/bucky.jpg` (make-covers, 21,147 B); STARTERS row `['bucky', 'BUCKY']`
   (`lab/project-store.js:159`, the record road in its comment); main.js comments say eight. On a fresh profile the DEMOS press fetched the record and
   landed on the factor density (status "180 orbitals summed · from its record (690 KB, downloaded)"); offline, the record road offers DOWNLOAD.

## Benzene through both roads (CDP smoke, headless Firefox, RTX 3070, 96³)
The record's tile density, then the same 21 occupied columns through `setMoleculeMatrix({ C, K: 21 }, { kind: 'factor' })`: max |Δ√ρ| = 9.5e-7
relative to max √ρ = 2.715 (3.5e-7; the scalar first draft read 1.1e-5 = one f16 ulp at a few voxels). ∫ρ (fieldDigest) 39.47556106 tile vs 39.47556106
factor; ρmax equal (7.37038). C₆₀ ∫ρ = 368.5 at 64³, 361.4 at 96³ (N_e 360; grid quadrature of cusps). No compile message from the factor module.

## The ms (a readout, not a gate): C₆₀ factor pass, `moleculeThroughput({ n: 40 })` — **12.5 ms at 64³, 40.1 ms at 96³**.

## Lines: `cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l` 28,289 → **28,339 (+50)** (field +34, chemview +11, sw.js +2, project-store +1, …).

## Commands run
- `~/bin/scipython -I tools/library/frontier.py --occupied` — wrote the dump, E above, 239 s.
- `node tools/orbital-library.mjs --only C60` — 1 record; `node tools/orbital-library.mjs --check` — in step, 38 records, the gate passes every entry.
- `node tests/library.test.mjs` GREEN; `node tests/pwa.test.mjs --write` after each commit's lab edits.
- `bash test.sh node` exit 0 (final run on `19f6af8`, 821 GREEN lines, no failing suite). `node tools/new-project.mjs --check` in step (16,117 B).
- Browser (gate server on 9251, GD 5351): `molecule-demos` GREEN · `library` GREEN · `opener` GREEN 7/7 (eight covers) · `lw-facade` GREEN (176 members, no new one).
- Scratch drivers in `.tmp/` (not committed): the benzene/C₆₀ smoke, the demo maker, the BUCKY open check.

## Not done / notes
- THE LOCK is the integrator's at the cut (benzene and lysine stay on the tile; nothing in their road changed).
- C₆₀'s I_h names stay energy-only (183 of 300 columns is not the whole C the projection needs). FLOW on a record with no D was already unguarded
  (`feedFlow` reads `sol.D`); a record never runs, so FLOW stays unreachable in practice — not touched.
- The record's blurb now speaks of the summed density; `stem.symmetry.why` says 183 columns.
