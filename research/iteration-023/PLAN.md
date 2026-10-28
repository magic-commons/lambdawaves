# ITERATION 023 — QUICK REQUESTS: THE BAR, THE ROWS, THE DOORS (Claude Sos, integrator on `yan-c`; Josh 2026-10-28, at the machine)

Josh's prompt: `PROMPT.md` (verbatim). His six shots: `josh-shots/` — `GOOD-settings-display.png` and `GOOD-wave.png` are THE REFERENCE for a row (his standing note, kept forever: "put as much on a row and have it evenly neat and aligned while saving space"); the other four show the faults (INFORMATIONAL's clipped first row and its ragged rows, WAVE's two ESP rows, the CSB bar's glowing PAUSE and the clipped preset chip). No research round: the facts are in the rows below (file:line at `c50ac699`; grep the symbol).

## THE LAW OF 023 (to docs/laws/shell.md at the close, under A ROW FITS)
- A ROW IS EVEN (Josh 10-28): WAVE and SETTINGS › DISPLAY are the reference. A row carries as much as fits, evenly spaced; a column keeps its place from row to row (knobs over knobs, switches over switches); a row never clips at the window's narrow width; height is saved, never added. A readout's unit lives in its hint or its value, not beside a control.

## CHAINS (one Opus builder each, one at a time, each on the merged tree; BASE in the CLOSED table; MERGE ORDER D → B → R)
### D — THE DOORS (kit MIR 1.5.6-alpha.9, the clone road; every row additive; adopt back; pin; bundle)
D1 BEHIND IS DOTTED: the camera rig's three world rings (`lab/mir/panels/camera.js:111`, one polyline each) and any axis line it draws: the part that lies behind the view plane (projected depth < 0, away from the eye) is drawn dashed (`stroke-dasharray`, the same width, half the ink), the part in front solid — split each ring at its depth sign changes into two paths; the CLIP window's plane view if it draws its own (grep CLIP in `lab/` for the window; if it is the app's own drawing, do the same there — the only app line in this chain) — a picture of CAMERA and CLIP after, tilted.
D2 THE FACE TABS WEAR GLYPHS: the KEYBOARD's face tabs (`lab/mir/keyboard/keyboard.js:132` `faces`, `win.tab`) and its MORE KEYS/THE BOARD trig (`:116`) take a glyph each with the word as the hint: a panel declares `{ name, body, icon }`; the kit window's tab chips draw `icon` when given (the 1.5.6-alpha.3 glyph road, `windowGlyphs`/`registerGlyphs`) and the word stays the aria name; λWAVES' MAPPING face passes its glyph (draw a plain `mapping` into `lab/icons.js` — a key cap with a route — if none fits; one app line). 
D3 THE CHIPS' MOTION: the modulation window's chip buttons (`lab/mir/modulation/modwindow/modwindow.css`, `.tbtn`/`.m2*` chips) are on the old look; they take the kit's trig motion (hover raise · :active press · release) that TIMELINE's and KEYBOARD's buttons have — one rule set shared with the trig, no new tokens, nothing bigger.
D4 ONE NOTCH IS ONE BPM: the kit transport's tempo wheel (`lab/mir/shell/transport.js:390`) steps 1 BPM per notch (a mouse notch = one event, `Math.sign(deltaY)`; a trackpad accumulates pixels to a notch of ≈ 50 px; `deltaMode` 1/2 = a notch); Shift = 0.1 — wherever the tempo is turned by wheel: the CSB, the TIMELINE and the MODULATION window all read the kit's tempo part (verify; if the app has its own tempo wheel in `lab/shell/transport.js`, say so for chain B).
D5 THE CLOCK TILES ARE A CHOICE: if the `T = …`/`t = …` tiles of the CSB are the kit's clock tiles (the strip `tempoPanel` `:412` draws, `lab/csb.css:115` seats), the strip takes `tiles: [...]` (which tiles to draw; default all) so chain B can drop the two; if they are λWAVES' own, no door — say so.
Kit laws: words through `label()`/`t()` + the English pack; version sites 3/3, a CHANGELOG line per door, i18n re-extracted, `npm test` in the clone; adopt (`node .tmp/kit/tools/adopt.mjs .`), pin the manifest sha in `tests/mir-manifest.test.mjs` ACCEPTED, `--check` in step; the bundle `git bundle create <abs path>/.tmp/kit-1.5.6-alpha.9.bundle kit-1.5.5 v1.5.5` and its absolute path in the BUILD note.

### B — THE BAR (the CSB; `lab/csb.css`, `lab/shell/transport.js`, `lab/actions.js:130`)
B1 EXPAND ALL SHOWS THE PILLS: when FOLDS runs as EXPAND ALL (`lab/actions.js:130`), every open window's title pill (the rack's `.rack-pill`, `lab/mir/shell/rack.css:112`; the scroll pill road) shows for a moment (≈ 1.2 s, the pill's own in/out transition) then hides as after a scroll; through the rack's pill api if it has one; else the smallest door (alpha.10 on the clone road, D's bundle as the base).
B2 NO T= / t=: the two clock tiles go from the bar and the expanded TRANSPORT (D5's `tiles`, or the app's own list); nothing else in the strip moves.
B3 PLAY/PAUSE: the outline and glow on the lit button (`lab/csb.css:46–52`: `--state-on-light`/`acc-glow`, the hover wash) gone; the button takes the kit's trig motion exactly as TIMELINE's play (hover raise · press · release); the preset chip in the bar's top row ("Lithium …") no longer clips at its bottom (its box vs the row's height — the shot `csb-bar-play-glow-preset-clipped.png`); the collapsed bar's height unchanged; a picture before/after at 1600 and 840.
B4 THE VERTICAL BAR: the side/vertical CSB's upper half (the layout with the bar at a side) laid out with air: groups (transport · readouts · the preset and its arrows · the tools) with a gap between groups, aligned on the bar's grid, not one centred clump; the lower half keeps its order; before/after pictures at the side.
B5 (only if D4 said the app owns a tempo wheel) 1 BPM per notch there too.

### R — THE ROWS AND THE WORDS (the reference: `josh-shots/GOOD-*.png`)
R1 SETTINGS › DISPLAY: the gamut row is ONE row — GAMUT sRGB · P3 and IN P3 CONVERT · VIVID side by side (`lab/windows/settings-card.js:92–104`; "DISPLAY-P3" → "P3" on the seg; the readout may keep the long name); the two segs on the fit grid, no wrap at 300 px.
R2 INFORMATIONAL (`lab/informational.js`; the shots `informational-rows.png`, `informational-formula-clipped.png`): the rows read as SETTINGS does — STAGE FORMULA · SIZE; NAME · SUBTITLE · LIST CAP; ATOM LABELS · SIZE; BALL AND STICK · OPACITY · SIZE; ORDER · AROMATIC and IONIC · H-BOND; POSITION TOP/BOTTOM · PAD; ESP BAR · side · PAD — the switch column stretches, the knob column is one column (knobs over knobs), even gaps; the first row no longer clips at the window's narrow width (find the min-width/overflow that cuts STAGE FORMULA); `tools/row-fit.mjs` shows no added height.
R3 WAVE's ESP rows (`lab/windows/material.js:60–80`; the shot `wave-esp-rows.png`): SIZE · RADIUS · MAP ONLY and PROBE · RANGE · LIVE · SLOW share their columns (knob over knob, the switch in the third column, same gaps); ISO · SAS · SES between them stays.
R4 THE TIMELINE's t: its time readout sits off its neighbours (no shot landed; open TIMELINE, read the transport's `app:readout`/clock beside the play row, `lab/mir/timeline/window.js:36`, `readout.js`) — aligned on the row's baseline and box; if the fault is the kit's, the smallest door on the clone road (alpha.10/.11); a picture before/after.
R5 THE NOTE IS UPRIGHT: the window's ⓘ note (the hover/toggle text) reads italic — find the face or tag (`lab/mir/info/faces.css` Spectral italic, an `<i>`/`<em>`, or a `font-style`) and set the note upright in the UI face per `lab/mir/css/base.css:155`.
R6 THE ESP STRIP: the "ψ · a.u." caption leaves the strip and goes into the strip's hint; a LEFT or RIGHT strip is placed from the stage edge and the rack on its side only — never from the bar — so the CSB opening, expanding or folding moves nothing (`lab/shell/stage-words.js:314` `free`, `:177–190` the resting boxes); a test: CSB expand/collapse → the strip's rect unchanged.
R7 THE WORDS ARE LIVE: INFORMATIONAL's stage texts (name, formula, subtitle) lag or stick after a change, "as if trying to figure out where the window is" — diagnose in `stage-words.js` (`rest()` keeps `kept`; `resting()` reads rack boxes; `KATEX_MS` 250; the placement key `rackKey()`; a closed or folded window's rect still counted?) and fix the root: the words follow what is drawn and move at once on a change; a measured before/after (ms from the change to the word on screen) in the note.

