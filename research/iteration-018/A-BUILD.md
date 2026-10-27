# CHAIN A — THE MENU AND THE CHROME · BUILD (Opus builder, 2026-10-27; branch `it018-A`, base 90a2fce)

## What changed, per row
- **A1 PICKER FLICKER** (`lab/picker-fx.js`). The fix is in one place, `animate()`, not at each call: a lone keyframe without an offset becomes
  the entrance FROM (`offset: 0`), so the element eases to its own style. Every site in MAP 1a goes through `animate()`: enterTiles (page turn,
  section show, isomer deck, tag search, first-run open), develop, the caption line, the install-ring pulse, the folders/volume views and the
  first-run entrance. The one real leave (the old caption line) now says `offset: 1`. The R0 comment is corrected. Probe: an entrance now runs
  opacity 0 → 0.69 → 0.92 → 1 (before: it faded out and snapped back); the leave runs 1 → 0.08 → 0.
- **A2 ISOMER PANE** (`lab/skin.css` `.mm-isos`, `lab/picker.js` openIsomers). The pane is `max-content` wide, centred (`left: 50%; translate`),
  and its tiles are the deck's size (151 = 151 px in the probe). Max height is the viewport below the pager, with a scrollbar only past that.
  The caption under a focused tile has room. Because the pane no longer covers the deck, a press on the ground around it (captured on the
  view) puts it away and never opens the tile underneath. Shot: `A-shots/a2-isomers.jpg` (3 isomers → 3 tiles).
- **A3 PICTURES** (`lab/volumes.js` picture(), `lab/picker.js`, `lab/chemview.js`, `lab/lab.css`). A row with no `thumb` reads `t/<id>.webp`.
  Any miss calls one helper, `hold()`: it removes the `<img>` and the formula holds the square. This covers Picker volume tiles, CSB search tiles
  (new `.csb-suggest .mm-ph`) and a failed catalogue picture (picker.js:271). On the MOLECULES shelf every volume row now gets its picture, and a
  miss shows `.mol-tile-ph` (the formula). The unused `thumb` flag is gone from the search rows. `tools/menu-check.mjs` reads the same before
  and after (it reads the disk only): vol-1 has 6927 pictures, 5076 named, 1851 unnamed, and those 1851 now display. Shot: `a3-pictures.jpg`.
- **A4 EXPANDERS** (`lab/skin.css`). One rule, `:is(.dev, body) .trig.lw-fold:is(*, :hover, :active, .on)`: no background, border, shadow,
  lift or text-shadow. The hover and open states show only in the ink (`--fg`). MORE (chemview) and SHADOW (native-ui) already wear
  `.lw-fold`, so they follow. Probe: 10 of 10 folds have no shadow and a transparent face. Shot: `a4-folds.jpg` (INFORMATIONAL, CAMERA).
- **A5 SCROLL PILL INK** (kit `lab/mir/shell/rack-scrollbar.js` `inkOn(rgb, theme)`, theme from `body[data-theme]`). The light theme prefers
  white ink and flips only when L > 0.3; the dark theme prefers dark ink and flips only when L < 0.1. `rack.css` needed no change, because
  `data-ink` already drives the colour. Trickle-down done: version 1.5.0-alpha.29, a FOR-MIR line, re-hash (manifest 692cb9ff1544, pinned).
  Shot: `a5-pill-light.jpg` (teal pill, white text; before this change it read black).
- **A6 ABOUT** (`lab/shell/notebook.js`, `lab/lab.css`). The seg, the MIR page (`aboutTabs`, `.ab-mir`) and the now-unused `seg` and
  `mirGui` imports are gone. ⓘ opens λWAVES ABOUT. Pressed again, it returns to the notes if they were showing, otherwise it closes the window.
  Shot: `a6-about.jpg`.
- **A7 LABELS** (`lab/chemview.js`, `lab/rack.js`). The BASIS, METHOD and VIEW segs take `aria:` in place of `label:`. CURVES: after build,
  rack.js removes the CHANNEL and PRESET `.k-lbl` nodes and moves their words to the control's `aria-label` (the kit file is untouched).
  Shot: `a7-labels.jpg` (MOLECULES under H₂O).
- **A8 CURVES GRID** (`lab/skin.css`). `body .mir-curves { --curves-grid: ink-faint 12 % }`, against the kit's 45 %. It is scoped by the
  panel's class, so a NODES host (chain D) inherits it. Shot: `a8-curves.jpg`.
- **A9 CSB SEARCH TILES** (`lab/lab.css`). The accent outline is gone. Hover shows raised relief and the chosen tile (`.on`) shows the well,
  inset. Shot: `a9-search.jpg`.
- `lab/sw.js` re-written once at the end (`node tests/pwa.test.mjs --write`).

## Tests run (gate 8767 / gd 5767, one browser at a time)
- GREEN: `node tests/first-run.test.mjs` (0 of 13 failing), `node tests/mir-manifest.test.mjs` (alpha.29, 264 files), `node tests/library.test.mjs`,
  `node tests/pwa.test.mjs` (after --write).
- GREEN browser suites: `picker-looks`, `library`, `start` (3/3 scenes), `hide-reveal` (the fold law), `menubar`.
- `node tools/rack-deps.mjs --classes --no-write`: HINGE HOLDS (spectrum at 25, limit 25). The `app` literal is untouched.
- LOCK: nothing re-captured. Chain A touches only the chrome and the Picker; the stage paint is unchanged.

## The CLAUDE.md sentence to add
"Every fold (`.lw-fold`) is the bare chevron: no face, no relief, no lift; its ink answers hover and open (skin.css, 018 A4). A volume row with
no named `thumb` reads `t/<id>.webp`, and a missed picture becomes the formula placeholder (Picker, CSB search, MOLECULES shelf). The scroll pill
prefers the theme's ink (light → white, dark → dark) and flips only past 3:1 (kit `inkOn(rgb, theme)`)."

## For the next chains
- D (NODES): the CURVES label surgery (A7) and the faint grid (A8) live app-side. The grid rule follows the panel's class anywhere. The label
  removal sits in rack.js beside `createCurvesPanel`, so move that one line with the panel when NODES hosts it.
- E (CSB): the search tiles are relief-only now. The search pill's own focus outline is untouched (E5 owns the finder's).

## Open questions for Josh
1. The MOLECULES chooser's 28-px picture beside the name stays hidden on a miss rather than showing a formula: the name select already shows
   the formula, and a formula does not fit in 28 px. It is also still fetched only once the hand comes near (the boot reads nothing). OK?
2. The dark theme's pill ink is pure black (#000, the kit's existing `data-ink="dark"`). Would you rather it be the theme's ink colour?
3. The isomer pane scrolls once there are more isomers than fit below the pager (rare: most families have 2–6).
