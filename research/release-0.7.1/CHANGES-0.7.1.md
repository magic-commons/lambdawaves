# 0.7.1-alpha "Open Shells" — what changed (Claude Sos / Fable 5.1, 2026-10-15 night)

Josh's standing word (09:35): tight builds, features only, pre-1.0; (10:50) "continue with the next builds once it's done." Plan: `BUILD-PLAN.md` (Sos, drafted
while 0.7.0 built), briefs `U1-BRIEF.md` / `U2-BRIEF.md`; two Opus builders from `5022adf`; merged U1 `3fdc796`, U2 `e2c3a4a`, the BREAK demo re-saved `6f8555c`.
Build notes: `U1-BUILD.md`, `U2-BUILD.md`. The ladder row: `../release-0.6.0/PLAN.md` l.38, D.8 l.269.

## The shape
UHF is RHF twice with one Coulomb. `lab/scf.js` `uhf` runs the closed-shell loop with two densities and one DIIS; Fα,β = fockReal(D) ∓ ½K[Dα − Dβ] through a
new `exchange` helper, so `fockReal` itself is untouched and every closed-shell solve is byte for byte what it was (water's and N₂'s D and C sha-identical to the
base, asserted in `tests/uhf.test.mjs` §1 — the plan's J/K refactor was refused for exactly this reason). The card's D is Dα + Dβ (every consumer untouched); the
SPIN density Dα − Dβ is drawn by the field's existing signed kind. ⟨S²⟩ is printed, never hidden: B₂'s 2.90 for a triplet and NO₂'s 1.20 for a doublet are the
model's. Multiplicity 1 never enters `uhf` unless asked by `model: 'uhf'` (the H₂ curve's METHOD). The RT run, TDA, the drive and the register STAND DOWN on an
open shell with one sentence. PySCF UHF is the oracle; the oracle takes the lowest stable minimum over four guesses because PySCF's own default run is not
deterministic on NO (one run landed 6 mEh up).

## U1 · UHF + THE OPEN SHELLS + VIEW SPIN (`lab/scf.js` +54, `lab/molecules.js` +13, `lab/rhf-molecule.js` +12, `lab/chemview.js` +9, `lab/mathworker.js` +5, `lab/status.js` +2, `lab/verbs.js`; `tools/library/uhf-oracle.py`, `tests/fixtures/oracles/uhf-v1.json`, `tests/uhf.test.mjs`)
- **Seven open shells in MOLECULES**: O₂ ³Σg⁻ · NO ²Π · OH ²Π · B₂ ³Σg⁻ · NH₂ ²B₁ · CH₃ ²A₂″ · NO₂ ²A₁ (CCCBDB geometries); the header's "CANNOT be in this list"
  paragraph rewritten to the truth. The guess that converges all seven: SAD shaken as the stability probe does, split by spin, plus the α HOMO/LUMO mix — a plain
  spin-split SAD leaves O₂, B₂ and NO₂ on a saddle (1–73 mEh up). The broken-symmetry seed needs DIIS held until the error is under 1e-4 or it extrapolates
  back onto the RHF saddle (H₂ at 3 bohr).
- **The numbers** (ours vs PySCF 2.14 UHF; gates |ΔE| ≤ 1e-8 Eh, |Δ⟨S²⟩| ≤ 1e-6): O₂ −147.635230015 (4e-13; ⟨S²⟩ 2.003326, exact 2) · NO −127.530399569 (4e-14;
  0.965) · OH −74.362637546 (3e-14; 0.753) · B₂ −48.421165269 (1e-13; 2.897) · NH₂ −54.836924422 (2e-13; 0.757) · CH₃ −39.076708850 (3e-14; 0.765) · NO₂
  −201.286183695 (9e-13; 1.199, 1030 iterations, 416 ms). H₂ singlet by `model: 'uhf'` at 1.4 / 3.0 / 5.0 bohr and 0.74 / 3.00 Å to 1e-8.
