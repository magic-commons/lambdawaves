# H2 THE WORDS UNDER — built (chain H, 2026-10-23; no kit edit)

Josh 10-23: "Stage labels don't have to move around the modulation window and timeline. they can be sent under."

## What changed
- `lab/shell/stage-words.js` `initStageText`: `bars()` — the rects the kit layer's `avoid()` keeps the block clear of — is now the racks
  and the UNDOCKED `#transport` only; the open TIMELINE's root left it (the modulation window was never in it).
- The MutationObserver on the TIMELINE's root (`hidden`, `style`) is gone: opening, closing or docking the TIMELINE is no longer a reason to
  re-place the block (the racks' body classes and the transport's class still are).
- The header comment says it: the words go UNDER the TIMELINE and the modulation window, z 20 below `#floats` (32).

## Measured (headless Firefox 1500 × 900, `/tmp` probe)
- The words' root `.mir-info.lw-stage` is z 20 in `#lab`; the TIMELINE (`tl.root`) and `#modwin` live in `#floats` z 32 — at the
  formula's centre `elementsFromPoint` reads `m2edit · m2body · m2dev lfo glass · field · stage …` (the words are never a target).
- Opening the TIMELINE and the modulation window re-placed the block twice — both from the undocked CONTROL SURFACE moving to the stage's
  top as the timeline opens (its class changes; the words keep clear of an undocked transport, as the brief keeps). The block now lands
  under the modulation window instead of being pushed round it.
- The glass decides how much of the words shows through a window: the LOOK's frost and blur (Josh's), not this row. Shot:
  `h-shots/H2-under.jpg` (TIMELINE + modulation window open over "1s₀ and 2p₀"; headless Firefox draws the glass without blur).

## Files
`lab/shell/stage-words.js` · `lab/sw.js` · `research/iteration-015/h-shots/H2-under.jpg`.

## Tests
- `tests/stage-text.browser-test.mjs` (LW_PORT 9611): GREEN (4/4).
- `node tools/rack-deps.mjs --classes --no-write`: HINGE holds (spectrum 25).

## The CLAUDE.md sentence (THE STAGE FORMULA)
Replace "clear of the undocked transport and an open TIMELINE (`avoid`); under every window" with "clear of the undocked transport
(`avoid`; since iteration 015 H2 the TIMELINE and the modulation window are not dodged — the words go under them); under every window",
and drop "or the TIMELINE opens or docks" from the `viewChanged()` list.

## Calls for Josh
- With FROST off (a tinted glass) the words read through a translucent window; with FROST on they blur. Say if a window over the words
  should hide them outright instead.
