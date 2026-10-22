# B2 PURE STICKS — built (builder B, 2026-10-22; in the `B1–B3 THE THREE VIEWS` commit)

## What changed
- STYLE 10 `sticks` (APPENDED) draws one capsule per bond, using Quilez's exact ray–capsule test.
  - Each bond is two half-capsules (A → midpoint, midpoint → B), each in its own atom's CPK colour, as in `refs/sticks-atom-ends.jpg`.
  - RADIUS is in bohr, 0.10–1.20 (log), default 0.38 = 0.2 Å.
- The bond list is THE ONE RULE: `bondsOf` in `lab/elements.js`, every pair within 1.3 × (rᵢ + rⱼ) covalent. `skeleton.js` (BALL AND STICK)
  reads the same function, which was moved there rather than forked.
- An atom no bond reaches is a ball of RADIUS (its r_vdW is stored negative in the atom buffer as the flag), so a lone ion stays visible.
- The lighting, HUE, INVERT and CLIP interval are BALLS'.
- ESP (B3) draws these same sticks inside its translucent surface.

## Files
`lab/field.js` (`capsuleHit`, `ballsOrSticks(…, sticks)`), `lab/elements.js`, `lab/skeleton.js` (reads `bondsOf`),
`lab/windows/material.js` (RADIUS).

## Tests
As B1 (same commit).

## Shots
`b-shots/B2-sticks.jpg`.

## CLAUDE.md sentence
"STICKS (STYLE 10, iteration 014 B2) draws a capsule per bond of elements.js' `bondsOf` (THE ONE BOND RULE, which the skeleton also
reads). Each half takes its atom's CPK colour; RADIUS is in bohr (0.38 default), and an unbonded atom is a ball of RADIUS."

## For Josh
- The bond cut-off is the skeleton's 1.3 × covalent sum. A long or ionic bond the skeleton misses is missed here too, by design: one rule.
