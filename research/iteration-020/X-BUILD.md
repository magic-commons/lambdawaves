# CHAIN X — NODES BEYOND (Opus builder, 2026-10-27; branch `it020-X`, BASE 98581ce; kit 1.5.0-alpha.33, no kit edit)

## X0 THE CLEAN SLATE (9f6e987)
- The split: `lab/nodes.js` (222) is the model (list, verbs, records, the two seats, the API); new `lab/nodes-view.js` (311) is the one view,
  built twice (window `win`, rack card `card`). `createNodes`' signature and API hold; rack.js and `tools/rack-deps.mjs` untouched (HINGE holds).
- CURVES is a node like any other: × bypasses, the bin (now on every bar) removes; at most one (load keeps the first), id `curves`; the kit
  model lives on without a node and comes back in the next CURVES. `has()` = present and not bypassed; `setHas(true)` adds it.
- THE DEFAULT GRAPH IS EMPTY: no record and no grade → STAGE IN → STAGE OUT and the faint "Hit + to add a node" (hidden once a node exists).
  A record with `list` opens as saved; 018's `curves: false` / `at.curves` record, or a grade with no NODES record, opens with CURVES.
- The + menu is one column: a search line (focused on open; type to filter; Enter adds the first match; Escape closes), a hairline with
  the class glyph between classes (no word), each row icon + name + cost mark (HEAVY kept), then a divider, GRAPHS as before.
- `lab/img/nodes-icons.svg`: 21 types + 4 classes (ramp · grid · lens · stack) + in/out, 16 px currentColor strokes (`<use href>`), for Gemini.
- NODES opens FREE (item 8): the FINDER and the WINDOW menu's window rows go through `reveal()` in `lab/shell/notebook.js` — `nodes` opens
  `LW.nodes.open()` unless the rack card is seated open (then it is revealed); the key row `curves` opens the window. DOCK still seats the card.
- `tests/curves.browser-test.mjs` re-aimed: asserts the empty first-run list, then `__LW.nodes.setHas(true)` before the S-curve.

## X1 THE GROUND (67e72f4) — window only; the rack column never zooms or selects
- Zoom 0.5–2× (ctrl/⌘ + wheel about the pointer, two-pointer pinch): `scale` + `translate` on the plane, the dot grid's size/position follow;
  kept as `zoom` in the record. FIT (the home glyph beside +, Home): bounding box, 24 px margin, clamped.
- Selection: a title press selects (shift toggles), shift + drag on the ground draws the dashed box (a plain drag pans), a click on the empty
  ground clears; selected cards wear an accent outline; a selected title drags the selection; arrows nudge 1 px (shift 10).
