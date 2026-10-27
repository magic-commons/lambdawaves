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
3.6 vs 1.2 ms/s (×3 at fewer frames). The headless frame ceiling is the compositor's; GLASS BLUR 0 lifts BASE to 312 frames (P2a).
Files: `P-shots/base.json`, `P-shots/v094.json` (every run, with load and the served build line).
