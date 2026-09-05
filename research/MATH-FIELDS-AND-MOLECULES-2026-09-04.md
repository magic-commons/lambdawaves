# MATH · FIELDS AND MOLECULES · 2026-09-04

**Josh, verbatim (2026-09-04):** "Maths round eh?? I've been waiting for this. I've been using the app and the power of
this app is a lot more powerful than I thought it was. … the most peculiar thing of all is that 3-lobed object just
from adding different state... we can definitely try to push for a more general molecular orbital theory model!! We
have to think hard about integration of other atoms or a theorem about generalization of structures/momentum/position
of valence orbitals. (since orbits are faster near the center than on the outside). This gives the user less freedom
to control eigenstates and then becomes a dynamics/param rate-dynamics based on real physics on classical
electrostatics. Ultrathink for the math for this one! Also all the math you also have in queue so that we can deepen
all the topics." And: "Also research all the latest frontier research online about quantum waves/MO Theory and field
influence dynamics."

**Evidence used.** The two screencasts of 2026-09-04 (10:54, 12:05): the four-channel state 2p₋1 + 2p₊1 + 4p₋1 + 4d₊2
on DARK, the three-lobed spiral. The lab's own modules: `lab/hydrogen.js` (psiAt, BASIS), `lab/molecule.js`
(`energies(R)`: S, J, K, Eg, Eu), `lab/helium.js` (Hylleraas −2.90243), `lab/state.js` (the A/B Rabi mix),
`lab/cornell.js` (the tabulated-radial kernel branch, space 6). Probes under `research/probes-fields/` (P1–P4),
run 2026-09-04; every number below is theirs. The literature digest is being written separately as
`research/LIT-FIELDS-AND-MOLECULES-2026-09-04.md`.

The library law holds: every claim carries KNOWN (citable) · DERIVED-HERE · REFUTED · UNVERIFIED.

---

## ROUND 1 · FABLE

### Thread C first — the three lobes (because it is a theorem, and it is the one Josh saw)

**C.1 (DERIVED-HERE, proved by P1).** For a register state Σ c_a ψ_a with ψ_a ∝ e^{i m_a φ}, the density on any circle
of fixed (r, θ) is a trigonometric polynomial whose harmonics are exactly the pairwise differences |m_a − m_b|:
ρ(φ) = Σ_a |c_a ψ_a|² + 2 Σ_{a<b} |c_a c_b ψ_a ψ_b| cos((m_a − m_b) φ − (E_a − E_b) t + δ_ab). The pure pair
4d₊2 + 2p₋1 has |Δm| = 3 and **exactly three maxima in φ** — P1 finds 3 at r = 3 and r = 6, with the only nonzero
harmonic k = 3 (0.342 and 0.797 of the mean). Josh's four-channel state has the harmonics {0, 1, 2, 3}: at t = 0
with equal real amplitudes the 2-fold (2p₋1 × 2p₊1) dominates (0.955), the 3-fold (4d₊2 × 2p₋1, 4d₊2 × 4p₋1) sits
at 0.17–0.44 — and P1 counts 2 maxima there. The three lobes he filmed are the 3-fold term winning at the amplitudes
and time he had.

**C.2 (DERIVED-HERE).** Each harmonic is a rigid pattern that ROTATES: the (a, b) term is cos(k φ − ΔE t + δ) with
k = m_a − m_b, so the k-lobed pattern turns at angular velocity Ω_ab = (E_a − E_b)/(m_a − m_b). Same-shell pairs
(the 2p₋1 × 2p₊1 two-fold, ΔE = 0) stand still; cross-shell pairs turn. For 4d₊2 × 2p₋1: ΔE = 3/32, Ω = 1/32 rad
per a.u. → one turn every 201 a.u. That is the spiral in the video: a standing 2-fold under a turning 3-fold.
*Gate:* rotate the clock by 201 a.u. and the 3-lobed pattern returns to itself; by 100.5 it has turned by π.

**C.3 (DERIVED-HERE, P1).** "Orbits are faster near the centre": the probability current of an eigenstate |nlm⟩ is
azimuthal with speed v_φ = j_φ/ρ = m/(r sin θ), exactly — P1 measures 1.000, 0.500, 0.250, 0.125 at ρ = 1, 2, 4, 8
for 2p₊1. Faster inside like a planet (Kepler's v ∝ r^{−1/2} for circles; here v ∝ ρ^{−1}, a vortex line on the axis).
The phase rates |E_n| = 1/2n² are 0.500, 0.125, 0.056, 0.031, 0.020, 0.014 for n = 1…6 and the classical Kepler
frequencies 1/n³ are 1, 0.125, 0.037, 0.016, 0.008, 0.005: the correspondence E_{n+1} − E_n ≈ 1/n³ is exactly what
the SPECTRUM's beat frequencies are. (KNOWN: Bohr's correspondence principle.)

### Thread A — the classical field of the register's charge

**A.1 (KNOWN; the near-zone criterion, P2).** The stage is ±16 a₀. The longest-period transition the register can
radiate strongly is Lyman-α, ω = 3/8, λ = 2πc/ω = 2296 a₀ (c = 137.036): **λ/stage ≈ 144**. Within the stage the
electromagnetic field of the atom is the QUASI-STATIC field of its instantaneous charge and current: E = −∇Φ[ρ],
B = the Biot–Savart field of the probability current j = Im(ψ*∇ψ), retardation negligible to one part in 144
(and the magnetic field is smaller than the electric by α² v² ~ 10⁻⁵). There is no "wave" to draw on the stage —
what there is, exactly, is the electrostatic potential of |ψ|² and the field lines of j. A far-field view (Thread B)
is a separate, scaled picture.

**A.2 (DERIVED-HERE, P2 — the closed-form potential theorem).** The Coulomb potential of any register state is a
FINITE CLOSED FORM. Proof sketch: ρ = |Σ c_a ψ_a|² expands, by the Gaunt/Clebsch product of two Y_lm, into
Σ_L,M ρ_LM(r) Y_LM with ρ_LM(r) = Σ polynomial(r) e^{−(1/n_a + 1/n_b) r}; the shell integrals
Φ_LM(r) = (4π/(2L+1)) [ r^{−L−1} ∫₀^r ρ_LM r'^{L+2} dr' + r^L ∫_r^∞ ρ_LM r'^{1−L} dr' ] of polynomial × exponential
are elementary (incomplete gammas of integer order = polynomial × exponential). Instances: the electron potential of
|1s|² is Φ_e(r) = −[1 − (1 + r) e^{−2r}]/r — P2's quadrature agrees to 6 digits at r = 0.5, 1, 2, 5. For |2p_z|²,
on the axis, Φ_e → −1/r − Q P₂/(2r³) with the quadrupole Q = ⟨3z² − r²⟩ = 24: P2 finds Φ_e(20) + 1/20 =
−1.4999 × 10⁻³ against −Q/(2·20³) = −1.5000 × 10⁻³. *Gate for the build:* Φ by closed form vs a 96³ grid Poisson solve,
agreement to 1e-4 at every stage point for 1s + 2p_z.

**A.3 (KNOWN — Hellmann–Feynman electrostatic theorem, P4).** For an exact eigenstate the force on a nucleus is the
CLASSICAL electrostatic force of the electron density and the other nuclei. On the lab's H₂⁺ at R = 2 the LCAO
density pulls nucleus B toward A with 0.130157 a.u., the other proton pushes with 1/R² = 0.25: F_HF = +0.119843
(apart). The LCAO energy's own −dE/dR = +0.053804. **The gap, 0.066, is the Pulay force of a minimal basis** — the
theorem is exact only for exact (or complete-basis) states, which is why the LCAO minimum sits at R ≈ 2.49 while the
exact one is 2.00 a₀. This is the honest number to put next to any "electrostatic dynamics" the lab shows: the H₂
Heitler–London nuclei already move on −∇E (Ehrenfest on the surface); the electrostatic force differs from it by
exactly this Pulay term until the basis is good enough.

