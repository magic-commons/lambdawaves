# FILE › EXPORT SHAPE / GRID

Five rows, five files, no dialog (CLAUDE.md, `research/release-0.3.3/BRIEF-134.md` R6). Each writes **what is on
screen right now** — the grid the field holds, at the ISO level the shader uses, in the palette on screen — never
a second computation that could disagree with the picture. The work (the grid readback, marching cubes, and
every writer) runs off the frame path, in the maths worker's `export` op (`lab/export3d.js`, `lab/mathworker.js`);
the page only reads, posts and downloads through `capture.js`'s own save road. Where this file and
`lab/export3d.js`'s header comment disagree, the code is right.

## Units

1 unit = 1 bohr in every file, on a position-space grid. On a momentum-space grid (SPACE = p) the shape and grid
files carry ħ/bohr instead, and say so (the GLB's `extras.units`, the OBJ header, the STL header, the NPZ and
cube's `units` field). The cube file is always in bohr by its own format convention regardless of which space the
grid came from — a momentum-space cube still declares `N > 0` (bohr-like spacing), since Gaussian-cube readers
assume a real-space lattice; read its `meta`-equivalent comment line for the true units if you asked for one.

## FILE › EXPORT SHAPE — GLB · OBJ · STL

The shape is the **density isosurface**, ρ = |ψ|² = ISO, at the one ISO level on screen (SETTINGS' ISO knob,
`mat.iso`, a fraction of ρ_max — never nested shells; that is a later wave, PLAN.md's R2). Marching cubes runs on
the field's own N³ grid (voxel centres over [−half, half]³); vertices sit on cut cell edges, shared between the
cells that meet there, so the mesh is closed wherever the surface does not leave the grid. Normals are −∇ρ by
central differences, interpolated to the vertex and normalised outward. Vertex colour is the phase view's own
lookup — arg ψ through the palette on screen (or the built-in wheel, with HUE and INVERT applied exactly as the
shader applies them) — so a palette change on screen is a colour change in the next export, never a second
convention.

**Axes.** λWAVES is z-up (z is the quantization axis). GLB and OBJ carry `(x, z, −y)` of the lab's own axes — a
proper rotation — because glTF is Y-up by specification and Blender's and Cinema 4D's glTF/OBJ importers assume
Y-up; either importer turns the mesh back to z-up on import, so it sits exactly as it does on screen. STL (for
printing, z-up by the usual convention for that trade) keeps the lab's own axes untouched.

- **GLB** (glTF 2.0 binary) — one mesh, one primitive: `POSITION`, `NORMAL`, `COLOR_0` (VEC3 float, linear —
  the sRGB palette is linearised for glTF, which requires linear vertex colour), `UNSIGNED_INT` indices, a plain
  `pbrMetallicRoughness` material (no texture, no `KHR_materials_*` extension) that any importer reads, and a
  **perspective camera node** at the observer's own pose (right, up, dir, distance, FOV, aspect, near 0.05, far
  100·half) — open the file in Blender or Cinema 4D and the first camera view matches the screen. The scene is
  named `λWAVES · <state label> · <BUILD_LINE>`. File › Import › glTF 2.0 in Blender; File › Import › glTF in C4D.
- **OBJ** — `v x y z r g b` (the vertex-colour extension Blender's OBJ importer reads; a tool that does not read
  it simply sees three extra numbers per line and ignores them), `vn`, `f a//a b//b c//c`. A comment header names
  the state, the ISO fraction and value, the grid size and the units. Opens everywhere.
- **STL** — binary: an 80-byte ASCII header (`lambdawaves …`, never beginning "solid", which a reader would take
  for the text form), the triangle count, then per triangle the unit face normal, its three vertices and a zero
  attribute word (84 + 50·n bytes). For printing or any tool that reads STL.

A shape export is **numerical**, not exact: it is marching cubes on the grid, so the surface is exact up to the
grid's own spacing (half the voxel size at the finest). The underlying physics (ψ itself) is exact or gated
elsewhere, per CLAUDE.md and REPORT.md; this file only writes down what the grid already holds.

## FILE › EXPORT GRID — NPZ · CUBE

- **NPZ** — a ZIP (the same stored, uncompressed writer as EXPORT FRAMES, `render-exact.js`'s `zipStored`; this
  module imports it rather than carrying a second copy) of three files:
  - `psi.npy` — NumPy format 1.0, `<c8` (little-endian complex64), shape `(N, N, N)`, **C order**, so
    `psi[i, j, k] == ψ(axis[i], axis[j], axis[k])` — x outer, z innermost, the same order the cube file uses for
    its own index. `np.load(file)['psi']` in Python (`np.load` on a `.npz` reads every member by name).
  - `axis.npy` — `<f4`, shape `(N,)`, the N voxel-centre coordinates in bohr (or ħ/bohr on a momentum grid), the
    same axis for all three dimensions (the grid is cubic).
  - `meta.json` — `label`, `t` (the logical time), `half`, `N`, `spacing` (= 2·half/N), `space` (`'r'` or `'p'`),
    `units`, the build line.
- **CUBE** — a Gaussian cube of the **density** |ψ|² (never ψ itself — a cube file has one real value per voxel):
  two comment lines (the state label; "density |psi|^2 in bohr^-3, lambdawaves `<BUILD_LINE>`", or the momentum
  equivalent), the atom count and the first voxel's centre, three axis lines (N and the spacing in bohr per axis —
  a **positive** N marks bohr, the format's own convention), the atom block (Z, nuclear charge, position — every
  nucleus MOLECULES holds, or, with no molecule on the field, one nucleus at the origin carrying the active
  Hamiltonian's Z), then the values in **cube order** — x outer, z innermost, matching the NPZ's own index — six
  per line at `%13.5E`. Opens in Avogadro, VMD, VESTA, and any Blender chemistry add-on that reads `.cube`.

## The ISO rule, restated

Every shape export reads `mat.iso` (SETTINGS' ISO knob) at the moment the row is pressed — the exact fraction of
ρ_max the on-screen raymarch is using that frame — and nothing else. There is no separate "export quality" or
export-time ISO; changing the on-screen ISO and exporting again writes a different, and only then different,
surface. The same law holds for the palette (`paletteOn`, the stops, HUE, INVERT) and for the camera pose.

## Filenames and status

`lambdawaves-<state label, slugged>-<YYYYMMDD-HHMM>.<ext>`, collision-suffixed `-2`, `-3`, … within a session
(`capture.js`'s own `uniqueName`). SETTINGS' status line reports what was written, e.g.
`EXPORTED shape.glb · 212 k triangles · 8.4 MB · 0.31 s`. A row is disabled while an export is already running or
the FIELD (WebGPU) is down; a second press while one is in flight is refused rather than queued.

See also `research/release-0.3.3/PLAN.md` and `research/release-0.3.3/BRIEF-134.md` for the brief this module was
built against, `tests/export3d.test.mjs` for the byte-exact node proof of every format, and
`tests/export3d.browser-test.mjs` for the wiring proof against the real field and the real worker.
