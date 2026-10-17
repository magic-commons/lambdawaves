# Iteration 005 · G THE GPU SOLVER — build report

Branch `it005-gpu` from `679dd7e`. Tools only: `tools/volumes/solve.py` (`--gpu`, `--raw`, `--gpu-memory`, `--largest-first`) and
`tools/volumes/long-run-gpu.sh` (new, NOT started). No `lab/` edit (lab count 31,474 before and after), no test file, no push.
THE LONG SOLVE (pid 3509635, CPU, `raw/`) was never touched; `raw/` was only read (the CPU npz and metas for the comparison).

**THE NUMBER: the RTX 3070 solves the big rungs 2.24× faster than the CPU solver (geometric mean of six; range 1.67–2.74×),
3.48× on β-carotene's 872-AO 6-31+G\*.** GPU and CPU together on one queue: the 950 in ≈ 26 h instead of 85 h, the 7,534 in ≈ 8.6 days
instead of ≈ 28.

## Versions (installed into `~/.local/share/lw-volumes/venv` with `uv pip`; PySCF, numpy and scipy were not moved)

| package | version | note |
|---|---|---|
| gpu4pyscf-cuda12x | 1.8.1 | with gpu4pyscf-libxc-cuda12x 0.8.1, geometric 1.1.1, networkx 3.7, pyscf-dispersion 1.5.0 (its deps) |
| cupy-cuda12x | 14.2.0 | `[ctk]` extra needed: without it the import fails with `ImportError: Failure finding "libnvJitLink.so.13 or libnvJitLink.so.12"` |
| CUDA runtime wheels | cuda-toolkit 12.9.2.0 (cublas 12.9.2.10, cusolver 11.7.5.82, cusparse 12.5.10.65, nvjitlink 12.9.86, nvrtc 12.9.86, cudart 12.9.79, cufft 11.4.1.4, curand 10.3.10.19) | from pip; no system CUDA, no nvcc |
| cutensor-cu12 | 2.8.1 | CuPy 14 does not find the wheel's `libcutensor.so.2` by itself (gpu4pyscf then warns "using cupy as the tensor contraction engine"); `solve.py --gpu` preloads `libcutensor.so.2` + `libcutensorMg.so.2` with `ctypes` (RTLD_GLOBAL), and the rung records `gpu.contraction: cutensor` |
| PySCF / numpy / scipy | 2.14.0 / 2.5.4 / 1.18.1 | unchanged |
| driver | 595.99.02 (CUDA 13.2 driver API) | runs the CUDA 12.9 wheels; `runtimeGetVersion` 12090 |

## `solve.py --gpu` — what it does, and what gpu4pyscf does differently

The same queue, the same ladder, the same npz. Per rung: the projected guess is built on the CPU (`project_dm_nr2nr`, as before) and
handed to `gpu4pyscf.scf.RHF`; DIIS (100) → DIIS + 0.5 Eh level shift (150) → newton (60) all run on the card (gpu4pyscf has all three;
its `newton()` is `gpu4pyscf.scf.soscf`); the converged ε, C, occ come back as a PySCF CPU RHF object (no SCF is run on it), so the
npz, dipole, Mulliken, minEigS and the app-order conversion are the CPU's own code — the packer cannot tell. `rung.solver.engine` names
the solver (`gpu4pyscf 1.8.1 (CuPy 14.2.0, CUDA runtime 12090) on NVIDIA GeForce RTX 3070`, or `PySCF 2.14.0 (CPU)`), and `rung.gpu`
records the device, versions, the pool limit, the pool size at the rung's end, and a `fallback` reason if the card failed. A rung that
throws on the card (out of memory, anything) is solved on the CPU in the same process and says so (`engine: PySCF … (CPU, the GPU fell
back)`; proved by `--gpu-memory 0.000001`: H₂O fell back on both rungs, converged, the reason recorded). The flock queue, the
SIGTERM handling and the tmp + rename writes are unchanged, so a GPU and a CPU solver share one `raw/`.

Three things gpu4pyscf does differently, each found and handled:

