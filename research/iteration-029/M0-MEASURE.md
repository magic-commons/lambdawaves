# 029 M0 — THE INSTRUMENT: where a modulated frame's milliseconds go (Opus, 2026-10-30)

Tree: yan-c `e9034304` (029 opened), `0.9.9-alpha · Emission Spectra`. No file under `lab/` was edited. The tool is
`tools/perf/mod-profile.mjs` (one file). The raw records are in `.tmp/mod-profile/` (not committed): `firefox-run1.json`,
`firefox-run2.json`, `chromium-c.json`, `chromium-c.cpuprofile`, `chromium-c.trace.ndjson` (131 MB).

**The answer in four lines.** On Josh's screen, the WAVE DANCER project with the AUDIO device live on STAR presents 105.6 frames/s
on a 120 Hz panel (p95 16.5 ms). The renderer's main thread is busy 75 % of the time and the GPU process's main thread 89 %.
Most of the JavaScript is one route: the audio's HIGH band drives `material.stage`. Every tick, that write repaints every λ mark
on the page (`paintMarks`, 2.35 ms per tick, 47 % of the page's JS). After that comes the DOM churn the ticks cause (22,000
mutation records a second): text writes wake three page-wide observers, one of which forces a layout every frame.

## 0 · THE METHOD (re-run after every fix, same scene, same command)

1. `node tools/perf/mod-profile.mjs` builds a shadow root in `.tmp/mod-profile/root`. It is the tree's top level as symlinks,
   with `lab/` as symlinks too, except `lab/index.html`. That file is copied, with one classic `<script src="../mp-probe.js">`
   put first in `<head>`, so the probe sees the boot's own timers and observers. The tool serves the root with
   `tools/gate/server.py` on a free port in 9801–9889 (GD = port − 4000) and stops that pid at the end.
2. **Firefox, headless, the gate's own driver** (`tools/gate/gatekit.mjs`), 1920 × 1080. Each scene gets its own browser:
   a second navigation in one headless Firefox here leaves the new page with **no animation frames at all**. Measured: 0 rAF
   in 3 s, "Render did not settle".
3. Each scene: `__LW.projects.demo(<file>)`, `__LW.mod.arm(true)`, window `expand()`/`collapse()`, pause, settle, 1 s, then
   `__MP.start()` · `__LW.play()` · 30 s · `__MP.stop()`.
