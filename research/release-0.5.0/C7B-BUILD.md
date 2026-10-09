# C7b · THE FILM'S UI IS THE KIT'S RENDER CARD AND TIMELINE WINDOW — build hand-off (2026-10-09, the C7b builder, Opus 5.5)

**In ten lines.** The film's UI is the kit's. The TIMELINE window is `installTimeline` over λWAVES' ONE modulation host through an
eight-member seam (no second host, no second tick; its play is THE play), and the RENDER card is `createRenderCard` over createFilm's
host recorder (`lab/film-card.js`, registered closed on the right rack). ONE PERIOD is a `lw-period` clip: PLACE ONE PERIOD puts it at
beat 0 with ACTIVE over it, and a card RENDER of it is the facade's ONE PERIOD **digest for digest and byte for byte** (180 frames,
683,782 B both). The card's STILL is C7's RECORD frame for frame; MODULATION ON integrates RATE from the lab's t; the stored rows
RESUME (frames equal to an uninterrupted run), refuse a changed state with the kit's sentence, DISCARD, and RECOVER after a reload.
The CAPTURE group (187 lines), MOTIONS, the hover plan and the ten-minute discard left. THE LOCK held at every commit
(860 · 0/0, 1004 · 0/0). `lab/*.js` 27,228 → 27,555 with C6's +287 merged in: C7b's own **+40** (+25 generated `sw.js` rows,
+15 hand-written; band −50…+20, see Lines). Two kit-plugin collisions found and worked around in λWAVES (B13, B14), plus THE FOCUS
LAW for the keys (B15). Nothing is pushed, merged into yan-c, tagged or deployed.

