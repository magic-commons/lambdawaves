# C1 · THE CAMERA PANEL THROUGH A8's PORT (+ RAMP) — build hand-off (2026-10-08, the C1 builder, Opus 5.5)

**In ten lines.**
1. The CAMERA card's rows are now MIR's `createCameraPanel({ mode: '3d', port, modPrefix: 'observer', project: false, mod })`, built over A8's port.
2. The PALETTE card's editor is MIR's `createRampPanel`. **`paletteview.js` (156 lines) and CAMERA MOTION (47 lines) are gone.**
3. A8's registry conflict is settled. The panel gets the modulation port without `add`, so it registers nothing. The six saved `observer.*` definitions stay in `rack.js` and use the panel's dials. No raw road was needed.
4. A modulation write to `observer.*` now notifies the port's subscribers (`camOut` → `cameraPort.notify()`). SPIN's range lives once, as `CAM.SPIN`.
5. `camera-law.js` loses its `ui` edge: every dial write is now a notice. A dial is now ONE axis, so PAN Y no longer rewrites a routed PAN X's base.
6. NEW `tools/camera-routes.mjs` is GREEN on the 4 demos and the empty project. Its routes, bases and law are byte-identical to the adopt-only `3a60679`.
7. Browser gates, all green on their first run: `camera-shift` 11/11, `official-defaults-palette` 3/3, `new-project` 8/8, `history` 39/39, `render-regressions` 2/2 and `input` 13/13.
8. The node gate (85 suites) has only C0's 4 reds. `keyboard-window` is red on its window-drag check, the same as on the adopt-only tree, so the adopt causes it, not C1.
9. `cat lab/*.js | wc -l` went **36,288 → 36,469** (the adopt's generated `sw.js`, +181, which C0 has too) **→ 36,293**. C1's own share is **−176**.
10. No `__LW` member that a test uses was renamed or removed. There is no digest lock (C7 owns it). Nothing was pushed or merged. The next step is the integrator's merge, after C0.

| | |
|---|---|
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a6673ac11f828a394` |
| branch | `worktree-agent-a6673ac11f828a394`, reset to `7044f37` (the `sos-s0` tip, the pre-C baseline) |
| `3a60679` | 0.5.0 C: the bare adopt of MIR 1.5 alpha.24 (`adopt.mjs --line 1.5`; identical to C0's) |
| `82c0313` | wave 197: the CAMERA panel over A8's port; CAMERA MOTION (47) leaves |
| `e8c831d` | wave 197: RAMP; `paletteview.js` (156) leaves |
| `daad244` | `tools/camera-routes.mjs`, the NEW closer, with its result |
| `47b3338`, `34926a1`, `6cfa33d`, `83c33b7` | `C1-HANDOFF.md` after each commit (a usage pause fell between `6cfa33d` and `daad244`) |
| the docs commit | this file, plus REPORT.md wave 197 under a new `## 2026-10-08 · 0.5.0 C — THE ADOPTION` at the END. C0's heading was not on this tree, so the integrator merges the two |
| gate servers | 8793, started and killed by pid: 3315314 (before the pause), then 3478546, 3486220 and 3504126 (the baseline `.tmp/base` and this tree, in turn). Port 8793/5263 is free and no browser is left open |

## The mount (`rack.js`, grep `createCameraPanel`)
```js
const camPanel = createCameraPanel({ mode: '3d', modPrefix: 'observer', project: false, mod,
  port: { ...cameraPort, set(id, v) { cameraPort.set(id, v); if (FEEL.has(id)) { clearTimeout(feelSave); feelSave = setTimeout(saveSettings, 250); } } } });
camPanel.spec.build(gc, null);   // gc = group(wCam.body, 'CAMERA'); λWAVES has no kit rack until C3
```
- **Options:** `mode: '3d'`; `port` is A8's, wrapped once so a hand on the feel (spin, friction, drag, fling) saves the PREFERENCE blob after 250 ms; `modPrefix: 'observer'`; `project: false`; no `history`; `mod` is λWAVES' modulation port (`lab/mod-port.js`).
- **The rows the panel draws from the port's ids:**
  - HOME (`data-key-action="camReset"`, which is `port.home` = RESET VIEW), after the port's own verb PAN HOME;
  - CONTROL;
  - the DIRECTION sphere, with its YAW and PITCH arcs;
  - the PAN pad, with its X and Y knobs;
  - ZOOM and FOV;
  - the HAND: DRAG, FRICTION, FLING, AUTO-ROTATE and SPIN.
- **Kept as λWAVES' own:**
  - SET Δρ REF, in its own row under the panel;
  - the help note;
  - ZOOM as a distance (brief 2: the kit's nearness unit is not forced onto `obs.dist`);
  - radians, `angle: 'rad'`.
- **The kit's look, now visible:**
  - SPIN reads °/s;
  - the PAN pad's hint says "a share of its width". Brief 2 asks the kit for 3-D wording.
- **What the port gained** (`camera-law.js`):
  - `notify`;
  - `verbs: [PAN HOME]`;
  - `ranges.panX/panY.fmt`, which keeps the NDC readout `+0.25`;
  - `ranges.spin` from `CAM.SPIN`.

## A8's open items, resolved
| item | resolution | why |
|---|---|---|
| 2 · the registry (the panel's `set` would call `port.set`, a hand's road) | The panel registers **no** target. It is handed λWAVES' mod port, which has no `add`, and the kit skips `mod.add` (`camera.js:373`). The six `observer.*` definitions stay in `rack.js` with the same ids, maps and ranges, and their `knob` accessors are the panel's dials (`camKnobs`, from `view.targets()`). `mod-port.js` gains `isModulated` / `baseOf`, the panel's two reads (`routed`, `base`). | A raw road (`port.setRaw` or `{ raw: true }`) is not reachable from the kit: its target records call `port.set(vid, v)` with two arguments, and its unrouted hand calls the same `port.set`. A raw `set` would therefore also strip the hand of ZOOM's centre anchor (`zoomAt` shift law) and FREE YAW's turn. Registering the panel's own targets would also change `observer.pitch`'s map from `bipolar` (def 0) to `linear` (def 0.38), which re-means every saved depth on it. Keeping the defs costs nothing and moves no saved route. |
| 3 · notices from `observer.*` modulation writes | Each setter ends in `camOut(id, v)`, which runs `setKnob(camKnobs[id], v)` (a routed dial is SHOWN, as everywhere), then `cameraPort.notify()`, then PRESENT. | The panel's `sync` skips a routed entry, so the definitions paint it and the notice repaints everything else. |
| 4 · SPIN's range written twice | `CAM.SPIN: [0.02, 2]` and `CAM.SPIN_DEF: 0.25`, read by `camera.speed` and `port.ranges.spin`. The SPIN knob has left. | — |
| (brief 2) a hand on one routed axis disturbs the other | `setShift(x, y, axis)`: the port's `panX`/`panY` roads take their own axis to `modHand` only. Two-axis hands (Alt-drag, two fingers, PAN HOME) still move both. | The pad emits both axes on every move, so before this a hand on X re-based a routed Y to its live value. |

## RAMP (`rack.js`, grep `createRampPanel`)
- `createRampPanel({ parent: gp, cyclic: true, project: false, presets: PRESET_GROUPS.flatMap(g => g.items), labels, ramp })` uses:
  - λWAVES' grouped preset order, so ‹ › walks as the old select did;
  - labels `−π … +π`, `SEAM at ±π` and `ARG ψ` in rad;
  - a port whose `lut` feeds the wheel, the field and the accent.
- The table is `palette.js` `toLUT`, bit for bit, as `rampLUT` cyclic at 256 entries.
- PALETTE (on/off, key action `palette`) stays λWAVES' switch, and INVERT keeps its own row.
- The `palette` adapter keeps the old API: `stops`, `selected`, `on`, `id`, `groups`, `setOn`, `select` and `load(stops, selected, id)`. When no id is given, the preset is kept, so RESET still reloads it, and the selected stop is restored by a focus event on its handle. `serialize`, `restore`, the link and `LW.palette` / `setPalette` / `paletteId` / `paletteGroups` are therefore unchanged.
- `DEFAULT_PALETTE` moved to `lab/palette-app.js`, which `rack.js` (`PAL_DEF`) and `tools/new-project.mjs` read. The generated empty project differs from the shipped file **only** in C0's `bpm 60 → 30` (`.tmp/jsondiff.mjs`). C1 needs no regeneration.
- GRADE was **not** built. The row's "what leaves" names none, and λWAVES' tone knobs (EXPOSURE, SOFT, HUE, ISO, GRAIN, KNEE, GAMMA) are field-shader uniforms laid out by `native-ui.js`' wave rows (C2's file). Moving them is its own row.

## The route script (`tools/camera-routes.mjs`, NEW)
It uses one Firefox. It opens the four demos through PROJECTS (WAVE DANCER, WATER, BENZENE, N₂), then NEW. For each project it checks:
- each saved `observer.*` route is live with the same id, target, macro, min and max, and is registered;
- each `observer.*` base is the file's `modulationBases` entry, else its pose, with yaw taken mod 2π;
- the six targets keep the saved-route law (map, min, max);
- each target has a dial;
- on a routed target, a key on the dial moves the base inward, the route stays, and the base is put back.

`--out` keeps the fingerprint and `--against` compares two trees.

| project | saved `observer.*` routes | result on C1 | vs `3a60679` (adopt only) |
|---|---|---|---|
| WAVE DANCER | `r4 → observer.fov` (m3 ← LFO s1) | GREEN; the FOV key moved the base 1.2 → 1.1905, route kept | SAME (the same 1.2 → 1.1905 there) |
| WATER | none (bases yaw .85, pitch .3, dist 3.3, fov .6) | GREEN | SAME |
| BENZENE | none (bases .55, .75, 3.3, .6) | GREEN | SAME |
| N₂ | none (bases .65, .2, 3.3, .6) | GREEN | SAME |
| NEW | none | GREEN | SAME |

On `3a60679` the script reds on one thing only: YAW and PITCH have no dial, which was the pre-C1 design ("picker rows, not drop targets"). Now all six dials are in the panel.

Commands:
- `python3 tools/gate/server.py .tmp/base 8793`, serving `git archive 3a60679 lab`;
- `LW_PORT=8793 GD_PORT=5263 node tools/camera-routes.mjs --out .tmp/routes-base.json`;
- then on this tree, `… --against .tmp/routes-base.json --out .tmp/routes-c1.json`.

## Tests (8793/5263; one browser at a time, 4 s apart)
| gate | tree | result |
|---|---|---|
| `bash test.sh node`-equivalent (`.tmp/node-gate.mjs`, 85 suites, pwa last) | after the adopt, after the camera, after the RAMP, final | 4 reds, all C0's, first messages: `mir-manifest` "names MIR 1.5.0-alpha.24, which is not an accepted adoption (accepted: 1.4.3)"; `new-project` "--check … OUT OF STEP" (bpm only); `wiring` (unreached kit modules; R5-W1); `pwa` "an absolute URL in lab/ … lab/mir/shell/gui.js: https://www.fabiandesmet.com/" |
| `node tests/camera-shift.test.mjs` | final | 8 PASS (§8 new) |
| `node tests/stage-gestures.test.mjs`, `palette.test.mjs` | final | 2 PASS; 15/15 GREEN |
| `camera-shift` browser | camera; final | **11/11** GREEN; **11/11** GREEN |
| `official-defaults-palette` | RAMP | **3/3** PASS |
| `new-project` browser | RAMP | **8/8** PASS |
| `history` | RAMP | **39/39** PASS |
| `render-regressions` | final | **2/2** PASS |
| `input` | final | **13/13** PASS |
| `tools/camera-routes.mjs` | `3a60679`; final | 5 reds on the yaw/pitch dial only; **GREEN 5/5, SAME** |
| `keyboard-window` | final; `3a60679` | RED both, at its window-drag line (below) |

Every suite was green on its first run, so none was re-run alone. The RAMP-tree runs are on the same `lab/` bytes as the final tree: only `tools/` and docs changed after them.

## `lab/*.js` lines
`36,288` (base) → `36,469` (adopt: `sw.js` +181, generated, C0's too) → `36,440` (camera: `rack.js` −27, `native-ui.js` −8, `camera-law.js` +4, `mod-port.js` +2) → **`36,293`** (RAMP: `paletteview.js` −156, `native-ui.js` −4, `rack.js` +11, `palette-app.js` +3, `sw.js` −1). That is **C1 −176**.

## Blockers
None for the merge. One red that is not C1's:
- **Command:** `LW_PORT=8793 GD_PORT=5263 node tests/keyboard-window.browser-test.mjs`
- **Error:** `AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value: assert.ok(dragged.x >= before.left + 60 && dragged.saved.x === dragged.x)`
- **Same on the adopt-only `3a60679`** (served from `.tmp/base`), so the bare adopt (kit 1.5) causes it. It belongs to C0 or C3, which owns the keyboard window and rewrites this suite.
- Its `hooked` check, for `camReset` and `palette` among the `data-key-action` hooks, runs before the drag line and passes on C1.

## Open items for C2–C9
1. **C0 (the cascade):**
   - `index.html` links four kit sheets as an interim (`mir/controls/controls.css`, `mir/controls/colour-controls.css`, `mir/panels/camera.css`, `mir/panels/ramp.css`). Drop them when `mir/mir.css` lands, since it imports all four.
   - `lab.css`/`skin.css` keep dead rules: `.camera-motion`, `.camera-control`, `.palette-action`, `.palette-seam`, `.pal-*`.
   - λWAVES' CSS seems to hide the RAMP's `SEAM at ±π` readout (`.ro`) in the native skin. That is a glass ruling.
2. **C5 (history):** the history row names for kit controls are poor. The RAMP stepper's › makes a row "edit", and the swatch makes "STOP COLOUR — TAP FOR THE CHOOSER, DRAG UP OR DOWN TO TURN ITS HUE · PALETTE". `hTouchName`'s `select, input` branch could take `.split(' — ')[0]`, or the kit's gesture names replace it. `tests/history.browser-test.mjs`' two palette scenes (lines 163–166) were rewritten here. Expect a two-line merge touch.
3. **C2:** `native-ui.js` lost its camera and palette re-layouts here (12 lines). GRADE is unbuilt (above).
4. **C3 (rack):** `createCameraPanel` is built with `spec.build` into λWAVES' card. With the kit rack, pass `rack` and drop the card's `group`. The panel's `spec` already carries `id: 'camera'`, the title and the glyph.
5. **C4 (modulation window):** the kit panels test `typeof mod.add`. If `installModulation()`'s result is passed later, the panel WILL register `observer.*` targets. Either keep passing a port without `add`, or move the six definitions into the panel then (`pitch` would need `ranges`' `map: 'bipolar'`/def 0 preserved).
6. **Brief 2 (MIR):** the 3-D HOME ignores pan in the kit's own `homeAll`. λWAVES' `port.home` resets the shift, so this does not bite here. The pad's hint wording and the CSS port are still the kit's.
7. **CLAUDE.md, drafted for the integrator (not applied):** "The CAMERA card is MIR's `createCameraPanel` over `createCameraLaw(...).port` (`rack.js`, grep `createCameraPanel`); the saved `observer.*` routes stay `rack.js`' definitions, whose dials are the panel's (`camKnobs`) — the panel registers none (its `mod` has no `add`). The phase palette is MIR's `createRampPanel` (`DEFAULT_PALETTE` in `lab/palette-app.js`). `tools/camera-routes.mjs` proves the saved routes after a camera change."

## Exact next step
Claude Sos merges `worktree-agent-a6673ac11f828a394` into `sos-s0` **after C0**:
1. The adopt commit `3a60679` is identical to C0's: take C0's. On a `lab/sw.js` conflict, take either side and run `node tests/pwa.test.mjs --write`.
2. In `index.html`, keep C0's `mir/mir.css` and drop C1's four interim links.
3. On REPORT.md, merge the two `0.5.0 C — THE ADOPTION` headings.
4. Then run `node tests/camera-shift.test.mjs`, `camera-shift` 11, `history` 39, `new-project` 8, `official-defaults-palette` 3, and `tools/camera-routes.mjs` (GREEN on the 5 projects) on the merged tree.
