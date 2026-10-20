# L1 — THE LIBRARY'S WORDS (iteration 012, branch `it012-library`)

## What changed (`lab/picker.js`, `lab/skin.css`)
Josh's list, item by item:
- **"All the Molecules" gone.** It is VOL. I's `title` in the shelf's data (`volumes.json`), so the card no longer prints a volume's title or
  blurb; both are the card's hover tooltip (`title`), and the stepper's hover is `VOL. I · 2.9 GB`.
- **The GB size moved into INSTALL / REMOVE**: `INSTALL · 2.9 GB` → installed `REMOVE · 2.9 GB` (the full accent ring says installed; the
  word `INSTALLED · REMOVE` is gone). The card's line is `3,465 molecules · 6 bases`. The catalogue sections' cards the same:
  `12 molecules` over `INSTALL · 1 MB` / `REMOVE · 1 MB` (partial: `3 / 25 · INSTALL`).
- **RECORDS gone**: the heading and its sentence above the section cards, and "N records" on each card.
- **"25 here" gone** (the ring already counts what is on the device).
- **"… pictures and files kept" and "persisted: the browser keeps it" gone**, with "N records kept" and "not persisted: …". THIS DEVICE now
  says only its use (`2 MB of 1.6 GB in use`), plus, in a Safari tab only, `add λWAVES to the Home Screen to keep it`. No test read them.
  `keptSummary` is no longer imported (it stays in `library.js`).
- **No bottom caption on the volume shelf**: a hover on a volume card or a section card no longer writes the caption (it repeated the card).
  Inside a volume a molecule's hover still names it (the tile shows only its picture).
- **PRESS AGAIN for 600 ms**: the first press on REMOVE arms it (`REMOVE VOL. I? PRESS AGAIN`) for 600 ms or until a press anywhere else,
  then the button repaints (`armer()` in picker.js — before, the word stayed stuck after the 3 s arm ran out). Volumes and sections alike.
- **The search bar never moves**: the deck is now a fixed height — the rows the space holds, filled or not (`--rows` from `size()`), and
  the page dots keep their line on a one-page deck (`visibility`, height 18 px). Measured: the search's top 146.3 px for all 3,465,
  for "caff" (one page) and back.
- **LIBRARY off the tags row**: the `‹ LIBRARY` button is an `arrow-left.svg` icon ("back to the volumes"); pressing the LIBRARY tab inside
  a volume also goes back to the shelf.
- **INSTALL / REMOVE off the tags bar, SHOW LABELS in its place**: on, every molecule tile carries its formula (STIX, bottom left), the
  name stays the hover's. **A twin for ATOMS**: one subtle seat under ATOMIC · MOLECULAR · LIBRARY — the atoms' SHOW LABELS while ATOMIC is
  in view (on by default: the symbol and Z, as before; off: the pictures alone), the molecules' while MOLECULAR or LIBRARY is (off by default).
  The MOLECULAR deck's tiles wear the formula too. Both are PREFERENCE in the Picker's own record `lambdawaves.q0.picker`
  (`{ atomLabels, molLabels }`, a row in `lab/settings-store.js` FAMILIES), never in a project or a link.
- **Every remaining sentence once**: the empty shelf says "No volume is published yet." (the definition went); the file volume's "A volume is
  a file you download once…" went (its button says OPEN FILE…); a section's hover title "Keep ORGANIC on this device: press to install, press
  twice to remove"; the MOLECULAR deck's away line "ORGANIC · a press downloads it (1 MB)"; a partial install "3 of 25 on this device — the
  rest did not download (offline?)". Unused CSS for the removed lines went (`.mm-vol-title`, `.mm-vol-blurb`, `.mm-cat-h`).

## Files
`lab/picker.js` · `lab/skin.css` (one L1 block before "the way back"; the dots' rule) · `lab/settings-store.js` (one FAMILIES row) · `lab/sw.js`.
`lab/volumes` is a git-ignored link to `~/Documents/LAMBDAWAVES-VOLUMES/dist` in this worktree, for the photographs only.

## Tests
`./test.sh node` green · `tests/start.browser-test.mjs` GREEN 3/3 · `tests/library.browser-test.mjs` GREEN (no string of theirs moved:
the library suite reads MOLECULES' own section line, not the Picker's) · `rack-deps --classes` HOLDS (spectrum 25/25).
Shots: `l-shots/l1-library-shelf.png`, `l-shots/l1-library-volume.png` (SHOW LABELS on, 1920×1080).

## CLAUDE.md sentence for Yan
THE LIBRARY'S WORDS (iteration 012 L1): a volume card is its numeral, its count and its bases over `INSTALL · <size>` / `REMOVE · <size>`
(the title and blurb its hover), a remove armed for 600 ms or until a press elsewhere (`armer`), no caption on the shelf, the deck a fixed
height so the search never moves; SHOW LABELS (the formula on every molecule, the symbol and Z on every element) is the Picker's own
PREFERENCE `lambdawaves.q0.picker`, one seat under the tabs and a twin where a volume's INSTALL was.

## Open questions for Josh
1. 600 ms is short for a second press; it is what you asked — say if 1 s reads better.
2. The atoms' SHOW LABELS starts ON (the symbols you have today); the molecules' starts OFF. Right defaults?
3. Inside a volume there is no INSTALL now; a reader installs from the shelf's card. Fine?
