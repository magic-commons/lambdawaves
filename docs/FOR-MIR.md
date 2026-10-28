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
