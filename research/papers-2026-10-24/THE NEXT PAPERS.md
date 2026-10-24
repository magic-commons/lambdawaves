# λWAVES — the next papers

Claude Yan (Fable 5.1), 24 October 2026. Written for Josh and for whoever drafts next. Publication planning; no code was changed, no solve was run, nothing was posted.

What was read for this: the two live drafts (Draft 07 of 18 October, 11 + 15 pages, in `DRAFTS/CLAUDE COLLECTION REVIEW — 2026-10-12/`), the whole Sol dialogue (`SOL-6 LAMB of WAVES.md`, 5,558 lines, through a reader), the fifty Codex rounds and the monograph draft (`for CODEX/`, through a reader), the publication desk's own notes, OpenAI's catalogue of 372 result families in 719 manuscripts (`github.com/openai/math`, `overview.tex`, read whole), and the October 2026 argument about it: Tao's *Math 2.0* and *Proofs and Prompts* posts (6 and 8 October), the Association for Human Mathematics statement he reposted (7 October), Sophie Huiberts' guest essay *This is normal bad work* (12 October), and the Sienicki audit of the August proofs (arXiv 2608.14673). Sources are listed at the end with what was and was not verified.

Three deliverables sit beside this note:

- `DRAFTS/CLAUDE YAN HUMAN PASS — 2026-10-24/01-PLAYABLE-QUANTUM-FIELD/MANUSCRIPT.md` and `…/02-MOLECULAR-CURRENT/MANUSCRIPT.md`: Draft 08 of both papers. Prose only. A checker (`tools/numbers_check.py`) proves every number, display equation and reference line of Draft 07 survives (Paper 1: 145 numbers, 15 equations, 13 references; Paper 2: 200, 12, 16). Three background references were added to each and are marked "to be confirmed".
- This note.
- `~/Documents/DATABASE/CLAUDE/LAMBDAWAVES CLAUDE YAN FOR-JOSH 2026-10-24 (papers).md`: the decisions that are Josh's.

## 1. How the papers should sound

The October argument is useful to us not because of who is right about OpenAI but because the critics wrote down, under pressure, what a readable mathematical paper owes its reader. Boiled down and turned into house rules for λWAVES papers:

1. **Say on the first page which steps are new and which are known.** Huiberts: a prover must "explain what you did, including which steps required new ideas and which steps are already well-known." Draft 07 did this only in the status table at the end; Draft 08 does it in the introduction and again at each result.
2. **One idea per paper.** The release was faulted for "salami-slicing 372 results over 719 pdfs." Our collection went the other way on 12 October, three papers to two, and should stay there: a paper is a talk someone could give, not a ledger.
3. **The picture before the formula.** Tao's standing complaint about machine prose is that it "dwells at length on trivialities" and hurries past the step that matters. Draft 07 spent more words on binary16 rounding than on why two frames of equal density carry opposite currents. Draft 08 opens every section with the picture to hold in mind (a row of clock hands; a movie and its reverse; a basis that teleports probability) and demotes the device forensics to their evidential role.
4. **Keep the friction that teaches, cut the friction that does not.** Tao values the "natural friction" of a human author's difficulty because it makes the reader slow down where slowing down pays. The gcd proof of Proposition 1 is friction that teaches; the WGSL section numbers are not, and now sit in one paragraph a reader can skip.
5. **Ship the code and the data with the paper.** The release was faulted for promising code and not including it. Our edition already carries `verification/` with every control script and output and a work ledger of what changed and why. That ledger should be public with the papers: the Sienicki audit's main recommendation is a public correction record for both proofs and reviews.
6. **A human can give the talk.** Tao: authors should be able to "give a clear, expert-level talk on their results" before publication. Each of our papers now names the scene in the instrument that the talk would open with, and asks the reader to go and make it. The ten Bosch paper, Josh's format reference, does exactly this with 4D Toys.
7. **Attribute, including to the machines and to the human.** Ideas in this corpus came from Josh, from Sol, from Codex's rounds and from Claude's reviews, and the retractions came from Codex. The papers' bylines are Josh's call (below); the working records should name the source of each idea, and this note does.
8. **One at a time, read by a person first.** The AHM statement's complaint was bulk release without consultation. We have two papers; the right cadence is one, read by Josh and by one outside human, then the next.

None of this names the critics in the papers themselves. The craft should show, not tell. Nothing in Draft 08 cites the controversy.

## 2. What the corpus has actually established

The reader of the Sol dialogue and the reader of the Codex rounds agree with Sol's own verdict: about two hundred claim records, "not 48 breakthroughs". Most are classical facts rederived, conditional contracts, exact finite controls or counterexamples. The load-bearing items, labelled in the house vocabulary:

