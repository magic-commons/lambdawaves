# C7 · THE FILM — the film verifier's report (2026-10-08, a fresh Opus 5.5 verifier, for Claude Yan)

## Verdict: HOLD

**Why.** The hand-over loses the film (lead 1, CONFIRMED, measured below). RECORD and ONE PERIOD pass their MP4 to the kit's
`saveBlob` about 37 s after the tap. By then the tap's activation has expired. `saveBlob` sees that `navigator.canShare({ files })`
is true and takes the share road. The share is rejected with `NotAllowedError`, `saveBlob` swallows the rejection, and it never
falls back to a download. The person gets no file, and λWAVES' readout still reports success.

- Before C7 every film went out by `<a download>`, which needs no activation. This is a regression introduced by C7.
- It cannot show on this Linux gate, which has no `navigator.share`. It applies on every browser that shares files.
- **Everything else is green.** That covers the lock, the film road's base-copy lock, the outputs, the hazards and their
  mutation, the kit's ownership, the tests, the `__LW` law and the lines.

**Condition for the merge: the C7-FIX.**
1. A film's hand-over that reaches `saveBlob` without transient activation must download, never share. On the app side, the
   fix goes in `render-exact.js` `save` and `capture.js` `save`, for example by checking `navigator.userActivation?.isActive`
   before going through `saveBlob`, or by using an `<a download>` after an await.
2. File a kit issue against `saveBlob`: on a rejected share it should fall back to a download, or check activation first.
3. Add a browser regression that stubs `share` and `canShare` to the spec's rule and asserts a download after a real RECORD
   tap. `measure/c7-verify/c7v-probe.mjs lead1` is that harness.

After the fix, the remaining notes (§ Notes) can ride along with the merge.

| | |
|---|---|
| tip reviewed | `74ade0c` (branch `worktree-agent-a46f384b4af43f3cc`), checked out as `worktree-agent-a4c46eea610dff207` with `git reset --hard 74ade0c` |
| base copy | `2171df3`, exported with `git archive 2171df3 lab tools \| tar -x -C .tmp/base` and served on 8857 / geckodriver 5327 |
| tip ports | 8853 / geckodriver 5323. Both servers were started by me and stopped by pid; no browser is left open |
| GPU wait | `node tools/perf/wait-gpu.mjs 1800` ran before every browser session and returned "free" on its first poll every time (1-min load 0.94–3.9). The total wait was ≈ 0 s, and no other agent's headless Firefox was running |
| machine | RTX 3070, Firefox 157 headless (`rv:157.0`, Linux), canvas 1400×814 |

## THE ONE LOCK — the two lines, verbatim

```
DIGEST LOCK GREEN: 1004 values compared · 0 readback differences · 0 record-byte differences · unrepeatable now: none · page errors 0 · 60 s
DIGEST LOCK GREEN: 1148 values compared · 0 readback differences · 0 record-byte differences · unrepeatable now: none · page errors 0 · 59 s
```

- The first line is `LW_PORT=8853 GD_PORT=5323 node tools/perf/digest-lock.mjs --check --query gastab=0`, exit 0.
- The second is the same command with `--fixture research/release-0.4.0/measure/digest-lock-s4a.json`, exit 0.
- Each ran alone on the GPU.

## One row per brief point

