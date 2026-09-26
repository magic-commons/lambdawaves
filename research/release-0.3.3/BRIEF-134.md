# BRIEF 134 · THE SHAPE — FILE › EXPORT SHAPE (GLB · OBJ · STL) and EXPORT GRID (NPZ · CUBE)

Builder: Opus 5.5, isolated worktree from `origin/main` (a577e3b = v0.3.2-alpha). Fable, 2026-09-26. Read `PLAN.md` beside
this file first (rulings R1–R3, R6), then `CLAUDE.md` whole.

## 0 · Read first
`lab/field.js` (the grid, the readback road at ≈ 1253–1300 and the `sampleVoxel` / `readStats` family; which channels hold
Re ψ and Im ψ and how the ISO level reaches the shader), `lab/mathworker.js` (ops, parking), `lab/capture.js` (EXPORT FRAMES:
the pure-JS stored ZIP writer, the download road at ≈ 1060–1090), `lab/rack.js` ≈ 3755–3770 (the FILE menu rows) and
≈ 1560–1580 (the CAPTURE group), `lab/camera-law.js` (the observer pose), `lab/paletteview.js` / the palette function the
CPU already has (the line colours use it), `lab/hamiltonian.js` (`labelOf`, Z), the MOLECULES nuclei (`lab/molecules.js`,
`lab/molecule-state.js`), `tests/menubar.browser-test.mjs` (the row driver; every new row must be driven), `docs/NOTES-FOR-AGENTS.md`.

## 1 · The law
Everything exported is **what is on screen**: the grid the field holds now, at the ISO level the shader uses now, in the
palette on screen, in bohr (R1). Nothing is recomputed on a different road, so a shape can never disagree with the picture.
The export never touches the frame path: the readback is the existing diagnostic road, marching cubes runs in the maths
worker, the page only assembles bytes and downloads. Subtract, don't add: no dialog, no knobs, no new preference, no new
material; five rows and one module.

## 2 · Build
**A. `lab/export3d.js`** (new; the marching-cubes tables are most of its length):
- `marchingCubes({ re, im, N, half, iso })` → `{ positions: Float32Array, normals: Float32Array, colors: Float32Array (rgb
  0–1), indices: Uint32Array }`. Density ρ = re² + im² per voxel; vertices on cell edges by linear interpolation of ρ to the
  ISO value; normals = −∇ρ by central differences, interpolated to the vertex, normalised, pointing outward; colours = the
  screen palette of arg ψ at the vertex (interpolate re and im, then the palette). Coordinates: voxel centres over [−half, half]³.
  Shared vertices along edges (an edge table keyed by cell edge) so the mesh is closed; degenerate triangles dropped.
