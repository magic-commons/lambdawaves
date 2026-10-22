# A4 THE SEATS — built (builder A-bar, 2026-10-22)

## What changed
- Kit (`shell/transport.js` + `.css`, alpha.25): `createTransport({ places, onDock })`.
  - `places` turns the dock chip into a cycle. `nextPlace` gives the next seat, and the chip wears the NEXT seat's glyph and words:
    `dock` → rack, `barsBottom` → stage, `popOut` → free.
  - `setPlace('rack' | 'stage' | 'free')` and `cycle()` are on the api.
  - FREE is a new placement (`placementOf` order: rack, free, work, stage). It moves the SAME bar node into a window of its own
    (`createWindow`, chrome 'close', not resizable, empty glass drags).
    - The window takes the bar's size (layout sizes, never a rect: the open motion scales it). It refits when the panel opens and
      when the orientation turns.
    - Its rect is remembered in `mir.transport.free`.
    - Its × puts the bar back on the stage (call 5's assumption).
  - VERTICAL is a chip in that window's head (`swap` glyph, `data-orient="vertical"`); the rows become columns.
  - The seat store writes `{ v: 2, seat, place, orient }`. A FREE seat comes back on reload. The rack seat stays λWAVES' WORKSPACE
    record (`captureLayout.docked`).
- λWAVES (`lab/shell/transport.js`):
  - `places` is `['rack', 'stage', 'free']`, or `['rack', 'stage']` on a phone. The phone still boots docked; the STAGE is every
    desktop's boot (answer 1).
  - `onDock` opens the TRANSPORT card at its remembered slot or closes it, so the kit docks through λWAVES' own card.
  - A0's static `north` face is gone; the chip now says where it goes next.
- `layout.dockTransport()` (T, WINDOW › DOCK / UNDOCK) is `bar.setPlace(docked ? 'stage' : 'rack')`. It works from the FREE window too.
- `rack.js` `canPresentTransport`: the FREE window presents whatever the rack does. `modulation.js` `modDodge` never moves a FREE bar.
- `lab/lab.css`:
  - A FREE bar sits in the window's flow and a hidden rack never parks it.
  - Vertical: rows become columns, a seat's flex-basis returns to auto, the scrub is 96 px, the chooser leaves (the search finds a
    molecule) and `#lwMode` stacks.

## Tests
`./test.sh node` green · rack-deps green · menubar · history · new-project · frame-occlusion · keyboard-window · timeline · lw-links green.
Driven by hand (shot tool):
- the cycle reads stage → free → rack → stage;
- × on FREE gives stage;
- T from FREE gives rack, and T again gives stage.

## Shots
`a-shots/A4-free.jpg`, `A4-free-vertical.jpg`.

## CLAUDE.md sentence
"THE SEATS (iteration 014 A4): the CONTROL SURFACE's dock chip cycles RACK → STAGE → FREE (the kit's `places` / `setPlace`; the STAGE at boot,
a phone docked and never FREE); FREE is the one bar in a kit window (`createWindow`, × → STAGE, rect in `mir.transport.free`) with a VERTICAL
chip (`data-orient`); T is `setPlace(docked ? 'stage' : 'rack')`."

## Questions for Josh
1. Vertical keeps the SCRUB as a short horizontal line, and the chooser leaves. Should the vertical bar drop SCRUB too?
2. The search's collapse to a glyph in vertical is A2's.
