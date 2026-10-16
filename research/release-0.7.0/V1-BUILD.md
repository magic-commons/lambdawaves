# 0.7.0 V1 THE MODES + PULSES — build note (Opus builder, 2026-10-15)

Branch `v1-modes` off `ca00472` (the 0.7.0 base on `yan-c`). Not pushed, not merged. The tip is the commit that carries this note
(`git log -1 v1-modes`); the step commits are (a) `e693f71` · (b) `9dbf8b0` · (c)(d)(e) `85e45f3` · (f) `c1bbc4d` · (i) `eb32a56` · (h) `e3cebf0` · (g) `6ff777a`.
Commits are by FILE, so two hunks ride early: `lab/mathworker.js` (in (b)) also carries (g)'s `chem.rt.init { pulse }` wiring, and
`lab/chemview.js` (in (f)) also carries the PULSE seg.

**Δ `lab/` = +85** (28,922 → 29,007 by the plan's count; cap 29,211). By file: chemview +49 · mathworker +24 · library +5 · session +3 ·
verbs +2 · windows/molecules +1 · molecules +1 · md 0 · names 0 (two `export` keywords). Plus one CSS line (`lab/lab.css`, not counted).

## Corrections to the brief / plan
1. **`research/release-0.7.0/V1-BRIEF.md` is not in `ca00472`**: it was committed one checkpoint later (`d6563e7` on `yan-c`). Read from there with `git show`.
2. **relL2 is of ρ, not of the matrix D.** The gates (2.5·10⁻⁴ water / 7·10⁻⁴ benzene at Q₀, 1.1·10⁻³ at 4Q₀) come from NACRE Round 2, which
   measured ρ on a 40³ grid over the atoms' box padded 4 bohr (`REVIEW-SONNET-2.md` §2b, `sonnet2-vibrate-water.py`, `fable0-vibrate.py`). The
   generator measures exactly that (`relL2`) and writes the matrix's own ‖ΔD‖_F/‖D‖_F beside it (`relD`). Its Q_max IS our Q₀ (`√(1/ω)` mass-weighted
   = `√(1/(μω))` along unit L) — verified in the scripts. Our water at Q₀ reproduces Sonnet's 3.2·10⁻⁴ McWeeny floor (we: 3.32·10⁻⁴ worst).
