# FOR MIR — items for the kit, found in λWAVES (2026-10-19)

λWAVES adopts the MIR kit at `lab/mir/` and never edits it (CLAUDE.md). What the app finds wanting in the kit is listed here for the kit's own
round, newest first; an item leaves this list when an adopted MIR release carries it. Each names where it was met.

## FROM λWAVES, FOR THE KIT (1.5.0-alpha.32)
- **MIR OPTIONS WITHOUT TABS** (018 F1, `shell/gui.js`, `gui.css`): the LOOK · LIGHT · WINDOWS tab seg, `GUI_TABS`, `TAB_OF`, the `mir.gui.tab` record and the api's `tab` / `turn()` are gone; every group sits on one pack of up to four balanced CSS columns (276 px; fewer on a smaller screen, one on a phone), in the order theme · accent · material · text · controls · quality · motion · menus · light · windows · sampling, ACCENT's four dials in one row, RELIEF beside FACES, MENU BAR beside SHOW LOGO, WINDOWS' switches two by two, the three THEME buttons in one row; the window opens ≈ 1180 × 660 and `fitTo` adds the body's scrollbar when the screen is too short. `open('light')` and the old page names open OPTIONS. Why: Josh — "try to not use tabs … remove as much empty space and pack everything into that window. Feel free to increase the dimensions".

## FROM λWAVES, FOR THE KIT (1.5.0-alpha.31)
- **THE FINDER REPLACES THE + LIST** (018 E5, `shell/window-picker.js`, `.css`, `locales/en.json`): the window picker is the FINDER — no WINDOWS
  heading, the field says "search windows" with no accent ring, `can()` may return null to leave a row out; SHIFT-click queues rows (number
  badges `.wp-num`, `.queued`) and Shift's release opens them in pick order (rack.js `openOrder`); a row in the latest ☆ layout wears the solid
  star (`.wp-fav`); the api gains `shown` and `queued`; a pick defaults to `rack.reveal`. Why: Josh — "Call this new feature 'finder' instead
  of 'add window' … multi-add by holding shift. Let the new window adopt it … Remove text that says 'WINDOWS'".
- **reveal(id), AND THE + LIST GOES** (018 E5, `shell/rack.js`, `rack.css`, `css/base.css`): `reveal(id)` opens a closed window at its rack's top
  and scrolls the rack up, or scrolls the rack to an open one WITHOUT reordering it (unfolds it, shows the rack, a floating one to the front),
  and rings the card 900 ms (`.mir-reveal`, RACK.reveal); `lastFavourite()` gives the ids open in the latest ☆ layout (it now also reads a
  record that says `closed`, as λWAVES' v3 layouts do — the old + list's star never lit there). The `#rackAdd` button, `#rackAddList`,
  `addMenu`, `el.add` / `el.addList` and `.rack-add-none` are gone; `queueToggle` / `openOrder` stay exported for the FINDER. Why: Josh — "If a
  user picks a window that's already open, let it *scroll* to the window on the rack, never rearranging the windows"; one window list, not two.
- **THE BAR'S OWN EXPAND** (018 E2, `shell/transport.js`): a layout part `'expand'` (`.tr-expand`, the `chevronDown` glyph turned up while
  open in transport.css, `aria-expanded`, `.on` while open) opens and shuts the tempo panel; a layout that names it gives the pill `tempoPill({ typed: true })`, so a click on the pill types
  the tempo on any seat (the work bars' field) and the pill opens nothing. Why: Josh — "let tempo be typable … and have a dedicated icon to
  expand the CSB instead".

## FROM λWAVES, FOR THE KIT (1.5.0-alpha.30)
- **CURVES TAKES THE APP'S PRESET ROWS** (018 D2, `panels/curves.js`): `createCurvesPanel/View({ presets: () => rows })` puts the app's rows
  ({ id, label, points } a curve, { id, label, coming } a heading) ahead of the kit's six in the PRESET stepper; a row's curve lands on the
  channel shown, and the stepper names a curve that matches one; `setPresets()` (view and panel) re-reads the rows. Why: Josh — CURVES saves
  the reader's own curves and the drop-down loads them, as PALETTE and SPECTRUM already do.

## FROM λWAVES, FOR THE KIT (1.5.0-alpha.29)
- **THE PILL WEARS THE THEME'S INK** (018 A5, `shell/rack-scrollbar.js` `inkOn(rgb, theme)`): a light theme prefers white pill text, a dark theme
  dark text; it flips only past a 3:1 floor (white needs L ≤ 0.3, black L ≥ 0.1). Why: Josh — the pure-luminance midpoint chose by the fill alone.
- **ONLY A PILL** (017 R1, `shell/rack.css`): the scroll pill's tail (`.rack-pill::before`, an 8-px square turned 45°) is gone and the mask opens
  from the window's side over the pill alone (`inset(0 100% 0 0)` → `inset(0)`). Why: the mask opened from the tail, so every reveal and hide
  showed the tail by itself — Josh: "strange diamonds under the pills … it should only be a pill".
- **A PAGED GALLERY PAGES ITS FOLDERS TOO** (017 R2, `folders/gallery.js`, `folders.css`): with a `pageSize` the pages hold the sub-folders first,
  then the projects (`revealEntry` counts them), and a page of folders only hides the empty PROJECTS heading. Why: Josh — a docked FOLDERS card grows
  with its content up to a rack window's height and past that turns PAGES; a long folder list lengthened the card instead.
- **A DISABLED SEG BUTTON KEEPS ITS HINT** (017 call 11, `css/skin.css`): `.seg-b:disabled` takes the pointer again (`pointer-events: auto`,
  `cursor: not-allowed`, no hover or press face) so control-help's hover shows why it is greyed; the browser refuses a disabled button's click.
  Why: λWAVES greys WAVE's buttons a system cannot use (016 V1, 017 W2) and the reason could not be read.

## FROM λWAVES, FOR THE KIT (1.5.0-alpha.27)
- **THE CADENCE KEY MAY LIVE ELSEWHERE** (016 W4, `modulation/window.js`): a port with `cadenceKey: false` takes the 60 | 120 HZ key off the
  modulation window's work bar (`transport.cad.remove()`); the app seats the cadence in its own SETTINGS. Why: Josh's call 7 of 2026-10-25 — the
  DJ keys stay, the sample-rate key is a setting, not a performance control.

## FROM λWAVES, FOR THE KIT (1.5.0-alpha.26)
- **THE RAMP'S PRESETS ARE REPLACEABLE** (015 P3, `panels/ramp.js`): `createRampPanel(…).setPresets(list, id?)` (and the view's) swaps the stepper's
  list in place — the app's own saved palettes beside the kit's — and a row may be a `coming` heading (`USER`, no stops, never chosen); the preset in
  force stays shown while listed, `id` names the one to show. The default ramp is now the first row WITH stops. Why: λWAVES' SAVE A PALETTE.
