# B3 THE POTENTIAL MAP — built (builder B, 2026-10-22; in the `B1–B3 THE THREE VIEWS` commit)

## What changed
- STYLE 11 `esp` (APPENDED) paints φ(r) = Σ Z_A/|r − R_A| − ∫ρ/|r − r′| on one of three surfaces, translucent over B2's sticks.
  - Opacity is 0.8 × EXPOSURE.
  - MATTE gives the colour unlit.
- The surfaces (WAVE's new ISO | SAS | SES seg):
  - ISO, the cheap first form, is DENSITY painted by φ. The density's own surface is marched and then bisected, at ρ = ISO/30 a.u. (0.002 at
    the default ISO).
  - SAS: the van der Waals spheres grown by PROBE (default 2.65 bohr = water's 1.4 Å), sphere-traced.
  - SES: the vdW spheres' log-sum-exp union filleted by k = 0.3·PROBE. It is 1-Lipschitz, so it sphere-traces, and its crevices fill like a
    rolling probe's.
- φ is the POISSON PASS (`ESP_WGSL` in field.js; five compute kernels, red–black SOR). It runs on the molecule's box: max |coordinate| + 8 bohr,
  M = 64…128 aiming at 0.35 bohr.
  - The total charge is solved at once: nuclei cloud-in-cell, plus the electrons read from the volume the field already holds. φ stays small
    everywhere, with no cancellation of two large numbers.
  - The far field Q/r + μ·r/r³ is the boundary.
  - THE CORE CORRECTION (needed, measured): the texture holds √ρ at its voxels and cannot resolve a cusp.
    - On palmitic acid (64³ texture over a 77-bohr box) the uncorrected grid had a dipole of −42 a.u., and the map read as a dipole along the chain.
    - The `core` kernel samples each free atom's Slater density (H, Li–Ar) EXACTLY as the texture samples it (√ρ at the voxels, trilinear,
      squared, 8 points a cell). It puts Z minus that sampled count back at the nucleus.
    - Palmitic acid's grid dipole came back to 1.6 a.u. On water and benzene the signs are right: O red, the H blue, benzene's face faintly negative.
  - When it runs: while ESP is drawn, when the volume, the atoms, the box or GRID change. Then at most once a second while the density
    moves, unless LIVE · SLOW is on (every new density).
  - GPU time measured (frame including the present): water 38–61 ms, benzene 60 ms, palmitic acid 260–470 ms at M = 128 on the loaded rig.
    It is a one-off per landing, never a gate.
- THE VOLUME'S GRID (C1's road): `lab/volumes-format.js` `espGrid(lwm, basis)` reads an OPTIONAL rung field `esp: { n, box }` over the blob
  `esp`.
  - The blob is f16 or f32, n³, x fastest, cell centres over [−box, box]³ bohr, holding the TOTAL φ.
  - The function returns `{ n, half, data }` or null. chemview puts it on the solve (`sol.espGrid`, `chem.espGrid()`), and rack.js hands it to
    `field.setEspGrid`, which then owns φ. With no grid, the Poisson pass runs.
- COLOUR: the standard ramp, RED negative → yellow → green → cyan → BLUE positive, set by RANGE (±φ, log 0.005–0.5, default 0.05). HUE turns
  it. USE PALETTE paints with the active ramp end to end instead.
- `ESP_RAMP` lives in `lab/palette-app.js`, and so does a PALETTE row `ESP`: the five at 0 … 0.8 and magenta at 0.9, so the phase circle
  closes (palette.test's seam/step laws; cvd measured true).
- THE COLOUR BAR (Josh's answer 3): `.lw-espbar` on the stage at the free stage's right (left of the right rack). It is vertical, with five
  numbers (±RANGE, ±RANGE/2, 0) and `φ · a.u.`. USE PALETTE puts the active ramp in it and HUE turns it.
- Animated ESP = LIVE · SLOW (the same pass on every new density).

## Tests
As B1. THE LOCK: 843/0 and 987/0.

## Shots
`b-shots/B3-esp.jpg` (ISO and SES on water · benzene · palmitic acid) and `b-shots/B3-ui.jpg` (WAVE's rows and the bar).

## CLAUDE.md sentence
"ESP (STYLE 11, iteration 014 B3) is THE POTENTIAL MAP. φ is painted on the density's ISO (ρ = ISO/30 a.u.), the SAS or the SES (PROBE), over
the sticks, with the standard red → blue ramp ±RANGE or USE PALETTE; the colour bar `.lw-espbar` sits at the stage's right. φ is a volume
rung's `esp` grid (volumes-format.js espGrid, C1) or field.js' Poisson pass, with its free-atom core correction."

## For Josh
- The Poisson map is qualitative where the GRID cannot resolve a molecule: the core correction assumes free-atom cores. C1's PySCF grid is the
  exact road.
- Default RANGE ±0.05; the reference picture used ±0.03.
- SAS at the 1.4 Å probe sits far out, where φ is near 0, so it reads green; SES or ISO show more.