1. **It keeps its own copy of the overlap flag.** `gpu4pyscf.scf.hf.remove_overlap_zero_eigenvalue` (default True, threshold 1e-6) is
   separate from PySCF's; with it on, HBr STO-6G (S's smallest eigenvalue 8.5e-7) would lose a function as PySCF did in V1. `--gpu`
   sets it False. Every rung's C is square (17 of 17 in the oracle table; 20×20 for HBr STO-6G), and its canonical orthogonaliser is
   then X = V e^(−½) over every eigenvector, as PySCF's.
2. **Its core Hamiltonian is not PySCF's to 1e-10.** gpu4pyscf's nuclear attraction on Br differs from PySCF's by up to 1.3e-10 per
   element (2.9e-10 Eh in HBr's energy at a fixed density; S agrees to 4e-16, J and K to 6e-12). `--gpu` hands the card PySCF's own
   `get_hcore` (one-electron integrals on the CPU, a fraction of a second).
3. **Its SCF energy drifts.** gpu4pyscf builds the Fock incrementally (vhf += vhf(ΔD), each build screened), and the accumulated
   energy sits 1–2e-9 Eh away from the energy of the density it has (HBr STO-6G: +1.13e-9 and +2.15e-9 on two runs; the density itself
   was fine — its CPU energy was 5e-12 above the CPU minimum). With the stock road the oracle read **1.02e-9 on HBr STO-6G — over the
   bar, a finding**; `--gpu` therefore evaluates the energy afresh at the final density (one full J/K build on the card, inside the
   measured seconds), and the oracle then reads 1e-11.

Memory is not a constraint: the CuPy pool held 109–227 MB on the measured rungs (β-carotene 6-31+G\*, 872 AO, 227 MB); the process's
whole footprint on the card was ≈ 0.6–0.8 GB with the CUDA context. `--gpu-memory 6` caps the pool (set after gpu4pyscf's import, which
claims 90 % of the card); β-carotene fits with room to spare.

The card is SLOWER than the CPU on small molecules: the oracle's 27 rungs of 7–37 AO took 1.4–28.1 s each on the card against
≤ 0.2 s on the CPU (per-cycle overhead of 0.1–0.8 s; d shells cost most). Those molecules hold almost none of the work — in the 950,
the 194 molecules with a ladder cost under 100 (Σ (nAO/100)⁴) carry 0.5 % of it, and the 388 costlier than testosterone carry 88 % —
so `--largest-first` sends the GPU down the queue from the top while the CPU works up from the bottom; they meet once.

## THE ORACLE — the 17 rungs of `basis-ladder-v1.json`, solved with `--gpu` (the final code) into the scratch raw

Every rung went through the solver's real road (minao at STO-3G, then each rung projected from the one below).

| molecule | rung | nAO | C | pinned E (Eh) | GPU E (Eh) | Δ (Eh) | cycles | S min eig |
|---|---|---|---|---|---|---|---|---|
| H2O | sto-6g | 7 | 7×7 | -75.6787605413 | -75.6787605413 | +2.6e-13 | 6 | 3.4e-01 |
| H2O | 3-21g | 13 | 13×13 | -75.5854088948 | -75.5854088948 | +5.7e-14 | 8 | 1.1e-01 |
| H2O | 6-31g | 13 | 13×13 | -75.9839744657 | -75.9839744657 | +1.8e-13 | 7 | 6.8e-02 |
| H2O | 6-31g-star | 19 | 19×19 | -76.0105049953 | -76.0105049953 | +3.8e-13 | 8 | 2.4e-02 |
| NH3 | sto-6g | 8 | 8×8 | -55.9883616369 | -55.9883616369 | +3.4e-13 | 5 | 2.7e-01 |
| NH3 | 3-21g | 15 | 15×15 | -55.8704800857 | -55.8704800857 | +8.5e-14 | 8 | 6.9e-02 |
| NH3 | 6-31g | 15 | 15×15 | -56.1610630116 | -56.1610630116 | +1.7e-13 | 8 | 4.0e-02 |
| NH3 | 6-31g-star | 21 | 21×21 | -56.1841276646 | -56.1841276646 | +4.4e-13 | 8 | 2.3e-02 |
| HCl | sto-6g | 10 | 10×10 | -458.5455850843 | -458.5455850843 | +1.0e-12 | 4 | 3.6e-01 |
| HCl | 3-21g | 15 | 15×15 | -457.8692319870 | -457.8692319870 | +0.0e+00 | 7 | 6.4e-02 |
| HCl | 6-31g | 15 | 15×15 | -460.0369206123 | -460.0369206123 | +1.1e-13 | 6 | 5.6e-02 |
| HCl | 6-31g-star | 21 | 21×21 | -460.0599298760 | -460.0599298760 | +4.5e-13 | 8 | 2.5e-02 |
| HCl | 6-31+g-star | 25 | 25×25 | -460.0609812612 | -460.0609812612 | -5.1e-13 | 7 | 2.5e-02 |
| HBr | sto-6g | 20 | 20×20 | -2560.2777696956 | -2560.2777696956 | +1.2e-11 | 5 | 8.5e-07 |
| HBr | 6-31g-star | 37 | 37×37 | -2572.6843980049 | -2572.6843980049 | +0.0e+00 | 8 | 9.3e-04 |
| ZnH2 | 3-21g | 33 | 33×33 | -1770.2439769575 | -1770.2439769575 | -2.0e-12 | 9 | 7.7e-03 |
| ZnH2 | 6-31g | 33 | 33×33 | -1778.6020893113 | -1778.6020893113 | +1.8e-12 | 8 | 1.4e-03 |

**Worst |Δ| = 1.2e-11 Eh** (HBr STO-6G; an earlier run of the same code read 2.5e-12 worst and −1.8e-12 there — the card's reductions
are not bit-reproducible run to run, at the 1e-11 level). The same scratch run on the CPU path (`solve.py` without `--gpu`, after the
edit) read 1.3e-11 worst: the CPU path is unchanged, and `tests/basis-ladder.test.mjs` is green in `./test.sh node`.

## THE MEASURE — the big rungs against the pilot's CPU seconds

The scratch raw was seeded with the CPU's own lower rungs (copied from `raw/`, read-only), so each GPU rung started from the same
projected guess as the CPU's (6-31G\* from the CPU's 6-31G; 6-31+G\* from the GPU's own 6-31G\*; β-carotene's 6-31+G\* from the CPU's
6-31G\*). CPU = the pilot (V1-BUILD.md, 10 threads, direct SCF, the machine shared). GPU = `--gpu --threads 2`, measured 2026-10-17
16:43–16:58 while THE LONG SOLVE held 8 CPU threads (load 12–18 on 12) — the card's host side ran niced under that load, so these GPU
seconds are if anything pessimistic. Seconds are the rung's wall clock including the fresh energy evaluation.

