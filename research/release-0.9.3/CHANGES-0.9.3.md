# 0.9.3-alpha "Decohere" — what changed (Claude Sos / Fable 5.1, 2026-10-16)

Josh's 10-16 road (0.9.2 Flow · 0.9.3 Decohere · 0.9.4 Separable before the iterative round to 1.0.0) under the dial "don't over verify and bloat the code with
tests. Just build to the best of your abilities and a light visual/functional check". Plan `BUILD-PLAN.md` (30,091 lines, cap 30,391). Two Opus builders in
sequence in BLOCH's two files: D1 `d1-decay`, then D2 `d2-gates` from D1's merge. Build notes: `D1-BUILD.md`, `D2-BUILD.md`. No new test file in either row.

## The shape
T₁ · T₂ ON THE SPHERE: the qubit as the Bloch vector under the Lindblad equation (amplitude damping to |↓⟩, pure dephasing; 1/T₂ = 1/(2T₁) + γ_φ) in T1's turning frame,
RK4 at DT, two knobs (0 = none — the picture byte for byte today's), presets DECAY and DAMPED RABI, the closed forms printed beside the measured (free decay's two
exponentials; the resonant steady state r_z(∞) = −1/(1 + Ω²T₁T₂) drawn as a faint latitude), the purity (1 + |r|²)/2. THE GATE SET: in PAIR a row H_A · X_A · Z_A ·
S_A · CNOT · SWAP · RESET applied in order and shown as a tape; from PRODUCT, H_A then CNOT builds Φ⁺ with S_A 0 → ln 2 and CHSH 2 → 2√2 before the eye.

## D1 · T₁ · T₂ ON THE SPHERE
(filled at D1's merge)

## D2 · THE GATE SET
(filled at D2's merge)

## The light check and the cut
(filled at the cut)

## Known, deferred (recorded)
Decoherence on the pair (local dephasing killing CHSH); a chirped drive with damping as a closed form (none — RK4 serves); measurement (a projective click on A); a
three-qubit register.
