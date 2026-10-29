# The look and the camera

The paragraphs below were moved verbatim from CLAUDE.md at 021 D2 and keep their iteration tags; where an older line names a file, a seat or an id a later iteration retired, the later law wins, and the laws of 021 stand first.

## The standing paragraphs

The CAMERA card's LOCK (PREFERENCE `camLock`, off by default) is the classic camera. It holds the pan only: the shift stays 0,
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
