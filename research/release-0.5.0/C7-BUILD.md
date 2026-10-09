# C7 · THE FILM — build hand-off (2026-10-08, the C7 builder, Opus 5.5)

**In ten lines.** The film is now MIR's `createRecorder` handed λWAVES' `frame(i, ctx)` (`lab/render-exact.js` `createFilm`).
- RECORD and ONE PERIOD are exact MP4s. EXPORT FRAMES writes lossless PNG frames in the kit's stored ZIP.
- The kit owns the encoding, the modulation take clock (a driven film only), the store, the input guard (Escape / `data-render-cancel`) and the progress.
- λWAVES keeps, named:
  - the schedules
  - the GPU readback + settle (capture.js `readback`)
  - the jitter seed 13 pinned per frame
  - H1–H3 and their witnesses
  - every other app hazard, in a register now marked `owner: 'app' | 'kit'`

**THE ONE LOCK held at every step.** 1004 and 1148 were GREEN, 0 differences, on the adopted tree and after each step that touched the render road.
- **Film-road lock (base copy):** EXPORT FRAMES' 25 frames decode to identical pixels before and after C7, and TAKE A PICTURE is byte-identical.
- **`tests/render-exact.test.mjs`:** re-aimed at the seam, it drives the kit's own recorder in node. It passes 37/37, and removing the H1 pin turns 14 judgements red.
- **Node gate:** 85 suites, with only C0's 4 cascade reds.
- **Browser:** export3d, render-regressions, stage-text, offer 16/16 and menubar are green.

**Lines.** `lab/*.js` went from 36,288 to 35,753. That is C7's own −716, offset by the adopt's `sw.js` +181 that C0 carries too. The plan estimated 1,200–1,800; the measured figure is smaller, for the reasons in §3.

**Status.** Nothing is pushed or merged. The next step is the film verifier (`BRIEF-C7-VERIFY.md`), then the integrator's merge after C0's.

