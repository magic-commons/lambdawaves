# D2-D8-HANDOFF (Opus builder, worktree `.claude/worktrees/agent-ac75ffa2c710c409f`, branch `worktree-agent-ac75ffa2c710c409f`)

Base `76b1d5e` (yan-c: 0.5.0-alpha + D10-19 + D10-F + D1). Brief `research/release-0.5.1/BRIEF-D2-D8.md`. Ports 9013 / GD 5483.
`cat lab/*.js | wc -l` at the base = **27,558**.

## STATE: step 0 — read the brief, PLAN, AUDIT E3–E9/E15–E18, D1-BUILD; design taken (below); nothing built yet

### The design (so a relaunch does not re-derive it)
- **The composer** `moleculeHead({ molecule, basis, ground, stem })` + `stemOf({ eps, nocc, names })` + `EV` + `mdText` in
  `lab/latex-state.js` beside `moleculeLatex`; `tools/orbital-library.mjs` build() takes `stemOf` for the stem's pointGroup /
  gapEh / gapEv / homo (bytes unchanged: `--check --only …`). Node test `tests/molecule-head.test.mjs`.
- **The head rides THE FADE** (D1's `stageText.announce(md, 0)` = held until `stageText.dismiss(md)`), i.e. `layer.addBlock`
  through D1's own `show()` — NOT `showPage` (its page model would add a second block beside the formula: a column).
- **The hand road**: chemview `pick(id)` (the dropdown) and MOLECULES ON's onChange call `api.hand(preset)`; rack.js
  `headPick` → waits for the solve key `id|basis|charge` → `headLand` shows once; dismissed as greet does (Escape; a press
  on the field canvas after 2.5 s; the next pick). `sol.stem` = the record's stem when the molecule opened from a record.
- **D8**: a capture-phase click on `.nb-view` takes `a[href^="lw:"]`; verbs preset / view / molecule (pick + ON) / orbital;
  one ring row (keyEdit's pattern), one fade per press; unknown keys said in `.nb-count`.

## Next step
Commit 1: the composer + the generator's factor + the node test.
