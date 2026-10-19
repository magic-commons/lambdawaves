# Z · RELATIVITY (iteration 008, branch `it008-zora`, gate server 9701 / GD 5701; from F's merge, independent of A7 — merged after it)

Josh (2026-10-19), asked what math would make the atoms relativistic and offered scalar ZORA as a row: "Yes that sounds good."

Read first: `lab/atoms.js` whole (A's radial Xα solver: the mesh, the Latter tail, `groundConfig`, the records' `core`, the header's
RELATIVISTIC GAP paragraph from NIST — Rn 1s 394 Eh deeper, Rn 6p₃/₂ 1.02 eV shallower / 6p₁/₂ 2.56 eV deeper, Au 6s 2.11 eV deeper),
`A-BUILD.md` (the Z ≤ 36 snapshot method; the NIST source Kotochigova et al., PRA 55, 191 (1997) — the same tables carry LDA, RLDA and
scalar-relativistic ScRLDA columns), `lab/status.js` (the atom's STATUS line), the ATOMS window in `lab/windows/readouts.js` (MODEL, the
Δ-SCF / quantum-defect / α-order readouts), `tests/atoms.test.mjs` (the Δ-SCF Ne 21.09 ± 0.15 eV and δ_s(Na) 1.373 ± 0.01 gates),
`tools/menu-thumbs.mjs --set elements` (the el- pictures come from the ATOM system), CLAUDE.md's THE LOCK paragraph (hydrogen's closed
form is `lab/hydrogen.js` — ZORA does not touch it; prove THE LOCK holds anyway, ×2).

## The physics
Scalar ZORA (van Lenthe, Baerends, Snijders 1993/1994): the kinetic operator p²/2 becomes p · c²/(2c² − V) · p, a position-dependent mass
that grows where V is deep. In the radial equation for u = rR: −½ (K u′)′ + [K l(l+1)/(2r²) + V] u = ε u with K(r) = 2c²/(2c² − V(r)),
c = 137.035999 a.u. — a two-line change to the solver's Numerov/shooting step, with K's derivative handled (write it as the operator, not a
rescaled potential; the Latter tail stays). Plain ZORA's energies depend on the zero of the potential (the gauge problem); use the SCALED
ZORA energy for the eigenvalues read out (ε_scaled = ε / (1 + ⟨u| (c²/(2c²−V)²) p² |u⟩-style norm; derive it, state it in the header) so the
deep core is honest and the valence barely changes. Spin–orbit (j = l ± ½) is NOT this row: the basis is labelled n l m; record it as the next step.

## Build
1. **ZORA is the atom's model**, every Z (Josh: more physics; one law, no switch). The non-relativistic solve is kept ONLY as the readout
   RELATIVITY Δ in the ATOMS window: per occupied level, ε_ZORA − ε_NR in eV (Au 6s should read ≈ −2 eV; Rn 1s hundreds of Eh), computed on
   demand (the second solve under the busy mark), never on a frame.
2. **THE ORACLE is the shift, not the energy.** Our Xα is not NIST's LDA (A measured 17 ppm model difference), so compare SHIFTS: ours
   (ZORA − NR) against NIST's (ScRLDA − LDA) for Rn 1s, Rn 6p, Au 6s, Au 5d, Hg 6s, Pb 6p, Kr 1s, Ar 1s, Ne 1s — a table in the build note
   with the ratio; the 1s shifts should agree to a few per cent, the valence shifts to ≈ 0.1 eV. Au's 6s ionisation: A gave 6.70 eV against
   the measured 9.23; with ZORA it should land near 8.8 — say the number.
3. **H–Kr move by parts per million** — A's bit-identical guarantee ends here by Josh's word. Run A's snapshot anyway and publish the
   per-element shift of the valence level (H 1s should move by ≈ −1.8e-4 eV, Kr 4p by ≈ 0.0x eV — know the order of magnitude before
   trusting the solver). `tests/atoms.test.mjs`' Δ-SCF Ne and δ_s(Na) gates must still pass inside their tolerances; if a gate's number
   moves, say the new number and that the tolerance held — never widen one.
4. **STATUS and MODEL say it**: past Kr "Rn · NUMERICAL · scalar-relativistic (ZORA) Xα; spin–orbit not included" with the remaining gap
   to measurement; H–Kr unchanged (no line, Josh's call stands). The ATOMS window's MODEL sheet defines ZORA in two sentences. CLAUDE.md's
   A sentences ("relativity said in STATUS", the header's gap) are the integrator's to update — propose the wording.
5. **The el- pictures** re-rendered for 1–86 (`menu-thumbs --set elements`; the contracted s shells change the look by a hair — say whether
   any picture differs by more than noise). The Picker's `valence.js` is untouched (it reads `groundConfig`, not the solver).
6. Cost: Au cold was 384 ms; ZORA's K adds a multiply per mesh point — measure cold and warm for Au and Rn; the lazy cache stays.

## Light check
THE LOCK ×2 (`--query gastab=0`; both fixtures must hold — no ATOM state is in them, hydrogen's closed form is untouched; if a row moves,
find out why before touching a fixture), `./test.sh node` (atoms 29/29), `molecule-head`, `start`; Fe, Ag, Cs, Au, Rn opened with the
RELATIVITY Δ column filled; the oracle table; screenshots of Au's ATOMS window. Report: worktree · branch · commits · tests · blockers · next.
