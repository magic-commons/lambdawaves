# NEBULA-REDUX ADOPTS MIR 1.5.6-alpha.17 — 2026-10-29 (Opus builder, it027-S1)

BASE: NEBULA `nebula-1.5` @ `737a8df` (0.3.0alpha1, MIR 1.5.0-alpha.24, kit `1b7ae99b9905`). KIT: `kit-1.5.5` @ `c13df7d` (MIR 1.5.6-alpha.17, `mir/version.js`).
Clones only (`.tmp/kit`, `.tmp/app` in this worktree); nothing pushed; ~/Documents/NEBULA-REDUX, MIR and DATABASE untouched. Precedent: iteration-022/BASINS-ADOPT.md.

## The clone's commits (branch `mir-1.5.6-adopt`, on 737a8df)
- `b54a04e` A1 ADOPT: MIR 1.5.6-alpha.17 (kit c13df7dc4c7b) into lab/mir (+ BUILD_LINE and ABOUT's credit name the kit)
- `40e653b` A2 DOCS: CLAUDE.md:31,70 and README.md:17 name the adopted kit
- No "callers fixed" commit: there was no caller to fix (below). No test re-aimed: none read a moved string.

## What adopt changed (`node .tmp/kit/tools/adopt.mjs .tmp/app`; same line 1.5, no `--line` needed)
- 4 added (`render/audio-mix.js`, `shell/midi.js`, `shell/window-picker.{js,css}`), 69 updated, 0 removed, 193 unchanged; `lab/fonts` unchanged.
- `MIR-MANIFEST.json`: version 1.5.6-alpha.17, line 1.5, commit c13df7dc4c7b. `--check`: "in step with MIR 1.5.6-alpha.17".
- No private patch: before the adopt all 262 manifest files matched the alpha.24 hashes (sha256[:16]), 0 differ.

## Callers (the 1.5.5 BREAKING list and the map's re-check list, grep over lab/ minus lab/mir, tests/, tools/)
- 0 live references to `#rackAdd` `#rackAddList` `addMenu` `el.add/addList` `.rack-add-none` `GUI_TABS` `TAB_OF` `mir.gui.tab`
  `tab/turn()` `SKINS` the RESET LOOK key `PILL.track` `.rack-pill::before` `setOrient`/`data-orient`. `tests/provenance.test.mjs:52`
  asserts `id="rackAdd"` is NOT in index.html — still true.
- Why no + was lost: `createApp` builds the rack with `chrome: false` beside the bar (`mir/app.js:162`, unchanged since alpha.24), so
  NEBULA 1.5 never had the + list; closed windows open from WINDOW (`rack.windowMenu`, app.js:324). No FINDER was needed.
- Re-checked, unchanged: `main.js:460` `app.gui.open('options')` (gui.js:684 — any name but 'about' opens OPTIONS); `main.js:26` LOOK keys
  `theme card frost disconnected blur vivid accentA accentB help badges` all in the 1.5.6 schema (only `rackPill` added);
  `import-0.2.js:20 mapLook` writes the same names; `app.rack.el.racks` (rack.js:1156), `app.gui.moving` (gui.js:699), `gui.prefs.get/set/subscribe`.
- Every kit export NEBULA imports (main.js:5-17, import-0.2.js:7-8, modulation.js:6, three tests) still exists; app.js unchanged.
- Strings moved: `lab/main.js:21` BUILD_LINE `MIR 1.5.0-alpha.24 · 2026-10-25` → `MIR 1.5.6-alpha.17 · 2026-10-29` (app version 0.3.0alpha1 kept;
  provenance.test.mjs holds BUILD_LINE's MIR to the manifest); `lab/main.js:499` ABOUT credit → 1.5.6-alpha.17.

## Tests (the clone, after A1)
- `npm test`: 68/68 (also 68/68 at 737a8df).
- Browser suites (Chromium/CDP, their own static server on 9691, ANGLE vulkan; GPU at 9 %): shell 18/18 · modwindow 3/3 · notebook 2/2 ·
  seams 4/4 · cv 6/6 · folders 11/12 · w1neb 3/4.
  - folders `3a SAVE AS proof/one`: thumb 1515 chars < the 5000 bar — IDENTICAL at 737a8df (same 1515), re-run alone: pre-existing, not the adopt.
  - w1neb `NEB-06` (▶ under the left rack at 1600 px): identical at 737a8df; the map's known red (FOR-MIR 17, Josh ruled).
  - shell with its default ANGLE gl (CPU renderer) timed out at the renderer wait; on vulkan the renderer was ready in 3 s.
- Headless Firefox 158 over the λWAVES gate (`tools/gate/server.py .tmp/app 9691`, geckodriver on 5691; `.tmp/neb-shots.mjs`): boots,
  renderer ready in 30 s (WebGPU), 12 windows registered (L camera age · R generator motion grade render light fx), the modulation window
  and FOLDERS open; 0 page errors (window error/unhandledrejection); the one Firefox console line is browser-internal (PrivateBrowsingUtils).
- `npm run test:gpu` not run: no shader, engine or default-picture byte moved.

## Shots (`research/iteration-027/S1-shots/`, JPEG 1000 px)
- `after-rack.jpg` (first run, the rack and the bar) · `after-modulation.jpg` (MACROS · LFO · ENV, the work bar) · `after-folders.jpg` (FOLDERS at ROOT).
- Nothing looks broken; the relief is the tight 1.5.6 one (RELIEF IS TIGHT, alpha.5).

## FOR-MIR
1. `createApp({ finder })`: an app on createApp gets no FINDER (the rack is `chrome: false`); a door that builds `createWindowPicker({ rack })`
   and puts it first under WINDOW (and on a key row) would give NEBULA and every createApp app THE FINDER without app code.

## Open questions
- Take THE FINDER into NEBULA now (≈5 lines in main.js: createWindowPicker + a WINDOW row) or wait for FOR-MIR 1?
- The folders 3a thumb (1515 chars) is red at 737a8df too: a headless-capture matter or a real blank thumb? Worth a look on the real screen.
- shell.mjs' default `SHELL_ANGLE=gl` no longer reaches ready in 150 s here; make vulkan the default?
- nebula-1.5 `docs/FOR-MIR.md` asks 1-21: not re-audited against 1.5.6 here (some may be closed, e.g. 1, 4, 5).

## THE FETCH LINE (Josh)
Bundle: `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a2bda907a50f83f98/.tmp/nebula-1.5.6-adopt.bundle` (9.3 MB, full history, verified; ref mir-1.5.6-adopt @ 40e653b)
`git -C ~/Documents/NEBULA-REDUX fetch /home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a2bda907a50f83f98/.tmp/nebula-1.5.6-adopt.bundle mir-1.5.6-adopt:mir-1.5.6-adopt`
Merging into `nebula-1.5` is Josh's call. The kit itself still waits in `.tmp/it021/kit.bundle` until Josh fetches it into ~/Documents/MIR.
