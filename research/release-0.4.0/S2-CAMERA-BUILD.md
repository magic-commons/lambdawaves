# λWAVES 0.4.0 · S2 THE CAMERA — BUILD (waves 145–148)

Built by Opus 5.5 (the S2 camera builder) in worktree
`/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a404c855dc2be006b`, branch
`worktree-agent-a404c855dc2be006b`, from `bd9b0e5` (the tip of `sos-s0`: S1 NAMES + S1′ cameraEye). Nothing pushed, tagged
or deployed. A fresh-context verifier follows (PLAN §6: the camera uniform is the frame path).

## The hand-off in ten lines

1. K1–K3 are built and committed; the lens shift is real in the ray pass, the line pass, the 2-D overlays and the pointer.
2. The line pass's sign is the brief's (`P[8] = −px`, `P[9] = −py`), confirmed on the GPU by the FRAME-corner gate.
3. One FRAME corner, one pixel at p = (0.4, −0.3): line 0.29 px, ray 0.72 px, pointer 0.29 px from the prediction.
4. The point under the cursor moves 0.015 px (wheel), 0 px (pinch), 0 px (FOV) through `unproject`; shift then RESET = the boot pose.
5. Alt-drag, two fingers, Alt+Arrows (no Back navigation), PAN X / PAN Y / PAN HOME all drive one `setShift`.
6. The link carries the shot: the CAM tail + `MOL 0x0A`; "1b₁ of water, framed in the gap" is a 340-character link.
7. Digest lock 588 GREEN on base, K1, K2 and the final tree; the 1004-value lock GREEN at the end (meta reads a zero shift as absent).
8. Gates green, re-run alone where timing or the driver-port race bit; `current`'s audio-face check fails identically on the base.
9. `lab/*.js` 35,738 → 35,828 (+90, a feature); the device report equal within its noise; M5 pending.
10. Next: Sos merges this branch into `sos-s0`; the S2 verifier runs on 8749/5217 (start with `tests/camera-shift.browser-test.mjs`).

## The commits

| sha | what |
|---|---|
| `38f63fd` | K1 · THE SHIFT in the engine: `lensShift` (the ray lane + the principal point), `toScreen.at` + its inverse `toScreen.ray` (the pointer's), `clampShift`, the GLB's `extras.lensShift` |
| `1c1bbf6` | K2 · THE HANDS: `zoomAt` / `setFov(v, c)` / `setShift` / `panBy`, the wheel and pinch at the cursor / centroid, two fingers and Alt-drag slide, the Alt+Arrow quartet, `CAM.HOME.shift`, `readPixels`/`linePixels` `keep` |
| `3acaac0` | K3 · THE PANEL, THE SCOPE, THE LINK: PAN X / PAN Y / PAN HOME, `observer.panx/pany`, the pose's `shift` in serialize/restore/STATE-SCOPES/the empty project, the CAM tail + the `MOL 0x0A` tag, chemview's name-first orbital |
| (this file + REPORT waves 145–148) | hand-off |

## The convention as built (BRIEF §1; the sign the corner test chose)

- `obs.shift = [px, py]` = where the pivot appears on the frame, NDC (+y up), each component in [−1, 1] (`CAM.SHIFT`,
  `clampShift`). Positive px moves the molecule right.
- **Ray pass** (`field.js` `writeView` → `lensShift`): forward lane `v[12..14] = fwd − px·tanH·aspect·right − py·tanH·up`.
- **Line pass**: `M_PERSP[8] = −px`, `M_PERSP[9] = −py` — **the brief's sign, confirmed on the GPU**: at p = (0.4, −0.3) the
  box's left corner lands at (677.5, 354.5) in `linePixels` and (678.5, 354.5) in the ray pass against the +p prediction
  (677.78, 354.44) — 0.29 px and 0.72 px — while the −p prediction is 568 px away and the unshifted one 284 px.
- **2-D overlays** (`toScreen.at`): `((u + px + 1)/2·W, (1 − v − py)/2·H)`, i.e. today's pixel + (px·W/2, −py·H/2).
- **Pointer** (`toScreen.ray`, `pointerRay` = three lines over it): `u − px`, `v − py`. Its ray through the GPU's corner
  pixel misses the 3-D corner by 0.29 px.
- **At p = 0** `lensShift` writes nothing and `at`/`ray` add exact zeros: node proves the bytes against bd9b0e5's own
  expressions; the lock proves the frame.
- **Zoom to the cursor**: `p′ = c − (c − p)·k`, `k = D·tanH / (D′·tanH′)`; wheel and pinch anchor at the cursor / centroid,
  the dials and keys at the centre; a modulated ZOOM/FOV or a zoom at the DIST limit leaves the shift alone.
- **GLB**: glTF has no principal point; a shifted shot's camera node carries `extras.lensShift`.

## The lock

`LW_PORT=8747 GD_PORT=5215 node tools/perf/digest-lock.mjs --check --grids 96 --query gastab=0` (588 values at 96³):
GREEN on the base `bd9b0e5` (42 s), after K1 (81 s), after K2 (107 s) and on the final tree (38 s) — 0 readback
differences, 0 record-byte differences, nothing unrepeatable, 0 page errors. No red result, so no P5 re-run was needed.

**The 1004-value lock** (`--check --query gastab=0`, all three grids) on the final tree: **GREEN, 1004 values, 0 readback
differences, 0 record-byte differences, 61 s.** Its first run read RED with `META DIFFERS (inputs, not outputs): obs` and
0 value differences: the lock compares the boot pose it ran under with the fixture's, and K3's boot pose gained
`shift: [0, 0]`. `tools/perf/digest-lock.mjs`'s `meta()` now reads a zero shift as absent (it IS the pre-S2 pose:
`lensShift` writes nothing), so the base fixtures still match and a non-zero shift is still an input difference. No
fixture was rewritten.