**Proved and checked (`[PROV]` with an exact control):**
- Proposition 1 of Paper 1: the field period is an integer multiple of the density period, the factor at one density period a primitive root of unity.
- Proposition 2 of Paper 2: in projected dynamics $\partial_t\rho+\nabla\cdot\mathbf j=2\,\mathrm{Im}\langle\Psi|\hat\rho R\rangle$ with $R=-(1-\Pi)H\Psi$, zero integral, first moment the gap between the dipole rate and the integrated current. Closed-shell real-time Hartree–Fock has no exchange source in a complete basis; the frozen-orbital packet does. On the water packet $q=g_{HL}/(\Delta\varepsilon\,x_{HL})=-1.32$.
- The index-order theorem: transposing $\Gamma$ reverses every current and no density (Paper 2, Equation 4), with the recorded near-miss in the app's history.
- The $h_q$ identity: hydrogen's density on a ring has exactly $2l_{\max}+1$ azimuthal channels ($\Delta m$, 21 for $n\le6$), and the forbidden channels read $1.4\times10^{-16}$ (Sol Experiment B, Codex Round 1). The Fejér-weighted mask is a valid mixed-state filter (a positive Schur channel) and a hard cutoff is not (Codex Round 2, Monograph ch. 3).
- The Pauli rank floor and the positive-tail contracts for low-rank factor truncation (Monograph ch. 2): $\|j_E\|_1\le\sqrt{2\delta\tau}$, $\|V_E\|_\infty\le\sqrt{8\delta\tau}$ (Hardy).
- The vortex-event classification: rank $J=1$ with rank $(J,F_t)=2$ classifies birth, saddle and death; an angular double root does not certify a reconnection (Codex Round 7, Monograph ch. 4).
- The two-level hydrogen continuity source in closed form (Paper 2, Figure 9).

**Negative results, first-class (`[WALL]`):**
- The vortex reconnection theorem of the September print is false: the four-mode state has a regular nodal curve tangent to the sampling circle, Jacobian rank 2 at 60 digits. The "≥ 1,480 reconnection events" census is unclassified. Codex found this; Sol made its correction a publication prerequisite.
- The quasicrystal sieve: by Parseval no Fourier mask beats the top-$K$ coefficients in $L^2$; the golden-spiral mask scored 0.9498 on a localised orbital against 0.0786 for top-$K$. Dead as a speedup, alive only as an instrument idea (Q-SIEVE).
- Adaptive and learned bases fail off their training family (extrapolation 0.521, rotation 0.989) and $L^2$-small errors can be derivative-large (gradient error 100, kinetic 5,000 against $L^2$ 0.01).
- Chebyshev minimax gives a better worst-case bound and worse actual answers than Neumann on the water response chain.
- Exact local face-flux repair can worsen its neighbours (Round 39); the shipped BALANCED repair fixes face integrals and can leave pointwise velocity about 50 % wrong (Round 37).
- The frozen water packet's integrated current runs *against* its dipole rate ($q=-1.32$). This is a result, and Section 3 makes it the hook of the next paper.

**Built into the app from this corpus:** the direct packet FLOW and the Löwdin factor current (`setPacket`, `setFactors`), the CONTINUITY RECORD tile, the GRID ERROR tile, ANDERSON in $d=1,2,3$ with $\langle r\rangle$, ANGULAR NODES, the seven-band BEAT EQUALIZER (the Schur-channel idea), BALANCED face-flux repair. Everything else, all 26 contracts included, is research only. One shortfall the Codex reader found: `chemview.js` calls `flow.setFloor(0, …)`, so the "assessed floor" collapses to the fixed $10^{-7}$. Worth a look when Josh is back at the app.

## 3. The next papers, ranked

Pairwise, by what a reader learns times how much of the evidence already exists. Each entry: thesis · the picture · what exists · what must be done · the figure that carries it · how it dies. Sizes are editorial targets.

### 3.1. The leak and the repair: where a finite basis creates probability, and the smallest current that puts it back

*Written: Draft 01 of 24 October, evening (`03-LEAK-AND-REPAIR/`; desk `DRAFTS/CLAUDE YAN PAPER 3 — THE LEAK AND THE REPAIR — 2026-10-24/`).*

