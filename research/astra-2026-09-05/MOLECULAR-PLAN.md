# Molecular orbitals and an atom builder: implementation plan

Astra · 5 September 2026 · proposed sequence, with the first numerical prototype implemented

Build a small, trustworthy molecular instrument before attempting reactive molecular dynamics. Keep the analytic atomic lab and its exact finite-state shadow. Give molecules their own state representation and let the same renderer expose selected orbitals, occupied density and density change.

The [math audit](MATH-AUDIT.md) contains the derivations, defects, measurements and scope of the current code. This plan estimates work in bounded implementation increments rather than promising a calendar date. Most risk is in electronic-state semantics, force consistency and validation, not drawing atoms.

## 1. Models worth implementing

| Model | What it buys | What it cannot establish | Decision |
|---|---|---|---|
| Existing analytic hydrogen/H₂⁺ | Closed reference cases, instant response, exact amplitude shadow | General multi-electron chemistry | Keep permanently as reference mode |
| Expanded one-electron two-centre basis | Real dipole-coupled molecular amplitudes; controllable basis errors | Electron correlation, arbitrary geometry | First field-response milestone |
| H₂ small-basis full CI | Bond formation/stretching with electronic correlation; tiny many-body state | Basis-converged chemistry with only two spatial functions | First two-electron milestone |
| Imported Gaussian-basis HF/DFT states | Arbitrary atoms, occupied MOs, density; mature integral infrastructure | Accurate dissociation/excited dynamics by import alone | Main general-molecule path |
| Hückel π model | Very cheap benzene ring orbitals and coherent π response | σ bonds, total binding, realistic geometry, quantitative excitation energies | Optional teaching preview |
| SCC-DFTB real-time dynamics | Parameterised self-consistent electrons and established Ehrenfest machinery | Universal transferability or first-principles accuracy | Evaluate after reference cases |
| xTB geometry backend | Convenient approximate geometry optimisation | A substitute for real-time electronic dynamics | Optional builder relaxation path |
| MASH/FSSH/Gaussian wavepacket nuclear dynamics | Branching/decoherence/nonadiabatic reaction research | A cheap drop-in correction to an incomplete electronic solver | Later research branch |

