# λWAVES 0.4.0 · S2 THE CAMERA — BRIEF for the camera builder (waves from the next free number)

**Written by Claude Sos (the fallback Major Agent), 2026-10-07, from `PLAN.md` the way Yan wrote the S0/S1 briefs.**
The contract is `research/release-0.4.0/PLAN.md` §4 **F4** and the §6 row **S2** (read both first, then §9 RULINGS TAKEN:
the lens shift stays, R-C1 = shift only, no target pivot). It runs AFTER S1 NAMES and S1′ `cameraEye` are merged:
`cameraEye(obs, half)` is the one projection helper and already carries `shift` as zeros (`BRIEF-S1-CAMERAEYE.md`). Your
job is to make that shift real. A fresh-context verifier follows you (PLAN §6: the camera uniform is the frame path).

Josh, on the feature: *"the planet photo is a bit of an over explanation but that sounds like a cool feature."*

## 0 · Laws

Never edit `lab/mir/**` or `lab/fonts/**` (the CAMERA panel's kit-side half is **brief 2** to MIR, not an edit). After
any `lab/` edit `node tests/pwa.test.mjs --write`, then the suites. Subtract, don't add: count `lab/*.js` lines before
and after and report both. Diagnostics in `tools/`. The glass is Josh's. Three scopes: `obs.shift` is PROJECT, not a
history row (it travels with the pose, `docs/STATE-SCOPES.md` l.40). Never `pkill -f`; kill by pid. Git only in your
worktree; never push. **Ports `LW_PORT=8747 GD_PORT=5215`** (the verifier gets 8749/5217). The GPU is shared: one browser
suite at a time. **This is the frame path:** the 208-value lock (`node tools/perf/digest-lock.mjs --check`, 96³; read the
tool's header and REPORT wave 116 for the exact flags of the 208 and the 1004 runs) after every commit that touches
`field.js`, a shader, `cameraEye` or the pointer maths; a red lock is re-run ALONE before it is believed (the RTX 3070's
one-ulp fault in power state P5). REPORT.md waves under `## <date> · 0.4.0 S2 — THE CAMERA`.

## 1 · ONE convention (this brief supersedes three lines of the plan)

PLAN F4 states the shift three ways that disagree: the forward lane `fwd + 2·sx·tanH·aspect·right + …` (pivot at
u = −2·sx), "the pivot appears at minus the shift", and zoom-to-cursor `shift' = c − (c − shift)·dist/dist'` (which is
right only if the pivot appears AT the shift). Use this one instead; it is the same feature:

- **`obs.shift = [px, py]` is where the pivot appears on screen, in uv** (uv = NDC: −1…1 across the frame, +y up).
  Clamp each component to **[−1, 1]**: the pivot reaches the frame's edge and never leaves it (the plan's "±0.5" is the
  same edge in its half-units). Positive `px` moves the molecule right. The kit pad (0.5.0) maps onto it 1:1.
- **The law: a lens shift is the on-axis picture translated by `p` in NDC.** The view matrix and `cameraBasis` do not
  change; only the principal point moves. So every pass gets the same one-line change:
  - **ray pass** (`field.js` `writeView`, the forward lane `v[12..14]`): `fwd − px·tanH·aspect·right − py·tanH·up` — the
    pixel at uv `u` then marches the on-axis ray of `u − p`. The ray pass normalises; the headlight follows the lane.
  - **line pass** (`M_PERSP` in `writeView`): `perspective()` (`field.js` l.557) is column-major with `o[11] = −1`
    (w = −z), so the principal-point entries are `o[8] = −px`, `o[9] = −py`: `x_clip += o[8]·z`, divided by `−z`, adds
    `px` to the NDC. The FRAME-corner test in §3 confirms the sign on the GPU; the test wins over this line.
  - **2-D overlays** (everything that asks `cameraEye`: `fieldview`, `keplerview`, `particles`, `vortex`, the atom labels,
    the export camera): project as today, then add `(px·W/2, −py·H/2)` pixels. Put that in `cameraEye`'s consumer road
    once (a `toScreen` beside the helper), never nine times.
  - **pointer** (`pointerRay`, `unproject`): use `u − px`, `v − py` in place of `u`, `v`.
- **At `p = [0, 0]` every byte is today's** (the lane is `fwd` exactly, the matrix entries are 0, the offset is 0), so the
  lock holds by construction — prove it, do not assume it.
- **Zoom to the cursor** keeps the point of the pivot plane under the hand still: with `c` the cursor (or the two-finger
  centroid) in uv and `k = (dist · tanH) / (dist′ · tanH′)`, **`p′ = c − (c − p) · k`**, clamped. A wheel or pinch step
  changes `dist` (`k = dist/dist′`); a FOV step changes `tanH` (`k = tanH/tanH′`); a keyboard step anchors at the
  frame centre (`c = 0`). Derivation, for the REPORT: the pivot-plane point under uv `u` sits at `D·(u − p)·tanH·aspect`
  from the axis; holding it fixed at `u = c` gives the line above.

## 2 · The commits, in order (line numbers are on `bc103b3`; grep on yours, S1 moved them)

### K1 · THE SHIFT in the engine (frame path; lock after)

- `obs.shift` read through `cameraEye` (`field.js` near `cameraBasis` l.614 / `cameraKey` l.630; `cameraKey` already
  carries the shift to 4 decimals after S1′). `writeView` (l.1009–1036): the forward lane and the two `M_PERSP` entries.
- The 2-D overlays' one offset (§1); `pointerRay` (`rack.js` l.3261) and `unproject` (l.3393, which already reuses
  `pointerRay`).
