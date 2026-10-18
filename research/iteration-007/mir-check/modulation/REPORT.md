# MIR check · THE MODULATION WINDOW as a λWAVES user meets it (iteration 007)

Read-only investigation, branch `yan-c` @ `81625da`, 2026-10-18, headless Firefox through the repo's own gate kit
(`tools/gate/server.py` on 8721, geckodriver on 5221). No source edited. Machine heavily loaded (load average about 19 on 12 cores).
Line numbers are at `81625da`. Mid-run, another session committed `3b5e926` and left an uncommitted edit to `lab/shell/keys.js`
(TIMELINE undo rows). That edit only shifts the block cited in B1 by 9 lines (now `keys.js:183-185`) and does not change it.

**Counts: 34 WORKS · 3 BROKEN (2 user-facing, 1 API-only) · 8 POLISH · 1 FLAKY-UNDER-LOAD · 1 N/A (macro-of-macro: the kit has no such thing).**

Note: `lab/modwindow.js`, named in the brief, no longer exists. It was retired at 0.5.0 C4 (CLAUDE.md). The λWAVES side of the seam is
`lab/mod-port.js` (the port) plus `lab/shell/modulation.js` (the `defs` table and `createModulation`). The window is the kit's
`lab/mir/modulation/window.js`.

## 1 · Suite results

| suite | result | rows |
|---|---|---|
| `tests/routed-knob.browser-test.mjs` | GREEN 4/4 | K0 boot · K1 a routed dial stays centred, ring concentric, no badge untouched · K2 touch gives that control its range dial and ×, no other · K3 held press opens pop-over with REMOVE, × removes the route |
| `tests/mir-controls.browser-test.mjs` | GREEN 2/2 | ONE KNOB LAW (vertical drag, ⅛ fine gear, bounds) · opt-in sensitivity, log faders, display/base values, reset defaults |
| `tests/curves.browser-test.mjs` | **FLAKY-UNDER-LOAD** | Row 3 went red in the batch run: "an S-curve on MASTER changes the screen". The driver screenshot hash was identical before and after (2502273985), so the screen had not repainted within the 300 ms wait. It passed 7/7 when run alone. (This suite tests the colour-grade CURVES card, not the modulation curve.) |
| `tests/lfo-tension.browser-test.mjs` | GREEN 3/3 | new LFO = editable SINE · real double-click resets an LFO tension handle · real double-click resets only the ENV segment |
| `tests/render-regressions.browser-test.mjs` | GREEN 2/2 | FL curve gestures (left-empty inert, right-empty adds, Shift-right keeps level, handle drag bends) · impulse overlay clears |

**Test gap:** routed-knob K3 removes the route with a synthetic `x.click()`. With real pointer input the × does not work (B1),
so the suite stays green while the user-facing gesture is broken.

## 2 · Behaviours

All gestures use real WebDriver input (mouse, plus one touch case) unless the row says API.