- Writers, each pure and returning a `Uint8Array` / `Blob`: `glb(mesh, { name, camera })` — one mesh, one primitive,
  `POSITION`, `NORMAL`, `COLOR_0` (VEC3 float), indices UNSIGNED_INT, accessor min/max set, bufferViews 4-byte aligned, a
  `KHR_materials_*`-free default material with `vertexColor`-friendly settings (a plain material; Blender and C4D read
  `COLOR_0`), and a **camera node** (perspective: the current FOV, aspect from the canvas, near 0.05, far 100·half) placed at
  the observer's pose so Blender opens at the same viewpoint; the scene named `λWAVES · <state label> · <BUILD_LINE>`;
  `obj(mesh)` — `v x y z r g b` (the vertex-colour extension Blender's importer reads; other tools ignore the extra three),
  `vn`, `f a//a b//b c//c`, a comment header naming the state, units and ISO; `stl(mesh)` — binary, 80-byte header, the
  triangle count, per-triangle normal; `npz({ re, im, N, half, space, t, label })` — a ZIP (reuse capture.js's stored ZIP
  writer; do not copy it) of `psi.npy` (`<c8`, shape (N,N,N), C order, index [z][y][x] or say which), `axis.npy` (`<f4`, the N
  voxel-centre coordinates in bohr) and `meta.json` (label, t, half, N, space 'r' | 'p', units, BUILD_LINE); `cube({ re, im,
  N, half, atoms, label })` — the Gaussian cube of the DENSITY: two comment lines (the label; "density |psi|^2 in bohr^-3,
  lambdawaves <BUILD_LINE>"), the atom count and origin, three axis lines with N and the spacing in bohr, the atoms
  (MOLECULES: every nucleus with its Z and position; otherwise one nucleus at the origin with the Hamiltonian's Z), then the
  values in cube order (x outer, z inner, six per line, `%13.5E`).
- **The grid read:** one full readback of the field's N³ texture through the existing readback road (a staging buffer,
  `mapAsync`, f16 → f32 decode; the tests already do a partial version of this). In momentum space the grid is the momentum
  grid and `meta.space = 'p'`. If `!field.ok` the rows are disabled with the tooltip "needs the FIELD (WebGPU)".
- **The worker:** a `mesh` op in `lab/mathworker.js` runs `marchingCubes` on transferred arrays (parked like `kick`: it
  finishes; it is work the user asked for). The page writes the file and downloads it through capture.js's download road.
- **B. `lab/rack.js`**, the FILE menu, after `COPY a LINK…` and a separator, five rows: `EXPORT SHAPE · GLB` (tooltip
  "the density isosurface on screen, phase as vertex colour, the camera included — Blender and Cinema 4D: File › Import ›
  glTF"), `EXPORT SHAPE · OBJ` ("the same surface as Wavefront OBJ — opens everywhere; vertex colours where the importer
  reads them"), `EXPORT SHAPE · STL` ("the same surface for printing or any tool"), `EXPORT GRID · NPZ` ("ψ on the grid for
  NumPy: np.load(file)['psi'], complex64, with the axis and a meta.json"), `EXPORT GRID · CUBE` ("the density as a Gaussian
  cube in bohr — Avogadro, VMD, VESTA, Blender add-ons"). Each row is disabled while an export is in flight or the field is
  down. File names `lambdawaves-<label>-<YYYYMMDD-HHMM>.<ext>` with the state label slugged. After each export SETTINGS'
  status line says what was written: `EXPORTED shape.glb · 212 k triangles · 8.4 MB · 0.31 s`.
- **C. A one-line hint in the CAPTURE note** ("EXPORT SHAPE and EXPORT GRID live in FILE") only if the note's sentence can
  take it without growing; otherwise nothing.

## 3 · Tests
- `tests/export3d.test.mjs` (node): marching cubes on an analytic sphere grid (N = 48, ρ = exp(−r²), iso chosen for r = 1):
  area within 2 % of 4π, every edge shared by exactly two triangles (closed), normals unit and outward (n · r > 0), a
  vertex count that does not change when the same grid is run twice; the GLB: magic `glTF`, version 2, total length,
  JSON chunk parses, accessor counts equal the mesh's, min/max equal the measured bounds, the camera node present with
  the given FOV; OBJ: `v` count = vertices, `f` count = triangles, every index in range; STL: 84 + 50 n bytes and the header
  count; NPZ: the ZIP's local headers parse, `psi.npy`'s header says `<c8` and the shape, the bytes round-trip; CUBE: the
  header lines, the atom block, exactly N³ values, the spacing = 2·half/N.
- `tests/export3d.browser-test.mjs`: boot `?preset=1s`, force the grid to 64³, stub the download road (capture the Blob
  and name), press each of the five FILE rows through the menubar driver; assert each Blob's size, the GLB's accessor
  counts and that every vertex lies inside ±half, the STL triangle count equals the GLB's, the NPZ holds `psi.npy`,
  `axis.npy`, `meta.json` with `N`, `half`, `space`, the cube's value count; for 1s the mesh's centroid within 0.05 bohr of
  the origin and its bounds symmetric within 2 %; the loop's median frame cost before and after an export within 20 %
  (the export never stalls the frame path); a second export while one is in flight is refused. Then the same for a
  momentum-space grid (`space = 'p'`): `meta.space === 'p'`.
- `tests/menubar.browser-test.mjs`: the new rows are driven by the existing driver with the download road stubbed.

## 4 · Docs
`docs/EXPORT.md` (new, short): each file, its units, what opens it, the cube's density convention, the NPZ's index order,
the camera in the GLB, the ISO rule. README: one row in the features list. `docs/NOTES-FOR-AGENTS.md`: one bullet.
`REPORT.md`: `## 2026-09-26 · 0.3.3 — THE EXPORTS` and `### wave 134:` with the numbers you measure (readback ms, marching
cubes ms at 64/96/128³, triangles, bytes per format, worker round trip). No CHANGELOG edit.

## 5 · Proof
`node tests/pwa.test.mjs --write`; `bash test.sh node`; `node ~/Documents/MIR/tools/adopt.mjs <root> --check` in step;
browser on your own server (`LW_CERTS=/home/joshua-hosain/Documents/LAMBDAWAVES/.certs python3 tools/gate/server.py <root>
8733`; ports 8711, 8721, 8723, 8731, 8732, 8766, 8792, 8796 are others'; `LW_PORT=8733 GD_PORT=5233`): export3d, menubar,
current, history, render-regressions, gpu-cleanup (the readback lift), frame-occlusion. The digest lock is not yours to run
(no render change) — say so if you touched a shader. Commit on your branch with the attribution lines; report the
numbers, the PASS lines, and what in this brief was wrong.

## 6 · Don'ts
No dialog, no knobs, no preference, no new material or colour, no second palette, no shells (R2), no lab/mir edits, no
`pkill -f`, no git outside your worktree, nothing on the frame path, no copy of the ZIP writer.
