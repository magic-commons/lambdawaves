# REFUTE B · the loop, scheduling, readers, the modulation pump, idle · 2026-09-24 · Opus 5.5

Read whole: AUDIT-A, AUDIT-C, AUDIT-D, AUDIT-E, AUDIT-F. New measurements for this round:
`probes/B/refute-b.mjs` → `refute-b.json` (headless Firefox, GD_PORT 5232, µs timers): FRAME modes under a rotating
FREE camera, CALCULUS stats vs its DOM rebuild, the modulation-window grip per pointermove, closed-window paints with the
UI hidden. Plus code reads (file:line below) and my audit's probes (`frame-inventory`, `electron-gas`, `hitches`).

## 1. Verdicts

### Lane F (overlaps my lane most; the numbers agree)
- **F5 ≡ FB2 · MERGE.** Same mechanism, same fix (`slot` captured at the head). F's 4/4 exact and my ring-check agree.
  Either lane may own it; land it FIRST, because every later "main-thread ms" is read through it.
- **F11 ≡ FB1 · MERGE, CONFIRMED (+).** 8.6–20 ms (F) vs 8.3–17.3 ms (B), both engines; the factored sum is 26× faster
  (9 → 0.35 ms, gas-stats-factor.json). The one visible edge case to write into the neutrality argument: at an exactly
  symmetric instant ⟨z⟩ is rounding noise, and the reassociation can flip `0.00` ↔ `-0.00` in the readout.
- **F14 ≡ FB6 · MERGE, NARROWED (time only).** F's bytes are better than my estimate (180 KB / 1 028 objects per
  reconstruct). "Harmless in time" is node (0.037 ms); in the browsers the wrapped `gas.fieldModes` costs 0.10–0.15 ms per
  call (frame-inventory H/I/J/K, electron-gas). Still small; the change is still S and byte-identical.
- **F15 ≡ FB9 · MERGE, F's version wins.** `tablesReady()` is keyed on the Hamiltonian in force (kick.js:42,
  `RAD.id === H.id`), so the "no-op" 2 s chain is also what re-warms after a Hamiltonian switch. My FB9 neutrality claim
  was incomplete: stopping the chain REQUIRES F15's re-arm from `switchHamiltonian` / `setZ` / `setElement`.
- **F10 ≡ FB4 · MERGE.** 91–110 ms (F) vs 82–120 ms (B) at the 3 s probe cadence. F's option (a), `wignerSlice` in the
  cards worker, is the only pixel-neutral road; (b) back-off is a Josh call.
- **F12 ≡ FB11 · MERGE.** 86 % (F) vs 8 of 10 frames (B). F's MessageChannel heartbeat is a better signal than my
  `spent > gap/2`: it catches main-thread work outside the loop, which the loop's own cost cannot.
- **F1 ≡ FD2 · MERGE.** Take FD2's rule (compute only when the card is active) inside F1's restore-only `load()`: an open
  card keeps the synchronous road byte for byte (FD2), and `set()` stays untouched for `__LW.ladder.set` and the tests (F1).
  From the loop's side: restore's 12 REBUILD + 18 PRESENT asks coalesce into one frame (D measured), so the solve is the
  whole 420 ms.
- **F2 · CONFIRMED.** In my files (`periodNow`, rack.js:2997). The frame road already posts to the worker and says
  "settling". Land F3 first, or the async hover adds to the queue F3 describes.
- **F3 · NARROWED (mechanism), fix stands.** "A modulator routed to ZEEMAN B, a rate, the well radius" cannot happen:
  the registry holds 40 ids (hitches.json `pump.ids`), and the only ones that bump `reg.version` are the three rotation
  rates, which `rotDriving()` already holds off (rack.js:3004). The live, uncovered road is the KEYBOARD: arrow
  auto-repeat on a focused ZEEMAN B / STARK F / λ / well-radius dial bumps the version ~30×/s with `pointerHeld` false.
  One scan in flight plus the latest key fixes both roads.