## The gates

- `node tests/camera-shift.test.mjs`: 6 PASS (p = 0 bit for bit; the pivot at p in four seats; 80 triples on one pixel; the
  clamp; zoom to the cursor, worst 2.3e-13 px; the pan law and shift-then-RESET = the boot pose byte for byte).
- `node tests/statelink.test.mjs` 22/22 (four new S2 checks); `stage-gestures`, `keyboard-shortcuts`, `export3d`,
  `new-project` (16,866 B), `history`: green.
- `node tools/new-project.mjs --check`: in step (16,866 B).
- `bash test.sh node` (84 suites) under a load average of ~23 from the sibling: green but for five WALL-TIME budgets
  (electrostatics W42-7 190 ms < 60, mo G5 124 ms < 120, twocentre Q7 < 50 ms, wigner W42-8 < 150 ms, names "benzene named
  in 60 ms"). Re-run alone: mo, twocentre, wigner, names green (load 21); electrostatics red again at load 21.7 (95 ms) and
  **green alone at load 9.8**. None imports a file S2 touched.
- Browser, one at a time on 8747/5215: **`camera-shift` (new) 11/11 GREEN** (three runs); `render-regressions` GREEN;
  `frame-occlusion` 7/7; `keyboard-window` GREEN; `new-project` 8/8; `input` 13/13; `chem` 54/54; `export3d` red once on
  its loop-median timing (3 → 2 ms, Δ33 % on a 1 ms tick) and **GREEN alone**. Three need words:
  - `history`: red twice at loads ~21–22 on the LFO-through-an-undo timing (the macro unmoved over 600 ms; a redo's base
    read mid-cycle; the route target was EXPOSURE, as on the base), then those scenes passed on the next two runs, and the
    last scene — it opens a second Firefox — hit `EADDRINUSE 127.0.0.1:5215` (the previous geckodriver not yet gone). With a
    4 s pause before each new session (a `.tmp` copy; the suite itself untouched) **all 39 scenes pass on this tree**,
    the MOLECULES undo included. The untouched base `bd9b0e5` (served from `git archive` on the same port) passed 39 once
    and hit the same `EADDRINUSE` in the same place the second time.
  - `offer`: `EADDRINUSE 127.0.0.1:5215` at its second session — the same race; the base fails the same way (14 of 16);
    with the 4 s pause, **16/16 GREEN** on this tree (its link scenes included).
  - `current`: 9 of 15, then the modulation window's audio face (`valuesReveal` or `followsPalette`, a CSS read 50–250 ms
    after a change) — **the untouched base fails the same check the same way**, at loads 10–22. Not the camera; worth a
    look by whoever owns the audio face.
- **The device report** (`tools/perf/device-report-run.mjs`, the report's own scenes with its 30 s long play, headless
  Firefox on the 3070, frost on): base `bd9b0e5` 13.8 fps long play, frame median 82.46 / p95 100.26 / max 232 ms, loop
  median 1 ms; this tree 13.5 fps, 82.94 / 100.48 / max 217 ms, loop median 1 ms — **equal within its noise** at the same
  load (~11). (A first base run at load ~23 read 7.8 fps: the long play tracks the sibling's CPU, which is why the pair was
  re-taken back to back.) **M5 pending**: one command for Josh, `?report=1` on the iPad.

## Line counts

`cat lab/*.js | wc -l`: **35,738 before (bd9b0e5) → 35,828 after (+90)**. This is a feature and it added; the honest
subtractions available were taken (`pointerRay` is three lines over `toScreen.ray` instead of five of its own maths; the
`writeView` seat is one call), and no unrelated code was cut to make the number. Where the 90 went (`git diff --numstat bd9b0e5`): `statelink.js`
+21 (the CAM tail, the MOL tag both ways, its law), `camera-law.js` +18 (the zoom/shift roads and the clamp), `field.js` +17
(`lensShift` and its law, `toScreen.ray`, the readbacks' `keep`), `rack.js` +14 (the PAN row, two targets, four keys; −2 in
`pointerRay`), `stage-gestures.js` +11 (the slide, the centroid, uv), `chemview.js` +6 (the name-first orbital),
`export3d.js` +2, `keymap.js` +1.

