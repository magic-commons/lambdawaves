# NODES and CURVES

The paragraphs below were moved verbatim from CLAUDE.md at 021 D2 and keep their iteration tags; where an older line names a file, a seat or an id a later iteration retired, the later law wins, and the laws of 021 stand first.

## The laws of 041

NODES' CHIPS (041 N1, on alpha.55): the NODES window wears `chrome: 'both'`, its rail on the left, top to bottom: the drag chip (`gripAt: 'first'`), ADD NODE, FIT, FOLD ALL, BYPASS ALL; the four tools left the window's ground and the chips join the mask (`lab/nodes.js`, `lab/nodes-view.js`); the title bar keeps the presets, the dock door and ×; the rack card, which has no rail, keeps its three in its ground.
A PRESET CARRIES THE GRADE (041 N2, Josh's call 11): a preset saved since 041 is `{ nodes (CURVES in its place in the chain), curves }` and a pick or the bar's step puts both back; one without `curves` (FILM, POSTER, PRINT, a 040 save) replaces every node but CURVES and leaves the grade. NODES' undo ring does not hold the grade. This amends 040 N4's "every node but CURVES" (below).
ONE RAMP (041 N3, Josh's call 1): PERSPECTIVE draws one centred 128² ramp, once, and the focal point is an `feOffset` before each displacement map (`lab/node-prims.js`) — the same picture; a FOCUS write changes two numbers. The mode and its handle stay. This replaces 040 N1's ramp per focal point (below).
FIT STARTS AT THE MARGIN (041 X3): a box the 0.5 floor leaves bigger than the ground is placed 24 px from its top and left, never centred off the view (`lab/nodes-view.js`).

## The laws of 040

THE FOCAL POINT (040 N1, Josh: "Chromatic abberation should have a blur blend knob. Perspective chromatic abberation also doesn't work; it's supposed to come with a movable focal point; show focal point when editing the node").
- **BLUR BLEND** (0–8 px, home 0) softens the parted red and blue (one feGaussianBlur each) before they screen back over green, SHIFT and PERSPECTIVE alike; at 0 it adds nothing. It is px, so a film's × k holds.
- **PERSPECTIVE** parts the colours from a FOCAL POINT, FOCUS X · FOCUS Y (stage fractions, home the centre, targets `nodes.<id>.fx` / `.fy`, greyed under SHIFT), and grows LINEARLY with the distance from it: AMOUNT px at the stage's corner from a centred point. 038's r² law hid the effect where the orbital sits. A 128² ramp per focal point (eight kept), read at ±4·AMOUNT (041 N3: one ramp, above).
- **The handle** (`lab/node-focus.js`): a ring and cross-hair in `#stage` (z 19) while the node is EDITED — its card selected in the window, hovered or holding the focus (`nodes.js editing(id, why, on)`, a 600 ms grace), or the hand on the handle. A drag writes FOCUS X · Y through the node's hand (a routed knob moves its base); two presses bring it home. It stays under every window (a window over the stage's centre covers it at home), out of the occlusion mask, hidden by H and the menu; nothing is drawn while no node is edited, so THE LOCK never sees it.

THE GRAIN KEEPS TIME (040 N2, Josh: "Film grain always plays desipite play/pause modes"). FILM GRAIN's jump is the clock's: ⌊6·t⌋ (24 a second at the home rate) hashed to the tile's offset, written as `--gx` · `--gy` by the layer host's `tick(t)` from the loop's CPU frame (rack.js, beside the widgets). A paused clock holds a still grain; PLAY and a seek move it; reduced motion keeps it where it is. 021 V3's keyframes and the `lw-playing` class are gone. A film hashes its frame index, as before.

THE HUE KNOB WRAPS (040 N3, Josh: "Hue knob should be 360 degree free spinning instead of left and right only"). A knob with `wrap` is the kit's free arc: `nodeBody` gives its dial the range [home, home + span), so home sits at the top, and folds the turn back into [min, max) on the way to the node. HUE and HUE/SATURATION's HUE wrap on the colour wheel (`WHEEL`: red at home, the thumb what red becomes); the saved value stays −180 … 180, and their targets map `'wrap'`.

THE NODES' PRESETS (040 N4, Josh: "add the modulation window's preset saving thing into Nodes and put it into the window title bar"). MOD's bar sits in NODES' title bar after the title: the save glyph · PRESET NAME · ◀ ▶.
- **A preset is the graph:** every node but CURVES, whose grade keeps its own presets (041 N2: a preset saved since carries the grade, above). The list is the shipped FILM · POSTER · PRINT, then the reader's — the GRAPHS › list, `lambdawaves.q0.nodePresets` (PREFERENCE).
- **The hand:** ◀ ▶ step and load (one step of NODES' ring). SAVE or Enter keeps the typed name in CAPS; a shipped or taken name becomes `NAME 2` (016 W9). Escape puts the shown name back. The well rims while what is typed is not the shown preset.
- A GRAPHS › pick names itself in the bar; an open (a project, NEW) clears the name. The rack card has no bar.

A NODE KEEPS ITS TINT (040 N5, Josh: "the individual nodes should keep their tint because the background already blurs if blur is on. That way I don't have to see the dot matrix in the back"). A card's raise lies over the pane's own tint, `hsl(var(--glass-tint))`, opaque: the ground's dots stop at its edge. THE LAYERS BLEND WITH THE STAGE (038 P8) stands for the layers.

THE NODES WINDOW DOCKS (040 N6, Josh: "If dragging the node title bar close enough to the rack window, allow it the option to dock to it; it's another way to convert it to rack window and back"). The kit's dock road does not reach a title-bar window (FOR-MIR), so the app's minimum lives in `nodes.js`:
- **To the rack:** while the bar drags, a rack within 160 px glows, and the rack under the pointer lights the slot the card would take (the kit's proximity guide, drawn where the release lands). A release there closes the window and opens the card in that slot. Escape, a blur or a hidden page drop the guide and dock nothing.
- **Back:** the card dragged off its rack by the hand (the kit floats it) opens as the window where it was let go. A card floated by another road (`layout.popOut`, the header's Enter) stays a card.

## The laws of 039

THE LAYERS LIE UNDER THE WINDOWS (039 V5, B #6: a VIGNETTE greyed the SPECTRUM header and grain lay over every window). Measured first: the layers were already under every window (a layer's z 8 against the racks' 30, #floats' 32, the bar's 33; the SPECTRUM card is what a press at its header meets) — a window's glass is translucent, and it showed the vignetted stage beneath it (the header's mean 250.2 → 206.5 with a VIGNETTE; 250.2 again with the layer cut under the rack). So the picture's layers are INK UNDER GLASS like the frame's lines: `lab/shell/ink.js` `glassCut` writes the line pass's own window rects as `--lw-glass-cut` on `#nodeLayers` — `path(evenodd, …)`, the stage less each window, written only when it changes, asked again when the host is built — and every `.node-layer` wears `clip-path: var(--lw-glass-cut, none)` (nodes.css). FILM GRAIN's tile and its jumps are a child `i` (`node-layers.js`, PAINT.grain), so the layer itself stays still and its cut stays where the windows are; its blend and AMOUNT stay on the layer (038 P8's blend group kept). A film paints its layers itself (`paintLayer`), whole; THE LOCK holds no DOM layer. Probe (`.tmp/v5-probe.mjs`, 1600 × 900, SPECTRUM unfolded): VIGNETTE — header 250.2 → 250.2, the free stage's edge 209.1 → 189.2, the centre 208.6 → 208.6; + FILM GRAIN — header 250.2, stddev unchanged, the edge's stddev 11.8.

## The laws of 038

THE + MENU IS THE KIT'S (038 N1, Josh: "Nodes dropdown seems to be missing it's background"). The + menu is the kit's `contextMenu` anchored under the +, on the page as every kit menu is. Inside the window or the rack card the old pane blurred only the card's own glass (a nested backdrop root), and the short card clipped it to a scroller.
- **It holds:** a search line (typed, the pane reopens with up to ten matches; Enter adds the first), then GROUPS, then GRAPHS ›.
- **GROUPS:** COLOUR · TONE · ONE-KNOB · PASSES · LAYERS · SHADERS since 038 P9 (THE FULL NODE AND THE ONE-KNOB NODE, below), each a submenu. A kind joins one by `group`, else by its class; a new group is a row of `GROUPS` in `lab/nodes-view.js` (its id, its word, its glyph, the classes it takes); a group with no kind is hidden.
- **GRAPHS ›:** the shipped graphs, the reader's, SAVE THIS GRAPH (the `saveInto` glyph, its name asked in the kit's dialog) and REMOVE ›.
- **The keys:** the kit's ↑ ↓ → ← and Enter. Escape closes it and gives the ground its keys back.
- No scroller. The REFRACTIVE · DARK · FROST tie of the menu floor is the kit's (FOR-MIR).

THE GROUND ZOOMS BY CTRL (038 N2): Ctrl/⌘ + drag on the empty ground zooms about the press (up is in, 0.5–2×), as the wheel and the pinch do; the cursor says so while the key is held.

THE DOORS ARE IN THE BARS (038 N3).
- **The window:** its DOCK IN THE RACK is a title-bar head button beside × (`win.tools`, glyph 16 px).
- **The rack card:** its OPEN AS A WINDOW sits before × in `.dev-util`, in × 's look.
- **The glyphs:** `rackIn` / `rackOut`, λWAVES' line drawings; the kit's solid arrow reads heavy beside ×.
- The ground keeps no door.

THE WIRE HAS A KNOB (038 N4, FL Studio's Patcher). Every wire into a node carries a round handle at its middle.
- **What it turns:** that node's MIX — its FADE (folded, already the target `nodes.<id>.fade`), or a LAYER's / SHADER's own 0–1 MIX or AMOUNT. The wire into STAGE OUT has no handle.
- **The hand:** a vertical drag turns it with the kit's law (220 px, Shift 1/8); two presses come home; the wheel turns it (nothing scrolls in the window; Ctrl + wheel still zooms). The value shows only while it turns.
- **The selection:** a press selects the wire. Delete unplugs it, the arrows turn it. Right-click gives PLUG IN / UNPLUG · RESET MIX.
- **UNPLUG** is the node's `plug: false`, written only when false, so every graph saved before reads plugged. The node emits nothing (compiled beside bypass). Its card dims, and its wire is drawn dashed from above to its hollow handle. The rack column's connector is dashed.
- **CONNECT keeps THE COLUMN IS THE CHAIN.** A card's port carried onto a wire, or onto another card's port (the wire it ends), moves its node into that wire and plugs it in: under the wire's upstream card, every card from the downstream one on shifted down. The order is kept, no card is covered, and it is one step of NODES' ring.
- **Pulling a cable off:** an in-port let go on the empty ground unplugs its node. An unplugged node's own wire plugs it back in place.
- A drag on the handle turns it; re-routing is the ports' (Patcher's way).

THE MINIMAP (038 N5): the window's viewfinder at the ground's bottom-right.
- **What it draws:** an SVG of the cards' union and the view, the view as an accent frame, redrawn once a frame when the view or a card moves.
- **The hand:** a drag centres the view on its point; the wheel zooms about the view's centre.
- It is hidden while every card is in view. The rack card has none.

A CARD THAT GROWS PUSHES THE CARDS BELOW (038 N8, the fresh eyes: an opened FADE · MASK · TARGET fold covered the next card, so TARGET could not be pressed). In the window, a card that grows — its foot fold, or its body unfolded — moves the cards under it (overlapping its width) down until the gap is GAP again. The move is kept as a nudge, so no card is covered. A card that shrinks leaves its gap. The rack card's column flows as before.

THE KIT'S MENU FLOOR (038 N8, MIR 1.5.7-alpha.16 THE MENU PANE KEEPS ITS FLOOR). Every menu pane holds its floor in every material: the + menu, its submenus, the kit's right-click and the bar's lists. Dark REFRACTIVE FROST ALWAYS reads .72, not .10. The handle's readout ("MIX 50 %") is written through `label()`.

A NODE HAS A TARGET (038 N6, CALLS 4: one picture, a mask, a TARGET seg). Every TABLE, MATRIX and PRIM node carries TARGET: BOTH · STAGE · OBJECT. It is the foot fold's last row (FADE · MASK · TARGET); absent means BOTH, today's bytes.
- **The mask** is the field's alpha code (`field.setObjectMask`, chain F; which pixel is OBJECT is F's rule). Since 038 F8 (Josh 11-07: "objects just means anything on the stage that isn't the background. Like the molecule or the orbitals"), OBJECT is the orbital and the molecule — every pixel where the background carries less than half — and STAGE is the background alone. The seg's hint says so.
- **The run:** a targeted node is its own run (cost ···) whose mask is SourceAlpha through feFuncA (OBJECT 255·A − 254, STAGE 255 − 255·A), × its FADE, × its MASK when set. It is softened 1.2 px, because the code's edge follows the march's stipple. Then out = mix(in, fx, mask) on the `in` / `over` road.
- **The field** writes its codes only while a compiled run reads them (`compile().mask`), so an untargeted graph and THE LOCK see the opaque canvas. A closing run sets the alpha back to 1. The field's premultiplied returns clamp their colour to 1 first (an overbright 255 over 254 unpremultiplies past 255).
- **A film reads the codes:** the readback keeps the alpha for the bake's filter while the mask lives. A still keeps 255 (≤ 1 level darker on the stage while a target lives).
- LAYERs and SHADERs carry no TARGET.

THE FULL NODE AND THE ONE-KNOB NODE (038 P, Josh: "We should also try to combine some of the nodes while leaving out the simple 'one-knobber' nodes … it gives users the options to use the full node vs the simple 1-knob nodes").
- **Appended, never renumbered.** A full node is a new id beside the kept one-knobbers, so an old graph opens as it was. The old LEVELS (`levels`) still opens but is never offered (`menu: false`); the + menu's LEVELS is `levels2`.
- **The + menu's groups:** COLOUR (the full colour nodes, then TINT, whose colour and amount are two controls — 038 P11) · TONE (the full tone nodes, CURVES among them) · ONE-KNOB (every one-knob TABLE and MATRIX kind) · PASSES · LAYERS · SHADERS. A `GROUPS` row names the classes it takes.
- **A knob may say when it does nothing** (`off(values)`, 038 P11): it greys, keeping its place and its hint. ANGLE does this under PERSPECTIVE.
- **A full node's face is data** (`lab/node-types.js`):
  - `face` lays its knobs out one fit row per line, in the face's order;
  - `bare` hides their labels, and the readout (its name in `fmt`) shows only while a knob is edited (a drag, its tail, the keys);
  - `stops` give a knob Photoshop's track on the kit's arc (THE ARC WEARS A GRADIENT, kit.md);
  - `draw` paints the card's strip.
- **The foot is the house's.** Every full TABLE, MATRIX or PRIM node keeps the foot fold, TARGET included. A LAYER never has it.
- **Every control is hinted** (038 P9).
  - A knob carries its own `hint`; a one-knob node's knob takes the node's hint, because the knob is the node.
  - A seg's or a stepper's hint is set on its root by `nodeBody`, since the kit hints only a seg's options (FOR-MIR).
  - FOOT's MASK has its hint.
- **A MATRIX kind may add a run** (`run(values, id, src)`, nodes-compile.js): primitives after its matrix. While it answers, the node is its own run (cost ···); otherwise the matrix folds for free.

| kind (id) · group | knobs (home) | what it computes |
|---|---|---|
| LEVELS (`levels2`) · TONE | IN BLACK 0 · GAMMA 1 (0.1–10, log) · IN WHITE 1 / OUT BLACK 0 · OUT WHITE 1, bare, read 0–255 (a key steps 1/255) | `levels`' table, byte-identical; the strip is the curve as a silhouette over Photoshop's three marks (no tap) |
| EXPOSURE (`exposure2`) · TONE | EXPOSURE 0 (±4 EV) · SHADOWS 0 · HIGHLIGHTS 0 (±100) | y₁ = clamp(y·2^EV); y₂ = y₁ + .945·[S·y₁(1−y₁)² + H·y₁²(1−y₁)]: ±.14 at ⅓ and ⅔, the ends fixed, monotone (least slope .055) |
| BRIGHTNESS & CONTRAST (`bc`) · TONE | BRIGHTNESS 0 · CONTRAST 0 (±100) | y = (y−½)·c + ½ + b, with b = B/200 and c = 1 + C/50 above home, 1 + C/100 below (0 flat, 3 at +100) |
| HUE/SATURATION (`color`) · COLOUR | HUE 0 (±180°, the track what red becomes) · SATURATION 0 · LIGHTNESS 0 (±100) | one matrix: Photoshop's lightness ∘ saturate(1 + S/100) ∘ hue-rotate(H) |
| BALANCE (`balance`) · COLOUR | TEMPERATURE 0 · TINT 0 / VIBRANCE 0 · SATURATION 0 (±100) | one matrix, diag(warm · tint) ∘ saturate. VIBRANCE ≠ 0 adds a 7-primitive run: D = c − luma; c + V·D(1−\|D\|), split into positive and negative parts. The result goes over an opaque black flood, so alpha is exactly 1 on the film's 2-D road too: Firefox's software composite rounds 1 − V + V to 254, and a channel at 255 then wrapped to black (038 P11) |
| CHROMATIC ABERRATION (`aberration`) · PASSES | MODE SHIFT · PERSPECTIVE (appended, home SHIFT); AMOUNT (the `shift` key, px) · ANGLE (greyed under PERSPECTIVE) · BLUR BLEND 0 (px, 040) · FOCUS X · FOCUS Y .5 (040, greyed under SHIFT) | PERSPECTIVE: an feImage ramp and two feDisplacementMaps, red out and blue in from the focal point, linear in the distance (040 N1; Procreate's); BLUR BLEND softens the parted red and blue |
| FILM GRAIN (`grain`) · LAYERS | AMOUNT · SIZE · TONE (appended, −1…1, home 0) / KIND · BLEND | TONE veils the tile with white or black (alpha .85·\|tone\|, so the grain survives at the ends) before its blend, so SOFT LIGHT and OVERLAY read it |

THE LAYERS BLEND WITH THE STAGE (038 P8). `#nodeLayers` sits at `z-index: auto` and each `.node-layer` at 8 (above `#skeleton` 7, below the atom labels 9).
- **Why:** at z 8 the host was a stacking context, which is an isolated blend group. Every LAYER's `mix-blend-mode` then blended with nothing: grain at AMOUNT 1 turned the stage flat grey, and a vignette painted the centre white.
- **The film** always blended right (`paintLayer`), so the stage and the film now agree.

## The law of 036

THE GRAPH IS THE PROJECT'S (036 S1, Josh 2026-11-03: "Nodes currently don't save into any project. Make sure that nodes get saved and that new projects removes all nodes" — his word reverses 021 R2 call 3). The graph and its CURVES grade are `presentation.nodes` = `{ v: 1, seq, list, at, curves? }` (`lab/nodes.js` `graph()`), written only while the graph is not THE DEFAULT one (a node, a grade off flat, or an id once given), so NEW, the demos and every older file keep their bytes; the window's place (`pan`, `zoom`, `win`, `off`) stays the device's. AN OPEN REPLACES THE GRAPH, as it replaces the timeline: `restore()` lands it through `nodes.load()` (the undo's road, one batch, the window rebuilt once, NODES' ring started afresh) right BEFORE the rack, so the file's `nodes.*` routes, lanes and bases find their targets; a file without one — every project saved before 036, NEW, a link — opens on the empty graph, the grade flat; an UNDO leaves it (NODES keeps its own ring; the edit scope never writes it); a RESUME of a session written before 036 keeps the graph the device record holds. A node edit dirties the project (`projectKey`) and books the session's save (`onEdit`). `lambdawaves.q0.nodes` and `.q0.curves` are the live mirror a reload boots from (RECORDS: PROJECT; the window's place WORKSPACE); the reader's graphs and curves (`.nodePresets`, `.curvePresets`) stay PREFERENCE and NEW never touches them. `tests/new-project.browser-test.mjs` scene 9 is its guard.

## The laws of 021

THE IDS (021 R2): a NODES id is `'n' + (++seq)` and never reused; runtime targets join the flash limiter with `flash`; `LW.mod.batch` rebuilds once; `unenroll` marks a route dormant, and a dormant route never wakes on another node. Since 036 `seq` travels with the graph in the project (its own id space), and `nodes.*` routes, lanes and bases ride in every capture — a project file (FOLDERS, EXPORT, .mir/.png), the session, a link and the unsaved mark alike (021's refusal, `asDevice` and `refuseNodes`, are gone).

NODES' keys are `nodes.*` rows of the action registry with `when: ground focused` (021 I1; Tab stays the kit's; the add menu on Shift-A).

## The standing paragraphs

THE LAWS OF NODES (019, `research/iteration-019/NODES-DESIGN.md`, `N-BUILD.md`): the graph COMPILES (`lab/nodes-compile.js`) to the kit's one picture filter (`setChain`, kit alpha.33) — TABLE nodes (CURVES · LEVELS · POSTERIZE · THRESHOLD · INVERT · GAMMA · EXPOSURE · CONTRAST, `lab/node-types.js`) fold into ONE feComponentTransfer and MATRIX nodes (HUE · SATURATION · LUMA · TINT · TEMPERATURE) into ONE feColorMatrix while contiguous; a PRIMITIVE (`lab/node-prims.js`: BLUR · SHARPEN · CHROMATIC ABERRATION · BLOOM and DISPLACE marked HEAVY) is a real pass in graph order; a LAYER (`lab/node-layers.js`: FILM GRAIN · VIGNETTE · SCANLINES) is a div in `#nodeLayers` over the stage (z 8, under the atom labels, the stage text and the racks, pointer-events none, never in the occlusion mask). The order is the window's top → bottom. A NEUTRAL or BYPASSED (⏻ MUTE, 036 P3) node emits nothing and keeps its values; CURVES alone writes the byte-identical 018 filter. ONE compile and ONE filter write per frame. THE COST IS ON THE CARD: · / ·· / ··· per class, HEAVY on BLOOM and DISPLACE, "N passes" at the graph's foot. Every number knob is a modulation target `nodes.<node>.<knob>` (root `nodes`, the runtime door). The graph is the PROJECT's (036, above; its device mirror `lambdawaves.q0.nodes`, where 018's record still opens), the reader's graphs PREFERENCE `lambdawaves.q0.nodePresets` beside the shipped FILM · POSTER · PRINT; the rack card is the chain as a column, the window the free graph. Screen only: a picture or a film does not carry the graph until RENDER bakes it. Run `tests/curves.browser-test.mjs`.

NODES BEYOND (020 X, `research/iteration-020/NODES-FLESH-OUT.md`, `X-BUILD.md`): `lab/nodes.js` is the model, `lab/nodes-view.js` the one view (window and rack card), `lab/nodes-undo.js` its own 30-step ring, `lab/img/nodes-icons.svg` the glyphs. THE COLUMN IS THE CHAIN: a card's place is its order; FADE and MASK (every node but a LAYER; FADE folds free, a masked node is its own run of prim markup, cost ···) are what a branch is for, so the graph stays a column. A FLAG IS NOT A RECORD: VIEW HERE and SOLO are the session's; BYPASS (the card's ⏻, hinted MUTE NODE since 036 P3 — the kit's `power`, BYPASS ALL's glyph; a muted node's power reads dim) and BYPASS ALL (`off`) are the record's; the card's × (the kit's plain `close`) REMOVES the node. THE KEYS ARE THE GROUND'S: NODES' keys fire only on the focused ground and never reach the kit's key table. A PREVIEW IS THE NODE'S OWN TRANSFER (`transfer()`, the compiler's fn / matrix), never a second render. THE DEFAULT GRAPH IS EMPTY and says so in one faint line; CURVES is removable, one at most. NODES opens FREE from the FINDER, WINDOW and the CSB; `nodes.*` bases are the project's with its graph (036). Run `tests/curves.browser-test.mjs` and `node tools/x-probe.mjs x4` (the byte-identical CURVES proof).

THE CURVES CARD (0.5.1 D10-24, `lab/rack.js` after the RENDER registration) is MIR's `createCurvesPanel({ parent, canvas: dom.canvas,
project: false })` — no `history`, no `port`, no `mod` — over the stage canvas: MASTER · R · G · B through the kit's one SVG picture
filter, so it grades the SCREEN only (`capture.js`' GPU readback, the film's `frame(i, ctx)` and THE LOCK never see a CSS filter) and
the card says so in one line. It ships CLOSED on the right rack after RENDER, in the FINDER and WINDOW; neutral reads `filter: none` and costs
nothing, a graded screen costs a compositor pass (WAVE DANCER: 15.0 → 12.2 presents/s on the headless rig; Josh's M5 report is the
real figure). AMOUNT is not routed (a flash route outside D10-19's guard). The grade is the PROJECT's since 036 (inside `presentation.nodes`), its live mirror the record
`lambdawaves.q0.curves` (FAMILIES; the model's `serialize()`, written 250 ms after a change, removed by FORGET), never a history row. A card that ships closed and that no layout lists is seated where an unlisted card stays (after RENDER), or `closed[]`
saves in two orders. `tests/curves.browser-test.mjs` is its guard; `__LW.curves` is the model.

## The law of 024

THE SHADER NODE (024 S, `research/iteration-024/S-BUILD.md`): A SHADER NODE IS A SPLAT ON THE TAP. The fifth class (`lab/node-shader.js`, `cls: 'shader'`, a LAYER for order: no FADE, no MASK, `gpu` in `compile()`'s layers) draws a GPU pass over the field's presented picture — `field.tap(fn)` copies the presented texture in `frame()`'s own submit while a SHADER node lives, and is cleared when none does (a graph without one costs nothing; THE LOCK never sees it) — into its own canvas in `#nodeLayers`, on the field's device, on each present and each knob change, never on a clock of its own (motion is PHASE routed from an LFO). DECOHERE is the first: a `point-list` splat of the picture (or its EDGES) through a noise-field family, one/one into rgba16float, then 1 − exp(−5·GAIN·ρ) to INK · PICTURE · PALETTE (the WAVE palette between its stops, `field.paletteLUT()`); AMOUNT 0 emits nothing; AMOUNT and SCALE are CSS px. Its cost is `····` HEAVY. 027 N (`research/iteration-027/N-BUILD.md`) adds three: FEEDBACK is the last output × DECAY, moved by DRIFT · ANGLE · SCALE and LIGHTENED under the fresh tap (a ping-pong rgba16float pair, stepped once per present), shown at MIX. REFRACT is the pool floor: the luminance × LENS a water surface, each grid ray bent by Snell through its slope (across SCALE px) DEPTH px down and splatted one/one as DECOHERE's, so the folds are the caustics (FRINGE a lens per channel; HEAVY). FLOW is COUNT points born from seed 13, stepped SPEED px a present along the LUMA or HUE (under PHASE, the phase) gradient, their segments laid into trails × DECAY. A STATEFUL node (FEEDBACK, FLOW) starts from black when placed, when a hand moves a knob and at a film's frame 0; a modulator's write steps on, and the film keeps its own state per node id, one step a frame (`bake(values, i, l)`). The chain's CSS filter is mirrored onto its canvas, so the column's colour nodes dress it whatever their place (a test caveat). Screen only, as every node.

SCREEN ONLY NO MORE (025 B): a film carries the graph — `lab/film-bake.js` runs the compiled chain, the layers and the SHADER node on each frame as a function of the frame alone (film.md THE FILM IS THE SCREEN); the older "screen only" lines above are history.
