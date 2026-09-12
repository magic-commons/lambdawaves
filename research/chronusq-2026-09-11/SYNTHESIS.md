# λWAVES · ChronusQ, the kinetics ladder, and the corpus — synthesis of 2026-09-11

Commissioned by Josh ("deep research and git exploration of ChronusQ … we haven't incorporated most of the math have we? Perform any research, theorize, synthesize … how mathematicians and researchers are prompting and harnessing their Claudes … if we can pull off Astra's basic ideas, we can finally move towards simulating chemistry-kinetics"). Written by Claude Fable 5.1 as lead, from five reports in this directory: A (ChronusQ map, Opus 5), B (Claude for mathematics, Sonnet 5), C (the Navier–Stokes claim, Sonnet 5), D (the kinetics ladder, Opus 5), E (Opus 5 as Fable, Sonnet 5). Branch `dev`; `main` is frozen.

Status marks. **[V]** re-run by the lead. **[A]** computed by the agent in its session, script inlined in its report, not re-run by the lead. **[S]** read in a primary source by an agent. **[U]** unverified.

## 1. The answer

**Proposition 1.** The current tree contains none of ChronusQ's mathematics. ChronusQ propagates a one-particle density matrix of a self-consistent-field state in a Löwdin-orthonormalised Gaussian basis under a length-gauge dipole field, with unitary steps built by Hermitian diagonalisation of the Fock matrix, fed by relativistic (X2C, four-component) and correlated (CC, CAS, NEO) tiers. λWAVES propagates a coefficient vector of one electron by an exponential midpoint on the generalised eigenproblem, in a Slater/Sturmian basis with exact two-centre integrals, plus a minimal-basis full CI. The overlap is structural only: a finite basis, atomic units, the length gauge. **[S]** A read of ChronusQ at HEAD `52ddf3c1` (530 source files, 36 wiki pages) and the package paper; a read of `lab/modrive.js`, `lab/mo.js`, `lab/h2ci.js`.

The gap map in A §6 has 54 rows: 12 port now, 20 port later, 6 never in a browser, 10 already present, and 6 where λWAVES holds what ChronusQ lacks (exact prolate two-centre Slater integrals, hydrogenic and Sturmian analytics, Xα atoms $Z \le 36$, the $e^{ikz}$ boost, GPU density rendering). The credit line in ABOUT is therefore inaccurate as written (§4).

## 2. ChronusQ's real-time core, in the app's conventions

Atomic units. $S$ the AO overlap, $X = S^{-1/2}$, $W = S^{1/2}$ (both already produced by `metricRoots` in `mo.js`). Tilde marks the Löwdin frame.

**Definition 1.** The AO density $D = \sum_k f_k c_k c_k^\dagger$ with occupations $f_k$, $N_e = \operatorname{Tr}(DS)$. In the Löwdin frame $P = W D W$, $\tilde F = X F X$, $D = X P X$.

**Proposition 2 (equation of motion).** From $i\,\dot{\tilde c} = \tilde F \tilde c$ and $P = \sum_k f_k \tilde c_k \tilde c_k^\dagger$,
$$ i\,\frac{dP}{dt} = [\tilde F, P]. $$
**Proof.** Differentiate the sum term by term; $\dot{\tilde c}_k \tilde c_k^\dagger = -i\tilde F \tilde c_k \tilde c_k^\dagger$ and $\tilde c_k \dot{\tilde c}_k^\dagger = i\,\tilde c_k \tilde c_k^\dagger \tilde F$ since $\tilde F$ is Hermitian. $\square$ **[S]** identical to `singleslater/rt.hpp:191–263`.

**Proposition 3 (the step).** For $\tilde F$ frozen over a step, $P(t+\Delta t) = U P(t) U^\dagger$ with $U = \exp(-i\Delta t\,\tilde F) = V e^{-i\Delta t\, w} V^\dagger$ from one Hermitian diagonalisation $\tilde F = V w V^\dagger$. A unitary similarity preserves the spectrum of $P$, hence idempotency $P^2 = P$ per spin and $\operatorname{Tr} P$ exactly; any drift of $\operatorname{Tr}(DS)$ is a defect of $S^{\pm 1/2}$, never of the integrator. **Proof.** Spectrum invariance under similarity; the trace is the sum of eigenvalues. $\square$

