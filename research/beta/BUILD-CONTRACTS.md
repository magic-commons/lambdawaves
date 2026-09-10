# Beta build contracts

Status: proposed. Read the [master dossier](MASTER-DOSSIER.md) for equations and conventions. B0–B8 define the recommended first Beta. B9–B12 are separately gated extensions. Paths below are proposed ownership boundaries, not files already implemented. Preserve existing APIs through adapters; one integration owner controls edits to rack/stage and saved-project migration.

Every contract uses the same thirteen required fields. Numeric tolerances refer to well-conditioned Float64 implementation fixtures, not physical-model accuracy. “Independent” means a separate analytic derivation or reference implementation, not another call through the same production helper. Only run the focused checks relevant to a wave; Josh verifies the user experience.

## B0 — Physical-model and snapshot foundation

- **Name:** PhysicalModel v1.
- **User experience:** Existing specimens behave the same, with meaningful model labels and clear unsupported-operation reasons.
- **Mathematical object:** Geometry/basis/state/observable tuple with immutable revisions and capability predicates.
- **Physical meaning:** Quantities shown together come from a declared state and energy model.
- **Model class:** Architecture and representation; inherits each adapter's physical approximation.
- **Dependencies:** Current module outputs and save format; no new chemistry solver.
- **Compute cost:** Negligible metadata overhead; avoid copying large arrays per animation frame.
- **Error metric:** Revision mismatches and incompatible energy/state requests are counted and rejected.
- **Independent oracle:** Hand-authored one-electron and determinant fixtures, including malformed input.
- **Failure modes:** Stale jobs, silent zero-force fallback, mislabeled current, incompatible units.
- **Acceptance tests:** One existing hydrogen specimen round-trips unchanged; a stale density cannot publish against new nuclei; unsupported forces return a typed error; snapshot serialization preserves complex coefficients and units.
- **UI label:** Model-specific concise provenance; no generic “exact” badge.
- **Deferred physics:** All new physical models.

**Ownership/output:** `lab/physical/model.js`, `state.js`, `snapshot.js`, adapter directory; a schema specification and `tests/physical-model.test.mjs`. Output `SnapshotV1`, error codes and one adapter. Proposed codes: `UNSUPPORTED_CAPABILITY`, `STALE_REVISION`, `INVALID_METRIC`, `NONCONVERGED`, `OUTSIDE_DOMAIN`, `INVALID_STATE`. Do not refactor every solver before one adapter works.

## B1 — Causal observer and generator tools

- **Name:** Observer window and operator descriptors.
- **User experience:** Compare instantaneous density with a finite exposure; inspect expectation/covariance; distinguish a physical drive from playback and camera motion.
- **Mathematical object:** Centered-window density average, first/second spatial moments, and H(t)=H0+Σuα(t)Gα.
- **Physical meaning:** The shutter is an observation operation; a generator changes evolution; the bead is an expectation.
- **Model class:** Exact fixed-H finite-model shutter; numerical driven shutter; representation for bead.
- **Dependencies:** B0; existing operator, moment and modulation facilities. Inventory controls before adding duplicates.
- **Compute cost:** O(K²) shutter preparation in the energy basis; reuse moment matrices; driven-window sampling has a separate budget.
- **Error metric:** Trace/Hermiticity, zero-width limit, quadrature error for time-dependent windows.
- **Independent oracle:** Two-level beat integral and a three-level spectrum with a degenerate pair.
- **Failure modes:** Removing degenerate coherence; averaging amplitudes instead of density; mutating the stored state; interpreting frame skipping as decoherence.
- **Acceptance tests:** T→0 returns the original density; a known beat acquires the sinc factor; a degenerate off-diagonal survives long T; toggling shutter leaves saved amplitudes unchanged. Generator units and rate/strength conversion are explicit.
- **UI label:** “Exposure average”, “Expectation”, or named physical drive; separate “Playback speed”.
- **Deferred physics:** Measurement collapse, decoherence and general continuum drives.

