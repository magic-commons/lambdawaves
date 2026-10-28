# 020 L — PLAYBACK LOCK (Opus builder, worktree agent-a8276ba84b7c95717, branch it020-L, BASE 861a5ef)

## L1 THE LOCKED CLOCK — 3c70b19
- `lab/clock.js`: `clock.hz` (0 = WALL, byte-identical road; > 0 = LOCKED: `advance()` adds exactly `rate/hz`, ignores the wall Δt, keeps
  `_wall` current so an unlock never jumps). play / pause / scrub / step / reset untouched.
- `lab/rack.js` loop: `lockHz = fieldRate.lock ? (fieldRate.hz || 1000/fieldRate.refreshMs()) : 0` → `clock.hz`. While locked AND playing a
  rAF advances only on a `1/hz` accumulator tick (`lockDue += stepMs`, 2 ms early tolerance; more than one step late → re-anchored to now,
  never caught up) or, when the GPU is behind (`field.inFlight >= field.inFlightCap`, S2's cap), waits; a waiting rAF carries its ask whole
  into `pending` (the PACE idiom) and leaves t alone. DISPLAY (hz 0) = every rAF, a step of the frame budget's learned refresh.
- AUTO SCALE + grid rung hold: `const d = clock.hz ? (autoQ.presented = 0, null) : controlStep(...)` (keyed on `clock.hz` so
  tests/auto-scale.test.mjs' sliced loop runs unchanged; the window restarts on release). The pause edge is untouched.
- `lab/field.js`: `jitterPin` + `field.pinJitter(on)` (rack calls it once a loop with `lockHz > 0`); `writeView` reads
  `(jitterPin >= 0 ? jitterPin : presents % 97) / 97` — pinned to the seed of the first locked present; wall unchanged (call 7 default).
- `lab/shell/controller.js`: `fieldRate = { capMs, lock: false, hz: 0, refreshMs: () => frameBudget.milliseconds('120') }` — no new `app` key.
- The film's road (render-exact.js), FIELD CLOCK cap and the pause edge untouched.

## L2 THE PANE — e34a57f
- `lab/windows/settings-card.js` createFieldQuality: row `.lw-playback` — CLOCK `WALL | LOCKED`, CADENCE `30 Hz · 60 Hz · 120 Hz · DISPLAY`
  whose label carries the step's ms ("CADENCE · 16.7 ms", ASIO's Buffer Offset, visible under LEAN), LATENCY readout (LOCKED "16.7 ms" /
  "60 Hz · 16.7 ms a step"; WALL "display"; hidden under LEAN like RENDER SCALE). Hints on every button; a Playback note. Words via the
  kit's `seg`/`readout` (→ `label()`); the dynamic one via `label(kl, 'CADENCE · {ms} ms', { ms })`.
- `lab/shell/settings.js`: save `playLock` / `playHz` (written only when not WALL · DISPLAY, so an untouched blob's bytes never move);
  apply → `fieldRate` + `ui.showPlayback()`. `docs/STATE-SCOPES.md`: one PREFERENCE row.
- METERS: rates sub "LOCKED 60 Hz · scheduled" (`meters.js`, `meterSnapshot().lock`); governor "LOCKED 60 Hz · nominal · — ms · 64³".
- Checked in a page: LOCKED + 60 → blob `[true, 60]`, `clock.lastDt` = 4/60 to the bit, both readouts say LOCKED, a reload restores
  LOCKED · 60. Shot: `L-shots/L2-playback-pane.jpg`.

## L3 THE PROOF — `tools/perf/play-lock-probe.mjs` (a diagnostic; `--headed --sec --res --preset --out`)
Per present `[nowMs, clock.t, Δt, presents, autoScale, canvas.width]`, 10 s each, preset 1s+2pz. CV = σ/mean; "late" = present interval
> 1.5 × its median. Headless's ceiling is the compositor's (017 P0: rAF ≈ 30 Hz there), not the GPU's.

| run | mode | presents/s | Δt CV | Δt > 1.5×med | canvas reallocs | interval CV · late · max |
|---|---|---|---|---|---|---|
| headless 64³ 1600 px | WALL | 32.8 | 0.581 | 45 | 4 (scale 1 → 0.35) | 0.579 · 45 · 100 ms |
| | LOCKED 60 | 28.4 | **0** (one value, 4/60) | 0 | 0 | 0.684 · 55 · 117 ms |
| | LOCKED DISPLAY | 29.7 | **0** (4 × 16.16 ms) | 0 | 0 | 0.636 · 50 · 101 ms |
| headless 128³ | WALL | 32.8 | 0.524 | 34 | 10 (1 → 0.35, back to 0.7, …) | 0.522 · 34 · 100 ms |
| | LOCKED 60 | 29.3 | **0** | 0 | 0 | 0.644 · 52 · 199 ms |
| | LOCKED DISPLAY | 30.6 | **0** | 0 | 0 | 0.564 · 48 · 117 ms |
| HEADED 64³ 1865 px, panel 119.93 Hz | WALL | 84.1 | 0.391 | 13 | 0 | 0.568 · 10 · 180 ms |
| | LOCKED 60 | 58.6 | **0** | 0 | 0 | 0.470 · 27 · 158 ms |
| | LOCKED DISPLAY | 80.9 | **0** (4/120) | 0 | 0 | 0.790 · 30 · 233 ms |

GPU per frame (`__LW.gpuFrameMs(24)`): 64³ 8.25 ms headless / 8.36 ms headed (reconstruct 4.18, march 8.35); 128³ 6.33 (recon 4.19).
- WALL is the stutter Josh saw: t steps 57–98 different sizes in 10 s (CV 0.4–0.6) and, headless, AUTO SCALE reallocates the canvas 4–10
  times in the first seconds. LOCKED: one Δt to the bit, zero reallocations, the seed pinned.
- THE RING (call 6): the reconstruct costs ~4.2 ms of a 16.7 ms step — it never misses the cadence on its own. LOCKED 60 headed missed
  ~14 of 600 ticks (27 late presents, the longest 158 ms): stalls of the whole frame (the night run shares the card), which a look-ahead
  volume would not fix. Not built. Molecules (128-AO packets, the worker-paced RT) were not measured — the case where it could matter.
- DISPLAY steps by the frame budget's refresh, which is the PANEL's (floor 120 Hz): on this 120 Hz panel the loop presents ~81/s, so
  LOCKED DISPLAY runs time at ~0.67 × — the law ("a missed frame slows time"), but for a recording on this box 60 Hz is the choice.

## Tests (own gate 9677/5677, ONE browser of mine at a time; the night run's Firefox untouched)
`./test.sh node` green (after each row, `pwa --write`); `rack-deps --classes --no-write` HOLDS (spectrum 25/25, 0 bare writes);
`new-project --check` in step, `tests/new-project.test.mjs` GREEN; browser: new-project, history, field-law 9/9, start 3/3 GREEN.
THE LOCK `--check --query gastab=0`: final run **843/0 GREEN**; two earlier runs showed only `*.repeat` flips (momentum@96, oscillator@96)
— the untouched base (yan-c, exported to /tmp) flipped momentum@128 the same way under the night run, so they are the shared card.
`tests/lw-facade.browser-test.mjs` RED on the BASE's own `nodes` member (chain T's NODES button) — not L's; the facade needs `--write` at merge.

## CLAUDE.md sentence (for the close)
PLAYBACK LOCK (iteration 020 L, SETTINGS › FIELD QUALITY › PLAYBACK; PREFERENCE `playLock`/`playHz`, off by default): under LOCKED the
loop presents on a 1/CADENCE tick (DISPLAY: every rAF) and `clock.advance` adds exactly rate/hz per present — a late or GPU-held frame
slows time, never skips it — while AUTO SCALE and the grid rung hold and the march's jitter seed is pinned (`field.pinJitter`); WALL is
the old clock byte for byte; `tools/perf/play-lock-probe.mjs` measures both.

## Open questions for Josh
1. DISPLAY on a panel the field cannot keep up with runs time slow (0.67 × here). Keep, or make DISPLAY step by the measured present rate?
2. Call 5's alternative (LOCKED while RECORD is armed) not built; say if you want it.
3. The ring: measure a heavy molecule under LOCKED 60 before deciding (the probe takes `--preset`).
