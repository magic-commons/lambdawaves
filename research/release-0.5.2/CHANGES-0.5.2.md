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

- **R2b THE READOUTS + KEPLER** (merged 2026-10-10 10:18 from `7ed3c1b`; conflicts in REPORT.md and sw.js only): the nine readout cards leave `boot()` for
  `lab/windows/readouts.js` (158 lines, THREE seats — the root and two root-level `function create<Y>()` seats `boot()` calls where CALCULUS and ATOMS stood,
  so every card is created in its old order; `READERS`, the track loop and `hydroReader` stay) and THE BOW + KEPLER for `lab/windows/kepler.js`
  `createKeplerSurface(app)` (307); 424 of 433 moved lines byte-identical, 8 read a slot, the ten inherited fills became registrations (+`keplerTurn`).
  `tools/rack-deps.mjs` learns the multi-seat shape (+1 law, 54 PASS). The integrator dropped six import names only the moved code used (R2b's three and R3b's
  three, left apart on purpose so the pair's hunks would not touch). `rack.js` 2,448 → 2,001 with both of PAIR 2 in; `lab/*.js` + shell + windows 27,893 of
  27,943 (50 left for PAIR 3's seven and R5). The hinge holds (readouts 7, kepler 4; SPECTRUM 24 the largest); 0 bare writes; 13 module files measured.
  Gates on the merged tip: node exit 0; `rack-deps.test` 54 PASS; `serialize-bytes` 11/11 full + 11/11 edit vs the 0.5.1 base (`8755`); `lw-facade` 1/1; `settings-probe` 2 of 6 reached then WATER stalled (the rig — the base's recorded reading is identical); the six new module files and `rack.js` parse. **You see nothing.**

- **R2c THE MATERIAL + THE SETTINGS CARD + THE FILM ROAD** (merged 2026-10-10 12:30 from `5cff63e`; clean): WAVE · CLIP · PALETTE · CAMERA leave `boot()` for
  `lab/windows/material.js` (127 lines, two seats — the root and `createDrawClipPaletteCamera()` where DRAW stood), the SETTINGS card for `settings-card.js` (177;
  two seats, `createFieldQuality()` where FIELD QUALITY stood; its seven stage hooks registered at the root) and the film road for `film.js` (22; one seat);
  `filmHold` stays in `boot()` as `app.loop.hold` by value. 296 of 319 moved non-blank lines byte-identical, 15 re-indented, 8 read a slot; 15 import names out
  (the dead `toLUT` among them). `rack.js` 2,001 → 1,681; `lab/*.js` + shell + windows 27,893 → 27,902 (41 under the cap). The hinge holds (material 1,
  settings-card 5, film 5; SPECTRUM 24 the largest); 0 bare writes; 16 module files measured. The builder's light check: node 0; `lw-facade` 1/1;
  `film-handover` 4/4; `film-probe` + `film-compare` identical to the base in digests, times and MP4 bytes; `camera-routes` SAME 5/5; `camera-shift` green;
  `serialize-bytes` 11/11 full + edit; `take-in-bugs` 4/4 on its third run (a frame-timed flake twice); `curves` scene 3, `settings-probe` (2 of 6 reached) and
  the boot chunk (21/23: B60, B65) identical on the base (the rig). The integrator's gates on the merge: pwa, doubles 0, 17 files parse, node 0, the classes
  table unchanged. **You see nothing.**
