# 021 Reviewer C: icons · the CSB expanded · animation and cramped space (Opus, read-only, yan-c @ aaf54b6; saved verbatim by Claude Sos). Rows marked "verify" need a Playwright picture before anyone builds on them.

## 1. THE ICON CENSUS
Six ways an icon is drawn:
| # | road | where | box · stroke | used by |
|---|---|---|---|---|
| 1 | kit glyph table, inline `<svg>` | `mir/glyph.js:57` `GLYPHS` (76 names), `W = 1.9` (:30), round caps; `chip`/`setGlyph`/`glyphEl`, `sw({glyph})` (kit.js:425), rail chips, FINDER `spec.glyph`, `latch` | 24 · 1.9 | close, dock/north/reopen, chevronDown (EXPAND), rewind, lanes (TIMELINE opener), invertColors, gallery (`#lwHome`, hidden), search, eye… |
| 2 | λWAVES files `lab/img/icons/*.svg`, 29, all CSS masks (none as `<img>`) | three mechanisms: `--ico` (lab.css:354–359; skin.css:842 `.mm-ico`; transport.js:60; picker.js:75), `--icon` (skin.css:1006–1008 `.lw-icon`), a hard `mask: url()` per selector (skin.css:641–643, 888; lab.css:351, 997, 1059, 1118–1139), plus a URL handed to the kit (keys.js:181 `doorIcon`) | 24 · 2 (arrow-left/right 3.5; cog-solid and heart-solid filled) | the CSB's seats, the Picker, FINDER/WINDOW rows for ATOMS/MOLECULES, FOLDERS fields |
| 3 | NODES sprite `lab/img/nodes-icons.svg` (26 `<symbol>` `n-*`, `<use href>`) | nodes-view.js:38–39, shown at 14 px (nodes.css:24) | 16 · 1.4 | NODES cards |
| 4 | inline SVG tables in app code | picker.js:190 `SHAPES` (stroke 1.6); paint-stroke.js:76 `GLYPH` (1.9) | 24 | Picker look tiles; FILL/EMPTY |
| 5 | Unicode text | transport.js:18–19, 35 `‹ › ⟳`; kit rack.js:386–387 `◧ ☆`; menu prefixes `⊕ ↑ ↺ ○` (notebook.js:83, 99; kit rack.js:1073; menubar.js:59); modwindow.js:966–968 `◂ ▸`; statesview.js:123 `⟲ ⟳` | font | expander steps, menus |
| 6 | the kit's `trig({glyph})` puts the glyph in as text (kit.js:518), while `sw({glyph})` (kit.js:425) puts in an SVG | — | one option name with two meanings |

Window → glyph. Rack cards registered from the DOM carry no glyph (`rack-wiring.js:45`). NODES registers `'curves'` (nodes.js:210) but the CSB's NODES seat wears `nodes.svg`; RENDER uses the kit's `render` (rack.js:858), `render.svg` never drawn; FOLDERS registers the kit's `folder` (rack.js:872) but the CSB wears `folders.svg`; ATOMS and MOLECULES get app masks in the FINDER only (notebook.js:119). HISTORY, CONTROL SURFACE, SPECTRUM, WAVE, STATE, CLIP, PALETTE, CAMERA, SETTINGS, INFORMATIONAL, EQUALIZER, FIELD, SEPARABLE, CENTRAL, LATTICE, EMISSION, BLOCH, PLANE, CALCULUS, LADDER, WIGNER, SHADOW, ORBIT, VORTEX, METERS, RADIATION have none (an empty `.wp-none` seat in the FINDER, window-picker.js:52). The special floating windows get no title icon because `createWindow` has no `glyph` option (window.js:267): MIR OPTIONS, MIR ABOUT, KEYBOARD, KEYS, TIMELINE, MODULATION, NODES, the FREE bar, the kit's FOLDERS window; PICKER and FINDER have no window head. CAMERA could take the kit's `cameraOrbit` (camera.js:409) but is registered through the DOM loop and drops it.

Drift and 16-px risks: the stroke at 20 px works out to kit 1.58 px, files 1.67, sprite 1.75, arrows 2.9 (visibly heavier). `library.svg` has 1-unit tick dashes that become blobs at 14–16 px; `molecular.svg`'s five rings fill in at 14 px; `cog-solid`'s eight teeth clog at 16 px. Pairs `info`/info-circle, `settings`/cog-solid, `folder`/folders, `home`/home.svg are the same idea drawn twice.

