# Iteration 006 · R THE RESIZEOBSERVER REDS: build report

Branch `it006-ro`, based on `264ea0e` (iteration 005 closed). Nothing was pushed, deployed or tagged, and no test files were added.
The change: `lab/shell/rack-wiring.js` +23, `lab/lab.css` +3, `lab/sw.js` (two precache hashes), and a precondition fix in the
existing `tests/frame-occlusion.browser-test.mjs` (+2 lines).

## The cause

**`lab/mir/shell/rack.js` `createRackMotion` (the kit; FLIP at l.273, its ResizeObserver at l.287, `refresh()` at l.241) runs
inside λWAVES' content-sized racks (`lab/lab.css:32`: `bottom: auto; max-height: 100%; overflow: hidden auto`).**

1. MOLECULES ON stands STATE down (`hidden`). STATE sits in the right rack above four folded cards: PALETTE, OBSERVER, CAMERA
   and CLIP. The kit's MutationObserver calls `refresh()`, and it FLIPs those four cards up. Each starts at
   `translate(0, +46px)`, which is where it was before.
2. The rack is content-sized, so it shrinks to its new content height at once (286 → 240 px). The translated CLIP card is now
   drawn from 240 to 276 px, below the rack's bottom. That is scrollable overflow, so `overflow-y: auto` shows Firefox's thin
   scrollbar. The column loses 6 px of width (offsetWidth 300, clientWidth 294) and every card head narrows from 245 to 239 px.
3. The kit's own ResizeObserver (`rack.js:287`) sees the new card widths. Its stamp includes `c.getBoundingClientRect().width`
   (l.245), so it calls `refresh()` inside the delivery:
   - it cancels the moves (l.261), and the scrollbar goes;
   - it reads the layout, which flushes it;
   - it restarts the FLIP (l.273), and the scrollbar comes back.
4. The dock's observer on the same rack fires in the same round. That is `mir/window/dock.js:167–168` `observeSpan`, created
   through `lab/mir-gui.js:30` `rk.span()`, at depth 5, the shallowest depth in the round. It recorded the rack's width with
   no scrollbar (280). By the next gather the width was 274, but depth 5 is not deeper than the round's shallowest depth, so
   that observation is skipped. Firefox then fires `ResizeObserver loop completed with undelivered notifications.` and
   `lab/main.js:10` puts it in `window.__e`. (The gate kit's own `armErrors`, `tools/gate/gatekit.mjs:180`, records it a
   second time, which is why every error appears twice in `errs`.)

The same thing happens on undo (STATE comes back), and in field-law: `LW.chem.setOn(true)` makes F4 red, and V2 is red because
it reads the same `__e`. The bug was also visible on screen. During the 320 ms motion a scrollbar flashed on the right rack's
inner edge and the cards jumped 6 px narrower (measured below: `motionBars [6, 0]` on the base, `[0]` with the fix).

### How it was found

- **Instrumentation.** I used a throwaway checkout of `264ea0e` (`git worktree add --detach /tmp/it006-ro-dbg`, served on 9672).
  A classic script placed ahead of every module wrapped `window.ResizeObserver`. It tagged each observer with its creation
  stack, logged each delivery with a frame number, the targets, their depth and their contentRect, and recorded the window
  `error`. A script modelled on the history test's 9b scene (NEW → a real click on MOLECULES ON → Ctrl+Z) gave this log:

  ```
  f123 obs21 createRackMotion@mir/shell/rack.js:287  heads: state 0x0, spectrum 0x0, palette/observer/camera/clip/settings 239x32, orbitals 245x32
  f123 obs22 observeSpan@mir/window/dock.js:167 < span@mir/shell/rack.js:1176 < createMirGui@mir-gui.js:30   aside#rack d5 280x220
  f123 ERROR  rack ow300 cw294 sh276 ch240 · cards settings 10+36, state(H), palette 102+36 … clip 240+36   ← translated below 240
  f124 obs22  aside#rack d5 274x220            ← the undelivered notification, one frame late
  f126 obs21  heads 245x32 · obs22 aside#rack 280x220   ← the motion ended and the scrollbar went
  ```

  The first version of this patch also measured every observed box before and after each callback. That forced a layout inside
  the delivery and hid the bug (0 errors). Logging rack state only from the `error` handler left the timing alone, and the bug
  reproduced every time.
