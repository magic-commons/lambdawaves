# 0.9.2-alpha "Flow" — what changed (Claude Sos / Fable 5.1, 2026-10-16)

Josh's 10-16 road: 0.9.2 Flow · 0.9.3 Decohere · 0.9.4 Separable before the iterative round to 1.0.0, under the dial "don't over verify and bloat the code with
tests. Just build to the best of your abilities and a light visual/functional check". Plan `BUILD-PLAN.md` (base `9aa8fb7`, 30,028 lines, cap 30,328). Two Opus
builders in parallel: F1 `f1-current` (`lab/sliceview.js`), F2 `f2-pbreath` (`lab/calculus.js`, `lab/calculusview.js`). Build notes: `F1-BUILD.md`, `F2-BUILD.md`. No new
test file in either row: the oracle numbers were checked once in a throwaway and printed in the notes; the windows print the exact beside the measured.

## The shape
THE CURRENT ON THE PLANE: j_∥ = Im(ψ̄ ∇_∥ψ) by centred differences of the PLANE window's own N × N sample, drawn as a quiver (ARROWS) or as streamlines (LINES)
over the phase image, a CURRENT seg OFF · ARROWS · LINES on the card, the readout "|j|max" with 2p₊'s closed form ρ/(r sin θ) beside it; OFF is byte-identical.
THE MOMENTUM BREATH: CALCULUS's BREATH tile follows the WAVE seg into momentum space and draws P(p, t) = p² Σ|Σ c F_nl(p)|² from `momentum.js`' exact F_nl (the
oscillator its own radial; the box, ATOM and CENTRAL say "the breath is position's"), ∫P and ⟨p²⟩ printed against 1/n² for a one-label state.

## F1 · THE CURRENT ON THE PLANE (branch `f1-current` tip `7ec08f8`, merged `3f2f6cf`; `lab/slice.js`, `lab/sliceview.js`, `lab/windows/readouts.js`; +58 lab lines → 30,086)
- **`currentOf(sample)`** (`slice.js` l.82–92): j_∥ = Im(ψ̄ ∇_∥ψ) by centred differences of the PLANE window's own N × N sample — no second evaluation of ψ; the grid
  is cell-centred so h = 2·scale/N (scale = √half on the KS plane), the edge ring dropped; the rows are read from a copy of what is on screen (the settled `sample`
  never updates while the clock plays).
- **The CURRENT seg OFF · ARROWS · LINES** on the PLANE card, its readout beside PLANE's: ARROWS a 21 × 21 quiver, LINES 28 streamlines from a fixed seed
  sequence (a still sample redraws the same lines), both drawn in `paint()` only when the seg is not OFF — OFF is byte-identical. The readout "|j|max 0.00183 a.u."
  adds the exact |m|ρ/(r sin θ) with Δ for any ONE label with m ≠ 0 (2p₊: measured 0.00182704, exact 0.00182897, Δ 1.9e-6 at the grid maximum; the worst of ten
  points against `bohmVelocity`'s v·ρ is 4.7e-3, nearest the vortex), and "a real eigenstate carries no current" for m = 0 (1s, 2p_z: 0 exactly). A molecule on or
  the Sturmian scale: the seg paints nothing and the readout says so (`readouts.js` l.96–97).
- **Persistence:** CURRENT rides the existing PROJECT `readers.slice` line, written only when ARROWS or LINES (the new-project file, old projects and OFF saves
  unchanged). **Corrections to the brief:** the spacing law above; `currentOf` lives in `slice.js` (node-importable) with the signature `currentOf(sample)`; the exact
  is shown for any m ≠ 0 label, not only 2p₊. Screenshots `.tmp/f1-arrows.png`, `f1-lines.png`, `f1-off.png` in the builder's worktree. **Checked:** node 0,
  rack-deps 0, new-project in step, one headless run on 9591 (no page errors).

## F2 · THE MOMENTUM BREATH (branch `f2-pbreath` tip `b265b22`, merged `0555e4f`; `lab/calculus.js`, `lab/calculusview.js`; +5 lab lines → 30,091)
- **`radialBreath(reg, t, half, n, p)`** (`calculus.js` l.37–47): in momentum space P(p, t) = p² Σ_lm |Σ_n c_nlm(t) F_nl(p)|² with F_nl hydrogen's exact
  `momentumRadial` (under Z and μ the scaled radial, the exact printing as (Zμ/n)²) and the oscillator's **(−1)^{n_r} R_nl(p)** — the brief said R_nl: the phase
  cancels for one label but not between two labels in one (l, m), so (|0⟩ + |2s⟩) would have drawn wrong; a Hankel transform confirmed the sign — on its own
  quadrature nodes (the p⁻⁴ tail makes B1's map O(h²) only); returns `{ r, P, norm, m2 }`, m2 = ⟨p²⟩ per unit norm (B1's `rMean` is ∫rP/∫P and is kept). The box,
  ATOM and CENTRAL: "the breath is position's".
- **The tile** (`calculusview.js` `breath()` l.80–90): in momentum space the label "P(p, t) = p² Σ_lm |Σ_n c_nlm(t) F_nl(p)|²", the p axis, the readout "∫P =
  1.000000000 · ⟨p²⟩ = 0.0598" and the exact 1/n² for a one-label state; position space draws and reads bit for bit as before.
- **Checked once** (the throwaway's numbers): 1s P(p) against 32p²/(π(1 + p²)⁴) to 3.3e-16; ∫P = 1 and ⟨p²⟩ = 1 (1s), 1/4 (2s, 2p₀, 2p₊₁), 1/9 (3d), 1/36 (6s) to
  1e-12; the oscillator's |0⟩ self-dual exactly; (|0⟩ + |2s⟩)/√2's momentum breath at t = 0 equals its position breath at t = π/2 to 3e-16 (⟨p²⟩ = 5/2 + √(3/2)).
  Screenshot `.tmp/f2-breath-p.png` in the builder's worktree (REVIVAL playing in momentum space, no page errors). Node 0, calculus.test 0/8, new-project in step.

## The light check and the cut
On the merged tree `0555e4f`: node 0, pwa in step, new-project in step, calculus.test 0/8, `lab/` 30,091 of the 30,328 cap; THE LOCK once on 9241 (`--query
gastab=0`): 860 values, 0/0, 59 s (no `field.js` line moved); the visual check: F1's 2p₊ arrows circulate about the vortex on the phase wheel, F2's momentum breath
draws under REVIVAL (the builders' screenshots, read by the integrator). Then the local cut `v0.9.2-alpha` "Flow", CHANGELOG, snapshot 40.

## Known, deferred (recorded)
The current for a molecule on the PLANE (a register's window; the molecular j lives in `molecular-flow.js`' tracers); streamlines in ℝ³ (the tracers are that); the
momentum breath for ATOM and CENTRAL (no momentum road); the KS plane's arrows as a current of ℝ³ (they are the sampled function's).
