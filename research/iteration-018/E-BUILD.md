# CHAIN E — THE CSB AND THE FINDER · BUILD (Opus builder, 2026-10-27; branch `it018-E`, base 638a8c8)

Kit 1.5.0-alpha.30 → **1.5.0-alpha.31** (one bump for the chain; three FOR-MIR lines; manifest re-hashed, pin in `tests/mir-manifest.test.mjs`).
LOCK leaves moved: none. `lab/sw.js` written once at the end (`node tests/pwa.test.mjs --write`).

## E1 ICONS (call 6: plain SVGs, Gemini may redraw)
- `lab/img/icons/`: `cog-solid.svg` (8 teeth, punched centre by even-odd), `heart-solid.svg`, `sun.svg`, `moon.svg`, `window-plus.svg`,
  `info-circle.svg`, `rack.svg` (◧ as a drawing). 24-unit box, stroke 2 like `modulation.svg`; all used as CSS masks in the ink.
- `tools/e-shots.mjs`: this chain's picture probe (boot, run a setup body, crop to the union of a selector's boxes, small JPEG).

## E2 CSB LAYOUT (`lab/shell/transport.js`, `lab/lab.css`; kit `shell/transport.js`)
- λWAVES passes its own array under the kit's drawing name `csb` (title CONTROL SURFACE kept). The stage bar, left to right:
  PLAY floats OUTSIDE the left edge as a round chip of its own (`data-mir-surface="chip"`; `contain: layout` on the bar, was `layout paint`,
  which clipped it) · **RATE over the BPM pill · MOD over EXPAND** · a 2 × 2 of ⏮ TIMELINE / the door, the dock · CENTRE the chooser
  (`.mol-pick`, 220 px) over LIBRARY · MOLECULAR · HYDROGEN · FOLDERS · RIGHT a 4-wide grid SEARCH FINDER ♥ ◧ / INFORMATIONAL THEME ⚙.
  Why: Josh's three fixed points (PLAY out left, rate/tempo/MOD far left, picker dead centre over the library buttons); the time verbs sit
  beside the tempo, the window/rack verbs and the look verbs on the right. Dead centre = equal side tracks (`--csb-side: 212px`, the left
  block's width); under HYDROGEN the chooser's seat stays, empty (`visibility: hidden`), so the bar is **674 px in both modes** (csb-probe).
- Every seat is one 36-px round box, flat until hovered, icon 20 px (kit glyphs and app masks alike).
- `t = n` left the bar (call 10): `app:time` is no longer placed; TIMELINE's own reader (`keys.js` `ui.tlTime`) shows it.
- TEMPO typed on a click, EXPAND opens the expander — kit: a new layout part `'expand'` (`.tr-expand`, glyph `expand`, aria-expanded,
  `.on`) and `tempoPill({ typed })`, true when the layout names `expand` (the click goes to the kit's number field, as the work bars').
- Pictures: `E-shots/e2-csb-before.jpg` (HYDROGEN, base) · `e2-csb-after.jpg` (MOLECULES, before E3's buttons).

## E3 THE NEW BUTTONS (`lab/shell/transport.js`, `lab/lab.css`)
- INFORMATIONAL (info-circle): any INFORMATIONAL switch on → one press turns every bool row of `INFO_ROWS` off and remembers which were on;
  the next press puts that set back (the rows' defaults when nothing is remembered, e.g. after a reload: memory only, no new stored key).
  Accent while any is on. FOLDERS (folders.svg, key action `folders`). THEME: sun in light, moon in dark (CSS on `body[data-theme]`),
  `app.hooks.setTheme` light ↔ dark only (call 11). ⚙ MIR OPTIONS is the solid cog; ♥ FAVOURITES is the solid heart, accent while its list is open.
- Pictures: `e3-csb-buttons.jpg` (light, MOLECULES), `e3-csb-dark.jpg` (dark, INFORMATIONAL off).

## E4 RACK CSB (CSS in the E2 commit; this commit is the pictures)
- Docked card and FREE window: one wrapping flow in the stage's order — PLAY · RATE/BPM · MOD/EXPAND, the chooser (full width), the modes +
  FOLDERS, then the eleven icons at 32 px, centred (6 + 5 in the 262-px card, 7 + 4 in FREE). `e4-rack-csb-docked.jpg`, `e4-rack-csb-free.jpg`.

## E5 FINDER (kit `window-picker.js/.css`, `rack.js`, `rack.css`, `css/base.css`, `locales/en.json`; app `notebook.js`, `keys.js`,
`rack-wiring.js`, `ink.js`, `occlusion.js`, `index.html`, `lab.css`, `skin.css`)
- The word FINDER: WINDOW menu row `FINDER…`, key action `windowPicker` (id kept) short `finder`, label/hint, the CSB's window-plus title,
  the surface's aria. No WINDOWS heading; placeholder `search windows`; no accent focus ring. `layout.windowPicker` → `layout.finder`.
- Every mode-hidden window is listed greyed: `chem` → MOLECULES ONLY, every other hidden card → HYDROGEN ONLY (they are hydrogen's
  windows hidden by a molecule or by a non-hydrogen system). Legacy: all five are deleted, so nothing to leave out; `can()` returning null
  now leaves a row out if one ever needs it.
- SHIFT-click queues (badges `.wp-num` 1 · 2 …, `.queued`), Shift's release opens them in pick order (kit `openOrder`); the ☆ of the latest
  favourite layout per row (`rk.lastFavourite()`; it now reads λWAVES' v3 records, which say `closed` — the old + list's star never lit here).
- A pick = kit `rk.reveal(id)`: an open window is scrolled to, unfolded, ringed 900 ms (`.mir-reveal`), never moved; a closed one opens at
  its rack's top and the rack scrolls to the top; a float comes to the front. `open:` no longer calls `raise`.
- Removed: `#rackAdd`, `#rackAddList`, kit `addMenu` / `el.add` / `el.addList` / `drawAdd` / the queue / `.rack-add-none`, app `layout.addMenu`,
  the hidden-row pruner in rack-wiring, their CSS (lab, skin, kit rack.css) and occlusion ids.
- Pictures: `e5-finder.jpg` (MOLECULES: HYDROGEN ONLY rows, BLOCH 1 · CENTRAL 2 queued), `e5-finder-star.jpg` (the ☆ rows).

## TESTS
- GREEN browser: molecular-names (re-aimed: the finder's `open/close/shown/queued`; an open MOLECULES is revealed without a reorder; × stands
  it down so the finder greys it MOLECULES ONLY; a SHIFT queue of two opens both — its old :89 red is gone), curves, emission (re-aimed to the
  finder's rows), keyboard-window, window-switching, menubar (re-aimed: CLEAR's playhead reading is TIMELINE's t), offer (16/16).
- GREEN node: mir-manifest (alpha.31), first-run 13/13, keyboard-shortcuts, window-activity, pwa, `new-project --check`,
  `rack-deps --classes --no-write` → HINGE HOLDS (spectrum 25).
- Tools re-aimed: `csb-probe.mjs` (EXPAND opens the expander), `stage-dead-probe.mjs` (no rackAddList). Not run: legacy boot.

## CLAUDE.md (for the integrator)
- AMEND lines 82, 101, 512 "listed in + and WINDOW" / "in + and WINDOW" → "in the FINDER and WINDOW"; the legacy rule "Do not re-list them in
  + or WINDOW" → "in the FINDER or WINDOW".
- REPLACE in THE CONTROL SURFACE paragraph (line 577) the A1 + A8 bar description with: "018 E2–E4: λWAVES' own layout array under the kit's
  `csb` drawing: PLAY floats outside the left edge (a chip); RATE over the BPM pill (a click types it) and MOD over EXPAND (kit part
  `expand` opens the expander) at the far left with ⏮ TIMELINE / the door, the dock; MOLECULES' chooser dead centre over LIBRARY · MOLECULAR ·
  HYDROGEN · FOLDERS; SEARCH · FINDER · ♥ · ◧ / INFORMATIONAL · THEME · ⚙ at the right; 36-px seats, 20-px icons (lab/img/icons); 674 px in
  both modes. No `t` on the bar in any seat (TIMELINE's reader). The rack card and FREE wrap the same order."
- ADD: "THE FINDER (018 E5, kit window-picker.js) is the one window list: mode-hidden windows greyed HYDROGEN ONLY / MOLECULES ONLY, SHIFT
  queues, the ☆; a pick reveals (kit `rk.reveal`: scroll, never reorder; a closed window opens at the top). The + list is gone."

## OPEN QUESTIONS FOR JOSH
1. The kit's `expand` glyph (two bars, arrows out sideways) reads "widen"; a chevron that flips with the panel may read better. Gemini?
2. INFORMATIONAL's remembered set is per session (no stored key); after a reload the press brings the defaults back. Keep, or store it?
3. The right block has 7 icons in a 4-wide grid (one empty slot); a future CSB button has a seat waiting there.
4. The WINDOW menu's own window rows still RAISE (reorder) — make them reveal too?
