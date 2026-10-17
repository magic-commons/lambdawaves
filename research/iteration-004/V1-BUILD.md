# Iteration 004 · V1 THE VOLUME ENGINE — build report

Branch `it004-vol` (from the plan commit `6fb4e3b`). No push. Data lives in `~/Documents/LAMBDAWAVES-VOLUMES/` (outside git);
the only volume bytes in git are the 62 KB test fixture `tests/fixtures/volumes/H2O.lwm`.

## What landed

| piece | file(s) | what it does |
|---|---|---|
| THE BASES | `lab/vendor/bse/{sto-6g,3-21g,6-31g,6-31g-star}-v1.json`, `6-31+g-star-v1.json` widened, `index.json` | BSE JSON vendored verbatim (re-fetched 2026-10-17 from the URLs in `index.json`; bytes = the planner's fetch, sha-256 pinned). `BASIS_FILES` (`lab/rhf-molecule.js`) and `BASIS_LABEL` (`lab/latex-state.js`) carry all six, in ladder order. |
| the ladder's oracle | `tools/volumes/oracle-ladder.py` → `tests/fixtures/oracles/basis-ladder-v1.json`; `tests/basis-ladder.test.mjs` | 17 rungs (H₂O, NH₃ × the four new bases; HCl × five incl. the widened 6-31+G*; HBr × STO-6G, 6-31G*; ZnH₂ × 3-21G, 6-31G): the app's RHF = PySCF cart=True on the vendored decimals to **4e-12 Eh**, 8 s. |
| THE SOLVER | `tools/volumes/solve.py` (+ `lwbasis.py`, `app-atoms.mjs`) | PySCF 2.14 RHF up the ladder, smallest molecule first, each rung from the rung below's projected density; DIIS → level shift → newton; resumable; per-molecule `flock` so solvers share a queue; SIGTERM-safe (tmp + rename); `raw/<id>/<basis>.npz`, `meta.json`, `raw/STATUS.json` (+ ETA), `raw/solve.log`. |
| THE PACKER | `tools/volumes/pack.mjs` | raw → `dist/<vol>/m/<id>.lwm`, `index.json`, `volumes.json`, with the app's own basis, overlap, dipole, names; refuses a rung unless CᵀSC = I (1e-8, f64), Tr(DS) = N, dipole and E_nuc agree with PySCF, `validateRecord` = [] and `chem.open` answers the energy with 0 solver calls. Deterministic bytes; `--incremental`; `--out` for one file. |
| THE FORMAT | `lab/volumes-format.js` | `parseLwm`, `rungs`, `rungRecord`, `encodeLwm` — pure, DOM-free; staged in `tests/wiring.test.mjs`' allowlist until the store imports it. |
| DENSITY from a volume | `lab/library.js` `decodeRecord` | a frontier record whose columns cover 0…nocc−1 gets D = 2 Σ_occ c cᵀ (f64) — up to 128 AOs (`DENSITY_AO` = `field.js` `MAX_MOL_AO`, asserted equal in the test). |
| the format's test | `tests/volumes-format.test.mjs`, `tests/fixtures/volumes/H2O.lwm` | water at `lab/molecules.js`' atoms, six rungs, made by the pipeline: parses, validates, opens through `chem.open` with 0 solver calls; STO-3G and 6-31+G* = the app's live RHF to **3.4e-13 Eh**; D decodes, Tr(DS) = 10 to 2e-7 (f32 C). 0.5 s. |
| HYGIENE | `.gitignore`, `lab/sw.js`, `tests/pwa.test.mjs`, `tools/build-deploy.mjs`, `tools/release-inputs.mjs`, `tests/field-owner.test.mjs`, `tools/gemma/verb-doc.mjs`, DATABASE `MAP/gen-map.mjs` | `lab/volumes` → `~/Documents/LAMBDAWAVES-VOLUMES/dist` is a git-ignored dev link that nothing walks or ships (details below). |
| THE PILOT | `tools/volumes/pilot.json`, `pilot.mjs`, `measure.mjs` | 31 molecules from the app's table and PubChem, solved and packed into `dist/vol-1`; the numbers below. |

## The basis ladder

| rung | file | elements | sha-256 | bytes | shells the app builds |
|---|---|---|---|---|---|
| STO-3G | sto-3g-v1.json | H–Kr | 22ce59b9ec99 | 112 427 | s, sp, d (Sc–Zn), spd (Ga–Kr) |
| STO-6G | sto-6g-v1.json | H–Kr | 67aa292ebbc0 | 158 991 | the same kinds as STO-3G |
| 3-21G | 3-21g-v1.json | H–Kr | 78f1bc5b7e13 | 139 098 | s, sp, d (Sc–Kr) |
| 6-31G | 6-31g-v1.json | H–Kr | 8e4749c35ca0 | 176 414 | s, sp, d (K–Kr) |
| 6-31G* | 6-31g-star-v1.json | H–Kr (H–Ca, Ga–Kr solvable) | 32db0683ee4c | 200 579 | s, sp, d; **f on Sc–Zn** (refused) |
| 6-31+G* | 6-31+g-star-v1.json | H–Ar | b38353af756b | 84 219 | s, sp, d |

- **The widening.** 6-31+G* went from H, C, N, O, F (`ddcbd84d…`, kept as `sha256_superseded`; the earlier H, O hash `fee4f992…` as
  `sha256_superseded_earlier`) to H–Ar. H, C, N, O, F `electron_shells` were compared element by element: identical. Every pinned
  energy is unchanged — `tests/md.test.mjs`, `tests/basis-631.test.mjs` (8 molecules to 2.6e-13), `tests/names.test.mjs`,
  `tests/molecule-state.test.mjs`, `tests/rhf-molecules.test.mjs` all green; the oracle fixture's provenance names the file it was
  computed on (`bse_sha256_computed_on`) and the widened one.
- **`basisFrom` needed no change.** Every shell in the five files is an sp/spd split or a single-l shell with one coefficient row
  per angular momentum (no general contractions in these Pople/STO records); d on K–Kr was already built (STO-3G). The one shell
  the app cannot hold is 6-31G*'s **f** on Sc–Zn: `md.js` refuses it by name ("l = 3 is beyond this engine's l ≤ 2", asserted in
  the ladder test) and the solver skips that rung with the reason. So a Sc–Zn molecule carries four rungs, a K, Ca or Ga–Kr
  molecule five, everything else six.
