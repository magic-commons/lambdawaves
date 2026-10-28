# The shell: windows, menus, keys, actions, icons, the start

The paragraphs below were moved verbatim from CLAUDE.md at 021 D2 and keep their iteration tags; where an older line names a file, a seat or an id a later iteration retired, the later law wins, and the laws of 021 stand first.

## The laws of 021

ONE ACTION REGISTRY (021 I1): `lab/actions.js` is the one table of acts — the key table (`shell/keys.js` feeds `lab/key-table.js`), the menus (`kt.table.menuItem`), the CONTROL SURFACE's seats, the verbs, the facade (`LW.run`), MIDI and the MAPPING all read it; a toggle has `get()`; Escape is its stack (`actions.escape.push(close)`, read from a keydown whose `code` is Escape); nothing is reached by label (a card's button by its `data-key-action`). A surface row is also the modulation target `action.<id>` (trigger or toggle, `lab/mapping.js`), whose base is always 0 (021 D0: a film's resume signature counts every base).

The menus: FILE · EDIT · VIEW · PLAY · WINDOW · HELP (notebook.js MENUS), every row an action id, toggles ✓, choices •, groups as kit submenus; a row is named by its path ('WINDOW › TOOLS › TIMELINE'), and its hint is its action's label when none is given. (021 I3, V)

THE ICON TABLE (021 V2): `lab/icons.js` is λWAVES' one table of drawings in the kit's shape (24 box, stroke 1.9, round, currentColor, evenodd solids, 16/20/24 px, meaning-named camelCase), registered at boot through the kit's `registerGlyphs`; every icon is an SVG drawn by a kit road (`chip`/`setGlyph`, `sw({ glyph })`, `spec.glyph`, `opts.icon`); no CSS mask, no sprite, no image file; every window declares ONE glyph (`WINDOW_GLYPH`) at its register or through `windowGlyphs`; a window without a drawing wears a BORROWED one until it is drawn (V-BUILD.md's list is 022's drawing order).

A HINT IS ONE LINE (022 H1): every hint λWAVES writes (`hint:` `title:` `tip:` `knobTitle:` `.title =`, `hint()`, `ariaLabel()`) is one line of ≤ 60 characters (≤ 40 where it fits), read by the kit's one tip (`#controlHelp`, 280 px); a second sentence worth keeping lives in the window's `.note` (its ⓘ), never in the hint; a glyph replaces the words where one exists (the download glyph + "{mb} MB", INFORMATIONAL › SIDE's `sideRight|Left|Top|Bottom`); an action whose label is over 40 carries a `hint` (≤ 40) that the bar's seats, the menus and the MAPPING read (`hint || label`). `node tools/hints-census.mjs --check` is its gate (in `./test.sh node`); the kit's strings over 60 wait in docs/FOR-MIR.md's list (research/iteration-022/H-BUILD.md).

## The standing paragraphs

The stage frame/axis mask is built in `lab/shell/ink.js` `refreshOcclusion()` (`createInk` hands it to the loop) and
consumed by the line shader in `lab/field.js`. Mask painted window surfaces,
never a transparent layout box: the modulation root, its chip rail, and
disconnected rack cards all have intentional gaps. A moved or scrolled window
must schedule a PRESENT even while paused. A mask read while a rack or `#floats` animates is read again when the motion lands (`ink.js` `landing()`, iteration 015 T6); `tests/window-switching.browser-test.mjs` storms 30 presses in 3 s and checks hidden, the pill's seat and the mask. Run
`tests/frame-occlusion.browser-test.mjs` after changing this geometry.

The rack hide ◧ / B peeks ONE rack per edge (`rack-peek-left | right`, lab.css) and the stage bar round its rest seat (`transport-peek`, set by rack-wiring.js since λWAVES hands createRack no `transport`; iteration 015 H3); the hover hint (`#controlHelp`) is a manual popover raised at every open, so it is never under the menubar or an ⓘ (kit alpha.26, 015 H3); there is no auto-hide; `tests/hide-reveal.browser-test.mjs` guards H, B and its peeks, every fold and the hints. The rack is MIR's `createRack` (0.5.0 C3): every `.dev` registered in place,
`layout`'s verbs aliases over it, captureLayout's v3 still the WORKSPACE
record; the menubar is `createMenubar` over MENUS (021 I3, above); the bar is the kit's
`createTransport` (014 A0, control-surface.md). Keys are MIR's ONE KEY TABLE (`lab/mir/keyboard`) through `lab/key-table.js`, λWAVES' binding law over it (the rows of `lab/actions.js`: `ctrl:
true` Mod, `'Ctrl'` the Control key; no `shift`: Shift is the fine step; every
row `overControls`; an overlap binds only on an explicit steal;
`lambdawaves.q0.keys` lifts 0.4.0's shape). The KEYBOARD window is the kit's
`createKeyboardWindow` (`lab/mir/keyboard`) on `#floats`, with λWAVES' MAPPING face (`lab/mapping.js`, 021 I2: KEY · MIDI · MOD for every surface action, one LEARN), painted by `lab/keymap.css` (021 G6;
unlayered: five rows in 416 px, legend + switch on one row, centred RECORD /
RESET, status only when needed); its occlusion follows its drag and its close.
Run `keyboard-shortcuts`, `keyboard-window`, `menubar` and `history` after
touching any of it.

The action rows live in `lab/actions.js` (021 I1; `lab/shell/keys.js` hands them to `lab/key-table.js`):
an id is the kit's where the kit has a twin (`transport.play`, `save`,
`folders`, `modulation`, `notebook`, `rack`, `dock`, `hide`, `fullscreen`,
`help`, `undo`, `redo`) and `was` keeps a binding saved under the old id
loading; `group`/`short` feed the keyboard window; `inFields` lets a row run
from a text field; a control a row drives carries `data-key-action`. `ctrl:
true` is the kit's `Mod` (Ctrl or ⌘); `ctrl: 'Ctrl'` is the Control key alone
— Ctrl+Shift+Q/E and the MOD arm (Ctrl+Space) are spelled so, never `Mod` (⌘⇧Q
logs a Mac out). S stays WASD's pitch-down; FOLDERS is O (R-K1). (0.5.0 A9)

Since iteration 012 M1 the table carries `mode` (ATOMS | MOLECULES), `ballStick`, `render` and `curves`, each with no chord; VIEW has the mode and BALL AND STICK rows, ABOUT has PHOTOSENSITIVITY WARNING… (SETTINGS has no WARNING), WINDOW lists FOLDERS once (the `projects` card is in + only), and WINDOW's PICKER / ATOMS / MOLECULES rows wear I1's icons (notebook.js `tagIcons` after the kit's fill, a lab.css mask); the + list puts the word left and every glyph right. Since iteration 012 M1 FOLDERS opens on DEMOS while ROOT holds none of the reader's projects (`projects.js` `demosFirst`, the window's and the card's onOpen), closes after an OPEN its own adapter took (`landed`; never for the facade's telling), PROJECT wears `save.svg` and NAME / SAVE TO carry `file-name.svg` / `folder-name.svg`. There is one demo (WAVE DANCER PROTOTYPE, iteration 009), not eleven. Since iteration 013: SPECTRUM's ‹ SYSTEM › stepper carries no visible word (H3) — it is the HAMILTONIAN group's first row, its aria-label stays SYSTEM and `ui.hamSeg` keeps its name and ids; the stepper closes the window it opened (CENTRAL, SEPARABLE, LATTICE, ATOMS) when it leaves that system (H2) — a window the reader had already open stays, and MOLECULES (the mode) is never closed by it; under the title `#lwMode` is a COLUMN of three icon buttons with hover hints and no words (H4): LIBRARY (the Picker), MOLECULAR (MOLECULES on) and HYDROGEN (MOLECULES off — the mode ATOMS was, the boot's default; ids `atoms` | `molecules` kept; keys.js `mode` and VIEW read HYDROGEN | MOLECULES), `#lwHome` is hidden since LIBRARY opens the same Picker, and the reader turning the ATOMS window's power ON sets SPECTRUM's system to ATOM (a click only, never a restore). The hidden-interface lag under BOX + FRAME box (H5) was NOT reproduced in headed Firefox on the GPU (hidden 95–101 fps vs 34–40 shown; the shown cost is the compositor's frosted windows): no code moved; research/iteration-013/H5-BUILD.md has the table.

MINIMIZED BY DEFAULT (iteration 011 Q2; Josh: "By default make most of the hidable texts and exandable windows minimized for default
users"): every first-visit window arrives folded (iteration 001, FOLD_ALL) and every fold INSIDE a window (`lab/fold.js`' presses, keyed by
`data-fold`; SHADOW's details too) arrives closed on every device (`lab/first-run.js` `inner`, closed by rack.js' first-visit block). The
open ones are WORKSPACE: a card record's `folds` names them (`lab/shell/rack-wiring.js`, written only when one is open), so a resumed
session, a project or a ☆ layout that names a fold opens it, and a record without `folds` closes them. What stays open is ruled: SPECTRUM's
shells n ≤ 6 (n = 7 folded), MOLECULES' top rows, the register ladder, hints on, the formula and atom labels (007 I), the phone's
TRANSPORT card. The table: `research/iteration-011/Q2-BUILD.md`.

THE START (0.5.0 C6b, `lab/main.js`). THE PHOTOSENSITIVITY LAW is λWAVES', not
the kit's: a human visitor reads the kit's photosensitivity notice once per
browser BEFORE anything animates, and NO query string silences it for a human
(the kit's `?warn=0` is not honoured); only a test driver skips it (`?warn=1`
forces it there). Its seen-flag is the settings blob's `warned`; `__LW.warning`
keeps show dismiss needed onAccept reset seen remembered open; `?play=1` waits
for it; `LW.ready` never does. THERE IS NO TITLE SCREEN (iteration 004, Josh: the
demos and the saves are FOLDERS'): after the notice a human start takes BASINS'
no-pick rule — RESUME when `lambdawaves.q0.session` holds work (MIR's
`createSession` over the one part, PROJECT), else the boot — and the front page
(THE PICKER) opens only after CONTINUE, so the notice is never under it. The
boot awaits the choice. A driver, a link, `?preset=` or `?view=` start on
`?starter=` (home · resume · a demo id) or the boot; `?opener=1` makes a driven
start a human one (`tests/start.browser-test.mjs`); CDP tools add
`&starter=home`. STATUS TAGS off hides the four ψ-badges, never the build offer;
an untouched session (ring origin boot/link/resume) takes a waiting build itself
(`lab/sw-client.js`, `rack.js` `untouched`), any other session only on a press.
The banner is MIR's
`installBanner`, the veil MIR's `bootVeil`, and the wake lock follows THE play.

GEMMA IS HIDDEN (iteration 011 Q6). Josh 10-19: "Also Gemma doesn't seem to appear to work. Isn't she built into the app? Or if not can we
just hide the feature for now until we find out our own lightweight AI assistant in the app?" She was never built in: ASK posts to a
local broker (`tools/gemma`, Ollama's `gemma4:e4b`, `docs/GEMMA.md`). ONE flag, `ASK_ENABLED = false` in `lab/ask.js`, closes every
door, and nothing is deleted. With the flag off, the transport's ASK button and THE TYPE BOX do not mount (`shell/transport.js`), and the
/ row is not in ACTIONS (`shell/keys.js`), so the KEYBOARD window does not list it. A saved `ask` chord is carried, inert, through every
save (`key-table.js` `keep`). SETTINGS does not build the GEMMA address (`windows/settings-card.js`, `native-ui.js`). A stored `askOk` or
`askUrl` is carried by `saveSettings` as it was stored and never written. `createAsk` is never made, so no request can leave. THE VERB
TABLE and the `lw:` links do not read the flag. To bring her back, flip the flag and run `pwa.test.mjs --write`. The proof is
`research/iteration-011/q6-proof.mjs off|on`.

The stage's pointer road asks MIR's scene guard first (`createSceneGuard({
install: false })` in `lab/stage-gestures.js`, UI space from `uiSpace` in
`lab/shell/rack-wiring.js`, `wireStage`): a press, a double-click or a wheel in a window's gap never reaches
the stage. `tools/hit-probe-set.mjs` is its gate, and the count is 0 reached.
(0.5.0 C9)
