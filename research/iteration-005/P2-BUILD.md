# Iteration 005 · P2 — THE FACTOR CURRENT AND THE CONTINUITY RECORD (build note)

Branch `it005-factor` from `b184f4d` (A, P1 and P4 merged). Builder: Claude Opus 5.5. Sources: Sol-6's PRACTICAL UPGRADE SYNTHESIS §2–3.
Lab lines (`find lab -name '*.js' -not -path 'lab/mir/*' | xargs cat | wc -l`): **31,365 → 31,458 (+93)**.

## The seats
- `lab/molecular-flow.js` `createFlow`: **`setFactors(w, re, im)`**. K weighted factors (re/im stored a-major, K·n f64). `at()` computes
  ρ = Σ_a w_a |φ_a|² and j = Σ_a w_a (R∇M − M∇R) in P1's one evaluator loop. **`setPacket` is now `setFactors([1], re, im)`**, so there is
  no third loop and P1's arithmetic is unchanged (×1 is exact). `set()` clears the factors. `setFactors()` keeps the matrices, because
  `pump` still posts Re/Im to the worker (the REPAIR road). The floor is now **`setFloor(err, what)`**: `floor = max(1e-7, 10·err)`. A new
  `fade()` gives the alpha of the last step: log₁₀(ρ/floor), clamped to [0, 1]. GATED names the floor in force and what assessed it.
  `pump(…, ask)` adds THE CONTINUITY RECORD's payload to the same `flow.balance` call, at most every 450 ms. `continuityOn()` is the
  worker's half (exported).
- `lab/mathworker.js`: **`factorsOf(engine)`**, run on `chem.rt.init` / `chem.rt.run` only when the call says `factors` (FLOW on):
  - `hermitianEigen` of the run's **Löwdin-frame P(t)** (f64), so the w_a are the occupations;
  - c_a = X u_a;
  - pairs with |w| ≤ 1e-12 are dropped;
  - the reply carries `F_w F_re F_im F_sum`.

  THE TRANSPOSE SEAM is handled once, in the comment where the factors are made: ψ = c_a is the packet form D_pq = ψ̄_p ψ_q, so nothing is
  negated. `flow.balance` with `plane` adds `out.plane = continuityOn(…)`.
- `lab/chemview.js`:
  - the three landing roads (kick, pump, scripted `run`) ask for factors while FLOW is on;
  - `feedFlow` keeps the dense matrices (REPAIR, BALANCED's Re Ḋ). It hands the factors to `setFactors`, keeps the two latest landings'
    factors and calls `setFloor(0, 'f64 factors' | 'f32 D')`;
  - `planeOf()` builds PLANE's points;
  - the CONTINUITY tile (`readout` with the `wide calc-ray` class, plus a canvas) sits with FLOW, beside REPAIR · GATED. Its sentences
    are: "a still molecule: … KICK and RUN first"; "a volume molecule has no run …"; "UHF / RKS LDA: no real-time run …"; "RUN: the
    record needs two landings". The comment beside the old −Im D negation says the factors carry no such seam.
- `lab/slice.js`: **`planePoints(rotor, {mode, half, N})`** is the one geometry of PLANE's sample (`sampleSlice` now reads it; the
  arithmetic is unchanged; `tests/rotor4.test.mjs` is green). `lab/sliceview.js` exposes `get res()`.
- `lab/particles.js`: each trail point carries an alpha (a FLOW source's `fade()`, else 1). A segment is drawn at its newer point's
  alpha in quarters, with one stroke per run of the same quarter, so a full-alpha trail is one stroke as before. The dot takes the head's
  alpha.
- `lab/windows/molecules.js`: `createChem`'s options gain `plane: () => app.w.slice` (an existing slot, read in a callback;
  `rack-deps` 0). `lab/sw.js` is the precache revision.

## The oracle, once (scratch scripts `.tmp/p2/*.mjs`, uncommitted)
Setup: dense = `set(Re D, −Im D)` of the same f64 D (an identical engine run alongside). Factors = the worker's own `factorsOf`, and the
worker's F_w equals the rebuilt factors to 0. Both roads in f64, at 200 seeded points in ±6 × ±6 × ±3 a₀, after a κ = 1e-3 kick and 30
MMUT steps at Δt = 0.01.

| run | n | K | w_a | Σw (all n) · Tr P | idempotency | max ρ | max \|j\| | max \|Δρ\|/max ρ | max \|Δj\|/max \|j\| |
|---|---|---|---|---|---|---|---|---|---|
| benzene z-kick | 36 | 21 | all 2.000000000000 | 42.000000000000 · 42.000000000000 | 1.4e-14 | 7.83 | 4.38e-4 | 5.2e-15 | 1.2e-11 |
| benzene y-kick | 36 | 21 | all 2.000000000000 | 42.000000000000 · 42.000000000000 | 1.9e-14 | 7.83 | 6.28e-4 | 1.2e-15 | 1.3e-11 |
| water y-kick | 7 | 5 | all 2.000000000000 | 10.000000000000 · 10.000000000000 | 5.8e-15 | 0.148 | 1.36e-4 | 1.7e-15 | 5.3e-13 |

