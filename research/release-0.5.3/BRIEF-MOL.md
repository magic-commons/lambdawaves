# BRIEF B-MOL · M1 THE FORMULA + M2 C₆₀'S LADDER + M3 STATES ANSWERS + M10 MORE PRESETS (0.5.3 "Rack Tune"; Opus builder; W1, beside B-STAGE — file-disjoint)

**Read first, whole:** `research/release-0.5.3/PLAN.md` (§0 facts 1–3, rows M1 M2 M3 M10, §2 gates, §7 rulings R2 R4, §11), `AUDIT-OPUS-1.md` Part A rows M1–M3,
M10 and Part B §2 (the citation table), `localise/MOLECULES-MO-REGISTRY.md` §1–§4, `lab/latex-state.js` (formulaLatex :95-100; moleculeHead :131),
`lab/orbitalsview.js` (select :188-189, paintLevels :197-201, the refusal :257, crossed :513-515, update :558-566, preset :216), `lab/statesview.js` (:172 the ladder's
landing, :282 the refusal, :309-310, :705 the parked load), `lab/mathworker.js:328`, `lab/chemview.js:94-97,124,258,322`, `lab/molecules.js:500-503` (the `{rows:[]}`
fallback), `lab/library.js:33-64` (FRONTIER records, `ground.cols`), `tests/latex-state.test.mjs`, `tests/register.browser-test.mjs`, `tests/stage-text.browser-test.mjs:73-81`,
`CLAUDE.md` (the MOLECULES / MO-REGISTRY / PAINT GESTURE / STAGE FORMULA paragraphs; the three scopes), `docs/NOTES-FOR-AGENTS.md` (the rig law).

## Your files (B-STAGE owns `stage-gestures.js`, `rack-wiring.js`; do not touch `persist.js` — B-CAM owns :163 in W2)
`lab/latex-state.js`, `lab/orbitalsview.js`, `lab/statesview.js`, `lab/chemview.js:258-322` only, `lab/molecular-register.js` if a preset table needs it, the tests named below.

## The rows, as audited
**M1 THE FORMULA (+3).** `formulaLatex` maps each run of **`[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+` — spelled out** (¹²³ are U+00B9/B2/B3, OUTSIDE U+2070–2079; `/[⁰-⁹]/.test('²')` is false)
to one `^{…}`: `²⁻` → `^{2-}`, NH₄⁺ still `^{+}`; fold the two ⁺/⁻ replaces at :98 into it. A node sweep in `tests/latex-state.test.mjs` renders EVERY formula of
`MOLECULE_BY_ID` plus the library's through KaTeX with `throwOnError: true` and asserts ≥ 91 rows (so the `{rows:[]}` fallback cannot pass empty). The record's baked
`page` field is left (its hash is the library's). Josh sees: B₁₂H₁₂²⁻ typeset on the stage (PNG pair).
**M2 C₆₀'S LADDER (+12).** With `sol.cols` set (a FRONTIER record carries 8 of 300 columns: 175–182), `select`, `paintLevels` and `crossed()` SKIP uncarried levels and
draw them dim; the refusal at :257 and the silent stop in `update()` :558-566 can then never be reached by a click on a dim rung. A failed record fetch puts `preset`
back to the last solved id BEFORE `sol = null` (`chemview.js:322`) so the dropdown answers (one road; no re-solve-on-re-pick). A browser case in `register` drives
C₆₀'s ladder through the UI and asserts ON is never refused by a click on a dim rung and the dropdown answers after a failed fetch.
**M3 STATES ANSWERS (+12).** ON with S₀ alone applies BEAT (ONE behaviour — no "add a state" sentence); the auto-off on a re-solve (:635) goes; the re-arm is ONE seat:
`statesview.js:172` honours `wanted.on`, including a `setOn(true)` that was refused while the ladder was out; the refusal for records with no CIS states
(`mathworker.js:328`) becomes a visible sentence ON THE SWITCH. **No cut of STATES (R2):** the 19 `reg.*` modulation targets and `__LW.states` stay byte-stable —
`history` (STATES ground-lane bytes) and `new-project --check` prove it.
**M10 MORE PRESETS (+25, after M2).** ORBITAL presets 2 → 8 as ONE table `(name → levels, phases, refusal)` — not if-arms in `preset()` :216 — each inside `sol.cols`
for RECORD_ONLY molecules with its refusal sentence: HOMO · LUMO · FRONTIER FOUR (HOMO−1…LUMO+1) · HOMO SET · LUMO SET (the whole degenerate level) · OCCUPIED (all
valence, equal phase) — R4 (σ + σ* struck: ε alone cannot pair bonding with antibonding). STATES presets unchanged. One stage banner per preset in `stage-text:73-81`.

## Laws
Never edit `lab/mir/**`. Subtract, don't add. `node tests/pwa.test.mjs --write` after ANY `lab/` edit. Your JS delta budget **+52** total (3 + 12 + 12 + 25); stop and
report at +78. No field code → no lock run (say if you touch anything the field reads). Servers: `python3 tools/gate/server.py <your worktree> 8953`, `LW_PORT=8953
GD_PORT=5423`; `node research/release-0.5.2/r2b-measure/rigfree.mjs` before each browser suite; one suite at a time, 4 s apart (B-STAGE shares the GPU); stop your
server by pid. Scripts under `.tmp/`, no compound chains. `rack-deps.mjs` only `--classes --no-write`. One commit per row; NO push.

## Closers
`node tests/latex-state.test.mjs` (+ the sweep ≥ 91); `tests/molecule-head.browser-test.mjs`; `tests/register.browser-test.mjs` R0–R10 + the C₆₀ case;
`node tests/library.test.mjs`; `node tests/molecular-register.test.mjs`; `node tests/molecular-drive.test.mjs`; `tests/history.browser-test.mjs`;
`node tools/new-project.mjs --check` (exact, NO regeneration); `tests/stage-text.browser-test.mjs` (+ the banners); `tests/molecule-demos.browser-test.mjs`;
`bash test.sh node`.

## Deliverables
`research/release-0.5.3/MOL-BUILD.md`: one § per row (file:line, the case that pins it, what Josh will see with a PNG pair under `research/release-0.5.3/eye/mol-*.png`);
§ lines before/after; § the preset table as built; § what you could not measure. Commit it. Hand back ≤ 300 words: worktree path, branch, tip sha, commits, suites
with results, blockers, the exact next step. Write the same to `~/.claude/handoffs/agents/<your id>.md` if your sandbox allows; else say so.
