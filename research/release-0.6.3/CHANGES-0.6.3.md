# 0.6.3-alpha "Event Census" — what changed (Claude Yan / Fable 5.1, 2026-10-15)

Josh's dial: tight builds, features only, pre-1.0. Two Opus builders in their own worktrees from the 0.6.2 cut tip `52543cc`; merged E1 `b53fbcf`, E2 `eefe8c1`.
Build notes: `E1-BUILD.md`, `E2-BUILD.md`. Plan: `BUILD-PLAN.md`.

## E1 · THE EVENT CLASSIFIER (`lab/frontier.js` `classifyEvent`, `lab/vortex.js`)
- VORTEX names each nodal EVENT of the one-electron register from exact f64: J = [∇Re ψ; ∇Im ψ], F_t = ∂_t(Re ψ, Im ψ) from the register's closed form
  (no finite difference in time); rank J = 2 → **regular line** (its tangent ∇Re ψ × ∇Im ψ, the node's velocity V = −Jᵀ(JJᵀ)⁻¹F_t); rank J = 1 with
  rank [J | F_t] = 2 → the constrained Hessian on the plane orthogonal to the surviving row decides **birth** (H ≻ 0) · **death** (H ≺ 0) · **saddle**
  (indefinite); otherwise **unclassified**. Spatial derivatives are centred f64 differences (h = 1e-5·(1+|x|); 2e-4 for the second derivatives).
- The census points carry their azimuth `phi`: the double root's argument at t₀ (φ = π at t₀ = 0; 0.4345 / −2.7071 at 240.63). At φ = 0 the `recon`
  points are OFF the node by 1e-4–1e-6 and read "line" — the brief's φ = 0 was wrong; the builder found and fixed it.
- The readout is **EVENT CENSUS**: `10 saddles · t₀ ∈ {0.00, 240.63} of T_d = 481.27 a.u.`, each point `(ρ, ±z) · saddle · H ∓24.5`, counted from the
  classifier — the five RECONNECTION strings are retired. JUMP TO EVENT keeps its press. The live locator's points are not classified (budget).
- **Measured** (`recon` = 3d₊₂ + 4p₊₁ + 5s; f64, node = browser): ten saddles, eigenvalue pairs ±24.489 (ρ 2.046, z ±1.843, t₀ 240.63) · ±455.341 (0.579,
  ±6.341, 240.63) · ±336.315 (0.673, ±6.475, 0) · ±3412.710 (0.212, ±14.325, 0) · ±3566.475 (0.207, ±14.328, 240.63) — Round 2's mpmath values. QHO oracles from
  the 000/100/020/002 modes: birth (H = I) and saddle (diag(−1, 1)) to 2.3e-8 relative, death (−I), birth (diag(2, ½)). Ten events classify in 3.2 ms.

## E2 · ANGULAR NODES (`lab/angular-nodes.js`, two lines in `lab/vortex.js`)
- A sphere (r = half/2) in VORTEX's overlay drawing the nodal lines of Y_lm for a chosen populated label: REAL (Re Y_lm ∝ cos|m|φ) = the l − |m| latitudes
  (the roots of P_l^{|m|}(cos θ), bisected to the last bit) + |m| great circles at φ = (k + ½)π/|m|; COMPLEX = the latitudes alone, plus the poles when
  m ≠ 0. Far side dimmed by depth, amber ink. Controls on VORTEX's third row: ANGULAR NODES switch · LABEL (the populated states) · REAL | COMPLEX · the
  readout `l − |m| latitudes · |m| meridians` with θ in degrees. It draws with LOCATE off too (one wrapper line composes the overlay pass).
- **Hand checks:** (3,0) θ = 39.2315°, 90°, 140.7685° (acos √(3/5)); (3,2) one latitude, meridians at 45° and 135°; (5,5) five meridians; |P| < 1e-12 at
  every root (worst 3.8e-14 at (6,3)).

## The light check (Josh's dial: existing gates only)
- Node gate 0 red after each merge; `pwa --write`; `new-project --check` in step; `rack-deps --classes` clean.
- The two builders' headless checks re-run on the merged tree: recon → 10 saddles, no page errors; the nodes draw and read out, no page errors.
- **THE LOCK ×2 GREEN** at `eefe8c1`: 860 values 0/0 (62 s) and the 1004-value fixture 0/0 (63 s). The classifier and the overlay move no texel.
- **Lines:** 28,504 → 28,576 (+72: E1 +29, E2 +43; cap 28,789).

## Deferred on the dial (recorded)
M5b THE ASYMMETRIC UNIT (a speed-up, waits for a cut that needs the ms); the live locator's points classified per frame; a project row for the ANGULAR NODES
switch and picks; an `__LW.vortex` getter for the switch (drive it from the DOM); the `recon` preset's note still says "reconnect" (a saddle IS that
reconnection). Known: the default LABEL can be 1s, which has no nodes.