- A shift is **TIER.PRESENT only**: it never re-solves, re-reconstructs or re-uploads a volume.
- `tests/camera-shift.test.mjs` (node, pure maths over `cameraEye` and the projection helpers): shift then RESET =
  identity; `p = 0` gives today's lane and matrix bit-for-bit; the pivot projects to `p` through the line maths and
  through the ray maths; clamp at ±1.

### K2 · THE HANDS

- **Zoom to the cursor** through §1's line: the wheel (`lab/stage-gestures.js` l.111–116) and the pinch (l.72–75, anchor at
  the centroid) call one `zoomAt(c, dist′)` in `lab/camera-law.js` beside `setDist` (l.153), so the ZOOM dial still has ONE
  road (the comment at l.151–152 is the law). The ZOOM dial and the keys anchor at the centre.
- **Pan:** Alt-drag on a mouse or trackpad (`startSpecial` in `rack.js` l.4659 takes Ctrl, the Kepler grab takes plain
  and Shift, so Alt is free on the stage — verify `preventDefault` holds in Firefox and that this desktop's window manager
  does not take Alt-drag; if it does, say so in REPORT and keep the keys and knobs as the road); a two-finger drag on touch
  moves `p` by the centroid's delta beside the pinch; one pixel of drag moves the molecule one pixel
  (`Δp = (2Δx/W, −2Δy/H)`). Wheel stays dolly.
- **Keys:** an Alt+Arrow quartet in `lab/shortcuts.js` (step 0.05 uv; Shift = fine, the existing law) — check `AltLeft` /
  `AltRight` in the reserved set at l.3 means "not bindable ALONE", not "never a modifier"; extend
  `tests/keyboard-shortcuts.test.mjs` (no overlap with Q/E, WASD, Shift+Q/E, Ctrl+Shift+Q/E).
- RESET VIEW, double-click and double-tap clear the shift (`resetView`, `camera-law.js` l.158: `CAM.HOME` gains
  `shift: [0, 0]`).

### K3 · THE PANEL, THE SCOPE, THE LINK

