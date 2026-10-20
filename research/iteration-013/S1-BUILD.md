# S1 QUALITY'S WORD — build (iteration 013, picker chain)

Josh: "Remove text that says 'grid' in quality."

## What changed
- `lab/windows/settings-card.js` `ui.gridSeg`: `label: ''` (the kit's `seg` draws no `.k-lbl` for an empty label — no stray gap) and
  `aria: 'GRID'`, so the radiogroup is still named for a screen reader. 64³ · 96³ · 128³ stand under FIELD QUALITY.
- `tests/export3d.browser-test.mjs` re-aimed: it found the seg by its word; it now finds the seg holding 64³.
- `lab/sw.js` by `pwa --write`.

## Picture
`s-shots/s1-after.jpg` — SETTINGS › QUALITY: FIELD QUALITY, then the 64³ · 96³ · 128³ seg with no word over it, FIELD CLOCK cap under.

## Tests
`./test.sh node` green · `tests/export3d.browser-test.mjs` GREEN.

## CLAUDE.md sentence for Sos
Since iteration 013 S1 SETTINGS › QUALITY's grid seg (`ui.gridSeg`) has no word (aria name GRID); 64³ · 96³ · 128³ sit under FIELD QUALITY.

## Open questions for Josh
- none
