# B3a PERIOD · FLASH · ROUTES — build record (2026-10-15, branch `b3a-period-flash-routes` from `8dc9a68`)

## What landed (one commit per feature, plus one fix)
1. **THE PERIOD GUARD** (`f9ad9b2`) — `lab/period.js:52`: `exactFromDifferences` returns null when max v/g ≥ 2⁵³, before the verification loop.
2. **THE PERIOD READOUT** (`3fbb1b3`) — `lab/shell/transport.js` `periodText` (:134–141). A field-free hydrogen register (H = hydrogen, Bz = 0,
   no Sturmian, every populated rate 1; Stark and transition return earlier) whose closed form `hydrogenShellPeriod(shells, getZ())` matches the fit
   to 1e-9 shows "exactly · T = 14400π/g′ a.u. · <physical>" plus the lap and %. It shows "14400π" when g′ = 1 and adds "/Z²" when Z ≠ 1.
   With custom per-label rates and no exact period, it shows "no exact period under these per-label rates · nearest recurrence …".
3. **THE FLASH LAW** (`3b842e2`) — `lab/flash-law.js` (new, 12 lines, pure): `aliasOf(energies, rate, fps)` → `{ hz, alias, pair }` for the
   pair whose alias is largest, and `FLASH_HZ = 3`. Its seat is `transport.js` `flashSub()` (:155–162), which is cached on (reg.version, clock.rate) and
   painted at the readout's cadence (≤ 5 Hz while playing), never per frame. When the law fires, the RATE knob gets the class `flash` and a title
   (control-help turns it into the knob's tooltip), and the REPEATS sub gains " · beats alias at X Hz on screen". fps = `stats.fps` rounded when ≥ 10,
   else 60. The law never writes RATE: `sim-ladder` keeps 60 and carries the label (4.5 Hz).
4. **SIX SHELL RATE ROUTES** (`62fce7c`, fixed in `6a33a92`) — `lab/shell/modulation.js:109–113`: `shell.rate.n1…n6` ('SHELL n RATE', ×, log
   0.25–4, def 1, group state, `knob: () => null`). get = the rate of the shell's first populated label, or of its first label when none is populated.
   set = `api.setRate(a, v)` for every label of shell n whose rate differs, which is the lanes' own road. The root `'shell'` is added to the roots
   λWAVES passes (:154). Seat: `persist.js:21–22` `shellSeat` plus the `modSeats` row at :33. One accessor writes the whole shell, and only a shell
   that already shares one rate, so a project save (which seats every route) never flattens a hand's per-label rates.
   These are not luminance routes, and FLASH_STEP is untouched.

## Deviations from the brief (each forced)
- The ids are `shell.rate.n<k>`, not `shell.rate.<k>`. The kit's registry (`lab/mir/modulation/registry.js` SEG) rejects a segment that starts
  with a digit, and the first boot with `.1` threw in `register`. `shell` also had to join the roots list.
- When no label of the shell is populated, get falls back to the shell's first label's rate, not 1. This keeps the seat's no-op exact.
- The knob's title is a tooltip, not a `title` attribute: `mir/control-help.js` moves every `[title]` into `data-help`.
- No CSS was added. `.flash` has no rule, so the tooltip is the only visible sign on the knob.

## Lines (`cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l`)
28,101 → 28,136 (+35: flash-law 12 · transport 15 · modulation 6 · persist 3 · period 1, net of the edits). Over the +30 budget and under the +45 stop. The overage is the seat (+3).

## Commands and results
- `node tests/period.test.mjs` → GREEN 0 failing of 11 (after feature 1).
- `node tests/pwa.test.mjs --write` after every lab edit → exit 0 (precache includes `flash-law.js`).
- `bash test.sh node` → exit 0, twice (after feature 4, and again after the id fix). history 18/18, period 11/11. Server on 9211 (pid 386663), stopped by pid.
- First CDP boot probe: BOOT threw in `registry.register` (the `.1` id). Fixed in `6a33a92`. After the fix: `__e` = [], ready.
- CDP check (scripts in /tmp/b3a, not in the repo):
  - The registry lists `shell.rate.n1…n6`.
  - `?preset=1s%2B2pz` reads "exactly · T = 14400π/2700 a.u. · 0.405 fs · lap 0 · 0%".
  - Playing at RATE 300 adds " · beats alias at 17.9 Hz on screen" and `.k.flash`. At RATE 3000, 179 Hz aliases to 0.95 Hz at 60 fps, so no label (the law, not a miss).
  - `setBase('shell.rate.n2', 1.37)` sets rates [1, 1.37×4, 1]; setting it back to 1 restores them.
  - `?preset=sim-ladder` reads "exactly · T = 14400π/25 a.u. · … · beats alias at 4.5 Hz on screen", and the knob tooltip says so.
  - shell 2 at √2 reads "≈ 777.4 a.u. · no exact period under these per-label rates · nearest recurrence · error 0.7% of a beat".
- `LW_PORT=9211 GD_PORT=5311 node tests/current.browser-test.mjs` → RED at :138 `longMeters` (9 PASS before it), twice, the second run alone.
  This is the known pre-existing red: `research/release-0.5.4/P-V-REPORT.md` N1 records the base RED at :138 `longMeters`, the audio card's track width.
  The suite's later blocks did not run.

## Not done
- No new tests, probes or fixtures (Josh's dial). `flash-routes.test` was not extended, because the new routes are not guarded routes.
- No CSS for `.flash`. No label on the shell routes' own dials, because they have none (`knob: () => null`).
- The alias is recomputed on RATE or register change at the readout's paint. When paused and no frame runs, a RATE change shows on the next paint.
