# REFUTE A · RENDERER / GPU reads B, C, D, E, F · 2026-09-24 · Opus 5.5

Read whole: AUDIT-B, AUDIT-C, AUDIT-D (with the headed addendum), AUDIT-E, AUDIT-F. New probes, READ-ONLY on lab/ and tests/:
`probes/A/wellpacket-cache.mjs` → `.out.json` (node) and `probes/A/gasstats-layout.mjs` → `.out.json` (node). Code reads
cite file:line. Verdicts cover only findings that touch field.js, gas.js, well.js, bessel.js, the kernel, the present pass,
the governor and quality controls, or the FRAME lines.

## 1. Verdicts

**FB1 / F11 (gas.stats 8–17 ms on the frame thread) — CONFIRMED (+), MERGE (owner B).** The two findings are one change.
I checked whether a strictly bit-identical fix could replace their reassociation (`gasstats-layout.mjs`). The test keeps the
same terms and partial sums in the same order and changes only the memory layout: one transposed `Float64Array RtT[i·256+m]`
plus an `Int32Array` of l. First, a copy of the shipped `stats()` was proved `Object.is`-equal to `gas.stats()` at 9 times;
the layout variant is then `Object.is`-equal to it at the same 9 times. Result: only **1.88×** (12.8 → 6.8 ms in node).
Bit-identity therefore gives up most of FB1's 26×. I recommend the factorisation with B's node pin (≤ 1e-12 against the
old loop kept as the oracle). The `-0.00`/`0.00` flip B reports is a rounding-noise zero on either side, and it is the
only printed difference. Ranking note: after FA1 the 128³ gas frame falls from ~113 ms to ~14 ms. gas.stats (9–17 ms,
every 24th frame) then becomes the gas scene's largest periodic stutter, so FB1 should land with FA1, not after it.

**FB6 / F14 (gas records rebuilt every reconstruct) — CONFIRMED, MERGE with FA1 and FD6.** F14 is right that the cost in
time is small (0.04–0.15 ms). The record is the natural carrier for FA1's table row (`lag[3] = row`). Sequencing RISK:
FB6's neutrality proof ("packed kernel bytes identical") must be run BEFORE FA1 adds the row, because the row changes the
packed bytes by design. Land FB6, prove it, then land FA1.

**FD6 (lazy createGas, 14–18 ms at boot) — CONFIRMED, MERGE.** It should be one `ensure()` in gas.js that builds the CPU
quadrature tables (Rt, Pt) and FB6's records, both A-dependent and rebuilt on `setRadius`. FA1's GPU Hermite table must
NOT live in that radius-dependent rebuild: j_l(z·r/a) sampled on u = r/a is radius-free. It is built once per session
(26–38 ms in FF, `gas-pixels-*.out.json`), lazily, on the first axial frame. `gas.test.mjs` reads `gas.modes.length` right
after `createGas`, so the `modes` getter must call `ensure()` (D lists it).