- **Two experiments on the same throwaway copy.** Each ran the scene once. Base: 4/4 red.
  - A: `#rack, #rackL { --rack-motion: 0s }`, so the kit's `live()` is false and there is no FLIP. 0 errors.
  - B: `#rack, #rackL { scrollbar-gutter: stable }`, so a scrollbar no longer changes the width. 0 errors.

  Both remove one link of the chain above.
- **Bisect.** Throwaway `--detach` checkouts, each run twice with the same scene:
  - `964cfb0` (the 0.9.4 cut): green.
  - `503997b` (iteration 001, *every first-run window arrives folded*): red.
  - `6590052`: red.

  **The first bad commit is `503997b`.** Folding every card made the right rack a short, content-sized column, and a short
  column is where the FLIP of a card moving up can hang below the bottom. Before that commit the rack was tall enough that it
  never did.

## The fix

The fix is in the app, and the kit is untouched. **A rack shows a scrollbar for its laid-out content and never for its motion.**

- `lab/lab.css`: `#rack.rack-fits, #rackL.rack-fits { overflow-y: hidden; }`
- `lab/shell/rack-wiring.js`, right after the cards are registered: `fit()` decides each rack's class.
  - It reads the rack's content bottom as laid out: the largest `offsetTop + offsetHeight` over its children whose
    `offsetParent` is the rack, plus `padding-bottom`. `offset*` ignores transforms, so the motion's FLIP cannot move it, and a
    hidden card has no `offsetParent`.
  - If that bottom fits in `clientHeight` (with 1 px of rounding), the rack gets `.rack-fits`. If not, the class comes off and
    the rack scrolls with its bar exactly as before.
  - `fit()` writes only when the answer changes, and it runs in a `requestAnimationFrame`, never inside a delivery.
  - It is booked by one ResizeObserver on the two racks and on their cards' `.dev-head` and `.dev-body`, and by a
    MutationObserver on the racks' membership. Those are the same boxes the dock and the motion already observe, so the new
    observer adds no new way to leave a notification undelivered. Its callback only books the frame.
- Nothing changes at rest. Measured on base and fix with the throwaway `check.mjs` at 1500×1000:

  | state | base `264ea0e` | fix |
  |---|---|---|
  | boot | rack bar 0 · sh 286 = ch 286 · rackL bar 0 | the same, with `.rack-fits` (overflow-y hidden) |
  | every right-rack card opened and unfolded | bar **6** · sh 12435 · ch 914 · scrollTop to 11521 | the same: class off, bar **6**, sh 12435, scrollTop 11521 |
  | folded and closed again | bar 0 · sh 286 · scrollTop 0 | the same, class back on |
  | MOLECULES ON, the right rack sampled every frame for 600 ms | bars **[6, 0]** (the flash) · 2 page errors | bars **[0]** · 0 page errors |

  The laid-out bottom matched `scrollHeight` at rest in every state (286/286, 102/102, 240/240; 12436 against 12435 is
  rounding, which the 1 px allows for).

## MIR issue (for the kit; nothing under `lab/mir/` was edited)

