# Knotted nodal lines of hydrogen in the λWAVES register ($n \le 7$)

Commissioned by Josh. Author: Claude (the proving lab), 2026-10-24. Everything here is recomputed by `knots.py` (stages `final` then `thickness`, about 17 minutes on two threads), which writes `knots.json` and the five figures (`fig_trefoils_3d.png`, `fig_trefoil_projection.png`, `fig_hopf_3d.png`, `fig_radial_profile.png`, `fig_table_knots.png`). Tags: KNOWN (with its source), DERIVED-HERE (proof given), MEASURED (the number comes from `knots.py`), REFUTED, UNVERIFIED.

## 0. Findings

1. REFUTED, from the brief: "for every complex polynomial $P$ of degree $\le n-1$, $P e^{-r/n}$ lies in level $n$". Corrected line: $P e^{-r/n}$ lies in level $n$ if and only if $P$ is harmonic and homogeneous of degree exactly $n-1$ (Proposition 2). The counterexample is $P = 1$ at $n = 2$. The dimension count also rules it out: degree $\le 6$ polynomials span 84 dimensions, level 7 has 49, and only 13 of them have this form. So the Milnor trefoil polynomial $(r^2-1+2iz)^3 - 4(x+iy)^2(r^2+1)$, which has degree 6 but is not homogeneous, times $e^{-r/7}$ is not a hydrogen state. That route is closed. Berry's construction is a different one: a second-order zero loop, perturbed (§2).
2. MEASURED: Berry's $n = 7$ trefoil (his Fig. 2 state), rebuilt from his printed constants and converted to the app's labels, has one closed nodal component in the knot's torus. It shows 3 crossings in five projections, Alexander polynomial $t^2-t+1$, braid word $\sigma_1^{-3}$, and every phase winding $+1$. The nearest other nodal line is 18.34 bohr away.
3. DERIVED-HERE and MEASURED: Berry's sentence "the elementary link, requiring $n \ge 6$, and the trefoil knot, requiring $n \ge 7$" bounds his recipe, not hydrogen. His recipe puts all the twist in the loop's angular momentum $m$ and perturbs with the spherically symmetric $\psi_{n00}$. If the twist is carried instead by a perturbation with its own $m'$ (Proposition 6), a Hopf link and a trefoil appear at $n = 4$ and the cinquefoil at $n = 5$; $7_1$ appears at $n = 6$; $9_1 = T(2,9)$ and $T(3,7)$ appear at $n = 7$. All are verified on the expanded superpositions (§5). Level 2 holds no knot and no link (Proposition 4); level 3 is open. Novelty is UNVERIFIED beyond the papers in §8.
4. MEASURED: Berry's eq. (4) prints the odd pair in the wrong order for his printed $b$. The number $b = 0.0517186$ satisfies his condition (3) for $\psi_{632} + b\,\psi_{652}$; for $\psi_{652} + b\,\psi_{632}$ the condition gives $b = 19.3354 = 1/0.0517186$. His $a$, $r^*$ and every trefoil constant reproduce to all printed digits.

## 1. The app's convention, and what was checked

- KNOWN (lab/hydrogen.js header and code): $\psi_{nlm} = R_{nl}(r)\,Y_l^m$, with $R_{nl} = N_{nl}\,e^{-\rho/2}\rho^l L^{2l+1}_{n-l-1}(\rho)$, $\rho = 2r/n$, and the modern Laguerre normalisation. $Y_l^m$ is the complex spherical harmonic with the Condon–Shortley phase, and $Y_l^{-m} = (-1)^m \overline{Y_l^m}$. Labels are names.js `atomForms(...).typeset`: `7f₃`, `7g₃`, `7h₃`, `7i₃`, `7s₀`, `4d₋₂`. The register is ordered with the 91 labels of $n \le 6$ first and the 49 of $n = 7$ after them; a preset is `{n, l, m, amp, phase}` per mode, normalised on load (lab/state.js `load`).
- MEASURED: the Python evaluator in `knots.py` agrees with lab/hydrogen.js `psiAt`, run by node on the same coefficients, to a relative 4.5e-15 or better at 2000 random points per delivered state (300 per table row). Every label written to `knots.json` was read back from the app's own `BASIS[...].label`.
- MEASURED: Berry's unnormalised basis is the app's basis divided by $N_{nl}K_{lm}$, where $K_{lm}$ is the $Y_l^m$ norm. That assumes his $P_l^m$ carries the Condon–Shortley phase, as Mathematica's does. His printed $a$ and $b$ reproduce under the modern Laguerre normalisation, which pins that part. The phase cannot be pinned from the paper, and it does not matter. For fixed $m$ it is a common sign on the four loop states, which is the same as $\varepsilon \to -\varepsilon$. Since $\psi_0 \propto e^{im\varphi}$, that is a rotation by $\pi/m$ about $z$; the knot and its chirality are unchanged. Berry's formula evaluated independently (mpmath, 40 digits) matches the converted sum to 1.9e-15 (relative, 400 points per state).
- DERIVED-HERE (reading lab/field.js `cameraBasis`): at the home pose right $= \hat y$, up $= \hat z$, back $= \hat x$, so right $\times$ up $=$ back and the stage is not mirrored. CAMERA › FLIP mirrors it. The handedness reported below is the handedness on screen with FLIP off.
- Sign convention, MEASURED: a crossing is positive when (over direction $\times$ under direction)$\cdot\hat e_{\rm view} > 0$. This is pinned to the Gauss linking integral: both give $-1$ on a test Hopf pair (Gauss $-1.00004$). A right-handed trefoil has writhe $+3$ in a 3-crossing diagram.

