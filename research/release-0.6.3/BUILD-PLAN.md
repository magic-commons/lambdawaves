# 0.6.3 "Event Census" — THE BUILD PLAN (Claude Yan / Fable 5.1, 2026-10-15; drafted ahead — base and cap are filled at 0.6.2's cut)

Josh's dial (2026-10-15): tight builds, features only, no gate code, pre-1.0. THE ENGINE PLAN D.4 (`../release-0.6.0/PLAN.md`), Round 1's T8 · T8′ · T4′ and
Round 2's L-1 / L-1′ / L-10 (the vault's `sweep/SWEEP-SOL.md`, `measure/sweep-sol-census.{py,json}`) are the record. Base: `yan-c` at the 0.6.2 merge tip `545a0f6` (the cut adds version and changelog commits only); 28,504 `lab/` lines; cap 28,504 × 1.01 = **28,789** (285 of headroom).

## The rows (two builders, Opus, own worktrees)
| row | what lands | files | Δ |
|---|---|---|---|
| **E1 THE EVENT CLASSIFIER** (M8, with Round 2's correction L-1′) | VORTEX names each nodal event of the one-electron register from exact f64: J = [∇Re ψ; ∇Im ψ] (2 × 3) and B = [J, F_t] with F_t = ∂_t(Re ψ, Im ψ) — rank J = 2 → "regular line" (a transverse crossing; its tangent ∇Re ψ × ∇Im ψ); rank J = 1 with rank B = 2 → the constrained Hessian H = −Tᵀ(λ·D²F)T/(λ·F_t) on the kernel's tangent plane decides "birth" (H ≻ 0) · "death" (H ≺ 0) · "saddle" (indefinite); rank B < 2 → "unclassified"; the node's velocity V = −Jᵀ(JJᵀ)⁻¹F_t printed beside (it is not j/ρ). The five RECONNECTION strings in `lab/vortex.js` are RETIRED by the measured census: the app's own `recon` preset has ten rank-1 events, all SADDLES (Round 2 L-1, mpmath dps 40) — the readout says "10 saddles · t₀ ∈ {0, 240.63} of T_d = 481.27" from the classifier, never from a stored string. | lab/vortex.js (the locator feeds the classifier; the census readout re-worded) · lab/dynamics.js or a small pure function beside it | +40 |
| **E2 ANGULAR NODES** (M8′) | a sphere in VORTEX drawing the nodal lines of Y_lm for the selected label (or l, m controls): the real Y_lm's zero set is l − |m| circles of latitude and |m| great circles through the poles (l lines); the complex Y_lm's the latitudes alone, plus the poles when m ≠ 0 — from `ylm`'s roots (the latitudes are the roots of P_l^{|m|}, found by the tree's own root finder to 1e-12) | lab/vortex.js (one canvas or the existing overlay) · lab/hydrogen.js (the roots, if not already there) | +40 |
| **M5b THE ASYMMETRIC UNIT** (T4′) — DEFERRED | ÷4 / ÷8 density by symmetry behind a flag, still density only: a speed-up whose claim is a bit-identical digest, with the LOCK to re-bake for any locked state that takes it. Not a feature a user sees; it waits for a cut that needs the ms. | — | 0 |

## The mathematics (Round 1 T8/T8′, Round 2 L-1′, L-10 — KNOWN/DERIVED/MEASURED)
A nodal line of ψ is {Re ψ = Im ψ = 0}; generic points have rank J = 2 (a regular line). An EVENT is a point where rank J = 1 and the time derivative is
independent (rank B = 2): with λ ⊥ range J the constrained Hessian's sign classifies it — (x, y²)-type births/deaths and saddles are all rank 1, so "rank ≤ 1 =
tangency" (Round 1's word) was wrong; the app's `recon` preset shows ten saddles (constrained-Hessian eigenvalues ±24.5 … ±3566). Oracles: ψ_b, ψ_s from the
four-mode QHO (000, 100, 020, 002) with H = +I₂ (birth) and diag(−1, +1) (saddle) at t ≈ 0 (Round 2 L-10) — the builder reproduces these two as its hand check,
not as a new test file. Y_lm: P_l^{|m|}(cos θ) has l − |m| simple roots in (−1, 1); cos(mφ) / sin(mφ) vanish on |m| great circles.

## Gates (existing only) · the cut
Node gate 0 after every row; `pwa --write`; the VORTEX browser suite once; at the cut THE LOCK ×2 (the classifier moves no texel) and the line law; then the
local cut `v0.6.3-alpha` "Event Census". NO push, NO deploy, NO gh release.
