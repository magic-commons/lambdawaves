# THE NAMES AND THE CACHE — Sol's molecular-orbital collection, taken further

Fable, 2026-10-01. Extends `research/molecular-orbitals-2026-09-29/` (PLAN.md, CACHE-BUDGET.md, DISTRIBUTION.md, the
feasibility probe — Sol's, in the root checkout, read and left untouched). From Josh: *"I was thinking metadata that holds
the proper molecular orbital names and all the different names for it. Ultrathink that plan from the OpenAI team of models
but further."* Status: a plan plus a names probe run on the live solver (`PROBE.md` beside this file). Nothing in `lab/`
changed.

## 1 · Judgment of Sol's plan

**What stands, unchanged.** One collection shared by MOLECULES and MO-REGISTRY; a small native booster for the 52 enabled
STO-3G presets before any big download; explicit capabilities per dataset (never inherit "Koopmans" or RHF text onto a DFT
set); the live solver kept for changed inputs; the grid provider as the only road past `MAX_MOL_AO = 64` (a dense ERI tensor
for C₆₀ is 60 GiB); benzene as the proof molecule; Drive first and R2 later behind one pack contract; hashes, bounded
import, atomic commit; and its honesty about what a screenshot does and does not establish.

**What moved under it.** The plan inspected `91c90bc`. Four releases later:
- **0.3.1** — every stored key has a scope (PREFERENCE / WORKSPACE / PROJECT) and the undo ring is the whole project. A
  dataset choice is PROJECT (one history row); an installed dataset is none of the three (§6).
- **0.3.2** — an update install refetches every precached file (203 files, 5.6 MB, measured), and an untouched session now
  takes a build by itself. Bundling 5–20 MB inside `lab/` would be downloaded again on **every** deploy. The starter must
  not live in the build cache (§6).
- **0.3.3** — the app already writes a Gaussian cube and an NPZ of the grid it shows (`lab/export3d.js`, `field.readGrid()`,
  the worker's `export` op, `docs/EXPORT.md`). The "benzene grid proof" has its reference exporter in the app, and the
  importer is the inverse of a writer whose conventions are already documented.

**What is missing.** Names. Sol puts symmetry at step 5 and frames it around C₆₀'s Iₕ, which is the hard case. Today the
whole instrument names a molecular orbital three ways: `HOMO`, `LUMO`, `HOMO−n` / `LUMO+n`, and `k7` (`orbitalsview.js`).
No irrep, no σ/π, no lone pair, nothing a chemist would write. And Sol's own warning — *"we should not assume an orbital
index survives a different geometry or calculation"* — has no answer in the plan: datasets are keyed by hash, orbitals by
index, so a preset saved against one dataset means nothing against another.

## 2 · The thesis: the name is the key

A proper orbital name does three jobs, and the plan needs all three:

1. **What the reader reads.** `3a₁`, `1b₁ · HOMO`, `1e₁g`, `2σ_u`, `1π_g` — what a textbook, a paper and a photoelectron
   spectrum call it.
2. **The identity that survives a change of dataset.** The n-th orbital of an irreducible representation, counted by
   energy, is the same orbital in STO-3G and in def2-SV(P), in RHF and in PBE0: two levels of the same symmetry do not
   cross. `(irrep, count)` is therefore the join key between a live solve, a cached record and an imported pack — the
   thing an index never was. A project stores both the exact reference `{dataset hash, index}` and the portable one
   `{group, irrep, count}`; restore uses the exact one when the dataset matches and the portable one otherwise, and says
   which it used.
3. **The address.** MO-REGISTRY's search, a modulation target's caption and the copy-as-LaTeX all resolve a name to the
   same stable id. The saved ids (`reg.*`, `chem.*`) do not change (CLAUDE.md's law); names are aliases onto them.

So the order of work inverts: **names first** (they need no cache — any solve result can be named), **then the booster**
(a record now carries its names), **then packs** (names are what make two datasets comparable).

## 3 · All the different names

Worked for three orbitals: water's HOMO, nitrogen's HOMO, benzene's HOMO pair.

| Family | H₂O HOMO | N₂ HOMO | C₆H₆ HOMO | Where it comes from | Survives a new basis or method |
|---|---|---|---|---|---|
| Index | `MO 5` | `MO 7` | `MO 20, 21` | the solve | no |
| Frontier | `HOMO` | `HOMO` | `HOMO` (a pair) | occupation | the word yes, the orbital no |
| Symmetry, counted | `1b₁` | `3σ_g` | `1e₁g` | characters of the MO under the point group (§5) | **yes** |
| Symmetry, other axis convention | `1b₂` | — | — | the same, x and y swapped | yes |
| Symmetry, as a program prints it | `B1` (C2v) | `Ag` (D2h subgroup) | `B2g + B3g` (D2h subgroup) | the abelian subgroup PySCF, ORCA and Molpro compute in | yes |
| Valence-only count | `1b₁` | `3σ_g` → some texts `2σ_g` | — | core orbitals skipped; curated per convention | yes |
| Textbook LCAO | `n(O 2pₓ)` | `σ(2p_z)` or `σ_g 2p` | `π₂, π₃` | dominant AO parentage and the sign of the overlap population | mostly |
| Character | lone pair, non-bonding, π (⟂ plane) | σ bonding | π bonding | parentage, bond-order contribution, reflection in the molecular plane | mostly |
| Hückel | — | — | `ψ₂, ψ₃` | the π orbitals counted by energy | yes for planar π systems |
| Ionisation band | `1b₁⁻¹ → X̃ ²B₁` | `3σ_g⁻¹ → X ²Σ_g⁺` | `1e₁g⁻¹ → X̃ ²E₁g` | the hole's symmetry; a state label, capital letters | yes |
| Component in a degenerate set | — | — | `1e₁g (a)`, `1e₁g (b)` | `canon-gauge.js`, with the gauge version | only with the same gauge |

And every one of them in four **forms**: Unicode for the interface (`1b₁`, `σ_g⁺`), ASCII for search and file names
(`1b1`, `sigma_g+`), LaTeX for the notebook and the copy (`1b_{1}`, `\sigma_{g}^{+}`), and speech for the canvas's
sentence (`one b one`). Orbitals are lower case, states upper case — Mulliken's rule, kept.

The **atom** side gets the same treatment, because the register already has more than one name per state and four places
format them today (`hamiltonian.js` four `labelOf`s, `hydrogen.js`, `latex-state.js`, the spectrum): the complex name the
register is true in (`2p₋₁`), the real chemistry name when the state is that combination (`2pₓ`, `3d_{z²}`, `3d_{x²−y²}`),
and the same four forms. One service, `lab/names.js`, answers for atoms and molecules; the four formatters become one.

## 4 · The record

One JSON object per orbital, inside the dataset record (so a cached result is named without a solve, and a live solve is
named by the same function):

```json
{
  "id": "mo:5", "index": 5, "energy": -0.39126, "occ": 2,
  "cluster": { "id": "c5", "size": 1, "component": 0, "gauge": null },
  "frontier": { "offset": 0, "name": "HOMO" },
  "symmetry": {
    "group": "C2v", "irrep": "b1", "count": 1, "label": "1b₁",
    "frame": "Mulliken 1955: z = C₂, x ⟂ molecular plane",
    "aliases": [ { "label": "1b₂", "frame": "x in the molecular plane" } ],
    "subgroup": { "group": "C2v", "irrep": "B1" },
    "characters": [1, -1, 1, -1], "residual": 3e-13, "status": "verified"
  },
  "character": { "plane": "π", "bonding": "non-bonding", "kind": "lone pair",
                 "parentage": [ { "atom": 0, "element": "O", "ao": "2pₓ", "weight": 1.00 } ] },
  "names": {
    "primary": "1b₁", "frontier": "HOMO", "long": "1b₁ · HOMO · oxygen lone pair",
    "unicode": ["1b₁", "HOMO", "n(O 2pₓ)"], "ascii": ["1b1", "HOMO", "n(O 2px)"],
    "latex": ["1b_{1}", "\\mathrm{HOMO}", "n(\\mathrm{O}\\,2p_{x})"],
    "search": ["1b1", "b1", "homo", "lone pair", "n", "nonbonding", "2px", "1b2"]
  },
  "sources": { "symmetry": "computed", "character": "derived", "textbook": "derived" }
}
```

Per dataset: the configuration — `(1a₁)²(2a₁)²(1b₂)²(3a₁)²(1b₁)²` with its LaTeX — the ground term (`X̃ ¹A₁`), the point
group, the frame, the tolerance the geometry met it at, and `nameSchema: 1`. Names are **regenerable from the cached
coefficients**: a schema bump re-derives them offline, no solve.

## 5 · How the proper names are computed

**Declare and verify, not detect.** The library is 54 curated molecules. Each gets a declared point group and frame in
`lab/molecules.js`'s own record; a tool applies every operation to the nuclear framework and fails if atoms do not map to
atoms within tolerance. No general point-group detector, no guessed symmetry.

**Thirteen groups cover the library:** D∞h (H₂, N₂, F₂, Cl₂, Br₂, CO₂, C₂H₂, BeH₂, MgH₂), C∞v (LiH, HF, CO, LiF, NaH, HCl,
NaCl, HCN, N₂O, OH⁻, CN⁻, HBr), T_d (CH₄, SiH₄, GeH₄, CF₄, NH₄⁺), C₃v (NH₃, PH₃, AsH₃, H₃O⁺, CH₃CN), C₂v (H₂O, H₂S, H₂Se,
O₃, SO₂, H₂CO, furan, pyridine), D₃h (BH₃, AlH₃, BF₃), D₂h (C₂H₄), D₃d (C₂H₆), D₆h (C₆H₆), C₂h (butadiene), C₂ (H₂O₂),
C_s (CH₃OH, HCOOH) and C₁ — the last to be confirmed per geometry by the tool (C₃H₆, urea, glycine). I_h waits for C₆₀.

**The labelling.** For each operation R build its AO matrix D(R): atoms permute, s maps to s, p rotates by R, Cartesian d
by R's symmetric square (needed only for Ge, As, Se, Br). Cluster the MOs by energy (the app's own cluster rule). The
character of a cluster is χ(R) = Σ_k C_kᵀ S D(R) C_k. Decompose with the character table, n_Γ = (1/h) Σ_R χ(R) χ_Γ(R). A
cluster must come out as exactly one irrep of its own dimension; anything else gets **no name** and a recorded reason.
Linear molecules need no table: |m| from χ(C_φ) at two generic angles, ± from one σ_v, g/u from inversion. Count within
each irrep by energy.

**The honesty rules** (Sol's ethos, extended):
- A name is shown only when its residual is below tolerance; otherwise the orbital falls back to its index.
- A name never asserts an ordering. RHF/STO-3G may order 1π_u and 3σ_g of N₂ differently from experiment; the label is
  right either way, and that difference is a thing the instrument can now *show*.
- C₂v and D₂h labels carry their frame; the alias under the other convention is stored, not hidden.
- A component of a degenerate set is named with the gauge that defined it; the set is the nameable object.
- Approximate symmetry carries its tolerance. Koopmans stays RHF-only; a DFT orbital is tagged Kohn–Sham.
- Textbook and character names are tagged `derived` or `curated` with a source, never passed off as computed.

**Probe.** `names-probe.mjs` beside this file runs the live solver on H₂O, NH₃, CH₄, N₂, CO, HF, CO₂, C₂H₄, H₂CO and
C₆H₆ and compares the computed configurations with the textbook ones. Results: `PROBE.md`.

## 6 · The cache, further

- **A fourth storage class: LIBRARY.** An installed dataset is not PREFERENCE (it is not the reader's furniture), not
  WORKSPACE and not PROJECT. It is device content, content-addressed, never in a project, a link or a history row. A
  project holds a reference — `{ id, hash, nameKey }` — and that reference is PROJECT. `docs/STATE-SCOPES.md` gains the row.
- **The starter does not go in the build cache.** Under the worker's law the precache is the whole app and every build
  refetches it. A 5–20 MB starter inside `lab/` would cost every user that download on every deploy and slow the quiet
  take. From day one the data lives in its own content-addressed cache (`lw-data-…`), fetched per molecule on first open,
  kept across builds, with an idle "warm the starter" for offline use. It is the same store the packs use later, so the
  pack lifecycle is built once, small, and proven on the starter. (The alternative — teach an update install to copy
  unchanged files from the old build cache — is worth doing anyway, and is one function in `sw.js`.)
- **The record** is Sol's native booster record plus §4: geometry, charge, basis, solver and gauge versions, C, ε,
  occupations, the validated response data — and the names. Key: every numerical input + solver / basis / gauge / name-schema
  version. A cached open must not call `ensureSolve()`.
- **The generator is the app.** `tools/orbital-library.mjs` runs the shipped solver in node, writes the records, and
  `--check` proves them byte-exact — the same pattern as `tools/new-project.mjs`. No second implementation to drift.
- **Grids.** The cube and NPZ the app exports (0.3.3) are the grid proof's reference; the importer reads the same
  conventions back. PySCF stays the independent cross-check, not the only producer.
- **Names in everything that leaves the app:** the GLB's scene and mesh names, the cube's comment line, `meta.json` in
  the NPZ, the copy-as-LaTeX (`$3a_{1}$`), the canvas's sentence.

## 7 · Stages

| Stage | What | Done when |
|---|---|---|
| N1 · THE NAMES | `lab/names.js` (atoms + molecules, four forms, search), the declared groups in the library, `tools/orbital-names.mjs --check`; MO-REGISTRY lanes and the ORBITAL ladder read `1b₁ · HOMO`; copy and exports carry the names | the ten anchor configurations match the textbook; every enabled molecule is named or says why not; the four old formatters are one |
| N2 · THE BOOSTER PROOF | benzene's record (names inside) opens with no SCF; the `lw-data-` store; LIBRARY in the scope law | cached = fresh on energies, occupations, signed fields, canonical subspaces and names; zero solver calls on open |
| N3 · THE STARTER | all 52 records, generator `--check`, a visible RECALCULATE | measured bytes and first-display time reported; live fallback when an input changes |
| then Sol's 3–6 | pack import, the grid provider, C₆₀ and DMT, I_h labels, the library | as written in Sol's PLAN.md |

Light verification throughout (Josh's dial): one gate run and one direct check per stage; a verifier agent only for N2's
worker and storage change.

## 8 · Rulings for Josh (each flips one line)

- R1 The primary name on a lane: the symmetry label (`1b₁`) with the frontier name beside it — or the reverse.
- R2 The C₂v / D₂h frame: Mulliken 1955 (x ⟂ plane; water's HOMO is `1b₁`) with the other as an alias.
- R3 Counting: all-electron (`3σ_g`), valence-only as an alias where a textbook uses it.
- R4 Components of a degenerate set: `(a)`, `(b)` under the canonical gauge — or Cartesian tags (`π_x`, `π_y`) where the
  frame makes them meaningful.
- R5 Names ship before the cache (N1 alone is a release).
- R6 The starter lives in its own data cache, not in the build.
- R7 Textbook LCAO names: derived automatically for diatomics, curated for the anchors, absent elsewhere.
- R8 The hydrogen register's default name stays the complex `2p₋₁`; real names (`2pₓ`) appear when the state is one.

## 9 · What this does not claim

No dataset has been generated. I_h labelling is not attempted. Experimental ionisation energies per named orbital are a
later, sourced addition. The probe names ten molecules in a minimal basis with s and p functions only; d shells, the
remaining presets and larger bases are N1's work, not the probe's.
