# BRIEF PAIR B · P6 THE WORKER REFUSES → P7 PRECISION DISCIPLINE (0.5.4 "Contract Layer"; ONE Opus builder, P6 then P7; STEP 2, beside PAIR A — file-disjoint: yours `lab/worker-pool.js`, `lab/orbitalsview.js`' packet loop, `lab/clock.js`, new tests; PAIR A's are `lab/molecule-state.js`, `lab/chemview.js`, `lab/informational.js`, `lab/badges.js`, `lab/capture.js`)

**Read first, whole:** `research/release-0.5.4/PLAN.md` (§D facts 3, 4, 6; rows P6 and P7 in §E; §F gates and THE STUTTER LAW; §G; §J — R4 the worker refuses only after it
has answered once, R7 the lock never re-baked, R9 PHASECLOCK deferred: declared, nothing clamps), `AUDIT-OPUS-1.md` Part A rows P6 and P7 (what was struck: no worker-side
cancel, no forced-timeout probe, no clamp — and why), `REVIEW-SONNET-2.md` (`{ error, refused }` both keys; mock timers), `lab/worker-pool.js` whole (62 lines: `fail()`,
`ok`, `local()`, the 300 s ceiling, `createWorkerPool({ busyWrap, spawn })` injectable), `lab/chemview.js` where `chem.ground`, `chem.open`, `chem.rt.fit` fall back and where
`r.error || 'no answer'` prints (READ: you do not edit chemview — PAIR A does; every existing caller prints `.error`/`.refused` unedited, which is why the refusal carries
BOTH keys), the six `api.solve` reads in `lab/statesview.js` (READ), `lab/orbitalsview.js`' ORBITAL packet accumulation (the Float32 loop), `lab/clock.js` whole (53 lines),
`lab/field.js` (the texel constant; `sampleVoxel` / `readGrid`), `lab/molecular-field.js` (water's f64 oracle road), README's 2e-5 line, `tests/history.browser-test.mjs`,
`tests/new-project.browser-test.mjs`, `tests/register.browser-test.mjs`, `tools/perf/digest-lock.mjs`'s header, `docs/NOTES-FOR-AGENTS.md`, `CLAUDE.md`. RE-FIND by words.

## P6 THE WORKER REFUSES — chem only (+20 `lab/` lines ESTIMATE; stop and report at +30)
- **`answered` is a pool-lifetime flag**: set on the first `onmessage`, never reset by `ensure()` or the respawn. `local()` runs ONLY while `!answered` — the never-answered
  browser's only road (`typeof Worker !== 'function'`, a construction throw, an `onerror` before any reply). After a reply: an error or a timeout → the refusal travels as
  **`{ error, refused }`** (both keys, one sentence: the molecule must be picked again — a respawned worker holds no `chemSol`, RT or drive state); `fail()` respawns ONCE,
  then refuses; the killing job is NEVER re-posted; no worker-side cancel (the caller's `solveSeq` already drops a superseded reply). `maths` / `cards` keep their roads.
  The file's header and its ceiling comment made TRUE.
- **Proof:** a NEW `tests/worker-pool.test.mjs` with a fake `spawn`, `node:test` mock timers and a stub `requestAnimationFrame`: `local()` calls = 0 under error-after-reply,
  timeout-after-reply, a dead pool, and error-after-respawn; `local()` = 1 for the never-answered worker; the killing job is not re-posted; the second failure refuses without
  a third spawn. ONE browser case on the live error road (in `tests/chem.browser-test.mjs` or its own file): `__LW.chem`'s `api.solve` with an unknown op and a counting
  fallback → `{ refused }`, fallback calls 0. Owning suites: `history`, `new-project.browser`, `register`. THE LOCK ×2 (frame-path row: 860 and 1004 · 0/0).

## P7 PRECISION DISCIPLINE (+6 `lab/` lines ESTIMATE; stop and report at +9)
- **(a)** the ORBITAL packet accumulates in f64 and casts once (reused buffers; n ≤ 768 MACs a frame). **MEASURE** the packet-vs-f64 difference on benzene and C₆₀ before and
  after (a `tools/` script; packets are outside the lock, so this measurement IS the gate; write both numbers — no ESTIMATE). THE LOCK ×2 after (a).
- **(b)** `T_MAX` DECLARED in `clock.js`' header + a node `tests/clock.test.mjs` showing `t += dt` losing dt beyond 2⁵³·dt. NO clamp, NO sentence, NO frame-path branch (R9).
- **(c) the standing field law** `tests/field-law.browser-test.mjs`: hydrogen voxels vs the closed form at 2e-5 (README's number) and water's density vs the f64 oracle at the
  texel's 1e-3, through `sampleVoxel` / `readGrid` — two laws, each number read from its source constant.
- **(d) the view-invariance gate**, one browser case: exposure, ISO, palette, grid and quality changes never change `sol.seq`, `chem.workerStat().solverCalls` or Tr(DS).

## Laws
No `lab/mir/**`. Subtract, don't add. `node tests/pwa.test.mjs --write` after ANY `lab/` edit. `bash test.sh node` exit 0. Your gate server on 9043 by pid, `LW_PORT=9043
GD_PORT=5513`; `node research/release-0.5.2/r2b-measure/rigfree.mjs` before EVERY browser run (the GPU is shared with P3 and PAIR A); one suite at a time; never pipe a gate into
`head`; kill by pid, never `pkill -f`. THE LOCK: `node tools/perf/digest-lock.mjs --check --query gastab=0` → 860 · 0/0 and `--check --fixture
research/release-0.4.0/measure/digest-lock-s4a.json --query gastab=0` → 1004 · 0/0 — a moved digest is a DEFECT you report, never a re-bake. `tools/serialize-bytes.mjs`
11/11 IDENTICAL; `new-project --check` in step. THE STUTTER LAW: nothing you add runs in the frame loop but P7a's f64 scratch. Never write in `~/Documents/OBSIDIAN`. One
commit per step ("P6: …", "P7a: …" …); NO push. Your tree: a fresh worktree, `git reset --hard <the tip the launch names>`, confirm `git log -1`.

## Deliverables
`research/release-0.5.4/PAIR-B-BUILD.md`: §1 P6 — the flag, the roads, the test's five cases with counts, the browser case, the lock; §2 P7a — the two measured differences
before/after and the lock; §3 P7b–d — `T_MAX`, the field law's two readings, the invariance case; §4 lines before / after per row; §5 what you could not measure. Hand back
≤ 300 words: branch, tip, commits, readings, blockers.