Ranked findings:
1. DRIFT: six roads; masks under two custom-property names. Fix: one table (below); delete `--icon` in favour of `--ico` now.
2. KIT: glyph.js has no extension door (`GLYPHS` module-private; exports at :510–574 only read). Fix: FOR-MIR `registerGlyphs({ name: markup })`, refusing collisions, so app icons go through `chip`/`spec.glyph`.
3. KIT: `createWindow` (window.js:267) and `device()` (kit.js:647) take no `glyph`. Fix: add `glyph`, drawn in the head and read by the FINDER, WINDOW menu and scroll pill.
4. DRIFT: NODES is `curves` in the FINDER and `nodes.svg` on the CSB; FOLDERS `folder` vs `folders.svg`. Fix: one name per window, declared at `register`.
5. DRIFT: FOLDS' word flips (transport.js:73–76) but `folds.svg` stays. Fix: `foldAll` / `unfoldAll` drawings chosen at the same read.
6. DEBT: `curves.svg` and `render.svg` are orphans, precached only (sw.js:119, 138).
7. KIT: `trig({glyph})` is text while `sw({glyph})` is SVG. Fix: `trig` uses `hasGlyph(o.glyph) ? glyphEl : text`.
8. DEBT: `‹ › ⟳` are text in the expander. Fix: the kit's `chevronLeft`, `chevronRight` and a new `repeat`.

The one system. The kit table is the vocabulary; λWAVES adds through the new door (`lab/icons.js`, a named `{ name: innerMarkup }` table registered at boot): 24-unit box, live area 2–22; stroke 1.9, round caps and joins, `currentColor`; solids `fill-rule: evenodd`; rendered at 16, 20 or 24 px only; naming law: meaning-named camelCase, never the character (`foldAll`, not `chevrons`). `nodes-icons.svg` moves into the table through the kit's own precedent for 16-unit drawings (`scale(1.5)`, `stroke-width 1.267`: glyph.js `edit`/`select`/`scrub`). Masks retire (29 fetches and their SW rows go).
To draw (the builder draws plain SVGs; Gemini via `agy` redraws, as 018 E1): special windows — keyboard, mirOptions, about (the λ mark), timeline (`lanes` stands), modulation (the sine), nodes (graph), finder (windowPlus), picker (library cleaned for 14 px), folders (one drawing), render (one drawing), history, controlSurface (fader + knob), notebook, informational; windows — atoms, molecules, palette (hue-ring), spectrum, wave, clip, equalizer, field, separable, central, lattice, emission, bloch, plane, calculus, ladder, wigner, shadow, orbit, vortex, meters, radiation; states — foldAll/unfoldAll, heart, sun, moon, rack, arrows redrawn at 1.9.

## 2. THE CSB EXPANDED
Today: EXPAND (`.tr-expand`, `chevronDown`) opens the kit's `tempoPanel` (mir/shell/transport.js:422) in the `panel` grid area (lab.css:329), above the bar at the foot (lab.css:333), one column docked or FREE (lab.css:401–402). skin.css:333 sets a two-column grid: Row 1 `.csb-repeats` (transport.js:111; lab.css:437–448): `‹ › ⟳` as 30-px round text seats, the REPEATS readout, the formula right-aligned, a hairline under. Row 2 left MACROS (`macroRail`, :477): the modwindow's slots with value, pad and delete hidden (:497) — a grip, a number in a 30-px depth arc, a reorder grip: no name, no value; two tiles across, `max-height: 92px`, scrolls (skin.css:339). Row 2 right CLOCK: TAP, WALL/FREE, ÷2, ×2, ×4, HOLD ¼, HOLD 1 — seven tiles in skin.css:363's 4 columns (the unlayered rule beats the kit's layered 5, transport.css:172), one empty seat; pressed tiles carry a 5-px LED dot (skin.css:525–528). Row 3 FAVOURITES (csb-favs.js; lab.css:426–433): a wrapping flex strip of 48-px knobs with labels, segments up to 300 px, INVERT as a 48-px glyph switch; empty = one faint line.
Against a DAW/VST surface it lacks: section heads; a fixed 8-slot knob bank with value readouts and a bank/page selector; named macros with values; a meter; BPM and time readouts in the panel; consistent row heights.

