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

## G3 · INTER-SHELL STARK
(filled at G3's merge)

## G2 · SQUEEZED + CAT
(filled at G2's merge)

## The light check (existing gates only) and the cut
(filled at the cut)

## Known, deferred (recorded)
The rotor-like narrow shell, the Gaussian well, the delta shell, power laws and the radial Morse as further presets; the separable module (0.8.2's gated row); a
displaced oscillator (STARK on the QHO); field ionisation as physics (a continuum needs a grid); the helium space.