**Ownership/output:** `lab/physical/observers.js`, `operators.js`, narrow rack integration. Operator descriptors declare `generator|geometry|solver|observer|camera`, units, supported state types and whether a changing input invalidates the basis. Existing operator-split SPIN rates remain labeled by their actual integration semantics; do not claim the sum is propagated exactly merely because each substep is exact.

## B2 — Floating isolated atoms

- **Name:** Atom providers v1.
- **User experience:** Place H/C/O, inspect radial density and occupations, move the nucleus and cloud together; weak-field polarization is enabled only for supported specimens.
- **Mathematical object:** Translated radial/AO basis, occupation ensemble, multipoles and optional polarizability tensor.
- **Physical meaning:** An isolated central-field atom or a separately declared weak-response approximation.
- **Model class:** Numerical spherical central field; analytic hydrogen reference; optional fitted/linear response.
- **Dependencies:** B0, existing `atoms.js`, `sturmian.js`, `electrostatics.js`.
- **Compute cost:** Cache radial solutions by species/charge/configuration; translations reuse them; polarization solve scales with the chosen interacting-dipole model.
- **Error metric:** Radial normalization, electron count, SCF residual, tail charge, translation covariance.
- **Independent oracle:** Analytic hydrogen; archived or newly generated radial atomic reference with pinned method; term-aware NIST metadata.
- **Failure modes:** Open-shell state ambiguity, electrostatic/KS-potential confusion, polarization catastrophe, missing Si molecular parameters.
- **Acceptance tests:** Integrated density matches electron count within declared radial/domain error; translating atom and probe preserves values; occupations/configuration persist through save; a nonconverged radial solve is visibly unavailable. If polarization is included, energy/field derivatives and weak-field reversal must agree.
- **UI label:** “Central-field atom · spherical ensemble”; separate “Linear polarization”.
- **Deferred physics:** General molecular transferability, dynamic correlation and arbitrary strong-field response.

**Ownership/output:** `lab/physical/atom-provider.js` and a few specimen files. C/O required; Si isolated support may follow without delaying the molecular path. Do not advertise “reactive atom” from this provider alone.

## B3 — Coherent H₂⁺ instrument

- **Name:** Shared H₂⁺ state/force/drive view.
- **User experience:** Drag separation, select a state, inspect density and energy-derived force, then release BO motion or apply the existing fixed-R pulse.
- **Mathematical object:** Generalized two-centre eigenproblem and the current constrained moving-basis dynamics.
- **Physical meaning:** One electron with a finite basis and declared nuclear-motion approximation.
- **Model class:** Variational stationary finite basis; numerical driven/BO/constrained moving-basis paths.
- **Dependencies:** B0/B2; reuse `mo.js`, `modrive.js`, `pulseview.js`; existing tests are evidence, not work to repeat blindly.
- **Compute cost:** Existing basis sizes; Worker preparation if needed; measure propagation separately from density rendering.
- **Error metric:** Metric conditioning, eigen residual, force discrepancy, timestep convergence and energy/work balance.
- **Independent oracle:** Analytic minimal 2×2 generalized spectrum; archived independent SciPy pulse; central differences of total energy.
- **Failure modes:** Singular near-coincident centres, default electrostatic force presented as certified total force, stale geometry, norm-only validation.
- **Acceptance tests:** One equilibrium and one stretched fixture have matching energy/density revisions; force agrees with the declared energy derivative; pulse adapter reproduces an existing reference trace; singular geometry gets a typed failure. Choose `nuclearForce` explicitly and expose any unsupported dynamics regime.
- **UI label:** “H₂⁺ · finite basis”, with “BO motion”, “Driven fixed nuclei” or “Constrained moving basis”.
- **Deferred physics:** Physical capture/radiation, general 3D moving bases and continuum ionization.

**Ownership/output:** `lab/physical/adapters/h2plus.js`; narrow UI integration. Do not implement a second pulse panel or remove the existing connection. Connection-off mode is a named comparison, never a default physical model.

