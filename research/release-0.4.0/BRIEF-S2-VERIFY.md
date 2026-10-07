# λWAVES 0.4.0 · S2 VERIFY — BRIEF for the camera verifier (fresh eyes)

**Written by Claude Sos (the fallback Major Agent), 2026-10-07, the way `BRIEF-S0-VERIFY.md` was written.** PLAN.md §6
row S2 ends "a verifier": the camera uniform is the frame path, and the lens shift touches the ray pass, the line pass,
every 2-D overlay, the pointer maths, the pose scope and the link. You are a FRESH Opus with no memory of the build; the
builder's report (`research/release-0.4.0/S2-CAMERA-BUILD.md`) is a claim list to test, not evidence. The contract you
verify against is `BRIEF-S2-CAMERA.md` (§1 the one convention, §2 K1–K3, §3 acceptance) and `PLAN.md` §4 F4 / §6 S2 / §9
(R-C1: shift only, no target pivot). You fix nothing; you report, with the reproducing command for every finding, ranked
BLOCKER (must be fixed before S3 is merged on top) / SHOULD (fix in S2 if cheap, else a REPORT line) / NOTE.

## 0 · Laws

Never edit `lab/`. Never `pkill -f`; kill by pid. Git only inside your worktree; never push. Your ports: `LW_PORT=8749`,
`GD_PORT=5217` (`python3 tools/gate/server.py <your-root> 8749 &`; ready when it prints `λWAVES gate server on …`). The
GPU is shared and another builder may be running suites: one browser suite at a time; a timing flake (`current`,
`frame-occlusion`, `export3d`'s loop median, `wigner`, `electrostatics`) and a red digest lock are re-run ALONE before
they are believed (the RTX 3070's one-ulp fault in power state P5). Your worktree starts at the merged S2 tree (the
integrator names the commit in your prompt; your branch is new, so `git reset --hard <sha>` first); confirm with
`git log --oneline -1`.

## 1 · The locks and the gates, once

- **The 1004-value digest lock at shift 0** (`node tools/perf/digest-lock.mjs --check` with the all-grids flags the tool's
  header and REPORT wave 116 give; the 96³ run used `--grids 96 --query gastab=0` in waves 144–1xx) — byte-identical
  (0 readback differences, 0 record-byte differences). This is the one result that decides "frame path untouched at
  p = 0". A red is re-run alone; a second red is a BLOCKER whatever the builder's report says.
- `bash test.sh node` (all green; name every red with its first message). `node tools/new-project.mjs --check`.
  `node tests/pwa.test.mjs` without `--write` (the generated `lab/sw.js` is in step).
- Browser, one at a time, on your ports: `render-regressions` (the scaled hit-test — the pointer maths moved),
  `frame-occlusion`, `keyboard-window`, `export3d`, `current`, `new-project`, `history`, `statelink` if a browser half
  exists, plus any suite the builder added. Record suite · count · verdict.
- **The device report** (`tools/perf/device-report.js`, its 30 s scene) on the 3070: the builder's before/after pair is
  a claim; run it once yourself at HEAD and compare with the builder's "before" numbers within the report's own noise.

## 2 · The one convention (K1) — each a scene, each with its command

- **At `p = [0, 0]` every byte is today's.** `tests/camera-shift.test.mjs` exists, runs green, and actually asserts the
  lane and the matrix bit-for-bit against the pre-S2 formulas (read it; a test that compares the new code with itself is
  a SHOULD). The lock above is the GPU half.
- **The pivot appears at `p`.** With `obs.shift = [0.4, −0.3]`: the origin projects through `toScreen` to
  `((1 + 0.4)/2·W, (1 − (−0.3))/2·H)` within 0.5 px; `pointerRay` at that pixel passes within 1e-6 of the origin;
  `unproject` of that pixel on the pivot plane returns ≈ (0, 0, 0). Read back through the app's own functions
  (`lab/field.js`, `lab/rack.js`) in the browser.
- **One FRAME corner, one pixel** (the test that decided the matrix sign): at `p = (0.4, −0.3)`, a FRAME corner lands on
  the same pixel through the line pass (the FRAME lines on the stage canvas — a pixel probe along the expected edge) and
  the ray pass (the box edge of the volume's readback), and `pointerRay`/`unproject` of that pixel returns the corner's
  world coordinate. If the builder's test does this, run it and read its assertions; if the sign were wrong the line pass
  and the ray pass would disagree by `2·0.4·W/2` pixels — say which you saw.
- **Clamp:** `obs.shift = [3, −3]` reads back as `[1, −1]`; the pivot sits on the frame's edge, inside the canvas.
- **TIER.PRESENT only:** a shift step triggers no solve, no reconstruct and no volume upload (count the worker messages
  or the field's upload counter across ten shift steps: 0).

## 3 · The hands (K2)

- **Shift then RESET = identity:** pose bytes equal before a shift and after RESET VIEW (serialize the pose, compare).
  Double-click and double-tap also clear it.
- **The cursor-anchored point** is invariant to ≤ 0.5 px across a wheel step, a pinch step and a FOV step at a non-zero
  shift: `unproject` the cursor pixel before and after each step; compare the world point. The ZOOM dial and the keys
  anchor at the centre (the centre's world point is invariant instead).
- **Alt-drag** pans one pixel per pixel (`Δp = (2Δx/W, −2Δy/H)`); a two-finger drag on touch pans by the centroid's
  delta beside the pinch; the wheel is still dolly. If the builder reported that the window manager takes Alt-drag,
  check the REPORT line and that keys and knobs remain the road (a NOTE, not a BLOCKER).
- **Alt+Arrow** steps 0.05 uv, Shift fine; `tests/keyboard-shortcuts.test.mjs` extended; no overlap with Q/E, WASD,
  Shift+Q/E, Ctrl+Shift+Q/E; `AltLeft`/`AltRight` are still not bindable alone.
- Nothing per tick: a still camera at a non-zero shift adds no per-frame CPU work (FRAME PROFILE, or a 2 s MutationObserver
  on the overlays' spans = 0 writes).

## 4 · The panel, the scope, the link (K3)

- CAMERA has PAN X / PAN Y (bipolar −1…1) and PAN HOME; the targets `observer.panx` / `observer.pany` modulate (an LFO on
  PAN X moves the picture); the panel note gained its sentence; no new window, tab or setting.
- **Three scopes:** `obs.shift` travels with the pose (PROJECT), is not a history row (shift, then Ctrl+Z: the shift
  stays), and a project open leaves `lambdawaves.q0.settings` byte-identical outside the WORKSPACE keys.
  `docs/STATE-SCOPES.md` l.40's pose row says `shift`. An older project without `shift` opens at 0 (`git show
  bd9b0e5:lab/new-project.lambdawaves.json` through the import road).
- **The link:** mint a link with a shift and a molecule (water, 1b₁); open it in a fresh page: the shift, the molecule,
  the basis, the view and the orbital are back. A link minted on `bd9b0e5` (`tests/statelink` fixtures, or mint one from
  the old tree via `git show bd9b0e5:lab/statelink.js` in node) opens with shift 0 and the right pose. The VERSION POLICY
  (`lab/statelink.js` l.23–31) was kept: v1 unchanged, fields appended at the END of the CAM section, ONE new tag with
  its `TAG_NAME`. `tests/statelink.test.mjs` runs green and asserts the three round-trips the brief names.
- `node tools/new-project.mjs` was regenerated only because the pose default gained a field (the builder said so);
  `--check` is in step.

## 5 · The laws of the house

- `lab/mir/**` and `lab/fonts/**` byte-identical to `bd9b0e5` (`git diff bd9b0e5 HEAD --stat -- lab/mir lab/fonts`
  empty); the CAMERA panel's kit half was NOT edited (it is S5's brief 2).
- `lab/*.js` line count before and after as the builder reports; recount yourself (`cat lab/*.js | wc -l` on
  `bd9b0e5` and HEAD). "Subtract, don't add" is a SHOULD if the count grew without the report saying why.
- No target pivot built (R-C1). No XY pad. No version bump, tag, CHANGELOG, deploy or push in the branch's log.
- REPORT.md has the S2 waves under `## 2026-10-07 · 0.4.0 S2 — THE CAMERA`, numbers measured not hoped; the derivation
  of zoom-to-cursor is there.

## 6 · Report

`research/release-0.4.0/S2-VERIFY.md`: the lock and gate table (suite · count · verdict), then findings ranked BLOCKER /
SHOULD / NOTE, each with its reproducing command and the law it breaks; then "fit to merge S3 on top: YES / NO
(because)". Commit it on your worktree's branch. Kill your gate server by pid. Final message (Josh's rule): the verdict
line, the BLOCKER count, the SHOULD count, the file path, your worktree path, your branch, the commit, the tests you ran
with counts and which were re-run alone, blockers with the exact command and error text, and the exact next step.

## 7 · Harness

Compound shell with variables, loops, heredocs or backticks may be refused: plain commands, scripts as files (your job
tmp dir or `.tmp/`). If a command is refused, reshape it; never retry verbatim.
