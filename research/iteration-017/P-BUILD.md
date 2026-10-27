# P-BUILD — CHAIN P, PERFORMANCE (iteration 017, Opus, branch `it017-p`, BASE `bbedac3`)

Machine: CPU quiet (load 0.5–2.5 through the runs, recorded per run in the JSONs); the night run's ONE Firefox renders on the GPU all along,
so every A/B below is INTERLEAVED (A B A B …). One browser of mine at a time. Gate servers 9711 (this tree) and 9712 (`v0.9.4-alpha`).

## P0 THE BASELINE — `tools/perf/main-thread.mjs --runs 1 --secs 20`, ×5 each, interleaved (headless Chromium, RTX, Vulkan)
| tree | ms/s median (spread) | script | layout | recalcStyle | frames / 20 s | ms per frame | load (1-min) |
|---|---|---|---|---|---|---|---|
| BASE `bbedac3` (0.9.9-alpha) | **33.9** (3.0) | 11.5 | 1.70 | 1.92 | **268** (13.4 fps) | 2.54 | 0.48 → 1.99 |
| `v0.9.4-alpha` `84855e0` | **48.3** (1.7) | 18.1 | 0.73 | 0.47 | **456** (22.8 fps) | 2.11 | 0.78 → 1.93 |
Runs (ms/s / frames): BASE 35.6/268 33.9/267 33.6/268 32.5/268 34.3/267 · 0.9.4 47.9/456 48.3/459 46.8/452 48.3/453 48.5/457.
**By the §6 rule BASE is NOT slower in main-thread ms/s** (|Δ| = 14.4 > max(2 × 3.0, 2) = 6.1, and it is BASE that is lower) — but that
is because it draws 41 % fewer frames in this headless compositor: per frame BASE costs 2.54 ms vs 2.11 (+20 %), and style + layout
3.6 vs 1.2 ms/s (×3 at fewer frames). The headless frame ceiling is the compositor's; GLASS BLUR 0 lifts BASE to 312 frames (P2b).
Files: `P-shots/base.json`, `P-shots/v094.json` (every run, with load and the served build line).
**In Josh's browser the answer is the other way round.** Headed Firefox (WebRender, RTX), default look, playing, rAF over 3 × 4 s per page,
pages interleaved BASE / 0.9.4 × 3 (`/tmp` one-off on the gatekit road): BASE **116.8 fps** median (104.8–120), p95 frame **11 ms** ·
0.9.4 **80.5 fps** (78.5–91), p95 **22 ms**; load 1.1–1.6. BASE is the smoother tree; there is no regression to chase against 0.9.4.

## P1 THE SPEED-RUN TRACE — `tools/perf/speedrun-trace.mjs` (new), headed snap Chromium 156, Vulkan/ANGLE, RTX 3070, 1600 × 1000
Scene, 21.5 s, real CDP input: Picker open/close · SPECTRUM fold, WAVE raise/fold, STATE raise, SPECTRUM unfold · right rack wheeled
top → bottom → top · a WAVE dial dragged 2 s (ISO is greyed in the boot style, so EXPOSURE) · TIMELINE open/close · Picker → WATER →
Picker → hydrogen 1s. 118 fps throughout (2545 frames); load 1.7 → 1.4. Trace 131 MB (not kept); summary `P-shots/p1-trace-summary.json`.
Threads (busy ms/s, tracing + profiler on): renderer main 242 · **GPU main 441** · viz compositor 229 · cc compositor 160.
| # | top self-time, renderer main (21.5 s) | ms | | ours by function (cpuprofile self / inclusive) | ms |
|---|---|---|---|---|---|
| 1 | FunctionCall `loop` lab/rack.js:337 (incl. its WebGPU calls) | 1032 | | `loop` rack.js:337 self | 93 |
| 2 | Commit | 464 | | `getBoundingClientRect` ← ink.js:7 · occlusion.js:13 · mir/shell/rack.js:244 | 77 |
| 3 | Receive mojo message | 306 | | `get` shell/modulation.js:112 (the SHELL RATE getter) ← `syncBases` mod-port.js:97 | 60 |
| 4 | PrePaint | 246 | | `syncBases` mod-port.js:97 **inclusive** (11 % of all JS) | 140 |
| 5 | UpdateLayoutTree | 221 | | `refreshOcclusion` shell/ink.js:7 inclusive | 86 |
| 6 | Layerize | 208 | | `publish` mir/window/dock.js:155 inclusive | 45 |
| 7 | microtask checkpoint | 204 | | `fit`/`contentBottom` shell/rack-wiring.js:61-62 | 38 |
| 8 | IntersectionObserver computeIntersections | 151 | | the kit rack's `refresh` mir/shell/rack.js:241 (F6's stamp) | 37 |
Longest tasks > 50 ms: ONE in the run — 194.7 ms "Receive mojo message" before the first step (boot settling, not the scene). Inside
the scene no task on ANY thread exceeds 30 ms. rAF gaps > 25 ms: 3 — scroll 120 ms + 70 ms, WATER 147 ms — and in each gap no thread
of ours runs a task over 0.3 ms (the GPU is shared with the night run's Firefox; CDP's synthetic wheel). Long animation frames > 50 ms
in the scene: 4 ± 2 per run, every one with blockingDuration 0 and render ≤ 3 ms — not script. Reading: on this machine Chromium runs
Josh's speed-run at the display's 120 Hz with ~2 ms of main thread a frame; the busiest place is the GPU process, not our JS.

