# REFUTE F · breaks, hitches, robustness · the cross-refutation round · 2026-09-24 · Opus 5.5

Read whole: AUDIT-A, -B, -C, -D, -E. For each change that touches my lane the question is: what can throw, race, or strand
state? New probes (`probes/F/`, GD_PORT 5236; `lab/` and `tests/` untouched): `lab-lostearly/` (lab/ symlinks + a
`field.js` with ONE added line, `device.destroy()` right after `requestDevice`) run by `probe-f-lostearly.mjs` (Firefox)
and `probe-f-lostearly-electron.mjs` (Chromium 152); `gas.setRadius` / `well.setRadius` timed in node. Code reads:
modwindow.js 2911–2931/3067, lab.css 462–463/525/531/962, field.js 682–757/1402, ladder.js, the tests that read the ladder.

## 1. Lane D

**FD1 (early adapter/device from <head>) · RISK, measured. A device lost before createField finishes is mishandled today,
in two different ways, and FD1 widens the window for it.**
`field.js:698` registers `device.lost.then(() => { out.ok = false; … })`. Then `createField` awaits `getCompilationInfo`
six times (757), and only after that runs `Object.assign(out, { ok: true, … })` (1402).
- **Chromium** (`probe-f-lostearly-electron`): `field.ok: true` with `error: "device lost: Device was destroyed."`. The
  success assign overwrites the lost flag. Every `field.ok` guard in rack.js now passes on a dead device, and
  `readPixels` throws "The Device was lost before mapping was resolved".
- **Firefox** (`probe-f-lostearly`): `getCompilationInfo` on the dead device reports errors, so `createField` takes the
  WGSL-error early return (759). That is the method-less object, so boot dies at `syncPhone` (rack.js:4891): LW.ready is
  false and the result is L6.

Today the window is the ~6 ms compile stretch. With FD1 it becomes "device resolved → createField reaches line 698",
i.e. the module-graph time: ~0.5 s here, longer on a phone or a backgrounded iPad.
REQUIRED WITH FD1:
- (a) a local `lost` flag, and `ok: !lost` in the final assign. Better still, gpu-boot.js attaches `device.lost` itself
  and passes `{ device, lost }` on, so no loss goes unobserved.
- (b) land F6/FD3 (the setDprCap guard) first.
- (c) make `gpuBoot()` single-use: hand the promise out once, then null. A second `createField` then requests its own
  device, and one field's `dispose()` (`device.destroy()`) can never kill another's.
- (d) keep the three error strings. Note that a rejected `requestAdapter` already maps to "WebGPU device request failed".
- (e) field.js now imports gpu-boot.js, so if that module fails to load the whole boot fails. Keep gpu-boot.js
  dependency-free, precached (`pwa --write`) and a wiring root.
Gate: probe-f-lostearly in both engines must show `ok:false` plus the lost banner, and LW.ready must be true.

**FD2 vs F1 (the LADDER in restore) · MERGE into FD2 (D owns), minus its `if (active) compute()` branch.**
Both find the same 414–422 ms (Firefox), rising to 1.46 s at nbar 42. F1's separate `load()` is unnecessary.
FD2 keeps `set()` synchronous for an OPEN card. But the card's own knob road on an open card is already asynchronous:
`schedule()` → `arm()` → `prepare()` → the worker (ladder.js:52–70). So the active branch keeps a 0.42–1.5 s freeze on
every project open made with LADDER visible, and buys nothing a knob edit does not already accept.
Make `set()` = `Object.assign; ui[k].set; clockFx(); schedule()` in both states.
Readers stay correct:
- `get last()` computes on demand when dirty.
- current.browser-test.mjs:24 awaits `ladder.prepare()` before reading `computed`.
- :173 asserts params only.
- the legacy gate reads the clockFx slots, which `set()` still paints synchronously.

**FD3 = F6 · MERGE.** Either guard fixes both no-GPU paths, and the early-lost Firefox path above. My
`field.setDprCap && …` form keeps a lost-after-boot device (whose object still has its methods) byte-identical to today.
`if (field.ok)` skips the cap write on that path. That is harmless, but it is not the neutral form.

