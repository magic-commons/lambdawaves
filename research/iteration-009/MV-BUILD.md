# MV · MACDONALD–VOSKO — the build note (iteration 009, branch `it009-mv`, gate 9331 / GD 5331, from `033424d`)

Josh (2026-10-19) said yes to Yan's call 7: "MacDonald–Vosko relativistic exchange (≈ 6 lines; closes the light-atom 1s gap to NIST)".
Row Z (iteration 008) made scalar ZORA the atom's model, checked the MacDonald–Vosko factor on a throwaway copy, and named it as the next step
(`research/iteration-008/Z-BUILD.md` § THE ORACLE and § Next). This row ships it.

## Verdict first

- **The light-atom 1s gap closes, as claimed.** Against NIST's relativistic shift (ScRLDA − LDA), our 1s shift goes from ×3.89 to ×0.60 (Ne),
  ×1.62 → ×0.89 (Ar), ×1.19 → ×0.95 (Kr). In eV, the Ne 1s shift misses NIST's by 0.11 eV instead of 0.76; Ar by 0.90 instead of 4.90.
- **The scaled total energy's relativistic shift now matches NIST's to 0.04–0.13 %** from Ne to Rn. Before MV it was 3–41 % too large.
  This is the strongest evidence that the change is right.
- **One condition of the brief does not hold, and Josh should decide.** For the 4d/5d metals (Ag, Au, Hg), MV moves the valence s and d
  shifts **further** from NIST's, by 0.015–0.041 eV. Au's Δ-SCF ionisation drops from 8.706 to **8.653 eV** (measured 9.23). The noble-gas p
  levels, Cs 6s and Pb 6p move closer. Ar 3p's shift moves 0.1 meV further away. The full table and the cause are below.
- **Hydrogen.** Its potential, ε and u are bit-identical, because the Latter tail already makes its potential exactly −1/r. Its total
  energy E does move, by **+1.0e-5 Eh**, so the brief's "not beyond 1e-6" fails for E. This is the right physics: Xα's self-exchange times
  Φ, and the leading-order formula predicts the number to four digits. H's Δ-SCF ionisation moves by −2.7e-4 eV.
- THE LOCK held ×2 (atoms are not in it). All 118 atoms converge below 1e-8. The el- pictures are **not** re-rendered: a controlled
  render shows only edge-pixel resampling (below).

## What was built

1. **`lab/atoms.js`**. On the relativistic road (`zora`, the model, every Z, no switch), the exchange potential is multiplied by R(β) and
   the exchange energy density by Φ(β). The changes are:
   - `mvR` and `mvPhi`, plus the constant `MV_K = (3π²)^{1/3}/c`. Below β = 10⁻³ each uses its series, because the closed forms are 0/0 at
     ρ = 0.
   - One branch each in `scf`, in the V_x line and the E_x integral.
   - The non-relativistic road `{ zora: false }` keeps the old lines verbatim and is **byte-identical**. I checked E, every ε and a
     sha-256 of every u for Z = 1…118 against `033424d`, and found 0 differences.
   - `RELATIVITY` is now `' · scalar ZORA · MV'`, so a solve's model reads `Xα(2/3) + Latter tail · scalar ZORA · MV`.
   - The header has a new RELATIVISTIC EXCHANGE paragraph (the derivation, the checks, the oracle and the cost), and Z's paragraph is
     re-dated.
2. **ATOMS window** (`lab/atomsview.js`).
   - The MODEL sub-line reads `scalar-relativistic (ZORA · MV), spin–orbit not included`.
   - The RELATIVITY Δ hover reads `(ε_ZORA·MV − ε_NR)`. The button's title says the second solve uses "p²/2, plain exchange".
   - The ZORA note gains one clause: "the exchange carries MacDonald–Vosko's relativistic factor, which weakens it in the dense core".
   - Sc's crossing note now reads α = **0.860** (0.839 without relativity). This comes from a 30-step bisection on the model road;
     it was 0.863 under ZORA alone.
   - The header comment's Na δ numbers are now 1.3273 / 1.3739.
