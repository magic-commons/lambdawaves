# 0.8.2-alpha "Phase Space" — what changed (Claude Yan / Fable 5.1, 2026-10-16)

The engine plan's D.14. Plan `BUILD-PLAN.md` (Yan, drafted 10-16 02:30 while 0.7.4 built; base and cap filled at the 0.8.1 cut — see "The light check"). Three Opus
builders in parallel from the base: P1 `p1-wigner`, P2 `p2-coherence`, P3 `p3-bead`. Build notes: `P1-BUILD.md`, `P2-BUILD.md`, `P3-BUILD.md`.

## The shape
THE WIGNER SLICE LEARNS THE OSCILLATOR: the same slice integral on the oscillator's register, with the Fock closed forms W_n = (−1)ⁿ/π · e^{−(z² + p²)} L_n(2(z² + p²))
as the oracle — |0⟩'s negativity 0, |1⟩'s −1/π at the origin, a slapped |0⟩ (a coherent state) 0 again: the classical and the non-classical said with numbers. THE
COHERENCE MAP: the register as a density matrix, |c_a c_b*| over the populated labels as a METERS tile — the picture of what the equalizer's dephasing shrinks. THE
BEAD: the expectation point (⟨x⟩, ⟨y⟩, ⟨z⟩) with its trail on the skeleton's canvas (Ehrenfest made visible), off by default, PREFERENCE; and ψ ALONG A RAY: Re ψ,
Im ψ, |ψ|² along the ray through the bead as a CALCULUS tile.

## P1 · THE OSCILLATOR'S WIGNER
(filled at P1's merge)

## P2 · THE COHERENCE MAP (`lab/meters.js` the tile, `createMeters` takes an optional `src`; `lab/equalizer.js` the pure `coherence()` and `eq.last`; `lab/windows/readouts.js` l.6 the BASIS import and l.112–116 METERS' source closure; `lab/windows/spectrum.js:132` `eqT = eq.last = t` (0 lines, no crossing); branch `p2-coherence` tip `1121e76`; +29 of ≤ +35)
- **The tile** COHERENCE in METERS: an N × N heat image of |ρ_ab| = |c_a c̄_b|/Σ|c|² over the populated labels in the palette's ramp (at most 12 — the largest by |c|,
  and it says so); the diagonal is the populations, the off-diagonals the coherences the beats live on. **The damping:** each off-diagonal is multiplied by the beat
  equalizer's own |Γ_{n_a n_b}|, the factor printed in the value line ("2 × 2 · ×0.500") and 0.6.0's words in the sub ("coherences damped: this is what decoherence
  looks like"); the signed splits WITHIN-SHELL · BEATS ONLY · INTERFERENCE ONLY read "cross terms of a signed split, not a density" instead. A hover names the pair,
  its |c_a c̄_b|, ω_ab and the period (`densityPeriod`/`fmtPeriod`). **Sources:** hydrogen, the oscillator and the other register Hamiltonians read the register's
  c(0); a molecule reads its STATES lanes (the b_K) while MOLECULES owns the field and STATES is on; otherwise the tile stands down with one sentence. Repaints at
  METERS' cadence only when what it reads changes (|c|², the table, the palette stops) — never on a frame; no new key, nothing written to the field.
- **Corrections to the brief:** the ×0.37 was not the model's number — the jitters are calibrated so |Γ(1↔2)| = ½, so 1s + 2p₀ reads ×0.500 and CHORD ×0.958–0.997
  (its gaps are far below 3/8: it barely dephases, and the picture is honest about it); there is no PURE/PLAIN mode (FLAT is the plain sum); the sentence is split
  across the value and sub lines because the wide readout's sub is one line; the map reads the anchor c(0) and does not follow |c(t)| under a Stark field or a
  propagator; METERS has no FRAME PROFILE canvas — the tile reuses the equalizer grid's `.eq-grid` class, no CSS added.
- **Checked:** `tests/coherence.test.mjs` (1s + 2p₀: one off-diagonal pair of 0.5, populations sum to 1, both to 1e-12; FLAT leaves the map unchanged; under GAUSSIAN,
  CAUCHY, BOX and COMB the off-diagonal shrinks by exactly |Γ₁₂| from `eq.table()`; with 13 labels the smallest is not drawn); equalizer 11/11; rack-deps holds
  (readouts.js 7 → 9, SPECTRUM 25, `app` 30); new-project in step; serialize-bytes 11 identical (the empty project's edit sha unchanged since 0.5.2); screenshot
  `research/release-0.8.2/p2-coherence-tiles.png` (CHORD + GAUSSIAN JITTER; 1s + 2p₀ + GAUSSIAN JITTER). Under LEAN (the first-run default) METERS hides its readouts,
  this tile with them.

## P3 · THE BEAD + ψ ALONG A RAY
(filled at P3's merge)

## The light check (existing gates only) and the cut
(filled at the cut)

## Known, deferred (recorded)
The LOG-SPACE module (circular Rydberg to n = 30 — §F-2, Josh's word; it re-bakes THE LOCK once and is a cut of its own); the SEPARABLE module (cube, 2-D and
anisotropic oscillators); FLOW arrows and streamlines; further RU records; helium's space; the uncertainty ellipsoid (0.8.3); the ray for a molecule (the AO
evaluator off the frame thread first).
