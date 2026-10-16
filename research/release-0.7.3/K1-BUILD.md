# 0.7.3 K1 THE LDA ENGINE — build note (Opus builder, 2026-10-15)

Branch `k1-lda` off `c61087b` (`yan-c`). Not pushed, not merged. Engine commit `3deba2d`; the tip is the commit that carries this note (`git log -1 k1-lda`).

**Δ `lab/` = +109** (29,324 → 29,433 by the plan's count; budget +130, cap 29,617). By file: scf +58 · dft-grid +33 (new) · rhf-molecule +12 · mathworker +6 (13 in, 7 out).
`lab/lebedev-302.json` is data (23 KB, 1208 numbers, not counted); `lab/sw.js` is the pwa refresh.

## The result: PySCF to 1e-12 Eh on all eight, not just water and benzene

The grid is PySCF's grid, point for point, so what is left is arithmetic. All eight molecules agree with PySCF RKS `lda,vwn` to **≤ 9e-13 Eh**, a million times inside the 1e-6 gate.
`tests/rks.test.mjs` holds all eight at 1e-6 (E and E_xc) and ∫ρ = N at 1e-4. Node 22, this machine. "grid ms" counts the grid and the AO table (Float64Array(points × n)) together, both built once per molecule.
"SCF ms" is the whole solve minus the integrals and the grid. A build is one V_xc pass plus one Fock build.

| molecule | AO | E ours | E PySCF | ΔE | E_xc ours (Δ) | ∫ρ (N) | points ours / PySCF (nonzero) | grid ms | SCF it | SCF ms | integrals ms |
|---|---|---|---|---|---|---|---|---|---|---|---|
| H2O | 7 | -74.7320410183 | -74.7320410183 | 2.8e-14 | -8.87598029 (-2.8e-10) | 10.000001 (10) | 67950 / 67952 (67844) | 47 | 7 | 227 (28/build) | 16 |
| C6H6 | 36 | -227.2627153505 | -227.2627153505 | -6.5e-13 | -32.62448883 (3.0e-12) | 42.000032 (42) | 271800 / 271800 (271048) | 479 | 8 | 3764 (418/build) | 558 |
| N2 | 10 | -107.1478454634 | -107.1478454634 | -7.0e-13 | -12.78376558 (-3.9e-13) | 14.000002 (14) | 45300 / 45304 (45248) | 26 | 5 | 92 (15/build) | 6 |
| CH4 | 9 | -39.6168476293 | -39.6168476293 | -5.7e-13 | -6.51266853 (2.0e-9) | 10.000026 (10) | 113250 / 113256 (113034) | 52 | 6 | 225 (32/build) | 7 |
| NH3 | 8 | -55.2901796386 | -55.2901796386 | -1.4e-14 | -7.59886136 (3.5e-11) | 10.000001 (10) | 90600 / 90600 (90559) | 35 | 8 | 188 (21/build) | 4 |
| HF | 6 | -98.2458409896 | -98.2458409896 | 2.8e-14 | -10.31914899 (-1.9e-9) | 10.000000 (10) | 45300 / 45304 (45244) | 12 | 20 | 146 (7/build) | 2 |
| CO2 | 15 | -184.5641630932 | -184.5641630932 | -6.3e-13 | -21.17158289 (1.6e-9) | 21.999999 (22) | 67950 / 67952 (67842) | 34 | 24 | 600 (24/build) | 20 |
| C2H4 | 14 | -76.8577717275 | -76.8577717275 | 8.7e-13 | -11.55439135 (-1.6e-11) | 16.000002 (16) | 135900 / 135904 (135652) | 86 | 7 | 351 (44/build) | 23 |

- **Point counts.** Ours is natm × 75 × 302. PySCF's `weights.size` is ours plus its alignment padding to a multiple of 8 (zero weights at 1e-4 bohr). Its "nonzero" count is lower because its C Becke code underflows deep-core weights to exactly 0, where ours keeps them as tiny numbers.
- **∫ρ is the grid's own number**, the quadrature error in plain sight: benzene 42.000032, CH₄ 10.000026. Tr(DS) = N exactly.
- **The E_xc Δ of 1e-9** (CH₄, HF, CO₂) is PySCF's SCF stopping point (its `conv_tol_grad` 1e-8), not the functional. The total energy is stationary, so it agrees to 1e-12 anyway.
- **The grid's weight law.** On water's grid ∫e^{−|r−c|²} = π^{3/2} to 1.2e-7 about the origin and 4.6e-8 about the oxygen. About benzene's empty ring centre, 2.6 bohr from any nucleus, it is off by 4e-3: a quadrature built from atoms does not integrate a narrow Gaussian centred where there is no atom. So the test uses water.
- **Speed.** A V_xc pass costs n²·points multiply-adds, about 1 GFLOP/s in plain JS: 0.42 s per build for benzene (36 AOs, 272k points), not the plan's 40 ms. Two things were measured and rejected as not worth their lines. AO screening (|χ| < 1e-10 skipped) saves 15 %, because STO-3G valence AOs reach across the molecule. Point-blocked AO-major dot products save 0 %: the loop is bound by compute, not memory. The whole benzene LDA ground state takes 4.8 s in node. Water takes 0.3 s.

## The VWN constants used (`lab/scf.js:169–178`)
Slater exchange with α = 2/3: ε_x = −¾(3ρ/π)^{1/3} and v_x = (4/3)ε_x. **VWN5** correlation (Vosko, Wilk & Nusair, Can. J. Phys. 58, 1200 (1980): the Ceperley–Alder paramagnetic fit), in hartree with x = √r_s:
**A = 0.0310907, b = 3.72744, c = 12.9352, x₀ = −0.10498**, and the derived Q = √(4c − b²), X(x) = x² + bx + c, v_c = ε_c − (x/6) dε_c/dx.
PySCF's `'lda,vwn'` parses to libxc ids (1, 7): LDA_X + **LDA_C_VWN = VWN5**. The oracle asserts this. The trap is real but sits on the other side: PySCF's alias `'VWN3'` maps to id 8, LDA_C_VWN_RPA. Our VWN5 agreed on the first run, so no hunt was needed.

## Seats
- **`lab/dft-grid.js`** (new, 33 lines). The JSON import is l.4, the pattern `lattice-model.js` already ships in the worker. `XI` (Treutler's ξ, H–Kr) is l.5. `molecularGrid(atoms, { radial = 75, lebedev = 302 })` is l.8 → `{ x, y, z, w }`. It holds TA M4 r = −(ξ/ln 2)(1+x)^0.6 ln((1−x)/2) with PySCF's dr, 4πr²dr × the Lebedev weight, and Becke's three-fold smoothing (3 − μ²)μ/2 with no size adjustment.
- **`lab/lebedev-302.json`**: `{ source, xyzw }`, written by `tools/library/lebedev-302.py` from `pyscf.dft.LebedevGrid.MakeAngularGrid(302)` (weights sum to 1, |r̂| = 1 to 2e-16).
- **`lab/scf.js`**: `slaterVwn` l.173, the constants l.172, `rks` l.184. Its Fock is `fockReal(D) + ½·exchange(D) + V_xc` at l.200. Its energy is Σ ½D(h + G + ½K) + E_xc + E_nuc, its DIIS is rhf's, and so is its round-off floor (tol 1e-10). `rhf`, `fockReal`, `exchange` and `uhf` are untouched; the diff is append-only.
- **`lab/rhf-molecule.js`**: the imports l.10–12; the `model === 'lda'` branch l.230 (before the UHF branch). It refuses multiplicity ≠ 1 and builds the grid and AO table from `evaluator(b.shells)` (the field's f64 AOs). It runs `rks` from plain SAD and returns `{ …rks, model: 'RKS LDA', C (canonical), exc, intRho, gridPoints, gridMs, stability: null, hessian: null, aufbau: null, solutions: [], dipole, electrons }`.
- **`lab/mathworker.js`**: `standDown` l.208. The key l.236–238: `base` + `'|LDA'`, and LDA with multiplicity > 1 is a Refused. The past-cap check reads `base` (l.242). The model passes at l.251. The ground's LDA fields are at l.260. The stand-downs: ensureSpectrum l.294 (chem.spectrum / solve / states / state.vectors), chem.drive.init l.401, chem.vib.frames l.580, chem.rt.init l.611.
- **`tools/library/rks-oracle.py`** → `tests/fixtures/oracles/rks-v1.json`. It reads the atoms from `lab/molecules.js` through node and our point count and grid ms from `lab/dft-grid.js`. The basis is the vendored STO-3G and its sha-256. The grid is `atom_grid (75, 302)`, `radi.treutler`, `original_becke`, `radii_adjust None`, `prune None`; tolerances are conv_tol 1e-13 and grad 1e-8.
- **`tests/rks.test.mjs`** (50 lines). It holds four things. (1) The weight law. (2) The eight against PySCF: E and E_xc ≤ 1e-6, ∫ρ ≤ 1e-4, point counts, stability and Hessian null. (3) THE LOCK: water's RHF D sha and E, uhf.test's numbers. (4) The worker: RHF → LDA → RHF on one key keeps them apart; TDA, RT and the drive refuse an LDA solve with their sentence; an open shell under LDA is refused.

## Corrections to the brief / plan
1. **"The Bragg radius scaled per element as PySCF's default" is not what PySCF does for this grid.** PySCF 2.14's `radi.treutler` scales the M4 map by **Treutler–Ahlrichs' ξ** (JCP 102, 346, Table: H 0.8, C 1.1, N/O/F 0.9 …). This is `ATOM_SPECIFIC_TREUTLER_GRIDS = True`, the default since 2.7. Bragg radii enter only through `radii_adjust`, the atomic-size adjustment that the plan turns off. So there is no Bragg table: the one line is ξ for H–Kr. PySCF's own comment says ξ moves totals by about 1e-6 per atom, which is why matching it matters at a 1e-6 gate.
2. **"PySCF's `grids.level`" is not the match.** Level 3 means pruned NWChem grids with Treutler size adjustment. The oracle instead sets `atom_grid = (75, 302)`, `prune = None`, `radii_adjust = None`. That is the plan's grid, and PySCF builds it point for point.
3. **tol.** `moleculeRHF`'s default tol of 1e-12 is below what the grid's sums can reach: water's residual floors near 1e-11 and the SCF ran 33 iterations to the stall test. The LDA branch uses `rks`'s 1e-10, which converges in 7 to the same energy (Δ 2e-13).
4. **Speed**: 0.42 s per V_xc build on benzene, not 40 ms (see above). Nothing was dropped for it.
5. **"One sentence each"** is read as one sentence per road: TDA + register, the drive, RT, VIBRATE. An open shell keeps U1's `OPEN`.

## Dropped, and why
- Screening and blocking of the V_xc pass were measured at 15 % and 0 % gains (above), so neither shipped.
- An iPad timing: no browser check was needed for K1. The worker numbers above are node's. K2's one browser check can print `ground.gridMs` and `timings.scf` on the device.
- `stability` and `hessian` are null, `solutions` is [] and `aufbau` is null under LDA, as the plan says. An LDA Hessian is deferred.

## Gates run (at `3deba2d`)
`node tests/pwa.test.mjs --write` then `./test.sh node`: **rc 0** (1061 PASS/GREEN lines, `rks.test.mjs` among them) · `node tests/rks.test.mjs` PASS ×4 (7.5 s) · `node tests/uhf.test.mjs` PASS ×3
(THE LOCK holds) · `node tests/scf.test.mjs` PASS · `node tests/rhf-molecules.test.mjs` OK · `node tools/rack-deps.mjs --classes` rc 0 · `node tools/new-project.mjs --check` in step ·
`node tools/serialize-bytes.mjs` (served on 9381, GD 5481, own pids stopped): **11 readings byte-identical to the base `c61087b`** (`git archive` of it served the same way).

## For K2 THE METHOD (the seams)
- **The op.** `chem.ground { atoms, basis, charge, model: 'lda' }`. With `multiplicity > 1` (or `model: 'uhf'`) it answers `{ refused: 'LDA is closed-shell in this cut: an open shell is UHF …' }`.
- **The reply** is chem.ground's own: `eps`, `C` (canonical KS orbitals), `D`, `shells`, `probe`, `names`, `dipole`, `electrons`, `timings.scf` (the whole ground wall, grid included) and `timings.integrals`. It adds `model: 'RKS LDA'`, `exc`, `intRho`, `gridPoints`, `gridMs` (grid plus AO table) and `iterations`. `stability` is null, `solutions` is [], and there is no `Ds`.
- **The cache.** The worker holds ONE solve. The LDA key is `keyOf(basis, charge, atoms) + '|LDA'`, so RHF and LDA solves of one molecule never answer for each other. Switching back and forth re-solves in the worker. For "switching back is free" and Δ LDA−RHF (M = D_LDA − D_RHF), the frame thread (the session) must keep both replies' `D`. A past-cap record is refused under LDA through `base`, but with the "another open replaced it" sentence, so the card should not offer LDA on a record-only molecule.
- **The refusals** (`{ refused }`, never `error`):
  - `chem.spectrum` / `chem.solve` / `chem.states` / `chem.state.vectors`: "TDA and the register stand down under RKS LDA: their operators are RHF's"
  - `chem.drive.init`: "the drive stands down under RKS LDA: its operators are RHF's"
  - `chem.rt.init`: "RT stands down under RKS LDA: its operators (the TDHF Fock build) are RHF's"
  - `chem.vib.frames`: "VIBRATE stands down under RKS LDA: its modes and dD/dQ are RHF's"
- **Memory.** The AO table is points × n f64: water 3.8 MB, benzene 78 MB. A 20-heavy-atom molecule at 60 AOs would be about 200 MB, so K2's METHOD should cap LDA by size, as the live cap does for RHF.
- THE LOCK: no grid is built unless `model === 'lda'`. An RHF solve runs the base's code path, and water's and N₂'s D, C and E are the base's to the bit (`uhf.test.mjs`, `rks.test.mjs` §3).
