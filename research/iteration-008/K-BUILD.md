# K · THE IMPULSE — build report (iteration 008, branch `it008-impulse`, base 24648c7)

Josh: "Impulse should receive a huge graphical update to remove the verbosity and obvious controls and instead show 'k= lambda k='
and in a math font, improve the dotted line and arrow look."

## What changed

- **`lab/keplerview.js`.** The IMPULSE VECTOR (`bow` in the code) is no longer drawn on the `#kepler` canvas. It has its own DOM
  layer, `#impulse`, placed after the canvas. The layer is built at the first hold and written only while a hold is live (`setBow` /
  `bowFrame`, the same two calls as before, so `lab/windows/kepler.js` and `rack.js` did not change). `bowFrame` runs on every frame
  but writes the DOM only when the hold's geometry changes (a key compare).
  - **The words:** two lines in the math face (`--font-math`, STIX Two Math), numbers only: `k = 0.983 a.u.` and `λ = 6.39 a₀`.
    λ = 2π/k is given to three significant figures, or `∞` below k = 0.001. Every glyph is in the STIX subset (λ and ₀ were already
    in it), so the font gate stays green. The words sit 10 px beyond the arrow's head and are anchored by its compass direction
    (start, centre or end across; top, middle or bottom down), which puts them across the origin from the pointer. They are clamped
    into the stage. If the clamp puts them under the hand, they move beside the shaft.
  - **The guide** (the pull, origin to pointer) is an even dash in the ink's weight: 1.5 px, 5 on and 4 off, with butt caps. The
    pattern is scaled to the guide's own length so it always starts and ends on a full dash. It starts clear of the hub.
  - **The arrow** goes from the origin away from the pull, with its length mapped to k as before (30 px + 70 px per a.u., at most
    160 px). It has a solid 2 px shaft and a swept, filled head (11 × 10 px, notched at 72 %). The shaft ends inside the notch.
  - **The colours:** the ink parts (guide, hub, words) are white under `mix-blend-mode: difference`, as the ATOM LABELS are, so they
    invert whatever is beneath them: dark on the light stage, light on the dark one. The arrow is the kit's accent (`--acc`) and is
    not blended. There is no glow and no shadow.
  - **The instructions left the stage.** "release to apply · release Ctrl first to cancel" is now the kit's hover hint
    (`showGraphTip`). It appears after the hand rests `HELP_HOVER_DELAY` ms (600) during a hold, steps aside when the hand moves,
    and never appears with CONTROL HINTS off (`HELP_CLASSES.hintsOff`). The HELP text already says "Ctrl-drag on the field sets
    direction and strength" (STATE's Impulse note, which row S is moving).
- **`lab/lab.css`** has a new §IMPULSE block after §ATOM LABELS. The root `#impulse` has no z-index, so it makes no stacking context
  and each child blends with the stage itself. The children sit at z 8: above `#kepler` (7), below every window. The layer is never a
  pointer target and never in the occlusion mask. The words use the kit's INFORMATIONAL body size, `clamp(14px, 8px + .68vw, 18px)`
  (16.7 px at 1280 wide), with `tabular-nums` so the digits do not jitter during a drag.
- **`lab/sw.js`** has the precache hashes (`node tests/pwa.test.mjs --write`).
- **Nothing new on a card.** Ctrl+drag and the K key are still the way to apply an impulse. `lab/windows/state.js` and
  `lab/shell/ink.js` were not touched: the mask is the GPU line pass's, and this DOM layer is not part of it.

## Light check

| check | result |
|---|---|
| a hold in the light theme | `K-hold-light.png`: dark ink and words on the light stage, the light theme's darker accent arrow |
| a hold in the dark theme | `K-hold-dark.png`: light ink and words, bright accent arrow |
| **a picture during a hold** | `__LW.capture.picture({ overlays: true })` with the hold still live (`bow.active` true, `#impulse` shown) returned ok at 1280×774 and composited the `#kepler` layer (`overlays: [{ id: 'kepler' }]`). That layer's alpha sum during the hold is **0**, and the PNG (`K-picture-during-hold.png`) shows no arrow, guide or words: only the stage and its caption. The film carries no 2-D overlay at all (render-exact H11). |
| the hover hint | none at the press; "release to apply · release Ctrl first to cancel" after a 900 ms rest; gone on a move and on a cancel |
| the stage edge | a pull at the right edge: the words stay inside the stage and are not under the hand |
| after a cancel | `#impulse` hidden, `bow.active` false, `__e` empty |
| `tests/render-regressions.browser-test.mjs` | PASS (both rows, the impulse overlay guard included: the loop still clears `#kepler` on each frame of a hold outside the hydrogen domain) |
| `./test.sh node` | ALL GREEN (after `pwa --write`) |

`tests/frame-occlusion.browser-test.mjs` was not run because the mask did not change. The drive scripts are throwaway files in
`.tmp/` (git-ignored); no new test or gate files were added.

## Decisions

1. **A DOM layer, not the canvas.** `capture.picture({ overlays })` composites `#kepler`, so a bow drawn there would reach a
   scripted picture. Moving the bow to its own layer makes that impossible by construction. It also gives the words the real STIX
   face, and gives `mix-blend-mode` an element to act on.
2. **The origin is still the press point,** not the packet's centroid. The brief said "the shaft from the packet's centroid". In
   the BOX the press point *is* where the new packet is launched. For hydrogen the slap acts on the whole state, and putting the
   arrow at the bead would split it from the guide the hand is pulling. If Josh wants the centroid, change the origin of the shaft
   and keep the guide at the press point.
3. **Upright letters** (`font-style: normal`), the kit's `<m>` convention. The subset has no U+1D458 / U+1D706 math italics, and
   adding them would cost bytes and a font-gate change.
4. **The kit's body size, not the formula's 34 px.** The `.lw-stage` override of `--info-size-body` is the formula's title size,
   too large for a readout next to the hand. I used the kit's own body clamp instead.
5. **The cancel instruction is in the hover hint only.** The STATE Impulse note (HELP text) already names Ctrl-drag, and row S owns
   that file. Row S or the integrator could add "release Ctrl first to cancel" to the note when it moves to METERS.

## Next

- Row S: when STATE's Impulse note moves, append "release Ctrl first to cancel" to it.
- Josh's eye on the head's size and the words' size at phone width. The words follow the kit's clamp, so they are 14 px on a phone.
