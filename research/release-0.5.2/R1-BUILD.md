# R1-BUILD · THE CONTROLLER (0.5.2 "Rack Dissolution"; Opus 5.5 builder; alone, second)

Base `86968b7` (`yan-c` = R0 THE CONTEXT merged). Worktree `.claude/worktrees/agent-a95ee74e08fc0dd64`, branch
`worktree-agent-a95ee74e08fc0dd64`. Ports 9053/5523 (this tree) and 9057/5527 (the base, `git archive 86968b7` into `.tmp/base`,
served with the default certificate directory). The rig: one RTX 3070. Josh's desktop Firefox (pid 2002078, `firefox`, no marionette)
was up the whole session and was never touched. The other gate servers (8721/8731/8751/8755) were not mine and were not touched.

## 1 · The ledger

| step | commit | what | result |
|---|---|---|---|
| 1 | `00c75bf` | `tools/rack-deps.mjs` learns the module files (`measureFile`, `moduleSources`; `scopeWalk(…, { root })`); `tests/rack-deps.test.mjs` §5 | on the base tree `--classes --verbose` is byte-identical to before; §5 11 laws GREEN |
| 2 | `62e61e0` | THE MOVE: §2–§4 + §7 → `lab/shell/controller.js` `createController(app)`, called at §2's seat; PLANNED_CUT drops §7's row; the worker-road needles; `pwa --write` | node gate exit 0 |
| 3 | (this) | the lock, the pair, the estate, the boot suite, the probes; this file; REPORT wave 216 | §2–§8 below |

### `lab/rack.js` (4,958 → 4,664 lines, −294), exact

