# λWAVES 0.4.0 · S0 MEASURE — BRIEF for the measurements probe

**Written by Fable, 2026-10-07.** Three one-line numbers that size later stages (`PLAN.md` §3 B0 "Three one-line
measurements", §4 F5, §9 R-L2). You never edit `lab/`; every script lives in `tools/perf/`; every result in
`research/release-0.4.0/measure/`. The tree builder (`BRIEF-S0.md`) works beside you on the same start commit; your
files are disjoint from theirs.

## 0 · Laws

- No `lab/` edit of any kind. Diagnostics live in `tools/`. Never `pkill -f`; kill by pid. Git only inside your
  worktree; never push.
- The RTX 3070 is shared: one browser at a time; `pgrep -a firefox` / `pgrep -a chrom` before you time anything and note
  the load; a surprising number is re-run once alone before it is believed (the card has a one-ulp fault in power state
  P5 — see memory; timings are not bit-exact, so report the median of ≥ 5 runs with the spread).
- Your ports: `LW_PORT=8735`, `GD_PORT=5205`. Gate server: `python3 tools/gate/server.py <your-root> 8735 &` (serves
  the whole root, so a page under `tools/perf/` is reachable at `https://127.0.0.1:8735/tools/perf/<file>.html`).
- One light pass: the number, its method, its spread. No gates beyond `node tests/wiring.test.mjs` if you touched a
  file the wiring suite scans (you should not).

## 1 · `maxComputeWorkgroupStorageSize` (and its neighbours)

The 64-AO wall is the workgroup χ tile: `lab/field.js:177-184` declares `var<workgroup> chiW: array<f32, cap*64>` with
`cap = 64` → 16 KiB, exactly WebGPU's default `maxComputeWorkgroupStorageSize`. S4c's cap-128 tier needs the adapter's
real limit (≥ 32 KiB) or a workgroup of 32. Measure on the 3070:
- **Chromium** (playwright `chromium-1243` headless, the flags `tools/perf/probe-chromium.mjs` uses; and `/snap/bin/chromium`
  if it differs) and **Firefox** (`/usr/bin/firefox`, the way `tools/perf/bench-firefox.mjs` launches it with WebGPU on).
- Report `limits.maxComputeWorkgroupStorageSize`, `maxComputeInvocationsPerWorkgroup`, `maxComputeWorkgroupSizeX/Y/Z`,
  `maxStorageBufferBindingSize`, `maxBufferSize`, `maxComputeWorkgroupsPerDimension`, and whether
  `requestDevice({ requiredLimits: { maxComputeWorkgroupStorageSize: 32768 } })` succeeds. Also the adapter's
  `info`/`description` string per browser.
- **The M5 (Josh's iPad) is pending**: write the ONE line Josh pastes into Safari's console (or a tiny page under
  `tools/perf/limits.html` he can open from his LAN server) and the row it fills. Mark it "M5 pending" in the table.

Script: `tools/perf/gpu-limits.mjs` (node, drives both browsers, prints a table and writes
`research/release-0.4.0/measure/limits.json`).

## 2 · The benzene re-time, ground + spectrum, node and browser

The 1.0 s probe (`research/molecular-orbitals-2026-10-01/names-probe.mjs`, `PROBE.md`) timed the GROUND solve only; the
cost model (`lab/molecules.js` ~370–448, `predictMs`, `CAP_MS`) covers the response too, so "stale" is unmeasured and S4
sizes the library on this number.
- **Node**: `tools/perf/benzene-retime.mjs` — the way `names-probe.mjs` drives the live solver (`moleculeRHF` from
  `lab/rhf-molecule.js` with the arguments `lab/mathworker.js` `ensureSolve` passes; the STO-3G record from
  `lab/vendor/bse/sto-3g-v1.json`), then the spectrum stage exactly as the worker's `chem.spectrum` op computes it
  (`mathworker.js` ~139, ~178, ~233: the RPA roots and the TDA ladder — `rpa` from `rpa-inspector.js`). Molecules:
  water, N₂, benzene (and one 6-31+G* row if benzene is enabled in it; `molecules.js:463` says the cap). Per molecule: nAO,
  integrals ms, SCF ms, RPA ms, TDA ms, the total; the model's `predictedMs` beside it.
- **Browser**: the real worker path on your gate server — boot the app headless (see how `tests/chem.browser-test.mjs`
  turns MOLECULES on and picks a molecule), read the worker's `timings` (`mathworker.js` ~233 returns
  `{ integrals, scf, rpa }`) or time the status line's transitions; ground and then the spectrum. Firefox is the gate's
  browser; Chromium too if cheap.
- Report: one table, node vs browser vs predicted; and the one sentence S4 needs — "a 36-AO ground solve takes X s, the
  spectrum Y s, on the 3070's host; the model is off by Z×".

## 3 · One 300-AO orbital-only dispatch (F5's road to C₆₀)

C₆₀ in STO-3G is 60 × 5 = 300 AO. Density is O(nAO²) per voxel and needs the χ tile; a SINGLE ORBITAL
ψ = Σᵢ cᵢ χᵢ is O(nAO) per voxel and needs no tile. The question R-L2 asks: does one 300-AO orbital-only dispatch at 96³
fit the frame on the 3070?
- Write a standalone WGSL compute (`tools/perf/orbital-dispatch.html` + `tools/perf/orbital-dispatch.mjs` to drive it
  headless): mirror the field's shell evaluation (read the MOLECULE WGSL in `lab/field.js` from ~170 — the `Shell`
  struct, `shells/alphas/wts`, how a contracted Gaussian and its angular part are evaluated per voxel) but with ONE
  coefficient per AO and no workgroup tile, writing ψ into a 96³ `rgba16float` storage texture (or an f32 buffer).
  Synthetic inputs: 60 centres on a C₆₀-like shell (radius 6.7 bohr), each 1s + 2s + 2p (STO-3G-like exponents are fine),
  random normalized coefficients. Measure at nAO = 36, 128, 300 (and 600 for the slope): wall-clock around
  `queue.onSubmittedWorkDone()` over ≥ 10 dispatches after a warm-up, GPU timestamp queries if the adapter has
  `timestamp-query`. Chromium and Firefox.
- Report the ms per dispatch and the ratio to benzene's measured density dispatch (2.80 ms at 96³ on this card,
  `field.js:181`). Fable judges it against the governor's tier; you report the number and the slope.

## 4 · Deliverable

`research/release-0.4.0/measure/MEASURE.md` — three sections, each: the method in five lines, the table, the spread, the
one sentence the plan needs — plus the raw JSON beside it. Commit on your worktree's branch (scripts + results; nothing
else). Final message: the three sentences and the file path. Kill your gate server by pid.

## 5 · Harness notes

Compound shell with variables, loops, heredocs or backticks is refused: plain separate commands; scripts as files. If a
command is refused, reshape it. Commit as you go.
