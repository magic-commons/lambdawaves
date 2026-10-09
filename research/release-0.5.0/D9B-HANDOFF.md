# D9b · H₂ AND ELECTROSTATICS GO — HANDOFF (live state; updated after every commit)

- worktree: `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-aba28140791c56025`
- branch: `worktree-agent-aba28140791c56025`, reset to `c83b7ee` (the `sos-s0` tip: stage C merged + D9, PLAN §9 with the 10-09
  rulings); never pushed, never merged
- base `lab/*.js` = **29,863**; `bash test.sh node` GREEN on the base (exit 0, **82** suites)
- ports: gate server `LW_PORT=8903` (every server I started was stopped by its pid), geckodriver `GD_PORT=5373`. No browser of
  mine is open, and 8903/5373 are free.

## State — DONE; the build hand-off is `research/release-0.5.0/D9B-BUILD.md`

1. `822acff` — fixtures: `tests/fixtures/legacy-h2.lambdawaves.json` (H₂ owns the field, singlet R = 1.4, seat open) and
   `legacy-electrostatics.lambdawaves.json` ((1s + 2p_z)/√2, Φ overlay on, 12 levels, seat open). Both were written by the
   pre-D9b build through `.tmp/make-legacy-fixtures-d9b.mjs` (not committed: it drives the deleted `__LW.h2` /
   `__LW.fieldlines`).
2. `9ebf35c` — H₂ deleted (−274). `83e9def` hand-off (`history` 43/43 on that tree).
3. `1012497` — ELECTROSTATICS deleted (−740). `fa8e7ab` hand-off.
4. `b71022c` — the lock's counts in its header; CLAUDE.md's legacy paragraph; `docs/LEGACY-WINDOWS.md`; `docs/STATE-SCOPES.md`.
5. `4f0a828` the ledger commit (and a one-line wording fix after it) — `D9B-BUILD.md`, this file, `D9B-rack.patch` (every rack.js hunk for C3's re-apply), REPORT.md wave 207.

`lab/*.js` **29,863 → 28,849 (−1,014; −951 without the 63 lines moved to `tests/lib/`)**. Node: exit 0, **80** suites.
The lock, ALONE: **860 · 0/0** and **1004 · 0/0** (s4a).
Browser: `history` 44/44, `new-project` 8/8, `molecule-demos` 5/5, `molecular-names` 6/6, `render-regressions` 2/2,
`offer` 16/16. `current` is 15/15 with `followsPalette` set aside; that case is red on the base `c83b7ee` too.
Film probe: all steps pass, and the base-copy pixel lock is identical.

## Next

The integrator merges `worktree-agent-aba28140791c56025` into `sos-s0`. Re-apply the rack.js hunks from `D9B-rack.patch` if C3
moved the blocks. Then run `node tools/new-project.mjs` and its `--check`, `node tests/pwa.test.mjs --write`,
`bash test.sh node`, the browser gates, and the lock ALONE.
