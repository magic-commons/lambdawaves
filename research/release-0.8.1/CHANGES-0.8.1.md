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

## T1 · BLOCH: SPIN-½ · RABI · LANDAU–ZENER (`lab/bloch-model.js` 31 lines new, `lab/bloch.js` 49 lines new; `lab/orbit.js` exports `project`, `sphereFrame`, `arm`; `lab/windows/readouts.js` the device beside LATTICE; `lab/rack.js` READERS + the governed tick; `lab/shell/persist.js` `instruments.bloch`; `lab/shell/settings.js` KIND; `lab/verbs.js` the `bloch` verb; `docs/STATE-SCOPES.md` one row; branch `t1-bloch` tip `18a0f91`; +84 of ≤ +85)
- **The first non-spatial system.** One qubit `[Re a, Im a, Re b, Im b]` under H(t) = (ω₀/2)σ_z + (Ω/2)(cos φ σ_x + sin φ σ_y), φ = (ω₀ + δ)t + βt²/2. **The step
  is the exact 2 × 2 exponential cos|n| − i sin|n| n̂·σ taken in the frame that turns with the drive** — for a circular drive that frame is exact (no rotating-wave
  approximation) and there H′ = −(δ + βt)/2 σ_z + (Ω/2)σ_x; the brief's lab-frame step is wrong at O(dt²) because H(t) does not commute with itself at different
  times and fails the Rabi 1e-10 gate (a correction). At β = 0 one step covers any t exactly; under a chirp, fourth-order Magnus steps of dt = 0.05 with the one extra
  term n_y = −βΩdt³/24. `halve` is the dt-halving re-solve; an independent closed form rotates the Bloch vector by Rodrigues' formula with no spinor.
- **The window BLOCH**, of the LADDER's kind beside LATTICE, closed by default, in + and WINDOW: presets FLOP (the π-pulse, τ = π/Ω) · LARMOR · RABI · LANDAU–ZENER
  (a tap on the lit preset, or opening the window, runs it from the start); knobs ω₀ Ω δ β θ₀ φ₀; the picture on ORBIT's painter — the vector, its trail, the faint
  effective-field axis (ORBIT unchanged on screen: the same 23 draw calls in a recording context); readouts P↓ measured · closed form, the LZ prediction beside
  the measured flip, the step distance with "step too coarse" above 1e-6. Units: ħ = 1, the default ω₀ = 1 sets the unit, t is the transport clock's (the brief's
  "t in 1/ω₀" cannot hold while ω₀ is a knob). **Persists:** `instruments.bloch` PROJECT, absent at the defaults; only the knobs save (a load runs the preset from
  its start). The `bloch` verb with its inventory line.
- **Landau–Zener, corrected:** the asymptote P = 1 − e^{−πΩ²/(2β)} assumes a sweep from −∞ to +∞; a finite sweep ±D leaves wiggles of order Ω/D that shrink only as
  1/D. At β = 0.05, Ω = 0.3 (asymptote 0.940835): D = 4.5 → 0.927082 · D = 10 → 0.931506 · D = 40 → 0.943436; the step distance ≈ 1e-9 and a dt/10 reference agrees,
  so the gap is the sweep's, not the step's. The gate is |P − P_LZ| < Ω/D at D = 10 and 40, step distance < 1e-6, the dt/10 error under twice the step distance;
  the window says the finite-sweep sentence.
- **Checked:** `tests/bloch.test.mjs` 7/7; node 0 (frontier 54, kepler 9 green); rack-deps holds (SPECTRUM 25 untouched, `app` 30, `w` 71); new-project in step;
  serialize-bytes 11/11 edit hashes identical, full +80 B (the one layout row); keyboard-window GREEN; one 2 × 2 step 0.17 µs, the LZ re-solve 1.7 ms; screenshot
  `.tmp/bloch-flop.png` (FLOP mid-pulse, P↓ 0.489483 measured = closed form, |Δr| 2.3e-16). **Dropped for budget:** a lab/rotating frame switch, a pulse-length
  knob, saving the qubit's state.
- **Seams T2 extends:** the MODE seg's seat `bloch.js:13` (prepend ONE · PAIR); the model's flat `P = { preset, w0, O, d, b, th, ph }` and `vec(P, s, t)`; `save()`
  writes only non-default keys; the painter's call `sphereFrame(g, T, B, x, y, R)` then `arm(…)` — two spheres are two `sphereFrame` calls at W/4 and 3W/4 in
  `paint` (`bloch.js:35`), and `arm` draws a reduced vector short.

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

