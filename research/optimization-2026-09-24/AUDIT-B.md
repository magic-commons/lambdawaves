# AUDIT B · Frame loop, scheduling, idle, per-frame cost · 2026-09-24 · Opus 5.5

## 1. What I read, what I measured

**Read whole:** BRIEF.md; `lab/rack.js` 1–1520 (settings, governor, reader law, workers, backgrounded tab, router,
`loop()`, camera law, meters/status), 2560–2740 (the modulation adapters), 2900–3240 (fieldOn/hydroReader, transport,
badges), 3380–3700 (launchPacket/enterBox, refreshOcclusion and its observers), 5040–5075 (toggleUI), 5700–6080 (LW,
the go); `frame-budget.js`, `frame-coalescer.js`, `frame-settle.js`, `clock.js`, `mir/window-activity.js`, `state.js`,
`spectrum.js`, `shadowview.js`, `meters.js`, `keplerview.js`, `vortex.js`, `gas.js`, `registerview.js`,
`mir/modulation/registry.js`, `mir/modulation/host.js` 195–501 (clock, applyAll, advanceTo), `mir/plane-model.js`,
`modwindow.js` paint()/sync()/rebuild (2599–2830) and its API (3040–3084), `mir/kit.js` knob/readout/cssRGB/themeInk/
hideGraphTip, `field.js` packModes/encodeCompute/frame/resize; the hot paths of `orbit.js`, `particles.js`,
`fieldview.js`, `molecular-session.js`, `chemview.js` (pump). History: CLAUDE-CODE-HANDOFF.md (both 2026-09-09 passes),
REPORT.md "2026-09-11 · Second optimisation pass", the law of the two clocks (REPORT.md:2254–2258), wave 48's
"median of the loop's OWN main-thread ms" (REPORT.md:1514).

