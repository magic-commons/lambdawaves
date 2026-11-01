# Modulation, the clock and the timeline

The paragraphs below were moved verbatim from CLAUDE.md at 021 D2 and keep their iteration tags; where an older line names a file, a seat or an id a later iteration retired, the later law wins, and the laws of 021 stand first.

## The laws of 032 (TIMELINE REDUX, MIR 1.5.6-alpha.21 … 28)

THE ARRANGEMENT WINS WHERE IT PLAYS (alpha.21 · alpha.27): two clips on one target — the highest lane, then the earliest start; under a clip its value is the target's (a device's routes on it stand aside; a hand macro still layers); off a clip the device plays as before; →TL bypasses the device it sent. THE LOOP (alpha.25): the timeline loops while it plays — the ruler's range › ACTIVE › the clips' extent › free run; a film never loops (λWAVES passes no controller of its own: the kit's loops). ONE MODIFIER TABLE (alpha.23): Shift selects and fine-tunes (⅛ on curves, tension and knobs), Ctrl shapes (the ruler's vertical drag zooms about the pointer, its horizontal half scrubs snapped; Ctrl on a clip's body clones, on its edge stretches keeping the shape, Ctrl+Shift at ⅛; Ctrl locks a point's time), Alt bypasses Snap and deletes a point; the value lock is gone; the pencil stamps the clip last pressed. THE WORK BAR (032 T8 · T4): its power seat wears MOD (the kit's word face, dressed as its door is; the modulation window keeps the power ring) and beside t a second reader, TIME, the playhead's beat as m:ss.d at the tempo in force (`formatSeconds`), painted with t.

AN EVENT IS A STEP CLIP ON A BANDED TARGET (032 T23): a segmented row, a switch or the 140 grid that offers CREATE EVENT names a target (`data-event`, its options `data-v`; lab/shell/modulation.js) — `material.style` (the seg's visible styles: nine under MOLECULES, eight off), `material.view`, `material.space`, `material.slice.mode`, `state.scale`, `state.index` (the register as one of the 140 — written only where a TIMELINE clip says that state, so a base, a restore or a film's frozen look never empties the register), `palette.index`, and the toggles `action.view.frame` · `action.view.axis` · INFORMATIONAL's `action.view.*`; an `integer` row's `options` cut its 0…1 into equal bands (an option's value is its band's centre), a set takes the control's own road. CREATE EVENT (`event.create`) is the kit's `createClip`: a HOLD clip at the band in force that remembers its band count; when the count moves (MOLECULES off takes ESP away) the clip wears ⚠ until a point is edited (the seam repaints at once). COPY VALUE (`event.copy`) puts the pressed option's band centre where a point's PASTE VALUE reads it. An older curve on a banded target (no `steps`) is re-read on the open road (`liftBands`: its k / (max − min) integers, BALLS / STICKS as SHELL), and the conductor writes `steps` on its banded lanes.

A HEAVY SWITCH HOLDS THE PLAY (032 T24): while the modulation clock plays and the busy count is up (busyWrap brackets every worker call: a solve, a basis), the realtime pump is held through the scrub's door (`host.clock.suspendRealtime`) and released on the count's zero (`busy.onHold`, lab/busy-mark.js); a film steps frame-exact and is untouched (a RENDER pressed during a hold waits for the count's zero).

## The laws of 021

ONE TIME (021 R3): `clock.seek(t)` (= `appPlay.seek`) is the only writer of t outside `advance`; under PLAYBACK LOCK the modulation clock (`host.clock.step`) and `rotStep` step 1/hz on ψ's tick; the two ⏮ say what they move; one position is a 1.5.6 door. A SCRUB drag keeps the shadow trail (`seek(…, { trail: false })`); the other writers clear it (R6).

THE CHORD answers the ONE AUTHORITY (`suspend('page')`/`resume('page')`; filmHold `'film'`); it owns no visibility listener. (021 G5)

## The standing paragraphs

The modulation port is `lab/mod-port.js` (the object `createModulation(port)`
takes, key for key with MIR 1.5); THE play is `onePlay` in `lab/clock.js`, and
the modulation follows every edge of it, armed or not (the MOD power is a route bypass), holding the kit's
`demand('app.play')`, so a play is never refused for want of a route or an open
editor (0.5.0 A5/A6; LINKED/SEPARATE retired at C4 — one clock, no link).

MIR 1.4.2 restores FL Studio's curve workflow: right-drag empty space adds and
places a point; Shift-right-click adds at the curve's current value; left-drag moves a point or tension handle; Ctrl fine-tunes
tension; right-click resets a tension handle; Alt-left-click deletes a point;
Shift locks a moved point's value and Ctrl locks its time. Plain left-click on
empty space is inert. A deterministic analytic wave becomes its equivalent
editable curve on first edit and must never demand a preset first.

MIR 1.4.3 starts a new LFO on the editable SINE preset. An explicitly chosen
analytic wave or an older saved source retains its mode. Double-clicking an
LFO or ENV tension handle resets that segment's tension, as right-click does.

Run `bash test.sh node` and the focused curve/impulse browser regression before
shipping modulation edits. Keep `tests/render-regressions.browser-test.mjs` as
the permanent guard against the paused-redraw, scaled-hit-test, and impulse
overlay regressions.

The modulation window's two work bars wear the kit's seat standard (iteration 015 T2): `.tbtn` round seats on the preset bar, `.tbtn.trig` keys for TAP · WALL | FREE · 60 | 120 HZ · HOLD ¼ · HOLD 1, the BPM the kit's pill (modhost.css § THE WORK BARS; skin.css reverts λWAVES' `.tbtn` inside them); THE MAGNET (015 T5): with the TIMELINE open the window sits on it, centred, through the kit's `stackAbove` (mod-port `onOpen`), follows every timeline layout, and a hand's drag releases it until the next open. The modulation window is MIR's `createModulation(floats, port)`
(`lab/mir/modulation/window.js`) over A5's port (`lab/mod-port.js`: no
`targets`, `dock: false`), not `installModulation` (a second tick and a device
copy of the rack). There is ONE clock (R-B1): THE play's edge plays or pauses
the modulation on every edge (`mod.follow`, holding the `app.play` demand).
The MOD power (the button, Ctrl+Space, the window's seat) is
`setModulationEnabled`, a route bypass: power never plays and play never
powers. LINKED/SEPARATE and `clockLink` are retired; the tempo grid has eight
tiles. The power and cadence (`modArm`, `modCadence`) are PREFERENCE in the
kit's record `lambdawaves.q0.modulation` (`lab/shell/controller.js` `modStore`/`saveMod`,
bind.js `localStore`), never in the settings blob. `lab/modwindow.js` and
`lab/audio.js` are gone; the kit's `audio-capture.js` is the capture.
(0.5.0 C4)

