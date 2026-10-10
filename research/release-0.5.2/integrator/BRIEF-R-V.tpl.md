# BRIEF R-V · THE VERIFICATION ROUND (0.5.2 "Rack Dissolution"; a FRESH Opus verifier — reads, measures, judges; fixes nothing)

**Read first, whole:** `research/release-0.5.2/PLAN.md` (all of it — §2 THE GATES is your table of contents; §7 what is not claimed), **`CHANGES-0.5.2.md`** (every row's
line), every `R<n>-BUILD.md` (R0, R1, R2a, R3a, R2b, R3b, R2c, R2d, R5 — their "what Josh will see", their recorded rig reds and base readings, their candidates), `CLAUDE.md`
whole (you will judge it against the tree), `docs/NOTES-FOR-AGENTS.md`, `docs/STATE-SCOPES.md`, `tests/helpers/app-source.mjs`, `tools/rack-deps.mjs`'s header,
`tools/perf/digest-lock.mjs`'s header, `tools/perf/main-thread.mjs`'s header and **R1-BUILD's pair recipe** (the exact invocation, both scenes, the same-tree floor U4),
`research/release-0.4.0/HANDOFF.md` §2's 0.5.2 blocks (the integrator's running ledger: what was owed and why).

## The state you verify (the integrator, 2026-10-10 — the tip `{{tip}}`; the BUILD files are the authority)

