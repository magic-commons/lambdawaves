# 021 Reviewer B: keys, the second tab, shortcuts, menus (Opus, read-only, at aaf54b6; saved verbatim by Claude Sos)

## 1. The action table
`lab/shortcuts.js` and `lab/keymap.js` no longer exist; 0.5.0 C3 removed them (comments at keys.js:136 and key-table.js:1). Today the rows live in `ACTIONS`, keys.js:41-131 (67 rows plus the kit's hold row at :90). `createKeyTable`, key-table.js:35, puts them on the kit's `createKeys` (mir/shell/keys.js:298). The KEYBOARD window is the kit's `createKeyboardWindow` (mir/keyboard/keyboard.js:75). Every row the table holds appears in the editor and can be bound, including the ones with no key. `ask` is kept but inert while ASK_ENABLED is off. Tab and Shift+Tab rows work from the stage only.

| group (keys.js lines) | id and default key | in VERBS? |
|---|---|---|
| TRANSPORT :42-50, 99-101 | transport.play Space · home Home · stepBack ← · stepFwd → · modArm Ctrl+Space · modBar G · ask / (hidden) | `play` (sets on/off, the row toggles) |
| CAMERA :52-71 | zoomIn ↑ · zoomOut ↓ · yawL A · yawR D · pitchUp W · pitchDn S · dollyIn Q · dollyOut E · povIn ⇧Q · povOut ⇧E · dollyZoomIn/Out Ctrl⇧Q/E · camReset R · pan* Alt+arrows | `camera{home,yaw…}` |
| STATE :72-78, 88 | axisX/Y/Z X/Y/Z · rotorBoth/+/−/K 1–4 · turnNeg [ · turnPos ] · slap K · reseed Mod+R | — |
| WINDOWS & DISPLAY | fullscreen F · notebook J · style C · view V · palette P · mode — · ballStick — · hide H · next/prevWindow Tab/⇧Tab (stage only) · help ? · hold-text I · notes N · rack B · dock T · modulation M · settings Mod+, · render — · curves — · windowPicker — · keyboard — · menu (Picker) L · timeline — · gui — · guiAbout — | `view` and `notebook`: same id, different act (below) |
| CONTROL SURFACE :94 | csb.search Mod+K | — |
| PROJECT :102-114 | undo Mod+Z · redo Mod+⇧Z · redoY Mod+Y · historyUndo Mod+Alt+Z · save Mod+S · saveAs Mod+⇧S · folders O · history — | `new` (no key row) |
| added by the kit | timeline.* (timeline/shortcuts.js:21, each with a `when`) · timeline.undo/redo (keys.js:209-211) | — |

VERBS (verbs.js:18-89) is a second table, not the same action list. It has 16 verbs that take arguments: preset, molecule, volume, vibrate, view, window, camera, rate, lattice, bloch, play, scrub, switch, say, notebook, new. It shares no registry with ACTIONS.

**Functions with no action today** (all found in the code):
- Bar buttons: FOLDS (transport.js:79), THEME (:65), INFORMATIONAL all on/off (:69), gear (:62; the `gui` row exists, but the button has no `data-key-action`).
- NODES: the ADD menu, `openMenu` (nodes-view.js:258).
- Camera (material.js:303-321): PAN HOME, LOCK, FLIP, AUTO-ROTATE.
- SETTINGS card switches: PLAYBACK LOCK (`playLock`, settings.js:94), AUTO SCALE, GOVERNOR, FRAME, AXIS, AUDIO, KEEP FRAMES, DOMAIN AUTO.
- VIEW menu rows that exist only as rows (notebook.js:93-95): CONTROL HINTS ("hide all hints"), STATUS TAGS, STAGE CAPTIONS, STAGE FORMULA, ATOM LABELS, INVERT, set observable, set style, theme LIGHT/DARK/SYSTEM.
- FILE/EDIT rows: NEW, quick SAVE/LOAD, EXPORT .json/.mir/.png, IMPORT, the five SHAPE/GRID exports, NORMALIZE, CLEAR register, the COPY LaTeX/JSON/LINK rows.
- Card buttons: MOLECULES ON/VIBRATE/BREATHE/KICK (chemview), PARTICLES (readouts), TRANSITION/STORE A/B (transition.js), SOUND/LAUNCH/BOUNCE (spectrum.js), LOCATE/JUMP TO EVENT (vortex).
- FILM: take a picture and record (film-card.js:47-52).
- CSB: expander, rate ±, tempo ±.
- Every window: open, close and fold (`rk.reveal/close/fold`).
- Preset next/prev: there is no API at all (grep for nextPreset finds nothing).

There is no Web MIDI anywhere. The only mention is a comment at mod.js:906: `triggerMacros()` is "the list a future MIDI map binds against". The audio door is the modulation AUDIO device (eq-audio.js reads its LOW/MID/HIGH).

**Findings (ranked)**
1. DRIFT. Four action surfaces: ACTIONS (keys.js:41), VERBS (verbs.js:18), MENUS rows calling closures directly (notebook.js:79-102), and the bar's inline handlers (transport.js:60-84). The `__LW` facade is a fifth. Fix: one registry (DREAM).
2. BUG. NODES has its own keydown map (nodes-view.js:192-211): it reads `e.key`, so it breaks on AZERTY/Dvorak; it takes Tab (the binding law refuses Tab); it cannot be rebound, and the board does not show it. Fix: `kt.table.add` `nodes.*` rows with `when: ground focused`, the timeline precedent at keys.js:209.
3. DRIFT. Same id, different act: verb `view` sets the observable while the key row cycles it; verb `notebook` appends text while the key row toggles the window. Fix: verbs call actions with arguments, under one namespace.
4. DRIFT. Group `'CONTROL SURFACE'` is not in `ORDER` (key-table.js:16). `indexOf` returns −1, so csb.search sorts first in the table: it wins chord priority and sits at the top of the list. Fix: add it to ORDER.
5. DEBT. Duplicate rows: redo/redoY (keys.js:103-104) and help/keyboard (:89/:118). The cause is that `chordsOf` (key-table.js:22) gives a row one chord only. Fix: let a row pass `keys: [...]` straight through.
6. DRIFT. CLAUDE.md's keyboard paragraph still names `lab/keymap.js` and `lab/shortcuts.js`. Fix: rewrite it to name key-table.js and mir/keyboard.

## 2. The second tab
The window is `createWindow({ body: root })` (keyboard.js:113). The kit already has tabs: `panels: [{ name, body }]` with rail chips that switch them (window.js:241, 286-308, 434). The table API already gives everything the tab needs: `list()`, `run(id)` (fires without a key), `record()/answer()`, `bind/unbind`, `onChange`, `hints(root)`.

Name it MAPPING, not CONTROL SURFACE. "CONTROL SURFACE" is already the CSB's title (transport.js:59), a key group (keys.js:94) and the `dock` label.

Seam
- Kit (FOR-MIR): `createKeyboardWindow({ …, panels })`, where KEYS is panel 1 and the app supplies panel 2. On a phone (narrow mode) the MAPPING panel is its whole face.
- Rows: `kt.table.list()` plus the new rows that have no key (§1). Each row shows its action, a KEY chip, a MIDI chip, a MOD chip and one LEARN button.
- LEARN arms all three sources at once; the first input wins: (a) keydown → `kt.bind` with the steal law; (b) MIDI: a new kit door `mir/shell/midi.js` `createMidi({ storage, run: table.run, up })` — `requestMIDIAccess` only on a press (the MIC privacy law); the map is a PREFERENCE `lambdawaves.q0.midi { v:1, map: { 'note:ch:n' | 'cc:ch:n': { id, mode: trigger|toggle|hold } } }`; note-on, or CC rising across 64, calls `table.run`; note-off calls `up` for held rows; a continuous CC is a modulation SOURCE (`kind:'midi'` next to `audio-capture.js`) so it routes to any knob like an LFO, and pads reuse `triggerMacros()`; (c) MOD: the registry has numeric maps only (registry.js:107 `MAP_KINDS` linear/log/wrap/integer/bipolar) — no trigger, toggle or bool target type exists; FOR-MIR: map `'trigger'` (rising edge through 0.5 with hysteresis) and `'toggle'`; register `action.<id>` only for rows flagged `surface:true`; `run()` deferred out of the frame pump.
- Gesture-gated rows must carry `gesture:true` and be refused for MIDI and MOD: fullscreen (F), clipboard copies, file pickers.
- Safari and iPad have no Web MIDI: macro pads that emit keys are then the only road, so the keyboard road must be complete.

**Findings (ranked)**
1. KIT. `parseChord`/`keyToken` (mir/shell/keys.js:72-108) reject Media* and AudioVolume* codes: a rotary encoder sending AudioVolumeUp or MediaPlayPause cannot be bound. Fix: add them to `NAMED`.
2. KIT. The board (keyboard.js:41-53) has no ArrowUp, Home/End, Delete, F1–F24 or numpad: zoomIn (↑), panUp and `home` are invisible on it; F13–F24 (the macro-pad keys) parse but can't be shown. Fix: an "extra keys" strip under the board.
3. KIT. createKeyboardWindow has no `panels` parameter. Fix: pass them through to createWindow.
4. KIT. No trigger/toggle map in the registry (registry.js:107).
5. DEBT. No `surface` or `gesture` flags on the rows.

## 3. Professional shortcuts
| shortcut | today | expected | conflict |
|---|---|---|---|
| Mod+Z / Mod+⇧Z, Mod+Y | undo/redo (keys.js:102-104); the timeline's own pair under its focus; NODES' private one under its ground | ✓ | three stacks, one outside the table |
| Mod+S / Mod+⇧S | save / saveAs, inFields | ✓ | overrides the browser's Save Page (good) |
| Mod+O | nothing; plain O opens FOLDERS | open project | the browser's Open File dialog fires |
| Mod+N | nothing | new project | Chrome reserves it; use Mod+Alt+N |
| Mod+E | nothing | export | browser search focus; interceptable |
| Space | play, over controls and `<select>`s (key-table.js:48) | ✓ | — |
| Home | t → 0 | ✓ | a focused slider keeps it |
| Esc | closes KEYBOARD or blurs the stage (keys.js:157); pickers, menus and NODES each have their own | close the topmost layer | no single Escape stack |
| F11 | browser fullscreen; F is the app's API fullscreen | — | after F11, `F` reads `document.fullscreenElement` null and goes out of step |
| Mod+, | settings: `raise`, not toggle | ✓ | — |
| Mod+K | csb.search | ✓ | overrides the address-bar search |
| Mod+R | reseed (:88) | reload | takes over reload (⌘R too) |
| Ctrl+Space | modArm | — | the IME switch on Windows/Linux CJK |
| Ctrl+⇧Q | dolly zoom | — | possibly Firefox's quit chord on some platforms (unverified) |

Camera: WASD orbits (held, eased via `queueKeyOrbit`); Q/E dolly, ⇧Q/E POV, Ctrl+⇧Q/E dolly-zoom; ↑/↓ zoom, Alt+arrows pan, R homes; ←/→ step time. Priority: no camera row is `stage`-scoped and every row is `overControls` (key-table.js:44) — the camera answers from any focus outside a text field unless a focused control prevents the default; only Tab is limited to the stage. Reserved keys: the kit's `bindError` (keys.js:218) refuses only Escape and Tab; no list of browser-reserved chords (Mod+W/T/N/⇧N/Tab).

**Findings (ranked)**
1. BUG. Mod+R reseed takes over reload. Fix: Alt+R.
2. DRIFT. Mod+O and Mod+E do nothing; no NEW row. Fix: Mod+O → `folders`, `export.picture` on Mod+E, `new` on Mod+Alt+N.
3. KIT. `bindError` lets a user bind Mod+W/T/N, which never reach the page. Fix: a `RESERVED_BY_BROWSER` refusal.
4. DEBT. No layered Escape stack: five private Escape listeners (verbs.js:67, ask.js:16, picker.js:723, csb-favs.js:106, molecules.js:115). Fix: a kit `escapeStack.push(closeFn)`.
5. DEBT. F11 vs F fullscreen state out of step. Fix: `toggleFullscreen` reads `matchMedia('(display-mode: fullscreen)')` too.

## 4. The menus
Today: `MENUS` in notebook.js:79-102, wired by `createMenubar` (:113). FILE (:82): NEW, SAVE, SAVE AS, OPEN, 5 recent, EXPORT .json/.mir/.png, IMPORT, quick SAVE/LOAD, 5 SHAPE/GRID exports. EDIT (:90): UNDO, REDO, HISTORY UNDO, UNDO HISTORY…, PLAY/PAUSE, NORMALIZE, COPY LaTeX/JSON/LINK, CLEAR, RESET view, RESEED, RESET keys, SETTINGS. VIEW (:93): mode, INVERT, 4 observables, 5 styles, 6 on/off switches, HIDE, FULL SCREEN. WINDOW (:96): FINDER, PICKER, MODULATION, FOLDERS, TIMELINE, NOTEBOOK, rack, dock, HIDE, help, THEME ×3, then every card. ABOUT (:101): ABOUT, KEYBOARD, SETTINGS, PHOTOSENSITIVITY, UPDATE APP.
The kit's menubar (menubar.js:24-30): separators (`null` → `.mb-sep`, :116), a key text after `\t` (:122), `opts.current`. No submenus, no check or radio state, no icons (worked around in `tagIcons`, notebook.js:111).

Proposed tree (▸ submenu, ✓ check, • radio):
- FILE: NEW ⌥⌘N · OPEN… ⌘O · OPEN RECENT ▸ · SAVE · SAVE AS · ─ · IMPORT… · EXPORT ▸ { PROJECT ▸ .json/.mir/.png · PICTURE ⌘E · FILM… · SHAPE ▸ GLB/OBJ/STL · GRID ▸ NPZ/CUBE } · ─ · QUICK ▸ SAVE/LOAD
- EDIT: UNDO · REDO · HISTORY UNDO · UNDO HISTORY… · ─ · COPY ▸ LaTeX/JSON/LINK · STATE ▸ NORMALIZE/CLEAR/RESEED · ─ · KEYBOARD & MAPPING… · SETTINGS…
- VIEW: MODE ▸• · OBSERVABLE ▸• · STYLE ▸• · INVERT ✓ · STAGE ▸ CAPTIONS/FORMULA/LABELS/BALL-AND-STICK ✓ · INTERFACE ▸ STATUS TAGS/HINTS/WINDOW HELP ✓, HIDE H · CAMERA ▸ HOME/PAN HOME, LOCK/FLIP/AUTO-ROTATE ✓ · THEME ▸• · FULL SCREEN
- PLAY (new): PLAY/PAUSE · t→0 · STEP ◂ ▸ · MOD ARM · BAR LOCK · PLAYBACK LOCK ✓ · RATE ▸ · TEMPO ▸
- WINDOW: FINDER… · RACKS ▸ HIDE RACK, MINIMIZE/EXPAND ALL, DOCK CSB · TOOLS ▸ PICKER/MODULATION/TIMELINE/NODES/NOTEBOOK/FOLDERS/HISTORY/KEYBOARD · one submenu per KIND (window-chrome.js `data-kind`), each window ✓ when open
- HELP (renamed from ABOUT): ABOUT λWAVES · ABOUT MIR · KEYBOARD SHORTCUTS · PHOTOSENSITIVITY · UPDATE APP

**Findings (ranked)**
1. KIT (FOR-MIR). The menubar needs submenus (an entry `[label, () => entries]` with `opts.sub`, hover/→ to open, ← to close, an inline accordion on a phone); `opts.checked` (aria-checked plus ✓) and radio groups; `opts.icon`.
2. DRIFT. Menu rows run `a.run(1)` through `runAction` (notebook.js:73), skipping `keyEdit` (keys.js:139), so a menu RESEED's history row is named differently from the key's; the kit's `table.menuItem(id)` is never used. Fix: build every action row with `kt.table.menuItem`.
3. DRIFT. VIEW's on/off rows click switch roots (`ui.capSw.root.click()`, :95) and show no state, although the kit offers `opts.current`.
4. DEBT. Duplicate rows: HIDE (VIEW and WINDOW), SETTINGS (EDIT and ABOUT). Stale comment at :64.
5. DRIFT. Two roads to NEW: the FILE row uses `folders.fresh()`, the verb uses `requestFresh()`.

## 5. The 020 bar's buttons and the FINDER
| button | action row? | bindable? |
|---|---|---|
| FOLDERS (:63) | `folders`, tagged | ✓ |
| FINDER (:64) | `windowPicker`, tagged | ✓ |
| SEARCH | `csb.search`, tagged (csb-search.js:12) | ✓ |
| FOLDS (:79) | none | ✗ |
| NODES (:84) | toggles; the `curves` row (keys.js:116) only opens, button untagged | ✗ |
| THEME, INFO | none | ✗ |
| GEAR | `gui` exists, button untagged | ✗ |
The FINDER is `createWindowPicker` (notebook.js:~123), reached through `windowPicker`, which has no key.

**Findings (ranked)**
1. DRIFT. Add `folds`, `theme`, `info.all` rows, make `curves` a toggle; each needs a `data-key-action` passed as `ico`'s 5th argument so hints show the chord.
2. DEBT. `nodesLit` polls for the graph 120 times at 250 ms (:86) instead of hooking the open/close events.

## DREAM ARCHITECTURE
One file, `lab/actions.js`, with an `ACTIONS` registry in the kit's shape: `{ id, label, group, kind: 'fire'|'toggle'|'hold'|'set', args?, get?(), run(args), keys?: [chords], surface?, gesture?, undo: 'row'|'travel'|'none' }`. Toggles expose `get()`, so menus draw ✓, the bar lights its button, MIDI's toggle mode knows the state, and the registry can mirror it as an `action.<id>` trigger/toggle target. Verbs become `run(args)` on the same ids, so Gemma and `lw:` links call actions. The key table is fed from `keys`. Menus are trees of ids, `[id] | [label, [children]]`, drawn by `table.menuItem`. The CSB seats buttons by id: `ico(id)` reads the label, icon, lit state and hint. MIDI and the MAPPING tab read `list()` filtered by `surface`. The facade proxies `run`. One wrapper (`keyEdit`) names every history row, whatever surface fired it. Escape is a stack in the same module. Nothing is reached by label or by `.click()`.
