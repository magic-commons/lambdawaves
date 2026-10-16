# B2 THE A(t) TRACE — build note (0.8.3 "Breath")

Branch `b2-trace` off `f3f4ccb` (`yan-c`, right after v0.8.2-alpha). Builder: Opus, for the integrator. The tip is the commit that adds this note (`git log -1 b2-trace`).

## What landed, by seat

All seats are pure insertions. No base line was edited.

- **`lab/period.js:102–110`** (new, after `fmtPeriod`): **`traceOf(reg, P, g2 = null, N = 512)`** returns `{ T, src, t, A, peaks, turns }`.
  - **The span.** T is the transport's REPEATS period `P.T`. When P has no period (Stark, an A ↔ B mix, no answer), the span is the horizon 2e4 a.u., and `src` says so. `src` reads `'REPEATS, exact'`, `'REPEATS, the nearest recurrence'`, `'no period: the horizon 2e4 a.u.'` or `'stationary: one energy, A ≡ 1 (the horizon drawn)'`.
  - **The samples.** A[i] = `reg.autocorrelation(t_i).abs²` at 512 times evenly spaced over [0, T]. That is the closed-form sum over the normal-mode populations, O(N) a sample, exact under a Stark field too.
  - **With the equalizer's `g2(a, b)` = |Γ_{n_a n_b}|²**, A becomes Tr ρ(0)ρ(t) = Σ p_a p_b |Γ_ab|² cos(ω_ab t) / (Σp)². See correction 1.
  - **`peaks`** are the revivals: local maxima above half the top. Plateau-safe: strict on the left, so A ≡ 1 marks only t = 0.
  - **`turns`** counts how many times the fastest beat turns over the span. It feeds the aliasing sentence.
- **`lab/calculusview.js`**
  - `:9` the import (`traceOf`, `fmtPeriod`).
  - `:21–37` **the A(t) tile**:
    - A kit `readout` with the classes `wide calc-ray`, so it inherits the RAY tile's LEAN exception and its 56 px canvas. No CSS was touched.
    - It is seated with `host.insertBefore(…, foot)` after RAY. Its statement runs after line 19, so B1's BREATH tile, inserted right after RAY at `:15–16`, lands between them: RAY, BREATH, A(t), the foot.
    - A `pointermove` hover writes `t = … a.u. (… T) · A = …`, and snaps to a revival within 6 px ("· a revival").
    - **`trace(src, reg, t, mol)`** rebuilds the samples only when its own key moves: `version | Fz | Bz | P.T | operator`, plus the equalizer table's identity. It redraws the canvas when t or the width changes.
    - The canvas carries the curve in the kit's ink and, in the accent, the revivals as dots and the clock's t mod T as the cursor.
    - The value is `fmtPeriod(T)`. The sub is the source, then `exact |Σ p e^{−iEt}|²` or the damped sentence, then the current A and the revival count. When the fastest beat turns more than 128 times over the span (fewer than 4 samples a turn), it adds "512 samples alias it".
    - It stands down with one sentence for a molecule ("the STATES register's autocorrelation is a later row") and for an A ↔ B transition ("the mix has its own clock (the Rabi period)").
  - `:58` one call inside `update`, right after `if (!on) return;`: `trace(this && this.trace, reg, t, mol)`.
    - It sits before `update`'s own key check, so a paused change of equalizer preset still reaches the tile.
    - It follows LIVE, and runs only through CALCULUS's `may()` tick (`rack.js:541`, untouched). So nothing is computed while CALCULUS is closed.
- **`lab/windows/readouts.js:126`** (new, after the `app.w.calculus = calculus` line): `calculus.trace = () => ({ P, T, signed, g2 })` is the tile's source.
  - **`P`** is `app.hooks.period()`, the transport's own `periodNow(true)`, cached on its key. The trace therefore spans exactly the period REPEATS prints.
  - **`T`** is `app.state.eq.last`, the table in force.
  - **`g2`** is |Γ|² from `T.gamma`, given only for a mixture table (`mode === 1`) and only with Fz = 0.
  - **`signed`** marks a mode-2 table.
  - rack-deps: readouts is at 9 crossings, unchanged.