- **The card**: VIEW gains SPIN (ρα − ρβ, signed, read as 'real'; disabled without Ds); the head reads "³Σg⁻ · UHF/STO-3G" with ⟨S²⟩ and "(exact 2)" beside it
  (`latex-state.js` had "RHF/" hard-coded); the STATUS line "UHF ⟨S²⟩ 2.003" (the plan's wording was 119 characters against the 110 limit); KICK, RUN, TDA, the
  drive and the register take the kit's disabled look with the sentence; `query()` returns null on an open shell so no STATES ladder is asked; the stability
  probe and Hessian are recorded `null` under UHF. The molecule and view verbs take `spin`; the inventory carries ⟨S²⟩.
- Left out (the plan's deferrals): ROHF, open-shell TDA/RT/drive/register, CASSCF; 6-31+G* open shells run but are UNCHECKED on the STATUS (not in the oracle).
- Gates on U1's tree: node gate 0 (twice); `tests/uhf.test.mjs` PASS; library.test green; rack-deps holds; new-project in step; serialize-bytes 11/11 against a
  `git archive` of the base; chem.browser 0 failing of 56. **29,056 → 29,151 lines (+95 of the ≤ 120).**

## U2 · THE H₂ CURVE + THE ENTANGLEMENT NUMBER (`lab/h2curve.js` 28 lines after the swap, `lab/chemview.js` +14, `lab/molecules.js`; `lab/demos/break.*`; `tests/h2curve.test.mjs`)
- **The curve**: RHF · UHF · FCI along R on `h2ci.js`'s 2-AO STO-3G integrals, relative to 2E(H) = −0.93316; the one-orbital entanglement entropy of the FCI
  state S = −Σᵢ (nᵢ/2) ln(nᵢ/2) over n₁ = 2a², n₂ = 2b² (0 at the RHF limit, ln 2 at the break); ⟨S²⟩ of the UHF. **The Coulson–Fischer point is 2.179695 bohr
  (1.1534 Å)** — PySCF's UHF is unbroken at 2.17 and broken at 2.19; the plan's "≈ 2.3" and its test window [2.2, 2.5] were wrong and the test checks PySCF's own
  bracket. At 1.4: RHF = UHF −1.116714, FCI −1.137276, S 0.068; at 3.0: UHF −0.951018, FCI −0.985157, S 0.428, ⟨S²⟩ 0.774; at 6.0: UHF −0.933227, FCI −0.933402,
  S 0.692, ⟨S²⟩ 0.999. PySCF agrees under 1e-9 at every checked point.
- **The block** under H₂'s 0.6.2 note: the canvas (RHF dashed above, UHF leaving it at the marked point, FCI, the 2E(H) line), STRETCH 0.8…6 bohr (re-poses the
  nuclei at ±R/2 on z and re-solves through the ordinary road — the default geometry stays byte for byte; off it the pair jumps ≈ 0.7 bohr once), METHOD RHF ·
  UHF (asks `chem.ground { model: 'uhf' }`, which U1's worker keys apart from the RHF solve of the same atoms; SPIN then lights), the readout "R 5.00 bohr ·
  RHF −0.69 · UHF −0.93 · FCI −0.93 Eh · S 0.68 of ln 2 · ⟨S²⟩ 0.99" and its sub line naming the Coulson–Fischer point and what S is. PROJECT key
  `instruments.chem.h2 { R, method }` default-absent (bytes 11/11 unchanged).
- **BREAK**, the ninth starter: H₂ at 5 bohr, METHOD UHF, VIEW SPIN — the two electrons parted, one spin on each proton — saved by the app's own road and
  re-saved by the integrator with VIEW SPIN once U1 was in; its cover from `make-covers`.
- At the merge U2's local 2-AO solver was swapped for U1's `scf.js` `uhf` (mix 0.1): the Coulson–Fischer point is unchanged to the printed digit (U1's note had it
  "between 2.2 and 2.3" from a coarse bracket). `tests/h2curve.test.mjs` 4/4. **29,151 → 29,196 lines (+45 after the swap; U2's own +59).**

## Also in this cut
- **The 38 orbital records regenerated** (`53b4901`): since 0.6.5 X1 the ground reply carries the probe (Φ at the nuclei) and the generator records it, so every
  record on disk lacked one key the generator now writes — `tools/orbital-library.mjs --check` had been RED on that alone since 0.6.5 (no number moved; each
  energy still agrees with PySCF to 1e-10). Now: "in step — 38 records, 12,113,330 B; the gate passes every entry."

## The merge · the cut
U1 `3fdc796` (sw.js ours, regenerated), U2 `e2c3a4a` (one chemview conflict — U1's multiplicity spread and U2's model spread on the `chem.ground` message — kept
both), BREAK `6f8555c`. On the merged tree: node gate 0; new-project in step; rack-deps holds; `tests/uhf.test.mjs` PASS; `tests/h2curve.test.mjs` 4/4;
library.test green; project-formats green; serialize-bytes 11 of 11; `tests/chem.browser-test.mjs` 0 failing of 56; THE LOCK 860 0/0 and 1004 0/0 (both with `--query gastab=0`; the first 1004 run went red on one scene, `states.momentum.128`, which the tool itself marked unrepeatable — its integral moved in the 11th digit and the scene did not repeat within that run; the rerun was 0/0 — a GPU flake under load, not this cut's). Lines **29,196** (cap 29,347; +140 of the planned +190). Cut locally as
`v0.7.1-alpha` "Open Shells" by `cut-0.7.1.sh`; nothing pushed, deployed or released.

## Known, not this cut's
- `tests/current.browser-test.mjs:138` (the audio card's track width) has failed since 0.5.4 (P-V N1).
- Deferred by name: ROHF; open-shell TDA/RT/drive/register; CASSCF and the two-orbital active space beyond H₂; the natural-orbital view; spin-flip; 6-31+G* open
  shells in the oracle; the lattice (0.7.2); Kohn–Sham (0.7.3).
