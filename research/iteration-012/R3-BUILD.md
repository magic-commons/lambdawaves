# R3 · WAVE · CAMERA · PALETTE · CLIP — build report (iteration 012, branch `it012-rack`, after R1; built before I1 merged)

## What changed
- **PALETTE** (`lab/windows/material.js`): the top row is PALETTE · RELOAD (the kit's RESET glyph, "reload the chosen preset") · REVERSE; the bottom
  row is ADD · INVERT · the selected stop's swatch and × · ROTATE (with its STOP ANGLE reader). ADD is the **plus icon**: `lab/img/icons/plus.svg`
  drawn in the ink by a CSS mask (`.lw-icon-plus`, `lab/skin.css`), aria-label "ADD — a stop opposite the selected one".
  **plus.svg here is a placeholder** (24-unit, 2-stroke, currentColor) committed under the I1 name so the shots work — take I1's file at merge.
- **STYLE / FINISH** (`lab/native-ui.js`): the two words above WAVE's DRAW segs are removed (they were WAVE's, not PALETTE's, at this base; the buttons
  say what they are).
- **CAMERA** (app JS over the kit's DOM in material.js + `lab/skin.css`; `lab/mir/panels/camera.js` untouched): CONTROL and DIRECTION labels removed;
  ZOOM and FOV moved into the sphere's knob column under YAW · PITCH (the `.cam-view` row empties and is removed); the sphere is drawn **bigger** —
  ball radius ≈ 40 → ≈ 64 px at the rack's width — by widening the svg 2 × 64 px past its cell and clipping its empty sides (`clip-path` also clips
  the hit test), so the kit's pixel ↔ drawing scale (min of the two ratios, `camera.js` :148) stays exact and the tip still follows the finger
  (`camera-shift` GREEN, it drags the sphere). PAN's X · Y knobs untouched. HAND → **CONTROLS** (the `.cam-title` text).
- **CLIP**: ON · CLIP | SLAB · POS · THICK on one row (grid `auto 1fr 48px 48px`, the kind seg horizontal). CLIP | SLAB stays visible while CLIP is
  off (dimmed .5, the remembered kind lit); **a press on CLIP or SLAB turns CLIP on with that kind** (before, the seg was hidden while off).
- **WAVE · POSITION / MOMENTUM under MOLECULES — inert, so hidden.** Proof by reading: `lab/field.js` :1216 / :1554 — "A set molecule OWNS the volume:
  while one is set the eigenmode reconstruct stands down"; SPACE (`field.setSpace`, the WGSL `P.space` branches) only selects the eigenmode kernel's
  basis, and `domain.half` is `chem.half` whatever the space (`rack.js` :324). `windows/molecules.js` `moleculeMode` already forced `space = 'x'` on
  entry; it now also hides `ui.spaceSeg` while MOLECULES owns the field (CSS drops the empty `.wave-row-0`), shown again in ATOMS.

## Files
`lab/windows/material.js`, `lab/native-ui.js`, `lab/windows/molecules.js`, `lab/skin.css`, `lab/img/icons/plus.svg` (placeholder), `lab/sw.js` (pwa --write).
`lab/shell/rack-wiring.js` and `lab/rack.js` needed no change.

## Tests
- `tools/camera-routes.mjs` GREEN (6 projects) · `tools/settings-probe.mjs` GREEN (0 of 3 red) · `tests/camera-shift.browser-test.mjs` GREEN
- `tests/official-defaults-palette.browser-test.mjs` **RED, unchanged from base** — `vivid is undefined` (it looks for a SETTINGS knob labelled VIVID,
  now a seg button since IN P3); not moved by this row.
- `node tests/pwa.test.mjs --write` PASS (389 files) · `./test.sh node` exit 0 · rack-deps HINGE holds
- Shots: `r-shots/r3-before-{palette-camera,wave-clip}.png` → `r3-palette-camera.png`, `r3-wave-clip.png`

## CLAUDE.md sentence for Yan
Since iteration 012 R3 PALETTE reads PALETTE · RELOAD · REVERSE over the strip and ADD (the plus icon, `lab/img/icons/plus.svg`) · INVERT · the
stop's swatch and × · ROTATE under it; WAVE's STYLE / FINISH words are gone and POSITION | MOMENTUM is hidden while MOLECULES owns the field (a set
molecule owns the volume, SPACE is the eigenmode kernel's); CAMERA has no CONTROL / DIRECTION words, ZOOM · FOV sit under YAW · PITCH beside a
bigger sphere (the svg widened and side-clipped in skin.css, the kit's scale exact), HAND reads CONTROLS; CLIP is one row ON · CLIP | SLAB · POS ·
THICK, the kind always shown and a press on it turning CLIP on.

## Open for Josh
1. A press on CLIP or SLAB while CLIP is off turns it on (my call; the alternative is choosing the kind silently while off).
2. FOR-MIR (not filed, the app reaches it): the camera panel could take a `sphereScale` / column option instead of the app's widened-svg CSS.
