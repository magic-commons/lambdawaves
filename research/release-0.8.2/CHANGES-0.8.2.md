# 0.8.2-alpha "Phase Space" — what changed (Claude Yan / Fable 5.1, 2026-10-16)

The engine plan's D.14. Plan `BUILD-PLAN.md` (Yan, drafted 10-16 02:30 while 0.7.4 built; base and cap filled at the 0.8.1 cut — see "The light check"). Three Opus
builders in parallel from the base: P1 `p1-wigner`, P2 `p2-coherence`, P3 `p3-bead`. Build notes: `P1-BUILD.md`, `P2-BUILD.md`, `P3-BUILD.md`.

## The shape
THE WIGNER SLICE LEARNS THE OSCILLATOR: the same slice integral on the oscillator's register, with the Fock closed forms W_n = (−1)ⁿ/π · e^{−(z² + p²)} L_n(2(z² + p²))
as the oracle — |0⟩'s negativity 0, |1⟩'s −1/π at the origin, a slapped |0⟩ (a coherent state) 0 again: the classical and the non-classical said with numbers. THE
COHERENCE MAP: the register as a density matrix, |c_a c_b*| over the populated labels as a METERS tile — the picture of what the equalizer's dephasing shrinks. THE
BEAD: the expectation point (⟨x⟩, ⟨y⟩, ⟨z⟩) with its trail on the skeleton's canvas (Ehrenfest made visible), off by default, PREFERENCE; and ψ ALONG A RAY: Re ψ,
Im ψ, |ψ|² along the ray through the bead as a CALCULUS tile.

## P1 · THE OSCILLATOR'S WIGNER (`lab/wigner.js` the qho branch in `recOf`, `amp`, `prepare`, `chordAxial`; `lab/qho.js` `wignerFock`; `lab/wignerview.js` the NEGATIVITY readout, the stand-downs, the cap; `lab/rack.js` `hydroReader` three lines changed; `lab/windows/film.js` l.7 the caption tail; branch `p1-wigner-qho` tip `6e291b6`; +30 of ≤ +40)
- **The slice learns the oscillator:** the same W(z, p_z) grid, the same Y_lm and s_z panels with λ = 2, the oscillator's radials in place of hydrogen's; the inner
  integral runs in u = s_ρ², where the two Gaussians make the integrand e^{−u} × a polynomial of degree ≤ 10, so Gauss–Laguerre with nd = 12 is EXACT (a correction:
  not hydrogen's d_N rule). `wignerFock(n, z, p)` = (−1)ⁿ/π · e^{−u} L_n(2u) is the oracle.
- **NEGATIVITY** — new on every register, hydrogen included (the brief assumed it existed): ∫|W| − 1 over the drawn slice NORMALISED to ∫W = 1 (the brief's unnormalised
  slice integrates to 1/π², not 1; for |0 0 n⟩ the normalised number equals the 1-D ∫|W_n| − 1), with the oracle lines "a Gaussian: classical" and "Fock |1⟩ along z:
  W(0,0) = −1/π³ · 4/√e − 2 = 0.4261". Measured: |0⟩ (= 1s) matches W₀/π² to 4.4e-12, W(0,0) = +1/π³; |1⟩ along z (the register label 2p₀ — there is no n = 1, l = 1
  label) matches W₁/π² to 8.3e-12, W(0,0) = −0.03225153 = −1/π³ (the 3-D slice's value; the brief's −1/π is the 1-D one — the Wigner function factorises over
  Cartesian axes and the transverse factor is W₀(0,0)² = 1/π²); on the 64 × 64 grid NEGATIVITY reads 0.00000 for |0⟩ and 0.42600 for |1⟩ (whole slice 0.42612); a
  slap at k = 1 on |0⟩ (21 labels, ‖c‖² = 0.999998829) reads 0.000 — minimum −3.92e-9, negativity 3.46e-8: a truncated coherent state (the register holds N ≤ 5
  whole), so the gates are the measured truncation (min > −1e-8, negativity < 1e-7), not the brief's 1e-12 / 1e-9. Hydrogen 1s's own NEGATIVITY reads 0.019.
