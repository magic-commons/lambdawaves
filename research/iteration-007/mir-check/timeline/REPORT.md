# MIR system check: THE TIMELINE in λWAVES

2026-10-18 · worktree `optimization-2026-09-24`, branch `yan-c` @ `81625da` · MIR 1.5.0-alpha.24 (kit commit `1b7ae99`) · read-only investigation (no source edited)

**What I checked it against.** The kit's own promise is `MIR/.claude/worktrees/mir-1.5/docs/TIMELINE.md` (the adopted tree `lab/mir/` ships no docs). For λWAVES' side I read the laws in `CLAUDE.md` (THE FILM / TIMELINE paragraph, THE TIME LAW, THE FOCUS LAW), the seam in `lab/shell/keys.js:153-177`, `lab/film-card.js` (PLACE ONE PERIOD, the `lw-period` kind), `lab/shell/persist.js:75,307`, and the header of `tests/timeline.browser-test.mjs` (T1–T11).

**Short answer.** The timeline is **not broken** as an instrument. Clips, the curve gestures, snapping, zoom, play and scrub, the ACTIVE range, automation with MOD on and off, save and reopen, and PLACE ONE PERIOD all behave as the kit promises when driven by real input. There is **one real defect**: the timeline's own undo can't be reached. Ctrl+Z inside the timeline undoes an unrelated λWAVES edit instead. Beyond that there are about ten pieces of polish, and three of them matter.

Counts: **WORKS 36 · BROKEN 1 · POLISH 11 · FLAKY-UNDER-LOAD 0**

## Behaviours

