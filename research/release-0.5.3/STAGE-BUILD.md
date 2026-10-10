# STAGE-BUILD · M4 THE LIVE STAGE (0.5.3 "Rack Tune"; B-STAGE, Opus 5.5; 2026-10-10)

The brief is `BRIEF-STAGE.md`. The worktree is `.claude/worktrees/agent-a937a43f9ae0a4d5c`, branch `worktree-agent-a937a43f9ae0a4d5c`, reset to `688418f` (`sos-s0`).
Josh's words: "Sometimes the screen is unclickable and can't move the scene" and, at §11, "linux and just clicking around, but MIR racks are
fine". **Result:** both live causes were found by the probe and fixed. Before the fixes the probe read **8/10** scenes; after them it reads **10/10**.
The JS delta is **+8** (budget +10). NO push.

| commit | what |
|---|---|
| `cf91b5a` | `tools/stage-dead-probe.mjs`: the probe (tools/, uncounted) |
| `2eb1ab6` | cause B: the stuck-pointer heal, `lab/stage-gestures.js`, plus two new cases in `tests/stage-gestures.test.mjs` |
| `0d199a1` | cause A, app side: the rect filter in the `extra` callback, `lab/shell/rack-wiring.js:304-305` |
| (this) | this BUILD, the MIR brief, the probe's readings (`stage-probe/`) and the eye pairs (`eye/stage-*.png`) |

## §1 · The probe's reading BEFORE any fix (`688418f` + the probe; `stage-probe/probe-before.{txt,json}`)

**How it works.** `tools/stage-dead-probe.mjs` launches headless Chromium on the RTX 3070 (hit-probe-set's launch, field up in every
scene) at 1600 × 1000, with a 24 px grid over `#stage` (2,814 points). Each scene is a **first run**: the origin's storage is cleared on
`about:blank`, the notice is dismissed, the lab is paused, and AUTO-ROTATE and fling are off. The scene's setup then runs through `__LW`.
Each point gets two answers:
- the browser's hit test (`elementFromPoint`);
- the **stage's own verdict**: the canvas' own `pointerdown` listener (`pointerDown`, reached through the DevTools `getEventListeners`)
  is handed Josh's press (pointerId 1, mouse, button 0, no modifier), and `#field` is read for `.drag`. Only a press the stage took is
  ended, through its own `pointercancel` listener.

Calling the listener directly keeps the window-capture listeners (a dialog's outside press, the ☆ list's close) out of the measurement.
The answer is then exactly `guard.hit(e)` plus a held `special`/`points`.

**The classes.** `stage` means alive. `ui` means a visible element, or anything inside a shown rack column, window or pane. `gap` means
the canvas refused the press inside a visible window's own box, a work bar or a rack column (C9's gaps, which are dead by design).
`modal` means outside an open modal dialog (cause C, also by design). `box` means an unpainted hit box (cause E). `DEAD` means a press on
bare-looking stage that does nothing.

