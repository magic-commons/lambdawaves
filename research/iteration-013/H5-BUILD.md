# H5 THE HIDDEN INTERFACE'S LAG — investigation (stage chain, Opus, 2026-10-20)

Josh: "if I try to hide the UI (H) while Box (setting) is on in Box (spectrum's system), it seems to lag while the
UI is hidden … It returns to a way better FPS while the UI is active."

## Result: NOT REPRODUCED. No code changed in this row.
Repro: SPECTRUM ‹ SYSTEM › → BOX (`well`, `enterBox()` launches the packet and plays), FRAME = box (the default),
then the real H key (`toggleUI`, webdriver key actions), measured 3–4 s per state by `requestAnimationFrame` count,
`__LW.stats.frames`, `__LW.perf.profile` and `__LW.governor`.

| browser (this box) | state | rAF fps | worst frame | main-thread (perf.profile total) | grid · autoScale |
|---|---|---|---|---|---|
| Firefox HEADED, real GPU, 1300×850 | shown | 37.7 / 39.9 | 69–113 ms | 0.2–0.4 ms | 64³ · 0.35 |
| | hidden | **98.1 / 101.4** | 25–60 ms | 0.2–0.5 ms | 64³ · 0.35 |
| Firefox HEADED, real GPU, 1900×1050 | shown (×2, ×2 after) | 34.4 · 37.3 · 34.6 · 35.6 | 49–103 ms | 0.3–0.6 ms | 64³ · 0.35 |
| | hidden (×3) | **95.2 · 98.8 · 97.6** | 27–100 ms | 0.1–0.6 ms | 64³ · 0.35 |
| Firefox headless (software) | shown / hidden / shown / hidden | 26.3 / 30.6 / 30.3 / 29.2 | ~100 ms | < 0.5 ms | 64³ · 0.35 |

Hidden is ~2.7× FASTER on the real GPU, not slower; every hidden frame EVOLVEs as every shown one does (tiers: EVOLVE
only, no REBUILD/RECONSTRUCT churn), the governor stays `nominal` (no rung, no scale change, nothing parked), and the
main thread spends under 1 ms a frame in both states — the shown frame's extra ~17 ms is the compositor drawing the
frosted windows (backdrop blur), which hiding removes. The H-toggle's own bookkeeping (`metersWall = 0;
govVersion = -1` on show) is one-shot and harmless; under `ui-hidden` the window-activity gate stands every reader
down (`lab/mir/window-activity.js`), the occlusion mask is emptied once (`lab/shell/ink.js :16`, lines only), and the
frame-off key in `field.js` `linesUnchanged` is cached (no per-frame line rebuild).

Chromium could not be measured: headless=new + Vulkan reported `field.ok = false` (no WebGPU), and headed snap
Chromium fell to SwiftShader with rAF stalled (0.2 fps) — the box's known limit (`research/release-0.4.0/measure/MEASURE.md`).

## Tests
No source change; `./test.sh node` green at this commit (H4's tree).

## Probes (uncommitted, in the worktree's ignored `.tmp/it013/`)
`h5.mjs` (gatekit, `HEADED=1 W= H= SECS= STEPS=shown,-,H,-` over 9621/5621) and `h5c.mjs` (Chromium CDP + Vulkan).

## CLAUDE.md sentence for Sos
none (no behaviour changed).

## Open questions for Josh
- Which browser, window size and quality settings show the lag (Chrome/Edge? a 4K or HiDPI screen? GOVERNOR or
  AUTO SCALE off? GAS BASIS = AXIAL 256)? On Firefox here hiding is 2.7× faster; a Chromium-only cost cannot be
  measured on this box's Chromium, so the report needs your setup, or a run of `h5.mjs` in that browser.
- "Box (setting)": read as SETTINGS › FRAME = BOX (the default). If you meant AXES = BOX or another BOX, say which.
