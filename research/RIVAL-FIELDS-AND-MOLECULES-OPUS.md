# RIVAL ROUND · FIELDS AND MOLECULES · OPUS
### An adversarial reply to ROUND 1 · FABLE of `research/MATH-FIELDS-AND-MOLECULES-2026-09-04.md`
**2026-09-04. Every number in this file was produced by a probe in `research/probes-fields/opus-*.{py,mjs}` and can be re-run.**

Probes written and run for this round:

| file | what it certifies |
|---|---|
| `opus-q1-potential.py` | the closed-form Φ of a hydrogenic **pair** density; three independent routes agree to 12 digits |
| `opus-q2-atoms.py` | a central-field atom solver (Hartree-SIC and Xα); He lands on the HF limit to 5.5e-9 Eh; Ne, Ar, Na, K, Sc |
| `opus-q3-twocentre.py` | two-centre STO/hydrogenic integrals in prolate-spheroidal coordinates, machine-precision at **8** quadrature points; the whole H₂⁺ ladder |
| `opus-q4-lobes.mjs` | the four-channel state's frequency list, period, harmonic content vs radius, and the libration of the three lobes |
| `opus-q5-bfield.py` | the exact on-axis Biot–Savart field of the 2p₊₁ current, cross-checked against the orbital hyperfine field to 3e-12 |
| `opus-q6-wigner.py` | the Dahl–Springborg Wigner function of 1s and its minimum, certified on two exact identities |
| `opus-q7-closure.py` | the dilation/translation closure theorem and the rigorous Pulay bound |

---

## 1. WHAT ROUND 1 GETS WRONG

Sentence quoted, number that kills it, corrected line as a gate could assert it.

---

### KILL 1 — the rotation gate is off by a factor of three

> *"**Gate:** rotate the clock by 201 a.u. and the 3-lobed pattern returns to itself; by 100.5 it has turned by π."* (C.2)

**The number.** In Josh's state 2p₋₁ + 2p₊₁ + 4p₋₁ + 4d₊₂ there are six pairs and **every nonzero |ΔE| is the same number, 3/32 = 0.09375** (both shells are degenerate internally; every cross-shell pair is E₄ − E₂). So the whole density is periodic with one period,

    T = 2π/(3/32) = 67.0206 a.u. = 1.6212 fs.

Measured, `opus-q4-lobes.mjs` §2, max|ρ(φ,0) − ρ(φ,t)| at r = 6, θ = 75°:

| t | t/T | max&nbsp;\|Δρ\| |
|---|---|---|
| 16.755 | 0.25 | 3.174e-4 |
| 33.510 | 0.50 | 3.670e-4 |
| **67.021** | **1.00** | **3.795e-19** ← returns |
| 100.531 | 1.50 | 3.670e-4 |
| 134.041 | 2.00 | 5.421e-19 |
| 201.062 | 3.00 | 2.168e-19 |

201.06 passes the gate only because it is **3T**. It is the time for the *phase angle* of a 3-fold pattern to advance by 2π; a 3-fold pattern is invariant under 2π/3, so its period is 2π/(3Ω) = 2π/ΔE = 67.0206, not 2π/Ω.

**Corrected gate.** `max_φ |ρ(φ, 0) − ρ(φ, 67.0206)| < 1e-15` and `max_φ |ρ(φ, 0) − ρ(φ, 33.5103)| > 1e-4`. For a general register state the period is `2π / gcd{|E_a − E_b| : c_a c_b ≠ 0}`, and the k-fold *sub*pattern of one pair returns after `2π/|ΔE_ab|`, never after `2π/Ω_ab`.

---

### KILL 2 — the standing part is the 3-fold, not the 2-fold

> *"at t = 0 with equal real amplitudes the 2-fold … dominates (0.955) … and P1 counts 2 maxima there. The three lobes he filmed are the 3-fold term winning at the amplitudes and time he had."* … *"That is the spiral in the video: a standing 2-fold under a turning 3-fold."* (C.1, C.2)

Three numbers kill this.

**(a) The three lobes are there at t = 0.** P1 sampled ρ at two points, (r = 3, 6). What a volume render shows is the density *integrated* over r and θ at each φ. `opus-q4-lobes.mjs` §5 computes exactly that: **the column density has 3 maxima in φ at every time in the period, t = 0 included.** No fader setting or clock time is needed to make the lobes appear.

**(b) The 3-fold at large radius is STATIC.** The k = 3 harmonic has two sources: 4d₊₂ × 2p₋₁ (ΔE = 3/32, turning) and **4d₊₂ × 4p₋₁ (ΔE = 0, standing)**. Their ratio, static : turning, from `opus-q4-lobes.mjs` §4:

| r | 2 | 4 | 6 | 8 | 10 | 16 | 20 |
|---|---|---|---|---|---|---|---|
| static/turning | 0.358 | 0.215 | 0.089 | 0.584 | 1.204 | **4.316** | **58.665** |

Beyond r ≈ 9 the 2p radial functions (e^{−r/2}) are dead and the three-lobed figure is the pure n = 4 pair, whose ΔE is **exactly zero**. At r = 16 and r = 20 the k = 3 harmonic is 0.789 and 0.980 of the mean — total domination — and it does not turn at all.

**(c) The figure librates, it does not turn.** Over one full period the phase of the k = 3 harmonic of the column density moves through **14.56°** (a full turn would be 120°), while its amplitude *breathes* between 0.2657 and 0.5841 — a factor 2.20. The k = 2 harmonic is exactly constant at 0.5028 with a fixed phase.

**Corrected line.** *The filmed object is a standing three-lobed figure — the ΔE = 0 pair 4d₊₂ × 4p₋₁, which owns the density beyond r ≈ 9 — whose contrast beats by a factor 2.2 with period 67.02 a.u. while its axis rocks through 14.6°. The two-fold (2p₋₁ × 2p₊₁, ΔE = 0) is exactly static and lives inside r ≈ 8. Nothing in this state turns through a full circle.*

---

### KILL 3 — the near-zone criterion is kr, not λ/stage

> *"λ/stage ≈ 144 … retardation negligible to one part in 144"* (A.1)

The retardation parameter is **kr**, not λ/r. At the stage edge quoted in A.1 (r = 16 a₀), with λ_Lyα = 2296 a₀:

    kr = 2π·16/2296 = 0.04377 rad = 2.51°  →  one part in 22.8, not 144.

(And the digest assumes a 30 a₀ stage, where kr = 0.0821 — one part in 12.2. The two documents disagree about the stage.) The dipole near field goes as 1/r³ : ik/r² : −k²/r, so the *relative* size of the induction term is kr = 4.4 %, and the phase lag of the drawn field at the edge is 2.5°.

**Corrected line.** *On a ±16 a₀ stage the Lyman-α retardation parameter is kr = 0.0438: the induction correction to the quasi-static field is 4.4 % at the edge and the field there lags the source by 2.5°. The magnitude error of drawing the static field alone is (kr)²/2 = 0.1 %.*

---

### KILL 4 — the B/E ratio is 1.8e-6, not 1e-5

> *"the magnetic field is smaller than the electric by α² v² ~ 10⁻⁵"* (A.1)

α² = 5.325e-5. `opus-q5-bfield.py` computes the exact field of the 2p₊₁ current and the force ratio on an electron moving at 1 a.u.:

| Z (a₀, on axis) | B (T) | F_B/F_E |
|---|---|---|
| 1 | 0.429533 | **1.827e-6** |
| 5 | 0.077110 | 8.201e-6 |
| 30 | 0.00046359 | 1.775e-6 |