## B4 — Many-electron density and reference ingestion

- **Name:** 1RDM/CI renderer and strict fixture pipeline.
- **User experience:** Compare H₂ determinant and CI dissociation; switch between total density, selected MO and natural occupations without changing electron count.
- **Mathematical object:** Tagged states, D=CfC† or CI-derived 1RDM, normalized Gaussian/radial basis evaluation.
- **Physical meaning:** Correct one-body observables of the selected many-electron model.
- **Model class:** Exact within a specified finite CI model; numerical HF reference; representation for selected orbital.
- **Dependencies:** B0 and existing `h2ci.js`; archived PySCF fixtures.
- **Compute cost:** O(GKNocc) occupied-orbital density or O(GK²) 1RDM contraction; cache natural orbitals.
- **Error metric:** Tr(DS), occupation bounds, orbital normalization and CPU sampling error.
- **Independent oracle:** Existing PySCF H₂ RHF/FCI energies and density matrices; analytic normalized s/p functions.
- **Failure modes:** Coherent occupied sum, spin factor of two, incorrect AO order/units, invalid natural occupations, interpreting a 1RDM as a complete interacting state.
- **Acceptance tests:** RHF occupied rotations leave density unchanged; CI gives the reference count/occupations; existing equilibrium/stretched energy fixtures agree at their declared tolerance; unsupported shells/normalization fail closed; source input and hash survive export.
- **UI label:** “Occupied density”, “Selected MO”, “Natural occupation”, plus method/basis.
- **Deferred physics:** General quantum-chemistry import, an in-browser integral engine and universal 2RDM reconstruction.

**Ownership/output:** `lab/physical/density.js`, `gaussian-basis.js`, `reference-import.js`, H₂ adapter; `tools/reference/` exporter. First use project-generated JSON/binary data with s/p shells. Molden support is a bounded follow-up inside this contract only when its conventions are fixture-tested.

## B5 — π benzene

- **Name:** Six-site electronic ring.
- **User experience:** Inspect π levels, select a degenerate subspace, distort hoppings, and compare site populations with bond-order response.
- **Mathematical object:** Six-site Hermitian H, six-electron occupied projector and optional declared hopping/elastic toy energy.
- **Physical meaning:** π-only delocalization and symmetry; not a complete molecular energy surface.
- **Model class:** Exact finite-model solution of a pedagogical/parameterized Hamiltonian.
- **Dependencies:** B0/B4; generic density and eigenspace representation.
- **Compute cost:** Negligible 6×6 linear algebra; real-space density cost depends on chosen p-orbital representation.
- **Error metric:** Spectrum/projector residual, electron count, parameter and orbital representation provenance.
- **Independent oracle:** εk=α+2βcos(2πk/6), Eπ=6α+8β; independently constructed bipartite projector.
- **Failure modes:** Claiming σ bonding, interpreting site-charge constancy as failed response, unstable orbital tracking in degenerate pairs, unsupported out-of-plane linear coupling.
- **Acceptance tests:** Uniform ring matches analytic energies/multiplicities; occupied rotations preserve density; a hopping distortion changes bond order with no forced site-charge change; onsite perturbation produces the expected symmetry breaking.
- **UI label:** “Hückel π model”; real-space basis marked illustrative if not physically calibrated.
- **Deferred physics:** Full molecular forces, quantitative spectroscopy and all-atom vibration mechanics.

**Ownership/output:** `lab/physical/models/pi-ring.js`, benzene specimen and focused algebra fixture. No cylinder-based bond-formation threshold. Optional elastic energy has its own explicit definition and cannot silently replace B6's force model.

## B6 — Reference-backed flexible benzene

