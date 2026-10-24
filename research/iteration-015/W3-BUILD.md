# W3 THE RANGE AND THE RAMP — built (chain W, 2026-10-24; in the W2 commit)

## What changed
- **RANGE runs 0.002 … 2 a.u.** on a log knob. The default is ±0.1 (`ESP_RANGE` 0.05 → 0.1); it was 0.005 … 0.5.
- **φ reaches the ramp through a SIGNED LOG**: s = sign φ · ln(1 + |φ|/ε) / ln(1 + R/ε), with ε = R/20, then clamped to ±1.
  - The green middle is now a real band, and the saturated red and blue arrive only near ±R.
  - One branch, in `espColour` (field.js). Both the palette and the standard ramp read the same s.
- **The bar's five numbers are the inverse map's**: ±R, ±R·g(½), 0, where g(½) = ((1 + 20)^½ − 1)/20 = (√21 − 1)/20 ≈ 0.179. At the
  default this reads +0.100 · +0.018 · 0 · −0.018 · −0.100, so the bar tells the truth of the map.
- The knob's hint names the signed log.

## Files
lab/field.js (`espColour`, `ESP_RANGE`) · lab/windows/material.js (the knob, the bar)

## Tests
- palette.test GREEN.
- THE LOCK at the chain's end. ESP is style 11 and is not in it.
- Shot: W2's (`w-shots/W2-W3-esp.jpg`). Water's O lobe is red, the H are blue, and the band between is green and wide, where at ±0.05
  linear it was a thin seam.

## CLAUDE.md sentence
"ESP's RANGE (iteration 015 W3) is 0.002 … 2 a.u., log, default ±0.1, and φ reaches the ramp through a signed log s = sign φ · ln(1 + |φ|/ε)/ln(1 + R/ε),
ε = R/20; the colour bar's numbers are that map's inverse (±R, ±0.179 R, 0)."

## Calls for Josh
- ε = R/20 and ±0.1 are Yan's numbers (assumption 10). A smaller ε widens the green further.