The proposal: one dark well and four labelled sections on a 44-px grid. TRANSPORT: ⏮ ‹ › ⟳ · REPEATS · BPM readout (tabular) · TAP · WALL/FREE · ÷2 ×2 ×4 · HOLD ¼ / 1 as one strip. MACROS 1–8: an always-8 knob bank, each slot a real knob with the macro's name and value, the depth arc as its ring, a lamp when routed; empty slots a faint "+"; PAGE ‹ › for 9–16; routing gestures stay `api.wireGrip`/`wireDepth`. FAVOURITES: 8 assignable slots on the same grid (`data-param` second faces), drag to reorder, its own bank selector. METERS: the modulation AUDIO device's LOW/MID/HIGH followers as three LED bars, the 7-band beat equaliser (eq-audio.js:18–23 already reads them every frame), a beat lamp on the clock.
Kit parts that exist: `knob`, `fader`, `readout`, `group` (heading only), `seg`, `sw` (with lamp), `trig`, `stepper`, `macroRail`, `tapButton` (:526). Meter/LED pieces exist inside the modwindow but are not exported: `m2meter` (modwindow.js:938–940), `liveLed` (:1020), `buildAudioMeter` (:1137).
To add (FOR-MIR, kit 1.5.5): `knobBank({ slots: 8, page })`; `meter({ bands, peak, led })` promoted from the modwindow; `lamp()`; `section({ title })`; a `macroKnob` face for `macroRail` (name and value shown); an `--xport-*` token set the app can retheme instead of skin.css copies.
Tools for the builder: the frontend-design skill (direction); the Playwright MCP (`browser_resize` at 1600, 1280 and 800; `browser_take_screenshot` before/after across docked, FREE and stage); claude-mem:design-is (a Rams-style audit of the result); Gemini (`agy`) for icon redraws.

Ranked findings:
1. DEBT/KIT: skin.css:333–363 and :425–528 are pre-018 copies of the kit's transport.css with literal numbers, unlayered, so they win over every `--xport-*` token and a kit restyle never reaches λWAVES. Fix: delete them; set λWAVES values as tokens on `#transport`.
2. DRIFT: the macro rail scrolls inside the panel (skin.css:339, 92 px) — breaks 017 R2's "no inner scroll" law in the docked card. Fix: pages of 8 (`lab/pager.js`) or the bank selector.
3. BUG: a touch hold on an offered segment never fires because any `pointermove` cancels it (csb-favs.js:100–103). Fix: cancel only after a move over 8 px (kit `TAP.px`).
4. DRIFT: the favourites' `.k-lbl` is `nowrap` with no clipping (kit base.css:247): a label longer than 48 px spills. Fix: `max-width: 100%; overflow: hidden; text-overflow: ellipsis` in the kit.
5. KIT: macro tiles hide their names and values (transport.js:497). Fix: the `macroKnob` face.
6. DEBT: the favourites strip has no reorder and no cap. Fix: 8 slots plus a bank.

## 3. UI ANIMATION BUGS AND CRAMPED SPACE
Reported, and where they stand: 017 F4 diamonds under the pills — fixed (017 R1 `b6bb922`); 018 Picker hover/page-turn fake out — fixed (018 A1); 018 E BPM pill ring while expanded — fixed (018 F); 020 INFORMATIONAL restarts — fixed (020 S1); 020 ◧ peek fight — fixed (020 S1); 020 PLAY's press sequence — fixed (020 T1); H re-centres the stage words — parked (S-BUILD Q3); a disabled seg's hint unreadable (`pointer-events: none`) — open (017 W); 018 calls 15, 18, 23, 28 — parked.

