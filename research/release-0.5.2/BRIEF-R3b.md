# BRIEF R3b · TRANSPORT + RACK WIRING + NOTEBOOK + KEYS (0.5.2 "Rack Dissolution"; Opus builder; PAIR 2 with R2b — disjoint regions AND disjoint `app` namespaces)

**Read first, whole:** `research/release-0.5.2/PLAN.md` (§1, §2, the PAIR 2 row in §3 — "§19b is two things", "MENUS may be its own file", "§17 and §30 stay" —
§4, §8, §9), **`R0-BUILD.md`** (§3 U1 — `setModArm` is touched before its line INSIDE §12: keep it a function declaration inside `createTransport`; §5 the
namespaces; §6 the classes table — transport 229 lines fwd+shared 4, rack-wiring 327 → 4, notebook 389 → 21, keys 202 → 13; §7 the `ui` contract — `native-ui.js`
re-parents the transport's children and the A/B row: keep every `ui.x` the strip registers under the same name), **`R1-BUILD.md`** §8–§9, **`R2a-BUILD.md`** (§1 THE
READ LAW; §10 candidate 1: "R3b's notebook (8 controller names + 21) would fail the hinge unless it destructures the controller's names"), **`R3a-BUILD.md`** (the
shell modules as built — `createSettings`/`createPersist`/`createLinks`/`createHistory`, what `app.sh` holds, where `readSettings` stayed), `BRIEF-R3a.md` (the
pattern of a shell row), `lab/shell/controller.js` (NEVER edit it), the R3a modules under `lab/shell/`, `lab/windows/spectrum.js` (the destructure block at the
top of a moved module), `lab/key-table.js`, `lab/mir/shell/rack.js` (adopted; read only), `tests/helpers/app-source.mjs`, `tests/project-formats.test.mjs` (it
slices `projectSnapshot`/`projectKey` out of §19b's PROJECTS block — keep that block WHOLE in one file), `tools/rack-deps.mjs` (`--classes`; the module-file mode),
`CLAUDE.md` (the paragraphs on the rack, the menubar, the ONE KEY TABLE, THE START, PROJECTS, THE FILM's TIMELINE; the last four: THE CONTEXT, THE CONTROLLER, THE
WINDOWS / THE READ LAW, R3a's).

## As-built facts (the integrator, 2026-10-10; the BUILD files are the authority)

- **THE READ LAW (R2a, binding):** your four modules are all seated AFTER the controller — a name that is a CONST by then (§0's consts, the loop's hoisted
  functions, the rack, the controller's 68 on `app.ctl`, what R2a/R3a registered on `app.w`/`app.sh` before your seats) is DESTRUCTURED ONCE at the top of the
  module; a name `boot()` makes LATER than your seat is read through its slot inside a callback; a shared `let` is always `app.state.x`, live. A const read through
  `app.<ns>.x` at use counts as a forward crossing — the notebook (21 after R0) cannot afford one.
- **Fills you inherit (R2a's candidate 2):** `boot()` holds `app.sh.layout` and `app.sh.keyState` one-line fills written by R2a (SPECTRUM reads them) — each moves
  WITH its declaration into your module and becomes its registration. R3a's `app.sh.save`/`restore`/`copyJSON`/`copyLink` are persist's; R2a's redundant copy at
  `/* ── go ──` was removed at R3a's merge (check `grep -n 'app.sh.save' lab/rack.js`).
- **Lines at `ee92ddc`** (R2a in; R3a's merge moves everything below §1 up — re-locate by grep on your base): `lab/rack.js` 4,261 — §12 `/* ── transport strip
  (§25)` :1809 → before `/* ── badges (§41)` :2038 (§13–§14 badges + the install layer :2038–2067 STAY); §19a+§19b `/* ── 0.5.0 C3 · THE RACK IS THE KIT'S` :2432 →
  before `/* ── KEYS: a rebindable action table` :3150 — inside it the planning base's three spans map to ≈ :2432–2614 (rack · layout · phone · gestures, incl. the
  kit's apply / "put it back" :2571), ≈ :2615–3001 (skip links · dock chip · `const MENUS = {` :2707 · `createMenubar(` :2737 · the notebook's move/resize :2761 ·
  "A project opens onto its notebook" :2787 · `/* ── PROJECTS (0.5.0 C6)` :2828) and ≈ :3002–3149 (rack wiring, second half) — **measure the real seams with
  `node tools/rack-deps.mjs --section` and name them in the BUILD**; §20 `/* ── KEYS` :3150, §21 `/* ── 0.5.0 C3 · THE KEYBOARD WINDOW` :3259, §22 `/* ── 0.5.0
  C7b · THE TIMELINE` :3283, §23 `/* ── THE TAB ORDER` :3316 → before `/* ── persistence (§46)` :3352 (R3a moved §24 out; the anchor after §23 on your base is
  whatever follows). §17 THE FLOATING RACK :2363 and §18 INK :2372 are R2d's; §30 stays.
- **Line law:** `lab/*.js` + `lab/shell/` + `lab/windows/` = **27,799 of a 27,943 cap after R2a (R3a's Δ pending) — ≈ 140 for 10 modules: your four modules' header
  comment + signature + return ≤ 12 lines EACH, no new blank lines; find subtractions while you move and say them.** Say your exact Δ.
- **The rig** (since ≈ 02:00): the GPU stalls on the heaviest states ("Render did not settle: animation frames stopped"), play does not advance in some suites,
  marionette dies after ≈ 5 in-session reloads (`keyboard-window`'s reload, `settings-probe`'s 6th scene) — all on the BASE as well. **A red of that kind is
  checked ONCE against your base export on your second port: identical = the rig; record BOTH readings in the BUILD and move on. Never loop on it; never touch
  another process.** Josh may reboot during your run: if your servers die, restart them by the same commands and continue.

## The contract (a MOVE, not a rewrite)

1. **What moves — four modules, each called at its seat (G-O):**
   - §12 THE TRANSPORT STRIP (229) → **`lab/shell/transport.js`** `createTransport(app)` — λWAVES' own bar stays λWAVES' (no kit transport); `setModArm` stays a
     function declaration INSIDE the module (U1); `windowActivity.track(wTr)` (:2613 at `ee92ddc`) is the strip's own line and moves with it if it is inside §12 —
     check; the strip's `ui.x` registrations keep their names (`native-ui.js` re-parents the transport's children).
   - §19a rack · layout · phone · gestures (the two halves, ≈ 329) → **`lab/shell/rack-wiring.js`** `createRackWiring(app)` — ONE module with TWO seats if the two
     halves must stay apart in creation order (return a closure for the second half), else one seat; `layout`'s verbs stay aliases over the kit's rack;
     `captureLayout`'s v3 stays the WORKSPACE record.
   - §19b skip links · dock chip · MENUS + the menubar · the notebook · PROJECTS (≈ 387) → **`lab/shell/notebook.js`** `createNotebook(app)` — MENUS may be its own
     file `lab/shell/menus.js` if that keeps the notebook's row ≤ 25 (say the measured rows both ways); the PROJECTS block (`projectSnapshot`, `projectKey`) WHOLE in
     one file for `project-formats.test`'s slices.
   - §20–§23 keys · keyboard window · timeline · tab order (≈ 202) → **`lab/shell/keys.js`** `createKeys(app)` — the ACTIONS rows are MIR's ONE KEY TABLE via
     `lab/key-table.js` (CLAUDE.md); THE FOCUS LAW's scoped rows (the timeline's) stay as they are; the KEYBOARD window stays the kit's `createKeyboardWindow`.
2. **The code moves VERBATIM** (indentation kept; comments and section headers travel; no renames beyond R0's `app.state`); each module destructures its consts once
   (THE READ LAW), reads later-made names through their slots inside callbacks, registers on **`app.sh`** only the slots a reader outside it needs (the inherited
   `layout`/`keyState` fills become your registrations); shared lets stay `app.state.x` live — transport reads 4 of another scope's, rack-wiring 4, notebook 11,
   keys 12 (R0 §6), and `setModArm`/`modArm`-type state is `app.state.modArm` (controller-owned). Rows after R0: transport **4**, rack-wiring **4**, notebook **21**,
   keys **13** — limit 25, zero bare writes; count before and after; STOP at a committed WIP if a move would pass 25.
3. **Imports** the spans need move from `rack.js` (say how many; `TIER` from `'../rack.js'` is the accepted cycle).
4. **Disjoint from R2b** (running beside you): you touch §12, §19a/§19b, §20–§23 and `app.sh`; R2b touches the three readout spans (SHADOW…PLANE, CALC…LADDER,
   ATOMS…RADIATION), THE BOW + KEPLER, and `app.w`. Never edit a line outside your spans + your call seats + the import lines you move; `rack.js` must auto-merge.
   A boot-kept fill you both need (one line at one seat): write it; the integrator keeps one.

## Acceptance (the light check)
- `menubar` 8/8; `keyboard-window` (red on the base — marionette; record both); `keyboard-shortcuts`; `timeline` 14/14; `offer` 16; `first-run` 12; `access`;
  `history` 44; `project-formats` + `first-run` node slices in `bash test.sh node` (exit 0); `hit-probe-set` 0 reached; `frame-occlusion` 7; `settings-probe` 0/6
  (5 reached if marionette dies); `serialize-bytes` 11/11 full + edit vs your base export; `lw-facade` 1/1; `new-project` 8 + `--check`; `tests/legacy/
  boot.browser-test.mjs`'s transport / rack / keys / notebook blocks alone (chunk runner); `node tools/rack-deps.mjs --classes` before/after (your four modules from
  their files; `tests/rack-deps.test.mjs` green); `node tests/pwa.test.mjs --write` after every `lab/` edit. THE LOCK is not yours unless you touched what the loop
  reads (THE play's edge is `onePlay` in `clock.js`, not yours).

## Commits (each followed by `R3b-HANDOFF.md`)
1. `0.5.2 R3b · lab/shell/transport.js + rack-wiring.js + notebook.js (+ menus.js?) + keys.js: §12, §19a, §19b, §20–§23 move verbatim; called at their seats` (+ pwa).
2. `0.5.2 R3b · the light check; the classes table; R3b-BUILD.md; wave 220` (REPORT.md under the 0.5.2 heading; the drafted CLAUDE.md sentence in the BUILD, not
   applied).

## Harness
Isolated worktree: `git reset --hard <the integrator's tip named in your launch message>` first. Ports: yours **9093/5563** (your tree) + **9097/5567** (the base
export: `git archive <sha> | tar -x -C <dir>`, served with `LW_CERTS=<your worktree>/.certs`). `python3 tools/gate/server.py <path> <port>` (run_in_background);
`LW_PORT=… GD_PORT=…`. ONE browser at a time on the rig — R2b runs beside you: `node tools/perf/wait-gpu.mjs` and `pgrep -a geckodriver` / `pgrep -a -f chrome`
(ignore the editor's idle playwright-mcp chrome) before EVERY suite; if another suite is running, wait (poll every 30 s); never kill another's process; stop yours
by pid; never `pkill -f`. The shell guard refuses compound lines (plain commands or `bash .tmp/x.sh` / `node .tmp/x.mjs`). Never edit `lab/mir/**`, `lab/fonts/**`,
`lab/shell/controller.js`. No `sed` over `rack.js`. Subtract, don't add. Never merge, push, tag. B149 is the standing law red; B6/B69 flake; `latex-copy`/
`keyboard-window` red on the base — say them, don't fix them. The integrator's chunk runner: `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/
optimization-2026-09-24/.tmp/chunk.mjs` (copy into your `.tmp/`). `R3b-BUILD.md`: the ledger (rack.js and the four modules, exact), the classes table before/after
(both ways if MENUS is split out), every suite's count with the base reading beside any rig red, the import fan-out, the `app.sh` registrations and any boot fill
left, brief candidates for PAIR 3 / R5, the merge notes (the seat lines; what `boot()` destructures), the drafted CLAUDE.md sentence, "what Josh will see"
(nothing — prove it). Hand back by message + try `~/.claude/handoffs/agents/<id>.md`.
