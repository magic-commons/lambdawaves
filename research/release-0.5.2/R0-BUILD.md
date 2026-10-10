# R0-BUILD · THE CONTEXT (0.5.2 "Rack Dissolution"; Opus 5.5 builder; the measuring row)

Base `54865a3` (`yan-c` = `v0.5.1-alpha` + `tools/rack-deps.mjs` + the 0.5.2 plan); `lab/` is byte-identical to `v0.5.1-alpha` there.
Ports 9043/5513 (this tree) and 9047/5517 (the base export, and the U1 scratch tree in turn). The rig: one RTX 3070; Josh's desktop
Firefox (pid 2002078, no marionette) was up all session and was never touched; a `playwright-mcp` launcher (no browser) idles.

## 1 · The ledger (step by step)

| step | what | result |
|---|---|---|
| 1a | `tools/rack-deps.mjs --classes` (the plan's §3 cut as anchored pieces; AUDIT §3.2's classes) and `--rename` (resolver-driven, token positions) | built; on the base it reproduces AUDIT §3.2 (§2 below) |
| 1b | U1 the hoisting audit (scratch tree, two transforms, boot + preamble + four demos) | **readSettings** is the one cross-module early call (§3) |
| 1c | U7 the runtime facade fixture on `v0.5.1-alpha` | `research/release-0.5.2/lw-facade.json`: 176 members (56 value · 48 get · 72 method); `tests/lw-facade.browser-test.mjs` GREEN on the base |
| 2 | THE CONTEXT (`8343ab2`): `app` in the boot head; 57 shared lets → `app.state`; `__LW_hooks` → `app.hooks`; the dead code out | `--rename`: 891 edits; the hinge HOLDS (§6); the fixture re-captured, two keys moved order (§4) |
| 3 | `tests/helpers/app-source.mjs`; seven source-reading laws re-pointed; `rack-deps.test` §4 (`cc6d7ff`) | `bash test.sh node` exit 0; the static G-A check found one more dead read (`app.hooks.themeChanged`), out |
| 4 | U4 · the pair · U5 · THE LOCK · the estate · the boot suite · the probes (§8–§10) | U4 floor −0.17 / −0.05; the pair +0.94 / +0.41 (gate 3.536), the boot scene again −0.63; `app` fast; 860 · 0/0 and 1004 · 0/0; 34 of 35 suites GREEN (latex-copy RED on the base too); B149 the only LAW red |

## 2 · The classes table BEFORE (`node tools/rack-deps.mjs --classes` on the base, `5ed392623650`)

The cut is `PLANNED_CUT` in the tool: 39 pieces in file order, each starting at the first line its anchor matches after the previous
piece, so the pieces tile the body by construction and an inserted line moves no boundary. A piece that STAYS in `boot()` (the head,
the loop §5–§6 + `filmHold`, the camera law and the seats, the five appends, `READERS`, §13–§14, §17, §27–§30) shares boot's scope:
a `let` only stay-pieces touch is a closure slot, not a crossing. `forward` counts consts/functions declared after the module's
first line (lazy `app.<ns>.x`); `shared lets (bare)` the lets another scope owns; `fwd + shared` adds the `app.state` members in use.

