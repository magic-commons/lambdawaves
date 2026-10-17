# Iteration 005 · P1 — THE DIRECT PACKET (build note)

Branch `it005-packet` from `a0a3fb3` (A THE ROOM merged). Builder: Claude Opus 5.5. Source: Sol-6's PRACTICAL UPGRADE SYNTHESIS §1.
Lab lines (`find lab -name '*.js' -not -path 'lab/mir/*' | xargs cat | wc -l`): **31,350 → 31,353 (+3)**.

## The seats
- `lab/molecular-flow.js` `createFlow` — `setPacket(re, im)` beside `set(re, im)`. With a packet set, `at()` takes ψ = R + iM and ∇ψ
  from ONE pass over the AO values and gradients the evaluator already filled (8 MACs per AO), then ρ = R² + M², j = R∇M − M∇R
  (= Im ψ̄∇ψ, the file's convention). The same `out` record, so `velocity`, `step`, `weight`, `speed` and the REPAIR hook (which reads ρ)
  are untouched. `set()` clears the packet, `setPacket()` clears the matrices; `ready`, `weight` and `step` accept either. `pump` stays the
  matrix road (it posts Re/Im to the worker; the register's flow is created without a `call`, so it never pumps).
- `lab/orbitalsview.js` — `feedFlow`, `flowRe`, `flowIm` and the n² loop are gone; `push()` hands the f64 `re64`/`im64` to
  `flow.setPacket` (the old road fed the f32 copies). The FLOW comment says the packet IS ψ: no D to build, none to transpose.
- `lab/chemview.js` — one parenthesis beside the `−Im D` negation: MO-REGISTRY's packet has no such seam (it hands ψ itself). The kicked
  molecule's FLOW is unchanged (P2's).
- `lab/sw.js` — the precache revision (`node tests/pwa.test.mjs --write`).

## The oracle (once; the dense road kept in `.tmp/p1-oracle.mjs`, uncommitted)
Dense = the old `feedFlow` (Re D = r rᵀ + m mᵀ, Im D = r mᵀ − m rᵀ) through `set()`; direct = `setPacket()`. 200 seeded random points in
±6 a₀ (cube), both roads in f64. Benzene from `chemGround` (STO-3G, 36 AOs); aspirin from VOL. I's `aspirin.lwm`, rung 6-31+G* (263 AOs)
through `rungRecord` → `chemOpen` (0 solver calls).

| packet | n | max ρ | max \|j\| | max \|Δρ\| / max ρ | max \|Δj\| / max \|j\| |
|---|---|---|---|---|---|
| benzene HOMO, real | 36 | 1.69e-2 | 0 | 1.0e-16 | 0 |
| benzene WINDING (degenerate HOMO pair, phases 0, π/2) | 36 | 1.06e-2 | 4.60e-3 | 8.2e-16 | 2.8e-16 |
| benzene WINDING, coefficients conjugated | 36 | 1.06e-2 | 4.60e-3 | 8.2e-16 | 2.8e-16 |
| benzene 6-orbital packet at t = 1.7 | 36 | 3.27e-2 | 2.94e-2 | 4.3e-16 | 7.1e-16 |
| the same × e^{i·0.9} | 36 | 3.27e-2 | 2.94e-2 | 2.1e-16 | 1.1e-15 |
| aspirin 6-31+G* HOMO + LUMO at t = 2.3 | 263 | 7.03e-3 | 2.75e-3 | 1.2e-13 | 5.2e-14 |
| the same × e^{i·2.1} | 263 | 7.03e-3 | 2.75e-3 | 1.1e-13 | 5.1e-14 |

Every row is within 1e-12 of the dense road. The three declared laws on the direct road:
- **a real orbital**: max |j| over the 200 points = **0 exactly** (M ≡ 0, so R∇M − M∇R is 0 in floating point, not merely small).
- **the winding pair reversed by conjugation**: ρ identical (Δ = 0) and j + j̄ = **0 exactly** at every point (max |j| 4.60e-3).
- **a global phase**: benzene Δρ 6.4e-16, Δj **9.3e-15** relative (≤ 1e-14 holds); aspirin Δρ 5.1e-15, Δj **1.9e-14** relative — 263 AOs
  of cancellation; the 1e-14 the brief named was for the declared (benzene) packets and is recorded here for the large one as measured.
- **the TDHF transpose seam, once**: density.js's D_μν = c_μ c̄_ν with Im NEGATED on the way in (chemview's road) against the packet:
  Δρ 4.3e-16, Δj 7.1e-16 — the two roads read the same current. (`tests/molecular-flow.test.mjs` §2 and §5 untouched and green.)

