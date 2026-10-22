# FOR MIR — items for the kit, found in λWAVES (2026-10-19)

λWAVES adopts the MIR kit at `lab/mir/` and never edits it (CLAUDE.md). What the app finds wanting in the kit is listed here for the kit's own
round, newest first; an item leaves this list when an adopted MIR release carries it. Each names where it was met.

## FROM λWAVES, FOR THE KIT (1.5.0-alpha.25+)
- **THE PILL'S TIP** (014 A10): the scroll pill's outer end stops 2 px short of the seated track's inner edge (or `scrollbarSeat`'s x when
  none runs) and reaches inward over the title bar, its mask opening from that tip; `rackPill` defaults to A, the scrollbar's accent.
  `shell/rack-scrollbar.js` (`PILL.gap` 2, `PILL.track` 12), `shell/rack.css`, `shell/gui.js`. Why: Josh, "make the scroll bar also be at the
  very tip of the pill so that the pill doesn't overlap the scroll bar" and "the default should be Accent A instead to match the scroll bar".
- **THE DOOR'S ICON** (014 A9): `modDoor({ mark: 'icon', icon })` / `createTransport({ door: 'icon', doorIcon })` draw the app's own glyph (an
  svg string or a url) as a CSS mask in the ink (`.mod-door-icon`); the timeline's work bar passes `transport.door` / `doorIcon` through.
  `shell/transport.js`, `shell/transport.css`, `timeline/window.js`. Why: Josh, "remove anything with the MIR logo and have proper icons for it";
  the diamond and the mark stay (the MIR Logo Button).
- **THE SCROLL PILL** (014 A6): while a rack scrolls and 900 ms after (one timeout), each docked window's name in a solid accent pill beside
  its title bar, revealed by a clip-path mask, ink by luminance; `scrolling` on the rack and its track lifts the thumb.
  `shell/rack-scrollbar.js` (`createRackPills`, `inkOn`, `PILL`), `shell/rack.js` (made with every rack), `shell/rack.css`, `shell/gui.js`
  (LOOK_SCHEMA `rackPill` OFF · A · B, default B; MIR OPTIONS › WINDOWS › SCROLL PILL), `locales/en.json`. Why: Josh, "scrolling through
  windows is hard to see where one window begins and another starts".
