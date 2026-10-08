# C5 · HANDOFF (history as the one `edit` domain) — live state, rewritten after every commit

- worktree: `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a1a6731f62408d489`
- branch: `worktree-agent-a1a6731f62408d489`, reset to `7044f37` (the `sos-s0` tip)
- `lab/*.js` before: **36,288**

## Commits so far

1. `e5944bc` — 0.5.0 C: the bare adopt of MIR 1.5 alpha.24 (`adopt.mjs --line 1.5`; 196 added, 23 updated, 0 removed, 43 unchanged;
   `pwa --write`: 372 entries). Identical to C0's. `pwa.test` reds on an absolute URL in `lab/mir/shell/gui.js` (C0's cascade).

2. `13f5d81` — this hand-off opened.
3. `15d599c` — the kit's stack is the ring: `createHistory` from `./mir/history/history.js` (limit 60, quiet 400, `timers` seam
   watched), ONE domain `edit` (read `serialize({ scope: 'edit' })` + FNV key, write `restore(S, { history: true })`, key = the
   record's own). `historyApi` = the rack's `history` = `__LW.history` is the facade (laws K1–K8 in the code comment).
   Old card untouched (it reads the facade). `lab/history.js` no longer imported (still on disk).
   **history browser 39/39** (8803/5273, alone): flush 0.32 ms median, undo max 108 ms.

4. `54c94e0` — hand-off.
5. `f52dbb0` — **`lab/history.js` deleted**; the facade moved out of rack.js into **`lab/edit-domain.js`**
   (`createEditHistory`, the old ring's port, over the kit's `createHistory`; laws K1–K9 in its header). rack.js is back to its
   0.4.0 shape (+4/−3 vs `7044f37`: import + `createEditHistory(`). `tests/history.test.mjs` re-aimed (import + 2 comments):
   **node 18/18 GREEN**. CLAUDE.md's undo-ring path updated. Browser `history` NOT yet re-run on this commit (next: after the card).

## State

Node after the adopt (85 suites): red = `mir-manifest` (alpha.24 not in ACCEPTED), `new-project` (--check out of step),
`wiring` (unreached kit files), `pwa` (absolute URL in `lab/mir/shell/gui.js`) — all C0's cascade.
Gate server running on 8803 (pid 3337977; stop it by pid).

## Next step

The card → a `device` holding the kit's `historyList` (over a view with the kit's row indices); then browser `history` 39 +
the other gates; then C5-BUILD.md + REPORT.
