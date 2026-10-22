# Common laws for every iteration 014 builder (Claude Sos, 2026-10-22)

You are an Opus builder in your own git worktree (isolation worktree). First:

    git reset --hard <BASE sha from research/iteration-014/PLAN.md>
    git checkout -b it014-<your-chain>

Read `research/iteration-014/PLAN.md` whole: Josh's prompt verbatim, THE ONE NEW LAW, "Where each item lives", your chain's rows, the ten
assumptions. Then the `CLAUDE.md` sections that touch your files (grep the file names). Do not read the whole research library.

Laws (standing, Josh's; one lifted):
- NO push, NO deploy, NO tag, NO release. Commit locally on your branch only; the integrator merges.
- **`lab/mir/**` MAY be edited in 014** (Josh 2026-10-22: "lift"), under the trickle-down rule: bump `lab/mir/version.js` (1.5.0-alpha.25, .26 …;
  never 1.6), one line per kit change at the TOP of `docs/FOR-MIR.md` under `## FROM λWAVES, FOR THE KIT (1.5.0-alpha.25+)` (what, file, why),
  keep the kit's own laws (words through `label()`/`t()` + the English pack; parts by class and `data-*`; `.glass` takes the look store).
  `lab/fonts/**` stays untouched.
- Josh's dial: "Keep the builds tight and don't bloat the code with random verification/gate codes. Just build the features since we are not even
  1.0.0 release yet." Simplify, don't add. Diagnostics live in `tools/`, not `lab/`.
- `lab/rack.js`'s `app` literal is never extended; `node tools/rack-deps.mjs --classes --no-write` stays green (HINGE ≤ 25; spectrum.js is AT 25).
- Renames are LABEL renames: saved keys, ids, modulation target ids, CSS hooks (`mol-*`, `reg-*`, `#lwMode`, the rack window id `transport`) stay.
- THE LOCK (`tools/perf/digest-lock.mjs`, the fixtures) is never re-baked. A new draw style is a NEW branch in the shader; the old leaves do not move.
- Never `pkill -f`. Stop only your own pids. Never touch servers 8721/8731/8735/8741/9241/9261/9491/8790/9651.
- **THE SOLVERS ARE RUNNING** (three pids in `~/Documents/LAMBDAWAVES-VOLUMES/raw/solver*.pid`, the babysitter `babysit/babysit-c7.pid`): never
  touch them, never start one, never write under `~/Documents/LAMBDAWAVES-VOLUMES/raw/` or `catalogue/` or `dist/`. A solver/pack/catalogue change
  is dry-run into a scratch dir (`solve.py --raw <scratch> --only <id>`, `LW_CATALOGUE=<scratch>`), ONE molecule, and written up.
- `~/Documents/OBSIDIAN/**` is read-only. The vault folder `for CODEX/` is read-only.
- Your own gate server: `python3 tools/gate/server.py <your worktree> <your port> &` — stop it by pid at the end. Browser suites:
  `LW_PORT=<port> GD_PORT=<your gd port> node tests/<suite>.browser-test.mjs`. Node suites: `./test.sh node`. Pictures through the suites' CDP
  helper or `tools/` probes into `research/iteration-014/<row>-shots/` (JPEG, small).
- Light verification: `./test.sh node`, the browser suites that read your files, ONE visual check per row (before/after where Josh asked for a look).
  Re-aim a test whose string you moved; never delete a law to pass it. wigner W42-8 flakes under load; re-run alone.
- One commit per row, message `<ROW> <NAME>: <one line>`, then the next row in the SAME worktree. Write `research/iteration-014/<ROW>-BUILD.md`
  per row (what changed, files, tests, the CLAUDE.md sentence to add, open questions for Josh). Under 60 lines each.
- `lab/sw.js` only via `node tests/pwa.test.mjs --write` when a file under `lab/` is added or changes bytes.
- Tokens are short on Josh's account: read what you need; no long explorations; no extra sub-agents.

Report at the end (and a partial report if you run short), in this exact shape:
worktree · branch · commits (sha + row) · tests (which, result) · kit version now · LOCK leaves moved (by name, or none) · blockers · next (unbuilt).
Under 40 lines.
