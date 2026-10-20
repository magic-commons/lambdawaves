# O1 THE OTHER EDITS — BUILD (iteration 012, chain it012-other, branch `it012-other`, after R2)

> **LOUD: `lab/field.js` did NOT move, but THE LOCK's molecular rows WILL move.** (c) widens DOMAIN AUTO's box under some molecules.
> H₂O keeps its box exactly (±7.4309, and `tests/field-law` stays green). **Benzene (±10.69 → ±11.83) and lysine get bigger boxes**, so
> `tools/perf/digest-lock.mjs`' `chemC6H6`, `chemLys` and `chemLysHomo` rows will read red until Yan re-captures them by name.
> `tools/menu-thumbs.mjs` would also draw molecule thumbnails at the new box on its next run (none were regenerated).

## (a) Keyboard rotation: the delay before the turn
- **Where.** WASD rows in `lab/shell/keys.js` → `queueKeyOrbit` in `lab/camera-law.js` (the easing queue the frame loop steps). A held key
  used the system's auto-repeat: **500 ms before the first repeat, then a 0.12 rad step every 30 ms** (this desktop:
  `org.gnome.desktop.peripherals.keyboard delay 500`, `repeat-interval 30`), each step eased with τ = 65 ms.
- **Now.** The press still queues its one eased 0.12 rad step (a tap is unchanged). **120 ms after the press** a still-held key turns the
  camera **every frame** at the same speed as the old repeat (0.12 rad / 30 ms = 4 rad/s; Shift's fine step × 0.25), until its release:
  the rows' `up` (the kit's held-key law, which also runs on a page blur), so the drive can never stick. No step quantisation between
  steps. OS auto-repeats of a held key are ignored (the hold is keyed by row id).
