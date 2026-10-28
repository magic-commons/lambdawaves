# 022 Researcher U: the UI-unification census (Opus, read-only, yan-c @ d627b32 before chain V landed; kit MIR 1.5.6-alpha.2; saved verbatim by Claude Sos)

Rack note: kit `skin.css:24` overrides base.css's `--rack-w: 372px` with 300 px; λWAVES never resets it (picker.js:153 and keplerview.js:57 fall back to 300). Card = 300 − 2×6 inset = 288; `.native-clean .dev-body` padding 10/12 (skin.css:293) leaves W ≈ 262 px of content; `.native-clean .row` gap 8 (skin.css:296).

## 1. RIGHT-CLICK AND HOLD-TAP
| surface | right-click | hold (touch) | where |
|---|---|---|---|
| knob, unrouted | kit TIMELINE CLIP: CREATE AUTOMATION CLIP · LOCATE CLIPS, then app rows ADD/REMOVE CONTROL SURFACE | 500 ms, 8 px slop, dial only | timeline/knobs.js:24–49; csb-favs.js:85 |
| knob, routed | mod-pop: RANGE seg · REMOVE · REMOVE ALL · RESET · held-by chips | 600 ms | modulation/window.js:930, 935, 993, 1317, 1335; handed over by keys.js:101 |
| CSB favourite rows | own tl-pop copy (ADD/REMOVE) | 500 ms; any move cancels it | csb-favs.js:93–105 |
| the bar | seat menu BOTTOM/TOP/COMPACT | 500 ms | mir/shell/transport.js:821, 867, 873 |
| NODES card / ground | VIEW HERE·SOLO·BYPASS·COLLAPSE… / ADD…·FIT·TIDY·EXPAND ALL·BYPASS ALL | none | nodes-view.js:106, 139–155 |
| FOLDERS tiles/folders | kit sv-context | 560 ms, 10 px, vibrate | folders/gallery.js:502–513, 452, 476 |
| PATTERN rows | pt-menu | — | pattern/window.js:155, 300 |
| TIMELINE clip | right button deletes (FL law); menu by press | — | timeline/editor.js:337, 357, 161 |
| swallowed by a law | SPECTRUM/ladders (right = remove, paint-stroke.js:28); CURVES (curves.js:138); modwindow curve (window.js:2657); lanes (lanes.js:229, hold 250 ms = peek); rail grip (rail.js:266, hold 450 = seat pick) | | |
| hold with no menu | rack header lift 400 ms (rack.js:60, 691); XY corner store 450 ms (xy.js:48); info layer 480 ms (info/layer.js:55) | | |
| no menu at all (the browser's) | stage (stage-gestures.js:74 takes button 0 only; scene-guard.js:108 eats contextmenu only over guarded overlays), rack window titles, Picker tiles and page, FINDER rows, notebook, ESP bar and stage words, switches, segs, trigs, menubar rows | | |
Hold-tap has no law: durations 250/400/450/480/500/560/600 ms, slop 6/8/10/14 px or any move; `TAP = { ms: 300, px: 14 }` (kit.js:156) covers only the double tap. iOS Safari fires no `contextmenu` on a long press, so NODES has no menu on iPad/iPhone. `-webkit-touch-callout: none` only on `.k[data-param]` (timeline.css:368) and two modwindow selectors.
Menu APIs: there is no ONE API; there are eight. (a) the menubar's renderer: entries `[label, run, disabled, hint, {sub, checked, radio, icon}]`, private, opens only from the bar (menubar.js:94, 110); (b) `listPane`, a choose-one listbox (select.js:42); (c) six hand-made poppers: `tl-pop` (knobs.js:24; editor.js:161; csb-favs.js:93 a copy), `mod-pop` (window.js:1338), `nodes-pop` (nodes-view.js:139), `pt-menu` (pattern/window.js:302), `sv-context` (gallery.js:392), `mir-transport-seats` (transport.js:821); each its own Escape; only csb-favs uses `A.escape`. A builder should get a kit door `contextMenu({ x, y, entries })` built on (a).
Findings: 1 BUG NODES has no hold → nothing on touch (nodes-view.js:106, 155; seam the kit's `holdTap`); 2 BUG a favourite's hold dies on 1 px jitter (csb-favs.js:105; cancel past `TAP.px`); 3 DRIFT one knob carries two menus by routed-or-not (knobs.js:49 vs window.js:935), the unrouted one has no RESET (one knob menu with ROUTES ›); 4 KIT no exported context-menu builder, no hold constant (export `contextMenu`, add `TAP.hold = 500`, `TAP.slop = 8`); 5 DEBT the stage's right-click shows "Save image as…" (stage-gestures.js:74).
Proposed menus (✓ toggle, • radio, NEW = new action id), each ≤ 8:
| surface | items |
|---|---|
| stage | `view` • › · `style` • › · `palette` ✓ · `camReset` · `camera.flip` ✓ · `camera.lock` ✓ · NEW `copy.picture` · `hide` ✓ |
| rack window title | `window.<id>.fold` ✓ · NEW `window.<id>.float` · NEW `window.<id>.side` · NEW `window.<id>.reset` · NEW `window.<id>.solo` (fold the rest) · `notes` ✓ · `window.<id>.close` |
| knob | NEW `knob.reset` · NEW `knob.copy` / `knob.paste` · NEW `knob.fine` ✓ · ROUTES › (mod-pop's RANGE · REMOVE · REMOVE ALL; NEW `knob.route` arms modArm on it) · CLIP › (the kit's two rows) · fav add/remove · NEW `knob.copyId` |
| switch / seg | NEW `control.reset` · NEW `control.learn` (MAPPING LEARN on its `action.<id>`) · fav offer · NEW `knob.copyId` |
| the bar | `dock` ✓ · seat BOTTOM/TOP/COMPACT • · `csb.expand` ✓ · `theme` • · `folds` · `modArm` ✓ · `gui` · `hide` |
| Picker tile | NEW `picker.open` · NEW `picker.fav` ✓ · NEW `picker.isomers` · NEW `picker.keep` (download; chemview.js:218) · NEW `copy.name` · NEW `copy.formula` |
| Picker page | NEW `picker.look` • · `csb.search` · `folders` · `open` |
| FOLDERS item | kit rows stand; add `open` · `export.mir` · `export.png` |
| SPECTRUM lanes | (right-click is REMOVE) on the ContextMenu key, Shift+F10 or a still hold: `state.clear` · `state.normalize` · `preset.next`/`prev` · `copy.latex` · NEW `spectrum.solo` |
| notebook | `notebook` ✓ · NEW `notebook.copy` · `copy.link` · `copy.latex` · `export.json` |
| NODES | exists; onto the door, add hold and `A.escape` |
| TIMELINE clips | the kit's (editor.js:161) stands |
| FINDER row | `window.<id>.open`/`close` · `.fold` ✓ · NEW `.float` · `notes` |
| ESP bar / stage text | `view.formula` ✓ · `view.labels` ✓ · `view.captions` ✓ · `view.badges` ✓ · NEW `esp.side` • · NEW `copy.formula` · `copy.latex` |

## 2. POPUP LISTS AND THE SKIN
The kit's law exists: `.glass, [data-mir-surface]` takes its material from the card style (skin.css:460–544; base.css:172), and `[data-mir-surface="menu"]` takes `--surface-shadow-menu` (skin.css:467).
| popup | file:line | material today | follows the skin? | surface attr |
|---|---|---|---|---|
| `listPane` / stepper list / MIR OPTIONS SKIN·TONE | select.js:45–46; gui.js:397 | `.glass` + kit tokens | yes | menu ✓ |
| palette presets | material.js:255 `.lw-menu.pal-pick` | skin.css:568–569: hard tint .985 / .62 and blur(28px) saturate(1.25) | partly | menu ✓, overridden |
| MOLECULES chooser | chemview.js:197 native `<select>` | the platform's | no | — |
| other native selects | statesview.js:89, 122; orbitalsview.js:112 | the platform's | no | — |
| NODES + menu and popup | nodes-view.js:139, 211; nodes.css:67, 74 | hard `hsl(tint / .97)`, wears a control's `--neu-raise` | no | none |
| FINDER | window-picker.js:34 `.glass` | kit | yes | none |
| menubar `.mb-list` | shell.css:140, 219, 225 kit; lab.css:216 (unscoped, .97), skin.css:448 (.65, backdrop none, `--glass-shadow`), :858 | λWAVES beats `--surface-veil`/`--surface-shadow-menu` | no | — |
| bar seat menu | transport.js:821 `.glass.mb-list` | picks up lab.css:216's .97 | no | none |
| CSB suggest | csb-search.js:16 `.lw-menu.glass` | skin.css:568–569 hard | partly | none |
| Picker look drop | picker.js:197 `.mm-lookdrop.lw-menu` | skin.css:743 hard .92, no `.glass` | no | none |
| Picker isomers | picker.js:631 `.mm-isos` | skin.css:699–700 hard .97, radius 18 | no | none |
| FOLDERS context | gallery.js:392 `.sv-context` | folders.css:189–190: a WELL (`--glass-well` + `--relief-well`) | no | none |
| modulation target picker | modwindow.js:1296, 1311 | `--m2-plate` + `--glass-filter` (modwindow.css:1293), `--surface-fill` (modhost.css:719); skin.css:859 hard .94 | partly | none |
| mod-pop | window.js:1338 `.mod-pop.glass` | pane shadow, not menu; lab.css:682 duplicates the kit rule | yes | none |
| tl-pop (kit, csb-favs) | knobs.js:24; editor.js:161; csb-favs.js:93 | `.glass` | yes | menu ✓ |
| pt-menu | pattern/window.js:302 | its own `--pt-menu-fill`/`--pt-menu-shadow` (pattern.css:102) | no | none |
| hint tip and ⓘ panel | skin.css:308–318 | hard gradients `!important`, backdrop none | no | — |
THE LAW: every popup is `.glass[data-mir-surface="menu"]` and reads only: body `--glass-tint`, `--card-opacity`, `--surface-fill`, `--surface-veil`, `--frost-filter`/`--glass-filter`, `--surface-sheen`; edge `--surface-edge-width`, `--surface-edge`/`--pane-edge`, `--surface-radius`; shadow `--surface-shadow-menu`; rows `--state-hover`, `--state-on`, `--state-on-rim`. Row layout stays free. The ".97 so the graph can't read through" becomes one kit token NEW `--surface-menu-floor` instead of six hard alphas.
Files: λWAVES nodes.css:67–74; skin.css:308–318, 448, 566–569, 699–700, 743, 859; lab.css:216, 682–686; csb-search.js:16; picker.js:197, 631; nodes-view.js:139, 211; chemview.js:197; statesview.js:89, 122; orbitalsview.js:112. Kit: folders.css:189; pattern.css:102 + pattern/window.js:302; modwindow.css:1293; window.js:1338; transport.js:821.
Findings: 1 BUG four native `<select>`s break the kit's "never the platform's list" law (select.js:3); 2 DRIFT seven λWAVES rules hard-code menu alphas and blur; 3 DRIFT FOLDERS draws its menu as an inset well, NODES with a control's raise; 4 KIT seven kit popups lack `data-mir-surface="menu"`; 5 DEBT the hint tip's `!important` ignores every skin.

## 3. SKINS AND THE "WHITE BLOB"
Skins FROST · MORPH · CLASSIC · SWIFT · AURORA · NEON (shell/themes.js:39–64). λWAVES' first run (rack.js:110): light / refractive / frost always / blur 22 / vivid .5, shine 0.
| skin | card | shadow · dist · soft | shine · shineSoft | shine α light / dark | solid lift (light) |
|---|---|---|---|---|---|
| FROST | refractive | 2 · 2 · 8 | 0 | — | — |
| MORPH | solid | 1.4 · 6 · 14 | .7 · 14 | .38 / .72 | 100 % |
| CLASSIC | tinted | 1 · 2 · 8 | 0 | — | — |
| SWIFT | solid, relief flat | 0 | 0 | — | — |
| AURORA | refractive | 1.5 · 3 · 14 | 1 · 18 | .54 / 1.00 | — |
| NEON | solid | 0 | 0 | — | 66 % |
The blobs: `--shine-term` (skin.css:252) is a white `offset dist, blur shineSoft` layer, drawn additively on rack cards (`plus-lighter`, skin.css:354–356) — AURORA dark a pure-white 18 px glow, MORPH offset 6 px; under SOLID `--neu-raise` (skin.css:188) puts a 6 px blur, 2.8 px-offset highlight in `--solid-lit` on every control, and in light mode `--solid-lit` is the pane mixed 100 % with white; light `--neu-raise` (skin.css:124) is a 3 px blur at white .90 plus an inset at .9 — the first-run look's halo. λWAVES never overrides relief, but 14 sites use `var(--neu-raise)` raw so RELIEF FLAT never reaches them: skin.css:23, 44, 80, 404, 405, 432; nodes.css:13, 68; keymap.css:20, 48, 86, 95; lab.css:174, 658; lab.css:674 adds a 7 px accent halo.
| token | skin | today | proposed |
|---|---|---|---|
| `--neu-raise` highlight | light, non-solid (first run) | (−1,−1) 3px white .90 | (−1,−1) 1px white .70 |
| `--neu-raise` highlight | solid (MORPH, NEON) | (−2.8,−2.8) 6px `--solid-lit` | (−1,−1) 2px; lift capped 45 % (light) |
| `--neu-raise` drop | solid | (2.8, 2.8) 6px | (1.5, 1.5) 3px |
| `--neu-inset` | solid | ±2, 4px | ±1, 2px |
| `--shine-term` | all | dist · shineSoft · α ≤ 1 | `min(dist, 1px)` · `min(soft, 2px)` · α ≤ .35 |
| theme values | MORPH | shine .7 / soft 14 | .5 / 2 |
| theme values | AURORA | 1 / 18 | .5 / 2 |
| GUI SHINE SOFT knob | gui.js:173 | max 48 | max 6 |
| `--shine-gain` | dark | 2.04 | cap 1.2 |
Pins: λWAVES none (official-defaults-palette pins card, frost, 22 px, vivid; THE LOCK does not see CSS); kit tests/look.node.mjs:47–48 (a dark pane's lift ≥ 18, dark gain > light gain — cap the light lift only); tests/themes.browser.mjs:67–70 (shine opposite the light; SHINE 0 draws no layer); tools/stylehash.mjs re-baselined on purpose.
Findings: 1 KIT AURORA's and MORPH's shine are the reported blob; 2 KIT SOLID's relief highlight is pure white at 6 px in light mode; 3 DRIFT 14 λWAVES sites bypass `--relief-raise`; 4 DEBT light `--neu-raise` at .9 is the first-run halo.

## 4. HINTS
App (lab/ minus mir): 338 strings (`title:` 166, `hint:` 92, `.title=` 73, `tip:` 5, `hint()` 2); ≤ 40: 127 · 41–80: 104 · 81–140: 79 · > 140: 28 · 152 over 60. Kit: 290 (55 over 60). en.json: 1,512 strings. Action labels: 87, 13 over 60, used as bar-seat hints (shell/transport.js:68). The tip is 280 px wide: a 200-char hint runs to 6 lines.
The 40 longest with ≤ 40-char rewrites: stage-words.js:71 (220) "Position spread ellipsoid (√λ axes)"; material.js:58 (220) "Opacity curve · 0.6 = exponential"; statesview.js:111 (216) "Tracers on the current j/ρ"; stage-words.js:70 (214) "⟨r⟩ bead and its trail"; :29 (212) "Write the playing state on stage"; :39 (211) "Longest state list written in full"; meters.js:25 (207) "f16 grid vs exact, per voxel"; chemview.js:979 (206) "Basis defect · {n} pts · {p} %"; stage-words.js:74 (205) "STATUS under the formula"; static-field.js:108 (202) "Squeeze r (cap 0.33)"; eq-audio.js:15 (199) "Follows AUDIO: LOW·MID·HIGH → n"; chemview.js:218 (198) icon `download` + "{mb} MB"; stage-words.js:14 (189) "Name a hand-picked preset"; :69 (183) "Dipole arrow (a.u.)"; :15 (174) "Show the picked molecule's head"; chemview.js:464 (173) "ΔD since the kick, signed"; stage-words.js:67 (171) "Dotted ionic/dative bonds"; :62 (169) "Ball size × covalent radius"; chemview.js:279 (166) "{volume} · icon download"; orbitalsview.js:113 (159) "Register preset"; stage-words.js:34 (159) "Isomer tags under the name"; chemview.js:412 (154) "MIX: lit lines in phase"; stage-words.js:65 (153) "Double and triple bonds"; material.js:75 (150) "ESP: re-solve live (≤ 1/s)"; chemview.js:440 (149) "Valence density (core removed)"; mir/shell/gui.js:498 (146, kit) "Light direction, clockwise"; static-field.js:55 (145) "F = {F} · NUMERICAL ({ms} ms)"; material.js:66 (143) "ESP colour span ±RANGE Eh/e"; statesview.js:76 (141) "Dipole scope δμ(t)"; :73 (140) "Excited states: ω, f"; material.js:51 (138) "ESP map on the surface"; stage-words.js:44 (135) "Formula margin"; statesview.js:141 (135) "Drive H with the track's E_z(t)"; chemview.js:469 (134) "Current tracers (kick + RUN)"; shell/modulation.js:159 (134) "STATES lane {i} phase"; stage-words.js:48 (132) icon `side`; material.js:306 (132) "LOCK: pan and zoom at centre"; chemview.js:533 (126) "Electron potential at nuclei"; emissionview.js:55 (126) "Play A ↔ B (Shift: once)"; orbitalsview.js:55 (126) "MO ladder ε_k (Eh)".
THE LAW: a hint is one line ≤ 60 characters through `hint()`; the second sentence moves to the window note or ⓘ; a glyph replaces words where one exists.
Labels longer than their control (`.k-lbl` nowrap, no clip, base.css:247; ≈ 6.6 px/char at 8 px .14em: spills from 10 chars in 64 px, 9 in 56, 8 in 48, 7 in 46): wignerview.js:55 "P RANGE a.u."; :53 "Z RANGE a₀"; sliceview.js:92 "EXTENT a₀"; shell/transport.js:22 "RATE a.u./s" (58 px); static-field.js:65 "DEFECT L²"; spectrum.js:99 "ELEMENT Z" (52); settings-card.js:189 "HALF-WIDTH"; static-field.js:63 "STARK K_z"; :108 "SQUEEZE r"; spectrum.js:112 "λ SCALE" (52); chemview.js:517 "AMPLITUDE"; gui.js:418 "BRIGHTNESS"; :428 "SATURATION"; :504 "SHINE SOFT"; as favourites at 48 px: EXPOSURE (material.js:34), STRENGTH (settings-card.js:181), ZEEMAN B, ROTATE z; switches: MOLECULES ON (chemview.js:139 `.mol-top` nowrap), OVERLAY ON FIELD (vortex.js:24).
Findings: 1 DRIFT 152 app hints over 60 (stage-words.js 14 of the top 40); 2 DRIFT action labels double as hints (a `hint` field ≤ 40); 3 KIT `.k-lbl` no ellipsis.

## 5. ROWS AND KNOBS
Kit primitives: `.row` a wrapping flex row, `space-between`, gap 5 (base.css:137, 237); `.row > .trig/.sw/.seg/.ro` grow (:139); `group()` only a heading (kit.js:733); the knob cell a fixed 62 px `flex: 0 0 auto`, the dial 34 px or 42 `lg` (base.css:246–251); no knob size tokens, no `--cols`, no auto-fit anywhere in the kit. λWAVES overrides: knob cells 64 (skin.css:301), 68 (:326), `1 1 60` (:321), 64 (:360), 52/56/46 (lab.css:832, 843–849), 46 and 30 (lab.css:400, 164), 58/48/44 (lab.css:334; csb.css:114, 63).
| window | rows (controls) | grid rule | knob px | empty per row at W 262 | wraps |
|---|---|---|---|---|---|
| SETTINGS | ~12 (sw · seg · ro, 2 knobs) | flex; `.sw 1 1 110`; segw 100 % (skin.css:319–325) | 64 | STAGE+GAMMA row 118 | yes (sw 2 per line) |
| PALETTE | 3 + ramp | row tight; ADD·ROTATE·swatch·INVERT | 64 | ~60 | no |
| WAVE | SPACE · OBS · 6 knobs · STYLE · ESP 4 + 3 | `.k 1 1 60` (skin.css:321) | 60 → stretched to 82 | 0 slack, 48 px air around each 34 px face | 6 knobs → 3 + 3 |
| CAMERA | 2 trig · 3 sw · seg · sphere + 4-knob column · motion 2-col | skin.css:326, 398 grids | 68 | 3 per line = 42 | 4 → 3 + 1 |
| CLIP | ON row + 2 knobs | grid `repeat(2)` centred (skin.css:378, 384) | 64 | 67 per cell | no |
| SPECTRUM | lanes + ham body | lanes grid 7 tracks (lab.css:390); ham `repeat(3, 56px)` | 46 / 52 / 56 / 28-dial in one window | ~78 | lanes no |
| MOLECULES | top line + steppers + mrow + shelf | `.mol-top` nowrap; shelf `auto-fill minmax(76px, 1fr)` (lab.css:732) — the only auto-fill row | 64; mrow nudged `top: 11px` (lab.css:729) | — | shelf yes |
| INFORMATIONAL | 6 hand grids | `1fr 1fr 56`, `1fr 56 30`, `1fr 56 56`… (skin.css:828–843) | 56 | per grid | no |
| FIELD | ZEEMAN·STARK·sw·trig; 6 drives; DRAG; SQUEEZE·CAT | `native-rotors repeat(3)` (skin.css:395) | 64 | drives 23 per cell; last row 118 | 1st row likely |
| EQUALIZER | stepper+ro · faders · sw · seg | `eq-mix` grid (skin.css:542) | faders | — | no |
| GAS | 3 knobs · seg · 2 trig · ro | ham body, 52 (lab.css:832) | 52 | 90 | no |
| NODES card | `.nodes-knobs` flex centred (nodes.css:20) | card 120 / 236 / 250 | 62 | 120 card: 1 per line | yes |
THE LAW: a control row is `display: grid; grid-template-columns: repeat(auto-fit, minmax(var(--cell-min, 40px), 1fr))`; the knob cell `width: auto; min-width: 0`; the face scales with its cell: `.k { container-type: inline-size }`, `.k-dial { width: clamp(var(--knob-min, 28px), 62cqi, var(--knob-max, 44px)); aspect-ratio: 1 }`; labels under the face with an ellipsis; `.sw`, `.seg`, `.trig` stretch (span 2 when wider than one cell); n knobs fit one line while n·40 + (n−1)·4 ≤ W (6 at 262 px), so no row adds height for a control that fits. Exceptions: CURVES, the camera sphere and PAN pad, pictures (SPECTRUM lanes, the mol shelf, the ramp, EQ faders, NODES' plane), the CSB. Mechanism: a kit door `.row.fit` (CSS) + `row(parent, { fit: true })` + tokens `--knob-min`, `--knob`, `--knob-max`, `--cell-min`; opt-in so 1.5.x apps don't move; λWAVES deletes the flex-basis overrides and the fixed grids.
Findings: 1 BUG 64/68 px cells make 4-knob rows wrap 3 + 1 at the 300 px rack (skin.css:301, 326); 2 DRIFT eleven knob widths, four in SPECTRUM; 3 KIT no fit row, no size tokens; 4 DEBT hand nudges (lab.css:729–730) and per-window grids (skin.css:378–398, 828–843).

## ROWS FOR 022
1 KIT `contextMenu({ x, y, entries })` exported from shell/menubar.js (submenus, ✓/•, icons, `.glass[data-mir-surface="menu"]`, an Escape hook) + `holdTap(el, fn)` with `TAP.hold 500`/`TAP.slop 8` and the touch-callout rule. 2 KIT one knob menu (RESET · COPY · PASTE · FINE · ROUTES › · CLIP › · app rows). 3 APP `lab/context-menus.js`, the menus as action-id trees + ≈ 20 NEW ids. 4 APP NODES popup and csb-favs onto the door (fixes the jitter bug). 5 APP the four native `<select>`s → the kit's `select()`/stepper list. 6 APP the popup material law; delete the seven hard-tint rules; `data-mir-surface="menu"` on six popups. 7 KIT sv-context, pt-menu, m2pick, mod-pop and the seat menu onto the menu surface; NEW `--surface-menu-floor`. 8 KIT tighten relief (skin.css:124, 188–191, 252; themes.js MORPH/AURORA; gui.js SHINE SOFT max; light lift cap); look.node.mjs green; re-baseline themes.browser and stylehash. 9 APP the 14 raw `var(--neu-raise)` → `var(--relief-raise, var(--neu-raise))`. 10 APP hints ≤ 60 (the 152 strings; stage-words.js first) + a short `hint` on the 13 long action labels. 11 KIT `.k-lbl` ellipsis, `.row.fit`, knob size tokens with a container-query face. 12 APP the 12 windows onto `.row.fit`; delete the flex-basis and fixed-grid overrides; exceptions as listed.
