# PILOT-AUDIT — what the pilot Opus 5.5 has checked of Sol's math (0.5.4 PRE-MATH survey)

Stamp: Sat Oct 10 03:56:11 PM CDT 2026 · Sonnet 5.5 survey agent · read-only digest; where a draft contradicts this, this wins unless the draft says why.
Read as text (nothing run, no git, nothing written in the vault): `OBSIDIAN/LAMB of WAVES/for CLAUDE/{flow_containment,round26_audit}/*`; Sol's
`for CODEX/PROJECTOR DERIVATIVE ERROR TRANSPORT — ROUND 26/` (README, ASSUMPTION AND SOL AUDIT, DERIVATIVE ERROR THEOREM, CONTRACT CONTROLS, NEXT SCOPE,
CLAIM REGISTER.json, MONOGRAPH ADDENDUM, final_checks.json, heads of mathematical_review.py/json); `MONOGRAPH NODES VORTICES AND FLOW — ROUND 21/CHAPTER 4`
(+ its CLAIM REGISTER, NEXT SCOPE, SOURCES); `VORTEX AND TOPOLOGY — ROUND 7/Derivations.md` §7–9; `RESEARCH CONTINUATION HANDOFF.md`; and our `lab/molecular-flow.js`.
Only ratios in §1 were computed (by me, from the JSON, with a 10-line json loader — not the pilot's code). R26 = Round 26; R21 = Round 21 Ch.4; R7 = Round 7.

## HEADLINE (read this if nothing else)
1. R26 audit: 1,800 random pointwise trials + 108 optimiser runs found **no violation** of Sol's η0/η1/η2. The bounds are near-tight at small b for n=2 (max ratio
   0.9915 / 0.9811) and loose at larger n and b. The pilot also tried a rank sharpening Sol deliberately did not claim: 0 violations, but non-vacuous in few cells.
2. Flow tube: a toy 2D certificate (5 Gaussians, one vortex, a PSD "tail" that fills the node). **All six runs ended "containment budget exhausted"**; best 0.73
   time units = 14.0 % of one revolution (1.2289 rad = 19.6 % of a turn). The requested horizon (5.318) was never reached. The tail-safe velocity bound is good far
   from the node (0.0088 at r=0.8) and useless at r=0.01 (815 vs speed bound 825).
3. Nothing in the pilot's results contradicts R26 or R21 Ch.4. Three things are NEW relative to Sol: the "tail-safe" velocity bound, the log-norm piecewise Gronwall, and the rank sharpening.
4. Coverage: the pilot touched about 6 of Sol's 58 register claims (C47 value part and C55 directly; C32, C31, C09, C05 only in a toy or as an assumption). Mixed directions, observables, moving frame,
   the repaired-curvature bound, the budget adapter and all molecular claims are untouched (§3). The pilot left no prose: no README, no verdicts — only code + JSON.
5. Engine: the proof ingredients need AO Hessians on **interval boxes**, a retained tail charge q, M=S+ηK with a certified inverse, and 30-digit intervals (11.3 s
   for the toy). `lab/molecular-flow.js` today offers Float64 point value+gradient only (§4).

## 0. What is in `for CLAUDE/` (and how fresh)
| file | bytes | mtime (2026-10-10) | note |
|---|---|---|---|
| flow_containment/flow_tube_certificate.py | 15,459 | 11:22 | NEWER than its JSON by one minute |
| flow_containment/flow_tube_results.json | 6,146 | 11:21 | no `cells_evaluated` key => produced by `tube_certificate`, not `tube_certificate_cells` |
| round26_audit/stress_test.py + stress_results.json | 6,889 / 416 | 11:16 / 11:16 | |
| round26_audit/adversarial.py + adversarial_results.json | 2,247 / 921 | 11:16 / 11:19 | imports stress_test; `__pycache__/stress_test.cpython-313.pyc` => Python 3.13 |
`tube_certificate_cells` (+ `cell`, `cover`, `eps_from`, `GRID = 2.0 ** -7`, "mu/eps/L are maxima over grid cells covering the (inflated) segment boxes") is written but
`__main__` never calls it and no result file for it exists: it looks like the pilot's fix for interval looseness (§1.3d), unrun/unsaved. CLI: `h` argv default 5e-4; the JSON has h = 0.002, so it was run with that arg.