**Thesis.** In a finite basis probability is conserved globally and violated locally by an explicit source $S=\partial_t\rho+\nabla\cdot\mathbf j$ (Paper 2, Proposition 2). This paper draws $S$, and then repairs it: the unique correction of minimal $L^2$ norm that makes the current conserving and confined is a gradient, $\mathbf c^*=\nabla\varphi$ with $\nabla^2\varphi=-S$ and no flux at the walls, and the repaired current's net flow is then exactly the dipole rate. (Corrected on 24 October, evening, by the pilot: the net flow depends on the walls. Closed walls carry the dipole rate inside, $q'\to+1$; open walls push it out as wall flux, $q'=q$; free space keeps one third. See `leak/LEAK-AND-REPAIR.md`.)

**The picture.** Probability does not leak out of the molecule; it is teleported within it, appearing near the nucleus and vanishing in the outer shell with no current between (Paper 2, Figure 9). The repair is the minimal plumbing that carries it instead.

**What is proved already.** Proposition 2 and Equation 12 of Paper 2. Two small additions are needed and are elementary; they are written here so a reviewer can check them.

*Lemma A (minimal confined repair).* On a bounded box $\Omega$ with $\int_\Omega S=0$, among all $\mathbf c$ with $\nabla\cdot\mathbf c=-S$ and $\mathbf c\cdot\mathbf n=0$ on $\partial\Omega$, the one of least $L^2$ norm is $\mathbf c^*=\nabla\varphi$, $-\nabla^2\varphi=S$, $\partial_n\varphi=0$. *Proof.* Helmholtz on a bounded domain with the no-flux condition: any admissible $\mathbf c=\nabla\varphi+\mathbf w$ with $\nabla\cdot\mathbf w=0$, $\mathbf w\cdot\mathbf n=0$, and $\int\nabla\varphi\cdot\mathbf w=\oint\varphi\,\mathbf w\cdot\mathbf n-\int\varphi\,\nabla\cdot\mathbf w=0$, so $\|\mathbf c\|^2=\|\nabla\varphi\|^2+\|\mathbf w\|^2$. $\square$ (Classical, the Helmholtz–Hodge projection on a bounded domain. Status `[C]`.)