- **`lab/sw.js`**: the precache rows, rewritten by `pwa --write`.
- **`tests/trace.test.mjs`**: 21 lines, 6 laws.
- **Not touched:** `lab/rack.js`, `lab/calculus.js`, `lab/field.js`, `lab/skeleton.js`, `lab/dynamics.js`, `lab/windows/spectrum.js` (still at 25), `lab/mir/**`, `lab/fonts/**`.

## The checks (`tests/trace.test.mjs`, all GREEN)

| law | result | gate |
|---|---|---|
| A(0) = 1, from `autocorrelation(0)` and from the trace's first sample | 1 | 1e-12 |
| the period of (1s + 2s)/√2 from `densityPeriod` against 2π/(E₂ − E₁) = 16π/3; A(T) = 1 by `autocorrelation(T)` and by the last sample | T = 16.755160819145562 both; A(T) = 0.9999999999999998 | 1e-10 |
| the equal-weight 1s + 2s trace against cos²((E₂ − E₁)t/2) at all 512 samples | worst 6.7e-16 | 1e-12 |
| the sample count, the span [0, T], the source string `'REPEATS, exact'`, the revivals at samples 0 and 511 only | as stated | exact |
| damped with \|Γ₁₂\|² = ¼: A(0) is the purity Σ p p \|Γ\|² = 0.625, and the trace is ½ + ⅛ cos(ΔE t) | 0.6250000000000001; pointwise < 1e-12 | 1e-12 |
| no period: the horizon 2e4 a.u., and the source string says so | `'no period: the horizon 2e4 a.u.'` | exact |

**The browser check: one session, headless Firefox, 1600×1000, port 9521, the CHORD demo.** CALCULUS was floated, the clock scrubbed to t = 600 and the notebook closed.
- **The tile.** It reads `1810 a.u. · 43.8 fs`, then `REPEATS, exact · exact |Σ p e^{−iEt}|² · now A = 0.2992 · 16 revivals`. The transport's period is T = 1809.557 (exact, g = 1/288).
- **The current A, checked independently.** A(600) = |⅓ Σ_{n=2,3,4} e^{−iE_n·600}|² = 0.2992 by a separate one-liner.
- **The hover.** At the right edge it reads `t = 1809.56 a.u. (1.000 T) · A = 1.000000 · a revival`.
- **The page.** No page errors.
- **The picture.** The curve shows the chord's interference, with the revival dots at t = 0 and t = T reaching 1, and the cursor at 600/1810 of the width.
- **The screenshot** (not committed): `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a5dd9a0121e163bbb/.tmp/b2-chord-trace.png`.
- **The first run of the same session**, on the default 1s + 2p₀ state, drew cos² with its two end revivals.

## The gates

- **`node tests/pwa.test.mjs --write`, then `./test.sh node`:** rc 0, **0 RED**, `trace: all GREEN` among them. Run after the last `lab/` edit.
- **`node tests/calculus.test.mjs`:** 0 failing of 8. **`tests/period.test.mjs`:** 0 of 11. **`tests/bead-ray.test.mjs`:** all green.
- **`node tools/rack-deps.mjs --classes`:** HOLDS. 0 bare cross-scope writes, SPECTRUM at 25 (untouched), readouts at 9, the `app` literal unchanged.
- **`node tools/new-project.mjs --check`:** in step (16117 B).
- **`node tools/serialize-bytes.mjs`:** run on the base (`git archive f3f4ccb`) and on this tree, both served at 9521 in turn. The 11 readings' JSON is **byte-identical**: no PROJECT key.

## Corrections to the brief

