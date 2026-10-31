# 029 Q — THE FRONT END QUICK FIX (built)

Josh, 10-30: "In main menu, there seems to be a empty space between search bar and the tags, reduce the tag lines to only 2 rows and show
a visible scroll horizontal bar. That way we can give more breathing room for the molecule thumbnails since they seem so cramped."

The tags live in a volume's head (LIBRARY → a volume), so that is where this was measured: VOL. I, the look arg ψ, headless Firefox on
the gate server, the viewport given (the window is 86 px taller for the browser's chrome).

## The cause of the empty space

Measured at 1440 × 900, the search pill and the tag rail were only 13 px apart (the `.mm-top`'s 4 px foot plus the `.mm-sec`'s 8 px head,
the house's spacing everywhere else in the Picker). No hidden element and no empty seat sat between them. The space Josh saw came from the
**third tag row**. The head row (‹ VOL. I › · count · tags · A–Z · MASS · SHOW LABELS) is one flex row centred on its tallest seat, and three
rows of chips made that row 74 px tall. Its other seats are 34 px, so a 20 px empty band lay above them, under the search pill, with
another below them. That put 33 px of nothing between the search pill and VOL. I. The rail also hid its scrollbar (`scrollbar-width: none`),
so 1,177 px of tags beyond its 243 px window gave no sign they were there.

## What moved

- `lab/picker.js` `paintTags`: two rows (`[0, 1]`), filled by the same shortest-row rule.
- `lab/skin.css` `.mm-tags`: the scrollbar is visible. It is the rack's own bar (`lab.css` `#rack`: `scrollbar-width: thin;
  scrollbar-color: var(--acc) transparent`, and for WebKit an accent thumb 4 px tall), turned sideways. It is not a new design. The kit's
  SCROLL PILL is a window-name bubble for the rack's vertical scroll, not a rail's scrollbar, so it did not fit here. The rail's foot padding
  went from 1 px to 4 px so the bar clears the second row.
- `lab/picker.js` `deck(host, room = 10)`: a volume's deck is `deck(view, 16)`, which puts 16 px between tiles on a desktop (6 on a phone,
  as before). It keeps the same `size()` law (the tile from the height, the columns from the width, eight across while a tile stays
  ≥ 150 px). The MOLECULAR deck and the ATOMIC table keep 10 px.
- `docs/laws/picker.md`: one paragraph, THE VOLUME HEAD BREATHES (supersedes 014 C3's three rows).

Label-only: no CSS hook, id, stored key or window id changed.

## The numbers (VOL. I, before → after)

| viewport | search → rail | head row | tag rows | rail window / content | tile | gap | grid |
|---|---|---|---|---|---|---|---|
| 1440 × 900 | 13 → 12 px | 74 → 58 px | 3 → 2 | 243 / 1,420 → 277 / 2,087 px, bar 0 → 6 px | 143 → 145 px | 10 → 16 px | 5 × 3 → 5 × 3 |
| 1280 × 720 | 13 → 13 px | 74 → 58 px | 3 → 2 | 318 → 378 px | 130 → 135 px | 10 → 16 px | 6 × 2 → 6 × 2 |
| 1920 × 1080 | 13 → 14 px | 74 → 58 px | 3 → 2 | 758 → 627 px | 150 → 149 px | 10 → 16 px | 8 × 4 → 7 × 4 |

At every size the head gives back 16 px, and the dead band above the head's words goes from 20 px to 12 px. The search-pill-to-VOL. I
distance goes from 33 px to 24 px. The room goes to the gaps between the thumbnails: 10 → 16 px, so the pictures stop touching. The tiles
stay the same size or grow, except at 1920 × 1080. There, under the same column law, the wider gaps leave seven 149 px columns where there
were eight 150 px ones (32 → 28 a page). That is the trade the law makes when the gaps widen.

Shots, 1000 px JPEG: `Q-shots/before.jpg` and `Q-shots/after.jpg` (1440 × 900), and `Q-shots/after-1280.jpg` and
`Q-shots/after-1920.jpg` (nothing broke; the 1920 one shows the seven columns).

The road still works (a one-off probe in /tmp, kept out of the tree): a search ("benz" → 296 / 6,927), a tag (chain → 2,152 / 6,927,
aria-pressed), ArrowRight on the deck (page 1 → 2 of 462), the wheel turning the rail sideways (scrollLeft 0 → 120), and Escape closing
the Picker. There were no page errors.

## Gates

- `node tests/pwa.test.mjs --write && ./test.sh node`: EXIT 0, 914 GREEN lines (state-scopes and hints-census are inside it). `lab/sw.js` was re-precached by `--write` because picker.js and skin.css changed.
- browser, on my own server (9833 / GD 5833), one at a time: `picker-looks` GREEN, `library` GREEN (7 scenes), `start` GREEN (3 of 3).
  `molecular-names` is RED at its first assertion: "ATOMS has no row in WINDOW", because the menu now reads `["FINDER…","RACKS","TOOLS",…]`.
  That failure is older than this row. The test was last touched at `578868dd`, before `a9b6d61c` (I3 THE MENUS) grouped WINDOW into
  submenus, and nothing in this row touches the menus. I left it alone; it needs its own row.
- THE LOCK was not run because the field did not change (no shader, no material, no draw path; the Picker is DOM over the stage).

## What was left

- On iPad portrait (820 wide) the head row's fixed seats leave the rail only 33 px (2 rows now, still a sliver). The ≤ 700 px rule that
  gives the rail its own line does not reach 700–1000 px. Moving that breakpoint is a one-selector change but costs a head row there.
  That is a call for Josh.
- The rail's edge feather (its 14 px mask) also fades the ends of the new bar. I left it: the thumb reads clearly once it is in from the
  edge.
- The MOLECULAR deck's thumbnails keep 10 px gaps. Josh asked about the volume's.
