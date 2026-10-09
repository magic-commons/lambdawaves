# C6 · HAND-OFF (kept current after every commit)

| | |
|---|---|
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a61a67e5a1ec8eb66` |
| branch | `worktree-agent-a61a67e5a1ec8eb66` (reset to `f0fcbc4`, the `yan-c` tip with C0 C1 C4 C5 C9 D9) |
| ports | 8893 / 5363 (this tree) · 8897 / 5367 (the base copy `.tmp/base`) |

## Commits

1. `0.5.0 C6 · the design hand-off` — `research/release-0.5.0/C6-DESIGN.md` (no lab/ code)

## Tests

- none run yet (design only). Node gate at launch: green per the integrator.

## Blockers

- none.

## Exact next step

- Commit 2: `lab/projects.js` (the translator, the file parse with 8 MiB, the starters, `createProjects` = FOLDERS + the facade).
- In rack.js: the PROJECTS block → the one part + `createProjects`.
- index.html/lab.css: the PROJECTS face leaves.
- Delete `project-storage.js` / `project-import.js`.
- `node tests/pwa.test.mjs --write`.
- Then `tools/serialize-bytes.mjs` against the base copy, `molecule-demos`, `new-project`, `history`.
