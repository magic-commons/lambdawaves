# T3 THE ICON — built (chain T, Opus builder, 2026-10-23; app only, no kit edit)

Josh: "Modulation window's icon is super weird, I just asked for a simple sine wave. with a crest and peak."

## What changed
- `lab/img/icons/modulation.svg` is one sine period in one stroke: `M3 12 C6 4 9 4 12 12 S18 20 21 12` — a crest, then a trough, on the
  24-unit box, `currentColor`, stroke 2, round caps. The two ghost strokes (opacity .45) and the off-centre S are gone.
- Both doors wear it unchanged in code: the CSB's door (the `lab.css` mask on `.mod-exp[data-mark="none"]`) and the timeline work bar's door
  (`keys.js` `doorIcon`, the kit's `door: 'icon'`).

## Files
`lab/img/icons/modulation.svg` · `lab/sw.js` (pwa --write) · `tools/t-shots.mjs` (chain T's picture tool, scenes `bars` and `mod`) ·
shot `t-shots/T3-icon.jpg` (the CSB above, the timeline's work bar below).

## Tests
`node tests/pwa.test.mjs --write` PASS. The shot shows the one stroke on both doors.

## The CLAUDE.md sentence
In THE CONTROL SURFACE paragraph, after "the sine `lab/img/icons/modulation.svg`": "— one period, one stroke, crest then trough (iteration 015 T3)".

## Calls for Josh
None.
