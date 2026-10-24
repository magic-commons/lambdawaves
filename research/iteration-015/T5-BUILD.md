# T5 THE DOORS — built (chain T, Opus builder, 2026-10-23/24; kit 1.5.0-alpha.26)

Josh: "Hitting the modulation button on the timeline and the timeline button on the modulation window should swap between them. The CSB
can allow them to be called both on the screen and magnet/stack on top of each other."

## What changed
- **The timeline's door swaps** (kit + app). `lab/mir/timeline/window.js` hands `transport.onSwitch` to the work bar's `createTransport`,
  whose `modDoor` already ran `onSwitch` in a work bar (`work()`); `lab/shell/keys.js` gives it `tl.close(); layout.modulation.expand()`.
  The modulation window's own switch already swapped the other way (`switchWorkspace`). Without `onSwitch` a kit door toggles as before.
- **The CSB opens both.** Its TIMELINE latch and its MOD door each toggle their own window and never close the other (unchanged; checked).
- **THE MAGNET** (`lab/shell/modulation.js`, beside `modDodge`). With both open the modulation window sits on the timeline: the kit's own
  lego stack, `modView.stackAbove(anchor)` (BASINS' stackAbove — the window's CONTENT 8 px above the anchor, clamped to the screen), handed an
  anchor whose `left` centres the window on the timeline's rect. It is asked on the window's open (`onOpen`, a new pass-through in
  `lab/mod-port.js`'s `port()` beside `opened`) and on every timeline layout (the kit window's `onMoved` → `modDodge(rect, 'tl')`: its open,
  its dock, a drag), so it follows. A hand's grip drag of the modulation window ends the kit's stack (`grip.begin`); the seam reads that
  (`ours && !isStacked`) as RELEASED until the window's next open. The timeline's close (`onMoved(null)`) unstacks and leaves the window where
  it is. No timeline event was missing: `onMoved` / `onWindow` already said everything.

## Measured (`tools/t-shots.mjs magnet`, 1600 × 914)
- CSB latch, then CSB door: timeline 364–1300 × 466–906 (docked at the foot), modulation window 291–1374 — centres 832 / 832.5; its work
  bars sit just above the timeline's work bar (shot). The window's top clamps at 62 here, so at this height the CSB (no free seat left, it
  keeps its seat) overlaps the window's head — a short-screen case.
- The timeline's door: timeline closed, modulation window open in place. The CSB latch again: the timeline opens under it, the window on it.

## Files
`lab/mir/timeline/window.js` · `lab/mir/version.js` (1.5.0-alpha.26) · `docs/FOR-MIR.md` (the alpha.26 heading, one line) · `MIR-MANIFEST.json` ·
`tests/mir-manifest.test.mjs` (manifest.py) · `lab/mod-port.js` · `lab/shell/modulation.js` · `lab/shell/keys.js` · `lab/sw.js` ·
`tools/t-shots.mjs` (scene `magnet`) · shot `t-shots/T5-magnet.jpg`.

## Tests
`tests/timeline.browser-test.mjs` GREEN 14/14 · `mir-manifest` PASS (alpha.26) · `rack-deps --classes --no-write` HOLDS (spectrum 25).

## The CLAUDE.md sentences
- THE FILM paragraph, after the work bar's door: "the door SWAPS — the TIMELINE closes and the modulation window opens (`onSwitch`, iteration
  015 T5)".
- The modulation window paragraph: "THE MAGNET (015 T5): with the TIMELINE open the window sits on it, centred, through the kit's
  `stackAbove`; it follows every timeline layout and a hand's drag releases it until the next open".

## Calls for Josh
- On a short screen (≈ 900 px) the two windows do not fit stacked; the window clamps to the top and the CSB lies over its head. Say if the
  CSB should dock into the timeline's work lane while both are open.
