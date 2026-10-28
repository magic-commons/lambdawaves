# 022 chain C — THE CONTROL SURFACE (Opus builder, it022-C, BASE f1c43fa4)

## C1 THE PARTS — kit 1.5.6-alpha.7 (clone road; kit eef6443 + a547da5)
- `kit.js` (+78): `lamp({ on, colour, parent, cls, title })` (an `i.mir-lamp`, lit `[data-lit]`, its light `--lamp`); `meter({ bands, peak, led,
  vertical, labels, parent, tag, cls, bar, key })` (bars filled to `--signal`, LED segments, a falling `--peak`, words under the bars;
  `set(values)` once a frame through `frame.coalesce`, `paint(values)` now); `section({ title, parent, cls })` (`data-mir-surface="section"`, a
  hairline frame, its title a `label()` strip at the top-left); `knobBank({ slots: 8, page, onPage, items, onEmpty, onMove, cellMin, label })`
  (a fit row of always-8 slots, `--cell-min` 44; an item is a built face `{ id, root, span }` or knob options; an empty slot a faint "+", a
  button with `onEmpty`; ‹ n / N › past eight; a grip reorders with the modulation window's `wireReorder` engine, or ← →).
- ONE METER: the modulation window's `.m2meter`, `.m2audminleds` and the AUDIO device's live `.m2audled` are now `meter()` / `lamp()` in the
  window's own classes (same DOM, same paint; modwindow 32/32, modulation-stack 10/10, audio 40/40). The AUDIO editor's SVG meter
  (`buildAudioMeter`, drawn in the curve's coordinates) stays the window's: a FOR 1.5.6 line.
- `shell/transport.js` (+52): `macroRail({ face: 'knob', onAdd, apply })` → a knob bank of `macroKnob` faces; `createTransport({ macros: { face:
  'knob', onAdd } })` passes it through; a hand on a macro knob is `M.setMacro` + `clock.applyAll(true)` + `view.sync()` once a frame. `macroKnob`:
  NAME over a kit knob holding the macro's value, the VALUE, a lamp while routed or armed, and the foot — the window's routing grip
  (`wireGrip`) and numbered depth seat with its arc (`wireDepth` / `paintDepth`). The tile rail is untouched and stays the default.
- CSS: base.css the parts (+37); skin.css `well` and `section` are INNER surfaces (the 9 pane rules skip them; `:where([data-mir-surface="well"])`
  takes `--glass-well` and `--relief-well`); transport.css the surface rules (+30). Tokens (tokens.json, docs/TOKENS.md regenerated):
  `--xport-well` (declared on the body, so it is the skin's own well where the bar clears its wells), `--xport-section`, `--xport-grid` 44px,
  `--xport-led`, `--xport-led-off`, `--lamp`, `--peak`.
- Version 3 sites; CHANGELOG 4 lines; docs/CONTROLS.md "A surface is a surface"; LLM.md; gallery `controls.html` card SURFACE (a well, MACROS
  bank of three + five "+", METERS LOW · MID · HIGH with LEDs and a lamp). Kit lines: code + CSS + gallery 232 added (≤ 320); tokens.json +155
  (seven schema rows, data), en.json +16 (generated).
- Kit tests (MIR_CDP_PORT 9686, kit on :9684, one Chromium): node 81/81 (tokens 1402 rows, intent lint ok, i18n catalogue), transport 35/35,
  modwindow 32/32, controls 62/62 (gallery), kit-paint 24/24, intent 36/36, audio 40/40, themes 33/33, modulation-stack 10/10.
- Adopted, pinned `'1.5.6-alpha.7': 59d60b70…` (re-pin after a547da5); CLAUDE.md line 14 and docs/laws/kit.md read alpha.7; docs/FOR-MIR.md
  "BUILT 1.5.6-alpha.7 · THE SURFACE PARTS". **Bundle: `.tmp/kit-1.5.6-alpha.7.bundle`** (kit-1.5.5 @ a547da5 + v1.5.5).

## C2 THE SURFACE (app; transport.js + csb-favs.js + csb.css: +80 / −46 lines; eq-audio.js +4 / −2)
The expander (`.native-tempo`) is ONE WELL (`data-mir-surface="well"`, `--xport-well`) of four kit sections, heads through `label()`:
- TRANSPORT — ⏮ (the `home` action's seat, rewind glyph) ‹ › ⟳ as glyph chips · REPEATS (the readout, takes the rest of the line) · BPM
  (tabular, the beat lamp on it: lit for the first 15 % of each beat while playing; the typed pill of 018 F stays the way to set it) · the kit's
  own tiles TAP · WALL/FREE · ÷2 ×2 ×4 · HOLD ¼ · HOLD 1 moved into one 44-px strip (their `.tempo-clock` pane removed: no 4-column grid, no
  hole) · the theorem under it. In a card REPEATS takes the first line and the tiles go four a line.
- MACROS — the kit's knob bank over the model's macros (eight slots; the model's MACRO_MAX is 8, so the 9–16 pages exist but never show);
  an empty "+" adds a macro (`addMacro` + the window's rebuild + `hNote`); grip and depth as before; values repaint at 5 Hz while open.
- FAVOURITES — csb-favs' list as a knob bank: eight slots, a segment takes four, drag the grip (or ← →) to reorder, its own page past
  eight (`lambdawaves.q0.csb` gains `page`, read with a default 0); the strip no longer grows; the empty hint moved to the bank's tooltip.
- METERS — the first AUDIO device's LOW · MID · HIGH followers (`audioDevice(app)`, now exported from eq-audio.js: the one read AUDIO IN uses)
  as LED bars with peak hold, and the beat equaliser's seven gains as a small bar meter; `set()` per frame from `transport.update()` only
  while the panel is open. On the STAGE METERS stands beside MACROS and FAVOURITES; in a card the four stack.
Nothing scrolls inside the panel in any seat (the 92-px `tempo-rail` scroller is gone). The skin reaches all of it (MORPH dark below).

| seat | bar collapsed (before = after) | panel open before → after | inner scrollers before → after |
|---|---|---|---|
| STAGE 1600 | 92 × 674 | 228 → 300 | tempo-rail → none |
| STAGE 840 | 92 × 674 | 228 → 300 | tempo-rail → none |
| docked (rack card) | 206 (card 268) | 515 → 652 | tempo-rail → none |
| FREE | 202 (window 242) | 460 → 633 | tempo-rail → none |
Same numbers under MORPH dark (±1). The docked card is 256 wide when open (the RACK's own scrollbar appears: the card is taller than the
viewport); the bar's width and collapsed height are unchanged everywhere.

Pictures: `research/iteration-022/C-shots/{before,after}/<look>-<seat>-<width>-<state>.jpg` — looks `lambdawaves-light` (first run) and
`morph-dark`, seats stage 1600 / 840, rack, free, collapsed and expanded (`tools/csb-sheet.mjs`, 50 lines; three macros and five favourites).

## design-is (Rams' ten, on the after picture, one line each)
1. Innovative — the density's own period and its theorem sit in the transport strip beside BPM: a physics clock on a DAW surface.
2. Useful — every macro shows its name and value and turns from the bar; all eight slots show at once; favourites page instead of sprawl.
3. Aesthetic — one well, four hairline sections, one 44-px rhythm; the meters are the one accent mass; MORPH dark reads as a panel.
4. Understandable — four named heads; "+" where a macro can go; the beat lamp on BPM; LOW/MID/HIGH and 1–7 under the bars.
5. Unobtrusive — the collapsed bar is untouched (92 × 674); the surface paints only while open.
6. Honest — the readings are the model's (macro %, BPM, the followers, the gains); no AUDIO device reads 0, not a fake level.
7. Long-lasting — all kit tokens and skin surfaces: a SKIN change re-skins it; no app colours.
8. Thorough — open: grip and depth seat are 18 × 20 drawn with no 44-px outset; the theorem ellipsizes in a card; the stage panel is 72 px taller.
9. Light — no inner scroller, no timer; meters ride the frame loop through the coalescer; the macro bank re-reads at 5 Hz.
10. As little as possible — the MACROS | CLOCK grid, the tile hole, the scroller and the repeats row's sheet are gone; the app's CSB code is net +34.

## Tests
`node tests/pwa.test.mjs --write && ./test.sh node` exit 0 (after C1 and C2); mir-manifest PASS; adopt --check in step; rack-deps HOLDS
(persist 24/25); dependency-cruiser 0 app-side cycles; new-project --check in step; hints-census in the gate. Browser (LW 9683 / GD 5683):
hide-reveal, window-switching, routed-knob 7/7, timeline, keyboard-window, current, history, new-project, curves, frame-occlusion GREEN;
tools/csb-probe: 674 / 280 in every state; the rack card 262 → 256 while open (the rack's scrollbar), no errors. THE LOCK `--check --query gastab=0`: GREEN 843 · 0 · 0 page errors. LOCK leaves moved: none.

## For docs/laws/shell.md (the close)
THE SURFACE IS A SURFACE (022 C): the CSB expanded is ONE WELL (`data-mir-surface="well"`, `--xport-well`) of four kit `section()`s on the
44-px grid — TRANSPORT (⏮ ‹ › ⟳ · REPEATS · BPM with the beat lamp · the kit's clock tiles as one strip · the theorem), MACROS (the kit's
`knobBank` of `macroKnob`s: name, value, lamp, the window's grip and depth seat; eight slots, "+" adds), FAVOURITES (eight slots, reorder by
the grip, a page past eight, `lambdawaves.q0.csb.page`) and METERS (the AUDIO device's LOW · MID · HIGH, the equaliser's gains; painted per
frame only while open); nothing scrolls inside it in any seat; `tools/csb-sheet.mjs` takes its pictures and heights.

## FOR 1.5.6 leftovers
- `buildAudioMeter` (the AUDIO editor's SVG level and bands) is not the kit meter. - The macro knob's grip and depth seat want a 44-px finger.
- The bank reorders favourites only; macros reorder in the window's rows (the tile rail's reorder is kept for the tile face).

## Open questions for Josh
1. The STAGE panel grows 228 → 300 px (names, values and the meters now show). Keep, or fold METERS into TRANSPORT's line to save ~40 px?
2. Macros cap at 8 in the model, so MACROS never pages (call 8's 9–16 needs MACRO_MAX 16 in the kit). Raise it?
3. The beat lamp lights for the first 15 % of each beat while playing. Brighter, longer, or on the bar's BPM pill too?
