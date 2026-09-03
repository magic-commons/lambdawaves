# BEYOND THE FRONTIER · λWAVES — Round 9 · OPUS (rival) — **THE QCD ROUND**

*Josh asked for Yang–Mills / proton / gluon-flux machinery "in a whole new level". Fable's seed: **the confining spectrum is the same Airy function as the revival envelope**. This round takes that seed, makes it exact where it is exact, and kills it where it is dead. Every claim seated. Numbers or nothing.*

**Seating vocabulary.** KNOWN (textbook/PDG/lattice literature, cited) · KNOWN-in-corpus (Josh's disks, cited by file + Y-number) · DERIVED-HERE · MEASURED (a probe under `research/probes/bf-r9-*.py`) · UNVERIFIED · REFUTED.

**Headline, up front, so the round can be judged in six lines.**

1. **The Airy bridge is EXACT as an operator statement and REFUTED as spectroscopy.** The pure-linear S-wave spectrum is $E_n=(\sigma^2/2\mu)^{1/3}|a_n|$ with $a_n$ the Airy zeros — exact, no approximation. But it predicts splittings $\propto\mu^{-1/3}$, and the measured charmonium/bottomonium 2S–1S splittings (0.589 / 0.563 GeV) are **mass-independent to 4.4 %**, where $\mu^{-1/3}$ demands a factor 0.678. The Airy régime is not where the observed quarkonia live. §1.
2. **The corpus's $\sigma_0(\beta)=-\log(I_2/I_1)$ is *literally* the leading strong-coupling string tension $a^2\sigma$**, and its Borel constant $A=2$ (my Theorem S1, R4) is **the action of a single $\mathbb Z_2$ centre flip of one plaquette**, $S(-\mathbb 1)-S(+\mathbb 1)=2\beta$ exactly. The Borel lattice $2\mathbb N$ is the $n$-flip tower — derived, not measured. §2.
3. **A.9's saddle ladder does NOT govern the plaquette integral, and I can say by how much.** Its $p=4$ member gives $|\Delta S|=\tfrac32\beta$ where the truth is $2\beta$ (25 % low), and its $p=6$ member has no real competing saddle at all. The plaquette's second saddle is a *global* feature of the compact group manifold, not a coalescence. §2.4.
4. **Regge:** $\alpha'=1/(2\pi\sigma)=0.884\,\mathrm{GeV}^{-2}$ at $\sigma=0.18$; measured $\approx0.88$–$0.90$. My 4-state fit gives 0.91528; the **relativistic string** derivation is supported to 3.4 %; the non-relativistic linear potential gives $M\propto L^{2/3}$, no Regge line at all. §3.
5. **Corpus correction:** the corpus's gap action $C=3/(16b_0)=9\pi^2/22$ is **inconsistent with its own $R=\exp(-\beta/8b_0)$** under the standard $\beta=4/g^2$; the value forced is $C=1/(2b_0)=12\pi^2/11=10.7668$. The conclusion $\Delta_C\sigma_0=0$ **survives and gets stronger** — the corrected $C$ is nowhere near the Bessel lattice, so the 0.94 % near-miss Y-0138 had to firewall simply evaporates. §5.
6. **A corpus closed form.** Y-0143 measured $D_j\sim0.87\sqrt j$ for the diagonal isosceles $6j$ and asked in writing for "a uniform fold/Airy asymptotic" to upgrade it. Ponzano–Regge on the isosceles tetrahedron $V=\tfrac16b^2\sqrt{a^2-\tfrac12b^2}$ gives the constant exactly: $c=8\sqrt2/\Gamma(1/4)^2=4/(\sqrt\pi\,\varpi)=\mathbf{0.8606822}$, matching the corpus's own $j{=}100$ datum to $0.03\%$; and $\rho\beta^{1/4}\to2^{1/4}\Gamma(1/4)^2/(8\sqrt2)=\mathbf{1.3817029}$, inside the corpus's measured band $[1.29,1.43]$. §5.3.

---

*Written 2026-09-03. Probes: `research/probes/bf-r9-*.py`.*

## §1 · The Airy bridge: exact as an operator statement, REFUTED as spectroscopy

`bf-r9-airy.py`. **Method**: *exact* for the linear potential (Airy zeros, `scipy.special.ai_zeros`); for Cornell, **Numerov outward shooting with node counting** (bisection to $10^{-12}$, $N=2\times10^5$ steps) **cross-checked against tridiagonal diagonalisation** with Richardson extrapolation on two grids ($1.2$ and $2.4\times10^5$ points). The two methods agree to all six printed digits at every level; that agreement is the numerical certificate.

### 1.1 The linear potential *is* Airy's equation — exactly, with the boundary condition written down

**DERIVED-HERE (standard, but the seating matters).** For $V=\sigma r$, $\ell=0$, the reduced radial function $u=rR$ obeys $u''=2\mu(\sigma r-E)u$. Put $\kappa=(2\mu\sigma)^{1/3}$, $z=\kappa\,(r-E/\sigma)$; then $u''(z)=z\,u(z)$ — **Airy's equation, no approximation at all.** Normalisability kills $\mathrm{Bi}$; $u(0)=0$ forces $\mathrm{Ai}(z_0)=0$ at $z_0=-\kappa E/\sigma$:
$$\boxed{\;E_n=\Big(\frac{\sigma^2}{2\mu}\Big)^{1/3}|a_n|\;},\qquad a_n=n\text{-th zero of }\mathrm{Ai}.$$
MEASURED $a_{1..6}=-2.33810741,\,-4.08794944,\,-5.52055983,\,-6.78670809,\,-7.94413359,\,-9.02265085$; the semiclassical $a_n\simeq-[3\pi(4n-1)/8]^{2/3}$ is good to $0.5\%$ at $n{=}1$, $0.03\%$ at $n{=}3$ — that is Fable's $(n-\tfrac14)^{2/3}$. **The seed's operator statement is exact: the same $\mathrm{Ai}$, the same zeros, the same $\tfrac23$-power the fold envelope runs on.** For $\ell>0$ it is *not* Airy (the centrifugal $\ell(\ell{+}1)/r^2$ is not linear in $r$); Langer-corrected WKB $\int_0^{r_t}p\,dr=(n-\tfrac14)\pi$ is what survives.

### 1.2 The one number that decides it: the Airy ratio is rigid, and the data are not

$E_2/E_1=|a_2|/|a_1|=\mathbf{1.7484010469}$ — **independent of $\mu$, of $\sigma$, of everything.** Every $S$-wave splitting ratio in a purely linear world is a pure Airy number. That rigidity kills the seed as spectroscopy:
$$\frac{\Delta_{2S-1S}(b\bar b)}{\Delta_{2S-1S}(c\bar c)}\Big|_{\rm linear}=\Big(\frac{\mu_c}{\mu_b}\Big)^{1/3}=\mathbf{0.6786},\qquad \text{MEASURED}=\frac{10.023-9.460}{3.686-3.097}=\mathbf{0.9559}.$$
**The Airy law is 41 % wrong on the one ratio that has no free parameter.** Absolutely: pure-linear at $\sigma=0.18$ gives $\Delta_{2S-1S}=0.4873$ GeV (charm, $-17\%$) and $0.3307$ GeV (bottom, $-41\%$).

Fit the exponent instead. With $\Delta\propto\mu^{-p}$ the data give $p=\mathbf{0.0388}$. Pure linear demands $p=\tfrac13$; pure Coulomb $p=-1$; **a logarithm demands $p=0$.** Confirmed directly: MEASURED, $V=C\ln r$ with $C=0.733$ GeV gives $\Delta_{2S-1S}=0.588680$ GeV for *both* $\mu=0.75$ and $\mu=2.4$ — identical to eight digits — and that number is the measured charmonium splitting $0.589$ to $0.03\%$. This is Quigg–Rosner (KNOWN, 1977), and it is the honest reading: **in the region both systems probe, the effective potential is logarithmic — the geometric interpolation — which is precisely where neither the Coulomb nor the Airy limit is valid.**

### 1.3 Cornell, with the numbers

$V(r)=-\tfrac43\alpha_s/r+\sigma r$; $\alpha_s=0.39$, $\sigma=0.18\,\mathrm{GeV}^2$, $m_c=1.5$, $m_b=4.8$ GeV, $\mu=m/2$. MEASURED:

| system | $E_{1S}$ | $E_{2S}$ | $E_{3S}$ | $\Delta_{2-1}$ | $\Delta_{3-2}$ |
|---|---|---|---|---|---|
| charm ($\mu{=}0.75$) | $+0.326744$ | $+0.930388$ | $+1.372558$ | $\mathbf{0.603644}$ | $0.442170$ |
| bottom ($\mu{=}2.4$) | $-0.135663$ | $+0.445353$ | $+0.791294$ | $\mathbf{0.581016}$ | $0.345941$ |

$$\frac{\Delta_b}{\Delta_c}\Big|_{\rm Cornell}=\mathbf{0.9625}\quad\text{vs}\quad\text{MEASURED }0.9559\quad(\mathbf{0.7\,\%}).$$
With one additive constant per system fixed on the $1S$ ($V_0=-0.2297$ GeV charm, $-0.0043$ GeV bottom): $M(\psi(2S))=3.7006$ (meas. $3.686$, $+0.4\%$), $M(\Upsilon(2S))=10.0410$ (meas. $10.023$, $+0.18\%$). On the hook: $M(\psi(3S))=4.143$ (the usual $3S$ assignment $\psi(4040)$ — $2.4\%$ low, and open charm is why), $M(\Upsilon(3S))=10.387$ (meas. $10.355$, $+0.31\%$).

**The Coulomb term is not a perturbation here.** It moves the charm splitting $0.487\to0.604$ ($+24\%$) and the bottom splitting $0.331\to0.581$ ($+76\%$), and it is the *entire* reason the two splittings are nearly equal.

### 1.4 Where the Airy description holds, and exactly what the $1/r$ singularity does

Three statements, seated separately.

**(i) The crossover radius.** $\tfrac43\alpha_s/r=\sigma r$ at $r_*=\sqrt{(4\alpha_s/3)/\sigma}=\mathbf{1.69967\ GeV^{-1}}=0.3354$ fm. Pure-linear turning points $r_n=|a_n|/(2\mu\sigma)^{1/3}$: charm $3.62,\,6.32,\,8.54$; bottom $2.45,\,4.29,\,5.80$ GeV$^{-1}$. Every turning point is outside $r_*$ — but the inner half of each wavefunction is not, and that is where the $-1/r$ lives. The Airy limit is $r_1\gg r_*$; it is $2.1$ (charm) and $1.4$ (bottom). **Neither is a large number.** Since $r_n\propto n^{2/3}$, the Airy law becomes correct at large $n$: at the size of the corrections computed above, $10\%$ accuracy in the splitting needs $n\gtrsim20$ for bottomonium — far above open flavour. **The Airy régime of QCD is unobservable in quarkonium.**

**(ii) What the singularity does to the Airy zeros — precisely.** The Coulomb term does **not** make the solution singular. With $V=-a/r+\sigma r$, $u=r+c_2r^2+\dots$ and $c_2=-\mu a$: $u$ is analytic at $0$ and $u(0)=0$ still holds. What changes is the *quantisation condition*. The pure-linear WKB condition $\int_0^{r_t}p\,dr=(n-\tfrac14)\pi$ (hard wall $+$ one turning point) becomes a **two-turning-point** problem whose inner turning point is manufactured by the $-a/r$ well, and the $-\tfrac14$ becomes an $n$-dependent Coulomb phase. Operationally: **the Coulomb term does not move the Airy zeros; it removes the boundary condition that selected them.** That is exactly why §1.2's failure is a failure of *ratio*, not of scale.

**(iii) What survives.** The exact solvability of $V=\sigma r$ (a genuine special-function spectrum, the fold's own $\mathrm{Ai}$) and the large-$n$ law $E_n\to(\sigma^2/2\mu)^{1/3}[3\pi(4n{-}1)/8]^{2/3}$. Both belong on an instrument. "Quarkonium is Airy" does not.

**VERDICT ON THE SEED.** *Real at the level of the operator; dead at the level of the data.* $\mathrm{Ai}$ is simultaneously the exact eigenfunction of the confining potential and the exact envelope of the fold — one function, two theatres, and that is worth drawing. But the observed quarkonia sit in the logarithmic crossover, where the Airy law's single parameter-free prediction ($\mu^{-1/3}$) is wrong by $41\%$. **DERIVED-HERE exact / REFUTED as spectroscopy.**

---

## §2 · The strong-coupling side: $\sigma_0$ IS a string tension, and $A=2$ is a centre flip

`bf-r9-plaquette.py`, `bf-r9-plaq2.py`.

### 2.1 Exactly what lattice quantity $\sigma_0$ is (KNOWN; the corpus never says it this way)

Wilson action for SU($N$), $S=\frac\beta N\sum_p\mathrm{Re\,tr}\,U_p$, $\beta=2N/g^2$. For SU(2), $\mathrm{tr}\,U$ is real, $U=e^{i\theta\,\hat n\cdot\vec\sigma}$, $\mathrm{tr}\,U=2\cos\theta$, Haar measure $\tfrac2\pi\sin^2\theta\,d\theta$, and the single-plaquette generating integral is a Bessel function **exactly**:
$$Z_1=\int dU\,e^{\frac\beta2\mathrm{tr}U}=\frac2\beta I_1(\beta),\qquad \langle\chi_{1/2}\rangle=\langle\tfrac12\mathrm{tr}U\rangle=\frac{I_2(\beta)}{I_1(\beta)}.$$
Tile a large planar Wilson loop of area $A$ (in plaquettes) with the minimal surface; each plaquette must be "used" once by the character expansion, and each contributes one factor $I_2/I_1$. Hence
$$W(C)\simeq\Big[\frac{I_2(\beta)}{I_1(\beta)}\Big]^{A}=e^{-a^2\sigma A},\qquad\boxed{\;a^2\sigma\;=\;-\log\frac{I_2(\beta)}{I_1(\beta)}\;=\;\sigma_0(\beta)\;}$$
**So the corpus's "rate series" is, verbatim, the SU(2) lattice string tension in lattice units at leading (minimal-surface, no-fluctuation) order.** The corpus's own reading — Y-0084 (`YMD-DISK-01`, l. 339): "the rigorous OS-positive strong-coupling SU(2) singlet gap $am=-4\ln(I_2/I_1)\sim6/\beta$" — is the *same object times four*: the strong-coupling $0^{++}$ glueball is a closed loop of four plaquettes, so $am=4a^2\sigma$. MEASURED, that arithmetic stands: $4\sigma_0=0.0603007$ at $\beta=100$ against $6/\beta=0.06$ ($s_1=\tfrac32$ is the whole content of "$\sim6/\beta$").

### 2.2 The leading area law, SU(2) and SU(3), derived

Expand $e^{\frac\beta{2N}(\mathrm{tr}U+\mathrm{tr}U^\dagger)}$ to first order and use $\int|\mathrm{tr}\,U|^2dU=1$:
$$W_{\rm 1\,plaq}=\Big\langle\tfrac1N\mathrm{tr}\,U\Big\rangle\simeq\frac{\beta}{2N^2}\quad(N\ge3),\qquad \frac\beta4\quad(N=2,\ \text{pseudo-real: }\mathrm{tr}U=\mathrm{tr}U^\dagger\text{ doubles it}).$$
$$\boxed{\;a^2\sigma_{SU(2)}=\ln\frac4\beta+O(\beta^2),\qquad a^2\sigma_{SU(3)}=\ln\frac{18}\beta+O(\beta^2),\qquad a^2\sigma_{SU(N\ge3)}=\ln\frac{2N^2}\beta\;}$$
MEASURED (`bf-r9-plaquette.py`, sympy exact), the full SU(2) function is
$$-\log\frac{I_2}{I_1}=\ln\frac4\beta+\frac{\beta^2}{24}-\frac{\beta^4}{576}+\frac{37\beta^6}{414720}-\frac{13\beta^8}{2654208}+\cdots$$
(the numerical least-squares fit of the probe recovers $0.0416667,-0.00173611,8.92168\times10^{-5},-4.89378\times10^{-6}$ — i.e. $\tfrac1{24},-\tfrac1{576},\tfrac{37}{414720},-\tfrac{13}{2654208}$, to seven digits). **HONEST SCOPE:** this is the *single-plaquette-per-tile* tension. The true strong-coupling series for $a^2\sigma$ differs from it starting at the order where non-minimal surfaces enter, and it has a physical singularity at the **roughening transition** ($\beta_r\approx2.2$ for SU(2), KNOWN), which the single-plaquette function cannot see. An instrument that plots $-\log(I_2/I_1)$ past $\beta\approx2$ and calls it "the string tension" is lying.

### 2.3 $A=2$ has a physical name: the $\mathbb Z_2$ centre flip

This is the result I most want on the record.

**Theorem Q1 (DERIVED-HERE).** *In the single-plaquette action $S(\theta)=-\beta\cos\theta$ on SU(2), there are exactly two critical points on the real slice: $\theta=0$ ($U=+\mathbb 1$, $S=-\beta$) and $\theta=\pi$ ($U=-\mathbb 1$, $S=+\beta$). Their action difference is*
$$\Delta S=S(-\mathbb 1)-S(+\mathbb 1)=2\beta\quad\text{EXACTLY,}$$
*and $-\mathbb 1$ is the nontrivial element of the centre $\mathbb Z_2\subset SU(2)$. Hence Theorem S1's Borel constant $A=2$ is the action of **one centre flip of one plaquette**, and the singular support $2\mathbb N$ of $\mathcal B[\sigma_0]$ is the $n$-flip tower.*

MEASURED: $-\log(K_1(\beta)/I_1(\beta))/\beta=1.74046,\,1.87799,\,1.94089,\,1.97091,\,1.98557$ at $\beta=5,10,20,40,80$ — the recessive/dominant Bessel ratio *is* $e^{-2\beta}$, and $\big(K_1/I_1\big)/e^{-2\beta}\to\pi$ ($3.2011$ at $\beta=40$; the corpus's Y-0133 already had this limit). Exact $s_k$ from the Y-0128 Riccati $\sigma_0'=\tfrac3\beta-2\sinh\sigma_0$, generated in $\mathbb Q$ to $k=62$ (`bf-r9-plaq2.py`): $s_{1..8}=\tfrac32,\tfrac34,\tfrac3{16},-\tfrac9{16},-\tfrac{2331}{1280},-\tfrac{279}{64},-\tfrac{153063}{14336},-\tfrac{3861}{128}$ — reproducing Y-0128's four and extending them. Gevrey ratio $|s_{k+1}|/((k{+}1)|s_k|)=0.4206,\,0.4698,\,0.4812,\,0.4863,\,0.4893,\,0.4912$ at $k=10..60$: $A_{\rm eff}=2.036$ at $k=60$, converging to $2$ from **above**, which is why the corpus's short Richardson window $[1.95,2.03]$ and its Borel–Padé pole $2.26$ both landed where they did. Theorem S1's four-term dictionary gives $s_k^{\rm pred}/s_k^{\rm exact}=0.99999223$ at $k=60$ (R4's eight-term version reached $1.2\times10^{-10}$).

**Why this is more than a relabelling.** Y-0138 argues $\Delta_C\sigma_0=0$ *arithmetically*: "$C/2=9\pi^2/44$ is transcendental, so $C$ lies off the $2\mathbb Z$ singular-support lattice." Theorem Q1 replaces that with a *structural* reason: **the alien content of a single-plaquette observable is exhausted by centre flips of that plaquette.** The gap action $C$ is a renormalisation-group object of the continuum theory; it has no single-plaquette centre avatar, so it cannot appear, transcendental or not. This upgrades the corpus's "provenance-distinct numerology, firewalled (Y-0095/T-1075)" remark from a *decision to firewall* into a *derivation of why no firewall is needed*.

**And it is physics, not bookkeeping.** $\mathbb Z_2$ centre flips are exactly the objects of the centre-vortex picture of confinement (KNOWN; Greensite's review, `hep-lat/0301023`). The statement "the non-perturbative ambiguity of the SU(2) strong-coupling tension is $e^{-2\beta}$ per plaquette, and $2\beta$ is the centre-flip action" is the crudest possible instance of the centre-vortex mechanism, visible in a Bessel function.

### 2.4 Does the SADDLE LADDER (A.9) apply to the plaquette integral? **No — and I can say by how much.**

Fable's A.9: $I_p(\gamma)=\frac1{\sqrt{2\pi}}\int e^{-u^2/2+i\gamma u^p}du$, $|\Delta S_p|=\frac{p-2}{2p}(p\gamma)^{-2/(p-2)}$, giving $\tfrac1{54}$ at $p=3$ and $\tfrac i{16}$ at $p=4$. Josh's brief asks whether the plaquette integral is a member. **Formally yes, and the formal answer is wrong by 25 %.**

Expand the phase: $e^{\beta\cos\theta}=e^\beta\exp\!\big(-\tfrac{\beta\theta^2}2+\tfrac{\beta\theta^4}{24}-\tfrac{\beta\theta^6}{720}+\cdots\big)$; rescale $u=\sqrt\beta\,\theta$:
$$=e^\beta\exp\Big(-\frac{u^2}2+\frac{u^4}{24\beta}-\frac{u^6}{720\beta^2}+\cdots\Big).$$
Truncating at the quartic **is** A.9's $p=4$ member with $i\gamma=1/(24\beta)$. Its formula gives $|\Delta S_4|=1/(16\gamma)=\mathbf{\tfrac32\beta}$ — against the exact $\mathbf{2\beta}$. Sharpening this into a ladder (MEASURED, sympy exact roots of the truncated $\beta(1-\cos\theta)$):

| truncation of $\beta(1-\cos\theta)$ | competing saddle $\theta_2$ | $\Delta S$ |
|---|---|---|
| quadratic | none | — |
| quartic ($=$ A.9 $p{=}4$) | $\sqrt6=2.449490$ | $1.500000\,\beta$ |
| sextic | **none real** ($x^2-20x+120=0$ has no real root) | — |
| octic | $3.078642$ | $1.978379\,\beta$ |
| **exact $\cos\theta$** | $\pi$ | $\mathbf{2\beta}$ |

**Theorem Q2 (DERIVED-HERE).** *The polynomial-phase saddle ladder is not an asymptotic scheme for the plaquette integral. Its members alternate between existing and not existing ($1.5\beta$, none, $1.978\beta$, …), because A.9's competing saddle is generated by the **truncation** whereas the plaquette's competing saddle is the **global** critical point $\theta=\pi$ of a compact group manifold — a fixed point of the exact phase, not a coalescence.*

The structural distinction, which I think is the real content:

| | A.9 family (fold, cusp, revival) | plaquette / Bessel |
|---|---|---|
| second saddle | **runs with the coupling**, $u_2^{p-2}=1/(ip\gamma)$ | **fixed** at $\theta=\pi$ (the centre element) |
| singulant | fractional power $\propto\gamma^{-2/(p-2)}$ | **linear** in the large parameter, $2\beta$ |
| Borel plane | pole at $\beta^2=-\tfrac1{54}$, $\chi_4=-\tfrac i{16}$ | lattice $2\mathbb N$ on the real axis |
| summability on the real axis | Borel-summable ($p{=}3$: pole on the negative axis) | **not** summable ($\chi=+2$, $e^{-2\beta}$ real and small) |

So Thread A's calculus does reach the corpus's Bessel case — Theorem S1 is precisely that reach, and R5 already recorded that the two share "one calculus, two classical pairs, $(\mathrm{Ai},\mathrm{Bi})$ and $(I_\nu,K_\nu)$". What does **not** transfer is the *ladder*: the $\tfrac1{54}$ and $\tfrac i{16}$ are coalescence numbers and the plaquette has no coalescence.

**Where an honest A.9 member *does* live in this subject** (KNOWN, and it is worth the instrument's while): the large-$N$ single-plaquette (Gross–Witten–Wadia) model has a third-order phase transition at 't Hooft coupling $\lambda=2$, at which the eigenvalue density's support closes and two saddles **do** coalesce; the double-scaling limit there is governed by Painlevé II with an Airy/fold normal form. That is a genuine $p=3$ member, and it is *not* the finite-$N$ plaquette integral of §2.1.

### 2.5 The radius of convergence in $\beta$, and the two planes kept apart

$\sigma_0=\ln(4/\beta)+h(\beta)$ with $h$ analytic at $0$. The nearest singularities are the zeros of $I_1$ and $I_2$, which lie on the imaginary axis at $\beta=i\,j_{1,k}$ and $i\,j_{2,k}$. MEASURED $j_{1,1}=3.83170597$, $j_{2,1}=5.135622302$:
$$\boxed{\;R_{\rm conv}\big(\sigma_0-\ln\tfrac4\beta\big)=j_{1,1}=3.8317059702\;}$$
**Answering Josh's question directly: no, $A=2$ is *not* a radius of convergence in $\beta$, and the two must not be confused.** $A=2$ lives in the **Borel plane conjugate to $1/\beta$** and governs the *divergent weak-coupling* asymptotics; $3.8317$ lives in the **$\beta$-plane** and bounds the *convergent strong-coupling* expansion. They are different planes and different physics. And the physically decisive number is neither: the SU(2) roughening transition at $\beta_r\approx2.2$ and deconfinement at $\beta_c\approx2.3$ (KNOWN) both sit *inside* $|\beta|<3.83$, so the convergence radius of the single-plaquette function is not the obstruction anyone cares about. That is the correct, deflationary answer, and it is worth having in writing.

---

## §3 · Regge — the number picks the relativistic string, unambiguously

`bf-r9-regge.py`.

### 3.1 The two derivations

**(RS) Rotating relativistic string, massless ends (DERIVED-HERE, standard).** A straight rod of tension $\sigma$ and half-length $R$ rotating so its ends move at $c$, $v(r)=r/R$:
$$M=\int_{-R}^{R}\frac{\sigma\,dr}{\sqrt{1-v^2}}=\pi\sigma R,\qquad J=\int_{-R}^{R}\frac{\sigma\,r\,v\,dr}{\sqrt{1-v^2}}=\frac\pi2\sigma R^2\ \Longrightarrow\ \boxed{\;J=\frac{M^2}{2\pi\sigma},\quad\alpha'=\frac1{2\pi\sigma}\;}$$
$$\alpha'(\sigma=0.18\ \mathrm{GeV}^2)=\mathbf{0.884194\ GeV^{-2}}.$$

**(NR) Non-relativistic Schrödinger with $V=\sigma r$ (DERIVED-HERE).** Circular orbit: $\sigma=L^2/(\mu R^3)$ gives $R=(L^2/\mu\sigma)^{1/3}$ and
$$E=\frac{L^2}{2\mu R^2}+\sigma R=\frac32\sigma R=\frac32\Big(\frac{\sigma^2L^2}{\mu}\Big)^{1/3}\propto L^{2/3}.$$
$M=2m+E$ is then $2m+cL^{2/3}$: **$M^2$ is not linear in $L$ at any $L$, and no slope $\alpha'$ exists.** MEASURED (matrix diagonalisation, $\ell=4,8,16,32,64$, $\sigma=0.18$): the local exponent $d\ln E/d\ln\ell=0.5354,\,0.5937,\,0.6280,\,0.6468$ — climbing to $\tfrac23$, and *identical for $m=1.5$ and $m=4.8$* (as it must be: $E\propto\mu^{-1/3}f(\ell)$). The would-be slope $\Delta\ell/\Delta M^2$ is neither constant nor mass-independent: $0.554,\,0.566,\,0.555,\,0.519$ for $m=1.5$ and $0.371,\,0.427,\,0.484,\,0.533$ for $m=4.8$.

### 3.2 The measurement, and the verdict

PDG central masses on the $\rho$/$a$ trajectory, $J$ against $M^2$:

| state | $M$ (GeV) | $M^2$ | $J$ |
|---|---|---|---|
| $\rho(770)$ | $0.77526$ | $0.6010$ | 1 |
| $a_2(1320)$ | $1.3182$ | $1.7377$ | 2 |
| $\rho_3(1690)$ | $1.6888$ | $2.8520$ | 3 |
| $a_4(1970)$ | $1.9670$ | $3.8691$ | 4 |

Least squares $J=\alpha'M^2+\alpha_0$: $\boxed{\alpha'=\mathbf{0.91528\ GeV^{-2}},\ \alpha_0=0.4269}$, residuals $+0.023,-0.017,-0.037,+0.032$ — a straight line to $\pm0.04$ in $J$ over four states. Inverting, $\sigma=1/(2\pi\alpha')=\mathbf{0.17389\ GeV^2}$.

$$\alpha'_{\rm string}(\sigma{=}0.18)=0.8842\quad\text{vs}\quad\alpha'_{\rm meas}=0.9153\qquad\Rightarrow\qquad\mathbf{3.4\%}.$$

**VERDICT.** *The number supports the relativistic-string derivation and refutes the non-relativistic one, and not marginally.* The lattice string tension and the light-meson Regge slope — two measurements with nothing in common — agree through $\alpha'=1/(2\pi\sigma)$ to $3.4\%$. The non-relativistic linear potential does not merely get the slope wrong: **it does not produce a linear trajectory at all** ($E\propto L^{2/3}$). Anyone who quotes "$\alpha'=1/(2\pi\sigma)$" as coming from a Schrödinger equation with a linear potential is quoting the wrong derivation for the right number.

*(Sanity: $\sqrt\sigma=0.4243$ GeV $=2.150\ \mathrm{fm}^{-1}$; $\sigma=0.912$ GeV/fm $\approx1.46\times10^5$ N $\approx15$ tonnes-force. That is the number an instrument's tooltip should carry.)*

---

## §4 · The flux tube: what an instrument may honestly draw

`bf-r9-flux.py`.

### 4.1 The Lüscher term — EXACT and UNIVERSAL, and the one thing here that is a theorem

**KNOWN (Lüscher–Symanzik–Weisz 1980; Lüscher–Weisz 2004).** Any effective string with $d-2$ massless transverse Goldstone modes has ground-state energy
$$V(r)=\sigma r+\mu-\frac{\pi(d-2)}{24\,r}+O(r^{-3}),\qquad d=4:\ \ \boxed{-\frac{\pi}{12\,r}}$$
The coefficient $\pi(d-2)/24$ is **universal** — it is a Casimir energy of free transverse fluctuations and depends on nothing else, not the gauge group, not the representation, not the regularisation. That is the strongest statement in this entire round. It is also *measured*: lattice extractions of the $1/r$ coefficient in compact U(1) in $3{+}1$d give $\approx0.274$ against $\pi/12=0.2618$ (5 %); the corresponding SU($N$) and $d=3$ tests are tighter.

MEASURED sizes at $\sigma=0.18\,\mathrm{GeV}^2$ ($\hbar c=0.19733$ GeV fm):

| $r$ (fm) | $\sigma r$ (GeV) | $-\pi/12r$ (GeV) | ratio | Arvis $V(r)$ |
|---|---|---|---|---|
| $0.30$ | $0.27366$ | $-0.17220$ | $0.629$ | — (below $r_c$) |
| $0.40$ | $0.36488$ | $-0.12915$ | $0.354$ | $0.19720$ |
| $0.50$ | $0.45610$ | $-0.10332$ | $0.227$ | $0.33731$ |
| $1.00$ | $0.91219$ | $-0.05166$ | $0.0566$ | $0.85898$ |
| $1.50$ | $1.36829$ | $-0.03444$ | $0.0252$ | $1.33340$ |

**The Nambu–Goto (Arvis) resummation**, KNOWN:
$$V_{\rm NG}(r)=\sigma r\sqrt{1-\frac{\pi(d-2)}{12\sigma r^2}}\ \xrightarrow{d=4}\ \sigma r\sqrt{1-\frac{\pi}{6\sigma r^2}}=\sigma r-\frac{\pi}{12r}-\frac{\pi^2}{288\,\sigma r^3}-\cdots$$
with a **critical radius** $r_c=\sqrt{\pi(d{-}2)/(12\sigma)}=\sqrt{\pi/(6\sigma)}=\mathbf{1.70554\ GeV^{-1}=0.3365\ fm}$ below which the square root goes complex — the tachyonic breakdown of the free-string picture, and the honest short-distance boundary of any flux-tube panel. The third-order term is $2.57\%$ of $\sigma r$ at $0.5$ fm and $0.16\%$ at $1$ fm.

**A coincidence I flag rather than claim.** $r_c=1.70554$ GeV$^{-1}$ and the Cornell crossover $r_*=\sqrt{(4\alpha_s/3)/\sigma}=1.69967$ GeV$^{-1}$ agree to $0.35\%$. They coincide identically iff $\alpha_s=\pi/8=0.392699$, against the standard $0.39$ ($0.69\%$). There is a *near*-mechanism — one identifies the Lüscher term with a Coulomb-like $1/r$ — but matching $-\pi/12r$ to $-\tfrac43\alpha_s/r$ gives $\alpha_s=\pi/16=0.1963$, a **factor of two off**. So the mechanism does not close, and by the corpus's own firewall discipline (Y-0095/T-1075) this stays a flagged numerical coincidence and **must not be drawn as a relationship.**

### 4.2 The dual-superconductor / Nielsen–Olesen vortex — the field equations, and where the honesty line falls

**The model (KNOWN; Nielsen–Olesen 1973, Abrikosov 1957).** Dual abelian Higgs: dual gauge field $B_\mu$ (coupling to magnetic charge), monopole condensate $\phi$,
$$\frac{\mathcal E}{L}=\int d^2x\Big[\tfrac12 B^2+|(\nabla-ieA)\phi|^2+\tfrac\lambda4(|\phi|^2-v^2)^2\Big].$$
Ansatz $\phi=v\,f(\rho)e^{in\theta}$, $A_\theta=\dfrac{n}{e\rho}a(\rho)$. With $m_v=\sqrt2\,ev$, $m_s=\sqrt\lambda\,v$, $\kappa\equiv m_s/m_v$ and $x=m_v\rho$, the profile equations are **DERIVED-HERE** (Euler–Lagrange of the reduced functional):
$$\boxed{\;f''+\frac{f'}x-\frac{n^2(1-a)^2f}{x^2}=\frac{\kappa^2}{2}f(f^2-1),\qquad a''-\frac{a'}x+(1-a)f^2=0\;}$$
$$f(0)=a(0)=0,\quad f(\infty)=a(\infty)=1,$$
$$\frac{\mathcal E}{L}=2\pi v^2\!\int_0^\infty\!\!dx\Big[\frac{n^2a'^2}{x}+xf'^2+\frac{n^2(1-a)^2f^2}{x}+\frac{\kappa^2}4x(f^2-1)^2\Big].$$

**Two things here are theorems.**

1. **Flux quantisation.** $\Phi=\oint A\cdot d\ell=2\pi n/e$ exactly, forced by $a(\infty)=1$ and single-valuedness. MEASURED $a(30)=1.0000000000$.
2. **The Bogomolny bound.** Completing the square gives $\mathcal E/L\ge 2\pi n v^2$, saturated **iff $\kappa=1$**, where the second-order system collapses to $f'=n(1-a)f/x$, $a'=x(1-f^2)/(2n)$. MEASURED (`solve_bvp`, tol $10^{-10}$): $\mathcal E/(2\pi v^2)=\mathbf{1.00000000}$ at $(\kappa,n)=(1,1)$, $\mathbf{2.00000000}$ at $n=2$, $\mathbf{3.00000000}$ at $n=3$ — the bound saturated to eight digits, and the $n$-linearity (no vortex–vortex force at BPS) with it.

MEASURED tension away from BPS, $n=1$, in units of $2\pi v^2$:

| $\kappa=m_s/m_v$ | $0.50$ | $0.80$ | $1.00$ | $1.25$ | $2.00$ | $4.00$ |
|---|---|---|---|---|---|---|
| $\mathcal E/2\pi v^2$ | $0.75742$ | $0.91231$ | $\mathbf{1.00000}$ | $1.09793$ | $1.34059$ | $1.79254$ |
| type | I | I | BPS | II | II | II |

BPS profile ($x=m_v\rho$), MEASURED:

| $x$ | 0 | 0.5 | 1.0 | 2.0 | 3.0 | 4.0 | 6.0 | 8.0 |
|---|---|---|---|---|---|---|---|---|
| $f$ | 0 | $0.29257$ | $0.53788$ | $0.83109$ | $0.94332$ | $0.98123$ | $0.99788$ | $0.99975$ |
| $a$ | 0 | $0.05977$ | $0.21103$ | $0.56593$ | $0.80086$ | $0.91566$ | $0.98625$ | $0.99788$ |
| $B\propto a'/x$ | $0.50018$ | $0.45720$ | $0.35534$ | $0.15464$ | $0.05507$ | $0.01860$ | $0.00212$ | $0.00025$ |

Tails, exact: $1-f\sim K_0(\kappa x)$ (scalar, mass $m_s$), $1-a\sim x\,K_1(x)$ (gauge, mass $m_v$).

**WHERE THE HONESTY LINE FALLS.** Everything above is an exact statement *about the dual abelian Higgs model*. The identification of that model with QCD's chromoelectric flux tube is a **MODEL**, not a solution: it presupposes abelian dominance and monopole condensation, and $\kappa$, $v$, $e$ are **fitted** to lattice profiles (which come out near $\kappa\approx1$, i.e. borderline type I/II — a fit result, not a prediction). A panel showing this vortex is showing Nielsen–Olesen, not QCD, and its label must say so.

### 4.3 Logarithmic broadening — the coefficient is exact, the offset is a fit

**KNOWN (Lüscher–Münster–Weisz 1981).** The mean-square transverse width at the flux-tube midpoint grows logarithmically:
$$w^2(r)=\frac{d-2}{2\pi\sigma}\ln\frac{r}{r_0}\ \xrightarrow{d=4}\ \frac1{\pi\sigma}\ln\frac{r}{r_0}.$$
MEASURED coefficient at $\sigma=0.18$: $1/(\pi\sigma)=\mathbf{1.76839\ GeV^{-2}}=\mathbf{0.068857\ fm^2}$ **per e-fold of $r$**. With $r_0=0.30$ fm, $w(r)=0.188,\,0.260,\,0.288,\,0.333,\,0.361$ fm at $r=0.5,0.8,1.0,1.5,2.0$ fm. Lattice measurements of the flux-tube width find $w\approx0.3$ fm near $r\approx1$ fm and confirm the logarithm at $r\gtrsim1.5/\sqrt\sigma$. **The coefficient $(d-2)/2\pi\sigma$ is exact and universal; $r_0$ is a fit, and it is the only free number in the formula.** An instrument may draw the *slope* and must label $r_0$ as fitted.

---
## §5 · Corpus bridges — four, of which one is a correction and one is a closed form the corpus asked for

All citations `/home/joshua-hosain/Documents/LUX JSY LIBRARY/ALL DISK ⟡/YMD-DISK-01 COMPENDIUM.md` unless stated.

### 5.1 BRIDGE (extension) — Y-0084 / Y-0128 / Y-0138: the rate series has a name and the Borel constant has a mechanism

Y-0084 (l. 339) calls $-4\ln(I_2/I_1)$ "the rigorous OS-positive strong-coupling SU(2) singlet gap … $\sim6/\beta$". Y-0128 (l. 477) gives its Riccati generator. Y-0138 (l. 563) reads its Borel singularity $A=2$ off numerically. **None of the three says what the object is.** §2.1–§2.3 supply both halves:

- $\sigma_0(\beta)=-\log(I_2/I_1)$ **is** the leading strong-coupling **string tension** $a^2\sigma$ of SU(2) — the area law read off the character expansion — and Y-0084's factor 4 is the four-plaquette strong-coupling glueball. Extension: the analogue for SU($N\ge3$) is $a^2\sigma=\ln(2N^2/\beta)$, i.e. $\ln(18/\beta)$ for SU(3); and the exact SU(2) function is $\ln(4/\beta)+\tfrac{\beta^2}{24}-\tfrac{\beta^4}{576}+\tfrac{37\beta^6}{414720}-\tfrac{13\beta^8}{2654208}+\cdots$.
- $A=2$ **is** the $\mathbb Z_2$ centre-flip action $S(-\mathbb 1)-S(+\mathbb 1)=2\beta$ (Theorem Q1). The lattice $2\mathbb N$ is the $n$-flip tower; it is derived rather than measured, and $\Delta_C\sigma_0=0$ follows from a structural fact (a single-plaquette observable has only centre-flip alien content) rather than from the transcendence of $9\pi^2/44$.

**Corpus numbers re-verified, and they STAND.** Y-0080/Y-0084's rate-mismatch ratios: MEASURED $am_{\rm strong}/am_{\rm cont}=\mathbf{728.84}$ at $\beta=2$ (corpus: 729) and $\mathbf{7.938\times10^4}$ at $\beta=4$ (corpus: $7.9\times10^4$). Exact. Y-0128's $s_1..s_4=\tfrac32,\tfrac34,\tfrac3{16},-\tfrac9{16}$: reproduced from the Riccati in exact $\mathbb Q$ and **extended to $k=62$** (`bf-r9-plaq2.py`); $s_{5..8}=-\tfrac{2331}{1280},-\tfrac{279}{64},-\tfrac{153063}{14336},-\tfrac{3861}{128}$.

### 5.2 CORRECTION — Y-0138 / Y-0139 / Y-0140 / Y-0151: the gap action $C=3/(16b_0)$ is not the dimensional-transmutation action

`bf-r9-corpus.py`. The corpus asserts, in four places with the (correct, Y-0140-repaired) $b_0=11N/(48\pi^2)=11/(24\pi^2)$ at $N=2$:
$$R=\exp(-\beta/8b_0)=\exp(-C/g^2),\qquad C=\tfrac3{16b_0}=\tfrac{9\pi^2}{22}=4.0375654368,\qquad \tfrac1{8b_0}=\tfrac{3\pi^2}{11}=2.6917102912.$$
**The coefficient of $\beta$ is right and the constant $C$ is not, and the two are inconsistent with each other.** One-loop, $\Lambda=\mu\exp(-1/2b_0g^2)$; on the lattice $\mu=1/a$, $g^2=2N/\beta=4/\beta$, so $a\Lambda_L=\exp(-\beta/8b_0)$ ✓ — the corpus has $1/(8b_0)=3\pi^2/11$ exactly right. But substituting $\beta=4/g^2$ back into $\exp(-\beta/8b_0)$ gives $\exp\big(-1/(2b_0g^2)\big)$, so
$$\boxed{\;C=\frac1{2b_0}=\frac{12\pi^2}{11}=\mathbf{10.7668411648}\;}\qquad\text{not}\qquad \frac3{16b_0}=\frac{9\pi^2}{22}=4.0376.$$
MEASURED $C_{\rm corpus}/C_{\rm forced}=0.375=\tfrac38$ **exactly** (to $6.7\times10^{-52}$). The corpus writes $3/(16b_0)$ where $\beta=4/g^2$ forces $8/(16b_0)$; for $3/(16b_0)$ to be right one would need $\beta=\tfrac3{2g^2}$, which is neither the SU(2) ($2N/g^2=4/g^2$) nor the SU(3) ($6/g^2$) Wilson convention. I could not construct a convention in which $3/16$ is correct, so I flag it rather than assert a cause. *(One possible provenance: $3/(16b_0)$ evaluated at $N=3$ gives exactly $3\pi^2/11=2.6917$, the very number that is $1/(8b_0)$ at $N=2$ — the kind of cross-$N$ collision that produces this sort of leftover.)*

**What changes, by number.**

| corpus quantity | corpus value | corrected value | changes? |
|---|---|---|---|
| $b_0$ (SU(2)) | $11/24\pi^2=0.0464389$ | unchanged | no (Y-0140 already fixed it) |
| $1/(8b_0)$, coefficient of $\beta$ | $3\pi^2/11=2.6917103$ | unchanged | **no** |
| rate-mismatch ratios (Y-0080) | 729, $7.9\times10^4$ | unchanged | **no** (computed in $\beta$) |
| gap action $C$ | $9\pi^2/22=4.0375654$ | $12\pi^2/11=\mathbf{10.7668412}$ | **yes** |
| $C/2$ vs the Bessel lattice $2\mathbb N$ | $2.018783$, **$0.94\%$ from 4** | $5.383421$, $\mathbf{7.67\%}$ **from 10** | **yes** |
| $\exp(-C/6)$ "level-gap residue" (Y-0151/Y-0129) | $0.5102127$ | $\exp(-2\pi^2/11)=\mathbf{0.1662149}$ | **yes** |
| $|C-4|$ near-miss (Y-0138 Remark) | $0.0376$, firewalled | **does not exist** | **yes** |

**The conclusion the corpus cares about SURVIVES AND IMPROVES.** Y-0138's $\Delta_C\sigma_0=0$ was argued past an uncomfortable $0.94\%$ near-miss to the lattice point 4, which the entry had to firewall as "provenance-distinct numerology (Y-0095/T-1075)". With $C=12\pi^2/11$ the nearest lattice point is 10 at $7.67\%$ — **the near-miss simply evaporates and the firewall becomes unnecessary.** Two of the corpus's five "F-escape detectors" (Y-0151) are re-labelled by this and none is lost: $A=0.401983$, $p=1/4$, $C=10.7668$ remain provably pairwise distinct, so Y-0151's anti-collapse discipline is unaffected. Seated **DERIVED-HERE; corpus entry UNVERIFIED as written.** *If the corpus intends $C$ in a rescaled coupling, the entry must name the coupling; as written with $\beta=2N/g^2$ it does not close.*

Three actions on the SU(2) lattice, all distinct, for the record: Bessel/centre $8/g^2$ ($=2\beta$), gap $10.7668/g^2$, one-instanton $8\pi^2/g^2=78.9568/g^2$.

### 5.3 BRIDGE (closed form) — Y-0143's $D_j\sim0.87\sqrt j$ is $\;c=8\sqrt2/\Gamma(1/4)^2$, and this is the "uniform fold/Airy asymptotic" Y-0143 asked for

`bf-r9-sixj.py`. Y-0143 (l. 607) MEASURES the diagonal isosceles denominator $D_j=\sum_J(2J{+}1)|\{jjJ;jjJ\}|$ to $j=800$ and reports $D_j\sim0.87\sqrt j$ ("$D/\sqrt j$: $0.879,0.860,0.859,0.856,0.866$, flat"), then states its own upgrade residue: *"a uniform fold/Airy asymptotic of the diagonal isosceles $|6j|$ is needed to upgrade $\rho\to0$ to PROVED."* **That asymptotic is Thread A's own machinery, and here is its constant.**

**Theorem Q3 (DERIVED-HERE).** *Write $a=j+\tfrac12$, $b=J+\tfrac12$. The $6j$ symbol $\{jjJ;jjJ\}$ is the tetrahedron with four edges $a$ and two opposite edges $b$, of volume*
$$V(a,b)=\tfrac16 b^2\sqrt{a^2-\tfrac12b^2}\qquad(\text{real iff }b\le a\sqrt2).$$
*Ponzano–Regge gives $|\{jjJ;jjJ\}|\simeq|\cos(S+\tfrac\pi4)|/\sqrt{12\pi V}$ with $\langle|\cos|\rangle=2/\pi$, so with $2J+1=2b$,*
$$D_j\simeq\frac{4}{\pi\sqrt{2\pi}}\int_0^{\sqrt2 a}\frac{db}{(a^2-\tfrac12b^2)^{1/4}}=c\,\sqrt{a},\qquad
\boxed{\;c=\frac{4\sqrt2\,\Gamma(3/4)^2}{\pi^2}=\frac{8\sqrt2}{\Gamma(1/4)^2}=\frac{4}{\sqrt\pi\,\varpi}=\mathbf{0.8606822266}\;}$$
*with $\varpi=2.6220575543$ the lemniscate constant. Consequently, with $j_{\rm eff}=\sqrt{\beta/2}$,*
$$\rho(\beta)=\frac1{D_j}\sim\frac{2^{1/4}}{c}\,\beta^{-1/4},\qquad \boxed{\;\lim_{\beta\to\infty}\rho\,\beta^{1/4}=\frac{2^{1/4}\Gamma(1/4)^2}{8\sqrt2}=\mathbf{1.3817028843}\;}$$

**Against the corpus's own measurements, both hit.** Y-0143's $D_j/\sqrt j$ at $j=100$ is $0.860$; $c=0.86068$ ($0.03\%$). Y-0143's band for $\rho\beta^{1/4}$ is $[1.29,1.43]$ "no drift over $\beta=4..3.2\times10^5$"; the derived constant $1.38170$ is inside it, $15\%$ of a band-width from the centre. Independent verification here (exact Racah sums, mpmath dps 40): $D_{100}=8.6028993$ against $c\sqrt{100.5}=8.6283125$, ratio $0.997055$.

**Honest residual, and it converges.** The individual $D_j$ oscillate about $c\sqrt a$ (ratios $0.9659,\,1.0223,\,0.9805,\,1.0787,\,0.9971,\,1.0387$ at $j=10,20,40,60,100,150$), but block statistics over consecutive $j$ show the excess dying (`bf-r9-sixj2.py`):

| block | mean $D_j/(c\sqrt{j+\tfrac12})$ | s.d. |
|---|---|---|
| $j\in[60,80]$ | $1.018767$ | $0.031192$ |
| $j\in[100,120]$ | $\mathbf{1.014207}$ | $0.025045$ |

Mean excess $1.88\%\to1.42\%$ as $j$ goes $70\to110$ — decaying roughly as $j^{-1}$ — and the oscillation amplitude shrinking with it. *(The $j\in[180,200]$ block is discarded: at `mp.dps=30` the alternating Racah sum loses to cancellation and returns nonsense — a precision limit of my probe, not a feature. Anyone repeating this needs dps $\gtrsim\!j/2$.)* The oscillation is expected: the endpoint $b=a\sqrt2$ is exactly a **fold**, where $V\to0$ and the Ponzano–Regge form fails; the uniform description there is an **Airy** function and its endpoint contribution is the subleading term. **So Y-0143's requested "uniform fold/Airy asymptotic" is precisely: leading term $c\sqrt a$ with $c=8\sqrt2/\Gamma(1/4)^2$ (given here), plus an Airy endpoint correction at $b=a\sqrt2$ (not computed here — see Q51).** This is a Thread-A object appearing inside the corpus's Yang–Mills wing, and it is the cleanest connection between the two threads this programme has produced.

### 5.4 BRIDGE (structural) — Y-0139's $\mathrm{Ext}^1$ class, and where the flux tube is *not* it

Y-0139 (l. 571) makes the gap the class $[\theta=2C/g^3]$ of an irregular connection, pole order 3, "the VALUE is the unknown Stokes constant $S_1$". Two corrections of emphasis, by number:

1. With §5.2's $C=12\pi^2/11$ the class is unchanged (pole order 3 and irregularity 2 are $C$-independent), but its **residue** is $12\pi^2/11$, not $9\pi^2/22$. Y-0139's "K1: at $g=0.1$ the section $\exp(+C/g^2)\sim2.2\times10^{175}$" becomes $\sim10^{467}$. The kill survives a fortiori.
2. **The flux tube does not supply $S_1$.** Y-0084's L6 named "the Nielsen–Olesen / dual abelian-Higgs vortex gap" as a front. §4.2 shows exactly what that front can deliver: an *exact* Bogomolny bound $\mathcal E/L\ge2\pi nv^2$ saturated at $\kappa=1$ (MEASURED to $10^{-8}$), and *nothing at all* about $S_1$ — because the ANO tension is a classical, algebraic function of $(v,e,\lambda)$ with no transmonomial in $g$. Seated: the DAH vortex is a **level-0 object** in Y-0151's own $F$-escape language, and therefore a detector of nothing. That is a negative result about a named corpus front and it should be recorded as one.

---

## §6 · What an instrument can HONESTLY hold, ranked — with the label each panel must carry

**TIER 1 — EXACT. A theorem with no fitted number inside it. May be drawn as truth.**

| object | statement | the label |
|---|---|---|
| Linear-potential spectrum | $E_n=(\sigma^2/2\mu)^{1/3}|a_n|$, $\mathrm{Ai}(a_n)=0$ | *"Exact spectrum of $V=\sigma r$. **Not** the observed quarkonium spectrum — see the $\mu^{-1/3}$ test."* |
| Lüscher term | $-\pi(d{-}2)/(24r)$; $d{=}4\Rightarrow-\pi/(12r)$ | *"Universal Casimir coefficient of $d{-}2$ transverse modes. Exact; $\sigma$ and $\mu$ are inputs."* |
| Broadening coefficient | $w^2=\frac{d-2}{2\pi\sigma}\ln(r/r_0)$ | *"Coefficient exact and universal. $r_0$ is **fitted**."* |
| ANO flux quantisation | $\Phi=2\pi n/e$ | *"Exact — topological."* |
| ANO Bogomolny bound | $\mathcal E/L\ge2\pi nv^2$, equality iff $\kappa{=}1$ | *"Exact for the dual abelian Higgs model."* |
| Centre-flip action (Thm Q1) | $\Delta S=2\beta$ on SU(2) | *"Exact. The Borel constant $A{=}2$ of the strong-coupling tension."* |
| Rotating-string Regge slope | $\alpha'=1/(2\pi\sigma)$ | *"Exact for the classical rotating Nambu–Goto string with massless ends."* |
| Leading strong-coupling tension | $a^2\sigma=\ln(2N^2/\beta)$, $\ln(4/\beta)$ at $N{=}2$ | *"Leading order of a **convergent** expansion. Valid only for $\beta$ below roughening ($\beta_r\approx2.2$, SU(2)). **Not** the continuum string tension."* |
| $D_j$ constant (Thm Q3) | $c=8\sqrt2/\Gamma(1/4)^2$ | *"Exact constant of an asymptotic law (Ponzano–Regge). $\pm1.4\%$ residual at $j\approx110$."* |

**TIER 2 — A NAMED MODEL. Exact *inside* a model that is not QCD. The model's name must appear on the panel.**

- **Cornell potential** $-\tfrac43\alpha_s/r+\sigma r$. Reproduces the $2S$–$1S$ ratio to $0.7\%$ and the absolute $\psi(2S)$, $\Upsilon(2S)$ to $0.4\%/0.18\%$ — but it is a *potential model*, non-relativistic, spin-independent, and $\alpha_s$ is frozen. Label: *"Cornell potential model, Numerov; $\alpha_s,\sigma,m_q$ fitted."*
- **Dual abelian Higgs / Nielsen–Olesen vortex.** Everything in §4.2 is exact *for the DAH model*. Its identification with the chromoelectric flux tube presupposes abelian dominance and monopole condensation. Label: *"Nielsen–Olesen vortex in the dual abelian Higgs model — **a model of the QCD flux tube, not a solution of QCD**."*
- **Nambu–Goto / Arvis resummation** $\sigma r\sqrt{1-\pi(d{-}2)/12\sigma r^2}$, and its critical radius $r_c=0.3365$ fm. The *leading* $1/r$ is universal; the resummation is one specific string action. Label: *"Nambu–Goto ground state; valid $r>r_c$."*

**TIER 3 — A FIT. Numbers with error bars that came from data.** $\sigma=0.18\,\mathrm{GeV}^2$ (lattice, $\pm$ a few %); $\alpha_s=0.39$; $m_c=1.5$, $m_b=4.8$ GeV (potential-model masses, **not** $\overline{\rm MS}$); $r_0$ in the width law; $\kappa\approx1$ from lattice tube profiles; $C=0.733$ GeV in the logarithmic potential; the measured Regge slope $0.91528$ (my 4-state fit; the literature quotes $0.88$–$0.93$ depending on the states included).

**TIER 4 — MUST NOT BE DRAWN.**
1. Any panel labelling the observed charmonium/bottomonium spectrum "Airy". §1.2 is why.
2. $-\log(I_2/I_1)$ plotted past $\beta\approx2$ and called the string tension. Roughening is why.
3. The $r_c\approx r_*$ coincidence (§4.1) drawn as a relationship. The mechanism is a factor of 2 off.
4. A.9's ladder applied to the plaquette integral. It gives $1.5\beta$ against the true $2\beta$ and its next member does not exist.
5. The corpus's $C=9\pi^2/22$ as the SU(2) gap action. §5.2.
6. Any claim that the ANO vortex bears on the mass gap's Stokes constant $S_1$. §5.4.

---

## §7 · Questions Q49–Q54 for Fable

**Q49 (DEEPEN — the constant term in Theorem Q3).** My block means give $D_j/(c\sqrt{j+\tfrac12})=1.018767$ on $j\in[60,80]$ and $1.014207$ on $j\in[100,120]$. Multiplying out, the *excess* is nearly $j$-independent in absolute terms: $0.1359$ and $0.1285$. So I conjecture $D_j=c\sqrt a+d+o(1)$ with $a=j+\tfrac12$, $c=8\sqrt2/\Gamma(1/4)^2$ and $d\approx0.13$. **Give $d$ in closed form** (is it $\tfrac18$? $\tfrac1{2\pi}\!\cdot\!\dots$?), or refute the additive form by exhibiting a $\sqrt{\!}$-relative correction. *Answerable with one number.*

**Q50 (LOCATE — the provenance of $3/16$).** §5.2 shows the corpus's $C=3/(16b_0)$ is $\tfrac38$ of the value $\beta=4/g^2$ forces, and that $3/(16b_0)$ can only be right if the entry silently assumes $\beta=\tfrac3{2g^2}$. **Find the first disk entry that writes $3/(16b_0)$ (or $9\pi^2/22$) and report the coupling normalisation it states.** If none states one, the value is unseated and Y-0138/0139/0140/0151 all inherit the correction. *Answerable with a Y-number and one number (the implied $\beta g^2$).*

**Q51 (DEEPEN — the fold at the edge of the $6j$).** Y-0143's requested "uniform fold/Airy asymptotic" needs the endpoint $b=a\sqrt2$, where $V(a,b)=\tfrac16b^2\sqrt{a^2-\tfrac12b^2}\to0$. **Give (i) the width of the Airy boundary layer in $J$ (I predict $\Delta J\sim a^{1/3}$) and (ii) the exponent $\alpha$ in the layer's contribution $\propto a^{\alpha}$ to $D_j$** — which decides whether Q49's $d$ is a constant or a slowly-growing term. *Answerable with two exponents.*

**Q52 (BROADEN — Theorem Q1 for SU($N$)).** The critical points of $\mathrm{Re\,tr}\,U$ on SU($N$) are the $U$ whose eigenvalues split between $\theta_0$ and $\pi-\theta_0$ with $(p-q)\theta_0+q\pi\in2\pi\mathbb Z$; the critical value is $(p-q)\cos\theta_0$. For SU(2) this gives only $U=\pm\mathbb 1$ and $\Delta S=2\beta$ (Thm Q1). For SU(3) it gives **two** competitors — the centre elements $z\mathbb 1$ ($\mathrm{Re\,tr}=-\tfrac32$, $\Delta S=\tfrac32\beta$) *and* the involution $\mathrm{diag}(1,-1,-1)$ ($\mathrm{Re\,tr}=-1$, $\Delta S=\tfrac43\beta$), and the **involution wins**. So I predict
$$A_2=2\ \text{(centre)},\qquad \boxed{A_3=\tfrac43\ \text{(involution, NOT the centre's }\tfrac32)}$$
**Compute $A_3$ from the late terms of the SU(3) fundamental character ratio and say which of $\tfrac43$ and $\tfrac32$ it is.** If it is $\tfrac43$, "the Borel constant is the centre-flip action" is *false beyond SU(2)* and my own Theorem Q1 is a two-colour accident. *Answerable with one number.*

**Q53 (BROADEN — the print's Thread B meets the confining term).** Theorem B.7 gives the whole of SO(4) through the Clebsch matrix; the linear term $\sigma r$ breaks $SO(4)\to SO(3)$ and lifts the $\ell$-degeneracy. **Quantify the breaking: for the Cornell potential with the §1.3 parameters, compute $E(2S)-E(2P)$ for charmonium and give the dimensionless Runge–Lenz violation $\|[H,\vec A]\|/\|H\|$ on the $n{=}2$ manifold.** My Numerov gives $E(2S)_{c\bar c}=+0.930388$ GeV; the $2P$ is the missing half. *Answerable with two numbers.*

**Q54 (LOCATE — the corpus's own vortex front).** Y-0084 (l. 339) lists "L6 the Nielsen–Olesen / dual abelian-Higgs vortex gap" as one of six INV-14 fronts. **Find the entry that reports L6's result and say (i) whether it obtains the Bogomolny tension $2\pi nv^2$, and (ii) what $\kappa=m_s/m_v$ (if any) it fits.** §5.4 argues on general grounds that this front is level-0 and therefore cannot reach $S_1$; if the corpus claimed otherwise, that is a correction. *Answerable with a Y-number and one number.*

---

## NOT CERTIFIED

Stated so the next round does not have to find it.

1. **§1's masses are potential-model masses.** $m_c=1.5$, $m_b=4.8$ GeV are Cornell-fit constituent masses, not $\overline{\rm MS}$ masses. The additive constant $V_0$ was fitted separately for each system on the $1S$; only the *splittings* and their ratio are parameter-free tests, and those are what §1.3 reports. Spin, relativistic corrections, coupled channels and the running of $\alpha_s$ are all absent. The $\psi(3S)$ miss ($2.4\%$) is where that shows.
2. **§2.1's identification is leading-order.** $-\log(I_2/I_1)$ is the minimal-surface, one-plaquette-per-tile tension. I did **not** compute the non-minimal-surface corrections, and I did **not** verify the roughening radius $\beta_r\approx2.2$; it is quoted as KNOWN.
3. **Theorem Q1's $\Delta S=2\beta$ is a critical-point computation, not a resurgence theorem.** That the *leading* Borel singularity of $\sigma_0$ equals the *minimal* competing critical action is a standard steepest-descent expectation, verified here only through the agreement with Theorem S1's independently derived $A=2$ and with $-\log(K_1/I_1)/\beta\to2$. The full $2\mathbb N$ lattice is asserted from the $n$-flip picture and was not computed term by term.
4. **Q52's prediction may kill Theorem Q1's generality**, and I have written it that way deliberately. I did not compute the SU(3) character-ratio late terms.
5. **Theorem Q3's constant is the leading term of an asymptotic (Ponzano–Regge) form, not a proof.** Ponzano–Regge itself is cited as KNOWN. The $\pm1.4\%$ block-mean excess at $j\approx110$ is unexplained beyond "the fold at $b=a\sqrt2$", and the $j\in[180,200]$ block was discarded for precision loss in my own probe. The $\langle|\cos|\rangle=2/\pi$ step assumes equidistribution of the Ponzano–Regge phase in $J$, which I did not verify.
6. **§5.2 is a flag, not a diagnosis.** I show $C=3/(16b_0)$ is inconsistent with $R=\exp(-\beta/8b_0)$ under $\beta=2N/g^2$, and I could not construct a convention that rescues it — but I did not find where the $3/16$ entered. Q50 is that question. I have **not** re-derived the corpus's Y-0138 alien-derivative argument itself, only the constant it names.
7. **§4.2's DAH equations were derived here and checked only by the BPS saturation** ($\mathcal E/2\pi v^2=1.00000000,\,2.00000000,\,3.00000000$ to eight digits at $n=1,2,3$). No independent literature comparison of the type-I/II tensions was made.
8. **§3's Regge fit uses four states and one trajectory.** $\alpha'=0.91528$ with residuals $\pm0.037$ in $J$; different state assignments shift this by several per cent, which is why §3.2's verdict is stated at the $3.4\%$ level and not tighter.
9. **The $r_c\approx r_*$ coincidence (§4.1) is flagged, not claimed**, per the corpus's own T-1075 firewall discipline.
10. **Nothing here bears on the Clay problem.** The mass gap remains OPEN and unclaimed. §5.4 is a *negative* result: one named corpus front (the DAH vortex) is shown to be a level-0 object that cannot reach $S_1$.

**Probes** (all under `/home/joshua-hosain/Documents/LAMBDAWAVES/research/probes/`): `bf-r9-airy.py`, `bf-r9-plaquette.py`, `bf-r9-plaq2.py`, `bf-r9-regge.py`, `bf-r9-flux.py`, `bf-r9-corpus.py`, `bf-r9-sixj.py`, `bf-r9-sixj2.py`. Run with `~/miniforge3/envs/sci/bin/python`.

**External sources used** (for standard QCD numbers only; every derivation above is independent):
- [The Confinement Problem in Lattice Gauge Theory (Greensite)](https://arxiv.org/pdf/hep-lat/0301023) — centre vortices, strong-coupling area law, string tension.
- [Study of compact U(1) flux tubes in 3+1 dimensions on the lattice](https://arxiv.org/pdf/1208.0166) — measured Lüscher coefficient $0.274$ vs $\pi/12=0.2618$.
- [Subleading properties of the QCD flux tube in 3-d lattice gauge theory](https://arxiv.org/pdf/0709.4170) and [A New Constraint on Effective Field Theories of the QCD Flux Tube](https://arxiv.org/pdf/1512.02705) — effective-string corrections beyond Lüscher.
- [Unveiling the flux tube structure in full QCD](https://arxiv.org/pdf/2409.20168) and [Fourier analysis of the flux-tube distribution in SU(3) lattice QCD](https://arxiv.org/pdf/0906.2618) — measured tube widths and profiles.

PDG central masses ($J/\psi$, $\psi(2S)$, $\Upsilon(1S,2S,3S)$, $\rho(770)$, $a_2(1320)$, $\rho_3(1690)$, $a_4(1970)$) are quoted from memory to the digits shown and should be re-checked against the current edition before any of §1.3 or §3.2 is printed.
