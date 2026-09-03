# BEYOND THE FRONTIER · λWAVES — Round 7 · FABLE (lead)

*Written at the checkpoint after the print and the first build wave, while Round 6's audit of the instrument runs. Seats: KNOWN · KNOWN-in-corpus · DERIVED-HERE · MEASURED · UNVERIFIED (why) · REFUTED (by what number). Units atomic; $E_n=-1/(2n^2)$; complex $Y_{lm}$, Condon–Shortley.*

**Evidence.** `research/probes/bf-r7-rotors.mjs` (the full SO(4) action, six clauses against the instrument's own independent implementation), `bf-r7-cusp.py` (the saddle ladder, the surviving phases at $T_{\rm sr}$, the régime boundary), `bf-r7-cusp2.py` (the cusp in its valid régime, mpmath at 50 digits), `bf-r7-korselt.py` (the deafness modulus of every clock, $p\le7$), `bf-r7-super.mjs` (all four residue classes against the exact ladder sum). Everything below is in `lab/frontier.js` and is gated by `tests/frontier.test.mjs` (48/48) and the browser proof (29/29).

---

## 1 · Theorem A.9 — the singulant is an action difference, and the print's 54 falls out in one line

Round 4 derived the Stokes constant $\tfrac1{6\pi e}$ and Round 3 the pole $\beta^2=-\tfrac1{54}$ through the Airy dictionary: the closed form for $u_k$, its ${}_2F_1$ Borel transform, the composition lemma. All correct, and all unnecessary for the *location*.

**Theorem A.9 (DERIVED-HERE; MEASURED exactly).** *Let $I_p(\gamma)=\frac1{\sqrt{2\pi}}\int e^{-u^2/2+i\gamma u^p}du$. Its exponentially small correction is $e^{-\Delta S_p}$ with $\Delta S_p$ the action difference between the Gaussian saddle $u=0$ and the nearest competing saddle $u_2^{\,p-2}=1/(ip\gamma)$:*
$$\boxed{\;\Delta S_p=\Big(\tfrac12-\tfrac1p\Big)u_2^2,\qquad |\Delta S_p|=\frac{p-2}{2p}\,(p\gamma)^{-2/(p-2)}\;}$$
*In particular $\Delta S_3=\dfrac{1}{54\beta^2}$ and $\Delta S_4=\dfrac{i}{16\gamma}$.*

The cubic case is one line: $u_2=-i/(3\beta)$, $S(u_2)=\tfrac1{18\beta^2}-\tfrac1{27\beta^2}=\tfrac1{54\beta^2}$. **That is the print's Borel pole, derived rather than fitted, and it explains Ω₄′ at a stroke**: every observable of the same integral — the maximiser $\alpha^*$, the height $|I|_{\max}$, the half-width, an alias amplitude — inherits the same singulant because it is a property of the *saddle geometry*, not of the observable. Round 5 verified Ω₄′ on a second observable; this says why a third would also pass.

MEASURED two independent ways (`bf-r7-cusp.py`): the direct saddle action against the closed formula for $p=3,4,5,6$ (agreement to all printed digits: $0.0185185185185$ at $p=3$, i.e. $1/54$; $0.0625=1/16$ at $p=4$); and the moment series $I_p=\sum_m(i\gamma)^m\langle u^{pm}\rangle/m!$, whose late-term ratio must be the same constant — $p=3$: $27.034,\ 27.009,\ 27.002,\ 27.001$ at $m=20,40,80,160$, and the natural variable is $\beta^2$ (steps of two in $m$), so the constant is $2\times27=54$ ✓; $p=4$: $16.007,\ 16.002,\ 16.0005,\ 16.0001$ ✓.

Consequence for the instrument, which is now in `saddleSingulant(p, γ)`: the optimal truncation of any of these series is at $k^*\simeq|\Delta S_p|^{-1}$, so the floor of the peak law and the floor of the height law are the same exponential, as Round 4's optimal-truncation estimate assumed.

---

## 2 · Theorem A.10 — the superrevival is a CUSP, and $\bar n \bmod 4$ decides which kind

The revival is a fold caustic: an Airy function, because at $T_{\rm rev}$ the quadratic phase vanishes and the cubic is what is left. Ask the same question one clock further out.

At $t=T_{\rm sr}=\pi\bar n^5$ the phases of $A(t)=\sum_kp_k\exp\!\big(2\pi i[-kt/T_{\rm cl}+k^2t/T_{\rm rev}-k^3t/T_{\rm sr}+k^4t/T_4]\big)$, with $T_4=4\pi\bar n^6/5$, are, for **integer** $k$:

| term | value at $T_{\rm sr}$ | mod $2\pi$ |
|---|---|---|
| cubic | $2\pi k^3$ | $\equiv0$ **always** |
| quadratic | $2\pi k^2\cdot\tfrac{3\bar n}{4}$ | $\equiv0$ iff $4\mid\bar n$ |
| linear | $\pi k\bar n^2$ | $\equiv0$ iff $\bar n$ even |
| quartic | $2\pi k^4\cdot\tfrac{5}{4\bar n}$ | the survivor |

**Theorem A.10 (DERIVED-HERE; MEASURED to $10^{-4}$ across all four classes).** *With $k=\sigma u$ the surviving strength is $\gamma_{\rm sr}=5\pi\sigma^4/2\bar n$, and the superrevival envelope is the Poisson sum of QUARTIC envelopes — a Pearcey function at imaginary cusp parameter $x=i/(2\sqrt\gamma)$, $y=\alpha\gamma^{-1/4}$ — where the revival's is an Airy function. The class of $\bar n$ modulo 4 decides which:*
- *$\bar n\equiv0$: quadratic, cubic and linear all vanish. **A full cusp revival**, height $|E(0)|$.*
- *$\bar n\equiv2$: $k^2\equiv k\ (2)$ collapses the quadratic to $(-1)^k$ — **the same cusp shifted half a classical period**, height $|E(\pi\sigma)|$, and the revival is strongly suppressed.*
- *$\bar n$ odd: the quadratic is a quarter-integer, $e^{i(\pi/2)wk^2}$ with $w=3\bar n\bmod4$, and $k^2\bmod4$ is not affine in $k$. The quadratic Gauss sum splits exactly, $e^{i(\pi/2)wk^2}=\tfrac{1+i^w}2+\tfrac{1-i^w}2(-1)^k$; the linear phase supplies one more $(-1)^k$; the result is a **two-lobed fractional revival** whose taller lobe is chosen by $3\bar n\bmod 4$.*

MEASURED (`bf-r7-super.mjs`, the exact ladder sum against the law):

| $\bar n$ | class | $\gamma_{\rm sr}$ | exact $\lvert A(T_{\rm sr})\rvert$ | the law | error |
|---|---|---|---|---|---|
| 2000 | full | 0.3181 | 0.767146503 | 0.767179165 | $3.3\times10^{-5}$ |
| 4000 | full | 0.5027 | 0.740560447 | 0.740574172 | $1.4\times10^{-5}$ |
| 8000 | full | 0.6136 | 0.697627073 | 0.697649879 | $2.3\times10^{-5}$ |
| 4002 | half-shifted | 0.5024 | 0.085755137 | 0.085816047 | $6.1\times10^{-5}$ |
| 8002 | half-shifted | 0.6134 | 0.064198813 | 0.064186502 | $1.2\times10^{-5}$ |
| 2001 | fractional ($w=3$) | 1.0048 | 0.365593250 | 0.366170116 | $5.8\times10^{-4}$ |
| 2003 | fractional ($w=1$) | 1.0038 | 0.495596943 | 0.496081799 | $4.9\times10^{-4}$ |
| 2000, $\sigma=2$ | full | 0.0628 | 0.938500390 | 0.938499721 | $6.7\times10^{-7}$ |

The residual is the **quintic**, strength $\gamma_5=3\pi\sigma^5/\bar n^2$: the error tracks it over three decades ($6.7\times10^{-7}$ at $\gamma_5=7.5\times10^{-5}$; $8.5\times10^{-4}$ at $\gamma_5=2.4\times10^{-3}$). The law is trustworthy while $\gamma_5\lesssim0.02$, and the instrument says so on its face.

**Two things this cost me, honestly.** (i) My first test put the cusp at $\bar n\approx40$, $\sigma=2$, where $\gamma_5=0.19$ and the $k$-expansion is not converged at all — the numbers disagreed by $0.15$ and the theorem looked dead. It was the test that was wrong, not the theorem. (ii) I first predicted the fractional lobes backwards, because I forgot that for odd $\bar n$ the *linear* phase also contributes $(-1)^k$. The measured swap ($0.3656\leftrightarrow0.4956$) caught it.

**And the aliases are not Gaussian-suppressed at a cusp either.** The $j=0$ term alone gives $0.7832$ where the truth is $0.7671$: the quartic phase rescues the aliases exactly as the cubic one does at the fold (Theorem A.4). A cusp prediction without the Poisson sum is wrong in the second decimal.

---

## 3 · Theorem A.11 — the deaf comb was the $p=3$ member of a Bernoulli family

Theorem A.5 of the print: a comb hears the cubic clock unless $b\mid6$, because $m^3\equiv m\pmod b$ for all $m$ iff $b\in\{1,2,3,6\}$. That is Fermat, and Fermat is Korselt, and Korselt is von Staudt–Clausen.

**Theorem A.11 (DERIVED-HERE; MEASURED for $p\le7$).** *A degree-$p$ phase $2\pi(a/b)m^p$ is affine on $\mathbb Z$ — hence invisible to a revival, absorbable by the classical phase $x$ — iff $m^p\equiv m\pmod b$ for every $m$, iff $b$ is squarefree with $(q-1)\mid(p-1)$ for every prime $q\mid b$. Write $K(p)$ for the largest such $b$. **For odd $p$, $K(p)$ is exactly the denominator of the Bernoulli number $B_{p-1}$** (von Staudt–Clausen); for even $p$ it degenerates to 2.*

$$K(2)=2,\quad K(3)=6=\operatorname{denom}B_2,\quad K(4)=2,\quad K(5)=30=\operatorname{denom}B_4,\quad K(6)=2,\quad K(7)=42=\operatorname{denom}B_6.$$

MEASURED (`bf-r7-korselt.py`, the exact peak $\max_x|\sum_mp_me(am^p/b+xm)|$ over every reduced $a/b$ with $b\le60$): the set of deaf denominators is **exactly the divisor set of $K(p)$**, for every $p$ from 2 to 7 — no exceptions in about seven thousand fractions. The quintic clock's full row: deaf on $1,2,3,5,6,10,15,30$ and nowhere else; $b=25$ is not deaf (not squarefree), $b=60$ is not (it exceeds 30).

So each clock of the ladder has its own deafness modulus, and the print's $b\mid6$ is the cubic one. The quadratic clock's modulus is 2 — **which is exactly the $\bar n\equiv2\pmod4$ half-shift of Theorem A.10**: $k^2\equiv k\ (2)$ is the $p=2$ Korselt statement, and the fractional case is precisely its failure at $b=4$. The two arithmetic laws of this programme are one law at two clocks.

*(A methodological note that cost me a run: the first table said only $b\in\{1,3\}$ were deaf, because the $x$-grid of 20001 points does not contain $x=\tfrac12$. The deaf packet's optimal classical phase is a rational $j/b$; a grid that misses it hides the theorem. The grid now contains those points.)*

---

## 4 · Theorem B.7 — the whole of SO(4), through the Clebsch matrix

The print's Theorem B.1 says the singular values of the shell's Clebsch matrix are complete $SO(4)$-orbit invariants. The instrument could only *rotate* about $z$ ($D^l(R_z)$) and along $K_z$. The rest of the group was listed as an honest gap. It is one line of linear algebra.

**Theorem B.7 (DERIVED-HERE; MEASURED to $10^{-15}$).** *Let $M$ be the Clebsch matrix of shell $n$, $M[p][q]$ the amplitude of $|j,m_+=j-p\rangle\otimes|j,m_-=j-q\rangle$, $j=\tfrac{n-1}2$. Then every element of $SO(4)=(SU(2)_+\times SU(2)_-)/\mathbb Z_2$ acts as*
$$\boxed{\;M\;\longmapsto\;U\,M\,V^{\mathsf T},\qquad U=D^{\,j}(R_+),\quad V=D^{\,j}(R_-)\;}$$
*and the state returns by the transpose of the (orthogonal) Clebsch transform. The diagonal $U=V$ is the ordinary spatial rotation $D^l(R)$ — so this also supplies the general Wigner rotation the register lacked — and the opposite pair $(e^{-i\theta j_z},e^{+i\theta j_z})$ is $e^{-i\theta K_z}$.*

Verified (`bf-r7-rotors.mjs`, six clauses, all at $10^{-15}$–$10^{-16}$): the transform round-trips on every shell $n\le6$; $U=V=D^j(R_z(\alpha))$ reproduces the register's exact `rotateZ`; **the opposite pair reproduces `applyRotateK`** — two implementations that share no code, the tridiagonal eigendecomposition of Pauli's $K_z$ against two Wigner matrices, agreeing to $6\times10^{-16}$, which is the dossier's §18.1 law satisfied on the $\eta_l$ phase convention that everything in Thread B rests on; a general $(U,V)$ fixes the Schmidt spectrum and the norm; the diagonal pair fixes $|\langle\mathbf L\rangle|$, $|\langle\mathbf K\rangle|$ and $e$; and a rotor tilt of $0.8$ rad on the extreme Stark state moves $\langle\mathbf K\rangle$ by exactly $0.8$ rad while $e$ stays $\tfrac{n-1}{n}=0.75$.

**What it buys the instrument.** The two rotor spheres are now *controls*: dragging $\langle\mathbf J_+\rangle$ alone is a genuine $SO(4)$ move that is not a spatial rotation (it separates $\langle\mathbf L\rangle$ from $\langle\mathbf K\rangle$ while the Schmidt spectrum stands still), and dragging the Kepler panel is the ordinary rotation. The print's Theorem B.1 stops being a readout and becomes something a finger does.

---

## 5 · A kill: adding $\beta_4$ to the Airy prediction does not improve it

The print says the quartic $\beta_4$ is "the neglected term" of Theorem A.4, and the natural next build step was to add it to the dashed curve. **Do not.** MEASURED at $T_{\rm rev}$ (`bf-r7-cusp.py`, exact sum vs the one-term and two-term envelopes):

| $\bar n$, $\sigma$ | $\beta_3$ | $\beta_4$ | exact | Airy error | Airy + quartic error |
|---|---|---|---|---|---|
| 600, 2 | 0.112 | 0.00047 | 0.938916 | $4.1\times10^{-6}$ | $6.0\times10^{-6}$ |
| 150, 2 | 0.447 | 0.0074 | 0.745015 | $1.3\times10^{-3}$ | $1.8\times10^{-3}$ |
| 80, 4 | 6.70 | 0.419 | 0.221177 | $8.0\times10^{-2}$ | $1.4\times10^{-1}$ |

The series is asymptotic, not convergent: **$\beta_4$ is an error estimate, not a correction**, and adding it alone makes the prediction worse in every row measured. The print's wording ("the neglected quartic") is right; the instinct it invites is wrong. The fold prediction is instead labelled by régime, from the same table: tight to $4\times10^{-6}$ at $\beta_3\le0.11$, $10^{-3}$ near $\beta_3\approx0.45$, and out of régime beyond $\beta_3\approx0.8$ (at $\bar n=40,\sigma=2$ the Airy law is off by 100%).

---

## 6 · What went into the instrument

`lab/frontier.js` gained `wignerD`/`wignerAxis`, `shellCoefficients`, `applyShellRotors`, `applyRotor`, `clockAutocorr`, `quarticEnvelopeC`/`cuspEnvelopeC`, `superrevival`, `korseltModulus`, `clockDeafness`, `saddleSingulant`; `state.js` gained `rotor(...)`; LADDER gained a SUPERREVIVAL panel and a régime badge on the fold prediction; ORBIT's spheres became drivable. Proofs: node 37/37 + 48/48, browser 29/29.

One of these is an exactness upgrade worth naming. **Every clock of the ladder is a rational multiple of $\pi\bar n^m$, and every energy is a rational multiple of $1/n^2$, so the phase $t/(4\pi n^2)=A\bar n^M/(4Bn^2)$ is a RATIONAL NUMBER**: its fractional part is exact in integer arithmetic. `clockAutocorr` evaluates the autocorrelation at any clock with no phase loss whatever — at $\bar n=200000$ the phase is $1.6\times10^{19}$ rad, where a double retains no digits at all, and the instrument still returns $0.9995220833$ against the law's $0.9995220829$.

---

## 7 · Questions for the next round

**Q42 (DEEPEN — the cusp's Stokes data).** Theorem A.9 gives the quartic singulant $i/(16\gamma)$, on the *imaginary* axis where the cubic's is real and negative. So the height law at the cusp should be Borel-summable in a different direction from the fold's. Compute the exact series of $|I_4|_{\max}(\gamma)$ to 40 terms (Lagrange inversion as in Round 4) and give its Stokes constant: is it in $\tfrac1{\pi e}\mathbb Q$ like the fold's, or does the imaginary singulant put it elsewhere?

**Q43 (BROADEN — the sextic and the umbilic).** $p=5$ and $p=6$ have $|\Delta S|=0.1026$ and $0.1361$ at $\gamma=1$. Catastrophe theory says the next caustics after fold and cusp are the swallowtail ($p=5$) and butterfly ($p=6$). Which clock of the Rydberg ladder is a swallowtail, and does the corresponding arithmetic law ($K(5)=30$) show up as a $\bar n\bmod$ something classification the way $K(2)=2$ shows up as $\bar n\bmod4$?

**Q44 (LOCATE — the two laws as one).** Theorem A.11's $K(p)$ and Theorem A.10's $\bar n\bmod4$ are the same statement at two clocks. State the general form: for the degree-$p$ clock at time $T_p$, the surviving lower phases are governed by $\bar n$ modulo an explicit modulus $\mu(p)$; give $\mu(p)$ and check $\mu(3)=4$ against the table above.

**Q45 (DEEPEN — the rotor gate count).** With Theorem B.7 the instrument can apply any $SO(4)$ element exactly. Round 4's Q35 asked for the gate count of $\langle SU(2)\times SU(2),e^{i\alpha\mathbf L^2}\rangle$ on the $n=3$ shell; now that the group elements are one matrix multiply, compute it: the minimum number of alternating layers to reach a target state from $|3s\rangle$, and the $\alpha$-schedule.

---

## NOT CERTIFIED

- Theorem A.10's fractional case matches to $5\times10^{-4}$; the Gauss-sum splitting is exact algebra but the *envelope* it multiplies is the quartic truncation, so the residual is the quintic and is not separately bounded.
- The régime table is measured at $T_{\rm rev}$ only; the boundary $\beta_3\approx0.8$ is where the error passes 5%, not a theorem.
- Theorem A.9 is a saddle-point statement about the *location* of the singularity; the *constant* $\tfrac1{6\pi e}$ still rests on Round 4's dictionary, which is proved at $r=0,1$ and verified numerically beyond.
- Theorem A.11 is proved for the affine criterion and measured for $p\le7$, $b\le60$; the von Staudt–Clausen identification is classical and cited, not re-derived.
- `applyRotor` composes about Cartesian axes only; an arbitrary axis needs an Euler decomposition, which is not implemented.
- No GPU ran; nothing under the WGSL kernel or the tier router was touched.
