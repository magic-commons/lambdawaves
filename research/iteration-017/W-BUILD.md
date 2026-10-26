# W-BUILD: WAVE AND THE PICK (iteration 017, chain W; Claude Sos's Opus builder, 2026-10-26)

Branch `it017-w`, based on `yan-c` @ `1df96ef` (X merged). No new file in `lab/`, no new `app` key, no new import. `rack-deps --classes` HOLDS
(spectrum 25, material handed 11). THE LOCK was not touched: no change to `field.js`, any shader, or `render-exact.js`. `new-project --check` is in step (16098 B).

## W1 THE PICK LEAVES WAVE ALONE (F1, call 2 default)
- `lab/picker.js` `goHydrogen`: the label loads at phase 0 with `visual: { rate: 4, window: 4πn² }` and no `view`. The Picker's LOOK only styles the
  thumbnails now. `goAtom` and the element tiles never wrote WAVE (checked: `setElement` · `switchHamiltonian('atom')` · `fillValence`).
- `lab/shell/controller.js` `loadPreset`: the OBSERVABLE is set only when a preset names a `view`. Before this, a `visual` with no view forced
  DENSITY. Every built-in preset (`state.js`) and EMISSION's `view: 'density'` names its view, so they behave as before.
- Probe (Firefox, gate 9681): with WAVE set to Re ψ · SOLID, three picks from the HYDROGEN deck (2s₀, 2s₀, 1s₀) leave it at
  POSITION · Re ψ · SOLID · LIT · ISO. The state is (1, 0) at phase 0 and the window is 4πn². No console error.

## W2 THE GREYS (F2)
- `lab/windows/material.js`: `styleSync` now also runs `modeSync`. It greys single buttons with the kit's `:disabled` look and the hint carries the reason.
  Seats stay where they are.
  - Under a molecule (`app.state.chem.on`): SPACE's MOMENTUM φ(p) is greyed. Im ψ is greyed too unless the molecular volume is a complex orbital
    (`field.moleculeComplex`). Reason: `setMoleculeMatrix` writes a density, factor or Δρ as (√ρ, 0) and a real orbital as (ψ, 0), so Im ψ draws
    nothing. DENSITY, arg ψ and Re ψ all draw. The ORBITALS register publishes a complex ψ, so Im ψ wakes there.
  - Under hydrogen or an atom: BALLS · STICKS · ESP are greyed with the hint "a molecule’s view: switch MOLECULES on".
  - STURMIAN keeps its own grey on MOMENTUM (`applySturmian`). `modeSync` does not clear that grey while `sturm.P` is set.
- `lab/windows/molecules.js` `moleculeMode`: the 012 R3 hide of `ui.spaceSeg.root` is gone (the forced return to POSITION stays). It calls
  `ui.styleSync()`, and so does `molFieldView`, because the volume's kind changes with its model. When a molecule lets go while BALLS, STICKS or ESP
  is drawn, the style falls back to CLOUD (the shader already draws CLOUD there). The fallback runs in a microtask, so a restore that lands the
  molecule OFF and then ON keeps the style saved in its file.
- Probe: at boot BALLS · STICKS · ESP are greyed. With MOLECULES on (H₂O) MOMENTUM and Im ψ are greyed, and SPACE is visible. ESP → OFF gives
  style 0 (CLOUD), and the Im ψ hint is cleared.
- Pictures: `W-shots/w2-wave-molecule-before.jpg` (SPACE hidden, every observable live) · `W-shots/w2-wave-molecule-after.jpg`.

## W3 THE 140 GRID (SPECTRUM's register picker) under each system
Probe: real WebDriver mouse strokes on three neighbouring chips. Each step is LEFT press · RIGHT press · LEFT drag across 3 · RIGHT drag across 3.
Counts are shown as chips on / `reg.populated()`.

| system (‹ SYSTEM ›) | operator | HAMILTONIAN rows | press · right · drag · right-drag | ok |
|---|---|---|---|---|
| HYDROGEN | hydrogen | μ · SCALE | 2 → 3 → 2 → 5 → 2 | ✓ |
| OSCILLATOR | qho | box row | 2 → 3 → 2 → 5 → 2 | ✓ |
| BOX | well | box row | at BASE 40 → **40** → 40 → **41** → 40 (FAILED); fixed: 40 → 41 → 40 → 43 → 40 | ✓ |
| ATOM | atom | ATOM row | 40 → 41 → 40 → 43 → 40 | ✓ |
| CENTRAL | central | note: "its potential is drawn in CENTRAL" | same | ✓ |
| CENTRAL › QUARKONIUM | cornell | same note | same | ✓ |
| SEPARABLE | separable | note: "its potential is set in SEPARABLE" | same | ✓ |
| MOLECULES | (hydrogen kept) | SPECTRUM stands down (`moleculeMode` hides it) | n/a | — |
| LATTICE | (unchanged) | note: "LATTICE solves its own register in its window; this grid is the atom’s" | same | ✓ |

- **Bug found under BOX:** the enterBox packet leaves |c|² ≈ 1e-33 on most labels. `controller.js` `paintModes` and `toggleMode` tested
  `population > 0`, so they treated that leftover as populated: a press could not add the state and a drag added only the one exact zero.
  Both now use the grid's own rule, `reg.populated()` (|c|² > EPS_POP).
- **LATTICE / CENTRAL / SEPARABLE showed an empty HAMILTONIAN group** (X's open item). `hamShow` now adds one `.sp-cap` note row
  (`sp-ham-n`) that names the window holding the operator.
- After W1, a pick from the Picker's HYDROGEN deck leaves WAVE's segments where they were (see the W1 probe).

## Tests (all `nice -n 10`, one browser at a time, gate 9681 / GD 5681)
node: hydrogen 37/37 GREEN · rack-deps GREEN · new-project GREEN · `rack-deps --classes --no-write` HOLDS · `new-project --check` in step ·
`pwa.test --write` re-hashed `sw.js` at each commit. browser: official-defaults-palette GREEN (3 PASS) · take-in-bugs §1–2 PASS, §3 RED, which is
pre-existing (it looks for STATUS TAGS in SETTINGS, see X-BUILD) · window-switching GREEN · picker-looks GREEN · register GREEN (23).

## The CLAUDE.md sentence to add
THE PICK AND THE GREYS (iteration 017 W): a press in the Picker's HYDROGEN deck loads the label at phase 0 (rate 4, window 4πn²) and never writes
WAVE: `loadPreset` sets the OBSERVABLE only when a preset names a `view`, and the LOOK is the thumbnails' style only. WAVE's `styleSync` greys by mode
as well as by style (`modeSync`, single buttons in the kit's disabled look, never hidden): MOMENTUM, and Im ψ for a real molecular volume, under a molecule;
BALLS · STICKS · ESP under hydrogen or an atom (a molecule letting go while one is drawn falls back to CLOUD). SPECTRUM's grid treats a label as populated by
`reg.populated()`, the same rule its chips use.

## Open for Josh
- A disabled button has `pointer-events: none` in the kit's skin (`.seg-b:disabled`), so a greyed button's reason hint cannot be read on hover.
  The hint is still the button's help and aria text. Should the kit let a disabled seg button keep its hint?
- CLAUDE.md says SPECTRUM is FOLDED under MOLECULES, but the code hides it (`moleculeMode` puts `wSpec` in its hidden list). Which is right?
