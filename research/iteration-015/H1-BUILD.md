# H1 THE PILL OUTSIDE — built (chain H, 2026-10-23; kit 1.5.0-alpha.26)

Josh 10-23: "Do not let the bubble touch or overlap the rack window." His 10-22 answer that the bar sits "at the pill's tip" (A10) and
A11's eyebrow seat are both superseded by these words: a pill cannot be outside the window and at the rack's outer scrollbar at once.

## What changed (kit)
- `createRackPills`' `seat()` (`lab/mir/shell/rack-scrollbar.js`) places each window's pill OUTSIDE the card, over the stage, centred on
  the `.dev-head`:
  - left rack: its left edge `PILL.gap` (now 8 px) right of the card's inner (right) edge; right rack: its right edge 8 px left of the
    card's left edge;
  - pushed further out past the scrollbar where one shows: the seated track's thumb (BASINS' `scrollbar: true`), else — when the rack
    overflows with no seated track, λWAVES' case — the rack's inner edge, where the native 2-px bar lies;
  - the name whole: `width: max-content`, no `max-width`, no ellipsis (A11's INFORMATIO… is gone);
  - one measure per burst, one transform per scroll, as A6 — no new work.
- `lab/mir/shell/rack.css`: a 6-px tail (an 8-px square turned 45°, `.rack-pill::before`, the pill's own fill) on the side facing the
  window (`.rack-pills[data-side]`); the clip-path mask now opens FROM the tail (left rack left → right, right rack right → left) and
  reaches 8 px past the box so the tail is revealed with it; 180 ms, the accent and the 900 ms linger unchanged; OFF · A · B unchanged.
- `lab/mir/version.js` 1.5.0-alpha.26; `docs/FOR-MIR.md` new `## FROM λWAVES, FOR THE KIT (1.5.0-alpha.26)` heading + one line;
  `MIR-MANIFEST.json` re-hashed (`manifest.py`, sha 894b8322b7ac pinned in `tests/mir-manifest.test.mjs`); `lab/sw.js` via pwa --write.

## Measured (headless Firefox 1500 × 900, every window raised so both racks scroll)
- left rack 0–300 (card 10–284, native bar at its right edge): pills INFORMATIONAL 308–432, SPECTRUM 308–396 (tail tip ≈ 302);
- right rack 1200–1500 (card 1216–1490): pills HISTORY 1117–1192, CURVES 1123–1192, RENDER 1123–1192 … (tail tip ≈ 1198);
- pills touching a visible card: 0 on both racks. Shot: `h-shots/H1-pills.jpg` (SPECTRUM left, CURVES and RENDER right).

## Files
`lab/mir/shell/rack-scrollbar.js` · `lab/mir/shell/rack.css` · `lab/mir/version.js` · `docs/FOR-MIR.md` · `MIR-MANIFEST.json` ·
`tests/mir-manifest.test.mjs` · `lab/sw.js` · `research/iteration-015/h-shots/H1-pills.jpg`.

## Tests
- `tests/frame-occlusion.browser-test.mjs` (LW_PORT 9611): every row PASS.
- `node tests/mir-manifest.test.mjs`: PASS (alpha.26, 264 files).
- No suite owns the pill (`tests/rack-pill` does not exist); the probe that measured it was a scratch script, not shipped.

## The CLAUDE.md sentence (THE CONTROL SURFACE, A6 + A10)
Replace "since A11 the pill lies on the window's EYEBROW … the scrollbar" with: "since iteration 015 H1 the pill floats OUTSIDE the
window over the stage, 8 px clear of the card's inner edge (and of the rack's scrollbar), centred on the title bar, a 6-px tail pointing
at the window, the name whole, its mask opening from the tail (Josh 10-23: "Do not let the bubble touch or overlap the rack window")".

## Calls for Josh
- PLAN call 2 stands as built: over the stage side, 8 px clear. The other road (a widened gutter at the scrollbar) costs the cards ≈ 40 px.
- A pill of a window near a rack's top or bottom edge is clipped by the rack's own height (as since A6); say if it should clamp inside.
