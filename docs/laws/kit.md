# The kit (MIR): adoption, doors, palettes, the cascade

The paragraphs below were moved verbatim from CLAUDE.md at 021 D2 and keep their iteration tags; where an older line names a file, a seat or an id a later iteration retired, the later law wins, and the laws of 021 stand first.

## The laws of 040

THE DOORS OF 040 (Josh's 11-09 hands-on list; the clone road on kit branches `kit-040` and `kit-040c` from kit-039's 3086c0b, merged at a0e32f5 = 1.5.7-alpha.48 and adopted whole; Focus's alpha.27…37 live on the kit's `focus` branch and are not in this tree):
- CHAIN T THE TIMELINE'S HANDS, alpha.38–45: THE RIGHT CLICK DELETES, SHIFT-DRAG CLONES, THE RANGE STAYS, THE EDGE IS THE EDGE, THE COPIES WEAR ONE COLOUR, THE TENSION REPEATS, THE EMPTY LANE IS QUIET, THE FINE DRAG LANDS ON THE STEP. alpha.44 retires alpha.23's `.tl-empty` line and with it alpha.25's seat (Josh: "remove it"); the lane's right-click ADD LANE / REMOVE LANE menu is gone, the chips add and remove. The gestures' table is the kit's docs/TIMELINE.md. λWAVES: nothing app-side.
- CHAIN C THE CONTROLS, alpha.46–48: THE SPHERE TURNS SMOOTHLY, THE CHIP WEARS THE DEPTH, THE GRIP CAN HIDE. alpha.48's switch is MIR OPTIONS › WINDOWS › DRAG HANDLE (on at home; off hides the grip, the head still drags). λWAVES: nothing app-side; `material.js`'s wrapper that sets the sphere's arcs is now redundant.
Each door has its BUILT line in docs/FOR-MIR.md § 040.

## The laws of 039

