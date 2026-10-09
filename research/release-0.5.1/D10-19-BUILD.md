# D10-19 · THE FLASH GUARD, the limiter half — build record (0.5.1 "Informational Update", Sonnet builder)

Worktree `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a80a622aba3ff2186`, branch `worktree-agent-a80a622aba3ff2186`,
reset to the integrator's `27eb96a` (the 0.5.0-alpha cut). Never pushed, merged or tagged. Ports 8983 / 5453.

**This row is PARTIAL, and says so.** The limiter sees exactly four parameters (`material.exposure`, `material.gamma`, `material.stage`,
`material.knee`). A fast LFO on the register's morph (`reg.morph`), a kick (`chem.kick`) or the camera can still flash a large area, and
only THE FIELD JUDGE (a 64² luminance readback per frame; a frame-path row with the lock and the pair; 0.5.x) sees that.

## 1 · The calibration (U8) — `tools/flash-calibrate.mjs`, run before any lab line was written

The kit's limiter counts swings of `delta × span` in a route's own units (`flash-guard.js:43,62,68`), `delta` = 0.1 (WCAG). So
`ranges[route] = [0, step / 0.1]` makes `delta × span` exactly the step below, in the map's own space (ln for a log route).
**The rule (the brief's, for all four):** the parameter step that moves a pixel's relative luminance L by 10 % of itself, taken where
that is also ≈ the WCAG delta (0.1 of the maximum), i.e. at the pixel/state where L is highest for that route. The shader's output `o`
stands for L (the canvas's sRGB curve is not modelled; the field judge, which reads pixels, is the exact one).

| route | map | default | step (guard space) | `ranges` | derivation from `lab/field.js` / `lab/rack.js` |
|---|---|---|---|---|---|
| `material.exposure` | log | 1 | **0.0953** = ln 1.1 | `[0, 0.953]` | `sigma = 24·exposure`, `a = 1 − exp(−wEff·sigma·stepN·4)`: optical depth τ ∝ exposure, so a thin cloud's radiance is linear in exposure and every thicker one is sub-linear. ×1.1 is the most a 10 % step can give. Checked: over τ from 1e-6 to 40 the largest relative change of ×1.1 is **10.0 %** (the thin limit) |
| `material.gamma` | linear | 1 | **0.1319** | `[0, 1.319]` | `o = pow(col + bg·bgBlend, 1/gamma)`. At mid-grey 0.5, gamma 1: 0.5 → 0.45 (10 % darker) needs γ = ln 0.5 / ln 0.45 = 0.868, Δγ = 0.1319; the lighter side (0.55) needs +0.1594, so the smaller is taken. Checked: ±Δγ moves o by −10.0 % / +8.4 % |
| `material.stage` | linear | 0.04 | **0.1131** | `[0, 1.131]` | `setStageMix`: `bg = ground + (custom − ground)·mix` (only while FOLLOW THEME is off: it is a bypass otherwise, and the default is follow ON). `Y(custom) − Y(ground)` = −0.8089 on the light ground (L 0.9152 at mix 0.04), so 10 % of L is Δmix = 0.0915/0.8089 = 0.1131: **ΔL = 0.0915 absolute**. The dark ground's whole range is ΔL = 0.10 (10 % of its own L is 0.004), so it can never be a flash and does not set the step. `bg·(0.82..1.25)` scales L and dL alike |
| `material.knee` | log | 0.6 | **0.2595** | `[0, 2.595]` | `wEff = w/(1 + knee·w)`, w ≤ 1. `dln wEff / dln knee = −knee·w/(1+knee·w)`, largest at w = 1: a 10 % change of wEff there is knee 0.6 → 0.7778 (ln 0.2595) or → 0.4545 (ln 0.2776); the smaller is taken. A thin ray's L ∝ ∫wEff, so this bounds every ray. Checked on a 160-step Gaussian ray (exposure 0.08–12, soft 0.5–1.5, peak 1–0.05): the largest relative change is **3.8 %**, so the step over-guards by about 2.7× in L and never under-guards |

Not guessed: every number above is printed by `node tools/flash-calibrate.mjs` (`steps()`), and `tests/flash-routes.test.mjs` holds the
lab's constants to `steps()`.

Notes on the conventions, for the integrator:
- WCAG's delta is ABSOLUTE (0.1 of the maximum, darker state below 0.8). The brief's "10 % of the pixel's own L" equals it at L ≈ 1 (exposure,
  the light stage) and is twice as strict at mid-grey (gamma); the sRGB curve (o is already encoded, linear L ≈ o^2.4) makes the proxy
  within a factor of about 2 of the exact measure in the bright range. "About 10 %" is what U8 asked for; the exact one is the field judge's.
- `material.stage` is inert in the default state (FOLLOW THEME on); the guard still wraps it, and it matters once the ground is chosen.

## 2 · The wrapping (`lab/mod-port.js`, +22 −2; `lab/rack.js` one line)

`guardRoutes(defs, { driven, now, say })` is exported from `lab/mod-port.js` (node loads it: its imports are the kit's host and
capture, no DOM at import) and `createModPort.install` calls it first: `defs = guardRoutes(defs, { driven: routed, now, say })`, then
`host.install(...)` as before. It wraps the `set` of the four whitelisted defs and no other. `FLASH_STEP` is the four steps of §1;
`createFlashGuard({ ranges })` takes `[0, step / WCAG.delta]` per route, so `delta × span` is the step in the map's own space.

- **Log routes in log.** `material.exposure` and `material.knee` (the def's own `map === 'log'`) hand the guard `ln v`; a hold hands
  the def `exp(held)`. **A pass hands the def the number it was given**, never `exp(ln v)` (wave 63's law: zero influence is the base,
  bit for bit; `exp(ln 0.6)` is not 0.6).
- **Held only while a modulator drives the route** (`driven` = the port's `routed`, `registry.isModulated`). A write that is not a
  modulator's passes untouched and resets the route's guard: a hand through the registry (`syncBases` writes the hand's value back with
  `registry.write`, which publishes to `set`), and `restoreBase` on a stop (the registry clears `modulated` before it publishes).
  This is a correction to the brief's bare "wrap the set": without it a restore that landed in a held second would be refused, leaving
  the picture off the base while the registry says base, and `syncBases` would then adopt the held LFO value as the user's base.
- **The clock is the modulation's own seconds** (`host.clock.stats().seconds`, advanced by `advanceTo` live and by `step(d)` in a
  film), not `performance.now()`: a film rendered faster or slower than real time must hold the same frames (determinism), and the
  rate that matters to a viewer is video time. A hidden-tab gap is clamped by the clock's `maxStep`, like every LFO.
- **The knob follows the held value.** The def's own `set` is what is wrapped and it calls `setKnob(ui.expK, v)` with the number it
  was handed, so the dial shows the held value (confirmed in the app: below).
- **The trip is said.** `onTrip` → `say("FLASH GUARD · EXPOSURE 10.0 Hz held to 3/s")` (the guard's route key is the def's label; the Hz
  is the INPUT's own rate, the kit's `rateOf`); `onRelease` → `say('')`; a stop that releases a held route also clears it. rack.js passes
  `say: (t) => wMet.setStatus(t, t ? 'warn' : '')`, METERS' status, which nothing else writes (the GOVERNOR parks only `READERS`, and
  METERS is not one). **METERS' status line was empty before this row** (`status: ''`); the brief's "where METERS already writes
  status" is therefore a new write into an empty seat. If METERS is closed the line is in a card the reader has closed.
  A pause (no more sets) leaves the line up until a quiet second is next seen; the picture is in fact held there.
- **Nothing else.** `material.hue` (a wrap), `observer.*`, `reg.*`, `chem.*`, `transport.rate`, `material.softness|iso|grain|slice.*`
  are not wrapped and never held. No new stored key (`settings-probe` 0 of 6 red); the guard is always on, `guard.enabled` is not exposed.
- **No frame-path change.** No readback; at most four guard calls a frame, each only on a routed set, plus one `clock.stats()` copy per
  call. THE LOCK is not needed: no shader, readback or schedule changed, and the lock runs with the modulation clock stopped
  (`tools/perf/digest-lock.mjs:35,113`), so no wrapped route is ever driven in its scenes; a held route changes only the number a
  modulator writes, and only past 3 flashes/s. The interleaved pair is not needed: there is no per-frame work beyond those ≤ 4 calls
  on routed sets.

## 3 · Tests and counts

- `tests/flash-routes.test.mjs` (new, node): the four constants equal `tools/flash-calibrate.mjs steps()` (6e-5) · a 10 Hz square of
  ±0.3 stop on EXPOSURE gives ≤ 6 output direction changes in any second, still ≥ 8 in 3 s (held to the safe rate, not frozen), one
  sentence matching `FLASH GUARD · EXPOSURE 10.0 Hz held to 3/s`, cleared once on release · ±0.05 stop passes bit for bit, silent ·
  a 0.1 Hz ramp passes bit for bit · the same 10 Hz square on `observer.yaw`, `observer.dist` (a log route), `reg.morph`, `chem.kick`
  passes bit for bit · HUE across the 1 → 0 seam passes, silent · GAMMA, STAGE, KNEE trip when a square is wider than their step
  (and name themselves) and pass at about half of it · a non-modulator write is never held and clears a held route · and the
  wiring case over the REAL port and model: a synced square LFO at 10 Hz routed to EXPOSURE and ZOOM, stepped with `clock.step(0.02)`
  for 3 s: EXPOSURE 17 reversals (max 6 in any second), ZOOM 58 (free), one sentence, the routes removed → the restore is the base
  exactly and the line clears.
- `bash test.sh node`: exit 0, 80 suites (79 + this one); `node tests/pwa.test.mjs --write` after the lab edit (341 entries, 2
  re-hashed: `mod-port.js`, `rack.js`; the kit's `flash-guard.js` was already precached).
- Browser (served from this worktree, port 8983, one at a time on a quiet GPU): `take-in-bugs` 4/4 · `routed-knob` 4/4 ·
  `mir-controls` 2/2 · `offer` 16/16 · `settings-probe` 0 of 6 scenes red.
- An uncommitted probe in the real app (a synced square LFO at 10 Hz on EXPOSURE and ZOOM, `__LW.play()`, sampled every 8 ms for
  3 s): `mat.exposure` takes two values (1 and 1.5157, the LFO's 0.6-stop swing) with 17 reversals in 3 s, ZOOM 50 (free), the knob's
  `aria-valuetext` equals `mat.exposure` in 85 % of samples (the rest is the knob's own throttled DOM write), METERS' status read
  `FLASH GUARD · EXPOSURE 10.0 Hz held to 3/s` and nothing else; after MOD power off and the sources removed it read `` and
  `mat.exposure` was the base 1.
- Lines: `lab/mod-port.js` 132 → 152 (+20 net), `lab/rack.js` ±0 (one line extended), `lab/sw.js` ±0 (two hashes). **`lab/*.js` +20**
  (the plan said ≈ +25).
