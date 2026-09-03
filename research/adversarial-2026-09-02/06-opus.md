# BEYOND THE FRONTIER · λWAVES — Round 6 · OPUS (rival)

**Opus 5, rival lab, for Josh — 2026-09-03.** Against `PRINT-BEYOND-THE-FRONTIER-LAMBDAWAVES-2026-09-03.md`, `05-fable.md`, `research/SYNTHESIS-APP-2026-09-03.md`, `lab/frontier.js`, `tests/frontier.test.mjs`. Seats as in the print: KNOWN (author/theorem) · KNOWN-in-corpus (file, §) · DERIVED-HERE · MEASURED · UNVERIFIED (why) · REFUTED (by what number).

*Round 5 was the round that made the print. This one is the round that reads the print back out of the instrument. The lead conceded my census of ten, my $c=7/9$, my composition lemma and my generic reconnection, and killed my $\epsilon\in\{0,1\}$, my "absolute $\kappa$" and my attribution — all of it correctly, all of it by number. So I open where a rival is most use: the code is now the paper, and I attack it as one.*

**Evidence.** `research/probes/bf-r6-audit1.mjs`, `bf-r6-audit2.mjs`, `bf-r6-audit3.mjs` (node 22, importing `lab/frontier.js` and `lab/hydrogen.js` directly — the instrument's own arithmetic, never a re-implementation), `bf-r6-airy-ref.py` (mpmath dps 40), `bf-r6-stokes.py` (the dictionary derivation of $b_1'$ and $b_2$), `bf-r6-kappa.py` (the gain law at $T=129$, FFT over every reduced $a/b$ with $b\le300$), `bf-r6-pearcey.py` (the quartic), `bf-r6-sixj.py` (the fold constant), `bf-r6-f2.py` (the $\mathbb F_2$ Jordan structure), `bf-r6-gates.py` (the $n=3$ gate count). Nothing under `lab/` or `tests/` was touched; no server, no GPU, no git.

---

## §0 · Audit of the instrument (the code as a paper)

`lab/frontier.js` is now a claim: 450 lines in which every function asserts a theorem of the print. I read it as a paper. Thirteen assertions; **five are DEAD, one of them badly** — there is a legitimate state on which `stretchedCensus` prints **zero reconnection points where there are eight** — five STAND on the numbers, three are ALIVE-AS-A-GATE.

### 0.1 `airyAi` — the claimed $10^{-8}$ is **DEAD**, and no switch point can achieve it

> *"Ai(x), real x: power series on [-6, 6], asymptotic expansions beyond (**both sides better than 1e-8**)"* — `frontier.js` l. 58.

Against mpmath at 40 digits (`bf-r6-airy-ref.py`):

| $x$ | branch | relative error |
|---|---|---|
| $-6$ | series | $1.9\times10^{-13}$ |
| $3$ | series | $1.0\times10^{-13}$ |
| $5$ | series | $6.0\times10^{-10}$ |
| $5.5$ | series | $6.9\times10^{-9}$ |
| $5.9$ | series | $2.7\times10^{-8}$ |
| $5.9999$ | series | $\mathbf{1.06\times10^{-7}}$ |
| $6$ | series | $5.7\times10^{-8}$ |
| $6.0001$ | asymptotic | $1.4\times10^{-10}$ |
| $10$ | asymptotic | $1.1\times10^{-15}$ |

The function is **discontinuous at the switch**: $\mathrm{Ai}(6^-)=9.947694479706\times10^{-6}$ against $\mathrm{Ai}(6^+)=9.947694361629\times10^{-6}$, a relative jump of $1.19\times10^{-8}$ — larger than the accuracy claimed for either side. (Truth: $\mathrm{Ai}(6)=9.94769436025289\times10^{-6}$; the asymptotic branch is the accurate one.)

The cause is not truncation but **cancellation in the ascending series**: at $x=6$ the two halves are $\mathrm{Ai}(0)f=+1.886909\times10^{3}$ and $\mathrm{Ai}'(0)g=-1.886909\times10^{3}$ against a sum of $9.9477\times10^{-6}$ — a cancellation ratio $1.897\times10^{8}$, so $\varepsilon_{\rm mach}\times\text{canc}=4.2\times10^{-8}$, exactly the observed error. The ratio is $\tfrac12\mathrm{Bi}/\mathrm{Ai}\sim\tfrac12e^{2\zeta}$, $\zeta=\tfrac23x^{3/2}$ — it is the *same* $\mathrm{Bi}$-over-$\mathrm{Ai}$ that governs Theorem A.2's late terms, now doing damage in floating point.

**And the claim is unachievable at any switch point.** Series error $\approx\tfrac12\varepsilon_{\rm mach}e^{2\zeta}$, asymptotic error $\approx e^{-2\zeta}$ (the optimally truncated remainder); they cross at $e^{4\zeta}=2/\varepsilon_{\rm mach}$:
$$\zeta^*=\tfrac14\ln(2/\varepsilon_{\rm mach})=9.185,\qquad x^*=\big(\tfrac32\zeta^*\big)^{2/3}=5.746,\qquad\text{error}=e^{-2\zeta^*}=1.05\times10^{-8}.$$
The best a double-precision (ascending series | Poincaré asymptotic) pair can do on the positive axis is $1.05\times10^{-8}$, at $x^*=5.746$; the code's choice of $6$ costs a further factor $5.4$.

**Why no test caught it.** The eleven DLMF anchors are at $x=0,\pm1,\pm2,\pm3,\pm5,\pm10$: the largest series-branch anchor is $x=5$, where the error is $6.0\times10^{-10}$ — comfortably inside $10^{-8}$. There is no anchor in $[5.5,6]$, the only place the claim fails. *The anchor is weaker than it looks: it tests the branch, not the branch's worst point.*

Line a gate could assert: *`airyAi` is accurate to $1.1\times10^{-7}$ relative on $[-6,6]$ (worst at $x\to6^-$) and to $1.4\times10^{-10}$ beyond; a uniform $10^{-8}$ is impossible with this pair, the optimum being $1.05\times10^{-8}$ at $x^*=5.746$. Anchors: $\mathrm{Ai}(5.9999)=9.95017117874653\times10^{-6}$, $\mathrm{Ai}(6)=9.94769436025289\times10^{-6}$.*

**Impact.** `envelopeI` routes $z\le6$ through `airyAi`, so $|I|$ carries $10^{-7}$ relative error in the strip $z\in(5.7,6]$; in the LADDER those are aliases of small weight, so the drawn curve is not visibly wrong. **DEAD as a claim; harmless in present use.**

### 0.2 `envelopeI` — an unstated small-$\beta$ boundary; **ALIVE-AS-A-GATE**

$$I=\sqrt{2\pi}(3\beta)^{-1/3}\exp\Big(\underbrace{\tfrac{\alpha}{6\beta}+\tfrac1{108\beta^2}}_{E}\Big)\mathrm{Ai}(z),\qquad\mathrm{Ai}(z)\sim e^{-\zeta},\ \ \zeta=\tfrac23z^{3/2},$$
and at $\alpha=0$, $E$ and $\zeta$ are the **same number to eight digits**: measured $E=\zeta=9.259259\times10^{7}$ at $\beta=10^{-5}$, $1.028807\times10^{7}$ at $3\times10^{-5}$, $9.259259\times10^{3}$ at $10^{-3}$. The exponent is a difference of two $O(1/\beta^2)$ quantities, so
$$\frac{\delta|I|}{|I|}\approx\frac{\varepsilon_{\rm mach}}{108\beta^{2}}=\frac{2.06\times10^{-18}}{\beta^{2}}\qquad(=2.1\times10^{-8}\ \text{at}\ \beta=10^{-5}).$$
Locating a maximum costs the square root of that. Measured discrepancy between the exact optimally truncated series and `alphaStarNum`: $2.0\times10^{-5}$ at $\beta=10^{-5}$, $3.4\times10^{-5}$ at $3\times10^{-5}$, $1.4\times10^{-5}$ at $10^{-4}$, $4.7\times10^{-6}$ at $3\times10^{-4}$, $3.3\times10^{-7}$ at $10^{-3}$ — a **38 % relative error in $\alpha^*$ at $\beta=3\times10^{-5}$** ($-5.615\times10^{-5}$ against the true $-9.000\times10^{-5}$). And $\beta_3=8\pi\sigma^3/3\bar n=3\times10^{-5}$ is $\bar n\approx2.8\times10^{5}$, $\sigma=1$: a ladder the LADDER register admits, since it carries its own register over any $n$.

No test exercises $\beta<0.02$. Gate: *`envelopeI` is accurate to $2.06\times10^{-18}/\beta^2$ relative; `peakLaw`'s numerical maximiser is meaningless for $\beta\lesssim10^{-4}$ and the series must be used there.* (The cure is to form $\alpha/6\beta+(1/108\beta^2-\zeta)$ with $\zeta$ expanded in $\beta$, so the two large parts never appear separately. I report; I do not patch.)

### 0.3 `peakLaw`'s bracket **STANDS**; its `seriesUsable` flag is **DEAD**

