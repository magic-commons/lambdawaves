# P · THE PICKER AND THE SMALL CUTS — build note (iteration 008, branch `it008-picker`, base `24648c7`)

Brief: `P-BRIEF.md`. Files: `lab/picker.js`, `lab/picker-fx.js`, `lab/skin.css` (§ THE PICKER), `lab/informational.js`, `lab/lab.css`
(§ THE STAGE TEXT), `lab/sw.js` (the precache hashes). `lab/chemview.js` is untouched (rows U and V own the card).

## What was built

**1 · The LIBRARY deck, tighter.** Inside a volume, the head is now ONE row:

`‹ LIBRARY` · the kit's stepper `‹ VOL. I ›` · the count · the tags · the search · `INSTALL · 1.9 GB` with its ring

- The stepper steps through the shelf's volumes and its name is a label (`list: false`), because the kit's list pane would open under
  the Picker. The volume's title and size are on the stepper's hover.
- The count reads `2,815`, or `95 / 2,815` when a filter is on. Its hover names the filter.
- The tags are pills on ONE line that scrolls sideways under a feathered edge, and the mouse wheel scrolls it. Pressing a tag lights it
  in place, so the strip keeps its scroll position. Two or more tags still intersect, and `all` clears them.
- The row is exactly as wide as the page under it: the deck now writes `--t`, `--cols` and `--gap` on its host as well as on the pages.
- At phone width (≤ 700 px) the row wraps and the tags take their own full-width line.

The big `VOL. I` headline, the title line, the multi-line tag cloud and the `all · 2,815` heading are gone. The deck measures its tile
from what is left. The first row guess in `size()` now takes 4 rows from 560 px of height (it was 640). Without that change the freed
height went into bigger tiles, not more of them: at 1500 × 914 the page would have gone from 27 tiles to 24.

| window (inner) | before: head · rows × cols = per page | after: head · rows × cols = per page |
|---|---|---|
| 1920 × 994 | 57 + 78 + 46 px · 3 × 10 = **30** (162 px tiles) | 40 px · **4** × 10 = **40** (160 px) |
| 1500 × 914 | 57 + 78 + 46 px · 3 × 9 = **27** (135 px) | 40 px · **4** × 9 = **36** (140 px) |
| 1366 × 774 | (computed from the old rule) 2 × 8 = 16 | 40 px · **3** × 7 = **21** (144 px) |
| 500 × 814 (phone) | — | 111 px (wrapped) · 3 × 3 = 9 |

Screenshots: `P-BUILD-library-before-1920.png` → `P-BUILD-library-after-1920.png`, `P-BUILD-library-before-1500.png` →
`P-BUILD-library-after-1500.png`, `P-BUILD-library-phone.png`. All are headless Firefox, so the Picker's frost is off and the racks
show through behind it.

The MOLECULAR deck shares `size()`, so it also gets its fourth row from 560 px. Its head is empty, so on a desktop it already had four.

**2 · The caption under fast hovers.** `swapLine` (`lab/picker-fx.js`, R6) now keeps ONE LINE IN FLIGHT:

- The line on show leaves (up 18 px, 120 ms) and is removed. Only then is the newest line asked for built, and it rises (14 px, 280 ms).
- A call that arrives while a line is leaving only replaces what will be built next.
- A blank line leaves at once. Under reduced motion the new line simply replaces the old.
- `aria-live="polite"` is unchanged.

The proof is a light-check script (in `.tmp/`, not committed). It sweeps 20 tiles of the MOLECULAR deck. A MutationObserver and a rAF
loop count the `.mm-cap-n` names and `.mm-line` lines in the caption.

| sweep | before (base `picker-fx.js`) | after |
|---|---|---|
| in the page, `pointerenter` every 20 ms (20 tiles, 417 ms) | max **2** names, 2 lines, 20 lines built; last name standing | max **1** name, 1 line, **3** lines built; the last name ("Carbon dioxide") standing |
| the driver's real mouse, 20 × 20 ms moves (≈ 800 ms with the driver's overhead) | max **2** names | max **1**; the last name ("Methane") standing |

Screenshot after the sweep: `P-BUILD-caption-sweep.png`.

**3 · The section install moves into the MOLECULAR deck.** The MOLECULAR deck is now the catalogue in `SECTIONS` order. Each section
opens with a HEADING tile in the grid flow (`.mm-shead`): it costs one cell and no row. The tile shows:

- the section's name;
- its line, for example `25 records · 7 MB · 3 here`, or `all live`;
- for a section with records, THE SECTION INSTALL: the ring, the lamp in the ring's eye (lit with the accent when every record is on
  this device), and the word.

What the press does:

- **Install.** One press calls `persistOnce()` once, then fetches every record of the section through `library.js` `fetchRecord`
  (checked against its sha-256 name). The ring and the word count `k / N · CANCEL`, and a press while it runs stops after the record in
  hand.