| | |
|---|---|
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a46f384b4af43f3cc` |
| branch | `worktree-agent-a46f384b4af43f3cc`, reset to `7044f37` (the `sos-s0` tip) |
| `0327937` | the bare adopt of MIR 1.5 alpha.24 (`adopt.mjs --line 1.5` from the 1.5 worktree + `pwa --write`), identical to C0's |
| `2171df3` | the lock on the adopted tree (and the live hand-off `C7-HANDOFF.md`) |
| `32f0f2f` | WIP, paused by the usage alarm: the recorder wired beside the app's road; `offer` s9 asks 24 fps in the same commit |
| `4568463` | EXPORT FRAMES' AbortError: a kept result's OPFS files were discarded under it; the discard now waits 2 min |
| `7da9ff7` | the hand-off: the lock GREEN on the wired tree |
| `33d20cc` | the old capture road leaves (capture.js 1,188 → 789) |
| `42438c6` | render-exact's old driver leaves; the re-aimed test; export3d's NPZ on the kit's `StoredZip` |
| `0e479af` | the base-copy pixel lock; `tools/perf/film-probe.mjs` + `film-compare.mjs`; the two outputs under `measure/` |
| the docs commit | this file, `BRIEF-C7-VERIFY.md`, REPORT wave 199, one CLAUDE.md paragraph |
| servers | 8813 (this tree) and 8817 (the base copy). Both were started by me and stopped by pid, and no browser is left open |

## 1 · What left (measured with `git diff --numstat 2171df3`)

| file | before → after | what left | what came in |
|---|---|---|---|
| `lab/capture.js` | 1,127 → 789 (−338) | the MediaRecorder road: `pickMime`/`MIMES`, `probe` and `litness` (the WebGPU-canvas probe), the 2-D relay, `drive`, `record`, `recordLoop`, `pngSequence`, `verifyVideo`, the private `grab`'s copy road, its own CRC table (the kit's `core/png.js` `crc32`), its own `save` (the kit's `saveBlob`), and about 60 lines of header prose about the probe | `readback` (the one GPU readback + settle both roads share), `configureCopy`, `captionOver` |
| `lab/render-exact.js` | 1,233 → 840 (−393) | `createExactRenderer`: its loop, restore, progress, deflate choice and PNG container, `grabExact` and `configure` (copies), its stop door, `verify` and `save`. Also `zipStored` (the kit's `StoredZip`), `COST_TABLE`, `interp`, `humanMs`, `humanBytes` (the kit's `estimateFilm`, `ceilingWarning`, `fmtMs`, `fmtBytes`), `PATH_DEPENDENT_LAYERS`, and the manifest-in-the-zip | `createFilm` (312 lines: the frame, before/after, the motions, the witnesses, render/verify/save/discard over the kit's recorder), `HAZARDS[].owner`, `estimate` on λWAVES' seed (181 ms + 131 ms/Mpx) |
| `lab/rack.js` | +13 | the old verbs' MediaRecorder badges and the rack's audio refusal (the kit refuses live audio) | `filmHold` (the rack's lock + put-back, as a `hold` hook), the FPS seg = `FILM_FPS`, the three verbs over `createFilm`, `data-render-cancel` on RECORD and EXPORT FRAMES |
| `lab/export3d.js`, `lab/mathworker.js` | +2, 0 | `zipStored` | `StoredZip` (an NPZ is a Blob; the worker clones it) |

## 2 · What stays named, and where

- **The schedule:** `exactSchedule`, `endpointLaw`, `arithmeticLaw`, `foldOrigin` and `planExact` in render-exact.js. capture.js keeps `loopSchedule`, `planPeriodRecording` and `planLoop`. A film hands its schedule to the kit as a motion (`loop` / `span`) whose `view(i)` is `{ k, t }`.
- **The frame** (`createFilm` → `frame(i, ctx)`), in this order:
  1. the physics clock is SET (`clock.scrub`);
  2. `poseAt` is applied;
  3. H₂'s `update(t)` runs;
  4. **the jitter is pinned to 13** (H1);
  5. `readback` (`field.frame` + `copyTextureToBuffer` + `onSubmittedWorkDone`) runs;
  6. the witnesses are checked: jitter `presents === 14`, the field-clock generation +1, the canvas size at the readback (H3), the grid (H2), the domain, the clock t, and a frozen rack not running;
  7. the caption is drawn;
  8. the digest is taken over the RGBA.

  A contended frame is rendered again, and after 3 retries it throws `ABORTED at frame k …` through the kit's failure road.
- **`before` / `after`.** The rack's `hold` runs, then:
  - **H2:** the clock is paused and the governor is off.
  - **H3:** `quality.auto = false`.
  - **H5:** the camera is stilled.
  - **frozen film:** the rack is stopped.
  - **H9:** a drain runs, the `helium.sol` demand is made, and COPY_SRC is configured.

  Everything is put back afterwards, and `presents` is advanced by the frames delivered.
- **The register.** `HAZARDS` has 13 rows. **8 are the app's:** jitter, governor, autoscale, fieldclock, camera, h2, modealias, interloper. **5 are the kit's:** modulation, dpr, overlays, deflate, gamut.

## 3 · Why −716 and not 1,200–1,800

- **The period and endpoint laws stay.** They are λWAVES' physics and the kit has no equivalent. `planPeriodRecording`, the two schedules, the fold and the arithmetic proofs are several hundred lines, all gated.
- **The picture stays.** No recorder makes a still at up to 16384². The kit's PNG goes through a 2-D canvas (Firefox's area cap is ~1.25e8 px), so λWAVES' own PNG encoder (`pngFilter`, `buildPNG`, `encodePNG`, about 100 lines) stays for TAKE A PICTURE.
- **The seam came back.** `createFilm` is 312 lines: the frame with its pins and witnesses, the motions, before/after, the result and its manifest, verify, save and discard. It replaced about 480 lines of the old driver.
- **Some of the plan's span was never the kit's to take.** The probe and relay prose, the MediaRecorder road and the driver left whole.

## 4 · The recorder's API as used

```js
createRecorder({ host /* null when frozen, modHost when a film DRIVES the modulation */, frame, before, after, check,
  motions: { loop: { label: 'ONE PERIOD', prepare }, span: { label: 'SPAN', prepare } }, describe /* the film's schedule into recording.json */,
  app: 'lambdawaves', dir: 'lambdawaves-recordings', colorSpace /* 'display-p3' on a P3 canvas */, currentSize })
