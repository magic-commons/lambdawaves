# E2 ANGULAR NODES — build report (0.6.3 "Event Census")

Branch `e2-angular-nodes` off `52543cc` (the 0.6.2 cut tip). Builder: Opus, for the integrator (Claude Yan, `yan-c`).

## What landed

A sphere in VORTEX that draws the nodal set of Y_lm for one populated label, on the existing overlay canvas (`#vortex`).

- **`lab/angular-nodes.js`** (new file, 40 lines)
  - `angularNodes(l, m, { real })` (line 8) returns `{ latitudes: [θ…], meridians: [φ…], poles }`.
    - The latitudes are the l − |m| roots of P_l^{|m|}(cos θ) in (0, π). The code looks for sign changes of `legendreP(l, |m|, cos θ)` on a 720-step θ grid, offset by half a step so no sample lands on a root or a pole. Each bracket is bisected until the midpoint can no longer move (the last bit), and the endpoint with the smaller |P| is kept.
    - In REAL mode, the meridians are `φ = (k + ½)π/|m|` for k = 0 … |m| − 1. There are |m| great circles, and each one also contains φ + π.
    - `poles` is set only in COMPLEX mode with m ≠ 0. In REAL mode the poles already lie on the meridians.
  - `drawAngularNodes(g, S, R, nodes, style)` (line 17) draws through the field camera's `toScreen` object `S`.
    - Each latitude is a 96-segment circle. Each meridian is a 96-segment great circle.
    - The poles are dots of radius 3.2 px.
    - A segment whose mean depth is greater than the depth of the sphere's centre is drawn at alpha 0.22, otherwise 0.9 (poles: 0.3 / 0.95). The ink is amber `255,190,90`, so it stays distinct from LOCATE's cyan points.
  - `createAngularNodes(host, cv, base)` (line 24) builds the UI and returns VORTEX's pass wrapped: `{ update, suspend, drawOverlay }`.
    - The UI sits on VORTEX's third row after JUMP TO EVENT. In order:
      - an `ANGULAR NODES` switch (`sw`, off by default)
      - a `LABEL` seg over `reg.renderSet().ids`, using the names in `BASIS[a].label` (e.g. `3d₊₂`). It defaults to the first populated label and keeps the current pick while it stays populated. The seg is rebuilt only when the populated set changes.
      - a `Y_lm` seg, `REAL | COMPLEX` (default REAL; VORTEX's `api` does not carry the app's VIEW)
      - a readout, `LATITUDES · MERIDIANS`. Its value reads `n latitudes · k meridians[ · poles]`. Its sub lists the θ roots in degrees, then `sphere r = half/2`.
    - `draw` (line 28) has two cases:
      - **LOCATE's overlay is drawing** (`base.locating()` is true, i.e. `show.get() && last`): VORTEX's own `drawOverlay` runs first and keeps its own sizing, clear and transform. The nodes are then painted on top.
      - **Otherwise:** the module sizes, clears and sets the transform of the same canvas itself, the same way VORTEX does (no reallocation while the size holds).

      With the switch off it only calls VORTEX's `drawOverlay`, which redraws LOCATE's points or returns the canvas to 1×1.
    - `update` (line 32) runs VORTEX's update and then does its own work.
      - Its key is: label · mode · half · `cameraKey(obs)` · dist · fov · canvas size.
      - It redraws only when that key changes. When idle it does nothing; with the switch off and nothing drawn it reads nothing.
      - When LOCATE relocates while playing, its `drawOverlay(obs)` resolves to the wrapped draw, so the nodes are repainted over the fresh points.
    - `suspend` (line 39) resets the key and calls VORTEX's `suspend`.
- **`lab/vortex.js`: +2 lines, no existing line edited**
  - line 17: `import { createAngularNodes } from './angular-nodes.js';`
  - line 94, just before the `return`:
    ```js
    ({ update, suspend, drawOverlay } = createAngularNodes(r3, cv, { update, suspend, drawOverlay, locating: () => show.get() && !!last }));   // E2: ANGULAR NODES (third row) wraps the overlay pass
    ```
    This line rebinds VORTEX's three function declarations to the wrapped ones. A function declaration is a mutable binding, so this works in a module.
    - Every internal call goes through the rebound names: the `drawOverlay(obs)` calls inside `update`, OVERLAY's `onChange`, and `setOverlay`. The returned object (`update`, `suspend`) also reads them.
    - This gives full composition with LOCATE (nodes over the points, or alone) in 2 lines. Without it, the work needed one hook in `update` and another in `drawOverlay`: 4 lines.