| molecule | rung | nAO | CPU s | GPU s | cycles (CPU · GPU) | speed-up | pool MB | E_GPU − E_CPU (Eh) | max \|S½ ΔD S½\| |
|---|---|---|---|---|---|---|---|---|---|
| testosterone | 6-31G\* | 371 | 128.9 | 66.9 | 14 · 14 | 1.93× | 110 | −3.0e-11 | 1.2e-07 |
| testosterone | 6-31+G\* | 455 | 321.5 | 124.7 | 12 · 12 | 2.58× | 120 | −9.0e-11 | 8.8e-08 |
| capsaicin | 6-31G\* | 384 | 90.0 | 54.0 | 14 · 14 | 1.67× | 109 | −5.8e-11 | 7.9e-08 |
| capsaicin | 6-31+G\* | 472 | 244.8 | 98.8 | 13 · 13 | 2.48× | 120 | −5.0e-12 | 5.7e-08 |
| cholesterol | 6-31G\* | 512 | 201.2 | 89.7 | 12 · 12 | 2.24× | 129 | −1.3e-10 | 6.5e-08 |
| cholesterol | 6-31+G\* | 624 | 573.2 | 208.9 | 11 · 11 | 2.74× | 136 | −2.6e-10 | 7.6e-08 |
| β-carotene | 6-31+G\* | 872 | 869.9 | 250.2 | 12 · 12 | 3.48× | 227 | −7.2e-09 | 2.1e-07 |

The densities agree to the convergence threshold in the orthonormal metric (≤ 2e-7; in the raw AO basis the diffuse rungs differ by up
to 3e-2 along near-null directions of S, which carry no energy). Same cycle counts everywhere.

**THE NUMBER: 2.24× (geometric mean of the six ratios), range 1.67–2.74×.** The speed-up grows with the basis (6-31G\* 1.7–2.2×,
6-31+G\* 2.5–2.7×, 872 AO 3.5×). The RTX 3070's FP64 rate is 1/64 of its FP32 (≈ 0.3 TFLOP/s), about what the 5600G's six cores give,
so a 2–3× gain is the card's integral kernels and memory bandwidth, not its arithmetic; no mixed-precision mode was tried (it could not
keep 1e-9).

