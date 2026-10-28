# Common laws for every iteration 022 builder (Claude Sos, 2026-10-27)

You are an Opus builder in your own git worktree (isolation worktree). First:

    git reset --hard <BASE sha from the CLOSED table of research/iteration-022/PLAN.md>
    git checkout -b it022-<your-chain>

Read `research/iteration-022/PLAN.md` whole (Josh's prompt verbatim, THE LAWS OF 020, your chain's rows, the calls), then RESEARCH-T-TOOLS.md §2 (INTENT.md and the relief tokens) and RESEARCH-U-CENSUS.md's sections your chain cites (file:line at d627b32 before chain V landed; grep the symbol) (file:line exact at aaf54b6; grep the symbol after that; trust them over a fresh exploration).
Then the `CLAUDE.md` paragraphs that touch your files (grep the file names). Do not read the whole research library.

THE MACHINE: the night run c8 is rendering the VOLUME's five looks in one Firefox on the GPU (its gate 9651, geckodriver 5651, pids in `~/Documents/LAMBDAWAVES-VOLUMES/babysit/`) — never touch its pids or its ports; never write under `~/Documents/LAMBDAWAVES-VOLUMES/`. Josh is AWAY (he returns for 023): every call runs at its default; no question blocks a row. Josh's port 9261 serves the integrator's tree; never touch it. Josh is at the machine this evening (his port 9261 serves the integrator's tree; never touch it). The CPU is free: run suites normally, but keep ONE browser of your own at a time and no screenshots in bulk (headless WebGPU shares the card).

Laws (standing, Josh's):
- NO push, NO deploy, NO tag, NO release. Commit locally on your branch only; the integrator merges.
- THE KIT SENTENCE (CLAUDE.md:6, since chain K): THE KIT IS 1.5.5 AND THE APP ONLY ADDS DOORS: lab/mir is written by adopt.mjs alone; a λWAVES need becomes an additive door numbered 1.5.6-alpha.N with its FOR-MIR line; a removal waits for a line; `node <MIR>/tools/adopt.mjs . --check` says in step. A door is built in a MIR worktree on the kit's
  own laws (words through `label()`/`t()` + the English pack; parts by class and `data-*`; `.glass` takes the look store), versioned
  `1.5.6-alpha.N`, then adopted (`MIR-MANIFEST.json` + its pin in `tests/mir-manifest.test.mjs`); `tools/mir-manifest.py` is retired (021 K4).
  `lab/fonts/**` stays untouched.
- Josh's dial: "Keep the builds tight and don't bloat the code with random verification/gate codes. Just build the features since we are not even
  1.0.0 release yet." Fix, simplify, don't add. Diagnostics live in `tools/`, not `lab/`.
- `lab/rack.js`'s `app` literal is never extended; `node tools/rack-deps.mjs --classes --no-write` stays green (HINGE ≤ 25; spectrum.js is AT 25).
- Renames are LABEL renames: saved keys, ids, modulation target ids, CSS hooks (`mol-*`, `reg-*`, `#lwMode`, the rack window id `transport`) stay.
  Every stored key keeps its scope (`docs/STATE-SCOPES.md`): a project open leaves `lambdawaves.q0.settings` byte-identical outside WORKSPACE.
- THE LOCK (`tools/perf/digest-lock.mjs`, the fixtures) is never re-baked; a leaf that moved is re-captured BY NAME and said in the BUILD note.
- Never `pkill -f`. Stop only your own pids. Never touch servers 8721/8731/8735/8741/9241/9261/9491/8790/9651.
- `~/Documents/OBSIDIAN/**` is read-only. The vault folder `for CODEX/` is read-only. Notes for Josh go in the BUILD note, not in his vault.
- Your own gate server: `python3 tools/gate/server.py <your worktree> <your port> &` — stop it by pid at the end. Browser suites:
  `nice -n 10 env LW_PORT=<port> GD_PORT=<your gd port> node tests/<suite>.browser-test.mjs`. Pictures through the suites' CDP helper or `tools/`
  probes into `research/iteration-022/<CHAIN>-shots/` (JPEG, small, few).
- Light verification: the suites that read your files, ONE visual check per row (before/after where the plan asks for a look). Re-aim a test whose
  string you moved; never delete a law to pass it. wigner W42-8 flakes under load; re-run alone.
- One commit per row, message `<ROW> <NAME>: <one line>`, then the next row in the SAME worktree. Write `research/iteration-022/<CHAIN>-BUILD.md`
  (what changed, files, tests, the CLAUDE.md sentence to add, open questions for Josh). Under 80 lines.
- `lab/sw.js` only via `node tests/pwa.test.mjs --write` when a file under `lab/` is added or changes bytes.
- Tokens: read what you need; no long explorations; no sub-agents.

Report at the end (and a partial report if you run short), in this exact shape:
worktree · branch · commits (sha + row) · tests (which, result) · kit version now · LOCK leaves moved (by name, or none) · blockers · next (unbuilt).
Under 40 lines.
