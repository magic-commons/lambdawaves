# AUDIT F · STUTTERS, GLITCHES, BREAKS · 2026-09-24 · Opus 5.5

## 1. What I read, and what I measured

**Read whole:** `lab/mathworker.js`, `gas.js`, `history.js`, `stage-gestures.js`, `audio.js`, `molecular-session.js`,
`frame-settle.js`, `frame-coalescer.js`, `period.js`, `kick.js`, `mir/window-activity.js`, `chemview.js`; `capture.js`
runtime half (picture/grab/probe/drive/planLoop/pngSequence/save); `render-exact.js` scheduling pins;
`statesview.js` (publish, drive pump, update); `heliumview.js`, `h2view.js` (prepare/fieldModes), `ladder.js`
(compute/prepare/set). In `rack.js`: 700–960 (busy mark, field, makeWorker, solveCard/solveChem, warm chain,
setPageHidden + the visibility funnel, schedule), 960–1370 (modesAt, applyRebuild, camera, the whole `loop`),
1858–1950 (capture plan, capExportFrames), 2085–2340 (slap, OPERATOR, LAUNCH, sturmian, setElement), 2980–3175
(period readout, barLock), 3348–3616 (bow, launchPacket, enterBox), 3622–3690 (occlusion + its observers),
4430–4480 (projects), 4625–4945 (drags, phone/tablet, stage gestures), 4945–5200 (keys), 5290–5450 (restore),
5520–5705 (history wiring), 5955–6080 (end of boot). Grep-read every `field.` use for an `ok` guard and every
`setTimeout`/`setInterval`/`requestIdleCallback`/`*Observer` in `lab/`. REPORT.md "2026-09-10 · Real-time pass",
CLAUDE-CODE-HANDOFF "GPU/reload investigation" + "Successful GPU/reload retry", REPORT wave 48 ("HIDDEN IS NOW THE
FASTEST STATE"). By grep of allocation / sync-solve sites only (not line by line): `orbitalsview.js`, `vortex.js`,
`particles.js`, `state.js`, `frontier.js`.

**Probes** (all in `research/optimization-2026-09-24/probes/F/`, each writes its `.json` beside it):
- `gas-fieldmodes.mjs` (node): gas.fieldModes / stats / launch at 256 modes; a reuse variant; packModes byte identity.
- `sync-costs.mjs` (node): every synchronous solve the rack can run on the frame thread, same modules.
- `probe-f-firefox.mjs`: headless Firefox (RTX 3070, 1920×1080, µs timers): costs on a hand, settings/history/dirty
  reads, theme/palette/modwindow/cards, restore, raw per-frame loop cost in four scenes, the body-class observer
  bound, the lost-device drive.
- `probe-f-breaks.mjs`: no-WebGPU boot (`dom.webgpu.enabled=false`), idle after device loss, perf.median vs last frame.
- `probe-f-l6fix.mjs` + `lab-l6/` (symlinks to every `lab/` file; `rack.js` = a sed copy with the 3-site L6 guard).
- `probe-f-electron.mjs`: Electron 44 / Chromium 152 on the RTX: raw per-frame cost + rAF intervals in 7 scenes,
  V8 CPU profiles of `restore()` and of the modulation window's open.
- `probe-f-chem.mjs` (RT pump under a growing trace), `probe-f-extra.mjs` (restore breakdown, project-open stall,
  helium basis paused, WIGNER under the governor), `probe-f-busy.mjs` (busy mark in a GPU-bound scene, helium basis
  while playing), `probe-f-export.mjs`, `probe-f-scanstorm.mjs`.

**The raw-frame recorder** (every scene probe): accessor properties on `__LW.perf.profile.*` turn each EMA write back
into that frame's raw ms (`raw = (new − 0.9·old)/0.1`). `total` is written once per loop at its tail, so it IS the
per-frame value the ring was meant to hold. No edit under `lab/`. F5 explains why it was needed.

## 2. Findings, ranked

### F1 · Every project open / link open freezes 0.46–0.79 s, and ~90 % of it is a hidden card's LADDER solve
WHERE: `rack.js:5382` (`if (I.ladder) ladder.set(I.ladder)`) → `ladder.js:160` (`set` → `compute()` → `solveLadder(P)`
synchronously). `serialize()` always writes `ladder: { ...ladder.params }` (`rack.js:5232`).
MECHANISM: `restore()` re-seats the LADDER card through its public `set`, which solves the revival packet, scan and the
121-point chirped Poisson–Airy prediction ON THE FRAME THREAD, whether or not the card is open, visible, or the
operator is hydrogen. The card's own knob road already defers the same solve to the cards worker (`schedule()` →
`prepare()` → `api.solve`).
EVIDENCE: Firefox `restore(serialize())` 455–469 ms, of it `ladder.set` 414–422 ms (1 call); `projects.open` = a
488 ms main-thread stall (heartbeat) and a 467 ms rAF gap. Chromium CPU profile of restore: 785 / 704 ms wall,
`envelope4C frontier.js:175` 679 / 637 ms self + `quarticEnvelopeC` 26 / 24 ms. Node `solveLadder({nbar:30,…})`
484 ms. The baseline's `openMs 490 / restoreMs 463` is this.
CHANGE: add `load(p)` to `ladder.js` = `set` without `compute()`: `Object.assign(P,p); ui[k].set(…); clockFx(); schedule();`
(dirty, generation++, `arm()` → worker when active). `restore()` calls `ladder.load(I.ladder)`. `set()` stays exactly
as it is for every other caller (`__LW.ladder.set`, the tests).
NEUTRALITY: `P` and the saved bytes are identical; the closed forms (`clockFx`) still paint synchronously (the legacy
gate reads those slots); `get last()` already recomputes on demand when dirty, so every reader gets the same object;
a visible card gets the worker's answer, bit-identical by mathworker.js's contract. Check: `__LW.ladder.last`
deep-equal before/after a restore; `tests/current.browser-test.mjs` (project round trip); probe restoreBreakdown.
GAIN: −415 ms (Firefox) / −650 ms (Chromium) on every project open and link open.
RISK: a card visible at restore shows its old plot for one worker round trip (it already does on a knob edit). EFFORT: S.