3. **STATUS** (`lab/status.js`). Past Kr the line is `Rn · NUMERICAL · scalar-relativistic (ZORA · MV) Xα; spin–orbit not included`. That
   is one word more than before, 75 characters, within the 110 budget. The head reads "one Xα(2/3) + Latter-tail central field, scalar
   ZORA, MacDonald–Vosko exchange". H–Kr still have no line.
4. **`tests/atoms.test.mjs`**: 29/29. The only edit is the model-name judge's two expected strings (`· scalar ZORA · MV`). No number and no
   tolerance changed, because every model-road gate held at its old value:

   | gate | ZORA | ZORA · MV | gate |
   |---|---|---|---|
   | Ne Δ-SCF | 21.0742 eV | 21.0734 eV | 21.09 ± 0.15 |
   | δ_s(Na), α = 1 | 1.37431 | 1.37395 | 1.373 ± 0.01 |
   | δ_s(Na), α = 2/3 | 1.32756 | 1.32733 | 1.3265 ± 0.002 |
   | Koopmans Ne | 15.065 eV | 15.065 eV | 15.08 ± 0.05 |
   | K 4s / 3d | −0.144028 / −0.057462 | −0.143968 / −0.057469 | ± 1e-3 |
   | He Xα − Hartree | 0.15182 | 0.15199 | 0.152 ± 0.002 |

## The derivation

MacDonald & Vosko, J. Phys. C 12, 2977 (1979), give the exchange energy of the relativistic homogeneous electron gas as the
non-relativistic one times

  **Φ(β) = 1 − (3/2) A², A = (βη − asinh β)/β²**, where β = p_F/mc = (3π²ρ)^{1/3}/c and η = √(1 + β²).

The potential follows from the energy:

1. In the local form E_x = α·C_X ∫ ρ^{4/3} Φ(β) d³r. Since β ∝ ρ^{1/3}, dβ/dρ = β/3ρ.
2. Therefore V_x = δE_x/δρ = α·C_X·[(4/3)ρ^{1/3}Φ + ρ^{4/3}Φ′ β/3ρ] = V_x^{NR}·[Φ + βΦ′/4].
3. Φ′ = −3AA′. Differentiating A, and using η + β²/η − 1/η = 2β²/η, gives βA′ = 2β/η − 2A.
4. So Φ + βΦ′/4 = 1 − (3/2)A² − (3/4)A(2β/η − 2A) = 1 − (3/2)Aβ/η.
5. Substituting A: 1 − (3/2)(β/η)(η/β − asinh β/β²) = **−½ + 3 asinh β/(2βη) = R(β)**, with asinh β = ln(β + η).

This is exactly the factor Z quoted and MacDonald–Vosko's potential.

Limits:
- Near zero: R = 1 − β² + ⅘β⁴ − …, and Φ = 1 − ⅔β² + ⅖β⁴ − ….
- At large β: both tend to −½. V_x changes sign at β = 1.9460 and E_x's density at β = 2.5332.
- In our atoms, β peaks at 0.015 (H), 0.20 (Ne), 1.01 (Kr), 2.38 (Xe), 14.8 (Rn) and 261 (Og). These are the ZORA s-cusp's densities
  (u ∼ r^s, s < 1). V_x is reversed inside r = 8e-7 a₀ at Xe and 3e-3 a₀ at Rn.

**Checks (dual gate, `.tmp/mv/`, not committed).**
- **Symbolic (sympy):** R_derived − R_MV simplifies to 3(asinh β − ln(β + √(β²+1)))/(2βη), which is identically 0. The series and the
  limits above are sympy's own output.
- **Numeric (mpmath, 40 digits):** V from numerically differentiating ρ^{4/3}Φ(ρ^{1/3}) agrees with the closed-form R to 2.3e-38 at
  β = 10⁻³, 0.01, 0.1, 0.5, 1, 2, 5 and 20.
