# C7b · THE FILM'S UI IS THE KIT'S RENDER CARD AND TIMELINE WINDOW — live hand-off (the C7b builder, Opus 5.5)

**State: BUILDING — steps 1 (predecessor) and 2 done, yan-c merged; step 3 next.  Nothing merged into yan-c, pushed, tagged or deployed.**

| | |
|---|---|
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-ab12528fb3c1bb358` (the relaunched builder) |
| branch | `worktree-agent-ab12528fb3c1bb358`, reset to `ae5add1` (the predecessor's tip, from `4555945`) |
| `f40733d` | step 1 · createFilm takes the card's road (predecessor) |
| `8b93ef8` | merge `yan-c` `011e6a5` (C6 + HANDOFF + two briefs); `lab/sw.js` the one conflict, regenerated |
| `9d8671b` | step 2 · the TIMELINE window on the one clock |
| servers | 8913 (tree); 8917 now serves `.tmp/base2` (= `git archive 7c7da54`, the merged pre-step tree, for ms/s); `.tmp/base` (= `4555945`) + `.tmp/film-base.json` stay the film-compare base |
| `lab/*.js` | 27,228 at `4555945`; 27,596 at `8b93ef8`; **27,657 at `9d8671b`** (+61: +23 generated `sw.js` rows, +38 hand-written) |

## Gates on `9d8671b`

- `bash test.sh node` exit 0 (wiring: 218 reached, 23 more kit modules than before).
- THE LOCK ×2: `860 values · 0/0 · page errors 0` and `1004 values · 0/0 · page errors 0`.
- take-in-bugs 4/4 · lfo-tension 3/3 · routed-knob 4/4 (after the B13 shield) · mir-controls 2/2 · history 44 PASS · new-project 8 +
  `node tests/new-project.test.mjs` + `node tools/new-project.mjs --check` (16117 B) · settings-probe 0 of 6 red · frame-occlusion 7 ·
  keyboard-window 8 (re-aimed: scoped timeline overlaps legal, the TIMELINE group, a timeline row's real second chord) ·
  keyboard-shortcuts node PASS · hit-probe-set 49 presses / 0 reached (2 timeline scenes added) · **timeline suite 8/8** (T1–T5, T9, T10).
- ms/s (window closed), Chromium, 1 run each interleaved: base `4555945` 40.23 / 39.97 / 40.94; pre-step `7c7da54` 42.21 / 42.43 / 41.25;
  tip 43.74 / 43.14 / 44.08 / 42.77 → tip − pre-step ≈ +1.2 ms/s (script +1.2); tip − 4555945 ≈ +3.5 (C6's merge is ~2 of it). Bar 3.536.
- offer 16/16 ran on `8b93ef8` (step 1's missing s9).

## Step 2 decisions (for C7B-BUILD)

- → TL through the seam's `setTimeline` (the modulation window's own), not `port.timeline` in mod-port.js: mod-port.js untouched.
- The arrangement rides as `presentation.timeline` (not top-level `S.timeline`): the quick save carries it too; restore replaces it on
  any non-history restore (open, NEW, link, quick LOAD), never on an undo.
- THE FOCUS LAW (key-table.js, 4 lines): table order handed E, C, P, Y, Home, Shift+arrows, Shift+1…5, Shift+Z, Shift+T to λWAVES'
  global rows even with the timeline focused; a foreign row with a live `when` now wins its chord. Brief candidate B15 (pickAction
  should prefer a scoped row in its scope).
- B13 (new): the kit's two holds collide on a ROUTED dial (timeline/knobs.js 500 ms + its contextmenu capture beat the ring's 600 ms
  pop-over: RANGE · REMOVE · RESET became unreachable on a knob). λWAVES' interim: a window-capture shield hides a routed dial's
  `data-param` from the timeline for that one event. An unrouted dial's hold is TIMELINE CLIP's.
- B14 (new): the CAMERA panel's sphere re-dispatches a press on its YAW/PITCH arcs to `.mir-camsphere-side`, cancelling knobs.js'
  pending hold — a held arc never opens TIMELINE CLIP (its right-click does). T3 holds ZOOM and right-clicks YAW.
- FREE camera: a YAW clip drives the `observer.yaw` target exactly; the stage orbits by the delta (λWAVES' FREE law, as an LFO does).
- The timeline's own undo/redo rows are not added (λWAVES has `undo`/`redo`); its undo is its ⋯ menu's (and `tl.model.undo()`).
- `say` → STATE's status line (λWAVES has no toast).

## Exact next step

Step 3 per C7B-DESIGN §4: new `lab/film-card.js` (the card via `createRenderCard`, the picture adapter, the PERIOD section, PLACE ONE
PERIOD, the `lw-period` kind, the first-run seed R7); rack.js: `rk.register({ id: 'render', … closed: true })`, the CAPTURE group out
(§3.1), the facade one line; render-exact.js: the 10-minute timer out; settings-store FAMILIES `lambdawaves.q0.render.*` +
`mir.render.calib`; film-handover re-aimed (§4.1); timeline suite T6–T8 (+ the card's roads = the facade's digests); then THE LOCK ×2,
film-probe + film-compare, offer, render-exact, menubar, frame-occlusion, hit-probe-set, settings-probe, pwa, wiring.
