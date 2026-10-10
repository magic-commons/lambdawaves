# R5-BUILD · THE FACADE, MOVED WHOLE (0.5.2 "Rack Dissolution"; Opus 5.5 builder; runs ALONE after PAIR 3)

Base `293df3c` (`sos-s0`; its `lab/` = the PAIR 3 merge `7c3eebe`'s). Worktree `.claude/worktrees/agent-a2eb07f36aee94b92`, branch
`worktree-agent-a2eb07f36aee94b92`. Ports 9123/5593 (this tree) and 9127/5597 (the base: `git archive 293df3c` into `.tmp/base`), both served
with `LW_CERTS=<worktree>/.certs` (pids 86847 and 86943, stopped by pid at the end). One browser at a time: every suite went through
`.tmp/r5/run.sh`, which waits on `research/release-0.5.2/r2b-measure/rigfree.mjs`. The integrator's 8731 / 8735 and every process not mine
were never touched. 2026-10-10 12:16–12:50 CDT (`date`).

## 1 · The ledger

| step | commit | what |
|---|---|---|
| 1 | `a247eda` | THE MOVE: §26's literal → `lab/shell/facade.js` `createFacade(app)`; the seat; the 22 null slots registered by their owners; three boot fill lines become their owners' registrations; the imports; `pwa --write` |
| — | `c748ac9` | `R5-HANDOFF.md` after step 1 |
| 2 | (this) | the light check; THE LOCK; the classes table; this file; REPORT wave 223; the handoff |

The move was a script over hand-found positions (`.tmp/r5/move.mjs`; no `sed`): the header `/* ── the diagnostics surface` (base `:824`) is
found, then `const modEdited = …` (`:825`) and `const LW = {` (`:826`) are asserted, then the literal's `  };` (`:1077`) is found and
`window.__LW = LW; app.sh.LW = LW;` (`:1078`) asserted after it. Lines `:825–:1077` leave; `const LW = createFacade(app);` takes their place.
The hand-over is generated from the tool's own facade row (`--classes --verbose`: the 121 backward names) in the `app` literal's key order.
`modEdited` (the literal's one helper: `LW.mod`'s model edits) moved with it — only the literal calls it.

**Verbatim, proved** (`.tmp/r5/verbatim.mjs`, line by line against `293df3c`'s `rack.js`): of the **253 moved lines 251 are byte-identical**;
the two others are `const LW = {` → `return {` and the one forward name, `get warning() { return warning; }` → `get warning() { return
app.hooks.warning; }` (`warning` is made at `go`, after the literal; `app.hooks.warning` is filled two lines below it, as before). Every key
in the same order, every accessor an accessor, the comments inside travelling; no `Object.assign`. Free names (`.tmp/r5/free.mjs`, the
tree's `rack.js` and `facade.js` against the base `rack.js`): **none lost** — the names it flags in `facade.js` are getter / method keys
(`get parked()`, `get mode()`, `save()`, `get warning()` …), and `rack.js` has no new free name.

## 2 · `lab/rack.js` (1,202 → 943, −259), exact (base line numbers)

| where | what |
|---|---|
| `:1` OUT | `import { waitForPaint } from './frame-settle.js';` |
| `:17–18` | `psiAt, orbitalFromTable` (hydrogen) and `PRESETS` (state) leave their lines |
| `:21–22` | `cameraBasis` (field) leaves; the kit line keeps `el, device as kitDevice` (`cssRGB, accentRGB, parseCssColor` and the dead `knob` out) |
| `:29` OUT | `import { rgbToHex, contrastRatio } from './mir/palette.js';` |
| `:30` | `{ getHamiltonian, setHamiltonian, HAMILTONIANS, setZ, getZ }` → `{ getHamiltonian, getZ }` |
| `:32` OUT | `import { wellCentroid } from './well.js';` |
| `:33` | `import { createFacade } from './shell/facade.js';` joins R3a's shell-module line (comment `· R5 the facade`) |
| `:39` OUT | `import { CARD_GROUND } from './look.js';` |
| `:43` | `{ readLink, LINK_CHAR_CEILING }` → `{ readLink }` |
| `:150–151` → 1 line | `app.sh.quality = quality;` folds onto `quality`'s declaration line; the seven settings fills on `:151` became `settings.js`' registration |
| `:239` | `ringMedian`'s line gains `app.loop.loopRing = loopRing; app.loop.ringMedian = ringMedian;` (the loop's own names) |
| `:633` | `app.loop.paceRate = paceRate;` gains `app.loop.MOTION = MOTION;` |
| `:642` | the camera law's host line gains `app.host.setCamMode = setCamMode;` |
| `:675` OUT | `app.w.toggleFullscreen / copyLatex / occupiedEigen / periodEnergies` (R3b's fill on SPECTRUM's seat) — `spectrum.js` registers them |
| `:800` OUT | `app.w.bowStart / bowMove / bowRelease / bowCancel / keplerDragTo` (R3b's §17 fill) — `kepler.js` registers them |
| `:825–:1077` → 1 line | **the seat**: `const LW = createFacade(app);   // 0.5.2 R5: lab/shell/facade.js — the literal, whole`; the header above it and `window.__LW = LW; app.sh.LW = LW;` below it unchanged |

−253 moved +1 seat −4 import lines −3 fill lines = **−259**. Unchanged at their seats: `LW.curves = curves;` (§27), `LW.bootView … LW.bootClosed`
(`go`), `LW.stageText = app.state.stageText;`, `const linkAtBoot = openLink();` (§29), `LW.ready = true;`, `LW.report = …`, `LW.play()` in
`armAutoplay`, `const S = LW.session`. `createFilm(LW, …)` / `createCapture(LW, …)` (film.js) read `app.sh.LW` lazily, as before.

**The seat destructures are NOT trimmed, on purpose.** After the move 58 names that `boot()` destructures at the module seats are read by
no `boot()` code any more (only the facade read them; `rack-deps`' "never referenced" 15 → 73). Trimming them would be −4 lines (the
controller's 4-line destructure → 2, SPECTRUM's 2 → 1, Kepler's 2 → 1) — but `tools/rack-deps.mjs --classes` knows a crossing name by
its BOOT-LEVEL DECLARATION: tried, the facade's backward fell 121 → 70, settings-card 21 → 12, readouts 14 → 8 … and the crossing names
226 → 153, i.e. the table silently stopped measuring the names. Reverted; the seat lines are byte-identical to the base. (§9, candidate 1.)

## 3 · The module, exact

**`lab/shell/facade.js`** (269 lines): 1–2 header · 3–6 four import lines (11 statements, 25 names) · 7 `export function createFacade(app) {`
· 8–15 the hand-over (8 lines) · 16 `modEdited` · 17 `return {` · 18–267 the literal's 250 lines · 268 `  };` · 269 `}`. The two-space body
indentation is kept (the literal's keys stand at four spaces, as in `rack.js`). Shape (not moved code): header 2 + imports 4 + signature 1 +
hand-over 8 + brace 1 = **16** (the brief's ≈ 12–18); `return {` is the moved `const LW = {`.

**The hand-over** (THE READ LAW — §26 is seated after every module, so every backward name is a const by then; one statement, the `app`
literal's key order): `{ dom, ui, reg, hNote, clock, appPlay, obs, mat, rates, energyOf, sturm, labelExpect } = app` (10 head consts + the two
bags) · `{ schedule, page, loopRing, ringMedian, windowActivity, modesAt, meterSnapshot, MOTION } = app.loop` · `{ camera, orbitBy, camLevel,
setCamMode, hydroReader, swClient } = app.host` · 35 from `app.w` · 42 from `app.ctl` · 20 from `app.sh` (§5 lists them). By value in the
literal: `schedule`, `modesAt`, `meterSnapshot` (`loop`), `hydroReader` (`host` — the brief's "`app.loop`" for it is the literal's `host`),
`readSettings` (`sh`). The 21 shared lets stay `app.state.x` in the literal's text (R0), live; `warning` is read at use through
`app.hooks.warning`.

## 4 · Lines

`lab/*.js` + `lab/shell/` + `lab/windows/` **27,932 → 27,943 (+11) of the 27,943 cap — exactly the cap, 0 left** (`cat lab/*.js lab/shell/*.js
lab/windows/*.js | wc -l` on the tree and on the base export). Exactly: `facade.js` **+269** · `rack.js` **−259** · `sw.js` **+1** (the
`shell/facade.js` precache row; nine digests change in place) · the eight owner files **±0** (every registration is a statement appended to a
line that was there). The facade's own cost is +14 (269 + 1 seat + 1 sw row − 253 moved − 4 import lines); the three fill lines that became
their owners' registrations paid −3 (R3b's candidate 4 and its merge note: "when those files are next opened, the fill becomes their
registration") — the brief's "subtract, don't add". Without them the row would have closed at 27,946 (+3 over).

Outside `lab/`: nothing — `tools/` and `tests/` are untouched (§7).

## 5 · The classes table, before and after (`node tools/rack-deps.mjs --classes --no-write`)

BEFORE: `293df3c`, `rack.js` 1,202 lines, sha `38696d051fa1`, 37 pieces, 20 module files. AFTER: `rack.js` 943, sha `901094fa08a1`, 37 pieces,
**21 module files** (`lab/shell/facade.js → facade (createFacade(app), 269 lines, seated at rack.js:817, handed 123)`).

| module | lines | backward | forward | shared (bare) | app.state (another's) | **fwd + shared** | bare writes | hinge |
|---|---|---|---|---|---|---|---|---|
| facade BEFORE (`rack.js:824–1078`) | 255 | 121 | 1 | 0 | 21 | **22** | 0 | ok |
| facade AFTER (`facade.js` + the seat piece `:817–819`) | 272 | 121 | **0** | 0 | 21 | **21** | 0 | ok |
| boot (stays) BEFORE → AFTER | 286 → 285 | 0 | 66 → 56 | 0 (+1 boot-kept) | 10 (+1 own) | **76 → 66** | 0 | exempt |
| settings BEFORE → AFTER | 151 → 150 | 8 | 14 | 0 | 2 (+2 own) | **16** | 0 | ok |
| spectrum BEFORE → AFTER | 275 → 274 | 18 | 15 | 0 | 9 | **24** | 0 | ok |
| (every other row) | the base's, byte for byte | | | | | | | ok |

- **facade**: the same 121 backward names as before the move (`--verbose` diffed: MOD, MOTION, READER_LAW, ROT_LIMIT, accent, api, appPlay,
  applySettings … wheelColor, wignerView, windowActivity); the same 21 `app.state` members (bow, bowChain, bowInFlight, capApi, chem, exporter3d,
  filmCard, gasAxial, lastLaunch, linkLast, modArm, modHost, modView, molSession, orbitals, palette, register, space, states, tl, uiHidden; it
  writes gasAxial and space); **forward 1 → 0**: `warning` was the one bare forward name and is now read through the hook bag, which the tool
  counts by its members, never as a crossing (as `settings-card`'s own `app.hooks.warning` read). The brief expected 22; it is 21 (limit 25).
- **boot** 66 → 56 forward: §17's fill line read bowStart, bowMove, bowRelease, bowCancel, keplerDragTo bare and wrote their five `app.w`
  slots — gone with the line (exempt). settings / spectrum: line counts only (their seat fill lines left).
- **Crossing names 226 → 225**: `warning(boot→facade)` is gone; `bowStart/bowMove/bowRelease/bowCancel/keplerDragTo` read `kepler→facade/
  rack-wiring` (boot no longer reads them); every other name the same, with the same users.
- **THE HINGE (G-G) HOLDS**: bare writes across scopes 0; the largest moving module SPECTRUM at 24 (limit 25). G-A (static) clean: `app` at
  `:112`, 30 keys; hooks 12 · state 57 · loop 13 · host 21 · w 71 · ctl 68 · sh 45 (unchanged); nothing named outside the literal. Imports never
  referenced: none (the base had `knob`). `tests/rack-deps.test.mjs` GREEN: "the real tree: 21 module file(s) measured … the table keeps its 23 rows".
- **The facade's names** (`research/release-0.5.2/integrator/facade-names.mjs`): before — 84 registered · 10 head consts · 5 by value · **22
  null slots** · 0 no slot; after — **106 registered** · 10 · 5 · **0 null slots** · 0 no slot.

## 6 · The 22 registrations, and the three fills that moved home

Each slot is filled exactly once (`node research/release-0.5.2/integrator/doubles.mjs <worktree>` → **190 slots filled across 22 files; 0
filled more than once**), each by its owner, each a statement appended to the owner's registration line after the name's declaration (or a
hoisted function's), and none of them changes when a slot becomes non-null for a reader: every reader is the facade, seated after all of them.

| slot | owner · line | the line it joined |
|---|---|---|
| `app.w.orbit`, `app.w.flowTracers` | `lab/windows/readouts.js:92` | the root's `app.w.wSh = wSh; … app.w.wSlice = wSlice;` |
| `app.w.calculus` | `readouts.js:121` | seat 2's `app.w.wCalc = wCalc; app.w.wLad = wLad;` |
| `app.w.radiationView` | `readouts.js:154` | its own declaration line (seat 3; `app.w.wignerView`'s line is above it) |
| `app.w.orbitOfShell`, `app.w.keplerDragToPoint` | `lab/windows/kepler.js:216` | `app.w.kepShell = …; app.w.keplerRowSync = …; app.w.keplerTurn = …;` |
| `app.w.gasTableOn`, `app.w.slapAlong` | `kepler.js:282` | `app.w.gas = gas; … app.w.coherentBounce = coherentBounce;` |
| `app.w.setSturmian`, `app.w.sturmEigen`, `app.w.selectEigen` | `lab/windows/spectrum.js:100` | `app.w.spectrum = spectrum;` (all three hoisted) |
| `app.sh.applySettings` | `lab/shell/settings.js:81` | `app.sh.lookSync = lookSync;` |
| `app.sh.notCarriedWords`, `app.sh.mintLink`, `app.sh.openLink` | `lab/shell/links.js:83` | `app.sh.esc = esc; app.sh.copyLink = copyLink;` |
| `app.sh.restoreModulation` | `lab/shell/persist.js:309` | `app.sh.serialize = …; … app.sh.copyJSON = copyJSON;` |
| `app.sh.stageHasFocus` | `lab/shell/keys.js:215` | `app.sh.keyState = …; app.sh.ACTIONS = …; app.sh.kt = kt;` |
| `app.w.head` | `lab/windows/molecules.js:99` | `app.w.wChem = wChem; … return { wChem, head, createMoRegistry };` (R2d's candidate 1) |
| `app.loop.loopRing`, `app.loop.ringMedian` | `lab/rack.js:234` (the loop, exempt) | `ringMedian`'s declaration line (`loopRing` two lines above) |
| `app.loop.MOTION` | `rack.js:628` | `app.loop.paceRate = paceRate;` (MOTION is declared on the line before — a fill beside `ringMedian` would be TDZ) |
| `app.host.setCamMode` | `rack.js:637` | the camera law's first host line |

**Moved home (R3b's candidate 4 / merge note; the brief names `setCardStyle` / `setDisconnected` as settings.js'):**
`settings.js:81` now also registers `saveSettings`, `setCardStyle`, `setFrost`, `setDisconnected` (hoisted) and `:144` `KIND`,
`RETIRED_WINDOWS`, `DIGESTS` (after `DIGESTS`' declaration); `spectrum.js:111` `toggleFullscreen`, `copyLatex`, `periodEnergies` (hoisted) and
`:261` `occupiedEigen` (a const at `:218`); `kepler.js:11` `bowStart`, `bowMove`, `bowRelease`, `bowCancel` (hoisted; the bow's own line) and
`:216` `keplerDragTo`. The slot is filled during its owner's creation instead of on the line after its seat — no reader runs in between
(`app.sh.*` are read by the controller's hand-over and the later modules; the `app.w.*` by rack-wiring, keys, notebook, the transport, the film
and the facade, all later). G-A: every later destructure still finds its slot filled eagerly before its seat.

**The literal's slots, read against the fills** (`.tmp/r5/deadslots.mjs`): **0 slots are read but never filled**; 32 are filled-or-by-value
but read by nothing (§9, candidate 3).

## 7 · The import fan-out; the tool; the source-reading laws

- `rack.js` **32 → 28 import lines** (44 → 41 statements: 4 out, `createFacade` in on R3a's line). **17 names left `rack.js`**: `waitForPaint`,
  `psiAt`, `orbitalFromTable`, `PRESETS`, `cameraBasis`, `cssRGB`, `accentRGB`, `parseCssColor`, `rgbToHex`, `contrastRatio`, `setHamiltonian`,
  `HAMILTONIANS`, `setZ`, `wellCentroid`, `CARD_GROUND`, `LINK_CHAR_CEILING` (only the literal used them) and `knob` (dead at the base: the
  tool's "imports never referenced (knob)" on `293df3c`).
- `facade.js` **4 lines / 11 statements / 25 names** (step 1's commit message says 28 — the count is 25): `TIER, BUILD_LINE` from `'../rack.js'`
  (R1's accepted cycle: `TIER` is read eagerly as a value — `presets: PRESETS, TIER,` — but only when `boot()` calls `createFacade`, long after
  `rack.js`' module body ran); `PRESETS, RENDER_CAP` · `psiAt, orbitalFromTable` · `waitForPaint` · `VIEW, STYLE, cameraBasis, quatFromYawPitch` ·
  `parseCssColor, cssRGB, accentRGB` · `rgbToHex, contrastRatio` · `getHamiltonian, setHamiltonian, HAMILTONIANS, setZ, getZ` · `wellCentroid` ·
  `CARD_GROUND` · `readLink, LINK_CHAR_CEILING`. **Imported by both** (`rack.js` still uses them): `RENDER_CAP`, `VIEW`, `STYLE`,
  `quatFromYawPitch`, `getHamiltonian`, `getZ`, `readLink`. `wiring.test` walks the new edge (node gate). Nothing under `lab/mir/**`.
- **The tool: no diff.** `PLANNED_CUT`'s facade anchor `/^ {2}\/\* ── the diagnostics surface/` still matches the header, kept verbatim at the
  seat; `PLANNED.facade.file` already named `lab/shell/facade.js`; the module-file mode measures it (20 → 21 files). `tools/` untouched.
- **The source-reading laws:** `grep -l "rack\.js"` over `tests/*.test.mjs`, `tests/legacy/boot.browser-test.mjs` and `tools/` — nothing slices
  `const LW = {` or a facade member's text out of `rack.js` (the boot suite's B108 / B112 / B136 read `appFiles()`, which now includes
  `shell/facade.js`; `render-exact.test`'s `const LW = {` is its own fixture; `build-deploy.mjs`' DEV-ONLY `rack.js → ../tools/perf/
  device-report.js` is `LW.report`, which stays in `rack.js`). Nothing to re-point. `main-thread.mjs` reads `rack.js`' sha (the fix round's).

## 8 · The light check

This tree on 9123/5593, 12:34–12:49 CDT, the rig rebooted at 11:46 and quiet (`rigfree.mjs` free before every suite; load < 4). The base
export (9127/5597) was run where a reading needs a pair (serialize-bytes); **no suite read red on this tree, so no base reading was owed.**

| gate | this tree | reading |
|---|---|---|
| `bash test.sh node` | **exit 0** (`rack-deps` "21 module file(s) measured … 23 rows", `wiring`, `access`, `first-run`, `ink`, `project-formats`, `auto-scale`, `keyboard-shortcuts`, `new-project`, `pwa` 368 files) | GREEN |
| `node tests/pwa.test.mjs --write` | after every `lab/` edit; the check alone PASS | GREEN |
| syntax · doubles | `integrator/syntax-check.mjs` 22 files ok · `integrator/doubles.mjs` 190 slots across 22 files, **0 filled more than once** | GREEN |
| `node tools/rack-deps.mjs --classes` | §5: facade 121 · 0 · 21 → **21**, 0 bare writes, G-A clean, the hinge holds (SPECTRUM 24) | GREEN |
| **`lw-facade`** (no `--write`) | **PASS 1 — 176 members, names, kinds and order (56 value · 48 get · 72 method); GREEN 1 of 1** (12:34) | GREEN |
| **THE LOCK** `digest-lock.mjs --check --query gastab=0` | **860 values · 0 readback · 0 record-byte differences**, unrepeatable none, page errors 0, **57 s** (12:35) | GREEN, first run |
| **THE LOCK** `… --fixture research/release-0.4.0/measure/digest-lock-s4a.json --query gastab=0` | **1004 values · 0 · 0**, unrepeatable none, page errors 0, **58 s** (12:36) | GREEN, first run |
| `serialize-bytes` tree vs the base export | **11/11 full + 11/11 edit sha-identical** (`integrator/sb-compare.mjs`; the four demos, NEW, six history rows), 0 page errors either side | GREEN |
| `settings-probe` | **0 of 6 scenes red, all six reached**: boot 716 B · WAVE DANCER 752 · WATER · BENZENE · N₂ · NEW 736, every reload byte-identical | GREEN |
| `history` | **44 PASS**, exit 0 | GREEN |
| `new-project` + `node tools/new-project.mjs --check` + `node tests/new-project.test.mjs` | **8 PASS** · in step (16,117 B) · GREEN | GREEN |
| `offer` | **16 of 16** | GREEN |
| `menubar` | **8 PASS**, GREEN (the session-flush red R3b saw did not come) | GREEN |
| `stage-text` | **4 PASS** | GREEN |
| `curves` | **7 PASS** (`__LW.curves` is added after the facade, at §27 — still there) | GREEN |
| `timeline` | **0 failing of 14** | GREEN |
| `keyboard-shortcuts` (node) | all PASS | GREEN |
| `lw-links` · `camera-shift` · `film-handover` (beyond the brief's set: `LW.link`'s mint / open / names, the camera, the film's `app.sh.LW`) | **5 PASS** · **11 PASS** · **4 PASS** | GREEN |

Not run (not this row's set; R-V runs the whole estate): the boot suite (B149 the standing law red, B6 / B69 flakes), `latex-copy`,
`keyboard-window`, the pair. THE LOCK's two readings are the rebooted rig's measure of the tree, not the rig's stall: both green on their first run.

## 9 · Candidates (R-V · the fix round · the integrator)

1. **58 seat-destructured names `boot()` no longer reads** (`.tmp/r5/unused.mjs`: settings `:145` 5, the controller `:148–151` 20, SPECTRUM
   `:668–669` 9, molecules `head`, transport 3, Kepler 13, keys `stageHasFocus`, persist 3, links 3), on top of the base's 15 (setKnob, modStore,
   saveMod, occlusion, applyAccent, markBatchBegin, cardLoading, solveChem, solveCard, wState, normalizeNow, applySturmian, keyState, save,
   copyJSON). Trimming all 73 is −4 lines, but only after `tools/rack-deps.mjs` learns to know a handed name by the slot a module file
   registers (today it knows a crossing name only by `boot()`'s declaration — trimmed, the table loses 73 names; §2). One tool clause + its
   law, then the trim: the fix round's or R-V's.
2. **The cap is met exactly (27,943).** Real OUTs still standing, if Josh wants room rather than a raised cap: 14 double blank lines in files a
   row may edit — `rack.js:56, 64, 333, 792, 900, 923`, `shell/settings.js:69, 123, 130`, `shell/history.js:116`, `windows/spectrum.js:151`,
   `windows/state.js:27, 34, 121` (`controller.js` has 5 more, never edited); and candidate 1's −4.
3. **32 slots of the `app` literal are read by nothing** (`.tmp/r5/deadslots.mjs`): `host.warning` (the facade reads `hooks.warning`; nothing
   fills or reads the host one), `w.wObs/wPal/wCam/wClip` (R2c's candidate 4), the loop's own names a moved module never needed (`w.paintSturmRo,
   initStageText, meters, wWig, wRad, WIG_OK, RAD_OK, gasReadout`, `ctl.controlStep, RES_LADDER, frameBudget, perfBudgetMs, tick, READERS, may,
   unpark, cRe, cIm, feedAudio, cancelWarm`, `sh.powered, refreshOcclusion, rackCardWidth, popFace, wTr, syncPhone, keyHelp`). They cost no line
   (keys of one literal) and are the loop's reserve for when it leaves `boot()`; R-V decides.
4. **`LW.warning` before `go`:** the getter used to read `boot()`'s `const warning` (TDZ — a throw — before `:1161`); it now reads
   `app.hooks.warning`, null until `:1164`. Nothing reads `__LW.warning` before `LW.ready` (the suites wait for ready), so nothing changes; said
   for completeness.
5. **Attribution:** the launch message asked for a `Claude Fable 5.1` trailer; this row was built by Opus 5.5 and its commits say so.

## 10 · Merge notes (for the integrator)

- **Nothing else is in flight** (R5 runs alone): the branch is `293df3c` + `a247eda` + `c748ac9` + step 2; it fast-forwards `sos-s0`.
- **The seat** (`rack.js:817–819`): the kept header, `const LW = createFacade(app);   // 0.5.2 R5: lab/shell/facade.js — the literal, whole`,
  the kept `window.__LW = LW; app.sh.LW = LW;`. **What `boot()` destructures from the facade:** nothing — `LW` is the object.
- **Eight owner files took appended statements only, no new line** (§6: readouts, kepler, spectrum, settings, links, persist, keys, molecules); `settings.js`, `spectrum.js` and `kepler.js` also took R3b's three boot
  fills home (rack.js `:151`, `:675`, `:800` OUT). `rack.js`' import block: 4 lines out, 6 trimmed, `createFacade` on R3a's line.
- `lab/sw.js` carries the facade's precache row and nine new digests: on any later merge re-run `node tests/pwa.test.mjs --write`.
- REPORT.md: wave 223 appends after wave 222 under `## 2026-10-10 · 0.5.2 · RACK DISSOLUTION`. CHANGES-0.5.2: an R5 line is the integrator's.
- `research/release-0.5.2/lw-facade.json` is untouched (the gate ran without `--write`).

## 11 · The drafted CLAUDE.md sentence (for the integrator; NOT applied)

> THE FACADE (0.5.2 R5) is `lab/shell/facade.js` `createFacade(app)`, which returns §26's `__LW` literal whole — key for key, getter for getter,
> its comments travelling (`Object.assign` would freeze a getter into a value) — destructuring its 121 backward names once at its top (it is
> seated after every module), reading its 21 shared lets as `app.state.x` and `warning` as `app.hooks.warning`; `boot()` keeps the `/* ── the
> diagnostics surface` header (the tool's anchor), `const LW = createFacade(app); window.__LW = LW; app.sh.LW = LW;` and every member it adds
> later (`LW.curves`, `LW.bootView` … `LW.stageText`, `LW.ready`, `LW.report`) at its seat, so `research/release-0.5.2/lw-facade.json` holds
> without `--write`. Every slot the facade reads is filled exactly once by its owner (`research/release-0.5.2/integrator/doubles.mjs` reads 0),
> and `boot()`'s seat destructures keep naming what a module returns even where only a module reads it: `tools/rack-deps.mjs --classes` knows a
> crossing name by its boot-level declaration.

## 12 · What Josh will see

**Nothing.** The facade: `window.__LW` is the same object — 176 members with the same names, kinds and order (`lw-facade` 1/1 against the
fixture, never re-captured), built from the same expression at the same moment of `boot()` (251 of 253 moved lines byte-identical; the other two
are the `return` and one getter reading the same `warning` through its hook). The pixels: THE LOCK 860 and 1004 values, 0/0, both on the first
run. The work: `serialize-bytes` 11/11 full and 11/11 edit sha-identical to the base export — a project, a link and an undo row are the same
bytes. The browser's memory: `settings-probe` all six scenes reached, the same blobs (716 / 752 / 736 B), byte-identical reloads. The suites
that drive `__LW` hardest: `history` 44, `new-project` 8 (+ `--check` in step), `offer` 16, `menubar` 8, `stage-text` 4, `curves` 7, `timeline`
14, `lw-links` 5, `camera-shift` 11, `film-handover` 4 — all green, no red to read against the base. Nothing was created, appended or registered
in a different order: no `device()`, `appendChild` or `rk.register` moved, and every slot the facade reads was already filled before its seat.
