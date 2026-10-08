# A1 + A8 BUILD — the settings adapter, the camera port and the bindings table (0.5.0 stage A, wave 2)

Built from the design in `A1-A8-HANDOFF.md` (`df081b1`, the paused builder's branch `worktree-agent-a93d670fd213115b8`).

- **Worktree:** `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-aa6ffc0a6a68884b8`
- **Branch:** `worktree-agent-aa6ffc0a6a68884b8`, reset to `1e1a4f8`, the `sos-s0` tip (A5+A6 and A9–A11 merged).
- The builder merged, pushed, tagged and deployed nothing.

## Ten lines
1. A1: `lab/settings-store.js` is the one door to `lambdawaves.q0.settings`: `createSettingsStore(storage?)` → `{ key, read, write(obj), remove }`.
2. All 7 writes and the 1 remove in `rack.js` go through it, building the same objects in the same key order. No `rack.js` line names the key any more.
3. Probe `tools/settings-probe.mjs`: this tree and `1e1a4f8` agree in **48 of 48** fields over boot, the 4 demos and NEW. No open moved a PREFERENCE or LIBRARY key.
4. The blob round-trips byte-identical on 5 of 6 scenes. WAVE DANCER drops `modwin.modes.s3` across a reload **on both trees**: pre-existing, WORKSPACE, the modulation window's (C4).
5. A8a: `createCameraLaw` returns `port`, the object MIR 1.5's CAMERA panel takes. It has twelve ids, `set` takes a hand's road, it notifies subscribers, and `loop()` is untouched.
6. CAMERA MOTION's CONTROL, ZOOM, FOV, PAN X, PAN Y and PAN HOME call the port. RESET VIEW's line (A9's) is untouched.
7. A8b: `STAGE_BINDINGS` in `lab/stage-gestures.js` is one frozen data table of today's bindings (R5-C1). Every literal the gesture code had is now a read of its row.
8. The Alt+Arrow quartet steps `STAGE_BINDINGS.nudge`, in its own last commit, on A9's rows.
9. Gates: node exit 0 after each commit; `new-project --check` in step; seven browser suites green on their first run. No `__LW` member renamed or removed; no digest lock (no `writeView` change).
10. `cat lab/*.js | wc -l`: **36,198 → 36,227 (A1, +29) → 36,260 (A8, +33)**, **+62** in all.

## Commits
| sha | message |
|---|---|
| `622afbd` | 0.5.0 A1 · wave 190: THE SETTINGS ADAPTER — lab/settings-store.js, the blob's one door |
| `39babf5` | 0.5.0 A8 · wave 191: THE CAMERA PORT AND THE BINDINGS TABLE |
| `60383c1` | 0.5.0 A8 · the Alt+Arrow quartet steps STAGE_BINDINGS.nudge (the table's last row) |
| (this file) | the hand-off |

REPORT.md waves 190 and 191 are appended at the end of the file, after wave 195, under `## 2026-10-08 · 0.5.0 A — THE SEAMS`.

## A1 · the store's API and the families that stay
`lab/settings-store.js` (27 lines) exports:
- `SETTINGS_KEY = 'lambdawaves.q0.settings'`;
- `createSettingsStore(storage?)` → `{ key, read, write(obj), remove }`:
  - `read()`: the object, or `{}` when the key is absent or unreadable;
  - `write(obj)`: stores `JSON.stringify(obj)`; answers `false` when storage refuses;
  - `remove()`: FORGET.
- Storage is resolved lazily, inside the try.
- `WORKSPACE`: the blob's arrangement keys: `closed, layouts, nbW, nbH, abW, abH, modwin, phoneTr, phoneRack`. MIR's `createRack({ store })` reads these at C3; every other blob key is PREFERENCE, for `createGui` at C2.
- `FAMILIES`: the localStorage keys that stay outside the blob, each with its owner and scope.

The eight sites in `rack.js`, all through `settingsStore`:
- `saveSettings` (its outer try kept);
- `audioDevice` in `mod.port({ device })`;
- `saveLayout` and `forgetLayout`;
- `abW/abH` and `nbW/nbH` in `nbSaveSize`;
- `warned` in `remember`;
- FORGET's `remove()`.

| family (stays outside the blob) | owner | scope |
|---|---|---|
| `lambdawaves.q0.notebook`, `.notebook.title`, `.notebook.subtitle` | `rack.js` `NB_KEY/NB_TITLE/NB_SUBTITLE` | PROJECT |
| `lambdawaves.q0.projects` | `rack.js` `PJ_KEY` | PROJECT |
| `lambdawaves.q0.experiment`, `lambdawaves.q0.presentation` | `rack.js` `LS_EXP/LS_PRES` | PROJECT |
| `lambdawaves.q0.keys` | `keys.js` | PREFERENCE |
| `lw.keyboard.position.v1` | `keymap.js` | PREFERENCE |
| `lw.lean.v1` | `window-chrome.js` | PREFERENCE |
| `lw-window-info` | `native-ui.js` | PREFERENCE |
| `lambdawaves.q0.library` | `library.js` | LIBRARY |
| `lambdawaves.q0.modpresets` (and its `.refused-<time>` copies) | the kit's `mir/modulation/mod.js` `PRESET_LS` | PREFERENCE (read so here; not in STATE-SCOPES) |

**One deviation from the design.** The design listed `nativeLayout` under WORKSPACE. It stays PREFERENCE, as `docs/STATE-SCOPES.md`
and the byte-identical gates have it (`new-project`, `molecule-demos` strip exactly the nine keys above).

## A8a · the port's members and their kit twins
Every member lives in `lab/camera-law.js` `createCameraLaw(...).port`. The kit twins are MIR 1.5 `mir/panels/camera.js` and
`camera-rig.js` `VOCAB`.

| member | λWAVES road | kit twin |
|---|---|---|
| `get(id)` | `obs` / `camera` numbers in the law's units | `port.get(id)` |
| `set(id, v)` | the hand's road (table below) | `port.set(id, v)` |
| `subscribe(fn)` → off | `tell()`: every PRESENT the law asks for, `syncCamUI`, and `cameraStep` / `camLevelStep` / `stepKeyOrbit` / `orbitBy` when they moved the pose | `port.subscribe(fn)` → off |
| `turn(dy, dp)` | `orbitBy` + PRESENT | `port.turn?(dyaw, dpitch)` |
| `home()` | `resetView` (RESET VIEW) | `port.home?()` |
| `ranges` | from CAM (below) | `port.ranges?` `{ min, max, home, log, step, fmt }` |
| `angle: 'rad'` | — | `port.angle?` |
| `modIds` | the saved `observer.*` routes | `port.modIds?` |
| `setShift(x, y)`, `zoomAt(c, v)`, `panBy(du, dv)` | the law's own | brief 1's `mir/camera/law.js` (not built in the kit yet) |

| id | get | set (a hand's road) | range |
|---|---|---|---|
| `mode` | `obs.mode` | `setCamMode` | — |
| `zoom` | `obs.dist` | `setDist` | 1.2–8, home 3.3, log, fmt `zoom` (a distance, not the kit's nearness) |
| `fov` | `obs.fov` | `setFov` | 0.25–1.2, home 0.6 |
| `panX` / `panY` | `obs.shift[0/1]` | `setShift(v, y)` / `setShift(x, v)` | ±1, home 0 |
| `yaw` | `obs.yaw` | `modHand('observer.yaw')`, else a turn by the difference | 0–2π, home 0.65 |
| `pitch` | `obs.pitch` | `modHand('observer.pitch')`, else a turn | ±1.52, home 0.38 |
| `autoRotate` | `camera.autoRotate` | `camera.setAutoRotate` | — |
| `spin` | `camera.speed` | `camera.setSpeed` | 0.02–2, home 0.25 |
| `friction` | `camera.friction` | `camera.setFriction` | 0–12, home 1, step 0.05 |
| `drag` | `camera.dragGain` | `camera.setDragGain` | 0.2–8, home 1, step 0.01, not log |
| `fling` | `camera.flingGain` | `camera.setFling` | 0–2, home 1, step 0.01 |
| anything else (`roll`, `wheel`, `inertia`, the 2-D ids) | `undefined` | ignored | the kit hides it |

`modIds`:
- `yaw` → `observer.yaw`
- `pitch` → `observer.pitch`
- `zoom` → `observer.dist`
- `fov` → `observer.fov`
- `panX` → `observer.panx`
- `panY` → `observer.pany`

## A8b · the bindings table, as data
`lab/stage-gestures.js`; `bindStageGestures` reads it through `bindings` (default: this table).

```js
export const STAGE_BINDINGS = frozen({
  pointer: { button: 0, slide: { altKey: true, ctrlKey: false }, fine: 'shiftKey' }, // one finger or the mouse: these modifiers slide; else the instrument's special; else orbit (`fine` × law.FINE)
  wheel: { line: 16, page: null, base: 1.1, per: 100, atCursor: true }, // CSS px a line (a page: null = the canvas' height); distance × base^(px / per)
  pinch: { slide: true, atCentroid: true }, // two fingers slide the picture and zoom at their centroid
  tap: { ms: 300, px: 8 }, // a touch tap is shorter and stiller than this
  doubleTap: { ms: null, px: 40 }, // a second tap this soon (null: the law's TAP_MS = 320) and this near resets the view
  dblclick: true, // a double-click resets the view
  nudge: 0.05, // Alt+Arrows: the lens shift a press, of the half-frame (Shift × the key's fine factor)
});
```

In words, as Josh would read them:
- **Mouse:**
  - left-drag orbits; Shift-drag orbits finer;
  - Alt-drag (without Ctrl) slides the picture; Ctrl-drag is the instrument's special;
  - the wheel zooms at the cursor;
  - a double-click resets the view.
- **Trackpad / iPad:**
  - one finger orbits;
  - two fingers slide the picture and pinch-zoom at their centroid;
  - a tap is under 300 ms and 8 px; two taps within 320 ms and 40 px reset the view.
- **Keys:** Alt+Arrows nudge the shift 0.05 a press (Shift: a quarter of that).

Any change Josh names is a row edit here.

## Tests (ports 8763/5233; browser suites one at a time, 4 s apart)
| gate | tree | result |
|---|---|---|
| `bash test.sh node` | after A1, after A8, after the quartet | exit 0 each time (85 suites) |
| `node tools/new-project.mjs --check` | each commit | in step, 16,889 B |
| `node tests/camera-shift.test.mjs` | A8 | 7 PASS (§7 THE PORT is new) |
| `node tests/stage-gestures.test.mjs` | A8 | 2 PASS (the table block is new) |
| `node tests/first-run.test.mjs` | each (in the node gate) | 0 failing of 11 |
| `tools/settings-probe.mjs` | base `1e1a4f8`, A1, final | 5 of 6 scenes green on all three (WAVE DANCER red on all three); 48/48 fields identical base vs A1 and base vs final |
| `new-project` | A1; final | 8 PASS; 8 PASS |
| `official-defaults-palette` | A1; final | 3 PASS; 3 PASS |
| `camera-shift` | final | 11/11 GREEN |
| `render-regressions` | final | 2 PASS |
| `history` | final | 39 PASS |
| `input` | final | 13 PASS |
| `keyboard-window` | final | GREEN |

`first-run` has no browser suite; it is the node test in the gate. Every suite was green on its first run, so none needed a re-run
alone. No digest lock was run, because `writeView` is untouched.

## Blockers
None.

The one red is pre-existing on `1e1a4f8`:

- **Command:** `LW_PORT=8763 GD_PORT=5233 node tools/settings-probe.mjs --out .tmp/probe-base.json`, with
  `python3 tools/gate/server.py .tmp/base 8763` serving `git archive 1e1a4f8 lab`.
- **Output:** `RED   WAVE DANCER  blob 920 B, reload DIFFERS: [{"key":"lambdawaves.q0.settings","sub":"modwin","scope":"WORKSPACE","from":{…"modes":{"s1":"F","s3":"F"}…},"to":{…"modes":{"s1":"F"}…}}]`
- **Meaning:** `s3` is WAVE DANCER's AUDIO source. The same line appears on this tree.

## Open items
1. **C4:** the modulation window loses WAVE DANCER's `s3` device mode across a reload (the red above). It is a WORKSPACE key.
2. **C1, the panel's registry:** the kit panel registers modulation targets whose `set` calls `port.set(vid, v)`
   (`panels/camera.js` `add()` / the sphere's targets). λWAVES' `port.set` is a hand's road: on a routed axis it moves the base.
   C1 must keep λWAVES' own `observer.*` defs in `rack.js` and not let the panel register targets for those ids, or it must give
   the registry a raw road.
3. **C1, notices:** the modulation's writes to `observer.*` (the `rack.js` defs) do not notify the port's subscribers. Wire them
   when the kit panel arrives.
4. **C1, duplicated ranges:** SPIN's 0.02–2 / 0.25 is written both in `port.ranges` and on the SPIN knob in `rack.js`. The knob
   goes at C1.
5. **R5-C1 / brief 1:** the double tap keeps λWAVES' 320 ms (the law's `TAP_MS`) and 40 px. Josh's kit rule is 300 ms within
   14 px. A change is one row: `doubleTap: { ms: 300, px: 14 }`.
6. **C2, scopes:** STATE-SCOPES should name `lambdawaves.q0.modpresets` (A1 reads it as PREFERENCE) and confirm `nativeLayout`
   as PREFERENCE.
7. **CLAUDE.md, drafted for the integrator (not applied):** "Every read and write of `lambdawaves.q0.settings` goes through
   `lab/settings-store.js` (`createSettingsStore`; `WORKSPACE` and `FAMILIES` are its scope tables, and
   `tools/settings-probe.mjs` is their gate). The camera's port is `createCameraLaw(...).port`, the object MIR's CAMERA panel
   takes. The stage's bindings are `STAGE_BINDINGS` in `lab/stage-gestures.js`; a binding change is a row edit there."

## Exact next step
Claude Sos merges `worktree-agent-aa6ffc0a6a68884b8` (`622afbd`, `39babf5`, `60383c1` and this hand-off) into `sos-s0`.
1. If `lab/sw.js` conflicts, take either side, then run `node tests/pwa.test.mjs --write`.
2. Run `bash test.sh node` and `node tools/new-project.mjs --check`.
3. Run `camera-shift` 11, `new-project` 8 and `history` 39 on the merged tree.

A7's regions (`refreshOcclusion`, `placeFloat`, `keymapMoved`, `lab/occlusion.js`) are not touched here. In `rack.js` this branch
touches only:
- the import lines;
- the settings sites;
- the `createCameraLaw` destructure;
- CAMERA MOTION's six callbacks;
- the four Alt+Arrow `run` bodies.
