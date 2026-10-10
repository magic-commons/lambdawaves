# CODEX-ROUNDS — Sol's 26 research rounds, read for the 0.5.4 PRE-MATH plan

Claude (Opus 5.5) for Claude Sos · stamped `Sat Oct 10 05:04:16 PM CDT 2026` · read-only digest; nothing in the vault was edited, run or moved.

**Corpus.** ROOT = `~/Documents/OBSIDIAN/LAMB of WAVES/for CODEX/`, written by Sol (GPT-6.1 via Codex). Paths below are relative to ROOT.
- `Rn/` means that round's folder.
- `SOL-Rn` means the round's top-level report `SOL — <title> — <date>.md`. For Rounds 2–14 that report is the round's main text, because those rounds have no README.
- `HANDOFF` = `RESEARCH CONTINUATION HANDOFF.md`; `INDEX` = `RESEARCH INDEX.md`.

**Quotes.** Every quoted sentence was checked with `grep -F` against the corpus before this file was saved. Missing spaces such as "Round13" are Sol's own.

**Two warnings for planners.**
1. The corpus never claims that λWAVES implements any of this.
   - MONOGRAPH.md: "No research prototype is silently presented as a deployed λWAVESfeature."
   - Chapter 10 (R25): "Whether an application currently implements them requires a separately scoped engineering/integration review."
2. Every *engine contract* below is a research requirement for a future adapter, not a description of the current code.
   - The production checkout Sol inspected was main `28fe4457b68f0a012f49efee174bcfc91f083ce0`.
   - It was read only. Every `final_checks.json` records `"production_tracked_changes": false`.

## 1. One row per round

Status words are the round's own. Every round is dated 2026-10-09, except Rounds 21–26, which are dated 2026-10-10 (from provenance.json, PROTOCOL headers and report headers). The last column is what the round asks of the λWAVES engine or app.

