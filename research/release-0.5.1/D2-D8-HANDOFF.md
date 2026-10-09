# D2-D8-HANDOFF (Opus builder, worktree `.claude/worktrees/agent-ac75ffa2c710c409f`, branch `worktree-agent-ac75ffa2c710c409f`)

Base `76b1d5e` (yan-c: 0.5.0-alpha + D10-19 + D10-F + D1). Brief `research/release-0.5.1/BRIEF-D2-D8.md`. Ports 9013 / GD 5483.
`cat lab/*.js | wc -l` at the base = **27,558**.

## STATE: steps 1–3 DONE (D2 + D8 built, their scenes GREEN); next = the suites, then commit 4 (BUILD + REPORT)

3. **Step 3** — D8 in rack.js' notebook block (`orbitalOf`, `lwLink`, the capture click), `tests/lw-links.browser-test.mjs`
   GREEN 5/5; the D2 suite gained "a hand pick is one ring row" (GREEN 3/3 again).

1. **Step 1** — the composer (`lab/latex-state.js` moleculeHead / stemOf / EV / mdText), the generator's factor (`--check --only`
   nine records: in step), `tests/molecule-head.test.mjs` GREEN (38 records + H₂O/N₂ live).
2. **Step 2** — the hand road (chemview `handPick` + ON → `api.hand`; `sol.stem` from a record), rack.js `headPick`/`headLand`
   after the createChem call, D1's `announce(md, 0)` + `dismiss(md)`, `__LW.head`; `tests/molecule-head.browser-test.mjs`
   GREEN 3/3 on 9013. (A trap met: chemview already had a `function pick(k, i)` — the spectrum's — so the hand's is `handPick`.)
   Suites for D2 (stage-text, history, molecule-demos, hit-probe-set, frame-occlusion) are run once at the end, on the tip.

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
Step 3 (D8): the capture-phase click on `.nb-view` in rack.js' notebook block + `tests/lw-links.browser-test.mjs`; then the
suites (one browser at a time; `node tools/perf/wait-gpu.mjs` + `pgrep -a geckodriver` first), `bash test.sh node`, the BUILD,
REPORT wave, commit 4. Server: `python3 tools/gate/server.py <worktree> 9013` in the background; `.tmp/probe-head.mjs` probes.
