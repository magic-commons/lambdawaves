# BRIEF P-V · THE VERIFICATION ROUND (0.5.4 "Contract Layer"; a FRESH Opus verifier — reads, measures, judges; fixes nothing)

**Read first, whole:** `research/release-0.5.4/PLAN.md` (§B what Josh sees; §E the rows; §F gates — your table of contents; §G what is not claimed; §J), `CHANGES-0.5.4.md`,
every `*-BUILD.md` in the folder (P0, P3, P1, P4, PAIR-B, PAIR-C, P5 if it landed), `CLAIMS.md`, `research/release-0.5.3/BRIEF-V.md` + `M-V-REPORT.md` (the previous round's shape,
its standing reds — B149; `current:138` and `gpu-recovery` pre-existing — and its lesson N7: compare file CONTENT, not `git log`), `CLAUDE.md` whole, `docs/NOTES-FOR-AGENTS.md`,
`docs/STATE-SCOPES.md`, `tools/perf/digest-lock.mjs`'s header, `tools/perf/main-thread.mjs`'s header + `research/release-0.5.2/R1-BUILD.md`'s pair recipe,
`research/release-0.4.0/HANDOFF.md` §2's 0.5.4 blocks.

## The state you verify (the integrator — the tip the launch names; the BUILD files are the authority)
- **The base** is `v0.5.3-alpha` (`git rev-parse v0.5.3-alpha`): `git archive <sha> | tar -x -C .tmp/base-053`, served on your SECOND port. Every red is read ONCE against it.
- **Known before you start:** B149 (boot), `current:138`, `gpu-recovery` — pre-existing; confirm on the base once. The `rack.js` `/* THE STAGE TEXT (Settings › Display;` comment
  is a `rack-deps` ANCHOR — a document edit proposing to reword it is wrong. MIR's stylehash is `~/Documents/MIR/tools/stylehash.mjs` (M-V-REPORT §6c has the launch).

## The estate (PLAN §F — in this order; one browser suite at a time; `node research/release-0.5.2/r2b-measure/rigfree.mjs` before EVERY browser run; your gate servers
`python3 tools/gate/server.py <dir> <port> &` on 9063 (tip) and 9065 (base) by pid, `GD_PORT` 5533 / 5535; never pipe a gate into `head`; kill by pid, never `pkill -f`)
1. **G-N** `bash test.sh node` 0 (the new suites: `worker-pool`, `clock`, `molecule-state`'s identity cases, `library`'s rule cases, P10's three, P4's table test — each present
   and green; name them); `node tools/new-project.mjs --check` in step without regeneration.
2. **THE LOCK** on the tip: 860 · 0/0 and 1004 · 0/0 (`--check --query gastab=0`; `--check --fixture research/release-0.4.0/measure/digest-lock-s4a.json --query gastab=0`).
   A moved digest is a DEFECT, never a re-bake. Re-run with the camera lock ON only if `git diff v0.5.3-alpha..HEAD -- lab/camera-law.js` is non-empty.
3. **G-B** `tools/serialize-bytes.mjs --out` tip vs base through `research/release-0.5.2/integrator/sb-compare.mjs`: 11/11 full AND edit IDENTICAL — this release adds NO stored
   key and NO WORKSPACE row, so ANY difference is BLOCKING. `tools/settings-probe.mjs --out` 0/6. **G-W** `lw-facade` 1/1 WITHOUT `--write` (`chem.capability()` is not a facade member — if it is, that is a DEFECT).
4. **The contract rows, re-proven:** (a) `identityOf`: the moved-H witness from `molecule-state.test`; `git diff v0.5.3-alpha..HEAD -- lab/molecular-session.js lab/mathworker.js
   lab/statesview.js` touches NO stamp line (read the diff); (b) the catalogue: `node tools/orbital-library.mjs --check` byte-exact; the counts 2 / 26 / 9 / 1; water's id in
   `oracles`; no `CERTIFIED` anywhere in `lab/library.json`; precache ≤ 8 MiB; (c) `statusOf`: the table test; water never UNCHECKED; THE HEAD's fifth line at phone width
   (open the PNG pair; measure once yourself); the INFORMATIONAL row present and the MODEL sheet's reworded sentence; `stage-text` UNCHANGED (its pinned caption); **the
   no-frame-call probe** re-run: 0 calls across 3 s of playback, 1 across a VIEW change; (d) the worker: the `worker-pool` suite's five cases; the browser case on the live
   error road (fallback calls 0); a Worker-less run — MOLECULES still solves (the never-answered road) — say how you forced it; (e) precision: the field law 2/2 (hydrogen 2e-5,
   water 1e-3); the invariance case; `T_MAX` declared and the clock test; PAIR-B-BUILD's two measured packet differences re-read, not re-measured; (f) P10's q-band anchor
   message; P11's FINGERPRINT row on the rig once; (g) P5 if landed: the export parsed by the Python reader (`python3 -I`), H₂O's S/T/V/M equal the PySCF fixture under R_d.
5. **G-M the pair:** `tools/perf/main-thread.mjs` by R1-BUILD's recipe — the 0.5.3 base vs the tip, the boot scene AND a MOLECULES scene, interleaved 5 + 5 on a quiet rig, the
   same-tree floor FIRST — |Δ median| ≤ 3.536 ms/s. THE STUTTER LAW: a gross Δ names a row.
6. **G-S** every browser suite (`ls tests/*.browser-test.mjs`), one at a time, each count; the boot suite ALONE (B149 standing; B6/B69 flakes); a red judged once against the base.
7. **G-Lines** `cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l` ≤ the cap (0.5.3's cut 28,018 + 1 % = 28,298); the ledger per row from the BUILD files vs PLAN §F's ≈ +106.
8. **The documents against the tree:** CLAUDE.md's MOLECULES / STAGE FORMULA / three-scopes / THE LOCK paragraphs, `docs/STATE-SCOPES.md` (no new key — true?), NOTES' lock lines,
   `CLAIMS.md` rows still true at file:line; exact old → new proposals, NOT applied (the integrator applies; never the rack-deps anchor).
9. **G-Eye** every BUILD's PNG pair exists and shows what the row says (P4's seats; the head at phone width).

## The verdict (`research/release-0.5.4/P-V-REPORT.md` — your ONE commit; nothing else changes; NO push)
A table per gate: reading · the base reading beside any red · GREEN / RIG / PRE-EXISTING / DEFECT. The defect list (BLOCKING: a byte, a digest, a facade member, a stamp line,
a frame-loop call, a law green on the base and red on the tip · NOTE). The document edits as exact lines. The last line **FIT TO CUT: YES / NO**. Hand back ≤ 80 lines: the
report's path, your branch and tip, the verdict, the BLOCKING items, the NOTE count, the pids you killed.

## Laws
Never edit `lab/**`, `tests/**`, `tools/**`, `CLAUDE.md`, `docs/**` — you fix nothing. Never touch another worktree or the root checkout; never run a Python of the library's or
the pilot's except the 10-line export reader the P5 row ships (with `-I`). Don't over-verify: each gate once, a red twice at most. ≤ 3 hours of rig time; a stalled rig is
recorded, never looped on.
