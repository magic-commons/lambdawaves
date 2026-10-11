# MIR BRIEF · the ramp panel's five seats (`lab/mir/panels/ramp.js`, `ramp.css`) — PALETTE, SHORTER

Filed by λWAVES 0.5.3 M12 (B-PAL, 2026-10-10), and not built. `lab/mir/**` is adopted and read-only in λWAVES, so each change belongs in MIR first
and is then adopted. λWAVES does the same jobs today from outside, in `lab/windows/material.js` (the "0.5.3 M12" block under `createRampPanel`),
by reaching into the panel's DOM. Each brief below names the line it would replace. After MIR ships one, that λWAVES line goes.

## Why
Josh, 0.5.3 ASK: INVERT "an icon like a half colored circle … to the right of rotate", the ARG ψ view "just a reader under rotate to replace the
'turn' text", RESET "in the same row as palette on", the −π…π labels removed and "the angle a floating text". Every one of those is a seat the
panel does not offer, so λWAVES moves nodes after `createRampPanel` returns.

## 1 · A `verbs` extras slot
`createRampView` builds the verbs row at `ramp.js:151-158` (ADD, REVERSE, and ROTATE when cyclic) and returns no handle to it. Proposal: an option
`verbs: [node | { widget }]` (or `view.verbs`, the row element) so an app appends its own control in the row, after ROTATE, with the panel's
spacing. λWAVES today: `rv.root.querySelector('.mir-ramp-verbs').appendChild(ui.invertSw.root)` (INVERT, `sw({ glyph: 'invertColors' })`).
Keep the glyph switch the app's: the kit already draws `invertColors` (`glyph.js:318`) and `panels/grade.js:191` turns it over when ON.

## 2 · A reset seat option
RESET is built at `ramp.js:124` and appended to the presets row at `:125`. Proposal: `reset: 'beside-presets' | 'none' | node` — `'none'` builds the
trigger without seating it and returns it (`view.reset`), so an app seats it in its own switch row. λWAVES today:
`rowOn.appendChild(rv.root.querySelector('.mir-ramp-reset'))`, which leaves the presets row holding the stepper alone.

## 3 · `labels.rotate(rad)` for the knob's "turn"
The ROTATE knob (`ramp.js:153`) has `fmt: () => 'turn'`, because it is a jog wheel with no value. Proposal: `labels.rotate` — a function of the
selected stop's angle in radians (cyclic ramps only) that the panel calls whenever the selection or a stop moves, and prints as the knob's value
text. λWAVES today: a `readout` appended inside the knob, a CSS rule that hides `.k-val`, and a MutationObserver on the hidden ARG ψ field.
The panel knows when the selection changes (`select`, `paintSel` at `:164-186`), so it can do this with no observer.

## 4 · `labels.float`
The selected stop's angle, floating over the stop on the strip. Proposal: `labels.float(u) → string | null`, drawn by the panel as one small node in
the strip (`.mir-ramp-float`, pointer-events as the app asks, positioned by the stop's `--at` as the handles are) and updated in `paintSel` and
`paintNow` (`:177-205`). `null` draws none. The same function can feed `labels.rotate`, which is how λWAVES keeps one function with two seats.
λWAVES today: `<i class="pal-float">` appended to `rv.strip`, positioned by CSS from `--at` that the app sets itself.

## 5 · `stepper({ pager: true })` via `ramp.js:122`
The preset stepper at `ramp.js:122` is the look Josh chose as the reference (PLAN §11 answer 5): a left chevron, the name, a right chevron. B-DISP
copies it by CSS for the MOLECULES section picker and the molecule picker. Proposal: `stepper({ pager: true })` — the same look as an option of the
kit's `stepper`, so MOLECULES' SECTION picker (`chemview.js:85`'s `.pal-nav` triggers) takes it from the kit and the app's copy of the look goes.
The ramp's call at `:122` would pass the option explicitly, so the reference look is named and cannot drift. λWAVES' MOLECULES picker is the first
user; the other left/right-arrowable controls are listed in B-DISP's report.

## Also: `ticks: []`
With `ticks: []` the panel still creates an empty `.mir-ramp-ticks` div (`ramp.js:134`) that holds 14 px (`--ramp-tick-h`) and a 3 px margin. Proposal:
skip creating it when the list is empty, or give `.mir-ramp-ticks:empty { display: none }` in `ramp.css`. λWAVES adds that rule itself today.
