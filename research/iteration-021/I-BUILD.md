# 021 chain I — THE ACTION REGISTRY AND THE MAPPING (Opus builder, worktree agent-a0b68f7651e4d3530, branch it021-I, BASE 4710985)

## I1 THE REGISTRY (a9f88e5)
- **`lab/actions.js` (208 lines, new)**: `ACTIONS` rows `{ id, label, group, kind, args?, get?, run(args), keys?, exact?, surface?, gesture?, undo, was? }` and
  `createActions(app)` → `{ list, get, run, toggle, fire, up, add, sync, notify, onState, onAdd, setEdit, escape: { push, pop }, keyState, keyHelp, reveal }`,
  seated in rack.js before `createTransport` (the bar reads it) as `app.sh.ACTIONS` (the literal's existing slot; not extended). Every row reads `app`
  at run time. **252 rows: fire 159 · toggle 72 · set 16 · hold 5; 212 `surface`, 14 `gesture`**; 90 generated `window.<id>.open|close|fold`
  (a late `A.sync()` in rack.js picks up RENDER, NODES, FOLDERS); 13 verb rows (`bind: false`, the argument form only).
- **keys.js is the key table's feed** (261 → 156 lines): `kt` built from `A.list()`; a key runs `A.run(id, { fine, shift })`; THE ONE WRAPPER (`keyEdit`)
  is handed to the registry (`A.setEdit`), so a key, a menu, a verb, MIDI or a route name one history row the same way (`undo: 'travel' | 'none'` skip).
- `lab/key-table.js`: registry rows' `keys` pass straight through (`keysOf`: the Shift twin unless the chord holds Shift or the row is `exact`); `was`
  takes a list; ORDER gains CONTROL SURFACE (it sorted first at −1), VIEW, SETTINGS, CARDS, NODES, WINDOWS, TIMELINE; the KEYBOARD list is grouped by
  ORDER (a late row joins its group); THE FOCUS LAW serves any row with its own `when` (NODES), not only rows another module added.
- **Chords moved (call 6)**: reseed Mod+R → **Alt+R**; **Mod+O** OPEN (FOLDERS); **Mod+E** `export.picture` (×2 picture, saved); **Mod+Alt+N** `new`.
  Rows merged: redo + redoY → `redo` [Mod+Shift+Z, Mod+Y] (`was: 'redoY'`); help + keyboard → `help` (`was: ['keysheet', 'keyboard']`); `curves` → `nodes`
  (a toggle, `was: 'curves'`). Saved keys load by the old ids.
- **VERBS run actions**: `createVerbs.run` calls `A.run(verb, args)`; `view` cycles bare and sets with `{ id }`, `notebook` toggles bare and appends
  with `{ md }`; ONE ROAD TO NEW: the `new` action (FOLDERS asks "Save this first?"); the verb is a stub row for the doc and the arg check.
- **The bar's seats** `seat(id)` read word (`word()` for FOLDS), icon, lit (`get()`; `lit: false` on FOLDS) and hint from the registry, tagged
  `data-key-action` (gui, folders, windowPicker, folds, nodes, info.all, theme); `nodesLit`'s 120 × 250 ms polling gone (NODES' window
  `onOpen`/`onClose` → `A.notify('nodes')`; createNodes takes `onWin`).
- **NODES' keys**: the ground's private `e.key` map → 16 `nodes.*` rows with `when: ground focused` (nodes-view.js `keysAt(el)` → the acts);
  chords by place; Tab is the kit's again; the add menu Shift+A; arrows nudge (Shift ×10).
- **THE ESCAPE STACK** (`A.escape.push(close, { fields, alive })`, one listener) replaces verbs.js `say`, ask.js, picker.js (global), csb-favs.js,
  molecules.js; the KEYBOARD window is a layer; with none open, Escape on the stage still blurs it.
