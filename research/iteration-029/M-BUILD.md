# 029 M1 · M5 — BUILD (Opus, 2026-10-30)

Tree: yan-c `c1aed92f` (M0 merged) plus this branch. The probe is `tools/perf/mod-profile.mjs`, the same command before and after
(headless Firefox, 1920 × 1080, scenes a · c · e, 30 s each, `--audio` = the optimization worktree's `media/star.mp3`, read only).
The raw records are `.tmp/mod-profile/before.json` and `after.json` (not committed). The BEFORE run used the base `lab/look.js` and
`lab/windows/settings-card.js`, with nothing else changed.
The one tool change: the probe now also counts target writes **by id** (`writesById` in the summary, `byId` in the raw record).
That count is what M5's answer stands on.

## M1 — STAGE RE-INKS ONLY THE HEADER λ (built)

**What moved (app side only, no kit edit).**
- `lab/look.js` gets `paintInk()`, which re-asks the header λ's ink and nothing else. It uses the kit's own public law,
  `accent.markInk(0, stageGround())`, through the same gamut function the kit was handed (`gamutCss`), and writes `#title .lam`.
  - It keeps `paintMarks`' two guards: inside a batch it only marks dirty, and if the wheel moved it does a full `applyAccent`.
  - The nine squares (`wheelColor(k·40)`) and the notebook's λ (CARD ground) do not read the stage. The stage no longer touches them.
- `lab/windows/settings-card.js`:
  - `setStageMix` calls `look.paintInk()` in place of `paintMarks()`.
  - `app.hooks.setStage` returns at once when the clamped value equals `app.state.stageMix`. It sets no knob, does not recompute
    `mat.bg` and schedules nothing.
  - The idempotence uses the **exact** value, not a rounded one. Rounding would quantise `mat.bg` under a modulated STAGE, and
    that is a pixel change.
  - Theme, colour and FOLLOW changes still go through `setStageMix` directly, so `mat.bg` stays coherent with every input.
- One assertion added to `tests/official-defaults-palette.browser-test.mjs`. With FOLLOW THEME off, STAGE goes 0 → 1, and the test
  checks three things:
  - the header λ's colour moved;
  - it equals what the kit's full `paintMarks` then writes;
  - every square's fill and the notebook λ are unchanged across both writes and the full paint.

**THE NUMBERS (before → after, same probe, same scene).**

| scene | tick p50 / p95 ms | loop JS p50 / p95 ms | JS ms/s | target writes/s | DOM mutations/s | mutations/frame p50 |
|---|---|---|---|---|---|---|
| **c** WAVE DANCER + AUDIO live, window open | **5.44 / 7.82 → 1.40 / 5.00** | 7.10 / 9.38 → 3.74 / 6.80 | **69.6 → 41.6** | 33 → 33 | **4,378 → 1,825** | 468 → 189 |
| **e** stress (59 routes, 3 nodes, CURVES) | 20.52 / 24.76 → 18.42 / 21.00 | 41.36 / 45.76 → 38.92 / 42.92 | 90.9 → 83.8 | 114 → 112 | 2,990 → 2,308 | 1,385 → 1,106 |
| **a** WAVE DANCER, window closed (0 writes: the control) | 0.46 / 2.70 → 0.44 / 3.86 | 1.12 / 3.42 → 1.10 / 4.16 | 17.9 → 18.3 | 0 → 0 | 89 → 91 | 1 → 1 |

- **The price of one `material.stage` write** (the probe's forced write, median): **1.74 ms JS / 1.90 ms with layout → 0.04 / 0.20 ms**
  (scene c). In e: 2.24 / 2.28 → off the top eight.
- **Scene c's mutation regions per second.** `#title`, `#busyMark`, `dev:projects`, `dev:informational` and `dev:chem` were each
  84/s (the λ marks) and are now gone from the table. `dev:settings` 102 → 19, `dev:observer` 127 → 44. The modulation window is
  unchanged (1,682 → 1,696/s), and it is M3's.
- Scene a moved within noise (it writes nothing). Its tick p95 3.86 against 2.70 is the one-frame tail of a 12 fps headless run.
- The Firefox frame rate is the compositor's (9.3 → 9.4 fps in c) and is not the number.
- M0 projected c's tick at ≈ 3.4 ms. It measured **1.40 ms**, because `paintMarks` also drove the card repaints the tick waited on.
- Josh's 120 Hz screen (headed Chromium) was **not** re-traced: that is M4, which needs Josh's yes. M0's estimate stands until then:
  −141 ms/s, −1.3 ms per frame.

**FOR-MIR (kit-door builder):** `accent.paintInk()`, an additive door in 1.5.6-alpha.N, on `createAccent`'s return. It is the header
λ's half of `paintMarks` alone: `#title .lam` re-inked by `markInk(0, stageGround())` through `gamut`, with no squares and no turn sheet.
With it, look.js's `paintInk` body becomes one call. Until then the app reaches only public names: `markInk` is on `createAccent`'s
return, and `gamut` and `stageGround` are look.js's own options.

## M5 — DISCRETE TARGETS WRITE ONLY ON A STEP (already in force; no code moved)

The step gate this row asked for is already in place, at two levels:
1. **The registry.**
   - `palette.index`, `material.style` and `material.view` are `map: 'integer', step: 1`.
   - `applyModulated` snaps first, then suppresses a value `Object.is`-equal to the current one (`lab/mir/modulation/registry.js:373`).
   - So the adapter is called only when the snapped step changes.
2. **The adapters**, for the forced transport edges (`applyAll(true)`). Each one already compares with the value in force:
   - STYLE: `mat.style === STYLE[s]`
   - VIEW: `mat.view === VIEW[w]`
   - PALETTE: `P.id !== q.id`

**The number.** Scene e, before: 69 ticked frames in 30 s.
- Every continuous target published 70 times.
- `palette.index` published **37** times, `material.style` 13 and `material.view` 3. Each one is a real step, and each step changes
  the picture.
- M0's "2.6 ms / 19 ms" for `palette.index` is the price of a **real** palette change. Its probe forces writes alternating ±0.05,
  which crosses a step of a 20-odd-entry list. It is not the price of a repeated write.
- Gating the act again would save nothing. A second compare would be the gate code Josh's dial forbids.

**`shell.rate.n*` is not discrete.**
- It is a `log` map (0.25…4×) whose value moves on every tick under a route.
- Its setter already writes only labels whose rate differs (`rates[s.index] !== v`).
- Its cost (n7 0.76 ms, n6 0.54, n5 0.40 per write) is `api.setRate` per label. Each call runs `reg.setEnergies` over the whole basis
  and re-sets SPECTRUM's status, so n7's 49 labels do 49 × setEnergies.
- Snapping it would change the physics clock. The honest speedup is one `setEnergies` per shell write: a batched rate door on the
  controller's api.
- **Left for a later row:** that is a new function, not a gate.

## THE GATES

- `node tests/pwa.test.mjs --write && ./test.sh node`: **ALL GREEN** (254 PASS lines; flash-routes, state-scopes and hints-census
  inside). `lab/sw.js` was rewritten by `--write` only.
- **THE LOCK** on this tree's own server (9817 / GD 5817, pid stopped at the end):
  - `--query gastab=0`: **843 values · 0 readback differences · 0 record-byte differences**, unrepeatable none, page errors 0.
  - with `--fixture research/release-0.4.0/measure/digest-lock-s4a.json`: **987 · 0 · 0**, unrepeatable none.
  - No leaf moved and none was re-captured.
- Browser suites, one at a time on the same server:
  - `official-defaults-palette`: 4 PASS, the new M1 row included.
  - `routed-knob`: 0 failing of 7.
  - `curves`: GREEN.
  - `lfo-tension`: PASS.
  - `render-regressions`: PASS.
  - `stage-text`: GREEN (the λ against the ground; M0's proof list).
  - `node tools/x-probe.mjs x4`: CURVES `identical: true`, 5,411 bytes.
- `node tools/rack-deps.mjs --classes --no-write`: **HOLDS** (HINGE: persist at 24 of 25; bare cross-scope writes 0).
  - No shared name moved. `paintInk` is a new member of the look object, not of the `app` literal.
  - settings-card no longer destructures `paintMarks`.
  - No import changed, so the dependency-cruiser cycle count was not re-run.

## WHAT WAS LEFT, AND WHY

- **M5's code**: none was needed (see above). The batched shell-rate door is a candidate row; it is new machinery, so it is not taken
  here.
- **The headed Chromium re-trace of c**: M4, Josh's yes. Firefox's per-tick and mutation figures are the proof here.
- **The kit's `accent.paintInk()`**: the FOR-MIR line above, for the kit-door builder (M2/M3 are theirs). `lab/mir/**` is untouched.
