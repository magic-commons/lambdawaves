# B3 THE UNCERTAINTY ELLIPSOID — build note (0.8.3 "Breath")

Branch `b3-ellipsoid` off `f3f4ccb` (`yan-c`, right after the v0.8.2-alpha cut). Builder: Opus, for the integrator. Tip: the commit that adds this note (`git log -1 b3-ellipsoid`).

## What landed, by seat

- **`lab/calculus.js`**
  - `:17` the kick import gains `rotorsToZ`.
  - `:144–155` **`covariance(reg, t)`**, at the end of the file, after `calculusMarkdown` and clear of B1's `radialBreath`. It returns `{ S, lam, axes, mean, r2 }`:
    - `S` is Σ_ij = ⟨r_i r_j⟩ − ⟨r_i⟩⟨r_j⟩ per unit norm.
    - `lam` and `axes` are its eigenvalues and unit principal axes, from six cyclic Jacobi sweeps on the 3 × 3.
    - `mean` is the bead (`expectR`).
    - `r2` is ⟨r²⟩ by its own road.
    - The result is cached on (register, version, t, the Hamiltonian's id, Z/k and radius), so the skeleton's tick and CALCULUS's tick share one computation per frame.
- **`lab/dynamics.js:196–208`**: `radialObservables` also returns `r2`, which is ⟨r²⟩ = Σ c_a* c_b δ_ll′ δ_mm′ ∫R_a R_b r⁴ dr. This is the bilinear form, with no angular algebra in it, and it is the trace's independent oracle. Lines changed: 0 net.
- **`lab/skeleton.js`**
  - `:24` the ellipsoid's Σ joins the key, so a breathing Σ under a still bead repaints, and a paused one costs nothing.
  - `:46–47` **the picture**, drawn after the bead's disc: the three principal ellipses (axes j, k ∈ {01, 02, 12}, each b + √λ_j cos φ ê_j + √λ_k sin φ ê_k, 64 segments) through `toScreen`, in the accent at 1.25 px. A segment whose mean depth lies past the bead's own depth is drawn at 0.22 alpha, and a near one at 0.9. These are `drawAngularNodes`' two alphas, measured about the ellipsoid's centre.
- **`lab/rack.js`**
  - `:27` the import.
  - `:506–507` the skeleton's tick, still two lines.
    - `elOn` = the ELLIPSOID switch, and only for a register (no molecule, no Sturmian) in position space.
    - `bdOn` becomes (BEAD as before) || elOn, so the ellipsoid brings its centre with it.
    - The register's bead is `Object.assign(beadOf(…), { ell: elOn ? covariance(reg, clock.t) : null })`.
- **`lab/calculusview.js`** (CALCULUS's tiles live here, not in `readouts.js`; see correction 1)
  - `:9` the import line, on its own (`covariance`, `BASIS`).
  - `:44` the update's stats line gains `ellLine(reg, t, p, mol, H);` in place.
  - `:51–53` **the ELLIPSOID readout** (`wide calc-ray`, so it shows under LEAN as RAY does), seated before the foot:
    - The value: `σ = (2.45, 2.45, 4.24) a₀`, sorted ascending, in the Hamiltonian's length unit.
    - The sub-line: `tr Σ = 30.000 = ⟨r²⟩ − |⟨r⟩|² = 30.000 (Δ 4e-15) · exact 30`. The `=` turns to `≠` past 1e-8.
    - For one hydrogen label, "exact" is n²(5n² + 1 − 3l(l + 1))/2k², with k = Zμ.
    - A molecule and momentum space each get a sentence instead.
- **The switch**
  - `lab/windows/molecules.js:59–61`: `ui.ellipsoidSw = sw({ label: 'ELLIPSOID', … })`, two lines, handed to `createChem` as `api.ellipsoid`.
  - `lab/chemview.js:301` seats it right after BEAD on the VIEW row. It is the same line, edited in place: 0 lines.
- **PREFERENCE `ellipsoid`**
  - `lab/shell/settings.js:37` (the writer): `ellipsoid: (ui.ellipsoidSw && ui.ellipsoidSw.get()) || undefined`. The key is absent while off.
  - `:107` (the reader): `ui.ellipsoidSw.set(s.ellipsoid === true)`.
  - `docs/STATE-SCOPES.md`: one new row, PREFERENCE.
- **`tests/ellipsoid.test.mjs`**: 27 lines, 5 laws.
- **`lab/sw.js`**: the precache rows, rewritten by `pwa --write`.

## The road the elements are built by

**The rotors on `varianceZ`, not a 91 × 91 × 6 table.** The tree already has ⟨z²⟩ exactly, in `varianceZ` (0.8.0 G2):

> ⟨a|z²|b⟩ = δ_mm′ Σ_{l″ = l_b ± 1} ⟨l_a|cos θ|l″⟩⟨l″|cos θ|l_b⟩ · ∫R_a R_b r⁴ dr

- The insertion over l″ is the product of the two exact rank-1 Gaunt factors (`angularDipoleZ`), so it carries the rank-0 and the rank-2 pieces of z² together.
- The radial part ∫R_a R_b r⁴ dr is `radialMoment(2, …)`. It runs on the Hamiltonian's own quadrature rule and is cached per Hamiltonian, Z and pair, as the dipole's integral is.

Turning the state by the slap's `rotorsToZ(d)` gives the variance along any unit vector d, as Var_d = ⟨Rψ|z²|Rψ⟩ − ⟨Rψ|z|Rψ⟩². This is P3's bead road, one power up. Six directions then fix the symmetric Σ:

- the diagonal entries Σ_ii = Var(ê_i);
- the off-diagonal entries Σ_ij = Var((ê_i + ê_j)/√2) − (Σ_ii + Σ_jj)/2.

That is ~6 lines against a ~15-line Gaunt extension and a new cache. Nothing in it is new mathematics for the tree, and every piece is already gated: `varianceZ` in 0.8.0, and the rotors and their sign convention in `kick.test` and `bead-ray.test`.

## The numbers (`tests/ellipsoid.test.mjs`, all green)

| state | Σ (a₀²) | σ = √λ (a₀) | tr Σ vs ⟨r²⟩ − \|⟨r⟩\|² | gate |
|---|---|---|---|---|
| 1s | (⟨r²⟩/3)·I, ⟨r²⟩ = 3 (by its own road: 3 to 1e-12) | **1, 1, 1** (measured 0.9999999999999974) | 3 = 3 − 0 | 1e-12 |
| 2p₀ | diag(6, 6, 18): ⟨r²⟩_{2,1} = 4·(21 − 6)/2 = 30 times ⟨cos²θ⟩ = ⟨0 0\|cos θ\|1 0⟩² + ⟨2 0\|cos θ\|1 0⟩² = 1/3 + 4/15 = 3/5 (computed in the test from `angularDipoleZ`) and ⟨sin²θ cos²φ⟩ = (1 − 3/5)/2 = 1/5 | √6, √6, √18 = 2.449, 2.449, 4.243 | 30 = 30 − 0 | 1e-10 (worst 5.3e-15) |
| (2s + 2p₀)/√2 at t = 0, 50, 500 | diag(10, 10, 7): ⟨z²⟩ = (14 + 18)/2 = 16, minus ⟨z⟩² = 9; the 2s–2p₀ cross term of z² is parity-zero | √7, √10, √10 | 27 = 36 − 9; gaps 8.9e-15, 8.9e-15, 1.8e-15 | 1e-10 |
| 1s + 2s + 2p₀ at t = 0, 3, 7 (it breathes: tr Σ = 20.753, 20.954, 20.814) | — | — | the trace law holds at all three | 1e-10 |
| the Stark state turned to x̂ by the slap's rotor (`AXIS_TO_Z.x`, run back) | its lone axis (λ = 7) goes from ẑ to **x̂** exactly; the spectrum (7, 10, 10) is unchanged | — | — | 1e-10 |

**The 1s ellipsoid's exact radius.** The plan's parenthesis "⟨r²⟩ = 3, ⟨r⟩ = 1.5 → σ² = 3 − 2.25 = 0.75" subtracts the square of the scalar ⟨|r|⟩ = 1.5. The covariance subtracts the vector's |⟨r⃗⟩|², which is 0 for 1s. So the exact numbers are:

- tr Σ = 3;
- each σ_k² = ⟨r²⟩/3 = 1;
- the radius is **σ = 1 a₀ on every axis** (1/k for hydrogen at Z, μ).

The brief's own line "σ = (1.00, 1.00, 1.00) a₀ · tr Σ = 3.000" is right, and the test holds it to 1e-12.

## The browser check (one session, headless Firefox, 1600 × 1000, port 9531)

- **The 2p₀ shot:** `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a9119ce32df8ca195/.tmp/b3-2p0-ellipsoid.png`. Not committed.
- **How it was taken:** SPECTRUM's 2p₀ toggle, MOLECULES' ELLIPSOID switch clicked (that one switch is on, BEAD is not), CALCULUS floated, paused.
- **What it shows:**
  - The teal bead sits at the origin, and the prolate ellipsoid stands along z between the two lobes: the equator ellipse, one meridian seen open and one seen edge-on.
  - CALCULUS's line reads "σ = (2.45, 2.45, 4.24) a₀ · tr Σ = 30.000 = ⟨r²⟩ − |⟨r⟩|² = 30.000 (Δ 4e-15) · exact 30". Var(z) on its tile reads 18.000000 = σ_z².
  - `#skeleton` has 3051 lit pixels.
  - The settings blob carries `"ellipsoid":true`.
  - No page errors.

## The gates

- **`node tests/pwa.test.mjs --write`, then `./test.sh node`:** rc 0, 0 RED (1119 GREEN/PASS lines), run after the last `lab/` edit.
- **`node tests/ellipsoid.test.mjs`:** 5 of 5 green.
- **The existing suites:** `dynamics` 0 failing of 19, `calculus` 0 of 8, `bead-ray` all green, `kick` 0 of 16, `period` 0 of 11.
- **`node tools/rack-deps.mjs --classes`:** HOLDS. 0 bare cross-scope writes, SPECTRUM at 25 (untouched), the `app` literal 30 keys (unchanged). `ui.ellipsoidSw` is the flat `ui` registry's, as `beadSw` is.
- **`node tools/new-project.mjs --check`:** in step (16117 B).
- **`node tools/serialize-bytes.mjs`:** run on the base (`git archive f3f4ccb`) and on this tree, each served at 9531 in turn. The `--out` files are byte-identical (`cmp`), so the edit bytes never move.
- **`node tools/settings-probe.mjs`:** 4 of 6 scenes RED on the base and on this tree, and the `--out` files are byte-identical.
  - The reds are the same as P3's: WORKSPACE `closed` order for `lattice` / `bloch` / `central`, plus the WAVE DANCER modwin row. They predate this cut.
  - `ellipsoid` is absent while off.
- **THE LOCK:** nothing here writes the field.
  - With the ELLIPSOID off, `bead.ell` is null: the bead paints as in 0.8.2, and the key gains an empty slot.
  - With both overlays off, the tick runs `skeleton.clear()` as before.
  - `#skeleton` is outside the lock's readback.
  - CALCULUS's line runs only inside its `may('calculus', wCalc)` tick.

## Corrections to the brief

1. **CALCULUS's tiles are built in `lab/calculusview.js`**, as P3's RAY found. `lab/windows/readouts.js` only seats the card, so the readout line lives in calculusview.js and `readouts.js` is **untouched**.
2. **The elements are not a cached 91 × 91 × 6 table.** They come from `varianceZ` (the exact l ± 1 insertion, which is the rank-0 + rank-2 Gaunt pieces) on the state turned by `rotorsToZ` along six directions. The radial r⁴ integrals are `radialMoment(2, …)`, cached per Hamiltonian as the dipole's are, and the covariance itself is cached per (register version, t, Hamiltonian).
3. **`stats` is not touched.** The independent ⟨r²⟩ is `radialObservables(…).r2` in dynamics.js, the bilinear form with δ_ll′ δ_mm′. `covariance` returns it beside Σ. This keeps `calculus.test`'s shapes and the prose figure unchanged, and keeps B1's `stats` seat free.
4. **The plan's 1s parenthesis is wrong** (σ² = 0.75; see above). The truth is σ = 1 a₀ on every axis, tr Σ = 3.
5. **The ELLIPSOID brings the bead with it.** It is drawn "about the bead", and its centre is the bead. With ELLIPSOID on and BEAD off, the bead's disc and trail draw too. It stands down for a molecule, under a Sturmian and in momentum space, where the bead is ⟨p⟩ and Σ is a position covariance.

## Dropped, and why

- **The molecular ellipsoid** (the density's quadrupole) is deferred by name in the plan. The line says so.
- **The momentum-space covariance** (⟨p_i p_j⟩ by the Heisenberg road) was not asked for. The line says "the ellipsoid is the position's".
- **CAPTURE:** `#skeleton` stays out of the capture's overlay list, for P3's reason.

## Δ lines

`lab/` (the plan's count): **29,952 → 29,973 = +21** (budget +50, cap 30,251).

| file | Δ |
|---|---|
| calculus.js | +12 |
| calculusview.js | +4 |
| skeleton.js | +2 |
| molecules.js | +2 |
| settings.js | +1 |
| rack.js, chemview.js, dynamics.js | 0 (edited in place) |
| sw.js | 0 (rewritten rows) |

The test is 27 lines.

## For the integrator at the merge

- **`lab/calculus.js`:** `:17` (the kick import line, in place) and `:144–155` (appended at the file's end). If B1 also appends at the end, both blocks simply stack.
- **`lab/calculusview.js`:**
  - `:9` a new import line after the kit's;
  - `:44` the update's stats line, edited in place;
  - `:51–53` the readout and `ellLine`, inserted just before `return { update, … }`.
  - B1 and B2 build their tiles here too, so expect hand merges at `:9` and `:44` if they touch the same lines. The ELLIPSOID readout is `insertBefore(foot)` at creation, so the tile order follows the creation order.
- **`lab/windows/readouts.js`:** untouched.
- **`lab/rack.js`:** `:27` and `:506–507` (the skeleton's tick). These are P3's lines, not B1's or B2's.
- **`lab/sw.js`:** re-run `pwa --write` after the merge.