| # | Behaviour | Verdict | Evidence |
|---|---|---|---|
| 1 | WINDOW › TIMELINE (a real tap) opens it docked at the foot of the span | WORKS | walk1 `open:true, dock:'bottom'`; T1 |
| 2 | Idle costs nothing, whether the window is open or closed | WORKS | T1 `idleClosed:0, idleOpen:0` |
| 3 | Holding an unrouted dial for 500 ms opens TIMELINE CLIP and the dial does not move | WORKS | walk1 `pop:true, moved:false`; T3 |
| 4 | CREATE AUTOMATION CLIP (a real tap) makes a 4-beat clip at the playhead, at the dial's current value | WORKS | walk1 `clip6 start 0 dur 4, pts [[0,.533],[1,.533]]` (ZOOM 3.3) |
| 5 | Holding a dial that has clips → LOCATE CLIPS selects the clip and scrolls to it | WORKS | walk3 `sel:[clip6]` |
| 6 | A right-drag in empty clip space adds a point and places it | WORKS | walk3 `[[0,.5],[.375,.207],[1,.5]]` (a right-drag that starts on the line is inert: P10) |
| 7 | A left-drag on a point moves it | WORKS | walk1 `v .533 → .934` |
| 8 | A left-drag on a tension handle bends the segment | WORKS | walk1 `tension 0 → -0.351` |
| 9 | A right-click on a tension handle resets it | WORKS | walk1 `→ 0`, no menu |
| 10 | Shift + right-click adds a point that keeps the current value | WORKS | walk1 `+[0.75, .834]` on the line |
| 11 | Alt + left-click deletes a point | WORKS | walk1 3 → 2 points |
| 12 | A plain left-click on empty space is inert | WORKS | walk1 points unchanged |
| 13 | One curve gesture is one row of the timeline's model undo | WORKS | walk1 `model.undo/redo` round-trip (through the API only, see B1) |
| 14 | Dragging a clip's title moves it, snapped (QUARTER = 1 beat) | WORKS | walk1 a 2.6-beat drag → `start 0 → 3` |
| 15 | Alt bypasses snap | WORKS | walk1 `3 → 4.4` |
| 16 | Dragging the right trim lengthens the clip | WORKS | walk1 `dur 4 → 5.6` |
| 17 | Shift + dragging a title duplicates the clip as it moves | WORKS | walk1 2 clips, the copy has its own curve |
| 18 | Ctrl+B duplicates and Delete deletes, with the surface focused | WORKS | walk1 `2 → 3 → 2` |
| 19 | Escape in the middle of a clip drag cancels the whole gesture | WORKS | walk4 `during start 10 → after 4` |
| 20 | The SLICE tool's click cuts the clip at the pointer, snapped | WORKS | walk4 `[4,8] → [4,4] + [8,4]` |
| 21 | Ctrl+A, Ctrl+C, a seek, then Ctrl+V pastes at the playhead | WORKS | walk4 pasted at beats 16 and 20 |
| 22 | Shift+↓ moves the selection down a lane | WORKS | walk4 `lane1 → lane2` |
| 23 | Ruler zoom: PgUp, PgDn, Shift+4 (all), and Shift + a vertical ruler drag around the pointer | WORKS | walk1 `px 20→25→16→59→100`; the beat under the anchor holds `11 → 11` |
| 24 | Space plays t and the playhead together, and a second Space stops both | WORKS | walk2 t `0 → 11.19`, beat `0 → 1.51`; T2 |
| 25 | A ruler scrub moves the beat with the hand and never moves t; a paused seek previews the target | WORKS | walk2 t fixed at 11.189, beat `→ 8 → 13`, hue = curve |
| 26 | Escape during a scrub rewinds to where the scrub began | WORKS | walk2 `13 → 21 → 13` |
| 27 | THE FOCUS LAW: E picks the SELECT tool (no dolly) and Space still plays | WORKS | T5 |
| 28 | Ctrl + dragging the ruler selects a range, and ACTIVE (a real tap) marks it | WORKS | walk2 `range 3–7 → active 3–7` |
| 29 | With MOD OFF, the arrangement drives its target during play | WORKS | walk2: hue equals the curve within 1e-4 at 6 samples |
| 30 | With MOD ON and an LFO routed to the same target, the curve is the moving baseline and the LFO rides on it | WORKS | walk3 `dOn 0.0008…0.119`, `dOff ≡ 0` |
| 31 | A timeline edit marks the project unsaved, and a save carries `presentation.timeline` | WORKS | walk2 `dirty false → true`, `carried:true` |
| 32 | Save → NEW → open restores the arrangement, and a re-save is byte-identical; NEW and the demos carry no timeline | WORKS | T10 |
| 33 | A λWAVES undo leaves the arrangement alone, and NEW clears it | WORKS | T9 |
| 34 | PLACE ONE PERIOD (a real tap) puts an `lw-period` clip at beat 0, sets ACTIVE over it, arms the card and opens the TIMELINE; a RENDER of it is bit-exact | WORKS | walk2 `kind lw-period, 0–3, active 0–3`; T6 (digests and MP4 bytes) |
| 35 | A ONE PERIOD clip survives save → NEW → open | WORKS | walk5 `back:1, kind lw-period, active 0–3` |
| 36 | RENDER TIMELINE · ACTIVE over a HUE automation clip with MODULATION OFF: the frames follow the curve | WORKS | walk4 30 frames, 30 distinct digests |
| — | Reload with no save: the arrangement is gone | (as designed) | walk3: every other piece of the lab state resets too (hue 0, FOV 0.6); λWAVES has no session autosave, so the timeline is consistent with the rest |
| B1 | **Timeline undo/redo from the keyboard or a menu** | **BROKEN** | details below |
| P1–P11 | see below | POLISH | |

## BROKEN

### B1 · The timeline's own undo can't be reached, and Ctrl+Z inside the timeline undoes something else

