# C7b · THE FILM'S UI IS THE KIT'S RENDER CARD AND TIMELINE WINDOW — the design hand-off

Written 2026-10-09 by the C7b designer (Opus 5.5) on `c83b7ee` (`sos-s0`: C0 C1 C4 C5 C7 C9 and D9 merged; C2, C3, C6 building),
before any `lab/` code. Josh, PLAN §9 (2026-10-09): *"record or render should be something related to the timeline window of MIR 1.5"*.
C7-BUILD §10's open item 3 asked the kit to hide the timeline motions. This design answers it the other way: λWAVES adopts the kit's RENDER
card **and** its TIMELINE window, and λWAVES' motions become the timeline's. The build is a second launch after C3 merges, because the card
registers in the kit's rack. Every line number below is a grep anchor on `c83b7ee`; C3 moves them, so the build re-measures first.

Kit code is cited as adopted under `lab/mir/`. `render/panel.js`, `render/recorder.js`, `timeline/bind.js`, `timeline/window.js` and
`timeline/editor.js` are byte-identical to `~/Documents/MIR/.claude/worktrees/mir-1.5/mir/` (`diff -q`). The kit's docs are cited as
`RENDER.md:n`, `TIMELINE.md:n`, `RACK.md:n` and `MOTION-LAW.md:n` under that worktree's `docs/`.

## 0 · In ten lines

1. The timeline is an arrangement on the ONE modulation host λWAVES already runs. `installTimeline` is handed a small λWAVES seam as its
   `mod`: the host is `modHost`, and its play is THE play (`appPlay`). It builds no second host and no tick (bind.js:35–71).
2. Its clips are the kit's curve over λWAVES' 26 registered targets: the camera's pose path is `observer.*`, the stage colour is
   `material.hue`, and the physics speed is `transport.rate`. There is ONE λWAVES clip kind, `lw-period`: ONE PERIOD's span. It drives
   nothing; the film's frame reads it.
3. **THE TIME LAW.** The ruler is the automation's beat; t is the physics' time, and rack.js:2415 says why the two cannot be one. A film
   frame's t follows three rules in order: the period clip's law inside one; else the RATE integral if something can move RATE; else
   C7's RECORD law from the lab's t.
4. The RENDER card is `createRenderCard`, registered in C3's kit rack as `render` (right, closed). It replaces the film's verbs:
   - RENDER with STILL or TIMELINE · ACTIVE / SELECTION replaces RECORD.
   - PLACE ONE PERIOD then RENDER replaces ONE PERIOD.
   - PNG FRAMES replaces EXPORT FRAMES.
   - CAPTURE IMAGE then DOWNLOAD IMAGE replaces TAKE A PICTURE.
   - Its stored-render rows are C7's missing RECOVER / RESUME / DISCARD.
5. `createFilm` learns the card's road. `describe()` records the lab at the tap and `before(spec)` builds the job from the kit's spec.
   `motions: { loop, span }` leave: the scripting facade runs as STILL with λWAVES' own schedule.
6. **Leaves:** the CAPTURE group (rack.js:1435–1630), the FPS seg, the three verbs' UI and their `data-render-cancel`, both discard
   timers and MOTIONS — about 182 lines. **Stays named:** `frame(i, ctx)`, the readback and settle, seed 13, H1–H3 with their
   witnesses, `filmHold`, and `handOver`, which is now the card's `save`.
7. `__LW.captureUI` stays as one line, its verbs now over createFilm's named takes, with no UI. film-probe, offer s9 and film-handover
   scene 3 run unchanged. film-handover scenes 1, 2 and 4 are re-aimed in the card's commit.
8. **Build order:** (1) createFilm's card road, (2) the timeline on the one clock, (3) the card, the period clip and the CAPTURE group
   out, (4) lines and docs. THE ONE LOCK (908 / 1052) is held at every step.
9. **Lines:** about −41 hand-written and about +26 generated `sw.js` rows, so about −15 net (band −50…+20). C7b is line-neutral; §5.3
   says what pays if it lands positive.
10. Eleven rulings for Josh, each with its default (§6), and twelve brief candidates for MIR (§7).

## 1 · What the timeline IS for λWAVES

### 1.1 The mount, and the port λWAVES hands it

λWAVES never called `installModulation` (C4-BUILD, "The decisions" 1: it builds a second host and a second tick). `installTimeline`
asks for `mod` = installModulation's result, but the timeline reads only a few of its members. Measured over `lab/mir/timeline/*.js`:

| `mod` member the timeline reads | where | what λWAVES hands |
|---|---|---|
| `host` (`.clock`, `.model.transport`, `.registry`) | bind.js:36, 45–50; controller.js:23, 50; window.js:80; cursor.js:14 | `modPort.host`: the kit's `createModHost`, which mod-port.js:87 already builds. The same host and the same clock |
| `registry` | window.js:111 (the held-knob clip); editor.js:133, 223–224 | `modHost.registry` |
| `play(on)` → `{ ok }` | controller.js:34 | `(on) => (on ? appPlay.play() : appPlay.pause(), { ok: true, playing: !!on })`, i.e. THE play (clock.js:48–53). Its edge is `mod.follow` (mod-port.js:100–105), so the beat and t start and stop together |
| `arm(on)`, `armed()` | controller.js:69, 81–82 | `setModArm` (rack.js:2856), `() => modArm` |
| `onPlay(fn)` | window.js:81 | `appPlay.onChange` |
| `setTimeline(tl)` (optional) | bind.js:62 | the kit modulation window's `setTimeline` (modulation/window.js:3419–3420), so → TL appears on every LFO and ENV head |
| `onTick` (optional) | bind.js:71 | absent. λWAVES' `loop()` (rack.js:761) calls `tl.paintHead()` in its PRESENT, as TIMELINE.md:87 asks |

The `installTimeline` options λWAVES passes (TIMELINE.md:26–51):

