# T2 THE MODULATION WINDOW'S BARS — built (chain T, Opus builder, 2026-10-24; kit 1.5.0-alpha.26)

Josh: "Remove the DJ buttons and refine the DJ buttons on the tempo/power button bar on the modulation window. Refine the old buttons (the DJ
buttons are super old and need updating to the new MIR standard)." Read as Yan's assumption 4: the old faces go, every function stays.

## What changed (kit)
- **`modulation/modwindow/modwindow.js`**: the same DOM, the same order, the same ids — the buttons gain the kit's classes. The preset bar's
  ▾ · save · ‹ › are `.tbtn` (a round 34-px seat, flat until hovered); TAP · WALL | FREE · 60 | 120 HZ · HOLD ¼ · HOLD 1 and the dead light are
  `.tbtn.trig` (the work bar's raised key: 34 px, 8-px corner, the kit's trig face and relief, accent A when on / held); the BPM is
  `.tbtn.tempo-expand` with `.tempo-number` (18 px, accent B, tabular) over `.tempo-unit` / `.tempo-hz`, as the CSB's and the timeline's pills.
  The old classes stay on as hooks. The power was already the kit's `.mir-mod-power` and keeps its own rules; λWAVES' RATE knob is unchanged.
- **`modulation/window.js`**: the hints of power, BPM, TAP, WALL | FREE and 60 | 120 HZ go through `hint()` (the kit's words; all five are in
  `locales/en.json`). The raw `title` had shown WALL | FREE's hint with its `{:WALL}` / `{:FREE}` marks.
- **`modulation/modhost.css`**: 72 selectors (28 whole rules, 5 `:where` / `:is` lists trimmed) of the old m2* / mod* faces for these bars are
  gone — the theme ink ladders' entries, the `.m2workbar button:not(.modtempo)` blankets, the tempo's two older grids, the name's borders, the
  lamp rims of WALL and HZ. Removed by a selector-level pass (`.tmp/t2/retire.py`, not kept), so every other entry of a shared list stands
  (checked: the chip rail's hover, `.m2bus.on`, `.m2chk/.m2swb/.m2audsrc`). `.modcad[data-w]` (THE HAND: 60 ⇄ 120 moves nothing) and
  `.modtempoin` (the typed field, shared with the CSB) stay. One block takes their place, § THE WORK BARS ON THE KIT'S SEATS.
- `modwindow.css` (the artifact's base sheet) still holds their old layout rules underneath; the new block overrides what it states. A later
  round may retire those too (FOR-MIR says so).

## What changed (app)
- `lab/skin.css`: λWAVES' unlayered strip rule `.tbtn` (lab.css: a 44-px raised box) would beat the kit's layered seat, so inside the two bars
  `.tbtn` and its glyph step back to the layers (`all: revert-layer`, the timeline work bar's A5 recipe); the 26-px save glyph rule is gone
  (20 px, the kit's seat).

## Measured (`tools/t-shots.mjs mod`, light 1600 × 1000)
Timing bar 486 → 485 px wide; preset bar 338 (unchanged). Seats: ▾ 34 × 34 round, save 44 × 34, TAP 44 × 34, HOLD 70 × 34, BPM 92 × 34; power
44 × 44 as before. Shots: `t-shots/T2-before.jpg` (the two bars as they were), `t-shots/T2-after.jpg` (light above, dark below).

## Files
`lab/mir/modulation/modwindow/modwindow.js` · `lab/mir/modulation/window.js` · `lab/mir/modulation/modhost.css` · `lab/skin.css` ·
`docs/FOR-MIR.md` · `MIR-MANIFEST.json` · `tests/mir-manifest.test.mjs` · `lab/sw.js` · `tools/t-shots.mjs` (seat read-out, THEME=dark).

## Tests
`render-regressions` GREEN (the modulation window) · `timeline` GREEN 14/14 · `window-switching` GREEN · `menubar` GREEN (twice RED first on its
FILE › SAVE row: `lambdawaves.q0.session` written inside the row — the session's 300 ms debounce after `loadPreset` racing the press; GREEN on
the third run, and GREEN ×3 on the T6 tree) · `frame-occlusion` the known detached-gap row (line 100) flakes ≈ 1 in 3 on this tree AND on the
T5 tree; GREEN alone · `./test.sh node`: only wigner W42-8 (the timing flake; the solvers hold the machine) · `mir-manifest` PASS.

## The CLAUDE.md sentence
The modulation window paragraph: "Its two work bars wear the kit's seat standard (iteration 015 T2): `.tbtn` round seats on the preset bar,
`.tbtn.trig` keys for TAP · WALL | FREE · 60 | 120 HZ · HOLD ¼ · HOLD 1, the BPM the kit's pill; modhost.css § THE WORK BARS; skin.css
reverts λWAVES' `.tbtn` inside them."

## Calls for Josh
- Plan call 3 stands as assumed: every DJ key kept (TAP, WALL | FREE, 60 | 120 HZ, HOLD ¼, HOLD 1), restyled. Say which to retire, if any.
