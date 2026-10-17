# Iteration 005 · P3 — THE ERROR FIELD (build note)

Branch `it005-error` from `a0a3fb3` (A THE ROOM merged). Built by Opus 5.5, 2026-10-17. Gate server 9621/5721 (mine, stopped by pid).
Lab lines **31,350 → 31,448 (+98)**: field.js +63, meters.js +22, readouts.js +13; sw.js is the pwa rewrite (2 hashes).

## The seats

| what | where |
|---|---|
| `errorField(psi?, { t })` — ONE readback (`readGrid`'s road, the one `tests/field-law.browser-test.mjs` reads), every voxel centre against the exact twin in f64; a molecule against the matrix the field drew, on a 4 × 4 × 4 probe | `lab/field.js`, beside `readGrid`; `toF16` beside `f16` (the test helper's function: `tests/` is not served) |
| the twin: a molecule → field.js' own matrix; else the register at the field's own t (`stats.fieldT`) through `getHamiltonian().psiAt` (`phiAt` in momentum space; the W-STURMIAN records as `cpuPsi` reads them), captured in the task that submits the copy; settled two frames first | `lab/windows/readouts.js` `gridError()`, handed to `createMeters` |
| FLOOR · GRID ERROR — the tile: a press (click / Enter / Space, the STATUS tile's road), and a re-measure when the grid in force changes while METERS presents | `lab/meters.js` |
| `__LW.field.errorField` | `__LW.field` IS the field object, so the member comes with it |

`errorField` returns `{ N, half, t, metric: 'psi' | 'rho', rms, p998, worst, relToMax, mode, rhoMax, ms, readMs, voxels, probe, ledger
{ disc, rtz, rne }, above, aboveF32, deficit, generation }` (+ `normal`, `kind` for a molecule) in the FIELD LAW's own metrics: ψ —
|Δψ| RMS · the 99.8 % quantile · the worst voxel · worst / max|ψ|; ρ — |Δρ|/ρ over the f16-normal √ρ (RMS · 99.8 % · worst). `mode` is the
test's ledger (of the components where toward-zero and to-nearest disagree, which the store matched; `unread` when none disagree). `above`
counts voxels whose stored ρ exceeds the exact ρ (`aboveF32` those past 4e-6 relative, the kernel's f32); `deficit` is the largest
(ρ − ρ̂)/ρ where every stored component is f16-normal or zero — the one-sided law's domain. Stand-downs, as `{ why }`: a card owns the volume;
Δρ / signed (formed against a reference); the BEAT EQUALIZER's mixed picture; the AXIAL GAS (readouts.js); no WebGPU device. The ψ loop yields
to the page every 12 ms, so the stage keeps its frames during a 128³ read.

The tile: value = the live reading; sub line 1 = what it says (relative worst · rounding mode · the one-sided law · time; a molecule: its
f16-normal count, or "the frame it caught (t …)" while a kicked density plays); sub line 2 = `CERTIFIED 0b0a8f6 · 1 f16 ulp · ψ 3e-6 RMS,
2e-4 worst · ρ 2e-3` (status.js' constants, P7c's commit). The hover carries the rest (voxels, 99.8 %, the ledger's counts, the deficit
against 2·2⁻¹⁰, t, readback ms). Screenshot: `research/iteration-005/P3-meters.png` (91 KB, METERS at 96³ after the GRID re-measure).

## The measured table (RTX 3070, Firefox 157, this branch, paused at t = 3.70; the card busy with the other builders)

| state | grid | RMS | 99.8 % | worst | worst / max | mode (ledger) | stored ρ ≤ exact ρ | deficit (normal) | total |
|---|---|---|---|---|---|---|---|---|---|
| hydrogen 1s+2pz, \|Δψ\| | 64³ | 2.3436e-6 | 1.8763e-5 | 1.6795e-4 | 6.4179e-4 of max\|ψ\| | toward zero (261,700 / 96 of 261,796) | all 262,144 | 1.84e-3 | 0.42–0.50 s |
| hydrogen 1s+2pz, \|Δψ\| | 96³ | 2.2746e-6 | 1.7766e-5 | 1.2937e-4 | 4.2989e-4 | toward zero (877,696 / 508 of 878,204) | all but 2 (within f32) | 1.91e-3 | 1.2–1.5 s |
| oscillator 1s+2pz labels, \|Δψ\| | 64³ | 1.1e-5 | 1.2e-4 | 2.6e-4 | 5.9e-4 | toward zero (147,768 / 0 of 147,768) | all 262,144 | 1.9e-3 | 0.35 s |
| oscillator 1s+2pz labels, \|Δψ\| | 96³ | 1.1e-5 | 1.2e-4 | 2.6e-4 | 5.9e-4 | toward zero (501,173 / 87 of 501,260) | all but 3 (within f32) | 1.9e-3 | 1.1–1.2 s |
| H₂O STO-3G density, \|Δρ\|/ρ, PROBE 64 | 64³ | 6.94e-4 | 1.28e-3 | 1.28e-3 | — (30 of 64 voxels f16-normal) | toward zero (31 / 0 of 31) | all 64 | 1.28e-3 | 45–65 ms |

(The oscillator rows are the tile's two-digit print; hydrogen's are `__LW.field.errorField(__LW.cpuPsi)` in full.)

**The tile and the field-law gate agree to the digit** for the same state and grid: `node tests/field-law.browser-test.mjs` read hydrogen
1s+2pz at 64³, t 3.7: RMS 2.34e-6 · 99.8 % 1.88e-5 · worst 1.68e-4 · worst/max 6.42e-4, ledger 261,796 / 261,700 / 96 — errorField read
RMS 0.0000023435583590324703 (the gate's own printed float, every digit), worst 0.0001679544723745654, relToMax 6.417933030937553e-4 (the gate
…554, one ulp of the division). Water: the gate's whole grid reads |Δρ|/ρ RMS 8.31e-4 · worst 1.94e-3 over 116,736 voxels; the probe's 64
centres read 6.9e-4 · 1.3e-3 — a sample of it, as it should be.

**The rounding mode: toward zero**, on every state and grid (the only to-nearest matches are the ≤ 0.06 % of components whose kernel f32
value sits on the other side — the law's 46-of-a-million). **The one-sided law ρ̂ ≤ ρ holds as measured**: 0 voxels above at 64³; at 96³
2 (hydrogen) and 3 (oscillator) above, all inside the kernel's f32 (4e-6 relative); the largest deficit where the components are f16-normal
is 1.84e-3 (64³) and 1.91e-3 (96³) — under 2·2⁻¹⁰ = 1.95e-3, the memo's bound. Counted over every f16-normal √ρ instead, the deficit reads
2.36e-3 at 64³ (2.52e-3 at 96³): the voxel holds Im ψ = −2.8e-5, a SUBNORMAL f16 whose ulp is 2⁻²⁴ absolute (a throwaway in-page check split
the two: 2.358e-3 over all, 1.843e-3 with both components normal). So `deficit` is computed on the law's domain and says so.

**The readback** (`readGrid`: one copy, one map) takes 25–108 ms at 64³ and 50–96 ms at 96³ on this rig — Firefox resolves `mapAsync` on its
~100 ms completion tick, so the spread is the tick, not the bytes. The rest of a total is the CPU closed form at every voxel (≈ 0.4 s at 64³,
≈ 1.2 s at 96³ for a two-mode state; it scales with N³ × the rendered modes). A molecule's probe is 64 AO evaluations: ~10 ms past the readback.

The molecule's twin is the f32 matrix the GPU drew, evaluated in f64; against the CPU solve's f64 D on the same 64 probe points the
difference is 1.26e-8 relative — five orders under the f16 floor, and it is what makes a kicked density "the frame it caught".

## Checks

- `node tests/pwa.test.mjs --write` · `./test.sh node` **0** (one earlier run read wigner W42-8 at 156 ms > 150 under the shared CPU; alone it
  read 138 ms, GREEN, and the final run was 0) · `node tools/rack-deps.mjs --classes --no-write` **0** (readouts fwd + shared 14; THE HINGE
  holds, spectrum 25) · `node tools/new-project.mjs --check` in step (16117 B).
- **THE LOCK, ×2 on the final tree**: `--check --query gastab=0` → GREEN, 860 values, 0 readback / 0 record-byte differences; with
  `--fixture research/release-0.4.0/measure/digest-lock-s4a.json` → GREEN, 1004 values, 0 / 0. (Also run twice mid-build, both GREEN.)
  Both print "page errors 8": the same 8 at the base `a0a3fb3` (run there, 860 GREEN · page errors 8) — not this row's.
- `tests/field-law.browser-test.mjs` once: F0–F3, F5, V1 GREEN; **F4 and V2 RED on two "ResizeObserver loop completed with undelivered
  notifications" page errors — the same two, the same lines, at the base `a0a3fb3`** (I ran it there); every reading inside FIELD_LAW.
- `tests/lw-facade.browser-test.mjs` (check, not `--write`): GREEN, 178 members — **no diff**, see below.
- The light check (`.tmp/p3-check.mjs`, throwaway, Firefox, the hand's road): 1s+2pz at 64³ MEASURE → `MEASURED 64³ · RMS 2.3e-6 · worst
  1.7e-4` / `6.4e-4 of max|ψ| · toward zero · ρ ≤ exact everywhere · 490 ms`; GRID → 96³, the tile re-measured by itself → `MEASURED 96³ ·
  RMS 2.3e-6 · worst 1.3e-4` / `4.3e-4 of max|ψ| · toward zero · ρ > exact at 2 (within f32) · 1.5 s`; OSCILLATOR at 96³ then GRID → 64³
  (re-measured); MOLECULES › H₂O MEASURE → `PROBE 64 · 64³ · |Δρ|/ρ RMS 6.9e-4 · worst 1.3e-3` / `30 f16-normal · toward zero · ρ ≤ exact
  everywhere · 45 ms`. Every sub's second line: `CERTIFIED 0b0a8f6 · 1 f16 ulp · ψ 3e-6 RMS, 2e-4 worst · ρ 2e-3`.

## What the brief got wrong, and how I decided

1. **`__LW.field` gains `errorField` → re-capture the facade pin.** `__LW.field` is the field object, pinned as ONE value; its members are not
   in `lw-facade.json`. Adding `errorField` to field.js' `out` puts it on `__LW.field` with no facade change, so the fixture is not
   re-captured (the check reads 178 members, green). A top-level `__LW.gridError` would have been a second name for the same thing.
2. **"the digest's road" / `fieldDigest`.** The road the field-law gate reads is `readGrid` (one copy of the texels and the presenter's ρmax,
   one map); errorField calls it, so the readback is literally the gate's.
3. **"the kit's readout takes a click".** It does not (`readout()` has no handler). The tile takes the STATUS tile's road — a click listener on
   the root — plus role, tabindex and Enter/Space. One control, no window.
4. **The molecule against "molecular-field.js' f64 density" of a CPU solve.** errorField evaluates the matrix the field itself drew (copied
   before the copy is submitted) in f64. That is the only twin that stays honest while a kicked density plays, it needs no second solve, and
   it differs from the f64 D by 1.3e-8 relative. It also covers ORBITAL views (real and complex) and the factor road; Δρ / signed stand down.
5. **"worst … of ρmax" for the probe.** A 4 × 4 × 4 probe of voxel centres misses the peak: its worst |Δρ| over ρ̂max read 8.6e-8 —
   a true number that says nothing. The tile prints the f16-normal count instead; `relToMax` stays in the object, documented as over the probe.
6. **CENTRAL "if its CPU evaluator exists".** Every Hamiltonian carries `psiAt` (CENTRAL, ATOM and QUARKONIUM over the same radial tables the
   kernel reads), so none stands down: for those the twin is the CPU numerical radial, not a closed form — the reading is the grid's storage
   and kernel error against it, not the model's.
7. **The memo's deficit bound** holds on f16-normal components only (above); counted over every normal √ρ it reads 2.4e-3. The object measures
   the law's domain.
8. **The example line** ("MEASURED · 64³ · RMS … · toward zero · 41 ms") wraps in a 274 px METERS card; it is split into the value and two sub
   lines that each fit (Josh's no-wrap rule). And METERS, like every first-run window, opens LEAN — its readouts hidden until `Aa` (pre-existing).

## Not done / open

- The kicked-molecule sub ("the frame it caught (t …)") and the stand-down lines (card, Δρ, equalizer, gas) are written and not browser-checked
  (the light check was the brief's pass). The re-measure follows the grid IN FORCE (`field.resolution`), so a GOVERNOR notch re-measures too.
- 128³ was not tabled (the brief asks 64³ and 96³); a two-mode state there costs ~3 s of yielded main-thread work on a press.
