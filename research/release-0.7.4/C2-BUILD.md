# 0.7.4 C2 THE SHELVES — build note (Opus, 2026-10-16)

Branch `c2-shelves` from `aab8115` (C1 merged at `f6b8e01`). lab/ JS lines **29,507 → 29,525 (+18 of the +50 budget)**; `lab/lab.css` +7 (6 rules and a comment, unlayered).

## Seats
- `lab/chemview.js:31`: imports `CATALOGUE` (C1) and `ATOMS` (`lab/atoms.js`). There is no second table: every tile's word is the catalogue row's.
- `lab/chemview.js:93`: the SECTION stepper's items are `['ATOMS', ...SECTIONS]`. ‹ ATOMS › is the first page and opens the shelf when it is turned to.
  `SECTIONS` in `lab/molecules.js` is unchanged, so `__LW.chem.section(s)`, the tests' page loops and INSTALLED read the same six sections as before.
- `lab/chemview.js:100–117`: THE SHELF. A `.mol-shelf` panel (`#mol-shelf`) is seated directly under the MOLECULE picker row and above BASIS. It is
  folded shut by default. The SECTION name carries `aria-controls="mol-shelf"` and `aria-expanded`. A capture-phase listener on the stepper's root turns a
  name press into the shelf's toggle, which replaces the kit's bare list (Alt+↓ on the name still opens that list). `setShelf(open)` and `shelfFill()` render
  only while the shelf is open.
  - **Molecule tiles** are listed in GROUPS order, then RECORD_GROUP (the dropdown's order). Each tile shows five lines: the formula (`<m>`, through the kit's
    `el` → `mathText`), the name, `nAO AO`, the catalogue's word (`CATALOGUE.find((r) => r.id === p.id && r.shelf === 'molecules')`), and the lamp:
    LIVE · INSTALLED · DOWNLOAD (a record row, read off `have`) · NOT A MINIMUM (a disabled row, `p.shortReason`). The tile's title is the option's
    `why` string (name, then `p.reason` for a disabled row or "past the cap: it opens from its record" for an over-cap row, then the source). A disabled
    row's tile is a disabled button. The molecule on screen is lit (`.on`). One tap folds the shelf and calls `handPick(id)`, the dropdown's own road, so
    the head, the solve and the dropdown/stepper read-back all follow.
  - **‹ ATOMS › tiles** are ATOMS' H–Kr cells: the symbol, `Z = n`, and the ATOM row's word (NUMERICAL). The title adds the name, the term and
    `oracle.what`. The element in force is lit. A tap folds the shelf, switches MOLECULES off if it is on (it must let go of the field for the atom to
    play), then calls `api.atom(Z)`.
- `lab/chemview.js:165` (`header()`) re-renders an open shelf whenever the page or the lamps change. On ATOMS the header's record line reads
  `36 elements, H–Kr · NUMERICAL`. `lab/chemview.js:177` (`mSeg.set`) re-lights the current tile.
- `lab/windows/molecules.js:63`: the chem `api` gains `atomZ()` and `atom(z)`. `atom(z)` runs `setElement(z)`, then `switchHamiltonian('atom')` if ATOM
  is not already in force, then `ui.hamSeg.set('atom')`, and opens the ATOMS card. This is SPECTRUM's ‹ SYSTEM › ATOM road plus the ATOMS cell's
  `setElement`. `setElement` is destructured once at creation (backward). `app.w.wAtoms` is read at use (+1 forward: molecules 13 → 14).
- `lab/lab.css:798–804`: `.mol-shelf` (grid, `repeat(auto-fill, minmax(76px, 1fr))`, `--nc: var(--acc)` so `.pk-c.on` lights in the accent),
  `[hidden]`, `.mol-tile` (stacked lines), its children (ellipsis), its `b` (the formula or symbol in `--fg`), and `body.phone .mol-shelf` (two a row).
  A tile is `pk-c mol-tile`, so it wears ATOMS' cell and skin.css's raise. No new colour.

## Tile counts per shelf
ATOMS 36 · DIATOMICS 17 · HYDRIDES 23 · ORGANIC 12 · BIO 27 · LATTICE 6 · HEAVY 13 (98 molecules, matching the dropdown's pages).

## Screenshots (headless Firefox, 1500 × 1150, not committed)
- `.tmp/c2-organic.png` (cropped to the card: `.tmp/c2-organic-crop.png`): the ORGANIC shelf with 12 tiles in three columns, all LIVE · NUMERICAL.
- `.tmp/c2-atoms.png`: the ATOMS shelf, H–Kr in 36 tiles, with Ne (the element in force) lit.
- The probe (`.tmp/shelf-shot.mjs`, throwaway) checked these. A name press opens the shelf, sets `aria-expanded` true and opens no kit list. Tapping Ar gave
  operator `atom`, Z 18, the shelf folded and the ATOMS card open. Tapping benzene on ORGANIC gave preset C6H6, the dropdown on C6H6 and the shelf folded.
  There were no page errors.

## Dropped, and why
- **No chevron glyph on the SECTION name.** The name's seat is sized by the kit to its longest word, and a glyph would move the arrows (the hand law). The
  name takes the chevron's ARIA idiom instead: `aria-controls` and `aria-expanded`.
- **No per-element words.** C1 has none (one ATOM row), so all 36 tiles read NUMERICAL, as C1's note says.
- **No shelf in `lab/atomsview.js`.** The element road (`setElement`) is already reachable through `app.w`. The operator switch it also needs lives in
  `lab/windows/molecules.js`, where chemview's `api` is made, so atomsview.js is untouched (0 of its ≤ 3 lines).
- Search, covers and per-tile predicted times are deferred by the plan or left to the dropdown, which keeps `~ms`.

## Gates
`node tests/pwa.test.mjs --write` then `./test.sh node`: rc 0 (the two "FAIL" strings in the log sit inside PASS/GREEN lines). `rack-deps --classes`
HOLDS: spectrum 25 (untouched), molecules 14. `new-project --check` in step (16117 B). `serialize-bytes` on C2 and on the base tree (`aab8115`,
extracted into `.tmp/`), 11 readings each, port 9411: **0 of 22 shas differ**. `tests/chem.browser-test.mjs` on the served tree: **0 failing of 56**.
It ran before the tiles' AO/word lines were split onto two lines, a text-only change.

## Δ
+18 lab JS lines (chemview +17 net, molecules +1); lab.css +7. Not touched: `lab/field.js`, any Hamiltonian table, any solve, MOLECULES' saved state, and
the serialize bytes. A shelf opening or shutting writes only DOM inside the card.