**Probes** (`research/optimization-2026-09-24/probes/B/`, GD_PORT 5232, `privacy.reduceTimerPrecision: false`):
- `frame-inventory.mjs` → `.json/.log`: a post-boot shim. Every rAF callback named `loop` is one bracketed frame;
  getBoundingClientRect / getComputedStyle / getPropertyValue / clientWidth·Height / offsetWidth·Height counted and
  timed; textContent, className, setAttribute, classList, style.setProperty, hidden counted; ~60 frame-path methods
  reachable through `__LW` wrapped for calls and ms. 11 playing scenes (default, UI hidden, FULL, every window, the
  modulation window, the lead's 128³ axial-gas scene step for step), 4 idle scenes, micro-timings. Governor OFF, as in
  the lead's bench.
- `electron-gas.mjs` → `.json`: the same shim in **Electron 44 / Chromium 152 on the real RTX desktop**, replaying the
  lead's last three bench scenes (every window → hidden → 128³ axial gas) plus two controls.
- `ring-check.mjs` → `.json`: what `__LW.perf.median` actually holds, frame by frame.
- `hitches.mjs` → `.json`: the link retry, the reader-law re-probe, the 250 ms flash, the modulation pump, SPIN z.
- `readers91.mjs` → `.json`: the readers on 91 labels; a forced style/layout read after one body style write.
- `gas-bench.mjs`, `gas-stats-factor.mjs` → `.json` (node): gas reconstruct allocation vs reuse; gas.stats factored.
- `shim-bisect*.mjs`: debugging helpers (one of them produced FB7's evidence by accident).

**The per-frame inventory** (whole-loop ms = the rAF callback, not `perf.ring`; counts are per frame):

| scene (3–4 s playing) | frames | loop ms median / p90 / max | gBCR · gCS · geom · text · attr · class · style |
|---|---|---|---|
| FF default 8 windows, 96³, UI shown | 42 | 0.84 / 1.98 / 4.16 | 3.9 · 4.1 · 0.8 · 5.6 · 3.7 · 3.2 · 1.9 |
| FF same, **UI hidden** | 179 | 0.54 / 0.76 / 3.54 | 1.0 · 1.0 · 0.07 · 0.8 · 0.8 · 0.6 · 0.3 |
| FF default, perf FULL | 41 | 1.50 / 2.30 / 3.78 | 4.4 · 6.2 · 2.3 · 7.5 · 5.2 · 4.8 · 3.5 |
| FF every window (27) | 40 | 1.28 / 45.7 / 53.2 | 12.6 · 13.3 · 2.8 · 15.2 · 4.2 · 3.4 · 2.3 |
| FF every window, hidden | 172 | 0.52 / 0.76 / 5.36 | 3.3 · 3.2 · 0.07 · 0.9 · 0.8 · 0.7 · 0.4 |
| FF + modulation window open | 25 | 2.78 / 47.8 / 72.0 | 24.5 · 24.3 · 2.2 · 20.2 · 11.9 · 13.2 · 7.8 |
| FF 128³ axial gas, shown | 17 | 1.68 / 2.84 / 13.2 | 9.5 · 9.6 · 1.5 · 12.8 · 10.7 · 9.1 · 4.9 |
| FF 128³ axial gas, hidden | 25 | 0.84 / 1.92 / 2.72 | — |
| Chromium every window (27) | 309 | 0.4 / 1.6 / 69 | 1.8 · 3.1 · 3.1 · 13.0 · 1.7 · 1.4 · 1.3 |
| Chromium every window, hidden | 359 | 0.2 / 0.3 / 1.5 | 1.6 · 1.5 · 0.03 · 0.4 · 0.4 · 0.3 · 0.2 |
| Chromium 128³ gas, shown / hidden | 55 / 56 | 0.6 / 1.1 / 16.9 · 0.4 / 0.7 / 2.4 | — |
| Chromium 128³ gas, perf FULL | 54 | 0.8 / **10.3** / 11.4 | — |

(The 45–72 ms frames with every window open are WIGNER at its own 2 Hz — governor off; see FB4 for governor on.)

**What runs, how often** (default state, '120' mode). **Every frame:** `field.resize`, `field.setStepCap`, `field.frame`
(0.15–0.27 ms JS), `modesAt` → `reg.at` once (the CPU readers reuse it; the 2026-09-09 cache holds), `canPresent`
×12–25 (1–9 µs each = 0.03–0.14 ms), vortex/particles/kepler `suspend` + `kepler.bowFrame` + `fieldlines.update(…,
false)` (guarded, ≤ 9 µs each), six `setActive`s, `molSession.tick`, `frostSync`, two guarded dataset compares,
autoQ/frameBudget, `transport.update` (guarded; text at 5 Hz). **Every 4th frame:** spectrum (0.23–0.32 ms) + shadow
(0.43–0.63 ms) + any other visible reader — all on the SAME frame (FB8); `gas.stats` on every 6th of those (FB1).
**≤ 10 Hz:** meters + badges + governor line (METERS open only; 7.5 Hz on a 60 Hz display). **Every 300 ms:**
`refreshOcclusion` (18 gBCR + 17 gCS with 8 windows, 56/55 with 27, 68/66 with the modulation window; 0.05–0.40 ms).
**Every 1 s while playing:** a forced repaint of the closed modulation window (FB3). **Every 2 s, even paused:** a no-op
warm timer (FB9). **UI hidden** leaves field.frame + bookkeeping (0.2 ms Chromium, 0.5 ms FF) plus FB3 and FB5: the
loop's JS is not what stands between Josh and "blazingly fast" on this desktop — the kernel and the compositor are (A/C).

## 2. Findings, ranked

**FB1 · The "~10 ms reader" is `gas.stats`: 8.3–17.3 ms per call on the frame thread, invisible to the profile and the
reader law, every 6th CPU tick while the axial gas plays and SPECTRUM is visible.**
WHERE: rack.js:1338; gas.js:84–96.
MECHANISM: ψ on a 100×80 grid, each point summing all 256 modes with `v = Rt[m][i]·Pt[l][j]`: 2.05 M mul-adds plus the
products per call. It sits in the cpuTick block but outside `tick()`, so `perf.profile`, `perf.work`, `may()` and the
governor never see it. '120' at 60 Hz: one frame in 24 (2.5 Hz); FULL: one in 6 (10 Hz, 16 % of frames +9–17 ms).
EVIDENCE: FF 8.94 / 8.32 ms per call (scenes H/J), 11.98 avg and 16.18 max at 64³ FULL (scene K, p90 12.3 ms);
Chromium 9.2–17.3 ms (electron-gas: every > 5 ms frame in five gas scenes is a gas.stats frame); node 8.8–9.2 ms.
CHANGE: factor the mode sum by l, per radial row: `A_l(i) = Σ_nr c_{l,nr}·R_{l,nr}(i)` (16 accumulators, skip
`Rt[m][i] === 0`), then `ψ(i,j) = Σ_l P_l(j)·A_l(i)`; the n / z / z² / r accumulation is unchanged; `at()` into scratch.
NEUTRALITY: same quadrature, same terms, reassociated: relative difference ≤ 3e-15 on norm, ⟨z⟩, σ_z over 9 times
(gas-stats-factor.json). The printed readout (`toFixed(2)`) is identical except the sign of a rounding-noise zero at an
exactly symmetric instant (⟨z⟩ = 3.5e-18 prints `0.00`; the factored −3.1e-17 prints `-0.00`) — both are noise.
tests/gas.test.mjs tolerances (0.05 / 0.1 a₀) are untouched; add a node pin: factored vs the old loop (kept in the test
as the oracle) ≤ 1e-12 relative at 8 times. If bitwise identity is demanded: run the unchanged `stats()` in the scan
worker instead (bit-identical, async readout, M effort).
GAIN: 9 ms → 0.35 ms per call (26×); removes the only periodic > 5 ms frame of the box scene Josh named. RISK: low.
EFFORT: S.

**FB2 · `LW.perf.median` reports the LAST frame, not the median of 60 — every "loop median" in the baselines is a
single-frame sample; the lead's 10.9 ms was one gas.stats frame.**
WHERE: rack.js:1213 (zeroes slot `f`), 1245 (`f++`), 1363 (writes slot `f+1`); the getter in LW.perf (rack.js:5708).
MECHANISM: frame k zeroes slot k and writes slot k+1; frame k+1 zeroes slot k+1 first. One nonzero entry survives and
the getter's `filter(v > 0)` returns it. Born with wave 48's measure (REPORT.md:1514), so wave 48's shown/hidden numbers
and BRIEF §7/§8's loop column are last-frame reads.
EVIDENCE: ring-check.json — read after every frame, `perf.median` tracks that frame's own cost (11.74 → 11.4, 9.64 →
8.66, 8.76 → 8.64 on gas.stats frames; 1.06 / 0.56 / 0.54 on the next frame). electron-gas: the FULL gas scene ends
with `perf.median` 10.8 while the frame median is 0.8 (p90 10.3 = one frame in six). Our replay of the lead's exact
scene: frame median 0.6, p90 1.1, two gas.stats frames (16.9, 11.3 ms) in 55 — the bench's 10.9 is a ~1-in-24 draw.
CHANGE: `const slot = perf.counts.frames % 60;` at 1213 and `perf.ring[slot] = spent` at 1363. Separately add a
whole-loop ring (`t0` at the top of `loop`) as `LW.perf.loopMedian`: `tFrame0` (rack.js:1195) excludes refreshOcclusion,
the modulation pump, `clock.advance` and `modesAt` (the gas reconstruct's CPU half, 0.10–0.15 ms).
NEUTRALITY: diagnostics only — no pixel, physics number or saved byte; `perf.profile.total` (METERS' EMA) untouched.
Check: ring-check after the fix reads the median of the last 60, not the last frame.
GAIN: a correct measuring stick for every later decision; re-run the §7/§8 loop columns. RISK: nil (the legacy boot
test only records the value). EFFORT: S.

**FB3 · The transport↔modulation LINK retry repaints the whole closed modulation window once a second while playing
in the default rack — also with the UI hidden.**
WHERE: rack.js:1159–1166 (`if (modView) modView.sync()` runs after a refused play too); modwindow.js:2792 `sync()` →
`paint(true)`.
MECHANISM: the shipped rack is an LFO + an ENV with no route; with the window closed the host refuses play
("nothing-to-run", host.js:347–353, returning before it touches `playing`), the loop sets `linkFollowed = null`, retries
in 1 s, and every attempt calls `sync()`: all device checks, every knob and a forced paint — ≈50 textContent,
≈45 setAttribute, ≈38 classList, ≈20 style.setProperty and 6 clientWidth/Height reads into a `display:none` window.
EVIDENCE: hitches.json: 5 forced paints in 5 s of playing, 0.73 ms each (FF); the worst default frame (4.16 ms, 56 text
writes, 6 geometry reads) and the 50-text-write frames with the UI hidden are these; Chromium shows the same 1 Hz burst.
CHANGE: `if (r && r.ok === false) { linkFollowed = null; linkRetryAt = nowMs + 1000; } else if (modView) modView.sync();`
NEUTRALITY: a refused attempt changes neither model nor registry and `sync()` is an idempotent repaint from them →
identical DOM (the env-compact timeScale write inside paint is a no-op when nothing moved). The retry — REPORT.md:2257's
"a source routed later joins within a second" — stays. Check: `LW.mod.view.performance().paints` delta 0 over 5 s of
playing with a closed, unrouted rack; the modulation browser suites.
GAIN: ~0.7 ms and ~150 DOM mutations per second of playing (FF), plus the restyle they force on the next layout read.
RISK: very low. EFFORT: S.

**FB4 · A parked reader's re-probe is a periodic stutter: every 3 s it runs once at its full cost.**
WHERE: rack.js:532 (the probe), READER_LAW.probeMs = 3000 (rack.js:441).
MECHANISM: wave 50 lets a parked reader through once per 3 s to re-measure it. Its CPU share is small (the comment's
"< 1 % of the wall"); its frame is not — the probe frame carries the reader's whole cost.
EVIDENCE: hitches.json: WIGNER visible, governor ON, 10 s of sim-ladder: the only long frames are at 3.42 / 6.42 /
9.58 s — 82 / 90 / 120 ms (one more at 92). WIGNER's measured work: 91 ms. Chromium (governor off): 57–72 ms frames.
CHANGE (policy — Josh/lead): back off probes of readers whose last cost exceeded 2× the park line (3 → 6 → 12 → 24 s,
reset by a `reg.version` change, a governor notch or pause), or probe only after a state edit.
NEUTRALITY: not cadence-neutral — a parked readout re-measures less often while playing; paused behaviour, the park
decision and every number shown are unchanged. Flag, don't ship silently.
GAIN: removes an 80–120 ms frame every 3 s whenever a heavy reader is parked (WIGNER; SLICE on 91 labels, wave 45).
EFFORT: S.

**FB5 · `refreshOcclusion` keeps its layout burst running while the UI is hidden, where it cannot change a pixel.**
WHERE: rack.js:1109, 3633–3662.
MECHANISM: `toggleUI` sets `mat.frame = mat.axis = false` (rack.js:5050), and under `body.ui-hidden` every element the
burst measures is `display:none` (lab.css:462–463, 525, 962) except `#keysheet`, so every other `rect()` is null. Still,
every 300 ms: one gBCR + one gCS per rack card (18 → 56) and per float/sheet.
EVIDENCE: occlusion frames vs the rest, hidden: FF 1.02 vs 0.52 ms (8 windows), 1.52 vs 0.50 (27 windows; worst
4.3–5.4 ms); Chromium 0.5 vs 0.2 ms.
CHANGE: while `uiHidden`, measure `#keysheet` only (`out = [rect(keysheet)]` — exactly what the full burst returns in
that state); the body-class observer (rack.js:3670) already marks the burst dirty on the way back.
NEUTRALITY: identical rectangle list by construction → identical `setOcclusion` input → identical pixels. Check:
`linePixels`/`readPixels` over a hide → show round trip; the ink-under-glass browser check.
GAIN: 0.5–1 ms (8 windows) to 1–4 ms (27) every 300 ms with the UI hidden. RISK: low. EFFORT: S.

**FB6 · The axial gas rebuilds its 256 kernel records on every reconstruct (L2 confirmed, sized).**
WHERE: gas.js:72–83 (`at` + `fieldModes`); rack.js:988.
MECHANISM: per live mode a record, a table, a 6-array literal and two `Float64Array(6)`, plus two `Float64Array(256)` and
the result object from `at()` → ≈1 290 allocations, ≈120 KB per reconstruct (object-shape estimate): 1.7 MB/s at the
128³ box's 14 fps, ≈7 MB/s at 64³ and 60 fps. The tables depend only on (mode, A).
EVIDENCE: fieldModes 0.10–0.15 ms per call in FF and Chromium; node 42 µs shipped vs 8 µs reused (gas-bench.json).
CHANGE: build the 256 tables + records in `build()` (they carry A, so `setRadius` rebuilds them); `fieldModes(t)` writes
`re`/`im` with the exact expressions `at()` uses into the reused records and a reused list; public `at()` unchanged.
NEUTRALITY: packed kernel bytes identical (gas-bench.json `packedBytesIdentical: true`); same 1e-7 filter; the same
read-only-records contract the hydrogen path has had since wave 45 (rack.js:982–994). Tests: gas.test.mjs THE RECORDS,
render-exact.test.mjs (modesAt stays a pure function of t). RISK: a consumer holding records across frames would see
them move — none does (field.frame packs at once; render-exact asks per frame). GAIN: ~0.1 ms/frame and the GC pressure
of the heaviest scene. EFFORT: S.

**FB7 · One exception anywhere on the frame path kills the loop for the session (`inLoop` is never reset).**
WHERE: rack.js:1108 (`inLoop = true`) … 1352 (`inLoop = false`), no try/finally; `schedule()` needs `!inLoop` (958).
EVIDENCE: shim-bisect2: a single TypeError inside `shadow.update` froze the instrument — `stats.frames` stuck, no rAF
ever requested again, nothing surfaced in `window.__e`. CHANGE: `try { … } finally { inLoop = false; … }` plus a catch
that records the error once (lane F owns the policy). NEUTRALITY: normal frames identical. EFFORT: S.

**FB8 · Every CPU reader lands on the same frame of four (cpuTick bunching).**
WHERE: rack.js:1246–1340. EVIDENCE: FF default p90/median 1.98/0.84; FULL (readers every frame) median 1.50 — '120'
moves the same work into one frame in four; with every window open that frame carries calculus 0.5 + shadow 0.49 +
slice 0.37 + spectrum 0.23 ms + the rest. CHANGE (cadence choice): phase-stagger — reader i runs when
`(frames + phase_i) % cpuEvery === 0` (spectrum/shadow 0; orbit/dynamics 1; slice/qcd/atoms 2; wigner/radiation/
calculus/meters 3). NEUTRALITY: paused → every frame, identical; playing → each window keeps its rate, offset ≤ 3
frames (the '120' law already lags the field by up to 3). Not bitwise-neutral for a mid-play screenshot of two windows —
flag. GAIN: the worst reader frame ÷ 2–4 (the phone and iPad, not this desktop). EFFORT: M.

**FB9 · Idle is zero FRAMES (proved) — but a no-op warm timer re-arms every 2 s forever.**
WHERE: rack.js:828–845. EVIDENCE: four 5-s idle scenes (modulation window closed; open; the real pointer resting on a
knob; synthetic pointermove at 20 Hz): 0 loop frames and 0 rAF requests in every one; 3 setTimeout + 2
requestIdleCallback per 5 s = the `warmArm(2000)` chain after `kickReady()` and `workerWarmStarted`, where `warmKick`
does nothing but re-arm. CHANGE: stop re-arming once `kickReady() && (workerWarmStarted || !maths.ok)`. NEUTRALITY:
every later tick is a no-op by its own conditions; the resume's `warmArm(60)` ends the same way. GAIN: idle becomes
literally zero. EFFORT: S.

**FB10 · Forced style/layout reads inside the CPU readers (a sized lead).**
WHERE: shadowview.js:18–23, 41 (`size()` clientWidth/Height + `themeInk` = 2 × getComputedStyle(body) per update);
orbit.js:79–84, 138 (the same); spectrum.js:222–231 (per version). EVIDENCE: readers91.json: a getComputedStyle read
costs 2 µs on a clean style and **2.59 ms** after one body custom-property write; `canvas.clientWidth` 2.43 ms after the
same write (FF headless). Body-level writes do happen at 10 Hz under a modulated HUE (`hueAccent` → `applyAccent`
writes --acc/--acc2/--acc-glow/--acc-ink on `body`). CHANGE: cache `themeInk` per `body.dataset.theme` (the only
selector that sets --fg/--dim: mir/css/skin.css:30, 201) and the canvas CSS size from a ResizeObserver, as field.js
does for the stage (field.js:1458). NEUTRALITY: same ink (theme is its only input); the size needs care on the frame a
fold opens (RO fires after layout) — keep the W < 32 guard and read once on the first frame after a resize.
GAIN: 1–2 fewer forced flushes per cpuTick; the restyle still happens once, in the rendering step. Unmeasured on the
phone — lead. EFFORT: S–M.

**FB11 · The 250 ms "thread was blocked" flash misfires at GPU-bound cadences (lead).**
WHERE: rack.js:1211. EVIDENCE: 128³ axial gas, headless FF: gap median 504 ms, 7 of 9 gaps > 250 → the busy mark is up
on 8 of 10 frames, 13 timers in 4 s (hitches.json). On a phone at 128³ gas it would never come down, and the gap there
is the GPU, not unwrapped main-thread work. CHANGE: open question — fire only when the previous frame's own
main-thread cost explains the gap (e.g. `spent > gap / 2`) or no frame was presented. Behaviour change → Josh/lead.

**FB12 · Allocation per frame (code reading; Firefox has no heap counter).** Every frame ≈ 12–15 short-lived objects:
the `tick('field', …)` closure, `field.frame({…})`'s argument, the render-pass descriptor (desc, colorAttachments[],
attachment, clearValue), `[enc.finish()]`, `reg.at`'s `{re, im}`, packModes' `{buf, count}` and one `[0,0,0]` per mode
without a centre (field.js:608; the JIT may scalar-replace it). A cpuTick adds three `tick` closures, 2–3 strings per
spectrum lane (knob `--turn`, fmt, aria), shadow's q/p arrays, `out.last` + `ids.slice()`, ~4 strings + a hover object +
a points array per mode, themeInk's 2 parse arrays + 2 closures. METERS (≤ 10 Hz, open only): meterSnapshot (~25
fields), statusLine, ~12 template strings, badges' ~200-char canvas sentence (+ slice/map/join), paintGovernor's spread.
Modulation clock running: `R.list()` (40 strings) in modSyncBases and, in the kit, `registry.list()` + 40
`registry.state()` objects per applyAll tick. Gas: FB6. refreshOcclusion: 18–68 DOMRects + arrays per 300 ms. Only FB6 is
worth a change; the rest is below measurement on this desktop.

## 3. Leads I refute

- **BRIEF §8 "a reader that costs ~10 ms per frame in the gas state".** Not per frame: gas.stats on one frame in 24
  ('120'), sampled by the broken median (FB1 + FB2). The same scene replayed in the same Electron: frame median 0.6 ms.
- **BRIEF §7 main-thread medians** (1.36 / 0.16 / 0.24 / 3.06 / 0.48 ms) and wave 48's shown/hidden numbers are
  last-frame samples (FB2); the whole-loop medians are in §1's table.
- **L8 saveSettings as a hitch source:** 0.035 ms per call at 913 B (frame-inventory micro), never on the frame path.
  Coalescing buys nothing measurable (its carried-keys fragility belongs to lanes D/E).
- **L9 modSyncBases:** a faithful replica of its walk costs 41 µs per frame for the 40 registry ids; applyAll 7.5 µs
  (6.6 with one route); `R.write` fires only when a card moved and `schedule` is suppressed by `modSyncing`. Not worth a
  cache that would have to re-prove the base-vs-card law.
- **L10 `modView.paint(false)` every frame with the window closed:** never called — the loop checks `isOpen`
  (rack.js:1344). The closed window's real cost is FB3.
- **L11 history per frame:** `history.note` 4 µs, `reg.digest` 50 µs, no frame-path caller.
- **L5 "a layout read on the frame thread":** real but small while the UI is shown (0.05–0.40 ms per 300 ms, FF and
  Chromium); pure waste only while hidden (FB5).
- **`may()`, the governor's ring and sort:** µs. `canPresent` ×12–25 per frame = 0.03–0.14 ms, in a kit file; no memo.
- **A driven rotation "rebuilds every cache every frame":** true (50 versions in 51 frames), but +0.16 ms median
  (0.68 vs 0.52 ms, hitches.json). A population-version key would need a physics-file change; not now.
- **Idle:** a paused instrument schedules no frame with the modulation window open or closed, a pointer resting on a
  knob, or pointermove at 20 Hz; FB9's timer is the only residue.

## 4. Things I would NOT do

- Make `cpuEvery` target 30 Hz on 60 Hz displays: it doubles reader CPU there (15 Hz is the cheaper side). A cadence
  question, not an optimisation.
- Move `tFrame0` to the top of the loop: it changes the METERS "FRAME PROFILE total" a user reads. Add a second ring.
- Stop the link retry itself (REPORT.md:2257's law). Only its repaint goes (FB3).
- Cache modSyncBases' readings, memoize `canPresent`, pool DOMRects or the render-pass descriptor: µs each, each a new
  invariant to keep.
- Skip spectrum's phase-needle paints while DIALS is folded without a measurement on 91 built lanes (my timing drained
  lanes during the run and is inconclusive: 0.46 ms folded vs 0.46 open).
- Move gas.stats to a worker unless bitwise identity is required (FB1's factorisation is S and 26×).

## 5. Open questions for the cross-refutation round

1. FB4: probe back-off vs probe-on-edit — which does Josh prefer, against an 80–120 ms frame every 3 s?
2. FB8: is a ≤ 3-frame phase offset between reader windows acceptable while playing?
3. FB11: what should the busy mark mean at a 2–4 fps GPU-bound cadence?
4. The '120' profile at 60 Hz makes readers 15 Hz and METERS 7.5 Hz (the 100 ms rule on a 66.7 ms tick) — intended?
5. FB1: is a 3e-15 reassociation of a 2-decimal readout acceptable, or must `stats()` stay bitwise (worker road)?
6. Lane C: the open modulation window paints ~150 unguarded DOM writes per paint (1.36–1.46 ms per paint FF,
   +1.5 ms frame median at its 30 Hz); a write-if-changed helper in modwindow.js paint() is the obvious cut.
7. Lane F: FB7's try/finally and error policy; chem's per-request `busyWrap` flips the busy mark on every RT pump reply
   (read, not measured).
8. Lead: re-run the loop columns of baseline-firefox/chromium after FB2, reading `loopMedian` too.
