# 0.8.1 T3 — THE LATTICE PRESETS: HOFSTADTER · QUANTUM WALK · SPIN CHAIN (build note)

Builder: Opus 5.5 (as Claude Fable 5.1's T3 row), 2026-10-16. Branch `t3-presets` from base `c383e8e`; NOT pushed.
Brief: `T3-BRIEF.md`; plan: `BUILD-PLAN.md` row T3.

## What landed
Three new rows in LATTICE's preset table, riding the seams L1 and L2 left. No new abstraction, no new window, and no new `app` key. A saved project's
LATTICE record is unchanged at its defaults (the three new keys `fp`, `fq` and `ns` are absent from a save unless moved).

| preset | model | picture | readout |
|---|---|---|---|
| **HOFSTADTER** (`L fp fq`) | the L × L square (L clamped to ≤ 12), the Peierls phase e^{2πiΦx} on every y-bond (Landau gauge), Φ = p/q (p 0–8, q 1–8). A **torus** when Φ·L is a whole number (and L > 2), otherwise open edges. Hermitian, solved by `hermitianEigen` | the existing site bars on the grid; wrap bonds are not drawn | Harper: `q′ = q/gcd(p, q)` bands ("the middle two touch" at even q′), torus or open, and the measured spectrum's largest gaps (q′ − 1 of them at odd q′, q′ − 2 at even) with their centres |
| **QUANTUM WALK** (`N`) | a **MAP, not a Hamiltonian**, so there is no eigensolve (`prepare` hands `{ n, E: null }`). The Hadamard coin, then the shift (↑ right, ↓ left), on a ring of N ≤ 128 sites (256 amplitudes), starting from (\|↑⟩ + i\|↓⟩)/√2 at the centre. PLAY takes one step each 1/J (⌊t⌋ steps, cached forward and restarted only when t goes back) | site bars of the probability summed over the coin; the hue is the coin's balance (P↑ − P↓)/P mapped to the phase ±π/2 | σ² measured · (1 − 1/√2)t² ballistic · t classical. The sub-line gives σ²/t² and flags t > N/2, when the ring's two fronts can meet |
| **SPIN CHAIN** (`ns`) | the XX chain H = J Σ (σ⁺ᵢσ⁻ᵢ₊₁ + h.c.), open, N ≤ 8 spins on the 2^N ≤ 256 computational states, built directly (an ↑↓ neighbour pair flips) and diagonalised exactly by `eigSymQL`. The quench starts from \|↑↓↑↓…⟩ (SITE n = the product state whose set bits are the ↑ spins; entering the preset or changing N resets to Néel). A click on a spin flips it in the initial product state | the N spins' ⟨σ_z⟩ as bars on an absolute scale (\|z\| ≤ 1, never renormalised to the maximum), the hue the sign. The note says why 2^N basis bars would be the wrong picture | S(t) = −Tr ρ_A ln ρ_A of the first ⌊N/2⌋ spins (ρ_A = MM†, solved as its real 2d × 2d embedding through `eigSymQL`), beside the true maximum ⌊N/2⌋ ln 2 and Page's random-state mean; the eight ⟨σ_z⟩. The CLOSED FORM line prints Jordan–Wigner's levels, and "the measured levels agree to 2.3e-14" (N = 8) |

The state seg is hidden for WALK and SPIN, since neither has a meaningful PACKET. SPIN keeps the `n · m` knob for its product state. The eigen-ladder strip
is skipped for the walk because it has no levels.

## Seats (file:line at the tip)
- `lab/lattice-model.js:8`: the three PRESETS rows. `:9`: DEFAULTS `fp: 1, fq: 3, ns: 8`. `:17`: `gcd`.
- `lab/lattice-model.js:23–24`: the HOFSTADTER `build` branch (torus test, hop list with the per-bond phase as a 4th element). `:25`: the SPIN picture's N sites.
  `:27`: the WALK's N ≤ 128 clamp on the chain geometry.
- `lab/lattice-model.js:30–32`: n = 2^N for SPIN; `im` for HOFSTADTER; `th` is now AB's alone (a Φ set on the AB ring does not leak into Hofstadter's
  x-bonds); the SPIN flip-flop fill; the hop fill takes a per-hop phase `th1` (defaulting to AB's `th`, so the AB ring's matrix is byte-identical).
