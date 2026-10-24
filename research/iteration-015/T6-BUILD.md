# T6 FAST SWITCHING — built (chain T, Opus builder, 2026-10-24; app only, no kit edit)

Josh: "When multiple fast multiwindow switching happens, everything sort of fails to keep up."

## The driver
`tests/window-switching.browser-test.mjs` (headless Firefox, 1600 × 1000): two seeded storms of 30 presses in 3 s over the CSB's TIMELINE latch,
the CSB's door, the timeline's door (T5's swap), the modulation window's switch, SPECTRUM's fold, WAVE's raise and WAVE's fold. After each
storm (1.5 s for the motion to land) it asks: the TIMELINE's and the modulation window's `hidden` (pane and rail) follow `isOpen`, the window
fully shown when open; a folded card has no body height and an open one has; `#transport` carries no running animation; the transport sits
at the seat a fresh dodge would choose (`modDodge`'s own seat law re-computed); the frame mask is the one a fresh refresh hands over (the ink's
own dirty, no layout); no console error.

## What it found, and the fixes
1. **A STALE FRAME MASK** (seed 2, every run): after the storm the right rack's cards sat 2–5 px from where the mask had them. The kit's rack
   folds a card's height and slides its neighbours with WAAPI (`core/motion.js`): nothing mutates when they land, so the last refresh — taken
   mid-slide — was kept. Fix (`lab/shell/ink.js` `landing()`): whatever is running in the racks or `#floats` when the block is read dirties it
   once more when it lands (one wait at a time; an endless animation is skipped). A ResizeObserver on the racks was tried first and did not
   catch it (and logged the browser's RO-loop warning) — dropped.
2. **THE DROPPED DODGE** (by reading, the plan's named row): `modDodge` asked while the pill was moving re-asked only when no window was open,
   so a window that opened mid-move could land on the pill. Now the last dodge is always re-asked 320 ms later (`dodgeAgain`,
   `lab/shell/modulation.js`). The storms never hit that window on this machine — the seat law read green before and after.
3. **`presence()` reversals**: held. The kit's presence reads the current opacity / translate / scale when a show reverses a hide, and lands
   `hidden` only for the motion that is still its own; every storm ended with `hidden` matching `isOpen`. No change.

## Files
`lab/shell/ink.js` · `lab/shell/modulation.js` · `lab/sw.js` (pwa --write) · `tests/window-switching.browser-test.mjs`. No shot (nothing to see:
the mask is the line pass's).

## Tests
`window-switching` GREEN ×4 (RED on seed 2's mask before fix 1) · `frame-occlusion` GREEN alone; its two flaky rows (the modulation chip gap,
line 41, and the known detached-gap row, line 100) each read red once in seven runs — the chip-gap row also read red once on the T5 tree
without these fixes, so neither is this row's · `timeline` GREEN.

## The CLAUDE.md sentence
In the stage frame/axis mask paragraph: "A mask read while a rack or `#floats` animates is read again when the motion lands (`ink.js`
`landing()`, iteration 015 T6); `tests/window-switching.browser-test.mjs` storms 30 presses in 3 s and checks hidden, the pill's seat and the
mask."

## Calls for Josh
None. If a storm on the iPad still lags, the next suspect is the frost: each opening window re-blurs the stage behind it.
