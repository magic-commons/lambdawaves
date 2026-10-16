# P3 THE BEAD + ψ ALONG A RAY — build note (0.8.2 "Phase Space")

Branch `p3-bead-ray` off `af2e84b` (`yan-c`, right after v0.8.1-alpha). Builder: Opus, for the integrator. Tip: the commit that adds this note (`git log -1 p3-bead-ray`).

## What landed, by seat

- **`lab/calculus.js`**
  - `:17–18` the imports: `AXIS_TO_Z` joins `kick.js`' line; `applyRotor` from `frontier.js`.
  - `:27–30` **`expectR(re, im, ids, p)`**: (⟨x⟩, ⟨y⟩, ⟨z⟩) per unit norm, or ⟨p⟩ when `p`. ⟨x⟩ and ⟨y⟩ come from the slap's rotors on the same dipole integrals. `applyKick` uses K_x = R⁻¹ K_z R with R = `AXIS_TO_Z.x`, so x = R⁻¹ z R and ⟨x⟩ = ⟨Rψ|z|Rψ⟩ = `dipoleZ` of the state turned by R. ⟨p⟩ takes the same road through `momentumZ`. I used the rotors, not the l ± 1, m ± 1 integrals.
  - `:31–33` **`beadOf(reg, t, p)`** returns `{ r, T, key: reg.version, t }`. T is the trail's period: 2π / the slowest beat min|E_a − E_b| of the populated set, or ∞ for a single level, where the bead stands still.
  - `:34–36` **`rayAt(re, im, ids, u, half, p, N = 128)`** gives N samples of the Hamiltonian in force's `psiAt` (or `phiAt` when `p`) from the origin along the unit vector u out to `half`.
  - `:110` `stats` gains `r: expectR(…)`, the bead beside ⟨z⟩, as a field of the record and not as rows. The tiles, the prose figure and `tests/calculus.test.mjs` are unchanged.
- **`lab/skeleton.js`**
  - `:12–14` **`centroid(atoms, μ, id)`** gives a molecule's bead (see correction 2).
  - `:16` the trail's three slots.
  - `:18–22` `draw(atoms, dipole, obs, half, bead)`. The atoms may be null when SKELETON is off. The trail gains a point when t has advanced by T/64, holds 64 points, and starts again on a register version jump or when the clock runs back.
  - `:24` the bead and the trail join the key, so a paused, unchanged bead costs no paint.
  - `:37–42` the dipole arrow's two early `return`s become a guarded block, so the bead draws after it.
  - `:43–45` the trail is drawn in the accent, fading toward its tail. The bead is a 6 px disc in the accent with a 1 px ink rim, at 0.8 alpha on the far side.
- **`lab/rack.js`**
  - `:25`, `:27` the imports (`centroid`, `beadOf`).
  - `:506–507` the skeleton's tick, **one line → two**: `skOn` / `bdOn`. The canvas paints when either is on, and the bead draws with SKELETON off. For a molecule the bead is `centroid(atomsNow, dipoleNow, preset)`. Otherwise it is `beadOf(reg, clock.t, space === 'p')`, and it stands down under a Sturmian as CALCULUS does. With neither on, `skeleton.clear()` runs as before.
  - `:541` CALCULUS's tick (modified, 0 net) now passes `domain.half`, the space and the molecule flag. A molecule updates only the RAY's sentence. The stats stay skipped, as before.
- **`lab/calculusview.js`**
  - `:14–15` the **RAY** tile: a kit `readout` (`wide calc-ray`) with its canvas, seated between the grid and the foot.
  - `:38–49` `update(reg, t, half, p, mol)`:
    - It is keyed on (version, t, half, space, molecule) and redrawn at CALCULUS's cadence through its `may()`.
    - The ray runs from the origin through the bead, along ẑ when |⟨r⟩| < 1e-3.
    - Three curves, each over the ray's max |ψ|: Re ψ in the kit's ink, Im ψ in its lighter tone (0.4), |ψ|² in the accent, plus a faint zero line.
    - The scale is printed as `0 → half lengthUnit`, with the direction, ⟨r⟩ (⟨p⟩ in p) and max |ψ| beneath.
- **The switch**
  - `lab/windows/molecules.js:57–58`: `ui.beadSw = sw({ label: 'BEAD', … })`, handed to `createChem` as `api.bead`.
  - `lab/chemview.js:301`: the same line now seats BEAD right after SKELETON on the VIEW row (0 lines added).
- **PREFERENCE `bead`**
  - `lab/shell/settings.js:37` (the writer): `bead: (ui.beadSw && ui.beadSw.get()) || undefined`. The key is absent while off.
  - `:106` (the reader): `ui.beadSw.set(s.bead === true)`.
  - `docs/STATE-SCOPES.md`: one row, covering `skeleton` and `bead`, PREFERENCE.
