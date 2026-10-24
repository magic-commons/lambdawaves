# M6 THE HUE BUTTON — built (chain M, iteration 015, 2026-10-23)

## What
- Josh: "The color behavoir of the hue icon is that it's grey like the rest but then mouse over shows the colors avail."
- At rest, THE HUE ring is drawn in the ink at its neighbours' .55. The ring is the button's `currentColor` through the same `hue-ring.svg` mask,
  so it is exactly as grey as HOME and FOLDERS in either theme.
- On a hover, a focus or a drag, the button comes to full strength. The wheel's conic gradient (an `::after` that the ring's mask clips) fades in
  over 200 ms.
- `.drag` is set on the press and cleared on its release or cancel (`picker.js`). The colours therefore stay while the hand turns the hue, even
  when the pointer leaves the button.
- The ring still rotates with `--mol-hue` (120 ms), grey or coloured, so the turn reads at rest.
- A first try with `filter: grayscale(1)` made a light grey, paler than the icons beside it. It was replaced by the ink fill.

## Files
`lab/picker.js` (`.drag` on the hue's pointer capture), `lab/skin.css` (`.mm-hue` .55, `.mm-hue-ring` ink and its `::after` wheel, the
reduced-motion list), `tools/m-shots.mjs` (`hue` scene).

## Tests
- `tools/m-shots.mjs hue`: at rest the opacity reads 0.55 and the wheel's opacity 0; under the hand 1 and 1.
- Shot `m-shots/M6-hue.jpg`: left at rest, right under the hand.
- Picker suites: run with M2.

## CLAUDE.md sentence
"THE HUE BUTTON (iteration 015 M6): the ring is drawn in the ink at its neighbours' .55. The wheel's colours fade in on a hover, a focus or a drag
(`.drag`); the ring turns with `--mol-hue` either way."
