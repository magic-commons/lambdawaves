# S4 SAVE A PRESET (iteration 015, chain S)

Josh: "Similar to Palette, shorten the preset window and add a save orbital (so that it just saves which orbitals were selected and that's it). Do
the same 'User' section appears when a custom preset is saved."

## What changed
- NEW `lab/user-presets.js` `createUserPresets(storeKey)` → `add(name, data) · remove(name) · list() · watch(fn)`: one PREFERENCE record
  `{ v: 1, items: [{ name, data }] }` over the kit's `jsonStore` (csb-favs.js' shape); `add` replaces a same-named row in its seat; an emptied
  list removes the key. Shared: chain W's P3 builds PALETTE's save on it (`lambdawaves.q0.palettes`).
- `lab/settings-store.js` FAMILIES: `lambdawaves.q0.presets` (PREFERENCE). `tools/settings-probe.mjs` GREEN (0 of 3 scenes red).
- `lab/spectrum.js` (the PRESET row S3 seated): the stepper narrows for a 26-px seat holding the bare save glyph (`.sp-presave`:
  `img/icons/save.svg` as a CSS mask in the accent, no chrome — the mod window's `.m2presave` way). A press (with anything populated) turns the
  stepper's name into a field (`.sp-prename`, pre-filled with the labels, `1s₀ + 2p₀`, selected): Enter saves, Escape or a press elsewhere lets
  it go. The data is the populated label indices, `{ labels: [0, 3] }` — nothing else.
- The list: `USER` heading, the reader's rows (each with a × that removes it in place), `PRESETS` heading, then the built ones — the two
  headings exist only while a reader's preset does (the kit's list rows, `coming`, so they are never picked and the arrows skip them).
- A reader's preset is a `user:<name>` row of state.js' `PRESET_BY_ID` with `id: null` and no `visual`: it loads through `loadPreset(id,
  { hand: true })` — THE FADE says its name, one undo row, the stepper shows it — sets the labels equal and in phase and nothing else; the
  register's provenance (`reg.preset`) stays null, so no name ever reaches a project, a link (statelink's T_PRESET literal) or history.
- `lab/shell/controller.js` `loadPreset`: two guards (`if (p.visual)`) so a preset without visuals keeps the clock window, the rate and the
  view. No crossing changed (rack-deps: controller 12, spectrum 25, HOLDS).

## Measured (`node tools/s-shots.mjs preset`)
Saved `{"v":1,"items":[{"name":"MY DIPOLE","data":{"labels":[0,3]}}]}`; the name field offered `1s₀ + 2p₀`; after 3d_z² (1 label) a pick of
MY DIPOLE gave back labels [0, 3] with `reg.preset` null; the list read `#user · user:MY DIPOLE · #built · 1s · 2pz …`; the glyph 26 × 26 at
the row's end.

## Files
`lab/user-presets.js` (new), `lab/spectrum.js`, `lab/settings-store.js`, `lab/shell/controller.js`, `lab/lab.css` (§ S4), `lab/sw.js`,
`tools/s-shots.mjs` (scene `preset`).

## Tests
`./test.sh node` green; `tools/settings-probe.mjs` GREEN; `node tools/rack-deps.mjs --classes --no-write` HOLDS (spectrum 25);
`tests/stage-text.browser-test.mjs` GREEN; `tests/history.browser-test.mjs` 0 red; `tests/official-defaults-palette.browser-test.mjs` PASS;
`tests/molecular-names.browser-test.mjs` PASS (after S1); `tests/orbitals.browser-test.mjs` 23 / 24 — L9 RED twice alone (8 volume
dispatches in 700 ms against its ≥ 10, t advanced 1.6 / 2.7): a frame-rate count with the solvers holding the GPU at 100 %, not these files.

## Shot
`s-shots/S4-save-preset.jpg` — top: ‹ MY DIPOLE › and the glyph; below: the list open, USER · MY DIPOLE × · PRESETS · 1s … (the list pane's
glass reads transparent in the headless driver, as the kit's list does there).

## CLAUDE.md sentence (after THE STAGE FORMULA's THE FADE sentence, and in the scopes list)
Since iteration 015 S4 SPECTRUM's PRESET carries a bare save glyph: it keeps the populated labels under a name the reader types in the stepper's
seat, in the PREFERENCE record `lambdawaves.q0.presets` (`lab/user-presets.js` `createUserPresets`, shared with PALETTE's P3); the list's
USER group (each row ×) sits at the top only while one exists, and a reader's preset loads through `loadPreset` as a hand's (THE FADE) with
no visuals and no provenance, so it never enters a project, a link or history.

## Calls for Josh
1. A reader's preset sets only the labels (VISUALS on or off): it does not change the view, rate or clock window. Say if it should keep those too.
2. Saving with an empty register does nothing (no word on the status line).
