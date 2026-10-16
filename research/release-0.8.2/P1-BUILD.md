# 0.8.2 P1 THE OSCILLATOR'S WIGNER — build note (Opus builder, 2026-10-16)

Branch `p1-wigner-qho` from `af2e84b`. Δ `lab/` **+30** (29,863 → 29,893; budget +40, cut cap 30,161). No push.

## What landed (seats)
- **The oscillator's radial road**, `lab/wigner.js`: `recOf(a, qho)` l.115–119 builds A = qhoNorm · d^{l−|m|} · L^{(l+½)}_{n_r}(d²) · D_{l|m|}(c) · e^{−d²/2}
  (the same Y_lm machinery, `qho.js`' norm and half-integer Laguerre); `amp` l.128 (ρ = d² for qho); `prepare(terms, qho)` l.142, λ = 2 l.162;
  `chordAxial` l.177–182 (one branch: the inner integral in u = s_ρ²); `wignerAxial` l.240, `wignerSlice` l.257/264, `sliceMomentumMarginal` l.362 take
  `qho`. One integrator, no copy. The window chooses the road from the Hamiltonian in force (`lab/wignerview.js` l.161).
- **Why the inner rule is exact for the oscillator (DERIVED-HERE).** With s_ρ² = u, d±² = u + w±², so e^{−(d₊² + d₋²)/2} = e^{−u} e^{−(w₊² + w₋²)/2}; every other factor
  (L(d²), s_ρ^{2|m|} = u^{|m|}, d^{l−|m|} D(w/d), D of parity l − |m|) is a polynomial in u, of total degree ≤ N_a/2 + N_b/2 ≤ 10. Gauss–Laguerre in u
  (s_ρ ds_ρ = du/2) with nd = 12 is exact to degree 23. There is no cusp (the Gaussian is smooth at the origin), and the s_z panels are hydrogen's rule with
  λ = 2: R_ext = tail/2 (12 at order normal, the chord e^{−s_z²} long gone) in panels of 3.
- **The stand-down** lifts in `lab/rack.js` `hydroReader` l.747/750/752 (three lines modified, none added, no `app` key): the reader without `rad`
  (WIGNER, and the facade's `__LW.wigner.slice()`) takes `qho`, with no Z check and no μ check (neither scales the oscillator). RADIATION (`rad`) is unchanged.
  BOX, QUARKONIUM, ATOM and CENTRAL keep it, each with its own sentence: `STAND`, `lab/wignerview.js` l.36–39, shown at l.201.
- **NEGATIVITY**, `lab/wignerview.js` l.77 (readout), l.170–172 (Σ|W|/ΣW − 1 on the drawn 64 × 64 slice), l.187–189 (the oracle line), the digest row in
  `table()`. The oracle line reads "Fock |1⟩ along z: W(0,0) = −1/π³ = (−1/π)·(1/π²) · the whole slice 4/√e − 2 = 0.4261" for the single label 2p₀,
  "a Gaussian: classical" for an oscillator slice reading below 5e-4, and "over the drawn slice, normalised to ∫W = 1" otherwise (hydrogen too).
- **Cap 21 under qho** (l.161), which is every m = 0 label, so a slap along z is integrated whole. Hydrogen keeps 6.
- **P RANGE follows Z RANGE for the oscillator** (l.210–211, when P RANGE is untouched; ħ = m = ω = 1 makes phase space square): at p ±2 the |1⟩ ring was
  13 % of its peak at the edge. Hydrogen keeps 2, and a P RANGE set by hand or by `setRange` is never moved (`pTouched`).
- Labels under qho come from `H.labelOf` (l.173).
- **The caption**: `lab/windows/film.js` l.7 `caption()` appends `wignerView.caption()` (`lab/wignerview.js` l.239): " · WIGNER · ∫|W| − 1 = 0.426" while the
  window is open and live. Like the rest of the caption it follows STAGE FORMULA.
- **The closed forms**: `lab/qho.js` l.104–110 `wignerFock(n, z, p)` = (−1)ⁿ/π · e^{−u} L_n(2u), Laguerre by recursion (5 lines of code).
- **`tests/wigner-qho.test.mjs`** (29 lines), picked up by `./test.sh node`'s glob.

## The closed-form table (node, `tests/wigner-qho.test.mjs`; order normal)
**The transverse factor.** The register's 1s is π^{−3/4} e^{−r²/2} = φ₀(x)φ₀(y)φ₀(z), and its 2p₀ ∝ z e^{−r²/2} = φ₀(x)φ₀(y)φ₁(z) (N = 2n − l − 2 = 1). The Wigner
transform factorises over Cartesian coordinates, because both ψ*(r+s)ψ(r−s) and e^{2ip·s} factorise. So W = W₀(x,p_x) W₀(y,p_y) W_n(z,p_z), and on the slice
x = p_x = y = p_y = 0 the transverse ground states contribute W₀(0,0)² = (1/π)²: **the slice is W_n(z, p)/π²**. No other single register label is a
|0 0 n⟩ (|0 0 2⟩ already mixes l = 0 and l = 2), which is why the Fock line is limited to 1s and 2p₀.

| state (register) | quantity | closed | measured | gate |
|---|---|---|---|---|
| \|0⟩ = 1s | W on 17 × 13 points, z ∈ [−4, 4], p ∈ [−3, 3] | W₀/π² | worst 4.4e-12 | < 1e-10 GREEN |
| \|0⟩ = 1s | W(0, 0) | +1/π³ = 0.032251534433199495 | 0.032251534433199516 | < 1e-12 GREEN |
| \|0⟩ = 1s | NEGATIVITY, 64 × 64 window (z ±5.6, p ±4) | 0 | 0.00000 (slice min +8.7e-23) | < 5e-4 GREEN |
| \|1⟩ along z = 2p₀ | W on the same points | W₁/π² | worst 8.3e-12 | < 1e-10 GREEN |
| \|1⟩ along z = 2p₀ | W(0, 0) | −1/π · 1/π² = −0.032251534433199495 | −0.03225153443319964 | < 1e-12 GREEN |
| \|1⟩ along z = 2p₀ | NEGATIVITY, same window | whole slice 4/√e − 2 = 0.42612 | 0.42600 (the kink at u = ½ on the grid) | < 5e-4 GREEN |
| slap k = 1 on \|0⟩ (21 labels, ‖c‖² = 0.999998829) | slice minimum | ≥ 0 (a displaced Gaussian) | −3.92e-9 (1.2e-7 of the peak 1/π³) | > −1e-8 GREEN |
| slap k = 1 on \|0⟩ | NEGATIVITY | 0 | 3.46e-8, reads 0.000 | < 1e-7 GREEN |

Measured beside the gates (the probe, not committed): a slap at k = 0.5 gives min −4.7e-10 and negativity 8.3e-10; at k = 1.5, −2.1e-6 and 3.4e-5. **With the
window's old cap of 6 labels**, the slap at k = 1 reads min −4.26e-4 and negativity **0.0094**: the cap, not the physics, would have drawn a non-classical
state, and that is why qho takes 21. The 21-label slice costs about 150 ms at 64 × 64 (the six-term hydrogen state about 120); the |1⟩ costs 10 ms + 15 ms.

**Hydrogen byte-identical.** A digest of hydrogen's numbers (three states; orders fast, normal and fine; the 24 × 20 slice bytes, min/max/argmin, wignerAxial
at two points, the momentum marginal) is `973d2905f6387ea72a4da5314026db9a048e69020c9d13082f764848ef87075a` on `af2e84b` and on this branch.
`tests/wigner.test.mjs` 16/16. **THE LOCK holds no Wigner digest** (`tools/perf/digest-lock.mjs` has no `wigner`), and WIGNER closed writes nothing.

## The browser check (one, headless Firefox on 9481; `tests/wigner.browser-test.mjs` does not exist)
`research/release-0.8.2/P1-wigner-qho-1.png`: the oscillator, preset 2p_z, WIGNER reopened. The card reads W(0,0) −0.0322515; MINIMUM −3.2252e-2 at (0, 0);
MAXIMUM 1.4387e-2 (closed: 2e^{−3/2}/π³ = 1.4387e-2); NEGATIVITY 0.426 with the Fock line; labels "N1 n_r0 p₊0"; Z ±5.65, P ±4. BOX stands down with its
sentence. Hydrogen 1s afterwards: W(0,0) 0.0322515, minimum −3.0973e-4 at (1.3295, 1.3791) as before, P ±2, NEGATIVITY 0.019 on its default window.
The caption tail was not exercised in the browser (one check); it is the one-line read above.

## Gates run
`node tests/wigner-qho.test.mjs` ALL GREEN · `node tests/wigner.test.mjs` 16/16 · `node tests/qho.test.mjs` 11/11 · `node tests/pwa.test.mjs --write` then
`./test.sh node` rc = 0 (twice, after the last `lab/` edit too) · `node tools/rack-deps.mjs --classes` HOLDS (spectrum 25/25 untouched; film 8) ·
`node tools/new-project.mjs --check` in step · `node tools/serialize-bytes.mjs` on this tree and on `git archive af2e84b`: the 11 readings agree.

## Corrections to the brief (the true thing was built)
1. No NEGATIVITY readout existed ("already printed for hydrogen" is wrong). It is new, on every register.
2. "∫|W| − 1 over the slice" means nothing unnormalised, because the slice's ∫∫W is 1/π² for both |0⟩ and 1s, not 1. The readout is ∫|W| − 1 of the
   **slice normalised to ∫W = 1, over the drawn window**. For |0 0 n⟩ the transverse 1/π² cancels and it equals the 1-D ∫|W_n| − 1 (Kenfack–Życzkowski 2δ).
3. On the 3-D slice, W(0,0) for |1⟩ along z is **−1/π³ = −0.0322515**, not −0.3183. −1/π is the 1-D value, and the slice carries the transverse 1/π². In the same
   way, |0⟩ matches e^{−(z²+p²)}/π³, not /π.
4. "The single label n = 1, l = 1, m = 0" does not exist (l < n). |1⟩ along z is the register label **2p₀** (n = 2, l = 1, m = 0, N = 1).
5. The stand-down is not at `wignerview.js:22` (that line is a comment). It is `rack.js` `hydroReader`, lifted there for WIGNER only.
6. The coherent gates −1e-12 / 1e-9 cannot hold on the register. It holds N ≤ 5 whole (N = 6 lacks l = 6), so the slap is a truncated coherent state
   (‖c‖² = 1 − 1.2e-6). The gates are the measured truncation: min > −1e-8, negativity < 1e-7.
7. "The same quadrature": the cusp-adapted Gauss–Laguerre in d_N would only approximate a Gaussian. The exact road is Gauss–Laguerre in u = s_ρ² (above). The
   s_z rule and the grid are the same.

## Dropped, and why
- `wignerAt` (off-axis, φ trapezoid) stays hydrogen-only: the window never calls it, and it reads `hydrogen.js`' tables by construction, so it never pretends.
- No change to `lab/windows/readouts.js` (WIG_OK, the card's seat), `lab/field.js`, SPECTRUM or the facade's shape.

## For the integrator at the merge
- Files: `lab/wigner.js`, `lab/wignerview.js`, `lab/qho.js`, `lab/rack.js` (hydroReader, l.747/750/752), `lab/windows/film.js` (l.7), `lab/sw.js` (hashes:
  re-run `node tests/pwa.test.mjs --write` after merging P2/P3), `tests/wigner-qho.test.mjs`, this note and the PNG.
- `film.js` now reads `app.w.wignerView` at the take. The slot is filled at readouts' third seat, before any take.
- THE LOCK: no Wigner digest, so nothing for P1 to re-bake. The hydrogen digest above can be re-read with the 14-line script in the session (not committed).