| n | Title | Date | Set out to do | Established (round's own words) | Carrying artefact | Asks of the λWAVES engine/app |
|---|---|---|---|---|---|---|
| 1 | ENGINE UPGRADE | 10-09 | Earlier numerical/source audits and pilot inputs (INDEX). Companion top-level reports: mathematical atlas, scientific architecture audit, vortex reconnection audit. | Not surveyed here; another survey covers Round 1. HANDOFF: the atlas and audits "recovered the project's physical/state conventions and exposed a false reconnection interpretation". | `R1/adversarial_review.md`, `R1/engine_map/`, `R1/pilot_math/`; `SOL — λWAVES mathematical atlas`, `… scientific architecture audit` | See the other survey. One line matters for precision (§3.8): the architecture audit's "AO accumulator is Float32Array: every += rounds to f32." |
| 2 | OPENAI MATH — DISCOVERY | 10-09 | Triage of the OpenAI/math catalogue at pinned commit `fd4aeeb…`: 372 families, 719 manuscripts, with selected readings of 20 families. | "a physically valid mixed-state Angular–Bohr equalizer"; 351 joint density channels for n≤6 hydrogen, an exact count. Lean status: "source inspection, not a successful compiled kernel check". | `SOL-R2`, `R2/Positive quantum equalizers.md`, `R2/Angular–Bohr support and rank.md`, `R2/CATALOGUE READING LEDGER.md` | A "typed mathematical contract" per operation. Rotate current as a vector before averaging. "Pairwise, compensated and f64 accumulation remain essential baselines." |
| 3 | OPENAI MATH — DISCOVERY | 10-09 | Eight more families and ten manuscripts, read for observability, protected coherence and transport. | "This is a **lower bound on the kernel**, not an exact rank calculation" (1092 invisible directions). Residuals are "floating-point witnesses, not interval certificates". | `R3/Finite synthesis.md`, `R3/Reading ledger.md` | "build the measurement matrix before running state fitting". "A single renderer tolerance cannot certify every scientific observable". |
| 4 | BREADTH SYNTHESIS | 10-09 | Nine geometry/control/memory/response derivation threads with finite probes. | Exact small-model identities, but "These are proposals, not completed general theorems." | `R4/Derivations.md`, `R4/Sources and reading.md` | Moving-basis derivatives in a common physical space. A density-weighted curvature "should not automatically be called a topological invariant." |
| 5 | SOL FLESHING | 10-09 | A derivative-aware compression contract, rank floors and limits of learned bases. | Derived tail bounds: "No new OpenAI theorem is needed." Pauli floor ⌈N/2⌉. Fixed-span rotation floor of 52.2% at l=5. | `R5/Derivations.md`, `SOL-R5` | Measure omitted charge δ and kinetic τ. "Operator rewrites therefore need a statement scope, representation assumptions, and a separate numerical-error analysis." |
| 6 | COMPRESSION EXPERIMENT | 10-09 | Pilot on water and benzene (Cartesian 6-31+G*): 6 snapshots, 88 rank/weight variants, protocol fixed before results. | Numerical accuracy gains were modest. Timing was "exploratory". "**Continue this as a research prototype.**" | `R6/PROTOCOL.md`, `R6/REPRODUCE.md`, `R6/results/` | "Keep exact occupied factors as the baseline for Slater states, and select compression by separate observable budgets." Thresholds are "not adopted production tolerances". Next: a float32/WebGPU comparison. |
| 7 | VORTEX AND TOPOLOGY | 10-09 | Physical vortex-event oracles, a local event classifier, and the topology limit of compression. | Exact symbolic PDE and normalization checks. "Positive compression can introduce false density zeros." Locality bounds rest on point samples only. | `R7/Derivations.md`, `R7/results/oscillator.json` | "FLOW tracers cannot certify nodal topology simply by following j/ρ." The oracles are "saved as compact future engine oracles"; "no engine integration has been performed". |
| 8 | PHONONS AND OPERATOR UPGRADES | 10-09 | Phonon frontier, a new optimized water RHF Hessian benchmark, and response-aware compression. | "**A validated water vibration reference.**" Frequencies are "unscaled method-specific harmonic predictions". Plus an exact electron–phonon oracle. | `R8/Derivations.md`, `R8/results/` | A "**research validation contract**" for vibrations. Hessian-vector validation for EIGENMORPH/PES. "merely differentiating coefficient arrays is not a physical response calculation." |
| 9 | RESPONSE TRANSFER AND RESIDUAL SOLVER | 10-09 | Wider and asymmetric geometries for water and formaldehyde (22 cases); a matrix-free, residual-stopped response solver. | "This is numerical validation of a conditional theorem, not an interval/Lean certificate." The stiffness floors were supplied offline. | `R9/Derivations.md`, `SOL-R9` | Solver contract: "accepts B, an operator exposing AV, a positive lower bound and an optional transported initial span". 0.1% is a response target, "not a frequency tolerance". |
| 10 | STIFFNESS CERTIFICATES AND CPHF COMPARISON | 10-09 | Eigenvalue-free stiffness bounds, a genuine PySCF CPHF comparison, and oracle/sampling obstructions. | α₄ is "positive on **all 22 frozen cases**" (float64). Online columns: 49 recycled, 75 fresh, 105 PCG, 107 CPHF. "These are **column counts, not time ratios**." | `R10/coercivity/Proofnotes.md`, `R10/cphf_comparison/README.md`, `R10/family_bounds/Derivations.md` | Corrected output Rv=4(BᵀX+XᵀB−XᵀAX). The mandatory final AX action. Its PROTOCOL's do-not line on point samples, floating residuals and column counts (§4). |
| 11 | ANCHOR REUSE AND VALIDATED MATRIX PATCHES | 10-09 | Water anchor path over s∈[−.05,.05]: exact dyadic stored-matrix certificates, an affine proxy, a Neumann response, a Boys oracle. | "This is a validated continuous **proxy** statement." "This is a sufficient validation target; the physical remainder has not been established." | `R11/exact_matrices/Derivations.md`, `R11/branch_geometry/Derivations.md`, `SOL-R11` | Chart Hessian "**Ezz=4ACPHF**"; sign convention "**B=−Fs**". Boys normalization must not be copied from Forgy–Mazziotti. Differentiate the moving Coulomb center. |
| 12 | VALIDATED MOLECULAR BRANCHES AND POLYNOMIAL RESPONSE | 10-09 | Continuous Gaussian S/K blocks, a frozen-model SCF root, minimax response, a physical H2 control, and a tensor bridge. | "It supplies a working proof architecture, not a water certificate." The water tensor bridge is conditional on full tensor errors: "These assumptions have not been established for water." | `SOL-R12`, `R12/PHYSICAL BRIDGE.md`, `R12/gaussian_intervals/Proofnotes.md` | Cartesian d components are not individually normalized. Tensor errors "must include basis normalization, integral, orthogonalization and frame-transformation errors." |
| 13 | FULL COULOMB AND PHYSICAL WATER SLABS | 10-09 | Every S/K/V/ERI entry for water, an exact physical frame, a certified local RHF branch and ideal response. | Certified \|s\|≤10⁻¹² → 10⁻¹⁰: "a proof-chain milestone, not yet a chemically useful deformation range". At 10⁻⁹ a "proved obstruction", not instability. | `SOL-R13`, `R13/OBSERVABLE CONTRACTS.md`, `R13/physical_chart/`, `R13/full_eri/` | Native x87 arithmetic assumptions. Four-leg normalization. "Numerical force/Hessian accuracy needs geometry derivatives and nuclear couplings." |
| 14 | OPENAI BOUNDARY RESEARCH | 10-09 | Josh paused the physical-water program. Two agents read disjoint OpenAI/math and Mandelbrot lanes. | "This round contains source/proof readings and exact finite mathematical controls only." Recommends a shared-parameter Taylor model with a predicted chart. | `SOL-R14`, `R14/TRANSFER CRITERIA.md`, `R14/METRIC QUOTIENT.md` | "Every occurrence of the same M, Gram matrix or parameter must remain the same expression node until cancellations are formed." |
| 15 | DEPENDENCY PRESERVING TAYLOR CONTRACT | 10-09 | An exact coefficient/error DAG with C0/C1/C2 ledgers, inverse domains, exp/Boys tails and projector identities. | "This is a proof-only pilot." 20 scenarios and 13 required rejections; 651 exact plus 189 high-precision checks. | `R15/README.md`, `R15/taylor.py`, `R15/Proofnotes.md` | Rejects "implicit float coefficients". "Unknown derivative error remains unknown." |
| 16 | VALIDATED ODE FRAMES AND ANALYTIC CHARTS | 10-09 | A nonpolynomial producer from an exact linear IVP, congruence whitening, and analytic root derivatives. | "a bounded mathematical reference implementation, not production or a formal verifier"; 864 checks and 10 rejections (INDEX). | `R16/README.md`, `R16/producer.py`, `R16/Proofnotes.md` | "never identify Y with the principal root of B^T B". Transforms with all four tensor legs. Oracle limits: exp centre ≤64, Boys centre ≤40. |
| 17 | ENCLOSED ODE INPUTS AND RECTANGULAR FRAMES | 10-09 | Enclosed coefficient boxes, approximate whitening with a centre defect, and rectangular frame motion. | "All6226checks,20models and19required rejections pass." "a research reference, not certified production execution or a formal verifier." | `R17/README.md`, `R17/enclosures.py`, `R17/Proofnotes.md` | Retain the horizontal (extrinsic) subspace term and the energy offsets. No blind transfer to unbounded or pointwise operators (§3.4). |
| 18 | DIRECT PROJECTOR TRANSPORT AND MONOGRAPH | 10-09 | Direct real projector transport P'=AP+PA^T−P(A+A^T)P, plus the monograph opening, map and 23-claim register. | 12 cases, 17 rejections, 2546 checks. Value bounds are 2–5% tighter on the same model. "an initial writing checkpoint, not a completed monograph". | `R18/transport.py`, `R18/Proofnotes.md`, `R18/MONOGRAPH MAP.md`, `R18/CLAIM REGISTER.json` | "Thin factor evaluation may remain cheaper when the user needs orbitals or many spatial samples." A direct projector omits the frame's gauge. |
| 19 | MONOGRAPH COMPRESSION AND RESPONSE | 10-09 | Chapters 1, 2 and 6, a notation appendix, and signed spectral-absolute error contracts. | 110 exact and 128 source checks: "bounded algebra/data reviews, not a formal proof assistant". | `R19/NOTATION AND CONVENTIONS.md`, `R19/CHAPTER 2 …`, `R19/CHAPTER 6 …` | The current-transpose convention, K_AO=−Δ/2, and the factor 4 (§3.2, §3.6). |
| 20 | MONOGRAPH SYMMETRY AND INVERSE INSTRUMENTS | 10-09 | Chapter 3: support counts, observation ambiguity, a two-mode inverse example and state-valid filters. | 80 exact and 45 scope checks. "It is not a full91mode tomography solver". | `R20/CHAPTER 3 — Symmetry observability and inverse instruments.md` | Inverse fitting "should return identifiable quantities or a feasible state set" (R20 NEXT SCOPE). |
| 21 | MONOGRAPH NODES VORTICES AND FLOW | 10-10 | Chapter 4: event classifier, exact oracles, positive-tail topology limits and conditional FLOW paths. | 53 exact and 35 checks. It "does not reclassify the historical hydrogen census or certify a molecular trajectory/domain." | `R21/CHAPTER 4 — Nodes vortices and FLOW.md` | The FLOW contract: floor margin, containment, frozen-frame error (§3.7). |
| 22 | MONOGRAPH MOLECULAR REPRESENTATIONS AND INTEGRALS | 10-10 | Chapter 5: AO covariance, Boys regularity, frame derivatives and a sharp pair-error interval. | 91 exact and 44 scope checks. The water chain is presented as archived. No new physical claim. | `R22/CHAPTER 5 — Molecular representations and integrals.md`, `R22/DERIVATIVE NOTE.md` | A basis is a definition, not a label. A regular Boys branch at T=0. All four ERI legs (§3.1, §3.3). |
| 23 | MONOGRAPH VIBRATIONS MEMORY AND CORRELATION | 10-10 | Chapters 7 and 8: response-to-frequency amplification, hidden correlations, pair-phase movies. | 63 exact and 57 checks. "no force/frequency/source-closure/performance/deployment certificate is added." | `R23/CHAPTER 7 …`, `R23/CHAPTER 8 …`, `R23/RESPONSE AND MEMORY NOTES.md` | "Do not relabel an archived electronic solve as a frequency certificate." |
| 24 | MONOGRAPH GEOMETRY AND PROJECTOR REPAIR | 10-10 | Chapter 9 plus ideal spectral repair of an approximate projector (b<1/2). | 59 exact and 49 checks. It "does not validate a native eigensolver or turn C0accuracy into derivative accuracy." | `R24/CHAPTER 9 — Validated geometry and subspace transport.md`, `R24/PROJECTOR REPAIR NOTE.md` | Repair gives admissibility, not accuracy; "Admissibility repair can worsen target accuracy." |
| 25 | MONOGRAPH CLOSING CHAPTERS AND COMPLETE DRAFT | 10-10 | Chapters 10–12 and the twelve-chapter assembly (21,883 words), plus precision, cost and information notes. | 61 exact and 95 checks. "A complete first draft is not a publication-ready monograph or complete scientific programme." | `R25/MONOGRAPH DRAFT — 2026-10-10.md`, `R25/CHAPTER 10/11/12 …`, `R25/PRECISION AND INFORMATION NOTES.md` | The heart of this survey: Chapter 10 §10.1/§10.5 and Chapter 12 §12.2/§12.5 (§3.8–§3.9). |
| 26 | PROJECTOR DERIVATIVE ERROR TRANSPORT | 10-10 | Close Chapter 9's ideal C1/C2 repair-error gap: mixed directions, moving frames, a Fraction budget adapter. | 106 exact checks, 49 adapter checks and 9 rejections. It "does not supply missing molecular derivative inputs or a native eigensolver/force/frequency/performance certificate." | `R26/DERIVATIVE ERROR THEOREM.md`, `R26/MONOGRAPH ADDENDUM — Repairing derivative errors.md`, `R26/contract.py` | "Do not infer a full-force/Hessian/frequency certificate from the new bounded one-body formula." (§3.4) |

Claim registers (R18→R26) grow from 23 to 58 claims. In R26: 40 project derivation/controls, and 3 each of classical background, model certificate, numerical experiment, research implementation and open application, plus 3 frozen-evidence expositions. Every claim has `"general_novelty_assessed": false`.

## 2. The spine

1. **What the programme is:** "the mathematics needed to trust its outputs" (R18 MONOGRAPH MAP.md). It studies symmetry- and observable-aware representations of a state (MODE/PACKET/FIELD; density, current, 1RDM), each with an error budget, then validated continuation of molecular branches and projectors over geometry.
2. **Physical arc, R6–R13:** compression pilot (R6) and vortex oracles (R7) → response reuse (R8–R11) → an integral → frame → SCF → response proof chain for water (R12–R13). It stops at \|s\|≤10⁻¹⁰; the budgets provably cannot close at 10⁻⁹.
3. **Proof-only arc, R14–R18:** jets and remainders, IVP frames, whitening, rectangular motion, direct projectors.
4. **Monograph, R18–R25:** *λWAVES: States, Observables and Numerical Contracts*. **R26** closes the ideal derivative-repair gap.

**Proven** (exact or ideal model certificates, under stated arithmetic assumptions): finite counts and filters (R2–R3); tail inequalities (R5, R19); event oracles and the classifier (R7); dyadic stored-matrix certificates and the affine proxy (R11); the physical H2 model (R12); the water slab (R13, native x87 assumptions); Taylor/IVP/frame/projector contracts (R15–R18); spectral repair (R24); derivative transport (R26).
**Numerical only:** R6 compression accuracy and its exploratory timings; R7 locality samples; R8 frequencies ("unscaled method-specific harmonic predictions"); R9 transfer ("numerical validation of a conditional theorem"); R10 α₄ ("Float64 numerical sanity audit; no interval or whole-region proof.").
**Failed or negative, kept on purpose:** the 10⁻⁹ discriminant; PySCF default residuals reaching 6.50e−4; uniform Chebyshev observed worse than Neumann; 25% repair worsening; the "1480-event census remains unreclassified".

**Paused, in the rounds' exact words.** No sentence in R2–R13 contains "pause". The pause begins at R14, and every round from R15 to R26 repeats it.
- R14 `PROTOCOL.md`: "User explicitly requested pausing the physical-water program and sending exactly two agents to read different OpenAI/math materials that might help the next research boundary."
- R14 `TRANSFER CRITERIA.md`: "The physical water program is paused at Round13." and "Keep new physical experiments deferred until the literature pause is lifted."
- `SOL-R14`: "The physical-water program remains paused; this detour establishes neither a wider water interval nor a runtime improvement."
- R15 `NEXT SCOPE.md`: "No physical radius, force/frequency accuracy or performance claim follows until a later physical adapter is supplied and the paused program resumes."
- R18 `NEXT SCOPE.md`: "Resume the physical programme only when the user explicitly does so."
- R25 Chapter 12: "This chapter distinguishes editorial work, proof-only research and physical experiments that remain paused."
- R26 `NEXT SCOPE.md`: "SCF/FCI/integrals, numerical dynamics, trajectories, historical event census, geometry runs and quiet timing/GPU work require explicit resumption."
- HANDOFF: "The physical program remains **PAUSED**."

## 3. The engine contracts

Each item is *round · file · quote*. These are the lines a PRE-MATH plan must honour before Sol's mathematics can land.

### 3.1 State, basis and AO conventions
- R22 · Chapter 5 §5.1 · "A cloud can look unchanged after an inconsistent conversion while its electron count, kinetic energy or current changes. A molecular instrument therefore needs a mathematical contract at the boundary between functions, coefficients and operators."
- R22 · Chapter 5 §5.1 · "For factors F and D=FF†, electron number is Tr(SD), not generally TrD."
- R22 · Chapter 5 §5.2 · "Ordering, angular factors, primitive normalization and contraction normalization are part of the definition. A basis name alone does not resolve those choices."
- R22 · Chapter 5 §5.2 · "Cartesian and spherical shells differ: a Cartesian d shell has six components, a spherical d shell five."
- R12 · `gaussian_intervals/Proofnotes.md` · "In particular Cartesian d components are not individually normalized: xx,yy,zz have a different norm from xy,xz,yz."
- R6 · `REPRODUCE.md` · "PySCF Cartesian components are rescaled to unit self-overlap for compatibility with the repository evaluator. Coefficients and S/K/V matrices receive the corresponding transformations."
- R25 · Chapter 10 §10.1 · "An AO coefficient object needs basis order, overlap, normalization, geometry, units and model provenance. A renderer needs the requested observable, reconstruction precision, sample domain, resolution and transfer function."
- R25 · Chapter 10 §10.1 · "Changing exposure or a visible threshold should not modify electron occupations. Moving nuclei changes basis/operator inputs and may require a new solve or a certified continuation; it cannot silently reuse a static molecular record as an exact solution of the changed problem."
- R25 · Chapter 10 §10.1 · "An orbital-only larger-AO record did not establish full-density, CIS or TDHF support at that size." / "A geometry marked draft remains draft even if the orbital image is smooth."
- R19 · `NOTATION AND CONVENTIONS.md` · "AO indices do not automatically have orthonormal creation/annihilation operator meanings; a dual-basis convention is needed to interpret them as such."
- R19 · NOTATION · "Complex spatial bases, nonzero electromagnetic vector potentials and other spin sectors require their own formulas."
- R26 · `ASSUMPTION AND SOL AUDIT.md` · "Shared notation defines χ as a column, while Chapter5.1 explicitly adopts a row convention." Open harmonisation item.

### 3.2 Density, current and kernel conventions
- R19 · NOTATION · "The transpose is essential for current: using D in this last ordered contraction reverses its sign. Density cannot detect that error because its imaginary antisymmetric contribution cancels."
- R6 · `REPRODUCE.md` · "The repository molecular-flow convention uses the creator-index 1RDM, the transpose of this coefficient kernel. Its imaginary matrix receives Im(Dᵀ). Explicit current checks catch this sign/convention difference."
- R19 · `CHAPTER 2` · "A physically useful equivalence test must include a complex current-carrying state, not only a real ground-state cloud."
- R6 · `PROTOCOL.md` · "Zero-vector-potential particle current, atomic units, float64/complex128. Approximate densities are positive under-approximations without charge renormalization."
- R19 · NOTATION · "Tau uses K_AO=-Delta/2. Replacing it by a gradient-squared matrix without the half changes every sqrt2/sqrt8 constant."
- R19 · NOTATION · "Calling the bare contraction fully electromagnetic-gauge invariant would omit that term and the corresponding state/operator transformation."
- R2 · `SOL-R2` · "Current must rotate as a vector before averaging; scalar smoothing of fixed Cartesian current components is generally wrong."
- R25 · Chapter 10 §10.5 · "A positive compression cut with reduced trace must retain its omitted-charge semantics rather than being silently normalized."
- R25 · Chapter 10 §10.2 lists four ranks: occupied, state-factor, product-space and response-span. R13 · `SOL-R13` · "Product-space rank, occupied-density rank and response-span rank remain distinct."

### 3.3 Integrals: Boys, ERI and tensor legs
- R22 · Chapter 5 §5.3 · "At coincident centers the gradient is zero and the Hessian is −2γI/(2m+3). A zero argument therefore demands a regular evaluation branch, not rejection of the physical configuration."
- R22 · Chapter 5 §5.3 · "The correct order-zero expression for T>0 is √π erf(√T)/(2√T), with limit one."
- R11 · `branch_geometry/Derivations.md` · "For attraction integrals, differentiate the moving Coulomb center too; translating just the basis functions is insufficient."
- R11 · `branch_geometry/Derivations.md` · "Prefactors containing π, square roots, exponentials, normalization and contractions also need rigorous enclosures. Analytic Gaussian formulas alone are not outward-rounded numerical bounds."
- R19 · NOTATION · "Tensor transformations need two legs for a one-electron operator and four for an electron-repulsion tensor."
- R13 · `SOL-R13` · "Both matrix tensor legs and all four ERI tensor legs receive their X corrections. Missing the four-leg normalization correction would undercount the physical uncertainty."
- R22 · Chapter 5 §5.4 · "Algebraically exact zeros and exact eightfold real-ERI symmetry are permitted; dropping a merely small term requires its own omitted-error budget."
- R13 · `full_eri/Derivations.md` · "No ordinary libm `exp`, `erf`, incomplete gamma, hypergeometric, or libcint integral is used in the enclosure."
- R14 · `SOL-R14` · "Exponential/AO/Boys primitives require their own validated series, derivatives or integral remainder bounds."
- R13 · `coulomb_projection/Proofnotes.md` · "Future use in λWAVES should preserve both boundaries: a small one-body rendering error cannot replace an integral/Fock error budget, and a small fixed-orbital Coulomb error cannot replace a self-consistent response/force certificate."

### 3.4 Derivatives: C0/C1/C2, Hessians and forces
- R26 · `NEXT SCOPE.md` · "Do not infer a full-force/Hessian/frequency certificate from the new bounded one-body formula. Retain rectangular basis/horizontal contributions and all four interaction legs. A one-dimensional path certificate does not certify mixed nuclear derivatives or a full Hessian. Native projector value accuracy alone gives no executed derivative accuracy."
- R24 · Chapter 9 §9.1 · "These are C⁰/C¹/C² error statements, not merely three lists of coefficients." / "If a derivative error is unknown, it stays unknown."
- R15 · `Proofnotes.md` · "Unknown derivative error remains unknown. A value-only upstream contract does not get zero derivative errors by default."
- R26 · `CONTRACT CONTROLS.md` · "Inputs typed as binary floats or invalid signs/ranks/gaps are rejected; omitted derivative bounds propagate as unknown."
- R26 · `DERIVATIVE ERROR THEOREM.md` · "Missing e1/e2 cannot be replaced by a numerical derivative of sampled errors."
- R26 · `DERIVATIVE ERROR THEOREM.md` · "One path's curvature certificate does not certify all nuclear Hessian entries."
- R26 · `DERIVATIVE ERROR THEOREM.md` · "A native implementation must additionally enclose the evaluated spectral cluster, its computed projector and its parameter derivatives." / "value-only eigensolver accuracy does not provide ν1/ν2. Numerical orthogonality also does not make an executed matrix exactly idempotent."
- R26 · `MONOGRAPH ADDENDUM` · "Thus an exact coefficient projector and a perfect electron count do not by themselves establish accurate physical derivatives."
- R13 · `OBSERVABLE CONTRACTS.md` · "Numerical force/Hessian accuracy needs geometry derivatives and nuclear couplings."
- R13 · `SOL-R13` · "Validated nuclear derivative/coupling tensors are the separate next requirement for force/phonon/frequency statements."
- R19 · NOTATION · "Geometry differentiation is different: S, AO functions and orthogonalizing factors all move. The current pointwise spatial formula does not drop their nuclear derivatives from forces or response."
- R8 · `Derivations.md` · "In a moving AO basis, overlap derivatives and Pulay terms also enter; merely differentiating coefficient arrays is not a physical response calculation."
- R4 · `Derivations.md` · "Computing B_i requires derivatives in a common physical Hilbert space; derivatives of coefficient arrays in incompatible moving bases are insufficient."
- R8 · `Derivations.md` · "Only at a stationary geometry g=0 are rigid rotational directions null vectors of K." / "Negative nonrigid eigenvalues indicate harmonic instability, not a real frequency obtained by taking an absolute value."
- R8 · `Derivations.md` · "Use Hessian-vector supervision or validation for learned EIGENMORPH/PES proposals; do not judge them only on electronic density snapshots or energies and forces."
- R8 · `Derivations.md` · "Track a gapped **cluster projector**, and use subspace alignment, rather than treating arbitrary individual eigenvectors as stable labels."
- R17 · `Proofnotes.md` · "The finite-dimensional bounded-operator derivative estimates cannot be transferred blindly to unbounded kinetic/current operators or pointwise observables; those need the earlier domain/Sobolev/leverage contracts."
- R17 · `Proofnotes.md` · "Do not discard geometry-dependent energy offsets or extend fixed-rank RHF identities to trace-changing/mixed-state constructions without a separate proof."
- R16 · `SOL-R16` · "Rectangular moving subspaces additionally require extrinsic derivative terms; this square-frame identity does not remove them."

### 3.5 Projectors, frames and normalization
- R16 · `PROTOCOL.md` · "never identify Y with the principal root of B^T B." R15 NEXT SCOPE: "Y generally is not the symmetric principal G^−1/2."
- R24 · Chapter 9 · "Conversely, a successful gate establishes normalization for a declared frame, without proving that frame approximates physical occupied orbitals. Native floating evaluation has further rounding errors beyond the exact rational model."
- R24 · `NEXT SCOPE.md` · "Ideal projector repair supplies admissibility and scoped bounds; it does not validate a native eigensolver or turn C0accuracy into derivative accuracy."
- R18 · `Proofnotes.md` · "A direct projector deliberately omits the frame's internal gauge and does not determine all state observables." / "It still computes dense ambient projectors and residual convolutions, so there is no operation-count or runtime advantage claimed."
- R13 · `physical_chart/Proofnotes.md` · "It does not treat a numerically computed MO array as an exact physical orthonormal frame."
- R9 · `Derivations.md` · "Coefficient array equality at different geometries is not a physical overlap condition." / "Polar transport is an alignment prescription, not proof that both finite orbital subspaces remain identical."
- R14 · `SOL-R14` · "Every occurrence of the same M, Gram matrix or parameter must remain the same expression node until cancellations are formed. Range-enclosing each occurrence independently too early can destroy the cancellation we need in the physical residual."

### 3.6 SCF, CPHF, response and FCI
- R9 · `Derivations.md` · "The solver accepts B, an operator exposing AV, a positive lower bound and an optional transported initial span. It does not accept the dense A matrix or exact response R."
- R9 · `Derivations.md` · "If Rhat is zero the ratio cannot establish convergence. A nonpositive/missing stiffness lower bound is explicitly rejected."
- R9 · `Derivations.md` · "An SCF energy convergence flag or a positive set of orbital gaps alone does not establish the required lower bound on the interacting response operator."
- R10 · `SOL-R10` · "A raw contraction 4BᵀX does not have this squared-residual error identity outside an exact Galerkin solution."
- R11 · `reuse_solver/Derivations.md` · "A final physical AX action is mandatory for the corrected output/certificate."
- R10 · `cphf_comparison/README.md` · "Default CPHF has tol=1e−9, max_cycle=50, hermi=False, level_shift=0." / "Actual default Frobenius relative residuals reach 6.50e−4 on these small mass-weighted B."
- R11 · `SOL-R11` · "At a stationary orbital-chart origin, the physical energy Hessian is **Ezz=4ACPHF**. The saved RHS convention gives **B=−Fs**, so Ezs=−4B."
- R19 · `CHAPTER 6` · "The factor 4 belongs to this saved real closed-shell orbital convention. It is not universal across spin, coordinate and response-library definitions."
- R12 · `scf_chart/Proofnotes.md` · "Thus the saved MO coefficient array is provenance for generating the model, not a proved exact orthonormal physical map."
- R12 · `physical_h2/Proofnotes.md` · "Positive A is real restricted singlet stability; it does not imply unrestricted stability."
- R12 · `physical_h2/Proofnotes.md` · "It makes explicit why a highly accurate compressed 1RDM cannot by itself certify a correlated energy or correlated response."
- R8 · `Derivations.md` · "The practical upgrade is to measure the **SCF/response iteration Jacobian**, choose a metric/preconditioner and prove contraction or control its spectrum/residual."
- R23 · `NEXT SCOPE.md` · "Do not relabel an archived electronic solve as a frequency certificate."
- R9 · `FIGURE_CAPTIONS.md` · "Dashed target0.1% is an electronic-relaxation criterion, not a frequency tolerance at nonstationary geometries."

### 3.7 FLOW, nodes and dynamics
- R21 · Chapter 4 §4.9 · "The inspected molecular-flow.js at the pinned main checkout requires rho>1e-7at both the step origin and midpoint."
- R7 · `Derivations.md` · "The density rejection branch is discontinuous at the floor, so a shared floor margin is required."
- R21 · Chapter 4 §4.9 · "Containment must be proved or bootstrapped; applying a regional estimate after a path has left that region is invalid."
- R21 · Chapter 4 §4.9 · "Seeding by |j| is a visualization rule, not sampling particles from rho."
- R7 · `Derivations.md` · "FLOW tracers cannot certify nodal topology simply by following j/ρ."
- R7 · `Derivations.md` · "Specify whether the scientific target is scalar phase winding, mixed-density zeros, density thresholds, mixed vorticity or current streamlines. Their stability requirements differ."
- R5 · `Derivations.md` · "Initial τ alone is not a bound over an entire driven/moving-geometry trajectory; the kinetic tail must be propagated, monitored or bounded on that declared domain."
- R13 · `OBSERVABLE CONTRACTS.md` · "It is not a certificate for propagation under two different self-consistent Hamiltonians, moving-frame approximations or an unvalidated shared numerical propagator."
- R25 · Chapter 10 §10.5 · "Common energy, global phase hue, relative phase and observable dynamics must be distinguished."
- R25 · Chapter 10 §10.5 · "Actual energy/input/frame/clock/native errors still need enclosures; nonlinear SCF needs pathwise generator-error bounds rather than an automatic horizon."

### 3.8 Precision (f64 / f32 / f16) and arithmetic
- R2 · `root_reading/Reading dossiers.md` · "CPU binary64 arithmetic margins cannot simply be transplanted to WGSL transcendentals, f16 storage or interpolated volumes." This is the only f16 line in the corpus.
- R1-era · `SOL — λWAVES scientific architecture audit` (orbitalsview.js:268, optimization worktree) · "the AO accumulator is Float32Array: every += rounds to f32. This is an additional cancellation risk before GPU upload."
- R25 · Chapter 10 §10.5 · "The dated architecture audit found CPU spectral phases and float64 hydrogen coefficients, alongside an integration-path float32 AO accumulator. A repeated float32 addition can lose information before GPU upload."
- R25 · Chapter 10 §10.5 · "Accumulating these particular inputs in binary64 before one final binary32cast preserves 1. This is a scalar arithmetic control, without proving a production-field error, universal remedy or GPU result. A binary64 logical clock can similarly fail to advance when adding 1 to 2⁵³."
- R25 · Chapter 10 §10.5 · "Reducing a phase after an already rounded E·t cannot recover input or multiplication bits."
- R25 · Chapter 12 §12.5 · "Runtime precision and error horizons need tests for the actual device/backend, with source versions and deployment separately recorded."
- R2 · `SOL-R2` · "Pairwise, compensated and f64 accumulation remain essential baselines."
- R5 · `Derivations.md` · "Even an exact identity does not establish floating-point equivalence: (10¹⁶+1)−10¹⁶ evaluates to zero in ordinary binary64, while the algebraically equal expression 1 evaluates to one."
- R13 · `SOL-R13` · "The upstream full-ERI recurrence uses outward x87 long-double arithmetic. Its guarantee assumes correctly rounded basic arithmetic/square root, correct nextafter, gradual subnormal handling, nearest rounding and compilation without unsafe reassociation/contraction."
- R13 · `SOL-R13` · "In particular, values below machine precision do not assert that a binary64 implementation attains them."
- R11 · `exact_matrices/Derivations.md` · "Converting the exact certificate to an ordinary nearest-rounded float without checking direction could overstate it."
- R15 · `README.md` · "Rounding of a future floating implementation and physical coefficient/remainder validation are separate tasks."

**Water radius, the one physical number.** R16, R17, R19–R26 repeat it: "Current water certificate still ends at |s|<=10^-10" (R16 NEXT SCOPE). R22–R26 `final_checks.json`: `"largest_physical_water_radius": "1/10000000000"`.

### 3.9 Capability metadata, cost and application gates
- R25 · Chapter 12 §12.5 · "An eventual adapter should specify what is computed online, what is cached, what invalidates that cache and which bounds survive. Capability metadata should distinguish available orbitals, density, response and derivatives."
- R25 · Chapter 10 §10.6 · "The useful engineering rule is to attach the right evidence to each operation: model/basis/state identity for reconstruction, bounded derivatives for moving geometry, stability/residuals for response, floor/domain/containment for FLOW, and complete cost/precision records for performance."
- R25 · Chapter 12 §12.2 gate table. Each row must pass its own gate; "Passing one gate does not silently pass the others."
  - Reconstruction: "Declared state/model, held-out accuracy, positive/signed budgets and precision".
  - FLOW: "Continuous density floor, derivative/Lipschitz bounds, time-hold error and containment".
  - Vibrations and forces: "Stationary branch, all nuclear/frame/coupling derivatives, soft-mode conditioning".
  - Interactive acceleration: "Matched accuracy/backend/precision, controlled timing and full pipeline cost".
- R25 · Chapter 11 §11.2 · "A reduced renderer should specify which of these objects it displays and which prior class supports its inference."
- R20 · `NEXT SCOPE.md` · "Any later inverse-fitting implementation should return identifiable quantities or a feasible state set, validate PSD/rank/preparation constraints, and distinguish a regularizer-selected solution from a uniquely inferred state."
- R2 · `Positive quantum equalizers.md` · "An arbitrary signed interference diagnostic is legitimate if named as such; a state-transforming filter must meet stronger constraints."
- R8 · `SOL-R8` · "A classical nuclear animation, a coherent phonon and a phonon number state have different semantics."
- R25 · Chapter 10 §10.3 · Strict saving after Q queries requires Q(c_base−c_new−v)>S; "If the parenthesis is nonpositive, repeated use cannot recover positive setup." Breakeven example: S=100 gives 26 queries, in "synthetic cost units".
- R25 · Chapter 10 §10.4 · "A defensible performance study fixes physical model, output/error target, geometry/preparation distribution, precision, backend, device and caching state."
- R18 · `Proofnotes.md` · "Thin factor evaluation may remain cheaper when the user needs orbitals or many spatial samples."

## 4. Cautions and "do not" lines

- R10 · `PROTOCOL.md` · "Do not infer continuous geometry certificates from point samples, interval validity from floating-point residuals, or runtime speedups from column counts."
- R24 · `PROTOCOL.md` · "Do not infer physical membership from abstract IVPs, caller premise strings, passing normalization gates or exact projector identities."
- R26 · `NEXT SCOPE.md` · "Do not continue to list that exact implication as unaddressed. Its upstream physical value/derivative contracts and downstream native execution remain open."
- R21 · `NEXT SCOPE.md` · "Do not treat Chapter4as permission to resume chemistry or heavy event/trajectory simulations."
- R21 · `NEXT SCOPE.md` · "A full hydrogen census is still unfinished, and the archived1480count is not a verified reconnection census."
- R26 · `CLAIM REGISTER.json` (claim C22 limitation, carried in every register from R18 to R26) · "Do not promote bound ratios/operator counts to speed ratios."
- R25 · Chapter 11 §11.7 · "Exact matrix identities do not automatically give floating stability; formal scope notes do not establish a physical adapter; and one mathematical improvement may help several layers while leaving their separate application gates open."
- R25 · Chapter 11 §11.7 · "If an output is underdetermined, report the feasible range or collect another observable. If a gate is unknown, retain that status. If a sufficient bound fails, distinguish proof failure from physical instability."
- R25 · Chapter 11 §11.3 · "Likewise, a good global current norm does not bound j/ρnear a node."
- R25 · Chapter 11 §11.4 · "Neither analyticity nor a positive gap alone supplies a quantitative interpolation bound."
- R25 · Chapter 11 §11.4 · "The archived solver used such additional stiffness inputs; it did not infer them from a few online queries."
- R25 · Chapter 11 §11.5 · "A unitary step can preserve all of them while having large phase or time-discretization error."
- R25 · Chapter 11 §11.6 · "A 0.1% electronic relaxation error need not imply 0.1% frequency error near a soft nuclear mode."
- R25 · Chapter 11 §11.2 · "Conversely, nonnegative spatial images do not prove a candidate matrix is PSD."
- R26 · `MONOGRAPH ADDENDUM` · "Repair cannot supply missing derivative information." / "The theorem transports accuracy; it does not promise automatic improvement."
- R24 · `SOL-R24` · "Admissibility repair can worsen target accuracy."
- R22 · Chapter 5 §5.5 · "This locates a limitation of the enclosure/theorem combination. It does not diagnose physical instability."
- R13 · `SOL-R13` · "Merely searching more radii will not fix this case."
- R13 · `SOL-R13` · "These are raw tensor budgets, before common-frame transformation and physical normalization. They must not be substituted directly for an SCF root or response error."
- R13 · `OBSERVABLE CONTRACTS.md` · "This is a pure-determinant state error. It does not certify a correlated ground state or turn a1RDM distance into a correlated energy bound."
- R12 · `SOL-R12` · "A few Coulomb entries do not stand in for a full Fock/response tensor bound."
- R11 · `PROTOCOL.md` · "A certificate of these stored matrices does not enclose errors in molecular integrals, SCF orbitals, transport, or matrix assembly."
- R11 · `PROTOCOL.md` · "These tightened constants were selected after observing this path, not preregistered thresholds."
- R10 · `cphf_comparison/README.md` · "This tolerance was calibrated retrospectively, not specified before observing this subset."
- R9 · `PROTOCOL.md` · "Record overlap conditioning and electronic stability; never extrapolate blindly across a lost response gap."
- R9 · `Derivations.md` · "This does not make a0.1% response criterion a universal0.1% frequency guarantee: a softer nuclear spectrum can amplify a response error."
- R8 · `Derivations.md` · "Do not transfer Bloch's coefficient or exponent to molecular vibrations or generic phonons."
- R8 · `Derivations.md` · "These are unscaled, method/basis/mass-specific harmonic values, not experimental frequencies, anharmonic corrections or a crystal dispersion."
- R7 · `PROTOCOL.md` · "Floating-point diagnostics are candidates, not interval certificates."
- R7 · `SOL-R7` · "Therefore these global accuracy budgets cannot certify exact nodal topology."
- R6 · `PROTOCOL.md` · "do not identify a display-grid sum with electron count."
- R6 · `PROTOCOL.md` · "These are pilot comparison thresholds, not approved production tolerances."
- R6 · `SOL-R6` · "No WebGPU/browser, float32 shader, frame-rate or device-wide speedup was measured. The production GPU's symmetric contraction and its workgroup/register/memory behavior require their own comparison."
- R5 · `SOL-R5` · "A local rendering approximation can reduce evaluation work without claiming to replace the physical state by a lower-rank N-electron 1RDM. It needs an observable-domain error budget of its own."
- R4 · `Derivations.md` · "Retained norm conservation does not imply a small residual."
- R3 · `SOL-R3` · "Positivity restricts the feasible set but does not generically cure nonidentifiability"
- R2 · `adversarial_review.md` · "A headline, theorem-shaped comparator placeholder, Lean filename or inventory count must not be promoted to formal validation."
- R14 · `PROTOCOL.md` · "The repository contains manuscripts at different verification stages; a README/theorem headline is not an audited proof or an applicable numerical guarantee."
- R18 · `MONOGRAPH MAP.md` · "It does not justify a universal new basis, universal molecular speedup or a fully certified public instrument."
- HANDOFF · "Do not infer an implementation/release request from these research ambitions."
- R25 · `NEXT SCOPE.md` · "The precision horizon is conditional on generator-width and frame/clock/native inputs, not an implemented guarantee. Cost break-even assumes consistent units and valid reuse, not measured molecular acceleration."

## 5. Open questions the rounds leave (from NEXT SCOPE files, Chapter 12 and the reports)

**Physical inputs. Blocked until Josh explicitly resumes the physical programme.**
- A useful-sized water interval beyond 10⁻¹⁰ (R13; Chapter 12 §12.4): "A useful-sized deformation range requires tighter dependency-aware geometry models, predicted chart centers and structured normalization/tensor residuals."
- Nuclear derivatives and couplings, Pulay, forces and frequencies (R13, R16–R26). R22 NEXT SCOPE: "The new classical Boys/Sylvester formulas need actual physical derivative-input enclosures before serving a force certificate."
- R16 NEXT SCOPE: "On explicit resumption, supply actual molecular Gaussian/Boys/tensor membership and C0/C1/C2 geometry derivatives, coherently quotient the metric energy offsets, and rebuild predicted SCF charts."
- Nonlinear DFT/XC (Chapter 12 §12.4): it "cannot inherit a complete force contract from a one-body Coulomb bound."
- Held-out, genuinely correlated references (R6, R8, R9, R19, R25). Quiet full-pipeline timing and the float32/WebGPU comparison (R6, R25).
- The historical 1480-event hydrogen census (R7, R21).

**Proof-only work. Allowed while paused.**
- Continuous finite-basis leverage/floor/path containment for FLOW (R21, R23, R25, R26). Chapter 12: "The useful milestone is a declared region and path with a proved floor and containment, not another random-point plot."
- A quantified closure-source bound for a specified finite environment (R23, R25, R26).
- Shared-parameter physical derivative contracts, including third and fourth derivatives and mixed directions (R17 NEXT SCOPE items 1 and 5; R26).
- A verified nonlinear energy-gradient/Hessian builder. R17: "A composition of validated linear IVPs is not an automatic nonlinear SCF/Hessian compiler."
- Long paths. R18: "Current single-center polynomial bounds are not a long-time integrator."
- Complex skew-Hermitian or unitary projector classes, and initial-projector enclosures from correlated inputs (R18 NEXT SCOPE).
- A signed-error observable budget under moving geometry or driven evolution. R19: "initial tau_absis not a trajectory bound."
- A finite observable-set certificate with uncertain entries (R20 NEXT SCOPE).

**Response and solver.**
- A cheap, geometry-uniform stiffness lower bound. R9: "Obtaining them affordably over a continuous geometry region remains the main bottleneck."
- An end-to-end cost comparison against iterative CPHF (R9, R10). R10's open target is a "**validated bound on transported operator variation around one water anchor**".

**Editorial and publication.**
- Harmonise notation (AO row versus column; Q as a frame versus Q as a projector), complete the bibliography and read-depth mapping, check claims against the original Sol chat, and extract a narrow paper (R25 and R26 NEXT SCOPE).
- R25: "A shorter paper should select a bounded reproducible contribution before novelty claims or more experiments."

**Engineering (Chapter 12 §12.5).**
- Specify online versus cached work, cache invalidation and capability metadata.
- Test runtime precision on the real device.
- None of this has a corpus answer. It is exactly what PRE-MATH must decide.

## 6. What I could not read or verify, and the folder's size

Read directly:
- README, PROTOCOL and NEXT SCOPE for every round that has them. Rounds 2–5 have none, Rounds 6–14 have only PROTOCOL, and Rounds 15–26 have all three.
- INDEX, MONOGRAPH.md, the R18 map, Chapters 10–12 in full, the notation appendix, R13 OBSERVABLE CONTRACTS, R14 TRANSFER CRITERIA, and R26's addendum and controls.
- The Proofnotes boundary sections for R15–R18, and the HANDOFF (lines 1–243 and 400–470).

Not read in full, and partly reached through three read-only Sonnet extraction passes whose quotes I re-checked with `grep -F` before keeping them:
- the SOL reports for Rounds 2–13;
- the Derivations files for Rounds 2–9;
- the subfolder reports for Rounds 10–14;
- Chapters 1–9;
- the claim registers.

Not read at all:
- Round 1's deep content (the other survey covers it) and its companion atlas, architecture audit and vortex audit, apart from one line;
- R18 `MONOGRAPH OPENING.md`, the 171 KB assembled draft (grepped only), every `SOURCES`/`READ_DEPTH` ledger in full, and the Mandelbrot-extension derivations;
- by rule, every data file: `.npz`, `.chk`, `.pdf`, the two 10.5 MB `boys.txt`, and the large `results.json`/`current_commit.json`.

Nothing was executed. Check counts and numbers are Sol's own reports, not reproduced here.

**Folder size.** `for CODEX/` holds 2,026 files in 341 directories, 441,902,154 bytes.

| Type | Files | Size / notes |
|---|---:|---|
| `.md` | 338 | 4.0 MB |
| `.tex` | 425 | 8.0 MB; downloaded OpenAI/math manuscript sources in R2, R3, R5, R8, R14 |
| `.json` | 411 | 46.8 MB |
| `.lean` | 254 | 2.8 MB; R2: 249, R14: 5 |
| `.py` | 187 | 1.0 MB |
| `.npz` | 130 | 243.2 MB |
| `.txt` | 109 | |
| `.pdf` | 34 | 24.8 MB |
| `.html` | 31 | |
| `.png` | 23 | |
| `.svg` | 19 | |
| `.chk` | 13 | |
| `.log` | 12 | |
| `.bib` | 12 | |
| `.pyc` | 8 | |
| `.csv` | 7 | |

NACRE.md gives a slightly different census (339 .md, 190 .py, 442 MB); the corpus, as counted above, wins.
