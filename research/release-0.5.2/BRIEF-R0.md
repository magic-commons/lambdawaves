# BRIEF R0 · THE CONTEXT (0.5.2 "Rack Dissolution"; Opus builder; alone, first; the measuring row)

**Read first, whole:** `research/release-0.5.2/PLAN.md` (§0, §1, §2 — G-A, G-G, G-W, G-S above all — the R0 row, §6 U1–U8, §8, §9), `research/release-0.5.2/AUDIT-OPUS.md`
E1, E2, E3, E5, E8, E10, E14 and §3 (the residue and the classes tables — your work is to make the classes table true), `research/release-0.5.2/RACK-DEPS.md`
§2 (the sections), §4 (the hubs), §5 (the `ui` bag), §6 (the facade), §10 (the forward uses), §12 (the walker's blind spots), `tools/rack-deps.mjs` (whole — you
extend it), `tests/rack-deps.test.mjs`, `lab/rack.js` §0 (104–162), §2 (305–487), §6 (611–1011), the head of §8 (1083–1200), §24 (4019–4312), §26 (4549–4807),
§28–§30 (4828–4930), `lab/native-ui.js` and `lab/badges.js` (the `ui` bag's outside consumers), `tests/auto-scale.test.mjs` :12–13 and :128–129, `tests/first-run.test.mjs`
:73, :95, :120–131, `tests/ink.test.mjs` :195–200, `tests/project-formats.test.mjs` :198–205, `tests/access.test.mjs` :96, `tests/legacy/boot.browser-test.mjs`
:4653–4658, :4856–4858, :5778 (the laws that read `rack.js` as text), `tools/perf/main-thread.mjs` (`--setup`, `--sweep`), `tools/perf/digest-lock.mjs`, `CLAUDE.md`.

## The contract (what R0 does; no section moves)

1. **`app`, the context, at the top of `boot()`** — fixed-shape namespaces (G-A), each ONE object literal with every key present (null placeholders where a value
   is made later), never extended after, never `Object.assign`ed into, never `delete`d: `app = { dom, reg, clock, appPlay, obs, mat, sturm, rates, settingsStore,
   hooks, ui, state: { … }, loop: { schedule, hold, resetWall }, w: { … } }`. The exact member lists come from your measurement (below), not from the plan's
   example. `__LW_hooks` becomes `app.hooks` (every `__LW_hooks.` site → `app.hooks.`, at the tool's token positions).
2. **Consts and functions KEEP their names.** No rename of a `const` or a `function` anywhere (2,670 references, 39 shorthand `{ x }` sites, 6 shadowed — a text
   rename would break them). Later rows destructure them from `app`.
3. **Every shared `let` the planned cut makes cross-module becomes `app.state.x`** — read and written live, never destructured — changed by a resolver-driven edit:
   add `--rename <name>=<app.path>` (repeatable; or a JSON map file) to `tools/rack-deps.mjs` that rewrites exactly the references the walker resolves to the
   boot-level binding (never an inner shadow; shorthand `{ x }` becomes `{ x: app.state.x }`), prints every edit (line, column, before → after) and refuses to run on
   a dirty tree. Which lets: compute them — `node tools/rack-deps.mjs --classes` (the new mode: for the plan's §3 cut — the planned modules as line spans — print
   per module its backward consts, forward names, shared lets and writes to another module's bindings, as AUDIT §3.2 did with `.tmp/classes.mjs`; copy that
   script's logic from the audit's worktree `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-acac71e05b772277c/.tmp/classes.mjs`, read-only). Every
   `let` that any planned module other than its owner reads or writes is a shared let → `app.state`. Lets private to one planned module stay as they are. The 17 lets
   assigned after declaration and read elsewhere (`chem`, `molSession`, `orbitals`, `states`, `register`, `capApi`, `camKnobs`, `stageText` …) are shared lets.
4. **U1 THE HOISTING AUDIT (before any edit).** In a SCRATCH tree (`git archive HEAD` into `.tmp/scratch`, served on your second port), turn every boot-level
   `function x(` into `const x = function x(` by a node script over the tool's token positions; boot under the gate (`tests/legacy/boot.browser-test.mjs`'s first
   block through the chunk runner, and the four demos WATER / BENZENE / N₂ / WAVE DANCER via `__LW.projects.demo`); every TDZ `ReferenceError` names a function that
   a constructor calls before its declaration line — those functions go onto `app` at the top of `boot()` (as `app.<ns>.x`), where hoisting already serves them.
   Record the list in `R0-BUILD.md` U1. Discard the scratch tree. (`readSettings()` at `:131` before `:166` is one known case.)
5. **U7 THE RUNTIME FACADE FIXTURE.** On the BASE (`v0.5.1-alpha`, served on your second port), record `Object.entries(Object.getOwnPropertyDescriptors(__LW))` as
   `[name, kind]` (kind = `get` | `value` | `method`), in order, into `research/release-0.5.2/lw-facade.json`; write `tests/lw-facade.browser-test.mjs` (one scene:
   boot, compare names + kinds + order to the fixture; the house style — read `tests/opener.browser-test.mjs` for the shape). It must be GREEN on the base, then on
   your tree after step 6 (the two deletions change the fixture: re-capture it on your tree, and say the exact diff — the dead wrapper's key leaves one slot).
6. **The dead code (OUT):** delete the dead `windowActivity` wrapper at `:4723–4726` (the later GETTER stays — the suites call `__LW.windowActivity.presentOffscreen`)
   and the first `frost` (`:4552`, identical to the later getter); the four unused imports `tableFor`, `FILM_FPS`, `domainForP`, `momentumTableFor`; resolve the
   `device` import shadowed by boot's own `device` wrapper (rename the import at its use sites, not the wrapper — the wrapper is a hub).
7. **`tests/helpers/app-source.mjs`** exporting `appSource()` = the concatenated text of `lab/rack.js` and every module under `lab/windows/` and `lab/shell/` (none
   exist yet; the helper lists the two folders); re-point the five node suites' source slices and the boot suite's three `fetch('./rack.js')` laws (B108, B112, `:5778`)
   through it in the SAME commit, no law weakened; `tests/rack-deps.test.mjs` extended: `--classes` tiles the body; every shared let the cut names is an `app.state`
   member and no bare write to another module's binding remains.
8. **U8 THE `ui` REGISTRY CONTRACT:** list every `ui` member that `native-ui.js` and `badges.js` read, write or patch (incl. dynamic `ui[name]` rows) in `R0-BUILD.md`
   — the later window rows may not claim one private. `ui.camSeg` is dead (`:4174` reads it, nothing assigns) — delete the read, say so.
9. **Lines:** IN ≈ +40 (the namespaces) + 10 (the helper); OUT ≈ 1–5. Say the real number. Nothing in `lab/mir/**`.

## The hinge (G-G) — measured by you, before and after
`node tools/rack-deps.mjs --classes` on the base and on your tree: **zero bare writes to a binding another planned module owns; forward + shared ≤ 25 per planned
module** (the loop §5–§6 is exempt — it stays in `boot()`). If a planned module cannot be brought under 25 by the context alone, STOP, report which and why, and
the integrator re-plans; do not widen the context past the plan's namespaces to force it.

## Acceptance
- **U4 first:** the pair's same-tree floor — `v0.5.1-alpha` vs itself, 5 + 5, both scenes (boot; D1's `--setup` scene), quiet rig (`wait-gpu`, `pgrep` empty, load < 4).
  Then **the pair** base vs your tree in both scenes: |Δ| ≤ 3.536; expect Δ ≈ 0 (the loop's 27 shared-let reads become `app.state` reads; its 49 forward reads
  stay closure slots). A gross Δ means G-A was broken — find the dictionary-mode object (U5: `--js-flags=--allow-natives-syntax`, `%HasFastProperties(app)` and each
  namespace after `LW.ready`, through `cdp.mjs`; if the flag is unavailable, say so and rely on G-A).
- **THE LOCK** 860 · 0/0 and 1004 · 0/0 (a single red re-run alone once).
- **Every browser suite** in the estate, one at a time (the whole file changed textually): the list C-V ran (`research/release-0.5.0/C-V.md` §1) + opener, timeline,
  film-probe/compare, menubar, molecule-head, lw-links, curves, flash-routes (node), stage-text; **the boot suite alone: B149 the only law red** (B108/B112/`:5778`
  re-pointed); `serialize-bytes` 11/11 full + edit; `settings-probe` 0/6; `history` 44; `new-project` 8 + `--check`; `node tests/pwa.test.mjs --write`; `bash test.sh
  node` exit 0 (incl. the extended `rack-deps` test and the new helper).
- **The classes table** before/after in `R0-BUILD.md`, with the shared-let list, the U1 list, the U8 list, the fixture diff.

## Commits (each followed by `R0-HANDOFF.md`)
1. `0.5.2 R0 · tools/rack-deps.mjs --classes and --rename; the U1 hoisting audit; U7 the facade fixture on the base` (tool + scripts' results in the BUILD; no lab change).
2. `0.5.2 R0 · THE CONTEXT: app's namespaces at the top of boot(); the shared lets as app.state; __LW_hooks → app.hooks; the dead facade keys and the unused imports leave`
   (+ pwa; + the fixture re-captured).
3. `0.5.2 R0 · tests/helpers app-source(); the source-reading laws re-pointed; rack-deps.test extended`.
4. `0.5.2 R0 · the pair (floor + both scenes), the lock, the estate; the classes table after; R0-BUILD.md; wave 2xx` (REPORT.md under a new heading
   `## 2026-10-0x · 0.5.2 · RACK DISSOLUTION` — read the last wave number first; the drafted CLAUDE.md sentences for `app` and the helper in the BUILD, not applied).

## Harness
Isolated worktree: `git reset --hard <the integrator's tip named in your launch message>` first. Ports: yours 9043/5513 (your tree) + 9047/5517 (the base
`v0.5.1-alpha` export, `git archive`; also the U1 scratch tree in turn). `python3 tools/gate/server.py <path> <port>` (run_in_background); `LW_PORT=… GD_PORT=…`.
ONE browser at a time on the rig: `node tools/perf/wait-gpu.mjs` and `pgrep -a geckodriver` / `pgrep -a -f chrome` empty before each; never kill another's
process; stop yours by pid; never `pkill -f`. The shell guard refuses compound lines (plain commands or `bash .tmp/x.sh` / `node .tmp/x.mjs`). Never edit
`lab/mir/**`, `lab/fonts/**`. No `sed` over `rack.js` — the tool's token positions or hand edits. Subtract, don't add. Never merge, push, tag. `R0-BUILD.md`: the
ledger, U1/U4/U5/U7/U8 results, the classes table before/after, the pair's numbers, every suite's count, the brief candidates, the merge notes, the drafted
CLAUDE.md sentences, "what Josh will see" (nothing — say it and prove it). Hand back by message + try `~/.claude/handoffs/agents/<id>.md`.
