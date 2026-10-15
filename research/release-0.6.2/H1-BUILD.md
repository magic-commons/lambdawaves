# H1 CONTINUITY — AS COMPUTED · BALANCED, GATED + RESIDUAL (built 2026-10-15, Opus 5.5, branch `h1-continuity` off `yan-c` 1a9c3d8)

## What landed (seats by line)
- **THE REPAIR** — `lab/flow-balance.js` (new, 66 lines). `balance({ N, half, rho, src, j })`: Round 1's design with Round 2's fixes.
  Floor mask ρ > 1e-7, then the largest 6-connected component; harmonic-mean face weights; no-flux faces; c = Σs/Σρ removed; the zero-RHS
  guard; Jacobi-PCG to a relative residual of 1e-4 (cap 4000); the FACE-FLUX cell current → `gx, gy, gz`; `kinetic` = Σρ|∇φ|² / Σ|j|²/ρ.
  `flowBalance(m)` samples ρ, j and ρ̇ = Σ Re Ḋ χχ at the cell centres from the same D the tracers ride. **∇·j is a centred difference of
  j over one cell** (the evaluator has no AO Hessian, and this needs no new AO code). It returns the grid defect ‖s‖/‖ρ̇‖ and, when asked,
  the repair. Worker op `flow.balance` is in `lab/mathworker.js` 151, on the **cards** queue (`solveCard`, `lab/windows/molecules.js`
  line 8 `balance`), so a solve never blocks `chem.rt.run` or the drive.
- **THE HOOK** — `lab/molecular-flow.js`. `createFlow(shells, call)`; `at()` adds ρ·trilinear(∇φ) to j when a repair is set (40–45);
  `setRepair` / `balanced` / `setSource` / `pump` / `said` (70–91). The pump keeps one request in flight, the newest D wins, ≤ 8 Hz under
  BALANCED and 2 Hz under AS COMPUTED (the defect only, no solve). `step()` counts floor refusals for GATED. `FLOW_ORACLE` (23) holds
  Round 1's two measured sentences, keyed C6H6 / H2O.
- **THE SAMPLER'S Ḋ.** STATES register: `statesview.js` `flowDot` (282) is (D(t+δ) − D(t−δ))/2δ with δ = 0.01 a.u. from the register's
  closed form, and the frame's state is re-evaluated afterwards. It is called from `publishState` (319); under the DRIVE there is no Ḋ.
  RT run: `chemview.js` `feedFlow` (517–526) uses the difference of the two latest landings over their Δt, centred half a landing behind.
- **THE UI** — a `FLOW SOURCE` seg (AS COMPUTED · BALANCED) on the FLOW row (`statesview.js` 115, `chemview.js` 200), with REPAIR + GATED
  readouts on the row below (shown while FLOW is on; in chemview, inside `.mol-more`).
  - REPAIR under BALANCED: "x % · of the current's kinetic energy · BALANCED · continuity closed on the grid · residual r (relative)".
  - REPAIR under AS COMPUTED: "0.xx · the finite-basis defect ‖∂ρ/∂t + ∇·j‖/‖∂ρ/∂t‖ on the grid (not an identity in a finite basis)".
  - GATED: "n % of tracer steps refused by the floor".
  - The oracle sentence is the seg's hint; the kit's control-help moves `title` into `data-help`.
  - The FLOW caption (`windows/readouts.js` 87) reads "FLOW · AS COMPUTED · v = j/ρ" or "FLOW · BALANCED · v + ∇φ, continuity closed on the grid".
- **PERSISTENCE** — `flowSource: 'balanced'` on the STATES record beside `flow` (713); absent by default, so old bytes never move. A load
  with no key goes back to AS COMPUTED (708). MOLECULES' RT FLOW is not saved today, so its source isn't either.

## Numbers (measured)
- Breathing Gaussian (a = a′ = 1, half 5), ρ-weighted ∇φ error with face fluxes: **32³ 4.02 %** (12 PCG iterations), **48³ 1.75 %**
  (18 iterations), which matches Round 2's 1.75 %. This is `tests/molecular-flow.test.mjs` §6, the one new case.
- Benzene RING, STO-3G, t = 3, half 10.3, node (same function the worker runs): 32³ sample 327 ms + solve ≈ 44 ms = **371 ms**;
  46 iterations to 8.4e-5; grid defect 1.16; repair = 170 % of the current's kinetic energy. At 48³: 1.2 s.
- Browser (Firefox headless, :9271), benzene RING with FLOW on:
  - AS COMPUTED: REPAIR 1.15 (the defect), GATED 0 %, 219 tracers alive.
  - BALANCED: REPAIR 173.8–175.8 % at residual 9.2e-5, landing 0.46–0.82 s after the press (wall, with frame stepping); tracers keep moving
    (max speed 0.060 → 0.125).
  - Back to AS COMPUTED: the defect returns. No page errors.
- Water RT run (KICK + RUN, FLOW): AS COMPUTED defect 1.32; BALANCED 16.5 % at 6.1e-5, landing 207 ms after the press; 220 tracers.

## Lines
`cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l`: 28,371 → **28,490 (+119)**, under the +120 budget. `lab/flow-balance.js` and `lab/mathworker.js` (151) are inside that glob.

## Commands run
- `node tests/pwa.test.mjs --write` after each lab edit → exit 0.
- `bash test.sh node` → **exit 0** (molecular-flow §4 defect unchanged at 1.1938; §6 new, PASS).
- `node tools/rack-deps.mjs --classes` → exit 0, G-G holds (spectrum 25/25, untouched).
- `LW_PORT=9271 GD_PORT=5371 node tests/register.browser-test.mjs` → **21/22**, run twice, same result. R8 FLOW and R9 FLOW are GREEN.
  The one RED is **R13**. On C₆₀ the library record now carries columns 0–182, so OCCUPIED takes 60–179 instead of refusing with "this
  record carries orbitals 176–183 only". That is ORBITAL-preset / record data, which H1 does not touch. It is not shown red on the base:
  the auto-mode classifier refused the in-worktree base checkout.
- The browser smokes (benzene RING via STATES; water RT via MOLECULES) were throwaway scripts in `.tmp/` and are not committed.
- `tests/lw-facade` was not run. `window.__LW` is untouched: no facade file was edited. `states.setFlowSource` exists only on the internal
  states object.

## Not done
- The DEFECT view as a volume: not this cut, and not mentioned in the UI.
- 48³ "where the frame affords it": `N = 32` only. `flowBalance` takes `N`, but nothing asks for 48 (1.2 s for benzene).
- Ḋ under the DRIVE: none, so BALANCED waits. The worker's ms is not shown in the UI.
- The plan's tracked residual of j″, ‖∂ρ/∂t + ∇·j″‖/‖∂ρ/∂t‖ on a second discretisation: not computed. Under BALANCED, REPAIR shows the
  CG residual, as the brief asked.