| # | behaviour | verdict | evidence |
|---|---|---|---|
| 1 | Open the window: the transport pill's mark, and key M | WORKS | `__LW.mod.expanded` true after a real tap and after a real `m`; 716→1083 px law geometry; rail "MODULATION window controls", 5 chips; no console errors |
| 2 | ADD DEVICE → menu ADD LFO / ADD ENV / ADD AUDIO; a new LFO | WORKS | Real taps add `s3:lfo`: mode `curve`, wave `sine`, 5 points, SINE preset lit; one undo row "ADD LFO · MODULATION" |
| 3 | Bind a device to a macro by tapping its macro chip (`--` → 1 → 2 → `--`) | WORKS | `m1<-s3`; the macro row reads "LFO s1"; a bound macro's value ignores a hand drag (locked) — see P1 for its undo-row label |
| 4 | Route by DRAGGING a macro grip onto a knob | WORKS | grip → ZOOM: route `m1→observer.dist`, ring on the dial, row "ROUTE MACRO 1 · MODULATION" |
| 5 | Route by TAP-TO-ARM (tap grip, tap a lit control) | WORKS | Status "ARMED: MACRO 1 — tap a lit control…"; 26 controls `.mod-drop`; taps routed EXPOSURE, HUE, YAW, RATE, CLIP POS. The arm survives a scroll of the rack. |
| 6 | The same macro onto the same control twice | WORKS | No second route made |
| 7 | Default range by the base's position | WORKS | EXPOSURE at 50 % → bipolar CENTRE `[0, .992]`; HUE (wrap) → whole turn; ZOOM above 50 % → DOWN `[.533, 0]` |
| 8 | Several targets per macro | WORKS | One hand drag of MACRO 1 moved EXPOSURE 1→1.571, HUE 0→0.182 and ZOOM 3.3→2.746 together; an LFO on MACRO 1 moves them all while playing |
| 9 | Unipolar / bipolar: pop-over RANGE CENTRE / UP / DOWN | WORKS | Real taps: CENTRE `bi`, DOWN `[.504,0]`, UP `[0,.496]`; each a history row |
| 10 | Macro master depth (vertical drag on the numbered seat) | WORKS | depth 1 → 0.727, row "MACRO 1 DEPTH · MODULATION" |
| 11 | Route depth on the touched control's range dial | WORKS (value) / see **B1** | ZOOM route min .533 → .079, row "RANGE · CAMERA"; but the dial vanishes under the pointer as the drag starts |
| 12 | Remove a route with the × on the touched control | **BROKEN — B1** | The press lands on the ×; the release and click land on the knob; the route stays (mouse and touch) |
| 13 | Remove via the pop-over REMOVE / REMOVE ALL | WORKS | ZOOM route gone, value back to its base 3.3; REMOVE ALL puts EXPOSURE back on the hand base 3.92 |
| 14 | Delete a macro (row ×): its routes go with it | WORKS | 3 routes removed, nothing held, EXPOSURE back on its base; undo restores `m1`, `m2` and the 3 routes |
| 15 | Undo / redo of route edits (Ctrl+Z / Ctrl+Shift+Z, real keys) | WORKS | REMOVE undone → route back; macro delete undone; curve delete undone. `history.browser-test` also proves a grip-drag route is one row |
| 16 | PLAY: LFO → macro → targets; the routed knob's ring and `.mod-held` | WORKS | ZOOM 3.30 → 3.21 over 1.8 s while MACRO 1 rose .01 → .26; `held` = ZOOM; `.mod-held` on its dial |
| 17 | MOD power (transport MOD, the window's power seat, Ctrl+Space) | WORKS | Off: armed false, still playing, every target on its base (EXPOSURE 1, ZOOM 3.3), lamp and seat off. On: modulation picks up in time. Ctrl+Space toggles. Stored `{"modArm":…}` in `lambdawaves.q0.modulation` |
| 18 | Cadence (60 HZ / 120 HZ chip) | WORKS | 60 → 120 → 60; stored `modCadence:120` in the PREFERENCE record, absent from the settings blob; survives a reload |
| 19 | MOD power and cadence survive a reload | WORKS | After reload: armed false, lamp off, cadence 120 |
| 20 | FLASH GUARD | WORKS | A 3 Hz LFO, full UP range on EXPOSURE: picture held off the registry value in 3 of 30 samples; METERS reads "FLASH GUARD · EXPOSURE 3.0 Hz held to 3/s"; HUE never held; the line clears and EXPOSURE returns to base after stop. See P3 for where the line shows |
| 21 | A hand on a ROUTED material/camera dial moves its BASE | WORKS | EXPOSURE routed, hand drag: base 1 → 3.92 while the modulator held 12 |
| 22 | A hand on a ROUTED `chem.*` / `reg.*` dial | **BROKEN — B2** | κ: hand wrote 5.3e-3, base stayed 1e-3, and the next modulator write took κ to 1e-2: the edit is lost |
| 23 | Curve: plain LEFT click on empty space | WORKS | 5 points before and after, same hash |
| 24 | Curve: RIGHT-drag on empty space adds and places | WORKS | +1 point at (0.339, 0.253) where the drag ended; row "CURVE · LFO 1 · MODULATION" |
| 25 | Curve: Shift-RIGHT-click adds at the curve's value | WORKS | Added (0.621, 0.862) against curve value 0.864. A click within a tension handle's hit radius resets that handle instead (by design) |
| 26 | Curve: left-drag a point; Shift locks value; Ctrl locks time | WORKS | Plain moves t and v; Shift keeps v = .075; Ctrl keeps t = .407 |
| 27 | Curve: tension drag; Ctrl fine; right-click reset; double-click reset | WORKS | The same 30 px: plain −0.234, Ctrl −0.029 (≈⅛); right-click → 0; double-click → 0; point count unchanged |
| 28 | Curve: Alt-LEFT click deletes a point | WORKS | 6 → 5 points; one row; Ctrl+Z → 6 |
| 29 | `chem.kick` / `chem.speed` as targets with MOLECULES off | WORKS (API route, user dial hidden) | Route writes κ 1e-3 → 1e-2 and SPEED 10 → 49; dial text follows. In ATOMS mode the dials sit in a hidden fold |
| 30 | `reg.morph` (the STATES register's A↔B) as a target | WORKS / see P4 | Route writes `states.morph` = 0.700 and the dial reads 0.700, while MO-REGISTRY is in ORBITAL mode and nothing visible changes |
| 31 | Macro-of-macro | N/A | No macro is a registry target (`targets()` has no `m*`; `.m2val`/`.m2numseat` carry no `data-param`). The kit does not offer it |
| 32 | Routes in a PROJECT: FOLDERS save during playback → NEW → open | WORKS | Saved with EXPOSURE at 0.083; reopened paused with 3 routes, 3 rings, EXPOSURE base 1 and ZOOM base 3.3 (the hand values, not the frame) |
| 33 | `__LW.serialize()` → `mod.reset()` → `__LW.restore()` | WORKS | Routes, rings and `.has-ring` all back; `v: 108` stamped |
| 34 | RESUME after a reload (`?starter=resume`) | WORKS | 3 routes, MACRO 2 value 0.3 and rings back |
| 35 | →TL on an LFO | WORKS | Unrouted: refused, no clip. Routed: "one cycle → timeline · 5.406 beats at beat 0" |
| 36 | 600 ms hold on a routed dial vs an unrouted dial | WORKS | Routed EXPOSURE → ring pop-over (RANGE, REMOVE, REMOVE ALL); unrouted GAMMA → TIMELINE CLIP (CREATE AUTOMATION CLIP, LOCATE CLIPS) → a clip, timeline opens |
| 37 | ENV on a macro | WORKS | Bound ENV fires on PLAY (macro 0.54 → 0) and drives SOFT 1.52 → 0.70 (its base) |
| 38 | `__LW.mod.unroute(id)` (API) | **BROKEN — B3 (API only)** | Route gone, but EXPOSURE stays at the modulated 12 while its dial reads the 3.92 base |

## 3 · BROKEN, in detail

### B1 · The routed dial's × and range dial vanish on press: the × removes nothing (real mouse and touch)
- **Repro:** route MACRO 1 onto HUE (WAVE card) → click HUE's dial (the range dial and × appear) → click the × with the mouse.
- **Expected:** the route is removed and HUE returns to its base, as `routed-knob` K3 asserts.
- **Actual:**
  - The × and range dial disappear at pointerdown and the route stays. Event log: `pointerdown:k-route-x`, then `pointerup:k …has-ring`, `click:k …has-ring`.
  - Touch is the same: the pointerup lands on the ×, but the click lands on the knob.
  - Pressing the range dial hides it too: mid-drag the badge is `display:none` (screenshot 16). The drag still edits the depth, blind.
  - No console errors.
- **Cause, in λWAVES glue:** `lab/shell/keys.js:174-176`.
  - On a routed `.k[data-param]`, a window-capture `pointerdown` handler strips `data-param` for one event (the TIMELINE CLIP hold guard, brief B13).
  - It puts the attribute back from a `document` capture listener added during the same dispatch, so that listener runs after the kit's `focusAway` (`lab/mir/modulation/window.js:1004-1010`, also document capture, registered earlier at window build).
  - `focusAway` therefore sees `k.dataset.param` undefined ≠ `ringFocus` and calls `focusRing(null)`, which hides both badges before the release.
  - A press on the dial itself survives only because `holdForPop` re-focuses afterwards.
  - Instrumented: `win-capture: closestHasRing=undefined/k mod-held has-ring …`, then `cls.remove … window.js:1000 < window.js:1009`.
- **Workaround today:** a 600 ms hold → REMOVE.
- **Test gap:** K3 uses `x.click()`. A WebDriver click on the × would have caught this.

### B2 · A hand on a routed `chem.*` / `reg.*` dial is overwritten and not saved as its base
- **Repro (in the page):** route MACRO 1 (hand, 0.25) onto `chem.kick`, then drag the κ dial up.
- **Expected:** like EXPOSURE, the hand moves the registry base and the modulator carries it.
- **Actual:**
  - The dial writes `kappa = 5.3e-3`, but `registry.baseOf('chem.kick')` stays 1e-3.
  - The next macro move recomputes from the old base (κ → 1e-2), so the hand edit is lost.
  - A project save stores the old base.
- **Cause:** these dials' `onInput` never asks `modHand(id, v)` first. Compare `lab/windows/material.js:31-87`, `lab/camera-law.js:170-193`, `lab/windows/state.js:46/115/120` and `lab/shell/transport.js:29`, which all do. The offenders:
  - `lab/chemview.js:278` (κ: `onInput: (v) => { kappa = v; }`) and `:292` (SPEED)
  - `lab/statesview.js:95-97` (A↔B `morphK` → `setMorph`), `:132` (ω), `:134` (E₀), `:527` (lane phase) and the lane population dials
- **Why it matters now:** this is the exact road the next build's MOLECULES ORBITAL dial and MO-REGISTRY A↔B targets will take (see §5).
- **Exercise note:** the κ dial is in a hidden fold in ATOMS mode, so this repro un-hid it and drove it with synthetic pointer events, as `routed-knob` does.

### B3 · `__LW.mod.unroute()` leaves the target at its modulated value (API only)
- **Where:** `lab/shell/facade.js:129` calls `model.removeRoute(id); modEdited()` and nothing else.
- **What the kit does instead:** its own roads (`window.js` × and REMOVE ALL) also call `registry.restoreBase(id)`, `clock.recomputeRunning()` and `apply()`.
- **Result:** after `unroute`, EXPOSURE stays at 12 while its dial and base read 3.92.
- **Who is affected:** no user door calls it today. Scripts, gates and any future ASK verb that use it would see a stale picture.

## 4 · POLISH

| # | what feels rough | suggestion | size |
|---|---|---|---|
| P1 | Tapping a device's macro chip records an undo row named after the binding it is leaving: "LFO -- · MODULATION" when binding to MACRO 1, "LFO 2 · MODULATION" when freeing | Name the new binding: "LFO s1 → MACRO 1" | S |
| P2 | Undo-row names are inconsistent: "RANGE DOWN" and "REMOVE" lack "· MODULATION"; the range-dial edit on ZOOM reads "RANGE · CAMERA" (the card's name) | One naming law for route edits: "ROUTE RANGE · ZOOM · MODULATION" | S |
| P3 | The FLASH GUARD sentence lives only in METERS' status, and METERS ships closed: the user sees a held picture with no reason given | Also say it once in the modulation window's status line, or mark the held dial (accent B dashed) | M |
| P4 | `reg.morph` routes and moves while MO-REGISTRY is in ORBITAL mode or MORPH is off: ring and number move, stage unchanged, no sign | Show the route as dormant ("MORPH is off"), or refuse the arm-tap with a sentence | S–M |
| P5 | 22 of 48 registered targets have no dial (`shell.rate.n1-6`; `reg.amp1-8`/`reg.ph1-8` until STATES lanes exist): there is no target picker, so a hand cannot route them | A "ROUTE TO…" list on the macro row from `registry.describe()` (needs a kit change, then adopt) | M |
| P6 | The window grows with each device (1083 px at 3 cards on a 1500 px viewport) and covers the right rack's knobs — the very targets one arms for (screenshot 03) | While ARMED, dodge or shrink the window (compact mode), or seat it away from the rack it would route to | M |
| P7 | The route pop-over seats 14 px under the press, over the control's own header; its frosted glass lets the knob's value bleed into the title ("EXPOSURE MACRO 1.00") and it gives no depth number (screenshot 04) | Seat it beside the control; opaque header; show lo … hi | S |
| P8 | Deleting MACRO 1 silently renames MACRO 2 to "MACRO 1" (undo restores both names) | Keep names stable, or say "MACRO 2 is now MACRO 1" | S |

## 5 · ADDING A TARGET (for the MOLECULES ORBITAL dial and MO-REGISTRY's A↔B)

How a target is declared and bound today, end to end.

**1. Declare it in the ONE `defs` table:** `lab/shell/modulation.js:29-149`, inside `createModSeam(app)`.
- Each entry is `{ id, label, unit?, map: 'linear'|'log'|'bipolar'|'wrap', min, max, def?, group, hint?, knob: () => kitKnob|null, get: () => number, set: (v) => void }`.
- The models to copy are `chem.kick` (`:120-122`), `chem.speed` (`:123-125`) and `reg.morph` (`:129-131`). They are null-safe on `app.state.chem` / `app.state.states`: `set` stores the number, then mirrors the dial with `setKnob(knob, value)`, which paints rather than sets while routed (`lab/mod-port.js:85`).
- The id's root must be in the `roots` list `mod.install(defs, ['observer','material','state','transport','field','chem','reg','shell'])` (`:154`). `chem.orbital` and `reg.ab` need no new root, and a saved route is addressed by that id forever.
- Setters must be PRESENT-only (store a number, schedule nothing heavier). The comment at `:115-119` deliberately refused the ORBITAL INDEX because it "changes WHICH quantity the volume means". A MOLECULES ORBITAL target reverses that ruling, so it needs Josh's yes, and a rebuild-tier setter will stall an LFO.

**2. Install and stamp:** `lab/mod-port.js:113-138`.
- `install` wraps the defs in the flash guard (`:115`). Only the four `material.*` luminance routes are held, so a new target is not guarded (CLAUDE.md: PARTIAL).
- It registers them with the kit host (`:117`), keeps `knobs[id]` and `gets[id]` (`:118`), and stamps a frame later (`:119`).
- `stamp()` (`:135-138`) writes `data-param=<id>` on the dial's root and hands it `setBase`. **`data-param` is what makes a dial routable**: arm-tap, drop, ring (`window.js` `ROUTABLE` `:70`, `dialOf` `:895`). It is also what makes it a TIMELINE CLIP target (`lab/mir/timeline/knobs.js:29`).
- A dial built after boot must re-stamp itself: `app.state.restampParams`, as MO-REGISTRY's lanes do (`lab/windows/molecules.js:93`).
- `.mod-held` dresses the dial while modulated (`:120-126`).
- Without a reachable `knob()` the target is picker-less (P5), but saved routes and the API still work.

**3. Wire the dial's hand road (the step today's chem/reg dials miss — B2).** The dial's `onInput` must start with `if (app.ctl.modHand('<id>', v)) return;` and only then apply the value, as `lab/windows/material.js:31` does. Otherwise a hand on a routed dial is overwritten and never becomes the saved base.

**4. Automation lane.**
- There is no per-target lane code. The TIMELINE is the clock's automation over the same registry: `lab/shell/keys.js:159-160` `installTimeline({ mod: { host, registry, … } })`, and `lab/mir/timeline/bind.js:39-48` `setAutomation({ value: (id, beat) => model.value(id, beat) })`.
- A 600 ms hold on an UNROUTED stamped dial opens TIMELINE CLIP → CREATE AUTOMATION CLIP, which makes a clip keyed by the registry id (`knobs.js:10-44`). →TL on a routed LFO sends one cycle onto its target (`window.js:2269-2296`).
- So a declared, stamped, hand-roaded target gets its lane for free.
- Mind `keys.js:174-176` (B1): a routed dial's hold goes to the ring, an unrouted dial's to TIMELINE CLIP.
- A clip's id survives a reload only if the id is stable (`installTimeline`'s `remap` otherwise).

**5. Save/undo come free:** the rack rides in `presentation.modulation` (`lab/shell/persist.js:62`), and FOLDERS adds the base table (`lab/shell/notebook.js:207-221`). Then:
- add the new value to `modSeats` if the instrument's own save also holds it, so bases are mirrored;
- run `node tools/new-project.mjs --check` if a default moves.

**MO-REGISTRY has two A↔B dials:** `lab/orbitalsview.js:116` (ORBITAL mode, **not a target today**) and `lab/statesview.js:95` (STATES mode = `reg.morph`). Pick a new id for the ORBITAL one rather than reusing `reg.morph`, so saved routes keep their meaning.

## 6 · Could not exercise headless
- **AUDIO devices:** needs a microphone and permission.
- **Touch beyond one tap:** the 320 px finger drag law and long-press timing feel on a real tablet. Only the × by touch was tried (B1).
- **The human opener's RESUME choice:** a WebDriver start always boots (`lab/main.js:49`). RESUME was forced with `?starter=resume`.
- **Photosensitivity:** the field-judge side and how a held flash *looks*. The GPU was pinned by solvers, so frames were slow and the screenshot is only indicative.
- **Docking the window to the bottom by dragging it, and phone/tablet seats:** not attempted.
- **The κ / SPEED dials by real input:** they live in a hidden fold in ATOMS mode. Switching to MOLECULES mode starts a solve on an already saturated machine, so B2 was driven with synthetic events on the un-hidden dial.
- **Where →TL's refusal sentence for an unrouted device appears:** no clip was made (correct), but the sentence was not found.

## 7 · Screenshots (this folder)
`01-window-open.png` · `02-lfo-added.png` · `03-macro-armed.png` (the ARMED sentence; the 3-card window over the rack, P6) ·
`04-route-popover.png` (P7) · `05-macro-hand-three-targets.png` · `06-playing-two-targets.png` · `07-power-off.png` ·
`08-flash-guard-meters.png` · `10-route-x-badge.png` (after the failed ×, B1) · `12-curve-after-gestures.png` ·
`14-timeline-clip-hold.png` · `16-range-dial-mid-drag.png` (badges gone mid-drag, B1)

## 8 · Commands
```
ss -ltn | grep -E ':(8721|5221)'                        # free
python3 tools/gate/server.py "$PWD" 8721 &               # pid kept, killed at the end
for t in routed-knob mir-controls curves lfo-tension render-regressions; do
  LW_PORT=8721 GD_PORT=5221 node tests/$t.browser-test.mjs; done
LW_PORT=8721 GD_PORT=5221 node tests/curves.browser-test.mjs   # the lone rerun: GREEN
# walk-throughs (scratch, not in tests/): ~/.config/claude-backup/jobs/8497d75b/tmp/mirB/
#   lib.mjs (gatekit open + drv actions: pointer, modifier keys, wheel)
#   probe1-3 · walk1-5 · arm/arm2/arm3 · xbadge/xbadge2-4 · shift · depth · hand/hand2 · kdial · resume · rack · dom
LW_PORT=8721 GD_PORT=5221 node <scratch>/walkN.mjs
```