| | |
|---|---|
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-ab12528fb3c1bb358` (the relaunched builder: steps 2–3) · `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a0ff0fd25c7aa306c` (the second relaunch: the step-3 fix, step 4) |
| branch | `worktree-agent-ab12528fb3c1bb358`, reset to `ae5add1` (the paused predecessor's tip on `4555945`); then `worktree-agent-a0ff0fd25c7aa306c`, reset to its WIP `f34569a` |
| `f40733d` | step 1 · createFilm takes the card's road (the predecessor) |
| `8b93ef8` | merge `yan-c` `011e6a5` (C6 FOLDERS + HANDOFF + two briefs); `lab/sw.js` the one conflict, regenerated |
| `9d8671b` | step 2 · the TIMELINE window on the one clock |
| `c815e35` | step 3 · the RENDER card; ONE PERIOD is a span clip; the CAPTURE group leaves (the WIP `f34569a` amended with the one-line `closed` fix, decision 9) |
| step 4 | this file, REPORT.md wave 208, the CLAUDE.md draft (below, for the integrator to apply) |
| servers | 8913 (tree) · 8917 (`.tmp/base` = `4555945`, then `.tmp/base2` = `7c7da54` for ms/s) — both stopped by pid at the end (the fix: 8913 only) |

## The decisions (each a default taken; the design's rulings R1–R11 built as written)

1. **The seam** (design §1.1): `{ host: modHost, registry, play, arm, armed, onPlay: appPlay.onChange, setTimeline }`. `play(on)` is
   THE play (`appPlay.play/pause`) and always answers `{ ok: true }`. → TL rides the seam's `setTimeline` (the modulation window's
   own), so **`lab/mod-port.js` is untouched** (the design had `port.timeline` there).
2. **The arrangement rides as `presentation.timeline`** (not top-level `S.timeline`), only when it holds a clip or an ACTIVE range.
   The quick save carries it too. `restore()` replaces it on every non-history restore (open, NEW, link, quick LOAD) and never on an
   undo; it is never in `serialize({ scope: 'edit' })`. NEW and the six demos carry no `timeline` (T10).
3. **`tlwin`** is a WORKSPACE key of the settings blob (`settings-store.js` WORKSPACE), written by the timeline's `store` and
   carried by `saveSettings` beside `modwin`. STATE-SCOPES gains the two rows.
4. **THE FOCUS LAW** (`lab/key-table.js`, 4 lines). With the timeline's rows added after λWAVES' (the kit's `keys.add` appends),
   table order gave E, C, P, Y, Home, the Shift-arrows, Shift+1…5, Shift+Z and Shift+T to λWAVES' global rows even with the
   timeline focused, so its tools had no keys. Now a row another module added, whose `when` holds, wins its chord (T5). `sync()`
   skips rows λWAVES does not own (the predecessor's finding), and a saved chord of such a row survives the read (`liftSaved`).
5. **The timeline's own undo/redo rows are not added**: `keys.add` skips the ids λWAVES already has (`undo`, `redo`). Its undo is
   its own 64-row stack, reached from its ⋯ menu and `tl.model.undo()`; λWAVES' Ctrl+Z stays the instrument's (T9).
6. **B13 · a routed dial's hold.** The kit's TIMELINE CLIP (timeline/knobs.js: 500 ms hold, and a document-capture contextmenu)
   pre-empted the modulation ring's pop-over (600 ms hold, right-click): RANGE · REMOVE · RESET became unreachable on a routed
   knob (`routed-knob` K3 went red). λWAVES' interim, 4 lines in the install block: a window-capture listener hides a ROUTED dial's
   `data-param` from the timeline for that one event and gives it back at document capture, right after the timeline has looked.
   An unrouted dial's hold is TIMELINE CLIP's.
7. **B14 · the CAMERA arcs.** The kit's CAMERA panel re-dispatches a press on its YAW/PITCH arcs to `.mir-camsphere-side`, which
   cancels knobs.js' pending hold: a held arc never opens TIMELINE CLIP. Its right-click does. T3 holds ZOOM and right-clicks YAW.
8. **The pill dodges both kit windows.** `modDodge(rect, who)` keeps each window's open rect and seats the pill where neither is.
9. **The RENDER card is built after `window.__LW`** (createFilm reads `LW`), put at the TOP of the right rack (`rack.prepend`) and
   registered then with `rk.register({ id: 'render', el, side: 'right', closed: true, glyph: 'render' })`. The first-run block closes
   it (R2). **Why the top:** the blob's `closed` is the closed cards in document order; a demo's layout does not list `render`, and
   the kit's arrange appends the cards a layout names, so a card appended at the foot stood second (`[transport, render, orbit, …]`)
   after a demo open and last after a reload — the same set in another order, and settings-probe was 4/6 red on the WIP. At the top
   it is where every road leaves it (a demo's or an older ☆ slot's layout, a reload, a reopen, which inserts at index 0). One line
   changed, none added; `LW.bootOrder` now ends at `history` again. A profile saved before this build has a `closed` list without
   `render`, so applySettings opens it once on the first boot after the update (the same as any new card) — at the top of the right
   rack.
10. **The facade** (`__LW.captureUI`) keeps every member: `record`, `loop`, `exportFrames` are createFilm's `take('clip' | 'period'
    | 'frames')` at C7's defaults (30 fps, 6 s, ×2) with `drive: modArm`; a verb while one runs stops it (offer s9's STOP EXPORT);
    `picture` is capture + capture.js' save; `busy` is the facade's run or any recorder's; `plan` is `planLoop({ fps: 30, seconds: 6 })`.
11. **R7's seed**: on the first boot `lambdawaves.q0.render.duration = 6`, `size = current`, `modulation = on` when MOD is armed;
    the kit's own defaults take `fps: 30, motion: 'still'`. The picture scale is `lambdawaves.q0.render.scale` (×2 first).
12. **The card's `say`** is its own status line (`card.setStatus`); the timeline's is STATE's status line (λWAVES has no toast).
13. **FILES** (SAVE AS ZIP / OPEN ZIP) stay out of the card: the design's default until FOLDERS' zip is handed over. **`calib`** is
    the kit's own (`mir.render.calib`): λWAVES' 181 ms + 131 ms/Mpx seed is not passed (one more option for a first estimate that
    the first run replaces; the subtraction won).
14. **One recorder** (design §2.2): the kit's FREEZE THIS LOOK writes no byte here — a card STILL with MODULATION OFF and TIMELINE OFF
    equals the facade's host-less RECORD frame for frame (T7), and TIMELINE ON equals OFF with nothing driven. No proxy was needed.
15. **`LW.thumbnail()`** (the integrator's item, in the facade commit): it still called `capApi.capture.probe()`, which C7
    (`33d20cc`) removed, so it threw `c.probe is not a function` on every tree since — FOLDERS' pictures failed and `gpu-recovery`
    stopped at 8/11. The dead branch went: `thumbnail()` is the GPU readback's PNG (`picture({ width: 320 })`), always, and the
    suite's thumbnail scene is one road now (two before), so `gpu-recovery` is **10/10** (11 − the canvas road).

## What left, what stayed named

**Left** (rack.js unless named): the CAPTURE group and wave 58's prose (1376–1562 on `8b93ef8`: the PICTURE seg, TAKE A PICTURE,
SECONDS, FPS, RECORD, ONE PERIOD, PLAN, EXPORT FRAMES, the three readouts, the note, `capShowLimits`, `capStale`, `capMakePlan`, the
hover plan `capWaveExact`/`capHover`, `capPaint`, `capPicture`, `capProgressTo`, `capBadge`, `capRecord`, `capRecordLoop`,
`capExportFrames` and its two-minute discard, the pointerenter); the `onPeriodLand` call and the `periodSoon` hook; the
`viewCarriesGlobalPhase` import; `native-ui.js`' camera-export disclosure (9 lines) and its four `skin.css` rules; render-exact.js'
ten-minute discard in `save()` (MOTIONS left at step 1).

**Stayed named**: `frame(i, ctx)` (THE TIME LAW), the readback and settle, seed 13, H1–H3 with their witnesses, `filmHold`,
`handOver` (every card save, the picture's too), the period laws and `planLoop`, `FILM_FPS`, `__LW.captureUI` and every member.

## Tests (counts)

| gate | step 2 (`9d8671b`) | step 3 |
|---|---|---|
| THE LOCK `--query gastab=0` | 860 · 0/0 · page errors 0 (×2 runs across the step) | 860 · 0/0 · page errors 0 (alone, on `c815e35`) |
| THE LOCK `--fixture …s4a.json` | 1004 · 0/0 · page errors 0 | 1004 · 0/0 · page errors 0 (alone, with `--query gastab=0`) |
| `bash test.sh node` | exit 0 (wiring 218 reached) | exit 0 (wiring 220 reached, 32 kit modules unreached) |
| `render-exact.test` | 40/40 (step 1) | 40/40 |
| timeline suite (NEW) | 8/8 (T1–T5, T9, T10) | **14/14** (T6 ONE PERIOD 683,782 B both; T7; T8; T11a–c), 281 s |
| film-handover | 4/4 (C7's, step 1) | 4/4 re-aimed (§4.1) |
| film-probe + film-compare | — | exit 0 vs `.tmp/film-base.json`: picture bytes, 25 frame pixel hashes, ONE PERIOD (180 · 953,793 B) and RECORD (180 · 743,644 B) digests, times and MP4 identical; verify DETERMINISTIC |
| offer | 16/16 (on `8b93ef8`) | 16/16 (on `f34569a`) |
| take-in-bugs · lfo-tension · routed-knob · mir-controls | 4/4 · 3/3 · 4/4 · 2/2 | — |
| history · new-project · `--check` | 44 · 8 · 16117 B in step | 44 · 8 · 16117 B in step (+ node new-project GREEN, keyboard-shortcuts 6 PASS) |
| gpu-recovery | (8/11 on every tree since C7: the thumbnail probe threw) | **10/10** (the thumbnail scene is one road; first run timing-red at reload 2, green alone) |
| settings-probe | 0 of 6 red | **0 of 6 red** (4 of 6 on the WIP `f34569a`; decision 9) |
| frame-occlusion · hit-probe-set | 7 · 49 presses / 0 reached (2 timeline scenes added) | 7 · 49 / 0 (on `f34569a`) |
| keyboard-window · keyboard-shortcuts | 8 (re-aimed) · PASS | — |
| menubar | — | 8/8 (on `f34569a`) |
| pwa | 325 files 6.43 MiB | 327 files 6.45 MiB (≤ 8) |
| ms/s, window closed | tip − pre-step `7c7da54` ≈ +1.2 (43.4 vs 42.2); tip − `4555945` ≈ +3.5 (C6 ≈ 2 of it); bar 3.536 | — |

## Lines (`cat lab/*.js | wc -l`)

| tree | lines | Δ |
|---|---|---|
| `4555945` (start) | 27,228 | |
| `f40733d` step 1 | 27,309 | +81 (render-exact +91, rack −10, sw 0) |
| `8b93ef8` merge yan-c | 27,596 | +287 (C6's) |
| `9d8671b` step 2 | 27,657 | +61 (rack +32, key-table +5, settings-store +1, sw +23 generated) |
| `c815e35` step 3 | 27,555 | −102 (rack −149, film-card +54, native-ui −9, render-exact −2, settings-store +2, sw +2; the `closed` fix 0) |
| step 4 (docs) | 27,555 | 0 |
| **C7b's own** | | **+40** = +25 generated `sw.js` rows + 15 hand-written |

The design estimated −15 (band −50…+20). It lands +40: createFilm's card road cost +91 at step 1 where +45 was estimated, and the
three λWAVES-side workarounds (THE FOCUS LAW 4, the B13 shield 4, the two-window dodge 2) were not in the estimate. What §5.3 says
pays is either a `__LW` member's removal (the facade's three verbs — the `__LW` law keeps them) or kit briefs (B1, B3, B4, B7); B4
turned out unnecessary (one recorder, no proxy), so its −3 is already taken. The next payers are B1 (the seed: −1) and B7 (the PERIOD
section as a ⋯ row: −6), both kit work.

## Brief candidates (B1–B12 from the design, confirmed or amended; B13–B17 new)

- **B1** confirmed — `defaults` for every row; λWAVES seeds three keys once instead.
- **B2** confirmed — the picture's choices are scales; the row still says FORMAT.
- **B3** confirmed — `describe(spec)`.
- **B4** amended — not needed by λWAVES: the FREEZE writes no byte here (T7). Keep it for apps whose adapters are not idempotent.
- **B5** confirmed — a per-step hook through the seek. Also: a RESUME of a MODULATION ON film restarts λWAVES' RATE integral at the
  resumed frame (the integrator starts at the first RECORDED frame), so only MODULATION OFF resumes are proven equal (T11a).
- **B6** confirmed — `recoveries()` lists no job a cancel left before its first checkpoint (an early CANCEL leaves a directory the
  card never shows).
- **B7** confirmed — app rows in the timeline's ⋯; PLACE ONE PERIOD belongs there.
- **B8** confirmed — automation WRITE.
- **B9** confirmed — `setExactResume(true)` is unconditional at install (R5 is taken by installing).
- **B10** confirmed — λWAVES is the first app to hand the minimal `mod`; the eight members are listed in decision 1.
- **B11** answered — a self-test stage may run a film: `selfTest` is not a recorder run, so the module's one-run `busy` is free; the
  λWAVES stage renders 6 frames twice on the host-less recorder.
- **B12** confirmed — retire C7's open item 3.
- **B13** NEW — the timeline's held-knob law (knobs.js, 500 ms, document-capture contextmenu) and the modulation ring's pop-over
  (600 ms, right-click) claim one gesture on a routed dial; the kit should arbitrate (TIMELINE CLIP could carry the route rows, or
  a routed dial's hold stays the ring's). λWAVES' 4-line shield goes when the kit decides.
- **B14** NEW — the CAMERA panel's re-dispatched press on its arcs cancels knobs.js' pending hold: no TIMELINE CLIP by holding YAW
  or PITCH.
- **B15** NEW — `pickAction` should prefer a row whose `when` holds over an unconditioned row on the same chord (a scoped row wins in
  its scope); λWAVES' FOCUS LAW goes then.
- **B16** NEW — `createRenderCard` paints (and lists OPFS recoveries) at construction even when the card ships closed; paint on the
  first `devopen` instead (a boot-cost item).
- **B17** NEW — the recorder refuses MODULATION ON while any AUDIO source is on. NEW's rack holds an AUDIO level, so after NEW the
  card's MODULATION ON (R7's armed default) answers "Live audio cannot be replayed deterministically…" until it is switched off. The
  kit could skip a source with no live input, or the panel could say which source to switch off.

## Found, not fixed (for the integrator / Josh)

- **The film carries the window mask.** The field's line pass masks the frame and the axes under the occlusion block, and a film
  renders with whatever block stood at its start: an open window cuts holes in a film's frame lines. It is C7's (the CAPTURE group's
  own card masked its films too); a pin (an empty block for the film's length) would change the digests the base copy holds, so it
  is left for a frame-path row. T6 closes the TIMELINE before both films so the two takes see one mask.
- **A NEW project's AUDIO source** refuses MODULATION ON films (B17).

## Merge notes (rack.js sites edited; C6b's regions untouched)

1. imports: two new lines after the `createFilm` import (`installTimeline`, `createFilmCard`); `viewCarriesGlobalPhase` out of the
   capture.js import.
2. `saveSettings`: one new line `tlwin: S0.tlwin` after `modwin`.
3. the `let modHost …` line (W-MODWINDOW): `, dodge = null, tl = null, filmCard = null` appended.
4. `loop()` PRESENT: one line `tl.paintHead()` after `modView.paint(false)`.
5. the CAMERA block: the CAPTURE group (from wave 58's prose to the old `capApi` line) replaced by the film block and the facade.
6. the period scan: the `onPeriodLand` call and the `periodSoon` hook removed.
7. the modulation block: `modDodge(rect, who)` and `dodging`; `dodge = modDodge` after `modView.restore`.
8. the menubar's WINDOW row list: `['TIMELINE', () => runAction('timeline')]` after MODULATION.
9. ACTIONS: one row `timeline` (no chord) at the end.
10. after the KEYBOARD window block: the TIMELINE install block (seam, occlusion provider, the B13 shield).
11. `serialize`: one line before `if (!edit) return S;`. `restore`: one line after `modView.restore(pr.modwin)`.
12. the end of the LW literal: `get timeline()`, `get render()` (C6b's `LW.session` is also a last member: keep all three at the
    end); `async thumbnail()` one line (the probe branch out); after `window.__LW = LW`: the RENDER card's four lines (`rack.prepend`, not
    `appendChild`: decision 9).
Other files: `lab/key-table.js`, `lab/settings-store.js` (WORKSPACE `tlwin`; FAMILIES `lambdawaves.q0.render`, `mir.render.calib`
appended after the C6 rows — C6b adds a `session` row nearby), `lab/native-ui.js`, `lab/skin.css`, `lab/render-exact.js`, new
`lab/film-card.js`, `lab/sw.js` (regenerate with `node tests/pwa.test.mjs --write` after the merge), `docs/STATE-SCOPES.md`,
`tests/timeline.browser-test.mjs` (new), `tests/film-handover.browser-test.mjs`, `tests/keyboard-window.browser-test.mjs`, `tests/gpu-recovery.browser-test.mjs`,
`tools/hit-probe-set.mjs`.

## What Josh will see and feel

- The CAMERA card is shorter: the CAPTURE group is gone. **RENDER** is a card of its own at the top of the right rack (closed — a profile from before this build finds it open there once; ⊕ in + and
  WINDOW): IMAGE (×1–×4, CAPTURE IMAGE then DOWNLOAD IMAGE), the film rows (STILL / TIMELINE · ACTIVE / SELECTION, MP4 or PNG
  frames, size, FPS, LENGTH 6 s, START AT, MODULATION, TIMELINE), the estimate, RENDER, PREVIEW FIRST 3 SECONDS, CANCEL, SAVE and
  DISCARD after a film, the stored renders (RECOVER, RESUME, DISCARD), RUN SELF-TEST, and PERIOD (PLAN, PLACE ONE PERIOD).
- **WINDOW › TIMELINE** opens the kit's arrangement window docked at the foot between the racks (the pill moves to the top out of
  its way). Space still plays everything; the ruler moves the beat (the automation), not ψ(t).
- **Holding an unrouted dial for half a second (or right-clicking it) opens TIMELINE CLIP** — CREATE AUTOMATION CLIP / LOCATE CLIPS.
  A routed dial keeps its ring's pop-over. Holding the CAMERA sphere's arcs does not (B14); right-click them.
- With the timeline focused, E / P / Y / C are its tools and Home its start; elsewhere they are λWAVES' keys as before.
- Every film's file still has λWAVES' name. A film's store copy now stays until DISCARD (no ten-minute timer).
- After NEW, MODULATION ON films are refused while the AUDIO level is on (B17).

## The CLAUDE.md paragraph (draft; it replaces THE FILM paragraph — for the integrator to apply)

> THE FILM (0.5.0 C7, C7b) is MIR's `createRecorder` handed λWAVES' `frame(i, ctx)` (`lab/render-exact.js` `createFilm`), and its UI
> is the kit's: the RENDER card (`createRenderCard` in `lab/film-card.js`, registered in the rack as `render`, closed on the right)
> and the TIMELINE window (`installTimeline` over λWAVES' one modulation host through the seam in `rack.js`: its play is THE play,
> λWAVES' pill the one transport, the arrangement `presentation.timeline` with its own undo, the window the WORKSPACE key `tlwin`).
> RENDER films STILL (a clip of the clock), TIMELINE · ACTIVE or TIMELINE · SELECTION as an MP4 or PNG frames; ONE PERIOD is a
> `lw-period` clip (PLACE ONE PERIOD) whose t0 and T the frame reads. THE TIME LAW: the ruler is the automation's beat and t the
> physics'; a frame's t is the period clip's, else the RATE integral when RATE can move, else the RECORD law from the lab's t. The
> kit owns the encoding, the take clock, the store with its RECOVER / RESUME / DISCARD rows and the input guard; λWAVES keeps the
> schedules, the readback and settle, seed 13, H1–H3 with their witnesses, `filmHold`, and capture.js `handOver` as every save;
> `__LW.captureUI` is the scripting facade (createFilm's takes, no UI). The timeline's rows join the ONE KEY TABLE under THE FOCUS LAW
> (`lab/key-table.js`: a scoped row wins its chord while its surface has the focus). Run `node tests/render-exact.test.mjs`, the
> digest lock, `tools/perf/film-probe.mjs`, `tests/film-handover.browser-test.mjs` and `tests/timeline.browser-test.mjs` after
> touching any of it.

## CHANGES-0.5.0 (one line, plain words)

- The film is the kit's now: a RENDER card (pictures, films, previews, recovery of interrupted renders) and a TIMELINE window
  (automation clips on any dial, ONE PERIOD as a clip you can render).

## Open items

- ms/s with the TIMELINE open and playing (the playhead's paint per tick) was not measured; closed it is +1.2 ms/s.
- The phone and the iPad: the kit's timeline and card are proven in Firefox here and Chromium by the kit; not on a device.
- The STAGE TEXT at the foot under a bottom-docked timeline: not checked by eye.
- `rec.recoveries()` runs at construction and on every paint of the card (B16).
