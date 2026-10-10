# MIR BRIEF · the direction sphere stays still while it is dragged (`panels/camera.js` `turnBy` and `sync`)

Filed by λWAVES 0.5.3 M5 (B-CAM, 2026-10-10). Not built in MIR. `lab/mir/**` is adopted and read-only in λWAVES. λWAVES carries a
one-line fix on its own side (below) until MIR fixes this and λWAVES adopts the fix. The kit file is `lab/mir/panels/camera.js`,
MIR 1.5.0-alpha.24 (sha in `lab/sw.js`: `57f72e8128c5`).

## Why
Josh, 0.5.3 ASK: "XYZ Grid in camera control work but animation doesn't if I control it from the rack window, it only updates on mouse
release." §11 Q2: "sphere rings". The "XYZ grid" is the sphere's three world rings.

## What was measured (λWAVES 0.5.3, `research/release-0.5.3/cam-probe/sphere-drag.mjs`)
The probe drags with a real mouse (WebDriver actions) and samples the page before the button comes up. On a sphere drag of six steps the
pose moved on 6 of 6 steps and the stage drew 12 frames. But the sphere's arrow (`.cs-tip`, `.cs-look`) and its YAW · PITCH arcs moved on
**0 of 6** steps. They did not move at the release either. They moved only at the next port notice. Every other CAMERA control (the arcs
dragged directly, ZOOM, FOV, the PAN pad, PAN X, PAN Y) moved its own drawing on 6 of 6 steps.

## The cause (two parts, both in the kit)
1. `createCameraView` `turnBy` (`:282-290`): when the port has `turn` and neither angle is routed, it calls `port.turn(…)` and returns.
   It never calls `sphere.yaw.set` or `sphere.pitch.set`. Only the other road (no `turn`, or a routed angle) sets them: "the knobs follow
   the hand whether or not the app notifies".
2. `sync()` (`:347-357`) skips a busy entry, and the sphere is busy for the whole drag (`svg.classList.contains('drag')`, `busy` at `:345`).
   So the port's notice cannot repaint the sphere while the finger is down.

So a port that implements `turn` (λWAVES' camera law, and any app whose camera has its own relative-turn road) gets a sphere that stays
still for the whole drag. There is a second effect. `pointermove` (`:162`) works out each step with `sphereDrag(toRad(shown(ky)),
toRad(shown(kp)), …)`, which reads the arcs. While the arcs are stale, every step turns from the arrow where it was at the press. The tip
does not follow the finger. On the probe's drag, which moved steadily up and to the left, the pitch went 0.38 → 0.75 → −0.29.

## The proposal
In `turnBy`, after `port.turn(…)`, set the arcs from the port, the way the other road does:
`sphere.yaw.set(port.get('yaw')); sphere.pitch.set(port.get('pitch'));`. `set` is silent, so no `onInput` loop starts. The wrapped `set`
also repaints the sphere. `sync` can keep skipping a busy sphere.

## What λWAVES does until then
`lab/windows/material.js:119-120`: the port that λWAVES gives `createCameraPanel` wraps `turn` and sets the two arcs after
`cameraPort.turn`. This is the proposal above, on the app's side. When MIR adopts the fix, the wrapper's `turn` line should be removed.
The guard is `tests/camera-shift.browser-test.mjs` "the SPHERE answers live". It fails on the base tree (the arrow moved on 0 of 3 steps)
and passes with the fix.
