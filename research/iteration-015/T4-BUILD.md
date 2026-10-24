# T4 THE FIXED BAR — built (chain T, Opus builder, 2026-10-23; app only, no kit edit)

Josh: "Try not to let the base CSB (not expanded) bar not move around or resize too much. Have it be strongly fixed having and only
changing majorly if switching between hydrogen and molecules."

## What changed (`lab/lab.css`, with T1's stage t)
- **t** a fixed 16 ch on the stage seat (T1), tabular — it no longer takes "the rest" of a `max-content` bar, which made the bar follow its
  string (458 px at t = 0, 477 at 1234.50, 499 at 98765.43).
- **The chooser** (MOLECULES' ‹ MOLECULE ›) a fixed 220 px (`flex: 0 0 220px`, min = max = 220, the name clipped by the select's own
  ellipsis) — it was `flex: 1 1 220px` between 160 and 240, so a long name (a volume molecule) widened the bar 668 → 702.
- **The BPM number** tabular again: the card rule's `font:` shorthand reset `font-variant-numeric` (the kit's tabular was lost); the pill
  is a fixed 72 / 88 px besides.
- **The expander** already never widens the bar on the stage (the kit's `panelPart` pins the bar's width while the panel shows); it grows
  the bar's height, from the edge the bar is seated at. Unchanged.

## The probe (`tools/csb-probe.mjs`, headless Firefox on the gate server, 1600 × 1000) — `#transport`'s width in px
| seat · mode | base 422f658 | after T1 + T4 |
|---|---|---|
| STAGE · HYDROGEN (boot · playing · t 1234.5 · t 98765.43 · expander open/shut · back from MOLECULES) | 458 · 458 · 476.8 · 476.8 · 476.8 / 498.7 · 476.8 | 494.8 at every row |
| STAGE · MOLECULES (on · t 1234.5 · a long name · expander) | 667.8 · 667.8 · 702 · 702 | 682 at every row |
| FREE · HYDROGEN / MOLECULES | 280 / 280 | 280 / 280 (height 146 / 186: the chooser's line) |
| RACK · HYDROGEN / MOLECULES | 262 / 262 | 262 / 262 (height 146 / 186) |
Heights on the stage: 102 px at every unexpanded row, both modes. The bar changes only between the two modes (494.8 ↔ 682).

## Files
`lab/lab.css` · `lab/sw.js` (pwa --write) · `tools/csb-probe.mjs` · shot `t-shots/T4-bar.jpg` (MOLECULES on the stage, a long name clipped,
the expander open).

## Tests
`tests/menubar.browser-test.mjs` GREEN · `tests/timeline.browser-test.mjs` GREEN 14/14 · pwa --write PASS.

## The CLAUDE.md sentence
In THE CONTROL SURFACE paragraph, after A1 + A8's columns: "THE FIXED BAR (iteration 015 T4): on the stage t is a fixed 16 ch of tabular
numerals, the chooser a fixed 220 px and the BPM tabular, so the bar is 494.8 px in HYDROGEN and 682 in MOLECULES whatever t, the tempo, the
molecule's name or the expander say (`tools/csb-probe.mjs`)".

## Calls for Josh
None. (The expander still grows the bar's height from its seated edge — at the stage's foot it rises; say if it should always hang down.)
