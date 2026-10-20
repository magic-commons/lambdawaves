# P1 THE EDGE OF THE PAGE — build (iteration 013, picker chain)

Josh: "When a table/page scrolls left or right, it seems to get cut off by an invisible border … at least fade it out by an invisible gradient so that it isn't a hard cut off."

## What changed
- `lab/skin.css` `#lwMenu .mm-pager` / `.mm-pages` (the Picker's deck, both MOLECULAR and a LIBRARY volume's): the pages container runs
  `--fade` (40 px; 12 px under 700 px, the deck's own `narrow`) past the grid on each side (`padding-inline`, `box-sizing: content-box`)
  and wears the tag strip's gradient mask over that margin — a tile sliding out fades to nothing instead of being cut at the grid's edge.
- The pages sit `2·--fade` apart (`column-gap`) and snap with `scroll-padding-inline: --fade`, so page k still starts at
  `k × clientWidth` — `picker.js`' `pageTo`, `lay` and the scroll handler are untouched. At rest no neighbour shows (probe: page 2 at
  40 px, page 1 ends at −40, page 3 starts at width + 40).
- The ‹ › arrows keep their place on screen (`calc(100% + 14px − --fade)`); the inner part of the fade runs under them.
- `lab/sw.js` by `node tests/pwa.test.mjs --write` (skin.css bytes).

## Pictures (1920×1080, MOLECULAR, the deck scrolled 0.56 page, snap off for the photo)
`p-shots/p1-before-midswipe.jpg` (hard cut at x 321 / 1599) · `p-shots/p1-after-midswipe.jpg` (the tiles fade out over 40 px).
Tool: `research/iteration-013/shot.mjs` (012's l-shot, JPEG out).

## Tests
`./test.sh node` green · `tests/start.browser-test.mjs` GREEN 3/3.

## CLAUDE.md sentence for Sos
Since iteration 013 P1 the Picker's deck (`.mm-pages`) runs `--fade` (40 px, 12 px on a phone) past its grid each side under a gradient mask, pages `2·--fade` apart with `scroll-padding-inline: --fade`, so a sliding page fades instead of being cut and page k still starts at k × clientWidth.

## Open questions for Josh
- The seam between two pages reads as an 80 px gap mid-swipe (the price of no neighbour at rest); a smaller fade narrows it.
