# BASINS ADOPTS MIR 1.5.6-alpha.8 — 2026-10-28 (Opus builder, it022-BASINS)

BASE: BASINS `mir-1.5-adopt` @ `c11ab00` (MIR 1.5.0-alpha.24, kit 1b7ae99b9905). KIT: `kit-1.5.5` @ `d5d8149` (MIR 1.5.6-alpha.8).
Worked on clones only (`.tmp/basins`, `.tmp/basins-base`, `.tmp/kit` in this worktree); nothing pushed, no tag, the real BASINS, MIR and DATABASE checkouts untouched.

## The clone's commits (branch `mir-1.5.6-adopt`)
- `8f3f3bb` B1 ADOPT: MIR 1.5.6-alpha.8 (kit d5d81493c0c3) into app/lab/mir
- `29b307f` B2 THE BREAKING LIST: the + is BASINS' own button and opens THE FINDER
- `f24160d` B3 THE LOOK: link THE FINDER's sheet (shell/window-picker.css)

## What adopt changed (`node .tmp/kit/tools/adopt.mjs .tmp/basins/app`)
- 3 added (`shell/midi.js`, `shell/window-picker.css`, `shell/window-picker.js`), 57 updated, 0 removed, 205 unchanged; `lab/fonts` unchanged.
- `app/MIR-MANIFEST.json`: version 1.5.6-alpha.8, line 1.5, commit d5d81493c0c3. `adopt.mjs … --check`: "in step with MIR 1.5.6-alpha.8".
- No private patch: before the adopt all 262 files under `app/lab/{mir,fonts}` matched the alpha.24 manifest's hashes, no extras.

## The BREAKING fixes (BASINS' own files; app/lab/mir untouched by hand)
- The + list is gone, and the kit no longer adopts `#rackAdd`: BASINS' + would have been a dead "+".
  - `app/index.html:99` `#rackAdd` → `#finderOpen` (the kit fixture's name); `#rackAddList` removed.
  - `app/shell.js:39,296-305` `createWindowPicker({ rack: layout })` as `layout.finder` / `shell.finder`; the + draws the kit's `plus`
    glyph (`setGlyph`) and toggles the FINDER (a press on + while it shows closes it; the FINDER's outside-press close runs first).
  - `app/lab.css:23,26,30-33,204,206,303,412,467-468` and `app/skin.css:179,185-186`: every `#rackAdd`/`#rackAddList` rule moved to
    `#finderOpen` or dropped (the FINDER is the kit's own surface); seat (top 44), hide/peek, ui-hidden and the phone thumb zone kept.
  - `tools/rig/verify-departures.js:38`, `tools/rig/material-audit.js:97`: `addMenu` → `layout.finder`. Nothing in BASINS reads the shim
    (no "rack.addMenu is gone" warning in any run), so it can leave at the next line.
- Not used by BASINS (grep over app/ minus lab/mir, and tools/): `GUI_TABS`, `TAB_OF`, `mir.gui.tab`, `tab`/`turn()`, `SKINS`, the
  RESET LOOK locale key, `PILL.track`, `.rack-pill::before`, `setOrient`/`data-orient`. `skin.gui.open('options'|'about')` (shell.js:263)
  still opens OPTIONS / MIR ABOUT. `anim.js` `rackAdd`/`rackRemove` are BASINS' own modulation verbs, unrelated.

## Visible changes (before/after in `BASINS-shots/`: `pair-<look>-<view>.jpg`, left c11ab00, right the adopt; looks = first-run, FROST light, MORPH dark)
- FIXED: the FINDER drew unstyled (BASINS links kit sheets one by one, not `mir.css`) → `app/index.html:39` links `shell/window-picker.css`.
- KEPT: the + opens THE FINDER (centred search over all 7 windows, SHIFT-queue, ☆) instead of a list of the 3 closed ones by the rack
  (`pair-*-plus`, `after-first-finder-queue`). Played with real clicks: open, + closes, pick FOLDERS, SHIFT-queue RENDER+TRANSPORT, type + Enter.
- KEPT: MIR OPTIONS has no tabs: one page (LOOK + LIGHT + WINDOWS + SAMPLING), shorter; SHINE SOFT 6 (`pair-*-options`).
- KEPT: tight relief — MORPH loses its white blobs around round buttons; SOLID/MORPH edges are hairlines (`c-morph-rack`, `pair-morph-dark-*`).
- KEPT: FROST is TEXT AUTO — in light the labels and the menus are black (white on the light pane was near-illegible: `pair-frost-light-menu`,
  `c-frost-rack`); in the real GPU app AUTO hands the ink to BASINS' sampler (adaptive-ink.js) per label. The stub boot cannot sample, so the shots show the theme ink.
- KEPT: the modulation window's work bars wear the transport's seats (orange tempo pill, PRESET NAME in a well), and its workspace switch
  draws the `lanes` glyph, no longer the palette diamond (`c-first-modbar`); the CAMERA card shows the kit's `cameraOrbit` glyph.
- Checked, nothing to fix: no `.k-lbl` (65) or other kit label ellipsises with every window open; no BASINS `trig` passes a glyph (save-window.js'
  six trigs are text); BASINS has no window drawings, so the `createWindow`/`device({ glyph })` door is not taken.

## Checks
- 23 `tools/test-*.mjs|py`: 22 green (one a SKIP). `test-notebook-math.mjs` fails identically at c11ab00 (node 22 loading the kit's vendored
  `katex.min.js` as ESM: "Cannot set properties of undefined (setting 'katex')") — pre-existing, not the adopt. `test-rack-from-dump` SKIPs (no dumps).
- Kit `tools/check-app.mjs`: "window.__MIR.describe never appeared" on BASINS before AND after — BASINS never calls `createDescribe`/`createApp`;
  no console error in its window. The browser checks were run instead over BASINS' own GPU-free boot stub (`tools/rig/boot-stub.mjs`):
  boot, the five views × three looks, the FINDER play, every window open — no console error or warning in any after run.
- Real boot (dev-server.py, headless Chromium with WebGPU): boots, windows registered; the headless GPU device is lost and the FP probe
  fails — the same at c11ab00, so it is the headless adapter, not the adopt. The `tools/rig/*` scripts need Sol's geckodriver/Playwright fixture and were not run.

## Bundle and fetch (Josh's)
- `.tmp/basins-1.5.6-adopt.bundle` (163 MB, full history, verified) and `.tmp/basins-1.5.6-adopt.thin.bundle` (87 KB, needs c11ab00, verified), in this worktree.
- `git -C "/home/joshua-hosain/Documents/MANDELBROT APP/project" fetch <bundle> mir-1.5.6-adopt:mir-1.5.6-adopt`
- Merging it into `mir-1.5-adopt` or his other branches is Josh's call.

## FOR 1.5.6 (BASINS' asks; not built)
1. The modulation window's workspace switch glyph as a port option (e.g. `installModulation` port `switchGlyph`), if BASINS wants its palette diamond back.
2. `adopt.mjs` (or `--check`) could name a kit sheet that is new since the app's manifest, for apps that link sheets one by one (BASINS missed window-picker.css silently).
3. `check-app.mjs` assumes `createDescribe`; a `--ready '<expr>'` fallback (BASINS: `window.__BASINS`) would let it check BASINS.

## Open questions
- Keep `lanes` on the modulation switch, or ask for the diamond (FOR 1.5.6 #1)?
- FROST light black ink over a dark fractal: in the GPU app the sampler decides per label — worth one look on the real screen.
- `test-notebook-math.mjs`' katex import under node 22 predates this work; whose fix (BASINS' test or the kit's vendor import)?