## 2. Statements and proofs

Let $H_n$ be the level-$n$ eigenspace of $-\tfrac12\Delta - 1/r$, $E_n = -1/(2n^2)$, $\dim H_n = n^2$.

**Lemma 1** (KNOWN, trivial). Any $\psi \in H_n$ evolves as $e^{-iE_n t}\psi$, so its nodal set is stationary.

**Proposition 2** (DERIVED-HERE). For a complex polynomial $P$ on $\mathbb R^3$, $P e^{-r/n} \in H_n$ if and only if $P$ is harmonic and homogeneous of degree $n-1$. These $P$ are $r^{n-1}Y_{n-1}^m$, $\lvert m\rvert \le n-1$: the $2n-1$ states with $l = n-1$.

**Proof.** Write $g = e^{-r/n}$. Then $\nabla g = -g\hat r/n$ and $\Delta g = g(1/n^2 - 2/(nr))$. So $\Delta(Pg) = g[\Delta P - (2/n)\partial_r P + P/n^2 - 2P/(nr)]$, and $-\tfrac12\Delta(Pg) - Pg/r = E_n Pg$ reduces to $n r\,\Delta P - 2\,r\partial_r P + 2(n-1)P = 0$ on $\mathbb R^3\setminus\{0\}$. Split $P = \sum_d P_d$ into homogeneous parts and use Euler's identity $r\partial_r P_d = dP_d$. The equation becomes $r\,A = B$ with the polynomials $A = n\Delta P$ and $B = -2\sum_d (n-1-d)P_d$. On a ray $x = tu$ ($t > 0$, $\lvert u\rvert = 1$) this reads $tA(tu) = B(tu)$; on the opposite ray it reads $tA(-tu) = B(-tu)$. As polynomials in $t$ this gives $B(su) = sA(su)$ and $B(su) = -sA(su)$ for all real $s$, so $A(su) = 0$. Hence $A \equiv 0$, then $B \equiv 0$, so $P = P_{n-1}$ and $\Delta P = 0$. Conversely, such a $P$ satisfies the equation, and $Pg$ is in $L^2$. ∎

