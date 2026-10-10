# 0.5.2 · Rack Dissolution — what changed, one line a row (for Josh)

The release is a refactor: `lab/rack.js`'s 4,800-line `boot()` dissolves into modules under `lab/shell/` and `lab/windows/` along the file's
real seams, over an explicit context. Nothing a hand or an eye meets is meant to move; every row proves it with THE LOCK (860 + 1004 values,
0/0), the serialize bytes (11/11), the settings probe (0/6), the facade fixture (176 members) and the main-thread pair.

- **R0 THE CONTEXT** (`72fa863`, merged 2026-10-10 01:20): `boot()` gets ONE `app` of fixed-shape namespaces (`dom`, `ui`, §0's consts, `hooks`, `state`,
  `loop`, `host`, `w`, `ctl`, `sh`); the 57 variables two modules share live as `app.state.x`; the dead `windowActivity` wrapper, a duplicate `frost`, two dead
  reads and four unused imports leave. `lab/*.js` 27,666 → 27,693. The hinge measured: 0 bare cross-module writes (54 before), every moving module ≤ 25
  forward + shared. **You see nothing.**
- **R1 THE CONTROLLER** (`e00a73c`, merged 2026-10-10 07:10): the governor, AUTO SCALE's rule, the look, the busy marks, the mod port, the rotation drive,
  `createField`, the maths workers and the one road of state mutations leave `rack.js` for `lab/shell/controller.js` (339 lines, 293 of 303 moved lines
  byte-identical), awaited where they stood; the frame loop stays. `rack.js` 4,958 → 4,664. The tool now measures a moved module from its own file. The lock
  860 + 1004 at 0/0, the main-thread pair +0.04 / +0.16 ms/s, serialize bytes 11/11. The integrator then filled the 56 controller names the later modules
  read onto `app.ctl` once (+15 lines) so no pair row touches that file. **You see nothing.**
- **R2a STATE + SPECTRUM** (`a8cb47e`, merged 2026-10-10 08:08): the STATE card (with CLEAR) and the SPECTRUM card leave `rack.js` for
  `lab/windows/state.js` (182 lines) and `lab/windows/spectrum.js` (264), created where they stood; 393 of 413 moved lines byte-identical, the rest
  read a later-made name through its slot. `rack.js` 4,664 → 4,261. SPECTRUM's row stays at 24 of the hinge's 25 because a module destructures the
  controller's names once at creation (a read at use would have counted 32). Serialize bytes 11/11, the facade 1/1, the settings blobs the same; the
  rig's stalls were measured against the base, law for law. **You see nothing.**
- **R3a SETTINGS + PERSISTENCE + LINKS + HISTORY** (`865e746`, merged 2026-10-10 08:38): §1, §24, §25 and THE TRUE HISTORY leave `rack.js`
  for `lab/shell/settings.js` (147 lines), `persist.js` (311), `links.js` (85) and `history.js` (166), created where they stood; 623 of 665
  moved lines byte-identical, the rest read a later-made name through its slot. `rack.js` 4,261 → 3,607 with both of PAIR 1 in. Persist's row
  23 of the hinge's 25; 0 bare writes. Serialize bytes 11/11, the facade 1/1, the settings blobs the same; `history` stops at a frame-paced
  wait on both trees (the rig). **You see nothing.**

- **R3b THE SHELL** (merged 2026-10-10 10:03 from `7a69aba`; clean): §12 the transport strip, §19a the rack wiring (two seats — the module and its `wireStage()`),
  §19b the notebook with MENUS and PROJECTS whole, §20–§23 the keys with the KEYBOARD window and the TIMELINE leave `boot()` for `lab/shell/transport.js` (233
  lines), `rack-wiring.js` (341; §18's `devById`/`rackCardWidth`/`popFace` with it — `popFace` reads `layout` while the module is being made),
  `notebook.js` (379) and `keys.js` (217); 1,101 of 1,121 moved lines byte-identical, 17 read a later name through `app.sh`, 3 fills became registrations.
  `rack.js` 3,605 → 2,448; 12 import lines out, 36 blank lines out; 31 slots filled in `boot()` for the shell's reads (`app.sh.LW` the facade object). The
  hinge holds (notebook 21, keys 13; SPECTRUM 24 the largest); 0 bare writes. Serialize bytes 11/11 full + edit, the facade 1/1, `timeline` 14/14, `offer`
  16/16, `new-project` 8/8, `keyboard-window` green; `menubar`, `history`, `frame-occlusion`, `hit-probe-set`, `settings-probe` and the boot chunks stop
  where the base stops (the rig). **You see nothing.**
