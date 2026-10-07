# λWAVES 0.4.0 · S0 CANARY — BRIEF for the MIR 1.5 canary

**Written by Fable, 2026-10-07.** `PLAN.md` §3 **B0.5 THE CANARY**: a throwaway worktree takes a REAL MIR 1.5 adoption
from the pin, boots, and logs ONE row of what went red. Its red rows decide which seams enter 0.4.0 and turn 0.5.0's
adoption into a diff of known deltas. **Nothing from the adoption is ever merged** — only the log comes back.

## 0 · Laws

- Your worktree is the canary (the plan calls it `canary-1.5`; yours has the harness's name — record the real path).
  The adoption's edits to `lab/mir/**`, `lab/fonts/**` and `MIR-MANIFEST.json` are the ONE sanctioned exception to "never
  edit lab/mir", because this tree is thrown away. You never hand-edit those files.
- Never `pkill -f`; kill by pid. Git only inside your worktree; never push.
- The RTX 3070 is shared: browser suites one at a time, on YOUR ports: `LW_PORT=8737`, `GD_PORT=5207`. Gate server:
  `python3 tools/gate/server.py <your-root> 8737 &` (ready when it prints `λWAVES gate server on …`).
- One pass. You are not fixing anything. A red suite is a ROW, not a task. Don't over-verify (Josh 10-01).

## 1 · Read first (ten minutes)

- `research/release-0.4.0/survey/MIR-1.5.md` — the seams, BASINS' adoption map, the 15 risks R1–R15. Your rows cite the
  risk each red confirms or refutes.
- The pin's adopter guide: `/home/joshua-hosain/Documents/MIR/.claude/worktrees/mir-1.5-pin/docs/ADOPTING-1.5.md` (and
  `docs/LINES.md` there for `--line`). The pin is MIR `1.5.0-alpha.23` (`0f5c7f9`); record both.
- `CLAUDE.md` here: the adoption law (adopt via the tool, never by hand).

## 2 · The run

1. Baseline on the UNTOUCHED tree, so the deltas are deltas: `bash test.sh node` (count, reds), and the precache bytes
   (sum the files `lab/sw.js` precaches — a one-off script in your job tmp). Save the output under
   `research/release-0.4.0/canary/00-baseline.log`.
2. **The real adopt**: `node /home/joshua-hosain/Documents/MIR/.claude/worktrees/mir-1.5-pin/tools/adopt.mjs <your-root> --line 1.5`
   (a dry run writes nothing — this is NOT a dry run). If `--line` is refused by that adopt.mjs, run it without and
   record the exact usage line it printed. Record what it wrote: `git status --short | wc -l`, the files added, removed,
   changed under `lab/mir`, `lab/fonts`, and the new `MIR-MANIFEST.json` version. Save `git diff --stat` to
   `canary/01-adopt.log`.
3. `node tests/pwa.test.mjs --write` → the precache bytes after (the delta is a row).
4. `bash test.sh node` → every red suite with its first assertion message (`canary/02-node.log`).
5. Browser, one at a time on 8737/5207: `tests/frame-occlusion.browser-test.mjs`, `tests/history.browser-test.mjs`,
   `tests/new-project.browser-test.mjs` (`canary/03-browser.log`). If the app does not BOOT (the gate's first scene fails
   to reach `ready`), that is the headline row — record the console's first error and stop the browser part there.
6. The stylehash delta: find the tool (`grep -rln -i stylehash tools tests docs` here; else the pin's
   `tools/check-app.mjs` / `tools/audit-material.mjs`; `docs/OPTIMIZATION-2026-09-24.md` names the "README recipe,
   `--gpu 1`"). Run it before (step 1, if you found it in time) and after; record elements/pixels changed. If no tool
   runs within twenty minutes, record "stylehash: no runnable recipe found; <what you tried>" and move on.
7. **Revert the adoption in your worktree** so only the log is committed: `git checkout -- .` then `git clean -fd lab`
   (the adopt adds new kit files, e.g. `lab/mir/info/`). Write your log files AFTER the revert (or keep them in job tmp
   until then). `git status --short` must then show only your new files.

## 3 · The deliverable

`docs/MIR-1.5-CANARY.md` — a header (what the canary is, when it runs: now on alpha.23 and once more at the `1.5.0` cut,
never per alpha) and ONE table row per run:

| date | pin | files added/removed/changed | boots? | node reds (suite: first message) | browser reds | stylehash Δ | precache bytes before → after | risks confirmed (R#) | risks refuted |

followed by a short "what the reds mean" list, each red mapped to the ADOPTING-1.5.md entry or the survey's risk it
belongs to (e.g. "`tests/mir-manifest` red = expected: the manifest is 1.5.0-alpha.23; `wiring` red on `data-ink` = R7").
Raw logs under `research/release-0.4.0/canary/`. Commit these on your worktree's branch (the doc + the logs; nothing
under `lab/`). Final message: the row, in words, in ten lines; the commit sha; your worktree path. Kill your gate server
by pid.

## 4 · Harness notes

Compound shell with variables, loops, heredocs or backticks is refused: plain separate commands; scripts as files in
your job tmp. If a command is refused, reshape it; never retry verbatim.
