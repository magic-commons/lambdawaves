# 025 · CHAIN B — THE FILM IS THE SCREEN · BUILD (Opus builder, branch `it025-B`, base 2fda4dc7, 2026-10-28)

No kit door: `lab/mir/**` untouched (the NODES and CHROME rows are λWAVES' own, seated under the kit's AUDIO row in `film-card.js`; C3 may move
them into the kit's re-laid rows). Rack `app` literal untouched; `rack-deps --classes` HOLDS (persist 24/25).

## Rows
- **B1 RENDER BAKES THE GRAPH** (e2dce32b) — new `lab/film-bake.js` `createBake(app)`, handed to `createFilm` as `opts.bake` (`windows/film.js`);
  `frame()` calls `bake.apply(J, rgba, w, h, i, t)` after the witnesses and BEFORE the digest, so the frame log covers the baked picture. The chain
  compiles at the film's scale (`nodes.js compileAt(k)`: a PRIMITIVE's px knobs × k, DISPLACE's frequency ÷ k; k = film px per stage CSS px) and runs
  as the same SVG filter markup through a 2-D canvas (`ctx.filter = url(#…)`, the kit's `pictureFilter` on a detached element). LAYERS in graph
  order (`node-layers.js paintLayer`): the noise tile is now SEEDED (`hash32`, the shader's own hash — stage and film share it), FILM GRAIN's jump
  hashed from the frame index, VIGNETTE's ellipse and SCANLINES' pitch as the CSS draws them × k. SHADER: `node-shader.js bake(values)` runs the
  same SPLAT + TONE from the film's own tap (the readback's present, at the film's size) into rgba8unorm and reads it back; drawn under the chain's
  filter as the stage mirrors it. The 024 WGSL jitter reads (cell, copy, PHASE) only — nothing per present — so it was left as it is: hashing the
  frame index in would make the film shimmer where the stage stands still. PHASE is whatever the record clock's modulation wrote for that frame.
  Card rows: NODES (ON · THE SCREEN'S GRAPH default · OFF · THE FIELD ALONE) and CHROME (LABELS default · OFF), stored `lambdawaves.q0.render.nodes|chrome`,
  read at the take (`describe` → `app.pending` → the job, so a RESUME keeps them). An empty graph returns the readback untouched.
- **B2 THE OVERLAYS** (0ae077c8, b5b7c7d1) — IN: PARTICLES (a film-owned ensemble, `seed(n, reg, t, half, seeded(13))` at the film's first frame,
  `advance` by the stage's RK4 to each frame's t — exactly rate/fps a step — `draw(obs, half, box)` at the film's box); THE SKELETON + BEAD (its own
  `createSkeleton` instance fed `LW.skeletonArgs(t)`, the loop's args now one function in `rack.js`; the bead's trail starts at frame 0); VORTEX
  (exact nodal points at t) and KEPLER (orbits from exact expectations), drawn by their owners at the film's size (their canvas' CSS box and
  `devicePixelRatio` read as the film's for one synchronous call, then redrawn at the stage's). OUT by name: FLOW (Math.random respawns),
  the impulse vector (a held gesture), the KaTeX words. `HAZARDS.overlays` is now λWAVES' (owner `app`); the readings ride in
  `manifest.picture.baked` / `film.last.baked` and `hazards()`.
- **B3 THE WORDS** (621d62f8) — `stage-words.js labelsAt(id, W, H, obs, half)`: the ATOM LABELS by the same `toScreen` law over the film's box
  (font 14 × SIZE px × k, white under `difference`); the ESP BAR: its stage box, ramp stops (its own gradient), numbers (font, colour, shadow)
  mapped onto the frame. STAGE FORMULA / NAME / SUBTITLE stay OUT (call 4), said in the readings.
- **B4 THE OBEDIENCE AUDIT** (c7ecc448) — `render-exact.js audit()` (pure) + `fileFacts()` (the MP4's moov via the kit's `mp4Parse`: avc1
  size, stts fps, sample count, the audio trak's edit; PNG: IHDR + the parts' frame ranges); `film-card.js` wraps the recorder's `run`: options,
  the kit's plan at the tap and the stage box → `film.last.audit`; a lying row is said ("RENDER DISOBEYED: …"). FIXED: (1) CURRENT was the canvas
  backing store (CSS × DPR × AUTO SCALE) — now the stage's CSS box at DPR 1, even; (2) a MOLECULE film ABORTED on frame 0 (`fieldclock: advanced
  0 times`, at 2fda4dc7 too): a molecule's kernel computes only when its volume is dirty, so the witness takes 0 or 1 under a molecule.

## The audit (`tools/perf/film-obey.mjs`, Firefox gate 9691, every run a real RENDER press — 19 runs, EVERY SETTING OBEYED)
| setting | witness | where it is read | result |
|---|---|---|---|
| SIZE current · 1080p · 1440p · 2160p | asked = result = frames drawn = avc1 / IHDR, even | kit result · `ctx.width/height` · moov | 1280×714 · 1920×1080 · 2560×1440 · 3840×2160 ✓ |
| IMAGE ×1–×4 | `capture.picture` = canvas × s | the card's picture road | 1280×714 … 5120×2856 ✓ |
| FPS 24 · 30 · 48 · 60 | result = video stts timescale/delta | kit result · moov | ✓ |
| LENGTH · FRAMES · DURATION | round(len·fps) = result = λWAVES' log = stsz count; frames/fps = mdhd | plan · log · moov | 0.5 s → 15 ✓ |
| START AT | round(start·fps)/fps = result.offsetS | kit result | 0.2 s → frame 6 ✓ |
| RANGE ACTIVE · SELECTION · PERIOD | first beat = range start, last + 1 frame = end (±½ frame), every frame's `ctx.beat` | frame log | 0→2 · 0.5→1.5 · ONE PERIOD's schedule ✓ |
| FORMAT MP4 · PNG | the file's own boxes | moov / PNG signature | ✓ |
| MODULATION · TIMELINE | asked = result | kit result | ✓ |
| AUDIO ON · OFF · PNG | samples = round(frames·48000/fps); audio edit = frames/fps; OFF = 1 trak | `res.audio` · moov | Opus 192000 = 4 s; WAV 192000 ✓ |
| NODES · CHROME | asked = the job's flags; IN/OUT readings | `film.last` | ✓ |

## Determinism (B1's proof, `tools/perf/film-bake.mjs`, `captureUI.exact.verify` 6 frames × 320, twice per call, two calls = four runs)
- EMPTY graph, before (2fda4dc7 lab) and after: `db9513b771c45eff 84c63cb27e028b65 4fa6edcfab7a865e 6ea1626eb932f6e3 4a1613958a4dc8b5 4b87943f815202f4` — identical bytes.
- CURVES (S) + FILM GRAIN + DECOHERE: `d2ac77b77577a7e7 102ed238c39a7428 16ff9237b481754e ed283d3c8150ff13 576542c747f75d2e b83dc650ab134d25` in all four runs.
- PARTICLES + VORTEX: `319ba7427398aa2b …2943cf790feb8944` ×4 · H₂O under ESP (labels + bar): `17355f812fab3905` ×6 frames ×4 runs.
- Shots (`B-shots/`): B1 graph, B2 particles, B3 words — each the stage's screenshot beside a film frame at the same t; they match to the eye
  (B2's particles differ in place by design: the stage seeds from Math.random, the film from 13).

## Tests
render-exact.test GREEN 40/40 (re-aimed: `overlays` is λWAVES' hazard now) · film-handover GREEN · curves GREEN · film-probe (picture, loop, video,
frames, verify: all ok, 0 page errors) · `./test.sh node` EXIT 0 · pwa --write · new-project --check in step · mir-manifest PASS · rack-deps HOLDS.
THE LOCK (gate 9691/5691): 843 values · 0 moved · unrepeatable none; s4a fixture 987 values · 0 moved — no flake, no re-run.
Tools: `tools/perf/film-bake.mjs` (determinism + shots), `tools/perf/film-obey.mjs` (the audit walk).

## The law sentence (docs/laws/film.md, and nodes.md's "Screen only" line)
THE FILM IS THE SCREEN (025 B): `lab/film-bake.js` lays over each film frame, at the film's scale and as a function of the frame alone, the NODES
graph (compiled at k, the grain hashed from the frame index, a SHADER node baked from the film's own tap), the overlays that are functions of
(t, camera, seed) — PARTICLES reseeded from 13 at frame 0 — and the words (ATOM LABELS, ESP BAR), and names the rest OUT; the digest is over the
baked picture; NODES OFF · CHROME OFF give 024's field; EVERY SETTING IS A WITNESS (`render-exact.js audit`, `film.last.audit`).

## Open questions for Josh
1. Pre-existing at 2fda4dc7: after a film with the clock paused and VORTEX raised, the stage stays black until the next present (the probe forces one).
2. Scale k = film width ÷ the stage's CSS width: a 4K film from a 1280-px stage draws grain, labels and lines 3× bigger — the screen's look. VORTEX
   and KEPLER draw at most at ratio 2 (their owners clamp it), then scale. Say if you want the film's own pixel pitch instead.
3. A RESUMED film reseeds PARTICLES at its first resumed frame (a full run is exact).
