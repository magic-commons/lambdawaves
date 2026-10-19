# K · THE IMPULSE (iteration 008, branch `it008-impulse`, gate server 9651 / GD 5651)

Josh (JOSH-PROMPT.md): "Impulse should receive a huge graphical update to remove the verbosity and obvious controls and instead show
'k= lambda k=' and in a math font, improve the dotted line and arrow look."

Read first: CLAUDE.md (THE READOUTS AND KEPLER: THE BOW + KEPLER AS A CONTROL SURFACE is `lab/windows/kepler.js`; `keplerview.js` owns
`createKepler`; THE STAGE FORMULA paragraph for the math face `--font-math` and the type scale), `lab/keplerview.js` :73–:95 (the IMPULSE
VECTOR, "`bow` is still its name in the code", drawn over everything while Ctrl+drag is held; the `fitText` sentence "IMPULSE VECTOR k =
… a.u. · λ = 2π/k = … · release to apply · release CTRL to cancel"), `lab/shell/ink.js` (the ink's line style, the occlusion mask),
`lab/shell/stage-words.js` (how a stage word is set in the math face without reaching an export), `lab/capture.js` (an overlay is never in a
picture or a film). Row S moves STATE's LAST IMPULSE · RELEASE · ALONG rows into METERS; do not touch `lab/windows/state.js`.

## Build
- **The words:** two short lines in the math face (the INFORMATIONAL's `--font-math`, STIX): `k = 0.123 a.u.` and `λ = 51.2 a₀` — the
  numbers only, in the stage block's body size, placed at the arrow's head and never under the pointer; the instructions ("release to
  apply · release CTRL to cancel") leave the stage for HELP's text and the hover hint.
- **The line and the arrow:** the dotted guide becomes an even dash in the ink's weight (not a browser `setLineDash` default), the arrow a
  proper head (an open chevron or a filled triangle at the ink's size), the shaft from the packet's centroid; the colours the kit's ink and
  accent, inverting under `mix-blend-mode: difference` where the stage words do; no glow.
- **No obvious controls:** nothing new on a card; the gesture (Ctrl+drag) and the K key stay the road; the length maps to k as today.
- The overlay is drawn only while held and never reaches `capture.picture()` or the film (prove with one picture during a hold).

## Light check
Two screenshots mid-hold (a light and a dark theme); a picture taken during a hold without the overlay; the kick lands as before (the
packet moves, LAST IMPULSE reads in METERS once row S lands — until then STATE's row). `./test.sh node`; `tests/frame-occlusion.browser-test.mjs`
if the overlay touches the mask; `render-regressions` (the impulse overlay guard). Report: worktree · branch · commits · tests · blockers · next.
