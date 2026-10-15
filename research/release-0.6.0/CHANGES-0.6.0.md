# 0.6.0 Beat Equalizer — what changed (plain words; one line per merged row)

The first cut of THE ENGINE PLAN (`research/release-0.6.0/PLAN.md` D.1), built on Josh's word of 2026-10-15 ("Keep the builds tight and don't bloat the code
with random verification/gate codes. Just build the features") by the plan `build/BUILD-PLAN.md`. Nothing pushed, nothing deployed; the cut is local.

- **B1 THE EQUALIZER CORE (Opus 5.5, `220db5a`, merged `053bc3b`).** `lab/equalizer.js`: nine shell tables on the hydrogen register — FLAT, three jitters
  (Gaussian · Cauchy · box, each widened so the 1↔2 beat keeps half its weight), the COMB (two clocks 517.016 a.u. apart), a PHASE PULSE, and the three splits
  BEATS ONLY · WITHIN-SHELL · INTERFERENCE ONLY — with six gains Γ = B∘(ssᵀ + diag(1 − s²)), the PSD test and its repair, PURITY, λ_min and the labels gate (one
  rate per shell). In `lab/field.js` a DERIVED kernel, compiled lazily from the locked text (six complex shell accumulators and one incoherent one; the complex,
  density and signed stores; the signed view's relative floor 2·10⁻⁴); `setEqualizer(table)`. FLAT is the table absent — the locked kernel runs byte for byte
  (THE LOCK 860 · 0/0). One node test, 11 checks. The equalizer pass costs +8.7 % at 64³.
- **B3b FLOOR · ORACLES · CHORD (Opus 5.5, `1ab6439`, merged `72ffb47`).** METERS gains FLOOR — the picture's own f16 precision, every number read from the field
  law's constants in `lab/status.js`. The 6-31+G\* oracles land for 19 molecules (`oracles[id]['6-31+g-star']`): water in 6-31+G\* reads NUMERICAL, agreeing with
  PySCF to 2·10⁻¹³ Eh (0.5.4 §J-4 N4, owed). The CHORD demo: 2s + 3p₀ + 4d₀ at RATE 40, three beats under 0.6 Hz on screen, repeating every 45 s; silent.
- **B3a PERIOD · FLASH · ROUTES (Opus 5.5, `9729c6f`, merged `9b1b6b8`).** The period guard: a fit whose integers pass 2⁵³ is refused, never printed. REPEATS
  says "exactly · T = 14400π/g′ a.u." for the field-free hydrogen register and "no exact period under these per-label rates" where there is none.
  `lab/flash-law.js`: the worst populated beat's on-screen frequency and its alias; above 3 Hz the RATE knob carries the label (sim-ladder keeps its 60 and
  carries it). Six modulation routes `shell.rate.n1 … n6`, each writing one shell's per-label rates through the lanes' own road.
- **B2 THE BEAT MODE (Opus 5.5, `33a5081`, merged `737c308`).** BEAT EQUALIZER on the SPECTRUM card: the 6 × 6 shell grid coloured by the chord's log
  thirds (magenta · orange · yellow at 0.0263 and 0.1130 Eh — creative, named so), the PRESET stepper, PURITY, six faders, "the beats fade, the shells stay".
  The table follows preset, gains and the register through one sync; it persists as PROJECT `presentation.eq` only when not FLAT (every older file's bytes
  unchanged) and the undo ring carries it. A signed table switches VIEW to Re ψ by hand; a mixture says so in the badge; VORTEX, PARTICLES and KEPLER stand down
  under a positive-definite table whose λ_min clears 10⁻³ of λ_max, with the sentence.
- **Dropped from the draft on the dial:** the D.0 fixture lock and perf base (gate machinery), E0 THE FIELD OWNER (to 0.6.1), the catalogue test, the fresh
  verifier. Lines: 28,101 → 28,289 (+188; cap 28,382).
