# W2 THE PALETTE RULES ESP — built (chain W, 2026-10-24; one commit with W3, as the brief asked: one shader edit)

## What changed
- **USE PALETTE is gone.** The switch, `mat.espPal`, the uniform's use (p8.w) and the restore key are removed. `ui.atomDrawSync` deletes an
  older file's `espPal` on every road in. `native-ui.js` row 8 is ISO | SAS | SES · LIVE · SLOW.
- **PALETTE ON paints φ with the current palette.** `espColour` reads `V.p2.z`, as DENSITY does. HUE adds `p2.x` turns, as DENSITY's
  θ = 0 sampling does.
- **PALETTE OFF paints the standard five-stop ramp**, RED → yellow → green → cyan → BLUE.
- **The palette is read from its FIRST stop to its LAST**, not the whole cyclic LUT.
  - Why: tests/palette.test.mjs' seam law makes LUT[0] ≈ LUT[255] for every palette, so an end-to-end read paints −R and +R the same
    colour. Reading first stop → last stop leaves out the closing segment, so the two ends differ. With the ESP row (stops 0 … 0.8) this
    paints exactly the standard map.
  - How: `field.setPalette(lut, [firstAt, lastAt])` keeps the span (`palSpan` = first · 512 + last, as LUT indices). The freed slot `p8.w`
    carries it, and the shader interpolates between the two indices.
  - material.js' `lut` callback passes the span from `palSorted()` (normalize's order).
- **The colour bar follows the same rule.** PALETTE ON shows the palette's stops first → last (`in oklab`, as toLUT interpolates); OFF shows
  ESP_RAMP. It repaints on PALETTE ON/OFF, on a preset and on a stop edit (`atomDrawSync` from `palOn` and from the `lut` callback while the
  bar is shown).
- **The ESP preset row loses its magenta stop** (palette-app.js). It is now five stops at 0 · .2 · .4 · .6 · .8, `points: 5`, and sits in the
  5-point group. The wheel still closes: blue blends back to red over 0.8 … 1, and the seam law holds.

## Files
lab/field.js · lab/windows/material.js · lab/native-ui.js · lab/palette-app.js

## Tests
- `node tests/palette.test.mjs`: 15/15 GREEN. The seam, step, anti and cvd laws hold for the 5-stop ESP row, and the catalogue's points law
  counts it in the 5-point group.
- Shot `w-shots/W2-W3-esp.jpg`, water in ESP · ISO, three panels:
  - PALETTE OFF: the standard map, O red, the H blue, green a real band.
  - PALETTE ON · EMBER: the bar matches, cream → violet.
  - PALETTE ON · the ESP row: the standard map again.

## CLAUDE.md sentence
"ESP's colour (iteration 015 W2): PALETTE ON paints φ with the palette read from its first stop to its last (`field.setPalette(lut, span)`; a cyclic
palette's closing segment left out so −R and +R differ), PALETTE OFF with the standard five-stop ramp; USE PALETTE and `mat.espPal` are gone (an older
file's key is dropped on restore); the bar follows the same rule; the PALETTE row ESP is five stops, 0 … 0.8."

## Calls for Josh
- Call 4 is answered by the build, with a twist. Neither "the whole LUT end to end" nor "the θ = 0 … π half" is used. The read is "the
  palette's stops, first to last", because a cyclic palette's two ends are the same colour by law. Say if you want the half instead.
