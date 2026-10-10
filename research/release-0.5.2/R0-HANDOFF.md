# R0-HANDOFF · THE CONTEXT (relaunch from this tip with BRIEF-R0.md)

Worktree `.claude/worktrees/agent-a3cd6c8bc9017c753`, branch `worktree-agent-a3cd6c8bc9017c753`, base `54865a3`. Ports 9043/5513 (tree), 9047/5517 (base / scratch).

## Done
- **Step 1** (commit `0.5.2 R0 · tools/rack-deps.mjs --classes and --rename; the U1 hoisting audit; U7 the facade fixture on the base`):
  `tools/rack-deps.mjs` gained `--classes` (`PLANNED`, `PLANNED_CUT`, `classes()`, `classesText()`) and `--rename` (`renamePlan()`; refuses a
  dirty tree; `--dry-run`); the walker records shorthand positions, declaration statements and each reference's scope. U1: `readSettings` is the one
  cross-module early call (`setModArm`, `saveMod` intra-module). U7: `research/release-0.5.2/lw-facade.json` (176 = 56 value · 48 get · 72 method),
  `tests/lw-facade.browser-test.mjs` GREEN on the base. `R0-BUILD.md` §1–§4.

## Next
- **Step 2** THE CONTEXT: `node tools/rack-deps.mjs --rename .tmp/rename-map.json` (the 57 shared lets → `app.state.x`, `__LW_hooks` → `app.hooks`;
  regenerate the map from `classes(src).sharedLets`), then hand edits: the `app` literal at the end of §0, drop the three pre-`app` seats
  (`app.hooks = {}`, `app.state.history = null`, `app.state.palette = null`), `const ui = {}` moved up, the dead `windowActivity` wrapper and the first
  `frost` out, `ui.camSeg`'s read out, the four unused imports out, the `device` import folded into `kitDevice`; `pwa --write`; the fixture re-captured.
- Step 3 `tests/helpers/app-source.mjs` + the re-pointed laws; step 4 the pair, the lock, the estate, REPORT.

## Blockers
- none
