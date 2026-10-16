# T2 THE BELL PAIR + MASS SCALING — build note (0.8.1 "Two Levels")

Branch `t2-bell-mass` off `15ae0b1` (`yan-c`, with T1 and T3 merged). Builder: Opus, for the integrator. The build commit is `d466a6a`. The tip is the commit that adds this note (`git log -1 t2-bell-mass`).

## The physics as built

### THE BELL PAIR (BLOCH's second mode)

The two-qubit state is `[c↑↑, c↑↓, c↓↑, c↓↓]`, stored as [Re, Im] pairs. The presets are:
- Φ± = (↑↑ ± ↓↓)/√2;
- Ψ± = (↑↓ ± ↓↑)/√2;
- PRODUCT = ↑↑.

**The local rotation.** The knobs θ₀ and φ₀ turn qubit A alone, by U ⊗ 1 with U = e^{−i(θ/2)(−sin φ σ_x + cos φ σ_y)}. This U carries ↑ to (θ₀, φ₀), which is the same meaning the two knobs have in ONE. U is T1's exponential: `step` was split, and its 2 × 2 part is now `su2`. The T1 numerics are untouched (bloch.test is green and the values are identical).

**The reduced states.** ρ_A = ½(1 + r_A·σ), and ρ_B likewise. r_A is the sum of T1's `vec` over B's two values; it is bilinear, so the sum is exact. The entropy is S_A = −Σ λ ln λ with λ = (1 ± |r|)/2.
- For a pure pair, |r_A| = |r_B| = √(1 − C²), where C is the concurrence.
- So a Bell pair draws two arrows of length 0. The note says why: "An entangled qubit has no arrow because its own state is the mixture ½(1 + r·σ) with |r| = √(1 − C²), zero for a Bell pair, where all it knows lies in the correlations."

**CHSH.** The value is S = E(a,b) + E(a,b′) + E(a′,b) − E(a′,b′), where E = ⟨(a·σ) ⊗ (b·σ)⟩. The drawn axes are:
- A measures ẑ and x̂;
- B measures (±s_x x̂ + s_z ẑ)/√2, signed to the preset, with s = sign of ⟨σσ⟩ for the unrotated preset.

