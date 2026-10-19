# B · A ↔ B AS AN AUTOMATION CLIP (iteration 007, branch `it007-morph`, gate server 9611 / GD 5611)

ADR: `architecture/ADR-draft-0002-orbital-morph-has-its-own-id.md` — ACCEPTED by Josh's rulings (PLAN.md). Read SHARED-CONTEXT.md's kit
facts: registered + stamped (`data-param`) ⇒ modulatable AND automatable; the TIMELINE creates a clip on any `.k[data-param]` dial the
registry has (`lab/mir/timeline/knobs.js:18-22`), values normalised 0..1.

## The ask (JOSH-PROMPT.md item 6)
MO-REGISTRY's ORBITAL pane has an A ↔ B knob (MORPH, `lab/orbitalsview.js:116` `morphK`, the slerp position s ∈ [0, 1] between stores A
and B). Today only the STATES pane's morph is a target (`reg.morph`, `lab/shell/modulation.js:129-131`, its hint says "the STATES
register"; saved projects address it). Josh: the ORBITAL pane's A ↔ B becomes modulatable AND "timeline clippable" — his ruling: **an
automation clip (a lane on the knob), not an impulse/env/trigger/pattern clip**; route and lane are EITHER-OR on a target (the kit's
law; the top-most wins).

## Build
- A NEW target id under the `reg` root for the ORBITAL pane's morph — `reg.omorph` (Sos's draft name; Josh may rename it later, so keep
  it in one place) — `reg.morph` untouched (a route that followed "whichever pane is showing" was rejected: a saved route would change
  meaning when the pane changes). Register it where the ORBITAL register's knob is made, through the door that already exists
  (`__LW.mod.register` / `installOne`, `lab/shell/facade.js:135-138`, or a row in the `defs` table if the knob exists at install) — the
  descriptor: linear 0..1, the knob's own get/set, group with the register targets, a hint naming the ORBITAL register. The stamp
  `data-param` must land on the knob root the TIMELINE sees.
- Its base in a saved project / undo row: a row in `modSeats` (`lab/shell/persist.js:25-36`) beside `reg.morph`'s; the ORBITAL register's
  own `save()` (`orbitalsview.js:595`) and the ADR's note on it — read the ADR's tail (it is cut in SHARED-CONTEXT) before deciding
  where s is kept; one scope only (`docs/STATE-SCOPES.md` row added).
- A lane on the TIMELINE moves it: place a clip on the knob, play, A → B over the clip; a route from the modulation window moves it; both
  at once is the kit's either-or, never fought by us.
- The MIR check's finding (`mir-check/FIXES.md`): "a routed dial cannot get a lane from its own gesture (the ring owns the hold; create the
  clip before routing)" — kit behaviour; your build note says whether `reg.omorph` meets it and how the clip is placed.

## Laws
`reg.morph`, `reg.e0`, `reg.w`, `reg.amp1..8`, `reg.ph1..8` stable; `tests/camera-routes` / `tools/camera-routes.mjs` untouched; the
hinge: shell/modulation.js 11 → ≤ 25; no new test files; never `lab/mir/**`. `tests/timeline.browser-test.mjs` (14 rows) and
`routed-knob` stay green — run them. No facade pin change expected; if `lw-facade.json` changes, say the diff.

## Light check
A screenshot of the TIMELINE with a clip on the ORBITAL pane's A ↔ B and the picture mid-morph; a route from an LFO on `reg.omorph`;
`reg.morph` still the STATES pane's; a project saved and reopened keeps s and the route. Report: worktree · branch · commits · tests ·
blockers · next.
