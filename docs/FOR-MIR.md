# FOR MIR — items for the kit, found in λWAVES (2026-10-19; kit day 2026-10-27)

λWAVES runs MIR 1.5.5 (021 K, the λWAVES lift: alpha.25–33 shipped home in MIR's CHANGELOG). THE KIT SENTENCE (CLAUDE.md:6): `lab/mir` is
written by `adopt.mjs` alone; a λWAVES need becomes an additive door numbered `1.5.6-alpha.N`, made in MIR, with its line here; a removal
waits for a line. Newest first; an item leaves this list when an adopted MIR release carries it. Each names where it was met.

## FOR 1.5.6 (doors after the cut)
- **BUILT 1.5.6-alpha.1 · a failed resume never arms** (021 R1, `core/session.js`; kit commit 7f052d5, the clone road): saved parts that threw
  or came back `failed` are copied to `<key>.failed` and autosave stays unarmed until a later resume takes, `discard()` or `arm()`.
  λWAVES' `projects.resume` reports it and rolls back through `openPayload(…, { rollback: true })`.
- **BUILT 1.5.6-alpha.2 · the keyboard window takes `panels`** (021 I2, `keyboard/keyboard.js`; kit commits d798ebc + cbd721f, the clone road):
  KEYS is face 1, the app's faces follow as radio chips on the rail; under 860 px it opens on the first app face; `tab(name)`. λWAVES' MAPPING.
- **BUILT 1.5.6-alpha.2 · MORE KEYS** (021 I2, `keyboard/keyboard.js`): the board's second page in the same well (arrows, Home/End, PgUp/PgDn,
  Insert/Delete, F1–F24, the numpad, the media keys) — a swap, not a strip under the board, so the 416 px pane keeps its five rows.
- **BUILT 1.5.6-alpha.2 · media and volume keys** (021 I2, `shell/keys.js` NAMED): Media* and AudioVolume* codes parse and show.
- **BUILT 1.5.6-alpha.2 · `RESERVED_BY_BROWSER`** (021 I1/I2, `shell/keys.js`): `createKeys({ reserved })` refuses Mod+W/T/N/⇧N/⇧T, Mod+Tab and
  F11 in check and bind; λWAVES passes it through `lab/key-table.js`.
- **BUILT 1.5.6-alpha.2 · the event maps** (021 I2, `modulation/registry.js`): `MAP_KINDS` + `'trigger'` / `'toggle'`, `fire(on)` on an edge
  through 0.5 (0.55 / 0.45), deferred; λWAVES' `action.<id>` targets (lab/mapping.js).
- **BUILT 1.5.6-alpha.2 · THE MIDI DOOR** (021 I2, `shell/midi.js`, new): `createMidi({ storage, run, up, source })`, request only on a press,
  the `{ v: 1, map }` PREFERENCE, trigger · toggle · hold, `learn()`, `devices()`, `sources()`.
- **BUILT 1.5.6-alpha.2 · menubar submenus, checks, radios, glyphs** (021 I3, `shell/menubar.js`; kit ace143d, dd7f48c, 92674bc): an entry
  `[label, () => entries, null, hint, { sub: true }]` (hover or → opens beside the row on the bar's layer, ← / Escape back, an accordion on a
  phone), `opts.checked` (✓), `opts.radio: 'group'` (•), `opts.icon` (a kit glyph name). λWAVES' tree FILE · EDIT · VIEW · PLAY · WINDOW · HELP.
- **BUILT 1.5.6-alpha.3 · `registerGlyphs({ name: markup })`** (021 V1, `glyph.js`; kit 67dcbfc, the clone road): an app's drawings beside the
  set, drawn by `chip`/`setGlyph`/`glyphEl`/`glyphSvg`, `sw({ glyph })`, `trig({ glyph })`, the FINDER's `spec.glyph` and `opts.icon`; a kit
  name, a non-camelCase name or a second markup is refused whole; `appGlyphNames()`. λWAVES' table is `lab/icons.js` (closes I3's app-glyph line).
