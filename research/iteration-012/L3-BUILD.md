# L3 — THE FIRST RUN'S ENTRANCE (iteration 012, branch `it012-library`)

## What changed
- **A new reader meets the MOLECULAR deck first.** `lab/rack.js`: when the photosensitivity notice was up at boot (`warning.open`, i.e. this
  browser had not seen it), CONTINUE opens the Picker with `{ first: true }`; `picker.js open()` then sets MOLECULAR current before the decks
  are laid and scrolls to it. A returning reader's Picker is unchanged (ATOMIC, the iris from the home button).
- **The notice on the Picker's own ground, no window behind it** (`lab/lab.css`, `lab/main.js`): `warning.show()` adds `body.lw-notice`; under
  it a full-screen ground in the Picker's own tint and frost (`hsl(var(--glass-tint) / .985)`, frost `.62` + its blur) sits under the notice
  (z = banner + 5 < the dialog's banner + 10), the stage words, the atom labels and the transport hide as they do under the Picker, and the
  kit's notice loses its pane (no fill, no edge, no shadow, no blur): the sign, the words and CONTINUE stand on the ground. The notice itself
  is still the kit's `photosensitivityNotice` — nothing under `lab/mir/` changed. λWAVES' law is unchanged: shown once per browser, no query
  string silences it for a human, a driver skips it, `?warn=1` forces it; the AUTOMATION BYPASS (main.js `installLayer`) is untouched.
  The ground is lifted by `accept()` when no Picker opened, else by the Picker 700 ms into its fade (it is the same colour, so nothing jumps).
- **CONTINUE → THE ENTRANCE** (`skin.css #lwMenu.first`, `picker.js entrance()`): the menu fades in (0.6 s, no iris), the logo drops from the top
  (820 ms, −56 px), the nav icons, the tabs and SHOW LABELS rise in turn (620 ms from +14 px, at 260 / 340 / 420 ms), and the first page's
  molecules come one at a time in reading order — each at its turn (one every 30 ms at the soonest, after 300 ms) AND only once its picture
  has decoded, chained so none ever shows out of turn (logged: tile 0 at 351 ms … tile 31 at 1 399 ms, strictly in order). A tile's rise is
  its picture's arrival (the late-load "develop" is finished at the turn, so nothing fades twice).
- **The loading, ordered to match** (`picker.js`): the page on show of the section in view is made first and its pictures are asked for
  `loading=eager`, `fetchpriority=high`, in tile order (`hot`); its neighbours follow, lazy (`near()` now fills the page, then k−1, k+1). And
  a deck whose geometry did not change keeps its tiles: the open's first ResizeObserver call used to tear down every deck and ask for every
  picture again (it also threw away the tiles the entrance was dealing).
- **`prefers-reduced-motion`**: the end state at once — no fade, no drop, no rise, every tile shown (checked with Firefox's
  `ui.prefersReducedMotion = 1`: the menu at opacity 1, 0 tiles hidden, no animation on the logo, 250 ms after CONTINUE).

## Measured (`research/iteration-012/l3-entrance-probe.mjs`, fresh headless Firefox profile each run, 1920×1080, gate server 9501)
From the press on CONTINUE to the MOLECULAR deck's first page (32 tiles):

| | pictures all loaded (median) | last tile visible, settled (median) |
|---|---|---|
| before (L2's Picker; the reader presses MOLECULAR at once — it opened on ATOMIC) | 430 ms (399–480) | 917 ms (855–934) |
| after (L3: opens on MOLECULAR, the entrance) | 380 ms (363–397) | 2 001 ms (1 930–2 018) |

The pictures arrive ~50 ms sooner (the hot page first, no second build). The last tile settles later **by design**: the one-by-one sequence
Josh asked for spans ~1.1 s (32 × ~31 ms) plus its 420 ms rise. The step is one number in `entrance()` if he wants it quicker.

## Files
`lab/main.js` (two lines in `warning`) · `lab/rack.js` (the first-run flag at the Picker's boot seat) · `lab/picker.js` · `lab/skin.css` (THE ENTRANCE
block) · `lab/lab.css` (THE NOTICE ON THE PICKER'S GROUND) · `lab/sw.js` · `research/iteration-012/l3-entrance-probe.mjs` · `l-shot.mjs` (`SHOT_READY`).

## Tests
`./test.sh node` green · `tests/start.browser-test.mjs` GREEN 3/3 (its meaning unchanged; no string moved) · `rack-deps --classes` HOLDS.
Shots: `l-shots/l3-notice.png` (the notice on the ground), `l-shots/l3-entrance-mid.png` (~0.8 s in), `l-shots/l3-entrance-end.png`.

## CLAUDE.md sentence for Yan
THE FIRST RUN'S ENTRANCE (iteration 012 L3): while the photosensitivity notice is up `body.lw-notice` lays the Picker's own ground under it and
strips its pane (`lab.css`; the notice stays the kit's, the law λWAVES'); CONTINUE on a first run opens the Picker on MOLECULAR with THE
ENTRANCE (`open({ first: true })`: the menu fades, the logo drops, the icons rise, the first page's tiles come one by one in order as their
pictures — asked for first, eager and high — decode); reduced motion shows the end state; a deck with unchanged geometry keeps its tiles.

## Open questions for Josh
1. The sequence takes ~1.4 s to deal 32 molecules; quicker (20 ms a tile ≈ 1 s) or slower?
2. The ground under the notice is the Picker's frost — with B1's blur back it blurs the booting lab behind it, exactly as the Picker does.
