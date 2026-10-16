# 0.7.3 "Kohn–Sham" — THE BUILD PLAN (Claude Sos / Fable 5.1, drafted 2026-10-15 21:49 while 0.7.2 builds; base and cap filled at the 0.7.2 cut)

The engine plan's D.10 (`../release-0.6.0/PLAN.md` l.281; the ladder row l.40: "the same molecules under LDA beside RHF, each with its PySCF number ·
MOLECULES › METHOD · tap LDA"; l.61: "Kohn–Sham (0.7.3, LDA first, PySCF RKS the oracle, ChronusQ cited not merged; your A4 'we should definitely go forward
with it')"; l.100: "Kohn–Sham = another D"). Josh's dial (09:35): tight builds, features only, pre-1.0. Base: `yan-c` at the commit carrying the briefs after
the v0.7.2-alpha cut (**TO FILL**); lines **TO FILL**; cap = lines × 1.01. Two rows; K2 after K1 merges.

## The shape (the law of this cut)
Kohn–Sham is ANOTHER D. The RKS loop is `scf.js`' closed-shell loop with one change of Fock: F = h + J[D] + V_xc[ρ] (no exact exchange), built as
`fockReal(D) + ½·exchange(D) + Vxc` so `fockReal` stays byte for byte (U1's law) and the Coulomb build is shared; E = Σ D(h + J/2) + E_xc[ρ] + E_nuc. LDA only:
Slater exchange (α = 2/3) + VWN5 correlation (PySCF's `lda,vwn` — VWN5, not VWN3/RPA; say which in the record); ρ(r) = Σ D_pq χ_p χ_q and V_xc's matrix
elements ∫ χ_p v_xc(ρ) χ_q on a molecular grid in the CHEM worker: Becke partition (the 1988 smoothing, three iterations, no atomic-size adjustment) × per-atom
Treutler–Ahlrichs M4 radial (75 points, the Bragg radius scaled per element as PySCF's default) × Lebedev angular (302 points, order 29 — the 302-point table
vendored once as `lab/lebedev-302.json`, 302 × 4 numbers, data not lines; its source cited). The AO values at the grid points come from the worker's f64
evaluator (`lab/molecular-field.js` `evaluator(shells)` — the same AOs the field draws). Grid once per molecule (≈ 23k points for water, 1.3 ms to build;
benzene 12 × 22,650 = 272k, the SCF's V_xc build ≈ 40 ms an iteration on 36 AOs — measured and printed). The STATUS says "RKS LDA · NUMERICAL · energy agrees
with PySCF to 4e-7 Eh · ∫ρ = 9.99998" — the grid's quadrature error is the number, never hidden. RHF ↔ LDA as the SIGNED view: Δρ = ρ_LDA − ρ_RHF through the
field's existing Δρ road (kind 'signed', M = D_LDA − D_RHF), "where LDA puts more density" in the caption. PySCF RKS `lda,vwn` on the same grid class is the
oracle (≤ 10⁻⁶ Eh water and benzene; ∫ρ = N to 10⁻⁴). No GGA, no hybrids, no TDDFT in this cut; the RT run, TDA, the drive and the register stand down under
LDA with a sentence (their operators are RHF's). ChronusQ cited in the note, never merged (GPL-2 vs GPL-3.0-only).

## The rows
| row | what lands | files | Δ lab |
|---|---|---|---|
| **K1 THE LDA ENGINE** (Opus) | **`lab/dft-grid.js`** (new, ≤ 45 lines): `molecularGrid(atoms, { radial = 75, lebedev = 302 })` → { x, y, z, w } (Becke weights × radial × Lebedev; Bragg radii H–Kr one line); `lab/lebedev-302.json` (vendored, cited: Lebedev & Laikov 1999, the 302-point set). **`lab/scf.js`** `rks(basis, { nElectrons, grid, aoAt, xc = 'lda', diis, maxIter, tol, guess })` (≤ 40 lines: the `rhf` loop with the Fock as the shape says; `slaterVwn(rho)` → { exc, vxc } (VWN5's six constants per the paper, paramagnetic only); V_xc by one pass over the grid with the AO values held as Float64Array(n × points) — built once; E_xc = Σ w·ρ·ε_xc; ∫ρ printed); the closed-shell road untouched to the bit. **`lab/rhf-molecule.js`** `moleculeRHF` takes `model: 'lda'` → `rks` with the SAD guess; the return carries `model: 'RKS LDA'`, `exc`, `intRho`, `gridPoints`, `gridMs`; stability/Hessian recorded null (an RHF Hessian is not the LDA one). **`lab/mathworker.js`**: `chem.ground { model: 'lda' }` keyed apart as UHF is (U1's seam at `ensureSolve`); the grid built in the worker from `evaluator(shells)`; RT/TDA/drive/states refuse LDA with a sentence. **Oracle + test**: `tools/library/rks-oracle.py` (`~/bin/scipython -I`; PySCF RKS `xc='lda,vwn'`, `grids.level` and `becke_scheme` matched to ours — print both grids' point counts; E, E_xc, ∫ρ for water, benzene, N₂, CH₄, NH₃, HF, CO₂, C₂H₄ → `tests/fixtures/oracles/rks-v1.json`); `tests/rks.test.mjs` (≤ 50 lines): E vs PySCF ≤ 1e-6 Eh (water, benzene), ∫ρ = N to 1e-4, water's RHF D byte-identical through the untouched loop, the grid's total weight = the molecular volume integral of 1 over a Gaussian (∫ e^{−r²} = π^{3/2} to 1e-6). | `lab/dft-grid.js`, `lab/lebedev-302.json`, `lab/scf.js`, `lab/rhf-molecule.js`, `lab/mathworker.js`, `tools/library/rks-oracle.py`, `tests/fixtures/oracles/rks-v1.json`, `tests/rks.test.mjs` | **≤ +130** |
| **K2 THE METHOD** (Opus, after K1 merges) | **`lab/chemview.js`**: a card-level **METHOD** seg `RHF · LDA` beside BASIS (the 0.7.1 H₂-only METHOD RHF · UHF folds into it: on H₂ the seg reads RHF · UHF · LDA; on an open shell RHF is UHF and LDA is disabled this cut); LDA asks `chem.ground { model: 'lda' }`; the head reads "RKS LDA/STO-3G"; the STATUS line (`lab/status.js`) as the shape says; VIEW gains **Δ LDA−RHF** (enabled when both solves of the same key exist; kind 'signed', M = D_LDA − D_RHF; the RHF solve kept beside the LDA one in the session so switching back is free); the stand-downs; the caption " · RKS LDA · PySCF 4e-7"; the fold's readouts show E_xc and ∫ρ and the grid's points/ms; `presentation()` carries `method` only when not RHF (default-absent; `docs/STATE-SCOPES.md` one row); the `molecule` verb's `method` arg; the LDA demo (water, METHOD LDA, VIEW Δ LDA−RHF — "where LDA puts more density") + cover, STARTERS +1. | `lab/chemview.js`, `lab/status.js`, `lab/molecular-session.js` (≤ 4), `lab/verbs.js`, `lab/demos/*`, `docs/STATE-SCOPES.md` | **≤ +55** |

## Laws for both builders
- Your own worktree, your own branch (`k1-lda`, `k2-method`) from the base commit (K2 from K1's merge); NO push; never edit `lab/mir/**` or `lab/fonts/**`;
  after any `lab/` edit `node tests/pwa.test.mjs --write` then `./test.sh node`. `node tools/rack-deps.mjs --classes`, `node tools/new-project.mjs --check`,
  `node tools/serialize-bytes.mjs` (default-absent keys), `node tests/uhf.test.mjs` (U1's byte-identity still holds) green before you report. PySCF: `~/bin/scipython -I`.
- THE LOCK is sacred: METHOD RHF = the picture byte for byte (no field write, no grid built); the integrator runs it ×2 at the merge with `--query gastab=0` on BOTH runs.
- Line budgets are the table's; count `find lab -name '*.js' -not -path 'lab/mir/*' | xargs cat | wc -l`. One build note each: `research/release-0.7.3/K<n>-BUILD.md`
  (seats with file:line; K1: E and E_xc and ∫ρ per molecule ours vs PySCF with the gates, the grid's points and ms, the SCF's iterations and ms per molecule;
  K2: a headless screenshot's path of water's Δ LDA−RHF; what you dropped and why; Δ lines; branch and tip). Node only for the gates; ONE browser check each;
  never `pkill -f`; ports 9241, 9443, 8721/8741, 8731/8735 are taken.

## Gates (existing only) · the cut · deferred
Node gate 0 after each merge; `pwa --write`; `tests/rks.test.mjs`; `tests/chem.browser-test.mjs` once on the merged tree; THE LOCK ×2 (860 and 1004, 0/0); the line
law; then the local cut `v0.7.3-alpha` "Kohn–Sham" by the cut script's shape, CHANGELOG, snapshot. NO push, NO deploy, NO gh release. Deferred by name: GGA (PBE)
and hybrids, TDDFT and RT-TDDFT, the LDA Hessian and vibrations under LDA, UKS for the open shells, 6-31+G* under LDA in the oracle, a grid-level knob.
