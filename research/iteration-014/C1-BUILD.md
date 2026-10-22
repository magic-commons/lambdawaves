# C1 POTENTIAL DATA IN THE VOLUME (chain C, iteration 014)

**What.** `tools/volumes/esp-pass.py` (new). It is NOT a re-solve. It starts from a molecule's saved top rung (`raw/<id>/<basis>.npz`): C goes from
the app's AO order back to PySCF's, then D = C occ Cᵀ. It evaluates the electrostatic potential on a 32³ grid over the march box:
φ(r) = Σ_A Z_A/|r − R_A| − Σ_μν D_μν (μν | 1/|r − r′|). The electron term is PySCF `mol.intor('int1e_grids', grids=…)` (cart, chunked so
a 600-AO rung stays near 0.8 GB); the nuclear term is exact. It also writes the Mulliken charges from D and S. Output is `raw/<id>/esp.npz`
(tmp + rename); `meta.json` is never touched, because the solvers own it. `pack.mjs` carries the grid, `lab/volumes-format.js` reads it and
`lab/chemview.js` hands it to the stage.

**THE BYTES (what chain B reads).**
- In the `.lwm`: the grid is a blob `esp` in the top rung's blobs (`header.rungs[basis].blobs.esp`). Its dtype is **`f16`**: IEEE-754
  binary16 bits stored as u16 (a new DTYPE row, `Uint16Array`). Beside it: `header.esp = { basis, n, box, min, max, charges, unit: 'Eh/e', grid, source }`.
- `espOf(lwm)` → `{ n, box, f16, basis, min, max, charges, unit, grid, source }` or `null`.
  - **`n`** = 32.
  - **`box`** = the HALF-width in bohr. The grid covers the cube [−box, box]³ about the origin, with the atoms as solved.
    box = max(max|coord| + 6, (20/13)(R + 3)), R the farthest nucleus: the record's `ground.half` then `chemview.js framed()`, which is the
    box DOMAIN AUTO draws the molecule in.
  - **`f16`**: `Uint16Array(n³)`, φ in Eh/e (× 27.211 for volts), sampled at the CELL CENTRES x_i = −box + (i + ½)·2·box/n (likewise y_j, z_k).
    The flat index is **i + n·(j + n·k)** (x fastest): upload it as an `r16float` 3-D texture with x as the width. Values are clipped to
    ±65504 before the cast (only a cell beside a nucleus could reach that).
  - `min`/`max` = φ over the grid in f64 before the cast. `charges` = Mulliken charges per atom, in the file's atom order.
- On the stage: a volume molecule's landed solution carries the grid as **`chem.solution().esp`** (chemview's `r.esp`, the same object
  `espOf` returns). It is `null` for a file packed before C1, and then chain B falls back to the live Poisson pass. It is always the TOP
  rung's density, whichever rung is open (`esp.basis` says which).

**Dry run (scratch only: `~/.claude/jobs/2ea66c54/tmp/c-scratch/`).** I copied raw/H2O, 1-propanol and aspirin there (a read of the live raw/),
then ran `esp-pass.py --raw <scratch>/raw --only …` and `LW_VOLUMES=<scratch> pack.mjs --only … --out-dir <scratch>/dist`.
- H2O 6-31+G* (23 AO): ±7.431 bohr, φ −0.0931 … 11.843 Eh/e, 0.29 s. 1-propanol (92 AO): 2.4 s. Aspirin (263 AO): 23 s (niced 19, 4 threads,
  with the solvers loading the CPU). The Mulliken charges match the solver's own to 4e-15. Water's far corner reads +0.0034 Eh/e (its dipole's
  ~1/r² tail) and its lone-pair side −0.093.
- A packed water grows from 105,008 to 171,120 B (+64 KiB for the grid, plus its header words). **Without esp.npz the pack is byte-identical
  to the live `dist/vol-1/m/H2O.lwm`** (sha 1c4e7bf2…), so a molecule the pass has not reached packs exactly as before.
- `--incremental`: `header.source.espSha256` joins the kept test only when the grid exists (old headers have none). An untouched molecule
  stays kept, and a new grid repacks only its own molecule. PACKER stays `v3`.

**Files.** `tools/volumes/esp-pass.py` (new); `tools/volumes/pack.mjs` (reads u2 npy, the esp block, the kept test); `lab/volumes-format.js`
(the `f16` dtype, `espOf`); `lab/chemview.js` (`r.esp`); `tests/volumes-format.test.mjs` (null on the old fixture, a grid round-trips); `lab/sw.js`.

**Tests.** `node tests/volumes-format.test.mjs` PASS, plus the scratch dry run above.

**CLAUDE.md sentence.** THE POTENTIAL GRID (iteration 014 C1): `tools/volumes/esp-pass.py` evaluates φ from a molecule's saved top rung
(D from C and occ, PySCF int1e_grids + the nuclear term; no re-solve) on 32³ cell centres of the march box into `raw/<id>/esp.npz`;
`pack.mjs` carries it as the rung blob `esp` (dtype f16) and `header.esp`; `volumes-format.js espOf(lwm)` → `{ n, box (half, bohr), f16,
basis, min, max, charges }`, and a volume molecule's solution carries it as `chem.solution().esp` (null before the pass: Poisson's road).

**For Josh.** The pass over the live raw/ is yours (or the babysitter's finish): `esp-pass.py` (all ids), then `pack.mjs … --incremental`.
At ~0.3–25 s a molecule on a loaded CPU, ~6,000 molecules take a night or two. The shelf grows ~64 KiB a molecule (≈ 0.4 GB for VOL. I, which
counts toward C4's 5.25 GB cut). A faster pass (density fitting, or the GPU) is worth building only if a night is too long.
