# Z · RELATIVITY — the build note (iteration 008, branch `it008-zora`, gate 9701 / GD 5701, from `07591a7`)

Josh asked what mathematics would make the atoms relativistic, and he said yes to scalar ZORA as a row. That is what this branch builds.

## What was built

1. **Scalar ZORA is the atom's model for every Z.** There is no switch. `lab/atoms.js` `solveAtom` runs with `zora: true` by default.
   - The non-relativistic solve is still there as `{ zora: false }`. It is byte-identical to the base: I checked E, every ε, a sha-256 of
     every u, the 1s GPU table and a virtual ε for all 86 atoms against `07591a7`'s atoms.js, and found 0 differences.
   - In the app, the non-relativistic solve is used only by the ATOMS window's **RELATIVITY Δ** button (item 4).
   - The self-interaction-free Hartree branch (`alpha: 0`) stays non-relativistic, because its oracles are: He's Hartree–Fock limit and
     hydrogen's −½.
   - The model string now ends ` · scalar ZORA` (`Xα(2/3) + Latter tail · scalar ZORA`). `EXCHANGE_MODEL` still names only the exchange.
2. **The Δ-SCF ion keeps the neutral's K** (`neutralK`, which `ionisation()` passes). Both sides of the energy difference then use one
   kinetic operator, so the difference has no gauge term. When the ion used its own K, Au's ionisation came out at 4.19 eV (see
   decision 2).
3. **The energies reported.**
   - `eps` is the scaled ZORA eigenvalue. `lam` is the unscaled operator eigenvalue; it runs the SCF and the total-energy functional.
   - `E` is the functional's value, and the Δ-SCF reads it.
   - `Escaled = E − Σ f(λ − ε)` takes out the deep core's ZORA excess:
     - Kr: −2783.55 Eh, against NIST's scalar-relativistic −2783.99.
     - Au: −18 992.5 Eh, against −18 963.1. The unscaled value is −19 664.7.
