# Can MO symmetry names be derived from the live RHF/STO-3G solve? — probe, 2026-10-01

**Verdict.** Yes, for all ten molecules asked about: every one labels cleanly (every energy level is exactly one irrep, multiplicity residual <= 1e-14), and every textbook comparison MATCHES. The probe refuses by design where it should (controls below). It does **not** show that the 42 other solvable library molecules, the 6-31+G* basis or a browser build work (last section).

`node names-probe.mjs` (node 22.22.1, no dependencies, ~8 s, imports `lab/` by relative path, edits nothing) writes `names-probe.json` and prints the digest. Nothing under `lab/` was touched.

## What was run
1. **Live solve**: `moleculeRHF({ atoms: moleculeAtoms(id), basis: 'sto-3g', charge, record })` — the call `lab/mathworker.js` `ensureSolve` makes (SAD + core guess, Hessian, stability probe). Timed per molecule.
2. **Declare and verify.** Per molecule: frame built from the atoms (origin = centre of nuclear charge), point group and operations declared as 3x3 matrices in that frame, every operation checked as an atom permutation. Worst residual over all operations: **<= 5.0e-15 bohr** (0 for most; benzene 5.0e-15, NH3 1.4e-15). The geometries are the library's CCCBDB internal coordinates (r, angle: 2–5 significant digits) turned into Cartesians in double precision, so the point group is exact by construction, not by measurement. (Not true of every library molecule: the ring-walk builders close only to 3-4e-4 A, see last section.)
3. **AO representation M(R)**: atoms permute, s maps 1:1, p rotates by R (`M[(B,j),(A,i)] = R_ji`); STO-3G H–F is s and p only. Two acceptance checks on every operation: `MᵀSM = S` (worst 6.4e-16) and `MᵀFM = F` for the converged Fock matrix (worst 5.7e-14, benzene) — so M is a true symmetry of the solver's own operator.
4. **Clusters**: `clusterRanges(ε, 1e-8)`, the tolerance `canonicalOrbitals` uses. Cluster character `χ(R) = Σ_k C_kᵀ S M(R) C_k`; `n_Γ = (1/h) Σ_R χ(R) χ_Γ(R)` with C2v, C3v, Td, D2h, D6h tables as data (row **and** column orthogonality, Σdim² = h self-tested). Linear molecules: no table. χ(C_φ) at φ = 0.7 and 1.9 rad gives (n_σ, n_π) (a third angle, 2.9, is a check), χ(σ_v) the ±, χ(iC_φ) the g/u.
5. **Emitted per MO** (JSON): 1-based index, ε, occupation, cluster id and size, irrep, counted label (n-th level of that irrep, cores included; a degenerate set counts once), frontier name, residual, exactly-one-irrep flag, aliases. Per molecule: configuration string, timings, names-record byte size.

**Conventions.** C2v and D2h use Mulliken 1955: planar C2v has x perpendicular to the plane (H2O, H2CO in yz); D2h ethylene has z along C=C, x perpendicular (pi = b3u, pi* = b2g). Benzene: x through carbon 0, C2' through atoms (sigma_v contain atoms), C2'' through bond midpoints; with this the pi set is a2u + b2g + e1g + e2u. **Aliases** emitted: C2v with x↔y (b1↔b2): H2O gives (1a1)²(2a1)²(1b1)²(3a1)²(1b2)², HOMO 1b2; H2CO HOMO 2b1, LUMO 2b2. D2h ethylene in the xy plane with C=C along x: pi = 1b1u, pi* = 1b2g (along y: 1b1u, 1b3g). D6h with C2'/C2'' swapped (b1↔b2). Each alias was **checked by recomputing under the relabelled frame**: 5 of 5 identical.

