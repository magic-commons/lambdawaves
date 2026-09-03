# MATH-LAMBDAWAVES · 2026-09-02 — the mathematics of λWAVES, synthesized

*The ledger of the mathcollab protocol: append-only, one file, every claim with a seat (KNOWN · DERIVED-HERE · MEASURED · REFUTED · UNVERIFIED) and a number. Round 1 is the lead's (Fable 5.1); the rounds with the second lab (Sol) follow only if Josh asks.*

## Josh's words (verbatim)

> "Hello! You're going to be the Lambdawave orchestrator! Let's take over the current build and upgrade it to your hearts content. Whatever cool physics and math you could supply"

> "The main two files I provided are the main notes from GPT-Sol. … The rest is filled with interesting math and the type of specs I kind of go for. Synthesize the math and then pause when you gather enough math ideas"

## Evidence used

- `~/Documents/OBSIDIAN/LAMBDAWAVES CLAUDE MASTER GOAL SPEC:2026-09-02.md` (§0–§10, §11–§20, §28–§45, §46–§52)
- `~/Documents/OBSIDIAN/LAMBDAWAVES STUDY RESEARCH DOSSIER:2026-09-02.md` (§0–§17)
- `~/Documents/OBSIDIAN/SOL'S NEBULA GOAL SPEC:2026-09-02.md` (§4–§9, §15–§32)
- `~/Documents/OBSIDIAN/MIR_CLAUDE_MASTER_GOAL_SPEC_2026-09-02.md` (§7–§12, §20)
- `~/Documents/OBSIDIAN/FABLE 5.1 ZOETROPE.md` (the print §1–§11; the DNA-of-the-saves report)
- the repository `~/Documents/LAMBDAWAVES` at `e818e10` (`lab/*.js`, `tests/*.mjs`, `REPORT.md`); `./test.sh` at 20:2x CDT: node 37/37, browser 23/23
- the probes `research/probes/lw_verify.py`, `research/probes/lw_verify_de.py` (scipy 1.18, sympy 1.14, float64; run with `~/miniforge3/envs/sci/bin/python`)

---

## ROUND 1 · FABLE

### 1 · What the build is

QWAVE-0 is a 91-state register (n ≤ 6, complex Y_lm with the Condon–Shortley phase) evolved in closed form, c_a(t) = e^{−iE_a t} c_a(0); a WebGPU cache of ψ on a 96³ grid built straight from polynomial tables (Laguerre and Legendre-derivative coefficients, six wide); the exact real shadow q = √2 Re c, p = √2 Im c; a spectrum rail, a shadow view, meters, a tier router with idle-zero. Everything the meters say comes from the coefficients, never from the grid. Measured: GPU voxels agree with the closed form to 2·10⁻⁵ (single state) and 2·10⁻⁴ (superposition, f16 storage); ∫ρ = 0.9990 at 96³; a full frame is 3.06 ms at 96³ and 3.89 ms at 128³ with 16 modes. The two proofs are green.

### 2 · The ledger of claims

**C1 · Diagonal evolution is exact.** KNOWN (the spectral theorem); BUILT; the node proof holds unitarity to 10⁻¹³ and the phase law to 10⁻¹⁰. STANDS.

**C2 · The classical shadow is an exact realification.** KNOWN (Skinner, PRA 88 012110; Briggs–Eisfeld); BUILT; RK4 of q̇ = Ap + Bq, ṗ = −Aq + Bp against the closed form to 6·10⁻¹⁵ over 40 a.u.; H_C = c†Hc to 10⁻¹⁴, including the complex-coupling path against the Pauli closed form (4·10⁻¹⁵). STANDS. The firewall stands with it: an equation-level identity, not an ontology (§42.1).

**C3 · The field cache is a rendering product.** MEASURED (above). STANDS as NUMERICAL; the quality law (§43) is enforced by the router.