- **F8 · CONFIRMED.** In the router. Keep `if (modSyncing) return;` first, as F wrote it: a re-base must not raise
  `pending`.
- **F9 · CONFIRMED + RISK.** `modesAt` is also the render-exact driver's field source (render-exact.js:48, "modesAt(t) is
  a pure function of t"). If `helium.fieldModes()` returns the previous basis while solving, an export started right after
  a basis change records stale frames. The driver must force `helium.sol` before its first frame. Gate:
  `tests/render-exact.test.mjs` + an export probe that changes the helium basis first.
- **F §3 "the modulation window costs no loop time (0.3 open = closed)" · NARROWED to Chromium.** In Gecko its paint
  costs 1.36–1.46 ms per paint at the window's 30 Hz; frame-inventory G vs E (same windows, window open vs closed): loop
  median 2.78 vs 1.28 ms.
- **F4 / F7 / F13 / F16:** outside my measurements; no objection. For F's open question 6: the chem pump's
  `call = busyWrap(raw(…))` (rack.js:794) also flips the busy mark on every RT reply (read, not measured).

### Lane D
- **FD5(a) ≡ FE2 · MERGE: CONFIRMED safe for the rings and the first open, with FD5's placement only.**
  (1) Closed means `root.hidden = rail.hidden = true` (modwindow.js:2924, 2934), i.e. `display:none`, so every guarded
  read already returned 0 and took the `g.sig = ''` branch. (2) `open()` sets `P.open = true` before its
  `rebuild(); place(); paint(true)` (2912–2915), so the first open measures as today. (3) The rings sit outside the device
  loop (`paintRings` after it, from registry state, no layout reads, 767–800), so they keep painting on the house knobs.
  (4) In `place()`, zero rects give `railX = 0` and `preLeft = bars.left − P.x`, which is exactly what skipping the block
  leaves. **RISK in FE2's variant B** ("paint keeps only paintRings while closed"): paint's device loop contains a MODEL
  write, the compact ENV's `M.setSource(s.id, { timeScale })`, which sits before the clientWidth read. Skipping it while
  closed changes a restored compact ENV's timing and its saved bytes. Put the guard right before the read (FD5), not at
  the top of the loop.
- **FD5 + FB3 compose.** FB3 removes the 1 Hz closed-window syncs while playing; FD5 makes the remaining boot and edge
  syncs layout-free. Land both.
- **FD7 · CONFIRMED + two RISKs.** (1) `paintMarks` sets `turnDirty = true` (rack.js:198). The deferred branch must still
  set it, or a busy mark raised inside the batch animates the previous palette's keyframes (`ensureTurnCSS` trusts the
  flag). (2) Release the batch depth in a `finally`: `restore()` can throw (F16), and a stuck batch would stop every later
  mark repaint. Check: `__LW.logo.colours()` + rect fills after an open, and after a malformed open.
- **FD6 · MERGE with FA1's lazy table.** `ensure()` must also guard the `modes` getter: `tests/gas.test.mjs` reads
  `gas.modes.length` straight after construction.
- **D §3 aside (projectKey → modSyncBases, "a registry write inside a read") · CONFIRMED, harmless.** It writes a base
  only where the card differs from it, with `schedule` suppressed by `modSyncing` (rack.js:688, 953). serialize() needs
  exactly that sync.

### Lane E
- **FE2 → MERGE into FD5** (above, including the variant-B risk).
- **FE3 · CONFIRMED neutral.** Nothing runs between `open()` and `wake()` (rack.js:4064). `open()`'s `port.opened()` may
  start the modulation clock (recomputeRunning → applyAll(true)) BEFORE open's own rebuild, so the second rebuild reads
  the same model. −15–28 ms per open.
