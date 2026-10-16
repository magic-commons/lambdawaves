# 0.7.1 U1 UHF + THE OPEN SHELLS + VIEW SPIN — build note (Opus builder, 2026-10-15)

Branch `u1-uhf` off `5022adf` (`yan-c`). Not pushed, not merged. The tip is the commit that carries this note (`git log -1 u1-uhf`).
Step commits: (a) `dd3f714` · (h) `1cb59ce` · (b) `c28b209` · (c) `1252124` · (d)(e) `e881587` · (f)(g) `418ff05` · (i) `6729a09` · (f, the guards) `1ca0d2b`.
Commits are by file, so the order is the plan's but each commit is not separately green: the node gate was run at the tip (and at `6729a09`).

**Δ `lab/` = +95** (29,056 → 29,151 by the plan's count; budget +120, cap 29,347). By file: scf +54 · molecules +13 · rhf-molecule +12 ·
chemview +9 · mathworker +5 · status +2 · verbs 0 · latex-state 0 · molecule-state 0. Plus `lab/library.json` +28 (seven oracle rows, not counted) and `lab/sw.js` (pwa).

## Corrections to the brief / plan
1. **`fockReal` is NOT refactored — it is untouched, and that is how THE LOCK holds.** A `jk(D)` that returns J and K separately and rebuilds
   `fockReal` as h + J − K/2 sums `Σ D·a − ½Σ D·b` where the base sums `Σ D·(a − ½b)`: a different rounding, so not "byte-identical numbers".
   Instead `lab/scf.js:117` adds `exchange(basis, D)` = K[D] alone, and UHF is written THROUGH the old function:
   Fα,β = h + J[D] − K[Dα,β] = **fockReal(D) ∓ ½K[Ds]**, D = Dα + Dβ, Ds = Dα − Dβ. Every closed shell runs the base's code path unchanged.
2. **The broken-symmetry seed needs DIIS held.** With the α HOMO/LUMO mixed at tan θ = 0.1 and DIIS from iteration 1, H₂ at 3 bohr goes back to
   the RHF saddle (⟨S²⟩ = 0, −0.885 Eh; the minimum is −0.951). `uhf` holds DIIS until ‖ẽ‖ < 1e-4 whenever `mix` is set (`scf.js:145`): over
   R = 1.4 … 6.0 bohr this reproduces plain Roothaan iteration's minimum everywhere (1e-1 and 1e-2 thresholds still fell back at 2.3–4.0 bohr;
   1e-3 missed 2.2; 1e-4 and 1e-5 agree everywhere — 1e-4 is the faster).
3. **"SAD split nα/nβ" alone lands three of the seven on a saddle.** From the symmetric SAD start: O₂ 1.3 mEh up, B₂ 73 mEh up, NO₂ 14 mEh up,
   NO does not converge in 200. The road that reaches PySCF's stable minimum on all seven: SAD **shaken** exactly as the stability probe shakes
   (`perturbed`, seed 20260912, amplitude 0.05 — `rhf-molecule.js:166`, shared with `stabilityProbe`, same arithmetic), plus the mix seed (which
   also holds DIIS), maxIter 10× (B₂ 661 and NO₂ 1030 iterations; still 131 / 416 ms in node). Explored, rejected: core guess (O₂ 0.26 Eh up),
   SAD+mix without the shake (O₂, B₂, NO₂ up), the shake without the hold (back on the saddle).
