# CHAIN B — WAVE · CAMERA · THE COLOURS · BUILD (Opus builder, 2026-10-27; branch `it018-B`, base 58ab389)

## What changed, per row
- **B1 WAVE UNDER HYDROGEN** (`lab/windows/material.js` modeSync, `lab/skin.css`). Under hydrogen or an atom, BALLS · STICKS · ESP (the style seg's
  buttons) and every molecule-only control are `hidden`, not greyed: SIZE, RADIUS, MAP ONLY, ISO|SAS|SES, PROBE, RANGE and LIVE · SLOW. A row whose
  controls are all hidden collapses through one rule, `.wave-row:not(:has(> :not([hidden])))`, which now generalises 017's wave-row-0 rule. Note that
  native-ui.js re-seats WAVE's controls into `wave-row-N` rows, so modeSync hides the controls themselves and never their rows. Under a molecule nothing
  changed from 017. WAVE went from 681 to 462 px under hydrogen. Shot: `b1-wave-hydrogen.jpg`.
- **B2 ESP ROWS** (`lab/native-ui.js` waveRows 7/8, with material.js matching them). Row 7 is SIZE · RADIUS · MAP ONLY, with ISO | SAS | SES wrapping
  under it because it cannot fit beside them at rack width. Row 8 is PROBE · RANGE · LIVE · SLOW on one line, as Josh asked. WAVE went from 715 to
  663 px under H₂O · ESP. Shot: `b1-wave-molecule.jpg`.
- **B3 CAMERA VERBS** (`material.js`, `lab/skin.css`, `lab/camera-law.js`). There is one FLIP now, the kit's own, since the port answers `flip`.
  `ui.camFlipSw` is gone. The kit's FLIP and AUTO-ROTATE roots, found by `camView.controls`, join LOCK on the verbs row: PAN HOME · HOME · LOCK · FLIP ·
  AUTO-ROTATE, one flex line. The stale comment at camera-law.js:214 is fixed. Shot: `b3-camera.jpg` (FLIP appears once and SPIN is absent).
- **B4 AUTO-ROTATE = FRICTION READ AS 0** (`camera-law.js`, `shell/settings.js`, `windows/film.js`, `render-exact.js`). The law is now
  `camera.mu = autoRotate ? 0 : friction`. The ambient getter, `speed`, `setSpeed` and `CAM.SPIN/SPIN_DEF` are gone, as are the free-mode ambient
  quaternion and its imports. The port no longer answers `spin`, so the panel draws no SPIN knob. Settings neither write nor read `spin`; an old stored
  `spin` is simply never read. On its own, AUTO-ROTATE turns nothing: it holds a fling at full speed until it is switched off, and FRICTION then decays it.
  The FRICTION knob keeps its value throughout. For a film, the road's `spin` is `camera.dy` while AUTO-ROTATE holds it in turntable mode, so a film rides
  the fling as its pose path, `yaw0 + dy·t`. The `before` step stills the camera as it did before, and `after` restores AUTO-ROTATE together with the
  fling (dy, dp), plus a `wake()`. The hazard and refusal texts name the held fling. Checked in Firefox: with AUTO-ROTATE on, dy stays at 1 for 1.5 s and
  friction stays at 3; with it off, dy falls to 0.016.
- **B5 ESP STRIP = THE SHADER'S COLOURS** (`material.js`). `paintBar` samples field.js `espColour` at 25 points: PALETTE on, the LUT from `lut()`
  between the first and last stop (palSpan), offset by HUE × 256; PALETTE off, the five-stop ramp through a JS port of `hueRot`; then INVERT (`1 − c`).
  There is no CSS filter. ROTATE follows because it rewrites the stops, and the LUT changes with them. The bar repaints on HUE, INVERT, PALETTE on/off and
  each new LUT; the 500 ms seat poll also catches a routed HUE or `LW.setInvert`. Shots: `b5-bar-palette.jpg`, `b5-bar-hue-invert.jpg`,
  `b5-bar-off-hue-invert.jpg`. In all three the bar's −/+ ends match the map.
- **B6 PALETTE SAVE BAKES INVERT** (`material.js` save). With INVERT on, the save stores `1 − rgb`; the switch is left where it is (call 4). Checked: a
  stop at 0.506 was saved as 0.494.
- **B7 ESP BAR IN INFORMATIONAL** (`shell/stage-words.js`, `lab/informational.js`, `material.js`, `lab/lab.css`, `lab/skin.css`).
  Three rows in `lambdawaves.q0.info`: `espBar` (on), `espBarSide` (right · left · top · bottom; right) and `espBarPad` (0–0.4; 0, the info pad's
  default per B8), on one card row ESP BAR · SIDE · PAD, SIDE one trig button cycling RIGHT → LEFT → TOP → BOTTOM. The stage text exposes `free()` and
  `blockRect()`; `barSeat` puts the bar at PAD's share of the free stage from its edge, centred along it; TOP and BOTTOM lay it down (`data-side`, a
  horizontal gradient, the numbers along it). THE STAGE TEXT WINS: a bar crossing the formula's block steps clear vertically (TOP under it, BOTTOM over
  it, a side bar away from the block's half). Shots: `b7-bar-{right,left,top,bottom}.jpg` (BOTTOM with the formula at the bottom shows the step), `b7-informational.jpg`.