- **FE11(b) · CONFIRMED, measured:** 0.56 ms and 14 getBoundingClientRect per grip pointermove (refute-b.json, with one
  forced layout standing in for the frame's). On a 500–1000 Hz mouse that is 4–16 moves, 2–9 ms per frame. Route it
  through `frame-coalescer.js` with a flush on pointerup, the rack's own wave-67 idiom. FE11(a): not measured; plausible.
- **FE5 refines my FB5.** `getElementById('keysheet')` is null (the id is an alias of the keymap), so under
  `body.ui-hidden` the full occlusion burst returns `[]`. FB5 becomes "skip while hidden, `setOcclusion([])` once": exact.
- **FE9 · CONFIRMED, tiny.** The per-cpuTick `tick('molecule')` is 2 × `performance.now` + an EMA (µs). Neutral skip,
  low value.
- **FE6 `gov.since`, `periodVersion` · CONFIRMED CUT.** No reader. `pk` replaced `periodVersion` (wave 45, rack.js:2983).

### Lane C
- **FC4 · NARROWED.** "1.7 mutation records/frame … the once-per-play/pause `modView.sync()`": it is once per SECOND
  while playing (FB3). refute-b.json: 7 forced closed-window paints in 6 s of playing with the UI hidden (1 play edge +
  6 retries). 1.7 × 178 frames ≈ 300 records in 3 s ≈ one ~100-record sync per second. After FB3 the hidden path really
  is zero mutations.
- **FC5 · CONFIRMED (+).** After FB3 the closed window stops painting altogether, so the dirty-check matters only while
  the window is open (≤ 0.3 ms). The heavier unguarded writers are in `sync()` → `paintKnob` (per knob: `--needle`, a
  dasharray, 2 textContent, 2 aria attributes, modwindow.js:2599–2618). FB3 takes them out of the playing loop.
- **FC open question 3 (Chromium scriptMs 4.9 ms/frame, every window open) · ANSWERED in part.** electron-gas.json,
  every card open, governor off as in the bench: the loop's own mean is 1.86 ms/frame. WIGNER's self-throttled 2 Hz
  (57–72 ms × 7 in 3 s) is ≈ 1.5 ms/frame of that. The rest are Chromium per-update EMAs, every 4th frame: radiation 0.38,
  calculus 0.17, dynamics 0.16, slice 0.12, spectrum 0.11, kepler 0.10, shadow 0.09, meters 0.09 ms, ≈ 0.3 ms/frame
  together. The other ~3 ms of scriptMs is outside the loop and needs a trace. **CALCULUS:** `update` 0.93 ms = stats
  0.29 + a full table rebuild **0.64** (32 mutation records per update, 5 rows; refute-b.json). calculusview.js:15–33 does
  `innerHTML = ''` and rebuilds on every cpuTick where t moved, and its LIVE switch's title promises "throttled while
  playing" (calculusview.js:11), which no code implements. Updating rows in place gives the same text and classes (a
  neutral DOM) and saves ~0.6 ms per update.