3. **The water gates were already known to fail** (REVIEW-SONNET-2 S5: "the draft's benzene gates do not transfer … McWeeny leaves a near-constant
   3.2·10⁻⁴ floor at Q_max"; 4.5–10.8·10⁻³ at 4×). They fail here too and are RECORDED (`check.pass`), not tuned. Benzene at 4Q₀ misses by a hair
   (1.12·10⁻³ over all 30 modes; NACRE's 1.06·10⁻³ was four modes).
4. The geometry is NOT a stationary point (|g|max 2·10⁻³ … 0.15 Eh/bohr, recorded per record): the frequencies are the projected Hessian's
   at the menu's geometry, "as computed" — water's bend is **2043 cm⁻¹**, not the brief's illustrative 1595 (experiment).
5. PySCF's `harmonic_analysis` gives no irreps: every irrep here is the projection's (`lab/names.js` tables, exported `GROUPS`); the linear
   molecules (N₂, CO₂, HF) by the axis and inversion (Σg⁺/Σu⁺/Πu, Σ⁺).
6. Masses: PySCF `atom_mass_list(isotope_avg=True)` (amu) × its `ATOMIC_MASS/E_MASS`; ω → cm⁻¹ by its `HARTREE2WAVENUMBER` — both written in the
   fixture's provenance, so the generator and PySCF share every constant.
7. `orbital-library.mjs --check`: I TAUGHT it the rows (it carries `vibrations` through from disk and counts their files as reached; it does not
   re-measure them — `tools/vibrate-library.mjs --check` does). `tests/pwa.test.mjs` §L likewise reaches the vibration records.

## What landed, by seat
- **tools/library/vibrate-oracle.py** (a) — PySCF 2.14 RHF (vendored STO-3G, cart=True, bohr, the app's atoms), analytic Hessian,
  `thermo.harmonic_analysis(exclude_trans, exclude_rot)`; writes ν̃, the Cartesian `norm_mode`s, masses, |g|max, merged by id into
  **tests/fixtures/oracles/vibrate-v1.json** (9 molecules, 13.6 s for all).
- **tools/vibrate-library.mjs** (b) — THE GENERATOR IS THE APP: `moleculeRHF` at R₀ ± h·Lₖ (h = 0.005 bohr) → D₁ (f32), dμ/dQ, the curvature, Q₀;
  Herzberg numbering (the table's irrep order, descending ν̃, a degenerate set once: νₙa/νₙb); THE CHECK with the worker's own `chemVibFrames`
  (K = 1: the phase-0 sample = amp·Q₀) against a live re-solve. Records `lab/library/<sha>.json` `{ schema 1, kind 'vibrate', id, input, ground { hash,
  energy, nAO }, vibrate { K, h, omega, name, irrep, L $f64, mu, q0, D1 $f32, dipole1 $f64 }, check { relL2, trace, linear, relD, gates, pass }, oracle }`;
  `lab/library.json` gains `vibrations: [{ id, basis, hash, bytes, modes }]`. `--check` re-measures byte for byte; `--only`; `--inputs`.
- **lab/library.js** (c) — `$f32` beside `$f64`/`$i32` (l.18, l.27); `validateRecord`'s `kind: 'vibrate'` branch (l.38–40); `decodeVibrate` (l.62).
- **lab/molecules.js:511** — `m.vibrate` = the catalogue row (or null).
- **lab/mathworker.js** (d) — `chem.vib.frames` (dispatch l.154; `chemVibFrames` l.567): K phases, Q = amp·q0·cos(2πj/K), `basisFrom(atoms(Q))`,
  `oneElectron` (now exported from md.js) for S(Q) and the dipole matrices, D ← 3/2·PSP − 1/2·PSPSP on P = D₀ + Q·D₁ (D/2 idempotent), μ(Q) = Σ Z R − Tr(D M);
  the second half mirrored (cos is even); on the CHEM road (both sets); an unsolved key REFUSES. (g) `chem.rt.init { pulse }` (l.607–613).
- **lab/molecular-session.js:154** (e) — `pose(id, shells)`: only while `id` is the selected model; `setMolecule` with the same nAO/half, keeping
  `mol.hash` and `solution`; a card is let go.
- **lab/chemview.js** (f) — the VIBRATE row FIRST in `.mol-more` (l.243–248): `VIBRATE` · `‹ MODE ›` (stepper, "ν₂ 2043 cm⁻¹ · A₁") · `AMPLITUDE` 0…4 ×Q₀ ·
  `BREATHE` · the wide readout ("ν₂ 2043 cm⁻¹ · A₁ · 1.0 Q₀ = 0.233 bohr · T 675 a.u. · 1.0 Hz on screen", " · not harmonic here" past 2 Q₀,
  "held: … — RATE ≤ N breathes"); a molecule with no row: controls dimmed, "no modes recorded for this molecule". `setVib`/`vibAsk`/`vibPose`/`vibSay`/
  `breathe` (l.827–861): the first press `fetchRecord(row.hash, { network: true })` (the library road; INSTALLED's lamp counts only orbital records),
  decodes once a molecule, ONE `chem.vib.frames` in flight (newest asked next); `update(t)` (l.825) poses j = round(K·frac(ωt/2π)) — held at Q≈0
  (j = K/4) when `aliasOf([0, ω], RATE, fps)` > FLASH_HZ — moving a copy of `sol.shells` (shell→atom by exact equality, built once a solve) and
  `pose` → `pushMatrix` with `vibD` = D[j] (densityRe/captureRef/deltaD read `vibD ||` first; no maths on the frame thread). BREATHE: RATE = 2π/ω
  (≤ 3000), the clock plays (`api.breathe`, windows/molecules.js:65 — the knob's own road through `modHand`). `presentation()` (l.874) gains
  `vibrate: { mode, amp }` only while on and `pulse` only when not NONE; `load()` restores both (VIBRATE once the solve lands: `vibLand`). Caption:
  `espCaption()` (l.969) joins " ν₂ 2043 cm⁻¹ · A₁ at 1.0 Q₀ · STO-3G RHF harmonic, as computed" while on (stage-words.js untouched). API tail
  (l.971–974): `atomsNow()` / `dipoleNow()` return the POSED atoms and μ(Q) while VIBRATE plays; `vibrate({ on, mode, amp, breathe })`; `vibLine()`.
  RUN on, a new molecule, MOLECULES off or a load turn VIBRATE off (and re-pose the equilibrium shells).
- **PULSE seg** (g) beside KICK AXIS (l.193–194): NONE · STEP · RAMP · WAVE · GAUSSIAN → `fieldOf({ shape, kappa: κ, omega: the first RPA root with
  f > 10⁻³, tOn 0, tOff 40, alpha 0.05 })` along the kick axis INSTEAD of the δ-kick (kick() l.395–396). A change drops the run (the next KICK inits).
- **lab/verbs.js** (h) — `vibrate { on, mode?, amp?, breathe? }` (l.26) and the inventory's `vibrating: "vibrating ν₂ 2043 cm⁻¹ · A₁ at 1.0 Q₀"`
  (l.104, absent while off); `tools/gemma/verb-doc.mjs` lists it (the broker's prompt regenerates).
- **docs/STATE-SCOPES.md** — `instruments.chem.vibrate`, `instruments.chem.pulse` (PROJECT, default-absent).
- **tests/vibrate.test.mjs** (i, 56 lines, 0.6 s) — every record validates, a damaged one does not; water's decode; water's 3 curvatures from 6 live
  solves ≤ 0.1 cm⁻¹ of PySCF; `chem.vib.frames` refuses unsolved, then K = 32, cos-even, q[0] = Q₀; it reproduces water's recorded ρ relL2 and
  trace at Q₀ and 4Q₀ against live re-solves to the recorded 3 digits; every record's `pass` is its numbers against its gates; benzene from its record.

## The generator's wall time and the records (node 22, one thread)
| id | AO | modes | wall | bytes |
|---|---|---|---|---|
| H₂O | 7 | 3 | 0.5 s | 2,878 |
| C₆H₆ | 36 | 30 | 146.9 s | 227,210 |
| N₂ | 10 | 1 | 0.4 s | 1,893 |
| CO₂ | 15 | 4 | 1.8 s | 7,150 |
| NH₃ | 8 | 6 | 1.0 s | 5,314 |
| CH₄ | 9 | 9 | 1.7 s | 8,585 |
| HF | 6 | 1 | 0.1 s | 1,540 |
| H₂CO | 12 | 6 | 1.8 s | 7,846 |
| C₂H₄ | 14 | 12 | 5.2 s | 18,761 |
Benzene is over the brief's "under a minute" (it is required); every optional molecule is under 6 s. Benzene's 147 s are 151 SCFs + 90 ρ grids.

## The numbers: curvature vs PySCF (gate ≤ 0.1 cm⁻¹ — PASSES for all 72 modes, worst 0.058 cm⁻¹, N₂), ρ relL2 and trace at Q₀ / 2Q₀ / 4Q₀
Gates in each record: ρ relL2 ≤ 2.5·10⁻⁴ (water) / 7·10⁻⁴ (benzene; I applied benzene's to the optional seven) at Q₀, ≤ 1.1·10⁻³ at 4Q₀; |Tr(DS) − N| ≤ 10⁻² at ≤ 2Q₀.
**Verdicts:** curvature 9/9 · relL2 at Q₀ 8/9 (water misses: 3.32·10⁻⁴ — NACRE's measured floor) · relL2 at 4Q₀ 1/9 (only N₂; benzene 1.12·10⁻³) ·
trace ≤ 2Q₀ 7/9 (CO₂ 1.56·10⁻², NH₃ 1.60·10⁻² miss). LINEAR alone is given beside: on these unoptimised geometries one McWeeny step buys about 1.5–5× at Q₀ and 2–4× at 4Q₀.

#### H2O · 7 AO · 3 modes · 2878 B · |g|max 0.0614 Eh/bohr · 6625ecd5d245
| mode | irrep | ours cm⁻¹ | PySCF cm⁻¹ | Δ (gate 0.1) | Q₀ bohr | ρ relL2 Q₀ / 2Q₀ / 4Q₀ | LINEAR alone Q₀ / 4Q₀ | |Tr(DS)−N| Q₀ / 2Q₀ / 4Q₀ |
|---|---|---|---|---|---|---|---|---|
| ν₁ | A₁ | 4488.076 | 4488.053 | 2.3e-2 | 0.1601 | 0.000332 / 0.00128 / 0.00478 | 0.000446 / 0.00568 | 0.0000275 / 0.000393 / 0.00495 |
| ν₂ | A₁ | 2043.107 | 2043.106 | 4.0e-4 | 0.2334 | 0.000147 / 0.000673 / 0.00547 | 0.00077 / 0.0141 | 0.000261 / 0.00409 / 0.0591 |
| ν₃ | B₂ | 4790.319 | 4790.295 | 2.3e-2 | 0.1524 | 0.00033 / 0.00128 / 0.00464 | 0.000481 / 0.0068 | 0.0000151 / 0.000247 / 0.00421 |
gates: Q₀ 0.00025, 4Q₀ 0.0011, trace ≤2Q₀ 0.01 → pass {"curvature":true,"relL2Q0":false,"relL2At4":false,"trace":true}

#### C6H6 · 36 AO · 30 modes · 227210 B · |g|max 0.00666 Eh/bohr · fbd9c8e9901b
| mode | irrep | ours cm⁻¹ | PySCF cm⁻¹ | Δ (gate 0.1) | Q₀ bohr | ρ relL2 Q₀ / 2Q₀ / 4Q₀ | LINEAR alone Q₀ / 4Q₀ | |Tr(DS)−N| Q₀ / 2Q₀ / 4Q₀ |
|---|---|---|---|---|---|---|---|---|
| ν₁ | A₁g | 3680.563 | 3680.558 | 5.0e-3 | 0.1719 | 0.0000231 / 0.0000924 / 0.000361 | 0.0000646 / 0.000861 | 0.00000618 / 0.0000849 / 0.00112 |
| ν₂ | A₁g | 1162.662 | 1162.662 | 5.0e-4 | 0.1336 | 0.0000094 / 0.000038 / 0.000147 | 0.0000451 / 0.000678 | 0.00000344 / 0.0000424 / 0.000633 |
| ν₃ | A₂g | 1609.186 | 1609.186 | 8.0e-4 | 0.2447 | 0.0000162 / 0.0000673 / 0.000313 | 0.000171 / 0.0023 | 0.0000523 / 0.000835 / 0.0128 |
| ν₄ | B₂g | 1237.897 | 1237.896 | 8.0e-4 | 0.2809 | 0.0000403 / 0.000162 / 0.000672 | 0.000174 / 0.00266 | 0.0000751 / 0.0012 / 0.0184 |
| ν₅ | B₂g | 843.042 | 843.042 | -1.0e-4 | 0.1943 | 0.0000369 / 0.000147 / 0.000612 | 0.0000424 / 0.000693 | 0.0000193 / 0.00032 / 0.00503 |
| ν₆a | E₁g | 1070.011 | 1070.009 | 2.2e-3 | 0.3001 | 0.0000551 / 0.000218 / 0.000921 | 0.000231 / 0.00345 | 0.000136 / 0.00213 / 0.0317 |
| ν₆b | E₁g | 1070.012 | 1070.009 | 2.5e-3 | 0.3001 | 0.000054 / 0.000214 / 0.000907 | 0.000231 / 0.00348 | 0.000136 / 0.00214 / 0.0318 |
| ν₇a | E₂g | 3656.254 | 3656.246 | 7.4e-3 | 0.1735 | 0.0000355 / 0.000137 / 0.000512 | 0.0000855 / 0.00117 | 0.00000863 / 0.000127 / 0.00171 |
| ν₇b | E₂g | 3656.254 | 3656.246 | 7.6e-3 | 0.1735 | 0.0000376 / 0.000153 / 0.000654 | 0.0000957 / 0.00175 | 0.00000983 / 0.000169 / 0.003 |
| ν₈a | E₂g | 1923.891 | 1923.889 | 2.1e-3 | 0.1101 | 0.00002 / 0.0000703 / 0.000225 | 0.0000727 / 0.000819 | 0.0000121 / 0.000203 / 0.00322 |
| ν₈b | E₂g | 1923.891 | 1923.889 | 2.1e-3 | 0.1101 | 0.0000202 / 0.0000733 / 0.000255 | 0.0000739 / 0.000954 | 0.0000126 / 0.000195 / 0.00298 |
| ν₉a | E₂g | 1381.644 | 1381.643 | 8.0e-4 | 0.2771 | 0.0000206 / 0.0000815 / 0.000334 | 0.000168 / 0.00221 | 0.0000559 / 0.000868 / 0.0127 |
| ν₉b | E₂g | 1381.644 | 1381.643 | 9.0e-4 | 0.2771 | 0.0000207 / 0.0000823 / 0.000371 | 0.000179 / 0.0027 | 0.0000589 / 0.000928 / 0.0145 |
| ν₁₀a | E₂g | 702.888 | 702.888 | 4.0e-4 | 0.1663 | 0.0000204 / 0.0000714 / 0.00024 | 0.0000612 / 0.000663 | 0.0000132 / 0.00021 / 0.0033 |
| ν₁₀b | E₂g | 702.888 | 702.888 | 3.0e-4 | 0.1663 | 0.0000228 / 0.0000919 / 0.000335 | 0.0000686 / 0.001 | 0.0000131 / 0.00021 / 0.00332 |
| ν₁₁ | A₂u | 858.595 | 858.594 | 1.4e-3 | 0.3595 | 0.0000404 / 0.000166 / 0.000792 | 0.000211 / 0.00326 | 0.000169 / 0.00268 / 0.0403 |
| ν₁₂ | B₁u | 3637.958 | 3637.953 | 5.0e-3 | 0.1744 | 0.000028 / 0.000113 / 0.000473 | 0.0000716 / 0.00121 | 0.00000606 / 0.000105 / 0.00173 |
| ν₁₃ | B₁u | 1154.376 | 1154.375 | 3.0e-4 | 0.1277 | 0.0000193 / 0.0000763 / 0.000314 | 0.000104 / 0.00157 | 0.000016 / 0.000247 / 0.00389 |
| ν₁₄ | B₂u | 1398.067 | 1398.066 | 1.0e-3 | 0.2837 | 0.000021 / 0.0000821 / 0.000323 | 0.000167 / 0.00248 | 0.0000565 / 0.000905 / 0.0142 |
| ν₁₅ | B₂u | 1128.745 | 1128.713 | 3.2e-2 | 0.1225 | 0.0000292 / 0.000136 / 0.00112 | 0.000174 / 0.00217 | 0.000596 / 0.00956 / 0.154 |
| ν₁₆a | E₁u | 3669.888 | 3669.880 | 7.6e-3 | 0.1725 | 0.0000371 / 0.000148 / 0.000596 | 0.0000927 / 0.00156 | 0.00000961 / 0.000155 / 0.00257 |
| ν₁₆b | E₁u | 3669.887 | 3669.880 | 7.4e-3 | 0.1725 | 0.000037 / 0.000148 / 0.000607 | 0.0000907 / 0.00155 | 0.00000959 / 0.000155 / 0.00259 |
| ν₁₇a | E₁u | 1775.376 | 1775.376 | 7.0e-4 | 0.1829 | 0.0000279 / 0.000106 / 0.000365 | 0.00013 / 0.00152 | 0.0000299 / 0.000471 / 0.00726 |
| ν₁₇b | E₁u | 1775.376 | 1775.376 | 8.0e-4 | 0.1829 | 0.0000279 / 0.000107 / 0.000372 | 0.00013 / 0.00155 | 0.0000295 / 0.000471 / 0.00725 |
| ν₁₈a | E₁u | 1229.663 | 1229.663 | 3.0e-4 | 0.2417 | 0.0000191 / 0.0000726 / 0.000246 | 0.0000945 / 0.00115 | 0.0000184 / 0.000295 / 0.00462 |
| ν₁₈b | E₁u | 1229.663 | 1229.663 | 3.0e-4 | 0.2417 | 0.0000193 / 0.0000757 / 0.000282 | 0.0000954 / 0.00133 | 0.0000187 / 0.000295 / 0.00461 |
| ν₁₉a | E₂u | 1214.599 | 1214.597 | 1.5e-3 | 0.2733 | 0.0000581 / 0.00023 / 0.000935 | 0.000212 / 0.00318 | 0.000104 / 0.00163 / 0.0245 |
| ν₁₉b | E₂u | 1214.599 | 1214.597 | 1.4e-3 | 0.2733 | 0.0000589 / 0.000233 / 0.000958 | 0.000212 / 0.00317 | 0.000103 / 0.00162 / 0.0242 |
| ν₂₀a | E₂u | 489.111 | 489.111 | 1.0e-4 | 0.2815 | 0.0000461 / 0.000182 / 0.000718 | 0.0000594 / 0.000914 | 0.0000716 / 0.00113 / 0.0176 |
| ν₂₀b | E₂u | 489.111 | 489.111 | 2.0e-4 | 0.2815 | 0.0000462 / 0.000182 / 0.000714 | 0.0000598 / 0.000923 | 0.0000712 / 0.00113 / 0.0176 |
gates: Q₀ 0.0007, 4Q₀ 0.0011, trace ≤2Q₀ 0.01 → pass {"curvature":true,"relL2Q0":true,"relL2At4":false,"trace":true}

#### N2 · 10 AO · 1 modes · 1893 B · |g|max 0.145 Eh/bohr · 69a066c896ce
| mode | irrep | ours cm⁻¹ | PySCF cm⁻¹ | Δ (gate 0.1) | Q₀ bohr | ρ relL2 Q₀ / 2Q₀ / 4Q₀ | LINEAR alone Q₀ / 4Q₀ | |Tr(DS)−N| Q₀ / 2Q₀ / 4Q₀ |
|---|---|---|---|---|---|---|---|---|
| ν₁ | Σg⁺ | 2988.643 | 2988.585 | 5.8e-2 | 0.0536 | 0.0000209 / 0.0000719 / 0.000341 | 0.000163 / 0.00274 | 0.000021 / 0.00036 / 0.00637 |
gates: Q₀ 0.0007, 4Q₀ 0.0011, trace ≤2Q₀ 0.01 → pass {"curvature":true,"relL2Q0":true,"relL2At4":true,"trace":true}

#### CO2 · 15 AO · 4 modes · 7150 B · |g|max 0.0722 Eh/bohr · 5e0d94477019
| mode | irrep | ours cm⁻¹ | PySCF cm⁻¹ | Δ (gate 0.1) | Q₀ bohr | ρ relL2 Q₀ / 2Q₀ / 4Q₀ | LINEAR alone Q₀ / 4Q₀ | |Tr(DS)−N| Q₀ / 2Q₀ / 4Q₀ |
|---|---|---|---|---|---|---|---|---|
| ν₁ | Σg⁺ | 1571.325 | 1571.317 | 7.8e-3 | 0.0692 | 0.0000506 / 0.000166 / 0.00048 | 0.0000952 / 0.000852 | 0.00000716 / 0.000107 / 0.00158 |
| ν₂ | Σu⁺ | 2829.081 | 2829.042 | 3.9e-2 | 0.0575 | 0.000182 / 0.000655 / 0.00231 | 0.00023 / 0.00333 | 0.0000319 / 0.00051 / 0.00825 |
| ν₃a | Πu | 421.368 | 421.352 | 1.6e-2 | 0.1489 | 0.000379 / 0.00156 / 0.00969 | 0.000867 / 0.014 | 0.000991 / 0.0156 / 0.233 |
| ν₃b | Πu | 421.368 | 421.352 | 1.6e-2 | 0.1489 | 0.000379 / 0.00156 / 0.00969 | 0.000867 / 0.014 | 0.000991 / 0.0156 / 0.233 |
gates: Q₀ 0.0007, 4Q₀ 0.0011, trace ≤2Q₀ 0.01 → pass {"curvature":true,"relL2Q0":true,"relL2At4":false,"trace":false}

#### NH3 · 8 AO · 6 modes · 5314 B · |g|max 0.0285 Eh/bohr · f26e0575a626
| mode | irrep | ours cm⁻¹ | PySCF cm⁻¹ | Δ (gate 0.1) | Q₀ bohr | ρ relL2 Q₀ / 2Q₀ / 4Q₀ | LINEAR alone Q₀ / 4Q₀ | |Tr(DS)−N| Q₀ / 2Q₀ / 4Q₀ |
|---|---|---|---|---|---|---|---|---|
| ν₁ | A₁ | 4029.835 | 4029.823 | 1.2e-2 | 0.1707 | 0.000222 / 0.000874 / 0.00342 | 0.000331 / 0.00477 | 0.0000215 / 0.000317 / 0.00431 |
| ν₂ | A₁ | 1152.170 | 1152.166 | 4.1e-3 | 0.2973 | 0.000453 / 0.00227 / 0.0152 | 0.00145 / 0.0261 | 0.00101 / 0.016 / 0.243 |
| ν₃a | E | 4326.595 | 4326.574 | 2.1e-2 | 0.1596 | 0.000199 / 0.000745 / 0.00238 | 0.000308 / 0.00386 | 0.000017 / 0.000278 / 0.0048 |
| ν₃b | E | 4326.595 | 4326.574 | 2.1e-2 | 0.1596 | 0.000206 / 0.000836 / 0.00352 | 0.000312 / 0.00528 | 0.000015 / 0.000215 / 0.00289 |
| ν₄a | E | 2029.049 | 2029.048 | 1.3e-3 | 0.2362 | 0.000144 / 0.000614 / 0.00337 | 0.000503 / 0.00889 | 0.000168 / 0.00258 / 0.0361 |
| ν₄b | E | 2029.049 | 2029.048 | 1.3e-3 | 0.2362 | 0.000144 / 0.000563 / 0.00218 | 0.000466 / 0.00471 | 0.000169 / 0.0026 / 0.0362 |
gates: Q₀ 0.0007, 4Q₀ 0.0011, trace ≤2Q₀ 0.01 → pass {"curvature":true,"relL2Q0":true,"relL2At4":false,"trace":false}

#### CH4 · 9 AO · 9 modes · 8585 B · |g|max 0.00204 Eh/bohr · e02beb2c8e84
| mode | irrep | ours cm⁻¹ | PySCF cm⁻¹ | Δ (gate 0.1) | Q₀ bohr | ρ relL2 Q₀ / 2Q₀ / 4Q₀ | LINEAR alone Q₀ / 4Q₀ | |Tr(DS)−N| Q₀ / 2Q₀ / 4Q₀ |
|---|---|---|---|---|---|---|---|---|
| ν₁ | A₁ | 3492.258 | 3492.252 | 5.9e-3 | 0.1849 | 0.000248 / 0.000954 / 0.0035 | 0.000334 / 0.00455 | 0.00000612 / 0.0000868 / 0.00103 |
| ν₂a | E | 1906.298 | 1906.298 | 4.0e-4 | 0.2503 | 0.0000725 / 0.000292 / 0.00135 | 0.000553 / 0.00832 | 0.0000998 / 0.00156 / 0.0229 |
| ν₂b | E | 1906.298 | 1906.298 | 4.0e-4 | 0.2503 | 0.0000713 / 0.000283 / 0.00126 | 0.000549 / 0.00806 | 0.0000978 / 0.00149 / 0.021 |
| ν₃a | T₂ | 3750.423 | 3750.412 | 1.1e-2 | 0.1702 | 0.000186 / 0.000734 / 0.00281 | 0.000338 / 0.00532 | 0.0000137 / 0.000221 / 0.00367 |
| ν₃b | T₂ | 3750.423 | 3750.412 | 1.1e-2 | 0.1702 | 0.000186 / 0.000737 / 0.00284 | 0.000339 / 0.0054 | 0.0000137 / 0.000225 / 0.00382 |
| ν₃c | T₂ | 3750.420 | 3750.412 | 7.7e-3 | 0.1702 | 0.000185 / 0.000731 / 0.00281 | 0.000327 / 0.00513 | 0.00000997 / 0.000162 / 0.00269 |
| ν₄a | T₂ | 1684.257 | 1684.255 | 1.5e-3 | 0.2470 | 0.000173 / 0.000699 / 0.00306 | 0.000583 / 0.00751 | 0.000113 / 0.00178 / 0.0261 |
| ν₄b | T₂ | 1684.257 | 1684.255 | 1.5e-3 | 0.2470 | 0.000174 / 0.000705 / 0.00309 | 0.000583 / 0.00753 | 0.000113 / 0.00178 / 0.0261 |
| ν₄c | T₂ | 1684.257 | 1684.255 | 1.4e-3 | 0.2470 | 0.000177 / 0.000722 / 0.0033 | 0.000571 / 0.00784 | 0.00011 / 0.00173 / 0.0257 |
gates: Q₀ 0.0007, 4Q₀ 0.0011, trace ≤2Q₀ 0.01 → pass {"curvature":true,"relL2Q0":true,"relL2At4":false,"trace":true}

#### HF · 6 AO · 1 modes · 1540 B · |g|max 0.0594 Eh/bohr · 44bafaaffe61
| mode | irrep | ours cm⁻¹ | PySCF cm⁻¹ | Δ (gate 0.1) | Q₀ bohr | ρ relL2 Q₀ / 2Q₀ / 4Q₀ | LINEAR alone Q₀ / 4Q₀ | |Tr(DS)−N| Q₀ / 2Q₀ / 4Q₀ |
|---|---|---|---|---|---|---|---|---|
| ν₁ | Σ⁺ | 5005.822 | 5005.770 | 5.1e-2 | 0.1507 | 0.000336 / 0.00126 / 0.00449 | 0.000426 / 0.00546 | 0.0000124 / 0.000145 / 0.00108 |
gates: Q₀ 0.0007, 4Q₀ 0.0011, trace ≤2Q₀ 0.01 → pass {"curvature":true,"relL2Q0":true,"relL2At4":false,"trace":true}

#### H2CO · 12 AO · 6 modes · 7846 B · |g|max 0.0253 Eh/bohr · 19220a470ae7
| mode | irrep | ours cm⁻¹ | PySCF cm⁻¹ | Δ (gate 0.1) | Q₀ bohr | ρ relL2 Q₀ / 2Q₀ / 4Q₀ | LINEAR alone Q₀ / 4Q₀ | |Tr(DS)−N| Q₀ / 2Q₀ / 4Q₀ |
|---|---|---|---|---|---|---|---|---|
| ν₁ | A₁ | 3370.918 | 3370.906 | 1.2e-2 | 0.1830 | 0.000125 / 0.000515 / 0.00211 | 0.000233 / 0.00451 | 0.0000199 / 0.000373 / 0.00782 |
| ν₂ | A₁ | 2145.509 | 2145.495 | 1.4e-2 | 0.0994 | 0.000171 / 0.000635 / 0.00279 | 0.000271 / 0.00462 | 0.0000396 / 0.000666 / 0.0117 |
| ν₃ | A₁ | 1777.924 | 1777.923 | 1.1e-3 | 0.2445 | 0.0001 / 0.000386 / 0.00156 | 0.000321 / 0.0043 | 0.000111 / 0.00173 / 0.0251 |
| ν₄ | B₁ | 1319.880 | 1319.877 | 3.2e-3 | 0.2582 | 0.000175 / 0.000677 / 0.00262 | 0.000427 / 0.00621 | 0.00019 / 0.00293 / 0.0411 |
| ν₅ | B₂ | 3520.514 | 3520.499 | 1.5e-2 | 0.1751 | 0.000109 / 0.000439 / 0.00183 | 0.000242 / 0.0041 | 0.0000214 / 0.000349 / 0.00597 |
| ν₆ | B₂ | 1443.262 | 1443.260 | 1.8e-3 | 0.2484 | 0.000131 / 0.000482 / 0.00162 | 0.000278 / 0.00331 | 0.0000663 / 0.00104 / 0.0156 |
gates: Q₀ 0.0007, 4Q₀ 0.0011, trace ≤2Q₀ 0.01 → pass {"curvature":true,"relL2Q0":true,"relL2At4":false,"trace":true}

#### C2H4 · 14 AO · 12 modes · 18761 B · |g|max 0.0498 Eh/bohr · a2c8678e85a8
| mode | irrep | ours cm⁻¹ | PySCF cm⁻¹ | Δ (gate 0.1) | Q₀ bohr | ρ relL2 Q₀ / 2Q₀ / 4Q₀ | LINEAR alone Q₀ / 4Q₀ | |Tr(DS)−N| Q₀ / 2Q₀ / 4Q₀ |
|---|---|---|---|---|---|---|---|---|
| ν₁ | Ag | 3624.932 | 3624.926 | 6.8e-3 | 0.1752 | 0.0000872 / 0.00035 / 0.00133 | 0.000172 / 0.00316 | 0.00000905 / 0.00016 / 0.00312 |
| ν₂ | Ag | 1936.015 | 1936.013 | 2.7e-3 | 0.1621 | 0.0000394 / 0.000158 / 0.000586 | 0.00022 / 0.00242 | 0.0000376 / 0.000577 / 0.00839 |
| ν₃ | Ag | 1563.435 | 1563.435 | 7.0e-4 | 0.2356 | 0.00000859 / 0.0000278 / 0.000229 | 0.000216 / 0.00297 | 0.0000408 / 0.000674 / 0.0114 |
| ν₄ | B₂g | 1164.237 | 1164.234 | 2.5e-3 | 0.2616 | 0.000106 / 0.000442 / 0.00237 | 0.000375 / 0.00594 | 0.000256 / 0.00403 / 0.0607 |
| ν₅ | B₃g | 3765.297 | 3765.289 | 8.2e-3 | 0.1688 | 0.0000641 / 0.000256 / 0.00103 | 0.000165 / 0.00266 | 0.00000941 / 0.000153 / 0.00254 |
| ν₆ | B₃g | 1453.945 | 1453.943 | 1.4e-3 | 0.2346 | 0.0000515 / 0.000198 / 0.000809 | 0.000282 / 0.00355 | 0.0000513 / 0.000809 / 0.0124 |
| ν₇ | Au | 1274.447 | 1274.445 | 1.2e-3 | 0.3061 | 0.0000452 / 0.00018 / 0.00079 | 0.000304 / 0.00461 | 0.0000785 / 0.00123 / 0.0183 |
| ν₈ | B₁u | 3584.665 | 3584.658 | 6.8e-3 | 0.1789 | 0.0000958 / 0.000382 / 0.00152 | 0.000168 / 0.00276 | 0.00000896 / 0.000146 / 0.00244 |
| ν₉ | B₁u | 1730.277 | 1730.275 | 1.4e-3 | 0.2503 | 0.0000381 / 0.000192 / 0.00117 | 0.000384 / 0.0053 | 0.000105 / 0.00165 / 0.0247 |
| ν₁₀ | B₂u | 3776.662 | 3776.654 | 8.1e-3 | 0.1688 | 0.0000667 / 0.000265 / 0.00104 | 0.00017 / 0.00272 | 0.0000104 / 0.000171 / 0.00282 |
| ν₁₁ | B₂u | 969.695 | 969.692 | 2.9e-3 | 0.3453 | 0.0000935 / 0.000359 / 0.00135 | 0.000316 / 0.00475 | 0.000121 / 0.00192 / 0.0304 |
| ν₁₂ | B₃u | 1167.658 | 1167.656 | 2.5e-3 | 0.2980 | 0.000122 / 0.000494 / 0.0023 | 0.000445 / 0.0065 | 0.000216 / 0.00339 / 0.05 |
gates: Q₀ 0.0007, 4Q₀ 0.0011, trace ≤2Q₀ 0.01 → pass {"curvature":true,"relL2Q0":true,"relL2At4":false,"trace":true}

## PULSES' oracle (`research/release-0.7.0/pulse-oracle.mjs`, 10.6 s)
Water, the worker's own `chem.rt.init { pulse }` / `chem.rt.run` (MMUT unrestarted, Δt 0.02, T 400 a.u., 20,000 steps a run), κ = 10⁻⁴ along x —
the polarisation of the first bright RPA root (ω₀ = 0.483101 Eh, f 0.0033). The reference is LINEAR RESPONSE from the same engine's δ-kick
(κ_k = 10⁻⁴): δμ(t) = ∫ χ(t − t′) E(t′) dt′ with κ_k χ = δμ_kick (absorb.js' meaning), and at the carrier the damped (τ 100) transforms obey R̃ = χ̃·Ẽ.

| pulse | relL2(δμ, linear response) | R̃/Ẽ at ω₀ | χ̃ (kick) at ω₀ |
|---|---|---|---|
| GAUSSIAN (α 0.05, 0 ≤ t < 40) | 4.80·10⁻³ | 1.628·10⁻² + 0.9949 i | 1.295·10⁻² + 0.9937 i |
| WAVE (cos ω₀t, 0 ≤ t < 40) | 5.05·10⁻³ | 1.278·10⁻² + 0.9902 i | ″ |
| STEP (0 ≤ t < 40) | 1.09·10⁻² | 9.80·10⁻³ + 1.005 i | ″ |

Im α at the carrier from the pulse agrees with the kick's to 0.12 % (GAUSSIAN) / 0.35 % (WAVE) / 1.1 % (STEP); the residual is the convolution's
O(Δt) quadrature against the engine's own field sampling, largest for the STEP's two jumps. No gate was set for PULSES; these are the numbers.

## Gates run at the tip
- `node tests/vibrate.test.mjs` — PASS (0.6 s).
- `./test.sh node` (after the last `pwa --write`) — **rc 0**, every suite green, `PASS vibrate` among them.
- `node tests/library.test.mjs` — rc 0 · `node tools/rack-deps.mjs --classes` — rc 0 · `node tools/new-project.mjs --check` — in step (16117 B).
- `node tools/vibrate-library.mjs --check --only` the eight small ids — in step (byte for byte); benzene's record is the one written in (b).
- `node tools/orbital-library.mjs --check` — **RED, and RED IDENTICALLY AT THE BASE**: on this machine 37 orbital records regenerate to other
  bytes than the files on disk ("is missing" / "reached by no catalogue row", 75 lines). I ran it on a clean `git archive ca00472` copy and on
  this branch: the two failure lists are **identical, line for line** (benzene regenerates to `a52ea03d…` on both against `9979c9a5…` on disk).
  So V1 neither causes nor changes it; the `vibrations` rows add no line to it. The integrator should know the base is out of step here
  (a solver/stack drift since the records were written — not investigated, not in this row).
- `tools/serialize-bytes.mjs` — run on the base tree (`git archive ca00472 lab`) and on this one, both served at 9311: **11 of 11 readings identical**
  (full and edit sha) — VIBRATE and PULSE are default-absent.
- `tests/chem.browser-test.mjs` (once, LW_PORT 9311, GD_PORT 5411): **0 failing of 56**.
- A throwaway Firefox probe (`.tmp/vib-probe.mjs`, not committed): water VIBRATE ν₂ at 2 Q₀ saves `{ mode: 1, amp: 2 }`, poses and μ(Q) change per
  frame, the caption carries the mode, BREATHE sets RATE 675 (= T) and plays; off → `atomsNow()` is the equilibrium again; benzene from its record:
  frames in 113 ms, 10 distinct poses in 1.6 s; no page errors.

## Dropped, and why
- No VIBRATE assertion added to a browser suite (the dial: no new gate code); the probe above is throwaway.
- ESP while VIBRATE plays shows the equilibrium Φ card (computed once, not per pose) — ESP along a mode is deferred by name in the plan.
- With a PULSE chosen, the card's Im α curve is still `chem.rt.spectrum` of the trace over κ (a δ-kick's normalisation): exact for the kick,
  only a response for a pulse; the plot's caption still names the kick.
- Herzberg ν numbering by the table's irrep order (benzene's is Herzberg's, not Wilson's).
- The PULSE durations are fixed (tOff 40 a.u., α 0.05); no knob for them.

## At the merge (for the integrator)
- `lab/chemview.js` is shared with V2: my edits are the fold (the VIBRATE row l.243–248, created right after `more`), the API tail
  (`atomsNow`/`dipoleNow` replaced, `vibrate`, `vibLine` added after them; `espCaption` extended), plus in-body edits V2 should not touch:
  the state line l.66, the PULSE seg l.193–194, `solve`/`fill`/`kick`/`setRun`/`densityRe`/`captureRef`/`deltaD`/`setOn`/`update`/`presentation`/`load`.
  The VIEW row is untouched. `atomsNow()` returns a new array at each pose (32 a breath), the same array between poses.
- `lab/lab.css` +1 line after `.k.off` (l.499); `lab/windows/molecules.js` api tail (l.64–65).
- `lab/library.json` now has a `vibrations` member owned by `tools/vibrate-library.mjs`; `tools/orbital-library.mjs` carries it through.
  Run `node tests/pwa.test.mjs --write` after the merge (sw.js is content-hashed).
