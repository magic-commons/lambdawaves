# BOOT-FIVE hand-off (WIP after step 2, 2026-10-09)

Worktree `.claude/worktrees/agent-a02df547124e9823f`, branch `worktree-agent-a02df547124e9823f`, from `b9e0c57` (yan-c). Only
`tests/legacy/boot.browser-test.mjs` and the two files under `research/release-0.5.0/` change. Nothing under `lab/`.

State at this commit: the five rows are re-aimed and each is GREEN alone on the tip (B66 + B108 `.tmp/c-b66-108.txt`, B127
`.tmp/c-b127.txt`, B134 `.tmp/c-b134.txt`, B84 three runs, `armed` landing at hide + 999 ms and at hide + 2007 ms, both green).
Baseline full run on the tip BEFORE the edits (`.tmp/boot-1.txt`): 152 verdicts, 143 green, 9 red (B66 B70 B71 B78 B108 B127 B134
B139 B149); B84 was green there and red in the detailed re-run (`.tmp/boot-1f.txt`, 10 of 151).

Next step: the second full run (`.tmp/boot-2.txt`), then `bash test.sh node`, then finish `LEGACY-BOOT-REAIM.md` §10 and commit.
Servers (stop by pid): 8963 = this tree (`.tmp/server.pid`), 8967 = the pre-C7b export (`.tmp/server-pre.pid`).

Finding for the integrator, NOT a row of this task: **B139 stays RED in the full run on the merged tree.** FIX ROUND 1 fixed the
REFRACTIVE card (green alone: its chunk reads `.1` throughout). B112 (line 4795) leaves the card style TINTED in the look store, so
the full run measures B139 under TINTED + dark + DISCONNECTED: the held body goes `rgba(28,32,38,.58)` to `.84`. The cause is the
kit's `lab/mir/css/skin.css:512`, `body.frost:not(.frost-hold)[data-card="tinted"] { --card-opacity: var(--frost-opacity) }` (thin
while blurring, full during the hold). A probe injecting the one unlayered rule
`body.frost.frost-hold[data-card="tinted"] { --card-opacity: var(--frost-opacity); }` keeps `.58` stopped and playing
(`.tmp/p-b139.js`). It is a `lab/skin.css` line, so it is the integrator's call.
