# D — THE KINETICS LADDER

**From the λWAVES tree as it stands (2026-09-11, branch `dev`) to simulating chemical kinetics in
real time on a consumer GPU: the honest rungs, the mathematics at each, and what the world already has.**

Commissioned by Josh. Written 2026-09-11. Nothing here is implemented; this is a research
memo with falsifiers, not a completion report.

---

## Verification legend

Every factual claim below carries one of these marks. No citation in this document was
written from memory: each was resolved through the Crossref REST API (title, authors, journal,
volume, pages, year, DOI returned by the API) or by opening the page and reading it.

| Mark | Meaning |
|---|---|
| **[V]** | I opened the source and read the specific equation/number quoted. |
| **[X]** | Bibliographic record resolved by Crossref API (authors/venue/volume/pages/DOI confirmed); I did **not** open the full text. |
| **[C]** | Computed by me in this session; the script is in Appendix A and reproducible with `node`. |
| **[T]** | Textbook-standard result stated without opening a primary source. Treat as a lead to verify before it enters a build. |
| **[U]** | UNVERIFIED — I could not open it. Says what I tried. |

---

## 0. Where the tree actually is (read, not assumed)

Read in this session: `lab/modrive.js`, `lab/pulse.js`, `lab/field.js`, `lab/dynamics.js`,
`lab/well.js`, `lab/frame-budget.js`, plus a grep of all of `lab/` for compute pipelines and FFTs.

1. **Every solver in the tree is a finite-basis or closed-form solver.** Hydrogen, the well,
   the oscillator, Sturmians, helium Hylleraas, H₂⁺ two-centre, H₂ CI: matrices and analytic
   radial functions. `lab/dynamics.js` states its own status honestly: *"EXACT ANALYTIC
   throughout, except the radial integrals."*
2. **There is exactly one propagator: `lab/modrive.js`.** It is a fixed-nuclei, one-electron,
   finite-LCAO, length-gauge exponential-midpoint propagator, `i S ċ = (H₀ + E_z(t) Z) c`. It
   re-diagonalises the full generalised eigenproblem whenever the field changes. Its own header
   says: *"No renormalisation, RWA, nuclear motion or SCF."*
3. **There is no spatial grid propagator anywhere in the tree.** The only 3-D grid is
   `lab/field.js`, and its header is explicit that the grid is *"a RENDERING PRODUCT, not the
   state."* The compute kernel evaluates ψ = Σ c_a φ_a(r) from closed-form polynomial tables;
   it never applies a Hamiltonian to a grid.
4. **There is exactly one WebGPU compute pipeline in the whole repo** (`field.js`,
   `@compute @workgroup_size(4,4,4)`), and it is that basis-reconstruction kernel. The file
   records a measured scale: *"A 96³ grid × 16 modes is ~14 M evaluations — well under a
   millisecond on an RTX 3070."*
5. **There is no FFT on the GPU.** The only FFT in the tree is `analyser.fftSize = 2048` in
   `lab/audio.js` — the Web Audio analyser, for the audio meters.
6. `lab/frame-budget.js` learns a conservative refresh ceiling from sustained rAF samples and
   starts at 60 Hz. That is the frame budget any kinetics rung has to live inside.

**Consequence that governs this whole document.** The tree has no piece of the machinery that
reactive kinetics needs: no grid Hamiltonian application, no absorbing boundary, no flux
operator, no energy-domain projection, no GPU reduction to a scalar. It also does not need
*most* of what the Beta dossier is building. These are two nearly disjoint engineering programs.
That fact is the whole ordering verdict in §2.

---

## 1. THE LADDER

Atomic units throughout (ħ = mₑ = e = 4πε₀ = 1). Energies in hartree (E_h), lengths in bohr
(a₀), time in ħ/E_h = 24.18884 as. k_B = 3.166811563 × 10⁻⁶ E_h/K.

Rungs are numbered by **what observable becomes honest**, not by implementation effort.

---

### Rung 0 — where we are. *Coherent dynamics in a fixed finite basis.* (EXISTS)

**Model.** `modrive.js`: one electron, fixed nuclei, finite LCAO basis, prescribed classical field.

**Equations.**

    i S ċ = (H₀ + E_z(t) Z) c ,   Z_ij = ⟨χ_i|z|χ_j⟩
    c(t+Δt) = S^{-1/2} exp(−i H̃(t+Δt/2) Δt) S^{1/2} c(t)   [exponential midpoint, S-unitary]

**Observable.** Populations |⟨ψ_k|ψ(t)⟩|², dipole ⟨z⟩, absorbed energy, Rabi area.

**Is this kinetics?** **No.** There is no barrier, no reactant/product partition, no flux, no
ensemble and no temperature. It is spectroscopy of a bound register. Nothing in the tree today
can produce a rate constant, and nothing should claim to.

**Cost.** An n×n generalised eigensolve per field change; n ≤ ~30. Microseconds.

**Oracle.** The RWA area theorem already in `pulse.js` (`rabiRWA`), plus S-norm conservation.

---

### Rung 1 — *The analytic barrier.* First appearance of a rate. (NO NEW MACHINERY)

**Model.** One degree of freedom, one analytic barrier. Take the symmetric Eckart (sech²) barrier

    V(x) = V_b sech²(x/L)

**Equations.** The scattering problem −(1/2m)ψ″ + Vψ = Eψ has a closed-form transmission
coefficient. Eckart's general (asymmetric) result, **[V]** quoted verbatim from the NBS paper
(Brown 1981, eq. 4):

    κ = [cosh 2π(a₁+a₂) − cosh 2π(a₁−a₂)] · [cosh 2π(a₁+a₂) + D]⁻¹
    2πa_i = π[(ε + V_i)/C]^{1/2},  i = 1,2
    C = (1/8) π u* (a₁^{-1/2} + a₂^{-1/2})²
    D = cosh 2πd  if d real;  = cos 2π|d|  if d imaginary
    u* = hν*/kT ,   a_i* = 2πV_i/hν* ,   ν* = (1/2π)(−F*/m)^{1/2}

with F* the second derivative of V at its maximum and m an effective tunnelling mass.

**Eckart's own result, verbatim from the 1930 scan** (his eq. 15, reflection coefficient), which a
research agent OCR'd and read directly:

    V(x) = −Aξ/(1−ξ) − Bξ/(1−ξ)² ,   ξ = −exp(2πx/l)                        (Eckart eq. 1)
    ρ = [cosh 2π(α−β) + cosh 2πδ] / [cosh 2π(α+β) + cosh 2πδ]               (Eckart eq. 15)
    α = ½(W/C)^{1/2} ,  β = ½[(W−A)/C]^{1/2} ,  C = h²/(8ml²)
    for imaginary δ:  cosh 2πδ → cos 2π|δ|                                  (Eckart eq. 15a)

so P = 1 − ρ = [cosh 2π(α+β) − cosh 2π(α−β)] / [cosh 2π(α+β) + cosh 2πδ], which is the NBS form
above. **[U] Eckart's δ (his eq. 9a) was lost in the OCR** — the agent's δ = ½[(B−C)/C]^{1/2} is
inferred from his prose, not read. Do not print it as verified.

For the **symmetric sech² special case** the closed form is

    P(E) = sinh²(πkL) / [ sinh²(πkL) + cosh²( (π/2)√(8 m V_b L² − 1) ) ] ,   k = √(2mE)

**This is exactly Seideman & Miller's eq. (3.2)** — [V] read off their page image by a research
agent as N_exact(E) = {1 + [cosh c / sinh b]²}⁻¹ with b = aπ(2mE/ħ²)^{1/2} and
c = (π/2)[(8V₀ma²/ħ²) − 1]^{1/2}. With a ≡ L the two expressions are identical (sinh²b/(sinh²b +
cosh²c)). *Seideman & Miller use V₀ = 0.425 eV and m = 1060 a.u., which they describe as
"approximately the H + H₂ collision".*

**[C] I verified this formula myself in this session** against an independent Numerov integration
of the Schrödinger equation with an outgoing wave (`/tmp/eckart_check.mjs`, Appendix A). I happened
to choose m = 1060, V_b = 0.0154 E_h (0.419 eV), L = 0.7 a₀ — **essentially the Seideman–Miller
parameters**, so the check below is against the community's own standard test barrier:

| E/V_b | P analytic | P Numerov | rel. diff |
|---|---|---|---|
| 0.30 | 1.41051698e-5 | 1.41051697e-5 | 5.2e-9 |
| 0.50 | 7.73739692e-4 | 7.73739688e-4 | 5.9e-9 |
| 0.90 | 2.51149412e-1 | 2.51149412e-1 | 1.6e-10 |
| 1.00 | 5.49125500e-1 | 5.49125500e-1 | 2.9e-11 |
| 1.50 | 9.97114464e-1 | 9.97114464e-1 | 1.5e-10 |

Nine significant figures. **This is the instrument's first certified kinetics oracle and it costs
nothing to implement.**

**The observable that IS kinetics.** Three of them, all analytic:

1. **Tunnelling.** P(E) ≠ 0 below V_b. The curve *is* the tunnelling.
2. **The tunnelling correction factor** κ(T), the ratio of the quantum to the classical barrier-crossing
   rate **[V]** (Brown 1981 eq. 1):

       κ(T) = e^{V_b/k_BT} ∫_{E₀}^{∞} P(E) e^{−E/k_BT} dE/k_BT

3. **Arrhenius curvature.** Plot ln[κ(T) e^{−V_b/k_BT}] against 1/T; the bend away from a straight
   line is tunnelling, visible, live, driven by a rack lane on T.

