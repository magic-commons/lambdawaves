# 0.8.2 P2 THE COHERENCE MAP — build note (Opus 5.5, 2026-10-16)

Branch `p2-coherence` from base `af2e84b`. Code commit `ff2e222`; this note is the tip commit after it.

## What landed
One METERS tile, COHERENCE: the register as a density matrix. It draws |ρ_ab| = |c_a c̄_b| / Σ|c|² as an N × N heat image over the populated labels, with N ≤ 12. Past twelve labels it draws the twelve largest by |c|, kept in register order, and says so. The diagonal is the populations; the off-diagonals are the coherences the beats live on. Colour is the palette's ramp (alpha follows the magnitude, scaled to the largest population); with the palette off it falls back to one flat blue. Under the BEAT EQUALIZER each off-diagonal is multiplied by the table's own |Γ_{n_a n_b}|. The value line prints the factor (`2 × 2 · ×0.500`) and the sub line says 0.6.0's sentence: "coherences damped: this is what decoherence looks like". A hover names the pair, its |c_a c̄_b|, ω_ab = |E_a − E_b| and the period (`period.js` `densityPeriod` + `fmtPeriod`; in units of ħ/unit off hartree). On the diagonal the hover gives the population.

## Seats (file:line at the tip)
- `lab/equalizer.js:41–47`: `coherence(c, T)`, pure. It returns `{ L, F, M, cut }`: the drawn labels, the damping factor per cell, |ρ_ab|·F, and how many labels were cut.
- `lab/equalizer.js:49`: `last: null` on the equalizer object, so its shape is fixed from birth.
- `lab/windows/spectrum.js:132`: `eqT = eq.last = t;`. This is an in-place edit (0 lines, no crossing; SPECTRUM still reads 25). It hands the tile the table already in force, which is null whenever syncEq's `why` stands the equalizer down. The tile therefore never re-derives SPECTRUM's stand-down logic.
- `lab/meters.js:4` (imports), `:6` (`createMeters(host, src = null)`), `:22–38` (the tile, its hover, `paintCoherence()`), `:42` (`paintCoherence()` at the head of `update`).
- `lab/windows/readouts.js:6` (adds `BASIS` to the import line) and `:112–116` (METERS' `createMeters` call gains the source closure). **These are the only lines touched in readouts.js**, all inside METERS' block; CALCULUS is untouched.
- `tests/coherence.test.mjs` (23 lines).

## When it repaints
It runs at METERS' own cadence: `meters.update` in the loop (`rack.js:562`, 10 Hz while playing, only while METERS can present). The repaint is keyed on what the picture reads: each label with its |c|² to 12 digits, the table's Γ and mode, and the palette stops while the palette is on. A phase turn, the clock or a frame never repaints it. There is no new key or PREFERENCE: the tile follows METERS' open state. It is a readout only, with no field write, so THE LOCK is untouched (`field.js` not opened).

## Sources
- **Hydrogen, the oscillator, and every register Hamiltonian:** the register's anchor c(0) (`reg.re0/im0` over `populated()`), labels from `labelOf`, and energies from `reg.Ediag`. The equalizer's damping applies only where its table exists (hydrogen in position space, no STURMIAN or MOLECULES).
- **MOLECULES owns the field:** the STATES lanes `app.state.states.state().lanes`, with b_K = amp·e^{iφ} over S₀ and the ladder, energies `omega` in Eh. When STATES is not on, the tile stands down with: "MOLECULES owns the field: the map reads its STATES register — switch STATES on in MO-REGISTRY".

## The law and its check (`node tests/coherence.test.mjs`, ALL GREEN)
- 1s + 2p₀ at equal weights: ρ₁₂ = 0.5 to 1e-12, Hermitian, and the populations sum to 1 to 1e-12.
- FLAT (the plain sum) is no table (`eq.table` returns null) and leaves the map unchanged.
- GAUSSIAN, CAUCHY and BOX: the shown off-diagonal is 0.5·|Γ₁₂| to 1e-12, where |Γ₁₂| is read from `eq.table(...).gamma` (here 0.500000, as the jitters are calibrated to make it). COMB: |Γ₁₂| = 0.900937. In every case the diagonal is unchanged.
- 13 labels: twelve are drawn, the one with the smallest |c| is not, and `cut` = 1.
- `node tests/equalizer.test.mjs`: 0 failing of 11.

## The equalizer factors the tile reads and prints
The factor is |Γ_{n n′}|, the table's own expectation of e^{−iω_{nn′}δt} under the preset's spread of clocks (times the gains' s_n s_n′). Within a shell it is Γ_nn (1, except BEATS ONLY where it is 0).
- **1s + 2p₀ (ω₁₂ = 3/8):** ×0.500 under every jitter, by the model's calibration.
- **CHORD (2s, 3p₀, 4d₀) under GAUSSIAN JITTER:** ×0.958–0.997. CHORD's gaps (3/32, 5/72, 7/288 Eh) are far below 3/8, so the Gaussian barely touches them. This is the model's real number for that state.
- **Signed presets** (BEATS ONLY, WITHIN-SHELL, INTERFERENCE ONLY; table mode 2): the sub reads "cross terms of a signed split, not a density". The decoherence sentence is kept for the physical tables.
- **PHASE PULSE:** |Γ| = 1, so nothing is damped (a pure state).

## Screenshot (the one browser check)
`research/release-0.8.2/p2-coherence-tiles.png`. Left: CHORD with GAUSSIAN JITTER (palette off, as CHORD ships). It shows 3 × 3 · ×0.958–0.997, and the near-uniform picture is the truth of equal weights barely damped. Right: 1s + 2p₀ with GAUSSIAN JITTER and the palette on. It shows 2 × 2 · ×0.500: the off-diagonals at half the diagonal's strength. The run was Firefox headless through `tools/gate/gatekit.mjs` on my server at 9491 (stopped by pid). The throwaway script is `.tmp/p2-shot.mjs` (gitignored, not committed).

## Corrections to the brief
1. **"×0.37" is not the model's number.** The jitters are calibrated so |Γ(1↔2)| = ½ at Z = 1. The tile prints the factors it reads: ×0.500 for 1s + 2p₀, ×0.958–0.997 for CHORD.
2. **The sentence is split** to fit the wide readout's single sub line. The factor goes in the value line and 0.6.0's words in the sub. The signed presets get their own words, because they are decompositions, not dephasing.
3. **The equalizer modes are presets in the code.** There is no PURE/PLAIN mode: FLAT is the plain sum (no table), and WITHIN-SHELL, BEATS ONLY and INTERFERENCE ONLY are presets alongside the jitters, COMB and PHASE PULSE.
4. **The map reads the anchor c(0).** Under a Stark field or a PROPAGATOR the |c(t)| drift and the map does not follow them in a frame. The never-in-a-frame law chose this.
5. **There is no FRAME PROFILE canvas.** In the code FRAME PROFILE is a readout, not a canvas. The tile reuses the BEAT EQUALIZER grid's `.eq-grid` canvas class (96 px, pixelated), so no CSS was added.

## Dropped, and why
- A separate line for the equalizer's `gate` ("one rate per shell") is dropped: the map then shows undamped, which is what the picture does.
- Following a driven STATES run's |b_K(t)| is dropped: the lanes' stored amplitudes are what the tile reads.
- In LEAN (the first-run Aa), METERS hides its readouts, and this tile with them, as for every METERS tile.

## Gates
- `./test.sh node`: exit 0, 0 RED (run after the last `lab/` edit).
- `node tests/pwa.test.mjs --write`: run after the last edit (`lab/sw.js` restamped).
- `node tools/rack-deps.mjs --classes`: HOLDS. readouts 9 (was 7), spectrum 25 (unchanged), and the `app` literal gains no key.
- `node tools/new-project.mjs --check`: in step.
- `node tools/serialize-bytes.mjs` (LW_PORT 9491): 11 readings, no errors; the empty project's edit sha `4f2ab384f1a9f13e` is the one recorded since 0.5.2. There is no new PROJECT key (`eq.serialize` is unchanged).
- `node tests/equalizer.test.mjs`: 11/11. `node tests/coherence.test.mjs`: all green.

## Δ lines
`lab/` 29,863 → 29,892 = **+29** (budget +35). The test file is 23 lines (≤ 25).