At 1 a₀ the true ratio is **29× smaller** than α², because the point-dipole law (which is what α²/r³ encodes) over-counts by exactly that factor when the field point is inside the current cloud — and ⟨r⟩₂ₚ = 5 a₀, so 1 a₀ is deep inside.

**Corrected line.** *α² is the right order only outside the cloud. At 1 a₀ on the axis of 2p₊₁ the magnetic-to-electric force ratio is 1.83e-6; it peaks at 8.2e-6 near r ≈ 5 a₀ where the dipole law takes over.*

---

### KILL 5 — P4's Hellmann–Feynman numbers are wrong in the third digit

> *"On the lab's H₂⁺ at R = 2 the LCAO density pulls nucleus B toward A with 0.130157, the other proton pushes with 1/R² = 0.25: F_HF = +0.119843 … The gap, 0.066, is the Pulay force"* (A.3)

P4 integrates the kernel (z − z_B)/r_B³ on a **cylindrical midpoint grid**, straight through the 1/r_B² singularity at the nucleus. `opus-q3-twocentre.py` §6 does it on a two-centre Becke-partitioned grid where the r_B² Jacobian cancels the kernel exactly, and the result is converged to 10 digits and independent of the grid (checked at four refinements) and reproduces the analytic |χ_A|² piece −q_enc(R)/R²/(2(1+S)) = **−0.0600314621** exactly:

| quantity | Round 1 (P4) | this round | analytic check |
|---|---|---|---|
| electron force on B | −0.130157 | **−0.13390616** | |χ_A|² piece −0.06003146 exact |
| F_HF | +0.119843 | **+0.11609384** | |
| −dE/dR | +0.053804 | **+0.05380439** | analytic, mpmath 40 dps |
| Pulay gap | 0.066039 | **0.06228945** | |

The grid is certified by an independent physical fact: with a near-exact basis (2×(11s8p5d) even-tempered, E(2) = −0.602626 vs exact −0.6026342) the same grid gives F_HF = −0.000235 against −dE/dR = −0.000287 — the Hellmann–Feynman theorem satisfied to 5e-5, as it must be.

**Corrected line.** *At R = 2 the 1s LCAO gives F_elec = −0.1339062, F_HF = +0.1160938, −dE/dR = +0.0538044, Pulay = +0.0622895 Eh/a₀.*

---

### KILL 6 — the Pulay gap is not a size problem, and the register's 2p makes it worse

> *"**The gap, 0.066, is the Pulay force of a minimal basis** — the theorem is exact only for exact (or complete-basis) states"* (A.3) and *"adding 2p_z on each centre must bring R_e from 2.49 toward 2.00 and E toward −0.6026"* (E.3)

The ladder, all at R = 2, from `opus-q3-twocentre.py` §6:

| basis | E(2) | F_HF | −dE/dR | **Pulay** |
|---|---|---|---|---|
| 1s (ζ=1) — the lab | −0.5537715 | +0.116094 | +0.053804 | **0.062289** |
| **+ the register's 2p_z (ζ=1/2)** | −0.5538153 | +0.117042 | +0.053200 | **0.063842 ← worse** |
| register n≤6, ζ=1/n, **42 functions** | −0.5721587 | +0.080683 | +0.038498 | **0.042185** |
| 1s + 2p_z with the **same** ζ=1, 4 functions | −0.5659100 | +0.060618 | +0.049101 | **0.011517** |
| 1s+2p, exponents optimised | −0.6003621 | −0.000459 | +0.000092 | −0.000550 |
| even-tempered 2×(11s8p5d) | −0.6026264 | −0.000235 | −0.000287 | 0.000053 |

Adding the register's own 2p_z **increases** the Pulay force by 2.5 %. Forty-two register functions reduce it by 32 %. **Four** functions with the *right* exponent reduce it by 82 %. So it is not "a minimal basis" — it is a basis that is not closed under ∂/∂R (see §3).

**Corrected line.** *The Pulay force vanishes not when the basis is large but when it is closed under nuclear translation: ∂/∂R_C of r^{n−1}e^{−ζr}Y_lm is a combination of STOs with the **same** ζ and (n−1, l±1), (n, l±1). The register's 2p_z has ζ = 1/2 and radial power r¹ and is not that function; adding it makes the gap worse (0.062289 → 0.063842).*

---

### KILL 7 — the register's fixed exponents cannot reach R_e, and it is a theorem, not a size question

> *"the basis is the register's hydrogenic (n, l, m) functions on each centre (a Slater-type basis with the exact hydrogenic exponents…)"* / *"adding 2p_z on each centre must bring R_e from 2.49 toward 2.00"* (E.3)

`opus-q3-twocentre.py` §2, the register's own labels (ζ = 1/n, m = 0, l ≤ n−1, both centres), quadrature converged to 10 digits, rank full at every size:

| basis | dim | E(R=2) | R_e | E_min | D_e/eV |
|---|---|---|---|---|---|
| n ≤ 1 (the lab) | 2 | −0.553771495 | 2.49283 | −0.564830992 | 1.7641 |
| n ≤ 2 | 6 | −0.563975816 | 2.40548 | −0.571605701 | 1.9485 |
| n ≤ 3 | 12 | −0.567733009 | 2.39410 | −0.574940880 | 2.0392 |
| n ≤ 4 | 20 | −0.570043843 | 2.37646 | −0.576723531 | 2.0878 |
| n ≤ 5 | 30 | −0.571333430 | 2.36270 | −0.577585331 | 2.1112 |
| **n ≤ 6 (the whole register)** | **42** | **−0.572158718** | **2.35227** | **−0.578077630** | **2.1246** |
| exact H₂⁺ | ∞ | −0.602634214 | 1.997193 | −0.602634634 | 2.7928 |
| **1s, ζ optimised (2 functions)** | 2 | **−0.586505992** | **2.00330** | −0.586506502 | 2.3540 |
| 1s+2p, ζ optimised (4 functions) | 4 | −0.600362122 | 2.00061 | −0.600362142 | 2.7310 |

**Two functions with a free exponent beat forty-two with fixed ones**, at R = 2 by 14.3 mEh and at R_e by 0.35 a₀. The register's R_e improves by only 0.1406 a₀ over five whole shells (2.49283 → 2.35227), and the energy increments at R = 2 are dying: −0.010204, −0.003757, −0.002311, −0.001290, −0.000825 Eh per shell, a sequence falling as ≈ n^{−2.45}. A power-law extrapolation puts the n → ∞ limit near −0.576, still 27 mEh above the exact answer.

That extrapolated floor is not an artefact. **It is a theorem, and here it is with a number.**

**The completeness theorem.** The hydrogen *bound states* {R_nl, ζ = Z/n} are not complete in L²; their closure omits the continuum. The Coulomb Sturmians, the same functions with **one common** exponent, are complete. The sharpest test is the united-atom limit: R → 0 of the H₂⁺ σ_g is the He⁺ 1s, E = −2 exactly. `opus-q7-closure.py`:

| N (s-functions) | hydrogenic ζ=1/n | Sturmian λ=1 |
|---|---|---|
| 1 | −1.500000000 | −1.500000000 |
| 4 | −1.552310259 | −1.991399546 |
| 8 | −1.556965417 | −1.999994908 |
| 12 | −1.557938074 | −1.999999999 |
| 20 | −1.558462108 | −2.000000 (converged) |

**The register's fixed-exponent set has a hard variational floor at ≈ −1.5585, 0.4415 Eh above the truth, for any number of functions.** The reason is measurable: expanding the united-atom orbital e^{−2r} in *all* the bound s-states of the register's own Hamiltonian captures only

    Σ_n |⟨ns(Z=1)|1s(Z=2)⟩|² = 0.766444 ,

