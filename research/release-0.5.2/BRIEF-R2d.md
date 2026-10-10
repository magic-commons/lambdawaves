# BRIEF R2d · MOLECULES + THE STAGE WORDS + THE MODULATION SEAM + INK (0.5.2 "Rack Dissolution"; Opus builder; PAIR 3 with R2c — disjoint regions AND disjoint `app` slots)

**Read first, whole:** `research/release-0.5.2/PLAN.md` (§1, §2, the PAIR 3 row in §3, §4, §6 U2, §8, §9), **`R0-BUILD.md`** (§5 the namespaces, §6 the classes table
and the shared-let owners — molecules owns `chem`, `molSession`, `orbitals`, `register`, `restampParams`, `states`; stage-words owns `stageText`; modulation writes
`dodge`, `modHost`, `modView`, `restampParams`; ink writes `occludeAt`, `occludeDirty`; §7 the `ui` contract), **`R1-BUILD.md`** §8–§9, **`R2a-BUILD.md`** (§1 THE READ
LAW; §9 candidates; §10 merge notes), **`R3a-BUILD.md`** (§7 candidates), **`R2b-BUILD.md`** and **`R3b-BUILD.md`** (PAIR 2 as built: the readouts' three seats, the
kepler, the transport, the rack wiring — what `app.sh.layout`, `app.host.rackL`/`floats` and `app.sh.devById`/`popFace`/`rackCardWidth` are at the tip), `BRIEF-R2b.md`,
`lab/windows/readouts.js` (a module with MORE THAN ONE SEAT — molecules is that shape), `lab/shell/transport.js` (a shell module), `lab/shell/controller.js` (NEVER edit
it), `tests/helpers/app-source.mjs`, `tools/rack-deps.mjs` (`--classes`; `--section`; the module-file mode; `PLANNED_CUT`'s anchors), `CLAUDE.md` (its last six
paragraphs and the MOLECULES / STAGE TEXT / modulation paragraphs), `docs/STATE-SCOPES.md`, `lab/mir/modulation/modwindow/host-contract.md` (the seam's law; the kit
is never edited).

## As-built facts (the integrator, 2026-10-10 after PAIR 2 — the launch tip `03200df`; the BUILD files are the authority)