| # | point | result | command → output |
|---|---|---|---|
| 1 | THE ONE LOCK | **GREEN** | The two lines above. 1004 values with 0/0 differences, and 1148 values with 0/0 differences. Nothing was unrepeatable and there were no page errors. |
| 2 | Film road's own lock (base copy) | **GREEN** | `film-probe.mjs .tmp/film-base.json picture,frames` on 8857, then `.tmp/film-tip-pf.json` on 8853, then `node tools/perf/film-compare.mjs .tmp/film-base.json .tmp/film-tip-pf.json` exits **0**. **TAKE A PICTURE:** 97,866 B with hash `ff9ca6bf` on both, so `bytesIdentical: true`. **EXPORT FRAMES:** 25 frames at 1400×814 with `times: true`, `pixelHashesIdentical: true` and `differing: []`; first frame `663e6078`, last `16972853` on both. **Containers:** 2,797,435 B before (λWAVES' deflate) and 3,248,482 B after (the kit's). |
| 3 | A PNG, a loop and a video, actually produced | **GREEN** | `film-probe.mjs .tmp/film-tip-all.json` (picture, loop, video, frames, verify) exits 0. The names, sizes and frame counts are in the table below. `verify()` returned **DETERMINISTIC: 6 frames rendered twice through the kit's recorder, every digest identical.** I wrote the RECORD MP4 to disk (`c7v-mp4` scenario: 744,558 B, the same size as the probe's) and ran `ffprobe -count_frames` on it: `h264 High · yuv420p · 1400×814 · 30/1 · duration 6.000000 · nb_read_frames 180`. I also looked at it with ffmpeg contact sheets. No interactive player is installed. |
| 4 | The hazards that stay named | **GREEN** | Read in `lab/render-exact.js` `createFilm`. **H1:** `f.stats.presents = JITTER_SEED` at :692 sits inside the per-frame retry loop, before `readback`, and the witness fails unless `wit.presents === 14` (:657). **H2:** `before()` does `LW.clock.pause(); LW.governor.on = false` (:619), and the witness checks that the grid stays `J.base.resolution` (:661). **H3:** `LW.quality.auto = false` (:620). The canvas size is witnessed inside `capture.js` `readback` right after `onSubmittedWorkDone` (:633), and checked at :659. **The other witnesses:** field-clock `wit.generation !== 1` (:658), clock `LW.clock.t !== t` (:664), domain `half` (:663), interloper (the drain at :626 plus the presents witness), and frozen modulation (:665). **`HAZARDS`:** 13 `hz(id, owner, …)` rows, 8 owned by the app (jitter, governor, autoscale, fieldclock, camera, h2, modealias, interloper) and 5 by the kit (modulation, dpr, overlays, deflate, gamut). **Mutation:** the :692 pin was replaced by a comment, and `node tests/render-exact.test.mjs` exits **1 with 14 RED judgements**, the same count the builder saw. The suite then crashes with a TypeError at test line 598 before printing its tally (Note N5). I restored the line with `git checkout -- lab/render-exact.js`, `git status` came back clean, and the re-run read **GREEN 0 failing of 37**. |
| 5 | What the kit now owns (by grep) | **GREEN** | **No MediaRecorder:** `grep -n "MediaRecorder\|captureStream" lab/*.js` matches only prose (`audio.js:41` and `capture.js:7`, both comment lines). **Encoding:** `lab/mir/render/encoder.js` (`VideoEncoder.isConfigSupported` down the avc1 ladder) plus `mp4.js`; its only MediaRecorder lines are prose saying it has none. **PNG frames:** `recorder.js` builds `StoredZip` parts and adds `recording.json` (:271, :277, :298). **Take clock:** `createRecordClock` only when `host` is set (`recorder.js:94`), and `createFilm.recorderFor(drive)` passes `host = drive ? opts.host() : null` (render-exact :725), so **a frozen film is built with no host** and nothing is stepped. **Store:** `dir: 'lambdawaves-recordings'` (:728). **Guard:** Escape or `[data-render-cancel]` (`recorder.js:192–193`), on RECORD (`rack.js:1520`) and EXPORT FRAMES (`rack.js:1528`). Measured in OPFS: the store directory is `lambdawaves-recordings`. |
| 6 | Tests | **GREEN** | **Node:** `.tmp/node-gate.mjs` runs `bash test.sh node`'s set one suite at a time (pwa last): **85 suites, 81 GREEN, 4 RED**. The four reds are exactly C0's cascade. `mir-manifest`: "names MIR 1.5.0-alpha.24, which is not an accepted adoption". `new-project`: "OUT OF STEP". `wiring`: "96 modules under lab/ that NO root reaches", **all 96 under `lab/mir/`, no app file**. `pwa`: the absolute URL in `lab/mir/shell/gui.js`. **Focused node suites:** `render-exact` **37/37**, `capture` **33/33**, `export3d` **GREEN**. **Browser** (8853, one at a time, 4 s apart): `export3d` 10 PASS, `render-regressions` 2 PASS, `stage-text` 4 PASS, `offer` **16 of 16** (including "a capture in flight (EXPORT FRAMES, busy) is offered…"), `menubar` 8 PASS. None needed a re-run. |
| 7 | The `__LW` law | **GREEN** | **`capApi`** (`rack.js` capApi) keeps `exportFrames, exact, capture, plan, picture, record, loop, limits, busy`. **`createCapture`** returns `picture, planLoop, save, limits, grab, names, canvas, laws`. **`LW.capturePlan`** is still a getter (`rack.js:5289`). **Every member a test or tool references exists:** `captureUI.{busy, capture, exact, exact.verify, exportFrames}`, `capturePlan`, and `__LW.capture.{limits, picture}`. No test or tool names `zipStored`, `createExactRenderer` or `capture.{record, recordLoop, pngSequence, probe, verifyVideo}`. **The offer edit:** `git show 32f0f2f -- tests/offer.browser-test.mjs` holds the `fps: 2 → 24` change in the same commit as the FPS seg change. |
| 8 | By hand | **mixed**, see below | The probe is `measure/c7-verify/c7v-probe.mjs` (scenarios `cancel`, `persist`, `mp4`), with real WebDriver taps. |
| 8a | RECORD's STOP under the kit's guard | **GREEN** | A real tap on RECORD (`#vrec`, `data-render-cancel` present). At frame 15 of 180 the label read `STOP`, and a real tap on it ended the film; the page was idle 210 ms later. |
| 8b | Escape cancels a film | **GREEN** | A real tap on RECORD, then the WebDriver Escape key at frame 75 of 180. The page was idle 207 ms later. |
| 8c | A driven (MOD-armed) RECORD starts from the first Space | **NOT VERIFIED by hand** | Covered in node by `render-exact.test` H6 ("frame zero is time zero"), which is GREEN. One fact from the browser: a first-run RECORD **is** driven (MOD is armed by default, `rack.js:510`). Its pins read "driven by the kit's record clock from the first Space, 1/30 s a frame". |
| 8d | AUTO-ROTATE comes out as a smooth turn | **GREEN in TURNTABLE**, absent in FREE | **TURNTABLE + AUTO-ROTATE:** 1,251,561 B and 180 frames. Successive frames' mean absolute luma differences are uniform at 0.346–0.521 (mean 0.412), so there is no duplicated frame and no jump. The contact sheet (`measure/c7-verify/c7v-tt-sheet.png`) shows the box turning. **In FREE, the first-run camera mode:** AUTO-ROTATE is stilled. The MP4 is 744,558 B with last digest `e471ab0a…`, identical to a RECORD without rotation. This is a behaviour change (lead 3). |
| 8e | After a cancelled film, OPFS holds nothing of it | **RED before the first checkpoint**, GREEN after | **STOP at frame 15** (before the first checkpoint at frame 60) leaves `lambdawaves-recordings/render-mv0efe59-zpt0a/` with `job.json` (10,226 B) and `payload.bin` (0 B), state `rendering`, no files, no checkpoint. It was still there after two more films. **Escape at frame 75** (past a checkpoint) removed its directory. **Cause:** the kit's `RenderStore.recoveries()` skips any job with no files and no checkpoint samples (`store.js`, `if (m.v !== 1 \|\| (!m.files.length && !m.checkpoint?.samples?.length)) continue`), so λWAVES' `discard({ token })` (render-exact :741) never sees it. An EXPORT FRAMES cancelled before its first 128 MB part is the same case. Small (≈ 10–20 kB a time) but permanent; see lead 2. |
| 8f | A P3 screen, WebKit, the iPad | **NOT VERIFIED** | No device was available here. |
| 9 | Lines | **GREEN** (measured) | `cat lab/*.js \| wc -l` gives **36,288** at `7044f37` (before C), **36,469** at `2171df3` (+181: the adopt's `sw.js` 415 → 596, C0's too) and **35,753** at `74ade0c`. **C7's own share is −716.** `git diff --numstat 2171df3 74ade0c` gives capture.js +120/−458, render-exact.js +388/−781, rack.js +47/−34, export3d.js +8/−6, mathworker.js +1/−1, sw.js +5/−5. **The plan's 1,200–1,800 estimate was wrong; the subtraction is not unfinished.** Every one of the 52 exports of `capture.js` and `render-exact.js` is still referenced, either by lab, tests or tools or (deflateStream, drawCaption, PHASE_VIEWS) internally (`.tmp/deadcheck.mjs`). What stays is live: the period and endpoint laws, and TAKE A PICTURE's own PNG encoder, as C7-BUILD §3 says. |

