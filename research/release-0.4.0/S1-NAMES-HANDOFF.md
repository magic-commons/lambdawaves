# 0.4.0 S1 THE NAMES: hand-off (usage pause, 2026-10-07)

- **Worktree:** /home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-adbed8cf26d8e8216
- **Branch:** `s1-names`, from 58852c7. Nothing has been pushed, tagged or deployed.
- **Gate server:** pid 1728026 on port 8741, killed.
- **Tree:** clean. No uncommitted files and no half-done edits. This hand-off is the only new file.

## Commits

| sha | title | status |
|---|---|---|
| 777a4dc | 0.4.0 S1 N1 · THE NAMES: lab/names.js, the one service | done |
| 7b49926 | 0.4.0 S1 N2 · tools/orbital-names.mjs --check: every framework, the anchors, every molecule | done |
| ea125ec | 0.4.0 S1 N3 · the worker's names in the views, the copy and the exports | done |
| 04e86f4 | 0.4.0 S1 N4 · the demos learn their names; the N2 teaching moment | done |

**N1–N4 are all done.**

Not done:
- the REPORT.md section (waves 140–143). A heredoc append was refused by the harness, and nothing was written.
- `research/release-0.4.0/S1-NAMES-BUILD.md`.

## What landed

### `lab/names.js` (new, 497 lines)
- **Character tables.** Fifteen finite tables as data: C1, Cs, C2, C2h, C2v, C3v, D2h, D3h, D3d, Td, D5h, D5d, D6h, Oh and Ih.
  - The operations come from closure over generators and are classified by det, trace and axis.
  - Every table self-tests: row and column orthogonality, Σdim² = h, and the vector representation whole.
- **Linear molecules.** Dinfh and Cinfv are handled by fitting σ/π/δ at three angles, with a fourth angle as a check.
- **AO representation.** Sparse, with Cartesian d.
- **Labelling rules.** Levels are clustered at 2e-10 Eh. Labels are all or nothing. The frontier is named by level.
- **Exports:**
  - `forms` and `orbitalName`
  - `atomForms` and `stateName`
  - `coreCount`
  - `characters` (derived LCAO name for diatomics)
  - `CURATED_IE` and `ionisation`
  - `namesOf`

### Wiring of the names
- **`lab/molecules.js`:** a `symmetry` record for all 54 molecules.
- **`lab/mathworker.js`, `ensureSolve`:** sets `ground.names` and `timings.names`.
- **`lab/chemview.js`:**
  - the knob uses `orbitalName`
  - the ε readout shows the names
  - the local fallback also names its solve
  - adds `exportNames()`
  - `state().names` and `state().orbitalName`
- **`lab/orbitalsview.js`:**
  - rungs and lanes read `1b1 · HOMO`, with the lane's subscript in a `<sub>`
  - hover text from `about()`
  - the CORE fold: `.orb-core-toggle` plus a tap on the `core ×n` rung
  - `state().rungs` and `state().coreOpen`
- **`lab/latex-state.js`:** each level is written as `(1b_{1},\ \mathrm{HOMO})`, plus the configuration. `latexName` now reads `atomForms`.
- **`lab/hydrogen.js` and `lab/hamiltonian.js`:** the labels now come from `atomForms`.
- **`lab/statesview.js`:** uses `stateName`.
- **`lab/export3d.js`, metadata only:** the names go into the GLB extras, cube comment line 1 and the NPZ `meta.names`.
- **`lab/rack.js`, three small hunks, none on the camera or projection lines:**
  - the captureLayout `core` key
  - applying that key on load
  - one `names:` line in the exporter env

### Tests and tools
- New: `tools/orbital-names.mjs` and `tests/names.test.mjs`.
- Extended:
  - `tests/latex-state.test.mjs`
  - `tests/export3d.test.mjs`
  - `tests/latex-copy.browser-test.mjs`
  - `tests/molecular-names.browser-test.mjs`

### Demos
The notebooks of the three demos in `lab/demos/` now name their orbitals.

## Gates (all green at the tip)
- **Node:** `bash test.sh node` passes, 83 suites, exit 0. `tests/names.test.mjs` passes 5/5 blocks.
- **Browser** (8741/5209, one at a time):
  - molecular-names: green. Benzene is named in 4 ms in the worker.
  - chem: 0 failing of 54.
  - register: 0 failing of 17.
  - latex-copy: green. The named page pasted into the notebook gives 0 `.katex-error`.
  - export3d: green.
  - new-project: green.
  - current: green.
  - molecule-demos: green.
- **Names check:** `node tools/orbital-names.mjs --check --pyscf` exits 0.
  - All 52 enabled molecules are named; CuH and ZnH2 are disabled.
  - The 10 anchors MATCH `names-probe.json`.
  - PySCF `label_orb_symm` on water gives A1 A1 B2 A1 B1 A1 B2, a MATCH in the same frame.
  - The full output is in `.tmp/names-check.txt`, which is not committed. Regenerate it with the same command.

## Errors and findings
- **Butadiene geometry.** C4H6, "trans-1,3-butadiene", is built s-cis (C1 and C4 land on the same side). It is declared C2v as built and is not rebuilt, because the geometry is oracle-pinned.
- **Furan.** Approximate C2v at geomTol 1e-2 is refused: the core level has residual 5.6e-2. It falls back to exact Cs, and the record says so.
- **Pyridine.** Named in approximate C2v: residual 3.5e-3, framework 8.1e-4 bohr.
- **Worst residual on exact symmetry** across the 52: 5.8e-10 (SO2).
- **Blocked-projector road (Sol, Prop. 7).** Its leakage is 3.9e-15. It would not have been simpler here:
  - it needs a change to the SCF eigensolve
  - it needs full-group matching of E/T partners
  - the cluster-character road needed no change to the solver
- **`CURATED_IE` is UNCHECKED.** The values are the standard HeI band maxima, entered from memory. They need a check against NIST SRD 101, and the LEGAL-PROVENANCE reading, before any store build.
- **`lab/*.js` line count:** 35135 before, 35745 after (+610). `names.js` alone is +497. The four formatters now read one service, but the total grew. Report it that way.

## Exact next step
1. Append the REPORT.md section `## 2026-10-07 · 0.4.0 S1 — THE NAMES` with waves 140 (names.js), 141 (the check tool), 142 (the views, copy and exports) and 143 (the demos). Use the Write/Edit tool or a `.tmp` python script; a shell heredoc is refused.
2. Write `research/release-0.4.0/S1-NAMES-BUILD.md`:
   - the commits above
   - the gates above
   - the `--check` table from a fresh run of the tool
   - the timings: benzene at 4 ms in the browser and ≤10 ms cold in node
   - the line counts
   - the findings
   - the open items: verify the IEs; no O_h/I_h library molecule exists yet to exercise those tables; the furan geometry
3. Commit with `git commit -F <msgfile>`; inline messages containing backslashes are refused. End the message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never push.
