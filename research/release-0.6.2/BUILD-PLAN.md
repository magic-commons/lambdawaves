# 0.6.2 "Honest Flow" — THE BUILD PLAN (Claude Yan / Fable 5.1, 2026-10-15; drafted while 0.6.1 builds — base and cap are filled at 0.6.1's cut)

Josh's dial (2026-10-15): tight builds, features only, no gate code, pre-1.0. THE ENGINE PLAN D.3 (`../release-0.6.0/PLAN.md`), Round 1's T1 · T7 · T11
and Round 2's C4 · C5 (the vault's DRAFT-3 files) are the record. Base: `yan-c` after the v0.6.1-alpha cut (tip TBD); cap = that cut's `lab/` lines × 1.01.

## The rows (two builders, Opus, own worktrees)
| row | what lands | files | Δ |
|---|---|---|---|
| **H1 CONTINUITY — AS COMPUTED · BALANCED, GATED + RESIDUAL** (M1 + C5 + M7 + N6's flow sentences) | FLOW SOURCE on the FLOW switch's row: AS COMPUTED (default, v = j/ρ, today's tracers) · BALANCED (v″ = v + ∇φ with −∇·(ρ∇φ) = s, s = ∂_tρ + ∇·j the finite-basis defect): the solve on a 32³ (48³ where the frame affords it) cell-centred grid in a worker — floor mask 1e-7 + the largest 6-connected component, harmonic-mean face weights, no-flux faces, c = Σs/Σρ removed, Jacobi-PCG to a RELATIVE residual 1e-4, the zero-RHS guard, the CELL CURRENT = the mean of the cell's two face fluxes w(φ₊ − φ₋)/h (Round 2 C5: the centred gradient misses the dipole identity by 7 %, the face flux closes it to 1e-8) — φ's gradient sampled trilinearly into the tracers' velocity; ρ̇ from Ḋ where the producer has it analytically (the TD-CIS register's amplitudes), else the centred difference of two consecutive D(t) landings (the RT run); the two captions carry the oracle's measured numbers ("real-time check (6-31+G*): BALANCED 0.92 · AS COMPUTED 0.85" for benzene's RING; "AS COMPUTED 1.00 · BALANCED 0.92" for water's bright line — typed as Round 1 measured them, named as such); the readouts "the repair carries x % of the current's kinetic energy", "gated n %" (the share of tracer steps the floor refused) and the tracked grid residual ‖∂_tρ + ∇·j″‖/‖∂_tρ‖ honestly labelled (it reads 0.08–0.25, never ≈ 0); FLOW's caption says which source plays. NOT this cut: the DEFECT view as a volume (a CPU grid upload is a new presenter road — the engine plan's RU row). | lab/molecular-flow.js (the source gains a repair hook) · a worker op in lab/mathworker.js (or the flow's own small worker) · lab/chemview.js + lab/statesview.js (the FLOW row, the readouts) · lab/windows/readouts.js (the caption) | +120 |
| **H2 THE DRIVE'S PITCH + H₂'s HIDDEN CORRELATION** (M11b + C4) | STATES' DRIVE readout names the line the carrier ω is nearest (the ladder's sticks), its pitch at this RATE — f = ω·RATE/2π Hz, basis-tagged ("186 Hz · STO-3G") — and "the drive runs at 1/x of real time" when the worker lags (`r.lag`); on MOLECULES · H₂ a caption from `lab/h2ci.js`: "two states share this density and this current; their energies differ by 4abK = 0.0725 Eh" with a, b, K from the minimal CI at the shown R (Slater–Condon: the determinants differ by two orbitals, every one-body observable is blind to the sign of ab) | lab/statesview.js · lab/chemview.js (one note under H₂) | +20 |

## The mathematics (Round 1 T1, T7, T11; Round 2 §2 and C5 — KNOWN/DERIVED/MEASURED)
ρ = Σ Re D_pq χ_pχ_q, j = Σ Im D_pq χ_p∇χ_q, v = j/ρ; the defect s = ∂_tρ + ∇·j is the basis alone for RT-TDHF and the TDA's gauge dependence for the TD-CIS
register (benzene's E1u closes continuity to 0.575 in STO-3G, 0.985 in 6-31+G*; the register 0.15 / 0.37). BALANCED v″ = v + ∇φ keeps the register's
ρ-solenoidal part and replaces its potential part by the density's; curl and circulation unchanged; the sharp oracle (RT-TDHF, 6-31+G*) ranks BALANCED 0.92 >
AS COMPUTED 0.85 > SHAPE FLOW 0.68 on benzene's RING and AS COMPUTED 1.00 on water; neither is "the truth" — AS COMPUTED is the default, BALANCED one press
away, both captioned. The face-flux cell current: on the breathing Gaussian and the quartic phase at 48³ the ρ-weighted velocity error is 1.75 % / 3.1 % (the
centred gradient 4.7 % / 11.2 %); the RING's dipole identity closes to 1e-8. PCG: 110/168/228 iterations to 1e-8 at 32/48/64³; 1e-4 gives the same answer to
four digits at 2.6× fewer. Pitch: f = ω·RATE/2π — benzene's bright line 186.35 Hz (STO-3G) / 139 Hz (6-31+G*) at RATE 3000; the step cost measured in the worker.

## Gates (existing only) · the cut
Node gate 0 after every row (`tests/molecular-flow.test.mjs` pins today's defect numbers — unchanged by a second source); `pwa --write`; the one owning
browser suite once per row; at the cut THE LOCK ×2 (no locked state plays FLOW) and the line law; then the local cut `v0.6.2-alpha` "Honest Flow".
NO push, NO deploy, NO gh release.
