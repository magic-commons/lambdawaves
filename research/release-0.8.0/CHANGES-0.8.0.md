# 0.8.0-alpha "Central Lab" — what changed (Claude Yan / Fable 5.1, 2026-10-16)

The engine plan's D.12. Plan `BUILD-PLAN.md` (Yan, drafted 10-16 01:00 while 0.7.3 cut; base `a2072ff`, 29,525 lines, cap 29,820). Three Opus builders in parallel
from `a2072ff`: G1 `g1-central`, G2 `g2-squeeze`, G3 `g3-stark`; merged G1, G3, G2. Build notes: `G1-BUILD.md`, `G2-BUILD.md`, `G3-BUILD.md`. Josh 00:35: "Let's
continue onward with the rest of the build plans."

## The shape
ONE RADIAL SOLVER: `cornell.js`' Numerov made generic — a Hamiltonian CENTRAL whose potential is a preset with knobs (CONFINED · YUKAWA · FINITE WELL · SOFT-CORE ·
QUARKONIUM back with its editor); a label not bound for the knobs in force is UNBOUND — no energy, no row, counted and said ("watch states leave the bound
spectrum", honestly: the register has no continuum). THE SQUEEZE beside the slap on the OSCILLATOR, capped at r ≤ 0.5 by a law (at r = 1 a 1.2 % lost norm hides a
74 % variance error), the variance error printed beside the lost norm; a CAT = the A/B store + a sum. INTER-SHELL STARK through the propagator hook: H = diag(E) + F·z
over the 91 labels, eigensolved once per F; ionisation SAID, never simulated (the saddle F_c = 1/(16n⁴) printed; the basis's share of α = 4.5 measured and shown).

## G1 · THE CENTRAL HAMILTONIAN + FIVE
(filled at G1's merge)

## G3 · INTER-SHELL STARK (`lab/stark.js` 35 lines new; `lab/state.js` +4 and five in-line edits; `lab/windows/state.js` the STATIC FIELD row; one-line guards in `shell/controller.js`, `spectrum.js`, `status.js`, `informational.js`, `windows/film.js`, `verbs.js`, `badges.js`, `index.html`; branch `g3-stark` tip `05788c0`)
- `starkPropagator(F, E)`: H = diag(E) + F·z over the 91 labels, eigensolved once per F (3.0–4.5 ms), the object `setPropagator` takes (S = I); `saddle(n) = 1/(16n⁴)`;
  `polarizability()` the n ≤ 6 sum over states. `hydrogenZ` moved verbatim into `stark.js` (on `eigSymQL`, identical at n = 91) and re-exported from the worker —
  one z for both threads (built once, 286 ms, on the first INTER-SHELL press).
- **The switch** INTER-SHELL beside STARK F: refused with one sentence off hydrogen, under STURMIAN, at Z ≠ 1; ON stands down K_z · DEFECT · SPIN K_z · SPIN L² ·
  TRANSITION · Ω RABI (greyed, zeroed) and RATE; c(t) stays continuous across the switch and across F moves; the propagator is in force while the flag is on AND
  F ≠ 0 (F = 0 or an operator switch stands it down). **The readout** "1s −7.2e-6 Eh · α(n ≤ 6) 3.59 of 4.5 · saddle n = 3 at 7.7e-4: past it, would ionise — this
  basis holds it" (the lowest shell past its saddle at the F in force; every number computed). **The word:** STATUS "HYDROGEN + F·z · NUMERICAL · eigensolve in the
  n ≤ 6 basis · no continuum: ionisation said, not simulated" (103 of 110 characters); the caption, the badges and the MODEL sheet's STATE sentence say the same.
  **Persists:** `experiment.field.inter` PROJECT, absent when off (STATE-SCOPES one row).
- **Checked (`tests/stark.test.mjs`, 11 laws):** ⟨1s|z|2p₀⟩ = 128√2/243 to 8.6e-14; the 2s/2p₀ splitting 3F at F = 1e-4 to 6e-13 by Richardson on F and 2F (raw
  2.4e-9 — the cubic term; the law holds as the F → 0 limit, a brief correction); α₆ = 3.5855 (79.7 % of 4.5 — the brief's 3.66 is the bound-state sum to n = ∞);
  the 1s shift at F = 1e-3 = −½α₆F² to 1.1e-10, at F = 0.002 −7.2e-6 Eh (the brief's −9.0e-6 was the exact α's); `evolve` unitary at t = 100 to 3e-15; saddles n =
  1…6: 6.25e-2 · 3.91e-3 · 7.72e-4 · 2.44e-4 · 1.0e-4 · 4.82e-5. hydrogen 37/37 · dynamics 19/19 · sturmian 16/16 · kick 16/16 · qho 11/11 · status green;
  serialize-bytes 11/11 identical; headless Firefox: 1s + 2p_z under INTER-SHELL at F = 0.002 through the switch and a restore, stand-downs visible, no errors.
- **At the merge:** `rack.js`' `statusLine()` (G1's file) gains one line after the STURMIAN one — `if (reg.P && reg.P.stark) s = 'INTER-SHELL STARK · NUMERICAL · FIELD
  GRID';` — added by the integrator. Dropped by the row: ions (Z ≠ 1 refused), the transport's period readout under the propagator, the A/B guards outside the row.

## G2 · SQUEEZED + CAT (`lab/kick.js` l.197–218, `lab/state.js` +2, `lab/windows/state.js` the IMPULSE row, `lab/calculus.js` +5, `lab/meters.js` +2; branch `g2-squeeze` tip `9290e01`)
- **The headline: the plan's squeeze numbers were wrong, so the cap is r ≤ 0.33, not 0.5.** The oscillator register is not "N ≤ 10": it holds n_r + l ≤ 5
  (`qho.js` l.8–10), so |0 0 n_z⟩ is fully inside it only for n_z ≤ 5; the old `sonnet2-e-squeeze` measurement assumed every n_z ≤ 10 was inside. Re-measured on the
  real register against a 3-D grid projection of the closed-form squeezed vacuum (agreeing to 5.5e-13): Var(z) error · lost norm = 2.9e-6 · 2.2e-8 at r = 0.1 ·
  1.1e-4 · 1.6e-6 at 0.2 · 1.05e-3 · 2.0e-5 at 0.3 · **1.81e-3 · 3.7e-5 at the cap 0.33** · 5.5e-3 · 1.3e-4 at 0.4 · 2.06e-2 · 5.4e-4 at 0.5 (the plan said 1.8e-3 and
  2.4e-5 there). The ≤ 2e-3 gate was NOT widened: the knob stops at 0.33 (bisection 0.3359); the test's tolerance is tol(r) = 2e-3·(r/0.33)⁵, the fifth power being
  the leading dropped term (the ⟨4|z²|6⟩ cross term).
- `applySqueeze(re, im, r, axis)`: the tree has no Cartesian ↔ spherical map, so at fixed ρ every register orbital is projected once onto span{h₀…h₁₀(z)} (240 ms;
  each new r ≈ 30 ms); unitary on the full product basis to 5.4e-14, the identity at r = 0 to 5.6e-13; x and y through the slap's rotors; off OSCILLATOR it throws
  `SQUEEZE_REFUSAL` before touching the state. `state.squeeze(r, axis, t)` through `_op` like a slap (one undo row).
- **Controls** on the IMPULSE row: SQUEEZE r (0…0.33), SQUEEZE-IN, CAT (two slaps at k > 0 along ±d into A and B — exact; the cat at k = 1: even parity to 1.9e-33,
  ⟨z⟩ = −2e-19, Var(z) within 7.2e-5 of its closed form); all three disabled off OSCILLATOR with the sentence in their titles (through `onHamiltonian`). **Readouts:**
  CALCULUS's Var(z) tile (`varianceZ`, exact within the register); METERS and the IMPULSE readout print the last squeeze's sentence — at the cap "Var(z) 0.2589 ·
  e^{−2r}·Var₀ = 0.2584 · error 1.8e-3 · lost norm 3.7e-5". **Persists:** r as `mat.bow.squeeze`, the IMPULSE row's own PROJECT record, absent until the knob moves
  (a share link drops it). Screenshot `g2/squeeze-r033-z.png`.
- **Checked:** `tests/squeeze.test.mjs` 5/5; kick · qho · calculus · hydrogen green; rack-deps holds (`app` 30 keys); new-project in step; serialize-bytes 11/11
  identical; the trigs disabled under HYDROGEN in the browser, no errors.
- **Found, not fixed (a standing bug, recorded for a later row):** `bessel.js` `sphericalBessel` is wrong for negative x (j₁(−0.5) reads −1/6), so `applyKick(…, −k)`
  is not e^{−ikz}; the cat avoids it by slapping along ±d with k > 0.

## The light check (existing gates only) and the cut
(filled at the cut)

## Known, deferred (recorded)
The rotor-like narrow shell, the Gaussian well, the delta shell, power laws and the radial Morse as further presets; the separable module (0.8.2's gated row); a
displaced oscillator (STARK on the QHO); field ionisation as physics (a continuum needs a grid); the helium space.
