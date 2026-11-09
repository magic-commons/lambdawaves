# The look and the camera

The paragraphs below were moved verbatim from CLAUDE.md at 021 D2 and keep their iteration tags; where an older line names a file, a seat or an id a later iteration retired, the later law wins, and the laws of 021 stand first.

## The laws of 040

AN AUTOMATED KNOB BELONGS TO THE LANE (040 A1, Josh: "if exposure is now tied to the timeline, then it should completely ignore the style-parameter
saving rule"): A STYLE REMEMBERS ITS KNOBS' tether reads the route list, every clip's curve AND the registry's `isModulated` — a knob a modulator is
writing now (a film's drive, a route or a clip whose editor was never built) is skipped both ways by a style switch, so the automation's value stands.

THE STYLE'S MEMORY SURVIVES AN EVENT (040 A2, Josh: "If I change the exposure knob, and then the event switches to the next style and then returns
back to the style, the exposure is different"): the `material.style` target's set (an EVENT lane) saves and restores the style's knob set exactly as a
hand's switch does — 038 K1's "a lane refreshes a style the hand remembered and starts no memory" is retired. A DEMO PLAYS CLEAN still holds: what a
playing lane writes into `mat.styleMem` is derived, so projectKey (lab/shell/notebook.js) leaves `styleMem` out of the unsaved mark (it is a cache;
the style and every knob still count). Measured: CLOUD 2 → lane SOLID 0.5 → lane CLOUD 2; STAR LOOP and WATER ESP clean through 9 s of PLAY.

## The laws of 039

THE SUMMONS CLEARS THE DOORS (039 V2, the walks: NODES over the λWAVES logo and 14–17 bar buttons, FOLDERS over CAMERA and the timeline's chips, KEYS over the bar's top row): a window that OPENS — a kit window a menu, a key, a bar button or a restore shows, a card floated off its rack by anything but a hand's drag (a pressed pointer marks the hand's detach), the notebook — moves once, in the float layer's observer microtask, to the seat nearest its own (`lab/summon.js` `clearSeat`, pure) that covers neither the bar (its PLAY and mini-viewer), nor the logo and the menu row's 52-px band, nor an open TIMELINE or MODULATION and their rails, nor a rack column. The order (`shell/modulation.js` `seatOpen`): the full size, then narrower (4 % a step, three at most, ≥ 300 px) and shorter (6 % a step, ≥ 280 px) for a kit window or the notebook, clear of everything; then of all but the racks; then — a stage too small for a work bar and a window beside it (1000 × 700 with the TIMELINE) — of the bar and the logo alone, with the racks and without. The kit's own floor (`min`, FOLDERS' 360 px) can be above ours: placed taller than asked, the window is seated once more from there. With no seat at all it stays where it opened and, if it meets the bar, carries `data-seat="over"` (the bar goes under it, 021 V3). The work bars and PATTERN keep their own seats (the magnet, the dock, the dodge, the anchor); MODULATION has no host `place()` (its floating rail on a rack column is a FOR-KIT line); a hand's later drag is never undone while the window stays open; measured by layout (`offset*`, never the entrance's scale). Probe `tools/v039-shots.mjs summons` (1600 × 900, 1000 × 700, each with and without the TIMELINE).

THE SUMMONS ON A SMALL STAGE (039 F3, the fresh eyes on V, rows 2 · 3 · 4 · 5): EVERY ROAD SEATS THE NOTEBOOK — its seat is taken when it shows and again at every clearRack where its size (a project or demo open, RESUME, a layout's `nb`) or the doors (the bar's seat, an open work bar) have moved since, until a hand presses its head, grip or corner; a placement alone (the facade's `moveTo`) is never undone (`shell/modulation.js` `nbFollow`; WAVE DANCER at 1300 × 850: 0 of 23 bar controls under it, was 14). BESIDE A DOCKED WORK BAR — after the full and the narrowed sizes, a kit window or the notebook is tried at the floor's width (280 px: NODES' floor and the notebook's min-width, lowered from 300 and 320 to fit the 284–286-px columns beside the TIMELINE) clear of everything and of all but the racks, then over the work bar's empty lanes clear of its controls, clips and rail, before any seat on it; the kit's floor raises only the side it refused (1300 × 850 with the TIMELINE: NODES, FOLDERS and the notebook cover 0 of its controls, were 13, 9, 16; 1000 × 700: NODES and the notebook 0, FOLDERS — 280 px and its 62-px rail outside — has no seat and keeps the last fallback, FOR-MIR § 039). A FLOATED CARD TALLER THAN THE ROOM GOES TO ITS RACK — a card floated by anything but a hand (FILE › RENDER…; never a placement — THE PLACEMENT STANDS, 039 F4a: the facade's `popOut` with its own x, y or w marks the card `data-placed` and its open keeps it floating at that width, latex-copy's CALCULUS at 520 px three columns; the mark goes when it docks, and a fold press still asks) and taller than the room below the menu band is seated in its home rack, whose column stops above the bar and scrolls; folds could not do it (RENDER closed is 609 px in the 566 at 1000 × 700, and folding DETERMINISTIC RENDER would hide RENDER, PREVIEW and CANCEL). A FOLD'S OPEN RE-SEATS ITS FLOATING CARD — a press (a click or its key, never a restore's `set()`) that opens a fold row asks a floating card's seat again, and in a rack column brings what it opened into view without scrolling the press out (`bring`): RENDER's PERIOD opened shows PLAN and PLACE ONE PERIOD at 1000 × 700 and 1300 × 850.

