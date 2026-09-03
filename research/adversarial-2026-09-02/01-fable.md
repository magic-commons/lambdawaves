# BEYOND THE FRONTIER · λWAVES — Round 1 · FABLE (lead)

*The adversarial programme on the mathematics of the Hydrogen Shadow Lab. Fable 5.1 formulates; Opus 5 @ max rivals; roles alternate; the lead writes the print. Every claim carries a seat — KNOWN (author, year) · DERIVED-HERE · MEASURED · UNVERIFIED (with the test) · REFUTED (by what number) — and a number. Josh: "deepen and flesh out the topic to its deepest depths, with rigorous novel theorems and a final conjecture/hypothesis… You have free reign to chase your deepest curiosities."*

**Evidence.** The ledger `research/MATH-LAMBDAWAVES-2026-09-02.md` (round 1 of the synthesis; claims C1–C12, questions Q1–Q6); the lab at `e818e10`; probes `research/probes/lw_verify.py`, `lw_verify_de.py`, `bf-r1-probes.py` (float64, scipy 1.18, sympy 1.14; run with `~/miniforge3/envs/sci/bin/python`). Units: atomic; $E_n=-1/(2n^2)$; $T_{\rm cl}=2\pi\bar n^3$, $T_{\rm rev}=\tfrac{4\pi}{3}\bar n^4$, $T_{\rm sr}=\pi\bar n^5$.

---

## 1 · The position

The lab's mathematics is a finite unitary flow $c(t)=e^{-iEt}c(0)$ read through four exact representations of one state: the position field $\psi=\sum c_a R_{nl}Y_l^m$, its momentum-space twin (Fock's $S^3$), the classical shadow $q+ip=\sqrt2\,c$, and the KS oscillator. Four threads carry the depth: **(A)** the arithmetic of the Rydberg ladder (revivals and their shift); **(B)** the geometry of the two exact 4D representations (Fock, KS); **(C)** the topology of the current (vortex lines and how they move); **(D)** the hidden $SO(4)$ rotor as a state operation. Each is stated below as a theorem with its proof and its number, and each ends in a question the rival must answer with a number or a counter-example.

---

## 2 · Thread A — the revival-peak law

**Setting.** Populations $p_k\propto e^{-k^2/2\sigma^2}$, $k=n-\bar n$, on the circular ladder; $A(t)=\sum_k p_k e^{-iE_{\bar n+k}t}$. Expand $E_{\bar n+k}=E_{\bar n}+E'k+\tfrac12E''k^2+\tfrac16E'''k^3+\dots$ with $E'=\bar n^{-3}$, $E''=-3\bar n^{-4}$, $E'''=12\bar n^{-5}$. At $t=T_{\rm rev}+xT_{\rm cl}$ with $\tfrac{2\bar n}{3}\in\mathbb Z$ (so the linear phase at $T_{\rm rev}$ is a multiple of $2\pi$) the phase of mode $k$ is, modulo $2\pi$,
$$\theta_k(x)=2\pi x\,k+\frac{3\pi x}{\bar n}\,k^2+\beta\,k^3,\qquad \beta:=\frac{8\pi\sigma^3}{3\bar n}\cdot\frac{k^3}{\sigma^3}\Big/k^3\ \text{i.e.}\ \beta=\frac{8\pi\sigma^3}{3\bar n}\ \text{on }u=k/\sigma .$$
In the scaled variable $u=k/\sigma$: $\theta=\alpha u+\gamma u^2+\beta u^3$ with $\alpha=2\pi x\sigma$, $\gamma=3\pi x\sigma^2/\bar n$ (negligible while $\sigma\ll\bar n$), $\beta=8\pi\sigma^3/(3\bar n)$ — **$\beta$ is the cubic dephasing at the revival**, the one parameter of the problem.