so **23.36 % of the united-atom orbital lives in the continuum and is unreachable by any register state.**

**The cusp theorem (the same failure at finite R).** Kato: the exact σ_g obeys ∂ψ/∂r_A|₀ = −Zψ(A). Every l = 0 hydrogenic function on A has cusp −1; the functions on B are smooth at A. So the effective cusp the basis can produce is −ψ_A(A)/(ψ_A(A) + ψ_B(A)), i.e. the deficit is exactly e^{−ζR}/(1 + e^{−ζR}): **26.9 % short at R = 1, 11.9 % at R = 2, 4.7 % at R = 3.** Never −1. The optimised exponent ζ = 1.2387 *overshoots* to −1.143, which is what a variational principle does when it cannot satisfy the cusp: it trades cusp error for bond density.

**Corrected line.** *The register's fixed hydrogenic exponents are not a Slater basis with "the exact exponents" — they are an incomplete set with a hard floor. The whole 42-function σ set gives E(2) = −0.5721587, R_e = 2.35227, D_e = 2.125 eV. One free exponent does better. The fix is one number, not more labels (§3).*

---

### KILL 8 — the prolate-spheroidal claim is stated backwards

> *"they are EXACT in prolate-spheroidal coordinates by Gauss–Legendre × Gauss–Laguerre quadrature (**the volume element and 1/r_A, 1/r_B are polynomial in (ξ, η)**)"* (E.3)

1/r_A = 2/(R(ξ+η)) is a **rational** function with a pole on the corner ξ = 1, η = −1; so is P_l(cos θ_A) = P_l((1+ξη)/(ξ+η)). Implementing the sentence as written gives a divergent integrand at the corner. What is polynomial is the *product*:

    dV/r_A = (R²/4)(ξ − η) dξ dη dφ ,   dV/r_B = (R²/4)(ξ + η) dξ dη dφ ,
    r^l P_l(cos θ) = the SOLID harmonic S_l , a polynomial in (ξ, η) by  l·S_l = (2l−1) z S_{l−1} − (l−1) r² S_{l−2}.

With that, every integrand is polynomial × e^{−aξ−bη} and Gauss–Laguerre(ξ, scaled by a) × Gauss–Legendre(η) is exact. **The answer to "how many points for 1e-8": eight.** `opus-q3-twocentre.py` §1, at n_ξ = n_η = 8 the overlap is exact to 0 ulp, J to 1.4e-13, K to 1.7e-16, E_g to 3.4e-13; at 12 points everything is at machine epsilon. E_g(2) = **−0.553771495318**, matching `lab/molecule.js` to all 16 digits.

**Corrected line.** *The volume element **divided by** 1/r_A or 1/r_B is polynomial, and r^l P_l is the solid harmonic; with those two facts an 8×8 Gauss rule is exact to 1e-13, and 12×12 to machine precision, for every l.*

---

### KILL 9 — P3's helium residual is its quadrature, not its grid

> *"for a closed-shell pair in one orbital, self-interaction-free Hartree *is* Hartree–Fock, so **the 2 × 10⁻⁴ residual is the grid, not the method**."* (E.1)

The physics claim is right; the diagnosis is not. P3's Hartree potential and its J integral are built from **rectangle sums** (`acc += u[i]*u[i]*h`), a first-order rule. `opus-q2-atoms.py` §1 runs *the same method* — self-interaction-free Hartree for 1s² — with Simpson quadrature and a tridiagonal eigensolve on two grids with Richardson extrapolation:

    E = -2.8616800 Eh    eps_1s = -0.9179556    <r> = 0.927274 a0    (49 iterations)
    Hartree-Fock limit  -2.8616800 / -0.9179559 / 0.9273
    |E - E_HF| = 5.5e-9 Eh

**Corrected line.** *Hartree = HF for He 1s², and the method reaches the HF limit to 5.5e-9 Eh. P3's 1.9e-4 was the first-order rectangle rule inside its own Hartree potential; the grid was never the limit.*

---

### KILL 10 — the E.2 gates cannot be met, and one of them is not a test

> *"Gates: Ne (1s²2s²2p⁶) HFS total energy **within 0.5 %** of the HF −128.547; Ar −526.82; the 3d/4s ordering of K–Zn."* (E.2)

`opus-q2-atoms.py` §2–§5. Eigensolver certified on the bare Coulomb problem at Z = 18 (Richardson-extrapolated eigenvalues accurate to 3.2e-6 Eh for the 1s at N = 20000/40000). All energies Richardson-extrapolated; Anderson mixing on the potential residual; Latter tail as marked.

| model | E_total | E − E_HF | % | eigenvalues |
|---|---|---|---|---|
| Ne Hartree (SIC, no exchange) | −126.40359 | +2.14351 | 1.667 | 1s −32.98291, 2s −1.43197, **2p −0.62533** |
| **Ne Xα α = 2/3, Latter** | **−127.47595** | **+1.07115** | **0.833** | 1s −30.38483, 2s −1.36619, **2p −0.55410** |
| Ne Xα α = 2/3, no Latter | −127.49075 | +1.05635 | 0.822 | 1s −30.23474, 2s −1.26605, **2p −0.44306** |
| Ne Xα α = 1 (Herman–Skillman) | −133.06092 | −4.51382 | 3.511 | 1s −31.49588, 2s −1.58397, **2p −0.73559** |
| Ne Xα α = 0.73105 (α_HF), no Latter | **−128.54704** | +0.00006 | 0.00005 | 1s −30.45821, 2s −1.31517, **2p −0.48605** |
| Ar Hartree (SIC, no exchange) | −519.43876 | +7.37875 | 1.401 | 3s −0.95574, 3p −0.41720 |
| **Ar Xα α = 2/3, Latter** | **−524.50582** | **+2.31169** | **0.439** | 3s −0.89550, 3p −0.40113 |
| Ar Xα α = 1 | −538.56149 | −11.74398 | 2.229 | 3s −1.05398, 3p −0.53321 |
| Ar Xα α = 0.72323 (α_HF), no Latter | −526.81748 | +0.00003 | 0.000006 | 3s −0.86366, 3p −0.36075 |

**(a) The Ne gate fails.** Xα with α = 2/3 is **0.833 %** off, not within 0.5 %. Ar passes at 0.439 %. There is no single α that passes both a 0.5 % energy gate and anything resembling the HF eigenvalues.

**(b) The eigenvalue gate is unmeetable in principle.** Xα has exactly one parameter. Pinning the total energy pins it: solving E_Xα(α) = E_HF gives **α_HF(Ne) = 0.73105** and **α_HF(Ar) = 0.72323** — an independent reproduction of Schwarz (1972), 0.73081 and 0.72177, to 2.4e-4 and 1.5e-3. At that α the Ne total energy is exact **and ε_2p = −0.48605 against HF's −0.85041: 43 % shallow.** One knob, two jobs.

**(c) Koopmans is the wrong readout for a local exchange potential.** The honest ionisation energies (Ne 2p, experiment 21.5645 eV):

| α | Koopmans −ε_2p | Slater transition state (2p^5.5) | Δ-SCF |
|---|---|---|---|
| 2/3 | 15.08 eV | 23.95 eV | **21.09 eV** |
| 1 | 20.02 eV | 29.77 eV | 28.51 eV |

Δ-SCF at α = 2/3 lands within 2.2 % of the measurement; Koopmans is 30 % low.

