# CHAIN W — WAVE · PALETTE · ESP (branch it015-w, port 9631, GD 5331)

Rows, in this order: W0 THE ESP STALL (measure, then fix) → W2 THE PALETTE RULES ESP → W3 THE RANGE AND THE RAMP → W1 THE KNOBS FOLLOW THE
STYLE → P1 THE LIST ALIGNED → P2 THE REVERSE ICON. P3 is NOT yours (it follows the merge).
PLAN.md's CHAIN W section is the spec; "Where each item lives" has the lines (field.js:767-814, :1593-1630, :1725; material.js:48-101, :150-176;
palette-app.js:34-37; ramp.js:154; skin.css:950-951).

Notes beside the plan:
- W0: the probe is `tools/perf/esp-probe.mjs` (headed Chromium on the GPU, the road `tools/perf/film-probe.mjs` or B3's shots used): on benzene
  and palmitic acid (the catalogue; MOLECULES on), style STICKS then ESP, three readings each — at rest, during a scripted drag (pointer events
  on the canvas), with the clock playing (LIVE off) — frame time from `__LW.field.stats` and `espState()`'s `espRuns`/`espMs`. The GPU is the
  solvers': compare ESP against STICKS in the same minute, re-run a divergence alone, and say the GPU was loaded in W0-BUILD.md. Then the fix:
  with LIVE off, drop `generation` from `encodeEsp`'s key (φ is solved once per landing: the key carries the molecule's identity, the basis,
  the VIEW, half and res) — and request one frame when it lands so the grey never lingers; LIVE on keeps the 1 Hz law. If the drag reading
  says the surface itself is slow, run `espPixel`'s surface at the governor's resolution during a drag (the march already does). THE LOCK
  twice at the end (843 / 987), no leaf may move — ESP is not in it, but prove it.
- W2 + W3 are one shader edit in `espColour` + the uniform rows (:1725) + the bar (material.js:87-89): PALETTE ON (`V.p2.z`) → the LUT sampled
  linearly over its 256 entries (no `fract`, HUE still added as the palette does for DENSITY — read how DENSITY's θ = 0 sampling adds `p2.x`);
  OFF → the five-stop ramp; both through the signed log of φ. `mat.espPal` goes: the control, the uniform `p8.w` (reuse the slot for ε or leave 0),
  the restore's key list (material.js:96). RANGE 0.002 … 2, default 0.1 (`ESP_RANGE`); the bar's numbers from the inverse map; the ESP preset
  row loses its magenta stop (palette-app.js:35-36 → five stops, `points: 5`).
- W1: a `STYLE_READS` table in material.js (`{ iso: [...styles], knee: [...], ... }`) applied in `atomDrawSync` (rename it `styleSync`) — rows
  7/8 and the old WAVE rows alike; `hidden` on each control's seat; `setDisabled` goes. The restore road (persist.js:188) calls it already.
  Shot: WAVE under CLOUD, DUST, STICKS, ESP.
- P1: look at `.pal-pick .mir-pick-i` in the browser — if it is not a flex row, make it one (skin.css:950) with the name `flex: 1 1 auto;
  min-width: 0; text-overflow: ellipsis` and the strip `flex: 0 0 72px`; the shot must show one straight column of strips.
- P2: `lab/img/icons/reverse.svg` — two counter-pointing arrows (→ above ←), 24-unit box, `stroke="currentColor"`, the style of the 17 icons in
  that folder; REVERSE wears it the way RELOAD wears `chip('undo')` (material.js:164-165) — read how the chip is applied and whether the kit's
  glyph table or a CSS mask (lab.css' icon masks) is the road; the word stays as the hint.
Tests: `tests/official-defaults-palette.browser-test.mjs`, `tests/render-regressions.browser-test.mjs`, `tests/gpu-cleanup.test.mjs`,
`tests/flash-routes.test.mjs`, `tests/history.browser-test.mjs` (a restore of `mat`), THE LOCK ×2, `./test.sh node`, pwa --write.
