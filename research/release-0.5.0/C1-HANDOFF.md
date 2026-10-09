# C1 HANDOFF — the CAMERA panel through A8's port (live state; PAUSED on a usage alarm, 2026-10-08)

- Worktree: `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a6673ac11f828a394`
- Branch: `worktree-agent-a6673ac11f828a394`, reset to `7044f37` (the `sos-s0` tip, pre-C baseline).
- `cat lab/*.js | wc -l`: base **36,288** → adopt 36,469 (generated `sw.js` +181, identical to C0's) → camera **36,440** →
  RAMP **36,293**. C1's own delta so far **−176** (36,469 → 36,293); against the base +5 only because of the adopt's sw.js list.
- Ports: `LW_PORT=8793 GD_PORT=5263`. The gate server is STOPPED (restart: `python3 tools/gate/server.py <worktree> 8793`).

## Commits
| sha | step |
|---|---|
| `3a60679` | the bare adopt of MIR 1.5 alpha.24 (`adopt.mjs --line 1.5`; `pwa --write` 372 entries) |
| `47b3338`, `34926a1` | this hand-off |
| `82c0313` | the CAMERA panel over A8's port; CAMERA MOTION (47) leaves; A8 open items 2–4 resolved |
| `e8c831d` | RAMP: `paletteview.js` (156) leaves for `createRampPanel` |
| `6cfa33d` | hand-off at the usage pause |
| `daad244` | `tools/camera-routes.mjs`: GREEN on the 5 projects, SAME as `3a60679` (routes, bases, law); resumed after the pause |

## Gates run (8793/5263, one browser suite at a time, 4 s apart; every one green on its FIRST run, none re-run)
- node 85: after the adopt, the camera and the RAMP — the same 4 reds, all C0's: `mir-manifest` (alpha.24 not in ACCEPTED),
  `new-project` (--check: bpm 60 → 30 only; C1 changes nothing else in the empty project — `.tmp/jsondiff.mjs` proved it),
  `wiring` (unreached kit modules, R5-W1), `pwa` (`lab/mir/shell/gui.js: https://www.fabiandesmet.com/`).
- browser: `camera-shift` 11/11 (camera tree), `official-defaults-palette` 3/3, `new-project` 8/8, `history` 39/39 (RAMP tree).
- NOT YET RUN on the final tree: `camera-shift` again, `render-regressions`, `input`, `keyboard-window` (it checks
  `[data-key-action="camReset"]` and `"palette"` — both present), the route script.

## Unfinished
1. `tools/camera-routes.mjs` is WRITTEN, UNRUN, UNCOMMITTED (untracked). Run it on the base and on this tree:
   `.tmp/base/lab` already holds `git archive 3a60679 lab`. Serve it: `python3 tools/gate/server.py .tmp/base 8793`,
   `LW_PORT=8793 GD_PORT=5263 node tools/camera-routes.mjs --out .tmp/routes-base.json`, stop it by pid; serve the worktree on
   8793, `LW_PORT=8793 GD_PORT=5263 node tools/camera-routes.mjs --against .tmp/routes-base.json --out .tmp/routes-c1.json`.
   Saved observer routes in the 5 projects: only WAVE DANCER `r4 → observer.fov` (macro m3 ← LFO s1); bases for
   yaw/pitch/dist/fov in WATER, BENZENE, N₂; NEW none.
2. The remaining browser gates above; then REPORT.md (create `## 2026-10-08 · 0.5.0 C — THE ADOPTION` at the END if C0's is
   absent, then `### wave 197: C1 THE CAMERA PANEL — …`), and `research/release-0.5.0/C1-BUILD.md` (A7-BUILD's shape).

## Decisions taken (for C1-BUILD)
- Mount: `createCameraPanel({ mode: '3d', port: {...cameraPort, set → +coalesced saveSettings for spin/friction/drag/fling},
  modPrefix: 'observer', project: false, mod })` then `spec.build(group(wCam.body, 'CAMERA'))`; no history; HOME carries
  `data-key-action="camReset"`; SET Δρ REF keeps its own row.
- (a) registry: `mod` is λWAVES' mod port WITHOUT `add` → the panel registers nothing; the six observer.* defs stay in rack.js
  (ids/maps/ranges unchanged), their `knob` accessors are the panel's widgets (`camKnobs` from `view.targets()`); no raw road
  needed (a raw `port.set` would break the unrouted hand: zoom's centre anchor, FREE yaw's turn). mod-port.js gained
  `isModulated`/`baseOf`. (b) notices: defs end in `camOut` = setKnob + `cameraPort.notify()` + PRESENT. (c) SPIN: `CAM.SPIN`.
- Fixed on the way: a dial is ONE axis (`setShift(x, y, axis)`): a hand on PAN Y no longer rewrites a routed PAN X's base.
- yaw/pitch are drop targets now (the sphere's arcs). Kit look: SPIN reads °/s; the PAN pad's hint says "share of its width".
- RAMP: `palette` adapter keeps the old API; `DEFAULT_PALETTE` → `lab/palette-app.js`; history row names for kit controls are
  "edit" / the swatch's long aria-label (C5: `hTouchName`'s input branch could `.split(' — ')[0]`).
- index.html links 4 kit sheets (controls, colour-controls, panels/camera, panels/ramp) as an interim until C0's `mir/mir.css`.
- GRADE not built: the row's "what leaves" lists none; λWAVES' tone knobs are field-shader uniforms on WAVE (C2/C-later).

## Exact next step
C1 is COMPLETE (the docs commit: REPORT.md wave 197 + `C1-BUILD.md`). Final gates: camera-shift 11/11, render-regressions 2/2,
input 13/13, the route script GREEN 5/5 and SAME as `3a60679`; node 85 with C0's 4 reds; `keyboard-window` red at its drag line
on this tree AND on `3a60679` (the adopt's). All servers stopped. Next: Claude Sos merges this branch after C0 (`C1-BUILD.md`).
