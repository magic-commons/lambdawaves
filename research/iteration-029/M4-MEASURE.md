# 029 M4 — THE RE-TRACE ON JOSH'S SCREEN (Claude Yan, 2026-10-31; Josh: "Yes to M4")

Headed Chromium on the RTX 3070, display :0, the 120 Hz panel (8.3 ms budget), `node tools/perf/mod-profile.mjs --chromium c|b --secs 30`
(the same probe and scenes as M0; raw JSON in `.tmp/it029/m4-chromium-{c,b}.json`). Scene c = WAVE DANCER, modulation armed, the window
open, the AUDIO device live on the STAR track's drop; scene b = the same with no audio (nothing is written). BEFORE = M0's trace on
c1aed92f's parent; AFTER = yan-c at f062794b (M1 · M2 · M3 · Q merged). The R builder ran one browser suite during the AFTER runs.

## The numbers (30 s each)
| | BEFORE c | AFTER c | AFTER b |
|---|---|---|---|
| present interval p50 / p95 / p99 (ms) | 9.2 / 16.5 / 20.0 | **8.9 / 14.2 / 18.3** | 8.3 / 9.4 / 11.1 |
| frames over 17.5 ms / over 34 ms | 141 / 7 | 56 / 8 | 15 / 8 |
| fps | 105.6 | 104.1 | 115.9 |
| page JS per frame p50 / p95 (ms) | 3.3 / 5.0 | **0.9 / 2.0** | 0.5 / 1.3 |
| DOM mutation records per frame p50 / p95 | 282 / 467 | **6 / 86** | 0 / 38 |
| main thread busy of 30 s | 22.8 s (75 %) | **16.6 s (55 %)** | 10.3 s (34 %) |
| … scripting | 12.6 s | **7.2 s** | 5.7 s |
| … paint / composite (Layerize 3.3 s both runs) | 5.6 s | 5.7 s | 2.7 s (Layerize 1.2 s) |
| … style / layout | 4.1 s | 3.3 s | 1.4 s |
| GPU process top-level ms | 37.4 s | 38.3 s | 31.5 s |
| dropped frames (trace) | 315 | 460 | 117 |

## What it says
1. **The script half is done.** M1–M3 took 43 % of the main thread's scripting and 98 % of the DOM mutations out of the audio scene; the page's
   JavaScript is now under one millisecond a frame. Josh's p95 moved from 16.5 to 14.2 ms — two frames of a 120 Hz panel instead of two and a bit.
2. **The stutter that is left is not script.** With audio live the main thread still spends 5.7 s of 30 in paint/composite — `Layerize` alone
   3.3 s, ~1 ms a frame, UNCHANGED by the fixes — and the GPU process runs 38 s of top-level work in a 30 s window (more than one thread
   saturated). Scene b, where nothing is written, composites in 2.7 s and drops 117 frames; scene c drops 460. The difference is what a
   changing picture costs the browser each frame: the field re-marched under modulated parameters (GPU), the stage's canvas re-composited
   under the frost glass (every card a backdrop-filter layer: Layerize), the knobs' arcs redrawn.
3. **Where the next pass goes** (M6, THE OPTIMIZATION SYNTHESIS — measured first, on this screen): (a) THE FIELD'S GPU TIME under modulation —
   the governor's `autoScale`, the march steps (`V.fwd.w`), half-resolution + upscale while a parameter moves, the existing FIELD CLOCK cap
   (settings-card.js:131: MAX · 30 Hz · 60 Hz) as the lever a user can already pull; (b) THE COMPOSITOR — FROST (refractive cards with
   backdrop-filter) vs TINTED vs SOLID looks, blur off, the interface hidden (M0's bh scene was the one fast headless scene): the cost of
   each on the real GPU, so a PERFORMANCE setting can be honest; (c) THE 120 HZ PANEL — a 60 Hz present cap halves the GPU load; a steady
   60 may feel smoother than a jittery 104 — measured, not assumed; (d) the audio capture's read (69.8 ms / 30 s, 2048-bin FFT per feed) is
   small and stays.

M4 closes with these numbers; no fix was made in it.
