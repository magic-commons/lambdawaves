# BEYOND THE FRONTIER — Round 11
## OPUS 5, THE RIVAL: MATH AUDIT OF THE WHOLE INSTRUMENT

**Date** 2026-09-03 · **Auditor** Opus 5 (rival) · **Subject** λWAVES QWAVE-0.x, waves 3–19
**Standard** Round 6 found the instrument printing a nodal census of 0 where the truth was 8. Same standard here.
**Method** numbers or nothing. Every finding seated: KNOWN / DERIVED-HERE / MEASURED / REFUTED / UNVERIFIED.
Probes: `research/probes/bf-r11-{kick.py, kepler.mjs, h2.py, box.py, zdefect.mjs, wall.mjs, dragstark.mjs}`.
No file under `lab/` or `tests/` was edited. All 16 node test files were run: 250 judges, 0 failing.

**HEADLINE.** The physics the modules claim is, with one exception, *right* — several of the derivations are
stronger than the lab states them. What is wrong is the **plumbing around Z ≠ 1**: three separate readouts print
false numbers for a hydrogen-like ion, one of them a **negative kinetic energy under a law that says "= 0"**.
And one geometric object on screen — the Kepler ellipse — is **not a classical orbit**: its angular momentum
disagrees with the state's by up to 86%, and it is drawn *solid* (= "trust this") in exactly the case where the
disagreement is structural and unavoidable.

---

## §0 — Seat key

| seat | meaning |
|---|---|
| KNOWN | in the literature, re-checked here against a source value |
| DERIVED-HERE | derived from first principles this round, independently of the lab's code |
| MEASURED | computed this round with an independent probe (not the lab's own routine) |
| REFUTED | the lab's claim is false as stated; the corrected number is given |
| UNVERIFIED | examined, neither confirmed nor killed; the obstruction is named |

---

## §1 — `lab/kick.js`, the slap — CLOSED. **Every anchor confirmed; two are understated.**

**Claim** (`kick.js:1–18`, REPORT wave 8): `M_ab = ⟨a|e^{ikz}|b⟩ = Σ_L i^L(2L+1)A_L∫R_aR_b j_L(kr)r²dr`;
escaped fraction `k²·0.303`; Ehrenfest deficit `⟨p_z⟩ = 0.546·k`, "the bound share of the TRK sum rule".

**Probe** `bf-r11-kick.py` — sympy, exact rationals, nothing imported from the lab.

| quantity | lab / literature | exact (DERIVED-HERE) | seat |
|---|---|---|---|
| f_{1s→2p} | 0.4162 | 128²·2/243²·2·(3/8)·3 = **0.41619671800** | KNOWN ✓ |
| f_{1s→3p} | 0.0791 | **0.07910156250** = 81/1024 exactly | KNOWN ✓ |
| f_{1s→4p} | 0.0290 | **0.02899102918** | KNOWN ✓ |
| f_{1s→5p} | 0.0139 | **0.01393834393** | KNOWN ✓ |
| f_{1s→6p} | 0.0078 | **0.00779949273** | KNOWN ✓ |
| Σ f, n ≤ 6 | 0.546 | **0.5460271463219741** | KNOWN ✓ |
| ⟨1s\|z²\|1s⟩ | 1 | ⟨r²⟩/3 = 3/3 = **1** exactly | DERIVED-HERE ✓ |
| escaped coefficient | 0.303 | 1 − Σ\|z\|² = **0.30261657677842263** | DERIVED-HERE ✓ |

Every one of the 21 radial functions normalises to **exactly 1** in closed form (sympy, not quadrature).

**The identity ⟨p_z⟩ = k·Σf is DERIVED-HERE, not merely measured.** To O(k), ψ′ = ψ_1s + ik Σ_a z_a|a⟩ and
⟨p_z⟩ = 2·Σ_a ΔE_a z_a² · k = k·Σ_a f_a. So 0.546 is *not a coincidence that resembles* the TRK share; it **is**
the register's TRK share, identically, at leading order in k. The report says "the bound share of the TRK sum
rule"; that is exactly right and can be stated as a theorem, not an observation. → **(D1)**.

**And the missing 45% splits, which the report does not say.** With the Bethe–Salpeter closed form
f_{1s→np} = 256n⁵(n−1)^{2n−4}/(3(n+1)^{2n+4}):

- all bound np, n ≤ 2000: **0.565004**
- register share n ≤ 6: **0.546027**
- **bound but out of register (7 ≤ n < ∞): 0.018977**
- **continuum: 0.434996**

Gate as a stronger line: *"the deficit 1 − 0.546 = 0.454 is 0.019 of bound states above n = 6 and 0.435 of
continuum — the register loses 4.2% of its shortfall to shells it could in principle hold, and 95.8% to the
continuum it never can."* → **(D1)**.

**`momentumZ` "exact within the register" — the claim is right, and here is its exact scope.** DERIVED-HERE:
`p_z = i[H,z]` requires only that `H = p²/2 + V(x)` with `V` **multiplicative** (commuting with z). That holds for
hydrogen, hydrogen-like Z, the oscillator, the box, Stark (`[Fz, z] = 0`) and Zeeman (`[L_z, z] = 0`). For the
infinite well the boundary term in `⟨a|[H,z]|b⟩` is `∮(ψ_a*∂_n(zψ_b) − (∂_nψ_a*)zψ_b)`, and **both** terms carry
a factor ψ = 0 at r = a, so it vanishes: the identity survives the hard wall. It would fail only for a
velocity-dependent or non-local V — none is in the instrument. **Status: claim CONFIRMED, scope now stated.**
Note `kick.js:136` uses bare `H.energy`, not `Ediag`; under Zeeman that is still correct because
`angularDipoleZ` vanishes unless m′ = m, so the `B m/2` terms cancel in `E_a − E_b`. → **(D2)**.

**`rotorsToZ` / `AXIS_TO_Z` signs.** `kick.js:105` is `{ z: null, x: {axis:'y', angle:−π/2}, y: {axis:'x', angle:+π/2} }`
and `kick.js:114` states the y case differs from `rotorsToZ(ŷ)` by a z-rotation, which commutes with the z-kick.
That is correct: `R_y(−π/2)ẑ = x̂` and `R_x(+π/2)ẑ = −ŷ`… but the conjugation `R⁻¹e^{ikz}R = e^{ik(R⁻¹ẑ)·x}` uses
`R⁻¹ẑ`, and `R_x(π/2)⁻¹ẑ = R_x(−π/2)ẑ = +ŷ`. **Consistent.** Gated by the momentum-space integral
(`kick.test.mjs:103`), which is the right oracle. The signs are right; the *tolerance* on that gate is not — see §10.

---

## §2 — `lab/momentum.js` — CLOSED. **Exact. One unstated cut, up to 3.4% of the norm.**

**Normalisation.** `momentum.test.mjs:35` asserts `∫F²p²dp = 1` for all 21 (n,l) at **1e-7**, "by Simpson".
Independent scipy `quad` on the Podolsky–Pauling closed form (`bf-r11-box.py`) gives **1.0000000000** for every
(n,l) tested to ≥ 1e-10. So the 1e-7 is an honest statement of the lab's *own Simpson* on a semi-infinite range,
four orders looser than the truth. **Honest, not hiding anything.** Seat: MEASURED, no defect.

**`domainForP = min(4, max(0.35, 2.6/n_min))` — this DOES cut a tail, and nothing says so.**
The lab's status paragraph quantifies the *position*-space grid (∫ρ = 0.9990 at 96³) and says nothing about
momentum space. MEASURED fraction of ‖φ‖² lying outside the **inscribed sphere** |p| < P (the cube's corners
recover part of it; the true cube figure lies between the two columns):

| state | P | outside \|p\| < P | outside \|p\| < P√3 |
|---|---|---|---|
| 1s | 2.6000 | **1.157e-02** | 9.59e-04 |
| 2s | 1.3000 | **3.101e-02** | 3.34e-03 |
| **3s** | 0.8667 | **3.425e-02** | 5.93e-03 |
| 4s | 0.6500 | 2.123e-02 | — |
| 6s | 0.4333 | 1.782e-02 | 5.91e-03 |
| \|6,5⟩ | 0.4333 | 1.686e-04 | 1.34e-07 |

**Corrected gate line:** *"the momentum box `domainForP(n_min) = 2.6/n_min` leaves between 1.7e-4 (|6,5⟩) and
3.4e-2 (3s) of ‖φ‖² outside its inscribed sphere; the worst case is 3s, and the s states are the worst at every
n because their momentum density has the fattest tail."* This belongs in the NUMERICAL paragraph beside the
0.9990. → **(C1)**.

**The (−i)^l phase, Fock's map and the Round 10 rigid-rotation gate** (x = [ξ₄,ξ₁,ξ₂,ξ₃]; '+' = (h,1),
'−' = (1,h), 'both' = (h,h), 'K' = (h,h̄)) are gated at 1e-11 over 576 momenta × 4 shells × 4 drives × 3 axes ×
2 angles, and the Fourier oracle at 1e-6 with the sign checked separately (`momentum.test.mjs:55,56,129`). This
is the best-gated claim in the instrument. No finding. Seat: KNOWN + MEASURED, CONFIRMED.

