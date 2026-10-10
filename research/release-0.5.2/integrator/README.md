# The integrator's measuring scripts (0.5.2 · Rack Dissolution)

Each resolves the repo root from its own location, so either Major Agent runs them unchanged from any worktree (an explicit worktree path is the optional first argument).

- `doubles.mjs [worktree]` — every `app.<ns>.<x> =` across `lab/rack.js`, `lab/shell/`, `lab/windows/`; exit 1 if a slot is filled more than once (the merge recipe wants 0).
- `syntax-check.mjs [worktree]` — `node --check` on `rack.js` and every module file.
- `facade-names.mjs [worktree]` — the facade's names and where each is filled (R5's audit).
- `sb-compare.mjs <tree.json> <base.json>` — `tools/serialize-bytes.mjs --out` readings compared case by case (11/11 full + edit).
- `gen.mjs [outDir] [BRIEF-R5,BRIEF-R-V]` — fills `*.tpl.md` here from the live tree into `research/release-0.5.2/BRIEF-*.md` (every anchor, classes row and count measured, never typed).
- `../r2b-measure/rigfree.mjs` — exit 0 when the rig is free (no geckodriver, no marionette Firefox, load < 4).

Written by Claude Yan in her job's temp dir during PAIR 1–3; moved here by Claude Sos on 2026-10-10 so the other account need not find and re-aim them.
