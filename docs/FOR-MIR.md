# FOR MIR — items for the kit, found in λWAVES (2026-10-19)

λWAVES adopts the MIR kit at `lab/mir/` and never edits it (CLAUDE.md). What the app finds wanting in the kit is listed here for the kit's own
round, newest first; an item leaves this list when an adopted MIR release carries it. Each names where it was met.

## Josh's ruling the kit should carry (2026-10-18)
- **A target carries a MODULATION route OR a TIMELINE lane, never both.** Josh: "the timeline and routed dial is either-or, because modulation is
  essentially a locked timeline and a timeline is essentially a free modulation. User can pick either but not both, clips will have an error and
  always choose the top-most one." Today the kit adds a lane and a route together (iteration 007 row B found it; `timeline/knobs.js`, `modulation/bind.js`).

## From iteration 008 (Claude Yan, 2026-10-19)
- The kit carries the **n = 7 shell colour** (row A7: λWAVES' register is 140 labels; the kit's shell palette stops at six).
- The **ORBITAL dial steps one orbital per arrow key** (an integer target's arrow keys; row O / R: `chem.orbital`).
- The **stepper reports a re-pick** (picking the option already shown should raise an event; rows P and R needed it for a reload).

## From THE MIR SYSTEM CHECK (Claude Sos, 2026-10-18; `research/iteration-007/mir-check/`)
- **SAVE AS ZIP… by keyboard with a FOLDERS tile selected** names the zip after the tile but zips the live project (`folders/folders.js:370`,
  `zip.js:40`); a mouse press deselects the tile first, so only keyboard users meet it. (files B3)
- **A clip's end snaps the value back** to the knob's own value instead of holding the last automated one (`modulation/host.js:274-275`;
  hue went 0.876 → 0 in one frame). (timeline P2)
- **The timeline's own UNDO / REDO rows are dropped** when the host already owns the ids `undo` / `redo` (`timeline/shortcuts.js`,
  `shell/keys.js` add leaves an existing id as it is); λWAVES works around it with `timeline.undo` / `timeline.redo` rows under the
  timeline's focus (`lab/shell/keys.js`). The kit could name its rows `timeline.undo` / `timeline.redo` itself. (timeline B1)
- **RENDER › FILES is a closed disclosure with no caret**, so SAVE AS ZIP… / OPEN ZIP… hide behind a bare heading (kit CSS). (files polish 1)
- **Opening the same ZIP again adds a copy each time** (ZIPPED 2, ZIPPED 3) while a `.json` import of the same content dedupes. (files polish 2)
- **The FLASH GUARD's sentence shows only in METERS**, which ships closed, so a held picture gives no visible reason. (modulation polish 1)