- `lab/lattice-model.js:58–65`: `walker(N)`. `:66–73`: `spinView(psi, N)`.
- `lab/lattice-model.js:95–99`: `closed(p, E)`. HOFSTADTER's band count and the measured gaps (from E), WALK's law, SPIN's Jordan–Wigner levels and Page/max line.
- `lab/lattice.js:8–9`: knobs FLUX p, FLUX q, SPINS. `:11`: `ENTER`, each preset's own start (TUNNEL's old line folded in, the same packet). `:16–18`: the three
  notes. `:28`: the readout THE RUN. `:30–31`: `sync` (seg and SK knobs hidden for the walk; THE RUN shown for WALK and SPIN). `:34–35`: `set` (ENTER;
  the Néel reset). `:42`: the walk skips the solve. `:46–50`: `restate` (walker or evolver; "a map: no levels"; "states" for SPIN).
  `:58–60`: `paint` (SPIN's view and S(t); the bars loop over the view's length; absolute scale for SPIN). `:67–68`: WALK's σ². `:69`: wrap bonds not drawn.
  `:72–73`: the eigen strip over `S.n`, skipped without E. `:77`: the click loops over the picture's sites; SPIN flips.
- `tools/catalogue-table.mjs:66–67`: the three catalogue rows (since 0.8.1, oracle `lattice-presets.test.mjs`). `lab/catalogue.js` was regenerated (0 Δ lines: the shelf is one line).
- `tests/lattice-presets.test.mjs` (26 lines, 4 laws).

## The numbers, with their gates
- **HOFSTADTER Φ = 1/2**, 12 × 12 torus, against ±2J√(cos²k_x + cos²k_y) over the magnetic zone (k_x = 2πj/L, j < L/2): **3.2e-14** (gate 1e-10). The
  spectrum spans ±2√2. The two bands touch, so the app prints "no open gap" (the largest finite-torus spacing there is 1.000).
- **HOFSTADTER Φ = 1/3**, 12 × 12 torus: three bands, two gaps of **1.267949** each, centred at E = ±1.37. That is Harper's exact gap 3 − √3 = 1.267949 (band edges
  from E³ − 6E = ±4: [−2.732, −2], [−0.732, 0.732], [2, 2.732]). Gate: within 1e-3 of 3 − √3, both gaps. Φ = 1/4: two gaps of 1.761 at ±1.80.
- **QUANTUM WALK**, N = 128, symmetric coin: σ²(50)/t² = **0.29313** measured, against **1 − 1/√2 = 0.29289** known (the second moment of Konno's weak limit
  for the Hadamard walk, independent of the initial coin; N. Konno, Quantum Inf. Process. 1 (2002) 345 and J. Math. Soc. Japan 57 (2005) 1179; also
  Ambainis–Bach–Nayak–Vishwanath–Watrous, STOC 2001). That is **+0.080 %** (gate 2 %). Σ P − 1 = 6.9e-15 (gate 1e-12), and the mean is 0 to 1e-12. At t = 40 in the app:
  σ² 469.10 against 468.63. (The finite-t ratio falls 0.2995 → 0.2940 → 0.2932 → 0.2931 at t = 10, 20, 40, 50.)
- **XX CHAIN** spectrum against Jordan–Wigner Σ_occupied 2J cos(πk/(N+1)) (all 2^N subset sums, computed independently in the test): **1.2e-14** at N = 6
  (gate 1e-12). 2.3e-14 at N = 8 in the app's readout.