**FD5 (skip layout while closed) · NARROWED to (a)+(b); (c) is neutral but fixes nothing.**
- (a) is safe on every road I could find:
  - first open: `open()` runs `rebuild(); place(); paint(true)` (modwindow.js:2911–2916).
  - `restoreModulation`: `modView.rebuild()` while closed, then `restore(pr.modwin)`, which calls `open()` or `close()`
    (2908–2909).
  - a resize while closed: `root.hidden` means the modwindow ResizeObserver gets no entries, and open re-places.
  Prefer FD5's narrow guard (skip only the device loop's geometry; `g.sig = ''` forces a repaint on open; `paintRings`
  and everything else keep running) over FE2's "only paintRings while closed". The rings on the house knobs must keep
  drawing, and the narrower cut leaves every other write alone. FD5(a) and FE2 are one change (MERGE, D owns).
- (c) moleculeview: `paint()` already returns at `W < 32` on the hidden card, so skipping it is neutral. Note that both
  today and after the change, a legacy save that REVEALS the card (rack.js restore, `wMol.root.hidden = false`) leaves
  its plot blank until a resize or a knob move. That is pre-existing.

**FD6 (lazy createGas) · CONFIRMED (+), and the bigger win is not the boot.**
`gas.setRadius(v)` runs on every `onInput` of the WELL RADIUS knob (rack.js:2155), and it rebuilds all 256 radial rows:
**22.2 ms median, 34.4 max per pointermove** (node, 10 moves). It does this with the gas off and under any operator.
`well.setRadius` costs 0.009 ms. The knob sits in SPECTRUM (open by default), so every drag of it is a 22 ms-per-event
stall. FD6's "setRadius marks dirty" removes it. restore() pays it once when a file's radius differs.

**FD7 (paintMarks batch) · RISK.** Release the batch depth in a `finally`. restore()'s catch (rack.js:5447) would
otherwise leave the batch open, and the λ marks would never repaint again.

## 2. Lane A

**FA1 (tabulated gas radial) · RISK × 2, plus a safer shape.**
- (i) The row index must be the MODE index (`l·16 + n_r`, `build()` order) stored on the persistent per-mode record.
  It must never be the position in `fieldModes`' output: modes under 1e-7 are skipped (gas.js:76), so a symmetric
  packet shifts every later row. Add a node pin: every emitted record has `lag[3] === M.l*16 + M.nr`, and table row m
  matches `rnorm·sphj(l, z·u)` at three u.
