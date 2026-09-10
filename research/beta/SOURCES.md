# Sources, evidence and limits

Research conducted 2026-09-07–08. This is a primary-source-informed design dossier, not an exhaustive systematic literature review. The equations and implementation contracts are project derivations/design decisions unless explicitly attributed. Abstract-only records establish a method's scope; they do not certify its detailed implementation. No chemistry calculation, GPU benchmark or application test suite was rerun for this documentation task.

## Inputs and current-code evidence

User inputs, read without modifying them:

- `/home/joshua-hosain/Documents/OBSIDIAN/SOL TO ASTRA PROMPT.md`
- `/home/joshua-hosain/Documents/OBSIDIAN/POST RELEASE PRE-ASTRA DOSSIER.md`

Current repository baseline: `9eb463d07fd212d729a09f82946acc6816d5461f`. Existing [handoff](../../HANDOFF.md) and [task board](../../TASKS.md) describe completed wave 107. Historical research lives in [the September 5 audit](../astra-2026-09-05/MATH-AUDIT.md), [molecular plan](../astra-2026-09-05/MOLECULAR-PLAN.md) and [source ledger](../astra-2026-09-05/SOURCES-AND-COVERAGE.md). Historical test counts and timings are not new observations.

The following source findings change the older plan:

| Finding | Evidence | Consequence |
|---|---|---|
| Pulse interaction already has a UI | `lab/pulseview.js`; `rack.js` imports/calls `createPulse` | B3 adapts it instead of rebuilding a headless experiment |
| Moving-basis connection already exists | `lab/mo.js` functions `connection`, `transport`, `evolve`; `tests/mo.test.mjs` W49 | Generalization is future work; “connection missing” is obsolete for this prototype |
| Propagation uses the combined frozen generator | `mo.js` `evolve` | Do not describe the current step as the old split transport/H evolution |
| Force/dynamics variants require explicit selection | `mo.js` force and `createDynamics` options | No blanket variational/Ehrenfest certificate from a norm-preserving step |
| H₂ CI already exists | `lab/h2ci.js` | B4 builds generic state/density semantics around existing chemistry |
| Electrostatics already has several views | `lab/electrostatics.js` and integration | Extend provider inputs and provenance rather than scheduling every view as new |
| Benzene fixture is unoptimized and all-electron | [chemistry-reference.json](../astra-2026-09-05/chemistry-reference.json), generation script | 36 AOs / 42 electrons; cannot serve as a minimum/Hessian certificate for the 30-AO valence model |

Source inspection establishes presence and design, not correctness over every input. The baseline hash fixes what “current” means for this plan.

## Primary/official research map