**Theorem A1 (the revival-peak law; DERIVED-HERE, rigorous as an analytic expansion).** Let $I(\alpha,\beta)=\frac{1}{\sqrt{2\pi}}\int e^{-u^2/2}e^{i(\alpha u+\beta u^3)}\,du$ (the continuum limit of $A$, entire in $\alpha,\beta$). Then, with $\mathrm{He}_n$ the probabilists' Hermite polynomials,
$$\frac{I}{e^{-\alpha^2/2}}=\sum_{m\ge0}\frac{(i\beta)^m}{m!}\,i^{3m}\,\mathrm{He}_{3m}(\alpha)
=1-\beta(3\alpha-\alpha^3)+\frac{\beta^2}{2}\mathrm{He}_6(\alpha)+\frac{\beta^3}{6}\mathrm{He}_9(\alpha)+\dots,$$
and the maximiser $\alpha^*(\beta)$ of $|I|$ and the maximum satisfy
$$\boxed{\;\alpha^*=-3\beta+\tfrac{99}{2}\beta^3+O(\beta^5),\qquad |I|_{\max}=1-3\beta^2+O(\beta^4)\;}$$
Translated to the ladder: **the full revival peaks at**
$$\boxed{\;t^*=T_{\rm rev}-\frac{4\sigma^2}{\bar n}\Big(1-\frac{33}{2}\beta^2\Big)T_{\rm cl}+O(\beta^5),\qquad |A(t^*)|=1-3\beta^2+O(\beta^4)\;}$$
*Proof.* $\int u^n e^{-u^2/2+i\alpha u}du/\sqrt{2\pi}=(-i\partial_\alpha)^n e^{-\alpha^2/2}=i^n\mathrm{He}_n(\alpha)e^{-\alpha^2/2}$ (since $\partial^n e^{-\alpha^2/2}=(-1)^n\mathrm{He}_n e^{-\alpha^2/2}$). Expand $e^{i\beta u^3}$; the series converges absolutely (Gaussian moments). To $O(\beta^3)$ with $\alpha=O(\beta)$: $\log|I|=-\alpha^2/2-3\beta\alpha-\tfrac{15}{2}\beta^2+18\beta^2\alpha^2+\tfrac{945}{6}\beta^3\alpha+\dots$ (the $\alpha^2\beta^2$ coefficient is $\tfrac{45}{2}$ from $\mathrm{He}_6$ minus $\tfrac92$ from the square of the first-order term; the $\alpha\beta^3$ coefficient is $945/6$ from $\mathrm{He}_9$'s linear term). Stationarity in $\alpha$: $-\alpha-3\beta+36\beta^2\alpha+\tfrac{315}{2}\beta^3=0$, whence $\alpha^*=-3\beta+(\tfrac{315}{2}-108)\beta^3=-3\beta+\tfrac{99}{2}\beta^3$. At $\alpha^*$: $|I|=e^{-9\beta^2/2}(1+9\beta^2-\tfrac{15}{2}\beta^2)=1-3\beta^2+O(\beta^4)$. The ladder statement follows from $x=\alpha/(2\pi\sigma)$ and $3\beta/(2\pi\sigma)=4\sigma^2/\bar n$. $\square$

**MEASURED (bf-r1-probes A).** The universal curve of the model: $\alpha^*/(-3\beta)=0.9930,\,0.9625,\,0.8917,\,0.7629$ at $\beta=0.02,\,0.05,\,0.10,\,0.20$ against the theorem's $1-16.5\beta^2=0.9934,\,0.9588,\,0.835,\,0.34$ (the $\beta^4$ term is needed past $\beta\approx0.05$); $1-|I|_{\max}=1.18\times10^{-3},\,6.80\times10^{-3}$ against $3\beta^2=1.20\times10^{-3},\,7.5\times10^{-3}$. **The discrete ladder agrees with the continuum model** in $x^*$ to $\le3\times10^{-3}$ and in $|A|_{\max}$ to $\le6\times10^{-3}$ for every $(\bar n,\sigma)$ with $\beta\le0.32$ (twelve cases, $\bar n=30\ldots150$); the first-order law $x^*=-4\sigma^2/\bar n$ is within 2 % for $\beta\le0.05$ ($\bar n=150,\sigma=0.8$: $-0.0168$ vs $-0.0171$; $\bar n=90,\sigma=0.8$: $-0.0275$ vs $-0.0284$).

**Where it breaks (MEASURED).** For $\beta\gtrsim0.5$ the continuum model and the ladder part: at $\bar n=30,\sigma=2$ ($\beta=2.23$) the ladder's best revival within $\pm T_{\rm cl}/2$ is $0.806$ at $x^*=-0.113$ while the continuum gives $0.62$; at $\bar n=45,\sigma=2$ ($\beta=1.49$): $0.650$ vs $0.686$. The discrete sum is not a Gaussian integral there: the phases $\beta k^3$ live on $\mathbb Z$ modulo $2\pi$, and for $\bar n=30$, $\beta k^3=\tfrac{4\pi}{45}k^3$ depends on $k^3 \bmod 45$ — a **cubic Gauss sum** is deciding the revival. This is the first place the arithmetic of the ladder shows through the analysis.

**Q7 (DEEPEN).** Give the $\beta^4$ term of $|I|_{\max}$ and the $\beta^5$ term of $\alpha^*$ (the same Hermite calculus), and the radius of validity: the $\beta$ at which the Hermite series' optimum stops being the global maximum (the model's $|I|$ is an Airy function of complex argument — write it in closed form and locate the first competing maximum). Numbers: the table above.

