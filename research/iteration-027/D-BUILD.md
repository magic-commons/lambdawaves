# 027 CHAIN D — THE DEFECTS · BUILD (Opus builder, 2026-10-29)

Worktree `…/.claude/worktrees/agent-a5c75bbcab8d0c73a`, branch `it027-D` from `98e3fab1`; gate 9687/5687 (stopped); no kit file (1.5.6-alpha.17); LOCK not run.

## D1 A DEMO OPENS CLEAN — 557f8eb9
- Root (instrumented: the `lambdawaves` part's signature logged per call): FOLDERS' clean mark is taken at the restore, before the chemistry
  worker answers. Two of the solve's derived writes land after it: the STATES ladder applies the parked lane record (`instruments.states.lanes`
  gains S₀, and `modulationBases.reg.amp1` 0 → 1, ≈ 0.5 s), and WATER ESP's first potential moves the session's view (`mat.view` 0 → 2 and its
  base, ≈ 1.6 s: CHEMISTRY asks DENSITY while solving, the ESP reply asks REAL). The demo files were right; nothing was rewritten.
- Fix: the history already had the law (S4 · a solve's derived defaults join the row that asked for it, `api.derived` → `history.absorb`).
  `lab/windows/molecules.js` `derived(fill)` now also keeps the clean mark: a project clean (known) right before the fill is marked clean after
  it. The STATES ladder's landing (`lab/statesview.js`) and a solve's FIRST potential (`lab/chemview.js` onEsp) go through it. A hand edit
  before the fill keeps the project dirty. No key list.
- Proof: `tests/molecule-demos.browser-test.mjs` §5 "opens CLEAN" (600 ms and 3.2 s) for WAVE DANCER PROTOTYPE, STAR LOOP, BENZENE π,
  WATER ESP; the probes: dirty-probe all false, drift-probe d0/d1 false, roundtrip-probe (plain H₂O save → fresh → open) false.
  history GREEN · chem 56/56 · register 23/23 (R9 flaked once under load, green alone).
## D2 A FILM'S WORDS ARE THE FRAME'S — 63c99843
- Root: `road.pending()` read `caption()` once at the take; `frame()` drew that string on every frame.
- Fix: `lab/windows/film.js` hands the road its `caption` function; `lab/render-exact.js` reads `J.words()` after the frame's modulation step
  (card road, take clip/period; a direct `render({ caption })` keeps its string). The pending / manifest keep the start string; STAGE FORMULA
  off (an empty start caption) draws nothing, as before.
- Proof: `research/iteration-027/D-shots/WATER-ORBITALS.sheet.jpg` (+ audit; MP4 deleted): 1a1 · 1b2 · 3a1 · 4a1 LUMO, one per bar, each
  matching its picture (026 read "1a1" in every bar). render-exact.test 40/40.
## D3 A FILM GIVES THE STAGE BACK — c3130b75 (test only)
- Reproduced with 025's scene (`tools/perf/film-bake.mjs overlays`): only a screenshot in the same instant as the film's return is black.
  The put-back's ONE present is already armed (hold(false) + after() coalesce into one rAF, presents +1) and redraws VORTEX (its key held the
  film's t); the next shot, no present forced, is the stage. The black is the canvas between its resize and the next composite: a
  synchronous stage frame at the put-back was tried, the instant shot stayed black, so no lab change was kept (Josh's dial).
- Proof: `tests/film-handover.browser-test.mjs` §0: clock paused, VORTEX raised (LOCATE · OVERLAY), PARTICLES seeded, a 2-s STILL film →
  snapHash before = after (DUST: the film's put-back honestly moves the jitter counter, which a cloud's dither reads). GREEN.
## D4 A MAPPED CONTROLLER IS LIVE AT LAUNCH — d4301d6d
- Root: the kit's privacy law (`start()` only from a hand: LEARN, CONNECT MIDI); a saved map waited for a press every boot.
- Fix (app side, `lab/mapping.js` `resumeMidi`, run by `install()`): with a saved map, `permissions.query({ name: 'midi' })`: granted → start
  (no prompt) and the stored notes/CCs bind as access lands; prompt → nothing asked; denied or a refused request → said once in METERS
  (`wMet.setStatus`), never thrown. Firefox has no 'midi' name: the request decides.
- Proof: `tests/midi-resume.test.mjs` (fake `navigator.requestMIDIAccess`, a fresh createMidi over the stored map = the reload): live, the fake
  pad's NOTE 1·60 runs its action with no LEARN; prompt asks nothing; refusals said once; no map asks nothing. keyboard-window GREEN.
## D5 A SAVED LOOK KEEPS ITS NAME — 198e17c5
- Root: FROST's TEXT moved LIGHT → AUTO (kit alpha.8, 022 E1); a store saved before fails `matchPreset` on `text` → CUSTOM.
- Fix: `lab/look.js` passes the kit's own once-per-version road to createPrefs (`version: LOOK_VERSION` = 2, `migrate: frostText`): FROST's
  options with TEXT LIGHT become FROST's (TEXT AUTO). Once: a TEXT LIGHT chosen afterwards stays. `mir.gui` now carries `prefsV: 2`.
- Proof: `tests/first-run.test.mjs` + `tests/fixtures/look-frost-022.mir.gui.json`: CUSTOM before, FROST after, a later LIGHT kept; a browser
  boot over the fixture wrote `text: theme, prefsV: 2`. official-defaults-palette · picker-looks GREEN.
## D6 PLAY NEVER CLIPS — 0d118615 (measured, no fix)
- 022 E3 holds (800 px tall): 760 bar [122→716] ×.88 PLAY [59,129→108,178] · 776 bar [130→724] ×.88 PLAY [67→116] · 800 bar [102→776] ×1
  PLAY [30,131→86,187]; PLAY inside and hit at centre and all four edges. Shots `D-shots/d6-csb-760.jpg`, `d6-csb-776.jpg`.
## Tests
`./test.sh node` EXIT 0 · pwa --write · rack-deps HOLDS · new-project in step · the browser suites named above GREEN.
## FOR-MIR
- `mir/shell/midi.js`: a `resume()` door — a saved map + permission granted → start, 'prompt' → idle, a refusal → 'denied' once; and the
  PRIVACY LAW sentence amended ("…or at boot where a saved map holds and the browser already grants MIDI"). λWAVES' resumeMidi is its draft.
- `mir/core/prefs.js` / `shell/themes.js`: a theme's retired values (FROST `text: 'light'`) for `matchPreset`, so an app needs no migrate.
- `mir/folders/gallery.js`: the clean mark has no "settled" seam; a host whose restore lands derived state later re-marks through its own facade.
## The CLAUDE.md sentence to add
A solve's derived fill (`derived` in lab/windows/molecules.js: the orbital, the register's selection, the STATES ladder, the first potential's view)
joins the history row AND the clean mark it stood on, so a project clean when its solve lands is clean after it (027 D1: a demo opens CLEAN).
