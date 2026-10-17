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

## P4 · DISORDER (`it005-disorder`, from A's merge) — brief `P4-BRIEF.md`
Sol's top new playable system on `lab/lattice-model.js` / `lab/lattice.js` (HOFSTADTER · QUANTUM WALK · SPIN CHAIN already): a DISORDER knob W
adds seeded random on-site energies (the seed PROJECT) to the finite lattice Hamiltonian; its eigenvectors are the register's φ_k with exact
phases e^{−iE_k t}, so nothing is integrated per frame; the IPR readout Σ|ψ|⁴ beside its two limits 1/N and 1; in 1-D the localisation length
ξ from the fit of log|ψ_k| against the weak-disorder formula ξ ≈ 24(4 − E²)/W² (Thouless), printed not gated; the finite lattice says it is
finite. ANGULAR NODES (the zero sets of real Y_lm on the sphere in VORTEX) is the small sibling if the row has room.

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

## Not in this iteration (recorded)
RHF/6-31G* optimised geometries, a KS-B3LYP method per rung, TDA excitations per rung (affordable after G); wavefunction import (Sol's #4);
f16 C or a frontier window of virtuals; the catalogue's full run (PubChem 503; the geometry-keeping decision is Josh's); the eight tags; the
F-BUILD.md calls; the two pre-existing browser reds; Laughlin, the spin-one chain, the free-packet synthesizer (Sol's longer directions).
