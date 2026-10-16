# U2 THE H₂ CURVE + THE ENTANGLEMENT NUMBER — build note (0.7.1 "Open Shells")

Branch `u2-h2curve` off `5022adf` (`yan-c`). Builder: Opus, for the integrator. Tip: the commit that adds this note (`git log -1 u2-h2curve`).
Earlier commits: `c1f7253` (the curve, the block, the pose, the key, the test) and `0c73d57` (BREAK, its cover, STARTERS, the scopes row).

## What landed, by seat

- **`lab/h2curve.js`** (new, 42 lines).
  - `uhf(basis, { nAlpha, nBeta, mix = 0.1, maxIter = 2000, tol = 1e-10 })` at `:6–20`, marked `// U2 local: swap for scf.js uhf at the merge`.
    It is the loop of `scf.js` `rhf` with two densities: Fσ = h + J(Dα + Dβ) − K(Dσ) in the Löwdin frame, from the core guess.
    The α HOMO is rotated into its LUMO by `mix` (0.1), so a singlet can break symmetry. Plain iteration, no DIIS.
    It returns `{ energy, Calpha, Cbeta, Dalpha, Dbeta, D, Ds, s2, iterations, converged }`, where ⟨S²⟩ = Ms(Ms+1) + nβ − Σᵢⱼ |(CαᵀSCβ)ᵢⱼ|².
  - `h2Point(R)` at `:22`. RHF and FCI come from `h2ci.js` `minimalH2(sto3gIntegrals(R))`; UHF is `uhf` on the same 2 AOs (`eriTensor`).
    S = −Σᵢ (nᵢ/2) ln(nᵢ/2) uses nᵢ/2 = a², b², where a = `ciVector[0]` and b = `ciVector[3]` (σg², σu²).
  - `instability(R)` at `:27`: the RHF → UHF (triplet) instability, h_uu − h_gg − J_gg + J_gu − 2K_gu. It reads `minimalH2`'s `hMO` and `gMO` and is zero at the Coulson–Fischer point.
  - `h2Curve(R[])` at `:29` returns `{ R, rhf, uhf, fci, S, s2, limit = 2E(H, STO-3G), cf }`, with `cf` bisected on `instability` to 1e-12 bohr.
  - `drawCurve(canvas, T, R)` at `:34` draws the three curves relative to 2E(H): RHF dashed in the kit's ink, FCI in `--fg`, UHF in the accent.
    It also draws a dotted 2E(H) line, a dotted Coulson–Fischer tick ("CF 2.18") and the cursor at R in the accent.
    The colours come from `themeInk` and `accentRGB`; nothing is hard-coded.
- **`lab/molecules.js:547–548`**: `moleculeAtoms(id, R = null)`. For H₂ with an R it returns the two protons at ±R/2 on z. Without an R, every id returns exactly what it did. Net +0 lines.
- **`lab/chemview.js`** (+14). All of it is the block under `h2Note`, plus the seats that block needs.
  - `:29`: the import, on the existing `h2ci.js` import line.
  - `:250–261`: THE CURVE block, `div.mol-h2` after `h2Note` and before `probeLine`. It holds:
    - the canvas (`.mol-c.mol-curve`, 110 px tall);
    - **STRETCH**, a knob from 0.8 to 6.0 bohr whose default is the row's own 0.741 Å = 1.40028 bohr. Its `onInput` moves the cursor and the readout. Its `onChange` sets `h2R` and calls `solve()`. A release within 5e-3 of the default snaps back to `null`, the row's own geometry;
    - **METHOD** RHF · UHF;
    - the readout, which reads "R 5.00 bohr · RHF −0.69 · UHF −0.93 · FCI −0.93 Eh · S 0.68 of ln 2 · ⟨S²⟩ 0.99". Its sub line reads "UHF leaves RHF at the Coulson–Fischer point, 2.180 bohr · S: the one-orbital entanglement entropy of the FCI state, ln 2 = 0.693 at the break".
  - `:254`: `function chemAtoms(id)` inside `createChem`. It shadows the module's export, so every `chemAtoms(preset)` in the card reads the STRETCH pose: the solve, the kick, `symmetryLine`, `coreCount`, `record()`, `query()`, and `atomsNow()`. The skeleton and the atom labels therefore follow the stretch.
  - `:304`: the solve's key gains `h2Key()`, which is `''` at the default, so the key is unchanged there. A stretched H₂ and METHOD UHF each re-solve.
  - `:314`: `chem.ground`'s message gains `model: 'uhf'` only when the key ends in `|uhf`, that is, U1's arg.
  - `:643`: `h2Box.hidden` follows `h2Note.hidden` (H₂, STO-3G).
  - `:646`: the H₂ note calls `h2Read()` once per solve key. The note keeps its sentence, and its numbers now follow R.
  - `:735`: `paint()` redraws the curve. A fold opened after the first solve therefore paints it.
  - `:887`: `presentation()` writes `h2: { R, method }` only on H₂, and only off the default.
  - `:934–935`: `load()` reads it. Absent means the row's R and RHF. A changed R or method re-solves, and the knob and seg are set.
