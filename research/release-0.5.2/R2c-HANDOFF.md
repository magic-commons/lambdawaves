# R2c-HANDOFF (0.5.2 "Rack Dissolution" · PAIR 3 beside R2d) — PAUSED on the usage alarm, 2026-10-10 ≈11:30 CDT

- **Goal:** BRIEF-R2c. Move the WAVE · CLIP · PALETTE · CAMERA material, the SETTINGS card and the film road out of `boot()`, verbatim, into
  `lab/windows/material.js`, `settings-card.js` and `film.js`, each called at its seat. `filmHold` stays in boot as `app.loop.hold`, by value.
- **Where:** worktree `.claude/worktrees/agent-aa99c668f22d59ca3`, branch `worktree-agent-aa99c668f22d59ca3`, base `8796d15` (`yan-c`).
- **Commits:**
  - `ddfbfb9`: THE MOVE (the brief's commit 1, with pwa).
  - `bb480d1`: this file, after step 1.
  - This update (WIP, usage pause).
  - Nothing in `lab/` or `tools/` is uncommitted; every touched file passes `node --check`.

## Files changed (vs `8796d15`)
`lab/rack.js`, `lab/sw.js`, new `lab/windows/material.js`, new `lab/windows/settings-card.js`, new `lab/windows/film.js`, `tools/rack-deps.mjs`,
`tests/rack-deps.test.mjs`, and this file.

## Done, span by span

- **material** (127 lines): `createMaterial(app)`.
  - The root makes the four `device()`s and WAVE's head (SPACE, OBSERVABLE, the material knobs).
  - The second seat is `function createDrawClipPaletteCamera()`, declared inside the body (readouts' shape). It holds DRAW, CLIP, PALETTE · INVERT and CAMERA.
  - Hand-over: `{ ui, device, mat, PAL_DEF } = app, { schedule } = app.loop, { cameraPort } = app.host, { saveSettings } = app.sh, { mod, modHand, applyAccent, field, setReference } = app.ctl`.
  - It returns `{ wObs, wPal, wCam, wClip, createDrawClipPaletteCamera }` (SPECTRUM's appends and the loop read the four handles).
  - `app.state.palette` and `camKnobs` are its own members.
- **settings-card** (177 lines): `createSettingsCard(app)` → `{ createFieldQuality }`.
  - The hooks (`theme`, `restage`, `setStageColour`, `setStageFollow`, `setStage`, `setGamut`, `setTheme`) are registered at its root.
  - `layout` is read as `app.sh.layout` inside its RESET LAYOUT callback.
  - The `THEME and SURFACE` header stays at its seat in rack.js, re-indented to 2.
- **film** (22 lines): `createFilmApi(app)`, one seat, no return.
  - Hand-over `{ hold: filmHold } = app.loop` — an alias, so `createFilm(…, { hold: filmHold })` stays byte-identical. This replaces the brief's `{ hold }`.
  - It reads `app.sh.LW`, `app.w.periodEnergies` and `app.w.stageCaption()` at use (all lazy).
  - `app.state.capApi` is its own member now. The 5-line THE FILM header stays at the seat.
- **filmHold:** the block `{…}` is dissolved. `filmHold` stands at boot level before the material seat, its tokens unchanged and every line
  re-indented by −2. `let filmBefore = null;` follows it (split from the old film `let`).
  - The literal's loop is `hold: filmHold` (by value, hoisted).
  - The literal's `camKnobs` is `{}`, and the three `app.state` inits are deleted.
- **Fills the tree needed that the brief did not name:**
  - `app.host.cameraPort = cameraPort`, appended to the camera-law fill line. R2d needs the same fill: keep one at the merge.
  - `app.sh.setCardStyle` and `setDisconnected`, appended to R3b's `app.sh.quality` line.
- **The go line:** `app.w.stageCaption = stageCaption;` at the head of `/* ── go ──`. **The integrator deletes it at the merge with R2d**, whose `stage-words.js` registers it.
- **The tool's anchors** (`tools/rack-deps.mjs`):
  - settings-card's `file:` is `lab/windows/settings-card.js`.
  - `PLANNED_CUT` order: `filmHold` (`^ {2}`) → `const { wObs, wPal, wCam, wClip,` → `^ {2}/* ── THEME and SURFACE` → `createDrawClipPaletteCamera();` →
    `^ {2}/* ── THE FILM` → `createFieldQuality();`.
  - **New clause:** a slot the literal holds by value under another key (`loop.hold: filmHold`) hands that boot-level name; without it `{ hold } = app.loop` is a G-A stray.
  - `rack-deps.test` gains one law, RED on the base tool and GREEN now.
- **Imports out of rack.js:** `planeModel`, `seg`, `trig`, `readout`, `sw`, `group`, `createFilm`, `createCapture`, `maxPictureSize`, `createRampPanel`, `createCameraPanel`,
  `PALETTE_BY_ID`, `PRESET_GROUPS`, `hexToRgb`, plus the already-dead `toLUT`.
  - The ramp import line became the three module imports.
  - The tool now reports "imports never referenced: none".
- **Lines:** `lab/*.js` + shell + windows **27,893 → 27,902 (+9)**. rack.js 2001 → 1681; the modules 127 / 177 / 22; sw.js +3.
  - Subtracted: 20 blank lines in runs, 1 blank before the seats, 3 inits, 2 block braces, 3 import lines.
- **Verbatim** (`.tmp/r2c/verbatim.mjs`): 319 moved non-blank lines.
  - 296 are byte-identical; 15 are re-indented by −2 (filmHold and the seat headers).
  - The other 8: the 3 deleted inits, 1 `layout` slot read, the split `let`, and 3 lines of film slot reads.
- **Classes** (`.tmp/classes-before-v.txt` → `.tmp/classes-after-v.txt`):
  - material 1 → 1; settings-card 5 → 5.
  - film 6 → 5: it owns `capApi`; backward gains `filmHold`.
  - notebook 21 → 20: it now owns `exporter3d`.
  - boot (exempt) 76 → 79: `filmHold` read by the literal; `stageCaption` and `w.stageCaption` from the go line.
  - The hinge holds (spectrum 24); 0 bare writes; G-A clean.
  - `modStore` is now unread in boot, like `markBatchBegin` and `solveCard` (an integrator candidate).

## Suites (tree 9103/5573; base export `.tmp/base` 9107/5577; both servers STOPPED by pid; no browser left)

- `bash test.sh node`: exit 0. Within it: `rack-deps`, `first-run` 0 failing of 12, `auto-scale` 23/23, `ink`, `render-exact` 0 failing of 40.
- `lw-facade` 1/1. `film-handover` 4/4.
- `film-probe` on both trees, then `film-compare`: exit 0. Picture bytes, frames, loop and video digests, times and MP4 are all identical.
- `camera-routes`: 5/5, SAME as the base.
- `camera-shift` GREEN.
- `serialize-bytes`: 11/11 full + edit, sha-identical to the live base export.
- `take-in-bugs`: tree red twice (the frame-paced "app time advances", each time in a different case); base GREEN once; then **tree 4/4 GREEN**.
- Rig reds, identical on the base:
  - `curves` scene 3: the same screenshot hash on both trees.
  - `settings-probe`: WATER "Render did not settle"; boot 716 B and WAVE DANCER 752 B green on both.
  - The boot chunk (ranges `181-198,214-219,317-382,641-679,696-757,787-809,1342-1632,1774-1932,2384-2412`): **21/23 on both trees**.
    B60 (the governor median 66 ms) and B65 (the travel restMs) are red on both.

## Not done

`R2c-BUILD.md`; REPORT.md **wave 221** under the 0.5.2 heading (after wave 220); the brief's commit 2.

## Exact next step (on resume, in this worktree)

1. Run `node tools/rack-deps.mjs --classes` (it should match `.tmp/classes-after-v.txt`).
2. Write `research/release-0.5.2/R2c-BUILD.md` from this file. Include the drafted CLAUDE.md sentence (NOT applied) and "what Josh will see: nothing".
3. Append REPORT wave 221.
4. Commit `0.5.2 R2c · the light check; the classes table; R2c-BUILD.md; wave 221`.

Never merge, push or tag. The raw logs are in `.tmp/r2c/logs/`.
