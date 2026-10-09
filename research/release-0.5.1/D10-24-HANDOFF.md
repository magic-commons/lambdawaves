# D10-24 HANDOFF · CURVES (Sonnet builder; worktree agent-a41df2f5a03718877; ports 8993 / 5463)

Base: `27eb96a` (yan-c, the 0.5.0-alpha cut). Contract: `BRIEF-D10-24.md`.

## Step 1 · the card (code) — DONE, suites green (commit 1)
- `lab/rack.js`: two imports (`createCurvesPanel`, `jsonStore`); `curvesStore = jsonStore('lambdawaves.q0.curves')` beside `modStore`;
  FORGET also `curvesStore.remove()`; ONE block after the RENDER registration: `device({ id: 'curves' })`, the note line, the panel
  (`project: false`, canvas = the stage `#field`, NO history / port / mod), `restore(curvesStore.get())`, a 250 ms debounced
  `onChange -> curvesStore.set(model.serialize())`, the card seated right AFTER RENDER (`filmCard.card.root.after(...)`), `rk.register({ ..., closed: true,
  glyph: 'curves' })`, `LW.curves = model` (the witness).  `cat lab/*.js | wc -l` 27,594 -> 27,613 (+19; +2 of them are sw.js's two new precache rows).
  WHY AFTER RENDER: a project's layout that does not list the card leaves an unlisted card where it stood and appends the listed ones; at the foot of the
  rack that put `curves` last on a reload and second-from-top after a demo open, so `closed[]` saved in two orders and settings-probe went red (4 of 6).
- `lab/settings-store.js` FAMILIES: `'lambdawaves.q0.curves'` -> PREFERENCE (its own localStorage key, like the render / modulation records).
- `docs/STATE-SCOPES.md`: one table row.  `lab/sw.js`: `node tests/pwa.test.mjs --write` (the kit's curves.js + picture-filter.js now reached).
- `tests/curves.browser-test.mjs` (new, 7 PASS): closed + in + and WINDOW + the one line; neutral `filter: none`; an S-curve changes the
  screen (driver screenshot) and NOT a picture (capture.picture sha-256 equal) and adds no undo row; the frame mask follows the closed / open / floated / folded
  card; PREFERENCE (own record, not in the settings blob, serialize() unchanged by the grade, NEW leaves it, a reload restores it); FORGET removes it.
- `tools/hit-probe-set.mjs`: two scenes (the CURVES card floated, DISCONNECTED and JOINED).
- Nothing in `lab/mir/**`, `lab/fonts/**`; no new colour, no `!important`.

## Suites (my tree, one browser at a time)
node gate exit 0 · hit-probe-set 71 presses, 0 reached (both CURVES scenes OK) · frame-occlusion 7/7 · settings-probe 0 of 6 red (N2 once hit
"animation frames stopped", a rig stall; alone it was green) · serialize-bytes: the `edit` scope sha identical to the base on 11/11; the full bytes +81 B on
all 11 = exactly the one WORKSPACE card row `{"id":"curves","side":"R","folded":false,"closed":true,"off":false,"float":null}` · menubar GREEN · history 44/44 ·
new-project 8/8 + `new-project --check` in step (no layout record in the file) + `new-project.test` GREEN · render-regressions 2/2 · THE LOCK 860 · 0/0 and 1004 · 0/0.

## Findings
- A returning browser's saved `closed[]` ("the remembered set, exactly", rack.js applySettings) does not list `curves`, so the card OPENS once for it.
  Measured on a blob `{ closed: ['shadow','history'] }`: curves, render AND clip all open — RENDER behaves the same; a general gap, not this row's.
  Fresh profile / first run: closed (the suite asserts it).
- A headless-Firefox rAF stall ("animation frames stopped" / `stats.frames` 0 after a reload) shows up now and then under load; the suite therefore
  reads the frame mask before its reload step.

## Step 2 · presents/s, BUILD, REPORT — DONE (commit 2)
presents/s over 30 s, WAVE DANCER, headless Chromium CDP, three interleaved pairs: neutral 15.03 (14.99 to 15.15), S-curve 12.18 (12.09 to 12.22): -19.0 %.
`D10-24-BUILD.md` carries the ledger, the figures, the suites, the brief candidates, the merge notes, the drafted CLAUDE.md sentence, the M5 recipe and
"what Josh will see".  `REPORT.md` has wave 210 under a new "0.5.1 · THE INFORMATIONAL UPDATE" heading (renumber at the merge if another builder took 210).
`tools/perf/device-report.js` gained one `curves` field in the per-bin state sample.

## Next
Nothing in this row.  The integrator merges by the branch tip.  The server on 8993 is stopped by pid at the end.