- **The build is complete.** `rack.js` {{rackLines}} lines (4,931 at `v0.5.1-alpha`); {{measured}} module files under `lab/shell/` and `lab/windows/`; `lab/*.js` + shell +
  windows **{{labLines}}** against the cut cap 27,943 (+1 %; the merge cap 28,219 = +2 %) — **{{labLeft}} to the cap** (a negative number is the overrun; the ruling on it is
  Josh's — you STATE the ledger exactly: in, out, per module). {{hinge}}.
- **The rig** was REBOOTED at 11:46 on 2026-10-10 and is healthy: THE LOCK read 860 · 0/0 and 1004 · 0/0 in 57–58 s on `2a5df88` and on R5's tree, frame-occlusion 7/7,
  `settings-probe` reached all six scenes. THE LOCK and the pair ARE measurable. Before the reboot (≈ 02:00–11:30) the RTX drew 2–3 frames a second and the heaviest
  states stalled on every tree including the 0.5.1 base — that is why the R1–R2d BUILD files carry "rig" reds with base readings beside them; a red of that kind that
  still appears on the healthy rig is checked once against the base export and judged. Never loop on a stall; never touch another process.
- **Two readings exist for every rig red** in the BUILD files (the tree and the 0.5.1 base export beside it). A red you find that is NOT in them, or that differs from the
  base, is a defect — say which file, which law, both readings.

## The estate (PLAN §2 — every row, in this order; one browser at a time; the base export of `v0.5.1-alpha` on your second port beside every red)

1. **G-A the shape:** `node tools/perf/app-shape.mjs` (every namespace a fast-properties object; none ≥ 128 keys); `node tools/rack-deps.mjs --classes` (0 bare writes;
   fwd + shared ≤ 25 per moving module; the loop and boot exempt; every module file measured; `PLANNED_CUT` tiles the body; `tests/rack-deps.test.mjs` green); the
   doubles law: `node research/release-0.5.2/integrator/doubles.mjs <your worktree>` → 0 slots filled twice; the cycle count — every module importing from
   `'../rack.js'` (`TIER`, `BUILD_LINE`: the accepted cycle; list them).
2. **G-G the classes, final:** `rack.js` ≤ 1,500; no module > 600 lines (list the largest three); the facade's row ≤ 25.
3. **G-D THE LOCK:** `node tools/perf/digest-lock.mjs --check --query gastab=0` → 860 values · 0/0; then with `--fixture research/release-0.4.0/measure/digest-lock-s4a.json
   --query gastab=0` → 1004 · 0/0. A moved digest on a tree that settles is a DEFECT (never a re-bake); a single red re-run alone once (the RTX 3070 in P5 — see
   R0-BUILD).
4. **G-M the pair:** `tools/perf/main-thread.mjs` by R1-BUILD's recipe — the 0.5.1 base export vs the tip, the boot scene AND D1's scene (`--setup`), interleaved 5 + 5 on a
   quiet rig, U4's same-tree floor FIRST (the base against itself) — |Δ| ≤ 3.536 ms/s. A gross Δ with G-A clean points at a module boundary on the frame path: name it.
5. **G-B the bytes:** `tools/serialize-bytes.mjs --out` on the tip vs the base export — 11/11 full AND 11/11 edit sha-identical (the integrator's comparer:
   `research/release-0.5.2/integrator/sb-compare.mjs <tree.json> <base.json>`; the base reading `sb-base.json` beside it); `tools/settings-probe.mjs` 0 of 6 red
   (every reached scene byte-identical on reload; the WATER / N₂ stall is the rig's — base once).
6. **G-W the facade:** `tests/lw-facade.browser-test.mjs` 1/1 WITHOUT `--write` (176 members: 56 value · 48 get · 72 method, names and order).
7. **G-S the suites:** `bash test.sh node` exit 0 (82 node suites); **every one of the 35 browser suites** (`ls tests/*.browser-test.mjs`), one at a time, each count
   recorded; a red judged against the base export once; the boot suite ALONE (`tests/legacy/boot.browser-test.mjs`, 152 laws — B149 the only standing law red; B6/B69 the
   known flakes; `latex-copy` and `keyboard-window` red on the base at 0.5.1 — say what they read now), by the integrator's chunk runner if marionette dies
   (`/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/optimization-2026-09-24/.tmp/chunk.mjs`; the chunks are order-dependent — R3b-BUILD §9 item 5 — so
   the whole-suite run is the real reading when the rig allows it); the FILM witnesses (`node tests/render-exact.test.mjs`, `tools/perf/film-probe.mjs` + film-compare,
   `film-handover`, `take-in-bugs`).
8. **G-L lines:** `cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l` and per file; the ledger — what each row put in (headers, signatures, returns, seats, fills,
   `sw.js` rows) and took out (imports, blank lines, dead code), summed, against 27,666 at 0.5.1.
9. **The free names:** `research/release-0.5.2/r3a-measure/freenames.mjs` over every module file and `rack.js` against the 0.5.1 base — a name a file reads that nothing
   declares or imports is a defect the tool cannot see.
10. **U9 the cold load** before/after (R0-BUILD's recipe: the 0.5.1 base export vs the tip, cache cleared, the time to `LW.ready`; say both numbers and the rig).
11. **The documents against the tree:** every `rack.js` pointer in `CLAUDE.md` (15), `docs/NOTES-FOR-AGENTS.md` (8) and `docs/STATE-SCOPES.md` (4) — is the thing it
    names still in `rack.js`, or in which module now (`initStageText`, `refreshOcclusion()`, the ACTIONS rows, `createCameraPanel`, `camKnobs`, `modStore`/`saveMod`,
    `LOOK_DEFAULTS`, `untouched`, `isPhone()`/`isTablet()` …)? The stale lines PLAN §0 already names: CLAUDE.md :6 "adapt `lab/modwindow.js`" (the file is gone);
    :260 "The 32 `!important`s" (`grep -c '!important' lab/skin.css lab/lab.css` and say the true counts); the lock's "1004 + 1148" if it survives anywhere. For each
    stale line propose the exact replacement text in your report — do NOT edit CLAUDE.md (the integrator applies).
12. **"What Josh will see: nothing" — re-proven, not re-stated:** the bytes (5), the facade (6), the DOM order (the full bytes carry the WORKSPACE layout, so 5 is its
    witness), the look (`settings-probe`'s blobs), the keys (`keyboard-shortcuts`, `keyboard-window`), the menus (`menubar`), the timeline (`timeline`), the first run
    (`first-run`, `opener`).

## The verdict (`research/release-0.5.2/R-V-REPORT.md` — your ONE commit; nothing else changes)
- A table per gate: reading · the base reading beside any red · verdict (GREEN / RIG / DEFECT).
- The defect list for the fix round, each with file, line, law, both readings and a one-line fix proposal; severity BLOCKING (a byte, a digest, a facade member, a law
  that was green at 0.5.1 and is red on the tip but green on the base) or NOTE.
- The candidates the integrator already holds, each confirmed or dismissed with a reading: B69/B6 re-aim; `latex-copy`; the TIER cycle (a `lab/tier.js`?); `main-thread.mjs`
  reads `rack.js`'s sha alone (`rackSha256` — the app's source is many files now); `markBatchBegin` and `solveCard` destructured at the controller's seat and read by
  no boot code; the returns of `settings.js` / `spectrum.js` / `state.js` filled in `boot()` on their seat lines (→ registrations when those files are next opened); a
  `tools/` free-name check seeded from `r3a-measure/freenames.mjs`; `r2b-measure/rigfree.mjs` → `tools/perf/wait-gpu.mjs` (it counts a poll that names "marionette");
  `menubar :143` masks the session key; persist destructures its 9 controller names (23 → 13 if it did); the line-law overrun and its exact figure.
- The CLAUDE.md / docs stale lines with proposed text.
- The last line: **FIT TO CUT** (every gate green or rig-identical with the rig healthy) / **FIT WITH NOTES** (notes only, or the lock and the pair not measurable on this
  rig) / **NOT FIT** (a BLOCKING defect) — and the one sentence why.

## Harness
Isolated worktree (the harness gives you one; your shell starts in it): `git reset --hard <the integrator's tip named in your launch message>` first. Ports: yours
**9133/5603** (the tip) + **9137/5607** (the base export: `git archive v0.5.1-alpha | tar -x -C <dir>`, served with `LW_CERTS=<your worktree>/.certs`). `python3
tools/gate/server.py <path> <port>` (run_in_background); `LW_PORT=… GD_PORT=…`. You run alone, but the integrator's servers (8731 the tree, 8735 the 0.5.1 base) and any process that is not yours are never touched; `node research/release-0.5.2/r2b-measure/rigfree.mjs` before every suite; stop your servers by pid; never `pkill -f`. The
shell guard refuses compound lines (plain commands or `bash .tmp/x.sh` / `node .tmp/x.mjs`). You edit NOTHING under `lab/`, `tests/`, `tools/`, `docs/` or `CLAUDE.md` —
your commit is the report (`0.5.2 R-V · R-V-REPORT.md: <the verdict>; wave 224` with REPORT.md's wave under the 0.5.2 heading). Never merge, push, tag. Hand back by
message (the verdict line first, then the defect list) + try `~/.claude/handoffs/agents/<id>.md`.
