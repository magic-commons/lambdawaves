# BRIEF · THE SITUATION-FIXTURE LOCK (THE ENGINE PLAN D.0, `tools/` only, 0 `lab/` lines; one Opus builder, after the 0.5.4-alpha cut)

**Why (PLAN.md D.0 and the line at :141–143):** every 0.6.x cut runs THE LOCK as a PRECONDITION, and the lock today sees only the ground situations (the 860 + 1004
values: thirteen pre-S4a states + chem/C6H6/lysine; ≤ 64 AO tile states, no packet, STATES, FLOW or `record()`). The equalizer, the factor road and the honest flow
all touch the SITUATIONS — a STARK field, a ZEEMAN field, a kick, the A/B TRANSITION mix, the drive at a fixed t — so those need their own fixture BEFORE 0.6.0
moves a byte. This is a NEW fixture baked ONCE on today's tree; the 860/1004 fixtures are never touched (THE LOCK is never re-baked).

**Read first, whole:** `tools/perf/digest-lock.mjs` (the header, `base()`, `STATES`, `state()`, `freeze`, `settle`, the `--write` / `--check` / `--fixture` /
`--states` roads, R7's scope sentence), `research/release-0.4.0/measure/digest-lock-s4a.json`'s meta block (the shape a fixture has), `tests/lw-facade.browser-test.mjs`
and its fixture (the facade's member names — RE-FIND the calls that set a STARK field, a ZEEMAN field, a kick, the A/B TRANSITION and its mix, and the drive; the
windows that own them: `lab/windows/*.js`, `lab/statesview.js`, `lab/drive*.js` or wherever the words live — grep by words, never guess), `research/release-0.6.0/PLAN.md`
D.0 and the "Not by construction" paragraph (:136–143), `docs/NOTES-FOR-AGENTS.md`, `CLAUDE.md` (THE LOCK paragraph).

## The row
1. **Five or six states** added to `STATES` in `tools/perf/digest-lock.mjs`, each entered from `base()` at t = 0 and frozen at its own fixed t, in the lock's own idiom
   (one line each, like `oscillator`): `stark` (a fixed field on 1s+2pz), `zeeman` (a fixed field), `kick` (one kick of a fixed strength at a fixed t, then frozen past
   it), `mixAB` (a TRANSITION with a fixed A/B mix), `drive` (the drive on at a fixed amplitude, frozen at a fixed t), and — if the tree has it as a stage situation —
   `song` or the sixth you judge most at risk from 0.6.0's rows (say why). Every value a state sets is a literal in the line (no default read from the page), so a
   changed default turns the lock red by design. The states must be REPEATABLE: enter each twice in one page and compare the digests before you bake — a state whose
   digest moves between two entries is not a lock state; report it and leave it out.
2. **The fixture** `research/release-0.6.0/measure/digest-lock-situations.json`, written by `--write --fixture <that path> --states stark,zeeman,kick,mixAB,drive[,sixth]
   --query gastab=0` on the 0.5.4-alpha tree (3 grids × 16 values per state, as today). Then `--check` on the same tree: N values · 0/0 — twice, to prove repeatability
   across pages. The existing `--check --query gastab=0` (860) and `--check --fixture research/release-0.4.0/measure/digest-lock-s4a.json --query gastab=0` (1004) must
   still read 0/0 UNCHANGED after your edit (a new state must not disturb `base()` or an old state).
3. **The header** of `digest-lock.mjs` gains the third command line (the situations fixture, its value count, "baked once on v0.5.4-alpha, same-machine, never re-baked
   by a maths row") beside the 860 and 1004 lines; `docs/NOTES-FOR-AGENTS.md`'s lock lines and `CLAUDE.md`'s THE LOCK sentence gain the third count (exact old → new in
   your BUILD; apply them — these are `docs/` and `CLAUDE.md`, not `lab/`).
4. **`research/release-0.6.0/FIXTURE-LOCK-BUILD.md`:** §1 the states (name · what it sets, with the literals · t · the facade calls); §2 repeatability (two entries per
   state, digests equal); §3 the three lock readings (situations N · 0/0 twice; 860 · 0/0; 1004 · 0/0); §4 what you could not lock and why.

## Laws
NO `lab/**` edit (0 lines — if a situation cannot be entered through the facade, STOP that state and report; never add a facade member). The 860 and 1004 fixtures are
NEVER written. Your gate server `python3 tools/gate/server.py <your worktree> 9103 &` by pid (`LW_PORT=9103 GD_PORT=5573`); `node research/release-0.5.2/r2b-measure/rigfree.mjs`
before every browser run; one browser at a time; never pipe a gate into `head`; kill by pid, never `pkill -f`. `bash test.sh node` 0. One commit per step; NO push.
Hand back ≤ 200 words: branch, tip, the states and their value count, the three lock readings, what was left out, pids killed.
