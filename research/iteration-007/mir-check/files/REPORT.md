# MIR check · PROJECT FILES and RENDER, as a λWAVES user meets them

Iteration 007, investigator report. Branch `yan-c` @ `81625da`, worktree `optimization-2026-09-24`. 2026-10-18.
This was a read-only investigation: no source was edited, nothing was committed. **The tree moved while I worked.** Another session committed `dd2d0b2` (18:47, the MIR check's modulation fixes in chemview, facade, keys, statesview, sw and molecules), and HEAD is now `b569552`. The runs after 18:47 (the reruns, walk-e, timeline) used the newer tree. None of the files behind B1–B3 or P1–P9 changed between `81625da` and `b569552`: statelink.js, shell/links.js, projects.js, project-store.js, film-card.js, rack-wiring.js, and lab/mir/folders/* and render/* are all unchanged. Headless Firefox ran through the repo's gate kit (`tools/gate/server.py` on 8733, geckodriver on 5233; 8731 was taken). The machine was under heavy load (load average 17–19).

**Counts:** 35 WORKS · 3 BROKEN · 9 POLISH · 2 FLAKY-UNDER-LOAD · 1 SUITE STALE (an intended change the suite has not caught up with).

## Behaviours

| # | Behaviour | Verdict | Evidence / pointer |
|---|---|---|---|
| 1 | FOLDERS opens on the **O** key (a real key) | WORKS | Toolbar reads SAVE · PROJECT · DUPLICATE · NEW (screen 01) |
| 2 | **PROJECT** (save under a typed NAME), by a real tap | WORKS | `saved MIRCHECK ONE`, clean, history depth unchanged |
| 3 | Undo history survives a save | WORKS | After the save, undo goes 3dz2 → 1s+2pz and marks the project dirty; redo comes back and the project is clean again |
| 4 | The undo ring after an **open** | WORKS (by design) | The ring resets to `open · <name>` (STATE-SCOPES: an open is the bottom of the stack; the ring is never saved) |
| 5 | **NEW** on a clean screen (toolbar tap) | WORKS | Empty project, ring `new project`, settings unchanged |
| 6 | **NEW** over unsaved work | WORKS | Asks "Save this first? · SAVE & NEW · NEW WITHOUT SAVING" (screen 23) |
| 7 | **Open** a tile (tap, then tap again) | WORKS | `serialize({scope:'edit'})` byte-identical to the save; clean; ring `open · MIRCHECK ONE` (screen 03) |
| 8 | **Save → open → save** byte stability | WORKS | Stored data is identical except the save stamp `presentation.layout.at`. Timeline T10 strips the same stamps (`saved`, `opened`, `layout.at`). See P5 |
| 9 | FOLDERS **SAVE** over the open project (real tap) | WORKS | `saved MIRCHECK ONE`, 10 010 bytes, same length as the first save |
| 10 | Save into a folder path (`FOLD/A`, `MIRCHECK/TWO`) | WORKS | Folder cards appear with counts |
| 11 | **DUPLICATE** (select, then a real tap) | WORKS | `LAW ONE 2`; payload and notebook byte-identical to the source; read-only flags dropped (screen 04) |
| 12 | **RENAME** a tile (real tap, real typing, Enter) | WORKS | `MIRCHECK ONE 2` → `MIRCHECK RENAMED` |
| 13 | **DELETE** a tile (tap arms "sure?", second tap deletes) | WORKS | Entry gone; no errors |
| 14 | Folder menu (right-click): **RENAME** folder | WORKS | `FOLD/A` → `FOLDNEW/A`; `current` and RECENT follow the new path (screen 24) |
| 15 | Folder menu: **REMOVE FOLDER** | WORKS | Arms "MOVE CONTENTS TO ROOT?", then moves `A` to ROOT; `current` follows |
| 16 | FOLDERS listing | WORKS | ROOT shows DEMOS (11) plus user folders, A–Z sort, counts in the foot (screen 07) |
| 17 | A **demo** opens from FOLDERS on a clean screen | WORKS | WATER opens with MOLECULES on and settings unchanged outside WORKSPACE |
| 18 | A demo opened over unsaved work | WORKS | "Save this first? · SAVE & OPEN · OPEN WITHOUT SAVING"; WITHOUT opens TUNNEL / BENZENE (screen 12) |
| 19 | A demo **plays** | WORKS | Space plays: t advanced 7.6 a.u., 19 frames in 2.5 s under load, no field error (screen 09) |
| 20 | **SAVE AS ZIP…** (RENDER › FILES, real taps) | WORKS | `ZIPPED.lambdawaves.zip`, 10 kB, toast "Saved … · 10 kB". It sits behind a closed disclosure; see P3 |
| 21 | **Open a ZIP** on a clean screen | WORKS | New entry `ZIPPED 2`; edit scope byte-identical; ring `open · ZIPPED 2` |
| 22 | Open a ZIP over unsaved work | WORKS | The question appears in FILES' seat; WITHOUT SAVING opens it (screen 11). See P4 |
| 23 | Settings law: an open with an existing settings blob | WORKS | Demo open and link open: `lambdawaves.q0.settings` is byte-identical outside WORKSPACE. See P6 for a fresh profile |
| 24 | **LINK**: STATE › COPY LINK (real tap) | WORKS | 268 chars, "link copied · 1 not carried" (modulation) |
| 25 | LINK opened by navigation | WORKS except B1 and B2 | Ring `[link]`, settings identical, pose identical. Floats are rounded to float32 as v1 is designed to do |
| 26 | LINK opened over unsaved work (hashchange) | WORKS | Asks "OPEN THIS LINK WITHOUT SAVING?". Cancel keeps the scene; OK opens and leaves the project clean (also cancel-then-retry). One run inside a longer walk did not open after OK; two isolated repeats did, so it is unreproduced |
| 27 | RENDER card opened from WINDOW › RENDER | WORKS | The estimate reads 1500 × 864 (the field). It repaints on `devopen` |
| 28 | RENDER **STILL · PNG FRAMES** (1 s, 24 fps), real taps | WORKS | 24 frames, 5.4 s; SAVE hands over a 3.7 MB PK zip; DISCARD RENDER clears the row |
| 29 | RENDER **STILL · MP4** | WORKS | 143 kB with an `ftyp` header; SAVE hands it over (screen 21) |
| 30 | TIMELINE · ACTIVE / SELECTION with no range | WORKS | The estimate row and the card status say the sentence ("…mark one with ACTIVE in the TIMELINE first"); nothing runs |
| 31 | Stored renders: DOWNLOAD STORED / DISCARD STORED | WORKS | Rows appear after an MP4 (screen 21); film-handover row 2 proves DISCARD STORED RENDER |
| 32 | RESUME / RECOVER a stored render, TIMELINE · ACTIVE film, PLACE ONE PERIOD | WORKS (suite) | Timeline T6 (PLACE ONE PERIOD → ACTIVE film = facade, MP4 bytes equal), T7 (STILL = record(), PNG = MP4 frames), T8 (MODULATION ON), T11a (Escape at frame 75 → RESUME = uninterrupted frames), T11b (state change → RESUME refused; DISCARD STORED removes it), T11c (CANCEL, reload → RECOVER hands over a valid MP4) |
| 33 | **EXPORT 3D** (FILE › EXPORT SHAPE / GRID; not on the RENDER card) | WORKS | export3d suite 10/10: GLB, OBJ, STL, NPZ, CUBE; a second press while one runs is refused |
| 34 | CAPTURE IMAGE → DOWNLOAD IMAGE | WORKS | film-handover rows 3 and 4 |
| 35 | Duplicate of a demo, project-file door, pages travel, invalid store read-only | WORKS | project-formats 5/5 |
| B1 | LINK carries **position space as `'r'`** | **BROKEN** | See below |
| B2 | LINK silently drops the **overlays** (KEPLER, VORTEX, PARTICLES, DIALS) | **BROKEN** (minor) | See below |
| B3 | SAVE AS ZIP… **names the zip after the tile selected in FOLDERS but packs the live project** | **BROKEN** (kit) | See below |

## BROKEN

### B1 · A share link turns position space into `'r'`, and the domain overlays stop drawing
- **Repro.** Boot `…/lab/?preset=2p%2B&sw=0&warn=0` and turn KEPLER ORBIT on (screen 18 shows how it should look). Mint a link with STATE › COPY LINK (or `__LW.link.mint()`). Open that href in a fresh load. Turn KEPLER ORBIT on again.
- **Expected:** `__LW.space === 'x'`, and the Kepler ellipse draws.
- **Actual:** `__LW.space === 'r'`. The switch reads on and `overlays.kepler` is true, but nothing is drawn (screen 17). `__LW.setSpace('x')` makes the ellipse appear (screen 18). A save after the link open writes `"space":"r"` into the project, so the fault spreads into saved files. The hashchange road does the same. No console error.
- **Cause (lab glue).** `lab/statelink.js:497` decodes `presentation.space = x.u8() ? 'p' : 'r'`. The app's position-space name is `'x'` (`lab/rack.js:118` default; `lab/new-project.lambdawaves.json` and every demo use `"x"`). `lab/shell/persist.js:296` then applies `'r'`. `lab/rack.js:482` gates the domain overlays on `app.state.space === 'x'`, so they go dark. `'r'` is the right word for the EXPORT 3D meta, but it is wrong here.
- **Fix size:** S. Decode to `'x'`, and on restore treat `'r'` as `'x'` so links already sent still heal.

### B2 · A share link drops the overlays without saying so
- **Repro.** Turn KEPLER ORBIT on, then COPY LINK. The card says "1 not carried" and names only the MODULATION rack; its note says everything else in the window is in the link. Open the link: `overlays.kepler` is `false`.
- **Expected:** the overlays travel, or they are named in "not carried". `lab/shell/links.js` states this law in its own header: SAY WHAT IS NOT CARRIED.
- **Where:** `lab/statelink.js` has no overlay section, and `encodeState`'s `notCarried` does not list `overlays`. `NOT_CARRIED_NAME` is in `lab/shell/links.js:17`. **Fix size:** S to add the name; M to carry them in a new section.

### B3 · SAVE AS ZIP… mislabels the file when a FOLDERS tile is selected (the kit's)
- **Repro.** Open your project `MINE` (hydrogen 3d). In FOLDERS, open DEMOS and tap WATER once, so it is selected but not opened. Open RENDER › FILES, focus SAVE AS ZIP… and press Enter (the keyboard / Tab road).
- **Actual:** the file handed over is `WATER.lambdawaves.zip`, and it holds MINE's live hydrogen data (`preset=3dz2`). OPEN ZIP… of that file adds a project named WATER that is not water.
- **With the mouse:** the gallery's document `pointerdown` deselects the tile first, so a pointer user does not hit this. A keyboard or assistive-technology user does.
- **Where:** `lab/mir/folders/folders.js:370` passes `entry: gallery.selected() || currentEntry()`, and `lab/mir/folders/zip.js:40` takes the **name** from that entry while the **data** comes from the live `capture()`. This is MIR's code, so the fix goes upstream; there is no λWAVES glue fault. **Fix size:** S. Name the zip after `currentEntry()`, or zip the selected entry's stored payload.

## POLISH

| # | What feels rough | Suggestion | Size |
|---|---|---|---|
| P1 | FOLDERS' toolbar puts SAVE and PROJECT side by side with the **same save glyph**, so the two differ only in their aria labels (screen 01) | Give PROJECT a "save as / new" glyph, or a one-word caption under each | S |
| P2 | The NAME field reads **UNTITLED** while a named project is open (screens 03 and 24), which suggests nothing is open | Propose the open project's name, as BASINS does for SAVE AS | S (kit `proposeName`) |
| P3 | RENDER › **FILES** is a closed `<details>` with its marker hidden and no caret, unlike VIEW DETAILS. SAVE AS ZIP… / OPEN ZIP… are invisible until a user guesses that the bare heading opens (screen 10a) | Add the caret that VIEW DETAILS wears, or open FILES by default on the card | S (kit `render.css:82-83`) |
| P4 | Opening the **same ZIP twice adds a copy each time** (`ZIPPED 2`, `ZIPPED 3`), while a `.json` import of identical content dedupes to the existing path (`projects.js` `importText`) | Dedupe identical zips the same way, or say "already in your library — open it?" | M |
| P5 | `presentation.layout.at` is a `Date.now()` stamp written into every project (`lab/shell/rack-wiring.js:162`). A no-change re-save rewrites the bytes, and exported `.json` files differ on every save | Leave `at` out of the project's layout (it serves the ☆ slots) | S |
| P6 | On a **fresh profile** the settings blob is absent until the first project open, and that open writes the whole blob: every PREFERENCE key goes from absent to its default. The values do not change, but the letter of "byte-identical outside WORKSPACE" breaks once. NEW does not do this | Write only the WORKSPACE keys on that road, or seed the blob at boot | S |
| P7 | The RENDER done row says `SAVE lambdawaves-render.mp4` / `lambdawaves-frames-render-…-001.zip`, but the file handed over is `lambdawaves-clip-2modes-1500x864-24fps-24f-t4_000au-….mp4` (renamed through `film.nameFor`) | Label the button with the name the user will receive | S |
| P8 | After an MP4 render the **same film is offered twice**: SAVE / DISCARD RENDER, and STORED RENDER · DOWNLOAD STORED MP4 · DISCARD STORED RENDER (screen 21) | Hide the stored row for the run that is still in the done row | S–M (kit panel) |
| P9 | The shipped **DEMOS folder can be renamed or removed** (it became MYDEMOS with all 11 read-only demos). RESTORE THE DEMOS then says "Every demo is here" and does not bring DEMOS back. The tiles refuse a rename ("came with the app") but the folder does not. Small, related: `projects.js:267` `remove()` reports a failure as "save failed — …" | Lock the folder that holds read-only starters, or make RESTORE re-home them. Reword the remove failure | S |

## FLAKY-UNDER-LOAD and SUITE STALE

- **menubar**: red in the batch, green when run alone (8/8). The failing row was FILE › quick SAVE: `lambdawaves.q0.session` was also written, because the session's quiet 300 ms write landed inside the measured window under load. FLAKY-UNDER-LOAD.
- **history**: red in the batch, green when run alone (45 rows). The failing row was 9b, NEW → MOLECULES ON with `filled:false, lanes:0` after a fixed 1000 ms wait for the solve. FLAKY-UNDER-LOAD.
- **lw-links**: red in the batch, red alone, and red again with 12 s waits. Rows `[water]` and `[lumo]` expect THE HEAD on the stage (`heads:1`, one fade), but `lab/windows/molecules.js:84-85` (commit 503997b, Josh's 2026-10-16 ruling: "the head is the NOTEBOOK's, never the stage's") deliberately turned `headLand` into a no-op. **SUITE STALE**, not a product break. The link road itself works: one ring row `LINK · water`, WATER picked, MOLECULES on, no tab. `tests/molecule-head.browser-test.mjs` (outside the eight) is red for the same reason. Josh should confirm whether the notebook was meant to show the head; nothing shows it now.

## Suite results (LW_PORT=8733 GD_PORT=5233)

| Suite | Result | Rows |
|---|---|---|
| project-formats | GREEN 5/5 (28 s) | invalid collection read-only · FOLDERS' door 8 MiB / other app's .mir · R-I3 pages travel · 1.4 notebook is page 0 · FOLDERS is painted glass |
| history | batch RED (row 9b) · alone GREEN 45 PASS (163 s) | boot bottom · HISTORY card 26 rows · LOOK/stage colour/overlay/preset/element/A-B/palette/modulation edits each one row, byte-identical undo/redo · no row from camera, window drag, typing… · depth 60 · cost · origins (link, open · WAVE DANCER, new project) · MOLECULES undo · old H₂⁺ / HELIUM / QCD / H₂ / ELECTROSTATICS files |
| new-project | GREEN 8/8 (34 s) | shipped default · demo asks before discarding · NEW restores every PROJECT key · one clock · notebook law · failed NEW changes nothing · held stage · tablet clamp |
| menubar | batch RED (FILE quick SAVE) · alone GREEN 8/8 (18 s) | key hints · RESEED · RESET KEYS · CLEAR · FILE SAVE/LOAD/COPY JSON/COPY LINK · 34 row groups · EXPORT SHAPE/GRID rows · throwing row closes the bar |
| film-handover | GREEN 4/4 (68 s) | real RENDER + SAVE → 1 share · no discard timer, DISCARD RENDER / DISCARD STORED · scripted picture → download · CAPTURE + DOWNLOAD IMAGE → share |
| export3d | GREEN 10/10 (11 s) | GLB · OBJ · STL · NPZ · CUBE · no frame stall · second press refused · momentum grid · FIELD down disables |
| lw-links | RED (×3), SUITE STALE | `[density]` PASS; `[water]` fails on heads/fades (see above); `[lumo]`, `lw:s`, https never reached |
| molecule-demos | GREEN 5/5 (13 s) | WATER · BENZENE · N₂ · H₂ σu · HELIUM: field owner, HOMO/LUMO, notebook, settings byte-identical outside WORKSPACE |
| timeline (extra, holds the render proofs) | GREEN 14/14 | T1 WINDOW › TIMELINE · T2 one play edge · T3 automation clip · T4 stage mask · T5 focus law · T9 timeline undo · T10 save/open/re-save byte-identical with an arrangement · T6 ONE PERIOD film · T7 STILL = record(), PNG = MP4 · T8 MODULATION ON · T11a RESUME · T11b RESUME refused + DISCARD STORED · T11c RECOVER after reload |

## Screenshots (this folder)

01-folders-open · 03-reopened-mircheck-one · 04-duplicated · 07-folders-demos · 09-demo-playing · 10a-render-files-closed (P3: FILES with no caret) · 11-open-zip-asks · 12-demo-asks-save-first · 17-link-kepler-switched-on (B1: switch on, nothing drawn) · 18-link-after-space-x (B1: the same page after `setSpace('x')`) · 21-render-mp4-done (P7, P8) · 23-new-asks-save-first · 24-folder-menu (P2: UNTITLED)

## Not exercised headless, and why

- **The native file pickers** (OPEN ZIP…, FILE › IMPORT, OPEN FILE): a detached `<input type=file>` picker cannot be driven. The ZIP was opened through `folders.openZip(File)`, the same function the picker calls. A real drag-and-drop of a file is likewise not driven here; project-formats covers the drop door with a synthetic event.
- **Touch long-press** on tiles and folders: right-click, the same menu, was used instead. **The iPad share sheet** and **`navigator.share`**: Linux Firefox has none; film-handover stubs them.
- **The real clipboard paste of a link** into another browser or app, and URL truncation in transit.
- **A render surviving a page reload** (RECOVER after reload) and a **hidden-tab** render were not hand-walked. Timeline T11 covers RECOVER after a reload.
- 4K / 1440p renders, wide-gamut films, and the real-GPU determinism across devices: too slow on a loaded GPU and out of scope.
- The `lambdawaves.q0.session` RESUME at a human start: a driver start skips the opener. `tests/start.browser-test.mjs` owns it, and it was not run.

## Commands used

```
python3 tools/gate/server.py <worktree> 8733            # pid kept, killed at the end
LW_PORT=8733 GD_PORT=5233 node tests/<suite>.browser-test.mjs     # the eight, then the three reds alone, then timeline
LW_PORT=8733 GD_PORT=5233 node <scratch>/walk-{a,b,c,d,e}.mjs    # hands-on walks (gatekit open/tap/press/ev + drv actions)
LW_PORT=8733 GD_PORT=5233 node <scratch>/walk-link.mjs           # B1/B2 repro, screens 17/18
LW_PORT=8733 GD_PORT=5233 node <scratch>/probe.mjs <scratch>/p-{files,canvas,zipname,water,head,hash,hash2}.js
```
Scratch: `/home/joshua-hosain/.config/claude-backup/jobs/8497d75b/tmp/mirC/` (scripts, logs, `walk-*.json` raw results).
