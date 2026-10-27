# CHAIN N — NODES (Opus builder, 2026-10-27; branch `it019-N`, base 6bf68f7; kit 1.5.0-alpha.33)

## N1 THE COMPILER (08b7e68)
- Kit `lab/mir/panels/picture-filter.js` gains `setChain(runs)`. The runs come after the grade's pair, in order. A run is `{ matrix }`,
  `{ tables: { r, g, b } }` or `{ prim: [[tag, attrs, children?], …] }`, where an attribute `'$IN'` names the previous run's result (named only
  when a run asks for it). It uses the same coalesced write, one per frame. A run handed back by identity is not rewritten. `describe()` counts
  the chain's matrix and table too. Trickle-down: `version.js` alpha.33, the top line of `docs/FOR-MIR.md`, `MIR-MANIFEST.json` and its pin.
- New `lab/nodes-compile.js` (73 lines). `compile(list, TYPES, cache)` → `{ runs, layers, passes }`. Contiguous TABLE nodes fold into one
  feComponentTransfer: their functions are composed exactly, each clamped, and evaluated at 256 entries. A TABLE run is cached by node ids and
  versions. Contiguous MATRIX nodes multiply into one feColorMatrix. A PRIMITIVE starts a new fold. THRESHOLD (`luma`) gets the Rec. 709 luma
  matrix in front of it. Bypassed or neutral nodes emit nothing, and a matrix that multiplies out to the identity is dropped.
- CURVES now hands its tables to the graph through a `port`, not to the filter. Proof (`tools/n-probe.mjs identity`, Firefox): MASTER S +
  R LIFT through the compiler vs 018's `setTable` road. `describe()` was `{ matrix: false, table: true, css: url("#mir-picture-1") }` both ways,
  and the filter's markup was **byte-identical** (5411 B, `identical: true`). Neutral: `css: ""` (computed `none`), 0 passes.

## N2 TABLE + MATRIX (77a40fe) — `lab/node-types.js` (72 lines)
- TABLE: LEVELS · POSTERIZE (2–32) · THRESHOLD (on luma) · INVERT · GAMMA · EXPOSURE (stops) · CONTRAST. MATRIX: HUE · SATURATION · LUMA ·
  TINT (a swatch + AMOUNT) · TEMPERATURE. `nodeBody` is the one factory: each knob is a `control()`, and each number knob is stamped
  `data-param="nodes.<node>.<knob>"` and registered through the runtime door (`LW.mod.register`, root `nodes` added in `shell/modulation.js`).
  A hand on a routed knob moves its BASE, and a modulator's write is `show()`n, as mod-port does it. Removing a node unregisters its targets;
  a saved route goes dormant (the kit's law).
- `lab/nodes.js` is rewritten as a list of nodes. × BYPASS (`aria-pressed`) dims a node and keeps its values. A bypassed node shows the bin
  (REMOVE). CURVES can be bypassed but never removed. THE ORDER LAW: dropping a node in the window re-sorts the list by top → bottom.
  `rack.js` passes `mod: LW.mod` to `createNodes` (an argument, not the `app` literal).
- In the N3 commit, every type with no `neutral` of its own is neutral at home (so a fresh LEVELS emits nothing).

## N3 LAYER (29f21f1) — `lab/node-layers.js` (61 lines)
- FILM GRAIN (AMOUNT · SIZE · MONO|COLOUR · SOFT|OVERLAY): a 256² tile drawn once per kind. A 24 Hz stepped `transform` animation in
  percentages moves it (no `var()` in the keyframes, after the perf pass below; none under reduced motion). VIGNETTE (AMOUNT · FEATHER ·
  ROUNDNESS, multiply). SCANLINES (PITCH · AMOUNT, multiply). A modulated AMOUNT writes only `opacity`.
- The host `#nodeLayers` sits in `#stage` right after `#skeleton`, with z 8 (under atom labels 9, the stage text 20 and the racks),
  `pointer-events: none` and aria-hidden. It registers nothing with occlusion, so it is never in the mask. Probe: parent `stage`, z 8,
  pe none, three layers, two after a bypass.

## N4 PRIMITIVE (b155f57) — `lab/node-prims.js` (36 lines)
- BLUR (feGaussianBlur). SHARPEN (feConvolveMatrix cross). CHROMATIC ABERRATION (7 primitives: R and B offset opposite ways, screened over G).
  BLOOM HEAVY (bright-pass → blur → arithmetic add). DISPLACE HEAVY (feTurbulence + feDisplacementMap, still seed). Probe: posterize · blur ·
  CA · invert · bloom · displace · sharpen gave 16 primitives, with every `$IN` wired (`mir-picture-1-1`, `-3`, `-4`). RADIUS 0 dropped one.

## N5 MENU + CARD (18fe8d1)
- + is grouped TABLE · MATRIX · PRIMITIVE · LAYER, with each class's mark (· / ·· / ···) on the heading and on every item. BLOOM and DISPLACE
  carry HEAVY. Then GRAPHS: FILM (levels lift, warm, −sat, grain, vignette) · POSTER (sat 1.45, posterize 5, sharpen) · PRINT (luma, contrast,
  paper tint, grain, vignette). The reader's graphs come next with ×, then SAVE THIS GRAPH. These live in PREFERENCE
  `lambdawaves.q0.nodePresets` (a FAMILIES row). A graph replaces every node but CURVES.
- The foot shows "N passes" (filter primitives + layers). The rack card is a column at rack width: STAGE IN, the nodes in order, STAGE OUT,
  with port-to-port connectors, no pan and no drag. The window stays the free graph.
- The record `lambdawaves.q0.nodes` has `list: [{ id, type, values, bypass, at }]`. 018's record still opens (probe: `curves: false` →
  `curves` bypassed); a shipped graph, a saved graph and a reload keep the list.
