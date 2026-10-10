# R2d-BUILD · MOLECULES + THE STAGE WORDS + THE MODULATION SEAM + INK (0.5.2 "Rack Dissolution"; PAIR 3 beside R2c)

Base `5fb9671` (`yan-c`; its `lab/` = `8796d15`'s). The move and the light check: an Opus 5.5 builder in `.claude/worktrees/agent-a5571173c3ce60a48`
(branch `worktree-agent-a5571173c3ce60a48`), paused for usage at `6bb18f4`. This file, the classes table's re-read and REPORT wave 222: a second
agent (`agent-a32145a840b1c4736`, branch `worktree-agent-a32145a840b1c4736`, `git reset --hard 6bb18f4`) with the first builder's `.tmp/` copied in.
Ports 9113/5583 (the tree) and 9117/5587 (the base: `git archive 5fb9671` into `.tmp/base`, served with `LW_CERTS=<worktree>/.certs`); both servers
STOPPED at the pause, no browser up. One browser at a time: every suite waited for a free rig through `.tmp/run.sh` / `.tmp/batch.sh`
(`research/release-0.5.2/r2b-measure/rigfree.mjs`, polled every 30 s). The rig drew 2–3 frames a second and marionette died mid-run.

**What was run for this file** (no browser suite, no server — the GPU is shared and there was nothing to measure): `node tools/rack-deps.mjs --classes
--no-write` on the tree and on the base export; `node tests/rack-deps.test.mjs`; `node tests/wiring.test.mjs`; `node tests/pwa.test.mjs` (read-only);
`node .tmp/r2d-verbatim.mjs`; `node .tmp/freenames.mjs`; `node .tmp/sbcmp.mjs`; `wc -l`. Every browser reading in §8 is the first builder's, re-read
from its saved output in `.tmp/` (`out-9113-*.txt` the tree, `out-9117-*.txt` the base, `sb-*.json`, `sp-*.json`, `last-run.txt`); a row marked † is in
`R2d-HANDOFF.md` only (its output was not saved). Written 2026-10-10 from 11:53 CDT (`date`); the first builder's own run times were not recorded in its saved outputs.

## 1 · The ledger

| step | commit | what |
|---|---|---|
| 1 | `489c54c` | THE MOVE: MOLECULES · MO-REGISTRY → `lab/windows/molecules.js` (two seats), THE STAGE TEXT → `lab/shell/stage-words.js`, the modulation seam → `lab/shell/modulation.js`, §18 INK → `lab/shell/ink.js`; five seats in `rack.js`; the imports; readouts' `app.w.wSh`; the `app.host.cameraPort` fill; `tools/rack-deps.mjs` (five anchor comments); `pwa --write` |
| — | `3b0daa8` | `R2d-HANDOFF.md` after step 1 |
| — | `6bb18f4` | `R2d-HANDOFF.md` — the WIP usage pause (the move committed, the light check run) |
| 2 | (this) | the light check; the classes table; this file; REPORT wave 222 |

The move was scripted at the walker's token positions (`.tmp/r2d-move.mjs`, which prints every free name, every at-use edit and the seats; then
`.tmp/r2d-imports.mjs` for the exact one-line import swaps, the `cameraPort` fill and readouts' `wSh`) — no `sed` over `rack.js`. Checked against the base
with `.tmp/r2d-verbatim.mjs` (§3) and `.tmp/freenames.mjs` (a name a file uses that nothing in it declares, against the base `rack.js`): the four new modules
and `readouts.js` have none; `rack.js` reads `A` and `settle`, which are the facade's own member names (`get A()` at `:1292`, `settle()` at `:1360`) — the
heuristic read them as bound only while the stage words' `const A` / `let settle` were in the file. No lost binding.

### The shape: four regions, five seats, two seats in one module (the brief's "say which")

| region | module | called at | returns to `boot()` |
|---|---|---|---|
| MOLECULES · the molecular session · THE HEAD's seat | `createMolecules(app)` (`lab/windows/molecules.js`) | `rack.js:1012` under the kept LEGACY note (`:1010–1011`) | `{ wChem, head, createMoRegistry }` |
| MO-REGISTRY | `function createMoRegistry()` declared at the statement level of `createMolecules`' body (`molecules.js:85–98`) | `rack.js:1026` under the kept ORBITALS note (`:1021–1025`), after the stage words | `{ wOrbs }` |
| THE STAGE TEXT · the caption | `createStageWords(app)` (`lab/shell/stage-words.js`) | `rack.js:1019` under the kept STAGE TEXT note (`:1014–1018`) | `{ stageCaption, stageTextTick, initStageText }` |
| the modulation seam | `createModSeam(app)` (`lab/shell/modulation.js`) | `rack.js:1054` under the kept 23-line WAVE 52 note (`:1031–1053`) | nothing |
| §18 INK | `createInk(app)` (`lab/shell/ink.js`) | `rack.js:1129` under the kept INK note (`:1122–1128`) | `{ refreshOcclusion }` |

**Molecules keeps TWO seats** (the brief's default; the one-seat alternative, which needs its own proof, was not taken). The root builds the first span and
RETURNS the later seat as `function createMoRegistry()` at the body's statement level — exactly `createCalcMetersLadder` inside `createReadouts` — never an
arrow or a second top-level `create<X>` (the tool's `measureFile` refuses that), and not `createRegister` (rack.js imports that name from `registerview.js`
and the span calls it). Why the order matters: the stage words DESTRUCTURE `wChem` at creation (`stage-words.js:7`), so `app.w.wChem` is registered at the end
of the first span (`molecules.js:99`); readouts' second seat reads `app.w.wChem` / `app.w.wOrbs` EAGERLY (`readouts.js:128–129`, the two `devopen`
listeners), so `app.w.wOrbs` is registered inside the second seat (`molecules.js:87`, the line the base filled at `:1229`) and the seat runs before
`createCalcMetersLadder()`. No `device()` / `appendChild` / `register` changed its order (G-O): `wChem` appends, the stage words create no device, `wOrbs`
appends; the seam creates none (the modulation window is the kit's, on `#floats`).

**The creation-time TDZ law (R3b's), checked per region.** Molecules' root runs `createMolecularSession`, `device`, `createChem` and `chem.subscribe(headLand)`
at creation; chemview calls its own `setOn` only from the switch, the dropdown and `restore` (`chemview.js:91`, `:742`, `:819`), never while it is being
constructed, so `moleculeMode` / `app.w.stageTextTick()` (the `setOn` closure, `molecules.js:58`) are never reached before the stage words register
(`stage-words.js:39`); `headLand` and the register's `announce` read `app.state.stageText` at use. The stage words make functions and fill two slots at
creation; `initStageText()` runs at `go` (`rack.js:1452`). The seam's `mod.install(defs, …)` and `createModulation(…)` run at creation and read `defs` (its
own), `obs`, `cameraPort`, `readSettings` / `saveSettings` (all filled before `:1054`) and `app.sh.setModArm` only at use (`modulation.js:220`). INK's
`refreshOcclusion` is called by the loop only (`rack.js:349`); its providers read `app.state.modView` (the seam, seated first) and `rackL` / `floats`
(§17, `rack.js:1113–1120` — `rackL`, `LAYOUT_SLOTS`, the `floats` fill line — before `:1129`).

## 2 · `lab/rack.js` (2,001 → 1,523, −478), exact (base line numbers)

| where | what |
|---|---|
| `:21–27` → 2 lines | the occlusion, field.js, kit.js, molecules, md, info/layer and pointer imports: the field.js and kit.js lines stay minus `toScreen`, `cameraKey`, `mathPlain`; the other five lines OUT (`paintedRect`, `MOLECULE_BY_ID`, `moleculeAtoms`, `ELEMENT`, `createInfoLayer`, `isField`) |
| `:33–35` → 1 line | chemview, registerview, molecular-session → ONE line, the four module imports (new `:28`) |
| `:41` OUT | latex-state: `stateLatex`, `moleculeHead`, `formulaLatex`, `BASIS_LABEL` |
| `:44` | `{ CAM, createCameraLaw, clampShift }` → `{ createCameraLaw }` |
| `:46` OUT | `createModulation` |
| `:655` | the camera law's fill line gains `app.host.cameraPort = cameraPort;` (new `:646`) |
| `:1021–1097` → 1 line | **seat 1** (new `:1012`): `const { wChem, head, createMoRegistry } = createMolecules(app);` |
| `:1104–1221` → 1 line | **stage-words seat** (new `:1019`): `const { stageCaption, stageTextTick, initStageText } = createStageWords(app);` — `:1104` was `app.state.stageText = null;` |
| `:1228–1239` → 1 line | **seat 2** (new `:1026`): `const { wOrbs } = createMoRegistry();` |
| `:1267–1489` → 1 line | **modulation seat** (new `:1054`): `createModSeam(app);` |
| `:1564–1607` → 1 line | **ink seat** (new `:1129`): `const { refreshOcclusion } = createInk(app);` |

−474 (the five spans: 77 + 118 + 12 + 223 + 44) +5 seat lines −5 −2 −1 −1 import lines (the net −9: 44 → 35 import lines) = **−478**.
The notes at the seats stay verbatim (the brief: `tools/rack-deps.mjs`' anchors must still match): the LEGACY note, the 5-line STAGE TEXT note, the 5-line ORBITALS
note, the 23-line WAVE 52 note, the 7-line INK note.

**Subtracted on the way (the brief's "say your exact Δ")**: `app.state.stageText = null;` (`:1104`, repeated the literal's `stageText: null`; −1); the blank
line `:1021` at the head of the molecules span (−1); two double blanks inside the seam (`:1329`, `:1412`; −2); the two inherited fill lines
`app.w.stageTextTick = stageTextTick;` (`:1136`) and `app.w.wChem = wChem; app.w.wOrbs = wOrbs;` (`:1229`) left `boot()` as registrations (they travelled with
their declarations; −2 there). **Added**: one statement on an existing line (`app.host.cameraPort = cameraPort;`), one on readouts' root registration line.

**Imports.** 44 → 35 import lines (9 out, net); **19 names left `rack.js`** (only the four regions used them): `paintedRect`, `toScreen`, `cameraKey`,
`mathPlain`, `MOLECULE_BY_ID`, `moleculeAtoms`, `ELEMENT`, `createInfoLayer`, `isField`, `createChem`, `createRegister`, `createMolecularSession`, `stateLatex`,
`moleculeHead`, `formulaLatex`, `BASIS_LABEL`, `CAM`, `clampShift`, `createModulation`. **Imported by a module AND still by `rack.js`**: `VIEW`, `VIEW_NAMES`
(field.js), `el`, `knob` (kit), `BASIS`, `getHamiltonian`, and `TIER` from `'../rack.js'` (R1's accepted cycle, read only inside the create functions).
molecules.js 3 lines / 10 names; stage-words.js 3 lines / 14; modulation.js 1 line / 5; ink.js 1 line / 2. `wiring.test` walks them (re-run: PASS, 251 of 268
reachable files). Nothing under `lab/mir/**`.

**The tool** (`tools/rack-deps.mjs`, 5 insertions / 5 deletions): the comments of the five `PLANNED_CUT` rows only — `:931` LEGACY WINDOWS (molecules),
`:932` THE STAGE TEXT (stage-words), `:933` ORBITALS (molecules' second seat), `:935` WAVE 52 (modulation), `:942` INK (ink). **No regex changed**; each anchor
still matches its seat line. `tests/` untouched (`tests/ink.test.mjs` already reads `appSource()` since R0, so the brief's re-point was a no-op).

## 3 · The modules, exact

**`lab/windows/molecules.js`** (100 lines): 1–2 header · 3–5 three import lines (10 names) · 6 `export function createMolecules(app) {` · 7–8 the hand-over ·
9–84 span 1 (76 lines: H₂⁺ · LEGACY … `moleculeMode`, `molFieldView`, the session, `wChem`, `createChem`, THE HEAD, `app.state.chem.subscribe(headLand);`) ·
85 `function createMoRegistry() {   // the second seat: MO-REGISTRY` · 86–97 span 2 (12 lines) · 98 `return { wOrbs }; }` · 99 `app.w.wChem = wChem; return { wChem, head, createMoRegistry };` ·
100 `}`. The later seat's body keeps the two-space column (verbatim), so its function line and `return … }` sit at the
body's indentation, as in readouts.js.

**`lab/shell/stage-words.js`** (126): 1–2 header · 3–5 three import lines (14 names) · 6 `export function createStageWords(app) {` · 7 the hand-over ·
8–124 THE STAGE TEXT (117 lines: `stageSrc`, `stageStates`, `stageMd`, `stageCaption`, `stageTextTick`, the registration line `:39`, `initStageText`) ·
125 `return { stageCaption, stageTextTick, initStageText };` · 126 `}`.

**`lab/shell/modulation.js`** (228): 1–2 header · 3 one import line (5 names) · 4 `export function createModSeam(app) {` · 5–6 the hand-over · 7–227 the seam
(221 lines: the WAVE 64 note, the ONE `defs` table, `mod.install`, the pill's seat and dodge, `createModulation(…)`, `modView.restore`, `dodge`) · 228 `}`
(no return: nothing it declares is read outside it; `app.state.modHost` / `modView` / `dodge` are the live members every module reads).

**`lab/shell/ink.js`** (51): 1–2 header · 3 one import line (2 names) · 4 `export function createInk(app) {` · 5 the hand-over · 6–49 §18 (44 lines:
`NO_OCCLUSION`, `refreshOcclusion`, the providers in their old order) · 50 `return { refreshOcclusion };` · 51 `}`.

**The hand-overs** (THE READ LAW: a name that is a const by the seat is destructured once):
- molecules (20): `{ dom, ui, device, clock, mat, useCompactDefaults, FIRST_RUN } = app, { schedule, canPresent } = app.loop, { rack } = app.host, { wState, wSpec,
  switchHamiltonian, wSh, wOrb, wVor, wSlice } = app.w, { cardLoading, field, solveChem } = app.ctl` — `wSh` is destructured because readouts' root now registers it.
- stage-words (5): `{ dom, reg } = app, { rack } = app.host, { wChem } = app.w, { paintMarks } = app.ctl`.
- modulation (20): `{ ui, hNote, clock, obs, mat, settingsStore } = app, { schedule, page } = app.loop, { orbitBy, cameraPort } = app.host, { readSettings, saveSettings }
  = app.sh, { mod, modHand, setKnob, ROT_LIMIT, rotRate, setRotationRate, occlusion, applyAccent } = app.ctl`.
- ink (7): `{ dom } = app, { schedule } = app.loop, { rack, rackL, floats } = app.host, { occlusion, field } = app.ctl`.

**At use, through a slot** (a name `boot()` or a later module makes after the seat): `app.w.wLad`, `app.w.wCalc` (`molecules.js:16`, inside `moleculeMode`;
readouts' second seat comes after), `app.w.stageTextTick` (`molecules.js:58`, chem's `setOn`), `app.host.rackL` (`stage-words.js:53`) and `app.sh.layout`
(`:55`) inside `initStageText`'s closures, `app.sh.setModArm` (`modulation.js:220`, the window's `arm:`). Shared `let`s are `app.state.x`, live, never
destructured: molecules' six (`chem`, `molSession`, `orbitals`, `register`, `restampParams`, `states`, assigned late) are `app.state.x` even inside the module.
No `ui.x =` in the four regions (they read `ui.spaceSeg` / `ui.viewSeg` / the rotation knobs only).

**Verbatim, proved** (`.tmp/r2d-verbatim.mjs`, line by line against `5fb9671`'s `rack.js`, in order; re-run for this file): of the **470 moved lines 463
are byte-identical**; the other **7**: 5 read a slot (`app.w.wLad` + `app.w.wCalc` on one line, `app.w.stageTextTick`, `app.host.rackL`, `app.sh.layout`,
`app.sh.setModArm`) and 2 are registrations (`molecules.js:87`, the fill `:1229` split — `app.w.wChem` went to the first span's return line, `:99`;
`stage-words.js:39`, which gains `app.w.stageCaption = stageCaption;` beside `stageTextTick`). The 470 are the five base spans (76 + 12 + 117 + 223 + 44 = 472)
minus the two double blanks. Comments and section headers travel; the five note headers stay as the seats.

## 4 · Lines

`lab/*.js` + `lab/shell/` + `lab/windows/` **27,893 → 27,924 (+31)** of the 27,943 cap (**19 left**), recounted with `cat lab/*.js lab/shell/*.js
lab/windows/*.js | wc -l` on the tree (27,924) and on the base export (27,893). Exactly: the four modules **+505** (100 + 126 + 228 + 51 = the 470 moved lines
+ **35** of shape) · `rack.js` **−478** (−474 spans, +5 seats, −9 import lines) · `sw.js` **+4** (four precache rows; two digests changed) · readouts.js ±0 (one
line edited). 505 − 478 + 4 = **+31**.

The shape, counted: 8 import lines · 8 header lines · 4 signatures · 6 hand-over lines · 5 return lines (molecules' root return and registration 1, its
later seat's function line and `return` 2, stage-words 1, ink 1) · 4 closing braces = **35**. The brief's "headers + signatures + returns ≤ 20 in all":
8 + 4 + 5 = **17** (21 with the braces). Subtracted on the way: 4 lines (§2) and the 9 net import lines. Measured: `rack.js` 1,523 lines; molecules.js 100,
stage-words.js 126, modulation.js 228, ink.js 51. The cap WILL be passed by the rows still to move (R2c's three modules, R5's facade) — that ruling is
Josh's at R-V.

## 5 · The classes table, before and after (`node tools/rack-deps.mjs --classes --no-write`)

BEFORE is the base export's own run (`.tmp/classes-before.txt`, `5fb9671`: rack.js sha `585dff2e00d8`, 38 pieces); AFTER is this tree's (rack.js `9312cd5bccb1`, 38
pieces), **re-run for this file and byte-identical (`diff`, exit 0) to the first builder's `.tmp/classes-after.txt`**.

| module | lines | backward | forward | shared (bare) | app.state (another's) | **fwd + shared** | bare writes | hinge |
|---|---|---|---|---|---|---|---|---|
| molecules BEFORE (`rack.js` pieces `:1019–1098`, `:1223–1240`) | 98 | 18 | 3 | 0 | 5 (+6 own) | **8** | 0 | ok |
| molecules AFTER (`molecules.js`; pieces `rack.js:1010–1013`, `:1021–1027`; handed 20) | 111 | 18 | 3 | 0 | 5 (+6 own) | **8** | 0 | ok |
| stage-words BEFORE (`:1099–1222`) | 124 | 4 | 2 | 0 | 2 (+1 own) | **4** | 0 | ok |
| stage-words AFTER (`stage-words.js`; piece `:1014–1020`; handed 5) | 133 | 4 | 2 | 0 | 3 | **5** | 0 | ok |
| modulation BEFORE (`:1244–1490`) | 247 | 19 | 1 | 0 | 9 | **10** | 0 | ok |
| modulation AFTER (`modulation.js`; piece `:1031–1055`; handed 20) | 253 | 19 | 1 | 0 | 9 | **10** | 0 | ok |
| ink BEFORE (`:1557–1607`) | 51 | 6 | 0 | 0 | 3 | **3** | 0 | ok |
| ink AFTER (`ink.js`; piece `:1122–1129`; handed 7) | 59 | 6 | 0 | 0 | 3 | **3** | 0 | ok |
| boot (stays), BEFORE → AFTER | 287 → 287 | 0 | 65 → 65 | 0 (+1 boot-kept) | 11 → 10 (+1 own) | **76 → 75** | 0 | exempt |
| loop (stays), BEFORE → AFTER | 488 → 488 | 41 | 49 | 0 | 27 (+4 own) → 26 (+5 own) | **76 → 75** | 0 | exempt |

(The AFTER line counts are the module file plus the kept seat pieces in `rack.js`: 100 + 11, 126 + 7, 228 + 25, 51 + 8.)

- **The same names, class for class** (the verbose rows diffed): molecules backward `FIRST_RUN`, `canPresent`, `cardLoading`, `clock`, `device`, `field`, `mat`,
  `rack`, `schedule`, `solveChem`, `switchHamiltonian`, `useCompactDefaults`, `wOrb`, `wSh`, `wSlice`, `wSpec`, `wState`, `wVor` · forward `w.stageTextTick`,
  `w.wCalc`, `w.wLad` · app.state `history`, `pendingRef`, `refSnapshot`, `space`, `stageText` (writes `pendingRef`, `refSnapshot`, `space`) · own `chem`,
  `molSession`, `orbitals`, `register`, `restampParams`, `states`. Stage-words backward `paintMarks`, `rack`, `reg`, `wChem` · forward `host.rackL`, `sh.layout` ·
  app.state `chem`, `stageText`, `tl`. Modulation backward `ROT_LIMIT`, `applyAccent`, `cameraPort`, `clock`, `hNote`, `mat`, `mod`, `modHand`, `obs`,
  `occlusion`, `orbitBy`, `page`, `readSettings`, `rotRate`, `saveSettings`, `schedule`, `setKnob`, `setRotationRate`, `settingsStore` · forward `sh.setModArm` ·
  app.state `camKnobs`, `chem`, `dodge`, `modArm`, `modHost`, `modView`, `restampParams`, `states`, `tl` (writes `dodge`, `modHost`, `modView`, `restampParams`).
  Ink backward `field`, `floats`, `occlusion`, `rack`, `rackL`, `schedule` · app.state `modView`, `occludeAt`, `occludeDirty` (writes the last two).
- **The only differences from the base's rows**: the six forward names are spelled through their slot (they were bare names); and **`stageText`**: the brief's
  subtraction removed `app.state.stageText = null;`, the stage words' only eager statement on it, so the literal's `stageText: null` is its seat and the tool
  now classes the stage words' write as ANOTHER scope's (stage-words 4 → 5, still ≤ 25) while `boot` and `loop` each take it as their own (76 → 75 each).
- **THE HINGE (G-G) HOLDS**: 0 bare writes across scopes; the largest moving module SPECTRUM at 24 (limit 25). Shared lets still bare: none. **G-A (static)
  clean**: `app` at `:119` (was `:128`), 30 keys, hooks 12 · state 57 · loop 13 · host 21 · w 71 · ctl 68 · sh 45 — the namespaces unchanged; no member named outside
  the literal. Module files measured **13 → 17**. Names crossing a scope 226 → 226; hoisted declarations 10 → 6 (the four moved functions `stageCaption`,
  `stageTextTick`, `initStageText`, `refreshOcclusion` are destructured consts now); the plain summary's forward uses 74 → 71 (deferred 69 → 66, hoisted 5 → 5,
  eager let/const 0 → 0), boot-level names 291 → 282, never referenced 8 → 13 (§9 candidate 5).
- `tests/rack-deps.test.mjs` GREEN (re-run: "the real tree: 17 module file(s) measured as their planned modules"). Every other row of the table is the base's, byte
  for byte.

## 6 · The import fan-out

See §2: `rack.js` **44 → 35 import lines**, **19 names out**; the shared seven; module lines 3 · 3 · 1 · 1. The accepted cycle `TIER` from `'../rack.js'` is
read in three of the four modules (molecules, modulation, ink), inside functions only.

## 7 · The `app.w` registrations (and boot fills)

- **Registered by molecules.js**: `app.w.wChem` at the end of the first span (`:99`, on the return line — the stage words and readouts' second seat read it),
  `app.w.wOrbs` at the second seat (`:87`, where the base filled it — readouts' second seat reads it eagerly).
- **Registered by stage-words.js** at its root (`:39`): `app.w.stageTextTick` (persist DESTRUCTURES it at creation, `persist.js:15`; molecules' `setOn`
  reads it at use) and **`app.w.stageCaption`** (new: R2c's film reads `app.w.stageCaption()` at use beside this row — its `caption:` / `pending:` closures;
  the slot was in the literal, filled nowhere).
- **Registered by readouts.js** (the owner's line, the ONE edit outside the regions): `app.w.wSh = wSh;` joins `wOrb` / `wVor` / `wSlice` (`readouts.js:92`);
  molecules destructures all four.
- **One boot fill, NEW**: `app.host.cameraPort = cameraPort;` appended to the camera law's fill line (`rack.js:646`). Nobody filled the `host` slot; the seam
  destructures it at creation (`modulation.js:5`), and R2c's material (the CAMERA panel) reads the same name. Said in §10.
- **No inherited fill stays in `boot()`**: `app.w.stageTextTick` (`:1136`), `app.w.wChem`, `app.w.wOrbs` (`:1229`) moved with their declarations; `grep -n
  'app.<ns>.<x> ='` across `lab/` gives ONE line for each of `wChem`, `wOrbs`, `stageTextTick`, `stageCaption`, `wSh`, `cameraPort`.
- **Returned, not registered** (a const `boot()` reads): `initStageText` (called by name at `go`, `rack.js:1452`; `app.w.initStageText` stays null),
  `refreshOcclusion` (the loop, `:349`; `app.sh.refreshOcclusion` stays null), `head` (the facade's literal, `:1148`), `createMoRegistry`.
- **What `boot()` destructures** (8 names): seat 1 — `wChem` (the loop, `:514–519`), `head` (the LW literal), `createMoRegistry` (the seat call); stage words —
  `stageCaption` (the film road `:948` and `capture`, `:950`), `stageTextTick` (the loop, `:481`), `initStageText` (`go`); MO-REGISTRY — `wOrbs` (the loop,
  `:520–521`); ink — `refreshOcclusion`. The seam returns nothing.

## 8 · The light check

This tree on 9113/5583; the base export (`5fb9671`) on 9117/5587, run ONCE for each red the tree read. Rig: 2–3 frames a second, marionette dying after a few
reloads. A red of that kind was checked once against the base, both readings recorded, no loop.

| gate | this tree | the base (`5fb9671`), where the tree was red | reading |
|---|---|---|---|
| `bash test.sh node` | **exit 0** † (`.tmp/node-gate.txt` read: `ink.test` 0 failing of 17, `rack-deps` "17 module file(s) measured", `wiring` 251 of 268 files reached, `project-formats` 8, `new-project` 16,117 B, `statelink` 22, molecule-head's node proof 38 records, `pwa` 364 files); `rack-deps.test`, `wiring.test`, `pwa.test` re-run for this file: PASS | — | GREEN |
| `node tests/pwa.test.mjs --write` | run in `489c54c` after the `lab/` edit (four module rows; rack.js digest `9312cd5bccb1`, readouts `aa7fcfa3f593`); re-run read-only for this file: "precache list == lab/ on disk: 364 files" | — | GREEN |
| `node tools/rack-deps.mjs --classes` | §5: molecules 8, stage-words 5, modulation 10, ink 3, 0 bare writes, G-A clean — re-run, identical to the first run | the base's own table | the hinge holds |
| `serialize-bytes` | **11/11 full + 11/11 edit sha-identical to the base export**, 0 page errors (`.tmp/sb-tree.json` vs `sb-base.json`, compared with `.tmp/sbcmp.mjs` for this file: 11 same · 0 differ) | the base ran beside, every sha equal | GREEN |
| `settings-probe` | **0 reached scenes red**: 3 reached (boot 716 B, WAVE DANCER 752, WATER 736; reloads byte-identical) then marionette died | 4 reached (the same three + BENZENE 736), then N₂ "Render did not settle: animation frames stopped" | GREEN on every reached scene, the same blobs; the rig |
| `lw-facade` | **1/1** † | — | GREEN |
| `stage-text` | **GREEN** (4 PASS: the KaTeX formula and its tick budget; the hand's preset announced once; the banners speak the names; the picture carries the caption, MOLECULES captions "H₂O · 1b1 HOMO · STO-3G") | — | GREEN — the STAGE TEXT through the new module |
| `molecule-demos` | **GREEN**, 5 PASS (WATER 3.4 s · BENZENE 3.6 s · N₂ 0.7 s · H₂ σu 0.5 s · HELIUM 1.0 s) | — | GREEN |
| `molecular-names` | **6 PASS** (MOLECULES and MO-REGISTRY start on the left rack under SPECTRUM; a MOLECULES-owned project brings its card back; the names; the legacy H₂⁺ record restores as MOLECULES · H₂) | — | GREEN |
| `mir-controls` | **2 PASS** (the ONE KNOB LAW; opt-in sensitivity) | — | GREEN |
| `routed-knob` | **4/4** (K0–K3) | — | GREEN |
| `camera-routes` (`tools/camera-routes.mjs`) | **5/5 projects** GREEN (WAVE DANCER's `r4 → observer.fov` route keeps its base; WATER · BENZENE · N₂ · NEW none) | — | GREEN — `defs` and the `camOut` road through the new module |
| `chem` | **54/55**: RED L7 glycine "solved off the frame thread in ≤ 1638 ms" — **1704 ms** (predicted 666) | **1789 ms**, the same budget 1638, the same line RED (also 54/55) | the rig (a timing; the tree is the faster) |
| `molecule-head` (browser) | RED at `:44` — the tap's `elementFromPoint` ≠ the target (`why: 'covered'`); the head shown, KaTeX and md assertions before it pass † | **RED at `:44`, identically** (`why: 'covered'`) | the rig |
| `frame-occlusion` | RED at `:41:68` (`chipGap`) on the second run; the first run read red at `:64` † | **RED at `:41:68`, identically** | the rig (INK is the mask; the brief's named `chipGap`) |
| `hit-probe-set` | "Render did not settle: animation frames stopped" (`hit-probe-set.mjs:68`) | **identical** | the rig; the 0-reached count unreadable both sides |
| the boot suite's blocks (chunk runner; B1 ×2 + B43 in the preamble) | GREEN: B1 ×2, B43, B8, B63, **B74–B77** (W-MODWINDOW: the rack replaces the playhead, a modulated parameter is readable, the cadence and the ONE clock, the axis), B134, B135, B138 · RED: B9 (play advances), B93 (`w` 356 against the law's 360), B140 (the modulated dial tells the ear) | the same verdicts: **B9, B93 (`w` 356 / 360), B140 RED**, the rest GREEN | the rig, block for block |

The first chunk run (B1 ×2, B43, B8, B9, B63, B74–B77, B93) ended, on BOTH trees and at the same place, with a runner error — `ReferenceError: goto is not
defined` at `.tmp/chunk-gen.mjs:732`, in the generated chunk after B93's verdict; the second chunk (B1 ×2, B43, B134, B135, B138, B140) ran whole. No block
named in the brief's MOLECULES / MO-REGISTRY / STAGE TEXT list is in the chunk runs; their laws were read by the dedicated suites above (`chem`, `stage-text`,
`molecule-demos`, `molecular-names`, `molecule-head`). **B108 and B112** (the brief's source-reading blocks, via `appFiles()`) are not in the recorded run;
no source-reading test names a moved identifier (grep of `tests/` for `stageCaption`, `refreshOcclusion`, `moleculeMode`, `createMoRegistry`, `headLand`,
`stageTextTick`, `initStageText`, `INK STAYS`: only the B74–B76 titles say W-MODWINDOW), and R-V's whole-suite run is the real reading.

THE LOCK is not this row's: `defs` and `refreshOcclusion` moved verbatim — none of the seven differing lines is in either (§3). Not run. B149 (the law red),
B6/B69 (flakes), `latex-copy`, `keyboard-window`: not in this row's set, not run.

## 9 · Brief candidates (R2c · R5 · R-V · the integrator)

1. **`app.w.head` has no registration.** The slot exists in the literal (`rack.js:135`); `boot()` destructures `head` from `createMolecules` and the LW literal
   reads it by name (`head,` at `:1148` — `__LW.head`, which `lw-links` and `molecule-head` read). R5 moves the literal: add `app.w.head = head;` to molecules'
   root return line (`molecules.js:99`, beside `app.w.wChem = wChem;`), or read the return.
2. **`app.state.stageText` has no module owner now.** The brief's subtraction made `boot()` (the literal's `stageText: null`) its owner; stage-words writes it
   live in `initStageText` (`stage-words.js:103`) and its row went 4 → 5. R5's facade keeps reading it live (`LW.stageText = app.state.stageText` at `go`, `:1452`).
3. **The brief's text and its table disagreed on `rackL`**: "backward" for the stage words (text) against "forward 2" (table). §17 comes AFTER the stage words'
   seat, so `rackL` is read at use (`app.host.rackL`); the table was right. Ink's `rackL` / `floats` are backward (§17 is before `:1129`).
4. **`app.host.cameraPort` had no fill at all** (a camera-law return boot used by name); the seam and R2c's material both need it as a slot.
5. **Five names are now never referenced in `rack.js`** (the tool's "never referenced" 8 → 13; `.tmp/unused-names.mjs`): `setKnob`, `occlusion`, `cardLoading`,
   `solveChem` (the controller seat's 68 destructure, `rack.js:157–159`) and `wState` (STATE's seat, `:991`) — only the moved regions read them. Drop at the next
   touch of those two lines (R2b candidate 4's pattern, `solveCard` / `markBatchBegin` still waiting).
6. **`toLUT` is a dead import** (`rack.js:31`, mentioned only in comments; the tool's "imports never referenced (toLUT)", on the base too). Drop with the next
   edit of that line.
7. **Four hoisted functions became destructured consts** (`stageCaption`, `stageTextTick`, `initStageText`, `refreshOcclusion`; hoisted declarations 10 → 6).
   Nothing calls them before the seats: the loop reads `stageTextTick` (`:481`) and `refreshOcclusion` (`:349`) inside the frame function, which first runs at `go`;
   `stageCaption` is read in closures (`:948`, `:950`); `initStageText()` runs at `go`. When the loop leaves `boot()` its reads of `wChem`, `wOrbs`,
   `stageTextTick` are already slots; `app.sh.refreshOcclusion` and `app.w.initStageText` are NOT filled (return them from ink / register them then).
8. **The chunk runner's generated file stops with `ReferenceError: goto is not defined`** (`.tmp/chunk-gen.mjs:732`, `await goto('warn=0');`) right after B93's
   verdict in the first range (`.tmp/chunk-ranges.txt`), on both trees: a block in that range calls a `goto(...)` helper the generated chunk does not define.
   R-V's whole-suite run reads those blocks properly. B108 / B112 as in §8.
9. **Cap**: R2d cost +31 of the 50 lines left after PAIR 2; **19 remain** for R2c's three modules and R5's facade. The shape cost was 35 lines, of which the
   brief's measure (headers + signatures + returns) was 17.

## 10 · Merge notes (for the integrator)

- **The seat lines** (this tree): `rack.js:28` the one module-import line · `:1010–1011` LEGACY note + `:1012` seat 1 (`const { wChem, head, createMoRegistry } =
  createMolecules(app);`) · `:1014–1018` stage-text note + `:1019` (`const { stageCaption, stageTextTick, initStageText } = createStageWords(app);`) ·
  `:1021–1025` ORBITALS note + `:1026` (`const { wOrbs } = createMoRegistry();`) · `:1031–1053` the 23-line WAVE 52 note + `:1054` `createModSeam(app);` ·
  `:1122–1128` INK note + `:1129` (`const { refreshOcclusion } = createInk(app);`). **What `boot()` destructures**: §7 (8 names).
- **`app.host.cameraPort`** — the fill is on the camera law's host line (`rack.js:646`: `… app.host.zoomAt = zoomAt; app.host.cameraPort = cameraPort;`).
  **R2c writes the same on the same host line: keep ONE** (the slot is filled exactly once; the duplicate is a G-A double).
- **After R2c's film move `boot()` reads `stageCaption` no more** (its only two reads are `:948` and `:950`, both in the film piece). Then: **drop
  `stageCaption` from the stage-words destructure** (`const { stageTextTick, initStageText } = createStageWords(app);`) **and delete R2c's boot-kept
  `app.w.stageCaption = stageCaption;` at `go`** — stage-words registers it at its root (`stage-words.js:39`), and the film reads `app.w.stageCaption()` at use.
- **The import deletions WILL conflict with R2c's**: the base's `:21–27`, `:33–35`, `:41`, `:44`, `:46` (the launch message numbered them 4–10, 16–18, 24, 27, 29 —
  the same lines, counted from the import block's first line, 17 lower). R2c deletes its own neighbouring import lines: **take both** (the name sets are disjoint;
  mine are the 19 of §2; the shared seven stay). `rack.js` otherwise auto-merges: the five span → seat replacements are in the base's `:1021–1607`, away from R2c's `:658–:997`,
  the literal's `loop: {` line and `go`.
- **The five `PLANNED_CUT` anchor comments** (`tools/rack-deps.mjs:931 · 932 · 933 · 935 · 942`): comment-only edits, no regex touched. R2c edits its own rows in the
  same table: if git flags the neighbours, take both.
- `lab/windows/readouts.js` +`app.w.wSh = wSh;` on its root registration line (`:92`): R2c does not touch readouts.
- **`lab/sw.js` conflicts** (four precache rows + two digests here; R2c's own rows and the rack.js digest there): resolve by taking either side, then **`node
  tests/pwa.test.mjs --write`** on the merged tip. REPORT.md: this wave is **222** and sits right after wave 220; R2c writes **221** in its tree — order them at
  the merge (221 before 222).

## 11 · The drafted CLAUDE.md sentences (for the integrator; NOT applied)

> THE MOLECULES, THE STAGE WORDS, THE MODULATION SEAM AND INK (0.5.2 R2d): MOLECULES with the molecular session and THE HEAD's seat, and MO-REGISTRY, are
> `lab/windows/molecules.js` `createMolecules(app)` at TWO seats — the root builds MOLECULES where the LEGACY note stands and returns `createMoRegistry()`, which `boot()`
> calls where ORBITALS stood, below the stage words (`app.w.wChem` is registered at the end of the first span, `app.w.wOrbs` at the second); THE STAGE TEXT with its
> caption is `lab/shell/stage-words.js` `createStageWords(app)` (it registers `app.w.stageTextTick` and `app.w.stageCaption` at creation and returns `initStageText` for
> `go`; `app.state.stageText` is the literal's, assigned live), the ONE `defs` table, `mod.install`, the pill's seat and dodge and `app.state.modView` are
> `lab/shell/modulation.js` `createModSeam(app)`, and §18 INK is `lab/shell/ink.js` `createInk(app)` (it returns `refreshOcclusion` for the loop) — all moved verbatim and
> called at their seats under the kept section notes. A name `boot()` makes after a seat is read through its slot inside a callback (`app.w.wLad`, `app.w.wCalc`,
> `app.w.stageTextTick`, `app.host.rackL`, `app.sh.layout`, `app.sh.setModArm`), and `app.host.cameraPort` is filled on the camera law's line so the seam can destructure it.

## 12 · What Josh will see

**Nothing.** The work: `serialize-bytes` 11/11 full and 11/11 edit sha-identical to the base export run beside it — a project, a link and an undo row are the same
bytes. The browser's memory: `settings-probe` judged no reached scene red, the same blobs (716 / 752 / 736 B) and byte-identical reloads on both trees. The facade:
`lw-facade` 1/1. The molecules and the stage words: `stage-text` GREEN (the formula, the fade, the banners, the caption a picture carries), `molecule-demos` GREEN
(WATER · BENZENE · N₂ · H₂ σu · HELIUM), `molecular-names` GREEN (the cards start on the left rack under SPECTRUM and come back with a MOLECULES-owned project),
`mir-controls` GREEN. The seam: `routed-knob` 4/4, `camera-routes` 5/5, B74–B77 GREEN. The windows: the same `device()` / `appendChild` calls in the same order — MOLECULES
where it stood, MO-REGISTRY where it stood, below the stage words — so the rack's DOM order, `captureLayout` and `closed[]` are the base's (the probe's blobs and the
project bytes say so). The code: 463 of 470 moved lines byte-identical; the other 7 are the same expressions read through a slot (5) or a fill made a registration (2).
The reds (`chem` L7's timing, `molecule-head`'s tap, `frame-occlusion`, `hit-probe-set`, B9 / B93 / B140) are the rig's, reproduced on the base reading for reading.