## 1. What each pilot script tests, and what the JSON says
### 1.1 round26_audit/stress_test.py — Sol's theorem, random pointwise
Claim: R26 `DERIVATIVE ERROR THEOREM.md` §1 boxed η1, η2. Docstring: "Independent stress test of Sol's Round-26 derivative-error theorem. Checks, pointwise in s (the proof is
pointwise, so this is stricter than the uniform statement): ||Pi'-P'|| <= e1/d + C2 b M1 ; ||Pi''-P''|| <= e2/d + C2 (b M2 + 2 M1 e1 + e1^2) + C3 b M1^2 with exact constants
C2 = 8/(pi d^2), C3 = 12/d^3 (Sol rounds 8/pi up to 3)." Also: "Also checks the proposed rank sharpening of Section 5: rank(Pi') <= 2m, rank(Pi'') <= 4m, m = min(r, n-r)
=> ||Delta'||_1 <= 4m ||Delta'||, ||Delta''||_1 <= 8m ||Delta''||." Derivatives of Π are "computed exactly (to rounding) with Daleckii-Krein divided differences in the eigenbasis of p".
- Inputs: P(s)=U P0 U†, U=expm(sA1)expm(s²A2), A1,A2 random skew, P0=diag(1_r,0); E(s)=E0+sE1+s²E2 random Hermitian rescaled so ‖E(s0)‖=b at random s0∈(−1,1).
  Grid (n,r)∈{(2,1),(3,1),(4,2),(6,2),(8,3),(10,1)} × b∈{1e-3,0.05,0.2,0.4,0.49} × 60 trials = 1,800; every 5th trial "degenerate" (only sets E0=0). Π=1_(1/2,∞)(p) via `f=(lam>0.5)`.
- Pass/fail: ratio = actual/bound ≤ 1. `ratio0=‖Π−P‖/min(1,b/(1−b))`, `ratio1=‖Π'−P'‖/η1`, `ratio2=‖Π''−P''‖/η2` (exact constants), `ratio1_sol/ratio2_sol` with Sol's 3/d²;
  `rank_violations` counts rank Π'>2m, Π''>4m, Δ'>4m or Δ''>8m (tolerance 1e-9·max(1,σ_max)). Self-check `projector_consistency()` vs central FD (h=1e-4).
- Also: `idem=‖Π²−Π‖` is computed in `check` but is not in `worst`, so idempotency is NOT in the saved results.
- stress_results.json (verbatim): FD self-check rel err [6.00669377038417e-08, 7.857292275723239e-08]; trials 1800; worst ratio0 0.995305991105427, ratio1 0.7394115507552207,
  ratio2 0.5423092012594046, ratio1_sol 0.7365258541869453, ratio2_sol 0.506837077510334, tr1_over_4m 0.8683219732325295, tr2_over_8m 0.4374646358230018; rank_violations 0.
  (Sol's looser 3 > 8/π gives smaller ratios, as it must.)

### 1.2 round26_audit/adversarial.py — optimised search for violations / tightness
Docstring: "Adversarial (optimised) search for violations / tightness of the Round-26 bounds. Pointwise data: P = diag(1_r, 0), P' = [K, P], P'' = [K', P] + [K, [K, P]] (every C2
projector path has this local form), arbitrary Hermitian E, E', E'' with ||E|| = b fixed. Maximise ||Pi^(j) - P^(j)|| / eta_j."
- Method: Nelder–Mead (maxiter 4000, xatol 1e-8, fatol 1e-10) over 10n² real parameters (K,K' skew; E,E1,E2 Hermitian); 6 random starts × j∈{1,2} × 9 settings = 108 runs;
  (n,r)∈{(2,1),(3,1),(4,2)} × b∈{0.01,0.2,0.45}; default constants "exact" (8/π, 12/d³). Criterion: max ratio ≤ 1 (a ratio >1 would be a counterexample).
- adversarial_results.json (max_ratio1 / max_ratio2, rounded to 7 s.f.; full values in the file):
| n,r | b=0.01 | b=0.2 | b=0.45 |
|---|---|---|---|
| 2,1 | 0.9914567 / 0.9810548 | 0.9703703 / 0.8712988 | 0.6832564 / 0.8136545 |
| 3,1 | 0.9750465 / 0.7298470 | 0.8926546 / 0.5304212 | 0.2718081 / 0.07371516 |
| 4,2 | 0.9128200 / 0.5849590 | 0.4145530 / 0.1954906 | 0.03058043 / 0.004798896 |
Max over all 9 settings: 0.99146 (η1) and 0.98105 (η2) — no ratio ≥ 1. Reading: η1/η2 are within 1–2 % of attained at n=2, b=0.01; for n≥3 and b≥0.2 the optimiser finds far less (my reading:
partly looseness, partly Nelder–Mead under-converging in 90–160 dimensions, so these are lower bounds on the true sup).

### 1.3 flow_containment/flow_tube_certificate.py — continuous floor + tube containment (toy 2D)
Docstring: "Continuous finite-basis floor + tube containment certificate (toy 2D model)." Model: 5 real 2D s-Gaussians α=1 at R_0..R_3 = 0.8(cos μπ/2, sin μπ/2), R_4 = origin;
retained c=(1,i,−1,−i,0) "a scalar vortex with an exact node at the origin"; tail E = w1 e4e4ᵀ + w2 g g† (w1=1e-3, w2=5e-4, g fixed complex, normalised); "D = D_r + E (fills the node)";
"M = S + eta K ... q = Tr(M E)", η=0.1. It "Certifies, with mpmath interval arithmetic (outward-rounded): (1) on every box of a tube of radius delta around a computed tracer polyline Y:
rho_r >= rho_lo > 0 (so the full reference rho >= rho_lo as well, and a 1e-7 rejection rule is inactive), the tail-safe velocity error eps_v, the Lipschitz constant L of v_tilde, and the
polyline defect sigma; (2) a piecewise Gronwall bound e(t) for |X(t) - Y(t)| where X is the exact reference tracer (dX/dt = j/rho of D) started at Y(0); containment holds if e(t) < delta for all t
(bootstrap / first-exit argument). (3) a radial scan comparing the tail-safe bound with the generic floor formula (eps_j + J eps_rho/rho_*)/(rho_* - eps_rho)."
(a) Method. `iv.dps=30`; `hi/lo` push endpoints out by `math.nextafter`; `box_quantities` encloses b, ∇b, ∇∇b on a box → ρ_r=u²+w², j, D=∂(j/ρ), L=‖D‖_F, μ = λ_max((D+Dᵀ)/2)
("exact formula for 2x2, interval-evaluated"); leverage ℓ0=bM⁻¹bᵀ, ℓ1=Σ∂b M⁻¹∂bᵀ from a certified inverse (‖M⁻¹−X‖ ≤ ‖X‖δ/(1−δ), δ=‖I−MX‖_F<1; `kappa_upper` = 1.643215542587434e-14).
A=qℓ0 (tail density bound), T=qℓ1. Code comment: "tail-safe bound: sqrt(T) h(A) + V A/(rho+A)", h(A)=√A/(ρ_lo+A) if A≤ρ_lo else 1/(2√ρ_lo). Hand check (mine, not run): valid, from
v−ṽ=(j_t−ṽρ_t)/(ρ_r+ρ_t), |j_t|²≤ρ_tτ_t≤ρ_tT, and sup of √x/(ρ+x); the derivation is written nowhere in the pilot folder. `eps_gen` = Sol's R21 §4.9 formula with ρ_*=ρ_lo, ε_ρ=A, ε_j=√(AT).
(b) Tube step k: `e_new = e*g + (eps_k+sigma_k)*(g-1)/mu`, g=exp(μh); σ_k = |slope−ṽ(mid)| + L_seg·dY/2; `if hi(e_new) >= delta: stop="containment budget exhausted"`. Y = float RK4 polyline of
ṽ=Im(ψ̄∇ψ)/|ψ|² ("Floating v_tilde for the polyline integrator (not part of the proof)"); X(0)=Y(0) so e(0)=0; requested time = ceil(1.02·T_rev/h) steps, T_rev=2π·0.8/|ṽ(0.8,0)|.
(c) flow_tube_results.json — `q_upper_base` 0.003712110294315151; `approx_revolution_time` 5.212848499464987; `seconds` 11.257062435150146; h=0.002 (2,659 steps = 5.318 time units, my arithmetic).
Radial scan (box ±0.005 at angle 0.3 rad; rounded to 7 s.f.; "inf" = Infinity in the JSON):
| r | rho_lo | V | eps_tail_safe | eps_generic | tail_density_bound (A) |
|---|---|---|---|---|---|
| 0.8 | 0.7796670 | 1.192579 | 0.008836740 | 0.008903326 | 0.002240025 |
| 0.6 | 0.6294445 | 1.673094 | 0.01435724 | 0.01449665 | 0.002374621 |
| 0.4 | 0.3582812 | 2.628925 | 0.03461428 | 0.03524671 | 0.002658733 |
| 0.3 | 0.2180371 | 3.599466 | 0.07099397 | 0.07319359 | 0.002831958 |
| 0.2 | 0.1010599 | 5.615601 | 0.2119377 | 0.2264006 | 0.002975872 |
| 0.15 | 0.05687488 | 7.749219 | 0.4784570 | 0.5373364 | 0.003022844 |
| 0.1 | 0.02458420 | 12.41009 | 1.553932 | 2.023080 | 0.003046785 |
| 0.07 | 0.01145427 | 19.26082 | 4.397997 | 7.748605 | 0.003048664 |
| 0.05 | 0.005425999 | 30.11984 | 11.41891 | 41.79673 | 0.003044411 |
| 0.03 | 0.001623628 | 65.17602 | 43.58788 | inf | 0.003035660 |
| 0.02 | 5.651927e-4 | 136.1946 | 116.6817 | inf | 0.003029589 |
| 0.01 | 5.851259e-5 | 825.0314 | 815.2583 | inf | 0.003022552 |
Tube runs (all h=0.002, all `stop` = "containment budget exhausted"; T_cert as stored, rest 7 s.f.; T/T_rev, turn fraction, e/δ are my arithmetic):
| δ | tail scale (q) | T_cert (T/T_rev) | angle rad (of 2π) | e(T) (e/δ) | max_eps | max_mu | max_L_tube | max_sigma | min_rho | max_V |
|---|---|---|---|---|---|---|---|---|---|---|
| 0.02 | 1 (3.712e-3) | 0.404 (7.8 %) | 0.5948468 (9.5 %) | 0.01983452 (.992) | 0.02185199 | 5.965591 | 5.761644 | 0.003918143 | 0.6115890 | 2.001354 |
| 0.05 | 1 | 0.332 (6.4 %) | 0.4597380 (7.3 %) | 0.04961728 (.992) | 0.04260506 | 13.53219 | 12.57564 | 0.003839747 | 0.5767323 | 2.476201 |
| 0.02 | 1e-2 (3.712e-5) | 0.716 (13.7 %) | 1.207059 (19.2 %) | 0.01986438 (.993) | 2.404440e-4 | 5.965681 | 5.761700 | 0.003918143 | 0.5827956 | 2.161253 |
| 0.05 | 1e-2 | 0.462 (8.9 %) | 0.7145496 (11.4 %) | 0.04974790 (.995) | 6.175607e-4 | 17.87699 | 16.41947 | 0.003918143 | 0.4846327 | 3.189698 |
| 0.02 | 1e-4 (3.712e-7) | 0.73 (14.0 %) | 1.228873 (19.6 %) | 0.01998596 (.999) | 2.404569e-6 | 5.965681 | 5.761700 | 0.003918143 | 0.5827956 | 2.161253 |
| 0.05 | 1e-4 | 0.466 (8.9 %) | 0.7230425 (11.5 %) | 0.04928146 (.986) | 6.204711e-6 | 17.87699 | 16.41947 | 0.003918143 | 0.4835436 | 3.199718 |
(d) What the numbers say (my reading, labelled): (i) The saved evidence is a **failure to reach a full orbit**, not a certified orbit. (ii) The tail stops mattering below scale ~1e-2: T rises 0.404→0.716
(δ=.02) and 0.332→0.462 (δ=.05) from scale 1→1e-2, then only →0.730 / 0.466 at 1e-4; max_eps/max_sigma is 5.6 and 11.1 at scale 1, 0.061 and 0.158 at 1e-2, 6.1e-4 and 1.6e-3 at 1e-4.
The limit is then σ (polyline defect, set by h=0.002 and L) and a **positive log-norm μ≈6–18**. With constant coefficients the recurrence gives e(t)=(ε+σ)(e^{μt}−1)/μ, so t* = ln(1+δμ/(ε+σ))/μ:
0.578 (δ=.02, scale 1e-4) and 0.304 (δ=.05) from the table maxima, vs 0.73 / 0.466 certified (local μ is smaller early) — so shrinking h gains only logarithmically; reducing μ is what matters.
(iii) The larger tube is worse at every scale; max_L_tube grows ≈ with δ (5.76→12.6 at scale 1), which looks like interval dependency growth with box width, not physics (inference; max_V is 2.0–3.2
vs a float speed of 0.9643 at Y(0), though speed varies along the path and I did not evaluate it). (iv) max_mu > max_L_tube in **every** row (ratio 1.035–1.089), yet mathematically μ ≤ ‖D‖₂ ≤ ‖D‖_F = L:
the interval-evaluated "exact" 2x2 eigenvalue formula wraps worse than the Frobenius norm, so min(μ, L) would be a free, valid improvement (untested). (v) Average turning rate over the certified part is
1.385–1.686 rad/time vs the start rate 2π/T_rev = 1.2053; it rises with certified length, consistent with Y drifting toward the node (inference; the JSON has no radius history). (vi) min_rho ≥ 0.4835 ≫ 1e-7,
so the density-rejection rule was never near active on the certified part.
(e) Radial scan reading: eps_tail_safe ≤ eps_generic at all 12 radii (1.008× at r=0.8 up to 3.66× at 0.05); eps_generic is Infinity wherever A ≥ ρ_lo (r ≤ 0.03; A/ρ_lo = 0.56 at 0.05, 1.87 at 0.03);
eps_tail_safe/V = 0.0074 (r=0.8), 0.125 (0.1), 0.379 (0.05), 0.669 (0.03), 0.988 (0.01). A is nearly constant (~0.0022–0.0030) while ρ_lo falls to 5.9e-5: the tail fills a disc of radius ≈0.04 here.
Both are bounds; the scan compares bounds with bounds, not with a true error.
(f) Rigor notes from reading (not run): model constants are binary floats (`ETA=0.1`, `1e-3`, `math.cos(m*pi/2)` centres ≈ 1e-16 off the ring, so "exact node at the origin" holds only for the ideal model); `slope`, `dY`,
`T_cert=(k+1)*h` are plain float (not enclosed; ~1e-16 effects); `box_quantities` needs the global `TAIL_SCALE` set in `__main__`; no code integrates the true full-D tracer or evaluates the true ρ_tail/j_tail,
so no independent floating check of the certificate or of ρ_tail ≤ qℓ0 exists. The log-norm Gronwall step itself reads correct to me (convex box, first-exit bootstrap, σ via the mean-value inequality).

## 2. Verdicts, claim by claim (Sol's text | pilot's text/number)
**V1 η0 (value).** Sol (THEOREM §1): "‖Π−P‖ ≤ η0 = min{1, b/(1−b)}". Pilot (stress_results.json): `ratio0` worst 0.995305991105427 over 1,800 trials. CONFIRMS (no violation; essentially tight).
**V2 η1.** Sol: boxed "‖Π'−P'‖ ≤ η1 = e1/d + 3bM1/d²", and "The exact resolvent constant 8/π can replace each displayed 3". Pilot: `ratio1` worst 0.7394115507552207 (8/π), `ratio1_sol` 0.7365258541869453 (3);
adversarial max_ratio1 0.9914567126023018 (n=2,r=1,b=0.01). CONFIRMS (no violation); the 8/π replacement is consistent with 0 violations.
**V3 η2.** Sol: "‖Π''−P''‖ ≤ η2 = e2/d + (3/d²)(bM2+2M1e1+e1²) + 12bM1²/d³". Pilot: `ratio2` worst 0.5423092012594046, `ratio2_sol` 0.506837077510334; adversarial max_ratio2 0.9810547564476783. CONFIRMS.
The 12/d³ constant is Sol's own and was reused unrounded by the pilot: the pilot checks the inequality numerically, not Sol's derivation of 12.
**V4 Tightness.** Sol: "These are sufficient bounds, without a claim of optimality." Pilot: ratios 0.99 at (n=2,b=.01) down to 0.0048 at (n=4,b=.45). CONSISTENT; tight in the small-b/small-n corner, loose elsewhere (or under-searched).
**V5 Trace-norm of derivative errors.** Sol (THEOREM §5): "For derivatives, a universally safe bound is ||2Δ^(j)||1≤2nη_j. The value rank formula is not silently reused for derivative matrices."; AUDIT table: "value-only principal-angle rank
bound not reused". Pilot: tests the rank-based version Sol declined — 0 `rank_violations`, `tr1_over_4m` 0.868, `tr2_over_8m` 0.437. EXTENDS, does not contradict. Caveats (my arithmetic): ‖2Δ'‖₁ ≤ 8mη1 beats 2nη1 only if 4m<n,
‖2Δ''‖₁ ≤ 16mη2 only if 8m<n; and in the grid, 4m<n holds only for (10,1) [plus (3,1),(6,2),(8,3) for the rank of Π' alone], so the second-derivative and Δ rank tests are non-vacuous in 300 of 1,800 trials. The rank claim is a numerical observation, not a proof.
**V6 Internal degeneracy.** Sol (AUDIT table): "Internal eigenvalue degeneracy | ... | Allowed; individual eigenvector derivatives are unnecessary"; Sol's own check is a 4×4 diagonal case (`mathematical_review.py` l.141–145). Pilot: `degenerate` flag only zeroes E0 (comment:
"make E commute-ish with P0 to force internal degeneracies"); E(s0) stays random and norm-b, so no cluster is exactly repeated. NOT TESTED by the pilot (the divided-difference code claims to handle it).
**V7 Sol's checks vs the pilot's.** Sol (CONTRACT CONTROLS): output controls "are center controls, not measured maximum errors on the interval"; all 106 checks in `mathematical_review.py` use 2×2 matrices (`s.eye(2)`, `P0 = s.diag(1,0)`). Pilot: n up to 10, complex Hermitian, random
non-commuting data, optimised adversaries. The pilot is a genuine independent complement (higher dimension, random, floating), not a duplicate.
**V8 Leverage ingredients.** R21 §4.8: "ρ_tail ≤ qℓ0, |j_tail| ≤ q√(ℓ0ℓ1)" and "Point evaluation is not controlled by an arbitrary H1 norm in three dimensions. The finite-basis leverage is the additional structure, and it can be large." Pilot: implements ℓ0, ℓ1 on boxes
(`quad_lev`, `kappa_upper` 1.64e-14), q_upper_base 0.003712110294315151, A≈0.0022–0.0030. USED AS AN ASSUMPTION; never compared with an actual tail density (no code evaluates bEb†). R21's own table is sampled floats ("not continuous
interval/path certificates"): the pilot is the first interval version, in a toy.
**V9 Positive tail and exact zeros.** R21 C31: "An arbitrarily small positive nodeless omitted tail can produce false exact zeros in a retained density." (C09: "Small global positive-tail error cannot certify exact density zeros.") Pilot: the model builds this in ("D = D_r + E (fills the node)")
and the scan quantifies it: A/ρ_lo 0.56 at r=0.05, 1.87 at 0.03, 51.7 at 0.01; eps_tail_safe 815.2582640720339 vs V 825.0314360723967 at r=0.01. CONSISTENT (illustration; Sol's counterexample is exact, the pilot's is a bound).
**V10 Generic velocity formula.** R21 §4.9: "|ṽ−v| ≤ (ε_j+J_*ε_ρ/ρ_*)/(ρ_*−ε_ρ)" with ε_ρ<ρ_*; Round 7 §8 exact-tail form "|v_r−v| ≤ (|j_tail|+|v|ρ_tail)/ρ_r". Pilot: eps_generic = 2.02308025187295 vs eps_tail_safe = 1.5539317735275218 at r=0.1; generic "Infinity" for r ≤ 0.03.
CONSISTENT and EXTENDS: Sol's formula is valid but vacuous once ε_ρ ≥ ρ_*; the pilot's tail-safe bound stays finite and is ≤ generic at all 12 radii (it uses ṽ's own V and |j_t|² ≤ ρ_tτ_t; derivation unwritten, hand-checked by me only).
**V11 Gronwall and containment.** R21 §4.9: "Containment must be proved or bootstrapped; applying a regional estimate after a path has left that region is invalid. These conditional theorems are not completed molecular trajectory certificates."; C32 limitation:
"no certified molecular path". Pilot: performs the bootstrap in a toy with a log-norm piecewise Gronwall (Sol wrote e^{Lt}; the pilot uses μ and a polyline defect σ) and certifies **at most** T=0.73 (14.0 % of T_rev). CONSISTENT: the mechanism works, the horizon is short, nothing molecular.
**V12 Next-scope item.** R26 NEXT SCOPE: "Highest-value proof-only options: derive continuous finite-basis leverage/floor/path containment"; HANDOFF §2: "obtain continuous-region derivative/Lipschitz/floor bounds, choose actual traced paths and establish containment; quantify frozen-frame error
and speed-cap smoothness." Pilot: first three done in a 2D toy; frozen-frame error and speed-cap smoothness not addressed. PARTIAL.
**V13 One path ≠ Hessian.** R26 NEXT SCOPE: "A one-dimensional path certificate does not certify mixed nuclear derivatives or a full Hessian." Pilot's stress/adversarial are one-parameter pointwise; no mixed test. CONSISTENT (and a gap, §3).

## 3. What the pilot has NOT covered of Sol's register (58 claims, R26 CLAIM REGISTER.json)
Touched (partly): **C47** (only η0; "same rank"/idempotent not saved), **C55** (η1/η2, pointwise random + adversarial, not uniform-in-s), **C32** (toy 2D only), **C31/C09** (illustrated by the radial scan), **C05** (q-ℓ0 machinery implemented, not tested vs an actual tail).
Untouched — R26 addendum claims: **C56** (repaired-curvature bound ‖Π'‖≤m1/d, ‖Π''‖≤m2/d+3m1²/d² "in place of the earlier 6"), **C57** (mixed-direction η_uv; bounded one-body observable derivative errors), **C58** (square-unitary connection formulas;
the Fraction budget adapter `contract.py`), **C48** (ε sin(s/ε²) rapid rotation; the exact 25 % worsening example). Also untested inside the theorem: rank 0/n, b>0.49, exact repeated eigenvalues (V6), complex-vs-real splits, nonnormal case (excluded by Sol).
Untouched — Ch.9 machinery: C17–C21, C44–C46 (jets, whitening centers, subspace motion, uncertainty floor, direct projector transport, rectangular frames, linear-frame semantics).
Untouched — rest of the register: C01–C04 (distinct objects; opposite currents; 1RDM vs interaction energy; RHF rank floor), C06–C08 (weighted cuts, mixture pilots, coherence filters), C10 (birth/saddle oracles), C11 & C36 (water slab |s|≤1e-10), C12–C16 (response, CPHF, Chebyshev,
harmonic references, H2 model), C22–C23 & C49–C54 (speedup non-claims, open applications, rounding, lower bounds), C24–C30, C33–C35, C37–C43 (C30 spacetime-zero Hessian classifier; signed 1RDM errors, current transpose, spectral-absolute bounds, node/rank control, basis covariance, Boys, RHF energy interval, rigid-rotation nulls, frequency amplification, correlations, pair phases).
Sol's own R26 limits that no test here can close: "It does not supply missing molecular derivative inputs or a native eigensolver/force/frequency/performance certificate." (README).

## 4. What the pilot's work implies for the λWAVES engine (what the tests assume the app will provide)
- **Field sampler on boxes, to second order.** `box_quantities` needs b, ∇b and the **Hessian** of every AO as interval enclosures over a box (`basis_box`), to get ρ_r, j, D=∂(j/ρ), L, μ. `lab/molecular-flow.js` `at(x,y,z)` calls `ev.aoGrad(P, v, gx, gy, gz)`
  (l.28): Float64 point value + gradient only. No Hessian, no enclosure.
- **A derivative of the velocity field** (D) feeds Lipschitz L, log-norm μ and the polyline defect σ; μ>0 forced the exponential growth that capped the horizon (§1.3d).
- **A state split into retained + tail.** The toy supplies D_r=cc† and a PSD tail E. molecular-flow.js receives only Re/Im D_AO per frame (`set(re, im)`, l.47). A certificate needs the omitted score q=Tr(ME)=δ+ητ (R21 §4.8) retained (or a bound on it), M=S+ηK with a certified
  inverse (pilot: δ<1 test, κ≈1.6e-14), and M's units/basis fixed. Where the app would keep q/E was not checked.
- **A "projector" side (R26).** The theorem needs P(s), p(s) in fixed physical orthonormal coordinates, a gate b<1/2 and certified uniform e1, e2, M1, M2 (R26: "Missing e1/e2 cannot be replaced by a numerical derivative of sampled errors."). The pilot only fabricates such data; the app has none.
- **A precision.** 30-digit mpmath intervals with outward rounding; 11.26 s for 6 tubes of a 5-function 2D model. This is an offline/diagnostic tool, not a per-frame path. It says nothing about Float64 error in the app's own `at()`.
- **A different tracer from the app's.** Pilot: steady flow, continuous reference ODE, float RK4 polyline Y. App: explicit midpoint (RK2) step with a speed cap, density floor `RHO_FLOOR = 1e-7`, field frozen within a frame, D rebuilt each frame. The certificate does not cover cap, frozen-frame time error
  or step truncation (except through σ if Y were the app's own points). R21 §4.9 lists the app's discretisation; the pilot did not model it.
- **The floor that matters is not 1e-7.** In the toy the tail-safe bound is useless (815 vs 825) at ρ_lo≈5.9e-5, 600× above 1e-7. The gating quantity is A/ρ_lo (tail-density bound over retained-density floor), needing q and ℓ0 at the point.
- **Conventions.** The pilot docstring writes D_r = c c†; molecular-flow.js l.4–7 uses D_pq=⟨a†_p a_q⟩ (for ψ=Σc_pχ_p that is c̄_p c_q). The pilot's code uses ψ and j=Im ψ̄∇ψ directly, so its physics matches the app; the docstring's D is the transpose-conjugate. Bounds are unaffected (only PSD-ness of E is used).
- **Dimension.** Toy is 2D s-Gaussians; the app is 3D contracted Gaussians (header: STO-3G); R21 notes point evaluation is not controlled by H1 in 3D, so ℓ0, ℓ1 can be large.

## 5. What I could not read or verify
- I did not run anything (instruction): JSON results are taken as stored; I cannot confirm they come from the current script text (flow script is one minute newer than its JSON; the other files share 11:16–11:19).
- I did not re-derive Sol's constants (1/d, 8/(πd²), 12/d³) or the resolvent proof; I hand-checked only the pilot's tail-safe bound, the generic formula, and the Gronwall step. No Lean/formal check.
- The pilot left no prose; its intent comes from docstrings. Josh's "started work on verifying" is evidenced only by these four files; whatever she reported elsewhere was not in the folder.
- Not read: the 5,558-line Sol chat `SOL-6 LAMB of WAVES.md`, Sol's other R26 scripts (`audit.py`, `contract.py`, `contract_review.py`), the `.tex`/`.lean` corpus, Rounds other than 7/21/26 beyond grep hits for "tube/containment/tracer", and the `.pyc`.
- The grep for "flow tube / flow_tube / containment" under `for CODEX/` found no document named for the pilot's construction; the closest are R21 Ch.4 §4.8–4.9, R7 Derivations §7–9 and the HANDOFF next-step list.
- I could not tell from the files whether the 108 optimiser runs converged (no per-run logs saved), nor the true μ or speed along the tube (no evaluation).
