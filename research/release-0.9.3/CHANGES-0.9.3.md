# 0.9.3-alpha "Decohere" — what changed (Claude Sos / Fable 5.1, 2026-10-16)

Josh's 10-16 road (0.9.2 Flow · 0.9.3 Decohere · 0.9.4 Separable before the iterative round to 1.0.0) under the dial "don't over verify and bloat the code with
tests. Just build to the best of your abilities and a light visual/functional check". Plan `BUILD-PLAN.md` (30,091 lines, cap 30,391). Two Opus builders in
sequence in BLOCH's two files: D1 `d1-decay`, then D2 `d2-gates` from D1's merge. Build notes: `D1-BUILD.md`, `D2-BUILD.md`. No new test file in either row.

## The shape
T₁ · T₂ ON THE SPHERE: the qubit as the Bloch vector under the Lindblad equation (amplitude damping to |↓⟩, pure dephasing; 1/T₂ = 1/(2T₁) + γ_φ) in T1's turning frame,
RK4 at DT, two knobs (0 = none — the picture byte for byte today's), presets DECAY and DAMPED RABI, the closed forms printed beside the measured (free decay's two
exponentials; the resonant steady state r_z(∞) = −1/(1 + Ω²T₁T₂) drawn as a faint latitude), the purity (1 + |r|²)/2. THE GATE SET: in PAIR a row H_A · X_A · Z_A ·
S_A · CNOT · SWAP · RESET applied in order and shown as a tape; from PRODUCT, H_A then CNOT builds Φ⁺ with S_A 0 → ln 2 and CHSH 2 → 2√2 before the eye.

## D1 · T₁ · T₂ ON THE SPHERE (branch `d1-decay` tip `2c6c945`, merged `0f0d11f`; `lab/bloch-model.js`, `lab/bloch.js`, `lab/verbs.js` l.51, `docs/STATE-SCOPES.md`; +19 lab lines → 30,110)
- **The model** (`bloch-model.js` l.34–46): `bloch(r, P, t, dt)` one RK4 step of ṙ = 2h′ × r − (r_x/T₂, r_y/T₂, (r_z + 1)/T₁) in T1's turning frame with the pulse
  window `pulse(P)` already defines; `runR` the vector's run; `decayClosed` (free decay: r_z = −1 + (r_z(0) + 1)e^{−t/T₁}, |r_⊥| = |r_⊥(0)|e^{−t/T₂}); `steadyZ` the
  driven steady state — resonant −1/(1 + Ω²T₁T₂) and, a correction to the brief, the detuned −(1 + δ²T₂²)/(1 + δ²T₂² + Ω²T₁T₂); NaN only under a chirp or FLOP's
  pulse. `DEFAULTS.T1 = T2 = 0` (none): the spinor road `run`/`vec`/`closed` is untouched and the BLOCH picture byte for byte; presets **DECAY** (Ω 0, θ₀ π/2, T₁ 8,
  T₂ 6) and **DAMPED RABI** (Ω 0.5, T₁ 20, T₂ 10 — steady P↓ = (1 − r_z)/2 = 0.5098; the brief had the sign of P↓ wrong: |↑⟩ is r_z = +1).
- **The window** (`bloch.js`): knobs T₁ 0…50 and T₂ 0…100 (T₂ clamped ≤ 2T₁ when T₁ > 0 — a "none" T₂ under a finite T₁ is clamped too, since 0 would break the
  bound); the readout "|r| · Tr ρ² = (1 + |r|²)/2 · P↓" with the closed form in force in its sub; the saturation latitude as a projected 64-segment circle at
  r_z(∞) (ink 0.3; `sphereFrame` draws no equator to copy); the STEP readout's halving distance for the damped run; the `bloch` verb accepts `decay` and `damped`;
  the `instruments.bloch` row names T₁/T₂ (absent at their defaults — `new-project --check` in step).
- **Checked once** (RK4 at DT = 0.05): DECAY r_z against −1 + e^{−t/8} to 4.3e-12 and r_⊥ against e^{−t/6} to 1.5e-11 at t = 1, 5, 20; DAMPED RABI r_z(20·T₁)
  against −1/51 to 2.9e-14 and, at δ = 0.3, against −1/6 to 4.8e-15; T₁ = T₂ = 0: `runR` against the spinor to 1e-10 below t ≈ 6 (2.9e-10 at t = 17.1 — RK4's own
  step error, 16× smaller at dt/2; a road the app never takes there). Screenshot `.tmp/d1-damped.png` in the builder's worktree. Node 0 (bloch's halving law now
  covers the two presets), rack-deps 0, new-project in step, serialize-bytes 11 readings.

## D2 · THE GATE SET
(filled at D2's merge)

## The light check and the cut
(filled at the cut)

## Known, deferred (recorded)
Decoherence on the pair (local dephasing killing CHSH); a chirped drive with damping as a closed form (none — RK4 serves); measurement (a projective click on A); a
three-qubit register.
