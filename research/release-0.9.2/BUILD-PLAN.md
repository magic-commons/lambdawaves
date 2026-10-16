# 0.9.2 "Flow" — THE BUILD PLAN (Claude Sos / Fable 5.1, drafted 2026-10-16 ≈11:32 while 0.9.1 H2 builds; base filled at the 0.9.1 cut)

Josh, 2026-10-16 ≈11:30: "We are close to 1.0.0 and we'll spend most of our time in 0.9.X" · "don't over verify and bloat the code with tests. Just build to the best
of your abilities and a light visual/functional check" · "Let's keep going all the way to 0.9.4. Then we shall begin iterative work till 1.0.0." So three feature cuts
sit between 0.9.1 Platform and 1.0.0: **0.9.2 Flow · 0.9.3 Decohere · 0.9.4 Separable**, each from the deferred lists of 0.8.x (`../release-0.8.2/CHANGES-0.8.2.md`
"FLOW arrows and streamlines"; `../release-0.8.3/CHANGES-0.8.3.md` "the momentum-space breath P(p, t)"). Standing dial (10-15 09:35): tight, features only, pre-1.0.
Base: `yan-c` at the commit carrying the briefs after the v0.9.1-alpha cut (**TO FILL**; its sha is in every launch message); lines **30,028** (filled with the
base); cap **× 1.01**. Two rows, two Opus builders in parallel (disjoint files); the integrator merges, a light visual check, cuts `v0.9.2-alpha` "Flow".

## The shape (the law of this cut)
**THE CURRENT ON THE PLANE.** The PLANE window (`lab/sliceview.js`, id `slice`) already samples ψ on an N × N grid of a 2-plane (`sampleSlice` → `{ re, im }` over
[−half, half]²) and paints its phase. The probability current in that plane is the same sample read once more: j_∥ = Im(ψ̄ ∇_∥ψ) by CENTRED DIFFERENCES of the grid's
re/im along the plane's two axes (no second evaluation of ψ; the KS plane gets the same formula on its own coordinates, said as such in the readout — it is the
current of the sampled function, not of ℝ³). Two pictures of it, a seg on the PLANE card **CURRENT · OFF · ARROWS · LINES**: ARROWS is a quiver on a coarse lattice of
the plane (the sample's stride so ≈ 20 × 20 arrows; length ∝ √|j| capped at one cell, the kit's ink, far-side rule not needed — the plane is flat); LINES is
streamlines — seeds by rejection on |j| (24–32), RK2 in the plane on the bilinear-interpolated j grid, ≤ 240 steps each, thin polylines, re-seeded when the sample's
key moves. Both are painted over the phase image on the window's own canvas, at the window's cadence, nothing when OFF (byte-identical picture). The readout line
says what the eye sees: "|j|max 0.0213 a.u. · a real eigenstate carries no current" or, for the one state whose current is a closed form, 2p₊ (STATE's `2p+`,
j_φ = ρ/(r sin θ)) the measured against the exact at the maximum ("exact 0.0213 · Δ 3e-4, the grid's difference"). A molecule or a Sturmian: the seg stands down with
its sentence (PLANE is a register's window). No new window, no PROJECT key beyond the seg's own if the card already persists its segs (say which).
**THE MOMENTUM BREATH.** CALCULUS's BREATH tile (0.8.3 B1) draws P(r, t) from the Hamiltonian's `radial`. In momentum space the same tile follows the WAVE seg
(`app.state.space === 'p'`) and draws P(p, t) = p² Σ_lm |Σ_n c_nlm(t) F_nl(p)|² with F_nl the momentum radial: hydrogen's Podolsky–Pauling form (`lab/momentum.js`
`momentumRadial(n, l, p)`, exact, already in the tree), the oscillator's own radial (self-dual: F_nl = R_nl in a.u., the (−i)^N phase irrelevant to |·|²); the box,
ATOM and CENTRAL force position space (`central.js` l.49) so the tile says "momentum space: the breath is position's" and draws P(r, t). Two numbers printed as the
position tile prints its two: ∫P dp = Σ|c|² and ⟨p²⟩ = ∫p²P dp beside the exact 1/n² for a one-label hydrogen state (the virial: E_n = −1/(2n²)); the domain is
`domainForP`'s. The packet that goes out in r comes in in p — the REVIVAL tap's picture seen the other way, no new tap.