THE FLASH GUARD's LIMITER (0.5.1 D10-19, PARTIAL) is `guardRoutes` in `lab/mod-port.js`: the kit's `createFlashGuard` on exactly
four routes — `material.exposure`, `material.gamma`, `material.stage`, `material.knee`, each in its map's own space (`FLASH_STEP`, `material.knee`'s step taken at the default KNEE 3 — 0.4902 in ln KNEE, 0.2723 at 0.6 (008 Q);
derived by `tools/flash-calibrate.mjs` from `field.js`' tone formulas and held to it by `tests/flash-routes.test.mjs`) — holding a
route a MODULATOR drives to 3 flashes a second on the modulation clock's own seconds (a hand on an UNROUTED dial and a stop's
restore are never held; a hand on a ROUTED dial moves the BASE and the modulator's next output carries it through the guard, so that
picture IS held — a flash is a flash whoever makes it, and the dial's base is not fought), said once in METERS' status (`FLASH GUARD · EXPOSURE 10.0 Hz held to 3/s`); `material.hue` and every other route are never
held. It does not see `reg.morph`, `chem.kick` or the camera: only THE FIELD JUDGE (a 64² luminance readback per frame, a frame-path
row, 0.5.x) does. A held route whose modulator goes constant is let go after the guard's quiet second — `guardRoutes` hears the
clock's `onAdvance`, on the modulation's own seconds, so a film lets go on the same frame — handed the registry's current value, with
the line cleared (FIX ROUND 2, D-V S1). THE PHOTOSENSITIVITY LAW (the notice, C6b) is unchanged.
