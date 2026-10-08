# λWAVES 0.5.0 · MEASURE: the numbers behind the gates

**Started 2026-10-08.** The 0.4.0 numbers (limits, the benzene re-time, the 300-AO dispatch, the M5 persist law, the S4c kernel) stay in
`../../release-0.4.0/measure/MEASURE.md` §1–§5; this file holds 0.5.0's. The plan's gates that read it: `PLAN.md` §2 A-M (the floor and
the pre-C baseline), C-V (`|Δ median| <= max(2 x spread, 2 ms/s)`), C7 (the one lock). Host unless a section says otherwise: RTX 3070
(NVIDIA driver, Vulkan 1.4.329), AMD Ryzen 5 5600G (12 threads), Linux 7.0.0-34, node v22. Every number carries its tag — MEASURED,
DERIVED, UNVERIFIED — and the load average beside it.

**Sections.** §1 A-M the main-thread ms/s instrument, its floor on `02dce23` (moved here from 0.4.0's §6, text unchanged but for the
heading and the two notes marked 2026-10-08 below). §2 the pre-C baseline (to be taken after A1+A8 and A7 merge). §3 the C-V A/B
pairs, one row per C seam. §4 the C7 lock.

---

## §1 · A-M — THE MAIN-THREAD MS/S (`tools/perf/main-thread.mjs`, `cdp.mjs` `metrics()`)

**COMPLETE: 5 of 5 floor runs done** (a builder pause came after them). Measured 2026-10-08, tree `02dce23` (the `sos-s0` tip), RTX 3070,
Chromium 153 (playwright `chromium-1243`) headless on Vulkan, node v22.

