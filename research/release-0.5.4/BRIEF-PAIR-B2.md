# BRIEF PAIR B2 · P7b T_MAX → P7c THE FIELD LAW (ruled) → P7d THE INVARIANCE GATE → PAIR-B-BUILD.md (0.5.4 "Contract Layer"; one Opus builder continuing PAIR B from its tip `fb3edfb` after the usage pause)

**Read first, whole:** `~/.claude/handoffs/agents/ad656ab600f3fbae8.md` (the paused builder's state, saved by the integrator), `research/release-0.5.4/BRIEF-PAIR-B.md` (your brief —
P7b–d and the laws), **`PLAN.md` §J-2 (THE P7c RULING — it decides what the field law asserts)**, the paused worktree's probe and its output: `.claude/worktrees/agent-ad656ab600f3fbae8/.tmp/fieldlaw-probe.mjs`
and `.tmp/fieldlaw-probe.out` (READ ONLY — copy the probe into YOUR worktree's `tools/perf/` if it becomes the law's engine; never edit the paused worktree), its parked
`.tmp/clock.test.draft.mjs` (copy, do not move), `lab/clock.js`, `lab/field.js` (the texel constant and its ≈ 1e-3 comment; `sampleVoxel` / `readGrid`), `lab/molecular-field.js`
(water's f64 oracle road), `README.md` (the 2e-5 line), `tests/frontier.test.mjs` (a node-suite idiom), `docs/NOTES-FOR-AGENTS.md`.

## Your tree
A fresh worktree: `git reset --hard fb3edfb` (PAIR B's tip: P6 and P7a committed), confirm `git log --oneline -1`. First: `bash test.sh node` on `fb3edfb` (PAIR B did not run it
after P7a) and `tools/serialize-bytes.mjs` 11/11 vs a `git archive 0591605` export on your second port — record both.

## The rows
- **P7b (+3 `lab/`):** `T_MAX` DECLARED in `lab/clock.js`' header (2⁵³·dt, with dt's source named) and exported if a test needs it; `tests/clock.test.mjs` from the draft: `t += dt`
  loses dt beyond `T_MAX`. NO clamp, NO sentence, NO frame-path branch (R9).
- **P7c (+0 `lab/` beyond the two true sentences):** `tests/field-law.browser-test.mjs` per §J-2: (i) each stored component of the texel within ONE f16 ulp of its f64 value for
  hydrogen (the closed form) and for water's density (the f64 oracle road), the rounding mode as measured; (ii) the readings printed, each in its metric — RMS, 99.8 %-of-voxels,
  worst voxel, relative-to-ρmax — hydrogen at 64³ and water; (iii) the field-law CONSTANTS exported from the test's helper (or a tiny `tests/helpers/field-law.mjs`) so P4's
  `statusOf` reads its picture numbers from there and never types them. Then the two truth edits in place: README's 2e-5 line and `field.js`' ≈ 1e-3 comment become true (RMS /
  relative-to-ρmax, worst voxel beside each) — `pwa --write` after. THE LOCK ×2 after any `lab/` edit.
- **P7d:** ONE browser case (in `field-law.browser-test.mjs` or its own file): exposure, ISO, palette, grid and quality changes never change `sol.seq`,
  `chem.workerStat().solverCalls` or Tr(DS) on water.
- **`research/release-0.5.4/PAIR-B-BUILD.md`:** §1 P6 (from the saved notes: the five counts, the browser case 6/6, the suites, the lock); §2 P7a (the two measured differences,
  before/after, the lock); §3 P7b; §4 P7c — the ruling applied, the four readings per molecule, the one-ulp law's result, the rounding mode, and the sentence that THE ENGINE
  PLAN's 2.7–4.9e-4 floor (0.6.0) and this worst voxel are one fact on two grids; §5 P7d; §6 lines per row (28,023 → 28,026 → 28,028 → yours); §7 what you could not measure.

## Laws
As BRIEF-PAIR-B: no `lab/mir/**`; `pwa --write` after any `lab/` edit; `bash test.sh node` 0; your gate server on 9073 by pid (`LW_PORT=9073 GD_PORT=5543`), base export on 9075;
`rigfree.mjs` before every browser run; one suite at a time; never pipe a gate into `head`; kill by pid, never `pkill -f`; THE LOCK ×2 (860 and 1004 · 0/0) — a moved digest is
a DEFECT reported, never a re-bake; serialize-bytes 11/11; `new-project --check` in step; the stutter law; budget P7 +6 total (stop at +9); never write in `~/Documents/OBSIDIAN`;
one commit per step; NO push. Hand back ≤ 300 words: branch, tip, commits, the readings, lines, blockers, the pids you killed.