- **`lab/sw.js`**: the precache rows rewritten by `node tests/pwa.test.mjs --write` (+1 row for `./angular-nodes.js`, plus the new `vortex.js` hash).

## Conventions

- **Real combination:** REAL means Re Y_lm in the app's own convention (`hydrogen.js` `ylm`: Condon–Shortley, complex physics Y_lm). For either sign of m this is ∝ P_l^{|m|}(cos θ) · cos(|m|φ). The meridians are the zeros of cos(|m|φ): φ = (k + ½)π/|m|, measured from +x in the field's own coordinates.
- **Complex:** |Y_lm| ∝ |P_l^{|m|}(cos θ)| vanishes on the latitudes. When m ≠ 0 it also vanishes at the poles, because of the sin^{|m|}θ factor.
- **Sphere radius:** R = half / 2, half the domain's half-width. This is said in the readout's sub.

## Hand checks

Run with `node .tmp/e2-check.mjs`, a throwaway script, not committed. Each line reads (l, m) → latitudes θ / meridians φ / max |P_l^{|m|}(cos θ)| over the roots.

| (l, m) | Latitudes θ | Meridians φ | Max \|P\| |
|---|---|---|---|
| (3, 0) | 39.2315°, 90.0000°, 140.7685° | none | 9.2e-17 |
| (3, 2) | 90.0000° | 45°, 135° | 9.2e-16 |
| (5, 5) | none | 18°, 54°, 90°, 126°, 162° | 0 (no roots) |
| (3, −2) | 90° | 45°, 135° (same as m = +2, as Re Y_lm requires) | — |
| (5, 1) | 40.0881°, 73.4273°, 106.5727°, 139.9119° | 90° | 1.3e-15 |
| (6, 3) | 58.5178°, 90°, 121.4822° | 30°, 90°, 150° | 3.8e-14 |
| (0, 0) | none | none | — |

- For (3, 0), acos(√(3/5)) = 39.2315°, which matches the expected cos θ = 0, ±√(3/5).
- COMPLEX mode gives the same latitudes with no meridians. `poles` is true exactly when m ≠ 0.
- Every root satisfies |P_l^{|m|}(cos θ)| < 1e-12. The worst is 3.8e-14 at (6, 3).

## Gates

- `node tests/pwa.test.mjs --write`, then `bash test.sh node`: **rc 0, 0 red**.
- **Browser** (throwaway `.tmp/e2-browser.mjs`, Firefox headless through `tools/gate/gatekit.mjs`, this worktree served on 9301, server stopped by pid). Default project, populated 1s₀ and 2p₀. Results:
  - The `ANGULAR NODES` switch exists, and the canvas starts at 1×1.
  - Switch on with LOCATE off: the canvas becomes 1500×1014, LABEL lists `1s₀*` and `2p₀`, and the readout says `0 latitudes · 0 meridians`.
  - Pick 2p₀: the readout says `1 latitudes · 0 meridians` with sub `θ = 90.00° · sphere r = half/2`, and 3067 pixels are inked (the equator).
  - COMPLEX: same latitude, same ink.
  - LOCATE on with OVERLAY ON FIELD: still 3067 pixels inked. That state has 0 nodal points, so these pixels are the nodes drawn over LOCATE's pass.
  - Switch off with LOCATE still on: 0 pixels inked (VORTEX's own pass alone).
  - LOCATE off: the canvas returns to 1×1.
  - `__e` is empty throughout.
- THE LOCK is not run: an overlay canvas never reaches the GPU readback. The integrator runs it at the cut.

## Lines

`find lab -name '*.js' -not -path 'lab/mir/*' | xargs cat | wc -l`

| | Lines |
|---|---|
| Before | 28,504 |
| After | 28,547 |
| Δ | **+43** |

The +43 is `angular-nodes.js` 40 + `vortex.js` 2 + `sw.js` 1. `vortex.js` lines touched: **2 added (17, 94), 0 edited**.

## Deferred / notes

- `__LW.vortex` has no getter for the switch, to keep within `vortex.js`'s budget. Drive it through the DOM: the `.sw` labelled ANGULAR NODES in `.dev[data-id="vortex"]`.
- The default label is the first populated one, even when that is an s state (no nodes). A "first with l > 0" default would be a one-word change if Josh prefers it.
- The switch and the picks are not saved in a project (VORTEX's LOCATE/OVERLAY are, in `persist.js` `overlays.vortex`). Adding them is a persist row, outside this row's budget.
- Like LOCATE, a toggle while the loop is idle paints on the next reader tick. It does not schedule a frame of its own.
- E1 (the census readout in `vortex.js`) should merge cleanly. The two added lines sit at the import block's foot and just before `return`, and no existing line was edited.
