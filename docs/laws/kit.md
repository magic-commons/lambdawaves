# The kit (MIR): adoption, doors, palettes, the cascade

The paragraphs below were moved verbatim from CLAUDE.md at 021 D2 and keep their iteration tags; where an older line names a file, a seat or an id a later iteration retired, the later law wins, and the laws of 021 stand first.

## The laws of 021

THE KIT IS 1.5.5 AND THE APP ONLY ADDS DOORS: lab/mir is written by adopt.mjs alone; a λWAVES need becomes an additive door numbered 1.5.6-alpha.N with its FOR-MIR line; a removal waits for a line; `node <MIR>/tools/adopt.mjs . --check` says in step. (021 K; the one source is CLAUDE.md line 6, which `docs/NOTES-FOR-AGENTS.md` §7 and `docs/FOR-MIR.md` cite.)

THE CLONE ROAD (021 K, PLAN call 12): a door is built in a clone of the kit's bundle on the kit's own laws (words through `label()`/`t()` and the English pack; parts by class and `data-*`; `.glass` takes the look store), committed there as `1.5.6-alpha.N`, adopted back with `adopt.mjs` (`MIR-MANIFEST.json` plus its pin in `tests/mir-manifest.test.mjs` ACCEPTED, the two-file edit), and its bundle left for Josh to fetch into `~/Documents/MIR`; `tools/mir-manifest.py` is retired (021 K4). The kit reads 1.5.6-alpha.8 (alpha.1 the failed resume, R1; alpha.2 the keyboard panels, MIDI and submenus, I2/I3; alpha.3 `registerGlyphs`, `windowGlyphs`, `glyph`, V1; alpha.4 `contextMenu`, `holdTap`/`onContext`, the knob menu, `--surface-menu-floor`, 022 P1; alpha.5 RELIEF IS TIGHT and the menu's ink, `--surface-menu-tint` · `--surface-menu-edge`, 022 S; alpha.6 THE FIT ROW `.row.fit` · `row(parent, { fit })` and `--cell-min` `--knob-min` `--knob` `--knob-max` `--row-gap`, 022 F1; alpha.7 THE SURFACE PARTS `section` · `knobBank` · `meter` · `lamp`, `macroRail({ face: 'knob' })` · `macroKnob` and `--xport-well` `--xport-section` `--xport-grid` `--xport-led`, 022 C1; alpha.8 EVERY DISABLED CONTROL KEEPS ITS HINT and FROST's TEXT AUTO, 022 E1); open asks wait in `docs/FOR-MIR.md` § FOR 1.5.6.

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
