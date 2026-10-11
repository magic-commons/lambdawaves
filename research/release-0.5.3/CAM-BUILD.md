# CAM-BUILD · B-CAM, 0.5.3 "Rack Tune": M5 THE SPHERE RINGS ANSWER LIVE · M6 CLASSIC CAMERA · M7 THE PAN CHORD

**STATUS: PAUSED on a usage alarm.** M5 and M6 are done and committed. The digest lock with the camera lock ON has not been run. M7 has not
started. Base `3d41ac0`. Commits: `71cb05b` (M5), `f936a02` (M6), then this file. Worktree
`/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-aac534fab096929a1`, branch `worktree-agent-aac534fab096929a1`. Not pushed.

## §1 · The sphere measurement (M5): DONE
The probe is `research/release-0.5.3/cam-probe/sphere-drag.mjs`. It drags with a real mouse (WebDriver actions), holds the button between
calls, and samples the page before the release. On a six-step drag of each CAMERA control on 3d41ac0:
- **SPHERE (the three rings):** the pose moved on 6/6 steps, and the stage drew 12 frames before the release, 0 at it. The sphere's own
  arrow and its YAW · PITCH arcs moved on **0/6** steps. They did not move at the release either; they moved only at the next port notice.
- YAW arc, PITCH arc, ZOOM, FOV, the PAN pad, PAN X and PAN Y: the pose and the control's drawing moved on 6/6 steps; 10–12 frames each.

So nothing commits late on the stage. The late part is the sphere's own drawing. The cause is in the kit (`lab/mir/panels/camera.js`):
`turnBy` takes the `port.turn` road and never sets the arcs, and `sync()` skips a sphere while it is dragged. Because of that, each step
also turned from the stale arrow: on a steady up-left drag the pitch went 0.38 → 0.75 → −0.29.

**The fix:** `lab/windows/material.js:119-120`. The port that λWAVES gives the panel wraps `turn` and sets the two arcs from the port after
each turn (+1 line). After the fix the sphere drag moves its drawing on **6/6** steps. The stage still draws 12 frames per drag, the same
as before. The kit change is filed as `research/release-0.5.3/MIR-BRIEF-sphere.md`.
**Guard:** `tests/camera-shift.browser-test.mjs`, "the SPHERE answers live". It fails on 3d41ac0 (the arrow moved on 0 of 3 steps) and
passes after the fix.

