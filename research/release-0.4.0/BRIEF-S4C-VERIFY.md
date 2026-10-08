# λWAVES 0.4.0 · S4c VERIFY — BRIEF for the kernel verifier (fresh eyes)

**Written by Claude Sos (the fallback Major Agent), 2026-10-08, the way `BRIEF-S0-VERIFY.md` and `BRIEF-S2-VERIFY.md` were.**
PLAN.md §6 row S4 ends S4c with "a verifier (the kernel)": the molecular density kernel gained a tier (cap 128), a second kind
(the orbital-only path, no tile), a new record kind (C₆₀'s frontier) and a new signed field (VALENCE). You are a FRESH Opus with
no part in the build; the builder's report (`research/release-0.4.0/S4c-BUILD.md`, `S4C-HANDOFF.md`, REPORT waves 178–182,
MEASURE.md §5) is a claim list to test, not evidence. The contract is `BRIEF-S4-LIBRARY.md` §0 and §S4c and PLAN §10 N1/N3. You
fix nothing; you report, with the reproducing command for every finding, ranked BLOCKER / SHOULD / NOTE.

## 0 · Laws

Never edit `lab/`. Never `pkill -f`; kill by pid. Git only inside your worktree; never push. Your ports: `LW_PORT=8761`,
`GD_PORT=5229` (`python3 tools/gate/server.py <your-root> 8761 &`). The GPU is shared: one browser suite at a time, a 4 s pause
between browser sessions (`EADDRINUSE` on your GD port is a harness flake); a timing red or a red digest lock is re-run ALONE
before it is believed (the RTX 3070's one-ulp fault in power state P5; the builder re-took its timing table on an idle GPU).
Never run a recursive grep or find over `research/`. Your worktree starts at the merged tree the integrator names (S4b and S4c
both in); `git reset --hard <sha>` first, then `git log --oneline -1`. The pre-S4c tree is `b5eed68`.

## 1 · The locks and the gates, once

- **The ≤ 64 tiers are byte-identical**, which is the whole point of the tier: `node tools/perf/digest-lock.mjs --check --query
  gastab=0` (1004 values; since `cbc7b0f` the tool compares only the states its fixture holds and NAMES the ones it skipped — read
  that list and judge it) and `… --fixture research/release-0.4.0/measure/digest-lock-s4a.json` (1148: benzene, lysine and
  lysine's HOMO opened from their records). Both GREEN with 0 readback and 0 record-byte differences. A red is re-run alone; a
  second red is a BLOCKER whatever the report says. Also prove the claim another way: `git diff b5eed68 HEAD -- lab/field.js` and
  show that the WGSL text of the 16/40/64 tiers did not change (the builder says "byte-identical to the pre-S4c source").
- `bash test.sh node`; `node tools/orbital-library.mjs --check` (the whole catalogue, byte-exact); `node tools/new-project.mjs
  --check`; `node tests/pwa.test.mjs` without `--write`.
- Browser, one at a time on your ports: `chem`, `molecular-names`, `render-regressions`, `current`, `export3d`, `library`,
  `field-molecule`, `orbitals`, plus the builder's harnesses `LW_PORT=8761 GD_PORT=5229 node tools/perf/s4c-kernel.mjs firefox
  chromium` and `node tools/perf/s4c-c60-app.mjs`. Record suite · count · verdict.

## 2 · The density wall (C1) — scenes

- The adapter is asked for `maxComputeWorkgroupStorageSize: 32768` only where it reports ≥ 32768; `MOL_CAPS` reads `[16, 40, 64,
  128]`; the 3070 builds the 128 tier on 64 lanes. **The refused device:** force the refusal (the builder's harness has a
  `requestDevice` wrap through a page `<script>`; read how, then do it your own way too) and show the 32-lane build draws the same
  texels (the builder's digests: `8ce0fdcb` Firefox, `ff0a77c2` Chromium — reproduce or explain).
- **An 87-AO and a 120-AO record reconstruct:** the fixtures `tests/fixtures/record-tryptophan.json` (87) and
  `record-C20H20.json` (120), and S4b's own tryptophan and C₂₀H₂₀ records if merged; against the generator's f64 density at
  sampled voxels, within rgba16float precision (the builder: 4.56e-4 and 3.69e-4 of max for the densities, 4.81e-4 / 5.56e-4 for
  the HOMOs). Sample your own voxels, not only the harness's 256.
- The density through the cap-128 tile at 96³ costs 19–48 ms a dispatch (once per change, never per frame): time it; confirm no
  per-frame road reaches it (no TDHF past the cap).

## 3 · The orbital-only path (C2) and C₆₀ (C3)

- `ORB_WGSL` draws an ORBITAL past 64 AOs with no tile, shells screened at 1e-10: at 96³ C₆₀'s HOMO 13.67 ms plain / 3.62 ms
  screened (Chromium), 15.01 / 4.08 (Firefox) — re-time; the screened path must equal the plain path to rgba16float precision at
  sampled voxels (screening at 1e-10 is not a visible change).
- **C₆₀'s HOMO and LUMO draw from the record** (`lab/library/a8166591….json` (145 KB; `9520cedc…` at the builder's tip), caps orbitals only, DRAFT geometry
  stated): open it from MOLECULES' LIBRARY row with 0 solver calls (count them); the HOMO and LUMO against PySCF's own orbital at
  voxel centres (`~/bin/scipython -I tools/perf/c60-voxels.py`): the builder says 4.0e-4–5.6e-4 of max; spectrum, states and TDHF
  refused with a sentence; an unsorted column fails validation (`tests/library.test.mjs` §5c).
- The frontier record's eight columns are the census dump's (`research/release-0.4.0/library-census/c60-frontier.json`) bit for
  bit; its geometry source says DRAFT.

## 4 · VALENCE (C4) and the small things (C5)

- `D − 2 Σ_core C_c C_cᵀ` in f64, drawn by the density kind; the core count is S1's `coreCount(atoms)`; lysine's maximum density
  47.8 → 1.60 (reproduce); water's VALENCE integrates to 8 electrons (Tr(D_val S) = N − 2·core); the switch sits in the ORBITAL
  dial's seat while DENSITY is the view and the VIEW row is no wider (measure the row); it is a PROJECT key or a PREFERENCE —
  read `docs/STATE-SCOPES.md` and `tests/new-project.test.mjs`'s sets and check the builder put it in one scope and said which.
- The stale Firefox-timestamp comments are gone (grep `field.js` for "zeroed"); the device report pair (18.2 → 19.1 fps, governor
  nominal 64³ both) — run your own at HEAD once and compare within the report's noise.
- `lab/mir/**` and `lab/fonts/**` byte-identical to `b5eed68`; `lab/*.js` 36,137 → 36,225 (+88) and the shader lines 471 → 496 as
  reported — recount; no version bump, tag, CHANGELOG, deploy or push in the log; REPORT waves 178–182 present, numbers measured.

## 5 · Report

`research/release-0.4.0/S4c-VERIFY.md`: the lock and gate table (suite · count · verdict), then findings ranked BLOCKER / SHOULD
/ NOTE with reproducing commands and the law each breaks, then "the kernel as merged stands (fit for the 0.4.0-alpha cut): YES /
NO (because)". Commit it on your branch. Kill your gate server by pid. Final message (Josh's rule, every hand-off): the verdict
line, BLOCKER count, SHOULD count, the file path, your worktree path, your branch, the commit, the tests you ran with counts and
which were re-run alone, blockers with the exact command and error text, and the exact next step.

## 6 · Harness

Compound shell with variables, loops, heredocs or backticks may be refused: plain commands, scripts as files under `.tmp/`. If
`Write` refuses `.md`, write through a Python script under `.tmp/`. If a command is refused, reshape it; never retry verbatim.
