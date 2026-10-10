# BRIEF R2b · THE READOUTS + KEPLER (0.5.2 "Rack Dissolution"; Opus builder; PAIR 2 with R3b — disjoint regions AND disjoint `app` namespaces)

**Read first, whole:** `research/release-0.5.2/PLAN.md` (§1, §2, the PAIR 2 row in §3, §4, §8, §9), **`R0-BUILD.md`** (§5 the namespaces, §6 the classes table and the
shared-let owners — kepler owns `bow`, `bowChain`, `bowInFlight`, `gasAxial`, `gasWidth`, `kdrag`, `lastLaunch`; readouts owns `flowEpoch`; §7 the `ui` contract),
**`R1-BUILD.md`** §8–§9, **`R2a-BUILD.md`** (§1 THE READ LAW — the judgement the integrator took; §9 merge notes; §10 candidates), **`R3a-BUILD.md`** (the
shell modules as built; what `app.sh` holds), `BRIEF-R2a.md` (the pattern of a window row), `lab/windows/state.js` and `lab/windows/spectrum.js` (what a moved
window looks like: the destructure block at the top, the fills, the return), `lab/shell/controller.js` (NEVER edit it), `tests/helpers/app-source.mjs`,
`tools/rack-deps.mjs` (`--classes`; the module-file mode; G-A's accepted fills), `CLAUDE.md` (its last four paragraphs: THE CONTEXT, THE CONTROLLER, THE WINDOWS /
THE READ LAW, and R3a's), `docs/STATE-SCOPES.md`.

## As-built facts (the integrator, 2026-10-10 after PAIR 1 — the launch tip `87aad5e`; the BUILD files are the authority)

- **THE READ LAW (R2a, binding):** in a module seated AFTER the controller — every window is — a name that is a CONST by then (§0's consts, the loop's hoisted
  functions, the rack, the controller's 68 on `app.ctl`, and what R2a/R3a registered on `app.w`/`app.sh` BEFORE your seats) is DESTRUCTURED ONCE at the top of
  your module (`const { gov, look, busy, touchState, loadPreset } = app.ctl;` `const { wSpec, spectrum } = app.w;`) — the tool counts that as backward. A name
  `boot()` makes LATER than your seat is read through its slot INSIDE a callback (`app.sh.layout` …). A shared `let` is always `app.state.x`, live, never
  destructured. Reading a const through `app.<ns>.x` at use is NOT the pattern: every such read counts as a forward crossing (SPECTRUM would have read 32).
- **Your rows at the launch tip (the merged table):** readouts 147 lines (SHADOW · ORBIT · VORTEX · PLANE + CALC · METERS · LADDER + ATOMS · WIGNER · RADIATION,
  three spans) backward 14, forward 4, another scope's `app.state` 3 (+1 own), **fwd + shared 7**; kepler 296 (THE BOW + KEPLER AS A CONTROL SURFACE) backward 15,
  forward 1, 3 (+7 own), **fwd + shared 4**. Limit 25, zero bare writes. Count before and after.
- **Fills you inherit — every boot-level `app.w.x = …` line inside your spans moves WITH its declaration into your module and becomes that module's own
  registration; none stays in `boot()`** (R3a-BUILD §5, R2a's candidate 2). First span: `app.w.shadowView` :1048 (R1's — the controller reads it live),
  `app.w.wOrb`/`wVor`/`wSlice` :1124 (SPECTRUM's reads), `app.w.shadowFoot`/`kepler`/`vortex`/`particles`/`slice` :1129 (R3a's — **persist DESTRUCTURES these
  five at its creation**, `rack.js:3221`, so register them at your module's ROOT the moment they exist, never inside a callback; the tool's G-A accepts an
  earlier-seated file's eager fill, `rack-deps.test` §5). Second span: `app.w.wMet` :1365 (R1's), `app.w.wCalc`/`wLad` :1376, `app.w.ladder` :1380 (persist's,
  eager). Third span: `app.w.wAtoms`/`atomsView` :1644, `app.w.wignerView` :1652 (persist's, eager). KEPLER: `app.w.kepShell`/`keplerRowSync` :2141 (persist's,
  eager) and `app.w.gas`/`gasSigma`/`launchPacket`/`enterBox`/`coherentBounce` :2207 (SPECTRUM reads them at use). **Every slot is filled exactly once**: the
  integrator removed four double fills PAIR 1 left (`wAtoms`, `gas`, `layout`, and R3a's whole appends-seat line that R2a's modules already registered) — a
  slot another module registers is NOT filled again in `boot()` (grep `app.w.<x> =` across `lab/` before you write one). `app.w.stageTextTick` :1253 and
  `app.w.wChem`/`wOrbs` :1346 are R2d's, not yours.
- **Still-null slots whose readers are all in `boot()`** (R2a's candidate 3): a row that moves a reader adds one fill line at the owner's declaration.
- **The third span's TAIL STAYS in `boot()`** (PLAN §3: "`READERS`/`track`/`hydroReader` stay"): at `87aad5e` the ATOMS · WIGNER · RADIATION span is
  `:1634–1658` and its tail `:1659–1673` — `Object.assign(READERS, { spectrum: wSpec, shadow: wSh, … })` (:1659–1660), the `windowActivity.track(w)` loop over
  `READERS`/`wVor`/`wMet`/`wLad` (:1661) and `function hydroReader() { … }` (:1665–1673; the loop and the facade read it, and `app.loop.hydroReader` holds it BY
  VALUE in the literal) — is NOT yours to move: the card creations move, those 15 lines stay where they are. `READERS` is one of the 12 controller names only
  `boot()` reads and is not on `app.ctl`; nothing of yours needs it once the tail stays. For the tail to keep working, **your seats hand `boot()` the window
  handles by destructuring** (`const { wSh, wOrb, wVor, wSlice } = createReadoutsA(app);` … `const { wCalc, wMet, wLad } = …;` `const { wAtoms, atomsView, wWig,
  wRad, … } = …;`) — list exactly the names the kept tail, the loop and the facade read (grep each handle in `rack.js` after the move).
- **Lines at `87aad5e`** (PAIR 1 in; `lab/rack.js` 3,605 — re-locate by grep on your base): SHADOW `// SHADOW` :1043 (`const wSh = device(` :1044), ORBIT :1063,
  VORTEX :1098, PLANE :1122 → the span ends before `/* ── LEGACY WINDOWS` :1136; CALCULUS :1358, METERS :1363, LADDER :1374 → before `/* ── WAVE 52 ·
  W-MODWINDOW` :1387; ATOMS :1634, WIGNER :1648, RADIATION :1654 → the kept tail :1659–1673 → `/* ── transport strip (§25)` :1675 (R3b's); THE BOW `/* ── THE
  BOW:` :1935 → KEPLER `/* ── KEPLER AS A CONTROL SURFACE` :2000 → before `/* ── THE FLOATING RACK` :2231. The seats already in the file, for the pattern:
  settings :190–191 (before the controller :194), STATE :1028, SPECTRUM :1031, persist :3220–3221, links :3222–3223, history :3224–3225. **The DOM-order law:**
  the three readout spans interleave with other cards in creation order (STATE · SPECTRUM · SHADOW…PLANE · MOLECULES · MO-REG · CALC…LADDER · the mod seam ·
  ATOMS…RADIATION): your module exports THREE functions or one function with three seats — **three call seats in `boot()`, exactly where each span stood**, so
  no `device()` / `appendChild` / `register` call changes its order. (`createReadouts(app)` may return `{ part2, part3 }` closures, or export
  `createReadoutsA/B/C`; say which.)
- **Line law:** `lab/*.js` + `lab/shell/` + `lab/windows/` = **27,856 of a 27,943 cap after PAIR 1 — 87 lines for the FOURTEEN modules still to move, so the cap
  WILL be passed before the pairs end; that ruling is Josh's at R-V, not yours.** Your part: the two modules' header comment + signature + return ≤ 12 lines IN
  ALL (R3a's four read 7 / 7 / 6 / 6), no new blank lines, every inherited fill line leaves `boot()` (−10 lines there), and find subtractions while you move (a
  dead branch, a duplicated comment) — say them. Say your exact Δ.
- **The rig** (since ≈ 02:00): the GPU draws 2–3 frames a second and stalls on the heaviest states ("Render did not settle: animation frames stopped" — the lock's
  gas state, molecule opens in `settings-probe` (WATER / N₂) and `serialize-bytes`' base export (WAVE DANCER), `hit-probe-set`, `frame-occlusion`'s chipGap),
  frame-paced waits go red (`history` 3b/9b, `new-project`'s LFO), marionette dies after ≈ 5 in-session reloads — all on the BASE as well. **A red of that kind
  is checked ONCE against your base export on your second port: identical = the rig; record BOTH readings in the BUILD and move on. Never loop on it; never
  touch another process.** If the base export dies in `serialize-bytes`, compare your tree's shas to R1's recorded base reading (`r1-measure/sb-base.json`; R3a's
  `.tmp/sbcmp.mjs` pattern). Josh may reboot during your run: if your servers die, restart them by the same commands and continue.

## The contract (a MOVE, not a rewrite)

1. **What moves:** the three readout spans → **`lab/windows/readouts.js`** (SHADOW · ORBIT · VORTEX · PLANE; CALCULUS · METERS · LADDER; ATOMS · WIGNER · RADIATION;
   ≈ 160 lines) with THREE seats; THE BOW + KEPLER AS A CONTROL SURFACE → **`lab/windows/kepler.js`** `createKepler(app)` (294), one seat where THE BOW stood.
2. **Called at their seats** (G-O); the code VERBATIM (indentation kept; comments and headers travel; no renames beyond R0's `app.state`); each module destructures
   its consts once (THE READ LAW), reads later-made names through their slots inside callbacks, registers on **`app.w`** only the slots a reader outside it needs
   (the inherited fills above become your registrations); the owned `app.state` seats (kepler's seven, readouts' `flowEpoch`) travel with the code; every `ui.x =`
   stays under the same name on `app.ui` (R0 §7: `native-ui.js` moves SHADOW's details — keep `ui.shadowDetails` registered; `badges.js` reads `ui.fieldRo`).
3. **Imports** the spans need move from `rack.js` to the modules (say how many; `TIER` from `'../rack.js'` is the accepted cycle).
4. **Disjoint from R3b** (running beside you): you touch the three readout spans, THE BOW + KEPLER, and `app.w`; R3b touches §12 the transport strip, §19a/§19b
   (THE RACK IS THE KIT'S: rack · layout · phone · gestures · MENUS · notebook · PROJECTS), §20–§23 (keys · keyboard window · timeline · tab order), and `app.sh`.
   Never edit a line outside your spans + your four call seats + the import lines you move; `rack.js` must auto-merge. A boot-kept fill you both need (one
   line at one seat): write it; the integrator keeps one.

## Acceptance (the light check)
- `bash test.sh node` 0; `node tools/rack-deps.mjs --classes` before/after (`readouts`, `kepler` from their files, ≤ 25, 0 bare writes; `tests/rack-deps.test.mjs`
  green); `frame-occlusion` 7; `hit-probe-set` 0 reached; `take-in-bugs` 4 (the bow); `routed-knob` 4; `camera-shift`; `molecule-demos`; `current` 15;
  `serialize-bytes` 11/11 full + edit vs your base export; `settings-probe` 0/6 (5 reached if marionette dies); `lw-facade` 1/1; the boot suite's readout/Kepler
  blocks alone (chunk runner — find them by `grep -n "SHADOW\|KEPLER\|METERS\|ATOMS" tests/legacy/boot.browser-test.mjs`); `node tests/pwa.test.mjs --write`
  after every `lab/` edit. THE LOCK is not yours unless you touched what the loop or `field.js` reads (the bow's launch path writes the state — if `launchPacket`/
  `enterBox` change shape at all, run the lock: `--check --query gastab=0`, then the same with `--fixture research/release-0.4.0/measure/digest-lock-s4a.json`).

## Commits (each followed by `R2b-HANDOFF.md`)
1. `0.5.2 R2b · lab/windows/readouts.js (three seats) + kepler.js: the readouts and THE BOW + KEPLER move verbatim; the inherited fills become registrations` (+ pwa).
2. `0.5.2 R2b · the light check; the classes table; R2b-BUILD.md; wave 219` (REPORT.md under the 0.5.2 heading; the drafted CLAUDE.md sentence in the BUILD, not
   applied).

## Harness
Isolated worktree: `git reset --hard <the integrator's tip named in your launch message>` first. Ports: yours **9083/5553** (your tree) + **9087/5557** (the base
export: `git archive <sha> | tar -x -C <dir>`, served with `LW_CERTS=<your worktree>/.certs`). `python3 tools/gate/server.py <path> <port>` (run_in_background);
`LW_PORT=… GD_PORT=…`. ONE browser at a time on the rig — R3b runs beside you: `node tools/perf/wait-gpu.mjs` and `pgrep -a geckodriver` / `pgrep -a -f chrome`
(ignore the editor's idle playwright-mcp chrome) before EVERY suite; if another suite is running, wait (poll every 30 s); never kill another's process; stop yours
by pid; never `pkill -f`. The shell guard refuses compound lines (plain commands or `bash .tmp/x.sh` / `node .tmp/x.mjs`). Never edit `lab/mir/**`, `lab/fonts/**`,
`lab/shell/controller.js`. No `sed` over `rack.js`. Subtract, don't add. Never merge, push, tag.
B149 is the standing law red; B6/B69 flake; `latex-copy`/`keyboard-window` red on the base — say them, don't fix them. The integrator's chunk runner:
`/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/optimization-2026-09-24/.tmp/chunk.mjs` (copy into your `.tmp/`). `R2b-BUILD.md`: the ledger
(rack.js and the two modules, exact), the classes table before/after, every suite's count with the base reading beside any rig red, the import fan-out, the `app.w`
registrations and any boot fill left, brief candidates for PAIR 3 / R5, the merge notes (the four seat lines; what `boot()` destructures), the drafted CLAUDE.md
sentence, "what Josh will see" (nothing — prove it). Hand back by message + try `~/.claude/handoffs/agents/<id>.md`.
