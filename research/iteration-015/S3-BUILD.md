# S3 THE PRESET SEAT (iteration 015, chain S)

Josh: "Move the preset thing to the bottom between the 140 picker and above the Hamiltonian. It is not included in the expander."

## What changed
- `lab/spectrum.js` `createSpectrum`: the ‹ PRESET › row (`.sp-preset`, the kit's stepper in PALETTE's preset look) is re-seated after the 140
  picker (and the hidden live formula `.sp-fx`), so SPECTRUM's body reads: ladder · head (DIALS · + MODE · fill · VISUALS) · the picker (when
  + MODE is lit) · ‹ PRESET › · HAMILTONIAN. `windows/spectrum.js`' reorder (the HAMILTONIAN group is moved last) is untouched, so the row
  sits outside the group — and outside S1's fold when it lands.
- Nothing else moved: `ui.presetSel`, the stepper's RELOAD and every road that writes `.value` are the same object.

## Files
`lab/spectrum.js`, `lab/sw.js` (pwa --write).

## Measured
`node tools/s-shots.mjs spectrum`: body order `ladder · sp-head · picker · sp-preset · grp` (it was `ladder · sp-preset · sp-head · picker · grp`).

## Tests
`./test.sh node` (with S4); `tests/stage-text.browser-test.mjs` and `tests/history.browser-test.mjs` find the stepper by `.sp-preset
.mir-step-name`, which holds (run after S4, see S4-BUILD.md).

## Shot
`s-shots/S3-preset-seat.jpg` — SPECTRUM floated, + MODE lit: the picker, then ‹ 1s + 2p_z dipole ›, then HAMILTONIAN.

## CLAUDE.md sentence (after THE WINDOWS' SPECTRUM line, or under MINIMIZED BY DEFAULT)
Since iteration 015 S3 SPECTRUM's ‹ PRESET › sits under the 140 picker and above the HAMILTONIAN, outside its fold.

## Calls for Josh
None.