**[C] The falsifier is built in, and the literature predicted exactly what I measured.** The
Wigner correction **[X]** (Wigner 1932, *Z. Phys. Chem. Abt. B* **19**, 203,
DOI 10.1515/zpch-1932-0120) and the exact parabolic-barrier correction, both **[V]** read verbatim
from Lawrence, [arXiv:2409.02820v2](https://arxiv.org/abs/2409.02820) (eqs. 2–3):

    κ_W  = 1 + (βħω)²/24                    (Wigner; ω = |ω_imag|)
    κ_PB = (βħω/2) / sin(βħω/2)             (exact parabolic barrier)

**[V] The validity limit is precise, and it is stated by that source:** κ_W is preferred because
*"the parabolic barrier approximation diverges at the crossover temperature T_c = ħω/(2πk_B)"*.
Since x/sin x has radius of convergence x = π, i.e. βħω = 2π, i.e. T = T_c, **κ_W is meaningful
only for T ≫ T_c.** I computed the exact quadrature and the Wigner form for the barrier above
(ω_b = √(2V_b/m)/L = 0.007701 E_h = 1690.1 cm⁻¹, crossover T_c = ħω_b/2πk_B = 387.0 K):

| T (K) | κ exact | κ Wigner | ratio |
|---|---|---|---|
| 200 | 3204.15 | 7.159 | **447.5** |
| 250 | 135.54 | 4.942 | 27.4 |
| 300 | 25.389 | 3.737 | 6.79 |
| 400 | 5.538 | 2.540 | 2.18 |
| 700 | 1.743 | 1.503 | 1.16 |
| 1500 | 1.149 | 1.110 | 1.04 |

The Wigner correction is wrong by a factor of 450 at 200 K and right to 4% at 1500 K, and the
crossover happens exactly around T_c = 387 K — **an independent numerical confirmation of the
literature's own stated validity limit.** A third curve, κ_PB, should be plotted alongside: it is
exact for a parabolic barrier and **diverges at T_c**, which makes the lesson visual.

**[V] The community's standard atomic-unit test parameters** (Lawrence 2024, eqs. 68–72), which
the instrument should adopt verbatim so its numbers are comparable to published ones:

    symmetric:   V(q) = V‡ sech²(q/L) ,      ω = √(2V‡/(mL²))
                 L = 0.66047 a₀ ,  m = 1836 m_e ,  V‡ = 72 ħ²/(m π² L²)
    asymmetric:  V(q) = (√V₁+√V₂)²/(4 cosh²(q/L)) − (V₂−V₁)/(1+exp(−2q/L)) ,  V₁ = V‡

and the exact 1-D relation between transmission and rate (Lawrence eq. 71):

    k Z_r = (1/2πħ) ∫₀^∞ P(E) e^{−τE/ħ} dE ,   τ = βħ **That is a complete, self-contained, exactly-solvable
lesson in deep tunnelling, and it is the single cheapest genuinely-kinetics feature available
to this instrument.** It needs no grid, no PES, no new GPU kernel — just two closed forms and
one quadrature.

**Cost per frame.** The κ(T) quadrature at 4×10⁵ energy points is sub-millisecond on the CPU;
at rack rates use 2000 points and a Gauss–Legendre rule. Effectively free.

**Independent oracle.** Numerov integration of the same barrier (done, 9 digits) and the
6-point Gaussian-quadrature FORTRAN routine `TUNL` printed in the NBS paper's appendix, whose
stated accuracy is *"better than 1 percent"* **[V]**.

**Falsifier.** κ(T) computed from the quadrature disagrees with the Wigner limit *above* ~5 T_c,
or P(E) → 1 is not approached monotonically, or the Numerov cross-check drifts when the box
is widened.

---

### Rung 2 — *A grid wavepacket through the same barrier.* The propagator gets certified. (NEW MACHINERY, SMALL)

**Model.** One coordinate on a uniform grid, x ∈ [−L_x, L_x], N points, the same sech² barrier.

**Equations.** Two propagators worth having, and they should both be built because they certify
each other.

*(a) Split-operator (Fourier).*

    ψ(t+Δt) = e^{−iVΔt/2} F⁻¹ e^{−i(k²/2m)Δt} F e^{−iVΔt/2} ψ(t) + O(Δt³)

*(b) The real-wavepacket / damped-Chebyshev recursion.* **[V]** — this is the form I read in the
MADWAVE3 paper (Roncero & del Mazo-Sevillano 2024, eq. 6), originally Tal-Ezer & Kosloff **[X]**
(*JCP* **81**, 3967, 1984) with Mandelshtam–Taylor absorption **[X]** (*JCP* **103**, 2903, 1995):

    Ψ(0) = Ψ(t=0)
    Ψ(1) = e^{−φ} Ĥ_s Ψ(0)
    Ψ(k+1) = e^{−φ} { 2 Ĥ_s Ψ(k) − e^{−φ} Ψ(k−1) }
    Ĥ_s = (Ĥ − E₀)/ΔE ,  E₀ = (E_max+E_min)/2 ,  ΔE = (E_max−E_min)/2

with the real damping function **[V]**

    φ(x) = 0                     for x < x_I
         = A_x (x − x_I)^{n_I}   for x > x_I

**Why (b) matters enormously for this instrument.** Three reasons, all decisive:

1. **The arrays stay real.** MADWAVE3 states it plainly: *"the Chebyshev components stay real if
   the initial wave packet is real, what allows to considerably reduce the memory requirements."*
   Half the memory, no complex multiply, and WebGPU's `f32` storage textures/buffers are a
   natural fit.
2. **No FFT is needed.** The recursion needs only `Ĥ_s Ψ`, which a high-order finite-difference
   or sinc-DVR stencil supplies. **The tree has no FFT and WebGPU has no cuFFT**; a hand-written
   Stockham radix kernel is a real cost. A 13-point stencil is a 20-line WGSL kernel.
3. **One propagation gives the whole energy curve.** The energy-domain wavefunction is recovered
   from the same Chebyshev components **[V]** (eq. 10–11):

       Ψ(E) = (1/a₀(E)) Σ_k c_k(Ĥ_s,E) Ψ(k)
       c_k(Ĥ_s,E) = (2−δ_{k0}) ħ exp[−ik arccos E_s] / √(ΔE² − (E−E₀)²)
       Ψ(t)      = Σ_k f_k(Ĥ_s,t) Ψ(k),  f_k = (2−δ_{k0}) e^{−iE₀t/ħ}(−i)^k J_k(tΔE/ħ)

   So P(E) is obtained **at every energy simultaneously from one run** — there is no scan over
   collision energies. This is precisely the property that makes a live Arrhenius plot honest.

**The observable that IS kinetics.** P(E) *measured*, by the flux through a dividing surface,
not assumed. The flux formula **[V]** (MADWAVE3 eq. 19, adapted to 1-D):

    P(E) = (K₀(E)/μm) · Im[ Ψ*(E) ∂Ψ(E)/∂x ]|_{x=x*}

MADWAVE3's remark is the important one: *"Since positive outgoing and negative incoming flux are
accounted for, the total reaction probability is independent of the particular value of x*. Thus
x* does not need to be in the asymptotic region; it is typically positioned just beyond the
saddle point."* **The x*-independence is the acceptance test.**

**Cost per frame. [C]** Bandwidth-bound, real f32, N = 2048, 5-array traffic per apply: ~0.1 µs
per Chebyshev apply. Thousands of applies per frame. Free.

**Independent oracle.** Rung 1's closed form, verified here to 9 digits, which is also
Seideman & Miller eq. (3.2).

**There is a reference implementation to read before writing a line.** [marl0ny/QM-Simulator-2D]
(https://marl0ny.github.io/QM-Simulator-2D/index.html) is a WebGL 2-D TDSE with runtime-selectable
Visscher leapfrog, Crank–Nicolson **and split-operator** propagators and user-drawn barriers. See
§3.2.1 — **this rung's engineering is precedented in a browser. Do not treat it as novel risk.**

**Falsifier.** P(E) depends on x*, on the absorber onset x_I, on A_x, or on N. Any of those and
the propagator is not certified. Also: norm must decay monotonically to zero through the
absorber; MADWAVE3 warns that *"rippling"* means bad absorption and *"a fast increase"* means
E_max is wrong and the scaled Hamiltonian is broken **[V]**.

---

### Rung 3 — *Collinear H + H₂ on a real surface.* The first honest reactive kinetics. (THE PIVOT RUNG)

**Model.** Two coordinates. The collinear H_a–H_b–H_c arrangement in bond coordinates (r₁, r₂),
or better in Delves/mass-scaled skewed coordinates so the kinetic operator is diagonal.

**Equations.** With reduced masses μ_r = m_H/2 (H₂ vibration) and μ_R = 2m_H/3 (atom relative to
diatom),

    Ĥ = −(1/2μ_R) ∂²/∂R² − (1/2μ_r) ∂²/∂r² + V(r,R)

and the same Chebyshev recursion as Rung 2 in two dimensions. Reactant and product asymptotes
are two different exit channels of the same grid; the flux surface r = r* sits just past the saddle.

**Two surfaces to choose from, both real:**

*(a) LEPS (London–Eyring–Polanyi–Sato).* A ~30-line analytic form: three Morse singlet curves
Q_i, three anti-Morse triplet curves J_i, and a Sato parameter, combined through the London
square root. **[X]** Sato 1955, *JCP* **23**, 592–593, DOI 10.1063/1.1742043. **[T]** for the exact
algebra — *I did not open a page carrying the full LEPS expression* (my WebSearch budget was
exhausted; Wikipedia has no LEPS article; both URL guesses 404'd). **Verify the algebra against a
primary source before implementing.** It is the right first surface because it is analytic, tiny,
differentiable and reimplementable in JS in an afternoon.

**A 2026 paper does exactly this system.** Mohtashim & Kais, *"Digital Quantum Simulation of
Wavepacket Correlations in a Chemical Reaction"*, *Entropy* **28**(2), 144 (2026) — **collinear
H + H₂ on a LEPS surface**, on quantum hardware, not interactive. And Voth, Chandler & Miller's
QTST paper (*JCP* **91**, 7749, 1989) applied their theory to *"the nonseparable two-dimensional
collinear H₂+H reaction"*. **Collinear H + H₂ on a LEPS surface is the canonical minimal reactive
system and it is still being used as such in 2026. That is the strongest possible argument for
making it Rung 3.**

*(b) BKMP2 — the reference H₃ surface.* **[V] I downloaded the Fortran in this session.**
Boothroyd, Keogh, Martin & Peterson, *"A refined H3 potential energy surface"*, *JCP* **104**,
7139–7152 (1996), DOI 10.1063/1.471430 **[X]**. Source and data are live at
`https://www.cita.utoronto.ca/~boothroy/bkmp2.html`:

| file | size | what |
|---|---|---|
| `data/bkmp2/bkmp2.f` | 73 280 bytes, 1759 lines (**[V]** downloaded and read the header) | the surface |
| `data/bkmp2/bkmp2test.f` | 8 kb | test program |
| `data/bkmp2/bkmp2test.out` | 3 kb | **reference output — the port's fixture** |
| `data/bkmp2/h3prog.tar.gz` | 21 kb | all of the above |
| `data/bkmp2/cih3ean.tar.gz` | 1.0 Mb → 5 Mb | the 8701 ab initio energies |

**[V]** From the file header: *"All distances are in bohrs and all energies are in hartrees. Note
that it is an error if any distance is less than 0.2 bohrs."* Entry point
`call bkmp2(r, ideriv, Vtot, dVtot)` with `r(3)` the three interatomic distances — **analytic
derivatives are provided**, which the ladder needs later for Rung 6/7. **[V]** From the site: RMS
error 0.27 millihartree (0.17 kcal/mol) overall, 0.18 mE_h for non-compact conformations, max
deviation 6.2 mE_h for compact conformations, 8701 ab initio energies. **No licence is stated on
the page — a redistribution decision gate, exactly like the DFTB parameter gate in dossier §15.**

**[U]** I could not compile `bkmp2.f`: there is no Fortran compiler on this machine (`gcc` only,
no `gfortran`). So I could not verify the barrier height by running it. The MADWAVE3 paper states
its in-house H₃ surface *"reproduces very well the PES by Pendergast (BKMP2)"* and that *"This
potential presents a barrier to reactions of ≈ 0.25 eV"* **[V]** — note that is the barrier
measured from the H + DH(v=0,j=0) zero of energy, i.e. relative to the reagent zero-point level,
not the bare classical barrier.

**The observable that IS kinetics.** The reaction probability curve P_r(E) with its threshold and
its resonances, and from it a collinear Arrhenius plot. The rate integral is Miller's **[X]**
(Miller, *JCP* **61**, 1823–1834, 1974, DOI 10.1063/1.1682181; Miller, Schwartz & Tromp, *JCP*
**79**, 4889–4898, 1983, DOI 10.1063/1.445581):

    N(E) = Tr[P̂(E)] = Σ_{n_p n_r} |S_{n_p n_r}(E)|²        cumulative reaction probability
    k(T) Q_r(T) = (1/2πħ) ∫ N(E) e^{−E/k_BT} dE
    k(T) Q_r(T) = ∫₀^∞ C_ff(t) dt ,  C_ff(t) = Tr[ F̂ e^{iĤt/ħ} F̂ e^{−iĤt/ħ} ]   (flux–flux form)

In one collinear dimension of vibration, N(E) = Σ_v P_{v'←v}(E) — a handful of channels. **The
rack lane drives T; the integral is re-evaluated per frame from a cached N(E); the Arrhenius line
moves at 60 Hz and every number in it is honest.**

**Cost per frame. [C]** This is the headline number of the whole document. Real-wavepacket
Chebyshev, real f32, 13-point stencil in each dimension, 20 Å × 20 Å box (deliberately
over-generous), RTX 3070 at 448 GB/s and 25% of 20 TFLOP/s FP32:

| grid | Δr (a₀) | E_max (eV) | per apply | applies for T = 20 000 a.u. (484 fs) | whole P(E) curve | curves/s | applies per 16.7 ms frame |
|---|---|---|---|---|---|---|---|
| 128² | 0.298 | 5.4 | 0.7 µs | 1 981 | **1.4 ms** | 690 | 22 832 |
| 256² | 0.148 | 14.2 | 2.9 µs | 5 199 | **15.2 ms** | 66 | 5 708 |
| 512² | 0.074 | 49.3 | 11.7 µs | 18 105 | 212 ms | 4.7 | 1 427 |

**A complete converged collinear reaction-probability curve — every energy at once — costs about
one frame at 256².** The iteration count is the Chebyshev convergence requirement
N_iter ≳ ΔE·T/ħ with ΔE the scaled half-range; the box is 20 Å on a side because that is what
MADWAVE3 used for the 3-D problem, and collinear H + H₂ needs perhaps 6 Å, so these numbers are
pessimistic by a factor of a few. Bandwidth dominates flop count at every size (see Appendix A).

**[V] Independent anchor for the GPU scaling claim.** Smith, Cooke & LeBlanc, arXiv:2010.15069
(2020, rev. 2022), measured a 2-D split-step spinor propagation and found GPU time per iteration
linear in grid size, *"f(N) = θN + ξ with θ = 9.7(1)×10⁻⁸ s/N"*, flat below η = log₂N ≈ 19–20 where
kernel-launch overhead dominates, and concluded *"Our GPUs basically provided increased resolution
for free."* At 256² = 2¹⁶ we are firmly in that flat, launch-bound regime, which is the honest
caveat: **at this grid size the limit is how many dispatches you can queue per frame, not
arithmetic.** Batch hundreds of Chebyshev applies into one command buffer.

**Independent oracle.** Two, in order of strength:
1. **Rung 1's Eckart form fitted to the vibrationally adiabatic barrier.** The collinear P(E) must
   approach the 1-D Eckart curve at low energy in the single-channel regime. Analytic, already
   verified here.
2. Published collinear H + H₂ probabilities on LEPS/BKMP2. Note **[X]** Chatfield, Truhlar &
   Schwenke, *"Benchmark calculations of thermal reaction rates. I. Quantal scattering theory"*,
   *JCP* **94**, 2040–2044 (1991), DOI 10.1063/1.459925, and the companion Day & Truhlar,
   *ibid.* 2045–2056, DOI 10.1063/1.459926 (direct flux-autocorrelation) — these are the canonical
   H + H₂ benchmark rates; I could not open either (AIP returned HTTP 403).

**Falsifier.** Unitarity: the sum of reactive + inelastic + elastic probabilities must be 1 at
every energy. Any of: threshold moves when the grid is refined; P_r(E) depends on the flux
surface position; the collinear curve does not reduce to Eckart in the single-channel window;
total probability ≠ 1 to within a stated tolerance.

---

### Rung 4 — *Three dimensions, J = 0.* The real H + H₂ reaction. (HEAVY BUT BOUNDED)

**Model.** Reactant Jacobi coordinates (r, R, γ), total angular momentum J = 0, one electronic
state. This is the standard benchmark of the field.

**Equations.** Same Chebyshev recursion; the Hamiltonian acquires the centrifugal and rotational
terms and γ is a Gauss–Legendre quadrature grid rather than a uniform one. State-to-state
S-matrix elements come from projection onto product rovibrational states **[V]** (MADWAVE3
eqs. 20–22):

    C_{v'j'Ω'β}(k) = ∫ dV_β δ(R' − R'_∞) ⟨φ_{β,v',j',Ω'} | Ψ^{Jp}(k)⟩
    S^{Jp}_{v₀j₀Ω₀, βv'j'Ω'}(E) = −i √(2K'/πμ') (e^{−iK'R'}/a₀(E)) Σ_k c_k(Ĥ_s,E) C_{v'j'Ω'β}(k)
    a₀(E) = (1/π) Σ_k (2−δ_{k0}) [cos(−k arccos E_s)/(ΔE √(1−E_s²))] ⟨Ψ(0)|Ψ(k)⟩

The initial packet is deliberately built as a **standing** superposition so the components stay
real **[V]** (eq. 13): g(R) = e^{−(R−R₀)²/2Γ²}/(2[πΓ²]^{1/4}) · [e^{−ik₀R} + e^{+ik₀R}], and only
the incoming half contributes.

**The observable that IS kinetics.** P_r^{J=0}(E), the state-to-state v'j' distributions, and
N(E)|_{J=0}.

**Cost per frame. [C]** At MADWAVE3's own reference grid, 256 × 256 × 140 = 9.18 M points:
3.14 GFLOP and 184 MB of traffic per Chebyshev apply → 0.63 ms per apply (flop-bound at 25% of
peak; 0.41 ms at the bandwidth floor); 5199 applies → **≈ 3.3 s for one J = 0 curve**; 147 MB of
VRAM for four real f32 arrays. A partial-wave sum to J = 30 with no Ω expansion: **≈ 1.7 min.**

**This is not a per-frame rung. It is a background job whose *result* is per-frame.** Compute
N(E) once (seconds to minutes), cache it, and let the rack drive T through the one-line rate
integral at 60 Hz. That is the only architecture in which "real-time thermal kinetics" is an
honest phrase for a 3-D reaction on a consumer GPU in 2027.

**Independent oracle — and this one is already downloaded.** MADWAVE3 ships a converged
reference fixture, GPL-3.0, at
`github.com/qmolastro/madwave3/EXAMPLES/HD+H_collision/J000-check/S2prod.v00.J000.k00008`.
**[V] I downloaded it (120 500 bytes) and analysed it in this session.** 500 energy rows,
0.1 → 1.5 eV above H + DH(v=0,j=0); column 1 = E (eV), column 2 = total reaction probability,
column 3 = total probability over all channels (**must be 1** — the built-in unitarity check),
column 4 = the 01+2 → 02+1 exchange channel, columns 5–9 = per-v' breakdown:

| E (eV) | P_tot | unitarity (col 3) | P_exchange |
|---|---|---|---|
| 0.1000 | 1.13553e-06 | 1.015 | 4.111e-09 |
| 0.2122 | 5.97976e-05 | 1.042 | 3.651e-05 |
| 0.3244 | 3.56049e-02 | 1.021 | 2.051e-02 |
| 0.4367 | 2.69356e-01 | 1.007 | 1.721e-01 |
| 0.7733 | 4.97696e-01 | 0.998 | 3.436e-01 |
| 1.1100 | 6.23710e-01 | 0.987 | 4.405e-01 |
| 1.5000 | 7.01478e-01 | 0.974 | 4.974e-01 |

P_tot crosses 0.01 at E = 0.2964 eV, 0.10 at 0.3553 eV, 0.50 at 0.7762 eV. Unitarity holds to
1–3% across the reactive range (it degrades at the lowest energies where the flux is ~10⁻⁶, and
the single worst row is 1.91 at the very first energies). **The 1.13 × 10⁻⁶ probability at 0.1 eV,
below a 0.25 eV barrier, is tunnelling in a reference file — a fixture the instrument can be
graded against, energy by energy.**

Also **[V]** the same repo's `EXAMPLES/HD+H_collision/CRP/` directory contains a cumulative
reaction probability run, and `EXAMPLES/HD+H_collision/pes/` contains the H₃ surface Fortran
(`FFroutines.f`, 25 908 bytes; `FFmodules.f90`, 15 444 bytes) under GPL-3.0.

**Falsifier.** Column 3 of the instrument's own output departs from 1 by more than the fixture
does; or the threshold shifts with grid/absorber; or the v' branching differs from the fixture
outside a stated tolerance. MADWAVE3's convergence protocol is itself the test **[V]**: the
Chebyshev norm *"start[s] oscillating, until they reach a plateau with a norm = 1/2"* and then
decays to zero through the absorber, and reaction probabilities must be stable between
successive loops (their figure shows loop 2 not yet converged and loop 8 converged).

---

### Rung 5 — *The thermal rate constant.* Arrhenius, live. (CHEAP GIVEN RUNG 3 OR 4)

**Model.** No new dynamics. A quadrature over a cached N(E) and a reactant partition function.

**Equations, verbatim. [V]** A research agent obtained Seideman & Miller's full text free from the
Miller group's own server (`cchem.berkeley.edu/~millergrp/pdf/244.pdf`) and read these off the page:

    C_F(t) = tr[ F̂ e^{iĤt_c*/ħ} F̂ e^{−iĤt_c/ħ} ] ,   t_c = t − iβħ/2           (1.1a)
    k(T) = Q_r(T)⁻¹ ∫₀^∞ dt C_F(t)                                             (1.1b)
    k(T) = [2πħ Q_r(T)]⁻¹ ∫ dE e^{−E/k_BT} N(E)                                (1.2)
    k(E) = [2πħ ρ_r(E)]⁻¹ N(E)                                                 (1.3)
    N(E) = Σ_{n_r,n_p} |S_{n_r n_p}(E)|²                                       (1.4)
    N(E) = ½ (2πħ)² tr[ F̂ δ(E−Ĥ) F̂ δ(E−Ĥ) ] ,   δ(E−Ĥ) = −(1/π) Im (E+iε−Ĥ)⁻¹  (1.5a,b)

**[V] and the convention that will silently wreck the numbers if missed, in their own words:**
*"Q_r the reactant partition function **per unit volume**."*

For a partial-wave sum, N(E) = Σ_J (2J+1) P_r^J(E) exactly, or J-shifting as an explicitly-labelled
approximation. The general two-dividing-surface flux form is **[V]** (Lawrence 2024, eqs. 9–14):

    k Z_r = ∫₀^∞ c_ff(t) dt ,  c_ff(t) = tr[ e^{−(τ/2−it)Ĥ/ħ} F̂_p e^{−(τ/2+it)Ĥ/ħ} F̂_r ]
    F̂_r = (−i/ħ)[Ĥ,P̂_r] ,  F̂_p = (+i/ħ)[Ĥ,P̂_p] ,  F̂_α = (p̂/2m)δ(q̂−s_α) + δ(q̂−s_α)(p̂/2m)

**[V] THE CHEAPEST EXACT QUANTUM RATE FOR AN INSTRUMENT — and it may beat Rung 3.** Seideman &
Miller eqs. (2.13a,b), with absorbing potentials V(q) → V(q) − iε(q)/2 and
G(E) = (E·1 − T − V + (i/2)ε)⁻¹:

    N(E) = tr( Γ_r G* Γ_p G )                                          (2.13a)
    N(E) = Σ_{j,j'} Γ_r(q_j) |G_{j,j'}|² Γ_p(q_{j'})                   (2.13b)

Γ = Γ_r + Γ_p is diagonal in the DVR, so this is **one complex matrix inverse per energy**, and
*"only matrix elements of the Green's operator between points q_j in the reactant absorbing strip
and q_j' in the product absorbing strip are needed"*, and N(E) *"does not depend on the choice of
the dividing surface"*. **This is a serious alternative to Rung 3's propagation: for a 2-D collinear
grid the matrix is large, but the sparse solve is a well-understood GPU problem and it gives N(E)
directly with no absorber-convergence worry about the *time* axis. It should be costed before
Rung 3 is built.** Refs: **[X]** Miller, *JCP* **61**, 1823 (1974); Miller, Schwartz & Tromp, *JCP*
**79**, 4889 (1983); **[V]** Seideman & Miller, *JCP* **96**, 4412–4422 (1992),
DOI 10.1063/1.462832. **Bibliographic hazard [V]:** the Hänggi–Talkner–Borkovec review prints
Miller–Schwartz–Tromp as *"J. Chem. Phys. 70, 4889"* — **that is a typo in the review; volume 79 is
correct.** The Yamamoto ancestor is *JCP* **33**, 281 (1960).

**The observable that IS kinetics.** k(T) itself. An Arrhenius plot, ln k against 1/T, with the
tunnelling bend. Apparent activation energy E_a = −d ln k/d(1/k_BT) read live off the slope.

**Cost per frame. [C]** A 500-point quadrature per T, plus partition functions: microseconds.
**This is the rung where the modulation rack genuinely becomes a kinetics instrument** — a lane on
T, a lane on isotope mass (H/D/T, changing μ and the zero-point level), a lane on barrier height
if a model surface is in play, and the rate responds at frame rate.

**Independent oracle.** **[X]** Mielke, Peterson, Schwenke, Garrett, Truhlar, Michael, Su &
Sutherland, *"H + H₂ Thermal Reaction: A Convergence of Theory and Experiment"*, *Phys. Rev. Lett.*
**91**, 063201 (2003), DOI 10.1103/PhysRevLett.91.063201. This is the paper to be graded against;
it is the point where converged quantum theory and shock-tube experiment met for this reaction.
Also **[X]** Chatfield/Truhlar/Schwenke and Day/Truhlar (*JCP* **94**, 2040 and 2045, 1991) for
benchmark quantal rates.

**Falsifier.** k(T) depends on the upper cutoff of the N(E) integral; or Q_r conventions are not
pinned (per unit volume vs per molecule is a factor that will silently shift everything); or the
J-shifting approximation is used without being labelled; or the reported k(T) disagrees with
Mielke et al. outside its stated domain of temperature.

---

### Rung 6 — *Statistical rate theory, and a rate you watch being measured.* (THE BEST SHOWPIECE PER UNIT EFFORT)

**Model.** Two things side by side: a *theory* that predicts a rate from a barrier, and an
*ensemble* whose rate you measure with a stopwatch.

**Equations — the theory side.**

*Eyring TST*, **[V]** in the form Lawrence 2024 eq. (1) prints it, with its conventions spelled
out — and **every one of these three conventions is a place where an instrument silently goes
wrong**:

    k_TST = (κ / 2πβħ) · (Z‡/Z_r) · e^{−βV‡}        [1/(2πβħ) = k_BT/h, so this IS Eyring]

**[V]** (i) **V‡ is the CLASSICAL barrier height, bottom-of-barrier — not a ZPE-corrected ΔE‡.**
(ii) **Z‡ is the transition-state partition function for the modes ORTHOGONAL to the unstable
coordinate ONLY** — the reaction coordinate is already in the k_BT/h prefactor, and putting it in
twice is *"the usual mistake"*. (iii) **Z_r is per unit volume for a bimolecular reaction.**
Simple TST in the Kramers review's notation, **[V]** its eq. (3.5): k_TST = (ω₀/2π) e^{−βE_b}.
Original **[X]** Eyring, *JCP* **3**, 107–115 (1935), DOI 10.1063/1.1749604.

*Variational TST.* **[V]** Truhlar & Garrett's own definitions, read from the free copy at
`comp.chem.umn.edu/Truhlar/docs/C21.pdf`: *"The optimum transition states for microcanonical or
canonical ensembles correspond to a **minimum sum of states** or a **maximum free energy of
activation**, respectively. Microcanonical variational theory (μVT) and canonical variational
theory (CVT) denote the results obtained making the transition-state-theory assumption at the
globally best dynamical bottleneck … Improved canonical variational theory (ICVT) refers to using
μVT below the μVT energy threshold and optimizing the variational transition states for the
non-zero contributions based on a canonical ensemble truncated from below at the threshold energy."*
**What it fixes is recrossing**, and TST is an upper bound in classical mechanics *"if reactant
equilibration replenishes reactant states fast enough (and this leads to the variational approach
by which the transition-state location is varied to minimize the calculated rate)"* **[V]**.
Explicit forms, **[V]** Truhlar, Garrett & Klippenstein, *J. Phys. Chem.* **100**(31), 12771–12800
(1996), DOI 10.1021/jp953748q, free at `theochem.ru.nl/files/local/jpc-100-12771-1996.pdf`,
eqs. (16)–(18):

    k_VTST/MT(T) = κ_MTG(T) · k_CVT(T)                                            (16)
    κ_MTG(T) = (k_BT)⁻¹ e^{βE*_G} ∫ dE e^{−βE} P^G(E)                             (17)
    k_CVT(T) = k_BT Σ_J Σ_R (2J+1) e^{−βE*_R(J)} / (h Q^R(T))                     (18)

with s*(T) the reaction-coordinate value minimising the TS canonical partition function.
**[V] Reported accuracy — the honest bound to quote:** VTST/MT agreed with accurate quantal
calculations on the same surface *"within 17% or better for the whole temperature range of
200–1500 K"* for D + H₂, and the average absolute deviation *"is only 10% over the 200–1000 K
range"* for Cl + H₂. Refs **[X]** Truhlar & Garrett, *Annu. Rev. Phys. Chem.* **35**, 159–189 (1984),
DOI 10.1146/annurev.pc.35.100184.001111.

*Tunnelling correction:* Rung 1's κ(T) multiplies it. That is the whole point of Rung 1.

**Equations — the measurement side.** A one- or two-dimensional double well with a Langevin bath:

    m ẍ = −dV/dx − γ m ẋ + ξ(t) ,   ⟨ξ(t)ξ(t')⟩ = 2 γ m k_BT δ(t−t')

and the *measured* rate from the population decay or the mean first passage time:

    N(t) = N(0) e^{−kt}  ⟹  k_measured = −d ln N/dt  ,  or  k = 1/⟨τ_FPT⟩

**The theory to grade the measurement against — Kramers turnover, now verified.** **[X]** Kramers,
*Physica* (Utrecht) **7**, 284–304 (1940), DOI 10.1016/S0031-8914(40)90098-2, and the definitive
review, which a research agent **[V] opened in full on a text-layer mirror** and from which every
section and equation number below was read directly: Hänggi, Talkner & Borkovec,
*"Reaction-rate theory: fifty years after Kramers"*, *Rev. Mod. Phys.* **62**(2), 251–341 (1990),
DOI 10.1103/RevModPhys.62.251.

The model, **[V]** verbatim eqs. (4.1)–(4.3) — note this is exactly the Langevin equation above:

    M ẍ = −U'(x) − γ M ẋ + ξ(t) ,  ⟨ξ(t)⟩ = 0 ,  ⟨ξ(t)ξ(s)⟩ = 2 M γ k_B T δ(t−s)
    ω_b² = −M⁻¹ U''(x_b) > 0 ,   high barrier: βE_b ≫ 1                       (4.6)

**Spatial-diffusion-limited rate, [V] eqs. (4.32)–(4.33):**

    k_{A→C} = (λ₊/ω_b) · (ω₀/2π) · e^{−βE_b}                                  (4.32)
    k = [ (1 + γ²/(4ω_b²))^{1/2} − γ/(2ω_b) ] · (ω₀/2π) · e^{−βE_b}           (4.33, Ohmic)

The review says verbatim that *"the expression in large parentheses is the result of simple
transition-state theory k_TST, given in Eq. (3.5)"*. So λ₊/ω_b **is** the ω_b^eff/ω_b factor.
**[U] caveat the agent flagged honestly:** the fraction bars inside the bracket of (4.33) were lost
to OCR; the bracket was **reconstructed and then cross-verified decisively** against the review's
own cleanly-OCR'd eq. (3.45), λ₀^(b) = [γ̂(λ)²/4 + ω_b²]^{1/2} − γ̂(λ)/2, which divided by ω_b
reproduces it exactly. **Mark the bracket "reconstructed, cross-verified", not "read".**

**Energy-diffusion-limited (low friction), [V] eqs. (4.49)–(4.50) verbatim:**

    k = γ β I(E_b) · (ω₀/2π) · e^{−βE_b}                                      (4.49)
    valid if:  k_BT/E_b ≪ 1  and  γ I(E_b) ≪ k_BT                             (4.50)

with I(E) = ∮ p dq the action (eq. 4.11). **[V] The review's own emphasis, and it is a falsifier for
this rung:** *"in contrast to Eq. (4.33), the result in Eq. (4.48) or Eq. (4.49) involves the value
of the action at the barrier energy, i.e., the **anharmonic part of the well dynamics affects the
final result**."* The high-friction method breaks down when γI(E) > k_BT (eq. 4.43).

**Overdamped / Smoluchowski, eqs. (4.34) = (4.54):** k = (ω₀ω_b/2πγ) e^{−βE_b} for γ ≫ ω_b.
**[U] the numerator ω₀ω_b was ILLEGIBLE in both places in the agent's scan.** The denominator 2πγ
and the surrounding prose were read; the numerator is the agent's own derivation from the verified
(4.33) via λ₊/ω_b → ω_b/γ. **Mark UNVERIFIED-as-printed and obtain a clean copy before building.**

**Grote–Hynes, [V] eqs. (3.41)–(3.46) verbatim** — the memory-friction generalisation:

    k_TST = (λ₀^(b)/ω_b) · (ω₀/2π) · e^{−βE_b}                                (3.41)
    λ₀^(b) = ω_b² / (λ₀^(b) + γ̂(λ₀^(b)))   ⟺   λ² + λ γ̂(λ) − ω_b² = 0         (3.44)
    λ₀^(b) = [ γ̂(λ)²/4 + ω_b² ]^{1/2} − γ̂(λ)/2                               (3.45)

with γ̂(z) the Laplace transform of the memory kernel. **[V]** The review's own verdict:
*"This is a cornerstone result in rate theory: Equation (3.46) coincides precisely with the Kramers
rate result for general memory friction γ(t)."* Ref **[X]** Grote & Hynes, *JCP* **73**, 2715 (1980).

**The turnover itself, [V] §VI.** The transmission factor κ = k(γ)/[(ω₀/2π)e^{−βE_b}] *"undergoes a
turnover in the form of a bell-shaped curve"* (its Fig. 18): linear in γ at weak friction, ∝ 1/γ in
the Smoluchowski limit, capped by eq. (3.5). Two interpolation formulae are given, **both ad hoc** —
additive k⁻¹ = k⁻¹(low) + k⁻¹(mod-to-large) (6.1) and multiplicative (6.3), of which the review says
the multiplicative *"yields better results than the additive form"*. **[U] eq. (6.4), the explicit
Kramers-model combination, had its fraction bars OCR-lost and is the agent's highest-risk
reconstruction — do not print it.** The rigorous theory is §VI.B: *"Such a theory, which is
applicable also for memory friction, does indeed exist (Pollak, Grabert, and Hänggi, 1989) … the
escape dynamics is governed by the **unstable normal-mode coordinate** — and not the particle
configuration coordinate."* Refs **[X]** Pollak, Grabert & Hänggi, *JCP* **91**(7), 4073–4087 (1989),
DOI 10.1063/1.456837; Mel'nikov & Meshkov, *JCP* **85**(2), 1018 (1986), DOI 10.1063/1.451844.
The review's own numerical benchmark (its Fig. 19) uses exponential memory friction in a
piecewise-parabolic potential against **[X]** Straub, Borkovec & Berne, *JCP* **84**(3), 1788 (1986),
DOI 10.1063/1.450425 — **that figure is the grading target for this rung.**

**[V] How to turn trajectories into a number, and the trap.** Tiwary & Berne, *JCP* **144**(13),
134103 (2016), DOI 10.1063/1.4944577, arXiv:1602.06588, verbatim: *"The rate was calculated as
ν = 1/⟨t⟩ where ⟨t⟩ is the average residence time in either of the basins. To filter out spurious
recrossing events, we used a minimum residence time criterion of 10⁴ time units, or 2×10⁵
integration steps, to count a transition event as successful."* Langevin, timestep 0.05, **11 values
of γ**, the De Leon–Berne two-state potential (*JCP* **75**, 3495, 1981), Bussi–Parrinello
thermostat (*PRE* **75**, 056707, 2007). **It reproduces the turnover — this is the reference
implementation for Rung 6.** And the trap, **[V]** Pollak & Talkner, *Chaos* **15**(2), 026116 (2005),
DOI 10.1063/1.1858782, verbatim: *"In simple cases, the effect of recrossings can be incorporated in
the rate resulting from a mean first passage time by a numerical factor which is 1/2 **if the
separating surface coincides with the so-called stochastic separatrix**"* — followed immediately by
*"In general, however, there is no easy way to infer the true rate from a mean first passage time."*
**A rung that applies the ½ unconditionally is wrong. That is a falsifier.**
**Recommended integrator: BAOAB Langevin** with residence-time counting, sweeping γ.

**The observable that IS kinetics.** A rate you *measured*, plotted against a rate that was
*predicted*, as a function of friction — with the rack lane on γ sweeping you across the turnover
while the two curves separate and rejoin. And a barrier-height lane giving a live Arrhenius slope.

**Cost per frame. [C]** 10⁵ Langevin walkers × 2000 steps per frame = 2 × 10⁸ steps ≈ 8 GFLOP,
about **1.6 ms flop-bound**; the walker state (x, p, RNG, flag) is 1.6 MB, L2-resident, so there is
no per-step memory traffic. **10⁵ reacting trajectories, live, at 60 fps, on a 3070.** This is the
rung where "reactions happening in real time" becomes literally true on the screen and the number
next to it is defensible.

**Independent oracle.** Three: (i) Kramers/HTB closed forms in both friction limits; (ii) exact
equilibrium — the stationary distribution must be Boltzmann, ρ ∝ e^{−βV}, measurable from the
walker histogram with no reaction; (iii) detailed balance, k_f/k_r = e^{−βΔG}.

**Falsifier.** The measured k does not scale as e^{−βE_b} at fixed γ; the walker histogram is not
Boltzmann when the barrier is removed; the turnover peak position moves with the timestep; the
rate depends on where the dividing surface is drawn (it must not, for a properly-defined
population decay after the transient).

---

### Rung 7 — *Tunnelling-corrected rates without solving the Schrödinger equation.* (PATH-INTEGRAL RUNG)

**Model.** Ring-polymer / instanton methods: quantum statistics from classical dynamics of P
replicas of the system.

**Equations. [X]** RPMD: Craig & Manolopoulos, *JCP* **121**, 3368–3373 (2004),
DOI 10.1063/1.1777575, and the rate formulation *"Chemical reaction rates from ring polymer
molecular dynamics"*, *JCP* **122**, 084106 (2005), DOI 10.1063/1.1850093. Deep-tunnelling
connection to instanton theory: **[X]** Richardson & Althorpe, *JCP* **131**, 214106 (2009),
DOI 10.1063/1.3267318. Reviews: **[X]** Richardson, *"Ring-polymer instanton theory"*, *Int. Rev.
Phys. Chem.* **37**, 171–216 (2018), DOI 10.1080/0144235X.2018.1472353, and *"Perspective:
Ring-polymer instanton theory"*, *JCP* **148**, 200901 (2018), DOI 10.1063/1.5028352.

**[V] The RPMD equations verbatim**, read from Suleimanov, Aoiz & Guo, *"Chemical Reaction Rates
from Ring Polymer Molecular Dynamics: Theory and Practical Applications"*,
[arXiv:1607.04858](https://arxiv.org/abs/1607.04858), *J. Phys. Chem. A*,
DOI 10.1021/acs.jpca.6b07140:

    H_N(p,q) = Σ_{i=1}^N p_i²/2m + U_N(q)                                          (2)
    U_N(q) = Σ_{i=1}^N [ m(q_{i+1}−q_i)²/(2(β_N ħ)²) + V(q_i) ] ,  q_{i±N}=q_i, β_N=β/N  (3)
    k_RP(T) Q(T) = lim_{t→∞} C_fs(t,T)                                             (4)
    C_fs = lim_{N→∞}(2πħ)^{−N} ∫dp∫dq e^{−β_N H_N} δ[f(q)] ḟ(q) h[f(q_t)]           (5)
    ω_N = 1/(β_N ħ) = N/(βħ)

**[V]** Two properties that matter to an instrument: k_RP *"satisfies the important property of
being independent of the position of the dividing surface"* (an acceptance test), and the t→0⁺
limit is RPMD-TST which *"gives the exact quantum rate in the absence of recrossing"*.

**[V] The bead-count rule, eq. (24) verbatim** — this confirms P ~ βħω:

    n_b > n_min ≡ ħ ω_max / (k_B T)  ( = β ħ ω_max )

and the **converged counts actually reported**: 4–8 beads at T ≥ 1000 K; 16–64 intermediate;
**64–192 at 200–300 K**; 256 for C(¹D)+H₂ at 50 K; **512 for D+MuH→DMu+H**. Cost is linear in n_b.
**So a live 200 K RPMD rate costs ~100–200× a classical trajectory — which, against Rung 6's
[C] 1.6 ms/frame for 10⁵ walkers, means ~10³ necklaces per frame, or a background accumulator.**

**[V] Instanton, from Lawrence 2024 (arXiv:2409.02820v2), verbatim:**

    T_c = ħω/(2π k_B)                  [β_c ħω = 2π; ω = barrier frequency]
    k_inst = (1/√(2πħ)) (−d²S_inst/dτ²)^{1/2} (Z_inst/Z_r) e^{−S_inst(τ)/ħ}        (4)
    Z_inst(τ) = Π_{j=1}^{f−1} 1/(2 sinh[u_j(τ)/2])                                 (5)
    symmetric Eckart:  S_inst(τ) = 2τ_c V‡ − τ_c² V‡/τ ,   τ_c = 2π/ω              (69)

Z_inst generalises Z‡ and e^{−S/ħ} generalises e^{−βV‡}. **[V] Stated defects:** the standard
instanton **exists only below T_c** (*"there does not exist a real periodic orbit"* for τ < τ_c),
it carries an *"(approximate) factor of two error"* at T_c, and the parabolic-barrier rate diverges
at β/β_c = 1. **[C]** For the barrier verified in Rung 1, T_c = 387.0 K.

**[V] THE HONEST ACCURACY OF RPMD, from the review's own Table 1** — percent deviation of RPMD from
more accurate quantum calculations. **These are the numbers to quote, not a generic "13%":**

| reaction | below T_c | above T_c | T_c |
|---|---|---|---|
| **H + H₂ → H₂ + H** | **−42% (200 K) to −33% (300 K)** | **−30% (400 K) to −15% (1000 K)** | **345 K** |
| D + H₂ → DH + H | −38% (200 K) | −32% (300 K) to −15% (1000 K) | 245 K |
| symmetric Eckart | −45% (125.5 K) to −23% (188 K) | −15% (251 K) to −10% (377 K) | 239 K |
| asymmetric Eckart | +44% (β=12) to +8% (β=8) | 0 (β=6 to β=2) | β_c = 2π |
| Cl + HCl → ClH + Cl | −70% (200 K) to −65% (300 K) | −63% (400 K) to −59% (500 K) | 320 K |
| Mu + H₂ → MuH + H | +15% (200 K) to +1% (400 K) | −6% (500 K) to −2% (1000 K) | 409 K |

**RPMD underestimates H + H₂ by ~15% at 1000 K, growing to ~42% at 200 K, and systematically
*under* for energetically symmetric reactions in deep tunnelling.** An instrument that ships RPMD
must ship that table with it. The H + H₂ numbers are from **[X]** Suleimanov, Pérez de Tudela,
Jambrina, Castillo, Sáez-Rábanos, Manolopoulos & Aoiz, *PCCP* **15**, 3655–3665 (2013).

Further refs **[X]**: Craig & Manolopoulos, *JCP* **123**, 034102 (2005) (refined RPMD rate theory);
Voth, Chandler & Miller, *JCP* **91**(12), 7749–7760 (1989), DOI 10.1063/1.457242 (QTST; per its
abstract, applied to *"the one-dimensional Eckart barrier problem and … the nonseparable
two-dimensional collinear H₂+H reaction"* — i.e. **exactly Rung 3's system**);
Richardson, *JCP* **144**, 114106 (2016) (instanton from first principles); Zarotiadis, Lawrence &
Richardson, arXiv:2505.04770 (discretised ring-polymer action, S_free = Σ (m/2β_Nħ)|x_i−x_{i−1}|²);
and Dušek, Lawrence & Richardson, *"Perturbatively corrected ring-polymer instanton rate theory
rigorously captures anharmonicity and deep tunneling"*, arXiv:2509.01454 — validated on **collinear
H + H₂ and its isotopologues**, i.e. the current state of the art on Rung 3's exact system.
**[U] I could not reconcile the submission date of that last preprint; verify it before citing.**

**The observable that IS kinetics.** k(T) with tunnelling, obtained without a global PES fit and
without a grid — the method that actually scales to molecules.

**Cost per frame.** P × (a classical MD step) per bead-necklace, times an ensemble. At P = 32 and
10⁴ necklaces this is the same order as Rung 6 × 32: a few tens of ms per frame. Interactive but
not free; better run as a background accumulator whose estimate tightens visibly.

**Independent oracle.** **[V]** Buchowiecki & Vaníček, *"Direct evaluation of the temperature
dependence of the rate constant based on the quantum instanton approximation"*, *JCP* **132**,
194106 (2010), arXiv:1004.0201 — I read the abstract: tested *"on the Eckart barrier and the
full-dimensional H + H₂ → H₂ + H reaction. In the temperature range from 300K to 1500K, the error
of the present method remains within 13% despite the very large deviations from the Arrhenius
law."* **That "within 13%" over 300–1500 K is exactly the kind of bounded honest claim this
instrument should be making.** Plus Rung 1's exact κ(T) for the 1-D case.

**Falsifier.** k_RPMD does not converge as P increases; it disagrees with the exact 1-D Eckart rate
by more than the published RPMD error bars; it is reported below T_c without the instanton caveat.

---

### Rung 8 — *Branching.* Nonadiabatic kinetics, exactly solvable. (NO PES FITTING NEEDED)

**Model.** Two electronic states, one nuclear coordinate. Three canonical problems, all with
published exact answers.

**Equations — the general two-state form.** **[V]** Read from Mannouch & Richardson (MASH),
arXiv:2212.11773 v1, §II:

    Ĥ = Σ_j p_j²/2m + V̄(q) + V̂(q) ,   tr[V̂(q)] = 0
    V̂(q) = V_z(q) [ |ψ₊⟩⟨ψ₊| − |ψ₋⟩⟨ψ₋| ] ,   V_±(q) = V̄(q) ± V_z(q)
    d_j(q) = ⟨ψ₊(q)| ∂ψ₋(q)/∂q_j ⟩            (nonadiabatic coupling vector)

In the diabatic basis V̂ = κ(q) σ̂_z + Δ(q) σ̂_x, so V_z = √(κ² + Δ²).

**Tully's three models, parameters verified. [V]** All three use a single nuclear degree of
freedom with **m = 2000 a.u.**, initialised on the lower adiabatic surface at **q_init = −15**.
Reference **[X]** Tully, *"Molecular dynamics with electronic transitions"*, *JCP* **93**,
1061–1071 (1990), DOI 10.1063/1.459170. Parameters as quoted in MASH:

| model | what it tests | κ(q) | Δ(q) | parameters |
|---|---|---|---|---|
| I — single avoided crossing (Miller-modified variant) | nuclear wavepacket **branching** | A tanh(Bq) | C e^{−Dq²} | A = 0.01, B = 1.6, C = 0.005, D = 1 |
| II — dual avoided crossing | electronic **interference** (Stückelberg) | ½(A e^{−Bq²} − E₀) = −V̄(q) | C e^{−Dq²} | A = 0.1, B = 0.28, C = 0.015, D = 0.06, E₀ = 0.05 |
| III — extended coupling | **decoherence** after wavepacket splitting | −A | B[1 + sgn(q)(1 − e^{−C\|q\|})] | A = 6×10⁻⁴, B = 0.1, C = 0.9 |

**[V]** MASH's initial nuclear Wigner distribution for the wavepacket cases:
ρ₀(q,p) = 2 exp[−(p−p̄)²/γ − γ(q−q̄)²]; model I is run at p̄²/2m = 0.03 with γ = 0.5 and at
p̄²/2m = 0.1 with γ = 0.1; the distributions are compared at t = 150 fs.

**Landau–Zener.** **[X]** Zener, *"Non-adiabatic crossing of energy levels"*, *Proc. R. Soc. Lond. A*
**137**, 696–702 (1932), DOI 10.1098/rspa.1932.0165. The transition probability for a linear
crossing traversed at constant velocity v is **[T]**

    P_LZ = exp( −2π Δ² / (ħ v |F₁ − F₂|) )

with Δ the diabatic coupling at the crossing and F_i the diabatic slopes. **[T]** — I could not
open a page carrying this exact form (WebSearch budget exhausted); the Zhu–Nakamura generalisation
to non-linear crossings is a lead, not verified here. **Verify before building.** It is nonetheless
the cheapest analytic nonadiabatic oracle there is: one exponential, one closed form, and it is
*the* result that connects a coupling to a rate.

**Marcus theory.** **[X]** Marcus, *JCP* **24**, 966–978 (1956), DOI 10.1063/1.1742723, and the Nobel
lecture review **[X]** *Rev. Mod. Phys.* **65**, 599–610 (1993), DOI 10.1103/RevModPhys.65.599. Two
parabolas, a reorganisation energy λ, a driving force ΔG, and the nonadiabatic rate **[T]**

    k_ET = (2π/ħ) |H_AB|² (4πλk_BT)^{−1/2} exp[ −(ΔG + λ)²/(4λk_BT) ]

including the **inverted region** — the rate *falls* as the reaction becomes more exergonic. **[V]**
MASH explicitly names *"the Δ² dependence of Marcus-theory rates"* as a thing mean-field mapping
methods get wrong, which is precisely the falsifier for this rung.

**The observable that IS kinetics.** Branching ratios as a function of initial momentum (Tully
I/II/III's standard plot), the electron-transfer rate's Δ² scaling and its inverted region, and
the failure modes: Ehrenfest giving one peak where there must be two.

**Cost per frame. [C]** A 1-D two-state exact split-operator grid at N = 2048 per state:
~0.4 µs per step at the bandwidth floor, dispatch-bound in practice. **Thousands of steps per
frame — the exact quantum answer and three approximate methods can run side by side, live.**
Classical-trajectory methods (Ehrenfest, FSSH, MASH) at 10⁵ trajectories cost the same as Rung 6.

**Independent oracle. [V]** MASH states its own: *"numerically exact results are computed using a
split-operator approach"* for the wavepacket cases and *"using the log-derivative approach"* for
scattering probabilities — the log-derivative method being **[X]** B. R. Johnson's (his 1977
technical report is DOI 10.21236/ADA048446; the canonical *J. Comput. Phys.* paper was not
resolved). **So the instrument's own split-operator grid IS the accepted oracle for this rung.**
That is unusual and valuable: Rung 8 needs no external fixture at all.

**The methods to implement, in order, and what each is for. [X]** Tully FSSH (1990) — the standard;
**[X]** MASH — Mannouch & Richardson, *"A mapping approach to surface hopping"*, *JCP* **158**,
104111 (2023), DOI 10.1063/5.0139734, whose abstract I read **[V]**: transitions are
*"deterministic and occur when the electronic mapping variables evolve between specified regions
of the electronic phase space"*, it is *"rigorously derivable from exact quantum mechanics, as a
limit of the quantum-classical Liouville equation"*, and it *"consistently produces more accurate
results than FSSH, at a comparable computational cost."* MASH is the right choice for an
instrument: deterministic hops mean reproducible frames.

**Falsifier.** Ehrenfest reproducing two peaks in model I (it must not — the single-peak failure
is the physics lesson); branching ratios not matching the split-operator reference; the ET rate
not scaling as |H_AB|²; the inverted region absent.

---

### Rung 9 — *Electron dynamics with moving nuclei.* Astra's program. **Not a kinetics rung.**

**Model.** RT-TDHF/TDDFT or RT-DFTB with nuclei moving (Ehrenfest), i.e. the dossier's §11–§12
program with the Ṡ = τ + τ† connection.

**Equations.** The dossier already has them right (§11):

    i S ċ = (H − iτ) c ,  τ_{μν} = ⟨χ_μ|χ̇_ν⟩ ,  Ṡ = τ + τ†
    Ḋ = −i(S⁻¹HD − DHS⁻¹) − S⁻¹τD − Dτ†S⁻¹

**Why this is not a kinetics rung, stated plainly.** Real-time electron dynamics with mean-field
nuclei produces *one trajectory on an average surface*. A rate constant is a statistical object:
it requires either (a) an ensemble large enough to resolve a branching ratio, with decoherence
handled — which is Rung 8's machinery, not Rung 9's — or (b) a rate theory layered on top, which
is Rungs 5–7. Ehrenfest alone cannot produce a branching ratio; the dossier's own R11 says so
(*"Ehrenfest mean trajectories do not automatically represent separated nuclear branches"*), and
MASH's abstract names mean-field failure explicitly. **The electron-dynamics route is the longest
road to kinetics and it is not the road this instrument should take first.**

What Rung 9 *is* good for: seeing electrons move while nuclei move, which is a genuine and
beautiful thing and is exactly what the Beta dossier is for. It is simply orthogonal to the rate.

**Cost, and this is the number that settles the ordering.** **[V]** The fastest real electron
propagation anyone has published is RT-DFTB: **73-atom chlorophyll a at 0.0086–0.014 s per
propagation step** — which *would* clear 60 fps. But at Δt = 0.2 a.u. that is **≈ 0.5 fs of physical
time per wall-clock second: a real-time slowdown of order 10⁹.** The same paper's production run
took **6.5 hours for 600 000 steps** and **4 days for its 24 000 probe trajectories on 128 cores**.
Nothing in the literature claims interactive-rate quantum *electron* dynamics; the strongest
genuine interactivity claim in the field is *nuclear* — TeraChem + VMD at *"minimum simulation rates
below five MD steps per second"* for *"a few dozen atoms"* at Hartree–Fock, i.e. **below 10 fps**.
And ChronusQ, which does implement Ehrenfest, **has no GPU path for it at all** (repo-wide grep:
`cuda` → 0 paths). Full numbers, sources and the verbatim equations are in §3.2A.

**So the honest statement is: the electron-dynamics route is ~10⁹× short of real time for the
physical timescales chemistry needs, its leading implementations are CPU-only, and even if it were
free it would not produce a rate. Three independent reasons it is not the kinetics path.**

**Falsifier.** A branching ratio claimed from a single mean-field trajectory. An energy ledger
that does not close (the dossier's §12 rule).

---

### Rung 10 — *The macroscopic layer.* Reactions you can see happening. (TRIVIAL, HIGH VALUE)

**Model.** Given rate constants from any rung above, propagate a chemical system.

**Equations, verbatim. [V]** A research agent read Gillespie's 1977 paper in full (free scan at
`cmor-faculty.rice.edu/~cox/gillespie.pdf`). **[X]** Gillespie, *J. Phys. Chem.* **81**(25),
2340–2361 (1977), DOI 10.1021/j100540a008; the 1976 predecessor is *J. Comput. Phys.* **22**(4),
403–434, DOI 10.1016/0021-9991(76)90041-3 (**[U]** paywalled, citation cross-confirmed).

Propensities, eqs. (12), (15), (16), (19a):

    h_μ = number of distinct R_μ molecular reactant combinations in state (X₁,…,X_N)
    a_μ = h_μ c_μ ,   a_μ dt = P(R_μ occurs in V in (t,t+dt)) ,   a₀ = Σ_{ν=1}^M a_ν
    h_μ = X₁X₂            for S₁ + S₂ → …
    h_μ = ½ X₁(X₁−1)      for 2S₁ → …

Master equation, eq. (13):

    ∂P(X₁,…,X_N;t)/∂t = Σ_{μ=1}^M [ B_μ − a_μ P(X₁,…,X_N;t) ]

Direct method, eqs. (17c), (18), (21a), (21b):

    P₀(τ) = exp[ −Σ_{ν=1}^M a_ν τ ]                                             (17c)
    P(τ,μ) = a_μ exp(−a₀ τ)   for 0 < τ < ∞ , μ = 1…M ; else 0                  (18)
    τ = (1/a₀) ln(1/r₁)                                                         (21a)
    μ = the integer for which  Σ_{ν=1}^{μ−1} a_ν < r₂ a₀ ≤ Σ_{ν=1}^{μ} a_ν      (21b)

with r₁, r₂ independent uniform variates on (0,1). **[V] Gillespie's own remark, which tells you how
to implement it:** *"the master equation itself plays no role whatsoever in either the derivation or
the implementation of the stochastic simulation algorithm."* Update incrementally: recompute only
the a_μ whose reactants changed and update a₀ by differences.

**[V] THE CME↔MASS-ACTION RELATIONSHIP, exactly as Gillespie states it — and it contains two traps
that will silently corrupt any instrument that reuses microscopic rate constants.** Eqs. (5a),
(5b), (6b):

    h₁ = V c₁ ⟨X₁X₂⟩/(⟨X₁⟩⟨X₂⟩)                                  (5a)  [exact]
    k₁ ≅ V c₁                                                     (5b)  [assumes ⟨X₁X₂⟩=⟨X₁⟩⟨X₂⟩]
    k₂ = V c₂ ⟨½X₁(X₁−1)⟩/(⟨X₁⟩⟨X₁⟩) ≅ V c₂ / 2                   (6b)

**Trap 1 — the factorial.** Verbatim: *"if R_μ has two identical reactant molecules then c_μ will be
larger than k_μ by a factor of 2!; if R_μ has three identical reactant molecules, this [factor is
3!]."* **A rate constant fed from Rungs 3–8 into an SSA for a reaction like H + H → H₂ is wrong by
2 unless this is handled.** **Trap 2 — the moment hierarchy never closes.** Verbatim: *"unless all
the reactions R_μ are simple monomolecular reactions, the equations for the time derivative of any
moment will always involve higher order moments, thus rendering the set of moment equations
**infinitely open ended**"*, and *"contrary to widespread belief, it is not even guaranteed that the
reaction-rate equations will provide a sufficiently accurate account of the **average** molecular
[populations]."* **The mass-action ODE is not the mean of the SSA in general. The "SSA mean → ODE at
large N" check below is therefore a check on a limit, not an identity, and its failure at small N
is physics, not a bug.**

**[U] τ-leaping.** Gillespie, *JCP* **115**, 1716–1733 (2001), reference verified but the paper was
not opened; per its abstract, *"one executes a number of reaction events, selected randomly from a
**Poisson** distribution, to enable simulation of long times."* **The usual update
x(t+τ) = x(t) + Σ_j P_j(a_j(x),τ) ν_j is UNVERIFIED against the original. Do not print it as
verified.**

**The observable that IS kinetics.** Concentrations changing. Induction times. Branching ratios
between competing channels. Oscillations if the network has them. **This is the rung where the
word "reaction" becomes visible to a person who is not a theorist**, and it costs essentially
nothing given a rate constant from above.

**Cost per frame.** SSA with a few species: thousands of events per frame on the CPU. Trivial.

**Independent oracle.** The CME's own large-N limit: the SSA ensemble mean must converge to the
mass-action ODE as particle number grows. That is a self-contained, exact check.

**Falsifier.** SSA mean ≠ ODE solution at large N; τ-leaping used without an error criterion;
rate constants fed in with mismatched units (the classic silent killer: bimolecular constants
are per-concentration and the SSA needs per-molecule propensities with a volume factor).

---

### Rung 11 — *The horizon.* On-the-fly reactive dynamics. (RESEARCH, NOT BETA, NOT 2027)

Bond-breaking dynamics on a surface evaluated as you go, fast enough to watch. In 2026 the only
plausible engine for this is a machine-learned interatomic potential, not an ab initio one. See
§4 for what this can and cannot mean.

---

## 2. VERDICT ON ASTRA'S ORDERING

**The question.** Should kinetics-on-a-PES come *before* moving-nuclei benzene?

**Answer: yes for Rungs 1–3 and 6, and the reason is structural, not a matter of taste.**

### 2.1 The benzene program, completed perfectly, moves the tree zero rungs up this ladder

Dossier §5 defines the flagship's domain as *"a certified neighborhood of one optimized, isolated,
neutral benzene minimum"*, measured with held-out geometries, and it commits the model to *"stop
or request a new solve beyond it. No silent extrapolation."* §16 builds the 36×36 Hessian **at the
minimum** and the local energy E_local = E₀ + ½Σω_α²Q_α². §31 lists *"reliable chemical reaction
barriers"* among the explicit non-goals.

That is a correct and admirable specification of a near-equilibrium surrogate. And it is, by
construction, a model that **cannot** produce kinetics: a rate constant is an integral over the
saddle region, which lies outside the certified neighbourhood of the minimum. A harmonic
expansion at a minimum has no barrier in it. Astra's B6/B7 is therefore not a partial step toward
the owner's goal — it is a complete step in an orthogonal direction.

This is not a criticism of the plan. It is an argument that **the kinetics goal needs its own wave,
and that nothing in the benzene wave will deliver it as a by-product.**

### 2.2 The two programs need almost disjoint machinery

| needed by kinetics Rungs 1–8 | needed by benzene B4–B7 |
|---|---|
| grid Hamiltonian application (stencil/DVR) — **does not exist** | derivative couplings τ, Ṡ = τ+τ†, cross overlaps |
| absorbing boundary / damping function — **does not exist** | 36×36 mass-weighted Hessian, projected rigid modes |
| flux operator + dividing surface — **does not exist** | reference-method fixture pipeline (PySCF, licence, provenance) |
| energy-domain Chebyshev projection — **does not exist** | smooth orthonormal frame X(Q), ∂X terms |
| GPU reduction to scalars (flux, norm) | held-out geometry domain measurement |
| a barrier, a temperature, an ensemble | a minimum, a spectrum, a response |

The **only** shared prerequisites are dossier §6 (the `PhysicalModel` contract, and specifically
the optional `step` capability that *"never [is a] successful no-op fallback"*) and §12 (one energy
functional, one force definition, finite differences as the oracle). Both are B0/B1.

### 2.3 Why Rungs 1–3 should jump the queue specifically

1. **Rung 1 is free and is already certified — twice over.** [C] I verified its oracle to nine
   significant figures in this session, and [V] the formula I verified turns out to be Seideman &
   Miller's own eq. (3.2) evaluated at essentially their own test parameters (V₀ = 0.425 eV,
   m = 1060 a.u., *"approximately the H + H₂ collision"*). There is no fixture to generate, no
   external code to license, no reference method to pin. It is three closed forms and a quadrature,
   and it produces tunnelling, κ(T), a crossover temperature and an Arrhenius bend — four things the
   instrument cannot do today. **And [C] my own numbers independently reproduced the literature's
   stated validity limit for the Wigner correction** (wrong by 448× at 200 K, right to 4% at 1500 K,
   crossing at T_c = 387 K). The cost/value ratio is not close to anything in the Beta backlog.
2. **Rung 2 de-risks the largest unknown in the whole program at the smallest possible scale.**
   Can WebGPU carry a grid propagator inside a 16.7 ms frame? Nobody knows; the tree has exactly
   one compute pipeline and it is a renderer. Find out on a 1-D barrier whose answer is known to
   nine digits, not on benzene.
3. **Rung 3's cost is already computed and it is one frame.** [C] 15.2 ms for a complete converged
   collinear reaction-probability curve at 256² — every energy at once. That is the smallest
   honest "chemical kinetics in an instrument" that exists, and it lands inside the frame budget
   `frame-budget.js` already measures.
4. **The machinery compounds.** The grid + absorber + flux + Chebyshev kernel built once for Rung 2
   is *the same kernel* that serves Rung 3 (2-D), Rung 4 (3-D), Rung 8's exact two-state oracle,
   and the dossier's own R11 continuum/ionization commission. Nothing else in the backlog has that
   reuse factor. Astra's R11 nominates tRecX and MASH as *"primary method leads"* for exactly this
   machinery — Rung 2 is its cheapest possible first instance.
5. **Rung 6 needs no quantum machinery at all** and delivers the single most legible thing on the
   list: 10⁵ trajectories reacting live, a measured rate, and a Kramers curve to grade it against,
   at 1.6 ms/frame [C]. If the owner wants "reactions happening, in real time, driven by the rack"
   in the next build rather than the next year, this is the rung.
6. **Rung 6 has no published precedent as an interactive tool** — a dedicated prior-art agent
   searched for it specifically and found nothing (§3.2B). That is unusual: the cheapest rung on the
   ladder is also the one with the clearest novelty claim. If the owner wants a defensible "first",
   this is it, not the quantum rungs whose engineering is already precedented in browsers (§3.2.1).
7. **Rungs 1–8 need no moving electronic basis whatsoever.** This is the most important scheduling
   fact in the document. Every rung through 8 runs on a *fixed* potential-energy surface in nuclear
   coordinates. The Ṡ = τ + τ† connection — the dossier's central mathematical insight, and it is a
   genuinely correct and important one — is a **Rung 9** requirement. It is not on the critical path
   to kinetics at all.
8. **And Rung 9's own numbers close the argument independently.** [V] The electron-dynamics route is
   ~10⁹× short of real time for chemical timescales, its leading Ehrenfest implementation (ChronusQ)
   has **no GPU path**, and mean-field dynamics does not branch — three independent reasons, each
   from a source opened in this session (§3.2A). **Astra put Rung 9 in the right place. This memo
   only argues that Rungs 1–3 and 6 should not be waiting behind B6/B7 for it.**

### 2.4 What should NOT jump the queue

- **Rung 4 (3-D J = 0).** [C] 3.3 s per curve, 147 MB VRAM, and it needs a PES port whose licence
  is unstated. Do it as a *precomputed fixture plus live re-weighting* (Rung 5), not as a live
  propagation. The MADWAVE3 reference file is already downloaded and is a better first move than
  a port.
- **One genuine open question before K3 is built.** [V] Seideman & Miller's eq. (2.13b) gives N(E)
  from **one complex matrix inverse per energy** on a DVR grid with absorbing potentials, with no
  time propagation at all and a result that provably *"does not depend on the choice of the dividing
  surface"*. For a 2-D collinear grid that is a large sparse solve — but sparse solves are a
  well-understood GPU problem, and the method sidesteps every time-axis convergence worry. **Cost
  both routes before committing K3 to propagation.** Nothing in this memo settles which wins.
- **Rung 5's partial-wave sum.** [C] 1.7 min to J = 30. Background job, cached N(E), live T lane.
- **Rung 9.** Keep it exactly where Astra put it: the benzene program, gated, labelled, and not
  advertised as kinetics.
- **The DFTB native backend (B10/R3).** Unchanged by this analysis; still off the critical path.

### 2.5 Recommended insertion

Add a **K wave** to dossier §32's dependency graph, running parallel to B4/B5 and *ahead of*
B6/B7:

    B0 ──┬── B1 ──┬── K1  Rung 1: analytic barrier, kappa(T), Arrhenius, Wigner falsifier   [free]
         │        ├── K2  Rung 2: 1D grid + absorber + flux, certified against K1            [small]
         │        └── K6  Rung 6: Langevin ensemble, measured rate vs Kramers                [small]
         ├── K3   Rung 3: 2D collinear H+H2 on LEPS, then BKMP2                             [medium]
         ├── K5   Rung 5: k(T) from cached N(E); MADWAVE3 fixture as the grader              [small]
         ├── K8   Rung 8: Landau-Zener, Tully I/II/III, own split-operator as oracle         [medium]
         └── K10  Rung 10: SSA/CME macroscopic layer fed by any k above                      [small]

    B4 ── B5 ── B6 ── B7   (benzene, unchanged, and explicitly NOT a kinetics path)

Each K rung inherits the dossier's thirteen mini-contract fields; the oracle and falsifier columns
are filled in §1 above. **K1, K2, K6 and K10 together are, I estimate, less work than B6 alone,
and they deliver the owner's stated goal at its lowest honest rung.**

---

## 3. WHAT THE WORLD ALREADY HAS

*(See §3.2 for the live-agent addendum. Marks as in the legend.)*

### 3.1 Reactive quantum dynamics: the codes and the fixtures

| what | who / where | what it actually does | mark |
|---|---|---|---|
| **BKMP2 H₃ surface** — Fortran + 8701 ab initio points, RMS 0.27 mE_h | Boothroyd, Keogh, Martin & Peterson, *JCP* **104**, 7139 (1996), DOI 10.1063/1.471430 · [code](https://www.cita.utoronto.ca/~boothroy/bkmp2.html) · [source](https://www.cita.utoronto.ca/~boothroy/data/bkmp2/bkmp2.f) | The reference H + H₂ surface. 1759 lines, bohr/hartree, analytic derivatives, `bkmp2test.out` as a port fixture. **No licence stated.** | [V] downloaded |
| **MADWAVE3** — GPL-3.0 Fortran 90 wavepacket code, MPI+OpenMP, FFTW3 | Roncero & del Mazo-Sevillano, [arXiv:2412.10167](https://arxiv.org/abs/2412.10167) (13 Dec 2024) · [repo](https://github.com/qmolastro/madwave3) | Triatomic state-to-state reactive/inelastic/photodissociation on coupled diabatic states. Real-Chebyshev, reactant Jacobi (r,R,γ). Reference run: 256×256×140, J=0, H+DH, 48-core EPYC. | [V] read |
| **MADWAVE3 reference fixture** — 500-energy converged P(E) for H+DH, J=0 | `EXAMPLES/HD+H_collision/J000-check/S2prod.v00.J000.k00008` | **A ready-made grading file for Rung 4.** Analysed in §1 Rung 4 above. | [V] downloaded |
| **Real-wavepacket method** | Gray & Balint-Kurti, *JCP* **108**, 950–962 (1998), DOI 10.1063/1.475495 | The method that makes real arrays possible. | [X] |
| **DIFFREALWAVE** — parallel real-wavepacket code for state-to-state differential cross sections | referenced as [10] by MADWAVE3 | Product Jacobi coordinates, single electronic state. | [U] snippet only; ResearchGate/CPC paywalled |
| **ABC** — time-independent hyperspherical close-coupling | referenced as [3] by MADWAVE3 | *"scales as n² in memory and as n³ in computing time"* — the alternative to wavepackets, easier at low E and for narrow resonances | [V] via MADWAVE3 |
| **Chebyshev propagator** | Tal-Ezer & Kosloff, *JCP* **81**, 3967 (1984), DOI 10.1063/1.448136; Mandelshtam & Taylor, *JCP* **103**, 2903 (1995), DOI 10.1063/1.470477 (absorption) | The recursion and its damped variant. | [X] |
| **Flux-correlation rate theory** | Miller, *JCP* **61**, 1823 (1974), DOI 10.1063/1.1682181; Miller, Schwartz & Tromp, *JCP* **79**, 4889 (1983), DOI 10.1063/1.445581; Seideman & Miller, *JCP* **96**, 4412 (1992), DOI 10.1063/1.462832 | N(E), C_ff(t), and direct N(E) with absorbing boundaries. | [X] |
| **H + H₂ benchmark rates** | Chatfield, Truhlar & Schwenke, *JCP* **94**, 2040 (1991), DOI 10.1063/1.459925; Day & Truhlar, *ibid.* 2045, DOI 10.1063/1.459926 | The canonical quantal benchmark rates. | [X]; AIP 403 on open |
| **H + H₂ theory ↔ experiment** | Mielke *et al.*, *PRL* **91**, 063201 (2003), DOI 10.1103/PhysRevLett.91.063201 | The convergence paper. **The grader for Rung 5.** | [X] |
| **Quantum instanton rate, H + H₂ full-dimensional** | Buchowiecki & Vaníček, *JCP* **132**, 194106 (2010), [arXiv:1004.0201](https://arxiv.org/abs/1004.0201) | *"error ... within 13%"* over 300–1500 K on Eckart + full-dim H+H₂ | [V] abstract |
| **Eckart barrier + tunnelling correction** | Eckart, *Phys. Rev.* **35**, 1303 (1930), DOI 10.1103/PhysRev.35.1303; Brown, *NBS J. Res.* **86**(4), 357 (1981), [PDF](https://nvlpubs.nist.gov/nistpubs/jres/086/jresv86n4p357_A1b.pdf) | The exact transmission coefficient and a <1% quadrature for κ(T), with FORTRAN. | [V] read the NBS PDF |
| **GPU Fourier split-operator** | Bauke & Keitel, [arXiv:1012.3911](https://arxiv.org/abs/1012.3911) (2010) | *"Performance gains of more than an order of magnitude"* for TDSE and TD Dirac on GPU. Old hardware. | [V] abstract |
| **GPU 2-D split-step scaling** | Smith, Cooke & LeBlanc, [arXiv:2010.15069](https://arxiv.org/abs/2010.15069) | Measured **θ = 9.7(1)×10⁻⁸ s per grid point**, GPU time linear in N, flat below η≈19–20. The anchor for my cost model. | [V] read the PDF |
| **Nonadiabatic benchmarks** | Tully, *JCP* **93**, 1061 (1990), DOI 10.1063/1.459170; Mannouch & Richardson (MASH), *JCP* **158** (2023), DOI 10.1063/5.0139734, [arXiv:2212.11773](https://arxiv.org/abs/2212.11773) | Models I/II/III with m=2000, q_init=−15, parameters in §1 Rung 8. MASH: deterministic hops, QCLE-derivable, FSSH cost. | [V] read the MASH PDF |
| **Rate theory canon** | Eyring, *JCP* **3**, 107 (1935); Wigner, *Z. Phys. Chem.* **19B** (1932); Kramers, *Physica* **7**, 284 (1940); Hänggi, Talkner & Borkovec, *RMP* **62**, 251 (1990); Truhlar & Garrett, *ARPC* **35**, 159 (1984); Craig & Manolopoulos, *JCP* **121**, 3368 (2004) and **122**, 084106 (2005); Richardson & Althorpe, *JCP* **131**, 214106 (2009); Richardson, *IRPC* **37**, 171 (2018) and *JCP* **148**, 200901 (2018) | DOIs in §1. | [X] all |
| **Stochastic kinetics** | Gillespie, *JCP(Comp)* **22**, 403 (1976), DOI 10.1016/0021-9991(76)90041-3; *J. Phys. Chem.* **81**, 2340 (1977), DOI 10.1021/j100540a008 | CME and the exact SSA. | [X] |
| **Electron transfer** | Marcus, *JCP* **24**, 966 (1956); *RMP* **65**, 599 (1993) | Parabolas, λ, the inverted region. | [X] |
| **Real-time electronic structure** | Goings, Lestrange & Li, *WIREs Comput. Mol. Sci.* **8** (2017/18), DOI 10.1002/wcms.1341; Li *et al.*, *PCCP* **7**, 233 (2005), DOI 10.1039/b415849k (the TDHF/MMUT lineage) | The RT-TDHF/TDDFT review and the propagator paper. | [X] |
| **RT-DFTB** | Bonafé, Aradi, Hourahine, Medrano, Hernández, Frauenheim & Sánchez, *JCTC* **16**, 4454–4469 (2020), DOI 10.1021/acs.jctc.9b01217 · [equations](https://dftbplus-recipes.readthedocs.io/en/stable/electronicdynamics/introduction.html) | The RT-DFTB implementation the dossier §11 already cites for convention checking. | [X] |
| **GPU quantum chemistry** | Ufimtsev & Martínez, *JCTC* **4**, 222–231 (2008), DOI 10.1021/ct700268q | The paper that started GPU ERI evaluation (TeraChem lineage). | [X] |

### 3.2 Interactive and in-browser chemistry — the prior art that actually exists

Gathered by a dedicated prior-art agent that opened each page; its marks are reproduced.
**This section changes the novelty claim materially and should be read before any public statement
is made.**

#### 3.2.1 The closest prior art to Rungs 2–3: browser GPU Schrödinger with live potentials

| what | where | what it does | ceiling |
|---|---|---|---|
| **marl0ny / QM-Simulator-2D** | [live](https://marl0ny.github.io/QM-Simulator-2D/index.html) | **WebGL 2-D single-particle TDSE where the user draws barriers and scatters Gaussian packets off them.** Runtime-selectable integrators: **Visscher real/imaginary leapfrog** (*Comput. Phys.* **5**, 596, 1991), **Crank–Nicolson**, and **split-operator**. Also ships 2-D Dirac solvers (Hammer & Pötz staggered grid, arXiv:1306.5895) and, in 2026, two interacting quantum particles in 2-D live in a browser. | Generic potentials. **No chemistry, no PES, no molecules, no rate.** |
| **Schrödinger Playground** | `mikaberidze.github.io/schrodinger/` (G. Mikaberidze, © 2025) | 2-D TDSE, Euler or Crank–Nicolson, full paint interface for the potential (brush, shapes, function input, image upload). | Plain JS, generic potentials. |
| **Demidov WebGL2 GPGPU** | `ibiblio.org/e-notes/webgl/gpu/schrodinger.htm` | **2-D TDSE on a 256×256 grid, implicit Crank–Nicolson, 100 Jacobi iterations per step, in GLSL.** | Generic potentials, one particle. |
| **Vizit Solutions** | `vizitsolutions.com/portfolio/webgl/gpgpu/schrodingerEquation.html` | 1-D TDSE by FDTD in fragment shaders, real in R, imaginary in G. | 1-D. |
| **Web-Schrödinger** | Márk, [arXiv:2004.10046](https://arxiv.org/abs/2004.10046) (2020) | Interactive 2-D TDSE + stationary solver — **but the solver runs on a server**, browser is UI only, *"run times in the second, or minute range."* | Not client-side, not frame-rate. |

**Read the top row carefully. A browser, a GPU, a 2-D Schrödinger equation, a split-operator
propagator and user-drawn barriers are all precedented.** Rung 2 is therefore *not* novel physics or
novel engineering; it is a known-achievable step, which is exactly why it is the right place to
start. What no one in that list has is a **chemical potential-energy surface**, a **flux operator**,
a **reaction probability**, or a **rate**.

**And there is a 2026 paper doing Rung 3's exact physics:** Mohtashim & Kais, *"Digital Quantum
Simulation of Wavepacket Correlations in a Chemical Reaction"*, *Entropy* **28**(2), 144 (2026) —
**collinear H + H₂ on a LEPS surface**, run on quantum hardware, not interactive. A useful
cross-check on the LEPS choice and a reminder that collinear H + H₂ remains the canonical minimal
reactive system in 2026.

Offline H + H₂ wavepacket work on GPUs exists: **RWAVEPR** was ported to CUDA (*"Time Dependent
Quantum Reactive Scattering on GPU"*, Springer LNCS; *"Quantum reactive scattering on innovative
computing platforms"*, *Comput. Phys. Commun.*, 2013) — **[U] snippet-only**.

#### 3.2.2 Client-side quantum chemistry already exists, as of 2026

- **webgpu-q** — `webgpu-q.vercel.app`, [source](https://github.com/abgnydn/webgpu-q), MIT, TypeScript,
  by Ahmet Baris Gunaydin; repo created **2026-05-04**, last push 2026-09-06. Claims HF/UHF,
  RKS/UKS-DFT, MP2/DF-MP2, FCI, CCSD/CCSD(T) with a **hand-written WGSL triples kernel**, analytic
  Pulay gradients, L-BFGS optimisation, harmonic frequencies + IR/Raman, CIS/TDA/TDDFT,
  EOM-CCSD, CPHF polarisabilities, Boys/Pipek–Mezey localisation, Molden/Cube/QCSchema export.
  Stated: H₂O cc-pVDZ CCSD(T) **8.4 s GPU vs 116.4 s CPU**; HF matches PySCF to **≤ 0.1 mE_h**.
  Its Learn page claims *"Drag a real water molecule and watch real quantum chemistry respond — a
  live Hartree–Fock SCF recomputes the dipole as you bend the bonds."* **[U] claimed-by-site — the
  agent did not execute the WebGPU app headlessly.** Ceiling: single-point and geometry response.
  **No time propagation, no dynamics, no kinetics.**
- **GANSU-Lite** — [github.com/Yasuaki-Ito/GANSU-Lite](https://github.com/Yasuaki-Ito/GANSU-Lite),
  created 2026-04-25. **Rust → WebAssembly** hot paths with optional SIMD f64x2, SCF in a Web Worker,
  WebGPU shaders present but undocumented. RHF/UHF/ROHF, RKS/UKS/ROKS, MP2/MP3/CCSD,
  CIS/ADC(2)/TDDFT, analytic gradients, numerical Hessian, PES scans, IR/Raman, RRHO
  thermochemistry, STO-3G→def2-TZVP; validated against PySCF 2.11.0 to sub-µHartree.
  **No MD, no time-dependent dynamics.**
- **PySCF in the browser does not exist.** The agent checked Pyodide's package list directly:
  `ase` is present; **`pyscf`, psi4, openbabel and xtb are not.** Both browser QC codes above were
  rewritten from scratch. Both are solo, unpublished, 2–3 stars. **Recent and obscure, but real —
  cite them; do not claim their ground.**

#### 3.2.3 Interactive molecular dynamics is a mature field with a 13-year-old name

- **"Real-time quantum chemistry" is a coined term with a claimed inventor.** Haag & Reiher,
  *"Real-time Quantum Chemistry"*, arXiv:1208.3717 (2012) → *Int. J. Quantum Chem.* **113** (2013).
  The lineage runs through Weymuth & Reiher's haptic teaching work (arXiv:2011.03256, 2020), SCINE
  (*JCP* **160**, 222501, 2024), **Heron** (*J. Phys. Chem. A* **128**(41), 9028, 2024 —
  *"interactive and automated explorations of chemical reactions … haptic force feedback,
  microkinetic modeling"*), and Csizi, Steiner & Reiher, *"Nanoscale chemical reaction exploration
  with a quantum magnifying glass"*, *Nat. Commun.* **15** (2024), DOI 10.1038/s41467-024-49594-2 —
  *"interactively manipulate nanoscale structures at the quantum level … complex reaction sequences
  … in real time"*. Engine: ultra-fast semi-empirical (SCINE Sparrow: MNDO → OM* → DFTB → AIQM1).
  **Note "microkinetic modeling" in Heron's description: that is Rung 10, already shipped by
  someone else, inside an interactive GUI.**
- **Live human-driven bond breaking on a genuine quantum surface was published in 2019.**
  Amabilino, Bratholm, Bennie, Vaucher, Reiher & Glowacki, *J. Phys. Chem. A* **123**(20),
  4486–4499 (2019), DOI 10.1021/acs.jpca.9b01006, arXiv:1901.05417. A human breaks bonds live in
  iMD-VR — hydrogen abstraction by CN radical from isopentane — to sample geometries along the
  reaction path; the neural net is then trained **offline** on that data. **This is the
  load-bearing precedent: the physics claim "live reactive dynamics on a quantum surface" is
  taken.** It is not in a browser and it has no kinetics readout.
- **Chemistry-as-an-instrument, with sonification, at 60 FPS, was published in 2014.**
  **danceroom Spectroscopy** — Glowacki, O'Connor, Calabró, Price, Tew, Tew, Mitchell, Hyde,
  Coughtrie & McIntosh-Smith, *Faraday Discuss.* **169**, 63–87 (2014), DOI 10.1039/c4fd00008k: up
  to ten depth sensors interpret the human body as an energy landscape superimposed on a running MD
  simulation, *"chaperoning the motion of the simulated atoms, affecting both graphics and sonified
  simulation data"*, GPU-accelerated to a **60 FPS target**, several users modulating
  simultaneously. Successors: *"Towards molecular musical instruments"*, Mitchell, Jones, O'Connor,
  Wonnacott, Glowacki & Hyde, *Audio Mostly 2020*, DOI 10.1145/3411109.3411143. **The *instrument*
  framing is not new. Only its engine was classical.**
- **Narupa / NanoVer.** O'Connor *et al.*, *JCP* **150**, 220901 (2019), DOI 10.1063/1.5092590,
  arXiv:1902.01827 — client-server iMD in VR, multi-person, forces applied to a live sim; the
  abstract's own application list includes *"reaction discovery using 'on-the-fly' quantum
  chemistry"*. Successor **NanoVer**: Wonnacott *et al.*, arXiv:2606.30678 (26 Jun 2026) — iMD in
  XR on standalone Quest 3, shipped to the Meta Horizon Store, session recording, agents following
  human-sketched 3-D paths.
- **A trained MLIP driving a live NanoVer loop: NOT FOUND, not disproven.** The agent's final
  search on that exact combination was cut off by the session's search budget. **Check before
  putting weight on it.**
- **Cloud/GPU interactive quantum dynamics.** TeraChem Cloud: Seritan, Thompson & Martínez, *JCIM*
  **60**(4), 2126–2137 (2020), DOI 10.1021/acs.jcim.9b01152. **InteraChem**: Wang, Seritan, Lahana,
  Ford, Valentini, Hohenstein & Martínez, *JCTC* **18**(6), 3308–3317 (2022),
  DOI 10.1021/acs.jctc.2c00005 — VR + GPU TeraChem, FOMO-CASCI excited states, conical-intersection
  optimisation, live MO and bond-order readouts. The genre's own review: Raucci, Weir,
  Sakshuwong, Seritan, Hicks, Vannucci, Rea & Martínez, *"Interactive Quantum Chemistry Enabled by
  Machine Learning, Graphical Processing Units, and Cloud Computing"*, *Annu. Rev. Phys. Chem.*
  **74**(1), 313–336 (2023), DOI 10.1146/annurev-physchem-061020-053438.

#### 3.2.4 Educational platforms are weaker than folklore assumes — and this helps

Verified against PhET's own metadata API (`phet.colorado.edu/services/metadata/1.3/simulations`):

- **`quantum-tunneling` ("Quantum Tunneling and Wave Packets"), `bound-states` ("Quantum Bound
  States") and `reactions-and-rates` are NOT in the HTML5 list.** All three are legacy Java flagged
  `legacyType: "java,cheerpj"`, last updated 2016, now run in-browser through CheerpJ. The GitHub
  repo `phetsims/quantum-bound-states` README says: *"This simulation is under development and has
  not been published."*
- **PhET's "Reactions & Rates" is a cartoon.** Classical 2-D collisions plus a hand-adjustable
  reaction-coordinate energy diagram. **No computed potential-energy surface, no quantum mechanics.**
- **PhET's brand-new HTML5 "Quantum Wave Interference" shipped 2026-09-10 — the day before this
  memo — and it is weaker than the Java sim it replaces.** The agent read its source: 200×200
  sample grid, but `WavePropagation.ts` evaluates a **closed-form Gaussian packet** plus a Fresnel
  aperture transfer, and `BarrierTypeValues = ['none','doubleSlit']` is the entire barrier
  vocabulary. Grep of the shipped 3.1 MB bundle: `Schr` 0 hits, `propagator` 0, `Crank` 0,
  `split-operator` 0. **No educational platform ships an HTML5 grid Schrödinger integrator.**
- **Falstad's applets: there is no scattering applet.** The agent extracted the full index. The set
  is `qm1d` (bound states only — its own directions say *"Only the bound states are shown in this
  applet"*), `qm1dcrystal`, `qm2dcrystal`, `qm2dbox` (2-D box, Gaussian packet by drag, box
  eigenstates, walls only), `qm2dcirc`, `qm2dosc`, `qm3dosc`, `qmrotator`, `qm1drad` (the only one
  with a live driving term), `qmatom` and `qmmo` (static 3-D viewers). Java originals hand-ported
  to JS by Bob Hanson's team; **2-D canvas, not WebGL, no GPU compute.**
- **Molecular Workbench's quantum engine never made it to the browser.** Quantum Workbench (Charles
  Xie) solved the TDSE as a Java plug-in, © 2004–2013. The HTML5 successor ("Lab") ships `md2d`,
  `energy2d`, sensors and a signal generator — **no quantum engine.** And Xie & Tinker, *J. Chem.
  Educ.* **83**(1), 77 (2006), DOI 10.1021/ed083p77, shows running-average concentrations
  converging for a 72-atom reactive MD system but **fits no rate constant** (the agent grepped the
  full PDF for "rate constant", "Arrhenius", "fit": nothing quantitative).

#### 3.2.5 Machine-learned potentials at interactive rates

No MLIP running in a browser was found at all. ONNX Runtime Web + WebGPU exists as generic
infrastructure but no MACE/ANI/AIMNet2 web deployment was located. Native-side speeds **[U]
snippet-only**: MACE-OFF23 ≈ 6.5 ns/day at ~200 atoms, 2.5 ns/day at ~1000; OrbMol, ANI and
standard AIMNet2 all **> 10 ms per inference**. AIMNet2 (*Chem. Sci.* **16**(23), 10228) claims
3–5× error reduction vs ANI-2x at similar cost; **ANI-1xBB** is an explicitly *reactive* ANI
variant. Reading: **~100 force calls/s natively for small systems — enough to be an interactive
felt force, not enough for long kinetics without coarse steps.**

### 3.2A The electron-dynamics route, measured

Gathered by a second agent that read source trees and run logs, not just abstracts. **These
numbers are why Rung 9 is not the road to kinetics.**

**Equations, verified verbatim.** The ChronusQ paper's eq (10) is the non-linear
Liouville–von Neumann equation `iℏ ∂_t P(t) = [F(P(t),t), P(t)]`; the *Chem. Rev.* 2020 review gives
the orthonormal form `i ∂P′/∂t = [H′(t), P′(t)]`. Propagators as printed: forward Euler
`ψ_{k+1} = exp(Δt H̃_k) ψ_k`; **exponential midpoint** `ψ_{k+1} = exp(Δt H̃_{k+1/2}) ψ_k` — *which is
exactly what `lab/modrive.js` already implements*; **MMUT** (leapfrog on a 2Δt stencil)
`P′_{k+1} = U_k P′_{k−1} U_k†`, `U_k = exp[−i·2Δt·H′_k]`, O(Δt²); **ETRS**
`φ(t) = e^{−i(Δt/2)Ĥ(t)} e^{−i(Δt/2)Ĥ(t−Δt)} φ(t−Δt)`, implicit, solved iteratively. Refs:
Goings, Lestrange & Li, *WIREs* **8**, e1341 (2017/18), DOI 10.1002/wcms.1341; Li, Govind, Isborn,
DePrince & Lopata, *Chem. Rev.* **120**(18), 9951–9993 (2020), DOI 10.1021/acs.chemrev.0c00223;
Williams-Young *et al.*, *"The Chronus Quantum software package"*, *WIREs* **10**, e1436 (2019/20),
DOI 10.1002/wcms.1436, arXiv:1905.01381; Castro, Marques & Rubio, *JCP* **121**, 3425 (2004),
DOI 10.1063/1.1774980 (ETRS); Gómez Pueyo, Marques, Rubio & Castro, *JCTC* **14**(6), 3040 (2018),
DOI 10.1021/acs.jctc.8b00197, arXiv:1803.02113.

**The timestep obeys the same spectral-range law my Chebyshev count does.** From exciting's
all-electron RT-TDDFT paper (Rodrigues Pela & Draxl, arXiv:2403.04351): `Δt_cr = f/(ε_max − ε_min)`
with `f = 0.2`. Conventional all-electron gives `Δt_cr = 0.0012 a.u.`; truncating the top of the
spectrum (N_empty = 5…100) gives `Δt_cr = 0.49, 0.45, 0.33, 0.26 a.u.` — **a 200× larger step for a
smaller model space.** ChronusQ's source default is `deltaT = 0.01` a.u.; its published H₂O/cc-pVTZ
X2C-B3LYP example uses `DELTAT = 0.05`. **This is the same fact that sets my iteration counts: the
cost of a propagation is governed by the spectral range of the discretised Hamiltonian, whether the
discretisation is a basis or a grid.**

**ChronusQ does Ehrenfest, and has no GPU path for it.** Verified in
[`github.com/xsligroup/chronusq_public`](https://github.com/xsligroup/chronusq_public): `job =
Ehrenfest`, test directories `tests/dynamics/{serial,parallel}/{bomd, ehrenfest, ehrenfest_giao,
bort-ehrenfest, d3}`, molecules HF/H₂/H₂O/HCN/CH₂O including nuclear–electronic-orbital variants
with quantum protons. `[DYNAMICS] DELTAT` is the nuclear step; `NELECPNUC` the electronic substeps;
`NNUCPGRAD` nuclear steps between gradients. `INTALG` ∈ {MMUT, MAGNUS2, RK4, BORT, FORWARDEULER}.
**Repo-wide grep: `cuda` → 0 paths, `magma` → 0 paths.** The only GPU switch is
`CQ_ENABLE_CUDA "Enable CUDA for GauXC" OFF` — GauXC is the XC quadrature library, used by 10
ground-state SCF tests. **The RT/Ehrenfest propagation itself has no GPU path.** Documenting papers:
Li, Tully, Schlegel & Frisch, *JCP* **123**, 084106 (2005), DOI 10.1063/1.2008258; Ding, Goings,
Liu, Lingerfelt & Li, *JCP* **143**, 114105 (2015), DOI 10.1063/1.4930985; Zhao *et al.*, *JCP*
**153**, 224111 (2020), DOI 10.1063/5.0031019. **Wall-clock per Ehrenfest step: [U] no published
figure found.**

**RT-DFTB is the fastest real electron propagation found, and it is 10⁹× slower than real time.**
Bonafé *et al.*, *JCTC* **16**(7), 4454–4469 (2020), DOI 10.1021/acs.jctc.9b01217,
arXiv:1912.03174. Equations, identical in paper eq (10) and the DFTB+ recipes page the Beta dossier
already cites:

    ρ̇ = −i(S⁻¹Hρ − ρHS⁻¹) − (S⁻¹Dρ + ρD†S⁻¹) ,   D_µν = ⟨φ_µ|φ̇_ν⟩ = ⟨φ_µ|∇_B φ_ν⟩·Ṙ_B

Integrator: **leapfrog** `ρ_{i+1} = ρ_{i−1} + 2Δt ρ̇_i`, seeded by one Euler step; nuclei by velocity
Verlet; three matrix–matrix products per step, O(N³) in basis orbitals. Stated stable step:
*"between 1–5 as"*. Measured from the recipes' own run log: **73-atom chlorophyll a, 0.0086–0.014 s
per propagation step, 20 000 steps in 185–218 s** (hardware unstated) — i.e. **≈ 70–115 propagation
steps per second, which would clear 60 fps.** But at Δt = 0.2 a.u. that is **≈ 0.5 fs of physical
time per wall-clock second: a real-time slowdown of order 10⁹.** The paper's own production run:
ZnTPP pump–probe, 4 Xeon E5-2670 cores, **600 000 steps = 6.5 hours (≈ 39 ms/step)**, each 40 000-step
probe **25 minutes**, and **24 000 probe runs = 4 days on 8 machines × 16 cores**. Largest system
discussed: 340 atoms. **No GPU or interactive DFTB+ electron-dynamics implementation found.**

**GPU RT-TDDFT, the state of the art in 2026.** ABACUS heterogeneous RT-TDDFT (arXiv:2603.21835v2,
3 Jun 2026), bulk Si 48→1200 atoms, TZDP, Crank–Nicolson, **NVIDIA A800 80GB**: at 1200 atoms **one
full time step ≈ 100 s on the GPU** vs > 300 s for the best CPU configuration (3–4×); the
propagation routine alone 30 s/step vs 180–220 s (6–7×). Ehrenfest steps tested Δt = 3…20 as with
total-energy drift below 2.5 meV. PWDFT hybrid-functional rt-TDDFT (arXiv:2501.03061): **3072 atoms
on 768 A100s, one time step = 429.3 s** on 192 nodes. GPU4PySCF (Li, Sun, Zhang & Chan, *JPCA*
**129**(5), 1459, 2025, DOI 10.1021/acs.jpca.4c05876): **ground-state** SCF on one A100 — Gly30
6-31G(d) 17.4 s vs 477.4 s; Gly100 6-31G(d) 172.8 s vs 7689 s (~44×). TeraChem: Seritan *et al.*,
*JCP* **152**, 224110 (2020), DOI 10.1063/5.0007615 — **[U] per-step timings paywalled.**

**Nothing in the literature claims interactive-rate quantum electron dynamics. Verified.** The
strongest genuine interactivity claim is *nuclear*: Luehr, Jin & Martínez, *"Ab Initio Interactive
Molecular Dynamics on Graphical Processing Units"*, *JCTC* **11**(10), 4536–4544 (2015),
DOI 10.1021/acs.jctc.5b00419 — TeraChem + VMD, *"minimum simulation rates below five MD steps per
second"*, *"systems containing up to a few dozen atoms"*, at **Hartree–Fock**. That is ≈ 5 steps/s —
**below 10 fps** — and the visual smoothness comes from interpolation.

**And the nonadiabatic-rate result that matters for Rung 8.** Lawrence, Mannouch & Richardson,
*"Recovering Marcus Theory Rates and Beyond without the Need for Decoherence Corrections: The
Mapping Approach to Surface Hopping"*, *J. Phys. Chem. Lett.* **15**(3), 707–716 (2024),
DOI 10.1021/acs.jpclett.3c03197, arXiv:2311.08802. Brownian-oscillator spin–boson electron
transfer, βΛ = 12, βℏΩ = 1/4, γ = Ω, symmetric βε = 0 and asymmetric βε = 3; the rate is taken from
the slope of ⟨P_p(t)⟩ **between t = 10βℏ and t = 20βℏ**; the reference is numerically exact **HEOM**.
Results: for log₁₀(βΔ) ≳ −0.75 MASH, FSSH and HEOM agree, with HEOM showing *"only a slight ~10%
enhancement due to shallow tunneling"*; **in the golden-rule/Marcus limit MASH continues to match
HEOM while FSSH "deviate[s] significantly with an unphysical slope"** — losing the Δ² scaling. The
mechanism is entirely **two-hop trajectories**, and *"the rate predicted by FSSH can be expected to
be up to a factor of 2 too small."* The alternative fix is Landry & Subotnik, *"How to recover
Marcus theory with fewest switches surface hopping: Add just a touch of decoherence"*, *JCP* **137**,
22A513 (2012), DOI 10.1063/1.4733675. Multi-state and review: Runeson & Manolopoulos, *JCP* **159**,
094115 (2023), DOI 10.1063/5.0158147; Lawrence, Mannouch & Richardson, *JCP* **160**, 244112 (2024),
DOI 10.1063/5.0208575; Richardson, Lawrence & Mannouch, *Annu. Rev. Phys. Chem.* **76**(1), 663–687
(2025), DOI 10.1146/annurev-physchem-082423-120631. Other decoherence refs: Granucci, Persico &
Zoccante, *JCP* **133** (2010), DOI 10.1063/1.3489004; Subotnik & Shenvi, *JCP* **134** (2011),
DOI 10.1063/1.3603448; Jain, Alguire & Subotnik, *JCTC* **12**(11), 5256 (2016),
DOI 10.1021/acs.jctc.6b00673.

**Ehrenfest's failure, in the authors' own words.** MASH: Ehrenfest *"is generally observed to
drastically violate detailed balance, and due to its inability to describe wavepacket branching,
simulations of chemical reactions form artificial product states."* DFTB+ recipes: *"The crossing of
conical intersections, for example, is where the approximation breaks down drastically."*
**Two independent sources, one of them the very implementation the Beta dossier cites for its
convention check, saying that the electron-dynamics route does not produce branching.**

### 3.2B Has anyone measured a rate from an interactive simulation? No.

A third agent searched this specifically and returned a **well-searched negative result.**

- The iMD-VR corpus measures **task completion time** (O'Connor *et al.*, *Sci. Adv.* **4**(6),
  eaat2731, 2018, DOI 10.1126/sciadv.aat2731), **docking RMSD** (Deeks *et al.*, *PLOS ONE* **15**(3),
  e0228461, 2020 — novices within 2.15 Å on HIV-1 PR, sim speed 4.45–4.51 ps/min wall time, *"no k,
  no free energy"*, with rate extraction flagged as future work), **reaction-network topology**
  (Shannon *et al.*, *JCP* **155**(15), 154106, 2021, DOI 10.1063/5.0062517 — 18 participants build a
  propyne + OH network, **no rates, no barriers**), and **MSD** (Crossley-Lewis *et al.*, *J. Mol.
  Graph. Model.* **125**, 108606, 2023).
- **The strongest hit still is not a rate.** Deeks *et al.*, *Sci. Rep.* **13**, 16665 (2023),
  DOI 10.1038/s41598-023-43523-x: VR unbinding paths seed a 6-D path collective variable → umbrella
  sampling → free-energy profile, refined by an adaptive string. Binding FE **−22.5 kcal/mol** vs
  experiment **−6.2** (implicit solvent blamed); unbinding barriers ≈ 25 kcal/mol. **No k_on, no
  k_off, and the free energy is computed post hoc, not live.**
- Searches for *"real-time Kramers rate measurement"*, a live friction/temperature/barrier slider
  with a rate readout, human-in-the-loop transition path sampling with an escape rate, and
  peer-reviewed WebGPU/browser MD that measures a rate: **all returned nothing.**

**Conclusion, and it is the single most actionable finding in this document:** *Rung 6 — a live
Langevin double well with a measured k(γ) plotted against the Kramers/PGH turnover curve — appears
to have no published precedent as an interactive tool.* That is a gap, not a crowded field, and it
is the cheapest rung on the ladder [C: 1.6 ms/frame].

**The conventions Rung 6 must respect, verified by that agent:**
- **k from residence time.** Tiwary & Berne, *JCP* **144**(13), 134103 (2016), DOI 10.1063/1.4944577,
  arXiv:1602.06588, verbatim: *"The rate was calculated as ν = 1/⟨t⟩ where ⟨t⟩ is the average
  residence time in either of the basins. To filter out spurious recrossing events, we used a
  minimum residence time criterion of 10⁴ time units, or 2×10⁵ integration steps, to count a
  transition event as successful."* Langevin, timestep 0.05, **11 values of γ**, the De Leon & Berne
  two-state potential (*JCP* **75**, 3495, 1981), Bussi–Parrinello thermostat (*PRE* **75**, 056707,
  2007). **It reproduces the turnover.** This is the reference implementation for Rung 6.
- **The factor of ½, and its condition.** Pollak & Talkner, *Chaos* **15**(2), 026116 (2005),
  DOI 10.1063/1.1858782, verbatim: *"In simple cases, the effect of recrossings can be incorporated
  in the rate resulting from a mean first passage time by a numerical factor which is 1/2 if the
  separating surface coincides with the so-called stochastic separatrix"* — followed immediately by
  *"In general, however, there is no easy way to infer the true rate from a mean first passage
  time."* **The ½ is conditional on the stochastic separatrix, not merely the barrier top. A rung
  that applies it unconditionally is wrong, and this is a falsifier.**
- **Turnover theory and its numerical benchmark.** Pollak, Grabert & Hänggi, *JCP* **91**(7),
  4073–4087 (1989), DOI 10.1063/1.456837; Mel'nikov & Meshkov, *JCP* **85**(2), 1018 (1986),
  DOI 10.1063/1.451844; Straub, Borkovec & Berne, *JCP* **84**(3), 1788 (1986), DOI 10.1063/1.450425
  (the simulation-vs-turnover-theory benchmark reproduced as Fig. 19 of the Hänggi review), and
  Berne, Borkovec & Straub, *J. Phys. Chem.* **92**(13), 3711 (1988), DOI 10.1021/j100324a007.
- **Recommended integrator: BAOAB Langevin** walkers with residence-time counting, sweeping γ.
- **Cheapest exact quantum rate for an instrument:** Seideman–Miller eq. (2.13b) — *one complex
  matrix inverse per energy.* That is a serious alternative to Rung 3's propagation for the N(E)
  curve and should be costed before Rung 3 is built.

**[U] Items that agent could not verify and which must not enter a build contract unchecked:**
Eckart's δ parameter; four numerators in the Hänggi–Talkner–Borkovec review lost to OCR; the
τ-leaping update formula; Vega, Guantes & Miret-Artés, *PCCP* **4**(20), 4985 (2002); the Nitzan
textbook's §14.4.x numbering. A follow-up request for that agent's full items 1–6 was issued and
had not returned when this memo was written.

### 3.3 The "never been done" claim, stated honestly

**This is the section to read before any public statement. The claim as posed — "this has never been
done in such an instrument" — does not survive contact with the literature in its strong form, and
it does not need to.** Four things must be separated.

**1. What is emphatically NOT novel, and each of these has a named owner.**

- **"Real-time quantum chemistry" is a coined term with a claimed inventor and a 13-year lineage.**
  Haag & Reiher, arXiv:1208.3717 (2012) → *Int. J. Quantum Chem.* **113** (2013), through SCINE and
  Heron (2024) — whose own description includes *"microkinetic modeling"*, i.e. **Rung 10, already
  shipped inside an interactive GUI by someone else.** *Do not claim to have invented real-time
  reactive quantum chemistry.*
- **Live human-driven bond breaking on a genuine quantum surface: published 2019** (Amabilino,
  Bratholm, Bennie, Vaucher, Reiher & Glowacki, *JPCA* **123**(20), 4486). **The physics claim is
  taken.**
- **Chemistry-as-an-instrument, with sonification, at a 60 FPS target, with multiple people
  modulating a running simulation: published 2014** (danceroom Spectroscopy, *Faraday Discuss.*
  **169**, 63). **The instrument framing is taken. Only its engine was classical.**
- **Interactive classical MD is mature**: Narupa (2019) → NanoVer (2026), in VR and XR, shipped to
  the Meta Horizon Store, with published teaching studies.
- **Client-side quantum chemistry on WebGPU already exists** (webgpu-q, repo created 2026-05-04;
  GANSU-Lite, 2026-04-25) — HF through CCSD(T) in WGSL, PySCF-checked, one of them *claiming* live
  SCF recomputation as you drag a molecule. Solo, unpublished, 2–3 stars. **Be first to cite them,
  not first to claim their ground.**
- **GPU 2-D time-dependent Schrödinger in a browser with user-drawn potentials is solidly
  precedented** — marl0ny's WebGL split-operator/Crank-Nicolson simulator (plus 2-particle and
  Dirac versions), Demidov's WebGL2 Crank-Nicolson on a 256² grid, Mikaberidze's paint-the-potential
  playground. **Rungs 2 and 3's engineering is not novel.**
- **Collinear H + H₂ on a LEPS surface** was being used as the canonical minimal reactive system as
  recently as 2026 (*Entropy* **28**(2), 144). **Rung 3's physics is not novel.**

**2. What is weaker than folklore assumes, and this is genuinely useful.** No educational platform
ships an HTML5 grid Schrödinger integrator. PhET's "Quantum Bound States" was **never published**;
"Quantum Tunneling and Wave Packets" and "Reactions & Rates" are 2016 Java sims run through
CheerpJ; the brand-new HTML5 "Quantum Wave Interference" (shipped 2026-09-10, the day before this
memo) is an **analytic Gaussian/Fresnel kernel with exactly two barrier types** — grep of its
shipped bundle finds zero hits for `Schr`, `propagator`, `Crank` or `split-operator`. **PhET's
"Reactions & Rates" is a cartoon**: classical 2-D collisions plus a hand-drawn reaction-coordinate
diagram, no computed surface, no quantum mechanics. Falstad has **no scattering applet at all** —
`qm1d` says in its own directions *"Only the bound states are shown in this applet"*. Molecular
Workbench's quantum engine never made it to the browser, and its own *J. Chem. Educ.* paper shows
converging concentrations but **fits no rate constant**. **The entire "browser chemical kinetics"
niche is, to date, cartoon-only.**

**3. What appears genuinely unoccupied.** Three things, and the first two are the ones with
evidence behind them:

- **(a) No one has measured a rate constant from an interactive simulation.** A dedicated agent
  searched this specifically and returned a well-searched negative. The iMD-VR corpus measures task
  completion time, docking RMSD, reaction-network topology and MSD. Its strongest result (Deeks
  *et al.*, *Sci. Rep.* **13**, 16665, 2023) computes a **free-energy profile post hoc** from
  VR-seeded paths and explicitly reports **no k_on, no k_off**. Searches for a live
  friction/temperature/barrier control with a rate readout, for human-in-the-loop path sampling with
  an escape rate, and for peer-reviewed browser MD that measures a rate all returned **nothing**.
  **Rung 6 — a live Langevin double well with a measured k(γ) graded against the Kramers/PGH
  turnover — appears to have no published precedent as an interactive tool. It is also the cheapest
  rung on the ladder [C: 1.6 ms/frame for 10⁵ walkers].**
- **(b) No MLIP has been found running in a browser at all.** ONNX Runtime Web + WebGPU exists as
  generic infrastructure; no MACE/ANI/AIMNet2 web deployment was located.
- **(c) A modulation rack — LFOs, envelopes, routable continuous automation — driving Hamiltonian or
  thermodynamic parameters of a chemical simulation. Zero prior art was found, in any medium.**
  That is new because of λWAVES's rack, not because of the chemistry.

**4. The sentence to actually say.** Both agents that looked at this independently converged on
roughly the same shape, and it is stronger than the strong claim because it survives scrutiny:

> *Interactive quantum chemistry (Reiher 2013–, Martínez 2015–2022), human-driven reactive ab initio
> dynamics (Glowacki 2019), and chemistry-as-audiovisual-instrument (Glowacki 2014) each exist
> separately, and browser-native quantum chemistry appeared in 2026 (webgpu-q, GANSU-Lite). We know
> of no instrument that closes the loop: reactive kinetics — a reaction probability, a cumulative
> reaction probability, a measured or computed rate constant — read out live from a quantum surface,
> in a browser, with a modulation rack as the control surface.*

**Caveats to carry with that sentence, honestly.** (i) This session's WebSearch budget (200 calls)
was exhausted; two specific questions closed as **NOT FOUND, not disproven**: whether NanoVer has
ever been coupled to a trained MLIP in the live loop, and whether any browser app measures a rate.
(ii) The webgpu-q live-drag behaviour is **claimed-by-site, not executed**. (iii) The novelty is in
the *intent and the interface*, not in the physics or the achievability — which is a much better
claim to defend, because [C] the arithmetic says the achievability is not in doubt.

## 4. WHAT "SIMULATING CHEMICAL KINETICS IN REAL TIME ON A CONSUMER GPU" CAN AND CANNOT MEAN BY 2027

**It can mean this.** On an RTX 3070, a two-coordinate quantum wavepacket on a real fitted
potential-energy surface, propagated by a damped real-Chebyshev recursion, yielding a converged
reaction probability at *every* collision energy from a single run in about one display frame
[C: 15.2 ms at 256²]. From that curve: a threshold, resonances, the tunnelling tail below the
barrier, a cumulative reaction probability, a thermal rate constant, an Arrhenius plot with
visible curvature, and an apparent activation energy — all recomputed as a rack lane sweeps
temperature or isotope mass. Alongit: 10⁵ Langevin trajectories crossing a barrier live at
1.6 ms/frame [C], a *measured* rate, and a Kramers turnover curve to grade the measurement
against. Alongside that: Landau–Zener, Tully's three models with the exact split-operator answer
computed in the same frame, and a Gillespie layer turning any of those rate constants into
concentrations you can watch change. Every number in that list has an independent oracle named in
§1, and one of them I verified to nine significant figures this afternoon. **That is real
chemical kinetics, honestly labelled, in real time, on a consumer GPU, and it is reachable.**

**It cannot mean this.** It cannot mean a molecule of interesting size reacting on an ab initio
surface computed on the fly. The three-dimensional J = 0 calculation for the *simplest possible
reaction* — three hydrogen atoms, one electronic state — is [C] seconds per energy curve and
[C] minutes for a converged thermal rate over partial waves, and that is with the surface already
fitted; the fit itself took 8701 ab initio points and a published paper [V]. Scaling to four atoms
multiplies the grid by another coordinate and the effort by another PhD. It cannot mean rates for
a reaction the instrument has not been given a surface for: **there is no such thing as a
first-principles barrier that appears from nowhere at 60 fps.** It cannot mean branching ratios
from a single Ehrenfest trajectory — mean-field dynamics does not branch, and the dossier's own
R11 and MASH's abstract both say so. It cannot mean solvent, or condensed phase, or a real
mechanism with competing channels, from anything on this ladder below Rung 10, and Rung 10 only
*consumes* rate constants — it does not discover them. And it cannot mean that the Wigner
correction, or TST, or any single closed form, is the rate: [C] I measured the Wigner correction
to be wrong by a factor of 448 at 200 K for a perfectly ordinary 1690 cm⁻¹ barrier.

And it cannot mean that the electron-dynamics route gets there. **[V]** The fastest published
real-time electron propagation is RT-DFTB at 0.0086–0.014 s per step for 73 atoms — which clears
60 fps and is nevertheless **a real-time slowdown of order 10⁹**, because a stable step is 1–5
attoseconds. Its own production run took 6.5 hours for 600 000 steps and four days for its
trajectory ensemble on 128 cores. The state of the art on GPUs in 2026 is **one Crank–Nicolson
RT-TDDFT time step per ≈ 100 seconds for 1200 silicon atoms on an A800**, and 429 s per step for
3072 atoms on 768 A100s. ChronusQ implements Ehrenfest and **has no GPU path for it**. Nothing in
the literature claims interactive-rate quantum electron dynamics, and the strongest genuine
interactivity claim in the whole field is *nuclear* motion at **below five MD steps per second** for
a few dozen atoms at Hartree–Fock. **Even if all of that were free, it would still not produce a
rate, because mean-field dynamics does not branch — a fact stated by MASH's authors and by the
DFTB+ documentation the Beta dossier already cites.**

**The one thing that could change this picture by 2027** is a machine-learned reactive potential
running in the instrument — a small MACE/ANI-class model evaluated on the GPU, giving forces on a
reactive surface for tens of atoms at interactive rates, with Rung 6's Langevin machinery or
Rung 7's ring polymers on top. **[U] The native-side numbers are snippet-grade but sobering:**
MACE-OFF23 ≈ 6.5 ns/day at ~200 atoms, and ANI/AIMNet2/OrbMol all report **> 10 ms per inference**,
i.e. ~100 force calls per second — enough to be an interactive felt force, not enough for long
kinetics without coarse steps. No MLIP has been found running in a browser at all. **ANI-1xBB is an
explicitly reactive ANI variant and is the obvious first candidate.** That is the only credible
route from "three hydrogen atoms" to "a reaction a chemist cares about" at frame rate. It is
Rung 11, it is genuinely research, and its own honest label would be *"a learned surface, with its
training domain declared and its extrapolation refused"* — which is precisely the discipline the
Beta dossier already applies to its benzene surrogate. **The instrument's existing intellectual
habits transfer to the horizon rung exactly. Its code does not.**

---

## Appendix A — the computations in this document

Three scripts, all pure `node`, no dependencies. They were written and run in `/tmp` during this
session, **and their full source is inlined below** because that `/tmp` will be wiped, the numbers in
§1 depend on them, and no number in this document should be un-recheckable. Save each block and run
`node <file>` to reproduce every `[C]` figure in this memo.

> **Reproduce-everything one-liner** (from a scratch directory, after saving the three blocks):
> `for f in eckart_check.mjs kappa_check.mjs cost.mjs; do echo "== $f"; node $f; done`

### A.1 `eckart_check.mjs` — the verified analytic oracle

Compares the closed-form sech² transmission coefficient against Numerov integration of
ψ″ = 2m(V−E)ψ with an outgoing wave on the right, solving a 2×2 complex system on the left for
the incident amplitude A and returning T = 1/|A|². Grid: 800 001 points over x ∈ [−80, 80] a₀.
Parameters m = 1060, V_b = 0.0154 E_h, L = 0.7 a₀, giving 8mV_bL² = 63.99.
**Result: agreement to 9 significant figures across E/V_b ∈ [0.3, 2.0]** (table in §1 Rung 1).
This same formula is Seideman & Miller eq. (3.2) and these are essentially their test parameters.

```js
/* Symmetric Eckart (sech^2) barrier, atomic units hbar = 1.
   V(x) = Vb sech^2(x/L).  Closed form:  P(E) = sinh^2(pi k L) / ( sinh^2(pi k L) + cosh^2((pi/2)sqrt(8 m Vb L^2 - 1)) )
   Checked against Numerov integration of psi'' = 2m(V-E)psi with an outgoing wave on the right. */
const sinh=Math.sinh, cosh=Math.cosh, PI=Math.PI;
function Panalytic(E,Vb,L,m){const k=Math.sqrt(2*m*E),s=8*m*Vb*L*L,a=Math.sqrt(Math.abs(s-1));
  const num=sinh(PI*k*L)**2, extra = s>1 ? cosh(0.5*PI*a)**2 : Math.cos(0.5*PI*a)**2;
  return num/(num+extra);}
function Pnumerov(E,Vb,L,m,xmax=80,N=800001){
  const h=-2*xmax/(N-1), k=Math.sqrt(2*m*E);
  const X=i=>xmax+i*h;
  const f=i=>{const x=X(i),V=Vb/cosh(x/L)**2;return 1+(h*h/12)*(2*m*(E-V));};
  let pr=[Math.cos(k*X(0)),Math.cos(k*X(1))], pi=[Math.sin(k*X(0)),Math.sin(k*X(1))];
  let fm=f(0), f0=f(1), r0=pr[0], i0=pi[0], r1=pr[1], i1=pi[1], r2, i2;
  for(let n=1;n<N-1;n++){const fp=f(n+1);
    r2=((12-10*f0)*r1-fm*r0)/fp; i2=((12-10*f0)*i1-fm*i0)/fp;
    r0=r1;i0=i1;r1=r2;i1=i2;fm=f0;f0=fp;
    if(!isFinite(r1)||Math.abs(r1)>1e250){const s=1e-250;r0*=s;i0*=s;r1*=s;i1*=s;}
  }
  // last two points: x=X(N-2), X(N-1) on the left; psi = A e^{ikx} + B e^{-ikx}
  const xa=X(N-2), xb=X(N-1);
  // solve 2x2 complex system for A
  const e=(x,s)=>[Math.cos(s*k*x),Math.sin(s*k*x)];
  const [a1r,a1i]=e(xa,1),[b1r,b1i]=e(xa,-1),[a2r,a2i]=e(xb,1),[b2r,b2i]=e(xb,-1);
  const cm=(ar,ai,br,bi)=>[ar*br-ai*bi,ar*bi+ai*br];
  const detv=(()=>{const p=cm(a1r,a1i,b2r,b2i),q=cm(b1r,b1i,a2r,a2i);return [p[0]-q[0],p[1]-q[1]];})();
  // psi at xa = r0,i0 ; at xb = r1,i1   (r0/i0 correspond to index N-2)
  const p1=[r0,i0], p2=[r1,i1];
  const numA=(()=>{const p=cm(p1[0],p1[1],b2r,b2i),q=cm(b1r,b1i,p2[0],p2[1]);return [p[0]-q[0],p[1]-q[1]];})();
  const den=detv[0]*detv[0]+detv[1]*detv[1];
  const Ar=(numA[0]*detv[0]+numA[1]*detv[1])/den, Ai=(numA[1]*detv[0]-numA[0]*detv[1])/den;
  return 1/(Ar*Ar+Ai*Ai);
}
const m=1060.0, Vb=0.0154, L=0.7;
console.log('8 m Vb L^2 =', 8*m*Vb*L*L);
console.log('    E/Vb        E (Eh)      P analytic       P Numerov     rel diff');
for(const r of [0.3,0.5,0.7,0.9,1.0,1.1,1.5,2.0]){
  const E=r*Vb, pa=Panalytic(E,Vb,L,m), pn=Pnumerov(E,Vb,L,m);
  console.log(r.toFixed(2).padStart(8), E.toExponential(6).padStart(14), pa.toExponential(8).padStart(16), pn.toExponential(8).padStart(16), (Math.abs(pa-pn)/pa).toExponential(2).padStart(10));
}
```

### A.2 `kappa_check.mjs` — the tunnelling correction and its falsifier

Computes κ(T) = e^{βV_b} β ∫₀^∞ P(E) e^{−βE} dE by trapezoid on 400 001 points out to
V_b + 60 k_BT, and compares with κ_W = 1 + (1/24)(ω_b/k_BT)² where ω_b = √(2V_b/m)/L.
**Result: ω_b = 0.007701 E_h = 1690.1 cm⁻¹, T_c = 387.0 K, and the ratio κ/κ_W runs from 447.5 at
200 K to 1.035 at 1500 K** (table in §1 Rung 1) — independently reproducing the literature's stated
βħω ≪ 2π validity limit for κ_W. **Extension worth making before this becomes a build: add the third
curve κ_PB = (βħω/2)/sin(βħω/2), which is exact for a parabolic barrier and diverges at T_c.**

```js
/* Tunnelling correction kappa(T) for the symmetric sech^2 (Eckart) barrier, from the VERIFIED P(E),
   compared with the Wigner correction.  Atomic units; kB = 3.166811563e-6 Eh/K. */
const kB=3.166811563e-6, PI=Math.PI, sinh=Math.sinh, cosh=Math.cosh;
function P(E,Vb,L,m){const k=Math.sqrt(2*m*Math.max(E,0)),s=8*m*Vb*L*L,a=Math.sqrt(Math.abs(s-1));
  const num=sinh(PI*k*L)**2, extra=s>1?cosh(0.5*PI*a)**2:Math.cos(0.5*PI*a)**2; return num/(num+extra);}
/* kappa = e^{beta Vb} * beta * int_0^inf P(E) e^{-beta E} dE   (classical rate integral has step at Vb) */
function kappaQ(T,Vb,L,m){const b=1/(kB*T); const Emax=Vb+60/b; const N=400000, h=Emax/N; let s=0;
  for(let i=0;i<=N;i++){const E=i*h, w=(i===0||i===N)?0.5:1; s+=w*P(E,Vb,L,m)*Math.exp(-b*E);} s*=h;
  return Math.exp(b*Vb)*b*s;}
const kappaWigner=(T,Vb,L,m)=>{const wb=Math.sqrt(2*Vb/m)/L; return 1+(1/24)*(wb/(kB*T))**2;};
const m=1060.0, Vb=0.0154, L=0.7;
const wb=Math.sqrt(2*Vb/m)/L;
console.log('barrier omega_b =', wb.toFixed(6), 'Eh  =', (wb*219474.63).toFixed(1), 'cm^-1');
console.log('crossover T_c = hbar omega_b/(2 pi kB) =', (wb/(2*PI*kB)).toFixed(1), 'K');
console.log('     T(K)   kappa exact   kappa Wigner   ratio');
for(const T of [200,250,300,400,500,700,1000,1500]){
  const ke=kappaQ(T,Vb,L,m), kw=kappaWigner(T,Vb,L,m);
  console.log(String(T).padStart(9), ke.toFixed(4).padStart(13), kw.toFixed(4).padStart(14), (ke/kw).toFixed(4).padStart(8));
}
```

### A.3 `cost.mjs` — the frame-budget model

Hardware constants: 448 GB/s memory bandwidth, 20 TFLOP/s FP32 peak, **25% of peak assumed
achievable for a stencil kernel**. For each rung it computes flops and bytes per Hamiltonian
application and reports the larger of the bandwidth-bound and flop-bound times, plus the
Chebyshev iteration count from N_iter ≳ ΔE·T with ΔE the scaled half-range derived from the grid
spacing and the reduced masses (μ_r = m_H/2, μ_R = 2m_H/3, m_H = 1.007825035 × 1822.888486).
Assumptions that a reviewer should attack: (i) 25% of peak; (ii) 13-point stencils, 12th order;
(iii) five array touches per apply; (iv) T = 20 000 a.u. total propagation time; (v) a 20 Å box,
which is MADWAVE3's 3-D choice and is over-generous for the collinear problem. **Every number in
the cost tables of §1 comes from this script, and the honest caveat is Smith/Cooke/LeBlanc's
measured result [V] that at grids this small the GPU is dispatch-bound, not arithmetic-bound: the
real engineering question is how many Chebyshev applies can be batched into one WebGPU command
buffer, and nothing in this document measures that.** That measurement — a WGSL stencil kernel, a
batched command buffer, and a wall-clock number — is the single cheapest thing that would either
confirm or destroy the whole cost case in §1, and it should be the first thing K2 does.

```js
/* Cost model for grid quantum dynamics in the lambdaWAVES instrument, atomic units.
   Hardware anchor: RTX 3070 — 448 GB/s memory bandwidth, ~20 TFLOP/s FP32 peak (spec).
   We report BOTH a bandwidth-bound and a flop-bound estimate; the larger governs. */
const BW = 448e9, FLOPS_PEAK = 20e12, FLOPS_EFF = 0.25*FLOPS_PEAK; // 25% of peak for a stencil kernel
const amu = 1822.888486;
const mH = 1.007825035*amu, mD = 2.014101779*amu;

function spectralRange({Lr, Nr, mu_r, LR, NR, mu_R, Vcut}) {
  const dr = Lr/(Nr-1), dR = LR/(NR-1);
  const kr = Math.PI/dr, kR = Math.PI/dR;
  const Tmax = kr*kr/(2*mu_r) + kR*kR/(2*mu_R);
  return { dr, dR, Emax: Tmax + Vcut, Emin: -0.0, half: (Tmax+Vcut)/2 };
}
const eV = 1/27.211386245988, ang = 1/0.529177210903;

// ---- Rung: 2D collinear H + H2, mass-scaled (x,y) or bond coords (r1,r2)
// reduced masses: H2 vibration mu = mH/2 ; H relative to H2 mu = mH*2mH/(3mH) = 2mH/3
const mu_r = mH/2, mu_R = 2*mH/3;
for (const N of [128, 256, 512]) {
  const g = spectralRange({Lr: 20*ang, Nr: N, mu_r, LR: 20*ang, NR: N, mu_R, Vcut: 2.5*eV});
  // real-wavepacket Chebyshev: one H-apply per iteration.
  // H-apply with an order-2p finite-difference stencil in each of 2 dims:
  const p = 6;                                  // 12th-order: 13-point stencil per dim
  const pts = N*N;
  const flopsPerPoint = 2*(2*p+1)*2 + 6;        // 2 dims x (mul+add) + potential + Chebyshev recursion
  const flops = pts*flopsPerPoint;
  // real arrays (Float32): read psi_k, psi_{k-1}, V, damping; write psi_{k+1}
  const bytes = pts*4*5;
  const tBW = bytes/BW, tFL = flops/FLOPS_EFF, t = Math.max(tBW, tFL);
  // physical time reach: N_iter Chebyshev orders ~= dE * T  (T in a.u.)
  const T_au = 20000;                            // ~0.48 ps, enough for H+H2 at J=0
  const nIter = Math.ceil(g.half*T_au);
  console.log(`2D collinear N=${N}: dr=${g.dr.toFixed(4)} a0  Emax=${(g.Emax*27.2114).toFixed(2)} eV  half dE=${g.half.toFixed(4)} Eh`);
  console.log(`   per Chebyshev apply: ${(flops/1e6).toFixed(2)} MFLOP, ${(bytes/1e6).toFixed(2)} MB -> ${(t*1e6).toFixed(1)} us (BW ${(tBW*1e6).toFixed(1)}, FL ${(tFL*1e6).toFixed(1)})`);
  console.log(`   iterations for T=${T_au} a.u. (${(T_au*2.4188843265e-17*1e15).toFixed(0)} fs): ${nIter}`);
  console.log(`   whole propagation: ${(nIter*t*1e3).toFixed(1)} ms  => ${(1/(nIter*t)).toFixed(2)} full P(E) curves per second`);
  console.log(`   iterations inside one 16.7 ms frame: ${Math.floor(0.0167/t)}`);
  console.log();
}

// ---- Rung: 3D J=0, MADWAVE3 reference grid 256 x 256 x 140
{
  const Nr=256, NR=256, Ng=140, pts=Nr*NR*Ng;
  const p=6;
  const flopsPerPoint = 2*(2*p+1)*2 + Ng*2/Ng + 8 ;   // radial stencils + potential + Chebyshev
  const angular = pts*Ng*2;                             // dense Legendre/DVR in gamma: Ng^2 per (r,R)
  const flops = pts*flopsPerPoint + angular;
  const bytes = pts*4*5;
  const tBW=bytes/BW, tFL=flops/FLOPS_EFF, t=Math.max(tBW,tFL);
  const g = spectralRange({Lr:20*ang,Nr,mu_r,LR:20*ang,NR,mu_R,Vcut:2.5*eV});
  const nIter = Math.ceil(g.half*20000);
  console.log(`3D J=0 grid 256x256x140 = ${(pts/1e6).toFixed(2)} M points`);
  console.log(`   per apply: ${(flops/1e9).toFixed(2)} GFLOP, ${(bytes/1e6).toFixed(0)} MB -> ${(t*1e3).toFixed(2)} ms (BW ${(tBW*1e3).toFixed(2)}, FL ${(tFL*1e3).toFixed(2)})`);
  console.log(`   ${nIter} iterations => ${(nIter*t).toFixed(1)} s for one J=0 P(E) curve`);
  console.log(`   VRAM for 4 real Float32 arrays: ${(pts*4*4/1e6).toFixed(0)} MB`);
  console.log(`   partial-wave sum to J=30 (31 J's, no Omega expansion): ${(31*nIter*t/60).toFixed(1)} min`);
  console.log();
}

// ---- Rung: Tully / Landau-Zener, 1D two-state exact split-operator
{
  const N=2048, states=2, pts=N*states;
  const bytes = pts*8*2*3;              // complex128-ish: use complex64 -> 8 bytes
  const flops = pts*(2*Math.log2(N)*5 + 20);
  const tBW=bytes/BW, tFL=flops/FLOPS_EFF;
  console.log(`Tully 1D two-state, N=${N} per state: ${(Math.max(tBW,tFL)*1e9).toFixed(0)} ns per split-operator step (bandwidth floor)`);
  console.log(`   in practice dispatch-bound; thousands of steps per frame are free.`);
  console.log();
}

// ---- Rung: Langevin double well, GPU ensemble
{
  const walkers=1e5, stepsPerFrame=2000;
  const flops = walkers*stepsPerFrame*40;
  const bytes = walkers*stepsPerFrame*4*4;
  console.log(`Langevin ensemble: ${walkers} walkers x ${stepsPerFrame} steps/frame = ${(walkers*stepsPerFrame/1e6).toFixed(0)} M steps`);
  console.log(`   ${(flops/1e9).toFixed(1)} GFLOP/frame -> ${(flops/FLOPS_EFF*1e3).toFixed(1)} ms flop-bound; state fits in ${(walkers*4*4/1e6).toFixed(1)} MB (register/L2 resident, no per-step traffic)`);
}
```

---

## Appendix B — the standing hazards this ladder must respect

Carried forward from the Beta dossier, because every one of them applies verbatim to a kinetics rung:

1. **§6:** an unsupported capability returns a typed reason, never a zero. A rung that cannot
   produce a rate must say so, not return 0.
2. **§12:** one energy functional, one force definition, finite differences as the oracle. A
   Langevin rate measured on one surface and a TST rate computed from another is two models, and
   must be labelled as two.
3. **§12:** *"For a prescribed external field, record work; for damping, record dissipated
   energy."* Rung 6's thermostat is dissipative by construction — the energy ledger must show it.
4. **§26/§27:** every rung above has a named independent oracle and a named falsifier. None may
   be marked complete because its UI exists.
5. **§31:** *"reliable chemical reaction barriers"* is currently an explicit non-goal. Adding the
   K wave means amending §31 deliberately, with the domain of each rung stated — not letting the
   non-goal erode silently.
6. **New hazard specific to this ladder:** BKMP2 has **no stated licence**. Treat redistribution
   exactly as dossier §15 treats DFTB parameters: a decision gate, not an assumption. MADWAVE3 and
   its H₃ surface are GPL-3.0, which is a *different* and equally consequential decision for a
   permissively-licensed instrument.
