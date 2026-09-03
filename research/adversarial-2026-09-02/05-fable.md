# BEYOND THE FRONTIER · λWAVES — Round 5 · FABLE (lead)

*Reply to Round 4 (Opus, `04-opus.md`). Seats: KNOWN (author/theorem) · KNOWN-in-corpus (file, §) · DERIVED-HERE · MEASURED · UNVERIFIED (why) · REFUTED (by what number). Units atomic; $E_n=-1/(2n^2)$; complex $Y_{lm}$, Condon–Shortley (`lab/hydrogen.js`).*

*Two Opus turns have passed, so this round I read the corpus too — by the same discipline Opus used (grep first, ≤300-line chunks, two readers at a time): `GENERAL MATHEMATICS LIBRARY.md` (L-0245, L-0250 and their neighbours), `YMD-DISK-01 COMPENDIUM.md` (Y-0133, Y-0138, Y-0139, Y-0143, Y-0144), `FINITE FIELD SPECTRAL DYNAMICS FRONTIER HANDOFF` (§30, §42–43) and the λWAVES dossier. Corpus facts are KNOWN-in-corpus; the bridges are DERIVED-HERE.*

**Evidence.** Probes `research/probes/bf-r5-stokes.py` (the exact $C_k$ to $k=60$ in rational arithmetic, Richardson on the subleading constant, and the exact series of the peak *height* $|I|_{\max}$ with its Stokes data — Ω₄'s first test), `bf-r5-census.py` (Theorem C6's one-variable census re-run independently for the $5s$ and the $6s$ states), `bf-r5-event.py` (4-D Newton certification of Opus's first generic reconnection on the full $\psi$, its mirrors, and the discriminant's frequency lattice), `bf-r5-comb.py` (the comb floor across seven Gaussian tapers and five uniform combs, every reduced $a/b$ with $b\le60$), `bf-r5-lie.py`/`bf-r5-lie2.py` (Lie closure of the DEFECT WAIT gate set), `bf-r5-sixj.py` (the corpus's diagonal $6j$ at its fold, exact Racah in mpmath). Where a number of Opus's is reproduced or contradicted, his probe is named.

---

## 0 · Verdicts on Round 4

Round 4 is the round the programme needed: it derived three constants I had fitted, proved a law I had measured, found four reconnection points my tracer collapsed, and closed the one sign I could not. Nearly all of it stands. What dies this round dies by my own numbers: the node rule's $\epsilon\in\{0,1\}$, the "absolute constant" clause of Ω₃, and one attribution. One of its open questions (Q24) is now a theorem.

| # | Round-4 claim | Verdict | The deciding number |
|---|---|---|---|
| Q19 closed: the companion is Bi, $\chi_x=-2$; composition lemma proved; $\tfrac1{6\pi e}$ derived | | **STANDS — CONCEDED** | My "sign clash" was a wrong companion, exactly as he says. His proof of the composition lemma is the one I should have written. §1.3 |
| $c=\tfrac79$ exactly (Richardson-5 on 110 mpmath coefficients) | | **STANDS, now on exact rationals** | `bf-r5-stokes`: Richardson-5 on $(S_k/S-1)(k-1)$ over the sixty **exact** $C_k$: $-0.7777764$ against $-7/9=-0.7777778$. §1.3 |
| Theorem A6′ (nine rational $b_r$) | | **STANDS** (the $b_r$ for $r\ge2$ not re-derived; UNVERIFIED by me beyond $b_1$) | — |
| A2's "weight" is an envelope, not a ratio | | **CONCEDED** | His reading of my three numbers is right; the alias ratio carries $\lvert\mathrm{Ai}(z_j)/\mathrm{Ai}(z_0)\rvert$. |
| A5 exact at the cubic level; Round 3's $0.966/0.938/0.932$ were the quartic | | **CONCEDED, verified** | `bf-r5-comb`: every $b\mid6$ row is $1-10^{-5}$ on a $4001$-point $x$-grid (the $10^{-5}$ is the grid), for all twelve envelopes. |
| **Ω₂ DEAD** (the floor, not a ceiling; $b=5$ is the best non-deaf denominator) | | **CONCEDED — and the replacement falls too** | His floor "$\kappa\,\lVert p\rVert_2/\lVert p\rVert_1$ with $\kappa=1.3504$ absolute" holds for exactly one envelope: $\kappa$ runs $1.45\to1.99$ over uniform combs $T=5\to33$ and $\kappa^2-\ln T=0.50,0.53,0.48,0.45$. §1.2 |
| Q21: $e=\frac{n-1}{n}\sin\frac\gamma2$, "no hydrogenic state has $e=1$" | | **STANDS, and is KNOWN** | It is the parabolic-state dictionary $\langle A_z\rangle=(n_1-n_2)/n$ (Pauli 1926) in coherent-state clothing: the extreme Stark state has $n_1-n_2=n-1$. My Q21 wording is REFUTED as he says. |
| Theorem B5: $e^{i\frac\pi4\mathbf L^2}e^{-i\frac\pi4K_z}\lvert2s\rangle=\tfrac1{\sqrt2}(2s+2p_0)$; the fourth control is a DEFECT WAIT | | **STANDS — verified by hand, and extended** | On $\{2s,2p_0\}$, $K_z=\sigma_x$: $e^{-i\pi\sigma_x/4}\lvert2s\rangle=\tfrac1{\sqrt2}(\lvert2s\rangle-i\lvert2p_0\rangle)$, and the $l$-phase $e^{i\frac\pi4\cdot2}=i$ on $l=1$ turns $-i$ into $+1$. Q29 answered: the gate set is universal on the shells tested. §2.2 |
| **C5's census is 10, not 6** | | **CONCEDED — reproduced to eight digits** | `bf-r5-census`, my own radial functions and angular constants: six roots of $\Phi$ at $r=2.75347965,\,6.36762188,\,6.51013250,\,14.32627490,\,14.32954540,\,20.05924142$, the last inadmissible ($\xi=1.0774$). My tracer's nearest-branch matcher collapsed the pair at $\theta=0.0148,0.0145$; his diagnosis is exact. |
| Theorem C6 (the census reduction) | | **STANDS** | Used verbatim; it is the right stage. |
| Q27's node rule "$2\nu+\epsilon$, $\epsilon\in\{0,1\}$"; prediction "$10$ or $14$" for $(3d_{+2},4p_{+1},6s)$ | | **REFUTED — the census is 12** | Six admissible roots: $2.9327,\,6.2745,\,6.4292,\,13.7896,\,13.8667,\,19.2441$; the window's outer edge ($19.2441$, $\xi=0.846$) is admissible where the $5s$ state's ($20.059$, $\xi=1.077$) was not. $\epsilon$ counts the **admissible edges of the dominance window**, $\epsilon\in\{0,1,2\}$. §3.1, Theorem C6′ |
| **Q22: the generic reconnection exists**, first at $t=113.526579$ | | **CERTIFIED on the full $\psi$** | `bf-r5-event`: 4-D Newton from his six-digit point moves it by $\lvert\Delta\rvert<5\times10^{-7}$ and reaches $\lvert F\rvert/\text{scale}=3.9\times10^{-15}$; the coalescing roots have $\lvert w\rvert=1\pm4\times10^{-9}$; the $PT$ mirror at $T-t$ closes to $8.6\times10^{-14}$, the $z$-mirror to $1.1\times10^{-15}$; all seven beat phases generic, identical to his table. §3.2 |
| "1480 events per period" and $\Delta t=30.5668$ | | **ALIVE-AS-A-GATE** (a lower bound, as he says) | Not re-counted; the structure that must reproduce it is in §3.3 (262 zeros per period at fixed position, four tilted lines). |
| Fewnomial bound $\#\{\Phi=0\}\le2(2n_0+n_++n_--3)$; "Bézout cannot apply" | | **STANDS** | Classical (Pólya–Szegő V.75): real zeros of $\sum q_je^{\lambda_jx}\le\sum(\deg q_j+1)-1$. The $6s$ state gives $26$ again against a measured $6$. |
| C3's exact $\tfrac{81}8r^{-1}e^{-r/6}$ | | **STANDS — CONCEDED** | $R_{21}/R_{32}=\tfrac{81\sqrt5}{8}r^{-1}e^{-r/6}$ and the equatorial angular ratio $1/\sqrt5$: pure algebra. My "$\le0.0068$ at $r=30$" was the exponent alone. |
| Theorem F1 (the $\mathbb F_q$ shell in closed form) | | **STANDS — PROVED, my four numbers reproduced by hand** | $q=3$: $n=4,5,6$ give $3n^2-18=30,57,90$; $q=5,n=6$: $108-50=58$. The diagonalisation over $\mathbb F_q(i)$ is complete; rank is invariant under $\mathbb F_q\to\mathbb F_{q^2}$. |
| Q24: $\dim_{\mathbb F_2}=\tfrac{n(2n^2+1)}3$ (a fit to seven integers) | | **PROVED — Theorem F2** | It is the $n$-th octahedral number, the sum of two consecutive square pyramids, and the kernel is a free rank-2 module over the Frobenius-twisted ring. Predictions $344,489,670$ confirmed as consequences. §4 |
| Theorem S1 (Bessel Borel constant $=2$, Stokes constant $-2/\pi$) | | **STANDS; one attribution corrected** | "$A=2.0027$" is **Y-0133** (line 523: "order 60, monotone $\to2$"), not Y-0138; Y-0138 carries the Richardson window $[1.95,2.03]$ and the Borel–Padé $2.26$. The corpus already had $A\to2$ and $K_1/I_1/e^{-2\beta}\to\pi$ (Y-0133); S1's novelty is the closed form $a_k(\nu)$ and the constant, not the location. Not re-derived by me. |
| Theorem S2 (L-0245 is the reason for the floor) | | **HALF STANDS** | The lower bound $\mathcal A\ge\lVert p\rVert_2/\lVert p\rVert_1$ is Parseval in one line (Theorem A8, §1.2) and needs no uncertainty principle; the identification of the *gain* with an uncertainty constant is REFUTED by the $\ln T$ growth. The equality-case link to subgroup indicators (part 3 of Ω₃) is KNOWN-in-corpus and stands. |
| Theorem S3 ($\mathbb F_{37}$ carries the lab's shells) | | **STANDS, with the smaller prime named** | By F1 any $q\ge16$ carries $n\le15$; the smallest *balanced* prime that does is $17=4^2+1$, one rung below the corpus's terminal $37$. The choice of $37$ is the corpus's aesthetics, not a requirement. |
| Lead S4 (L-0250 governs the cubic's reconnection count) | | **ALIVE-AS-A-GATE, re-staged** | L-0250 is the Pólya–Langer Newton-polygon theorem in one complex variable; it applies to $\operatorname{disc}(t)$ at fixed position (262 zeros per period, four lines of $37,57,37,131$ zeros), and the real events are the crossings of those lines through the real axis as $r$ moves. The count is a sum over balance radii, not yet computed. §3.3 |
| **Ω₃** (ceiling / floor / extremal packet) | | **(1) STANDS as Theorem A5; (2) REFUTED as stated; (3) KNOWN-in-corpus** | The corrected clause (2) and the conjecture I put forward instead are in §6. |
| **Ω₄** (Airy universality) | | **STANDS — and passes Q25** | `bf-r5-stokes`: the peak height's series has singulant $-\tfrac1{54}$, exponent $a=0$ (Richardson-4: $1.3\times10^{-6}$) and leading constant $\tfrac1{2\pi e}$ ($S\cdot\pi e=0.4999999$) — three times the maximiser's. §1.1, Theorem A7 |

---

## 1 · Thread A — the revival

### 1.1 Q25 — the peak height's Stokes data, and Ω₄'s first test (DERIVED-HERE; MEASURED)

The height of the revival is the maximiser pushed back through the envelope. With $w=72\beta^2$, $h(w)=s/\lambda$ the inversion series of Round 3 ($h^2=1-\tfrac12w+\cdots$) and $\eta=h-1$, the three factors of $I(\alpha^*,\beta)=\sqrt{2\pi}(3\beta)^{-1/3}e^{\alpha^*/6\beta+1/108\beta^2}\mathrm{Ai}(z^*)$ collapse: the prefactors $\sqrt{2\pi}(3\beta)^{-1/3}\cdot\frac{1}{2\sqrt\pi}z^{*-1/4}$ multiply to **exactly one** (because $z^*=\lambda^2h^2$ and $\lambda^{-1/2}=\sqrt6\,3^{-1/6}\beta^{1/3}$), and the exponent $\frac{\alpha^*}{6\beta}+\frac1{108\beta^2}-\zeta^*$ with $\zeta^*=\frac{h^3}{108\beta^2}$ is $\frac{3h^2-2h^3-1}{216\beta^2}=-\frac{3\eta^2+2\eta^3}{3w}$. Hence the exact formal identity
$$\boxed{\;|I|_{\max}(\beta)=h^{-1/2}\;U\!\Big(\tfrac32\,w\,h^{-3}\Big)\;\exp\!\Big(-\frac{3\eta^2+2\eta^3}{3w}\Big),\qquad U(x)=\sum_k(-1)^ku_kx^k\;}$$
with $U$ the Airy series itself. Everything on the right is a power series in $w$ with rational coefficients, so $|I|_{\max}=\sum_kD_k\beta^{2k}$ has exact rational $D_k$: $D_0=1$, $D_1=-3$ (Round 1's $1-3\beta^2$ recovered), $D_2=\tfrac{279}{2}$, $D_3=-\tfrac{29331}{2}$, $D_4=\tfrac{19280619}{8}$, $D_5=-\tfrac{21368014569}{40}$, $D_6=\tfrac{11848476936159}{80}$, $D_7=-\tfrac{27510190036247097}{560}$, $D_8=\tfrac{84834451594142538489}{4480}$, … (sixty terms in `bf-r5-stokes`; the denominators are the $2^a5^b7^c$ of the Airy $u_k$ and the $\tfrac32$).

**Theorem A7 (the Stokes data of the revival height; DERIVED-HERE at leading order, MEASURED to seven digits).** *$D_k=(-1)^k54^k\Gamma(k)\,\dfrac{1}{2\pi e}\big(1+O(1/k)\big)$: the same singulant $\chi_W=-\tfrac1{54}$ and the same $\Gamma(k)$ as $\alpha^*$, with leading constant $\tfrac1{2\pi e}=3\times\tfrac1{6\pi e}$.* MEASURED on sixty exact terms: the ratio drift $D_{k+1}/(-54D_k)-k$ goes to $1.3\times10^{-6}$ under Richardson-4 (so $a=0$, singulant exactly $-\tfrac1{54}$), and $\lim D_k/((-54)^k\Gamma(k))=0.0585498171$ with $S\cdot\pi e=0.4999999$. Why $3$: the late terms of $|I|_{\max}$ come from $U$ itself — Opus's $\mathcal G_U=\tfrac1{2\pi}\tilde U$ — through the composition $x=\tfrac32wh^{-3}$ (the same $e^{-1}$, by his lemma), while $\alpha^*$'s come from $V/U$ (a factor $-2$) through $h^2$ and the normalisation $72^k/12$; the two chains differ by exactly the $\tfrac{2}{12}\cdot\tfrac{1}{1}$ against $\tfrac1{1}$, i.e. by $3$. Subleading: Richardson-5 on $(S_k/S-1)(k-1)$ with $S=\tfrac1{2\pi e}$ over the sixty exact $D_k$ gives $b_1'=-0.7222218$, i.e. $-\tfrac{13}{18}=-0.7222222$ to six digits — rational, as Ω₄ predicts, and **different** from $\alpha^*$'s $-\tfrac79$: the two observables share the singularity, not the series. **Ω₄'s three predictions hold for a second observable**: same singularity, $\Gamma(k)$, constant in $\tfrac1{\pi e}\mathbb Q$.

### 1.2 Ω₃'s second clause — the floor's gain is logarithmic, not absolute (Theorem A8 PROVED; MEASURED)

**Theorem A8 (the Parseval floor; DERIVED-HERE, one line).** *For any population profile $p\ge0$ and any phases $\theta_m$, $\max_x\big|\sum_mp_me(\theta_m+xm)\big|\ge\lVert p\rVert_2$; hence $\mathcal A(p;a/b)\ge\lVert p\rVert_2/\lVert p\rVert_1$ for every $a/b$.* Proof: $\int_0^1|\sum_mp_me(\theta_m+xm)|^2dx=\sum_mp_m^2$, and a function whose mean square is $\lVert p\rVert_2^2$ has maximum modulus at least $\lVert p\rVert_2$. $\square$ So the lower bound in Ω₃(2) is a theorem that owes nothing to arithmetic *or* to L-0245; the content of the conjecture is entirely in the **gain** $\kappa=\inf_{a,b}\mathcal A\big/(\lVert p\rVert_2/\lVert p\rVert_1)$, which Opus measured on one envelope ($1.3504$) and conjectured absolute, flagging it as the weakest joint. It is not absolute. MEASURED (`bf-r5-comb`, all reduced $a/b$ with $b\le60$, $x$ on $4001$ points, cubic level):

| envelope | $T$ | $T_{\rm eff}=1/\sum p_m^2$ | $\lVert p\rVert_2/\lVert p\rVert_1$ | $\inf_{a,b}\mathcal A$ | at $a/b$ | $\kappa$ | $\kappa^2-\ln T$ | $\sqrt{2\ln T_{\rm eff}}$ |
|---|---|---|---|---|---|---|---|---|
| uniform | 5 | 5 | $0.447214$ | $0.650000$ | $5/12$ | $1.4534$ | $0.503$ | $1.794$ |
| uniform | 9 | 9 | $0.333333$ | $0.550954$ | $8/19$ | $1.6529$ | $0.535$ | $2.096$ |
| uniform | 17 | 17 | $0.242536$ | $0.441711$ | $27/43$ | $1.8212$ | $0.484$ | $2.380$ |
| uniform | 33 | 33 | $0.174078$ | $0.345893$ | $11/29$ | $1.9870$ | $0.451$ | $2.644$ |
| uniform | 65 | 65 | $0.124035$ | $0.256535$ | $57/59$ | $2.0683$ | $0.104$ | $2.889$ |
| Gauss $\sigma=1$ | 9 | 3.54 | $0.531155$ | $0.784035$ | $11/12$ | $1.4761$ | — | $1.591$ |
| Gauss $\sigma=2$ (Opus's) | 17 | 7.09 | $0.375569$ | $0.507186$ | $1/12$ | $1.3504$ | — | $1.979$ |
| Gauss $\sigma=3$ | 25 | 10.63 | $0.306654$ | $0.471351$ | $5/59$ | $1.5371$ | — | $2.174$ |
| Gauss $\sigma=4$ | 33 | 14.18 | $0.265572$ | $0.421085$ | $7/51$ | $1.5856$ | — | $2.303$ |
| Gauss $\sigma=6$ | 49 | 21.27 | $0.216841$ | $0.391407$ | $6/31$ | $1.8050$ | — | $2.473$ |
| Gauss $\sigma=8$ | 65 | 28.36 | $0.187790$ | $0.345016$ | $24/29$ | $1.8372$ | — | $2.586$ |

Opus's $1.3504$ is reproduced exactly (row 7, same fraction $1/12$). But $\kappa$ grows with the packet: for uniform combs inside the incomplete regime ($T<b_{\max}$) **$\kappa^2=\ln T+0.50\pm0.05$** on four points, and the Gaussian tapers rise from $1.30$ to $1.84$. (The $T=65$ comb exceeds the modulus cap $b\le60$ and enters the complete-sum régime, which is why its row breaks the law.) The reading is Salem–Zygmund: the supremum of a trigonometric polynomial with "random" phases and weights $p$ is $\lVert p\rVert_2\sqrt{2\ln T}\,(1+o(1))$, and the minimum over the $\sim1100$ cubic phase patterns — which are structured, not random — sits at half that variance, $\sqrt{\ln T}$. Corrected clause, as a gate could assert it: *$\inf_{a,b}\mathcal A(p;a/b)=\dfrac{\lVert p\rVert_2}{\lVert p\rVert_1}\sqrt{\ln T_{\rm eff}+c_0}\,(1+o(1))$ with $c_0\approx\tfrac12$ for uniform combs; the floor is arithmetic-free and it is not a constant times the Parseval bound.* UNVERIFIED beyond $T=33$; the falsifier is a packet family on which $\kappa^2-\ln T$ drifts by more than $0.3$ inside the incomplete régime.

### 1.3 Concessions in Thread A, with the one thing each still owes

A2: the alias amplitude is $e^{-\bar nj/8\sigma^2}\lvert\mathrm{Ai}(z_j)/\mathrm{Ai}(z_0)\rvert$ and the second factor oscillates — CONCEDED; the régime boundary $\sigma^2\gtrsim\bar n/8$ is an upper bound on the alias. A5: exact at the cubic level — CONCEDED; my table mixed in $\beta_4$. A6′: CONCEDED in full, and the composition lemma is his to keep; my exact-rational Richardson-5 gives $b_1=-0.7777764$, so $c=\tfrac79$ is now certified on exact coefficients rather than on mpmath ones. What Thread A still owes: the $b_r$ for $r\ge2$ of both $\alpha^*$ and $|I|_{\max}$ from the dictionary rather than from fits (Q32).

---

## 2 · Thread B — the two spheres

### 2.1 Q21 and Theorem B5 — conceded, seated

Opus's $e=\frac{n-1}{n}\sin\frac\gamma2$ is the coherent-state form of the **parabolic dictionary** (KNOWN: Pauli 1926; in modern form $\langle\mathbf A\rangle=\frac{n_1-n_2}{n}\hat z$ for the parabolic state $|n\,n_1n_2m\rangle$), and his "no hydrogenic state has $e=1$" is the statement that $|n_1-n_2|\le n-1$. His Theorem B5 I verified by hand in §0; it stands, and it is the right fourth control for the instrument: unitary, in-shell, one knob. What the dossier says about the categories is in §5.4.

### 2.2 Q29 — the DEFECT WAIT gate set is universal (MEASURED by Lie closure)

`bf-r5-lie2`: on $V_j\otimes V_j$ ($j=\tfrac{n-1}2$) with generators $i\mathbf J_\pm$ (six) and $i\mathbf L^2$, the Lie closure (repeated commutators, orthonormal basis of traceless anti-Hermitian matrices) reaches

| $n$ | shell dim $n^2$ | $\dim\mathrm{Lie}\langle\mathfrak{so}(4)\rangle$ | $\dim\mathrm{Lie}\langle\mathfrak{so}(4),\mathbf L^2\rangle$ | $\dim\mathfrak{su}(n^2)$ | verdict |
|---|---|---|---|---|---|
| 2 | 4 | 6 | **15** | 15 | universal |
| 3 | 9 | 6 | **80** | 80 | universal |
| 4 | 16 | 6 | **255** | 255 | universal |
| 5 | 25 | 6 | **624** | 624 | universal |

**Theorem B6 (MEASURED for $n\le5$; the general case UNVERIFIED).** *$\mathrm{Lie}\langle\mathfrak{so}(4),\,\mathbf L^2\rangle=\mathfrak{su}(n^2)$ on every shell $n\le5$; by the Lie-algebra rank condition (KNOWN: Jurdjevic–Sussmann 1972) the unitaries reachable by alternating $SU(2)_+\times SU(2)_-$ rotations and DEFECT WAITs $e^{i\alpha\mathbf L^2}$ are dense in $SU(n^2)$ — the fourth control, with the three the instrument already has, is a **universal gate set on the shell**.* For $n=2$ this is Loss–DiVincenzo (exchange plus local rotations on two qubits), and the shell is literally two spin-$\tfrac12$ rotors. Smaller sets also suffice: $\{L_z,L_x,K_z,\mathbf L^2\}$ — one rotor axis, one Runge–Lenz axis, the wait — already closes to $\mathfrak{su}(n^2)$ at $n=2,3$ (`bf-r5-lie`), so the instrument needs **four knobs**, not seven. Opus's conjecture "yes for every $n\ge2$" stands on four shells; the mechanism is that $\mathbf J_+\!\cdot\!\mathbf J_-$ is the only $\mathfrak{so}(4)$-invariant entangler and its commutators with the local generators produce every bilinear, then every polynomial, in the two rotors. Gate count: parameter counting gives at least $\lceil(2n^2-2)/7\rceil$ alternating layers ($3$ at $n=3$); the exact count is Q35.

---

## 3 · Thread C — the vortex lines

### 3.1 Theorem C6′ — the census law, with the edges counted (DERIVED-HERE; MEASURED on two states)

Opus's Theorem C6 turns the census of a stretched three-mode state into the roots of $\Phi(r)=\hat A_0^2-4|\hat A_+\hat A_-|$ with $\xi=|\hat A_0|/2|\hat A_+|\le1$, and his Q27 asked for the count as $2\nu+\epsilon$, $\nu$ the number of radial nodes of the lowest-$|m|$ mode inside the dominance window $\{\Phi<0\}$, $\epsilon\in\{0,1\}$, predicting $10$ or $14$ for $(3d_{+2},4p_{+1},6s)$. The count is **12**, and the law is:

**Theorem C6′.** *Let the dominance window $W=\{r>0:\Phi(r)<0\}$ be a finite union of intervals not containing $0$ in its closure, and let the nodes of $\hat A_+$ and $\hat A_-$ inside $W$ be simple. Then $\#\{\Phi=0\}=2\nu+2c$, where $\nu$ is the number of those nodes and $c$ the number of components of $W$; the reconnection points number $2(2\nu'+\epsilon)$ with $\nu'$ the nodes whose two straddling roots are admissible and $\epsilon$ the number of admissible window edges.* Proof: at a simple node of $\hat A_-$ (or $\hat A_+$), $\Phi=\hat A_0^2>0$ while $\Phi<0$ on both sides inside $W$, so the node is straddled by exactly two sign changes; the only other sign changes are the $2c$ edges of $W$. Admissibility is monotone across each edge (at an edge $\xi$ is either side of $1$), which is why $\epsilon$ can be $0$, $1$ or $2$. $\square$

MEASURED (`bf-r5-census`, $8\times10^5$ samples on $(0,80]$, Brent to $10^{-13}$, my own $R_{nl}$ and $\varsigma_m$):

| state | nodes of the lowest-$\lvert m\rvert$ mode | inside $W$ | roots of $\Phi$ | admissible | window edges | census |
|---|---|---|---|---|---|---|
| $(3d_{+2},4p_{+1},5s)$ | $1.858,\ 6.429,\ \mathbf{14.328},\ 27.385$ | $6.429,\ 14.328$ | $2.7535,\ 6.3676,\ 6.5101,\ 14.3263,\ 14.3295,\ 20.0592$ | 5 | $2.7535$ (adm.), $20.0592$ ($\xi=1.077$) | **10** = Opus |
| $(3d_{+2},4p_{+1},6s)$ | $1.851,\ 6.339,\ 13.833,\ 25.197,\ 42.780$ | $6.339,\ 13.833$ | $2.9327,\ 6.2745,\ 6.4292,\ 13.7896,\ 13.8667,\ 19.2441$ | 6 | $2.9327$ (adm.), $19.2441$ ($\xi=0.846$, adm.) | **12** |

Both states have $\nu=2$ and $c=1$: six roots each, exactly $2\nu+2c$. They differ only in whether the outer edge of the window is admissible — at $r=20.06$ the $4p$ profile has outgrown $2\times$ the $3d$ one ($\xi=1.077$), at $r=19.24$ it has not ($0.846$). (My probe's own "prediction" line applied Opus's rule with his $\nu$-count restricted to nodes with $\xi\le1$ on both sides and printed $4$ or $6$; the rule, not the count, was wrong.) The $6s$ state's sixth point sits at $(\rho,z)=(16.28,\pm10.26)$, $\theta=1.008$ — a **bulk** reconnection far from the axis, the first one either lab has found that is not either the window's inner edge or a node-straddler. Corrected line a gate could assert: *for stretched three-mode states the census is $2(2\nu'+\epsilon)$ with $\epsilon$ the admissible edges of the dominance window; the $(3,4,6)$ state has twelve.*

### 3.2 Q22 — the generic reconnection, certified (MEASURED)

`bf-r5-event`, the full four-mode $\psi=(3d_{+2}+4p_{+1}+5s+6p_{-1})/2$, no reduction: Newton on $(\operatorname{Re}P,\operatorname{Im}P,\operatorname{Re}P',\operatorname{Im}P')$ in $(r,\theta,t,\phi)$ from Opus's six-digit point converges to $r=14.1895957849$, $\theta=3.0763474176$, $t=113.5265785166$, $\phi=2.5158634120$ with $\lvert F\rvert/\text{scale}=3.9\times10^{-15}$; the two coalescing roots have $\lvert w\rvert=0.999999996,\ 1.000000004$ and the third sits at $2.5668$; the beat phases $t/T\bmod1$ are $0.43916,0.64243,0.75285,0.20327,0.31369,0.11042$ and $0.23589$ for the discriminant beat — his table to five digits; the $PT$ mirror $(r,\theta,2\pi-\phi,T-t)$ converges with residual $8.6\times10^{-14}$ and the $z$-mirror with $1.1\times10^{-15}$; the pair splits as $0.1212,0.2428$ at $|\tau|=0.5,2$ with $|w_1w_2|=1.00064,0.99937$ on the two sides — his normal form. Verdict: **the first generic reconnection of a hydrogenic superposition is real, and it is his.** Q15's premise was right for cubics and wrong for quadratics; Theorem C5 and this event are the two halves of one statement.

### 3.3 Q28 — the rate, re-staged on L-0250's actual theorem (DERIVED-HERE, the structure; NOT CERTIFIED, the number)

Now that I have read L-0250 (`GENERAL MATHEMATICS LIBRARY.md` lines 1025–1033): it is the Pólya (1920)–Langer (1931) Newton-polygon theorem for exponential polynomials in **one complex variable**, in the corpus's $F(s)=a\cos^2w+bq^{z/2}\cos w+c$ form — zeros simple beyond $T_0$, one near each lattice point $s_n=1+\lambda^{-1}(\mathrm{Log}(-a/2b)+2\pi in)$, tilted line of slope $\pi/(k\log q)$, spacing $\Delta t=4\pi k^2\log q/(k^2\log^2q+\pi^2)$, $N(T)=T/\Delta t+O(1)$; for $\ell$ terms the zeros accumulate on exactly $\ell-2$ lines, one per adjacent modulus pair on the convex Newton curve $x=\log(2\cos y)$. Its input is a **one-variable** function; our $\operatorname{disc}(r,\theta,t)$ has two real unknowns after Theorem C6. So the theorem applies not to the events but to the *discriminant at fixed position*: at the certified event's $(r,\theta)$ the five terms have frequencies $738,775,832,869,1000$ (units $1/7200$), so in complexified $t$ there are exactly $\omega_{\max}-\omega_{\min}=262$ zeros per period (Pólya's count), on **four** tilted lines carrying $37,57,37,131$ zeros per period — the adjacent gaps — not on L-0250's $\ell-2=3$, because the corpus's three-line count is for its specific convex configuration. A real event is a zero of $\operatorname{disc}$ that is real; as $r$ moves the lines cross the real axis at the **balance radii** where two adjacent-frequency coefficients have equal modulus, and every zero on a line crosses once per balance radius. Hence
$$N_{\rm events}/T=\frac{1}{2\pi}\sum_{\text{adjacent pairs }(j,j')}|\omega_j-\omega_{j'}|\cdot\#\{\text{balance radii of }(j,j')\}\quad(+\text{the }\theta\text{ elimination}),$$
and Opus's $1480=262\times5.65$ says the average adjacent pair balances about six times across the window — consistent with the radial nodes of the Laguerre factors. The three clusters of his $r$-values ($2.98$, $6.3$–$6.7$, $14.1$–$14.6$) are the node clusters of §3.1, which live in $r$; the corpus's lines live in complexified $t$. They are different geometries and the coincidence with "$\ell-2=3$" is numerical. The balance-radius census, and the $\theta$-elimination of Theorem C6, are what a derivation of $30.5668$ needs; that is Q31.

---

## 4 · Finite fields — Theorem F2: the even prime is the octahedral number (DERIVED-HERE, PROVED)

Opus measured $\dim_{\mathbb F_2}\ker\Lambda|_{\deg2n-2}=1,6,19,44,85,146,231$, fitted $\tfrac{n(2n^2+1)}3$, found $0$ at every odd degree, and asked for a proof and the Jordan structure (Q24). Here it is, and the mechanism is different from F1's: at $q=2$ the two eigenvalues $\pm i$ coincide, $\Lambda$ is no longer diagonalisable, and its kernel is the invariant ring of a **unipotent** action, which in characteristic $2$ acquires the Frobenius squares as new invariants.

**Theorem F2.** *Over $\mathbb F_2$ (indeed over any field of characteristic $2$), with $\Lambda=u_2\partial_3+u_3\partial_2+u_1\partial_4+u_4\partial_1$:*
1. *$\Lambda^2=E$, the Euler operator; hence $\ker\Lambda|_{\deg N}=0$ for odd $N$, and $\Lambda^2=0$ on even degree.*
2. *In the variables $a=u_1+u_4,\ x=u_1,\ b=u_2+u_3,\ y=u_2$, on even degree $\Lambda=D:=a\partial_x+b\partial_y$, and*
$$\ker D=\mathbb F_2[a,b,x^2,y^2]\ \oplus\ (bx+ay)\,\mathbb F_2[a,b,x^2,y^2].$$
3. *Consequently $\dim\ker\Lambda|_{\deg2n-2}=P_n+P_{n-1}=\dfrac{n(2n^2+1)}{3}$, the $n$-th octahedral number, with $P_n=\frac{n(n+1)(2n+1)}6$ the square pyramidal number.*
4. *On even degree $N$, $\Lambda$ is square-zero with $\binom{N+3}3-\frac{n(2n^2+1)}3$ Jordan blocks of size $2$ and $\frac{2n(2n^2+1)}{3}-\binom{N+3}{3}$ of size $1$; on odd degree it is an involution with $(\Lambda+1)^2=0$.*

*Proof.* (1) In characteristic $2$ the square of a derivation is a derivation ($\Lambda^2(fg)=\Lambda^2f\cdot g+2\Lambda f\Lambda g+f\Lambda^2g$), and $\Lambda^2u_i=u_i$ for each $i$ ($\Lambda u_1=u_4$, $\Lambda u_4=u_1$, $\Lambda u_2=u_3$, $\Lambda u_3=u_2$, the signs of the original $\Lambda$ being invisible mod $2$); so $\Lambda^2=E$, which is $N\cdot\mathrm{id}$ on degree $N$: the identity for odd $N$ (so $\Lambda$ is injective), zero for even $N$. (2) The change of variables is invertible ($u_4=a+x$, $u_3=b+y$), and $\Lambda a=a$, $\Lambda x=a+x$, $\Lambda b=b$, $\Lambda y=b+y$, so $D=\Lambda-E$ is a derivation with $Da=Db=0$, $Dx=a$, $Dy=b$, and $\Lambda=D$ on even degree. Both summands on the right lie in $\ker D$ ($D(x^2)=2ax=0$, $D(bx+ay)=ba+ab=0$). For the converse invert $a$: in $\mathbb F_2[a^{\pm1},b,x,y]$ take coordinates $(a,b,x,u)$ with $u=bx+ay$; then $D=a\,\partial_x$ at fixed $(a,b,u)$, whose kernel is the polynomials in $x$ with only even powers, $\mathbb F_2[a^{\pm1},b,u][x^2]$; since $u^2=b^2x^2+a^2y^2$ this is $\mathbb F_2[a^{\pm1},b,x^2,y^2]\oplus u\,\mathbb F_2[a^{\pm1},b,x^2,y^2]$. Now $\mathbb F_2[a,b,x,y]$ is free over $\mathbb F_2[a,b,x^2,y^2]$ on $\{1,x,y,xy\}$, and $g_0+g_1u=g_0+(g_1b)x+(g_1a)y$; if this is a polynomial then $g_0$, $g_1b$, $g_1a$ are polynomials, and $a\nmid b$ forces $g_1$ to be one. (3) Monomials $a^ib^j(x^2)^k(y^2)^l$ of degree $N=2n-2$ number $\sum_{t=0}^{n-1}(N-2t+1)(t+1)=P_n$, and the second summand contributes the same count in degree $N-2$, i.e. $P_{n-1}$; $P_n+P_{n-1}=\frac n6\big[(n+1)(2n+1)+(n-1)(2n-1)\big]=\frac{n(2n^2+1)}3$. (4) $D^2=a^2\partial_x^2+b^2\partial_y^2$ kills every monomial in characteristic $2$ (coefficients $k(k-1)$), so $\Lambda^2=0$ on even degree and the Jordan blocks have size $\le2$; their number is the rank. $\square$

Checks: $P_2+P_1=5+1=6$, $P_3+P_2=14+5=19$, $P_4+P_3=30+14=44$ — Opus's measured $6,19,44$; his predictions $344,489,670$ are $P_8+P_7$, $P_9+P_8$, $P_{10}+P_9$. His question "is it the $q\to2$ limit of anything?" — no: Theorem F1's formula evaluated at $q=2$ gives $\sum_{|j|\le J}(n^2-4j^2)=40$ at $n=4$, not $44$. The $q=2$ count is *geometric* (a Frobenius-twisted Weitzenböck invariant ring) where the odd-$q$ count is *spectral* (aliasing of the $U(1)$ weight): at $q=2$ the Hopf circle has lost its characters altogether, and what is left is the shape of the tetrahedron $i+j+2k+2l=N$ — the octahedral numbers are its lattice points.

---

## 5 · Corpus synthesis — what I found, now that I may read

### 5.1 The deaf denominators are Korselt's, and the self-dual comb is a coincidence with a reason (DERIVED-HERE; L-0019/L-0245 KNOWN-in-corpus)
Theorem A5's "iff $b\mid6$" has a name: $m^3\equiv m\pmod b$ for all $m$ iff $b$ is squarefree and $(p-1)\mid2$ for every prime $p\mid b$ — the Korselt criterion for exponent $3$ — whose solutions are exactly $b\in\{1,2,3,6\}$. Opus's cross-check that the corpus's $H_6=6\mathbb Z/36$ "equals its own DFT" is L-0245(iii)/L-0019 (`GENERAL MATHEMATICS LIBRARY.md` lines 199, 971): $\mathcal F\mathbf 1_S=\mathbf 1_S$ has a solution iff $N=n^2$, uniquely $S=n\mathbb Z/N$. The two facts meet at $N=36$ because $6$ is both the largest Korselt modulus for cubes and a perfect-square root; they are not the same fact, and a comb of spacing $5$ on $\mathbb Z/25$ is self-dual but not deaf. The print should say "Fermat/Korselt", not "uncertainty", for the ceiling.

### 5.2 The corpus's open Airy problem is a fold, and the fold is measurable (DERIVED-HERE; Y-0143/0144 KNOWN-in-corpus)
`YMD-DISK-01` lines 607–621 (Y-0143, remark at 613): the diagonal symbol $\{j\,j\,J;\,j\,j\,J\}$, $D_j=\sum_J(2J+1)|\{\cdot\}|\sim0.87\sqrt j$ measured to $j=800$ with the Ponzano–Regge endpoint constant $C=0.8607$, and the sentence *"a uniform fold/Airy asymptotic of the diagonal isosceles $|6j|$ is needed to upgrade $\rho\to0$ to PROVED."* The tetrahedron is isosceles with $V^2=\tfrac1{72}(2l_j^2-l_J^2)l_J^4$ ($l=J+\tfrac12$), flat at $l_J=\sqrt2\,l_j$: that is a **fold caustic**, and near it $V\approx\tfrac{2^{1/4}}3\varepsilon^{1/2}j^3$ with $\varepsilon=(J_c-J)/j$. The Ponzano–Regge amplitude $(12\pi V)^{-1/2}\propto\varepsilon^{-1/4}j^{-3/2}$ is regularised on the Airy scale $\varepsilon\sim j^{-2/3}$, giving the **fold scaling law** $|\{j\,j\,J_c;\,j\,j\,J_c\}|\asymp C_{\rm fold}\,j^{-4/3}$ over a layer of width $\Delta J\sim j^{1/3}$; the layer's contribution to $D_j$ is $2J_c\cdot\Delta J\cdot j^{-4/3}=O(1)$, and the tail beyond the fold is exponentially small. Hence $D_j=0.8607\sqrt j+c_0+o(1)$ — the corpus's SOFT law with its first correction, and $\rho_j=1/D_j\to0$ at rate $j^{-1/2}$ follows once the fold term is bounded, which the scaling does. MEASURED (`bf-r5-sixj`, exact Racah, mpmath dps 50):

| $j$ | $D_j$ | $D_j/\sqrt j$ | $D_j-0.8607\sqrt j$ | $J_c=\sqrt2(j+\tfrac12)-\tfrac12$ | $\max\lvert6j\rvert$ in the fold layer | exponent of that max, $j\to2j$ |
|---|---|---|---|---|---|---|
| 10 | $2.693749$ | $0.8518$ | $-0.028$ | $14.35$ | $1.374\times10^{-2}$ | $-1.261$ |
| 20 | $3.983619$ | $0.8908$ | $+0.134$ | $28.49$ | $5.733\times10^{-3}$ | $-1.252$ |
| 40 | $5.370362$ | $0.8491$ | $-0.073$ | $56.78$ | $2.408\times10^{-3}$ | $-1.298$ |
| 80 | $7.763797$ | $0.8680$ | $+0.065$ | $113.34$ | $9.792\times10^{-4}$ | $-1.331$ |
| 160 | $10.67171$ | $0.8437$ | $-0.215$ | $226.48$ | $3.891\times10^{-4}$ | — |

The fold exponent converges to $-\tfrac43$ ($-1.331$ on the last doubling), the remainder $D_j-0.8607\sqrt j$ is bounded and oscillates with the corpus's period-3 pattern rather than growing, and the tail beyond the fold widens as $j^{1/3}$ (at $j=160$ it drops by a factor $\approx2$ per step, the Airy layer's $\sim5$ steps wide). That is the corpus's open item at the MEASURED level: $\rho_j=1/D_j=1/(0.8607\sqrt j+O(1))\to0$. The uniform formula itself is Schulten–Gordon (1975) in its fold form; its constant against the measured $C_{\rm fold}\approx0.21$ (the value $|6j|\,j^{4/3}$ at the fold, noisy because the integer $J$ nearest $J_c$ wanders inside the layer) is Q34.

### 5.3 The two Stokes calculi are one, and the corpus already knew where the Bessel pole was (Y-0133 KNOWN-in-corpus)
Opus's Theorem S1 is right and its attribution is off by five entries: "$A=2.0027$" is Y-0133 (line 523, "order 60, monotone $\to2$"; also $K_1/I_1/e^{-2\beta}\to\pi$), Y-0138 (lines 563–569) carries the Richardson window and the Borel–Padé pole $2.26$, and Y-0139 the Ext$^1$ reading. So the corpus had located the pole at $2$; S1 supplies the closed form $a_k(\nu)=\frac{(-1)^k\cos\pi\nu}{\pi}\frac{\Gamma(k+\nu+\frac12)\Gamma(k-\nu+\frac12)}{\Gamma(k+1)2^k}$ and the constant $-2/\pi$. With Theorem A7 the programme now has **three** observables — $\alpha^*$, $|I|_{\max}$, $\sigma_0$ — whose late terms are "the companion's series over $2\pi$" pushed through a chain rule, with constants $\tfrac1{6\pi e}$, $\tfrac1{2\pi e}$, $-\tfrac2\pi$: one calculus, two classical pairs. That is the print's Thread A in one sentence.

### 5.4 The instrument: where DEFECT WAIT lands in the dossier's own law
The dossier (`LAMBDAWAVES STUDY RESEARCH DOSSIER 2026-09-02.md`; the file name has a space, not a colon) decides the FILTER-versus-DEFECT-WAIT question by itself. Its law is §7.4, line 776: *"The user must always be able to tell whether they changed the state, the representation, or the observer,"* implemented as the dual readout `OBSERVER: Rxy +31° / STATE: identity` (§17.4, lines 1596–1599; §2.4 line 362). Its taxonomy of state changes is §20.3, line 1754: *kick = phase imprint | dipole pulse | momentum displacement | coefficient-space op, never merged*. And §18.3, line 1670, is the sentence that kills Round 3's FILTER as a state operation: *"Cull the observation, never the state"* — the renderer may drop low-contribution modes from a frame, never from the authoritative coefficient vector. So a non-unitary projection was never admissible in this instrument, and Opus's DEFECT WAIT is not merely the better choice, it is the only one of the two the dossier allows: a coefficient-space op, a phase imprint indexed by $l$, unitary, in-shell, badged `STATE: e^{iαL²}` with `OBSERVER: identity`. Two smaller closures. §18.1, line 1652, *"An implementation must not be its own only oracle"* (born of the engine4 quaternion sign that self-verified because implementation and reference shared the error), is the law this programme's two-lab protocol enforces — every constant above was fitted by one lab and derived by the other. §20.1, lines 1738–1746, lists what the KS view still owed, including *"relation between fictitious and physical time"*: Opus's Round 2 closed it with $dt=r\,ds$, and the dossier's §5.1 (line 532) $\mathbf c=\mathbf q+i\mathbf p$ without the $\sqrt2$ is the convention Round 2 flagged. What the dossier does **not** contain — no $l$-dependent phase, no quantum defect, no revival arithmetic beyond "fractional revivals at rational fractions of $T_{\rm rev}$" (§8.2, lines 808–821), no vortex lines, no finite-field shell — is the measure of what these five rounds added to it. Its own open item §20.9 (lines 1778–1784), *an arithmetic unification theorem coupling the Gauss/Frobenius, functional-graph and zeta spectra — "until such a theorem is established, render these as linked but distinct spectral layers"*, is not touched by Theorems F1/F2: they bridge the shell to $\mathbb F_q$, not the three spectra to each other.

### 5.5 What I looked for and did not find
No Jessen–Tornehave or mean-motion theorem (L-0250 is the only zero-counting lemma; its proof cites Pólya 1920, Schwengeler 1925, Langer 1931); no incomplete-sum bound; no Airy content outside Y-0143/0144 and no Schulten–Gordon; no Laguerre, Sturm, interlacing or characteristic-$p$ invariant theory (Theorem F2 has no ancestor); nothing on hydrogen, Kepler or Runge–Lenz in YMD-DISK-01. In the finite-field handoff (`FINITE FIELD SPECTRAL DYNAMICS FRONTIER HANDOFF 2026-08-23.md`, 4552 lines): §30 (lines 1535–1597) gives the cubic period polynomial in general, $F_{3,p}(x)=x^3+x^2-\tfrac{p-1}3x-\tfrac{(L+3)p-1}{27}$ with $4p=L^2+27M^2$, $L\equiv1\ (3)$, $\operatorname{Disc}=p^2M^2$ — Opus's $x^3+x^2-12x+11$ at $p=37$ is its $L=-11$, $M=1$ instance; §42–43 (lines 2169–2336) construct the Desarguesian spread and the elliptic quadric $Q^-(3,q)$ with the boxed $\mathbb P^1(\mathbb F_{q^2})\cong Q^-(3,q)$, and §75 (line 3701) lists *"prove the $q^2+1$ point count"* as still owed; §14 (lines 751–801) makes $37$ "balanced" as the unique $p\equiv1\ (6)$ with $(p-1)/6=6$ (the $w^2+1$ ladder Opus cited is the CM-sextic file's, not this one's); there is no derivation kernel, no Frobenius-kernel or characteristic-$p$ invariant theory, so Theorems F1 and F2 have no ancestor there either.

### 5.6 S9 — the count the handoff still owes, in two lines (DERIVED-HERE; closes §75's item)
In the chart of §43 the quadric is $x_1x_2=a^2-\Delta b^2=N(a+b\sqrt\Delta)$ with $\Delta$ a non-square. Count affine solutions in $\mathbb F_q^4$: for each of the $q^2-1$ pairs $(a,b)\ne(0,0)$ the norm is non-zero (that is what "non-square" buys) and $x_1x_2=N$ has $q-1$ solutions; for $(a,b)=(0,0)$, $x_1x_2=0$ has $2q-1$. Total $(q^2-1)(q-1)+2q-1=q^3-q^2+q$; remove the origin and divide by the $q-1$ scalars: $\dfrac{q^3-q^2+q-1}{q-1}=q^2+1$. $\square$ The handoff's bijection with $\mathbb P^1(\mathbb F_{q^2})$ then needs no separate count. It is the easy piece nobody had picked up, and the protocol says to pick it up.

---

## 6 · The final conjecture, as the print should carry it

Opus's Ω₃ was right in shape and wrong in one clause. Restated with the theorems it now rests on:

> ### Conjecture Ω₅ (the revival hears the packet, not the ladder)
> *For a population profile $p$ on the Rydberg ladder let $\mathcal A(p;a/b)=\lVert p\rVert_1^{-1}\max_x|\sum_mp_me(am^3/b+xm)|$ be the cubic-level revival height, $a/b=4d^3/3\bar n$ in lowest terms, $T_{\rm eff}=\lVert p\rVert_1^2/\lVert p\rVert_2^2$.*
> 1. **(ceiling — THEOREM A5, Fermat/Korselt)** $\mathcal A=1$ iff $m\mapsto am^3$ is affine on $\operatorname{supp}p$; for a full comb of spacing $d$ iff $b\mid6$.
> 2. **(floor — THEOREM A8 for the bound, CONJECTURE for the gain)** $\mathcal A\ge\lVert p\rVert_2/\lVert p\rVert_1$ always, and $\inf_{a,b}\mathcal A(p;a/b)=\dfrac{\lVert p\rVert_2}{\lVert p\rVert_1}\sqrt{\ln T_{\rm eff}+c_0}\,(1+o(1))$ as the modulus range grows, with $c_0=\tfrac12$ for uniform combs: the floor is the Parseval bound times a Salem–Zygmund gain at **half** the random variance, and no arithmetic enters it.
> 3. **(extremal packets — KNOWN-in-corpus, L-0245)** among profiles of support size $T$ the Parseval floor $T^{-1/2}$ is attained exactly by the modulated subgroup-coset indicators.
>
> *Falsifiers: a packet and a fraction with $b\nmid6$ and $\mathcal A>0.99$ at quartic $<0.05$; or a family inside the incomplete régime on which $\kappa^2-\ln T_{\rm eff}$ moves by more than $0.3$.*

And the analytic companion, now with two observables behind it:

> ### Conjecture Ω₄′ (Airy universality of the revival — Opus's Ω₄, sharpened)
> *Every stationarity- or moment-defined observable of $I(\alpha,\beta)$ has a Gevrey-1 series in $\beta^2$ with singulant $\chi_W=-\tfrac1{54}$, late terms $\propto(-54)^k\Gamma(k)$, leading constant in $\tfrac1{\pi e}\mathbb Q$ and every $b_r\in\mathbb Q$; the constants of $\alpha^*$ and $|I|_{\max}$ are $\tfrac1{6\pi e}$ and $\tfrac1{2\pi e}$.* Evidence: Theorems A6′ and A7. Falsifier: any third observable (the half-width, the second alias) with a different singulant or an irrational constant.

---

## 7 · Questions Q30–Q35

**Q30 (DEEPEN — the gain).** Prove $\kappa^2=\ln T+c_0+o(1)$ for uniform combs: the minimum over the reduced fractions $a/b\le B$ of $\sup_x|\sum_{|m|\le T/2}e(am^3/b+xm)|/T$, as $B\to\infty$ with $T$ fixed then $T\to\infty$. Salem–Zygmund gives $\sqrt{2\ln T}$ for the typical pattern; why is the extremal cubic pattern at half the variance? Predict $\kappa$ at $T=129$ with $b\le300$ before computing it.

**Q31 (LOCATE — the rate).** Compute the balance radii of the four adjacent frequency pairs of the cubic's discriminant across the dominance window, apply Theorem C6's $\theta$-elimination, and reproduce Opus's $1480$ (or correct it) from $\tfrac1{2\pi}\sum|\Delta\omega|\cdot\#\text{balance radii}$.

**Q32 (DEEPEN — the dictionary's second row).** Derive $b_1'$ of $|I|_{\max}$ from Opus's dictionary (as he did $b_1=-\tfrac79$ for $\alpha^*$) and compare with the Richardson value $-\tfrac{13}{18}$; then $b_2$ for both. Why is $\alpha^*$'s $b_1$ a $\tfrac79$ and $|I|_{\max}$'s a $\tfrac{13}{18}$ — is there a rule for the ratio of constants ($3$ here) and the difference of $b_1$'s ($\tfrac1{18}$) across Ω₄′'s observables?

**Q33 (BROADEN — the odd degrees at $q=2$).** On odd degree $\Lambda$ is an involution with $(\Lambda+1)^2=0$; count its Jordan blocks (equivalently $\dim\ker(\Lambda+1)$) in closed form, and say what the $\mathbb F_{2^e}$ shell "is" when its kernel is the octahedral number — is there a finite-geometry object with $\tfrac{n(2n^2+1)}3$ points that plays the rôle of the Hopf fibration's $q^2+1$?

**Q34 (LOCATE — the fold constant).** Take the Schulten–Gordon uniform Airy form at the isosceles fold and evaluate $C_{\rm fold}$ in closed form; test against the measured $|\{j\,j\,J_c;\,j\,j\,J_c\}|\,j^{4/3}$ at $j=80,160$; then the $O(1)$ term $c_0$ of $D_j$.

**Q35 (BROADEN — the gate count).** Given universality (§2.2), find the minimum number of alternating $(SU(2)\times SU(2),\ e^{i\alpha\mathbf L^2})$ layers that reaches an arbitrary $n=3$ shell state from $|3s\rangle$ (parameter count gives $\ge3$), and the $\alpha$-schedule.

---

## NOT CERTIFIED

- Theorem A7's constant $\tfrac1{2\pi e}$ is MEASURED to seven digits and DERIVED at leading order by the same chain as Opus's A6′; its $b_1'=-\tfrac{13}{18}$ is a Richardson value (six digits) and not yet a dictionary derivation. The exact identity for $|I|_{\max}$ is formal algebra and holds term by term; the last computed coefficient $D_{60}$ lacks one contribution of the exponent series and was excluded from every fit.
- The $\kappa^2=\ln T+\tfrac12$ law rests on four uniform combs ($T\le33$) inside the incomplete régime with $b\le60$; the Gaussian tapers show the growth but not the constant. The $T=65$ row is a different régime and is excluded honestly, not silently.
- Theorem C6′ assumes simple nodes and a window whose closure avoids $0$; both hold for the two states measured and are checked numerically, not proved in general.
- Q28's rate formula is a structural statement; the balance-radius census and the $\theta$-elimination have not been carried out, so $30.5668$ is not derived.
- Theorem F2 is proved. Theorem F1's $b_r$ for $r\ge2$ (A6′) and Theorem S1's closed form are Opus's and were not re-derived here.
- The Lie-closure verdicts for $n=2,3,4,5$ are numerical rank computations (Gram–Schmidt on $2n^4$-dimensional real vectors, tolerance $10^{-9}$, two independent implementations agreeing); "universal for every $n$" remains Opus's conjecture, and no gate count was computed.
- The $6j$ fold scaling $j^{-4/3}$ is DERIVED from Ponzano–Regge plus the Airy layer and MEASURED on four doublings ($-1.26\to-1.33$); the constant $C_{\rm fold}\approx0.21$ is read off integer $J$ inside a layer only $\sim j^{1/3}$ wide and is good to one digit; no uniform formula was evaluated, and $c_0$ in $D_j=0.8607\sqrt j+c_0+o(1)$ is only bounded ($|c_0|\lesssim0.25$), not determined.
- No GPU ran; nothing under `lab/` or `tests/`; no server; no git.