## The laws of 038

THE CLIP'S TOGGLE (038 F3, Josh: "In clip, include a toggle to include or not include the balls and/or sticks so that it only cuts the waves"): under
the plane, CLIP's row CUT BALLS · CUT STICKS (the kit's switches, lit = cut, as every CLIP before 038 cut both). Off, that kind stands whole while the
plane cuts the wave (field-and-lock.md). `mat.slice.balls` / `mat.slice.sticks` = `false` is written by a hand only (absent = cut), PROJECT inside
`presentation.mat`, in the history with the look, never in NEW; a `lw:` link does not carry them, nor a modulation target (the slice targets take no
bools). The row is MOLECULES': it is hidden under hydrogen and an ATOM, as WAVE's SIZE · RADIUS rows are (`availability('wave.esp')`), and a restore
sets it. A kind the look does not draw greys its switch, the reason first in its hint (038 F7): CUT BALLS while SIZE is 0 or under ESP (ESP draws no
balls), CUT STICKS while RADIUS is 0 or under ESP's MAP ONLY. The hints say what off does: "off, the balls stand whole" / "off, the sticks stand whole".

A STYLE REMEMBERS ITS KNOBS (038 K1, Josh: "Each style mode … if not tethered to a macro/timeline clip should retain their information"): leaving a
WAVE style keeps the knobs it reads — EXPOSURE and HUE always, SOFT · ISO · GRAIN · KNEE as STYLE_READS has them — in `mat.styleMem[<style id>]`,
and entering one puts its remembered values back (a style never visited inherits what stands). THE TETHER RULE: a knob a route holds (the
modulation window's route list) or a timeline clip holds (a clip's curve `targetId`) is skipped both ways — the route owns it — and its last
hand-set number is kept for when it is let go (`isModulated` is true only while a modulator writes, so the routes and the clips are read).
`ui.styleRecall(from, to)` (lab/windows/material.js) runs from the STYLE seg's hand, the `style` action (C, the stage's STYLE ›) and the
`material.style` target's set (an EVENT lane — which refreshes a style the hand remembered and starts no memory: a demo whose lane plays
gains no `styleMem`), NEVER from a restore (a project, an undo, a link, a demo) nor `LW.setStyle` (the tools' looks);
a switch is one history row with the knobs it moved. PROJECT inside `presentation.mat`, absent = nothing remembered, never in NEW, a link
does not carry it; it is replaced, never mutated (a restore hands it the history's own record).

LIGHTING'S ONE ROW (038 K2, Josh: "Camera and Global, reset (can be a reload icon; palette needs to update this as well) and the 'expand' arrow
to be on one row"): FRAME (CAMERA · WORLD, two columns that never wrap) · RESET · MORE's chevron stand on one row down to the rack's narrow
262 px; RESET is the reload glyph ↺ (`reload`), as PALETTE's RELOAD (it wore the kit's undo arrow), both 18 px, named and hinted.

THE PAD WRAPS (038 K3, MIR 1.5.7-alpha.13, Josh: "if my cursor keeps going up and the XY thing hits the top edge, it will teleport to the bottom
and keep going … in the stage, it just looks like the lighting is going round and round"): THE SUN PAD wraps as a sphere — past the rim (the
point straight behind) at θ it comes back in at θ + π, so a drag or an arrow that keeps going walks the light over the back and round to the
front again; the disc clips the lattice, never the sun. CAMERA's PAN pad wraps as a plane (a torus): its ±1 is the frame's edge, so the
pivot leaves one side of the frame and comes in at the other; under the LOCK the pad still rests. The ranges stay the app's (the record, the
targets and a route are unchanged).

