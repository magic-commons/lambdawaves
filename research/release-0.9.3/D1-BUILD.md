# D1 T₁ · T₂ ON THE SPHERE — build note (0.9.3 "Decohere")

Branch `d1-decay` off `458752d` (`yan-c`, right after the v0.9.2-alpha cut). Builder: Opus, for the integrator. The build commit is `da1c2e2`. The tip is the commit that adds this note (`git log -1 d1-decay`).

## Δ lines

`lab/` went from 30,091 to **30,110**, which is **+19** (the budget was +45; the cap for this cut is 30,391). `bloch-model.js` went from 43 to 57 lines (+14) and `bloch.js` from 62 to 67 (+5). `verbs.js` changed one line in place (+0).

## Seats (file:line, after the build)

### `lab/bloch-model.js`

- **`:4–5` PRESETS.** `decay` is { Ω 0, θ₀ π/2, T₁ 8, T₂ 6 } and `damped` is { Ω 0.5, θ₀ 0, T₁ 20, T₂ 10 }. Line 4 is the old line with its closing `};` moved onto line 5.
- **`:6` DEFAULTS** gain `T1: 0, T2: 0`, meaning none. They are absent from `save()` at the defaults, and they ride `instruments.bloch` under the existing row.
- **`:33` `halve`.** When T₁ or T₂ > 0 it measures the distance on the vector from `runR` at dt and at dt/2. Otherwise it is today's spinor distance, unchanged.
- **`:34–35`** is the header comment: ρ = ½(1 + r·σ), the Lindblad pair, 1/T₂ = 1/(2T₁) + γ_φ.
- **`:36–40` `bloch(r, P, t, dt)`** is one RK4 step of ṙ = 2h′ × r − (r_x/T₂, r_y/T₂, (r_z + 1)/T₁), with 2h′ = (Ω, 0, −(δ + βt)).
  - Ω is read once at the step's start, as `step` does, so FLOP's pulse window is honoured.
  - At T = 0 the rate 1/T is 0.
- **`:41–44` `runR(P, t, dt, from)`** is the vector's run.
  - It starts from `vec(P, init(P), 0)` or continues from a kept `{ t, r }`.
  - It steps at dt, and the pulse's end is always a step edge.
  - It returns `{ t, r, v }`, where `v` is the lab frame turned by φ(t) exactly as `vec` turns.
- **`:45` `decayClosed(P, t)`** returns { rz: −1 + (r_z(0) + 1)e^{−t/T₁}, rp: |r_⊥(0)|e^{−t/T₂} } for Ω = 0.
- **`:46` `steadyZ(P)`** returns r_z(∞) = −(1 + δ²T₂²)/(1 + δ²T₂² + Ω²T₁T₂). At δ = 0 this is the plan's −1/(1 + Ω²T₁T₂).
  - It is NaN under a chirp (β ≠ 0) or a pulse (FLOP).
  - It is 0 when T₁ is none.
- `run`, `step`, `su2`, `vec`, `closed` and the **BELL block (now `:47–57`) are untouched**.

### `lab/bloch.js`

- **`:4`**: the import gains `runR, decayClosed, steadyZ`.
- **`:7`**: `KN` gains T₁ (0…50) and T₂ (0…100).
- **`:8`**: `LABEL` gains DECAY and DAMPED RABI. `pick` now sets `T1: 0, T2: 0` before the preset, so FLOP · LARMOR · RABI · LANDAU–ZENER clear the damping.
- **`:24` `set`** clamps T₂: when T₁ > 0, a T₂ that is 0 or above 2T₁ becomes 2T₁.
- **`:25`**: the T₁ and T₂ knobs are hidden in PAIR.
- **`:26`**: the STEP sub says "RK4 ·" for a damped run, and the LANDAU–ZENER readout is hidden when damped.
- **`:31–32` `update`.** When T₁ or T₂ > 0 the vector comes from `runR`, stepping on from the kept grid point `K` as the chirp does. In that case P↓ = (1 − r_z)/2. Otherwise this is today's code path, with the same arithmetic.
- **`:34–36` the damped readout.**
  - The value is "|r| 0.563 · Tr ρ² = (1 + |r|²)/2 = 0.658 · P↓ 0.433".
  - The sub names the closed form in force:
    - **free decay** (Ω = 0): the two exponentials, each with its measured |Δ|;
    - **driven**: "steady P↓ = (1 − r_z(∞))/2 = 0.510, r_z(∞) = −(1 + δ²T₂²)/(1 + δ²T₂² + Ω²T₁T₂) = −0.0196";
    - **otherwise**: "a chirp or a pulse: no closed steady state".
  - At the clamp the sub adds "T₂ ≤ 2T₁: held at 2T₁".
- **`:37`**: the old `if (!P.b)` became `else if (!P.b)`. Its body is unchanged.
- **`:56–57` `paint`**: the saturation latitude z = r_z(∞) is drawn at ink 0.3 when the qubit is driven and damped. It is a 64-segment projected circle of the sphere, drawn after the PAIR return.
- **`duo` (now `:44–49`) is untouched.** The trail and arm are unchanged; the trail spirals inside the sphere because |r| < 1.