- **THE MODULATION WINDOW'S BARS ON THE KIT'S SEATS** (015 T2): the tempo / power bar and the preset bar wear `shell/transport.css`'s seat
  standard. Every button is a `.tbtn` (a round 34-px seat, flat until hovered: ▾ · save · ‹ › · the workspace switch); TAP · WALL | FREE ·
  60 | 120 HZ · HOLD ¼ · HOLD 1 and the dead light are `.tbtn.trig` (the work bar's raised 34-px key, 8-px corner, lit in accent A); the BPM
  is the kit's pill (`.tbtn.tempo-expand`, `.tempo-number` in accent B, `.tempo-unit` / `.tempo-hz`); the name is a well. Same DOM order, same
  ids, every function kept; the power was already `.mir-mod-power`. The hints of power, BPM, TAP, WALL | FREE and 60 | 120 HZ go through
  `hint()` (the raw `title` showed WALL | FREE's `{:…}` marks). `modhost.css` loses 72 selectors (28 whole rules) of the old m2* / mod* faces for
  these bars and gains one block, § THE WORK BARS. Files: `modulation/modwindow/modwindow.js`, `modulation/window.js`, `modulation/modhost.css`.
  Why: Josh, "Remove the DJ buttons and refine the DJ buttons on the tempo/power button bar on the modulation window … need updating to the new
  MIR standard". `modwindow.css` (the artifact's base sheet) still carries their old layout rules underneath; a later round may retire them.
- **THE TIMELINE'S DOOR SWAPS** (015 T5): `installTimeline({ transport: { onSwitch } })` hands `onSwitch` to the work bar's `modDoor`, so a press
  on the timeline's door runs the app's swap (λWAVES: the TIMELINE closes, the modulation window opens) as the modulation window's workspace
  switch already swaps back. Without `onSwitch` the door toggles the window as before. File: `timeline/window.js`. Why: Josh, "Hitting the
  modulation button on the timeline and the timeline button on the modulation window should swap between them."
- **THE HINT ON TOP** (015 H3): `#controlHelp` is a manual popover (`popover="manual"` where supported), hidden and re-shown at every
  open so it is the top of the top layer; `.control-help[popover]` drops the UA popover's centred box (`inset: auto; margin: 0`). A hint
  on a menubar row (the bar is a top-layer popover) was painted under the bar's list, whatever its z 10000. Files: `control-help.js`
  `installControlHelp`, `css/skin.css`. Why: Josh 10-23, "Let mouseover control hints not get cropped over any CSS errors".
- **THE PILL OUTSIDE** (015 H1): the scroll pill floats beside the window over the stage, at the title bar's height, `PILL.gap` (8 px)
  clear of the card's inner edge — or of the seated scrollbar's thumb, or of the rack's inner edge where a native bar shows — with a
  6-px tail (a turned square, `.rack-pill::before`) pointing at the window, the name whole (`width: max-content`, no ellipsis), its mask
  opening from the tail. Replaces 014 A11's eyebrow seat. Files: `shell/rack-scrollbar.js` `createRackPills`, `shell/rack.css`. Why:
  Josh 10-23, "Do not let the bubble touch or overlap the rack window".

## FROM λWAVES, FOR THE KIT (1.5.0-alpha.25+)
- **THE REVERSED KNOB** (014 D5): `knob({ reverse: true })` turns the dial the other way — the needle (and a modulated base tick) reads max
  at the left, a rise, ArrowUp / ArrowRight or PageUp move it right and lower the value; the value, `min` / `max`, `aria-value*`, `spec` (a
  second face inherits it) and a modulation map are unchanged; ignored on a `wrap` knob. `kit.js` `knob`. Why: Josh, "can the knob direction of
  the parameter of ISO, KNEE, SOFT be inverted? … I associate 'more-ness' to dialing it to the right" (ISO / KNEE / SOFT lower = more opaque).
- **THE WINDOW PICKER** (014 A7): `createWindowPicker({ rack, open, can, icon, cls })`. Files: `shell/window-picker.js`, `.css`
  (imported by `mir.css`), and two words in `locales/en.json`.
  - Every window of the rack (`rack.windows()`, cards left out) is a row, by name, under a search field. The first openable match is
    the default: Enter opens it, ↑ ↓ move it, Escape or a press outside closes. A row `can(id)` refuses is greyed, with the app's
    sentence, and never opens.
  - The row's glyph is its `spec(id).glyph`, or an empty `.wp-icon` seat with `data-icon` that the app paints.
  - The motion is GOL-NOTE.md §4: a spring open from 0.94 × 0.6, rows 30 ms apart (capped at the twelfth), each with a faux motion blur
    (a stretched copy at 10 % alpha collapsing into it), and a 120 ms close. Reduced motion shows none of it.
  - Why: Josh, "something similar to FL Studio's plugin picker where you could look for MIR windows and have the ones that can't be
    opened be greyed out … a search bar". λWAVES opens it from WINDOW's first row and the key row `windowPicker`.
- **THE FOUR CALLS** (014 A11, Yan's picks on Josh's "whichever you prefer"):
  - The timing row of `CONTROL_SURFACE_LAYOUT` is now to-start · latches · door · gear · dock · the app's time readout. The time takes
    the right end. File: `shell/transport.js`.
  - The scroll pill lies ON the window's eyebrow: from the name's start to `PILL.gap` (4 px) short of the head's first button, with an
    ellipsis when the name is longer. It never covers the head's buttons, the grip or the scrollbar, and its mask opens from the name's
    start. This replaces A10's tip; `PILL.track` is gone. Files: `shell/rack-scrollbar.js`, `shell/rack.css`.
  - `workspaceSwitch({ glyph })` draws a kit glyph in the ink in place of the palette diamond. The modulation window's switch passes
    `'lanes'`, the timeline's glyph; every other MIR mark stays. Files: `window/workspaces.js`, `window/window.css`,
    `modulation/window.js`.
  - Why: Josh's A10 open question ("say if it should stop at the eyebrow") and his "remove anything with the MIR logo and have proper
    icons for it". BASINS sees all three on kit day.
- **THE PILL'S TIP** (014 A10): the scroll pill's outer end stops 2 px short of the seated track's inner edge (or `scrollbarSeat`'s x when
  none runs) and reaches inward over the title bar, its mask opening from that tip; `rackPill` defaults to A, the scrollbar's accent.
  `shell/rack-scrollbar.js` (`PILL.gap` 2, `PILL.track` 12), `shell/rack.css`, `shell/gui.js`. Why: Josh, "make the scroll bar also be at the
  very tip of the pill so that the pill doesn't overlap the scroll bar" and "the default should be Accent A instead to match the scroll bar".
- **THE DOOR'S ICON** (014 A9): `modDoor({ mark: 'icon', icon })` / `createTransport({ door: 'icon', doorIcon })` draw the app's own glyph (an
  svg string or a url) as a CSS mask in the ink (`.mod-door-icon`); the timeline's work bar passes `transport.door` / `doorIcon` through.
  `shell/transport.js`, `shell/transport.css`, `timeline/window.js`. Why: Josh, "remove anything with the MIR logo and have proper icons for it";
  the diamond and the mark stay (the MIR Logo Button).
- 1.5.0-alpha.25 · `shell/transport.js` + `.css` (iteration 014 A8, Josh's answers of 2026-10-22): `CONTROL_SURFACE_LAYOUT` is three columns — the play over the power; the timing row (to-start · time · latches · door · gear · dock) over the buttons row (modes · chooser · search · + ◧ ☆); the rate over the BPM pill — and bands in a rack card (`.docked` / FREE); the scrub left it; the VERTICAL chip, `data-orient` and `setOrient` are gone; `createTransport({ freeWidth, freeHost })` makes the FREE window that wide, on the app's float layer, (λWAVES: one rack card) and the bar wears its card drawing there; `modDoor({ mark: 'none' })` lets the app dress the door (λWAVES: a sine-wave icon).
- 1.5.0-alpha.25 · `shell/transport.js` + `.css`: `logoButton({ mark, label, run })` — THE MIR LOGO BUTTON (Josh: "Leave the mechanism for the animation and CSS, as it will be useful somewhere else. I shall call it the MIR Logo Button"): the nine squares (or the palette diamond) turning a whole turn under a mouse, `.mir-logo-btn`; no layout places it.
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
