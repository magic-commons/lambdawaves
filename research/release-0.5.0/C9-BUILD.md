# C9 · THE SCENE GUARD, THE HIT-PROBE SET AND R14 — build hand-off (2026-10-08, the C9 builder, Opus 5.5)

**In ten lines.**
1. The stage's pointer road now goes through MIR 1.5's `createSceneGuard({ install: false })`, built in `lab/stage-gestures.js`.
2. `rack.js` hands it the kit's `uiSpace`: the float layer's windows by their whole rects, plus the app's panes.
3. A press, a touch tap, a double-click or a wheel in a window's gap now starts nothing on the stage. `STAGE_BINDINGS` is unchanged.
4. The hit-probe set is `tools/hit-probe-set.mjs`: ten scenes driven through the kit's own `probe()`.
5. On this tree, **52 presses through a kit window's gap reached the stage 0 times**. On the adopt alone, 52 of 52 reached it.
6. R14: the device-lost recovery is now named `function gpuRecovery(i)`, in place. Its gate is `tests/gpu-recovery`.
7. `LW.thumbnail()` is the `thumbnail()` C6 will hand to FOLDERS. Capture's readability probe chooses its road: the canvas, or a GPU readback.
8. `tests/gpu-recovery` gains two cases. THE THUMBNAIL PROBE checks both roads are lit; THE GPU RECOVERY destroys the device.
9. Skipped: the `[data-mir-offer]` case in `offer` (brief 9′ is not in alpha.24).
10. `lab/*.js` 36,288 → 36,469 after the adopt (+181, generated precache rows) → **36,482** (C9 **+13**). No blockers.