- Keys only on the focused ground (tabindex 0, stopPropagation on every key — the kit's key table never hears them): Delete/Backspace,
  Ctrl-D (new ids, same values, +24 px), Ctrl-A, Escape, M, Tab / Shift-A (menu, search focused), Home, Ctrl-Z / Ctrl-Shift-Z / Ctrl-Y.
- `lab/nodes-undo.js` (22): 30 snapshots (list: type, values, bypass, at, name, fold; plus in/out places). Every verb marks; a knob drag and
  an arrow run coalesce (first move opens, 400 ms quiet closes). Probe: dup 3→6, Delete 6→3, undo 6, redo 3; a key never leaked.

## X2 THE CARD (4b6fcf1)
- Chevron (and H): collapsed = bar + strip; COLLAPSE ALL / EXPAND ALL one toggling head button and a ground-menu row; `fold` is recorded. RENAME: a double press on the title (350 ms; the window's grab cancels a real dblclick, so it counts presses) or the menu; Enter/Escape;
  empty = the type's name. The name shows on the bar and re-enrols the targets: `nodes.n1.gamma` reads "my levels GAMMA". Ids never change.
- PREVIEW: every TABLE/MATRIX card (CURVES too) has a 128 × 10 canvas — grey ramp over hue ramp through `transfer(q, T)` in nodes-compile.js
  (the same `fn` / `matrix`, FADE included), redrawn coalesced when the node's values or the curve move. LEVELS γ 2.2: grey @64 = 187 ✓.
- Right-click: card VIEW HERE · SOLO · BYPASS · COLLAPSE · DUPLICATE · RENAME · RESET · MOVE UP · MOVE DOWN · REMOVE; ground ADD… · FIT · TIDY ·
  COLLAPSE ALL · BYPASS ALL (the menus are the + menu's list style, clamped inside the ground). TIDY = every `at` cleared → one column.

## X3 THE FLAGS (0aa19c3)
- `compile(list, TYPES, cache, { upTo, solo, off })`. Eye per bar (VIEW HERE; again = STAGE OUT), SOLO (hover/lit mark, S), BYPASS ALL
  (head power glyph, `\`, ground menu). Cards past the view (or not soloed) dim. Foot: "2 passes · viewing 3 of 4", "solo", "graph off".
- VIEW/SOLO are the model's session `flags`; BYPASS ALL is `off: true` in the record. Probe: 3 → 2 primitives viewing 3 of 4 → 3; solo 1; off → `none`.

## X4 FADE AND MASK (4623ef4)
- `FOOT` in node-types.js: FADE (0–1, home 1, shown %), MASK (NONE · LIGHTS · DARKS · MIDS · CENTRE · EDGES, a stepper), SOFT (0–1, home .5) on
  every node but a LAYER; a "FADE · MASK" fold under the knobs, lit off home. FADE and SOFT are targets (`nodes.n1.fade`, `.soft`).
- Compiler (128): TABLE fade folds `y + a(f(y) − y)`, MATRIX `(1 − a)I + aM` (free); a faded PRIMITIVE or luma TABLE and every MASKED node
  is its own prim run: output named `<id>x`, then `feComposite arithmetic k2 = a, k3 = 1 − a` with `$IN`, or the mask `<id>m` in ALPHA
  (luma → alpha + a 33-entry soft-threshold `feFuncA` table × FADE; CENTRE/EDGES: `feImage` of a 64² radial PNG, cached by kind + soft,
  `preserveAspectRatio none`, `feFuncA` slope = FADE) then `feComposite in` + `over $IN` (the arithmetic product of mask and difference
  is not expressible without clamping, so in/over is the exact mix). Own runs are cached by id + version (handed back by identity).
- **No kit change** (generic SVG; `$IN` resolves per attribute). Masked LEVELS: 5 primitives, mark ···; faded BLUR +1. Screen (headless Firefox, LEVELS γ 3): lights 232→246 lifted under LIGHTS with a dark pixel kept (79→83); DARKS lifts it (166) and keeps
  lights (232.2); CENTRE lifts the centre (217); FADE 50 % sits between (125 / 239).
- **describe() proof** (`tools/x-probe.mjs x4`, CURVES alone, MASTER S + R LIFT, FADE 100, MASK NONE): through the compiler vs 018's
  `setTable` pair — `{ matrix: false, table: true, css: url("#mir-picture-1") }` both, markup **byte-identical (5411 B)**, and back again.
  Shipped: POSTER's POSTERIZE at FADE 85 % (free), PRINT's CONTRAST 1.5 MASK MIDS SOFT .6 (names kept).
- Found and fixed: adding any knobbed node marked the PROJECT unsaved (`modulationBases()` in notebook.js wrote every registered target's
  base into the project signature, `nodes.*` too), which now bit CURVES (FADE/SOFT) and broke curves step 5's NEW. `nodes.*` are filtered.

## Files · tests
`lab/nodes.js` 222 · `lab/nodes-view.js` 311 · `lab/nodes-undo.js` 22 · `lab/nodes-compile.js` 128 · `lab/nodes.css` 100 · `lab/node-types.js` +6 ·
`lab/img/nodes-icons.svg` · `lab/shell/notebook.js` (reveal, bases) · `lab/shell/keys.js` (one row) · `lab/sw.js` (--write) · `tools/x-probe.mjs`
(scenes x0–x4, x4px, compat, dirty, card) · `tests/curves.browser-test.mjs`. Pictures: `research/iteration-020/X-shots/x0…x4*.jpg`.
- `./test.sh node` GREEN after every row; `pwa --write` each row. Browser (gate 9677 / gd 5677, one Firefox): curves GREEN, frame-occlusion,
  history, lw-facade GREEN (180 members — `__LW.nodes` gained duplicate · setFold · rename · reset · move · tidy · setView · setSolo · setOff
  · undo · redo; the fixture lists only top-level members, so no re-capture is needed). rack-deps HOLDS (25); new-project in step (16098 B).
- THE LOCK `--check --query gastab=0`: 843/0 GREEN. No leaf moved. Older records probed: 018 → `curves×`, 019 list → as saved, FADE 1 NONE.

## CLAUDE.md (after "THE LAWS OF NODES (019")
NODES BEYOND (020 X, `research/iteration-020/NODES-FLESH-OUT.md`, `X-BUILD.md`): `lab/nodes.js` is the model, `lab/nodes-view.js` the one
view (window and rack card), `lab/nodes-undo.js` its own 30-step ring, `lab/img/nodes-icons.svg` the glyphs. THE COLUMN IS THE CHAIN: a
card's place is its order; FADE and MASK (every node but a LAYER; FADE folds free, a masked node is its own run of prim markup, cost ···)
are what a branch is for, so the graph stays a column. A FLAG IS NOT A RECORD: VIEW HERE and SOLO are the session's; BYPASS (×) and BYPASS
ALL (`off`) are the record's. THE KEYS ARE THE GROUND'S: NODES' keys fire only on the focused ground and never reach the kit's key table.
A PREVIEW IS THE NODE'S OWN TRANSFER (`transfer()`, the compiler's fn / matrix), never a second render. THE DEFAULT GRAPH IS EMPTY and says
so in one faint line; CURVES is removable, one at most. NODES opens FREE from the FINDER, WINDOW and the CSB; `nodes.*` bases are never the
project's. Run `tests/curves.browser-test.mjs` and `node tools/x-probe.mjs x4` (the byte-identical CURVES proof).

## Open questions for Josh
1. A FINDER pick of NODES reveals the rack card when it is seated open, else opens the window. Always the window instead?
2. Old project files may still carry `nodes.*` bases and apply them on open (only the capture side was filtered). Ignore them on open too?
3. A masked PRIMITIVE reads its mask from its input: a masked BLUR blurs only the lights and its spill into the darks is cut. Fine?
4. Touch pinch is built but was proved only through ctrl + wheel (no touch device here); the search line's placeholder is plain English.
