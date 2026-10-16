# 0.9.3 "Decohere" — THE BUILD PLAN (Claude Sos / Fable 5.1, drafted 2026-10-16 ≈11:36 while 0.9.1 H2 builds; base and cap filled at the 0.9.2 cut)

Josh, 2026-10-16: "Let's keep going all the way to 0.9.4. Then we shall begin iterative work till 1.0.0" and the dial "don't over verify and bloat the code with
tests. Just build to the best of your abilities and a light visual/functional check". The rows are 0.8.1's deferred list (`../release-0.8.1/CHANGES-0.8.1.md`:
"a two-qubit gate set; decoherence on the Bloch sphere (T₁/T₂ — the Lindblad road)"). Everything lives in BLOCH (`lab/bloch.js`, `lab/bloch-model.js`, 0.8.1 T1/T2):
nothing touches the main register, the field or the camera. Base: `yan-c` at the commit carrying the briefs after the v0.9.2-alpha cut (**TO FILL**); lines
(**TO FILL**); cap × 1.01. Two rows, two Opus builders IN SEQUENCE (both edit the two Bloch files: D2 launches from D1's merge); the integrator merges, a light visual
check, cuts `v0.9.3-alpha` "Decohere".

## The shape (the law of this cut)
**T₁ · T₂ ON THE SPHERE.** The qubit becomes a state ρ = ½(1 + r·σ) — the Bloch VECTOR, which today is read off a spinor — and moves under the Lindblad equation with
amplitude damping (L₁ = √(1/T₁) σ₋, the ground |↓⟩ at r_z = −1) and pure dephasing (L_φ = √(γ_φ/2) σ_z), 1/T₂ = 1/(2T₁) + γ_φ: in the turning frame T1 already uses
(exact for the circular drive) the Bloch equations are ṙ = 2h′ × r − (r_x/T₂, r_y/T₂, (r_z + 1)/T₁) with 2h′ = (Ω, 0, −(δ + βt)). Two knobs T₁ and T₂ (0 = none, the
default — then the vector is today's spinor's, byte for byte on the canvas; T₂ ≤ 2T₁ enforced: the knob clamps and the readout says why), stepped by RK4 at T1's DT
with T1's dt-halving distance printed; the vector shrinks inside the sphere and the trail spirals in. Three closed forms are printed beside the measured, as T1 prints
P↓: free decay (Ω = 0) r_z(t) = −1 + (r_z(0) + 1)e^{−t/T₁} and |r_⊥|(t) = |r_⊥(0)|e^{−t/T₂}; the driven steady state on resonance r_z(∞) = −1/(1 + Ω²T₁T₂) (saturation),
so P↓(∞) = (1 + r_z(∞))/2; the purity Tr ρ² = (1 + |r|²)/2 as the one number in the readout. Two presets join FLOP · LARMOR · RABI · LANDAU–ZENER: **DECAY** (Ω = 0, θ₀ =
π/2 — the vector falls and the precession fades: T₁ = 8, T₂ = 6) and **DAMPED RABI** (Ω = 0.5, T₁ = 20, T₂ = 10 — the oscillation rings down to the saturation line,
drawn as a faint latitude). PROJECT: BLOCH's `save()` already writes every non-default key — T₁/T₂ ride it (STATE-SCOPES: no new row, the key is `instruments.bloch`'s).
**THE GATE SET.** PAIR mode gets a circuit: a row of trigs **H_A · X_A · Z_A · S_A · CNOT · SWAP · RESET** that apply to the pair state in order and show as a tape
("H_A · CNOT" in the readout); from PRODUCT, H_A then CNOT makes Φ⁺ — S_A goes 0 → ln 2 and CHSH 2 → 2√2 before the eye, which is the Bell circuit and the point of the
row; the local rotation knobs still turn A after the tape; RESET clears it; the tape (≤ 8 gates, dropped oldest) rides `save()` as an array of ids. No decoherence on
the pair (deferred, named).

## The rows
| row | what lands | files | Δ lab |
|---|---|---|---|
| **D1 T₁ · T₂ ON THE SPHERE** (Opus) | `lab/bloch-model.js`: `DEFAULTS` gain `T1: 0, T2: 0`; `bloch(r, P, t, dt)` — one RK4 step of the Bloch equations on the vector in the turning frame (the drive's pulse window as `step` has it); `runR(P, t, dt, from)` the vector's run (the pure case keeps T1's spinor road untouched — `run`/`vec`/`closed` byte-identical); `decayClosed(P, t)` and `steadyZ(P)` the closed forms; PRESETS `decay`, `damped`. `lab/bloch.js`: knobs T₁ (0…50) and T₂ (0…100, clamped ≤ 2T₁ when T₁ > 0), the two presets' labels, the vector taken from `runR` when T₁ or T₂ > 0 (else today's), the readout line "\|r\| 0.731 · Tr ρ² = 0.767 · P↓ 0.912 (steady 0.917)" with the closed form in force named in its sub, the saturation latitude drawn faint when driven and damped, the trail inside the sphere. | `lab/bloch-model.js`, `lab/bloch.js` | **≤ +45** |
| **D2 THE GATE SET** (Opus, after D1 merges) | `lab/bloch-model.js`: `GATES` — the 4 × 4 unitaries as functions on the 8-vector (H_A, X_A, Z_A, S_A as U ⊗ 1 through `su2`'s road or a direct 2 × 2; CNOT and SWAP as index maps); `applyTape(s, tape)`; `DEFAULTS.tape = []`. `lab/bloch.js`: the trig row in PAIR (hidden in ONE), the tape in the ENTANGLEMENT readout's sub ("tape H_A · CNOT"), RESET, `save()`/`load()` carrying the tape (ids only, ≤ 8, unknown ids dropped). | `lab/bloch-model.js`, `lab/bloch.js` | **≤ +30** |

## Laws for the two builders
- Your own worktree, your own branch (`d1-decay`, `d2-gates`) from the base commit (D2 from D1's merge); NO push; never edit `lab/mir/**`, `lab/fonts/**` or
  `lab/field.js`; after any `lab/` edit `node tests/pwa.test.mjs --write` then `./test.sh node`; `node tools/rack-deps.mjs --classes --no-write`, `node
  tools/new-project.mjs --check`, `node tools/serialize-bytes.mjs` (the new keys default-absent) green before you report. **NO NEW TEST FILES, NO GATE SCRIPTS**
  (Josh's dial): the closed forms are printed in the window beside the measured, and checked once in a `.tmp/` throwaway whose numbers go in the build note (D1:
  free decay to 1e-10 against RK4 at DT; the saturation line against the run at t = 20 T₁; D2: H_A · CNOT on PRODUCT equals Φ⁺ to 1e-15, S_A = ln 2, CHSH = 2√2).
- THE LOCK is sacred and trivially so (BLOCH never writes the field); the integrator runs it once at the merge with `--query gastab=0`.
- One build note each: `research/release-0.9.3/D<n>-BUILD.md`. ONE browser check each (a screenshot of the window); never `pkill -f`; ports 9241, 9261, 9443,
  8721/8741, 8731/8735 are taken; D1 9611/5711, D2 9621/5721.

## Gates (existing only) · the cut · deferred
Node gate 0; the line law; THE LOCK once; a light visual check on 9261 (DAMPED RABI ringing down; the Bell circuit from PRODUCT); the local cut `v0.9.3-alpha`
"Decohere", CHANGELOG, snapshot. NO push, NO deploy, NO gh release. Deferred by name: decoherence on the pair (local dephasing killing CHSH), a chirped drive with
damping as a closed form (none exists — RK4 serves), measurement (a projective click on A), a three-qubit register.