Every row is within the brief's 1e-10. The j column is relative to a κ-small current: it is 5e-15 absolute.

## The two costs (µs a point, AO + ∇ included, 2 × 2·10⁴ points; the CPU shared, load ≈ 12–16)

| benzene | n | K | AO + ∇ alone | dense n² | factors n·K | saving |
|---|---|---|---|---|---|---|
| STO-3G | 36 | 21 | 2.97 / 2.45 | **11.24 / 11.03** | **7.19 / 6.44** | 1.6× whole point (2.0× the contraction alone) |
| 6-31G* (scaling only, a random rank-21 D) | 102 | 21 | 4.33 / 2.99 | 60.97 / 60.36 | 15.30 / 15.10 | 4.0× |

The factor build in the worker is one `hermitianEigen` of the 36 × 36 complex P: **20 ms per landing** on benzene. A landing (10 steps)
took 190–660 ms in node, so this adds 3–10 % while FLOW is on, and nothing while it is off.

## THE CONTINUITY RECORD, the benzene table
Setup: benzene STO-3G, κ = 1e-3, Δt = 0.01, landings of 10 steps (Δt between landings = 0.1, the run's own clock). The TILE is PLANE's
sample at EXTENT ±8 (every 4th point of its 128², so 32² = 1024 points), with h = 0.125 a₀ (PLANE's own spacing, 2·8/128) and j as the
mean of the two landings'. GRID is the app's own `flow.balance` defect (`info.defect`, what REPAIR reads): 32³ over ±10.7, the f32 D.

| kick · plane | t | TILE | j of the latest landing only | h = the grid's 0.67 | full 128² | GRID 32³ |
|---|---|---|---|---|---|---|
| z · xz (first order) | 1.00 | 0.845 | 1.018 | 1.107 | — | 1.250 |
| z · xz | 2.00 | 0.735 | 0.556 | 0.966 | 1.067 (64²: 1.394) | 0.952 |
| z · xz | 3.00 | 0.774 | 0.846 | 1.052 | — | 1.164 |
| y · xy (first order; the card's default axis on PLANE's default plane) | 1.00 | 1.345 | 1.126 | 0.959 | — | 0.660 |
| y · xy | 2.00 | 0.771 | 0.614 | 0.931 | 1.014 (64²: 1.281) | 1.004 |
| y · xy | 3.00 | 0.619 | 0.552 | 0.967 | — | 0.624 |
| z · xy (σh: second order in κ) | 1.00 | 0.149 | 0.750 | 0.998 | — | 1.250 |
| z · xy | 2.00 | 0.189 | 0.474 | 0.991 | 0.217 (64²: 0.313) | 0.952 |
| z · xy | 3.00 | 0.404 | 0.044 | 0.996 | — | 1.164 |

**The core share.** At z · xz, t = 2, the share of the residual² lying within 0.3 a₀ of a nucleus is:

| sample | core share | defect | valence-only defect |
|---|---|---|---|
| 32² | 99.8 % | 0.735 | 0.098 |
| 64² | 99.5 % | 1.394 | 0.168 |
| 128² | 95.5 % | 1.067 | 0.330 |

Refining h to 0.03 *raises* the number (0.883, 2.423, 2.195). So the core residual is real (the minimal basis's cores plus their fast
response aliased by the 0.1 a.u. landings), not a difference-step artifact. The live tile prints the share (91 % in the browser pass).

**Why the plane number is not the grid's number:**
1. **The sample.** One plane through the carbons against 32 768 cell centres over the box. With ≥ 90 % of the residual at the cores, the
   plane number depends on how close its points pass to a nucleus: 0.735 / 1.394 / 1.067 at 32² / 64² / 128² for one state.
2. **The difference.** The tile uses pointwise centred j at p ± hê with h = 0.125. The worker uses grid differences at h = 0.67, one-sided
   at the box faces. The same plane at h = 0.67 reads 0.93–1.11, close to the grid.
3. **The time.** The tile's j is time-centred with (ρ₁ − ρ₀)/Δt. The grid's j is the latest landing's, against a Re Ḋ centred half a
   landing behind (its own comment says so). On the plane, the latest landing only reads 0.04–1.13.
4. **The precision and the weight.** The tile reads f64 factors. The grid's Re Ḋ is the f32 D's difference over Δt, and it counts only
   cells with ρ > 1e-7.
5. **The plane's symmetry.** A plane that is a mirror for the kick axis (xy for a z-kick) sees ∂ρ/∂t and ∇·j only at O(κ²): 0.15–0.40.
   That is a different quantity, said here so nobody compares it with the grid.

## What the brief got wrong, and how I decided
1. **CALCULUS is hidden in MOLECULES mode.** Iteration 002's `moleculeMode` hides `wCalc` (and PLANE). So the tile is CALCULUS's tile
   shape (readout + canvas, the `calc-ray` class that also keeps it visible under LEAN), seated in MOLECULES with FLOW, beside REPAIR and
   GATED. The "hydrogen register" stand-down has no seat, because MOLECULES exists only in the molecule mode. The volume / UHF / LDA
   sentences are written, but FLOW is already disabled for those.
2. **"hermitianEigen of D → w_a the occupations" is wrong in an AO basis.** D's eigenvalues are not occupations (the AO metric is not
   the identity). The occupations are the eigenvalues of the Löwdin-frame P = S^{½} D S^{½}. Only the chem worker holds P (in f64); the card
   holds an f32 D and no S. So the factors are made in the worker from P, with c_a = X u_a. Measured: all 21 w = 2.000000000000.
3. **"n² → n·nocc" is a 1.6× at benzene STO-3G, not n/K.** The factor loop does 8 multiply–adds per (AO, factor); the dense loop does 4
   per (AO, AO). With n/K = 1.7, the whole-point saving is 1.6× (2.0× for the contraction alone). It is 4.0× at 6-31G*. Sol's synthesis
   predicted exactly this ("not automatically faster").
4. **PLANE's N is too dear to sample whole.** 128² × 14 evaluations is 1.6 s per reading in the cards worker. The tile takes every 4th
   point with PLANE's own h (≈ 0.1 s, at most every 450 ms) and says so. Its number is sample-dependent (core-dominated), and its sub-line
   says that too.
5. **The FIELD_LAW floor would have broken FLOW.** This departs from the instruction in my launch message, so here are the numbers.
   - `density.worst` (2e-3) is the display texture's *relative* per-voxel error. Turned into a floor as 10 × 2e-3 × ρmax, with the grid's
     ρmax 7.37 for benzene, it gives **0.147**. That refuses **40.7 %** of the |j|-seeded tracer positions. The fade decade
     [0.15, 1.5] then dims almost all of the rest (the median seed has ρ 0.18, the 95th percentile 0.85).
   - The absolute display metric (`relToRhoMax` 3e-4) gives 2.2e-2 and refuses 5.3 %.
   - Both measure the **picture** (the f16 texture), not the ρ the tracers read. The f64 factors agree with the dense road to ≤ 5e-15
     relative. The f32-D road is off by ≤ 4.8e-8 absolute and ≤ 5e-8 relative. Sol §3 says "keep analytic physical readouts independent
     of display voxels".
   - So `setFloor(err, what)` takes the measured error of FLOW's own ρ. Both of FLOW's roads have relative errors, so neither raises the
     floor above 1e-7, and GATED says "(f64 factors)" or "(f32 D)".
   - A later caller (P3's `errorField`) hands its value through the same call, one line in `feedFlow`, if Josh rules that the picture's
     error should gate FLOW. That road also needs ρmax on the main thread (today it is a GPU readback).
   - The fade is in either way: a tracer dissolves over the decade above the floor.
6. orbitalsview needs no call: createFlow's default floor *is* its assessment (the f64 packet, 'f64').

## Checks
- `node tests/pwa.test.mjs --write` · `./test.sh node` **0**. `tests/molecular-flow.test.mjs` and `tests/flow-numbers.test.mjs` are
  unchanged and green (the RING continuity still 1.1938). wigner W42-8 went red once under load and was green alone and on the second
  full run.
- `node tools/rack-deps.mjs --classes --no-write` **0** · `node tools/new-project.mjs --check` in step (16117 B).
- **The light check** was one scratch pass on 9641/5741. Lines:
  - `GREEN L0 boot`
  - **L1, benzene KICK › RUN › FLOW.** Read `factors 21` · `floor 1e-7` · REPAIR `0.92` · GATED `0 % … floor ρ > 1e-7 (f64 factors); a
    trail fades over the decade above it` · CONTINUITY **0.795**, 1024 points, core 91 %, 126–134 ms in the worker, with its picture ·
    220/220 tracers. It printed RED only because of two `ResizeObserver loop completed with undelivered notifications` page errors. The
    same script on the **base** tree (b184f4d, FLOW off) throws the same two, so they are pre-existing and not this row's.
  - **L2, MO-REGISTRY › WINDING › FLOW** (P1's packet through `setFactors([1], …)`): 220/220 alive. RED for the same two inherited errors.
- Screenshot: `P2-benzene-flow.jpg` (99 KB). C₆H₆ kicked along y, FLOW AS COMPUTED, the CONTINUITY tile at 0.795 with the residual's
  sign around the six carbons (ACCENT A > 0, B < 0).

## Left
- STATES' FLOW (`statesview.js`) still rides its n² matrices. A TD-CIS pair density is not a positive factor set (Sol §2: "TD-CIS
  densities need their own admissible factors"), so that is its own row.
- P3's measured value is not wired, by the decision above. The seam is `flow.setFloor(err, what)` in chemview's `feedFlow`.
- The analytic divergence (AO Laplacians) and an analytic ∂ρ/∂t (−i[F, P] from the worker) would take the difference steps out of the
  number entirely. Not built: the brief asked for centred differences, and the core finding above holds at every h.