- Pictures (`research/iteration-019/N-shots/`): `n5-graph-six-nodes`, `n5-rack-card-column`, `n3-grain-vignette-stage`, `n5-plus-menu-cost-marks`.

## PERF (tools/perf/main-thread.mjs, 5 × 20 s, headless Chromium RTX 3070, load 2–3; base = 6bf68f7 served from a `git archive`)
| scene | ms/s median | spread | presents/s |
|---|---|---|---|
| base 018, CURVES S | 28.8 | 2.6 | 10.8 |
| **(a)** CURVES S through the compiler | **29.1** | 3.6 | 10.8 |
| **(b)** + POSTERIZE + LEVELS + GRAIN + VIGNETTE (3 passes, 2 layers) | **22.7** | 2.6 | 8.6 |
| **(c)** + BLUR + BLOOM | **15.7** | 2.5 | 4.7 |
- (a) vs base: Δ +0.3 ms/s, which passes the bar of max(2 × 3.6, 2). (b) is under the ms/s bar too: the main thread does less because fewer
  frames land. But GRAIN costs GPU: posterize + levels alone give 11.0 presents/s (3 runs), + vignette 10.9, + still grain 8.8, and grain the
  size of the stage 9.3. The cost is the full-screen blended noise layer, not the animation (the keyframes' `var()` cost about 0.6 ms/s of
  style recalc, now gone). (c): BLUR + BLOOM halve the presents (−57 %). That is the "heavy" mark, as designed.

## Tests (gate 8819 / gd 5819, one browser)
- Browser GREEN: `curves` (re-aimed: `__LW.nodes.filter.describe()`, since `LW.curves.filter` is null with a port), `frame-occlusion`, `history`.
- Node GREEN: `mir-manifest` (alpha.33, 264 files), `pwa` (after `--write`), `new-project.test`, `history.test` (18), `rack-deps.test`.
  `node tools/rack-deps.mjs --classes --no-write` HOLDS (spectrum 25). `node tools/new-project.mjs --check` is in step (16098 B).
- LOCK: none moved. Every node is a CSS filter or a layer on the screen only.

## CLAUDE.md paragraph (to add after the 018 D paragraph)
THE LAWS OF NODES (019, `research/iteration-019/NODES-DESIGN.md`, `N-BUILD.md`): the graph COMPILES (`lab/nodes-compile.js`) to the kit's one picture filter (`setChain`, kit alpha.33) — TABLE nodes (CURVES · LEVELS · POSTERIZE · THRESHOLD · INVERT · GAMMA · EXPOSURE · CONTRAST, `lab/node-types.js`) fold into ONE feComponentTransfer and MATRIX nodes (HUE · SATURATION · LUMA · TINT · TEMPERATURE) into ONE feColorMatrix while contiguous; a PRIMITIVE (`lab/node-prims.js`: BLUR · SHARPEN · CHROMATIC ABERRATION · BLOOM and DISPLACE marked HEAVY) is a real pass in graph order; a LAYER (`lab/node-layers.js`: FILM GRAIN · VIGNETTE · SCANLINES) is a div in `#nodeLayers` over the stage (z 8, under the atom labels, the stage text and the racks, pointer-events none, never in the occlusion mask). The order is the window's top → bottom. A NEUTRAL or BYPASSED (×) node emits nothing and keeps its values; CURVES alone writes the byte-identical 018 filter. ONE compile and ONE filter write per frame. THE COST IS ON THE CARD: · / ·· / ··· per class, HEAVY on BLOOM and DISPLACE, "N passes" at the graph's foot. Every number knob is a modulation target `nodes.<node>.<knob>` (root `nodes`, the runtime door). The graph is PREFERENCE `lambdawaves.q0.nodes` (the node list; 018's record opens), the reader's graphs PREFERENCE `lambdawaves.q0.nodePresets` beside the shipped FILM · POSTER · PRINT; the rack card is the chain as a column, the window the free graph. Screen only: a picture or a film does not carry the graph until RENDER bakes it. Run `tests/curves.browser-test.mjs`.

## Open questions for Josh
1. GRAIN costs about 20 % of the frames on the headless rig, where the vignette is free. Is it the same on your card? If it hurts, the next
   step is a smaller tile layer or grain in the field shader.
2. A graph preset renumbers the nodes (n1…), so a route saved on `nodes.n2.*` may land on another type. Should a project carry the graph
   (PROJECT scope, a later row), or do routes to NODES stay off the flash guard's list as they are now?
3. A LAYER always sits over the filtered picture, wherever it is in the chain. Is that OK, or should a layer between two filter nodes say so on its card?