**Observation 3** (DERIVED-HERE; where the brief's sketch fails). $H_n$ holds exactly one radial function per $(l,m)$, namely $L^{2l+1}_{n-l-1}(2r/n)$. The $L^{2l+1}_j$ with $j < n-l-1$ belong to the levels $j+l+1$, each with its own exponential, so $r^{2k}r^lY_l^m e^{-r/n}$ is not in $H_n$ unless $k = 0$ and $l = n-1$. Every element of $H_n$ has the form $e^{-r/n}(A + rB)$ with $A$, $B$ polynomials: the odd powers of $r$ are essential.

**Proposition 4** (DERIVED-HERE). Every nodal line of a state in $H_2$ is a conic or a straight line, lying in a plane through the nucleus. So $H_2$ holds at most one closed nodal loop (an ellipse, the unknot), and no knot or link. $H_1$ has no nodal lines at all.

**Proof.** $H_2 = \{e^{-r/2}[c_0(2-r) + c\cdot x]\}$ with $c_0 \in \mathbb C$ and $c \in \mathbb C^3$. If $c_0 = 0$, the zero set $\{\mathrm{Re}\,c\cdot x = \mathrm{Im}\,c\cdot x = 0\}$ is a line. Otherwise put $d = c/c_0$. The zero set is the plane $\mathrm{Im}\,d\cdot x = 0$ intersected with $r = 2 + \mathrm{Re}\,d\cdot x$, a conicoid of revolution with a focus at the origin; a plane through the focus cuts it in a conic. In the degenerate cases ($\mathrm{Re}\,c \parallel \mathrm{Im}\,c$, or $\mathrm{Im}\,d = 0$) the state is real up to a constant phase and its zero set is a surface, not a line. A straight nodal line already occurs at $n = 2$: `2p₁` vanishes on the $z$ axis. ∎

**Proposition 5** (DERIVED-HERE; for $p = 2$ it is Berry's eq. (3)). Let $\psi_0 = e^{im\varphi}F(R,z) \in H_n$, with $F = F_e + iC F_o$. Here $F_e$ is a real combination of the $\psi_{nlm}$ with $l - \lvert m\rvert$ even (even in $z$), and $F_o$ the same with $l - \lvert m\rvert$ odd. Put $f(R) = F_e(R,0)$ and $g(R) = \partial_z F_o(R,0)$. Then $\psi_0$ vanishes to order $\ge p$ on the circle $(R,z) = (R^*,0)$ if and only if $f^{(j)}(R^*) = 0$ for $j < p$ and $g^{(j)}(R^*) = 0$ for $j < p-1$. These are $2p-1$ conditions, not the $\tfrac12 p(p+1)$ that a count of all derivatives gives. The leading term is then $K_+w^p + K_-\bar w^p$, where $w = (R-R^*) + iz$.

**Proof.** In $(R,z)$ the Schrödinger equation reads $F_{zz} = -F_{RR} - F_R/R + m^2F/R^2 + 2(V-E_n)F$, which is analytic near $R^* > 0$. Expand $F_e = \sum_k a_k(R)z^{2k}$ with $a_0 = f$ and $V = \sum_i v_i(R)z^{2i}$. Matching powers gives $(2k+2)(2k+1)a_{k+1} = -(a_k'' + a_k'/R - m^2a_k/R^2) + 2\sum_{i\le k}v_ia_{k-i} - 2E_na_k$. So $a_k$ involves $f^{(j)}$ only for $j \le 2k$, and the Taylor coefficient of $(R-R^*)^j z^{2k}$ involves $f^{(i)}(R^*)$ only for $i \le j + 2k$. The odd part works the same way with $b_0 = g$, one order lower. Every coefficient of total degree $< p$ therefore vanishes exactly when the stated conditions hold. The degree-$(p-2)$ part of the equation is $(\partial_R^2 + \partial_z^2)F_p = 0$, and the harmonic homogeneous polynomials of degree $p$ in two variables are $K_+w^p + K_-\bar w^p$. ∎

**Proposition 6** (the unfolding. KNOWN for $m_1 = 0$: Berry–Dennis 2001 §2 for Helmholtz waves, Berry 2001 eqs. (9)–(10) for hydrogen with $p = 2$. DERIVED-HERE for $m_1 \ne 0$). Let $\psi_0 = e^{im_0\varphi}F$ have an order-$p$ loop $L$ at $(R^*,0)$ with $\lvert K_+\rvert \ne \lvert K_-\rvert$. Let $\psi_1 = e^{im_1\varphi}G$ with $c = G(R^*,0) \ne 0$. Then for $0 < \lvert\varepsilon\rvert$ small, the zero set of $\psi_0 + \varepsilon\psi_1$ inside a fixed thin solid torus about $L$ is the torus knot or link $T(p,q)$ with $q = \lvert m_1 - m_0\rvert$. It is right-handed if and only if $(m_0 - m_1)(\lvert K_+\rvert - \lvert K_-\rvert) > 0$.

**Proof.** (i) $\Phi(W) = K_+W^p + K_-\bar W^p$ has real Jacobian $\lvert\partial_W\Phi\rvert^2 - \lvert\partial_{\bar W}\Phi\rvert^2 = p^2\lvert W\rvert^{2p-2}(\lvert K_+\rvert^2 - \lvert K_-\rvert^2) \ne 0$ off $0$, and $\lvert\Phi(W)\rvert \ge \lvert\,\lvert K_+\rvert - \lvert K_-\rvert\,\rvert\,\lvert W\rvert^p$. So it is a proper local diffeomorphism of $\mathbb C\setminus 0$, a $p$-sheeted covering. (ii) Put $w = \lvert\varepsilon\rvert^{1/p}W$ and $\hat c = c\,\varepsilon/\lvert\varepsilon\rvert$. Then $\lvert\varepsilon\rvert^{-1}e^{-im_0\varphi}(\psi_0 + \varepsilon\psi_1) = \Phi(W) + \hat c\,e^{i(m_1-m_0)\varphi} + O(\lvert\varepsilon\rvert^{1/p})$ in $C^1$ on $\lvert W\rvert \le S$. Here $F = \Phi(w) + O(\lvert w\rvert^{p+1})$ and $G = c + O(\lvert w\rvert)$. The model zero set has, for each $\varphi$, $p$ nondegenerate solutions, which turn by $(m_1 - m_0)/p$ of a turn about the core per circuit of the axis: the closure of the torus braid, $T(p,q)$. Transverse zero sets are $C^1$-stable, so the true zero set is isotopic to it. (iii) There are no zeros with $S\lvert\varepsilon\rvert^{1/p} \le \lvert w\rvert \le \delta$, because there $\lvert\psi_0\rvert \ge \tfrac12\lvert\,\lvert K_+\rvert - \lvert K_-\rvert\,\rvert\,\lvert w\rvert^p > \lvert\varepsilon\psi_1\rvert$. (iv) Chirality: with $\gamma = \arg w$, the strands obey $d\gamma/d\varphi = \mathrm{sgn}(\lvert K_+\rvert - \lvert K_-\rvert)(m_1 - m_0)/p$. Since $\hat R \times \hat z = -\hat\varphi$, a positive $d\gamma/d\varphi$ is a left-handed screw along $+\hat\varphi$. ∎ The chirality rule matches every measured case: Berry's state (left), the recommended $n = 7$ state (right), the $n = 4$ trefoil (left), the table rows, and the parametrised test curves.

**Corollary 7** (DERIVED-HERE). Suppose the $2p-1$ conditions of Proposition 5 have a solution with $R^* > 0$, $\lvert K_+\rvert \ne \lvert K_-\rvert$ and $c \ne 0$. These hypotheses are not proved in general; they are checked case by case in §5. Then $T(p,q)$ occurs in $H_n$ whenever $n \ge \max(\lvert m_0\rvert + 2p,\ \lvert m_1\rvert + 1)$ with $q = \lvert m_1 - m_0\rvert$. The condition $\lvert m_0\rvert + 2p$ comes from needing $p$ even and $p$ odd states in the sector $m_0$. The perturbation $\psi_{n,l_1,m_1}$ with $l_1 = \lvert m_1\rvert$ is nonzero on the equator. The best choice gives $n_G(p,q) = \min_{a \ge 0}\max(a + 2p,\ \lvert q - a\rvert + 1)$. Berry's recipe ($m_1 = 0$) gives $n_B = \min(q + 2p,\ p + 2q)$.

## 3. The delivered states (coefficients in the app's basis, $\sum\lvert c\rvert^2 = 1$)

All coefficients, the preset modes and every number are in `knots.json` → `states`. The leading coefficient is made real and positive. Values are rounded here to 10 digits; the JSON holds the full doubles. In every state the loop states share one $m$. The torus knot sits at radius $r^* = n\rho^*/2$, where $\rho^*$ is a root of the Wronskian of the even loop states. Its tube radius is set by $\varepsilon$. The brief's scale $\lambda$ has no analogue: $H_n$ is not scale-invariant.

| state | key | coefficients |
|---|---|---|
| $n = 7$ trefoil, recommended (right-handed) | `trefoil_n7_recommended` | `7s₀` $0.2281321864$, `7f₃` $0.4724321034$, `7g₃` $-0.4670351426\,i$, `7h₃` $-0.4851272919$, `7i₃` $-0.5208582335\,i$ |
| $n = 7$ trefoil, Berry's Fig. 2 (left-handed) | `trefoil_n7_berry_fig2` | `7s₀` $0.0543108486$, `7f₃` $0.4047628978$, `7g₃` $0.5425433588\,i$, `7h₃` $-0.4156396804$, `7i₃` $0.6050683335\,i$ |
| $n = 4$ trefoil (left-handed) | `trefoil_n4` | `4s₀` $0.1861015292$, `4p₀` $-0.1391990634\,i$, `4d₀` $-0.2344732341$, `4f₀` $-0.9389724098\,i$, `4f₃` $0.0966589765$ |
| $n = 4$ Hopf link | `hopf_n4` | `4s₀` $0.1869612809$, `4p₀` $-0.1398421351\,i$, `4d₀` $-0.2355564534$, `4d₂` $0.0129823432$, `4f₀` $-0.9433102738\,i$ |
| $n = 6$ Hopf link (Berry's Fig. 1, eq. 4 corrected) | `hopf_n6_berry` | `6s₀` $0.0576034318$, `6d₂` $0.4223553385$, `6f₂` $0.4147447090\,i$, `6g₂` $-0.4420230709$, `6h₂` $0.6714910601\,i$ |
| $n = 2$ unknot | `unknot_n2` | `2s₀` $1/\sqrt2$, `2p₀` $i/\sqrt2$ |

How they are made:

- Recommended $n = 7$: Berry's four loop states and his $r^* = 23.0301683733$ bohr ($\rho^* = 6.5800481066$). In the app basis the loop is `7h₃`/`7f₃` $= -1.0268719851$ and `7i₃`/`7g₃` $= 1.1152441989$. $C = -0.9885762193$ makes $K_- = 0$ (a round cross-section), and $\varepsilon = 0.4828888$ on `7s₀` makes the predicted tube radius $0.1\,r^*$. The thickness scan: a single trefoil at $\delta = 0.1$; at $\delta = 0.15$ to $0.2$ the trefoil persists but an unlinked unknotted loop enters its torus; at $\delta \ge 0.25$ no trefoil remains in the torus (`knots.json` → `thickness`). $C \to -C$ gives the mirror image (MEASURED: writhe $-3$, braid $\sigma_1^{-3}$).
- Berry's Fig. 2: $\psi_{733} + a\psi_{753} + iC(\psi_{743} + b\psi_{763}) + \varepsilon\psi_{700}$, with $a = -0.008644144573$, $b = 0.02190546488$, $C = 0.1$ and $\varepsilon = 400$, in his unnormalised basis. Here $\lvert K_-/K_+\rvert = 6.62$ and the predicted tube radius is $0.045\,r^*$ (`thickness.berry_fig2`).
- $n = 4$ (DERIVED-HERE, exact): the Wronskian of the even pair `4s₀`, `4d₀` on the equator is proportional to $(\rho-4)^3 + 16$. So $\rho^* = 4 - 2^{4/3}$ and $r^* = 8 - 4\cdot 2^{1/3} = 2.9603158004$ bohr. In the app basis `4d₀`/`4s₀` $= -2^{1/3}$ and `4f₀`/`4p₀` $= (4 + 2^{1/3})/(3(2^{1/3} - 1)) = 6.7455368364$. The round choice is $C = -0.7479737753$. The twist comes from `4f₃` ($\varepsilon = 0.5193884$, trefoil) or from `4d₂` ($\varepsilon = 0.0694387$, Hopf), both at predicted tube $0.15\,r^*$. The thickness scan: the trefoil is intact to $\delta = 0.25$ and gone at $0.3$; the Hopf link is intact to $\delta = 0.5$ (`knots.json` → `thickness`).
- Berry's Fig. 1 link: $\psi_{622} + a\psi_{642} + iC(\psi_{632} + b\psi_{652}) + 10\,\psi_{600}$, with $a = -0.01560129657$, $b = 0.0517185503$ and $C = 0.1$. Read literally (odd pair swapped), eq. (4) gives a single unknotted loop of length 46.8 bohr and no link (MEASURED).

## 4. Verification on the expanded superposition

Method, applied to $\psi = \sum c\,\psi_{nlm}$ evaluated in the app's convention:

1. All zeros in a meridian half-plane window around the loop circle are found by plaquette phase winding on a 200 × 200 grid and polished by Newton's method in $(R,z)$.
2. From each zero the curve $\{\mathrm{Re}\,\psi = \mathrm{Im}\,\psi = 0\}$ is traced by pseudo-arclength continuation, with tangent $\nabla\mathrm{Re}\,\psi \times \nabla\mathrm{Im}\,\psi$ and minimum-norm Newton correction to $\lvert d\rvert < 10^{-12}$. Tracing stops when the curve closes.
3. Invariants are computed for three random projections and two near-axial ones: crossings, the Alexander polynomial (Fox-calculus rows, exact integer determinants, interpolation), writhe and linking numbers. Where the curve turns monotonically about $z$, the braid word of the top view is read off. A closed braid with word $\sigma_1^{\pm q}$, or $(\sigma_2\sigma_1)^{\pm q}$ with all crossings of one sign, IS $T(2,q)$ or $T(3,q)$ by definition.
4. An independent check that does not use the tracer: plaquette phase winding on every face of a cubic grid, with pierced cells grouped into components by 26-connectivity. It confirms that the knot is one grid component lying within one cell of the traced curve, and it measures the distance to every other nodal component.

Results (MEASURED). Every curve closed and was traced from every seed. The phase winding is $+1$ at all 12 probe points of every curve, the oriented tangent being $\nabla\mathrm{Re}\,\psi\times\nabla\mathrm{Im}\,\psi$, so every line is a simple vortex. The column $\lvert\psi\rvert$ is $\max\lvert\psi\rvert$ on the curve divided by $\max\lvert\psi\rvert$ nearby; $\sin$ is the least sine of the angle between $\nabla\mathrm{Re}\,\psi$ and $\nabla\mathrm{Im}\,\psi$ along the curve.

| state | components, length (bohr) | $R$ range, $\lvert z\rvert_{\max}$ (bohr) | crossings ×5 | Alexander | braid word | writhe / lk (Gauss) | $\lvert\psi\rvert$ | $\sin$ | grid scan: box, $h$, nearest other zero (bohr) |
|---|---|---|---|---|---|---|---|---|---|
| `trefoil_n7_recommended` | 1, 284.10 | 18.823–24.008, 2.966 | 3 | $t^2-t+1$ | $\sigma_1^{3}$ | $+3$ | 1.3e-13 | 0.746 | ±48, 0.4, 14.35 |
| `trefoil_n7_berry_fig2` | 1, 287.24 | 21.169–23.777, 1.253 | 3 | $t^2-t+1$ | $\sigma_1^{-3}$ | $-3$ | 1.4e-13 | 0.808 | ±48, 0.4, 18.34 |
| `trefoil_n4` | 1, 38.84 | 2.601–3.565, 0.468 | 3 | $t^2-t+1$ | $\sigma_1^{-3}$ | $-3$ | 3.0e-15 | 0.953 | ±12, 0.08, 7.23 |
| `hopf_n4` | 2, 18.96 + 18.96 | 2.573–3.480, 0.455 | 2 | $1-t$; components 1, 1 | $\sigma_1^{-2}$ | lk $-1$ ($-1.0000018$) | 4.7e-15 | 0.977 | ±12, 0.08, 7.49 |
| `hopf_n6_berry` | 2, 92.55 + 92.55 | 14.033–15.851, 0.929 | 2 | $1-t$; components 1, 1 | $\sigma_1^{-2}$ | lk $-1$ ($-1.0000006$) | 7.5e-14 | 0.838 | ±40, 0.3, 13.15 |
| `unknot_n2` | 1, 12.56 ($4\pi$ up to chords) | 2.000, 0 | 0 | $1$ | — | 0 | 0 | 1.000 | ±6, 0.04, none (one component) |

The grid scan's own cells lie within one cell (at most 0.34 bohr at $h = 0.4$, 0.07 at $h = 0.08$) of the traced curve in every case: the grid sees the traced curve and nothing else in its tube. Each box margin exceeds the reported distance, so the distance is the true minimum over $\mathbb R^3$ up to $h$. The other components are the structures Berry describes: the axial chain, and loops near $R \approx 30$, $z \approx \pm 24$ bohr for $n = 7$. The chain's strands meet in triple points on the $z$ axis wherever $\psi_{n00}(z) = 0$, a degeneracy forced by the exact $C_3$ symmetry. The unknot's zero set is exactly $\{r = 2, z = 0\}$ (Proposition 4's proof), so it has no other zeros.

Each state also matches the lab/hydrogen.js oracle to a relative 4.5e-15 or better. Berry's formula (mpmath) matches the converted sum to 1.9e-15 for both of his states.

## 5. Which torus knots fit in which $n$

$n_B$ is Berry's recipe; $n_G$ is Corollary 7. "Verified" means that a superposition in $H_{n_G}$ was built and its nodal curve has the stated braid word and Alexander polynomial, or for a link the stated component count and linking numbers. The coefficients are in `knots.json` → `table`.

| knot | $n_B$ | $n_G$ | loop: $m_0$; $l$ even / odd | twist from | $r^*$ (bohr) | braid word (top view) | Alexander or linking | verified |
|---|---|---|---|---|---|---|---|---|
| unknot | — | 2 | 0; 0 / 1 (no perturbation) | — | 2 | — | $1$ | yes |
| Hopf $T(2,2)$ | 6 | 4 | 0; 0, 2 / 1, 3 | `4d₂` | 2.9603 | $\sigma_1^{-2}$ | lk $-1$ | yes |
| trefoil $T(2,3)$ | 7 | 4 | 0; 0, 2 / 1, 3 | `4f₃` | 2.9603 | $\sigma_1^{-3}$ | $t^2-t+1$ | yes |
| Solomon $T(2,4)$ | 8 | 5 | 0; 0, 2 / 1, 3 | `5g₄` | 2.9427 | $\sigma_1^{-4}$ | lk $-2$ | yes |
| cinquefoil $5_1 = T(2,5)$ | 9 | 5 | −1; 1, 3 / 2, 4 | `5g₄` | 7.7888 | $\sigma_1^{-5}$ | $t^4-t^3+t^2-t+1$ | yes |
| $T(2,6)$ | 10 | 6 | −1; 1, 3 / 2, 4 | `6h₅` | 7.6843 | $\sigma_1^{-6}$ | lk $-3$ | yes |
| $7_1 = T(2,7)$ | 11 | 6 | −2; 2, 4 / 3, 5 | `6h₅` | 14.4756 | $\sigma_1^{-7}$ | $\Delta_{T(2,7)}$ | yes |
| $T(2,8)$ | 12 | 7 | −2; 2, 4 / 3, 5 | `7i₆` | 14.1993 | $\sigma_1^{-8}$ | lk $-4$ | yes |
| $9_1 = T(2,9)$ | 13 | 7 | −3; 3, 5 / 4, 6 | `7i₆` | 23.0302 | $\sigma_1^{-9}$ | $\Delta_{T(2,9)}$ | yes |
| $8_{19} = T(3,4)$ | 10 | 6 | 0; 0, 2, 4 / 1, 3, 5 | `6g₄` | 3.6886 | $(\sigma_2\sigma_1)^{-4}$ | $t^6-t^5+t^3-t+1$ | yes |
| $10_{124} = T(3,5)$ | 11 | 6 | 0; 0, 2, 4 / 1, 3, 5 | `6h₅` | 3.6886 | $(\sigma_2\sigma_1)^{-5}$ | $\Delta_{T(3,5)}$ | yes |
| $T(3,7)$ | 13 | 7 | −1; 1, 3, 5 / 2, 4, 6 | `7i₆` | 9.2728 | $(\sigma_2\sigma_1)^{-7}$ | $\Delta_{T(3,7)}$, degree 12 | yes |

All rows use $\delta = 0.1$ and the round choice of $C$. Every row's Alexander polynomial equals the torus-knot formula in two projections, every link has the stated linking number, and every row's state matches the lab/hydrogen.js oracle (`knots.json` → `table`). All rows came out left-handed, as Proposition 6 predicts for $m_0 < m_1$ with $K_- = 0$. The reflection $y \to -y$ acts on coefficients as $c_{l,m} \to (-1)^m c_{l,-m}$ (DERIVED-HERE, from $Y_l^m(\theta,-\varphi) = (-1)^m Y_l^{-m}(\theta,\varphi)$), so applying it gives the right-handed mirror images. Two coincidences: $7_1$ uses Berry's link loop with $m = -2$, and $9_1$ uses Berry's trefoil loop with $m = -3$ and the twist from `7i₆`, so the radii $r^*$ are his.

So the register $n \le 7$ holds every $T(2,q)$ with $2 \le q \le 9$, and the 3-strand knots $T(3,4)$, $T(3,5)$ and $T(3,7)$ (MEASURED). Corollary 7 also puts the links $T(3,3)$ and $T(3,6)$ at $n_G = 6$ and $7$; they were not built. $T(4,q)$ needs $n_G \ge 8$. A cinquefoil needs $n = 5$, not the $n = 9$ of Berry's recipe. These are upper bounds on the least $n$; the lower bound is $n \ge 3$ for any knot or link (Proposition 4).

## 6. One beat with an $n = 6$ admixture (MEASURED)

Setup: $\psi(t) \propto \psi_7 + \eta\,e^{i\alpha}\,\psi_{6s_0}$, where $\psi_7$ is the recommended trefoil and $\alpha = (E_7 - E_6)t$. One beat lasts $T = 2\pi/(E_7 - E_6) = 1705.16$ a.u. $= 41.25$ fs. I sampled 16 phases per beat for $\eta = 0.02$, $0.1$, $0.2$ and $0.3$.

- The nodal set now moves, but at all 64 sampled instants the knot component stays a trefoil (Alexander $t^2-t+1$, writhe $+3$).
- Model (DERIVED-HERE from Proposition 6, small tube). On the loop the admixture changes the perturbation to $\varepsilon_{\rm eff}(\alpha) = c_{7s}\psi_{700}(r^*) + \eta e^{i\alpha}\psi_{600}(r^*)$. A phase $\beta$ of $\varepsilon_{\rm eff}$ turns the knot by $\beta/(m_0 - m_1) = \beta/3$ about $z$. Below $\eta^* = \lvert c_{7s}\psi_{700}(r^*)/\psi_{600}(r^*)\rvert = 0.1067$ the knot therefore rocks by $\pm\arcsin(\eta/\eta^*)/3$. Above $\eta^*$ it turns by $2\pi/3$ per beat, which its $C_3$ symmetry makes the same picture.
- Measured rocking (azimuth of the knot's highest point, modulo $120°$):
  - $\eta = 0.02$: $\pm 2.8°$ against the model's $3.6°$, while the tube's half-height breathes between 2.69 and 3.22 bohr.
  - $\eta = 0.1$: $\pm 14.8°$ against $23.2°$; the first-order model overshoots near $\eta^*$.
  - $\eta = 0.2$ and $0.3$: a steady turn of $120°$ per beat.
- For $\eta \ge 0.1$ an extra unknotted loop enters the trefoil's torus at 7, 8 and 3 of the 16 phases for $\eta = 0.1$, $0.2$ and $0.3$. It is unlinked from the trefoil: there are no crossings between the two in the near-axial view.
- Nothing is claimed between samples. A reconnection lasting less than $T/16 = 107$ a.u. would be missed.

## 7. For the app

- Loading: `knots.json` → `states.<key>.preset_modes` is a `modes` list for lab/state.js `load` (normalised on load). `coeffs_app` is `{label: [re, im]}` over the app's own label strings.
- Where the knot is (MEASURED): DOMAIN AUTO picks the half-width $2n^2 + 3n + 2$, which is 121 bohr at $n = 7$ (voxel 1.89 bohr at $128^3$) and 46 bohr at $n = 4$ (voxel 0.72).
  - The recommended $n = 7$ trefoil spans $r \in [18.8, 24.0]$ with a tube of half-height 3.0 bohr: about three voxels across, visible.
  - Berry's literal state has a 1.25-bohr tube, under one voxel, and is in practice invisible at the auto box.
  - The $n = 4$ knots span $r \in [2.6, 3.6]$ and are invisible at the auto box. A manual DOMAIN of about 5 bohr shows them.
- Density: the recommended $n = 7$ knot sits where $P(r)$ is 29 % of its peak, which lies at $r = 69$, and the knot's radial shell holds 2.7 % of the probability. The $n = 4$ knots sit at 1.4 % of the peak ($r = 16.5$), with 0.09 % of the probability in their shell: faint in DENSITY, so PHASE is the view for them.
- VORTEX (lab/vortex.js) is exact on its sampled coaxial circles, but it samples spheres $r_k = 0.05D + 0.93D(k+\tfrac12)/n_r$, where $D$ is the domain half-width. At the auto box the recommended knot's radial range meets 1, 1 and 3 of its coarse, fine and dense spheres. VORTEX therefore shows the knot as a few dozen points, not as a curve; a smaller DOMAIN gives more. Its degree bound is $M = m_{\max} - m_{\min} = 3$ for both trefoils and 2 for the Hopf links.
- What else VORTEX draws: Berry-type states also carry the axial chain and the outer loops (§4). The generalised $n = 4$ states carry their own chain where $F(0,z) = 0$ on the axis.
- Chirality: with CAMERA › FLIP off the stage shows the true handedness. The recommended $n = 7$ trefoil is right-handed and Berry's Fig. 2 state is left-handed.

## 8. Literature (what is whose)

- M. V. Berry, "Knotted zeros in the quantum states of hydrogen", Found. Phys. 31 (2001) 659–667, doi:10.1023/A:1017521126923. Read in full (his reprint 328). The construction: a second-order circular zero $L_2$ built from four states of one $m$ (eq. 3), threaded by the order-$m$ axial zero, perturbed by $\varepsilon\psi_{n00}$ (eq. 8); explicit link (eqs. 4–5, $n = 6$) and trefoil (eqs. 6–7, $n = 7$); figures with $C = 0.1$ and $\varepsilon = 10$ and $400$; "requiring $n \ge 6$ … $n \ge 7$" from $n \ge m + 4$.
- M. V. Berry and M. R. Dennis, "Knotted and linked phase singularities in monochromatic waves", Proc. R. Soc. Lond. A 457 (2001) 2251–2263, doi:10.1098/rspa.2001.0826. Pages 2251–2257 read (§§1–3; his reprint 332); the appendices were not read. The general strategy (strength-$n$ loop threaded by strength-$m$ line, then perturb), Bessel-beam realisation, the $\tfrac12 n(n+1)$ loop conditions (their eq. 2.5), perturbations "that do not themselves possess dislocation lines threading $L_n$".
- M. R. Dennis, R. P. King, B. Jack, K. O'Holleran and M. J. Padgett, "Isolated optical vortex knots", Nature Phys. 6 (2010) 118–121, doi:10.1038/nphys1504. Bibliographic data checked; content not read here. It is the source of the stereographic Milnor-polynomial route that Proposition 2 rules out for a single hydrogen level.
- B. Bode and M. R. Dennis, "Constructing a polynomial whose nodal set is any prescribed knot or link", J. Knot Theory Ramifications 28 (2019) 1850082, doi:10.1142/S0218216518500827, arXiv:1612.06328. Bibliographic data checked; content not read here.
- A. Enciso, D. Hartley and D. Peralta-Salas, "Dislocations of arbitrary topology in Coulomb eigenfunctions", Rev. Mat. Iberoam. 34 (2018) 1361–1371, doi:10.4171/RMI/1026, arXiv:1603.03214. Abstract read: every finite link occurs in the nodal set of some high-energy hydrogen eigenfunction. It gives no explicit $n$.
- L. H. Kauffman and S. J. Lomonaco, "Quantum knots and knotted zeros", arXiv:1904.07229 (2019). Read in summary only.
- KNOWN (standard; e.g. D. Rolfsen, Knots and Links, 1976; the book was not consulted here): the torus-knot Alexander polynomial $\Delta_{T(p,q)} = (t^{pq}-1)(t-1)/((t^p-1)(t^q-1))$, and the fact that a closed positive braid is a positive (right-handed) knot. `knots.py selftest` recovers the formula on parametrised $T(2,3)$, $T(3,4)$, $T(2,5)$ and $T(3,5)$, and recovers the Hopf linking number against the Gauss integral.

## 9. What could be wrong

1. The knot types are exact only for the computed diagrams. The curves are traced with steps of at most 0.05 bohr (0.01 bohr at $n = 4$), every step checked for tangent continuity and Newton convergence, and resampled to 400–600 points for the diagrams. Three things agree for every state: the crossing count across five projections, the braid word's length, and the independent grid scan's single component.
2. The claim "no other zero nearer than $d$" holds at the scan's resolution $h$. A line closer than about $h$ would have merged into the knot's grid component, but the own cells all lie within one cell of the trace.
3. Proposition 6 is asymptotic in $\varepsilon$. The delivered $\varepsilon$ values are validated by computation, not by the proposition, and the thickness scans show where they fail.
4. Novelty of the twist transfer and of the $n = 4$ trefoil and Hopf link is UNVERIFIED. I read Berry 2001 in full, Berry–Dennis 2001 §§1–3, and the abstracts of Enciso–Hartley–Peralta-Salas and Kauffman–Lomonaco. A forward-citation search on Berry 2001 was not done, and it is the next check before the paper claims priority.
5. I checked the CPU oracle lab/hydrogen.js `psiAt`, not the WGSL kernel. The app's tests/hydrogen.test.mjs holds `modeTable` against `psiAt` (KNOWN from its header; not rerun here). No GPU picture was taken.
6. Berry's Fig. 2 state is rebuilt from his printed constants; his figure was not compared quantitatively. The Condon–Shortley ambiguity in his $P_l^m$ rotates the knot by $\pi/3$ and changes nothing else.
7. Corollary 7 needs a positive Wronskian root and $G(R^*,0) \ne 0$. Both were found for every row in §5; other $(p,q)$ are not checked.

## Open problems

1. Is there a knot or link in $H_3$? Proposition 4 excludes $H_2$; the $n = 4$ Hopf link and trefoil are the smallest found. A random search over $H_3$ (9 complex dimensions) for linked nodal loops is cheap and was not done.
2. Least $n$ for $T(2,q)$ and $T(3,q)$: Corollary 7 gives upper bounds only.
3. Make Proposition 6 quantitative, with an explicit $\varepsilon_0$ for the delivered states. The numerics cover the delivered $\varepsilon$ only.
4. Do non-torus knots (figure-eight $4_1$, $5_2$) occur at $n \le 7$? The Bode–Dennis braid polynomials are not harmonic. A hydrogen analogue would need a loop of non-circular symmetry.
5. Berry's chain has points where three nodal lines meet on the axis (forced by the $C_3$ symmetry of $e^{3i\varphi}A + B$). Classify how a symmetry-breaking perturbation resolves them.
