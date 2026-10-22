# D1 PICKER SEARCH SEAT (iteration 014, chain D)

**What.** Josh: "In Library, inside a volume, move the search bar to the middle, underneath the atomic, molecular, and library buttons.
Where search bar once was, add in a new 'A-Z'/'Z-A' icon and a 'Sort by Mass' … a 3 round toggle … As-is … as if the button just
became unpressed."
- Inside a volume the Picker's seat under its tabs (`.mm-opts`, where SHOW LABELS sits on the other decks) is THE SEARCH, centred,
  240 px; the seat's SHOW LABELS stands aside (`display: none`, the head keeps its twin as before). One input, made on the first
  volume opened, cleared on each `enter()`; on the shelf and on ATOMIC / MOLECULAR it is not shown (CSS: `[data-sec="library"].in-volume`).
- The head's old search seat holds two 3-state buttons (`.mm-sort`, `data-sort`): NAME reads `A–Z` → `Z–A` → as-is, MASS wears
  `lab/img/icons/mass.svg` (a kettle weight, 24-unit, currentColor, the set's 2-px round stroke) with `↓` heavy-first → `↑` light-first →
  as-is. As-is = the index's own order with the button unpressed (`aria-pressed`, `.on` in the accent). One sort at a time: pressing
  MASS while NAME is on starts MASS at heavy-first. The sort sits after the tag and search filter (`sorted()` over `filter()`'s list),
  by `name` (`localeCompare`, base sensitivity) or `mw` (a row without `mw` last). Kept for the Picker's life, never saved.

**Files.** `lab/picker.js` (the library closure: `sort`, `SORTS`, `sortBtn`, `paintSort`, `sorted`; the search moved to `opts`),
`lab/skin.css` (§ the Picker: `.mm-opts .mm-search`, `.mm-sort`), `lab/img/icons/mass.svg` (new), `lab/sw.js` (pwa --write),
`tools/d-shots.mjs` (chain D's scene driver; `picker-volume`).

**Measured** (`node tools/d-shots.mjs picker-volume`, VOL. I over the dev link): the search's centre x = the tabs' centre x (800),
below the tabs; first five as-is H₂O NH₃ CO(NH₂)₂ N₂O CO₂ → MASS heavy-first C₄₀H₈₀NO₈P C₃₄H₅₉NO₁₅ C₆₀ …; NAME A–Z / Z–A reorder.
Shot: `d-shots/D1-picker-volume.jpg`.

**Tests.** `library.browser-test` GREEN; `pwa --write`.

**CLAUDE.md sentence.** Inside a volume the Picker's search is the seat under its tabs (`.mm-opts .mm-search`, iteration 014 D1) and the
head's old seat holds NAME (A–Z → Z–A → as-is) and MASS (`mass.svg`: heavy first → light first → as-is), one sort at a time, by the
index's `name` / `mw`, as-is unpressed, never saved.

**Calls for Josh.** NAME sorts by the molecule's name while the tile shows its formula (SHOW LABELS); a sort by formula is one word away.
