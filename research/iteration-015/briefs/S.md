# CHAIN S — SPECTRUM (branch it015-s, port 9621, GD 5321)

Rows, in this order: S2 THE FILL ICONS → S3 THE PRESET SEAT → S1 THE COMPACT HAMILTONIAN → S4 SAVE A PRESET.
PLAN.md's CHAIN S section is the spec; "Where each item lives" has the lines (spectrum.js:30-115 + lab/spectrum.js:37-121, paint-stroke.js:73-87,
state.js:509); Josh's picture is research/iteration-015/refs/spectrum-below-picker.png — the group it shows is what S1 compacts.

Notes beside the plan:
- S2: `fillButton`'s two SVGs are inline in paint-stroke.js — redraw both at 20 px: FILL ALL = the frame with three solid rungs and a filled
  disc at the foot; EMPTY = the empty frame with a ∅ (a circle and a slash) — and set `title` + `aria-label` to the plan's words; the register's
  ladder and STATES get it for free (one function). Shot: the three buttons in both states.
- S3 + S1: `lab/spectrum.js createSpectrum` appends the body; the HAMILTONIAN group is reordered last (spectrum.js:171). Put `.sp-preset` after
  `.picker`, then the fold: `lab/fold.js`' press with `data-fold="ham"` (read how MOLECULES' `more` and SHADOW's details do it and how
  rack-wiring.js' `folds` records an open one), closed on a first run (first-run.js `inner`). Inside: rebuild the rows as the plan says — the
  kit's `knob` at the small size, a knob-sized seg for POSITRONIUM | MUONIC, `trig`s for LAUNCH · BOUNCE on the GAS row; the per-system rows
  show/hide as they do now (`ui.hamSeg`'s system). Keep every `ui.*` id and every modulation target. Measure the open group's height before and
  after (a probe line in S1-BUILD.md; target ≤ 300 px).
- S4: `lab/user-presets.js` is new and SHARED (chain W's P3 will read it after the merge) — keep it small: `createUserPresets(storeKey)` over
  the kit's `createPrefs`/`localStore` (read lab/csb-favs.js for the shape λWAVES uses for a PREFERENCE list), `add(name, data) · remove(name) ·
  list() · watch(fn)`; register the key in `lab/settings-store.js` FAMILIES. The PRESET stepper (`mol-step` in lab/spectrum.js:43-49) narrows to
  leave a 26 px seat for the bare save glyph (`lab/img/icons/save.svg` as a CSS mask, no button chrome — the mod window's `.m2presave` look);
  a press turns the stepper's name into an `<input>` (Enter saves, Escape cancels); the saved data is the populated label indices; the list is
  USER (only while one exists; each row with ×) then the built presets; a user preset loads through `loadPreset` with `{ hand: true }`.
Tests: `tests/orbitals.browser-test.mjs`, `tests/stage-text.browser-test.mjs` (THE FADE), `tests/history.browser-test.mjs`,
`tests/official-defaults-palette.browser-test.mjs` (the fresh defaults), `node tools/rack-deps.mjs --classes --no-write` (spectrum.js at 25),
`./test.sh node`, pwa --write.
