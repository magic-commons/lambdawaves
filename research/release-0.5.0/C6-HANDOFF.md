# C6 · HAND-OFF (the continuation, 2026-10-09)

| | |
|---|---|
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a535a978caceb2b07` |
| branch | `worktree-agent-a535a978caceb2b07`, reset to `9da702d` (the first builder's tip on `worktree-agent-a61a67e5a1ec8eb66`, from `f0fcbc4`) |
| ports | 8893 / 5363 (this tree) · 8897 / 5367 (the base copy at `.tmp/base` = `f0fcbc4`, gitignored) |
| servers | 8893 pid 4170599, 8897 pid 5936 (started by this builder; stop by pid) |

## Commits (this builder)

1. `7fc6f04` — `0.5.0 C6 · FOLDERS over the one part`: rack.js wired to `createProjects`; `project-storage.js`, `project-import.js`,
   their two suites, the `.nb-projectsface` markup and the `.pj-*` CSS leave; the two todos fixed; every test and tool that pressed
   `.pj-demo` or read `.pj-status` edited in the same commit (the `__LW` law).
2. `9b4bbe6` — hand-off.
3. `942a2fc` — `the serialize-bytes probe`: `tools/serialize-bytes.mjs`, 11 of 11 readings byte-identical base vs tree
   (`research/release-0.5.0/c6-serialize-bytes.json`).
4. `60662e8` — hand-off.
5. `6166fa4` — `the R10 fixture suite`: `tests/project-formats.test.mjs` (node, 8 judged lines) +
   `tests/project-formats.browser-test.mjs` (4/4, where the store is live).
6. `4cc311c` — hand-off.
7. `83fe811` — `FOLDERS is painted glass where it lands`: the occlusion block is taken again when FOLDERS' entrance motion
   ends (paused, it kept a mid-entrance rect, 12 px short at the top); `project-formats.browser-test` case 5 pins it (5/5).
8. this hand-off commit.

The first builder's commits: `443332e` (C6-DESIGN.md), `b6d61ec` (the two modules, WIP), `9da702d` (its hand-off).

## Where things stand

- **The part** (rack.js notebook block): `{ capture(name) → { data: projectSnapshot(), notebook: { title, subtitle, text } },
  restore(v, ctx) → restore(v.data, { project: true }) or THROW, then the notebook put back (debounce dropped, NB keys written),
  signature: projectKey }`. No `subscribe` (FOLDERS draws no head, so nothing repaints a mark; the session will need one).
- **The facade** (`lab/projects.js`) keeps every old verb and adds `demo(file)`, `download()`, `pick()`, `seed()`, `status`, `folders`.
- **Races closed**: a tell's skip is a token per call; FOLDERS' clean mark is put back to the facade's when the telling ends (no
  pin over the caller's synchronous code — `current` 4 caught that); a thumbnail write naming an old `at` keeps the newer payload;
  `store.stale()` re-reads the kit's cached library after a write by another road of this tab.
- **Pictures** are taken only while FOLDERS is open (and once when it opens over a clean current project without one): the first
  picture runs capture's readability probe (a video + 400 ms of MediaRecorder), which disturbed `current` case 10's timing.

## Tests (this tree, 8893/5363)

| suite | result |
|---|---|
| `bash test.sh node` | exit 0, 81 suites (82 − project-storage − project-import + project-formats) |
| `new-project` | 8/8 |
| `history` | 42/42 |
| `molecule-demos` | 5/5 |
| `offer` | 16/16 |
| `menubar` | 8/8 · `latex-copy` green · `take-in-bugs` 4/4 · `stage-text` 4/4 |
| `current` | 15/15 on the alone re-run. Case 10 (audio face) reads CSS 250 ms after a change; red twice here and once on BASE under the same load (frame gaps 100–200 ms on the shared GPU) — a timing red, not C6 |
| `hit-probe-set` | 49 gap presses, 0 reached the stage (FOLDERS and its rail are scenes) |
| `project-formats` (node) | 8 judged lines GREEN (a1–a5 · a6 · a7 · b1 · b2 · b3–b4 · c · the unsaved mark), ~4 s |
| `project-formats.browser-test` | 5/5 (read-only in the page · the door · R-I3 first half · a 1.4 notebook is page 0 · FOLDERS is painted glass) |
| re-run on the committed tree | `new-project` 8/8 (twice), `history` 42/42, `molecule-demos` 5/5, `offer` 16/16, `frame-occlusion` 7/7 |
| `node tools/new-project.mjs --check` | in step (16329 B) — the empty project's bytes did not move |
| `tools/settings-probe.mjs` | 0 of 6 RED (its first run's WATER open hit the 3 s rAF watchdog on the shared GPU; alone, green) |
| the first FOLDERS picture | 1,029 ms (capture's probe), worst frame gap 102 ms; later pictures 33 ms, gap 18 ms (`.tmp/thumbgap.mjs`, not committed) |
| `tools/serialize-bytes.mjs` | **11/11 identical**, full and edit scope: 4 demos + the empty project + 6 history snapshots, base 8897 vs tree 8893 |

## Lines

`cat lab/*.js | wc -l`: 30,553 at `f0fcbc4` → 30,906 at the WIP tip → 30,842 at `7fc6f04` → **30,844** at `83fe811` (+291: rack.js −94,
projects.js +271, project-store.js +165, project-storage.js −25, project-import.js −41, sw.js +13, settings-store.js +2).

## Blockers

None.

## Exact next step

1. ~~The byte-identity probe~~ done (`942a2fc`).
2. ~~The R10 fixture suite~~ done (`6166fa4`). 3. ~~`--check`, settings-probe~~ done.
4. Lines, REPORT wave 206, `C6-BUILD.md`, the CLAUDE.md paragraph, the final hand-off. Then (if time) BRIEF-C6 §4 step 3: the session,
   the opener, the banner, the veil, the wake lock.