- **In the solver: Janak's theorem.** dE/df_i = λ_i holds only if the potential is the energy's derivative. The test runs with K held at
  the neutral's and no Latter clip:

  | level | ZORA | ZORA · MV | R on V without Φ on E |
  |---|---|---|---|
  | Ne 1s | 5.7e-7 | 5.9e-7 | **−3.2e-2** |
  | Kr 1s | 1.4e-6 | 1.6e-6 | **−1.88** |
  | Kr 4p | −2.0e-7 | 3.9e-7 | −4.5e-6 |
  | Au 1s | 3.2e-6 | 3.0e-6 | **−21.4** |

  (Eh.) So Φ must go with R. Z's throwaway put "R(β) … on our V_x" (its words). Its Au Δ-SCF of +1.99 eV, against our +1.95, would
  follow if Φ was left off the energy, but this is not verified.
- **Hydrogen to leading order.** ΔE = α·(3/2)·C_X ∫ρ^{4/3}(Φ − 1) ≈ −(2/3)·C_X·(3π²)^{2/3}c⁻²·∫ρ² d³r. For ρ = e^{−2r}/π, ∫ρ² = 1/8π.
  That gives **+9.98e-6 Eh**, and the solver gives **+9.985e-6 Eh**.

## THE TABLE — before (ZORA) and after (ZORA · MV), against NIST

**The oracle.** Kotochigova, Levine, Shirley, Stiles & Clark, Phys. Rev. A 55, 191 (1997), math.nist.gov/DFTdata/atomdata/tables/,
re-fetched today. Its ScRLDA column is the scalar-relativistic LDA with MacDonald–Vosko exchange, and its LDA column is the
non-relativistic one. It is not Dirac–Fock: Z used this table, and its methodology is the same one we now implement.

Our functional is Xα(2/3) + Latter tail, with no correlation. NIST's is LDA (VWN). So the **level** distance also carries a model gap,
which is the NR level difference: Ne 1s 0.079 Eh, Au 6s 0.042 Eh. The **shift** distance, ours (rel − NR) against NIST's (ScRLDA − LDA),
is the model-free comparison, and it is the one Z used.

ratio = our shift ÷ NIST's · Δshift = our shift − NIST's shift (eV) · Δlevel = ε − ε_ScRLDA (eV)