- 1.5.0-alpha.25 · `kit.js`: `knob()` and `seg()` return their options as `spec`, so an app can make a second face of the same control (λWAVES iteration 014 A3's favourites); `timeline/knobs.js` `setTimelineKnobRows(fn)` adds the app's rows under LOCATE CLIPS in the TIMELINE CLIP popup (ADD TO / REMOVE FROM CONTROL SURFACE).
- 1.5.0-alpha.25 · `shell/transport.js` + `.css`: `createTransport({ places, onDock })` — the dock chip cycles RACK → STAGE → FREE (`setPlace`, `cycle`, `nextPlace`); FREE is the one bar in a window of its own (createWindow, chrome 'close', rect remembered in `<key>.free`; × back to the stage) with a VERTICAL chip (`data-orient="vertical"`); the seat store writes `{ v: 2, seat, place, orient }` — λWAVES iteration 014 A4 (Josh: "a cycle of: dock to rack, dock to stage, free-window").
- 1.5.0-alpha.25 · `shell/transport.js` + `.css`: `CONTROL_SURFACE_LAYOUT` (`data-layout="csb"`): the bar in two rows (the clock; the app's modes, chooser, search and the rack's + ◧ ☆), 1.5 × the height, as narrow as its wider row; `named(name, list, { title })` names the dock window (CONTROL SURFACE) — λWAVES iteration 014 A1.
- 1.5.0-alpha.25 · `shell/gui.js`: `aboutPage(host)` lends MIR ABOUT's page to the app's own ABOUT as its second page (Josh: "MIR about should be a second page to the About page(s)"); the window takes it back when opened (A1).
- 1.5.0-alpha.25 · `shell/transport.css`: λWAVES' own seats (the thin scrub, the small RATE, the stacked readouts without labels) are the stage and work-bar form only (`.mir-transport:not(.docked)`); docked, the card keeps the app's readouts with their labels, as λWAVES drew it (A0).
- 1.5.0-alpha.25 · `shell/transport.js`: `transportDock(rack)` exports the docked seat's hooks, so an app that registers its own TRANSPORT card (`card: true`, its slot and fold) docks the kit's bar through it — λWAVES adopts `createTransport` (iteration 014 A0).
- 1.5.0-alpha.25 · `shell/transport.js`: `createTransport({ seatMenu: false })` drops the BOTTOM / TOP / COMPACT menu (its right click and long press) for an app that seats the bar itself and keeps right click for its controls (A0; A3's favourites menu).
- 1.5.0-alpha.25 · `shell/transport.js`: `modPower({ word })` / `createTransport({ powerWord })` put the app's word on the power seat (λWAVES' MOD) through `label()` in place of the ring (A0: no visible change).

## From iteration 010 (X6, the deletion pass)
- **A starter's refresh carries its name.** `folders/seed.js` refreshes a starter in place but keeps the entry's old name, so λWAVES renames
  a refreshed starter itself (`lab/projects.js` `seed()`, WAVE DANCER → WAVE DANCER PROTOTYPE). When the kit carries the name, that loop goes.

## Josh's ruling the kit should carry (2026-10-18)
- **A target carries a MODULATION route OR a TIMELINE lane, never both.** Josh: "the timeline and routed dial is either-or, because modulation is
  essentially a locked timeline and a timeline is essentially a free modulation. User can pick either but not both, clips will have an error and
  always choose the top-most one." Today the kit adds a lane and a route together (iteration 007 row B found it; `timeline/knobs.js`, `modulation/bind.js`).

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
- **The glyph table takes no app SVG, and a MENUBAR row takes no glyph**: the rack's + list draws only `glyph.js` names, so λWAVES paints ATOMS / MOLECULES' icons with CSS masks over `.mb-item[data-win]`, and WINDOW › PICKER (a menubar row, no `data-*` hook) cannot wear `library.svg` at all. The kit could take `registerGlyph(name, svg)` and a row glyph in `createMenubar`. (iteration 012 I1)

## From iteration 012 M1 (Claude Yan, 2026-10-20; the MIR special windows, app-side)
- **The + list's rows lead with the glyph**: `#rackAddList` (an adopted list) is not `.mir-rack-list`, so shell.css' `space-between` put CURVES / FOLDERS / RENDER's glyph at the left and the word at the right; λWAVES' `lab.css` reorders them (word left, glyph right). `drawAdd` could build the label first and the glyph trailing, whatever list it fills.
- **A menubar row takes no glyph** (I1's line above): λWAVES tags WINDOW's PICKER / ATOMS / MOLECULES rows by their label in a microtask after the kit's fill (`notebook.js` `tagIcons`) and paints a CSS mask; a row option `{ icon }` (with `registerGlyph`) would retire it.
- **FOLDERS' toolbar and fields take only kit glyph names**: `extraActions[id].icon` and the NAME / SAVE TO fields cannot carry an app SVG, so λWAVES masks PROJECT's floppy with `save.svg` and draws `file-name.svg` / `folder-name.svg` inside the two bars (`lab.css`). An `icon` that accepts an SVG string and a `glyph` per field would do it in the kit.
- **FOLDERS has no landing folder**: λWAVES turns a view opened at ROOT to DEMOS when ROOT holds none of the reader's projects (`projects.js` `demosFirst`, from `onOpen` and the card's `onOpen`); a `landing(files) → folder` option would serve every app with starters.

## From iteration 013
- **The info layer pushes its bodies from the pointer whatever `follow` and `parallax` say** (`mir/info/layer.js` env passes `pointer` unless frozen; `bodies.js` parts within 260 px): a `push: false` option / `setPush(v)` (or `follow: false` dropping the pointer force) would let λWAVES drop its proximity freeze in `lab/shell/stage-words.js` (iteration 013 N2).
