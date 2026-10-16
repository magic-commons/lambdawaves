# 0.7.3-alpha "Kohn–Sham" — what changed (Claude Yan / Fable 5.1, integrating Claude Sos's plan, 2026-10-15/16 night)

The engine plan's D.10. Plan `BUILD-PLAN.md` (Sos, 21:49; base and cap filled by Yan at the 0.7.2 cut: 29,324 lines, cap 29,617). Two Opus builders: K1 from
`c61087b` (branch `k1-lda`, tip `2dc54fd`), K2 from K1's merge. Build notes: `K1-BUILD.md`, `K2-BUILD.md`. Josh 22:05: "let's continue onwards with the plan
to 0.7.3."

## The shape
Kohn–Sham is ANOTHER D. The RKS loop is the closed-shell loop with one change of Fock — F = h + J[D] + V_xc[ρ], built as `fockReal(D) + ½·exchange(D) + Vxc`
so the RHF Fock and loop stay byte for byte (U1's law; `tests/uhf.test.mjs`, `tests/scf.test.mjs` hold it). LDA only: Slater exchange (α = 2/3) + VWN5
correlation (A = 0.0310907, b = 3.72744, c = 12.9352, x₀ = −0.10498 — PySCF's `vwn`), on a molecular grid built in the chem worker: Becke's 1988 partition
(three smoothing iterations, no size adjustment) × Treutler–Ahlrichs M4 radial (75 points, PySCF's per-element ξ — not the Bragg radius, a builder's
correction) × Lebedev-302 (the table `lab/lebedev-302.json` generated from PySCF's own set by `tools/library/lebedev-302.py`). The AO values at the points
come from the worker's f64 evaluator — the same AOs the field draws. The STATUS says what the grid gives: ∫ρ is the measured number, never hidden.

## K1 · THE LDA ENGINE (`lab/scf.js` +58, `lab/dft-grid.js` +33 new, `lab/rhf-molecule.js` +12, `lab/mathworker.js` +6)
- `molecularGrid(atoms, { radial = 75, lebedev = 302 })` → { x, y, z, w }; the point count equals PySCF's atoms × 75 × 302 (water 67,950; PySCF prints 67,952
  because it pads to a multiple of 8). `slaterVwn(rho)` → { exc, vxc }; `rks(basis, …)` with the AO table (points × AOs, f64) built once per molecule; E = Σ D(h
  + J/2) + E_xc + E_nuc; `tol` 1e-10 (the grid's sums stall the residual near 1e-11: water took 33 iterations at 1e-12 and 7 at 1e-10, 2e-13 Eh apart).
- `moleculeRHF({ model: 'lda' })` → `rks` from the SAD guess; the return carries `model: 'RKS LDA'`, `exc`, `intRho`, `gridPoints`, `gridMs`, `iterations`;
  `stability` null, `solutions` []. The worker keys an LDA solve apart (`… |LDA`), so RHF and LDA of one molecule never answer for each other; TDA/states,
  the drive, RT and VIBRATE refuse under LDA with one sentence each ("… its operators are RHF's"), as `{ refused }`.
- **Oracle:** `tools/library/rks-oracle.py` (PySCF 2.14 RKS `lda,vwn`, cart=True, `atom_grid=(75,302)`, `prune=None`, `radii_adjust=None` — the plan's
  "grids.level" is a pruned, size-adjusted grid and is NOT ours) → `tests/fixtures/oracles/rks-v1.json` for water, benzene, N₂, CH₄, NH₃, HF, CO₂, C₂H₄.
- **Checked (`tests/rks.test.mjs`, 4 laws, 7.5 s):** E ours vs PySCF ≤ **9e-13 Eh on all eight** (gate 1e-6); E_xc to 2e-9; ∫ρ within 1e-4 (benzene 42.000032,
  CH₄ 10.000026); water's RHF D byte-identical through the untouched loop; the grid's weight law. serialize-bytes 11/11 identical against the base.
- **Speed and memory, as measured (node):** water 0.3 s for the LDA ground state (grid + AO table 47 ms); benzene **4.8 s** (one V_xc build 0.42 s, not the
  plan's 40 ms; grid + table 479 ms). AO screening saved 15 % and point-blocking nothing — neither kept. The AO table is 3.8 MB for water and 78 MB for
  benzene (≈ 200 MB at 60 AOs), so K2 caps LDA by molecule size and never offers it on a record-only molecule.

## K2 · THE METHOD
(filled at K2's merge)

## The light check (existing gates only) and the cut
(filled at the cut)

## Known, deferred (recorded)
GGA (PBE) and hybrids, TDDFT and RT-TDDFT, the LDA Hessian and vibrations under LDA, UKS for the open shells, 6-31+G* under LDA, a grid-level knob; the
V_xc build's speed (a blocked or screened evaluator is a later, measured row).