- **Repro (walk4, real input):** open the TIMELINE. Make one λWAVES edit (a hand preset load `1s+2pz → 1s+2s`, which is one history row). Drag a clip's title 4 beats (`start 0 → 4`). Click into the timeline surface (`keysLive() === true`) and press **Ctrl+Z**.
- **Expected** (the kit's TIMELINE.md, "Ctrl+Z · Undo" while the timeline's surface has the focus; or, if the app passes `history`, one stack with the timeline as a domain): the clip goes back to beat 0.
- **Actual:** the clip stays at beat 4, and **the preset reverts to `1s+2pz`**: λWAVES' history undid an unrelated stage edit. With an empty λWAVES history, Ctrl+Z does nothing (walk2, walk3). Ctrl+Shift+Z and Ctrl+Y behave the same way. The timeline's ⋯ menu has no UNDO row (walk2 lists ZOOM TO SELECTION · DUPLICATE · COPY · CUT · PASTE · DELETE · SELECT ALL · DESELECT · SHORTCUTS), and the menubar's EDIT › UNDO is λWAVES' undo. The model's undo (64 rows) exists, but the only way to reach it is `__LW.timeline.model.undo()`. No console errors.
- **Cause (λWAVES glue):**
  - `lab/shell/keys.js:159-164` calls `installTimeline` without `history`, so the kit adds its own `undo` / `redo` rows (`lab/mir/timeline/bind.js:69`).
  - But λWAVES' table already holds rows with those exact ids (`lab/shell/keys.js:98-99`), and the kit's `keys.add` leaves an existing id alone (`lab/mir/shell/keys.js:445`), so the timeline's rows are silently dropped.
  - The comment at `lab/shell/keys.js:157` ("its own are reachable from its ⋯ menu") is not true for this build.
- **Why the suite misses it:** T9 calls `M.undo()` directly, so it passes while the user has no way to undo.
- **Shape of a fix (not done):** after `installTimeline`, add two rows with their own ids, e.g. `timeline.undo` / `timeline.redo` on `Mod+KeyZ` / `Mod+Shift+KeyZ` (+`Mod+KeyY`), with `when: () => tl.editor.keysLive()`. `key-table.js` THE FOCUS LAW already gives such a row the chord while the surface has the focus. The alternative is adopting the timeline as a domain of λWAVES' history. Size S.

## POLISH

| # | What is rough | Suggestion | Size |
|---|---|---|---|
| **P1** | **A ROUTED dial can't get a timeline lane.** Holding it or right-clicking it opens the ring (RANGE CENTRE/UP/DOWN · REMOVE · REMOVE ALL) and there is no TIMELINE CLIP row (screenshot 16). The capture in `lab/shell/keys.js:171-177` (B13) hides the dial from the kit. Row 30 shows that a curve plus a route on the same target is a supported, working combination, but the only way to build it is to create the clip *before* routing (or unroute, create, re-route). This bites the moment Josh's "ORBITAL / A↔B as an automation lane" lands on a dial that is already routed. | Add `TIMELINE CLIP ›` (CREATE / LOCATE) as a row in the routed ring's menu, or keep the hold for the ring and let the right-click open TIMELINE CLIP | S–M |
| **P2** | **The target snaps back to the knob's hand value when a clip ends.** It does not hold the last automated value. walk5: hue `0.876` at beat 0.965, then `0` at 1.049, a one-frame jump in the picture. The same happens before a clip starts. FL (and most DAWs) hold the last value. The behaviour is the kit's: `model.value` returns null outside a clip and the host falls back to `baseNorm` (`lab/mir/modulation/host.js:274-275`). | In MIR: hold the last clip's end value until the next clip on that target, or make it a per-lane choice; then adopt | M (MIR) |
| **P3** | **ONE PERIOD clip integrity: trim.** Trimming is allowed (walk2 `3 → 5` beats). The kind then films that one period over more frames (`render-exact.js:736-737`, a slower take), but ACTIVE stays `0–3` and the card's plan stays 180 frames. A RENDER on TIMELINE · ACTIVE would therefore film only 3/5 of the period, and the "EXACT LOOP" would not close. This is inferred from the plan; I did not render it. Screenshot 12. | Veto the trim for `lw-period` (lock its length), or let ACTIVE and the plan follow the clip | S |
| **P4** | **ONE PERIOD stacks.** A second PLACE ONE PERIOD adds a second identical clip in lane 2 at beat 0, with no notice (walk2 `n:2`). | Replace the existing `lw-period` clip (one per arrangement), or say "a period clip is already placed" | S |
| **P5** | **Everything is tiny at λWAVES' 30 BPM.** The default 20 px/beat makes a held-dial clip 80 px wide and a ONE PERIOD clip 60 px. Their titles truncate ("ZOO…", "ONE …") and the readouts collide with the title ("0:04 1.3"). Screenshots 04 and 11. | After CREATE and PLACE, zoom to the new clip (the kit's zoom-to-selection), or seed λWAVES' first zoom at 40–60 px/beat | S |
| P6 | **Two rewinds.** The pill's ⏮ resets t only (the beat stays at 1.24) and the timeline's Home resets the beat only (t stays at 7.0), so "start over" takes two acts. A ruler scrub never moves the picture's time unless a clip drives something. This is THE TIME LAW by design, but nothing on screen explains it. | While the TIMELINE is open, ⏮ also seeks the playhead to 0; show t at the playhead in the status line | S |
| P7 | **No loop playback** over the selection or ACTIVE range. Play runs straight past the end (beat 7.94 past an ACTIVE end of 7). This comes from the kit. | A LOOP toggle on ACTIVE (MIR) | M (MIR) |
| P8 | **The ONE PERIOD body is a blank rect.** The `lw-period` paint (`film-card.js:37-38`) shows nothing of T, t0 or EXACT LOOP. | Paint the label, T in a.u. and a seam mark at the loop's end | S |
| P9 | **Raw ids in the status line**: "1 clip selected · observer.dist", "· lw.period", "· material.hue". Lanes are unnamed. | Show the registry label (ZOOM, HUE, ONE PERIOD) | S |
| P10 | **A right-drag that starts on the curve line itself is inert** (walk1). It works from empty space above or below the line. FL adds a point on the line. | Kit: let a right-press on the line add | S (MIR) |
| P11 | **Pop-ups overlap the rack.** The held-dial popup and the routed ring sit glass-on-glass over the next rack card (CLIP), and the ZOOM badge "×3.30" collides with the popup title (screenshots 02 and 16). The ⋯ menu spills past the window's right edge over the stage (10). | Seat the popup clear of the dial's value badge, and dodge the card below | S |