- **S(t)** after the Néel quench, sampled every 0.5/J to t = 200: S(0) = 0 to 1e-12 (⟨σ_z⟩ = ±1 to 1e-12), unitarity to 1e-12 at every sample, and
  S(t) ≤ ⌊N/2⌋ ln 2 throughout. Peak: **N = 6: 2.0580** at t = 37 (max ln 8 = 2.0794, Page's mean 1.5794). **N = 8: 2.5157** at t = 132.5 (2.5199 at t = 103.25
  on a 0.05 grid; max 4 ln 2 = 2.7726, Page's mean 2.2726). The spin chain solves in 56 ms at N = 8, and a frame (evolve + view + entropy) takes 0.35 ms.

## Screenshots (headless Firefox, port 9471; not committed)
- `.tmp/t3-walk-t40.png` (card crop `.tmp/t3-walk-t40-card.png`) shows QUANTUM WALK at t = 40/J: the two ballistic fronts in their two coin hues, and THE RUN
  reading "σ² 469.10 measured · 468.63 = (1 − 1/√2)t² ballistic · 40 = t classical".
- `.tmp/t3-spin-chain.png` (crop `.tmp/t3-spin-chain-card.png`) shows SPIN CHAIN N = 8 at t = 30/J: the eight ⟨σ_z⟩ bars and "S(t) 1.6669 · the most 4 ln 2 =
  2.7726 · Page's mean 2.2726".
The driver had no page errors. The card ships LEAN (readouts hidden) on a first profile, so the script lifted LEAN to show the readouts.

## Corrections to the brief
1. **Page's (N/2) ln 2 − ½ is not a bound. It is the MEAN entanglement of a random pure state.** The XX quench crosses it at both N = 6 (2.058 > 1.579) and N = 8
   (2.516 > 2.273). The law "S(t) ≤ the Page bound" is false and would fail. Instead, the test asserts the true bound ⌊N/2⌋ ln 2 (ln of ρ_A's dimension) and prints
   the peak beside Page's mean. The app prints both numbers by name ("the most 4 ln 2" and "Page's mean"), and the card's note says Page's number is a mean,
   not a bound. For odd N, Page's mean is ln m − m/(2n) with m = 2^{⌊N/2⌋} and n = 2^{⌈N/2⌉}, which is ⌊N/2⌋ ln 2 − ¼ rather than "(N/2) ln 2 − ½". The app uses the general form.
2. **The walk's coefficient is a stated asymptote, not a fit.** σ²/t² → 1 − 1/√2 for the Hadamard walk (Konno's limit density 1/(π(1 − x²)√(1 − 2x²)) on
   |x| < 1/√2). It is checked at t = 50, where the finite-t excess is 0.08 %.
3. **The quasi-energy dispersion is sin ω = sin k/√2, not cos.** With U(k) = S(k)·H, det U = −1 and tr U = i√2 sin k, so sin ω = sin k/√2. The fastest front is
   therefore t/√2, which matches Konno's support. The CLOSED FORM line says so.
4. **"Periodic in both directions" needs Φ·L to be whole.** The Landau gauge's x-wrap is consistent only then. The app makes a torus exactly when (p·L) mod q = 0
   and L > 2, uses open edges otherwise, and says which.
5. At even q′ the Harper bands' middle pair touches, so the count of open gaps is q′ − 2, not q′ − 1. The readout prints that many.

## Dropped, and why
- The butterfly over Φ is deferred by the plan (a record). The Harper q × q E(k) is not printed as levels: at general p/q it needs a per-k eigensolve, and the
  measured gaps are what the brief asked for. Φ = 1/2's closed form lives in the test as the oracle, not in the app.
- PACKET, GROUND and EIGEN have no meaning for the walk and only partial meaning for the spin chain, so the seg is hidden for both rather than adding per-preset options.
  The spin chain's EIGEN is still reachable by a click on its eigen strip. Its stationary eigenstates are a fine demonstration that S and ⟨σ_z⟩ freeze.
- The walk always starts at the centre with the symmetric coin. A chooser for the coin or start site was not built.
- No `lw:` link, verb or facade change. The `lattice` verb's enum reads PRESETS, so `lattice preset=hofstadter|walk|spin` works as it stands
  (`lab/verbs.js` untouched).

## Gates run (all at the tip)
- `node tests/lattice-presets.test.mjs`: PASS, 4 laws. `node tests/lattice.test.mjs`: 8 laws green (the eleven presets' numbers unmoved). `node tests/tunnel.test.mjs`: PASS, 4 laws.
- `node tests/pwa.test.mjs --write`, then `./test.sh node`: rc 0, no suite failing (twice: after the build and after the text fix).
- `node tools/rack-deps.mjs --classes`: rc 0. `node tools/new-project.mjs --check`: in step (16117 B). `node tests/project-formats.test.mjs`: GREEN, 8 judged lines (the TUNNEL demo opens).
- `node tools/catalogue-table.mjs --check` and `node tests/catalogue.test.mjs`: PASS, 185 rows.
- `node tools/serialize-bytes.mjs` on the T3 tree and on the base tree (`git archive c383e8e`), the same port: all 11 readings **IDENTICAL**.
- ONE browser check: the throwaway `.tmp/t3-shot.mjs` (above).

## Δ lines
`lab/` (non-mir `.js`): 29,707 → **29,743, +36** (budget +50). `lattice-model.js` +27, `lattice.js` +9, `catalogue.js` 0, `sw.js` 0.

## For the integrator
- `lab/catalogue.js` is GENERATED. If T1 also adds catalogue rows (BLOCH), the one-line shelves and the `O` list will conflict textually. Resolve by re-running
  `node tools/catalogue-table.mjs` on the merged tree, not by hand.
- `lab/sw.js` carries the pwa `--write` stamp. Re-run `node tests/pwa.test.mjs --write` after the merge.
- T3 touched no T1 file (`bloch.js`, `orbit.js`, `windows/readouts.js`, `rack.js`, `persist.js`, `settings.js`, `verbs.js`), and never `field.js` or `spectrum.js`.
  THE LOCK is not touched: LATTICE closed writes nothing.

Branch `t3-presets`, tip: see `git log -1 t3-presets` (the commit carrying this note).