| where (this tree) | what |
|---|---|
| `:79` | `import { createController } from './shell/controller.js';` takes `createWorkerPool`'s line |
| imports, 6 lines OUT | `createFrameBudget` (frame-budget.js), `localStore` (mir/modulation/bind.js), `jsonStore` (mir/core/prefs.js), `createModPort` (mod-port.js), `createBusyMark` (busy-mark.js), `createWorkerPool` (worker-pool.js) |
| imports, 4 lines trimmed | `createOcclusion` off occlusion.js' line (`paintedRect` stays), `createField` off field.js', `warmStep as kickWarm, tablesReady as kickReady` off kick.js', `createLook` off look.js' (`CARD_GROUND` stays) |
| `:160` | `const app = {` — the literal is untouched (it moved up 5 lines with the imports) |
| `:266` | `app.sh.lookSync = lookSync;` — right after §1's `function lookSync` |
| `:334` | `app.sh.quality = quality;` — right after §1's `const quality` |
| `:335–339` | **THE SEAT**: one section header (`/* ── ONE CONTROLLER · FIELD · THE MATHS WORKERS · ONE ROAD: lab/shell/controller.js (0.5.2 R1), created here; the loop stays below ── */`) and `const { autoQ, … , api } = await createController(app);` — the 68 names, four lines at 200 columns |
| `:365` | `app.loop.page = page;` (§5) |
| `:470` | `app.loop.windowActivity = windowActivity;` (§6) |
| `:815` | `app.loop.paceRate = paceRate;` (§6, after `createMotionPref()`) |
| `:1339`, `:1422`, `:1433` | `app.w.wSpec = wSpec;`, `app.w.spectrum = spectrum;`, `app.w.normalizeNow = normalizeNow;` (SPECTRUM; the last after the function's closing brace) |
| `:1597` | `app.w.shadowView = shadowView;` (SHADOW) |
| `:1910` | `app.w.wMet = wMet;` (METERS) |
| OUT | base `:338–570` (§2–§4, 233 lines) and `:1045–1115` (§7, 70 lines + its trailing blank) |

−303 moved −1 blank +5 seat +10 fills −6 import lines +1 import line = **−294**.

### `lab/shell/controller.js` (new, 339 lines), exact

| lines | what |
|---|---|
| 1–9 | the header comment (what it holds, what it reads of boot, the U1 note on `saveMod`, the TIER cycle) |
| 10–25 | 16 import lines (§4 below) |
| 27 | `export async function createController(app) {` |
| 28–30 | the hand-over: `const { dom, ui, reg, clock, appPlay, mat, rates, energyOf, sturm, settingsStore, PAL_DEF, LOOK_DEFAULTS } = app;` · `const { lookSync, quality } = app.sh;` · `const { schedule, refModes } = app.loop;` |
| 31–263 | base `:338–570` (§2 ONE CONTROLLER, §3 FIELD, §4 THE MATHS WORKERS), two-space indentation kept, headers and comments with them |
| 265–334 | base `:1045–1114` (§7 ONE ROAD) |
| 335–338 | `return { autoQ, … , api };` — the same 68 names |

**Verbatim, proved** (`.tmp/verbatim.mjs`, line by line against the base): of the 303 moved lines **293 are identical** and 10 differ —
nine forward reads (`windowActivity` → `app.loop.windowActivity` in `may`; `wMet` → `app.w.wMet` in the mod port's `say`; `page` →
`app.loop.page` in `warmKick`; `paceRate` → `app.loop.paceRate`, `spectrum` → `app.w.spectrum`, `shadowView` → `app.w.shadowView`
in `loadPreset`; `spectrum` in `api.select`; `normalizeNow` → `app.w.normalizeNow` in `api.normalize`; `wSpec` → `app.w.wSpec` in
`api.setRate`) and one path (`new URL('./mathworker.js', import.meta.url)` → `'../mathworker.js'`: the module sits in `lab/shell/`,
the URL is the same file). Every read of a forward name is inside a callback, as it was (the tool's eager-TDZ count was 0 before).

**The shape, as R0 made it.** The 29 controller-owned `app.state` members stay `app.state.x`, their seats travelling with their code
(`app.state.playedLast = false` … `app.state.warmTimer = 0; app.state.warmIdle = 0`); none is destructured. `saveMod` stays a function
declaration inside `createController` (U1: the mod port is handed it before its line). The loop §5–§6, `schedule`, `filmHold`, §13–§14
stay in `boot()`. The frame path reads the same closure slots (the 68 destructured consts), so nothing on it changes shape.

**`app.ctl` is not filled.** The 68 crossing names go back to `boot()` by the return and the seat's destructure; every reader of them
is still in `boot()` (the stay-pieces and the modules that have not moved), so no reader outside the module needs `app.ctl` and a fill
would be a dead store (R0's law). The slots R1 DOES fill are the ones the controller reads: `app.loop.page / windowActivity / paceRate`,
`app.w.wMet / wSpec / spectrum / shadowView / normalizeNow` (each right after its declaration in `boot()`) and `app.sh.lookSync /
quality` (before the seat). `schedule` and `refModes` were already by value in `app.loop`.

**The seat's timing.** `createController` runs where §2 began and awaits `createField` where §3 did, so the order of every eager
statement is the base's. The one difference: the twelve function declarations it hands back (§2's `controlStep`, `may`, `unpark`,
`setGovernor`, `setKeepFrames`, `setPerfMode`, `setRotationRate`, `rotStep`, `saveMod`; §7's `touchState`, `loadPreset`,
`setReference`) were hoisted to the top of `boot()`; in `boot()` they are now consts from the seat. U1 (R0) showed no boot code calls
one before §2's line.

## 2 · The tool's new mode (`tools/rack-deps.mjs`, commit `00c75bf`)

`node tools/rack-deps.mjs --classes` now reads, besides `lab/rack.js`, every `lab/shell/*.js` and `lab/windows/*.js`. Each file must
be a planned module's (`PLANNED[m].file`; an unplanned file is refused) and hold ONE top-level `create<X>(app)`; its body is measured
as a piece of that module:
- **the hand-over** — `const { a, b: c } = app` / `= app.<ns>` at the root's statement level — names boot-level names by KEY, each
  classed backward or forward by where `boot()` declares it against the module's seat (its first piece in rack.js); `dom` and `ui` are
  not crossing names (as in rack.js);
- **an `app.<ns>.x` chain** counts as it does in rack.js (`state` live, the others forward), except a module's fill of its OWN name
  (`app.w.wSpec = wSpec`, in rack.js or a file), which is its registration — so SPECTRUM stays at 24 with the three fills R1 put in it;
- **the file's eager `app.state` writes** are seats at its call, in file order (ownership is unchanged by the move: the controller still
  owns its 29);
- **G-A** checks the file's chains against the literal, and refuses a destructured slot the literal holds as null unless `boot()` fills
  it eagerly before the seat (`app.sh.quality` is filled at `:334`, so it may be handed; `app.loop.page` may not);
- **crossing names** run both ways across the file, a read through a slot (`app.loop.page`) counting as a bare one did.

A moved module keeps a SEAT piece in `PLANNED_CUT` (its header and the call) — the tool refuses a file without one — and drops the
anchors of the pieces that left: R1 kept `ONE CONTROLLER` (it matches the seat's new header) and dropped `state mutations: ONE road`.
The table keeps its 23 rows. `tests/rack-deps.test.mjs` §5 is the law (a fixture boot + controller: handed names, chains, the file's
seat, the registration rule, the null-slot stray, an unplanned file refused; then the real tree's 23 rows).

## 3 · The classes table, before and after (`node tools/rack-deps.mjs --classes`)

**Before** (`86968b7`, rack.js `c72dad06cbda`, 39 pieces): the controller row `305 | 12 | 10 | 0 | 2 (+29 own) | **12** | 0 | ok`.

**After** (this tree, rack.js `78281bac6006`, 38 pieces; `module files measured (1): lab/shell/controller.js → controller
(createController(app), 339 lines, seated at rack.js:335, handed 16)`):

| module | row → file | lines | backward | forward | shared lets (bare) | app.state (another scope's) | **fwd + shared** | bare writes to another scope's let | hinge |
|---|---|---|---|---|---|---|---|---|---|
| boot (stays) | — → `lab/rack.js` | 283 | 0 | 56 | 0 (+1 boot-kept) | 11 | **67** | 0 | exempt |
| loop (stays) | — → `lab/rack.js` | 487 | 41 | 49 | 0 | 27 (+4 own) | **76** | 0 | exempt |
| settings | R3a → `lab/shell/settings.js` | 144 | 7 | 13 | 0 | 2 (+2 own) | **15** | 0 | ok |
| controller | R1 → `lab/shell/controller.js` | 345 | 12 | 10 | 0 | 2 (+29 own) | **12** | 0 | ok |
| material | R2c → `lab/windows/material.js` | 131 | 11 | 0 | 0 | 1 (+4 own) | **1** | 0 | ok |
| settings-card | R2c → `lab/windows/settings.js` | 178 | 21 | 1 | 0 | 4 | **5** | 0 | ok |
| film | R2c → `lab/windows/film.js` | 21 | 5 | 3 | 0 | 3 | **6** | 0 | ok |
| state | R2a → `lab/windows/state.js` | 170 | 13 | 6 | 0 | 2 | **8** | 0 | ok |
| spectrum | R2a → `lab/windows/spectrum.js` | 253 | 18 | 15 | 0 | 9 | **24** | 0 | ok |
| readouts | R2b → `lab/windows/readouts.js` | 141 | 14 | 4 | 0 | 3 (+1 own) | **7** | 0 | ok |
| molecules | R2d → `lab/windows/molecules.js` | 97 | 18 | 3 | 0 | 5 (+6 own) | **8** | 0 | ok |
| stage-words | R2d → `lab/shell/stage-words.js` | 123 | 4 | 2 | 0 | 2 (+1 own) | **4** | 0 | ok |
| modulation | R2d → `lab/shell/modulation.js` | 247 | 19 | 1 | 0 | 9 | **10** | 0 | ok |
| transport | R3b → `lab/shell/transport.js` | 229 | 15 | 0 | 0 | 4 | **4** | 0 | ok |
| kepler | R2b → `lab/windows/kepler.js` | 294 | 15 | 1 | 0 | 3 (+7 own) | **4** | 0 | ok |
| ink | R2d → `lab/shell/ink.js` | 60 | 6 | 1 | 0 | 3 | **4** | 0 | ok |
| rack-wiring | R3b → `lab/shell/rack-wiring.js` | 327 | 39 | 0 | 0 | 4 | **4** | 0 | ok |
| notebook | R3b → `lab/shell/notebook.js` | 389 | 28 | 10 | 0 | 11 | **21** | 0 | ok |
| keys | R3b → `lab/shell/keys.js` | 202 | 32 | 1 | 0 | 12 | **13** | 0 | ok |
| persist | R3a → `lab/shell/persist.js` | 294 | 49 | 0 | 0 | 13 (+1 own) | **13** | 0 | ok |
| links | R3a → `lab/shell/links.js` | 78 | 5 | 0 | 0 | 3 (+1 own) | **3** | 0 | ok |
| history | R3a → `lab/shell/history.js` | 158 | 11 | 0 | 0 | 4 (+1 own) | **4** | 0 | ok |
| facade | R5 → `lab/shell/facade.js` | 255 | 121 | 1 | 0 | 21 | **22** | 0 | ok |

THE HINGE (G-G): bare writes across scopes 0; the largest moving module spectrum at 24 (limit 25) → HOLDS

**The diff is line counts only**: controller 305 → 345 (the 6-line seat piece + the 339-line file), loop 484 → 487, settings
142 → 144, spectrum 250 → 253, readouts 139 → 141 (the fills). **Every class count is the base's**: the controller backward 12
(LOOK_DEFAULTS, PAL_DEF, appPlay, clock, energyOf, lookSync, mat, quality, rates, reg, settingsStore, sturm), forward 10 (refModes,
schedule, loop.paceRate, loop.page, loop.windowActivity, w.normalizeNow, w.shadowView, w.spectrum, w.wMet, w.wSpec — the same ten names
as before, now through their slots), shared 2 (history, stageText), own 29, **fwd + shared 12 ≤ 25, 0 bare writes**. THE HINGE HOLDS
(SPECTRUM 24 the largest); 0 shared lets bare; G-A clean (`app` at `:160`, 30 keys, the same seven namespaces). The crossing names:
237 both trees, the same names with the same users (the 12 controller functions now read `const`, so "hoisted declarations" 70 → 58).

**rack.js' section list** (`node tools/rack-deps.mjs --no-write`): 31 → 28 sections; **§2 is the seat, 6 lines** ("ONE CONTROLLER ·
FIELD · THE MATHS WORKERS · ONE ROAD: lab/shell/contr…"); §3 FIELD, §4 THE MATHS WORKERS and §7 ONE ROAD are no longer rack.js
sections. Imports never referenced: none.

## 4 · The import fan-out

`lab/rack.js` **80 → 75 import lines** (6 out, 1 in, 4 trimmed). `lab/shell/controller.js` **16 import lines, 19 names**:
- **11 that left rack.js** (only §2–§4/§7 used them): `createFrameBudget`, `createOcclusion`, `createField`, `kickWarm`, `kickReady`,
  `localStore`, `jsonStore`, `createModPort`, `createBusyMark`, `createWorkerPool`, `createLook`;
- **7 imported by both** (rack.js' other sections still use them): `BASIS`, `PRESET_BY_ID`, `VIEW`, `PALETTE_BY_ID` (`PRESET_BY_ID as`,
  mir/palette.js), `rgbToHex`, `getHamiltonian`, `mdText`;
- **`TIER` from `'../rack.js'`** — a cycle (rack.js → controller.js → rack.js). It is safe: the controller reads TIER only inside
  `createController`, which `boot()` calls long after both modules have evaluated; `wiring.test` walks it (236 nodes, 758 edges).

Out of `lab/`: the worker road's needles follow it — `tests/pwa.test.mjs` and `tools/build-deploy.mjs` assert `'../mathworker.js'` in
`shell/controller.js` (was `'./mathworker.js'` in `rack.js`); `tests/wiring.test.mjs`' header names the new place. No law weakened.

**Lines.** `lab/*.js` (with `lab/shell/`) **27,693 → 27,739 (+46)** = the module's shape +36 (339 − 303: header 9, imports 16, blank 1,
signature 1, hand-over 3, the blank between the spans 1, return 4, brace 1) + the seat 5 + the fills 10 − rack.js' imports 5 + sw.js 1
(the precache row). `lab/rack.js` 4,664 (cap 1,500 at the cut, ≈ 900 planned); the module 339 (≤ 600). The brief said ≈ +20: the
import fan-out (16 lines), the 68 names twice (8 lines) and the ten fills are the difference. Under G-L (≤ 28,219 at any merge).

## 5 · THE LOCK (G-D)

`LW_PORT=9053 GD_PORT=5523 node tools/perf/digest-lock.mjs --check --query gastab=0` → **860 values · 0 readback · 0 record-byte
differences**, page errors 0, 57 s; the same with `--fixture research/release-0.4.0/measure/digest-lock-s4a.json` → **1004 · 0/0**,
57 s. Both green on their first run (the rig quiet: `wait-gpu` free, load 0.7 and 1.16).

## 6 · THE PAIR (G-M)

`tools/perf/main-thread.mjs --runs 1` through R0's `.tmp/pairs.mjs`: per round A-boot · B-boot · A-D1 · B-D1, 5 rounds, A = the base
(9057), B = this tree (9053); before every run no chrome / geckodriver / headless Firefox, `wait-gpu` free, then 4 s (load 0.6–1.7).
All 20 runs: `field ok · NVIDIA GeForce RTX 3070`, `notice dismissed`, 0 held frames; every D1 run answered `{ mol: true, view:
'orbital', homo: 5, auto: true, stage: true }`. Medians (spread) in ms/s:

| | boot scene (the device report's long play: 30 s of PLAY, as found) | D1 scene (H₂O · ORBITAL · HOMO · AUTO-ROTATE · STAGE TEXT, `--sweep 10`) |
|---|---|---|
| base `86968b7` | 43.488 (1.466) — 42.492 · 43.488 · 43.621 · 43.958 · 43.224 | 65.243 (5.269) — 65.243 · 64.660 · 64.752 · 69.929 · 66.079 |
| this tree | 43.532 (1.210) — 43.886 · 43.532 · 43.638 · 42.784 · 42.676 | 65.400 (2.578) — 65.400 · 64.528 · 66.796 · 64.218 · 66.603 |
| **Δ** | **+0.044 · PASS** (≤ 3.536) | **+0.157 · PASS** |
| script (median) | 17.114 → 16.808 | 19.906 → 19.743 |

Expected ≈ 0 and found ≈ 0: the loop reads the same closure slots. The boot scene IS the device report's long play (MEASURE.md §1: the
instrument's scene is `tools/perf/device-report.js`' 30 s play, UI shown, 1600 × 1000): 748–764 presents in 30 s on both trees.
(`main-thread.mjs`' `served.rackSha256` reads `bbbaf5e6fdcc8fd7` for this tree while `sha256sum` reads `78281bac…`: the tool hashes a
string built from the response's chunks, so a multi-byte character that straddles a chunk changes it — an identifier, not a defect of
the tree; candidate 6.) Raw: `research/release-0.5.2/r1-measure/pair/`.

## 7 · The suites (this tree, `LW_PORT=9053 GD_PORT=5523`, one browser at a time on a quiet rig)

| suite | count | verdict |
|---|---|---|
| `bash test.sh node` | exit 0 (82 suites; `rack-deps` with §5, `pwa` re-pointed, `wiring`) | GREEN |
| `node tests/auto-scale.test.mjs` | 23/23 (its `controlStep` and `effectiveRes` slices now come from `lab/shell/controller.js`, the loop's from rack.js — each whole in one file) | GREEN |
| `node tests/render-exact.test.mjs` | 0 failing of 40 | GREEN |
| `node tests/window-activity.test.mjs` | GREEN | GREEN |
| `node tests/pwa.test.mjs --write` | after every `lab/` edit; the controller precached | GREEN |
| the browser estate (`.tmp/estate.mjs`: all 35 `tests/*.browser-test.mjs`, a red re-run once alone) | camera-shift · chem 55 · **current 15** · curves · export3d · field-molecule · film-handover · **frame-occlusion 7** · gpu-recovery (see below) · **history 44** · input · keyboard-window (see below) · latex-copy · lfo-tension · library · **lw-facade 1/1** · lw-links · menubar · **mir-controls 2** · molecular-diff 15 · molecular-names · molecule-demos · molecule-head · **new-project 8** · **offer 16** · official-defaults-palette · opener 7 · orbitals 24 · project-formats 5 · register 17 · **render-regressions 2** · **routed-knob 4** · stage-text · **take-in-bugs 4** · timeline 14 | **34 of 35 GREEN** |
| `keyboard-window.browser-test` | 7 PASS, then the in-session reload (`go(url)` in block 8) dies: `POST …/url -> 500 "Failed to decode response from marionette"`, twice | **RED on the BASE too, identically** (`86968b7` on 9057/5527, twice) — the rig's, not R1's; R0 had it green on 10-09 |
| `gpu-recovery.browser-test` alone (Josh's desktop Firefox UP) | tree: 3 of 5 attempts green (the reds: "Render did not settle: animation frames stopped" after a reload, cycle 1–2); base: 1 of 3 green, the same message | the base's flake, the same reading both ways |
| `latex-copy.browser-test` | GREEN this time (R0 read it red on the base) | GREEN |
| `tests/legacy/boot.browser-test.mjs` alone (twice: the estate runner re-runs a red) | **151/152 both runs** — B149 the only red; B6, B22, B23, B108 (`createField(dom.canvas, {` … `onLost:` now read from `lab/shell/controller.js` through `appFiles()`), B112, B136 GREEN; B69 GREEN both runs | **B149 the only LAW red** |
| `tools/serialize-bytes.mjs` base (9057/5527) vs tree (9053/5523) | **11/11 full + 11/11 edit sha-identical**, 0 page errors either side (the four demos, NEW, six history rows) | GREEN |
| `tools/settings-probe.mjs` | tree, twice: **5 of 6 scenes GREEN, 0 judged red** (boot, WAVE DANCER, WATER, BENZENE, N₂ — blobs 716 / 752 / 736 / 736 / 736 B, reloads byte-identical); the sixth (NEW) never ran — the driver died first, `POST …/execute/async -> 500 "Failed to decode response from marionette"`. The BASE dies the same way, earlier (after BENZENE, 4 of 6 green). The rig: snap Firefox 157.0.1 loses marionette after ~5 in-session reloads (keyboard-window's block 8 is the same death); NEW's road is covered by `new-project` 8/8 | no scene red; the 6th unreached on both trees |
| `node tools/new-project.mjs --check` · `node tests/new-project.test.mjs` | in step (16117 B) · GREEN | GREEN |

## 8 · Brief candidates (for R2 / R3 and the integrator)

1. **`app.ctl` stays null after R1 — the union the pair rows will read** (measured with the module-file mode on this tree:
   `classes(rack.js).crossNames` owned by the controller, by reading module; `.tmp/ctlunion.mjs`). Every reader of a controller name
   is still in `boot()`, so R1 fills none. When a row moves a reader it must read `app.ctl.x` — backward (destructured once at its
   creation) for every module seated after §2, **forward (read live, inside callbacks) for §1 SETTINGS (R3a)**, which runs before the
   seat. Per planned moving module, the `app.ctl` names it reads:

   | module | row | n | the `app.ctl` names it reads (the ctl literal's order) |
   |---|---|---|---|
   | settings | R3a | 11 | gov, keep, perf, setGovernor, setKeepFrames, setPerfMode, MOD, modStore, saveMod, look, field |
   | material | R2c | 5 | mod, modHand, applyAccent, field, setReference |
   | settings-card | R2c | 12 | domain, fieldRate, setGovernor, setKeepFrames, setPerfMode, modHand, modStore, curvesStore, look, applyAccent, paintMarks, field |
   | film | R2c | 3 | rotDriving, rotStep, field |
   | state | R2a | 5 | modHand, ROT_LIMIT, setRotationRate, touchState, loadPreset |
   | spectrum | R2a | 7 | rotRate, busy, busySync, warmArm, touchState, setReference, api |
   | readouts | R2b | 5 | domain, cardLoading, solveCard, touchState, api |
   | molecules | R2d | 3 | cardLoading, field, solveChem |
   | stage-words | R2d | 1 | paintMarks |
   | modulation | R2d | 8 | mod, modHand, setKnob, ROT_LIMIT, rotRate, setRotationRate, occlusion, applyAccent |
   | transport | R3b | 6 | keep, setKeepFrames, modHand, rotDriving, saveMod, scan |
   | kepler | R2b | 4 | domain, field, maths, touchState |
   | ink | R2d | 2 | occlusion, field |
   | rack-wiring | R3b | 5 | setGovernor, setKeepFrames, occlusion, look, field |
   | notebook | R3b | 8 | modSyncBases, occlusion, paintMarks, busy, busySync, field, cards, loadPreset |
   | keys | R3b | 3 | domain, occlusion, touchState |
   | persist | R3a | 9 | domain, modSyncBases, modGets, rotRate, setRotationRate, applyAccent, markBatchBegin, markBatchEnd, setReference |
   | history | R3a | 1 | rotDriving |
   | facade | R5 | 42 | autoQ, gov, effectiveRes, READER_LAW, keep, domain, fieldRate, perf, setGovernor, setKeepFrames, setPerfMode, stats, mod, MOD, modHand, modGets, modKnobs, modHeld, ROT_LIMIT, rotRate, rotDriving, setRotationRate, look, paintMarks, wheelColor, accent, inkCtx, markInk, stageGround, busyWrap, busyFlash, busy, busySync, busyHost, field, maths, scan, cards, touchState, loadPreset, setReference, api |

   **THE UNION: 56 names — autoQ, gov, effectiveRes, READER_LAW, keep, domain, fieldRate, perf, setGovernor, setKeepFrames, setPerfMode, stats, mod, MOD, modSyncBases, modHand, setKnob, modGets, modKnobs, modHeld, ROT_LIMIT, rotRate, rotDriving, setRotationRate, rotStep, modStore, saveMod, curvesStore, occlusion, look, applyAccent, paintMarks, markBatchBegin, markBatchEnd, wheelColor, accent, inkCtx, markInk, stageGround, busyWrap, busyFlash, busy, busySync, cardLoading, busyHost, field, maths, scan, cards, solveChem, solveCard, warmArm, touchState, loadPreset, setReference, api** (42 without the facade's R5 row; the facade alone adds autoQ, effectiveRes,
   READER_LAW, stats, modKnobs, modHeld, wheelColor, accent, inkCtx, markInk, stageGround, busyWrap, busyFlash, busyHost = 14).
   Never read outside `boot()` (stay with the loop, never filled): 12 — controlStep, RES_LADDER, frameBudget, perfBudgetMs, tick, READERS, may, unpark, cRe, cIm, feedAudio, cancelWarm.
   **Recommendation (the integrator's, taken):** fill exactly that union on `app.ctl` inside `createController` at creation, in one
   commit at the merge, so the pair rows only read and nobody edits `lab/shell/controller.js` inside a pair; ~6 lines at 200 columns
   (`app.ctl.gov = gov; app.ctl.keep = keep; …`), against `lab/*.js` 27,739 of the 27,943 cap.
2. **The boot-kept fills move with their declarations.** `app.w.wSpec`, `app.w.spectrum`, `app.w.normalizeNow` (R2a, SPECTRUM) and
   `app.w.shadowView`, `app.w.wMet` (R2b, readouts) become those modules' registrations inside their `create*(app)`; `app.sh.lookSync`
   and `app.sh.quality` move with §1 into `createSettings` (R3a) — which runs before §2's seat, so the controller's hand-over still sees
   them; `app.loop.page / windowActivity / paceRate` stay with the loop. The tool already treats each as its owner's registration.
3. **TIER is a cycle.** Every later module that schedules (18 sections use TIER) would import it from `'../rack.js'`. Safe while no
   module reads TIER at its top level; cleaner is ONE small module (`TIER` + `TIER_NAME`) that rack.js re-exports — one row's decision,
   not each row's.
4. **A moved module keeps a seat piece in `PLANNED_CUT`** (its header + the call), and its other anchors are dropped in the same commit
   as the move; `measureFile` wants the hand-over as plain `const { a, b: c } = app[.ns]` (no defaults, no nesting).
5. **The seat's consts are TDZ until the call resolves.** A function that was hoisted in `boot()` and now comes back from a module
   (R1: twelve) cannot be called by boot code above its seat; a later row that adds such a call must read it lazily.
6. **`tools/perf/main-thread.mjs`' `served.rackSha256`** decodes chunks one at a time (`t += c`), so it disagrees with `sha256sum` when a
   multi-byte character straddles a chunk (this tree: `bbbaf5e6…` vs `78281bac…`) — `Buffer.concat` before hashing would make it the
   file's sha. A tools/ fix, not a lab/ one.
7. **`keyboard-window`'s block 8 reload** fails with "Failed to decode response from marionette" on the base too (R0's run of 10-09 was
   green): a rig regression to look at once (geckodriver / Firefox version, or the in-session `go(url)` with a dirty keys record).

## 9 · Merge notes

- **The seat line** — `lab/rack.js:335–339`: the header `/* ── ONE CONTROLLER · FIELD · THE MATHS WORKERS · ONE ROAD: lab/shell/
  controller.js (0.5.2 R1), created here; the loop stays below ── */` and `const { autoQ, controlStep, RES_LADDER, gov, effectiveRes,
  READER_LAW, keep, domain, fieldRate, perf, frameBudget, perfBudgetMs, tick, READERS, may, unpark, setGovernor, setKeepFrames,
  setPerfMode, stats, cRe, cIm, mod, MOD, modSyncBases, feedAudio, modHand, setKnob, modGets, modKnobs, modHeld, ROT_LIMIT, rotRate,
  rotDriving, setRotationRate, rotStep, modStore, saveMod, curvesStore, occlusion, look, applyAccent, paintMarks, markBatchBegin,
  markBatchEnd, wheelColor, accent, inkCtx, markInk, stageGround, busyWrap, busyFlash, busy, busySync, cardLoading, busyHost, field,
  maths, scan, cards, solveChem, solveCard, cancelWarm, warmArm, touchState, loadPreset, setReference, api } = await
  createController(app);` — **what `boot()` destructures: the 68**, in the `ctl` literal's key order (the same set, the same order).
- **What `app.ctl` fills: none** (candidate 1). **What R1 fills:** `app.sh.lookSync`, `app.sh.quality`, `app.loop.page`,
  `app.loop.windowActivity`, `app.loop.paceRate`, `app.w.wSpec`, `app.w.spectrum`, `app.w.normalizeNow`, `app.w.shadowView`,
  `app.w.wMet` — ten one-line statements, each right after its declaration.
- `lab/rack.js` changed in three regions besides the fills (the imports, the seat, §7's hole): a branch that edited §2–§4 or §7 must
  re-apply its edit in `lab/shell/controller.js` (the text is the same, two-space indented). The `app` literal did not change.
- `tools/rack-deps.mjs`: `PLANNED_CUT` lost §7's row; the §2 anchor now matches the seat. `classes()` takes `opts.{planned, cut,
  modules}` (tests); the default reads the module folders.
- `lab/sw.js` carries the new precache (the controller, the new rack.js digest).
- `research/release-0.5.2/r1-measure/` holds the pair's raw records and the estate's summary.

## 10 · The drafted CLAUDE.md sentence (for the integrator; NOT applied)

> THE CONTROLLER (0.5.2 R1) is `lab/shell/controller.js` `createController(app)` — the governor and AUTO SCALE's one rule, the
> look, the busy marks, the mod port, the rotation drive, `createField` and its GPU recovery, the maths workers and the ONE ROAD of
> state mutations (`touchState`, `loadPreset`, `setReference`, `api`) — moved verbatim; `boot()` awaits it at §2's seat and
> destructures its 68 names there, so the frame loop (§5–§6), `schedule`, `filmHold` and §13–§14 stay in `boot()` and read closure
> slots. The worker road is `new URL('../mathworker.js', import.meta.url)` in that module; `node tools/rack-deps.mjs --classes` measures
> a moved module from its file.

## 11 · What Josh will see

**Nothing.** The pixels: THE LOCK 860 and 1004, 0/0, both first run. The work: `serialize-bytes` 11/11 full and 11/11 edit sha-identical to the base. The browser's memory:
`settings-probe` 0 scenes judged red (5 of 6 reached on the tree, 4 of 6 on the base — the driver dies on both). The facade: `lw-facade` 1/1 — the same 176 members, kinds and order as R0's fixture (the moved functions are the same
values, read through the same literal). The suites: 34 of 35 green, the 35th (`keyboard-window`) red on the base identically; the boot
suite: 151/152 twice, B149 the only law red, as on the base. The main thread: Δ +0.044 (boot) and +0.157 (D1) ms/s against a 3.536 gate.