| # | scene | stage | ui | gap | modal | box | **DEAD** |
|---|---|---|---|---|---|---|---|
| 1 | first run | 1658 | 1114 | 42 | — | — | **0** |
| 2 | SETTINGS open (raised), AXES at CORNER | 1646 | 1114 | 42 | — | 12 `.corner-axis-hit` | **0** |
| 3 | the modulation window open with three LFOs and their bars | 898 | 1742 | 174 | — | — | **0** |
| 4 | MOLECULES on | 1658 | 1114 | 42 | — | — | **0** |
| 5 | the keyboard editor open | 920 | 1828 | 66 | — | — | **0** |
| 6 | a dialog (the kit's `confirmDialog`) | 0 | 48 | 0 | 2766 | — | **0** |
| 7 | `ui-hidden` (H), AXES at CORNER first | 2814 | 0 | 0 | — | — | **0** |
| 8a | after a real drag (CDP `Input.dispatchMouseEvent`, released) | 1658 | 1114 | 42 | — | — | **0** |
| 8b | …then a press whose pointerup is LOST | **0** | 1114 | 42 | — | — | **1658 `held`** (x 324–1284 × y 12–996: the whole visible stage) |
| 9 | the transport docked | 1712 | 1060 | 42 | — | — | **0** |
| 10 | the rack folded by its key (B) while the ☆ list is open | 2701 | 7 | 0 | — | 84 `#rackPeek`+`#rackPeekL` | **22 `ghost-extra #rackFavList`** (x 1044–1284 × y 132–156) |

**Verdict: 8/10.** Two causes are live:
- **Cause B (scene 8b).** A press whose release never arrives leaves `points` (or `special`) held. After that
  `stage-gestures.js:67`'s `special || points.has(e.pointerId)` refuses every later press of the same mouse, so the whole stage is dead.
  The racks still answer, because they never ask the stage. Only blur, pagehide or a hidden tab freed it. **This matches Josh's words exactly.**
- **Cause A, app side (scene 10).** With the ☆ FAVOURITE LAYOUTS list open, folding the rack by its key (B) leaves `#rackFavList`
  laid out at `opacity: 0; pointer-events: none` (`lab.css:53`). `paintedRect` keeps it, because it checks only `hidden` and
  `visibility`. The guard therefore treats a 260 px pane nobody can see as UI space. (A press on ◧ closes the list first, so only the
  key road leaves the ghost. `#rackAddList` is `visibility: hidden` under `rack-hidden`, `lab.css:519`, so it was never a ghost.)
- **Cause A, kit side (the bar union):** 0 dead points. In this layout the bars lie inside the modulation root's 1584 px box. No faded
  float was seen in a settled scene (§5, §7).
- **Cause E:** the 88 px `.corner-axis-hit` (12 points, over the drawn corner axis; a double-click swaps its side) and the 16 px peek
  strips (42 + 42 points, only while the rack is folded; hovering them peeks the rack). Both are deliberate controls.
- **Cause C:** the dialog swallows 2,766 of 2,814 points while it is up. This is the design (any press outside dismisses it).
- **Cause D:** ruled out by Josh's words and not measured.

Before this reading was taken the probe's classes were refined twice, both in `tools/` only. The first refinement stopped listing a clear
colour input laid over its swatch (`input.mir-swatch-pick`), or a hover-only readout inside a window (`div.m2kval`), as dead stage: that is
the window's own business. The second taught `paints()` that SVG and pseudo-element icons paint. The committed probe adds one output-only
field (`gaps` by cause) after this run; the verdict logic is unchanged.

## §2 · The fixes (file:line, and the case that pins each)

**(b) The stuck-pointer heal, on a NEW press only.** In `lab/stage-gestures.js`:
- **`capture(id)` :39-42** now returns `canvas.hasPointerCapture(id)`.
- **`special` :80 and `points` :83** record that answer as `cap` when the press is taken. A synthetic or expired pointer is never held.
- **`heal(e)` :67-71, called first in `pointerDown` :73.** It finishes, as CANCELLED (no fling, no tap, no commit), a held `special` or
  `points` entry when either:
  - it has the SAME pointerId as the new press, or
  - the stage held its capture (`cap`) and has lost it (`!canvas.hasPointerCapture(id)`), whatever its id (a new touch has a new id).
- **`pointerMove` :91** finishes, as cancelled, a held MOUSE drag whose `buttons === 0`.
- **The audit's risk 3.** `hasPointerCapture` is false after a synthetic pointer. The `cap` flag handles this: a pointer the stage never
  held is never "lost". The heal therefore cannot break the browser suites' synthetic pinches. It runs on a press only; a move never heals,
  except for a buttonless MOUSE move, which cannot be a live drag.

The pins in `tests/stage-gestures.test.mjs`:
- **:148-164, the lost pointerup (mouse):**
  - the next press of the same mouse orbits;
  - the lost drag never flings;
  - a lost Ctrl special (the bow) ends `cancel`led and never `end`s;
  - a buttonless move ends a held drag with no fling, after which the mouse only hovers.
- **:166-180, a lost touch then a NEW id:** the new finger orbits alone, with no pinch and no slide against the ghost.
- **:177-179, a synthetic pinch:** the first finger the stage never captured is not healed, so the pinch still pinches.
- **The existing interruptions** (`:47-55`, unchanged) and every older case stay green.

Before the fix, the new case failed at "both drags orbit".

**(c) The app-side rect filter** is at **`lab/shell/rack-wiring.js:304-305`**, in the `extra` callback of `uiSpace`. Each of the six panes
(`transport`, `notebook`, `sheet`, `offer`, `rackAddList`, `rackFavList`) passes to `paintedRect` only when its computed `opacity > 0`,
`visibility !== 'hidden'` and `pointer-events !== 'none'`. `lab/occlusion.js` `paintedRect` is untouched, so the shader mask is unchanged:
`frame-occlusion` reads 7/7. The pin is the probe's scene 10 (22 → 0). The kit's own `rectOf` and bar union are briefed (§5), not built.

**(d) The two fixed boxes, measured.**
- **`.corner-axis-hit` under `ui-hidden`** (scene 7, with AXES at CORNER before H): **0 points**. `toggleUI` sets `mat.axis = false`, and
  the next frame's `placeCornerAxis` branch (`rack.js:342-343`) sets the button `hidden`. It is not dead under `ui-hidden`, so **no CSS was added**.
- **Outside `ui-hidden`** it is 12 points (≈ 88 × 88 px) over the drawn corner axis. That is the axis' own control.
- **`#rackPeek` / `#rackPeekL`** are 42 + 42 points (16 px × the full height) only while the rack is folded. When the rack is shown, the
  columns cover them (0 points in every other scene). Both are kept: they are the hover-peek, not dead stage.

## §3 · The probe AFTER the fixes (`0d199a1`; `stage-probe/probe-after.{txt,json}`)

| # | scene | stage | ui | gap | modal | box | **DEAD** |
|---|---|---|---|---|---|---|---|
| 1 | first run | 1658 | 1114 | 42 | — | — | **0** |
| 2 | SETTINGS open, AXES at CORNER | 1646 | 1114 | 42 | — | 12 corner | **0** |
| 3 | modulation window + bars | 898 | 1742 | 174 | — | — | **0** |
| 4 | MOLECULES on | 1658 | 1114 | 42 | — | — | **0** |
| 5 | keyboard editor | 920 | 1828 | 66 | — | — | **0** |
| 6 | a dialog | 0 | 48 | 0 | 2766 | — | **0** |
| 7 | `ui-hidden` | 2814 | 0 | 0 | — | — | **0** |
| 8a | after a real drag | 1658 | 1114 | 42 | — | — | **0** |
| 8b | …then a lost pointerup | **1658** | 1114 | 42 | — | — | **0** (was 1658) |
| 9 | transport docked | 1712 | 1060 | 42 | — | — | **0** |
| 10 | rack folded by B, ☆ list open | **2723** | 7 | 0 | — | 84 peek | **0** (was 22) |

**10/10.** No new dead point, no new gap, and 0 leaks (no press through a visible window's gap reached the stage) in every scene.
Every count outside 8b and 10 is identical to §1.

## §4 · What Josh will see
- **A stage that never stays dead after a lost click.** If a release goes missing (on Linux, typically a right-click context menu or a
  window-manager grab in the middle of a drag), the very next press on the stage works and orbits from where it lands. The lost drag just
  ends: no fling and no Ctrl-bow commit. Moving the mouse with no button held ends it too. Before, every press on the picture did nothing
  until he switched windows, while the racks kept answering.
  Pair: `eye/stage-before-lost-pointerup.png` (every red dot is a dead press) and `eye/stage-after-lost-pointerup.png` (none).
- **The stage under the ☆ list answers when the rack is folded by its key.** Pair: `eye/stage-before-rack-folded.png` (the red block
  where the invisible list sat) and `eye/stage-after-rack-folded.png`. The amber edge strips in both are the peek strips, which are kept.
- Nothing else moves: the same windows guard the same gaps (`hit-probe-set` 0 of 71), and the frame and axis ink is unchanged.

## §5 · The MIR brief filed
`research/release-0.5.3/MIR-BRIEF-scene-guard.md`, not built. It asks for three changes:
- **`rectOf` makes one style read** (skip `visibility: hidden` and `opacity: 0`, as `visibleBox` does), but **does not skip a root at
  `pointer-events: none`**: the modulation root is pointer-transparent on purpose, and its gaps are UI by C9.
- **A leaving window gives up its space when its exit starts** (`presence(el, false)` marks it).
- **The modulation window's bars are listed one rect each, not one union.**

It carries the measured facts (union: 0 dead points in λWAVES' layout, so the change is preventive) and a node case list for the kit.

## §6 · Lines (`cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l`)
- **Before:** 27,943 (`688418f`).
- **After:** **27,951**, i.e. **+8** (budget +10, stop at +15). `stage-gestures.js` is +7 (the heal function 5, its call 1, the move
  heal 1, `capture`'s answer 1, minus one merged line). `rack-wiring.js` is +1.
- `tools/stage-dead-probe.mjs` is in `tools/`, so it is uncounted. No CSS changed.

## §7 · What I could not measure
- **A real lost release.** A headless browser cannot drop its own pointerup. Scene 8b hands the stage's listener a press with no up, which
  is the state a lost release leaves behind. Which Linux event drops it for Josh is NOT measured. The candidates, by reading:
  - a right-press during a left drag: a chorded `pointermove`, and GTK's context menu opens on press and grabs the pointer;
  - a window-manager grab.

  The racks staying alive fits B: the canvas no longer held the capture, but `points` still held the drag.
- **The iPad.** Whether WebKit answers `hasPointerCapture` true right after `setPointerCapture` for a touch is UNMEASURED. If it answers
  false, `cap` is false and the capture-gone heal is inert there. The same-id heal and blur still work, and a lost finger would pinch with
  the new one until it lifts. This belongs on M14's checklist ("a dropped touch then a new one").
- **Faded float windows mid-exit** (the kit's `presence` fade) are transient, and the probe reads settled scenes. The kit-side `rectOf`
  fix is briefed. The probe never saw one in ten scenes.
- **Browser coverage.** The probe is Chromium-only (`getEventListeners` is a DevTools API). Firefox runs the stage through the suites below.
- **Which cause Josh hit.** B fits his words (the stage is dead everywhere, the racks are fine). A-extra needs the ☆ list plus the B key.
  The frequency of either in the field is unknown.

## The suites run (this worktree, server 8943 / geckodriver 5413; `rigfree.mjs` before each browser suite, one at a time)
| suite | result |
|---|---|
| `node tests/stage-gestures.test.mjs` | **4/4 PASS lines** (the two new cases and `:47-55` included); before the heal the new case failed |
| `tools/stage-dead-probe.mjs` | BEFORE **8/10**, AFTER **10/10** (dead points listed in §1 and §3) |
| `tools/hit-probe-set.mjs` (MIR 1.5 tools present at `~/Documents/MIR/.claude/worktrees/mir-1.5/tools`) | **OK**: 71 gap presses, 0 reached the stage; the control reached 3/3 |
| `tests/frame-occlusion.browser-test.mjs` | **7/7 PASS** |
| `tests/opener.browser-test.mjs` (alone, quiet GPU) | **GREEN 7/7** |
| `tests/input.browser-test.mjs` (synthetic and real stage pointers; not a named closer) | **rc 0, 13/13 PASS** (lost capture, secondary buttons, real mouse and touch drags) |
| `tests/camera-shift.browser-test.mjs` (synthetic pinch; not a named closer) | **GREEN** |
| `bash test.sh node` | **rc 0** (82 suites, pwa last) |
| `node tools/rack-deps.mjs --classes --no-write` | rc 0, every module `ok` |
| `node tests/pwa.test.mjs --write` | run after each `lab/` edit |