1. **"Under the equalizer's dephasing presets the envelope decays" is not what the model does in time.**
   - **The model is a fixed table.** The equalizer's Γ is time-independent: the random-clock fixed point. Each pair's coherence is multiplied by a constant |Γ|, not by an envelope that decays with t.
   - **The pure trace is unchanged.** A spread of clock *offsets* leaves every member's |⟨ψ_δ(0)|ψ_δ(t)⟩|² equal to the pure A(t).
   - **What I built.** The true mixed-state generalisation is the Hilbert–Schmidt overlap Tr ρ(0)ρ(t) = Σ p_a p_b |Γ_ab|² cos ω_ab t, which is A(t) when Γ ≡ 1. Under it the oscillating part is scaled by the model's factors, the within-shell part stays, and every revival reaches the **purity** instead of 1. A(0) equals the PURITY the BEAT EQUALIZER card prints: the same Σ w w |Γ|².
   - **What the tile says.** "coherences damped: the envelope is the model's · A(0) = PURITY 0.xxx". This applies to mixture tables (`mode 1`: the jitters, the COMB, gains below 1).
   - **The other tables.** The PHASE PULSE (|Γ| = 1, still pure) draws the pure trace. A signed table (BEATS / WITHIN / INTERFERENCE) is no state, so the tile draws the register's own trace and says so.
2. **The tile lives in `lab/calculusview.js`, not `lab/windows/readouts.js`.** CALCULUS's tiles are built there, as 0.8.2 P3 found. `readouts.js` gets one line, the source.
3. **"t = 0 the anchor":** the register's anchor c(0) sits at the clock's zero, and `autocorrelation(t)` is relative to it. The cursor is therefore `clock.t mod T`, the same zero REPEATS counts its laps from. The tile's label says so.
4. **The "exact" claim.** The drawn curve is always the closed-form sum over the populated normal modes, under a Stark field too, not only for hydrogen. So "exact |Σ p e^{−iEt}|²" is said whenever no table damps it. The *period* is exact only where REPEATS says so, and the source string carries that distinction.

## Dropped, and why

- **The STATES register's autocorrelation (molecules):** deferred by the plan. The tile stands down with one sentence.
- **Damping under a Stark field (Fz ≠ 0):** the normal modes mix labels within a shell, and the table is written on labels. The pure trace is drawn there and the damping skipped. It is rare: the equalizer is a field-free hydrogen feature in practice.
- **Per-label rates ≠ 1:** the field's per-label rates are a picture-side clock. The register's `autocorrelation` (the physics) ignores them, as the trace does. REPEATS says "no exact period under these per-label rates" in that case.
- **Anti-aliasing:** I kept 512 samples, per the brief. A state whose fastest beat turns more than 128 times in T aliases, for example all six shells with T = 45 239 a.u., and the tile says so in its sub. A min/max per pixel would need more samples than the brief allows.
- **The period's cost:** `app.hooks.period()` is the transport's forced road. It is free when REPEATS is fresh. In the transport's "settling" window (an incommensurate spectrum mid-gesture) it scans synchronously, as LW.period and ⟳ already do. That happens once per rebuild key, never in a frame where nothing changed.

## Δ lines

`lab/` (the plan's count): **29,952 → 29,981 = +29** (budget +30, cap 30,251).

| file | Δ |
|---|---|
| calculusview.js | +19 |
| period.js | +9 |
| windows/readouts.js | +1 |
| sw.js | 0 (rewritten rows) |

The test is 21 lines.

## For the integrator at the merge

- **`lab/calculusview.js`** (base numbering):
  - one line inserted after `:8` (the import);
  - 17 lines after `:19` (`let tiles = [] …`);
  - one line after `:39` (`if (!on) return;`).
  - No base line was edited. If B1 also adds an import after `:8`, keep both lines.
- **`lab/period.js`:** nine lines appended after `fmtPeriod`, the end of the file.
- **`lab/windows/readouts.js`:** one line inserted after base `:125` (`app.w.wCalc = wCalc; app.w.wLad = wLad; app.w.calculus = calculus;`).
- **`lab/sw.js`** conflicts with every row: re-run `pwa --write` after the merge.
- **THE LOCK:** this row makes no field write. The tile reads the register and the transport's period and paints its own 2D canvas, only through CALCULUS's `may()`.