| option | value | why |
|---|---|---|
| `mount` | `floats` (C3: the kit rack's float layer) | kit windows live there (RACK.md:28) |
| `mod` | the seam above (≈ 8 lines) | — |
| `present` | `() => schedule(TIER.PRESENT)` | bind.js:47 asks for a frame after an automation change |
| `dock` | `{ span: rk.span() }` | C3's one dock span (RACK.md:110). C4's open item "the kit window does not dock until C3's span" ends here |
| `store` | `{ read, write }` on a new WORKSPACE key `tlwin` in the settings blob | the window's shape and work lane, kept the way `modwin` is (A1's WORKSPACE list; STATE-SCOPES) |
| `initial` | `{ dock: 'bottom', open: false }` | ships closed (ruling R1) |
| `keys` | C3's ONE KEY TABLE | the rows join it (bind.js:65–70; §4 step 2) |
| `history` | **absent** | the model keeps its own 64-row undo (TIMELINE.md:39). λWAVES' `lab/edit-domain.js` wraps the kit's stack with laws K1–K9 for ONE domain; a second domain on that wrapper is unproven. When the wrapper shrinks to the kit's `register` (its own header says it will), pass `history: history.stack` |
| `project` | `false` | λWAVES' one project part is its own `serialize()`, and the arrangement rides in it (§1.5) |
| `automation` | default (on) | the arrangement becomes the host clock's automation, sampled on λWAVES' one tick (bind.js:43–51) |
| `transport` | `false` | λWAVES' bar stays λWAVES-built (C3-DESIGN §4), so there is no second ▶ (ruling R9) |
| `audio` | `false` | no ADD AUDIO…, no drop, no asset part (bind.js:57, 61) |
| `busy` | `() => film.running \|\| recorder.running()` | a scrub is refused while a film owns the clock (controller.js:52) |
| `moved`, `onWindow` | λWAVES' transport dodge, then `occlusion.dirty()` | the transport gives way and the stage mask follows (§4 step 2) |
| `say` | λWAVES' notice road | the refusals ("Nothing to run.", window.js:47) |

### 1.2 The one clock, checked

**No second host and no second tick.** bind.js builds neither:
- it takes `mod.host` (bind.js:36);
- it makes the arrangement that clock's automation with `setAutomationHold(true)` and `setAutomation({ value })` (bind.js:45–46);
- it holds `demand('timeline')` only while an unmuted clip drives a registered target (bind.js:47, model.js:229);
- the playhead paints from the app's present (bind.js:24–25, 71).

The window's controller has no loop (controller.js), and the editor paints only on events ("idle costs nothing", TIMELINE.md:114). This
passes C4's rule.

**Two switches it DOES flip on λWAVES' clock. Both are gated:**
1. **Exact resume.** `createTransportController` calls `clock.setExactResume?.(true)` unconditionally (controller.js:26). Today λWAVES'
   modulation resumes by the legacy law: under a BPM sync, a play edge re-quantises the beat to the grid (host.js:329–351). With the
   timeline installed, a resume continues from the exact paused beat, as an arrangement's playhead must. This is ruling R5. Gates:
   `take-in-bugs`, `lfo-tension`, `routed-knob`, the replay judges and THE LOCK.
2. **Automation hold.** `setAutomationHold(true)` runs `applyAll(true)` at install (host.js:541), so every target is applied once at boot.
   With an empty arrangement the sample is null (host.js:274–276) and nothing should move. THE LOCK proves it at step 2.

### 1.3 THE TIME LAW: the beat and t

λWAVES keeps two times on purpose. The comment on `transport.rate`'s definition (rack.js:2415–2417) says: *"the modulation clock cannot
BE the physics clock: [RATE] is a thing an LFO may modulate, so it cannot also be the thing that says how fast the LFO runs."* THE play
joins their EDGES (clock.js:44–53, mod-port.js:100–105); it does not make them one number.

- **The ruler is the automation's time.**
  - Play, pause, Space and ▶ are THE play, and the playhead is the host's beat (cursor.js:14).
  - A seek, a scrub or Home on the ruler moves the beat, and with it the automation and the modulation. It does not move ψ(t).
  - λWAVES' ‹ › SCRUB still moves t.
  - Ruling R11 asks whether the ruler should drive t live as well; the default is no in 0.5.0.
- **A film frame k gets its physics time by ONE law, tried in this order:**
  1. **Inside a `lw-period` clip (§1.4):** `exactSchedule({ mode: 'loop', T, t0, fps, frames: N_clip }).at(k − k_clip)`. These are ONE
     PERIOD's own times, bit for bit (render-exact.test §11).
  2. **Else, when something can move RATE** (MODULATION ON, or a clip on `transport.rate` inside the take): C7's driven integral, t +=
     rate/fps per frame from the take's first frame (render-exact.js:682).
  3. **Else, the RECORD law:** `exactSchedule({ mode: 'loop', T: (N/fps)·rate, t0: clock.t, fps, frames: N }).at(k)` (rack.js:1578),
     where t0 is the lab's t at the tap.

  This is what makes the build's proof possible: a card film with nothing driven equals C7's RECORD digest for digest, and a card film
  of a period clip equals C7's ONE PERIOD digest for digest (§5).
- **What the take's seek cannot see.** The kit steps the clock to a range's first frame without calling `frame()` (recorder.js:278–282).
  λWAVES' own integrators therefore start at the first RECORDED frame: t under rule 2, and the rotor rates' `rotStep` (rack.js:1582).
  So a range that starts after beat zero, with RATE automated before it, starts at the lab's t, not where RATE would have carried it.
  The film's manifest says so, and brief B5 (a per-step hook) is the fix.

### 1.4 What is a clip and what is not (TIMELINE.md:24 "a lane automates a registered parameter"; :89–98 the kinds)