**Top 3 polish:** P1 (a routed dial can't get a lane), P2 (the value jumps back at a clip's end), and P3 with P4 (ONE PERIOD clip integrity: trim breaks the loop; a second press stacks).

## Suite results (`LW_PORT=8711 GD_PORT=5211`, the machine at load average ~28)

- `tests/timeline.browser-test.mjs`: **GREEN, 0 failing of 14**. T0 boot · T1 · T2 · T3 · T4 · T5 · T9 · T10 · T6 · T7 · T8 · T11a · T11b · T11c. First run, no reruns needed.
- `tests/curves.browser-test.mjs`: **GREEN**, 7 PASS. Note that this suite covers the CURVES screen-grade card, not the timeline lane's curve editor. The lane editor is covered only by the hand walk above (rows 6–13).
- `tests/lfo-tension.browser-test.mjs` (the modulation curve editor that shares the FL gestures): **PASS 3/3**.
- FLAKY-UNDER-LOAD: none.

## Screenshots (this folder)

| File | What it shows |
|---|---|
| `01-timeline-open-empty.png` | WINDOW › TIMELINE docked at the foot: four lanes, the tool bar, the rail |
| `02-held-dial-timeline-clip-popup.png` | ZOOM held → TIMELINE CLIP (CREATE AUTOMATION CLIP · LOCATE CLIPS); the overlap of P11 |
| `04-points-and-tension.png` | The new ZOOM clip with a moved point and a bent tension; how tiny it is at 20 px/beat (P5) |
| `05-clip-moved-trimmed-duplicated.png` | The clip moved, trimmed and Shift-duplicated |
| `07-playing-automation-hue.png` | Playing: the HUE clip drives the palette, MOD off |
| `09-range-and-active.png` | A Ctrl-drag ruler range marked ACTIVE |
| `10-more-menu-undo.png` | The ⋯ menu: no UNDO row (B1) |
| `11-place-one-period.png` | PLACE ONE PERIOD: the 60 px "ONE …" clip, ACTIVE over it, the RENDER card's PERIOD note |
| `12-period-trimmed.png` | The period clip trimmed to 5 beats while ACTIVE stays 0–3, plus the second stacked clip (P3, P4) |
| `13-ctrlz-in-timeline-undid-the-preset.png` | After Ctrl+Z in the focused timeline: the stage went back to 1s+2pz and the clip did not move (B1) |
| `16-routed-dial-hold.png` | A routed ZOOM held: the ring menu, no TIMELINE CLIP (P1) |
| `17-period-project-reopened.png` | A project with a ONE PERIOD clip after save → NEW → open |