4. **PySCF's single road is not deterministic here either**: one oracle run landed NO 6 mEh up (−127.5243, ⟨S²⟩ 0.866, "stable" by its own test);
   the next found −127.5304. The oracle therefore takes the LOWEST converged stable minimum over four guesses (minao, atom, 1e, huckel), each followed
   down by PySCF's internal stability analysis and finished by its second-order solver. `conv_tol_grad` is 1e-7, not 1e-9: on NO₂ all four roads
   agree on E to 5e-13 and stop above 1e-9 in the gradient (a flat mode — which is also why NO₂'s ⟨S²⟩ agreement is 3e-7, not 1e-10).
   H₂'s oracle seed is the fully localised one (α on one atom, β on the other) — deliberately NOT the app's tan 0.1 seed (from which PySCF's own
   DIIS also lands on the saddle at 3.0 bohr and calls it stable).
5. **The STATUS line budget (110 characters, `tests/status.test.mjs`).** The plan's "O₂ · UHF · ⟨S²⟩ 2.004 (exact 2) · NUMERICAL · …" is 119 on
   DENSITY. The LINE carries `UHF ⟨S²⟩ 2.003` (longest line 107); the HEAD carries `⟨S²⟩ 2.003 (exact 2)` — S(S+1) where there is room.
6. **The stem.** `moleculeHead` (`lab/latex-state.js:137`) writes "RHF/" literally, so the head's model line now reads
   `³Σg⁻ · UHF/STO-3G · E = …` (term from the catalogue row, model from the solve; byte-identical for every closed shell); ⟨S²⟩ rides on the head's
   STATUS line. No `sol.stem` is set by chemview (the record road still sets it).
7. The catalogue "gate" for odd counts is `tests/molecules.test.mjs` (lab/molecules.js has none); it now gates the 54 closed shells against
   sto-3g-v1.json and the seven open shells for an even multiplicity and a term. NO₂ is filed under TRIATOMICS · SMALL (section HYDRIDES, as that group is).
8. CCCBDB geometries checked on cccbdb.nist.gov for the three polyatomics (Herzberg 1966): NH₂ r 1.024 Å ∠ 103.4°; CH₃ r 1.079 Å, D₃ₕ; NO₂ r 1.193 Å
   ∠ 134.1°. The diatomics are the brief's numbers (O₂ 1.2075, NO 1.1508, OH 0.9697, B₂ 1.590).
9. `tools/orbital-library.mjs` writes the open shells' oracle rows from `uhf-v1.json`; `lab/library.json` was rewritten by the same expression
   (the old file reproduced byte for byte, the 53 closed-shell rows unchanged). `--check --only alanine` is OUT OF STEP on alanine's record hash —
   **identically on the base `5022adf`** (checked on a `git archive` of it): pre-existing, not this row's.

## What landed, by seat
- **(a) `lab/scf.js`** — `exchange` l.117; `uhf(basis, { nAlpha, nBeta, diis, maxIter, tol, guess, mix })` l.128 → `{ energy, electronic, Calpha,
  Cbeta, epsAlpha, epsBeta, Dalpha, Dbeta, Falpha, Fbeta, D, Ds, s2, iterations, converged, floor, error, nAlpha, nBeta }`: rhf's loop with two
  densities, one DIIS over [ẽα; ẽβ], rhf's Löwdin frame and round-off floor; the seed l.159; ⟨S²⟩ = Sz(Sz+1) + nβ − Σ|Cαᵢᵀ S Cβⱼ|².
- **(b) `lab/rhf-molecule.js`** — `moleculeRHF({ …, multiplicity = 1, model = null })` l.209; the refusal l.218 ("odd electrons need multiplicity
  2, 4, …"); the UHF branch l.226 (multiplicity > 1 OR `model: 'uhf'`): returns `model: 'UHF'`, `multiplicity`, `Ds`, `s2`, `Calpha/Cbeta`, `nBeta`,
  `C` = canonical Cα, `orbitalEnergies` = εα, `nocc` = nα, `stability: null`, `aufbau: null`, `solutions: []`. `moments` l.220 computes dipole and
  Tr(DS) for both roads with the base's summation order.
- **(c) `lab/molecules.js`** — header l.12; O₂ l.262, NO, OH, B₂ (DIATOMICS), NH₂ l.295, CH₃ (HYDRIDES), NO₂ l.311 (TRIATOMICS), each with
  `multiplicity`, `term`, a cited source; `derive` l.502: nocc = nα; declared symmetry (D∞h O₂ B₂, C∞v NO OH, C₂v NH₂ NO₂, D₃ₕ CH₃).
- **(d) `lab/mathworker.js`** — `ensureSolve` keys an open shell as another key (`|UHF m`) and passes `multiplicity` (and `model: 'uhf'`);
  the ground carries `model, multiplicity, s2, nBeta` only for UHF; `chemGround` ships `Ds` l.516 (transferred by `chemTransfer` as any typed array);
  `OPEN` l.204 refuses `chem.spectrum`/`chem.solve`/`chem.states` (l.287, via ensureSpectrum), `chem.rt.init` l.603, `chem.drive.init` l.394.
- **(e) `lab/molecule-state.js`** — `rhf.Ds` written l.177 and restored l.244 only when present.
- **(f) `lab/chemview.js`** — VIEW `SPIN` l.169 (boot-disabled l.381, lit by `views()` only when `sol.Ds`; a closed shell falls back to DENSITY);
  `pushMatrix` kind `'signed'`, M = Ds (f32 once per solve) l.539; `molView` 'real' for it; the solve message carries `multiplicity`; the identity
  l.349 takes the entry's multiplicity and the solve's model; THE STAND-DOWNS `standDown` l.386 (KICK, RUN, FLOW, TDA, PULSE disabled with the
  sentence on their help, a note above the run row; touched only on a change of shell type); `kick` refuses l.400; `query()` null l.968 (no STATES
  ladder asked); no spectrum asked; the caption l.979 adds `SPIN · UHF`; `setView('spin')`; Tr(DS) readout "16 electrons · 9 α 7 β · ⟨S²⟩ 2.0033".
- **(g) `lab/status.js`** l.19 — `SPIN` in the view table; `UHF ⟨S²⟩ x.xxx` in the line, `⟨S²⟩ x.xxx (exact S(S+1))` in the head.
- **(h)** `tools/library/uhf-oracle.py`, `tests/fixtures/oracles/uhf-v1.json`, `tests/uhf.test.mjs` (47 lines).
- **(i) `lab/verbs.js`** — `molecule`/`view` take `spin`; the inventory's molecule carries `model` and `s2`.

## The numbers (node, this machine) — ours vs PySCF 2.14.0 UHF, cart=True, the vendored STO-3G decimals
Gates: |ΔE| ≤ 1e-8 Eh · |Δ⟨S²⟩| ≤ 1e-6 · |Tr(DS) − N| ≤ 1e-10 (all three hold for every row; Tr DS = N to the printed 12 places).

| id | term | E (ours) | \|ΔE\| | ⟨S²⟩ (ours) | \|Δ⟨S²⟩\| | exact | iterations | ms |
|---|---|---|---|---|---|---|---|---|
| O₂ | ³Σg⁻ | −147.635230015 | 4e-13 | 2.003326 | 8e-11 | 2 | 182 | 44 |
| NO | ²Π | −127.530399569 | 4e-14 | 0.964998 | 2e-8 | 0.75 | 180 | 38 |
| OH | ²Π | −74.362637546 | 3e-14 | 0.753256 | 3e-10 | 0.75 | 38 | 8 |
| B₂ | ³Σg⁻ | −48.421165269 | 1e-13 | 2.896696 | 6e-8 | 2 | 661 | 131 |
| NH₂ | ²B₁ | −54.836924422 | 2e-13 | 0.757223 | 1e-11 | 0.75 | 73 | 12 |
| CH₃ | ²A₂″ | −39.076708850 | 3e-14 | 0.765225 | 5e-9 | 0.75 | 34 | 10 |
| NO₂ | ²A₁ | −201.286183695 | 9e-13 | 1.198546 | 3e-7 | 0.75 | 1030 | 416 |

H₂ singlet by `model: 'uhf'` vs PySCF (≤ 1e-8, ≤ 1e-6): 1.4 bohr −1.116714325 (⟨S²⟩ 0) · 3.0 −0.951017950 (0.7742) · 5.0 −0.933587544 (0.9946) ·
0.74 Å −1.116759308 (0) · 3.00 Å −0.933284660 (0.9986). The B₂ and NO₂ contamination (2.90 for a triplet, 1.20 for a doublet) and NO₂'s
broken C₂v (`names` says level 1 is not one irrep, residual 0.5) are the model's, printed, never hidden.

**THE LOCK (water's D through the module):** `tests/uhf.test.mjs` §1 holds H₂O's and N₂'s D, C (sha-256 of the f64 bytes) and E (`===`) to the
values recorded on the base `5022adf` before any edit: H₂O D `7795fc4c…`, C `61bf7fa6…`, E −74.96302316286258 (8 iterations); N₂ D `8a080dab…`,
C `2520f664…`, E −107.49588788341288. Both PASS at the tip, and `model` is absent (multiplicity 1 never enters `uhf`).

## Gates run (all at the tip unless said)
`./test.sh node` rc 0 (twice: at `6729a09` and at the tip) · `node tests/uhf.test.mjs` PASS · `node tests/library.test.mjs` GREEN ·
`node tools/rack-deps.mjs --classes` rc 0 · `node tools/new-project.mjs --check` in step (16117 B) · `node tests/pwa.test.mjs --write` then the gate ·
`node tools/serialize-bytes.mjs` (served on 9341): the 11 readings' `--out` file is **byte-identical** to the base's (`5022adf` served from a
`git archive`) · `tests/chem.browser-test.mjs` once (at `6729a09`): **0 failing of 56** · one headless look at O₂ (not a suite): SPIN lit and drawn,
"SPIN · UHF ⟨S²⟩ 2.003 · NUMERICAL · ρα − ρβ, signed", KICK/RUN/FLOW/TDA/PULSE disabled, KICK refused with the sentence, back to H₂O re-enables
them and VIEW returns to DENSITY, no page errors. Test edits for the new catalogue: molecules, status (91 → 98), chem-sweep (closed shells only),
rhf-molecules (the refusal's new words).

## Dropped, and why
- ROHF, open-shell TDA/RT/drive/register, CASSCF — the plan's deferrals; they stand down with the sentence.
- A `jk` helper and a rewritten `fockReal` (correction 1): byte-identity forbids it.
- The stability probe and Hessian under UHF: recorded `null`.
- 6-31+G* open shells: offered by `basis631` like any H/C/N/O/F molecule (UHF runs there) but not in the oracle — UNCHECKED on the STATUS.

## For the integrator (U2 THE H₂ CURVE)
- `moleculeRHF({ atoms, model: 'uhf' })` is the singlet UHF ask (shaken SAD + mix seed); the worker takes `{ op: 'chem.ground', …, model: 'uhf' }`
  (and `multiplicity`) and keys it apart from the RHF solve of the same atoms. `uhf` (`lab/scf.js`) on a 2-AO basis with `mix: 0.1` from 'core'
  reproduces the curve (Coulson–Fischer between 2.2 and 2.3 bohr: ⟨S²⟩ 0.036 at 2.2, 0.195 at 2.3).
- `tests/fixtures/oracles/uhf-v1.json` `h2` carries PySCF UHF at 1.4 / 3.0 / 5.0 bohr and 0.74 / 3.00 Å.
- `lab/chemview.js`: U1 touched VIEW (seg, views, molView, pushMatrix, setView), the solve message/identity/fill (`standDown()`), kick/query,
  refresh's readouts, the caption and state(); the `h2Note` block (`refresh`, l.640) is untouched. A UHF ground has `sol.model`, `sol.Ds`, `sol.s2`.