- **BUILT 1.5.6-alpha.3 · `createWindow({ glyph })`** (021 V1, `window/window.js`): drawn before the title in a title bar; `data-glyph` either way; `windowGlyphs({ id: name })` (kit 7da3c09) names a kit factory's windows (MIR OPTIONS, ABOUT, KEYBOARD) by id.
- **BUILT 1.5.6-alpha.3 · `device({ glyph })`** (021 V1, `kit.js`): `data-glyph` + `.dev-glyph` before the name; `rk.register` reads it when
  none is passed; a rack-built window hands its spec's glyph to `device`. λWAVES declares at `register` (its heads are its own until 022).
- **BUILT 1.5.6-alpha.3 · `trig({ glyph })` draws** (021 V1, `kit.js`): a glyph name is an SVG, other text stays text.
- **BUILT 1.5.6-alpha.3 · `windows()` → `hidden`, `glyph`** (021 V1, `shell/rack.js`): FOLDS skips hidden cards; the WINDOW menu's rows and the
  scroll pill carry the glyph (`createRackPills({ glyphOf })`).
- **BUILT 1.5.6-alpha.3 · the tall-window clamp** (021 V1, `window/window.js` windowLayout): a window taller than the room under the top band
  keeps its bottom and resize corner on screen (`top ≤ max(0, vh − h − inset/2)`).
- **BUILT 1.5.6-alpha.3 · `fitFree` places again** (021 V1, `shell/transport.js`): the FREE bar's window, grown, is moved back inside the viewport.
- **BUILT 1.5.6-alpha.3 · `.k-lbl` ellipsis** (021 V1, `css/base.css`): `max-width: 100%; overflow: hidden; text-overflow: ellipsis`.
- **BUILT 1.5.6-alpha.4 · `contextMenu({ x, y, entries, anchor, onClose, label })`** (022 P1, `shell/menubar.js`; kit 4654cb8, the clone road): the
  menubar's rows in one `.glass[data-mir-surface="menu"]` pane on the bar's own renderer (`rowsOn`), kept in the viewport, ↑ ↓ → ← Enter Escape,
  a phone's inline submenus, `opts.id` → `data-id`; `setMenuEscape(push)` hands Escape to λWAVES' stack. λWAVES' `lab/context-menus.js`.
- **BUILT 1.5.6-alpha.4 · `TAP.hold` 500 · `TAP.slop` 8 · `holdTap` · `onContext`** (022 P1, `kit.js`): one hold law; a right-click, the
  ContextMenu key, Shift+F10 or a still hold fires once per gesture, never the browser's menu; `data-menu` → `-webkit-touch-callout: none`.
- **BUILT 1.5.6-alpha.4 · ONE KNOB MENU** (022 P1, `shell/menubar.js` `knobMenu` · `knobMenuPart` · `knobAct`; `timeline/knobs.js`,
  `modulation/window.js`): RESET · COPY · PASTE · FINE ✓ · ROUTES › · CLIP › · the app's rows; `tl-pop` (knobs) and `mod-pop` merged; the
  knob's value door `home` · `input` · `fine` (`root.mirKnob`). λWAVES adds ROUTE · COPY ID (part 'app') and the favourites (setTimelineKnobRows).
- **BUILT 1.5.6-alpha.4 · `--surface-menu-floor`** (022 P1, `css/skin.css`, tokens.json): TINTED .94 · REFRACTIVE .72 · SOLID 1 under every menu pane.
- **BUILT 1.5.6-alpha.4 · the kit's popups on the menu surface** (022 P1): PATTERN's cap menu is a contextMenu; FOLDERS' context box a menu
  pane (no well) with `itemRows(e)`; `.m2pick` / `.m2ppick` / `.m2deadpick` and the transport's seat menu carry `data-mir-surface="menu"`.
- **BUILT 1.5.6-alpha.4 · a list row's picture** (022 P3, `controls/select.js`; kit 0d98cc8): `listPane` / `select()` items take `pic` (lazy) and `title`; `select({ repick })`.
- **BUILT 1.5.6-alpha.5 · RELIEF IS TIGHT** (022 S1, `css/skin.css`, `core/look.js`, `shell/gui.js`, `shell/themes.js`, docs/INTENT.md's row; kit
  3e6f5cc): a raise is a 1–2 px highlight (light 1 px · .70; dark `--neu-lit`, a grey; SOLID 1 / 2 px, drop 1.5 / 3, wells ±1 / 2; a light pane's
  lift ≤ 45 %), the shine a hairline (≤ 1 px, a 0–2 px blur, α ≤ .35, gain ≤ 1.2), SHINE SOFT 0–6, MORPH and AURORA shine .5 / 6.
