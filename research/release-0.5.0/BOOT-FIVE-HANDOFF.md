# BOOT-FIVE hand-off (done, 2026-10-09)

Worktree `.claude/worktrees/agent-a02df547124e9823f`, branch `worktree-agent-a02df547124e9823f`, from `b9e0c57` (yan-c). Two tracked
files change: `tests/legacy/boot.browser-test.mjs` and `research/release-0.5.0/LEGACY-BOOT-REAIM.md` (§10, which carries the whole
account). Nothing under `lab/`.

State: B66, B84, B108, B127 and B134 are re-aimed and GREEN in a full run alone (152 verdicts, 147 green, 5 red: B70 B71 B78 B139
B149; `.tmp/boot-2.txt`). `bash test.sh node` exits 0 (940 PASS, 0 red). The baseline on the tip before the edits was 152 / 143 / 9.

Open for the integrator: **B139 is still red in the full run** (FIX ROUND 1 fixed REFRACTIVE only; B112 leaves the card TINTED, and the
kit's `skin.css:512` thins a tinted pane while it blurs and restores it during the hold, `.58` to `.84`). One unlayered `lab/skin.css`
line keeps it at `.58`, verified in the live page: `body.frost.frost-hold[data-card="tinted"] { --card-opacity: var(--frost-opacity); }`
(`.tmp/p-b139.js`). Not applied: `lab/` is outside this task. B149 is a MIR brief candidate (B149b); B70, B71 and the BOW half of B78 are
pre-existing.
