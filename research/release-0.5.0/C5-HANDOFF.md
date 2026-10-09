# C5 · HANDOFF (history as the one `edit` domain) — live state, rewritten after every commit

- worktree: `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a1a6731f62408d489`
- branch: `worktree-agent-a1a6731f62408d489`, reset to `7044f37` (the `sos-s0` tip)
- `lab/*.js` before: **36,288** · now **36,355** (this includes `lab/sw.js` growing with the adopt's precache entries;
  compute C5's own delta as rack.js + edit-domain.js − history.js, see below)
- **PAUSED by a usage alarm (five-hour limit 98 %) at `d22ffb9`.** Gate server on 8803 stopped.

## Commits

1. `e5944bc` — the bare adopt of MIR 1.5 alpha.24 (`adopt.mjs --line 1.5`; 196 added, 23 updated, 0 removed, 43 unchanged;
   `pwa --write` 372 entries). Identical to C0's.
2. `13f5d81` — hand-off opened.
3. `15d599c` — first wiring: the kit's `createHistory` + a facade inside rack.js. **history browser 39/39** (8803/5273, alone):
   flush 0.32 ms median, undo max 108 ms (modulation), HISTORY UNDO restores 61 rows, MOLECULES ON one row with its fill.
4. `54c94e0` — hand-off.
5. `f52dbb0` — **`lab/history.js` deleted** (187). The facade moved out of rack.js into **`lab/edit-domain.js`**
   (`createEditHistory`, the old ring's port `{read, write, liveKey, driven, depth, quiet, onChange}`, over the kit's
   `createHistory` with ONE domain `edit`; laws K1–K9 in its header). rack.js back to its 0.4.0 shape (+4/−3 vs `7044f37`).
   `tests/history.test.mjs` re-aimed (import line + 2 comment lines): **node 18/18 GREEN**. CLAUDE.md's undo-ring path updated.
6. `1cd5c6b` — hand-off.
7. `d22ffb9` — **WIP, UNVERIFIED IN THE BROWSER**: the card's own list/renderHistory/histHere/UNDO/REDO/status leave; the card
   is a `device` holding the kit's `historyList` (import added at rack.js:77) over a view in the kit's row numbers; HISTORY
   UNDO + CLEAR stay λWAVES' trigs. rack.js vs `7044f37`: +18/−48. Parses; `pwa --write` done.

## The kit object as used

`createHistory({ limit: 60, quiet: 400, timers })` → `register('edit', {read, write, key})`, `note/hold/release/label/flush/
undo/redo/goto/clear/record/absorb/entries/subscribe`, getters `canUndo canRedo cursor length bytes maxBytes limit applying
holding pendingLabel`. `history.clear(label)` is the kit's own (exists; no brief needed). `__LW.history` = `historyApi`
(unchanged members) over `history` = the `createEditHistory` facade.

## Brief candidates (the kit's stack lacks; kept in `lab/edit-domain.js`)

K1 drive = one gesture (`driven`) · K2 undo/redo/jump/press commit an unannounced edit · K3 goto is one write (kit walks
writing every row) · K4 HISTORY UNDO branch · K5 `absorb(fn)` re-keys the current row (kit's absorb only re-baselines) ·
K6 bottom row named for the dropped row · K7 'edit'/'start' labels and 0-based state index (kit EDIT/START, −1) ·
K8 canUndo/depth count a pending edit · K9 a gesture's name waits one quiet window (touch click after release) and label()
waits for its action. Blocks of the 39 that needed them: drive (K1), depth/HISTORY UNDO (K3 K4 K6 K7), MOLECULES (K5),
names (K7), card (K7). Not one block was kept on the old ring; all 39 passed at `15d599c`.

## Node after the adopt (85 suites)

Red = `mir-manifest` (alpha.24 not in ACCEPTED), `new-project` (--check out of step), `wiring` (unreached kit files),
`pwa` (absolute URL in `lab/mir/shell/gui.js`) — all C0's cascade. `history.test` GREEN 18/18 on `f52dbb0`.

## Exact next step

1. `python3 tools/gate/server.py <worktree> 8803` (background), then
   `LW_PORT=8803 GD_PORT=5273 node tests/history.browser-test.mjs` ALONE — the gate is 39/39 on `d22ffb9`.
   If block 2 (the card) reds, suspect the view's `i − 1` mapping or `histShown` → `hList.paint()`.
2. Then `new-project` 8, `take-in-bugs`, `mir-controls`, `render-regressions`, `menubar` (its CLEAR probe), each alone,
   4 s apart; `bash test.sh node` (list C0's reds); `node tools/new-project.mjs --check` (C0's red).
3. Count: `cat lab/*.js | wc -l`; C5's own delta = −187 (history.js) + edit-domain.js lines + rack.js (+18/−48 incl. the
   import) — state sw.js's adopt growth separately.
4. Write `C5-BUILD.md` (shape of `A7-BUILD.md`) and the REPORT section `## 2026-10-08 · 0.5.0 C — THE ADOPTION` /
   `### wave 198: C5 HISTORY AS THE ONE EDIT DOMAIN — …`; commit.