- **PySCF must keep every AO.** PySCF 2.14 drops overlap eigenvectors below 1e-6 by default (`scf.hf.remove_overlap_zero_eigenvalue`).
  STO-6G's spd shell on Ga–Kr is near-dependent (the Cartesian 3d's r² component duplicates the 3s: S's smallest eigenvalue 8.5e-7
  in HBr, 7e-4 in STO-3G), so PySCF solved a 19-function space for HBr's 20 AOs and landed 57 mEh above the app (GeH₄, AsH₃, H₂Se:
  17–48 mEh). Every integral agreed to 1e-13; with the flag off the energies agree to 1e-11. The solver and the oracle both set
  `scf.hf.remove_overlap_zero_eigenvalue = False` — the same variational space as `lab/md.js`, and a square C (`ground.cols` =
  every AO needs one). The smallest overlap eigenvalue of every rung is recorded (`solve.minEigS`).
- **The ladder's four new files are DATA**, not precache: they are needed only to open a volume rung (675 KB the live card never
  asks for), and precaching them pushed the install to 8.36 MiB, over the 8 MiB ceiling. `sw.js` DATA is now `library/`,
  `volumes/` and those four paths; the install is 7.71 MiB. A volume installer stores them in `lw-data-v1` beside the volume.

## The pipeline, as built

```
node tools/volumes/pilot.mjs                       # (the pilot only) pilot.json → catalogue/pilot.candidates.json via PubChem PUG REST
nice -n 19 ~/.local/share/lw-volumes/venv/bin/python tools/volumes/solve.py --candidates <file> [--app ids] [--guess-study]
node tools/volumes/pack.mjs --candidates <file> --volume vol-1 --numeral I [--incremental]
node tools/volumes/measure.mjs --volume vol-1      # the tables below
```

- **solve.py** (`--threads` ≤ 10, `--max-memory` ≤ 12000 MB; it renices itself to 19). Queue = every candidate, ordered by Σ_rungs
  nAO⁴ (the ERI work). Per rung: PySCF on the vendored decimals (`lwbasis.pyscf_basis`, frontier.py's construction), cart=True,
  every AO, RHF, conv_tol 1e-9, conv_tol_grad 1e-6; the first rung from minao, every later rung from
  `project_dm_nr2nr(previous rung)` (recorded as `guess`). Convergence: DIIS (100) → DIIS + 0.5 Eh level shift (150) → newton (60);
  none converged = `failed` with the reason and every attempt, never written as converged. An aufbau closed shell is asserted.
  The npz holds ε, C already in the app's AO order and normalisation (`lwbasis.conversion` = frontier.py's), occ, E, E_nuc, the
  dipole (Debye, origin 0), Mulliken charges, the AO labels in app order, the permutation and the row scale. A resumed molecule
  rebuilds the projected guess from its last npz. Two solvers on one queue: each `flock`s `raw/<id>/.lock` (released by the kernel
  if a process dies — no stale locks) and takes the next unlocked molecule; proved with two processes on 14 molecules: 84 rungs, none
  solved twice. SIGTERM: a `Stop` exception unwinds, nothing half-written (tmp + rename; leftovers swept on the next lock), the
  molecule resumes at its next rung — proved with `timeout -s TERM` mid-ladder.