rec.run({ motion: 'loop' | 'span', fps /* 24 | 30 | 48 | 60 */, durationS: N / fps, format: 'mp4' | 'png', size: { w, h } /* even */,
  modulation: drive, timeline: false, motionOptions: { mode, t0, T | span }, onProgress })
rec.cancel() · rec.discard(result) · rec.recoveries()
```
Two recorders are built lazily: `freeze` with no host and `drive` with `modHost`. The kit's FREEZE would write every registered target once on enter, so a frozen film takes the kit's own "nothing stepped" road instead.

## 5 · The lock at each step

| tree | 1004 | 1148 |
|---|---|---|
| `2171df3` (the bare adopt) | GREEN 58 s, 0/0 | GREEN 59 s, 0/0 |
| `4568463` (the recorder wired) | GREEN 59 s, 0/0 | GREEN 65 s, 0/0 |
| `33d20cc` (capture road out) | GREEN 59 s, 0/0 | GREEN 61 s, 0/0 |
| `42438c6` (render-exact driver out) | GREEN 58 s, 0/0 | GREEN 58 s, 0/0 |

The commands, run alone on the GPU with the 1-minute load under 4 (`tools/perf/wait-gpu.mjs` polls for that):
- `LW_PORT=8813 GD_PORT=5283 node tools/perf/digest-lock.mjs --check --query gastab=0`
- the same command plus `--fixture research/release-0.4.0/measure/digest-lock-s4a.json`

The 588 is the default fixture at `--grids 96`, so it is a subset of the 1004 and was not run separately. The lock reads `field.readPixels`, `linePixels` and `fieldDigest` only, so it never enters the film's files. **The film road's own lock** is §6's base copy.

## 6 · The film produced (RTX 3070, Firefox 157 headless, canvas 1400×814, `tools/perf/film-probe.mjs`)

| output | name | size | facts |
|---|---|---|---|
| PNG (TAKE A PICTURE) | `lambdawaves-still-2modes-1400x814-….png` | 97,866 B | byte-identical twice, and byte-identical to the pre-C7 tree (`ff9ca6bf`) |
| loop (ONE PERIOD) | `lambdawaves-loop-2modes-1400x814-30fps-180f-t50_265au-….mp4` | 953,575 B | 180 frames over T_ψ = 50.265 a.u.; `ftyp`; `<video>` decodes 1400×814, 6.0 s; 0 contended; 36.9 s to render |
| video (RECORD) | `lambdawaves-clip-2modes-1400x814-30fps-180f-t24_000au-….mp4` | 744,558 B | 180 frames, decodes 6.0 s, 36.7 s to render |
| EXPORT FRAMES | `lambdawaves-frames-2modes-1400x814-24fps-25f-….zip` | 3,248,483 B | 25 `frame_000000.png` … + `recording.json` (the film's schedule under `app.film`); frame 0's pixels equal the picture's |
| verify() | — | — | DETERMINISTIC: 6 frames twice through the kit's recorder on the GPU, every digest identical |

**Base-copy pixel lock.** `git archive 2171df3` was unpacked to `.tmp/base` and served on 8817/5287; the C7 tree ran on 8813/5283. Both ran `film-probe.mjs picture,frames`.
- **Result:** EXPORT FRAMES' 25 frames decode to identical pixel hashes, at identical times.
- **Containers differ:** 2,797,435 B with λWAVES' deflate before, 3,248,483 B with the kit's after.
- **TAKE A PICTURE:** byte-identical.
- **Evidence:** `research/release-0.5.0/measure/c7-film-base-2171df3.json` and `c7-film-42438c6.json`. Running `node tools/perf/film-compare.mjs` on the two exits 0.

## 7 · Tests

- **Node** (the builder's `.tmp/node-gate.mjs`, every suite one at a time; `bash test.sh node` is the same set): 85 suites, 4 reds, all from C0's cascade, the same set on the adopted tree and at every C7 step:
  - `mir-manifest`: alpha.24 is not in ACCEPTED.
  - `new-project`: OUT OF STEP. `node tools/new-project.mjs --check` says the same; that is C0's regeneration.
  - `wiring`: unreached kit files.
  - `pwa`: the absolute URL in `lab/mir/shell/gui.js`.
- **Re-aimed and changed suites:**
  - `render-exact` **37/37** (it was 40 judgements; the zip, the old manifest and the escape hatch left with the driver).
  - `capture` **33/33**.
  - `export3d` (node) GREEN, edited in the same commit because an NPZ is now a Blob.
- **Browser** on 8813, one at a time, 4 s apart, load under 4:
  - `export3d` 10 PASS
  - `render-regressions` 2 PASS
  - `stage-text` GREEN (the caption reaches the picture)
  - `offer` **16/16** (s9: EXPORT FRAMES in flight, at 24 fps)
  - `menubar` GREEN
  - None needed a re-run; nothing was red.
- **The `__LW` law:** no member used by a test is renamed or removed. `captureUI.{exportFrames, busy, capture, exact}`, `capture.{picture, limits, planLoop, save}` and `capturePlan` keep their names. The one test whose call changed (`offer` s9, `fps: 2` → `24`) was edited in the same commit as the change (`32f0f2f`).

## 8 · Blockers

None are open.

The one met: EXPORT FRAMES failed with `AbortError: The operation was aborted.` from `blob.arrayBuffer()` on the result's files (`.tmp/film-probe.mjs - frames`). The kit's store hands files back as OPFS `File`s, and the rack's `discard` removed them under a kept result. It was fixed in `4568463`.

## 9 · Behaviour Josh will see

- **The tempo is exact and the film is slower to make.** A 6 s, 1400×814 RECORD or ONE PERIOD takes about 37 s to render, against the old real-time WebM's 6 s. The film is an MP4, not a WebM.
- **FPS** offers the kit's 24 / 30 / 48 / 60. 15 is gone.
- **While a film runs the page's input is swallowed.** Escape or the STOP buttons cancel.
- **RECORD with MOD armed** drives the modulation from the first Space (deterministic). Before, it played on the wall clock.
- **RECORD carries AUTO-ROTATE** as a pose path (turntable mode). A free-mode spin and a coasting fling are stilled for the take.
- **ONE PERIOD** stills the camera and freezes the modulation, so the loop closes.
- **Film sizes are even.** A canvas with an odd side films 1 px narrower.
- **EXPORT FRAMES' zip is the kit's:** `frame_000000.png` … + `recording.json`. The old manifest.json and ffmpeg.txt are gone; the ffmpeg line now rides in the result's manifest.

## 10 · Open items (brief candidates)

1. **FREEZE writes every target.** RENDER.md says "with both off nothing is stepped", but `render/clock.js` `enter` still does `clock.step(0)` to write the frozen look on every target, through a toNorm/fromNorm round trip and every setter's side effects. λWAVES avoids it with a host-less recorder. Candidate: skip the write when nothing is driven, or say so in RENDER.md.
2. **A result's files die with `discard`.** They are OPFS `File`s, so `rec.discard(result)` invalidates `result.files[i].blob`. Candidate: say so in the recorder's header, or hand back memory-backed blobs.
3. **No RECOVER / RESUME / DISCARD rows in λWAVES.** The kit's `createRenderCard` would give them, but the panel lists TIMELINE · ACTIVE / SELECTION motions that an app without a timeline cannot use. Candidate: an option to hide the timeline motions.
4. **The caption is the interim.** It is drawn in `frame()` by `captionOver`; KIT BRIEF 6's `overlay(i, ctx)` replaces it (D5).
5. **Unverified:** a P3 screen (`colorSpace: 'display-p3'`), WebKit or the iPad (Safari's worker store writer), and a 4K or 16384²-scale PNG export's memory.
