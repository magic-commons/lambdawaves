# C2 ISOMERS · BONDS · FLIP (chain C, iteration 014)

**What.**
- `tools/volumes/catalogue/isomers.py` (new; `build.py` calls `annotate()` on its rows before writing; also a CLI over an existing file):
  - **`isomers`**: the ids of the rows with the same formula and charge and a different InChIKey FIRST block (the connectivity), in the
    catalogue's priority order. These are structural isomers only: a shared first block is a stereo, isotope or protonation twin.
  - **`bonds: [[i, j, order]]`** over the row's OWN atom order (atomsAng, which is the solver's and the .lwm's order), with i < j and
    order 1 · 2 · 3, or **1.5 for an aromatic bond**. The connectivity comes from RDKit `DetermineConnectivity` on the atoms. The orders come
    from the SMILES as a template (`AssignBondOrdersFromTemplate`, hydrogens included, so an O–H oxygen never takes its neighbour's S=O),
    else from the geometry (`DetermineBondOrders`). A bond to H is 1. A row neither reads has no `bonds`, and D6 falls back to the distance rule.
- `pack.mjs`: the index row carries `isomers` (only the ids this run shelves, on any volume). The bonds ride in the .lwm as
  `header.meta.bonds`, the candidate's own field. A row whose atoms moved since its solve keeps the bonds of the atoms it was solved at.
  `chemview` hands them on as **`chem.solution().bonds`** (null when absent), beside C1's `esp`. That is chain D's D6 input.
- The Picker (`lab/picker.js`, `lab/skin.css`): inside a volume, a tile whose isomers are in that volume wears a **corner mark** (`.mm-iso`,
  the count of the molecule and its isomers; its line under the caption says "N isomers"). Its press opens **THE ISOMER DECK**
  (`.mm-isos` over the volume's deck): the molecule (outlined) and its isomers, built by the same `molTile()`, so the same pictures,
  hue and labels. A press there opens that molecule. ×, Escape or a press on the ground puts it away. A tile without isomers loads at once, as before.
- **FLIP** (`lab/field.js` `setParity`, `lab/camera-law.js` `setFlip` / port `flip`, `lab/windows/material.js`): a switch beside LOCK in
  the CAMERA card. It reverses the camera basis's right vector, so the ray pass, the lines, toScreen and the pointer all see the mirror
  image (the enantiomer, as a view). `cameraKey` gains `|m` while flipped, and the stage's drag turns the other way, so the picture still
  follows the hand. It is a session toggle: not saved, not in a project, a link or the digest. Off, `cameraBasis` returns the old basis bit for bit.

**Dry run (scratch).** `isomers.py` over a COPY of `vol-1.candidates.json` took 70 s for 29,509 rows: 17,409 rows have isomers (3,803
formula groups; the largest are the C₁₂H₂₂O₁₁ disaccharides and C₁₈H₃₂O₁₆ trisaccharides at ~194), and 29,407 have bonds (16,486 with an
aromatic bond; 102 without: salts, metal carbonyls, ferrocene, the atoms). The orders agree with the lengths: C–C single median 1.529 Å,
aromatic 1.395, double 1.343, triple 1.201. Packed with 1-propanol, isopropyl alcohol and methoxyethane, the index gives each the other two.

**Files.** `tools/volumes/catalogue/isomers.py` (new), `build.py` (one call, one stats row `isomersAndBonds`), `tools/volumes/pack.mjs`,
`lab/chemview.js`, `lab/picker.js`, `lab/skin.css`, `lab/field.js`, `lab/camera-law.js`, `lab/stage-gestures.js`, `lab/windows/material.js`, `lab/sw.js`.

**Tests.** `camera-shift` (node + browser) GREEN. A browser probe: `__LW.camera.setFlip(true)` negates `cameraBasis().right` exactly and
false restores it; the FLIP switch is in the CAMERA card; no page errors. Shot: `c-shots/C2-isomer-deck.jpg` (the scratch shelf: three
marks, the C₃H₈O deck of 3).

**CLAUDE.md sentence.** ISOMERS (iteration 014 C2): `catalogue/isomers.py` gives each row `isomers` (same formula and charge, another InChIKey
first block) and `bonds: [[i, j, order]]` (RDKit; 1.5 aromatic) over its own atom order; the index carries `isomers`, the .lwm
`header.meta.bonds` (`chem.solution().bonds`); a volume tile with isomers wears `.mm-iso` and opens THE ISOMER DECK (`.mm-isos`); FLIP (CAMERA,
beside LOCK) is the view's parity, `field.js setParity`, a session toggle that is never saved.

**For Josh.** (1) The biggest sugar groups give a deck of ~194; say if you want a cap or a "same skeleton class" cut. (2) The index grows
by the isomer lists (≈ 234k ids over the whole catalogue; VOL. I's share is smaller). (3) The live catalogue gets the fields on the next
`build.py` (or `isomers.py` on the file once the solvers' swap allows), then a pack. Every .lwm's candidate digest moves, so that pack
rewrites every file once.
