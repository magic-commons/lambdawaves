# 0.6.2 Honest Flow — what changed (plain words; one line per merged row)

THE ENGINE PLAN's third cut (`../release-0.6.0/PLAN.md` D.3), built by `BUILD-PLAN.md` on Josh's word of 2026-10-15 (tight builds, features only).
Nothing pushed, nothing deployed; the cut is local.

- **H2 THE DRIVE'S PITCH + H₂'S HIDDEN CORRELATION (Opus 5.5, `d32cd4a`, merged `e066dd7`).** While the DRIVE plays, STATES' readout names the stick the
  carrier is nearest and its detuning, the carrier's pitch at this RATE tagged with the ladder's basis (benzene's bright line: "186 Hz · STO-3G" at RATE
  3000), and "the drive runs at 1/x of real time" while the worker lags. On MOLECULES · H₂ (STO-3G) a note from the minimal CI: the two states
  a|σg²⟩ ± b|σu²⟩ share this density and this current, every one-body observable blind to the sign of ab, their energies 4|ab|K apart — 0.0812 Eh at the
  row's R = 1.4003 bohr (a 0.9936, b −0.1127, K 0.1813; Round 2's 0.0725 was taken near R = 1.3 bohr). `h2ci.js` already returned a, b and K.
- **H1 CONTINUITY — AS COMPUTED · BALANCED, GATED + RESIDUAL (Opus 5.5, `278d8f3`, merged here).** `lab/flow-balance.js`: Round 1's BALANCED solver with
  Round 2's corrections — the floor mask and the largest connected component, harmonic face weights, no-flux faces, the mean source removed, the zero-RHS
  guard, Jacobi-PCG to a relative 10⁻⁴, and the current read from each cell's two faces (the breathing Gaussian: 4.0 % at 32³, 1.75 % at 48³, as Round 2
  measured). The worker op `flow.balance` samples ρ, j and ρ̇ on a 32³ grid and solves off the frame thread (benzene's RING: 371 ms, one request in flight,
  the newest D wins, ≤ 8 Hz); the flow source gains a repair hook (j += ρ∇φ, read trilinearly). FLOW SOURCE on both FLOW rows: AS COMPUTED (default, v = j/ρ)
  · BALANCED (v + ∇φ); REPAIR reads the repair's share of the current's kinetic energy under BALANCED (the RING: ≈ 174 % at residual 9·10⁻⁵ — the register's
  current is a cancelling quantity) or the tracked finite-basis defect under AS COMPUTED (the RING 1.15, water 1.32 — never "≈ 0"); GATED reads the share
  of tracer steps the floor refused; the caption names the source; Round 1's oracle sentences ride the control as hints for benzene and water. ρ̇ from the
  register's own closed form (±0.01 a.u.) or the RT landings' difference. `flowSource` persists default-absent. NOT this cut: the DEFECT view as a volume
  (a CPU grid upload is a new presenter road), 48³, Ḋ under the DRIVE.
- **Lines:** 28,371 → 28,504 (+133; cap 28,654). The register suite 22/22 at the 0.6.1 cut; both locks at this cut as recorded in the checkpoint.