- **`lab/lab.css:413–414`**: the RAY tile shows under LEAN, as the grid's tiles do, and its canvas is 56 px tall.
- **`lab/sw.js`**: the precache rows, rewritten by `pwa --write`.
- **`tests/bead-ray.test.mjs`**: 29 lines, 7 laws.
- **Not touched:** `lab/windows/readouts.js` (P2's METERS seat is free of me), `lab/field.js`, `lab/wigner*.js`, `lab/meters.js`, `lab/mir/**`, `lab/fonts/**`.

## The numbers (`tests/bead-ray.test.mjs`, all green)

**The sign convention.** The tree's radials are positive near the origin (R₂₀ = (1/√2)(1 − r/2)e^{−r/2}, R₂₁ = r e^{−r/2}/(2√6)), and the angular part is Condon–Shortley Y_lm. So ⟨2s|z|2p₀⟩ = (1/√3) · ∫R₂₀R₂₁r³dr = (1/√3)(−3√3) = **−3**, and (2s + 2p₀)/√2 leans to **−z**.

| state | ⟨r⟩ (a₀) | gate |
|---|---|---|
| 1s | (0, 0, 0); T = ∞ | 1e-12 |
| (2s + 2p₀)/√2 | (−4.7e-16, −4.7e-16, −3.000000000000) | 1e-12 against (0, 0, −3) |
| that state turned to x̂ (the slap's rotor `AXIS_TO_Z.x`, run back) | (−3.000000000000, 0, −4.7e-16) | 1e-12 against (−3, 0, 0), plus a convention-free sign check: \|ψ(−3,0,0)\|² > \|ψ(3,0,0)\|² |
| (1s + 2p₀)/√2 at t = 0 | ⟨z⟩ = 0.744936 = 128√2/243; T = 16.755161 = 2π/(3/8) | T to 1e-12 |

The same rotation to ŷ (checked during the build, not gated) gives (0, −3, 0), with the density leaning to −y.

**The ray.**

| check | result | gate |
|---|---|---|
| 1s along ẑ to 20 a₀, 128 samples, against e^{−r}/√π | worst \|Δ\| 5.6e-17, Im 0 | 1e-12 |
| the 1s ray's norm, 4π∫\|ψ\|²s²ds on the 128 points (trapezoid) | 1 | 1e-3 |
| the oscillator's \|0⟩ along (0.6, 0, 0.8) to 6, against π^{−3/4}e^{−r²/2} | worst 0 | 1e-12 |

## The browser check (one session, headless Firefox, 1600×1000, port 9501)

- **The Stark state shot:** `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-aecc7765061d6789f/.tmp/p3-stark-bead-ray.png`. Not committed. The state is 2s + 2p₀ (SPECTRUM's two toggles), BEAD on, CALCULUS floated open.
  - CALCULUS reads ⟨z⟩ = −3.000000 and `stats().r` = (−3.3e-16, −3.3e-16, −3.000000).
  - The teal bead sits below the origin, on the big red lobe.
  - The RAY tile reads "0 → 16.0 a₀ · along (−0.00, −0.00, −1.00) · ⟨r⟩ = (−0.000, −0.000, −3.000) · max |ψ| 1.99e-1". Its plot shows Re ψ dipping through its node, Im flat at 0, and |ψ|² in the accent.
  - No page errors.
- **The trail shot**, same session: `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-aecc7765061d6789f/.tmp/p3-1s2p-trail.png`. The state is 1s + 2p₀, played 6 s (t = 23.8) and paused. The bead is at ⟨z⟩ = −0.657, and its trail runs vertically along z through the oscillation. The theme and field in that frame were caught mid-repaint after the play. That is not this row's code: nothing here touches either.
- **The first shot found one defect, fixed in `72f74ae`:** LEAN hides every `.ro` outside `.calc-grid`, so the RAY tile was invisible. It now has the grid tiles' LEAN exception.

## The gates

- **`node tests/pwa.test.mjs --write`, then `./test.sh node`:** rc 0, **0 RED** (1095 GREEN/PASS lines), run after the last `lab/` edit.
- **`node tests/calculus.test.mjs`:** 0 failing of 8. **`tests/dynamics.test.mjs`:** 0 of 19. **`tests/kick.test.mjs`:** 0 of 16. **`tests/rack-deps.test.mjs`:** PASS.
- **`node tools/rack-deps.mjs --classes`:** HOLDS. 0 bare cross-scope writes, SPECTRUM at 25 (untouched), the `app` literal unchanged (30 keys).
- **`node tools/new-project.mjs --check`:** in step (16117 B).
- **`node tools/serialize-bytes.mjs`:** run on the base (`git archive af2e84b`) and on this tree, both served at 9501 in turn. The 11 readings' JSON is **identical**, so the edit bytes never move.
- **`node tools/settings-probe.mjs`:** **4 of 6 scenes RED, on the base too.**
  - Its `--out` JSON on the base and on this tree is byte-identical, so this row adds nothing to it.
  - The reds are WORKSPACE `closed` order for `lattice` / `bloch` / `central` (0.7.2 / 0.8.1 cards), plus a `modwin.modes` row on WAVE DANCER. They predate this cut, and are for the integrator.
  - `bead` is absent while off, so no blob changes.

## Corrections to the brief

1. **`bead(obs, half, W, H, r, trail)` is not a separate function.** It is a fifth argument of `draw`. The canvas is shared, and the skeleton's key decides both the clear and the paint. A separate `bead()` would either be erased by the skeleton's keyed clear or paint over a frame the key had skipped. `draw` takes no W, H: it reads its own canvas's client size, as V2 recorded.
2. **A molecule's bead is not "the solve's dipole divided by the electron count".** The solve's μ is nuclear minus electronic (`rhf-molecule.js:223`), μ = ΣZ_A R_A − ∫ρ r. So the centroid of the electron density is **(ΣZ_A R_A − μ)/N_e**, with N_e = ΣZ − q, and q is the preset's formal charge (`moleculeCharge`). μ/N_e alone is that centroid's offset from the centre of nuclear charge, reversed in sign and scaled. I built the centroid, and the switch's hover says so.
3. **Momentum space.** Every Hamiltonian has a `phiAt`, but only hydrogen's is a momentum function. The oscillator, the box, ATOM, QUARKONIUM and CENTRAL alias `phiAt: psiAt`; for the oscillator that is ψ(x) without the (−i)^N phase, wrong for a superposition. The rule is therefore: the ray in p runs where `phiAt !== psiAt` (hydrogen at any Z and μ), and elsewhere the tile says so in a sentence.
4. **In p the bead is ⟨p⟩, not ⟨r⟩.** The stage then shows momentum space. It comes from the same rotors on `momentumZ`, the Heisenberg form CALCULUS's ⟨p_z⟩ uses.
5. **"64 points over the last period":** the period is the bead's own slowest beat, 2π/min|ΔE|. It is not the transport's density period, which `app.hooks.period()` can only give by forcing a synchronous scan on an incommensurate spectrum, and which is the wrong clock for a dipole anyway.
6. **The RAY tile lives in `lab/calculusview.js`, where CALCULUS's tiles are built,** not in `lab/windows/readouts.js`. The merge with P2 therefore shares no file but `lab/sw.js`.
7. **`stats` gains the bead as a field `r`, not as two rows.** Rows would add two tiles and two sentences to the prose figure, and change `calculus.test`'s shapes. The RAY tile prints the vector.

## Dropped, and why

- **The ray for a molecule:** the AO evaluator on the frame thread is not free this cut. The tile says so, as planned.
- **The trail for a molecule:** its bead is static (T = ∞). VIBRATE poses move it, but they leave no trail.
- **A real-time (TDHF) molecular bead:** `dipoleNow()` gives the ground solve's μ, or VIBRATE's posed one, never the kick's live δμ.
- **CAPTURE:** `#skeleton` stays out of `capture.js`' default overlay list (V2's reason: every capture's report would change).
- **The bead under a Sturmian:** it stands down with CALCULUS.

## Δ lines

`lab/` (the plan's count): **29,863 → 29,893 = +30** (budget +60, cap 30,161).

| file | Δ |
|---|---|
| calculus.js | +11 |
| skeleton.js | +8 |
| calculusview.js | +7 |
| molecules.js | +2 |
| rack.js | +1 |
| settings.js | +1 |
| chemview.js | 0 |
| sw.js | 0 (rewritten rows) |

The test is 29 lines.

## For the integrator at the merge

- **`lab/rack.js`:** this row changes `:25`, `:27`, `:506–507` (the skeleton's tick, now two lines) and `:541` (CALCULUS's tick).
- **`lab/windows/readouts.js`:** untouched.
- **`lab/sw.js`** conflicts with every row: re-run `pwa --write` after the merge.
- **THE LOCK:** this row makes no field write. With the BEAD off, `skeleton.clear()` is the old one clear and then nothing. With CALCULUS closed, `may('calculus', wCalc)` refuses. The overlay canvas is not in the lock's readback.
