# C6 · HAND-OFF (final, the continuation builder, 2026-10-09)

| | |
|---|---|
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a535a978caceb2b07` |
| branch | `worktree-agent-a535a978caceb2b07`, reset to `9da702d` (the first builder's tip on `worktree-agent-a61a67e5a1ec8eb66`, from `f0fcbc4`) |
| ports | 8893 / 5363 (this tree) · 8897 / 5367 (the base copy at `.tmp/base` = `f0fcbc4`, gitignored) |
| servers | 8893 (pid 4170599) and 8897 (pid 5936) were started by me and stopped by pid; no browser is left open |
| the whole story | `research/release-0.5.0/C6-BUILD.md` (and REPORT.md wave 206) |

## Commits (on `9da702d`)

| sha | what |
|---|---|
| `7fc6f04` | FOLDERS over the one part: rack.js wired to `createProjects`; `project-storage.js` + `project-import.js` + the PROJECTS face + `.pj-*` CSS out; the two todos; every test/tool site edited (the `__LW` law) |
| `9b4bbe6` | hand-off |
| `942a2fc` | `tools/serialize-bytes.mjs` + `research/release-0.5.0/c6-serialize-bytes.json` — **11/11 byte-identical**, base vs tree |
| `60662e8` | hand-off |
| `6166fa4` | the R10 suite: `tests/project-formats.test.mjs` (8 lines) + `tests/project-formats.browser-test.mjs` |
| `4cc311c` | hand-off |
| `83fe811` | FOLDERS is painted glass where it lands (the occlusion block re-taken when its entrance motion ends; browser case 5) |
| `9fc50eb` | hand-off |
| `4dd0a7b` | docs: `C6-BUILD.md`, REPORT.md wave 206 |
| this | the final hand-off |

**Merge this tip, never `b6d61ec`** (the WIP modules, unwired).

## Tests (final tree)

| suite | result |
|---|---|
| `bash test.sh node` | exit 0, **81 suites** |
| `new-project` | **8/8** (three runs) |
| `history` | **42/42** (twice) |
| `offer` | **16/16** (twice) |
| `molecule-demos` | **5/5** |
| `project-formats` node / browser | **8** judged lines / **5/5** |
| `tools/serialize-bytes.mjs` | **11/11 identical** (4 demos + the empty project + 6 history snapshots; full and edit scope) |
| `hit-probe-set` | **49 gap presses, 0 reached** (FOLDERS and its rail are scenes) |
| `node tools/new-project.mjs --check` | in step (16,329 B; the empty project did not move) |
| `tools/settings-probe.mjs` | 0 of 6 RED (re-run alone: the first run's WATER open hit the 3 s rAF watchdog) |
| `menubar` 8 · `latex-copy` · `take-in-bugs` 4 · `stage-text` 4 · `frame-occlusion` 7 · `current` 15 | green (`current` re-run alone: case 10 is timing-bound, red on base under load too) |

## Lines

`cat lab/*.js | wc -l`: **30,553 → 30,844 (+291)**: rack.js −94, projects.js +271, project-store.js +165, project-storage.js −25,
project-import.js −41, sw.js +13, settings-store.js +2. The design said ≈ +50; the two modules are 436 lines against 220.

## Blockers

None. No digest lock was run (C7's is the one lock of C).

## Exact next step

1. Claude Sos merges `worktree-agent-a535a978caceb2b07` (this tip) into `sos-s0`, then runs `node tests/pwa.test.mjs --write`,
   `bash test.sh node`, `new-project`, `history`, `offer`, `molecule-demos`, `project-formats.browser-test` and `hit-probe-set`.
   - If C2 or C3 landed first, run `tools/serialize-bytes.mjs` on the pre-merge tip and on the merge: the eleven shas must agree.
   - `lab/sw.js`: take either side, then `pwa --write`.
2. Then BRIEF-C6 §4 step 3, from the merge (C6-BUILD.md § Exact next step has the list):
   - the part's `subscribe`;
   - `createSession({ key: 'lambdawaves.q0.session' })`;
   - `createOpener` with the kit's photosensitivity notice;
   - `installBanner`, `bootVeil`, `installWakeLock`;
   - closers: `offer` 16, `legacy/boot`, `gpu-recovery`.
