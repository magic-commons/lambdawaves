# T1 THE TIME — built (chain T, Opus builder, 2026-10-23; app only, no kit edit)

Josh: "Timeline time should not be a math font … we can use a sans serif font that's smaller. Use a font that doesn't adjust in length
much. I think it's called fixed kerning?" — the word is tabular (fixed-width) figures: every digit the same advance.

## What changed
- **The timeline work bar's t** (`lab/skin.css`, the A5 face rule): the label `t` is `--font-ui` (Roboto) 13 px upright, the value
  `--font-ui` 18 px upright with `font-variant-numeric: lining-nums tabular-nums`, `white-space: pre` (the two spaces before the lap
  hold), left-aligned in a fixed `16ch` — "99999.99  (9999.9)", the longest `compact()` form, fits — so a turning t never moves ⏮ and
  the door beside it. The STIX italic 18 / 26 px is gone from this seat (BASINS keeps its own decade reader).
- **The CSB's t** (`lab/lab.css`): the value takes the same tabular lining numerals and `white-space: pre`; on the STAGE seat
  (`:not(.docked, [data-place="free"])`) the readout is `flex: 0 0 auto; width: 16ch` at 13 px — it no longer takes "the rest" of the
  timing row, so the bar's width cannot follow the string (T4 pins the rest). The card seats (docked, FREE) keep A11's `flex: 1 1 0`.
- Measured at t = 1234.5 (`tools/t-shots.mjs bars`): CSB t 844–961 (117 px = 16 ch at 13 px), Roboto 13 px, tabular; timeline t
  569–752, Roboto 18 px, tabular, upright.

## Files
`lab/skin.css` · `lab/lab.css` · `lab/sw.js` (pwa --write) · `tools/t-shots.mjs` (reads `.ro-val`) · shot `t-shots/T1-time.jpg` (CSB above,
the timeline's work bar below).

## Tests
`node tests/pwa.test.mjs --write` PASS; the browser suites run after T4 (they read the same bar).

## The CLAUDE.md sentence
In THE FILM paragraph, after "t with the lap in brackets (`ui.tlTime` …)": "in the UI face, 13 px t over an 18 px value in tabular
numerals, a fixed 16 ch (iteration 015 T1)".

## Calls for Josh
None.
