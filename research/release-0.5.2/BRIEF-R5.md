# BRIEF R5 · THE FACADE, MOVED WHOLE (0.5.2 "Rack Dissolution"; Opus builder; runs ALONE after PAIR 3 — every window and shell module is in)

**Read first, whole:** `research/release-0.5.2/PLAN.md` (§1 item 4, §2 G-W and G-D, the R5 row in §3, §4, §8, §9), **`R0-BUILD.md`** (§5 the namespaces, §6 the classes
table — the facade's 121 backward names and 21 shared lets, §7 the `ui` contract, U7 the runtime fixture), **`R1-BUILD.md`** §8–§9, **`R2a-BUILD.md`** §1 THE READ
LAW, **`R2b-BUILD.md`**, **`R3b-BUILD.md`**, **`R2c-BUILD.md`** and **`R2d-BUILD.md`** (what every module registers — the facade reads most of it), `lab/windows/readouts.js`
and `lab/shell/persist.js` (a long destructure block at a module's top: the shape yours takes, ×3), `lab/shell/controller.js` (NEVER edit it),
`tests/lw-facade.browser-test.mjs` + `research/release-0.5.2/lw-facade.json` (THE RUNTIME FIXTURE: 176 members by name, kind and order — your row must leave it
byte-identical), `tests/helpers/app-source.mjs`, `tools/rack-deps.mjs` (`--classes`; the module-file mode; `PLANNED_CUT`'s `facade` anchor), `tools/perf/digest-lock.mjs`
(its header: THE LOCK's two runs), `CLAUDE.md` (every 0.5.2 paragraph), `docs/STATE-SCOPES.md`.

## As-built facts (the integrator, 2026-10-10 after PAIR 3 — the launch tip `7c3eebe`; the BUILD files are the authority)

- **THE READ LAW (R2a, binding) — and the facade's own corollary:** §26 is seated after EVERY module; every one of its backward names is a CONST by then, so each is
  DESTRUCTURED ONCE at the top of `createFacade(app)` (`const { reg, clock, obs, mat … } = app;` `const { gov, field, maths, scan … } = app.ctl;` `const { wSpec,
  spectrum, shadowView, … } = app.w;` `const { layout, historyApi, copyLink … } = app.sh;` `const { camera, camLevel, … } = app.host;` `const { page, hydroReader,
  meterSnapshot, … } = app.loop;`). **Its row stands at fwd + shared 255 lines, backward 121, forward 1, another scope's `app.state` 21, **fwd + shared 22** — three under the limit of 25.** Every name read AT USE through `app.<ns>.x` is one
  more forward crossing: 24 such reads would put the row at 46. So a backward name whose slot is still NULL at the tip is REGISTERED by its owner (below), never read
  at use. The 21 shared lets are already `app.state.x` in the literal's text (R0) — live, verbatim. The ONE forward name, `warning` (`const warning =
  dom.start.warning;` :1161, made after the literal; `app.hooks.warning = warning;` :1164), is read as `app.hooks.warning` inside its getter.
- **The region** (`lab/rack.js` 1202 lines at `7c3eebe` — re-locate by grep on your base): `/* ── the diagnostics surface (tests and curiosity; one road)`
  :824 (the header STAYS at the seat — it is the tool's `facade` anchor) → `const LW = {` :826 … `};` :1077 (252 lines; 146
  `get x()` accessors at every depth — the fixture's top level reads 48 get · 72 method · 56 value) → `window.__LW = LW; app.sh.LW = LW;` :1078 **stays in `boot()`**. After it, `boot()` KEEPS at
  their seats: §27 the RENDER card :1079–:1098 with `LW.curves = curves;` :1097; `/* ── go ──` :1099 with `LW.bootView = … LW.bootClosed
  = …` :1100; `initStageText(); LW.stageText = app.state.stageText;` :1131; §29 `const linkAtBoot = openLink();` :1143; `LW.ready = true;`
  :1199; `LW.report = …` :1200. Those later `LW.x =` lines add members AFTER creation exactly as today — the fixture pins the final shape and must not
  move. **The seat:** `const LW = createFacade(app);` where :826 stood (the header line above it kept), then the unchanged `window.__LW = LW; app.sh.LW = LW;`.
- **What moves:** the literal WHOLE — one `return { … }` of the same object expression, key for key in the same order, every accessor an accessor (PLAN
  §1 item 4: `Object.assign` would freeze a getter into a value and the fixture would say so), the comments inside it travelling. `createFilm(LW, …)` /
  `createCapture(LW, …)` already read `app.sh.LW` lazily (R2c): nothing of theirs changes.
- **Your row at the launch tip:** facade 255 lines, backward 121, forward 1, another scope's `app.state` 21, **fwd + shared 22** (limit 25, zero bare writes). Count before and after. (THE HINGE (G-G): bare writes across scopes 0; the largest moving module spectrum at 24 (limit 25) → HOLDS; 20 module files measured.)
- **The 121 backward names, by where each lives at `7c3eebe`** (`research/release-0.5.2/integrator/facade-names.mjs`, re-run it on your base first — PAIR 3 moved some):
  facade backward 121 · forward warning · app.state bow, bowChain, bowInFlight, capApi, chem, exporter3d, filmCard, gasAxial, lastLaunch, linkLast, modArm, modHost, modView, molSession, orbitals, palette, register, space, states, tl, uiHidden · own — · writes gasAxial, space
  
  ## registered (84)
    MOD ← lab/shell/controller.js:341 app.ctl.MOD
    READER_LAW ← lab/shell/controller.js:339 app.ctl.READER_LAW
    ROT_LIMIT ← lab/shell/controller.js:342 app.ctl.ROT_LIMIT
    accent ← lab/shell/controller.js:345 app.ctl.accent
    api ← lab/shell/controller.js:349 app.ctl.api
    atomsView ← lab/windows/readouts.js:141 app.w.atomsView
    autoQ ← lab/shell/controller.js:339 app.ctl.autoQ
    barLock ← lab/shell/transport.js:204 app.sh.barLock
    bowCancel ← lab/rack.js:800 app.w.bowCancel
    bowMove ← lab/rack.js:800 app.w.bowMove
    bowRelease ← lab/rack.js:800 app.w.bowRelease
    bowStart ← lab/rack.js:800 app.w.bowStart
    busy ← lab/shell/controller.js:346 app.ctl.busy
    busyFlash ← lab/shell/controller.js:346 app.ctl.busyFlash
    busyHost ← lab/shell/controller.js:347 app.ctl.busyHost
    busySync ← lab/shell/controller.js:346 app.ctl.busySync
    busyWrap ← lab/shell/controller.js:346 app.ctl.busyWrap
    camLevel ← lab/rack.js:642 app.host.camLevel
    camera ← lab/rack.js:642 app.host.camera
    cards ← lab/shell/controller.js:347 app.ctl.cards
    coherentBounce ← lab/windows/kepler.js:282 app.w.coherentBounce
    copyLink ← lab/shell/links.js:83 app.sh.copyLink
    domain ← lab/shell/controller.js:339 app.ctl.domain
    effectiveRes ← lab/shell/controller.js:339 app.ctl.effectiveRes
    enterBox ← lab/windows/kepler.js:282 app.w.enterBox
    field ← lab/shell/controller.js:347 app.ctl.field
    fieldRate ← lab/shell/controller.js:340 app.ctl.fieldRate
    fillValence ← lab/windows/spectrum.js:261 app.w.fillValence
    gas ← lab/windows/kepler.js:282 app.w.gas
    gov ← lab/shell/controller.js:339 app.ctl.gov
    historyApi ← lab/rack.js:822 app.sh.historyApi
    inkCtx ← lab/shell/controller.js:345 app.ctl.inkCtx
    keep ← lab/shell/controller.js:339 app.ctl.keep
    kepShell ← lab/windows/kepler.js:216 app.w.kepShell
    kepler ← lab/windows/readouts.js:97 app.w.kepler
    keplerRowSync ← lab/windows/kepler.js:216 app.w.keplerRowSync
    keplerTurn ← lab/windows/kepler.js:216 app.w.keplerTurn
    ladder ← lab/windows/readouts.js:125 app.w.ladder
    launchPacket ← lab/windows/kepler.js:282 app.w.launchPacket
    layout ← lab/shell/rack-wiring.js:277 app.sh.layout
    loadPreset ← lab/shell/controller.js:348 app.ctl.loadPreset
    look ← lab/shell/controller.js:344 app.ctl.look
    markInk ← lab/shell/controller.js:346 app.ctl.markInk
    maths ← lab/shell/controller.js:347 app.ctl.maths
    mod ← lab/shell/controller.js:341 app.ctl.mod
    modGets ← lab/shell/controller.js:342 app.ctl.modGets
    modHand ← lab/shell/controller.js:341 app.ctl.modHand
    modHeld ← lab/shell/controller.js:342 app.ctl.modHeld
    modKnobs ← lab/shell/controller.js:342 app.ctl.modKnobs
    orbitBy ← lab/rack.js:643 app.host.orbitBy
    page ← lab/rack.js:182 app.loop.page
    paintMarks ← lab/shell/controller.js:344 app.ctl.paintMarks
    particles ← lab/windows/readouts.js:97 app.w.particles
    perf ← lab/shell/controller.js:340 app.ctl.perf
    quality ← lab/rack.js:151 app.sh.quality
    restore ← lab/shell/persist.js:309 app.sh.restore
    rotDriving ← lab/shell/controller.js:343 app.ctl.rotDriving
    rotRate ← lab/shell/controller.js:342 app.ctl.rotRate
    saveSettings ← lab/rack.js:151 app.sh.saveSettings
    scan ← lab/shell/controller.js:347 app.ctl.scan
    serialize ← lab/shell/persist.js:309 app.sh.serialize
    setCardStyle ← lab/rack.js:151 app.sh.setCardStyle
    setDisconnected ← lab/rack.js:151 app.sh.setDisconnected
    setElement ← lab/windows/spectrum.js:261 app.w.setElement
    setFrost ← lab/rack.js:151 app.sh.setFrost
    setGovernor ← lab/shell/controller.js:340 app.ctl.setGovernor
    setKeepFrames ← lab/shell/controller.js:340 app.ctl.setKeepFrames
    setModArm ← lab/shell/transport.js:204 app.sh.setModArm
    setPerfMode ← lab/shell/controller.js:340 app.ctl.setPerfMode
    setReference ← lab/shell/controller.js:349 app.ctl.setReference
    setRotationRate ← lab/shell/controller.js:343 app.ctl.setRotationRate
    shadowView ← lab/windows/readouts.js:18 app.w.shadowView
    slice ← lab/windows/readouts.js:97 app.w.slice
    spectrum ← lab/windows/spectrum.js:100 app.w.spectrum
    stageGround ← lab/shell/controller.js:346 app.ctl.stageGround
    stats ← lab/shell/controller.js:341 app.ctl.stats
    swClient ← lab/rack.js:799 app.host.swClient
    switchHamiltonian ← lab/windows/spectrum.js:261 app.w.switchHamiltonian
    togglePlay ← lab/shell/transport.js:204 app.sh.togglePlay
    touchState ← lab/shell/controller.js:348 app.ctl.touchState
    vortex ← lab/windows/readouts.js:97 app.w.vortex
    wheelColor ← lab/shell/controller.js:345 app.ctl.wheelColor
    wignerView ← lab/windows/readouts.js:149 app.w.wignerView
    windowActivity ← lab/rack.js:287 app.loop.windowActivity
  
  ## headConst (10)
    appPlay
    clock
    energyOf
    hNote
    labelExpect
    mat
    obs
    rates
    reg
    sturm
  
  ## byValue (5)
    hydroReader
    meterSnapshot
    modesAt
    readSettings
    schedule
  
  ## nullSlot (22)
    MOTION (app.loop.MOTION)
    applySettings (app.sh.applySettings)
    calculus (app.w.calculus)
    flowTracers (app.w.flowTracers)
    gasTableOn (app.w.gasTableOn)
    head (app.w.head)
    keplerDragToPoint (app.w.keplerDragToPoint)
    loopRing (app.loop.loopRing)
    mintLink (app.sh.mintLink)
    notCarriedWords (app.sh.notCarriedWords)
    openLink (app.sh.openLink)
    orbit (app.w.orbit)
    orbitOfShell (app.w.orbitOfShell)
    radiationView (app.w.radiationView)
    restoreModulation (app.sh.restoreModulation)
    ringMedian (app.loop.ringMedian)
    selectEigen (app.w.selectEigen)
    setCamMode (app.host.setCamMode)
    setSturmian (app.w.setSturmian)
    slapAlong (app.w.slapAlong)
    stageHasFocus (app.sh.stageHasFocus)
    sturmEigen (app.w.sturmEigen)
  
  ## noSlot (0)
  **registered** → destructure from that slot. **headConst** → destructure from `app` (`const { reg, clock, … } = app`). **byValue** → destructure from `app.loop`
  (`hydroReader`, `meterSnapshot`, `modesAt`, `schedule` sit in the literal by value; `readSettings` in `app.sh`). **nullSlot** → the slot exists in the literal but
  nobody fills it yet: **its OWNER registers it** — a moved module on its own registration line (`lab/windows/readouts.js` for `calculus` / `flowTracers` / `orbit` /
  `radiationView`; `kepler.js` for `gasTableOn` / `keplerDragToPoint` / `orbitOfShell` / `slapAlong`; `spectrum.js` for `selectEigen` / `setSturmian` / `sturmEigen`;
  `lab/shell/settings.js` for `applySettings` / `setCardStyle` / `setDisconnected`; `links.js` for `mintLink` / `notCarriedWords` / `openLink`; `persist.js` for
  `restoreModulation`; `keys.js` for `stageHasFocus`; `molecules.js` for `head` — R2d did NOT register it: add `app.w.head = head;` on the root's return line, where `app.w.wChem` is registered), or a boot-kept line right after a boot-kept declaration (`loopRing`
  :249 / `ringMedian` :251 / `MOTION` are the LOOP's — one line after `ringMedian`'s, the loop piece is exempt; `setCamMode` goes on the camera law's host line
  :642). **Every slot is filled exactly once** (grep `app.<ns>.<x> =` across `lab/` before each; `research/release-0.5.2/integrator/doubles.mjs` must read 0 at the end). **noSlot**
  must be empty; if a name has no slot, STOP and say so (R0 planned every one).
- **THE RUNTIME FIXTURE is the gate, not a thing you re-capture:** `LW_PORT=… GD_PORT=… node tests/lw-facade.browser-test.mjs` → `PASS 1 … 176 members … GREEN 1 of 1`
  WITHOUT `--write`. A diff means a getter became a value, a key moved, or a member was lost — fix the move, never the fixture. (`--write` is for a row that changes
  the facade on purpose; R5 does not.)
- **THE LOCK is yours (PLAN §2 G-D: R0, R1, R5, R-V):** `node tools/perf/digest-lock.mjs --check --query gastab=0` → 860 values · 0/0, then the same with `--fixture
  research/release-0.4.0/measure/digest-lock-s4a.json --query gastab=0` → 1004 · 0/0 (the header says why `gastab=0`). The rig is healthy (see below): run each once; a stall is re-run ONCE on your base export; identical = the rig — record both readings in the BUILD and say so with both readings (the integrator re-runs it). A moved digest on a tree that settles is
  a defect, never a re-bake.
- **Tests that read the SOURCE:** the boot suite's B108/B112 and anything that slices `rack.js` for `const LW = {` or a facade member's text — grep `rack.js` in
  `tests/*.test.mjs`, `tests/legacy/boot.browser-test.mjs` and `tools/` (`main-thread.mjs` reads `rack.js`'s sha — the fix round's, not yours) and re-point through
  `appSource()` in the SAME commit.
- **The tool** (`tools/rack-deps.mjs`): `PLANNED_CUT`'s `facade` anchor is the header line :824 — keep it at the seat verbatim; the MODULES table already
  names `lab/shell/facade.js`; the module-file mode then measures your file (20 files today → +1). Say the diff if any.
- **Line law:** `lab/*.js` + `lab/shell/` + `lab/windows/` = **27,932 of a 27,943 cap at the tip (11 left).** You are the LAST module: the header +
  signature + the destructure block + `return` + a `sw.js` row ≈ 12–18 lines. If the cap is passed here, say the exact Δ and build on — that ruling is Josh's at R-V,
  not yours (raise it or cut shape); the ledger must be exact.
- **Imports** the literal needs move from `rack.js` to the module (say how many; `TIER` from `'../rack.js'` is the accepted cycle; check each with
  `research/release-0.5.2/r3a-measure/freenames.mjs` against your base BEFORE the browser does — a lost import is invisible to the tool).
- **The rig** was REBOOTED at 11:46 on 2026-10-10 and is healthy again: on the pre-pair tip `2a5df88` THE LOCK read 860 · 0/0 and 1004 · 0/0 in 58 s each,
  frame-occlusion 7/7, and on `7c3eebe` `settings-probe` reached all six scenes (0/6 red), `serialize-bytes` 11/11 + 11/11, `lw-facade` 1/1. So THE LOCK IS MEASURABLE
  and is yours to read, not to owe. If a stall or a frame-paced red appears anyway, check it ONCE against your base export on your second port: identical = the rig;
  record BOTH readings and move on. Never loop on it; never touch another process.

## The contract (a MOVE, not a rewrite)

1. **What moves:** §26's literal WHOLE → **`lab/shell/facade.js`** `createFacade(app)` returning it; `boot()` keeps `const LW = createFacade(app); window.__LW = LW;
   app.sh.LW = LW;` and every later `LW.x =` line at its seat.
2. **Verbatim** (the object expression's text, key order, accessors, comments; no renames beyond R0's `app.state`); the 121 names destructured ONCE at the top (THE READ
   LAW); the 21 shared lets live; `warning` at use; the 22 null slots registered by their owners (one line each, on the owner's registration line); every `ui.x` keeps its
   name.
3. **Never edit `lab/shell/controller.js`**, `lab/mir/**`, `lab/fonts/**`; never `--write` the fixture; no `sed` over `rack.js`.

## Acceptance
- `bash test.sh node` 0; `node tools/rack-deps.mjs --classes` before/after (`facade` from its file, ≤ 25, 0 bare writes; `tests/rack-deps.test.mjs` green); `research/release-0.5.2/integrator/doubles.mjs`
  → 0 (`node research/release-0.5.2/integrator/doubles.mjs <your worktree>`); **`lw-facade` 1/1 without `--write`**; **THE LOCK**, both
  runs (or the rig's identical stall on both trees, recorded); `serialize-bytes` 11/11 full + edit vs your base export; `settings-probe` 0/6 (5 reached if marionette dies);
  a light set of the suites that drive `__LW` hardest — `history`, `new-project` + `--check`, `offer`, `menubar`, `stage-text`, `curves`, `timeline`, `keyboard-shortcuts`
  (R-V runs the whole estate); `node tests/pwa.test.mjs --write` after every `lab/` edit.

## Commits (each followed by `R5-HANDOFF.md`)
1. `0.5.2 R5 · lab/shell/facade.js createFacade(app): §26 the diagnostics surface moves whole — the literal returned, its accessors and key order kept; the null slots the facade reads registered by their owners` (+ pwa).
2. `0.5.2 R5 · the light check; THE LOCK (or the rig's reading, both trees); the classes table; R5-BUILD.md; wave 223` (REPORT.md under the 0.5.2 heading; the drafted
   CLAUDE.md sentence in the BUILD, not applied).

## Harness
Isolated worktree (the harness gives you one; your shell starts in it): `git reset --hard <the integrator's tip named in your launch message>` first. Ports: yours
**9123/5593** (your tree) + **9127/5597** (the base export: `git archive <sha> | tar -x -C <dir>`, served with `LW_CERTS=<your worktree>/.certs`). `python3
tools/gate/server.py <path> <port>` (run_in_background); `LW_PORT=… GD_PORT=…`. You run alone, but the integrator's servers (8731 the tree, 8735 the 0.5.1 base) and any process that is not yours are never touched; `node research/release-0.5.2/r2b-measure/rigfree.mjs` before every suite; stop your servers by pid; never `pkill -f`. The
shell guard refuses compound lines (plain commands or `bash .tmp/x.sh` / `node .tmp/x.mjs`). Subtract, don't add. Never merge, push, tag.
B149 is the standing law red; B6/B69 flake; `latex-copy`/`keyboard-window` red on the base — say them, don't fix them. The integrator's chunk runner:
`/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/optimization-2026-09-24/.tmp/chunk.mjs`. `R5-BUILD.md`: the ledger (rack.js and the module, exact), the
classes table before/after, the 22 registrations and their owners' lines, every suite's count with the base reading beside any rig red, THE LOCK's readings, the import
fan-out, the tool diff, candidates for R-V and the fix round, the merge notes, the drafted CLAUDE.md sentence, "what Josh will see" (nothing — prove it). Hand back by
message + try `~/.claude/handoffs/agents/<id>.md`.
