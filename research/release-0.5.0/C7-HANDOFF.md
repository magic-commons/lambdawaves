# C7 THE FILM — live hand-off (updated after every commit)

- worktree `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a46f384b4af43f3cc`, branch `worktree-agent-a46f384b4af43f3cc`, base `7044f37` (sos-s0 tip)
- ports 8813/5283 (gate server for this tree); 8817/5287 reserved for a base copy (`git archive 2171df3` into `.tmp/base`, not yet made)
- `lab/*.js` before: 36,288 (at `7044f37`, and after the adopt)

## State — PAUSED by a usage alarm (2026-10-08 ~21:30), at step 3 (WIP commit)

| step | commit | lock |
|---|---|---|
| 1 the bare adopt (alpha.24, `adopt.mjs --line 1.5`) | `0327937` | — |
| 2 the lock on the adopted tree | `2171df3` | 1004 GREEN (58 s, 0/0) · 1148 GREEN (59 s, 0/0) |
| 3 WIP: the recorder wired beside the app's road | (this commit) | NOT RUN on this commit (the lock reads `field.readPixels`/`linePixels`/`fieldDigest` only; no `field.js` change) |

Node gate on the adopted tree (`.tmp/node-gate.mjs`, one suite at a time): 85 suites, 4 reds, all C0's cascade —
`mir-manifest` (alpha.24 not in ACCEPTED), `new-project` (OUT OF STEP), `wiring` (unreached kit files), `pwa` (absolute URL `https://www.fabiandesmet.com/` in `lab/mir/shell/gui.js`).
The gate's Firefox 157 has an H.264 VideoEncoder: `decideEncoderPath` → `avc1.64002a` at 320×240…1920×1080, `verifyEncoder` 640×360 ok.

### What step 3 changed (uncommitted work committed as WIP)
- `lab/capture.js`: ADDED `captionOver`, `configureCopy`, `readback` (exported) beside the old road; old `createCapture` (probe/drive/record/recordLoop/pngSequence/verifyVideo) still present, now unused by the rack.
- `lab/render-exact.js`: imports the kit (`mir/render/recorder.js` createRecorder, `mir/render/plan.js` RECORD_FPS/fmtMs/fmtBytes, `mir/folders/save-blob.js`) and capture's new helpers; APPENDED PART 3 `createFilm(LW, opts)` + `FILM_FPS` (the recorder with λWAVES' `frame(i, ctx)`, pins H1–H3 + witnesses, motions `loop`/`span`, `before`/`after` pins, `verify`, `save`, `discard`). Old `createExactRenderer` still present, unused by the rack (still used by `tests/render-exact.test.mjs`).
- `lab/rack.js` (film entry points only): import `createFilm, exactSchedule, FILM_FPS`; `filmHold(on)` (the rack's lock + state put-back; restores the register only if `reg.version` moved); FPS seg = the kit's 24/30/48/60; RECORD = MP4 clip (`exactSchedule` loop-form over `[t, t+seconds·rate)`, AUTO-ROTATE as a `poseAt` yaw path, drive when MOD armed); ONE PERIOD = MP4 of the plan's own times, camera still, modulation frozen; EXPORT FRAMES = PNG frames in the kit's ZIP; `data-render-cancel` on RECORD and EXPORT FRAMES; the rack's own audio refusal removed (the kit's recorder refuses live audio).
- `tests/offer.browser-test.mjs` s9: `fps: 2` → `fps: 24` (the kit refuses 2 fps; same commit per the `__LW` law).
- `lab/sw.js`: `pwa --write`.

### Measured on step 3 (`.tmp/film-probe.mjs`, 8813, Firefox headless, canvas 1400×814)
- PNG (TAKE A PICTURE): 1400×814, 97,866 B, two pictures byte-identical.
- loop (ONE PERIOD): 180 frames, 30 fps, MP4 953,575 B, `ftyp`, decoded by `<video>` 1400×814 6.0 s, 0 contended, 37.3 s.
- video (RECORD): 180 frames, 30 fps, MP4 744,558 B, decoded 1400×814 6.0 s, 0 contended, 37.9 s.
- EXPORT FRAMES (`exportFrames({download:false,fps:24,seconds:1,scale:1})`): **FAILS** — `AbortError: The operation was aborted.` after 5.1 s. Not yet diagnosed (suspects: the kit's OPFS store `RenderStore.create` for the PNG road, or `pngBytes`' canvas `toBlob`; the MP4 road worked with its store).

## Exact next step
1. Diagnose the EXPORT FRAMES AbortError: run `LW_PORT=8813 GD_PORT=5283 node .tmp/film-probe.mjs - frames` with a try/catch around `__LW.captureUI.exact.render({format:'png',...}).done` and print `err.stack` and `rec.state()`; try `storage: {}` (no OPFS) to isolate the store.
2. Then run the lock (1004 + 1148) on step 3, the node gate, and amend/replace the WIP commit with "the recorder wired beside the app's road".
3. Step 4: splice capture.js (`.tmp/splice-capture.py` with `.tmp/cap-head.js` + `.tmp/cap-part2.js`: deletes probe/drive/record/recordLoop/pngSequence/verifyVideo/pickMime, crc32 from the kit, save via saveBlob) — lock after.
4. Step 5: delete render-exact's old driver (`createExactRenderer`, `zipStored` → kit StoredZip in `export3d.js`, `COST_TABLE`/`estimate` → kit `estimateFilm` with λWAVES' 131 ms/Mpx + 181 ms seed, `deflateFor`, `manifest` trimmed), HAZARDS gain `owner: 'app'|'kit'`; re-aim `tests/render-exact.test.mjs` at `createFilm` driven by the REAL kit recorder in node (fake `document`/`ImageData`/`canvas.toBlob` via λWAVES' `encodePNG`, `storage: {}`, a real `createModHost` for the drive case).
5. Base-copy film lock: `git archive 2171df3` → `.tmp/base`, serve on 8817, compare EXPORT FRAMES pixel hashes old vs new.
6. REPORT.md wave 199, `C7-BUILD.md`, `BRIEF-C7-VERIFY.md`.