**C4 · The probability current has a closed form per mode and a conservation law.** For a single (n, l, m) state, j = Im(ψ*∇ψ) = m |ψ|² / (r sin θ) · φ̂ — purely azimuthal, the ring current of the m ≠ 0 states. DERIVED-HERE (from ψ = R Y with only e^{imφ} complex), CHECKED: at three points of 2p₊ the finite-difference j agrees with the closed form to 9·10⁻¹² relative, radial part 3·10⁻¹². For a superposition the current is not azimuthal; the law is ∇·j = −∂ρ/∂t, and ∂ρ/∂t is itself EXACT from the coefficients (∂_t ψ = −i Σ E_a c_a φ_a). CHECKED at 1s + 2p_z, t = T/4: ∇·j = 2.179459·10⁻³ against −∂ρ/∂t = 2.179463·10⁻³ (1.4·10⁻⁶, the finite-difference floor). STANDS. *The instrument reading:* the gradient of every basis function is available from the same tables the kernel already holds — g'(ρ) from the Laguerre coefficients, h'(θ) from the Legendre-derivative coefficients, im from the phase — so j can be built in the same compute pass with no grid-scale error, and "the current conserves probability" is a gate a CPU finite-difference can assert against the exact ∂ρ/∂t.

**C5 · The Rydberg clocks, and what the n ≤ 6 ceiling cannot show.** T_cl = 2πn̄³ and T_rev = 4πn̄⁴/3 = (2n̄/3) T_cl are KNOWN (Averbukh–Perelman; the spec §16). The third clock is T_sr = πn̄⁵ from E''' = 12/n⁵ (DERIVED-HERE, the same expansion one order further; the dossier's "superrevival"). MEASURED here for a Gaussian in n, populations ∝ exp(−(n−n̄)²/(2σ²)), circular ladder:

| n̄ | σ | modes | T_cl | T_rev | \|A(T_cl)\| | \|A(T_rev/2)\| | max \|A\| near T_rev/2 | \|A(T_rev)\| | max \|A\| near T_rev |
|---|---|---|---|---|---|---|---|---|---|
| 5 | 1.0 | 1…11 | 785.4 | 2 618 = 3.33 T_cl | 0.387 | 0.237 | 0.641 at 0.470 T_rev | 0.279 | 0.359 at 1.030 T_rev |
| 15 | 1.5 | 3…27 | 21 206 | 212 058 = 10.0 T_cl | 0.567 | 0.281 | 0.654 at 0.530 T_rev | 0.646 | 0.646 at 1.00002 T_rev |
| 30 | 2.0 | 18…42 | 169 646 | 3 392 920 = 20.0 T_cl | 0.606 | 0.054 | 0.759 at 0.523 T_rev | 0.356 | 0.806 at 0.994 T_rev |

Readings. (i) At n̄ = 5 there is no revival to show: the ladder is too anharmonic (the lab's own preset spans only 4…6 and is weaker still). The report's honest gap is confirmed with a number: **a Rydberg register needs a raised ceiling** — n̄ ≈ 15 gives a clean hierarchy (T_rev = 10 T_cl) with a half revival at 0.53 T_rev and a full one at T_rev. (ii) At n̄ = 30 the cubic phase 8πk³/(3n̄) reaches 2.2 rad for k = 2 by t = T_rev, so |A(T_rev)| = 0.36 while the true peak sits at 0.994 T_rev with 0.81: **the superrevival term shifts and reshapes the revival**, and the lab must mark the measured peak, not the textbook time. STANDS (MEASURED); the closed form of the shift is Q1 below.
*The instrument reading (DERIVED-HERE, arithmetic):* the kernel's six-wide tables hold exactly the states with n − l − 1 ≤ 5 and l − |m| ≤ 5 — all of n ≤ 6, and above it the near-circular states, which are the Rydberg-packet states. Two kernel changes are forced by the numbers: ρ^l overflows f32 at n = 30 (ρ ≈ 60, 60²⁹ = 3.6·10⁵¹ > 3.4·10³⁸), so the radial factor must be formed as exp(ln N − ρ/2 + l ln ρ); and |ψ| ~ n⁻³ (10⁻⁴ at n̄ = 15) falls into f16's subnormal range, so the cache needs a stored scale (half^{3/2}, un-scaled at readback).

**C6 · Hydrogen in momentum space is closed-form, and it is Fock's sphere.** F_nl(p) = √(2(n−l−1)!/(π(n+l)!)) · n² 2^{2l+2} l! (np)^l/(n²p²+1)^{l+2} · C^{l+1}_{n−l−1}((n²p²−1)/(n²p²+1)) is KNOWN (Podolsky–Pauling 1929; Bethe–Salpeter §8). CHECKED here against the direct Hankel transform √(2/π)∫R_nl j_l(pr) r² dr: worst relative difference 4·10⁻¹⁶ (1s), 3·10⁻¹¹ (2p), 4·10⁻⁸ (3d), 1·10⁻⁷ (6f), 3.5·10⁻⁶ (6h, quadrature-limited); ∫F² p² dp = 1.0000000000 for all seven; ⟨p²⟩ = 1/n² (the virial theorem) at n = 1, 3, 6. STANDS. Fock's map ξ = (2p₀p, p²−p₀²)/(p²+p₀²), p₀ = 1/n, sends φ_nlm to a hyperspherical harmonic Y_{n−1,l,m} on S³ (KNOWN, Fock 1935) — the SO(4) degeneracy made visible; the normalization constant and the Jacobian on S³ are UNVERIFIED here (Q2).
*The instrument reading (DERIVED-HERE):* the momentum kernel needs only the Gegenbauer coefficients (degree n − l − 1 ≤ 5, the same width) and the SAME angular tables the position kernel holds; a MOMENTUM FIELD is the same register, the same c(t), a second closed form. Its exact checks: the momentum density of a stationary state is still (Ehrenfest gives d⟨r⟩/dt = ⟨p⟩, so the 1s + 2p_z dipole beat's momentum sloshes a quarter period ahead of its position).

**C7 · KS: each n-manifold is a 4D oscillator; a superposition across n is not one oscillator.** With r = |u|² the Coulomb equation times r reads (−⅛∇_u² − E|u|²)ψ = ψ: a 4D isotropic oscillator of mass 4 and frequency ω = √(−E/2), eigenvalue 1, so (N+2)ω = 1. DERIVED-HERE and CHECKED: ω = 1/(2n) and N = 2n − 2 exactly at n = 1, 2, 6, 15 (KNOWN in substance: Kustaanheimo–Stiefel 1965; Fabčič–Main–Wunner PRA 79 043416 for the packets). Consequence: the KS OSCILLATOR view has one fictitious clock per n; a state spread over several n has no single s-time. It must be a per-manifold representation with its own clock, labelled (§42.3). STANDS; the fibre-invariant projector is Q3.

**C8 · A general STATE ROTATE is a Wigner D-matrix per l-block.** c'_{nlm'} = Σ_m D^l_{m'm}(α, β, γ) c_{nlm}, with d^l_{m'm}(β) by the explicit factorial sum. CHECKED: 855 entries (l = 1…5, three angles, all m', m) against sympy's Rotation.d to 9.4·10⁻¹⁶; row norms to 1.8·10⁻¹⁵; R_y(π/2) p_z → (+1/√2, 0, −1/√2) = p_x exactly. STANDS; cost O(Σ(2l+1)²) per rotation, negligible. Ready to build; the existing R_z is the γ = 0 = β special case.

**C9 · Two modes trace a torus knot on S³, and the Hopf map is the Bloch sphere.** For a normalized two-mode state the shadow (q₁, p₁, q₂, p₂) lies on the unit S³ ⊂ R⁴; under diagonal H each pair rotates at −E_a, so the orbit lies on the Clifford torus |c₁| = const and closes iff E₁/E₂ is rational — for hydrogen E_n = −1/(2n²), so the winding numbers are n₂² : n₁² (1s:2s = 4:1, 2s:3s = 9:4, 1s:3s = 9:1). DERIVED-HERE (elementary); the Hopf map S³ → S² of that orbit is the Bloch vector of the pair (KNOWN). NEBULA's 4D camera grammar (§7.3–7.5 of Sol's spec: holomorphic U(2) preserves the fibre shapes, generic SO(4) shears them, the Grassmannian S²×S² of view planes) applies to this R⁴ verbatim, and the Lissajous envelope the lab already draws is the projection caustic J = |u|² − |v|² = 0 of the torus (§9 of Sol's spec). UNVERIFIED as a picture; the identities are exact. This is the one place the NEBULA mathematics and λWAVES meet on the same object.

**C10 · The tiny synthetic lattice is exact by the DFT.** i ċ_k = ε c_k + J(c_{k−1} + c_{k+1}) on a ring of N sites has E(κ) = ε + 2J cos(2πκ/N) and c(t) = c(0) ∗ F⁻¹{e^{−iE(κ)t}}. KNOWN. One MODE system, a DIAGONAL backend after one FFT; the shadow comes free (C2). STANDS; the first non-atomic card (§29).

**C11 · What transfers from ZOETROPE and the finite-field wing is discipline, not physics.** POSE-vs-IDENTITY (the film) and OBSERVER-vs-STATE (the lab) are the same law; the print's fold identities (Λ_n = ∏2Z_j, the word) do not enter hydrogen. The arithmetic Ouroboros z → z² + c over F_{q²} is an exact MODE system on a cycle (eigenvalues e^{2πik/λ}, the DFT modes) and belongs to a later card (§38); it shares nothing with the Coulomb spectrum but the name λ. STANDS as scope.

**C12 · The analytic packet launch is a projection with a loss the UI must print.** ⟨nlm|G⟩ for a Gaussian of width w at r₀ with momentum p₀ is a 3D overlap integral; inside n ≤ 6 the loss is large for any packet that resembles the Falstad gesture (a localized lump needs n ≳ r₀^{1/2}). UNVERIFIED (Q6): the number decides whether LAUNCH is a QWAVE-0.x feature or waits for the Rydberg ceiling.

### 3 · The idea menu — what QWAVE-0.x could add, each as a contract

| # | idea | seat | what it needs | the gate (oracle) | cost |
|---|---|---|---|---|---|
| I1 | **THE CURRENT** — j = Im(ψ*∇ψ) in the reconstruction pass from the analytic per-mode gradient; a FLOW view (hue = screen-plane direction of j, luminance = \|j\|) that shows the 2p₊ ring current and the dipole's sloshing | EXACT ANALYTIC (gradient) · NUMERICAL (f16) | `hydrogen.js` gradient tables (L', D'), `field.js` a second rgba16float texture and a 3-vector accumulator, `rack.js` the view | GPU j at five voxels vs the CPU closed form m\|ψ\|²/(r sinθ) for 2p₊ (≤ 10⁻⁴); ∇·j + ∂ρ/∂t = 0 on the 1s+2p_z beat by CPU differences (≤ 10⁻⁵); no page errors | one evening |
| I2 | **RYDBERG REVIVALS** — a raised basis ceiling as a REBUILD (near-circular states above n = 6), the log-space radial factor, a scaled cache, presets n̄ = 15 and 30, a REVIVAL meter (n̄, T_cl, T_rev, T_sr from the populated register) and clock markers on the scrub at the MEASURED peaks | EXACT ANALYTIC | `hydrogen.js` basis ceiling + factorials in logs, `state.js` register rebuild, `field.js` kernel (exp of a sum; scale word), `spectrum.js` ladder to the ceiling, tests | \|A\| at the C5 table's numbers to 10⁻⁶ (the CPU is exact; the gate is that the lab's meters print them); GPU voxels of a circular n = 15 state vs the closed form (≤ 10⁻³ rel, f16); ∫ρ = 1 ± 0.01 at the auto domain | one to two evenings |
| I3 | **STATE ROTATE D(R)** — any axis: three Euler knobs or a drag on a rotor, the block-diagonal D^l on the register | EXACT ANALYTIC | `state.js` rotate(α, β, γ), a kit rotor, tests | R_y(π/2) p_z → p_x to 10⁻¹⁴; D unitary to 10⁻¹⁴; digest changes at RECONSTRUCT, the camera's does not | hours |
| I4 | **MOMENTUM FIELD / FOCK S³** — a second kernel family (Gegenbauer tables, same angular tables), a POSITION / MOMENTUM representation switch (REBUILD), Fock's latitude χ = 2 arctan(np) as an optional hue | EXACT ANALYTIC (closed form) · NUMERICAL (cache) | `momentum.js` tables, `field.js` a second compute kernel, `rack.js` the switch and the badge | F_nl closed form vs Hankel (C6, done), ∫F²p²dp = 1, ⟨p²⟩ = 1/n²; GPU voxels of φ_nlm(p) vs the CPU closed form; Ehrenfest on the dipole beat: ⟨p_z⟩(t) = d⟨z⟩/dt from the coefficients | one to two evenings |
| I5 | **SHADOW S³ / HOPF** — the two-mode shadow on the 3-sphere: a 4D camera (NEBULA's U(2)/SO(4) grammar), the torus knot with winding n₂² : n₁², the Hopf/Bloch projection beside it | EXACT REAL REPRESENTATION | `shadowview.js` a fourth mode with a 4×4 rotor and stereographic projection | the drawn orbit closes after n₂² : n₁² turns (1s+2s: 4:1) to 10⁻⁹; the Bloch vector's length is 1 | one evening |
| I6 | **TINY LATTICE** — the N-site ring/chain as a second SYSTEM: MODE + SHADOW + a 1D field strip; hopping, on-site profile, seeded disorder | EXACT FINITE MODEL | `lattice.js` (DFT exact), the system switch, tests | c(t) by DFT vs a matrix exponential to 10⁻¹²; the shadow's H_C = c†Hc | one evening |
| I7 | **KS OSCILLATOR** — per-n only, its own s-clock, labelled | EXACT (per manifold) | a view over one degenerate manifold | (N+2)ω = 1 with N = 2n−2 | later; needs Q3 |
| I8 | **PACKET LAUNCH** by projection, loss printed | EXACT (projection) | overlap integrals ⟨nlm\|G⟩ | the printed loss equals 1 − Σ\|c\|² | after Q6 |
| I9 | **ARITHMETIC OUROBOROS** card (F_{q²}, cycle spectrum) | EXACT FINITE MODEL | a new system | exact by construction | later (§38) |

The order that respects the report's own list and the numbers above: **I1 → I2 → I3 → I4 → I5**, with I6 as the architectural proof whenever a second system is wanted.

### 4 · Questions for the second lab (each must be answered with a number or a counter-example)

**Q1 (DEEPEN — the revival's shift).** For populations Gaussian in n about n̄ with width σ, the cubic phase 2k³t/n̄⁵ displaces the full revival's peak. Derive the peak time t* to first order in σ²/n̄ and its height, and check against the measured 0.99433 T_rev, |A| = 0.8055 at n̄ = 30, σ = 2, and 1.00002 T_rev at n̄ = 15, σ = 1.5. State the σ, n̄ region where the textbook T_rev marker is within 1 % of the true peak.

**Q2 (LOCATE — Fock's constant).** Give the exact normalization of φ_nlm(p) as a hyperspherical harmonic under ξ = (2p₀p, p²−p₀²)/(p²+p₀²), p₀ = 1/n, including the Jacobian (2p₀/(p²+p₀²))³, and check it numerically at (2,1,0) and (3,2,1) against the C6 closed form to 10⁻¹⁰.

**Q3 (LOCATE — the KS projector).** The 4D oscillator at N = 2n − 2 has (N+1)(N+2)(N+3)/6 states; hydrogen has n². Write the fibre-invariance constraint (the KS bilinear form) as an operator and its projector onto the n² states; verify the count at n = 2, 3.

**Q4 (DEEPEN — the current at the axis).** From the tables, prove j is finite on the z-axis for every (n, l, m) (the sin^{|m|−1}θ factor) and bound the relative error of the f16-stored j near r → 0 for l ≥ 1 where h'/r appears; give the voxel at which the 96³ grid's error exceeds 10⁻³ for 2p_z + 3d_{z²}.

**Q5 (BROADEN — the torus knot and its caustic).** Prove or refute: the Lissajous figure of a hydrogen pair is the orthogonal projection of a (n₂², n₁²) torus knot on the Clifford torus, and its envelope is the projection caustic J = 0 of Sol's §9 form. If true, give the envelope's equation for 1s + 2s.

**Q6 (LOCATE — the launch loss).** For a Gaussian packet of width w = 2 a₀ centred at r₀ = 8 a₀ with p₀ = 0.3 a.u. along φ̂, compute Σ_{n≤6}|⟨nlm|G⟩|² and Σ_{n≤15}|…|² (near-circular subset). The two numbers decide I8's place in the order.

### 5 · NOT CERTIFIED

No GPU ran for any claim in this round; every number is float64 CPU arithmetic (scipy quadrature, sympy for the Wigner reference). The quadrature floor at n = 6, l = 5 is 3.5·10⁻⁶ and is the test's, not the closed form's. The QWAVE-0 proofs were run once on this machine (37/37, 23/23) and are the only device evidence in this file. Nothing was committed; `research/` is untracked in this repo and its status is Josh's call.

### 6 · Decisions only Josh can make

1. The Rydberg ceiling (n ≤ 15 keeps voxels ≈ 10 a₀ at 96³; n ≤ 30 needs 128³ or a Rydberg-only domain).
2. Whether MOMENTUM is a VIEW (an observer switch, the same cache regenerated) or a SYSTEM (a REBUILD with its own badge). The spec's §13 says representation change is REBUILD; the badge needs saying either way.
3. The order of I1…I5, or a different pick from the menu.
