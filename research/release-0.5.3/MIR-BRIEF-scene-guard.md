# MIR BRIEF · the scene guard's rects (`shell/scene-guard.js` `rectOf` and the work-bar union)

Filed by λWAVES 0.5.3 M4 (B-STAGE, 2026-10-10), and not built. `lab/mir/**` is adopted and read-only in λWAVES, so this change belongs
in MIR first and is then adopted. The kit file is `lab/mir/shell/scene-guard.js`, MIR 1.5.0-alpha.24, sha in `lab/sw.js` `0c41641e90c5`.

## Why
Josh, 0.5.3 ASK: "Sometimes the screen is unclickable and can't move the scene." §11: "linux and just clicking around, but MIR racks are
fine." The stage asks the guard `hit(e)` before every press, double-click and wheel (`install: false`, as in BASINS). Anything that `uiSpace()`
puts in the list is dead stage while it is listed. The guard has two blind spots. λWAVES can close only the app's own `extra()` list, and
did so in 0.5.3 (`lab/shell/rack-wiring.js:304`). The other two are in the kit:

1. **`rectOf` (:128-132) reads only `hidden` and `getClientRects().length`.** It has no style read. So a float-layer window that is laid
   out but not seen still counts as UI space: one mid-exit (the kit's `presence(el, false)`, `core/motion.js:158-171`, keeps the node shown
   until its fade ends, and `opacity` animates to 0 first), one at `visibility: hidden`, or one faded to `opacity: 0` by an app rule. The
   rack columns already skip these cases (`visibleBox` :120-126 makes one style read and tests `visibility` and `opacity`). The floats do not.
2. **The work-bar union (:153-154) is a bounding box.** `union([r, ...bars])` makes one rect from the modulation window's root and every
   `.m2workbar`. When a bar sits away from the root (the comment says "work bars can sit outside the root's box"), the clear stage between
   them becomes UI space, though nothing is painted there.

## What `rectOf` should test (the proposal)
- Keep the present tests: `hidden`, `getClientRects().length`, and a box larger than 0×0.
- Add one style read, as `visibleBox` does: skip the node when its computed `visibility` is `hidden` or its computed `opacity` is `0`.
- **Do NOT skip on `pointer-events: none` on the root.** The modulation window's root is pointer-transparent on purpose (`modhost.css`
  entry 25; the λWAVES probe saw the root at 8,267 → 1592,707 with its devices and bars taking the presses). The gaps between a window's
  parts are UI space by C9's law (`tools/hit-probe-set.mjs`: 71 gap presses, 0 reached the stage on λWAVES 0.5.3 M4). An app pane that
  is click-through as a whole (λWAVES' `#rackFavList` under `body.rack-hidden`: opacity 0 and pointer-events none) is the app's to filter,
  and λWAVES now filters it.
- **A window that is leaving gives up its space when its exit starts, not when it ends.** `presence(el, false)` should mark the node (a
  `data-leaving` attribute, or `inert`, which also takes focus out) for the length of its exit, and `rectOf` should skip a marked node.
  Today the space comes back only when the fade finishes and `hidden` is set.

## The union, per bar
Push the root and each laid-out bar as separate entries, each with the root's `scroll` (`row || port…`), instead of one union:
`out.push(entry(r)); for (const b of bars) out.push(entry(b));`. `regionAt` already takes the first rect that holds the point, so a
press between the root and a stray bar falls through to the picture. A wheel over a bar still reaches the device row.

## Measured on λWAVES (0.5.3 M4, `tools/stage-dead-probe.mjs`, 1600 × 1000, a 24 px grid, headless Chromium on the RTX 3070)
- The modulation window open with three LFOs and their bars (scene 3): **0 points** dead from the union. In λWAVES' layout the bars lie
  inside the root's 1584 px box (174 gap points, all inside the root or a bar). The union does not bite on this desktop today. It would bite
  in a narrower window or with a bar moved away from the root. The per-bar entries are preventive here.
- Faded float-layer windows: **not seen** in the ten static scenes. A window's exit fade is transient, and the probe reads settled scenes.
  The exit-time mark is the honest fix whatever the duration.
- The case that was live is app-side and is fixed in λWAVES (`#rackFavList` left open when the rack folds by its key: 22 dead points at
  1044–1284 × 132–156 before, 0 after).

## A test for the kit
A node case beside `regionAt`'s: `uiSpace({ layer, view })` with a stub `view.getComputedStyle`:
(a) a float at `opacity: 0` → not listed;
(b) a float at `visibility: hidden` → not listed;
(c) a root at `pointer-events: none` with a visible child → listed;
(d) a root at (0,0,100,100) with a bar at (300,0,400,40) → a point at (200,20) is not a hit, and (350,20) is a hit whose `scroll` is the
root's row.
