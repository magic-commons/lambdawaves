# Iteration 005 · G — THE GPU SOLVER (brief)

Branch `it005-gpu` from the BASE in the launch message. Tools only — no `lab/` edit (print the lab count before and after; it must not
move). No push. Josh's dial: the feature, no new test files, one measurement. Read first: `PLAN.md` here; `research/iteration-004/V1-BUILD.md`
(THE SOLVER: every AO kept — `scf.hf.remove_overlap_zero_eigenvalue = False`, cart=True, conv_tol 1e-9 / conv_tol_grad 1e-6, the rung below's
projected density as the guess, DIIS → level shift → newton, the npz fields, the flock queue, SIGTERM); `tools/volumes/solve.py`,
`lwbasis.py`, `oracle-ladder.py`; `tests/fixtures/oracles/basis-ladder-v1.json` (17 rungs, the pinned energies); `tests/basis-ladder.test.mjs`.

The machine: RTX 3070 (8 GB, driver 595.99.02 — CUDA 12 wheels run on it; there is no nvcc and none is needed), Ryzen 5 5600G (12 threads),
30 GB RAM. The venv is `~/.local/share/lw-volumes/venv` (Python 3.12, PySCF 2.14, numpy, scipy, RDKit, tblite). THE LONG SOLVE runs on the CPU
in `~/Documents/LAMBDAWAVES-VOLUMES/raw/` (pid in `raw/solver.pid`) — never kill it, never write into `raw/` with anything but `solve.py`
itself through its own lock; your GPU runs write into a SCRATCH raw dir (`--raw <dir>`, add the flag if it is missing) until the measure is done.
The RTX is shared with browser suites another builder may run: a CUDA solve alongside a Firefox WebGPU page is fine functionally; cap your
GPU memory (`cupy` mempool limit ≈ 6 GB) so neither starves.

## The rows
1. **Install.** `pip install gpu4pyscf-cuda12x cutensor-cu12` into the venv (cupy-cuda12x comes with it). Record the versions. If import fails
   on this driver, record the exact error, try the one obvious alternative (`gpu4pyscf-cuda11x` or a pinned cupy), and if that fails too the
   row closes here with the error in the note — nothing else is attempted.
2. **`solve.py --gpu`.** The same ladder on the card: `mf = scf.RHF(mol).to_gpu()` (or gpu4pyscf's own RHF), cart=True, EVERY AO kept (confirm
   gpu4pyscf does not drop near-dependent overlap eigenvectors — compare C's shape and the energy on STO-6G HBr against the CPU path; if it
   drops them, find its switch or close the rung to the CPU), the projected guess built on the CPU and handed over, the convergence ladder
   DIIS → level shift → newton with any step gpu4pyscf lacks falling back to the CPU for that rung (recorded in `solve.gpu`), the npz byte-for-byte
   the same fields and AO order (the packer must not know which solver ran; `solve.solver` names it). The flock queue is unchanged, so a GPU
   solver and the CPU solver share one catalogue.
3. **THE ORACLE.** The 17 rungs of `basis-ladder-v1.json` solved with `--gpu` into the scratch raw dir: every energy within 1e-9 Eh of the pinned
   value — print the worst Δ and the per-rung Δ table; anything worse is a finding, not a tolerance to loosen.
4. **THE MEASURE.** testosterone, capsaicin, cholesterol at 6-31G* and 6-31+G* with `--gpu` (their atoms are in the pilot's candidates file,
   `~/Documents/LAMBDAWAVES-VOLUMES/catalogue/pilot.candidates.json`; the CPU seconds are in V1-BUILD.md's table: 128.9/321.5, 90.0/244.8,
   201.2/573.2 s) — wall seconds, cycles, the energy Δ against the CPU npz in `raw/` (read-only). From the six ratios: ONE speed-up number
   (the geometric mean) and its range; then the days for the 950 and for the 7,534 at that speed-up (CPU alone 85 h and ≈ 28 days measured), GPU
   alone and both together. Also β-carotene's 6-31+G* (872 AO; CPU 869.9 s) if memory allows — say if it does not.
5. **`tools/volumes/long-run-gpu.sh`** beside the CPU command in V1-BUILD.md: the same catalogue, `--gpu`, its own pid file (`raw/solver-gpu.pid`);
   NOT started by you.

## Checks, then the note
`./test.sh node` 0 (nothing in lab moved; `tests/basis-ladder.test.mjs` still green on the CPU path); the scratch raw dir deleted or named.
Write `research/iteration-005/G-BUILD.md`: versions, what gpu4pyscf does differently (overlap eigenvectors, newton, memory), the oracle table,
the measure table and THE NUMBER, the days table, the exact command for Josh to start the GPU solver and to stop it (kill -TERM by pid, never
pkill). Commit on `it005-gpu` with a `Co-Authored-By:` line for your model; report the tip sha and the number — never push.