4. **A frame is one entry of rack.js `loop`, up to the next entry.** The probe times the loop. It also times every other rAF
   callback, timer, idle callback, Resize/Intersection/Mutation observer callback and event listener, by name. On top of that:
   `__LW.field.frame` (the present's CPU encode), and the registry's `'*'` notice (each target write: count, distinct ids, the
   first write's stamp). Then `clock.onAdvance` (the tick's end), the modulation window's own paint meter, and the two native
   AnalyserNode reads. One MutationObserver of the probe's own counts records per frame, the routed knobs whose DOM moved, and
   the region written. Its own time is kept apart (`moSelf`). Long tasks and the heap are recorded where the browser has them.
5. `unattributed = span − every timed callback − moSelf`. That is the browser's own style, layout, paint, compositing and GC,
   plus the microtasks nobody wraps.
6. **Scene c's audio is the real capture.** `navigator.mediaDevices.getUserMedia` is answered with a MediaStream of
   `media/star.mp3` s 36–66 (the drop: an ffmpeg-decoded copy in `.tmp`; the mp3 is only read). A real pointer then presses the
   AUDIO device's MIC button, or the element's own click when the notebook covers it. λWAVES does not run `installModulation`:
   its capture is built lazily inside `lab/mod-port.js:89`, so no factory can be injected after boot. This road runs the kit's
   `audio-capture.js` unchanged (analyser, FFT 2,048, `read()` per feed), which is better than a fake.
7. After c, c2 and e comes **THE PRICE OF ONE WRITE**: every routed target is written 20× through `registry.applyModulatedNorm`
   (paused), giving the median JS ms, then JS + a forced layout. The tick's parts are also run alone (the `applyAll` walk, one
   `modFeedAudio`, the capture's read).
8. The commands (`--audio` is needed where the tree has no `media/star.mp3`; yan-c's checkout has it):
   - all Firefox scenes, about 8 min: `nice -n 10 node tools/perf/mod-profile.mjs --audio media/star.mp3 --json .tmp/mod-profile/firefox.json`
   - one scene: `nice -n 10 node tools/perf/mod-profile.mjs --scenes c --audio media/star.mp3`
   - Josh's screen: `nice -n 10 node tools/perf/mod-profile.mjs --chromium c --audio media/star.mp3`. This is headed
     `/snap/bin/chromium --enable-unsafe-webgpu --ignore-gpu-blocklist --enable-features=Vulkan --use-angle=vulkan
     --ozone-platform=x11` on DISPLAY :0, about 70 s on screen. It uses the same probe (`Page.addScriptToEvaluateOnNewDocument`),
     30 s of CDP Tracing (devtools.timeline, v8.execute, blink.user_timing, disabled-by-default-devtools.timeline(.frame)) and a
     200 µs Profiler sample. The raw trace and the cpuprofile are written before any summary.
9. Thresholds: a frame over **17.5 ms** missed a 60 Hz vsync (16.7 + 0.8 jitter); over **34 ms**, two.
10. Two full Firefox runs (run1 and run2, 15 min apart) agree within 6 % on every headline number. Examples: a fps 11.7 / 12.4,
    c 9.4 / 9.4, e 2.3 / 2.3, c tick p50 5.42 / 5.40 ms. No number moved between the runs.

**The display is 120 Hz, not 60.** `xrandr` on :0 reads `1920x1080 119.93*` on both outputs. The brief assumed 60 Hz; on Josh's
panel the frame budget is **8.3 ms**.

## 1 · THE TABLE

### Josh's screen — headed Chromium 156, RTX 3070 (adapter `nvidia ampere`), canvas 1865 × 868, scene c (WAVE DANCER + AUDIO live on STAR + window open)

| metric | value |
|---|---|
| presents | **105.6 /s** on a 120 Hz panel; present interval p50 **9.2** · p95 **16.5** · p99 **20.0** ms; 141 frames > 17.5 ms, 7 > 34 ms in 30 s |
| rAF gap | p50 8.3 · p95 8.5 · p99 16.7 ms (max 241.7: one stall) |
| app loop JS / frame | p50 3.0 · p95 4.6 · p99 5.5 ms. The loop with a modulation tick takes 3.4 ms p50; without one, 0.3 ms |
| the modulation tick (loop entry → onAdvance) | p50 **3.0** · p95 4.4 ms; 3–4 target writes per tick (exposure, softness, iso, stage) |
| renderer main thread (trace, self time) | busy **22.8 s of 30.4 s (75 %)**: scripting 12.6 s · paint/composite 5.6 s (Layerize 3.3 · Paint 1.4 · Commit 1.0) · style/layout 4.1 s (Layout 2.4 · PrePaint 0.7 · UpdateLayoutTree 0.6 · IntersectionObserver 0.3) · GC 0.1 s |
| GPU process | CrGpuMain busy **27.1 s of 30.4 s (89 %)** · VizCompositorThread 11.1 s · renderer Compositor 3.5 s |
| field | `field.frame` CPU p95 0.3 ms; in flight p50 2 · p95 **4** (the PACE cap); 241 frames held at the cap in 30 s |
| DOM | **21,911 mutation records/s** (282 per frame p50, 467 p95); 194 target writes/s |
| heap | 41.1 → 31.4 MB (max 44): flat; 0 long tasks |

### Headless Firefox 158 (the gate's), RTX 3070, 1920 × 994 viewport — run2 (run1 agrees within 6 %)

| scene | fps | present p50 / p95 / p99 ms | >17.5 / >34 | loop JS p50 / p95 ms | tick p50 / p95 ms | writes / tick | win paint p95 | mutations / frame p50 | unattributed p50 ms |
|---|---|---|---|---|---|---|---|---|---|
| idle (paused, window open, 15 s) | — | **0 loop frames** | 0 / 0 | — | — | — | — | — | — |
| a WAVE DANCER, window closed | 12.4 | 87.9 / **111.8** / 200.4 | 298 / 297 | 0.82 / 3.16 | 0.46 / 2.84 | **0** | 0 | 1 | 86.2 |
| b window open | 9.5 | 105.3 / **117.5** / 123.5 | 281 / 281 | 2.64 / 6.02 | 0.62 / 4.48 | 0 | 1.48 | 174 | 101.3 |
| bh b with the UI hidden (H) | **59.6** | 17.1 / **18.1** / 19.9 | 345 / 3 | 0.60 / 0.80 | 0.40 / 0.56 | 0 | 0 | 0 | 16.4 |
| bf b with FROST off | 10.6 | 97.9 / **102.6** / 104.8 | 313 / 313 | 2.16 / 5.66 | 0.60 / 4.08 | 0 | 1.42 | 174 | 95.9 |
| c b + AUDIO live (STAR drop) | 9.4 | 105.0 / **119.9** / 126.9 | 282 / 282 | 6.70 / 9.30 | **5.40 / 7.88** | 4 | 1.12 | 468 | 97.1 |
| c2 c, window closed | 12.1 | 87.0 / **102.0** / 103.5 | 334 / 332 | 4.82 / 7.52 | 4.56 / 7.24 | 4 | 0 | 286 | 82.3 |
| d STAR LOOP (27 lanes) | 20.9 | 49.1 / **53.7** / 57.7 | 609 / 596 | 3.28 / 5.32 | 2.96 / 4.66 | 7 | 0 | 33 | 45.5 |
| e stress (59 routes, 3 shader nodes, CURVES, window open) | 2.3 | 314.6 / **599.0** / 602.5 | 69 / 68 | **39.2 / 44.0** | **20.4 / 23.2** | 50 | 1.50 | 1,385 | 279.2 |

How to read headless Firefox. Its frame is the **software compositor's**, not the app's. With the interface visible it presents
9–12 frames/s whatever the JavaScript does: the JS is ≤ 10 ms of a ~100 ms frame, and the rest is unattributed. Hide the
interface and the same scene runs 59.6 fps. Frost OFF buys only 1 fps (9.5 → 10.6), so the cost is the area of interface
composited over a moving canvas, not the blur radius. 017's headed Firefox ran 117 fps on the default look (P-BUILD P0). The
headless rows are trustworthy for **JS per frame, ticks, writes and mutations**, and not for the frame rate.

Other numbers:
- a `gpuFrameMs(120)`: frame 6.8 ms · present 5.0 ms at 1920 × 994, 64³.
- The tick's parts alone (paused, 389 registered targets): the `applyAll` walk 0.08 ms · one `modFeedAudio` 0.02 ms · the
  capture's read 0.04 ms.
- Long tasks: none in any scene. Firefox gives no heap figure (no `performance.memory`).

**WAVE DANCER without audio writes nothing.** Scenes a and b have 0 writes. The only clocked route is the LFO → `observer.fov`,
and the demo's fov base is 1.2, the top of the range. The route adds upward, so it clamps and the registry suppresses the write.
Josh's laggy case is therefore scene c: the AUDIO device's LOW band drives exposure, softness and iso, and the HIGH band drives
STAGE.

## 2 · THE OFFENDERS, ranked by ms per frame on Josh's screen (Chromium c, 105.6 presents/s, 60 ticks/s)

1. **STAGE repaints every λ mark on the page, every tick: 141 ms/s = 1.34 ms per frame (2.35 ms per tick), 47 % of the page's
   own JavaScript.**
   - The road: route r5 (audio HIGH → `material.stage`, `lab/shell/modulation.js:48`) → `app.hooks.setStage`
     (`lab/windows/settings-card.js:78`) → `setStageMix` (`:58-62`) → `paintMarks()` (`lab/look.js:106`) →
     `accent.paintMarks` (`lab/mir/shell/accent.js:100-108`).
   - That function runs three `querySelectorAll`s over the whole document (3,449 ms self in 30 s, the top function of the
     profile). It writes `fill` on every mark rect in every card (443 ms of `setAttribute`): about 520 attribute records/s per
     card region, about 5,000/s in all.
   - Only `#title .lam`'s colour depends on the stage ground. The nine-square marks' fill is `wheelColor(k · 40)`, which does
     not depend on the stage at all.
   - The price of one write, measured alone: `material.stage` **1.9 ms**, against 0.02–0.04 ms for exposure, softness, iso
     and fov.
   - Firefox c − b: tick p50 0.62 → 5.40 ms, of which STAGE is about 2 ms.
2. **The browser's own style, layout, paint and composite work on the main thread: about 324 ms/s ≈ 3.1 ms per frame.**
   Layerize 108 · Layout 81 · Paint 47 · Commit 32 · PrePaint 24 · UpdateLayoutTree 21 · IntersectionObserver 11 ms/s. It is
   driven by the 21,911 mutation records/s. By region:
   - the modulation window 4,794/s (22 %)
   - the λ marks in ~10 cards ≈ 520/s each (≈ 24 %: offender 1)
   - SPECTRUM 1,211/s (its reader paints while ψ plays, not modulation)
   - the modulated knobs' DOM in OBSERVER, SETTINGS and CAMERA (722 · 623 · 520/s)
3. **A knob's text write is a childList mutation, and three page-wide subtree observers wake on it every tick: ~47 ms/s ≈
   0.45 ms per frame, plus a forced layout mid-frame.**
   - The cause: `setText` writes `el.textContent = v` (`lab/mir/core/perf.js:21-24`), which replaces the text node.
   - (a) The dock span's MutationObserver (`lab/mir/window/dock.js:170-172`, `childList + subtree` on both racks) books a
     `read()` every frame. `edgeOf` (`:140-147`) calls `querySelector`, `getComputedStyle`, `getClientRects` and `rect()`
     on a DOM the tick has just dirtied: **1,163 ms inclusive in 30 s (39 ms/s)**, the second function of the profile.
   - (b) control-help's whole-document observer (`lab/mir/control-help.js:87`) runs `adopt()` on every added text node:
     4.3 ms/s, 3,989 calls.
   - (c) stage-words' furniture observer (`lab/shell/stage-words.js:247-249`) recomputes `rackKey()`: 2.5 ms/s, 2,640 calls.
   - (d) The dock's own `book`: 1.6 ms/s.
4. **The modulation window, open: 19.4 ms/s of JS (0.78 ms per 30 Hz paint) and 4,794 mutation records/s.**
   - `window.js:2899` `paint` writes `textContent`, `classList` and `aria` every paint whether or not they changed
     (`:2914-2922` and the macro rail).
   - `paintAudio` `:2817` and `paintAudioMeter` `:2782` add 237 ms in 30 s.
   - Firefox b − a: loop JS p50 0.82 → 2.64 ms, mutations 1 → 174 per frame. c − c2: +1.9 ms, +182 per frame.
5. **The GPU process is the frame-rate ceiling at 120 Hz: CrGpuMain 89 % busy.**
   - The field sits at the PACE cap (in flight p95 4, 241 held frames).
   - One trace cannot split the GPU main thread between the field's WebGPU frame and the composition of the repainted
     interface.
   - 017 P2b, for reference: headed speed-run, no modulation, GPU main 441 ms/s at 118 fps. Here it is 893 ms/s. That is an
     inference across scenes, not a measurement: the per-tick repaint of marks, knobs and the window over a moving canvas
     roughly doubles it.
   - Headless Firefox says the same, louder: interface hidden, 60 fps; interface visible, 9–12 fps.
6. **Small and real, but not worth a row now:**
   - the capture's read 8 ms/s (0.13 ms per tick; the native FFT 0.1 ms)
   - `syncBases` 4.6 ms/s over 389 targets (`lab/mod-port.js:110`)
   - `refreshOcclusion` 4.2 ms/s (`lab/shell/ink.js:7`, the 300 ms refresh at `lab/rack.js:349`)
   - `livePos`/`applyAll` 3.7 ms/s (`lab/mir/modulation/host.js:270,287`; the walk alone 0.08 ms)
   - GC 3.5 ms/s
   - `setKnob`/`show` themselves 4.9 ms/s (`lab/mod-port.js:106`, `lab/mir/kit.js:433`); their cost is what they wake (3)

**The stress scene (e).** On this tree the 028 recipe gives **54 non-action targets** (028 counted 73), so 59 routes.
- Loop JS p50 39 ms; tick 20.4 ms; apply p95 15.3 ms for 50 writes.
- `field.frame` CPU p95 19.1 ms. Firefox's `field.frame` is ≈ 0.3 ms in every other scene, so it is the routes that change the
  pipeline.
- 4,748 CSS transitions in 30 s.
- The price of one write, the top: `palette.index` **2.76 ms JS / 19.0 ms with the layout it forces** · `material.stage`
  2.0 · `shell.rate.n7` 0.8 · `shell.rate.n6` 0.6 · `material.style` 0.10 / 0.64 · `observer.yaw` / `pitch` 0.46 with layout.

**STAR LOOP (d).** Tick 3.0 ms with 7 writes (camera and observer knobs; CAMERA region 545 records/s).
- A timer `r.fire` ran 3 times at ~27 ms each: the registry's deferred trigger edge (`registry.js:254`) firing an action.
- A timer `save` ran 8 times at ~8 ms during play: `lab/mir/core/session.js:104`, the RESUME autosave that automation writes
  re-arm.

**IDLE COSTS NOTHING — holds.** The idle scene ran 0 loop frames, 0 mutations and 0 observer calls. The only idle work is the
kick-table warm-up inside `requestIdleCallback` deadlines (`lab/shell/controller.js:241-260`, ~4.6 ms a slice, bounded by the
deadline). While playing, that same warm-up re-arms every 750 ms forever (`kickReady()` stays false while the clock plays),
which is 0.1 ms/s and harmless.

**The plan's guesses that the numbers DISMISS**, by name:
- "the tick's allocations (typed arrays)": livePos/applyAll 3.7 ms/s, GC 3.5 ms/s, heap flat.
- "`routeDots` on the hot path": 1 call in 30 s.
- "the audio FFT's bin count / feed cadence": 0.13 ms per tick.
- "the field's uniform upload per param": `field.frame` CPU 0.3 ms p95.
- "the steady timers": all timers < 2 ms/s while playing.
- "017's layout observer stamping" (the kit rack's `refresh`): not in the profile's top 60.
- "the seg-press targets debounced": not in WAVE DANCER; it matters only in e, as row M5.
- "a 30 Hz cadence under load": the tick is 3 ms and most of it is offender 1. The cadence is not the cost.
- "the port writes only knobs on screen": the knob writes themselves are 4.9 ms/s. What they cost is what they wake (offender
  3), which M2 removes for every knob, on screen or not.

**The plan's guesses that the numbers CONFIRM:**
- One DOM write batch per tick, in the sense that the window should write only what changed (M3).
- "The modulation window's paint only while visible": it already is (`!P.open` returns); the cost is the open paint (M3).

## 3 · THE PROPOSED ROWS (merge order = measured gain)

| row | the change, in one sentence | file(s) · side | expected gain (from this measurement) | the proof |
|---|---|---|---|---|
| **M1** | STAGE re-inks only the header λ, the one mark whose colour depends on the ground: `setStageMix` stops calling the full `paintMarks()`, which re-fills every nine-square mark on the page with colours the stage does not change | `lab/windows/settings-card.js:58-62` (+ `lab/look.js` a ground-only paint) · **APP**. If the λ's ink cannot be reached without the kit's `paintMarks`, then a **KIT DOOR** `accent.paintInk()` (1.5.6-alpha.18, the clone road) | Chromium c: **−141 ms/s main-thread JS (−1.3 ms/frame, −2.35 ms/tick)**, ≈ −5,000 attribute records/s and the card repaints they cause. Firefox c tick p50 5.4 → ~3.4 ms | `mod-profile --scenes c` (tick p50; `paintMarks` gone from `--chromium c`'s top) · THE LOCK 843·0 / 987·0 (`mat.bg` is untouched) · `official-defaults-palette` · `stage-text` (the λ's ink against the ground) |
| **M2** | The kit's `setText` writes the existing text node's `data` when the element holds one text node (a characterData record, not childList), so the dock span, control-help and stage-words observers stop waking on every knob value | `lab/mir/core/perf.js:21-24` · **KIT DOOR** (alpha.18/19, FOR-MIR line). Optional companion in the same door: the dock span's observer stops watching subtree childList (`dock.js:172`; membership is a direct-child matter) | **−47 ms/s (−0.45 ms/frame)** and the forced style+layout each frame's `edgeOf` read causes | `mod-profile --scenes c` (obs ms/s; `edgeOf` off the profile) · `hide-reveal` · `window-switching` · `frame-occlusion` · `keyboard-window` (the hints) · `node tests/mir-manifest.test.mjs` + `adopt --check` |
| **M3** | The modulation window writes only what changed: `paint` takes the kit's skip-identical helpers (`setText` / `setAttr` / a class compare) for the work bar, the macro rail and the AUDIO meters | `lab/mir/modulation/window.js:2899-3048, 2782, 2817` · **KIT DOOR** | **−19 ms/s JS** and most of the window's **4,794 records/s**; Firefox b loop JS p50 2.64 → ≈ 1 ms | `mod-profile --scenes b,c` · `routed-knob` · `curves` · `lfo-tension` · `node tools/x-probe.mjs x4` (identical) |
| **M4** | MEASURE FIRST: one more headed trace of scene a (no writes) against c on the same tree, to split the GPU process's 89 % between the field and the interface's repaint, then re-trace c after M1–M3 | none (`--chromium a`, `--chromium c`) · needs **Josh's yes for two more windows on his screen** | decides whether a GPU row exists. If the interface repaint drives it, M1–M3 already cut it; if the field does, the next row is the PACE/governor's, under THE LOCK | the two traces' thread table |
| **M5** | Discrete targets write only on a step: `palette.index`, `material.style` / `view` and `shell.rate.n*` adapters compare the snapped value with the one in force before they act | `lab/shell/modulation.js` adapters · **APP** | stress e: `palette.index` 2.8 ms JS / 19 ms with layout per write, `shell.rate` 0.3–0.8 ms each. Tick 20 ms → (to be measured); the field's 19 ms p95 CPU under e | `mod-profile --scenes e` · `flash-routes` (node) · `routed-knob` · THE LOCK |

Left on purpose:
- the capture's read, `syncBases`, the occlusion refresh, the `applyAll` walk. Together ≈ 21 ms/s; each row would be machinery
  for under 0.1 ms a frame.
- Josh's dial: do not add.
- The governor's step to `autoScale` 0.35 in headless Firefox (a, b, c, c2) is the governor reading a compositor stall as
  field cost (field CPU 0.3 ms, GPU 6.8 ms). Headed Chromium kept 1.0. No row until a headed Firefox shows the same.

Expected, if M1–M3 land as measured: the page's JavaScript on Josh's screen goes from 292 to ≈ 85 ms/s, plus a share of the
324 ms/s of style, layout and paint. "Usable for everyone" depends on that main-thread line. At 760 ms/s busy on this CPU, a
machine three times slower cannot hold 60 Hz; after M1–M3 it is an estimated ≈ 450–500 ms/s. That is an inference; the probe
gives the number after each row.

## 4 · WHAT COULD NOT BE MEASURED, AND WHY

- **Josh's own "002 WAVE DANCER"** is not in the tree (call 1 in PLAN.md). The bundled demo stands in. If his export routes
  STAGE the same way, offender 1 is his.
- **Headed Firefox** (Josh may use Firefox). The brief allows one headed Chromium window only. Headless Firefox's frame is its
  software compositor's (see § 1), so the Firefox frame rates are the instrument's. A 30-s `--scenes c` run with
  `headless: false` would need his yes.
- **The GPU process, split.** One trace; see M4.
- **Two Chromium windows appeared, not one.** The first headed run (about 70 s) recorded fine, but its summary hit a recursion
  limit (`Math.max(...)` over 1 M events) and the trace was not yet saved. The tool now writes the raw trace and profile first.
  The second run is the one reported.
- **The Firefox heap.** Firefox has no `performance.memory`, and chrome-context memory reporting was not attempted. Chromium
  read 31–44 MB, flat.
- **Long tasks.** None in any scene (Firefox 158 and Chromium both supply the observer).
- **The probe's own cost**, as measured:
  - Firefox: `moSelf` 0.02–0.42 ms p50 a frame (1.0 under e).
  - Chromium: ≈ 17 ms/s in total (its MutationObserver's `closest`/`region` 0.35 s, `performance.now` 0.13 s and
    `performance.memory` 0.07 s over 30 s), ≈ 0.16 ms a frame. That is under every offender above, but it is counted in their
    browser's totals.
- **The software-GPU floor** (call 3) was not run. The laptop and iPad rows stay UNVERIFIED.
- **73 vs 54 targets.** The 028 stress counted 73 non-action targets. This tree's `__LW.mod.targets()` filtered the same way
  (not `action.*`, not trigger / toggle) gives 54. The cause was not chased: 028's count may have included lazily registered
  windows' targets.
- **The GPU was shared, but not by work.** Two headless Firefoxes from other sessions (1 day old, not this agent's, untouched)
  sat idle throughout: GPU P8, 0 % between runs.
