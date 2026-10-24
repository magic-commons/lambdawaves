# M3 ATOMIC MODE — built (chain M, iteration 015, 2026-10-23)

## What
- Josh: "In atomic mode, it should show options to pick 'hyrogen' and the periodic table 'atoms' … show every single possible 140 … The labels
  should be easier as it shouldn't show the 'z' number but rather just the orbital name like 3p or 5d."
- THE ATOMIC deck's head carries HYDROGEN | ATOMS (`.mm-amode`, a radiogroup in `.mm-opts` beside SHOW LABELS, shown on ATOMIC only). It is the
  Picker's PREFERENCE `atomic` in `lambdawaves.q0.picker`, default `atoms`.
- ATOMS is the periodic table as it was. Its tile label is the symbol alone: `.mm-z` is gone from the DOM and from skin.css.
- HYDROGEN is THE 140. It is a second `deck()` in the ATOMIC section with a tile per hydrogen.js BASIS label, in SPECTRUM's order (n ≤ 6's 91,
  then n = 7's 49). It is paged like the molecular deck: same sizing and arrows, built on its first showing.
  - The label is the state's name in STIX: `3p` with the m as a real subscript (`.mm-hl`). It shows under SHOW LABELS as the symbols do.
  - The picture is the pure orbital in the look in use (M2's `orb:<nl>_<m>`).
  - The caption under a hover is the name (`3p₋₁`) over `n 3 · ℓ 1 · m −1`.
- A PRESS (`goHydrogen`):
  - The Picker closes, and MOLECULES goes off.
  - SPECTRUM's system becomes HYDROGEN (`app.w.switchHamiltonian` + `ui.hamSeg`, goAtom's road).
  - The one label is populated through `loadPreset` as a hand's preset: `{ id: 'h:n:l:m', label: '3p₋₁', modes: [one], visual }`, `{ hand: true }`.
    That gives one history row (the ring's own commit) and THE FADE with the name, when ANNOUNCE › preset is on.
  - The field opens in the look the tile showed: view density, phase or imag. An m = 0 state is held imaginary under Im ψ, as its picture is.
  - The window is 4πn², the state's own period.
- `lab/shell/controller.js` `loadPreset(id, opt)` takes a preset OBJECT as well as an id. That is two lines; `ui.presetSel` shows the dash for an
  unknown id.
- `deck()` exposes its `wrap` and `foot`, so the HYDROGEN deck hides whole under ATOMS.

## Files
`lab/picker.js`, `lab/skin.css` (`.mm-hl`, `.mm-amode`, `.mm-table[hidden]`, `.mm-z` retired, `.mm-opts` gap), `lab/shell/controller.js`
(loadPreset's object road), `tools/tile-check.mjs` (THE 140's pictures), `tools/m-shots.mjs` (atomic, hydrogen).

## Tests
- `.tmp/m3-press.mjs` (driver), with MOLECULES on first: a press on 3p₁ gives the Picker closed, hamiltonian `hydrogen`, populated `[8]`
  (= h:3:1:1), MOLECULES off, `reg.preset` `h:3:1:1`, and no console error.
- `library` GREEN · `start` GREEN 3/3 · `menubar` GREEN.
- `tools/tile-check.mjs` reads 118/118 elements, and THE 140's pictures as rendered (the full count is in the pictures commit).
- Shot `m-shots/M3-atomic.jpg`: HYDROGEN's first page (left) and ATOMS with symbols only (right).

## CLAUDE.md sentence
"ATOMIC MODE (iteration 015 M3): the ATOMIC deck's HYDROGEN | ATOMS (PREF `atomic`). ATOMS is the periodic table labelled by its symbols alone (no
Z). HYDROGEN is THE 140 in BASIS order, paged, each labelled `3p₋₁` in STIX. A press opens HYDROGEN (MOLECULES off, system hydrogen) with that one
label, through `loadPreset` (which takes a preset object since 015) as a hand's preset, in the look the tile showed."

## Calls for Josh
- PLAN call 5 stands: 140 state tiles (`3p₋₁`), not 28 subshell tiles.
- On a 1600 px screen with both racks, THE 140 pages five across (as the molecular deck does: the deck keeps a rack's width clear each side).