| module | row → file | lines | backward | forward | shared lets (bare) | app.state | **fwd + shared** | bare writes to another scope's let | hinge |
|---|---|---|---|---|---|---|---|---|---|
| boot (stays) | — → `lab/rack.js` | 249 | 0 | 52 | 10 (+1 boot-kept) | 0 | **62** | 1 (filmCard) | RED |
| loop (stays) | — → `lab/rack.js` | 484 | 41 | 49 | 27 | 0 | **76** | 10 (badgesWall, feedMs, flowEpoch, govVersion, keplerDirty, metersWall, modExpOn, modWall, pendingRef, playedLast) | RED |
| settings | R3a → `lab/shell/settings.js` | 142 | 7 | 13 | 2 | 0 | **15** | 0 | ok |
| controller | R1 → `lab/shell/controller.js` | 305 | 13 | 10 | 2 | 0 | **12** | 0 | ok |
| material | R2c → `lab/windows/material.js` | 131 | 11 | 0 | 2 | 0 | **2** | 2 (palette, space) | RED |
| settings-card | R2c → `lab/windows/settings.js` | 179 | 22 | 1 | 4 | 0 | **5** | 3 (molFormulaScale, stageFollow, stageMix) | RED |
| film | R2c → `lab/windows/film.js` | 21 | 5 | 3 | 3 | 0 | **6** | 1 (capApi) | RED |
| state | R2a → `lab/windows/state.js` | 170 | 14 | 6 | 2 | 0 | **8** | 2 (applyVisuals, refSnapshot) | RED |
| spectrum | R2a → `lab/windows/spectrum.js` | 250 | 18 | 15 | 9 | 0 | **24** | 6 (gasAxial, gasWidth, lastNmax, pendingRef, refSnapshot, space) | RED |
| readouts | R2b → `lab/windows/readouts.js` | 139 | 15 | 4 | 3 | 0 | **7** | 0 | ok |
| molecules | R2d → `lab/windows/molecules.js` | 97 | 18 | 3 | 5 | 0 | **8** | 3 (pendingRef, refSnapshot, space) | RED |
| stage-words | R2d → `lab/shell/stage-words.js` | 123 | 4 | 2 | 2 | 0 | **4** | 0 | ok |
| modulation | R2d → `lab/shell/modulation.js` | 247 | 20 | 1 | 9 | 0 | **10** | 4 (dodge, modHost, modView, restampParams) | RED |
| transport | R3b → `lab/shell/transport.js` | 229 | 16 | 0 | 4 | 0 | **4** | 1 (modArm) | RED |
| kepler | R2b → `lab/windows/kepler.js` | 294 | 15 | 1 | 3 | 0 | **4** | 2 (keplerDirty, refSnapshot) | RED |
| ink | R2d → `lab/shell/ink.js` | 60 | 6 | 1 | 3 | 0 | **4** | 2 (occludeAt, occludeDirty) | RED |
| rack-wiring | R3b → `lab/shell/rack-wiring.js` | 327 | 39 | 0 | 4 | 0 | **4** | 3 (cornerLayoutDirty, dragging, kdrag) | RED |
| notebook | R3b → `lab/shell/notebook.js` | 389 | 29 | 10 | 11 | 0 | **21** | 1 (exporter3d) | RED |
| keys | R3b → `lab/shell/keys.js` | 202 | 33 | 1 | 12 | 0 | **13** | 4 (govVersion, metersWall, tl, uiHidden) | RED |
| persist | R3a → `lab/shell/persist.js` | 294 | 50 | 0 | 13 | 0 | **13** | 4 (gasAxial, lastNmax, space, stageMix) | RED |
| links | R3a → `lab/shell/links.js` | 78 | 5 | 0 | 3 | 0 | **3** | 0 | ok |
| history | R3a → `lab/shell/history.js` | 158 | 11 | 0 | 5 | 0 | **5** | 3 (histShown, history, pointerHeld) | RED |
| facade | R5 → `lab/shell/facade.js` | 259 | 122 | 1 | 21 | 0 | **22** | 2 (gasAxial, space) | RED |

THE HINGE before: 54 bare writes across scopes; the largest moving module SPECTRUM at 24 (limit 25) → FAILS on the writes alone.
**The shared lets (57)**, every `let` a scope other than its owner's touches: history, palette, molFormulaScale, space, playedLast,
uiHidden, pointerHeld, metersWall, govVersion, keplerDirty, badgesWall, applyVisuals, modView, modHost, modWall, tl, modExpOn, dodge,
filmCard, feedMs, rotMoved, rotTicking, audioCap, modArm, occludeDirty, occludeAt, stageMix, stageFollow, refSnapshot, pendingRef,
warmTimer, warmIdle, dragging, cornerLayoutDirty, exportLocked, histShown, lastNmax, capApi, camKnobs, exporter3d, flowEpoch, chem,
restampParams, molSession, register, orbitals, states, stageText, bow, bowInFlight, bowChain, kdrag, gasWidth, gasAxial, lastLaunch,
restoreNotice, linkLast. **The crossing consts/functions: 238** (70 of them hoisted function declarations).

Against AUDIT §3.2 (`.tmp/classes.mjs`, the same base): the same classes; the numbers differ only where the plan's §3 cut differs from
the audit's re-cut (R1 = §2–§4 + §7 in one module: 12; the 1100 block split three ways; SPECTRUM's span begins at its `// SPECTRUM`
comment and leaves the five appends to boot: 24 as the audit; the readouts' three spans: 7; §25 split links | history).

## 3 · U1 THE HOISTING AUDIT

