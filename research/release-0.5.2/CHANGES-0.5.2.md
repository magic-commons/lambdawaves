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