### The outputs (point 3), `film-probe.mjs` on 8853

| output | name | size | facts |
|---|---|---|---|
| PNG (TAKE A PICTURE) | `lambdawaves-still-2modes-1400x814-20261009-030836.png` | **97,866 B** | Byte-identical twice (`ff9ca6bf`), and byte-identical to the base copy's. Decodes to 1400×814 with pixel hash `663e6078`. 944 ms |
| loop (ONE PERIOD) | `lambdawaves-loop-2modes-1400x814-30fps-180f-t50_265au-20261009-030914.mp4` | **953,575 B** | 180 frames, box `ftyp`, `<video>` decodes 1400×814 and 6 s. 0 contended. Frame 0 at t = 0, frame 179 at t = 49.98623 (179·T/180 of T = 50.265482). 37.4 s to render |
| video (RECORD) | `lambdawaves-clip-2modes-1400x814-30fps-180f-t24_000au-20261009-030951.mp4` | **744,558 B** | 180 frames, `ftyp`, decodes 1400×814 and 6 s. 0 contended. t runs 0 → 23.8667 with the lab paused. 37.1 s to render |
| EXPORT FRAMES | `lambdawaves-frames-2modes-1400x814-24fps-25f-20261009-030956.zip` (part `…-001.zip`) | **3,248,483 B** | 26 entries: `frame_000000.png` … 25 frames, plus `recording.json` (`lambdawaves-deterministic-png`, 24 fps, 25 frames, motion `span`, `app.film` present). Frame 0's pixels equal the picture's. 18.2 s wall |
| verify() | — | — | DETERMINISTIC, 6 frames twice, 2.1 s |