---

## §3 — `lab/kepler.js` — CLOSED. **Pauli's replacement is exact for EVERY shell state. The drawn ellipse is not a classical orbit.**

### 3.1 Pauli's replacement holds for non-coherent states — CONFIRMED, and the report's caveat is unnecessary

`kepler.js:16–18`: *"⟨x⟩ = −(3n/2)⟨K⟩ … exact within a shell."* On a shell, `P_n z P_n = −(3n/2)K_z` is an
**operator identity**, so it cannot care whether the state is coherent. `bf-r11-kepler.mjs` on deliberately
non-coherent states, against the lab's own exact dipole:

| state | ⟨z⟩ (exact dipole) | −(3n/2)⟨K_z⟩ | \|diff\| |
|---|---|---|---|
| (\|3,1,0⟩+\|3,2,0⟩)/√2 | −5.196152422707 | −5.196152422707 | **1.2e-14** |
| (\|3,1,0⟩+i\|3,2,0⟩)/√2 | 0 | 0 | **0** |
| (\|3,0,0⟩+\|3,1,0⟩+\|3,2,0⟩)/√3 | −8.363081100706 | −8.363081100704 | **1.5e-12** |
| (\|4,0,0⟩+\|4,3,0⟩)/√2 | 0 | 0 | **0** |

Note the third state has **coherence 0.929** (not coherent) and the identity still holds to 1.5e-12.
Seat: **DERIVED-HERE + MEASURED, CONFIRMED.** → **(D3)**.

### 3.2 REFUTED: the drawn ellipse has an angular momentum the state does not have — and it is drawn SOLID

`kepler.js:30,39`: `a = n²`, `e = |⟨K⟩|/n`, `p = a(1−e²)`. A classical Kepler orbit (GM = 1) with those has
angular momentum `L_orb = √p`. The report (wave 10) asserts all three at once: *"the angle between them is the
eccentricity, **their sum is the angular momentum**, the shell is the size."* Those three are **mutually
inconsistent for every state in the register**:

> `L_orb² + |⟨K⟩|² = a(1−e²) + |⟨K⟩|² = n²`, but Pauli gives `⟨L²⟩ + ⟨K²⟩ = n² − 1`, and
> `|⟨L⟩|² ≤ ⟨L²⟩`, `|⟨K⟩|² ≤ ⟨K²⟩` ⟹ **`|⟨L⟩|² + |⟨K⟩|² ≤ n² − 1 < n²`, always, with no exception.**

MEASURED (`bf-r11-kepler.mjs`), `L_orb = √(a(1−e²))` against the state's own `|⟨L⟩|`:

| state | \|⟨K⟩\| | \|⟨L⟩\| | e | **L_orb** | **L_orb − \|⟨L⟩\|** | \|⟨L⟩\|²+\|⟨K⟩\|² | n²−1 | n² |
|---|---|---|---|---|---|---|---|---|
| **circular \|6,5,5⟩ (coherence 1.00, drawn SOLID)** | 0 | 5.000 | 0.000 | **6.000** | **+1.000 (20%)** | 25.0 | 35 | 36 |
| circular \|3,2,2⟩ (SOLID) | 0 | 2.000 | 0.000 | 3.000 | **+1.000 (50%)** | 4.0 | 8 | 9 |
| Stark-rotated n=6, θ=0.9 (SOLID) | 3.9166 | 3.1081 | 0.6528 | 4.5453 | **+1.437 (46%)** | 25.0 | 35 | 36 |
| \|3,1,0⟩+\|3,2,0⟩ | 1.1547 | 0.000 | 0.3849 | 2.7689 | **+2.769 (∞)** | 1.33 | 8 | 9 |
| random n=5 shell #4 | 0.5304 | 0.6535 | 0.1061 | 4.9718 | **+4.318 (661%)** | 0.71 | 24 | 25 |

`|⟨L⟩|² + |⟨K⟩|² = n²` in **zero** of the nine states sampled; the Pauli bound holds in all nine.

`keplerview.js:41` draws the line **solid** when `coherence > 0.98`, and `:49` prints only
`` `n${n} a=${a} e=${e.toFixed(3)} T=2π·${n³}` `` — **`eL` and `|⟨L⟩|` are computed at `kepler.js:31` and never
displayed.** So the flagship circular Rydberg state prints `n6 a=36 e=0.000` on a solid line, and the circle it
draws has 20% more angular momentum than the state carries. The gated fact
(`kepler.test.mjs:32`, `eL = √(2n−1)/n = 0.553 at n = 6`) exists in the test **and does not reach the screen**.

**Corrected gate line:**
> *"K THE ELLIPSE IS NOT AN ORBIT OF THE STATE: `√(a(1−e²)) − |⟨L⟩| ≥ 1/(2n)` for every shell state — with
> equality nowhere — because `|⟨L⟩|² + |⟨K⟩|² ≤ n² − 1 < n² = a(1−e²) + |⟨K⟩|²`. Measured deficit: 1.000 for
> every circular state (20% at n = 6, 50% at n = 3), 4.32 (661%) on a random n = 5 shell state. What is drawn is
> the orbit of the energy and the Runge–Lenz vector, with the angular momentum discarded."*

**And the plane is arbitrary when ⟨L⟩ = 0.** `kepler.js:36` — `else if (Khat) { u = Khat; normal = perp(Khat); }`
with `perp` (`kepler.js:26`) choosing `[1,0,0]` or `[0,1,0]` by a hard-coded 0.9 threshold. For
`|3,1,0⟩+|3,2,0⟩` (⟨L⟩ = 0 exactly, e = 0.385) the overlay draws a **definite ellipse in a basis-dependent
plane**, and the plane jumps discontinuously as the state is rotated. It is not SO(3)-covariant. → **(A5)**.

### 3.3 "The boundary, exact" is a tautology dressed as a correspondence — B-class

`kepler.test.mjs:74`: *"the classical orbit's TIME-AVERAGED position … equals the quantum ⟨x⟩ = −(3n/2)⟨K⟩ to
1e-8 — the quantum centroid of a shell state IS where the classical body spends its time, with no limit taken."*

DERIVED-HERE: the drawn orbit is *built* from ⟨K⟩ with `a = n²` and `e = |⟨K⟩|/n`, so
`−(3/2)·a·e·K̂ = −(3/2)·n²·(|⟨K⟩|/n)·K̂ = −(3n/2)⟨K⟩` **identically, by construction**. The 1e-8 gate measures the
convergence of the 20000-step area-law quadrature to the textbook `−(3/2)ae` formula — a real check, but of the
quadrature, not of a quantum/classical boundary. The *physics* is the two separate KNOWN facts (Pauli's operator
replacement; the classical time average at aphelion) plus the *choice* `a = n²`, `e = |⟨K⟩|/n`. The coincidence
is not discovered; it is assembled. → **(B3)**.

---

## §4 — `lab/qho.js`, `lab/well.js` — CLOSED. **Well normalisation exact; the captured fraction is 0.9668, and the test asks for 0.85.**

**`N² = 2/(a³ j_{l+1}(z)²)` — DERIVED-HERE.** `bf-r11-box.py`: `∫₀^a j_l(kr)²r²dr = (a³/2)j_{l+1}(z)²` for all 21
register (n,l) at a = 10, worst relative **1.03e-15**. CONFIRMED exactly.

**The Schrödinger oracle** (`well.test.mjs:49`, 4th-order FD, tol 1e-5 rel) measures **1.01e-8** — three orders of
slack. Honest, over-loose.

**The gas packet.** `wellPacket([0,0,−4],[0,0,0.8],1.6)` on a = 10 with `G = 36` midpoint. Recomputed with a
**900 × 900 Gauss–Legendre 2-D quadrature in (r, cos θ)** using scipy's own spherical Bessel zeros — no lab code
in the integrand:

> **captured = 0.966829** (exact); the lab's G = 36 cube gives **0.966828**. Agreement to **1e-6**.