## Results (names-probe.json is the authority; timings are node, this workstation)
| molecule | group | AO/occ | solve ms | label ms | record B min / full | computed configuration (occupied) | HOMO / LUMO | worst residual |
|---|---|---|---|---|---|---|---|---|
| H₂O | C2v | 7/5 | 40 | 3.0 | 245 / 2699 | (1a1)²(2a1)²(1b2)²(3a1)²(1b1)² | 1b1 / 4a1 | 2.4e-15 |
| NH₃ | C3v | 8/5 | 26 | 1.5 | 202 / 1934 | (1a1)²(2a1)²(1e)⁴(3a1)² | 3a1 / 4a1 | 4.9e-15 |
| CH₄ | Td | 9/5 | 25 | 2.4 | 230 / 2195 | (1a1)²(2a1)²(1t2)⁶ | 1t2 / 2t2 | 2.7e-15 |
| N₂ | D∞h | 10/7 | 43 | 1.4 | 264 / 2467 | (1σg)²(1σu)²(2σg)²(2σu)²(1πu)⁴(3σg)² | 3σg / 1πg | 3.6e-15 |
| CO | C∞v | 10/7 | 26 | 0.4 | 193 / 2343 | (1σ)²(2σ)²(3σ)²(4σ)²(1π)⁴(5σ)² | 5σ / 2π | 4.2e-15 |
| HF | C∞v | 6/5 | 6 | 0.5 | 155 / 1452 | (1σ)²(2σ)²(3σ)²(1π)⁴ | 1π / 4σ | 1.0e-15 |
| CO₂ | D∞h | 15/11 | 57 | 0.8 | 269 / 3573 | (1σu)²(1σg)²(2σg)²(3σg)²(2σu)²(4σg)²(1πu)⁴(3σu)²(1πg)⁴ | 1πg / 2πu | 7.9e-15 |
| C₂H₄ | D2h | 14/8 | 38 | 1.3 | 317 / 7388 | (1ag)²(1b1u)²(2ag)²(2b1u)²(1b2u)²(3ag)²(1b3g)²(1b3u)² | 1b3u / 1b2g | 4.0e-15 |
| H₂CO | C2v | 12/8 | 24 | 0.5 | 311 / 4555 | (1a1)²(2a1)²(3a1)²(4a1)²(1b2)²(5a1)²(1b1)²(2b2)² | 2b2 / 2b1 | 5.6e-15 |
| C₆H₆ | D6h | 36/21 | 1018 | 10.2 | 618 / 12735 | (1e1u)⁴(1a1g)²(1e2g)⁴(1b1u)²(2a1g)²(2e1u)⁴(2e2g)⁴(3a1g)²(2b1u)²(1b2u)²(3e1u)⁴(1a2u)²(3e2g)⁴(1e1g)⁴ | 1e1g / 1e2u | 9.8e-15 |

Record bytes: "min" = `{pg, axes, labels[n], config}`; "full" = plus the per-MO diagnostics. Solve times include the first-call JIT (H2O is the first). Labelling is <= 10 ms even for benzene, so it can ride inside the solve.

## Comparisons with the textbook (all MATCH; no DIFFERS)
- MATCH H2O configuration (1a1)²(2a1)²(1b2)²(3a1)²(1b1)² and LUMO 4a1 (x ⟂ plane).
- MATCH NH3 (1a1)²(2a1)²(1e)⁴(3a1)². MATCH CH4 (1a1)²(2a1)²(1t2)⁶. MATCH HF (1σ)²(2σ)²(3σ)²(1π)⁴.
- MATCH N2 full configuration. Computed order 1πu −0.5730 Eh < 3σg −0.5394 Eh (the experimental order, 3σg HOMO).
- MATCH CO: HOMO 5σ, 1π (−0.5510) below it (−0.4465), LUMO 2π. MATCH CO2 HOMO 1πg.
- MATCH C2H4: 8 occupied, HOMO 1b3u (pi), LUMO 1b2g (pi*), in the Mulliken axes above.
- MATCH H2CO: HOMO 2b2 (in-plane n), LUMO 2b1 (pi*). MATCH C6H6: HOMO 1e1g, LUMO 1e2u, lowest pi 1a2u (pi levels −0.4589, −0.2813, +0.2702, +0.5073 for a2u, e1g, e2u, b2g).

**Findings that are not DIFFERS but should be known.**
1. **The N2 order is basis dependent.** The probe's own 6-31+G* solve (38 AO, 296 ms) puts 3σg (−0.6349) *below* 1πu (−0.6169), the HF-Koopmans inversion. STO-3G reproduces the textbook order; 6-31+G* does not. A names module reports the computed order, never "fixes" it. (Found by degeneracy only; names were not derived in 6-31+G*.)
2. **Core levels order by 1e-5 to 1e-3 Eh.** CO2 comes out (1σu)²(1σg)² (−20.3626 / −20.3623, gap 2.4e-4) and benzene's carbon-1s set as 1e1u < 1a1g < 1e2g < 1b1u (spread 5.4e-4 Eh, first gap 1.6e-5), where the textbooks write 1σg first and 1a1g first. The counted labels are still right by the "n-th of that irrep by energy" rule; only the printed order of the configuration differs from the book.
3. **Frontier naming is degeneracy-blind in the app.** `label(k)` / `orbFmt` name by index: for a degenerate HOMO the members come out HOMO−2, HOMO−1, HOMO (CH4 1t2), HOMO−1, HOMO (HF 1π, CO2 1πg, C6H6 1e1g) — 4 of the 10. The JSON carries both `frontierApp` (as the app does it) and `frontier` (by level: every member of the level is HOMO).