The window also prints the best value over all axes, 2√(1 + C²) = 2√(2 − |r|²) (Gisin's pure-state theorem).

### MASS SCALING (SPECTRUM's μ/mₑ)

The operator −∇²/2μ − Z/r is μ times the Z ion at lengths divided by μ. So `setMu` rides `setZ`'s road with a length scale k = Zμ and an energy scale Z²μ. Both roads now call one `scale()`.
- At Z = 1 and μ = 1, `scale()` hands back hydrogen's own functions (`Object.assign(H0, base)`), so **no scale is applied**.
- `setMu(1)` at μ = 1 is a no-op.

The named masses are:
- positronium = mₑ/2;
- muonic hydrogen = m_μm_p/(m_μ + m_p), with m_μ = 206.7683 mₑ and m_p = 1836.15 mₑ. That is 185.84082…, printed as 185.84. CODATA's 206.7682830 and 1836.15267343 give 185.84083.

## Seats (file:line)

### `lab/bloch-model.js` (+12)
- `DEFAULTS :5` gains `mode: 'one', bell: 'phip'`, both absent from a save at their defaults.
- `step :8` now calls `su2 :9`, the one 2 × 2 exponential.
- `BELL :36`.
- `pair(id, θ, φ) :37`: U_A ⊗ 1 on the preset.
- `corr :38`: ⟨(a·σ) ⊗ (b·σ)⟩ for axes in the x–z plane.
- `bell(s, id) :39`, which returns r_A, r_B, |r|, S, chsh, max and the four axes.

### `lab/bloch.js` (+13; window and model together = +25, the ≤ 25 the row allows)
- **Seg rows.** The MODE seg ONE · PAIR is `md :13`, in the first row as T1 named it. The Bell preset seg Φ⁺ · Φ⁻ · Ψ⁺ · Ψ⁻ · PRODUCT is `bp :14`. PAIR shows `bp` in the preset seg's seat.
- **Readouts.** `Object.assign(ro, { S, C }) :19`:
  - ENTANGLEMENT S_A prints "ln 2" when |S − ln 2| < 1e-12 and "0" below 1e-12. Its sub carries ρ_A and ρ_B as r_A and r_B, plus the eigenvalues.
  - CHSH on the drawn axes prints "2√2" within 1e-10, followed by "PREDICTION · ≤ 2 classical". Its sub names the axes and the best-axes value.
- **The pair note.** `n2 :22` is the pair's note.
- **`set`.** It toggles the rows. In PAIR, ω₀, Ω, δ, β, the P↓ and STEP readouts and the units note step aside; LANDAU–ZENER is hidden in PAIR.
- **`update`.** The key drops t in PAIR, which is still under the clock and repaints only on a change of parameter, camera or width.
- **The PAIR paint.** `duo :41` reads the state. `paint`'s PAIR branch is `:52`:
  - spheres at W/4 and 3W/4, labelled A and B;
  - the four axes as faint arms;
  - each reduced vector drawn at its own length, or not at all below 1e-9.
- **The handle.** `BL.ro` is now a getter over the visible readouts, so the inventory reads PAIR's numbers. `BL.label` returns Φ⁺ and so on in PAIR. `load` checks `mode` and `bell` (`:59–61`).

### `lab/hamiltonian.js` (+3)
- `MASSES :189`, `setZ :190`, `setMu :191` and `scale :192`. In `scale`, `if (one) Object.assign(H0, base) :204` is THE LOCK's line.
- `getMu :210`, and `H0.mu = 1` at boot.
- `H0.k` (= Zμ) and `H0.mass` (the words "μ = 0.5 mₑ (positronium)") are set by `scale`.
- The label carries "(μ = 0.5 mₑ (positronium))".
- The ladder footer reads E_n = −μZ²/(2n²).
- `stark` and `hydrogenTheorems` are true only at Z = 1, μ = 1.

### `lab/windows/spectrum.js` (+5)
- **The knob and presets.** `MASS`/`setMass :70`; the knob μ/mₑ is `:71` (log, 0.5–200, beside Z); the preset seg 1 · POSITRONIUM · MUONIC H is `:72`.
- **Syncing.** The knob and seg follow `onHamiltonian`, so a project load or an undo moves them.
- **Refusal.** Under another operator the hand is refused in one sentence on the card's status: "μ/mₑ scales hydrogen alone: the operator in force is …".
- **The equalizer.** It stands down at μ ≠ 1 (`:128`), because its beat table is written at μ = mₑ.
- **The Sturmian.** STURMIAN stands down at μ ≠ 1 (`:206`).
- **Crossings.** It still reads 25 crossings, because the knob reads only module imports and `ui`.

### Other files
- **`lab/shell/persist.js:53, :204`**: `hamiltonian.mu` is beside `Z`, absent at 1. `setMu(h.mu || 1)` is restored before the operator switches.
- **`lab/radiation.js:122`**: `einsteinA` applies the ¹H factor MU_H only at μ = 1. At μ ≠ 1 the reduced mass is already in the Hamiltonian.
- **`lab/radiationview.js:29, :191`**: the A readout's sub says "μ = 0.5 mₑ (positronium) is the Hamiltonian's: A ∝ μ (ω³ ∝ μ³, |d|² ∝ μ⁻²)".
- **`lab/rack.js:746–751, :536`**: `hydroReader(rad)`.
  - At μ ≠ 1 the windows that read hydrogen.js' μ = mₑ closed forms stand down, as at Z ≠ 1. WIGNER is one of them.
  - RADIATION (`hydroReader(true)`, and the facade's `radiation.pair` in `lab/shell/facade.js:161`) stays live, because its rates follow μ.
- **`lab/dynamics.js:104, :123, :177` and `lab/calculus.js:29, :31`**: the radial-integral caches key on `H.k || H.Z || 1`. They used to key on `H.Z`, so a μ change would have served stale integrals.
  - At μ = 1, k = Z, so every key string is the base's.
  - The two charge reads (V = −Z⟨1/r⟩ and the Coulomb force) keep the charge.
- **`lab/mathworker.js:37, :64` and `lab/windows/kepler.js:5, :64`**: the kick carries `mu`, so the worker scales as the page does.
- **`lab/informational.js:25`**: the STATUS line reads "HYDROGEN · μ = 0.5 mₑ (positronium) · EXACT · picture good to …". The row's cache key includes the mass, or a μ change would never repaint it.
- **`lab/status.js`** (in place): a label rides in the hydrogen head too.
- **`lab/verbs.js`** (in place): the inventory gains `mu: "μ = 0.5 mₑ (positronium)"` when μ ≠ 1. The `preset`/`view` verbs are untouched.
- **`docs/STATE-SCOPES.md`**: one row for `hamiltonian.mu`, and the bloch row names `mode`/`bell`.
- **Tests**: `tests/bell.test.mjs` (27 lines, 6 laws) and `tests/mass.test.mjs` (20 lines, 7 laws).

## The entropy and CHSH table (`node tests/bell.test.mjs`, and the probe)

| state | (θ₀, φ₀) on A | S_A | \|r_A\| = \|r_B\| | CHSH, drawn axes | best axes 2√(2 − \|r\|²) |
|---|---|---|---|---|---|
| Φ⁺ · Φ⁻ · Ψ⁺ · Ψ⁻ | (0, 0) | ln 2 (|S − ln 2| = 0.0 in double) | 0 (≤ 1e-15) | 2.828427124746 = 2√2 (to 1e-10) | 2.828427 |
| each Bell state | (1.1, 0.4) | ln 2 | 0 | 1.400146 | 2.828427 |
| each Bell state | (2.5, 4) | ln 2 | 5.6e-17 | −0.807066 | 2.828427 |
| PRODUCT ↑↑ | (0, 0) | 0 | 1 | 1.414214 = √2 | 2 |
| PRODUCT | (2.5, 4) | 2.1e-15 (prints 0) | 1 | −1.132988 | 2 |

The laws:
- S_A, |r_A| and ρ_B do not move under any of five local rotations, to 1e-12.
- The pair stays unitary to 1e-12.
- A rotated PRODUCT puts A's arrow at (θ₀, φ₀), with B's on ẑ.
- PRODUCT never exceeds 2.
- The best-axes formula agrees with a 720 × 720 brute force over x–z-plane axes, to 1e-5, for in-plane turns.

## The μ scaling table (`node tests/mass.test.mjs`)

| quantity | power of μ | proved to | how |
|---|---|---|---|
| E_n | μ¹ | 1e-15, all 91 labels | e = Z²μ multiplies hydrogen's E_n |
| lengths: R_μ(r) = μ^{3/2}R₁(μr); the kernel's half; the tables' n | μ⁻¹ | 1e-14 · 1e-15 · 1e-15 | k = Zμ, the table keeps its polynomial |
| the 1s–2p beat period | μ⁻¹ | 1e-12 | `densityPeriodExact` on the scaled energies |
| \|⟨2p₀\|r\|1s⟩\|² | μ⁻² | 1e-12 | the quadrature rule scales with k |
| A(2p₀ → 1s), in atomic units | **μ¹** | 1e-12 | A = (4/3)α³ω³\|d\|², with ω³ ∝ μ³ and \|d\|² ∝ μ⁻² |
| A in s⁻¹ | μ¹ | 1e-12 | ¹H's MU_H applied only at μ = 1 (it is itself the μ¹ law at μ = 0.99946) |

The table's values in s⁻¹ are A(2p₀ → 1s):
- ¹H: **6.2649e8** (NIST 6.2649e8);
- positronium: **3.1342e8**, a 3.19 ns 2P radiative lifetime;
- muonic H: **1.1649e11**.

THE LOCK is in the test.
- `setMu(1)` at μ = 1 leaves all 12 of H0's members the very same objects.
- Back from μ = 0.5, the same 12 members are restored by identity. The kernel's half is byte-equal, and `tableFor(2p₀)` is JSON-identical.
- Z = 2 at μ = 1 is the ion road unchanged.

## Gates run

- `node tests/pwa.test.mjs --write`, then `./test.sh node`: exit 0.
  - bell 6 laws, mass 7 laws and bloch 7 laws are green.
  - hydrogen.test is 0 failing of 37, radiation.test 0 of 18, period.test 0 of 11.
  - status passes: 491 strings within 110 characters.
- `node tools/rack-deps.mjs --classes`: exit 0. THE HINGE holds, with spectrum at 25 (limit 25).
- `node tools/new-project.mjs --check`: in step (16117 B).
- `node tools/serialize-bytes.mjs`: base `15ae0b1` (a `git archive` copy) and this tree, both on :9461, one after the other. **All 22 shas are identical**: the 11 full records and the 11 edit records. BLOCH adds no window, and `mode`, `bell` and `mu` are absent at their defaults.
- **The browser check.** I made one throwaway script, `.tmp/t2-shot.mjs` (headless Firefox on :9461, not committed), and re-ran it twice to unfold the LEAN card and to centre the μ row. No page errors.
  - **`.tmp/t2-bell-phip.png`**: BLOCH in PAIR on Φ⁺. It shows two spheres A and B with the four faint axis arms and no arrows, ENTANGLEMENT "ln 2", and CHSH "2√2 PREDICTION · ≤ 2 classical".
  - **`.tmp/t2-positronium.png`**: SPECTRUM at μ = 0.5. It shows the μ/mₑ knob beside Z, POSITRONIUM lit, and the equalizer stood down. The transport's period reads 33.51 a.u. (16.76 at μ = 1). The inventory reads `mu: "μ = 0.5 mₑ (positronium)"`.
- THE LOCK: BLOCH is closed by default, and nothing in this row writes the field at μ = 1. The integrator runs it ×2 at the merge with `--query gastab=0`.

## Corrections to the brief

1. **The Sturmian is not one of `setZ`'s seams.** The Sturmian register takes Z explicitly and builds its own radials. Under a mass it is μ·H₁(λ/μ), which means a rebuild at λ/μ, and that falls outside λ's 0.25–3 for muonic hydrogen. So STURMIAN stands down at μ ≠ 1, as it does off hydrogen.
2. **RADIATION's reduced mass would have been counted twice.** `einsteinA` already multiplied by ¹H's μ/mₑ = 0.99946. That factor is exactly the μ¹ law evaluated at ¹H, so at μ ≠ 1 it must not apply. The power is μ¹, proved above.
3. **The radial-integral caches keyed on `H.Z` would have gone stale.** That covers dynamics and calculus; the files were not in the plan's list, and each edit is 0 lines.
4. **The hydrogen "head".** `statusOf`'s hydrogen head is not shown anywhere: INFORMATIONAL shows a head only for a molecular owner, and latex-state has no hydrogen head. μ rides in the STATUS line and in that head. INFORMATIONAL's repaint key had to include it.
5. **CHSH's "drawn axes".** Φ⁺'s optimal axes read **0** for Φ⁻ (computed). So B's axes are signed to the preset: every Bell preset reads 2√2 at θ₀ = 0, and a local rotation lowers the drawn-axes number while S_A holds. That is the teaching point. The best value over all axes is printed beside it.
6. **The plan's "length 1 − 2·(mixedness)".** The length is |r| = √(1 − C²). It is the eigenvalue gap of ρ_A, 1 − 2λ_min.
7. **RADIATION stays live under a mass.** The other hydrogen readers (WIGNER, the theorem windows) stand down at μ ≠ 1, as at Z ≠ 1. RADIATION is live so the A ∝ μ rates are seen.
8. **The equalizer stands down at μ ≠ 1.** Its own beat table is E = −Z²/2n².

## What I dropped, and why

- **A Sturmian under a mass.** It needs a rebuild at λ/μ; see correction 1.
- **μ in a link.** `statelink` carries Z only. A `lw:` link opens at the reader's μ, and STATE-SCOPES says so.
- **μ in the export caption.** The caption takes only the STATE word from `statusOf`.
- **A `bloch` verb argument for PAIR.** The verb still takes ONE's presets, and the window's segs drive PAIR.
- **Time evolution of the pair.** PAIR is a still state under U_A ⊗ 1. A two-qubit H and a gate set stay deferred by the plan.
- **The pair's MU_H display in RADIATION's copied text.** The tab-separated copy keeps its ¹H rows.

## Δ lines

`lab/`: 29,829 → **29,863 (+34 of ≤ +45)**.

| file | Δ lines |
|---|---|
| bloch-model.js | +12 |
| bloch.js | +13 |
| hamiltonian.js | +3 |
| spectrum.js | +5 |
| rack.js | +1 |
| persist, radiation, radiationview, dynamics, calculus, informational, status, verbs, mathworker, kepler, facade | changed in place, 0 |

`sw.js` is regenerated by the pwa write.

Tests: bell 27 lines (≤ 30) and mass 20 lines (≤ 20).

## Merge notes

- THE LOCK ×2 with `--query gastab=0`. At μ = 1 the hydrogen operator is byte-for-byte the base's functions (asserted in `tests/mass.test.mjs`). BLOCH is closed by default.
- `setZ(1)` after an ion now restores hydrogen's own functions rather than Z = 1 wrappers. The values are identical; the only difference is that a table object no longer carries an `expo` key equal to n + 1.
- The full serialize bytes do not grow, because this row adds no window.
