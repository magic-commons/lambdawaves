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
2. this hand-off commit.

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
| `bash test.sh node` | exit 0, 80 suites (82 − project-storage − project-import) |
| `new-project` | 8/8 |
| `history` | 42/42 |
| `molecule-demos` | 5/5 |
| `offer` | 16/16 |
| `menubar` | 8/8 · `latex-copy` green · `take-in-bugs` 4/4 · `stage-text` 4/4 |
| `current` | 15/15 on the alone re-run. Case 10 (audio face) reads CSS 250 ms after a change; red twice here and once on BASE under the same load (frame gaps 100–200 ms on the shared GPU) — a timing red, not C6 |
| `hit-probe-set` | 49 gap presses, 0 reached the stage (FOLDERS and its rail are scenes) |

## Lines

`cat lab/*.js | wc -l`: 30,553 at `f0fcbc4` → 30,906 at the WIP tip → **30,842** at `7fc6f04`.

## Blockers

None.

## Exact next step

1. The byte-identity probe `tools/serialize-bytes.mjs` (from `tools/settings-probe.mjs`'s pattern): `serialize()` bytes on the 4 demos
   + the empty project + 6 history snapshots, base (8897) vs tree (8893); commit its output under `research/release-0.5.0/`.
2. The R10 fixture suite `tests/project-formats.test.mjs` (node: C6-DESIGN §7 a1–a7, b1–b4, c1) + a browser case for the live store.
3. `node tools/new-project.mjs --check`; `tools/settings-probe.mjs` zero RED.
4. Lines, REPORT wave 206, `C6-BUILD.md`, the CLAUDE.md paragraph, the final hand-off. Then (if time) BRIEF-C6 §4 step 3: the session,
   the opener, the banner, the veil, the wake lock.
