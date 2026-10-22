# A11 THE FOUR CALLS — built (builder E+A, 2026-10-22; kit 1.5.0-alpha.25, no bump)

Josh on Yan's four calls: "whichever you prefer". Yan's picks, as built.

## What changed
1. **The CSB's timing row** (kit). `CONTROL_SURFACE_LAYOUT`'s `csb-clock` is now `rewind · openers · door · app:gear · dock · app:time`
   (`lab/mir/shell/transport.js`). In `lab/lab.css` the t readout takes the rest of the row and reads from its right end
   (`align-items: flex-end; text-align: right`).
   - Stage, measured: ⏮ 592 · TIMELINE 636 · door 680 · ⚙ 724 · dock 768 · t 812–892.
   - In a card (docked or FREE), t is `flex: 1 1 0; min-width: 0`, so it fits the 246-px content after the five 32-px seats (202–273).
     Before, it ran 2 px past the bar.
2. **The rack card's BPM pill is 88 px** (`lab/lab.css`, `:is(.docked, [data-place="free"])` only; the stage pill stays 72).
   - The card's first band had no room for it: 48 PLAY + MOD and RATE + 88 + gaps came to 268 px in a 246-px box. So the card's
     `column-gap` is 0, and the empty middle cell takes the slack.
   - Measured: the pill sits at 185–273 inside the bar's 19–281.
3. **The scroll pill sits on the window's eyebrow** (kit). `createRackPills`' `seat()` sets the pill's left to the head's
   `.dev-eyebrow` left. Its `max-width` runs to `PILL.gap` (now 4 px) short of the head's first button after the name, or to the head's
   end if there is none. A longer name ends in an ellipsis (`rack.css`: `overflow: hidden; text-overflow: ellipsis`).
   - It never covers the head's buttons, the grip or the scrollbar.
   - The mask opens from the name's start on both racks.
   - A10's tip code is gone: `PILL.track`, the track and gutter reads, and the per-side clip rule.
   - Measured: left rack INFORMATIONAL 40–149 (Aa at 153, so it shows "INFORMATIO…"), SPECTRUM 40–128 (power at 157), CONTROL
     SURFACE 40–179. Right rack 1246→ (the eyebrow's start; buttons from 1389).
4. **The modulation window's workspace switch wears `lanes`** (kit). `workspaceSwitch({ glyph })` draws `glyphEl(glyph)` in the ink, at
   20 px, in place of the palette diamond (`lab/mir/window/workspaces.js`).
   - The modulation window passes `glyph: 'lanes'` (`modulation/window.js`), the TIMELINE opener's own glyph.
   - `window.css` sets the ink and the hover. `modhost.css` unstrokes the glyph (the plugin's button rules stroked its rects fat).
   - Every other MIR mark stays: the diamond is still the default, and `logoButton` is untouched.
- `docs/FOR-MIR.md`: one line at the top. `MIR-MANIFEST.json` re-hashed and pinned with `manifest.py`. `lab/sw.js` via `pwa --write`.

## Files
`lab/mir/shell/transport.js` · `lab/mir/shell/rack-scrollbar.js` · `lab/mir/shell/rack.css` · `lab/mir/window/workspaces.js` ·
`lab/mir/window/window.css` · `lab/mir/modulation/window.js` · `lab/mir/modulation/modhost.css` · `lab/lab.css` · `docs/FOR-MIR.md` ·
`MIR-MANIFEST.json` · `tests/mir-manifest.test.mjs` · `lab/sw.js` · shots `a-shots/A11-bar.jpg` · `A11-card.jpg` · `A11-pill.jpg` ·
`A11-switch.jpg`.

## Tests
- `./test.sh node`: only wigner W42-8 was red (the known timing flake); alone it read 16/16. `mir-manifest` PASS.
- `rack-deps --classes --no-write` green.
- Browser: `menubar` GREEN, `timeline` 14/14 GREEN, `frame-occlusion` all PASS.

## The CLAUDE.md sentences (THE CONTROL SURFACE paragraph)
- In A8's sentence, the timing row becomes: "⏮ · TIMELINE latch · the modulation door · ⚙ · the dock cycle · t (taking the rest, read
  from the right end; iteration 014 A11)".
- Add: "the card's BPM pill is 88 px (A11)".
- Replace A10's tip sentence with: "THE SCROLL PILL lies on the window's eyebrow, from the name's start to 4 px short of the head's first
  button (an ellipsis past it), so it never covers the head's buttons, the grip or the scrollbar (iteration 014 A11)".
- Add: "the modulation window's workspace switch wears the kit's `lanes` glyph (`workspaceSwitch({ glyph })`); every other MIR mark
  stays".

## Open for Josh
- A long name truncates on the left rack. INFORMATIONAL's head has room only for "INFORMATIO…", because the pill's bold face is wider
  than the eyebrow it covers. Say if the pill should drop to the eyebrow's own size instead.
