# C4 HANDOFF — the modulation window and the one clock (live state; superseded by C4-BUILD.md at the end)

Worktree `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-ac5f1a2ff05f502de`, branch
`worktree-agent-ac5f1a2ff05f502de`, reset to `7044f37` (sos-s0 tip). Never pushed, merged or tagged.

## State
- `b7ad98b` the bare adopt of MIR 1.5 alpha.24 (adopt.mjs --line 1.5; 196 added, 23 updated, 0 removed, 43 unchanged), identical to C0's.
- `lab/*.js` 36,288 before the adopt.
- Reading done. Design chosen (see "Design" below). Next: wire the kit's `createModulation` (lab/mir/modulation/window.js) over A5's port.

## Design (decided)
- The window: the kit's `createModulation(floats, mod.port(...))` from `lab/mir/modulation/window.js` (MODULATION.md's λWAVES row:
  "rack.js builds the port: createModulation(floats, port)"). Not `installModulation` itself: it builds a second host and its own
  core/frame.js tick (a second clock advancer beside rack.js `loop()`), keeps a device copy of the rack (`modulationState`) and a
  second visibility listener. `project: false` holds by construction: no `registerModulationParts` call.
- The one clock: `installModulation().play`'s law, i.e. A6's `mod.follow` on EVERY play edge (no armed/LINKED gate). The power is
  `host.clock.setModulationEnabled` (a route bypass; time runs), as bind.js `setArm`.
- LINKED/SEPARATE retired: `clockLink` gone; the tempo tiles lose LINKED and MOD ▶ (10 → 8).
- The three keys leave the PREFERENCE blob: `clockLink` retired; `modArm` + `modCadence` move to the kit's modulation record
  (bind.js `localStore('lambdawaves.q0.modulation')`, installModulation's record shape), read once from an old blob.
- `lab/audio.js` leaves: the kit's `modulation/audio-capture.js` is the same capture (same exports). `tests/audio.test.mjs` re-aimed.
- `lab.css` badge ladder (the `:root:root:root:root` block + `.k-route-x`, lines 432–446 on 7044f37) leaves: modhost.css carries it.
- The `s3` question: a reload boots the shipped rack (no reopen-last-project), so WAVE DANCER's `s3` does not exist after it and
  the window's prune law drops its mode. To verify with tools/settings-probe.mjs.
- `mir-controls` red: MIR 1.5's ONE KNOB LAW (vertical drag, ⅛ fine gear); the test drags sideways at 1.4 numbers. Re-aim.

## Exact next step
Edit rack.js: import createModulation from './mir/modulation/window.js'; set `root.dataset.mirWindow`; pass `dock: false`;
make `modDodge` accept `null`. Then `node tests/pwa.test.mjs --write`, node gate, browser closers on 8833/5303.
