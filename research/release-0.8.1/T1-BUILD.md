# T1 BLOCH: SPIN-½ · RABI · LANDAU–ZENER — build note (0.8.1 "Two Levels")

Branch `t1-bloch` off `c383e8e` (`yan-c`). Builder: Opus, for the integrator. The build commit is `c7a2cb4`; the tip is the commit that adds this note (`git log -1 t1-bloch`).

## The physics as built (and one correction to the brief)

H(t) = (ω₀/2)σ_z + (Ω/2)(cos φ σ_x + sin φ σ_y), where φ = ∫ω dt and ω = ω₀ + δ + βt, so φ(t) = (ω₀ + δ)t + βt²/2. The drive is **circular**, so the change of frame |ψ⟩ = e^{−iφσ_z/2}|ψ′⟩ is exact. It gives H′ = −(δ + βt)/2 σ_z + (Ω/2)σ_x with no rotating-wave approximation.

- **β = 0.** H′ is constant, so ONE step e^{−iH′t} = cos|n| − i sin|n| n̂·σ carries any t exactly.
- **β ≠ 0.** H′ is linear in t. The step's n is the fourth-order Magnus exponent over dt = 0.05. Besides ∫H′, that is the single extra term n_y = −βΩdt³/24.
- **The lab picture.** It is the turning-frame Bloch vector, turned by φ(t) about ẑ.

**Correction 1.** The brief says `step(dt)` = e^{−iH dt} of the lab H. The lab H(t) does not commute with itself at different times, so a piecewise-constant lab step would be O(dt²) wrong everywhere. That would fail the Rabi gate at 1e-10. I built the true thing instead: the exact frame change, then the exact 2 × 2 exponential of H′. Under a chirp I use Magnus-4, never a series. That is still "the exact 2 × 2 unitary" per step.

## Seats (file:line)

### `lab/bloch-model.js` (new, 31 lines, DOM-free)

- `PRESETS :4`:
  - FLOP: Ω = 0.2 from ↑.
  - LARMOR: Ω = 0, θ₀ = π/2.
  - RABI: Ω = 0.2.
  - LANDAU–ZENER: Ω = 0.3, β = 0.05, δ = −4.5.
- `DEFAULTS :5`: FLOP, ω₀ = 1; `DT` = 0.05.
- `pulse :6`: FLOP's π-pulse, Ω on for π/Ω and then off.
- `init :7`: the initial state from (θ₀, φ₀).
- `step :8`: the 2 × 2 exponential.
- `run :13`: ψ′(t) from 0, or onward from a kept `{ t, s }`. The pulse's end is always a step edge.
- `phase :18`.
- `vec :19`: the lab Bloch vector.
- `closed :25`: the Bloch vector by **Rodrigues** about 2h′ = (Ω, 0, −δ), turned by φ(t). There is no spinor in it, so it is independent of the stepper. It covers β = 0, the pulse's two pieces, and any initial state.
- `lzP :29`: 1 − e^{−πΩ²/(2β)}.
- `span :30`: the re-solve's run, which is the sweep to resonance and as far past it, capped at 2000; otherwise 2π.
- `halve :31`: the same run at dt and dt/2, returning the spinor distance.

### `lab/bloch.js` (new, 49 lines)

- `createBloch(host, api) :9`. **Row 1 (`:11–13`) is the preset seg FLOP · LARMOR · RABI · LANDAU–ZENER.** A tap on the lit preset runs it again, which is "tap FLOP" (a capture-phase click, `:12`).
- The knobs are ω₀ · Ω · δ · β · θ₀ · φ₀.
- The canvas is 180 px (`.ladder-c`).
- The readouts are:
  - **P↓ measured · closed form**, with the formula used and |Δr| in the sub;
  - **LANDAU–ZENER** (shown only when β ≠ 0): the PREDICTION beside the measured flip once t ≥ 2|δ|/β, with the finite-sweep sentence;
  - **STEP dt against dt/2**: the distance, with "step too coarse" (warn) above 1e-6.
- `set :19`: Object.assign, then t₀ = the clock's t, the trail cleared, and the re-solve.
- `update(t) :23`: the loop's tick. A chirp keeps the state at the last grid point and steps onward. β = 0 is one closed step. It repaints only when t, the camera key or the width changes.
- `paint :35`, in this order:
  1. ORBIT's `sphereFrame`;
  2. the effective-field axis (Ω cos φ, Ω sin φ, ω₀ − ω) at ink 0.3;
  3. the trail over the last period, 2π/min(ω₀, √(Ω²+δ²)), capped at 900 points;
  4. the Bloch vector by ORBIT's `arm` in n = 2's colour.
