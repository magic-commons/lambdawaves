# D4 PALETTE (iteration 014, chain D)

**What.** Josh: "Make the Palette presets drop down menu have the texts align left and the color strips align to the right. Let Invert also
be a custom button that's a 'Knob' size for the CSB. Capitalize the first letter of the preset name. e.g. 'sea' to 'Sea'."
- THE LIST (R4's `.pal-pick` pane): rows `justify-content: space-between; text-align: left` — the name at the row's left edge, the strip
  (72 px, `margin-left: auto` as before) 8 px from the right on every row.
- THE NAMES: `palLabel` capitalises the first letter after dropping the parenthetical (S2): sea → Sea, gas lamp → Gas lamp, cym → Cym;
  one function, so the stepper's name, the list's rows and THE FADE's toast (`PALETTE · Sea`) agree. Saved ids are untouched (`sea`).
- INVERT on the CONTROL SURFACE: `csb-favs.js` `offer(id, control, { width, build })` gains `build(control)` for a face that is not a segment,
  and `swFace(id, orig, o)` — the kit's glyph `sw` again (same glyph, label, hint), whose press is the original's own press (`orig.root.click()`,
  so `mat.invert`, the save and the PRESENT run on INVERT's road) and which mirrors the original's `aria-pressed`. Offered from
  `lab/shell/transport.js` as `palette.invert` (width 44); right-click INVERT on the card → ADD TO CONTROL SURFACE; the face is 48 × 48 in the
  expander's strip (a knob's seat), its glyph turned over when ON as on the card. The list stays PREFERENCE `lambdawaves.q0.csb`.

**Files.** `lab/windows/material.js` (`palLabel`), `lab/skin.css` (`.pal-pick .mir-pick-i`), `lab/csb-favs.js` (`build`, `swFace`),
`lab/shell/transport.js` (the offer), `lab/lab.css` (the face's size and turn), `lab/sw.js`, `tools/d-shots.mjs` (scene `palette`).

**Measured** (`node tools/d-shots.mjs palette`): eight rows, every name's left edge the same x (628), every strip 8 px from the right; INVERT
added from the card's right click, its face 48 × 48; a press on the face: `mat.invert` false → true, the card's switch `aria-pressed` true;
a second press back to false. Shots: `d-shots/D4-palette-list.jpg`, `d-shots/D4-csb-invert.jpg`.

**Tests.** `official-defaults-palette.browser-test`: RED on `lean` / `aaHidden` — RED THE SAME at base 4e4686e (checked out alone and run),
so not this row (chain A's bar moved INFORMATIONAL's Aa / LEAN; for the integrator). `./test.sh node` at the end of the chain.

**CLAUDE.md sentence.** PALETTE's preset names are capitalised at the label (`palLabel`, iteration 014 D4; ids unchanged), the list's rows put
the name left and the strip right, and INVERT is offered to the CONTROL SURFACE as a knob-sized switch face (`csb-favs.js` `offer(…, { build })`
· `swFace`, id `palette.invert`).

**Calls for Josh.** None.