- **Name:** Benzene local mechanical model.
- **User experience:** Select one of 30 internal coordinates, animate its motion and inspect restoring force and mode symmetry; rigid motion moves the molecule as a whole.
- **Mathematical object:** Optimized R0, total-energy gradient/Hessian, masses, rigid-motion projector and local harmonic energy.
- **Physical meaning:** Small-amplitude motion near one computed minimum.
- **Model class:** Numerical reference plus a local harmonic approximation.
- **Dependencies:** B4/B5; R4 reference-method decision; source-owned generation scripts.
- **Compute cost:** Reference optimization/Hessian offline; a 36×36 diagonalization and O(36×30) reconstruction online.
- **Error metric:** Stationarity, internal curvature, rigid residual, symmetry splitting, force/Hessian finite-difference error and held-out energy error.
- **Independent oracle:** Reference backend gradients at ± displacements; symmetry dimensions; NIST classification for context.
- **Failure modes:** Calling the old unoptimized hexagon a minimum; negative curvature clipped to zero; mass-unit mistakes; spring models masquerading as reference chemistry.
- **Acceptance tests:** One pinned method converges an isolated minimum; six rigid directions are identified and 30 internal coordinates retained; eigenpairs reconstruct the projected Hessian; finite differences agree with forces; out-of-domain mode amplitudes are rejected or explicitly limited. Store actual tolerances/results in the fixture manifest.
- **UI label:** “Reference harmonic model · near equilibrium”; method/basis on demand.
- **Deferred physics:** Large-amplitude anharmonicity, dissociation, solvent and reaction paths.

**Ownership/output:** `tools/reference/benzene.py`, `research/beta/fixtures/benzene-*`, `lab/physical/modes.js`, `local-bo.js`. The archived STO-3G fixture is an import smoke fixture only. Proposed initial domain study: ± small and moderate displacements in selected symmetry-distinct modes plus several mixed-mode hold-outs. Choose actual amplitudes in mass-weighted units from observed reference errors; do not hard-code an untested universal angle/radius.

## B7 — Electronic response to bending

- **Name:** Coupled mode/spectrum/density view.
- **User experience:** Move a mode coordinate and watch the electronic spectrum split and density respond, with a marker showing where the local model is supported.
- **Mathematical object:** Same-method electronic snapshots over Q, aligned subspaces, ∂(X†HX)/∂Q and bounded interpolation.
- **Physical meaning:** Instantaneous electronic ground-state response along a prescribed nuclear geometry.
- **Model class:** Reference response, locally interpolated; no time-dependent current claim.
- **Dependencies:** B4/B6; same method, geometry and core treatment across the fixture family.
- **Compute cost:** Prepare response offline; small matrix interpolation/diagonalization plus rendering online. Load mode slices lazily.
- **Error metric:** Held-out energy/density/spectrum error, metric/occupation validity and alignment singular values.
- **Independent oracle:** Fresh reference snapshots not used to fit the response; diagonal generalized eigenvalue derivatives.
- **Failure modes:** Gauge jumps, nonpositive interpolated density, wrong overlap derivative, double-counted mechanics, π-only bending claims forbidden by reflection symmetry.
- **Acceptance tests:** Reference and interpolated snapshots agree within published measured bounds on held-outs; trace/occupation constraints hold throughout allowed sliders; degenerate groups remain continuous as subspaces; an out-of-plane forbidden first-order π–π element vanishes within numerical error; no physical current arrows appear for the static BO sequence.
- **UI label:** “Instantaneous ground-state response”; “Interpolated” when applicable.
- **Deferred physics:** Vibronic wavepackets, electronic excitation from moving nuclei and nonadiabatic branching.

**Ownership/output:** `lab/physical/response.js`, `subspace.js`, response fixture manifest. First ship supported one-mode slices and explicit mixed-mode coverage. If only a π observer is attached to reference mechanics, label both models and do not claim its electronic energy generates the displayed restoring force. A completed B7 flagship includes same-reference density response, not only the separate π observer.

## B8 — Beta integration and release readiness

