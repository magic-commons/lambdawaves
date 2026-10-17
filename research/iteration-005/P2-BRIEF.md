# Iteration 005 · P2 — THE FACTOR CURRENT AND THE CONTINUITY RECORD (brief)

Branch `it005-factor` from the BASE in the launch message (P1 THE DIRECT PACKET merged — read `P1-BUILD.md` first: `createFlow`'s `setPacket`).
Gate server `LW_PORT=9641 GD_PORT=5741`. No push. Never edit `lab/mir/**` or `lab/fonts/**`. Josh's dial: the feature, no new test files,
existing gates, one light check; one-time numbers in the note. Sources: Sol-6's PRACTICAL UPGRADE SYNTHESIS §2–3 (`~/Documents/OBSIDIAN/LAMB of
WAVES/for CODEX/…`): "ρ = Σ_a |φ_a|², j = Σ_a Im(φ̄_a ∇φ_a), electron count = the factor's physical overlap trace … a positive factor density is
different from a signed density difference … FLOW should compare density uncertainty with the local floor and stop or fade a trail outside its
assessed domain"; the papers' DECISION MEMO §3.7 and §4 ("the many-electron continuity record beyond the app's own benzene numbers"). Read in the
tree: `lab/molecular-flow.js` (after P1), `lab/chemview.js` ≈ 715–750 (the kicked run's `feedFlow`: `rt.D_re`, `rt.D_im` — the density matrix,
Im D negated on the way in; `flowDot` for BALANCED), `lab/density.js` (`hermitianEigen`, `idempotencyDefect`, `createRTHF` — the run keeps P(t),
not C(t)), `lab/slice.js` `currentOf` (0.9.2 F1: j on PLANE's sample by centred differences; the KS plane on its own coordinates),
`lab/calculusview.js` (the tile shape: BREATH, A(t), ELLIPSOID — `readout({ cls: 'wide calc-ray' })` + a canvas), `lab/windows/readouts.js`
(where CALCULUS is created and what it is handed), `docs/STATE-SCOPES.md`.

## The rows
1. **The factors of the run.** Once per landing of the kicked molecule's D(t) (not per frame), `hermitianEigen` of the Hermitian D — its
   eigenpairs (w_a, φ_a) with w_a the occupations (2 for a pure Slater state; fractional where the integrator's idempotency defect leaves them —
   kept as weights, never rounded; Σ w_a = N said beside Tr(DS)) — handed to `createFlow`'s new `setFactors(ws, res, ims)` (P1's `setPacket` is
   the one-factor case; share the evaluator loop, do not write a third): ρ = Σ_a w_a |φ_a|², j = Σ_a w_a Im(φ̄_a ∇φ_a). The dense `set(re, im)`
   stays for the REPAIR road and as the one-time oracle (ρ and j equal to 1e-10 relative at 200 points against the dense matrices of the same D).
   The transpose seam (Im D negated) is covered ONCE where the factors are made and said in a comment beside the old negation. The run's FLOW
   now rides the factors; the cost per tracer step drops from n² to n·nocc — measure both at benzene/STO-3G (n = 36, nocc = 21) and print.
2. **THE CONTINUITY RECORD, live.** A CALCULUS tile CONTINUITY for a molecule under RUN: on PLANE's own sample points (the KS plane, the window's
   N), ∂ρ/∂t by the difference of the two latest landings' ρ at those points over their Δt (the run's own clock), ∇·j by centred differences of
   the FULL 3-D j from the factor evaluator (j at p ± h ê for the three axes, h = the plane's own spacing; the in-plane-only divergence would
   miss ∂j_z/∂z — say so in the label), and the number ‖∂ρ/∂t + ∇·j‖₂ / ‖∂ρ/∂t‖₂ over the plane with a small picture of the residual's sign on
   the plane (the tile's canvas, as BREATH draws). The label says what it is: "the finite-basis defect — an identity only in a complete basis".
   Stands down (one sentence) for a still molecule, a hydrogen register, a volume molecule (no run), and UHF/LDA. One-time check in the note:
   benzene STO-3G under a z-kick against the app's own grid defect (`flow.said()`'s `info.defect` from the worker's `flow.balance`): the two
   numbers and why they differ (a plane sample vs the grid; centred differences vs the worker's face fluxes).
3. **The floor is assessed, not fixed.** `createFlow`'s `RHO_FLOOR` (1e-7) becomes `setFloor(x)`: chemview and orbitalsview hand it the larger of
   1e-7 and ten times the measured density error where one exists (P3's `__LW.field.errorField` result, if P3 is merged in your base — read
   `P3-BUILD.md`; else the FIELD_LAW constant `density.worst` × ρ_max), and a tracer's trail point fades (alpha) over the last decade above the
   floor rather than stopping dead. The GATED readout keeps counting refusals and names the floor in force.

## Checks, then the note
`node tests/pwa.test.mjs --write` · `./test.sh node` 0 (`tests/molecular-flow.test.mjs` green unchanged) · `node tools/rack-deps.mjs --classes
--no-write` 0 · `node tools/new-project.mjs --check` · one browser pass: MOLECULES › benzene › KICK › RUN › FLOW (tracers ride the factors; REPAIR
and GATED read) › CALCULUS shows CONTINUITY with its number and picture; MO-REGISTRY › WINDING › FLOW still rides P1's packet. One screenshot
≤ 300 KB. Lab count before and after (base in the launch message).

Write `research/iteration-005/P2-BUILD.md` (the seats, the oracle numbers, the two costs, the benzene continuity table, what the brief got wrong,
the delta), commit on `it005-factor` with a `Co-Authored-By:` line for your model, report the tip sha — never push. The RTX and the CPU are
shared; one browser suite at a time; stop only your own pids.
