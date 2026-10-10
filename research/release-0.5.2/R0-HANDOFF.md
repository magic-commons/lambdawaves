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

- **Step 3** `cc6d7ff`: `tests/helpers/app-source.mjs` (appFiles / appSource); auto-scale, first-run, ink, project-formats, access re-pointed;
  the boot suite's B108 / B112 / B136 fetch appFiles() (APP_SRC); `tests/rack-deps.test.mjs` §4 (tiles, no bare shared let, state keys, no cross write, the hinge,
  static G-A, the helper); the dead `app.hooks.themeChanged` read out. `test.sh node` exit 0.
- **Step 4 under way**: U4 floor DONE (base vs base: boot Δ −0.165, D1 Δ −0.054; spreads ≤ 1.85); the pair base 9047 vs tree 9043 running (`.tmp/pairs-pair.log`).

## Next
- ~~Step 3~~ `tests/helpers/app-source.mjs` (`appSource()` = rack.js + `lab/windows/**` + `lab/shell/**`); re-point auto-scale, first-run, ink, project-formats,
  access and the boot suite's B108 / B112 / `:5778` reads; extend `tests/rack-deps.test.mjs` (`--classes` tiles the body; every shared let is app.state; no bare write).
- **Step 4** U4 the floor (base vs base 5 + 5, both scenes), the pair (base vs tree), U5 (`%HasFastProperties`), THE LOCK 860/1004, the estate one at a time, the boot
  suite alone (B149 the only law red), serialize-bytes 11/11 full + edit, settings-probe 0/6, history 44, new-project 8 + --check; R0-BUILD.md; REPORT wave.

## Blockers
- none
