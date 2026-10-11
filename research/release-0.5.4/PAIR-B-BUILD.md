# PAIR-B-BUILD — P6 THE WORKER REFUSES · P7 PRECISION DISCIPLINE (0.5.4 "Contract Layer")

Builders: PAIR B (Opus 5.5; P6, P7a; paused on the usage alarm at a safe boundary, worktree `agent-ad656ab600f3fbae8`, tip `fb3edfb`) and
PAIR B2 (Opus 5.5; P7b, P7c, P7d and this file; worktree `agent-afee0ecd2311b04b7`, branch `worktree-agent-afee0ecd2311b04b7`, reset to
`fb3edfb`). Base `0591605`. One commit per row; no push. §1 and §2 are written from the paused builder's saved notes
(`~/.claude/handoffs/agents/ad656ab600f3fbae8.md`, its commit messages and its `.tmp/` outputs, read only); §3–§5 are measured here.
Rig: RTX 3070, headless Firefox through `tools/gate/server.py` (B: 9043/9044; B2: 9073, base export 9075, `GD_PORT=5543`), every browser run
after `rigfree.mjs`. THE LOCK is same-machine.

## 1 · P6 THE WORKER REFUSES — chem only (R4) · `aef09dc` · +3 `lab/`

`lab/worker-pool.js`: `answered` is a pool-lifetime flag, set on the chem worker's first `onmessage` and never reset by `ensure()` or the
respawn. The frame thread's road, `local()`, runs only while `!answered`: no `Worker`, a construction throw, or an error or timeout before
any reply. After a reply, an error or a timeout is refused as `{ error, refused }`. Both keys carry the one sentence ("…pick the molecule
again (a fresh worker holds no solve)"), so every existing caller prints it unedited. `fail()` respawns ONCE (chem only) and then
refuses. The killing job is never re-posted. There is no worker-side cancel. `bow` / `period` / `cards` keep their roads. The header and
the 300 s ceiling comment were made true.

**`tests/worker-pool.test.mjs` (new, node; fake `spawn`, `node:test` mock timers, a stub `requestAnimationFrame`): 15/15 GREEN; the base
code reads 7/15.** The five cases and their `local()` counts:

| case | `local()` | also proved |
|---|---|---|
| 1 error after a reply | 0 → `{ error, refused }` | `fail()` respawns once for the next job; the killing job is not re-posted; the respawned worker answers |
| 2 timeout after a reply (300 s, mocked) | 0 → `{ error, refused }` | a timeout cancels nothing: one worker, no respawn, the job posted once |
| 3 error after the respawn (the new worker never replied) | 0 → refused | the second failure refuses with no third spawn (`starts` 2); jobs B and C each posted exactly once |
| 4 the dead pool | 0 for every later chem job | nothing spawned or posted |
| 5 the never-answered worker | 1 per job — `onerror` before a reply, no `Worker`, a construction throw, a timeout before a reply | the next job takes the same road (no respawn for a worker that never answered) |

Plus `cards`: after a reply an error still falls back to the frame thread, and that worker is not respawned (its road is unchanged).

**The browser case: `tests/worker-refusal.browser-test.mjs` (new) 6/6.** An unknown op on the live error road, read two ways: (a) the
shipped pool over the shipped `mathworker.js` with a counting fallback → `{ error, refused }`, 0 fallback calls, no respawn, the next job
answered; (b) the app's own chem pool through `__LW.chem`. `__LW.chem` exposes no `api`, so the case goes through `workerStat()` with
`Worker.prototype.postMessage` rewriting the op in flight → `{ error, refused }`, not `null`, and the solver count does not move.

**Owning suites:** `history` 45/0, `new-project.browser` 8/0, `register` 22/0. **THE LOCK** 860 · 0/0 and 1004 · 0/0. serialize-bytes
11/11 full + 11/11 edit vs `0591605`; `new-project --check` in step; node gate 0.

## 2 · P7a THE ORBITAL PACKET IN f64 · `fb3edfb` · +2 `lab/`

`lab/orbitalsview.js` `vectors()`: the per-frame contraction sums into two reused `Float64Array` scratch buffers, allocated with `re`/`im`
and never per frame. It casts to the field's `Float32Array` once (`re.set` / `im.set`). This is the one frame-path addition THE STUTTER
LAW allows. `tools/perf/packet-precision.mjs` (new) runs the SHIPPED `vectors()`, cut from the file at a revision or from the working
tree, over the library records and compares it with the same sum in f64. MEASURED, max |packet − f64| over presets × phases × t:

| record | before (f32 accumulation) | after (f64, one cast) |
|---|---|---|
| benzene | 8.801e-8 abs · 1.579e-7 of max\|ψ\| | 2.905e-8 abs · 5.059e-8 of max\|ψ\| |
| C₆₀ | 2.560e-8 abs · 1.131e-7 of max\|ψ\| | 1.177e-8 abs · 4.368e-8 of max\|ψ\| |

"After" is one f32 rounding. The texel the packet lands in is coarser by four orders (§4). **THE LOCK after P7a:** 860 · 0/0 and
1004 · 0/0 (packets are outside the lock, so the table is P7a's own gate). PAIR B ran neither the node gate nor serialize-bytes after P7a
(the pause). B2 ran both on `fb3edfb` before its first edit: **node gate exit 0 (83 suites); serialize-bytes 11/11 full + 11/11 edit
IDENTICAL vs a `git archive 0591605` export.**

## 3 · P7b T_MAX DECLARED (R9) · `cb123df` · +3 `lab/`

`lab/clock.js`: THE HORIZON is now in the header. t is one f64, so at t = T_MAX·dt a step `t += dt` is no longer dt, and from 2·T_MAX·dt
on it is lost. The header names dt's source: `rate` × the wall interval `advance()` took (≤ `MAX_WALL_STEP`), or `step(dt)`'s own.
`export const T_MAX = 2 ** 53` (in steps: the f64 significand's reach; 2⁵³ frames ≈ 4.7 million years of play at 60 Hz). No clamp, no
sentence, no frame-path branch: nothing in `lab/` reads `T_MAX`.

`tests/clock.test.mjs` (new, node; PAIR B's parked draft, copied unedited) **8/8 GREEN**:
- `T_MAX` = 2⁵³ = `Number.MAX_SAFE_INTEGER + 1`, and the horizon is 4,757,015 years at 60 Hz.
- On bare doubles, for four dt (RATE/60 = 0.0667, RATE·MAX_WALL_STEP = 0.4, 1/3, 2⁻⁴):
  - inside the horizon, a step registers within ½dt;
  - at T_MAX·dt the step is 0.125 / 0.5 / 0.5 / 0, never dt;
  - from 2·T_MAX·dt on, `t + dt === t`.
- The shipped `Clock` never clamps or refuses: `scrub(1e300)` stays 1e300, and `step()` and `advance()` past the horizon count a step
  and add nothing.
- `lab/clock.js` names `T_MAX` only in its header and its export.

THE LOCK 860 · 0/0 and 1004 · 0/0; `new-project --check` in step; node gate 0.

## 4 · P7c THE STANDING FIELD LAW (PLAN.md §J-2 applied) · `0b0a8f6` · +0 `lab/`

**The ruling applied.** `tests/field-law.browser-test.mjs` (new) reads every texel of the cache the presenter samples (`field.readGrid()`:
one copy, 64³ × (re, im) = 524,288 stored components per molecule). It compares them with:
- hydrogen 1s+2pz, paused at t = 3.7 a.u.: the CPU closed form (`__LW.cpuPsi`);
- H₂O STO-3G: `lab/molecular-field.js`' f64 `evaluator` over a CPU `moleculeRHF` solve of `chem.query()`'s molecule. That solve's D equals
  the worker's to 0 (F3), so the oracle is the density the GPU drew.

The constants live in **`tests/helpers/field-law.mjs`** (`FIELD_LAW`), the one place for the picture's numbers. The gate asserts them,
README and `field.js` state them, and P4's `statusOf` table test reads them from there. A `lab/` module cannot import from `tests/` at run
time (`tests/` is not served by the PWA), so P4's own constants must be asserted equal to these, never retyped. **7/7 GREEN.**

**The rounding mode, measured: TOWARD ZERO.** Of the components where rounding toward zero and rounding to nearest disagree, the store
matched toward zero on 261,700 of 261,796 (hydrogen) and 120,675 of 120,736 (water). The remaining 0.04 % are consistent with the
kernel's f32 value and the f64 value falling on two sides of an f16 grid point. That is an inference: it was not traced voxel by voxel.
One mode on both molecules (F5).

**The one-ulp law's result.** Each stored component lies within ONE f16 ulp of the kernel's f32 value. Against the f64 value, that holds
for all but **32 of 524,288 (hydrogen, worst 1.0005 ulp)** and **14 of 524,288 (water, worst 1.0008 ulp)**. Those 46 are the kernel's own
f32 error carried across a grid point: the excess is 2.29e-7 and 5.38e-7 relative, inside `field.js`' "f32-accurate to about 1e-6
relative". So the law as asserted is |stored − f64| ≤ 1 f16 ulp + `FIELD_LAW.f32` (1e-6)·|f64|: 0 failures of 1,048,576 (F1, F3). The
ruling's literal "within one f16 ulp of its f64 value" would fail on those 46 components, by at most 0.08 % of an ulp. Every reading is
printed, so the strict count stays visible. No subnormal is flushed: 204,148 of hydrogen's 524,288 components have an f64 value in the
f16 subnormal range (2⁻²⁴ ≤ |x| < 2⁻¹⁴), and all 204,148 are stored as subnormal bit patterns, none as zero (a throwaway probe,
`.tmp/subnormal-probe.mjs`). The law's 2⁻²⁴ ulp there would have caught a flushing store.

**The four readings per molecule (64³; each held to its `FIELD_LAW` bound, F2 and F4):**

| | RMS | 99.8 % of voxels | worst voxel | relative to the maximum |
|---|---|---|---|---|
| hydrogen, \|Δψ\| (±16 a₀) | **2.34e-6** (≤ 3e-6) | **1.88e-5** (≤ 2e-5) | **1.68e-4** (≤ 2e-4) at (31, 31, 32), the Im part 0.25488 vs 0.25505 | **6.42e-4** of max\|ψ\| 0.2617 (≤ 1e-3) |
| water, \|Δρ\|/ρ (±7.43 a₀, the 116,736 voxels whose √ρ is f16-normal) | **8.31e-4** (≤ 1e-3) | **1.85e-3** (≤ 2e-3) | **1.94e-3** (≤ 2e-3) | **2.86e-4** of ρmax 15.0654 (≤ 3e-4) |

**The two truth edits, in place (ruling (2)):**
- `README.md:51` and `:79`: "to 2e-5" → "3e-6 RMS, 2e-4 at the worst voxel", and ":79" also gives "2e-5 in 99.8 % of voxels … within one
  rgba16float step", citing the gate. README's 2e-5 survives in its true metric: it is the 99.8 %-of-voxels figure, not a per-voxel maximum.
- `lab/field.js:155` and `:163–165`, the ≈ 1e-3: ":155" now says "≈ 1e-3 RMS relative on ρ" (true: 8.31e-4). ":163–165" now says
  "within one f16 ulp on √ρ, rounded toward zero on the rig: ρ to 3e-4 of ρmax, 2e-3 relative at the worst voxel (≈ 1e-3 RMS;
  tests/helpers/field-law.mjs, water at 64³)". These are comment lines only, with the same line count. No WGSL moved.

`pwa --write` after; **THE LOCK 860 · 0/0 and 1004 · 0/0**; node gate 0.

**For P4 (ruling (3)), what the constants say:**
- **Hydrogen.** The RMS is 2.34e-6, read as **3e-6**. The ruling's string "picture good to 2e-5 RMS (worst voxel 2e-4)" is true only as a
  loose bound: 2e-5 is the 99.8 %-of-voxels figure. Read from `FIELD_LAW.hydrogen`, the string becomes "3e-6 RMS (worst voxel 2e-4)".
- **A molecule's density.** "0.03 % of ρmax" is water's reading at 64³ (2.86e-4), not a texel bound. The texel's own bound for any
  density is one ulp toward zero on √ρ: |Δρ| ≤ (2·2⁻¹⁰ + 2⁻²⁰)·ρ ≤ 1.96e-3 of ρmax. Another molecule or grid can read anywhere up to
  that. P4 should say whose reading the 0.03 % is, or quote the 2e-3 bound.

**One fact on two grids.** THE ENGINE PLAN's floor (`research/release-0.6.0/PLAN.md` D; census `REPRESENTATIONS.md` §5: "2.7e-4 (1s) to
4.3e-4 (1s+2p_z at T/4) worst relative" under a "4.9e-4 relative texel floor") and this row's 1.68e-4 worst voxel are the same f16 store,
seen at two voxel lattices. Measured here with PAIR B's probe (copied, `.tmp/fieldlaw-probe.mjs`), 1s+2p_z at t = 3.7:
- 96³: worst |Δψ| 1.29e-4 = **4.30e-4 of max|ψ|** (the census's own 4.3e-4);
- 64³: 1.68e-4 = **6.42e-4 of max|ψ|**.

The 64³ reading is above 4.9e-4 because 4.9e-4 is 2⁻¹¹, a half f16 step (`research/h2o-2026-09-11/scratch/gpu.mjs`: "mantissa 11 bits →
relative step 4.9e-4"). Half a step is the round-to-nearest bound. A store that rounds toward zero has one full step, ≤ 2⁻¹⁰ ≈ 9.8e-4
of the value, as its bound; hence `FIELD_LAW.hydrogen.relToMax` = 1e-3. The floor 0.6.0 N6's METERS tile shows should be "one f16 ulp
(≤ 9.8e-4 of the value, toward zero on this rig)", not 4.9e-4.

## 5 · P7d THE VIEW-INVARIANCE GATE · `31328bf` · +0 `lab/`

There is ONE browser case, in `tests/field-law.browser-test.mjs` after the field law, on the water that law has just read (live-solved,
MOLECULES on, VIEW density, 64³). It makes ten changes, each on the hand's road and each read back so that a change that did not happen
cannot pass (V1):
1. EXPOSURE 1 → 2.3, through the modulation registry's base (the knob's road).
2. ISO 0.06 → 0.2, the same road.
3. PALETTE `prism` → `beacon` (`setPalette`).
4. The PALETTE switch.
5–7. The FIELD QUALITY GRID segment clicked 96³ → 128³ → 64³. `field.stats.resolution` reads 96/128/64 and the march steps 160/240/110.
8. PERFORMANCE → FULL.
9–10. The AUTO SCALE switch pressed twice. The two reads of `quality.auto` differ: the first press only re-synced the switch to the
     test's own `auto = false`.

**V2 GREEN:** across all ten, `sol.seq` stays **1**, `chem.workerStat().solverCalls` stays **2** (the one SCF and the one RPA of the water
solve), and Tr(DS) (`sol.electrons`, the worker's own) stays **10.000000000000014**, bit for bit. It is the same solution object
throughout, MOLECULES stays on, and there is no page error. **`field-law` 9/9 GREEN** on the tip. No `lab/` edit, so THE LOCK has
nothing new to check. The tip's LOCK, serialize-bytes and node gate are the P7c tree's.

## 6 · Lines per row (`cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l`)

| row | commit | lines | Δ |
|---|---|---|---|
| base (0.5.4 STEP 2 tip) | `0591605` | 28,023 | — |
| P6 | `aef09dc` | 28,026 | +3 (estimate +20) |
| P7a | `fb3edfb` | 28,028 | +2 |
| P7b | `cb123df` | 28,031 | +3 |
| P7c | `0b0a8f6` | 28,031 | +0 (three comment lines of field.js rewritten in place) |
| P7d | `31328bf` | 28,031 | +0 (a test only) |

P7 total **+5** against a budget of +6 (stop at +9). Nothing subtracted: P7 had nothing to remove that the rows named. THE STUTTER LAW: the
only frame-path change is P7a's f64 scratch. P7b–d add no call to the frame loop.

## 7 · What could not be measured

- **The rounding mode on any other GPU, driver or browser.** "Toward zero" is this rig's (RTX 3070, Firefox, Vulkan). The law asserts one
  ulp, which also holds for round-to-nearest, so the gate is portable. The readings are not: a round-to-nearest store would read about half.
- **Grids and molecules beyond the two pinned cases.** The readings are 1s+2p_z at 64³ and t = 3.7 (96³ only by the probe), and H₂O
  STO-3G at 64³. Benzene, C₆₀, 128³ and the ORBITAL / Δρ / packet views were not read. The relative-to-ρmax figure in particular is
  configuration-dependent (see §4).
- **The f32 term's own bound.** `FIELD_LAW.f32` = 1e-6 is `field.js`' stated figure, and the measured excess (≤ 5.4e-7) sits under it. No
  independent proof bounds the kernel's f32 error everywhere: near a node of ψ, cancellation could exceed it in relative terms. There, the
  f16 subnormal step (2⁻²⁴) absorbed it in this run.
- **P6 and P7a** were not re-measured by B2. Their figures are PAIR B's. B2's node gate, serialize-bytes and LOCK runs on its own tips
  cover them as regressions only.
