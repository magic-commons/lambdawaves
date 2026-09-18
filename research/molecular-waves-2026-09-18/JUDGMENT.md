# Molecular waves — judgment of Astra's plan, and the refined plan

Fable · 18 September 2026 · commissioned by Josh · judged against commit `8fcdcf8` on `dev`
Subject: `OBSIDIAN/MOLECULAR-WAVES-PLAN.md` (Astra) with its folder `research/astra-2026-09-18/`
Evidence for this document: `research/molecular-waves-2026-09-18/probe-fable.mjs` and `measurements-fable.json` (research only; nothing under `lab/` was changed)

## 0 · Verdict

Astra's plan is a very good audit and a mediocre design. Every code finding in it is true: I checked all seven line references and both behavioural claims (the second integral pass behind `split: true`, and the card that says "unrestarted MMUT" while the worker restarts every 50 steps). Its mathematics is correct wherever I re-derived it. Keep the audit whole.

The design has four structural faults, and fixing them makes the plan smaller, faster and more physical at once.

1. It builds the first deliverable on the wrong object. A frozen-orbital wave packet beats at an orbital-energy gap. The same instrument's spectrum window says the molecule rings somewhere else. For benzene the three numbers are 0.5516 (HOMO–LUMO gap), 0.3903 (bright pair, wavefunction model) and 0.3608 (bright pair, TDHF). A drive tuned to a stick in the spectrum would do nothing to Astra's register. Two windows of one instrument must not disagree about where the molecule absorbs.
2. It treats the collective modes as a weak-signal overlay and defers real many-electron superposition to "later correlated dynamics". It is not later. The states are already computed (`XTDA`, `omegaTDA` in `lab/rpa-inspector.js`), and a superposition of them is a genuine $N$-electron wavefunction whose density is valid at any amplitude. Measured below.
3. Its largest engineering item, three render backends with an automatic chooser, targets a non-bottleneck. Every model in the plan emits one AO vector or one AO matrix a frame, at most 1296 numbers for benzene, and the shipped kernel contracts that in 2.88 ms at $96^3$ (measured 2026-09-12 on the RTX 3070). Astra's own target is 4 ms. What is missing is one signed kernel kind, about ten lines of WGSL.
4. It under-reads the preparation profile. It proposes 21 % off the RPA step. The measured truth is that benzene's 9.9 s is eight Jacobi diagonalisations of a $315\times315$ matrix where one is needed.

## 1 · What is verified in Astra's plan