Scratch tree: `git archive` of the base into `.tmp/scratch` (its `lab/` = `v0.5.1-alpha`'s), served on 9047; `.tmp/u1-transform.mjs`
rewrites `lab/rack.js` over the tool's token positions (106 boot-level function declarations); `.tmp/u1-run.mjs` boots it under the
boot suite's URL (`?preset=1s%2B2pz`), runs the suite's preamble (dark, density, vortex + overlay, Kepler, tags, every window reopened
and unfolded), then opens WATER, BENZENE, N₂ and WAVE DANCER through `__LW.projects.demo`. Two transforms, because one cannot see all:

1. **probe** — every declaration keeps hoisting and gains a guard: a CALL before its declaration's seat is recorded with the caller's
   stack (this sees a call that a `try` would swallow, and one run sees them all). Result, after boot, the preamble and the four demos:
   - `readSettings` (§1, `:166`) ← `boot` `:131` (§0's `useCompactDefaults`) — **cross-module** (boot → settings)
   - `setModArm` (§12, `:2665`) ← the transport IIFE `:2655` — intra-module (transport → transport)
2. **const** — every declaration becomes `const x = function x(…) {…};` except a keep-list (this sees an eager VALUE read, which the
   probe cannot): the first run threw `can't access lexical declaration 'saveMod' before initialization` at `:421` (`save: saveMod`
   handed to `createModPort`, §2; `saveMod` is §2's own, `:470` — intra-module). With **readSettings, setModArm, saveMod** kept, the
   other 103 as consts: boot, the preamble and the four demos ran with no error, no banner, `LW.ready`.

**The U1 list (functions called or read before their declaration):** `readSettings` (cross-module: it goes on `app` at the top of
`boot()`, where hoisting serves it — `app.sh.readSettings`), `setModArm` and `saveMod` (each inside its own planned module: a module
function keeps hoisting inside `create<X>(app)`, so they need nothing — but the rows that move §12 and §2 must keep them function
declarations inside their module). Not covered: paths the gate does not take (a phone crossing, a saved non-default settings blob, a
`#s=` link open); an eager value read inside a `try` would be swallowed by the const transform. The scratch tree is discarded.

## 4 · U7 THE RUNTIME FACADE FIXTURE

On the base (`v0.5.1-alpha` export, 9047): `Object.entries(Object.getOwnPropertyDescriptors(__LW))` after `LW.ready` + a settle →
`[name, kind]`, kind = `get` (an accessor) | `method` (a function value) | `value`, in property order: **176 members — 56 value · 48
get · 72 method** (`research/release-0.5.2/lw-facade.json`). `frost` sits at slot 31 (its FIRST definition's place, `:4552`) and
`windowActivity` at slot 142 (the dead wrapper's place, `:4723`), each with its later definition's kind (`get`). `tests/lw-facade.browser-test.mjs`
(one scene; `--write` re-captures): **GREEN on the base** (`LW_PORT=9047 GD_PORT=5517`).

**After step 2 (the two deletions), re-captured on this tree — the exact diff:** names and kinds unchanged (176 = 56 · 48 · 72; no member
gone, added or turned); **`frost` slot 31 → 147** (it now sits where its surviving getter is written, between `logo` and `keysheet`) and
**`windowActivity` slot 142 → 149** (between `keysheet` and `keymap`, its getter's place); the other 174 members in the same order with the
same kinds. The test is GREEN on this tree against the re-captured fixture (the estate, §10).

## 5 · THE CONTEXT, as built (step 2, `8343ab2`; step 3's one-line OUT `cc6d7ff`)

`app` is the LAST statement of §0, the boot head (`lab/rack.js:165`), just before §1: every §0 const it holds by value is declared above
it, and nothing in §0 reads `app` eagerly (the tool checks: the only earlier reference, `hNote`, is deferred). It is not a `/* ──`
section header, so the plan's § numbers do not move. Its shape (`node tools/rack-deps.mjs --classes`, the G-A line):

| namespace | keys | what | values at the literal |
|---|---|---|---|
| (top) | 30 | `dom`, `ui` (the one flat registry, `const ui = {}` moved up from §8), §0's 21 crossing consts (`device`, `DEVICES`, `reg`, `hNote`, `clock`, `appPlay`, `obs`, `mat`, `FIELD_CHROME`, `rates`, `energyOf`, `sturm`, `labelExpect`, `settingsStore`, `useCompactDefaults`, `PAL_DEF`, `isPhone`, `isTablet`, `FIRST_RUN`, `appleDevice`, `LOOK_DEFAULTS`) + the seven namespaces | all by value |
| `hooks` | 12 | the old `__LW_hooks` bag (`theme`, `restage`, `setStageColour`, `setStageFollow`, `setStage`, `setGamut`, `setTheme`, `ab`, `slap`, `period`, `keys`, `warning`) | null; filled where they were (every reader tests truthiness, so null reads as the old undefined) |
| `state` | 57 | every shared let (§6) | the let's literal init (`0`, `'x'`, `true`, `0.04` …) else null; each seat is now `app.state.x = init` |
| `loop` | 13 | `schedule`, `hold`, `resetWall` + the loop's other crossing names (`page`, `loopRing`, `ringMedian`, `windowActivity`, `canPresent`, `modesAt`, `refModes`, `meterSnapshot`, `paceRate`, `MOTION`) | the hoisted functions by value; `resetWall` the camera law's arrow (the law is handed `app.loop.resetWall`); `hold` null (R2c fills it with `filmHold`); the consts null |
| `host` | 21 | boot-kept names made after the head: the camera law's 14, `rack`, `rackL`, `LAYOUT_SLOTS`, `floats`, `swClient`, `warning`, `hydroReader` | `hydroReader` by value (hoisted, never moves); null |
| `w` | 71 | the window modules' crossing names (material · settings card · film · STATE · SPECTRUM · readouts · MOLECULES · stage words · Kepler) | null |
| `ctl` | 68 | the controller's crossing names (§2–§4, §7) | null |
| `sh` | 45 | the other shell modules' crossing names (settings · modulation · transport · ink · rack wiring · notebook · keys · persist · links · history · facade) | `readSettings` by value (U1); null |

The keys are EVERY boot-level name the planned cut makes cross a module (AUDIT E9: "R0 registers every cross-module name"), so a later
row fills a slot and never edits the literal; none reaches 128 keys (V8 makes an object literal of 128 properties or more a dictionary —
`ObjectLiteralMapFromCache`). **A null slot is filled by the row that first moves a reader of it**: a module registers its own names
when it is created (`app.w.wSpec = wSpec` inside `createSpectrum(app)`), and a boot-kept name (`host`, `loop`) is filled in `boot()`
right after its declaration. R0 fills none: nothing reads them yet, and a fill nothing reads is a dead store.

**The rename** (`node tools/rack-deps.mjs --rename .tmp/rename-map.json`, the map = `classes(base).sharedLets` → `app.state.x` plus
`__LW_hooks` → `app.hooks`): **891 edits**, every one printed: 41 declaration statements (12 of them lists, split in order), 5 shorthands expanded
(`{ x }` → `{ x: app.state.x }`), the rest plain references; the multi-declarator lists split in order (`let pending = TIER.NONE, rafId = 0, lastWall = 0, lastReconMs = -1e9; app.state.dragging = false;
let inLoop = false`). By hand: the three seats that would run before `app` (`app.hooks = {}`, `app.state.history = null`,
`app.state.palette = null` — their placeholders hold the same values); `const ui = {}` moved up; `resetWall`.

**OUT:** the dead `windowActivity` wrapper (4 lines; the getter stays — the suites call `presentOffscreen`); the first `frost` (inline);
`ui.camSeg`'s dead read (`if (ui.camSeg) ui.camSeg.set(obs.mode);`, nothing ever assigned it); `app.hooks.themeChanged`'s dead read
(`if (…themeChanged) …themeChanged(theme)`, nothing in the repository ever assigned it — the static G-A check found it); the unused
imports `tableFor`, `FILM_FPS` (inline) and `domainForP, momentumTableFor` (a line); the `device` import boot's own wrapper shadowed,
folded into `device as kitDevice` on the kit import line (its separate import line out; the wrapper — a hub — keeps its name).

**Lines.** `lab/rack.js` 4,931 → 4,958; **`lab/*.js` 27,666 → 27,693 (+27)** = +38 (the literal 31, its comment 6, `const ui` 1) − 1
(`const ui` at its old seat) − 3 (the pre-`app` seats) − 4 (the wrapper) − 1 (the momentum import) − 1 (the kit-device import) − 1
(`themeChanged`). The brief said ≈ +45 IN, 1–5 OUT; the literal came in at 37 because all seven namespaces wrap at 200 columns. Outside
`lab/`: `tools/rack-deps.mjs` +383, `tests/rack-deps.test.mjs` +30, `tests/helpers/app-source.mjs` 27, `tests/lw-facade.browser-test.mjs`
42, `tools/perf/app-shape.mjs` 57. Nothing under `lab/mir/**`.

## 6 · The classes table AFTER (`node tools/rack-deps.mjs --classes`, `lab/rack.js` sha-256 `45943b56a012…` → after step 3)

An `app.state` member's OWNER is the module of its seat — its first eager write (boot's statement level) — as the `let` it was;
`app.state (another scope's)` counts the members a module uses that another scope owns; `(+n own)` its own, exposed.

| module | row → file | lines | backward | forward | shared lets (bare) | app.state (another scope's) | **fwd + shared** | bare writes to another scope's let | hinge |
|---|---|---|---|---|---|---|---|---|---|
| boot (stays) | — → `lab/rack.js` | 283 | 0 | 56 | 0 (+1 boot-kept) | 11 | **67** | 0 | exempt |
| loop (stays) | — → `lab/rack.js` | 484 | 41 | 49 | 0 | 27 (+4 own) | **76** | 0 | exempt |
| settings | R3a → `lab/shell/settings.js` | 142 | 7 | 13 | 0 | 2 (+2 own) | **15** | 0 | ok |
| controller | R1 → `lab/shell/controller.js` | 305 | 12 | 10 | 0 | 2 (+29 own) | **12** | 0 | ok |
| material | R2c → `lab/windows/material.js` | 131 | 11 | 0 | 0 | 1 (+4 own) | **1** | 0 | ok |
| settings-card | R2c → `lab/windows/settings.js` | 178 | 21 | 1 | 0 | 4 | **5** | 0 | ok |
| film | R2c → `lab/windows/film.js` | 21 | 5 | 3 | 0 | 3 | **6** | 0 | ok |
| state | R2a → `lab/windows/state.js` | 170 | 13 | 6 | 0 | 2 | **8** | 0 | ok |
| spectrum | R2a → `lab/windows/spectrum.js` | 250 | 18 | 15 | 0 | 9 | **24** | 0 | ok |
| readouts | R2b → `lab/windows/readouts.js` | 139 | 14 | 4 | 0 | 3 (+1 own) | **7** | 0 | ok |
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

**THE HINGE (G-G) HOLDS: 0 bare writes across scopes (54 before); the largest moving module SPECTRUM at 24 (limit 25); no STOP.** The
`fwd + shared` column is unchanged from BEFORE in every module but three, each for a reason: `material` 2 → 1 and `history` 5 → 4 own
the member they seat (`palette`, `history`, which were §0 lets); `molecules` 8 = 8. `backward` fell by one where `__LW_hooks` was a
crossing name (it is the `hooks` bag now). G-A, read statically: `app` at line 165, 30 keys; hooks 12 · state 57 · loop 13 · host 21 ·
w 71 · ctl 68 · sh 45; every member the code names is a key of the literal; no `Object.assign(app…`, no `delete app.…`.

**The shared lets (57), by owner (the seat's module):** controller (29) applyVisuals, audioCap, badgesWall, dodge, feedMs, filmCard,
govVersion, keplerDirty, lastNmax, metersWall, modArm, modExpOn, modHost, modView, modWall, occludeAt, occludeDirty, pendingRef,
playedLast, pointerHeld, refSnapshot, rotMoved, rotTicking, stageFollow, stageMix, tl, uiHidden, warmIdle, warmTimer · kepler (7) bow,
bowChain, bowInFlight, gasAxial, gasWidth, kdrag, lastLaunch · molecules (6) chem, molSession, orbitals, register, restampParams, states
· material (4) camKnobs, capApi, exporter3d, palette · loop (4) cornerLayoutDirty, dragging, exportLocked, histShown · settings (2)
molFormulaScale, space · readouts flowEpoch · history history · links linkLast · persist restoreNotice · stage-words stageText. The
17 "assigned after declaration and read elsewhere" (chem, molSession, orbitals, states, register, capApi, camKnobs, stageText …) are among
them. Lets private to one scope stay `let`s (the loop's `pending`, `rafId`, `lastWall` …).

## 7 · U8 THE `ui` REGISTRY CONTRACT (the members `native-ui.js` and `badges.js` touch — no window row may claim one private)

`native-ui.js` (`reworkNative({ ui, … })`, run last, `:4924` now):
- **reads** — directly: `spaceSeg`, `styleSeg`, `hc`, `shFoot`, `shadowSeg`, `set`, `frameSw`, `axisSw`, `saveNative`, `gamutSeg`,
  `windowInfoSw`, `gridSeg`, `rotZRate`, `kzKnob`, `defKnob`, `kzRate`, `defRate`, `abSw`, `periodFx`; dynamically (`ui[name]`, literal
  lists): `spaceSeg`, `viewSeg` (their labels stripped); the WAVE rows `spaceSeg`, `viewSeg`, `expK`, `softK`, `hueK`, `isoK`, `grainK`,
  `kneeK`, `styleSeg`, `finishSeg`, `ditherSeg`, `ditherK`; `accA`, `accB`; the SETTINGS pages `themeSeg`, `cardSeg`, `frostSeg`,
  `discSw`, `blurK`, `accA`, `accB`, `vivid`, `badgesSw`, `controlHintsSw`, `capSw`, `windowInfoSw`, `molFormulaSw`, `molFormulaK`,
  `frameModeSeg`, `axisModeSeg`, `axisInkSeg`, `stageSeat`, `stageK`, `gammaK`, `gamutToggle`, `p3Seg`.
- **writes (5)** — `finishSeg`, `shadowDetails`, `frameModeSeg`, `axisModeSeg`, `gamutToggle`.
- **patches** — `ui.styleSeg.set` (wrapped: it re-syncs FINISH); `ui.frameSw.set` and `ui.axisSw.set` (wrapped by `enumControl`, whose
  segs REPLACE their roots); `ui.gamutSeg.set` (wrapped; its root replaced by the DISPLAY P3 switch).
- **re-parents** — the WAVE card's controls into its numbered rows; SHADOW's `hc`, `.epi` and `shFoot` into `#shadow-details`; the
  SETTINGS groups into three pages; STATE's rotation knobs (`kzKnob`, `defKnob`, `rotZRate`, `kzRate`, `defRate`) and the A/B row
  (`abSw`'s group); `#transport`'s children; `periodFx` into an info panel.

`badges.js` (`createBadges({ …, ui })`, handed `ui` whole): reads `fieldRo` (`.set`, `.setSub`).

**58 distinct members** (53 read, 5 written by native-ui; `fieldRo` by badges). **`ui.camSeg` is DEAD** — read at the old `:4174`,
assigned nowhere, read by neither module — and its read is deleted. `ui` stays `const ui = {}` (now above `app`, `app.ui` the same
object): a registry the cards fill and native-ui extends, not a fixed-shape namespace; U5 reads it FAST (107 keys) on both trees.

## 8 · U4 · THE PAIR · U5

Headless Chromium on the RTX 3070 through `tools/perf/main-thread.mjs --runs 1` (a fresh profile per run, the warm-up navigation,
`field ok` and `notice dismissed` on every run, 0 held frames), interleaved per round A-boot · B-boot · A-D1 · B-D1, 5 rounds, the rig
quiet before every run (`.tmp/pairs.mjs`: no chrome / geckodriver / headless Firefox, `wait-gpu.mjs`, load < 4 — it ran 0.9–1.7; Josh's
desktop Firefox up throughout). The D1 scene is D1-BUILD's `--setup` verbatim (H₂O · ORBITAL · HOMO · AUTO-ROTATE · STAGE TEXT) with
`--sweep 10`; every D1 run answered `{"mol":true,"view":"orbital","homo":5,"auto":true,"stage":true,…}`. Medians (spread) in ms/s;
raw in `research/release-0.5.2/r0-measure/`.

| | boot scene | D1 scene |
|---|---|---|
| **U4 the floor** — `v0.5.1-alpha` (9047) vs itself (9043) | 42.951 (1.001) vs 42.786 (1.239): **Δ −0.165** | 64.466 (1.845) vs 64.412 (1.377): **Δ −0.054** |
| **the pair** — `v0.5.1-alpha` vs this tree | 42.198 (1.616) vs 43.140 (1.722): **Δ +0.942** · PASS (≤ 3.536) | 64.777 (1.655) vs 65.189 (2.486): **Δ +0.412** · PASS |
| the boot scene again (5 + 5) | 43.041 (1.605) vs 42.412 (1.816): **Δ −0.629** · PASS | — |

Read: both inside the noise gate. The boot-scene Δ sat above the floor and the tree was the higher arm in all five rounds (script
16.494 → 17.045 ms/s; layout, recalc and presents/s equal), while the D1 scene's script was 19.438 → 19.337. So the boot scene was taken again, 5 + 5, interleaved (`research/release-0.5.2/r0-measure/pair-boot-again.json`): it reads the other way — Δ −0.629, script 16.941 → 16.559, the tree the LOWER arm in 4 of 5 rounds. Ten rounds a side straddle zero: the first pair's +0.94 is the instrument's noise (the floor's spreads are 1.0–1.8), not a cost. Expected: the loop's 27 shared lets are ~60 `app.state` reads a frame, nanoseconds.

**U5 `app` STAYS FAST** (`tools/perf/app-shape.mjs`, new: Chromium with `--js-flags=--allow-natives-syntax`; `app` is reached without
touching the facade — `__LW.settle`'s `[[Scopes]]` hold boot()'s closure, and the DevTools protocol hands its `app` back by reference —
then `%HasFastProperties`): on this tree, at `LW.ready` AND after 6 s of play, **`app` (30 keys) and every object member are FAST**:
hooks 12 · state 57 · loop 13 · host 21 · w 71 · ctl 68 · sh 45 · ui 107 · dom 12 · mat 24 · obs 7 · sturm 6 · appPlay 6 · settingsStore 4
· FIRST_RUN 4 · LOOK_DEFAULTS 6. On the base, `ui` (107) and `__LW_hooks` (12) are FAST. G-A holds where the engine can say so.

## 9 · THE LOCK (G-D)

`node tools/perf/digest-lock.mjs --check --query gastab=0` → **860 values · 0 readback · 0 record-byte differences**, page errors 0;
the same `--fixture research/release-0.4.0/measure/digest-lock-s4a.json` → **1004 · 0/0**. Each green on its first run.

## 10 · The suites (this tree, `LW_PORT=9043 GD_PORT=5513`, one at a time on a quiet rig)

| suite | count | verdict |
|---|---|---|
| `bash test.sh node` (82 + the extended `rack-deps` (§4: 9 new lines) + the helper; `pwa` 341 files) | exit 0 | GREEN |
| the browser estate (`.tmp/estate.mjs`: every `tests/*.browser-test.mjs`, a red re-run once alone) | camera-shift 11 · chem 55 · current 15 · curves 7 · export3d 10 · field-molecule 9 · film-handover 4 · frame-occlusion 7 · gpu-recovery 10 · history **44** · input 13 · keyboard-window 8 · lfo-tension 3 · library 8 · **lw-facade 1/1** · lw-links 5 · menubar 8 · mir-controls 2 · molecular-diff 15 · molecular-names 6 · molecule-demos 5 · molecule-head 3 · new-project **8** · offer 16 · official-defaults-palette 3 · opener 7 · orbitals 24 · project-formats 5 · register 17 · render-regressions 2 · routed-knob 4 · stage-text 4 · take-in-bugs 4 · timeline 14 | **34 of 35 GREEN** |
| `latex-copy.browser-test` | 1 PASS, then RED: the SPECTRUM ⧉'s hit-test `hit: false` (twice) | **RED on the BASE too, identically** (`LW_PORT=9047`, the base's server): a v0.5.1-alpha red no ledger names (the suite is in neither C-V's nor D-V's list) — not R0's |
| `tests/legacy/boot.browser-test.mjs` alone | run 1: **150/152** (B69, B149) · run 2: 149/152 (B6, B69, B149) · run 3 (the full-detail runner, whole file): 150/152 (B6, B149) · the BASE, its own suite file: 151/152 (B149) | **B149 the only LAW red** (see below) |
| `tools/serialize-bytes.mjs` base vs tree | **11/11 full + 11/11 edit sha-identical**, 0 errors | GREEN |
| `tools/settings-probe.mjs` | **0 of 6 scenes red** | GREEN |
| `node tools/new-project.mjs --check` · `node tests/new-project.test.mjs` | in step (16117 B) · GREEN | GREEN |
| `tools/hit-probe-set.mjs` | 71 presses through a kit window's gap, **0 reached the stage** | GREEN |
| `tools/perf/film-probe.mjs` base and tree → `film-compare.mjs` | exit 0: the picture's bytes, EXPORT FRAMES' pixel hashes, ONE PERIOD's and RECORD's digests and times, the MP4 bytes all identical | GREEN |
| `tools/camera-routes.mjs` | 5 projects | GREEN |

**The boot suite's two flakes are the base's.** B6 ("the truncation is SAID": the badge read 200 ms after a mute) and B69 (THE PHONE,
PORTRAIT) went red in some runs of this tree; both were measured on the base in the same context, interleaved (`.tmp/b6-rep.mjs`
through the chunk runner, the suite's header + preamble + every block up to the law): **B6 red on the base 3 of 5, on this tree 1 of 5**
(the same reading both ways: the badge has not yet said `RENDERED 1/2` — a paused lab draws no further frame, and the tags tick at most
every 100 ms and only on a frame); **B69 red on the base 1 of 3, on this tree 1 of 3**, the same field both ways: `togFollowed` 306 where
310 is asked (the hide toggle's travel read while the rack is still sliding). B108 (`createField(dom.canvas, {` … `onLost:`), B112
(`warned: S0.warned`) and B136 (`vivid: 0.5, disconnected: true`) — the three re-pointed through `appFiles()` — are GREEN in every run.

## 11 · Brief candidates (for the later rows; none blocks R0)

1. **The tool must learn the module files before R1 moves anything.** `classes()` reads `lab/rack.js` alone; once §2 leaves, its
   anchors are gone (the tool throws "the cut needs re-anchoring") and the controller's names live in `lab/shell/controller.js`. R1's
   first job in `tools/rack-deps.mjs`: measure each `lab/windows/*.js` / `lab/shell/*.js` module as a piece of its planned module (its
   `create<X>(app)` body), resolving its free names against `app`'s keys, and drop the moved pieces from `PLANNED_CUT`.
2. **Null slots are filled by the row that first moves a reader** — a module registers its own names at creation; a boot-kept slot
   (`host`, `loop`) is filled right after its declaration in `boot()`. Two rows of one pair may both need one boot-kept fill: the same
   line, at the same seat — the integrator keeps one.
3. **U1:** `readSettings` must stay callable before §0's `useCompactDefaults` (`:131`) — when R3a moves §1, keep a one-line hoisted
   `readSettings` (it reads only `settingsStore`, a §0 const) in the head, or seat `app.sh.readSettings` by value as now.
   `setModArm` (§12) and `saveMod` (§2) are touched before their lines INSIDE their own modules: keep them function declarations in
   `createTransport` / `createController`.
4. **`app.loop.hold` is null** until R2c leaves `filmHold` beside the loop and fills it.
5. **The pair's boot scene** read +0.94 ms/s (script +0.55, the tree higher in 5 of 5 rounds) where the floor read −0.17; taken again, it read −0.63 (the tree lower in 4 of 5): noise either way.
   R1 and R-V read the cumulative pair; G-A is not the cause (U5).
6. **`latex-copy.browser-test` is RED on `v0.5.1-alpha`** (the SPECTRUM ⧉ is not the topmost thing at its own centre after WAVE DANCER
   opens) — a base defect outside every ledger; a fix-round item, not R0's.
7. **B6 and B69 flake on the base** (§10): a re-aim (read the badge after a forced frame; read `togFollowed` after the slide's
   `transitionend`) would make "B149 the only red" a single-run fact.
8. **The `ui` registry** stays dynamic by design (R7-G); `native-ui.js` WRITES five members and patches four `.set`s (§7) — a window row
   that moves WAVE, SHADOW, SETTINGS, STATE or the transport keeps those members registered in `app.ui` under the same names.
9. **Slices across files:** `appSource()` concatenates rack.js and the modules; a source-reading law's `indexOf(from)` … `indexOf(to)` could
   in principle span two files. Each law's markers sit in one block; a row that splits a sliced block across files must re-check its law.

## 12 · Merge notes

- `lab/rack.js` changed on 504 lines by the rename alone (token-level, all over the file): nothing else may be in flight on it (R0 runs
  alone). A branch that must take this onto other edits re-runs the rename (`node tools/rack-deps.mjs --rename <map>` with the map from
  `classes(<its base>).sharedLets`) rather than merging hunks, then re-applies the hand edits listed in §5.
- `research/release-0.5.2/lw-facade.json` is THIS tree's capture (frost and windowActivity moved); the base capture is §4's.
- `lab/sw.js` carries the new precache digest (`node tests/pwa.test.mjs --write`).
- `research/release-0.5.2/RACK-DEPS.md` / `rack-deps.json` are left as the BASE's measurement the plan cites (regenerate with
  `node tools/rack-deps.mjs` when wanted; its § numbers are unchanged).

## 13 · The drafted CLAUDE.md sentences (for the integrator; NOT applied)

> THE CONTEXT (0.5.2 R0). `boot()`'s ONE `app` (the last statement of its head, `lab/rack.js`) is fixed-shape namespaces — §0's
> consts by value, `ui`, `hooks`, `state`, `loop`, `host`, `w`, `ctl`, `sh` — each ONE literal with every key, never extended, never
> `Object.assign`ed into, never deleted, and none of 128 keys or more (V8 makes such a literal a dictionary; `tools/perf/app-shape.mjs`
> asks `%HasFastProperties`). Every `let` two planned modules touch is `app.state.x`, read and written live, never destructured; consts
> and functions keep their names; a null slot is filled by the row that moves its first reader. Rename a shared binding only with
> `node tools/rack-deps.mjs --rename`, never `sed`; `node tools/rack-deps.mjs --classes` is G-G (0 bare cross-module writes, forward +
> shared ≤ 25 per moving module) and `tests/rack-deps.test.mjs` §4 its law.
>
> A law that reads the app's SOURCE reads `tests/helpers/app-source.mjs` (`appSource()` in node, `appFiles()` fetched in the page:
> rack.js, then every module under `lab/windows/` and `lab/shell/`), never `lab/rack.js` alone. `tests/lw-facade.browser-test.mjs`
> pins `window.__LW` — names, kinds (get / method / value) and order — against `research/release-0.5.2/lw-facade.json`; a row that
> changes the facade re-captures it with `--write` and says the diff.

## 14 · What Josh will see

**Nothing.** The pixels: THE LOCK 860 and 1004, 0/0, and the film's every frame and byte identical to the base's. The work: 11/11
serialize readings byte-identical, full and edit. The browser's memory: settings-probe 0 of 6. The facade: the same 176 members with
the same kinds (two keys enumerate later — nothing reads that order). The suites: 34 of 35 green, the 35th red on the base too; the boot
suite's only law red is B149's, as before. The main thread: inside the noise gate in both scenes; `app` fast.
