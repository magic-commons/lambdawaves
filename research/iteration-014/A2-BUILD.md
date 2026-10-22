# A2 THE MINIATURE PICKER — built (builder A-bar, 2026-10-22)

## What changed
- `lab/picker.js` exports `suggest(query, n = 6)`. It searches the catalogue (`CHEM_PRESETS`, without the disabled rows and the one-atom
  entries, as the MOLECULAR deck lists them) and every INSTALLED volume's index. The volume indexes are read once, on the first search,
  never at boot (`V.shelf` → `statusOf` → `index`). It matches name, formula or id, case- and markup-blind: prefix matches first, then
  substring, at most n.
- The Picker api gains `suggest` and `suggestTile(host, row)`. A suggestion's tile IS the Picker's `tile()` and `pic()`, and its press is
  the Picker's road: `goMolecule` (MOLECULES on, then `chem.pick`) or `goVolume` (`chem.openVolume`, the volume's own picture via
  `V.picture`).
- New `lab/csb-search.js` `createCsbSearch(app, { bar })` (a lab-root module, not a moved one) builds the field in row 2,
  `input.csb-search-in` with placeholder "search".
  - Each keystroke, coalesced to a frame and stale-guarded, asks `app.state.picker.suggest(q, 6)`.
  - The tiles appear in a `.lw-menu.glass.csb-suggest` pane just above the bar, or below it when the bar is near the top. The pane is
    centred on the field and kept on screen.
  - ↑ ↓ choose, Enter opens the chosen tile (or the first), Escape clears, a press elsewhere closes, an opened molecule clears the field.
  - The pictures turn with `--mol-hue` (the Picker's ring).
- VERTICAL bar (A4's free window): the field shows only the `search` glyph. A press unfolds a 180 px pill toward the screen's centre
  (`data-dir` right on the left half, left on the right half). It folds back when it is left empty.
- `lab/shell/transport.js` hands the field to the layout as `app:search`. `lab/lab.css`: the field, the vertical pill and the pane's tiles
  (76 px, formula label). The chooser's max width went from 260 to 220 so row 2 fits beside row 1 (bar still 534 px).
- No key for the search (call 3's assumption).

## Tests
- `./test.sh node` green (`pwa --write` run for the new module); rack-deps green.
- Green browser suites: menubar · start · history · new-project · keyboard-window · timeline · lw-links.
- frame-occlusion green when re-run alone. Its one red ran beside the node suite: the detached card's gap mask, a load flake.
- Driven by hand:
  - "ben" gives Benzene.
  - "me" gives Methane, Methyl radical, Methanol, Methionine, N-methylacetamide, Water hexamer ring.
  - "water" + Enter turns MOLECULES on with H2O and clears the field.

## Shot
`a-shots/A2-search.jpg` (six tiles above the bar).

## CLAUDE.md sentence
"THE MINIATURE PICKER (iteration 014 A2): the CONTROL SURFACE's search (`lab/csb-search.js`) asks the Picker's `suggest(q, 6)` — the catalogue
and every installed volume, read on the first keystroke — and paints ≤ 6 of the Picker's own tiles above the bar (↑ ↓ Enter, Escape); a press
is the Picker's road; on a vertical bar it is a glyph that unfolds toward the screen's centre."

## Questions for Josh
1. A key for the search? (Ctrl+K is free; none today.)
2. Should the suggestions name the molecule under its tile? They show the formula; the name is in the tile's label.