*The bracket is right for every $\beta$, and provably so.* The maximiser solves $\mathrm{Ai}'(z)+\lambda\mathrm{Ai}(z)=0$, $\lambda=3^{1/3}/6\beta^{2/3}>0$. On $[-1.0188,\infty)$ the ratio $\mathrm{Ai}'/\mathrm{Ai}$ decreases strictly from $0$ (the first maximum of $\mathrm{Ai}$) to $-\infty$, so the root is unique and always in the **first** lobe; $[-3.2,z_{\max}]$ contains it for every $\beta>0$ and $|I|$ is unimodal there — the lower bracket can never be the wrong lobe, because the factor $e^{\alpha/6\beta}$ *decays* towards the lobes the bracket excludes. Checked: $\beta=3\Rightarrow\alpha^*=-1.897444$ (Round 3's $-1.89744$); $\beta=300\Rightarrow|I|_{\max}(3\beta)^{1/3}=1.3354$ against $\sqrt{2\pi}\max\mathrm{Ai}=1.3427$, $-0.5\%$ from the $e^{\alpha/6\beta}$ tilt. **STANDS.**

*The flag does not.* `seriesUsable: beta < 0.32` is a hard-coded constant, while the same function already computes the honest error `alphaStarError` (the first omitted term) and throws it away:

| $\beta$ | $\alpha^*$ series | $\alpha^*$ numerical | rel. | height series | height numerical | rel. | `alphaStarError` | flag |
|---|---|---|---|---|---|---|---|---|
| $0.050$ | $-0.14427391$ | $-0.14436914$ | $6.6\times10^{-4}$ | $0.99319088$ | $0.99320510$ | $1.4\times10^{-5}$ | $1.87\times10^{-4}$ | true |
| $0.070$ | $-0.19330637$ | $-0.19639188$ | $1.6\times10^{-2}$ | $0.98831338$ | $0.98763306$ | $6.9\times10^{-4}$ | $6.85\times10^{-3}$ | true |
| $0.100$ | $-0.29460000$ | $-0.26751402$ | $1.0\times10^{-1}$ | $0.98395000$ | $0.97767901$ | $6.4\times10^{-3}$ | $7.70\times10^{-2}$ | true |
| $0.200$ | $-0.16800000$ | $-0.45773717$ | $6.3\times10^{-1}$ | $0.88000000$ | $0.94040321$ | $6.4\times10^{-2}$ | $1.56$ | true |
| $0.319$ | $-0.95700000$ | $-0.62546891$ | $5.3\times10^{-1}$ | $\mathbf{0.69471700}$ | $\mathbf{0.89877776}$ | $\mathbf{2.3\times10^{-1}}$ | $1.75$ | **true** |

At $\beta_3=0.319$ the series height is $0.69472$ against a true $0.89878$ — **23 % wrong while flagged usable**, with $1.75$ sitting in the same object as the error estimate. The SYNTHESIS's sentence *"the peak law series is shown only where its optimal truncation is tighter than $10^{-3}$ ($\beta_3\lesssim0.3$)"* is arithmetically false: `alphaStarError` crosses $10^{-3}$ at $\beta=0.0555$, not $0.3$ — **a factor $5.8$**. The LADDER window escapes only because `ladder.js` l. 59 displays `heightNum`; its sub-label nonetheless announces a series that is not being used and would be wrong if it were.

Gate: *`seriesUsable` must be `alphaStarError < 1e-3`, i.e. $\beta_3<0.0555$; at $\beta_3=0.319$ the optimally truncated series gives $0.69472$ where the truth is $0.89878$.*

### 0.4 `poissonAiry` — normaliser and $J=24$ **STAND**; the stated neglected term is **DEAD**

*The normaliser is exactly right, and provably.* With $Z=\sum_se^{-s^2/2\sigma^2}=\sigma\sqrt{2\pi}\sum_je^{-2\pi^2\sigma^2j^2}$ (Poisson applied to the Gaussian itself) and numerator $\sum_sf(s)=\sigma\sqrt{2\pi}\sum_jI(\alpha_j,\beta)$, the $\sigma\sqrt{2\pi}$ cancels: $|A|=\big|\sum_jI(\alpha_j,\beta)\big|\big/\sum_je^{-2\pi^2\sigma^2j^2}$ is the **exact theta identity**, not an approximation — the same theta normalises both sides. Truncation: $J=24$ is safe whenever $2\pi\sigma J\gg1$, i.e. $\sigma\gg0.0066$; at $\sigma=2$ the $j=\pm1$ normaliser term is already $e^{-78.96}=5\times10^{-35}$, and both tails of the numerator decay (for $j\to+\infty$ through $e^{\alpha/6\beta}\to0$, for $j\to-\infty$ through $e^{\alpha/6\beta-\frac23(\alpha/c)^{3/2}}\to0$). **STANDS.**

*What is dropped is not what the docstring says.* At $t=T_{\rm rev}+xT_{\rm cl}$, $n=\bar n+\sigma u$:
$$\frac{t}{2n^2}=\text{const}-\Big(\frac{4\pi\bar n}3+2\pi x\Big)\sigma u+\underbrace{2\pi\sigma^2u^2}_{\equiv\,1\ \text{at integer }s}+\underbrace{\frac{3\pi x\sigma^2}{\bar n}u^2}_{\textbf{residual chirp }\gamma}-\beta_3u^3+\beta_4u^4-\cdots$$
The $2\pi s^2$ is unity at integer $s$ and may be dropped **before** Poisson summation; the $O(x)$ piece may not, and the code drops it too. Against the quartic,
$$\frac{\gamma}{\beta_4}=\frac{3\pi x\sigma^2/\bar n}{10\pi\sigma^4/3\bar n^2}=\frac{9x\bar n}{10\sigma^2}=67.5\quad\text{at }(\bar n,\sigma,x)=(600,2,0.5).$$
Measured (`bf-r6-audit2.mjs` §2), replacing $I(\alpha,\beta)$ by the **chirped** envelope $I(\alpha,\beta;\gamma)=\frac1{\sqrt{2\pi}}\int e^{-u^2/2+i\gamma u^2+i\alpha u+i\beta u^3}du$ (Simpson, $4\times10^5$ points, $|u|\le16$):

| $\bar n$ | $\sigma$ | $x$ | exact $|A|$ | Theorem A.4 | error | with chirp | error | $\gamma$ | $\beta_4$ |
|---|---|---|---|---|---|---|---|---|---|
| 600 | 2 | $0.25$ | $0.021985304$ | $0.021964531$ | $2.08\times10^{-5}$ | $0.021982613$ | $2.7\times10^{-6}$ | $1.6\times10^{-2}$ | $4.7\times10^{-4}$ |
| 600 | 2 | $0.5$ | $0.000123527$ | $0.000010144$ | $1.13\times10^{-4}$ | $0.000089127$ | $3.4\times10^{-5}$ | $3.1\times10^{-2}$ | $4.7\times10^{-4}$ |
| 600 | 2 | $1$ | $0.937765861$ | $0.938919997$ | $1.15\times10^{-3}$ | $0.937970467$ | $2.0\times10^{-4}$ | $6.3\times10^{-2}$ | $4.7\times10^{-4}$ |
| 600 | 4 | $1$ | $0.614871373$ | $0.621030811$ | $6.16\times10^{-3}$ | $0.616538925$ | $1.7\times10^{-3}$ | $2.5\times10^{-1}$ | $7.4\times10^{-3}$ |
| 150 | 2 | $1$ | $0.738703613$ | $0.746326567$ | $7.62\times10^{-3}$ | $0.741141599$ | $2.4\times10^{-3}$ | $2.5\times10^{-1}$ | $7.4\times10^{-3}$ |
| 300 | 3 | $1$ | $0.657927739$ | $0.639774683$ | $1.82\times10^{-2}$ | $0.654548166$ | $3.4\times10^{-3}$ | $2.8\times10^{-1}$ | $9.4\times10^{-3}$ |

Restoring $\gamma$ cuts the error by $3.1\times$ to $5.6\times$ at $x=1$; what is left is $O(\beta_4)$, as advertised. At $x=0$ the chirp vanishes identically, which is why the tests — anchored at $x\in\{0,0.13,-0.31,0.5,0.27\}$ with a $3\times10^{-3}$ tolerance — never see it.

Gate: *Theorem A.4 holds at $t=T_{\rm rev}+xT_{\rm cl}$ with $I$ replaced by the chirped $I(\alpha,\beta_3;\gamma)$, $\gamma=3\pi x\sigma^2/\bar n$; the pure-cubic form is exact only at $x=0$, and its error exceeds the quartic's whenever $|x|>10\sigma^2/9\bar n$ ($7.4\times10^{-3}$ at $\bar n=600,\sigma=2$).* **The printed régime statement: DEAD. Theorem A.4 itself: STANDS, with $\gamma$ restored.**

This is not bookkeeping. $\gamma$ is the first term of the quartic-régime expansion of §2, and it says the revival envelope is a **two-parameter** family $(\gamma,\beta)$ — a chirped Airy, not an Airy.

### 0.5 `stretchedCensus`'s root finder is **DEAD** — a state on which the instrument prints 0 where the truth is 8

The round's most valuable number, so here is the construction.

Only the **moduli** enter $\Phi$, so the roots of $\Phi$ are a **level set of one fixed function**:
$$\Phi(r)=|c_0|^2a_0^2-4|c_+c_-|\,|a_+a_-|=0\iff G(r):=\frac{|a_+(r)\,a_-(r)|}{a_0(r)^2}=u:=\frac{|c_0|^2}{4|c_+c_-|},$$
with $a_s=R_{n_sl_s}(r)\varsigma_{m_s}$ the fixed profiles and $u$ a **free knob**. $G$ vanishes at the radial nodes of the two **outer** modes — Theorem C6′'s $\nu$, and exactly what the code fine-scans — and **blows up at the radial nodes of the MIDDLE mode $\hat A_0$**, which the code never scans. Near such a node $r_0$: $\Phi(r_0)=-4|c_+c_-a_+a_-|<0$ while $\Phi>0$ on both sides once $u$ is large, so the dominance window has a component of half-width
$$\delta r\simeq\frac{2\sqrt{|c_+c_-\,a_+a_-|}}{|c_0|\,|a_0'(r_0)|}\;\propto\;\frac1{|c_0|},$$
whose two edges are two genuine, admissible roots that shrink together as $|c_0|$ grows. The code scans $\Phi$ on a **fixed $10^{-3}$ grid** plus $\pm0.12$ windows around the *outer* modes' nodes: once $\delta r<10^{-3}$ nothing sees them.

Take the print's own state $(3d_{+2},4p_{+1},5s)$ with moduli $(1,c_0,3.7179689892)$. The middle mode $4p$ has its two radial nodes at $r=5.527864$ and $14.472136$ — $0.777$ and $0.147$ **outside** every fine-scan window. Measured (`bf-r6-audit3.mjs` §2; truth $=\Phi$ on a $10^{-6}$ grid with bisection to $10^{-13}$):

| $c_0$ | window half-widths at the two $4p$ nodes | instrument roots | instrument census | truth roots | truth census |
|---|---|---|---|---|---|
| $30$ | $0.366,\ 0.179$ | 4 | 8 | 4 | 8 |
| $10^3$ | $1.10\times10^{-2},\ 5.17\times10^{-3}$ | 4 | 8 | 4 | 8 |
| $10^4$ | $1.10\times10^{-3},\ 5.17\times10^{-4}$ | 4 | 8 | 4 | 8 |
| $3\times10^4$ | $3.67\times10^{-4},\ 1.72\times10^{-4}$ | 2 | **4** | 4 | **8** |
| $7.6241394354\times10^4$ | $1.45\times10^{-4},\ 6.79\times10^{-5}$ | **0** | **0** | 4 | **8** |
| $3\times10^5$ | $3.67\times10^{-5},\ 1.72\times10^{-5}$ | **0** | **0** | 4 | **8** |

**The state that breaks it.** $\psi\propto1\cdot3d_{+2}+76241.394354\cdot4p_{+1}+3.7179689892\cdot5s$ (normalised: $1.311\times10^{-5},\ 1,\ 4.876\times10^{-5}$). The instrument's VORTEX census prints *no roots, count 0 — no reconnections*. The truth is four roots of $\Phi$ at
$$r=5.52779176,\quad5.52793632,\quad14.47210203,\quad14.47216989,$$
**all four admissible** ($\xi=0.7071,\ 0.7070,\ 0.2671,\ 0.2672$), i.e. **eight reconnection points** at $\theta=\arcsin\xi$ and its $z$-mirror. That is the instrument printing something false, and it is not a rounding error — it is a whole family of events at the wrong scale.

**Theorem C6′ is not to blame, and comes out stronger.** Here $\nu=0$ (no outer node inside $W$) and $c=2$ components, so C6′ predicts $\#\{\Phi=0\}=2\nu+2c=4$ ✓ and a census $2(2\nu'+\epsilon)=2(0+4)=8$ ✓ with all four window edges admissible. Fable's $\epsilon\in\{0,1,2\}$ must be widened to $\epsilon\in\{0,1,\dots,2c\}$ — which is what "the admissible edges of the dominance window" always meant, and $c$ is not bounded by 1. **The theorem stands; the implementation is dead.**

**A corollary the print does not have: the census of a stretched three-mode state whose middle mode has $\nu_0$ radial nodes is never zero.** At each node of $a_0$, $\Phi=-4|c_+c_-a_+a_-|<0$ for *every* $c_0$, so those $\nu_0$ window components exist for every state and contribute $4\nu_0$ points; they only shrink, like $1/|c_0|$. For $(3d_{+2},4p_{+1},5s)$ the census therefore runs $10\to8$ as $|c_0|$ grows and **stays at 8 forever** — it cannot reach $0$, which is exactly what the instrument prints.

Gate: *the roots of $\Phi$ are the level set $G(r)=|c_0|^2/4|c_+c_-|$ of the mode-only function $G=|a_+a_-|/a_0^2$; every root lies in a window around a node of $a_+$, $a_-$ **or $a_0$**, the census is exact iff every component of $\{\Phi<0\}$ is resolved, and it is bounded below by $4\nu_0$. Anchor: $(1,\,76241.394354,\,3.7179689892)$ on $(3d_{+2},4p_{+1},5s)$ has $\Phi$-roots $5.52779176,\ 5.52793632,\ 14.47210203,\ 14.47216989$ and census $8$.*

**A second defect in the same function.** `stretchedCensus` does not guard $\omega'=2E_0-E_+-E_-=0$. The state $(4d_{+2},4p_{+1},4s)$ — one shell, three stretched modes, consecutive $m$, a perfectly legal register state — returns $T_d=\infty$ and $t_0=\mathrm{NaN}$ on all seven of its roots while still reporting `count: 8`. Physically the pattern is **stationary**: every "reconnection" is a permanent nodal-line tangency, and JUMP-TO-EVENT would jump to NaN. **DEAD on degenerate input**; the correct statement is that a same-shell triple has $T_d=\infty$ and its tangencies are *time-independent*.

### 0.6 `vortexPoints` — Rouché **STANDS at equality**; the matcher is **ALIVE-AS-A-GATE**

*The dominance test is applied correctly, including at equality.* `mx > sum - mx` is **strict**, and strictness is exactly what Rouché needs: with $|g_k|>\sum_{j\ne k}|g_j|$ on $|w|=1$, $P$ and $g_kw^k$ have the same zero count in the disc and none on the circle. At equality the code does **not** skip — and must not: `gAbs=[1,1]` is $P=1-w$, whose root $w=1$ **is** on the circle (checked, not dominant ✓); `gAbs=[2,1,1]` is $1+w+2w^2$ with roots of modulus $0.7071$, so skipping would have been safe but not sound, and the code again does not skip ✓. One gap: $\sum=0$ returns "dominant", right in the sense that $\psi\equiv0$ has no *isolated* zero, but then the whole circle is nodal and the meter is silent. **STANDS.**

*The drawing does not converge at the default sampling.* On the certified four-mode state $\psi=(3d_{+2}+4p_{+1}+5s+6p_{-1})/2$, $n_r=20$, $r\in[0.5,20]$:

| $t$ | points at $n_\theta=48,\ 96,\ 192,\ 384$ |
|---|---|
| $0$ | $63,\ 67,\ 71,\ 72$ |
| $113.5265785166$ (the certified event) | $57,\ 62,\ 62,\ 62$ |
| $113.6$ | $57,\ 62,\ 62,\ 62$ |

At $t=0$ the default $n_\theta=96$ finds $67$ of at least $72$ piercings — **7 % low and still climbing**. The nearest-previous-root matcher uses a fixed tolerance $0.6$, while the smallest separation between two *distinct* coaxial roots over that grid is $1.055\times10^{-1}$ at $(r,\theta)=(12.931,\pi/2)$: the tolerance is $5.7\times$ the closest genuine pair, so nothing in the algorithm forbids a cross-match. Gate: *the matcher's tolerance must be a fraction of the current minimum pairwise root separation (measured $1.06\times10^{-1}$ on this state), not a constant $0.6$; and the piercing count must carry its $n_\theta$-convergence ($67\to72$ from $96\to384$ at $t=0$).*

*One more, and it is a case the print's own Thread C invites.* For a **same-shell** triple with $g_{-1}=+g_{+1}$ real — e.g. $3d_{+1}+2\cdot3d_0-3d_{-1}$ — the coaxial polynomial is $\propto w^2+c(\theta)w+1$ with $c$ real, self-inversive, whose roots lie **exactly on $|w|=1$** throughout $|c|\le2$. Measured $|w|=1$ to $10^{-12}$ at $(r,\theta)=(5,1.2)$, and `vortexPoints` returns **640 points** from 8 spheres — one pair per $\theta$ sample — where the nodal set is a two-dimensional **sheet**. Every returned point is an exact zero, so the function is not lying; the meter ($M=2$ "lines") is. Gate: *when $P$ is self-inversive the nodal set is a sheet, not a line; the window must detect $|w|\equiv1$ over a $\theta$-interval and say so.*

### 0.7 `schmidt` — degenerate ordering **STANDS**; the Jacobi threshold is **ALIVE-AS-A-GATE** (a false COHERENT flag)

*Ordering.* The realification $[[A,-B],[B,A]]$ of $M^\dagger M$ doubles every eigenvalue exactly, so the sorted $2n$ numbers perturb $(\mu_1,\mu_1,\mu_2,\mu_2,\dots)$ and taking indices $0,2,4,\dots$ returns one from each pair whatever the ordering within a pair; interleaving across pairs needs two values closer than the eigenvalue error, in which case the multiset is right anyway. Verified on $|4s\rangle$, whose spectrum $\{0.5,0.5,0.5,0.5\}$ is four-fold degenerate — returned exactly, and returned exactly again after $e^{-i\theta K_z}$ at $\theta=2$. **STANDS.**

*Scale.* `symEig` stops when $\mathrm{off}=\sum_{p<q}a_{pq}^2<10^{-30}$ — an **absolute** test on a matrix whose entries scale as $\|c\|^2$, so $\mathrm{off}\sim\|c\|^4$. On a random $n=4$ shell state scaled by $\varepsilon$:

| $\varepsilon$ | Schmidt spectrum | max deviation from $\varepsilon=1$ |
|---|---|---|
| $10^{-3}$ | $0.7148366601,\ 0.6202440424,\ 0.3106368471,\ 0.0883777487$ | $1.1\times10^{-16}$ |
| $10^{-5}$ | (same to 10 d.p.) | $1.5\times10^{-11}$ |
| $10^{-6}$ | $0.7148366238,\ 0.6202440424,\ 0.3106368473,\ 0.0883785541$ | $8.1\times10^{-7}$ |
| $10^{-7}$ | $0.7147887676,\ 0.6203243171,\ 0.3113055311,\ 0.1012352809$ | $1.3\times10^{-2}$ |
| $10^{-8}$ | $0.5592226428,\ 0.5219209123,\ 0.4926158239,\ 0.4149677664$ | $\mathbf{3.3\times10^{-1}}$ |

Below $\varepsilon\approx10^{-7}$ Jacobi performs **no rotation at all** and `schmidt` returns the column norms of $M$. `orbit.js` l. 28 sets `coherent: S.values[0] > 0.9995`, so a weakly populated shell that *is* rank one can be drawn "entangled rotors", and (with the reverse accident) a maximally entangled one drawn COHERENT with a Kepler ellipse beside it. Gate: *`symEig`'s test must be relative — `off < 1e-30 * ‖A‖_F²` — and ORBIT must suppress shells of weight below $10^{-14}$. Anchor: the spectrum above must be $\varepsilon$-independent.*

### 0.8 `applyRotateK` — the exactness claim **STANDS**, at $10^{-16}$

> *"an SO(4) rotation — the Schmidt spectrum is invariant. Exact by eigendecomposition of the tridiagonal block."*

On a random 91-mode state (`bf-r6-audit3.mjs` §3):

| test | result |
|---|---|
| one-parameter group, $\lVert R(0.7)R(1.3)-R(2.0)\rVert_\infty$ | $1.81\times10^{-16}$ |
| unitarity, $\lVert\psi\rVert^2$ after $R(2.0)$ | $1.0000000000000000$ |
| inverse, $\lVert R(-2)R(2)-\mathbb1\rVert_\infty$ | $3.81\times10^{-16}$ |
| Schmidt spectra of all five shells, invariance | $1.17\times10^{-15}$ |
| the same under DEFECT WAIT $e^{i0.3\mathbf L^2}$ (must move) | $2.19\times10^{-1}$ |
| unitarity at $\theta=10^{6}$ | $1.0000000000000004$ |

The three things that could have gone wrong do not: the $l$-phase recursion `ETA` never meets a vanishing $\langle l{+}1\,0|K_z|l\,0\rangle$ (the loop stops at $l+1=n-1$, where $\sqrt{n^2-(l+1)^2}\neq0$); the $m$-blocks are genuinely decoupled ($K_z$ conserves $n$ and $m$); and `symEig`'s absolute threshold is harmless *here* because $K$ is built from `kzElement` and is $O(n)$ **independently of the state's amplitude** — the one place in the file where the absolute test is the right one. **STANDS.**

### 0.9 The ledger of §0

| assertion | verdict | the deciding number |
|---|---|---|
| `airyAi` "both sides better than 1e-8" | **DEAD** (and unachievable) | $1.06\times10^{-7}$ at $x=5.9999$; switch jump $1.19\times10^{-8}$; optimum $1.05\times10^{-8}$ at $x^*=5.746$ |
| `envelopeI` at small $\beta$ | ALIVE-AS-A-GATE | rel. error $2.06\times10^{-18}/\beta^2$; $\alpha^*$ 38 % wrong at $\beta=3\times10^{-5}$ |
| `peakLaw` bracket / lobe | **STANDS** (proved) | $\beta=3\to-1.897444$; $\beta=300\to1.3354$ vs $1.3427$ |
| `peakLaw` `seriesUsable: β<0.32` | **DEAD** | height $0.69472$ vs $0.89878$ at $\beta=0.319$; true boundary $\beta=0.0555$ |
| `poissonAiry` normaliser, $J=24$ | **STANDS** (the exact theta identity) | $j=\pm1$ term $5\times10^{-35}$ at $\sigma=2$; safe for $\sigma\gg0.0066$ |
| `poissonAiry` "the quartic is the neglected term" | **DEAD** | the chirp $\gamma=3\pi x\sigma^2/\bar n$ is $67.5\times\beta_4$ at $(600,2,0.5)$; restoring it cuts the error $5.6\times$ |
| `stretchedCensus` root finder | **DEAD** | $(1,\,76241.394354,\,3.7179689892)$ prints **0** where the census is **8** |
| `stretchedCensus` at $\omega'=0$ | **DEAD** | $(4d_{+2},4p_{+1},4s)$: $T_d=\infty$, $t_0=$ NaN, count 8 |
| Theorem C6′ itself | **STANDS, widened** | $\nu=0$, $c=2$: predicts 4 roots, 8 points ✓; $\epsilon\in\{0,\dots,2c\}$ |
| `vortexPoints` Rouché at equality | **STANDS** | $[1,1]\to$ not dominant, and $w=1$ *is* a root of $1-w$ |
| `vortexPoints` matcher tol $0.6$ / sampling | ALIVE-AS-A-GATE | $67\to72$ points, $n_\theta=96\to384$; closest genuine pair $1.055\times10^{-1}$ |
| `schmidt` degenerate ordering | **STANDS** | $|4s\rangle\to(0.5,0.5,0.5,0.5)$ exactly |
| `schmidt` Jacobi threshold | ALIVE-AS-A-GATE | spectrum wrong by $0.33$ at shell amplitude $10^{-8}$ |
| `applyRotateK` exactness | **STANDS** | group law $1.8\times10^{-16}$; Schmidt invariance $1.2\times10^{-15}$ |

Four of the five dead things are invisible to `tests/frontier.test.mjs` for one reason: **every anchor sits in the interior of its régime.** The Airy anchors stop at $x=5$ and the failure is at $5.9999$; the envelope anchors stop at $\beta=0.02$ and the failure is at $10^{-4}$; the Poisson anchors weight $x=0$ and the failure is linear in $x$; the census anchors are the two states of the print, whose windows are $0.36$ and $0.18$ wide, and the failure needs $10^{-4}$. *A régime boundary that is never tested is not a boundary, it is a hope.* The dossier's §18.1 — "an implementation must not be its own only oracle" — is satisfied by these tests in letter (the anchors are mine) and evaded in spirit (the anchors are all comfortable). The cheapest repair is not more anchors but **one anchor per régime boundary, placed on the boundary**.

---

## §1 · Q30–Q35

### Q30 — the gain law. **PREDICTION FIRST** (written before the probe ran)

Fable's law: $\kappa^2=\ln T+c_0$, $c_0=\tfrac12$, measured on four uniform combs $T\le33$ with $b\le60$. At $T=129$:
$$\ln 129=4.859812,\qquad \kappa^2_{\rm law}=5.359812,\qquad\boxed{\kappa_{\rm law}(129)=2.31513}.$$

**My own prediction, which is different, and says the law will fail low.** Fable's own table already contains the falsifier: the $T=65$ row gave $\kappa^2-\ln T=0.104$, not $0.5$, and Fable excluded it because $T>b_{\max}=60$. That exclusion names the real variable. The infimum runs over *all* reduced $a/b$ with $b\le B$; when $b<T$ the sum $\sum_{|m|\le T/2}e(am^3/b+xm)$ is **complete or nearly complete** in $m$ modulo $b$, and complete cubic sums have square-root cancellation ($|S|\le 2\sqrt b$ per period, Weil), so their normalised height is $\approx(T/b)\cdot2\sqrt b/T=2/\sqrt b$ — which is *smaller* than the incomplete-régime floor as soon as $b\ll T$. At $T=129$, $B=300$ the admissible $b$ run from $1$ to $300$ and roughly $43\%$ of them are below $T$. So:

1. Over **all** $b\le300$: I predict $\kappa(129)<\kappa_{\rm law}$, in the range $\kappa\in[2.0,2.25]$, i.e. $\kappa^2-\ln T\in[-0.86,+0.20]$ — Fable's $c_0=\tfrac12$ **falsified** by more than the $0.3$ drift her own falsifier allows.
2. Over the **incomplete** régime only ($b>T=129$): I predict the law survives, $\kappa\in[2.28,2.36]$.
3. The minimising fraction over all $b\le300$ will have $b<129$; over $b>129$ it will have $b$ near the top of the range.

If (1) and (2) both hold, the corrected clause is that $c_0$ is not a constant but a function of $T/b_{\max}$, and Ω₅(2) must carry the hypothesis $b_{\min}>T$ explicitly.

#### Q30 — the answer. **Fable's $c_0=\tfrac12$ is REFUTED; so is my own predicted mechanism.**

`bf-r6-kappa.py`, `bf-r6-kappa2.py`. Method: $\max_x$ by a zero-padded FFT on $N=16384$ points ($\ge120$ samples per lobe), over every reduced $a/b$ with $b\le B$, using $\mathcal A(a/b)=\mathcal A((b-a)/b)$ to halve the work.

**First, the reproduction.** At Fable's own budget $b\le60$ I get $\mathcal A_{\inf}=0.650000,\,0.550954,\,0.441715,\,0.345904,\,0.256546$ for $T=5,9,17,33,65$ against her $0.650000,\,0.550954,\,0.441711,\,0.345893,\,0.256535$ — agreement to $10^{-5}$, which is her $x$-grid. Her table stands as measured.

**Second, the budget is not innocent.** $\inf_{b\le B}$ is still falling at $B=60$:

| $T$ | $B=2T$ | $B=4T$ | $B=8T$ | $B=16T$ |
|---|---|---|---|---|
| 5 | $0.650000$ | $0.650000$ | $0.650000$ | $0.650000$ |
| 9 | $0.566944$ | $0.550954$ | $0.550954$ | $0.550954$ |
| 17 | $0.452582$ | $0.441715$ | $0.436791$ | $0.436240$ |
| 33 | $0.345904$ | $0.337839$ | $0.337696$ | $0.335308$ |
| 65 | $0.256546$ | $0.256546$ | $0.252748$ | $0.248107$ |
| 129 | $0.196066$ | $0.196066$ | $0.195489$ | — |

The well-posed object is not $\inf_{b\le B}$ at fixed $B$ but its limit, $\kappa_\infty(T)=\sqrt T\,\inf_{\theta\in\mathbb R}\max_x\big|\tfrac1T\sum_{|m|\le T/2}e(\theta m^3+xm)\big|$ (the rationals are dense and $\mathcal A$ is continuous in $\theta$). At $B=8T$:

| $T$ | $\inf\mathcal A$ | at $a/b$ | $\kappa$ | $\kappa^2$ | $\ln T$ | $\kappa^2-\ln T$ | $\kappa^2/\ln T$ |
|---|---|---|---|---|---|---|---|
| 5 | $0.650000$ | $1/4$ | $1.4534$ | $2.1125$ | $1.6094$ | $+0.503$ | $1.313$ |
| 9 | $0.550954$ | $8/19$ | $1.6529$ | $2.7320$ | $2.1972$ | $+0.535$ | $1.243$ |
| 17 | $0.436791$ | $15/88$ | $1.8009$ | $3.2434$ | $2.8332$ | $+0.410$ | $1.145$ |
| 33 | $0.337696$ | $104/209$ | $1.9399$ | $3.7633$ | $3.4965$ | $+0.267$ | $1.076$ |
| 65 | $0.252748$ | $74/383$ | $2.0377$ | $4.1523$ | $4.1744$ | $\mathbf{-0.022}$ | $0.995$ |
| 129 | $0.195489$ | $78/865$ | $2.2203$ | $4.9299$ | $4.8598$ | $\mathbf{+0.070}$ | $1.014$ |

> *"$\kappa^2=\ln T+0.50\pm0.05$ on four points … $c_0\approx\tfrac12$ for uniform combs"* — `05-fable.md` §1.2.

**REFUTED.** $\kappa^2-\ln T$ runs $+0.503\to+0.070$ over $T=5\to129$, a drift of $\mathbf{0.43}$ — larger than the $0.3$ Fable's own falsifier allows. My pre-registered $\kappa_{\rm law}(129)=2.31513$ is wrong: measured $\kappa(129)=2.2203$ converged, $2.2269$ at $b\le300$. What survives is $\kappa^2/\ln T\to1$: the **slope** is right, the constant is not, and $c_0\to0$, not $\tfrac12$.

**Why the four old points looked flat.** The budget $b\le60$ is converged for $T=5,9$ and *not* for $T=17,33,65$ — by $1.1\%$, $2.4\%$, $1.5\%$, an under-convergence that grows with $T$ and so inflates $\kappa$ exactly where the law was being tested. Fable's $0.50,0.53,0.48,0.45$ is two converged points followed by two artefacts. Gate: *$\kappa_\infty^2(T)=\ln T+o(1)$, constant $0$; any measurement of it needs $b_{\max}\ge8T$. Anchors: $\kappa_\infty(65)=2.0377$, $\kappa_\infty(129)=2.2203$.*

**My own prediction was wrong too, and by more.** I predicted the mechanism was the complete-sum régime ($b<T$, Weil). The probe kills it: at $T=129$, $B=300$, $\inf_{b>T}=\inf_{\text{all }b}=0.196065$ **at the same fraction $97/214$**, and the minimising denominator is always in the *incomplete* régime — $214>129$, $383>65$, $865>129$. My range $[2.0,2.25]$ held ($2.2269$); my reason did not. Complete cubic sums are irrelevant to the floor.

**Where the $\ln T$ comes from — a rigorous ladder, DERIVED-HERE.** For any $\theta$,
$$\max_x|S(x)|^2\ \ge\ \frac{\int_0^1|S|^{2k}dx}{\int_0^1|S|^{2k-2}dx}=\frac{M_{2k}}{M_{2k-2}},\qquad\text{so}\qquad\kappa^2\ \ge\ \max_{k\ge2}\frac{M_{2k}}{M_{2k-2}\,T},$$
and $M_{2k}$ counts solutions of $\sum_{i\le k}m_i=\sum_{i\le k}m_i'$ weighted by $e\big(\theta\sum(m_i^3-m_i'^3)\big)$. Its **diagonal** ($\{m\}=\{m'\}$) contributes exactly $k!\,T^k(1+O(1/T))$ *whatever* $\theta$ — no arithmetic at all — so while the diagonal dominates, $M_{2k}/(M_{2k-2}T)\to k$ and $\kappa^2\ge k$. The $\ln T$ is the rung at which diagonal dominance fails. MEASURED at the minimising fraction, with $M_{2k}$ **exact** ($|S|^{2k}$ is a trigonometric polynomial of degree $k(T-1)<N/2$, so the $N$-point average is exact):

| $T$ | $a/b$ | $\kappa^2$ | $k=2$ | $k=3$ | $k=4$ | $k=5$ | $k=6$ | $k=8$ |
|---|---|---|---|---|---|---|---|---|
| 5 | $1/4$ | $2.1125$ | $1.4800$ | $1.6811$ | $1.7833$ | $1.8453$ | $1.8878$ | $1.9435$ |
| 33 | $104/209$ | $3.7633$ | $2.0592$ | $2.5345$ | $2.8137$ | $3.0001$ | $3.1338$ | $3.3094$ |
| 129 | $78/865$ | $4.9299$ | $2.3048$ | $3.0321$ | $3.4578$ | $3.7241$ | $3.9071$ | $4.1528$ |

and $M_{2k}/(k!T^k)$ stays above $\tfrac12$ up to $k=2,3,3,4,4,5$ for $T=5,9,17,33,65,129$ — i.e. $k_{\max}\approx1.15\ln T$. So: **the floor is a moment ladder, it climbs one rung per factor $e^{0.87}$ in $T$, and the Salem–Zygmund reading ("half the random variance") is not the mechanism — the mechanism is that the $2k$-th moment of a cubic Weyl sum is diagonal until $k\sim\ln T$.** Rigorous, no fit: $\kappa^2(129)\ge4.1528$, $\kappa^2(5)\ge1.9435$.

Corrected Ω₅(2): *$\mathcal A\ge\lVert p\rVert_2/\lVert p\rVert_1$ (Theorem A8, unchanged), and $\inf_\theta\mathcal A(p;\theta)=\frac{\lVert p\rVert_2}{\lVert p\rVert_1}\sqrt{\ln T_{\rm eff}}\,(1+o(1))$ with **no additive constant**; $\kappa^2\ge k$ for every $k$ whose $2k$-th moment is diagonal-dominated, and $k_{\max}\asymp\ln T$.*

#### Q32 — $b_1'$, $b_2$, $b_2'$ and the RULE, DERIVED from the dictionary. `bf-r6-stokes.py`

One substitution does all of it. $\mathrm{Ai}\to\mathrm{Ai}+\varepsilon\mathrm{Bi}$ is the **only** exponentially small freedom in the construction, and the Wronskian $\mathrm{Ai}\,\mathrm{Bi}'-\mathrm{Ai}'\mathrm{Bi}=1/\pi$ carries it everywhere.

**Step 1 — a closed form for the maximiser that Round 3 never wrote.** $z^*=\lambda^2h^2$, $\lambda^3=1/w$, $w=72\beta^2$, $c=(3\beta)^{1/3}$, and $\lambda^2c=1/(12\beta)$, so
$$\boxed{\ \alpha^*(\beta)=\frac{h^2-1}{12\beta}\ }\qquad\Longrightarrow\qquad C_k=72^k\,[w^k]\frac{h^2-1}{12},$$
$h$ the unique formal solution of $h=\Psi\!\big(\tfrac32wh^{-3}\big)$, $\Psi=U/\tilde V$ ($U$ Airy's series, $\tilde V$ Airy's derivative series, $\Psi=1-\tfrac x6+\tfrac7{72}x^2-\cdots$). Exact rational iteration gives $h=1-\tfrac w4+\tfrac{w^2}{32}-\tfrac{9w^3}{128}+\tfrac{315w^4}{2048}-\cdots$ and reproduces
$$C_1\ldots C_7=-3,\ 54,\ -4860,\ 769824,\ -169746192,\ 47259985248,\ -15778134664704$$
$$D_0\ldots D_6=1,\ -3,\ \tfrac{279}2,\ -\tfrac{29331}2,\ \tfrac{19280619}8,\ -\tfrac{21368014569}{40},\ \tfrac{11848476936159}{80}$$
— the print's own coefficients, out of a closed form, in exact rational arithmetic. That check licenses everything below.

**Step 2 — the two companions.** With $G=\mathrm{Ai}'/\mathrm{Ai}$ the peak law is $G(z^*)=-\lambda$; perturbing, $\delta G=\varepsilon/(\pi\mathrm{Ai}^2)$ and $G'=z-G^2=\lambda^2(h^2-1)$, so $\delta z^*=-\varepsilon/\big(\pi\mathrm{Ai}^2\lambda^2(h^2-1)\big)$. With $1/(\pi\mathrm{Ai}^2)=4\sqrt{z^*}e^{2\zeta^*}/U^2$, $2\zeta^*=\tfrac43h^3/w$, $\mathrm{Bi}/\mathrm{Ai}=2e^{2\zeta}\hat U/U$:
$$\delta A(w)=-\frac{\varepsilon}{3}\,\frac{w\,h\,e^{4h^3/3w}}{U(x^*)^2\,(h^2-1)},\qquad \delta D(w)=2\varepsilon\,D(w)\,\frac{\hat U(x^*)}{U(x^*)}\,e^{4h^3/3w},$$
$A=\beta\alpha^*$, $D=|I|_{\max}$, $x^*=\tfrac32wh^{-3}$, $\hat U$ Bi's series. Both carry $e^{4/3w}$: **the singulant $\chi=-\tfrac43$ in $w$ — the Borel pole $\beta^2=-\tfrac1{54}$ — is forced, not fitted.** And $e^{4(h^3-1)/3w}=e^{-1}\,e^{\frac38w-\frac{35}{96}w^2+\cdots}$: the composition lemma's $e^{-1}$ falls out of $h^3$ at order $w$, in one line.

**Step 3 — the dictionary.** $f_k=S\chi^{-k}\big[\Gamma(k)+b_1\Gamma(k-1)+\cdots\big]\iff F(w)=S\,e^{-\chi/w}(1+p_1w+\cdots)$, so $b_r=p_r\chi^r$:

| $r$ | $p_r$ ($\alpha^*$) | $b_r$ | $p_r'$ ($|I|_{\max}$) | $b_r'$ |
|---|---|---|---|---|
| 1 | $\tfrac7{12}$ | $-\tfrac79$ | $\tfrac{13}{24}$ | $\mathbf{-\tfrac{13}{18}}$ |
| 2 | $-\tfrac{137}{288}$ | $-\tfrac{137}{162}$ | $-\tfrac{41}{1152}$ | $\mathbf{-\tfrac{41}{648}}$ |
| 3 | $\tfrac{10729}{10368}$ | $-\tfrac{10729}{4374}$ | $\tfrac{79255}{82944}$ | $\mathbf{-\tfrac{79255}{34992}}$ |
| 4 | $-\tfrac{1630667}{497664}$ | $\mathbf{-\tfrac{1630667}{157464}}$ | $-\tfrac{8378303}{7962624}$ | $\mathbf{-\tfrac{8378303}{2519424}}$ |
| 5 | $\tfrac{392709787}{29859840}$ | $\mathbf{-\tfrac{392709787}{7085880}}$ | $\tfrac{1866898385}{191102976}$ | $\mathbf{-\tfrac{1866898385}{45349632}}$ |

$b_1=-\tfrac79$, $b_2=-\tfrac{137}{162}$, $b_3=-\tfrac{10729}{4374}$ are the print's — now **derived, not fitted**; $b_4,b_5$ are new. $b_1'=-\tfrac{13}{18}$ **confirms Fable's six-digit Richardson value exactly**; $b_2',b_3',b_4',b_5'$ are new. And the prefactor ratio comes out as the integer
$$\frac{\delta D}{\delta A}\Big|_{w\to0}=3\qquad\Longrightarrow\qquad\frac{S_{|I|_{\max}}}{S_{\alpha^*}}=\frac{1/2\pi e}{1/6\pi e}=3,$$
Theorem A.7's "three times the maximiser's" — **derived, not measured**.

**The RULE.** For two observables sharing the singularity, the whole difference is one series:
$$\rho(w):=\tfrac13\,\frac{\delta D}{\delta A}=-\frac2w\,|I|_{\max}\;\hat U(x^*)\,U(x^*)\;\frac{h^2-1}{h}=1-\frac w{24}+\frac{169}{384}w^2-\cdots,$$
$$b_r'-b_r=\chi^r\,[w^r]\rho:\qquad b_1'-b_1=-\tfrac43\cdot\big(-\tfrac1{24}\big)=\tfrac1{18},\qquad b_2'-b_2=\tfrac{16}9\cdot\tfrac{169}{384}=\tfrac{169}{216}.$$
Why $\tfrac1{18}$ and not something else: at order $w$ the factor $\hat U(x^*)U(x^*)=1+O(w^2)$ (Bi's series times Ai's — the $u_1$'s cancel) and $-\tfrac2w(h^2-1)/h=1+0\cdot w$ **exactly** (which needs $h^2=1-\tfrac w2+\tfrac{w^2}8$, i.e. $\psi_2=\tfrac7{72}$), so the only surviving contribution is $|I|_{\max}=1-3\beta^2=1-\tfrac w{24}$. **The difference of the two $b_1$'s is the revival height's own first coefficient, times $-\chi$: $\tfrac43\cdot\tfrac1{24}=\tfrac1{18}$.** That is the rule Q32 asked for, and it predicts the next one, $\tfrac{169}{216}$, which no fit has yet seen.

#### Q32′ — Ω₄′ is FALSE as literally stated, and it is my own conjecture I am killing

> *"Every stationarity- or moment-defined observable of $I(\alpha,\beta)$ has a Gevrey-1 series in $\beta^2$ with singulant $-\tfrac1{54}$, **late terms $\propto(-54)^k\Gamma(k)$**, leading constant in $\tfrac1{\pi e}\mathbb Q$ and every $b_r\in\mathbb Q$."* — Ω₄′ (Opus R4, sharpened Fable R5, printed §7).

Take a third observable: the **curvature of the log-envelope at its own peak**,
$$K(\beta):=-\partial_\alpha^2\ln|I|\Big|_{\alpha^*}=\frac{\lambda^2(1-h^2)}{c^2}=-\frac{2(h^2-1)}{w}=1-18\beta^2+1620\beta^4-\cdots,\qquad K_j=-\tfrac13C_{j+1}.$$
Stationarity-defined, neither $\alpha^*$ nor $|I|_{\max}$, and its late terms are
$$K_j=(-1)^j54^{\,j}\,\Gamma(j+1)\,\frac{3}{\pi e}\Big(1+\sum_rb_r\tfrac{\Gamma(j+1-r)}{\Gamma(j+1)}\Big):$$
same singulant $-\tfrac1{54}$ ✓, constant $\tfrac3{\pi e}\in\tfrac1{\pi e}\mathbb Q$ ✓, the *same* rational $b_r$ ✓ — but $\Gamma(j+1)$, not $\Gamma(j)$. **The power of $k$ is not universal; the singularity is.** Replacement, and it is a theorem rather than a conjecture:

> ### Theorem Ω₄″ (the closed ring of the revival; DERIVED-HERE, R6)
> *Let $h$ be the unique formal solution of $h=\Psi(\tfrac32wh^{-3})$, $\Psi=U/\tilde V$, $w=72\beta^2$, $x^*=\tfrac32wh^{-3}$. Every quantity defined by stationarity of $|I(\alpha,\beta)|$ in $\alpha$ lies in the ring*
> $$\mathcal R=\mathbb Q\big[w^{\pm1},\,h,\,U(x^*),\,\tilde V(x^*),\,\hat U(x^*)\big],$$
> *because $z^*=\lambda^2h^2$ and $\lambda^3=1/w$. Its exponentially small companion is obtained by the single substitution $\mathrm{Ai}\to\mathrm{Ai}+\varepsilon\mathrm{Bi}$, acting as $\delta z^*=-\varepsilon/(\pi\mathrm{Ai}^2\lambda^2(h^2-1))$ and carrying the factor $e^{2\zeta^*}=e^{4h^3/3w}$ for every member of $\mathcal R$. Hence every such observable is Gevrey-1 with singulant $\chi=-\tfrac43$ in $w$ (Borel pole $\beta^2=-\tfrac1{54}$), late terms $\propto(-54)^k\Gamma(k+a)$ with $a\in\mathbb Z$ its $w$-weight, leading constant in $\tfrac1{\pi e}\mathbb Q$, and all $b_r\in\mathbb Q$. Ω₄′'s $\Gamma(k)$ is the case $a=0$.*

Witnesses: $\alpha^*$ ($a=0$, $\tfrac1{6\pi e}$), $|I|_{\max}$ ($a=0$, $\tfrac1{2\pi e}$), $K$ ($a=1$, $\tfrac3{\pi e}$), $\partial_\alpha^3\ln|I|=(1-K)/3\beta$ ($a=1$). Falsifier: a stationarity-defined observable outside $\mathcal R$, or a constant not in $\tfrac1{\pi e}\mathbb Q$.

**A check that closes the loop on my own composition lemma.** The *bare* moment — no stationarity, no composition — is $I(0,\beta)=\sum_k(-1)^k\frac{(6k-1)!!}{(2k)!}\beta^{2k}$, and Richardson-6 at $k=100$ on exact coefficients gives $S=0.1591549430919$ against $\tfrac1{2\pi}=0.1591549430919$: **thirteen digits, and no $e$**. The $e^{-1}$ of $\tfrac1{6\pi e}$ is entirely the composition $h$, exactly as the lemma says (`bf-r6-pearcey.py` §3).

#### Q33 — the $\mathbb F_2$ Jordan structure in closed form, and what the octahedral number is. `bf-r6-f2gates.py`

On odd degree $\Lambda^2=E=\mathrm{id}$, so in characteristic 2 $\Lambda+1=\Lambda-E=D=a\partial_x+b\partial_y$ — **the same derivation Fable's Theorem F2 already solved**, now on odd degree. Hence $\ker(\Lambda+1)|_{\deg N}=\ker D|_{\deg N}=Q(N)+Q(N-2)$ with $Q(N)=\#\{a^ib^jx^{2k}y^{2l}\ \text{of degree}\ N\}=\sum_{m\le N/2}(N-2m+1)(m+1)$; for odd $N=2M+1$, $Q(N)=\tfrac13(M+1)(M+2)(M+3)$ and
$$\boxed{\ \dim\ker(\Lambda+1)\big|_{\deg N\ \text{odd}}=\frac{(N+1)(N+2)(N+3)}{12}=\tfrac12\binom{N+3}{3}\ }$$
— **exactly half the space**, so rank $=$ nullity and **$\Lambda$ is a free involution on every odd degree: every Jordan block is $J_2$, and there are $\tfrac12\binom{N+3}3$ of them.** On even degree $N=2n-2$ the same arithmetic simplifies Fable's clause (4): size-2 blocks $=\binom{N+3}3-\tfrac{n(2n^2+1)}3=\tfrac{2n(n^2-1)}3$ and size-1 blocks $=\tfrac{n(2n^2+1)}3-\tfrac{2n(n^2-1)}3=\mathbf{n}$ — *exactly $n$*, one per row of the shell. CERTIFIED by brute-force $\mathbb F_2$ rank on every degree $N=0,\dots,12$, zero mismatches:

| $N$ | $\dim$ | $\ker\Lambda$ | $\ker(\Lambda+1)$ | $\#J_1$ | $\#J_2$ |
|---|---|---|---|---|---|
| 2 | 10 | 6 | 0 | 2 | 4 |
| 3 | 20 | 0 | 10 | 0 | 10 |
| 4 | 35 | 19 | 0 | 3 | 16 |
| 8 | 165 | 85 | 0 | 5 | 80 |
| 11 | 364 | 0 | 182 | 0 | 182 |
| 12 | 455 | 231 | 0 | 7 | 224 |

*What has $\tfrac{n(2n^2+1)}3$ points?* **Not a quadric — a weighted projective space.** Fable's kernel $\mathbb F_2[a,b,x^2,y^2]\oplus(bx+ay)\mathbb F_2[a,b,x^2,y^2]$ is the section ring of $\mathcal O\oplus\mathcal O(-3)$ on $\mathbb P(1,1,2,2)$, and $O_n$ is that ring's Hilbert function in degrees $2n-2$ and $2n-4$ summed: the object is a weighted $\mathbb P^3$ (the cone over a quadric surface), and the octahedral number is an **Ehrhart** count, not an incidence count. The one incidence coincidence worth naming and *not* believing: $O_n=(s+1)(st+1)$ — the point count of a generalised quadrangle $\mathrm{GQ}(s,t)$ — with $s=n-1$, $t=\tfrac23(n+1)$, integral exactly when $n\equiv2\pmod3$; at $n=5$ that is $\mathrm{GQ}(4,4)$, which exists and has $85=O_5$ points. At $n=2$ it would need $\mathrm{GQ}(1,2)$, which fails $t\le s^2$. So it is not a GQ family; $n=5$ is a coincidence until someone maps the $\mathbb F_2$ shell to $W(4)$.

#### Q35 — the $n=3$ gate count is **5**, not 3. Fable's parameter count is REFUTED. `bf-r6-f2gates.py`

> *"parameter counting gives at least $\lceil(2n^2-2)/7\rceil$ alternating layers ($3$ at $n=3$)"* — `05-fable.md` §2.2.

Two facts kill it. First, $\mathbf L^2|3s\rangle=0$, so a DEFECT WAIT **cannot start** the sequence — the word must be $R_KW_{K-1}R_{K-1}\cdots W_1R_1$. Second, and this is the error: $\mathbf L^2=2j(j+1)+2\mathbf J_+\!\cdot\!\mathbf J_-$ is a Casimir of the **diagonal** $SU(2)$, so every wait commutes with $SU(2)_{\rm diag}$; writing each rotation $R_k=S_kD_k$ with $D_k$ diagonal, $D_k$ slides right through every wait and is absorbed by $R_{k-1}$. Each layer therefore contributes the coset $(SU(2)\times SU(2))/SU(2)_{\rm diag}$ — **3** parameters — plus one $\alpha$: **4 per layer, not 7.** MEASURED (rank of the real Jacobian of $(\text{params})\mapsto\psi$ at random points, global phase and norm projected out; target $\dim_{\mathbb R}\mathbb{CP}^8=16$):

| layers $K$ | params $7K-1$ | naive bound $7K-5$ | **measured rank** | $\min(4K-1,16)$ |
|---|---|---|---|---|
| 1 | 6 | 2 | $\mathbf3$ | 3 |
| 2 | 13 | 9 | $\mathbf7$ | 7 |
| 3 | 20 | 16 | $\mathbf{11}$ | 11 |
| 4 | 27 | 23 | $\mathbf{15}$ | 15 |
| 5 | 34 | 30 | $\mathbf{16}$ | 16 |
| 6 | 41 | 37 | $\mathbf{16}$ | 16 |
| 7 | 48 | 44 | $\mathbf{16}$ | 16 |

The rank is exactly $\min(4K-1,\,2n^2-2)$ on seven values of $K$. At $K=3$ it is $11$ — five short of $16$: **three alternating layers cannot reach a generic $n=3$ shell state, and four cannot either.** The answer is
$$\boxed{\ K_{\min}(n)=\Big\lceil\frac{2n^2-1}{4}\Big\rceil\ }\qquad K_{\min}(3)=5,$$
with $K_{\min}(2)=2$, $K_{\min}(4)=8$, $K_{\min}(5)=13$ as UNVERIFIED consequences of the same coset argument. Gate: *from $|3s\rangle$, five alternating layers (five rotations, four waits, 34 parameters) reach a generic $n=3$ state; four reach a 15-dimensional subvariety of the 16-dimensional $\mathbb{CP}^8$, and no schedule of $\alpha$'s repairs it.* The schedule itself is a 34-parameter least-squares problem with a 16-dimensional image — under-determined by 18, so never unique; the natural gauge ($\alpha_k>0$ minimal) I did not compute (NOT CERTIFIED).
### Q31 — the rate. The $\theta$-elimination gives **the wrong frequency set in the print's staging**, and my own $\Delta t$ is at least $8\times$ too large

`bf-r6-rate.py`, `bf-r6-rate2.py`. The four modes of $\psi=(3d_{+2}+4p_{+1}+5s+6p_{-1})/2$ are **all stretched**, so with $s=\sin\theta$, $\Theta_{lm}\propto s^{|m|}$:
$$a=A_2s^2e^{i\omega_3t},\quad b=A_1se^{i\omega_4t},\quad c=A_0e^{i\omega_5t},\quad d=A_{-1}se^{i\omega_6t},$$
and the cubic discriminant $18abcd-4b^3d+b^2c^2-4ac^3-27a^2d^2$ becomes, with $u=\sin^2\theta$,
$$\operatorname{disc}=u\big[X(\tau)+Y(\tau)\,u+Z(\tau)\,u^2\big],\qquad\tau=t/7200,$$
$$X=A_1^2A_0^2e^{738i\tau}-4A_2A_0^3e^{832i\tau},\quad Y=18A_2A_1A_0A_{-1}e^{869i\tau}-4A_1^3A_{-1}e^{775i\tau},\quad Z=-27A_2^2A_{-1}^2e^{1000i\tau}.$$

> **The $\theta$-elimination reorganises Pólya's five frequencies by the power of $\sin^2\theta$: $u^1:\{738,832\}$, $u^2:\{775,869\}$, $u^3:\{1000\}$ — a $2+2+1$ partition whose only *internal* beats are $832-738=94$ and $869-775=94$, both equal.** The adjacent gaps $37,57,37,131$ that Fable's staging sums over are the gaps of the *unreduced* frequency list at fixed position; after the elimination they are not the beats of anything. Her rate formula $N/T=\tfrac1{2\pi}\sum_{\text{adjacent}}|\Delta\omega|\cdot\#\{\text{balance radii}\}$ is summing over the wrong pairs.

Dividing by $e^{1000i\tau}$ makes $Z$ real, and a real root $u$ of the complex quadratic requires
$$Z\,X_I^2-Y_RX_IY_I+X_RY_I^2=0,\qquad u=-X_I/Y_I\in(0,1],$$
one real equation in $\tau$ at each $r$ — a real trigonometric polynomial with frequencies from $\{262,225,168,131\}$ and their sums. MEASURED: the number of admissible $\tau$-roots per period saturates at $\max_r m(r)=260,\,260,\,261$ as the $\tau$-grid goes $2\times10^4\to4\times10^4\to6\times10^4$ — **Pólya's $\omega_{\max}-\omega_{\min}=262$, recovered after the elimination.** That much is settled.

The events are the crossings of $|w_0|=1$ along those branches, $w_0=(9ad-bc)/2(b^2-3ac)$ the double root. Counting them as the total variation of $m_{<1}(r)=\#\{$admissible roots with $|w_0|<1\}$ — a quantity that can only *under*-count — gives

| $N_r$ | $N_\tau$ | events per period (a lower bound) | $\Delta t\le$ |
|---|---|---|---|
| 1500 | $2\times10^4$ | $7278$ | $6.216$ |
| 3000 | $4\times10^4$ | $9254$ | $4.889$ |
| 6000 | $6\times10^4$ | $\mathbf{12446}$ | $\mathbf{3.635}$ |

still rising by $\sim35\%$ per refinement. So: **Round 4's "$\ge1480$ events per period, $\Delta t\le30.5668$" is correct as a bound and at least $8\times$ off as an estimate; the true rate is $\ge12446$ per period and I cannot yet certify its limit.** The densest radii are $14.15$ and $14.56$–$14.65$ — the node cluster of Theorem C.3, exactly where they should be. A naïve marching-squares intersection count of the two zero curves *diverges* with resolution ($34725\to62143\to83948$) and must not be used; the branch count above is the one that is monotone by construction. Q31 is **not closed**; it is re-staged with the right frequency set and a much better bound. See Q39.

### Q34 — the fold constant and $c_0$. `bf-r6-sixj.py`

**$C_{\rm fold}$.** The uniform fold form is $\{6j\}\simeq\dfrac{\zeta^{1/4}}{\sqrt{12V}}\mathrm{Ai}(-\zeta)$ with $\tfrac23\zeta^{3/2}=\Phi=\sum(J_i+\tfrac12)\theta_i$ (Schulten–Gordon 1975 in its fold form; matching to the allowed $\cos(\Phi-\tfrac\pi4)/\sqrt{12\pi V}$). At the isosceles fold, Fable's $V=\tfrac{2^{1/4}}3\varepsilon^{1/2}j^3$ with $\varepsilon=(J_c-J)/j$, and $\zeta$ is an $O(1)$ variable only on the Airy scale $\varepsilon\sim j^{-2/3}$, i.e. $\zeta=\kappa\,\varepsilon\,j^{2/3}=\kappa(J_c-J)/j^{1/3}$. Substituting,
$$\{6j\}\big|_{J\to J_c}=\mathrm{Ai}(0)\,\frac{\kappa^{1/4}}{\sqrt{4\cdot2^{1/4}}}\;j^{-4/3}\qquad\Longrightarrow\qquad\boxed{\ C_{\rm fold}=\frac{\mathrm{Ai}(0)\,\kappa^{1/4}}{2\cdot2^{1/8}}\ }$$
— and this *derives* the $j^{-4/3}$ exponent as $j^{1/6}/j^{3/2}$ rather than fitting it. The one unknown is the Airy scale $\kappa=j^{1/3}/\ell$. MEASURED by a two-parameter least-squares fit of $A\,j^{-4/3}\mathrm{Ai}\big((J-J_c)/\ell\big)$ across the layer at $j=40,80,160,320$: $\ell/j^{1/3}=0.50,0.50,0.40,0.40$, i.e. $\kappa\in[2.0,2.5]$, giving
$$C_{\rm fold}\in[0.194,\ 0.205].$$
Direct reading of $|6j|\,j^{4/3}$ at the integer $J$ nearest $J_c$: $0.311,\,0.182,\,0.268,\,0.273,\,0.202$ at $j=20,40,80,160,320$ — mean $0.247$, no trend, scatter entirely from the wander of the integer $J$ inside a layer $\sim2.7$–$6.8$ wide. **Fable's $C_{\rm fold}\approx0.21$ STANDS**, and the closed form now says *why* it is near $0.2$: it is $\mathrm{Ai}(0)\kappa^{1/4}/(2\cdot2^{1/8})$ with $\kappa\approx2.2$. Deriving $\kappa$ in closed form needs the dihedral-angle expansion at the flat tetrahedron, which I did not do — NOT CERTIFIED.

**$c_0$.** Exact Racah, mpmath dps 60:

| $j$ | 10 | 20 | 40 | 50 | 80 | 100 | 160 |
|---|---|---|---|---|---|---|---|
| $D_j$ | $2.693749$ | $3.983619$ | $5.370362$ | $6.217698$ | $7.763797$ | $8.602899$ | $10.671706$ |
| $D_j-0.8607\sqrt j$ | $-0.028$ | $+0.134$ | $-0.073$ | $+0.132$ | $+0.065$ | $-0.004$ | $-0.215$ |

Mean of the seven residuals: $+0.0015$. **So $c_0=0$ to within the oscillation, whose amplitude is $0.22$: $D_j=0.8607\sqrt j+O(1)$ with the $O(1)$ having zero mean, not a constant.** The oscillation is Y-0144's period-3 structure, and it is not decaying over $10\le j\le160$ — so "$D_j=0.8607\sqrt j+c_0+o(1)$" is the wrong shape; the right one is $D_j=0.8607\sqrt j+\varpi(j)$ with $\varpi$ bounded, mean zero, period 3 in the sign.


---

## §2 · The quartic — the superrevival is a Pearcey function, and it is arithmetic mod 4

*`bf-r6-pearcey.py`, `bf-r6-superrevival.py`. Fable said in Round 5 that she is deriving this; here is my version, with the four numbers that decide it. Where we agree I say so; the parts I expect to be new are the singulant $-\tfrac i{16}$, the régime constant $48$, and the mod-4 Boolean.*

### 2.1 The exact envelope: a Pearcey function at complex $Y$ (DERIVED-HERE)

Expand $t/2n^2$ about $\bar n$ with $s=n-\bar n=\sigma u$ and **reduce every coefficient modulo $2\pi$ before summing** (legitimate: $s,s^2,s^3,s^4\in\mathbb Z$; this is the step `poissonAiry` gets half-right, §0.4):
$$\frac{t}{2n^2}=\text{const}+C_1s+C_2s^2+C_3s^3+C_4s^4-\cdots,\quad C_1=-\frac{t}{\bar n^3},\ C_2=\frac{3t}{2\bar n^4},\ C_3=-\frac{2t}{\bar n^5},\ C_4=\frac{5t}{2\bar n^6}.$$
At $t=T_{\rm rev}=\tfrac43\pi\bar n^4$: $C_2\equiv2\pi\equiv0$ and $C_3=-\tfrac{8\pi}{3\bar n}\ne0$ — the cubic survives, hence **Airy**. At $t=T_{\rm sr}=\pi\bar n^5$: $C_3=-2\pi\equiv0$ — *that is what makes $T_{\rm sr}$ the superrevival* — and the leading survivor is the quartic,
$$\beta_4(T_{\rm sr})=C_4\sigma^4=\frac{5\pi\sigma^4}{2\bar n}\qquad\text{versus}\qquad\beta_4(T_{\rm rev})=\frac{10\pi\sigma^4}{3\bar n^2},\qquad\frac{\beta_4(T_{\rm sr})}{\beta_4(T_{\rm rev})}=\frac{3\bar n}{4}.$$
So the quartic is $\tfrac34\bar n$ times stronger at the superrevival than at the revival — the single fact that makes the two clocks different objects.

The envelope is then $I_4(\alpha,\delta;\beta_4)=\tfrac1{\sqrt{2\pi}}\int e^{-u^2/2+i(\alpha u+\delta u^2+\beta_4u^4)}du$, and the substitution $v=\beta_4^{1/4}u$, absorbing the Gaussian as $-\tfrac{u^2}2=i\big(\tfrac i2\big)u^2$, gives **exactly**

> $$\boxed{\ I_4(\alpha,\delta;\beta_4)=\frac{1}{\sqrt{2\pi}\;\beta_4^{1/4}}\;\mathrm{Pe}\!\left(\frac{\alpha}{\beta_4^{1/4}},\ \frac{\delta+\tfrac i2}{\beta_4^{1/2}}\right),\qquad \mathrm{Pe}(X,Y)=\int_{-\infty}^{\infty}e^{i(v^4+Yv^2+Xv)}dv.\ }$$

**Fable's claim is right, and the Gaussian is not an obstruction: it is a fixed imaginary shift of the cusp's $Y$-axis, $\operatorname{Im}Y=\tfrac12\beta_4^{-1/2}$.** The packet's ray runs at constant imaginary height above the real $(X,Y)$ plane, so it **never touches the caustic** $27X^2+8Y^3=0$ (which requires real $X,Y$); the cusp is smoothed, and the smoothing parameter is exactly $\operatorname{Im}Y$. MEASURED against direct quadrature of $I_4$ at five points $(\alpha,\delta,\beta_4)$: agreement $1.3\times10^{-5}$ to $2.9\times10^{-3}$, the discrepancy being the truncation of the (only conditionally convergent) $\mathrm{Pe}$ integral, not the identity.

### 2.2 What replaces $\mathrm{Ai}'/\mathrm{Ai}=-\lambda$ (DERIVED-HERE)

| | revival ($A_2$, fold) | superrevival ($A_3$, cusp) |
|---|---|---|
| special function | $\mathrm{Ai}(z)$, $z$ **real** | $\mathrm{Pe}(X,Y)$, $X$ real, $Y$ **complex** |
| defining ODE | $\mathrm{Ai}''=z\,\mathrm{Ai}$ | $4i\,\mathrm{Pe}_{XXX}-2iY\,\mathrm{Pe}_X+X\,\mathrm{Pe}=0$ |
| second relation | — | the heat equation $\mathrm{Pe}_Y=-i\,\mathrm{Pe}_{XX}$ |
| caustic | $z=0$ | $27X^2+8Y^3=0$ |
| peak law | $\mathrm{Ai}'(z^*)/\mathrm{Ai}(z^*)=-\lambda$ (real) | $\operatorname{Re}\big(\mathrm{Pe}_X/\mathrm{Pe}\big)=0$ (one real equation on a complex function) |
| peak position | $\alpha^*=-3\beta_3+54\beta_3^3-\cdots\ne0$ | $\alpha^*\equiv0$ **exactly** |

The ODE follows from $\int\frac{d}{dv}e^{i(v^4+Yv^2+Xv)}dv=0$ with $\int v^ke^{i\phi}dv=i^{-k}\partial_X^k\mathrm{Pe}$.

**The peak law degenerates, and that is the physics.** With only *even* powers of $u$ beside $\alpha u$, the substitution $u\to-u$ gives $I_4(-\alpha,\delta,\beta_4)=I_4(\alpha,\delta,\beta_4)$: the superrevival envelope is **even in $\alpha$**, so its peak sits exactly at $\alpha=0$ — exactly at $T_{\rm sr}$. There is no analogue of the revival's shift to $0.994\,T_{\rm rev}$. *The revival peak is early; the superrevival peak is on time.* What replaces the peak law is therefore a **height law**,
$$|I_4|_{\max}(\beta_4)=\big|\mathrm{Pe}(0,\tfrac i2\beta_4^{-1/2})\big|\big/\big(\sqrt{2\pi}\,\beta_4^{1/4}\big)=\Big|\sum_{k\ge0}G_k\beta_4^k\Big|,\qquad G_k=\frac{i^k(4k-1)!!}{k!},$$
$G_0=1$, $G_1=3i$, $G_2=-\tfrac{105}2$, $G_3=-\tfrac{10395}6i$, … — the exact analogue of $D_k$.

### 2.3 The analogue of the $-\tfrac1{54}$ singulant: $\chi_4=-\tfrac{i}{16}$, on the **imaginary** axis (DERIVED-HERE, MEASURED to 13 digits)

Saddles of $-\tfrac{u^2}2+i\beta_4u^4$: $u=0$ (value $0$) and $u^2=-i/4\beta_4$ (value $i/16\beta_4$). The action gap is $\Delta S=\tfrac{i}{16\beta_4}$, so the companion is $e^{i/16\beta_4}=e^{-\chi_4/\beta_4}$ with
$$\boxed{\ \chi_4=-\frac{i}{16}\ }\qquad\Longrightarrow\qquad G_k\ \sim\ S_4\,(16i)^k\,\Gamma(k),\quad S_4=\frac{1}{\pi\sqrt2}.$$
MEASURED on the exact $G_k$: $G_k/((16i)^k\Gamma(k))=0.21680,\ 0.22090,\ 0.22298,\ 0.22403,\ 0.22455,\ 0.22473$ at $k=5,10,20,40,80,120$ (imaginary part exactly $0$), and Richardson-6 at $k=100$ gives $S_4=0.22507907903928$ against $\tfrac1{\pi\sqrt2}=0.22507907903928$ — **fourteen digits**. Subleading: Richardson-5 gives $b_1^{(4)}=-0.1875=-\tfrac3{16}$ **exactly**, so
$$G_k=\frac{(16i)^k\Gamma(k)}{\pi\sqrt2}\Big(1-\frac{3/16}{k-1}+\cdots\Big).$$

**The qualitative difference from the revival, and it is the whole point.** Theorem A.2's pole sits on the **negative real** $\beta^2$ axis: the maximiser is Borel-summable for real $\beta$ and *carries no exponentially small ambiguity* — "a floor, not a Stokes jump". The quartic pole sits on the **imaginary** $\beta_4$ axis: real $\beta_4$ is an **anti-Stokes direction**, the coefficients $G_k$ rotate by $\pi/2$ per step ($G_k\propto i^k$ up to a real sequence), the series is only marginally summable, and any imaginary part in $\beta_4$ — i.e. any damping of the ladder — produces a Stokes jump at once. **The revival is protected from its own exponentially small companion; the superrevival is not.** Ω₄″'s ring is the fold's; the cusp has its own, with $\chi_4=-\tfrac i{16}$ and $S_4\in\tfrac1{\pi}\mathbb Q\sqrt2$ — note $S_4$ has **no $e$**, because the height law involves no composition (§1 Q32′).

### 2.4 The régime boundary: a number

$|I_4(0,0;\beta_4)|^2=(1-\tfrac{105}2\beta_4^2)^2+9\beta_4^2+O(\beta_4^4)=1-96\beta_4^2+O(\beta_4^4)$, so
$$\boxed{\ \big|I_4\big|_{\max}=1-48\beta_4^{\,2}+O(\beta_4^4)\ }$$
— the quartic's effect on the envelope **height** is *quadratic* in $\beta_4$, with coefficient $48$. Hence the cubic (Airy) description is accurate to relative $\epsilon$ iff $\beta_4\le\sqrt{\epsilon/48}$. MEASURED: $|I_4|=0.998844372$ at $\beta_4=0.005$ against $1-48\beta_4^2=0.998800$; $0.986355$ at $0.02$ against $0.98080$; $0.952487$ at $0.05$; $0.811234$ at $0.25$.

| tolerance $\epsilon$ | $\beta_4\le$ | $\sigma\le$ at $T_{\rm rev}$ | $\sigma\le$ at $T_{\rm sr}$ |
|---|---|---|---|
| $10^{-2}$ | $0.01443$ | $0.1927\,\sqrt{\bar n}$ | $0.2070\,\bar n^{1/4}$ |
| $10^{-3}$ | $0.00456$ | $0.1445\,\sqrt{\bar n}$ | $0.1553\,\bar n^{1/4}$ |
| $10^{-4}$ | $0.00144$ | $0.1084\,\sqrt{\bar n}$ | $0.1164\,\bar n^{1/4}$ |

**The number that settles which $(\bar n,\sigma,t)$ needs Pearcey rather than Airy.** At the revival the bound is $\sigma\le0.1927\sqrt{\bar n}$ — $4.72$ at $\bar n=600$, $2.36$ at $\bar n=150$ — so every packet the instrument would draw at the revival is safely Airy, and Fable's $\bar n=150,\sigma=2$ test sits just inside (which is why her $|A|$ error there is $10^{-2}$ and not worse). **At the superrevival the bound is $\sigma\le0.2070\,\bar n^{1/4}$ — $1.02$ at $\bar n=600$, $0.65$ at $\bar n=100$, $1.65$ at $\bar n=4000$: below $\bar n=800$ no packet of width $\sigma\ge1.1$ has an Airy superrevival at all.** The superrevival is a cusp for every packet this lab can build. And the cusp is *fully* developed ($\operatorname{Im}Y\le1$, i.e. $\beta_4\ge\tfrac14$) once $\sigma\ge(\bar n/10\pi)^{1/4}=0.7511\,\bar n^{1/4}$: $0.99$ at $\bar n=30$, $1.34$ at $\bar n=100$, $2.09$ at $\bar n=600$, $3.72$ at $\bar n=6000$.

MEASURED against the law: $|I_4|=0.9999520791$ at $\beta_4=10^{-3}$ (law $0.9999520$), $0.9995741572$ at $3\times10^{-3}$ ($0.9995680$), $0.9957643852$ at $10^{-2}$ ($0.9952000$), $0.9037880732$ at $0.1$ ($0.5200$ — the law has long since expired).

### 2.5 And the superrevival is arithmetic — modulo 4, not modulo 6 (DERIVED-HERE)

Theorem A.5's ceiling is a Boolean about the *cubic* coefficient ($b\mid6$, Fermat/Korselt). At $T_{\rm sr}$ the cubic is dead and the **quadratic** is the survivor. Reducing $C_2$ modulo $2\pi$ at $t=T_{\rm sr}=\pi\bar n^5$:
$$C_2=\frac{3\pi\bar n}{2}\ \equiv\ \frac{\pi}{2}\,\big(3\bar n\bmod4\big)\pmod{2\pi},\qquad C_1=-\pi\bar n^2\equiv\begin{cases}0&\bar n\ \text{even}\\ \pi&\bar n\ \text{odd}\end{cases}$$
so, with $\delta=C_2^{\rm red}\sigma^2$:

| $\bar n\bmod4$ | $3\bar n\bmod4$ | $\delta=C_2^{\rm red}\sigma^2$ | $\alpha=C_1^{\rm red}\sigma$ | residual phase |
|---|---|---|---|---|
| $0$ | $0$ | $0$ | $0$ | $1$ — the **pure cusp** |
| $1$ | $3$ | $\tfrac32\pi\sigma^2$ | $\pi\sigma$ | $(-1)^se^{3\pi is^2/2}$, period 4 |
| $2$ | $2$ | $\pi\sigma^2$ | $0$ | $(-1)^{s^2}=(-1)^s$ — an $\alpha$-shift by $\pi$ |
| $3$ | $1$ | $\tfrac12\pi\sigma^2$ | $\pi\sigma$ | $(-1)^se^{\pi is^2/2}$, period 4 |

**MEASURED (`bf-r6-superrevival2.py`), and it is exact.** Model: the Poisson sum of *chirped Pearcey* envelopes, $|A|=\big|\sum_jI_4(\alpha-2\pi\sigma j,\delta,\beta_4,\epsilon_5,\epsilon_6)\big|\big/\sum_je^{-2\pi^2\sigma^2j^2}$ with $\epsilon_5=-3\pi\sigma^5/\bar n^2$, $\epsilon_6=7\pi\sigma^6/2\bar n^3$; exact ladder at $t=\pi\bar n^5$ in mpmath at 30 digits, $\sigma=1$:

| $\bar n$ | $\bar n\bmod4$ | $\beta_4$ | $|A|$ exact | model | rel. error |
|---|---|---|---|---|---|
| 60 | 0 | $0.1309$ | $0.835769489$ | $0.835759308$ | $1.2\times10^{-5}$ |
| 100 | 0 | $0.0785$ | $0.934096585$ | $0.934097475$ | $9.5\times10^{-7}$ |
| 200 | 0 | $0.0393$ | $0.964301981$ | $0.964301966$ | $\mathbf{1.6\times10^{-8}}$ |
| 400 | 0 | $0.0196$ | $0.986740907$ | $0.986740907$ | $\mathbf{1.4\times10^{-10}}$ |
| 62 | 2 | $0.1267$ | $0.130676216$ | $0.130686404$ | $7.8\times10^{-5}$ |
| 63 | 3 | $0.1247$ | $0.556452958$ | $0.556451874$ | $2.0\times10^{-6}$ |
| 401 | 1 | $0.0196$ | $0.707606252$ | $0.707488395$ | $1.7\times10^{-4}$ |

Ten digits at $\bar n=400$. **The superrevival envelope is a Poisson sum of Pearcey functions, and this is the quartic's Theorem A.4.**

**And the ceiling is a mod-4 Boolean.** Sixteen consecutive $\bar n$, $\sigma=1$:

| $\bar n$ | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 |
|---|---|---|---|---|---|---|---|---|---|
| $\bar n\bmod4$ | 0 | 1 | 2 | 3 | 0 | 1 | 2 | 3 | 0 |
| $|A(T_{\rm sr})|$ | $\mathbf{0.964302}$ | $0.712637$ | $\mathbf{0.045602}$ | $0.652194$ | $\mathbf{0.964984}$ | $0.712243$ | $\mathbf{0.044640}$ | $0.653549$ | $\mathbf{0.965667}$ |

> **The superrevival hears the ladder modulo 4.** $\ \bar n\equiv0$: the height is the **pure cusp** $|I_4(0,0;\beta_4)|$ to $10^{-8}$, and $\to1$ as $\bar n\to\infty$. $\ \bar n\equiv2$: the residual $(-1)^s$ shifts $\alpha$ by $\pi$, i.e. exactly **half-way between two Poisson aliases** — maximal destructive interference, and the superrevival is all but **extinct** ($0.0456$, and falling: $0.0446$, $0.0437$, $0.0428$ at $206,210,214$). $\ \bar n$ odd: an intermediate quadratic Gauss phase of period 4, $0.7126$ for $\bar n\equiv1$ and $0.6522$ for $\bar n\equiv3$ — and these two are **not** equal, because conjugation would flip $\beta_4$ as well as $\delta$, and $\beta_4>0$ in both.

The revival's arithmetic is Fermat's little theorem for the cube ($b\mid6$, Theorem A.5); the superrevival's is the **quadratic** residue at the single modulus $4$, and it is a property of $\bar n$ rather than of the comb spacing. One mechanism for both: *reduce each Taylor coefficient of the level expansion modulo $2\pi$ before summing, then Poisson-sum what is left.* Ω₅ has a clause for the cubic ceiling; it needs one for the quartic:

> **Ω₅(4) (proposed).** *For a Gaussian packet at $t=T_{\rm sr}$ the height is $\big|\sum_jI_4(\alpha_j,\delta,\beta_4)\big|/\theta$ with $(\alpha,\delta)=\big(\pi\sigma\cdot[\bar n\ \mathrm{odd}],\ \tfrac\pi2\sigma^2(3\bar n\bmod4)\big)$; it attains the pure-cusp ceiling iff $4\mid\bar n$ and is extinguished iff $\bar n\equiv2\pmod4$. Falsifier: any $\bar n\equiv2\pmod4$ with $|A(T_{\rm sr})|>0.2$ at $\sigma=1$.*


---

## §3 · Corpus bridges

*Memory discipline as before: two subagents, one file each, grep first, ≤400-line chunks, ≤2 KB back.*

### 3.1 The corpus's open UN-002 is the Jordan problem I just closed in characteristic 2 — by a method it does not have
**`GENERAL MATHEMATICS LIBRARY.md`, L-0237 (ll. 860–874), the ledger line at l. 579, and UN-002 at l. 1037.** L-0237 is the Gauss-period collapse: $P_{p,e}(x)\equiv(x-m)^e\pmod p$, so the Cayley operator is $m\cdot I+\text{nilpotent}$, with $v_p(\mathrm{disc})=e-1$ and the whole $\mathrm{Cay}(\mathbb F_p,C)$ spectrum $\equiv m$ at the ramified prime; the ledger at l. 579 records the correction *"the nilpotent-Laplacian Jordan form is $J_7\oplus(e-1)J_6$"*, an exact block partition for a nilpotent $\mathbb F_p$ Laplacian; and l. 1037 lists **UN-002 "(cyclotomic Cayley Jordan/critical groups)" as open and re-queued**.

That is exactly the species of Theorem F.2. On the $\mathbb F_2$ shell, $\Lambda=E+D$ with $D=a\partial_x+b\partial_y$ a **derivation** and $D^2=0$, and §1 Q33 gives the block partition **in closed form for every degree**: $n\,J_1\oplus\tfrac{2n(n^2-1)}3J_2$ on degree $2n-2$, and $\tfrac12\binom{N+3}3\,J_2$ (a free involution) on every odd degree. The bridge is the *method*, and it is one the corpus's character-theoretic route cannot reach: **when the operator is $m\cdot I+N$ with $N$ a derivation of a polynomial ring in characteristic $p$, the Jordan type is obtained by inverting one variable, changing to coordinates in which the derivation is $a\partial_x$, and descending over the Frobenius subring $\mathbb F_p[x^p]$ — no characters, no Gauss periods.** L-0237's nilpotent is built from characters; F.2's is built from a derivation; both give $m\cdot I+N$ with $N^2=0$, and the second has a complete answer. Transferable number: for the corpus's $J_7\oplus(e-1)J_6$ the block *count* is $e$ and the *free* case would need rank $=$ nullity; my odd-degree $\Lambda$ is the free case and its count is exactly half the dimension, $\tfrac12\binom{N+3}3$.

### 3.2 The corpus's own semiclassical envelope is violated in the fold layer, by $j^{1/6}$
**`YMD-DISK-01 COMPENDIUM.md`, Y-0154 (ll. 657, 659); Y-0143 (l. 613) and Y-0144 (ll. 617, 619); the open commissions at ll. 647, 665, 689, 817, 819.** Y-0154 seats the uniform large-$3nj$ semiclassical theorem as *used*: *"allowed regime envelope $\sim j^{-3/2}$, forbidden regime exponentially small in spin — both verified vs exact $6j$/$9j$, 41 sign flips, $\sup|9j|=0.0511$"*, citing Ponzano–Regge / Roberts / Dupuis–Livine / Bonzom–Livine, and names the residual gap as *"a non-cancellation / algebraic-lower-bound lemma"*. Y-0143 l. 613 and l. 819 twice commission *"a uniform fold/Airy asymptotic … to upgrade $\rho\to0$ from numerical to theorem."*

The bridge is a number. The fold law $|6j|_{\rm fold}\asymp C_{\rm fold}j^{-4/3}$ **exceeds the corpus's own allowed-regime envelope $j^{-3/2}$** by the factor $j^{1/6}$: $160^{1/6}=2.33$, $320^{1/6}=2.61$. So Y-0154's envelope is not uniform — it fails precisely in the layer of width $\Delta J\approx0.45\,j^{1/3}$ around $J_c=\sqrt2(j+\tfrac12)-\tfrac12$, and that layer is where the "non-cancellation lemma" it asks for must live. The corpus has the allowed and the forbidden regimes; the fold *between* them is the missing third, and §1 Q34 supplies its exponent ($-4/3$, derived as $j^{1/6}/j^{3/2}$), its width ($0.40$–$0.50\,j^{1/3}$) and its constant ($0.194$–$0.205$, direct reading $0.247\pm0.06$).

**And a correction to the corpus, by number.** Y-0143 l. 609 lists $D_{50}=6.2177$, $D_{100}=8.6029$, $D_{200}=12.1501$, $D_{400}=17.1244$, $D_{800}\approx27.4$ with the ratio column $0.879,0.860,0.859,0.856,0.866$. Independent exact Racah at 60 digits reproduces $D_{50}=6.217698$ and $D_{100}=8.602899$ — **the compendium is right where I can check it**. But $0.866\times\sqrt{800}=24.50\ne27.4$: **the entry's own two numbers for $j=800$ disagree by $12\%$**, and since the ratio column is corroborated at $j=50,100$ and my own $D_j/\sqrt j$ never leaves $[0.844,0.891]$, the reliable value is $D_{800}\approx24.50$ and "$27.4$" should be struck.

### 3.3 The gain $\kappa$ is the corpus's own Mahler sup-norm, and its machinery applies verbatim
**`GENERAL MATHEMATICS LIBRARY.md`, L-0086 (l. 369), L-0064 (l. 309), L-0209 (l. 609).** L-0086: the piecewise-algebraic Mahler staircase, *"$k\mapsto m(P-k)$ is real-analytic between consecutive critical values of $P|_{S^1}$"*; L-0064 states the stabilisation threshold in the sup norm $M=\max_{|z|=1}|P|$; L-0209 gives Salem/Perron $M(g)=1.556030\ldots$.

$\max_x\big|\sum_mp_me(\theta m^3+xm)\big|$ **is** $\max_{|z|=1}|P(z)|$ for the polynomial $P(z)=\sum_mp_me(\theta m^3)z^m$ — the corpus's $M$, for a family of polynomials with unimodular coefficients indexed by one real parameter $\theta$. So Ω₅'s floor is the minimum of the corpus's sup norm over the cubic-phase family, and L-0086's analyticity in the *level* $k$ between critical values of $P|_{S^1}$ is the statement that makes $\theta\mapsto\max_x|S|$ piecewise smooth — which is what licenses the claim that $\inf$ over rationals converges to $\inf$ over reals (§1 Q30). Number: $\kappa_\infty(129)=2.2203$ says $M=2.2203\sqrt{129}=25.22$ for a degree-128 polynomial with $129$ unimodular coefficients, against the trivial bracket $\sqrt{129}=11.36\le M\le129$; the corpus's staircase says $M$ moves analytically in $\theta$ except at finitely many critical configurations, and the minimiser $78/865$ is one such configuration.

### 3.4 What I looked for and did not find
No Pearcey, caustic, catastrophe, Airy, Stokes, Borel, resurgence, Salem–Zygmund, trigonometric-polynomial-supremum, Weyl-sum, unipotent, Weitzenböck, invariant-ring, Ehrhart, polytope, octahedral-number, KAK, Cartan-decomposition, controllability or gate-count content in either file (the "cusp" hits are cusp *forms*; the "octahedral" hit is the binary octahedral group; "Jordan" is Jordan's inequality). One genuine near-neighbour I did not use for lack of time: **Y-0165 (l. 757)**, the SMR Commensurability Theorem — *"$|\hat L_S(m)|>0$ iff $n\mid m$ or $m\mid n$, $=0$ iff $\gcd(n,m)=1$, by Weyl equidistribution; $\gcd=1$ suppressed to $\sim10^{-16}$"* — is structurally the same shape as both the deaf comb and §2.5's mod-4 extinction: *a Fourier amplitude extinguished by a divisibility condition*. The difference is quantitative and worth one line: Y-0165's suppression is exact cancellation ($10^{-16}$); the superrevival's $\bar n\equiv2\pmod4$ extinction is destructive interference at half an alias spacing, $0.0456/0.9643=4.7\times10^{-2}$, not zero. Two mechanisms, one silhouette.

---

## §4 · Questions Q36–Q41 for Fable

**Q36 (DEEPEN — the cusp's ring).** §1 Q32′ replaced Ω₄′ by Theorem Ω₄″: everything stationarity-defined at the fold lies in one ring generated by $h$, with singulant $-\tfrac43$ in $w$. Is there a cusp analogue? Define $\alpha^*_{\rm sr}(\delta,\beta_4)$ by $\operatorname{Re}\big(\mathrm{Pe}_X/\mathrm{Pe}\big)=0$ at $\delta\ne0$, expand in $\beta_4$, and report (i) its singulant — I predict $-\tfrac i{16}$ again — (ii) its Stokes constant, and (iii) its $b_1$. My $b_1^{(4)}=-\tfrac3{16}$ for the height is the number to beat. *Answerable with three numbers.*

**Q37 (LOCATE — the extinction law).** §2.5: at $\bar n\equiv2\pmod4$, $\sigma=1$, the superrevival height is $0.045602,\,0.044640,\,0.043722,\,0.042846$ at $\bar n=202,206,210,214$. The mechanism I claim is destructive interference at exactly half a Poisson alias spacing ($\alpha=\pi$), which predicts a suppression $\sim e^{-\pi^2\sigma^2/2}$ relative to the pure cusp. Measure the exponent over $\sigma\in\{0.6,0.8,1.0,1.2,1.5\}$ at $\bar n=202$ and say whether it is $\pi^2/2=4.9348$. *Answerable with one exponent.*

**Q38 (BROADEN — the census as a function of one knob).** §0.5 shows the census of a stretched three-mode state is the level set $G(r)=u$, $G=|a_+a_-|/a_0^2$, $u=|c_0|^2/4|c_+c_-|$. So the whole census is a function of the single real $u$, and it jumps at the critical values of $G$. For $(3d_{+2},4p_{+1},5s)$: give the complete bifurcation diagram — every critical value of $G$, and the census on each interval of $u$. I have two points on it: $u=\tfrac14$ (the print's state, $c=(1,1,1)$) gives $\mathbf{10}$; and every $u$ from $\approx60$ to $\approx10^{10}$ gives $\mathbf8$ — the window having broken into two components pinned to the $4p$ nodes at $5.527864$ and $14.472136$, which **never close**, because $\Phi=-4|c_+c_-a_+a_-|<0$ at a node of $a_0$ for every $c_0$. So the census does not go to zero as the middle mode dominates; it goes to $8$ and stays there while the components shrink like $1/|c_0|$. The critical values of $G$ are where the count changes. *Answerable with the list of critical values of $G$.*

**Q39 (LOCATE — the rate, properly).** My convergent lower bound is $\ge12446$ events per period ($\Delta t\le3.635$) and still climbing $35\%$ per refinement; the $\tau$-root count per period is settled at $261$. Using the $\theta$-eliminated quadratic $X+Yu+Zu^2$ with its two beats of $94/7200$, get the converged event count — either by continuing the branches in $r$ (each of the $261$ branches contributes one event per crossing of $|w_0|=1$) or by a proper 2-D certified root count. *Answerable with one integer.*

**Q40 (DEEPEN — the moment ladder).** §1 Q30 replaced Ω₅(2)'s $c_0=\tfrac12$ by $\kappa^2=\ln T+o(1)$ and identified the mechanism: $\kappa^2\ge k$ while the $2k$-th moment of the cubic Weyl sum is diagonal-dominated, with $k_{\max}\approx1.15\ln T$ measured. Prove $\kappa^2\ge k$ for $k\le c\ln T$ by bounding the off-diagonal (Vinogradov mean value / $\ell^2$ decoupling gives $M_{2k}\ll_\epsilon T^{k+\epsilon}$ for $k\le3$ and $T^{2k-6+\epsilon}$ beyond), and give $c$. **Predict first, then measure:** the largest $k$ with $M_{2k}\ge\tfrac12k!T^k$ at $T=257$. My prediction: $k=6$. *Answerable with one integer and one constant.*

**Q41 (BROADEN — the defect on the ladder).** Theorem B.3's fourth control is an $l$-dependent phase; its LADDER analogue is the quantum defect itself, $E_n=-\tfrac12(n-\mu)^{-2}$. Redo both ceilings with $\mu\ne0$: (i) the cubic ceiling — for a comb of spacing $d$, $a/b=4d^3/3(\bar n-\mu)$ is no longer rational, so "deaf" becomes a Diophantine-approximation condition rather than a divisibility; give the width of the $\mu$-window in which $\mathcal A>0.99$ at $\bar n=36000$, $d=30$. (ii) the quartic ceiling — $T_{\rm sr}=\pi(\bar n-\mu)^5$ and $C_2^{\rm red}=\tfrac32\pi(\bar n-\mu)\bmod2\pi$, so the mod-4 Boolean becomes a condition on $\bar n-\mu$ mod $\tfrac43$; give the $\mu$ that maximises the superrevival at $\bar n=202$. *Answerable with two numbers, and it is the one question that puts the fourth control on the LADDER register instead of the shell.*

---

## NOT CERTIFIED

- **Q31's rate.** The event count is a monotone lower bound that has not converged: $7278\to9254\to12446$ over three refinements. $\Delta t\le3.635$ is real; the limit is not known. The naïve two-curve intersection count *diverges* ($34725\to62143\to83948$) and is reported only as a warning.
- **Q34's $C_{\rm fold}$.** The closed form $C_{\rm fold}=\mathrm{Ai}(0)\kappa^{1/4}/(2\cdot2^{1/8})$ is derived, but $\kappa$ is measured ($2.0$–$2.5$ from a two-parameter fit whose $\ell$-grid hit its own edges) rather than computed from the dihedral-angle expansion. $C_{\rm fold}\in[0.194,0.205]$ is therefore a one-digit statement. The direct reading $0.247$ (mean of five $j$) and the fit disagree by $20\%$; the layer is only $\sim5$ integers wide and the integer $J$ wanders inside it.
- **Q34's $c_0$.** "Mean zero over seven $j$" is $+0.0015$ against an oscillation amplitude $0.22$; that is consistent with $c_0=0$ and with $|c_0|\le0.03$, and no more.
- **Q35 beyond $n=3$.** $K_{\min}(2)=2$, $K_{\min}(4)=8$, $K_{\min}(5)=13$ follow from the coset argument, which is proved only in the sense that it reproduces the measured rank $\min(4K-1,16)$ at $n=3$ on seven values of $K$. The $\alpha$-schedule was not computed.
- **§2.5's Ω₅(4).** Certified at $\sigma=1$ on ten $\bar n$ plus sixteen consecutive $\bar n$, to $10^{-8}$ at $\bar n=200$ and $10^{-10}$ at $\bar n=400$. Not tested at other $\sigma$, and the $\epsilon_5,\epsilon_6$ corrections were included empirically rather than resummed — at $\bar n=60$ the model still carries $1.2\times10^{-5}$, which is $\epsilon_7$.
- **§2.3's $b_1^{(4)}=-\tfrac3{16}$** is a Richardson-5 value that landed on $-0.1875$ to all printed digits; I did not derive it from a dictionary as I did $b_1$ and $b_1'$ in Q32.
- **§0.5's counter-example is certified; its generality is not.** I show one state on which `stretchedCensus` prints $0$ for $8$, and the mechanism (the window collapsing onto a node of the middle mode) is exact. The claim that *every* failure of the root finder is of this type is not proved.
- **§0.6's cross-matching.** I show the matcher's tolerance ($0.6$) is $5.7\times$ the smallest observed genuine root separation ($0.1055$) and that the point count does not converge in $n_\theta$ at $t=0$ ($63,67,71,72$). I did **not** exhibit an actual cross-match; the two facts are consistent with pure resolution loss.
- **Q30's $\kappa_\infty$.** Computed as $\inf_{b\le8T}$, which is itself still falling at $T=17,33,65$ by $0.1\%$–$1.1\%$ between $8T$ and $16T$. The trend of $\kappa^2-\ln T$ ($+0.503\to+0.070$) is far larger than that drift, so the refutation stands; the limit values do not.
- **Corpus.** I read two files through subagents under the memory discipline and did not open the finite-field handoff or the dossier this round; §3.1's UN-002 reading rests on the ledger line and the open-problem list, not on the L-0237 entry read in full.
- No GPU ran. Nothing under `lab/` or `tests/` was touched. No server, no port, no git.

---

*Round 6 closes with five dead things in the instrument, two dead constants in the print — Fable's $c_0=\tfrac12$ and her $\lceil(2n^2-2)/7\rceil$ — one dead conjecture of my own (Ω₄′), and one new arithmetic: the superrevival hears the ladder modulo 4. The rival's job this round was to find where a régime boundary had been asserted and never tested. There were four.*
