# V2 THE SKELETON — build note (0.7.0 "Vibrate")

Branch `v2-skeleton` off `ca00472` (`yan-c`). Builder: Opus, for the integrator. Tip: the commit that adds this note (see `git log -1 v2-skeleton`).

## What landed, by seat

- **`lab/skeleton.js`** (new, 40 lines). `createSkeleton(cv)` returns `{ draw(atoms, dipole, obs, half), clear() }` and draws on its own 2-D canvas.
  - **Beads:** one disc per nucleus at `toScreen(obs, half, W, H).at(x, y, z)`. Radius = 0.28 × the covalent radius in bohr, projected by offsetting the point along the camera's `basis.right` by that radius, so a bead shrinks with distance. Filled in its CPK colour at 0.9 alpha with a 1 px rim in the ink. Drawn far to near.
  - **Bonds:** every pair within **1.3** × (rᵢ + rⱼ) of the atoms as passed (see corrections). Recomputed only when the atoms' key changes. 2 px lines in the ink at 0.7 alpha.
  - **Dimming:** the far half (mean depth past the origin's) is dimmed, beads to 0.35 and bonds to 0.25, as `angular-nodes.js` dims.
  - **Dipole arrow:** from the centre of nuclear charge along `dipole`, 2 bohr per a.u., in the accent, 2 px with a 6 px head. Not drawn when the dipole is null or |μ| < 0.01.
  - **Keyed:** atoms · dipole · `cameraKey` · dist · fov · half · canvas size · dpr · theme. With nothing changed there is no paint. `clear()` paints only if something was drawn, so off means one clear and then nothing.
  - **Theme:** ink = the kit's `--fg`, accent = `--acc`, read with `getComputedStyle(document.body)` only when `body[data-theme]` changes. No hard-coded colour except the CPK element table.
- **`lab/index.html:91`**: `<canvas id="skeleton" aria-hidden="true">` after `#kepler`.
- **`lab/lab.css:458`, `:460`**: `#skeleton` joins the overlays' shared rule and takes `z-index: 7` beside `#kepler` (later in the DOM, so above it). `#atomLabels` (z 9) stays above both.
- **`lab/rack.js`**
  - `:25`: the import.
  - `:506`: the governed tick, after the overlay-domain if/else (that block excludes `chem.on`, so the tick cannot sit inside it beside KEPLER's):
    `if (ui.skeletonSw && ui.skeletonSw.get() && app.state.chem.on) { if (may('skeleton')) tick('skeleton', () => skeleton.draw(app.state.chem.atomsNow(), app.state.chem.dipoleNow(), obs, domain.half)); } else skeleton.clear();`
    When `may()` yields (a rack scroll, a parked reader), the bitmap stays rather than flickering off.
  - `:736`: `const skeleton = createSkeleton(document.getElementById('skeleton'))`, a closure const in `boot()` beside the other overlays. The `app` literal is not extended.
  - `:738`: `READERS.skeleton = wChem`.
- **`lab/shell/controller.js:76`**: `skeleton: 0` in `perf.profile`. Without it, `tick()`'s EMA would start from `undefined` and the METERS profile would read NaN. Zero lines.
- **The switch:**
  - `lab/windows/molecules.js:54–56`: `ui.skeletonSw = sw({ label: 'SKELETON', … onChange: saveSettings + PRESENT })`, handed to `createChem` as `api.skeleton`. The `sw` import joins `molecules.js`' line 3.
  - `lab/chemview.js:245`: **one line**, `if (api.skeleton) rV.appendChild(api.skeleton.root);`, right after the chevron's `chip(...)`.
  - The VIEW row was already full at the card's 256 px: the chevron wrapped to a second line at the base. SKELETON shares that line, after the chevron. No new row is added; the row measured 106.6 px tall with the switch in it. The base's height was not measured.
- **PREFERENCE `skeleton`**
  - `lab/shell/settings.js:37` (the writer, beside `audio`): `skeleton: (ui.skeletonSw && ui.skeletonSw.get()) || undefined`. The key is **absent while off**, so no blob changes for anyone who never turns it on.
  - `:105` (the reader): `ui.skeletonSw.set(s.skeleton === true)`.
  - `lab/settings-store.js`: unchanged. A blob key outside WORKSPACE is PREFERENCE already, and the probe agrees.
- **Atom labels** (`lab/shell/stage-words.js:85–86`, `:94`): the atoms are re-read every CPU tick from `app.state.chem.atomsNow()`, and their coordinate key joins `placeKey`. They therefore follow the nuclei once V1 poses them. With nothing posing, `atomsNow()` is `moleculeAtoms(preset)`, so the same positions go through the same `S.at` and the same transform strings, and placement is byte-identical. `moleculeAtoms` left this file's import.
- **`lab/sw.js`**: the precache rows, rewritten by `pwa --write`.

## Numbers

- **Screenshot:** `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-aaeb90431ef594d2f/.tmp/v2-skeleton-benzene.png`. Not committed. 1500×1000 headless Firefox, light theme, the BENZENE demo with SKELETON on.
  - It shows the six-ring, the six C–H bonds, grey C and white H beads with dark rims, and the C/H labels sitting on the beads. 9064 lit pixels on `#skeleton`.
  - No arrow, correctly: benzene's dipole is ~1e-13 a.u.
  - The shot was taken at the 1.2 factor. Benzene's bond count is the same at 1.3, so the picture is the same.
- **Draw:** **0.31 ms** per draw at benzene. Measured as the mean of 200 forced redraws through the key, full 1500×1000 clear included, in that Firefox. Benzene is **12 atoms, not 36** (36 is its STO-3G AO count): **66 pairs examined, 12 bonds** (6 C–C, 6 C–H).
- **Bond rule across the 54-molecule library:**
  - At 1.3, the largest bonded ratio d/(rᵢ + rⱼ) is 1.239 (F₂) and the smallest unbonded is 1.402 (CH₃CN's nitrile C to the methyl H).
  - At the brief's 1.2, F₂ loses its bond (ratio 1.239) and H₂ keeps its bond only at 1.195.
- **`sol.dipole` shape:** a plain 3-array `[μx, μy, μz]` in a.u. (`lab/rhf-molecule.js:250`: nuclear minus electronic, about the coordinate origin). It is passed through by `chem.ground` (`lab/mathworker.js:249`) and by the record road (the same reply), and `dipoleNow()` returns it or `null` before a solve.

## Tables and their sources

- **Covalent radii, H–Kr:** Cordero, Gómez, Platero-Prats, Revés, Echeverría, Cremades, Barragán, Alvarez, "Covalent radii revisited", *Dalton Trans.* 2008, 2832–2838 (Table 2).
  - Choices: C sp³ (0.76); Mn, Fe and Co low-spin (1.39, 1.32, 1.26).
  - Converted Å → bohr with `md.js`' `ANGSTROM`.
  - An element outside the table would bead at 1.5 Å and draw no bonds; none occurs.
- **CPK colours:** Jmol's element colours for the 21 elements the library carries (H Li Be B C N O F Na Mg Al Si P S Cl Cu Zn Ge As Se Br). Anything else falls back to Jmol's unknown pink.

## Corrections to the brief and plan

1. **The brief was not at the base.** `V2-BRIEF.md` lives in `d6563e7`, the checkpoint after `ca00472`. I read it with `git show d6563e7:…` and kept the base at `ca00472`.
2. **Benzene has 12 atoms, not 36,** and the pairs are 66, not "a few hundred".
3. **The bond factor is 1.3, not 1.2.** At 1.2, F₂ draws no bond. 1.3 sits in a clean gap (1.239 bonded, 1.402 unbonded).
4. **`draw` takes no W, H.** The frame pass has no W, H in scope, so the skeleton reads its own canvas's client size, as `angular-nodes.js` does.
5. **The tick sits after the overlay-domain if/else,** not inside it beside KEPLER's (rack.js:493): that branch is false whenever `chem.on`.
6. **Off means one `clear()` and then nothing, but not "else clear()" on every `may()` refusal.** A refusal while on keeps the bitmap.

## Dropped, and why

- **CAPTURE** (`capture.js:743`'s default overlay list stays `vortex, particles, kepler`): adding `skeleton` would change every capture's `upscaled` report even with the switch off. `#flow` is not in that list either. A caller can pass `overlays: ['skeleton', …]`.
- **Ions' dipole origin:** for NH₄⁺, H₃O⁺, OH⁻ and CN⁻ the dipole depends on the origin. The arrow draws `dipoleNow()` as given (about the coordinate origin), from the centre of nuclear charge. A charge-corrected μ_C = μ₀ − q·C would need the charge, which the reader does not pass.
- **A METERS sub-line entry for `skeleton`:** the profile key exists, and `__LW.perf.profile.skeleton` reads it.

## Δ lines

`lab/` (the plan's count): **28,922 → 28,971 = +49** (budget +65).
- `skeleton.js` 40
- rack.js +3
- molecules.js +2
- stage-words.js +1
- settings.js +1
- chemview.js +1
- sw.js +1
- controller.js 0

## Gates

| gate | result |
|---|---|
| `node tests/pwa.test.mjs --write` | run after each `lab/` edit |
| `./test.sh node` | rc 0, no red |
| `node tools/rack-deps.mjs --classes --strict` | rc 0; THE HINGE holds |
| `node tools/new-project.mjs --check` | in step (16117 B) |
| `node tools/settings-probe.mjs` (port 9321 / 5421) | GREEN 6 of 6. A first run went red on N₂ with "Render did not settle: animation frames stopped" (frame-settle.js, the headless rAF). The rerun was green; the switch was off in both runs. |
| `node tools/serialize-bytes.mjs` | 11 readings, DONE. No project key was added: `skeleton` is PREFERENCE only. |

## For the integrator

- **`lab/chemview.js`** is shared with V1. My one line (245) sits right after the chevron's `chip(…)` in the VIEW row, about 8 lines below `const more = …` / `rTda`, where V1 builds its VIBRATE row. I did not touch the API tail (l.925–926, `atomsNow` / `dipoleNow`).
- **V1 posing atoms:** the bonds are recomputed whenever the atoms' key moves, which is every posed frame. That is 66 pair tests at benzene. A bond could blink at large amplitude only for a pair near 1.3 × the radii, and none in the library is between 1.24 and 1.40.
- **THE LOCK:** with SKELETON off, the pass calls `skeleton.clear()`, which returns at once (nothing was ever drawn), and the canvas stays the untouched 300×150 transparent default. The atom labels' writes and transforms are unchanged when nothing poses.
