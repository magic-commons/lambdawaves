# F1 THE CURRENT ON THE PLANE — build note (Opus builder, 2026-10-16)

Branch `f1-current` from BASE `9aa8fb7`. `lab/` lines 30,028 → **30,086 (Δ +58, budget +60, cap 30,328)**.

## Seats
- `lab/slice.js:82–92` `currentOf({ re, im, N, half, mode })` → `{ ja, jb, max, at, N }`: j_∥ = Im(ψ̄ ∇_∥ψ) = re·∂im − im·∂re by centred
  differences of the sample's own re/im (no second evaluation of ψ). i runs along e₁ (a, screen x), j along e₂ (b, screen y, downward, as the
  image rows are). The edge ring is **dropped** (j = 0 there). Pure, beside `sampleSlice`, so node can import it.
- `lab/sliceview.js:73` the state: `current` (the seg), `mir` (the MIRROR of the rows on screen), `one` (the one label or null).
- `lab/sliceview.js:89–91` the CURRENT seg OFF · ARROWS · LINES in the PLANE row (beside PLANE/EXTENT/GAIN). A change repaints without resampling.
- `lab/sliceview.js:109–110` the CURRENT readout beside PLANE's, hidden (display none) while OFF.
- `lab/sliceview.js:139–140, 190, 195` the mirror: allocated per resolution at `startJob`, rows copied as they are coloured, all of it on completion.
- `lab/sliceview.js:217` `paint()` calls `drawCurrent` after the phase image and crosshair, only when `current !== 'off'`.
- `lab/sliceview.js:224–257` `drawCurrent`: ARROWS — stride round(N/20) (≈ 21 × 21 at 128², the same at 64² drag), centred on the lattice point,
  length = stride·√(|j|/|j|max) ≤ one quiver cell, two-stroke head, `themeInk` ink at 0.8, lineWidth 1, no glow. LINES — 28 seeds by rejection on
  |j| (≤ 4000 tries) from a FIXED Park–Miller sequence, RK2 (midpoint) on the bilinear j, unit-speed step 0.7 cell, ≤ 240 steps, stopped at the
  edge ring, below 1e-3·|j|max, or on closing a loop. Readout `|j|max 0.00183 a.u.` with the sub-line below.
- `lab/sliceview.js:295` `update()` reads the one label (`reg.renderSet().ids.length === 1`) only while CURRENT is on.
- `lab/sliceview.js:330, 334` save/load (see persistence).
- `lab/windows/readouts.js:96–97` `api.owner()`: a molecule (`app.state.chem.on`) or the STURMIAN scale (`app.sturm.P`) → the seg stands down
  with its sentence in the readout and paints nothing.

## The readout (every number computed)
- One label with m ≠ 0, ℝ³ plane: `exact |m|ρ/(r sin θ) = … at the max · Δ …, the grid's difference` — ρ from the sample at the argmax, j = |m|ρ/(r sin θ) φ̂
  projected into the plane (e₁, e₂), so a tilted plane is exact too.
- One label with m = 0: `a real eigenstate carries no current`.
- KS plane: `KS: the current of the sampled function on its own plane, not a current of ℝ³`.
- Live (headless, 2p₊, ±4 a₀, 128²): `|j|max 0.00183 a.u. · exact |m|ρ/(r sin θ) = 0.00183 at the max · Δ 4e-7`.

## The oracle (once, `.tmp/f1-oracle.mjs`, not committed)
2p₊ through `sampleSlice` (z-normal plane, ±8 a₀, N = 128, h = 0.125) against `bohmVelocity`'s v·ρ at ten grid points:
worst relative miss **4.70e-3** (at (0.81, 0.06), nearest the vortex; 1.2e-5 … 2.5e-3 elsewhere — O(h²)).
|j|max = 0.00182704 at (0.6875, −0.6875) vs exact ρ/(r sin θ) = 0.00182897 there, **Δ 1.9e-6** (the global exact max is e⁻¹/(64π) = 0.0018294 at r = 1).
1s: |j|max **0** · 2p_z: |j|max **0** (exactly — re·Δim − im·Δre cancels for a real function times a global phase), < 1e-12 as required.

## Persistence
The PLANE card already persists into PROJECT (`readers.slice`, `lab/shell/persist.js:55/266` via `slice.save()/load()`). CURRENT **rides that line**:
`save()` writes `current` only when it is ARROWS or LINES; OFF writes no key, so the new-project file, old projects and every OFF save are
byte-identical (`tools/new-project.mjs --check` green with no regeneration). `load()` restores the seg; a project without the key opens OFF.

## THE LOCK
OFF: `paint()` runs exactly today's code (the overlay branch is never entered), no field write anywhere (`lab/field.js` untouched). The mirror copy is
a memcpy of rows into F1's own arrays and touches neither the image nor the field.

## Corrections to the brief
1. **h = 2·scale/N, not 2·half/(N − 1)**: the sample is cell-centred (a_i = (2(i + ½)/N − 1)·scale), and scale = √half on the KS plane.
2. `currentOf` lives in **`lab/slice.js`** beside `sampleSlice` (pure, node-importable for the oracle), not in `sliceview.js`; it takes the sample
   (which carries `half`/`mode`), so the signature is `currentOf(sample)`.
3. **The current reads a MIRROR of the rows on screen, not only the settled `sample`**: while the clock plays, `t` moves every frame and no job ever
   completes, so `sample` would freeze; the mirror moves with the picture the eye sees.
4. **Streamlines are recomputed per paint from a fixed seed sequence** rather than stored and re-seeded on a key move: identical data → identical
   lines (no flicker on a still sample), and a moving sample re-seeds itself; ~0.5 ms, no extra state.
5. The exact is shown for **any one label with m ≠ 0** (|m|ρ/(r sin θ) is exact for every |n l m⟩), 2p₊ included; m = 0 prints the real-eigenstate sentence.

## Dropped
Arrowheads on LINES (ARROWS gives the direction); both-way integration of a streamline; an extra repaint when a molecule takes the field while the
PLANE is settled (the sentence appears on the next paint — a hover, a state change, a seg press).

## Gates
`node tests/pwa.test.mjs --write` · `./test.sh node` exit 0, no RED · `node tools/rack-deps.mjs --classes --no-write` exit 0 ·
`node tools/new-project.mjs --check` "in step (16117 B)". ESM `--check` of the three files. One headless check on 9591/5691 (`.tmp/f1-snap.mjs`):
no page errors; screenshots `.tmp/f1-arrows.png` (crop `.tmp/f1-arrows-crop.png`), `.tmp/f1-lines.png`, `.tmp/f1-off.png` — 2p₊'s quiver circulates
about the vortex, the lines are concentric circles, OFF is the clean phase image.
