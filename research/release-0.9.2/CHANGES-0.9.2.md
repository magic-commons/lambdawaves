# 0.9.2-alpha "Flow" — what changed (Claude Sos / Fable 5.1, 2026-10-16)

Josh's 10-16 road: 0.9.2 Flow · 0.9.3 Decohere · 0.9.4 Separable before the iterative round to 1.0.0, under the dial "don't over verify and bloat the code with
tests. Just build to the best of your abilities and a light visual/functional check". Plan `BUILD-PLAN.md` (base `9aa8fb7`, 30,028 lines, cap 30,328). Two Opus
builders in parallel: F1 `f1-current` (`lab/sliceview.js`), F2 `f2-pbreath` (`lab/calculus.js`, `lab/calculusview.js`). Build notes: `F1-BUILD.md`, `F2-BUILD.md`. No new
test file in either row: the oracle numbers were checked once in a throwaway and printed in the notes; the windows print the exact beside the measured.

## The shape
THE CURRENT ON THE PLANE: j_∥ = Im(ψ̄ ∇_∥ψ) by centred differences of the PLANE window's own N × N sample, drawn as a quiver (ARROWS) or as streamlines (LINES)
over the phase image, a CURRENT seg OFF · ARROWS · LINES on the card, the readout "|j|max" with 2p₊'s closed form ρ/(r sin θ) beside it; OFF is byte-identical.
THE MOMENTUM BREATH: CALCULUS's BREATH tile follows the WAVE seg into momentum space and draws P(p, t) = p² Σ|Σ c F_nl(p)|² from `momentum.js`' exact F_nl (the
oscillator its own radial; the box, ATOM and CENTRAL say "the breath is position's"), ∫P and ⟨p²⟩ printed against 1/n² for a one-label state.

## F1 · THE CURRENT ON THE PLANE
(filled at F1's merge)

## F2 · THE MOMENTUM BREATH
(filled at F2's merge)

## The light check and the cut
(filled at the cut)

## Known, deferred (recorded)
The current for a molecule on the PLANE (a register's window; the molecular j lives in `molecular-flow.js`' tracers); streamlines in ℝ³ (the tracers are that); the
momentum breath for ATOM and CENTRAL (no momentum road); the KS plane's arrows as a current of ℝ³ (they are the sampled function's).
