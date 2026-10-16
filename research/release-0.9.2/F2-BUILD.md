# F2 THE MOMENTUM BREATH — build note (0.9.2 "Flow")

Branch `f2-pbreath`, cut from `9aa8fb7` (`yan-c`, right after the v0.9.1-alpha cut). An Opus builder built it for the integrator. The tip is the commit that adds this note (`git log -1 f2-pbreath`).

## Corrections to the brief, built as the true thing

1. **The oscillator's momentum radial is (−1)^{n_r} R_nl(p), not R_nl(p).** The plan says the (−i)^N phase is "irrelevant to |·|²". That holds for one mode, but not inside one (l, m) block. There N = 2n_r + l, so two labels in the same block differ by (−1)^{Δn_r}, and that sign enters the cross term of |Σ_n c F|².
   - Measured by a Hankel transform in the throwaway: the transform of `qhoRadial` at p = 0.8 is +1.0909 (1s), −0.7660 (2s), +0.3822 (3s), +0.7125 (2p) and −0.8382 (3p). That is (−1)^{n_r} R(p) each time.
   - Built as `((n − l) % 2 ? 1 : −1) · H.radial` (`lab/calculus.js:42`). With it, the momentum breath of (|0⟩ + |2s⟩)/√2 at t = 0 is the position breath at t = π/2 (the quarter period is the Fourier transform) to 3e-16. With the plain R, it would be the position breath at t = 0, which is wrong.
   - Hydrogen needs no such sign. `momentumRadial` equals the Hankel transform of `hydrogen.js` `radial` to 6 digits for n = 1…6, l = 0, 1, so its (−i)^l is common to the whole (l, m) block.
2. **B1 returns `rMean` = ∫rP/∫P, not ∫rP dr.** It is kept under that name in position space. In momentum space the return is `{ r, P, norm, m2 }`, where `m2` = ∫p²P dp / ∫P. That is ⟨p²⟩ per unit norm, the same convention as `rMean`. It equals ∫p²P dp when the register is normalised, as it always is.
3. **Z and μ.** Hydrogen in force may be the scaled ion: `H.radial` is k^{3/2}R(kr), with k = Zμ. The momentum radial is therefore k^{−3/2}F(p/k). The exact printed beside ⟨p²⟩ is (Zμ/n)², which reads "1/n²" at k = 1.
4. **The p⁻⁴ tail needs its own nodes.** In momentum space, p²P falls only as p⁻⁴ for an s state. On B1's map r = half·s²/(1 − s), the trapezoid would end on a (1 − s)² endpoint, which is only O(h²) accurate. Momentum space uses p = half·s²/(1 − s)³ instead, with weight half·s(2 + s)/(1 − s)⁴. One expression `(2 − s + (e − 1)s)/(1 − s)^{e+1}` covers both maps. At e = 1 it is B1's `s(2 − s)/(1 − s)²` bit for bit, so position space draws and reads exactly as before.
5. **The axis is `half`, as passed in.** Under DOMAIN AUTO in momentum space, rack.js already sets it to `domainForP(n_min)` (rack.js:321). It is labelled `a.u.`.

## Seats

- **`lab/calculus.js:21`**: imports `momentumRadial` from `momentum.js`.
- **`lab/calculus.js:37–47`**: `radialBreath(reg, t, half, n = 256, p = false)`.
  - The radial `F` is `H.radial` in position space. In momentum space it is hydrogen's k^{−3/2}·`momentumRadial`(n, l, p/k) or the oscillator's (−1)^{n_r}·`radial`.
  - The node map takes exponent e = 3 in momentum space.
  - The loop's accumulator is renamed `q`, because `p` is now the flag.
  - It returns `m2` in momentum space and `rMean` in position space.
- **`lab/calculusview.js:8`**: imports the kit's `label`, used to flip the tile's label.
- **`lab/calculusview.js:20`**:
  - The two labels are in `BL`: "BREATH  P(r, t) = r² Σ_lm |Σ_n c_nlm(t) R_nl(r)|²" (unchanged) and "BREATH  P(p, t) = p² Σ_lm |Σ_n c_nlm(t) F_nl(p)|²".
  - `bKey` is now a string and `bLab` is the shown label.