- `BL :46` is the one handle. It carries `update`, `set`, `pick`, `params`, `ro`, `label`, `save` (only the keys off DEFAULTS, `undefined` when none) and `load`.

### The other files

- **`lab/orbit.js:24–30`**: `project`, `sphereFrame(g, T, B, x, y, R)` and `arm(g, x0, y0, R, p, stroke, fill)` are exported. ORBIT's `sphere` closure and its arm loop now call them. orbit.js is **−1 line** net.
  - The draw stream is identical. `.tmp/orbit-calls.mjs` records base's inline code, copied verbatim, against the exported painter through a recording 2D context: IDENTICAL, 23 calls.
  - A canvas-bytes comparison in the browser is NOT a valid witness. Base against itself gave two different shas over two runs.
- **`lab/windows/readouts.js:9, :134–135, :138`**: the import, then BLOCH's device beside LATTICE's (closed, appended to the rack), `createBloch(wBlo.body, { t: () => clock.t, obs })`, and a `devopen` that runs the preset from its start. The seat returns `wBlo, bloch`. `obs` joined the root destructure; it is a §0 const, so it counts as backward.
- **`lab/rack.js`**:
  - `:542`: `if (may('bloch', wBlo)) tick('bloch', () => bloch.update(clock.t))`;
  - `:709`: the seat destructure;
  - `:741`: `READERS.bloch = wBlo`.
- **`lab/shell/persist.js:9, :59, :239`**: `instruments.bloch = BL.save()` (absent at the defaults) and `BL.load(I.bloch)`.
- **`lab/shell/settings.js:136`**: `KIND.bloch = 'info'`.
- **`lab/verbs.js:8, :51–52, :115`**:
  - the `bloch` verb, with args `preset?` (flop|larmor|rabi|lz) and `play?`. It opens the window, runs the preset from its start, plays or pauses, and fades "BLOCH · FLOP";
  - the inventory line `bloch`, present only while the window is open.
- **`docs/STATE-SCOPES.md:67`**: one row, `presentation.instruments.bloch`.
- **`tests/bloch.test.mjs`** (28 lines, 7 laws).
- `lab/mathworker.js`: untouched. Everything runs on the frame thread.

## The closed forms and their gates (`node tests/bloch.test.mjs`)

| check | gate | measured |
|---|---|---|
| Larmor (Ω = 0): azimuth − φ₀ = ω₀t (wrapped), at ω₀ ∈ {1, 2.3, 0.4}, δ ∈ {0, 0.7, −3}, t up to 250; z held at cos θ₀ | 1e-12 | green |
| Rabi on resonance from ↑: P↓ = sin²(Ωt/2), Ω ∈ {0.2, 1.3}, ten t, in the LAB frame at ω₀ = 1.7 | 1e-10 | green |
| Generalised: Ω²/(Ω²+δ²)·sin²(√(Ω²+δ²)t/2) at (0.3, 0.4) and (0.5, −1.2), ten t each | 1e-10 | green |
| The whole vector against Rodrigues from a general (θ₀, φ₀) | 1e-12 | green (2.7e-15 in the probe) |
| FLOP: P↓ = 1 at τ = π/Ω and held after it (τ + 4, τ + 40); ½ at τ/2 | 1e-12 | green |
| Unitarity over 10⁵ chirp steps (β = 0.2) | 1e-12 | green |
| The halved step for every preset | < 1e-6 | FLOP/LARMOR/RABI ≈ 1e-16; LZ 5.5e-10 |

## Landau–Zener (β = 0.05, Ω = 0.3; asymptote 1 − e^{−πΩ²/(2β)} = 0.940835)

| sweep δ: −D → +D | P↓ measured | − asymptote | step distance (dt vs dt/2) | against dt/10 |
|---|---|---|---|---|
| D = 4.5 (the preset, t = 180) | 0.927082 | −1.38e-2 | 5.5e-10 | 5.9e-10 |
| D = 10 | 0.931506 | −9.33e-3 | 1.03e-9 | 1.10e-9 |
| D = 40 | 0.943436 | +2.60e-3 | 3.71e-9 | 3.94e-9 |

**Correction 2.** "Within the stepper's own distance" cannot hold, because the stepper is not the error. The step distance is ~1e-9, and the dt/10 reference agrees with it to 10%, so the halving distance is an honest error bar. The gap to the asymptote is the **finite sweep**. The asymptote is a ±∞ statement, and a sweep from −D to +D carries oscillating corrections of order Ω/D that shrink only like 1/D. That is mathematics, not numerics.