- **BUILT 1.5.6-alpha.5 · THE MENU'S INK** (022 S2 / call 13, `css/skin.css`, `shell/shell.css`, tokens.json): `--surface-menu-tint` (flipped
  under a forced ink against the theme) and `--surface-menu-edge` (≥ 3 : 1 against the stage); the floor reaches `#menubar .mb-list`, the
  hover hint and the ⓘ panel — every popup's rows ≥ 4.5 : 1 in every skin × theme (S-BUILD.md's table).
- **BUILT 1.5.6-alpha.6 · THE FIT ROW** (022 F1, `css/base.css`, `css/tokens.css`, `kit.js`, tokens.json, docs/CONTROLS.md "A row fits"; kit
  19c89e3): `.row.fit` (auto-fit cells of `--cell-min`, the knob face `clamp(--knob-min, 62cqi, --knob-max)`, switches and triggers stretch,
  segs and `.wide` span two, `.full` the line, `data-knob="sm|lg"`) and `row(parent, { fit, cellMin, knob, cls })`; the tokens `--cell-min` 40 ·
  `--knob-min` 28 · `--knob` 34 · `--knob-max` 44 · `--row-gap` 4; the cells stretch (kit 6a8cd78, 022 F2); opt-in (a plain `.row` does not move); the starter's PICTURE and a gallery card.
