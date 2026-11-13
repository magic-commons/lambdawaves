# Modulation, the clock and the timeline

The paragraphs below were moved verbatim from CLAUDE.md at 021 D2 and keep their iteration tags; where an older line names a file, a seat or an id a later iteration retired, the later law wins, and the laws of 021 stand first.

## The laws of 044

THE RING'S DOUBLE PRESS GOES HOME, THE RIGHT CLICK REMOVES (044 K1; Josh 2026-11-12: "double click returns knob home, right click remove routing is where it's at."; the kit's 1.6.0-alpha.2): MODULATION's coloured arc round a routed knob has no double press of its own. Two presses on it are two presses on the knob under it: the KNOB's value goes home (the base to its default, the menu's RESET road) and the route and its depth stay (until here a double press removed the route). A right-click on the arc removes the route the arc edits, one gesture and so one undo row (Ctrl+Z brings it back); it no longer opens the route's menu. The other roads stand: the × badge, the knob's own right-click and held press (the menu with REMOVE and REMOVE ALL), a held press on the arc. The depth goes to zero by the arc's drag or the small RANGE dial (its own double press is 0). All of it is the kit's `modulation/window.js`; the app has no code of its own here.

## The laws of 041

THE TIMELINE'S MODES IN THE APP (041 T, N7; the kit's alpha.49–51): THE MODE MENU opens on a middle click on the lanes, middle + right, or the bar's MODE chip; the chosen mode is the left button's tool, 040's right-drag delete and Shift gestures stand under every mode (the kit's docs/TIMELINE.md). FOLLOW PLAYHEAD no longer ends on the middle press that opens the menu (`lab/timeline-follow.js`); KEYBOARD lists nine … MODE rows, PAINT · PAINT ADD · DELETE · MUTE · ZOOM unbound; the rack's title pills stand over a docked TIMELINE, the CSB and `#floats` (alpha.50); an empty lane wears no hint (alpha.51, Josh's call 10: "DAWs never have any hints").
A LANE LEAVES ITS LAST VALUE (041 N5, Josh's call 8): when a tick or a film's step carries the playhead over a clip's end onto empty lane, the clip's end value is written as the target's base (`lab/timeline-follow.js` `leaves()`): the knob keeps it until another clip plays or a hand moves it, after a film too; a seek (a locate, the loop's wrap) passes nothing. A modified clip becomes unique and keeps its colour (Josh 11-10; the kit's `makeUnique`, unchanged).
THE SCALE REACHES THE WORK BARS (041 K1, alpha.64): TIMELINE, MODULATION and PATTERN take UI SCALE; MODULATION's `port.moved` / `onMoved` report the window's own px (a dodge comparing them with viewport px multiplies by `--ui-zoom`); `.tl-pop` is a scale root of its own. Not yet walked inside λWAVES at 150 %.

## The laws of 040

EVENTS FOR THE BASIS AND THE VIEW (040 A4, Josh: "Currently I can't make event with basis sets and view mode (orbital, density, mix, etc.)"):
`chem.basis` (MOLECULES BASIS, the ladder STO-3G … 6-31+G* by number) and `chem.view` (MOLECULES VIEW: DENSITY · ORBITAL · MIX · ESP · SPIN ·
Δ LDA−RHF by number) join AN EVENT IS A STEP CLIP ON A BANDED TARGET — their segs carry `data-event`, their buttons `data-v`, so CREATE EVENT and
COPY VALUE stand on them. A set is the seg's own road (`lab/shell/modulation.js`): the BASIS through chemview's `pressBasis` (a live solve, or the
rung an installed volume holds; a greyed rung stands down), the VIEW through `toView(id, true)` — the event is a hand (THE HAND DECIDES THE VIEW).
Both sit under the `chem` root, so MOLECULES' POWER quiets them (038 C1); MODE and `molSession.selected` are untouched.

## The laws of 038 (chain T, MIR 1.5.7-alpha.8 … 12; the fix T8, alpha.14)

THE EMPTY TIMELINE RESTS AT ONE (038 T1, alpha.8; Josh 11-06: "If there are no clips in the timeline, the timeline shouldn't play all the way
to 200+ measures … That way an added new clip will start at beat 1 measure 1"; Yan's call: a loop, not a freeze): with no clip playing, THE LOOP
(032) is the first bar — the ruler's range › ACTIVE › the clips' extent › bar 1 (`model.meter()` beats), never a free run — so the clock keeps
running and the readout cycles 1.1 … 1.4. At each wrap a synced LFO whose period divides the bar is continuous; a dotted one (and 1/1 T) re-phases
(a 1/4 dotted sine jumps from .642 to .003 of a cycle), a synced S&H or drift repeats its bar, and a free (Hz) LFO does not follow the bar (T8's
words; alpha.8 claimed every synced LFO kept its phase). A playing tick already at or past the loop's end (a seek there, the clips cut away under
the head) lands on its start — a ruler range or ACTIVE too: a play started past its end begins at its start (FL's way; Ableton plays through);
CREATE CLIP and → TL place at the playhead's bar start, so the first clip starts at 1.1. A seek, a scrub, a
paused clock and a film still never loop. Under PLAYBACK LOCK the clock is stepped (`host.clock.step(1/hz, { loop: true })`, rack.js) and loops
by the same rule (THE STEPPED CLOCK LOOPS, 039 K1, kit 1.5.7-alpha.17); the film's step passes nothing and never loops.

A CLIP LOOPS A WHOLE MEASURE AT LEAST (038 T4, alpha.10; Josh: "if a modulation rate is set to 1/16, then when placing it onto the timeline, it
should loop for a whole measure"): → TL sends an LFO faster than a bar as n = ⌈bar / period⌉ whole cycles (a 1/16 LFO: 16 cycles over 4 beats); a
period of a bar or longer stays one cycle. A curve source holds at most 256 points (`TIMELINE_MAX_SOURCE_POINTS`), so a cycle's samples shrink with
n (64 at one cycle, 16 at 1/16, 2 at 1/128 — the raised sine's trough and peak); an ENV and a PATTERN send as before. No new field.

THE SELECTION RESIZES TOGETHER (038 T5, alpha.11; Josh: "let them all resize while keeping their position while the key-combo that stretches will
glue their edges together then stretch accordingly"; Yan's call: glue = close the gaps, then scale the block): an edge pressed on a clip inside a
selection of several keeps the selection — a trim moves that edge of every selected clip by the same snapped beats (each keeps its own start on a
right edge); the stretch (Ctrl/Cmd on an edge, Ctrl+Shift ⅛) first closes the gaps between them lane by lane (an overlap stays), then scales the
glued block about its other edge, every curve keeping its shape. One gesture, one undo row; the arrows and Delete still act on the selection.

THE TIMELINE SCROLLS UNDER THE POINTER (038 T3, alpha.9; Josh: "Scroll on timeline doesn't seem to work. If I drag the playhead back or forward,
it should scroll the timeline as well"): a plain wheel over the timeline scrolls time while the lanes fit (more lanes than fit: it scrolls the
lanes), Shift + wheel always scrolls time, Ctrl/Cmd + wheel zooms; a scrub (the playhead's drag), a range, a move, a trim or a stretch held within
28 px of the lanes' left or right edge, or past it, scrolls time while it holds and the gesture follows. THE PUMP WAITS FOR A DRAG (038 T8,
alpha.14, from the fresh-eyes review): it starts only once the gesture has moved past the 6-px slop, so a click or a tap near an edge never scrolls
(a ruler click 10 px inside the edge with 1 px of jitter had scrolled 88 px and dropped the head 4.4 beats right); a scrub's head stays inside the
lanes on view (it waits at the edge while the view scrolls, and stops where the content ends). The wheel lands on the element under the pointer: no
window registry. FOLLOW PLAYHEAD still ends on a wheel. The plain wheel's axis follows the lane count (they fit: time; one lane too many: the lanes).

THE LANES WEAR THE FROST (038 T2; Josh 11-06 reversed 10-19's crisp lanes): each lane is a house `.glass` pane, so GLASS BLUR, FROST · STILL and
CARD STYLE reach it as they reach the ruler and the tool strip; the window's own slab stays clear (lab/skin.css § 012 B1, 014 A5).

A MACRO FOLLOWS ITS DIAL, AS THE RING (038 T6, alpha.12; Josh: "The old macros from the modulation window seems to be reversed!"; Yan's call: the
ring, not the data): ISO, KNEE, SOFT (014 D5) and ZOOM (037 H2) are reversed on screen only — their values, routes, presets and demo curves were
always right — but the modulation window's route ring drew in value space and sat mirrored from the needle. A reversed knob's root wears `k-rev` and
the ring's arcs, tick and spur mirror with it; a rise on the ring grows the arc clockwise, as a rise turns the dial. No file, preset or demo
changes; no migration (WAVE DANCER and STAR LOOP play as before).

## The law of 036

THE ENVELOPE TRIGGER (036 P6, Josh 2026-11-03: "the event's envelope-trigger feature (I think it's built in Basins) is missing in Lambdawaves,
Add that feature in"): BASINS' ENV + PATTERN road, vendored in the kit (`lab/mir/pattern/`: window.js · sequencer.js · model.js, BASINS
`docs/ENV-PATTERN-2026-10-01.md`), installed on THE ONE modulation host by `lab/shell/modulation.js` `installEnvelopeTrigger` (rack.js seats it
after the history). An ENV face wears PATT: it turns that ENV's step row live and opens the PATTERN window — one row per ENV, a 16th note a step
(16 · 32 · 64), a step's LED bar its velocity (FL's gestures: left paints, right clears, a vertical drag sets the velocity), docked on its ENV
device and going with the modulation window (the kit's four laws). THE SEQUENCER rides the host clock's one advance notice (no loop of its own):
every lit step the beats cross fires its ENV (`M.trigger`), the velocity scaling the ENV's macros; nothing fires while stopped; a film steps the
same crossings. A PATTERN clip (an ENV's → TL with a live row) under the playhead rules its ENV over the row (THE ARRANGEMENT WINS WHERE IT
PLAYS). THE ROWS ARE THE PROJECT'S inside λWAVES' one part — `presentation.pattern`, default-absent, restored after the rack (the ENV ids exist)
and before the arrangement, an open replacing them and NEW clearing them; the kit's own `pattern` part stays off (`project: false`, projects.js'
ONE PART law); the one undo stack keeps them as their own snapshot domain (a paint is one row), a row edit dirties the project. The window is
WINDOW › TOOLS › PATTERN (the action `pattern`), its shape the WORKSPACE record `lambdawaves.q0.patternwin`. The conductor writes hits with a
score's `pattern` key (docs/conductor/SCORE.md § The hits).

THE TIMELINE'S OWN ROWS (036 K4, MIR 1.5.7-alpha.4 `installTimeline({ moreRows })`; `lab/timeline-follow.js`, bound in `lab/shell/keys.js`): ⋯ ends,
after a separator, with FOLLOW PLAYHEAD and AUTO-COLOR. FOLLOW PLAYHEAD (Josh 11-03: "the playhead appears to be fixed but the whole lanes move …
disabled the moment a user clicks/scroll anywhere on the timeline (not clicking buttons)") is a choice row, OFF at every open, no stored key: while
on, each present scrolls the lanes BEFORE the head paints, so the head stands where it stood when chosen (pinned inside the middle half of the
view); a loop's wrap jumps the view; a press on the lanes or the ruler (not the middle press that opens THE MODE MENU, 041 N7), a wheel, or any scroll it did not write (the kit's zoom, a new clip, LOCATE,
Shift+0) ends it, a button, a field, the work bar or a rail chip does not; under a film it stands still. AUTO-COLOR (Josh: "'Auto-Color' will
instantly paint the clips to the current active palette (If nothing active, then use HSV)") paints every clip's curve from the active PALETTE,
spread evenly round its wheel in lane-then-start order, or — PALETTE off — the HSV wheel (s .85, v 1) in golden-angle order; AUDIO clips keep their
tint; one undo row (the model's begin/commit).

## The laws of 032 (TIMELINE REDUX, MIR 1.5.6-alpha.21 … 28)

THE ARRANGEMENT WINS WHERE IT PLAYS (alpha.21 · alpha.27): two clips on one target — the highest lane, then the earliest start; under a clip its value is the target's (a device's routes on it stand aside; a hand macro still layers); off a clip the device plays as before; →TL bypasses the device it sent. THE LOOP (alpha.25): the timeline loops while it plays — the ruler's range › ACTIVE › the clips' extent › free run (038 T1: › bar 1, never a free run); a film never loops (λWAVES passes no controller of its own: the kit's loops). ONE MODIFIER TABLE (alpha.23): Shift selects and fine-tunes (⅛ on curves, tension and knobs), Ctrl shapes (the ruler's vertical drag zooms about the pointer, its horizontal half scrubs snapped; Ctrl on a clip's body clones, on its edge stretches keeping the shape, Ctrl+Shift at ⅛; Ctrl locks a point's time), Alt bypasses Snap and deletes a point; the value lock is gone; the pencil stamps the clip last pressed. THE WORK BAR (032 T8 · T4): its power seat wears MOD (the kit's word face, dressed as its door is; the modulation window keeps the power ring) and beside t a second reader, TIME, the playhead's beat as m:ss.d at the tempo in force (`formatSeconds`), painted with t.

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
