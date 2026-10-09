# C9 HANDOFF (0.5.0 stage C) — THE SCENE GUARD, THE HIT-PROBE SET AND R14

- **Worktree:** `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a63344dfd9350ca1b`
- **Branch:** `worktree-agent-a63344dfd9350ca1b`, reset to `7044f37` (the `sos-s0` tip)
- **`cat lab/*.js | wc -l`:** 36,288 at the base → 36,469 after the adopt (+181, all generated `lab/sw.js` precache rows,
  C0's too) → 36,479 after the guard (+10).

## State
1. `4cee6c7` the bare adopt of MIR 1.5 alpha.24 (adopt.mjs --line 1.5: 196 added, 23 updated, 0 removed, 43 unchanged,
   1b7ae99b9905) + `pwa --write`. Identical to C0's.
2. `a2823bb` THE SCENE GUARD: `lab/stage-gestures.js` imports `createSceneGuard` and takes `ui` (a rects function);
   pointerdown / wheel / dblclick ask `guard.hit(e)` first. `lab/rack.js` passes
   `ui: uiSpace({ layer: floats, extra: () => [transport, notebook, sheet, offer, rackAddList, rackFavList, #keymap .km-panel] via paintedRect })`.
   Rack columns NOT included (they are pointer-solid; and input.browser-test dispatches synthetic presses at (120,120) over #rackL).
   `tests/stage-gestures.test.mjs` gains the guard case (green).
   Node gate: 81/85, exactly C0's four reds (mir-manifest alpha.24 not ACCEPTED; new-project OUT OF STEP; wiring 108 unreached
   — scene-guard.js is now reached; pwa absolute URL in lab/mir/shell/gui.js).

3. `37ae218` THE HIT-PROBE SET `tools/hit-probe-set.mjs` (kit probe()/gridPoints() from the 1.5 worktree; λWAVES' cdp.mjs):
   ten scenes (control + the C9 list). **After (a2823bb, 8823): 58 gap presses, 0 reached the stage**; before (4cee6c7, 8827,
   `.tmp/base` = git archive of the adopt): 58 of 58 reached. Control 3/3 both. JSON in `research/release-0.5.0/c9-hit-probe/`.
   Servers: 8823 (this tree) still up, pid 3578115 — stop by pid at the end; 8827 stopped.

## Findings so far
- The kit (alpha.24) has NO "readability probe": the probe is λWAVES' own `capture.probe()` (`canvasReadable`, capture.js).
- λWAVES has NO `thumbnail()` today (FOLDERS is C6's). Plan: add `LW.thumbnail()` at the END of the LW literal (reads
  `capApi.capture.probe().canvasReadable`: the canvas if readable, else `picture({ width: 320 })`'s PNG blob) for C6 to hand to
  `createProjectAdapter({ thumbnail })`.
- The device-lost recovery is the anonymous `onLost` arrow in rack.js `createField(...)`; `tests/gpu-recovery.browser-test.mjs`
  exists (boot/reload cycles). Plan: name it `function gpuRecovery(i)` in place; extend the test with a destroy() case + thumbnail.
- DISCONNECTED floats: skin.css makes `#floats > .dev` pointer-events none, so a press between head and body used to orbit the
  camera; the guard now makes it UI (the kit's law: a window's whole rect is UI space).

## Next
R14 (name `gpuRecovery` in place; `LW.thumbnail()` at the END; gpu-recovery test gains the device-lost + thumbnail cases);
then the browser suites (offer 16, input, gpu-recovery, frame-occlusion 7, keyboard-window, menubar); then REPORT + C9-BUILD.md.
