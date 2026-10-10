# BRIEF R1 · THE CONTROLLER (0.5.2 "Rack Dissolution"; Opus builder; alone, second — after R0 merges)

**Read first, whole:** `research/release-0.5.2/PLAN.md` (§1, §2 — G-A, G-O, G-G, G-S, G-D, G-M — the R1 row, §6, §8, §9), **`research/release-0.5.2/R0-BUILD.md`**
(the context AS BUILT: the namespaces and their members, the shared-let list, the U1 hoisting list, the U8 `ui` contract, the classes table after R0 — your
module must read `app` exactly as R0 shaped it), `research/release-0.5.2/AUDIT-OPUS.md` E3 (why the loop stays and the controller moves), §3.2 (the controller's
row: 234 lines, backward 11, forward 5, shared 1, writes 0; the one road: 71, backward 12, forward 4, shared 4, writes 2 — `refSnapshot`, `pendingRef`),
`research/release-0.5.2/RACK-DEPS.md` §2 (§2–§4, §7), `lab/rack.js` §2 ONE CONTROLLER (305–487 at `54865a3`; re-locate on your base — R0 moved lines), §3 FIELD,
§4 THE MATHS WORKERS, §7 ONE ROAD, and §5–§6 (what STAYS and what it reads from the controller: `schedule`, the governor, the field, `markBatchBegin` …),
`tests/auto-scale.test.mjs` (its indentation-sensitive slices of `controlStep` and the loop's bookkeeping), `tests/render-exact.test.mjs`, `tests/window-activity.test.mjs`,
`tests/helpers/app-source.mjs` (R0's helper), `tests/legacy/boot.browser-test.mjs` B108 (re-pointed by R0), `tools/perf/digest-lock.mjs`, `tools/perf/main-thread.mjs`, `CLAUDE.md`.

## The contract (a MOVE, not a rewrite)

1. **What moves:** §2 ONE CONTROLLER (the governor, AUTO SCALE's one rule, the look, the busy marks, the mod port, the rotation drive), §3 FIELD (`createField`, `onLost`),
   §4 THE MATHS WORKERS, §7 ONE ROAD (the state mutations: finger, key, test, restore all come here) → **`lab/shell/controller.js`**, `export async function
   createController(app)` (async — it awaits `createField`), **called at §2's seat** in `boot()` (G-O), returning its handles into boot's scope by destructuring
   (`const { gov, quality, look, field, schedule?… } = await createController(app)` — exactly the names §5–§6 and the later sections read; list them from the
   classes table) and registering what the plan puts on `app` (`app.loop.*`? no — `schedule` is §6's and STAYS; the controller registers the governor, the look,
   the busy marks, the mod port, the rotation drive, the field and the workers onto the namespaces R0 made for them).
2. **What STAYS in `boot()`:** §5 THE BACKGROUNDED TAB, §6 THE ROUTER (the loop, `schedule`, `windowActivity`, the corner axis), `filmHold`, §13–§14 (badges, the
   install layer — 30 lines of one-call wiring). `schedule` keeps its hoisting. Nothing on the frame path changes shape; the loop's per-frame reads stay closure
   slots (the handles destructured at the seat).
3. **The code moves VERBATIM** — the two-space body indentation kept inside `createController(app) { … }` so `auto-scale.test`'s slices still match through
   `appSource()`; comments and section headers travel with their code; no renames beyond what R0's `app.state` already did; the one road's two writes
   (`refSnapshot`, `pendingRef`) go through `app.state` as R0 made them (or stay the controller's own if R0 left them private — read R0-BUILD).
4. **Imports:** the controller imports what §2–§4/§7 import today (`createField`, the worker pool, the governor's pieces, the look, the mod port …) — move those
   import lines from `rack.js` to the module; `rack.js` loses them (say how many). The fan-out is counted in the ledger.
5. **Lines:** moves ≈ 0; the module's header + signature + return ≈ +20; `rack.js` −305 + the call. Say the real numbers. Nothing in `lab/mir/**`. The module ≤ 600
   (≈ 325 expected).

## Acceptance
- **THE LOCK** 860 · 0/0 and 1004 · 0/0 (it holds `createField`; a single red re-run alone once).
- **The pair** base = the tree before you (your base sha, served on your second port) vs your tree, both scenes (boot; D1's `--setup`), 5 + 5, quiet rig:
  |Δ| ≤ 3.536, expect ≈ 0.
- **Suites:** `frame-occlusion` 7; `gpu-recovery` alone (say if Josh's desktop Firefox is up); the boot suite alone (B6/B22/B23; B108 — `createField(dom.canvas, {`
  now lives in the module, `appSource()` sees it; B149 the only law red); the device report's long play (`tools/perf/device-report.js` or the bench's `readyMs` —
  read how C-V did it); `current` 15; `render-regressions` 2; `node tests/auto-scale.test.mjs` (re-pointed slices), `node tests/render-exact.test.mjs`,
  `node tests/window-activity.test.mjs`; `offer` 16; `take-in-bugs` 4 (the mod port moved); `routed-knob` 4; `mir-controls` 2; `settings-probe` 0/6; `serialize-bytes`
  11/11 full + edit; `history` 44; `new-project` 8 + `--check`; `bash test.sh node` 0; `node tests/pwa.test.mjs --write`.
- **The classes table** (`node tools/rack-deps.mjs --classes`) before/after: the controller's row ≤ 25 forward + shared, zero bare writes; `rack.js`'s section
  list shows §2–§4 and §7 as one call.

## Commits (each followed by `R1-HANDOFF.md`)
1. `0.5.2 R1 · lab/shell/controller.js: ONE CONTROLLER, FIELD, THE MATHS WORKERS and ONE ROAD move verbatim; called at §2's seat; the loop stays` (+ pwa).
2. `0.5.2 R1 · the lock, the pair, the estate; the classes table; R1-BUILD.md; wave 2xx` (REPORT.md under the 0.5.2 heading R0 made; the drafted CLAUDE.md
   sentence — where the controller lives and what stays in `boot()` — in the BUILD, not applied).

## Harness
Isolated worktree: `git reset --hard <the integrator's tip named in your launch message>` first. Ports: yours 9053/5523 (your tree) + 9057/5527 (the base export).
`python3 tools/gate/server.py <path> <port>` (run_in_background); `LW_PORT=… GD_PORT=…`. ONE browser at a time on the rig: `node tools/perf/wait-gpu.mjs` and
`pgrep -a geckodriver` / `pgrep -a -f chrome` empty before each; the lock and the pair on a quiet rig; never kill another's process; stop yours by pid; never
`pkill -f`. The shell guard refuses compound lines (plain commands or `bash .tmp/x.sh`). Never edit `lab/mir/**`, `lab/fonts/**`. No `sed` over `rack.js`.
Subtract, don't add. Never merge, push, tag. `R1-BUILD.md`: the ledger (rack.js and the module, exact), the classes table before/after, the pair's numbers, the
lock, every suite's count, the import fan-out, brief candidates, the merge notes (the seat line; what `boot()` destructures), the drafted CLAUDE.md sentence,
"what Josh will see" (nothing — prove it). Hand back by message + try `~/.claude/handoffs/agents/<id>.md`.