- `fullscreen` reads `matchMedia('(display-mode: fullscreen)')` too: after F11, F says F11 is the browser's instead of fighting it.
- `preset.next / prev`: `ui.hamSeg.step(±1)` (spectrum.js; the SYSTEM stepper's onChange named `onSys`). Card acts the registry cannot reach
  (KICK, STORE A/B, SOUND, LAUNCH, BOUNCE, JUMP TO EVENT) are pressed through their `data-key-action` tag; switches through their own press.
- Facade: `LW.actions` (get) and `LW.run(id, args)`; fixture re-captured — **+actions, +run, and +seek** (chain R's `seek` was never captured).

## I2 MAPPING (152c986) — kit MIR 1.5.6-alpha.2
- **`lab/mapping.js` (91 lines, new)**, the KEYBOARD window's second face (`panels`): every surface row by group — KEY · MIDI · MOD chips (× unbinds)
  and one LEARN arming all three (first wins: a keydown → the table with the steal law, a taken chord asks and LEARN + the same chord takes it; a MIDI
  note/CC → the map; a moved MACRO knob → `LW.mod.route(macro, action.<id>)`); `gesture` rows KEY only; search by word; CONNECT MIDI (asks only on a
  press); "MIDI · no MIDI on this browser" where there is none. `action.<id>` (lower-case segments) registered for 195 rows as `trigger`/`toggle`
  targets through `LW.mod.register` (one batch; `action` joins the install roots). PREFERENCE `lambdawaves.q0.midi` in RECORDS (forget: true);
  STATE-SCOPES regenerated (32 rows). `RESERVED_BY_BROWSER` passed by key-table.js. CSS: lab/keymap.css (the keyboard owner sheet).
- **Kit doors** (clone road, `.tmp/kit`, kit-1.5.5 branch; one version 1.5.6-alpha.2, one CHANGELOG line per door): `createKeyboardWindow({ panels })`
  (+ `tab(name)`, a face fills the pane); **MORE KEYS** — the board's second page in the same well (arrows, Home/End, PgUp/PgDn, Ins/Del, F1–F24, numpad,
  media): a swap, not a strip under the board, because the 416 px law holds five rows; `NAMED` + Media*/AudioVolume*; `createKeys({ reserved })` +
  `RESERVED_BY_BROWSER` (Mod+W/T/N/⇧N/⇧T, Mod+Tab, F11); `MAP_KINDS` + `trigger`/`toggle` (`fire(on)` at 0.55 up / 0.45 down, deferred a task);
  **`mir/shell/midi.js` (89 lines, new)** `createMidi({ storage, run, up, source, onState })`.
- Pictures: `I-shots/I2-mapping-empty.jpg`, `I2-mapping-learned.jpg` (a key, a note), `I2-morekeys.jpg`.

## I3 THE MENUS — same alpha.2
- **Kit**: submenus (`[label, () => entries, null, hint, { sub: true }]`; hover / → opens beside the row on the bar's layer, ← / Escape back, a press
  toggles; nests; an inline accordion on a phone), `opts.checked` (menuitemcheckbox, ✓), `opts.radio` (menuitemradio, •), `opts.icon` (kit glyph);
  `openPath(labels)`. menubar.js +59 lines net (76 changed), shell.css +10.
- **λWAVES' tree exactly as REVIEW-B §4**: FILE · EDIT · VIEW · PLAY · WINDOW · HELP; every row an action through `kt.table.menuItem` (or `A.run(id, args)`
  for a radio choice); toggles ✓ from `get()`; MODE/OBSERVABLE/STYLE/THEME radios; one submenu per window KIND (core · info · control · other), each
  window ✓ while open (a press opens a closed one by the FINDER's road, closes an open one); HIDE once (VIEW › INTERFACE), SETTINGS once (EDIT),
  one road to NEW; the stale `runAction` comment gone. lab.css: two unlayered rules so the accordion and the marks survive λWAVES' `.mb-*` sheet.
- Pictures: `I3-menu-{file,edit,view,play,window,help}.jpg` (desktop, one submenu open each), `I3-phone-accordion.jpg` (390 px).

## Tests
node: keyboard-shortcuts (re-aimed: registry rows + call 6's four), access (A7/A11 regex re-aimed to `a.when ||`), mir (MAP_KINDS), mir-manifest
(alpha.2 pinned), the whole `./test.sh node` set green (`FAILING: none`, per-file runner). Browser (LW 9677 / GD 5677): keyboard-window (re-aimed to the
table's chords, the order, MORE KEYS' hidden page) GREEN; menubar (re-aimed: paths `A › B`, HELP, RESET KEYS via the action) GREEN; history GREEN;
lw-facade re-captured. Kit: `npm test` node 81/81; keyboard, keys-table, keys-undo, menubar-phone, shell-interaction, i18n, kbm browser GREEN;
`adopt.mjs --check` in step. rack-deps HOLDS (persist 24/25; keys 17 → 11). new-project --check in step. THE LOCK `--check --query gastab=0`:
GREEN 843 values · 0 differences · 0 page errors — no leaf moved (nothing here touches the field).

## CLAUDE.md sentences (for chain D)
- ONE ACTION REGISTRY: `lab/actions.js` is the one table of acts — the key table (`shell/keys.js` feeds `lab/key-table.js`), the menus (`kt.table.menuItem`),
  the CONTROL SURFACE's seats, the verbs, the facade (`LW.run`), MIDI and the MAPPING all read it; a toggle has `get()`; Escape is its stack; nothing
  is reached by label (a card's button by its `data-key-action`).
- The keyboard paragraph, corrected: the keyboard editor is the kit's `createKeyboardWindow` (lab/mir/keyboard) with λWAVES' MAPPING face
  (`lab/mapping.js`); `lab/key-table.js` is the binding law over the kit's ONE KEY TABLE (keymap.js and shortcuts.js are gone since 0.5.0 C3).
- The menus: FILE · EDIT · VIEW · PLAY · WINDOW · HELP (notebook.js MENUS), every row an action id, toggles ✓, choices •, groups as kit submenus.

## FOR 1.5.6 leftovers
A `'midi'` modulation SOURCE kind in mod.js (midi.js hands every CC as 0…1; the model has no rack face for it); a menubar row's APP glyph (chain V's
`registerGlyphs`); kit browser tests for panels / MORE KEYS / submenus (λWAVES' suites cover them; the kit's own fixtures do not yet).

## Open questions for Josh
1. `action.<id>` routes are saved with a project like any route; like `nodes.*` (call 3) they name per-device acts — refuse them in serialization?
2. MIDI waits for a press after every reload (the privacy law): fine, or remember "connected" as a PREFERENCE and ask at boot?
3. MORE KEYS is a page swap (the 416 px law) rather than a strip under the board — keep, or let the window grow?
4. The WINDOW › KIND rows toggle (✓ = open; a press closes an open window). The old ↑ scrolled to it — prefer that?
5. 195 action targets join the modulation picker under ACTION: hide them behind a filter there?
