# λWAVES 0.4.0 · S2 THE CAMERA — VERIFY

**Verifier:** Opus 5.5 with fresh eyes and no part in the build. 2026-10-08. Worktree
`/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a14b488615f86fedb`, branch
`worktree-agent-a14b488615f86fedb`, reset to `9395ab3`, the tip of `sos-s0`. That tip holds S2 merged at `babb58f` and S3
merged on top at `7e6220b`. Pre-S2 tree: `bd9b0e5`. Ports: 8749 and 5217. One browser suite ran at a time, with a 4 s pause
between Firefox sessions. Each gate server was stopped by its pid (2180057, then the base server 2223907). I fixed nothing,
merged nothing and pushed nothing. The S2 commits (`38f63fd`, `1c1bbf6`, `3acaac0`, `93cd70f`) are on no remote branch.

## Verdict

**S2 as merged stands: YES.** The 1004-value lock is byte-identical at shift 0 on `9395ab3`. The 96³ lock is identical
too. Every scene in brief §2–§5 holds when re-measured with my own scenes, which are independent of the builder's gate.
Every gate is green on its first run, so nothing needed a re-run alone.

**BLOCKER 0 · SHOULD 1 · NOTE 11.**

## 1 · The locks

| run | command | result |
|---|---|---|
| **1004-value lock, all grids** | `LW_PORT=8749 GD_PORT=5217 node tools/perf/digest-lock.mjs --check --query gastab=0` | **GREEN**: 1004 values · 0 readback differences · 0 record-byte differences · nothing unrepeatable · 0 page errors · 52 s (load ~1, first run) |
| **96³ lock** | `… digest-lock.mjs --check --grids 96 --query gastab=0` | **GREEN**: 588 values · 0 · 0 · 35 s |
| pre-S2 tool against HEAD (`git show bd9b0e5:tools/perf/digest-lock.mjs` with one import path rewritten, `.tmp/digest-lock-bd9.mjs`) | `… node .tmp/digest-lock-bd9.mjs --check --grids 96 --query gastab=0 --fixture <abs>/research/optimization-2026-09-24/digest-lock-base.json` | RED on `META DIFFERS (inputs, not outputs): obs` **alone**: 588 values · **0 readback · 0 record-byte differences** |
| sanity: the lock with a 0.002 NDC shift injected at boot (`.tmp/digest-lock-shifted.mjs`, `--only styles,lines`) | as above, `--grids 96 --only styles,lines` | RED: **218 of 380** readbacks differ, and meta flags `obs` |

**The `meta()` change is legitimate. It hides nothing.** `meta()` holds the inputs. Each readback hash is compared
separately, and `meta` is never part of the value comparison (`digest-lock.mjs` l.240–252). The builder's change removes
`shift` from `meta.obs` only when both of its components are zero (l.196). The 1004 run above therefore shows three
things. First, the boot `obs` minus a zero shift matches the fixture's `obs` key for key, because every other `obs` key is
still compared. Second, the pre-S2 tool on the same tree reports only the added `shift: [0, 0]` key, with 0 value
differences. Third, the lock can see a shift: 1.6 px of shift changes 218 of the 380 style and line hashes, and a non-zero
shift still reads as a meta difference. The fixture has not changed since `3853ab4`, its K0 commit.

## 2 · The gates

