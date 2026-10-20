# R4 · THE PALETTE DROPDOWN — build report (iteration 012, branch `it012-rack`, after R3)

## What changed
- **The Picker's surface is a class now** (`lab/skin.css`): `#lwMenu`'s background (.985 tint; under FROST .62 + `blur(28px) saturate(1.25)`) moved
  from the id rules onto `.lw-menu` — the class `lab/picker.js` already gives the Picker's root — so another pane can wear it. Its second selector
  `body.frost[data-card] .lw-menu.glass` out-ranks the refractive `.glass` veil/frost rules (0,3,1) for a kit pane that carries `.glass`. The Picker
  itself paints exactly as before (same values; it is the same element).
- **The palette preset list** (`lab/windows/material.js` `palPick`): when the PALETTE stepper's name opens the kit's list pane (`listPane`,
  `body > .mir-pick`), the app adds `lw-menu pal-pick` to it: the Picker's surface instead of the near-clear refractive veil; rows 44 → 24 px
  (34 at `pointer: coarse`) with no gap, so all 34 palettes fit (830 px on 1080); each row carries a `.pal-strip` at its right edge — the preset's
  stops as a `linear-gradient(to right in oklab, …)`, closed back to the first stop (the strip is the phase circle −π … +π). A pane the kit opened
  upward is re-seated so its foot stays where the kit put it, and it is pulled back inside the viewport's right edge. Opened by click or by
  Alt+↓ on the name (keydown → microtask). The kit's files are untouched.

## Tests
- `./test.sh node` exit 0 · `node tests/pwa.test.mjs --write` PASS · `tests/library.browser-test.mjs` GREEN (the Picker's CSS moved)
- Shots: `r-shots/r4-palette-dropdown.png` (knob 22) and `r4-palette-dropdown-blur0.png`; live read: `mir-pick glass lw-menu pal-pick`,
  background `rgba(233,237,241,.62)`, `blur(28px) saturate(1.25)`, 34 rows × 24 px, 34 strips.

## CLAUDE.md sentence for Yan
Since iteration 012 R4 the Picker's surface is the class `.lw-menu` (skin.css), and PALETTE's preset list wears it: the kit's list pane gets
`lw-menu pal-pick` as it opens (material.js `palPick`) — 24-px rows and each palette's strip at the right edge.

## Open for Josh
1. The list's frost is the Picker's fixed 28 px, not the GLASS BLUR knob (it is "the main menu's surface"); say if it should follow the knob.
2. FOR-MIR (not filed): `stepper` could pass `cls` and a row renderer to `listPane`, so the app need not tag the pane after it opens.