- **FC6 (+).** Each `tablet-motion` flip also fires both body-class MutationObservers (occlusion dirty → an extra
  refreshOcclusion, and window-activity's refresh of every root; rack.js:3670, window-activity.js:60), on top of C's
  6–11 ms restyle.

### Lane A
- **FA4 · CONFIRMED from the loop (rack.js:1215–1244), plus a stronger half.** In '120' mode on a 120 Hz panel the
  learned budget is 8.33 ms, so the GOVERNOR steps down any scene slower than 1.68 × 8.33 = 14 ms (~71 fps), not only
  AUTO SCALE at 11.1 ms. (a) the pause reset: **RISK** — the pause edge schedules a frame only when `gov.drop ||
  stepDrop` (1244), so the reset must also `schedule(TIER.PRESENT)` or the still picture stays at the small scale until
  something else paints. AUTO SCALE has its own documented law (rack.js:421–423), separate from the governor's pause law,
  so (a) is Josh's, not a silent fix.
- **FA7 · CONFIRMED (+), measured; my inventory missed it** (its scenes kept the camera still and FRAME on box). Whole
  `field.frame` JS per frame with the FREE camera auto-rotating: box 0.44 · dots 1.48 · lattice 1.81 ms (still camera:
  0.20); UI hidden 0.28, because toggleUI turns FRAME off. Box pays +0.24 ms per moving frame too: the line cache keys on
  the camera (L14).
- **FA9 / FA1 / FA2 · agree.** MERGE per FA's Q7: the persistent gas records (FB6/F14) carry FA1's `lag[3]` row.

## 2. Ranking — top 10 across all six audits (measured gain ÷ risk)
1. **FA2** kernel trims, zero texels differ: gas 112.6 → 45 ms, box packet 2.2×, 91 hydrogen −24 % (S).
2. **F1 + FD2** ladder off the restore road: −420 ms … −1.4 s per project and link open (S, neutral).
3. **FD1** GPU adapter from `<head>`: cold ready −363 ms headed, −520 ms headless (S, neutral).
4. **FB1 ≡ F11** gas.stats factored: a 9–17 ms periodic frame → 0.35 ms (S, 1e-15 argued).
5. **FA1** gas radial table: 128³ reconstruct 112.6 → 8.1 ms, texels closer to exact (M, law-1 argument).
6. **FA3** specialised present pipelines: −50 % on cloud, bit-exact on the defaults (M).
7. **FB2 ≡ F5** the perf ring slot: the measuring stick for everything after (S, nil risk).
8. **F6 ≡ FD3** the L6 guard: no-GPU boot shows its banner instead of "boot failed" (S, bug fix).
9. **F3 then F2** one scan in flight, then the hover asks without forcing: a 2-minute jam and 0.46–1 s hovers (S–M).
10. **FB3** the link retry repaints only when the play took: −0.7 ms and ~150 DOM writes per second of playing (S).
Next, all S: FD5 ≡ FE2 (placement as above), FE3, F8, FB7 (the loop's try/finally), FE1 (three broken menubar rows),
FD4 (ABOUT size), F16.

## 3. Missing (nobody found)
- **CALCULUS rebuilds its whole table every cpuTick** (calculusview.js:15–33): 0.64 of 0.93 ms, 32 mutation records per
  update, and its title's "throttled while playing" is not implemented (calculusview.js:11).
- **modwindow `paint()` writes the MODEL** (the compact ENV's `M.setSource(…, { timeScale })` in the device loop): a paint
  that is not idempotent. Any guard, throttle or skip of paint while closed has to keep it (FE2-B risk).
- **The period-scan storm's real road is keyboard auto-repeat**, not modulation (F3 narrowed): the wave-44 hold-off
  should read "a key is held on a dial" as well as `pointerHeld`.
- **`perf.profile` / the reader law do not see `gas.stats`** (rack.js:1338, outside `tick()`), so the governor can never
  slow or park the lab's worst CPU reader. Put it inside `tick('gas', …)` once it is cheap, or leave it out once it is
  0.35 ms.
- **FRAME box mode also re-uploads its line buffer on every camera-moving frame** (+0.24 ms; FA7 priced dots and lattice).

## 4. Not now
- FA4 (b)/(c) (one controller, a reconstruct-bound signal); FA8 (a GLASS gradient volume); FA6 (boot quality): Josh.
- FB4 ≡ F10 back-off, FB8 reader staggering, FB11 ≡ F12 busy-mark meaning: cadence and meaning changes for Josh; F10(a),
  a WIGNER worker, is the neutral M–L road for the next wave.
- The frost menu (FC3 J1–J8), FC6 `tablet-motion`, FC7: look changes for Josh; the iPad needs on-device numbers.
- FE8 (one look-seating table), FE10 (building WAVE right the first time), rack.js seams beyond blocks 1–9, L12 lazy
  windows, FD10 modulepreload: behind the browser gate, after this run.
- FB10 (cached ink and ResizeObserver sizes in shadow/orbit): a forced flush measured at 2.6 ms only after a body style
  write. Needs a phone number before it earns a diff.
