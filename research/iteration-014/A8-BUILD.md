# A8 THE LAYOUT — built (builder A-bar, round 2, 2026-10-22; Josh's answers after seeing A1–A4)

## What changed
- Kit `CONTROL_SURFACE_LAYOUT` (alpha.25, same unreleased round) is three columns:
  - `csb-col csb-play`: play, power.
  - `csb-mid`: the timing row (rewind · app:time · openers · door · app:gear · dock) over the buttons row (app:modes · app:chooser ·
    app:search · app:add · app:rack · app:fav).
  - `csb-col csb-tempo`: app:rate, tempo.
  - The panel spans the bar underneath. transport.css draws it as a grid on the stage and as bands in a rack card (`.docked` /
    `[data-place="free"]`).
- On the stage: PLAY 56 px (1.6×) with a raised round face, centred in the bar's height, MOD under it. Seats are 40 px with 20 px glyphs
  (1.4×), RATE and the BPM pill keep today's size, the bar is 668 × 102.
- In a rack card: PLAY 48 + MOD left and RATE + BPM right as the first band, then the timing row, then the buttons (modes · search · + ◧ ☆;
  the chooser on its own line). Seats are 32 px; the expander is one column. Nothing is clipped; the wrap is designed, not random.
- The door wears `lab/img/icons/modulation.svg` as a CSS mask (kit `modDoor({ mark: 'none' })`). λWAVES' mark and the MIR diamond are
  off the CSB.
- The turning mark is the kit's new unplaced part `logoButton({ mark, label, run })` (`.mir-logo-btn`), named in docs/FOR-MIR.md: THE MIR
  LOGO BUTTON.
- SCRUB left the bar in every seat. `ui.scrub` is still built and unmounted, so a preset's, CLEAR's and a restore's `ui.scrub.set(0)`,
  KEEP FRAMES and the facade stand. The menubar test's "playhead 0" now reads the t readout (re-aimed, not deleted).
- No vertical mode: the VERTICAL chip, `data-orient`, `setOrient` and the vertical CSS are gone, and the seat store writes `{ v: 2, seat,
  place }`.
- FREE: the kit window is one rack card wide (`freeWidth: () => app.sh.rackCardWidth()`; the slot `app.sh.rackCardWidth` is now filled
  in rack-wiring) and wears the card drawing. It lives on `#floats` (`freeHost`), in the windows' stack.
- THE SEARCH PILL (`lab/csb-search.js`, rewritten):
  - The bar holds a SEARCH button. It, or Mod+K (new key row `csb.search`, group CONTROL SURFACE), opens a typable pill above the bar,
    below it near the top, and beside the card when docked or free.
  - The ≤ 6 tiles sit above the pill. Escape or a press elsewhere closes both, and the unfolding glyph is gone.
  - keyboard-window's group list now expects CONTROL SURFACE first (re-aimed).
- The expander's first row is tidied: ‹ › ⟳ are one group of 30 px round seats, then REPEATS (the readout's word over its value) and the
  formula filling the rest, aligned on one line with a hairline under; in a card the formula wraps under. Nothing was deleted.
- Files: lab/mir/shell/transport.js + .css, docs/FOR-MIR.md (two lines), MIR-MANIFEST.json + tests/mir-manifest.test.mjs (re-pinned),
  lab/shell/transport.js, lab/csb-search.js, lab/shell/keys.js, lab/shell/rack-wiring.js, lab/lab.css (the CSB block rewritten),
  lab/sw.js, tests/menubar + keyboard-window.

## Tests
- `./test.sh node` green; rack-deps green (transport 14, keys 16; HINGE holds); `pwa --write` run.
- Green: menubar · history · new-project · frame-occlusion · keyboard-window (after the re-aim) · timeline · lw-links · library ·
  register · molecule-head · start.
- Checked by hand: Mod+K opens the pill and Escape closes it; "me" gives six tiles above the pill; the free window is 282 px wide with
  only the ×.

## Shots
`a-shots/A8-stage.jpg`, `A8-stage-open.jpg`, `A8-docked.jpg` (expander open), `A8-free.jpg`, `A8-search.jpg`.

## CLAUDE.md sentence (replaces A1's row list and A4's VERTICAL clause in THE CONTROL SURFACE)
"A8 THE LAYOUT (Josh 10-22): three columns — PLAY (56 px) over MOD · ⏮ t TIMELINE door(sine, `img/icons/modulation.svg`) ⚙ dock over
LIBRARY MOLECULAR HYDROGEN ‹ MOLECULE › SEARCH + ◧ ☆ · RATE over BPM; 668 × 102, seats 40 px; in a rack card (docked, or FREE one card wide on
#floats) the same columns as bands; no SCRUB (ui.scrub built, unmounted), no vertical mode; SEARCH (or Mod+K, `csb.search`) opens a pill above
the bar with the ≤ 6 tiles above it; the turning mark is the kit's unplaced `logoButton` (THE MIR LOGO BUTTON)."

## Questions for Josh
1. The t readout takes the timing row's free room, so the latch, door, ⚙ and dock sit right. Should they sit beside ⏮ instead?
2. In the card the BPM pill keeps today's 72 px, and its number sits close to "BPM". Should the card pill grow?