- **Name:** Causal specimen workflow.
- **User experience:** Move between atom, H₂⁺, H₂ and benzene specimens; save/reopen an experiment with its approximation labels and usable controls.
- **Mathematical object:** Reproducible model inputs, observations and versioned results.
- **Physical meaning:** Preserves the interpretation established by B0–B7.
- **Model class:** Integration; inherits model-level claims.
- **Dependencies:** B0–B7 complete; existing UI style and frozen-port constraints.
- **Compute cost:** Measure target hardware; 60/30 fps display goals and ≤100 ms small-model preview are targets, not guaranteed physics throughput.
- **Error metric:** Revision coherence, saved-state equality, documented CPU/render discrepancy and measured latency/memory.
- **Independent oracle:** Saved fixture hashes, CPU reference samples and Josh's experience verification.
- **Failure modes:** Mismatched density/geometry, runaway Worker queues, device loss, labels lost during export, hidden hint accidentally restored.
- **Acceptance tests:** Save/reload one specimen per model; rapid drag cancels/discards stale results; unsupported/failed model remains understandable; density refinement does not alter electronic state; hidden resting hint stays hidden. Run required release checks once after integration, and repeat only for changes/failures that justify it.
- **UI label:** Concise model and operation labels already specified in each wave.
- **Deferred physics:** B9–B12 and all research-only features.

**Ownership/output:** One rack/stage integration owner; project-format migration; specimen navigation; release notes and measured budget sheet. Any `lab/` edit requires the repository's PWA restamp. Prepare release artifacts without inferring permission for Cloudflare deployment. Core Beta is done when the required specimens and their claim gates pass, not when every frontier topic is solved.

## B9 — Correlated π extension

- **Name:** Hubbard/PPP benzene laboratory.
- **User experience:** Increase interaction strength and inspect natural occupations, double occupation, spin correlations and gaps alongside density.
- **Mathematical object:** 400-determinant Ms=0 block with explicit Hamiltonian and optional additional spin sectors.
- **Physical meaning:** Correlation inside six spatial π orbitals.
- **Model class:** Exact finite active-model solver; semiempirical parameters when fitted.
- **Dependencies:** B4/B5 and R6; no dependence on native DFTB.
- **Compute cost:** Dense 400² storage or sparse matvec; benchmark eigensolver rather than promise realtime.
- **Error metric:** Eigen residual, particle/spin conservation, 1RDM bounds and parameter/reference discrepancies.
- **Independent oracle:** Separate determinant enumeration; U=V=0 Hückel limit; small dimer analytic limit.
- **Failure modes:** Fermionic sign errors, Ms mistaken for singlet, active-model exactness mistaken for full chemistry, correlations hidden by density-only UI.
- **Acceptance tests:** Recover noninteracting limit; ⟨S²⟩ supports multiplicity labels; pair observables agree with independent small fixtures; GPU/render changes preserve state.
- **UI label:** “Correlated π · exact within active model”.
- **Deferred physics:** σ/core correlation, universal PPP calibration and photochemical trajectories.

**Ownership/output:** `lab/physical/models/pi-ci.js`, fermionic basis module, independent reference script. Keep the parameter file separate and hash it. Promote only after R6 chooses and justifies the parameter convention.

## B10 — Native valence energy extension

- **Name:** Parameterized all-atom benzene backend.
- **User experience:** Explore a wider geometry domain with energy, forces, occupations and density responding together.
- **Mathematical object:** Compatible H/S, charge-response functional, repulsive energy and consistent derivatives.
- **Physical meaning:** Semiempirical valence chemistry over a declared parameter domain.
- **Model class:** DFTB-family approximation, exact identity/version stated; not an ad hoc table called DFTB.
- **Dependencies:** B4; R3 parameter/derivative/orbital availability decision; compatible C/H data.
- **Compute cost:** 30-AO SCF plus table interpolation and density evaluation; measure convergence iterations and p95 latency.
- **Error metric:** SCF residual; force finite differences; energy/geometry/Hessian comparison with the chosen external implementation.
- **Independent oracle:** Pinned DFTB+ using identical parameters/settings; higher-level reference for model discrepancy.
- **Failure modes:** Missing repulsion, double counting, inconsistent charge sign, discontinuous splines, incompatible sets, density from unrelated radial functions.
- **Acceptance tests:** Energies and forces agree with the external implementation on a small varied geometry set; displacement refinement validates derivatives; failed SCC returns failure; parameter redistribution and density basis are documented before bundling.
- **UI label:** Exact method/parameter-family name and validity limits.
- **Deferred physics:** Unsupported species, reliable bond breaking outside the tested domain, nonadiabatic dynamics and solvent chemistry.

