# H3 THE AUDIT — built (chain H, 2026-10-24; kit 1.5.0-alpha.26)

Josh 10-23: "Inspect all the hide and reveals work on *your* judgement … Check the rack windows auto-hide features · inspect the full UI hide
'H' function · Let mouseover control hints not get cropped … Inspect all the collapses". Each row below was tried in the browser (headless
Firefox, 1500 × 900, port 9611); the assertable ones are `tests/hide-reveal.browser-test.mjs` (5 sections, GREEN).

| # | Row | Finding |
|---|-----|---------|
| 1 | H (the real key) with the FREE control surface, TIMELINE, modulation window, a floating CAMERA and both racks open | OK — a 15 × 9 grid of `elementFromPoint` reads only the canvas; frame and axes off; the pills `display: none`. H again brings every one back where it was (the bar still FREE), frame and axes as they were |
| 2 | B / ◧ hides both racks and the stage bar | OK |
| 3 | the edge peek under B | FIXED at `lab/lab.css:41,45,653,719` — the left edge peeked BOTH racks (λWAVES' rules read the generic `.rack-peek`, beating the kit's per-side ones); now `rack-peek-left` → `#rackL`, `rack-peek-right` → `#rack`. The occlusion mask follows the one rack shown (`lab/shell/ink.js:23-38`) |
| 4 | the control surface's peek under B | FIXED at `lab/shell/rack-wiring.js:71-81` — since 014 A0 no `transport` is handed to `createRack` (λWAVES keeps its own seat law), so the kit's wave-108 peek never ran: a hidden stage bar, and the ◧ on it, never came back by mouse. A λWAVES listener now sets `transport-peek` with the kit's numbers (near 80 × 60, held within 120) round the bar's rest seat (its rect less the hide's 140-px slide) |
| 5 | "rack windows auto-hide" | NOT IN THE REPO — no auto-hide exists. What Josh likely means is the ◧ / B hide with the pointer peek: after rows 3–4 it works on both racks, one edge at a time, and on the bar |
| 6 | every inner fold (`.lw-fold`): MOLECULES' register presets and MORE, INFORMATIONAL's seat chevron, CAMERA's pan and hand, SHADOW's details, FIELD's impulse knobs | OK — each opens and closes its `aria-controls` bodies; the chevron points right closed (`rotate(-90deg)`) and down open. MOLECULES' MORE wears `.lw-fold` with no `data-fold` (it keeps its own WORKSPACE key `more`): by design |
| 7 | a window's own fold (`.dev-fold`) and SPECTRUM's shell fold (n = 7 by its number) | OK both ways; the card chevron turns in 120 ms |
| 8 | a fold through a real resize (1240 × 820 and back) and through `serialize()` → `restore()` | OK (CAMERA and SHADOW stay open; a restore reopens what it saved) |
| 9 | the hover hint on a control-surface seat and on a window knob | OK — `#controlHelp` is body-level, fixed, inside the viewport and topmost over its box; `contain: paint` on `#transport.mini` and `.dev` cannot crop it, so the containment was not narrowed |
| 10 | the hover hint on a menubar row | FIXED at `lab/mir/control-help.js:56-60` + `lab/mir/css/skin.css` (kit) — the menubar is a top-layer popover, so the hint (z 10000) was painted UNDER its list (the centre of the hint read `mb-lbl`). The hint is now a manual popover re-shown at every open: the top of the top layer. Shot `h-shots/H3-menu-hint.jpg` |
| 11 | value bubbles (`.k-val`, `.fd-val`) against every box that clips paint | OK — none sticks out of a clipping box while its control is inside it (the stage bar's RATE bubble is not shown on the bar) |
| 12 | SPECTRUM's HAMILTONIAN expander | NOT IN THIS TREE — chain S builds it (merge order H → S); the suite's fold loop takes any visible `.lw-fold` and will read it once merged |
| 13 | the pills, the stage words | H1 (outside the window), H2 (under the TIMELINE and the modulation window) |

Also seen, left alone: H is `toggleUI` writing `body.ui-hidden` itself (not the kit's `setInterface`); with `handle: 'never'` there is no
on-screen way back from H on a touch device (the key only).

## Files
`lab/lab.css` · `lab/shell/ink.js` · `lab/shell/rack-wiring.js` · `lab/mir/control-help.js` · `lab/mir/css/skin.css` · `docs/FOR-MIR.md` ·
`MIR-MANIFEST.json` (sha deba32faafa2) · `tests/mir-manifest.test.mjs` · `lab/sw.js` · `tests/hide-reveal.browser-test.mjs` (new) · shot.

## Tests
`hide-reveal` GREEN · `frame-occlusion` 7/7 (one run red on the detached-drag row, alone green — the known flake) · `menubar` GREEN ·
`keyboard-window` GREEN · `./test.sh node`: only wigner W42-8 red, alone 16/16 · `mir-manifest` PASS · `rack-deps --classes` holds.

## The CLAUDE.md sentences
- Rack paragraph: "the rack hide ◧ / B peeks ONE rack per edge (`rack-peek-left | right`, lab.css) and the stage bar round its rest seat
  (`transport-peek`, set by rack-wiring.js since λWAVES hands createRack no `transport`; iteration 015 H3)".
- "The hover hint (`#controlHelp`) is a manual popover raised at every open, so it is never under the menubar or an ⓘ (kit alpha.26, 015 H3);
  `tests/hide-reveal.browser-test.mjs` guards H, B and its peeks, every fold and the hints."

## Calls for Josh
- Peeking one rack per edge is the kit's own law; say if you liked both racks arriving together.
- Should H keep an on-screen way back on touch (the kit's edge handle, `handle: 'coarse'`)?
