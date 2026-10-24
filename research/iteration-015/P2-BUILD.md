# P2 THE REVERSE ICON — built (chain W, 2026-10-24)

## What changed
- `lab/img/icons/reverse.svg` (NEW): two counter-pointing arrows, → above ←. It uses a 24-unit box, one 2-unit `currentColor` stroke and
  round caps and joins, the style of plus.svg and the 17 icons in that folder.
- REVERSE (the kit's `trig` in the ramp panel's verbs, which `rowOn` already seats beside RELOAD) wears the icon in place of its word.
  - The road is ADD's: the kit's glyph table takes no app SVG, so the icon is a `span.lw-icon.lw-icon-reverse` painted by the CSS mask in
    skin.css (`--icon: url(img/icons/reverse.svg)`).
  - The seat is RELOAD's: `.pal-rev` shares `.pal-add`'s 40 px inline-flex rule.
- The word moves into the hint. aria-label is `REVERSE`, and the hover hint (control-help's `data-help`, from the title) reads
  "REVERSE · run the ramp backwards". The kit's function is untouched.

## Files
lab/img/icons/reverse.svg (new) · lab/windows/material.js · lab/skin.css

## Tests
Shot `w-shots/P2-reverse.jpg`: PALETTE unfolded, PALETTE · RELOAD (↶) · REVERSE (⇄) on the top row.
`pwa.test --write` at the chain's end (a new file under lab/).

## CLAUDE.md sentence
"PALETTE's REVERSE (iteration 015 P2) wears `lab/img/icons/reverse.svg` (two counter-pointing arrows) through the `.lw-icon` mask, as ADD wears plus.svg;
its word is the hint."

## Calls for Josh
none.
