# 027 chain N — THREE SHADER NODES · BUILD (Opus builder, 2026-10-29)

Branch `it027-N` from `1fb3b831`, one commit per row. No kit file: MIR 1.5.6-alpha.17 unchanged. Files: `lab/node-shader.js` (the three types,
their WGSL, the host refactored to a pass table: `pipe(name, format)`, one bind-group helper, per-type branches), `lab/nodes.js` (2 lines: a hand
on a knob or RESET calls `gpu.restart(id)`), `lab/icons.js` (3 glyphs), `lab/film-bake.js` (1 line: `bake(l.values, i, l)`), `lab/sw.js` (pwa --write),
`tools/decohere-shots.mjs` (`NODE=` any SHADER type, `JPG=1`, `WAIT=`), `tools/perf/film-bake.mjs` (step `shaders`), `docs/laws/nodes.md`.

## The nodes
- **FEEDBACK** (N1): acc = max(GAIN·picture, DECAY·acc′), where acc′ is the last acc moved by DRIFT (up), ANGLE (about the centre) and SCALE (zoom),
  read back bilinear from a ping-pong rgba16float pair; the canvas shows mix(picture, acc, MIX). I built it first as a screen blend: it washed a dark
  ground to grey (its fixed point lifts the floor), so it is now a LIGHTEN, and the ground stays the ground.
  Knobs: DECAY 0.9 · DRIFT 1.5 px · ANGLE 0° · SCALE 1 · GAIN 1 · MIX 1 (neutral at MIX 0). Not HEAVY (no splat).
- **REFRACT** (N2): the luminance × LENS is a water surface. Its slope is a Sobel across SCALE px, each grid ray from above is bent by WGSL `refract`
  (air → water, 1/1.33) and carried DEPTH px down, through DECOHERE's own one/one splat and TONE, so where the rays cross the light piles up into caustics.
  FRINGE scales each channel's slope (a lens per channel). Knobs: LENS 20 px · SCALE 3 px · SAMPLES 6 · DEPTH 120 px · FRINGE 0.2 · GAIN 1 ·
  COLOUR PICTURE · GROUND BLACK. HEAVY. Neutral at LENS 0. One SPLAT shader serves both (a `mode` uniform). DECOHERE's branch is byte-identical,
  proven below.
- **FLOW** (N3): COUNT points (x, y, life, moved) live in two storage buffers, and a compute pass moves each SPEED px along the gradient once a step:
  LUMA, or HUE, whose wrapped hue difference is gated by chroma (under PHASE it is the phase gradient, the current's direction). A point is born
  at a place and a life (20 – 120 steps) hashed from its index, the step and 13, and is born again when its life runs out or it leaves the frame.
  One pass fades the last trails × DECAY, then lays this step's segments as WIDTH-px quads, one/one; then TONE.
  Knobs: COUNT 8192 · SPEED 2 px · DECAY 0.94 · WIDTH 1 px · GAIN 1.5 · SOURCE LUMA · COLOUR PICTURE · GROUND STAGE. Neutral at GAIN 0.
- Every number knob is a target `nodes.<id>.<knob>` (nodes.js `enroll` is generic). Hints are all ≤ 60 (`hints-census --check`: 0 over).
- **STATE LAW**: a stateful node (FEEDBACK, FLOW) starts from black when placed, on a size or COUNT change, when a hand moves a knob or RESET is
  pressed (`restart(id)`), and at a film's frame 0. It steps once per tap (a present). A knob change does not draw a step of its own: it asks
  for a present. So a modulator's write steps on with the new value and never wipes the trail.
- **Glyphs** (16-unit n16): nodeFeedback is a loop arrow with a dashed tail, nodeRefract a wave over a lens arc, nodeFlow three streamlines.
  Card rows: 3 knobs a row at 71 px, column to column, as DECOHERE's (probe `.tmp/card-probe.mjs`, not kept).

## Film determinism (`tools/perf/film-bake.mjs`, verify 6 frames × 320, two calls = four runs, gate 9689/5689)
- FEEDBACK + REFRACT + FLOW: `000023b2b39cf650 e0897d78928e9a9a 1d52d5abd1ff0b8d 2bb7f13c2b01d4b3 a719b10ae018ebe0 6fea2fda37bbc745`, the same in
  all four runs. The film keeps one record per node id. `i === 0` starts it from black, and a repeated index re-does that step instead of taking another.
- CURVES S + GRAIN + DECOHERE after the refactor: `d2ac77b77577a7e7 … b83dc650ab134d25`, identical to 025 B1's digests. DECOHERE did not move.

## Shots (`N-shots/`, 960-px JPEG, hydrogen 1s+2p₀ default, dark, governor off, 1280 × 714 stage, playing)
`fb-home`, `fb-spiral` (ANGLE 3 · SCALE 1.02 · DECAY 0.96: a Lieberman spiral) · `rf-home` (the cloud's terraces fold into ring caustics),
`rf-deep-ink` (LENS 30 · DEPTH 200 · INK: the lines doubled into fringed ribbons) · `fl-home`, `fl-ink-black` (30 000 points, SPEED 4: the points
climb onto the frame and the axes, and the trails radiate from them).

## Tests
`./test.sh node` EXIT 0 (`.tmp/node-N.log`) · `pwa.test --write` · `hints-census --check` 0 over · rack-deps HOLDS (24/25) · THE LOCK not run (yours).
`tests/curves.browser-test.mjs` is RED at line 56 (the snapHash does not change after a CURVES grade). It is RED on the base too: I ran it with the
base `1fb3b831` lab files and got the same assert. It is not this chain's; it is worth a look on the integrator's gate. No tests/nodes* exist, so no type count moved.

## The nodes.md sentences (in THE SHADER NODE paragraph, landed)
FEEDBACK: the last output × DECAY, moved and LIGHTENED under the fresh tap · REFRACT: the luminance a water surface, rays bent DEPTH down and splatted,
so the folds are the caustics · FLOW: COUNT points from seed 13 along the LUMA/HUE gradient, trails × DECAY · the STATE LAW above.

## Open questions for Josh
1. FEEDBACK's DRIFT is straight up (smoke rising), and there is no direction knob because of the ≤ 6 cap. Should DRIFT follow ANGLE's direction instead?
2. The stage steps once per present, so a trail's length in seconds follows the frame rate (30 vs 60 Hz). Should it step on the clock instead?
3. FLOW follows +∇ (as the row says), so LUMA points pile onto the bright lines. Is the iso-line flow (∇ turned 90°, circling the cloud) wanted as a SOURCE?
4. A film RESUME that starts mid-film continues from the film's last state, not from frame 0's chain. Is that acceptable, or should RESUME re-run from 0?
