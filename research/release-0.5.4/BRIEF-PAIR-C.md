# BRIEF PAIR C · P10 THE ORACLES, DESCRIBED + NODE SUITES → P11 THE LOCK'S SCOPE + THE FINGERPRINT (0.5.4 "Contract Layer"; ONE Sonnet 5.5 @ high builder; STEP 3 — P5 THE EXPORT is its own brief, gated on the pilot's answer to Q1 through Josh)

**Read first, whole:** `research/release-0.5.4/PLAN.md` (§D fact 6; rows P10, P11 in §E; §F; §G — the q-band suite checks OUR code against Sol's count, not Sol's proof; §J — R7 the
lock stays same-machine, a FINGERPRINT compares machines and is never a lock), `AUDIT-OPUS-1.md` Part A rows P10 and P11, `tests/fixtures/oracles/` (`library-v1.json`,
`sto-3g-v1.json`, `6-31+g-star-v1.json`; `tests/fixtures/h2o-*.json`), `tools/library/record-oracle.py`'s header (READ ONLY — never run a Python of the library's or the
pilot's), `lab/frontier.js` (`clockAutocorr`, `coaxialPolynomial` — READ), `lab/ladder-model.js` (READ), `tests/frontier.test.mjs` (the idiom), `lab/molecular-flow.js` (the
continuity residual and the current/dipole ratio — where they are computed), `tools/perf/device-report.js` whole, `lab/gpu-boot.js` (the adapter request: limits only,
`shader-f16` is never requested), `tools/perf/digest-lock.mjs`'s header (`fieldDigest`), `research/MATH-CYCLOTOMIC-SCALING-2026-10-07.md` (Sol's q-band COUNT — read the number,
run nothing of Sol's), `docs/NOTES-FOR-AGENTS.md`, `CLAUDE.md`. RE-FIND by words.

## P10 (+0 `lab/` lines — tests and a README only)
1. `tests/fixtures/oracles/README.md`: per fixture — the PySCF version, `cart=True`, the R_d transform, bohr, tolerances (library-v1 39 molecules · sto-3g-v1 · 6-31+g-star-v1 19
   molecules at 3e-12 · the h2o-*.json), the generating script's name and what it reads. Every number from the fixture or the script's header, none typed from memory.
2. Three NODE suites, no `lab/` change: (a) the huge-time phase vs `clockAutocorr` (the phase at t ≫ 1 computed two ways agrees to a stated tolerance); (b) the angular q-band
   through `coaxialPolynomial` — an ANCHOR: our count is computed and compared with Sol's count from the ledger; a disagreement is REPORTED by the test's message, never "fixed"
   on either side; (c) FLOW's continuity residual and the current/dipole ratio on the fixtures' molecules, pinned with a TOLERANCE around today's reading (the BUILD states the
   reading), not a target (the floor taper waits for the pilot's margin). `bash test.sh node` picks them up (say how: the runner's glob or list).

## P11 (+0 `lab/`; `tools/perf/device-report.js` only)
- The ruling WRITTEN at the top of `tools/perf/digest-lock.mjs`'s header if it is not already there (R7, one sentence: same-machine; 860 + 1004 values; never re-baked by a maths row).
- `tools/perf/device-report.js` gains a **FINGERPRINT** row: adapter, driver, browser, the adapter's feature list (noting `shader-f16` is never requested), its limits, and
  `fieldDigest` of two states at 64³. Run it ONCE on the rig (your gate server on 9053 by pid, `LW_PORT=9053 GD_PORT=5523`, `node research/release-0.5.2/r2b-measure/rigfree.mjs`
  first — the GPU is shared with three other builders; never pipe a gate into `head`; kill by pid, never `pkill -f`). Then `node tools/perf/digest-lock.mjs --check --query
  gastab=0` and `--check --fixture research/release-0.4.0/measure/digest-lock-s4a.json --query gastab=0` UNCHANGED at 860 and 1004 · 0/0 (nothing in `lab/` moved, so this is the
  proof the row touched nothing it should not).

## Laws
No `lab/**` edit at all in this pair (if a suite needs an export that does not exist, STOP and report — do not add one). Never run a script of Sol's, the pilot's or OpenAI's.
`bash test.sh node` exit 0. Never write in `~/Documents/OBSIDIAN`. One commit per step ("P10: …", "P11: …"); NO push. Your tree: a fresh worktree, `git reset --hard <the tip the
launch names>`, confirm `git log -1`.

## Deliverables
`research/release-0.5.4/PAIR-C-BUILD.md`: §1 the README's sources; §2 the three suites with their readings (the q-band: our count, Sol's count, agree/disagree); §3 the
FINGERPRINT row's fields and the rig's reading; §4 the two lock numbers; §5 lines (0) and what you could not measure. Hand back ≤ 250 words.