4. **ATOMS window** (`lab/atomsview.js`, with one line in `lab/windows/readouts.js`).
   - **RELATIVITY Δ** sits beside LOAD VALENCE. A press runs the non-relativistic solve under the card's busy mark (`cardLoading(wAtoms,
     'relativity')`), one `setTimeout` later so the mark paints. It never runs in a frame.
   - The result is a `Δrel` column in the shell ladder: ε_ZORA − ε_NR in eV, in each shell's colour. It is also in each bar's hover and in
     the notebook digest. It is cached per element.
   - E total shows `Escaled`, and its sub-line names the functional's value.
   - MODEL's sub-line says "scalar-relativistic (ZORA), spin–orbit not included". Past Kr it adds that the p and d levels miss their
     j = l ± ½ splitting.
   - The Δ-SCF sub-line says the neutral's ZORA operator is used on both sides.
   - Sc's crossing note now reads "α = 0.863 (0.839 without relativity)".
   - **The ZORA note (two sentences)**: "The zeroth-order regular approximation replaces the kinetic energy p²/2 by p·[c²/(2c² − V)]p, so an
     electron deep in the nuclear potential moves with the heavier relativistic mass and its s and p shells contract. The eigenvalues are
     the scaled ZORA ones, which are exact for a one-electron ion's 1s; spin–orbit splitting (j = l ± ½) is not included." It shows when
     window notes are on, like the existing **Model.** note.
5. **STATUS** (`lab/status.js`, atom owner).
   - Past Kr the line is `Rn · NUMERICAL · scalar-relativistic (ZORA) Xα; spin–orbit not included`, 70 characters.
   - The head adds the remaining gap: "no spin–orbit: a p or d level is its j = l ± ½ pair's average (Rn 6p splits by 3.6 eV)".
   - H–Kr still have no line, by Josh's call.
6. **atoms.js' header** has the derivation, the checks, the oracle and the spin–orbit caveat (the past-Kr paragraph's numbers are
   marked as the non-relativistic road's).
7. **`tests/atoms.test.mjs`: 29/29, no tolerance changed, no judge added.**
   - Judges whose oracle is non-relativistic now judge the `zora: false` road. These are the bare-Coulomb certification, the Ne/Ar totals
     and port fidelity against the ported Python solve, Sc's pinned numbers and α*, the Kr total, Ne 3s° = −0.1623602 and the nucleus's
     r^{l+1} wall law.
   - The measured-oracle gates and the per-atom sweep judge the model:
     - **Δ-SCF Ne**: 21.0877 → **21.0742 eV** (gate 21.09 ± 0.15; the tolerance held).
     - **δ_s(Na) at α = 1**: 1.37323 → **1.37431** (gate 1.373 ± 0.01; held). At α = 2/3 it is 1.32656 → 1.32756 (judge ±0.002; held).
     - K's 4s/3d (±1e-3; held), Koopmans 15.07 eV, and normalisation, nodes, charge and convergence for all 36.
   - The model-name judge expects the new strings and also checks the NR road's old string.
   - The benchmark times the ZORA solve: Kr 118–129 ms against the 2 s budget.

## The derivation, in brief
- ZORA (van Lenthe, Baerends & Snijders, JCP 99, 4597 (1993); 101, 9783 (1994)) uses T = p·(K/2)p with K = 2c²/(2c² − V) and c =
  137.035999084.
- On ψ = (u/r)Y_lm, one integration by parts gives the quadratic form ½∫[K u′² + (K′/r)u² + K l(l+1)u²/r²] dr. The radial equation is
  therefore

  **−½(K u′)′ + [K′/2r + K l(l+1)/2r² + V] u = λ u.**

- **The brief's equation omits the K′/2r term.** That term is the Darwin-like piece. I evaluated hydrogen 1s's first-order shift
  ⟨u|T_K − p²/2|u⟩ by four independent quadratures:

  | form | ⟨T_K − p²/2⟩ |
  |---|---|
  | r-form with K′/2r | −0.24995/c² |
  | the x-form below | −0.24997/c² |
  | ½∫(K−1)\|∇ψ\|² directly | −0.24999/c² |
  | without K′/2r | **−8.51/c²** |
- **In x = ln r**, with u = √r v, the form becomes ½∫K v_x² dx + ∫[½K(l+½)² + ¼K_x] v² dx against ∫r²v² dx.
  - `zoraKinetic` discretises it with K at the half-points and K_x as their difference.
  - The matrix stays symmetric tridiagonal, so one Sturm bisection still gives every shell of an l. The code with K ≡ 1 is the old
    matrix, and the NR branch keeps the old lines verbatim.
- **The wall.** At the nucleus K → 2c²r/Z, so u ∼ r^s with s² = 1 + l(l+1) − Z²/c². For s shells this is Dirac's γ. I used it as the
  wall's law y₀ = e^{−(s+½)dx} y₁.
- **The scaled energy.** Expanding the exact c²/(2c² + E − V) to first order in E gives E = λ/(1 + θ) with θ = ⟨u|p·c²/(2c² − V)² p|u⟩,
  which is the small component's norm. θ is computed on the same stencil with K → K²/2c².
- **Gauge.** K is built from the solve's own potential (V → 0 at infinity, so no gauge is chosen). It is Anderson-mixed with that
  potential to self-consistency.

### The checks (hand runs, `.tmp/zora-*.mjs`, not committed)

**Bare Coulomb, scaled ZORA against Dirac.** The 1s equals c²(√(1 − Z²/c²) − 1) to about 1e-9 relative:

| Z | scaled ZORA | Dirac |
|---|---|---|
| 10 | −50.066742007 | −50.066742 |
| 36 | −659.583511631 | −659.583512 |
| 80 | −3532.192092760 | −3532.192093 |
| 86 | −4158.424335822 | −4158.424337 |

**Low Z.** At Z = 1 every shell's shift is the Pauli mass-velocity + Darwin value:
- 2p and 3d: ratio 1.000001 and 1.000004.
- 1s: −Z⁴/8c².
- 2s: Dirac's 2s₁/₂.

**Constant added to V.** Dirac shifts by exactly C. The scaled ZORA shift does not move either: −11.58348 at C = 0, 100 and 130 for
Z = 36. The unscaled shift moves by 2.3 Eh.

**Mesh.** M 999 → 1999 and r_max 60 → 90 move Kr's 1s shift by < 1e-5 Eh and Au's 6s shift by < 2e-5 Eh.

## THE ORACLE — the shift
Our (ZORA − NR) eigenvalue shift against NIST's (ScRLDA − LDA), from Kotochigova, Levine, Shirley, Stiles & Clark, Phys. Rev. A 55, 191
(1997) (math.nist.gov/DFTdata/atomdata/tables/), in hartree.

| level | ours ZORA − NR | NIST ScRLDA − LDA | ratio | Δ (eV) |
|---|---|---|---|---|
| Rn 1s | −409.065 | −394.100 | 1.038 | −407 (0.4 % of ε) |
| Rn 6p | +0.000763 | +0.003289 | 0.23 | −0.069 |
| Au 6s | −0.04995 | −0.05967 | 0.84 | +0.264 |
| Au 5d | +0.03635 | +0.04233 | 0.86 | −0.163 |
| Hg 6s | −0.05134 | −0.05542 | 0.93 | +0.111 |
| Pb 6p | +0.001324 | +0.005720 | 0.23 | −0.120 |
| Kr 1s | −9.139 | −7.671 | 1.19 | −40.0 |
| Ar 1s | −0.4706 | −0.2906 | 1.62 | −4.90 |
| Ne 1s | −0.03781 | −0.00973 | 3.89 | −0.764 |
| *Ag 5s* | −0.01276 | −0.01509 | 0.85 | +0.063 |
| *Cs 6s* | −0.00371 | −0.00292 | 1.27 | −0.021 |
| *Xe 5p* | +0.000749 | +0.001722 | 0.44 | −0.027 |
| *Kr 4p* | +0.000697 | +0.001179 | 0.59 | −0.013 |
| *H 1s* | −6.66e-6 | +8.0e-6 | — | −0.0004 |

**The Δ-SCF ionisation shifts are close:**

| atom | ours ZORA | ours NR | our shift | NIST ScRLDA | NIST LDA | NIST shift | measured |
|---|---|---|---|---|---|---|---|
| **Au** | **8.706** | 6.702 | **+2.003** | 9.715 | 7.606 | +2.109 | 9.2255 |
| Hg | 9.867 | 7.928 | +1.940 | 10.993 | 9.013 | +1.980 | 10.4375 |
| Ag | 7.181 | 6.643 | +0.538 | 8.069 | 7.496 | +0.573 | 7.5762 |
| Cs | 3.524 | 3.391 | +0.133 | 3.990 | 3.836 | +0.154 | 3.8939 |
| Pb | 5.802 | 5.915 | −0.113 | 6.823 | 6.933 | −0.110 | 7.4167 |
| Rn | 10.697 | 10.715 | −0.018 | 11.935 | 11.955 | −0.020 | 10.7485 |

(eV.) **Au's 6s ionisation is now 8.71 eV**, up from 6.70, against a measured 9.23. Relativity closed 2.00 of the 2.52 eV gap. The rest
is the model: Xα exchange with no correlation, and no spin–orbit.

**What the eigenvalue table says.**
- **The 1s shifts at Rn agree to 4 %.** At small Z ours are larger: ×1.19 at Kr, ×3.9 at Ne. The kinetic operator is not the cause.
  NIST's methodology page says its RLDA and ScRLDA columns "use the relativistic corrections to the energy density functional proposed by
  MacDonald and Vosko". That is a weaker exchange at core densities, which lifts the 1s.
- I checked this with a throwaway copy that puts the MacDonald–Vosko factor R(β) = −½ + 3 ln(β + η)/(2βη) on our V_x (β = (3π²ρ)^{1/3}/c,
  η = √(1+β²)). The 1s ratios become Rn 0.97, Kr 0.95, Ar 0.89 and Ne 0.60. The valence and the Δ-SCF barely move (Au +1.99 eV).
- **Valence ε shifts.** These are within 0.12 eV for Rn 6p, Hg 6s, Pb 6p, Ag 5s, Cs 6s, Xe 5p and Kr 4p. Au is outside that: 6s is
  −1.36 eV against −1.62 (0.26 eV), and 5d is 0.16 eV off.
- So the brief's "valence to ≈ 0.1 eV" holds except at gold, and "1s to a few per cent" holds at Rn and, with NIST's relativistic
  exchange, at Kr.
- The p shifts are a quarter of NIST's (Rn 6p, Pb 6p). That small positive number is a near-cancellation between the direct stabilisation
  and the core's extra screening. A difference of 0.07–0.12 eV there is the scale of the exchange-functional difference.
- **H** moves by −1.811e-4 eV. The Latter tail makes Xα hydrogen's potential exactly −1/r, so its ZORA 1s is Dirac's (−Z⁴/8c²). NIST's
  LDA hydrogen has self-interaction, and its shift is +8e-6 Eh.

**Decision: the model does not take MacDonald–Vosko.** The row is the ZORA kinetic operator. Relativistic exchange is a functional
change, about 6 lines (R(β) on V_x and Φ(β) on E_x). It is proposed as a follow-up, not shipped.

## H … Kr: the shift of the valence level (ε_ZORA − ε_NR, eV; "ppm" is relative to |ε_NR|)
| atom | valence | Δ (eV) | relative | 1s Δ (eV) |
|---|---|---|---|---|
| H | 1s | −1.811e-4 | −13.3 ppm | −1.811e-4 |
| He | 1s | −5.261e-4 | −26.0 ppm | −5.261e-4 |
| Li | 2s | −3.892e-4 | −73.9 ppm | −2.627e-3 |
| Be | 2s | −1.077e-3 | −153.7 ppm | −1.223e-2 |
| B | 2p | +1.141e-3 | +215 ppm | −4.055e-2 |
| C | 2p | +2.294e-3 | +330 ppm | −1.002e-1 |
| N | 2p | +3.873e-3 | +442 ppm | −2.072e-1 |
| O | 2p | +5.965e-3 | +556 ppm | −3.815e-1 |
| F | 2p | +8.723e-3 | +680 ppm | −6.464e-1 |
| Ne | 2p | +1.215e-2 | +806 ppm | −1.029 |
| Na | 3s | −5.796e-3 | −1193 ppm | −1.542 |
| Mg | 3s | −9.068e-3 | −1545 ppm | −2.228 |
| Al | 3p | +3.757e-3 | +947 ppm | −3.149 |
| Si | 3p | +5.920e-3 | +1165 ppm | −4.341 |
| P | 3p | +7.720e-3 | +1212 ppm | −5.849 |
| S | 3p | +9.504e-3 | +1222 ppm | −7.724 |
| Cl | 3p | +1.142e-2 | +1229 ppm | −10.02 |
| Ar | 3p | +1.350e-2 | +1237 ppm | −12.81 |
| K | 4s | −1.285e-2 | −0.33 % | −16.12 |
| Ca | 4s | −1.834e-2 | −0.40 % | −20.04 |
| Sc | 4s | −3.552e-2 | −0.71 % | −24.81 |
| Ti | 4s | −4.595e-2 | −0.86 % | −30.34 |
| V | 4s | −5.621e-2 | −1.00 % | −36.76 |
| Cr | 4s | −7.778e-2 | −1.43 % | −44.31 |
| Mn | 4s | −7.910e-2 | −1.30 % | −52.63 |
| Fe | 4s | −9.178e-2 | −1.45 % | −62.29 |
| Co | 4s | −1.060e-1 | −1.62 % | −73.23 |
| Ni | 4s | −1.213e-1 | −1.80 % | −85.59 |
| Cu | 4s | −1.468e-1 | −2.34 % | −99.72 |
| Zn | 4s | −1.556e-1 | −2.18 % | −115.0 |
| Ga | 4p | +7.008e-3 | +0.17 % | −132.1 |
| Ge | 4p | +1.276e-2 | +0.26 % | −151.0 |
| As | 4p | +1.581e-2 | +0.26 % | −172.1 |
| Se | 4p | +1.764e-2 | +0.24 % | −195.2 |
| Br | 4p | +1.831e-2 | +0.22 % | −220.7 |
| Kr | 4p | +1.895e-2 | +0.19 % | −248.7 |

I worked out the order of magnitude before trusting the solver. H's −1.8e-4 eV is −Z⁴/8c², Kr's 4p is +0.019 eV, and that is what came
out.

**"Parts per million" is true for H and He only.** The first row moves by 10²–10³ ppm. A 3d-row 4s moves by up to 2.3 % (Cu −0.15 eV),
because the 4s penetrates to the nucleus and the 3d's contraction does not screen it.

## Cost
Node, on a host at load average 17 (three solvers and a volume pack on the machine). The numbers flake, so read the spread:

| | ZORA cold | ZORA warm | NR cold | NR warm |
|---|---|---|---|---|
| Au | 443–509 ms | 255–317 ms | 453–473 ms | 263–393 ms |
| Rn | 452 ms | 253–333 ms | 488 ms | 275–373 ms |

- ZORA's K costs nothing measurable. It adds a few multiplies per mesh point and one more tridiagonal (θ) per shell, against the Sturm
  bisection. (A measured Au cold 384 ms on a quieter machine.)
- In Firefox, a RELATIVITY Δ press took 212 ms for Fe, 270 for Ag, 268 for Cs, 290 for Au and 384 for Rn. That includes the 30 ms tick and
  20 ms polling. The busy mark was seen every time.
- The solves stay lazy and cached. Nothing new happens at boot.

## THE LOCK ×2: held, no re-capture
- `LW_PORT=9701 GD_PORT=5701 node tools/perf/digest-lock.mjs --check --query gastab=0`: **GREEN, 843 values compared, 0 readback
  differences, 0 record-byte differences, page errors 0** (63 s).
- The same with `--fixture research/release-0.4.0/measure/digest-lock-s4a.json`: **GREEN, 987 values, 0 differences** (63 s).
- No ATOM state is in either fixture, and hydrogen's closed form (`lab/hydrogen.js`) is untouched, so this was the expected result.

## The el- pictures (1–86)
`LW_PORT=9701 GD_PORT=5701 node tools/menu-thumbs.mjs --set elements` re-rendered all 86. The comparison against the committed pictures is
below (`.tmp/thumb-diff.py`: mean and max |Δ| of the decoded RGBA, and the share of pixels off by more than 24 of 255).

**The renders are deterministic, so every difference below is ZORA's.** To check this I switched the default to the non-relativistic road
for a moment (code put back) and rendered 14 elements (H, Ne, Na, Fe, Kr, Cs, Ce, Os, Tm, Yb, Au, Hg, Pb, Rn). All 14 came out
bit-identical to the committed pictures. Repeating a ZORA render was also bit-identical.

| tile | mean \|Δ\| (of 255) | max | pixels off by > 24 |
|---|---|---|---|
| H | 0.81 | 140 | 0.24 % |
| Ne | 1.56 | 209 | 1.7 % |
| Fe | 2.96 | 239 | 5.3 % |
| Kr | 2.66 | 213 | 4.6 % |
| Cs | 1.99 | 224 | 2.9 % |
| Au | 3.66 | 251 | 5.8 % |
| Hg | 2.80 | 242 | 5.1 % |
| Pb | 1.94 | 216 | 2.9 % |
| Rn | 2.40 | 222 | 4.6 % |
| Os | 5.28 | 247 | 8.7 % |
| Ce | 4.19 | 247 | 9.9 % |
| Tm | 9.06 | 255 | 18.7 % |
| Yb | 9.31 | 255 | 22.4 % |

- Over all 86 tiles: median mean |Δ| 2.70, median share 4.6 %. The tiles over 10 % are the twelve 4f lanthanides Pr–Yb.
- **Nothing differs by eye.** Each tile is cropped to its own alpha box, so a contraction rescales away. What is left is where the soft
  lobe edges fall on the 200 px grid.
- H is the floor of that effect: its ε moves by 13 ppm, and the table's domain radius moves enough to resample a few edge pixels.
- The 4f tiles move most because ZORA's indirect screening lifts the 4f, which expands it (+13 eV at Au). That reshapes the soft edge of
  every lobe.
- `research/iteration-008/z-build/el-before-after.png` shows H, Fe, Au and Yb side by side.
- `lab/img/menu/manifest.json` is unchanged, since the settings and the list are the same.

## Screenshots (`research/iteration-008/z-build/`)
- `au-atoms-window.png`: Au's ATOMS window as it ships (LEAN). RELATIVITY Δ has been pressed, and the shell ladder carries its `Δrel`
  column: 1s −7532 eV, 2s −2024, 2p −566, 3d +17, 4f +13, 5d +0.989, 6s −1.36. LOAD VALENCE and RELATIVITY Δ sit side by side.
- `el-before-after.png`: the Picker tiles of H, Fe, Au and Yb, non-relativistic beside ZORA.
- `au-atoms-window-readouts.png`: the same card with LEAN off. MODEL reads `Xα(2/3) + Latter tail · scalar ZORA`, E total
  −18992.45469 Eh (scaled ZORA), IONISATION Δ-SCF 8.706 eV, Koopmans −ε = 6.934 eV, δ_s 4.5993, and the close-shell note: 5d and 6s
  0.0156 Eh apart.

The light check (`.tmp/look-zora.mjs`, Firefox, gate 9701): I opened Fe, Ag, Cs, Au and Rn. Every RELATIVITY Δ column filled, and there
were no page errors.
- STATUS was "—" for Fe and `<sym> · NUMERICAL · scalar-relativistic (ZORA) Xα; spin–orbit not included` for Ag, Cs, Au and Rn.
- Some Δrel values:

  | atom | 1s | valence |
  |---|---|---|
  | Fe | −62.3 eV | 4s −0.092, 3d +0.245 |
  | Ag | −775 eV | 5s −0.347, 4d +0.376 |
  | Cs | −1520 eV | 6s −0.101, 5p +0.093 |
  | Au | −7532 eV | 6s −1.359, 5d +0.989 |
  | Rn | −11 131 eV | 6s −5.16, 6p +0.021 |

## Decisions
1. **The non-relativistic judges judge the non-relativistic road.** Their oracles are non-relativistic: the Schrödinger −Z²/2n², the HF
   limits and the ported Python solve. Judging ZORA against them would be wrong physics. Widening their tolerances would have hidden
   that, so they now pass `{ zora: false }`. The model is judged by the measured gates, the 36-atom sweep, and the hand-run Dirac/Pauli/NIST
   checks above. Josh said no new judges, so the Dirac check is not a gate.
2. **The ion keeps the neutral's K.** I measured the alternative, where the ion uses its own K. Then the core's unscaled-ZORA gauge term
   sits inside the difference:

   | atom | ion's own K | neutral's K |
   |---|---|---|
   | Au | 4.19 eV | 8.71 eV |
   | Ag | 5.94 eV | 7.18 eV |
   | Ne | 21.000 eV | 21.074 eV |

   As a cross-check, the ion's own K with *scaled* totals gives 8.715 eV for Au and 7.183 eV for Ag, the same as the neutral's K. With one
   K the difference is variational and gauge-free, and it lands within 5 % of NIST's shifts.
3. **Large-component density only** (standard ZORA). As an experiment I added the small component χ = (K/2c)σ·∇φ to the density. It moved
   the eigenvalues by ~3 % and broke the Δ-SCF (Au +4.3 eV), because the energy functional no longer matched the density. I removed it.
4. **Point nucleus**, as NIST uses. The s shells then carry ZORA's weak r^{s−1} rise at the nucleus. The GPU table's r = 0 sample is still
   R(r₀), so a heavy atom's 1s has a taller first sample than the next one (Kr 1s: 710 against 482). The old NR wall test is kept on the
   NR road for that reason. A finite nucleus would round it off. It would move Rn's 1s by under 0.1 % of the shift, and I did not do it.
5. **`groundConfig` and `ZMAX` are untouched** (A7 is changing them in parallel). My atoms.js edits are in the header, the solver section
   (`zoraOf`, `zoraKinetic`, `solveL`), `scf`, `solveAtom`, `frozenChannel`, `ionisation` and `modelName`/`RELATIVITY`.

## Proposed CLAUDE.md sentences (the integrator's)
- In the LEGACY paragraph, after "ATOMS left that list in 0.4.0 (R-A2) …": "Since iteration 008 Z the ATOM's central field is SCALAR ZORA
  (`lab/atoms.js` `zoraKinetic`; the scaled eigenvalue reported, the Δ-SCF ion in the neutral's K, spin–orbit not included). The
  non-relativistic solve is `{ zora: false }`, byte-identical to A's, and is read only by the ATOMS window's RELATIVITY Δ (a press, the
  busy mark, never a frame) and by `tests/atoms.test.mjs`' non-relativistic oracles."
- In the STATUS sentence: "past Kr the atom's STATUS reads `<sym> · NUMERICAL · scalar-relativistic (ZORA) Xα; spin–orbit not included`;
  H–Kr no line."

## Tests
| run | result |
|---|---|
| `node tests/atoms.test.mjs` | 29/29 GREEN |
| `./test.sh node` | exit 0 (41 suites GREEN; pwa after `--write`) |
| `node tests/status.test.mjs` | GREEN (491 strings within 110 characters; the R_m caption unchanged) |
| `node tools/rack-deps.mjs --classes --no-write` | clean (no new crossing: `cardLoading` was already destructured in readouts.js) |
| THE LOCK × 2 | GREEN 843/0 and 987/0, no re-capture |
| `molecule-head.browser-test` | GREEN |
| `start.browser-test` | GREEN 3/3 |
| light check Fe · Ag · Cs · Au · Rn | the RELATIVITY Δ column filled; STATUS as specified; 0 page errors |

## Next
- **Spin–orbit** (j = l ± ½): ZORA's σ·(∇K × p) term needs labels in j. The register is n l m, so this is a basis change, the same scale as
  A7's n = 7.
- **MacDonald–Vosko relativistic exchange** (about 6 lines) would close the light-atom 1s gap to NIST.
- A7's Fr–Og atoms will inherit ZORA. Past Z ≈ 100 s₁/₂ = √(1 − Z²/c²) is still real (Z < 137), but a finite nucleus becomes
  worthwhile there.
