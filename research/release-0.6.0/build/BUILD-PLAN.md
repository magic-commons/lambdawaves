# 0.6.0 "Beat Equalizer" — THE BUILD PLAN (Claude Yan / Fable 5.1, 2026-10-15 09:50 CDT)

Josh, 2026-10-15 09:35 (verbatim): "Let's continue where we left off with Lambdawaves. Keep the builds tight and don't bloat the code with random
verification/gate codes. Just build the features since we are not even 1.0.0 release yet. Good luck!"

That word changes the method, so this file replaces the nacre chain `BUILD-DRAFT-0.md` §I planned (DRAFT 0 → Sonnet → … → DRAFT 3 → his word). The
draft stands as the record; the Sonnet review's nine findings (`~/.config/claude-backup/jobs/8497d75b/tmp/build-review/BUILD-REVIEW-SONNET-0.md`,
PARTIAL) are folded below; the six §C decisions take their stars (he said nothing). Base: `yan-c` = `sos-s0` tip `f08805e` (code `61141f3`,
v0.5.4-alpha + docs), 28,101 `lab/` lines, cap 28,382.

## What is dropped from the draft, and why (his dial)
- **D.0's SITUATION-FIXTURE LOCK and PERF BASE** (tools/ gate machinery): dropped. The paused builder's branch `worktree-agent-aebff97bda10ddf92`
  (`45dcca7`) is left as it is. The existing LOCK (860 + 1004) is the only lock; it is run once at the cut, not per row.
- **E0 THE FIELD OWNER** (a refactor whose value was its 19-state owner table and a verifier): deferred to the cut that first needs it (0.6.1 Factor
  Road). E4's stand-down reads the equalizer's own state through today's `overlayDomain` instead.
- **E9's `tests/catalogue.json` + test** (gate machinery): dropped. The CHORD demo (data) stays.
- **E-V** as a fresh verifier with the whole estate: replaced by one light check at the cut (node gate, the two locks once, the owning browser suites once).
- New tests: ONE node file (`tests/equalizer.test.mjs`, the mathematics of the table). No new tools, probes, fixtures or browser suites.

## The rows (three builders now, one after the core lands; every builder Opus, own worktree from `f08805e`)
| row | what lands | files | Δ (budget) |
|---|---|---|---|
| **B1 EQUALIZER CORE** | `lab/equalizer.js` (pure: presets, the gains' map Γ = B∘(ssᵀ + diag(1−s²)), the PSD test + projection, PURITY, λ_min, the labels gate, serialize); the DERIVED lazy kernel in `field.js` (six complex shell accumulators + one real incoherent accumulator; ρ′ = Σ Γ_{nn′}⟨acc_n, acc_{n′}⟩ + κ·inc; three stores: complex (a pulse), density (√ρ′, 0), signed (sign·√|ρ′|, 0) with the relative floor); `field.setEqualizer(table \| null)`; FLAT = table ABSENT = today's kernel byte for byte | equalizer.js (new) · field.js · tests/equalizer.test.mjs (new) | +130 (stop at +170) |
| **B3a PERIOD · FLASH · ROUTES** | the period guard (v/g ≥ 2⁵³ refuses, one line); REPEATS says "exactly · T = 14400π/g a.u." for the field-free hydrogen register and "no exact period under these per-label rates" instead of a false one; `lab/flash-law.js` (pure, ≤ 12 lines): the worst populated beat's on-screen Hz and its alias, a label on the RATE knob above 3 Hz; six modulation routes `shell.rate.1…6` writing a shell's per-label rates | period.js · shell/transport.js · flash-law.js (new) · shell/modulation.js (· lab/spectrum.js if the lane's rate road is reused) | +30 |
| **B3b TILE · ORACLES · DEMO** | METERS gains FLOOR (the field law's constants from `lab/status.js`, never typed); the 6-31+G\* oracles (0.5.4 §J-4 N4, owed): `oracles[id]['6-31+g*']` from the fixture, `chemview.js` passes it, water in 6-31+G\* reads NUMERICAL; the CHORD demo `lab/demos/chord.lambdawaves.json` + cover (three shells at a RATE under the flash law, silent) | meters.js · tools/orbital-library.mjs · chemview.js · main.js (STARTERS) · demos/ | +8 |
| **B2 BEAT MODE** (after B1) | SPECTRUM's state grid gains a BEAT mode: the 6 × 6 shell grid coloured by the chord's log thirds (magenta · orange · yellow, cuts 0.0263 and 0.1130 Eh — creative, named so), six faders (the kit's `fader`), a PRESET select, PURITY, the labels gate's sentence, the dephasing caption "the beats fade, the shells stay"; PROJECT key `eq` (default-absent; one undo row per change); PHASE / Re / Im stand down under a mixture ("the equalized picture is a mixture; it has no phase") except under a pulse; VORTEX and PARTICLES DISABLED under a positive-definite table with λ_min above the floor ("the equalized picture has no nodes (λ_min = …)") | lab/spectrum.js · windows/spectrum.js · shell/persist.js · rack.js (the overlay gate) · badges.js | +55 |

## The mathematics the rows stand on (Round 1 T2/T3, the Sonnet's corrections)
Γ ⪰ 0 with unit diagonal ⇔ D∘Γ is a density for every D (Schur). acc_n(r,t) = Σ_{a∈n} c_a e^{−iE_a t} ψ_a(r); inc(r) = Σ_a |c_a|²|ψ_a|².
PLAIN SUM: Γ = 11ᵀ, κ = 0 (= today). WITHIN-SHELL: Γ = I, κ = −1. BEATS ONLY: Γ = 11ᵀ − I, κ = 0. INTERFERENCE ONLY: Γ = 11ᵀ, κ = −1 (the Sonnet's
finding 1: BEATS ≠ INTERFERENCE ONLY; the seventh accumulator pays for the split). Jitters: Γ_{nn′} = ĝ(E_n − E_{n′}), ĝ the characteristic function
(Gaussian e^{−σ²ω²/2}, Cauchy e^{−γ|ω|}, box sinc(ωw/2)), the default width making |g(1↔2)| = ½. COMB: Γ = ½(1 + e^{iω·517.016}) (complex Hermitian:
|g(1↔6)| = 1.000, |g(5↔6)| = 0.009). PHASE PULSE: Γ = uu†, u_n = e^{iα_n} (rank one: a pure state, the complex store). The gains: S = ssᵀ + diag(1 − s²)
(PSD, unit diagonal, S = 11ᵀ at s = 1), Γ = B∘S. PSD test: eigenvalues of the 6 × 6 Hermitian matrix, tolerance λ_min ≥ −10⁻¹²·max|λ|, projection to
the cone when it fails, said as "repaired". PURITY = Σ|Γ_{nn′}|² w_n w_{n′} (w the shell populations). Labels gate: every populated label of a shell
shares one rate (`rates` of `rack.js:62`), else the equalizer stands down with its sentence. T = 14400π a.u. = 1.0942775 ps for the field-free register.

## Gates (existing only) · order · the cut
Node gate 0 after every row (`bash test.sh node`); `node tests/pwa.test.mjs --write` after any `lab/` edit; the owning browser suite once per row; at the
cut: THE LOCK ×2 (`--check --query gastab=0` 860; `--fixture research/release-0.4.0/measure/digest-lock-s4a.json` 1004) 0/0 — FLAT is the locked kernel
by construction; `new-project --check`; the line law ≤ 28,382. Order: B1 ∥ B3a ∥ B3b → merge → B2 → merge → the light check → the local cut
`v0.6.0-alpha` (version line, README status, CHANGELOG, snapshot). NO push, NO deploy, NO gh release.