| Astra's claim | Status | Note |
|---|---|---|
| `chemview.js:192` sends `split: true`, `mathworker.js:179` runs a discarded integral pass | SEEN, true | costs 0.56 s of 9.9 s on benzene; real, but the smallest of the wastes |
| `symFunc(AmB)` diagonalises the same matrix twice (`rpa-inspector.js:84`) | SEEN, true | see §5 for the larger count |
| the residual loop rebuilds the Fock matrix for every MO column | SEEN, true | an $n^5$ loop for a diagnostic |
| the worker keeps only four dominant pairs per root, dropping $X$ and $Y$ | SEEN, true | blocks any response field; keep the vectors in the worker |
| the density path stores $\sqrt{\max(\rho,0)}$ and DIFF subtracts two half-precision volumes | SEEN, true (`field.js:132`, `:215`) | a weak-kick difference is below the format's resolution; fix in §2 |
| CHEMISTRY then ORBITALS write the volume, last writer wins | SEEN, true (`rack.js:1267`) | I wrote that comment as a stopgap; one owner is the right cure |
| MMUT labelled "unrestarted" while `restartEvery` defaults to 50 | SEEN, true (`chemview.js:341`, `mathworker.js:212`) | a labelling bug that changes the numerical trajectory; fix first |
| response replay $\delta\rho=-2\kappa\sum_K\mu_{Kq}\sin(\omega_Kt)\,\rho^{\rm tr}_K$ | re-derived, true | it is the first-order term of Proposition 2 below |
| slerp morph for non-orthogonal endpoints; the real oscillator form $\dot q=Ap+Bq$, $\dot p=-Aq+Bp$ | re-derived, true | |
| natural orbitals cannot supply a molecular phase | true | the occupied block is degenerate at occupation 2; §4 gives what can |
| the water replay agrees with TDHF to 0.014 % | HEARD (Astra's probe, not re-run) | only to $t=2$ a.u., less than one period of the lowest mode; needs a long trace |

One finding of mine that Astra missed: `roots[k].omegaTDA` pairs the $k$-th RPA root with the $k$-th TDA root by index, not by character. For benzene, RPA root 2 is the bright line and TDA root 2 is dark. Any per-root "TDA partner" reading in the interface is wrong wherever the two ladders cross.

## 2 · Refinement one: the funnel

**Observation 1 (every model emits one of two objects).** With fixed nuclei and a fixed real AO basis $\chi$, each dynamical model in either plan produces, per frame, either a complex AO vector $c(t)\in\mathbb C^{n}$ (one orbital amplitude, which has a phase) or a Hermitian AO matrix $D(t)\in\mathbb C^{n\times n}$ (a one-particle density matrix), and the fields are

$$
\psi(\mathbf r,t)=\chi(\mathbf r)^{T}c(t),\qquad
\rho(\mathbf r,t)=\chi(\mathbf r)^{T}\,\operatorname{Re}D(t)\,\chi(\mathbf r),\qquad
\mathbf j(\mathbf r,t)=\tfrac12\sum_{\mu\nu}\operatorname{Im}D_{\mu\nu}(t)\,\bigl(\chi_\mu\nabla\chi_\nu-\chi_\nu\nabla\chi_\mu\bigr),
$$

with the one convention $D_{pq}=\langle E_{pq}\rangle=\langle a_p^\dagger a_q\rangle$ used everywhere in this document (for one orbital, $D_{\mu\nu}=\overline{c_\mu}c_\nu$ and $\mathbf j=\operatorname{Im}\bar\psi\nabla\psi$). △ Correction, 2026-09-18: draft 0 printed this formula with $\mu$ and $\nu$ exchanged, which is the opposite convention to §3 and would have drawn every ring current backwards; the proving lab caught it against $\operatorname{Im}\bar\psi\nabla\psi$ on benzene's HOMO pair (`proving/LEDGER.md`, Proposition 7). No density view can see this sign; only FLOW can.

The orbital packet, the state register of §3, the weak-kick replay and full TDHF differ only in how they advance $c$ or $D$. The renderer never needs to know which one is playing.

Consequences for the build:

- One owner, `molecular-session.js`, holds the selected model and hands the field exactly one tagged product per frame: `orbital` ($c$), `density` ($\operatorname{Re}D$), or `signed` ($\operatorname{Re}D-D_{\rm ref}$). This is Astra's controller, kept, with a smaller product list.
- One new kernel kind, `signed`: the existing symmetric contraction without the square root, written signed into `.r` and read by the existing `real` view. The difference matrix is formed on the CPU in double precision before upload, which is exactly Astra's "form differences before quantisation", achieved without a second volume.
- Astra's cached MO volumes, separable Gaussian tables and the backend chooser are dropped from the plan. They return only if one measurement on the iPad shows the shipped kernel missing the frame budget there. The separable-table algebra is correct and stays on file as the first candidate if that happens.
- Worker replies carry a revision stamp (geometry, basis, solution, model), and a stale reply cannot publish. Astra's rule, kept.

## 3 · Refinement two: the state register

This is the centre of the refined plan. Hydrogen's STATE window is a register over exact eigenstates. The molecular analogue is a register over many-electron states: the ground determinant and the excited states the inspector already computes. The spectrum's sticks are its ladder.

Let $\Phi_0$ be the converged RHF determinant, $\Psi_K=\sum_{ia}X^K_{ia}\,\tfrac{1}{\sqrt2}E_{ai}\Phi_0$ the singlet CIS (TDA) eigenvectors with energies $\omega_K$ above the ground state, $E_{pq}$ the spin-summed excitation operators, and

$$
\Psi(t)=b_0\,\Phi_0+\sum_K b_K\,e^{-i\omega_Kt}\,\Psi_K,\qquad \lvert b_0\rvert^2+\sum_K\lvert b_K\rvert^2=1 .
$$

**Proposition 1 (the register is a wavefunction).** (i) $\langle\Phi_0\vert H\vert\Psi_K\rangle=0$, so $\{\Phi_0,\Psi_K\}$ diagonalises $PHP$, where $P$ projects on the span of $\Phi_0$ and the singlet single excitations. (ii) $\Psi(t)$ solves $i\partial_t\Psi=PHP\,\Psi$ exactly, for all $t$, in closed form. (iii) Its one-particle density matrix

$$
D(t)=\sum_{A,B}\overline{b_A}\,b_B\,e^{i(E_A-E_B)t}\,\gamma^{AB},\qquad \gamma^{AB}_{pq}=\langle A\vert E_{pq}\vert B\rangle,
$$

is Hermitian, has trace $N$, and has all eigenvalues in $[0,2]$, for every normalised $b$ and every $t$.

**Proof.** (i) is Brillouin's theorem for a converged RHF reference. (ii) follows from (i) since each term is an eigenvector of $PHP$. (iii) $D(t)$ is the spin-summed 1-RDM of a normalised $N$-electron state; for any normalised orbital $f$, $\langle\Psi\vert\hat n_f\vert\Psi\rangle\in[0,2]$ by the Pauli principle, and these expectation values are the Rayleigh quotients of $D$. $\blacksquare$

The matrices $\gamma^{AB}$ in the MO basis ($i,j$ occupied, $a,b$ virtual):

$$
\gamma^{00}_{ij}=2\delta_{ij},\qquad
\gamma^{0K}_{ia}=\sqrt2\,X^K_{ia},\qquad
\gamma^{KL}_{ij}=2\delta_{ij}\langle X^K,X^L\rangle-\sum_a X^K_{ja}X^L_{ia},\qquad
\gamma^{KL}_{ab}=\sum_i X^K_{ia}X^L_{ib},
$$

with $\gamma^{K0}=(\gamma^{0K})^{T}$ and all other blocks zero. The field $\chi^T C\gamma^{0K}C^T\chi=\sqrt2\sum_{ia}X^K_{ia}\phi_i\phi_a$ is Astra's transition density. It plays exactly the role the cross term $\phi_H\phi_L$ plays in the orbital beat, and the orbital beat is the special case of a single pair.

**Proposition 2 (Astra's replay is the register's first order).** A $\delta$-kick $e^{-i\kappa R_q}$ on $\Phi_0$ gives $b_0=e^{-i\kappa\langle\Phi_0\vert R_q\vert\Phi_0\rangle}+O(\kappa^2)$ (which is $1+O(\kappa^2)$ only with the origin at the electronic centroid; △ corrected 2026-09-18, the draft's $b_0=1+O(\kappa^2)$ failed at first order, $\lvert b_0-1\rvert=6.8\times10^{-4}$ at $\kappa=10^{-3}$; only $\overline{b_0}b_K$ enters the density, so the replay formula is unaffected and the common phase drops out), $b_K=-i\kappa\,\mu_{Kq}+O(\kappa^2)$ with $\mu_{Kq}=\sqrt2\sum_{ia}X^K_{ia}\langle i\vert r_q\vert a\rangle$, hence

$$
\delta\rho(\mathbf r,t)=2\operatorname{Re}\!\bigl[\overline{b_0}b_Ke^{-i\omega_Kt}\bigr]\rho^{\rm tr}_K=-2\kappa\sum_K\mu_{Kq}\sin(\omega_Kt)\,\rho^{\rm tr}_K(\mathbf r)+O(\kappa^2).
$$

**Proof.** Expand the kick to first order and project on $\Psi_K$; $2\operatorname{Re}[-i\kappa\mu e^{-i\omega t}]=-2\kappa\mu\sin\omega t$. $\blacksquare$

So Astra's §3 formula is this register in the weak limit, with RPA vectors substituted for TDA ones. The second-order terms Astra leaves out are what keep the density valid when the performer turns the amplitude up.

**Measured (probe, 40 random normalised complex amplitude sets over the ground state and four excited states, at arbitrary times).**

| Molecule | occupation range of $D(t)$ | trace error | the linear overlay $\rho_0+0.6\,\rho^{\rm tr}$ |
|---|---|---|---|
| H₂O | $[0.0195,\ 2+7\times10^{-15}]$ | $7\times10^{-15}$ | $[-0.261,\ 2.261]$, invalid |
| C₂H₄ | $[2.7\times10^{-5},\ 2+10^{-14}]$ | $1.4\times10^{-14}$ | $[-0.292,\ 2.292]$, invalid |
| C₆H₆ | $[8\times10^{-30},\ 2+6.5\times10^{-14}]$ | $8.9\times10^{-13}$ | $[-0.123,\ 2.123]$, invalid |

The register stays $N$-representable at full amplitude. The linear overlay at a performance gain does not. This was computation as evidence, not proof. The proof and the independent gate now exist: `proving/LEDGER.md` derives every block from second quantisation and verifies them against PySCF transition density matrices in the full determinant space (H₂O 441, NH₃ 3136, CH₄ 15876 determinants) and against a from-scratch bitstring evaluator, to $9\times10^{-16}$; the pair-form blocks of this section to $4\times10^{-14}$ on benzene; the whole TDA matrix against PySCF to $2.7\times10^{-12}$ on benzene. One generalisation to keep: for a non-symmetric one-electron operator the drive's pair-basis block is $\delta_{ij}M_{ab}-\delta_{ab}M_{ji}$, with the transpose on the occupied indices; for position it makes no difference.

**The drive.** In the length gauge the project already uses,

$$
i\,\dot b=\bigl[\operatorname{diag}(E)+\mathcal E(t)\,\mathbf R_q\bigr]b,\qquad (\mathbf R_q)_{AB}=\sum_{pq}\gamma^{AB}_{pq}\langle p\vert r_q\vert q\rangle .
$$

This is hydrogen's register equation with a different table, so the pulse panel, the modulation lanes and the selection-rule display carry over. It resonates at the sticks the spectrum shows, with the strengths the spectrum shows. For a fixed polarisation, diagonalise $\mathbf R_q=UrU^\dagger$ once; then a Strang step $e^{-iE\Delta t/2}\,U e^{-i\mathcal E r\Delta t}U^\dagger\,e^{-iE\Delta t/2}$ is exactly unitary, second order, and costs two matrix–vector products: about $2\times10^5$ multiply–adds a step for benzene's full 316-state space. The whole singles space can be propagated, the named dials expose up to eight states, and the spectrum window shows the populations $\lvert b_K\rvert^2$ on its sticks, as hydrogen's does. For assembling $D(t)$ with many states populated, work in the pair basis: with $c_0=b_0$ and $Z(t)=\sum_Kb_Ke^{-i\omega_Kt}X^K\in\mathbb C^{n_o\times n_v}$, the blocks are $D_{ov}=\sqrt2\,\overline{c_0}\,Z$, $D_{vo}=D_{ov}^{\dagger}$, $D_{vv}=Z^{\dagger}Z$ and $D_{oo}=2\cdot\mathbb 1-ZZ^{\dagger}$ (using $\lvert c_0\rvert^2+\lVert Z\rVert_F^2=1$), about $10^4$ multiply–adds.

Prior art, so that nothing is claimed as new: this is time-dependent configuration interaction singles. [Krause, Klamroth and Saalfrank, J. Chem. Phys. 123, 074105 (2005)](https://pubs.aip.org/aip/jcp/article-abstract/123/7/074105/931439/Time-dependent-configuration-interaction) drive LiCN with it. What is ours is the instrument: a playable register over those states with a DAW modulation rack, in a browser. That sentence is the honest novelty claim and nothing beyond it should be asserted.

What the model is not: it has no double excitations and no orbital relaxation, its line positions are TDA ones (benzene's bright pair at 0.3903 against TDHF's 0.3608), and strong fields that ionise are outside it. Full TDHF stays as the reference model, as Astra says, and the active model's name stays on screen.

## 4 · Refinement three: how arg gets into a molecule

Josh's question has three honest answers, in increasing physical weight. Astra's plan contains only the first.

1. One orbital has a phase. The ORBITALS register already shows it. Zero-cost showpiece available today: benzene's HOMO and LUMO are each a degenerate pair, and amplitudes $(1,\,i)/\sqrt2$ on a pair give an angular-momentum orbital whose phase winds once or twice around the ring with a stationary density, the molecular cousin of hydrogen's $2p_{\pm1}$. It needs a preset, not code.
2. A complex amplitude on a degenerate pair of states is a ring current. **Measured:** benzene's brightest degenerate pair with $b=(\sqrt{0.5},\ 0.5,\ 0.5\,i)$ gives a dipole of constant magnitude ($1.89793265928$, constant to $4\times10^{-12}$) that turns through exactly $15/16$ of a revolution in $15/16$ of a period, with zero out-of-plane component. The charge cloud rotates around the ring at $\omega_K$. This is the physics of [Barth, Manz, Shigeta and Yagi, J. Am. Chem. Soc. 128, 7043 (2006)](https://pubs.acs.org/doi/abs/10.1021/ja057197l), who drive exactly such a current in Mg-porphyrin with a circularly polarised pulse; a benzene study by Ulusoy and Nest (J. Am. Chem. Soc. 2011) is HEARD, not re-fetched. In the register it is one phase dial turned to a quarter.
3. For all the electrons together, the gauge-invariant carrier of phase is the current $\mathbf j$ of Observation 1, read from $\operatorname{Im}D(t)$. For one orbital $\mathbf j=\rho\,\nabla\arg\psi$, so this is the same quantity the phase colour encodes, generalised. The app already owns streamline and particle overlays for hydrogen's flow; the molecular $\mathbf j$ can feed them. This is how a many-electron molecule shows its arg without pretending it has one wavefunction in 3-D.

On "bulb harmonics" against "Taylor orbitals": Astra is right that a different spatial expansion creates no motion, and my note of 2026-09-12 (MATH-H2O, JOSH'S QUESTION) stands: STO-3G is a Slater fit, and better bases change accuracy, not the dance. The dance comes from superposed states, and §3 is where those live.

## 5 · Refinement four: preparation, measured

Benzene today, single thread, Node 22 on the Ryzen 5 5600G:

| Piece | Time |
|---|---|
| integrals + SAD guess + SCF, nothing else | 0.71 s |
| `moleculeRHF` as shipped | 5.51 s |
| of which one `stabilityHessian` call | 2.09 s, and it runs twice |
| `rpa` as shipped | 4.40 s |
| one Jacobi `eigSym` of a $315\times315$ matrix | 0.73 s |

Count of $315\times315$ Jacobi diagonalisations in one benzene preparation: two per stability Hessian, and the Hessian is evaluated for both the SAD and the core guess even though they converge to the same solution (four); then TDA, $\sqrt{A-B}$, $1/\sqrt{A-B}$ and the RPA matrix (four). Eight, plus two separate MO integral transformations.

**Proposition 3 (one eigenproblem suffices).** Let $A-B=LL^{T}$ (Cholesky). Then $A-B\succ0$ iff the factorisation exists, $A+B\succ0$ likewise, and with $W=L^{T}(A+B)L$, $Wu=\omega^2u$, $\lVert u\rVert=1$:

$$
X+Y=\frac{Lu}{\sqrt\omega},\qquad X-Y=\frac{(A+B)(X+Y)}{\omega},\qquad (X+Y)^T(X-Y)=1 .
$$

**Proof.** $(A-B)(A+B)(X+Y)=\omega^2(X+Y)$; substitute $X+Y=Lu$ and cancel $L$. The normalisation is $u^TWu/\omega^2=1$. $\blacksquare$

So stability is two Cholesky factorisations (a verdict without a spectrum) and RPA is one symmetric eigenproblem.

**Measured.** A Householder tridiagonalisation with implicit QL (the EISPACK `tred2`/`tql2` pair) does the $315\times315$ problem in 0.126 s against Jacobi's 0.73 s, a factor 5.8, with eigenvalues equal to $6\times10^{-13}$. The whole Cholesky RPA, both stability verdicts included, takes 0.229 s and reproduces every shipped root to $1.3\times10^{-12}$ and every oscillator strength to $2.8\times10^{-12}$, for benzene's 315 roots. (For the $10\times10$ and $48\times48$ problems the probe's QL times are cold-JIT numbers and should not be read as slower.)

| | shipped | Astra's proposal | this plan |
|---|---|---|---|
| benzene RPA step | 4.40 s | 3.37 s | 0.23 s, TDA 0.13 s more when asked for |
| benzene cold preparation | about 9.9 s | about 8.4 s | projected 1.5 to 2 s; MEASURED after the stage 0 and 2 build: 2.49 s warm in Node (from 9.91 s), 2.8 to 3.1 s cold in the browser as the card reports it (from 9.27 s). The projection was optimistic: the AO to MO transform (0.6 s) is the next bottleneck |

The same solver replaces the realified Jacobi inside `hermitianEigen`, which is the open item from 2026-09-12 (idempotency $8\times10^{-8}$ after 400 MMUT steps at $n=72$). Staged replies remain worth doing: the ground state can appear at about 0.7 s and the spectrum a second later. Prepared molecule packs are deferred; at these times they buy little and add a staleness hazard.

## 6 · What is kept, changed and dropped

Kept from Astra: the single field owner and tagged products; revision-stamped worker replies; full $X$, $Y$ kept in the worker; staged preparation; two clocks, and the temporal-aliasing guard at high playback speed; the slerp morph and A/B stores; the numerical acceptance list almost verbatim; "never interpolate between two molecules"; subspace tracking at degeneracies for saved states; the MMUT label fix; vibrations later, where a Taylor model does belong.

Changed: the register's primary object is the many-electron state, with the orbital packet kept as a labelled one-electron mode of the same window; the response replay becomes the register's weak limit and the way the spectrum window comes alive; the projected drive moves from orbital amplitudes to state amplitudes.

Dropped or deferred: three render backends and the chooser; molecule packs; the frozen-Fock occupation-matrix drive (it resonates at orbital gaps, the same fault as W1); the 21 % RPA patch, superseded.

## 7 · Build order and gates

| Stage | Deliverable | Gate |
|---|---|---|
| 0 · truth | MMUT label and saved restart policy; drop the second integral pass; skip the duplicate Hessian; fix the TDA-partner index | existing node and browser suites unchanged |
| 1 · funnel | `molecular-session.js` as sole owner; products `orbital`, `density`, `signed`; the signed kernel kind; stamped replies. No new behaviour | the 49 chem and 24 orbitals browser checks pass untouched; a weak-kick signed field matches the CPU evaluator where DIFF today shows quantisation noise |
| 2 · fast preparation | Householder–QL `eigSym`; Cholesky stability; Cholesky RPA; lazy TDA; staged reply | all 54 molecules: energies, roots and strengths unchanged to $10^{-10}$; the two refused molecules still refused; benzene cold time measured in the browser and reported |
| 3 · the spectrum plays | click a stick, its mode sloshes; kick replay in closed form, scrubbable | agreement with TDHF over a long trace ($t\ge200$ a.u.), using the modified-generator frequencies of MATH-CHRONUSQ-PORTS so integrator phase error is not mistaken for model error; sign flips with the kick; degenerate-pair invariance |
| 4 · the state register | lanes over ground + up to eight states, dials, A/B, slerp morph, presets BEAT, RING, BREATHE; the orbital packet as the window's second mode | $\gamma^{KL}$ against PySCF TDA transition and excited-state dipoles; occupations in $[0,2]$; trace $N$; exact beat periods; reversible scrubbing; fresh-page restore |
| 5 · the drive | TD-CIS Strang propagator on the full singles space; populations on the spectrum sticks; the pulse panel and modulation lanes reused | norm to round-off; Rabi period against the two-level formula on an isolated bright line; $\Delta t$-halving ratio 4; weak-field spectrum equals the TDA sticks |
| 6 · flow | $\mathbf j$ from $\operatorname{Im}D$ into the streamline and particle overlays | circulation of the RING preset equals its analytic value; continuity defect reported as a diagnostic |
| later | iPad frame measurement decides any renderer work; vibrations; open shells | |

Labour, per the standing dial: Opus builds stages 0 to 2 and proves the $\gamma$ formulas against PySCF; one light Sol prompt asks for TD-CIS pitfalls and the ring-current literature; Fable judges and keeps the ledger.

## 8 · Open problems and conjectures

1. CLOSED 2026-09-18: the $\gamma^{KL}$ formulas are proved and independently verified (`proving/LEDGER.md`).
2. MEASURED 2026-09-18 (`tests/molecular-flow.test.mjs`), and larger than this document expected. On benzene's RING in STO-3G, $\lVert\partial_t\rho+\nabla\cdot\mathbf j\rVert/\lVert\partial_t\rho\rVert=1.19$ over 400 points, and the integrated current is parallel to the dipole's own rate of change ($\cos=0.99997$) but only $0.149$ of its size ($0.73$ for water's BEAT). △ Correction to this entry's first sentence: continuity is not restored by a complete one-particle basis alone, because the generator $PHP$ of TD-CIS is non-local through the projector $P$; it is a truncated-CI property as well as a basis one (Hermann, Pohl, Tremblay and co-workers discuss the same defect for truncated-CI flux densities; HEARD, not re-fetched). What is exact and gated: the convention and sign of $\mathbf j$, the sense of a ring current, its reversal with the quarter turn, the vanishing angular momentum of a linear slosh, and the constancy of $\int(xj_y-yj_x)$ in time. FLOW is therefore labelled: sense exact, magnitude qualitative in a minimal basis. Open: whether a larger basis (6-31+G\*) closes the magnitude gap the way it closes the length and velocity gauge gap.
3. TDA and RPA ladders cross (benzene roots 2 to 4). A character-based matching between them, by maximal overlap of $X^{\rm TDA}$ with $X+Y$, is needed before any per-root comparison is displayed. Whether the overlap matching is unique inside degenerate blocks is open.
4. Conjecture: for the 52 accepted molecules the TD-CIS bright lines lie above the RPA ones by a margin that shrinks with the HOMO–LUMO gap. Untested; cheap to tabulate once stage 2 lands.
5. Whether the iPad needs any renderer work at all is a measurement, not a design question. It has not been made.
6. Astra's replay check stops at $t=2$ a.u. The long-trace behaviour, and the separation of integrator phase error from model error, is untested by either plan so far.

## 9 · References

- P. Krause, T. Klamroth, P. Saalfrank, J. Chem. Phys. 123, 074105 (2005), time-dependent CIS for laser-driven dynamics. Verified by search 2026-09-18.
- I. Barth, J. Manz, Y. Shigeta, K. Yagi, J. Am. Chem. Soc. 128, 7043 (2006), electronic ring currents from circularly polarised pulses. Verified by search 2026-09-18.
- I. Ulusoy, M. Nest, J. Am. Chem. Soc. 133, 20230 (2011), benzene. HEARD, from memory only.
- EISPACK `tred2`/`tql2` (Martin, Reinsch, Wilkinson), as transcribed in JAMA. The Cholesky reduction of the RPA problem is textbook; no novelty is claimed.
- PySCF TDHF and TDA documentation, as cited by Astra.
- Internal: `research/MATH-H2O-2026-09-11.md` (Proposition 1, JOSH'S QUESTION), `research/MATH-CHRONUSQ-PORTS-2026-09-11.md` (modified generators), `research/astra-2026-09-18/` (Astra's probe and measurements).

## 10 · Decisions (commissioner, 2026-09-18)

1. One register window with a two-position switch, ORBITAL PACKET and MOLECULE STATES, sharing lanes, dials, A/B stores, morph and modulation. Not two windows.
2. Opus at maximum effort builds stages 0 to 2. Order of execution: stages 0 and 2 together first (they share the solver files and give the visible preparation win), then stage 1 (the funnel), sequentially in one working tree so no two builders write the same file.