## CALLS FOR JOSH (he is at the machine; defaults stand unless he says otherwise before the chain runs)
1. (D2) MAPPING's glyph is a drawn key cap with a route; MORE KEYS wears the kit's `more` glyph. Default: yes.
2. (B1) The pills show for 1.2 s on EXPAND ALL. Default: yes.
3. (B2) `T =` and `t =` go from the bar AND the expanded TRANSPORT. Default: both.
4. (R1) The seg says P3; the gamut readout keeps "DISPLAY-P3". Default: yes.
5. (R6) "ψ · a.u." becomes the strip's hint. Default: yes.
6. (D4) A wheel notch = 1 BPM; Shift = 0.1 BPM. Default: yes.
7. (all) Kit 1.5.6-alpha.9 (and .10/.11 if B/R need a line) on the clone road; the bundle carried; you fetch when you like (021 call 12).
8. (D1) 'Behind' assumes the sphere is seen from above; flipping it is one sign in depthOf. Default: as built.
9. (D3) Only the modulation window's chip rail moved; the buttons inside (ADD MACRO / ADD DEVICE, TAP · SYNC · HOLD) are one more kit line on your word. Default: as built.
10. (D1) The plane square and the camera film stay solid where they lie behind the view. Default: solid.

## MERGE ORDER
D → B → R; each merged with the recipe (`git merge --no-ff --no-commit`, `--ours lab/sw.js`, `pwa.test --write`, rack-deps, new-project, mir-manifest, `./test.sh node`, THE LOCK 843/987) and recorded below.

## CLOSED
| chain | base | commit | note |
|---|---|---|---|
| D | 7335da8f | 9915e18e | kit 1.5.6-alpha.9 (kit-1.5.5 @ 3ce9bc2, bundle carried to .tmp/it021/kit.bundle): D1 rings and CLIP's plane dashed behind the view · D2 KEYBOARD tabs wear glyphs (icons.js mapping) · D3 modulation chip rail on the trig motion · D4 one notch = 1 BPM on the CSB, TIMELINE and modulation tempo fields · D5 no door: T=/t= is the app's periodFx (transport.js:32–34, :114, :255–259; csb.css:130, :143); test.sh node EXIT 0, LOCK 843/0 and 987/0 |
| B | 9915e18e | | |
