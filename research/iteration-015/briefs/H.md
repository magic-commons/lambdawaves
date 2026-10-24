# CHAIN H — HIDE AND REVEAL (branch it015-h, port 9611, GD 5311)

Rows, in this order: H1 THE PILL OUTSIDE → H2 THE WORDS UNDER → H3 THE AUDIT.
PLAN.md's CHAIN H section is the spec; "Where each item lives" has the lines (rack-scrollbar.js:69-111, rack.css:110-121, stage-words.js:166-183,
keys.js:85-218, rack.js:826-851, control-help.js:54-79).

Notes beside the plan:
- H1 is a kit edit (alpha.26, FOR-MIR line, manifest). Geometry: the pill's layer is already outside the rack's scroller (`rack-pills`); place
  the pill at the card's inner edge + 8 px (the left rack: right of the card; the right rack: left of it), vertically centred on `.dev-head`,
  with a 6 px tail (a rotated square or a clip-path) toward the card; width `max-content` (no truncation), the clip-path reveal from the tail
  side; never over the card, the grip or the scrollbar. Josh's 10-22 answer that the bar sits "at the pill's tip" is superseded by his 10-23
  words — say so in H1-BUILD.md. `tests/rack-pill` has no suite; the proof is `tests/frame-occlusion.browser-test.mjs` + a shot of both racks.
- H2: remove the TIMELINE from `avoid` (keep the racks and the undocked `#transport`); the words are already z 20 under `#floats`. One shot
  with the TIMELINE and the modulation window open over the formula.
- H3: a browser test `tests/hide-reveal.browser-test.mjs` carries the audit's rows that can be asserted (H hides and restores every surface, the
  rack hide + peek on both racks and the CSB, every `data-fold` press opens and closes and the chevron turns, a fold survives a resize and a
  `restore`, `#controlHelp` stays within the viewport and un-cropped when hovering a CSB seat and a `.dev` knob); the table in H3-BUILD.md names
  each row's finding (OK / fixed at file:line / not reproduced). Fix what is wrong in the smallest way. "Rack windows auto-hide" does not exist:
  report what Josh may have meant (the ◧ / B hide with the pointer peek) and whether the peek works on both racks.
Tests: `tests/frame-occlusion.browser-test.mjs`, `tests/stage-text.browser-test.mjs`, `tests/keyboard-shortcuts.browser-test.mjs`, the new
suite, `./test.sh node`, pwa --write, manifest re-hash.
