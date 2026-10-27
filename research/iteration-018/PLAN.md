# ITERATION 018 — THE WIDE LIST (Claude Sos, integrator on `yan-c`; Josh 2026-10-27 ≈ 01:30)

Josh: "Alright, I have a list that's not that huge but is goes to a WIDE variety of corners of the app so be sure we aren't skimming past these and be thorough. ULTRATHINK"

## JOSH'S PROMPT (verbatim)

### MAIN MENU/GENERAL
- Quick fixes: During mouse over, page selection or anything, the animation out and in seems to be overlapping. It would flicker as if it does a fake out but then return
- Let the size of the isomer little dropdown thingy be space efficient and only have a window as big as however many isomers there are. Currently it makes a massive window even if there's only 3 isomers. Feel free to keep the same thumbnail size as the main isomer.
- Currently missing a lot of thumbnails. Patch them?
- All expanders on all windows shouldn't have a button like an outset white/black button but should rather just be the icon instead.
- For the pills that appears when scrolling on rack (I'm calling these "Scroll Pills"), let them prefer white text on light mode or prefer dark text on dark mode EXCEPT when the color is too bright/dark.
### WAVE
- If molecules is off, it should hide anything related to molecules like balls, sticks, ESP and it's controls so that the window is much smaller for hydrogen.
- For ESP, 'live - slow' button could fit to the right of the 'range' and 'probe' to be only one row.
### CAMERA
- Move the 'auto-rotate' toggle to the same row as 'flip'
- There also seems to be a bugged second 'flip' toggle underneath FOV knob.
- Auto-Rotate should simply not be an auto-rotate but rather an easy way to take the 'friction' knob and pretend the knob is set to 0! Clicking auto-rotate does not change the current 'friction' knob setting.
### ESP GENERAL
- Currently, the charge color strip on the stage does not change accounting all coloring. It should change while summing all the hue changes from wave's hue knob, palette's hue *rotate* knob and invert.
### PALETTE TRICK
- If a user selects a palette or creates their own and they select the invert option... IF they choose to save the palette as a preset, it will instead save the inverted colors. If they load the new palette, it should show the new inverted colors when the invert is off. It's up to the user to name it whatever they want to as usual.
### MOLECULE WINDOW
- I need an audit on 'states' because states seems useless compared to orbital. Find any way to make it useful without bloating code.
- Remove text that says 'BASIS', 'VIEW', 'METHOD' (keep orbital text)
### CURVES
- Make the grid much more faint. Allow users to save their own curves and have the drop down also load user defaults. (Other windows does this, this is just another in the line of updates). You could easily fit a save icon to the right of the presets.
- Remove text that says 'channel' and the text that says 'preset'
### NEW USER DEFAULTS
- Informational's pad at zero
- Left rack is populated with (from top to bottom): Informational, Spectrum (for atoms/hydrogen) and 'Molecules' for molecules. Transport window when docked goes to the top most side of the left rack all the time.
- Right rack, should be: 'settings', palette, wave, camera, clip. These 'default' windows should be the very basic controls for appearances for the app. Everything else are functional extra windows.
### PROJECTS/NEW PROJECTS
- This needs to be worked on as we've been ignoring it.
- MODULATION: New projects must reset to a default LFO routed to macro 1, and an audio device.
- Timeline should be empty
- Rate knob speed resets. Informational do not change as those are user preferences.
- Picker or loading molecules from library is not the same as projects. Loading a molecule is technically not loading a project so timeline, modulations, macros should be preserved.
### SPECTRUM
- Spectrum window should merge with the 'state' window and add it's features directly below the 140 table and above the presets. (from the original state window which we are removing) Remove the text that says 'A/B'. Add a clear icon so that it clears anything stored in A or B.
- The spectrum thing with the reader at the very top seems to have some 'ticks' that run left ot right like a horizontal ruler, can you delete those to make it cleaner like the molecule window's thingy?
### INFORMATIONAL
- Include ESP's bar with a padding setting and a toggle that just cycles between right (where it is now), left, top, and bottom. Stage text and formula is on top of the bar and can be overlapping if the user chooses both of them to be in the same spot. Stage text takes priority.
- Since we have isomers, let a secondary subtitle text be optional for the name. Because I mostly prefer just the name. All subtitle text should be a much smaller text as if the name is a heading type and the subtitle should be smaller like a 'body' text.
### CSB
- Time to flesh out the CSB. I will speak about the main center bar but try your best to adapt the rack version. Gemini might need to make more icons for ones we don't have
- Add informational icon which essentially toggles all informational's on and off (could be a 'i' with a circle around it type of icon)
- Other buttons to add is a folder button, light and dark toggle (sun and moon icon switch between)
- Make the settings icon solid with a punched out circle in the center instead of it being lineart.
- Favorites should be a solid heart icon.
- Let the play button, similar to the chips, float outside of the CSB to the left so that there is more room for bar. Move the rate knob and tempo column to the far left. 'MOD' toggle can be near the rate and tempo thingy. Let tempo be typable similar to the modulation window's tempo adjuster and have a dedicated icon to expand the CSB instead.
- Design priority: (I'll give you free reign on how to do the layout for the rest of the icons), Play/Pause floats to the left with the big button that it is rn. Preset picker is dead center and on the top row. The library buttons plus folders should be directly underneath the preset picker. Remove the t = n thing from the CSB and let it only show for timeline window when expanded. All icons should be aligned and normalized so they're even.
- In the search, don't show a colored outline for the thumbnails, just either highlight/outset/inset
### FINDER for MIR
- The new window finder is MUCH better than the old existing one and completly makes it outdated. Call this new feature 'finder' instead of 'add window'. 'Add window' has a fun feature where you could multi-add by holding shift. Let the new window adopt it and whatever other features existed for the 'add window' onto 'Finder'.
- Replace that function for the CSB and remove the old 'add window' with 'finder' which should be a window icon with a plus sign type of icon.
- Remove text that says 'WINDOWS'. Don't have a colored outline for the 'search the windows' pill (text should say 'search windows').
- Show all hidden windows (if greyed out; let it have text 'HYDROGEN ONLY' or 'MOLECULES ONLY')
- If a user picks a window that's already open, let it *scroll* to the window on the rack, never rearranging the windows.
- New windows as usual go to the top; new windows will scroll all the way up.
### ABOUT WINDOW
- Remove the MIR switch from the about window since we already have an about window in MIR options
### MIR NODES PREP
- We will experiment and let 'CURVES' be part of  a new window of the MIR class like modulation, folder, timeline, about window, MIR options, Keyboard, and (new) Finder (Also a rack window too) called 'NODES'. Similar to how Houdini "Copernicus" works and the philosophy of Houdini but our own flavor with more functionality.
### MIR OPTIONS
- Let's rework the layout and try to not use tabs like 'Look, Light, and Windows' and instead try to remove as much empty space and pack everything into that window. Feel free to incease the dimensions of that screen. if need be...
- "Lambdawaves" (with the lowercase lambda not the world 'lambda' I just can't type out the lambda symbol) should be the name of the original 'skin' and should be the default.

## THE MAP
`research/iteration-018/MAP.md` — every item at file:line (HEAD 9000ebb). Read it before your chain. The kit rule: the trickle-down rule stands.

## THE LAWS OF 018 (new, binding for every chain)
- **A window shows only what applies.** Under hydrogen / an atom, WAVE's molecule rows are HIDDEN (not greyed); the finder lists every mode-hidden window greyed with its reason (HYDROGEN ONLY / MOLECULES ONLY); LEGACY windows stay unlisted (CLAUDE.md).
- **A pick is not a project.** A Picker, library, volume or history molecule load never touches the modulation model, the timeline or the macros; only a project open, NEW, RESUME and undo do.
- **One label, no heading.** Seg headings BASIS · VIEW · METHOD (MOLECULES), CHANNEL · PRESET (CURVES), A / B (SPECTRUM), WINDOWS (finder) go to `aria:`; the control explains itself.
- **The stage text wins.** The ESP bar yields to the stage formula/name block; both may be asked for the same side.

## CHAINS (one Opus builder at a time, each based on the merged tree after the previous chain; BASE sha in the CLOSED table)
### A — THE MENU AND THE CHROME (small, many files)
A1 Picker flicker: every entrance keyframe list gets an explicit from (`offset: 0`) — MAP 1a's sites; fix the `picker-fx.js:22` comment. Check: hover, page turn, section show, isomer deck, folders/volume views, first-run entrance — no fade-out-then-snap.
A2 Isomer pane content-sized and centred over the deck (MAP 1b); tiles the same size as the deck's.
A3 Pictures: `lab/volumes.js` falls back to `t/<id>.webp` when the index row has no `thumb` (the file exists for all 1,851 vol-1 rows; the night run's final pack names them later), onerror → the formula placeholder; the CSB search tile and the MOLECULES chooser get the same placeholder instead of a removed `<img>` (MAP 1c). Run `node tools/menu-check.mjs` (read-only) before and after.
A4 Expanders: one `.lw-fold` rule in `lab/skin.css` — the bare chevron, no relief, no background, no hover lift (MAP 1d); the hand-built ones (`chemview.js:533`, `native-ui.js:39`) follow by class.
A5 Scroll pill ink (kit, `rack-scrollbar.js` `inkOn` + `rack.css`): light theme prefers WHITE text, dark theme prefers DARK text; flip only past the 3:1 floor (white needs L ≤ 0.3, black needs L ≥ 0.1). Trickle-down: alpha.29, FOR-MIR line, re-hash.
A6 ABOUT: remove the λWAVES | MIR seg and the MIR page from the app's ABOUT (`notebook.js:283–293`, `:327–333`, `.ab-mir`); ⓘ toggles λWAVES' ABOUT only. MIR's ABOUT lives in MIR OPTIONS.
A7 Labels → `aria:`: MOLECULES BASIS · METHOD · VIEW (`chemview.js:351`, `:389`, `:408`); CURVES CHANNEL · PRESET (remove the label nodes after build, app-side).
A8 CURVES grid much fainter: `.mir-curves { --curves-grid: … }` app override (≈ 12 % of ink-faint).
A9 CSB search tiles: no accent outline (`lab/lab.css:397`); `.on` = inset, hover = raised (relief only).
Tests: picker/library/start suites; `tests/first-run.test.mjs`; mir-manifest; `node tools/rack-deps.mjs --classes --no-write`.

### B — WAVE · CAMERA · THE COLOURS (`lab/windows/material.js`, `stage-words.js`, `informational.js`, `camera-law.js`)
B1 WAVE under hydrogen/atoms HIDES BALLS · STICKS · ESP and every molecule-only row (SIZE, RADIUS, MAP ONLY, PROBE, RANGE, ISO|SAS|SES, LIVE·SLOW; `hidden`, seats collapse) — `modeSync`; the 016 "never hidden" sentence in CLAUDE.md is amended by the integrator. Under a molecule nothing changes from 017.
B2 ESP rows: PROBE · RANGE · LIVE·SLOW on one row; SIZE · RADIUS · MAP ONLY · ISO|SAS|SES on the other (or whatever fits the rack width in one look — show a picture).
B3 CAMERA: one FLIP only — drop the app's `ui.camFlipSw` and keep the kit's FLIP (the port answers `flip`), move it and AUTO-ROTATE onto the verbs row: PAN HOME · HOME · LOCK · FLIP · AUTO-ROTATE. Fix the stale comment `camera-law.js:214`.
B4 AUTO-ROTATE = friction read as 0 while on; the FRICTION knob's value is untouched; no ambient spin (`ambient` → 0; `mu = autoRotate ? 0 : friction`). The SPIN knob is orphaned → the port stops answering `spin` so the panel draws none (call 2). Update every reader (MAP 3c: persist, verbs, render-exact — a film render with AUTO-ROTATE on now integrates the fling with μ = 0). The saved key `autoRotate` keeps its name.
B5 ESP strip = the shader's colours: build the bar's gradient by sampling the same maths as `espColour` — palette ON: LUT + WAVE HUE as the LUT offset (`field.js:777`), palette OFF: `ESP_RAMP` through `hueRot` (`:682–686`) — then INVERT (`1 - c`); no CSS filter. PALETTE ROTATE follows because the stops themselves rotate. Re-paint on hue, invert, palette, rotate.
B6 PALETTE save with INVERT on bakes the inverted stops (`1 - rgb`) — the saved preset shows those colours with INVERT off (call 4).
B7 The ESP bar moves to INFORMATIONAL's rows: BAR on/off, SIDE cycle (right → left → top → bottom; a seg or one press-to-cycle button), PAD knob (own pad, default = the info pad); painting stays WAVE's (`styleSync`), seat and orientation read the info record; top/bottom = horizontal gradient. The stage formula/name block takes priority: when both land on the same side the bar steps outside the block's rect (MAP 11a).
B8 INFORMATIONAL pad default 0 (three places, MAP 8a; stored records keep theirs).
B9 Subtitle: NAME is the heading; a new optional SUBTITLE row (default off) under it in body size (`p + p` smaller than today's 0.65em? — pick the kit's body size, the name one step above); the subtitle text = the molecule's secondary name (the isomer descriptor / systematic name the record carries — read `lab/molecules.js` rows and the volume index for the field; say which).
Tests: `tests/official-defaults-palette.browser-test.mjs`, window-switching, take-in-bugs, camera/film suites that read autoRotate, new-project `--check`.

### C — SPECTRUM · THE REGISTER · THE RACK DEFAULTS
C1 STATE merges into SPECTRUM: STORE A · A · STORE B · B, TRANSITION, RABI Ω, the readout and ONE CLEAR icon (trash glyph; clears A and B) seated between the 140 table and the presets row (`lab/spectrum.js:124–126`); the 'A / B' texts go to `aria:`; the window `state` is retired (`lab/windows/state.js` deleted; `rack.js:892` and `first-run.js:23` drop it; a saved layout naming `state` is ignored, say how). The status sink `wState.setStatus` is re-homed to SPECTRUM's window (same hook shape) — every caller in MAP 10a. HINGE: `windows/spectrum.js` is AT 25 — put the A/B block in its own module (`lab/windows/transition.js`, mounted by spectrum.js with the element handed over) and prove `node tools/rack-deps.mjs --classes --no-write` green.
C2 The ladder reader draws only lit levels and no E = 0 dash (MAP 10b): confirm the "ruler" with a before picture, then paint like the ORBITAL ladder (dimmed off-levels are NOT drawn as full-width lines).
C3 STATES audit (MAP 6a): open MOLECULES with H₂O under MIX, switch ORBITAL → STATES, and write down in `C-BUILD.md` what a user sees and why it reads as useless (empty register? nothing moves? no readout?). Then the cheapest change that makes it useful without new code paths — candidates: STATES auto-populates S₀ + the lowest bright singlet at equal weight on first show (a beating density at once), its readout shows the transition's ΔE and λ, the DRIVE's ω defaults to that gap (one press = Rabi). Propose, build the smallest, leave the rest for call 5.
C4 Defaults: right rack `['settings','palette','observer','camera','clip']`; left stays `['informational','spectrum','chem']`; `FOLD_ALL` without `state`; the docked transport always seats at the TOP of the LEFT rack (`dockSide = 'L'`, index 0 on every dock, record or not — MAP 8b); re-aim `tests/first-run.test.mjs`; `node tools/new-project.mjs` re-written if the WORKSPACE changes (`--check` green).
Tests: spectrum/transition suites, history, links, keys, first-run, new-project, rack-deps.

### D — PROJECTS · CURVES PRESETS · NODES
D1 PROJECTS, verified in the browser not by reading: route an LFO, add a timeline clip, change RATE, pick a molecule from the Picker, a volume, HISTORY and the 140 table → modulation, timeline, macros all preserved (the law); then NEW → MODULATION is exactly one LFO ROUTED TO MACRO 1 (a route s1 → m1, visible as a chip) + one AUDIO device, the TIMELINE empty, RATE 4, INFORMATIONAL untouched. Fix what fails (`tools/new-project.mjs` writes the route; `node tools/new-project.mjs --check` green; `tests/new-project.*`). Also the FOLDERS NEW and the opener's NEW take the same road.
D2 CURVES user presets: `createUserPresets('lambdawaves.q0.curvePresets')` (FAMILIES: PREFERENCE), a `sp-presave` save glyph right of the PRESET stepper (the PALETTE pattern `material.js:240–250`), a USER section in the stepper that loads them, × removal; the kit's `control({ options })` fed like SPECTRUM's `setItems`.
D3 NODES, the experiment (call 1): a MIR-class floating window `createWindow({ id:'nodes', title:'NODES' })` that is also a rack card (the FOLDERS precedent `rack.js:857–862`), app module `lab/nodes.js` + `lab/nodes.css`, ≤ 350 lines together. v0: a node graph — a pannable canvas (drag the ground), draggable node cards with a title bar and in/out ports, wires on one SVG layer; three nodes: STAGE IN (source) → CURVES (hosts `createCurvesPanel` unchanged, the same PREFERENCE store) → STAGE OUT (sink); a + menu with the one node type for now; positions saved in a PREFERENCE record `lambdawaves.q0.nodes`. The CURVES rack window is retired: saved layouts naming `curves` open `nodes` (one alias line). Copernicus is the compass (a graph of operators over the image), λWAVES' own flavour (MIR skin, words through `label()`). Show two pictures (floating, docked).
Tests: new-project.*, curves.browser-test (re-aimed to NODES), history, mir-manifest if the kit moved.

### E — THE CSB AND THE FINDER
E1 Icons (app SVGs in `lab/img/icons/`, masks like `modulation.svg`; Gemini may redraw later): heart-solid, sun, moon, cog-solid (punched centre, even-odd), window-plus, info-circle (or the kit's `info`).
E2 CSB layout (the app passes its own layout array to the kit's control surface): PLAY floats OUTSIDE the bar to the left, the big round button, like the chips; the RATE knob + TEMPO column at the far left of the bar with MOD beside them; TEMPO typable on a click (the modulation window's tempo adjuster pattern) and the expander opened by its own EXPAND icon (kit `expand`) — no longer by the tempo pill; top row centre = the PRESET PICKER (`.mol-pick`) dead centre; under it the library buttons (LIBRARY · MOLECULAR · HYDROGEN) + FOLDERS; the rest (search, finder, rack toggle, favourites, settings, informational, theme, timeline, modulation, dock, rewind) laid out by the builder, every icon in the same box and optical weight; `t = n` leaves the CSB (and the rack CSB) and shows in the TIMELINE window only (`keys.js:171–174`).
E3 New buttons: INFORMATIONAL (toggles every informational on/off, remembering the previous set), FOLDERS, THEME (sun ↔ moon via `app.hooks.setTheme`), SETTINGS solid, FAVOURITES solid heart (on = filled accent).
E4 Rack CSB (the docked card and FREE window) adapted to the same order at rack width.
E5 FINDER (kit `window-picker.js/.css`, app `notebook.js`, `rack-wiring.js`, kit `rack.js`): renamed FINDER everywhere a word shows (menu row, key action, hint); no 'WINDOWS' heading; placeholder 'search windows', no accent focus outline; every mode-hidden window listed greyed with HYDROGEN ONLY / MOLECULES ONLY (legacy stays out); SHIFT-click queues with number badges and opens in pick order on Shift keyup (the old list's feature, MAP 13); the ☆ star of the latest favourite layout per row; picking an OPEN window SCROLLS the rack to it (new kit `rk.reveal(id)`: scrollIntoView + a brief highlight, no reorder) — `open:` no longer calls `raise`; new windows at the top and the rack scrolled to the top. The old `#rackAdd` list is removed (kit `rack.js:900–967`, `:386`) and `rk.addMenu` with it; re-aim `tests/molecular-names`, `curves`, `emission` to the finder's API (`finder.open/close/shown`). The CSB's `app:add` becomes `app:finder` with the window-plus icon. Trickle-down lines for every kit change.
Tests: transport/csb suites, keyboard-window, molecular-names, curves, emission, window-switching, mir-manifest, rack-deps.

### F — MIR OPTIONS (kit `gui.js`, `gui.css`, `themes.js`; app `look.js`, `rack.js`)
F1 No tabs: every group on one packed grid (3–4 columns, the groups ordered theme · accent · material · text · controls · quality · motion · menus · light · windows · sampling), the window grown to fit (≈ 1180 × 660, `fit` kept for small screens — a phone/tablet may still page). Show before/after.
F2 The SKIN stepper's first entry is **λWAVES** = the app's first-run look (`LOOK_DEFAULTS`, rack.js:108) and the default; FROST · MORPH · … follow; CUSTOM only when nothing matches. The list is the app's (`look.js:71` passes `[λWAVES, ...THEMES]`), the kit's stepper reads the prefs' list, not the const. First run reads λWAVES (prove with a picture).
Tests: look/gui suites, official-defaults-palette, first-run, mir-manifest.

## CALLS FOR JOSH (defaults stand until he says otherwise; builders build the default)
1. NODES is a new window id `nodes` (saved key `lambdawaves.q0.nodes`); the CURVES rack window retires behind an alias. Default: yes.
2. CAMERA SPIN knob is orphaned by the new AUTO-ROTATE and removed. Default: remove.
3. A hydrogen tile pick keeps setting RATE 4 and the time window (the state's own clock); modulation/timeline/macros are never touched by any pick. Default: yes.
4. PALETTE save with INVERT on bakes the inverted stops and leaves the INVERT switch where it is. Default: yes.
5. STATES: chain C's audit proposes; the smallest useful change is built, the rest waits for you.
6. Icons: Sos's builders draw plain SVGs now; Gemini may redraw. Default: yes.
7. Scroll pill ink flips past a 3:1 contrast floor. Default: yes.
8. The 1,851 vol-1 pictures: app fallback now, the night run's final pack names them. Default: yes.
9. MIR OPTIONS grows to ≈ 1180 × 660. Default: yes.
10. `t = n` leaves the CSB entirely (rack CSB too) and lives in TIMELINE. Default: yes.
11. The CSB THEME button toggles light ↔ dark only (material untouched). Default: yes.

## MERGE ORDER
A → B → C → D → E → F, each builder based on the merged tree (BASE sha below). Recipe: `git merge --no-ff --no-commit it018-<chain>` → `git checkout --ours lab/sw.js` → `node tests/pwa.test.mjs --write` → `node tools/rack-deps.mjs --classes --no-write` → `node tools/new-project.mjs --check` → focused suites → commit → CLOSED row → handoff STATE NOW line.

## CLOSED
| chain | BASE | commit | note |
|---|---|---|---|
| A | e7aa247 | | |