So `0.967` is **RIGHT**, the G = 36 grid is fine, and the report's "97%" and "spread over 27 states" are honest
(21 states carry > 1e-6; the lab counts 27 above 1e-12). Sanity: only **2.3e-4** of the Gaussian lies outside the
wall, so the 3.3% shortfall is genuinely the n ≤ 6 truncation, i.e. the *a/6 resolution*, exactly as claimed.
Seat: MEASURED, **CONFIRMED**. → **(D4)**.

**But `well.test.mjs:62` asserts only `P.captured > 0.85`** while the truth is 0.9668. A twelve-point cushion on
a quantity that is reproducible to 1e-6. Corrected gate: `Math.abs(P.captured - 0.96683) < 5e-4`. → **(C2)**.

**Oscillator.** `E = N + 3/2` with `N = 2n_r + l = 2n − l − 2` and the momentum phase `(−i)^N` are textbook and
gated. `qho.test.mjs:86` claims "EHRENFEST EXACT … at k = 0.8 the same test reads 7e-5" — **the k = 0.8 case is
never run**; only k = 0.5 at 1e-5 (residual 4.29e-6). A narrated number inside a GREEN judge. → **(B5)**.

---

## §5 — `lab/molecule.js`, `lab/h2.js` — CLOSED. **K′ verified independently. The module header prints the wrong D_e.**

### 5.1 K′ (Sugiura) verified by an independent quadrature — CONFIRMED

`bf-r11-h2.py`. Independent route, no lab code: in prolate spheroidal coordinates the exchange density is a
function of ξ **alone**, `ρ_ab = (1/π)e^{−Rξ}`. With the Neumann expansion of 1/r₁₂, the φ-integrations kill every
m ≠ 0 and the η-integral `A_l(ξ) = ∫₋₁¹(ξ²−η²)P_l(η)dη` is nonzero **only for l = 0 and l = 2**
(`A₀ = 2ξ²−2/3`, `A₂ = −4/15`), so the whole 6-D integral collapses to a 2-D quadrature:

`K′ = (R³/8)²(2π)²(2/R) Σ_{l∈{0,2}} (2l+1) ∬ ρ(ξ₁)ρ(ξ₂)A_l(ξ₁)A_l(ξ₂)P_l(ξ_<)Q_l(ξ_>) dξ₁dξ₂`

| R | K′ (lab, Sugiura closed form) | K′ (independent) | rel diff |
|---|---|---|---|
| 1.0 | 0.436651578456 | 0.436661873397 | 2.4e-05 |
| **1.4** | **0.323291141553** | **0.323297146222** | **1.9e-05** |
| 1.64 | 0.261807041109 | 0.261811523544 | 1.7e-05 |
| 2.0 | 0.184156457132 | 0.184159401146 | 1.6e-05 |
| 4.0 | 0.015627203374 | 0.015627469316 | 1.7e-05 |

The residual ~1.7e-5 relative is flat in R — it is my Gauss–Legendre's own error on the `Q_l` log singularity at
ξ = 1 and the `ξ₁ = ξ₂` kink, not a disagreement. **Sugiura's closed form is correct. Seat: DERIVED-HERE +
MEASURED, CONFIRMED.** The brief's "K′ ≈ 0.3229 at R = 1.4?" is **wrong in the fourth digit: K′(1.4) = 0.32329.**

