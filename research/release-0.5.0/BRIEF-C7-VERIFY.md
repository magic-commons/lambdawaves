# BRIEF · THE FILM VERIFIER for C7 (fresh Opus; D5 reuses this harness)

You are reviewing branch `worktree-agent-a46f384b4af43f3cc` (worktree `…/.claude/worktrees/agent-a46f384b4af43f3cc`) before the
integrator (Claude Sos, `sos-s0`) merges it after C0's. Read `research/release-0.5.0/C7-BUILD.md` first, then
`PLAN.md` §2 row C7. **You never merge, push, tag or deploy.** Work in your own worktree on a copy of this branch.

## Ports and the GPU

- **Ports:** pick your own. Do not use the integrator's 8721/8711.
- **One browser at a time, 4 s between sessions.**
- **The lock runs ALONE** with the 1-minute load under 4. `node tools/perf/wait-gpu.mjs [seconds]` waits for that.
- **A timing red is re-run alone before you believe it.** The RTX 3070 has a one-ulp P5 fault that can show as one.
- **Servers:** `python3 tools/gate/server.py <root> <port>`, stopped by pid. Never use `pkill -f`.

## What to check

1. **THE ONE LOCK.** On the branch tip:
   - `LW_PORT=<p> GD_PORT=<g> node tools/perf/digest-lock.mjs --check --query gastab=0` must be GREEN with 1004 values and 0/0 differences.
   - The same command plus `--fixture research/release-0.4.0/measure/digest-lock-s4a.json` must be GREEN with 1148 values.
   - Any divergence stops the merge until it is explained. Re-run alone first.
2. **The film road's own lock (base copy).**
   - Export `2171df3`, the adopted tree before C7, into a scratch directory and serve it.
   - On the base and on the tip, run `node tools/perf/film-probe.mjs <out.json> picture,frames`.
   - Then run `node tools/perf/film-compare.mjs <base.json> <tip.json>`. It must exit 0: EXPORT FRAMES' decoded pixel hashes and times identical, TAKE A PICTURE byte-identical.
   - The builder's two outputs are in `research/release-0.5.0/measure/c7-film-*.json`.
3. **A PNG, a loop and a video, actually produced.**
   - Run `node tools/perf/film-probe.mjs <out.json>` (steps picture, loop, video, frames, verify).
   - **Record:** each name and size, the `ftyp` box, the `<video>` decode (w, h, duration), the frame counts, and `verify()` = DETERMINISTIC.
   - **Builder's numbers (1400×814):**

     | output | size | frames |
     |---|---|---|
     | PNG | 97,866 B | — |
     | ONE PERIOD MP4 | 953,575 B | 180 |
     | RECORD MP4 | 744,558 B | 180 |
     | EXPORT FRAMES ZIP | ~3.25 MB | 25 |

   - Open one MP4 in a real player if you can, and look at it.
4. **The hazards that stay named** (`lab/render-exact.js` `createFilm`: `frame`, `before`, `after`, `witnesses`).
   - **H1:** the jitter seed 13 is pinned before EVERY frame, and the witness reads 14.
   - **H2:** the governor is off and the clock paused.
   - **H3:** AUTO SCALE is held off, and the canvas size is witnessed AT the readback.
   - The field-clock, clock, domain and interloper witnesses are present.
   - `HAZARDS` has 13 rows with `owner`.
   - **Mutation:** remove the H1 pin line and `node tests/render-exact.test.mjs` must go RED. The builder saw 14 reds. Restore the line afterwards.
5. **What the kit now owns.** Confirm by reading, not by belief:
   - `grep -n "MediaRecorder\|captureStream" lab/*.js` finds code nowhere (prose only).
   - The encoding is `lab/mir/render/encoder.js` + `mp4.js`. The PNG frames are `core/zip.js` StoredZip parts with `recording.json`.
   - The take clock is `render/clock.js`, used only when a film DRIVES the modulation (MOD armed).
   - The store is OPFS `lambdawaves-recordings`. The guard is Escape and `[data-render-cancel]`, which is on RECORD and EXPORT FRAMES.
   - **Check that a frozen film is built with no host:** the kit's FREEZE writes every target once, which is brief candidate 1.
6. **Tests.**
   - Node `bash test.sh node` (or each suite alone): only C0's 4 cascade reds (mir-manifest, new-project, wiring, pwa).
   - `render-exact` 37/37, `capture` 33/33, `export3d` GREEN.
   - Browser: `export3d`, `render-regressions`, `stage-text`, `offer` (16, s9 at 24 fps) and `menubar`.
7. **The `__LW` law.** No member a test uses is renamed or removed: `captureUI.{exportFrames, busy, capture, exact}`, `capture.{picture, limits, planLoop, save}` and `capturePlan`. The `offer` s9 `fps: 2 → 24` edit sits in the same commit as the FPS change (`32f0f2f`).
8. **By hand, if time allows.** Say "not verified" for anything you skip.
   - The RECORD button's STOP works under the kit's input guard, and Escape cancels a film.
   - A driven (MOD armed) RECORD starts from the first Space.
   - AUTO-ROTATE comes out as a smooth turn in the MP4.
   - After a cancelled film, OPFS `lambdawaves-recordings` holds nothing of it. The builder's code discards a failed film's store at once and a saved film's after 2 min.
   - A P3 screen, WebKit and the iPad are UNVERIFIED by the builder.
9. **Lines.**
   - Count with `cat lab/*.js | wc -l`.
   - **Builder:** 36,288 before C → 35,753 after. C7's own share is −716; the bare adopt's `sw.js` +181 is C0's too.
   - Measure, and say whether the plan's 1,200–1,800 estimate was wrong or the subtraction is unfinished. The builder's reasons are in C7-BUILD §3.

## Report

Write `research/release-0.5.0/C7-VERIFY.md` with one row per point above (GREEN / RED / NOT VERIFIED, with the command and its output), the
lock's two lines verbatim, the PNG/loop/video names and sizes, and a verdict: MERGE, MERGE WITH NOTES, or HOLD with the exact reason.
