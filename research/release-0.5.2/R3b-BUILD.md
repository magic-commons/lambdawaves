# R3b-BUILD · TRANSPORT + RACK WIRING + NOTEBOOK + KEYS (0.5.2 "Rack Dissolution"; Opus 5.5 builder; PAIR 2 beside R2b)

Base `1d5b060` (`yan-c`; `lab/` = `87aad5e`'s). Worktree `.claude/worktrees/agent-ad72f08e558dc8f5f`, branch `worktree-agent-ad72f08e558dc8f5f`.
Ports 9093/5563 (this tree) and 9097/5567 (the base: `git archive 1d5b060` into `.tmp/base`, the default certificate directory). One browser at
a time: every suite went through `.tmp/run.sh` (no geckodriver, no marionette Firefox, `tools/perf/wait-gpu.mjs` free) — R2b's suites were
waited out, never touched; Josh's desktop Firefox (2002078) and the other servers were not touched. The rig drew 2–3 frames a second.

## 1 · The ledger

| commit | what |
|---|---|
| `c7451c5` | THE MOVE: §12 → `lab/shell/transport.js`, §19a → `lab/shell/rack-wiring.js` (two seats), §19b → `lab/shell/notebook.js`, §20–§23 → `lab/shell/keys.js`; the boot fills; rack.js' imports trimmed in place; `tools/rack-deps.mjs` (two anchors); `tests/project-formats.test.mjs` re-pointed; pwa |
| `4880787` | `R3b-HANDOFF.md` after step 1 |
| (this) | the light check; this file; REPORT wave 220; the handoff |

The move was done by `.tmp/r3b-move.mjs` (the plan: every free name of each span classified by the walker — destructured from its `app`
namespace when declared before the seat, rewritten to `app.<ns>.x` at its token when declared later, refused if eager or written) and
`.tmp/r3b-write.mjs` (the files, the seats, the fills), then `.tmp/r3b-imports-fix.mjs` (exact one-line import swaps). No sed. Kept in `.tmp/`
(ignored) with `.tmp/verbatim.mjs` (the proof below), `.tmp/blocks.mjs` (the boot suite's block ranges) and `.tmp/sbcmp.mjs`.

**Verbatim, proved** (`.tmp/verbatim.mjs`, line by line against `1d5b060`, in order): of the **1,121 moved non-blank lines, 1,101 are
byte-identical**; 17 differ only by a forward read through a slot (notebook 13: `app.sh.ACTIONS / kt / save / restore / copyJSON / copyLink /
historyApi / LW / serialize / modSeats`; keys 4: `app.sh.historyApi`), and 3 are the inherited fills, now registrations (below). **34 blank lines
inside the spans were dropped** (the subtraction: double blanks left by earlier edits, two inside one statement) and 2 blanks between §19b and
§19a's second half. Comments and section headers travel; indentation kept (wireStage's body keeps its two-space column).

### The judgement calls (each is a re-cut the brief did not spell out; each was forced)

1. **§19a is ONE module with TWO seats.** The notebook block sits between §19a's halves, so the second half's STATEMENTS (the phone crossing's
   `resize`/`orientationchange` listeners, `layout.phone`/`layout.tablet`, `bindStageGestures(…)`, the canvas ResizeObserver) are wrapped in
   `function wireStage() { … }`, returned, and called by boot() right after `createNotebook(app)` — listener order and `layout`'s key order stay
   exactly as they were. The second half's DECLARATIONS (`phone`, `enterPhone`, `leavePhone`, `tablet`, the fill, `syncPhone`) stay at the
   module root, so `app.sh.rk/layout/phone/tablet` are registered EAGERLY at creation (persist destructures all four; G-A clean). They are pure
   (two object literals, three function declarations, one fill): nothing observable moved earlier.
2. **`devById`, `rackCardWidth`, `popFace` (the last nine lines of §18's piece) came with §19a.** `popFace` reads `layout`, which
   createRackWiring makes; §19a calls `popFace(wTr.root)` DURING its own creation, when boot()'s `layout` (destructured from the module's
   return) is still TDZ — left in boot() it would throw. Only §19a and the keys read the three (`app.sh.devById` registered for the keys).
   Side effect: ink's row 4 → 3 (its one forward name was popFace's `layout`). R2d's ink is the 51 lines before the rack-wiring seat now.
