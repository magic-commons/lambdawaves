# P3 SAVE A PALETTE (iteration 015; built by chain S's builder on the merged tree 901da23)

Josh: "Shorten the width of the preset bar to fit in a floppy disk icon to save presets. It can belong in the same dropdown menu, at the very top,
it will say 'User' (but don't show it if the user didn't save any yet …). Let it be just a save icon and not a button background/CSS."

## What changed
- **Kit** (`lab/mir/panels/ramp.js`, 1.5.0-alpha.26, no bump): `createRampPanel(…).setPresets(list, id?)` and the view's swap the stepper's list in
  place. A row may be a `coming` heading (no stops, never chosen, skipped by the arrows). The preset in force stays shown while it is listed;
  `id` names the one to show. The default ramp is now the first row WITH stops. FOR-MIR line at the top of the alpha.26 section;
  `MIR-MANIFEST.json` re-hashed (sha 060ddb35892a…, pinned in `tests/mir-manifest.test.mjs`).
- **App** (`lab/windows/material.js`):
  - The reader's palettes live in `lambdawaves.q0.palettes`, through S4's `createUserPresets`. Rows are `{ name, data: { stops } }`.
  - The list reads USER · theirs · PRESETS · the kit's while at least one exists, and the plain list otherwise. `palUsers.watch` re-feeds it
    through `setPresets` on every save or remove.
  - The stepper narrows (`.mir-ramp-step` flex 1) for S4's bare save glyph `.sp-presave`: `save.svg` as a 26-px accent mask, no chrome.
  - A press turns the name into a field pre-filled `My <palette>`, selected. Enter keeps the current stops under that name and shows it;
    Escape or a press elsewhere cancels.
  - In the open list (`palPick`) a reader's row gets its strip from its own stops, and its × sits between the name and the strip, so the strips
    stay one column (P1's law: all at x = 723 in the probe).
  - A reader's palette is a `user:<name>` row. Picking it loads its stops and announces its name (INFORMATIONAL's style kind, a hand only).
    `palId` — the name the link and the settings carry — stays the last BUILT palette, so a reader's name never leaves the device. The
    stops travel as custom stops, as a hand-edited ramp's always did.
- `lab/settings-store.js` FAMILIES: `lambdawaves.q0.palettes` (PREFERENCE).
- `lab/lab.css` § S4: the glyph, name-field and hidden-name rules now cover `.mir-ramp-presets` too.

## Measured (`node tools/s-shots.mjs palette`)
- Saving PRISM's stops as MY SEA stored `{"v":1,"items":[{"name":"MY SEA","data":{"stops":[…]}}]}` and the stepper showed MY SEA.
- The list read `#user · user:MY SEA · #built · beacon …`, and both strips' left edge was at x = 723.
- Picking BEACON changed the stops; picking MY SEA gave them back byte for byte. `__LW.palette.id` then read `beacon`, not a user id.
- The glyph measured 26 × 26.

## Files
`lab/mir/panels/ramp.js`, `MIR-MANIFEST.json`, `tests/mir-manifest.test.mjs`, `docs/FOR-MIR.md`, `lab/windows/material.js`, `lab/settings-store.js`,
`lab/lab.css`, `lab/sw.js`, `tools/s-shots.mjs` (scene `palette`).

## Tests
`./test.sh node` green · `node tests/palette.test.mjs` 15/15 · `node tests/mir-manifest.test.mjs` PASS · `tools/settings-probe.mjs` GREEN (0 of 3) ·
`tests/official-defaults-palette.browser-test.mjs` PASS · `tests/history.browser-test.mjs` 0 red (the palette choice, a custom stop and P each one
undo row, byte-identical) · `node tools/rack-deps.mjs --classes --no-write` HOLDS (material 4).

## Shot
`w-shots/P3-save-palette.jpg` — left: ‹ MY SEA › with the glyph; right: the list open, USER · MY SEA × · PRESETS · Beacon … with one column of strips.

## CLAUDE.md sentence (PALETTE, after iteration 012 R3/R4's lines)
Since iteration 015 P3 PALETTE's preset stepper carries S4's bare save glyph. It keeps the current stops under a name typed in the stepper's seat,
in the PREFERENCE record `lambdawaves.q0.palettes` (`createUserPresets`). The kit's `createRampPanel(…).setPresets(list, id)` re-feeds the list
(USER · theirs · PRESETS, only while one exists; each reader's row has a ×). `palId` stays the last built palette, so no reader's name enters a
link or the settings.

## Calls for Josh
1. Removing the palette in force leaves its stops on screen; the stepper then names the last built palette, and RELOAD reloads that one.