| | |
|---|---|
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a63344dfd9350ca1b` |
| branch | `worktree-agent-a63344dfd9350ca1b`, reset to `7044f37` (the `sos-s0` tip) |
| `4cee6c7` | 0.5.0 C: the bare adopt of MIR 1.5 alpha.24 (adopt.mjs --line 1.5; identical to C0's) |
| `a2823bb` | 0.5.0 C9 · THE SCENE GUARD: the stage pointer road through the kit's createSceneGuard({ install: false }) |
| `37ae218` | 0.5.0 C9 · THE HIT-PROBE SET (first count, 58/0 — the float scenes misnamed, see `7b63d5c`) |
| `6ae9973` | 0.5.0 C9 · R14: the GPU recovery named (gpuRecovery), FOLDERS' thumbnail() through the readability probe |
| `7b63d5c` | 0.5.0 C9 · the hit-probe set names its float scenes right: 52 gap presses, 0 reach the stage (52 of 52 before) |
| hand-offs | `a840cef`, `ed01a91`, `58c94ac`, `79c2510` (`C9-HANDOFF.md`), and the docs commit (this file + REPORT wave 200) |
| gate servers | 8823 (this tree, pid 3578115) and 8827 (`.tmp/base` = `git archive 4cee6c7 lab`, pids 3608246 and 3665322) — all started by me and stopped by pid |

## The adopt (`4cee6c7`)

Command: `node ~/Documents/MIR/.claude/worktrees/mir-1.5/tools/adopt.mjs <worktree> --line 1.5`.
- Output: `adopted MIR 1.5.0-alpha.24 (1b7ae99b9905): 196 added, 23 updated, 0 removed, 43 unchanged`.
- Then `node tests/pwa.test.mjs --write`, which exits red on the kit ABOUT's URL but still writes `lab/sw.js`.
- The commit holds only what the tool wrote (`MIR-MANIFEST.json`, `lab/mir/**`, `lab/fonts/info/**`) plus `lab/sw.js`.
- `adopt.mjs --check` at the end: `in step with MIR 1.5.0-alpha.24`.

## The guard's wiring: what reaches the stage and what does not

`lab/stage-gestures.js`:
- It imports `createSceneGuard` from `./mir/shell/scene-guard.js`.
- It takes `ui = () => []` (a rects function) and builds `guard = createSceneGuard({ canvas, rects: ui, install: false })`.
- That follows the kit header's recipe: "the app's gesture engine calls hit(e) and wheel(e, region) itself", as BASINS' `gestures.js` does.

Three sites ask the guard first:

| site | in UI space | on the stage |
|---|---|---|
| `pointerdown` | `… \|\| guard.hit(e)) return;`: no capture, no orbit/slide/special, no focus, no tap | the `STAGE_BINDINGS` table decides, as before |
| `wheel` | `const r = guard.hit(e); if (r) return guard.wheel(e, r);`: no zoom; the wheel goes to the region's scroller (the modulation run `.m2run`), or is swallowed | zoom at the cursor, as before |
| `dblclick` | no reset | `resetView()` |

What still reaches the stage, unchanged:
- A drag begun on the stage keeps its pointer across the UI (the kit's law 4). Moves and releases are never guarded.
- A second finger that lands in UI space does not join a pinch.
- Hover (kepler) is not guarded (`hover: false`, the kit's default).

`lab/rack.js` (the `bindStageGestures` call) passes UI space as
`ui: uiSpace({ layer: floats, extra: () => [the six pane ids].map(paintedRect) + paintedRect('#keymap .km-panel') })`.
- **The float layer (`#floats`)**: every visible child by its WHOLE rect. That covers:
  - the modulation window, unioned with its work bars, scrolling `.m2run`;
  - its chip rail;
  - every floated rack card.
  This is the kit's `uiSpace`, unchanged.
- **extra**: `#transport`, `#notebook` (which holds FOLDERS, the PROJECTS face), `#sheet`, `#offer`, `#rackAddList`,
  `#rackFavList`, and the keyboard panel. These are their painted rects through A7's `paintedRect`; a hidden one is `null`, which
  `uiSpace` drops.
- **Not included: the rack columns.** `#rack`/`#rackL` are pointer-solid, so a press there never targets the canvas. Also,
  `input.browser-test` dispatches synthetic stage presses at (120, 120), which is over `#rackL`.
- Under `body.ui-hidden` nothing is UI space (the kit's law 5).

**One behaviour change for Josh to know: DISCONNECTED is the first-run look.**
- `skin.css` makes `#floats > .dev` pointer-transparent, so before this a press between a floated card's head and body orbited
  the camera.
- It now does nothing: the card's whole rect is UI space. This is the kit's law and Josh's 2026-10-01 words in its header.
- The frame ink still shows through that gap: occlusion is untouched, and `frame-occlusion` is 7/7.

The node test (`tests/stage-gestures.test.mjs`) has a new block. In a UI rect, it checks that each of these starts nothing:
- a press-drag (no yaw, not held, no fling);
- two touch taps (no reset);
- a double-click (no reset);
- a wheel (distance unchanged, default prevented).

The same press made on the stage and dragged INTO the rect orbits by exactly 2.6. A double-click on the stage resets.

## The hit-probe set (`tools/hit-probe-set.mjs`)

It is λWAVES' scene list for the 1.5 `tools/hit-probe.mjs`.
- The kit's tool takes one URL and one selector, and reads no scene file. So the list lives in λWAVES `tools/` and imports the
  kit tool's `probe()` and `gridPoints()` from the 1.5 worktree (`MIR15_TOOLS` overrides that path).
- The browser is λWAVES' `tools/perf/cdp.mjs`: headless Chromium with Vulkan, as A-M runs it.

Each scene runs on a fresh page, after one warm-up navigation:
1. `?sw=0&warn=0`; the notice is dismissed; the clock is paused; auto-rotate is off; fling is 0.
2. The scene is opened through `__LW`.
3. The window's box is hit-tested on the kit's 9 × 9 grid and on a 4 px raster. A point the browser answers with `canvas#field`
   is a GAP.
4. The kit's `probe()` presses at up to 12 gaps: grid gaps first, then raster gaps sampled evenly. Each press is
   `Input.dispatchMouseEvent`, a press and a 40 px drag, with `--watch` on the pose `[yaw, pitch, dist, shift]`.
5. A press REACHED the stage when the pose moved.

A CONTROL presses the bare stage and must move the pose. If it does not, the watch is blind.

Exit 0 means: every window was found, the control reached, and 0 gap presses reached.
Run it as `python3 tools/gate/server.py "$PWD" 8823 &`, then `LW_PORT=8823 node tools/hit-probe-set.mjs [--json out.json]`.

| scene (selector) | raster 4 px: points on the stage | pressed | reached: adopt alone `4cee6c7` | reached: **C9** `6ae9973` |
|---|---:|---:|---:|---:|
| control: the bare stage (`#field`) | — | 3 | 3 | 3 |
| the modulation window open, 3 LFOs (`[data-mir-window="modulation"]`) | 6,240 of 43,560 | 12 | 12 | **0** |
| its chip rail (`[data-mir-rail="modulation"]`) | 0 of 1,005 (the rail sits over the window) | 0 | 0 | 0 |
| a floated card, DISCONNECTED (`#floats > .dev[data-id="shadow"]`) | 93 of 6,525 (head/body gap) | 12 | 12 | **0** |
| a floated card, JOINED | 6 of 6,375 (round corners) | 6 | 6 | **0** |
| the keyboard window (`[data-mir-window="keyboard"] .km-panel`) | 0 of 28,080 | 0 | 0 | 0 |
| the notebook (`[data-mir-window="notebook"]`) | 7 of 18,400 | 7 | 7 | **0** |
| the sheet (`#sheet`) | 4 of 6,710 | 4 | 4 | **0** |
| the offer (`#offer`) | 4 of 4,935 | 4 | 4 | **0** |
| FOLDERS, the notebook's PROJECTS face | 7 of 18,400 | 7 | 7 | **0** |
| **all windows** | | **52** | **52** | **0** |

**The count is 52 gap presses and 0 reached the stage.**
- The results are in `research/release-0.5.0/c9-hit-probe/{before-4cee6c7,after-6ae9973}.json`.
- `37ae218`'s first count (58/0, and 58/58 before) ran two DISCONNECTED float scenes. DISCONNECTED is the default, so its
  "floated card" scene was not joined. `7b63d5c` fixes the names; the count above replaces that one.

## R14

**`gpu-recovery`, named.**
- The device-lost recovery was the anonymous `onLost` arrow in `rack.js` `createField(...)`.
- It is now `onLost: function gpuRecovery(i) { showBanner(…); }`, in place. What it does is unchanged: the banner "the GPU device
  was lost", the FIELD frozen, and the CPU side live.
- The WAVE 59 comment above it names it R14's GPU RECOVERY, with its gate.
- The test keeps the plan's name: `tests/gpu-recovery.browser-test.mjs`, which already existed (boot/reload × 4, grids).
- `field.js`'s own `device.lost` handler is not touched: it is a lock file.

**The thumbnail road.**
- **MIR 1.5 alpha.24 has no readability probe.** Its `mir/` files name none, and the kit's thumbnail road
  `folders.js toThumb(src)` simply `drawImage`s whatever canvas it is handed. The readability probe is λWAVES' own:
  `capture.probe()` and its `canvasReadable` (`drawImage` of the WebGPU canvas came back lit).
- **λWAVES had no `thumbnail()`**: FOLDERS is C6's.
- So C9 adds `LW.thumbnail()`, at the END of the `LW` literal, for C6 to hand `createProjectAdapter({ thumbnail })` /
  `createApp({ thumbnail })`.
- It reads `capApi.capture.probe()`, which is cached for the session, and never waits on a delay of its own:
  - when `canvasReadable` is true, it settles and returns the canvas;
  - otherwise it returns `picture({ width: 320 })`'s PNG blob, from a GPU texture readback;
  - when there is no GPU, `picture` is `{ ok: false }` and it returns `null`.

**The thumbnail probe (NEW, in `tests/gpu-recovery`).** It runs the kit's `toThumb(await __LW.thumbnail())`, decodes the result and
counts lit pixels, on both roads. The second road is reached by flipping the cached reading to unreadable for one call:
- canvas road: 320 × 204, **7,290** lit;
- readback road: 320 × 204, **7,653** lit;
- `__e` is empty after both.

**The GPU recovery case (NEW, in `tests/gpu-recovery`).** It calls `__LW.field.device.destroy()`, then checks:
- `field.ok` is false;
- `field.error` is `device lost: Device destroyed`;
- the banner reads "the GPU device was lost";
- `loadPreset('2p+')` still moves the register;
- `__e` is empty.

It waits on timers, not frames. In 2 of 3 debug probes, headless Firefox held `requestAnimationFrame` for more than 3 s after a
`destroy()`; one rAF requested before the destroy made it fire. That is a test-harness fact, not a recovery fault, and it is
recorded here in case a later gate leans on frames after a loss.

## Skipped: the `[data-mir-offer]` case in `offer`

PLAN §1 G1 and §2 C9 say the case comes "when 9′ lands". Brief 9′ (STATUS TAGS never hides a build offer) is not in alpha.24.
The adopted kit has no `[data-mir-offer]` hook. The app's `.build` exception (`lab.css:40`) and `offer` 16 stand as they are.
When a kit carries 9′, the re-adopt adds the case.

## Tests (8823/5293, one browser at a time, 4 s apart)

| gate | result |
|---|---|
| `bash test.sh node` (run per suite by `.tmp/runnode.mjs`, the same set) | **81/85**: exactly C0's four cascade reds, not fixed here (list below) |
| `node tests/stage-gestures.test.mjs` | 3 PASS lines (the new scene-guard block included) |
| `node tools/new-project.mjs --check` | OUT OF STEP only by `"bpm": 60 → 30`, the adopt's kit default; C0 regenerates. No C9 default changed |
| `adopt.mjs --check --line 1.5` | in step with 1.5.0-alpha.24 |
| hit-probe set | **52 gap presses, 0 reached** (control 3/3); the adopt alone 52/52 |
| `offer` | **GREEN, 16 of 16 scenes** |
| `input` | **13 PASS**, exit 0 |
| `gpu-recovery` | **GREEN**: 4 boot/reload, 4 grids, 2 thumbnail roads, the GPU recovery (11 PASS lines). A first run of the recovery case with rAF waits timed out; rewritten to timers (above) and green alone |
| `frame-occlusion` | **7/7** |
| `menubar` | **8 PASS**, GREEN |
| `keyboard-window` | **RED on the adopt alone too** (`.tmp/base` = `4cee6c7`, 8827/5297): `assert.ok(dragged.x >= before.left + 60 …)` (details below) |
| digest lock | not run: C7 owns the one lock of C, and C9 touches no `field.js`/shader/`writeView` |

C0's four node reds, by first message:
1. `mir-manifest`: "MIR-MANIFEST.json names MIR 1.5.0-alpha.24, which is not an accepted adoption (accepted: 1.4.3)".
2. `new-project`: "tools/new-project.mjs --check: … lab/new-project.lambdawaves.json is OUT OF STEP".
3. `wiring`: "108 modules under lab/ that NO root reaches". On the adopt alone this is 109, derived rather than run:
   `scene-guard.js` imports nothing, and its only kit importers (`app.js`, `panels/lanes.js`) are unreached, so the guard's
   import reaches exactly one more file.
4. `pwa`: "an absolute URL in lab/ that is neither a namespace, a licence, an ABOUT anchor, nor vendor prose" (`lab/mir/shell/gui.js: https://www.fabiandesmet.com/`).

**The keyboard-window red.**
- The drag's press at `.km-header` + 90 px lands on `canvas.shadow-c` inside `section.dev` (the SHADOW rack card).
- `#keymap` computes to `z-index: auto; position: static`, and the panel to `auto absolute`, below the rack.
- This is the adopt's cascade (C0's: kit CSS linked without the `app.*` layer work), not the guard: the press never targets the
  stage canvas.
- Before the adopt it was reported GREEN on earlier `sos-s0` tips (A1-A8-BUILD, A7-BUILD). This builder did not run it on `7044f37`.

## Lines

`cat lab/*.js | wc -l`:

| tree | lines | change |
|---|---:|---:|
| base `7044f37` | 36,288 | |
| after the adopt | 36,469 | +181 (`lab/sw.js` precache rows, generated; C0's identical) |
| the guard | 36,479 | +10: `stage-gestures.js` +6, `rack.js` +4 |
| R14 | **36,482** | +3: `rack.js`, the thumbnail |

**C9's net is +13, not ≤ 0.** The reason: neither job existed in λWAVES, so there was nothing to delete.
- Presses in a gap were simply unguarded. The 162-line guard is the kit's own, under `lab/mir`, and is not counted.
- There was no `thumbnail()`.
- PLAN §2 C9's "what leaves" column is "—".

## Blockers

None.

## Open items

- **C0 / the integrator: `keyboard-window` is red after the adopt.** The keyboard panel stacks under the rack; see Tests. It is
  not C9's. C0's cascade should make it green again; if not, `#keymap` needs a stacking context above `--z-chrome`.
- **C6:** hand `LW.thumbnail` to FOLDERS (`createProjectAdapter({ thumbnail: LW.thumbnail })`, or `createApp({ thumbnail })`).
  It uses `capApi.capture.probe()` and `.picture()`. **C7** owns `capture.js`. If C7's recorder retires `probe()` or `picture()`,
  the thumbnail must follow, and the gpu-recovery thumbnail probe will say so.
- **C3:** when the kit rack arrives, pass it to `uiSpace({ rack, layer, extra })`. Today the rack columns are left out on purpose.
- **C8:** the guard's UI space (whole rects) and the occlusion (painted rects) stay two geometries. Brief 8 says so too: never
  make `uiSpace` match visual occlusion.
- **Josh:** in DISCONNECTED, a press between a floated card's head and body no longer orbits. This is the kit's law; see above.
- **The 9′ case** in `offer` waits for a kit with brief 9′.
- **CLAUDE.md, drafted for the integrator (not applied):** "The stage's pointer road asks MIR's scene guard first
  (`createSceneGuard({ install: false })` in `lab/stage-gestures.js`, UI space from `uiSpace` in `rack.js`): a press, a
  double-click or a wheel in a window's gap never reaches the stage. `tools/hit-probe-set.mjs` is its gate, and the count is
  0 reached."

## Exact next step

Claude Sos merges `worktree-agent-a63344dfd9350ca1b` into `sos-s0` **after C0's branch**. The adopt commit `4cee6c7` is identical
to C0's, so take C0's side on `MIR-MANIFEST.json`, `lab/mir/**` and `lab/fonts/info/**`. `lab/sw.js` is the standing conflict:
take either side, then run `node tests/pwa.test.mjs --write`.

Then:
1. Run `bash test.sh node` (C0's four reds should be gone after C0) and `node tests/stage-gestures.test.mjs`.
2. Run `gpu-recovery`, `offer` 16, `input`, `frame-occlusion` 7, `keyboard-window` and `menubar`.
3. Run the hit-probe set on the merged tree: `LW_PORT=<port> node tools/hit-probe-set.mjs`. The target is **0 reached**.
   The gap counts may move with C0's cascade.