3. **The `/** KEYS.` doc comment, `keyState` and `keyHelp` (base :3011–3017) went to keys.js** (the brief: say which). Only the keys read
   `keyHelp`; `keyState` is read by kepler (boot, R2b's — through boot's destructure at the keys' seat, inside callbacks) and SPECTRUM
   (`app.sh.keyState` at use). keys.js registers `app.sh.keyState`, `app.sh.ACTIONS`, `app.sh.kt` in one line at its end.
4. **MENUS stays in notebook.js** — the notebook's row is 21 with it (no split needed; `lab/shell/menus.js` not made).
5. **`BUILD_LINE` is exported from rack.js** (`export const BUILD_LINE`): the notebook's ABOUT face and the exporter read it; notebook.js imports
   `{ TIER, BUILD_LINE } from '../rack.js'` (the accepted cycle — read only inside createNotebook, after rack.js' module body ran).
   `tools/perf/main-thread.mjs`' regex `/const BUILD_LINE = '…'/` still matches.

## 2 · `lab/rack.js` (3,605 → 2,448, −1,157), exact (base line numbers)

| where | what |
|---|---|
| imports | OUT in place: `:1` stage-gestures, `:2` scene-guard, `:3` frame-coalescer, `:5` projects, `:7` notebook-render, `:30` names, `:43` timeline/bind, `:45` keyboard, `:51` export3d, `:73` modulation/host (10 lines); `:83–85` (createRack, createMenubar, installWindowChrome) → ONE line, the four module imports; trimmed in place: `:27` (STYLE_NAMES, cameraEye), `:28` (fader, formula, chip), `:32` (infoActions) — **74 → 62 import lines, 23 names left rack.js** |
| `:89` | `const BUILD_LINE` → `export const BUILD_LINE` |
| `:193` | `app.sh.quality = quality;` + `app.sh.saveSettings / setFrost / KIND / RETIRED_WINDOWS / DIGESTS` (settings' returns the shell modules destructure; in settings' seat piece, so its registration) |
| `:684` | + `app.host.panBy = panBy;` and one new line after it: `app.host.camTravel / orbitBy / queueKeyOrbit / setDist / setFov / resetView / zoomAt` |
| `:1029` | STATE's seat + `app.w.clearRegister = clearRegister;` |
| after `:1033` | `app.w.toggleFullscreen / copyLatex / occupiedEigen / periodEnergies` (SPECTRUM's seat piece: its registration) |
| `:1675–1903` OUT | §12 → the transport seat: `/* ── transport strip (§25): lab/shell/transport.js (0.5.2 R3b), created here — λWAVES' own bar ── */` + `const { transport, togglePlay, setModArm, barLock } = createTransport(app);` |
| `:2239` | `const floats …` + `app.host.rackL / LAYOUT_SLOTS / floats / swClient`; one new line after it: `app.w.bowStart / bowMove / bowRelease / bowCancel / keplerDragTo` (§17, boot-kept; after R2b's kepler seat in the merged tree) |
| `:2291–3218` OUT | §18's last nine lines + §19a + §19b + §19a's second half + the KEYS comment … §23 (+ 2 blanks) → five seat lines: the rack-wiring header + `const { rk, layout, wTr, tablet, syncPhone, wireStage } = createRackWiring(app);` · the notebook header + `createNotebook(app);` · `wireStage();   // §19a's second seat …` · the keys header + `const { stageHasFocus, keyState } = createKeys(app);` |
| `:3221` | persist's seat + `app.sh.modSeats = modSeats;` |
| `:3225` | history's seat + `app.sh.historyApi = historyApi;` |
| `:3481` | `window.__LW = LW;` + `app.sh.LW = LW;` (the facade's own name: its registration) |

−1,157 moved −12 import lines +9 seat lines +3 fill lines = **−1,157** (the moved spans are 1,121 non-blank + 34 blank + 2 inter-span blanks).
**The three inherited boot fills left boot()**: `app.sh.setModArm` (→ transport.js), `app.sh.rk/layout/phone/tablet` (→ rack-wiring.js),
`app.sh.keyState` (→ keys.js). Three names stay imported but unread in rack.js ON PURPOSE — their lines sit beside R2b's likely import
hunks (`keplerOrbits`, `createGas`, `wellPacket`), and an edit there would conflict: `createKeyTable` (`:46`), `densityPeriod, densityPeriodExact,
fmtPeriod` (`:49`), `mdText` (`:67`). The integrator drops them after the merge (`node tools/rack-deps.mjs` lists them under "imports never
referenced").

## 3 · The modules, exact

| file | lines | moved (non-blank) | shape (not moved code) |
|---|---|---|---|
| `lab/shell/transport.js` | 233 | 223 | header 3 · 2 import lines · signature · hand-over 2 · return · brace = 10 (+ the registration line in place of the fill) |
| `lab/shell/rack-wiring.js` | 341 | 327 | header 3 · 2 import lines · signature · hand-over 4 · `function wireStage() {` + `}` · return · brace = 14 |
| `lab/shell/notebook.js` | 379 | 366 | header 3 · 5 import lines · signature · hand-over 3 · brace = 13 (no return: nothing it declares is read outside it) |
| `lab/shell/keys.js` | 217 | 205 (−1 fill) | header 3 · 3 import lines · signature · hand-over 3 · registration · return · brace = 13 |

Header + signature + return (+ brace): 6 / 6 / 5 / 6 — each ≤ 12. Every module ≤ 600.

**The hand-overs** (THE READ LAW: every module is seated after the controller; each name boot() makes before the seat is destructured once):
- transport: `{ dom, ui, reg, clock, appPlay, sturm } = app, { schedule } = app.loop, { saveSettings } = app.sh, { occupiedEigen, periodEnergies,
  shadowView } = app.w` · `{ keep, modHand, rotDriving, saveMod, scan, setKeepFrames } = app.ctl`.
- rack-wiring: `{ dom, ui, device, DEVICES, clock, obs, settingsStore, isPhone, isTablet } = app, { schedule, windowActivity } = app.loop` ·
  `{ camera, camTravel, floats, LAYOUT_SLOTS, orbitBy, panBy, rack, rackL, resetView, zoomAt } = app.host, { DIGESTS, quality, readSettings,
  RETIRED_WINDOWS, saveSettings, setFrost } = app.sh` · `{ bowCancel, bowMove, bowRelease, bowStart, kepler, keplerDragTo } = app.w` ·
  `{ field, look, occlusion, setGovernor, setKeepFrames } = app.ctl`.
- notebook: `{ dom, ui, reg, clock, obs, mat, settingsStore, isPhone } = app, { schedule } = app.loop, { floats, resetView, swClient } = app.host` ·
  `{ KIND, layout, readSettings, rk, saveSettings, winHint } = app.sh, { clearRegister, copyLatex, normalizeNow, toggleFullscreen } = app.w` ·
  `{ busy, busySync, cards, field, loadPreset, modSyncBases, occlusion, paintMarks } = app.ctl`; at use: `app.sh.{ACTIONS, kt, LW, save, restore,
  copyJSON, copyLink, serialize, modSeats, historyApi}` (persist, the links, the history, the keys and the facade are seated later).
- keys: `{ dom, ui, reg, clock, appPlay, obs, mat, settingsStore } = app, { schedule } = app.loop, { floats, panBy, queueKeyOrbit, rack, rackL,
  resetView, setDist, setFov } = app.host` · `{ barLock, devById, layout, readSettings, rk, setModArm, togglePlay, transport } = app.sh, { particles,
  shadowView, toggleFullscreen, wState } = app.w` · `{ domain, occlusion, touchState } = app.ctl`; at use: `app.sh.historyApi`.

## 4 · Lines

`lab/*.js` + `lab/shell/` + `lab/windows/` **27,856 → 27,873 (+17)** of the 27,943 cap (**70 left**). Exactly: the modules' shape +47 (headers 12,
imports 12, signatures 4, hand-overs 12, returns 3, braces 4) + wireStage's wrapper +2 + the seats +9 + the fills +3 + `sw.js` +4 (four precache
rows) = +65; OUT: 36 blank lines, 12 rack.js import lines = −48. Outside `lab/`: `tools/rack-deps.mjs` ±0 (two anchors re-pointed, comments),
`tests/project-formats.test.mjs` ±0 (the slice's parameters).

## 5 · The classes table, before and after (`node tools/rack-deps.mjs --classes`)

**Before** (`1d5b060`, rack.js `0d2e00c88597`, 38 pieces) and **after** (rack.js `e5898aee8155`, 38 pieces; module files measured (11): transport
seated at rack.js:1665 handed 17, rack-wiring :2055 handed 38, notebook :2057 handed 30, keys :2060 handed 32):

| module | lines | backward | forward | shared (bare) | app.state (another's) | **fwd + shared** | bare writes | hinge |
|---|---|---|---|---|---|---|---|---|
| transport (before) | 230 | 15 | 0 | 0 | 4 | **4** | 0 | ok |
| transport (after) | 236 | 15 | 0 | 0 | 4 | **4** | 0 | ok |
| rack-wiring (before) | 329 | 39 | 0 | 0 | 4 | **4** | 0 | ok |
| rack-wiring (after) | 344 | 36 | 0 | 0 | 4 | **4** | 0 | ok |
| notebook (before) | 389 | 28 | 10 | 0 | 11 | **21** | 0 | ok |
| notebook (after) | 381 | 27 | 10 | 0 | 11 | **21** | 0 | ok |
| keys (before) | 202 | 32 | 1 | 0 | 12 | **13** | 0 | ok |
| keys (after) | 220 | 29 | 1 | 0 | 12 | **13** | 0 | ok |
| ink (R2d's; before → after) | 60 → 51 | 6 | 1 → 0 | 0 | 3 | **4 → 3** | 0 | ok |
| boot (stays; before → after) | 285 → 287 | 0 | 55 → 65 | 0 | 11 | **66 → 76** | 0 | exempt |

- **The same names, class for class**: rack-wiring −3 backward (devById, rackCardWidth, popFace are its own now), notebook −1 (winHint is
  rack-wiring's file registration, not a boot name), keys −3 (keyState, keyHelp its own; devById from rack-wiring's file). The notebook's 10
  forward names are now spelled `app.sh.x` (persist, links, history, keys, facade — all seated after it). MENUS was NOT split out: 21 ≤ 25.
- boot +10 forward: the §17 fill line reads kepler's five functions bare and writes their five `app.w` slots (exempt). Every other row unchanged
  but SPECTRUM's line count (274 → 275, the fill line in its seat piece).
- **THE HINGE (G-G) HOLDS**: 0 bare writes; the largest moving module SPECTRUM at 24. **G-A (static) clean** (`app` at :146, 30 keys, the seven
  namespaces unchanged; no member outside the literal). `tests/rack-deps.test.mjs` GREEN ("11 module file(s) measured … the table keeps its 23 rows").

## 6 · The import fan-out

rack.js **74 → 62 import lines**; 23 names left it: `bindStageGestures, STAGE_BINDINGS, uiSpace, coalesce, createProjects, renderNotebook,
STYLE_NAMES, cameraEye, fader, formula, chip, orbitalName, infoActions, installTimeline, createKeyboardWindow, createExporter, SHAPE_EXPORTS,
barTempo, createRack, readLayout, rackLayoutLabel, createMenubar, installWindowChrome`. Imported by a module AND still by rack.js: `TIER`
(exported), `paintedRect, el, knob, readout, VIEW, VIEW_NAMES, STYLE, CAM, getHamiltonian, getZ, MOLECULE_BY_ID, PRESET_BY_ID, toLUT`.
transport.js 2 lines / 5 statements / 11 names; rack-wiring.js 2 / 7 / 9; notebook.js 5 / 16 / 20; keys.js 3 / 9 / 12 (packed several statements
a line, as rack.js' R3a line is). `TIER` and `BUILD_LINE` from `'../rack.js'` — the accepted cycle, read only inside the create functions.
`wiring.test` walks them (node gate). Nothing under `lab/mir/**`.

## 7 · The `app.sh` registrations and the boot fills

- **Registered by my modules at creation**: transport.js → `app.sh.transport, togglePlay, setModArm, barLock` (KEYS destructures all four;
  SETTINGS reads `setModArm` at use); rack-wiring.js → `app.sh.rk, layout, phone, tablet, winHint, devById` (notebook, keys, history, persist);
  keys.js → `app.sh.keyState, ACTIONS, kt` (SPECTRUM and KEPLER at use, the notebook's MENUS at use). notebook.js registers nothing.
- **Boot fills I wrote** (a slot my modules read whose owner is still in boot() or an unmovable file; each after its owner's declaration or
  appended to its seat line): `app.sh.saveSettings, setFrost, KIND, RETIRED_WINDOWS, DIGESTS` (settings.js can't be edited: on its seat
  piece's `quality` line), `app.host.panBy, camTravel, orbitBy, queueKeyOrbit, setDist, setFov, resetView, zoomAt` (the camera law),
  `app.w.clearRegister` (STATE's seat), `app.w.toggleFullscreen, copyLatex, occupiedEigen, periodEnergies` (SPECTRUM's seat; spectrum.js can't be
  edited), `app.host.rackL, LAYOUT_SLOTS, floats, swClient` + `app.w.bowStart, bowMove, bowRelease, bowCancel, keplerDragTo` (§17),
  `app.sh.modSeats` (persist's seat), `app.sh.historyApi` (history's seat), `app.sh.LW` (`window.__LW = LW;`). **31 slots, 3 new lines** (the rest
  appended to existing lines). **No inherited fill stays in boot().** Every slot is filled exactly once (grepped across `lab/`).

## 8 · The light check (this tree 9093/5563; the base export 9097/5567 beside every rig red, once)

| gate | this tree | the base (`1d5b060`) | reading |
|---|---|---|---|
| `bash test.sh node` | **exit 0** (`project-formats` 8, `first-run` 0 of 12 failing, `access` 0 of 11, `rack-deps`, `wiring`, `ink` 17, `auto-scale` 23/23, `new-project`, `keyboard-shortcuts`, pwa) | — | GREEN |
| `node tests/pwa.test.mjs --write` | after the lab edit | — | GREEN |
| `lw-facade` | **1/1** (176 members, names, kinds, order) | — | GREEN |
| `menubar` | 4 PASS, then `:143` — the quick SAVE also wrote `lambdawaves.q0.session` | **identical** (4 PASS, `:143`, the same three keys) | the rig (the session's flush lands inside the row); a scratch copy tolerating that one key reads **8/8** on this tree |
| `keyboard-window` | **8 PASS, GREEN** (block 8's reload held this time) | not run (the brief records it red on the base: marionette) | GREEN |
| `keyboard-shortcuts` (node) | all PASS | — | GREEN |
| `timeline` | **14/14** | — | GREEN |
| `offer` | **16/16** | — | GREEN |
| `history` | 20 PASS, then `:248` (3b: the held route did not move the stage) | 38 PASS, then 9b "MOLECULES ON is covered" | the rig (frame-paced waits; R3a's readings, the same two places) |
| `new-project` + `--check` | **8/8**; `--check` in step (16,117 B) | — | GREEN |
| `frame-occlusion` | red at `:41:68` (`chipGap`) | **identical** | the rig |
| `hit-probe-set` | control FAIL "html ×81", then "Render did not settle" | **identical** | the rig (0 reached unreadable both sides) |
| `settings-probe` | boot 716 · WAVE DANCER 752 · WATER 736 · BENZENE 736 GREEN, reloads byte-identical; N₂ "Failed to decode response from marionette" → "1 of 6 red" | the same four GREEN with the same blobs; N₂ "Render did not settle" → "1 of 6 red" | **0 scenes judged red on the four reached**; the rig |
| `serialize-bytes` | **11/11 full + 11/11 edit**, 0 page errors | the base export's own run: **11/11 sha-identical to this tree**; and to R1's recorded base (`r1-measure/sb-base.json`) | GREEN |
| the boot suite's blocks (chunk runner; `.tmp/blocks.mjs`: B11, B21, B28, B38, B44, B47–B49, B52–B53, B60, B69–B72, B74, B80, B86, B90–B92, B94; B1 ×2 + B43 in the preamble) | **22/29** — B1 ×2, B43, B11 ×4, B21 ×2, B28, B38, B44, B48, B49, B52, B53, B72, B74, B80, B86, B90, B94 GREEN; RED B47 (`bottomSeat`), B60 (`tAfter 0`), B69, B70, B71 (the notebook the chunk left open covers the phone's targets), B91, B92 | **23/29** — the same verdicts but B91 GREEN | B91 re-run once with B90–B92 + B104 (+ the `goPainted`/`w57goto` helpers): **6/7 on BOTH trees, identically** — B91's `foldTurns` reads the kit's chevron 250 ms after a fold, mid-transition on a 2–3 fps rig (`matrix(1,0,0,1)` both); **B104 (the keyboard trap) GREEN on both** |
| `node tools/rack-deps.mjs --classes` | §5; `tests/rack-deps.test.mjs` GREEN | — | the hinge holds |

THE LOCK is not this row's: the loop reads the same closure slots (`transport`, `wTr`, `tablet`, `layout` are destructured at the seats; the
transport's `update()` is the same function).

## 9 · Brief candidates (PAIR 3 / R5 / the integrator)

1. **A boot-side TDZ is the new hazard of a module that is created eagerly and calls back into boot().** `popFace` (§18) read boot's
   `layout` while createRackWiring was still running. Any boot-kept function a module calls DURING its creation must not read a name that
   module returns. R2d (ink, the modulation seam) and R5 (the facade) should grep their spans for calls made at creation into boot functions.
2. **Ink's `devById`, `rackCardWidth`, `popFace` are §19a's now** — R2d's ink is §18's occlusion host alone (51 lines, row 3).
3. **Three unused imports in rack.js wait for the merge** (`createKeyTable`, `densityPeriod`/`densityPeriodExact`/`fmtPeriod`, `mdText`) — left
   to keep R2b's import hunks from touching mine.
4. **settings.js and spectrum.js return names no module registers**: five settings returns (`saveSettings, setFrost, KIND, RETIRED_WINDOWS,
   DIGESTS`) and four SPECTRUM returns (`toggleFullscreen, copyLatex, occupiedEigen, periodEnergies`) and STATE's `clearRegister` are boot fills on
   their seat lines. When those files are next opened, the fill becomes their registration (−2 lines).
5. **The boot suite's chunks are order-dependent**: B69–B71 read red in any chunk that ran B47/B49 without the blocks between (the notebook stays
   open over the phone's targets) — on both trees. R-V's whole-suite run is the real reading.
6. **`menubar`'s FILE block counts the session key** when the session's debounced flush lands inside the quick-save row (`:143`, both trees on
   this rig). A test that wants "exactly its two keys" could mask `lambdawaves.q0.session` (a tests/ change, not mine to make).

## 10 · Merge notes (for the integrator)

- **The seats** (this tree): `rack.js:1665–1666` transport (header + `const { transport, togglePlay, setModArm, barLock } = createTransport(app);`);
  `:2055–2056` rack-wiring (header + `const { rk, layout, wTr, tablet, syncPhone, wireStage } = createRackWiring(app);`); `:2057–2058` notebook
  (header + `createNotebook(app);`); `:2059` `wireStage();`; `:2060–2061` keys (header + `const { stageHasFocus, keyState } = createKeys(app);`).
  **What boot() destructures**: transport 4, rack-wiring 6, keys 2 (the names the loop, the facade, the boot tail, kepler and the modulation piece
  read). `tools/rack-deps.mjs` PLANNED_CUT: the notebook row anchors `/^ {2}\/\* ── §19b the skip links/`, §19a's second piece `/^ {2}wireStage\(\);/`.
- **Against R2b**: my rack.js hunks are the imports (`:1–7`, `:27–32`, `:43–45`, `:51`, `:73`, `:83–85`, `:89`), `:193`, `:684`, `:1029–1033`
  (STATE/SPECTRUM seats — nine unchanged lines before R2b's `// SHADOW`), `:1675–1903` (R2b's kept tail `:1659–1673` untouched between),
  `:2239` (§17, nine lines after R2b's kepler span), `:2291–3218`, `:3221`, `:3225`, `:3481`. None is inside R2b's spans; no import line I touch
  is adjacent to one R2b must edit. **The §17 kepler-fill line reads `bowStart, bowMove, bowRelease, bowCancel, keplerDragTo` from boot():** R2b's
  kepler seat must keep destructuring them (`keplerDragTo` is read by nothing else in boot() after my move — if R2b's seat does not hand it back,
  or registers these five on `app.w` itself, drop or trim my line). `keyState` is now a const from the keys' seat: R2b's kepler reads it bare (or
  `app.sh.keyState` once moved) inside callbacks — both work.
- REPORT.md: R2b's wave 219 and this 220 both append at the end. `lab/sw.js`: re-run `node tests/pwa.test.mjs --write` on the merged tip.

## 11 · The drafted CLAUDE.md sentence (for the integrator; NOT applied)

> THE SHELL (0.5.2 R3b): λWAVES' transport strip is `lab/shell/transport.js` `createTransport(app)` (`setModArm` a function declaration inside
> it); §19a is `lab/shell/rack-wiring.js` `createRackWiring(app)` — createRack, the layout verbs (aliases over the kit's rack; captureLayout's v3
> the WORKSPACE record), the TRANSPORT card, the phone and tablet crossings — with TWO seats: the module at §19a's, and its returned `wireStage()`
> (the crossings' listeners and the stage gestures) right after the notebook's, where those statements stood; §19b (the skip links, the dock chip,
> MENUS and the kit's menubar, THE NOTEBOOK, PROJECTS whole) is `lab/shell/notebook.js` `createNotebook(app)`; §20–§23 (keyState, the ACTIONS rows,
> the KEYBOARD window, THE TIMELINE, the tab order) is `lab/shell/keys.js` `createKeys(app)` — moved verbatim, each destructuring what boot()
> made before its seat and reading persist's, the history's, the keys' and the facade's names through `app.sh` at use. A boot function a module
> calls while it is being created must not read a name that module returns (popFace moved with §19a for that).

## 12 · What Josh will see

**Nothing.** The work: `serialize-bytes` 11/11 full and 11/11 edit sha-identical to the base export run beside it (and to R1's recorded base) —
a project, a link and an undo row are the same bytes. The browser's memory: `settings-probe` the same four blobs (716 / 752 / 736 / 736 B) with
byte-identical reloads on both trees. The facade: `lw-facade` 1/1 (176 members, kinds, order). The bar and the menus: `menubar` 8/8 with the rig's
session flush tolerated, the same red as the base without it; `timeline` 14/14; `offer` 16/16; `keyboard-window` green. The rack, the layout, the
phone crossing, the keys and the notebook: the boot suite's 29 laws read law for law as the base (the one difference re-read identical). The code:
1,101 of 1,121 moved lines byte-identical, the other 20 the same expressions read through a slot or a fill made a registration; every
`device()` / `appendChild` / `register` call and every listener in the order it had.