All of these match the builder's numbers.

## The three leads

### Lead 1 · The hand-over can lose the film — **CONFIRMED**

**The code, as it stands.**
- `lab/mir/folders/save-blob.js` `saveBlob`:
  - `if (file && … navigator.canShare({ files: [file] })) { navigator.share({ files: [file] }).catch(() => {}); shared = true; }`, then `if (!shared) { …a.download…; a.click(); }`.
  - The share is not awaited, its rejection is swallowed, and there is no fallback.
  - Its header says the call "must be reached inside the tap that asked with NOTHING awaited before it".
- The callers reach it after awaits:
  - **Films:** `lab/render-exact.js:830–835` `save(r)` is called from `rack.js` `capRecord` / `capRecordLoop` / `capExportFrames` after `await capRun.done` (a 37 s film).
  - **Pictures:** `lab/capture.js:780` `save(r)` is called from `capPicture` after `await capture().picture(…)` (a GPU readback).
- Before C7, both `save`s were a bare `<a download>` (`2171df3` `render-exact.js:1218`, `capture.js:1115`), which needs no activation.

**Measured** (`c7v-probe.mjs lead1`, Firefox 157). The setup:
- A **real** WebDriver tap on RECORD.
- `navigator.share` / `canShare` stubbed to the W3C Web Share rule ("no transient activation → reject `NotAllowedError`"), with `canShare` permissive (Safari-like).
- Every `<a download>` click recorded.

| at | event | `userActivation.isActive` | outcome |
|---|---|---|---|
| 1.9 s | real click on RECORD (`isTrusted: true`) | **true** | the film starts |
| 39.0 s | `film.save` (`…-clip-…-032104.mp4`, 742,908 B) → `canShare` → `share` | **false** | `share-REJECTED NotAllowedError`; `save` returned `true`; **no `anchor-download`**, so the film is lost |
| 41.1 s | real click on TAKE A PICTURE | true | — |
| 41.5 s | `capture.save` (2800×1628 PNG, 0.4 s after the tap) → `share` | **true** | `share-resolved` (inside the 5 s activation window) |
| — | `saveBlob(mp4)` from script, no tap at all (first run) | false | `'share'` → `NotAllowedError`, no download |
| — | `saveBlob(zip)` inside a trusted tap's handler | true | `share-resolved` (the share road works only inside the tap) |
| — | iPad user agent: `prefersVideoDownload()` → true; `saveBlob(mp4)` → `'download'`; `saveBlob(zip)` → `'share'` | — | the iPad's EXPORT FRAMES zip takes the share road, so it is lost the same way after a film's awaits |