## Blockers (none stops the merge)

- **The driver-port race**, base and this tree alike: `LW_PORT=8747 GD_PORT=5215 node tests/offer.browser-test.mjs` (and
  `history`'s last scene) → `Error: listen EADDRINUSE: address already in use 127.0.0.1:5215` when a suite closes one
  Firefox and opens the next at once under load. A 4 s pause before the next `open()` cures it; the suites were not edited.
- **`current`'s audio face**: `LW_PORT=8747 GD_PORT=5215 node tests/current.browser-test.mjs` → `AssertionError
  [ERR_ASSERTION]: valuesReveal` (or `followsPalette`) after 9 of 15 scenes — the same on the untouched `bd9b0e5`.
- **A note for the merge**: K2's `git apply` landed the four Alt+Arrow actions after `slap`; K3 moves them beside
  `camReset` (cosmetic, one hunk).

## The exact next step

Claude Sos merges `worktree-agent-a404c855dc2be006b` into `sos-s0` (it touches `rack.js` only in `pointerRay`, the CAMERA
panel, the observer targets, the pose default, serialize/restore's pose, `mintLink`, the gesture wiring and four ACTIONS —
none of S3's regions), then launches the S2 verifier on 8749/5217:
`LW_PORT=8749 GD_PORT=5217 node tests/camera-shift.browser-test.mjs`, `node tests/camera-shift.test.mjs`,
`LW_PORT=8749 GD_PORT=5217 node tools/perf/digest-lock.mjs --check --query gastab=0`, then the brief's browser list.

## Not done, and why

- **The device report's M5 half**: one command for Josh — open `https://<host>/lab/?report=1` on the iPad (or
  `__LW.report()` in a console there); recorded **M5 pending**.
- **The GLB cannot express the shift** (glTF has no principal point): it rides as `extras.lensShift` on the camera node; an
  importer shows the on-axis framing.
- **A modulated ZOOM or FOV** zooms about the pivot (the shift stays), by design: a route writes the pose, not a hand.
- **Firefox's lone-Alt menu bar** cannot be exercised headless; a drag between Alt's press and release is input, so the
  menu bar should not toggle — not verified on a headed Firefox.

## For S5's KIT BRIEFS

**Brief 2 · the lens shift in the kit's CAMERA panel, and the CSS port.** λWAVES' CAMERA now carries PAN X / PAN Y (bipolar
−1…1) and PAN HOME (`rack.js` row `r4p`), the modulation targets `observer.panx` / `observer.pany`, and one setter behind every
hand (`camera-law.js` `setShift(x, y)`: clamped to the frame's edge, `modHand` per axis so a routed axis moves its base). The
kit's CAMERA panel takes the two knobs and PAN HOME as they are; at 0.5.0 the XY pad with the lattice replaces the knobs and
drives the same two targets 1:1 (the pad's unit IS the shift: the pivot's place on the frame in NDC, +y up). The CSS port is
one line for any 2-D consumer — project as before, then add `(px·W/2, −py·H/2)` pixels (`field.js` `toScreen` is the
reference; its inverse `toScreen.ray` is the pointer's). The 3-D HOME (RESET VIEW, the double-click, the double-tap) resets
the shift with the rest of the pose (`CAM.HOME.shift = [0, 0]`, frozen). Acceptance: shift then HOME is the boot pose byte
for byte (`tests/camera-shift.test.mjs` §6); the knobs follow every hand (`tests/camera-shift.browser-test.mjs` §4); a route
on either axis moves its base and leaves the other alone. The λWAVES port that consumes it: the `r4p` row and its two
target definitions give way to the kit's panel; `setShift` stays as the host seam.

**Brief 1 · the 3-D camera law as a pure module (`mir/camera/law.js`), zoom to the cursor included — the gift for NEBULA,
POLAR and EARTH.** `lab/camera-law.js` is already pure (five edges handed in: `obs`, `ui`, `present`, `modHand`,
`resetWall`) and `lab/stage-gestures.js` already DOM-generic; together they are the module: the first-order law
(`cameraStep`, the exact integral of a relaxing fling), TURNTABLE ⇄ FREE with the levelling slerp, the one road for a
relative turn, the eased key orbit, and now `zoomAt(c, dist′)` / `setFov(v, c)` / `setShift` / `panBy` with the invariant
`p′ = c − (c − p)·k`, `k = D·tanH / (D′·tanH′)` (dials and keys anchor at c = 0), the wheel at the cursor, the pinch at the
fingers' centroid with the two-finger slide, and the Alt-drag slide. Acceptance: `tests/camera-shift.test.mjs` §5–6 and
`tests/stage-gestures.test.mjs` run unchanged against the kit's module (the point under the cursor drifts 2.3e-13 px in
node, ≤ 0.015 px through λWAVES' pointer on the GPU). `cameraEye`'s `target` is the seam a consumer with another pivot would
use (λWAVES keeps the origin — R-C1). The λWAVES port: `camera-law.js` and `stage-gestures.js` become imports of the kit
module, CAM's numbers handed in.