**Method [MEASURED].** Per run a fresh browser profile and page: open `/lab/?sw=0&warn=0` on the gate server, wait for `__LW.ready`,
`__LW.pause()` + `settle()` + 400 ms (the device report's `start()`), `__LW.play()`, then CDP `Performance.getMetrics` at t = 0 and
t = 30 s. **main-thread ms/s = ΔTaskDuration × 1000 / 30**; Script / Layout / RecalcStyle deltas are attribution. No rAF callback is put on
the page (the device report's `play()` does), so the instrument adds no main-thread work. The scene is the device report's long play
(as found, UI shown, 1600 x 1000), NOT its 1 s bin harness. One browser at a time; load average read from `/proc/loadavg` at the start and
end of each 30 s window; the machine was shared with sibling builders.

| run | ms/s (Task) | Script | Layout | RecalcStyle | frames / 30 s | presents | load avg (1 min) start → end |
|---|---|---|---|---|---|---|---|
| 1 | 13.890 | 4.247 | 0.567 | 0.218 | 589 | 0 | 2.25 → 1.77 |
| 2 | 13.879 | 4.299 | 0.590 | 0.200 | 600 | 0 | 1.86 → 1.86 |
| 3 | 14.037 | 4.488 | 0.575 | 0.205 | 581 | 0 | 1.86 → 2.17 |
| 4 | 13.501 | 4.148 | 0.575 | 0.192 | 572 | 0 | 2.24 → 1.84 |
| 5 | 13.607 | 4.250 | 0.570 | 0.155 | 592 | 0 | 1.84 → 1.50 |

**The floor [DERIVED from the 5 above].** median **13.879 ms/s**; spread (max − min) **0.536 ms/s**; MAD **0.158 ms/s**. All five at load
< 4 (1.5 – 2.25). C-V's gate `|Δ median| <= max(2 x spread, 2 ms/s)` is therefore `max(1.07, 2) = 2 ms/s` on this machine today: the floor is
smaller than the 2 ms/s minimum, so the minimum governs. A 5 s smoke run read 18.5 ms/s (warm-up and shader compile inside a short
window), so the window must stay 30 s.

**Not established [UNVERIFIED].** `__LW.stats.presents` stayed 0 in all five windows while `frames` advanced (~19-20 per s): this
headless run's figures are the main-thread cost of the app's loop with no field present counted. I did not check whether `__LW.field.ok`
was true (WebGPU on the 3070 vs. a fallback) before the pause; do that first when re-using the number as a GPU-play figure. The floor
is still a valid same-tree spread of this exact method, which is what the gate needs. Second-order: one tree, one day, load 1.5-2.3.

**2026-10-08, the integrator, after the five runs above — the UNVERIFIED line resolved [MEASURED].** `__LW.field.ok` was FALSE in those
runs. A fresh headless Chromium (playwright 1243, the S4c flags) loses its WebGPU device on the page's FIRST navigation — `__LW.field.error`
reads `device lost: A valid external Instance reference no longer exists` or `no WebGPU adapter` from `lab/gpu-boot.js`'s early request —
and every later navigation in the same browser boots the field: 0 of 4 cold launches had a field, 2 of 2 reloads did (probe scripts in the
job's tmp, not committed; the adapter itself answers at once from the page, `requestAdapter({ powerPreference: 'high-performance' })` 34 ms,
RTX 3070). So the five rows above are the loop's main-thread cost WITHOUT a picture (presents 0), and A0's pass 1 — which had presents
flowing — was measured on a different footing. `tools/perf/main-thread.mjs` now warms the browser with one navigation, measures on the
second, and refuses to measure unless `__LW.field.ok` is true (`--allow-no-field` keeps the old figure on purpose); each run's record
carries `field` (ok, error, adapter).

**The floor WITH the field present [MEASURED]** — tree `83f8bb1`, same recipe, served by the integrator's test server on 8721, five runs, one
browser at a time, no sibling builder running (load 1.1–1.8); raw in `main-thread-floor-field.json` beside this file:

| run | ms/s (Task) | Script | Layout | RecalcStyle | frames / 30 s | presents | field | load avg (1 min) start → end |
|---|---|---|---|---|---|---|---|---|
| 1 | 20.493 | 7.669 | 0.556 | 0.232 | 323 | 323 | ok · RTX 3070 | 1.14 → 1.44 |
| 2 | 20.061 | 7.820 | 0.560 | 0.228 | 315 | 315 | ok · RTX 3070 | 1.40 → 1.30 |
| 3 | 19.606 | 7.661 | 0.561 | 0.245 | 323 | 323 | ok · RTX 3070 | 1.30 → 1.31 |
| 4 | 19.729 | 7.558 | 0.567 | 0.212 | 328 | 328 | ok · RTX 3070 | 1.69 → 1.76 |
| 5 | 19.513 | 7.624 | 0.532 | 0.213 | 327 | 327 | ok · RTX 3070 | 1.76 → 1.72 |

**The floor [DERIVED from the 5 above]:** median **19.729 ms/s**; spread (max − min) **0.980 ms/s**; MAD **0.216 ms/s**; held frames 0 in
all five. C-V's gate `|Δ median| <= max(2 x spread, 2 ms/s)` = `max(1.96, 2)` = **2 ms/s** still. The picture costs the main thread
≈ 5.85 ms/s over the no-field figure (19.729 − 13.879), almost all of it Script (7.6 vs 4.3 ms/s): the present path's JS, not layout or
style. ~10.8 presents / s in this headless run is the GPU-bound rate of the 1600 × 1000 headless canvas, not a held-frame count. **Every
later A/B (the pre-C baseline, the C-V pairs) uses this patched tool, so its numbers compare with THIS row, never with the five above.**

**The pre-C baseline is this tool re-run on the tree after stage A closes [PLAN, not yet taken].** The 13.879 ms/s above is the floor on
`02dce23`, not that baseline.

Recipe: `python3 tools/gate/server.py "$PWD" 8775 &` then `LW_PORT=8775 node tools/perf/main-thread.mjs --runs 5 --json out.json`;
an A/B is two trees on two ports, interleaved A B A B A B (header of the tool).

---

## §2 · the pre-C baseline — NOT YET TAKEN

Taken with `tools/perf/main-thread.mjs --runs 5` on the `sos-s0` tree after A1+A8 and A7 merge (stage A closed), same recipe as §1.

## §3 · the C-V pairs — none yet

## §4 · the C7 lock — not yet