**(d) The 3d/4s "gate" is not a test of the central field.** K comes out right at both α (4s below 3d, HF: −0.14695 vs −0.02150). **Sc flips with α**: at α = 2/3, ε_3d = −0.13959 above ε_4s = −0.18482 (4s lower); at α = 1, ε_3d = −0.26579 below ε_4s = −0.21549 (3d lower). HF gives 3d below 4s. So the gate measures the exchange parameter, not the model — and in any case eigenvalue ordering is not filling order, which is a total-energy statement (Sc's ground configuration is 3d¹4s² although ε_3d < ε_4s in HF).

**Corrected gate.** *Ne Xα(2/3) = −127.4908 (0.82 % high); Ar = −524.5177 (0.44 % high); the α that reproduces E_HF is 0.73105 (Ne) / 0.72323 (Ar) and at that α the Ne 2p eigenvalue is −0.486, 43 % shallow. Print Δ-SCF or the transition state, never Koopmans, and never quote a 3d/4s ordering without stating α.*

---

### KILL 11 — E.4 conflates Z_eff with the quantum defect, and needs a tail it never mentions

> *"the valence radial functions of a column … are hydrogenic with an effective Z_eff **and** quantum defect δ_l (u_nl ≈ hydrogenic with n\* = n − δ_l)"* … *"A number the round wants: the quantum defects of Na 3s (δ_s = 1.35) from an HFS solve."* (E.4)

These are two *incompatible* one-parameter families. For a **neutral** atom the valence electron's asymptotic potential is −1/r, so Z_eff → 1 by construction and the free parameter is δ alone (ε = −1/2(n−δ)²). Z_eff (Slater, Clementi–Raimondi) is a fit to ⟨r⟩ or to the orbital energy *inside* the core, not to the tail. You may have one or the other, not both.

And the quantum defect only exists if the potential has a Coulomb tail — which an Xα potential does **not**: it decays exponentially. `opus-q2-atoms.py` §5, Na (Z = 11, 1s²2s²2p⁶3s¹):

| | ε_3s | n* | δ_s |
|---|---|---|---|
| α = 1, **Latter tail** | −0.18893 | 1.6268 | **1.3732** |
| α = 1, no Latter | −0.12494 | 2.0005 | 0.9995 |
| α = 2/3, Latter tail | −0.17854 | 1.6735 | 1.3265 |
| α = 2/3, no Latter | −0.07701 | 2.5481 | 0.4519 |
| KNOWN (spectroscopic) | −0.18886 | 1.6271 | **1.3730** |

**With the Latter tail at α = 1 the defect is 1.3732 against the measured 1.3730 — 1.5e-4.** Without it the same solve gives 0.4519, an error of 200 %.

**Corrected line.** *For a neutral atom the valence law is the quantum defect alone (Z_eff ≡ 1 asymptotically), and it exists only if the exchange potential is given a Latter/−1/r tail; with it, HFS α = 1 reproduces δ_s(Na) = 1.3732 vs 1.3730 measured; without it the number is meaningless.*

---

### KILL 12 — B.1's 0.06 % is the proton's mass, not "the two-digit ω"

> *"A = 6.2687 × 10⁸ s⁻¹, NIST 6.2649 × 10⁸ — 0.06 % (**the two-digit ω**)"* (B.1)

ω = 3/8 is **exact** in the infinite-mass non-relativistic model; there is nothing two-digit about it. The 0.06 % is the reduced mass. With μ/m_e = (1 + 1/1836.153)⁻¹ and A ∝ ω³|d|², ω ∝ μ, |d|² ∝ μ⁻², so **A ∝ μ**:

    A_infinite-mass = 6.26802e8 s^-1   ->   x (1 - 5.446e-4) = 6.26461e8   vs NIST 6.2649e8  (5e-5)

**Corrected line.** *A(2p→1s) = 6.26802e8 s⁻¹ at infinite nuclear mass; the finite proton scales it by μ/m_e to 6.2646e8, matching NIST 6.2649e8 to 5e-5. τ = 1.5954 ns.*

---

### KILL 13 — the correspondence-principle line, and the table underneath it

> *"the correspondence E_{n+1} − E_n ≈ 1/n³ **is exactly what the SPECTRUM's beat frequencies are**"* with P1 printing *"phase rates |E_n| = 1/2n² … and the classical Kepler frequencies 1/n³"* (C.3)

Two things. First, |E_n| = 1/2n² and ω_Kepler = 1/n³ are different objects placed side by side; **they cross at n = 2 by coincidence** (both 0.125), which is exactly the kind of accident a probe should not print unlabelled. Second, the correspondence is poor over the register's range:

| n | E_{n+1} − E_n | 1/n³ | ratio |
|---|---|---|---|
| 1 | 0.375000 | 1.000000 | 0.3750 |
| 2 | 0.069444 | 0.125000 | 0.5556 |
| 3 | 0.024306 | 0.037037 | 0.6563 |
| 4 | 0.011250 | 0.015625 | 0.7200 |
| 5 | 0.006111 | 0.008000 | 0.7639 |
| **6** | 0.003685 | 0.004630 | **0.7959** |

The ratio is 1 − 3/2n + O(n⁻²): **20 % low even at n = 6, and 2.7× low at n = 1.** "Exactly" is the wrong word for a 20 % agreement.

**Bonus, in support of C.3's actual physics.** The velocity law v_φ = m/(r sin θ) is correct and stronger than stated: it holds for **any** state that is a single e^{imφ} eigenfunction in **any** azimuthally symmetric real potential — mean-field atoms, H₂⁺, the box — because j_φ = m|ψ|²/(r sin θ) identically. The number worth printing is the density-weighted mean flow speed, which is finite:

    <v_phi>_2p+1 = int |psi|^2 m/(r sin th) d^3x = 3 pi/32 = 0.2945 a.u.

against the Bohr n = 2 circular-orbit speed 1/n = 0.5. **The eigenstate flows 41 % slower than the Bohr orbit it is supposed to correspond to.**

---

### KILL 14 — Wigner is not "the only joint object"

> *"The only joint object is W(x, p)"* (F.1)

False as stated. The Cohen class is an infinite family of bilinear joint distributions — Husimi–Kano Q, Glauber–Sudarshan P, Kirkwood–Rihaczek, Born–Jordan, Margenau–Hill — every one of them a joint object on phase space. What is true is a *uniqueness theorem with hypotheses*: the Wigner function is the unique member of the class whose marginals are correct along **every** rotated quadrature (Bertrand & Bertrand 1987), equivalently the unique one covariant under the metaplectic group with correct x- and p-marginals. Husimi is positive but has wrong marginals; Kirkwood is complex.

**Corrected line.** *W is the unique bilinear phase-space distribution with correct marginals in every rotated quadrature; the alternatives each fail one axiom, and which one you may drop is a design decision the label should name.*

---

### KILL 15 — the digest's 6.3 T (the number Q5 asks about)

> LIT digest: *"a 2p₊₁ Bohr magneton gives **6.3 T at 1 a₀** (= α²/2 a.u.), 0.23 mT at 30 a₀"*; Round 1 Q5 asks for the field *"at 1 a₀ on the axis"*.

α²/2 a.u. = μ_B/r³ is the **equatorial** point-dipole field. On the **axis** a point dipole gives 2μ_B/r³ = **12.5168 T at 1 a₀** and 0.4636 mT at 30 a₀ — the digest is a factor 2 low for the question asked. And both are meaningless at 1 a₀; see §2, Q5.

---

## 2. THE QUESTIONS, ANSWERED

### Q2 (LOCATE E.2) — Hartree / HFS for Ne and Ar

**Method, reported as asked.** `research/probes-fields/opus-q2-atoms.py`.
- **Grid**: uniform in r, r_i = ih, i = 1..N, Dirichlet at both ends; r_max = 25 a₀ (Ne, Na), 30 (Ar), 45 (K, Sc). Radial equation −½u″ + [V + l(l+1)/2r²]u = εu is symmetric **tridiagonal**, so `scipy.linalg.eigh_tridiagonal` returns *every* shell of a given l in one call — no shooting, no node counting, no bisection.
- **Extrapolation**: second-order differences give ε = ε_exact + ch², so the entire SCF is run twice, at N and 2N, and every reported quantity is (4X_{2N} − X_N)/3. Certified on the bare Coulomb problem at Z = 18: raw error 2.95e-2 Eh (N = 20000) → **3.18e-6 Eh after extrapolation** for the 1s at N = 20000/40000, 1.0e-8 for the 3s.
- **Mixing**: Anderson/Pulay on the potential residual F = V_new − V_old, history 6, weight 0.30, convergence criterion max|r ΔV| < 1e-9. Ne converges in 99 iterations at N = 20000. Plain linear mixing needed >800.
- **Exchange**: V_xα = −(3α/2)(3ρ/π)^{1/3}, E_xα = −(9α/8)(3/π)^{1/3}∫ρ^{4/3}; α = 2/3 is Dirac/Kohn–Sham, α = 1 is Slater. Latter tail V ← min(V, −(Z−N+1)/r).
- **Validation**: He (Hartree = HF) reproduces the HF limit to **5.5e-9 Eh** (KILL 9).

**Total energies and the Ne 2p eigenvalue**: the table in KILL 10. Headline:

| | Ne | Ar |
|---|---|---|
| Hartree, SIC, no exchange | −126.40359 (1.667 %) | −519.43876 (1.401 %) |
| **Xα α = 2/3 + Latter** | **−127.47595 (0.833 %)** | **−524.50582 (0.439 %)** |
| Xα α = 2/3, no Latter | −127.49075 (0.822 %) | −524.51768 (0.437 %) |
| Xα α = 1 + Latter | −133.06092 (3.511 %) | −538.56149 (2.229 %) |
| α_HF found here | **0.73105** (Schwarz 0.73081) | **0.72323** (Schwarz 0.72177) |
| **ε_2p / ε_3p at α = 2/3 + Latter** | **−0.55410** (HF −0.85041) | −0.40113 (HF −0.59102) |
| ε_2p at α_HF | **−0.48605** (HF −0.85041) | −0.36075 (HF −0.59102) |

**Answers to the three sub-questions.**
1. *Total energies*: above. The Ne 0.5 % gate **fails** at every α that is not fitted; the fitted α makes the energy exact and the eigenvalue 43 % wrong.
2. *2p eigenvalue vs −0.8504*: no Xα value comes close. −0.554 (α = 2/3), −0.736 (α = 1), −0.486 (α_HF). The Koopmans reading is structurally wrong for a local exchange potential; use Slater's transition state (2p^5.5: −ε = 23.95 eV) or Δ-SCF (**21.09 eV vs 21.5645 measured**).
3. *3d/4s for K and Sc*: K is right at both α (4s below 3d). **Sc flips with α** (α = 2/3: 4s lower; α = 1: 3d lower; HF: 3d lower). The ordering is a property of α, not of the central field.

**Extra, since E.4 asked for it**: Na δ_s = **1.3732** (measured 1.3730) with α = 1 and the Latter tail; 0.4519 without it (KILL 11).

---

### Q3 (DEEPEN E.3) — two-centre integrals, and what fixed exponents can and cannot do

**How many quadrature points for 1e-8: eight.** With the *correct* factorisation (KILL 8) an 8×8 Gauss–Laguerre × Gauss–Legendre rule gives S to 0 ulp, J to 1.4e-13, K to 1.7e-16, E_g to 3.4e-13; 12×12 is at machine epsilon; and the same rule handles l up to 5 and n up to 6 with rank-42 overlap matrices converged to 10 digits.

**E_g(2) = −0.553771495318**, matching `lab/molecule.js`'s −0.5537714953184829 exactly.

**The machinery is not the limit**: the same quadrature with an even-tempered STO basis,

| basis | E(R = 2) |
|---|---|
| 2×(6s) | −0.590691023 |
| 2×(8s4p) | −0.602208040 |
| 2×(10s6p3d) | −0.602615851 |
| **2×(11s8p5d)** | **−0.602626440** |
| exact | −0.602634214 |

and R_e = **1.997200** against the exact 1.997193, D_e = 2.79262 eV against 2.79284. So an 8e-6 Eh agreement with the exact H₂⁺ is available from these integrals; everything below is the *basis*, not the method.

**What a FIXED-exponent hydrogenic basis CAN do.** It is variational, so it is a rigorous upper bound at every R; it is exact at R → ∞ (the separated-atom limit, where 1s(ζ=1) *is* the answer); it converges monotonically in n_max; and it gets the **qualitative** picture — bonding/antibonding splitting, the tunnelling period, the shape of E(R) — right. With all 42 σ functions it recovers 35 % of the LCAO's binding-energy deficit (1.7641 → 2.1246 eV against the exact 2.7928).

**What it CANNOT do, with numbers.**
1. **R_e.** 2.49283 (1s) → 2.35227 (42 functions). Five whole shells buy 0.14 a₀ of the 0.50 a₀ needed. One free exponent buys **0.49 a₀** (R_e = 2.00330) with two functions.
2. **E.** −0.572159 at R = 2 with 42 functions vs −0.586506 with **two** optimised ones, −0.600362 with four, −0.602634 exact.
3. **Any united-atom or high-Z_eff regime, ever.** The variational floor for He⁺ inside the register's own s-manifold is **−1.5585**, 0.4415 Eh above −2, at any N; 23.36 % of the target orbital is in the continuum of the register's Hamiltonian.
4. **The nuclear cusp.** The effective cusp is fixed at −1/(1 + e^{−R}) — 11.9 % short at R = 2 — for every set of coefficients.
5. **Hellmann–Feynman forces.** Pulay 0.0623 (1s) → 0.0422 (42 functions), and adding the register's 2p_z alone makes it *worse*.

**Versus optimised exponents.** One free ζ per shell recovers essentially everything: ζ*(1s) = 1.238698 at R = 2 (Finkelstein–Horowitz 1.2380) giving E = −0.586505992 (FH −0.586504) and R_e = 2.00330, D_e = 2.3540 eV; {1s, 2p} with ζ_1s = 1.2458, ζ_2p = 1.4824 giving E(2) = **−0.600362122**, R_e = **2.00061**, D_e = **2.7310 eV** — the Dickinson result (digest: 2.73 eV), and a *lower* variational energy than the digest's quoted ζ_2p = 2.965 parametrisation, so this is the better bound. Note ζ*_2p = 1.48 is **three times** the register's hydrogenic 2p exponent of 0.5: the register's 2p is far too diffuse to polarise a bond, which is why adding it changes E(2) by 4.4e-5 Eh and moves R_e the **wrong way**, 2.49283 → 2.50871.

**The precise statement Round 1 needs.** *A basis of hydrogenic functions with fixed exponents ζ = Z/n on each centre is a valid variational bound and is exact in the separated-atom limit, but it is an incomplete set whose closure omits the continuum. Consequently (i) it cannot reach the united-atom limit — floor −1.5585 vs −2 exactly; (ii) it cannot satisfy the Kato cusp at either nucleus, deficit e^{−R}/(1+e^{−R}); (iii) its equilibrium separation is stuck near 2.35 a₀; (iv) its Hellmann–Feynman force disagrees with −dE/dR by 0.042 Eh/a₀ at R = 2. Every one of these is fixed by one number, a common scale λ (§3), not by more labels.*

---

### Q1 (DEEPEN A.2) — the closed form, and Φ on the axis to six digits

**The general law.** For ψ = Σ c_a R_{n_a l_a} Y_{l_a m_a},

    rho = sum_{ab} c_a c_b^*  R_a R_b  Y_{l_a m_a} Y*_{l_b m_b}
    Y_{l1 m1} Y*_{l2 m2} = sum_L  G^L_{ab}  Y_{L, m1-m2}
    G^L_{ab} = (-1)^{m2} sqrt[(2l1+1)(2l2+1)(2L+1)/4pi] (l1 l2 L / 0 0 0)(l1 l2 L / m1 -m2 -(m1-m2))

with L over |l₁−l₂| … l₁+l₂ and l₁+l₂+L **even** (the 3j(000) parity rule) — at most l₁+l₂+1 terms, and only |m₁−m₂| survives in M. The radial factor R_a R_b is a polynomial of degree n_a+n_b−2 times e^{−βr}, β = 1/n_a + 1/n_b, so both shell integrals are **incomplete gammas of integer order**:

    int_0^r r'^k e^{-b r'} dr' = k!/b^{k+1} [ 1 - e^{-br} sum_{j<=k} (br)^j / j! ]
    int_r^inf r'^k e^{-b r'} dr' = k!/b^{k+1}  e^{-br} sum_{j<=k} (br)^j / j!
    Phi_LM(r) = 4pi/(2L+1) [ r^{-L-1} int_0^r rho_LM r'^{L+2} dr' + r^L int_r^inf rho_LM r'^{1-L} dr' ]