**Where it bites.** It bites on any browser with `navigator.share` whose `canShare({ files })` admits the type.
- **MP4:** Chrome/Edge on Windows, ChromeOS and Android, and Safari on macOS and iOS (Chrome's file allowlist includes `.mp4` and `.png`).
- **ZIP:** EXPORT FRAMES' ZIP is not on Chrome's allowlist, so it downloads on Chrome. Safari admits it, so on the iPad and on macOS Safari the frames are lost.

This list is from the platforms' documented support; it was not tested on those devices. On the iPad a video takes the download road, so RECORD survives there, but see Note N1.

**TAKE A PICTURE** survives where it finishes inside the activation window: 0.4 s at ×2 measured here; a ×4 or a slow device is at risk.

### Lead 2 · The 2-minute discard — **CONFIRMED**

**Code.** The timer is the app's:
- `render-exact.js:833` does `setTimeout(() => discard(r), 120000)` after the hand-over.
- `rack.js:1651` does the same for a kept EXPORT FRAMES result.

λWAVES calls `recoveries()` only inside `discard`, to match its own token. Nothing sweeps the store at boot, and λWAVES mounts no RECOVER or DISCARD rows: the kit's `render/panel.js` has them at :294–320, and λWAVES does not use it.

**Measured** (`c7v-probe.mjs persist`):
- **Right after a saved RECORD:** OPFS `lambdawaves-recordings/render-mv0ej1yx-h8med/` holds `lambdawaves-render.mp4` (742,908 B) and `job.json` (19,782 B), state `ready`.
- **I reloaded the page inside the 2 minutes.** After the reload the directory is still there, and **130 s later it is still there**: the page that set the timer is gone, and nothing else removes it.
- **A film cancelled before its first checkpoint** is never removed even while the tab stays open (row 8e).

Each finished film therefore stays in the origin's storage until the 2-minute timer fires in the same tab. Long or high-bitrate films accumulate until the store's quota refuses a run: "Not enough temporary storage for this render".

**Whose.**
- **Kit:** the store (`render/store.js`), its directory layout, `recoveries()`, and its skipping of no-file / no-checkpoint jobs (the hidden early-cancel leak, which even the kit's own RENDER panel cannot see).
- **App:** the 2-minute timer, and the missing sweep or rows. C7-BUILD §10 items 2–3 already list "a result's files die with discard" and "no RECOVER rows" as brief candidates.

### Lead 3 · Behaviour changes for Josh's rulings — **CONFIRMED** (each one; none is a defect)

1. **RECORD is no longer live.**
   - Before C7, RECORD was MediaRecorder over the live canvas in real time (`2171df3` `rack.js:1587` `capture().record`).
   - Now the kit's guard swallows `pointerdown`, `click`, `wheel` and `keydown` for the take (`recorder.js:191–195, 230`), so only Escape and `[data-render-cancel]` get through.
   - The camera is stilled (`camera: 'still'`): pins read "stilled (dy = dp = 0, autoRotate off)".
   - AUTO-ROTATE survives only in TURNTABLE. The first-run camera is FREE (`rack.js:111`), so by default a RECORD has no turn (8d).
2. **A paused lab's RECORD advances t at `clock.rate`.**
   - `capRecord` schedules `T = (N/fps)·clock.rate` from `clock.t` whether or not the clock plays. A driven film integrates `J.rate / J.fps` per frame.
   - Measured with the lab paused at t = 0: the RECORD's frames run t = 0 → 23.8667 a.u. (the name says `t24_000au`).
   - Before C7, a paused lab recorded a still picture.
3. **A MOD-armed RECORD with a live AUDIO source is refused by the kit.**
   - The refusal is `recorder.js:212`: "Live audio cannot be replayed deterministically…".
   - RECORD passes `modulation: modArm ? 'drive' : 'freeze'` (`rack.js:1613`), and **MOD is ARMED by default** (`rack.js:510`). So any project with a live AUDIO source cannot RECORD until MOD is disarmed.
   - Before C7 only EXPORT FRAMES refused live audio (`2171df3` `rack.js` capExportFrames); RECORD did not.
   - This was read in the code, not run with a live microphone.
4. **About 37 s per 6 s film at 1400×814.** Measured: ONE PERIOD 37.4 s, RECORD 37.1 s, against 6 s of real time before.
5. **FPS 15 is gone.**
   - The FPS options went from 15 / 30 / 60 (`2171df3` `rack.js:1502`) to 24 / 30 / 48 / 60 (`FILM_FPS = RECORD_FPS`).
   - The FPS seg is not persisted, so no saved value can restore a 15.

## Notes (to ride with the merge after the C7-FIX)

- **N1 · The iPad video's Blob URL dies at 2 minutes.**
  - `saveBlob` keeps an iPad video's Blob URL for **ten** minutes so Safari can take the file, but the app discards the OPFS file under it after **two**.
  - Measured in Firefox (`c7v-bloburl.mjs`): a finished film's Blob URL reads 28,279 B before `discard`. After it, `fetch(url)` fails with `TypeError: NetworkError` and the File read with `AbortError`.
  - So an iPad download confirmed more than 2 minutes after the save would fail. That consequence is inferred; the device was not tested.
  - The C7-FIX should hold the store copy at least as long as the hand-over's URL, or hand over a memory-backed Blob.
- **N2 · The early-cancel leak (8e)** is the kit's `recoveries()` filter. It belongs in a kit issue: list or sweep job directories with no files.
- **N3 · ONE PERIOD has no STOP.** Its button carries no `data-render-cancel`, and `capRecordLoop` ignores a second press, so only Escape cancels a 37 s ONE PERIOD. RECORD and EXPORT FRAMES both have STOP.
- **N4 · A film's pixels depend on the window arrangement** (an observation; not investigated, and probably not C7's).
  - The same RECORD measured **742,908 B** with the CAMERA card opened for the tap, against **744,558 B** without it.
  - The likely cause is the frame/axis occlusion mask (`rack.js` `refreshOcclusion`), which the old live recorder also captured.
  - The HAZARDS register does not name it.
- **N5 · The mutated `render-exact.test` crashes** with `TypeError: Cannot read properties of undefined (reading '0')` at test line 598 (`bad.mismatches[0]`) before its tally. It still exits 1, so the gate is not fooled, but the suite should report its count under any mutation.
- **N6 · RECORD's kit manifest names its motion `loop`** (label ONE PERIOD) for a clip, because `motion: sched.mode === 'span' ? 'span' : 'loop'`. This is cosmetic.
- **N7 · Not verified:** a P3 screen, WebKit and the iPad's worker store writer, a 4K or 16384²-scale picture's memory, multi-part EXPORT FRAMES (more than 128 MB, several `saveBlob` calls in a row), and a desktop "ask where to save" dialog held open past the 2-minute discard.

## Commands run (counts)

- `git reset --hard 74ade0c`, then `git log --oneline -3`, which showed `74ade0c 0.5.0 C7: wave 199, C7-BUILD.md, BRIEF-C7-VERIFY.md …` on top.
- `node tools/perf/wait-gpu.mjs 1800` before each of the 16 browser sessions; every one returned free at once.
- **Digest lock**, 2 runs: 1004 GREEN and 1148 GREEN, the lines above.
- **Base copy:** `git archive 2171df3 lab tools | tar -x -C .tmp/base`, then `python3 tools/gate/server.py .tmp/base 8857`.
- **`film-probe.mjs`**, 3 runs: base `picture,frames`, tip `picture,frames`, and tip all five steps. All exited 0.
- **`film-compare.mjs`**: exit 0.
- **`c7v-probe.mjs`**, 6 runs: `lead1` twice (the first missed the button; its direct `saveBlob` controls are the no-tap evidence), `cancel`, `persist`, `mp4`, and `mp4 turntable`.
- **`c7v-bloburl.mjs`**: 1 run.
- **ffmpeg**: `ffprobe -count_frames` on the RECORD MP4 (180 frames); contact sheets of both MP4s; a `tblend` difference series on the turntable MP4 (179 values).
- **`node tests/render-exact.test.mjs`**, 3 runs: GREEN 37/37, then the mutation (14 RED, exit 1), then GREEN 37/37. `node tests/capture.test.mjs` gave 33/33. `node tests/export3d.test.mjs` was GREEN.
- **`.tmp/node-gate.mjs`** (`bash test.sh node`'s set): 85 suites, 81 GREEN, 4 RED (C0's cascade).
- **Browser suites**, 5 runs: `export3d` 10, `render-regressions` 2, `stage-text` 4, `offer` 16/16, `menubar` 8. All GREEN.
- **Greps:** MediaRecorder/captureStream; the `__LW` members in tests and tools; `.tmp/deadcheck.mjs` over the 52 exports.
- **Line counts:** `cat lab/*.js | wc -l` on `7044f37`, `2171df3` and `74ade0c`.

The evidence is in `research/release-0.5.0/measure/c7-verify/`. It includes the probe JSONs, `node-gate.json`, the turntable contact sheet and the two probes; run them from the repo root with `LW_PORT`/`GD_PORT` set.
