# BEYOND THE FRONTIER · λWAVES — Round 2 · OPUS 5 (rival)

*Reply to Round 1 (Fable, `01-fable.md`). Every claim carries a seat — KNOWN (author, year) · DERIVED-HERE · MEASURED · UNVERIFIED (with the test) · REFUTED (by what number). Units: atomic, $E_n=-1/(2n^2)$, $T_{\rm cl}=2\pi\bar n^3$, $T_{\rm rev}=\tfrac{4\pi}{3}\bar n^4$.*

**Evidence.** Probes `research/probes/bf-r2-airy.py`, `bf-r2-arith.py`, `bf-r2-arith2.py`, `bf-r2-so4.py`, `bf-r2-vortex.py`, `bf-r2-vortex2.py`, `bf-r2-fock.py`, `bf-r2-hermite.py`, `bf-r2-gauss.py`, `bf-r2-recon.py` (float64 / mpmath dps 40 / sympy; `~/miniforge3/envs/sci/bin/python`). Section letters below (A–L, M1–M7, V1–V5, W1–W3, H1–H5, G1–G5, R1–R4) name the probe blocks that produced each number.

---

## 0 · Verdicts on Round 1

| # | Round-1 claim (quoted) | Verdict | The number that decides it |
|---|---|---|---|
| **A1a** | "$\alpha^*=-3\beta+\tfrac{99}{2}\beta^3+O(\beta^5)$" | **REFUTED** | The coefficient is $\mathbf{54}$, not $99/2=49.5$. Two independent derivations (corrected Hermite calculus; Airy log-derivative in $1/L$) agree. Against Round 1's own MEASURED $\alpha^*/(-3\beta)=0.9930$ at $\beta=0.02$: $54$ gives $0.99306$, $99/2$ gives $0.99340$. |
| **A1b** | "$\vert I\vert_{\max}=1-3\beta^2+O(\beta^4)$" | **STANDS, SHARPENED** | $\vert I\vert_{\max}=1-3\beta^2+\tfrac{279}{2}\beta^4+O(\beta^6)$. At $\beta=0.02$: $1-\vert I\vert_{\max}=1.1778\times10^{-3}$ vs Round 1's MEASURED $1.18\times10^{-3}$. |
| **A1c** | the boxed ladder law $t^*$, $\vert A(t^*)\vert$ | **SHARPENED** | $t^*=T_{\rm rev}-\tfrac{4\sigma^2}{\bar n}\big(1-18\beta^2+1620\beta^4\big)T_{\rm cl}$ (not $\tfrac{33}{2}\beta^2$), and the law needs a *second* small parameter $\beta_4=10\pi\sigma^4/(3\bar n^2)$, valid only for $\sigma\lesssim0.556\sqrt{\bar n}$; §1.2, §2.7. |
| **A1d** | "the discrete ladder agrees with the continuum model … for every $(\bar n,\sigma)$ with $\beta\le0.32$" | **STANDS** (and is the whole of its validity) | At $\beta=2.234$ ($\bar n=30$, $\sigma=2$) the continuum gives $0.6228$, the ladder $0.80546$ — a $29\%$ error. |
| **A1e** | "a **cubic Gauss sum** is deciding the revival" | **REFUTED** | §2. Four independent numbers. |
| **Ω₁ (mechanism)** | "for $\beta\gtrsim1$ [$\sup\vert A\vert$] is governed by the cubic Gauss sum $\sum_{k\bmod b}e^{2\pi iak^3/b}$ … the revival 'hears' the denominator of $\bar n$" | **REFUTED** | An arithmetic-free Taylor-6 model matches the exact ladder to $\max\vert\Delta\vert=1.45\times10^{-3}$, RMS $5.1\times10^{-4}$, across $\bar n=26\ldots52$ at $\sigma=2$, where the ladder's own spread is $0.1667$. Correlation of the exact residual with *every* feature of $b$: $\vert r\vert\le0.309$; with the arithmetic-free model: $r=+0.9998$. |
| **Ω₁ (conclusion)** | "two ladders with the same $\beta$ and different $\bar n$ revive differently — $\sup\vert A\vert$ is not a function of $\beta$ alone" | **STANDS** | At $\beta=2.234021$ held **exactly** fixed, $\sup\vert A\vert$ ranges over $[0.5960,\,0.8055]$ — a spread of $0.2095$. True conclusion, false mechanism. |
| **Ω₁ (falsifier)** | "*What would break it:* two ladders with equal $\beta$ and **coprime** denominators" | **DEAD ON ARRIVAL — unsatisfiable** | $b=3\bar n/\gcd(4,3\bar n)$ and $\gcd(4,3\bar n)\in\{1,2,4\}$ is never divisible by $3$, so $3\mid b$ for **every** $\bar n$. No two ladders ever have coprime denominators. The conjecture was written with a test that can never be run. |
| **Q7 premise** | "locate the first competing maximum" | **REFUTED as posed** | There is a second local maximum, on the Airy branch in $(a_2,a_1)=(-4.0879,-2.3381)$, but it **never** competes: proved below, ratio $\le 0.41902/0.53566=0.7823$ for all $\beta$, $\to0$ as $\beta\to0$. |
| **B1** (Fock's sphere) | as stated | **STANDS, SHARPENED** (KNOWN, Fock 1935) | Reproduced to $2.7\times10^{-15}$. But the prefactor is **not** $\sqrt{J}$: $W/\sqrt J=\sqrt{1+\cos\chi}$, MEASURED $1.414214$ at $p=0$, $0.447214$ at $p=3p_0$. Fock's map is unitary for the **Sturmian** weight; $\int\vert\Phi\vert^2d^3p=1$ only by the virial theorem. §3.1. |
| **B2** (KS count $n^2$) | as stated | **STANDS, SHARPENED** | MEASURED $1,4,9,16,25,36,49$. The fibre generator is $\Lambda=M_{23}-M_{14}$ (sympy: the $\mathfrak{so}(4)$ annihilator of the KS map is one-dimensional), and $P=\tfrac1{2\pi}\int_0^{2\pi}e^{ia\Lambda}da$. §3.2. |
| **B3 headline** | "$e^{-i\theta K_z}$ rotates $2s$ into $2p_z$ continuously inside the shell" | **STANDS**, now VERIFIED | $\langle2p_0\vert K_z\vert2s\rangle=1.000000000000$, $\langle3d_0\vert K_z\vert3p_0\rangle=2/\sqrt3=1.154700538379$; worst error over all $n\le6$: $4.4\times10^{-16}$. §4.1. |
| **B3 picture** | "through the parabolic (Stark) states at $\theta=\pi/4$" | **REFUTED** | $\langle z\rangle(\theta)\equiv0$ along the whole flow (MEASURED $\le10^{-16}$ at five $\theta$), while the Stark states have $\langle z\rangle=\mp3.00000000$. And *no* $SO(4)$ element can reach them: orbit dimensions $3\ne4$ (Theorem 4). §4.2–4.3. |
| **Q10** (the KS clock) | "prove or refute" | **CONFIRMED, and shown to be a tautology** | $(N+2)\omega=1.000000000000000$ for every $n$ — but $H^{(n)}_{\rm osc}$ is built from $E_n$. Cross-shell: $dt=r\,ds$ and $\langle r\rangle_{\max}/\langle r\rangle_{\min}=1.3501$ for $(1s+2s)/\sqrt2$: the KS clock is **not** lab time. §3.3. |
| **C1** (rigid rotation) | as stated | **STANDS**, and is a corollary | It is the binomial case of the unimodular-root theorem (Theorem 5): $aw^{\Delta m}+b$ has $\vert\Delta m\vert$ unimodular roots exactly on the Schur–Cohn locus $\vert a\vert=\vert b\vert$. §5.1. |
| **C2** (still frames) | as stated | **STANDS, SHARPENED** | The still frames are the fixed times of an antiunitary ($PT$) symmetry — the same mechanism that protects the Q11 reconnections (Theorem 6). §5.5. |
| **Q11** (three-mode reconnection) | "find the first instant at which two vortex lines reconnect" | **ANSWERED, and the question's premise corrected** | The state is *already at* a reconnection at $t=0$; the next is $t=T_{\rm beat}/2=45.238934$ a.u. at $(x,y,z)=(-0.91313,0,+4.61926)$. Reconnections happen at $\tau\equiv0,\pi$ **and nowhere else**, symmetry-protected. Normal form $\xi B=-f_0s$. Lines are conserved through a large sphere only vacuously: $r_{\rm core}=20.475395$. §5.2–5.4. |
| **ledger Q5** | the winding $(n_2^2,n_1^2)$, and the "caustic $J=0$" | **REFUTED (both)** | Lowest terms: $2s{+}4s$ is $4{:}1$, not $16{:}4$ (4 of 7 pairs wrong). And $J=\vert c_1\vert^2-\vert c_2\vert^2$ is a constant of the motion, so $\{J=0\}$ is the whole orbit or empty — never an envelope. §6. |
| **ledger Q6** | the launch loss | **ANSWERED** | $\sum_{n\le6}\vert\langle nlm\vert G\rangle\vert^2=0.2977$; $\sum_{n\le15}=0.3278$. The cause is $\langle H\rangle=+0.1075>0$ — **the packet is unbound**, and no register enlarges past it. §6. |

---

## 1 · Thread A closed — the revival is an Airy function, exactly

### 1.1 The closed form (DERIVED-HERE; the Airy–Gaussian integral is KNOWN, cf. Vallée–Soares 2004 §3)

Round 1 says "the model's $|I|$ is an Airy function of complex argument". It is an Airy function of **real** argument, and $I$ is **real**. Complete the cube: in
$$I(\alpha,\beta)=\frac{1}{\sqrt{2\pi}}\int e^{-u^2/2}e^{i(\alpha u+\beta u^3)}\,du$$
put $u=v-\tfrac{i}{6\beta}$. The $v^2$ terms cancel identically ($-\tfrac12-3\beta c=0$ at $c=-\tfrac1{6\beta}$), leaving a pure cubic-plus-linear phase, and $\int e^{i(t^3/3+zt)}dt=2\pi\mathrm{Ai}(z)$ gives

$$\boxed{\;I(\alpha,\beta)=\sqrt{2\pi}\,(3\beta)^{-1/3}\,\exp\!\Big(\frac{\alpha}{6\beta}+\frac{1}{108\beta^{2}}\Big)\;\mathrm{Ai}\!\left(\frac{\alpha+\frac{1}{12\beta}}{(3\beta)^{1/3}}\right)\;}$$

MEASURED (bf-r2-airy §1–2, mpmath dps 40): the closed form agrees with quadrature to $2.7\times10^{-40}$ at $\beta=0.02$ and to $10^{-27}$ at $\beta=0.1$ (the residual at larger $\beta$ is the quadrature's, not the formula's). Writing $\lambda:=3^{1/3}/(6\beta^{2/3})=\tfrac16(3/\beta^2)^{1/3}$ and $z=(3\beta)^{-1/3}(\alpha+\tfrac1{12\beta})$, the maximiser obeys the **exact** transcendental law
$$\frac{\mathrm{Ai}'(z^*)}{\mathrm{Ai}(z^*)}=-\lambda .$$

### 1.2 Q7 (DEEPEN) — the coefficients, and Round 1's error

**Round 1's boxed claim: "$\alpha^*=-3\beta+\tfrac{99}{2}\beta^3+O(\beta^5)$". REFUTED. The coefficient is $54$.**

The error is a dropped cross-term. With $R:=I/e^{-\alpha^2/2}=\sum_m \beta^m\mathrm{He}_{3m}(\alpha)/m!$ (real; the factor $(i\beta)^mi^{3m}=\beta^m$), the correct expansion (bf-r2-hermite H1, sympy) is
$$\log|I|=-\tfrac{\alpha^2}{2}-3\alpha\beta-\tfrac{15}{2}\beta^{2}+\alpha^{3}\beta+18\alpha^{2}\beta^{2}+\mathbf{135}\,\alpha\beta^{3}+405\beta^{4}+O(\beta^{6}).$$
Round 1 wrote $\tfrac{945}{6}=\tfrac{315}{2}=157.5$ for the $\alpha\beta^3$ coefficient, taking it straight from $\mathrm{He}_9$'s linear term. It forgot $-\tfrac12(R-1)^2\ni-\tfrac12\cdot2(-3\alpha\beta)(-\tfrac{15}{2}\beta^2)=-\tfrac{45}{2}\alpha\beta^3$. $157.5-22.5=135$. Then $-\alpha-3\beta+3\alpha^2\beta+36\alpha\beta^2+135\beta^3=0$ at $\alpha=-3\beta+C\beta^3$ gives $C=27-108+135=54$.

**The answer to Q7, both series (DERIVED-HERE twice, independently, and MEASURED to 9 digits):**
$$\boxed{\;\alpha^*(\beta)=-3\beta+54\beta^{3}-4860\beta^{5}+769824\beta^{7}+O(\beta^{9})\;}$$
$$\boxed{\;|I|_{\max}(\beta)=1-3\beta^{2}+\tfrac{279}{2}\beta^{4}-\tfrac{29331}{2}\beta^{6}+O(\beta^{8})\;}$$

*Derivation 2 (the Airy route).* Riccati $w'+w^2=z$ for $w=\mathrm{Ai}'/\mathrm{Ai}$ gives $w=-z^{1/2}-\tfrac1{4z}+\tfrac{5}{32z^{5/2}}-\tfrac{15}{64z^{4}}+\tfrac{1105}{2048z^{11/2}}-\dots$; solving $w(z^*)=-\lambda$ gives $\sqrt{z^*}=\lambda-\tfrac1{4\lambda^2}+\tfrac1{32\lambda^5}-\tfrac9{128\lambda^8}+\tfrac{315}{2048\lambda^{11}}-\dots$; and since $(3\beta)^{1/3}\lambda^{2}=\tfrac1{12\beta}$ **exactly**, the $\lambda^2$ term cancels the $-1/(12\beta)$ and $\alpha^*=(3\beta)^{1/3}[\,-\tfrac1{2\lambda}+\tfrac1{8\lambda^4}-\tfrac5{32\lambda^7}+\tfrac{11}{32\lambda^{10}}-\dots]$ with $(3\beta)^{1/3}\lambda^{-(3j+1)}=6\beta,\,432\beta^3,\,31104\beta^5,\,2239488\beta^7$. Identical series (bf-r2-hermite H2). $\square$

MEASURED (bf-r2-airy §4, Richardson on the exact Airy maximiser): writing $\alpha^*/(-3\beta)=1-C\beta^2+D\beta^4$, the extraction converges to $C=17.999999990$ and $D=1619.87$ — i.e. $C=18=54/3$ and $D=1620=4860/3$; and $1-|I|_{\max}=A_2\beta^2+A_4\beta^4$ converges to $A_2=2.999999999$, $A_4=-139.4928$, i.e. $3$ and $-279/2$. Against Round 1's own MEASURED table:

| $\beta$ | MEASURED $\alpha^*/(-3\beta)$ | Round 1's $1-\tfrac{33}{2}\beta^2$ | **this round**, $1-18\beta^2+1620\beta^4$ |
|---|---|---|---|
| 0.02 | 0.99304408 | 0.99340 | **0.993060** |
| 0.05 | 0.96246021 | 0.95875 | **0.965125** |

and $1-|I|_{\max}=1.178562\times10^{-3}$ at $\beta=0.02$ against $3\beta^2-\tfrac{279}{2}\beta^4=1.17777\times10^{-3}$ (Round 1's $3\beta^2$: $1.2\times10^{-3}$).

**The kill is airtight because Round 1's own measurements confirm the exact law.** The exact Airy maximiser gives $\alpha^*/(-3\beta)=0.99304408,\,0.96246021,\,0.89171346,\,0.76289530$ at $\beta=0.02,0.05,0.10,0.20$ — matching Round 1's MEASURED $0.9930,\,0.9625,\,0.8917,\,0.7629$ in **every printed digit**. Round 1 measured the right curve and then wrote down a series that misses it at second order: its own $\beta=0.02$ row disagrees with its own theorem by $4\times10^{-4}$, ten times the disagreement with mine ($4\times10^{-5}$).

**Ladder form, corrected.** With $x=\alpha/(2\pi\sigma)$ and $3\beta/(2\pi\sigma)=4\sigma^2/\bar n$,
$$t^*=T_{\rm rev}-\frac{4\sigma^{2}}{\bar n}\Big(1-18\beta^{2}+1620\beta^{4}\Big)T_{\rm cl}+O(\beta^{7}),\qquad |A(t^*)|=1-3\beta^{2}+\tfrac{279}{2}\beta^{4}+\dots$$
Round 1's $\big(1-\tfrac{33}{2}\beta^2\big)$ is **DEAD**; the coefficient is $18$.

### 1.3 Q7 (LOCATE) — "the first competing maximum" does not exist. THEOREM.

**Theorem 1 (uniqueness of the global maximiser; DERIVED-HERE, rigorous).** *For every $\beta>0$, $|I(\cdot,\beta)|$ has exactly one global maximiser, namely the principal Airy branch $z^*\in(a_1',\infty)$, where $a_1'=-1.0187929716$ is the first extremum of $\mathrm{Ai}$. No secondary maximum ever competes.*

*Proof.* $|I|\propto e^{\lambda z}\mathrm{Ai}(z)=:u(z)$, $\lambda>0$. Critical points are the solutions of $\mathrm{Ai}'/\mathrm{Ai}=-\lambda$. On each interval $(a_{j+1},a_j)$ between consecutive Airy zeros, $\mathrm{Ai}'/\mathrm{Ai}$ runs monotonically from $+\infty$ to $-\infty$, so there is exactly one critical point $z^*_j$ per interval, plus $z^*_1\in(a_1,\infty)$. For $j\ge2$, $z^*_j<a_1=-2.3381074105$ and $|\mathrm{Ai}(z^*_j)|\le|\mathrm{Ai}(a_j')|\le|\mathrm{Ai}(a_2')|=0.4190154780$, so
$$|u(z^*_j)|\;\le\;e^{\lambda a_1}\cdot 0.4190154780 .$$
For the principal branch set $\varphi(\lambda):=e^{\lambda(z^*_1-a_1)}\mathrm{Ai}(z^*_1)$, so $|u(z^*_1)|=\varphi(\lambda)e^{\lambda a_1}$. By the envelope theorem, and because $\mathrm{Ai}'(z^*_1)/\mathrm{Ai}(z^*_1)=-\lambda$ makes the $dz^*_1/d\lambda$ term vanish identically,
$$\frac{d\log\varphi}{d\lambda}=z^*_1-a_1\;\ge\;a_1'-a_1=1.3193144>0 .$$
Hence $\varphi$ is strictly increasing and $\varphi(\lambda)\ge\varphi(0)=\mathrm{Ai}(a_1')=0.5356566560>0.4190154780$. Therefore $|u(z^*_1)|>|u(z^*_j)|$ for every $j\ge2$ and every $\lambda>0$. $\square$

MEASURED (bf-r2-airy §5, and bf-r2-hermite H5): the ratio second-lobe/principal-lobe is $1.5\times10^{-3}$ at $\beta=0.05$, $0.1298$ at $\beta=0.2$, $0.5535$ at $\beta=2$, $0.7630$ at $\beta=100$, and $0.782052$ at $\beta=10^5$, converging to the theorem's limit $0.4190154780/0.5356566560=0.7822464$ from below. **It never reaches 1.** Q7's request to "locate the first competing maximum" is answered: it is at $z\in(a_2,a_1)$, and it is never a competitor.

### 1.4 Q7 (the radius of validity) — the series is divergent, and the floor is $e^{-1/(54\beta^2)}$

The Hermite series for $I$ converges for all $\beta$ ($I$ is entire), but the *solution* $\alpha^*(\beta)$ has only an **asymptotic** expansion. Its coefficients $3,\,54,\,4860,\,769824,\,\approx1.70\times10^{8}$ grow with ratios $18,\,90,\,158,\,221$ — Gevrey-1 in $\beta^2$. The natural resurgent scale is the Airy instanton at the maximiser, $2\zeta=\tfrac43 z^{*3/2}\simeq\tfrac43\lambda^3=\dfrac{1}{54\beta^{2}}$:

$$\boxed{\;\text{optimal truncation order}\;N_{\rm opt}\simeq\frac{1}{54\beta^{2}},\qquad \text{floor}\;=\;O\!\big(e^{-1/(54\beta^{2})}\big).\;}$$

MEASURED (bf-r2-hermite H4): floor $=7.8\times10^{-21}$ at $\beta=0.02$ (terms still falling at order 9), $6.1\times10^{-4}$ at $\beta=0.05$, $0.157$ at $\beta=0.1$ (terms stop falling at order 3), $0.63$ at $\beta=0.2$. **This is the honest radius of validity Q7 asked for**: not a bifurcation of maxima (there is none, Theorem 1) but the exponentially small remainder of a divergent series. And the $\beta^9$ coefficient extracted numerically, $-1.6956\times10^{8}$, is the check.

---

## 2 · Q8 and Conjecture Ω₁ — the autopsy

Round 1: *"the phases $\beta k^3$ live on $\mathbb Z$ modulo $2\pi$, and for $\bar n=30$, $\beta k^3=\tfrac{4\pi}{45}k^3$ depends on $k^3\bmod45$ — a **cubic Gauss sum** is deciding the revival."* And Ω₁: *"for $\beta\gtrsim1$ [$\sup|A|$] is governed by the cubic Gauss sum $\sum_{k\bmod b}e^{2\pi iak^3/b}$ … so that two ladders with the same $\beta$ and different $\bar n$ revive differently — the revival 'hears' the denominator of $\bar n$."*

**The conclusion is right. The mechanism is wrong. Six numbers.**

### 2.1 The exact phase law, and why no modulus can enter (DERIVED-HERE; MEASURED to $5\times10^{-15}$)

At $t=T_{\rm rev}+xT_{\rm cl}$ the phase of mode $n$ is **exactly**
$$\frac{\theta_n(x)}{2\pi}=\frac{\bar n^{3}\,(2\bar n+3x)}{6\,n^{2}} ,$$
verified against the direct exponential to $4.7\times10^{-14}$ at four $(\bar n,\sigma,x)$ (bf-r2-arith A). At $x=0$ with $3\mid\bar n$, $Q:=\bar n^4/3\in\mathbb Z$ and $|A(T_{\rm rev})|=\big|\sum_n p_n\,e(Q/n^2)\big|$ exactly — a genuinely arithmetic expression, whose in-phase set $\{n:n^2\mid Q\}$ is computable ($\bar n=30$: $\{12,15,20,25,30\}$; $\bar n=45$: $\{27,45\}$). **But $\sup|A|$ is a supremum over the continuous variable $x$**, and the maximiser sits at an irrational $x^*$ ($\bar n=30,\sigma=2$: $x^*=-0.113250$, $s^*=2\bar n+3x^*=59.660250$). A cubic Gauss sum requires the *whole* phase to be a rational form on $\mathbb Z/b$; the linear coefficient $2\pi x$ is free. **Ω₁ has no mechanism** (bf-r2-arith2 L).

### 2.2 The falsifier Ω₁ names is unsatisfiable (DERIVED-HERE)

$\beta/2\pi=4\sigma^3/(3\bar n)$, so for integer $\sigma$ the denominator is $b=3\bar n/\gcd(4\sigma^3,3\bar n)$, and $\gcd(4\sigma^3,3\bar n)$ is never divisible by $3$ when $3\nmid\sigma$. Hence $3\mid b$ **always**, and $b/\bar n\in\{3,\tfrac32,\tfrac34\}$ at $\sigma=1$. Two ladders can never have coprime denominators. Ω₁'s stated falsification test can never be run — the conjecture as written is unfalsifiable *and* false.

### 2.3 The Gauss sum is identically zero for most of the ladders it is said to govern (MEASURED)

bf-r2-gauss G2, $\sigma=2$, $\bar n=26\ldots52$, $S(a,b):=\sum_{k\bmod b}e(ak^3/b)$ with $\beta/2\pi=a/b$ in lowest terms:

| $\bar n$ | $a/b$ | $\lvert S(a,b)\rvert$ | $\lvert S\rvert/b$ | EXACT $\sup\lvert A\rvert$ | Taylor-6 |
|---|---|---|---|---|---|
| 26 | 16/39 | **0** | 0 | 0.795658 | 0.796158 |
| 30 | 16/45 | **0** | 0 | 0.805458 | 0.806378 |
| 32 | 1/3 | **0** | 0 | 0.737629 | 0.739079 |
| 36 | 8/27 | 9.0000 | 0.33333 | 0.703913 | 0.703999 |
| 39 | 32/117 | 13.8379 | 0.11827 | 0.677602 | 0.677257 |
| 42 | 16/63 | 36.0134 | 0.57164 | 0.661590 | 0.661617 |
| 48 | 2/9 | 4.0419 | 0.44910 | 0.645668 | 0.645802 |
| 52 | 8/39 | **0** | 0 | 0.682768 | 0.682786 |

$|S(a,b)|=0$ for **23 of the 27** ladders in the window, while $\sup|A|$ ranges over $[0.6387,0.8055]$ throughout. Pearson correlation with the exact revival height:
$$r\big(|S|/b,\ \sup|A|\big)=-0.3010,\qquad r\big(\text{Taylor-6},\ \sup|A|\big)=+0.9999 .$$
Mean $|S|/b=0.0545$ against mean $\sup|A|=0.7054$ — a factor of $12.94$. **A quantity that vanishes identically in 85 % of the cases cannot govern a quantity that never leaves $[0.64,0.81]$.**

### 2.4 The two limits run opposite ways (DERIVED-HERE + MEASURED)

By Weil, $|S(a,b)|\le2\sqrt b$ for prime $b$ (and $\ll_\varepsilon b^{1/2+\varepsilon}$ in general), so any normalised Gauss-sum predictor obeys $|S|/b\le2/\sqrt b\to0$ as $\bar n\to\infty$. The exact revival does the opposite: at fixed $\sigma$, $\beta_3=8\pi\sigma^3/(3\bar n)\to0$ and $\sup|A|\to1$. MEASURED (bf-r2-gauss G3):

| $\bar n$ | $\sigma$ | $b$ | $2/\sqrt b$ | EXACT $\sup\lvert A\rvert$ |
|---|---|---|---|---|
| 90 | 0.8 | 16875 | 0.01540 | 0.993853 |
| 150 | 0.8 | 28125 | 0.01193 | 0.997661 |
| 240 | 0.8 | 5625 | 0.02667 | 0.999067 |
| 400 | 0.8 | 9375 | 0.02066 | 0.999634 |

At $\bar n=400$ the Gauss-sum ceiling is $0.0207$ and the revival is $0.99963$ — a factor of $48$, growing without bound.

### 2.5 The uncertainty kill: the packet never completes one period (DERIVED-HERE, with the corpus)

`LUX JSY LIBRARY/ALL DISK ⟡/GENERAL MATHEMATICS LIBRARY.md`, **L-0245** ("Donoho–Stark/Hirschman equality states on $\mathbb Z/N$", §24) gives the sharp statement: for $f\ne0$ on $\mathbb Z/N$, $|\mathrm{supp}f|\cdot|\mathrm{supp}\widehat f|\ge N$, with equality **iff** $f$ is a modulated indicator of a coset of a subgroup (the Heisenberg–Weyl orbit). Apply it with $N=b$: the Gaussian packet occupies an effective window of $W\approx8\sigma+1$ consecutive integers, so its transform on $\mathbb Z/b$ has support $\ge b/W$ — it is spread over $b/W$ classes and cannot be a function of $k^3\bmod b$. MEASURED (bf-r2-gauss G4):

| $\bar n$ | $\sigma$ | $b$ | $W=8\sigma+1$ | $b/W$ |
|---|---|---|---|---|
| 30 | 2.0 | 45 | 17.0 | 2.6 |
| 45 | 2.0 | 135 | 17.0 | 7.9 |
| 90 | 0.8 | 16875 | 7.4 | 2280 |
| 150 | 0.8 | 28125 | 7.4 | 3801 |

A physical Rydberg packet needs $\sigma\ll\bar n$, and $b\ge\tfrac34\bar n$; hence $W\ll b$ **always**. And L-0245's equality clause says exactly which packets *would* see the residues: modulated indicators of cosets of subgroups of $\mathbb Z/b$ — never a Gaussian.

### 2.6 The arithmetic-free model reproduces everything (MEASURED — the kill)

Truncate the exact energy expansion at order $J$: the phase coefficients $c_j=(-1)^j(j+1)/(2\bar n^{2+j})$ are **smooth** in $(\bar n,\sigma)$, with no modulus anywhere. bf-r2-arith2 I–K, $\sigma=2$, $\bar n=26\ldots52$ (27 ladders, denominators $b\in\{21,24,27,\dots,153\}$):

- Taylor-6 vs EXACT: $\max|\Delta|=1.45\times10^{-3}$, RMS $=5.12\times10^{-4}$.
- Taylor-4 vs EXACT: $\max|\Delta|=2.97\times10^{-2}$, RMS $=1.23\times10^{-2}$.
- The ladder's own spread across the window: $0.6387\ldots0.8055$, **range $0.1667$**.

An explicitly arithmetic-free model tracks the full $0.167$ wiggle to $0.87\,\%$ of its amplitude. The correlations of the exact residual (after removing a degree-5 fit in $1/\bar n$; residual RMS $2.342\times10^{-2}$) against every arithmetic feature of $b$:

| feature | $b/\bar n$ | $v_3(b)$ | $v_2(\bar n)$ | $\bar n\bmod3$ | $\bar n\bmod4$ | $\log b$ | **Taylor-6 residual** |
|---|---|---|---|---|---|---|---|
| $r$ | $+0.1417$ | $+0.1227$ | $-0.1988$ | $+0.0229$ | $+0.3088$ | $+0.1773$ | $\mathbf{+0.9998}$ |

**$|r|\le0.309$ for every feature of $b$; $r=+0.9998$ for the model with no arithmetic in it.** Conjecture Ω₁'s mechanism is REFUTED.

### 2.7 The constructive replacement: the dephasing hierarchy (DERIVED-HERE)

**Theorem 2 (the revival hierarchy).** *At $t=T_{\rm rev}+xT_{\rm cl}$ with $\tfrac{2\bar n}{3}\in\mathbb Z$, the phase of mode $k=n-\bar n$ is exactly*
$$\theta_k(x)=-2\pi xk+\frac{3\pi x}{\bar n}k^{2}+\sum_{j\ge3}(-1)^{j}\frac{2\pi(j+1)}{3}\frac{k^{j}}{\bar n^{\,j-2}}\;-\;\frac{4\pi x}{\bar n^{2}}k^{3}+O\!\Big(\frac{x k^4}{\bar n^3}\Big),$$
*so on $u=k/\sigma$ the dephasing coefficients are*
$$\boxed{\;\beta_j=\frac{2\pi(j+1)}{3}\,\sigma^{2}\mu^{\,j-2},\qquad \mu:=\frac{\sigma}{\bar n},\qquad \frac{\beta_{j+1}}{\beta_j}=\frac{j+2}{j+1}\,\mu\;}$$
*with $\beta_3=8\pi\sigma^3/(3\bar n)$ = Round 1's $\beta$, $\beta_4=10\pi\sigma^4/(3\bar n^2)$, $\beta_5=4\pi\sigma^5/\bar n^3$. Theorem A1 is the $\beta_3$-only truncation and its true validity condition is $\beta_4\ll1$, i.e.*
$$\sigma\;\lesssim\;\Big(\tfrac{3}{10\pi}\Big)^{1/4}\sqrt{\bar n}\;=\;0.5559\,\sqrt{\bar n}\,.$$

MEASURED (bf-r2-gauss G5): at $\bar n=30,\sigma=2$, $\beta_4=0.186$ and dropping it costs $0.0638$ in $\sup|A|$ ($0.74171$ against the exact $0.80546$) — **not small**. At $\bar n=30,\sigma=3$, $\beta_4=0.942$ and Taylor-3 gives $0.59075$ against $0.71955$: a $0.129$ error. At $\bar n=150,\sigma=0.8$, $\beta_4=1.9\times10^{-4}$ and Taylor-3 is exact to $6.8\times10^{-10}$.

**The corrected conjecture (this round's replacement).**

> **Conjecture Ω₁′ (the revival is analytic, not arithmetic; UNVERIFIED, with the test).** $\sup_{|t-T_{\rm rev}|<T_{\rm cl}/2}|A(t)|$ is a real-analytic function of $(\beta_3,\mu)$ alone, up to lattice (Poisson) corrections of relative size $O(e^{-2\pi^2\sigma^2})$; it contains no arithmetic invariant of $\bar n$. *What would break it:* two ladders agreeing in $(\beta_3,\mu)$ to $10^{-6}$ whose $\sup|A|$ differ by more than $10^{-3}$; or an arithmetic feature of $\bar n$ correlating with the residual at $|r|>0.5$ over a window of 25 ladders.

**The decisive test, at Ω₁'s own fixed $\beta$** (bf-r2-gauss G5). Hold $\beta_3=2.234021$ exactly by $\sigma=2(\bar n/30)^{1/3}$ — so $\sigma$ is irrational and the "denominator" $b\sim10^{21}$ is meaningless:

| $\bar n$ | $\sigma$ | $\mu$ | $\beta_4$ | EXACT $\sup\lvert A\rvert$ | Taylor-6 | $\lvert\Delta\rvert$ |
|---|---|---|---|---|---|---|
| 30 | 2.00000 | 0.06667 | 0.18617 | 0.805458 | 0.806378 | $9.2\times10^{-4}$ |
| 31 | 2.02198 | 0.06523 | 0.18214 | 0.724583 | 0.724695 | $1.1\times10^{-4}$ |
| 32 | 2.04349 | 0.06386 | 0.17833 | 0.730613 | 0.732221 | $1.6\times10^{-3}$ |
| 35 | 2.10545 | 0.06016 | 0.16799 | 0.749893 | 0.749609 | $2.8\times10^{-4}$ |
| 40 | 2.20128 | 0.05503 | 0.15368 | 0.622673 | 0.623065 | $3.9\times10^{-4}$ |
| 44 | 2.27234 | 0.05164 | 0.14422 | 0.629940 | 0.630251 | $3.1\times10^{-4}$ |
| 49 | 2.35535 | 0.04807 | 0.13423 | 0.596033 | 0.595946 | $8.7\times10^{-5}$ |
| 55 | 2.44781 | 0.04451 | 0.12428 | 0.640687 | 0.640789 | $1.0\times10^{-4}$ |

Exact spread at fixed $\beta_3$: $0.5960\ldots0.8055$, **range $0.2095$** — Ω₁'s *conclusion* confirmed, decisively, and this is the number Round 1 should have printed. Taylor-6, with no arithmetic and no $b$: $\max|\Delta|=1.6\times10^{-3}$, RMS $6.5\times10^{-4}$, $r=+0.99966$. **The spread is the hierarchy $\beta_4,\beta_5,\dots$, not the denominator.**

### 2.8 Two exact facts about the ladder that Round 1 missed (DERIVED-HERE, MEASURED)

**(i) The exact revival, and the only honest arithmetic in the thread.** $|A|=1$ exactly at $T=4\pi L^2$ with $L=\mathrm{lcm}\{n\in\mathrm{supp}\,p\}$, because $E_nT=-2\pi L^2/n^2\in2\pi\mathbb Z$. MEASURED (bf-r2-arith H): support $\{1,\dots,9\}$, $L=2520$, $T=7.980148\times10^{7}$ a.u., $|A(T)|=1.000000000000000$, $T/T_{\rm rev}=3.05\times10^{4}$. *This* — not $T_{\rm rev}$ — is the ladder's true period; it is an lcm, and it is the only place where the arithmetic of $\bar n$ genuinely governs the revival. Ω₁ looked for the arithmetic in the wrong term of the expansion.

**(ii) Q1 of the ledger, closed.** The textbook $T_{\rm rev}$ marker is honest ($|t^*-T_{\rm rev}|<0.01\,T_{\rm rev}$) iff $4\sigma^2/\bar n<0.01\cdot\tfrac{2\bar n}{3}$, i.e.
$$\boxed{\;\sigma<\bar n/\sqrt{600}=\bar n/24.495\;}$$
(bf-r2-fock Q1). At $\bar n=30$ that is $\sigma<1.225$; a demo at $\sigma=2$ **fails** it, and the peak lands $0.113\,T_{\rm cl}$ early.

---

## 3 · Thread B — Fock's sphere is not a measure pullback, and the KS clock

### 3.1 Q2 closed, and what "Fock's constant" actually is (DERIVED-HERE; MEASURED to $10^{-15}$)

Theorem B1 STANDS as an identity (checked to $8.9\times10^{-16}$ at $(n,l)=(2,1)$ and $2.7\times10^{-15}$ at $(3,2)$ against the Podolsky–Pauling closed form, bf-r2-fock Q2). But Round 1 does not say what the prefactor $W(p)=4p_0^{5/2}/(p_0^2+p^2)^2$ *is*, and the natural guess — that it is the square root of the Jacobian, making the map a measure pullback — is **false**.

The stereographic Jacobian is $J:=d\Omega_3/d^3p=\big(2p_0/(p_0^2+p^2)\big)^3$; MEASURED $\int J\,d^3p=19.739208802179=2\pi^2$ for every $p_0$, to 12 digits. But
$$\frac{W}{\sqrt J}=\frac{\sqrt2\,p_0}{\sqrt{p_0^2+p^2}}=\sqrt{1+\cos\chi}\;\ne\;1 ,$$
MEASURED $=1.414214,\,1.264911,\,1.000000,\,0.447214$ at $p=0,\tfrac12p_0,p_0,3p_0$ for each of $(n,l)=(1,0),(2,1),(3,2)$ — i.e. exactly $\sqrt2$ at the origin and $\sqrt{2}/\sqrt{10}$ at $p=3p_0$.

**Theorem 3 (what Fock's map is; DERIVED-HERE).** $W^2=J\,(1+\cos\chi)$ identically. Hence $\Phi_{nlm}=W\,Y_{Nlm}$ is a unitary
$$L^2\big(S^3,\,d\Omega_3\big)\;\longrightarrow\;L^2\big(\mathbb R^3,\,w\,d^3p\big),\qquad w(p)=\frac{1}{1+\cos\chi}=\frac{p^2+p_0^2}{2p_0^2},$$
*the Sturmian weight*, **not** $L^2(d^3p)$. The reason $\int|\Phi|^2d^3p=1$ nevertheless is that
$$\int|Y_{Nlm}|^2(1+\cos\chi)\,d\Omega_3=1+\langle\cos\chi\rangle=1\iff\langle p^2\rangle=p_0^2=\tfrac1{n^2},$$
*which is the virial theorem*. MEASURED: both integrals are $1.0000000000$ and $\langle p^2\rangle=1/n^2$ to $10^{-10}$ at $(n,l)=(1,0),(2,1),(3,0),(3,2),(5,3),(6,5)$; and $\max|W^2/(Jw)-1|$ ranges $2.75$–$2.99$, i.e. the naive identification fails by a factor of up to $4$. $\square$

**The instrument consequence (DERIVED-HERE).** $p_0=1/n$: *each shell sits on a sphere of a different radius*. A superposition across $n$ has **no common Fock sphere** — the "observer mode on $S^3$" the dossier proposes (`LAMBDAWAVES STUDY RESEARCH DOSSIER 2026-09-02.md`, §7.2) is well defined only shell by shell. The KS view has the identical defect with $\omega=1/(2n)=p_0/2$. This is the same disease in both of Round 1's "two exact 4D representations", and Round 1 does not name it.

### 3.2 Q3 closed — the KS projector, explicitly, and a correction to my own probe

With $x_1=u_1^2-u_2^2-u_3^2+u_4^2$, $x_2=2(u_1u_2-u_3u_4)$, $x_3=2(u_1u_3+u_2u_4)$, $r=|u|^2$ (sympy: $|x|^2-r^2\equiv0$), the linear span of $\mathfrak{so}(4)$ vector fields annihilating $(x_1,x_2,x_3)$ is **one-dimensional** (sympy, bf-r2-recon R1):
$$\boxed{\;\Lambda=M_{23}-M_{14}=u_2\partial_3-u_3\partial_2-u_1\partial_4+u_4\partial_1,\qquad \Lambda x_i=\Lambda r=0\;}$$
— exactly the annihilator of the KS bilinear constraint $u_4du_1-u_3du_2+u_2du_3-u_1du_4=0$, i.e. the Hopf fibre. The projector Q3 asks for is
$$P=\frac1{2\pi}\int_0^{2\pi}e^{ia\Lambda}\,da ,$$
and $\dim\ker\Lambda$ at level $N=2n-2$ is $n^2$: MEASURED $1,4,9,16,25,36,49$ against level dimensions $\binom{N+3}{3}=1,10,35,84,165,286,455$ for $n=1\ldots7$ (bf-r2-so4 M6). Lemma B2 **STANDS**.

*Self-correction.* My own bf-r2-so4 M6 asserted $\Lambda=M_{12}+M_{34}$ while printing $\Lambda x_1=4u_1u_2-4u_3u_4\ne0$ in the same block. That assertion is REFUTED by its own output; the generator is $M_{23}-M_{14}$. The $n^2$ count is unaffected — it was computed in the $w$-oscillator basis, not from the vector field.

### 3.3 Q10 closed — the KS clock is not lab time, and the confirmation is a tautology

**Confirmed, with a sharpening (DERIVED-HERE; MEASURED to $10^{-15}$).** On a shell, $H^{(n)}_{\rm osc}=-\tfrac18\nabla_u^2-E_n|u|^2$ has $\omega=\sqrt{-E_n/2}=1/(2n)$ and level $N=2n-2$, so $(N+2)\omega=1$ **exactly, for every $n$** ($n=1,2,3,6,15,30$: $1.000000000000000$). So $e^{-isH^{(n)}_{\rm osc}}=e^{-is}$: a global phase, and the KS oscillator view of a shell is **geometry with no dynamics**. But Round 1's Q10 does not notice that this is a tautology: $H^{(n)}_{\rm osc}$ is *built from* $E_n$, so the statement "$\;$eigenvalue $=1\;$" is the KS equation itself.

The honest cross-shell generators are two different operators:
$$rH=-\tfrac18\nabla_u^2-1\ \ (\text{a free 4D particle of mass 4}),\qquad \widetilde H=|u|^{-2}\big(-\tfrac18\nabla_u^2-1\big)\ \ (\text{self-adjoint for }|u|^2d^4u).$$
These generate different flows, and $dt=r\,ds$ makes $s(t)$ nonlinear. MEASURED for $(1s+2s)/\sqrt2$ (bf-r2-so4 M7): $\langle1s|r|1s\rangle=3/2$, $\langle2s|r|2s\rangle=6$, $\langle1s|r|2s\rangle=-0.5587016543$, so
$$\langle r\rangle(t)=3.750000-0.558702\cos(0.375000\,t),\qquad \frac{r_{\max}}{r_{\min}}=\frac{4.308702}{3.191298}=\mathbf{1.3501}.$$
**The KS clock runs $35\,\%$ faster at perihelion than at aphelion for this beat.** Answer to Q10's last clause: the Fabčič–Main–Wunner restricted-Gaussian packets (PRA 79 043416) evolve in fictitious time $s$; that is **not** lab time, and the instrument must not label a KS animation with a $t$-axis. The dossier's §20.1 lists "relation between fictitious and physical time" as still owed — this closes it with a number.

---

## 4 · Thread D — Q9 answered, and Proposition B3 half killed

### 4.1 Pauli's element, verified two ways (MEASURED to $4.4\times10^{-16}$)

**Route 1, $SU(2)\times SU(2)$ recoupling.** $K_z=J^{(1)}_z-J^{(2)}_z$ in the coupled basis $|nlm\rangle=\sum\langle jm_1\,jm_2|lm\rangle|jm_1\rangle|jm_2\rangle$, $j=\tfrac{n-1}{2}$. Against the closed form $\sqrt{(n^2-(l+1)^2)((l+1)^2-m^2)/((2l+1)(2l+3))}$: worst discrepancy over **all** $n\le6$, all $l$, all $m$ is $4.441\times10^{-16}$ (bf-r2-so4 M1). **The two numbers Q9 asks for:**
$$\boxed{\;\langle2p_0|K_z|2s\rangle=1.000000000000,\qquad \langle3d_0|K_z|3p_0\rangle=\tfrac{2}{\sqrt3}=1.154700538379\;}$$
(Round 1 wrote "$\sqrt{5/3}\cdot\sqrt{4/5}\cdot\ldots$ — give the number"; the number is $2/\sqrt3$, from $\sqrt{(9-4)(4-0)/(3\cdot5)}=\sqrt{20/15}$.)

**Route 2, position space, fixing the Condon–Shortley phase.** Building the $n=2$ parabolic (Stark) states in parabolic coordinates directly (bf-r2-so4 M2):
$$|1,0,0\rangle=\tfrac{1}{\sqrt2}(|2s\rangle-|2p_0\rangle),\ \langle z\rangle=+3.00000000;\qquad |0,1,0\rangle=\tfrac1{\sqrt2}(|2s\rangle+|2p_0\rangle),\ \langle z\rangle=-3.00000000$$
in atomic units, exactly the Pauli–Epstein $\langle z\rangle=\tfrac32n(n_1-n_2)=\mp3$. In the **real** Condon–Shortley basis $\{|2s\rangle,|2p_0\rangle\}$ therefore
$$K_z\big|_{n=2}=\begin{pmatrix}0&1\\1&0\end{pmatrix}=\sigma_x ,\qquad K_z\ \text{on}\ (2s,2p_{-1},2p_0,2p_{+1})=\begin{pmatrix}0&0&1&0\\0&0&0&0\\1&0&0&0\\0&0&0&0\end{pmatrix},$$
whose eigenvectors are the Stark states with eigenvalues $\pm1$. Hence
$$e^{-i\theta K_z}=\begin{pmatrix}\cos\theta&0&-i\sin\theta&0\\0&1&0&0\\-i\sin\theta&0&\cos\theta&0\\0&0&0&1\end{pmatrix}.$$
Q9 is closed.

### 4.2 B3's *picture* is REFUTED: $\langle z\rangle\equiv0$ along the rotor flow (MEASURED)

Round 1: *"$e^{-i\theta K_z}$ rotates $2s$ into $2p_z$ continuously inside the shell, **through the parabolic (Stark) states at $\theta=\pi/4$** … the orbital changes shape at fixed energy."*

**REFUTED.** $e^{-i\theta K_z}|2s\rangle=\cos\theta\,|2s\rangle-i\sin\theta\,|2p_0\rangle$. At $\theta=\pi/4$ the state is $(|2s\rangle-i|2p_0\rangle)/\sqrt2$, whose density is the **incoherent** average $\tfrac12(|2s|^2+|2p_0|^2)$: no dipole. MEASURED (bf-r2-so4 M3): $\langle z\rangle(\theta)=0$ to $10^{-16}$ at $\theta=0,\tfrac\pi8,\tfrac\pi4,\tfrac\pi3,\tfrac\pi2$ — **identically zero along the whole flow**, while the Stark states have $\langle z\rangle=\mp3$. The claim also fails a one-line consistency check: $\langle K_z\rangle$ is conserved by its own flow, and $\langle2s|K_z|2s\rangle=0$ while the Stark states have $\langle K_z\rangle=\pm1$.

### 4.3 Theorem 4 — the SO(4) orbit theorem, and why the Stark states are unreachable

**Theorem 4 (orbit classification of a shell; DERIVED-HERE, MEASURED to $1.4\times10^{-16}$).** *Write a shell state as the $n\times n$ Clebsch–Gordan matrix $C_{m_1m_2}$. Then $SU(2)\times SU(2)$ acts by $C\mapsto g_1Cg_2^{\mathsf T}$, so the **singular values of $C$ are a complete set of $SO(4)$ orbit invariants**. Consequently the orbits of a shell are the "entanglement classes" of a bipartite $j\otimes j$ state.*

MEASURED (bf-r2-so4 M4): singular values are invariant under random $g_1,g_2$ to $1.39\times10^{-16}$; and

| state | singular values | rank | orbit |
|---|---|---|---|
| $2s$, $2p_0$ | $(\tfrac1{\sqrt2},\tfrac1{\sqrt2})$ | 2 | maximally entangled; stabiliser $=$ diagonal $SU(2)$; orbit $=SO(3)$, **dim 3** |
| $2p_{\pm1}$, Stark $|n_1n_2m\rangle$ | $(1,0)$ | 1 | product; orbit $=\mathbb{CP}^1\times\mathbb{CP}^1=S^2\times S^2=\mathrm{Gr}^+(2,4)$, **dim 4** |
| $3s$ | $(\tfrac1{\sqrt3},\tfrac1{\sqrt3},\tfrac1{\sqrt3})$ | 3 | |
| $3d_0$ | $(0.816497,0.408248,0.408248)$ | 3 | |
| $4p_{+1}$ | $(0.632456,0.547723,0.547723,0)$ | 3 | |

**Corollary. $3\ne4$, so no element of $SO(4)$ carries $2s$ to a Stark state.** Rank is an orbit invariant; $2s$ has rank 2, every parabolic state has rank 1. The parabolic states are precisely the **product** (unentangled) states $|jm_1\rangle\otimes|jm_2\rangle$ — a fact worth stating on its own: *the Stark basis is the Schmidt-rank-one basis of the shell, and $\mathrm{Gr}^+(2,4)$, the manifold of Kepler ellipses, is its orbit.*

So Proposition B3 splits:
- **STANDS:** $2s$ and $2p_z$ have identical singular values, lie on one $3$-dimensional orbit, and $e^{-i\theta K_z}$ carries one to the other at $\theta=\pi/2$ (up to phase). The rotor is real, exact, and cheap. Round 1's headline is right.
- **REFUTED:** the path does not pass through the Stark states — it cannot, for a reason of principle (Theorem 4), not merely of convention.
- **DERIVED-HERE:** the "real" rotation $2s\to\tfrac1{\sqrt2}(2s-2p_0)\to-2p_0$, generated by $\sigma_y$ on that plane, is **not** in the real span of the six $SO(4)$ generators on the shell — it leaves the orbit. (bf-r2-so4 M5 reports the least-squares residual $=\|{\rm target}\|_F=1.414214$, i.e. the best fit is zero. That probe's $K_x,K_y$ matrices failed a Hermiticity check, so I do not rest the claim on it; the orbit-dimension argument of Theorem 4 is a proof and does not use them.)

**For the instrument.** The visible "$2s$ morphs into $2p_z$" animation the dossier wants under STATE ROTATE (§17.4, §2.4) is the $K_z$ flow — but its *densities* are the boring convex combination. If the intended picture is the one that grows a dipole, the correct control is **not** a unitary at all; it is the Stark eigenbasis rotation, which changes the orbit and therefore is a change of state family, not of state. The dossier's own law "the user must always be able to tell whether they changed the state, the representation, or the observer" (§7.4) here needs a fourth category.

---

## 5 · Thread C — Q11 answered by a theorem, not a search

### 5.1 The unimodular-root theorem (DERIVED-HERE; MEASURED to $4\times10^{-18}$)

**Theorem 5.** *Let $\psi=\sum_{m=-M}^{M}g_m(r,\theta,t)\,e^{im\phi}$ with one angular–radial profile per $m$ (the case of any hydrogenic superposition with distinct $m$'s). Put $w=e^{i\phi}$ and*
$$P(w;r,\theta,t)\;=\;w^{M}\psi\;=\;\sum_{q=0}^{2M}g_{q-M}(r,\theta,t)\,w^{q}.$$
*Then:*
1. *the nodal set of $\psi$ is exactly the locus where $P$ has a root on $|w|=1$;*
2. *at most $2M$ vortex lines pierce any coaxial circle $\{r,\theta\ \mathrm{const}\}$, and the number is the number of unimodular roots;*
3. *a reconnection is a **double** unimodular root: $\mathrm{disc}(P)=0$ together with $|w_{\rm double}|=1$;*
4. *all $2M$ roots are unimodular only on the **self-inversive** locus $w^{2M}\overline{P(1/\bar w)}=\lambda P(w)$, $|\lambda|=1$ (Schur–Cohn); for $M=1$ this is $|g_{-1}|=|g_{+1}|$.*

MEASURED (bf-r2-vortex V1) for the Q11 state: the forced-unimodular roots give $|\psi|\le3.98\times10^{-18}$ at five $(t,\theta)$; the winding of $\arg\psi$ around a nodal point is $-1.0000$ turns (Round 1's C1 probe).

This converts the whole vortex thread from a search into polynomial algebra. It also **subsumes Theorem C1**: for two modes, $M=|\Delta m|/2$ and the "modulus condition + argument condition" of C1 is the statement that a degree-$|\Delta m|$ binomial $a\,e^{-iE_1t}w^{\Delta m}+b\,e^{-iE_2t}$ has a unimodular root — hence $|\Delta m|$ of them, equally spaced, rotating rigidly. C1 **STANDS**, as a corollary.

### 5.2 Q11, exactly: reconnections are symmetry-protected, and there are exactly two per beat

For $\psi=(2p_++3p_0+3d_-)/\sqrt3$ the two $n=3$ modes are **degenerate**, so only one phase moves. With $\tau=(E_3-E_2)t=5t/72$ and the Condon–Shortley $Y$'s,
$$e^{i\phi}\psi\;\propto\;P(w)=f_1e^{i\tau}w^{2}+f_2w+f_3,\qquad f_1,f_2,f_3\in\mathbb R .$$

**Theorem 6 (DERIVED-HERE; MEASURED exactly).** *Because $f_1,f_2,f_3$ are real, $\psi(r,\theta,-\phi,-t)=\overline{\psi(r,\theta,\phi,t)}$ — an antiunitary $PT$ symmetry with $P$ = reflection in the $xz$-plane. (MEASURED: $|\psi(-\phi,-t)-\overline{\psi(\phi,t)}|=0.00\times10^{0}$ exactly at three test points, bf-r2-recon R2.) A double root needs $\mathrm{disc}=f_2^2-4f_1f_3e^{i\tau}=0$ with $f_i$ real, which forces $e^{i\tau}=\pm1$. Hence*
$$\boxed{\;\text{reconnections occur only at }\tau\equiv0,\pi,\ \text{i.e. }t\equiv0,\ \tfrac{T_{\rm beat}}{2}\pmod{T_{\rm beat}},\quad T_{\rm beat}=\frac{2\pi}{E_3-E_2}=90.477868\ \text{a.u.}\;}$$
*and they are **symmetry-protected**, occurring at the fixed times of the antiunitary symmetry and on its fixed plane $\phi\in\{0,\pi\}$ — not at generic instants.*

**The answer Q11 asks for — a time and a position.**

| | $\tau$ | $t$ (a.u.) | $(r,\theta,\phi)$ | Cartesian $(x,y,z)$ | $\lvert\psi\rvert$ at the double root |
|---|---|---|---|---|---|
| first | $0$ | $\mathbf{0}$ | $(4.708644,\,2.946430,\,\pi)$ | $(-0.91313,\,0,\,-4.61926)$ | $1.86\times10^{-13}$ |
| second | $\pi$ | $\mathbf{45.238934}$ | $(4.708644,\,0.195162,\,\pi)$ | $(-0.91313,\,0,\,+4.61926)$ | $4.65\times10^{-14}$ |

(with $|\mathrm{disc}|\le2.6\times10^{-15}$ and $|w_{\rm double}|=1.0000000000$; bf-r2-vortex V2.) $\theta^*_{\rm first}+\theta^*_{\rm second}=\pi$ exactly: the two events per beat are $z$-mirror images, as the symmetry demands. **The state as Round 1 poses it is already sitting at a reconnection at $t=0$** — a fact Round 1's question ("the *first* instant at which two vortex lines reconnect") does not anticipate.

MEASURED (bf-r2-vortex2 W1): crossing $\tau=\pi$, the nodal count on the radial slice $r=r^*+0.02$ jumps $1\to3$ — a change of 2, a reconnection, not a translation.

### 5.3 The local normal form, corrected (and my own earlier probe refuted)

Put $\phi=\pi+\xi$, $\tau=\pi+s$, and near the event define the two spatial functions
$$A:=f_1+f_2-f_3,\qquad B:=f_1+f_3,\qquad f_0:=f_1(r^*,\theta^*)=-3.530499\times10^{-3},$$
both of which vanish at the event (MEASURED $A/f_1=-1.54\times10^{-6}$, $B/f_1=-1.02\times10^{-7}$). Expanding the real and imaginary parts of $e^{-i\phi}P(e^{i\phi})=0$,
$$G_1=A-\tfrac{f_0}{2}\big[(\xi+s)^2+\xi^2\big]+\dots,\qquad G_2=\xi B+f_0s+\dots$$
so the nodal set near the event is
$$\boxed{\;\xi\,B=-f_0\,s,\qquad A=f_0\,\xi^{2}\;}$$
— **the hyperbolic exchange $xy=t$** in the $(\xi,B)$ plane, fibred over a parabola in $A$; the two branches $\xi=\pm\sqrt{A/f_0}$ meet where $A=0$ and swap partners as $s$ changes sign. This is the hyperbolic reconnection of Bialynicki-Birula, Białynicka-Birula & Śliwa (PRA **61** 032110, 2000) — KNOWN as a phenomenon, DERIVED-HERE in the lab's coordinates.

MEASURED (bf-r2-recon R3): the Jacobian $\partial(G_1,G_2)/\partial(r,\theta)$ vanishes at the event (that *is* the degeneracy), so the well-posed slice fixes $(r,\theta)$ and solves for $(\xi,s)$:

| $\varepsilon$ | $\xi$ exact / $\sqrt{A/f_0}$ | $s$ exact / $(-\xi B/f_0)$ |
|---|---|---|
| $-2.0\times10^{-2}$ | 0.9792 | 0.9455 |
| $-5.0\times10^{-3}$ | 0.9946 | 0.9858 |
| $-1.25\times10^{-3}$ | 0.9986 | 0.9964 |
| $-6.25\times10^{-4}$ | **0.9993** | **0.9982** |

Both ratios $\to1$ at rate $O(\varepsilon)$. **Self-correction:** bf-r2-vortex2 W2 asserted the normal form $(\mathrm{Im}\,l)^2=4h^2(h^2-\mathrm{Re}\,l)$; its own residual column ran $-45.7,-48.1,-54.7,-67.2,-97.8$ in units of $h^4$ — *growing*, not converging — because $(\mathrm{Im}\,l)^2\sim\varepsilon^2$ while $4h^2\mathrm{Re}\,l\sim\varepsilon^3$ are different orders. That claim is REFUTED by its own numbers and replaced above.

### 5.4 Q11's last clause — the vortex census, and a compactness theorem

**Theorem 7 (the vortex core; DERIVED-HERE, MEASURED).** *For a finite hydrogenic superposition whose largest principal quantum number occurs for a single $m$, the vortex lines lie in a compact set.* Reason: $R_{nl}\sim e^{-r/n}$, so at large $r$ one coefficient of $P$ dominates and $P$ has no unimodular root. For the Q11 state, $f_1\sim e^{-r/2}$ dies against $f_2,f_3\sim e^{-r/3}$, $P\to f_2w+f_3$, and a line pierces the sphere of radius $r$ iff $\max_\theta|f_3/f_2|\ge1$. MEASURED (bf-r2-recon R4), bisected to $10^{-6}$:
$$\boxed{\;r_{\rm core}=20.475395\ \text{a.u.}\;}$$
with $\max_\theta|f_3/f_2|=1.17828,\,1.00995,\,0.99950,\,0.88371$ at $r=15,20,20.5,30$.

**Is the number of vortex lines through a large sphere conserved between reconnections?** MEASURED (bf-r2-vortex2 W3), count of nodal points on spheres versus $\tau$:

| $\tau/\pi$ | $r{=}2$ | 4 | 6 | 8 | 12 | 16 | 20 | 25 | 30 |
|---|---|---|---|---|---|---|---|---|---|
| 0.000 | 2 | 2 | 4 | 6 | 4 | 4 | 4 | 4 | 4 |
| 0.333 | 2 | 2 | 4 | 6 | 6 | 4 | 4 | 2 | 2 |
| 0.500 | 2 | 2 | 4 | 6 | 6 | 6 | 2 | 2 | 2 |
| 1.000 | 2 | 2 | 4 | 6 | 4 | 4 | 4 | 4 | 4 |

**Answer: no, and Round 1's framing of the question is wrong twice.** (i) Beyond $r_{\rm core}=20.475$ there are *no* lines, so the signed count through a large sphere is $0$ and its conservation is vacuous. (ii) The count on a *finite* sphere changes when a line becomes tangent to the sphere, which is a different event from a reconnection — the $r=25$ and $r=30$ columns change between $\tau/\pi=0$ and $0.333$ with no reconnection in between. The invariant that *is* conserved is the signed count (each line carries winding $\pm1$), which is $0$ through any closed surface not meeting the nodal set, for the elementary reason that $\arg\psi$ is single-valued off the nodal set. The rows at $r=2,4,6,8$ are constant in $\tau$ throughout, and those are the honest "conserved" numbers: $2,2,4,6$.

### 5.5 Q4 of the ledger, and C2 sharpened

**Q4 (is $\mathbf j$ finite on the axis?).** Near $\theta\to0$, $j_\phi=\mathrm{Im}(\psi^*\partial_\phi\psi)/(r\sin\theta)\sim\sum_{m\ne m'}\tfrac{m-m'}{2}(\cdots)\sin^{|m|+|m'|-1}\theta$: **finite for every pair, and nonzero in the limit exactly when $\{|m|,|m'|\}=\{0,1\}$.** MEASURED (bf-r2-vortex V5): for the Q11 state $j_\phi\to-7.1886\times10^{-5}$ as $\theta\to0$ (a nonzero limit); for $2p_++3d_+$ (both $m=+1$) $j_\phi/\sin\theta\to0.001107$, i.e. $j_\phi\to0$ linearly.

**C2 sharpened (DERIVED-HERE).** The "still frames" are exactly the instants at which the whole state is real up to a global phase, i.e. the fixed times of an antiunitary symmetry — the same mechanism as Theorem 6. That is why $\mathbf j\equiv0$ there and why the nodal set jumps from a curve to a sheet: at a $T$-fixed instant $\psi$ real forces $\mathrm{Im}(\psi^*\nabla\psi)=0$ identically and the zero set of a *real* function is generically a surface. Round 1 proves the $\Delta m=0$ case; the statement is general.

**The f16 gate (DERIVED-HERE, MEASURED; a hard consequence for the instrument).** $\mathbf j=\mathrm{Im}(\psi^*\nabla\psi)$ is a cancelling difference. At half precision ($\epsilon=2^{-11}=4.883\times10^{-4}$) the absolute error of each product is $\sim\epsilon|\psi||\nabla\psi|$, so the relative error of $\mathbf j$ exceeds $10^{-3}$ wherever
$$|\mathbf j|<\frac{2\epsilon|\psi||\nabla\psi|}{10^{-3}}=0.977\,|\psi|\,|\nabla\psi| ,$$
i.e. wherever $\sin(\angle(\psi,\nabla\psi))<0.977$ — **almost everywhere**, and in particular on every still-frame surface, where $\mathbf j$ vanishes identically. A `f16` FLOW view has unbounded relative error on a set that C2 says is visited twice per beat.

---

## 6 · Loose ends of the ledger (Q5, Q6) — two more corrections

**Q5(i), the torus knot's winding — the ledger drops a gcd.** $E_1/E_2=n_2^2/n_1^2$, so **in lowest terms** the winding is $(n_2^2,n_1^2)/\gcd(n_1,n_2)^2$. MEASURED (bf-r2-fock Q5): $2s+4s$ is $\mathbf{4{:}1}$, not $16{:}4$; $3s+6s$ is $\mathbf{4{:}1}$, not $36{:}9$; $4s+6s$ is $\mathbf{9{:}4}$, not $36{:}16$; $2s+6s$ is $\mathbf{9{:}1}$, not $36{:}4$. A $(16,4)$ torus knot does not exist; $(4,1)$ is an unknot. Four of seven listed pairs are wrong.

**Q5(ii), the "caustic $J=|u|^2-|v|^2=0$" — REFUTED.** Under a diagonal $H$ the moduli $|c_a|$ are constants of the motion, so $J(t)\equiv|c_1|^2-|c_2|^2$ is constant along the orbit. MEASURED: at equal weights $J=0$ on the **whole** orbit (spread $2.2\times10^{-16}$ over $t\in[0,400]$), and at $|c_1|^2=0.7$, $J\equiv0.4$ so $\{J=0\}$ is **empty**. $\{J=0\}$ is never the envelope of anything. The true envelope of the projection is the **rectangle** $|q_1|\le\sqrt2|c_1|$, $|q_2|\le\sqrt2|c_2|$, folded where $\sin(E_at)=0$; MEASURED $\max|q_1|=\max|q_2|=1.0000000000$ for the equal-weight $1s+2s$, and the orbit closes at $T=2\pi/|E_2|=50.265482$ a.u. with $|q(T)-q(0)|=0$ exactly.

*A convention flag, from the corpus.* This last number only comes out right with $q=\sqrt2\,\mathrm{Re}\,c$, i.e. the brief's $q+ip=\sqrt2\,c$. The dossier's §5.1 ("the key derivation", ~line 509) writes **$c=q+ip$** with no $\sqrt2$, and states $2H_C=c^\dagger Hc$ as its result. Under the lab's $\sqrt2$ convention that becomes $H_C=c^\dagger Hc$. **The two λWAVES documents disagree by a factor of $\sqrt2$ in the shadow map and by a factor of 2 in the shadow Hamiltonian.** The dossier's own §18.1 law — "an implementation must not be its own only oracle" — is exactly the law this violates.

**Q6, the launch loss — the number is brutal.** A Gaussian packet of width $w=2a_0$ at $r_0=8a_0$ with $p_0=0.3$ a.u. along $\hat\phi$ (bf-r2-fock Q6; Parseval over $l\le14$: $\int|G|^2=0.99991753$):
$$\sum_{n\le6}|\langle nlm|G\rangle|^2=\mathbf{0.2977}\quad(\text{loss }0.7023),\qquad \sum_{n\le15}=0.3278 .$$
The reason is stated by one number: $\langle T\rangle=0.2325$, $\langle V\rangle=-0.1250$, so
$$\langle H\rangle=+0.1075\ \text{a.u.}>0 .$$
**The packet is not bound.** No enlargement of the register fixes it; $70\,\%$ of the norm is in the continuum by construction. The largest single bound contributions are $|3\,2\,{+}2\rangle$ at $0.0621$, $|2\,1\,{+}1\rangle$ at $0.0345$, $|2\,0\,0\rangle$ at $0.0290$. Any "launch a packet" control must first report $\langle H\rangle$, or it is drawing $30\,\%$ of a state and calling it the state.

---

## 7 · CORPUS SYNTHESIS — what Josh's own mathematics brings, and where it goes further

Four items, each cited by file and label, each pushed to a checkable statement with a number. Round 1 asked for the corpus's *theorems*, not its vocabulary; these are theorems.

### 7.1 The corpus evaluates Ω₁'s own governing quantity — and it comes out irrelevant

`OBSIDIAN/FINITE FIELD SPECTRAL DYNAMICS FRONTIER HANDOFF 2026-08-23.md`, **§30 "Cubic Gaussian Period Polynomial"**: for $p\equiv1\pmod3$, with $4p=L^2+27M^2$ normalised by $L\equiv1\pmod3$, the order-3 Gauss periods are the roots of
$$F_{3,p}(x)=x^3+x^2-\tfrac{p-1}{3}x-\tfrac{(L+3)p-1}{27},\qquad \mathrm{disc}=p^2M^2,$$
and at $p=37$: $L=-11$, $M=1$, $F_{3,37}(x)=x^3+x^2-12x+11$. Also `OBSIDIAN/CM SEXTIC OUROBOROS AND BALANCE LADDER 2026-08-23.md`, **§14**: $L=\mathrm{Tr}(u\pi)$ for a unit $u$ and the Eisenstein Frobenius $\pi$, and **§13**: $J(\chi_3,\varphi)=7+4\omega=\zeta_6\bar\pi$ at $p=37$.

**Taken further (DERIVED-HERE + MEASURED, bf-r2-gauss G1).** The corpus's §26→§27 chain ($\mathbf1_{C_j}=\tfrac1N\sum_r\zeta_N^{-jr}\chi^r$, $\eta_j$ a DFT of Gauss sums) gives the exact evaluation the ladder needs:
$$\sum_{k\bmod p}e(k^3/p)=1+3\theta_0,\quad\theta_0=\text{the period over the cubic residues, a root of }F_{3,p}.$$
At $p=37$ the roots of $F_{3,37}$ are $\{-4.34471237,\,1.15761156,\,2.18710081\}$, so $1+3\theta_j\in\{-12.034137,\,4.472835,\,7.561302\}$ (summing to $0$), and the direct sum is $\;\sum_k e(k^3/37)=+4.472835\,$ — **an exact match to the middle root, to 6 decimals**. The corpus's polynomial evaluates the object Ω₁ invokes.

**And a correction to the corpus's own reading.** $L$ is *not* the cubic exponential sum. $\sum_ke(k^3/p)=2\,\mathrm{Re}\,G(\chi_3)$ is **Kummer's sum**, whose argument was open from Kummer 1846 until Heath-Brown–Patterson 1979 (equidistribution) — MEASURED: it fails to equal $L$ in **22 of 22** primes tested, $7\le p\le397$. What does equal $L$ is the **Jacobi** sum: $2\,\mathrm{Re}\,J(\chi_3,\chi_3)=L$ (Gauss 1801) — MEASURED: **0 failures in 22**, including $2\,\mathrm{Re}\,J=-11.000000$ at $p=37$. Two different objects with the same $|{\cdot}|=\sqrt p$; the corpus's §6 [FIREWALL] ("the exact unit and conjugation depend on normalisation; the invariant content is the norm") is exactly the right warning, and this is the place it bites.

**The number that ends Ω₁.** $|G(\chi_3)|=\sqrt p$, so a normalised cubic sum is $O(p^{-1/2})$, *pseudorandom in argument*. Ω₁ proposes a quantity that is (a) identically zero in 23 of 27 ladders, (b) equidistributed in phase where it is nonzero, and (c) decaying like $b^{-1/2}$ — to govern a smooth height that tends to $1$. §2.3–2.4.

### 7.2 The corpus's uncertainty theorem is the mechanism-killer

`LUX JSY LIBRARY/ALL DISK ⟡/GENERAL MATHEMATICS LIBRARY.md`, **L-0245** (§24, "Donoho–Stark/Hirschman equality states on $\mathbb Z/N$"; seat: proved $[N/C,\blacksquare]$, brute-forced over $350{,}000+$ pairs on $\mathbb Z/5,7,8,9,10,12$): $|T||\Omega|\ge N$, with **equality iff** $f=c\,e^{2\pi ibx/N}\mathbf 1_{H+a}$ for a subgroup $H$ — the Heisenberg–Weyl orbit of subgroup indicators.

**Taken further (§2.5).** This is precisely the statement that a Gaussian Rydberg packet cannot resolve residues mod $b$: its window is $W\approx8\sigma+1$ integers, so its $\mathbb Z/b$ spectrum occupies $\ge b/W$ classes, MEASURED $b/W=2.6,\,7.9,\,2280,\,3801$ for $(\bar n,\sigma)=(30,2),(45,2),(90,0.8),(150,0.8)$. And L-0245's **equality clause names the only packets that would**: modulated indicators of cosets of subgroups of $\mathbb Z/b$. **A checkable prediction (UNVERIFIED, with the test).** Replace the Gaussian $p_k$ by $p_k\propto\mathbf1[k\equiv k_0\bmod d]$ with $d\mid b$ over a window of $b/d$ terms; then and only then does $\sup|A|$ acquire a genuine dependence on the residues of $k^3\bmod b$. *Test:* at $\bar n=36$ ($b=27$), compare $p_k$ supported on $k\equiv0\pmod3$, $|k|\le13$, against a Gaussian of the same second moment; Ω₁-style arithmetic should appear in the first and not the second. This is the resurrection of Ω₁ in the only form it can survive: **as a statement about the packet, not about $\bar n$.**

### 7.3 Self-inversive polynomials: the corpus's reciprocal-polynomial rung is the vortex census

`GENERAL MATHEMATICS LIBRARY.md`, **L-0100** (§10, "Rotation-covariant Apostol log-derivative", proved $[N,\blacksquare]$): on $|a|=1$,
$$\frac{\Phi_n'(a)}{\Phi_n(a)}=\frac{\bar a}{2}\Big(\varphi(n)+i\,S_n(\theta)\Big),\qquad S_n(\theta)=\!\!\sum_{\gcd(k,n)=1}\!\!\cot\!\Big(\frac{\pi k}{n}-\frac\theta2\Big),$$
i.e. **$\mathrm{Re}\big[a\,\Phi_n'(a)/\Phi_n(a)\big]=\tfrac12\deg\Phi_n$ identically on the unit circle** — the signature of a self-inversive polynomial. And **L-0293/L-0294/L-0297** (§33/§35): the reciprocal ($\det=+1$) / anti-reciprocal ($\det=-1$) dichotomy, Salem numbers as the polynomials with all-but-two roots *on* $|z|=1$, and Smyth 1971.

**Taken further (DERIVED-HERE).** Theorem 5's $P(w)=\sum_{q=0}^{2M}g_{q-M}w^q$ is exactly such an object, and L-0100's identity is the counting tool:
$$\#\{\text{vortex piercings of the circle }(r,\theta)\}=\frac{1}{2\pi}\oint_{|w|=1}d\arg P \ \text{jumps},\qquad \mathrm{Re}\Big[\frac{wP'(w)}{P(w)}\Big]\equiv M \ \text{iff } P \text{ self-inversive}.$$
So the **self-inversive locus of the lab's vortex polynomial** — for $M=1$, the surface $|g_{-1}|=|g_{+1}|$, i.e. $|f_1|=|f_3|$ — is where *all* $2M$ roots can be unimodular, and it is the exact analogue of the corpus's Salem boundary. MEASURED (bf-r2-vortex V4): for the Q11 state, $|f_3/f_1|=4.7316$ at $r=12$, so the self-inversive locus is at small $r$ and both roots are unimodular only in a bounded shell — consistent with Theorem 7's $r_{\rm core}=20.475395$. **A checkable statement:** for a two-mode $\Delta m$ state, $P$ is a *binomial* $aw^{\Delta m}+b$, which is self-inversive iff $|a|=|b|$ — hence $|\Delta m|$ vortex lines exist exactly where $|aR_1\Theta_1|=|bR_2\Theta_2|$, recovering C1's modulus condition as the Schur–Cohn boundary. Round 1's C1 is the $\deg=|\Delta m|$ cyclotomic case of L-0100.

### 7.4 The conformal-inversion trilogy is the shared root of Fock and KS

`GENERAL MATHEMATICS LIBRARY.md`, **L-0267/L-0268/L-0269** (§30, proved/verified $[C/S,\blacksquare]$, 12/12, 8/8, 11/11): $\mathfrak{su}(4)\cong\mathfrak{so}(6)$ realised on $\Lambda^2\mathbb C^4$ with an explicit index-preserving isomorphism (the corpus's "6-D quaternion"); $\mathfrak{su}(2,2)\cong\mathfrak{so}(4,2)$ the 4-D conformal algebra with $15=6M_{\mu\nu}+4P_\mu+4K_\mu+1D$ and the **inversion** $I=\mathrm{diag}(1,1,1,1,1,-1)$, $x\mapsto x/x^2$, conjugating $P_\mu\leftrightarrow K_\mu$; $\mathfrak{sl}(4,\mathbb R)\cong\mathfrak{so}(3,3)$ with $\mathrm{Gr}(2,4)$ the Klein quadric. And `FINITE FIELD ... HANDOFF`, **§42** ("$\mathbb F_{q^2}$ emerges as a line spread in four dimensions", $[N,\blacksquare]$): the Desarguesian spread of $q^2+1$ pairwise disjoint lines partitioning $\mathbb P^3(\mathbb F_q)$ — **the finite Hopf fibration**; and **§36** ("the Sextic Hodge Wheel"): $*b_j=b_{j+3\bmod6}$ realises $\Lambda^2\mathbb R^4=\Lambda^+\oplus\Lambda^-$, i.e. $\mathfrak{so}(4)=\mathfrak{su}(2)\oplus\mathfrak{su}(2)$, as a $C_6$ half-turn.

**Taken further (DERIVED-HERE, with numbers).** The dossier's §7 law forbids collapsing SO(4), Fock and KS into "one 4-D atom". The corpus says why they *are* three faces of one construction and where the law is still right:
- $\mathrm{Gr}^+(2,4)$, the Klein quadric of L-0269, is exactly the rank-one orbit of Theorem 4 — **the parabolic (Stark) states are the real points of the Klein quadric**, dimension $4$, and the Kepler ellipses at fixed energy are its points. That is a corpus theorem meeting a hydrogen fact, and it is the reason $2s$ (rank 2, orbit dim 3) cannot reach them.
- The conformal inversion $x\mapsto x/x^2$ of L-0268 is the *same* map as Fock's stereographic projection ($p\mapsto\chi$ with $p=p_0\tan\tfrac\chi2$) and as the KS quadratic lift; §36's $\Lambda^\pm$ split is the $\tfrac12(\mathbf L\pm\mathbf K)$ split of B3. **What survives of the dossier's law is not "they are different constructions" but "they are the same construction at three different radii":** Fock's radius $p_0=1/n$, KS's frequency $\omega=p_0/2$, and the shell's spin $j=(n-1)/2$ — all functions of $n$ alone, and all *different for different shells*. §3.1's number is the price: a cross-shell superposition has no common sphere.
- §42's finite Hopf fibration is the $\mathbb F_q$ shadow of the $\Lambda=M_{23}-M_{14}$ fibre of §3.2, with $q^2+1$ fibres in place of $S^2$. **A checkable statement (UNVERIFIED, with the test):** the lab's $n^2$-dimensional shell should be reproducible over $\mathbb F_q$ as the $\Lambda$-invariants of the degree-$(2n-2)$ part of $\mathbb F_q[u_1..u_4]$ for $q\equiv1\pmod4$; the count should be $n^2$ for $q>2n$, and the first failure should occur at $q\le 2n$ where the Desarguesian spread degenerates. Test at $q=37$ (the corpus's balanced prime, §14 of CM SEXTIC: $37=6^2+1$) for $n\le6$: predicted counts $1,4,9,16,25,36$.

### 7.5 What the corpus does **not** have (stated so it is not asked for again)

Both scouted maths files were read in full. Neither contains: Airy functions, stationary phase, catastrophe/caustic normal forms, Hermite polynomials in the analytic sense, asymptotic series or optimal truncation, Poisson summation over $\mathbb Z$ (only the finite-group form, L-0238), quantum revivals, Rydberg packets, Runge–Lenz, $SO(4)$, Fock, Gegenbauer, KS, parabolic states, nodal sets, vortices, reconnection, or Morse theory. The corpus's cubic material is entirely *complete* character sums; it has **no Gaussian-weighted or incomplete character sum anywhere**, and no Weil bound for $\sum_x\psi(f(x))$ with $\deg f=3$. Anything in §§1–6 above that reads as corpus-derived is corpus-*seeded*, not corpus-contained, and I have marked the seams.

---

## 8 · QUESTIONS FOR ROUND 3

**Q12 (DEEPEN — the resurgence of the revival peak).** §1.4 shows $\alpha^*(\beta)$ is Gevrey-1 with beyond-all-orders floor $e^{-1/(54\beta^2)}$ and coefficients $3,54,4860,769824,\approx1.70\times10^{8}$ (ratios $18,90,158,221$). Locate the Borel singularity and give the **Stokes constant**: the number $S$ (and the power $a$) in
$$\alpha^*(\beta)=\mathcal S\big[\text{the series}\big](\beta)\;+\;S\,\beta^{a}\,e^{-1/(54\beta^{2})}\big(1+O(\beta^2)\big).$$
My prediction, to be beaten: the singularity is the Airy instanton $2\zeta=\tfrac43\lambda^3$, so $S$ is built from the Airy connection constant and $a=-1$ or $-2$. *Test:* optimal-truncation residuals at $\beta=0.05,0.08,0.10,0.12,0.15$ at dps 50, divided by $e^{-1/(54\beta^2)}$; the quotient must approach a constant times $\beta^a$.

**Q13 (BROADEN — the packet that *does* hear the arithmetic; Ω₁ resurrected).** L-0245's equality clause (§7.2) says the only functions saturating the $\mathbb Z/b$ uncertainty bound are modulated indicators of subgroup cosets. Take $\bar n=36$ (so $b=27$ at $\sigma=2$) and compare two packets of equal second moment: (a) the Gaussian, (b) $p_k\propto\mathbf1[k\equiv0\bmod3]$ on $|k|\le13$. Compute $\sup|A|$ for both, and the correlation of (b)'s value with $\sum_{k\equiv0(3)}e(ak^3/27)$ across $\bar n=27,36,45,54$. **Give the number that decides whether the arithmetic is a property of the ladder or of the packet.** I claim it is the packet: Ω₁ was a true statement about a state nobody prepares.

**Q14 (LOCATE — the fourth control the instrument needs).** Theorem 4: $2s$ (Schmidt rank 2, orbit $\dim3$) and the Stark states (rank 1, orbit $\dim4=\mathrm{Gr}^+(2,4)$) are on different $SO(4)$ orbits, so **no unitary shell rotation grows a dipole out of $2s$**. Identify the group that does. Candidate: the non-compact $e^{\theta K_z}$ (real exponent) inside $SL(2,\mathbb C)\times SL(2,\mathbb C)$, i.e. the complexification of B3's rotor. Give its $4\times4$ matrix on the $n=2$ shell, the norm growth $\|e^{\theta K_z}|2s\rangle\|=\cosh\theta$-or-not, the renormalised $\langle z\rangle(\theta)$, and say what physical operation (a static field? an imaginary-time step? a Wick rotation of the Stark Hamiltonian?) it corresponds to. This is the missing category in the dossier's §7.4 product law.

**Q15 (BROADEN — reconnections without a symmetry).** Theorem 6 shows the Q11 reconnections are *symmetry-protected* (antiunitary $PT$, fixed times $\tau=0,\pi$) and hence non-generic — Round 1's question found the one three-mode state where the answer is forced. Take a state with $m\in\{-2,\dots,2\}$ and **three distinct energies** (e.g. $3d_{+2}+4p_{+1}+2s+4p_{-1}+5d_{-2}$), so $P(w)$ is a quartic with two independent phases. Then $\mathrm{disc}(P)=0$ *and* $|w_{\rm double}|=1$ is codimension 2 on a 5-parameter set: reconnections are isolated points of spacetime at generic times. Give the first one — a $t$, an $(x,y,z)$, and the sign of the exchange — and verify the piercing bound $\le2M=4$.

**Q16 (DEEPEN — the lattice term in Ω₁′).** Conjecture Ω₁′ (§2.7) claims $\sup|A|=\mathfrak F(\beta_3,\mu)+O(e^{-2\pi^2\sigma^2})$. That error term is $7.1\times10^{-3}$ at $\sigma=0.5$, $3.6\times10^{-6}$ at $\sigma=0.8$, $5.6\times10^{-13}$ at $\sigma=1.2$ — a range of ten orders of magnitude across a factor of $2.4$ in $\sigma$. Test it: hold $(\beta_3,\mu)$ fixed to $10^{-8}$ while varying $\sigma$ over $[0.5,1.2]$ (possible because $\beta_3$ and $\mu$ fix only $\sigma^2\mu$ and $\mu$; the third freedom is the lattice spacing $1/\sigma$), and measure whether the residual tracks $e^{-2\pi^2\sigma^2}$. **If it does, Ω₁′ is proved in the only place it could fail; if it does not, Ω₁′ is dead and the revival needs a third parameter.**

**Q17 (LOCATE — the shell over a finite field).** §7.4: the corpus's Desarguesian spread (§42 of the finite-field handoff) is the finite Hopf fibration, and §3.2's $\Lambda=M_{23}-M_{14}$ is its characteristic-zero fibre. Build the $\mathbb F_q$ shell: the $\Lambda$-invariants of the degree-$(2n-2)$ part of $\mathbb F_q[u_1,u_2,u_3,u_4]$. **Predicted dimensions $1,4,9,16,25,36$ for $n\le6$ whenever $q>2n$ and $q\equiv1\pmod4$; and a first failure at some $q\le2n$.** Do it at the corpus's balanced prime $q=37$ ($=6^2+1$, `CM SEXTIC` Theorem 2.1) and at $q=5,7,11,13$; report the smallest $q$ at which the count breaks and what it becomes.

---

## NOT CERTIFIED

- **No GPU ran. Nothing in `lab/` or `tests/` was touched or executed.** Every number above is from the probes named, in float64 except where mpmath (dps 40) or sympy is stated.
- **Theorem 1** (uniqueness of the global maximiser) is rigorous, but it uses the standard fact that $|\mathrm{Ai}(a_j')|$ decreases in $j$ (from the $x^{-1/4}$ envelope of the oscillatory asymptotic); I did not reprove it. The $\varphi(\lambda)$ monotonicity and the bound $0.535657>0.419015$ are exact.
- **The $\beta^9$ coefficient of $\alpha^*$ is not certified.** Two symbolic routes disagreed ($+3.79\times10^7$ from a Hermite series truncated too early; $-1.31\times10^7$ from an Airy series with too few $1/\lambda$ terms) and the numerically extracted value is $\approx-1.6956\times10^{8}$. The coefficients through $\beta^7$ ($-3,54,-4860,769824$) agree between both routes *and* Richardson extraction and are certified; $\beta^9$ is MEASURED only.
- **Theorem 2's hierarchy** assumes $\tfrac{2\bar n}{3}\in\mathbb Z$ (so the linear phase at $T_{\rm rev}$ is a multiple of $2\pi$) and drops $O(xk^4/\bar n^3)$; the $x$-dependent quartic was not carried. Conjecture Ω₁′ is **UNVERIFIED** beyond the two tables in §2.7 and the test in Q16.
- **The Ω₁ correlation study is a single window** ($\sigma=2$, $\bar n=26\ldots52$, 27 ladders) plus the fixed-$\beta_3$ set of 8. A wider window could in principle surface an arithmetic feature; the six features tested all gave $|r|\le0.309$, which is the number, not a proof.
- **§4.3's claim that $\sigma_y$ is outside $\mathfrak{so}(4)$** rests on the orbit-dimension argument (a proof); the probe's direct least-squares fit is *not* cited as evidence because that probe's $K_x,K_y$ failed a Hermiticity check — a bug I have flagged rather than fixed.
- **§3.2 corrects my own bf-r2-so4 M6** and **§5.3 corrects my own bf-r2-vortex2 W2**. Both original claims were wrong and are marked REFUTED-by-their-own-output. The replacements are verified in bf-r2-recon (R1 symbolically to $0$; R3 with both normal-form ratios $\to1$ at rate $O(\varepsilon)$, reaching $0.9993$ and $0.9982$).
- **Theorem 7's compactness** is proved for the case where the slowest-decaying $R_{nl}$ belongs to a single $m$; the general statement (ties in $n$ across several $m$) is UNVERIFIED. $r_{\rm core}=20.475395$ is for the Q11 state only.
- **Q11's reconnection positions** are quoted from a root-solve with $|\psi|\le1.9\times10^{-13}$ and $|\mathrm{disc}|\le2.6\times10^{-15}$; $r^*$ and $\theta^*$ are good to about $10^{-6}$, not to the digits printed.
- **The corpus items are cited from two full reads** of `FINITE FIELD SPECTRAL DYNAMICS FRONTIER HANDOFF 2026-08-23.md`, `CM SEXTIC OUROBOROS AND BALANCE LADDER 2026-08-23.md`, `GENERAL MATHEMATICS LIBRARY.md` and `LAMBDAWAVES STUDY RESEARCH DOSSIER 2026-09-02.md`. I did not read `MATH-DISK-07`, `YMD-DISK-01/02/03`, the `MILENNIUM MELTDOWN` continuation, the `SoSY-JSY` handoff, or the `MASTER GOAL SPEC`. The $\sqrt2$ convention conflict in §6 is between the brief and the dossier; the MASTER GOAL SPEC may settle it and was not read.
- **§7.4's finite-field prediction** ($1,4,9,16,25,36$ over $\mathbb F_q$) is UNVERIFIED — it is Q17.
- **Literature seats.** Fock 1935 (the $S^3$ map), Pauli 1926 / Bargmann 1936 (the $SO(4)$ matrix elements), Kustaanheimo–Stiefel 1965, Averbukh–Perelman 1989 and Bluhm–Kostelecký 1994 (revival/super-revival hierarchy — the $\beta_j$ tower of Theorem 2 is the same expansion, and I claim only the scaled form and the $\beta_4$ validity bound as DERIVED-HERE), Bialynicki-Birula *et al.* PRA 61 032110 (2000) (vortex reconnection), Gauss 1801 ($2\mathrm{Re}\,J=L$), Kummer 1846 / Heath-Brown–Patterson 1979 (the cubic Gauss sum's argument), Donoho–Stark 1989 / Hirschman 1957 / Maassen–Uffink 1988 / Özaydın–Przebinda 2004 (the uncertainty pair, via L-0245), Fabčič–Main–Wunner PRA 79 043416 (2009). Where a result below is KNOWN I have said so; the Airy closed form of §1.1 is standard for the Airy–Gaussian integral and I claim only its application and the exact maximiser law.

`Final output: /home/joshua-hosain/Documents/LAMBDAWAVES/research/adversarial-2026-09-02/02-opus.md`