**Q8 (BROADEN — the arithmetic revival).** For integer $k$ and rational $\beta/2\pi=a/b$, the sum $\sum_k p_k e^{i(\alpha k+\beta k^3)}$ is a Gaussian-weighted cubic Gauss sum. Explain the ladder's excess over the continuum at $\bar n=30,\sigma=2$ ($0.806$ vs $0.62$) by the residues of $k^3\bmod45$, predict $|A|_{\max}$ for $\bar n=30,\sigma=3$ and $\bar n=36,\sigma=2$, and say which $\bar n$ (which $b$) revive best at fixed $\sigma$. The finite-field wing of the corpus is the natural tool.

---

## 3 · Thread B — the two exact 4D representations

**Theorem B1 (Fock's sphere; KNOWN, Fock 1935; CHECKED here to $10^{-15}$).** With $p_0=1/n$ and $\cos\chi=(p_0^2-p^2)/(p_0^2+p^2)$,
$$\Phi_{nlm}(\mathbf p)=\frac{4p_0^{5/2}}{(p_0^2+p^2)^2}\,Y_{n-1,\,l,\,m}(\chi,\theta,\phi),\qquad Y_{Nlm}=\sqrt{\frac{2^{2l+1}(N+1)(N-l)!\,l!^2}{\pi\,(N+l+1)!}}\;\sin^l\!\chi\;C^{l+1}_{N-l}(\cos\chi)\,Y_l^m(\theta,\phi),$$
$Y_{Nlm}$ orthonormal on $S^3$ with $d\Omega_3=\sin^2\!\chi\,d\chi\,d\Omega_2$. MEASURED: $\int|Y_{Nl}|^2\sin^2\chi\,d\chi=1.0000000000$ and $|\Phi|$ against the Podolsky–Pauling closed form to $\le9.8\times10^{-16}$ at $(n,l)=(1,0),(2,1),(3,0),(3,2),(5,3),(6,5)$. Q2 of the ledger is closed.

**Lemma B2 (the KS count; DERIVED-HERE, one line).** In KS coordinates $u\in\mathbb R^4$, $r=|u|^2$, the Coulomb equation at energy $E$ becomes $(-\tfrac18\nabla_u^2-E|u|^2)\psi=\psi$: a 4D oscillator of mass 4 and frequency $\omega=\sqrt{-E/2}=1/(2n)$ with eigenvalue 1, hence level $N=2n-2$. Write $w_1=u_1+iu_2$, $w_2=u_3+iu_4$; the Hopf fibre is $w\mapsto e^{i\alpha}w$ and fibre-invariance is $\#w=\#\bar w$ in a monomial. The level-$N$ space (degree-$N$ polynomials in $w,\bar w$) has $\binom{N+3}{3}$ states; the fibre-invariant ones have $\#w=\#\bar w=n-1$, of which there are $n\cdot n=n^2$. MEASURED: $1,4,9,16,25,36,49$ against $\binom{N+3}{3}=1,10,35,84,165,286,455$ for $n=1\ldots7$. The $SO(4)$ content: harmonic polynomials of degree $N$ carry $(\tfrac N2,\tfrac N2)$, dimension $(N+1)^2$; the right-$U(1)$ invariants in the Peter–Weyl block $V_j\otimes V_j$ are $2j+1$ of them ($m_R=0$), and $\bigoplus_{k}\,r^{2k}\mathcal H_{N-2k}$ gives $\sum_{l=0}^{n-1}(2l+1)=n^2$ with $l=j$. Q3 of the ledger is closed at the level of counting; the explicit projector is the rival's.

**Proposition B3 (the hidden rotor; KNOWN in substance, Pauli 1926 / Bargmann 1936 / Biedenharn; UNVERIFIED numerically here).** The $n$-shell is the $(j,j)$ representation, $j=\tfrac{n-1}{2}$, of $SU(2)_+\times SU(2)_-$ generated by $\tfrac12(\mathbf L\pm\mathbf K)$, $\mathbf K=\mathbf A/\sqrt{-2E}$ the scaled Runge–Lenz vector, and $|nlm\rangle=\sum\langle j m_1\,j m_2|l m\rangle|jm_1\rangle|jm_2\rangle$. Pauli's matrix element $\langle n,l+1,m|K_z|n,l,m\rangle=\sqrt{\frac{(n^2-(l+1)^2)((l+1)^2-m^2)}{(2l+1)(2l+3)}}$ gives $K_z|2s\rangle=|2p_0\rangle$: **$e^{-i\theta K_z}$ rotates $2s$ into $2p_z$ continuously inside the shell**, through the parabolic (Stark) states at $\theta=\pi/4$. For the instrument this is a second STATE ROTATE — a rotation of Fock's sphere by an element of $SO(4)$ outside $SO(3)$ — exact, cheap ($D^{(j)}\otimes D^{(j)}$ with the $d^l$ code already verified to $10^{-15}$), and visible: the orbital changes shape at fixed energy.

**Q9 (LOCATE).** Verify Pauli's element numerically: from the parabolic states $|n_1n_2m\rangle$ ($n=2$: $(2s\pm2p_z)/\sqrt2$ up to phase) or from $\mathbf A=\tfrac12(\mathbf p\times\mathbf L-\mathbf L\times\mathbf p)-\hat{\mathbf r}$ in position space, compute $\langle2p_0|K_z|2s\rangle$ and $\langle3d_0|K_z|3p_0\rangle$ (Pauli: $1$ and $\sqrt{5/3}\cdot\sqrt{4/5}\cdot\ldots$ — give the number) to $10^{-10}$, fix the phase convention against the Condon–Shortley $Y_l^m$ the lab uses, and state the $4\times4$ matrix of $e^{-i\theta K_z}$ on the $n=2$ shell.

**Q10 (DEEPEN — the KS clock).** Prove or refute: for a single-$n$ superposition every fibre-invariant level-$N$ state has the same oscillator frequency, so the exact KS $s$-evolution is a global phase — the KS OSCILLATOR view of a shell has geometry and no dynamics; and for a superposition across $n$ there is no common $s$. If refuted, give the $s$-dynamics; if confirmed, say what the restricted-Gaussian packets of Fabčič–Main–Wunner (PRA 79 043416) evolve in, and whether that is lab time.

---

## 4 · Thread C — the topology of the current

**Theorem C1 (vortex lines of a two-mode superposition rotate rigidly; DERIVED-HERE; MEASURED to $5\times10^{-8}$).** Let $\psi=a\,e^{-iE_1t}R_1(r)\Theta_1(\theta)e^{im_1\phi}+b\,e^{-iE_2t}R_2(r)\Theta_2(\theta)e^{im_2\phi}$ with $R_i\Theta_i$ real (the $R_{nl}Y_l^m$ up to the $e^{im\phi}$ factor and a sign), $\Delta m=m_1-m_2\ne0$. Then $\psi=0$ iff
$$|a\,R_1\Theta_1|=|b\,R_2\Theta_2|\quad\text{and}\quad e^{i\Delta m\,\phi}=-\frac{b}{a}\,e^{-i(E_2-E_1)t}\,\frac{R_2\Theta_2}{R_1\Theta_1},$$
so the nodal set is $|\Delta m|$ copies of one curve $\mathcal C$ in a meridian half-plane, at azimuths $\phi_j(t)=\phi_0-\dfrac{(E_2-E_1)}{\Delta m}t+\dfrac{2\pi j}{\Delta m}$ (and the sign flips of $R_2\Theta_2/R_1\Theta_1$ shift $\phi$ by $\pi/\Delta m$ along $\mathcal C$): **the vortex lines rotate rigidly about the quantization axis at angular velocity $-(E_2-E_1)/\Delta m$**, the Bohr frequency divided by $\Delta m$. Each carries circulation $\pm2\pi$ (a quantized vortex). *Proof.* The modulus and argument of the two terms separate because everything but $e^{im\phi}$ is real; the modulus condition is $t$-independent and defines $\mathcal C$; the argument condition is linear in $t$. The winding of $\arg\psi$ around a point of $\mathcal C$ is $\pm1$ because near the zero $\psi\propto(e^{i\Delta m\phi}-w)$ with $w$ real-analytic and $\nabla w\ne0$ generically. $\square$ MEASURED (bf-r1-probes D): $2p_+ + 3p_0$, 86 nodal points per meridian at $t=0$ and $t=37$ with $|\psi|\le1.6\times10^{-9}$; $\Delta\phi$ over the curve: mean $-2.569444$, spread $4.8\times10^{-8}$, predicted $-(E_3-E_2)t=-2.569444$; phase winding around a nodal point $-1.0000$ turns. $\Delta m=2$ ($3d_2+4s$): two zeros in $\phi$ per $(r,\theta)$, separated by $\pi$, rotating at $-(E_4-E_3)/2$: $-0.30369$ vs $-0.30382$ ($\phi$-grid limited).

**Theorem C2 (the still frames of a beat; DERIVED-HERE, elementary).** If $\Delta m=0$ and $R_i\Theta_i$ are real, then $\mathbf j\equiv0$ at every instant where $b\,e^{-i(E_2-E_1)t}/a$ is real (twice per beat), and at those instants the nodal set is a surface (generically a sphere-like sheet where $R_1\Theta_1/R_2\Theta_2=-\mathrm{Re}(b/a)e^{\dots}$), while at all other instants the nodal set is the $t$-independent curve $\{R_1\Theta_1=0\}\cap\{R_2\Theta_2=0\}$. *Proof.* A wavefunction real up to a global phase has $\mathrm{Im}(\psi^*\nabla\psi)=0$; the zero set of $a\varphi_1+b\varphi_2$ with $b/a\notin\mathbb R$ is $\{\varphi_1=\varphi_2=0\}$. $\square$ For the FLOW view: the sloshing current of $1s+2p_z$ vanishes identically at the turning points and the picture "breathes" between a curve and a sheet.

**Q11 (BROADEN — three modes).** For $\psi=$ ($2p_+$, $3p_0$, $3d_-$) with equal weights, the nodal set is no longer rigid. Find the first instant at which two vortex lines reconnect (Bialynicki-Birula et al., PRA 61 032110, 2000, for the phenomenon), give the local normal form of the reconnection in the lab's coordinates, and state whether the number of vortex lines through a large sphere is conserved between reconnections. Numbers: a time and a position.

---

## 5 · Thread D — what the corpus can bring (the rival's advantage)

The ladder's arithmetic (Q8) is where finite-field spectra, Gauss sums and the "Ouroboros" of $z\mapsto z^2+c$ over $\mathbb F_{q^2}$ meet the Coulomb spectrum honestly: the phases $\beta k^3\bmod2\pi$ on $\mathbb Z$ are a character sum. The observer/quotient language of SoSY–JSY is the right frame for §4's Theorem C2 (what the FLOW view loses at the still frames) and for the Fock/KS representations (§3): each is a quotient of the same state by a different observer. The rival should bring the corpus's actual theorems — cited by file and section — not its vocabulary.

---

## 6 · The conjecture to reach (seed)

**Conjecture Ω₁ (the revival is arithmetic).** For a Gaussian Rydberg packet on the exact hydrogen ladder, $\sup_{|t-T_{\rm rev}|<T_{\rm cl}/2}|A(t)|$ is not a function of $\beta$ alone: it is $1-3\beta^2+O(\beta^4)$ for $\beta\ll1$ (Theorem A1) and, for $\beta\gtrsim1$, is governed by the cubic Gauss sum $\sum_{k \bmod b}e^{2\pi i a k^3/b}$ with $\beta/2\pi=a/b$ in lowest terms ($b=45$ at $\bar n=30$), so that two ladders with the same $\beta$ and different $\bar n$ revive differently — the revival "hears" the denominator of $\bar n$. *What would break it:* two ladders with equal $\beta$ and coprime denominators whose $|A|_{\max}$ agree to $10^{-3}$.

---

## NOT CERTIFIED

No GPU ran. Theorem A1's expansion is rigorous; its ladder form assumes $\sigma\ll\bar n$ (the $u^2$ term dropped) and $\tfrac{2\bar n}{3}\in\mathbb Z$ (otherwise add the classical offset). B3 is stated from the literature and not computed here (Q9). C1's genericity (transversality of the modulus curve) is assumed, not proved.
