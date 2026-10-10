# BRIEF R3a · SETTINGS + PERSISTENCE + LINKS + HISTORY (0.5.2 "Rack Dissolution"; Opus builder; PAIR 1 with R2a — disjoint regions AND disjoint `app` namespaces)

**Read first, whole:** `research/release-0.5.2/PLAN.md` (§1, §2 — G-A, G-O, G-G, G-S, G-D, G-M — the PAIR 1 row in §3, §4, §8, §9), **`R0-BUILD.md`** (the
context AS BUILT: §3 U1 — `readSettings` is called by §0 BEFORE §1's line; §5 the namespaces — `app.sh` holds `readSettings` by value; §6 the classes table
and the shared-let owners — settings owns `molFormulaScale`, `space`; persist owns `restoreNotice`; links `linkLast`; history `history`; §11 candidates 2
and 3), **`R1-BUILD.md`** (the controller AS BUILT: its seat, what `boot()` destructures, the tool's module-file mode), `research/release-0.5.2/BRIEF-R1.md`
(the pattern of a MOVE row), `lab/rack.js` §0 (`readSettings()` called at :126 `useCompactDefaults`; `app` at :165), §1 SETTINGS (`/* ── SETTINGS: what this
browser remembers` :196 → :337 at `86968b7`), §24 PERSISTENCE (`/* ── persistence (§46)` :4050 → :4343), §25 (`/* ── WAVE 56 · SHAREABLE LINKS` :4344 → :4421
the links; `/* 0.3.1 · S3 THE TRUE HISTORY` :4422 → :4579 the history + its card `const wHist = device(` :4531) — RE-LOCATE on your base, R1 moved ≈ 300
lines, `lab/shell/controller.js`, `lab/settings-store.js` (`WORKSPACE`, `FAMILIES`; `tools/settings-probe.mjs` imports them statically — they do not move),
`lab/project-store.js`, `lab/projects.js`, `tests/helpers/app-source.mjs`, `tests/project-formats.test.mjs` and `tests/first-run.test.mjs` (re-pointed by R0
to `appSource()`; they slice `projectSnapshot`/`projectKey`/the quality seed out of the source — your moved blocks must stay WHOLE in one file),
`tests/legacy/boot.browser-test.mjs` B112, `tools/rack-deps.mjs`, `docs/STATE-SCOPES.md`, `CLAUDE.md` (the scopes paragraph; THE CONTEXT paragraph; R1's).

## R1's as-built facts (filled by the integrator 2026-10-10 07:15; `R1-BUILD.md` is the authority)

- **The seat:** `lab/rack.js:335–339` — `/* ── ONE CONTROLLER · FIELD · THE MATHS WORKERS · ONE ROAD: lab/shell/controller.js (0.5.2 R1) …` and `const { …68
  names… } = await createController(app);`. **§1 SETTINGS runs BEFORE that seat**: the controller's names are TDZ there, so `createSettings(app)` must read a
  controller name as `app.ctl.x` INSIDE a callback (a handler, a `lookSync` call, an `applySettings` body that runs later), never at creation, and never
  destructure `app.ctl` at the top of the module. §24/§25 run after the seat: their modules may still read `app.ctl.x` at use (not copied at creation).
  **All 56 names any moving module reads are ALREADY filled on `app.ctl`** at the end of `createController` (the integrator's commit after R1;
  `r1-measure/ctlunion.txt`); the 12 only `boot()`/the loop read are not and no shell module needs them. **Never edit `lab/shell/controller.js`.**
- **R1 already fills in `boot()`,** right after their declarations: `app.sh.lookSync` and `app.sh.quality` (yours — `lookSync` moves with §1 into
  `createSettings` as `app.sh.lookSync = lookSync` right after its declaration; `quality` is §2's head and STAYS in `boot()`), plus `app.loop.*` and `app.w.*`
  fills that are not yours — leave them.
- **The tool:** `node tools/rack-deps.mjs --classes` measures a module from its own file (`lab/shell/*.js`, `lab/windows/*.js`) as a piece of its planned module;
  a name a file destructures from `app` counts as the boot-level name of that key; a module filling its own slot is a registration; G-A flags a destructured
  null slot unless boot fills it before the seat; an unplanned file is refused. Your rows are `settings` → `lab/shell/settings.js`, `persist` →
  `lab/shell/persist.js`, `links` → `lab/shell/links.js`, `history` → `lab/shell/history.js`. `tests/rack-deps.test.mjs` §5 is its law — keep it green.
- **Lines at your base:** `lab/rack.js` 4,664 — §1 `/* ── SETTINGS: what this browser remembers` :196 → :334 (unchanged by R1); §24 `/* ── persistence (§46)`
  ≈ :3756; §25 `/* ── WAVE 56 · SHAREABLE LINKS` ≈ :4050, `/* 0.3.1 · S3 THE TRUE HISTORY` ≈ :4128, `const wHist = device(` ≈ :4237, `/* ── the diagnostics
  surface` ≈ :4286 — RE-LOCATE by grep, not by number. `lab/*.js` + `lab/shell/` = **27,754 of a 27,943 cap: 189 lines are left for TWELVE modules — each
  module's header comment + signature + return ≤ 12 lines in all; no new blank lines; say your exact Δ.**
- **The rig (07:00):** the GPU is ≈ 3× slower than six hours ago and stalls on the heaviest states ("Render did not settle: animation frames stopped" at the
  lock's gas state, a molecule open — `settings-probe`'s N₂ scene hit it, `frame-occlusion`'s `chipGap`) — on the 0.5.1 BASE as well, and marionette dies after
  ≈ 5 in-session reloads (`settings-probe`'s 6th scene, `keyboard-window`). **A "did not settle" / marionette red is checked ONCE against your base export on your
  second port: identical = the rig; record both readings in the BUILD and move on. Never loop on it; never touch another process.** Josh may reboot the machine
  during your run (a kernel/driver update is pending) — if your servers die, restart them by the same commands and continue.

## The contract (a MOVE, not a rewrite)

1. **What moves — four modules, each called at its seat (G-O):**
   - §1 SETTINGS (142 lines) → **`lab/shell/settings.js`**, `export function createSettings(app)` — EXCEPT `readSettings` (U1, R0 §3 and candidate 3): §0
     calls it at `useCompactDefaults` before §1's line, so **`function readSettings() { return settingsStore.read(); }` STAYS in `rack.js`'s head** (one hoisted
     line reading a §0 const; `app.sh.readSettings` keeps it by value) and the module reads `app.sh.readSettings`. Everything else in §1 (`saveSettings`,
     `setCardStyle`, `setFrost`, `setDisconnected`, `lookSync`, `applySettings` …) moves and is registered on **`app.sh`** at creation.
   - §24 PERSISTENCE (294) → **`lab/shell/persist.js`**, `export function createPersist(app)`: `serialize` and `restore` move WHOLE (AUDIT: serialize is ONE
     interleaving literal, restore ONE ordered program — never split by card), reading the cards' handles through `app.w`/`app.ctl`/the destructured names
     the module takes from `app`. `projectSnapshot`/`projectKey` stay whole in one file for `project-formats.test`'s slices.
   - §25a THE LINKS (`:4344–4421`, 78) → **`lab/shell/links.js`**, `export function createLinks(app)`; §29's `openLink` call (`/* ── WAVE 56 · A LINK OPENS HERE`)
     STAYS at its seat in `boot()` and reads `app.sh.openLink` (or the destructured handle).
   - §25b THE TRUE HISTORY + its card (`:4422–4579`, 158) → **`lab/shell/history.js`**, `export function createHistory(app)` (the HISTORY card's `device(...)`,
     `rack.appendChild`, `rk.register` move with it in their order — the card keeps its seat in the rack because the CALL keeps its seat in `boot()`).
2. **`app.state`:** settings owns `molFormulaScale` and `space`; persist `restoreNotice`; links `linkLast`; history `history` (R0 §6) — their seats
   (`app.state.x = init`) travel with the code that owns them; every other member each module uses (persist reads 13 of another scope's) stays `app.state.x`,
   read and written live, never destructured. Rows AFTER R0: settings **15**, persist **13**, links **3**, history **4** (forward + shared; limit 25; zero bare
   writes) — count them before and after.
3. **Boot-kept fills (candidate 2):** a `host`/`loop` slot a module of yours needs is filled in `boot()` right after its declaration. R2a may need the same
   line at the same seat — write it anyway; the integrator keeps one.
4. **The code moves VERBATIM** — indentation kept, comments and section headers travel, no renames beyond R0's `app.state`; imports the four blocks need move
   from `rack.js` (say how many). `WORKSPACE`/`FAMILIES` stay in `settings-store.js`. The scope law (`docs/STATE-SCOPES.md`): a project open leaves
   `lambdawaves.q0.settings` byte-identical outside the WORKSPACE keys — `settings-probe` proves it, and the serialize bytes never move.
5. **Lines:** moves ≈ 0; four module headers ≈ +20 each; `rack.js` −(142 + 294 + 78 + 158) + four calls + the one kept `readSettings` line. Say the real numbers.
   Nothing in `lab/mir/**`. The modules ≤ 600 each.
6. **Disjoint from R2a** (running beside you): you touch §1, §24, §25 and `app.sh`; R2a touches the windows block (STATE, SPECTRUM) and `app.w`. Never edit a
   line outside your four spans + the four call seats + the kept `readSettings` + the import lines you move; `rack.js` must auto-merge.

## Acceptance
- `serialize-bytes` **11/11 full + edit sha-identical** to your base (export + second port); `settings-probe` **0/6**; `tests/project-formats.test.mjs` +
  `first-run.test.mjs` (re-pointed slices) green in `bash test.sh node` (exit 0); `history` **44**; `new-project` 8 + `node tools/new-project.mjs --check`;
  `lw-links` (the link suite), `tests/legacy/boot.browser-test.mjs` B112 and the settings/persistence blocks alone (chunk runner), `lw-facade` 1/1,
  `offer` 16, `first-run` 12, `access`, `node tests/pwa.test.mjs --write`. THE LOCK is not yours (the dial) unless you touched what the loop reads — then run
  it and say so.
- **The classes table** before/after: the four modules measured from their files, each ≤ 25, zero bare writes; `rack.js` shows four calls + `readSettings`.

## Commits (each followed by `R3a-HANDOFF.md`)
1. `0.5.2 R3a · lab/shell/settings.js + persist.js + links.js + history.js: §1, §24, §25 move verbatim; called at their seats; readSettings stays in the head`
   (+ pwa).
2. `0.5.2 R3a · the probes; the classes table; R3a-BUILD.md; wave 218` (REPORT.md under the 0.5.2 heading R0 made; the drafted CLAUDE.md sentence in the BUILD,
   not applied).

## Harness
Isolated worktree: `git reset --hard <the integrator's tip named in your launch message>` first. Ports: yours **9073/5543** (your tree) + **9077/5547** (the base
export: `git archive <sha> | tar -x -C <dir>`, served with `LW_CERTS=<your worktree>/.certs`). `python3 tools/gate/server.py <path> <port>` (run_in_background);
`LW_PORT=… GD_PORT=…`. ONE browser at a time on the rig — R2a runs beside you: `node tools/perf/wait-gpu.mjs` and `pgrep -a geckodriver` / `pgrep -a -f
chrome` (ignore the editor's idle playwright-mcp chrome) before EVERY suite, and if another suite is running, wait — never kill another's process; stop yours
by pid; never `pkill -f`. The shell guard refuses compound lines (plain commands or `bash .tmp/x.sh` / `node .tmp/x.mjs`). Never edit `lab/mir/**`,
`lab/fonts/**`. No `sed` over `rack.js`. Subtract, don't add. Never merge, push, tag. The boot suite's B149 is the standing law red, B6/B69 flake on the base,
`latex-copy` is red on the base — say them, do not fix them. `R3a-BUILD.md`: the ledger (rack.js and the four modules, exact), the classes table before/after,
every probe's count, the import fan-out, the `app.sh` fills, brief candidates, the merge notes (the four seat lines; what `boot()` destructures; the kept
`readSettings`), the drafted CLAUDE.md sentence, "what Josh will see" (nothing — prove it). Hand back by message + try `~/.claude/handoffs/agents/<id>.md`.
