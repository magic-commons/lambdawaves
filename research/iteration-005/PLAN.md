# Iteration 005 — THE PHYSICS (Josh 2026-10-17: "All in all, I want more physics than more content")

Base: `yan-c` at `482c22f` (iteration 004 closed). No push, no deploy, no store submission. Never edit `lab/mir/**` or `lab/fonts/**`.
Josh's dial stands: build the features, no new test files, existing gates, one light check per row; one-time oracle numbers go in the
build note. Data lives in `~/Documents/LAMBDAWAVES-VOLUMES/` (never in git); THE LONG SOLVE over `catalogue/vol-1.candidates.json` (950
molecules) runs there on the CPU since 10-17 15:23 (`raw/solver.pid`, a flock queue any second solver may join).

Sources: Sol-6's body of work in `~/Documents/OBSIDIAN/LAMB of WAVES/` — `for CODEX/PRACTICAL UPGRADE SYNTHESIS — 2026-10-11.md` (the
engine seams: direct packet FLOW first, shared positive factors, runtime error budgets, wavefunction import later), the fifty proof rounds
(error contracts from samples to observables; read-only, classical rederivations), `SOL-6 LAMB of WAVES.md` (Anderson localisation as the
top new playable system; angular nodal sets as the best small one), and `PUBLICATIONS & DRAFTING/DRAFTS/CLAUDE COLLECTION REVIEW —
2026-10-12/DECISION MEMO.md` §4 (what the papers could not show: native error fields for the display grid, a many-electron continuity record,
a native current). Prior-art is theirs and is cited; nothing here is called novel.

## Josh's asks → rows
| ask (10-17) | row |
|---|---|
| the precache is 3.3 kB under its 8 MiB ceiling — no lab row can land until something leaves it; an installed volume lacks its basis files offline | **A THE ROOM** (first) |
| "what if the RTX 3070 runs for 24 hours straight" — the GPU as a second solver on the same queue, its speed-up MEASURED | **G THE GPU SOLVER** |
| "more physics than more content": Sol's engine seams and the papers' open evidence, made live in the instrument | **P1 · P2 · P3 · P4** |
| themed volumes, one archive per volume for Google Drive after a donation, OPEN FILE… in the Picker | **S THE SHELF** (last; content) |

## A · THE ROOM (`it005-room`, lab) — brief `A-BRIEF.md`
The demo covers (216 KB) and the Picker's thumbnail set (720 KB) become DATA by the library's rule (sw.js DATA roots, cache-first from
`lw-data-v1`, stored by the page after its first fetch, never precached); `V.install` stores the four ladder basis files beside a volume.
Headroom 3.3 kB → ≈ 0.9 MiB. FIRST: every other lab row branches from A's merge.

## G · THE GPU SOLVER (`it005-gpu`, tools only) — brief `G-BRIEF.md`
`gpu4pyscf` in the venv; `solve.py --gpu` runs the same ladder on the RTX 3070 (every AO kept, the projected guess, the same convergence
ladder or a documented CPU fallback per step), writes the same npz, joins the same flock queue. THE ORACLE: the 17 rungs of
`tests/fixtures/oracles/basis-ladder-v1.json` on the GPU agree with the pinned energies to ≤ 1e-9 Eh (the actual Δ recorded). THE MEASURE:
testosterone · capsaicin · cholesterol at 6-31G* and 6-31+G* against the pilot's CPU seconds (`V1-BUILD.md`) — ONE number for Josh, the
speed-up, and the days for the 950 and the 7,534. If the wheels cannot run on driver 595, the row closes with the exact error.

## P1 · THE DIRECT PACKET (`it005-packet`, from A's merge) — brief `P1-BRIEF.md`
Sol's first deliverable. For the MO-REGISTRY's rank-one complex packet, ρ = |ψ|² and j = Im(ψ̄ ∇ψ) straight from the AO vector and
`molecular-field.js`' analytic gradients — O(n) coefficient contractions per point — instead of `orbitalsview.js`' Re/Im n×n expansion and
`molecular-flow.js`' dense contraction. The dense road stays as the one-time oracle in the build note (equality to 1e-12 over declared
coefficients and points; a real orbital's zero current; a winding pair's current reversed under conjugation; global-phase invariance; the
TDHF/FLOW transpose seam covered once). Payoff: FLOW for a packet of ANY size — a volume molecule's HOMO/LUMO packet (263 AOs) flows, where
the dense road stops at the cap. PROJECT and the picture unchanged.