DFTB+ documents field-driven electronic and Ehrenfest calculations, so it is a plausible approximate dynamics backend. xTB documents geometry optimisation, a different role. These are recommendations from their documented capabilities, not locally benchmarked integrations. [DFTB+ electronic dynamics](https://dftbplus-recipes.readthedocs.io/en/stable/electronicdynamics/introduction.html); [DFTB+ Ehrenfest tutorial](https://dftbplus-recipes.readthedocs.io/en/stable/electronicdynamics/ehrenfest.html); [xTB basics](https://xtb-docs.readthedocs.io/en/latest/basics.html).

## 2. Establish a molecular state contract

Introduce `lab/molecularstate.js` independently of the 91-label atomic `Register`. Initial serialisable shape:

```js
{
  schemaVersion: 1,
  units: { length: 'bohr', energy: 'hartree', time: 'atomic' },
  geometryVersion: 1,
  nuclei: [{ id: 'H1', Z: 1, mass: 1836.15, position: [0, 0, -1] }],
  charge: 1,
  spin2: 1,                      // Nalpha - Nbeta for a chosen spin sector
  electronCount: 1,
  basis: { kind: 'sto', functions: [], ordering: [], normalization: '' },
  overlap: [],
  stateKind: 'one-electron',     // determinant | ci | one-particle-density
  coefficients: { re: [], im: [] },
  occupations: [],
  method: { name: 'LCAO', parameters: {}, backendVersion: '' },
  provenance: { geometryHash: '', basisHash: '', reference: '' }
}
```

This is a schema sketch, not a shipped API; the single listed nucleus illustrates one entry, not a complete H₂⁺ fixture. Use tagged variants so CI amplitudes cannot accidentally pass as MO coefficients. A determinant stores coefficient columns and occupations, or a one-particle density with explicit spin convention. A CI state stores determinants/CSFs and transition one-particle density information. Only the nuclear geometry is shared across variants.

Validate integer electron count, spin-sector parity, occupation bounds appropriate to the variant, array shapes, Hermiticity, finite values, overlap rank and C†SC. Preserve the full double-precision state. Rendering thresholds must not mutate its populations. Use stable atom/basis IDs and explicit ordering; Molden Cartesian/spherical conventions and phase/normalisation must be converted, not guessed.

Expose views through functions such as `orbitalAt(index,r)`, `densityAt(r)`, `densityChangeAt(r)`, `currentAt(r)` and `observables()`. A snapshot must remain unchanged after the solver advances. The new `modrive.snapshot()` already exercises this contract on one electron.

## 3. Milestone A: put the validated pulse on screen

**Available now:** `lab/modrive.js`, longitudinal position integrals, independent analytic/SciPy reference and timestep tests. It is headless. Wire it through a small `modriveview.js` card, `mathworker.js`, `main.js` and the existing molecular render path.

Start with fixed R and H₂⁺. Controls: separation, basis choice, pulse amplitude, carrier frequency, duration, run/reset and logical time. Default to a weak pulse within the validated regime. The internal integration timestep is independent of display frame rate and the user's playback speed. Do not reuse the moving-nucleus `dt = 5` as an electronic timestep without convergence evidence.

Display the applied field, bonding/antibonding populations, total dipole and Δ electron density. Let the user switch to one selected orbital's phase. Caption the model as one electron, fixed nuclei, finite basis. Show norm drift as a diagnostic, not a physical accuracy score. Reject unsupported geometry/basis configurations explicitly.

The first UI should use the existing two-1s render path. Expanded Sturmian states require packing the actual expanded orbital functions on both centres; do not compute with a larger basis while still displaying the two-1s surrogate as though it were that state.

Acceptance:

- The plotted trace reproduces [drive-trace.json](drive-trace.json) within the selected solver/render tolerances; pause/resume/scrub do not change the trajectory.
- Δt, Δt/2, Δt/4 reproduce the existing factor-four convergence; add density and dipole convergence as well as coefficients.
- Increase basis order/radial flexibility and quadrature separately. Set a displayed accuracy claim only after the chosen observable stabilises.
- Reverse field sign and rotate the whole experimental geometry/polarisation together; dipoles transform correctly. The current prototype supports z only, so arbitrary rotations/polarisation are a subsequent extension.
- Check field-free energy after the pulse and driven work balance. With H = H₀ − μE, d⟨H⟩/dt = −μ Ė for fixed nuclei; equivalently d⟨H₀⟩/dt = E μ̇. Integrate with matched endpoints and discretisation.
- For future spectroscopy, refine simulation duration, time sampling, damping/window function and basis; a small norm error does not determine spectral resolution.

## 4. Milestone B: H₂ that can stretch without the wrong electronic limit

Add a reference-backed Gaussian integral fixture path first, then an on-demand backend. For two spatial AOs there are four spin orbitals and only C(4,2) = 6 two-electron determinants (four in the fixed Nα=Nβ=1 sector). Build the one- and two-electron Hamiltonian, not twice the one-electron H₂⁺ Hamiltonian. Include nuclear repulsion exactly once.

Diagonalise this small CI matrix and propagate its amplitudes under the electric dipole operator. The existing shadow realification applies to the CI amplitudes directly. Render density using the CI one-particle density/transition densities. A selected natural orbital is a separate display, not the entire interacting state.

Compare [the two supplied H₂ RHF/FCI reference points](chemistry-reference.json) and generate a denser dissociation curve. Add independent density and dipole reference values before claiming them validated. Show the difference between RHF, correlated minimal-basis CI and basis enlargement. Neither “FCI” nor “SCF converged” alone means chemically exact.

Acceptance: electron trace 2, Hermitian positive one-particle density, correct spin sector, time reversal, zero-field stationarity, matching reference energy and correct separated-atom limit within the chosen basis. At a converged minimum, force changes sign correctly. Compare analytic forces to symmetric energy differences over several step sizes.

A slow approach of two isolated atoms in conservative dynamics does not necessarily produce a permanently bound molecule: binding energy has to go somewhere. A builder's `Relax` operation removes energy computationally; label it geometry optimisation. Physical capture needs radiation, collisions, a bath or another specified channel. Do not add hidden drag to call capture a first-principles result.

## 5. Milestone C: add atoms and solve a static molecule

Implement in this order:

1. Import the supplied benzene Molden file and a simpler H₂ file; verify ordering, norms and density before adding editing.
2. Add nuclei in world coordinates, delete/move them, choose charge/spin, and import/export XYZ. Keep bond lines as optional geometric annotations.
3. On geometry edits, immediately draw nuclei and mark the old electronic solution stale. Debounce a static solve through a local backend. A result carries geometry/basis hashes; discard it if another edit has superseded it.
4. Return basis descriptors, MO coefficients, occupations, energies, overlap and method/convergence metadata. Render occupied density and individual MOs.
5. Add an explicit geometry relaxation command with convergence history and cancel support. Cache by geometry, method, charge and spin.

Prefer PySCF initially because the reference generator already runs here and exposes SCF/CI data. Keep it outside the browser as a small local service/process, or precompute fixtures for an offline demo. A pure-browser integral/SCF implementation can follow after the data contract and comparisons are stable; a full Gaussian integral engine is not the fastest proof of concept.

Use `molecularbasis.js` for arbitrary-centre Gaussian evaluation and import conversion. Preserve `twocentre.js` as the high-quality special-case reference. Its prolate quadrature, axial m conservation and two-centre geometry do not generalise by simply adding another centre to an array. Preserve `atoms.js` for atomic pictures and guesses.

For responsiveness, solve on a worker/backend and upload immutable render snapshots. Cache basis values on tiles where geometry is fixed; evaluate density as occupied-orbital sums or a density-matrix contraction. Profile before committing to grid resolution. Compute and render budgets are separate. A fast 36-AO backend solve says nothing yet about volumetric rendering on an iPad.

Acceptance: H₂, HeH⁺, H₂O and benzene static fixtures; charge/spin validation; translation/rotation covariance; electron-density integral near Ne with explicit box-tail error; MO orthogonality; force checks; stale-result rejection; save/load reproducibility. Increase a Gaussian basis from minimal to polarised to demonstrate that errors are visible and controllable.

## 6. Milestone D: many-electron molecular response

First offer a clearly labelled frozen-orbital/frozen-Fock pulse as a reference approximation. Then implement self-consistent real-time HF, followed by a specified TDDFT functional or SCC-DFTB backend if justified by benchmarks. The density matrix, Hamiltonian, pulse and geometry must refer to the same snapshot and units.

ChronusQ's documentation specifies density-matrix propagation and second-order MMUT/Magnus options. Use it as an independent validation target and as inspiration for an experiment centred on density/dipole response. The current new prototype has not been compared directly against ChronusQ. [ChronusQ RT documentation](https://github.com/xsligroup/chronusq_public/wiki/RT).

For a benchmark, pin version, geometry, basis ordering, charge/spin, initial state, pulse definition, gauge, timestep and method. Compare dipole traces and weak-field spectra under at least two timestep and basis refinements. Do not compare pictures of an orbital or different underlying methods and infer agreement.

Acceptance: occupation spectrum/electron trace under unitary mean-field propagation, C†SC, energy/work balance, predictor-corrector convergence, invariance under occupied-space rotations, and density positivity. Remove accidental occupied-only rotations masquerading as charge transfer. At degeneracies, track subspaces by overlap rather than eigenvector index/sign.

## 7. Milestone E: moving nuclei

Finish the electronic transport equation and derive forces from a consistent variational model before presenting this as validated Ehrenfest dynamics. Choose one of: analytic AO derivative coupling; cross-overlap transport with quantified projection/rank error; or a fixed laboratory basis/grid. Reusing AO coefficients and normalising is not a substitute.

Use electronic substeps inside nuclear steps. BO relaxation, BO dynamics and excited-state Ehrenfest dynamics need separate state transitions. A BO solver finding a different root is not continuous excited-state propagation. Add root/subspace tracking and reject excessive overlap conditioning changes.

Acceptance:

- Ṡ = τ+τ† and norm conservation without hidden rescaling on a prescribed moving path.
- Rigid translation/rotation tests, including required phases when testing a moving physical wavefunction rather than merely a change of coordinates.
- Forces versus energy differences on BO eigenstates, with basis/Pulay contributions included.
- Field-free energy and total momentum convergence in isolated systems; time reversal on a smooth trajectory.
- Compare dt and dt/2 at both electronic and nuclear levels; report basis/quadrature error separately.
- Stop/reject boundary/near-collision steps instead of clipping R while preserving velocity.
- Compare a simple nonadiabatic model to a converged quantum-nuclear reference before inferring realistic branching.

The September 3 Nazarov preprint concerns a strict classical-nucleus limit, explicitly excludes trajectory bifurcation and assumes a corresponding electronic TDSE. It does not validate omitted connection terms, approximate electron correlation or finite-timestep code. Treat it as a recent theoretical contribution, not a blanket exactness badge. [Nazarov, full preprint](https://arxiv.org/html/2609.03419v1).

## 8. Benzene can have three honest milestones

**π preview:** six pz sites on a ring, six π electrons, nearest-neighbour Hückel matrix. Its eigenvalues are α+2βcos(2πk/6), k=0,…,5, obtained directly by discrete Fourier diagonalisation of the ring adjacency matrix. For β<0, fill the lowest three spatial orbitals with two electrons each. A site-potential electric field can drive coherent π density. This is an exact finite ring model and an approximate description of benzene. It omits the σ framework and cannot supply full binding energies or trustworthy geometries.

**Static all-electron picture:** the supplied 36-AO, 42-electron STO-3G RHF fixture already establishes backend feasibility. Import/render it, then enlarge the basis and compare density/orbital character. Compare degenerate orbital subspaces and total density rather than demanding identical individual orbital shapes. Do not infer aromatic ring currents from a static orbital picture.

**Correlated π response:** a π(6 electrons,6 orbitals) active space has 400 determinants in the fixed Nα=Nβ=3 sector; allowing all spin sectors gives C(12,6)=924. Define frozen occupied σ/core contributions and orbital selection explicitly. CASCI at fixed orbitals and CASSCF with optimised orbitals are different approximations. Eventually use their transition densities for correlated dynamics. The π active space is not full benzene correlation, especially during bond rearrangement. [PySCF multiconfigurational methods](https://pyscf.org/user/mcscf.html).

A proof-of-concept atom builder and static benzene need not wait for photochemical benzene dynamics. Keep those deliverables separate in the release plan.

## 9. Research branches to keep, with a reason to defer each

- **MASH/FSSH:** useful when mean-field nuclear motion cannot represent outcome branching. Start with model systems and converged electronic couplings. Mapping variables are not the same object as the app's exact amplitude oscillators. [Original MASH paper](https://arxiv.org/abs/2212.11773); [time-reversible integration](https://arxiv.org/abs/2412.15976).
- **Gaussian nuclear wavepackets/AIMS-style methods:** a route to retaining nuclear coherence and splitting, with substantially greater bookkeeping and electronic-structure cost. The corpus's Legion reference is relevant to this later branch; its full text was not accessible during this review, so detailed algorithm claims were not certified here. [Legion publication record](https://pmc.ncbi.nlm.nih.gov/articles/PMC11948330/).
- **Kustaanheimo–Stiefel/restricted Gaussians:** valuable Coulomb geometry and an atomic research extension. Periodicity is in fictitious time and subject to a constraint; this does not produce a ready many-centre, many-electron molecule solver. [Fabčič, Main and Wunner](https://arxiv.org/abs/0903.1611).
- **Grid/continuum methods:** necessary for trustworthy strong-field ionisation and escaping flux. They bring boundary, absorber and convergence requirements beyond a bounded orbital display. [tRecX](https://arxiv.org/abs/2101.08171).

## 10. First implementation backlog

| Order | Deliverable | Existing seam | Completion evidence |
|---:|---|---|---|
| Done | Correct shell classification and Pulay-bound claims | frontier/orbit/mo/moview | New counterexamples, full Node suite |
| Done | Headless H₂⁺ pulse | twocentre + modrive | Independent oracle and convergence plot |
| 1 | Pulse card and correct molecular density snapshot | main/mathworker/field + new view | Visual check plus reference trace |
| 2 | Tagged molecular state and fixture importer | new state/basis modules | H₂ and benzene norm/density comparisons |
| 3 | H₂ small-basis CI | new many-body Hamiltonian module | Supplied RHF/FCI values and dissociation curve |
| 4 | Static atom builder/backend | geometry editor and job interface | H₂O/benzene, stale-job tests, exports |
| 5 | Self-consistent fixed-nuclei pulse | mean-field density propagator | Matched-method external dipole benchmark |
| 6 | Moving-basis transport and variational forces | mo dynamics successor | Norm, force, reversibility and energy gates |
| 7 | Benzene active-space/approximate dynamics | validated state/solver interface | Stated model-specific reference comparisons |

Keep method, basis, charge/spin and observable available in the UI's information panel and in every export. Give the main view simple physical controls. A user should be able to see what changed in the electron density, while an expert can reproduce exactly which model produced it.
