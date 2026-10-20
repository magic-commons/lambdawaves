# L2 — THE LIBRARY'S LAYOUT (iteration 012, branch `it012-library`)

## What changed (`lab/picker.js`, `lab/picker-fx.js`, `lab/skin.css`, `lab/settings-store.js`)
- **The tags in two rows, the head row between them in height**: inside a volume the tags are two rows in one sideways strip (`.mm-tagrow`
  × 2 inside `.mm-tags`; the wheel still scrolls it). Each tag, in its count's order, goes to whichever row is shorter so far, so both rows
  read most-common first and end together. The back icon, ‹ VOL. I ›, the count, the search and SHOW LABELS sit centred on the strip's
  middle (measured: rows at 186 / 218 px, the search 201–230).
- **Side margins on a 16:9 screen**: on a desktop ≥ 1100 px a deck (MOLECULAR and a volume's) keeps a rack's width + 20 px clear each side
  (`--rack-w`, capped so a narrow desktop keeps 900 px): at 1920×1080 the deck spans 321–1599 px, clear of the racks (10–290, 1630–1910).
  The ATOMIC table is not a deck and is unchanged.
- **Under the logo, centred: RETURN HOME · FOLDERS · THE HUE ring** (`.mm-nav`). RETURN HOME (`home.svg`) closes the Picker into the lab;
  FOLDERS (`folders.svg`) is the door that sat at the top left (same action: the Picker closes, FOLDERS shows). THE HUE ring is a dial
  dressed as a circle: a conic colour wheel masked by `hue-ring.svg`, its tick turned to the hue in use; a vertical drag (a full turn in
  360 px, Shift ⅛ — the kit's ONE KNOB LAW), the wheel, ↑ ↓ ← → turn it, a double-click / Home / Delete puts it at 0; it is a `role=slider`.
  It turns every molecule picture (`.mm-mol .mm-pic`, the MOLECULAR deck and a volume's) by `hue-rotate(--mol-hue)`.
  **Scope: PREFERENCE**, in the Picker's own record `lambdawaves.q0.picker` (`hue`, degrees, default 0) — the FAMILIES row in
  `lab/settings-store.js` (not the look store: `mir.gui` holds the kit's LOOK_SCHEMA rows and the app does not extend the kit's schema).
  Never in a project, a link or a history row (serialize never reads it).
- **The caption's hover animation fixed** (`lab/picker-fx.js` `swapLine`): the leaving line's exit had `fill: backwards`, so on its last frame
  it snapped back to full opacity before it was removed — a flash of the old name on every hover. The exit now holds its end (`fill: both`).
- **ATOMIC · MOLECULAR · LIBRARY** in the app's serif title face (`LW Title`), 16 px (from 11), each with its I1 icon on the left
  (on a phone the icons stand down for width).
- **Install = `download.svg`, remove = `trash.svg`**, in the install ring's eye (volumes and the section cards; the section card's lamp is
  gone — the eye and the full accent ring say installed); the MOLECULAR deck's away glyph is `download.svg` too.
  **The page arrows** are `arrow-left.svg` / `arrow-right.svg` (3.5-unit stroke), 22 px, with the R4 swell kept.
- **Inside a volume** the SHOW LABELS under the tabs stands aside for its twin in the head (`.in-volume`, kept in place by `visibility`).

## The other elegant animations (each off under `prefers-reduced-motion`)
1. **The hue glides**: turning THE HUE ring eases the pictures' colour over 360 ms, and the ring's own turn over 120 ms.
2. **A tag or a search deals the page in**: the volume's tiles re-enter with the Picker's staggered entrance (`enterTiles`) after each
   filter (`animate()` returns null under reduced motion).
3. **The labels rise**: SHOW LABELS fades each formula in from 4 px below (240 ms).
4. **The nav icons swell** under the pointer (×1.1, ×0.94 on a press) and a tab's icon lifts 1 px on a hover.

## Files
`lab/picker.js` · `lab/picker-fx.js` (one line) · `lab/skin.css` (the L2 block; the door's and the lamp's rules gone) ·
`lab/settings-store.js` (the FAMILIES row names the hue) · `lab/sw.js`.

## Tests
`./test.sh node` green · `tests/start.browser-test.mjs` GREEN 3/3. Shots (1920×1080): `l-shots/l2-molecular.png` (HUE 150°, labels on),
`l-shots/l2-library-volume.png` (two tag rows), `l-shots/l2-library-shelf.png` (download eyes).

## CLAUDE.md sentence for Yan
THE LIBRARY'S LAYOUT (iteration 012 L2): under the Picker's logo RETURN HOME · FOLDERS (the door, once top left) · THE HUE ring (a slider
dressed as a circle that hue-rotates the molecule pictures; PREFERENCE `hue` in `lambdawaves.q0.picker`, default 0); the tabs in LW Title
with I1's icons; a deck keeps a rack's width + 20 px clear each side on a desktop; a volume's tags are two rows with its head centred
between them; install / remove wear `download.svg` / `trash.svg` in the ring's eye.

## Open questions for Josh
1. THE HUE ring turns only the molecules (your note named their thumbnails); should it turn the ATOMIC table's pictures too?
2. With the margins a 1920 deck is 8 × 4 molecules (was 10 × 4). Wider or narrower?