**A.4 (DERIVED-HERE — what "classical electrostatics" is allowed to mean, and what it is not).** Mean-field is
exact classical electrostatics of the quantum density: the Hartree potential of |ψ|² IS the Coulomb potential of
A.2. So "less freedom, real physics": (i) nuclei move by Hellmann–Feynman on the density (exact for eigenstates);
(ii) electrons feel each other through the Coulomb potential of the others' densities (Hartree; exact classical
field, quantum electron); (iii) what it leaves out is exchange and correlation — the helium numbers below say how much.

### Thread E — the road from the register to atoms and molecules

**E.1 (DERIVED-HERE, P3 — Hartree helium on a radial grid).** Two 1s electrons, each in −2/r plus the Coulomb
potential of the other's density (A.2), Numerov shooting, 23 self-consistent iterations: **E = −2.86149 Eh,
ε = −0.91789, ⟨r⟩ = 0.9273 a₀**. Hartree–Fock is −2.86168 / −0.91796 / 0.9273 (KNOWN); for a closed-shell pair in
one orbital, self-interaction-free Hartree *is* Hartree–Fock, so the 2 × 10⁻⁴ residual is the grid, not the method.
The exact energy is −2.90372 (the lab's Hylleraas-3 gives −2.90243): **correlation = 42 mEh = 1.1 eV**, the price of
the mean field, now a number the HELIUM panel can print. Koopmans: −ε = 24.98 eV vs the measured 24.59.

**E.2 (KNOWN → CONTRACT — the periodic table by the central field).** Herman–Skillman (1963) / Hartree–Fock–Slater:
for any Z, occupied shells (n, l, occupation) in a common central potential V(r) = −Z/r + V_H[ρ_total] + V_x[ρ]
(Slater's Xα exchange, α = 2/3 for Kohn–Sham), each shell a numerical radial u_nl(r) by the SAME shooter, iterate to
self-consistency. The lab already owns every piece: the shooter (Cornell), the Hartree potential (P3), the
tabulated-radial kernel branch (space 6), the register's (n, l, m) labels. **ATOMS Z = 1…36 become Hamiltonian
entries**: the 91 labels re-read as the atom's shells with Z_eff screening emerging, not assumed (Slater's rules
become a readout, not an input). Gates: Ne (1s²2s²2p⁶) HFS total energy within 0.5 % of the HF −128.547; Ar
−526.82; the 3d/4s ordering of K–Zn. Momentum space stays unbuilt (as for the box) until a numerical Hankel transform
of the tabulated radials is added — cheap, honest, later.

**E.3 (DERIVED-HERE → CONTRACT — the general molecular orbital model).** One electron, K nuclei (Z_i at R_i): the
basis is the register's hydrogenic (n, l, m) functions on each centre (a Slater-type basis with the exact
hydrogenic exponents, or the E.2 atomic radials); the generalized eigenproblem H C = E S C needs the two-centre
integrals ⟨χ_A|χ_B⟩, ⟨χ_A|−½∇²|χ_B⟩, ⟨χ_A|−Z_C/|x − R_C||χ_B⟩. For two centres they are EXACT in prolate-spheroidal
coordinates by Gauss–Legendre × Gauss–Laguerre quadrature (the volume element and 1/r_A, 1/r_B are polynomial in
(ξ, η)); for K > 2 Becke's fuzzy-cell partitioning gives the same integrals to 1e-6. H₂⁺ 1s-only reproduces the
lab's Eg = −0.553771 at R = 2 as the gate; adding 2p_z on each centre must bring R_e from 2.49 toward 2.00 and E toward
−0.6026 (KNOWN: the σ_g ground state of H₂⁺). Then nuclei by Hellmann–Feynman with the Pulay term reported (A.3).

**E.4 (UNVERIFIED — the valence-orbital generalisation Josh asked for).** Conjecture: in the E.2 atoms the valence
radial functions of a column of the periodic table are hydrogenic with an effective Z_eff and quantum defect δ_l
(u_nl ≈ hydrogenic with n* = n − δ_l), and the SPEED law C.3 holds with m/(r sin θ) unchanged (it is angular, not
radial). What changes across a column is the radius ⟨r⟩ ∝ n*²/Z_eff. A number the round wants: the quantum defects
of Na 3s (δ_s = 1.35, KNOWN from spectra) from an HFS solve.

### Thread B — radiation, and what to draw of it

**B.1 (KNOWN, P2 — the register radiates at the right rate).** Einstein A(2p → 1s) = (4/3) α³ ω³ |⟨1s|z|2p₀⟩|² with
the dipole from the register's own functions, 0.74496 (exact 128√2/243 = 0.74494): **A = 6.2687 × 10⁸ s⁻¹**, NIST
6.2649 × 10⁸ — 0.06 % (the two-digit ω). So the A/B TRANSITION already carries the exact spontaneous-emission rate
of its pair; the readout should print τ = 1/A = 1.60 ns and the Rabi period beside it.

**B.2 (KNOWN — the far field).** The Rabi mix's dipole is d(t) = d_AB sin(Ω t) cos(ω_AB t) (rotating-wave), Larmor
power P = (2/3c³) |d̈|², and the far-zone fields E = (1/c² r) n̂ × (n̂ × d̈)|_ret, B = n̂ × E, on a sphere of radius
r ≫ λ = 2296 a₀ — three orders of magnitude off the stage. The honest picture is a SEPARATE view, "RADIATION", with
its own scale (r in units of λ), drawing the exact dipole far field of the transition; the near zone belongs to
Thread A. Superposed on the stage they would be a lie of scale — say so in the label, or don't do it.

### Thread F — position + momentum in one volume

**F.1 (KNOWN — Wigner).** The only joint object is W(x, p); its marginals are |ψ|² and |φ|² exactly, and for
hydrogen it is not positive (Dahl & Springborg 1982, the 1s Wigner function has negative regions). A 3-D picture
must be a slice or a marginal; an overlay of |ψ(x)|² and |φ(p)|² is a design choice with two textures. UNVERIFIED
number wanted: the minimum of W_1s(r, p) and where it sits.

### The questions for the second lab (each must be answered with a number, a derivation, or a counter-example)

- **Q1 (DEEPEN A.2).** Write the closed-form Φ_LM(r) for a general pair (n_a l_a m_a; n_b l_b m_b): the Gaunt
  coefficient, the radial polynomial, the two incomplete-gamma integrals. Give Φ on the axis for 1s + 2p_z at
  r = 1, 3, 8 to six digits and check against P2's quadrature route.
- **Q2 (LOCATE E.2).** Run an HFS (Xα, α = 2/3) or plain Hartree central-field solve for Ne and Ar with the P3
  method extended to shells; report total energies and the 2p eigenvalue of Ne against HF (−0.8504). What grid and
  mixing does it take? Does the 3d/4s ordering come out right for K and Sc?
- **Q3 (DEEPEN E.3).** The two-centre integrals in prolate-spheroidal coordinates for STOs with l ≤ 2: how many
  quadrature points for 1e-8? Reproduce Eg(2) = −0.553771 with 1s and give the R_e and E with {1s, 2p_z} per centre.
- **Q4 (KILL OR KEEP C.2).** Verify Ω_ab = (E_a − E_b)/(m_a − m_b) numerically on Josh's four-channel state: does the
  3-fold pattern return to itself at t = 201.06? Which harmonic dominates at his fader settings (read them off the
  screencast if you can), and at what t does the 3-fold win over the 2-fold?
- **Q5 (BROADEN A.4).** The magnetic field of the probability current for 2p₊1 at 1 a₀ on the axis, in gauss:
  Biot–Savart of j = (m/ρ)|ψ|² φ̂. Is it the 0.1–1 T of textbook orbital fields, and does it deserve a picture?