| level | ε ZORA (Eh) | ε ZORA·MV (Eh) | NIST ScRLDA | ratio Z | ratio MV | Δshift Z | Δshift MV | Δlevel Z | Δlevel MV |
|---|---|---|---|---|---|---|---|---|---|
| H 1s | −0.500007 | −0.500007 | −0.233463 | — | — | −0.0004 | −0.0004 | −7.253 | −7.253 |
| He 1s | −0.742668 | −0.742592 | −0.570348 | −0.25 | 0.73 | −0.0026 | **−0.0006** | −4.689 | −4.687 |
| **Ne 1s** | −30.42263 | −30.39065 | −30.315584 | 3.887 | **0.599** | −0.764 | **+0.106** | −2.913 | **−2.043** |
| Ne 2p | −0.553646 | −0.553632 | −0.497551 | 0.924 | 0.955 | −0.0010 | −0.0006 | −1.5264 | −1.5260 |
| **Ar 1s** | −114.28353 | −114.07045 | −114.090739 | 1.620 | **0.886** | −4.90 | **+0.90** | −5.25 | **+0.55** |
| Ar 3p | −0.400632 | −0.400635 | −0.381755 | 0.863 | 0.857 | −0.0021 | −0.0022 | −0.5137 | −0.5137 |
| **Kr 1s** | −519.1053 | −517.2543 | −517.653657 | 1.191 | **0.950** | −39.95 | **+10.41** | −39.50 | **+10.87** |
| Kr 4p | −0.357388 | −0.357351 | −0.345161 | 0.591 | 0.622 | −0.0131 | −0.0121 | −0.3327 | −0.3317 |
| Xe 1s | −1260.2720 | −1254.0021 | −1255.733395 | 1.097 | 0.964 | −124.6 | +46.0 | −123.5 | +47.1 |
| Xe 5p | −0.313354 | −0.313281 | −0.308113 | 0.435 | 0.477 | −0.0265 | −0.0245 | −0.1426 | −0.1406 |
| Rn 1s | −3613.7678 | −3588.5209 | −3598.855827 | 1.038 | 0.974 | −407.2 | +279.8 | −405.8 | +281.2 |
| Rn 6p | −0.293841 | −0.293666 | −0.289891 | 0.232 | 0.285 | −0.0687 | −0.0640 | −0.1075 | −0.1027 |
| Ag 1s | −928.7774 | −924.6336 | −925.674173 | 1.124 | 0.960 | −85.3 | +27.4 | −84.4 | +28.3 |
| Ag 5s | −0.219069 | −0.218494 | −0.172492 | 0.846 | 0.808 | +0.0633 | *+0.0790* | −1.2674 | −1.2518 |
| Ag 4d | −0.289452 | −0.289982 | −0.282334 | 0.844 | 0.812 | −0.0694 | *−0.0838* | −0.1937 | *−0.2081* |
| Cs 6s | −0.124039 | −0.123904 | −0.081620 | 1.269 | 1.223 | −0.0214 | −0.0177 | −1.1543 | −1.1506 |
| Au 1s | −2960.2551 | −2940.7879 | −2948.072638 | 1.046 | 0.973 | −332.7 | +197.0 | −331.5 | +198.2 |
| **Au 6s** | −0.254837 | −0.253447 | −0.221999 | 0.837 | 0.814 | +0.2644 | *+0.3023* | −0.8936 | −0.8557 |
| Au 5d | −0.270435 | −0.271156 | −0.262411 | 0.859 | 0.842 | −0.1628 | *−0.1824* | −0.2183 | *−0.2380* |
| Hg 1s | −3048.0553 | −3027.8319 | −3035.505153 | 1.045 | 0.973 | −342.9 | +207.4 | −341.5 | +208.8 |
| Hg 6s | −0.283313 | −0.281929 | −0.260552 | 0.927 | 0.902 | +0.1108 | *+0.1485* | −0.6194 | −0.5817 |
| Hg 5d | −0.371278 | −0.372776 | −0.371655 | 0.972 | 0.953 | −0.0619 | *−0.1026* | +0.0103 | *−0.0305* |
| Pb 6p | −0.163482 | −0.163408 | −0.136111 | 0.231 | 0.244 | −0.1196 | −0.1176 | −0.7448 | −0.7428 |

In *italics*: a valence level that moved further from NIST. The NR road (ε_NR) is unchanged; it is the base for both shift columns.

**The Δ-SCF ionisation (eV):**

| atom | NR | ZORA | ZORA · MV | NIST ScRLDA (Z's) | measured |
|---|---|---|---|---|---|
| Ne | 21.088 | 21.074 | 21.073 | — | 21.5645 |
| Ag | 6.643 | 7.181 | 7.157 | 8.069 | 7.5762 |
| Cs | 3.391 | 3.524 | 3.519 | 3.990 | 3.8939 |
| **Au** | 6.702 | **8.706** | **8.653** | 9.715 | **9.2255** |
| Hg | 7.928 | 9.867 | 9.817 | 10.993 | 10.4375 |
| Pb | 5.915 | 5.802 | 5.801 | 6.823 | 7.4167 |
| Rn | 10.715 | 10.697 | 10.691 | 11.935 | 10.7485 |

**The scaled total's relativistic shift** (E_scaled − E_NR against NIST's Etot ScRLDA − LDA, Eh):

