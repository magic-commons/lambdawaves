# N1 THE SEAT ROW — build (iteration 013, picker chain)

Josh: "Shorten the buttons for position move pad knob to fit the expand window button so it's on the same row to save window height."

## What changed
- `lab/informational.js`: the fold's chevron (`fold()`, lab/fold.js) is built into the seat row itself (POSITION · PAD · chevron); the
  `.info-more` line under THE WORDS is gone. The fold's bodies, open state (open on a desktop, folded on a phone), aria and key unchanged.
- `lab/skin.css`: `.info-seat` is `minmax(0, 1fr) 56px 30px` — the TOP | BOTTOM seg narrower (≈150 px on a 280 px card), PAD's knob
  beside it, the 30 × 26 chevron at the right edge; the three `.info-more` rules removed (nothing else reads them).
- `lab/sw.js` by `pwa --write`.

## Picture
`n-shots/n1-before-after.jpg` — INFORMATIONAL at first run, 1920×1080: before 399 px tall (chevron on its own line), after 361 px (one row less).

## Tests
`./test.sh node` green · `tests/stage-text.browser-test.mjs` GREEN · `tests/menubar.browser-test.mjs` GREEN (chem.browser-test reads only
the STATUS readout, untouched).

## CLAUDE.md sentence for Sos
Since iteration 013 N1 INFORMATIONAL's fold chevron is the seat row's last cell (POSITION · PAD · chevron, `.info-seat` 1fr 56px 30px), one row less.

## Open questions for Josh
- PAD's knob now sits one column left of the SIZE knobs above it (the chevron took the knob column's right edge); say if PAD should keep
  the knob column and the chevron sit between them instead.
