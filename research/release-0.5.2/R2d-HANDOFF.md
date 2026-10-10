# R2d-HANDOFF · MOLECULES + THE STAGE WORDS + THE MODULATION SEAM + INK (0.5.2; Opus 5.5 builder; PAIR 3 beside R2c) — USAGE PAUSE

Worktree `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a5571173c3ce60a48`, branch `worktree-agent-a5571173c3ce60a48`,
base `5fb9671` (`yan-c`; lab = `8796d15`'s). Commits: `489c54c` THE MOVE · `3b0daa8` handoff after step 1 · (this) the pause handoff.
Ports 9113/5583 (this tree) · 9117/5587 (the base export, already in `.tmp/base`, served with `LW_CERTS=<worktree>/.certs`). Servers STOPPED; no browser.

## Goal
BRIEF-R2d.md: move MOLECULES + MO-REGISTRY, THE STAGE TEXT + caption, the modulation seam and §18 INK out of `boot()` verbatim, each called at its seat;
two commits (the move; the light check + `R2d-BUILD.md` + REPORT wave 222).

## Files changed (commit `489c54c`)
`lab/rack.js` (2,001 → 1,523), NEW `lab/windows/molecules.js` (100), NEW `lab/shell/stage-words.js` (126), NEW `lab/shell/modulation.js` (228),
NEW `lab/shell/ink.js` (51), `lab/windows/readouts.js` (+`app.w.wSh = wSh;` on its root registration line), `lab/sw.js` (pwa --write),
`tools/rack-deps.mjs` (the five anchor rows' comments only; no regex changed). All parse (`node --check`). Working tree clean.

## Done, region by region
- **molecules (two seats) — DONE.** `createMolecules(app)` root under the kept LEGACY note: `const { wChem, head, createMoRegistry } = createMolecules(app);`;
  `function createMoRegistry()` at the body's statement level; its seat under the kept ORBITALS comment: `const { wOrbs } = createMoRegistry();`.
  At-use reads: `app.w.wLad`, `app.w.wCalc` (moleculeMode), `app.w.stageTextTick` (chem `setOn`). TDZ law checked: chemview never calls `setOn` at construction.
- **stage-words — DONE.** `const { stageCaption, stageTextTick, initStageText } = createStageWords(app);` under the kept STAGE TEXT comment. At-use:
  `app.host.rackL`, `app.sh.layout` (rackL is FORWARD here — §17 comes later; the brief said backward, the tree wins). `app.state.stageText = null` removed
  (the brief's subtraction; stageText's owner becomes boot, stage-words 4 → 5).
- **modulation — DONE.** `createModSeam(app);` under the kept WAVE 52 note (23 lines stay at the seat). `defs` one ordered list, `mod.install` unchanged (U2).
  At-use: `app.sh.setModArm`. Two double blanks → single.
- **ink — DONE.** `const { refreshOcclusion } = createInk(app);` under the kept INK note; `app.sh.refreshOcclusion` stays null.
- **registrations — DONE.** `app.w.wChem` (molecules root, on its return line), `app.w.wOrbs` (createMoRegistry), `app.w.stageTextTick` + `app.w.stageCaption`
  (stage-words root), `app.w.wSh` (readouts' owner line), `app.host.cameraPort` (NEW boot fill appended to the camera law's fill line, `rack.js:646` —
  nobody filled it; R2c's material may write the same: keep one at the merge). No inherited fill left in `boot()`.
- **tool anchors — DONE.** All five `PLANNED_CUT` anchors match their seats; `node tools/rack-deps.mjs --classes`: molecules 8 · stage-words 5 · modulation 10 ·
  ink 3, 0 bare writes, G-A clean, `rack-deps.test` green (17 module files). Verbatim: 463/470 moved lines identical (`.tmp/r2d-verbatim.mjs`).
- Imports: rack.js 44 → 35 import lines, 19 names out. Lines: 27,893 → 27,924 of 27,943.

## The light check — RUN (tree; base once beside each red)
node gate exit 0 (native-ui, molecule-head node, ink 17/17) · `serialize-bytes` 11/11 full + 11/11 edit sha-identical to the base, 0 errors ·
`settings-probe` 0 reached scenes red (tree 3 reached then marionette died; base 4 then N₂ "did not settle"; same blobs 716/752/736) · `lw-facade` 1/1 ·
`stage-text` GREEN · `molecule-demos` GREEN · `molecular-names` GREEN · `mir-controls` GREEN · `routed-knob` 4/4 · `camera-routes` 5/5 ·
RED on both trees: `chem` 54/55 (L7 timing 1704 vs base 1789 ms, budget 1638) · `molecule-head` browser (head shown + KaTeX + md pass; `:44` tap "covered"
both) · `frame-occlusion` (tree run 2 `:41:68` = base; tree run 1 `:64`) · `hit-probe-set` ("did not settle", both) · boot chunks: B1×2 B43 B8 B63 B74–B77
B134 B135 B138 GREEN; B9, B93 (w 356 vs 360), B140 RED on both. Outputs: `.tmp/out-9113-*.txt`, `.tmp/out-9117-*.txt`, `.tmp/sb-*.json`.

## NOT done
Commit 2: `research/release-0.5.2/R2d-BUILD.md` (the contents are in the parent's hand-back report: ledger, classes table, suites, fan-out,
registrations, seat shape, tool diff, candidates, merge notes, CLAUDE.md sentence, what Josh sees) + REPORT.md wave 222 under the 0.5.2 heading.

## Errors hit
A plain `node tools/rack-deps.mjs` rewrote `RACK-DEPS.md` / `rack-deps.json` (restored with `git checkout`; use `--classes --no-write`). The shell guard
refuses compound lines (use `.tmp/*.sh`). The rig: 2–3 fps, marionette dies mid-run.

## EXACT next command (after the reboot)
`git -C /home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a5571173c3ce60a48 log --oneline -4` — then write `R2d-BUILD.md` + REPORT wave 222
and commit `0.5.2 R2d · the light check; the classes table; R2d-BUILD.md; wave 222`. No suite needs re-running unless the integrator asks.