## Not exercised headless (and why)

- **Touch and real iPad/WebKit** (long press as hold, pinch zoom, touch ruler select): the gate is desktop Firefox and mouse-only.
- **Middle-button pan, the resize corner, Shift-drag dock seats, WORK BARS cycling, the narrow-width tool fold:** not driven here. T4 covers a rail drag; the kit's `timeline-fold` proofs are Chromium-only upstream.
- **Point-level gestures beyond the basics:** Ctrl fine tension, Shift/Ctrl axis locks while moving a point, the rectangle selection of points, STEP and SLIDE modes, the POINTS scope.
- **SAMPLING › SCRUB at LIGHT and RELEASE:** only LIVE (the default) was used.
- **Audio and pattern clips:** λWAVES installs the timeline with `audio: false` and has no pattern sequencer, so they are absent by design.
- **The FOLDERS UI by hand:** save and open went through the facade (`layout.projects.save/open`, as T10 does), not by tapping FOLDERS' tiles.
- **Rebinding the timeline's rows in the KEYBOARD window:** `keyboard-window.browser-test.mjs` was not run.
- **Visual smoothness of the playhead under a real compositor:** the GPU was at 99 % from the solvers, and headless screenshots can't judge pacing.
- **An actual RENDER of a trimmed ONE PERIOD clip (P3):** inferred from the card's plan and `render-exact.js`, not filmed.

## Commands used

```bash
# server (own port), checked free with: ss -ltn | grep -E ':(8711|5211|5213)\b'
python3 tools/gate/server.py "$PWD" 8711 &            # pid kept, killed at the end
# suites (gatekit spawns geckodriver on GD_PORT itself)
LW_PORT=8711 GD_PORT=5211 node tests/timeline.browser-test.mjs
LW_PORT=8711 GD_PORT=5211 node tests/curves.browser-test.mjs
LW_PORT=8711 GD_PORT=5211 node tests/lfo-tension.browser-test.mjs
# the hand walk-through: throwaway scripts in the job scratch dir (gatekit open/tap + drv actions: real pointer, keys, modifiers)
cd ~/.config/claude-backup/jobs/8497d75b/tmp/mirA
LW_PORT=8711 GD_PORT=5213 node probe.mjs     # DOM/API probe
LW_PORT=8711 GD_PORT=5213 node walk1.mjs     # open, held dial, points/tension, clip move/trim/dup/delete, snap, zoom
LW_PORT=8711 GD_PORT=5211 node walk2.mjs     # play/scrub vs t, MOD off automation, range/ACTIVE, undo, dirty, PLACE ONE PERIOD, reload
LW_PORT=8711 GD_PORT=5211 node walk3.mjs     # undo again, MOD on + LFO baseline, right-drag add, LOCATE, reload w/o query
LW_PORT=8711 GD_PORT=5211 node walk4.mjs     # Ctrl+Z collateral (B1), Escape mid-drag, slice/copy/paste/lane, routed hold, TIMELINE·ACTIVE render
LW_PORT=8711 GD_PORT=5211 node walk5.mjs     # past a clip's end, SNAP choices, ONE PERIOD project save/reopen
LW_PORT=8711 GD_PORT=5211 node walk6.mjs     # pill ⏮ vs the playhead, Home vs t
```

The per-step JSON (`walk1.json` … `walk6.json`) and the suite logs are in the same scratch dir.
