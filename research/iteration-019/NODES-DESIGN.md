# λWAVES · NODES — the design after 018 (Claude Sos, 2026-10-27; for iteration 019 on Josh's word)

## What exists (018 D3)
`lab/nodes.js` (146 lines) + `lab/nodes.css`: a MIR window `nodes` and a rack card `nodes`, two live views of one graph STAGE IN → CURVES → STAGE OUT; the ground pans, nodes drag by the title bar, wires on one SVG layer, + / × take CURVES out and back. CURVES is the kit's `createCurvesPanel` (`lab/mir/panels/curves.js`) whose output goes to the kit's **picture filter** (`lab/mir/panels/picture-filter.js`, 193 lines): ONE inline SVG filter on the stage canvas — `feColorMatrix` (saturation · hue composed into one 4 × 5 matrix) then `feComponentTransfer` (ONE 256-entry table per channel composing exposure → black/white → gamma → contrast → master curve → channel curve → invert), plus CSS `opacity` and `mix-blend-mode`. Its laws: one filter per picture; neutral costs nothing (a primitive that does nothing is not emitted; nothing left = `filter: none`); one write per frame (coalesced on core/frame.js; a modulated hue rewrites twenty numbers, a table is rebuilt only when a curve moved); sRGB. The kit's GRADE panel (docs/PANEL-GRADE.md) drives the same filter's tone section. Records: the grade PREFERENCE `lambdawaves.q0.curves`, the graph `lambdawaves.q0.nodes`, user curves `lambdawaves.q0.curvePresets`.

## The compass
Houdini Copernicus: a graph of operators over the image, each node one operator with typed inputs, the chain compiled, not interpreted. λWAVES' flavour: the graph COMPILES to the one picture filter. Three node classes by what they compile to:

| class | compiles to | cost | nodes |
|---|---|---|---|
| TABLE (per-channel transfer) | folded into the ONE `feComponentTransfer` table (function composition in order) | none beyond the filter pass CURVES already pays | CURVES (exists) · LEVELS (in black/white · gamma · out black/white = the kit's GRADE tone) · POSTERIZE (N steps, 2–32) · THRESHOLD (level; on luminance → needs a LUMA matrix before it, the compiler inserts it) · INVERT · GAMMA · EXPOSURE · CONTRAST |
| MATRIX (4 × 5 colour matrix) | folded into the ONE `feColorMatrix` | none beyond the pass | HUE · SATURATION · GREYSCALE/LUMA · TINT (sepia-like, a colour + amount) · CHANNEL MIXER (R/G/B rows) · TEMPERATURE (warm ↔ cool) |
| LAYER (a DOM layer over the stage) | one absolutely placed div over the canvas with `mix-blend-mode`, GPU composited, never in the occlusion mask | small, fixed | FILM GRAIN (a 256² noise tile pre-drawn once, repeated, translated to a fresh offset each frame by `transform`, blend overlay/soft-light, AMOUNT = opacity, SIZE = tile scale, MONO/COLOUR) · VIGNETTE (radial gradient, multiply, AMOUNT · FEATHER · ROUNDNESS) · SCANLINES (repeating-linear-gradient, multiply, PITCH · AMOUNT) · LETTERBOX (bars) |
| PRIMITIVE (its own SVG primitive) | one more primitive in the filter chain, in graph order | real (a blur is a full-screen pass) | BLUR (feGaussianBlur, RADIUS) · SHARPEN (feConvolveMatrix 3 × 3, AMOUNT) · CHROMATIC ABERRATION (feOffset ×2 on split channels + feComposite, SHIFT · ANGLE) · BLOOM (feGaussianBlur + feBlend screen + AMOUNT; the dearest) · DISPLACE (feTurbulence + feDisplacementMap, SCALE · FREQUENCY · SEED; animated seed = heavy) |

Order law: TABLE and MATRIX nodes fold while they are contiguous in the chain; a PRIMITIVE between two folds starts a new fold (the compiler emits primitive runs in graph order), so a user can put BLUR between CURVES and POSTERIZE and get exactly that. The kit's filter gets one small extension for 019: `setChain(runs)` — an ordered list of { matrix | tables | primitive(markup) } that it writes as the filter's children (today it writes the fixed pair; the pair is the degenerate chain). Trickle-down rule.

## The laws of NODES (to put in CLAUDE.md at 019)
- A NEUTRAL NODE COSTS NOTHING: a node at its home values emits nothing (the kit's law, extended to every class); a bypassed node (×) emits nothing and keeps its values.
- ONE WRITE PER FRAME: every node writes through the kit's coalesced write; a modulated knob on a MATRIX node rewrites numbers, a TABLE node's table is rebuilt only when its own values moved (the fold is re-composed from cached per-node tables, 256 × channels each, trivial).
- THE COST IS ON THE CARD: each node's title bar shows its class mark (· TABLE/MATRIX, ·· LAYER, ··· PRIMITIVE) and the graph's foot shows "N passes" (the number of filter primitives + layers); the frame-budget governor (lab/frame-budget.js) may bypass PRIMITIVE nodes under a missed budget — a later row, say it on the card when it does.
- THE GRAPH IS THE READER'S (PREFERENCE), the look of the room, until Josh says a project owns it; a project may later carry a `nodes` record (PROJECT) — scope decision for Josh.
- A FILM BAKES THE GRAPH: CSS filters are not in a canvas capture; RENDER draws the frame through `ctx.filter = 'url(#…)'` (Chromium and Firefox) and composites the LAYER nodes, so the export equals the stage. A row of 019 (or the export says "view only" until then).
- MODULATION: every node knob is a MIR control, so it routes like any other (`nodes.<node>.<knob>` target ids, stable).

## 019 chain proposal (one Opus builder, in order)
N1 the compiler (`lab/nodes-compile.js` ≤ 120 lines) + the kit's `setChain` (alpha.33) — CURVES through it, byte-identical filter for the one-node graph (prove with `describe()`).
N2 TABLE nodes: LEVELS · POSTERIZE · THRESHOLD · INVERT (+ MATRIX: HUE · SATURATION · LUMA · TINT) — one node factory, a knob list per type, ≤ 150 lines.
N3 LAYER nodes: FILM GRAIN · VIGNETTE · SCANLINES — one layer host over the stage (never in the occlusion mask; under the racks), ≤ 120 lines.
N4 PRIMITIVE nodes: BLUR · SHARPEN · CHROMATIC ABERRATION (BLOOM and DISPLACE behind a "heavy" mark) — ≤ 100 lines.
N5 the + menu grouped by class with the cost mark; NODES presets (a PREFERENCE list through user-presets: "film", "poster", "print"); the rack card shows the chain as a column.
Later: the governor's bypass; RENDER bakes the graph; PROJECT scope.

Where Josh's four live: POSTERIZE and THRESHOLD = TABLE (free), LEVELS = TABLE (the kit's GRADE tone), FILM GRAIN = LAYER (cheap, not a filter primitive at all).
