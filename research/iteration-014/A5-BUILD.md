# A5 THE TIMELINE'S WORK BAR — built (builder A-side, 2026-10-22)

Josh: "Lambdawaves timeline is missing the leftside work bar from 'BASINS MIR 1.5' … the basic tempo, play/pause button and the likes";
answer 2: "not a left lane; the kit's TOP-LEFT work bar as BASINS shows it … Plus the frosted slab under λWAVES' timeline goes".

## What changed
- `lab/shell/keys.js` (the `installTimeline` call): `transport: false` → λWAVES' OWN kit work bar,
  `{ layout: [{ group: 'native-play-row', items: ['play', 'power', 'tempo', 'app:readout', 'rewind'] }, 'door'], nodes: { readout } }`
  — BASINS' TIMELINE_TRANSPORT less the dock (no rack seat: the stage strip stays where it is, A-PLAN assumption 3). The kit mounts it
  (timeline/window.js `bar: 'work'`): play = the controller's = THE play; power = `setModArm` (the bypass); the BPM pill = the kit's
  tempo on the one model M (a press types the tempo, BASINS' work form); ⏮ seeks the beat to 0; the door opens the modulation window.
  The `mod` handed to the timeline gained `isOpen` / `toggle` (the door) and `persist` (`ui.saveNative`, so a typed tempo is saved as
  the stage pill's is).
- The readout: a second kit `readout()` (`ui.tlTime`, label `t`), painted from the loop's one timeline line next to `paintHead()`
  (`lab/rack.js`, the line that already paints the playhead): 5 Hz while playing, every paused present, `set` writes only a change.
  `lab/shell/transport.js` was NOT touched (builder A-bar owns it); the text is t alone (no lap), compacted as the strip compacts it.
- `lab/skin.css` foot, beside the iteration 012 B1 rules:
  - THE SLAB: measured in the page, `.timeline-surface` and `.tl-viewport` paint nothing; the milky slab was the window ROOT itself,
    `rgba(255,255,255,.1)` from the refractive `.glass` frost beating the kit's layered `--tl-win-fill: transparent`. One rule clears it
    (`body .mir-win.glass.mir-timeline { background: transparent; }`). The panes (toolbar, work bar, ruler, lanes) keep their glass, as
    BASINS' do (A-PLAN guessed the lanes; the measurement says the root).
  - THE FACE: λWAVES' unlayered strip rules (`.tbtn`, `.tbtn.play` filled teal, `.mod-exp`) beat the kit's layered work-bar look and
    broke the BPM pill; inside `.mir-timeline .tl-transport` they step back with `all: revert-layer` — BASINS' bar exactly.
  - The readout in BASINS' readout seat and face (basins.css `.transport-decade`: the math face, 26 px, italic `t`, never a target).
- `lab/sw.js` via `node tests/pwa.test.mjs --write`.

## The shot
`research/iteration-014/a-shots/A5-workbar.jpg`: BASINS (top), λWAVES before (left) and after (right).

## Tests
`./test.sh node` green; `frame-occlusion` 7/7 PASS (the work bar is `.glass` inside the window, so the timeline's occlusion register
already masks it; timeline T4 reads `bar: true`, 23 masks); `timeline` 14/14 GREEN; `menubar` GREEN. `node tools/rack-deps.mjs --classes --no-write` green
(no `app` key added; `ui` is the flat registry).

## The CLAUDE.md sentence
THE TIMELINE'S WORK BAR (iteration 014 A5) is the kit's own work-bar transport, λWAVES' own (keys.js `installTimeline` `transport:
{ layout, nodes: { readout } }`: play · power · BPM · t · ⏮ · door, no dock) — two plays while the timeline is open, both THE play; its t
is `ui.tlTime`, painted beside `paintHead()`; skin.css clears the window's own fill (the slab) and reverts λWAVES' `.tbtn` rules inside it.

## Open for Josh
- The readout shows t (a.u.) without the lap the stage strip adds in brackets; say if the lap belongs there too.
- The door is the kit's palette diamond (BASINS'); the λWAVES mark is `door: 'mark'`, which the kit's timeline does not pass through.