## P2 · THE FACTOR CURRENT AND THE CONTINUITY RECORD (`it005-factor`, from P1's merge) — brief `P2-BRIEF.md`
The same form for a kicked (RT-TDHF) state: ρ = Σ_occ |φ_a|², j = Σ_occ Im(φ̄_a ∇φ_a) from the propagated occupied columns — one evaluator
for the packet (one factor) and the Slater state (nocc factors). The papers' open record made a live number: a CONTINUITY tile in CALCULUS
for a molecule — ‖∂ρ/∂t + ∇·j‖ against ‖∂ρ/∂t‖ on PLANE's own sample (the finite-basis defect, visible, as Sol asks; the app's benzene
STO-3G number is the one-time check). FLOW trails fade where the density is below the assessed floor (P3's), not at a fixed 1e-7.

## P3 · THE ERROR FIELD (`it005-error`, from A's merge) — brief `P3-BRIEF.md`
What the papers could not show, live: for hydrogen (exact `psiAt`), the oscillator and SEPARABLE (closed forms), the display grid's ρ̂
(the f16 texture read back, as `tests/helpers/field-law.mjs` already does) against the exact ρ at the voxel centres — RMS and worst, relative
to ρ_max, for the GRID in force — as a METERS tile GRID ERROR, computed on a press or a GRID change, never in a frame; the one-sided truncation
law (ρ̂ ≤ ρ) printed as measured on this device. For a molecule: ρ̂ against the CPU double evaluation at a 4 × 4 × 4 probe of voxel centres.
Josh sees the number the field law certifies at every cut.

## P4 · THE MOBILITY EDGE (`it005-disorder`, from A's merge) — brief `P4-BRIEF.md`
Sol's top new playable system — and the plan's first draft had it wrong: ANDERSON is already a LATTICE preset (0.7.2 L1: W, seed, the IPR, the
1-D closed line ξ(0) ≈ 105 J²/W²). What does not exist is the dimension where the transition lives: ANDERSON gains d = 1 · 2 · 3 (the cube up to
6³ = 216 sites under the 256-site cap), THE LEVEL-SPACING RATIO ⟨r⟩ beside its GOE (0.5307) and Poisson (0.3863) limits, the band-centre IPR × N,
seed averaging as a knob, and the closed line naming W_c ≈ 16.5 J in 3-D (Slevin–Ohtsuki) with "finite: 6³ sites" said. One-time check: ⟨r⟩ on
the two sides of 0.46 at W = 4 and W = 30; the 1-D fitted ξ against 105/W². ANGULAR NODES (the zero sets of real Y_lm on the sphere in VORTEX)
is the small sibling if the row has room.

## S · THE SHELF (`it005-shelf`, last; from the physics merges) — brief `S-BRIEF.md`
THEMES: `tools/volumes/themes.json` (ordered: I THE CLASSICS · II MEDICINE · III LIFE AND FOOD · IV MATERIALS, ATMOSPHERE AND FUEL · V THE REST;
first match wins; a theme past 5 GB continues as "· 2"). THE ARCHIVE: `pack.mjs --archive` → one `LAMBDAWAVES-VOL-<numeral>.lwv` per volume
(`'LWV1'` · a JSON index `[{ path, offset, length, sha256 }]` · the files 8-aligned) for Google Drive after a donation (Josh's link and page,
never in the app). THE SHELF `volumes.json` same-origin and small (title · count · bytes · `archive: { name, bytes, sha256 }`; `index` only where
fetchable). THE FILE ROAD: `installFile(volId, file)` — `File.slice` per entry, every sha-256 checked, the same cache keys as the fetch road,
resumable, `navigator.storage.estimate()` first (a 5 GB install is refused with a sentence on a device that cannot hold it); the Picker's card
shows OPEN FILE… and takes a drop. `docs/VOLUMES-HOSTING.md`: Josh's road and the quota table.

## Order
A ∥ G → P1 ∥ P3 ∥ P4 (from A's merge) → P2 (from P1's merge) → S. Each merge: pwa --write, `./test.sh node` 0, rack-deps 0, new-project in step,
the lab count printed; THE LOCK ×2 at any merge that touches `lab/field.js` (P3 may). No cut: the iterative round is commits and this plan.

## Closed (Claude Yan, 2026-10-17 18:20 — the integration; seven rows in one afternoon)
| row | branch · tip | merge | lab Δ | the number |
|---|---|---|---|---|
| A THE ROOM | `it005-room` `1893f60` | `a0a3fb3` | +29 (−153 precache rows) | precache 8.00 → 7.30 MiB |
| G THE GPU SOLVER | `it005-gpu` `47f2eab` | `1ce972e` | 0 | **2.24×** (1.67–2.74; β-carotene 3.48×); oracle worst 1.2e-11 Eh |
| P1 THE DIRECT PACKET | `it005-packet` `b195baf` | `70e073c` | +3 | aspirin FLOW 1.2 → 13.8 presents/s; 441 → 19 µs/pt |
| P4 THE MOBILITY EDGE | `it005-disorder` `b618a78` | `b184f4d` | +12 | ⟨r⟩ 0.551 (W 2) → 0.408 (W 30); crosses 0.46 between 16.5 and 20 at L = 6 |
| P3 THE ERROR FIELD | `it005-error` `83f8112` | `0cfc275` | +98 | the field-law numbers live, digit for digit; THE LOCK ×2 0/0 |
| P2 THE FACTOR CURRENT + CONTINUITY | `it005-factor` `fa36b31` | `a33fce9` | +93 | benzene continuity 0.6–1.3 (plane) vs 0.6–1.25 (grid); factors to 1.3e-11 |
| S THE SHELF | `it005-shelf` `866bcb6` | `7e7e68b` | +97 | VOL. II archive 17.6 MB opened from a file in 4.1 s |

Lab lines 31,474 → 31,653. Gates at every merge: pwa, `./test.sh node` 0 (wigner W42-8, a 150 ms timing row, flaked under the two solvers' load
16.7 and passed alone), rack-deps 0, new-project in step; THE LOCK ×2 at P3's merge. Build notes beside this file. THE GPU SOLVER runs on the
shared queue since 17:55 (`tools/volumes/long-run-gpu.sh status | stop`) beside THE LONG SOLVE (CPU).

**Left for #006 (recorded, not built):** STATES' FLOW still rides n² matrices (a TD-CIS pair density is not a positive factor set — its own row);
analytic ∂ρ/∂t and ∇·j for the continuity tile; P3's measured error is not wired into the tracer floor (P2-BUILD.md decision 5 — Josh's call:
the picture's f16 error is not the error of the f64 ρ the tracers read); the `lattice` verb takes only preset and N; 128³ in the GRID ERROR
table; the themes' first-match rule sends 857 of the 950 to MEDICINE (reorder, or wait for the full catalogue); Josh's real dist not yet themed;
the catalogue's full run (PubChem 503) and the geometry-keeping decision; the ResizeObserver page errors (pre-existing, the `history` red) now
also redden field-law's F4/V2 — one fix would clear three reds; the two solvers' finish: pack vol-1 and the themes when STATUS reads remaining 0.

## Not in this iteration (recorded)
RHF/6-31G* optimised geometries, a KS-B3LYP method per rung, TDA excitations per rung (affordable after G); wavefunction import (Sol's #4);
f16 C or a frontier window of virtuals; the catalogue's full run (PubChem 503; the geometry-keeping decision is Josh's); the eight tags; the
F-BUILD.md calls; the two pre-existing browser reds; Laughlin, the spin-one chain, the free-packet synthesizer (Sol's longer directions).
