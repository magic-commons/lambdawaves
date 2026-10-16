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

## K2 · THE METHOD (`lab/chemview.js` +38, `lab/status.js` +3, `lab/verbs.js` +1; one-line seams in `statesview.js`, `windows/molecules.js`, `main.js`, `project-store.js`)
- **METHOD seg RHF · UHF · LDA beside BASIS.** UHF shows only on H₂ in STO-3G (0.7.1 U2's H₂-only seg folded in); on an open shell the RHF button reads UHF
  and LDA is disabled. LDA is offered only on closed shells, in STO-3G, never record-only, with nAO ≤ 36 (benzene and smaller: the AO table is 78 MB there and
  the solve 4.8 s); otherwise its button is disabled with the reason as its tooltip and a held LDA falls back to RHF with the reason on the status line. LDA
  always solves live (`chem.ground { model: 'lda' }`); the record road is RHF-only now (before, H₂'s UHF could in principle have answered from an RHF record).
  A METHOD press is a hand pick: the head reads "RKS LDA/STO-3G · E = −74.732041".
- **Both solves are kept**, so RHF ↔ LDA re-lands without a worker call. **VIEW Δ LDA−RHF**: a signed view, M = D_LDA − D_RHF from the two f64 density
  matrices, lit only when both solves of the molecule are kept; a project, the demo or the verb opening on it with one half missing solves the other half
  quietly (benzene blocks the worker ≈ 4.8 s there; where LDA is not offered the view falls back to DENSITY).
- **Stand-downs under LDA:** KICK · RUN · FLOW · PULSE · TDA · VIBRATE disabled, each with the worker's own sentence as its tooltip; `kick()` and `vibrate()`
  return null and print the sentence; MO-REGISTRY's ladder request carries the method and is refused with the TDA sentence; the drive needs the ladder, so it is
  refused through it. VIBRATE stands down under UHF too (the worker already refused it).
- **Status and caption:** "RKS LDA · NUMERICAL · energy agrees with PySCF to 3e-14 Eh · ∫ρ = 10.000001 · picture good to 0.2 % of ρmax" — the plan's "PySCF
  4e-7" was a guess and is replaced by the measured agreement; a molecule outside K1's eight has no PySCF number in `lab/` and reads UNCHECKED with ∫ρ still
  printed. Caption piece "Δ LDA−RHF · where LDA puts more density · RKS LDA · PySCF 3e-14". The fold's readout E_xc · ∫ρ with grid points, grid ms, SCF
  iterations and ms.
- **Saving:** `presentation()` writes `method: 'lda'` only for LDA (`load()` restores it; `docs/STATE-SCOPES.md` one row); H₂'s UHF stays in `h2.method`, so BREAK
  and the 0.7.1 files keep their bytes. **Verb:** `molecule` gains `method` (rhf | uhf | lda) and `view: dlda`; the inventory prints the model, E_xc and ∫ρ.
  **Demo LDA:** water, METHOD LDA, VIEW Δ LDA−RHF, saved by the app's own road, cover by `make-covers`; STARTERS eleven.
- **Checked:** water in headless Firefox — LDA solve 215 ms wall (grid 66 ms over 67,950 points, SCF 128 ms in 7 iterations), E = −74.732041018 Eh vs PySCF
  3e-14, E_xc = −8.875980; Δ LDA−RHF spans −0.00659 … +0.00996 a.u. (48³ cell centres). chem.browser 0 failing of 56; status-probe 18 PASS; project-formats green
  with LDA seeded; molecule-head, status, uhf tests green; serialize-bytes 11/11 identical to the base. `molecular-session.js` needed no change.

## The light check (existing gates only) and the cut
- Node gate 0 after each merge; `pwa --write`; `new-project --check` in step; `rack-deps --classes` holds; rks · uhf · scf · rhf-molecules · project-formats · molecule-head · status green;
  `tests/opener.browser-test.mjs` once on the merged tree (eleven covers); THE LOCK ×2 at the merge tip with `--query gastab=0` on BOTH runs — results in the HANDOFF §2 block of the cut.
- **Lines:** 29,324 → 29,479 (+155 = K1 +109, K2 +44, sw rows; cap 29,617).

## Known, deferred (recorded)
GGA (PBE) and hybrids, TDDFT and RT-TDDFT, the LDA Hessian and vibrations under LDA, UKS for the open shells, 6-31+G* under LDA, a grid-level knob; the
V_xc build's speed (a blocked or screened evaluator is a later, measured row).