## §2 · The lock's roads (M6): DONE
| road | gate | the case that pins it |
|---|---|---|
| PAN pad, PAN X, PAN Y (port `panX`/`panY`) | `setShift` returns early with a notice; the pad is disabled under the lock | node camera-shift §9; browser camera-shift (PAN X key) |
| PAN HOME (port verb) | `setShift` | node §9 |
| Alt-drag, Alt+Shift-drag (`stage-gestures.js` slide → `panBy`) | `setShift` | stage-gestures (real law); browser (the driver's real Alt-drag) |
| two-finger slide and pinch (`stage-gestures.js:109-110`) | `panBy` → `setShift`; `zoomAt` → `anchor` adds nothing | stage-gestures (real law); browser (synthetic pinch) |
| the wheel at the cursor (`atCursor`) | `anchor` adds nothing | stage-gestures (real law); browser |
| Alt+Arrows (`shell/keys.js:64-67` → `panBy`) | `setShift` | browser (the driver's real Alt+→) |
| the dolly zoom, Ctrl+Shift+Q/E (`keys.js:31-39`: `setDist` + `setFov`) | `anchor` | node §9; browser (the driver's real Ctrl+Shift+Q, twice; d·tan(fov/2) held) |
| ZOOM, FOV dials; an anchored `setFov(v, c)` | `anchor` | node §9; browser |
| observer.panx/pany routes (`shell/modulation.js:45,47`, raw) | clamped to 0 when `cameraPort.get('lock')` is true | browser (`registry.applyModulated`; once released it moves again) |
| project or link open (`shell/persist.js:163`, raw) | `clampShift(!camera.lock && pr.obs.shift)` | history browser 5b (opens centred; record and settings bytes identical) |
| RESET VIEW / HOME | `CAM.HOME.shift` is [0, 0] | node §9 |
| engaging the lock | `setLock`: the shift is set to [0, 0] directly (a routed base is not written) | node §9; browser (the switch) |
| left raw on purpose: the film hold's pose put back (`rack.js:647`) and a film's `poseAt` (`render-exact.js:698`) | these are not pan roads: they put back a pose that was saved, or a scripted pose | — |

PREFERENCE `camLock` is saved beside friction and applied when it is a boolean (`shell/settings.js:37,102`). It is in the PREF/FEEL lists
(`new-project.test:39,45`, `first-run.test:141`, `current:173,177,181`). The getter is nested (`__LW.camera.lock`), and `lw-facade` is not
rewritten. The port has a `lock` id in ROADS. The kit's vocabulary does not include it, so the panel draws nothing for it.

## §3 · The lock runs, and every suite run
| run | result |
|---|---|
| THE LOCK `--check --query gastab=0`, camera lock OFF | **860 · 0/0** GREEN (rigfree clear first) |
| THE LOCK `--fixture …digest-lock-s4a.json --query gastab=0`, camera lock OFF | **1004 · 0/0** GREEN |
| THE LOCK ×2, camera lock **ON** | **NOT RUN** (see next step) |
| serialize-bytes vs a `git archive 3d41ac0` tree served on 8963 (`.tmp/sb-base.json`) | **11/11 full · 11/11 edit IDENTICAL** |
| `node tools/new-project.mjs --check` | in step, 16117 B, not regenerated |
| `node tools/settings-probe.mjs --out` | 0/6 red; `camLock` (false) is in every scene's blob |
| `tests/camera-shift.browser-test.mjs` | GREEN (M5 sphere case + 3 LOCK cases) |
| `tests/history.browser-test.mjs` | GREEN (+5b the LOCK) |
| `tests/current.browser-test.mjs` | full suite RED at :138 (the audio card's `followsPalette` / `longMeters`). **The base 3d41ac0 tree reds at the same line**, so this is not M6. The scope-law block (:170-189, the edited lines) run alone (`.tmp/scope-only.mjs`) is GREEN |
| `tools/camera-routes.mjs` | 5/5 GREEN (after M5) |
| `tools/stage-dead-probe.mjs` | 10/10, DEAD 0 (after M6) |
| `bash test.sh node` | 0 (after M5 and after M6; includes stage-gestures, camera-shift, new-project, first-run, keyboard-shortcuts) |
| sphere probe before / after | 0/6 → 6/6 drawing steps; 12 frames both |

## §4 · What Josh sees
- `eye/cam-sphere-before.png` / `eye/cam-sphere-after.png`: the screen in the middle of a sphere drag. Before the fix the stage has turned
  but the sphere's arrow has not. After the fix the arrow has turned with the stage.
- The LOCK switch beside SET Δρ REF, and the PAN pad greyed out under it. **PNG pair not yet taken** (`eye/cam-lock-*.png`, next step).

## §5 · Lines (`cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l`)
27,951 → **27,962 (+11)**; the budget is +20. M5 is +1 (material.js). M6 is +10: camera-law +5, material.js +4, settings +1. modulation.js
and persist.js changed in place, 0 lines.

## §6 · Sentences for the integrator (not applied)
- `docs/STATE-SCOPES.md:45`: "camera feel: `friction`, `spin` (speed), `dragGain`, `fling`, and the LOCK `camLock` (0.5.3: the classic
  camera; the pan is held at the centre and every zoom is from the centre)".
- CLAUDE.md, after the keyboard paragraph's dolly-zoom sentence: "The CAMERA card's LOCK (PREFERENCE `camLock`, off by default) is the
  classic camera. It holds the pan only: the shift stays 0, every zoom (the wheel, the pinch, the dials, the dolly zoom) is from the
  centre, the PAN pad rests, and a route on observer.panx/pany or a project's shift opens centred without its record being written. FOV,
  CONTROL and the turn stay live (`lab/camera-law.js` `setLock`)."

## §7 · What I could not measure, and what is NOT done
- THE LOCK with the camera lock ON (both fixtures).
- **M7 (0 lines):** the note at `material.js:124` and the header of `key-table.js` should name Alt(+Shift)+Drag as the pan (1:1, no fine
  pan, R8). A Shift case in `tests/stage-gestures.test.mjs` (Alt+Shift-drag → pans `[[0.02, 0.025]]`, the same as Alt) and a
  `keyboard-shortcuts` run. Not started.
- The LOCK PNG pair.
- An iPad (M14).

## EXACT NEXT STEP (a fresh builder, from tip of `worktree-agent-aac534fab096929a1`)
1. `python3 tools/gate/server.py <worktree> 8963 &` (record the pid). `LW_PORT=8963 GD_PORT=5433`. Run `node research/release-0.5.2/r2b-measure/rigfree.mjs`
   before each browser run, and never pipe a gate into `head` (it orphans the driver).
2. THE LOCK with the lock ON: `git archive HEAD` into `.tmp/locked-tree`. In that copy only, change `let locked = false` to `true` in
   `lab/camera-law.js`, and serve it on 8963. From the worktree, run
   `node tools/perf/digest-lock.mjs --check --query gastab=0` and then `--check --fixture research/release-0.4.0/measure/digest-lock-s4a.json --query gastab=0`.
   Expect 860 and 1004 · 0/0, because the fixtures render at HOME. Serve the worktree again afterwards.
3. M7: edit the note at `material.js:124` and the comment at `key-table.js:5` in place. Add the Alt+Shift case to `stage-gestures.test`. Run
   `pwa --write`, `bash test.sh node`, and the keyboard-shortcuts test. Commit "M7: …".
4. The LOCK PNG pair, `eye/cam-lock-off.png` and `eye/cam-lock-on.png`: a shifted pose, then 3 wheel steps at an off-centre cursor, with the
   lock off and with it on. Fill §3, §4 and §7 here, and commit.
