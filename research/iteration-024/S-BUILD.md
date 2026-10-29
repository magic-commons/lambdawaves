# 024 chain S — THE SHADER (DECOHERE) · BUILD (Opus builder, 2026-10-28)

Branch `it024-S` from `1a03a4ad` (the plan commit over 60327c03). One commit per row. Kit untouched: MIR 1.5.6-alpha.11.

## What changed
- **S1 THE TAP** (`lab/field.js`, the only field change): `field.tap(fn | null)`. With a reader set, the canvas is configured with
  `RENDER_ATTACHMENT | COPY_SRC`; `frame()` takes the current texture once, renders into it, and copies it into one kept texture
  (`format`, `TEXTURE_BINDING | COPY_DST`, recreated on a size change) in the same submit, then calls `fn(tex, w, h)` after the submit.
  `setGamut`'s configure carries the same usage. Null re-configures without COPY_SRC and frees the copy. No WGSL, no pixel change.
- **S2 THE NODE** — `lab/node-shader.js` (171 lines incl. both WGSL strings): `SHADER_TYPES = { decohere }`, `createShaderHost`.
  SPLAT: `point-list`, `draw(gw·gh, SAMPLES·nch)`, each point jittered inside its grid cell, reading the tap (luma, or EDGES: the
  gradient's length, 4 reads), a dark point lands off-screen; displaced by a 3-octave gradient-noise field × AMOUNT; one/one into
  rgba16float with weight step²/SAMPLES. TONE: one triangle, 1 − exp(−5·GAIN·ρ) → INK · PICTURE · PALETTE, premultiplied.
  The host draws on each tap and on each knob change from the kept tap; the first SHADER canvas sets the tap and asks for one
  PRESENT (so a paused stage shows it at once); the last one dropped clears it. The stage canvas's `style.filter` is mirrored.
  Surgical rest: `node-layers.js` (7 lines: `createLayerHost(stage, gpu)` makes/paints/drops a `gpu` layer through the host),
  `nodes-compile.js` (`over(T)`: LAYER or SHADER — no FADE/MASK, listed in `layers` with `gpu: true`, counted as a pass),
  `nodes.js` (the types; the host on `field.device`; `createNodes` takes `field, mat, present`), `node-types.js` (`homeOf`: no FOOT
  for a shader), `nodes-view.js` (class `shader` in the + menu, its own divider, mark `····`, HEAVY), `lab/nodes.css`
  (`canvas.node-layer` 100 %), `lab/rack.js` (the `createNodes` call passes `field, mat, present: () => schedule(TIER.PRESENT)` —
  the `app` literal untouched; HINGE HOLDS at 24/25), glyphs `nodeShader` (a scatter piling into a fold) and `nodeDecohere`.
- **S3 THE PALETTE**: `field.paletteLUT()` → `{ lut, span, n }` (the LUT as `setPalette` keeps it, its stop span, a set count);
  the host uploads a 256 × 1 rgba8unorm LUT when `n` moves and reads it between the first and last stop + ROTATE (`hueShift`),
  INVERT flips the colour (not the ground), as the ESP bar does. PALETTE ON off → PALETTE reads as INK. With FRINGE the three
  channel densities take the picks at ⅙ · ½ · ⅚, blended in by FRINGE (FRINGE → 0 meets the one-channel mapping continuously).
- **S4 THE LOOK**: `tools/decohere-shots.mjs` (37 lines, a diagnostic) and 14 JPEGs in `S-shots/`.
- **S5**: THE SHADER NODE paragraph in `docs/laws/nodes.md`; this note.

## Decisions taken while building (say if you want them otherwise)
1. **The copies are ONE family of fields**, not independent seeds: copy s draws t ∈ its stratum of [−½, ½] at random per point, and
   the field is D(p, o₀ + t·SPREAD·4·(1, 0.6)). That is a Monte-Carlo sample of the family's density: SAMPLES 2 is grain, 16 smooth,
   and the family's envelopes are the bright caustic edges. Independent seeds (the first build) gave a shapeless wash — no folds.
2. **FRINGE is per-channel AMPLITUDE** (R · G · B pushed 1 ∓ 0.6·FRINGE as far: dispersion, RESEARCH.md §5's A_c = A(1 + δc)),
   not a per-channel seed: the fringes line up along every fold, as a prism's do. FRINGE > 0 draws 3 × the points.
3. **AMOUNT and SCALE are CSS px** (× the stage's device/CSS ratio): the look holds when the governor scales the stage.
4. **PALETTE**: colour = LUT(t) × min(1, 4t) — the ground black, a quarter up the palette's own colour (LUT(t)·t was too dark).
5. **GROUND** (call 1): BLACK (home, replaces) · STAGE (alpha = the brightest channel: the stage shows through) — 3 lines.
6. **The hint** is "the lines decohere into caustics — a splat through noise": the plan's 79-character hint broke A HINT IS ONE
   LINE (≤ 60, `tools/hints-census.mjs`, in `./test.sh node`).
7. **Glyphs** went to `lab/icons.js` (`nodeShader`, `nodeDecohere`): `lab/img/nodes-icons.svg` was retired at 021 V2.

## Tests
- `./test.sh node` EXIT 0 after S1, S2, S3 and at the close (`.tmp/node-S.log`).
- `tests/curves.browser-test.mjs` (NODES' guard) GREEN on gate 9687.
- `node tools/new-project.mjs --check` in step; `node tests/mir-manifest.test.mjs` PASS (MIR 1.5.6-alpha.11, 265 files);
  `node tools/rack-deps.mjs --classes --no-write` HINGE HOLDS (24/25); `node tools/hints-census.mjs --check` 0 over 60.
- THE LOCK on my gate (9687/5687): after S1 and again at S3's head — 843 values, 0 moved; s4a fixture 987, 0 moved; unrepeatable none.

## Frame cost (headless rig, governor and auto-scale off, SAMPLES 8, FRINGE 0.25)
- 1600 × 1000 window → stage 1600 × 914 (1.46 Mpx → STEP 2): hydrogen 29.9 → 30.7 presents/s; benzene BANDS 30.1 → 30.0.
- The rig paces at ≈ 30 presents/s, so the node's cost is under that ceiling here, not zero: Josh's machine is the real figure.
  With the governor ON the rig drops the stage to 448 × 250 – 960 × 536 whether or not the node is there.

## The pictures (`S-shots/`, 960 px JPEGs, dark theme, 1280 × 714 stage, STEP 1)
- `h-a00` (AMOUNT 0: no canvas, the stage as it is) · `h-a12` · `h-a40` · `h-a100` — hydrogen 1s + 2p₀ default, COLOUR PALETTE
  with PALETTE off = INK, EDGES: the frame box and the axes decohere into grainy ribbons; the cloud's edge into a soft fringe.
- `c6h6-a00` · `c6h6-a12-palette` · `c6h6-a40-palette` · `c6h6-a100-palette` — benzene, BANDS, HOT IRON: at 40 the lines twist into
  ribbons with bright envelopes (folds); at 100 they dissolve into sheets with the three-pick fringe.
- `c6h6-a40-ink` (white + RGB fringe, the Lieberman look) · `c6h6-a40-s02` (grain) · `c6h6-a40-s16` (smooth).
- `c6h6-a40-phase25 · 50 · 75` (with `c6h6-a40-palette` as PHASE 0): the field drifting on its circle; PHASE 1 is PHASE 0.

## The CLAUDE.md sentence
NODES' fifth class SHADER (`lab/node-shader.js`, DECOHERE) draws on the field's device from `field.tap` into its own canvas in
`#nodeLayers`; the tap lives only while a SHADER node does — read `docs/laws/nodes.md` THE SHADER NODE.

## Open questions for Josh
1. The look, on 9261: is SPREAD 0.35 / FRINGE 0.25 / AMOUNT 24 the right home, and is PALETTE's ×min(1, 4t) ramp right for a
   cyclic palette (a phase palette walks its hues with density)?
2. EDGES on a soft cloud gives a faint soft fringe; the frame and axes give the strongest lines. Should the node read the picture
   with FRAME and AXES left out (a second tap without the line pass), or is the box part of the drawing?
3. GROUND STAGE is there (call 1's switch); keep it?
4. A SHADER node is screen only, as every node: a picture or a film does not carry it (the GPU readback never sees `#nodeLayers`);
   carrying it into RENDER is 025 if wanted.