- (ii) First use: FD6-lazy build (22 ms) + table (26–38 ms, A's number) + `gas.launch` (13–23 ms, F7) add up to
  **~60–80 ms on the first AXIAL press**, where today the boot pays 14–18 ms unseen.
- Shape: build the table in the maths worker (pure gas.js; 512 KB transferred) or in idle slices armed when OPERATOR =
  BOX. Give records a not-ready sentinel (`lag[3] = −1` → the recurrence branch), so no frame waits and no frame reads an
  empty table (zeros would paint a blank gas). The swap when the table lands moves ≤ 1 level on ≤ 0.02 % of pixels (A's
  own bound).

**FA2 (memo across modes) · CONFIRMED, with a wider digest lock.**
Every memo key is the exact input of a pure function:
- centre → q, r, ct, st, φ;
- (centre, l) → P_l;
- (centre, mm) → e^{imφ};
and every one resets on a centre change.
The one hole I could construct: `-0 == +0` passes the key, but `pos − ctr` can flip the sign of a zero component, which
gives atan2 ±π. No shipped producer mixes ±0 centres: H₂/H₂⁺ use `[0, 0, ±R/2]` (+0 in x and y); helium shares ONE
`x1` array; eigen records take packModes' `[0,0,0]`. H₂ alternates centres A,B,A,B, so its memo recomputes every record:
no gain, no harm.
FA2 measured hydrogen, box and gas only. Its lock must add momentum (space 1), the oscillator (2), helium (4), H₂ (5),
quarkonium (6), a Sturmian state and legacy H₂⁺.

**FA3 (specialised render pipelines) · RISK × 3.**
- (i) A rejected `createRenderPipelineAsync` must mark that (view, style) key failed and keep the generic pipeline.
  Never re-request per frame: that is a compile storm.
- (ii) Determinism. render-exact renders twice and compares bytes (render-exact.js:1194), and capture promises
  byte-identical pictures. On the lit/additive combinations where A measured 1–2 differing bytes, a specialised
  pipeline that resolves between two runs flips bytes. A run must pin one pipeline (await the specialised one, or force
  the generic).
- (iii) A lost device rejects every pending compile. That is covered by `field.ok`, once `field.ok` is honest (FD1 (a)).

**FA4(a) (reset autoScale on the pause edge) · CONFIRMED as a bug fix.** It is the sibling of the grid/step restore at
rack.js:1244; a paused picture held at 35 % is a stranded state.

## 3. Lane B

**FB1 = F11 · MERGE (B owns: the factorisation, 26×).** **FB2 = F5 · MERGE** (same one-line slot fix; B's extra
whole-loop ring is a good addition). **FB4 = F10 · MERGE.** **FB6 = F14 · MERGE** (B owns). **FB9 = F15 · MERGE** (B's
condition with `|| !maths.ok` is the right one). **FB11 = F12 · MERGE.**

**FB3 (skip modView.sync on a refused LINK play) · CONFIRMED.** The host refuses before touching `playing`, so the
skipped `sync()` would have repainted identical state. It is also the prime suspect for FC8's play-edge gap (see §5).

**FB5 (occlusion under UI hidden) · NARROWED: the constant is `[]`, not "#keysheet only".**
- Under `ui-hidden` every element the burst measures is `display: none`: rack, rackL, transport, sheet and both lists
  (lab.css:463); notebook and floats (525); keymap (962).
- `#keysheet` does not exist (FE5: `getElementById` returns null).
- The exact result is therefore `setOcclusion([])`, with no reads at all.

**FB7 (one throw kills the loop) · CONFIRMED + the policy (lane F owns it).**
rack.js:958 arms only `if (!rafId && !inLoop)`, so a single exception anywhere in the frame means no frame ever again.
The fix:
- `try { … }`
- `catch (e) { report once per distinct message to __e and the console }`, because a throw that repeats every frame
  must not flood;
- `finally { inLoop = false; re-arm only on the normal tail condition }`.
`pending` was consumed at the top, so the thrown tier is not retried. That is acceptable: the next ask re-raises it.
Gate: a probe that makes one reader throw once, then asserts `stats.frames` keeps rising and `__e` gains exactly one
entry.

## 4. Lane E

**FE1 (menu rows call functions) · RISK.** `el.click()` isolates listener exceptions: dispatch reports them and returns.
So today the row's close/focus code after `clickTrig` always runs. A direct call propagates instead, so wrap every row
action in a `try { … } finally { close menu, restore focus }`. `runAction(id)` must pass `fine = 1` (`a.run(1)`).
"CLEAR the register" is Josh's call (E §5-1).

**FE3 (expand: open() without wake()) · CONFIRMED.** `wake()` = `rebuild(); paint(true)` (modwindow.js:3067).
`open()` = `setPresentationActive(true)` (rack.js:2808) → `rebuild()` → `place()` → `paint(true)` → `persist()`, and
nothing between the two mutates the model or the registry. So nothing that wake() does is lost.

**FE2 = FD5(a) · MERGE** (above). **FE11(a) · CONFIRMED** (the same `measureRacks()` per pointermove, rack.js:4689). FE5/6/12: no risk beyond A11.

## 5. Lane C

**FC7 (the rack's slide strips the frost) · CONFIRMED mechanism; a safe fix exists, but it is a look change.**
The hide step's `visibility: hidden` is a delayed CSS transition (`visibility 0s linear .28s`, lab.css:531) that does
not depend on the opacity transition. So a slide without ancestor opacity cannot strand a painted rack. For Josh.
C's Q4: an element's OWN opacity does not make it its own backdrop root (the backdrop is composited before the element's
opacity applies), so an entering `.dev-enter` card should keep its frost. C's `.dragging` .97 card is the measured
instance. The keyframe case itself is unmeasured.

**FC8 (play-edge gap under frost ALWAYS) · a lead that merges with FB3.**
The play edge is exactly where the LINKED edge calls `modView.sync()` on the closed window: FB3's 0.73 ms burst with
~150 DOM mutations. The transport's play-button text also changes under 18 backdrop layers. Re-measure FC8 after FB3,
on a quiet GPU. Frost ALWAYS itself toggles no class at play (`frostSync` only acts under STILL).

## 6. Ranking — top 10 across all six audits (measured gain ÷ risk)

1. **FD2 (+F1, without the active branch)**: −0.42…−1.5 s per project/link open; S; neutral (P, bytes, `last` identical).
2. **FA2**: bit-identical kernel memo; gas 128³ 112.6 → 45.1 ms, BOX packet 2.2×, 91 modes −24 %; S (widen the lock).
3. **FA1**: gas 128³ → ~8 ms (14 → ~70 fps); M; inside fp16 (≤ 1 level on 0.02 % of pixels); build it off the frame
   thread, with the sentinel.
4. **FD1 + its lost-device fix + F6/FD3**: −363 ms cold boot (headed); S. Ship only as the pair from §1, never alone.
5. **F6/FD3**: the no-GPU boot works again (and the early-lost Firefox case); S; a bug fix.
6. **FB7**: one exception no longer freezes the instrument; S; normal frames identical.
7. **FB1/F11**: gas.stats 9 → 0.35 ms, the only periodic > 5 ms frame in the Box scene; S.
8. **F2 + F3**: CAPTURE hover −0.46…−1.0 s on the BOX; the scan queue bounded (it was > 120 s); S.
9. **FB2/F5**: a real median; every later decision depends on it; S.
10. **F4**: CHEM RT keeps 557 steps/s in long runs (it fell to 27), and loses a 125–153 ms stall every 2 s; M.
Next five: F8 (export drops a REBUILD) · FE1 (three broken menu rows) · F9 (HELIUM 90–269 ms) · FE3 (−15–28 ms per
modwindow open) · FD6 (+ the 22 ms/pointermove WELL RADIUS drag).

## 7. Missing (nobody filed these)

- **createField's final `ok: true` overwrites a device loss** (field.js:698 → 757 → 1402): Chromium reports `ok:true`
  on a dead device; Firefox gives a method-less object and the L6 crash. Measured (probe-f-lostearly*). This is a
  latent bug today, and FD1 makes the window wider.
- **The WELL RADIUS drag rebuilds the gas tables per pointermove**: 22–34 ms, gas on or off (rack.js:2155 →
  gas.js setRadius → build). Fixed by FD6's dirty flag.
- **Undo stops a camera fling and can strand the FREE → TURNTABLE levelling.** hWrite → restore with a non-null `pr`
  runs `camLevel.from = null; … camera.stop()` (rack.js restore, first `if (pr)` block). An undo inside the 150 ms slerp
  leaves `obs.mode = 'free'` with the quaternion half-way. Code read; a lead.
- **A revealed legacy H₂⁺ card has a blank plot** until a resize or a knob move (moleculeview paint returns at W < 32
  while hidden; nothing repaints on reveal). Code read; minor.

## 8. Not now

- FA3 on lit/additive styles (compiler-dependent bytes); FA4(b/c) governor policy; FA6 first-visit pairing; FA8 GLASS.
- FB4/F10 probe back-off, FB8 reader staggering, FB11/F12 busy-mark semantics: cadence or signal changes → Josh.
- C's J1–J8 glass menu and FC6 tablet-motion: look changes → Josh. FC7's fix is also motion → Josh.
- FD10 modulepreload (needs a real-network number); L12 lazy windows; FE10 folding reworkNative; the rack.js seam
  extractions (E §6) — after this run's neutral fixes land, one block per commit behind the full browser gate.