**For (1s + 2p_z)/√2** the density has three Legendre components — L = 0 (β = 2), L = 0 and L = 2 (β = 1), and the **cross term at L = 1 with β = 3/2**, which Round 1's A.2 never writes and which is the only genuinely new object. Derived exactly with sympy (`opus-q1-potential.py`); the potential of a unit **positive** density (the electron potential is minus this):

    |1s|^2, L=0:       [ e^{2r} - r - 1 ] e^{-2r} / (2r)
    |2pz|^2, L=0:      [ 24 e^{r} - r^3 - 6r^2 - 18r - 24 ] e^{-r} / (48 r)
    |2pz|^2, L=2:      [ 6 e^{r} - r^5/24 - r^4/4 - r^3 - 3r^2 - 6r - 6 ] e^{-r} / r^3
    1s x 2pz, L=1:     2 sqrt2 [ 64 e^{3r/2} - 27 r^3 - 72 r^2 - 96 r - 64 ] e^{-3r/2} / (243 r^2)

The L = 1 piece → 128√2/(243 r²) = 0.744936/r² as r → ∞: the pair density's dipole, **exactly ⟨1s|z|2p₀⟩ = 128√2/243 = 0.7449362**.

**Φ on the axis for (1s + 2p_z)/√2, to twelve digits, by three independent routes** (closed form; 1-D shell quadrature; full 3-D quadrature of ρ(x′)/|x−x′|):