Edge cases found in the code:
| scenario | what happens | sev |
|---|---|---|
| FOLDS with mode-hidden or LEGACY windows | kit `isOpen` ignores `hidden` (mir/shell/rack.js:558, 1129), so `foldable()` (transport.js:72) counts hidden cards; a folded hidden MOLECULES makes the first press "EXPAND ALL" and visibly do nothing | BUG med |
| a centred floating window taller than vh − 112 (NODES 640 h at vh < 712; KEYBOARD; any `createWindow`) | window.js:97–100: `h = min(P.h, vh − 16)` but `top = max(56, …)`, clamped only to vh − 52, so the bottom (and resize corner) lands up to 40 px off-screen | KIT med |
| short screen (1280×720) with MIR OPTIONS, KEYBOARD or NODES open | THE BAR IS ON TOP; `modDodge` (shell/modulation.js:196) yields only to TIMELINE and MODULATION, so the 84-px bar covers the bottom groups of MIR OPTIONS (1152 × ~690, centred) | BUG med |
| stage bar with both racks open below ≈ 1450 px | the bar is centred on the viewport (skin.css:49 `left: 50%`), not the stage; PLAY floats 76 px outside its left edge (lab.css:362) and lands over the left rack's cards at 1280/1366 | DRIFT med (verify) |
| desktop window 700–860 px wide, or a phone cycled to STAGE | skin.css:501 sets `left: rack-w + 10; width: auto`, but lab.css:325 `width: max-content` has higher specificity: the 674-px bar starts at 310 and overflows the right edge by ≈ 180 px; below 698 px its grid also overflows its own box | BUG med (verify) |
| FREE bar dragged near the bottom, then EXPAND | `fitFree` (mir/shell/transport.js:727) grows the window, but the clamp keeps only 52 px on screen, so the panel opens below the fold; up to 142 px can hang off the left edge (CLAMP.x 120) | KIT low |
| a GRAIN node while paused | `node-grain` keeps stepping at 24 Hz (nodes.css:98), against the "nothing playing ⇒ no frame" law; stopped in a hidden tab; reduced motion covered (:100) | DRIFT low |
| reduced motion | covered: the rack and bar slide (lab.css:738–757), the Picker (`calm()`), the kit's controls. Not covered: CSB PLAY's hover `translate` (lab.css:370), INVERT's 180° turn (lab.css:434), `.nodes-chev` rotate (nodes.css:45), hue-ring rotate (skin.css:888) | DEBT low |
| hidden tab | the rack loop (rack.js:217–221), chord audio, mod-port and Picker springs all check it; the rest is event-driven | — |
| 32 ms coalescer | two engines: `lab/frame-coalescer.js` (rAF or 32 ms) and the kit's `frame.coalesce` (rAF); no CSS transition on the notebook's box, so no fight | DEBT low |
| MIR OPTIONS at 1280 | min(1152, 1216) → four columns at 1152 wide, centred; as designed | — |

Ranked findings:
1. BUG: FOLDS acts on hidden windows. Fix: transport.js:72 `&& !document.querySelector('.dev[data-id="'+w.id+'"]')?.hidden`; better, the kit's `windows()` reports `hidden`.
2. BUG: the bar covers MIR OPTIONS, KEYBOARD and NODES on short screens. Fix: modDodge's `under` covers any open `#floats` window rect, not only TIMELINE/MODULATION.
3. BUG: the stage CSB overflows at ≤ 860 px. Fix: in lab.css's `@media (max-width: 860px)`, `#transport.mini[data-layout="csb"] { width: auto; max-width: calc(100vw - var(--rack-w) - 20px) }`, or dock under 860.
4. KIT: tall windows cut off. Fix: window.js:100 clamps `top` to `max(0, vh − h − CLAMP.inset/2)`.
5. DRIFT: the bar centres on the viewport, not the stage. Fix: `left: calc(50% + (var(--rack-l-w) − var(--rack-r-w)) / 2)` from the racks' resting widths (stage-words' `resting`).
6. KIT: FREE re-clamps on growth: `fitFree` re-runs `place()` against vh.
7. DEBT: close the reduced-motion list (four selectors); pause GRAIN while `!clock.playing`.

## FOR 022
(a) THE ICON TABLE: the kit's `registerGlyphs` plus `glyph` on `createWindow` and `device` (MIR 1.5.5); `lab/icons.js` replaces the masks, the sprite and the inline tables; every window declares one glyph; Gemini redraws the list above. (b) THE CSB AS A CONTROL SURFACE: TRANSPORT · MACROS 1–8 (`knobBank`, named, valued, paged) · FAVOURITES (8 slots, reorder) · METERS (`meter` promoted from the modwindow, fed by eq-audio); delete skin.css's copied transport rules first. (c) CRAMPED-SPACE PASS: FOLDS hidden filter, the bar dodging every float, the CSB at ≤ 860 and its stage centring, the tall-window clamp, FREE re-clamp. (d) A Playwright sheet at 1600, 1280×720, 1024 and 800, plus a phone.