### F2 · Hovering CAPTURE runs one or two synchronous 2·10⁶-step period scans (0.46 s density view, 1.0 s phase view)
WHERE: `rack.js:1950` (the CAPTURE group's `pointerenter` → `capMakePlan(false)`) → `capture.js planLoop` →
`LW.period` → `periodNow(true)` (`rack.js:2997`) → `densityPeriod`; plus `wavePeriod`, a SECOND scan on `[0, …E]`,
for the four phase-carrying views (the shipped observable is one of them). Same forced road: ⟳ jump (`rack.js:2980`),
G bar-lock (`barLock`, `rack.js:3140`), the METERS copy digest (`rack.js:5966`).
MECHANISM: the frame path already sends the scan to the `period` worker and says "settling"; the forced road exists for
proofs, but three UI gestures take it too. An incommensurate spectrum (the BOX, any Zeeman/Stark/Sturmian state) scans
up to 2·10⁶ steps × pairs; a Zeeman-split box state has ~4 000 pairs, i.e. seconds per scan.
EVIDENCE: BOX packet (91 labels, 210 pairs): hover plan 457.5 ms (density) / 999.6 ms (phase); `LW.period` first read
364 ms; node `densityPeriod` 361 ms, `wavePeriod` 402 ms.
CHANGE: the hover asks without forcing: post both energy sets to the `period` worker (the density key it already
coalesces on, plus a ψ key), show the plan as STALE/"…" (capPaint already has that face) and re-plan when both land.
⟳ and G take the same async road and act on landing. `LW.period`, `LW.capturePlan`, the PLAN button stay forced.
NEUTRALITY: identical numbers (same `densityPeriod`, bit-identical in the worker); only the moment the plan appears
moves. Check: `tests/capture.test.mjs`, `tests/period.test.mjs`; probe captureHoverPlan → < 5 ms.
GAIN: −0.46…−1.0 s per hover on the BOX; seconds on Zeeman states. EFFORT: S–M.

### F3 · The period-scan queue is unbounded: 4 s of a moving register jams the scan worker for > 2 minutes
WHERE: `rack.js:3017–3027`: a new `scan.call` whenever the key moves; no cancellation, no one-in-flight rule.
MECHANISM: the hold-off guard `pointerHeld || rotDriving()` (`rack.js:3004`) covers hands and rotation drives only.
Anything else that bumps `reg.version` every frame (a modulator routed to ZEEMAN B, a rate, the well radius, a script)
posts a fresh scan per frame (paused: `periodText` runs every frame) into a FIFO worker that cannot drop stale work.
Every queued call also holds the busy mark (`call = busyWrap(raw(…))`, `rack.js:794`) for up to its 8 s timeout.
EVIDENCE: `probe-f-scanstorm`: BOX packet, `setField({Bz})` nudged per rAF for 4 s (66 frames, paused) → the worker's
bookkeeping `stat` (answered in FIFO order) timed out 15 times: no answer for 120 s.
CHANGE: latest-value coalescing: at most one scan in flight; when it answers with a stale key, post ONE scan for the
current key. Optionally add "the modulation clock is running" to the hold-off guard for scans that already cost > 8 ms
(the wave-44 law, one more clause).
NEUTRALITY: a settled state gets the same answer; stale answers were already discarded (`periodPending !== key`).
Check: `tests/period.test.mjs`; probe scanstorm → stat answers within one scan after the stimulus. EFFORT: S.

### F4 · CHEMISTRY RT: the spectrum starves the run (557 → 27 steps/s) and the pole fit stalls the frame thread every 2 s
WHERE: `chemview.js:310` (`requestSpectrum()` after every pump reply, throttled by wall time only, 500 ms);
`mathworker.js:493` (`chem.rt.spectrum` transforms the WHOLE accumulated trace, up to 2·10⁶ samples);
`chemview.js:329–344` (`refit` → `fitPoles` on the frame thread every 2 s over a 30 000-sample window).
MECHANISM: spectrum and run share ONE worker FIFO. Once a spectrum costs more than its 500 ms cadence the queue
alternates spectrum/run and the run, which is the moving field, gets one batch per spectrum. The spectrum's cost grows
linearly with the trace (~1 200 samples/s at 10 steps/frame, 117 Hz). The fit is O(30 000 × 1 551) + LM, main thread.
EVIDENCE: `probe-f-chem` (H₂O, SPEED 20): early 557 steps/s, worst main-thread stall 49 ms; at 124 681 samples
27 steps/s (a 20× collapse), 6 rAF gaps > 100 ms in 8 s, worst stall 153 ms. Node: spectrum 54 ms @1e4, 499 ms @1e5,
1 484 ms @3e5; `fitPoles` 30 k window 125 ms.
CHANGE: (a) one spectrum in flight, cadence ≥ max(500 ms, 4 × the last spectrum's measured ms), the reader law's own
rule; (b) a `chem.rt.fit` op in the chem worker running `fitPoles` on a copy of `trace.subarray(0, FIT_CAP)` with the
init the card sends; the card keeps painting `fit`.
NEUTRALITY: every spectrum shown is still absorb.js of the whole trace at request time; the fit window holds the same
doubles (the card's `rt.trace` is a copy of the worker's first 30 000 samples), so a given (trace, fit) paints the same
plot; only the refresh cadence moves under load. Check: `tests/response-fit.test.mjs`, `tests/chem.browser-test.mjs`;
probe-f-chem → > 400 steps/s at 125 k samples, no stall > 20 ms.
GAIN: long runs keep their RT cadence; −125…153 ms hitch every 2 s. RISK: never transfer the worker's own trace
buffer (copy the window). EFFORT: M.

### F5 · `__LW.perf.median` is the LAST frame's cost, not a median of 60: every "loop median" in the baselines is one frame
WHERE: `rack.js:1213` zeroes `perf.ring[frames % 60]`; `perf.counts.frames++` runs mid-loop; `rack.js:1363` writes
`spent` to `ring[(frames+1) % 60]`; the NEXT frame's head zeroes exactly that slot. One non-zero slot survives.
EVIDENCE: `probe-f-breaks` medianIsLastFrame 4/4 exact (0.26/0.26, 0.22/0.22, 0.22/0.22, 0.98/0.98). Electron
"128³ axial gas · UI shown": raw median 0.3 ms over 52 frames, 3 frames > 8 ms (gas.stats, F11); the getter read
14.5 ms. The lead's baseline "10.9 ms shown vs 0.4 hidden" is the same artefact. Firefox 64³ gas: getter 13.14 = the
last frame (a gas.stats frame), raw median 0.58. Wave 48's "hidden is fastest" numbers were read through this getter.
CHANGE: `const slot = perf.counts.frames % 60;` at the head, `perf.ring[slot] = 0` there and `perf.ring[slot] = spent`
at the tail.
NEUTRALITY: diagnostic only; nothing reads the ring but `LW.perf.median` (`tests/legacy` prints it, asserts nothing).
GAIN: every lane's "main-thread ms" becomes a real median. Until it lands, measure with the raw recorder. EFFORT: S.

### F6 · L6 confirmed in Firefox too, and the minimal fix is proven: guard the three `setDprCap` calls
WHERE: `rack.js:4817` (enterPhone), `4874` (leavePhone), `4891` (syncPhone, reached from boot at `5986`).
MECHANISM: `createField`'s early-return object (`field.js:678–682`) has no methods. Every other `field.*` call in
rack.js is `ok`-guarded (applyRebuild 1003–1007, loop 1109/1196, gamut 400/1640/1655/5729, diagnostics 5865 and
5913–5918); only these three are not. The throw aborts `boot()`: `LW.ready` never becomes true, main.js paints "boot
failed", and the CPU readers the intended banner promises never run.
EVIDENCE: `probe-f-breaks` noGpu: `BOOT syncPhone@rack.js:4891 … boot@rack.js:5986`, banner "boot failed" /
"field.setDprCap is not a function", ready false. `probe-f-l6fix` (patched copy, no WebGPU): ready true, banner
"WebGPU unavailable", 57 frames in 1.2 s playing, 0 errors; with a GPU the patched copy behaves as shipped.
CHANGE: `field.setDprCap && field.setDprCap(…)` at the three sites. Test the method, not `field.ok`, so a lost device
(its object keeps its methods) behaves exactly as today. A field.js no-op stub is lane A's alternative.
NEUTRALITY: with WebGPU nothing changes (the method exists). A bug fix whose proof is the banner's own promise.
Check: a browser test built from probe-f-l6fix; `gpu-recovery.browser-test.mjs`. EFFORT: S.

### F7 · LAUNCH and OPERATOR → BOX block the pointer for ~0.2 s (a synchronous `wellPacket`)
WHERE: LAUNCH trigger `rack.js:2164–2168`; OPERATOR seg `rack.js:2153` → `enterBox` (`3578`) → `launchPacket` →
`wellPacket`, the 91-label projection. The bow already goes through the worker (`launchPacketAsync`, `3384`).
EVIDENCE: Firefox `launchPacket` 212.7 / 188.5 / 197.9 ms per press (56 labels); node 254 ms (91 labels).
CHANGE: (a) LAUNCH → `launchPacketAsync` (worker `packet`, bit-identical) and start the clock when it lands;
(b) OPERATOR → BOX: warm the default packet (radius, axis, |k|, σ from the knobs) in the maths worker in idle time,
keyed; use it synchronously on a key hit, else (a). `LW.enterBox` / `LW.launchPacket` stay synchronous.
NEUTRALITY: same packet numbers. Paused, it lands at the same t; playing, it is the same launch ~0.2 s later, the
wave-45 law the bow already ships. (b) is fully neutral on a key hit. Check: `tests/well.test.mjs`, `tests/gas.test.mjs`;
a probe timing the trigger's onFire. GAIN: −190…250 ms per press. EFFORT: S for (a), M for (b).

### F8 · A REBUILD asked for during an export is dropped: afterwards the GRID says 96³ and the field marches 64³
WHERE: `rack.js:951–954`: `schedule()` returns on `exportLocked` BEFORE `if (tier > pending) pending = tier`; the
export's `finally` schedules only `TIER.RECONSTRUCT` (`rack.js:1943–1946`).
EVIDENCE: `probe-f-export`: grid 64 → start export → `quality.res = 96; schedule(REBUILD)` → stop → settle:
`quality.res 96`, `field.resolution 64`. Any REBUILD-tier ask (GRID, DOMAIN, SPACE, OPERATOR, governor off) made while
an export runs is lost until some unrelated rebuild.
CHANGE: `if (modSyncing) return; if (tier > pending) pending = tier; if (exportLocked) return;`. The loop still refuses
and no rAF is armed during the export (render-exact's H1 "interloper" pin is untouched); the finally then runs
`max(pending, RECONSTRUCT)`.
NEUTRALITY: nothing changes outside an export. A bug fix. Check: `tests/render-exact.test.mjs`; probe-f-export → 96.
EFFORT: S.

### F9 · HELIUM: the frame loop can solve Hylleraas synchronously (90–269 ms), and doing so discards the worker's solve
WHERE: `heliumview.js:62` (`fieldModes() { return conditionalModes(ensureSol(), x1()) }`), `heliumview.js:12`
(`ensureSol` = synchronous `hylleraas` + `generation++`), called from `modesAt` (`rack.js:986`). `setOn(v)` calls
`ensureSol` as well (`heliumview.js:59`), and `restore()` reaches it at `rack.js:5377` when a project's field owner is
helium.
MECHANISM: `setBasis` nulls `sol` and starts the worker (`prepare`). The next playing frame's `modesAt` finds
`sol === null` and solves on the frame thread; its `generation++` makes the worker's answer stale when it arrives.
EVIDENCE: `probe-f-busy` heliumBasisPlaying: basis → TEN worst stall 268.6 / 237.3 ms, → SIX 90.1 ms (paused, no frame
runs, no stall: `probe-f-extra`). Node hylleraas: one 6 / three 27 / six 75 / ten 237 ms.
CHANGE: `fieldModes()` returns the last good solution's modes while `solving` (keep a `shown` sol), or null (no
reconstruct); `setOn(true)` calls `prepare()`; when the worker lands and `on`, ask the host for a RECONSTRUCT
(`api.repaint(true)`). `get sol()` stays a synchronous demand for proofs.
NEUTRALITY: the settled volume is identical (same `hylleraas`, bit-identical in the worker); for one worker round trip
the previous basis stays on screen instead of the app freezing. Check: `tests/helium.test.mjs`,
`tests/card-solvers.test.mjs`; probe heliumBasisPlaying → stall < 20 ms. EFFORT: M.

### F10 · The reader law's 3 s re-probe is a guaranteed ~100 ms hitch while WIGNER (or a big SLICE) is open and playing
WHERE: `rack.js:532–533` (a parked reader is let through once per `READER_LAW.probeMs = 3000`).
EVIDENCE: `probe-f-extra` wignerGovernorOn (governor ON as shipped): parked after its first call; probes at t = 3.7 /
6.9 / 9.9 s cost 110 / 91 / 102 ms; worst stall 118 ms. Electron "every card open": wigner max 78 ms. The comment's
"under 1 % of the wall" is true for throughput and false for smoothness.
CHANGE (choose): (a) run `wignerSlice` (pure, `wigner.js`) in the cards worker and paint the answer: neutral pixels,
M–L; (b) exponential probe back-off for a reader whose probe re-parks it (3 → 6 → … → 48 s, reset on `reg.version`):
S, but it slows the parked window's 1/3 Hz refresh, a visible change for Josh to accept.
EFFORT: M–L for (a) / S for (b).

### F11 · `gas.stats` is the only item over 8 ms in the axial-gas loop: 9–20 ms every 24th frame
WHERE: `rack.js:1338` (SPECTRUM's gas readout, every 6th CPU tick = every 24th frame in the default 120 mode, while
SPECTRUM can present) → `gas.js stats()` = a 100 × 80 grid × 256 modes.
EVIDENCE: Firefox 8.6 / 10.9 / 8.8 / 11.5 ms per call (node 8.8); Electron axial gas UI shown: 3 of 52 frames over
8 ms, untracked max 19.3 ms; UI hidden: none. At 8 fps (128³) it hides inside a 133 ms GPU frame; with the gas at 64³
it is a dropped frame about every 0.4 s.
CHANGE: evaluate separably, `A_l(r_i) = Σ_nr c·R` then `ψ(i,j) = Σ_l P_l(θ_j)·A_l(r_i)` (16 l × 16 n_r): about 16×
fewer multiply-adds. Or post it to the cards worker.
NEUTRALITY: re-associated sums (~1e-15 relative) on a readout printed to 2 decimals; argue it explicitly and add a
node check against today's `stats` at 1e-12. EFFORT: S.

### F12 · The busy mark flags GPU-bound frames as a blocked thread (up 86 % of the time in the heavy Box scene)
WHERE: `rack.js:1211`: a > 250 ms gap between loop frames → `busyFlash(600)` ("the thread WAS blocked").
EVIDENCE: `probe-f-busy`: 128³ axial gas, glass, scale 1.5: loop median 0.62 ms, rAF 300 ms, 15 of 20 gaps over
250 ms, busy mark up in 86 % of 50 ms samples. Electron 128³ gas UI hidden: rAF p99 367 ms.
CHANGE: flash only when the main thread really was late: post a MessageChannel ping at the loop tail and flash if its
handler ran more than 250 ms after the tail (and/or `PerformanceObserver('longtask')` where it exists).
NEUTRALITY: it changes when the signal shows. Argued as a defect (the rule's own premise is false here); Josh decides.
EFFORT: S.

### F13 · (P3) The K key slaps on the frame thread: 135 ms cold, 14–25 ms warm
WHERE: key `slap` → `__LW_hooks.slap` (`rack.js:2107`) → `reg.kick` + two `pAlong`. The idle warm starts 3 s after boot.
EVIDENCE: Firefox cold 135.5 ms; warm median 18.8, max 25.2; node kickZ 11.1 + momentumZ 2 × 2.
CHANGE: route the key (not `LW.kick`) through the maths worker with a `kickAxis` op calling the SAME `applyKick` that
`reg.kick` uses (bit-identical; the bow's `applyKickAlong` would differ in the last bits for y), landing like the bow.
EFFORT: S.

### F14 · (P3) L2 is real in bytes and harmless in time: 180 KB and 1 028 objects per gas reconstruct, 0.037 ms
WHERE: `gas.js fieldModes` (a record + a table + 2 Float64Array(6) per mode, every call).
EVIDENCE: node 180 116 B/call, 0.0374 ms; a reuse variant (records built once) 0.0122 ms, 478 B; `packModes` output
identical over 64 times (458 752 floats, `Object.is`). No GC spike in any raw frame ring (Electron gas scenes: every
frame ≤ 0.5 ms except gas.stats); restore's whole CPU profile holds 6.7 ms of GC.
CHANGE: build the 256 records in `build()` and rewrite `re/im` in place (the `modesAt` hydrogen pattern, wave 45).
NEUTRALITY: identical pack bytes (proven). GAIN: ~1.4 MB/s less garbage at 128³, ~11 MB/s at 64³. EFFORT: S.

### F15 · (P3) Idle is not zero: the slap warm chain re-arms every 2 s forever
WHERE: `rack.js:835`: `warmArm(kickReady() ? 2000 : …)` runs unconditionally; each arm = setTimeout + requestIdleCallback.
CHANGE: stop when `kickReady() && workerWarmStarted`; re-arm from `switchHamiltonian` / `setZ` / `setElement`, the only
events that invalidate the radial table. NEUTRALITY: the tables are warm before first use exactly as now. EFFORT: S.

### F16 · A failed restore is half-applied, never rebuilt, and then marked clean
WHERE: the catch at `rack.js:5447` skips `schedule(TIER.REBUILD)` (5445) and `history.clear()`; `projects.open`
(`rack.js:4467–4474`) ignores the `false`, writes the notebook, calls `projectClean()` and says "opened".
MECHANISM: whatever landed before the throw (register, camera, some knobs) shows on a stale field, and the dirty
baseline becomes the half state, so the unsaved-changes guard will not fire before it is saved over the good file.
CHANGE: `schedule(TIER.REBUILD)` in a `finally`; `open()` checks the return (no `projectClean`, status "open failed").
NEUTRALITY: the success road is unchanged. Check: `tests/current.browser-test.mjs` + a malformed-project case. EFFORT: S.

### The inventories the brief asked for (measured; Firefox unless noted)
**Synchronous on a hand or an event** (over ~8 ms marked *): restore / project open 455–555 ms* (F1) · CAPTURE hover
457–1 000 ms* (F2) · ⟳ / G / meters copy on the BOX 364 ms* (F2) · LAUNCH / OPERATOR→BOX 188–254 ms* (F7) · HELIUM
basis while ON and playing 90–269 ms* (F9) · K key 135* cold / 14–25* warm (F13) · first modulation-window open 70 ms*
(Chromium 27, 13 of it a forced layout), later opens 34* · theme flip 2.6–3 ms JS, 10–13 with style* · palette
6–8.6 ms · axial enterBox 18–23 ms* · card first open 2–4 ms JS (helium 16 with style) · λ drag 0.7–2.7 ·
setElement 0–0.2 · saveSettings 0.08 (max 0.58) · history reads 0.04 · project dirty 0.82 (on demand only).
**Worker replies:** the chem RT pump and the STATES drive keep one request outstanding (back-pressure exists). A reply
= `setMoleculeMatrix` of nAO² floats (5 KB for benzene) + the card's readouts and plot, painted even when the card is
hidden (a lead for lane B). The bow costs 0.1 ms on the pointer and lands in 14–18 ms warm (214 ms cold, off-thread).
**Allocation per reconstruct:** hydrogen register 0 (reused records + scratch); gas 1 028 objects / 180 KB (F14);
helium ≤ 10 terms × 4 objects ≈ 3 KB; H₂ 4 records + 2 centres; legacy H₂⁺ 2 + 2; chemistry/states 0 in the loop
(reused product records; worker buffers are transferred); audio read 4 small objects per frame; `reg.at()` without
scratch (kepler row sync, pAlong, meters) 2 × 728 B per call.
**Timers/observers running while IDLE:** only the warm chain (F15). While a panel is open: the tempo panel's 5 Hz sync
(`native-ui.js:121`). Everything else is event-driven. Observers that fan out to `schedule(PRESENT)`: body class
(`rack.js:3670`), notebook/transport/sheet/list attributes + rack/float childList (`3665`), window-activity's body and
tracked roots (only when a window's active state flips). **A class toggle cannot loop:** every in-loop body write is
compare-then-toggle (`frostSync` 437, tablet-motion 1187–1188); probe: one toggle → 1 frame, untoggle → 1 frame.

## 3. Leads I refute
- **"The Box stutter is GC from gas.fieldModes"**: the bytes are real (F14), but no frame ring shows a GC spike. The
  gas scene is GPU-bound (8 fps) with a 0.3 ms loop; the one periodic spike is `gas.stats` (F11).
- **"Axial gas costs 10.9 ms of main thread with the UI shown" (baseline-chromium)**: a one-frame artefact of F5. The
  raw median is 0.3 ms, shown and hidden.
- **L8 (saveSettings hitches)**: 0.08 ms median, 0.58 max, 911 B. Not worth a debounce, which would risk losing a
  preference on unload.
- **L11 (history dirty on reads)**: canUndo + canRedo + depth = 0.04 ms, read only by renderHistory/menus on change.
- **"JSON.stringify of the project on dirty reads"**: 0.82 ms, read only on beforeunload / discard / open prompts.
- **"A body-class toggle can re-trigger frames forever"**: bounded, proven above.
- **"busyFlash after a tab switch"**: resume zeroes `autoQ.lastMs` (`rack.js:894`); probe: no flash. (F12 is a
  different false positive, and a real one.)
- **"A desktop resized to 700 px gets the phone path and frost OFF"**: the breakpoint requires `(hover: none)`
  (`mir/css/skin.css:320`, `lab/skin.css:188`), so a mouse desktop never crosses. The tablet path needs an iPad UA or
  a coarse pointer.
- **"pagehide dispose, then pageshow(persisted) finds a dead field"**: dispose runs only when `!e.persisted` (a real
  unload); a bfcache round trip keeps the field.
- **"A lost device throws on the frame path"**: `device.destroy()` probe: banner shown, zero throws across play, grid,
  palette, theme, resize, phone sync, digest, readPixels, capture and H; idle returns to 0 frames / 1.5 s.
- **"The modulation window costs frames through its paint"**: raw loop median 0.3 ms open = closed (max 1.2). The
  85.9 vs 111.5 fps drop is steady compositor misses (rAF p90 16.7 vs 8.4 ms, max 50), which is lane C's. The open
  itself is a one-off 27–70 ms. **"Every window open costs ~12 fps"**: steady compositor cost too, except WIGNER's
  spikes (F10).
- **"History hold stuck"**: a lost pointerup keeps `held` until STUCK_MS (5 s) and `pointerHeld` until the next press
  of that pointer id; nothing stalls, commits resume after 5 s.
- **"schedule() during export strands pending"**: it does not strand the ask, it DROPS it (F8).

## 4. Things I would NOT do
- Make `LW.kick`, `LW.enterBox`, `LW.launchPacket`, `LW.period`, `LW.ladder.set` or `helium.sol` asynchronous: the proofs
  read them synchronously. Every change above moves only UI roads.
- Cancel stale scans by `terminate()` + respawn: a module-graph refetch and a cold worker per key cost more than the
  single stale scan that coalescing leaves.
- Lower `gas.stats`' stride, the period horizon or the fit window: that changes numbers.
- Remove the reader re-probe: a parked reader would never come back after its state got cheap.
- Destroy GPU textures on hide (the wave-54 measurement: a 50–200 ms rebuild on return, on unified memory).
- Add a third chemistry worker just for the spectrum: the trace lives in the chem worker, so share it or throttle it.
- Debounce `saveSettings`; move `pngFilter` off-thread now (it blocks only an explicit, busy-marked PICTURE export).

## 5. Open questions for the cross-refutation round
1. Lane B: please re-run your loop numbers with the raw recorder (`probe-f-firefox.mjs`, `RECORDER`) until F5 lands.
2. Lane A: `wellPacket` (254 ms) and `densityPeriod` (2·10⁶ × pairs) are maths costs. Is there an exactness-preserving
   speed-up, e.g. a coarse first pass of the near-recurrence scan with the same final refinement?
3. Josh: should the busy mark mean "the thread is blocked" (the F12 fix) or "the instrument is slow" (today)?
4. Josh: parked readers: a worker (neutral, more code) or back-off (cheap, slower parked refresh)? (F10)
5. OPERATOR → BOX: accept an async landing on a cold key (the old state for ~0.2 s), or build the speculative
   default-packet warm (F7b)?
6. Lanes B/C: CHEMISTRY's `refresh()` / `paint()` run on every RT reply even while the card is hidden. Worth gating?
   (Not measured here.)
