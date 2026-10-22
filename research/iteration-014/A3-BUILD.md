# A3 THE EXPANDER'S FAVOURITES — built (builder A-bar, 2026-10-22)

## What changed
- Kit (alpha.25):
  - `knob()` and `seg()` return their options as `spec`, so a second face can be made from the original's own options.
  - `timeline/knobs.js` `setTimelineKnobRows(fn)` adds the app's rows under LOCATE CLIPS in the TIMELINE CLIP popup (right click, or a
    500 ms hold on any `.k[data-param]`). It is a module-level port, so keys.js' timeline install (A-side's lines) was not touched.
- New `lab/csb-favs.js` `createCsbFavs(app, { panel })`. It puts a `.csb-favs` strip in the tempo panel, under the macros and the clock,
  across the panel's width.
  - A KNOB favourite is `knob({ ...orig.spec })` under the SAME `data-param` id, so routing, automation and the hold menu all treat it
    as the original.
    - A turn of the face sets the original and runs its own `onInput` / `onChange`.
    - The original's `set` / `show` (a modulator's paint, a restore) reach the face. A hand on the original is copied after its frame.
    - The registry's `mod-held` and the base ring reach the face too.
    - Removing the favourite gives the original back its own methods.
  - A SEGMENT favourite comes from an owner's `offer(id, control, { width })`. A press on the face clicks the original's own button, so
    the owner's road runs (history, status). The face follows the original through a MutationObserver.
  - Offered now (Josh's answer 4): `spectrum.scale` (HYDROGEN | STURMIAN), `wave.space` (POSITION | MOMENTUM), `wave.view` (OBSERVABLE).
    They are registered from transport.js, not by each owner, because spectrum.js sits AT the HINGE (25). Each offered row carries
    `data-fav`, and its right click (or a finger held 500 ms) opens the same two rows in the house's menu pane.
  - Eligibility: any registered knob, or an offered part ≤ 150 px (half a rack card).
  - Store: `lambdawaves.q0.csb` `{ v: 1, items }`, PREFERENCE. It is listed in `settings-store.js` FAMILIES, as are A4's `mir.transport`
    and `mir.transport.free`. A project open never touches it; every new project starts with it.
  - Faces are built when the expander first opens (nothing at boot). An empty strip says how to add one.
- `app.sh.csb` is the one new slot. It is a key in rack.js' `sh` literal (`csb: null`; the literal now holds 48 keys) and is filled by
  lab/shell/transport.js.
- `lab/lab.css`: the strip (its `order` beats skin.css' `.k { order: 2 }`), with knob faces at 48 px.

## Tests
`./test.sh node` green · rack-deps green (transport 12; HINGE holds; sh 48) · menubar · history · new-project · frame-occlusion ·
keyboard-window · timeline · lw-links green. Driven by hand:
- A right click on EXPOSURE shows CREATE AUTOMATION CLIP · LOCATE CLIPS · ADD TO CONTROL SURFACE.
- ADD stores `material.exposure`. A right click on OBSERVABLE shows ADD, which stores `wave.view`.
- With the expander open, the faces render in the list's order.
- A drag on the RATE face sets RATE's original (both read 170).
- A press on the OBSERVABLE face switches the field's view.

## Shot
`a-shots/A3-favourites.jpg` (EXPOSURE, RATE, OBSERVABLE and SCALE in the strip).

## CLAUDE.md sentence
"THE FAVOURITES (iteration 014 A3): a knob's TIMELINE CLIP menu (right click / hold; the kit's `setTimelineKnobRows`) and an offered segment's
right click (`data-fav`: SCALE, SPACE, OBSERVABLE) ADD it to the CONTROL SURFACE's expander strip (`lab/csb-favs.js`) as a second face of the SAME
control (`spec`, same `data-param`); the list is PREFERENCE `lambdawaves.q0.csb`."

## Questions for Josh
1. Reorder favourites by drag? Not built: they show in the order they were added.
2. More offered rows next round (STATE's STORE A / B, PALETTE's INVERT)?