## Controls (the machinery responds when it should)
- Water with H1 moved 0.02 A: **refused** ("operation C2 is NOT a symmetry of the framework", worst 0.0494 bohr).
- Tolerance too large (C2H4 at 5e-3 Eh, N2 at 5e-2): merged levels reported **mixed** ("Ag + B1u", "σg + σu", "σg + πu"), not labelled.
- N2's **second aufbau solution** (core guess, +0.7298 Eh) is symmetry-broken: its three upper occupied levels give n_π = 0.5, residual 0.5, **refused**. Once a level is refused later counted labels are unreliable (`labelsReliable: false`), so a names record should be all-or-nothing.
- Gauge: a random orthogonal rotation inside every degenerate cluster of C (CH4, CO2, C6H6) leaves every label unchanged (the character is a trace).
- Energy structure of the whole solvable library (52 molecules, SAD run, 6.9 s): worst intra-level spread **3.3e-13 Eh** (GeH4), smallest gap between separate levels **1.6e-7 Eh** (Br2). The app's 1e-8 sits inside [3.3e-13, 1.6e-7] but only 16x above the narrowest gap (Br2); 2e-10 (geometric centre) would be safer. Ten molecules have separate levels closer than 1e-4 Eh (Cl2, AlH3, SO2, C3H6, C4H6, furan, pyridine, urea, C6H6, Br2 with five).

## What failed and why
Nothing failed in the ten. Everything in the controls that was refused was refused on purpose. The one thing a first reading would call a failure — benzene's core order and CO2's — is a 1e-5 to 1e-3 Eh splitting resolved correctly, not a labelling error.

## What the 42 other molecules and Cartesian d would need
- **STO-3G d shells (Z >= 21): GeH4, AsH3, H2Se, HBr, Br2** (CuH, ZnH2 are disabled). The other 47 solvable species are s,p only. **6-31+G* puts a Cartesian d shell on every H–F atom**, so it needs the d block too (`aoRep` refuses l = 2 on purpose).
- The d block is a 6x6 `D_d(R) = N⁻¹ Sym²(R) N`: the monomial representation of the symmetric square of R (xx,xy,xz,yy,yz,zz), conjugated by the diagonal of the unit-self-overlap normalisations (axial and mixed components differ by sqrt(3): `md.js` `rdOf`/`RD2`). The sixth d (r²) is an s-like A1g and harmless. The `MᵀSM = S` check already in the probe is the acceptance test for it.
- **Point groups still to declare (42):** linear D∞h/C∞v (H2, LiH, F2, LiF, NaH, HCl, Cl2, NaCl, BeH2, MgH2, HCN, N2O, C2H2, OH⁻, CN⁻, HBr, Br2 — the existing linear code covers them), D3h (BH3, AlH3, BF3, C3H6), Td (SiH4, CF4, NH4⁺, GeH4), C3v (PH3, CH3CN, H3O⁺, AsH3), C2v (H2S, O3, SO2, H2Se, furan, pyridine, urea), C2 (H2O2), C2h (C4H6), D3d (C2H6), Cs (CH3OH, HCOOH, glycine). New tables: D3h, D3d, C2h, C2, Cs.
- **Geometry exactness is not uniform.** Furan and pyridine are built by walking a polygon: C2 residual 9.6e-4 and 8.1e-4 bohr (closure 3.8e-4 and 3.2e-4 A). A tolerance of 1e-8 bohr on the atom match would refuse them; a names module needs a stated geometric tolerance (~1e-2 bohr) and must carry the residual. Butadiene, urea, glycine, methanol, formic acid were not measured.
- Near-degenerate separate levels (list above) mean cluster identity is stable only while the SCF is converged to its tolerance; require `converged` before naming.