**Magnus-2 predictor–corrector** (needed as soon as $F$ depends on $P$): $F_0 = \tilde F[P(t),t]$; $P^* = e^{-i\Delta t F_0} P e^{+i\Delta t F_0}$; $F_1 = \tilde F[P^*, t+\Delta t]$; $\bar F = \tfrac12(F_0 + F_1)$; $P(t+\Delta t) = e^{-i\Delta t \bar F} P(t)\, e^{+i\Delta t \bar F}$ from the saved $P(t)$, never from $P^*$. **[S]** paper Eqs. 10–15 and `propagation.hpp:144–159`. The cheap variant MMUT uses $P(t+\Delta t) = U(t) P(t-\Delta t) U(t)^\dagger$ with $U(t) = \exp(-2i\Delta t \tilde F(t))$ and restarts with a Magnus-2 step every ~50 steps; without restart the even and odd sublattices diverge. Local error $O(\Delta t^3 \lVert [F(t), F(t')] \rVert)$; a unitary step has no stability limit, so a too-large $\Delta t$ fails silently with a perfectly normalised wrong answer. The only honest convergence statement: halve $\Delta t$, the change in the dipole trace must fall by at least four.

**Corollary 3.1.** For one electron with a field that does not depend on $P$, Magnus-2 with the midpoint field is the exponential midpoint of `modrive.js`; the existing module is the $N=1$ case of the port.

**Observation 1 (the length-gauge sign).** ChronusQ's papers (Goings 2016 Eq. 12, Kasper 2020 Eq. 17) write $h + \mathbf E\cdot\mathbf r$; the shipped code writes $h - \mathbf E\cdot\mathbf r$ and pairs it with the opposite energy bookkeeping; the wiki, and only the wiki, inverts the propagator signs. λWAVES agrees with the papers. Peak positions and $\lvert \mathrm{FT} \rvert^2$ spectra are unaffected; a signed dipole-trace comparison is not. There is no single "ChronusQ sign" to match; write λWAVES's own convention in the header and cite Goings 2016. **[S]**

## 3. The three ports

**Port 1 — δ-kick, dipole trace, absorption spectrum.** In neither codebase: ChronusQ writes the trace to HDF5 and its paper calls the transform "post processing at the users' discretion". Kick the ground state by $\tilde c \leftarrow e^{-i\kappa \tilde Z}\tilde c$, propagate field-free, record $\delta\mu(t) = \mu_z(t) - \mu_z(0)$, and take the damped sine transform $\operatorname{Im}\alpha_{zz}(\omega) = \kappa^{-1}\int_0^T \delta\mu(t)\, e^{-t/\tau} \sin\omega t\, dt$, $S(\omega) = \tfrac{2\omega}{\pi}\operatorname{Im}\alpha_{zz}$.

**Theorem 1 (two-level response).** For a two-level system with eigenstates $\lvert 0\rangle, \lvert 1\rangle$, gap $\omega_{01}$ and transition element $z_{01}$, kicked from $\lvert 0 \rangle$ with strength $\kappa$: $\delta\mu(t) = 2\kappa z_{01}^2 \sin\omega_{01} t + O(\kappa^2)$ and $\int_0^\infty S_{zz}(\omega)\,d\omega = 2\omega_{01} z_{01}^2$.
**Proof.** To first order the kick populates $\lvert 1\rangle$ with amplitude $-i\kappa z_{01}$; the cross term of $\langle z \rangle$ is $2\operatorname{Re}(-i\kappa z_{01} e^{-i\omega_{01}t}) z_{01} = 2\kappa z_{01}^2 \sin\omega_{01} t$ up to the sign convention $\mu = -z$. The sum rule follows from the sine transform of a single undamped sinusoid. $\square$

**Verification [V].** The lead re-ran the agent's inlined prototype (H₂⁺, STO-3G, $R = 2$, $\kappa = 10^{-3}$, $\Delta t = 0.05$, 40 000 steps, $\tau = 500$):

| quantity | measured | oracle | deviation |
|---|---|---|---|
| spectrum peak $\omega$ | 0.477753059 | $E_1 - E_0 = 0.477747587$ | $5.5\times10^{-6}$, 365× finer than the linewidth |
| peaks above 5 % of maximum | 1 | 1 | — |
| norm drift after 40 000 steps | $-5.35\times10^{-12}$ | 0 | roundoff |
| amplitude of $\delta\mu$ | $2.5450555\times10^{-3}$ | $2\kappa z_{01}^2 = 2.5450577\times10^{-3}$ | $2.2\times10^{-9}$ against the dropped $O(\kappa^2) = 10^{-6}$ |
| $\int S\,d\omega$ | 1.212991 | $2\omega_{01} z_{01}^2 = 1.215895$ | 0.24 % (finite window and damping) |

The sum overshoots $N_e = 1$ by 21.6 %; that is the STO-3G basis, to be reported, not tuned. **Falsifier.** Halving $\Delta t$ or doubling $T$ must move the peak by less than $10^{-6}$; a second peak above 5 % kills the two-level reading. **Fixture for the app.** The same run as an in-app proof, with the peak asserted against `mo.solve`'s own gap.

**Port 2 — density matrix in the Löwdin frame with Magnus-2.** §2 above. Cost per step for $N$ functions: eigendecomposition $\approx 5.3 N^3$ complex, two $N^3$ products for $U$, two for $UPU^\dagger$, and the in-core Fock build $\approx N^4/8$. Honest browser ceiling $N \approx 100$ (about 50 ms per Fock build, ten Magnus-2 steps per second); at $N = 300$ the $N^4$ term alone is $10^9$ flops per step. For every existing one-electron case ($N = 2 \ldots 42$) the cost is nil. Diagnostics to port, six lines each: $\operatorname{Tr}(P^2 - P)$ and $\lvert \operatorname{Tr}(DS) - N_e \rvert < 10^{-14}$; the purification $3P^2 - 2P^3$ only as a labelled repair, never silent. **Fixture.** H₂⁺ STO-3G, $\sigma_g$ start, the sin² pulse of `research/astra-2026-09-05/reference-drive.py` (resonant $\omega = 0.477747587$, $A = 0.02$, $D = 48$, to $t = 96$); three routes must agree: `modrive.js`, the density propagator with $D = cc^\dagger$, and a SciPy DOP853 run on the STO-3G matrices.

**Port 3 — CDIIS with Fock damping.** λWAVES has no general SCF. Pulay's commutator DIIS on the error vector $e = FDS - SDF$ in the Löwdin frame, with damping on the first iterations. No ChronusQ paper prints a DIIS equation; the source is the only written statement (A §2). Cite Pulay 1982 for the method.

**What a browser will never do** (A §8): four-component Dirac–Coulomb–Breit, large-basis DFT quadrature grids, CC and EOM-CC, model-order reduction, Libint-scale two-electron integrals, two-electron GIAO terms. The credit can say so.

## 4. The credit line

**Finding.** `lab/index.html:112` and `NOTICE:113` thank "Team @ Chronus Quantum for the Molecular Orbital Model". No class, module, keyword or wiki page by that name exists in ChronusQ, and no ChronusQ method is in the tree. Astra flagged the same on 2026-09-05 and the wording did not move. The true debt is to a reference: ChronusQ's RT documentation and package paper are the declared validation target of λWAVES's molecular pulse work.

**Recommended wording** (keeps the two legacy-gate assertions on "Chronus Quantum" and the link text "ChronusQ"): in ABOUT, "Team @ Chronus Quantum, for the real-time electronic-structure documentation λWAVES measures its own molecular propagators against — ChronusQ"; in NOTICE the same plus "No ChronusQ code or method is used in this tree; the debt is to the documentation" and the citation Williams-Young et al., WIREs Comput. Mol. Sci. 10, e1436 (2020). Once Port 1 ships with the matched fixture, the line becomes literally true. **Decision for Josh:** the wording is his; nothing was changed.

## 5. The kinetics ladder and Astra's ordering

D §1 gives eleven rungs, each with equations, the observable that is kinetics at that rung, cost per frame, oracle and falsifier. The rungs that matter for the decision:

| rung | model | the kinetics observable | cost | oracle |
|---|---|---|---|---|
| 1 | analytic Eckart/sech² barrier | $P(E)$, $\kappa(T)$, the Arrhenius bend, $T_c$ | free | closed form, **[A]** verified to 9 digits against Numerov |
| 2 | 1-D grid, absorber, flux operator | $P(E)$ measured | free | rung 1 |
| 3 | collinear H + H₂ on LEPS, then BKMP2 | $P_r(E)$, threshold, resonances | 15 ms per full curve at $256^2$ **[A]** | rung 1 and the published curves |
| 5 | thermal $k(T)$ from cached $N(E)$ | Arrhenius, $E_a$, isotope effects | microseconds; the rack drives $T$ at 60 fps | Mielke et al., PRL 91, 063201 |
| 6 | Langevin double well, rate watched being measured | $k(\gamma)$ against Kramers turnover | 1.6 ms per frame, $10^5$ walkers **[A]** | Hänggi, Talkner, Borkovec, RMP 62, 251 |
| 8 | Landau–Zener, Tully I–III, Marcus | branching ratios | microseconds | own split-operator |
| 9 | electron dynamics with moving nuclei (Astra) | none: not a rate | $\sim 10^9$ slower than real time | — |
| 10 | Gillespie / chemical master equation | concentrations, induction, branching | trivial | SSA to ODE at large $N$ |

**Proposition 4.** Completing Astra's benzene milestones B6 and B7 moves the tree zero rungs up this ladder. **Proof.** B6/B7 certify a neighbourhood of one optimised minimum by a harmonic expansion. A harmonic expansion at a minimum is a positive-definite quadratic form and contains no saddle, hence no barrier, hence no reaction probability, no cumulative reaction probability and no rate. Kinetics at every rung from 2 upward needs a grid Hamiltonian, an absorbing boundary, a flux operator and energy-domain projection, none of which the tree or the benzene contracts contain. $\square$ Rungs 1–8 need no moving electronic basis; the connection $\dot S = \tau + \tau^\dagger$ that Astra's §11 worries about is a rung-9 requirement, off the kinetics critical path.

**The ordering verdict.** Insert a K wave (K1, K2, K6, K10; then K3, K5, K8) parallel to B4/B5 and ahead of B6/B7. K1, K2, K6 and K10 together are estimated at less work than B6 alone. Two rung-6 equations, so the showpiece is stated here: the ensemble $m\ddot x = -V'(x) - \gamma m \dot x + \xi(t)$, $\langle \xi(t)\xi(t')\rangle = 2\gamma m k_B T\,\delta(t-t')$, with $k_{\text{measured}} = -\,d\ln N/dt$ or $1/\langle \tau_{\text{FPT}}\rangle$, graded against Eyring $k_{\text{TST}} = (\omega_0/2\pi)\, e^{-\beta E_b}$ times the Kramers factor across the turnover. Three conventions are traps: $V^\ddagger$ is the classical bottom-of-barrier height, the transition-state partition function excludes the unstable coordinate, and $Z_r$ is per unit volume for a bimolecular step.

**[A] Two numbers worth carrying.** The Wigner tunnelling correction is wrong by 448× at 200 K and right to 4 % at 1500 K on the H + H₂ barrier, with the crossover at $T_c = 387$ K, independently reproducing the literature's stated validity limit. Rung 3's 15 ms per curve means the rack can sweep collision energy live.

**The novelty sentence that survives** (D §3.3). Real-time quantum chemistry is Reiher's term (2013–, SCINE, Heron with microkinetics); live human-driven bond breaking on a quantum surface was published by Glowacki (2019); chemistry as an audiovisual instrument at 60 fps by the same group (2014); browser-native WebGPU quantum chemistry appeared in 2026 (webgpu-q, GANSU-Lite); browser GPU 2-D Schrödinger with user-drawn potentials exists (marl0ny, Demidov). What no search found: a rate constant read out from any interactive simulation, an MLIP running in a browser, and a modulation rack driving a chemical Hamiltonian's parameters in any medium. The sentence to say publicly: "We know of no instrument that closes the loop: reactive kinetics, a reaction probability, a cumulative reaction probability, a measured or computed rate constant, read out live from a quantum surface, in a browser, with a modulation rack as the control surface." Caveats: two questions closed as not found rather than disproven (NanoVer with a live MLIP; any browser app measuring a rate), and webgpu-q's live-drag claim is site-claimed, not executed. **[U]** BKMP2's redistribution licence is unstated; LEPS is licence-free.

## 6. The Navier–Stokes claim, corrected

**[S]** On 2026-09-08 OpenAI announced a Lean-formalised proof that the forced three-dimensional Navier–Stokes equations blow up in finite time from rest under a smooth compactly supported force with finite energy: Clay's alternatives (C) and (D), which permit a force. The unforced problem (A)/(B) stays open; the Clay Institute lists the problem as unsolved; OpenAI says it will not claim the prize. Buckmaster (NYU) and Alpöge (Anthropic) had a Lean-verified forced Euler/Boussinesq/IPM blow-up on 2026-08-15, built on Córdoba and Martínez-Zoroa's oscillatory-cascade technique, and Buckmaster alleges OpenAI leveraged leaked work; OpenAI denies direct copying. The lead confirmed Tao's post of 2026-09-07 and OpenAI's Lean repository exist. Google DeepMind's separate 2025 result (arXiv 2509.14185) is numerical: unstable self-similar profiles for IPM, Boussinesq and Euler with boundary, found by PINNs with a second-order Gauss–Newton optimiser to residuals near $10^{-13}$.

**What transfers.** Two things only. The Morse-index view: an unstable stationary solution with one unstable direction is exactly an index-1 saddle, which on a potential energy surface is a transition state, so "count the unstable directions" is the same discipline as locating a transition state. And the residual discipline: drive the residual of a claimed stationary state to machine precision with a second-order optimiser before trusting it. The self-similar ansatz $u(x,t) = (T-t)^{-\alpha} U(x/(T-t)^\beta)$ and the oscillatory cascade have no chemistry analogue.

## 7. How researchers harness Claude, and what was adopted

B's strongest cases: Schwartz's instrumented two-week QCD project with Opus 4.5 (270 sessions, a caught fabricated "verified" uncertainty band); Anthropic's Fermat's Last Theorem formalisation in Lean (13 million lines, 30 300 theorems, a task DAG, Buzzard reviewing); the retracted GPT-5 Erdős claims of October 2025 (literature retrieval mistaken for proof). The converging practices, now written into the doctored `disk-writer` skill (§0, §4, §5, §6): builder and verifier are different sessions; hand the model the paper, not a description; write the analytic fixture before the routine; subagents return summaries, never raw pages; ban hand-wave transitions; tag UNVERIFIED and HEARD; run a "was this already known" pass before any novelty claim; keep decomposition external and written; the human's judgment about what is worth pursuing stays the bottleneck and stays his.

## 8. Decisions for Josh

1. **The credit wording** (§4). Recommended text above; the change touches ABOUT, NOTICE and nothing in the gate.
2. **The K wave before B6/B7** (§5). If accepted, the first dev feature is rung 1 plus rung 6: an analytic barrier with a live tunnelling-corrected Arrhenius plot, and a Langevin well whose rate is measured on screen against Kramers, both driven by the rack.
3. **Port 1 as the first ChronusQ-shaped feature**: the δ-kick spectrum inside the instrument, with the fixture of §3 as its proof. It makes the credit literally true and is in neither codebase.
4. **Publishing this directory.** `research/` is in the public repository. These reports quote a live credit dispute (C) and name unpublished repositories; pushing `dev` publishes them. Nothing was pushed.
5. **Banking.** Six corpus candidates are listed in §9 with placeholder labels. They bank only when you invoke `/disk-writer`.

## 9. Corpus candidates (not banked)

| placeholder | headline claim | bracket | gate | falsifier |
|---|---|---|---|---|
| CAND-01 | THE δ-KICK SPECTRUM OF A TWO-LEVEL LENGTH-GAUGE SYSTEM PEAKS AT $E_1 - E_0$ WITH AMPLITUDE $2\kappa z_{01}^2$ AND INTEGRATED STRENGTH $2\omega_{01} z_{01}^2$ (Theorem 1) | $[\mathrm M, \blacksquare]$ | closed form; re-run [V] to $2\times10^{-9}$ | a second peak; amplitude deviation above $O(\kappa^2)$ |
| CAND-02 | A UNITARY SIMILARITY STEP PRESERVES IDEMPOTENCY AND TRACE OF THE DENSITY EXACTLY, SO TRACE DRIFT LOCATES A METRIC-ROOT DEFECT, NEVER AN INTEGRATOR DEFECT (Proposition 3) | $[\mathrm M, \blacksquare]$ | spectrum invariance; to be re-run on the Port 2 fixture | any $\operatorname{Tr}(DS)$ drift with exact $S^{\pm1/2}$ |
| CAND-03 | CHRONUSQ'S PAPERS AND CODE DISAGREE ON THE LENGTH-GAUGE SIGN; λWAVES MATCHES THE PAPERS; PEAK POSITIONS ARE INVARIANT (Observation 1) | $[\mathrm M, \blacksquare\text{(sign)}, \circ\text{(unpublished v1.0 paper)}]$ | source lines cited in A §1.6 | a ChronusQ release whose code matches its paper |
| CAND-04 | A HARMONIC EXPANSION AT A MINIMUM CONTAINS NO BARRIER, SO A CERTIFIED-NEIGHBOURHOOD BENZENE CONTRIBUTES NO KINETICS OBSERVABLE (Proposition 4) | $[\mathrm M, \blacksquare]$ | definitional | a rate extracted from B6/B7 data alone |
| CAND-05 | THE WIGNER TUNNELLING CORRECTION FAILS BY 448× AT 200 K AND HOLDS TO 4 % AT 1500 K ON THE H + H₂ BARRIER, CROSSING AT $T_c = 387$ K | $[\mathrm M, \blacksquare\text{[A]}, \circ\text{(lead re-run pending)}]$ | D App. A.2, sech² transmission vs Numerov 9 digits | a lead re-run outside 1 % |
| CAND-06 | NO PUBLISHED INTERACTIVE SIMULATION READS OUT A RATE CONSTANT, AND NO MEDIUM HAS A MODULATION RACK DRIVING A CHEMICAL HAMILTONIAN (well-searched negative) | $[\mathrm M, \diamondsuit\text{(negative)}, \circ\text{(two questions not found, not disproven)}]$ | D §3.2B, §3.3 search record | one citation |

## 10. Open problems and conjectures

1. **Conjecture (cost).** Seideman–Miller's $N(E)$ from one complex matrix inverse per energy beats wavepacket propagation for rung 3 at $256^2$. Open: cost it before K3.
2. **Open.** Whether MMUT's sublattice divergence has a closed-form growth rate in terms of $\lVert [\tilde F(t), \tilde F(t')] \rVert$; the wiki's restart interval of ~50 is empirical.
3. **Open.** The unpublished "Chronus Quantum 1.0" package paper (~30 authors, 2026, no DOI) may fix the sign convention; re-check before tightening the credit further. **[U]**
4. **Open.** BKMP2's licence for redistribution inside a public app. **[U]** LEPS carries no such gate.
5. **Open.** Whether NanoVer has ever run a trained MLIP in its live loop. Not found, not disproven.
6. **Conjecture.** For $N \le 100$ the Fock build, not the propagator, sets the browser frame budget; a WebGPU $N^4/8$ contraction in FP32 with FP64 accumulation on CPU reaches 60 fps at $N = 42$. Unmeasured.
7. **Open.** A rigorous statement of when the rack's continuous modulation of $T$ or $\gamma$ leaves the measured rate a rate (adiabatic modulation slower than $1/k$) rather than a driven observable.

## 11. Sources

ChronusQ: github.com/xsligroup/chronusq_public (HEAD 52ddf3c1) and its wiki RT/SCF pages; Williams-Young et al., WIREs Comput. Mol. Sci. 10, e1436 (2020), arXiv 1905.01381; Goings, Lestrange, Li, WIREs 2018; Kasper et al., 2020. Pulay, Chem. Phys. Lett. 73, 393 (1980); J. Comput. Chem. 3, 556 (1982). Kinetics: Eyring, JCP 3, 107 (1935); Kramers, Physica 7, 284 (1940); Hänggi, Talkner, Borkovec, RMP 62, 251 (1990); Truhlar, Garrett, Klippenstein, J. Phys. Chem. 100, 12771 (1996); Seideman and Miller, JCP 96, 4412 (1992); Mielke et al., PRL 91, 063201 (2003); Amabilino et al., JPCA 123, 4486 (2019); Haag and Reiher, Int. J. Quantum Chem. 113 (2013). Fluids: OpenAI, openai.com/index/navier-stokes-solution (2026-09-08) and github.com/openai/NavierStokesAndEuler; Tao, terrytao.wordpress.com 2026-09-07; Wang et al., arXiv 2509.14185; Clay Institute problem statement (Fefferman). Practice: anthropic.com/research/vibe-physics; platform.claude.com prompting guides for Opus 5 and Fable 5.1. Full URL tables in A §10, B (a), C (a), D §3, E (a)–(c).
