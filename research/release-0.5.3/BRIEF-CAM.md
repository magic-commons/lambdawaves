# BRIEF B-CAM · M5 THE SPHERE RINGS ANSWER LIVE + M6 CLASSIC CAMERA + M7 THE PAN CHORD (0.5.3 "Rack Tune"; Opus builder; W2, beside B-TR — `shell/modulation.js` hunk-disjoint: yours :45,47, B-TR's :162-215; B-TR merges second)

**Read first, whole:** `research/release-0.5.3/PLAN.md` (§0 facts 6–8, rows M5 M6 M7, §2 gates incl. G-L and G-B, §7 R3 R8, §11 Josh's answers: "2: sphere rings"),
`AUDIT-OPUS-1.md` Part A rows M5–M7 and Part B §8 risk 2 (the lock's leak roads), `localise/CAMERA-STAGE.md` §2–§4, `lab/camera-law.js` (:165-176 `createCameraLaw`,
`anchor`, `setShift`, `panBy`, PAN HOME :195, `resetView` :179, `present` :49), `lab/windows/material.js:90-130` (the camera card; the sphere; :119 the write per move;
:123 the SET Δρ REF row; :124 the note), `lab/shell/settings.js:30-110` (PREFERENCE beside friction/spin/dragGain/fling :37,98-101), `lab/shell/persist.js:150-170`
(:163 the raw `obs.shift` restore — YOURS this wave), `lab/shell/modulation.js:40-50` (the two raw `observer.pan*` routes :45,47), `lab/mod-port.js:80-90` (`hand` :86),
`lab/stage-gestures.js` (`atCursor`; :102-103 the pinch; the slide :14,33,70; the Shift test :107-114 — B-STAGE edited this file in W1: read the merged tip),
`lab/key-table.js`, `lab/rack.js:260-280` (`schedule()`'s early returns), `tools/camera-routes.mjs`, `tests/camera-shift.browser-test.mjs`, `tests/new-project.test.mjs:39-45`
(the PREF set), `tests/first-run.test.mjs:141`, `tests/current.browser-test.mjs:173,181`, `tools/settings-probe.mjs`, `tools/perf/digest-lock.mjs` (header: THE LOCK's
two runs), `docs/STATE-SCOPES.md:45`, `CLAUDE.md` (the three scopes; the keyboard paragraph), `docs/NOTES-FOR-AGENTS.md` (the rig law).

## The rows, as audited and as Josh answered
**M5 (0–2).** Josh: the "XYZ grid" is the camera SPHERE's three world rings, dragged from the rack window; the stage animates only on mouse release. MEASURE FIRST:
a CDP drag on the sphere (and, for the record, each CAMERA dial and the PAN pad), sampling `__LW.obs` and `stats.presents` BEFORE mouseup; find where the ring drag
commits only on release (the sphere control's own input-vs-change wiring in the kit's control factory — read, never edit — or λWAVES' handler at `material.js`, or
`schedule()`'s `mod.syncing` return at `rack.js:266`) and make it commit per move through `cameraPort.set` → `present()` → `schedule(TIER.PRESENT)` at :119 (and
`mod-port.js:86` `hand` for a routed dial). The BUILD shows presents-per-drag before/after. If the fix needs the kit, file `MIR-BRIEF-sphere.md` and say so.
**M6 (+18).** A `locked` flag in `createCameraLaw`: `anchor` at CENTRE, `setShift`/`panBy` early-return, `setShift(0,0)` on engage, the two raw `observer.pan*`
routes (`shell/modulation.js:45,47`) clamped, the restore seat `persist.js:163` (a project's non-zero shift opens CENTRED under the lock; the project's bytes untouched),
Alt+Arrows, the two-finger slide, the pinch (`stage-gestures.js:102-103`) and the dolly zoom (Ctrl+Shift+Q/E) all through `setShift`/`panBy`/`anchor` or listed and
tested; a `lock` id on `ROADS`; PREFERENCE `camLock` beside friction (`settings.js:37,98-101`; `STATE-SCOPES.md:45`; the PREF set in `new-project.test.mjs:39`); the
control: a LOCK switch beside `SET Δρ REF` (`material.js:123`). **R3: the lock holds the PAN only** (zoom from the centre is what "locked pan" means; FOV, mode,
yaw/pitch stay live). The getter is NESTED (`__LW.camera.lock`) so `lw-facade` stays 1/1 with no `--write`. Josh sees: the LOCK switch; a centred zoom under it (PNG pair).
**M7 (0).** No code: the note at `material.js:124` and `key-table.js` name Alt(+Shift)+Drag as the pan; the Shift case joins `stage-gestures.test`. R8: no fine mode.

## Laws
Never edit `lab/mir/**`. Subtract, don't add. `node tests/pwa.test.mjs --write` after ANY `lab/` edit. JS budget **+20** total; stop and report at +30. **THE LOCK (G-L):
`node tools/perf/digest-lock.mjs --check --query gastab=0` (860 · 0/0) AND `--fixture research/release-0.4.0/measure/digest-lock-s4a.json --query gastab=0` (1004 · 0/0),
each run ALONE on a quiet GPU, with the lock ENGAGED and NOT** (a camera flag must not move a digest; the lock's states render at HOME). **G-B: serialize-bytes 11/11
IDENTICAL** (`node tools/serialize-bytes.mjs --out` + `node research/release-0.5.2/integrator/sb-compare.mjs`) — a PREFERENCE key never enters a project; `node
tools/new-project.mjs --check` passes WITHOUT regenerating or it is a defect. Servers: `python3 tools/gate/server.py <your worktree> 8963`, `LW_PORT=8963 GD_PORT=5433`;
`node research/release-0.5.2/r2b-measure/rigfree.mjs` before each browser suite; one suite at a time, 4 s apart (B-TR shares the GPU); stop your server by pid.
Scripts under `.tmp/`; `rack-deps.mjs` only `--classes --no-write`. One commit per row; NO push.

## Closers
the sphere drag probe (before/after presents); `tests/camera-shift.browser-test.mjs`; `node tools/camera-routes.mjs` 5/5; `node tests/stage-gestures.test.mjs` (+ Shift;
+ `atCursor` under the lock; + the dolly zoom under the lock); `tests/current.browser-test.mjs:173,181`; `node tests/new-project.test.mjs` (:39 the PREF set, :45);
`node tests/first-run.test.mjs`; `node tools/settings-probe.mjs --out` 0/6 with `camLock`; `node tools/new-project.mjs --check` exact; serialize-bytes 11/11; THE LOCK ×2
engaged and not; `tests/history.browser-test.mjs` (a project with a shift opens centred, bytes identical); `tests/keyboard-shortcuts.test.mjs`; `bash test.sh node`.

## Deliverables
`research/release-0.5.3/CAM-BUILD.md`: §1 the sphere measurement (which control, where it committed late, the fix); §2 the lock's roads table (every road → through
which gate, the case that pins it); §3 the lock runs; §4 what Josh sees (PNG pairs `eye/cam-*.png`); §5 lines; §6 CLAUDE.md / STATE-SCOPES.md sentences for
`camLock` (write them; the integrator applies); §7 what you could not measure. Commit it. Hand back ≤ 300 words (worktree, branch, tip, commits, suites + results,
blockers, next step); the same to `~/.claude/handoffs/agents/<your id>.md` if allowed.