| suite | count | verdict |
|---|---|---|
| `bash test.sh node` (and the same loop with per-suite logs, `.tmp/run-node.sh`) | 84 suites (83 `*.test.mjs` + `pwa`) | **all green** at a load of about 1. The five wall-time reds the builder saw at a load of ~23 did not appear |
| `node tests/camera-shift.test.mjs` | 6 PASS | green |
| `node tests/statelink.test.mjs` | 22/22 | green |
| `node tests/keyboard-shortcuts.test.mjs`, `stage-gestures`, `export3d`, `new-project` | all PASS | green |
| `node tools/new-project.mjs --check` | in step, 16,866 B | green |
| `node tests/pwa.test.mjs` (no `--write`) | PASS | green; `lab/sw.js` is in step |
| `camera-shift.browser-test` (the builder's) | 10/10 | GREEN. The builder wrote "11/11"; the file has 10 checks plus the page-error gate (N8) |
| `render-regressions.browser-test` | 2/2 | GREEN |
| `frame-occlusion.browser-test` | 7/7 | GREEN |
| `keyboard-window.browser-test` | 1/1 | GREEN |
| `export3d.browser-test` | 10/10 | GREEN, loop median not red |
| `current.browser-test` | **15/15** | GREEN. At a load of ~1 its `valuesReveal` passes. The builder's 9/15 was load |
| `new-project.browser-test` | 8/8 | GREEN |
| `history.browser-test` | 39/39 | GREEN, with no `EADDRINUSE` thanks to the 4 s pause between sessions |
| `input.browser-test` | 13/13 | GREEN |
| `chem.browser-test` | 54/54 | GREEN |
| `offer.browser-test` | 16/16 | GREEN |
| statelink browser half | n/a | none exists. The link's browser scenes are in `camera-shift` and in my B1/B2 below |
| **my scenes** `.tmp/s2-scenes.mjs` | **19/19** | GREEN (`LW_PORT=8749 GD_PORT=5217 node .tmp/s2-scenes.mjs`). Three earlier runs went red on my own test geometry, explained in §3 |
| `.tmp/s2-panel.mjs`, `.tmp/s2-back.mjs` | probes | see §4 and NOTE N2 |

Browser counts are from `.tmp/run-browser.sh r1 …`, which runs one suite at a time on 8749/5217 with a 4 s pause before
each. None was red, so none needed a re-run alone.

**The device report** (`tools/perf/device-report-run.mjs`, its scenes and the 30 s long play, headless Firefox on the
3070). The builder's "before" was taken at a load of ~11 (13.8 fps). At a load of ~1 that number does not apply, so I took
my own pair back to back at the same load. HEAD came first; then `bd9b0e5` (lab + `tools/perf/device-report.js`,
`git archive`) was served on 8749:

| tree | long play | frame median / p95 / max | loop median | scenes (as found · UI hidden · project open) |
|---|---|---|---|---|
| `bd9b0e5` | 19.6 fps · 589 presents · 0 held | 50.26 / 83.16 / 100.9 ms | 1 ms | 20.1 · 54.3 · 45.5 |
| `9395ab3` (S2 + S3) | 19.7 fps · 593 presents · 0 held | 50.24 / 82.76 / 100.6 ms | 1 ms | 19.8 · 55.3 · 45.5 |

The two trees are **equal within the report's own noise.** HEAD also carries S3, so this pair bounds S2 and S3 together.
**M5: pending** (`?report=1` on the iPad, one command for Josh).

## 3 · The scenes (brief §2–§5), each with its command

Unless a line says otherwise, every scene is in `.tmp/s2-scenes.mjs`
(`LW_PORT=8749 GD_PORT=5217 node .tmp/s2-scenes.mjs`; the results are in `.tmp/s2-scenes.json`). Each reads back through the
app's own `lab/field.js` `toScreen` and `readPixels`/`linePixels`, and through `rack.js` `pointerRay`/`unproject`
(`__LW.camera.pointer`). The canvas is 1300 × 764 CSS px.

**K1 · the one convention**
- **p = 0, every byte is today's.** `tests/camera-shift.test.mjs` §1 checks `toScreen.at` and the pointer's ray against
  operand-for-operand copies of `bd9b0e5`'s own expressions. I checked those copies against `git show bd9b0e5:lab/field.js`
  and `:lab/rack.js`: they match. The test also checks the lane and the matrix against `perspective()` and `fwd` byte for
  byte, over {absent, [0,0], [−0,0]}. **It does not compare the new code with itself.** The GPU half is the lock in §1.
  `writeView` now calls `perspective()` before `writeBuffer(viewBuf)`; the values are unchanged.
- **A1 · the pivot appears at p = (0.4, −0.3).** `toScreen.at(0,0,0)` = (910.0, 496.6) against the expected
  (1.4/2·W, 1.3/2·H), a gap of 3.6e-13 px. `pointerRay` through that pixel passes the origin at 7.5e-15. `unproject` returns
  (−7e-15, 4e-15, 0).
- **A2 · one FRAME, one picture.** This is a stronger version of the corner test: all four extremes of the box at each
  shift. At three shifts I compared the bounding box of the line pass (`linePixels`, the box alone), the ray pass's box
  silhouette (`readPixels`, GAMMA 2.4, no chrome) and the +p prediction (the eight corners through `toScreen`).

  | p | line − pred | ray − pred | ray − line | the 0 / −p predictions | pointer through the corner pixel |
  |---|---|---|---|---|---|
  | (0.4, −0.3) | 0.78 px | 0.61 px | 1 px | 260 / 520 px away | 0.29 px |
  | (−0.35, 0.3) | 0.83 px | 0.41 px | 1 px | 228 / 455 px away | 0.33 px |
  | (0, 0) | 0.78 px | 0.33 px | 1 px | — | 0.72 px |

  **The sign is the brief's:** `P[8] = −px`, `P[9] = −py`. With the wrong sign, the line pass and the ray pass would
  disagree by 0.4·W ≈ 520 px. I saw ≤ 1 px between them. The builder's own suite reproduces its claimed numbers: line
  0.29 px, ray 0.72 px, pointer 0.287 px, 284 px from the 0 prediction and 568 px from the −p one. *Why my first run was
  red: SHOULD S1.*
- **A3 · the clamp.** `setShift(3, −3)` reads back `[1, −1]`, and the pivot then sits at (1300.0, 764.0), on the frame's
  corner and inside the canvas. A restored project whose `obs.shift = [3, −3]` reads `[1, −1]`. A link carrying
  `[−7, 2.5]` opens at `[−1, 1]`. clampShift turns non-finite input into 0 (node §4).
- **A4 · TIER.PRESENT only.** I wrapped `Worker.prototype.postMessage`, `GPUQueue.writeTexture` and every `writeBuffer`
  over 16 KB, and read `field.stats` reconstructs, generation and molDispatches. Ten shift steps went through `setShift`,
  `panBy` and Alt+← keydowns, each step distinct, each settled. Results:
  - On hydrogen 1s+2pz: **0 worker messages, 0 reconstructs, 0 generation, 0 texture writes, 0 large buffer writes**, and
    10 presents.
  - Under MOLECULES water (orbital view): **0** of each, molDispatches included.
  - In run 2 one `warm` message landed. A no-shift control window inside the same scene also caught a `warm` message: it
    is the SLAP warm on its own timer, not the shift.
- **A10 · the overlays follow, and a still camera costs nothing.** Water's three ATOM LABELS at p = (0.4, −0.3) are their
  p = 0 positions moved by exactly (260.0, 114.6) px = (px·W/2, −py·H/2). The labels now live in S3's `stage-text.js` and
  still project through `toScreen`. Over 2 s at a still non-zero shift, compared with 2 s at 0: **0 stage DOM mutations, 0
  presents, 0 chrome writes, 0 frames, 0 CPU ticks**, the same as at 0. Every 2-D consumer (`keplerview`, `fieldview`,
  `particles`, `vortex`, `stage-text`, the pointer) goes through `toScreen` (grep: `cameraEye`/`toScreen`/`cameraBasis`).
  `orbit.js`'s `cameraBasis` and the bow's `cameraBasis` use only directions, which a shift does not change. The corner
  axis draws in fixed NDC (`cornerBind`), so it stays put, as a HUD element should.

**K2 · the hands**
- **A5 · shift then RESET = identity.** A shift, a zoom at a cursor, a FOV step at a cursor, an orbit and a pan, followed by
  RESET VIEW, give `JSON.stringify(serialize().presentation.obs)` byte-identical to the boot pose. The same holds after a
  `dblclick` and after a two-tap touch double-tap.
- **A6 · the cursor-anchored point** at p = (−0.5, 0.35), read back through `unproject`, with the cursor 0.3 uv from the
  pivot so that `unproject`'s 7.5 cap does not clamp (asserted, r = 4.8):

  | step | drift |
  |---|---|
  | real wheel in | 0.095 px |
  | real wheel out | 0.104 px (integer clientX/Y) |
  | symmetric pinch | 0 px |
  | **travelling pinch** (the point under the first centroid lands under the last) | 0 px |
  | FOV at the cursor | 0 px |
  | ZOOM dial / ↑ key / FOV dial / Shift+E (POV) / Ctrl+Shift+Q (dolly zoom, p unchanged) | **0 px** at the frame's centre, at p = (−0.2, 0.15) |

  The builder's suite reproduces its own 0.0145 / 0 / 0 px.
- **A7 · Alt-drag** with the driver's own mouse, (−70, +45) px, moves p by exactly (−140/W, −90/H). The quaternion is
  untouched (no orbit) and the page does not navigate. **A8:** two fingers dragged together by (−40, +25) pan by the centroid
  to 1e-9, with no zoom (NOTE N7: one ulp). The wheel at the pivot's own pixel dollies (dist 3.3 → 3.0) and moves p by
  ≤ 1e-4 (the integer clientX).
- **A9 · Alt+Arrows** from the driver: Alt alone does nothing. Alt+←, then Alt+↓, then Shift+Alt+← give p = (−0.0625,
  −0.05) to 1e-12, and the bare arrows do not zoom. `tests/keyboard-shortcuts.test.mjs` (green) proves no overlap with
  the arrows, WASD, Q/E, Shift+Q/E, Ctrl+Shift+Q/E or Ctrl+Alt+Z. It also proves `bindAction(…, {key:'AltLeft'})` is
  refused and Alt+KeyJ is accepted, so Alt is a modifier and is never bindable alone. In the browser (`.tmp/s2-panel.mjs`),
  the dispatcher's keydown is `defaultPrevented` on all four Alt+Arrows and **not** on a lone Alt. An Alt pointerdown on
  the stage is `defaultPrevented`.
- **The window manager:** `gsettings get org.gnome.desktop.wm.preferences mouse-button-modifier` → `'<Super>'`, as the
  REPORT says. Alt-drag reaches the stage.

**K3 · the panel, the scope, the link**
- **A11 + `.tmp/s2-panel.mjs`:** CAMERA (`section[data-id=camera]`) shows PAN X and PAN Y (`observer.panx` / `.pany`,
  `map: 'bipolar'`, min −1, max 1, visible, 68 × 48 px) and PAN HOME, all inside the card. The screenshot is
  `.tmp/s2-panel.png`. The note carries "Alt-drag or two fingers slide the picture; the molecule stays the pivot". The
  native UI moves that note into the card's header tip. An **LFO routed to `observer.panx`** moved the shift through six
  steps (−0.995 … −0.889), giving 6 distinct readback hashes, and unrouting brought it back to `[0, 0]`. No new window, tab
  or setting.
- **A12 · the scopes.**
  - A shift adds **no history row** (cursor +0, depth +0).
  - A style edit followed by a shift, then Ctrl+Z: the style returns and **the shift stays** (−0.45, 0.15).
  - A project carrying `shift: [0.25, −0.65]` opened through the import road (`layout.projects.importText` + `open`) lands
    its shift. `lambdawaves.q0.settings` is **byte-identical outside the WORKSPACE keys** across both opens, and no
    `shift` ever appears in the settings.
  - **`bd9b0e5`'s `lab/new-project.lambdawaves.json`**, opened through the same road, opens at `[0, 0]` with its pose.
  - `docs/STATE-SCOPES.md` l.40's pose row says `shift`.
  - The empty project differs from `bd9b0e5` **only** by `"shift": [0, 0]` (`git diff bd9b0e5 HEAD -- lab/new-project.lambdawaves.json`).
- **The link.**
  - **B1:** I minted a link through the app's own `__LW.link.mint()`: water, sto-3g, orbital view, orbital 5 = B1/1
    (1b₁), p = (0.4, −0.3), a non-boot pose, 340 characters. Opened in a **fresh Firefox**, it brings back the shift
    (f32), the molecule, the basis, the view, orbital 5 *by its name* `{C2v, B1, 1}`, and yaw, pitch, dist, fov and the
    quaternion to 1e-6.
  - **B2:** I minted a link from the same state with **`bd9b0e5`'s own `statelink.js`** (`.tmp/bd9/lab/statelink.js`).
    Opened in another fresh Firefox, it gives shift `[0, 0]` and the right pose.
  - **N1:** `bd9b0e5`'s `decodeState` reads the new link's pose (the 8-byte CAM tail is ignored) and skips 0x0A with "a
    section this build does not know (0xa) was skipped — the link was minted by a newer build".
  - **N2:** a centred shot without a molecule mints **the very bytes** `bd9b0e5` mints.
  - **VERSION POLICY** (`statelink.js` l.23–31) is kept. v1 is unchanged. The shift is appended at the END of CAM and
    written only when it is non-zero. There is **one** new tag, `MOL: 0x0A`, with `TAG_NAME[10] = 'molecule'`. Names
    travel as literals (`LITERAL = []`), so no frozen table was appended. `tests/statelink.test.mjs` 22/22 asserts the three
    round-trips the brief names: an old link opens centred, the shot round-trips, and an older decoder reads the pose.

**§5 · the house**
- `git diff bd9b0e5 HEAD --stat -- lab/mir lab/fonts` is **empty**, so the kit's CAMERA panel was not edited.
- `cat lab/*.js | wc -l`: **35,738** (`bd9b0e5`) → **35,828** (`babb58f`, S2 alone, +90, as reported and explained in
  BUILD "Line counts") → 35,881 (HEAD, S3's +53).
- No target pivot: `cameraEye.target` is still `[0,0,0]` (R-C1). No XY pad: two knobs. No version bump, tag, CHANGELOG
  or deploy. `lab/sw.js` changed only in its precache hashes, and no S2 commit is on a remote.
- REPORT.md has waves 145–148 under `## 2026-10-07 · 0.4.0 S2 — THE CAMERA`, with the zoom-to-cursor derivation in 146.
  Its numbers match what I re-measured.

## 4 · Findings

### BLOCKER — none

### SHOULD

**S1 · The FRAME-corner gate's line readback can be masked by the racks.** The test that decides the matrix sign is only
robust because of the shift it chose. `tests/camera-shift.browser-test.mjs` §1 calls `F.setOcclusion([])` once, then
`await F.readPixels(…)`, then `F.linePixels(…)`. A frame that runs during the await rebuilds the app's own occlusion block
(`rack.js` `refreshOcclusion()`, which covers the racks). The line pass then hides the FRAME lines under any window. At
p = (0.4, −0.3) the box's corner is clear of the left rack, so the gate passes. At p = (−0.35, 0.3) the same method failed:

- The line pass's left extreme read **207 px** against the predicted 190.28 px. 207 is the rack's edge. The ray pass read
  190, which is correct.
- The pointer miss, measured from that masked pixel, came out at 233 px.
- With **one more `F.setOcclusion([])` immediately before `linePixels`**, the error dropped to 0.83 px. The digest lock's
  `rp()` already does this, pinning the block synchronously before every readback.

Reproduce: in `.tmp/s2-scenes.mjs` (`BBOX`), delete the second `F.setOcclusion([])` line and run
`LW_PORT=8749 GD_PORT=5217 node .tmp/s2-scenes.mjs`. The A2 row at (−0.35, 0.3) goes red with
`"line":[207,645,67,521]` and `"lineErr":16.72` (my run 1, `.tmp/s2-scenes-run1.log`).

The rule this breaks: a permanent gate must not depend on the window layout (CLAUDE.md: the mask is
`refreshOcclusion()`'s, and a moved window schedules a PRESENT). The fix is one line in the test, plus optionally a second
shift on the left of the frame. The engine is right.

### NOTE

- **N1 · The digest lock's `meta()` change is legitimate.** See §1. One edge: `(shift[0] || shift[1])` would read
  `[NaN, NaN]` as absent. `lensShift`'s `!s[0] && !s[1]` would read it as no shift in both passes, while `toScreen.at`
  would give NaN. No road can produce it: clampShift is on `setShift`, `restore`, the link, and the PAN targets' `set`.
- **N2 · "Alt+Arrow never takes the page Back" cannot be judged by the driver.** `.tmp/s2-back.mjs` sets up a real
  history entry (history.length 2) and presses Alt+← from a focused text field, where the dispatcher returns without
  `preventDefault`. The page stayed: the WebDriver chord never reaches Firefox's own Back. So the builder's
  `href unchanged` check would pass with or without the guard. What actually guards the page is `defaultPrevented` on the
  matched keydown, and that is **true** on all four Alt+Arrows (`.tmp/s2-panel.mjs`). The suite would be stronger if it
  asserted that. Firefox's lone-Alt menu bar after an Alt-drag still wants one headed look on Josh's desk; the builder
  says the same.
- **N3 · Zoom to the cursor slips once the clamp engages.** With p′ = c − (c − p)·k and |p′| ≤ 1, a deep zoom far from
  the pivot pushes the pivot to the frame's edge, and the hand's point then drifts. From the boot shift 0 and DIST 8 → 1.2
  (k ≈ 6.7), the anchor holds only for |c| ≤ 1/(k − 1) ≈ 0.18 uv. This follows from R-C1 (shift only) and is worth
  telling Josh when he tries the shift zoomed in, which is the R-C1 trial.
- **N4 · Alt now takes the stage before the instrument's specials.** Before S2, an Alt+drag on a KEPLER perihelion handle
  grabbed it. Now it slides the picture. Alt+Shift+click under HELIUM (a hidden legacy window) slides instead of placing
  the electron. The KEPLER half is in REPORT 146; the HELIUM half is not.
- **N5 · The MOL tag carries id, basis, view and orbital, as the brief asks.** MOLECULES' other state (kick axis, κ,
  speed, the CORE fold, the register) is neither carried nor named in `notCarried`. That is unchanged from before S2, when
  the whole molecule was dropped silently.
- **N6 · `orbit.js` (ORBIT's three spheres) keys on `cameraKey`, which now carries the shift.** A shift step repaints a
  panel that does not depend on the shift. This costs work only on a change (A10: 0 work when still).
- **N7 · A pure two-finger slide moves `dist` by one ulp** (3.3 → 3.2999999999999994): `pinch.distance·span/span` is the
  pre-S2 expression. Under S2 the anchor then moves p by ~1e-16. This is cosmetic, and the pose bytes after such a slide
  are not the boot's.
- **N8 · The builder's count `camera-shift` 11/11 is 10/10.** The file has 10 checks and the page-error gate.
- **N9 · `current`'s audio face (`valuesReveal`) is green at a load of ~1** (15/15 on HEAD). The builder's 9/15 was load,
  as its own base comparison suggested.
- **N10 · The device report pair is mine, at a load of ~1** (§2). The builder's pair at a load of ~11 cannot be compared
  with it directly, but each pair is internally equal. Mine includes S3.
- **N11 · My own red runs, for the record.** Before the GREEN 19/19 run, three runs went red, and each was the test's
  geometry, not the app:
  - run 1: S1;
  - runs 1–2: a cursor whose pivot-plane point exceeded `unproject`'s 7.5 cap (asserted against since);
  - run 3: a same-page hash navigation to the old link that met the app's open-link confirm, so B2 moved to its own
    Firefox.

  Run 1's A4a red was one SLAP `warm` message, isolated by a control window in run 2.

## 5 · The exact next step

Claude Sos reads this report. S2 stands as merged, and S3 already sits on top. Optionally, Sos or S5 lands S1 (one line,
`F.setOcclusion([])` immediately before `F.linePixels(…)` in `tests/camera-shift.browser-test.mjs` §1, plus a second
corner at a left-of-frame shift) and the `defaultPrevented` assertion from N2. Keep N3 for Josh's R-C1 trial. M5's
`?report=1` remains Josh's one command.