- **Q6 (LOCATE F.1).** Dahl–Springborg's closed form of W_1s: the minimum value and radius. Is a (r, p_r) slice of
  the Wigner function the honest "x + p superposed" picture?

### NOT CERTIFIED

Hartree for Z > 2 (E.2), the two-centre integrals (E.3), the magnetic field magnitude (Q5), the Wigner minimum
(Q6). B.2 is standard electrodynamics but no lab number was produced for the Larmor power of the Rabi mix.

### Contracts, as a build wave could take them (after Round 2)

- **W-FIELD** — an ELECTROSTATICS window: the exact potential of the register's density (A.2, closed form), its
  equipotentials on the stage and the field lines of E; the current j's lines beside them; the Hellmann–Feynman force
  on a probe charge. Gate: Q1's numbers and the 1e-4 Poisson agreement.
- **W-ATOMS** — the HFS central-field solver → tabulated radials → ATOM entries in the HAMILTONIAN selector for
  Z = 1…36 with occupations and Z_eff readouts. Gate: Q2.
- **W-MO** — the general LCAO on K centres with the register basis; nuclei by Hellmann–Feynman with the Pulay term
  shown. Gate: Q3 and A.3.
- **W-RADIATION** — the far-field view of the A/B dipole at its own scale, with τ = 1/A printed. Gate: B.1.

## ROUND 2 · SOL

**Independent record.** I read all 171 lines of Round 1, all four P1–P4 probes, the completed 92-line literature
digest, and the relevant radial/table machinery in `lab/`. I reran P1–P4 unchanged: every printed Round-1 anchor
reproduced. I then wrote and ran:

- `node research/probes-fields/sol-q1-q4-q5.mjs`;
- `~/bin/scipython research/probes-fields/sol-hfs.py`;
- `~/bin/scipython research/probes-fields/sol-h2plus.py`;
- `~/bin/scipython research/probes-fields/sol-wigner.py`.

The answers below use the same atomic-unit and complex-spherical-harmonic conventions as `lab/hydrogen.js`.

### Q1 — KEEP the finite-closed-form theorem; here is the missing formula and its numbers

**DERIVED-HERE.** Put \(k_a=n_a-l_a-1\), \(\beta_{ab}=n_a^{-1}+n_b^{-1}\), and

\[
p^{(a)}_j=N_{n_al_a}{(-1)^j\over j!}{n_a+l_a\choose k_a-j}
                 \left({2\over n_a}\right)^{l_a+j},\qquad 0\le j\le k_a .
\]

Then the lab's radial convention is exactly

\[
R_a(r)=e^{-r/n_a}\sum_{j=0}^{k_a}p^{(a)}_j r^{l_a+j},\qquad
R_aR_b=e^{-\beta_{ab}r}\sum_qD^{ab}_q r^q,
\quad D^{ab}_q=\sum_{l_a+l_b+j+k=q}p^{(a)}_jp^{(b)}_k .
\]

For the ordered density pair \(c_ac_b^*\psi_a\psi_b^*\), its angular coefficient is the Gaunt number

\[
G^{LM}_{ab}=(-1)^{m_b+M}\sqrt{{(2l_a+1)(2l_b+1)(2L+1)\over4\pi}}
\begin{pmatrix}l_a&l_b&L\\0&0&0\end{pmatrix}
\begin{pmatrix}l_a&l_b&L\\m_a&-m_b&-M\end{pmatrix}.
\]

Thus \(M=m_a-m_b\), \(|l_a-l_b|\le L\le l_a+l_b\), and \(l_a+l_b+L\) is even. With
\(\rho_{LM}(r)=\sum_{abq}c_ac_b^*G^{LM}_{ab}D^{ab}_qr^qe^{-\beta_{ab}r}\), the **electron** potential is

\[
\boxed{\Phi_e(\mathbf r)=-\sum_{LM}{4\pi\over2L+1}Y_{LM}(\hat r)
\sum_{abq}c_ac_b^*G^{LM}_{ab}D^{ab}_q
\left[{\gamma(q+L+3,\beta r)\over\beta^{q+L+3}r^{L+1}}
+{r^L\Gamma(q+2-L,\beta r)\over\beta^{q+2-L}}\right].}
\]

Both gamma orders are positive integers, so this is exponential times a finite polynomial, not a special-function
runtime requirement. More sharply than Round 1: for the 91-label register \(L\le10\), \(q\le10\), and there are at
most \(121\) complex multipole slots (with the real-density conjugacy cutting storage almost in half).

For the normalized register preset \((1s+2p_z)/\sqrt2\) at \(t=0\), on the **positive** \(z\)-axis, the Legendre
radial densities are

\[
A_0={e^{-2r}\over2\pi}+{r^2e^{-r}\over192\pi},\quad
A_1={re^{-3r/2}\over4\pi\sqrt2},\quad A_2={r^2e^{-r}\over96\pi}.
\]

The closed form versus a 48,000-shell midpoint implementation of P2's multipole quadrature is:

| \(r/a_0\) | closed \(\Phi_e\) | P2 route | absolute difference |
|---:|---:|---:|---:|
| 1 | −0.568025637 | −0.568025607 | \(2.94\times10^{-8}\) |
| 3 | −0.357019862 | −0.357019858 | \(3.68\times10^{-9}\) |
| 8 | −0.145345133 | −0.145345133 | \(8.96\times10^{-11}\) |

**New machinery already in `lab/`.** `modeTable()` already stores the two finite polynomials needed to construct
\(D_q^{ab}\); `field.js` already transports modes to the GPU; and `bessel.js` plus `kick.js` already supply stable
spherical Bessel functions and log-grid radial quadrature. The last pair are also the missing numerical Hankel
transform machinery that Round 1 called “cheap, honest, later”—it is substantially present now.

### Q2 — a converged number, and two failed proposed gates

**DERIVED-HERE (independent central field).** I solved, for each occupied radial shell,

\[
\left[-\tfrac12{d^2\over dr^2}+{l(l+1)\over2r^2}-{Z\over r}+V_H(r)+V_x(r)\right]u_{nl}
=\epsilon_{nl}u_{nl},
\]
\[
q(r)=\sum_{nl}f_{nl}u_{nl}^2,\quad \rho={q\over4\pi r^2},\quad
V_H={1\over r}\int_0^r q(s)ds+\int_r^\infty{q(s)\over s}ds,
\quad V_x=-\left({3\rho\over\pi}\right)^{1/3}.
\]

The last expression is \(X\alpha\), \(\alpha=2/3\) (exchange-only Kohn–Sham/Gáspár). The total used the matching
functional

\[
E=\sum f_{nl}\epsilon_{nl}-E_H-\int\rho V_x\,d^3r+E_x
=\sum f_{nl}\epsilon_{nl}-E_H-\tfrac13E_x,
\quad E_x=-{3\over4}\left({3\over\pi}\right)^{1/3}\int\rho^{4/3}d^3r.
\]

Grid: \(r_i=i h\), \(0<r<40a_0\), Dirichlet endpoints, centered second difference, tridiagonal eigensolve. I mixed
old:new potentials \(0.75:0.25\) and stopped at \(|\Delta E|<10^{-9}E_h\),
\(\|\Delta V\|_\infty<10^{-7}E_h\). Integrated electron counts were 10.000000000000 and 18.000000000000.

| atom | points; \(h\) | iterations | \(E/E_h\) | error from stated HF | outer \(p\) eigenvalue |
|---|---:|---:|---:|---:|---:|
| Ne | 6,000; 0.006665556 | 81 | −127.380203970 | 0.907680% | −0.443269823 |
| Ne | 12,000; 0.003333056 | 80 | −127.463054797 | 0.843229% | −0.443109702 |
| Ne | 24,000; 0.001666597 | 80 | −127.483815790 | 0.827078% | −0.443069681 |
| Ar | 6,000; 0.006665556 | 84 | −523.351119187 | 0.658457% | −0.334144368 |
| Ar | 12,000; 0.003333056 | 83 | −524.224196163 | 0.492731% | −0.333884989 |
| Ar | 24,000; 0.001666597 | 84 | −524.444011090 | 0.451006% | −0.333820231 |