**Ownership/output:** `lab/physical/models/valence.js`, `sk-tables.js`, parameter manifest. If R3 fails, retain the reference-backed Beta and record the reason; do not substitute uncalibrated pair potentials silently.

## B11 — Density topology extension

- **Name:** Critical points and reduced-gradient anatomy.
- **User experience:** Inspect density critical points and noncovalent-region overlays with their numerical confidence.
- **Mathematical object:** n, ∇n, Hessian(n), critical-point signatures and optional reduced gradient.
- **Physical meaning:** Features of the selected scalar density, not categorical bond energies.
- **Model class:** Numerical analysis and representation of a specified approximate density.
- **Dependencies:** B4; derivative-capable basis evaluator; R7/R8.
- **Compute cost:** Adaptive spatial search and derivative samples in a Worker; cache by density revision.
- **Error metric:** Gradient residual, Hessian conditioning, boundary coverage and refinement stability.
- **Independent oracle:** Analytic Gaussian mixture plus an external molecular density topology fixture.
- **Failure modes:** Missed critical points, nuclear singularities, near-zero-density blowups, topological bond labels interpreted energetically.
- **Acceptance tests:** Recover analytic critical points/signatures; refinement stabilizes the molecular example; unsupported ELF capability cannot be selected; changing AO decomposition leaves total-density topology invariant.
- **UI label:** “Density critical point” or “Reduced-gradient surface”, with source density.
- **Deferred physics:** Universal bonding classifier and ELF without its required kinetic/current data.

**Ownership/output:** `lab/physical/topology.js` and overlay adapter. ELF remains research-only until R8 returns a separate concrete convention and fixture.

## B12 — General coupled electron/nuclear extension

- **Name:** Moving-basis dynamics beyond the H₂⁺ coordinate.
- **User experience:** Watch electronic and nuclear states evolve together under a declared coupled model, with energy/work and transport diagnostics.
- **Mathematical object:** iSċ=(H−iτ)c or corresponding 1RDM equation, compatible nuclear equations and basis derivatives/cross overlaps.
- **Physical meaning:** A specified Ehrenfest/variational approximation; neither BO replay nor branching nuclear quantum dynamics.
- **Model class:** Numerical coupled finite-basis dynamics.
- **Dependencies:** B3/B4, a force-capable molecular model, and R2/R9; B10 required if it supplies that model.
- **Compute cost:** Substepped electronic propagation plus nuclear steps and repeated model preparation; asynchronous compute budget.
- **Error metric:** Metric norm, state error, connection identity, energy/work balance, projection loss and local continuity where defined.
- **Independent oracle:** Prescribed 3D rigid-motion path; fixed-grid/sufficiently converged reference on a small molecule; timestep/force finite differences under stated assumptions.
- **Failure modes:** Omitting antisymmetric connection, norm-preserving but inaccurate transport, arbitrary excited-state force shortcut, fake current, artificial heating.
- **Acceptance tests:** Fixed-nuclei limit agrees with existing drive; rigid translation/rotation transforms observables correctly; reversing a field-free path recovers the state within convergence error; reducing timestep improves observables; singular metric and lost-span events are explicit. Conservation alone is insufficient.
- **UI label:** Named coupled model with basis/truncation and convergence status.
- **Deferred physics:** Surface hopping/MASH, wavepacket branching, photons, open-system decoherence and continuum escape.

**Ownership/output:** `lab/physical/transport.js`, coupled integrator and model-specific force derivation. Do not generalize the present one-coordinate formula by replacing R with a vector without deriving all derivatives.
