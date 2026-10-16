# 0.8.1-alpha "Two Levels" — what changed (Claude Yan / Fable 5.1, 2026-10-16)

The engine plan's D.13. Plan `BUILD-PLAN.md` (Yan, drafted 10-16 01:50 while 0.7.4 built; base `c383e8e`, 29,707 lines, cap 30,004). Three Opus builders: T1
`t1-bloch` ∥ T3 `t3-presets` from `c383e8e`, T2 `t2-bell-mass` from T1's merge. Build notes: `T1-BUILD.md`, `T2-BUILD.md`, `T3-BUILD.md`. Josh 05:55 (after the
usage pause): "hello lets continue. sos hasn't done any work so we'll continue from here".

## The shape
THE FIRST NON-SPATIAL SYSTEM: one qubit in its own window, BLOCH, of the LADDER's kind — the Bloch vector on ORBIT's sphere painter, H = (ω₀/2)σ_z + (Ω/2)(cos φ σ_x
+ sin φ σ_y) stepped by the exact 2 × 2 unitary, the step proved by a halved re-solve; LARMOR · RABI · LANDAU–ZENER · FLOP. THE BELL PAIR as BLOCH's second mode:
S_A = ln 2 exactly for a Bell state, 0 for a product; the CHSH value as the prediction. MASS SCALING: μ/mₑ on SPECTRUM (positronium ½, muonic H 185.84),
rescaling as Z does; μ = 1 byte-identical. Three lattice presets: HOFSTADTER at one flux, the Hadamard QUANTUM WALK, the XX SPIN CHAIN by exact diagonalisation
with Jordan–Wigner as the oracle.

## T1 · BLOCH: SPIN-½ · RABI · LANDAU–ZENER
(filled at T1's merge)

## T3 · THE LATTICE PRESETS: HOFSTADTER · QUANTUM WALK · SPIN CHAIN (`lab/lattice-model.js` three PRESETS rows with their build branches and closed lines, `lab/lattice.js` the knobs p · q · N and the notes; branch `t3-presets` tip `7190aab`; +36)
- **HOFSTADTER:** an L × L square (L ≤ 12; the pick sets L = 12) under flux Φ = p/q (two knobs), the Peierls phase e^{2πiΦx} on the y-bonds in the Landau gauge. The
  lattice is a torus exactly when (p·L) mod q = 0 and L > 2, otherwise it has open edges — the card says which (the brief's "periodic in both directions" needs Φ·L
  whole). The readout prints Harper's band count q/gcd(p, q) and the measured largest gaps; at even q the two middle bands touch, so q − 2 open gaps, not q − 1.
  Checked: Φ = 1/2 on the 12 × 12 torus against ±2J√(cos²k_x + cos²k_y) to 3.2e-14; Φ = 1/3's two gaps 1.267949 = 3 − √3.
- **QUANTUM WALK:** the Hadamard walk on a ring of N ≤ 128 sites as sites × coin (256 amplitudes) — a MAP, not a Hamiltonian, so it skips the eigensolve and the
  note says so; PLAY takes one step per 1/J; the bars are the probability summed over the coin, the hue the coin's balance. The readout prints measured σ² against
  Konno's asymptote (1 − 1/√2)t² (not a fit) and the classical t: σ²(50)/t² = 0.29313 vs 0.29289 (+0.08 % finite-t excess); ΣP − 1 = 7e-15. The dispersion is
  sin ω = sin k/√2 (the brief's cos was wrong): the front moves at t/√2.
- **SPIN CHAIN:** the XX chain of N ≤ 8 spins on its 2^N ≤ 256 states, built directly and solved exactly by `eigSymQL`; the quench from |↑↓↑↓…⟩, a click on a
  spin flips it; the bars are each spin's ⟨σ_z⟩ on an absolute scale coloured by sign; the readout prints S(t) of the first ⌊N/2⌋ spins beside the TRUE maximum
  ⌊N/2⌋ ln 2 and Page's MEAN — **the brief called Page's (N/2) ln 2 − ½ a bound and it is not**: it is a random state's mean entropy (for odd N, ⌊N/2⌋ ln 2 − ¼); the
  XX quench exceeds it at N = 6 (peak 2.058 vs mean 1.579, max 2.079) and N = 8 (2.516 vs 2.273, max 2.773), so the test asserts S(t) ≤ ⌊N/2⌋ ln 2 and S(0) = 0.
  Jordan–Wigner's 2J cos k levels agree to 1.2e-14 (N = 6); unitary to 1e-12.
- **Checked:** `tests/lattice-presets.test.mjs` 4/4; lattice 8/8 (the eleven older presets' numbers unmoved); tunnel 4/4; rack-deps holds; new-project in step;
  serialize-bytes 11/11 identical against the base (the record's defaults unchanged: `fp`, `fq`, `ns` absent until moved; LATTICE closed writes nothing); the
  `lattice` verb takes the three names from the preset table; three catalogue rows (185; `--check` green); screenshots `.tmp/t3-walk-t40*.png` (σ² 469.10 vs
  468.63), `.tmp/t3-spin-chain*.png` (S(t) 1.6669 at t = 30). **Dropped:** the butterfly over Φ (a record, deferred); a chooser for the walk's coin or start site.

## T2 · THE BELL PAIR + MASS SCALING
(filled at T2's merge)

## The light check (existing gates only) and the cut
(filled at the cut)

## Known, deferred (recorded)
The first RU record (the pass's profile first); Hofstadter's full butterfly as a record; spin chains past N = 8 and the XXZ/Heisenberg chain (Bethe ansatz the
oracle); a two-qubit gate set; decoherence on the Bloch sphere (T₁/T₂ — the Lindblad road).
