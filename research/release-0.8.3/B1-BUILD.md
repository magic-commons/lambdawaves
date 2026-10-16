# B1 THE RADIAL BREATH + REVIVAL — build note (0.8.3 "Breath")

The branch is `b1-breath`, cut from `f3f4ccb` (`yan-c`, right after the v0.8.2-alpha cut). An Opus builder built it for the integrator. The tip is the commit that adds this note (`git log -1 b1-breath`).

## Two corrections to the brief, both built as the true thing

1. **The shipped `rydberg` preset does not breathe.** It holds the circular states |n, n−1, n−1⟩, so each (l, m) block has exactly one n. That makes P(r, t) = r² Σ_lm |c_n R_nl|², which has no cross terms and does not change with time. The packet moves in angle (it orbits in xy), not in r. Measured: ⟨r⟩ = 28.048137 at t = 0, 50 and 500. For REVIVAL to show a breath, it has to load a packet whose levels share one (l, m).
   - So REVIVAL loads a new STATE preset, **`rydberg-s`**. It uses the same Gaussian as `rydberg` (`gauss(5, 1, [4, 5, 6])`), placed on ns.
   - The populations and energies are identical to `rydberg`. That means n̄, T_cl, T_rev and A(t) are the same numbers. The difference is that P(r, t) breathes: ⟨r⟩ runs 25.617 → 27.124 → 42.562 at t = 0, 50 and 500.
   - `rydberg` itself is unchanged.
2. **T_rev is (2n̄/3)·T_cl, not (n̄/3)·T_cl.** LADDER's own law, `frontier.js` `revivalClocks`, which `ladder.js` prints, is T_rev = 4πn̄⁴/3 = 2π / (|E″|/2). Expanding T_rev / T_cl = (4πn̄⁴/3) / (2πn̄³) gives 2n̄/3. The brief's 1309 a.u. at n̄ = 5 is the half revival. The true value is 2618 a.u.
   - REVIVAL calls `revivalClocks` itself, so the two windows print one number.
3. **"A(T_rev) within 2 % of A(0)" is false at n̄ = 5, so it is printed, not gated.** LADDER's law is exact only to quadratic order in n − n̄. On three levels at n̄ = 5, the linear phase at T_rev is 2π·(2n̄/3)·k, which is not a whole number of turns because 10/3 is not an integer. The cubic phase is β₃ = 8πσ³/3n̄ = 1.68 rad at σ = 1. Neither is small.
   - Printed by the test: A(T_rev) = 0.037614 (miss 0.9624). The peak within ±T_cl of T_rev is 0.8867, at T_rev − 0.555 T_cl.
   - What the test gates instead is the register's own exact recurrence. The beat ratio (E₅ − E₄) : (E₆ − E₅) = 81 : 44, so the density period is T = 2π·7200 = 45238.93 a.u. (`densityPeriod`). There A = 1 to 1e-10.
   - LADDER's T_rev beyond cubic order is deferred by name in the plan.

A smaller point: the tile lives in `lab/calculusview.js`, where CALCULUS's tiles live since 0.8.2 P3. `lab/windows/readouts.js` only seats the window, and gains one modified line.

## Seats