| z | Φ_e (electron only) | 1-D shell quad | 3-D quad | Φ_total = 1/z + Φ_e |
|---|---|---|---|---|
| 1 | **−0.568025636667** | −0.568025636667 | −0.5680256367 | **+0.431974363333** |
| 3 | **−0.357019861560** | −0.357019861560 | −0.3570198616 | **−0.023686528227** |
| 8 | **−0.145345132863** | −0.145345132863 | −0.1453451329 | **−0.020345132863** |

To six digits: **Φ_e(1) = −0.568026, Φ_e(3) = −0.357020, Φ_e(8) = −0.145345.**

**Confirming and sharpening A.2.** The pure-state closed forms agree with A.2's: Φ_e(|1s|²) = −[1 − (1+r)e^{−2r}]/r exactly, giving −0.729329 (z=1), −0.330028 (z=3), −0.125000 (z=8), −0.050000 (z=20). The 2p_z axis potential is −0.262174, −0.268152, −0.142454, −0.0514999 at the same points (matching P2's own quadrature), and at z = 20 the multipole tail −1/z − Q/2z³ with Q = 24 gives −0.0515000 — six digits, so **A.2's quadrupole sign is settled: Φ_e → −1/r − Q/(2r³) on the axis, Q = +24** (P2's own comment left the sign open).

---

### Q4 (KILL OR KEEP C.2) — the rotation law

**KEEP the law, KILL the gate.** Ω_ab = (E_a − E_b)/(m_a − m_b) is exact — it is the constant-phase condition of cos(Δm·φ − ΔE·t + δ). Measured for the isolated pair 4d₊₂ + 2p₋₁ by tracking the argmax of ρ(φ) (`opus-q4-lobes.mjs` §3), reduced mod 120° because a 3-fold pattern has no other identity:

| t | measured max, mod 120° | Ω·t mod 120° |
|---|---|---|
| 20 | 36.00° | 35.81° |
| 40 | 71.50° | 71.62° |
| 60 | 107.50° | 107.43° |
| 80 | 23.00° | 23.24° |
| 100 | 59.00° | 59.05° |

agreement to 0.24°, the resolution of the 720-point φ grid.

**The period of the FULL four-channel density is 67.0206 a.u.**, not 201.06 — see KILL 1 for the run gate. The full frequency list:

| pair | k = \|Δm\| | ΔE | Ω = ΔE/Δm | 2π/\|Ω\| | pattern period 2π/\|ΔE\| |
|---|---|---|---|---|---|
| 2p₊₁ × 2p₋₁ | 2 | 0 | 0 | ∞ | ∞ (static) |
| 4p₋₁ × 2p₋₁ | 0 | 3/32 | — | — | 67.0206 |
| 4d₊₂ × 2p₋₁ | 3 | 3/32 | 0.031250 | 201.06 | 67.0206 |
| 4p₋₁ × 2p₊₁ | 2 | 3/32 | −0.046875 | 134.04 | 67.0206 |
| 4d₊₂ × 2p₊₁ | 1 | 3/32 | 0.093750 | 67.02 | 67.0206 |
| 4d₊₂ × 4p₋₁ | 3 | 0 | 0 | ∞ | ∞ (static) |

**Which harmonic dominates.** I cannot read the faders off a screencast, so I answer the stronger question: *at equal amplitudes, where and when does each harmonic win?* (KILL 2 tables.) The k = 2 term owns r < 8, the k = 1 term owns r ≈ 10, the k = 3 term owns r > 14 and is 0.98 of the mean at r = 20 — and at r = 12 all of k = 1 and k = 3 vanish identically because R₄₂ has its node there. **In the volume-integrated density the answer is 3 lobes at every t**, with the k = 3 amplitude breathing 0.2657 ↔ 0.5841 (period 67.02) against a fixed k = 2 amplitude of 0.5028.

**At what t does the 3-fold win over the 2-fold?** In the column density, at t/T ∈ [0.30, 0.70] where |ρ₃| > 0.50 ≈ |ρ₂| — i.e. for 40 % of every 1.62 fs cycle. Never in the local density at r = 3 or 6, where the 2-fold is 0.95 at all times because it is static.

---

### Q5 (BROADEN A.4) — the magnetic field, settled

`opus-q5-bfield.py`, exact on-axis ring integral in SI, mpmath at 25 digits:

    B_z(Z) = (mu_0/2) int int J_phi(rho,z) rho^2 / (rho^2+(Z-z)^2)^{3/2} drho dz ,  J = -e j ,
    j_phi(2p+1) = rho e^{-r}/(64 pi)  (a.u.),  prefactor mu_0 e/(2 a0 t_au) = 78.6455 T