**FD1 (gpu-boot.js: request adapter + device from <head>) — CONFIRMED, with four RISKs on field.js's side.**
- (a) **The Node suites import field.js**: `tests/field-owner.test.mjs`, `capture.test.mjs` and `perf.test.mjs`. If
  field.js imports gpu-boot.js, the request runs at import time in Node. It must read `globalThis.navigator?.gpu`, which
  is undefined in Node 22 and gives null. Writing plain `navigator.gpu` works only because Node ≥ 21 defines `navigator`,
  so do not rely on it. It must also never create an unhandled rejection (D's `.catch` covers this).
- (b) **The promise is a module singleton.** Any page that calls `createField` twice would now get the SAME device twice.
  None does today: rack.js calls it once, `lab/smoke.html:30` once, and the legacy test only greps rack.js's source for
  `createField(dom.canvas, {`, which stays. Document the single-device contract in field.js.
- (c) The listeners attaching late are benign, as D argues. `device.lost` is a promise (field.js:698), so a late `.then`
  still fires. `uncapturederror` needs a submitted command, and none exists before createField.
- (d) Everything downstream is unchanged: `out.limitsRequested` (read by capture.js `limits()`) and `adapterInfo` need the
  adapter object returned, not only the device. `throughput`, the readbacks, capture and render-exact all use
  `out.device`, the same object. `dispose()` destroys it only on a real unload.

D measured neutrality: digest, limits and adapterInfo are identical over 16 boots. Gate: gpu-recovery.browser-test
(4 reloads), plus `node tests/perf.test.mjs` and `field-owner.test.mjs` with the import in place.

**FD3 vs F6 (the L6 guard) — both CONFIRMED; prefer F6's form.** FD3 guards with `if (field.ok)`. field.js sets
`out.ok = false` on device loss (field.js:698) and in `dispose()`. So after a lost device, FD3 would stop `syncPhone`
updating `dprCap` across a phone or tablet crossing; the field is frozen, so the effect is harmless but not neutral.
F6's `field.setDprCap && field.setDprCap(…)` keeps today's behaviour exactly whenever the method exists. A no-op stub in
createField's failure object (field.js:678–682) would also be neutral, but it is wider: it makes a non-ok field look
partly alive to future code. Do not stub.

**F7 (LAUNCH / OPERATOR→BOX block ~0.2 s in `wellPacket`) — CONFIRMED (+): a bit-identical, still-synchronous 3× exists
(answers F's open question 2).** `wellFromTable` recomputes the following for all 91 labels at every grid point:
- hypot, atan2 and sqrt of the same point;
- a spherical Bessel for 91 labels, when only **21 distinct (n, l)** exist (the m's share k);
- the Legendre polynomial for 91 labels, when only **21 distinct (l, |m|)** exist;
- a fresh {re, im} object per label.

`wellpacket-cache.mjs` evaluates each distinct factor once per point with the same expression and multiplies in the same
order: norm · j · st^|m| · D, then · cos/sin(mφ). Result: **395 → 123 ms, 3.0–3.3×**, `Object.is` on all 91 re, 91 im
and `captured` for 3 packets. The mathworker's `packet` op (the bow) gets the same 3× for free. This keeps `LW.enterBox`
and `LW.launchPacket` synchronous, which F's §4 wants. Do it first; F7(a)'s async road then covers what is left.
Effort S (well.js only).

**F8 (REBUILD dropped during an export) — CONFIRMED.** Field side: the REBUILD that runs after unlocking reaches
`setResolution`, which destroys and recreates the textures. That is the state the user asked for, and no readback is in
flight once `exportLocked` is off. render-exact's H2 (governor) and H9 (interloper) pins are untouched, because no rAF is
armed during the lock.

**FB11 / F12 (busy flash at GPU-bound cadences) — NARROWED.** The named scene (128³ gas, 2–8 fps) runs at about 70 fps on
this desktop after FA1+FA2. F's GLASS 128³ at scale 1.5 is FA8's litAt cost. The defect is real where a frame genuinely
exceeds 250 ms (phone, iPad, glass at 2×), so keep the fix, but it is a smaller problem than both audits state.

**FB5 (refreshOcclusion while the UI is hidden) — CONFIRMED (+), the stronger form.** The occlusion block feeds only
LINE_WGSL's discard. The corner axis binds `occNone` (field.js:811–813, `cornerBind`), so the block is read by no pixel
whenever `mat.frame === false && (mat.axis === false || mat.axisMode === 'corner')`. The UI-hidden state (toggleUI sets
frame = axis = false) is one case of that. It is also the case when the user turns FRAME and AXES off with the UI shown.
- CHANGE: gate the loop's refresh on "an occluded line is drawn", and set `occludeDirty` on the edge where lines come back
  (setFrame / setAxis / the segments).
- NEUTRALITY: identical, because no line draw reads the block. Check: `linePixels` over an off → on round trip.

**FB2 / F5 (perf.median is the last frame) — CONFIRMED by code read.** rack.js:1213 zeroes slot `frames % 60`, :1245
increments `frames`, and :1363 writes slot `(frames+1) % 60`, which the next frame's head zeroes. Only one slot survives.
None of my AUDIT-A claims read `perf.median`: FA7's live numbers use the `perf.profile.field` EMA. The `loopMedianMs`
column in `probes/A/lines.out.json` is a last-frame read and is not cited.

**FB12 — MERGE with FA9.** Both find the `[0,0,0]` per centre-less mode at field.js:608. It rides FB6.

**FC4 (the field's own ceiling) — NARROWED with numbers.** At boot the lab presents the PHASE view:
- phase 4.93 ms at 96³ (the 3.8 ms quoted is density, cloud); the gas is 48 / 113 ms in FF but 30 / 70 ms in Chromium
  (the 50–117 quoted is FF only);
- after FA1–FA3: phase 3.24, density 1.83, gas at 128³ about 8 ms, and GLASS stays about 10.9 ms (FA8).

C's §5 Q2 answer: GLASS's 11 ms is the ceiling only when GLASS is chosen; the shipped cloud style is 2–5 ms.

**FC2 (the glass bill) — CONFIRMED; a context note for ranking.** C's GPU-load generator is GLASS 128³ at 240 steps. On
my replica GLASS is litAt-bound: 11.3 ms at 96³ / 160 steps, about 17 ms at 240, consistent with C's 49.9 fps UI-hidden
frame. Per-layer prices are additive, so the method holds. Two consequences for Josh's menu:
- In Firefox at the default style after FA3, the frost (7.4 ms, 18 layers) becomes the largest GPU item in the frame,
  above the field (1.8–3.2 ms). That raises J1/J2's relative value.
- At DPR 2 the present grows 3.83× (my 2× target: 14.08 vs 3.68 ms) while WebRender's per-layer cost stays flat, so on
  retina the field dominates again.

**C's "FRAME's cost is the GPU line pass (lane A)" — REFUTED.** GPU present at n = 1000:
- off 3.62, box 3.61, dots 3.62, lattice 3.81 ms, so lattice adds 0.2 ms and dots/box add nothing;
- the real cost is main-thread regeneration plus an 0.8 MB upload on every camera-moving frame: lattice 0.67 ms, dots
  0.45 ms (FA7, `lines-cpu.out.json`). Still camera: zero uploads.

Josh's "Frame is expensive" does not reproduce at DPR 1 on this desktop in either the GPU or the DOM path. The iPad
(upload bandwidth, DPR 1.5) remains a lead.

**FE6 — CONFIRMED for my files.**
- `tablet.DPR` is unread, and syncPhone hard-codes 1.5 at rack.js:4891. Reading `tablet.DPR` gives 1.5 either way, so it
  is neutral.
- `gov.since` is written at rack.js:1238–1240, read nowhere, and absent from `LW.governor`, so CUT is right.

**FE9 — CONFIRMED neutral.** Skipping `tick('molecule')` while `!molecule.on && !(h2 && h2.on)` is safe: `molecule.update`
returns anyway, and `modesAt`'s `molecule.on` branch (rack.js:985) is untouched.

**FE12 / README's field numbers — CONFIRMED (+).** The README's 3.06 / 3.89 ms figures are from 2026-09-02. Today's
baseline numbers below a quarter of a millisecond are themselves Firefox's 100 ms completion tick (FA5). Quote the
interleaved ≥ 2.5 s-batch figures from `probes/A/*.out.json`.

Not assessed (outside the renderer): FB3, FB4/F10 (a policy choice; A has no stake), FB8, FB9/F15, FB10, FC3, FC5–FC8,
FD4, FD5, FD7–FD10, FE1–FE5, FE7, FE8, FE10, FE11, F2 (the period scans, whose exactness-preserving speed-up I have not
measured), F3, F4, F9, F13, F16.

## 2. Ranking — top 10 across all six audits (measured gain ÷ risk)

0. (Prerequisite, not ranked) **FB2/F5** perf ring fix and **FA5** ≥ 2.5 s batches: every later number depends on them.
1. **FD2 = F1** · ladder on restore: −420 ms … −1.4 s per project or link open; neutral (proved); S.
2. **FA2** · early-out plus memoised kernel: gas 2.5×, box 2.2×, hydrogen −24 %; 0 texels differ in both browsers; S.
3. **FD1** · gpu-boot: cold ready −363 ms (headed FF) … −520 ms (headless); neutral (digest, limits); S, with the §1
   Node-safety fix.
4. **FA1** · gas Hermite table: 128³ gas 113 → 8 ms (8 → ~70 fps); texels closer to exact; ≤ 0.02 % of pixels ±1 level;
   M; law-1 argument needed.
5. **FA3** · specialised present: −50 % on cloud, −34 % on the boot phase view; bit-exact on the default style; M.
6. **FB1 = F11** · gas.stats factorised: 9 → 0.35 ms; land with FA1; S.
7. **F7 via the cached wellPacket** (this round): −270 ms per LAUNCH / →BOX press; bit-identical and synchronous; S.
8. **F3** · period-scan coalescing: removes a jam of more than 2 minutes; a bug fix; S.
9. **F6 (L6, method-test form)** · the no-GPU boot works; a break fix; S.
10. **F2** · the CAPTURE hover async plan: −0.46 … −1.0 s per hover on the BOX; S–M.

Runners-up, all S and neutral: FB3 (1 Hz closed-window repaint), FB5 (occlusion gated on drawn lines), FE3 (double
rebuild on open), F8 (the dropped REBUILD), FB6 (with FA1), FD6 (with FA1), FD7 (paintMarks batching).

## 3. Missing (nobody found these)

- **gpu-cleanup.test.mjs extracts field.js functions by SOURCE TEXT** (tests/gpu-cleanup.test.mjs:3–40). It pulls
  `throughput`, `readPixels`, `linePixels`, `sampleVoxel`, `fieldDigest` and `readStats` and injects a fixed list of free
  names: `makeRenderPipeline`, `writeView`, `writeLines`, `drawChrome`, `renderBind`, `encodeCompute`, `out`, `canvas`,
  `DEFAULT_BG`, … Any FA3 or FA1 edit that gives those functions a new free identifier (for example
  `specRender(view, style)` inside `throughput`/`readPixels`) throws a ReferenceError there. Route specialisation through an
  injected name (keep `out._rp` as the selector's cache) or extend the test's injection list in the same commit. This is a
  RISK on my own FA3.
- **createField awaits `getCompilationInfo()` for 6 modules one after another, and compiles the 3 chemistry pipelines at
  boot although chemistry ships off** (field.js:753–761). A `Promise.all` over the compile-infos, keeping messages in module
  order, is neutral. So is building each molecular pipeline on its first `setMolecule`. D measured compile-info at
  19–24 ms in Chromium and 6 ms in FF. Lead, gain unmeasured; once FD1 lands it is part of the createField remainder.
- **The occlusion block is dead whenever no occluded line is drawn** (FB5's stronger form, §1). This includes FRAME and
  AXES both off with the UI shown, not only H.
- **FD3's `field.ok` guard is not neutral after a device loss** (field.js:698 flips `ok`). Take F6's method test.
- **Sequencing:** FB6's packed-bytes proof → FA1's row → FB1's factorisation, as one gas.js wave with one digest lock
  (§1).

## 4. Not now

- FA8 (a GLASS gradient volume or cutoff) and FC3 / J1–J8: look changes for Josh.
- FA4 (b)/(c) governor redesign (a cost split, one controller). Keep FA4(a), the AUTO SCALE reset on pause, as a proposed
  bug fix.
- An occupancy / brick skip: measured as a loss or a pixel change (AUDIT-A §3). The BRIEF's L4 energy-group volumes:
  architecture.
- FB4 / F10 re-probe policy, F9 helium async, F4 chemistry worker split: correct but M and behavioural. They are their
  lanes' calls; A has no stake.
- rack.js seams (AUDIT-E §6) beyond blocks 1–9, and FD8(b), the MIR shell migration: their own waves behind the full gate.
- F13 (the K key through the worker): kick.js is outside my files. I did not measure a bit-identical speed-up there. The
  pattern that worked for `wellPacket` (21 distinct radials instead of 91) is worth a look by lane F.