### Other files

- `lab/verbs.js:51`: the `bloch` verb's preset enum gains `decay|damped`, and its doc names them.
- `docs/STATE-SCOPES.md`: the `instruments.bloch` row names `T1` · `T2`. No new row.
- `lab/sw.js`: hashes refreshed by `pwa.test --write`.

## The numbers (`.tmp/d1-check.mjs`, not committed; RK4 at DT = 0.05)

| check | measured | closed form | \|Δ\| |
|---|---|---|---|
| DECAY r_z at t = 1 | −0.117503097414 | −1 + (0 + 1)e^{−1/8} | 1.4e-12 (r_⊥ 5.7e-12) |
| DECAY r_z at t = 5 | −0.464738571477 | −1 + e^{−5/8} | 4.3e-12 (r_⊥ 1.5e-11) |
| DECAY r_z at t = 20 | −0.917915001373 | −1 + e^{−20/8} | 2.6e-12 (r_⊥ 4.8e-12) |
| DAMPED RABI r_z at t = 20 T₁ = 400 | −0.019607843 | −1/(1 + 0.25·200) = −1/51 | 2.9e-14 |
| the same at δ = 0.3 | −0.166666667 | −(1 + 9)/(1 + 9 + 50) = −1/6 | 4.8e-15 |
| T₁ = T₂ = 0: \|runR − vec(run)\|, RABI | t = 0.7 · 3.3 · 17.1 | the exact spinor | 1.2e-11 · 5.5e-11 · **2.9e-10** |
| the same at dt/2 | | | 7.3e-13 · 3.4e-12 · 1.8e-11 |
| halve (STEP readout) | DECAY 1.5e-11 · DAMPED 6.3e-9 | | < 1e-6 ✓ |

The steady P↓ of DAMPED RABI is (1 − r_z(∞))/2 = 0.509804.

At t = 17.1, RK4 at DT is 2.9e-10 away from the exact spinor. That is RK4's own O(dt⁴) truncation on a pure rotation, and it falls 16× at dt/2. The 1e-10 holds for t ≲ 6. **The app never uses `runR` when T₁ = T₂ = 0**: the canvas, readouts and STEP all stay on the spinor road (`update :31–32`, `halve :33`), so the picture at T = 0 is today's, byte for byte.

## Gates

- `node tests/pwa.test.mjs --write`, then `./test.sh node`: exit 0, with bloch 7 laws green and bell 6 laws green.
  - `bloch.test`'s "every preset's halved step within 1e-6" now covers DECAY and DAMPED too.
- `node tools/rack-deps.mjs --classes --no-write`: green.
- `node tools/new-project.mjs --check`: in step, 16,117 B; the new keys are default-absent.
- `node tests/new-project.test.mjs`: green.
- `LW_PORT=9611 GD_PORT=5711 node tools/serialize-bytes.mjs`: DONE 11 readings.

## Screenshot

**`.tmp/d1-damped.png`**, taken by `.tmp/d1-shot.mjs` through gatekit `open`/`snap`, headless on 9611. It shows BLOCH on DAMPED RABI, run through the verb. The vector is inside the sphere, the trail spirals and the faint saturation latitude sits just below the equator. The readout read at the shot was "|r| 0.563 · Tr ρ² = 0.658 · P↓ 0.433 · steady P↓ 0.510". There were no page errors. The server was stopped by its pid.

## Corrections to the brief

1. **P↓(∞) = (1 − r_z(∞))/2, not (1 + r_z(∞))/2.** The tree's convention is r_z = |a|² − |b|², so |↑⟩ is +1 and P↓ = |b|² = (1 − r_z)/2. The brief's 0.917 was illustrative; DAMPED RABI's steady P↓ is 0.510.
2. **T₂ = 0 with T₁ > 0 means no dephasing, so T₂ is clamped to 2T₁.** "0 = none" means T₂ = ∞, which breaks T₂ ≤ 2T₁. The clamp therefore lands it at 2T₁, which is pure amplitude damping (γ_φ = 0) and the physical reading.
3. **`steadyZ` carries δ:** r_z(∞) = −(1 + δ²T₂²)/(1 + δ²T₂² + Ω²T₁T₂) is the steady state at any constant detuning in the turning frame (checked above at δ = 0.3). It is NaN only under a chirp or FLOP's pulse, so "off resonance: no closed steady state" became "a chirp or a pulse: no closed steady state".
4. **The T₁ = T₂ = 0 `runR` check holds to 1e-10 only for t ≲ 6** (2.9e-10 at t = 17.1). This is RK4's truncation, and the app's T = 0 road never calls it (see above).
5. **There is no equator in `sphereFrame`** to copy. The latitude is drawn as a projected 64-segment circle.

## Dropped, and why

- Damping on the pair: deferred by the plan.
- A closed form for a damped chirp: none exists, and RK4 serves.
- No test file and no gate script, per Josh's dial.
