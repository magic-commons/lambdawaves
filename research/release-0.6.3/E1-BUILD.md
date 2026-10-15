# E1 THE EVENT CLASSIFIER — build note (Opus 5.5, 2026-10-15)

Branch `e1-event-classifier` off the 0.6.2 cut tip `52543cc`. Row E1 of `BUILD-PLAN.md`.

## What landed
- **`classifyEvent(re0, im0, ids, x, y, z, t, { psi, E })`**, `lab/frontier.js:550–573`, beside `stretchedCensus`. It is pure. It evolves c_a(t) = c_a(0)e^{−iE_a t} and takes F_t = Σ(−iE_a)c_a(t)φ_a in closed form (one ψ evaluation with the coefficients (E·Im c, −E·Re c)). J = [∇Re ψ; ∇Im ψ] is a 2 × 3 matrix. The rank test takes the eigenvalues of JJᵀ, with σ₂ > 1e-7‖J‖_F meaning rank 2:
  - **rank 2** gives `line`, with tangent ∇Re × ∇Im and node velocity V = −Jᵀ(JJᵀ)⁻¹F_t.
  - **rank 1** takes μ as the top left singular vector and λ ⊥ μ. T is the orthonormal 2-plane ⊥ the live row μᵀJ, which is the plane tangent to {μ·F = 0}. The build plan's "kernel of λᵀJ" is the whole of ℝ³ at rank 1; the plane meant is ker μᵀJ. Then H = −Tᵀ D²(λ·F) T / (λ·F_t), and H ≻ 0 gives `birth`, H ≺ 0 gives `death`, and an indefinite H gives `saddle`.
  - **`unclassified`** covers rank J = 0, and also rank B < 2, which here means |λ·F_t| ≤ 1e-7·|F_t|.

  It returns `{ kind, eig: [h1 ≤ h2] | null, V | null, tangent | null }`. `opt.psi` / `opt.E` swap in a different basis, which is how the QHO oracle runs.
- **The census azimuth** is at `lab/frontier.js:544–546`. Each `stretchedCensus` point gains a `phi`, which is the argument of the double root w = −g₀/2g₊ at t₀. Nothing else in the return shape changed.
- **VORTEX** is in `lab/vortex.js`:
  - Header comment: lines 9–11.
  - Label `RECONNECTION CENSUS` becomes `EVENT CENSUS`: line 28.
  - JUMP title becomes "Jump to the next event": line 30.
  - The note now uses the event language (regular line · birth · death · saddle): line 31.
  - Lines 48–53 classify every admissible census point at (ρ cos φ, ρ sin φ, ±z, t₀) and store the events on `census.events`, so `__LW.vortex.census.events` reads them. The readout value is a count for each kind, as reported by the classifier, then t₀ ∈ {…} of T_d. The sub lists `(ρ, ±z) = (2.046, ±1.843) · saddle · H -24.5, 24.5 · …`. When t₀ is null (degenerate beats), the event is reported as `unclassified`.
- The live locator's points are **not** classified. I skipped this as the brief preferred.

## The derivative route
- **∂_t** is exact, from the register's closed form. No difference is taken in t.
- **∇F** uses centred differences in f64 with h₁ = 1e-5·(1+|x|).
- **D²(λ·F)** is taken only along T, as directional centred second differences (9 ψ evaluations) with h₂ = 2e-4·(1+|x|).

## Finding: the census point is not at φ = 0
The brief assumed the census azimuth is φ = 0. It isn't. At φ = 0, |ψ| is 1e-4 to 1e-6 at every recon point, so the point is off the node and classifies as `line`. The real event sits at φ = arg w:
- φ = π for t₀ = 0;
- φ = 0.4345 and −2.7071 for t₀ = 240.63.

At those azimuths |ψ| is about 1e-18. The census now carries `phi`, and VORTEX classifies there.

## The recon census as measured (f64, in node and in the browser)
| (ρ, ±z) | t₀ | kind | H eigenvalues |
|---|---|---|---|
| (2.046, ±1.843) | 240.63 | saddle | −24.489, +24.489 |
| (0.579, ±6.341) | 240.63 | saddle | −455.341, +455.341 |
| (0.673, ±6.475) | 0.00 | saddle | −336.315, +336.315 |
| (0.212, ±14.325) | 0.00 | saddle | −3412.710, +3412.710 |
| (0.207, ±14.328) | 240.63 | saddle | −3566.475, +3566.475 |

All ten events are **saddles**, with t₀ ∈ {0, 240.63} and T_d = 481.265. This reproduces Round 2 L-1 (mpmath dps 40: ±24.5, ±455, ±336, ±3413, ±3566). The ±z pair of each point classifies identically. Mirror symmetry makes this exact: l + m is even for stretched modes. The readout prints `10 saddles · t₀ ∈ {0.00, 240.63} of T_d = 481.27 a.u.`.

## The QHO oracle (a hand check, `.tmp/e1-oracle.mjs`, not committed)
The oracle uses the Cartesian oscillator modes 000, 100, 020 and 002, with E = 1.5, 2.5, 3.5 and 3.5. The coefficients are Re c = (√2, 1, 1, 1) and Im c = ((β_y+β_z)/√2, 0, β_y, β_z). These give ψ(0) = 0, ∇Re ∥ x̂, ∇Im = 0 and λ·F_t = 2√2 g. That makes H = diag(−β_y, −β_z) exactly.

| case | expected H | classifier result |
|---|---|---|
| β = (−1, −1) | I | `birth`, (0.99999998, 0.99999998) |
| β = (1, −1) | diag(−1, 1) | `saddle`, (−0.99999998, 0.99999998) |
| β = (1, 1) | −I | `death` |
| β = (−2, −½) | diag(2, ½) | `birth`, (0.49999999, 1.99999995) |

The relative error is 2.3e-8 in every case. A generic point (0.3, 0.2, 0.1) gives `line`, with a tangent and a velocity. Classifying all ten recon events takes 3.2 ms in node. The whole VORTEX locate at 'fine', census included, takes 20 ms in headless Firefox; it runs once per register version.

## Gates
- `node tests/pwa.test.mjs --write` refreshed the precache hashes for frontier.js and vortex.js in `lab/sw.js`.
- `bash test.sh node` exited with **rc 0**.
- Browser: I served this worktree on 9291 (stopped by pid afterwards) and ran a throwaway driver, `.tmp/e1-browser.mjs`, through `tools/gate/gatekit.mjs`. It loads `recon`, calls `__LW.vortex.setOn(true)` and `locateNow`, and reads the result. There were no page errors. `census.count` is 10, all 10 `census.events` kinds are `saddle`, and the eigenvalues match the table. The card shows `EVENT CENSUS` with the new value, sub and note.
- I did not run THE LOCK. The classifier moves no texel, so it is the integrator's at the cut.

## Lines
`lab/` went from 28,504 to **28,533** (+29; the budget was +45).

## Deferred
- Classifying the locator's live points.
- An "on the node?" guard (|ψ| ≈ 0) inside `classifyEvent`. Today it trusts its caller to hand it a nodal point. Off the node it reports the local J rank, which is `line`.
- The `recon` preset's note in `lab/state.js` still says "reconnect". A saddle is that reconnection, so I left it.
