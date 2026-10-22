# D5 WAVE KNOBS (iteration 014, chain D)

**What.** Josh: "can the knob direction of the parameter of ISO, KNEE, SOFT be inverted? Mostly because I associate 'more-ness' to dialing it
to the right and 'less-ness' as to the left." ISO, KNEE and SOFT each make the picture more opaque as they go DOWN, so their dials now turn the
other way: right = more opaque / dense.

**The kit.** `knob({ reverse: true })` (`lab/mir/kit.js`, a FOR-MIR line at the top of `docs/FOR-MIR.md`, kit still 1.5.0-alpha.25, manifest
re-hashed and pinned `e4460b11769d`): the needle and a modulated knob's base tick paint `1 − p`; a vertical drag's travel and the arrows
(Up/Right/PageUp) carry the opposite sign. The value, `min` / `max`, `aria-valuemin/max/now`, the log map, `step`, reset, `spec` (so a
CONTROL SURFACE face inherits it) and every modulation route / map are untouched — only what the hand and the eye see turns. Ignored on a
`wrap` knob. No other kit code draws a knob's angle (grepped: the arcs read the knob's own `--turn`).

**The app.** `lab/windows/material.js`: `reverse: true` on `ui.isoK`, `ui.kneeK`, `ui.softK`.

**Measured** (an ArrowUp on each, `.tmp` probe): ISO 0.06 → 0.0564 with the needle −15.3° → −12.6° (right); KNEE 3 → 2.83, −90.8° → −88.1°;
SOFT 0.70 → 0.68, 78.2° → 80.9°; EXPOSURE (not reversed) 1 → 1.05, 1.1° → 3.8° as before.

**Tests.** `mir-manifest` PASS; `mir-controls.browser-test` GREEN (THE ONE KNOB LAW); `routed-knob.browser-test` GREEN 0/4; `pwa --write`.

**CLAUDE.md sentence.** ISO, KNEE and SOFT turn the other way (iteration 014 D5: the kit's `knob({ reverse: true })` — the needle and the hand's
drag and arrows flip, the value, its range, its aria and every modulation map do not), so right is more opaque on all three.

**Calls for Josh.** The keyboard follows the needle (ArrowUp turns it right, which lowers the number); say if the arrows should keep the
number's direction instead.