## Answers from reading the code
**(a) What the solver returns / is S available?** `moleculeRHF` returns `energy, orbitalEnergies` (ε, ascending Float64Array), `C` (n×n row-major `C[i*n+k]`, AO i, MO k, in the canonical gauge when converged), `D`, `F`, `nocc`, `nElectrons`, `converged`, `basis` (`shells`, `bfs[i] = { idx, atom, Z, c, l: [lx,ly,lz], shell, exps, d }`, `order` strings like `"0 O 2px"`), `integrals` (**`S`**, T, V, h, X/Y/Z, eri, Enuc, atoms), `aufbau`, `solutions[]`, `stability`, `timings`. **S is available after the solve as `sol.integrals.S`**, and so are F and the AO list (atom, shell, Cartesian component). Not returned: occupations (aufbau gives 2 for k < nocc), clusters (`canonicalOrbitals` clusters internally and discards it), any irrep.

**(b) Does the worker keep C, ε, S?** The worker keeps everything: `ensureSolve` caches `chemSol = { key, sol, I, ground, spectrum, R, states, atoms, basis, charge }`, i.e. the whole solver result including S, F and the basis. The **reply** (`chem.solve` / `chem.ground`) is `{ ...ground, ...spectrum, stage, timings, eps, C, D, shells }` with `eps`, `C`, `D` as transferred copies; `ground` also carries `order` (AO strings), `energy`, `nocc`, `nAO`, `hash`, `solutions[]` (ε per solution only). **S and F are not sent**, and `shells` (`fieldShells`) has centres, l and the AO base but no atom index or Z. `chem.states` adds `rMO` (position matrices in the MO basis), not S. So the main thread has C and ε but cannot form characters; the names should be computed in the worker inside `ensureSolve` (<= 10 ms for benzene) and attached to `ground`, where `chemSolve`'s spread ships them for free (155–618 B). (S is also derivable from C alone, S = (C Cᵀ)⁻¹ — an algebraic remark, not exercised in the probe.)

**(c) Every site that formats an orbital label today.**
- `lab/orbitalsview.js`: `label(k)` l.123–127 (HOMO / LUMO / HOMO−n / LUMO+n, or `'k'+(k+1)` before a solve) — used by the register tile name l.258, its aria labels l.261/264/269, the beat readout l.303, the ψ readout l.323, the ladder hover l.394 (`label · k# · ε · occupation`); the sub line l.259 (`k# · ε · 2 e⁻ / virtual`); the ladder gutter l.397–398 (by ROW: `HOMO`, `LUMO`, else `'k'+(row.items[0].k+1)`); the gap readout l.300 (`ε_LUMO … − ε_HOMO …`); presets named `'HOMO + LUMO'` / `'WINDING'` l.70/158.
- `lab/chemview.js`: `orbFmt(k)` l.70–74 (the ORBITAL dial; plain `String(k)` before a solve), wired at l.119–120 and l.266; the `ε_HOMO · ε_LUMO` readout l.160/464; `dominantOf` l.493–495 prints a root's dominant transition as bare MO numbers `i+1→a+1`; snapshot `epsHOMO/epsLUMO` l.765.
- `lab/statesview.js` `label(key)` l.149–157: S₀, S₁… by level (S₄x/S₄y lanes) — state, not orbital, names, the same family.
- `lab/moleculeview.js` l.37: the legacy H₂⁺ card's two hard-coded buttons `σg` / `σu` — the only real symmetry names in the app today.
- **No orbital-label formatting** in `lab/registerview.js` (it only switches ORBITAL/STATES panes), `lab/molecular-register.js` (numeric lane keys, preset text such as "S₀ + the brightest valence state"), or `lab/moview.js` (H₂⁺ basis names `1s LCAO`, `STURMIAN n ≤ 4`, `REGISTER n ≤ 6`).

## What this probe does NOT establish
- Only ten molecules, one basis (STO-3G), one solution each (the ground state from SAD), node only. No browser, worker transfer or UI was run.
- Groups and frames were **declared by hand**; there is no point-group detector, and 42 library molecules are unrun. An automatic detector is a separate piece of work.
- "MATCH" means agreement with the textbook configurations the brief supplied, which I did not re-derive from a source. There was **no external oracle** (PySCF, Psi4) producing independent symmetry labels. Confidence rests on integer multiplicities (<= 1e-14), `MᵀSM = S`, `MᵀFM = F`, the table self-tests and the alias recomputation — strong internal evidence, not independent confirmation.
- 6-31+G* (and the five heavy species) need the unimplemented d block; N2's 6-31+G* order was read from degeneracy, not names.
- Timings are one run on one machine; the first molecule includes JIT. The library's own cost model says benzene ~9.6 s; measured here 1.0 s (the model is stale, not a probe error).
- Charged species, open shells and symmetry-broken solutions: only the N2 second solution was tried (refused). The tolerance window was measured, not proved.