- **BUILT 1.5.6-alpha.7 · THE SURFACE PARTS** (022 C1, `kit.js`, `css/base.css`, `css/skin.css`, `shell/transport.js` + `.css`, `modwindow.js`,
  tokens.json, docs/CONTROLS.md "A surface is a surface"; kit eef6443, a547da5): `section({ title })` (`data-mir-surface="section"`, a hairline frame on a
  `data-mir-surface="well"`; both inner surfaces the pane rules skip), `knobBank({ slots: 8, items, page, onPage, onEmpty, onMove })`, `meter({ bands,
  led, peak, labels })` (`set()` through the frame coalescer; the modulation window's `.m2meter` / `.m2audminleds` / live LED are it), `lamp({ on,
  colour })`; `createTransport({ macros: { face: 'knob', onAdd } })` → `macroRail({ face: 'knob' })` · `macroKnob`; `--xport-well` (on the body)
  `--xport-section` `--xport-grid` 44 `--xport-led` `--xport-led-off` `--lamp` `--peak`. Left for 1.5.6: the AUDIO editor's SVG meter (`buildAudioMeter`,
  drawn in the curve's own coordinates) is not the kit meter; the bank's reorder for macros (the window's rows reorder them); a 44-px finger on the
  macro knob's grip and depth seat (22 × 24 drawn, no outset yet).
- **BUILT 1.5.6-alpha.8 · EVERY DISABLED CONTROL KEEPS ITS HINT** (022 E1, `css/skin.css`, `kit.js`, `shell/menubar.js`; kit d5d8149, the clone road;
  017 W's last case): a disabled knob, fader, switch or trigger takes the pointer on its root (its hint shows, `cursor: not-allowed`) and refuses the
  press — its parts take none, a disabled knob does not reset, `knobMenu` opens nothing on it; a disabled seg button kept its hint since 1.5.0-alpha.28.
- **BUILT 1.5.6-alpha.8 · FROST is TEXT AUTO** (022 E1 · call 14, `shell/themes.js`, `shell/gui.js` home TEXT AUTO): white in dark as before, black in
  light (the kit's tile table: FROST light 8.06–8.11 : 1, was 1.05); a look stored with FROST's old TEXT LIGHT reads CUSTOM until FROST is picked again.
  λWAVES keeps FROST dark's white ladder through its own AUTO map (`lab/look.js` HOME_MAPS.text).
- **BUILT 1.5.6-alpha.11 · THE WORDS LAND** (023 R7, `info/layer.js`; kit c18957a, the clone road): `viewChanged({ land: true })` — an app's re-seat
  (its furniture or its seat changed, not the picture) lands every body on its rest at once, held or not; `viewChanged()` is the spring as before.
- **A `'midi'` modulation SOURCE kind** (021 I2; not built): midi.js hands every CC as 0…1 (`sources()`, `source(key, v)`), but the model
  (`modulation/mod.js`) knows lfo · env · audio only; a `kind: 'midi'` source beside audio (its rack face, its serialisation) would let a
  learned knob drive any dial as an LFO does. λWAVES routes notes and CCs to ACTIONS today, not to dials.
- **ONE POSITION** (021 R3, REVIEW-A §6.6; not built): the transport's `seek` spanning the play clock and the modulation beat (t = beat → a.u.
  through RATE/BPM), so the main bar's ⏮ and TIMELINE's ⏮ are one; and a LOCK option on the modulation clock (`stepMode: 'locked', hz`) as
  the recorder's clock has — λWAVES drives `host.clock.step(1/hz)` from its loop under PLAYBACK LOCK today and re-anchors on release through
  `suspendRealtime(now)(now)`; a `clock.reanchor(at)` door would name that.  The two ⏮ carry hints saying what each moves meanwhile.
- **A target carries a MODULATION route OR a TIMELINE lane, never both** (Josh's ruling, 2026-10-18; iteration 007 row B): Josh: "the timeline and routed dial is either-or, because modulation is essentially a locked timeline and a timeline is essentially a free modulation. User can pick either but not both, clips will have an error and always choose the top-most one." Today the kit adds a lane and a route together (iteration 007 row B found it; `timeline/knobs.js`, `modulation/bind.js`).
- **The lift's look literals become tokens** (021 K3): 37 literals the λWAVES alphas wrote in `modulation/modhost.css` (the work bars),
  `shell/rack.css` (the pill, `.mir-reveal`), `shell/transport.css` (the expander's turn) and `shell/window-picker.css` (the FINDER) were
  taken into `tools/lint-intent.baseline.json` at 1.5.5 rather than reshaped; a 1.5.6 door names them as tokens and lowers the baseline.
- **The FINDER's cursor row is not an ON** (021 K3, `shell/window-picker.css` `.wp-row.on`): the keyboard default wears an accent fill, which
  docs/INTENT.md keeps for nothing ("ON is never an accent fill"; lint-intent `relief.accentOn`). A `.cur` hook and the state token's face.
- **The modulation window's old bar rules** (alpha.26 note): `modwindow/modwindow.css` still carries the m2* tempo / preset bar layout under
  § THE WORK BARS; a 1.5.6 round may retire them.
- **A HINT IS ONE LINE** (022 H1, not built): the kit writes 65 hints over 60 characters (`node tools/hints-census.mjs --kit`; gui.js's LIGHT ANGLE
  first, 146) and three labels wider than their control (gui.js BRIGHTNESS · SATURATION · SHINE SOFT); the list and ≤ 40 rewrites are
  research/iteration-022/H-BUILD.md § FOR 1.5.6 — a 1.5.6 round rewrites them in the English pack, the second sentence to the panel's ⓘ.

## From iteration 010 (X6, the deletion pass)
- **A starter's refresh carries its name.** `folders/seed.js` refreshes a starter in place but keeps the entry's old name, so λWAVES renames
  a refreshed starter itself (`lab/projects.js` `seed()`, WAVE DANCER → WAVE DANCER PROTOTYPE). When the kit carries the name, that loop goes.

## From iteration 008 (Claude Yan, 2026-10-19)
- The kit carries the **n = 7 shell colour** (row A7: λWAVES' register is 140 labels; the kit's shell palette stops at six).
- The **ORBITAL dial steps one orbital per arrow key** (an integer target's arrow keys; row O / R: `chem.orbital`).
- The **stepper reports a re-pick** (picking the option already shown should raise an event; rows P and R needed it for a reload).

## From THE MIR SYSTEM CHECK (Claude Sos, 2026-10-18; `research/iteration-007/mir-check/`)
- **SAVE AS ZIP… by keyboard with a FOLDERS tile selected** names the zip after the tile but zips the live project (`folders/folders.js:370`,
  `zip.js:40`); a mouse press deselects the tile first, so only keyboard users meet it. (files B3)
- **A clip's end snaps the value back** to the knob's own value instead of holding the last automated one (`modulation/host.js:274-275`;
  hue went 0.876 → 0 in one frame). (timeline P2)
- **The timeline's own UNDO / REDO rows are dropped** when the host already owns the ids `undo` / `redo` (`timeline/shortcuts.js`,
  `shell/keys.js` add leaves an existing id as it is); λWAVES works around it with `timeline.undo` / `timeline.redo` rows under the
  timeline's focus (`lab/shell/keys.js`). The kit could name its rows `timeline.undo` / `timeline.redo` itself. (timeline B1)
- **RENDER › FILES is a closed disclosure with no caret**, so SAVE AS ZIP… / OPEN ZIP… hide behind a bare heading (kit CSS). (files polish 1)
- **Opening the same ZIP again adds a copy each time** (ZIPPED 2, ZIPPED 3) while a `.json` import of the same content dedupes. (files polish 2)
- **The FLASH GUARD's sentence shows only in METERS**, which ships closed, so a held picture gives no visible reason. (modulation polish 1)
- **A MENUBAR row takes no glyph** (iteration 012 I1; its + list half closed at 1.5.5 — the FINDER's `icon(id)` seat): WINDOW › PICKER (a menubar row, no `data-*` hook) cannot wear `library.svg`. The kit could take `registerGlyph(name, svg)` and a row glyph in `createMenubar`.

## From iteration 012 M1 (Claude Yan, 2026-10-20; the MIR special windows, app-side)
- **A menubar row takes no glyph** (I1's line above): λWAVES tags WINDOW's PICKER / ATOMS / MOLECULES rows by their label in a microtask after the kit's fill (`notebook.js` `tagIcons`) and paints a CSS mask; a row option `{ icon }` (with `registerGlyph`) would retire it.
- **FOLDERS' toolbar and fields take only kit glyph names**: `extraActions[id].icon` and the NAME / SAVE TO fields cannot carry an app SVG, so λWAVES masks PROJECT's floppy with `save.svg` and draws `file-name.svg` / `folder-name.svg` inside the two bars (`lab.css`). An `icon` that accepts an SVG string and a `glyph` per field would do it in the kit.
- **FOLDERS has no landing folder**: λWAVES turns a view opened at ROOT to DEMOS when ROOT holds none of the reader's projects (`projects.js` `demosFirst`, from `onOpen` and the card's `onOpen`); a `landing(files) → folder` option would serve every app with starters.

## From iteration 013
- **The info layer pushes its bodies from the pointer whatever `follow` and `parallax` say** (`mir/info/layer.js` env passes `pointer` unless frozen; `bodies.js` parts within 260 px): a `push: false` option / `setPush(v)` (or `follow: false` dropping the pointer force) would let λWAVES drop its proximity freeze in `lab/shell/stage-words.js` (iteration 013 N2).

## 027 (2026-10-29)
- `createApp({ finder })` / `createRack({ chrome: true, finder: true })`: an app built on createApp or with chrome:true gets the FINDER and its + (NEBULA S1, BUBBLDYNE S2, BASINS 022 each hand-built the opener).
- `createWindowPicker`: an `onToggle` / shown-change event, so an opener can show its state without a window listener (S2).
- `adopt.mjs`: name the kit stylesheets that are new since the app's manifest (S2, repeating BASINS' ask).
- `shell/midi.js`: a `resume()` door (start with no prompt when a saved map exists and access is granted) and the amended privacy law; λWAVES' `resumeMidi` (lab/mapping.js) is the draft (D4).
- prefs/themes: retired values a theme can carry for `matchPreset` (FROST's `text: 'light'`), so an old saved look keeps its preset name without an app-side migration (D5).
- `folders/gallery.js`: a seam to re-take the clean mark once a restore has settled (an async solve's derived writes), instead of the app's `derived(fill)` (D1).

## 028 (2026-10-30)
- **notebook-render.js IMG** (λWAVES 028 R-09): keep IMG only when src is same-origin or `data:image/` (flip the data: rule for IMG, keep it for A href); `referrerpolicy="no-referrer"` and `loading="lazy"` on every surviving IMG — or drop IMG from NB_TAG. The leak is zero-click on a project open in λWAVES (an imported note's `![](https://…)` is fetched on every open; SECURITY.md says so until this lands).
- **core/session.js resume()** (λWAVES 028 R-12): when storage holds text under `key` but readSession() returned null, treat it as a failed resume — copy to `<key>.failed`, leave autosave unarmed, return `{ ok:false, failed:['record'] }` — the law 1.5.6 wrote for a part that threw, extended to the record the kit cannot read. λWAVES carries the app-side guard (lab/projects.js takeResume) until then.
- **folders/files.js entryOk** (λWAVES 028 R-24): accept `thumb` only when it matches `/^data:image\//` — the test toThumb already applies on the capture road — so a stored URL or an over-long string never reaches the gallery's `url(…)`. λWAVES carries the app-side test (lab/project-store.js toFiles) until then.
- **vendor KaTeX** (λWAVES 028 R-31): 0.16.47 (last 0.16, drop-in) or 0.18.2 with its fonts; keep `trust:false`; version + sha256 in a VENDOR manifest.
- **shell/about.js kitType** (λWAVES 028 R-16): list the info/ faces (Spectral, Playfair Display, Alegreya SC) when fonts/info/ is adopted, as shell/gui.js's ABOUT already does; an app on createApp's ABOUT names only three faces today. λWAVES' own static ABOUT (index.html) names them app-side.

## 029 (2026-10-30)
- DONE in **1.5.6-alpha.18** (λWAVES 029 M2): `core/perf.js setText` writes the one text node's `data` (a characterData record) instead of
  replacing it (a childList record); identical text writes nothing. The dock span, the rack's scroll pill, control-help and λWAVES'
  furniture observer no longer wake on a knob value (scene c: childList records 385 → 1 a second).
- DONE in **1.5.6-alpha.19** (λWAVES 029 M3): the modulation window's paint (work bar, macro rail, device cards, AUDIO device and its meters)
  writes only what changed: `setText` / `setAttr` / `setVar`, a composed style against the string last written, a band's hint only when
  its values move (scene b: the window's records 1,614 → 168 a second, its paint 10.8 → 5.8 ms a second).
- DONE in **1.5.6-alpha.20** (λWAVES 029 M1's line, closed): `accent.paintInk()` — the header λ's half of `paintMarks` alone;
  `lab/look.js paintInk` is now one call to it (its batch and wheel guards kept).
- Open: the AUDIO band hints carry live values (`{out}% output · {db} dB input`), so while the microphone is live each band's title is
  rewritten every paint and control-help adopts it (≈ 560 callbacks a second in scene c). A hint that reads its values when it opens would
  remove them; that is a change of the hint's behaviour, so it waits for a line.
- Open (λWAVES 029 M6 §2 → M7, a line, no door now): the frost row's hold on a context flag (`c.hold`), so any app can hold the glass on its
  own motion signal without writing FROST · STILL into the store; λWAVES measured −4.3 ms/frame of GPU main thread at 120 Hz (029 M6).
  λWAVES does it app-side today (`lab/look.js`: the frost row's `run` overridden in `createLook`'s schema map, `ctx.hold`).
- Open, for 1.6 (029 M6 §2): QUALITY BALANCED as "hold while moving" would keep a theme's glass at rest for the same cost as lite (4.22 vs
  4.33 ms measured). A change to an existing enum's meaning, so a line, never a door.

## 032 (2026-11-01, TIMELINE REDUX — the eight doors 1.5.6-alpha.21 … 28 are DONE on kit-032; what is left)
- **`timeline/window.js` `transport.powerWord`** (λWAVES 032 W2): the timeline's work-bar transport takes no `powerWord`, so λWAVES relabels the kit's power button to MOD after install; a passthrough to `createTransport({ powerWord })` would let the work bar say it once.
- Open edge (λWAVES 032 W3, app-side today): with a heavy solve running while the timeline plays, RENDER is refused ("Finish scrubbing before rendering") until the solve lands — the busy hold rides the scrub gate's door; a `hold(reason)` of its own on the clock would let the film start and wait.
- Pre-existing at 1.5.5 (not 032's): `tests/parity5.browser.mjs` (FROST TEXT LIGHT, 8/9), `render.browser.mjs` (the motionUi.paint-throws case, 64/65), `widgets.browser.mjs` (1 of 47) fail at 3051daf and at kit-032's tip alike.