THE DOORS OF 039 · CHAIN K (THE KIT RETURN, Opus 5.5; the clone road on kit branch `kit-039` from kit-038's eddd2b6, adopted one by one):
- alpha.17 THE STEPPED CLOCK LOOPS (`modulation/host.js` `clock.step(dt, { loop: true })`, one wrap `wrapLoop` for both roads): an app's own frame wraps by the realtime rule, heard as 'seek' then 'step'; the recorder passes nothing and never loops. λWAVES: PLAYBACK LOCK's step (rack.js).
- alpha.18 THE ROOT WEARS THE HINT (`kit.js` `seg({ title })`, `controls/stepper.js` `stepper({ title })`): the control's hint on its root, as every kit control; an option keeps its own. λWAVES: `nodeBody` no longer hints a seg's root itself (node-types.js).
- alpha.19 THE FIT ROW KEEPS ITS CELLS (`kit.js` `row(parent, { fit: true, seg: 1 })` → `data-seg="1"`, `css/base.css`): in that row a seg takes one cell; `.wide` / `.full` still span; a plain fit row keeps the two-cell seg. λWAVES: the node faces' rows (node-types.js), nodes.css's override gone.
- alpha.20 THE POWER WORD PASSES THROUGH (`timeline/window.js`): `installTimeline({ transport: { powerWord } })` builds the work bar's power seat with the word face. λWAVES: `powerWord: 'MOD'` (shell/keys.js), no relabel after install.
- A TARGET HAS ONE AUTOMATION (Josh 2026-10-18) is NOT a door yet: three 1.5.6 laws collide with it (→ TL sends a routed target by construction, alpha.27; a hand macro layers over a clip, alpha.27; ROUTE NEW PARAMETER… re-targets a clip, alpha.26), so its design waits for a word in docs/FOR-MIR.md § 039 and the number it was planned for, alpha.21, went to the next door.
- alpha.21 THE HINT CLEARS THE ROW (`control-help.js` `hintSpot`): a control in a window's head is hinted above the bar, else beside the bar in its band, else below — never over the window's first row. λWAVES: nothing app-side.
- alpha.22 THE CARD SAYS HOW IT OPENS (`folders/gallery.js`, `createFolders({ captions })`, `--sv-cap-h`): a card's hint says a second tap opens it and follows the choice; with `captions` every card of every view wears its name beneath its picture at rest, and a paged page reserves that row. λWAVES: `captions: true` (projects.js); the MAIN MENU's FOLDERS page reserves its own `--frows` of `--fcols` (skin.css, picker.js).
- alpha.23 THE EMPTY LANE SAYS HOW (`timeline/view.js` `.tl-empty`): with no clip one line over the lanes names the roads a clip arrives by (a knob's menu › CLIP › CREATE AUTOMATION CLIP, →TL); an empty lane is hinted how, a lane with a clip by its name. λWAVES: nothing app-side.
- alpha.24 THE NAMED CARD KEEPS ITS HEIGHT (`folders/folders.css` `--sv-shot-k`; THE FINISH of alpha.22): with `captions` the picture is 16 : 10, so a named card keeps a 4 : 3 card's height and a fitted window does not scroll. λWAVES: the MAIN MENU page's reserve reads `--sv-shot-k` (skin.css, picker.js).
- 039 F1 (THE REVIEWS' ROW, Opus 5.5, on kit-039 after K's alpha.24): alpha.25 THE EMPTY LINE SITS UNDER THE RULER (`timeline/timeline.css` `.tl-empty` at the lanes' top, off a floating timeline's bar band). λWAVES: nothing app-side. alpha.26 THE FOLDER ROW KEEPS ITS SEAT (`folders/gallery.js`: a paged gallery draws its first page's folder row on every page, hidden seats `.sv-folder-seat` after its folders, so the page buttons never move). λWAVES: the MAIN MENU's FOLDERS page fits its rows to the measured chrome (picker.js, skin.css). The next door is 1.5.7-alpha.27.
Each door has its BUILT line in docs/FOR-MIR.md § 039.

## The laws of 038

THE DOORS OF 038 · CHAIN T (THE TIMELINE, Opus 5.5; the clone road on kit branch `kit-038` from kit-037's e377982, adopted one by one as `1.5.7-alpha.8` … `alpha.12`): alpha.8 THE EMPTY TIMELINE RESTS (`timeline/window.js` the loop's extent reader answers bar 1 with no clip playing, `timeline/model.js` `meter()`; `modulation/host.js` a playing tick at or past the loop's end lands on its start — the alpha.25 "a play past the end runs free" reversed; → TL at the playhead's bar start) · alpha.9 THE TIMELINE SCROLLS UNDER THE POINTER (`timeline/editor.js`: the plain wheel scrolls time while the lanes fit, Shift + wheel always, Ctrl + wheel zooms; THE EDGE PUMP for a scrub, range, move, trim or stretch held at the viewport's edge) · alpha.10 THE MEASURE IS THE LEAST LOOP (`modulation/window.js` `lfoCycles`: → TL sends ⌈bar / period⌉ whole cycles inside the 256-point source cap) · alpha.11 THE SELECTION RESIZES TOGETHER (`timeline/editor.js` `edgeFrom`, `timeline/geometry.js` `glueTimelineClips`: a group trim, a glued group stretch, one undo row) · alpha.12 THE RING FOLLOWS THE DIAL (`kit.js` knob's `k-rev`, `modulation/window.js` `paintRing` and the ring's depth drag mirror on a reversed dial). Three of them change a kit-wide law a sibling will feel on re-adoption (an empty timeline loops bar 1 and a play past the end comes home; a plain wheel over the timeline scrolls time; an edge press keeps a selection of several); the others are additive. The next door is 1.5.7-alpha.13 (chain K, then P, build on chain T's kit tip). Each door has its BUILT line in docs/FOR-MIR.md § 038.

THE PAD WRAPS (038 K3, chain K, Opus 5.5; the clone road on kit branch `kit-038`, alpha.13 @ 25e0836 on chain T's alpha.8 … 12, adopted as
`1.5.7-alpha.13`): `xyPad({ wrap })` — `'plane'` a torus on the square, `'sphere'` the inscribed disc read as a sphere of directions (past the rim at θ,
back in at θ + π with r → 2 − r) — passes the drag's virtual point, the press and the arrows through `padWrap(wrap, ux, uy, press)` (pure, exported);
the value's range stays the app's, and with no `wrap` the pad stops at its edge as before. `control()` hands a pair's `wrap` to its pad;
`createCameraView({ panWrap })` gives it to the PAN pad. λWAVES' side: the LIGHTING sun `'sphere'`, CAMERA's PAN `'plane'` (look-and-camera.md).
Its BUILT line is in docs/FOR-MIR.md § 038.

THE FIX OF 038 · T8 (from the fresh-eyes review of chain T; on chain K's alpha.13 25e0836, so P's door is alpha.15): alpha.14 THE PUMP WAITS FOR A DRAG (`timeline/editor.js`: the edge pump starts only after the 6-px slop; a scrub's head stays inside the lanes on view; a scrub released past the loop's end while playing brings the view home; `modulation/window.js` → TL's hint says the LFO's whole cycles; `timeline/window.js` the empty loop's words say which synced LFOs stay continuous).

THE ARC WEARS A GRADIENT (038 P1, chain P, Opus 5.5; the clone road on kit branch `kit-038`, alpha.15 @ d37162a on T8's alpha.14 eeb8f7c, adopted as `1.5.7-alpha.15`).
- **The kit:** `arcRing({ stops })` draws the track as 16–48 butt-joined vector segments, each in the oklab mix of two or more evenly spaced CSS colours, round at the two ends. Each leans `--arc-grad-weight` (18 %) toward `--arc-grad-ink` (the theme's `--fg`), so the track reads on both themes.
- **The value** is a thumb riding the track: a disc in the colour beneath it, `--arc-thumb-ring`, `--arc-thumb-halo`. There is no value ring.
- **The factory:** `control({ stops })` on a finite range is that arc, and a log range keeps its map. The drag law, the keys, home, the readout and the modulation contract are the arc's.
- **λWAVES' side:** `nodeBody` passes a knob's `stops` (node-types.js), so a node kind wears Photoshop's tracks by data alone (the full nodes, nodes.md).
- Its BUILT line is in docs/FOR-MIR.md § 038. N8 took 1.5.7-alpha.16; the next door is 1.5.7-alpha.17.

THE FIX OF 038 · N8 (from the fresh-eyes review of chain N; on chain P's alpha.15 d37162a): alpha.16 THE MENU PANE KEEPS ITS FLOOR (kit `eddd2b6`; `css/skin.css` `body[data-card][data-card] .glass[data-mir-surface="menu"]:not([hidden])` (0,5,1), `shell/shell.css` `body[data-card][data-card] #menubar .mb-list:not([hidden])` (1,4,1)): the menu floors outweigh FROST's dark veil and STILL's fill, so a menu pane never reads below its floor in any material (dark REFRACTIVE FROST .72, not .10). The next door is 1.5.7-alpha.17.

## The laws of 037

THE DOORS OF 037 (chain H, Opus 5.5; the clone road on kit branch `kit-037` from kit-032 a3dcb80, adopted as `1.5.7-alpha.7`): alpha.6 THE REVERSED DIAL (a descriptor or a camera port range may say `reverse`, and the panel passes it to `knob()`: the ZOOM dial turns clockwise to zoom in while `obs.dist` stays the distance) · alpha.7 THE SPHERE TAKES A PLANE (`directionSphere({ plane })`: the normal as the tip and look line, the plane as the square, the three world rings, no letters; the CLIP window mounts it in place of plane-model, which PLANE still uses). THE CAMERA/OBJECT FRAME is the app side: `mat.slice.frame` turns the slice normal by the camera basis under CAMERA; absent = OBJECT = the old road, so every LOCK leaf and saved project is unchanged. The next door is 1.5.7-alpha.8. Each door has its BUILT line in docs/FOR-MIR.md § 037.

## The laws of 036

THE DOORS OF 036 (chain K, Opus 5.5; the clone road on kit branch `kit-032` from the 1.5.6 cut cdf20ae, adopted as `1.5.7-alpha.5`): alpha.1 THE STROKE
(MIR OPTIONS › CONTROLS › STROKE, the look key `stroke` 0–1, `--ctl-stroke` on <html>: every control ring's alpha × it — the switch's flat seat, the
ON rim's ring, the seat edge, the knob's live ring, the carried and tab rings, the controls' hairline borders through `--ctl-hairline`, the rail
chips' rim and disc edge `--chip-edge`, the transport pill's rims; not the panes' EDGE, the menus' edge (022's ≥ 3 : 1) or the focus ring; THE
RELIEF SOFTENS — `--neu-raise`'s highlight is the soft 3-px halo of before 1.5.6-alpha.5 again, the drop unchanged) · alpha.2 THE UI SCALE (MIR
OPTIONS › WINDOWS › UI SCALE, the look key `scale` 0.5–2 by .05, `--ui-zoom` on <html>: CSS `zoom` on the UI roots only, never on html, body,
#stage or a canvas; `--in-zoom` divides every viewport length in the kit's sheets; `core/zoom.js` `cssZoom` · `ownRect` · `viewIn` and the
geometry pass) · alpha.3 THE TEMPO EDITOR'S BOX (`bindNumber` opens the field in its button's box — no flex-basis, which a column seat read as the
height — in the button's format, at `--xport-edit-size`) · alpha.4 THE ⋯ MENU'S APP ROWS (`installTimeline({ moreRows })`, after a separator) ·
alpha.5 THE FIELDS' OWN WORDS (FOLDERS' `copy.namePlaceholder` / `copy.saveToPlaceholder`, `copy.proposeName: false`). λWAVES' side: STROKE's home
is 0 (`LOOK_HOME.stroke`, lab/look.js) and λWAVES' own rings take the factor (skin.css, lab.css, csb.css); `lab/skin.css` § 036 K2 adds λWAVES' roots
(#title, #badges, #sheet, the CSB's search pill and list, the main menu's head, face and caption — not its collage or decks).

UI SCALE'S GEOMETRY LAW (036 K2): under zoom a rect, a pointer and innerWidth are SEEN px; offset*, client*, scroll*, getComputedStyle and every
length an element is given are its OWN px. A place written from a seen number divides by the element's `cssZoom`; a seen number compared with an
own one multiplies; two seen (or two own) numbers need nothing. A kit window's model is its host's own px; a rack float keeps its seen x, y and its
own width. The modulation material's windows (MODULATION, TIMELINE, PATTERN, their rails) take the inverse zoom and stay 100 % (their editors are not
zoom-aware yet: FOR-MIR); a plot canvas in a window multiplies its backing store by its zoom; the stage canvases never move.


THE DOORS OF 032 (TIMELINE REDUX, Claude Sos with an Opus builder; the clone road from the 1.5.5 cut, kit branch `kit-032` @ 27dadc0, adopted as `1.5.6-alpha.28`): alpha.21 THE ARRANGEMENT'S LAW (`timeline/model.js` — where clips overlap on one target the HIGHEST lane wins, then the earliest start; `extent()`, `stretchClip()` keeps a curve's shape as `scale · old / new`; a plain curve's `steps`) · alpha.22 THE EVENT TARGET (`modulation/registry.js` — an `integer` row's `options` cut the unit line into equal bands, a value lands on its band's centre, `describe(id)` says `options` and `steps`) · alpha.23 THE TIMELINE'S HANDS (one modifier table: Shift selects and fine-tunes ⅛, Ctrl shapes — zoom on the ruler, clone, stretch, the time lock — Alt bypasses snap; the pencil stamps the clip last pressed; the shared `curve-gesture.js` law reaches the modulation window and CURVES too) · alpha.24 THE WORK LANE'S FACE (round tools with a `slice` glyph, SNAP `1 · 1/4 · 1/8 · 1/16 · OFF` in a pill, 36 px seats, a loud selection, fuller clips, FIT with `place()`'s NaN fix, DISABLE CLIP, the lane ask through `confirmDialog`, an event clip's bands and ⚠ when its target's band count changes) · alpha.25 THE LOOP (the timeline loops while it plays: the ruler's range › ACTIVE › the clips' extent › free run; `loop: false` opts out; a film never loops) · alpha.26 THE ROUTE FROM A CLIP (`armFor` on the modulation window's api; the clip menu's ROUTE NEW PARAMETER…) · alpha.27 THE SEND DISARMS (THE ARRANGEMENT WINS WHERE IT PLAYS: under a clip a device's routes on that target stand aside, hand macros still layer; →TL bypasses the device it sent) · alpha.28 THE CARD'S × AND THE BARE POP (a `card: true` window's × closes through the rack and every close road undocks the bar; `register({ bare: true })`; `placeGlyph` for a two-place cycle). The precache ceiling is 8.5 MiB since this adoption (`tests/pwa.test.mjs`: 8.02 MiB of code, nothing lazily read left to skip). CUT AS MIR 1.5.6 on 2026-11-01 (Josh: "Cut the kit as 1.5.6 and push it"; kit commit cdf20ae, tag `v1.5.6`, branch `kit-1.5.6` pushed to github.com/magic-commons/mir); λWAVES adopts `1.5.6`; a new door continues from 1.5.7-alpha.1. The siblings re-adopt on Josh's word (four of the doors change a kit-wide law: the highest lane wins, the loop on by default, Shift/Ctrl, a clip overrides a device's routes).

## The laws of 031

THE KIT IS 1.5.5, LITERALLY (Josh 2026-10-31, "Call this version of MIR 1.5.5"): the twenty doors of 021–029 (1.5.6-alpha.1…20) are cut into MIR 1.5.5 at kit commit 3051daf (tag `v1.5.5` in `~/Documents/MIR`, branch `kit-1.5.5`; the 10-27 lift is `v1.5.5-lift`); λWAVES, and BASINS after it, adopt `1.5.5`. The clone road is unchanged; a new door is numbered from 1.5.6-alpha.21. The sibling adoptions of 027 (NEBULA-REDUX, BUBBLDYNE at alpha.17) stand; BASINS' adoption is the 031 work (`~/Documents/DATABASE/CLAUDE/MIR/LAMBDAWAVES MIR SPEC 1.5.5 FOR BASINS 2026-10-31.md`).

## The laws of 022

A POPUP WEARS THE SKIN (022 P): every popup list is `.glass[data-mir-surface="menu"]` and takes its material from the skin's tokens and `--surface-menu-floor` (lab/mir/css/skin.css:29: TINTED .94 · REFRACTIVE .72 · SOLID 1); no native `<select>` anywhere (the kit's `select()`/`listPane`, a row's `pic`); λWAVES writes no menu alpha (`#lwMenu`, the Picker page, is a page).

RELIEF IS TIGHT (022 S, kit 1.5.6-alpha.5): a raised control's highlight reaches 1–2 px (lab/mir/css/skin.css:69, :131; light 1 px · .70, SOLID 2 px of a lift ≤ 45 %), a dark highlight is grey (`--neu-lit`), the shine a hairline (≤ 1 px, ≤ 2 px blur, α ≤ .35; SHINE SOFT 0–6). Nothing in lab/ reads `--neu-raise` or `--neu-inset` raw — `--relief-raise` / `--relief-well` always, so RELIEF FLAT reaches everything.

THE MENU'S INK (022 S, call 13; 022 E1, call 14): every popup takes the menu floor, the menu tint (lab/mir/css/skin.css:116, flipped under a forced ink against the theme, :141) and the menu edge, and reads ≥ 4.5 : 1 with an edge ≥ 3 : 1 in every skin × theme (`node tools/skin-sheet.mjs <tag>`); since kit 1.5.6-alpha.8 FROST's TEXT is AUTO, so its panes write dark ink in LIGHT (8.1 : 1 on the kit's tile table) and keep the white ladder in DARK (lab/look.js HOME_MAPS.text).

THE ICON TABLE IS λWAVES' OWN (022 E2): every window wears ONE glyph of its own drawing (`WINDOW_GLYPH`, lab/icons.js:134; the 31 of V-BUILD's list drawn in `ICONS`, lab/icons.js:24, no borrowed kit glyph left), and a menu row wears its action's `icon` (the registry, lab/actions.js; lab/shell/notebook.js item()). `node tools/glyph-sheet.mjs` draws every glyph at 16/20/24 on light and dark; Gemini redraws from that sheet only on Josh's word (research/iteration-022/ICONS-FOR-GEMINI.md).

## The laws of 021

THE KIT IS 1.5.5 AND THE APP ONLY ADDS DOORS: lab/mir is written by adopt.mjs alone; a λWAVES need becomes an additive door numbered 1.5.6-alpha.N with its FOR-MIR line; a removal waits for a line; `node <MIR>/tools/adopt.mjs . --check` says in step. (021 K; the one source is CLAUDE.md line 6, which `docs/NOTES-FOR-AGENTS.md` §7 and `docs/FOR-MIR.md` cite.)

THE CLONE ROAD (021 K, PLAN call 12): a door is built in a clone of the kit's bundle on the kit's own laws (words through `label()`/`t()` and the English pack; parts by class and `data-*`; `.glass` takes the look store), committed there as `1.5.6-alpha.N`, adopted back with `adopt.mjs` (`MIR-MANIFEST.json` plus its pin in `tests/mir-manifest.test.mjs` ACCEPTED, the two-file edit), and its bundle left for Josh to fetch into `~/Documents/MIR`; `tools/mir-manifest.py` is retired (021 K4). The kit reads 1.5.6-alpha.8 (alpha.1 the failed resume, R1; alpha.2 the keyboard panels, MIDI and submenus, I2/I3; alpha.3 `registerGlyphs`, `windowGlyphs`, `glyph`, V1; alpha.4 `contextMenu`, `holdTap`/`onContext`, the knob menu, `--surface-menu-floor`, 022 P1; alpha.5 RELIEF IS TIGHT and the menu's ink, `--surface-menu-tint` · `--surface-menu-edge`, 022 S; alpha.6 THE FIT ROW `.row.fit` · `row(parent, { fit })` and `--cell-min` `--knob-min` `--knob` `--knob-max` `--row-gap`, 022 F1; alpha.7 THE SURFACE PARTS `section` · `knobBank` · `meter` · `lamp`, `macroRail({ face: 'knob' })` · `macroKnob` and `--xport-well` `--xport-section` `--xport-grid` `--xport-led`, 022 C1; alpha.8 EVERY DISABLED CONTROL KEEPS ITS HINT and FROST's TEXT AUTO, 022 E1); open asks wait in `docs/FOR-MIR.md` § FOR 1.5.6.

THE DOORS OF 023 (D, B, R): 1.5.6-alpha.9 — behind the view plane is dashed (CAMERA's sphere rings, CLIP's plane; `depthOf`'s sign assumes the sphere seen from above), KEYBOARD's faces wear glyphs (`{ name, body, icon }`; λWAVES' MAPPING is `mapping` in lab/icons.js), the modulation rail moves as every chip, the tempo wheel is 1 BPM a notch (Shift 0.1) on every tempo seat; alpha.10 — `rack.showPills()`; alpha.11 — `viewChanged({ land: true })`. The kit read 1.5.6-alpha.11 at 023's close.

THE DOORS OF 025 (A, C): 1.5.6-alpha.12 — the muxer's audio trak (`mp4.js` `audio:`; one-track output byte-identical); alpha.13 — the offline mixdown (`render/audio-mix.js`); alpha.14 — the audio encoder ladder AAC → Opus, the priming by impulse, the WAV; alpha.15 — the AUDIO row, the result's `audio`, the refusal for a LIVE source only; alpha.16 — the self-test's alignment stage; alpha.17 — the render panel's even rows (`even`, `ranges`, `controls.switches`; opt-in, BASINS unchanged). The kit reads 1.5.6-alpha.17; the bundle `.tmp/it021/kit.bundle` (kit-1.5.5 @ c13df7d) carries 1.5.5 and every door until Josh fetches it.

THE DOORS OF 029 (M2, M3, M1's line; the clone road from .tmp/it021/kit.bundle, the bundle back at .tmp/it029/kit.bundle for Josh): 1.5.6-alpha.18 — `core/perf.js setText` writes the existing text node's data (a characterData record, never a replaced node: the dock's span observer, control-help and stage-words stop waking on every knob value); alpha.19 — the modulation window writes only what changed (`paint`, `paintAudio`, `paintAudioMeter`, `paintMinTrace` through setText/setAttr/setVar; a composed style compared with the string last written; the look byte-identical by DOM and screenshot digest); alpha.20 — `accent.paintInk()`, the header λ's half of paintMarks, so a STAGE write re-inks one mark (λWAVES' look.js paintInk is one call). The kit reads 1.5.6-alpha.20. Open FOR-MIR: a live AUDIO band's hint still rewrites while its values move (~560/s with the microphone on).

## The standing paragraphs

MIR owns generic instrument behavior. Before changing modulation controls, read
`lab/mir/modulation/modwindow/host-contract.md` and the upstream
`/home/joshua-hosain/Documents/MIR/PROMPT.md`. Update MIR first, adopt it, then
adapt λWAVES' side of the seam (`lab/mod-port.js`, `lab/shell/modulation.js`). THE KIT IS 1.5.5 AND THE APP ONLY ADDS DOORS: lab/mir is written by adopt.mjs alone; a λWAVES need becomes an additive door numbered 1.5.6-alpha.N with its FOR-MIR line; a removal waits for a line; `node <MIR>/tools/adopt.mjs . --check` says in step. (021 K; the door is made in a MIR worktree and adopted — `MIR-MANIFEST.json` plus its pin in `tests/mir-manifest.test.mjs`, the two-file edit; open asks wait in `docs/FOR-MIR.md` § FOR 1.5.6.) `lab/fonts/**` stays untouched.

Jet Black is the app's palette row (`lab/palette-app.js`, appended to the kit's
catalogue at boot) until MIR carries it (KIT BRIEF J); every other palette is
MIR's. Cloud: PRs only, never `lab/mir`; a kit need is a MIR issue or a line in
the PR.

MIR 1.5.5 is adopted and pinned (021 K4): its manifest sha-256 is
in `tests/mir-manifest.test.mjs` `ACCEPTED`; re-adopt only under the kit
sentence (line 6), then `--check`. `index.html` declares `@layer app,
mir;` then `mir/mir.css`; `lab.css` and `skin.css` stay UNLAYERED and beat
every kit layer. An `app.*` layer ranks below the kit for a normal declaration,
so keep a λWAVES look with an unlayered rule, and narrow an app rule the layers
made live with a twin `:not(:where())`. The `!important` declarations stay unlayered: `grep -o '!important' lab/lab.css lab/skin.css lab/csb.css lab/keymap.css lab/nodes.css | wc -l` reads 31 at 022 P3 (skin.css 17, lab.css 11, nodes.css 3; comments counted; 39 at 021 — the hint tip's eight left with the popup law).
R5-W1: a kit module no root reaches is reported by `wiring --unreached-kit`,
never precached, never failed; our own modules keep the hard gate. The
KEYBOARD window's paint is λWAVES' own in `lab/keymap.css` (021 G6; the window is the kit's, on `#floats`). Knobs follow 1.5's ONE KNOB LAW (vertical drag, ⅛
gear), guarded by `mir-controls`. Josh's seven glass rulings are read from
`research/release-0.5.0/C0-GLASS-RULINGS.md`; the defaults applied there are
five the kit's, two λWAVES' (the disconnected head's fill and lift, lab.css §G).

THE SIBLINGS (027 S1–S3, the clone road of 022): NEBULA-REDUX (nebula-1.5 @ 737a8df, 0 callers changed) and BUBBLDYNE (opus/lorentz-foam @ 627bcbe, a FINDER opener added) run on 1.5.6-alpha.17 in bundles under `.tmp/it027/` of the integrator's worktree with their fetch lines in `research/iteration-027/*-ADOPT.md`; AUTOMATA's row follows. The kit itself is unchanged at 1.5.6-alpha.17.