- **`lab/calculus.js:37–44`** **`radialBreath(reg, t, half, n = 256)`** returns `{ r, P, norm, rMean }`.
  - P(r, t) = r² Σ_lm |Σ_n c_nlm(t) R_nl(r)|². It makes one pass over the populated labels grouped by (l, m), using `radial` from the Hamiltonian in force.
  - The nodes are r = half·s²/(1 − s), s ∈ [0, 1]. They are dense at the origin, and the last node is r = ∞, where P = 0. So the trapezoid in s on the same 256 nodes integrates over the whole half-line.
  - The integrand vanishes like s^{4l+5} at s = 0 and exponentially at s = 1. The trapezoid's endpoint terms therefore vanish, and 256 nodes give 1e-12 to 1e-14.
  - `norm` = ∫P dr. `rMean` = ∫rP dr / ∫P dr.
  - The plot draws the nodes with r ≤ half (about 158 of the 256 when half is the picture's).
- **`lab/calculusview.js`**
  - `:7–8`: the imports. `radialBreath`, `revivalClocks` from `frontier.js`, `PRESET_BY_ID` from `state.js`, and the kit's `trig`.
  - `:10`: the signature becomes `createCalculus(host, opt = {})`.
  - `:16–22`: **the BREATH tile and REVIVAL.**
    - The tile is a kit `readout` with classes `wide calc-ray`. It shares the RAY tile's CSS (the 56 px canvas and the LEAN exception), so it needs 0 CSS lines.
    - It is seated after RAY and before the foot.
    - Its canvas is followed by a row holding the REVIVAL trig and REVIVAL's printed line.
  - `:50`: the one call `breath(reg, t, half, p, mol)` inside `update`, right after `stats`, so it runs at CALCULUS's cadence through its `may()`.
  - `:57–64`: **`breath()`**.
    - A molecule or momentum space stands down with a sentence.
    - Otherwise it draws P(r, t) over [0, half] in `--fg`, the kit's ink. The scale is the running maximum for the current register version, so the breath's height is honest rather than refitted every frame.
    - The value shows `0 → half lengthUnit`. The sub shows `∫P = 1.000000000 · ∫rP/∫P = 46.3289 = ⟨r⟩ (Δ 9e-12)`, where Δ is against the ⟨r⟩ row from `stats`.
- **`lab/windows/readouts.js:106`** (modified, 0 net): `createCalculus(wCalc.body, { revival: (list) => app.sh.verbs.run(list, { name: 'REVIVAL' }) })`.
  - `app.sh.verbs` is made later in `boot()` (rack.js:827), so it is read inside the callback.
  - readouts' crossings go from 9 to 10, against a limit of 25.
- **REVIVAL**, a hand press and never run at boot, is **one verb list and one history row, `REVIVAL`**:
  1. `preset rydberg-s`, through `loadPreset(…, { hand: true })`, which announces it on the stage.
  2. `rate T_cl`. The `rate` verb consults the flash law. Its largest beat is E₆ − E₄ = 0.01736 rad/a.u. × 785.4 a.u./s = 2.17 Hz, under 3/s, so it passes. If the law ever held it, the verb's sentence would be appended to the line and RATE would be left alone.
  3. `play on`.
  - n̄ is the norm-weighted mean of the preset's populated n, computed from the preset's modes. It comes out at exactly 5. The line reads: `n̄ 5.00 · T_cl = 2πn̄³ = 785 a.u. · T_rev = 4πn̄⁴/3 = (2n̄/3)·T_cl = 2618 a.u. (LADDER's law, exact to quadratic order in n − n̄)`.
- **`lab/state.js:471–472`**: the `rydberg-s` preset, right after `rydberg`.
- **`lab/catalogue.js`**: regenerated by `node tools/catalogue-table.mjs`, adding one row on the hydrogen shelf (0 lines).
- **`lab/sw.js`**: rewritten by `pwa --write`.
- **`tests/breath.test.mjs`**: 32 lines, 6 laws.

## The integrals against their oracles (`tests/breath.test.mjs`, all green; 256 nodes)

| state | max \|∫P − Σ\|c\|²\| over t = 0, 50, 500 (gate 1e-10) | max \|∫rP/∫P − ⟨r⟩_stats\| (gate 1e-8) | ⟨r⟩ at t = 0, 50, 500 |
|---|---|---|---|
| 1s | 4.0e-14 | 6.2e-14 | 1.5 |
| (2s + 2p₀)/√2 | 2.9e-14 | 1.8e-13 | 5.5 |
| `rydberg` (circular) | 2.2e-16 | 5.0e-14 | 28.048137 (stands) |
| `rydberg-s` (radial) | 2.3e-12 | 6.0e-11 | 25.617138 · 27.123811 · 42.561962 |

`stats`' ⟨r⟩ is the bilinear form Σ c_a* c_b ⟨a|r|b⟩ over dynamics' Gauss–Legendre panels, an independent road.

The other laws:
- P(r, 0) of 1s = 4r²e^{−2r} pointwise, to 1e-12.
- The oscillator's |0⟩ gives (4/√π) r² e^{−r²} to 1e-12, with ∫P = 1 to 1e-10.
- The circular packet's ⟨r⟩ stands still, and the radial packet's moves by more than 5 a₀.
- n̄ = 5, T_cl = 250π, T_rev = 2500π/3, and A = 1 at the density period.

**The revival's miss** (printed by the test): n̄ 5.000000 · T_cl 785.398 · T_rev 2617.994 = 3.3333 T_cl · A(0) 1.000000 · **A(T_rev) 0.037614 (miss 0.9624)** · peak 0.8867 at T_rev − 0.555 T_cl · β₃(σ = 1) 1.676 rad. The cause is the cubic order and the non-integer 2n̄/3, as above.

## The browser check (one session, headless Firefox, 1600×1000, port 9511)

- **Screenshot:** `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a871201f687302696/.tmp/b1-breath-revival.png` (not committed).
- **What the session did:** CALCULUS reopened, REVIVAL clicked, 1.9 s of play, then paused at t = 1407.6 a.u. = 1.79 T_cl.
- **The state:** preset `rydberg-s`, RATE 785.398, and exactly **1** history row added, labelled `REVIVAL`. The stage formula reads "4s₀, 5s₀, and 6s₀".
- **The tile reads** `0 → 92.0 a₀ · ∫P = 1.000000000 · ∫rP/∫P = 46.3289 = ⟨r⟩ (Δ 9e-12)`. The plot is the packet's outer lobe, with the inner fringes near the origin. Below it are REVIVAL and its line.
- **Errors:** none on the page.

## The gates

- `node tests/pwa.test.mjs --write`, then `./test.sh node`: rc 0, 0 RED (`breath.test` included).
- `node tests/calculus.test.mjs`: 0 of 8 failing. `tests/bead-ray.test.mjs`: all green. `tests/period.test.mjs`: 0 of 11 failing. `tests/dynamics.test.mjs`: 0 of 19 failing.
  - There is no `tests/ladder.test.mjs`. `revivalClocks` is exercised by `frontier.test` in the node gate.
- `node tools/rack-deps.mjs --classes`: HOLDS. The `app` literal is unchanged at 30 keys. SPECTRUM is untouched at 25. readouts is at 10.
- `node tools/new-project.mjs --check`: in step (16117 B).
- `node tools/catalogue-table.mjs --check`: in step after regeneration.
- `node tools/serialize-bytes.mjs`: run on the base (`git archive f3f4ccb`) and on this tree, each served at 9511 in turn. The 11 readings' JSON is **identical**, so the edit bytes never move. The new preset is reached only by a hand.
- **THE LOCK:** not run here, because the integrator runs it ×2 at the merge. Nothing here touches `field.js`. CALCULUS closed means no paint and no field write: the tile is drawn only inside CALCULUS's `may()` tick.

## Dropped, and why

- **The brief's "(n̄/3)·T_cl = 1309 a.u.":** wrong, as correction 2 explains. LADDER's (2n̄/3)·T_cl = 2618 is printed instead.
- **The 2 % revival gate:** false at n̄ = 5, as correction 3 explains. The miss is printed, and the exact recurrence is gated instead.
- **Loading `rydberg` itself:** it does not breathe, as correction 1 explains. `rydberg-s` is loaded instead.
- **A time cursor on the period inside the tile:** not built. The BREATH plot is P against r at the current t, so the clock is the cursor. B2's A(t) tile is the time axis.
- **No stand-down sentence under a Sturmian,** because CALCULUS is not ticked at all under one (rack.js:541, unchanged).

## Δ lines

`lab/` goes from 29,952 to **29,977 (+25)**, against a budget of +55. By file: calculus.js +8, calculusview.js +17 net, state.js +2, readouts.js 0, catalogue.js 0.

## For the integrator (the merge with B2 and B3)

- **`lab/calculus.js`:** I touched only `:37–44`, a new block right after `rayAt`. B3's `covariance` belongs elsewhere.
- **`lab/calculusview.js`:**
  - `:7–8` (the import lines): B2 may also add imports here, so merge by union.
  - `:10`: the signature, now `opt = {}`.
  - `:16–22`: the BREATH block, after RAY's line 15 and before the note line. B2's A(t) tile goes AFTER this block.
  - `:50`: one inserted call, `breath(reg, t, half, p, mol);`, in update's stats line. B2's call follows it.
  - `:57–64`: `function breath`, just before the `return`.
- **`lab/windows/readouts.js:106`:** the `createCalculus` call now hands `{ revival }`. If B2 or B3 also hand an option there, merge the two objects.
- **`lab/state.js`:** one new preset. `lab/catalogue.js` must be regenerated after the merge (`node tools/catalogue-table.mjs`), then `pwa --write`.