`J′` verified to **1.0e-14** by a completely different route (one 1s density against the other's exact potential).

### 5.2 REFUTED: `lab/h2.js:20` prints D_e = 3.14 eV; the formulas in that same file give 3.16 eV

Minimising `E₊(R)` from the module's own closed forms (Brent, xtol 1e-12):

> **R_e = 1.64254965 a₀, E_min = −1.1159704932 hartree, D_e = 0.1159704932 Eh = 3.155718 eV → 3.16 eV.**
> With the *independent* K′ instead of Sugiura's: R_e = 1.64257, D_e = **3.155562 eV**. Same answer.

- `REPORT.md` wave 18: "**R_e = 1.64 a₀ and D_e = 3.16 eV**" — **CORRECT**.
- `lab/h2.js:20` header: "Heitler–London gives R_e = 1.64 a₀ and **D_e = 3.14 eV**" — **WRONG by 0.016 eV.**
  3.14 eV is the *textbook* HL figure (Pauling & Wilson, older integral tables); this file does not compute it.
- `h2.test.mjs:30` compares to **3.14 with a 0.05 eV tolerance** (residual 0.0157, 31% of budget) — the loose
  tolerance is what lets the module header keep the wrong number. Corrected gate:
  `Math.abs(De - 3.15572) < 1e-4`. → **(A4 / C3)**.

### 5.3 Confirmed by independent recomputation

| claim | source | recomputed | seat |
|---|---|---|---|
| triplet turning point **3.44 a₀** at 0.02 Eh from R = 8 | REPORT w18 | **R\* = 3.43755877** (E₋(3.44) − E_tot = −7.0e-5) | MEASURED ✓ |
| H₂⁺ LCAO R_e = 2.49, D_e = 1.76 eV | `molecule.js:16` | **R_e = 2.49283039, D_e = 1.764141 eV** | MEASURED ✓ |
| both HL curves → −1 as R → ∞ | `h2.js:22` | E₊(40) = E₋(40) = −1.0000000000 | MEASURED ✓ |
| **w_g = (1+S)²/(1+S²), w_u = (1−S)²/(1+S²)** | REPORT w18 | **DERIVED-HERE** (below), and verified pointwise to 1e-12 at R = 1, 1.4, 2 | ✓ |
| triplet weights = 1, 1 | REPORT w18 | **DERIVED-HERE**, verified pointwise to 1e-12 | ✓ |

**Derivation of the weights (DERIVED-HERE).** With `σ_g = (a+b)/√(2(1+S))`, `σ_u = (a−b)/√(2(1−S))`,
matching `w_g|σ_g|² + w_u|σ_u|²` to `[a²+b² ± 2S·ab]/(1±S²)` gives two linear equations in the (a²+b²) and (2ab)
channels; adding and subtracting them yields `w_g/(1+S) = (1+S)/(1+S²)` and `w_u/(1−S) = (1−S)/(1+S²)`, i.e.
exactly the lab's forms, and `w_g + w_u = (2+2S²)/(1+S²) = 2` **identically for all S** — the two-electron count
is automatic, not a coincidence. For the triplet the same algebra gives `w_g = w_u = 1`. → **(D5)**.

### 5.4 "The nuclear clock ×300" — labelling — UNVERIFIED-with-a-caveat

REPORT w18 says the H₂ window "runs it on a nuclear clock … (×300 by default, a display choice, labelled)". I did
not read `h2view.js` line by line (subagent budget); `grep` for the multiplier shows it in the H₂ view only.
**What I can state:** the ×300 is a display choice, and the physics of the collision (μ = 918.0764 = m_p/2,
velocity Verlet on the variational curve) is stated correctly in `h2.js:22–24`. Seat: **UNVERIFIED** — flagged
for Fable in Q64.

---

## §6 — `lab/helium.js` — CLOSED. **The functional derives exactly, coefficient by coefficient. The cusp claim is unfalsifiable.**

### 6.1 The kinetic functional — DERIVED-HERE, every coefficient confirmed

`helium.js:14–16` claims `⟨T⟩ = ∫[u(s²−t²)(ψ_s²+ψ_t²+ψ_u²) + 2s(u²−t²)ψ_sψ_u + 2t(s²−u²)ψ_tψ_u]`, "no ½".

Derivation, independent of the code. With `∇₁s = r̂₁`, `∇₁t = r̂₁`, `∇₁u = û`, `∇₂s = r̂₂`, `∇₂t = −r̂₂`, `∇₂u = −û`:

`|∇₁ψ|² + |∇₂ψ|² = 2(ψ_s² + ψ_t² + ψ_u²) + 2ψ_u[(ψ_s+ψ_t)(r̂₁·û) − (ψ_s−ψ_t)(r̂₂·û)]`

with `r̂₁·û = (st+u²)/((s+t)u)` and `r̂₂·û = (st−u²)/((s−t)u)`. Multiplying by the measure weight
`u(s²−t²) = u(s+t)(s−t)`, the cross bracket becomes

`2ψ_u[ψ_s(2s(u²−t²)) + ψ_t(2t(s²−u²))]/… → 4s(u²−t²)ψ_sψ_u + 4t(s²−u²)ψ_tψ_u`,

so `(|∇₁ψ|²+|∇₂ψ|²)·u(s²−t²) = 2·[the lab's bracket]`, and `⟨T⟩ = ½∫(…)dτ` cancels the 2 **exactly**.

> **The "no ½" is not a fudge: the factor 2 from summing two electrons' gradients cancels the ½ of `−½∇²`
> identically, and the cross-term coefficients `2s(u²−t²)` and `2t(s²−u²)` come out right on the nose.**
> Seat: **DERIVED-HERE, CONFIRMED.** → **(D6)**.

**Potential**: `V = −2/r₁ − 2/r₂ + 1/u = −8s/(s²−t²) + 1/u` ⟹ `V·u(s²−t²) = −8su + (s²−t²)`. **Exact.** ✓

**Monomial integral**: on the Hylleraas domain `s∈[0,∞), u∈[0,s], t∈[−u,u]`,
`∫t^b dt = 2u^{b+1}/(b+1)` (b even) → `∫u^c·… du = s^{b+c+2}/(b+c+2)` → `∫s^{a+b+c+2}e^{−2ζs}ds = (a+b+c+2)!/(2ζ)^{a+b+c+3}`.
Product = `[2/(b+1)]·[1/(b+c+2)]·(a+b+c+2)!/(2ζ)^{a+b+c+3}`. **Character-for-character the lab's formula.** ✓

**Anchors.** 1-term `E = ζ² − 27ζ/8` minimises at `ζ = 27/16` to `−(27/16)² = −729/256 = −2.84765625` ✓ KNOWN.
3-term −2.90243 (Hylleraas 1929) ✓; 6-term −2.90324 ✓ (`helium.test.mjs:42` measures −2.903329, 8.9e-5 from the
anchor, honest variational-basis limit); exact −2.903724 ✓.

### 6.2 The cusp gate is constructed so its own claim cannot fail — B/C-class

`helium.test.mjs:49`:
> *"the six-term solution gives 0.34 (the basis carries no cusp constraint; **ten terms move it toward ½**)"*
> `Math.abs(cusp − 0.5) < 0.2 && Math.abs(cuspRatio(ten) − 0.5) <= Math.abs(cusp − 0.5) + 0.05`

MEASURED: six-term **0.3372937634618266**, ten-term **0.338142581247086**. The ten-term moves **+0.00085** across
a 0.163 gap — **0.52% of the way**, and the `+0.05` allowance means the assertion would still pass at
`ten = 0.288`, i.e. **moving decisively away from ½**. The Kato value is exactly ½ (DERIVED-HERE: the s-wave
coalescence condition `∂ψ/∂u|₀ = ½ψ` for two unit charges).

**Corrected gate line:** *"He THE CUSP THE BASIS CANNOT HAVE: a polynomial-in-u Hylleraas expansion satisfies
`∂ψ/∂u|₀/ψ = 0.33729` at six terms and `0.33814` at ten — it moves 0.5% of the way to Kato's ½ and then stalls,
because a finite polynomial in u cannot reproduce a linear cusp in the presence of the e^{−ζs} envelope. The
energy converges; the cusp does not."* → **(B1 / C4)**.

### 6.3 The conditional density — the claim is right, the normalisation label is not checked here

`helium.js:29–33`: *"ρ(x₂|x₁) ∝ |ψ(x₁,x₂)|² is the Born rule and nothing else."* The **proportionality** is the
Born rule and is unimpeachable. But the header writes `∝`, and the report's phrase "and nothing else" invites the
reading that the *displayed* object is a normalised conditional density. It is not: the kernel normalises the
drawn field to `ρmax` (a rendering choice), so what is on screen is `|ψ(x₂|x₁)|²/max_{x₂}|ψ|²`, not
`|ψ|²/∫|ψ|²dx₂`. Those differ by an `x₁`-dependent factor, so **as electron 1 is dragged, the displayed cloud's
overall brightness is not the true conditional normalisation.** Shape: correct and honest. Amplitude: a display
normalisation. Seat: the physics CONFIRMED, the wording over-strong. → **(B2)**.

---

## §7 — `lab/calculus.js` — CLOSED. **Both identities derive. "The residual IS the wall" is EXACT — and ungated.**

### 7.1 The dipole-acceleration identity — DERIVED-HERE, sign and factor confirmed

`[H,z] = [p²/2, z] = −i p_z` ⟹ `p_z = i[H,z]`.
`[H,[H,z]] = −i[H,p_z] = −i[V,p_z] = −i·(i ∂_zV) = ∂_zV`.
Matrix element between eigenstates: `⟨a|[H,[H,z]]|b⟩ = (E_a−E_b)⟨a|[H,z]|b⟩ = (E_a−E_b)² z_ab`.
> **`(E_a − E_b)² z_ab = ⟨a|∂_zV|b⟩`. The sign and the factor in `calculus.js:11` are correct.** ✓
Gated at 3e-6 (`calculus.test.mjs:28`, residual 1.153e-6 on the n = 6 pair — 38% of budget, honestly named).

### 7.2 The wall: "the residual IS the wall" is EXACTLY true — verified by a surface integral

`calculus.js:32`: `if (H.id === 'well') return { value: 0, label: '0 inside the box — the wall is not an operator
of the register; the residual IS the wall' }`. **This claim has no test anywhere** — `calculus.test.mjs` covers
hydrogen and the oscillator only. I built the missing oracle (`bf-r11-wall.mjs`).

Two routes, one a matrix element and one a surface integral, sharing nothing:

- (i) what CALCULUS prints: `d⟨p_z⟩/dt = −Σ_{ab} Re(c_a*c_b)(E_a−E_b)² z_ab`
- (ii) the true hard-wall force: `F_z = −½a²∮|∂_rψ|² cos θ dΩ`, using `R′_{nl}(a) = −N k j_{l+1}(z)` so that
  `R′(a)² = 2k²/a³` **exactly** (verified to 10 digits for 5 states) and the *same* angular factor the dipole uses.

On the gas packet (a = 10, σ = 1.6, 27 states):

| t | d⟨p_z⟩/dt (register) | F_z (surface integral) | ratio | \|diff\| |
|---|---|---|---|---|
| 0 | +4.389625620249e-3 | +4.389625620250e-3 | 1.000000000 | 9.6e-17 |
| 3 | −1.161576350400e-3 | −1.161576350401e-3 | 1.000000000 | 2.7e-16 |
| 10 | −1.095957385578e-1 | −1.095957385578e-1 | 1.000000000 | 8.3e-17 |
| **14 (at the wall)** | **−1.230897399067e-1** | **−1.230897399067e-1** | **1.000000000** | **4.4e-16** |
| 20 | −2.049238150961e-2 | −2.049238150961e-2 | 1.000000000 | 3.3e-16 |

> **The residual is the wall's force to 5e-16 — machine precision, not "approximately". It is not truncation.**
> The reason (DERIVED-HERE): for a state exactly in the register's span, *both* sides are exact bilinear forms in
> the same exact matrix elements; the surface integral is what `⟨a|∂_zV|b⟩` *means* for a hard wall. This is the
> strongest unstated result in the instrument. Seat: **DERIVED-HERE + MEASURED, CONFIRMED.** → **(D-STRONGEST)**.

**Missing gate:** `calculus.test.mjs` should carry it —
`judge('C IN THE BOX THE RESIDUAL IS THE WALL, EXACTLY: d⟨p_z⟩/dt equals −½a²∮|∂_rψ|²cos θ dΩ (the hard-wall
pressure) to 5e-16 on the gas packet at five times through a bounce', worst < 1e-14)`. → **(C5)**.

### 7.3 The virial row: right law, wrong numbers at Z ≠ 1 — see §8/§10 A1

### 7.4 Ehrenfest II omits the Stark force — a real gap

`calculus.js:30–43` builds `⟨−∂V/∂z⟩` from the bare potential only. The register may be evolving under
`H₀ + F·z` (`state.js:104,133`), whose force is an extra `−F`. With F at the knob maximum 0.01 (`rack.js:375`),
that is a residual **four orders above** the ~1e-6 the row is designed to display. Seat: **DERIVED-HERE** (the
missing term is unambiguous), **UNVERIFIED numerically** (I did not run the Stark path through `stats`).
→ **(A6, provisional)**.

---

## §8 — `lab/hamiltonian.js` `setZ` — CLOSED. **The scaling laws are right. Three consumers ignore them.**

**φ_Z(p) = Z^{−3/2}φ(p/Z) — DERIVED-HERE.** With `ψ_Z(x) = Z^{3/2}ψ(Zx)`,
`φ_Z(p) = (2π)^{−3/2}∫Z^{3/2}ψ(Zx)e^{−ip·x}d³x`; substituting `y = Zx` gives
`Z^{3/2}Z^{−3}(2π)^{−3/2}∫ψ(y)e^{−i(p/Z)·y}d³y = Z^{−3/2}φ(p/Z)`. ✓
`hamiltonian.js:90` implements exactly this (`phiAt` divides p by Z and the value by Z^{3/2}), and
`momentumTableFor` (`:88`) keeps `expo = B.n + 1` while scaling `n → n/Z` and `norm → norm/Z^{3/2}` — **correct**,
because the momentum envelope is `(1+n²p²)^{−(n+1)}` and only the *scale* inside it moves. `domainForP → ×Z`,
`domainFor → /Z`, `energy → ×Z²`, `radial → Z^{3/2}R(Zr)`: all correct. **Seat: DERIVED-HERE, CONFIRMED.**

**And `hamiltonian.js:94` sets `hydrogenTheorems = (Z === 1)`, so ORBIT / VORTEX / DYNAMICS / SLICE / LADDER all
correctly stand down for the ion.** The hypothesis that the gate is keyed on id alone is **false for the five
theorem windows**. It is true for the three windows that were never in a gate at all — and those print the false
numbers. See §10.

---

## §9 — the DRAG toy — CLOSED. **Not Lindblad. Not radiation. And silently inert under Stark.**

`state.js:119`: `g = (damping > 0 && dir < 0 && t > 0) ? exp(−damping·(Ediag(a) − E[0])·t) : 1`.

**What it actually is (DERIVED-HERE).** The propagator is `exp(−iE_a t − γ(E_a−E₀)t) = exp(−i[E_a − iγ(E_a−E₀)]t)`,
i.e. evolution under the **non-Hermitian** `H_eff = H − iγ(H − E₀)` — an optical potential with
`Γ_a = 2γ(E_a − E₀)`. As a quantum operation it is the **no-jump (null-measurement) branch of a quantum
trajectory**: a single-Kraus-operator contraction, completely positive but **not trace-preserving and with no
jump term**. A Lindblad master equation `ρ̇ = −i[H,ρ] + Σ(LρL† − ½{L†L,ρ})` has the *same* no-jump piece plus the
refilling `LρL†`. **That refilling is what is missing.**

**Consequence, MEASURED** (`bf-r11-wall.mjs`, γ = 0.1, (|1s⟩+|2p₀⟩)/√2):

| t | \|c_1s\|² | \|c_2p\|² | norm² | 1s **share** of norm | \|c_1s\|² a real cascade would give |
|---|---|---|---|---|---|
| 0 | 0.500000000 | 0.500000000 | 1.000000000 | 0.500000000 | 0.500000000 |
| 10 | **0.500000000** | 0.236183276 | 0.736183276 | 0.679178699 | **0.763816724** |
| 40 | **0.500000000** | 0.024893534 | 0.524893534 | 0.952574127 | 0.975106466 |

`|c_2p|²` at t = 10 is **0.236183276371** = `0.5·e^{−0.75}` to 12 digits ✓ (the gated fact is right).
But **the ground-state population never changes — ever.** The state "settles to the ground state" only as a *ray*
(after renormalisation the 1s share → 1); the *vector* keeps `|c_1s|² = 0.5` forever while the norm bleeds.

**Two things in the on-screen note (`rack.js:353`) are wrong:**
1. *"the norm it loses is what the toy radiated away"* — nothing is radiated *into* anything. In real spontaneous
   emission the lower state **gains** what the upper loses (0.7638 at t = 10 above); here it gains **zero**.
   The lost norm is the probability of the emission having *happened*, deleted rather than transferred.
2. The rate is `Γ_a = 2γ(E_a − E₀)` — **linear in the energy above the ground state**, not the Einstein
   A-coefficient `∝ ω³|z_ab|²`, and it decays every state toward *nothing* rather than cascading toward the
   state below it. A 6h state and a 6s state at the same energy get the same width though their dipoles differ by
   orders of magnitude.

**Honest label, as a gate could assert it:**
> *"DRAG γ is the no-jump branch of an amplitude-damping trajectory: `H_eff = H − iγ(H − E₀)`, `Γ_a = 2γ(E_a−E₀)`.
> It is completely positive and norm-decreasing but has **no jump term**, so the ground-state population is
> exactly constant (`|c₀|² invariant to machine precision at all t`) and nothing is emitted into anything. It is
> not Lindblad; it is not spontaneous emission; the width is linear in E_a − E₀, not `ω³|z_ab|²`. What settles to
> the ground state is the normalised ray, not the state."* → **(B4)**.

**AND: the toy is silently inert whenever a Stark field is on — while the status line says NON-UNITARY.**
`state.js:113` applies `g` only inside the `field.Fz === 0` branch; the Stark block-propagation branch
(`:123–137`) has no `g` at all. `rack.js:181` prints `TOY DRAG γ = … · NON-UNITARY` whenever `damping > 0`,
unconditionally. MEASURED (`bf-r11-dragstark.mjs`, γ = 0.1, t = 10):

| Fz | norm² at t = 10 | status line says | non-unitary? |
|---|---|---|---|
| 0 | **0.736183276371** | TOY DRAG γ = 0.100 · NON-UNITARY | yes |
| **1e-9** | **1.000000000000** | TOY DRAG γ = 0.100 · NON-UNITARY | **NO** |
| 0.001 | 1.000000000000 | TOY DRAG γ = 0.100 · NON-UNITARY | **NO** |
| 0.01 (knob max) | 1.000000000000 | TOY DRAG γ = 0.100 · NON-UNITARY | **NO** |

The NORM meter reads 1.000 four pixels from a status line asserting NON-UNITARY. → **(A3)**.

**Latent (not reachable): the toy can AMPLIFY.** The exponent uses `Ediag(a) − this.E[0]` — the Zeeman-shifted
energy of *a* minus the **unshifted** ground energy. MEASURED minimum of `Ediag(a) − E[0]` over the register:
`Bz = 0.05` → 0 (safe); `Bz = 0.2` → **−0.013889** at `h:6:5:−5`; `Bz = 0.5` → −0.763889. Negative ⟹ `g > 1` ⟹
the toy **grows** that amplitude. The Zeeman knob's max is 0.05 (`rack.js:374`), and the threshold is
`B > 0.4861/2.5 = 0.19444`, so **it cannot be reached today** — but the guard is one character
(`this.Ediag(0)`, or a `Math.max(0, …)`). → **(B6)**.

---

## §10 — CROSS-CUTTING — CLOSED.

### 10a — the loosened tolerances (250 judges audited, 0 failing)

Only the ones that hide something are listed; the honest ones (`molecule.test.mjs:28`, K at 5e-5 with residual
2.2e-5 and the 1/r_A cusp *named* — the best-written loose tolerance in the suite; `frontier.test.mjs:65` at 74%
of a budget whose cause β₄ is named) are noted and dismissed.

| # | file:line | claim | tolerance | measured | verdict |
|---|---|---|---|---|---|
| 1 | `helium.test.mjs:49` | "ten terms move it **toward ½**" | 0.2, plus a **+0.05 regression allowance** | six 0.33729, ten 0.33814 — moves **0.52%** of the gap; would pass at ten = 0.288 | **hides**: the trend asserted is one the test is built not to be able to fail |
| 2 | `kick.test.mjs:139` | "\|⟨p⟩\| = **0.546k**" | 0.05 on k = 0.2 (**±9%**) | **0.5210**k — a 4.6% disagreement absorbed. `cosang > 0.999` is vacuous: p ∝ (1,1,1) by construction | **hides a stated number** (cause is the 40³ grid, and the exact route at `:80` gives 0.5446 — so quote *that*) |
| 3 | `kick.test.mjs:103` | "⟨p_x⟩ = **+0.546·k**" | window `0.09 < px < 0.13` = **±19%** | px = 0.10428 vs 0.10920 stated | **hides**: a ±19% window cannot detect a normalisation error |
| 4 | `well.test.mjs:62` | "held … to better than **85%**" | > 0.85 | truth **0.966829**, reproducible to 1e-6 | **understates by 12 points** |
| 5 | `h2.test.mjs:30` | D_e vs **3.14 eV** | 0.05 eV | 3.15572 — 0.0157 off | **hides A4**: the tolerance is what lets `h2.js:20` keep 3.14 |
| 6 | `frontier.test.mjs:221` | "in **all four classes** of n̄ mod 4" | 1e-4 (residual 6.09e-5, 61%) | residue **3 is never tested**; only 3 `kind`s exist | over-strong claim string; the tolerance itself is honest |
| 7 | `frontier.test.mjs:170` | "a **DOUBLE** unimodular root … 1e-3 apart" | sep < 1e-3 | actual sep **8.21e-8** | the assertion is 4 orders weaker than the evidence: two *distinct* roots would pass |
| 8 | `kepler.test.mjs:58` | "quadrature limit: **3e-8 at n = 6**" | 1e-7 | worst over 15 states **4.97e-11** | a numerical excuse **600× larger than anything the run produces** — stale or never measured |
| 9 | `qcd.test.mjs:48` | "SAME splitting … **to better than 1%**" | 0.01 | ratio is **bit-identical 1** | vacuous: measures nothing |
| 10 | `rotor4.test.mjs:107` | "a gain of a million … **does not overflow**" | `mx <= 255` | cannot fail — `Uint8ClampedArray` clamps | vacuous |
| 11 | `fields.test.mjs:53` | "⟨z⟩ = −3 a₀ **never moves**" (1e-6) | 1e-6 | `dz` is `.toFixed(6)`-ed **before** the comparison | the comparison is quantised to exactly its own tolerance |
| 12 | `frontier.test.mjs:49` | "the numerical value sits inside it" | `3·alphaStarError + 1e-6` | residual 9.52e-5 vs a **self-granted** 5.6e-4 | **the lab computes its own tolerance** |
| 13 | `qcd.test.mjs:35` | Υ(2S)/ψ(2S) within 20 MeV | 0.02 GeV | **0.0179 = 90% of budget** | honest, but *brittle*: any drift goes RED |

**Circularity.** `frontier.test.mjs`'s header promises *"Anchors are the OTHER lab's numbers (Opus's), table
values (DLMF), and quadrature — never the generator itself."* "Opus's numbers" are from
`research/adversarial-2026-09-02*` — the **same programme**. `frontier.test.mjs:130` (`wantR`, six radii, "the
print's radii") is a **pure regression test presented as a theorem check**: the print was generated by this code,
so it can only catch a change, never an error. Same for `:132`, `:249`, `qcd.test.mjs:29,30,45,46` ("Round 9's
numbers"). **`calculus.test.mjs` is the only file in the suite with zero external anchors** while its claim
strings read as physics validation ("Ehrenfest's laws hold live"). → **(C6)**.

### 10b — the windows that print a wrong number in some mode

**Verified myself with numbers** (`bf-r11-zdefect.mjs`), on top of the file-level trace.

**A1 · CALCULUS prints a NEGATIVE kinetic energy under a law that says "= 0".**
`calculus.js:60` gates the virial row on `H.id === 'hydrogen'`, but Z ≠ 1 *is* id `'hydrogen'`, and
`radialObservables` (`dynamics.js:196,199,202,226`) is Z-blind three ways: the cache key omits Z, it calls the
raw `hydrogen.js` `radial` rather than `H.radial`, and `V = −rinv` hardcodes charge 1 while the `energy` passed
in **is** Z-scaled (×Z²). Pure 1s:

| Z | lab ⟨1/r⟩ | true | lab ⟨r⟩ | true | lab ⟨V⟩ | true | **lab ⟨T⟩** | true | **row `2⟨T⟩+⟨V⟩`, law says 0** |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 1.000 | 1 | 1.500 | 1.5 | −1.000 | −1 | +0.500 | 0.5 | **−0.0000000** ✓ |
| 2 | 1.000 | **2** | 1.500 | **0.75** | −1.000 | **−4** | **−1.000** | **+2.0** | **−3.000000** ✗ |
| 3 | 1.000 | **3** | 1.500 | **0.50** | −1.000 | **−9** | **−3.500** | **+4.5** | **−8.000000** ✗ |

On the 1s+2p₀ state the window prints `2⟨T⟩+⟨V⟩ = −1.560` beside `= 0`.
**Corrected:** `⟨1/r⟩ = Z/n²`, `⟨V⟩ = −Z⟨1/r⟩`, `⟨T⟩ = E − V`, row ≡ 0.

**A2 · CALCULUS's Ehrenfest II residual is 40% at Z = 2, and ⟨z⟩ is Z× too large.**
`dynamics.js:138` — `key = \`${H.id}:${np_}:${lp}:${n}:${l}\`` — **omits Z**, and `:140` omits the `/Z`
integration range. Its correctly-written sibling `calculus.js:22` has both (`${H.id}:${H.Z || 1}:…`, `… / (H.Z || 1)`).
The dipole scales as 1/Z, so the first value computed is frozen for every later Z. MEASURED with Z touched in the
order 1, 2, 3: `radialDipole(1s,2p)` returns **1.2902662020 at every Z**, against exact `1.2902662020/Z` — ratio
1.000, 2.000, 3.000. In the app Z = 1 is the default and CALCULUS warms the cache there, so it is **wrong at
every Z ≠ 1**. Because `forceZ` (`calculus.js:42`) *does* carry Z while the dipole does not, the printed
**Ehrenfest II residual at Z = 2 is −4.003e-1** where the row is designed to show ~1e-9:

```
Z = 2   ⟨p_z⟩   value=-0.93049112   predicted=-0.40031102   residual=-4.003e-1
        2⟨T⟩+⟨V⟩ value=-1.56000000   predicted= 0.00000000   residual=-1.560e+0
```

**A3 · The DRAG toy is inert under Stark while the status line says NON-UNITARY** — §9, table above.

**A4 · `lab/h2.js:20` prints D_e = 3.14 eV; the file's own formulas give 3.155718 eV** — §5.2.

**A5 · The Kepler ellipse's angular momentum is wrong by up to 661%, drawn solid, with `eL` computed and never
shown; and its orbital plane is basis-dependent (non-covariant) whenever ⟨L⟩ = 0** — §3.2.

**A6 · Ehrenfest II omits the Stark force `−F`** (provisional; `calculus.js:30–43` vs `state.js:104`) — §7.4.

**A7 · SPECTRUM's ladder draws Z = 1 hydrogen at every Z, contradicting the lane four pixels away.**
`hamiltonian.js:33` has `spectrum: null` and `setZ` (`:80–98`) rewrites ten fields but **never `spectrum`**, so
`spectrum.js:101,109` take the fallback `energy(n)` — the raw `hydrogen.js:27` `−0.5/n²` — and `:125` prints the
axis label `EIGENVALUE E_n = −1/(2n²) hartree`. At **Z = 3 with 3s populated the ladder canvas prints
`E = −0.0556` while the lane's own `sp-e` cell prints `−0.5000 Eh`** (patched by `rack.js:429`). Truth:
`−Z²/(2n²) = −0.5000`. Two different energies for the same state in the same window; the ladder's is the false one.

**Also on screen, lower severity (traced, not independently re-measured):**
- **METERS** prints `⟨E⟩ hartree` and an `as` time sub-label in **every** mode; under the oscillator
  `H.unit = 'ħω'` with ω unspecified, so `4.50000 / 122.451 eV` is a fabricated number in a fabricated unit
  (`meters.js:8,23,24`). METERS is in no hide list.
- **`moleculeMode` (`rack.js:494`)** omits `wMet` and `wCalc` from its hide list: METERS keeps reading the
  *atomic* register (NORM, ⟨E⟩, AUTOCORR, MODES) beside an H₂⁺ field, and CALCULUS **freezes** its last atomic
  rows on screen for the whole molecule session. The overlays at `rack.js:140` do this correctly (their else-branch
  clears the canvases); these two do not.
- **New SPECTRUM lanes bake `Eh` at construction** (`spectrum.js:41`); `rack.js:429` repairs the unit only on a
  `switchHamiltonian`, so adding a mode under the oscillator gives a fresh lane reading `4.5000 Eh` that never
  self-corrects.
- **Lane names and colours are the hydrogen ones in every mode.** `labelOf` is defined at `hamiltonian.js:32,44,61`
  and **is never called anywhere in the codebase**; the lane band uses `N_COLOR[s.n]` (hydrogen n) while the ladder
  beside it colours the same level by `QHO_RGB(N)` — the lane and its own level line are different colours.
- **`setWellRadius` clears only the render tables** (`well.js:58`); `RAD_CACHE` and `FCACHE` do not carry the
  radius, so moving WELL RADIUS 10 → 25 leaves CALCULUS's ⟨z⟩ at the a = 10 value forever. Worse, the box
  integration range is a fixed `R = 14` (`dynamics.js:140`, `calculus.js:24`) while the knob goes to 30 — even a
  cold cache truncates the integrand inside the box for a > 14.
- **Stale readouts across a mode change:** the GAS readout (`rack.js:411,641`) is cleared by nothing, so
  `94.2% held · the box resolves ≈ a/6` survives a switch back to HYDROGEN; the Z knob is neither reset nor
  disabled under the oscillator, where Z does nothing.

**And what is right, stated because the audit assumed otherwise going in:** the LADDER's revival clocks
(`ladder.js:21,46`, `frontier.js:118,676`) *are* hardcoded Z = 1 hydrogen (`T_cl = 2πn̄³`, `T_rev = 4πn̄⁴/3`,
`T_sr = πn̄⁵`) with no Z anywhere — but `rack.js:427` hides `wLad` in every non-hydrogen mode **and at every
Z ≠ 1**, so no wrong clock is ever displayed. Likewise DYNAMICS: `⟨T⟩ = −E` is never used unconditionally
(`dynamics.js:226` computes `T = energy − V` from the actual ⟨1/r⟩), and the window is hidden wherever the
identity would be false. `rack.js:140` is the strongest predicate in the file and its else-branch actively clears
all three overlay canvases.

---

## §11 — RANKED FINDINGS

### (A) FALSE NUMBERS ON SCREEN — must fix

| # | where | what is printed | what is true |
|---|---|---|---|
| **A1** | CALCULUS, Z ≠ 1 | 1s at Z = 2: `⟨1/r⟩ = 1.000`, `⟨r⟩ = 1.500`, `⟨V⟩ = −1.000`, **`⟨T⟩ = −1.000`**, row `2⟨T⟩+⟨V⟩ = −3.000` under a law reading `= 0`. At Z = 3, `⟨T⟩ = −3.500`, row `−8.000` | 2.000, 0.750, −4.000, **+2.000**, **0**. `dynamics.js:196,199,202,226` |
| **A2** | CALCULUS, Z ≠ 1 | `radialDipole` frozen at first-touched Z: **1.2902662020 at Z = 1, 2, 3**; Ehrenfest II residual **−4.003e-1** at Z = 2 | 1.2902662020/Z; residual ~1e-9. `dynamics.js:138,140` — the fix is at `calculus.js:22,24` verbatim |
| **A7** | SPECTRUM ladder, Z ≠ 1 | Z = 3, 3s: ladder canvas **`E = −0.0556`**, axis `E_n = −1/(2n²) hartree`; the lane 4 px away prints `−0.5000 Eh` | **−0.5000**; `E_n = −Z²/(2n²)`. `hamiltonian.js:33,80–98`; `spectrum.js:101,109,125` |
| **A3** | STATE / status, γ > 0 with any Fz ≠ 0 | status `TOY DRAG γ = 0.100 · NON-UNITARY` while **norm² = 1.000000000000** at t = 10 (should be 0.736183) | the toy is silently inert; `state.js:113` vs `rack.js:181` |
| **A4** | `lab/h2.js:20` header | Heitler–London `D_e = 3.14 eV` | **3.155718 eV** (3.15556 with the independent K′). REPORT wave 18's 3.16 is the correct one |
| **A5** | ORBIT overlay | solid ellipse labelled `n6 a=36 e=0.000` whose angular momentum is **6.000** | the state's is **5.000** (+20%); +46% Stark-rotated; **+661%** on a random n = 5 state. `eL` is computed (`kepler.js:31`) and never shown. Plane basis-dependent when ⟨L⟩ = 0 |
| **A6** | CALCULUS, Stark on | Ehrenfest II omits the `−F` term; at F = 0.01 that is **4 orders** above the row's design residual | provisional — traced, not run |

Lower-severity screen defects (METERS' `hartree`/`as` under the oscillator; METERS and CALCULUS left live/frozen
in molecule mode; `Eh` baked into new lanes; hydrogen lane names and mismatched lane/ladder colours; the well
radius not invalidating `RAD_CACHE`/`FCACHE` and the fixed `R = 14` range against a knob that reaches 30; the GAS
and Z readouts never cleared) are itemised at the end of §10b.

### (B) WRONG OR OVER-STRONG WORDING — must relabel

| # | text | correction |
|---|---|---|
| **B1** | `helium.test.mjs:49` "ten terms move it **toward ½**" | ten terms move it **0.00085 across a 0.163 gap — 0.52%**, and then stall. A polynomial in u cannot make a linear cusp; say that instead |
| **B2** | `helium.js:31` / REPORT w16 "ρ(x₂\|x₁) ∝ \|ψ\|² is the Born rule and **nothing else**" | the *shape* is; the *displayed amplitude* is normalised to `ρmax`, a rendering choice, so brightness does not track the true conditional normalisation as x₁ moves |
| **B3** | REPORT w10 / `kepler.test.mjs:74` "THE BOUNDARY, EXACT … the quantum centroid **IS** where the classical body spends its time, with no limit taken" | the equality is **by construction**: the orbit is built from ⟨K⟩ with a = n², e = \|⟨K⟩\|/n, so `−(3/2)ae K̂ ≡ −(3n/2)⟨K⟩`. Two KNOWN facts assembled, not a correspondence discovered. Also: REPORT w10's *"their sum is the angular momentum"* is **false** (§3.2) |
| **B4** | `rack.js:353` "the norm it loses is what the toy **radiated away**" | the ground-state population is **exactly invariant** (0.500000000 at every t); nothing is emitted into anything. Correct name: the **no-jump branch** of an amplitude-damping trajectory, `H_eff = H − iγ(H−E₀)`, `Γ_a = 2γ(E_a−E₀)` — not Lindblad (no jump term), and the width is linear in `E_a − E₀`, not `ω³\|z_ab\|²` |
| **B5** | `qho.test.mjs:86` "EHRENFEST EXACT … **at k = 0.8 the same test reads 7e-5**" | k = 0.8 is never run; only k = 0.5 at 1e-5 (residual 4.29e-6). Delete the narration or assert it |
| **B6** | `state.js:119` `Ediag(a) − this.E[0]` | mixes a Zeeman-shifted energy with an unshifted ground energy. Latent: at Bz > 0.19444 the exponent goes negative and the toy **amplifies** (measured −0.013889 at Bz = 0.2 on `h:6:5:−5`). Unreachable at the knob's max 0.05, but it is a one-character guard |
| **B7** | `frontier.test.mjs` header "never the generator itself" | "Opus's numbers" are the same research programme; `:130`, `:132`, `:249` and `qcd:29,30,45,46` are **regression tests presented as theorem checks** |
| **B8** | `frontier.test.mjs:221` "in **all four classes** of n̄ mod 4" | residue 3 is never tested, and only three `kind`s exist |

### (C) LOOSENED TOLERANCES THAT HIDE SOMETHING

| # | where | asserted | true | fix |
|---|---|---|---|---|
| **C1** | REPORT NUMERICAL ¶ | nothing about the momentum box | **1.16e-2 (1s) to 3.42e-2 (3s)** of ‖φ‖² lies outside `domainForP`'s inscribed sphere | print the number beside the position grid's 0.9990 |
| **C2** | `well.test.mjs:62` | `captured > 0.85` | **0.966829**, reproducible to 1e-6 | `\|captured − 0.96683\| < 5e-4` |
| **C3** | `h2.test.mjs:30` | `\|D_e − 3.14\| < 0.05` | **3.155718** | `\|D_e − 3.15572\| < 1e-4` — this tolerance is what keeps A4 alive |
| **C4** | `helium.test.mjs:49` | `\|cusp−½\| < 0.2` **and a +0.05 allowance for ten terms to get worse** | six 0.33729, ten 0.33814 | assert the two values, and that the *change* is < 1e-2 |
| **C5** | `calculus.test.mjs` | **no well test at all** | the wall identity holds to **5e-16** (§7.2) | add it: it is the strongest thing in the module |
| **C6** | `calculus.test.mjs` (whole file) | "Ehrenfest's laws hold live" | **zero external anchors** in the only file that reads as physics validation; `calculus.js` computes value, prediction **and** residual, and the test reads the residual back | anchor one row on a hand-typed closed form |
| **C7** | `kick.test.mjs:139,103` | "0.546k" at ±9% and ±19% | 0.5210k and 0.10428 | quote the **exact-route** 0.5446 from `:80`, and tighten to ±2% naming the 40³ grid |
| **C8** | `kepler.test.mjs:58` | "quadrature limit **3e-8** at n = 6" | worst **4.97e-11** over all 15 states | delete the fabricated limit or re-measure it |
| **C9** | `frontier.test.mjs:49` | pass threshold `3·alphaStarError + 1e-6` | **the lab grants itself its own tolerance** (5.6e-4 vs residual 9.52e-5) | fix the number |
| **C10** | vacuous judges | `qcd:48` (1% on a bit-identical ratio), `rotor4:107` (`Uint8ClampedArray` clamps), `fields:53` (`.toFixed(6)` before a 1e-6 compare), `well:69`/`rotor4:102` (negative claims that cannot fail) | — | rewrite or delete |
| **C11** | brittle, not loose | `qcd:35` at **90%** of a 20 MeV budget; `frontier:65` at 74%; `frontier:221` at 61% | — | these go RED first; say so in the report |

### (D) CONFIRMED CLAIMS WORTH STATING MORE STRONGLY

**D-STRONGEST · "In the box the residual IS the wall" is exact to 5e-16 — and it has no test.**
`calculus.js:32`'s label is stated as an excuse ("the wall is not an operator of the register"). It is a theorem.
Two routes sharing nothing — the register's `−Σ Re(c_a*c_b)(E_a−E_b)²z_ab` and the hard-wall surface pressure
`−½a²∮|∂_rψ|²cos θ dΩ` (using `R′(a)² = 2k²/a³`, itself exact) — agree at **ratio 1.000000000, |diff| ≤ 4.4e-16**
at t = 0, 1, 3, 6, 10, **14 (through the bounce)** and 20 on the gas packet. Gate it:

> `judge('C IN THE BOX THE RESIDUAL IS THE WALL, EXACTLY: the residual d⟨p_z⟩/dt of Ehrenfest II equals the hard-wall pressure −½a²∮|∂_rψ|²cos θ dΩ to 5e-16 on the gas packet at seven times through a bounce — the wall is not approximated by the truncation, it IS the double commutator', worst < 1e-14)`

- **D1** `⟨p_z⟩ = 0.546k` is not *like* the TRK share — it **is** it, identically, at O(k): `⟨p_z⟩ = k·Σ_a f_a`.
  And the deficit splits **0.018977 bound (n > 6) + 0.434996 continuum**.
- **D2** `momentumZ` is exact for **every** Hamiltonian in the instrument, including the hard wall (the boundary
  term carries ψ = 0 twice), and correctly under Zeeman because `angularDipoleZ` forces m′ = m.
- **D3** Pauli's replacement holds for **every** shell state, coherent or not — 1.2e-14 on `|3,1,0⟩+|3,2,0⟩`,
  1.5e-12 on a coherence-0.929 three-term state. The report's "any other shell state carries the orbit of its
  mean vectors" understates a clean operator identity.
- **D4** `captured = 0.966829` is right to 1e-6 (900×900 Gauss–Legendre vs the lab's G = 36 cube), and only
  **2.3e-4** of the Gaussian lies outside the wall — so the 3.3% shortfall is genuinely the a/6 resolution.
- **D5** `w_g + w_u = 2` is an **identity in S**, not a check: `[(1+S)²+(1−S)²]/(1+S²) ≡ 2`.
- **D6** The helium kinetic functional's "no ½" is derived, not fitted: the 2 from `|∇₁|²+|∇₂|²` cancels the ½
  exactly, and the cross coefficients `2s(u²−t²)`, `2t(s²−u²)` fall out of `r̂₁·û = (st+u²)/((s+t)u)` and
  `r̂₂·û = (st−u²)/((s−t)u)`. The potential `−8su + (s²−t²)` and the monomial formula are exact character for
  character.
- **D7** `setZ`'s momentum law `φ_Z(p) = Z^{−3/2}φ(p/Z)` is exact from the Fourier transform, and `expo = n+1`
  is right because only the scale inside `(1+n²p²)^{−(n+1)}` moves.
- **D8** `hamiltonian.js:94` (`hydrogenTheorems = Z === 1`) **already** stands the five theorem windows down for
  the ion. The Z ≠ 1 leaks are only in the three windows that were never gated at all.
- **D9** Sugiura's K′ and the Coulomb J′ are both correct (J′ to 1.0e-14 by an independent route), and
  `molecule.test.mjs:28` is the model of an honestly-loosened tolerance in this suite.

---

## §12 — Q61–Q66 FOR FABLE

**Q61.** The Kepler overlay cannot draw an orbit consistent with all three of (E, ⟨L⟩, ⟨K⟩), because
`|⟨L⟩|² + |⟨K⟩|² ≤ n² − 1 < n²` with **no** state achieving equality. Three repairs exist: (i) draw the
`(a, e)` ellipse and *print* `eL` and the deficit; (ii) draw the `(a, L)` orbit instead, which then has the wrong
perihelion direction; (iii) draw the **band** between the two — the family of classical orbits compatible with
the shell. Which is honest? And is there a *fourth* object — the classical orbit of the **coherent state nearest**
this one on Gr⁺(2,4), which does satisfy the constraint — that is the right thing to draw?

**Q62.** The Pauli bound gives `√(a(1−e²)) − |⟨L⟩| ≥ ?` as a sharp inequality. I measured 1.000 for every circular
state and 4.318 for a random n = 5 state. Is the sharp lower bound `1/(2n)`, or `√(n²) − √(n²−1) ≈ 1/(2n)` only
in the K = 0 case, and what state attains it? A closed form would turn A5 from a defect into a printed number.

**Q63.** The DRAG toy is the no-jump branch. Adding the jump term (cascade `|a⟩ → |b⟩` with the Einstein
`A_{ab} ∝ (E_a−E_b)³|z_ab|²`, which the register **already has** — `radialDipole` and `angularDipoleZ` are built)
would make it a genuine Lindblad master equation on the 91-state register, at the cost of propagating a density
matrix. Is there a *pure-state* stochastic-trajectory version cheap enough for the display, with the jump drawn
from the same dipole table, so the ground state actually fills?

**Q64.** The ×300 nuclear clock: I did not verify it is labelled at every place it appears. Is the H₂ collision's
*energy conservation* ("two parts in ten thousand") measured on the true clock or the scaled one, and does the
velocity-Verlet step scale with it?

**Q65.** `calculus.test.mjs` is the only file with zero external anchors. What is the cheapest hand-typed closed
form that would anchor an Ehrenfest row? Candidate: on 1s + 2p₀ with real coefficients, `⟨z⟩(t)` and `⟨p_z⟩(t)`
are pure sinusoids at ω = 3/8 with amplitudes `2c₁c₂·128√2/243` and `(3/8)·that` — both hand-typable.

**Q66.** The momentum box cuts up to 3.4% of ‖φ‖² (3s). Is `2.6/n_min` the right law at all? The momentum density
of an ns state scales as `p^{−(2n+4)}`-ish in the tail; a law tuned to hold a *fixed fraction* (say 99.5%) would
be `P(n) = c(n)/n` with a slowly varying c. What is c(n), and does the cube's corner volume already make the
current law honest to 99.4% (the `P√3` column) so that only the *label* needs fixing?

---

## §13 — NOT CERTIFIED

1. **A6** (Ehrenfest II omits the Stark force) is traced in the source but **not run**. The missing `−F` is
   unambiguous from `calculus.js:30–43` vs `state.js:104`, but the on-screen magnitude is inferred, not measured.
2. **§5.4**, the ×300 nuclear clock's labelling, is **UNVERIFIED**: I did not read `h2view.js`.
3. The **browser** proof (`boot.browser-test.mjs`, 52 checks) was **not run** — no server was started, per the
   brief. Every screen defect above is inferred from the source plus node-level measurement of the same
   quantities; none was observed in a live canvas.
4. `lab/field.js` (607 lines, the GPU kernel) and `lab/frontier.js` (714 lines) were **not read** this round.
   The f16 / trilinear / ray-march numbers in the NUMERICAL paragraph (2e-5, 2e-4, 0.9990, 0.9973) are
   **UNVERIFIED here** and were taken on the report's word.
5. My independent `K′` quadrature carries its own **1.7e-5 relative** error (the `Q_l` log singularity at ξ = 1
   and the `ξ₁ = ξ₂` kink under Gauss–Legendre). It is enough to certify Sugiura's closed form to five digits and
   the HL `D_e` to 3.1556 ± 0.0002 eV; it is **not** enough to certify a sixth digit.
6. The claim that the lower-severity §10b items (METERS' units, molecule-mode freezing, baked `Eh`, lane
   colours, well-radius caches, stale GAS/Z readouts) appear **as described on screen** rests on the file trace
   only; I confirmed the code paths, not the pixels.
7. `Σ f_{1s→np}` over all bound n was summed to n = 2000 (**0.565004**); the exact bound total is
   `0.5650...`, and the last digit of the "continuum share 0.434996" is therefore a truncation, not a proof.
8. **Nothing in the test suite is currently masking a numerical blow-up.** Every one of the 250 judges passes,
   and most residuals sit 2–5 orders inside their tolerance. The findings in (C) are about what the suite
   *cannot* catch, not about a failure it is concealing.

---

*Opus 5, rival. Round 11. Seven false numbers, eight relabels, eleven tolerances, nine confirmations —
and one theorem the instrument was calling an excuse.*