## The rows
| row | what lands | files | Δ lab |
|---|---|---|---|
| **F1 THE CURRENT ON THE PLANE** (Opus) | `lab/sliceview.js`: `currentOf(sample, half)` — j_∥ on the N × N grid by centred differences (one pass; the edge row one-sided or dropped, said); the CURRENT seg OFF · ARROWS · LINES on the PLANE card beside PLANE/GAIN; the quiver and the streamlines painted on the window's canvas after `paintSlice` at the window's cadence (its existing paint path — no new tick in rack.js; a seg change repaints without resampling, as GAIN does); the readout line "\|j\|max … a.u." with the 2p₊ exact beside it when the register is that one label; OFF paints nothing and the picture is byte-identical. The seg's state follows the card's own persistence (if the PLANE card writes its segs into the WORKSPACE or PROJECT already, CURRENT rides the same line; else it is session-only — say which in the note). Stands down for a molecule or a Sturmian with a sentence. | `lab/sliceview.js` (and `lab/windows/readouts.js` only if the card's rows are built there) | **≤ +60** |
| **F2 THE MOMENTUM BREATH** (Opus) | `lab/calculus.js` `radialBreath`: a `p` argument (or `app.state.space` read by the caller) that takes the momentum radial — hydrogen `momentumRadial`, the oscillator its own `radial`, others refused with the sentence — and returns `{ r, P, norm, m2 }` with `m2` = ∫p²P dp in momentum space (∫rP dr in position space as today); `lab/calculusview.js` BREATH tile: the label flips to "BREATH  P(p, t) = p² Σ_lm \|Σ_n c_nlm(t) F_nl(p)\|²" in momentum space, the axis in a.u. of momentum over [0, domainForP(n_min)], the readout "∫P = 1.000000000 · ⟨p²⟩ = 1.0000 (exact 1/n² = 1 for 1s)" (the exact only for a one-label hydrogen state), the running max its own key. | `lab/calculus.js`, `lab/calculusview.js` | **≤ +30** |

## Laws for the two builders
- Your own worktree, your own branch (`f1-current`, `f2-pbreath`) from the base commit; DISJOINT files (F1 `sliceview.js`; F2 `calculus.js` + `calculusview.js`);
  NO push; never edit `lab/mir/**` or `lab/fonts/**` or `lab/field.js`; after any `lab/` edit `node tests/pwa.test.mjs --write` then `./test.sh node`;
  `node tools/rack-deps.mjs --classes --no-write`, `node tools/new-project.mjs --check` green before you report. **NO NEW TEST FILES, NO GATE SCRIPTS** (Josh's
  dial, 10-16): the oracle numbers (2p₊'s exact current; 1s's ⟨p²⟩ = 1 and P(p) = 32p²/(π(1 + p²)⁴)) are checked ONCE in a throwaway under `.tmp/` and PRINTED in
  the build note; the readout carries the exact beside the measured, which is the permanent check.
- THE LOCK is sacred: CURRENT OFF and CALCULUS closed are no field write; nothing here touches `field.js`. The integrator runs it once at the merge (no `lab/field.js`
  line moved) with `--query gastab=0`.
- Line budgets are the table's; count `find lab -name '*.js' -not -path 'lab/mir/*' | xargs cat | wc -l`. One build note each: `research/release-0.9.2/F<n>-BUILD.md`
  (seats with file:line; the numbers with their exacts; a headless screenshot's path; what you dropped and why; Δ lines; branch and tip). ONE browser check each
  (a screenshot); never `pkill -f`; ports 9241, 9261, 9443, 8721/8741, 8731/8735 are taken; F1 9591/5691, F2 9601/5701.

## Gates (existing only) · the cut · deferred
Node gate 0 after the merges; `pwa --write`; the line law; THE LOCK once at the merge tip; a light visual check on 9261 (PLANE with ARROWS on 2p₊; the BREATH tile in
momentum space under REVIVAL); then the local cut `v0.9.2-alpha` "Flow" by the cut script's shape, CHANGELOG, snapshot. NO push, NO deploy, NO gh release. Deferred by
name: the current for a molecule on the PLANE (PLANE is a register's window; the molecular j lives in `molecular-flow.js`' tracers already), streamlines in ℝ³ (the
tracers are that), the momentum breath for ATOM/CENTRAL (no momentum road), FLOW arrows on the KS plane as a current of ℝ³ (it is the sampled function's).
