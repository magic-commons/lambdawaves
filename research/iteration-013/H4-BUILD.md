# H4 THE STAGE'S THREE BUTTONS — build (stage chain, Opus, 2026-10-20)

Josh: "let 'Atoms' instead say 'Hydrogen' and default to hydrogen … turning [the atoms window] on should automatically
switch 'spectrum's system to atoms … icons from the main menu/picker for Library, Molecular, and Atomic … a column."

## What changed
- `lab/windows/molecules.js :19–31` — the kit `seg` ATOMS | MOLECULES is replaced by `#lwMode.lw-stage-btns`, a
  `role=group` COLUMN of three `button.lw-stage-b` with no words: LIBRARY (`data-id=library`, opens/closes the Picker
  by `app.state.picker.toggle()`, the key row `menu`'s road), MOLECULAR (`data-id=molecules`, `chem.setOn(true)`),
  HYDROGEN (`data-id=atoms`, `chem.setOn(false)`, pressed at boot). Each has an aria-label and a `title`, which the
  kit's hint layer takes as its hover hint (`data-help`). `modeSeg.set(v)` keeps its name and the ids `atoms` |
  `molecules`, so `moleculeMode(v)`, the key row `mode`, a project and a link set the pressed face by one road.
  The `seg` import became `el`.
- `lab/skin.css` (§ITERATION 002) — `#lwMode` is a flex column (gap 4 px); each button 28 × 28 with a 16 px icon worn
  as a CSS mask over `currentColor` (`library.svg · molecular.svg · atomic.svg`, the way `lab/lab.css :920` wears
  them), ink `var(--fg)` so it follows the theme; the pressed mode wears the kit seg's ON face (`--state-on`, `--acc`).
- **`#lwHome` (the grid glyph left of the old seg, built by `lab/picker.js :488`) is hidden by CSS**: LIBRARY is the
  same door, and two Picker buttons side by side read as a fault. The element stays (picker.js untouched — the
  picker chain owns it); `#lwMode` takes the seat back at `rack-w + 24px`.
- `lab/windows/readouts.js` — the ATOMS window's power button: a hand turning it ON (click, window not `off`) with
  any system but ATOM calls `switchHamiltonian('atom')` + `ui.hamSeg.set('atom')`, the stepper's own road. A click
  listener, so a project restoring the power never moves the operator; nothing on that road presses the power: no loop.
- Words: `lab/shell/keys.js :83` row `mode` reads "switch the mode: HYDROGEN | MOLECULES"; `lab/shell/notebook.js :110`
  VIEW row "HYDROGEN | MOLECULES  switch the mode" (and its hint). Ids unchanged.
- `lab/sw.js` by `pwa --write`.

## Proof (probe `.tmp/it013/h4f.js` over 9621)
boot: HYDROGEN pressed, MOLECULAR not · LIBRARY → Picker shown, Esc → closed · MOLECULAR → pressed, SPECTRUM hidden ·
HYDROGEN → pressed, SPECTRUM back · ATOMS opened on hydrogen, power off → hydrogen, power on → `atom`, the stepper
reads ATOM · errors [].
Pictures: `H4-shots/before-desktop.jpg`, `after-desktop.jpg`, `before-phone.jpg`, `after-phone.jpg` (390 px: the
column fits under the wordmark, clear of the menubar).

## Tests
`./test.sh node` green (rack-deps: molecules 16, readouts 13, spectrum 25); browser: molecular-names 6/6, current,
keyboard-window, menubar — all GREEN.

## CLAUDE.md sentence for Sos
Under the title `#lwMode` is a column of three icon buttons (013 H4): LIBRARY (the Picker), MOLECULAR (MOLECULES on)
and HYDROGEN (MOLECULES off — the mode ATOMS was; ids `atoms` | `molecules` kept); `#lwHome` is hidden, and the
reader turning the ATOMS window's power ON sets SPECTRUM's system to ATOM.

## Open questions for Josh
- `#lwHome` is hidden because LIBRARY does its job — say if you want the grid glyph back.
- Opening ATOMS from + / WINDOW does not switch the system (only its power turned ON does) — should opening it too?
