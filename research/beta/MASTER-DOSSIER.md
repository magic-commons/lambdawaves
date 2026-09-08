# λWAVES Beta: master mathematical and engineering dossier

2026-09-08. Status: proposed design. Baseline and navigation: [README](README.md). Implementation contracts: [BUILD-CONTRACTS](BUILD-CONTRACTS.md). Research evidence: [SOURCES](SOURCES.md).

## 1. Executive vision

Beta should let someone perturb a physical model and see why its spectrum, electronic distribution and mechanical response change. The flagship is flexible benzene, reached through floating atoms, H₂⁺ and H₂. The organizing relation is Hamiltonian → state → observables and energy → forces → nuclear motion → updated Hamiltonian. Density alone does not determine a useful approximate force law without specifying the energy model.

Ship a near-equilibrium benzene instrument with all 30 internal vibrational coordinates, an electronic spectrum, occupied density, a selected-orbital view and explicit model provenance. Establish the first version with imported reference calculations and a declared local surrogate. Broader geometry freedom requires a validated energy backend. Do not make native DFTB, arbitrary chemical assembly or coupled nonadiabatic benzene prerequisites for this first Beta.

Three experiences should explain the ambition: pull H₂ apart and compare a determinant with CI; distort benzene and watch degeneracies split; excite a normal mode and see the instantaneous electronic response. The last experience is a sequence of ground states until a genuine time-dependent electronic model is enabled.

## 2. Current architecture inventory

This inventory is a source inspection, not a fresh certification of every solver.

| Existing area | Current anchor | Beta action |
|---|---|---|
| Hydrogen and finite-register mathematics | `lab/` hydrogen/state machinery; historical mathematical audit | Preserve the 91-state n≤6 register and exact finite-Hermitian mapping |
| Numerical atoms | `lab/atoms.js`: `solveAtom`, `configOf`, `ionisation`, `radialTable` | Wrap the central-field Xα/Latter approximation as a provider |
| Coulomb Sturmians | `lab/sturmian.js`: `generalisedEigen` | Retain H/S machinery; expose conditioning and basis scale |
| Two-centre molecular basis | `lab/twocentre.js`, `lab/mo.js` | Adapt geometry, state, force and error outputs |
| Moving-basis H₂⁺ prototype | `lab/mo.js`: `connection`, `transport`, `evolve`, `createDynamics` | Reuse constrained internuclear-coordinate transport; do not call it a general 3D implementation |
| Driven fixed-geometry molecule | `lab/modrive.js`, `lab/pulseview.js`; `rack.js` wires `createPulse` | Extend existing pulse UI; the old “headless” description is obsolete |
| H₂ correlation | `lab/h2ci.js`: `minimalH2`, `weinbaum`, `sto3gH2` | Reuse singlet/minimal and four-determinant STO-3G paths |
| Electrostatics | `lab/electrostatics.js` | Reuse multipoles, radial panels, contours, streamlines and field integration |
| Density/render plumbing | `lab/field.js`, stage/rack integration | Replace special-case entry points incrementally with capabilities |
| Reference tooling | `research/astra-2026-09-05/` | Version and extend existing PySCF and driven-system fixtures |

No renderer-wide rewrite is required to add a physical-model facade. Keep existing adapters until their replacement has observable parity.

## 3. Mathematics that already works as infrastructure

For an orthonormal finite register, write H=A+iB, with A real symmetric and B real antisymmetric, and c=(q+ip)/√2. Schrödinger evolution is exactly equivalent to

\[
\dot q=A p+B q,\qquad \dot p=-A q+B p,
\]
\[
\mathcal H(q,p)=\tfrac12 q^TAq+\tfrac12 p^TAp+p^TBq=c^\dagger Hc.
\]

