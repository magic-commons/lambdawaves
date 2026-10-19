# A · ATOMS TO RADON (iteration 008, branch `it008-atoms`, gate server 9661 / GD 5661)

Josh (JOSH-PROMPT.md): "Can I ask why atoms up to Kr is available? Wouldn't it be possible to build up to n=6? … Rename 'Fill the Valence'
in Atoms window to 'Load Valence'. … the horizontal lines thing on spectrum … shouldn't be 'glows' when activated, instead, make it
simple lines that's dark when off and full vivid color when on."

Read first: `lab/atoms.js` whole (THE PERIODIC TABLE as a central field, Z = 1…36 by Xα(2/3) + the Latter tail; the ground configurations
and EXCEPTIONS; `frame(Z, config, g)` :243; the CACHE :353–:394; ":406 solveL per channel … n ≤ 6 comes for free"), `lab/hydrogen.js`
(the 91 labels, n ≤ 6: enough for every shell through 6p — Z ≤ 86), `lab/windows/spectrum.js` (`setElement`, `fillValence` :311, the ATOM
window's cells H–Kr, the state grid's painter), `lab/status.js` (the head's "geometry computed, not measured" is the shape of a caveat),
`lab/valence.js` (the Picker's rule; H–Kr read atoms.js, past Kr the Madelung order — once atoms.js reaches Rn, `configOf` reads atoms.js
to 86 by itself), CLAUDE.md (ATOMS left LEGACY at 0.4.0 R-A2: the periodic-table window, H–Kr cells in SPECTRUM's own picker, the Δ-SCF /
quantum-defect / α-order readouts), THE LOCK paragraph.

## Build
1. **Z = 1 … 86.** The table of symbols, names and ground configurations to Rn (the standard exceptions: Nb Mo Ru Rh Pd Ag, La Ce Gd, Pt
   Au — `lab/valence.js` MOVE has them; make atoms.js the one source and have valence.js read it); the self-consistent central field for
   each, lazily (the CACHE: an atom is solved when first asked, never at boot — measure one 5d atom's solve time and say it); the radial
   grid and the Latter tail must hold for Z = 86 (check the 1s of Rn against a non-relativistic Hartree–Fock–Slater reference you cite, and
   the 6p ε against the measured ionisation energy with the relativistic gap said as the number it is).
2. **Relativity said, not hidden.** STATUS's head line for an atom past Kr: "non-relativistic Xα: the valence levels drift from
   measurement with Z (the 6s contraction)"; the ATOM window's cells 37–86 live; the α-order / quantum-defect readouts keep working or say
   why not for a given atom. Nothing for Z ≤ 36 changes by one bit (THE LOCK's 860 / 1004 values include ATOM states — run THE LOCK ×2 if
   any code path for Z ≤ 36 moved; `--query gastab=0` for the 1004 fixture).
3. **LOAD VALENCE.** The ATOMS window's "Fill the Valence" reads LOAD VALENCE (the verb `fillValence` keeps its name; the status line says
   "loaded").
4. **SPECTRUM's lines plain.** The state grid's rows: dark when off, the full vivid colour when on, no glow or halo (find the painter —
   canvas or CSS — and write the rule once if the registry's ladder shares it; row U does the registry's).
5. The Picker's ATOMIC deck follows `ATOMS` by itself (its tiles read `ATOMS.find`); the integrator renders the el- pictures 37–86 after
   the merge (`tools/menu-thumbs.mjs --set elements`); say nothing in picker.js.

## Light check
Screenshots of the ATOM window to Rn and SPECTRUM's plain grid; Ag, Cs, Au, Rn opened (the solve time, the head's caveat, LOAD VALENCE on
Au's 6s); H and Fe unchanged (THE LOCK). `./test.sh node` (the atoms suites: the Δ-SCF and δ_s gates stay as they are), rack-deps,
`molecule-head`, `start`. Report: worktree · branch · commits · tests · blockers · next.