| Source | Evidence inspected | Use and limitation |
|---|---|---|
| [Skinner, finite quantum/classical correspondence](https://arxiv.org/abs/1302.0754) | Paper record/abstract | Precedent for arbitrary finite-Hermitian oscillator mapping; project conventions derived explicitly |
| [Artacho & O'Regan, evolving Hilbert space](https://arxiv.org/abs/1608.05300) | Paper record/abstract and repository publication metadata | Moving-basis geometry; no claim of having reproduced every paper derivation |
| [DFTB+ electronic dynamics](https://dftbplus-recipes.readthedocs.io/en/stable/electronicdynamics/introduction.html) | Official equations and introduction | Independent AO density-matrix/connection convention check |
| [Koskinen & Mäkinen, DFTB derivation](https://arxiv.org/html/0910.5861v1) | Abstract, full-text page and energy/parameterization discussion | Establishes ingredients and force/parameter questions; not a chosen validated parameterization |
| [DFTB parameter introduction](https://www.dftb.org/parameters/introduction.html) | Official parameter definitions | Atomic data, pair tables and repulsion are separate required inputs |
| [DFTB parameter catalog](https://www.dftb.org/parameters/download.html) | Official set/species listings | Compatibility/species gate; listing is not permission to mix sets or a redistribution audit |
| [DFTB+ Hessian preparation](https://dftbplus-recipes.readthedocs.io/en/latest/moleculardynamics/startinggeometry.html) | Official workflow | Hessian from force derivatives and optimized-geometry context |
| [PySCF SCF](https://pyscf.org/user/scf.html) | Official method documentation | Convergence/state conventions; backend candidates |
| [PySCF MCSCF](https://pyscf.org/user/mcscf.html) | Official active-space documentation | CASCI/CASSCF scope and active-space limitations |
| [PySCF Hessian API](https://pyscf.org/pyscf_api_docs/pyscf.hessian.html) | Official API/reference entries | Reference-generation path; API availability is not a finished fixture |
| [Wilson, benzene normal modes](https://journals.aps.org/pr/abstract/10.1103/PhysRev.45.706) | Original publisher record/page | Primary historical symmetry/mode model; no unreported force constants copied |
| [NIST benzene](https://webbook.nist.gov/cgi/cbook.cgi?ID=C71432&Mask=800) | Official vibrational table, symmetry, phase and notes | D6h classification and experimental context; not a harmonic-method accuracy certificate |
| [NIST oxygen](https://physics.nist.gov/PhysRefData/Handbook/Tables/oxygentable1.htm) | Official ground configuration/term table | Open-shell atom semantics |
| [Pople, unsaturated hydrocarbons](https://pubs.rsc.org/en/content/articlepdf/1953/tf/tf9534901375) | Original publisher bibliographic record, DOI confirmed | Historical PPP model source; full parameter derivation remains a commission task |
| [Knizia, intrinsic atomic orbitals](https://arxiv.org/abs/1306.6884) | Original paper record/abstract | Reproducible atomic interpretation candidate, not unique observable bond partition |
| [Johnson et al., NCI](https://scholars.duke.edu/publication/807175) | Author-institution publication record/abstract | Original reduced-gradient density analysis; no energetic classifier claim |
| [ONETEP localization descriptors](https://docs.onetep.org/eld.html) | Official formulas and required data | Explicit kinetic-density, spin and normalization conventions for ELF; not a correlated/current extension certificate |
| [Adaptive QM/MM energy-conserved partitioning](https://www.mdpi.com/1420-3049/23/9/2170) | Original article record/abstract via [PubMed](https://pubmed.ncbi.nlm.nih.gov/30154373/); PMC search excerpt | Transition-force problem. Publisher returned HTTP 429 and PMC later a browser challenge; full text not claimed read |
| [Čertík et al., dftatom](https://arxiv.org/abs/1209.1752) | Original record/abstract | Radial atomic oracle candidate; not executed here |
| [Scrinzi, tRecX](https://arxiv.org/abs/2101.08171) | Original record/abstract | Continuum backend research lead; not adopted or benchmarked |
| [Mannouch & Richardson, MASH](https://arxiv.org/abs/2212.11773) | Original record/abstract | Nuclear branching research lead; not evidence for current dynamics |

A 2026 PPP review surfaced during discovery but is not used as a primary technical authority. Experimental databases and official implementation documentation are explicitly distinguished from original research papers. Access dates do not imply the underlying publications are recent.

## Focused mathematical probes performed

[math-probes.py](math-probes.py) uses NumPy independently of the app. [math-probes.json](math-probes.json) records the results and runtime versions. This is a bounded check of four consequential algebraic statements plus dimension bookkeeping, not a new molecular simulation.

| Probe | Observed result |
|---|---|
| Six-site ring eigenvalues against discrete Fourier formula | Maximum error 8.89×10⁻¹⁶ |
| Distorted gapped bipartite ring, half filled | Site population error 1.23×10⁻¹⁵; density-matrix/bond-order change about 0.274 |
| Exact rectangular-shutter formula against independent midpoint quadrature | Maximum error 1.90×10⁻¹⁰; degenerate coherence retained |
| Generalized eigenvalue derivative against energy finite differences | Error 1.99×10⁻¹²; omitting overlap derivative gives about 0.00480 error in the test's units |
| Explicit determinant enumeration | 924 fixed-N determinants; 400 at Nα=Nβ=3 |
| Mode representation dimension bookkeeping | 30 coordinates, 20 symmetry-distinct modes; this does not independently derive the character table |

Reproduce with a Python environment containing NumPy:

```bash
python3 research/beta/math-probes.py
```

The run here used `/home/joshua-hosain/miniforge3/envs/sci/bin/python`, Python 3.12.13 and NumPy 2.4.6. No new package was installed. Output is deterministic up to ordinary floating-point/library variation. The deliberately modest thresholds are in the script.

## Decisions still requiring evidence

The near-equilibrium reference method, displacement domain, interpolation error bounds, DFTB parameter/radial package, precise ELF/current extension, adaptive embedding and hardware budgets are not settled by this dossier. Their decisions have named commissions or build gates. No arbitrary numerical error is relabeled as a physical-model uncertainty.

The master dossier contains all 34 requested subjects; the build contracts contain the thirteen mini-contract fields for B0–B12; the optional specimen shelf has shared and per-feature fields. No application feature is marked implemented because a plan or a mathematical probe exists.