## P2 THE FIXES (A = BASE served from a read-only `/tmp/lw-base` on 9713, B = this tree on 9711, interleaved)
**P2a THE MODULATION BASES** (`5b74c56`, lab/rack.js · lab/shell/modulation.js). `modSyncBases()` read every target's getter on EVERY
frame (120 Hz here) though the modulation reads the bases only on its 60 Hz tick: it now runs inside the `MOD.step` tick, before the
advance. The SHELL RATE getter built a `populated()` array (140 states) per read, 7 reads a call: it now walks its shell's own indices
(21 000 random registers: identical answers). Headed speed-run, 4 + 4 runs: script **56.9 → 52.1 ms/s** (A 55.2–57.7, B 50.8–53.3: every
B below every A; |Δ| 4.8 vs the §6 bar max(2 × 2.5, 2) = 5.0 — just inside it by the letter), the getter (60 ms a scene) leaves the top 12;
main thread 244.8 → 238.4 ms/s, fps 117.9 = 117.9. At 60 Hz the cadence half changes nothing; the getter half still does.
**P2b THE BLUR — measured, LEFT** (no commit). Headed Chromium, speed-run, 3 + 3 each, interleaved: GLASS BLUR 22 → 0: GPU main
440.9 → 362.5 ms/s, viz compositor 228.5 → 114.2 ms/s, renderer main 242.3 → 237.9 (noise), fps 118.2 / 118.0. 22 → 12: GPU main
444.2 → 433.3 (noise, spread 16), viz 233.6 → 205.8 (−12 %), main and fps unchanged. Headed Firefox, one page, 22/12/0 interleaved × 6:
fps medians 113.5 / 114.9 / 117.9 with spreads ≈ 20, p95 11.5 / 10.5 / 9 ms — inside the noise. The cost is a backdrop being there at all,
not its radius: 12 px buys 12 % of the compositor and nothing visible in Firefox, so the 22 px first-run default stands and the knob stays.
Headless (P0's unit) BLUR 0 lifts BASE from 268 to 312 frames / 20 s (3 + 3) — the only place the blur shows as frames.
**P2c THE POP-OUT MARKS THE MASK** (`d46bbf6`, lab/shell/rack-wiring.js): `popOut` / `dockWindow` call `occlusion.dirty()` at the
placement, so a paused mask no longer waits on HISTORY's intersection flip (R4's note). Correctness, not speed; frame-occlusion green.
Not costs (leave): the kit rack's layout stamp (mir/shell/rack.js:241) — 37 ms a scene during folds and scroll, nothing at rest (a 3 s
probe of steady play: no class or size change in either rack); the stage words' tick (mir/info/bodies.js:150) 26 ms a scene; the ESP
bar's 500 ms seat runs only under ESP and stops when hidden; `routeDots` is R3's; `occlusion` on scroll is inside refreshOcclusion's 86 ms.
Next (unbuilt): `refreshOcclusion`'s 300 ms safety refresh while playing (rack.js:344) is most of its ~4 ms/s; GPU main (441 ms/s) is the
field's WebGPU frame — THE LOCK's ground, not P's. LOCK: `lab/field.js`, `render-exact.js`, shaders untouched — no leaf moved.
Tests: node frame-coalescer · frame-settle · perf (7/7) · rack-deps PASS; `rack-deps --classes` HINGE HOLDS (spectrum 25); new-project
in step; browser frame-occlusion · window-switching · render-regressions · routed-knob GREEN; `lab/sw.js` via `pwa.test.mjs --write`.
CLAUDE.md sentence to add: "THE MODULATION BASES (017 P2): `modSyncBases()` runs on the modulation tick (`MOD.step`), not every frame;
`tools/perf/speedrun-trace.mjs` is the speed-run instrument (headed Chromium, Vulkan, Josh's 20 s hands). GLASS BLUR costs by being
there, not by its radius (Chromium viz −50 % at 0, −12 % at 12 px; Firefox inside the noise) — the 22 px default stands."