| atom | ZORA | ZORA · MV | NIST | ratio Z | ratio MV |
|---|---|---|---|---|---|
| Ne | −0.1447 | −0.1028 | −0.1029 | 1.407 | **0.9987** |
| Ar | −1.8681 | −1.5696 | −1.5707 | 1.189 | **0.9993** |
| Kr | −36.696 | −33.827 | −33.839 | 1.084 | **0.9996** |
| Ag | −116.08 | −109.23 | −109.27 | 1.062 | **0.9996** |
| Xe | −212.44 | −201.64 | −201.72 | 1.053 | **0.9996** |
| Cs | −230.20 | −218.73 | −218.82 | 1.052 | **0.9996** |
| Au | −1139.91 | −1101.72 | −1102.33 | 1.034 | **0.9994** |
| Hg | −1206.98 | −1167.10 | −1167.77 | 1.034 | **0.9994** |
| Pb | −1350.87 | −1307.42 | −1308.20 | 1.033 | **0.9994** |
| Rn | −1681.89 | −1630.57 | −1631.60 | 1.031 | **0.9994** |

Kr's E_scaled is now −2780.68 Eh, Au's −18 954.26 and Rn's −23 482.88. NIST's ScRLDA values are −2783.99, −18 963.12 and −23 492.95;
those carry VWN correlation, which we do not have, and that is the remaining 3–10 Eh.

### Reading the table

- **1s.** Every 1s shift error shrinks in magnitude. Ne 0.76 → 0.11 eV, Ar 4.9 → 0.9, Kr 40 → 10, Xe 125 → 46, Rn 407 → 280.
  - Past Kr the sign flips: ours is now slightly **under** NIST's (×0.96–0.97).
  - The remainder is probably scaled ZORA against NIST's scalar-relativistic Dirac kinetic operator in the deep core. This is not
    tested here.
- **Valence.**
  - The noble-gas p levels move 0.0004–0.005 eV toward NIST. Ar 3p is the exception: it moves 0.0001 eV away.
  - He 1s, Cs 6s and Pb 6p move toward NIST.
  - The 4d/5d metals move away, by 0.016 (Ag 5s) to 0.041 eV (Hg 5d). The mechanism is clear from the 1s column: MV weakens exchange
    where the density is high, so the core rises (Au 1s by 530 eV), spreads, and screens the valence more. The 6s is then less contracted
    and the 5d less expanded.
  - NIST's own columns include the same mechanism. So the remaining Au valence gap (0.30 eV in the 6s shift) is **not** relativistic
    exchange. It lies in the kinetic operator (scaled ZORA against NIST's scalar Dirac) and in the functional (Xα + Latter tail, no
    correlation, against LDA). MV only uncovers it.
- **Au's ionisation.** 8.65 eV, against 8.71 eV with ZORA alone and 9.23 measured. NIST's own relativistic shift is +2.11; ours is +1.95
  (ZORA alone +2.00).

## Every Z, 1…118 (A7's law on the model road)

`.tmp/mv/sweep.mjs`, the default solve for all 118:
- Every residual is below 1e-8. The worst is 9.79e-9 (Cd). The loop stops at tol = 1e-8, so a value just under it is a converged run.
- ∫q = Z to 2.8e-13, and ∫u² = 1 to 1.2e-14.
- Every node count is n − l − 1, and none of the orbitals is unbound.
- E_scaled is monotone in Z.
- The slowest atom took 336 ms (Cm).

The valence-level move against ZORA alone:

| atom | level | Δ (eV) |
|---|---|---|
| H | 1s | 0 (bit-identical) |
| He | 1s | +2.1e-3 |
| Ne | 2p | +4.0e-4 |
| Ar | 3p | −8.3e-5 |
| Kr | 4p | +1.0e-3 |
| Fe | 3d | −1.9e-2 |
| Au | 5d | −2.0e-2 |
| Yb | 4f | −0.12 |
| Og | 7p | +7.4e-3 |

The 1s moves by +0.87 eV (Ne), +50 (Kr), +687 (Rn) and +2133 (Og).