- **Remove.** When every record is installed, two presses within 3 s remove them (`REMOVE LATTICE? PRESS AGAIN`), the volume card's own
  law.
- **After either,** `chem.records()` makes MOLECULES re-read its lamps.

The counts are read from the store whenever the deck comes into view. A Safari tab is offered nothing to keep, as chemview's rule says.
Within a section, the order is the dropdown's (its groups). `__LW.chem.section().sub` is chemview's and is unchanged, so row U can drop
INSTALLED from the card.

Light check: LATTICE went from `INSTALL · 2 MB` through `1 / 6 · CANCEL`, `4 / 6 · CANCEL` to `INSTALLED`, and the heading read
`6 here`. `__LW.chem.section('LATTICE')` then said `installed 6 / 6, lamp true, "6 records · 2.0 MB · 6 here"`. Two presses took them
out, and the card said `installed 0, lamp false`. Screenshot: `P-BUILD-molecular-sections.png` (LATTICE installed, HEAVY not).

**4 · One-atom entries go to the ATOMS road.** `atomZ(formula)` is the element's Z when a formula is one bare element symbol, and 0
otherwise.

- In the LIBRARY deck, such a tile opens `goAtom(Z)`: ATOMS mode, the element, its valence. It wears its element's own Picker picture
  (`img/menu/el-Fe.webp`), and its caption says `VOL. I · one atom: it opens in ATOMS`.
- Light check: pressing Iron in VOL. I left `hamiltonian = atom`, `Z = 26`, MOLECULES off (`P-BUILD-library-atoms.png`,
  `P-BUILD-iron-atom.png`).
- An element past the ATOM system's reach (Z > 36 until row A) still opens from the volume. None of VOL. I's six are past it.
- The MOLECULAR deck filters one-atom entries out. The catalogue has none today (0 of 98 checked), so the filter is a guard.
- **For row V / the next pack:** `tools/volumes/pack.mjs` (or `themes.json`) should exclude the one-atom entries `iron`, `krypton`,
  `zinc`, `chromium`, `nickel` and `titanium` (point group `SO3`, PubChem CIDs 23925, 5416, 23994, 23976, 935, 23963). The tools are row
  V's, so they are not touched here.

**5 · The stage block.** In the formula block (not THE FADE's or THE HEAD's `[data-fade]` blocks), the paragraphs are centred on one axis
(`lab.css`). The kit seats the max-content block centred on the free stage, so:

- a name shorter than the formula sits centred under it;
- a longer name, for example `carbon tetrafluoride` under CF₄, leaves the formula on the same axis it holds alone.

Measured at 1500 px: CF₄'s formula and its name both centre at x = 750, and so do furan's. Screenshot: `P-BUILD-stage-name.png`.

**6 · ELLIPSOID → UNCERTAINTY.** The MARKS switch's label is now UNCERTAINTY. Its title is unchanged, and so are `ui.ellipsoidSw` and the
blob key `ellipsoid`.

## Decisions

1. **The tags are not the kit's `seg`.** The brief said "the kit's seg for the tags". A seg is a radiogroup, one value at a time, and
   VOL. I's 34 tags intersect (aromatic + amine), which the Picker has done since iteration 004. The tags therefore wear a seg's manner,
   pills with the lit one in the accent, but stay multi-select toggles with `aria-pressed`. The volume IS the kit's stepper.
2. **The first row guess moved from 640 px to 560 px.** Only this makes the freed head height become a row and not bigger tiles. At
   560 px the tile is still ≥ 132 px.
3. **The section heading is a tile, not a bar.** A bar of six sections over the MOLECULAR deck would have cost the deck a row. The
   heading tile costs one cell per section, sits exactly where its section starts, and reads as its heading.
4. **The ring's eye holds the lamp.** This leaves the word its share of a 140–160 px tile. "INSTALL · 7 MB" fits on one line at 1600 px.

## Tests

- `./test.sh node`: every suite green except two expected reds. pwa was red before `--write`, and the last commit carries the rewrite.
  wigner W42-8, the slice timing row, read 149–198 ms against 150 ms both in the run and alone, while the three volume solvers and the
  render shared the machine. This row is the known flake the plan names, and this branch does not touch Wigner.
- Browser, on 9671 / 5671: `menubar` GREEN · `stage-text` GREEN · `molecule-head` GREEN · `start` GREEN (3 of 3).
- The light checks above (LIBRARY rows, the sweep, the section install, Iron → ATOM, the stage block) come from scripts in `.tmp/`, not
  committed, per Josh's dial.

## Next

- Row U drops INSTALLED from the MOLECULES card (`chemview.js` `keepSw`). The Picker's heading tiles now carry it.
- Row V or the next pack excludes the six one-atom entries from the volume (see §4).
- Row A extends `ATOMS` to Z ≤ 86. A one-atom entry past Kr then opens the ATOM automatically, because the check is `ATOMS.some(Z)`.
