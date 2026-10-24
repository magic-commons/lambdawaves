# P1 THE LIST ALIGNED — built (chain W, 2026-10-24)

## What Josh saw, measured
The row is a flex row in both engines, so that was not the cause. The fault is **Firefox's intrinsic sizing**. The strip is an empty `<i>`
with only `flex: 0 0 72px`, so its intrinsic width counts as 0. Firefox sized the pane from the names alone: 116 px wide, rows 90 px. Each
strip then trailed its own name and overflowed the row, with lefts at 57 … 109 px: the zig-zag. Chromium happened to include the basis, and its
strips stood in one column at x = 109. Measured with `/tmp` scratch drivers (headed Chromium; Firefox through gatekit).

## The fix (`lab/skin.css`, `lab/windows/material.js` palPick)
- `.pal-strip` gets a real `width: 72px` beside its basis.
- The name is its own flex item, `span.pal-name`. palPick moves the row's text node into it, with `flex: 1 1 auto; min-width: 0`, ellipsis.
- The pane reserves its scrollbar's room (`scrollbar-gutter: stable`). Without it, Firefox's classic scrollbar took 12 px out of the names'
  width and "Rose window" ellipsised.
- After: Firefox's pane is 200 px. All 35 rows are 174 px wide and every strip's left is 109 px, the same column as Chromium's. The gap between
  name and strip is ≥ 14 px.

## Tests
Shot `w-shots/P1-list-aligned.jpg`: left, Firefox after the fix; right, Chromium (unchanged). One straight column of strips in both.

## CLAUDE.md sentence
"PALETTE's list (iteration 015 P1): each row is `span.pal-name` (flex 1, ellipsis) then `i.pal-strip` with a real 72 px width — an empty element's flex
basis alone sized Firefox's pane from the names and the strips zig-zagged — and the pane keeps its scrollbar gutter, so the strips are one column."

## Calls for Josh
none.