AUTO-ROTATE IN THE STAGE'S MENU (038 K4, Josh: "For rightclick stage, add 'Auto-rotate' to the list of camera controls; perhaps under 'lock'"):
the stage's right-click menu carries AUTO-ROTATE (the `camera.autoRotate` action, a check row) directly after LOCK — nine rows, the one menu over
eight (context-menus.js says so); FLIP stays. Its meaning is 037's: FRICTION read as 0, a fling never stops, no ambient spin.

## The laws of 037

THE RANGES OF 037 (037 H1–H3, Josh 11-05): FOV spans 5°–90° (`CAM.FOV`, radians; the readout prints degrees) and ZOOM spans [1, 12] (`CAM.DIST`,
log); both homes stand (3.3, 0.6 rad), so THE LOCK's poses are its own. The ZOOM dial is REVERSED — clockwise comes near (MIR 1.5.7-alpha.6
THE REVERSED DIAL: the port's `ranges.zoom.reverse`); `obs.dist`, `observer.dist` and the ×dist readout are still the distance. A saved
route or timeline curve on `observer.fov` / `observer.dist` is a share of its range, so the demos' FOV and ZOOM curves (STAR LOOP, WAVE
DANCER) now swing over the wider ranges. AUTO-ROTATE (FRICTION read as 0: a fling never stops, no ambient spin) and the LOCK (the PAN pad
resting) are ON from the boot; a project that says `camera.autoRotate: false` keeps it, a reader who unlocked keeps `camLock: false`.

THE CLIP'S FRAME (037 H4, Josh: "'Lock' or 'Unlock' the clip to be separate from the camera"): CLIP's segmented control CAMERA | OBJECT beside
the plane. OBJECT (`mat.slice.frame` absent: every file before 037, NEW, a link) is the plane fixed to the object. CAMERA (`'camera'`, a hand's
only, PROJECT inside `presentation.mat`) reads the normal in the eye's frame — n.x·right + n.y·up + n.z·toward the eye (`lab/field.js`
`eyeTurn`, from the basis `writeView` wrote) — in the ray's slab and the outline (the square built in its own frame, then turned), so the cut
rides with the camera. A press keeps the plane where it stands (the normal re-read through `cameraBasis`); Home or a double-tap is z in the
frame in force. A `lw:` link does not carry the frame.

THE SPHERE (037 H5): CLIP's plane is drawn on the camera's sphere (MIR 1.5.7-alpha.7 THE SPHERE TAKES A PLANE, `directionSphere({ plane })`)
in place of the plane-model canvas — the normal as the tip, the plane as the film, the rings, no letters; the tip follows the finger in 3-D
(no pole at z). Under OBJECT it is the object's picture (an orbit turns the cut, not the sphere); under CAMERA it draws the eye's normal as
the eye sees it (`view`), so neither the sphere nor the cut moves while the eye orbits. PLANE's own window keeps the plane-model canvas.

