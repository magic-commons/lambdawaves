# P2 THE HUE ON THE RACK — build (iteration 013, picker chain)

Josh: "Let the current color of the hue shift dictate the hue of the thumbnails in the molecules rack window."

## What changed
- `lab/picker.js` `setHue`: `--mol-hue` is written on `document.documentElement` (it was on the Picker's own root `#lwMenu`, which the
  rack cannot inherit from; the plan's "on the root" read the Picker's root). The Picker inherits it unchanged; it is set at boot
  (`createPicker(app, { open: false })` runs `setHue(prefs.hue)`), so a reload keeps the turn.
- `lab/lab.css` `.mol-pick .mol-thumb` (MOLECULES' picture beside the molecule's name, chemview.js `rowPic`, a catalogue or volume
  picture alike): `filter: hue-rotate(var(--mol-hue, 0deg))` with the Picker's 360 ms glide. No other picture in the rack (the hue is
  the pictures' only, never the stage's — assumption 6).
- `lab/sw.js` by `pwa --write`.

## Picture
`p-shots/p2-thumb-hue-0-vs-150.jpg` — MOLECULES (H₂O) at HUE 0° (cyan) above HUE 150° (pink, the ring turned by its keys); the probe
read `filter: hue-rotate(150deg)` on `.mol-thumb` and `--mol-hue: 150deg` on `<html>`.

## Tests
`./test.sh node` green · `tests/start.browser-test.mjs` GREEN 3/3.

## CLAUDE.md sentence for Sos
Since iteration 013 P2 THE HUE ring writes `--mol-hue` on `<html>`, and MOLECULES' picture (`.mol-pick .mol-thumb`) wears the Picker's `hue-rotate(var(--mol-hue))`, so one turn moves both.

## Open questions for Josh
- none