The gate is therefore:
- |P − P_LZ| < Ω/D at D = 10 and 40;
- step distance < 1e-6;
- the dt/10 error < 2 × the step distance.

The window says this in a sentence ("a finite sweep δ → −δ leaves wiggles of order Ω/|δ| = 0.067; the asymptote is ±∞'s") and prints the asymptote as PREDICTION beside the measured flip.

## Timing

- One 2 × 2 step: **0.17 µs** (node). The gate is < 0.01 ms.
- The LZ preset's dt-halving re-solve (180 time units, 3600 + 7200 steps): **1.7 ms**.
- A frame at β = 0 is one closed step. Under a chirp it is a few steps.

## Gates run

- `node tests/pwa.test.mjs --write`, then `./test.sh node`: exit 0. `bloch: 7 laws green`, `frontier.test` 0 failing of 54, `kepler.test` 0 of 9; ORBIT's painter has no node test, and these are its nearest.
- `node tools/rack-deps.mjs --classes`: exit 0.
  - THE HINGE holds, and spectrum stays at 25 (untouched).
  - `app` is still 30 keys and `w` 71.
- `node tools/new-project.mjs --check`: in step (16117 B).
- `node tools/serialize-bytes.mjs`, base (`git archive c383e8e` on :9452) against this tree (:9451):
  - all 11 edit shas are identical;
  - every full record grows by **80 B**, the one new WORKSPACE layout row (`bloch` closed). LATTICE's was 82 B; the id is two characters shorter.
- Browser, once: `tests/keyboard-window.browser-test.mjs` on :9451: **GREEN**.
- Screenshot (throwaway `.tmp/bloch-shot.mjs`, not committed): **`.tmp/bloch-flop.png`**.
  - It shows FLOP mid-pulse by the `bloch` verb with play, paused at t ≈ 7.4.
  - The inventory read `FLOP · 0.489483 · 0.489483 · Ω²/(Ω²+δ²)·sin²(√(Ω²+δ²)·t/2) · π-pulse τ = π/Ω = 15.71 · |Δr| = 2.3e-16 · … · 0.0e+0`.
  - The vector is near the equator with its trail, and the drive axis lies faint on the equator.
  - No page errors.
- THE LOCK: BLOCH is closed by default and writes nothing to the field. Its tick runs only through `may('bloch', wBlo)`. The integrator runs it ×2 at the merge.

## What I dropped, and why

- **A LAB · ROTATING frame switch.** It did not fit the budget. The lab picture carries the turning frame's effective-field axis as the faint arm.
- **A pulse-length knob.** FLOP's τ = π/Ω follows Ω, so FLOP is always a π-pulse (P↓ → 1 only on resonance; δ ≠ 0 says so in the closed form).
- **Saving the qubit's state.** A load or an open runs the preset from its start. Only the knobs are PROJECT.
- **The closed-form formula sub for a chirp.** A chirp has no finite-t closed form. The readout says so and shows the live detuning ω − ω₀.

## Δ lines

`lab/`: 29,707 → **29,791 (+84 of ≤ +85)**. The pieces are bloch-model.js +31, bloch.js +49, orbit.js −1, readouts +2, rack +1, verbs +2; persist, settings and verbs' inventory changed in place. Tests +28 (≤ 45).

## Seams T2 extends

- **The MODE seg for the Bell pair.** It goes in BLOCH's first row, `lab/bloch.js:13` (`host.append(pre.root)`). Prepend a ONE · PAIR seg there; PAIR swaps the preset seg's options for Φ± · Ψ± · PRODUCT.
- **The model's state object.**
  - A qubit is `[Re a, Im a, Re b, Im b]` (the arrays `init`/`step`/`run` pass). The parameters `P` are flat `{ preset, w0, O, d, b, th, ph }` (`DEFAULTS`, `bloch-model.js:5`).
  - `vec(P, s, t)` gives ⟨σ⟩ in the lab, and `step` is the one 2 × 2 exponential. A local rotation on qubit A is `step` on A's half of a two-qubit amplitude.
  - `save()` writes only the keys off `DEFAULTS`, so a new key added to `DEFAULTS` (e.g. `mode: 'one'`) stays default-absent.
- **The painter's call.**
  - `sphereFrame(g, T, B, x, y, R)` then `arm(g, x, y, R, project(v, B), stroke, fill)`. `arm` draws a vector of length |v|, so a reduced Bloch vector of length |⟨σ⟩| < 1 draws short as it should.
  - T2's two spheres are two `sphereFrame` calls at cx = W/4 and 3W/4 inside `paint` (`lab/bloch.js:35`), which today uses cx = W/2, R = H/2 − 16.
