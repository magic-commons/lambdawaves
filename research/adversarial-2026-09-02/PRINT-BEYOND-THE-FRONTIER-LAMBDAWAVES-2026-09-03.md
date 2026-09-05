# BEYOND THE FRONTIER · λWAVES

> **Correction notice — 5 September 2026:** Theorem B.1 and the abstract overstate the SO(4) classification. For n ≥ 3, rank one means separable, not necessarily spin coherent; Schmidt spectra are invariant but incomplete. The unitary Kz flow from 2s also has ⟨z⟩ = 0, not −3 tanh(2θ). The historical text below is preserved. See [the counterexample, derivation and implemented correction](../astra-2026-09-05/MATH-AUDIT.md#3-a-theorem-in-the-corpus-is-false-and-the-app-label-was-affected). Other theorems are not certified by this notice.

## The mathematics of the hydrogen shadow lab, after five adversarial rounds

**Fable 5.1 (lead) and Opus 5 (rival), for Josh — 2026-09-03.** Written by Fable from the five round files `01-fable.md`, `02-opus.md`, `03-fable.md`, `04-opus.md`, `05-fable.md` and the probes `research/probes/bf-r{1..5}-*.py`. Every theorem below was stated by one lab and checked by the other — refuted by a number, or reproduced by a different route. Where only one lab has touched a claim, the print says so.

*Seats.* KNOWN (author/theorem) · KNOWN-in-corpus (file, §) · DERIVED-HERE · MEASURED · UNVERIFIED (why) · REFUTED (by what number). Atomic units; $E_n=-\tfrac1{2n^2}$; complex $Y_{lm}$ with the Condon–Shortley phase, as in `lab/hydrogen.js`.

---

## Abstract

The instrument evolves a finite superposition of hydrogen eigenmodes, $\psi(t)=\sum_a c_a\,e^{-iE_at}\,\phi_a$, and draws it. Five rounds asked what is *provable* about the pictures it draws. Three threads survived contact with the rival lab. **The revival** (Thread A): the Rydberg revival envelope is an Airy function exactly, its maximiser has an asymptotic series with integer coefficients whose Stokes data are now closed forms — $C_k=(-1)^k54^k\Gamma(k)\big/(6\pi e)\cdot(1-\tfrac{7/9}{k-1}+\cdots)$ — and the arithmetic of the ladder enters the revival through a single Boolean: a comb packet of spacing $d$ revives perfectly iff $b\mid6$, where $a/b=4d^3/3\bar n$, by Fermat's little theorem; the floor beneath every other packet is Parseval times a logarithmic gain. **The two spheres** (Thread B): the singular values of a shell's Clebsch matrix are complete $SO(4)$ invariants, the rank-one orbit is $\mathrm{Gr}^+(2,4)=S^2\times S^2$ (the Kepler ellipses, the coherent states, and NEBULA's camera manifold, all one object), the Fock, Sturmian and Kustaanheimo–Stiefel views are one construction at three radii, and one cheap unitary outside $SO(4)$ — a wait under an $l$-dependent phase — makes the shell's controls a universal gate set. **The vortex lines** (Thread C): the nodal lines of $\psi$ are the unimodular roots of a polynomial in $e^{i\phi}$, reconnections are its double unimodular roots, three-mode states reconnect only at two phases of one beat and only on a finite set of points fixed by two curves (ten points for one state, twelve for another, by a law that counts radial nodes and window edges), four-mode states reconnect at generic times (the first such event is certified), and the lines escape to infinity along the angular nodes of the leading shell at the exact rate $\tfrac{81}8r^{-1}e^{-r/6}$. A fourth thread grew from the corpus: **the shell over a finite field** has dimension $n^2$ iff $q>n-1$ (closed form for all $q$ odd), and over $\mathbb F_2$ its dimension is the octahedral number $n(2n^2+1)/3$. Two conjectures close the print, one for each register.

---

## 0 · The ledger after five rounds

| claim | status | killer / certifier |
|---|---|---|
| A1 (R1) revival-peak law with coefficient $\tfrac{99}2$ | **DEAD** | Opus R2: the exact coefficient is $54$ (the $-\tfrac{45}2\alpha\beta^3$ cross term) |
| Ω₁ (R1) "the revival is arithmetic" | **DEAD** | Opus R2, six ways; the mechanism resurrected as Theorem A.5 |
| Theorem 7 (R2) compact vortex core | **DEAD** | Fable R3: two lines escape along the equatorial node (Theorem C.5) |
| Ω₂ (R3) prime-denominator bound | **DEAD** | Opus R4: the floor falls with $b$; $b=5$ is the *best* non-deaf denominator |
| C5's census "six points" (R3) | **DEAD** | Opus R4: ten (a pair at $\theta=0.0148,0.0145$ my tracer collapsed); Fable R5 reproduced |
| Q27's node rule $\epsilon\in\{0,1\}$ (R4) | **DEAD** | Fable R5: the $(3,4,6)$ state has twelve; $\epsilon$ counts admissible window edges |
| Ω₃(2) "the gain $\kappa$ is absolute" (R4) | **DEAD** | Fable R5: $\kappa^2=\ln T+\tfrac12$ on uniform combs |
| A6's exponent $a\approx\tfrac16$ (R3) | **DEAD** | Fable R3 (sixty exact terms): $a=0$; Opus R4 derived it |
| Everything in §§1–5 below | **STANDS** | two labs, different routes, unless marked |

---

## 1 · The setting

The lab's state space is the $91$ bound states with $n\le6$; the mathematics below is for any finite set of shells. A shell $n$ carries the $n^2$ states $|n\,l\,m\rangle$, the hidden symmetry $SO(4)\cong(SU(2)_+\times SU(2)_-)/\mathbb Z_2$ with $\mathbf J_\pm=\tfrac12(\mathbf L\pm\mathbf K)$, $\mathbf K$ the Runge–Lenz vector scaled to the shell, and the identification $V_n\cong V_j\otimes V_j$, $j=\tfrac{n-1}2$. The evolution is diagonal, $c_a(t)=e^{-iE_at}c_a(0)$; the classical shadow $\mathbf q+i\mathbf p=\sqrt2\,\mathbf c$ (Skinner 2013) is exact for the finite mode equation (the dossier's §5.1 writes it without the $\sqrt2$; Round 2 fixed the convention). A Rydberg packet has populations $p_n$ centred at $\bar n$ with width $\sigma$; its autocorrelation $A(t)=\sum_np_ne^{-iE_nt}$ has the clocks $T_{\rm cl}=2\pi\bar n^3$, $T_{\rm rev}=\tfrac{4\pi}3\bar n^4$, $T_{\rm sr}=\pi\bar n^5$ (KNOWN: Averbukh–Perelman 1989), and the two dimensionless cubic and quartic strengths $\beta_3=8\pi\sigma^3/3\bar n$, $\beta_4=10\pi\sigma^4/3\bar n^2$.

---

## 2 · Thread A — the revival

### Theorem A.1 (the Airy envelope and the exact peak law; DERIVED-HERE R1–R3, KNOWN in part: Airy integral)
For a Gaussian packet the revival envelope near $T_{\rm rev}$ is the integral $I(\alpha,\beta)=\int e^{-u^2/2+i\alpha u+i\beta u^3}du/\sqrt{2\pi}$ with $\alpha$ the reduced time offset and $\beta=\beta_3$, and
$$I(\alpha,\beta)=\sqrt{2\pi}\,(3\beta)^{-1/3}\exp\!\Big(\frac{\alpha}{6\beta}+\frac{1}{108\beta^2}\Big)\,\mathrm{Ai}\!\Big(\frac{\alpha+1/12\beta}{(3\beta)^{1/3}}\Big).$$
Its modulus is maximised where $\mathrm{Ai}'(z^*)/\mathrm{Ai}(z^*)=-\lambda$, $\lambda=3^{1/3}/(6\beta^{2/3})$, and the maximiser has the exact asymptotic series
$$\alpha^*(\beta)=-3\beta+54\beta^3-4860\beta^5+769824\beta^7-169746192\beta^9+47259985248\beta^{11}-\cdots=\sum_{k\ge1}C_k\beta^{2k-1},$$
with every $C_k$ an integer (sixty computed exactly in rational arithmetic). MEASURED to $10^{-45}$ against the integral (R3). The peak sits *before* $T_{\rm rev}$: at $\bar n=30$, $\sigma=2$ the offset is $0.994\,T_{\rm rev}$, in agreement with the instrument's own clock table.

### Theorem A.2 (the complete Stokes data of the maximiser; DERIVED-HERE R3–R4, MEASURED to 13 digits)
$$C_k=\frac{(-1)^k\,54^k\,\Gamma(k)}{6\pi e}\Big(1+\sum_{r\ge1}b_r\frac{\Gamma(k-r)}{\Gamma(k)}\Big),\qquad b_1=-\frac79,\ b_2=-\frac{137}{162},\ b_3=-\frac{10729}{4374},\ \ldots$$
In particular the Borel transform of $\alpha^*$ in the variable $\beta^2$ has a simple pole at $\beta^2=-\tfrac1{54}$ and no nearer singularity; the pole lies on the **negative** axis, so the series is Borel-summable for real $\beta$ and the maximiser carries no exponentially small ambiguity — the floor $e^{-1/(54\beta^2)}$ of the peak amplitude is a floor, not a Stokes jump.

*Proof sketch.* (i) The Airy coefficients have the closed form $u_k=\dfrac{(\frac16)_k(\frac56)_k}{k!\,2^k}$ (Gauss triplication on $\Gamma(3k+\tfrac12)/(54^kk!\Gamma(k+\tfrac12))$), so their Borel transform is $\tfrac5{72}\,{}_2F_1(\tfrac76,\tfrac{11}6;2;\tfrac\tau2)$ with a single finite singularity at $\tau=2$ and pole part $\tfrac1{2\pi}\cdot\tfrac1{2-\tau}$: the late terms of $\mathrm{Ai}$'s series are $\mathrm{Bi}$'s series over $2\pi$ (Opus R4). (ii) The inversion of the peak law, $\lambda=s\,(V/U)(\zeta^{-1})$ with $s=\sqrt{z^*}$, is a composition $y\mapsto w\,h(w)^{-3}$ with $h=1-\tfrac w4+\cdots$, $w=72\beta^2$; **composition lemma**: a series with late terms $\Gamma(k)\chi^{-k}$ composed with $w(1+\gamma w+\cdots)$ keeps its singulant and multiplies its Stokes prefactor by $e^{\chi\gamma}$ (one line: $\chi/y=\chi/w-\chi\gamma+O(w)$). Here $\chi=-\tfrac43$, $\gamma=\tfrac34$: the factor $e^{-1}$. (iii) The chain $u_k\to(V/U)_k\to h_k\to(h^2)_k\to C_k=(h^2)_k72^k/12$ gives $\tfrac{2}{12\pi}e^{-1}=\tfrac1{6\pi e}$ (Fable R3), and carrying the prefactor *series* through the same chain gives the $b_r$ (Opus R4). MEASURED: Richardson-4 on the exact $S_k=C_k/((-54)^k\Gamma(k))$ gives $0.0195165977$ against $\tfrac1{6\pi e}=0.0195166105$; Richardson-5 on $(S_k/S-1)(k-1)$ over the exact $C_k$ gives $-0.7777764$ against $-\tfrac79$; the nine-term dictionary reproduces $C_{100}$ to $4\times10^{-13}$. $\square$ (The sign convention that Round 3 could not settle was a wrong companion: late terms are governed by the *adjacent* exponential $e^{+2\zeta}$ of $\mathrm{Bi}$, not by $\mathrm{Ai}$'s own $e^{-2\zeta}$; both readings then agree.)

### Theorem A.3 (the revival height; DERIVED-HERE R5, MEASURED)
With $h$ the inversion series, $\eta=h-1$ and $U$ the Airy series, the peak height is the exact formal identity
$$|I|_{\max}(\beta)=h^{-1/2}\;U\!\big(\tfrac32wh^{-3}\big)\;\exp\!\Big(-\frac{3\eta^2+2\eta^3}{3w}\Big)=1-3\beta^2+\tfrac{279}2\beta^4-\tfrac{29331}2\beta^6+\tfrac{19280619}8\beta^8-\cdots=\sum_kD_k\beta^{2k},$$
and $D_k=(-1)^k54^k\Gamma(k)\big/(2\pi e)\cdot\big(1-\tfrac{13/18}{k-1}+\cdots\big)$: the same singulant $-\tfrac1{54}$, the same $\Gamma(k)$, a constant three times the maximiser's, and a *different* rational $b_1$. MEASURED on sixty exact $D_k$: $S\cdot\pi e=0.4999999$, $b_1'=-0.7222218$ against $-\tfrac{13}{18}=-0.7222222$.

### Theorem A.4 (the revival ladder is a Poisson sum of Airy envelopes; DERIVED-HERE R3, corrected R4)
For a Gaussian packet the full autocorrelation near $T_{\rm rev}$ is exactly $\sum_{j\in\mathbb Z}I(\alpha-2\pi\sigma j,\beta_3)$ (Poisson summation on an exactly Gaussian sum). The $j$-th alias sits at $\Delta n_j=\tfrac12\sqrt{\bar nj}$ from the centre, independent of $\sigma$, with amplitude $e^{-\bar nj/8\sigma^2}\,|\mathrm{Ai}(z_j)/\mathrm{Ai}(z_0)|$ — the Gaussian factor is the Airy prefactor $e^{\alpha_j/6\beta_3}$ exactly, and the second factor oscillates (Round 3's "weight $e^{-\bar nj/8\sigma^2}$" was this envelope, an upper bound on the alias by up to an order of magnitude at $\bar n=150$).

### Theorem A.5 (the deaf comb; DERIVED-HERE R3, exact R4)
Let $p$ be a population profile and $\mathcal A(p;a/b)=\lVert p\rVert_1^{-1}\max_x|\sum_mp_m\,e(am^3/b+xm)|$ its cubic-level revival height, $a/b=4d^3/3\bar n$ in lowest terms for a comb of spacing $d$ (teeth at $n=\bar n+dm$). Then $\mathcal A=1$ **iff** $m\mapsto am^3$ is affine modulo $1$ on $\operatorname{supp}p$; for a full comb this holds **iff** $b\mid6$, because $m^3\equiv m\pmod b$ for all $m$ iff $b$ is squarefree with $(p-1)\mid2$ for every prime $p\mid b$ (Fermat; the Korselt criterion for exponent $3$), i.e. $b\in\{1,2,3,6\}$. MEASURED: at the cubic level every $b\mid6$ peak is $1.000000$ to $10^{-10}$ for every $a$; over all reduced $a/b$ with $b\le60$ no other denominator exceeds $0.9622$ ($b=59$). The Gaussian packet (no comb) has $\beta_3\approx20$ at the same $\bar n$ and does not revive at all — the comb is the packet that hears the ladder.

### Theorem A.6 (the Parseval floor; DERIVED-HERE R5) and the measured gain
$\mathcal A(p;a/b)\ge\lVert p\rVert_2/\lVert p\rVert_1$ for every $a/b$ (the mean square of $\sum p_me(\theta_m+xm)$ is $\lVert p\rVert_2^2$). The gain $\kappa=\inf_{a,b\le60}\mathcal A\big/(\lVert p\rVert_2/\lVert p\rVert_1)$ is **not** a constant: MEASURED $\kappa=1.4534,1.6529,1.8212,1.9870$ for uniform combs of $T=5,9,17,33$ teeth, with $\kappa^2-\ln T=0.50,0.53,0.48,0.45$; Gaussian tapers rise from $1.30$ to $1.84$. Opus's $1.3504$ (Gaussian $\sigma=2$, at $a/b=1/12$) is one point of this family. Weil's bound for the complete cubic sum plays no rôle: ten of the twelve lowest peaks have complete sum exactly $0$, and the sums are shorter than the modulus.

### A.7 The corpus's Bessel case is the same calculus (Opus R4, S1; attribution corrected R5)
For $\sigma_0(\beta)=-\log(I_2/I_1)$ (`YMD-DISK-01`, Y-0133 "$A=2.0027$, monotone $\to2$", Y-0138, Y-0139) the closed form $a_k(\nu)=\frac{(-1)^k\cos\pi\nu}{\pi}\frac{\Gamma(k+\nu+\frac12)\Gamma(k-\nu+\frac12)}{\Gamma(k+1)2^k}$ gives Borel singularity exactly $2$, Stokes constant $-\tfrac2\pi$, $b_1$-analogue $\tfrac92$, verified to $1.2\times10^{-10}$ at $k=60$; its singulant is *positive*, the opposite side of Theorem A.2's dichotomy, so $\sigma_0$ is not Borel-summable on the real axis where $\alpha^*$ is. Three observables, two classical pairs $(\mathrm{Ai},\mathrm{Bi})$ and $(I_\nu,K_\nu)$, one dictionary: the recessive series' late terms are the dominant series over $2\pi$, pushed through a chain rule.

---

## 3 · Thread B — the two spheres

### Theorem B.1 (the orbit theorem; Opus R2, extended Fable R3; Bander–Itzykson 1966 for the manifold)
Write a shell state as the $n\times n$ matrix $M$ of its coefficients in the $V_j\otimes V_j$ basis (the Clebsch–Gordan change of basis from $|l\,m\rangle$). The singular values of $M$ are a complete set of invariants of the $SO(4)$ orbit; the Schmidt spectrum $(1,0,\ldots)$ orbit — the rank-one states $|j\,\hat n_+\rangle\otimes|j\,\hat n_-\rangle$ — is $S^2\times S^2=\mathrm{Gr}^+(2,4)$, the manifold of oriented $2$-planes in $\mathbb R^4$. These are the $SO(4)$ coherent states (Perelomov), the states whose $(\langle\mathbf L\rangle,\langle\mathbf K\rangle)$ is a classical Kepler ellipse, and NEBULA's camera sphere pair; the three are one homogeneous space. For the coherent state with angle $\gamma$ between $\hat n_\pm$: $|\langle\mathbf L\rangle|=(n-1)\cos\tfrac\gamma2$, eccentricity $e=\tfrac{n-1}n\sin\tfrac\gamma2$ (the parabolic dictionary $\langle A_z\rangle=(n_1-n_2)/n$, Pauli 1926): **no hydrogenic state is a degenerate Kepler orbit**, the extreme Stark state having $e=\tfrac{n-1}n$. Along the $K_z$ flow from $|2s\rangle$, $\langle z\rangle(\theta)=-3\tanh2\theta$.

### Theorem B.2 (Fock, Sturmian, KS — one construction at three radii; Opus R2, Fable R3)
Fock's map sends momentum space to $S^3$ with $p_0=1/n$ **per shell**; the Sturmian weight $w(p)=(p^2+p_0^2)/2p_0^2$ is what makes the shell's momentum functions orthonormal on $S^3$, and a cross-shell superposition has no common $S^3$ — the instrument's Fock view is a per-shell object with its $n$ on the badge. The Kustaanheimo–Stiefel regularisation is the 4-D oscillator with $\omega=1/2n$ and level $N=2n-2$, its fibre generator $\Lambda=M_{23}-M_{14}$ cutting the $\binom{N+3}3$ oscillator states down to the $n^2$ of the shell, and its clock is $dt=r\,ds$ — fictitious time is not lab time, which closes the dossier's §20.1 item. The dossier's §7.4 law that these must not be collapsed into "one 4-D atom" is right in its conclusion and wrong in its reason: they are the same construction at three radii.

### Theorem B.3 (the fourth control; Opus R4 B5, Fable R5 B6)
The Schmidt spectrum of Theorem B.1 is invariant under the group $SU(2)_+\times SU(2)_-$ and under nothing larger in it; but $\mathbf L^2=2j(j+1)+2\mathbf J_+\!\cdot\!\mathbf J_-$ is an entangling generator in the enveloping algebra, and on $n=2$
$$e^{i\frac\pi4\mathbf L^2}e^{-i\frac\pi4K_z}|2s\rangle=\tfrac1{\sqrt2}\big(|2s\rangle+|2p_0\rangle\big),\qquad\langle z\rangle=-3,$$
a unitary in-shell path from $2s$ to a Stark state. Physically $e^{i\alpha\mathbf L^2}$ is a **wait under an $l$-dependent phase** — a quantum defect, which hydrogen's exact degeneracy switches off and the instrument can switch on for free. The Lie closure $\mathrm{Lie}\langle\mathfrak{so}(4),\mathbf L^2\rangle=\mathfrak{su}(n^2)$ for $n=2,3,4,5$ (dimensions $15,80,255,624$; even $\{L_z,L_x,K_z,\mathbf L^2\}$ suffices at $n=2,3$): by the Lie-algebra rank condition the rotors and the wait are a **universal gate set on the shell**. The dossier's §18.3 ("cull the observation, never the state") rules out the non-unitary filter Round 3 had proposed; the wait is a coefficient-space op of its §20.3, badged `STATE`.

---

## 4 · Thread C — the vortex lines

### Theorem C.1 (the unimodular-root theorem; Opus R2, corollaries Fable R3)
At a point $(r,\theta)$ write $\psi=\sum_mg_m(r,\theta)e^{-iE_mt}e^{im\phi}$ over the modes present, $m_{\min}\le m\le m_{\max}$, and $P(w)=w^{-m_{\min}}\psi$, a polynomial of degree $M=m_{\max}-m_{\min}$ in $w=e^{i\phi}$. The nodal set of $\psi$ on the coaxial circle through $(r,\theta)$ is the set of unimodular roots of $P$. Hence: at most $M$ vortex lines pierce any coaxial circle (**degree bound**); where one $|g_m|$ exceeds the sum of the others there is no line (**dominance lemma**, Rouché); a **reconnection** is a double unimodular root and needs three comparable components at one point. Real profiles give the antiunitary symmetry $\psi(-\phi,-t)=\overline{\psi(\phi,t)}$, so reconnection events come in $PT$ pairs $(t,\phi)\leftrightarrow(-t,-\phi)$.

### Theorem C.2 (three modes reconnect on two curves at two phases; Opus R2 for one beat, Fable R3 for any energies)
For $\psi=g_+e^{-iE_+t}e^{i(m+1)\phi}+g_0e^{-iE_0t}e^{im\phi}+g_-e^{-iE_-t}e^{i(m-1)\phi}$ with real profiles, the reconnections occur exactly at the points of the meridian half-plane where
$$\{\,|g_0|=2|g_+|\,\}\quad\text{meets}\quad\{\,|g_-|=|g_+|\,\},$$
at the times $t\equiv0$ (if $g_+g_->0$ there) or $t\equiv T_d/2$ (if $<0$) modulo the discriminant period $T_d=2\pi/|E_++E_--2E_0|$, at azimuth $\phi_d=\arg(-g_0/2g_+)-(E_0-E_+)t$. (The discriminant $g_0^2e^{-2iE_0t}-4g_+g_-e^{-i(E_++E_-)t}$ vanishes iff $e^{i(E_++E_--2E_0)t}$ equals the *real* number $g_0^2/4g_+g_-$.) So three-mode reconnections are never isolated in spacetime: they are a lattice in $t$ over a finite set in space, symmetry-protected whatever the three energies. Each event is its own $PT$ mirror.

### Theorem C.3 (the census law; Opus R4 C6, Fable R5 C6′; MEASURED on two states)
When every mode is stretched ($l=|m|$, profiles $\varsigma_m\sin^{|m|}\theta$), $\theta$ leaves the problem: with $W=\sin\theta\,e^{i\phi}$ the census is the root set of the **one-variable** function $\Phi(r)=\hat A_0^2-4|\hat A_+\hat A_-|$ subject to $\xi=|\hat A_0|/2|\hat A_+|\le1$. Inside the dominance window $\{\Phi<0\}$ every simple radial node of the lowest-$|m|$ mode is straddled by exactly two roots, and the window contributes its edges: $\#\{\Phi=0\}=2\nu+2c$ ($\nu$ nodes inside, $c$ components), and the reconnection points number $2(2\nu'+\epsilon)$ with $\epsilon\in\{0,1,2\}$ the **admissible edges**. MEASURED: $(3d_{+2}+4p_{+1}+5s)/\sqrt3$ has six roots $2.75348,\,6.36762,\,6.51013,\,14.32627,\,14.32955,\,20.05924$, the last inadmissible ($\xi=1.077$) — **ten** points, $T_d=481.265$; $(3d_{+2}+4p_{+1}+6s)$ has six roots $2.93271,\,6.27446,\,6.42918,\,13.78955,\,13.86667,\,19.24410$, all admissible — **twelve** points, the last a bulk reconnection at $(\rho,z)=(16.28,\pm10.26)$. The two states differ only in whether the window's outer edge is admissible. Blind grid searches find none of these (reconnections are points, not curves); the algebra finds all of them. The real-zero count obeys the Pólya–Szegő bound for exponential sums, $\#\{\Phi=0\}\le2(2n_0+n_++n_--3)=26$ here — fewnomials, not Bézout.

### Theorem C.4 (the generic reconnection exists; Opus R4, certified Fable R5)
For the cubic $P$ of $\psi=(3d_{+2}+4p_{+1}+5s+6p_{-1})/2$ the discriminant is a five-term exponential sum in $t$ with frequencies $738,775,832,869,1000$ (units $1/7200$), not a real number times one phase, and reconnections occur at generic times: the first at
$$t=113.5265785,\quad(\rho,z)=(0.9251468,\,-14.1594044),\quad\phi=2.5158634,$$
4-D Newton residual $3.9\times10^{-15}$ on the full $\psi$, coalescing roots at $|w|=1\pm4\times10^{-9}$, every beat phase generic ($t/T\bmod1=0.439,0.642,0.753,0.203,0.314,0.110$), $PT$ mirror at $T-t$ (residual $8.6\times10^{-14}$), $z$-mirror ($1.1\times10^{-15}$), square-root splitting $|w_1-w_2|=0.1714\sqrt{|\tau|}$ with the pair *not* reciprocal ($|w_1w_2|=1.0006,0.9994$ on the two sides) — the signature of an unprotected event. At least $1480$ events per period $T=2\pi\cdot7200$, still clustered on the radial nodes of the lowest-$|m|$ mode. At fixed position $\operatorname{disc}(t)$ has exactly $\omega_{\max}-\omega_{\min}=262$ zeros per period in complexified $t$ on four tilted lines (Pólya 1920; the corpus's L-0250 is this theorem in its own dress), and the real events are the crossings of those lines through the real axis at the balance radii of adjacent frequencies; the count from that picture is open (Q31).

### Theorem C.5 (escape along the nodes of the leading shell; Fable R3, exact rate Opus R4)
Let $n_{\max}$ be the largest shell in a superposition and $\Sigma$ the angular nodal set of its $n_{\max}$-components. Outside a compact set the nodal lines lie within $O(r^{\,l'-l_{\max}}e^{-r(1/n'-1/n_{\max})})$ of $\Sigma$, $n'$ the next shell; they are confined iff the $n_{\max}$-part has no angular node where a lower shell can compete. For $2p_++3p_0+3d_-$ two lines run to infinity along the equator at
$$|\cos\theta_{\rm esc}(r)|=\frac{81}{8}\,\frac{e^{-r/6}}{r}\quad\text{exactly}$$
($R_{21}/R_{32}=\tfrac{81\sqrt5}8r^{-1}e^{-r/6}$ and the equatorial angular ratio $1/\sqrt5$; MEASURED $|\cos\theta|\,re^{r/6}=10.125000$ at $r=20,\ldots,100$). The compact-core theorem of Round 2 is dead; its radius $20.475$ reappears as the dominance crossover $20.059$ past which the $(3,4,5)$ state cannot reconnect.

---

## 5 · The shell over a finite field

### Theorem F.1 (Opus R4; the law measured by Fable R3)
On degree-$N$ forms over $\mathbb F_q$, $q$ an odd prime, the fibre generator $\Lambda$ is diagonal on the monomials $a_1^pa_2^sb_1^rb_2^t$ of $\mathbb F_q(i)$ with eigenvalue $i(p+s-r-t)$, so
$$\dim\ker\Lambda|_{\deg N}=\sum_{\substack{0\le m\le N\\2m\equiv N\ (q)}}(m+1)(N-m+1),\qquad\dim\ker\Lambda|_{\deg2n-2}=(2J+1)n^2-q^2\frac{J(J+1)(2J+1)}3,\ J=\Big\lfloor\frac{n-1}q\Big\rfloor,$$
$=n^2$ iff $q>n-1$, first failure at $n=q+1$ ($\mathbb F_3$, $n=4$: $30$). Zero mismatches over $90$ cells. The mechanism is aliasing of the Hopf $U(1)$ weight modulo $q$, not Frobenius. Consequence: any $q\ge16$ carries the lab's shells $n\le15$ in exact arithmetic; the smallest balanced prime that does is $17$, and the corpus's terminal $37$ carries $n\le37$.

### Theorem F.2 (the even prime; Fable R5, proved)
Over any field of characteristic $2$: $\Lambda^2=E$ (Euler), so $\ker\Lambda=0$ on odd degree and $\Lambda^2=0$ on even degree; in the variables $a=u_1+u_4,x=u_1,b=u_2+u_3,y=u_2$, on even degree $\Lambda=a\partial_x+b\partial_y$ with
$$\ker=\mathbb F_2[a,b,x^2,y^2]\oplus(bx+ay)\,\mathbb F_2[a,b,x^2,y^2],\qquad\dim\ker\Lambda|_{\deg2n-2}=P_n+P_{n-1}=\frac{n(2n^2+1)}3,$$
the $n$-th **octahedral number** ($1,6,19,44,85,146,231,344,489,670$), $P_n$ the square pyramidal number. The proof inverts $a$, changes to $(a,b,x,u=bx+ay)$ where the derivation is $a\partial_x$, and descends by freeness over $\{1,x,y,xy\}$. Opus's fit to seven integers and his three predictions are its consequences; it is not the $q\to2$ limit of F.1 (which would give $40$ at $n=4$): where odd $q$ counts spectrally, $q=2$ counts geometrically, the lattice points of a tetrahedron.

### F.3 A count the corpus still owed (Fable R5, S9)
The finite-field handoff's §75 lists "prove the $q^2+1$ point count" of its elliptic quadric $x_1x_2=a^2-\Delta b^2$. Affine solutions: $(q^2-1)(q-1)+(2q-1)=q^3-q^2+q$; remove the origin, divide by $q-1$: $q^2+1$.

---

## 6 · What the corpus gave and what it lacked

L-0245 (Donoho–Stark/Hirschman equality states: subgroup cosets, converse Özaydın–Przebinda 2004) killed Ω₁ in Round 2 and names the extremal packets of Theorem A.5; its clause (iii), $\mathcal F\mathbf 1_S=\mathbf 1_S$ iff $N=n^2$ with $S=n\mathbb Z/N$, meets the deaf comb at $N=36$ by coincidence, not causation — deafness is Korselt's, self-duality is a square's. L-0250 (the tilted-line zero theorem) is Pólya–Langer for one complex variable and stages Theorem C.4's rate question correctly. Y-0143/0144 (the diagonal $6j$ symbol $\{j\,j\,J;j\,j\,J\}$, $D_j=\sum(2J+1)|6j|\sim0.8607\sqrt j$, "a uniform fold/Airy asymptotic is needed") is a fold caustic at $l_J=\sqrt2\,l_j$: the fold scaling $|6j|_{\rm fold}\asymp C\,j^{-4/3}$ over a layer $\sim j^{1/3}$ wide is MEASURED (exponent $-1.26\to-1.33$ over four doublings, exact Racah to $j=160$), and the layer's contribution to $D_j$ is $O(1)$, so $\rho_j=1/D_j\to0$ at rate $j^{-1/2}$ with a bounded oscillating remainder. The dossier's laws — "state, representation, or observer", "cull the observation, never the state", "an implementation must not be its own only oracle" — decided the instrument-facing questions and describe the protocol that produced this print. The corpus has no Airy, Laguerre, Sturm, characteristic-$p$ invariant theory, hydrogen, Kepler or incomplete-sum content: Theorems A.1–A.6, C.1–C.5 and F.2 have no ancestor in it.

---

## 7 · The conjectures

> ### Conjecture Ω₅ — the revival hears the packet, not the ladder
> *For a population profile $p$ on the Rydberg ladder, with $\mathcal A(p;a/b)$ the cubic-level revival height and $T_{\rm eff}=\lVert p\rVert_1^2/\lVert p\rVert_2^2$:*
> 1. *(ceiling — Theorem A.5)* $\mathcal A=1$ iff $am^3$ is affine on $\operatorname{supp}p$; for a full comb iff $b\mid6$.
> 2. *(floor — Theorem A.6 for the bound; conjecture for the gain)* $\mathcal A\ge\lVert p\rVert_2/\lVert p\rVert_1$, and $\inf_{a,b}\mathcal A(p;a/b)=\dfrac{\lVert p\rVert_2}{\lVert p\rVert_1}\sqrt{\ln T_{\rm eff}+c_0}\,(1+o(1))$ as the modulus range grows, $c_0=\tfrac12$ for uniform combs: the floor is Parseval times a Salem–Zygmund gain at half the random variance, and no arithmetic enters it.
> 3. *(extremal packets — L-0245)* among profiles of support size $T$ the Parseval floor $T^{-1/2}$ is attained exactly by modulated subgroup-coset indicators.
>
> *The arithmetic of the ladder enters through one Boolean. Ω₁ was a true statement about the wrong object. Falsifiers: a packet and a fraction with $b\nmid6$ and $\mathcal A>0.99$ at quartic $<0.05$; or a family in the incomplete régime on which $\kappa^2-\ln T_{\rm eff}$ moves by more than $0.3$.*

> ### Conjecture Ω₄′ — Airy universality of the revival
> *Every stationarity- or moment-defined observable of $I(\alpha,\beta)$ has a Gevrey-1 series in $\beta^2$ with singulant $-\tfrac1{54}$, late terms $\propto(-54)^k\Gamma(k)$, leading constant in $\tfrac1{\pi e}\mathbb Q$ and every $b_r\in\mathbb Q$.* Evidence: Theorems A.2 and A.3 (constants $\tfrac1{6\pi e}$, $\tfrac1{2\pi e}$; $b_1=-\tfrac79,-\tfrac{13}{18}$). Falsifier: a third observable with another singulant or an irrational constant.

The dead conjectures and what killed them are in §0. Between Ω₁ ("the revival is arithmetic") and Ω₅ lie five rounds and one reversal: the arithmetic is real, it is Fermat's, and it lives in the packet.

---

## 8 · Not certified, and the questions that remain

- Theorem A.2's $b_r$ for $r\ge2$ rest on a dictionary proved at $r=0,1$ and verified to $13$ digits; A.3's $b_1'=-\tfrac{13}{18}$ is a six-digit Richardson value. **Q32:** derive $b_1'$ and $b_2$ from the dictionary.
- The gain law $\kappa^2=\ln T+\tfrac12$ rests on four uniform combs with $T\le33$, $b\le60$. **Q30:** prove it; predict $\kappa$ at $T=129$, $b\le300$.
- Theorem C.3's law assumes simple nodes and a window avoiding $0$; both hold for the states measured. **Q27′:** prove the general form. **Q31:** derive the cubic's rate ($\ge1480$ per period, $\Delta t\le30.57$) from the balance radii and the $\theta$-elimination.
- Theorem B.3's universality is a rank computation for $n\le5$. **Q35:** the gate count at $n=3$ (parameter counting: $\ge3$ layers).
- Theorem F.2's odd-degree involution: **Q33:** its Jordan structure, and what finite-geometry object has $\tfrac{n(2n^2+1)}3$ points.
- The $6j$ fold: **Q34:** the Schulten–Gordon constant against the measured $C_{\rm fold}\approx0.21$, and $c_0$ of $D_j$.
- The f16 current gate for the instrument (Round 3 §3.4) was argued, not measured on a device. No GPU ran; nothing under `lab/` or `tests/` was touched.

---

## Appendix — the numbers that decide, and where they live

| quantity | value | probe |
|---|---|---|
| $\alpha^*$ series $C_1\ldots C_6$ | $-3,\ 54,\ -4860,\ 769824,\ -169746192,\ 47259985248$ | `bf-r3-stokes2.py` (60 exact) |
| Stokes constant, exponent, $b_1$ of $\alpha^*$ | $\tfrac1{6\pi e}$ (7 digits), $a=0$ ($2\times10^{-5}$), $-\tfrac79$ ($10^{-6}$) | `bf-r3-stokes2.py`, `bf-r4-stokes.py`, `bf-r5-stokes.py` |
| $|I|_{\max}$ series $D_0\ldots D_4$ | $1,\ -3,\ \tfrac{279}2,\ -\tfrac{29331}2,\ \tfrac{19280619}8$ | `bf-r5-stokes.py` |
| its constant and $b_1'$ | $\tfrac1{2\pi e}$ ($S\pi e=0.4999999$), $-\tfrac{13}{18}$ | `bf-r5-stokes.py` |
| alias offsets | $\Delta n_j=\tfrac12\sqrt{\bar nj}$ | `bf-r3-poisson.py`, `bf-r4-threadA2.py` |
| deaf combs; largest non-deaf peak ($b\le60$) | $b\mid6$: $1.000000$; $0.9622$ at $b=59$ | `bf-r4-comb.py`, `bf-r5-comb.py` |
| gain $\kappa$ for uniform $T=5,9,17,33$ | $1.4534,\ 1.6529,\ 1.8212,\ 1.9870$ | `bf-r5-comb.py` |
| $\langle z\rangle$ along the $K_z$ flow | $-3\tanh2\theta$ | `bf-r3-probes.py`, `bf-r4-corpus.py` |
| Lie closure $\langle\mathfrak{so}(4),\mathbf L^2\rangle$, $n=2..5$ | $15,\ 80,\ 255,\ 624$ | `bf-r5-lie.py`, `bf-r5-lie2.py` |
| $(3,4,5)$ census; $(3,4,6)$ census | $10$; $12$ | `bf-r4-c5census.py`, `bf-r5-census.py` |
| first generic reconnection | $t=113.5265785$, residual $3.9\times10^{-15}$ | `bf-r4-q22.py`, `bf-r5-event.py` |
| escape law | $|\cos\theta|\,re^{r/6}=10.125000$ | `bf-r4-verify.py` |
| $\mathbb F_q$ shell, $q=3$, $n=4,5,6$; $q=5$, $n=6$ | $30,\ 57,\ 90$; $58$ | `bf-r3-fq.py`, `bf-r4-fq.py` |
| $\mathbb F_2$ shell, $n=1..7$ | $1,6,19,44,85,146,231$ | `bf-r4-fq.py` (Theorem F.2 proves it) |
| diagonal $6j$: $D_j/\sqrt j$, fold exponent | $0.85$–$0.89$; $-1.33$ | `bf-r5-sixj.py` |
