# B1 · THE BLUR, PUT BACK — build report (iteration 012, branch `it012-rack`, BASE `8638a52`)

> Josh 10-20: "no! I was trying to fix a bug; why would it get rid of all the blurs if I already have GUI customization for it?"

## What changed
- `lab/skin.css`: iteration 011 Q5's allow-list (the universal `:not(:where(.tl-toolbar …)) { backdrop-filter: none !important }`
  rule and its comment, last in the sheet) is **deleted**. Every surface the GLASS BLUR knob (`mir.gui` `blur`, `lab/look.js`)
  governed before Q5 is under it again: rack card heads and bodies, the transport, the Picker and its arrows, the notebook, the
  keyboard pane, the modulation window's panes, popovers, the palette dropdown (`.mir-pick.glass`), the photosensitivity notice.
- Q5's two true findings stay, each one narrow unlayered rule at the foot of `skin.css`:
  1. **THE LANES** — `body.frost .mir-win.mir-timeline, body.frost .mir-timeline .tl-pane { backdrop-filter: none }`: the field reads
     crisp under the timeline's lanes (Josh's 10-19 screenshot); `.tl-toolbar` and `.tl-ruler` keep the frost.
  2. **THE MENUS** — `#menubar .mb-list` (skin.css :552) no longer blurs unconditionally; it now says `backdrop-filter: none`
     (unlayered, beating the kit's REFRACTIVE rule) and frosts only under `body.frost:not(.phone):not(.frost-hold)`.
- **The ADD MACRO / ADD DEVICE sheets** (`.m2pick`, the kit's DOM) wear the windows' tint: `background-color: hsl(var(--glass-tint) / .94)`
  (a colour, not the `var(--glass-sheen), …` pair — the sheen is `transparent` inside the modulation window and a colour in a
  non-final background layer voids the declaration; measured: the first form computed to `rgba(0,0,0,0)`).
- `lab/lab.css` :63 the notebook's comment back to its pre-Q5 words. `lab/sw.js` re-stamped (`pwa --write`).
- Q5's frost-hold and phone laws untouched (they live in the rules above the deleted block).

## Proof — `research/iteration-012/r-shots/`
`shot.mjs` (headed Chromium on the session display, CDP `Page.captureScreenshot`, which composites `backdrop-filter`; 1920×1080,
fresh profile = first-run material) with `b1-scenes.mjs`: benzene (orbital, SOLID) behind
`b1-rack-palette-blur{0,22,30}.png` (MOLECULES · PALETTE · WAVE · CAMERA unfolded, the palette dropdown open) and
`b1-modwin-blur{0,22,30}.png` (the modulation window with ADD MACRO's sheet open). At 0 the lobes read sharp through the LFO/ENV
panes; at 22 and 30 they smear — the knob governs the panes again. The KNOB / TRIGGER sheet is opaque-tinted at every value.
The knob's travel is 30 px (`look.js` caps the kit's row at 30), so the "40 px" read is the knob's 30 maximum.

Live reads (`b1-probe.mjs`, knob 22): timeline window `none`, lane `none`, toolbar `blur(22px)`, ruler `blur(22px)`; WINDOW menu
list `blur(22px)` under FROST, `none` with FROST OFF.

**fps at 2× (DPR 2, 1920×1080 CSS, benzene PLAYING, knob 22, rAF over 120 frames × 5, 120 Hz display):**
rack unfolded + modulation window open: 81.8 · 86.8 · 85.2 · 84.7 · 86.2 (mean ≈ 85); + timeline open: 97.3 · 93.5 · 118 · 102.9 · 109.9
(mean ≈ 104). Q5 measured 98.7 (31 blurred surfaces) vs 108.8 (11) at DPR 2 on the timeline scene; the cost of the blur is back
and is now the knob's to spend (0 px = no blur cost).

## Tests
- `node tests/pwa.test.mjs --write` PASS · `./test.sh node` exit 0 (every suite GREEN)
- `tests/timeline.browser-test.mjs` GREEN 0 failing of 14 · `tests/menubar.browser-test.mjs` GREEN

## CLAUDE.md — replace the Q5 paragraph ("THE BLUR, ONLY WHERE IT BELONGS …") with
THE BLUR, PUT BACK (iteration 012 B1, Josh 10-20: "why would it get rid of all the blurs if I already have GUI customization for
it?"): Q5's allow-list is gone — the GLASS BLUR knob (`mir.gui` `blur`) governs every glass surface as before. Two narrow rules at
the foot of `lab/skin.css` keep Q5's true findings: the timeline's window and lanes paint no backdrop (the toolbar and ruler keep
the frost), and `#menubar .mb-list` frosts only under FROST, never on a phone or under the hold. The modulation window's ADD MACRO /
ADD DEVICE sheets (`.m2pick`) are tinted at .94.

## Open for Josh
1. The palette dropdown (`.mir-pick`) at knob 0 under REFRACTIVE is see-through — that is R4's row (the main menu's surface).
2. The rack's ◧ + ☆ stack and the notebook blur again with the knob (pre-Q5 behaviour); say if either should stay sharp.
