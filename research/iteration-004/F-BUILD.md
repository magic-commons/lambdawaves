# Iteration 004 · row F — THE FOLDER (and the MIR 1.5 gaps): what landed

Branch `it004-folder` (base `6fb4e3b`). Spec: `DATABASE/CLAUDE/APPS/LAMBDAWAVES/PLANS/IT004-MIR15-GAP.md` §1.3 and §3. No `lab/mir/**` edit.

## Landed

1. **The title screen is gone** (`lab/main.js`). A human start shows the notice when it is needed, then takes BASINS' no-pick rule: RESUME when `lambdawaves.q0.session` holds work, else the boot. `?starter=` (home · resume · a demo id), `?opener=1`, `?warn=1`, links, `?preset=`, `?view=` and the drivers' roads are unchanged. `remembered` and its `pagehide` writer are gone.
2. **The notice is on top** (`lab/rack.js`). The front page (z 100000) used to open at boot over the kit's notice (z 70), so a pointer could not reach CONTINUE. While the notice is up the front page now waits and opens after CONTINUE (headless Firefox: before CONTINUE `menuShown: false`, then a real tap on CONTINUE worked).
3. **FOLDERS is the projects home** (`lab/projects.js`, `lab/project-store.js`):
   - the eleven DEMOS wear their covers: a 4:3 middle crop of `lab/demos/covers/*.jpg`, 320 × 240 JPEG data URLs, about 76 kB for all eleven;
   - they refresh in place once, because the starters' revision became `saved·cover`; only a starter that is being added or refreshed fetches its cover;
   - folder cards wear `folderGlyph: 'folder'`;
   - **RESTORE THE DEMOS** sits in the foot (the kit's `factory`) and puts back a deleted demo;
   - the toolbar is **SAVE · PROJECT · DUPLICATE · NEW**, the report's option B;
   - OPEN FILE and EXPORT moved to FILE: IMPORT takes .json · .mir · a picture, and EXPORT has .json, .mir and a picture.
4. **The doors.**
   - WINDOW › FOLDERS (after MODULATION).
   - The **FOLDERS rack card** `projects`: the kit's `mountGallery`, 8 a page, closed at the top of the LEFT rack, in + and WINDOW. It is built at boot as BASINS builds it, because λWAVES' saved layout opens a card by its class alone.
   - O, the notebook's ▤ and SAVE AS / Ctrl+Shift+S, which also focuses NAME.
   - Every door puts the front page away first, through one port member (`cover`).
   - FILE › NEW / OPEN / the recent rows open FOLDERS and let it ask its own "Save this first?". The menus no longer call `window.confirm`.
5. **RENDER** (`lab/film-card.js`):
   - FILES · SAVE AS ZIP… / OPEN ZIP… (FOLDERS' zip, which no button reached before);
   - the SUBJECT: THIS VIEW, or the project ⓘ pointed at. It shows SYSTEM, VIEW, BASIS or PRESET, and for a saved project its FOLDER · SAVED · SIZE. COPY copies it as text and JSON downloads it;
   - ⓘ raises the card;
   - one `lab.css` rule stacks the subject's name over its verbs on the narrow card.
6. **MIR OPTIONS › SAMPLING is wired.**
   - AUTOMATION → the one modulation host's `clock.setAutomationGrid` (`lab/mir-gui.js`). A stored grid is applied once at boot.
   - SCRUB → the TIMELINE's `scrubLevel` (`lab/shell/keys.js`).
7. **A project save writes its modulation preset** in CAPS, when the rack routes something. This covers FOLDERS' saves and the facade's `save`, through `port.saved` and the kit's `presetUpsertCaps`.
8. **The modulation window joins the kit's one window stack** (`registerWindow`, `lab/shell/modulation.js`).
9. **Tests and bookkeeping.**
   - `tests/opener.browser-test.mjs` → `tests/start.browser-test.mjs`, reduced to three scenes: the notice then the lab, an edit plus a reload resuming, and the law.
   - `tests/menubar.browser-test.mjs`: its NEW row answers FOLDERS' ask.
   - CLAUDE.md (THE START, a FOLDERS paragraph) and `docs/STATE-SCOPES.md` (the session row).
   - `'resume'` joined the quiet-take origins.

## Checks

- **Node and the tools.**
  - `./test.sh node`: green. `wigner.test` W42-8, a timing row at 157 ms against 150, was red once under load and green alone.
  - `node tests/pwa.test.mjs --write`: done. The unreached kit `mir/shell/opener.js` left the precache.
  - `node tools/rack-deps.mjs --classes --no-write`: G-G holds (notebook 23, the largest still spectrum at 25), and G-A shows no strays.
  - `node tools/new-project.mjs --check`: in step.
- **Browser, green:** `start` (3 of 3), `menubar`, `new-project`, `project-formats`, `lw-facade`, `timeline`, `offer` and `film-handover`.
- **Browser, red on the base `6fb4e3b` as well** (iteration 003's front page opens at boot for a driver and takes the pointer; L is now the main menu's key):
  - `curves`, `frame-occlusion`, `keyboard-window`, `history`.
  - With `&menu=0`, frame-occlusion passes its four modulation-mask scenes (the drag included) on this branch and fails at the same disconnected-card row (line 97) on the base.
  - With `&menu=0`, keyboard-window fails only at its `KeyL` bind.
  - `menubar`'s own `KeyL` row was changed here to `Digit9`.
- **Headless Firefox look** (`.tmp/it004-folder/look.mjs`, 1440 × 900, `?opener=1`).
  - 01 the notice with the front page held back.
  - 02 CONTINUE → the lab and the front page, with no title screen.
  - 03 WINDOW › FOLDERS put the front page away. It shows ROOT with the DEMOS folder card (its cover and the folder glyph) and RESTORE THE DEMOS.
  - 04 DEMOS: eleven pictured tiles.
  - 05 WATER opened from it (ring `open · WATER`).
  - 06 ⓘ on BENZENE raised RENDER: SUBJECT BENZENE, MOLECULE · C6H6, and FILES' two zip rows.
  - 07 the FOLDERS rack card.
  - 08 a reload resumed WATER (ring `resume`, no notice).
  - A probe also saw: a save with no routes writes no preset; WAVE DANCER saved as `probe/dancer copy` wrote `DANCER COPY`; AUTOMATION 1/16 set the host's grid to 0.0625, and FRAME set it back to 0.

## Skipped, and why

- **The remaining `window.confirm` calls.**
  - The facade's `discard` serves `requestOpen`, `requestFresh` (also the verb table's NEW, `lab/verbs.js:69`), `demo()` and the `hashchange` link.
  - `sw-client.js` `accept` / `refresh` also call it.
  - Moving them to the kit's async `confirmDialog` changes `__LW` verbs that suites drive with a stubbed `window.confirm` (offer s5/s16, new-project, history, molecule-head, take-in-bugs, latex-copy, current). That is the report's separate M.
- **MAIN MENU › PROJECTS tab**: `lab/main-menu.js` is the Picker row's file (not edited here).
- **Session `hold` while a film renders** (report row 10): not in the top five.
- **PATTERN, LANGUAGE, timeline AUDIO, EXPORT/IMPORT GALLERY, adaptive ink, purge row**: Josh's calls (below).

## For the integrator

- `lab/rack.js` (the notice guard) and `lab/shell/notebook.js` (`cover: () => app.state.mainMenu`) name `app.state.mainMenu`. The brief asked for `app.state.picker?.close?.() ?? app.state.mainMenu?.close?.()`, but `app.state.picker` is not a key of the literal on this branch. rack-deps G-A counts any `app.state.<non-key>` as a stray, and `tests/rack-deps.test.mjs` requires 0. So these two lines use the key that exists. After the Picker merge, rename them to `app.state.picker` (G-A will point at them if forgotten). The front page needs `{ shown, open(), close() }`.

## MIR upstream issues

1. `folderGlyph` defaults to BASINS' `mandelbrotSmall` (`folders/gallery.js:97`): the default should be `folder`.
2. The notice dialog sits at `--z-banner + 10` = 70 (`shell/parts.css:52`): any app layer above 70 hides a modal photosensitivity notice. It should sit at the top, as the opener does.
3. A starter `thumbnail` must already be a data URL to survive EXPORT. A kit-side "URL → data URL (with a crop) at seed" would save every app the fetch, crop and encode.
4. FOLDERS cannot open in a chosen folder or remember one (prefs keep `{ sort, parts }`).
5. `extraChips` (a rail chip that opens another window) is still unbuilt.
6. **New:** `render/render.css`' `@container (max-width: 315px)` has no container anywhere in the kit (`.mir-render` declares none). On a rack card the SUBJECT's name collapses to one letter beside THIS VIEW · COPY · JSON. λWAVES patches it in `lab.css`.
7. **New:** the toolbar's icons are not data. SAVE (FOLDERS' `extraActions`) and PROJECT (BASINS' built-in) both wear the `save` floppy, so option B shows two identical icons side by side. The kit could take `actionIcons`, or give PROJECT its own glyph.
8. **New:** the kit's RENDER panel paints its SUBJECT only at build, `devopen` and when the app asks. An app whose layout opens a card by class gets a stale THIS VIEW, so λWAVES repaints on a project landing. A `subject.changed()` hook would let the kit do it.

## Josh's calls

1. **The toolbar.**
   - Option B is built: SAVE · PROJECT · DUPLICATE · NEW, with OPEN FILE and EXPORT under FILE.
   - Option A would restore FOLDERS' own SAVE · SAVE AS · NEW · OPEN FILE · EXPORT. It is one line (`actions`).
   - Note the two identical floppy icons (MIR issue 7).
2. **Where FOLDERS lands.** Today it opens at ROOT, where DEMOS is a folder card with a cover. Should it land in DEMOS on a first visit?
3. **WINDOW shows FOLDERS twice:** the window row (O) and the rack card's `⊕ FOLDERS`. BASINS hides its rack cards from that list.
4. **The quiet take for an unedited resumed tab** (`resume` origin). It is in, but nearly moot: a resumed session stays "unsaved" until a SAVE.
5. **The report's list:** PATTERN (row 11), LANGUAGE (12), timeline AUDIO (13), EXPORT/IMPORT GALLERY (14), adaptive ink (15), EDIT › purge (16), BASINS' Shift ⅛ knob law (24).
