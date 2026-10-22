# A0 ADOPT THE KIT'S BAR — built (Claude Yan's chain, builder A-bar, 2026-10-22)

## What changed
- `lab/shell/transport.js` now calls the kit's `createTransport` (imported as `createBar`). The layout is named `lambdawaves`, and its items
  keep the order the strip always had: play · MOD · ⏮ · ‹ › · SCRUB · RATE · t · REPEATS · ⟳ · dock · door · BPM pill, then the panel.
  λWAVES' own nodes are handed in by name: ‹ ›, SCRUB, RATE, t, REPEATS, ⟳. The kit builds play, power, rewind, dock, door, pill and panel.
  - THE PLAY is the kit's play part over `appPlay` (each press schedules EVOLVE). ⏮ is the clock adapter's `seek`, with wave 106's playhead reset.
  - THE POWER is the kit's power seat wearing the word MOD (`powerWord`). Its press calls `setModArm`; `setModArm` notifies the bar (`onArm`).
    `ui.modB` is that seat.
  - The door is the kit's `mark` door: the same nine squares, still spinning under the mouse, still `ui.modExp`.
  - The tempo pill and its panel are the kit's `tempoPill` and `tempoPanel`. The panel holds the MACROS rail (the modulation window's rows)
    and the CLOCK tiles. The repeat mathematics `infoPanel` is in the panel's corner, as before.
  - The dock chip keeps λWAVES' `north` drawing undocked and wears the kit's pop-out glyph docked.
- `lab/native-ui.js`: λWAVES' copy of the expander, l.70–174 (pill, panel, macro rail, clock tiles, 200 ms sync), is deleted.
- `lab/shell/notebook.js`: the hand-made dock chip and logo door (l.24–43) are deleted.
- `lab/shell/rack-wiring.js`: the hand dock is gone. `layout.dockTransport()` now opens the TRANSPORT card at its remembered slot or closes it,
  and the card's `onOpen` / `onClose` call the kit's `transportDock(rk)` hooks, so the kit moves the bar. `layout.docked` reads the bar's
  `docked` state. The card stays λWAVES' own (`card: true`: its slot, its fold, the phone's top seat). It is closed by the `closed` class
  instead of `hidden`. `captureLayout` still writes `closed: false` for the card, so saved bytes do not move. `layoutExtras` no longer
  sets the card's `closed` from a record. `bar.start()` runs once `app.sh.rk` exists.
- `lab/lab.css`: one rule sets the kit's play glyph to the old ▶ size on the stage. l.292–313, the 560/640 px box, stays. The kit's
  `data-layout="lambdawaves"` drawing is under it, but A1 replaces that box with the CSB's two rows, so deleting it now would be churn.

## Kit (1.5.0-alpha.25; one line each at the top of docs/FOR-MIR.md)
`transportDock(rack)` export · `createTransport({ seatMenu: false })` · `modPower({ word })` / `powerWord` · transport.css: λWAVES' seat
rules apply only undocked (`:not(.docked)`). MIR-MANIFEST.json was re-hashed, and the new manifest sha is pinned in
`tests/mir-manifest.test.mjs` ACCEPTED.

## Shots (1920, `research/iteration-014/a-shots/`)
A0-before.jpg and A0-after.jpg match to the eye at rest. Panel open and docked also matched (crops in .tmp/, not kept). Remaining
differences:
- WALL now lights while the clock follows the wall clock. The kit latches say the truth; λWAVES' copy never lit it.
- The docked card is 10 px taller.

## Tests
`./test.sh node` green · rack-deps `--classes` green (transport 10 crossings) · menubar · history · new-project · frame-occlusion ·
keyboard-window · timeline (14/14) · lw-links green. keyboard-shortcuts is a node suite, inside `test.sh node`. `pwa --write` run.

## CLAUDE.md sentence (for THE SHELL)
"λWAVES' transport strip is the kit's `createTransport` (iteration 014 A0): `lab/shell/transport.js` hands it ‹ › SCRUB RATE t REPEATS ⟳ as
nodes, THE PLAY (appPlay) as its clock and setModArm as its power (word MOD); the docked seat is λWAVES' TRANSPORT card, the move the kit's
`transportDock`."

## Questions for Josh
None for A0. The MOD word becomes the power ring in A1 only if he wants BASINS' glyph. A1 keeps the word.