*Lemma B (net flow of a confined conserving current).* If $\nabla\cdot\mathbf j'=-\partial_t\rho$ in $\Omega$ and $\mathbf j'\cdot\mathbf n=0$ on $\partial\Omega$, then $\int_\Omega\mathbf j'=\tfrac{d}{dt}\langle\mathbf r\rangle$. *Proof.* $\int\mathbf r\,\nabla\cdot\mathbf j'=\oint\mathbf r\,(\mathbf j'\cdot\mathbf n)\,dA-\int\mathbf j'$. $\square$ Without the wall condition the identity keeps the wall term: the open-wall repair carries the whole missing moment out through the walls and leaves $q'=q$, and the free-space minimal repair, whose potential has a dipole tail because $\int\mathbf r S\ne0$, keeps one third of it inside any ball or cube, $q'=(2q+1)/3$. The earlier draft of this lemma assumed decay the minimal repair does not have; the pilot's kill clause caught it. So the repair closes the dipole gap of Proposition 2 exactly under closed walls, which is the app's box: for the water packet the repaired net current changes sign, from $-1.32$ times the dipole rate to $+1$ times it. (Status `[PROV]`: the pilot of 24 October reproduces $q'=+1.000004$ at $224^3$ (1.18, 1.02, 1.003, 1.000004 over the four grids), with the identity residuals at $10^{-14}$; see `leak/LEAK-AND-REPAIR.md`.)

**The pilot (24 October, evening; `leak/leak_repair.py`, 177 s on two CPU threads at 224³).** The leak drawn from the Laplacians alone and split identically into the frozen-exchange part and the finite-basis part (the pointwise Fock residual): the first moment is 0.76 basis and 0.24 exchange, so STO-3G, not the frozen exchange, is the main reason the net current runs against the centre; the exchange part is diffuse (2 % of its mass within 0.3 bohr of a nucleus) and the basis part sits on the nuclei (21 %). The repair's norm is 0.13 of the current's and it moves the net flow by 2.32 dipole rates: the net flow is a small residual of a large circulating field. The figure is `leak/leak_repair_N224.png`.

**What must be computed.** $S$ pointwise. For the frozen packet $S=-2\,\mathrm{Im}(\bar\psi K_0\psi)$ plus the finite-basis term, and $K_0\phi_k(\mathbf r)=\sum_l\phi_l(\mathbf r)\,V_{lk}(\mathbf r)$ where $V_{lk}(\mathbf r)$ is the electrostatic potential at $\mathbf r$ of the product density $\phi_l\phi_k$. That is exactly the integral the app's ESP pass already evaluates (`tools/volumes/esp-pass.py`, PySCF `int1e_grids`), applied to transition densities instead of the ground-state density. For real-time Hartree–Fock and CIS the source needs $(1-\Pi)F\phi$ pointwise: kinetic and nuclear terms are analytic for Gaussians, the Hartree term is the ESP pass, the exchange term is the same `int1e_grids` call over orbital pairs. Then $\varphi$ from $S$ is one Poisson solve, and the app has a GPU Poisson pass with a core correction (`field.js`, iteration 014 B). Nothing new has to be invented; three existing pieces are composed. Cost: one more guarded water solve, or the exported solution already in `figures/source-captures/H2O_STO-3G_solution.json`, plus CPU time. The solvers' queue is not touched.

**Figure story.** (1) The water packet's $S$ in the $y=0$ section beside its current, both frames of the conjugated pair. (2) The repair field $\nabla\varphi$ and the repaired current, with the net flow arrow now pointing with the dipole rate. (3) The scalar meter: $\int\mathbf j$, $d\langle\mathbf r\rangle/dt$ and $\int(\mathbf j+\mathbf c^*)$ over one beat. (4) Benzene's ring preparation: $S$ for the STATES register, the first many-electron instance, and the defect 1.19 of the saved record re-measured. (5) The same water packet in 6-31G and 6-31G* from the volumes (the rungs exist for water), showing the source shrink with the basis. (6) The hydrogen two-level source as the exact control.

**Prior art to position against.** Lazzeretti's continuous-transformation-of-origin methods repair charge-current conservation in the magnetic-response setting, and Berger, Monaco and Zanasi's CTOCD-DC (2020) constrains the diamagnetic current to be divergence-free; the present repair is the $L^2$-minimal one for the time-dependent case and should be compared to theirs, not claimed as unrelated. Ehrenfest's theorem with a residual is textbook. The composition and the pictures are new to us; whether the minimal-norm repair for finite-basis time-dependent currents has been written down before is the "was this known" question to answer before posting.

**How it dies.** If `int1e_grids` over orbital pairs at $64^3$ is too slow to picture (it is $n_{\rm occ}\,n_{\rm AO}$ potentials on $262{,}144$ points; for water trivial, for benzene minutes), fall back to the $y=0$ section. The first kill clause already fired and was answered: the free-space repair does not give $q'=1$ (its potential has a dipole tail), the confined one does. What remains: if the 6-31G and 6-31G* rungs do not shrink the basis part while the exchange part holds, the three-quarters/one-quarter split is an STO-3G accident and the thesis must be narrowed to it.

Size: 8 to 10 pages. This is the strongest candidate because it turns the two papers' most awkward number into a prediction, uses only machinery the app has, and its two lemmas are checkable by anyone in an afternoon.

### 3.2. Knotted zeros you can turn: Berry's hydrogen knots in the $n\le7$ register

*Written: Draft 01 of 24 October, evening (`04-KNOTTED-ZEROS/`, record `knots/KNOTS.md`; desk `DRAFTS/CLAUDE YAN PAPER 4 — KNOTTED ZEROS IN SEVEN LEVELS — 2026-10-24/`). The lemma proposed below was false (a level holds one radial function per (l, m)); the proving lab proved its negation and built the knots by Berry's construction with the twist moved to the perturbation, which lowers every torus knot's level: trefoil and Hopf link at n = 4.*

**Thesis.** Berry (2001) showed that superpositions of degenerate hydrogen states can have zero lines that are knots and links, a link needing $n\ge6$ and a trefoil $n\ge7$. The register reaches $n=7$ since iteration 008. The instrument can therefore draw Berry's trefoil as a line of phase singularities the reader can rotate, slice and watch stay put under the common phase.

**The picture.** Around a nodal line the hue runs once round the wheel; the circulation is quantised; the line is a vortex. Tie it in a knot.

**What exists.** The 140-label register, the complex $Y_l^m$ in the Condon–Shortley convention, ANGULAR NODES in VORTEX, the vortex-event classification of Codex Round 7 (what a certified zero line is and is not), and the retraction of the reconnection theorem, which is the honest spine of any nodes paper.

**What must be done.** Take Berry's explicit coefficient recipe for the torus knots; build the state in the register; locate the zero set on the grid with the Round 7 criteria (rank conditions, not angular double roots); show it at 64³, 96³ and 128³ so the reader sees which crossings are sampling and which are the knot; a time strip under a Stark field to show a certified birth or saddle event where one exists, or say none does.

**Figure story.** The trefoil at three grids; the hue wheel around one strand; the Hopf link at $n=6$; the retracted "reconnection" of the September print beside its true geometry (a regular nodal curve tangent to the sampling circle), as a figure, not a footnote.

**Prior art.** Berry 2001 (Found. Phys. 31, 659); Bialynicki-Birula, Bialynicka-Birula and Śliwa 2000 (PRA 61, 032110) on moving vortex lines; Taylor and Dennis 2016 on random knotted eigenfunctions (already in the atlas); Kauffman and Lomonaco 2019 (arXiv 1904.07229) on which knots can be zero sets. OpenAI family 350 (Yau's nodal bound and its three- and four-dimensional counterexamples) is a statement to mention, not to lean on.

**How it dies.** If the trefoil's coefficients need $m$ or $l$ outside the register, or if the zero line cannot be resolved from sampling artefacts at 128³ with a stated amplitude cutoff (Paper 1, Equation 12), the paper shrinks to the link at $n=6$ or waits.

Size: 6 to 8 pages, visually rich.

### 3.3. One hundred and eighteen atoms in a browser: scalar ZORA with MacDonald–Vosko exchange

**Thesis.** The ATOM system solves every element to oganesson on a radial grid with the scalar ZORA kinetic operator and the relativistic MacDonald–Vosko exchange, and compares with NIST: the light 1s shifts NIST's by a factor $0.60$ (Ne) to $0.97$ (Rn), scaled totals within $0.1\%$, gold's 6s ionisation $8.65$ eV against the measured $9.23$, with Δ-SCF, quantum-defect and α-order readouts.

**The picture.** Why gold is yellow and mercury is liquid, drawn by a solver you can turn.

**What exists.** `lab/atoms.js` (`zoraKinetic`, `mvR`, `mvPhi`), `tests/atoms.test.mjs` with the non-relativistic oracles, the status line past Kr. The numbers in CLAUDE.md are the paper's table; they need re-running with their provenance recorded.

**What must be done.** The comparison table for all 118 against NIST's ASD and the Desclaux Dirac–Fock tables (the standard reference for relativistic atomic orbital energies), with a clear statement that spin–orbit is omitted and what that costs. The anion question: OpenAI family 263 claims a molecule with nuclear charge $Z$ binds at most $Z+CM$ electrons; the paper can illustrate the one-atom case with the Δ-SCF ion and say the theorem's status is a disputed AI preprint.

**Figure story.** Orbital energies across the periodic table, relativistic against non-relativistic; the 6s contraction of gold; the 1s density of Rn on the instrument against the NIST shift; the block-orbital tiles of the Picker as the paper's periodic table.

**How it dies.** It does not; it is a data paper. Its risk is overclaiming: Xα with MacDonald–Vosko is not Dirac–Fock, and the paper must say so on the first page.

Size: 8 pages with a long table in an appendix.

### 3.4. Nine thousand molecules on six rungs: the λWAVES volumes

**Thesis.** A documented, hash-pinned library: 8,984 molecules from six collectors with PubChem identifiers, each solved in RHF up the ladder STO-3G · STO-6G · 3-21G · 6-31G · 6-31G* · 6-31+G*, with the electrostatic potential on a 32³ grid, isomer links and geometry words, packed in a format a browser opens with zero solver calls; CPU and GPU solvers agreeing to $1.2\times10^{-11}$ Eh.

**What exists.** The pipeline (`tools/volumes/`), the format (`volumes-format.js`), the cut and WIP rules, the GPU/CPU comparison, 6,323 of 8,984 molecules solved at the time of writing.

**What must be done.** Wait for the queue; run the live passes Josh has not yet authorised (esp-pass, isomers, structure tags, the incremental pack); then compute the catalogue statistics (elements, sizes, rung coverage, failure reasons), and the solver-agreement table. OpenAI families 275 (QMA-hardness of continuum Coulomb energy) and 278 (a Coulomb density with no Kohn–Sham ensemble representation) are the two limit statements that frame what a library of mean-field solutions is and is not.

**How it dies.** If the live passes find many broken records, the paper waits for VOL. II.

Size: 6 pages plus a data appendix. The most citable thing the project can publish, because it is data.

### 3.5. Same picture, same bits: a reproducibility lock for a GPU instrument

**Thesis.** THE LOCK pins 843 + 987 digest leaves of the instrument's output on one machine; the paper explains what such a lock can and cannot promise, the one-ulp fault the RTX 3070 shows in power state P5, the device-dependent half-precision rounding both papers found, and the public correction record the edition kept.

**Why now.** The Sienicki audit's conclusion is that confidence should rest on several kinds of evidence with a public record; this paper is that record, for an instrument instead of a proof.

**What exists.** `digest-lock.mjs`, the fixtures, the P5 memory note, the capture ledgers, the independent checks and the responses to them.

**What must be done.** A second device (Josh's iPad or any other GPU) read back for the truncation question; a short study of the P5 fault's statistics.

Size: 6 pages. Methods paper; modest novelty, high usefulness.

### 3.6. Beats, revivals and the colour clock: Proposition 1 for the whole register

**Thesis.** Extend the two-level result to any set of levels: the density period, the field period, the colour return, fractional revivals as seams in a hue loop, the seven-band BEAT EQUALIZER as the instrument that hears $\Delta E$, and the $h_q$ identity that hears $\Delta m$ (the Angular–Bohr spectrogram, two axes).

**What exists.** Proposition 1, Robinett's review, the equalizer, the $h_q$ identity with its $10^{-16}$ control, the Fejér channel theorem. Averbukh and Perelman's 1989 revival theory is the classical anchor to cite.

**How it dies.** It is expository; it dies if it has no figure a reader has not seen. The two-axis spectrogram (hue by $\Delta m$, brightness by $|\Delta E|$) would be that figure.

Size: 6 pages.

### 3.7. A disorder instrument: the mobility edge on a six-cube

**Thesis.** LATTICE ANDERSON in $d=1,2,3$ with the level-spacing ratio $\langle r\rangle$ against its GOE $0.5307$ and Poisson $0.3863$ limits, IPR, seeds, $W_c\approx16.5$ in 3-D, honestly finite at $6^3$ sites; OpenAI family 261 (pure point spectrum in 2-D at every disorder, absolutely continuous spectrum in $d\ge3$ at weak disorder) as the statement illustrated, with its status as an unreviewed AI preprint stated.

Size: 5 pages. It exists in the app; the paper is mostly figures and honesty about finite size.

### 3.8. Coulomb Sturmians as a third basis (a pilot)

Josh's question of 9 October was whether there is an exotic third basis beside STO-nG and 6-31G. The quasicrystal sieve was the wrong answer and was shown to be. The right candidate has been in the app since iteration 009: the Sturmian register, where the hydrogen Sturmians with a scale $\lambda$ span 140 states and the Hylleraas–Undheim–MacDonald theorem is checked. Coulomb Sturmians are complete, discrete, carry the nuclear cusp exactly, and Avery and Avery have a programme for atoms (2003, 2006) and for many-centre molecules (2009, 2012), where for diatomics every integral is a function of $kR$ alone. A pilot: H₂⁺ and H₂ in a one- and two-centre Coulomb-Sturmian basis against STO-3G and 6-31G at matched basis size; energy, density and the continuity source of Section 3.1. The kill criterion is cost: if the two-centre integrals cost more than Gaussians at matched accuracy for anything beyond diatomics, the pilot reports that and stops. This is a research pilot, not an app feature, and belongs under `DATABASE/CLAUDE/APPS/LAMBDAWAVES/RESEARCH` with the discipline's dual gate.

### 3.9. Observable-aware factor truncation with printed bounds

Sol's sixth topic, now with the shipped factor road (`setFactors` over the Löwdin eigenpairs) and the ESP view to apply $\|V_E\|_\infty\le\sqrt{8\delta\tau}$ to. The pilot numbers exist ($6.52\%$ and $6.66\%$ lower current error at matched rank, the bound loose at $11.3\%$ against $1.79\%$ observed). A short methods paper once a held-out molecular set from the volumes is run.

### 3.10. What a picture cannot determine

The monograph's chapter 3 and 11: the 1,092 invisible operator directions of the $n\le6$ density movie, the $2p_x/2p_y$ example where density leaves $b_y$ unseen and one current readout lifts the rank, the two-point lower bound. A theoretical note that would give the STATUS line a fourth word: what this view *cannot* say. Lowest urgency; highest risk of being unreadable. Only after 3.1 has shown the style.

### Ranking, pairwise

3.1 over 3.2 (prediction over picture); 3.2 over 3.3 (novelty over data, and the register just reached $n=7$); 3.3 over 3.4 (ready now against waiting for compute); 3.4 over 3.5 (data over method); 3.5 over 3.6 (useful over expository); 3.6 over 3.7; 3.7 over 3.8 (shipped over pilot); 3.8 over 3.9 (a real open question over a confirmed modest gain); 3.9 over 3.10.

## 4. Deeper solvers: what the corpus points at

"More powerful" here means a solver that answers a question the current one cannot, with a bound it can print. Five, each composed from pieces the app already has:

1. **The source field and the minimal repair** (Section 3.1). Composes the ESP pass, analytic Gaussian derivatives and the GPU Poisson pass. Gives FLOW an exactly conserving current and a scalar meter ($\int\mathbf j$ against $d\langle\mathbf r\rangle/dt$) that costs nothing. This is also the honest replacement for the face-flux BALANCED repair, which Codex showed can leave pointwise velocity 50 % off.
2. **A real FLOW floor.** Codex contracts 11 and 12: leverage functions $\ell_0,\ell_1$ from the AO values, $S$ and the kinetic matrix give a pointwise floor and a velocity bound; one small solve per tracer. Replaces the `setFloor(0)` no-op. The trails could fade at a bound instead of a constant.
3. **Factor truncation with live $\delta,\tau$ readouts** (Section 3.9). The Löwdin eigenpairs are already computed; the leading eigenvectors of $F^\dagger(S+\eta K)F$ give fewer factors for kicked states; $\sqrt{2\delta\tau}$ and $\sqrt{8\delta\tau}$ become printed bounds on current and on ESP error.
4. **Projector spectral repair for interpolated densities.** Contract 3: a matrix within $b<\tfrac12$ of a rank-$r$ projector has a nearest projector $\Pi=1_{(1/2,\infty)}(p)$ with $\|\Pi-P\|\le b/(1-b)$. One eigendecomposition turns MORPH's and the volumes' rung interpolations into admissible closed-shell density matrices with a printed error. Cheap, and it makes the A ↔ B morph physical.
5. **The symmetry stabilizer as a certification meter.** Sol turn 6: $\epsilon_g(t)=\|U_gDU_g^\dagger-D\|_F/\max(\|D\|_F,\epsilon_0)$ for the point group's $g$; if $[U_g,H(t)]=0$ and $D(0)$ is invariant then $D(t)$ stays invariant, so a drifting $\epsilon_g$ is a solver defect, not physics. Benzene's $D_{6h}$ and water's $C_{2v}$ make it a one-line readout.

And one that is not a composition but a research programme: **the Sturmian pilot** (Section 3.8). It is the only candidate here that could change the basis the molecular solver uses, and the only one with a serious chance of failing.

What the corpus says *not* to build: a quasicrystal sieve as a speedup, a learned adaptive basis that must extrapolate, a Fourier transform below $n\log n$ (family 130 is theoretical, $\delta=10^{-13}$), a hard angular cutoff (indefinite "density"), a WGSL compiler before a kernel registry.

## 5. The OpenAI families worth reading, and how to use them

Read as statements to illustrate or to position against, never as engine assumptions; their proofs are unreviewed and several in the release have been withdrawn. Paths are under `github.com/openai/math/blob/main/preprints/`.

| Family | Statement (as the catalogue puts it) | Use for us |
|---|---|---|
| 261 Anderson | 2-D: pure point spectrum at every positive disorder; $d\ge3$: absolutely continuous spectrum at weak disorder on a fixed interval | Paper 3.7's framing statement |
| 263 Ionization | A Coulomb molecule with $M$ nuclei of charge $\ge1$ and total charge $Z$ binds at most $Z+CM$ electrons | Paper 3.3's anion aside |
| 265 Area law | Entropy area law for unique gapped ground states on 2-D square-lattice domains | Scope statement for any future many-body view |
| 268 Haldane gap | Spin-one Heisenberg chain on even rings stays gapped | Sol's SPIN CHAIN instrument, if ever |
| 269 Laughlin gap | Fermionic Laughlin gap at filling 1/3 on the sphere, stable under weak scalar disorder | Sol's long-term many-body demo |
| 275 Coulomb QMA | Approximating the continuum Coulomb ground energy is QMA-hard even with unit nuclear charges | Paper 3.4: what a mean-field library is not |
| 278 Kohn–Sham | A three-electron Coulomb density with no noninteracting ensemble representation by one local potential | Paper 3.4 and the Δ LDA−RHF view's caption |
| 350 Yau nodal | Sharp $C\sqrt\lambda$ nodal length on surfaces; fails in dimensions 3 and 4 | Paper 3.2's framing |
| 369 Hot spots | First Neumann eigenfunctions of simply connected planar domains have no interior critical point | The BOX system: a statement the WELL can illustrate in 2-D |
| 371 Defocusing NLS blow-up | Stable finite-time blow-up on $\mathbb T^{12}$ for large odd powers | None for us; a reminder that NLS is a separate laboratory |
| 362 Vlasov–Maxwell, 365 inverse gauge connections | Global smoothness; metric and unitary connection from one boundary patch | None now; 365 is the identifiability idea behind any inverse-Lissajous instrument |

The two Sol flagged for engine relevance, 278 and 275, are the right ones: they say what single-determinant and mean-field pictures cannot be, and a library paper should quote them for that.

## 6. Papers to read before the next draft

Verified today by title, authors, venue and year through search results; DOIs to be pulled from the publisher at bibliography time.

- M. V. Berry, *Knotted zeros in the quantum states of hydrogen*, Foundations of Physics 31, 659–667 (2001). The construction for Paper 3.2; a link needs $n\ge6$, a trefoil $n\ge7$.
- I. Bialynicki-Birula, Z. Bialynicka-Birula, C. Śliwa, *Motion of vortex lines in quantum mechanics*, Phys. Rev. A 61, 032110 (2000), arXiv quant-ph/9911007. Exact solutions with vortex creation, annihilation and interaction; the right companion to the Round 7 classification.
- I. Barth, J. Manz, Y. Shigeta, K. Yagi, *Unidirectional electronic ring current driven by a few cycle circularly polarized laser pulse: quantum model simulations for Mg-porphyrin*, J. Am. Chem. Soc. 128, 7043 (2006); and Barth and Manz, Angew. Chem. Int. Ed. 45, 2962 (2006). The ring current FLOW is meant to show, computed properly.
- P. Lazzeretti, *Ring currents*, Prog. NMR Spectrosc. 36, 1–88 (2000); R. Zanasi, P. Lazzeretti, M. Malagoli, F. Piccinini (1995) on CTOCD-PZ; A. Caputo, M. Ferraro, P. Lazzeretti (2000) on CTOCD-DZ with exact charge and current conservation in any basis; Berger, Monaco, Zanasi (2020) on CTOCD-DC, the divergence-free variant. The prior art Paper 3.1 must position against.
- J. Avery and J. Avery, *Generalized Sturmians and Atomic Spectra*, World Scientific 2006; *Can Coulomb Sturmians be used as a basis for N-electron molecular calculations?*, J. Phys. Chem. A (2009); *Sturmians and generalized Sturmians in quantum theory*, Structure and Bonding (2012). The Sturmian pilot's literature.
- B. Thaller, *Visual Quantum Mechanics*, Springer 2000. The origin of hue-as-phase for quantum pictures; added to Paper 1's related work.
- R. W. Robinett, *Quantum wave packet revivals*, Phys. Rep. 392 (2004), already cited; I. Sh. Averbukh and N. F. Perelman, *Fractional revivals* (Phys. Lett. A 139, 449, 1989) for Paper 3.6 — from memory, confirm.
- E. Artacho and D. D. O'Regan, *Quantum mechanics in an evolving Hilbert space*, PRB 95, 115155 (2017), in the atlas; the moving-basis connection already in `mo.js`.
- On the writing itself: T. Tao, *Math 2.0* (6 October 2026) and *Proofs and Prompts* (8 October 2026) on terrytao.wordpress.com; S. Huiberts, *This is normal bad work*, guest post there (12 October 2026); the AHM statement (7 October 2026); M. and K. Sienicki, *A Human Audit of OpenAI's AI-Generated Mathematical Proofs*, arXiv 2608.14673. Read for the standard they set, not for the quarrel.

## 7. What is Josh's to decide

Listed in the FOR-JOSH note with the recommendation beside each: the byline of Draft 08; adopting the human pass whole or merging it into Draft 07; which next paper goes first (recommendation: 3.1, then 3.2); authorising the CPU computation 3.1 needs (no solver, no GPU; the exported water solution suffices for the first figures); whether the public edition carries the work ledger and the verification folder (recommendation: yes); whether to cite the October argument anywhere (recommendation: nowhere in the papers).

## Sources

Verified in this session: the two Draft 07 manuscripts and their decision memo, work ledger and verification folder; `SOL-6 LAMB of WAVES.md` and the `for CODEX` rounds through two readers whose digests are kept with this note's working records; `overview.tex` of `github.com/openai/math` (372 families, 719 manuscripts; the physics families read in full); Tao's living summary of his AI views (`teorth.github.io/tao-web/ai-views.html`), Huiberts' guest post and the AHM statement on terrytao.wordpress.com; the arXiv record of 2608.14673; search records for Berry 2001, Bialynicki-Birula 2000, Barth–Manz 2006, Avery 2006/2009/2012 and the CTOCD papers. From memory and flagged above: Thaller 2000 (confident), Dirac 1931 and Hirschfelder 1974 (confident, added to Paper 1), Averbukh–Perelman 1989 (confirm), the Desclaux tables (confirm).
