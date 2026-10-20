# H3 ONE HEADING — build (stage chain, Opus, 2026-10-20)

Josh: "Remove text that says 'System' and instead let it all be under 'Hamiltonian'."

## What changed
- `lab/windows/spectrum.js :36` — the SYSTEM stepper is built with `aria: 'SYSTEM'` instead of `label: 'SYSTEM'`.
  The kit's stepper (`lab/mir/controls/stepper.js :41`) makes its `.k-lbl` only when `o.label` is given, so no
  empty label box and no gap: the stepper is now the HAMILTONIAN group's first row. Screen readers still hear
  "SYSTEM" (the row's aria-label, `:57`). `ui.hamSeg`, its `set(id)`, the ids and the per-row hover tips are untouched.
- `lab/sw.js` — `node tests/pwa.test.mjs --write` (spectrum.js' hash).
- `tests/molecular-names.browser-test.mjs :62` — re-aimed: it found the stepper by its `.k-lbl` text SYSTEM; it now
  finds it by the row's `aria-label="SYSTEM"` (a bare `.mol-step` query hits the state-preset stepper first).

## Tests
- `./test.sh node` — green (pwa red only until `--write`, as expected).
- `molecular-names.browser-test` (9621/5621) — 6/6 PASS.
- `latex-copy.browser-test` — RED at `:147` (`mol.hidden`/`folded` under MOLECULES), and RED identically at the
  base `d830f01` (checked by detaching to the base): pre-existing, not this row.
- Visual: `H3-shots/after.jpg` — HAMILTONIAN heading, then ‹ HYDROGEN › directly, then WELL RADIUS · Z · μ.

## CLAUDE.md sentence for Sos
SPECTRUM's ‹ SYSTEM › stepper carries no visible word (013 H3): it is the HAMILTONIAN group's first row, its
aria-label stays SYSTEM and `ui.hamSeg` keeps its name and ids.

## Open questions for Josh
- none.