**Cost: none measurable.** Cold and warm solves, ZORA against ZORA · MV:

| atom | ZORA | ZORA · MV |
|---|---|---|
| Kr | 224 / 121 ms | 200 / 115 ms |
| Au | 239 / 209 ms | 209 / 209 ms |
| Rn | 215 / 219 ms | 211 / 211 ms |
| Og | 276 / 273 ms | 271 / 273 ms |

The added work is one asinh per mesh point per iteration.

## The el- pictures: measured, not re-rendered

I rendered 14 tiles twice in one session: once with this branch's solver and once with the base solver swapped in. The tiles were H, Ne, Fe,
Au, Hg, Yb, Am, Es, Ds, Cn, Mc, Lv, Ts and Og, rendered with `GD_PORT=5331 LW_PORT=9331 node tools/menu-thumbs.mjs --set elements --only …`.
The render-to-render difference is therefore MV's alone.

| tile | mean \|Δ\| (of 255) | pixels off by > 24 |
|---|---|---|
| H | 0 (bit-identical) | 0 % |
| Ne | 1.34 | 1.2 % |
| Fe | 1.57 | 1.6 % |
| Au | 3.14 | 4.3 % |
| Hg | 2.69 | 3.6 % |
| Yb | 4.44 | 8.1 % |
| Am … Og | 1.3–3.7 | 1.3–5.9 % |

`mv-shots/el-zora-vs-mv.png` shows Ne, Au, Yb and Og as base | MV | |Δ|×4. **The difference is a one-pixel ring on the soft lobe edges; nothing
differs by eye.** Z's ZORA change was the same kind and larger (Ne 1.7 %, Yb 22 %). The shape of each tile's radial on a fixed r grid moves
by at most 2.3 % of its peak (Lv 7p, in the inner lobes), and 0.4 % or less for H–Kr. The domain radius moves by at most one log-mesh step
(1.1 %), which the alpha-box crop rescales away. So the committed pictures stay, and `lab/img/menu/` is untouched.

*Aside, not this row's:* the committed H–Rn tiles differ from a fresh render of the **same** physics by about 33 % of pixels (H, whose
physics is bit-identical, included). They predate a look change. Am–Og match the base render exactly.

## THE LOCK ×2: held, no re-capture
- `LW_PORT=9331 GD_PORT=5331 node tools/perf/digest-lock.mjs --check --query gastab=0`: **GREEN, 843 values compared, 0 readback
  differences, 0 record-byte differences, page errors 0** (54 s).
- The same with `--fixture research/release-0.4.0/measure/digest-lock-s4a.json`: **GREEN, 987 values, 0 differences** (54 s).
- No ATOM state is in either fixture, and `lab/hydrogen.js` is untouched, so this was the expected result.

## The gate
| run | result |
|---|---|
| `node tests/pwa.test.mjs --write` | `lab/sw.js` re-derived (lw-lab-13vnaa61kshdgz), all PASS |
| `./test.sh node` | exit 0 |
| `node tests/atoms.test.mjs` | 29/29 GREEN (7.0 s) |
| `node tests/status.test.mjs` | GREEN (491 strings within 110 characters) |
| `node tools/rack-deps.mjs --classes --no-write` | exit 0. G-G holds: 0 bare writes across scopes, 0 shared lets still bare |
| `node tools/new-project.mjs --check` | in step (16 098 B) |
| THE LOCK × 2 | GREEN 843/0 and 987/0 |
| browser: atoms suites | none exist (`grep` of `tests/*.browser-test.mjs` for atoms.js, wAtoms, goAtom, RELATIVITY and atomsview finds none) |
| light check (`.tmp/mv/look.mjs`, Firefox, gate 9331) | Au, Ne, Rn and Ag opened in ATOMS and RELATIVITY Δ pressed. The busy mark was seen every time and the press took 206–287 ms. MODEL reads `Xα(2/3) + Latter tail · scalar ZORA · MV`. STATUS is `—` for Ne and `<sym> · NUMERICAL · scalar-relativistic (ZORA · MV) Xα; spin–orbit not included` for Au, Rn and Ag. 0 page errors |