- **Measured** (`.tmp` probe, WebDriver keyDown 700 ms, which never auto-repeats): yaw moves at +65 ms (the tap's step), turns
  continuously from +130 ms at ≈ 3.9 rad/s and stops at the release. Before, the same hold made one 0.12 rad step and nothing else
  until the OS's 500 ms.
- No new app slot: `queueKeyOrbit(yaw, pitch, id)` holds; `queueKeyOrbit(0, 0, id)` releases.

## (b) Ball-and-stick's back/front fade, softened (`lab/skeleton.js`)
- **Before:** a step at the origin's depth z₀: bead α = z > z₀ ? 0.35 : 0.9; bond α = z̄ > z₀ ? 0.25 : 0.7 — a bead popped from 0.9 to
  0.35 the frame it crossed.
- **After:** a glide over the molecule's own depth. w = max |z − z₀| over the atoms; u = clamp(((z − z₀)/w + 1)/2, 0, 1);
  s = u²(3 − 2u). **bead α = 0.9 − 0.4 s** (0.9 nearest, 0.7 at the centre, 0.5 farthest); **bond α = 0.7 − 0.35 s**. Continuous, so a
  turn never pops a bead, and the back stays legible. The dipole, the bead and the ellipsoid are unchanged.

## (c) DOMAIN AUTO under molecules
Measured with `.tmp/o1/domain-shots.mjs` (13 subjects, screenshots, 64³):

| subject | old half (max\|coord\| + 6) | R (farthest nucleus) | visible sphere (R + 3) / half, old | new half | fill, new |
|---|---|---|---|---|---|
| H atom (1s) | 6.99 | — | ≈ 0.43 (density edge ≈ 3) | 6.99 (atoms unchanged) | — |
| C atom | 10.15 | — | ≈ 0.45 | 10.15 | — |
| Fe atom | 12.28 | — | — | 12.28 | — |
| H₂ | 7.40 | 1.40 | 0.59 | 7.40 | 0.59 |
| H₂O | 7.43 | 1.68 | 0.63 | 7.43 | 0.63 |
| C₆H₆ | 10.69 | 4.69 | 0.72 | 11.83 | 0.65 |
| aspirin (VOL. I) | 13.53 | 7.88 | 0.80 | 16.73 | 0.65 |
| caffeine (VOL. I) | 13.85 | 7.89 | 0.79 | 16.75 | 0.65 |
| palmitic acid (VOL. I, a fatty acid) | 27.93 | 21.93 | 0.89 | 38.35 | 0.65 |
| cholesterol (VOL. I, a lipid) | 21.22 | 15.74 | 0.88 | 28.83 | 0.65 |
| C₆₀ | 12.42 | 6.56 | 0.77 | 14.71 | 0.65 |
| myricyl palmitate (VOL. I, longest chain) | 44.21 | 38.31 | 0.93 | 63.55 | 0.65 |
| colfosceril palmitate (VOL. I, the biggest: 334 AO, a phospholipid) | 34.62 | 32.50 | **1.03** | 54.62 | 0.65 |

- **Why they left the box.** No nucleus ever left the cube (its half is max|coordinate| + 6), but the rule measures along the AXES while a
  chain lies on a DIAGONAL: colfosceril's nuclei reach 32.5 bohr from the centre in a ±34.6 box, so its visible density met the box's
  faces and edges. At the default camera (distance 3.3 half-units, FOV 0.6, the front face's corners already outside the viewport) a
  turn brought those ends off the stage. The bigger the molecule, the fuller its box (0.59 for H₂ → 1.03), while an atom fills ≈ 0.45:
  hence the inconsistent size between atoms and molecules.
- **The rule now** (`lab/chemview.js` `framed`, at the landing, so the field, the flow, THE POTENTIAL and the rack's domain read one
  number): half = max(old half, (20/13) · (R + 3)), R the farthest nucleus from the box's centre, 3 bohr the valence density's visible
  edge. The visible sphere is at most 65 % of the half at every turn — an atom's order of size — and never smaller than the old cube, so
  H₂ and water keep their boxes. Atoms are untouched. Cost: a bigger box is coarser voxels at the same GRID (colfosceril 1.71 bohr per
  voxel at 64³, was 1.08); the governor's higher GRID rungs recover it.
- The H₂ record is not centred (z 0 … 1.4); R measures from the box's centre, so it is held, not moved.
- `tests/official-defaults-palette` and `tests/field-law` keep their meaning and are green.

## (d) The window / UI / save / favourite pass
| check | how | result |
|---|---|---|
| `history` browser suite | 9521 | **green** on the re-run (the first run's scene 9 — a link opened at boot — timed out `__LW.ready`; alone it passed: a load flake) |
| `new-project` browser suite | 9521 | green |
| `lw-links` | 9521 | green |
| `library` | 9521 (with the dev `lab/volumes` link) | green |
| `start` | 9521 | green (3 of 3 scenes) |
| `keyboard-shortcuts` (node) | `./test.sh node` | green |
| `keyboard-window` | 9521 | green |
| `menubar` | 9521 | green |
| `official-defaults-palette` | 9521 | **red at BASE, fixed** (test re-aimed, no app change): it read a VIVID knob in SETTINGS, which left for the kit's look store in iteration 003 G, and compared the whole `mir.gui` record, which the kit now writes in full; it now reads `__LW.look.get()` and the lifted keys. Same assertions otherwise |
| `field-law` | 9521 | green (red with a first 5/3 framing that also grew water's box; fixed by the 20/13 rule that keeps it) |
| WINDOW menu by hand | DOM presses on the menubar | **green**: 40 rows; ⊕ RENDER opens the closed card; a second press on its row (now ↑ RENDER) raises it, by design; WINDOW › FOLDERS opens FOLDERS |
| FAVOURITE (☆) by hand | ☆ → SAVE LAYOUT, fold PALETTE, ☆ → the saved row | **green**: the row reads "1 · 10 windows · both racks", the load put PALETTE back as it was |
| SAVE from FOLDERS by hand | FOLDERS → SAVE — this project | **green**: "saved UNTITLED", the library 1 → 2 |
| OPEN from FOLDERS by hand | solve NH₃, press the saved tile | **green**: "opened UNTITLED", the molecule back to H₂O |
| small, not fixed (M1's) | — | WINDOW lists FOLDERS twice (the door at the top and the rack card `⊕ FOLDERS`); a fresh profile's FOLDERS library already holds 1 project before any save; FOLDERS stays open after an OPEN (BASINS' behaviour — Josh to say) |

## Files
`lab/shell/keys.js`, `lab/camera-law.js`, `lab/skeleton.js`, `lab/chemview.js`, `tests/official-defaults-palette.browser-test.mjs`,
`lab/sw.js` (pwa --write). Screenshot: `research/iteration-012/o-shots/O1-framing-ballstick.png` (colfosceril palmitate, the biggest
molecule, inside its new ±54.6 box, BALL AND STICK on with the depth glide).

## Tests
`./test.sh node` GREEN (41 suites); `rack-deps --classes --no-write` HINGE holds (25/25); `new-project.mjs --check` in step; browser:
chem 0/56, field-law 0/9, official-defaults-palette green, history green (re-run), new-project, lw-links, library, start, keyboard-window,
menubar green.

## CLAUDE.md sentences for Yan
- After the CAMERA LOCK paragraph: "A held WASD key turns the camera every frame from 120 ms after its press (iteration 012 O1,
  `camera-law.js` `queueKeyOrbit(yaw, pitch, id)` holds and `(0, 0, id)` releases through the rows' `up`); a tap is still one eased 0.12 rad step."
- In THE VOLUMES/MOLECULES text: "DOMAIN AUTO's half under a molecule is max(max|coordinate| + 6, (20/13)(R + 3)), R the farthest nucleus
  (iteration 012 O1, chemview `framed` at the landing): the visible molecule is at most 65 % of the box at every turn; H₂ and water keep theirs."
- In the skeleton line: "the far half glides (bead 0.9 − 0.4 s, bond 0.7 − 0.35 s, s a smoothstep over the molecule's depth), never a step."

## Open questions for Josh
1. The framing constant (65 % fill): the big lipids now sit smaller and coarser (their box is 1.6× wider). Tighter (a larger fill) gives more
   voxels but brings the ends back toward the stage's edges. Keep 65 %?
2. The hold delay 120 ms and speed 4 rad/s (the old repeat's): faster, slower, or no delay at all (a tap would then turn a little further)?
3. The back of the ball-and-stick reads 0.5 at its farthest (was 0.35). Softer still?