- **`lab/lab.css:498`**: `.mol-c.mol-curve { height: 110px; margin-top: 6px; }`.
- **PROJECT key**: `instruments.chem.h2 { R, method }`. The plan's "`presentation.h2`" is chemview's `presentation()`; in the file it sits where V1's `vibrate` and `pulse` sit.
  It is absent by default. `docs/STATE-SCOPES.md:69` has one row for it.
- **BREAK**: `lab/demos/break.lambdawaves.json` (23,143 B) and `lab/demos/covers/break.jpg` (17,228 B).
  - It was made by the app's own road, as BUCKY was, with a throwaway in `.tmp/` (not committed): `?starter=h2-sigma-u`, `chem.setView('density')`, then `chem.load({ ...chem.save(), h2: { R: 5, method: 'uhf' } })` (the restore road), the notebook text, `projects.save('DEMOS/BREAK')` and `exportText`. `quality` and `camera` were dropped.
  - The stage solved H₂ at R = 5 with E = −0.68641592535 (the stage's RHF, see below).
  - The cover came from `make-covers break`.
  - `lab/project-store.js:159` gained the STARTERS row `['break', 'BREAK']`. The demo counts in the comments (`project-store.js:157`, `main.js:7,43`) now say nine, and `tests/opener.browser-test.mjs` expects nine covers.
  - `lab/sw.js` gained 3 precache rows, written by `pwa --write`.
- **`tests/h2curve.test.mjs`** (37 lines, 4 PASS). It checks:
  - the CF point is inside PySCF's bracket, and the instability changes sign there;
  - UHF = RHF to 1e-9 at CF − 0.03, and UHF is broken at CF + 0.03;
  - UHF = RHF to 1e-10 at 1.4;
  - at 6.0, UHF − FCI ≤ 0.02, and both are within 0.01 of 2E(H);
  - S(1.4) < 0.1 and 0.65 < S(6.0) < ln 2;
  - FCI ≤ UHF ≤ RHF and 0 ≤ S < ln 2 at all 53 table points;
  - PySCF's RHF, UHF and FCI to 1e-8 Eh and ⟨S²⟩ to 1e-6 at 0.74 Å, 3.0 bohr and 3.00 Å;
  - `moleculeAtoms('H2')` is byte-equal to the row, and `('H2', 5)` is ±2.5.

## The physics, as computed

**The Coulson–Fischer point is R = 2.179695 bohr (1.1534 Å).** It is bisected on the RHF → UHF instability. PySCF 2.14's UHF, followed through `stability()`, is RHF at 2.17 and broken at 2.19 (⟨S²⟩ 0.018). At 2.15 / 2.20 / 2.30 it gives ⟨S²⟩ 0 / 0.036 / 0.195. Our SCF agrees on both sides: at CF − 0.03 UHF − RHF is 4e-16, and at CF + 0.03 it is −4.2e-4.

2E(H, STO-3G) = −0.9331636991 Eh.

| R (bohr) | RHF | UHF | FCI | S | ⟨S²⟩ (UHF) |
|---|---|---|---|---|---|
| 1.4 | −1.1167143251 | −1.1167143251 | −1.1372759436 | 0.068090 | 0.000000 |
| 3.0 | −0.8852750001 | −0.9510179481 | −0.9851568244 | 0.427671 | 0.774240 |
| 6.0 | −0.6450767495 | −0.9332273454 | −0.9334021770 | 0.691745 | 0.999297 |

S along the curve: 0.068 (1.4), 0.158 (2.0), 0.196 (2.17), 0.281 (2.5), 0.428 (3.0), 0.683 (5.0), 0.692 (6.0). It rises monotonically toward ln 2 = 0.693.

**PySCF oracle.** `~/bin/scipython -I` ran PySCF 2.14 with `gto.M` at ±R/2 on z, the vendored STO-3G H decimals, `cart=True`, and `conv_tol` 1e-13.
- UHF started from the RHF σg rotated ±0.3 into σu for α / β, then `stability()` was followed until stable.
- FCI is `fci.FCI(rhf)`.
- At 0.74 Å: RHF = UHF = −1.116759307396, FCI −1.137283834489.
- At 3.0 bohr: RHF −0.885275000111, UHF −0.951017948053, ⟨S²⟩ 0.7742404236, FCI −0.985156824368.
- At 3.00 Å: RHF −0.656048251146, UHF −0.933284658334, ⟨S²⟩ 0.9985907243, FCI −0.933631844558.
- Ours agree to better than 1e-9 at all three.

**The stage at R = 5** (the general engine through the worker, RHF) gives −0.68641592535. `h2ci.js` gives −0.68641592484 (5e-10 apart: two integral codes, and `h2ci` divides out the 1e-8 contraction norm).

**Cost of the table.** The 53-point table costs 40–120 ms on this machine at load average 13–15. It is built once per page, on the first H₂ STO-3G landing. Most of the time is in the points next to the CF point: plain iteration slows down there, with up to 1,100 iterations at 2.1 and 2.2 and the 2,000 cap at 2.17–2.19. A readout point away from CF is 20–200 iterations.

## The screenshot

`/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a731d4f4467043902/.tmp/u2-curve-R5-uhf.png`. Not committed.
- It is headless Firefox at 1500 × 1400, from `?starter=break` (R 5, METHOD UHF), with LEAN off so the readout shows. LEAN is on by default and hides every `.ro` and `.note` of the card, the H₂ note included, as it always has.
- It shows the three curves, the CF tick at 2.18, the cursor at 5.0, STRETCH, METHOD with UHF lit, and the readout and its sub line.
- The throwaway is `.tmp/shot-curve.mjs`, 15 lines.

## Corrections to the brief and plan

1. **The Coulson–Fischer point is 2.18 bohr, not "near 2.3".** PySCF agrees. The plan's test window [2.2, 2.5] would have failed on correct physics, so the test asserts PySCF's own bracket (2.17, 2.19) instead.
2. **`minimalH2` returns no `C`.** It returns `Cocc`, `ciVector`, `hMO`, `gMO` and `lambda`. I used `ciVector`, `hMO` and `gMO`.
3. **`caption()` is not in `chemview.js` at the base** (U1 owns the caption). The meaning of S is printed in the readout's sub line, as the plan's "printed with its meaning in the caption" asks, and the CF value is on the canvas.
4. **H₂'s row is `diatomic(1, 1, 0.741)`: protons at z = 0 and 0.741 Å, not ±R/2.**
   - The default keeps those atoms byte for byte (THE LOCK). A stretched R goes to ±R/2 as the plan says.
   - The field box is centred on the origin (`half` = extent + 6, 8.5 bohr at R 5), so the first move off 1.4003 moves the pair by R/2 ≈ 0.70 bohr.
5. **`h2CurveTable` is untouched and unused.** `h2Curve` builds its own table, because it needs UHF, S and ⟨S²⟩ at every point.
6. **Line numbers.** `derive` is at `molecules.js:487`, not 495. The H₂ note's fill is `chemview.js:631–635` at the base. The rest were right to ±2.
7. **U1's fixture `tests/fixtures/oracles/uhf-v1.json` is not at the base.** The test carries tonight's PySCF numbers as literals, with the recipe above. At the merge it can read U1's fixture instead.

## What I dropped, and why

- **VIEW SPIN in BREAK.** SPIN is U1's, and `load({ view: 'spin' })` at the base would push an unknown view. BREAK is saved with VIEW DENSITY. The integrator re-saves it after U1 (see below).
- **METHOD UHF on the stage.** It is inert at the base. The card sends `model: 'uhf'`, but `mathworker.js` `ensureSolve` neither forwards `model` to `moleculeRHF` nor keys on it, so the stage stays RHF. The plot's UHF curve is mine either way. I did not edit `mathworker.js`, which is U1's file.
- **DIIS in the local `uhf`.** Plain iteration fits in ≤ 20 lines, and U1's DIIS replaces it at the merge.

## Lines

`find lab -name '*.js' -not -path 'lab/mir/*' | xargs cat | wc -l`: 29,056 → **29,115 (+59)**, against the row's +70 and the cut's cap of 29,347.
- `h2curve.js` +42
- `chemview.js` +14
- `sw.js` +3
- `molecules.js`, `project-store.js` and `main.js` +0

## Gates run

- `./test.sh node`: GREEN, rc 0, after the last `lab/` edit (with `node tests/pwa.test.mjs --write` before it).
  The first run had one RED: `wigner.test` W42-8, a 150 ms timing gate measuring 155 ms at load average 13, in code this row does not touch. The full rerun was green.
- `node tools/rack-deps.mjs --classes`: rc 0.
- `node tools/new-project.mjs --check`: in step (16,117 B).
- `node tests/h2curve.test.mjs`: 4/4 PASS. `node tests/library.test.mjs` and `node tests/project-formats.test.mjs` (which seeds every STARTER, BREAK included): green.
- `tools/serialize-bytes.mjs`, base (`git archive 5022adf` into `.tmp/`, removed after) against this branch: all 11 readings sha-identical (the four demos, NEW, six history rows).
  It ran on server 9351 with GD 5451; each server was stopped by its own pid.
- No browser suite was run. `opener.browser-test` now expects nine covers, and the integrator runs `chem.browser-test` and THE LOCK on the merged tree.

## For the integrator at the merge

- **`lab/chemview.js` is shared with U1.** My seats are lines 29 (the import), 250–261 (the block), 304 and 314 (the solve's key and message, beside U1's multiplicity and model), 643, 646, 735, 887 and 934–935. U1 owns VIEW, the stem, the stand-downs and the caption; I touched none of them.
- **Swap the local `uhf`.** In `h2curve.js` `h2Point`, call `scf.js` `uhf({ n: 2, S: [1, S, S, 1], h, eri: eriTensor(eri), Enuc }, { nAlpha: 1, nBeta: 1, <U1's broken-symmetry seed> })` and delete `:6–20`. That saves about 15 lines. It needs `energy` and `s2` back. The test needs no change.
- **The worker must forward `model` and key on it.** `ensureSolve` (`mathworker.js:226–244`) must pass `model` to `moleculeRHF` and add it to `keyOf`. Otherwise METHOD UHF returns the cached RHF solve. `chem.spectrum` and `chem.rt.init` carry no `model`: either U1's open-shell stand-downs cover them, or the card must add `model` to those messages too.
- **Re-save BREAK with VIEW SPIN once U1 is in.** Open `?starter=break`, call `__LW.chem.setView('spin')`, then `projects.save('DEMOS/BREAK')` and `exportText`. Drop `quality` and `camera`, run `make-covers break`, then `pwa --write`.
- THE LOCK: H₂ at its default R has the same atoms, the same key and the same message, and the `h2` key is absent.