## Screenshots (`research/iteration-009/mv-shots/`)
- `au-atoms-relativity.png`: Au's ATOMS window with RELATIVITY Δ pressed. Δrel reads 1s −7002 eV (ZORA alone: −7532), 6s −1.32 (−1.36),
  5d +0.969 (+0.989) and 4f +13.
- `ne-atoms-relativity.png`: Ne. Δrel reads 1s −0.159 eV (ZORA alone: −1.029; NIST's ScRLDA − LDA: −0.265), 2s −0.089 and 2p +0.013.
- `el-zora-vs-mv.png`: the picture check above.

## Decisions
1. **MV rides with ZORA** (the `zora` flag): there is no new option and no switch. The RELATIVITY Δ readout is therefore (ZORA · MV) − NR,
   meaning the whole relativistic model against the whole non-relativistic one. The non-relativistic oracles keep `{ zora: false }`,
   byte-identical.
2. **Φ goes on E_x, not only R on V_x.** Without it, Janak fails by 21 Eh at Au 1s, and the Δ-SCF would read a functional whose
   derivative is not the potential.
3. **The tests' numbers are unchanged.** Every model-road gate held at its tolerance (the table above). Only the model-name strings moved.
4. **Hydrogen's E is not forced back.** Its +1.0e-5 Eh is Φ acting on Xα(2/3)'s self-exchange of a one-electron atom, and the leading
   order predicts it. Removing it would break E's consistency with every other atom. ε, u and the GPU table are bit-identical.
5. **Valence regression: shipped and flagged.** The 4d/5d s/d shifts drift 0.015–0.041 eV from NIST's and Au's ionisation drops 0.05 eV.
   The light 1s and the totals improve by factors. **Josh decides:** keep MV, which is NIST's own model, or drop this branch. Dropping is a
   clean revert of `lab/atoms.js` (the two branches and `RELATIVITY`), `lab/atomsview.js`, `lab/status.js` and the test's two strings.

## Proposed CLAUDE.md sentences (the integrator's)
- In the ATOMS paragraph, after "since iteration 008 Z the ATOM's central field is SCALAR ZORA (`lab/atoms.js` `zoraKinetic`: …; the scaled
  eigenvalue reported, the Δ-SCF ion in the neutral's K, spin–orbit not included; Au's 6s ionisation 8.71 eV against the measured 9.23)",
  rewrite the parenthesis's end and add one sentence:

  "…spin–orbit not included), and since iteration 009 MV its exchange is MacDonald–Vosko's relativistic one (`mvR`/`mvPhi`: V_x·R(β),
  E_x·Φ(β), β = (3π²ρ)^{1/3}/c, R = Φ + βΦ′/4; on the ZORA road only, no switch) — the light 1s shift NIST's to ×0.60 (Ne) … ×0.97 (Rn),
  the scaled total's shift NIST's to 0.1 %, Au's 6s ionisation 8.65 eV against the measured 9.23; the non-relativistic solve
  `{ zora: false }` (p²/2, plain exchange) byte-identical to A's…"
- In the STATUS clause: "past Kr the atom's STATUS reads `<sym> · NUMERICAL · scalar-relativistic (ZORA · MV) Xα; spin–orbit not
  included`, H–Kr no line."

## Next
- **Spin–orbit** (j = l ± ½) is still the big remaining gap past Kr (Rn 6p splits by 3.6 eV). It needs labels in j.
- **The Au valence gap** (6s shift ×0.81 of NIST's) is the kinetic operator or the functional, not exchange. A finite nucleus will not
  close it (it moves the 1s by under 0.1 %). The candidate is to compare scaled ZORA with a scalar-Dirac (Koelling–Harmon) radial solve
  on the same potential.