**β-carotene's −7.2e-9 is a finding, not a GPU error — it is the double-precision floor of that basis.** One density (the GPU's),
evaluated by both codes at several J/K screening thresholds (`direct_scf_tol`, default 1e-13):

| J/K evaluation | energy (Eh) |
|---|---|
| GPU, 1e-13 (what `--gpu` stores) | −1547.2079883355 |
| GPU, 1e-15 / 1e-17 | −1547.2079883327 / −1547.2079883327 |
| CPU, 1e-13 (what THE LONG SOLVE stores) | −1547.2079883280 |
| CPU, 1e-16 | −1547.2079883303 |

β-carotene 6-31+G\* has S's smallest eigenvalue 4.2e-8 and density-matrix elements up to 93 in the AO basis; screening and summation
error at that size moves the energy by a few nEh in either code, and the two disagree by 2.5e-9 even unscreened. The six drug-size rungs
agree to ≤ 2.6e-10 and the oracle to 1e-11. A 1e-9 bar on the largest diffuse rungs would need a higher-precision referee than either
code; the tightened screening was NOT adopted (it does not reach agreement either, and the CPU solve already running uses 1e-13).

## THE DAYS

From the brief's measured CPU baselines (85 h for the 950, ≈ 28 days for the 7,534; THE LONG SOLVE's own STATUS.json ETA read 98.5 h
remaining at 16:24 with 236 done, 106.7 h at 17:00 with 245 — the costly end is still ahead, so 85 h is the optimistic baseline). Both
together = the throughputs added, T / (1 + s), which holds with `--largest-first` because the card's slow end (the small molecules) is
0.5 % of the work and the CPU takes it.

| | CPU alone | GPU alone (2.24×; range) | both together (range) |
|---|---|---|---|
| the 950 | 85 h | **37.9 h** (31.0–51.0 h) | **26.2 h** (22.7–31.9 h) |
| the 7,534 | ≈ 28 days | **12.5 days** (10.2–16.8) | **8.6 days** (7.5–10.5) |

Not measured: the lower rungs (STO-3G … 6-31G) on the card at drug size; they are ≈ 13 % of a drug-size molecule's CPU time
(testosterone: 67 s of 518 s), and the card's speed-up on them is likely below 2.24×. The GPU process takes about one CPU core of host
work from the CPU solver.

## Start and stop (Josh or the integrator — NOT started by the builder)

From the integration checkout, once this branch is merged (the script runs `tools/volumes/solve.py` of the checkout it sits in):

```
cd /home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/optimization-2026-09-24
tools/volumes/long-run-gpu.sh start     # nohup nice -n 19 … solve.py --candidates ~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.candidates.json
                                         #   --gpu --gpu-memory 6 --largest-first --threads 2 --max-memory 6000  >> raw/solve-gpu.out
                                         #   pid → ~/Documents/LAMBDAWAVES-VOLUMES/raw/solver-gpu.pid
tools/volumes/long-run-gpu.sh status    # running or not; STATUS.json's counts; the last GPU lines of raw/solve.log
tools/volumes/long-run-gpu.sh stop      # kill -TERM "$(cat ~/Documents/LAMBDAWAVES-VOLUMES/raw/solver-gpu.pid)" — never pkill
```

The CPU solver keeps running as it is (`raw/solver.pid`); the two share the queue through the per-molecule flock. Stopping either is
SIGTERM by its own pid; the rung in flight is not written and the molecule resumes at its next rung, by either solver. Watch
`raw/STATUS.json` and `raw/solve.log` (GPU lines end in ` GPU`). The packer needs nothing new.

## Scratch

`~/Documents/LAMBDAWAVES-VOLUMES/raw-gpu-scratch/` (31 MB) is KEPT and named here: the oracle's five molecules (every rung, `--gpu`) and
the measure's four (the CPU's lower rungs copied in, the GPU's big rungs beside them). Delete it at will; nothing reads it.
The one-time scripts that made the tables (`.tmp/g/`: oracle.py, measure.py, seed.py, diag*.py) are not committed.
