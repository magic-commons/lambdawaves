# C5 · HANDOFF (history as the one `edit` domain) — live state, rewritten after every commit

- worktree: `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a1a6731f62408d489`
- branch: `worktree-agent-a1a6731f62408d489`, reset to `7044f37` (the `sos-s0` tip)
- `lab/*.js` before: **36,288**

## Commits so far

1. `e5944bc` — 0.5.0 C: the bare adopt of MIR 1.5 alpha.24 (`adopt.mjs --line 1.5`; 196 added, 23 updated, 0 removed, 43 unchanged;
   `pwa --write`: 372 entries). Identical to C0's. `pwa.test` reds on an absolute URL in `lab/mir/shell/gui.js` (C0's cascade).

## State

Reading done (PLAN §2 C5, CLAUDE.md, STATE-SCOPES, survey MIR-1.5 §1.4/R3, the kit's `history/*` and `docs/HISTORY.md`,
`lab/history.js`, rack.js' history block and card, `history.browser-test.mjs` 39 blocks, `history.test.mjs`).

## Next step

Wire the kit's `createHistory` (`lab/mir/history/history.js`) with ONE snapshot domain `edit` (read = `serialize({ scope: 'edit' })`
+ its FNV key, write = `restore(S, { history: true })`) behind the `__LW.history` facade in rack.js; the card becomes a `device`
holding the kit's `historyList`; delete `lab/history.js`; then the gates.
