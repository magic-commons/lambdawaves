# BRIEF D10-19 · THE FLASH GUARD, the limiter half (0.5.1 "Informational Update"; Sonnet builder)

**Read first, whole:** `research/release-0.5.1/PLAN.md` (§0, §1, the D10-19 row, §5 U8, §8), `research/release-0.5.1/AUDIT-OPUS.md` E10 and §4 U8,
`lab/mir/shell/flash-guard.js` (whole — THE LIMITER `createFlashGuard({ maxHz, delta, window, release, ranges, now, onTrip, onRelease }) → guard(value,
route, t?)`, `guard.state(route)`, `guard.lastTrip`, `guard.reset`, `guard.enabled`; it counts swings of `delta × span` in the PARAMETER's units,
span from `ranges[route]`), `lab/mod-port.js` (whole; `install(defs, roots)` at :85–99 is the seam: every routed def's `set` passes there),
`lab/rack.js:2140–2170` (the `material.*` routes: `stage` linear 0–1, `gamma` linear 0.5–2.4, `exposure` LOG 0.08–12, `knee` LOG 0.02–8, `hue` WRAP
0–1, `softness`, `iso`, `grain`), `lab/field.js` (the tone formulas: how `stage`, `gamma`, `exposure`, `knee` reach the pixel's luminance — grep each),
METERS' status line (grep `meters` / `status(` in `lab/rack.js` and `lab/meters*.js`), `tests/take-in-bugs.browser-test.mjs`, `tests/routed-knob.browser-test.mjs`,
and `CLAUDE.md` (the one-clock / mod-port paragraphs; THE PHOTOSENSITIVITY LAW is C6b's and stays as it is).

## The contract

1. **A WHITELIST, guarded in the map's own space.** In `createModPort`'s `install` (λWAVES' file), before `host.install(...)`, wrap the `set` of exactly
   these routes: `material.exposure`, `material.gamma`, `material.stage`, `material.knee`. For a LOG route the guard sees `ln(v)` and the held value
   is `exp(guarded)`; for a linear route the value itself. **`material.hue` is EXCLUDED** (a wrap seam reads as a 0.98 swing and would false-trip).
   **Every other route is untouched** — a fast LFO on `observer.yaw`, `reg.morph`, `chem.kick` or any non-luminance target is never held by this row.
2. **Calibration (U8), in node, before the wrapping is written:** for each whitelisted route compute the parameter step at the route's DEFAULT value that
   changes the picture's relative luminance by about 10 % — exposure: a multiplier on linear radiance, so log-space Δ = ln 1.1 ≈ 0.095; gamma: out =
   in^(1/γ) at mid-grey 0.5; stage and knee: from `field.js`' own formulas (read them; do not guess). Set `ranges[route] = [0, step / delta]` (so
   `delta × span` = that step) in the guard's space. Put the four numbers and their derivation in `D10-19-BUILD.md`.
3. **The hold is the kit's law:** a route trying more than 3 flashes/s is HELD to the safe rate (its swings still pass, three a second); a slow change
   is never touched. The knob follows the held value (the def's own `set` is what you wrap; `setKnob` inside it then shows the held value — confirm).
4. **The trip is said:** `guard.lastTrip` → METERS' status line (`"FLASH GUARD · EXPOSURE 10.0 Hz held to 3/s"` or the kit's own sentence), once per
   trip, cleared on release (`onTrip`/`onRelease`). No banner, no dialog, no new window. One line, where METERS already writes status.
5. **The row's text says it is PARTIAL** (in the BUILD, the hand-off and the CLAUDE.md draft): the limiter sees only these four parameters; a fast
   LFO on the register's morph, a kick or the camera can still flash a large area, and only THE FIELD JUDGE (a 64² luminance readback per frame; a
   frame-path row with the lock and the pair — 0.5.x) sees that.
6. **Where the code lives:** in `lab/mod-port.js` if its imports let node load it for the test; else a tiny pure module `lab/flash-routes.js`
   (`guardRoutes(defs, { ranges, now }) → defs`) that `mod-port.js` calls — ≈ 25 lines in all. Subtract, don't add; nothing in `lab/mir/**`; no new
   stored key (the guard is always on; `guard.enabled` is not exposed as a setting in this release).
7. **No frame-path change:** no readback, no per-frame work beyond ≤ 4 guard calls a frame on routed sets. THE LOCK is not needed; the pair is not
   needed (say both in the BUILD, with the reason).

## Acceptance
- **Node test** `tests/flash-routes.test.mjs` (or inside an existing routes test if one fits): with a fake clock, a 10 Hz square LFO of ±0.3 stop on
  `material.exposure` (1 → 2^0.3 → 2^−0.3 …, a set every 50 ms) is HELD to ≤ 3 output flashes/s (≤ 6 direction changes in any second); the same LFO at
  ±0.05 stop passes untouched; a 0.1 Hz ramp passes untouched; the same 10 Hz square on `observer.yaw` passes untouched (not wrapped); a hue LFO
  crossing the 1 → 0 seam never trips (not wrapped); the trip reaches the status hook once and clears on release.
- **Browser:** `take-in-bugs` 4/4, `routed-knob` 4/4, `mir-controls` 2/2, `offer` 16/16 (the modulation road is unchanged for everything else);
  `settings-probe` 0/6 (no new key); `bash test.sh node` exit 0; `node tests/pwa.test.mjs --write` after the lab edit.
- **Lines:** ≈ +25; say the real number.

## Commits (each followed by `D10-19-HANDOFF.md`)
1. `0.5.1 D10-19 · the calibration: the four luminance steps` (the node script's numbers in the BUILD; no lab change yet).
2. `0.5.1 D10-19 · the flash guard's limiter on the four luminance routes; hue excluded; the trip in METERS` (code + the node test + pwa).
3. `0.5.1 D10-19 · wave 2xx; D10-19-BUILD.md` (REPORT.md under the "0.5.1 · THE INFORMATIONAL UPDATE" heading — read the last wave number; the CLAUDE.md
   sentence DRAFTED in the BUILD for the integrator, not applied).

## Harness
Isolated worktree: `git reset --hard <the integrator's tip named in your launch message>` first. Ports: yours 8983/5453. `python3 tools/gate/server.py
<worktree> 8983` (run_in_background); `LW_PORT=8983 GD_PORT=5453`. ONE browser suite at a time on the rig: `node tools/perf/wait-gpu.mjs` and
`pgrep -a geckodriver` empty before each; never kill another's process; stop yours by pid; never `pkill -f`. The guard refuses compound shell lines
(plain commands or `bash .tmp/x.sh`). Never edit `lab/mir/**`, `lab/fonts/**`. Never merge, push, tag. `D10-19-BUILD.md`: the ledger, the four
calibrations, the tests' counts, the brief candidates (e.g. a guard space option for log/wrap maps in the kit), the merge notes, the drafted CLAUDE.md
sentence, "what Josh will see" (a routed EXPOSURE LFO past 3 Hz holds to three swings a second and METERS says so). Hand back by message + try
`~/.claude/handoffs/agents/<id>.md`.
