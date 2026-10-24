# Iteration 015 (Claude Yan, 2026-10-23) — what every builder of chains M · T · H · S · W reads first

Base: `yan-c` @ the commit that adds this briefs/ folder (`git log -1 -- research/iteration-015/briefs` in the main worktree
`/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/optimization-2026-09-24`). From your worktree: `git reset --hard <that sha>` then
`git checkout -b it015-<chain>` (m · t · h · s · w).
Read `research/iteration-014/BRIEF-COMMON.md` (the standing laws), then `research/iteration-015/PLAN.md` WHOLE (Josh's prompt verbatim,
"Where each item lives" — three scouts' file:line facts, so you need not re-scout — YOUR chain's rows, the assumptions, the calls), then the
CLAUDE.md paragraphs that name your files. Do not read the whole research library.

THE KIT MOVES HERE: `lab/mir/**` may be edited. Every kit edit (a) sets `lab/mir/version.js` to 1.5.0-alpha.26 (once; never 1.6), (b) adds one
line at the top of `docs/FOR-MIR.md` under a new heading `## FROM λWAVES, FOR THE KIT (1.5.0-alpha.26)` (create it above the alpha.25 section
if it is not there yet; the merge combines both sides), (c) keeps the kit's laws (words through `label()`/`t()` + `lab/mir/locales/en.json`;
parts by class and `data-*`; `.glass` panes take the look store), (d) re-hashes `MIR-MANIFEST.json` with
`python3 -I ~/.claude/jobs/2ea66c54/tmp/manifest.py` run from your worktree root (it pins the sha in `tests/mir-manifest.test.mjs`).
`lab/fonts/**` untouched.

Laws for this launch:
- THE SOLVERS ARE RUNNING (three PySCF pids + `babysit/babysit-c7.sh`, Josh's; the GPU reads 100 % for them): never touch them or
  `~/Documents/LAMBDAWAVES-VOLUMES/raw/`, `catalogue/`, `dist/` (the dev `lab/volumes` symlink POINTS AT dist — never write through it). A
  pack / catalogue change is dry-run into a scratch dir and written up. No timing number is a gate; a flaking browser suite is re-run alone
  (wigner W42-8, frame-occlusion's detached-gap row, chem L7, library's "store created at boot" are known).
- THE LOCK (`tools/perf/digest-lock.mjs`; 843 with `--check --query gastab=0`, 987 with `--fixture research/release-0.4.0/measure/digest-lock-s4a.json`):
  chain W runs it once at the end to prove NO leaf moved; a moved leaf is a STOP — report, never `--write`. The RTX 3070 can fault one ulp in
  power state P5: re-run alone before believing a divergence.
- `lab/rack.js`'s `app` literal is never extended; `node tools/rack-deps.mjs --classes --no-write` stays green (HINGE ≤ 25; spectrum.js is AT
  25 — chain S moves a reader only through `app.w` / `app.sh` slots it already has, or through the module's own file).
- Own gate server: `python3 tools/gate/server.py <worktree> <your port> &`, stopped by pid at the end. Never `pkill -f`. Never touch
  8721/8731/8735/8741/9241/9261/9491/8790/9651 or the other builders' ports (M 9591 · T 9601 · H 9611 · S 9621 · W 9631; GD 5291 · 5301 · 5311 ·
  5321 · 5331). Browser laws: `tests/*.browser-test.mjs` with `LW_PORT=<yours>`; the gate `./test.sh node`; `node tests/pwa.test.mjs --write`
  is the only writer of `lab/sw.js`.
- Headed pictures: `tools/gate/` has the headed-Chromium road the 014 builders used (read research/iteration-014/B3-BUILD.md's "shots" lines);
  one small JPEG per visual row in `research/iteration-015/<chain>-shots/`.
- One commit per row `<ROW> <NAME>: <one line>`, `research/iteration-015/<ROW>-BUILD.md` under 60 lines (what, files, tests, the CLAUDE.md
  sentence to add, calls for Josh). Josh's dial: build the feature, no gate code in `lab/`; simplify, don't add; keep positions fixed (the hand
  law). No sub-agents unless your brief names one. Report at the end in this shape, under 40 lines: worktree · branch · commits (sha + row) ·
  tests (which, result) · kit version · LOCK (W: the two counts; others: not run) · blockers · next (unbuilt) · calls for Josh.