The observed \(h^2\) convergence extrapolates to **Ne −127.490736890 \(E_h\)** (HF −128.547: \(+1.056263110\),
0.821694%) and **Ar −524.517290874 \(E_h\)** (HF −526.82: \(+2.302709126\), 0.437096%). Ne \(2p\) is
**−0.443069681 \(E_h\)**, \(+0.407330319\) or 47.8987% shallower than the quoted HF −0.8504. That discrepancy is
not a grid error: Slater explicitly warns that statistical-\(X\alpha\) and HF eigenvalues represent different
quantities ([Slater 1970](https://doi.org/10.1002/qua.560050703)). A frozen-density Latter tail beginning at
\(r_L=1.384942a_0\) only changes it to −0.479235229.

For the ordering gate (12,000 points):

| atom/configuration | \(\epsilon_{4s}\) | \(\epsilon_{3d}\) | raw order | frozen-Latter order |
|---|---:|---:|---|---|
| K \([Ar]4s^1\) | −0.064437879 | +0.008299827 | \(4s<3d\), right | \(4s<3d\): −0.142801356 < −0.057295358 |
| Sc \([Ar]3d^14s^2\) | −0.125569845 | −0.090027483 | \(4s<3d\), wrong | \(4s<3d\): −0.175382101 < −0.102177634, still wrong |

**REFUTED, quoted:** “**Gates: Ne ... HFS total energy within 0.5 % of the HF −128.547; Ar −526.82; the 3d/4s
ordering of K–Zn.**” **Corrected gate:** `XALPHA=2/3` must assert Ne \(E=-127.49\pm0.03\) and explicitly mark the
old 0.5% HF gate FAIL; Ar \(E=-524.52\pm0.08\) passes 0.5%; K must assert \(4s<3d\); Sc must expose the present
\(4s<3d\) as a failure, not certify K–Zn. The model, \(\alpha\), tail prescription, grid and energy functional must
be printed together. `lab/qcd.js::numerov`, `cornell.js`'s 256-sample rows, `field.js` space 6, and the dynamic
provider in `hamiltonian.js` are already the production path; the missing pieces are atomic SCF, shell occupations,
and a declared Latter/total-energy policy.

### Q3 — the integrals converge; the claimed fixed-basis trend does not

**DERIVED-HERE.** With foci at \(z=\mp R/2\), \(a=R/2\),

\[
r_A=a(\xi+\eta),\quad r_B=a(\xi-\eta),\quad z=a\xi\eta,\quad
d^3r=a^3(\xi^2-\eta^2)d\xi d\eta d\phi .
\]

For a pair of STO exponents \(\zeta_i,\zeta_j\), set
\(x=a(\zeta_i+\zeta_j)(\xi-1)\). Then its \(\xi\) exponential is exactly the Laguerre weight \(e^{-x}\); the
remaining \(\eta\) exponential is handled by Gauss–Legendre. Moreover
\((\xi^2-\eta^2)/(\xi\pm\eta)=\xi\mp\eta\), so the nuclear attraction singularities cancel algebraically before
quadrature. For the six \(z\)-oriented functions \(\{1s,2p_z,3d_{z^2}\}\) on each centre and
\(R=1,2,3,4a_0\), the maximum absolute error in any \(S\) or \(H\) matrix element against \(64\times64\) was:

| order | \(6^2\) | \(7^2\) | \(8^2\) | \(9^2\) | \(10^2\) | \(12^2\) |
|---:|---:|---:|---:|---:|---:|---:|
| max error | \(1.886\times10^{-5}\) | \(5.707\times10^{-7}\) | \(1.247\times10^{-8}\) | **\(2.062\times10^{-10}\)** | \(2.67\times10^{-12}\) | \(1.16\times10^{-14}\) |

Therefore the answer is **9 Gauss–Laguerre × 9 Gauss–Legendre points** for \(10^{-8}\) over that stated basis and
bond interval; \(8\times8\) misses by \(2.47\times10^{-9}\). At \(R=2\), 1s/centre gives

\[
S_{AB}=0.586452894025,\ H_{AA}=-0.972526541667,\ H_{AB}=-0.699232296722,
\quad \boxed{E_g=-0.553771495318E_h},
\]

reproducing `lab/molecule.js` to \(4\times10^{-16}E_h\). Its minimum is
\(R_e=2.492830372a_0,\ E=-0.564830992371E_h\).

For the **fixed register hydrogenic** \(\{1s,2p_z\}\) on each centre (exponents 1 and 1/2), the result is instead

\[
E(2)=-0.553815296857E_h,\qquad
\boxed{R_e=2.508709526a_0,\ E=-0.565017760006E_h,\ D_e=1.769223364\ {\rm eV}}.
\]

It lowers the optimized energy by only \(0.000186767635E_h\) and moves the bond **outward** by
\(0.015879154a_0\). This obeys the Rayleigh–Ritz theorem: a nested basis can only lower \(E(R)\) at fixed \(R\),
but there is no theorem that its minimizing \(R\) moves monotonically toward the exact value.

**REFUTED, quoted:** “**adding \(2p_z\) on each centre must bring \(R_e\) from 2.49 toward 2.00 and \(E\) toward
−0.6026**.” **Corrected gate:** fixed register exponents must assert
`Re=2.50870953, E=-0.5650177600`; reaching Dickinson's literature value \(D_e\simeq2.716\) eV requires optimized
1s/2p exponents, not merely adding the diffuse hydrogen \(2p\) ([Ruedenberg–Schmidt 2007](https://doi.org/10.1002/jcc.20553)).
The parity-adapted combinations \(1s_A\pm1s_B\) and \(2p_A\mp2p_B\) also split this four-function problem into two
\(2\times2\) generalized eigenproblems. For analytic nuclear forces the exact finite-basis formula is
\(dE/dR=c^\dagger(H'-ES')c\): the \(-ES'\) term is the Pulay term that Round 1 measured indirectly.

### Q4 — KEEP the angular-velocity law; replace the period and dominance story

**DERIVED-HERE and numerically checked.** A pair coefficient evolves as
\(C_k(t)=C_k(0)e^{-i(E_a-E_b)t}\), so a chosen continuous orientation branch satisfies
\(\dot\phi=(E_a-E_b)/k\). For \(4d_{+2}\times2p_{-1}\),

\[
\Delta E={3\over32}=0.09375,\quad k=3,\quad \Omega={1\over32}=0.03125,
\quad T_{2\pi}=64\pi=201.061929830.
\]

But an unlabeled three-lobed density is invariant after a \(2\pi/3\) orientation change. Its **fundamental density
period**, and the fundamental period of this entire two-shell four-channel density, is therefore

\[
\boxed{T_\rho={2\pi\over\Delta E}={64\pi\over3}=67.020643277\ {\rm a.u.}};
\]
\(201.061929830\) is the third recurrence. Direct 720-point rings return with relative RMS errors
\(2.24\times10^{-16}\) at \(T_\rho\) and \(1.79\times10^{-16}\) at \(3T_\rho\) for \(r=3\); the corresponding
numbers at \(r=6\) are \(3.49\times10^{-16}\) and \(3.07\times10^{-16}\).

The only recoverable fader record in the workspace is Round 1's equal-amplitude reconstruction,
\(|c|^2=1/4\) each. It gives:

| ring | \(h_2/\rho_0\) at \(t=0\) | \(h_3/\rho_0\) at \(t=0\) | maximum \(h_3/h_2\) in one period | time of maximum |
|---|---:|---:|---:|---:|
| \(r=3,\theta=\pi/2.4\) | 0.954930224 | 0.168156805 | 0.176093291 | 2.888589725 |
| \(r=6,\theta=\pi/2.4\) | 0.877315893 | 0.436072203 | 0.497052665 | 30.615029849 |

So \(k=2\) dominates and the numerical answer to “at what \(t\) does the 3-fold win?” is **at no \(t\)** for
that reconstructed state on either stated ring.

**REFUTED, quoted:** “**The three lobes he filmed are the 3-fold term winning at the amplitudes and time he had.**”
**Corrected gate:** never infer the winning harmonic from the channel labels; store the serialized four populations,
phases, \(t\), and sampling surface, then assert \(h_3>h_2\) on that record. The present equal-fader surrogate asserts
\(h_3/h_2\le0.497052665\), so it cannot support the quoted sentence. The screencast pixels/serialized faders are not
present in this workspace.

### Q5 — located and integrated: −4,295.332 gauss, not the point-dipole estimate

**DERIVED-HERE.** In the lab convention

\[
\psi_{211}=-{\varrho e^{-r/2}e^{i\phi}\over8\sqrt\pi},\qquad
\mathbf j_{\rm prob}={\varrho e^{-r}\over64\pi}\hat\phi .
\]

For an electron the charge current reverses this direction. On the positive axis, angular integration uses

\[
\int_{-1}^{1}{1-u^2\over(r^2+z^2-2rzu)^{3/2}}du={4\over3\max(r,z)^3},
\]

which gives, with \(z\) measured in \(a_0\),

\[
B_z(z)=-{\mu_0e\hbar\over4\pi m_ea_0^3}{1\over24}
\left[{\gamma(5,z)\over z^3}+\Gamma(2,z)\right].
\]

At \(z=1\), \(\gamma(5,1)=0.087836323856\), \(\Gamma(2,1)=0.735758882343\), the dimensionless integral is
−0.034316466925, and \(\mu_0e\hbar/(4\pi m_ea_0^3)=12.516824431\) T. Therefore

\[
\boxed{B_z(1a_0)=-0.429533192\ {\rm T}=-4,295.332\ {\rm G}}.
\]

The magnitude is indeed in the textbook 0.1–1 T band and merits a magnetostatic **orbital-current** view; it must
vanish for every real stationary orbital. The field is finite at the origin (−0.521534351 T) and only outside the
cloud approaches the axial point-dipole law \(-12.516824431(a_0/z)^3\) T.

**REFUTED, quoted from the digest:** “**a \(2p_{+1}\) Bohr magneton gives 6.3 T at \(1a_0\)**.” **Corrected gate:**
the distributed-current on-axis value at \(1a_0\) is 0.429533192 T; 6.258 T is a point-dipole equatorial-scale
number applied inside the source, while the axial point-dipole asymptote has the additional factor two.

**Corrected wording for Round 1 A.1, quoted:** “**the magnetic field is smaller than the electric by
\(\alpha^2v^2\sim10^{-5}\)**.” \(B/E\) is dimensionful in SI; the invariant statement is that the **magnetic
Lorentz force divided by the electric force** scales as \(v^2/c^2=\alpha^2v_{\rm au}^2\), while field amplitudes in
Gaussian units scale as \(B/E\sim v/c\).

### Q6 — the attribution is false; the exact-integral numerical minimum is located

**COUNTER-EXAMPLE to the premise.** Dahl–Springborg did **not** publish a closed form for the exact exponential 1s
Wigner function; they evaluated Gaussian expansions. Praxmeyer–Mostowski–Wódkiewicz explicitly say that an analytic
formula was not known even for 1s and replace it by a differential generator acting on one finite integral
([paper and equations 1–6](https://arxiv.org/abs/quant-ph/0504038); original
[Dahl–Springborg DOI](https://doi.org/10.1080/00268978200100752)). Differentiating that generator gives a stable
one-dimensional representation. In the convention

\[
W(\mathbf r,\mathbf p)=\int{d^3q\over(2\pi)^3}\psi^*(\mathbf r+\mathbf q/2)e^{i\mathbf q\cdot\mathbf p}
\psi(\mathbf r-\mathbf q/2),
\]

put \(\mu=\hat r\cdot\hat p\), \(C=\sqrt{1+4u(1-u)p^2}\). Then

\[
W_{1s}={2\over\pi^3}\int_0^1du\,u(1-u)e^{-2rC}
\left({4r^2\over C^3}+{6r\over C^4}+{3\over C^5}\right)
\cos[2rp\mu(2u-1)].
\]

It gives \(W(0,0)=1/\pi^3=0.0322515344332\). A three-variable search over
\(0\le r\le8,\ 0\le p\le30,\ 0\le\mu\le1\), followed by 32-, 48-, 64-, 96-, 128- and 160-point independent
Gauss–Legendre evaluations, converged to

\[
\boxed{W_{\min}=-3.09725752458\times10^{-4}},\quad
\boxed{r=1.32953725a_0,\ p=1.37910926\hbar/a_0,\ |\mu|=1},
\]

or \(\pi^3W_{\min}=-0.00960344237572\). At the same \(r,p\), \(W\) for
\(\mu=(0,.25,.5,.75,1)\) is respectively
\((+7.76005,+6.40547,+3.02567,-0.714457,-3.09726)\times10^{-4}\).

A signed \((r,p_r)\) picture is honest **only** when labelled as the collinear slice \(p_\perp=0\); it is not a
marginal and not “position plus momentum superposed.” A Cartesian \(W(z,p_z)\) slice with
\(x=y=p_x=p_y=0\) is less ambiguous. Its axes are simultaneous phase-space arguments, its negative colour is
essential, and separate side plots should verify the exact \(|\psi(\mathbf r)|^2\) and \(|\tilde\psi(\mathbf p)|^2\)
marginals.

### Machinery and theorems neither Round 1 nor the digest made operational

1. **Finite register bound:** density multipoles terminate at \(L=10\) and radial degree 10. W-FIELD is a small
   analytic contraction, not a \(96^3\) Poisson problem; the grid solve should remain an independent gate.
2. **Symmetry before diagonalization:** centre exchange/parity block-diagonalizes every homonuclear two-centre
   generalized eigenproblem. It halves this H2+ problem and prevents a visually smooth but parity-contaminated MO.
3. **Variational force gate:** for a normalized generalized eigenvector, \(F_R=-c^\dagger(H'-ES')c\). This evaluates
   the Pulay term directly and should replace a finite-difference mystery residual.
4. **Production radial bridge:** the existing Hamiltonian-provider abstraction, Numerov node counter, 256-sample
   Cornell table path, spherical Bessel evaluator and log-grid radial quadrature together already implement most
   of W-ATOMS and the tabulated-radial half of W-MO/momentum space.
5. **Model identity:** \(X\alpha(2/3)\), Slater HFS \((\alpha=1)\), a Latter-corrected potential, and nonlocal HF are
   four different gates. A selector may compare them, but must not use “HFS” as an interchangeable label.

### New questions for the next lab

- **Q7 (DEEPEN Q2).** Implement a self-consistent Latter tail and a logarithmic/cubic radial mesh; give Ne/Ar
  virial residuals, cusp errors, \(E(h\to0)\), and K–Zn 4s/3d crossings. Which change, if any, repairs Sc without an
  empirical occupation rule?
- **Q8 (LOCATE Q3).** Variationally optimize separate \(\zeta_{1s},\zeta_{2p}\) in the same prolate integrator. Reproduce
  Dickinson's \(D_e=2.716\) eV and report \(R_e,E,\zeta_s,\zeta_p\); then determine the smallest register-compatible
  contracted STO set reaching 1 m\(E_h\) of −0.60263 at \(R=2\).
- **Q9 (BROADEN Q1).** Generate all nonzero \(G^{LM}_{ab}D_q^{ab}\) for the 91-label register, count them after
  Hermitian and selection-rule compression, and benchmark analytic \(\Phi,\nabla\Phi\) against a padded FFT/Poisson
  solve at 20 adversarial near-node points.
- **Q10 (DEEPEN Q6).** Apply the Praxmeyer differential generators to every \(n\le6\) pair term, verify both Wigner
  marginals to \(10^{-6}\), and locate the most negative register superposition under a fixed-energy constraint.
- **Q11 (BROADEN Q5).** Put the analytic axial \(B_z\) and a full 3-D Biot–Savart solve through
  \(\nabla\cdot\mathbf B=0\), far-dipole and time-reversal gates; quantify the voxel resolution needed for 1% at
  the 2p current torus.

### NOT CERTIFIED

The proposed Z=1…36 atom Hamiltonian is not certified: Ne fails the old 0.5% gate and Sc fails the requested
ordering. The fixed \(\{1s,2p_z\}\) MO extension is numerically certified as a counter-example, not as an accurate
H2+ model. The actual screencast faders are not recoverable from this workspace. The Wigner value is a converged
finite-domain numerical minimum, not a proof that no still smaller remote lobe exists. No production GPU
electrostatic, Biot–Savart, atomic-SCF, molecular-integral, or Wigner window was built in this mathematics round.

**Final output:** `research/MATH-FIELDS-AND-MOLECULES-2026-09-04.md`


---

## ROUND 3 · FABLE — the exchange

**Read.** Sol's Round 2 (above) and Opus's rival file `research/RIVAL-FIELDS-AND-MOLECULES-OPUS.md`, both written
without sight of each other. My cross-checks are `p5`–`p8` under `research/probes-fields/`; every number below that
is mine was computed by a route different from the lab it checks.

### 3.1 What the two labs agree on without having met (STANDS, two labs + a third route)

- **The magnetic field of the 2p₊1 current.** Sol −0.429533 T at 1 a₀ on the axis, Opus −0.42953319 T, my P5
  −0.430 T by a brute 3-D Biot–Savart; at the origin Sol/Opus −0.521534 T, P6 −0.5212 T — and Opus certifies the
  origin value as the orbital hyperfine field (μ₀/4π)·2μ_B⟨r⁻³⟩ to 3 × 10⁻¹². The digest's 6.3 T is DEAD (equatorial
  point-dipole value applied inside the source). *Verdict for the build:* draw the current lines, print 0.52 T at the
  nucleus, never a B overlay competing with E.
- **The Wigner minimum of 1s.** Sol −3.09725752 × 10⁻⁴ at r = 1.32954, p = 1.37911, p ∥ r; Opus −3.0972575 × 10⁻⁴
  at r = 1.329537, p = 1.379109, p ∥ r. STANDS. Sol adds that Dahl–Springborg published no closed form (my F.1
  attribution is DEAD); Opus adds that the negativity is carried entirely by radial momentum, which makes the
  (z, p_z) slice the honest picture — labelled a slice, on a signed map with the zero pinned.
- **Neon and argon under exchange-only Xα(2/3).** Sol (Richardson from three grids) Ne −127.4907, Ar −524.5173;
  Opus Ne −127.49075, Ar −524.51768. STANDS. Both kill my 0.5 % gate for Ne: this is the known exchange-only LDA
  value, 0.82 % above Hartree–Fock, and no grid will close it. Opus adds the Latter tail (Ne −127.47595, Ar −524.50582),
  Herman–Skillman's α = 1 (Ne −133.06, 3.5 % below HF — the wrong way), and the α that reproduces E_HF: 0.73105 /
  0.72323 against Schwarz's 0.73081 / 0.72177. Both kill the Ne 2p eigenvalue gate: −0.443 (no tail) / −0.554 (tail)
  against HF −0.850 — Xα eigenvalues are not Koopmans energies. Opus's Δ-SCF ionisation energy, 21.09 eV against the
  measured 21.56, is the readout that survives.
- **The closed-form potential.** Sol's Gaunt/gamma formula gives Φ_e on the axis for (1s + 2p_z)/√2 of
  −0.568025637 / −0.357019862 / −0.145345133 at r = 1, 3, 8; Opus's independent solve agrees to six digits; my P6 shell
  quadrature agrees to 1 × 10⁻⁵ (its θ-midpoint resolution). STANDS, with Sol's sharpening: L ≤ 10, radial degree
  ≤ 10, at most 121 multipole slots for the whole register — W-FIELD is an analytic contraction, not a Poisson solve.
- **The two-centre integrals.** Sol: prolate-spheroidal Gauss–Laguerre × Gauss–Legendre, 9 × 9 points for 10⁻⁸ over
  {1s, 2p_z, 3d_z²} and R = 1…4, Eg(2) = −0.553771495318 reproducing `molecule.js` to 4 × 10⁻¹⁶. Opus: 8 × 8 for
  10⁻¹³ once the integrand is written with dV/r_A polynomial. Both kill my E.3 sentence that the register's 2p_z
  "must bring R_e toward 2.00": Sol R_e = 2.508709526 (outward by 0.016), Opus with all 42 σ register functions
  R_e = 2.35227, D_e = 2.125 eV, and a floor. DEAD.
- **The rotation law and its period.** Both keep Ω = (E_a − E_b)/(m_a − m_b) and both correct my period: the
  fundamental period of the density is 2π/ΔE = 64π/3 = 67.0206 a.u.; 201.06 is its third recurrence (a three-fold
  pattern is invariant under a third of a turn). My P6: the ring density returns at 67.0206 to 2.7 × 10⁻¹⁶. The C.2
  gate is corrected to T = 67.0206 (and 33.51 for a visible sixth of a turn).

### 3.2 Where the labs disagree, and the number that decides

**Which harmonic Josh saw.** Sol: at equal amplitudes the 2-fold dominates on the rings r = 3 and r = 6 and "the
3-fold wins at no t" — true on those rings. Opus: the k = 3 term has a second source, 4d₊2 × 4p₋1, and since both are
n = 4 it has ΔE = 0 — it STANDS STILL and it owns the outer cloud. P7 and P8, my routes: static/turning ratio of the
two k = 3 sources 0.09 at r = 6, 0.89 at r = 9, 1.23 at r = 12, 4.32 at r = 16 (Opus: 4.3); the full harmonics of
Josh's equal-amplitude state at r = 16 are h₁ : h₂ : h₃ = 0.148 : 0.073 : 0.789 and at r = 20 0.016 : 0.013 : 0.979.
**Opus is right and Sol's ring was too close in:** the three lobes Josh filmed are the standing three-fold of the
outer cloud, which is what a volume rendering shows, and they do not turn — they librate (Opus: 14.56° over a
period) while the inner two-fold breathes. My Round-1 sentence "the 3-fold winning at the amplitudes and time he
had" is DEAD twice: it was inferred from labels (Sol), and the winner is static, not the turning term I named (Opus).
*Corrected gate:* on the ring r = 16, h₃/h₂ > 10 at every t; the pattern angle changes by < 15° over 67.02 a.u.

**The Hellmann–Feynman number.** Opus: P4's cylindrical midpoint grid put the 1/r_B² kernel on a coarse mesh;
F_elec = −0.13390616, not −0.130157. P7, a quadrature centred on B where the kernel is cosθ_B dr_B dΩ with no
singularity: **−0.13390984**. Opus is right to four digits; Pulay = 0.06229 (Opus 0.06228945). A.3's numbers are
corrected: F_HF = +0.11609, −dE/dR = +0.05380, Pulay 0.06229 — and Opus's bound 2‖∂ψ/∂R‖‖(H − E)ψ‖ = 0.102024 holds
it at 61 %. Sol's `dE/dR = c†(H′ − ES′)c` is the way to compute the variational force without differences; the two
are the same fact from the two sides of Hurley's identity.

**"The grid" versus "the quadrature" in Hartree helium.** Opus: P3's 2 × 10⁻⁴ residual was the rectangle rule, not
the mesh; Simpson + tridiagonal + Richardson gives −2.8616800, 5.5 × 10⁻⁹ from HF. Accepted; E.1's residual sentence
is corrected. Sol's Ne/Ar solver used the same central difference with Richardson and lands on the same Xα numbers as
Opus's Anderson-mixed one: the atom solver is CERTIFIED between the two labs to 1 × 10⁻⁵ Eh on Ne.

### 3.3 The bigger idea in each file, taken one step further

**Sol's** is discipline made operational: the explicit Φ_LM formula with its 121-slot bound; parity block-
diagonalisation of every homonuclear problem; the analytic variational force; and the model identity rule — Xα(2/3),
HFS(α = 1), Latter-corrected and HF are four different gates and must be printed together. *One step further:* Sol's
formula survives the dilation Opus proposes. Replace 1/n by a common λ and R_a R_b is still polynomial × e^{−2λr};
the gamma-function form is unchanged with β = 2λ. So W-FIELD and the Sturmian register share one contraction, and the
121-slot bound holds for both.

**Opus's** is the diagnosis: the register is a set of labels with a frozen scale and a frozen centre, and the two
closures the physics needs cost one number and one shell rule. *Dilation:* the Coulomb Sturmians S_nl(2λr) — the
same 91 labels with one common λ — are complete where the hydrogen bound states are not (23.4 % of He⁺'s 1s lives in
hydrogen's continuum, the −1.5585 floor); with λ* = 1.7611 twenty of them put H₂⁺ at −0.602624 against the exact
−0.602634. *Translation:* ∂χ/∂R_C of an STO is a combination of STOs of the same ζ with (n − 1, l ± 1) and (n, l ± 1),
so a basis carrying those is closed, and then the electrostatic force IS −∇E and an Ehrenfest trajectory driven by
the Coulomb force of the density conserves energy exactly; otherwise the Pulay bound says by how much it does not,
from the state alone, every frame. *One step further, for the instrument:* (i) the kernel needs no change — the
hydrogen branch evaluates ρ = 2r/n with n from the record, so a Sturmian record is a hydrogen record with n_rec = 1/λ
and the same Laguerre table; (ii) but the register's evolution law changes: Sturmians are not eigenfunctions of H,
so c(t) = e^{−iEt}c(0) becomes c(t) = exp(−i S⁻¹H t) c(0) on a 91 × 91 dense pair — cheap on the CPU, exact, and it
turns the SPECTRUM ladder into the eigen-decomposition of H in the current basis, which is the "eigen-selector"
Josh asked for on 2026-09-03 and the "less freedom, real physics" he asked for today: the labels stop being
eigenstates; the eigenstates are computed, in whatever field, at whatever λ, with an error bar.

### 3.4 What both labs missed (DERIVED-HERE, P8)

**The CLOCK table (Opus's Q12, answered).** Every ΔE of the register is an integer multiple of 1/7200 (E_n = −1/2n²
and lcm(1…6)² = 3600), so the density period of a state occupying a set of shells is T = 2π·7200/g with g the gcd of
the integers 3600(1/n_b² − 1/n_a²). The longest period any register state can have is **45 238.93 a.u. = 1.0943 ps**
(any set whose g = 1, e.g. shells {3, 4, 5}); {1, 2, 3, 4} gives 1809.56 a.u. = 43.77 fs; {5, 6} 1028.16 a.u.; {2, 4}
67.021 a.u. = 1.62 fs; {1, 2} 16.755 a.u. = 0.405 fs (the Lyman-α beat). This is an exact specification for a CLOCK
readout: "this state repeats every T", with T known before it plays. (It also fixes the transport's ambition: one
full period of the {3,4,5} state at 60 fps and 1 a.u. per frame is 12.6 minutes.)

**Corrections to my own Round 1 accepted from Opus without a fight:** the near-zone phase is kr = 0.0438 rad at the
stage edge (one part in 22.8), λ/stage was the wrong quantity; A ∝ μ_reduced so A(H) = 6.2646 × 10⁸ s⁻¹, which is why
the register's number sat 0.06 % above NIST (not "the two-digit ω"); ΔE_n/(1/n³) = n(2n + 1)/2(n + 1)², 0.375 at
n = 1 rising to 0.796 at n = 6 — the correspondence is asymptotic, and my "exactly" is DEAD; Wigner is one member of
the Cohen class, not "the only joint object"; B/E as a field ratio is dimensionful — the invariant is the force
ratio v²/c² (Sol), 1.8 × 10⁻⁶ for 2p₊1 at 1 a₀ (Opus).

### NOT CERTIFIED after Round 3

The Sturmian H₂⁺ tower beyond n_max = 4 and the λ*(R) law (Opus Q7); Ehrenfest energy drift against the Pulay bound
(Opus Q8); Δ-SCF ionisation energies across Z ≤ 36 (Opus Q9, Sol Q7); the Wigner minima of 2s/2p (Q10); Berlin's
binding fraction (Q11); the Sc ordering under any single α. Josh's fader settings for the filmed state remain
unread — the outer-cloud argument makes the amplitudes nearly irrelevant to the lobe count, but not to its contrast.

---

## SYNTHESIS

### The ledger of claims

| claim | status | killer / keeper |
|---|---|---|
| C.1 harmonics = pairwise \|Δm\|; the pure pair 4d₊2 + 2p₋1 has exactly 3 lobes | STANDS | P1; Sol Q4; Opus Q4 |
| C.2 Ω = (E_a − E_b)/(m_a − m_b); period "201.06" | STANDS / DEAD | period is 67.0206 (Sol, Opus, P6) |
| C.1 "the 3-fold winning at his amplitudes and time" | DEAD | Sol (inferred from labels); Opus + P7/P8: the winner is the STANDING 3-fold of 4d₊2 × 4p₋1 in the outer cloud |
| C.3 v_φ = m/(r sinθ); "exactly the Kepler frequency" | STANDS / DEAD | Opus: ratio n(2n+1)/2(n+1)² |
| A.1 quasi-static stage; "one part in 144" | STANDS / DEAD | Opus: kr = 0.0438 |
| A.2 closed-form potential theorem | STANDS, sharpened | Sol's formula, ≤121 slots; Opus and P6 concur |
| A.3 Hellmann–Feynman on LCAO H₂⁺; P4's 0.130157 | STANDS / DEAD | Opus and P7: −0.133910, Pulay 0.06229; bound 0.102 |
| A.4 mean field = classical electrostatics of the density | STANDS | E.1 numbers |
| E.1 Hartree He −2.86149, "the grid" | STANDS / DEAD | Opus: −2.8616800 with Simpson |
| E.2 Ne within 0.5 % of HF; 2p eigenvalue; K–Zn order | DEAD as gates | Sol, Opus: Xα(2/3) Ne −127.49 (0.82 %); ε not Koopmans; Sc flips with α |
| E.2 the central-field road to ATOMS | ALIVE-AS-A-GATE | with Opus's Δ-SCF readout and Sol's model-identity rule |
| E.3 fixed 2p_z brings R_e toward 2.00 | DEAD | Sol 2.5087; Opus 2.352 with 42 fns, floor −1.5585 |
| E.3 the general LCAO on the register basis | DEAD as stated; reborn as Sturmian | Opus §3-D; Sol's integrals and parity blocks |
| E.4 valence = hydrogenic with Z_eff and δ_l | ALIVE-AS-A-GATE | Opus: Na δ_s 1.3732 with the Latter tail (measured 1.3730) |
| B.1 A(2p→1s) from the register | STANDS, corrected | 6.2646e8 with the reduced mass |
| B.2 far field as a separate view; "spontaneous emission" | STANDS / corrected | classical field radiates \|c₁\|²\|c₂\|² ħωA (digest; P5: ħωA/4) |
| F.1 Wigner, "Dahl–Springborg closed form" | STANDS / DEAD | Sol: no closed form; both labs: min −3.0973e-4 at (1.3295, 1.3791) |
| Q5 the digest's 6.3 T | DEAD | 0.4295 T (three routes); 0.5215 T at the nucleus = hyperfine |

### The contracts, restated so a build wave can be commissioned from each

- **W-CLOCK (small, first).** The period readout T = 2π·7200/gcd for the occupied shells, in a.u. and fs, on the
  transport. Gate: {2,4} → 67.021; {1,2,3,4} → 1809.557; {3,4,5} → 45238.93; the ring density returns to 1e-12.
- **W-FIELD.** ELECTROSTATICS window: Sol's Φ_LM contraction (≤121 slots) → potential, equipotentials, E lines on
  the stage; the current lines of j with "0.52 T at the nucleus" printed for 2p₊1; the Hellmann–Feynman force on any
  nucleus with Opus's Pulay bound beside it. Gates: Φ_e(1,3,8) for (1s+2p_z)/√2 to 1e-7; a 96³ Poisson solve to 1e-4;
  B_z(0) = 0.521534 T; F_elec(H₂⁺, R = 2) = −0.13391.
- **W-STURMIAN (the eigen-selector).** A SCALE λ on the register: Sturmian tables (n_rec = 1/λ in the same
  records), H and S in the current basis, exact evolution by exp(−iS⁻¹Ht), the SPECTRUM ladder = the eigen-
  decomposition, the labels' populations as projections. Gates: He⁺ at λ = 2, one function, E = −2.000000; H₂⁺ at
  R = 2 with n_max = 4 and λ = 1.7611: −0.602624; the hydrogen limit λ = 1/n reproduces every register energy.
- **W-ATOMS.** Central-field Xα(2/3) + Latter tail, Anderson mixing, Richardson on h, per-shell occupations, the
  same shooter → tabulated radials (space 6) → ATOM entries Z = 1…36 with Δ-SCF IPs printed and the exchange model
  named on the card. Gates: Ne −127.476 ± 0.03, Ar −524.506 ± 0.08; α_HF 0.731 / 0.723; Ne Δ-SCF 21.09 eV; Na
  δ_s = 1.373; the Sc 3d/4s order reported as α-dependent, not asserted.
- **W-MO.** Two-centre prolate integrals (Sol 9 × 9 / Opus 8 × 8), parity blocks, the translation-closed STO set
  per centre, nuclei by the electrostatic force with the Pulay bound per frame, energy drift reported. Gates:
  Eg(2) = −0.553771 (1s); the Opus Sturmian −0.602624 (n_max 4); drift ≤ the integrated bound.
- **W-RADIATION.** A separate scaled far-field view of the A/B dipole; τ = 1/A printed with A ∝ μ; the label
  "field of a coherent superposition, radiating |c₁|²|c₂|² ħωA".
- **W-WIGNER.** The (z, p_z) slice on a signed map, zero pinned, labelled a slice; W(0,0) = 1/π³, min −3.0973e-4.

### Benchmarks that must precede a build

The Sturmian 91 × 91 S and H at λ = 1 against the hydrogen energies (must be diagonal to 1e-12 at λ = 1/n per shell
— but a COMMON λ is not; assert the eigenvalues of S⁻¹H instead against −1/2n² for the states it contains);
Sol's 9 × 9 integrals timed in JS (a 42 × 42 S/H at R = 2 in < 50 ms); the Xα solver's wall time for Z = 36 in JS
(node) — if it exceeds 2 s the atoms are precomputed tables shipped with the lab.

### Decisions that are Josh's

→ `research/FOR-JOSH-FIELDS-AND-MOLECULES-2026-09-04.md`.

## ROUND 4 · THE BUILD (2026-09-04/05) — what the contracts found when they were built and gated

Every contract of the SYNTHESIS is now in the lab (REPORT.md waves 37–43; modules lab/electrostatics.js, sturmian.js,
sturmianreg.js, twocentre.js, atoms.js, wigner.js, radiation.js, mo.js, history.js; 28 node suites, 75 browser
blocks). The build refuted or sharpened five lines of this ledger; each is written under its claim here, with the
number that decided it (status tags per the library law).

- **B.1 "A(2p→1s) = 6.2646e8 with the reduced mass" — DEAD as a digit.** The register's exact dipole is
  128√2/243 = 0.744935539 (the round's quadrature gave 0.74496), so A = 6.264903e8 s⁻¹ with the reduced mass — NIST's
  value; infinite mass 6.268315e8. DERIVED-HERE, gated in tests/radiation.test.mjs (2e4 absolute).
- **F.1 (brief) "a 2p_z Wigner slice is antisymmetric in z" — DEAD.** A real orbital of definite parity has W even in
  p and even in z: W(−z,p) − W(z,p) = 1.7e-18, W(−z,p) + W(z,p) = 1.9e-2. The 1s minimum −3.09725752e-4 at
  (1.3295374, 1.3791092) STANDS; ∫∫ of the slice is 1/π², not 1 (it is a slice). Gated in tests/wigner.test.mjs.
- **E.4 "Na δ_s = 1.373 with the Latter tail" — STANDS only at α = 1.** Xα(2/3) + Latter gives 1.3266; α = 1 gives
  1.3732 (measured 1.373). The ATOMS card prints the defect with its α. **"Sc flips with α" — STANDS, sharpened:** 4s
  below 3d at α = 2/3 and 0.7, the crossing is at α* = 0.839. Ne is 0.833 % from HF (the dead "0.5 %" gate stays dead;
  Ar passes at 0.439 %). Gated in tests/atoms.test.mjs.
- **A.3 the Hellmann–Feynman force on the frozen 1s LCAO — STANDS, with a consequence the ledger did not draw:**
  F_HF = F_elec + 1/R² is REPULSIVE at every R on that basis (→ ½/R²), so classical nuclei under it run away
  (R = 9.8 at 800 a.u. from R₀ = 2.8); only −dE/dR binds there (period 772.6 vs 2π/ω 759.5). On the Sturmian n ≤ 4
  basis at λ = 1.7611 the HF force binds (R_e 1.99720, D_e 2.7926 eV, period 605.8 vs 593.2) with |drift| ≤ ∫bound.
  The bound is exact but loose on the 42-function register (0.96 vs a Pulay term of 0.034: ‖∂_Rψ‖ = 2.57 from the
  near-dependent basis). Gated in tests/mo.test.mjs. The Pulay bound must be computed in the SYMMETRIC ±R/2 convention
  with the normalisation derivative — the only convention that reproduces 0.102024.
- **W-CLOCK's rational test — the exact branch is a claim, not a proof, unless verified:** a relative tolerance called
  Ne's three occupied ε "exact" with T = 153 295 a.u. (true recurrence error 2e-5). The gcd is now verified to 1e-9 of a
  turn before "exact" is printed; the hydrogen shell table is unchanged. Gated in tests/period.test.mjs.

Machinery certified in the build that the round only named: Sol's Φ_LM contraction agrees with an independent
observation-centred quadrature to 1.5e-13 (the "γ(n,x) = (n−1)!(1 − e^{−x}Σ)" form loses every digit at small βr for
L ~ 10 — series at the top order plus downward recurrence); B_z(0) = −0.521534351 T and B_z(1) = −0.429533192 T for
2p₊1 by a general current quadrature; the Sturmian record renders on the GPU unchanged (n is an f32 in the kernel);
the two-centre prolate rule converges to 1e-13 with Gauss–Laguerre in ξ and an η rule that grows with ζR (a fixed
9 × 9 is 1e-5 on the λ = 1.76 Sturmians); the Xα(2/3) solver runs Z = 36 in 109 ms so no tables ship.

### NOT CERTIFIED after Round 4
Ehrenfest nuclei neglect the moving-basis non-adiabatic coupling (4.7e-5 in energy on the multi-function basis, not
bounded by ∫bound); B off the axis for states with s admixture; the 2pπ_u reference −0.42877 is cited from memory to
five digits; the 'normal' Wigner rule on n = 6 states is truncated at 12 n_max a₀ (5e-5 absolute).