- **`lab/calculusview.js:80–90`**: `breath()`.
  - A molecule still stands down with its sentence.
  - `q` = momentum space AND (hydrogen or the oscillator).
  - The label is written only when `q` flips.
  - The running max is keyed by `version|q`, so switching space starts a fresh scale.
  - Momentum space reads "∫P = 1.000000000 · ⟨p²⟩ = 1.0000 (exact 1/n² = 1)". The exact is printed only for one hydrogen label.
  - The box, ATOM and CENTRAL in momentum space read "momentum space: the breath is position's · ", followed by the position readout, and draw P(r, t). In practice the selector forces position space for them (`spectrum.js:183`, `noMomentum`), so this is a guard.
  - The position readout line is unchanged.
- **`lab/sw.js`**: the `pwa --write` restamp.

## The numbers (throwaway `.tmp/f2-check.mjs`, not committed)

| check | measured | exact |
|---|---|---|
| 1s P(p) against 32p²/(π(1 + p²)⁴), every node ≤ half = 4 | max dev 3.33e-16 | 0 |
| 1s ∫P dp · ⟨p²⟩ | 1.000000000000 · 1.000000000000 | 1 · 1 |
| 2s, 2p₀, 2p₊₁ ∫P · ⟨p²⟩ | 1.000000000000 · 0.250000000000 (all three) | 1 · 1/4 |
| 3d₋₁ ⟨p²⟩ | 0.111111111111 | 1/9 |
| 6s (half = 1) ∫P · ⟨p²⟩ | 0.999999999998 · 0.027777777778 | 1 · 1/36 |
| 4s/5s/6s packet (0.3, 0.6, 0.3), ∫P(p) at t = 0, 300, 1309 | 1.0000000000 each; ⟨p²⟩ 0.100082 → 0.012871 → 0.015479 | Σ\|c\|² = 1 |
| oscillator \|0⟩: P_p(p) against P_x(p) | max dev 0 (identical); ⟨p²⟩ = 1.500000000000 | self-dual; 3/2 |
| oscillator (\|0⟩ + \|2s⟩)/√2: P_p(p, 0) against P_x(p, π/2) | max dev 3.33e-16; ⟨p²⟩ = 3.724744871 | 5/2 + √(3/2) |

## The browser check

This was one headless Firefox run through `tools/gate/gatekit.mjs` `open`/`snap`, served on 9601 by its own pid and stopped afterwards. The throwaway is `.tmp/f2-snap.mjs` (not committed). It booted at `?preset=1s`, raised CALCULUS and called `__LW.setSpace('p')`, which is the WAVE seg's own setter.

| state | label | value | readout |
|---|---|---|---|
| 1s, momentum | "BREATH  P(p, t) = p² Σ_lm \|Σ_n c_nlm(t) F_nl(p)\|²" | "0 → 4.0 a.u." | "∫P = 1.000000000 · ⟨p²⟩ = 1.0000 (exact 1/n² = 1)" |
| 1s, back to position | the B1 label | "0 → 7.0 a₀" | "∫P = 1.000000000 · ∫rP/∫P = 1.5000 = ⟨r⟩ (Δ 6e-14)", the B1 line unchanged |
| momentum, then REVIVAL pressed (`rydberg-s` playing) | the momentum label | "0 → 1.0 a.u." | "∫P = 1.000000000 · ⟨p²⟩ = 0.0598", 0.0626 at the snap a moment later; space stays `p` with 3 populated |

- In the screenshot, the 4s/5s/6s packet's P(p, t) bunches at small p while ⟨r⟩ is out at 33.6 a₀.
- The page logged no errors.
- **Screenshot:** `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a387ddf15a85fbe59/.tmp/f2-breath-p.png` (not committed; `.tmp/` is ignored).

## Gates

- `node tests/pwa.test.mjs --write` was run.
- `./test.sh node` exited 0.
- `node tools/rack-deps.mjs --classes --no-write` exited 0.
- `node tools/new-project.mjs --check` reports "in step".
- `node tests/calculus.test.mjs` is GREEN, 0 failing of 8.
- No new test file and no gate script.
- `lab/field.js`, `lab/sliceview.js`, `lab/mir/**` and `lab/fonts/**` are untouched.

## Δ lines

`lab/` (without `lab/mir/`) goes from 30,028 to **30,033** (+5 against a budget of +30).

## Dropped

- **No new tap.** REVIVAL followed by WAVE › MOMENTUM is the picture the plan describes.
- **No momentum breath for the box, ATOM or CENTRAL.** They have no momentum road. This is deferred by name in the plan.
- **No exact for an oscillator label.** The plan names the exact only for hydrogen. ⟨p²⟩ for an oscillator label is (N + 3/2) by the virial, but it is not printed.