## T2 · THE BELL PAIR + MASS SCALING (`lab/bloch-model.js` +12, `lab/bloch.js` +13, `lab/hamiltonian.js` +3 — one `scale()` under `setZ` and `setMu`, `lab/windows/spectrum.js` +5 the μ knob, `lab/rack.js` +1; in place: `radiation.js`, `radiationview.js`, `dynamics.js`, `calculus.js`, `informational.js`, `verbs.js`, `status.js`, `mathworker.js`, `windows/kepler.js`, `shell/facade.js`, `shell/persist.js`; branch `t2-bell-mass` tip `bc6cce0`; +34 of ≤ +45)
- **BELL, BLOCH's second mode:** a ONE · PAIR seg in the first row; presets Φ⁺ · Φ⁻ · Ψ⁺ · Ψ⁻ · PRODUCT (|↑↑⟩); θ₀ and φ₀ turn qubit A alone (U ⊗ 1, through T1's
  exponential split out as `su2`; T1's numbers unchanged). ENTANGLEMENT S_A prints "ln 2" or "0" (ρ_A and ρ_B in its sub): ln 2 for all four Bell states (|S − ln 2| = 0
  in double), held to 1e-12 under five local rotations; PRODUCT 0 with both vectors of length 1. CHSH on the drawn axes "2√2 PREDICTION · ≤ 2 classical" beside the
  best value over all axes 2√(2 − |r|²) (a brute-force search agrees to 1e-5); B's axes are signed to the preset, so every Bell preset reads 2√2 at θ₀ = 0 and a local
  rotation lowers the drawn-axes number while S_A holds (a correction: Φ⁺'s optimal axes read 0 for Φ⁻). Two spheres A and B with faint measurement axes and the
  reduced vectors at their real length |r| = √(1 − C²) (the plan's "1 − 2·mixedness" corrected) — a Bell pair shows no arrows, the note says why in one sentence.
- **MASS SCALING:** a μ/mₑ knob beside Z on SPECTRUM with presets 1 · POSITRONIUM (½) · MUONIC H (185.84082 from m_μ = 206.7683 mₑ, m_p = 1836.15 mₑ); `hamiltonian.js`
  has ONE `scale()` that `setZ` and the new `setMu` both call — lengths by k = Zμ, energies by Z²μ; at Z = 1, μ = 1 it hands back hydrogen's own functions (no scale
  applied: the 12 members are the very same objects before and after a round trip, the kernel's half and tables byte-identical — asserted in the test; THE LOCK
  is untouched). Refused under another operator with one sentence. **Persists:** `hamiltonian.mu` PROJECT beside Z, absent at 1; the STATUS line "HYDROGEN · μ = 0.5 mₑ
  (positronium) · EXACT · …"; the inventory gains `mu` off 1. The proved powers: E ∝ μ, lengths ∝ 1/μ, the 1s–2p period ∝ 1/μ (33.51 a.u. at positronium vs
  16.76), |d|² ∝ 1/μ², A ∝ μ (ω³ ∝ μ³ × |d|² ∝ μ⁻²) — A(2p₀ → 1s): ¹H 6.2649e8 · positronium 3.1342e8 · muonic H 1.1649e11 s⁻¹, the rate checks to 1e-12.
- **Corrections to the brief, each a fix:** the Sturmian is NOT one of `setZ`'s seams (scaling it needs a rebuild at λ/μ, outside λ's 0.25–3 for muonic H) — STURMIAN
  stands down at μ ≠ 1 as it does off hydrogen; `einsteinA` already multiplied by ¹H's reduced-mass 0.99946 (the μ¹ law at ¹H) and would have counted μ twice —
  it now applies that factor only at μ = 1; the radial-integral caches in `dynamics.js` and `calculus.js` keyed on `H.Z` and would have served stale values — they key
  on `H.k || H.Z || 1` (unchanged at μ = 1); INFORMATIONAL's repaint key includes μ (else a μ change never repaints the STATUS line); WIGNER, the theorem windows
  and the beat equalizer (its table is written at μ = mₑ) stand down at μ ≠ 1, RADIATION stays live so the A ∝ μ rates can be seen. Behaviour change: `setZ(1)` after
  an ion restores hydrogen's own functions rather than Z = 1 wrappers (values identical; a table object no longer carries an `expo` key).
- **Checked:** `tests/bell.test.mjs` 6/6, `tests/mass.test.mjs` 7/7, bloch 7/7; hydrogen 37 · radiation 18 · period 11 · status green; rack-deps holds (SPECTRUM at 25,
  `app` 30); new-project in step; serialize-bytes 22/22 identical against `15ae0b1` (full and edit); screenshots `.tmp/t2-bell-phip.png` (Φ⁺: "ln 2", "2√2"),
  `.tmp/t2-positronium.png`. **Dropped:** μ in `lw:`/statelink links (a link opens at the reader's μ), μ in the export caption, a PAIR argument for the `bloch` verb,
  time evolution of the pair.

## The light check (existing gates only) and the cut
- Node gate 0 after each merge; `pwa --write`; `new-project --check` in step; `rack-deps --classes` holds (SPECTRUM 25, `app` 30 keys); bloch 7/7 · bell 6/6 · mass 7/7 ·
  lattice-presets 4/4 · hydrogen · radiation · period · status · catalogue + `catalogue-table --check` (185 rows) green on the merged tree; serialize-bytes identical
  at each row (T1 +80 B full for the one layout row); `tests/keyboard-window.browser-test.mjs` once on the merged tree (the + list gained BLOCH) GREEN; THE LOCK ×2
  at the merge tip with `--query gastab=0` on BOTH runs: 860 values · 0 readback · 0 record-byte · 62 s, and the 1004-value fixture · 0 · 0 · 60 s (BLOCH closed, μ = 1,
  the lattice presets untouched: the picture byte for byte).
- **Lines:** 29,707 → 29,863 (+156 = T3 +36, T1 +84, T2 +34; cap 30,004). Merge order T3 `ed186fe`, T1 `15ae0b1`, T2 (this commit).

## Known, deferred (recorded)
The first RU record (the pass's profile first); Hofstadter's full butterfly as a record; spin chains past N = 8 and the XXZ/Heisenberg chain (Bethe ansatz the
oracle); a two-qubit gate set; decoherence on the Bloch sphere (T₁/T₂ — the Lindblad road).