- **The window under qho:** the cap is 21 labels (every m = 0; the old 6-label cap read the slap's negativity as 0.0094); P RANGE follows Z RANGE when untouched; the
  labels come from `H.labelOf`; stand-down sentences for BOX · QUARKONIUM · ATOM · CENTRAL (the stand-down lives in `rack.js` `hydroReader` — `wignerview.js:22` is a
  comment; WIGNER now accepts `qho`, RADIATION unchanged); a stood-down WIGNER resets the NEGATIVITY line; the export caption gains " · WIGNER · ∫|W| − 1 = …" while the
  window is open (not exercised in the browser).
- **Checked:** `tests/wigner-qho.test.mjs`; wigner 16/16; qho 11/11; rack-deps holds (SPECTRUM 25, film 8); new-project in step; serialize-bytes 11 identical against
  `af2e84b`; hydrogen's Wigner digest `973d2905…` identical on base and branch (THE LOCK holds no Wigner digest — nothing to re-bake); screenshot
  `research/release-0.8.2/P1-wigner-qho-1.png` (|1⟩'s slice W(0,0) −0.0322515, max 1.4387e-2, NEGATIVITY 0.426; BOX stood down; hydrogen 1s as before). **Dropped:**
  `wignerAt` (off-axis) stays hydrogen-only — the window never calls it.

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

## P3 · THE BEAD + ψ ALONG A RAY (`lab/calculus.js` +11 — `expectR`, `beadOf`, `rayAt`, `stats.r`; `lab/skeleton.js` +8 — `draw(…, bead)`; `lab/calculusview.js` +7 — the RAY tile; `lab/windows/molecules.js` +2 the centroid; `lab/rack.js` +1 (:25/:27 imports, :506–507 the skeleton's tick, :541 CALCULUS's tick); `lab/shell/settings.js` +1; `docs/STATE-SCOPES.md` one PREFERENCE row; branch `p3-bead-ray` tip `8c9847d`; +30 of ≤ +60)
- **THE BEAD:** `expectR` gives (⟨x⟩, ⟨y⟩, ⟨z⟩) — x and y as ⟨z⟩ of the state turned by the slap's rotors (`AXIS_TO_Z`, `applyRotor`, `dipoleZ`); in momentum space the
  same road gives ⟨p⟩ through `momentumZ` (the bead is ⟨p⟩ there, a correction). `beadOf` adds the trail's period, 2π over the slowest beat (∞ for a single level) — the
  bead's own clock, not the transport's density period, which can force a synchronous scan from the frame loop. `skeleton.js`' `draw(…, bead)` draws the bead and its
  64-point trail after the skeleton on the shared `#skeleton` canvas (a fifth argument of `draw`, not a separate call: the skeleton's key decides both the clear and the
  paint; the trail resets on a register version jump or when the clock runs back); the bead draws with SKELETON off, stands down under a Sturmian. A BEAD switch sits
  beside SKELETON; PREFERENCE `bead`, off by default and absent while off. A molecule's bead is the electron centroid (ΣZ_A R_A − μ)/N_e with N_e = ΣZ − q (the solve's μ
  is nuclear minus electronic — not "dipole / electron count").
- **ψ ALONG A RAY:** CALCULUS's RAY tile — Re ψ in ink, Im ψ in the lighter tone, |ψ|² in the accent, each over the ray's max |ψ| with the scale printed, 128 samples
  from the origin through the bead (along z at the origin); it stands down with a sentence for a molecule, and in momentum space for any operator whose `phiAt` aliases
  `psiAt` (only hydrogen's φ(p) is a real momentum function). The tile lives in `calculusview.js`, not `readouts.js` — P3 and P2 share no file but `sw.js`.
- **The sign convention, said:** the tree's radials are positive near the origin and its Y_lm are Condon–Shortley, so ⟨2s|z|2p₀⟩ = −3. Measured: 1s → (0, 0, 0); the
  Stark state (2s + 2p₀)/√2 → (0, 0, −3) to 1e-12, turned to x̂ → (−3, 0, 0) with its density leaning to −x (the sign checked independently of convention);
  (1s + 2p₀)/√2's trail period 2π/(3/8); the 1s ray matches e^{−r}/√π at all 128 points (worst 5.6e-17), its norm 1 to 1e-3; the oscillator's |0⟩ ray matches
  π^{−3/4}e^{−r²/2} exactly.
- **Checked:** `tests/bead-ray.test.mjs` 7/7; calculus 8 · dynamics 19 · kick 16 green; rack-deps holds (`app` unchanged, SPECTRUM 25); new-project in step;
  serialize-bytes 11 identical against `af2e84b`; screenshots `.tmp/p3-stark-bead-ray.png` (the Stark state, BEAD on, CALCULUS floated: ⟨z⟩ = −3, the RAY tile drawn,
  no page errors), `.tmp/p3-1s2p-trail.png` (the trail along z). THE LOCK: no field write; with BEAD off the canvas gets one `clear()`; `#skeleton` is outside the
  capture's overlay list and the lock's readback. **Dropped:** the ray for a molecule, a molecular trail, a live TDHF bead, capturing `#skeleton`.
- **Found at the base, not fixed (recorded):** `tools/settings-probe.mjs` reads 4 of 6 scenes RED on the base and on the branch alike (byte-identical `--out`): the
  WORKSPACE `closed` order of lattice/bloch/central, and a `modwin.modes` row on WAVE DANCER — the integrator's item.

## The light check (existing gates only) and the cut
- Node gate 0 after each merge; `pwa --write`; `new-project --check` in step; `rack-deps --classes` holds (SPECTRUM 25, readouts 9, `app` 30 keys); coherence · wigner-qho ·
  bead-ray · wigner 16 · qho 11 · equalizer 11 · calculus 8 · dynamics 19 · kick 16 · render-exact green on the merged tree; serialize-bytes identical at each row; no
  window was added, so no keyboard-window run (each builder's one headless screenshot stands); THE LOCK ×2 at the merge tip with `--query gastab=0` on BOTH runs:
  860 values · 0 readback · 0 record-byte · 59 s, and the 1004-value fixture · 0 · 0 · 59 s (hydrogen's WIGNER byte for byte, the bead off, METERS a readout).
- **Lines:** 29,863 → 29,952 (+89 = P2 +29, P1 +30, P3 +30; cap 30,161). Merge order P2 `d21a94c`, P1 `cbee3bd`, P3 (this commit).
- **Standing, recorded (since 0.5.1's roadmap: "applySettings closed[] exact restoration"):** `tools/settings-probe.mjs` reads 4 of 6 scenes RED — WATER · BENZENE · N₂:
  the WORKSPACE `closed[]` order differs after a reload because those demo layouts predate LATTICE · BLOCH · CENTRAL and the unlisted closed cards are re-seated;
  WAVE DANCER: a `modwin.modes` row of a source the reloaded rack lacks. Byte-identical on the base and every 0.8.2 branch; cosmetic (the order of closed cards);
  the fix is one seating rule for an unlisted closed card, or the demo layouts regenerated — a 0.9.x row if Josh wants it before 1.0.0.

## Known, deferred (recorded)
The LOG-SPACE module (circular Rydberg to n = 30 — §F-2, Josh's word; it re-bakes THE LOCK once and is a cut of its own); the SEPARABLE module (cube, 2-D and
anisotropic oscillators); FLOW arrows and streamlines; further RU records; helium's space; the uncertainty ellipsoid (0.8.3); the ray for a molecule (the AO
evaluator off the frame thread first).
