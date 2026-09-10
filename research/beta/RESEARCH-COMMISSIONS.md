# Beta research commissions

These are proposed assignments, not completed independent reviews. They address the frontier program requested in Josh's brief. Implementation work remains governed by [BUILD-CONTRACTS](BUILD-CONTRACTS.md). Each commission should return a short decision memo, equations with conventions, one reproducible fixture/counterexample, an error or convergence measure, and a build/no-build recommendation. Stop when the stated decision is supported; a literature survey alone is not completion.

## R1 — Atomic/Sturmian transfer and response

**Decision:** Which existing radial functions and basis scales can support a small, stable molecular valence basis without losing the declared atomic model?

Compare hydrogen analytic orbitals, current Xα/Latter radials and a pinned radial reference. Distinguish variational basis improvement from changing the physical effective potential. Specify open-shell occupations, ensemble averaging, tail treatment and ΔSCF ionization energies rather than equating every orbital eigenvalue with an ionization energy. [dftatom](https://arxiv.org/abs/1209.1752) is an independent radial-solver candidate; its paper record establishes scope, not a benchmark already run here.

**Required evidence:** Radial normalization and energy convergence across two meshes/scales; cross-overlap singular values for a scale change; weak-field response if advertised. **Falsifier:** A normalized basis whose projected state loses significant norm, or an atomic fit that fails a two-centre force comparison. **Feeds:** B2; later B10. **Limit:** An isolated atomic oracle cannot validate molecular repulsion.

## R2 — From separate atoms to a molecular state

**Decision:** Define a compatible fragment composition and transport protocol before allowing general assembly.

Specify the one-particle basis union, antisymmetric many-electron space, charge/spin sectors, cross overlaps, orthogonalization and energy zeros. Separate continuous parameter changes from changes of span or electron count. Derive each coordinate component of the connection; Ṡ/2 is insufficient by itself. Start with one rigidly translated/rotated H₂⁺ specimen and then H₂.

**Required evidence:** Basis-covariant density, state-overlap loss and a consistent force derivation. **Falsifier:** A pure basis rotation alters an observable, or a norm-preserving projection conceals loss from the old span. **Feeds:** B3/B12. **Limit:** No universal matrix-element threshold defining bond formation. Literature anchor: [evolving Hilbert-space geometry](https://arxiv.org/abs/1608.05300).

## R3 — Native valence backend feasibility

**Decision:** Can a specific C/H parameter family support energy, forces and faithful real-space density with a distributable package?

Inventory every required directed pair table, repulsive spline, charge-response coefficient, radial wavefunction and derivative. Pin version/checksum and applicable distribution terms. Compare one isolated atom, equilibrium benzene and several controlled distortions with the matching external implementation. Verify energy accounting using H⁰ rather than blindly adding self-consistent eigenvalues.

**Required evidence:** A parameter manifest, force finite differences, SCC failure behavior, density-basis consistency and measured workload. **Falsifier:** Missing radial data, incompatible sets, derivative discontinuities, or unresolved repulsive/double-counting terms. **Feeds:** B10 only. **Fallback:** Reference-backed B6/B7 remain the recommended release route. Source: [official parameter construction](https://www.dftb.org/parameters/introduction.html), [available sets](https://www.dftb.org/parameters/download.html).

## R4 — Benzene mechanics and reference domain

**Decision:** Select one reproducible reference method and determine its useful near-equilibrium domain.

Use the existing RHF/STO-3G data only as a regression baseline. Compare a nominated larger-basis DFT calculation, documenting functional, grid, basis, convergence and any dispersion term. Optimize each method separately before comparing Hessians. Project rigid motions in mass-weighted coordinates; retain the full degenerate mode subspaces. No claim that the cheapest method is a chemical standard.

**Required evidence:** R0, gradient, 36×36 Hessian, masses, 30 internal coordinates, source inputs and selected displaced/held-out geometries. Report actual energy/force/spectrum discrepancies and a chosen domain criterion. **Falsifier:** An internal instability, insufficient stationarity, or a hold-out failing the advertised bound. **Feeds:** B6/B7. **Limit:** Experimental fundamentals and harmonic frequencies remain separate. Sources: [PySCF Hessians](https://pyscf.org/pyscf_api_docs/pyscf.hessian.html), [NIST benzene](https://webbook.nist.gov/cgi/cbook.cgi?ID=C71432&Mask=800).

## R5 — Vibronic symmetry, gauge and interpolation

**Decision:** Which mode/electronic responses can be displayed reliably with a small fixture set?

Derive allowed D6h couplings using the chosen molecular frame, including reflection parity. Differentiate the orthonormalized operator, not an unaligned sorted eigenvector list. Determine which modes require σ/π mixing and which first-order π responses vanish. Construct density interpolation that preserves metric trace and occupation bounds, then assess its model error on held-out mixed modes.

**Required evidence:** One allowed coupling, one symmetry-forbidden coupling, one degenerate-subspace path and one mixed-mode hold-out. **Falsifier:** A gauge change changes density response, or a positive-density claim fails between interpolation nodes. **Feeds:** B7. **Limit:** A static response fit is not a time-dependent vibronic wavefunction. Original symmetry starting point: [Wilson](https://journals.aps.org/pr/abstract/10.1103/PhysRev.45.706).

## R6 — Correlated π model and observable selection

**Decision:** Choose Hubbard first or a specific PPP convention, and identify the smallest set of observables that explains correlation.

Return determinant indexing, fermion signs, integral conventions, charge backgrounds, parameter units and spin diagnostics. Use the 400-state Ms=0 block only with an explicit multiplicity check. Decide whether a ground-state sparse solver is enough or whether the intended experiment needs additional states/transition operators.

**Required evidence:** Noninteracting limit, two-site analytic comparison, independent six-site enumeration, 1RDM and pair observable agreement. **Falsifier:** A spin label inconsistent with ⟨S²⟩ or a factor/sign error in the zero-interaction spectrum. **Feeds:** B9. **Limit:** No claim of full-benzene CI. Historical model source: [Pople](https://doi.org/10.1039/TF9534901375); active-space distinction: [PySCF](https://pyscf.org/user/mcscf.html).

## R7 — Bond interference and atomic decomposition

**Decision:** Which partition makes useful, reproducible visual anatomy without asserting unique chemical bonds?

Compare raw AO off-diagonal terms, Lowdin populations and an IAO-based convention. Define fragment references and counterpoise/basis treatment where used. Demonstrate explicitly that total density survives a basis rotation while the partition can change.

**Required evidence:** One molecule in two bases and one unitary re-expression in a fixed span. **Falsifier:** A proposed “observable bond density” changes solely under basis re-expression without disclosure. **Feeds:** Optional B5/B11 overlays. **Limit:** A population scheme is not a bond-energy operator. Primary construction: [Knizia](https://arxiv.org/abs/1306.6884).

## R8 — Density topology and localization

**Decision:** Which topology descriptors can current evaluators support, and which derivative fields must be added?

Start with n, ∇n and Hessian(n), then critical points and reduced-gradient surfaces. Specify singularity handling, domain boundaries and numerical root completeness limits. For ELF, separately select spin, kinetic-density and current conventions; decide whether the available state data are sufficient for the intended correlated extension.

**Required evidence:** Analytic critical-point fixture, one external molecular comparison and an explicit unsupported-data case. **Falsifier:** A descriptor labeled density-only requires unavailable kinetic/pair/current information, or critical points move materially under grid refinement. **Feeds:** B11. **Limit:** No energetic bond classifier. Sources: [original NCI work](https://scholars.duke.edu/publication/807175), [ONETEP's explicit ELF data/formula conventions](https://docs.onetep.org/eld.html).

## R9 — Current, residual and gauge geometry

**Decision:** Establish when a displayed current is physical, diagnostic, or merely a chosen vector-field reconstruction.

Derive continuity for the actual operator, including magnetic/nonlocal terms when present. Compare finite-space norm preservation with pointwise residual. Specify graph versus 3D domains and boundary conditions before proposing Hodge components. For flux-ring play, derive hopping phases, local discrete continuity and persistent-current units together.

**Required evidence:** A stationary state, a coherent beat and a truncated moving-basis counterexample; gauge-equivalent ring Hamiltonians with matching current. **Falsifier:** A conserved norm coexists with nonzero local defect, disproving any norm-only certificate; a static BO replay yields invented flow. **Feeds:** B12 and a later ring experiment. **Limit:** Graph current is not a quantitative aromatic-current density in 3D. Convention check: [DFTB+ electronic dynamics](https://dftbplus-recipes.readthedocs.io/en/stable/electronicdynamics/introduction.html).

## R10 — Fixed and adaptive multiscale chemistry

**Decision:** Select a fixed-region embedding for a nucleobase before investigating adaptive quantum zoom.

Specify classical energy, QM energy, embedding, boundary atoms, electrostatic exclusions and polarization response. Check double counting and energy reference. For adaptation, derive forces from the chosen energy including switching derivatives; quantify work/state changes at region transitions.

**Required evidence:** Isolated fragment, dimer and boundary-translation curves with continuous energy/force; charge conservation and one fixed-region dynamics check. **Falsifier:** Changing an arbitrary energy zero changes transition forces, or camera zoom changes trajectories. **Feeds:** Post-Beta biological path. **Limit:** Smooth graphical interpolation is not a multiscale Hamiltonian. Located primary work: [adaptive partitioning paper](https://www.mdpi.com/1420-3049/23/9/2170); abstract accessible via [PubMed](https://pubmed.ncbi.nlm.nih.gov/30154373/).

## R11 — Continuum escape and nuclear branching

**Decision:** Separate two future backends: continuum electronic propagation, and nonadiabatic nuclear ensembles/wavepackets.

For ionization, nominate a grid/basis with outgoing boundary treatment, flux surface, gauge and absorber convergence protocol. For branching, choose a small avoided-crossing benchmark and name the approximation; Ehrenfest mean trajectories do not automatically represent separated nuclear branches. [tRecX](https://arxiv.org/abs/2101.08171) and [MASH](https://arxiv.org/abs/2212.11773) are primary method leads, not implementations evaluated in this dossier.

**Required evidence:** Absorber/domain convergence or an independent avoided-crossing population/energy benchmark, respectively. **Falsifier:** Yield changes substantially with absorber placement or a branching claim has only one mean nuclear trajectory. **Feeds:** Post-Beta only. **Limit:** No bound-register ionization certificate or implied radiative capture.

## R12 — Characteristic play for the existing Hamiltonians

This is an optional specimen shelf, not a commitment to add every experiment in Beta. Reuse the B1 descriptor interface. Each row supplies the feature-specific mini-contract; common fields follow it.

| Name / user experience | Mathematical object / physical meaning | Independent oracle / acceptance | Failure / deferred physics | UI label |
|---|---|---|---|---|
| QHO displacement/squeeze/quench: watch centroid and width respond | Quadratic H, coherent/squeezed state covariance; exact oscillator dynamics before truncation | Analytic first/second moments and uncertainty determinant; increase cutoff when tails matter | Truncation masquerading as heating; defer nonquadratic interactions | “QHO · finite register” |
| Hydrogen Stark/Zeeman: compare field responses | Declared projected field operators; bound-state perturbation/dynamics | Matrix elements, weak-field limit and basis convergence | Inferring continuum escape; defer strong-field ionization | “Bound-basis field response” |
| Sturmian scale: change representation and inspect loss | Generalized metric and cross-overlap projection; basis experiment | Metric trace and projection singular values; preserve operator definition | Scale mistaken for physical drive; defer adaptive molecular basis | “Basis scale” |
| Atomic ionization comparison | ΔSCF E(N−1)−E(N) with separately solved configurations | Same-method independent atomic fixture and sign/unit check | Orbital energy passed off as total-energy difference; defer shake-up spectrum | “ΔSCF estimate” |
| Box barrier experiment | Fixed-domain Hamiltonian with barrier; finite-model tunneling | Analytic stationary limits and grid/basis refinement | Moving wall implemented as a camera resize; defer moving-domain transport | “Finite box model” |
| Cornell potential specimen | Declared phenomenological Coulomb-plus-linear potential | Independent radial solve and parameter/unit fixture | Labeling it full QCD; defer spin/relativistic/field theory | “Phenomenological potential” |
| Flux ring | Phase-coupled discrete ring, number/charge-current convention | R9 gauge and discrete continuity fixtures | Calling graph current a molecular magnetic map; defer 3D response | “Flux-threaded ring model” |

**Common model class:** Exact analytic oracle plus numerical/truncated implementation as appropriate. **Dependencies:** B0/B1 and each existing solver; R9 for flux. **Compute cost:** Small matrices or existing radial solve, measured per specimen; spatial sampling usually separate. **Error metric:** Spectral/state residual, observable discrepancy and truncation convergence. **Acceptance:** One analytic fixture and one deliberate out-of-domain/failure case per specimen; persist parameter/units and observer state. This completes the thirteen mini-contract fields for the shelf without treating a research lead as implemented work.
