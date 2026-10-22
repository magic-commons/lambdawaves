# B1 FAT BALLS — built (builder B, 2026-10-22)

Shipped in ONE commit with B2 and B3 (`B1–B3 THE THREE VIEWS`): the three share one shader branch, one atom buffer and one UI row,
and ESP draws B2's sticks inside its surface, so splitting them would have meant three throwaway intermediate shaders.

## What changed
- `lab/field.js`: STYLE 9 `balls` is APPENDED (`STYLE`, `STYLE_NAMES`, `ATOM_STYLES = [9, 10, 11]`). Nothing is renumbered, and an older
  build opens a saved 9–11 as CLOUD.
  - The RENDER_WGSL fragment returns before the march (after DUST's early return), so the march's text is untouched.
  - CPK spheres are ray-traced exactly: radius r_vdW × SIZE, inside the box/CLIP interval. A CLIP cut shows the sphere's flat face.
  - One key light; HUE (p2.x) turns the colours round the grey axis (exact identity at 0); INVERT applies.
  - A bounding-sphere test runs first, so a ray that misses the molecule costs one test.
- New `View` slots p7–p10: atom count, bond count, SIZE, RADIUS · surface, probe, RANGE, USE PALETTE · φ grid · bounding sphere. The view
  buffer goes from 11 to 15 vec4.
- New bindings 6 (`atm`: atoms then bonds) and 7 (`phiG`) on the explicit render layout.
- `field.setAtoms(atoms, charge)` uploads only when the atoms change (identity check, then a key check). `rack.js`' field tick calls it
  while an atom style is drawn.
- `lab/elements.js` (NEW, DOM-free) is now the one element table: covalent radii, CPK colours (a few Jmol rows added: He Ne Ar K Ca Sc–Ni
  Ga Kr Rb Sr Ag Sn I Xe Cs Ba Pt Au Hg Pb), Bondi van der Waals radii and `bondsOf`. `skeleton.js` and `field.js` both read it.
  - Why a new file: importing `skeleton.js` from `field.js` closed an import cycle that stalled the chem solve. Bisected: the solve never
    landed.
- `lab/windows/material.js`:
  - The STYLE seg gains BALLS · STICKS · ESP. It wraps into the seg's grid, so no word wraps.
  - Two rows (`wave-row-7`, `wave-row-8` in `native-ui.js`) are shown only while an atom style is drawn: SIZE · RADIUS · PROBE · RANGE,
    then ISO|SAS|SES · USE PALETTE · LIVE · SLOW. A control the current style does not read is dimmed, never moved.
- New `mat` keys (`atomSize`, `stickR`, `probe`, `espRange`, `espSurf`, `espPal`, `espLive`) are written only by a hand.
  - A project that never touched them serialises byte for byte as before.
  - `persist.js` restore calls `ui.atomDrawSync(pm)`, which deletes an absent key so the default comes back.
- `native-ui.js`: GLASS is disabled on 9–11. MATTE is enabled on ESP, where it gives the map's colour unlit.

## Tests
`./test.sh node`: green except wigner W42-8 (known timing flake). THE LOCK: 843/0 and 987/0. Browser suites:
- render-regressions GREEN.
- library GREEN on a re-run (one flake on the first run).
- chem: L7 timing flake only.
- official-defaults-palette RED on the base too (lean / aaHidden: not this chain).
- `node tools/rack-deps.mjs --classes --no-write`: the HINGE HOLDS (spectrum 25).

## Shots
`b-shots/B1-balls.jpg` (water · benzene · palmitic acid).

## CLAUDE.md sentence
"BALLS (STYLE 9, iteration 014 B1) is the molecule as CPK spheres. It is ray-traced in RENDER_WGSL before the march, so THE LOCK's styles
never run it. The sphere radius is r_vdW (`lab/elements.js`, Bondi) × WAVE's SIZE, and HUE turns its colours. The atoms come from
`field.setAtoms` (rack.js' field tick, while an atom style is drawn)."

## For Josh
- SIZE runs from 20 to 150 %, with 100 % meaning space-filling.
- The colours are the skeleton's CPK table, so a new element row changes both views.