> **createRackMotion: a FLIPped card in a content-sized rack raises the rack's scrollbar, and the motion's own ResizeObserver
> re-runs refresh() inside the delivery ("ResizeObserver loop completed with undelivered notifications").**
> `shell/rack.js` `createRackMotion` (alpha.24, l.241–287).
>
> When a card above others hides, folds or leaves, `refresh()` FLIPs the cards below it up. Each starts translated to its old
> place, which is below the column's new bottom. `.mir-rack` and adopted racks are content-sized scrollers (`bottom: auto;
> max-height: 100%; overflow: hidden auto`), so that transform is scrollable overflow and a classic scrollbar appears for the
> length of the motion. The column narrows by the scrollbar's width and every card's width changes. The stamp includes
> `c.getBoundingClientRect().width`, so the motion's ResizeObserver calls `refresh()` inside the delivery. That cancels the
> moves (the scrollbar goes), flushes, and restarts them (the scrollbar comes back). An observer on the rack element at the
> round's shallowest depth (`window/dock.js` `observeSpan`) is left with an undelivered size, and Firefox reports the loop
> error. It can also be seen: a 6 px scrollbar flash and a 6 px card jump for 320 ms.
>
> Suggested fixes, any one of them:
> 1. While a move is running and the rack has no real overflow, hold the rack's `overflow-y` at `hidden`, or give it
>    `min-height` at its pre-motion height until the moves settle.
> 2. Leave card width out of the stamp, or ignore a width change equal to the scrollbar's width while moves are running.
> 3. Call `refresh()` from the ResizeObserver through `frame.read`, not synchronously.
>
> λWAVES works around it in `lab/shell/rack-wiring.js` (iteration 006 R) with `.rack-fits` (overflow-y: hidden while the
> laid-out content fits).

## frame-occlusion line 97 (the other known red): found and fixed, separate from this fix

The rack fix does not touch it, because SHADOW is floated in that row and is not in a rack. **The cause is a stale test
precondition.** Since `503997b` (iteration 001), INFORMATIONAL takes SHADOW's seat, so SHADOW starts **closed** on a first run.
The row pops out SHADOW and checks that its head and body are masked. A closed card floats as a 0×0 box (probe: class
`dev lean closed floating`, every rect `[0,0,0,0]`), so neither is masked. The app is right. The test now opens SHADOW first
(`__LW.layout.reopen('shadow')`) and then pops it out, and the row went green. That exposed the next row, line 118 (a drag
of the floated head while paused). It was red on the first run only:
- a throwaway probe of the same drag read `headMasked: true` at 0, 150, 400, 1000 and 2000 ms;
- the second full run was **7/7 GREEN**.

So line 118 is a timing row under the shared CPU (it reads the mask 150 ms after the drag).

## Gates (final tree, served on 9671/5691)

- `node tests/pwa.test.mjs --write`: wrote the two precache hashes (`lab.css`, `shell/rack-wiring.js`).
- `./test.sh node`: **0**.
- `node tools/rack-deps.mjs --classes --no-write`: **0** (THE HINGE holds, spectrum 25).
- `node tools/new-project.mjs --check`: in step (16117 B).
- `tests/history.browser-test.mjs`: **GREEN**, 45 PASS, including *the MOLECULES undo leaves nothing* (NEW → MOLECULES ON →
  Ctrl+Z, `errs: []`). A second run was also green.
- `tests/field-law.browser-test.mjs`: **GREEN 9 of 9**, including F4 and V2 (water RMS 8.31e-4, worst/ρmax 2.86e-4).
- `tests/frame-occlusion.browser-test.mjs`: line 97 is GREEN after the precondition fix. The first run was red at line 118
  (timing, see above). The second run was **GREEN, all 7 rows**.
- `tests/start.browser-test.mjs`: **GREEN 3 of 3**.
- `tests/menubar.browser-test.mjs`: the first run was RED at l.144. The quick-save diff of changed keys included
  `lambdawaves.q0.session`, the session's own 300 ms flush landing inside the SAVE window. The rerun was **GREEN**, and the
  base was green too. That is a timing row unrelated to the racks.
- THE LOCK was not run, because `lab/field.js` is untouched.

Throwaway material (not committed): `/tmp/it006-ro-scripts/` (`repro.mjs`, `check.mjs`, `occl*.mjs`, `dup.mjs`). The debug
checkout `/tmp/it006-ro-dbg` and the bisect checkouts `/tmp/it006-ro-b{1,2,3,4}` were removed with `git worktree remove`.