| Z (a₀) | B_z, exact extended current (T) | point dipole 2μ_B/Z³ (T) | ratio |
|---|---|---|---|
| **0** | **−0.52153435** | divergent | — |
| 0.5 | −0.49172459 | −100.13 | 0.0049 |
| **1** | **−0.42953319** | −12.5168 | **0.0343** |
| 2 | −0.29412707 | −1.56460 | 0.1880 |
| 5 | −0.07711040 | −0.100135 | 0.7701 |
| 10 | −0.01241113 | −0.0125168 | 0.9916 |
| 30 | −0.00046359 | −0.00046359 | 1.0000 |

**The verdict.** P5's 0.43 T is right; the digest's 6.3 T is wrong twice over. (i) On the **axis** a point μ_B gives 2μ_B/r³ = 12.5168 T at 1 a₀; μ_B/r³ = 6.2584 T is the **equatorial** value, so the digest halves the axial answer. (ii) Both are irrelevant at 1 a₀ because ⟨r⟩₂ₚ = 5 a₀ and the field point is *inside* the source: the point-dipole law over-counts by a factor 29 there, and the exact value is **0.429533 T**.

**Independent certification.** At Z = 0 the same integral must equal the textbook **orbital hyperfine field** (μ₀/4π)·2μ_B⟨r⁻³⟩ with ⟨r⁻³⟩₂ₚ = 1/(24 a₀³):

    quadrature   0.5215343512 T
    textbook     0.5215343512 T      agreement 3.0e-12

**Does it deserve a picture?** Not as a field-strength overlay: the magnetic-to-electric force ratio never exceeds 8.2e-6. It deserves a picture as a **quantity with a name**: the on-axis field is monotone, maximal at the nucleus at 0.5216 T, and *that* number is the orbital hyperfine field an NMR/ESR reader would recognise. Draw the current lines (which are what carry the physics) and print 0.52 T at the nucleus; do not draw B as a field competing with E.

---

### Q6 (LOCATE F.1) — the Wigner function of 1s

Prolate-spheroidal reduction with foci at ±r (this is the geometry Dahl–Springborg use; the φ integral is a Bessel J₀):

    W(r,p) = (2 r^3/pi^3) int_1^inf dxi int_-1^1 deta (xi^2-eta^2) e^{-2 r xi}
                 cos(2 p_par r xi eta) J_0( 2 p_perp r sqrt((xi^2-1)(1-eta^2)) )

so W depends on r, p and the angle between them only — three numbers, and it is **even in p** because ψ is real (checked: W(r, +p, 0) = W(r, −p, 0) to 16 digits).

**Certified** on two exact identities: W(r→0, p) = 1/(π³(1+p²)²) to **12 digits** at p = 0, 0.5, 1, 2; and the momentum marginal ∫W d³r = 8/(π²(1+p²)⁴) to **10 digits** at p = 0 and p = 1. Quadrature stable to 9e-17 between a (140,160) and a (220,260) rule.

**The minimum.**

    W_min = -3.0972575246e-4  a.u.
    at    r = 1.329537 a0 ,   |p| = 1.379109 a.u. ,   p PARALLEL (or antiparallel) to r ,   r.p = +-1.833577

For scale W(0,0) = 1/π³ = 0.03225153, so **|W_min| is 0.9603 % of the maximum**. The negative region is a shell: on the p ∥ r line at |p| = 1.379 the sign is + for r < 0.99, − from r ≈ 0.99 to ≈ 2.2, + again to ≈ 3.3, − again — an alternating set of rings, all shallow. Perpendicular p is positive everywhere in that neighbourhood (W(1.3295, 0, 1.5) = +5.686e-4 against W(1.3295, 1.5, 0) = −2.823e-4), so **the negativity is carried entirely by radial momentum**.

**Is an (r, p_r) slice the honest "x + p superposed" picture?** Yes, and this is why. W's arguments reduce to (r, p, cos θ_rp); the radial component is p_r = p·r̂ = p cos θ_rp; the minimum sits at cos θ_rp = ±1, i.e. **purely radial momentum**. A slice at p_⊥ = 0 is therefore the slice that contains the whole negative structure and misses nothing qualitative. Its price, which the label must state: it is a *slice*, not a marginal, so it does not integrate to |ψ|² — and 0.96 % negativity is invisible on a linear colour ramp, so it needs a signed diverging map with the zero pinned, or it is a lie of contrast.

---

## 3. THE BIGGER IDEA — the register fails as a molecular basis for exactly two reasons, and both are closures

Neither Round 1 nor the digest names it. Every failure in §1 and §2 is one sentence:

> **The register is a set of labels with a FROZEN SCALE and a FROZEN CENTRE. A basis that is to do molecular-orbital theory on classical-electrostatic dynamics must be closed under the two group actions the physics applies to it: DILATION (screening, Z_eff, the united-atom limit) and TRANSLATION (nuclei that move). Closing it costs one number and one shell rule; not closing it costs 30 mEh, 0.35 a₀ of bond length, and 0.062 Eh/a₀ of unphysical force.**

### (D) Dilation closure — one number, λ

**Theorem (standard, and the whole point).** The hydrogen bound states {R_nl : ζ = Z/n} are not complete in L²; the **Coulomb Sturmians** S_nl(r) = r^l L^{2l+1}_{n−l−1}(2λr)e^{−λr}, the same functions with one **common** λ, are a complete discrete set (they are the eigenfunctions of a Sturm–Liouville problem with weight 1/r; the continuum is absorbed into the discrete tower). *Same 91 labels. One extra number.*

**Numbers.** `opus-q7-closure.py`.

*United atom (He⁺, exact −2):* the register's set floors at −1.5585 forever; Sturmians at λ = 1 reach −1.999999999 by N = 12 and −2.000000 by N = 20. At λ = 2 the very first function is exact.

*The molecule.* H₂⁺ σ_g, Sturmians with one common λ per centre, λ optimised at R = 2:

| n_max | dim | λ* | E(R = 2) | error vs exact |
|---|---|---|---|---|
| 1 | 2 | 1.23870 | −0.586505992 | 1.61e-2 |
| 2 | 6 | 1.57904 | −0.602185021 | 4.49e-4 |
| 3 | 12 | 1.70477 | −0.602579118 | 5.51e-5 |
| **4** | **20** | **1.76110** | **−0.602624257** | **9.96e-6** |

**Twenty Sturmians beat forty-two register functions by 30.5 mEh and land 1e-5 from the exact H₂⁺.** The optimal λ climbs toward the united-atom value 2 as the tower deepens — the scale is doing exactly the job the fixed ζ = 1/n cannot.

**Cost to the app**: one slider, or one λ(R) table. The GPU mode tables in `hydrogen.js` are already polynomial × exponential in r; replacing ρ = 2r/n by ρ = 2λr changes a constant, not a shader.

### (T) Translation closure — a shell rule, and a theorem about the dynamics

**Theorem (Hurley 1954, made concrete for STOs).** For any normalised variational ψ(R),

    dE/dR = <psi| dH/dR |psi> + 2 Re <dpsi/dR| (H - E) |psi>

so the Hellmann–Feynman force equals −dE/dR **iff the second term vanishes**, which it does iff ∂ψ/∂R lies in the variational space. For a nucleus-centred STO χ = r^{n−1}e^{−ζr}Y_lm on centre C,

    d chi / d R_C  =  a combination of STOs with the SAME zeta and (n-1, l+-1) and (n, l+-1).

**So the closure rule is: for every (n, l, ζ) on a centre, carry (n−1, l±1, ζ) and (n, l±1, ζ).** Nothing about n_max; everything about ζ.