| what λWAVES has | a clip? | by which law |
|---|---|---|
| the camera's pose: YAW, PITCH, ZOOM, FOV, PAN X, PAN Y (`observer.*`, rack.js:2385–2399) | **YES**, the kit's curve. A clip is drawn, or made by holding a CAMERA dial for 500 ms → TIMELINE CLIP → CREATE AUTOMATION CLIP (knobs.js; mod-port.js:107 stamps `data-param` on those dials) | registered targets; the pose path is these six lanes |
| AUTO-ROTATE (`camera.autoRotate` + SPIN) | **NO.** It is a switch plus a rate on the wall clock (HAZARDS `camera`, render-exact.js:444). In TURNTABLE it keeps riding every film as C7's pose path by frame index (rack.js:1579–1582) unless a yaw clip is in the take; then the clip wins | ruling R4 |
| the hands (drag, wheel, pinch) | **NO live recording.** The kit has no automation WRITE. A hand's pose reaches the timeline only as drawn points or a held dial's clip | brief B8 |
| the stage colour HUE (`material.hue`, a wrap map), and STAGE, GAMMA, EXPOSURE, SOFT, ISO, GRAIN, KNEE, CLIP POS and CLIP THICK (`material.*`) | **YES**, curve | registered (rack.js:2400–2427) |
| the physics speed RATE (`transport.rate`) | **YES**, curve. The film integrates it (THE TIME LAW, rule 2) | rack.js:2418 |
| the drives: Ω RABI, ROTATE z, STARK K_z, DEFECT L² (`state.*`), `reg.*` ×3 and `chem.*` ×2 | **YES**, curve | the 26 targets of `defs` (rack.js:2381–2497), installed at rack.js:2502 |
| a modulation drive (an LFO, an ENV) | its SHAPE becomes a curve clip through → TL on the device head: one LFO cycle, or an ENV's stages, on the device's first live route (modulation/window.js:2263–2269). The TAKE's modulation is the card's MODULATION row (RENDER.md:40–51) | `setTimeline` / `port.timeline` |
| ONE PERIOD's span | **YES**: λWAVES' own kind `lw-period` (`registerClipKind`, kinds.js:9–14). Its parts: `drives: false` (it marks; it never drives, as `pattern` fires, pattern-kind.js:43–50) · `value: () => null` · `validate` (t0 finite, T > 0) · `paint` (a band reading "ONE PERIOD · T_ψ 50.27 a.u. · LOOP", or NEAR) · no `slice` (a period cannot be cut) · `duration: (c, bpm) => c.seconds · bpm / 60`. Source `{ kind, t0, T, mode: 'loop', plan: 'exact' \| 'near', label, seconds }`; targetId `lw.period`, never registered, so never demanded (model.js:229) | §2.3 |
| the physics time t itself | **NO.** It is not a registered target, by design | rack.js:2415; THE TIME LAW |
| the grid, AUTO SCALE, the governor, the field clock | **NO.** They are unregistered, and each is a film hazard pinned off (H2, H3, H4: render-exact.js:441–443) | a clip on them would be a hazard |
| the observable VIEW, the populated states, the palette preset, the camera MODE, the MOD power, the theme and glass | **NO.** Discrete choices, PROJECT or PREFERENCE state, or a bypass (C4), not parameters | TIMELINE.md:24 |

### 1.5 What λWAVES has no use for, and how the kit lets it leave it out

