# C1 HANDOFF — the CAMERA panel through A8's port (live state; updated after every commit)

- Worktree: `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a6673ac11f828a394`
- Branch: `worktree-agent-a6673ac11f828a394`, reset to `7044f37` (the `sos-s0` tip, pre-C baseline).
- `cat lab/*.js | wc -l` at the base: **36,288**.
- Ports: `LW_PORT=8793 GD_PORT=5263`.

## Commits so far
| sha | step |
|---|---|
| `3a60679` | the bare adopt of MIR 1.5 alpha.24 (`adopt.mjs --line 1.5`: 196 added, 23 updated, 43 unchanged; `pwa --write` 372 entries) |

## State
- Step 1 (the adopt) done. `node tests/pwa.test.mjs --write` rewrote `sw.js` and then reds on `lab/mir/shell/gui.js: https://www.fabiandesmet.com/` (C0's cascade owns it).
- Next: mount `createCameraPanel` over `cameraPort` in the CAMERA card; delete CAMERA MOTION; then RAMP replaces `paletteview.js`.

## Exact next step if this session dies
Read `research/release-0.5.0/PLAN.md` §2 C1 and `A1-A8-BUILD.md` open items 2–4, then continue from the "Next" line above on this branch.
