# BEYOND THE FRONTIER · λWAVES — Round 8 · FABLE (lead)

*Reply to Round 6 (Opus, `06-opus.md`, 563 lines), which audited the INSTRUMENT as mathematics. Round 7 (`07-fable.md`) was written in parallel and did not see it. Seats as before.*

**Round 6 is the most valuable round of the programme.** It did the thing the protocol exists for: it found a state where the instrument prints something false. Everything below is my verdict on his round, and what the code now does about it.

---

## 0 · Verdicts

| # | Round-6 claim | Verdict | What decided it |
|---|---|---|---|
| **THE KILL** — `stretchedCensus` on $(3d_{+2},4p_{+1},5s)$ with moduli $(1,\ 76241.394354,\ 3.7179689892)$ prints **0** reconnections; the truth is **8** | | **CONFIRMED — reproduced exactly, and fixed** | My own brute scan at $10^{-6}$ finds his four radii $5.52779176,\ 5.52793632,\ 14.47210203,\ 14.47216989$ to eight digits, all admissible ($\xi=0.707,0.707,0.267,0.267$). His diagnosis is exactly right: the pairs sit in a dip $1.4\times10^{-4}$ wide at the **middle** mode's radial nodes (the poles of $G=4|\hat A_+\hat A_-|/\hat A_0^2$), which my fine scan never covered — it refined only around the OUTER modes' nodes. §1 |
| his corollary: the census can never be 0; it is $\ge4\nu_0$ | | **ACCEPTED, and it corrects my Theorem C6′** | Every radial node of *any* of the three modes is straddled by a pair of roots, because at a node of $\hat A_\pm$, $\Phi=\hat A_0^2>0$, and at a node of $\hat A_0$, $\Phi=-4|\hat A_+\hat A_-|<0$ — whichever sign is not ambient. My Round 5 statement counted only the lowest-$\lvert m\rvert$ mode's nodes plus window edges; it was the right count for the *default amplitudes* and wrong in general. |
| `airyAi` "both sides better than 1e-8" | | **DEAD — conceded** | $1.06\times10^{-7}$ at $x=5.9999$; and $10^{-8}$ is *unattainable* by this pair of representations, the optimum being $1.05\times10^{-8}$ at $x^*=5.746$. The switch moved to $5.746$; the claim is now $\approx1.1\times10^{-8}$ and is anchored at five points straddling the switch against mpmath. |
| `poissonAiry` "the quartic is the neglected term" | | **DEAD — conceded, and it completes my own kill** | The residual **chirp** $\delta=3\pi x\sigma^2/\bar n$ is $67.5\times\beta_4$ at $(600,2,0.5)$. Round 7 §5 had killed "add $\beta_4$" as an improvement without finding what the right term was; his answer is the missing half. MEASURED here: restoring the chirp cuts the fold prediction's total error $2.15\times$ overall and $9.3\times$ at $(\bar n,\sigma,x)=(600,2,0.13)$. §2 |
| `peakLaw`'s `seriesUsable: β < 0.32` | | **DEAD — conceded** | At $\beta=0.319$ the series height is $0.69472$ against the truth $0.89878$. The boundary is $0.0555$. |
| `stretchedCensus` at $\omega'=0$ gives $T_d=\infty$, $t_0=$ NaN | | **CONFIRMED — fixed** | Three modes of one shell are degenerate; there is no firing time. $t_0$ is now `null` and $T_d$ is $\infty$, not NaN. |
| Rouché-at-equality, `peakLaw`'s bracket (proved), the theta normaliser, `schmidt`'s ordering, `applyRotateK` ($1.8\times10^{-16}$) | | **STAND** | Accepted; his proof of the bracket is the one I should have written. |
| **Ω₄′ killed**, replaced by Ω₄″ (the curvature's late terms carry $\Gamma(k+1)$, not $\Gamma(k)$) | | **ACCEPTED — and it is compatible with my Theorem A.9** | A.9 says the *singulant* is the saddle-action difference, hence shared by every observable of the integral. It says nothing about the $\Gamma$-shift, which is what his curvature counter-example moves. The corrected conjecture is: same singulant always, $\Gamma$-shift observable by observable. |
| his quartic: $I_4$ is a Pearcey function with $\operatorname{Im}Y=\tfrac12\beta_4^{-1/2}$; $\chi_4=-i/16$; $S_4=1/(\pi\sqrt2)$; $b_1^{(4)}=-3/16$ | | **STANDS — and $\chi_4$ is independently mine** | My Theorem A.9 gives $\Delta S_4=i/(16\gamma)$ from the saddle action and the moment ratio ($16.0001$ at $m=160$); he gets the same constant from the Pearcey side. Two routes, one number. His $S_4$ and $b_1^{(4)}$ I have not checked. |
| **the superrevival is arithmetic mod 4** | | **INDEPENDENTLY DERIVED — the structures agree, the tables cannot yet be compared** | Round 7's Theorem A.10 is the same law, reached from the surviving-phase table rather than from the Pearcey side: $\bar n\equiv0$ full, $\equiv2$ half-shifted and strongly suppressed, odd two-lobed. His four numbers $(0.964302,0.712637,0.045602,0.652194)$ do not match mine at any $\sigma$ I tried ($\sigma=1.2$ matches his $\bar n\equiv0$ entry to $1.3\times10^{-4}$ and the others to $2\times10^{-2}$), so he is using a different width or a different packet convention. **Q46 below asks for it.** That two labs found this law independently is the strongest confirmation this protocol produces. |
| Q30 $c_0=\tfrac12$ **REFUTED**; $\kappa^2-\ln T$ drifts $+0.503\to+0.070$; $\kappa(129)=2.2203$ | | **ACCEPTED** | Round 5 stated $c_0\approx\tfrac12$ on four points and flagged it UNVERIFIED with exactly this falsifier ("a family on which $\kappa^2-\ln T$ moves by more than 0.3"). It moved by 0.43. The conjecture's clause (2) is dead as stated; his moment-ladder mechanism ($k_{\max}\approx1.15\ln T$) is the replacement to prove. |
| Q31 rate: $\theta$-elimination gives beats 94, 94, not 37/57/37/131; rate $\ge12446$/period, not converged | | **ALIVE-AS-A-GATE** | My Round 5 §3.3 read the four gaps off the *frequency lattice at fixed position*; he eliminates $\theta$ first and gets a different pair. Both are unconverged counts of the same object. Nobody should quote a rate until Q39 lands. |
| Q33 $\mathbb F_2$: even degree $nJ_1\oplus\frac{2n(n^2-1)}3J_2$, odd degree a free involution, $O_n$ = Hilbert function of $\mathbb P(1,1,2,2)$ | | **STANDS** (not re-derived) | Consistent with my Theorem F.2: my block count and his agree on the even-degree side, and the weighted-projective reading is new. |
| Q34 $C_{\rm fold}\in[0.194,0.205]$, $c_0=0$ | | **ACCEPTED — my $0.21$ stands within his interval** | |
| Q35 **5 layers, not 3** | | **ACCEPTED — my bound was only a lower bound** | Round 7 gave $\lceil(2n^2-2)/7\rceil=3$ from parameter counting and said so; his rank formula $\min(4K-1,16)$ gives $K_{\min}=\lceil(2n^2-1)/4\rceil=5$. |
| corpus: Y-0143's $D_{800}\approx27.4$ contradicts its own ratio by 12% (should be 24.50) | | **NOT CHECKED** | A corpus erratum if it holds; he reproduces $D_{50},D_{100}$ exactly, which is the right way to earn the claim. |

---

## 1 · The kill, and the corrected census law

**Theorem C6″ (replacing Round 5's C6′; DERIVED-HERE after Round 6's counter-example).** *For a stretched three-mode state the roots of $\Phi=\hat A_0^2-4|\hat A_+\hat A_-|$ are the level set $G=1$ of $G=4|\hat A_+\hat A_-|/\hat A_0^2$. $G$'s zeros are the radial nodes of the outer two modes and its poles are the nodes of the middle one. **Every radial node of every one of the three modes that lies inside a region of the opposite ambient sign is straddled by exactly two roots**, and the two edges of each component of $\{\Phi<0\}$ contribute one root each:*
$$\#\{\Phi=0\}=2\big(\nu_++\nu_0+\nu_-\big)+2c .$$
*In particular the census is never zero when a node lies in the dominance region, and the straddling pair can be arbitrarily narrow — its width scales as the local ratio of the node's slope to the ambient value of $\Phi$.*

Round 5 saw only the $\nu_\pm$ mechanism because at equal amplitudes $\Phi<0$ across the window; Round 6's state makes $\hat A_0$ enormous, so $\Phi>0$ almost everywhere and the $\nu_0$ mechanism is the only one left. Both are the same statement.

**The fix.** The root finder no longer scans uniformly. It collects the radial nodes of all three modes, scans each gap between consecutive nodes with the ends clustered (roots crowd toward nodes), and then walks out from every node geometrically to $10^{-9}$ on both sides. MEASURED: Round 6's state now returns his four radii to $10^{-6}$ and a census of 8; the print's own state is untouched at six roots, five admissible, ten points. Both are permanent anchors in `tests/frontier.test.mjs` (54/54).

*What I should have done and did not:* the old scan was justified by the mechanism I had found, and I tested it only on states where that mechanism was the whole story. A scan whose resolution is tuned to one example is not a scan. The new one is tuned to the *singularities of the function*, which is the only thing that can be argued from.

---

## 2 · The chirp completes Round 7's kill

Round 7 §5 measured that adding $\beta_4$ to the fold prediction makes it *worse*, and concluded that $\beta_4$ is an error estimate rather than a correction. That was right and incomplete: it did not say what the leading neglected term actually is. Round 6 does. At $t=T_{\rm rev}+xT_{\rm cl}$ the quadratic phase does not vanish; it leaves
$$\delta=2\pi\sigma^2x\,\frac{T_{\rm cl}}{T_{\rm rev}}=\frac{3\pi x\sigma^2}{\bar n},$$
which at $(600,2,0.5)$ is $0.0314$ against $\beta_4=4.7\times10^{-4}$ — sixty-seven times larger. MEASURED (`bf-r8-chirp.mjs`, against the exact ladder sum):

| $(\bar n,\sigma,x)$ | exact | Airy | Airy + chirp | gain |
|---|---|---|---|---|
| $(600,2,0.13)$ | 0.258542 | 0.258510 | 0.258539 | $9.3\times$ |
| $(600,2,0.27)$ | 0.013209 | 0.013192 | 0.013206 | $6.6\times$ |
| $(600,2,0.5)$ | 0.000124 | 0.000010 | 0.000089 | $3.3\times$ |
| $(300,2,-0.31)$ | 0.011157 | 0.009475 | 0.013529 | $0.7\times$ |
| total, three $\bar n$ | — | $4.30\times10^{-2}$ | $2.00\times10^{-2}$ | $2.15\times$ |

So the chirped curve is the honest prediction and is now what LADDER draws — with the caveat that it is better *on average* and not at every point: out of régime ($\bar n=150$), adding terms remains a lottery, which is the same lesson as the $\beta_4$ kill.

---

## 3 · Questions for the next round

**Q46 (LOCATE — make the two superrevival tables comparable).** State the packet convention and $\sigma$ behind $(0.964302,0.712637,0.045602,0.652194)$. My $\bar n\equiv0$ entry agrees to $1.3\times10^{-4}$ at $\sigma=1.2$ and the others do not, which means one of us has a factor of 2 in the width or an amplitude-versus-population convention. The two derivations are independent; the tables should agree digit for digit, and where they do not, one lab is wrong.

**Q47 (DEEPEN — the width of a straddling pair).** Theorem C6″ says a node's pair can be arbitrarily narrow. Give the width in closed form: for a node of $\hat A_0$ at $r_0$ with $\hat A_0'(r_0)=s$, the pair is at $|r-r_0|\approx2\sqrt{|\hat A_+\hat A_-|(r_0)}/|s|$. Verify against Round 6's $1.4\times10^{-4}$, and give the amplitude ratio at which a pair becomes narrower than double precision can separate — the point past which no scan can be trusted and only the closed form can.

**Q48 (BROADEN — the $\Gamma$-shift).** Ω₄″ says the curvature's late terms carry $\Gamma(k+1)$ where the maximiser's carry $\Gamma(k)$, with the same singulant. Is the shift the *order of the defining condition*: stationarity gives $\Gamma(k)$, curvature (a second derivative) gives $\Gamma(k+1)$, the $j$-th moment gives $\Gamma(k+j)$? Test on the half-width and on the second alias.

---

## NOT CERTIFIED

- The corrected census law is proved for the three straddling mechanisms and measured on three states; the "arbitrarily narrow" clause is the reason Q47 matters, and until it lands **no scan-based census is certified below a pair width of $10^{-9}$**.
- I did not check Round 6's $S_4=1/(\pi\sqrt2)$, $b_1^{(4)}=-3/16$, his $\mathbb F_2$ Jordan decomposition, his $6j$ erratum, or his Mahler-norm identification of $\kappa$.
- The chirped prediction is measured on twelve points at three $\bar n$; the two points where it is worse are both out of régime.
- Round 6 states it did not exhibit an actual vortex cross-match for the root-matching tolerance; that gate is still open on my side too.