This is a state-coordinate correspondence, not evidence that electrons are classical beads. For fixed positive-definite S=LL†, use a=L†c and h=L⁻¹HL⁻† before applying it. A changing S introduces an additional connection. The arbitrary finite-system oscillator correspondence also has a primary literature precedent in [Skinner](https://arxiv.org/abs/1302.0754); the displayed conventions are the project's explicit algebra.

Preserve current, phase, nodes, multipoles and finite-model propagation. Existing mathematical corrections also persist: rank-one Clebsch/product structure is not sufficient for spin coherence at higher spin; Schmidt coefficients alone do not classify every SO(4) orbit. Do not resurrect disproved identities from older notebooks.

## 4. Corrections and scientific firewalls

| Tempting interpretation | Required distinction |
|---|---|
| Tiny off-diagonal H means a bond has formed | Matrix elements depend on basis; binding requires an energy comparison, state and context |
| A small electronic matrix makes chemistry solved | Integral/parameter consistency, self-consistency and forces remain substantial work |
| Occupied orbitals interfere as one wavefunction | Many-electron density comes from a 1RDM, not \|Σ occupied φ\|² |
| Density changes during a BO animation imply current arrows | Successive static states do not determine a physical time-dependent current |
| Norm is conserved, therefore the physics is accurate | Temporal, basis, force and local-continuity errors require separate diagnostics |
| Fast playback is uncertainty or decoherence | Playback, temporal averaging, aliasing and physical decoherence are different operations |
| A field-line picture gives chemical forces | Electrostatics omits kinetic, exchange/correlation and finite-basis response contributions |
| Damping demonstrates spontaneous capture | Relaxation removes energy by a declared mechanism; isolated binding must dispose of energy physically |
| A stationary current radiates | Stationarity alone does not imply radiation |
| A ring MO proves aromatic magnetic response | Magnetic response requires a field-coupled Hamiltonian and gauge-consistent current |
| Bound-state population loss is an ionization yield | A continuum/absorber model and outgoing-flux convergence are required |
| Fock S³ or KS regularization is ordinary space/time | Preserve the representation and fictitious-time labels |

Camera rotation, active state rotation, basis changes and global phase changes are separate operations. A selected orbital is a representation; total occupied density is invariant under occupied-space unitary rotations. “Exact finite-model” and “semiempirical” can both correctly describe one result: they concern different axes of accuracy.

## 5. Beta goals and release boundary

Required: a common model/state envelope; meaningful observer diagnostics; tangible isolated atoms; integrated H₂⁺/H₂ comparisons; benzene π teaching; reference-backed flexible benzene with modes, density and spectrum; reliable asynchronous rendering and saved provenance.

The flagship's first operating domain is a certified neighborhood of one optimized, isolated, neutral benzene minimum. The domain is measured with held-out geometries, not chosen merely because the animation looks plausible. The model stops or requests a new solve beyond it. No silent extrapolation.

Correlated π benzene, native valence DFTB, density topology and general moving-electron/nuclear dynamics are extensions with separate acceptance gates. RNA is a subsequent multiscale program. [Build contracts](BUILD-CONTRACTS.md) distinguish required work from these extensions.

## 6. PhysicalModel architecture

Use capability composition, not a growing global Hamiltonian enum. A model owns geometry, basis, state semantics, its energy functional and the valid relationship among its outputs. A result is an immutable, versioned snapshot.

```ts
type PhysicalModel = {
  descriptor: ModelDescriptor;
  capabilities: Set<Capability>;
  prepare(input: ModelInput, signal: AbortSignal): Promise<Snapshot>;
  evaluate(request: ObservableRequest, snapshot: Snapshot): Promise<Result>;
  // Optional capabilities, never successful no-op fallbacks:
  step?: (request: StepRequest, snapshot: Snapshot) => Promise<Snapshot>;
  energyGradient?: (snapshot: Snapshot) => Promise<EnergyGradient>;
  crossOverlap?: (from: Basis, to: Basis) => Promise<Matrix>;
};
```

Capabilities include density, basis derivatives, physical current, diagnostic current, electrostatic potential, total energy, variational forces, modes, fixed-basis propagation and moving-basis propagation. They are independently advertised. Missing current does not prevent density display. Unsupported force requests return a typed reason, never a zero vector.

Retain geometry, basis and electronic-state revision IDs separately. A Worker result publishes only if all input IDs still match. Associate energy and force with the same `energyModelId`; reject mixed-backend integration. Camera and display revisions cannot change a physical model. Adapters translate existing module outputs without forcing old solvers to adopt new internals at once.

## 7. Floating atoms

An atom object carries species, nuclear charge Z, mass/isotope, position R, electron count, spin/ensemble convention, radial functions, occupations, multipoles and approximation metadata. An orbital drawn at R is evaluated at r−R; a rotated open-shell density also needs a declared state rotation.

Provide four capabilities progressively: isolated central-field atom; polarizable atom; atom supplying a compatible molecular valence basis; atom inside a reactive energy model. These are not four levels of numerical certainty. A well-converged isolated central-field calculation is still a spherical approximation.

Carbon, oxygen and silicon open-shell structure makes “the atom's cloud” ambiguous without occupations and averaging. A spherical ensemble and an oriented pure open-shell state differ. NIST explicitly identifies oxygen's ground configuration and term; use term-aware fixtures rather than assuming every atom is a closed shell. [NIST oxygen](https://physics.nist.gov/PhysRefData/Handbook/Tables/oxygentable1.htm).

Start with H, C and O; retain Si as an isolated-atom specimen until the molecular parameter family supports it. Weak-field induced dipoles can use p=αE with E_pol=−½E·αE for an externally imposed field. Mutual polarization requires a self-consistent, damped interaction energy and a stability check; do not apply that one-body formula independently to every interacting dipole and double count the coupling.

## 8. Coulomb Sturmians and basis scale

Treat λ as a basis-scale parameter unless an experiment explicitly changes the physical Hamiltonian. HC=SCE and C†SC=I define the finite variational problem. Changing λ can improve radial coverage while leaving the intended Coulomb operator unchanged; changing λ without transporting the state can also change the represented physical state.

Expose smallest overlap eigenvalue, condition estimate, discarded directions and spectral residual. Cholesky is valid only for a sufficiently positive-definite metric. A truncated spectral inverse is a model-space change, not an invisible numerical repair. Use cross overlaps for projection between scales; report lost norm before optional normalization. Endpoint energy convergence and real-space quadrature are distinct checks.

Retain one-centre radial machinery for atoms and basis experiments. Do not assume atomic basis optimization gives transferable multi-centre repulsion or complete molecular forces. [Commission R1](RESEARCH-COMMISSIONS.md) defines the extension gate.

## 9. Electrostatics

Use atomic units internally. Electron number density n≥0 and charge density are different quantities:

\[
\rho_q(r)=\sum_A Z_A\delta(r-R_A)-n(r),\quad
\phi(r)=\sum_A\frac{Z_A}{|r-R_A|}-\int\frac{n(r')}{|r-r'|}dr',
\]
\[
E=-\nabla\phi,\qquad \nabla^2\phi=-4\pi\rho_q.
\]

Reuse the existing multipole backend for supported atom-centred sources and expand its provider boundary. Validate the monopole against total charge and quantify truncation with radius/order comparisons. Multipole convergence is not guaranteed inside its source region; choose near-field evaluation there. Nuclear singularities require exclusion/analytic handling rather than color clipping disguised as regularized physics.

The neutral atom's electrostatic monopole vanishes at large distance. A neutral effective Kohn–Sham potential can nevertheless have a −1/r tail: it is not the same scalar field. Keep the existing Latter-corrected atomic potential distinct from physical electrostatic potential. A one-electron model must not feed its own diagnostic Hartree field back as an uncorrected self-interaction.

## 10. Molecular state semantics

Use a tagged union: one-electron amplitudes; determinant/orbitals with occupations; AO 1RDM; CI coefficients plus determinant basis; correlated state with 1RDM and optional 2RDM. Spin-summed and spin-resolved objects have explicit conventions.

For orbital coefficient columns C and occupations f, D=CfC†. Define the kernel and observables by

\[
\gamma(r,r')=\sum_{\mu\nu}D_{\mu\nu}\chi_\mu(r)\chi_\nu^*(r'),
\quad n(r)=\gamma(r,r),\quad N_e=\operatorname{Tr}(DS).
\]

A one-body operator expectation is Tr(DO), with Oμν=⟨χμ|O|χν⟩. In the orthonormal frame P=S¹ᐟ²DS¹ᐟ², eigenvalues lie in [0,2] for a spin-summed spatial 1RDM, or [0,1] per spin. Closed-shell RHF satisfies DSD=2D; a correlated 1RDM generally does not. The 1RDM alone does not determine arbitrary interacting-model energies or pair correlations; retain the CI state/2RDM when needed.

Separated one-particle subspaces may form HA⊕HB. The electronic many-body construction uses the appropriate antisymmetric/Fock space over those orbitals, with conserved total electron count. It is not a single-electron direct sum reinterpreted as several distinguishable electrons. Fragment charge/spin sectors and charge-transfer states must be specified.

`twoMs=Nalpha−Nbeta` does not identify total spin S. Ms=0 determinants can include several total-spin sectors. CASCI is exact diagonalization only in its chosen active model; CASSCF additionally optimizes orbitals. [PySCF active-space documentation](https://pyscf.org/user/mcscf.html).

## 11. Moving nuclei and the electronic basis

For ψ=Σχμ(R(t))cμ(t), projection gives

\[
iS\dot c=(H-i\tau)c,\quad
\tau_{\mu\nu}=\langle\chi_\mu|\dot\chi_\nu\rangle,\quad
\dot S=\tau+\tau^\dagger.
\]

The metric identity cancels the basis terms in d(c†Sc)/dt. It fixes only the Hermitian part of τ; replacing τ with Ṡ/2 loses its anti-Hermitian part. This follows directly from differentiating the overlap and the projected Schrödinger equation. Moving-space geometry and its distinction from internal basis changes are treated by [Artacho and O'Regan](https://arxiv.org/abs/1608.05300).

For the AO density convention above,

\[
\dot D=-i(S^{-1}HD-DHS^{-1})-S^{-1}\tau D-D\tau^\dagger S^{-1}.
\]

The official [DFTB+ electronic-dynamics equations](https://dftbplus-recipes.readthedocs.io/en/stable/electronicdynamics/introduction.html) provide a useful independent convention check.

The current `mo.js` already implements a connection and full frozen-generator propagation for its constrained moving basis. Its metric-preserving step is not proof of converged transport, complete physical forces or arbitrary 3D covariance. Extend only after rigid translation/rotation, path reversal and timestep convergence fixtures exist.

For a basis jump, cross-overlap projection gives c_new=S_new⁻¹B c_old, Bμν=⟨χ_new,μ|χ_old,ν⟩. Its norm deficit measures loss from projection onto the new span. A polar/unitary alignment instead preserves norm inside matched subspaces; it can conceal span loss unless singular values are also recorded. Keep those operations distinct.

Track isolated states by overlap and degenerate groups by projectors/SVD alignment. Do not chase sorted orbital indices through crossings. Display a degenerate subspace or a declared gauge-selected basis; a smooth picture is not a unique physical orbital.

## 12. Forces and one energy functional

For a normalized, stationary generalized eigenvector with an isolated eigenvalue,

\[
\partial_\alpha\epsilon_i=c_i^\dagger(\partial_\alpha H-\epsilon_i\partial_\alpha S)c_i.
\]

The overlap derivative is indispensable. Add the nuclear-repulsion derivative to obtain this model's total force. This eigenstate identity is not a universal force formula for arbitrary excited time-dependent coefficient vectors. Self-consistent many-electron forces require the derivative of the complete stationary energy functional, including its double-counting corrections and basis terms.

Every dynamics backend exposes E_total and −∂E_total/∂R from one definition. Finite differences of that energy are the independent force oracle. For a prescribed external field, record work; for damping, record dissipated energy; for an isolated autonomous BO trajectory, monitor total mechanical energy. Geometry optimization is explicitly labeled relaxation.

Do not combine a reference Hessian's force with an unrelated Hückel band energy and call the resulting sum self-consistent. A reference mechanical model plus a π observer is a useful two-model experiment if labeled. The flagship reference surrogate instead derives its local mechanical model and electronic response fixtures from one declared reference method.

## 13. H₂⁺ as the integration bridge

The minimal symmetric two-centre generalized problem gives ε±=(HAA±HAB)/(1±SAB), with total E±=ε±+1/R for unit nuclei. It is an analytic oracle for the finite matrix, not the exact continuum molecular spectrum. The antisymmetric combination becomes ill-conditioned as centres coalesce; reject the singular domain.

Use the existing BO curve, density, force comparison, constrained dynamics and fixed-R drive. Add a common snapshot so a selected state, force arrow, density difference and energy ledger refer to the same R/state. Compare basis levels and separate electrostatic force from the finite-model energy derivative. Preserve the existing connection-off branch only as an explicitly erroneous/comparison experiment.

Dragging nuclei is external work. Releasing them into a conservative model does not guarantee capture. A thermostat, damping or radiation channel must be separately named if enabled.

## 14. H₂ CI as the many-electron bridge

Expose the existing minimal singlet and STO-3G CI implementations through the tagged-state adapter. The key experiment is dissociation: a restricted determinant and a correlated singlet predict different energies and pair structure even when simple density pictures are similar.

Existing archived PySCF fixtures give, at 0.74 Å, RHF −1.1167593073964255 Eh and FCI −1.1372838344885023 Eh; at 3 Å, −0.6560482511455911 and −0.9336318445584986 Eh respectively. These are old fixture results in STO-3G, not new calculations or exact physical energies. Preserve geometry, integral convention and basis when comparing.

Display natural occupations and a conditional/pair observable when available. Do not suggest that every correlation effect must be visible in n(r). H₂ is the acceptance fixture for the generic many-electron renderer before benzene.

## 15. Benzene model tiers

| Tier | What it buys | What it does not buy |
|---|---|---|
| Six-site Hückel | π spectrum, occupations, interference, bond-order response | σ framework, reliable geometry or dissociation |
| Hopping plus elastic energy | A declared electron–lattice toy model | Ab initio molecular mechanics or all 30 realistic modes |
| Reference local BO model | All-atom modes and bounded electronic response around a computed minimum | Arbitrary chemistry outside its fitted domain |
| 30-AO valence backend | Self-consistent approximate energy, density and forces if fully parameterized | Accuracy from matrix size alone |
| Correlated six-orbital π model | Exact finite-model electron correlation | Full 42-electron benzene correlation |
| Imported larger HF/DFT/CI | Independent reference and higher-fidelity snapshots | Cheap universal browser propagation |

For a uniform ring εk=α+2β cos(2πk/6). With β<0, six π electrons fill the lowest three spatial orbitals; Eπ=6α+8β. The occupied subspace, rather than arbitrarily selected degenerate orbitals, determines its density.

Use t(R)=t0 exp[−κ(R−R0)] only as a declared pedagogical choice until calibrated. An elastic term must include enough angular/out-of-plane structure if those motions are allowed. Pure nearest-neighbor central springs leave unwanted floppy motions.

A valence model has 6×4 carbon plus 6×1 hydrogen spatial AOs and 30 valence electrons. The archived all-electron STO-3G fixture instead has 36 AOs and 42 electrons. Never reuse occupations across these models without changing core treatment.

DFTB requires electronic, charge-response and repulsive contributions, not only a Slater–Koster H/S table. In a second-order convention one may write E=Tr(DH⁰)+½ΣAB ΔqAγABΔqB+Erep. Using self-consistent eigenvalue sums requires the corresponding double-counting correction. [Koskinen and Mäkinen's derivation](https://arxiv.org/html/0910.5861v1).

Select one compatible parameter family and document every pair, charge convention, derivative and distribution term. Official parameter guidance explicitly distinguishes atomic data, two-centre tables and repulsive fitting. [DFTB parameter introduction](https://www.dftb.org/parameters/introduction.html). The listed 3ob set includes C/H/N/O/P but not Si; isolated silicon support therefore does not imply this molecular backend supports silicon. [Parameter catalog](https://www.dftb.org/parameters/download.html). Parameter redistribution and real-space orbital availability are decision gates; never fabricate radial orbitals and label their density as the parameterized model's own.

## 16. Benzene vibrations

For twelve unconstrained nuclei, build the 36×36 Cartesian Hessian K of one energy at its optimized minimum. Diagonalize M⁻¹ᐟ²KM⁻¹ᐟ² after projecting mass-weighted translations and rotations. This nonlinear isolated molecule has 30 internal coordinates. A proper minimum has positive internal curvatures; imaginary modes indicate instability or numerical error. Rotational zero modes require stationarity and the corresponding rotational invariance.

With normalized mass-weighted eigenvectors eα,

\[
R=R_0+M^{-1/2}\sum_\alpha e_\alpha Q_\alpha,\quad
E_{local}=E_0+\tfrac12\sum_\alpha\omega_\alpha^2 Q_\alpha^2.
\]

The local force follows analytically from this same polynomial. Store the isotope masses and units; atomic masses in amu cannot be used as electron masses without conversion. Display frequencies in cm⁻¹ only through one versioned conversion constant.

For conventional benzene D6h labels the vibrational representation is

\[
2A_{1g}+A_{2g}+2B_{2g}+E_{1g}+4E_{2g}
+A_{2u}+2B_{1u}+2B_{2u}+3E_{1u}+2E_{2u}.
\]

Its dimensions sum to 30, with 20 symmetry-distinct mode frequencies before accidental coincidences. The harmonic electric-dipole IR species are A2u and E1u; ordinary Raman species are A1g, E1g and E2g. Axis conventions can exchange B labels; store the molecular frame. [Wilson's original normal-mode analysis](https://journals.aps.org/pr/abstract/10.1103/PhysRev.45.706) and [NIST's benzene compilation](https://webbook.nist.gov/cgi/cbook.cgi?ID=C71432&Mask=800) anchor the classification. Measured fundamentals, sometimes in condensed phases or affected by resonance, are not raw harmonic Hessian eigenvalues.

Generate a genuinely optimized reference fixture. The archived regular hexagon at C–C 1.397 Å and C–H 1.080 Å was not optimized and cannot certify a vibrational minimum. Obtain gradients/Hessians with a pinned backend; [PySCF exposes Hessian machinery](https://pyscf.org/pyscf_api_docs/pyscf.hessian.html). Reference density response must be sampled from that same method, with hold-out geometries defining validity.

## 17. Vibronic response and the two eigenproblems

Normal modes diagonalize a mass-weighted nuclear Hessian; orbitals diagonalize an electronic operator. Show both spectra and how a selected Qα perturbs the electronic operator. Label one-electron orbital energies separately from many-electron excitation energies: an HF/KS orbital gap is not automatically an optical transition. Absorption intensities require the corresponding response/transition operator and state model.

Choose a smooth orthonormal frame X(Q), X†SX=I, and calculate h=X†HX. The coupling matrix is Gα=∂h/∂Qα, including ∂X terms. Implement central differences only after aligning the frame across ±δQ. For diagonal isolated levels, the generalized Hellmann–Feynman expression in §12 is a separate check. The shortcut ⟨ψi|∂H|ψj⟩ omits moving-basis effects unless its fixed-frame assumptions are satisfied.

Symmetry permits a first-order element only when Γi*⊗ΓQ⊗Γj contains the identity. At a planar geometry, both π orbitals are odd under reflection in the plane: a reflection-odd out-of-plane perturbation cannot couple π to π at first order. σ/π mixing or higher order is needed. Therefore “every bend strongly changes the six-site π Hamiltonian” is not a valid acceptance requirement.

Another useful counterexample: a gapped, half-filled bipartite hopping model with zero onsite offsets has one electron per site in the spin-summed ground-state density even when its hoppings change. Bond orders can change while site charges remain fixed. Use a field/onsite perturbation when the intended lesson is charge redistribution. These are algebraic consequences of the selected model, not failures of visualization.

For Beta, supply finite-difference response curves and selected mode slices before fitting a general multivariate response. A linearized density can become nonpositive; prefer interpolation of a valid orthonormal-frame density/state with occupation bounds enforced by construction, and report interpolation error. Trace repair alone is insufficient. Degenerate response is a subspace quantity, not an orbital-index derivative.

## 18. Density anatomy and topology

Default to occupied density n, selected MO, signed difference Δn, and electrostatic potential. State the subtraction reference and registration in Δn; fragment differences must use compatible electron counts, positions and basis conventions. A deformation density is not a uniquely defined “bond density.”

Onsite/offsite AO decomposition is useful but basis-dependent. Rotating the AO representation changes the partition without changing n. Lowdin or intrinsic atomic orbital populations can offer reproducible conventions; [Knizia's IAO construction](https://arxiv.org/abs/1306.6884) supplies a primary starting point, not a unique observable definition of bonds.

Add critical points only when reliable derivatives exist. Report ∇n residual, Hessian signature, grid refinement and domain coverage. A bond critical point is a topological feature, not sufficient proof of energetic stabilization. Noncovalent-interaction surfaces use a reduced gradient and density-Hessian information; they are not interaction energies. [Johnson et al.'s original NCI paper](https://scholars.duke.edu/publication/807175).

ELF requires a declared kinetic-density/spin convention, and current-carrying cases need gauge-aware treatment. A scalar density-only provider cannot honestly advertise every ELF variant. [ONETEP’s explicit ELF conventions](https://docs.onetep.org/eld.html) show the kinetic-density and spin inputs required even in the standard setting. Defer ELF implementation until that capability contract and an independent fixture are supplied. Topology overlays remain optional; the density and energy experiments must work without them.

## 19. Correlated π benzene

Start with an explicit Hubbard model, then add intersite interactions for a declared PPP-like model:

\[
H=\sum_{ij\sigma}h_{ij}a^\dagger_{i\sigma}a_{j\sigma}
+U\sum_i n_{i\uparrow}n_{i\downarrow}
+\sum_{i<j}V_{ij}(n_i-z_i)(n_j-z_j).
\]

Specify neutral backgrounds zi, interaction units and hopping sign; “PPP” is not a parameter file. Pople's original treatment is a historical model source, not a ready-made calibrated benzene implementation. [Original paper](https://doi.org/10.1039/TF9534901375).

Six electrons in twelve spin orbitals give C(12,6)=924 fixed-N determinants. Fixing Nα=Nβ=3 gives C(6,3)²=400 determinants. That block is Ms=0, not automatically pure singlet. Compute ⟨S²⟩ or use spin-adapted states before assigning multiplicities.

A dense real 400² matrix is 1.28 MB before workspace; a dense complex matrix is 2.56 MB. Full diagonalization scales cubically, so use a sparse operator and Lanczos for a few states when worthwhile. The small dimension makes an exact active-model solver plausible, but provides no browser timing guarantee.

Show natural occupations, spin/pair correlations, excitation gaps and double occupation. Site charges can remain uniform as U changes; these additional observables carry the lesson. At U=V=0 recover the noninteracting result. Degenerate eigenvectors need subspace comparisons. Do not turn PPP eigenvalue gaps into quantitative experimental spectra without a parameter and transition-operator benchmark.

## 20. Current, continuity and observer operations

For a local zero-vector-potential one-electron Hamiltonian in atomic units, j=Im(ψ*∇ψ). For the 1RDM convention in §10, j=Im Σμν Dμν χν*∇χμ. This is number current; electron charge current has the opposite sign. Magnetic fields require the compatible diamagnetic contribution. Nonlocal operators may require additional continuity terms.

Define the full-space residual r=Hψ−i∂tψ. Then

\[
\partial_t|\psi|^2+\nabla\cdot j=-2\operatorname{Im}(\psi^*r).
\]

This sign follows from the declared residual convention. A Galerkin residual can be orthogonal to the finite basis while remaining nonzero pointwise. Thus a finite propagator can preserve norm and still have a local continuity defect. Show a normalized integrated residual and spatial map with a low-density mask, never a division by zero near nodes.

A BO sequence of real ground states can have changing density but zero instantaneous paramagnetic current. Do not attach a continuity certificate to that animation or fabricate flow by differencing densities; label it “instantaneous ground-state response.” A current satisfying a divergence equation alone is not uniquely the physical quantum current.

For a fixed H and a centered rectangular shutter of width T,

\[
\overline D_{ab}(t)=D_{ab}(t)\,\mathrm{sinc}[(E_a-E_b)T/2],\quad
\mathrm{sinc}(x)=\sin(x)/x.
\]

This is exact for that observation window. The infinite-time limit is ΣE ΠE D ΠE: coherences inside degenerate eigenspaces survive. A time-dependent drive instead needs integration of the evolving density over the window. Temporal averaging changes the displayed observable; it does not collapse the stored state.

For a single e^{imφ−iEt} component, Re/Im differ by a quarter phase: angular displacement magnitude π/(2|m|) when m≠0, or temporal magnitude π/(2|E|) when E≠0. Signs depend on the chosen shift convention; global phase sets the reference. This identity does not extend to an arbitrary superposition. An expectation bead marks ⟨r⟩ and optionally covariance, never an observed electron position.

A later flux-ring experiment may put phases on hoppings with total phase 2πΦ/Φ0 and obtain equilibrium persistent current from I=−∂E/∂Φ in declared charge/unit conventions. Enforce discrete continuity and gauge invariance. A single-cycle graph has one cycle degree of freedom; this does not imply a corresponding harmonic field in simply connected 3D space. Hodge decompositions require a domain and boundary conditions.

## 21. Multiscale assembly

Separate display LOD from physical fidelity. Zooming a camera may change mesh resolution without changing forces. Changing a physical model is an explicit event with an energy/state mapping and provenance.

Begin with fixed regions: far-field multipoles; a classical or polarizable environment; one fixed quantum fragment; an optional active correlated π region. Pair interactions must be counted once. Quantum atom-to-molecule assembly needs basis compatibility, electron-number conservation, antisymmetry and a consistent energy reference, not merely smooth coupling sliders.

Adaptive partitioning is a later research problem. If E=wEhigh+(1−w)Elow, differentiating yields an extra force −(Ehigh−Elow)∇w. Blending forces alone omits it; incompatible energy zeros can produce large transition artifacts. Published adaptive QM/MM work studies these transition-force and energy-conservation difficulties. [Energy-conserved adaptive-partitioning research](https://www.mdpi.com/1420-3049/23/9/2170).

The displayed derivative is elementary algebra, not a claim that scalar blending solves QM/MM. Electron exchange, polarization, boundary bonds and embedding response remain model-specific.

## 22. Rendering contract

Render immutable snapshots with geometry, density and scalar-field revisions matched. Separate evaluation from styling. Density kernels accept occupations or a 1RDM; selected-MO kernels accept one state. Phase coloring is available only for an amplitude with a declared gauge. Signed difference density uses a diverging scale and named reference.

Evaluate AO fields in blocks and cache basis values by geometry/grid revision. A density contraction is O(GK²) directly for G samples and K AOs, or O(GKNocc) through occupied/natural orbitals after preparation. Derivatives increase work. Use coarse previews while dragging and refine after settling, always exposing if the latest physical solve is pending.

Old accepted snapshots may remain visible with a pending marker; never mix their density with new nuclei. Progressive resolution must preserve units and integrated-density interpretation. Do not normalize every rendered frame to its brightest voxel and thereby hide charge or amplitude changes. The resting hint remains hidden; explicit controls and existing operation status carry the new interactions.

## 23. Worker, WebGPU and CPU responsibilities

Keep small linear algebra and authoritative reference arithmetic in Float64 on a CPU/Worker path first. Workers own SCF/CI preparation, normal modes, integral-table interpolation and expensive sampling. The main thread owns input, snapshot selection and drawing submission. GPU compute is an optional accelerated evaluator with measured error against the CPU path; backend availability must not change physical semantics.

Use transferable buffers with explicit ownership, cancellation tokens, bounded caches and latest-request scheduling. Cancellation is cooperative; stale jobs must still be discarded if they finish. Avoid putting scientific state solely in GPU buffers. Store enough CPU state to save, recover from device loss and reproduce a result.

Introduce WASM only after profiling identifies the bottleneck. A 30×30 eigensolve is unlikely to justify architectural upheaval before density evaluation and job scheduling are measured. This is a planning inference, not an existing benchmark.

## 24. Data and reference schemas

```ts
type Snapshot = {
  schemaVersion: 1;
  id: string; geometryRevision: string; basisRevision: string;
  model: { id: string; version: string; parameterHash?: string };
  units: { length: 'bohr'; energy: 'hartree'; time: 'atomic'; mass: 'electron' };
  geometry: { species: string[]; Z: number[]; masses: number[]; positions: Float64Array };
  basis: { kind: string; ordering: string; normalization: string; coreTreatment: string; size: number };
  state: TaggedElectronicState;
  quantities: Record<string, { value: unknown; provenanceId: string; error?: ErrorRecord }>;
  validity: { status: 'valid'|'pending'|'outside-domain'|'failed'; reason?: string };
};
```

A reference package additionally contains source program/version, exact input, method/functional/basis, charge, spin, occupations, coordinate frame, convergence settings, energy definition, gradient sign, Hessian indexing, orbital normalization/order, checksum and generation script. Distinguish Cartesian/spherical shells and real/complex coefficients. Float64 typed arrays need an explicit binary or JSON serialization envelope; the TypeScript sketch is not a wire format.

Start with a strict project-generated JSON/binary fixture format and a bounded s/p Gaussian evaluator. Add selected Molden import only after shell-order/normalization fixtures; fail closed for unsupported forms. The archived Molden file is useful test input, not a complete interchange specification. Never guess units or coerce a nonconverged SCF into a valid state.

## 25. Provenance and UI labels

Use separate fields for physical approximation, numerical method, representation and evidence. Examples: “RHF/STO-3G · converged numerical · occupied density”; “Hückel π · exact finite-model spectrum”; “reference harmonic model · within sampled domain”; “central-field Xα · spherical ensemble”; “rectangular shutter · observer operation.”

Attach uncertainty or residual to each quantity, not one green badge to the whole scene. A GPU render error does not estimate functional error. “Variational” requires the actual variational setting; a fitted semiempirical energy does not become an upper bound to the exact molecular energy merely because it was minimized.

Show the useful label near the control, with detailed assumptions available on demand. Include method/geometry/units in exports and saved scenes. Do not insert implementation jargon into the default experience. Existing hidden hints and UI style constraints remain intact.

## 26. Validation strategy

The user will verify the experience. Engineering work should use a small, decisive set of mathematical fixtures rather than repeated broad audits. Separate three questions: did we implement this model; does the approximation match the chosen reference; is the presentation honest?

Proposed Float64 gates for small, well-conditioned fixtures: relative Hermiticity and generalized residual ≤10⁻¹⁰; C†SC−I max norm ≤10⁻¹⁰; electron-count error ≤10⁻¹⁰; density occupation violations ≤10⁻¹⁰. A near-singular basis is rejected or explicitly truncated before these gates apply. Relative residual denominators must include matrix/vector norms and a floor.

Force gates: central-difference agreement initially ≤10⁻⁵ Eh/bohr on smooth fixtures, with at least two step sizes showing the expected refinement before roundoff/SCF noise. This is an implementation tolerance, not a universal chemical accuracy claim. Density quadrature should initially account for N to 10⁻³N with an explicit finite-domain/tail estimate. Refine only when an observed failure or a stronger claim requires it.

For propagation use norm, observables and timestep order; for BO motion use energy drift and timestep refinement; for transport use covariance and reversibility; for modes use rigid-motion projection, symmetry and Hessian-vector differences. Do not require exact degeneracy bit patterns or compare eigenvector signs. A malformed/imported fixture, failed SCF and stale Worker result each need one meaningful rejection test.

## 27. Independent oracle plan

Use analytic 2×2 generalized H₂⁺ for matrix conventions; existing SciPy pulse traces for time integration; existing PySCF H₂ FCI for the CI adapter; analytic ring eigenvalues for Hückel; independent determinant enumeration for Hubbard; and backend finite differences for forces/Hessians.

Generate benzene reference geometry, gradient, Hessian and response with one pinned method first. RHF/STO-3G is a cheap import/regression oracle but a poor final chemistry standard. Commission R4 selects and records a larger-basis DFT comparison and numerical settings. Do not blend reference methods across one Hessian/force certificate.

Use NIST frequencies for species, symmetry and experimental context, not a pass/fail 1% match to unscaled harmonic calculations. Record isotopologue, phase and whether an experimental line is mixed/resonant. Store observed model discrepancies; do not tighten solver tolerances to pretend to remove them.

The existing benzene fixture's RHF energy is −227.89056887857598 Eh at its fixed, unoptimized geometry. Its archived 0.1614 s solve was on a particular Python/CPU setup. It is not a browser performance measurement. No chemistry calculation was rerun for this planning dossier.

## 28. Performance and error budgets

These are initial targets to measure, not promises:

| Work | Target/measurement | Control when exceeded |
|---|---|---|
| Interaction/draw | 60 fps desktop target; 30 fps fallback; main-thread work p95 ≤4 ms | Reduce visual sampling, never enlarge physical timestep silently |
| Small-model preview | First useful response ≤100 ms on nominated target hardware | Cancel obsolete requests, show pending state |
| Reference/SCF solve | Asynchronous, report median/p95 and convergence iterations | Keep last coherent snapshot; do not invent a hard real-time guarantee |
| Density sampling | Benchmark G, K, Nocc, precision, bytes and GPU/CPU separately | Tile, cache and progressive refinement |
| CI | Measure 400-state ground/excited solves and memory | Sparse matvec/Lanczos or offline fixture |
| Reference package | Record compressed and decoded bytes per geometry | Load per specimen/mode; bounded cache |

Record browser, device, build hash, warm/cold timings and percentile sample count. Allocate error separately to physical model, basis truncation, self-consistency, propagation, interpolation, quadrature and rendering. An inexpensive approximation with an honest domain is more useful than an undocumented “high accuracy” switch.

## 29. Prioritized backlog

P0/Beta core: B0 model contracts; B1 causal observer tools; B2 atom providers; B3 H₂⁺ integration; B4 many-electron/reference pipeline; B5 π benzene; B6 reference modes; B7 bounded electronic response; B8 release integration.

P1/extensions: B9 correlated π; B10 native valence energy backend; B11 topology; B12 general moving-basis dynamics. These may ship incrementally after their gates pass; none silently enlarges the first Beta acceptance surface.

Research-only: adaptive QM/MM, continuum/ionization, gauge-consistent molecular magnetic response, general reactive assembly, nuclear branching and biological environments. Characteristic play for other Hamiltonians remains a small-specimen program: coherent/squeezed QHO, hydrogen Stark/Zeeman, Sturmian scale, box barriers, and a Cornell potential labeled as a pedagogical potential rather than QCD. Their contracts are grouped in the research commissions, not implied as Beta commitments.

## 30. Frontier research commissions

[RESEARCH-COMMISSIONS](RESEARCH-COMMISSIONS.md) supplies bounded briefs with falsifiers for atomic/Sturmian transfer, atom-to-molecule composition, DFTB parameters, benzene reference mechanics, vibronic symmetry, correlated π, basis-dependent anatomy, topology, current geometry, multiscale boundaries and continuum dynamics. Each must return equations, assumptions, a minimal reproducible counterexample or fixture, implementation implications and a go/no-go recommendation.

The purpose is adversarial reduction of uncertainty. A beautiful derivation without a computable error or falsifier does not justify a release claim. No commission is reported as already executed by an independent agent.

## 31. Explicit non-goals

Beta does not implement general ab initio integral evaluation in JavaScript, arbitrary molecule discovery, reliable chemical reaction barriers, all-electron RNA dynamics, physical ionization in a bound register, radiative capture, environmental decoherence, nuclear wavepacket branching or quantitative aromatic ring-current maps. A stretch feature becomes available only through its own contract and label.

No task may resurrect the resting hint, modify the frozen window library, deploy to Cloudflare or infer a production launch from a local plan. New provider interfaces do not license unrelated UI redesign.

## 32. Build waves and dependency structure

B0 → B2 → B3 and B0 → B4 establish the shared foundations. B0 → B1 improves causal experiments independently. B4 → B5 → B6 → B7 builds the benzene experience; B6 also requires the reference-method decision R4. B8 integrates and releases the required path.

B9 depends on B4/B5; B10 depends on B4 plus R3; B11 depends on trustworthy spatial derivatives; B12 depends on B3/B4 and its moving-basis force/transport proofs. Native DFTB is deliberately absent from the core dependency chain. Use existing paths as adapters and new modules with bounded ownership; do not have several workers independently rewrite `rack.js`.

## 33. Per-wave acceptance and handoff

The complete mini-contracts are in [BUILD-CONTRACTS](BUILD-CONTRACTS.md). Each identifies experience, math, physical meaning, approximation, dependencies, cost, error, independent oracle, failures, tests, UI label and deferred physics, plus proposed file ownership. A wave ends with a coherent specimen, source/fixture hashes, focused verification results and a statement of remaining limits.

Do not mark a wave complete because its UI exists. For B6/B7 the decisive acceptance is a single geometry producing mutually compatible modes, energy/force and electronic-response data inside a measured domain. Outside-domain behavior is part of acceptance. For B8 include save/reload, cancellation and hidden-hint preservation. Dates follow measured work; avoid invented calendar certainty.

## 34. Path to nucleobases and RNA

After benzene: one nucleobase with fixed geometry and imported orbitals; then hydrogen-bonded base pairs with deformation density and an explicitly selected interaction model; then a sugar/phosphate fragment; then a short RNA segment with classical environment and one fixed quantum region. Protonation, charge, counterions and solvent become essential model inputs. A 27-nucleotide RNA scene may be visually tractable long before its electronic dynamics is scientifically justified.

Use fixed-region embedding first. Validate isolated fragments, dimers, boundary forces and environmental polarization before adapting the region. Preserve state/charge transfer semantics and account for energy at every change in physical resolution. The same snapshot, provider, provenance and error interfaces designed for benzene can support this path without promising that one molecular backend covers every scale.
