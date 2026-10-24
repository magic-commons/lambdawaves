# M1 THE HEAD — built (chain M, Claude Yan's iteration 015, 2026-10-23)

## What
- The Picker's head, top to bottom (Josh: "Logo (a little bit bigger), Atomic, molecular, etc. Row, and then Home Folder, and Hue. Add a 4th
  button"):
  - the logo, now 56 px (it was 44);
  - the tabs ATOMIC · MOLECULAR · LIBRARY;
  - four round buttons: HOME · FOLDERS · HUE · LOOK;
  - SHOW LABELS (or a volume's search), as before.
- LOOK wears the look in use as its glyph (`ρ`, `arg ψ` …) in STIX. A press opens THE LOOK DROP (`.mm-lookdrop`, on the `.lw-menu` surface at
  .92). It is a 2 × 3 pane of 72 px tiles, centred under the button. It is absolute inside `#lwMenu`, so it overlaps the decks.
  - The tiles: ρ · arg ψ · Im ψ / ● · ⊸ · φ. Each glyph is in the math face. The word is the hint (`title` and aria-label), e.g.
    "Density · ρ = |ψ|²".
  - ● and ⊸ are not in the shipped STIX subset (`lab/fonts/STIXTwoMath-glyphs.txt`; lab/fonts is never touched). A fallback font would differ
    per device, so the two are drawn as a 24-unit SVG at the glyph's em, in the ink.
  - Motion is the Gol note's §4: the spring open (scale .94 × .6 → 1, 320 ms, `cubic-bezier(.2, 1.4, .4, 1)`), the tiles 30 ms apart from 60 ms,
    and a 120 ms close. Reduced motion has none of it.
  - `role="radiogroup"`, each tile a `radio`; the look in use is lit and is the tab stop. ← → ↑ ↓ move AND pick (the radio convention).
    Enter or a press picks and closes. Escape, or a press anywhere else, closes it, and Escape puts the drop away before the Picker.
  - BALLS · STICKS · ESP are greyed on the ATOMIC deck, with the hint "a lone atom: none to show".
- PREF `look` (`lambdawaves.q0.picker`) gains `phase`. The old `.mm-looks` text row is gone, and so is its CSS.
- In this row a pick still repaints only volume tiles, as B4 did. M2 carries the look to every deck.
- The first-run entrance swaps the tabs' and the nav's delays (260 / 340 ms), so they rise in their new order.

## Files
`lab/picker.js` (the head, the drop, `escape()`), `lab/skin.css` (logo, `.mm-lookb`, `.mm-lookdrop`, `.mm-lk`, the keyframes; `.mm-looks`
retired), `tools/m-shots.mjs` (chain M's diagnostic pictures, not a gate).

## Tests
- `start.browser-test` GREEN 3/3.
- `library.browser-test` GREEN.
- `tools/m-shots.mjs head` reads the head's order logo · tabs · nav · opts, the drop centred under LOOK (0 px off), and the glyph face STIX Two
  Math. Shot: `m-shots/M1-head.jpg`.

## CLAUDE.md sentence
"THE HEAD (iteration 015 M1): the Picker's logo is 56 px, over the tabs, over four round buttons HOME · FOLDERS · HUE · LOOK. LOOK wears the look in
use and opens THE LOOK DROP (`.mm-lookdrop`). The drop is a 2 × 3 radiogroup of 72 px tiles, ρ · arg ψ · Im ψ / ● · ⊸ · φ, in STIX with the word
as the hint. It is centred under LOOK and over the decks, with the Gol spring and a 120 ms close. BALLS · STICKS · ESP are greyed on ATOMIC.
PREF `look` gains `phase`."

## Calls for Josh
- PLAN call 1 stands: the sixth look is arg ψ (WAVE's PHASE).
- "Center aligned" is read, as the brief says, as centred under the LOOK button, not on the page. The pane sits 80 px right of the page's
  centre line. Centring it on the page is a one-line change (`left: 50%`).
