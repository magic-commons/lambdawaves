# C7b · THE FILM'S UI IS THE KIT'S RENDER CARD AND TIMELINE WINDOW — live hand-off (the C7b builder, Opus 5.5)

**State: PAUSED by the usage alarm (five_hour 94 %) after step 1 of 4.  Nothing merged, pushed, tagged or deployed.**

| | |
|---|---|
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a4709468ad7a57f60` |
| branch | `worktree-agent-a4709468ad7a57f60`, reset to `4555945` (the `sos-s0` tip, C3 merged) |
| `f40733d` | step 1 · createFilm takes the card's road |
| servers | 8913 (tree) and 8917 (`.tmp/base` = `git archive 4555945 lab tools tests`) — both STOPPED by pid; no browser left open |
| `lab/*.js` | 27,228 at `4555945` (re-measure after each step) |

## Step 1 (`f40733d`) — done, gates green

- `lab/render-exact.js` createFilm: `describe()` records the lab at the tap when no film is in hand (`{ token, pending }`);
  `before(spec)` builds the job from the kit's spec (`jobFrom`: `app.pending`, or `app.film` for a resumed facade film);
  `after()` releases a card job and keeps `last`; THE TIME LAW in `frame()` (period clip → RATE integral → RECORD law);
  `take('clip' | 'period' | 'frames')` (the three schedules moved from rack.js unchanged); MOTIONS out (the facade runs `still`);
  `recorder({ editor: () => tl.editor, signature, selfTestStages, calib })`, `nameFor`, `last`, `running` = job or any recorder
  running; `render()` refuses while another run holds the page; `J.host` (the kit owns H6 on the host recorder).
- `lab/rack.js`: the three verbs call `take()`; the film's `road` = { pending (caption, spin, yaw0), step: rotStep, rotating:
  rotDriving, plan: capture().planLoop }.  UI unchanged.
- `tests/render-exact.test.mjs` §13: 4 new judgements → **40/40** (the base is 36, not the brief's 37).
- `tools/perf/film-probe.mjs` keeps every ONE PERIOD / RECORD digest and time; `film-compare.mjs` compares them and the MP4 size.

Gates on `f40733d`'s tree (each browser alone, `wait-gpu` first):
- `DIGEST LOCK GREEN: 860 values compared · 0 readback differences · 0 record-byte differences · unrepeatable now: none · page errors 0 · 53 s`
- `DIGEST LOCK GREEN: 1004 values compared · 0 readback differences · 0 record-byte differences · unrepeatable now: none · page errors 0 · 52 s`
- film-probe base (8917/5387) vs tip (8913/5383) → `node tools/perf/film-compare.mjs .tmp/film-base.json .tmp/film-c1.json` exit 0:
  picture 97,824 B `87a1be2d` both; EXPORT FRAMES 25 frames pixel-identical, times identical (zip 3,248,478 → 3,248,280 B: the
  recording.json now says `still`); ONE PERIOD 180 digests + times identical, 953,793 B both; RECORD 180 identical, 743,644 B both.
- `film-handover` GREEN 4/4 (unchanged).
- NOT YET RUN: `offer` s9 on step 1.

## Findings for steps 2–3 (read on this tree)

- The timeline's `undo`/`redo` rows are NOT added to λWAVES' table: `keys.add` skips an id already present (λWAVES has `undo`,
  `redo`), so its own undo is reachable only by `tl.editor.act.undo()`; say so (or make λWAVES' undo row defer to it).
- `lab/key-table.js` `sync()` will throw on the timeline's rows (`byId.get(id)` is undefined for `timeline.*`): add `if (!a) continue;`.
- Timeline rows sit after λWAVES' in table order; a global λWAVES row on the same chord wins (pickAction, table order); stage rows
  (`when: stageHasFocus`) are disjoint from the timeline's `keysLive` — check KeyE/KeyC/KeyP/Home/Shift+Arrows/Delete collisions.
- `controller.js` calls `clock.setExactResume(true)` at install (R5); `bind.js` calls `setAutomationHold(true)` + `setAutomation`
  (applyAll(true) once) — THE LOCK must be re-run at step 2.
- The panel calls `rec.recoveries()` (OPFS) on every paint — boot cost; the card paints on construct and on `devopen`.
- The modulation window `modView` is created inside a block in rack.js (grep `modView = createModulation`); `installTimeline`
  goes after it and after `rk` (grep `const rk = createRack`), `tl.paintHead()` beside `modView.paint(false)` in `loop()`.

## Exact next step

1. Restart the servers: `python3 tools/gate/server.py <worktree> 8913` and `python3 tools/gate/server.py <worktree>/.tmp/base 8917`
   (run in background; stop by pid).  `.tmp/base` and `.tmp/film-base.json` are already there.
2. Run `LW_PORT=8913 GD_PORT=5383 node tests/offer.browser-test.mjs` (16, s9) on `f40733d`.
3. Step 2 per C7B-DESIGN §4 (installTimeline on the one clock through the seam; occlusion provider `timeline`; uiSpace; one ACTIONS
   row `timeline`; `tlwin` WORKSPACE key + STATE-SCOPES + `node tools/new-project.mjs` + `--check`; `LW.timeline` at the END of LW;
   the key-table guard above), then THE LOCK ×2, take-in-bugs, lfo-tension, routed-knob, mir-controls, history, new-project,
   settings-probe, frame-occlusion, hit-probe-set, keyboard-window, keyboard-shortcuts, ms/s closed; commit; update this file.
4. Steps 3 and 4 as the design says.
