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

## R1's as-built facts (FILLED BY THE INTEGRATOR ON R1's REPORT — do not launch before this block is filled)

- The controller's seat line and the destructuring statement in `boot()`: …
- `app.ctl` members filled at creation that persistence/settings read (`gov`, `quality`, `look` …): …
- The tool's module-file mode and how a moved module is named in the classes table: …
- The line count of `lab/rack.js` at your base and your four spans' new lines: …

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