- **pack.mjs** builds every rung with the app's own `basisFrom` (its hash is `ground.hash`, which `chem.open` checks), `oneElectron`
  for S and the dipole matrices, `nuclearRepulsion`, `names.js` (`nameOrbitals` with the app's declared group; if the projection is
  not reliable, the C1 indices-only form with the reason) and `latex-state.js` `stemOf`. The record is buildFrontier's shape with
  every column; `page` is NOT stored (nothing reads a record's page; `moleculeLatex` derives it from the ground). It then parses its
  own bytes back with `lab/volumes-format.js`, validates every rung and opens it through the worker's `chem.open`. No clock enters a
  `.lwm`, `index.json` or `volumes.json` (`built` is the generator's commit; `header.source.metaSha256` is the raw meta's digest with
  the solver's clocks stripped, which is what `--incremental` compares). Same raw → same bytes (checked with `cmp`).

## THE PILOT — measured

PILOT_TABLES

## The long run (the integrator starts it after the catalogue lands)

Not started here (the brief: the integrator starts it once `catalogue/vol-1.candidates.json` has landed). From the checkout:

```
cd /home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/optimization-2026-09-24/.claude/worktrees/it004-vol
nohup nice -n 19 ~/.local/share/lw-volumes/venv/bin/python tools/volumes/solve.py \
  --candidates ~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.candidates.json --threads 10 --max-memory 12000 \
  >> ~/Documents/LAMBDAWAVES-VOLUMES/raw/solve.out 2>&1 &
echo $! > ~/Documents/LAMBDAWAVES-VOLUMES/raw/solver.pid        # stop it with: kill -TERM $(cat …/solver.pid) — never pkill
```

- **Watch:** `~/Documents/LAMBDAWAVES-VOLUMES/raw/STATUS.json` (done / failed / refused / remaining, per-rung seconds, `etaSeconds`
  from the measured rate) and `raw/solve.log`; `python tools/volumes/solve.py --candidates … --status` rewrites STATUS without solving.
- **Stop / resume:** SIGTERM (or Ctrl-C) at any moment; the same command resumes at the next unfinished rung of the same molecule.
- **A second solver** on the same queue: the same command again (split the threads, e.g. `--threads 5` each — the machine is shared);
  the per-molecule lock keeps them apart.
- **Pack** (any time, as often as wanted; only finished molecules unless `--partial`; `--incremental` keeps the untouched):
  `node tools/volumes/pack.mjs --candidates ~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.candidates.json --volume vol-1 --numeral I --incremental`
  then the thumbnails (PLAN step 4, `tools/menu-thumbs.mjs --volume vol-1`, not this row's).
- **Retry** a failed rung: add `--retry-failed`. Keep the catalogue's ids stable: an id is a file name and the resume key.
- Do NOT pass `--guess-study` on the long run: it solves every projected rung twice.

## Where the spec was corrected or decided

1. **6-31G* is not H–Kr for the app.** BSE's 6-31G* gives Sc–Zn one **f** shell; `lab/md.js` (integrals, the field, names) is
   l ≤ 2. Decided: vendor the file whole (verbatim), let `md.js` refuse the f shell by name, and skip that rung for Sc–Zn (the
   solver records the reason). A Sc–Zn molecule carries four rungs (no 6-31G*, no 6-31+G*), K/Ca/Ga–Kr five, the rest six. Adding f
   to the engine is its own row (integrals, `fieldShells`, the WGSL kernels, names' D(R) on f).
2. **PySCF keeps every AO** (`scf.hf.remove_overlap_zero_eigenvalue = False`) — the spec said nothing; PySCF's default changes the
   variational space (and C's shape) wherever S has an eigenvalue < 1e-6 (STO-6G Ga–Kr already; big diffuse 6-31+G* molecules
   later). Recorded per rung as `solve.minEigS`.
3. **conv_tol_grad 1e-6** beside the spec's conv_tol 1e-9 (PySCF's default would be 3e-5): ε to ~1e-6 Eh. The declared groups still
   name every rung (H₂O, NH₃, CH₄, C₆H₆, HBr, TiCl₄, glycine, urea: all six/five/four rungs in their full group; pyridine C₂ᵥ at
   STO-3G–3-21G and its declared Cₛ fallback from 6-31G up; alanine and every PubChem molecule are C₁ → the indices-only form).
4. **D in decodeRecord only up to 128 AOs** (`DENSITY_AO` = `field.js` `MAX_MOL_AO`). The spec says every frontier record whose
   columns cover the occupied set; but chemview takes the D road whenever D exists, and the D road's χ tile stops at 128 AOs — a
   400-AO rung with a D would stop drawing. Past 128 the FACTOR road (ρ = 2 Σ φ², as C₆₀ already does, ≤ 768 AOs, ≤ 192 occupied)
   draws DENSITY exactly; C₆₀ is unchanged. Most volume rungs past STO-3G of a drug-sized molecule are > 128 AOs, so in the app
   DIFF/ESP/FLOW (which need D) are offered only on the smaller rungs.
5. **The reader is `lab/volumes-format.js`** (the brief's name); PLAN.md's `lab/volumes.js` is left for the store/Picker row. API:
   `parseLwm(bytes) → { header, blob(basis, key), bytesOf(desc) }` (blob takes the rung and key — names are per rung),
   `rungs(lwm)`, `rungRecord(lwm, basis)`, and `encodeLwm(header, data)` (the packer writes with the same module).
6. **Format details the spec left open**: a blob descriptor is `{ dtype, offset, length }` with `length` in ELEMENTS; placeholders
   are rung-relative `{ $blob: 'eps' }`; the header adds `skipped` / `failed` maps (basis → reason) and `source` (`metaSha256`, the
   packer version — `--incremental`'s key); `meta` = every candidate field (minus the atoms) plus name, plain Hill formula, formulaM,
   heavy, nAtoms, mass, pointGroup (declared, else PySCF's `topgroup` at its default tolerance) and a precision line; each rung has
   `solve` (solver, tolerances, cycles, guess, attempts, minEigS) and `check` (orthonormality, electrons, dipole Δ, E_nuc Δ, the app
   basis hash). The record's `page` is not stored (nothing reads it; `moleculeLatex` derives it). Mulliken charges are an f32 blob.
7. **No clocks** in a `.lwm`, `index.json`, `volumes.json`: `built` is `{ generator, commit }`, not a date. Dates a CANDIDATE carries
   (`identifiersChecked`, its `sources`) are copied as data, as the spec asks for every candidate field — they come from the
   catalogue, not from the packer's clock, and the bytes stay a function of the inputs.
8. **The ladder's four new basis files are DATA** (not precached) — the precache would otherwise pass its 8 MiB ceiling (8.36 MiB).
9. **The walkers**: `lab/volumes` is skipped by `tests/pwa.test.mjs` (a symlink to a DATA root is never followed or listed),
   `tools/build-deploy.mjs` and `tools/release-inputs.mjs` (`assertPublicTree(root, { devLinks: ['volumes'] })` — only that
   top-level name, only as a link; any other link still fails, pinned in `tests/release-inputs.test.mjs`), `tests/field-owner.test.mjs`
   and `tools/gemma/verb-doc.mjs` (lstat: links not followed), and — outside this worktree — the DATABASE map generator
   (`DATABASE/CLAUDE/APPS/LAMBDAWAVES/MAP/gen-map.mjs`, `volumes` added to its SKIP). `tests/wiring.test.mjs`, `tools/rack-deps.mjs`,
   `tests/access.test.mjs` and `tests/helpers/app-source.mjs` already did not follow it. Proved: `node tests/pwa.test.mjs --write`
   lists nothing under `volumes/`; `node tools/build-deploy.mjs` passes with the link present and `dist/` has no `.lwm`.
10. **Charged molecules**: the dipole is taken about the origin (PySCF's and the app's convention), so it is origin-dependent; the
   app's dipole is the record's `ground.dipole` (a.u.) and must equal PySCF's to 1e-6.
11. **An `app` candidate** may carry atoms (the pilot writes `lab/molecules.js`' exact bohr) or only `app: id` (the solver then asks
   `tools/volumes/app-atoms.mjs`, keeping the candidate's other fields). Ids are file names: `[A-Za-z0-9._+-]`, ≤ 80.