- CAMERA (`rack.js` ~l.1553–1565): **PAN X / PAN Y** knobs (bipolar −1…1, targets `observer.panx` / `observer.pany` beside
  the yaw/pitch/dist/fov targets at l.2576–2587 and the target map at l.4853) and **PAN HOME**; the panel note gains one
  sentence ("Alt-drag or two fingers slide the picture; the molecule stays the pivot"). No new window, tab or setting.
- `docs/STATE-SCOPES.md` l.40's pose row gains `shift`. `serialize`/`restore` carry it; an older project without it opens
  at 0. `node tools/new-project.mjs` regenerates the empty project ONLY because the pose default gained a field — say so —
  then `--check`.
- **The link carries the shot** (`lab/statelink.js`, its VERSION POLICY l.23–31: fields appended to the END of a section and
  a new section do not bump v1): the CAM section (write l.289–293, read l.489–495) gains `shift` as two f32 after the
  quaternion; **one new tag** (the next free byte after `NATIVE: 0x09`, l.92–93, with its `TAG_NAME`) carries the molecule:
  `{library id (as a literal string — the name tables are frozen), basis, view, orbital}` with the orbital as S1's
  `{group, irrep, count}` and the index as the fallback when a molecule has no names. Today a link made under MOLECULES
  silently drops the molecule; after this, "1b₁ of water, framed in the gap" is one link. `tests/statelink.test.mjs`:
  round-trip with a shift and a molecule; a link minted before this commit opens with shift 0; an old decoder's view (a
  section longer than it knows) still reads the pose.

## 3 · Acceptance (PLAN §6 row S2)

- **Shift then RESET = identity** (pose bytes equal).
- **The cursor-anchored point** is invariant to ≤ 0.5 px across a wheel step, a pinch step and a FOV step at a non-zero
  shift (read back through `unproject`).
- **One FRAME corner, one pixel:** at `p = (0.4, −0.3)`, a FRAME corner lands on the same pixel through the line pass, the
  ray pass (a readback of the box edge) and `pointerRay`/`unproject` — the test that decides the matrix sign.
- Alt-drag, two-finger, Alt+Arrow; zoom-to-cursor; the link tail round-trips.
- **The 1004-value lock byte-identical at shift 0**, once at the end; the 208 per frame-path commit.
- `node tools/new-project.mjs --check`; `bash test.sh node`; browser, one at a time on 8747/5215: `render-regressions`
  (the scaled hit-test — the pointer maths moved), `frame-occlusion`, `keyboard-window`, `export3d`, `current`,
  `new-project`, `history`.
- **The device report** (`tools/perf/device-report.js`, its 30 s scene) before and after on the 3070, equal within its
  own noise; the M5 half is one command for Josh, recorded "M5 pending".

## 4 · What you do not do

No target pivot (R-C1: built only if Josh, having tried the shift zoomed in, asks). No XY pad (0.5.0, brief 5). No edit
of the kit's CAMERA panel code (brief 2). No new per-tick work: a still camera costs nothing new. No version bump, tag,
CHANGELOG, deploy or push.

## 5 · Hand-off

`research/release-0.4.0/S2-CAMERA-BUILD.md`: the commits, the convention as built (with the sign the corner test chose),
the lock runs (208 per commit, 1004 at the end), the device report pair, the gates with counts, `lab/*.js` lines before
and after, and **two paragraphs for S5's KIT BRIEFS**: brief **2** (lens shift in the kit's CAMERA panel and the CSS port;
the 3-D HOME resets the shift) and brief **1** (the 3-D camera law as a pure module, `zoomAt` and its invariant test
included — the gift for NEBULA, POLAR and EARTH). Kill your gate server by pid. Final message: ten lines + worktree path
+ branch.

## 6 · Harness

Compound shell with variables, loops, heredocs or backticks may be refused: plain commands, scripts as files under
`.tmp/`. If a command is refused, reshape it; never retry verbatim. Commit after each K; the session may end mid-wave and
the next agent picks up from your branch.