THE STAGE WINDOW (037 T1, Josh: "New MIR rack window called 'Stage' where the stage can have different effects"): a rack card `stage`
(`lab/stage-window.js`, glyph `stage`, KIND core, CLOSED on a first run, in the FINDER, `window.stage.*` generated) holding FRAME, then AXES ·
AXIS COLOUR, then the stage colour · FOLLOW THEME, then STAGE · GAMMA, then PULSE. A LABEL MOVES, A KEY STAYS: those rows left SETTINGS › DISPLAY
as the same controls (settings-card.js still makes them), so FIELD_CHROME, `presentation.ui.stage`, `presentation.mat.gamma`, `material.stage`
and `material.gamma` are untouched; DISPLAY keeps one row, EDIT STAGE. The body is short and never scrolls. FOLLOW THEME SAYS WHAT IT DOES (039 X4, WALK-A #10):
its hint follows its state (On: the theme's ground · Off: your colour), and a HAND turning it off lifts a resting STAGE knob (≤ 5 %) to 100 % by P7's road, so the
chosen colour shows at once; STAGE and GAMMA carry hints. THE STAGE WORDS WEAR THE STAGE'S INK (039 X4, WALK-A #11): `body[data-stage-ink]` follows the
stage ground's relative luminance (dark ink past 0.195, settings-card.js setStageMix) and the stage's words — the caption, INFORMATIONAL's, WIDGETS, the ESP
key — wear it (lab.css); the rack's words stay the theme's.

THE SUMMONS (037 T2): `summon(rk, fromId, id)` (`lab/summon.js`) opens `id` DIRECTLY BELOW `fromId` in fromId's rack (the kit's
`open(id, { side, index })`; open already, it is docked or moved there and unfolded, nothing raised) and plays THE MITOSIS once — a copy of
fromId's title bar over it, a pill wearing id's title sliding out beneath (180 ms), then rushing down to id's title bar and dissolving as the
window materialises (360 ms in all; the kit's easing; nothing under reduced motion). The copies are the cards' own nodes in one fixed layer
(`.lw-mitosis`, at the UI scale) removed when they land. A `fromId` not seated in a rack opens `id` as the FINDER does; the FINDER never
summons (index 0, no mitosis). EDIT STAGE is `summon(rk, 'settings', 'stage')`; CAMERA → LIGHTING is the second caller.

GAMMA EVERYWHERE (037 T3, Josh: "gamma seems to only work for inside the box"): a ray that misses the box or the cut, and the three NaN
fallbacks, take the same output gamma as a ray through the field (`lab/field.js` `bgOut`), selected out at GAMMA 1 so that picture — THE LOCK's
— is bit-identical.

PULSE (037 T4, the first STAGE FX): a radial wash of the stage — `bg` × 2.2 + 0.035 on a dark stage (× 1.6 alone moved the dark ground by two
codes), × 0.7 on a light one, chosen by the stage colour's own luminance — weighted by `w` = 1 − smoothstep(k − 1, k, r) for CENTRE or
smoothstep(1 − k, 2 − k, r) for EDGE (r: 0 at the centre, 1 in the corners, the frame's aspect kept). RATE 0 stands the wash at reach k = 1; above 0 the reach breathes 0 → 1 → 0 at RATE Hz of the clock's
play (t ÷ the clock's rate, re-anchored when either rate moves, so a turn never jumps it; paused, it stands — one clock). AMOUNT 0 returns
`bg` untouched (THE LOCK). Uniforms p16.w (AMOUNT), p17.x (SHAPE), p17.y (RATE), p17.z (the phase, written by `writeView`). `mat.stage
{ pulse, shape, rate }`, absent at home; PROJECT `presentation.stage` (absent = homes, never in NEW; the history keeps it); targets
`stage.pulse` (flash-guarded, its own `flash` step) and `stage.rate` under the `stage` root.
THE LIGHTING WINDOW (037 L, Josh: "I see that light shine/shadow in solid and ESP; let me edit/modulate it!" and "powerful like Blender's or
Houdini's … no scrolling … don't make the window too tall"): the rack card `light` (`lab/light-window.js`, at the lab root; glyph sun; first run
closed; in the FINDER; `window.light.*`) is a three-point rig on the old light. THE SUN PAD is the kit's XY pad dressed as a disc — its lattice
swells under the sun, its two hidden knobs are the disc's x · y — showing the sphere of directions azimuthal-equidistant: the centre faces the
eye, the dashed ring is the horizon, the rim is straight behind (a sun past the ring is a back light, drawn faint). Beside it KEY (strength),
RADIUS (the lamp's size: a wrapped terminator, a wider and lower highlight), HUE · TINT (the key's colour; TINT 0 is white); under them AMBIENT ·
SPECULAR · SHINE · RIM; behind MORE (the CAMERA window's fold) the FILL (strength, FILL AZ, FILL EL; no colour, no highlight) and the SPOT (CONE
10–180°, 180 = none; BLEND its edge). FRAME is CAMERA (a headlight: right · up · toward the eye, as CLIP's frame) or WORLD (a lamp fixed to the
object); a press re-reads the key and the fill through `cameraBasis`, so the light stays where it stands and only what an orbit does changes.
RESET returns every home. THE WORDS: a direction is two degrees of freedom, azimuth and elevation; a quaternion's third, roll about the light's own
axis, does nothing to a light, so there are no "quaternion knobs". THE HOMES are the old light (`field.js` LIGHT_HOME: the key at the atoms' old
upper-right direction, AMBIENT and SPECULAR at their 0.32, SHINE 40, FILL 0, CONE 180): the KEY at its home numbers in CAMERA means the old
light's own vector per style, so a hand on any other dial keeps the old direction, and the rig is continuous with the old picture (THE LEGACY
GATE, field-and-lock.md). AMBIENT above its home is light from everywhere, below it a darker floor; SOLID, SIGNED and SHELL begin to shine above
SPECULAR's 0.32 (they had none), the atoms and ESP shine at it. KEY and FILL are two-sided on the lit styles as the old light was (a light from
the left lights both flanks of a lobe), one-sided on the balls, sticks and ESP. MATTE stays unlit; CLOUD, BANDS, DUST and ADD are unlit as before.
THE RECORD `mat.light` holds only the values a hand moved off their homes (absent = the old light), PROJECT inside `presentation.mat`, in the
history with the look, never in NEW; a file without it opens on the old light and a `lw:` link does not carry it. THE TARGETS are `light.az` ·
`light.el` (the pad's, no dial) and `light.key` · `ambient` · `specular` · `shine` · `rim` · `hue` · `tint` · `fill` · `cone` · `softness`
(RADIUS) under the root `light`, the dials' own ranges, seated at `presentation.mat.light[key]`. CAMERA's extended body ends with LIGHTING,
which opens the card directly below CAMERA (`summonLight`; from the FINDER it opens as any card).

## The standing paragraphs

The CAMERA card's LOCK (PREFERENCE `camLock`, on by default since 037) is the classic camera. It holds the pan only: the shift stays 0,
every zoom (the wheel, the pinch, the dials, the dolly zoom) is from the centre, the PAN pad rests, and a route on observer.panx/pany
or a project's shift opens centred without its record being written. FOV, CONTROL and the turn stay live (`lab/camera-law.js`
`setLock`). Alt(+Shift)+Drag is the 1:1 pan; Shift does not make it finer (0.5.3 M6, M7).

A held WASD key turns the camera every frame from 120 ms after its press (iteration 012 O1, `camera-law.js` `queueKeyOrbit(yaw, pitch, id)` holds and `(0, 0, id)` releases through the rows' `up`); a tap is still one eased 0.12 rad step.

THE LOOK IS THE KIT'S (0.5.0 C2): theme, card, frost, DISCONNECTED, glass blur, ACCENT A/B, VIVID, STATUS TAGS, CONTROL HINTS and HELP
live in MIR's `mir.gui` (`lab/look.js`: `createPrefs` over the kit's own LOOK_SCHEMA rows, `createAccent`), never in the settings blob;
SETTINGS keeps each control in its seat as a `look.set`, repainted from the store, and MIR OPTIONS (`createGui`) is not built. λWAVES'
first run is the store's `defaults` (`LOOK_DEFAULTS`, `lab/rack.js`): light/refractive/ALWAYS frost, 22 px blur, 50% VIVID, DISCONNECTED,
hints on, tags and Help off; on a phone or tablet (`lab/first-run.js`, rack.js' own `isPhone()`/`isTablet()`) frost OFF, tinted. Captions
and window notes off, AUTO SCALE and governor on stay the blob's. A stored choice wins; an older blob's look (and `lw-window-info`) is
lifted once by `liftLook`; the phone's frost override stays the app's. Never add a look key to `saveSettings`.

THE BLUR, PUT BACK (iteration 012 B1, Josh 10-20: "why would it get rid of all the blurs if I already have GUI customization for it?"): Q5's allow-list is gone — the GLASS BLUR knob (`mir.gui` `blur`) governs every glass surface as before. Two narrow rules at the foot of `lab/skin.css` keep Q5's true findings: the timeline's window and lanes paint no backdrop (the toolbar and ruler keep the frost), and `#menubar .mb-list` frosts only under FROST, never on a phone or under the hold. The modulation window's ADD MACRO / ADD DEVICE sheets (`.m2pick`) are tinted at .94.

The CAMERA card is MIR's `createCameraPanel` over `createCameraLaw(...).port`
(`lab/windows/material.js`, grep `createCameraPanel`); the saved `observer.*` routes stay
the ONE `defs` table's (`lab/shell/modulation.js`), whose dials are the panel's (`camKnobs`) — the panel
registers none (its `mod` has no `add`). The phase palette is MIR's
`createRampPanel` (`DEFAULT_PALETTE` in `lab/palette-app.js`).
`tools/camera-routes.mjs` proves the saved routes after a camera change.
(0.5.0 C1)

A SAVED LOOK KEEPS ITS NAME (027 D5): the look store runs the kit's one-time migration (version 2, `frostText`): a FROST saved before 023 with the old TEXT LIGHT reads FROST; a TEXT LIGHT chosen afterwards is kept; `mir.gui` carries `prefsV: 2` (fixture tests/fixtures/look-frost-022.mir.gui.json).
