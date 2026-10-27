# ITERATION 019 — NODES (Claude Sos, integrator on `yan-c`; Josh 2026-10-27)

Josh: "I also want to ask about nodes and what other features you might think? We can add basic ones that I could think of from photoshop's adjustments/after effects FX and whatnot. Posterize, Threshold, levels, and perhaps a film grain effect. This would understandably cause a lot of performance impacts when activated but I trust how you handle the code. Ultrathink." → the design was presented (`NODES-DESIGN.md` beside this file, also in DATABASE/CLAUDE) → Josh: "Letsa go".

## THE DESIGN
`research/iteration-019/NODES-DESIGN.md` — read it whole: what exists (018 D3 `lab/nodes.js`, the kit's `picture-filter.js` and its laws), the compass, the four node classes by what they compile to (TABLE · MATRIX fold into the one filter for free; LAYER is a blend layer over the stage; PRIMITIVE is a real pass), the order law, THE LAWS OF NODES, the five rows.

## CHAIN N (one Opus builder, rows in order; BASE in the CLOSED table)
N1 THE COMPILER: `lab/nodes-compile.js` (≤ 120 lines) turns the graph into runs — contiguous TABLE/MATRIX nodes composed into one table set / one matrix, a PRIMITIVE its own markup, a LAYER a layer spec — and the kit's picture filter gains `setChain(runs)` (ordered children; the fixed pair is the degenerate chain; neutral runs emit nothing; one write per frame through the same coalescer). Kit 1.5.0-alpha.33, FOR-MIR line, re-hash. CURVES alone through the compiler yields the byte-identical filter (`describe()` before/after in the BUILD note).
N2 TABLE + MATRIX nodes: LEVELS (in black · in white · gamma · out black · out white) · POSTERIZE (STEPS 2–32) · THRESHOLD (LEVEL; on luma — the compiler inserts the luma matrix before it) · INVERT · GAMMA · EXPOSURE · CONTRAST; HUE · SATURATION · LUMA · TINT (colour + amount) · TEMPERATURE. One node factory with a knob list per type (≤ 150 lines); every knob a MIR control with a stable modulation target id `nodes.<node>.<knob>`.
N3 LAYER nodes: FILM GRAIN (AMOUNT · SIZE · MONO|COLOUR; a 256² noise tile drawn once, repeated, translated to a fresh offset each frame; blend soft-light/overlay) · VIGNETTE (AMOUNT · FEATHER · ROUNDNESS; radial gradient, multiply) · SCANLINES (PITCH · AMOUNT) — one layer host over the stage canvas, under the racks and the stage text, never in the occlusion mask, pointer-events none (≤ 120 lines).
N4 PRIMITIVE nodes: BLUR (RADIUS) · SHARPEN (AMOUNT, feConvolveMatrix) · CHROMATIC ABERRATION (SHIFT · ANGLE) · BLOOM (RADIUS · AMOUNT) and DISPLACE (SCALE · FREQUENCY · SEED) behind the "heavy" mark (≤ 100 lines).
N5 THE MENU AND THE CARD: the + menu grouped by class with the cost mark (· ·· ···) per node, the graph's foot "N passes"; a bypassed node (×) emits nothing and keeps its values; NODES presets through user-presets (`lambdawaves.q0.nodePresets`, PREFERENCE; three shipped: FILM · POSTER · PRINT); the rack card shows the chain as a column at rack width; the graph record (`lambdawaves.q0.nodes`) gains the node list (type, values, bypass, position) and older records (the one-node graph) still open.
Later rows (not this chain): the governor's bypass of PRIMITIVE nodes under a missed budget; RENDER bakes the graph (`ctx.filter`); PROJECT scope.

## CALLS FOR JOSH (defaults stand)
1. The graph stays PREFERENCE (the reader's look) for now. Default: yes.
2. BLOOM and DISPLACE ship behind the "heavy" mark and a hint; no governor yet. Default: yes.
3. The three shipped presets' recipes are the builder's. Default: yes.

## CLOSED
| chain | BASE | commit | note |
|---|---|---|---|
| N | 10a299e | | |
