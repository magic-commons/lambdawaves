# BRIEF R2a · STATE + SPECTRUM (0.5.2 "Rack Dissolution"; Opus builder; PAIR 1 with R3a — disjoint regions AND disjoint `app` namespaces)

**Read first, whole:** `research/release-0.5.2/PLAN.md` (§1, §2 — G-A, G-O, G-G, G-S, G-D, G-M — the PAIR 1 row in §3, §4, §8, §9), **`R0-BUILD.md`** (the
context AS BUILT: §5 the namespaces, §6 the classes table and the shared-let owners, §7 the `ui` contract, §11 the brief candidates), **`R1-BUILD.md`** (the
controller AS BUILT: its seat, what `boot()` destructures, what `app.ctl` holds, the tool's module-file mode), `research/release-0.5.2/BRIEF-R1.md` (the
pattern of a MOVE row), `lab/rack.js` the windows block (`/* ── windows ──` … `/* ── LEGACY WINDOWS`; at `86968b7`: STATE `const wState = device(` :1472 →
:1636, SPECTRUM `const wSpec = device(` :1637 → :1888 — RE-LOCATE on your base, R1 moved ≈ 300 lines above you), `lab/shell/controller.js` (what a moved
module looks like), `tests/helpers/app-source.mjs`, `tools/rack-deps.mjs` (`--classes`; the module-file mode R1 added), `CLAUDE.md` (the last two
paragraphs: THE CONTEXT and R1's sentence), `docs/STATE-SCOPES.md`.

## R1's as-built facts (FILLED BY THE INTEGRATOR ON R1's REPORT — do not launch before this block is filled)

- The controller's seat line and the destructuring statement in `boot()`: …
- `app.ctl` members filled at creation (the ones a window reads — `gov`, `quality`, `look`, `schedule`? …): …
- The tool's module-file mode and how a moved module is named in the classes table: …
- The line count of `lab/rack.js` at your base and the windows block's new line span: …

## The contract (a MOVE, not a rewrite)

1. **What moves:** the STATE card (`const wState = device({ id: 'state' …` through the line before `const wSpec`) → **`lab/windows/state.js`**,
   `export function createStateCard(app)`; the SPECTRUM card (`const wSpec = device({ id: 'spectrum' …` through the line before the five appends
   `rack.appendChild(wPal.root); rack.appendChild(wObs.root); …` and `rack.appendChild(ui.set.root);`) → **`lab/windows/spectrum.js`**, `export function
   createSpectrumCard(app)`. **The five appends STAY at their seat** in `boot()` (the DOM-order law: the racks are built in creation order; a card's
   position is the order of the `appendChild`/`register` calls, and both calls stay where they are — if a card's own `rack.appendChild(w.root)` /
   `rk.register(...)` lines sit inside the span you move, they move WITH the card and keep their relative order; the integrator checks `captureLayout` and
   `settings-probe`).
2. **Called at their seats** (G-O): `const { … } = createStateCard(app);` exactly where `const wState` stood, `createSpectrumCard(app)` exactly where
   `const wSpec` stood; nothing else in `boot()` moves. Each module registers its crossing names on **`app.w`** at creation (`app.w.wSpec = wSpec`, the
   names the classes table lists for `state` and `spectrum` — fill ONLY the slots a reader outside your module needs; a fill nothing reads is a dead store;
   the literal is never edited). Readers that are still in `boot()` (the loop, later sections, the facade) take the handles from the destructuring or read
   `app.w.x`; a reader in another MOVED module (the controller) reads `app.w.x` live — never a copy taken at creation.
3. **`app.state`:** STATE and SPECTRUM own no shared let (R0 §6: `state` uses 2 of another scope's, `spectrum` 9); every one stays `app.state.x`, read and
   written live, never destructured. SPECTRUM's row is the plan's HIGHEST (forward + shared **24**, limit 25): count it before and after, and if a move would
   push it past 25, STOP at a committed WIP and report rather than widening the context.
4. **`ui`:** the registry is `app.ui`; every `ui.x =` the two cards write stays under the same name (R0 §7: `native-ui.js` re-parents STATE's rotation knobs
   and reads the A/B row — those members are the CONTRACT; `badges.js` reads `fieldRo`). No `ui` member becomes private to your module.
5. **The code moves VERBATIM** — the body indentation kept inside `createStateCard(app) { … }` so any source-reading law still matches through
   `appSource()`/`appFiles()` (B108/B112/B136 read the concatenation; `tests/project-formats.test.mjs`, `first-run.test.mjs`, `ink.test.mjs`,
   `access.test.mjs`, `auto-scale.test.mjs` were re-pointed by R0 — run them); comments and the cards' section headers travel with their code; no
   renames beyond what R0's `app.state` already did. Imports the two cards need move from `rack.js` to the modules (say how many; the fan-out is counted).
6. **Lines:** moves ≈ 0; each module's header + signature + return ≈ +20; `rack.js` −(170 + 250) + two calls. Say the real numbers. Nothing in `lab/mir/**`.
   The modules ≤ 600 each.
7. **Disjoint from R3a** (running beside you): you touch the windows block and `app.w`; R3a touches §1 SETTINGS, §24 PERSISTENCE, §25 LINKS + HISTORY and
   `app.sh`. Never edit a line outside your two spans + the two call seats + the import lines you move; the integrator merges you both onto one tip and
   `rack.js` must auto-merge (it did for every row so far when the regions were disjoint).

## Acceptance
- **The light check (one window row = one light check, the dial):** `register`, `orbitals`, `offer` 16, `history` 44, `hit-probe-set` 0 reached,
  `frame-occlusion` 7, the boot suite's STATE/SPECTRUM laws alone (B43 the shipped defaults, B11 the lane buttons, B61 the minimalist graph, the state grid's
  paint-gesture law; use the chunk runner for the blocks), `settings-probe` 0/6, `serialize-bytes` 11/11 full + edit vs your base (export + second port),
  `lw-facade` 1/1 (the facade still reads your handles), `bash test.sh node` 0, `node tests/pwa.test.mjs --write`. THE LOCK is NOT yours (the dial: the lock
  at R0, R1, R5, R-V) — unless you touched anything `field.js`/the loop reads; then run it and say so.
- **The classes table** before/after: `state` and `spectrum` measured from their files, each ≤ 25 forward + shared, zero bare writes; `rack.js`'s windows
  block shows two calls where the two cards were.

## Commits (each followed by `R2a-HANDOFF.md`)
1. `0.5.2 R2a · lab/windows/state.js + spectrum.js: STATE and SPECTRUM move verbatim; called at their seats; the five appends stay` (+ pwa).
2. `0.5.2 R2a · the light check; the classes table; R2a-BUILD.md; wave 217` (REPORT.md under the 0.5.2 heading R0 made; the drafted CLAUDE.md sentence in the
   BUILD, not applied).

## Harness
Isolated worktree: `git reset --hard <the integrator's tip named in your launch message>` first. Ports: yours **9063/5533** (your tree) + **9067/5537** (the base
export: `git archive <sha> | tar -x -C <dir>`, served with `LW_CERTS=<your worktree>/.certs`). `python3 tools/gate/server.py <path> <port>` (run_in_background);
`LW_PORT=… GD_PORT=…`. ONE browser at a time on the rig — R3a runs beside you: `node tools/perf/wait-gpu.mjs` and `pgrep -a geckodriver` / `pgrep -a -f
chrome` (ignore the editor's idle playwright-mcp chrome) before EVERY suite, and if another suite is running, wait — never kill another's process; stop yours
by pid; never `pkill -f`. The shell guard refuses compound lines (plain commands or `bash .tmp/x.sh` / `node .tmp/x.mjs`). Never edit `lab/mir/**`,
`lab/fonts/**`. No `sed` over `rack.js`. Subtract, don't add. Never merge, push, tag. The boot suite's B149 is the standing law red, B6/B69 flake on the base
(re-run a block alone before believing it), `latex-copy` is red on the base — say them, do not fix them. `R2a-BUILD.md`: the ledger (rack.js and the two
modules, exact), the classes table before/after, every suite's count, the import fan-out, the `app.w` fills, brief candidates, the merge notes (the two seat
lines; what `boot()` destructures), the drafted CLAUDE.md sentence, "what Josh will see" (nothing — prove it). Hand back by message + try
`~/.claude/handoffs/agents/<id>.md`.
