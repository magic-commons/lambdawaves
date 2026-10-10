# BRIEF R5 · THE FACADE, MOVED WHOLE (0.5.2 "Rack Dissolution"; Opus builder; runs ALONE after PAIR 3 — every window and shell module is in)

**Read first, whole:** `research/release-0.5.2/PLAN.md` (§1 item 4, §2 G-W and G-D, the R5 row in §3, §4, §8, §9), **`R0-BUILD.md`** (§5 the namespaces, §6 the classes
table — the facade's 121 backward names and 21 shared lets, §7 the `ui` contract, U7 the runtime fixture), **`R1-BUILD.md`** §8–§9, **`R2a-BUILD.md`** §1 THE READ
LAW, **`R2b-BUILD.md`**, **`R3b-BUILD.md`**, **`R2c-BUILD.md`** and **`R2d-BUILD.md`** (what every module registers — the facade reads most of it), `lab/windows/readouts.js`
and `lab/shell/persist.js` (a long destructure block at a module's top: the shape yours takes, ×3), `lab/shell/controller.js` (NEVER edit it),
`tests/lw-facade.browser-test.mjs` + `research/release-0.5.2/lw-facade.json` (THE RUNTIME FIXTURE: 176 members by name, kind and order — your row must leave it
byte-identical), `tests/helpers/app-source.mjs`, `tools/rack-deps.mjs` (`--classes`; the module-file mode; `PLANNED_CUT`'s `facade` anchor), `tools/perf/digest-lock.mjs`
(its header: THE LOCK's two runs), `CLAUDE.md` (every 0.5.2 paragraph), `docs/STATE-SCOPES.md`.

## As-built facts (the integrator, 2026-10-10 after PAIR 3 — the launch tip `{{tip}}`; the BUILD files are the authority)

- **THE READ LAW (R2a, binding) — and the facade's own corollary:** §26 is seated after EVERY module; every one of its backward names is a CONST by then, so each is
  DESTRUCTURED ONCE at the top of `createFacade(app)` (`const { reg, clock, obs, mat … } = app;` `const { gov, field, maths, scan … } = app.ctl;` `const { wSpec,
  spectrum, shadowView, … } = app.w;` `const { layout, historyApi, copyLink … } = app.sh;` `const { camera, camLevel, … } = app.host;` `const { page, hydroReader,
  meterSnapshot, … } = app.loop;`). **Its row stands at fwd + shared {{row.facade}} — three under the limit of 25.** Every name read AT USE through `app.<ns>.x` is one
  more forward crossing: 24 such reads would put the row at 46. So a backward name whose slot is still NULL at the tip is REGISTERED by its owner (below), never read
  at use. The 21 shared lets are already `app.state.x` in the literal's text (R0) — live, verbatim. The ONE forward name, `warning` (`const warning =
  dom.start.warning;` :{{warningConst}}, made after the literal; `app.hooks.warning = warning;` :{{hooksWarning}}), is read as `app.hooks.warning` inside its getter.
- **The region** (`lab/rack.js` {{rackLines}} lines at `{{tip}}` — re-locate by grep on your base): `/* ── the diagnostics surface (tests and curiosity; one road)`
  :{{facadeHdr}} (the header STAYS at the seat — it is the tool's `facade` anchor) → `const LW = {` :{{LWconst}} … `};` :{{LWend}} ({{LWlines}} lines; {{LWgetters}}
  `get x()` accessors at every depth — the fixture's top level reads 48 get · 72 method · 56 value) → `window.__LW = LW; app.sh.LW = LW;` :{{LWwin}} **stays in `boot()`**. After it, `boot()` KEEPS at
  their seats: §27 the RENDER card :{{renderCard}}–:{{goHead:-1}} with `LW.curves = curves;` :{{LWcurves}}; `/* ── go ──` :{{goHead}} with `LW.bootView = … LW.bootClosed
  = …` :{{LWboot}}; `initStageText(); LW.stageText = app.state.stageText;` :{{initCall}}; §29 `const linkAtBoot = openLink();` :{{linkAtBoot}}; `LW.ready = true;`
  :{{LWready}}; `LW.report = …` :{{LWreport}}. Those later `LW.x =` lines add members AFTER creation exactly as today — the fixture pins the final shape and must not
  move. **The seat:** `const LW = createFacade(app);` where :{{LWconst}} stood (the header line above it kept), then the unchanged `window.__LW = LW; app.sh.LW = LW;`.
- **What moves:** the literal WHOLE — one `return { … }` of the same object expression, key for key in the same order, every accessor an accessor (PLAN
  §1 item 4: `Object.assign` would freeze a getter into a value and the fixture would say so), the comments inside it travelling. `createFilm(LW, …)` /
  `createCapture(LW, …)` already read `app.sh.LW` lazily (R2c): nothing of theirs changes.
- **Your row at the launch tip:** facade {{row.facade}} (limit 25, zero bare writes). Count before and after. ({{hinge}}; {{measured}} module files measured.)
- **The 121 backward names, by where each lives at `{{tip}}`** (`research/release-0.5.2/integrator/facade-names.mjs`, re-run it on your base first — PAIR 3 moved some):
{{facadeAudit}}
  **registered** → destructure from that slot. **headConst** → destructure from `app` (`const { reg, clock, … } = app`). **byValue** → destructure from `app.loop`
  (`hydroReader`, `meterSnapshot`, `modesAt`, `schedule` sit in the literal by value; `readSettings` in `app.sh`). **nullSlot** → the slot exists in the literal but
  nobody fills it yet: **its OWNER registers it** — a moved module on its own registration line (`lab/windows/readouts.js` for `calculus` / `flowTracers` / `orbit` /
  `radiationView`; `kepler.js` for `gasTableOn` / `keplerDragToPoint` / `orbitOfShell` / `slapAlong`; `spectrum.js` for `selectEigen` / `setSturmian` / `sturmEigen`;
  `lab/shell/settings.js` for `applySettings` / `setCardStyle` / `setDisconnected`; `links.js` for `mintLink` / `notCarriedWords` / `openLink`; `persist.js` for
  `restoreModulation`; `keys.js` for `stageHasFocus`; `molecules.js` for `head` if R2d did not), or a boot-kept line right after a boot-kept declaration (`loopRing`
  :249 / `ringMedian` :251 / `MOTION` are the LOOP's — one line after `ringMedian`'s, the loop piece is exempt; `setCamMode` goes on the camera law's host line
  :{{hostfill}}). **Every slot is filled exactly once** (grep `app.<ns>.<x> =` across `lab/` before each; `research/release-0.5.2/integrator/doubles.mjs` must read 0 at the end). **noSlot**
  must be empty; if a name has no slot, STOP and say so (R0 planned every one).
- **THE RUNTIME FIXTURE is the gate, not a thing you re-capture:** `LW_PORT=… GD_PORT=… node tests/lw-facade.browser-test.mjs` → `PASS 1 … 176 members … GREEN 1 of 1`
  WITHOUT `--write`. A diff means a getter became a value, a key moved, or a member was lost — fix the move, never the fixture. (`--write` is for a row that changes
  the facade on purpose; R5 does not.)
- **THE LOCK is yours (PLAN §2 G-D: R0, R1, R5, R-V):** `node tools/perf/digest-lock.mjs --check --query gastab=0` → 860 values · 0/0, then the same with `--fixture
  research/release-0.4.0/measure/digest-lock-s4a.json --query gastab=0` → 1004 · 0/0 (the header says why `gastab=0`). On THIS rig the gas state has stalled ("Render
  did not settle: animation frames stopped") since ≈ 02:00 on every tree including the 0.5.1 base: run each ONCE; a stall is re-run ONCE on your base export; identical
  = the rig — record both readings in the BUILD and say THE LOCK IS OWED (the integrator carries it to R-V on a rebooted rig). A moved digest on a tree that settles is
  a defect, never a re-bake.
- **Tests that read the SOURCE:** the boot suite's B108/B112 and anything that slices `rack.js` for `const LW = {` or a facade member's text — grep `rack.js` in
  `tests/*.test.mjs`, `tests/legacy/boot.browser-test.mjs` and `tools/` (`main-thread.mjs` reads `rack.js`'s sha — the fix round's, not yours) and re-point through
  `appSource()` in the SAME commit.
- **The tool** (`tools/rack-deps.mjs`): `PLANNED_CUT`'s `facade` anchor is the header line :{{facadeHdr}} — keep it at the seat verbatim; the MODULES table already
  names `lab/shell/facade.js`; the module-file mode then measures your file ({{measured}} files today → +1). Say the diff if any.
- **Line law:** `lab/*.js` + `lab/shell/` + `lab/windows/` = **{{labLines}} of a 27,943 cap at the tip ({{labLeft}} left).** You are the LAST module: the header +
  signature + the destructure block + `return` + a `sw.js` row ≈ 12–18 lines. If the cap is passed here, say the exact Δ and build on — that ruling is Josh's at R-V,
  not yours (raise it or cut shape); the ledger must be exact.
- **Imports** the literal needs move from `rack.js` to the module (say how many; `TIER` from `'../rack.js'` is the accepted cycle; check each with
  `research/release-0.5.2/r3a-measure/freenames.mjs` against your base BEFORE the browser does — a lost import is invisible to the tool).
- **The rig** (since ≈ 02:00): 2–3 frames a second; stalls on the heaviest states (the lock's gas state, molecule opens, `serialize-bytes`' base export, `hit-probe-set`,
  `frame-occlusion`'s chipGap); frame-paced waits go red; marionette dies after ≈ 5 in-session reloads — all on the BASE as well. **A red of that kind is checked ONCE
  against your base export on your second port: identical = the rig; record BOTH readings and move on. Never loop on it; never touch another process.** Josh may
  reboot during your run: if your servers die, restart them by the same commands and continue.

## The contract (a MOVE, not a rewrite)

1. **What moves:** §26's literal WHOLE → **`lab/shell/facade.js`** `createFacade(app)` returning it; `boot()` keeps `const LW = createFacade(app); window.__LW = LW;
   app.sh.LW = LW;` and every later `LW.x =` line at its seat.
2. **Verbatim** (the object expression's text, key order, accessors, comments; no renames beyond R0's `app.state`); the 121 names destructured ONCE at the top (THE READ
   LAW); the 21 shared lets live; `warning` at use; the 24 null slots registered by their owners (one line each, on the owner's registration line); every `ui.x` keeps its
   name.
3. **Never edit `lab/shell/controller.js`**, `lab/mir/**`, `lab/fonts/**`; never `--write` the fixture; no `sed` over `rack.js`.

## Acceptance
- `bash test.sh node` 0; `node tools/rack-deps.mjs --classes` before/after (`facade` from its file, ≤ 25, 0 bare writes; `tests/rack-deps.test.mjs` green); `research/release-0.5.2/integrator/doubles.mjs`
  → 0 (ask the integrator's copy: `research/release-0.5.2/integrator/doubles.mjs <your worktree>`); **`lw-facade` 1/1 without `--write`**; **THE LOCK**, both
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
tools/gate/server.py <path> <port>` (run_in_background); `LW_PORT=… GD_PORT=…`. You run alone, but the integrator's servers (8751, 8755) and Josh's processes (Firefox
2002078; 8721, 8731, 8741) are never touched; `node research/release-0.5.2/r2b-measure/rigfree.mjs` before every suite; stop your servers by pid; never `pkill -f`. The
shell guard refuses compound lines (plain commands or `bash .tmp/x.sh` / `node .tmp/x.mjs`). Subtract, don't add. Never merge, push, tag.
B149 is the standing law red; B6/B69 flake; `latex-copy`/`keyboard-window` red on the base — say them, don't fix them. The integrator's chunk runner:
`/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/optimization-2026-09-24/.tmp/chunk.mjs`. `R5-BUILD.md`: the ledger (rack.js and the module, exact), the
classes table before/after, the 24 registrations and their owners' lines, every suite's count with the base reading beside any rig red, THE LOCK's readings, the import
fan-out, the tool diff, candidates for R-V and the fix round, the merge notes, the drafted CLAUDE.md sentence, "what Josh will see" (nothing — prove it). Hand back by
message + try `~/.claude/handoffs/agents/<id>.md`.
