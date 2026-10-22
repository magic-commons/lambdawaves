# A10 THE PILL'S TIP — built (builder A-side, round 2, 2026-10-22; kit 1.5.0-alpha.25, same round)

Josh's answer 8: "Yes, and now I think the default should be Accent A instead to match the scroll bar. Make the scroll bar also be at the
very tip of the pill so that the pill doesn't overlap the scroll bar."

## What changed (kit)
- `lab/mir/shell/rack-scrollbar.js` `createRackPills` `seat()`:
  - It finds THE TIP once per burst: the seated track's inner edge (left rack: the track's left; right rack: its right), or, when no track
    runs or it is hidden, where `scrollbarSeat` would put it (left: `rack.right − gutter − SCROLLBAR.leftIn`; right:
    `rack.left + gutter − SCROLLBAR.rightIn + PILL.track`).
  - The pill is anchored by its outer end, `PILL.gap` = 2 px short of the tip (left rack: CSS `right`; right rack: CSS `left`), and
    reaches inward over the title bar. It is never under the thumb.
  - `PILL` is now `{ linger: 900, gap: 2, track: 12 }` (`track` = rack.css `--rack-scrollbar-w`, used when no track is seated). The card
    rect read is gone; only the head's centre is read.
- `lab/mir/shell/rack.css`:
  - The fill is `var(--acc)` by default and `body[data-rack-pill="b"]` → `var(--acc2)` (OFF as before).
  - The mask opens from the tip inward: left rack `inset(0 0 0 100%)` → 0, right rack `inset(0 100% 0 0)` → 0. Hiding reverses it,
    180 ms as before.
- `lab/mir/shell/gui.js`: LOOK_SCHEMA `rackPill` default `'a'`. A writes nothing, so `body[data-rack-pill]` is set only for OFF and B. A
  stored `'b'` from round 1 keeps B; the en.json words are unchanged.
- `docs/FOR-MIR.md`: a new line at the top. `MIR-MANIFEST.json` re-hashed and pinned with `manifest.py`. `lab/sw.js` via `pwa --write`.

## Measured (probe, both racks unfolded and scrolled 40 → 160 px)
- λWAVES runs its native 2-px bars, not the seated track, and its racks' `--rack-shadow-gutter` reads 0, so `scrollbarSeat` is null and
  the tip is the fallback.
- Left rack: the pills end at x 290 (INFORMATIONAL 166–290, SPECTRUM 202–290); the native bar is at x ≈ 297.
- Right rack: the pills start at x 1210 (SETTINGS, STATE, PALETTE); the native bar is at x ≈ 1203.
- Fill `rgb(0, 162, 149)`, accent A, the scrollbar's own colour.
- Seating the kit's track by hand over λWAVES' racks gives the same tips: with a 0 gutter the kit hides its track, by its law 2.
- Shot: `research/iteration-014/a-shots/A10-pill-tip.jpg` — the left rack mid-scroll with its thumb beside SPECTRUM's tip, and the right
  rack's STATE and PALETTE pills opening from the rack's inner edge.

## Tests
`./test.sh node` rc 0; `timeline` 14/14 GREEN; `menubar` GREEN; `rack-deps` green; `mir-manifest` PASS; `frame-occlusion` 7/7 alone twice
(its detached-gap row 100 red once in the chain at load 15 — the solvers; no pill is an occlusion source).

## The CLAUDE.md sentence
THE SCROLL PILL is accent A by default (the scrollbar's; `rackPill` OFF | A | B) and its outer end stops 2 px short of the rack's scrollbar —
the seated track's inner edge, else `scrollbarSeat`'s x — so it reaches inward over the title bar and never covers the bar
(iteration 014 A10).

## Open for Josh
- With the tip at the scrollbar, the pill now sits over the title bar's end: on the right rack it covers the grip and the window's own
  eyebrow, which says the same name; on the left rack it covers the head's buttons for the 900 ms it shows. Say if it should stop at the
  eyebrow instead.
