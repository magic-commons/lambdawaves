# Iteration 005 · P3 — THE ERROR FIELD (brief)

Branch `it005-error` from the BASE in the launch message (A THE ROOM merged). Gate server `LW_PORT=9621 GD_PORT=5721`. No push. Never edit
`lab/mir/**` or `lab/fonts/**`. Josh's dial: the feature, no new test files, existing gates, one light check. Sources: the papers' decision
memo (`~/Documents/OBSIDIAN/LAMB of WAVES/PUBLICATIONS & DRAFTING/DRAFTS/CLAUDE COLLECTION REVIEW — 2026-10-12/DECISION MEMO.md` §3.1 and §4:
"native error fields for the display grid" is what the evidence could not show; the one-sided truncation law ρ̂ ≤ ρ measured on this device) and
Sol-6's PRACTICAL UPGRADE SYNTHESIS §3 (accuracy that guides the readout). Read first in the tree: `tests/helpers/field-law.mjs` (FIELD_LAW —
the certified constants; `f16`, `ulp16`, `toF16`), `tests/field-law.browser-test.mjs` (HOW the volume is read back and compared to the CPU
closed form — the `LIB` it evaluates in the page; reuse its road, do not invent a second), `lab/field.js` ≈ 1441–1560 (`readPixels`,
`sampleVoxel(i, j, k)` → one voxel's (re, im) as f16 and its centre, `fieldDigest()` — the whole cache read back; all "never on the frame path"),
`lab/shell/facade.js` ≈ 228 (`__LW.field.sampleVoxel`), `lab/meters.js` lines 17–18 (the FLOOR readout: STATIC, the field law's constants —
this row makes it LIVE), `lab/hydrogen.js` `psiAt(re, im, x, y, z, indices)`, `lab/qho.js` `qhoPsiAt`, `lab/separable.js` `psiAt`,
`lab/molecular-field.js` `evaluator` (the CPU f64 density of a molecule), `lab/windows/settings-card.js` ≈ 123 (the GRID seg).

## The rows
1. **One readback, one comparison.** A function in `lab/field.js` beside `fieldDigest` — `errorField()` — reads the WHOLE ψ texture back once
   (the digest's road) and compares every voxel to the exact value at its centre: hydrogen's `psiAt` (the register's coefficients), the
   oscillator's `qhoPsiAt`, SEPARABLE's `psiAt`, CENTRAL's numerical radial (if its CPU evaluator exists; else "no closed form" and the row
   stands down for it); for a molecule, ρ̂ = re² + im² against `molecular-field.js`' f64 density on a 4 × 4 × 4 probe of voxel centres (the whole
   grid is too slow on the CPU for a big molecule — say so). It returns { N, half, t, rms, p998, worst, relToMax, mode (toward zero / to nearest /
   neither — the ledger the test keeps), rhoMax, ms } in the FIELD_LAW's own metrics so the number is the test's number. Never on the frame path:
   called on a press or a GRID change only.
2. **METERS: GRID ERROR.** The FLOOR readout becomes two lines: the certified constants (as now, labelled CERTIFIED · <the field-law commit>)
   and the live reading (MEASURED · 64³ · RMS 2.3e-6 · worst 1.7e-4 of ρmax · toward zero · 41 ms), a MEASURE press on the tile (the kit's
   readout takes a click; or a small trig beside it — one control, not a window) and an automatic re-measure when GRID changes while METERS is
   open. For a molecule the line says PROBE 64 voxels. While the field is a kicked molecule (time-dependent D) the reading is of the frame it
   caught — say so in the sub.
3. **The honest grammar.** `lab/status.js` already classifies EXACT · NUMERICAL · UNCHECKED; the measured error does not change the word, it
   is the number beside it — do not touch status.js. The `__LW.field` facade gains `errorField` (re-capture `research/release-0.5.2/lw-facade.json`
   with `tests/lw-facade.browser-test.mjs --write` and say the diff).
4. **If `lab/field.js` moves** (it will, by one function): THE LOCK is this row's law — run `LW_PORT=9621 GD_PORT=5721 node
   tools/perf/digest-lock.mjs --check --query gastab=0` and the same with `--fixture research/release-0.4.0/measure/digest-lock-s4a.json` on
   your gate server: both 0/0 or stop and say which texel. A readback function cannot move a texel; if the lock reads red, something else did.

## Checks, then the note
`node tests/pwa.test.mjs --write` · `./test.sh node` 0 · rack-deps 0 · new-project in step · the two locks · `node tests/field-law.browser-test.mjs`
once (its numbers and your tile's must agree for the same state and grid — print both) · one browser pass: 1s + 2p_z at 64³ MEASURE; GRID to 96³
(the tile re-measures); MOLECULES › H₂O MEASURE (PROBE). One screenshot ≤ 300 KB. Lab count before and after (base in the launch message).

Write `research/iteration-005/P3-BUILD.md` (the seats, the measured table at 64³ and 96³ for hydrogen and the oscillator and the H₂O probe, the
rounding mode found, the time of a readback, what the brief got wrong, the delta), commit on `it005-error` with a `Co-Authored-By:` line for your
model, report the tip sha — never push. The RTX and the CPU are shared; one browser suite at a time; stop only your own pids.