## The cost, measured (`performance.now()` over 10⁴ points, AO + gradient evaluation included; the CPU was shared, load ≈ 17)

| molecule | n | AO + ∇ alone µs/pt | dense µs/pt | direct µs/pt | saving | dense n² fill a frame |
|---|---|---|---|---|---|---|
| benzene STO-3G | 36 | 1.84 / 3.09 | 7.39 / 14.66 | 1.77 / 2.39 | 4.2× / 6.1× | 0.01 ms |
| aspirin 6-31+G* | 263 | 8.05 / 11.57 | 441 / 406 | 19.0 / 17.0 | 23× / 24× | 0.4–0.9 ms |

(two runs each.) The direct road costs about the AO evaluation itself; the dense road's n² contraction was 95 % of its point at 263 AOs.
Whole frame on the gate's Firefox (RTX 3070, shared): aspirin HOMO + LUMO with FLOW playing **13.8 presents/s direct against 1.2 dense**
(22.5 with FLOW off); seeding plus a 24-step scrub walk 5.5 s against 41.9 s.

## What the brief got wrong, and how I decided
1. **There is no FLOW refusal past a cap.** Nothing in `orbitalsview.js` (or its switch) refuses FLOW by `nAO`; the dense road *ran* at 263
   AOs — at 1.2 presents/s, with a 42 s seed and walk. The payoff is therefore the speed that makes it playable (13.8/s), not a lifted
   refusal. No cap was added or removed.
2. **The picture's cap is not 64 AOs.** `MOL_ORB_FROM = 64` is where a complex orbital leaves the χ-tile kernel for `ORB_WGSL` (no tile),
   whose ceiling is `MOL_LIMITS.ao = 768` (C₆₀'s 300 draws). Aspirin's 263-AO packet draws on the stage today; nothing else refused.
   (Sol's note says "the current shader ceiling of 64 AOs" too; it is out of date since 0.4.0 S4c.)
3. The global-phase 1e-14 holds for benzene; at 263 AOs j reads 1.9e-14 relative (recorded above, not hidden).
4. A side effect worth saying: the old road fed the flow the **f32** copies of the packet; the direct road reads the f64 vector, so the
   tracers now ride the same f64 numbers the f32 picture is cast from.

## Checks
- `node tests/pwa.test.mjs --write` · `./test.sh node` **0** (`tests/molecular-flow.test.mjs` untouched, 7 PASS) ·
  `node tools/rack-deps.mjs --classes --no-write` **0** · `node tools/new-project.mjs --check` in step (16117 B).
- The light check (one scratch pass on the gate server 9611/5711, the dev link `lab/volumes`):
  - `GREEN L1 benzene WINDING · FLOW on: the tracers ride the ring` — 220/220 alive, max speed 2.35, 60.6 presents/s, no errors.
  - `GREEN L2 aspirin 6-31+G* (263 AOs) from VOL. I · HOMO + LUMO · FLOW on: the tracers flow` — opened from its record in 24 ms (no
    solver call), 220/220 alive, max speed 1.40 (5.30 playing), 13.8 presents/s with FLOW (METERS' fps 10.6 at the read), 22.5 without.
  - Screenshot: `P1-aspirin-flow.jpg` (104 KB) — C₉H₈O₄, the HOMO + LUMO packet's phase, the tracers on it.

## Left
Nothing in P1's scope. The kicked molecule's FLOW (P2 brings the factor form, Σ_occ) and STATES' FLOW keep their n² matrices.