| kit piece | left out by | note |
|---|---|---|
| audio clips, KEEP AUDIO, the drop, ADD AUDIO…, the asset part | `audio: false` (bind.js:57, 61) | λWAVES' AUDIO is a live capture, and a MOD-ON take refuses it anyway (recorder.js:212–213) |
| pattern clips | nothing to pass: λWAVES has no PATTERN sequencer (BASINS', TIMELINE.md:94), so no ENV face shows PATT and nothing can make one. The kind registers on import and lies inert | — |
| the work-bar transport (▶, power, BPM pill, readout, rewind, dock, door) | `transport: false` (window.js:83, 90) | λWAVES' pill is the one transport. C3's brief T1 (adopt) would let `{ shared }` seat it in the work lane |
| the project part | `project: false` (bind.js:52) | λWAVES' `serialize()` carries the arrangement (below) |
| the history domain | no `history` | the model's own undo (§1.1) |
| `remap`, `scrubLevel`, `app:readout` | absent | λWAVES' target ids are stable; SCRUB stays 'live'; there is no 10ⁿ readout |
| a tempo map, touch WebKit, `onTick` | "Not built" (TIMELINE.md:256–261) | one tempo (NEW's bpm 30, so a beat is 2 s); λWAVES' iPad stays as unproven as the kit's; the playhead paints from `loop()` |

**The arrangement in the project.**
- `serialize()` (rack.js:4603) carries `timeline: tl.model.serialize()` only when there is a clip or an active range. NEW and the 4 demos
  therefore stay byte-exact, and `new-project --check` holds.
- It is never under `scope: 'edit'`, the undo ring's snapshot, because the timeline keeps its own undo.
- `restore()` replaces the arrangement on an open (`tl.model.restore(S.timeline || null)`) and leaves it alone on a history write.
- CLAUDE.md's PROJECT sentence gains: "and the arrangement, which keeps its own undo".

## 2 · The RENDER card

### 2.1 The rows as λWAVES shows them (`createRenderView`, panel.js:58–386; the card, panel.js:401–407; RENDER.md:88–106)

| card row | λWAVES' choice | what it replaces |
|---|---|---|
| SUBJECT | left out (no `subject`) | nothing (a D-stage candidate: the state, the observable, t, T) |
| IMAGE · FORMAT | the `picture.formats` segment, carrying λWAVES' scales ×1 ×2 ×3 ×4 | the PICTURE ×1–×4 seg (rack.js:1475) |
| IMAGE · size | `picture.size()` = the canvas × the scale | the PICTURE readout and its ceiling note (rack.js:1509–1514) |
| CAPTURE IMAGE / DOWNLOAD IMAGE | `picture.capture()` is capture.js `picture({ scale })` (the readback, seed 13, up to 16384²). `picture.save(held)` is `handOver(held.blob, held.name)`, which returns `'share'` or `'download'`. `stale(held)` is true once the state, view, pose or t key has moved | TAKE A PICTURE (rack.js:1479, 1555–1565). One tap becomes TWO, so the save runs inside a live tap (panel.js:131–136) |
| MOTION | STILL · TIMELINE · ACTIVE · TIMELINE · SELECTION (recorder.js:371). λWAVES registers no app motion any more | RECORD (STILL is "a clip of the clock as it runs") and ONE PERIOD (TIMELINE · ACTIVE over a period clip) |
| FORMAT | MP4 · HIGH BITRATE / PNG FRAMES · LOSSLESS (panel.js:185) | RECORD's and ONE PERIOD's MP4; EXPORT FRAMES' PNG |
| SIZE | 1080p · 1440p · 2160p · CURRENT DEVICE WINDOW (`currentSize` is the canvas, render-exact.js:730) | C7 films were canvas-sized, i.e. CURRENT |
| FPS | the kit's segment, 24 · 30 · 48 · 60 (panel.js:189). `plan.js:22` `RECORD_FPS` is `FILM_FPS` (render-exact.js:502) | the FPS seg (rack.js:1485) |
| LENGTH · START AT | the kit's number fields, in seconds (panel.js:190–191) | the SECONDS knob (rack.js:1482) |
| MODULATION | OFF · FREEZE THIS LOOK / ON · FROM FIRST SPACE (panel.js:192) | `modArm ? 'drive' : 'freeze'` (rack.js:1581) |
| TIMELINE | ON · FROM BEAT ZERO / OFF · BYPASS AUTOMATION (panel.js:193); disabled under a TIMELINE motion (:263) | new |
| the estimate | the kit's (frames, the clock, beats and BPM for a range, the MP4's size, the time). `calib.read` starts from λWAVES' seed of 181 ms + 131 ms/Mpx (render-exact.js:390) until a run measures this device | the FRAME EXPORT readout, `capBadge` |
| RENDER / PREVIEW FIRST 3 SECONDS | the tap (panel.js:217–218, 325–348) | the RECORD, ONE PERIOD and EXPORT FRAMES presses |
| progress + CANCEL | CANCEL carries `data-render-cancel` (panel.js:223–224) and is always there (THE HAND, RENDER.md:90) | STOP, STOP EXPORT and λWAVES' two `data-render-cancel`s (rack.js:1488, 1496). ONE PERIOD's missing STOP (C7-VERIFY N3) is closed |
| the finished files | SAVE {name · size} (a tap → `save`) and DISCARD RENDER (panel.js:288–301) | the automatic hand-over after a render, and the 10-minute discard |
| the stored renders | RECOVER COMPLETED FRAMES · DOWNLOAD STORED MP4 / PNG PART · RESUME WITH MATCHING PROJECT · DISCARD STORED RENDER (panel.js:302–323; RENDER.md:62–74) | **C7's missing rows** (C7-BUILD §10 item 3; C7-VERIFY lead 2) |
| CHECK · RUN SELF-TEST | the kit's stages, plus λWAVES' `selfTestStages: [{ name: 'λWAVES frame determinism', run: () => film.verify({ frames: 6, width: 160 }) }]` (brief B11 checks the one-run `busy`) | `verify()`, until now reachable only by script |
| FILES | left out until C6 brings FOLDERS (`files: folders.zip`) | — |
| `sections` (λWAVES') | PERIOD: THE LOOP PLAN readout · PLAN · PLACE ONE PERIOD (§2.3) | PLAN and THE LOOP PLAN (rack.js:1492, 1502), ONE PERIOD (rack.js:1490) |

### 2.2 The recorder the card is handed

- **Which recorder.** `film.recorder()` is createFilm's host recorder (`recorderFor(true)`, render-exact.js:721–732). It is built with:
  - `editor: tl.editor`: TIMELINE · ACTIVE reads `activeRange()` and SELECTION reads `range()` (recorder.js:111–118);
  - `signature: () => LW.stateDigest()`: a RESUME is refused when the state differs (recorder.js:217–218). λWAVES passes none today,
    and with RESUME rows visible it must;
  - `selfTestStages` and `calib`.
- **The job comes from the kit's spec.** Today `frame()` throws "no film is running" unless `render()` has set `job`
  (render-exact.js:677). A card run calls `rec.run` directly (panel.js:340), so:
  1. `describe()` is called synchronously inside the tap for a kit motion: nothing is awaited before it when no app motion prepares
     (recorder.js:225–228). With no job in hand it returns `{ token, pending: { t0: clock.t, rate, label, observable, caption, spin, yaw0 } }`.
  2. `before(spec)` (recorder.js:232) builds the job under THE TIME LAW. It reads `spec` (frames, fps, size, `modulation`, `range`)
     and `spec.app.pending`, or `spec.app.film` on a RESUME after a reload.
  3. `after()` releases the job, and `film.last` keeps the last frame log for the probe.
- **The kit's clock and the freeze.** On the host recorder the kit owns H6: HAZARDS `modulation` has `owner: 'kit'`
  (render-exact.js:445). So λWAVES' `before()` does not call `LW.mod.stop()` (render-exact.js:623), and the witness at :664 stands aside,
  as both already do for C7's driven film.
  - MODULATION OFF is then the kit's FREEZE THIS LOOK: `clock.enter` reads every target's value as it stands and `step(0)` writes it
    (render/clock.js:46–51, 72). That is the look on screen at the tap.
  - C7's freeze put every target back to its base instead. The two differ only when the rack is running at the tap (ruling R6).
  - The facade's frozen films keep C7's host-less recorder (render-exact.js:724–725), and so C7's bytes.
- **One recorder for the card, if the freeze's write changes no byte.** C7's open item 1: the kit's FREEZE writes every target through a
  toNorm/fromNorm round trip. The build films a card STILL (MOD OFF, TIMELINE OFF) and the facade's frozen RECORD and compares them
  digest for digest.
  - Equal: the card has one recorder.
  - Not equal: an 8-line proxy hands a frozen, timeline-off STILL to the host-less recorder (`run`, `running` and `cancel` routed; the
    store directory is shared) until brief B4 lands.

### 2.3 ONE PERIOD becomes a span clip plus the card

PLACE ONE PERIOD, in the card's PERIOD section:
1. makes the plan (`capMakePlan(true)`, rack.js:1516) at the card's FPS and LENGTH. A refused or STATIONARY plan says its sentence and
   places nothing (the laws of rack.js:1588–1593);
2. adds a `lw-period` clip at beat 0 (or at the playhead, snapped to the frame grid). Its length is the plan's N/fps seconds, in beats,
   and it carries `{ t0, T, mode: 'loop', plan: kind }` (`editor.addClip`, editor.js:227);
3. sets the ACTIVE range over it (`editor.setActiveRange`, editor.js:238). The range is a field of the arrangement, so it is saved and
   undone with it (RENDER.md:38);
4. sets the card's MOTION to TIMELINE · ACTIVE and its MODULATION to OFF, because a loop closes only if nothing else moves
   (rack.js:1587). It does this through the fields' `value` and `change` (panel.js:160–165).

RENDER then films it. With nothing else in the range, the film is C7's ONE PERIOD bit for bit (THE TIME LAW, rule 1).
- Two period clips side by side film two loops.
- A stretched clip films the same loop at more frames, because any N closes (render-exact.test §2).
- The clip does not move t during live play (ruling R11).

### 2.4 The hand-over through the card

`createRenderView` hands every file to `o.save || saveBlob` (panel.js:61, 291, 313, 317) and the picture to `picture.save`
(panel.js:134). λWAVES passes `save: (blob, name) => handOver(blob, film.nameFor(name))`, so:
- **every card hand-over goes through the hand-over fix** (capture.js:651–658);
- the kit's file names (`lambdawaves-render.mp4`, `lambdawaves-frames-<run>-001.zip`) become λWAVES' `captureName` (kind, state, size,
  fps, frames, T) (ruling R10).

Most card saves run inside a fresh tap (SAVE, DOWNLOAD IMAGE, DOWNLOAD STORED), so they share. RECOVER COMPLETED FRAMES awaits
`store.finalize()` before its save (panel.js:312). That is exactly the spent-activation case the fix turns into a download.

## 3 · What leaves λWAVES, and what stays named

### 3.1 Leaves (measured on `c83b7ee`)

| where | lines | what |
|---|---|---|
| rack.js:1435–1451 | 17 | wave 58's CAPTURE prose (the probe and the relay it describes left at C7) |
| rack.js:1452, 1454–1457, part of 1470–1471 | ~6 | the CAPTURE group, its C7 comment, the busy/run/key `let`s |
| rack.js:1474–1504 | 31 | the rows: PICTURE seg, TAKE A PICTURE, SECONDS, the FPS seg, RECORD (+ `data-render-cancel`), ONE PERIOD, PLAN, EXPORT FRAMES (+ `data-render-cancel`), the FRAME EXPORT, PICTURE and THE LOOP PLAN readouts, the note |
| rack.js:1506–1507, 1509–1515 | 9 | `capShowLimits`, `capStale` |
| rack.js:1523–1545, and its caller at 2733 | 24 | the hover plan (LA7): `capWaveExact`, `capHover`, `onPeriodLand`. The card has no hover; PLAN and PLACE ONE PERIOD make the plan on a press |
| rack.js:1546–1554 | 9 | `capPaint` |
| rack.js:1555–1571 | 17 | `capPicture`, `capProgressTo`, `capBadge` |
| rack.js:1572–1628 | 57 | RECORD, ONE PERIOD and EXPORT FRAMES: their UI, and EXPORT FRAMES' 2-minute discard (rack.js:1619). Their schedule laws MOVE into createFilm's `take()` (about +15 there) |
| rack.js:1629–1630 | 2 | the pointerenter hover and the first paint |
| render-exact.js:708–714 | 7 | `motions: { loop, span }`. The timeline supplies the span, and the facade runs as STILL with λWAVES' schedule. This also closes C7-VERIFY N6: no film's manifest says `loop` for a clip any more |
| render-exact.js:834, and its comment at :828–830 | ≈3 | the 10-minute discard. A film's store copy stays until DISCARD RENDER or DISCARD STORED RENDER. The card's rows are the discard, and a hand-over's URL can never outlive its file |
| **total** | **≈ 182** | |

### 3.2 Stays named

| what | where | in C7b |
|---|---|---|
| createFilm's `frame(i, ctx)` | render-exact.js:676–706 | the card's recorder calls it. It gains the period-clip lookup and THE TIME LAW's three rules |
| the readback and settle | capture.js:615 `readback` | unchanged: the frame, the picture and the card's CAPTURE IMAGE share it |
| the jitter seed 13 | render-exact.js:494 (DEFAULTS), :691 (the pin), :656 (the witness) | unchanged |
| H1–H3 and their witnesses (with H4, H5 and H7–H9) | render-exact.js:440–452, 607–631, 654–666 | unchanged; each `owner` unchanged |
| `filmHold`, the rack's lock and put-back (H9) | rack.js:1458–1468 | unchanged: card runs reach it through `before` and `after` |
| the hand-over fix | capture.js:651–658 `handOver` | it is the card's `save` and the picture's `save` (§2.4) |
| the period and endpoint laws, and the plan | render-exact.js:108–389; capture.js `planLoop`; rack.js:1516 `capMakePlan` | the PERIOD section and the period clip call them |
| `FILM_FPS` | render-exact.js:502 | the refusal in `render()`, and the test |
| `__LW.captureUI` (the `__LW` law) | rack.js:1631, 5246–5247 | one facade line: `exact`, `capture`, `plan`, `limits`, `busy` (now also true while the card's recorder runs), `picture` (capture + `handOver`), and `record` / `loop` / `exportFrames` = createFilm's `take('clip' \| 'period' \| 'frames')` + `save`. No UI |

## 4 · The wiring, commit by commit (each with its gate)

**0. Re-measure on the start sha (C3 merged).** Re-grep every anchor and confirm the names C3 shipped (`rk`, `rk.span()`, the key
table). No `lab/` change.

**1. `0.5.0 C7b · createFilm takes the card's road`.** `render-exact.js`, plus the rack's three call sites only:
- `describe()`'s pending record, and `before(spec)` building the job;
- THE TIME LAW, and the period-clip lookup (a no-op until a model is handed);
- `take('clip' | 'period' | 'frames')`: the three schedules from rack.js:1574–1628, moved unchanged;
- MOTIONS out (the facade runs `motion: 'still'`);
- `recorder({ editor, signature, selfTestStages, calib })`, `last` and `nameFor`.

The rack's three verbs call `take()`; their UI is unchanged in this commit.

*Gate:*
- `render-exact.test` 37 plus new judgements: a card run's job built from the spec; THE TIME LAW's three rules; a RESUME after a reload
  rebuilding its schedule from `spec.app`; a period clip's frames equal to ONE PERIOD's;
- THE LOCK 908 / 1052;
- `film-probe` on the tip and on the base copy, then `film-compare` exits 0;
- `film-handover` 4/4 (unchanged) and `offer` s9.

**2. `0.5.0 C7b · the TIMELINE window on the one clock`.** `rack.js`, `mod-port.js` and `settings-store.js`:
- `installTimeline` (§1.1), after `modHost` (rack.js:2502) and C3's rack, with the seam;
- `tl.paintHead()` in `loop()`'s PRESENT;
- → TL: `port.timeline: () => tl`;
- the arrangement in `serialize` / `restore` (§1.5), and `tlwin` in WORKSPACE;
- an occlusion provider `timeline` that masks the `.glass` panes and the rail's chips, never the window's transparent box
  (TIMELINE.md:113; CLAUDE.md's mask law), made dirty on `moved` / `onWindow`;
- one ACTIONS row, `timeline`: group window, no chord (PLAN §9: "no chord invented for kit windows");
- `LW.timeline`.

The timeline's ~35 key rows (TIMELINE.md:116–160) join the ONE KEY TABLE through `keys` (bind.js:65–70). Their ids are `timeline.*` (shortcuts.js:21) and
they are live only while the surface has the focus (shortcuts.js:63). Without `history`, its own undo/redo rows come too, scoped the
same way. λWAVES already has `transport.play`, so Space is not added again (bind.js:69).

*Gate:*
- THE LOCK (the exact resume and the automation hold);
- `take-in-bugs` 4/4, `lfo-tension`, `routed-knob`, and `mir-controls` (a still 500 ms hold on a dial now opens TIMELINE CLIP);
- `history` 39; `new-project` 8 + `--check`; `settings-probe` 0 RED (`tlwin` lands in WORKSPACE);
- `frame-occlusion` 7, plus the timeline open, docked, moved, folded and paused;
- `hit-probe-set` 0 reached with the window open. A new window is a new scene: its gaps between panes;
- `keyboard-window` and `keyboard-shortcuts`: the timeline's rows are present; a timeline row and a global row on one chord with
  disjoint `when` are legal; a steal stays explicit;
- the A-M ms/s pair, window closed.

**3. `0.5.0 C7b · the RENDER card; ONE PERIOD is a span clip; the CAPTURE group leaves`.**
- **New `lab/film-card.js` (≈ 60 lines):** the card, the picture adapter, the PERIOD section, PLACE ONE PERIOD, the `lw-period` kind,
  and the first-run seed (R7).
- **rack.js:** the registration, the leaves of §3.1, and the facade.
- **settings-store.js FAMILIES:** `lambdawaves.q0.render.*` and `mir.render.calib`, both PREFERENCE.
- **In the same commit:** `tests/film-handover` re-aimed (§4.1), `tools/perf/film-probe.mjs` (+ every frame digest of the loop and the
  video) and `film-compare.mjs` (compares them).

*Registration:*
- `rk.register({ id: 'render', el: card, side: 'right', closed: true, title: 'RENDER', glyph: 'render', hint: 'the picture and the film' })`
  (RACK.md:58–66, `el` and `closed`);
- C3's store writes it into `closed` and the ☆ layouts like any card;
- `createRenderCard({ id: 'render', loadingMark: false, prefix: 'lambdawaves.q0.render.', defaults: { fps: 30, motion: 'still' } })`.

The CAMERA card loses its CAPTURE group, so its height changes. That is a named difference in C3's parity probe and in stylehash. The
card's growth when stored rows appear is the rack's one sanctioned height animation (MOTION-LAW.md:74–92).

*Gate:*
- THE LOCK; `film-probe` + `film-compare` (the facade);
- the NEW timeline suite (§5.2): the card's roads equal the facade's digests;
- `film-handover` 4/4 (re-aimed), `offer` s9, `render-exact`, `menubar`, `frame-occlusion`, `hit-probe-set`, `settings-probe`;
- `pwa --write`, then `pwa` ≤ 8 MiB;
- `wiring`: `render/panel.js` and the timeline's modules are now reached.

**4. `0.5.0 C7b · lines, wave, C7B-BUILD.md`.** `cat lab/*.js | wc -l`; the REPORT wave; C7B-BUILD.md; CLAUDE.md's THE FILM paragraph
(the draft in §4.2); the line in CHANGES-0.5.0 (the film is the RENDER card and the TIMELINE).

### 4.1 The `__LW` members

| member | its users | in C7b |
|---|---|---|
| `captureUI.exact` | film-probe :22, film-handover :35 | kept (createFilm) |
| `captureUI.capture` | export3d, gpu-recovery, menubar, film-probe, film-handover, `LW.thumbnail` (rack.js:5362) | kept |
| `captureUI.busy` | offer :247–251, film-handover :52, rack.js:2923 | kept: `film.running \|\| recorder.running()` |
| `captureUI.exportFrames` | offer s9 :246–249, film-probe :55 | kept: `take('frames')`. With `download: false` the store copy is kept, with no timer |
| `captureUI.record`, `.loop` | film-probe :52–53 | kept: `take('clip')` and `take('period')`, then `save` |
| `captureUI.picture` | film-handover s3 :78 | kept: `capture().picture` + `handOver` |
| `captureUI.plan`, `capturePlan`, `capture` | tests/legacy | kept |
| NEW `timeline` | the timeline suite | `tl` |
| NEW `render` | the timeline suite, film-handover | `{ card, view, recorder }`. `view.state()` is the kit's harness read (RENDER.md:104) |

**Edited in step 3's commit: `tests/film-handover.browser-test.mjs`.**
- **Scene 1:** a real tap on the card's RENDER, then a real tap on SAVE → inside the activation, 1 share. Also the facade's `record()`
  with no tap → 1 download (C7's law, kept on the script road).
- **Scene 2:** the URL reads until a real tap on DISCARD RENDER removes the store copy. There is no timer any more.
- **Scene 3:** unchanged.
- **Scene 4:** real taps on CAPTURE IMAGE, then DOWNLOAD IMAGE → 1 share.

### 4.2 The CLAUDE.md paragraph (draft; it replaces THE FILM paragraph)

> THE FILM (0.5.0 C7, C7b) is MIR's `createRecorder` handed λWAVES' `frame(i, ctx)` (`lab/render-exact.js` `createFilm`), and its UI is
> the kit's: the RENDER card (`createRenderCard`, registered in the rack as `render`; `lab/film-card.js`) and the TIMELINE window
> (`installTimeline` over λWAVES' one modulation host; its play is THE play). RENDER films STILL (a clip of the clock), TIMELINE ·
> ACTIVE or TIMELINE · SELECTION, as an MP4 or PNG frames; ONE PERIOD is a `lw-period` clip (PLACE ONE PERIOD) whose times the frame
> reads. THE TIME LAW: the ruler is the automation's beat and t is the physics'; a frame's t is the period clip's, else the RATE
> integral when RATE can move, else the RECORD law from the lab's t. The kit owns the encoding, the take clock, the store with its
> RECOVER / RESUME / DISCARD rows and the input guard; λWAVES keeps the schedules, the readback and settle, seed 13, H1–H3 with their
> witnesses, `filmHold`, and `handOver` as the card's save. Run `node tests/render-exact.test.mjs`, the digest lock,
> `tools/perf/film-probe.mjs` and `tests/timeline.browser-test.mjs` after touching any of it.

## 5 · The gates for the build

Ports: 8913 / 5383 for the tip; 8917 / 5387 for the base copy (`git archive <start sha> lab tools`). One browser suite at a time, 4 s
apart, `node tools/perf/wait-gpu.mjs` before each. A timing red is re-run alone.

### 5.1 The table

| gate | command | the bar |
|---|---|---|
| THE ONE LOCK | `LW_PORT=8913 GD_PORT=5383 node tools/perf/digest-lock.mjs --check --query gastab=0`, and again with `--fixture research/release-0.4.0/measure/digest-lock-s4a.json` | 908 / 1052 GREEN, 0 / 0, at EVERY commit (the integrator's counts on the D9 tree; re-read on the start sha) |
| the films against C7 | `tools/perf/film-probe.mjs` on the tip and on the base copy, then `node tools/perf/film-compare.mjs base.json tip.json` | exit 0. TAKE A PICTURE byte-identical; EXPORT FRAMES' pixel hashes and times identical; ONE PERIOD and RECORD identical in every frame digest (film-probe gains the full list, film-compare compares it) and in MP4 size |
| film-handover | `tests/film-handover.browser-test.mjs` | 4/4 (re-aimed at step 3) |
| render-exact | `node tests/render-exact.test.mjs` | 37 plus the new judgements, 0 failing |
| offer | `tests/offer.browser-test.mjs` | s9 green (16, or C3's count) |
| NEW timeline suite | `tests/timeline.browser-test.mjs` | §5.2, all green |
| the one clock | `take-in-bugs` 4/4, `lfo-tension`, `routed-knob`, `history` 39 (the replay judges) | green |
| scopes | `new-project` 8 + `node tools/new-project.mjs --check`; `tools/settings-probe.mjs` | byte-exact; 0 RED |
| occlusion | `frame-occlusion` | 7, plus the timeline scenes |
| hit-probe | `tools/hit-probe-set.mjs` | 0 reached, with the timeline open and docked |
| keys | `keyboard-window`, `keyboard-shortcuts` | green, with the timeline's rows present |
| ms/s | A-M `tools/perf/main-thread.mjs`: interleaved base / tip, 3 runs each, load under 4, the notice dismissed | \|Δ median\| ≤ 3.536 ms/s against MEASURE §2's footing (37.335 ± 1.768), first with the TIMELINE window CLOSED, then OPEN and docked at the bottom while playing (the playhead's paint per tick) |
| precache | `pwa` | ≤ 8 MiB. Expect about +0.25 MiB: the timeline's 23 unprecached modules (199 KB), `render/panel.js` (33 KB), `core/assets.js`, `shell/clipboard.js` |
| wiring, node | `bash test.sh node` | as at launch |
| lines | `cat lab/*.js \| wc -l` | §5.3 |

### 5.2 The NEW timeline suite

The kit's own proofs (TIMELINE.md:247–254, RENDER.md:136), re-aimed at λWAVES. Real input; every press hit-tested.
1. WINDOW › TIMELINE opens it, docked at the bottom of the span. Closed or open, idle, it costs no frame (zero rAF).
2. THE play's edge: the pill's ▶ and Space start t AND the playhead; pause stops both. Five boots and NEW play with no refusal
   (take-in-bugs' law). The ruler's seek moves the beat, not t.
3. A clip placed: hold the CAMERA's YAW arc for 500 ms → TIMELINE CLIP → CREATE AUTOMATION CLIP. While playing, `obs.yaw` follows the
   curve at the playhead's beat, and a seek previews it while paused.
4. PLACE ONE PERIOD → a period clip at beat 0, ACTIVE over it, the card on TIMELINE · ACTIVE with MODULATION OFF. RENDER (a real tap)
   → λWAVES' frame log equals `captureUI.loop()`'s digest for digest, and the MP4 bytes are equal. That is "a RECORD of the ACTIVE range
   equals ONE PERIOD's bytes when the clip is the period".
5. The card's STILL at 6 s, 30 fps, CURRENT, MODULATION OFF and TIMELINE OFF → its digests equal `captureUI.record()`'s (C7's RECORD).
   With PNG FRAMES, the ZIP's frame pixel hashes equal the same film's.
6. MODULATION ON with a routed LFO → frame zero is time zero, and two runs are identical (C7's H6, now through the card).
7. **The stored rows.**
   - CANCEL at frame 75, then reload → RECOVER COMPLETED FRAMES hands over a valid MP4 as a download (the activation is spent after
     `finalize`).
   - A second cancelled film → RESUME WITH MATCHING PROJECT finishes it, and its frames equal an uninterrupted run's.
   - A third, after a state change → RESUME is refused with the kit's sentence (`signature`).
   - DISCARD STORED RENDER removes its OPFS directory.
8. A scrub is refused while a film runs (`busy`), and Escape cancels the film.
9. **Undo.** A clip edit is one row of the timeline's undo; a λWAVES knob undo leaves the arrangement alone; a project open replaces the
   arrangement; NEW clears it.
10. A project with an arrangement saves, reopens and serialises byte-identically. NEW and the 4 demos carry no `timeline` key.

### 5.3 Lines (the tree is at 29,863 on `c83b7ee`; the bar is 30,000)

| | estimate |
|---|---|
| rack.js: the CAPTURE group and the hover's caller | −171 |
| render-exact.js: MOTIONS and the timer | −10 |
| createFilm's card road: THE TIME LAW, `take()`, `nameFor`, `last` | +45 |
| rack.js: the timeline and its seam, `paintHead`, → TL, serialize/restore, the occlusion provider, the ACTIONS row, the registration, the facade, the `LW` members | +30 |
| `lab/film-card.js` (new) | +60 |
| mod-port.js, settings-store.js | +5 |
| **hand-written** | **≈ −41** |
| `lab/sw.js` (generated: about 26 newly reached kit files) | ≈ +26 |
| **net** | **≈ −15 (band −50 … +20)** |

**Said plainly: C7b is line-neutral.** It removes the film's own UI and adds the timeline window, the period clip and the card's
wiring. For about zero lines it buys the stored-render rows, the preview, the self-test, the two-tap picture and the timeline itself. If
the build lands positive, these pay, in this order:
1. Re-aim film-probe and offer s9 at createFilm's `take()`, and drop the facade's three verbs (−8).
2. Brief B3, `describe(spec)` (−4).
3. Brief B1, `defaults` for every row; the first-run seed goes (−3).
4. Brief B4, one recorder (−3, or the 8-line proxy).
5. Brief B7, app rows in the timeline's ⋯: the PERIOD section shrinks to one row (−9).

## 6 · Rulings for Josh (one line each, with the default taken)

- **R1.** The TIMELINE window ships CLOSED on first run, and opens docked at the bottom. Default: closed.
- **R2.** The RENDER card ships CLOSED on the right rack, listed in + and WINDOW, as ATOMS does. Default: closed. The alternative is
  open under CAMERA, where the film's buttons were.
- **R3.** ONE PERIOD keeps a button: PLACE ONE PERIOD places the span clip and arms the card, and RENDER makes the film. Default: yes.
- **R4.** AUTO-ROTATE is not a clip: in TURNTABLE it keeps riding every film as C7's pose path, unless a yaw clip is in the take.
  Default: not a clip.
- **R5.** With the timeline, the modulation resumes exactly where it paused, with no BPM-grid re-quantise on play. Default: take it.
- **R6.** The card's MODULATION OFF is the kit's FREEZE THIS LOOK (the values on screen at the tap), not C7's "every target back to its
  base". They differ only while the rack runs at the tap. Default: the kit's.
- **R7.** The first-run film choices are C7's, seeded once: 6 s, CURRENT (the canvas size), modulation ON when MOD is armed — Josh's
  10-09 defaults — not the kit's 60 s, 1080p, OFF. Default: C7's.
- **R8.** TAKE A PICTURE becomes the card's two taps, CAPTURE IMAGE then DOWNLOAD IMAGE, so the save runs inside a live tap. Default:
  yes.
- **R9.** There is no ▶ in the timeline's work bar; λWAVES' pill stays the one transport (C3 §4). Default: none.
- **R10.** Film files keep λWAVES' names (state, size, fps, frames, T), not the kit's. Default: λWAVES'.
- **R11.** The ruler does not move ψ(t) live, and a period clip loops only in a film. Default: films only in 0.5.0; coupling the two is
  a 0.5.x question.

## 7 · Brief candidates for MIR

- **B1.** `createRenderView({ defaults })` for every row (`durationS`, `offsetS`, `size`, `format`, `modulation`, `timeline`), not only
  `fps` and `motion`. Today the other rows read only localStorage (panel.js:183–193).
- **B2.** `picture.label` or `picture.scales`, for an app whose picture choices are scales. The row is labelled FORMAT (panel.js:116).
- **B3.** `describe(spec)`: hand the run's plan to `describe` (recorder.js:228), so an app can record what a RESUME needs without
  reading the lab at an unannounced moment.
- **B4.** A FREEZE with nothing driven writes nothing (render/clock.js:72; C7's open item 1). One recorder then serves the card.
- **B5.** A per-step hook through the seek, `step(frameIndex)` beside `clock.frame(i)` (recorder.js:278–282, 286). An app's own
  integrator (λWAVES' t under RATE automation, the rotor rates) could then follow a range that starts after beat zero.
- **B6.** `recoveries()` lists jobs that have no files and no checkpoint (the early-cancel leak, C7-VERIFY 8e), plus a store sweep
  (C7-FIX's candidate 2).
- **B7.** An app's own rows in the timeline's ⋯ menu, beside ADD AUDIO…. PLACE ONE PERIOD belongs there.
- **B8.** Automation WRITE: record a registered target's hand moves into a clip while playing. That is "the hands" as a pose path.
- **B9.** Make `createTransportController`'s `setExactResume(true)` (controller.js:26) an option, and give it a row in TIMELINE.md's port
  table: installing the timeline changes the modulation's resume law.
- **B10.** TIMELINE.md should name the minimal `mod` an app hands without `installModulation`: `host`, `registry`, `play`, `arm`,
  `armed`, `onPlay`, optionally `setTimeline` and `onTick`. λWAVES is the first such app.
- **B11.** Say whether a `selfTestStages` stage may run a film through the same recorder, given the module's one-run `busy`
  (recorder.js:82).
- **B12.** Retire C7's open item 3 ("an option to hide the timeline motions"): adopting the timeline makes it unnecessary.

C7-FIX's saveBlob brief (check `navigator.userActivation` before sharing) stays filed as it was.

## 8 · Open items, and what is not verified

- **No ms/s number yet** for an open, playing timeline (the playhead's paint per tick). Step 2 and step 3 measure it.
- **The occlusion cap.** The block keeps the first 32 rects. Many lanes plus the rack can reach it, and then the rack's stand-in takes
  over. C8 (brief 8's `paintedSpace`) is the answer.
- **A word clash.** The HISTORY card says "the timeline from before the last history jump" (rack.js:3729, 5069, 5071). That is a
  different "timeline"; "the history line" would avoid it. Josh's words, so not changed here.
- **The STAGE TEXT at the foot** should move from under a bottom-docked timeline, as it does for the docked transport. Check by eye.
- **The phone.** The kit's window set places the timeline on a phone; not measured.
- **The iPad and WebKit.** The kit's timeline is proven in Chromium only (TIMELINE.md:250, 260); λWAVES' gates run in Firefox. The
  two-tap picture and the share sheet are unproven on a device.
- **A held dial.** A still 500 ms hold on any routed dial now opens TIMELINE CLIP (knobs.js). Josh will feel this. `mir-controls` and
  `routed-knob` drag, so they should stay green.
- **Boot cost.** The timeline is built closed at boot (C4's open item on `place()`). If the device report regresses, install it lazily
  instead (on the first open, the first TIMELINE motion, or a project that carries an arrangement), with the recorder's `editor` as a
  getter.

## 9 · The exact next step

After C3 merges into `sos-s0`, the integrator launches the C7b builder (Opus) from the merged tip, with this file as its brief. It works
in its own worktree, on ports 8913 / 5383 for the tip and 8917 / 5387 for the base copy (`git archive <start sha> lab tools`). It makes
§4's four commits, commits `C7B-HANDOFF.md` after each, and never merges, pushes, tags or deploys.
