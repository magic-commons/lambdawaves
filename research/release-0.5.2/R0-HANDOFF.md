# R0-HANDOFF · THE CONTEXT (relaunch from this tip with BRIEF-R0.md)

Worktree `.claude/worktrees/agent-a3cd6c8bc9017c753`, branch `worktree-agent-a3cd6c8bc9017c753`, base `54865a3`. Ports 9043/5513 (tree), 9047/5517 (base / scratch).
The base export is `.tmp/base` (served on 9047 when needed); my tree is served on 9043 (stop both by pid: `pgrep -f "^python3 <tree>/tools/gate/server.py"`).

## Done
- **Step 1** `f5cef0f`: `tools/rack-deps.mjs --classes` / `--rename`; U1 (readSettings the one cross-module early call); U7 the facade fixture on the base
  (176 = 56 value · 48 get · 72 method) + `tests/lw-facade.browser-test.mjs`. `R0-BUILD.md` §1–§4.
- **Step 2** `8343ab2` THE CONTEXT: `app` at the end of §0 (top-level §0 consts + dom + ui; hooks 12; state 57; loop; host 21; w 71; ctl 68; sh 45; all < 128);
  the 57 shared lets → `app.state.x` and `__LW_hooks` → `app.hooks` by `--rename` (891 edits); the three pre-`app` seats dropped; `ui` moved up;
  `resetWall` is `app.loop.resetWall`; OUT the dead windowActivity wrapper, the first frost, ui.camSeg's read, four unused imports, the `device` import
  (folded into kitDevice). Hinge HOLDS (0 cross writes; SPECTRUM 24). Fixture re-captured (frost 31 → 147, windowActivity 142 → 149). `test.sh node` exit 0;
  smoke boot + four demos clean on 9043. lab/*.js 27,666 → 27,694.

## Next
- **Step 3** `tests/helpers/app-source.mjs` (`appSource()` = rack.js + `lab/windows/**` + `lab/shell/**`); re-point auto-scale, first-run, ink, project-formats,
  access and the boot suite's B108 / B112 / `:5778` reads; extend `tests/rack-deps.test.mjs` (`--classes` tiles the body; every shared let is app.state; no bare write).
- **Step 4** U4 the floor (base vs base 5 + 5, both scenes), the pair (base vs tree), U5 (`%HasFastProperties`), THE LOCK 860/1004, the estate one at a time, the boot
  suite alone (B149 the only law red), serialize-bytes 11/11 full + edit, settings-probe 0/6, history 44, new-project 8 + --check; R0-BUILD.md; REPORT wave.

## Blockers
- none