- **THE READ LAW (R2a, binding):** your four modules are seated AFTER the controller — a name that is a CONST by then (§0's consts, the loop's hoisted functions, the
  rack, the controller's 68 on `app.ctl`, what every earlier-seated module registered on `app.w` / `app.sh` / `app.host` — `wSpec`, `wState`, `wSh`, `wOrb`, `wVor`,
  `wSlice`, `switchHamiltonian`, `solveChem` …) is DESTRUCTURED ONCE at the top of the module — the tool counts that as backward. A name made AFTER your seat is read
  through its slot INSIDE a callback (`app.sh.layout`, `app.sh.setModArm`, `app.w.wCalc`, `app.w.wLad`, `app.host.rackL` from the stage words). A shared `let` is
  always `app.state.x`, live, never destructured (molecules' six are assigned LATE — `chem`, `molSession`, `orbitals` … — so even your own are `app.state.x`).
  Reading a const through `app.<ns>.x` at use is NOT the pattern (a forward crossing each; modulation sits at 10).
- **Your rows at the launch tip (the merged table):** molecules 98 lines, backward 18, forward 3, another scope's `app.state` 5 (+6 own), **fwd + shared 8**; stage-words 124 lines, backward 4, forward 2, another scope's `app.state` 2 (+1 own), **fwd + shared 4**; modulation 247 lines, backward 19, forward 1, another scope's `app.state` 9, **fwd + shared 10**; ink 51 lines, backward 6, forward 0, another scope's `app.state` 3, **fwd + shared 3**.
  Limit 25, zero bare writes. Count before and after. (THE HINGE (G-G): bare writes across scopes 0; the largest moving module spectrum at 24 (limit 25) → HOLDS; 13 module files measured.)
- **Your regions** (`lab/rack.js` 2001 lines at `03200df` — re-locate by grep on your base). **MOLECULES, two spans:** `/* ── LEGACY WINDOWS` :1019
  (the five retired shims' notes; `let specFoldedByMol` :1027), `/* CHEMISTRY — eight molecules` :1047 (`let chemPrevView` :1049), `/* THE
  MOLECULAR SESSION` :1058, `const wChem = device(` :1064 → before `/* THE STAGE TEXT` :1099; and `/* ORBITALS — the MOLECULAR REGISTER`
  :1223 (`const wOrbs = device(` :1228; `app.w.wChem = wChem; app.w.wOrbs = wOrbs;` :1229) → before `// CALCULUS` :1241 (R2b's seat).
  **THE STAGE WORDS:** :1099 → :1222 (`app.state.stageText = null;` :1104, `stageSrc`, `stageStates`, `stageMd`, `function
  stageCaption()` :1122, `function stageTextTick()` :1129, `app.w.stageTextTick = stageTextTick;` :1136, `function initStageText()`
  :1149 — the INFORMATIONAL layer, THE FADE, THE HEAD, the ATOM LABELS, the caption). **THE MODULATION SEAM:** `/* ── WAVE 52 · W-MODWINDOW` :1244
  (a 23-line note) and `/* ── WAVE 64 · THERE IS NO MODULATION CARD` :1267 (the ONE `defs` route table with `camOut` :1288, `app.state.modHost =
  mod.install(defs, …)` :1410, the pill's seat and dodge, `app.state.modView = createModulation(` :1472) → before `// ATOMS` :1491 (R2b's
  seat). **INK:** `/* ── INK STAYS UNDER GLASS` :1557 (`NO_OCCLUSION` :1564, `function refreshOcclusion(nowMs)` :1565 and its occlusion walk — §18's
  `devById` / `rackCardWidth` / `popFace` are RACK-WIRING's since R3b: `popFace` read `layout` while that module was being made) → before `/* ── 0.5.0 C3 · THE
  RACK IS THE KIT'S` :1608 (R3b's seat). §17 THE FLOATING
  RACK :1547–:1556 (`const rackL` :1548, `LAYOUT_SLOTS` :1552, `const floats` :1555) STAYS in `boot()`; §27 stays.
- **The seats (G-O, the DOM-order law):** `wChem` :1064 and `wOrbs` :1228 are the region's only `device()`s; the stage words create none; the seam creates
  none (the modulation window is the kit's on `#floats`). **Default: molecules keeps TWO seats** in THE MULTI-SEAT SHAPE (R2b, and the tool's rule): the root builds the first span and RETURNS the
  later seat as a **root-level `function create<Y>() { … return { … }; }` declaration** (never an arrow or a nested closure — the tool reads those as deferred
  callbacks and their fills as never made, and refuses the tree): `const { wChem, createRegister } = createMolecules(app);` where :1019 stood and `const {
  wOrbs } = createRegister();` where :1223 stood — `lab/windows/readouts.js` is the worked example; **ONE seat is allowed with the proof** that MO-REGISTRY's
  span reads no stage-words product at creation and `serialize-bytes` 11/11 full holds. `createStageWords(app)` one seat where :1099 stood; `createModSeam(app)` one
  seat where :1244 stood; `createInk(app)` one seat where :1557 stood. Say which shape you chose and why.
- **Fills you inherit — each moves WITH its declaration into your module and becomes its registration; none stays in `boot()`:** `app.w.stageTextTick =
  stageTextTick;` :1136 (persist DESTRUCTURES it at creation :1617 → register at your module's ROOT the moment it exists; the tool's G-A
  accepts an earlier-seated file's eager fill, `rack-deps.test` §5); `app.w.wChem = wChem; app.w.wOrbs = wOrbs;` :1229 — **split**: `app.w.wChem` is
  registered at the END of molecules' FIRST span (the stage words destructure `wChem` at creation, :1218 is inside `initStageText`; their seat is between
  your two spans), `app.w.wOrbs` in the second. **Every slot is filled exactly once** — grep `app.<ns>.<x> =` across `lab/` before writing any fill (PAIR 1 left four
  doubles; PAIR 2's are in their BUILDs).
- **The slots you register for OTHER modules (all exist in the literal; grep each before you write it):** `app.w.stageCaption` — **R2c's film reads
  `app.w.stageCaption()` at use beside you** (its `caption:` / `pending:` closures): register it at stage-words' ROOT; R2c writes a boot-kept copy at `go` in ITS tree
  and the integrator deletes that copy at the merge (registered today at nowhere yet). `app.w.initStageText` — `boot()` calls `initStageText()` by name at
  :1930 (§27): RETURN it from `createStageWords(app)` instead (`const { initStageText } = createStageWords(app);` — a const; the call is far below), no slot
  needed; say which. `app.sh.refreshOcclusion` — the LOOP reads `refreshOcclusion(nowMs)` by name at :358: RETURN it (`const { refreshOcclusion } = createInk(app);`
  — the loop's first frame runs after `go`, never before your seat; the slot stays null unless a moved module reads it). `app.sh.devById` / `popFace` /
  `rackCardWidth` are rack-wiring's registrations (`lab/shell/rack-wiring.js:277`) — not yours. `app.w.wChem` / `wOrbs` — the loop reads them by name (:523): RETURN them to `boot()` as well; and **readouts' second seat
  (`createCalcMetersLadder()`, called at `// CALCULUS` :1241) reads `app.w.wChem` / `app.w.wOrbs` EAGERLY** (the two `devopen` listeners moved there with
  LADDER's span, R2b), so both must be registered before that seat runs — `wChem` at the end of your first span, `wOrbs` at the end of the second, exactly where
  today's fill :1229 stands.
- **R3b's law — the creation-time TDZ:** a `boot()` function your module calls WHILE IT IS BEING CREATED must not read a name your module returns (`popFace` read
  boot's `layout` from inside `createRackWiring` and had to move with it). Grep each of your spans for calls made at creation (not in a callback) into functions
  that stay in `boot()` or sit in a later module, and say the result — the seam's `mod.install(defs, …)` and `createModulation(…)` run at creation and read
  `defs` (its own), the pill, `obs`, `cameraPort`…; INK's `refreshOcclusion` is called by the loop only.
- **`wSh`** (MOLECULES reads SHADOW's handle — the tool lists it backward): readouts' root registers `wOrb` / `wVor` / `wSlice` but NOT `wSh`. Add `app.w.wSh =
  wSh;` to readouts' root registration line (`lab/windows/readouts.js`, the owner's line — the ONE edit outside your regions; R2b candidate 6) and destructure it
  with the other three, or read it at use; say which.
- **The names you read that others own:** `app.sh.layout` (rack-wiring's eager registration, seated AFTER you → at use inside callbacks; filled at `lab/shell/rack-wiring.js:277`),
  `app.sh.setModArm` (transport's, seated after the seam → at use; `lab/shell/transport.js:204`), `app.w.wCalc` / `wLad` (readouts' second seat, after molecules → at use;
  `lab/windows/readouts.js:121` / `lab/windows/readouts.js:121`), `app.host.rackL` / `floats` / `LAYOUT_SLOTS` (§17's consts, boot-kept, declared BEFORE ink and the stage words — R3b fills them on §17's
  `floats` line, `lab/rack.js:1555`: destructure them in ink; the stage words read `rackL` inside `initStageText`'s closures — at use or destructured, both are
  backward there). `occlusion`, `mod`, `modHand`, `setKnob`, `cameraPort`, `orbitBy`, `rotRate` … are the controller's / the camera law's (`app.ctl`, `app.host`):
  destructure.
- **U2 — the ONE `defs` table stays ONE ordered list** inside `lab/shell/modulation.js` and `mod.install(defs, [...])` keeps its argument; no per-card `routes`
  split (Group II). `app.state.modHost` and `app.state.modView` stay the live members every module reads. The `observer.*` defs read `app.state.camKnobs[id]` (R2c's
  material fills it beside you — live, no change). `tools/camera-routes.mjs` 5/5 proves the routes after the move.
- **Subtractions on your way:** `app.state.stageText = null;` :1104 repeats the literal's `stageText: null` (−1); the two fill lines :1136
  and :1229 leave `boot()` as registrations (−2 there); say every other one you find (a dead branch, a duplicated comment). Say your exact Δ.
- **Tests that read the SOURCE:** `tests/ink.test.mjs` (slices `rack.js` for INK's text — re-point through `appSource()` in the SAME commit; PLAN §3 lists it under
  R2c by mistake: INK is yours), `node tests/native-ui.test.mjs`, `node tests/molecule-head.test.mjs`, the boot suite's B108/B112. Grep `rack.js` in
  `tests/*.test.mjs` for your regions' text first.
- **The tool** (`tools/rack-deps.mjs`): `PLANNED_CUT` anchors your pieces today (`/* ── LEGACY WINDOWS` → molecules, `/* THE STAGE TEXT (Settings › Display;` →
  stage-words, `/* ORBITALS — the MOLECULAR REGISTER` → molecules, `/* ── WAVE 52 · W-MODWINDOW` → modulation, `/* ── INK STAYS UNDER GLASS` → ink). After the
  move each SEAT line must still match its anchor (keep the header lines at the seats verbatim, as R2a kept `// STATE — preparation`); the module-file mode then
  measures your four files from the MODULES table (`lab/windows/molecules.js`, `lab/shell/stage-words.js`, `lab/shell/modulation.js`, `lab/shell/ink.js`). Say the diff.
- **Line law:** `lab/*.js` + `lab/shell/` + `lab/windows/` = **27,893 of a 27,943 cap after PAIR 2 (50 lines for the EIGHT modules still to move,
  seven of them PAIR 3's and R5's; the cap WILL be passed — that ruling is Josh's at R-V, not yours).** Your part: four headers + signatures + returns ≤ 20 lines IN
  ALL (R3a's four read 7 / 7 / 6 / 6), no new blank lines, the subtractions above, every inherited fill line gone from `boot()`.
- **Disjoint from R2c** (running beside you): you touch :1019–:1240, :1244–:1490, :1557–:1607, two boot-kept lines in §17 if
  needed, `PLANNED_CUT`'s rows for your pieces, and the import lines your regions alone use. R2c touches :658–:997 (the WAVE · SETTINGS · FILM block,
  above STATE), the literal's `loop: {` line, one line at `go`. An import you BOTH
  use stays in `rack.js`; the import block will conflict on adjacent deletions — the integrator's. Never edit a line outside your regions + your seats + the lines
  named here; `rack.js` must otherwise auto-merge.
- **The rig** (since ≈ 02:00): the GPU draws 2–3 frames a second and stalls on the heaviest states ("Render did not settle: animation frames stopped" — molecule
  opens in `settings-probe` (WATER / N₂) and `serialize-bytes`' base export (WAVE DANCER), `hit-probe-set`, `frame-occlusion`'s chipGap — YOUR suites hit it most:
  `chem`, `molecule-demos`, `molecule-head`), frame-paced waits go red, marionette dies after ≈ 5 in-session reloads — all on the BASE as well. **A red of that kind is
  checked ONCE against your base export on your second port: identical = the rig; record BOTH readings in the BUILD and move on. Never loop on it; never touch
  another process.** If the base export dies in `serialize-bytes`, compare your tree's shas to R1's recorded base reading (`r1-measure/sb-base.json`; R3a's
  `.tmp/sbcmp.mjs` pattern). Josh may reboot during your run: if your servers die, restart them by the same commands and continue.

## The contract (a MOVE, not a rewrite)

1. **What moves:** MOLECULES + the molecular session + THE HEAD's seat + MO-REGISTRY (two spans) → **`lab/windows/molecules.js`** `createMolecules(app)`; THE STAGE
   TEXT + the caption → **`lab/shell/stage-words.js`** `createStageWords(app)`; the modulation seam (the ONE `defs` table, the pill's seat and dodge, `modView`) →
   **`lab/shell/modulation.js`** `createModSeam(app)`; §18 INK → **`lab/shell/ink.js`** `createInk(app)`. §17 and §27 stay.
2. **Called at their seats** (G-O); the code VERBATIM (indentation kept; comments and headers travel; no renames beyond R0's `app.state`); each module destructures
   its consts once (THE READ LAW), reads later-made names through their slots inside callbacks, registers on `app.w` / `app.sh` what a reader outside it needs (the
   inherited fills and the slots named above), returns to `boot()` what `boot()` reads; every `ui.x =` stays under the same name on `app.ui`; the owned `app.state`
   seats travel with the code.
3. **Imports** the regions need move from `rack.js` to the modules (say how many; `TIER` from `'../rack.js'` is the accepted cycle; `createModulation`,
   `createInfoLayer`, `formulaLatex`, `moleculeHead`, `MOLECULE_BY_ID`, `stateLatex` … — check each with `research/release-0.5.2/r3a-measure/freenames.mjs`
   against your base BEFORE the browser does).
4. **Never edit `lab/shell/controller.js`**, `lab/mir/**`, `lab/fonts/**`; the kit's modulation contract is adopted, not adapted.

## Acceptance (the light check)
- `bash test.sh node` 0; `node tools/rack-deps.mjs --classes` before/after (`molecules`, `stage-words`, `modulation`, `ink` from their files, ≤ 25, 0 bare writes;
  `tests/rack-deps.test.mjs` green); `chem`; `node tests/molecule-head.test.mjs` + `molecule-head` (browser); `stage-text`; `molecule-demos`; `molecular-names`;
  `mir-controls`; `routed-knob` 4; `tools/camera-routes.mjs` 5/5; `node tests/native-ui.test.mjs`; `node tests/ink.test.mjs` (re-pointed); **`frame-occlusion` 7**
  (INK is the mask — rig red → the base once); `hit-probe-set` 0 reached; `serialize-bytes` 11/11 full + edit vs your base export; `settings-probe` 0/6 (5 reached if
  marionette dies); `lw-facade` 1/1; the boot suite's MOLECULES / MO-REGISTRY / STAGE TEXT / modulation blocks alone (chunk runner — `grep -n "MOLECULES\|REGISTRY\|
  STAGE\|modulation\|INK" tests/legacy/boot.browser-test.mjs`); `node tests/pwa.test.mjs --write` after every `lab/` edit. THE LOCK is not yours unless `defs` or
  `refreshOcclusion`'s mask change shape (they must not; if one does, STOP and say so).

## Commits (each followed by `R2d-HANDOFF.md`)
1. `0.5.2 R2d · lab/windows/molecules.js + lab/shell/stage-words.js + modulation.js + ink.js: MOLECULES · MO-REGISTRY, the stage words, the modulation seam and INK move verbatim; the inherited fills become registrations` (+ pwa).
2. `0.5.2 R2d · the light check; the classes table; R2d-BUILD.md; wave 222` (REPORT.md under the 0.5.2 heading; the drafted CLAUDE.md sentence in the BUILD, not
   applied).

## Harness
Isolated worktree: `git reset --hard <the integrator's tip named in your launch message>` first. Ports: yours **9113/5583** (your tree) + **9117/5587** (the base
export: `git archive <sha> | tar -x -C <dir>`, served with `LW_CERTS=<your worktree>/.certs`). `python3 tools/gate/server.py <path> <port>` (run_in_background);
`LW_PORT=… GD_PORT=…`. ONE browser at a time on the rig — R2c runs beside you: `node research/release-0.5.2/r2b-measure/rigfree.mjs` (exit 0 = free; it reads
`/proc` by argv0, so another builder's poll that merely NAMES "marionette" never counts — `tools/perf/wait-gpu.mjs` does count it and two pollers can hold each
other "busy" for minutes, R2b candidate 5) before EVERY suite; if another suite is running, wait (poll every 30 s); never kill another's process; stop yours by
pid; never `pkill -f`. The shell guard refuses compound lines (plain commands or `bash .tmp/x.sh` / `node .tmp/x.mjs`). Never edit `lab/mir/**`, `lab/fonts/**`,
`lab/shell/controller.js`. No `sed` over `rack.js`. Subtract, don't add. Never merge, push, tag.
B149 is the standing law red; B6/B69 flake; `latex-copy`/`keyboard-window` red on the base — say them, don't fix them. The integrator's chunk runner:
`/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/optimization-2026-09-24/.tmp/chunk.mjs` (copy into your `.tmp/`). `R2d-BUILD.md`: the ledger
(rack.js and the four modules, exact), the classes table before/after, every suite's count with the base reading beside any rig red, the import fan-out, the
registrations and any boot fill left, the seat shape you chose and its proof, the tool diff, brief candidates for R5 / R-V, the merge notes (the seat lines; what
`boot()` destructures), the drafted CLAUDE.md sentence, "what Josh will see" (nothing — prove it). Hand back by message + try `~/.claude/handoffs/agents/<id>.md`.
