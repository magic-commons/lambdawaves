# 0.3.3 · THE EXPORTS — the shape for Blender and Cinema 4D, the grid for NumPy and chemistry, the state as LaTeX

Fable, 2026-09-26, from Josh's word: *"Ooh, yes that's a fun idea for 0.3.3! Let's build it! What other things can we
export? Could the spectrum window perhaps have a 'copy' button on the window bar that allows it to copy the current orbitals
(chemistry style in its ordering hehe) in latex format similar to how I wrote them in the 'Wave Dancer' notebook?"* —
and a Reddit reader asking whether the shapes can be used in C4D / Blender.

Branch `release-0.3.3` from v0.3.2-alpha (a577e3b). Two waves, built in parallel by two Opus 5.5 builders in isolated
worktrees, each verified by a fresh Opus 5.5 agent before it merges; Josh cuts.

| wave | brief | what |
|---|---|---|
| 134 · THE SHAPE | `BRIEF-134.md` | FILE › EXPORT SHAPE (GLB · OBJ · STL) at the ISO level on screen, phase as vertex colour, the camera in the GLB; FILE › EXPORT GRID (NPZ · CUBE): ψ on the grid for NumPy, the density as a Gaussian cube for Avogadro / VMD / VESTA |
| 135 · THE COPY | `BRIEF-135.md` | a copy button on SPECTRUM's window bar (and EDIT › COPY the state as LaTeX): the register in Josh's notebook style — `$2p_{-1}$, $2p_{1}$, $4p_{-1}$, and $4d_{2}$` — in chemistry order, plus the full expansion with amplitudes and phases |

## What the app already holds (why this is small)
- ψ on an N³ `rgba16float` grid, up to 128³, read back today for the proofs (`field.js` readbacks, never on the frame path).
- A maths worker (`mathworker.js`) for anything that must not sit on the pointer; a pure-JS stored ZIP writer in `capture.js`
  (EXPORT FRAMES); the download road (`a.download` on an object URL); a clipboard road with a `copied` flash (`layout.copyDigest`).
- Exact hydrogen eigenstates in the register, so an exported hydrogen shape is exact up to the grid spacing; the molecular
  orbitals gated against Hartree–Fock totals.

## Rulings (flip any and only that line moves)
- R1 Units: 1 unit = 1 bohr in every file (glTF, OBJ, STL, cube); the cube is in bohr by its own convention.
- R2 One ISO level per shape export (the one on screen); nested shells are a later wave.
- R3 The shape is the DENSITY isosurface; the phase hue (the palette on screen) is the vertex colour.
- R4 Chemistry order for the LaTeX = Madelung (n + l, then n; within a subshell m ascending −l…l), which is what "chemistry
  style" means for an electron configuration and is why Josh laughed: for hydrogen 4s comes before 3d.
- R5 The copy is two lines: the prose list in Josh's style, then the expansion `$\psi = …$`; the reader deletes one.
- R6 No format dialog: five FILE rows, each one file, each with a tooltip naming what opens it.

## Other exports considered (not built now; say the word)
- STL of nested shells (a printable "cloud"); a mesh sequence over ONE PERIOD (Blender's Stop-Motion-OBJ) — R2 first.
- OpenVDB for Cycles volumes (the true λWAVES look in Blender) — real work; after the mesh has users.
- SVG of SHADOW (q, p) and SPECTRUM for papers — needs a second drawer per plot.
- CSV of the spectrum (E_n, |c|², phase) and of METERS over time.
- COPY as LaTeX on other windows (METERS' readouts, the Hamiltonian) — the same head button, one digest per window.

## Proof, both waves
`node tests/pwa.test.mjs --write` after the last lab/ edit; `bash test.sh node`; the browser suites named in each brief on
the builder's own server; MIR adopt `--check` in step; for 134 a verifier that imports the files into a headless Blender
fetched for the purpose and reads the NPZ and the cube with NumPy; for 135 a verifier that pastes the copy into the
notebook and sees KaTeX render it.
