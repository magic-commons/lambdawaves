# Iteration 011 — THE QUIET STAGE, THE MINIMIZED DEFAULTS, THE ATOMIC TILES' n (Josh, 2026-10-19 ≈ 13:00; planned by Claude Sos)

## Josh, verbatim
> For the informational, also include a button that hides the extra status thingy. When switching between different hamiltonian systems (which usually adds a lot of different orbitals), have the informational automatically hide ultra large lists so it doesn't fight the screen and users don't have to keep toggling it on and off just because a certain mode uses an obscene amount of 140 levels. By default make most of the hidable texts and exandable windows minimized for default users. Also I feel that the skeleton's circles are a little too small, maybe make them a little bigger and remove the outline on the circles so that it's a flat colored disk. Or actually, move skeleton into it's own row amongst stage formula and atom labels with a size knob to increase the disk size. Also the layered s orbitals in the atomic main menu section don't seem to satisfyingly show that layer it is... ACTUALLY I just noticed that the orbitals aren't correctly their 'n' level. it's definitely incorrect to just show the lone highest orbital with it's pure n= at it's level but it's really just an indicator and visual aid. Ultrathink

> (≈ 13:10, with a screenshot of the MOLECULAR deck showing LATTICE and HEAVY install cards among the molecule tiles — `josh-molecular-deck-installs-2026-10-19.png`) ooh another thing while you're at it, remove those 'lattice' and 'heavy' and other downloadable stuff from the molecular system, let that be it's own UI system for handling saved/stored/unsaved molecules in the library section

## Sos's reading (to confirm by the builds' screenshots)
- "The extra status thingy" = the status sentence(s) the stage words draw beside the formula (the atom's STATUS line past Kr is the long one); the "ultra large lists" = the populated-state list the stage writes when SPECTRUM owns the field (140 entries after FILL ALL at n = 7 or a Hamiltonian switch). Both are INFORMATIONAL's business (iteration 007 I: every announcement has a kind; its own preference record).
- The SKELETON row joins STAGE FORMULA and ATOM LABELS (each ON + SIZE), leaving BEAD and ELLIPSOID in MARKS.
- The atomic tiles: the element's highest occupied subshell is the right subject (Josh: "an indicator and visual aid"); what fails is that an opaque isosurface hides an s orbital's radial layers, so 5s · 6s · 7s look alike. A half-cut through the nucleus shows n − l − 1 radial nodes as layers. And every tile's (n, l) is checked against the ground configuration.

## Rows (Opus builders in isolation worktrees, branch `it011-<row>` from BASE = this plan's commit; gate server per row; merged by Sos with Yan's recipe; THE LOCK ×2 if the field or the fixtures move)
| row | name | what | port |
|---|---|---|---|
| Q1 | THE QUIET STAGE | INFORMATIONAL: a STATUS switch (off by default) for the status sentence(s); a LIST CAP knob — a populated list longer than the cap collapses to a count line automatically; the SKELETON row (ON + SIZE; flat disks, no outline, a bigger default) beside STAGE FORMULA and ATOM LABELS | 9401 |
| Q2 | MINIMIZED BY DEFAULT | the first-run sweep: every fold and expandable in every window closed on a first run unless an earlier ruling says open; a table of each with its ruling; stored choices win; `new-project --check` in step | 9411 |
| Q4 | THE LIBRARY OWNS THE INSTALLS | the section-install cards (LATTICE, HEAVY, …) leave the MOLECULAR deck — it shows molecules only; the LIBRARY section gets the one UI for installed / stored / not-yet-downloaded molecules and sections (install, remove, sizes, what is here) | 9431 |
| Q3 | THE ATOMIC TILES' n | every el-*.webp's (n, l) checked against groundConfig; the tiles (and the ATOMIC deck's orb-*s tiles) re-rendered with a half-cut so the radial layers read; a programmatic count of the visible layers on s tiles | 9421 |

## Closed
| row | merged | note |
|---|---|---|
