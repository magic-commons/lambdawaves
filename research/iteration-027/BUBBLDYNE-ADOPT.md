# BUBBLDYNE ADOPTS MIR 1.5.6-alpha.17 — 2026-10-29 (Opus builder, it027-S2)

KIT BEFORE → AFTER: MIR 1.5.0-alpha.24 (kit `1b7ae99b9905`, 262 files, 262/262 hashes matched: no private patch) → MIR 1.5.6-alpha.17 (`kit-1.5.5` @ `c13df7d`, from the integrator's `.tmp/it021/kit.bundle`).
BASE: `opus/lorentz-foam` @ `627bcbe`, not `main` @ `793ccce`. It is the live line (45 files of Lorentz/flat work on top of the 0.5.4 baseline, unmerged), so adopting there keeps Josh's work. The kit bytes are the same on both, and the clone fetched the branch from origin, so no extra fetch was needed.
Everything was done in clones (`.tmp/kit`, `.tmp/app` in this worktree). Nothing was pushed, and `~/Documents/BUBBLDYNE`, `~/Documents/MIR` and DATABASE were not touched.

## The clone's commits (branch `mir-1.5.6-adopt`)
- `1f98178` A1 ADOPT: `node .tmp/kit/tools/adopt.mjs .tmp/app`: 4 added (`render/audio-mix.js`, `shell/midi.js`, `shell/window-picker.{js,css}`), 69 updated, 0 removed, 193 unchanged; `lab/fonts` unchanged; `MIR-MANIFEST.json` → 1.5.6-alpha.17 / c13df7dc4c7b. BUBBLDYNE has no manifest pin test, so there was nothing to re-pin.
- `ce29b23` A2 THE FINDER: BUBBLDYNE's own + opens THE FINDER.
- `15c6136` A3 WORDS: the version in README / THIRD_PARTY_NOTICES / docs/ARCHITECTURE.md, and README names the +.
`adopt.mjs .tmp/app --check`: "in step with MIR 1.5.6-alpha.17".

## Removed doors vs BUBBLDYNE (CHANGELOG 1.5.5 BREAKING + 1.5.6-alpha.1…17)
- I grepped `src/ index.html flat.html tests/ tools/ docs/ README.md vite.config.js` for `rackAdd` `rackAddList` `addMenu` `el.add/addList` `rack-add` `GUI_TABS` `TAB_OF` `mir.gui.tab` `.tab(` `.turn(` `SKINS` `PILL` `rack-pill` `setOrient` `data-orient` `.mod-pop` `.pt-menu` and found **0 hits**. The app's `trig` wrapper (`src/main.js:53`) strips `glyph` before calling the kit's `trig`, so alpha.3's change to `trig({ glyph })` does not reach it. `app.js` did not change.
- The one change you can see: `rack: { chrome: true }` (`src/main.js:251`) drew the kit's **+** at alpha.24. In 1.5.5 chrome draws only hide (◧) and ☆, so without a fix the windows could only be opened from the bar's openers or the WINDOW menu.

## Every caller changed (fixed in BUBBLDYNE's own files; no file under `lab/mir` was edited by hand)
- `src/main.js:6-7` adds the imports `setGlyph` and `createWindowPicker` (`/lab/mir/shell/window-picker.js`).
- `src/main.js:594-602`: the kit's + list (`#rackAdd` and `rack.addMenu`) → `createWindowPicker({ rack: app.rack })` plus BUBBLDYNE's own `#finderOpen` button (`glass mir-rack-btn`, `data-rack-btn="finder"`, the kit's `plus` glyph, aria "FINDER — open a window"), appended to `#lab`. The FINDER closes on any outside press before a click lands, so a window-capture `pointerdown` records whether it was showing. A press on + while the FINDER shows therefore just closes it (the BASINS precedent).
- `src/style.css:63-70`: the + sits where it used to: ◧ · + · ☆ (desktop top 8/44/80; the phone thumb column bottom 14/60/106). It hides with the rack as ☆ does. The FINDER's sheet comes in through `mir.css` (`@import shell/window-picker.css`). BASINS links its sheets one by one and had to add a link; this app did not.
- `README.md:3,7`, `THIRD_PARTY_NOTICES.md:5`, `docs/ARCHITECTURE.md:35`: alpha.24 → 1.5.6-alpha.17. The historical docs (FIRST_BUILD, REALISM_0.2, CELL_0.5) keep their dates.

## Tests (vite dev server of the clone on 9693; node_modules copied into the clone so vite's cache never writes under BUBBLDYNE)
- `npm test`: **77/77 pass**, Lorentz included. `npm run build` is clean, and `dist/lab/mir/shell/window-picker.js` is present.
- `windows-browser.mjs` **8/8**, `live-browser.mjs` exact/replay/save/cancel on every scene, `advanced-browser.mjs` **green** (exit 0).
- `browser.mjs` fails at :199 (froth does not reach step 180 within 60 s; load average 19-26). `cellular-browser.mjs` fails at :13 (`waterNetwork.edges.count > 100`). Both **fail the same way at the base `627bcbe`** on the same server (checked out in the clone and re-run). That rules out the adopt: these come from the lorentz-foam line or the machine load. `speed-browser` was not run (no fps claims under load).
- Headless Firefox boot (geckodriver on 5693, `.tmp/ff-boot.mjs`): no page error. It found 8 windows, the chrome column at toggle@8 · finder@44 · fav@80, and the modulation window open. A real click on + showed the FINDER with 8 rows, a second click on + closed it, and picking CHROMA opened CHROMA. Page console: only WebGL lazy-init warnings and one `glyph: no drawing named "up"` (see below).
- Shots in `S2-shots/`: `s2-rack.jpg` (◧ + ☆ beside the right rack), `s2-modulation.jpg`, `s2-finder.jpg`.

## Bundle and THE FETCH LINE (Josh's)
- `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a343b2530bc29fc92/.tmp/bubbldyne-1.5.6-adopt.bundle` (5.2 MB, complete history, `git bundle verify` reports it okay), branch `mir-1.5.6-adopt` @ `15c6136`.
- `git -C ~/Documents/BUBBLDYNE/APP fetch /home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a343b2530bc29fc92/.tmp/bubbldyne-1.5.6-adopt.bundle mir-1.5.6-adopt:mir-1.5.6-adopt`
- Merging it into `opus/lorentz-foam` (a fast-forward) or into `main` is Josh's call.

## FOR-MIR (asks; nothing built)
1. A FINDER opener door: `createRack({ chrome: true, finder: true })` (or `createApp({ finder })`) that draws the + and makes the FINDER. BUBBLDYNE and BASINS both hand-built the same + / toggle / outside-press dance.
2. `createWindowPicker({ onToggle })`, or a `shown` change event, so an opener can mirror `aria-expanded` without hooking pointerdown on window.
3. (BASINS' #2, again) `adopt.mjs` could name kit sheets that are new since the app's manifest.

## Open questions
- In headless Firefox the FINDER and the modulation window draw see-through over the stage heading (REFRACTIVE, `backdrop-filter: blur(11px)` computed but not painted in the screenshot). Worth one look on a real screen.
- AIR JET (`src/main.js:343`) asks for the glyph `up`. No kit has ever drawn it (alpha.24 neither), so it warns and draws no icon. `chevronUp` exists. It is BUBBLDYNE's own call and was left alone.
- `browser.mjs:199` and `cellular-browser.mjs:13` were red at `627bcbe` before this adopt. They are worth one run alone on an idle machine, or a look on the lorentz-foam line.