- **B8 INFORMATIONAL PAD 0** (`stage-words.js`). The pad is 0 in all three places: the row default, the lift's default and the seat's initial value.
  A stored record keeps its own pad.
- **B9 SUBTITLE** (`stage-words.js`, `informational.js`, `chemview.js`, `lab.css`). A new row, `molSubtitle` (off), sits on the NAME · SUBTITLE ·
  LIST CAP row. It writes a third paragraph only under the NAME, at 0.42em (the body's 14 of the title's 34); the NAME stays at its heading 0.65em.
  **Neither the catalogue rows nor the vol-1 index carry a second or systematic name** (index fields: id, name, formula, formulaM, charge, heavy, tags,
  cid, inchikey, mw, pg, …), so the text is a volume molecule's `tags · pg` ("amide · C2v", `volRef.sub` → `row().sub`) or a catalogue molecule's
  shelf `group` ("hydrides"). Shot: `b9-subtitle.jpg`.

## Tests (gate 8779 / gd 5779, one browser at a time)
- GREEN: `node tests/camera-shift.test.mjs` (re-aimed: SPIN gone; AUTO-ROTATE reads μ = 0, holds a fling, leaves FRICTION), `node tests/render-exact.test.mjs`
  40/40 (the fake camera re-aimed: a held fling is what moves), `first-run.test` 13/13, `new-project.test`, `pwa.test` (after `--write`),
  `mir-manifest.test` (kit untouched).
- GREEN browser suites: official-defaults-palette, window-switching, take-in-bugs, camera-shift, routed-knob 7/7 (K4 re-aimed: the 016 V1 grey-in-seat
  check now runs under H₂O; under hydrogen it asserts that the rows and BALLS · STICKS · ESP are hidden), stage-text (re-aimed from 7 to 8 dials,
  adding the ESP bar's PAD), current.
- `node tools/new-project.mjs --check`: in step (16098 B). `node tools/rack-deps.mjs --classes --no-write`: HINGE HOLDS (spectrum at 25). The `app`
  literal is untouched.
- Not run: `tests/legacy/boot.browser-test.mjs` B65 and the settings-feel case still drive `setSpeed` and the ambient drive. That suite is legacy; its
  B65 ambient law is the one Josh replaced.
- LOCK: none moved. No shader or stage-paint change; the bar is DOM.
- Pictures come from `tools/b-shots.mjs` (a diagnostic; scenes wave · camera · espbar · sides · info · subtitle · read).

## CLAUDE.md sentences
- REPLACE 017 W's "WAVE's `styleSync` greys by mode … (`modeSync`, single buttons in the kit's disabled look, never hidden): … BALLS · STICKS · ESP under
  hydrogen or an atom" WITH: "Under hydrogen or an atom WAVE HIDES what only a molecule reads: BALLS · STICKS · ESP and the rows SIZE · RADIUS ·
  MAP ONLY · ISO|SAS|SES · PROBE · RANGE · LIVE · SLOW, an emptied `.wave-row` collapsing (018 B1). Under a molecule MOMENTUM and a real volume's Im ψ stay
  greyed in their seats, and a control the style does not read is greyed, never hidden (016 V1)."
- CAMERA: "One FLIP, the kit's, on the verbs row PAN HOME · HOME · LOCK · FLIP · AUTO-ROTATE (018 B3). AUTO-ROTATE is FRICTION read as 0
  (`camera.mu`): no ambient drive, the FRICTION knob untouched, a fling held until it is switched off. There is no SPIN; the port does not answer it. A film
  rides a held fling as its pose path (yaw0 + dy·t) and restores it (018 B4)."
- ESP: "The colour bar is field.js `espColour` sampled (LUT + HUE, or the ramp through hueRot, then INVERT) (B5). INFORMATIONAL seats it: ESP BAR · SIDE
  (one press cycles RIGHT → LEFT → TOP → BOTTOM) · PAD in `lambdawaves.q0.info`, laid down at TOP/BOTTOM, stepping clear of the formula block (B7).
  PALETTE save with INVERT on bakes 1 − rgb (B6). INFORMATIONAL's PAD is 0 on a first run (B8). SUBTITLE (off) puts a body-size line under the NAME
  (B9)."

## Open questions for Josh
1. SUBTITLE has no real second name to show, so it shows a volume molecule's tags and point group, or a catalogue molecule's shelf. If you want IUPAC or
   systematic names, the pack would carry them (PubChem by `cid`). Should it?
2. ISO | SAS | SES does not fit beside SIZE · RADIUS · MAP ONLY at rack width, so ESP takes three lines: row, seg, PROBE · RANGE · LIVE. Is that OK?
3. AUTO-ROTATE alone no longer turns the view; a fling is needed first. If you want a one-press spin, it would be a separate verb.
4. INFORMATIONAL's ESP BAR row shows under hydrogen too, because it is a preference. Should it hide there like WAVE's rows?