**Consequence for Josh's "dynamics based on classical electrostatics."** If the basis is translation-closed, then at every step F_electrostatic ≡ −∇_R E, so Ehrenfest/Born–Oppenheimer nuclear motion driven by *the Coulomb force of the density* conserves the total energy exactly. If it is not, the two forces differ and the trajectory pumps energy. That is the difference between an honest instrument and a pretty animation, and §1's KILL 6 measures it: 0.0623 Eh/a₀ for the lab's H₂⁺, 0.0115 with one right function added, 0.000053 near completeness.

**A rigorous, computable bound on the price.** From the identity above and Cauchy–Schwarz,

    |Pulay|  =  |2 Re <dpsi/dR|(H-E)|psi>|  <=  2 ||dpsi/dR|| . ||(H-E) psi||

Both norms are ordinary integrals of the trial function; nothing about the exact solution enters. Evaluated for the lab's own 1s LCAO H₂⁺ at R = 2 on the certified Becke grid (⟨ψ|ψ⟩ = 1.0000000000):

    ||(H-E) psi|| = 0.22293275 Eh      ||dpsi/dR|| = 0.22882246 /a0
    BOUND     |Pulay| <= 0.102024 Eh/a0
    MEASURED  |Pulay|  = 0.062289 Eh/a0     (61.1 % of the bound -- the bound is tight to a factor 1.6)

and the residual norm also gives a Temple bound on the energy itself, E − E_exact ≤ ‖(H−E)ψ‖²/(E_u − E) = 0.12649 Eh (true error 0.04886).

**This is the gate the app should carry.** A window that draws electrostatic forces may assert that the force it draws is the true force to within `2‖∂ψ/∂R‖‖(H−E)ψ‖` — a number it can compute from the state it is already holding, every frame, with no reference to any exact answer. When that number falls below the tick size of the force arrow, the picture is honest; when it does not, the label must say so.

**And the atoms side follows from (D).** The same λ is what E.2 and E.4 are groping at: for a neutral atom the valence scale is set by the quantum defect and the −1/r tail (KILL 11), and for a screened core it is set by Z_eff. A Sturmian tower with λ chosen per shell *is* Slater's screening made variational instead of tabulated — Z_eff stops being an input **or** a readout and becomes a variational parameter with an error bar. That is the honest form of E.2's "Slater's rules become a readout."

---

## 4. NEW QUESTIONS, Q7 ONWARD

- **Q7 (DEEPEN §3-D).** The optimal Sturmian scale rises with the tower: λ*(R = 2) = 1.2387, 1.5790, 1.7048, 1.7611 for n_max = 1…4. Is λ*(R, n_max) → 2 (the united-atom Z) as n_max → ∞ at fixed R, or does it converge to an R-dependent limit? Give λ*(R) for R = 0.5, 1, 2, 4, 8 at n_max = 5 and fit it; if λ*(R)·something is a smooth interpolation between Z = 2 (R → 0) and Z = 1 (R → ∞), the app gets a **closed-form scale law** and needs no optimiser at run time. Report the D_e and R_e of the n_max = 5 Sturmian basis against 2.79284 eV / 1.997193 a₀.

- **Q8 (BROADEN §3-T).** Run an actual Ehrenfest trajectory for H₂⁺ nuclei on (i) the lab's 1s LCAO, (ii) 1s + same-ζ 2p, (iii) a translation-closed set, driving the nuclei with the **electrostatic force of the density** (not −∇E), starting from R = 3 at rest. Report the energy drift per vibrational period in each case, and check it against the bound 2‖∂ψ/∂R‖‖(H−E)ψ‖ integrated over the path. Does the drift scale linearly with the bound?

- **Q9 (LOCATE Q2).** Koopmans fails by 43 % for Xα (KILL 10), yet Δ-SCF at α = 2/3 gives Ne 21.09 eV against 21.5645 measured. Extend the solver to Z = 1…36 and report **Δ-SCF first ionisation energies against measured values**, plus the transition-state values, plus the mean absolute error of each. If Δ-SCF is uniformly good to ~0.5 eV, the ATOMS window has a certified readout; if it degrades across the 3d row, say where and by how much, and whether spin-polarisation (LSDA) is the missing piece or whether it is the self-interaction.

- **Q10 (DEEPEN Q6).** W_1s has its minimum at r = 1.3295, p = 1.3791, p ∥ r, depth −3.0973e-4 = 0.96 % of the peak. Compute the minima of W_2s, W_2p₀ and W_2p₊₁ by the same prolate-spheroidal route (2p₊₁ needs the m ≠ 0 phase, so W acquires a dependence on the azimuth of p about r). Does |W_min|/W_max grow with n, and does the *volume* of the negative region scale like a fixed fraction of the classically allowed region? Is there a state in the register whose Wigner function is positive?

- **Q11 (BROADEN A.3 / the digest's Berlin 1951).** The digest cites Berlin's binding/antibinding partition and nobody computed it. For H₂⁺ at R = 2, compute the Berlin surface — the locus where the force density ρ(x)·[(z−z_A)/r_A³ + (z−z_B)/r_B³] changes sign — for (i) the 1s LCAO, (ii) the optimised 1s+2p, (iii) the near-exact basis, and report the **fraction of the electron charge that sits in the binding region** in each case. That number, not the total force, is what a colour map on the stage would be showing, and it is the honest visual answer to "why does sharing electrons bind."

- **Q12 (LOCATE C.1/C.2).** The four-channel state's period is 67.0206 a.u. because every ΔE happens to equal 3/32. For a general register state the period is 2π/gcd{|E_a − E_b|}, and since E_n = −1/2n² the gcd is a number-theoretic object: with n's drawn from 1…6, the differences are (1/2)(1/n_b² − 1/n_a²) and the gcd over any subset is (1/2)·(1/lcm-related denominator). **Give the full table**: for every subset of shells from {1…6}, the exact period of the density, in a.u. and in fs, and the longest possible period a register state can have. That table is the CLOCK window's specification, and it is exactly computable.

---

## NOT CERTIFIED

- The reference values quoted as KNOWN and not recomputed here: the numerical HF limits (Ne −128.54710 / ε_2p −0.85041, Ar −526.81751), the exact H₂⁺ (−0.6026342 at R = 2, R_e = 1.9971933), Schwarz's α_HF (0.73081 / 0.72177), the Ne 2p and Na 3s experimental IPs, NIST's A(2p→1s) = 6.2649e8, Finkelstein–Horowitz ζ = 1.2380 and Dickinson's 2.73 eV. Every one of them is *matched* by an independent solve in this round (α_HF to 2.4e-4, FH to 2e-6, He HF to 5.5e-9, the hyperfine field to 3.0e-12), which is evidence but not a citation check.
- The Sturmian H₂⁺ energies stop at n_max = 4 (20 functions); the n_max → ∞ limit and the λ*(R) law are Q7, not results.
- The Pulay bound is evaluated only for the 1s LCAO at R = 2; its tightness (61.1 %) is one data point, not a law.
- The Wigner minimum is DERIVED-HERE and certified against two exact identities, but has not been checked against Dahl & Springborg's published value, which I could not consult.
- The claim that the register's fixed-exponent H₂⁺ energy extrapolates to ≈ −0.576 is a power-law fit to six points, not a proof; the *floor* argument (−1.5585 for He⁺, 23.36 % continuum weight) is exact and is what the argument rests on.
- Josh's fader settings were not read from the screencast; Q4's answer is the amplitude-and-radius map at equal amplitudes, which is stronger but not the same question.
- Nothing here touches Thread B beyond KILL 12, and no Larmor power was recomputed.

**Final output: research/RIVAL-FIELDS-AND-MOLECULES-OPUS.md**
