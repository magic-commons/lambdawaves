# M1 — THE MIR SPECIAL WINDOWS, APP-SIDE (iteration 012, branch `it012-m1` from `6e6886f`)

`lab/mir/**` untouched. Everything is λWAVES' own JS/CSS over the kit's DOM; what only the kit can do is four lines in `docs/FOR-MIR.md`.

## (a) THE KEY TABLE, row by row (`lab/shell/keys.js` ACTIONS; the KEYBOARD window reads the table, so its list follows)
| row (id · chord) | verdict | change |
|---|---|---|
| transport.play · Space, home · Home, stepBack / stepFwd · ← → | live | — |
| ask · / | hidden (Q6, `ASK_ENABLED` false); a saved chord kept inert | — |
| zoomIn / zoomOut · ↑ ↓, yawL/yawR/pitchUp/pitchDn · WASD (O1's held turn) | live | — |
| dollyIn/Out · Q E, povIn/Out · ⇧Q ⇧E, dollyZoomIn/Out · Ctrl⇧Q Ctrl⇧E, camReset · R | live | — |
| panLeft/Right/Up/Down · Alt+arrows | live (CAMERA LOCK rests them, as its law says) | — |
| axisX/Y/Z · X Y Z, rotorBoth/Plus/Minus/K · 1–4, turnNeg/Pos · [ ] | live (the atomic register, all 140 labels, n = 7 included; nothing in the table reads n) | — |
| slap · K | live; label named STATE's old RELEASE (gone) | label: "…; METERS says what it did" |
| reseed · Ctrl+R | live (VORTEX's PARTICLES) | — |
| style · C | live (CLOUD · SOLID · SIGNED · DUST · BANDS, 008 G) | — |
| view · V | live (WAVE_VIEWS, 008 W) | — |
| palette · P, hide · H, nextWindow / prevWindow · Tab ⇧Tab | live | — |
| help · ?, info-hold · I (the kit's), notes · N, rack · B, dock · T | live | — |
| modArm · Ctrl+Space, modulation · M | live | — |
| modBar · G | live; label said "the modulation loop clock" (C4: one clock) | label: "lock the tempo to the state: one bar = one recurrence of the density" |
| undo · redo · redoY · historyUndo | live | — |
| settings · Ctrl+, · save · Ctrl+S · saveAs · Ctrl+⇧S · folders · O | live | — |
| history · keyboard · menu (L) · timeline · gui · guiAbout | live | — |
| timeline.* (30 rows, the kit's, under THE FOCUS LAW) + timeline.undo / redo | live | — |
| R1's renames (PARALLAX, BALL AND STICK, MARKS › DIPOLE, OPACITY); R3's CONTROLS | no row named the old words | — |
| **mode** (ATOMS \| MOLECULES, the switch under the title) | missing | **added**, no chord (Josh's to give) |
| **ballStick** (BALL AND STICK on / off) | missing | **added**, no chord |
| **render** / **curves** (the kit's two cards λWAVES carries, as HISTORY) | missing | **added**, no chord |

## (b) THE MENUBAR, dropdown by dropdown (`lab/shell/notebook.js` MENUS)
| menu · row | verdict | change |
|---|---|---|
| FILE (NEW · SAVE · SAVE AS · OPEN · RECENT · EXPORT ×3 · IMPORT · quick SAVE / LOAD · EXPORT SHAPE / GRID ×5) | all live (menubar suite) | — |
| EDIT (UNDO … SETTINGS) | all live | — |
| VIEW · observables, styles, STAGE CAPTIONS / FORMULA / ATOM LABELS, STATUS TAGS, CONTROL HINTS, HIDE, FULL SCREEN | live | — |
| VIEW · the mode | missing | **ATOMS \| MOLECULES  switch the mode** first, then a rule |
| VIEW · BALL AND STICK | missing (R1) | **BALL AND STICK  on / off** after ATOM LABELS |
| WINDOW · FOLDERS twice (the door `FOLDERS O` and the rack card `⊕ FOLDERS`) | **defect** (O1) | the `projects` card left the window list; FOLDERS (O) is the one door, the card stays in + |
| WINDOW · HIDE the interface (also in VIEW) | kept — the menubar suite holds it in both | — |
| WINDOW · PICKER / ATOMS / MOLECULES | no icons | **I1's library / atomic / molecular** at the row's right edge (after the chord) — tagged in a microtask after the kit's fill (`tagIcons`), painted by a `lab.css` mask. I1's FOR-MIR line for WINDOW › PICKER is answered app-side |
| GUI (MIR OPTIONS · MIR ABOUT) | live | — |
| ABOUT | WARNING missing | **PHOTOSENSITIVITY WARNING…** (d) |
| + list · CURVES / FOLDERS / RENDER | glyph at the left, the word pushed right (`#rackAddList` is not `.mir-rack-list`, so shell.css' space-between applied) | `lab.css`: the word leads at the left, every glyph (the kit's three and I1's ATOMS / MOLECULES) at the right edge, the ☆ after it, rows centred |

## (c) FOLDERS (`lab/projects.js`, `lab/rack.js` one line, `lab.css`)
- **The demos when ROOT holds none of the reader's**: `demosFirst(view)` turns a view opened at ROOT to DEMOS — from FOLDERS' `onOpen` and the FOLDERS card's `onOpen`. A reader's save at ROOT keeps ROOT the landing.
- **"A fresh profile already holds one project before any save"**: that is the seed, ours and by design — WAVE DANCER PROTOTYPE, `STARTERS`' one demo (iteration 009 cut the eleven to one), a read-only starter in DEMOS (`lambdawaves.q0.projects.seeded`). Not a stray save; nothing changed. ("The eleven demos" in the brief and CLAUDE.md is stale: there is one.)
- **SAVE glyphs**: SAVE (λWAVES', over the open project) keeps the kit's floppy; PROJECT — BASINS' "store with a thumbnail" spot that wore the same floppy — wears I1's `save.svg`.
- **The two bars**: I chose the **icons** (`file-name.svg` in NAME, `folder-name.svg` in SAVE TO, inside each bar at the left) over an empty NAME: in DEMOS the bars read DEMOS · DEMOS and the glyphs tell them apart at a glance, while the kit's proposed name (and its unique numbering) still saves without typing.
- **FOLDERS closes after an OPEN**: the kit's `onOpened` lets the app say so. Only an open FOLDERS' own adapter took closes it (`landed`); the facade's telling (Ctrl+S, `__LW.projects.open`, which the kit reports after its picture's await) never does.

## (d) WARNING
SETTINGS' SHOW THE WARNING AGAIN (`settings-card.js`, relabelled WARNING by `native-ui.js`) is gone; ABOUT › PHOTOSENSITIVITY WARNING… resets and shows the notice. The empty `.settings-actions` row is removed.

## Also
- `lab/native-ui.js`: R3's STYLE / FINISH words are hidden (`display: none`), not removed — the history names a press from that label, and with it removed the row read "CLOUD · WAVE" (the history suite went red on that scene; green now, the suite untouched).
- `tests/new-project.browser-test.mjs`: one expectation re-aimed — a blank tile opened from FOLDERS now leaves FOLDERS closed.

## Files
`lab/shell/keys.js` · `lab/shell/notebook.js` · `lab/projects.js` · `lab/rack.js` (the FOLDERS card's onOpen) · `lab/windows/settings-card.js` · `lab/native-ui.js` · `lab/lab.css` · `lab/sw.js` (pwa --write) · `docs/FOR-MIR.md` (4 lines) · `tests/new-project.browser-test.mjs` · `research/iteration-012/m-shots/` (shot.mjs = r-shots' copy; m1-scenes.mjs, probe-keys.mjs, probe-verify.mjs; before-/after PNGs).

## Tests
`./test.sh node` GREEN · `node tests/new-project.test.mjs` GREEN · `node tools/new-project.mjs --check` in step · `rack-deps --classes --no-write` HINGE holds (spectrum 25/25) · browser on 9601 / GD 5401: `keyboard-window` GREEN, `menubar` GREEN, `history` GREEN (after the STYLE label fix), `new-project` GREEN (one re-aim), `start` GREEN 3/3; `keyboard-shortcuts` is a node suite (in `./test.sh node`). Live probe (`probe-verify.mjs`): WINDOW rows tagged library / atomic / molecular, FOLDERS listed once, mode and BALL AND STICK rows flip, RENDER / CURVES open, ABOUT's row shows the notice, FOLDERS lands on DEMOS and closes after a tile's OPEN.
Shots (1920×1080, Vulkan off): `m-shots/m1-a-keyboard.png` (the new rows in the list), `m1-b-window-menu.png`, `m1-b-add-list.png`, `m1-c-folders.png`, `m1-d-about-menu.png` (SETTINGS open beside it, no WARNING); `before-*` at the base.

## CLAUDE.md sentences for Yan
- After the ACTIONS paragraph: "Since iteration 012 M1 the table carries `mode` (ATOMS | MOLECULES), `ballStick`, `render` and `curves`, each with no chord; VIEW has the mode and BALL AND STICK rows, ABOUT has PHOTOSENSITIVITY WARNING… (SETTINGS has no WARNING), WINDOW lists FOLDERS once (the `projects` card is in + only), and WINDOW's PICKER / ATOMS / MOLECULES rows wear I1's icons (notebook.js `tagIcons` after the kit's fill, a lab.css mask); the + list puts the word left and every glyph right."
- In the FOLDERS paragraph: "FOLDERS opens on DEMOS while ROOT holds none of the reader's projects (`projects.js` `demosFirst`, the window's and the card's onOpen), closes after an OPEN its own adapter took (`landed`; never for the facade's telling), PROJECT wears `save.svg` and NAME / SAVE TO carry `file-name.svg` / `folder-name.svg`. There is one demo (WAVE DANCER PROTOTYPE, iteration 009), not eleven."

## Open for Josh
1. The new rows (mode, BALL AND STICK, RENDER, CURVES) ship with no chord; U and 5–9 are free if you want keys.
2. FOLDERS now closes after an OPEN; NEW still leaves it open. Say if NEW should close it too.
3. HIDE the interface stays in both VIEW and WINDOW (the menubar suite holds both); say if WINDOW should drop it.
