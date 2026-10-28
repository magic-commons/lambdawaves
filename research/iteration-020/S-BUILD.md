# 020 S — THE STAGE AND THE WINDOWS (Opus builder, 2026-10-27; branch `it020-S` from d9210a2)

All five rows are lab-only. Kit unchanged (1.5.0-alpha.33). THE LOCK unchanged (no leaf moved). Probe: `tools/stage-probe.mjs`
(`info | rack | queue [N steps scale] | sticks | camera | range | seat`), a diagnostic, not a gate. Numbers: headless Firefox, gate 9677, 1500 × 1000.

## S1 ONE PRESS, ONE PLACE — 0368a28
- The real cause was not ten springs: the kit's `createPrefs` already notifies ONCE for `IP.set({...})`. On the ON press `applyInfo` ran STAGE
  FORMULA first, so the stale block (hidden since OFF) exited while a stale string entered, then NAME re-wrote the string and KaTeX's 250 ms
  gate swapped the block AGAIN. Now (`lab/shell/stage-words.js`): OFF is applied first and lets the block go inside the hidden root; ON is applied
  last, after the string is final — one entrance.
- The ◧ fight: TWO handlers peeked the bar — rack-wiring.js (015 H3) and a forgotten wave-108 copy in `lab/shell/notebook.js` (hard-coded rect,
  no "inside" memory). The copy is gone; rack-wiring's peek is ARMED only once the pointer has left the bar's reach (120 px) since the hide.
  `transport-peek` left the words' `rackKey`.
- Measured (`info`, H2O with NAME · STATUS · BALL AND STICK · BEAD on, press OFF then ON, 2.5 s each):
  before ON: 2 renders · 2 entrances · 6 rest changes · 4 reversals of the block's motion · 8 word animations;
  after  ON: 1 render · 1 entrance · 1 rest change (its own landing) · 0 reversals · 3 word animations (the entrance's lines). OFF: nothing moves.
- Measured (`rack`, a real pointer press on ◧ then 30 jitters on the spot): before the bar came straight back (`transport-peek` set, 1 flip);
  after it stays hidden (0 flips); leaving and returning peeks it, the press shows the racks.

## S2 MAP ONLY, NOW — 4c02b95
- MEASURED FIRST (H2O, ESP, playing): Firefox is never `paced`, and its queue did NOT run deep here — a fresh `onSubmittedWorkDone` waits
  4–64 ms (its ~50 ms poll), `inFlight` ≤ 1. MAP ONLY → its frame done:
  | load | fps before | fps after | MAP ONLY → done, before | after |
  |---|---|---|---|---|
  | 64³ · 160 steps · scale 1 (1500 px) | 30.1 | 30.3 | 73–129 ms | 73–85 ms |
  | 128³ · 1600 steps · scale 2 (3000 px) | 22.4 | 20.0 | 114–150 ms | 148–151 ms |
  So the "seconds-deep queue" (MAP.md's inference) did not reproduce headless; Josh's headed Firefox with the night run on the card may differ.
- The cap anyway (call 2): `field.js` now counts frames in flight on every engine; `field.inFlightCap` = 4 where completion is prompt (as
  before), and in Firefox 2 ONLY while the last landed frame waited > HEAVY_MS = **250 ms** (a backlog its poll cannot explain), else none.
  At 64³ it never binds (`LW.stats.skipped` 0 in both loads above), so it costs no frame. The 1 × 1 readback fence was not built: `mapAsync`
  answers on the same poll, so it measures nothing `onSubmittedWorkDone` does not.
- The likelier "sticks": INFORMATIONAL › BALL AND STICK's 2-D canvas ignored MAP ONLY (and a yielding `may('skeleton')` could keep its bitmap).
  `rack.js` now drops `skOn` under ESP + MAP ONLY: `sticks` probe, inked pixels 5612 → 0 → 5612 (on, MAP ONLY, off).
- THE LOCK: `digest-lock.mjs --check --query gastab=0` GREEN, 843 values, 0 differences.

## S3 CAMERA IN TWO ROWS — e8f842a
`material.js`: LOCK · FLIP · AUTO-ROTATE go to a new `.cam-row.cam-verbs.cam-switches` after the kit's row (PAN HOME · HOME stay);
`skin.css`: each row shares its width (buttons `flex: 1 1 0`, switches centred). At rack width: PAN HOME 123 · HOME 123 px; LOCK 69 · FLIP 64 ·
AUTO-ROTATE 107 px, none clipped. Picture: `S-shots/S3-camera-two-rows.jpg`.

## S4 ESP RANGE TO 50 — 8fc391b
`material.js`: RANGE 0.002 … 50 (already log), default 0.1 untouched; `auN` prints 3 decimals under 1, 2 under 10, 1 above — the knob and the bar:
0.1 → ±0.100 (bar +0.100 +0.018 0 …), 2.5 → ±2.50 (+0.448), 50 → ±50.0 (+8.96). `new-project.mjs --check` in step.

## S5 THE STAGE NEVER FOLLOWS THE FURNITURE — 6573a7c
`stage-words.js` `bars()` reads each rack's and the bar's RESTING box: the rect less the hide's translate (a rack's translateX; the stage bar's
140 px drop; a FREE bar keeps its own), visibility ignored; `rack-hidden` / `rack-peek` left `rackKey` (now `rack-l · ui-hidden · phone`). The ESP
bar reads the same `free()`. A rack with no open window still frees its side (`racks()` unchanged). `seat` probe (words [x, y, w, h] · ESP bar):
- before: shown 715,14 · 1122,221 → hidden 715,14 · **1422,297** → peek right **564**,14 · 1122,297 → back 716,14 · 1122,221
- after:  shown, hidden, peek right, back — all 715,14 · 1122,221. Picture: `S-shots/S5-rack-shown-vs-hidden.jpg`.

## Tests
After each lab edit `node tests/pwa.test.mjs --write` and `./test.sh node` (0 RED). Browser (LW_PORT 9677, GD_PORT 5677): hide-reveal GREEN (S1, S5),
stage-text GREEN (S1, S5), routed-knob GREEN 7/7 (S2, S5), camera-shift GREEN (S3), THE LOCK GREEN (S2). `rack-deps --classes --no-write` HOLDS
(spectrum 25/25). No test re-aimed, no new test file.

## For CLAUDE.md (the close)
- THE STAGE NEVER FOLLOWS THE FURNITURE (020 S5): the stage text and the ESP bar seat themselves on the racks' and the bar's RESTING boxes
  (`stage-words.js` `resting`), so ◧/B, a peek or the bar's drop moves nothing on the stage; only `rack-l · ui-hidden · phone` and the transport's
  own class re-place the words. A rack with no open window frees its side.
- ONE PRESS, ONE PLACE (020 S1): `applyInfo` applies STAGE FORMULA OFF first and ON last; OFF drops the block in the hidden root, so ON is one
  entrance. The bar's peek lives only in `rack-wiring.js` and is armed once the pointer has left the bar since the hide.
- (020 S2) MAP ONLY also hides BALL AND STICK; Firefox holds at two frames in flight only behind a > 250 ms backlog (`field.inFlightCap`).
- CAMERA's verbs are two rows (020 S3); ESP RANGE 0.002 … 50 (020 S4; the 016 line "ESP RANGE 0.002 … 5" changes).

## Open questions for Josh
1. MAP ONLY's "second or two": headless Firefox shows ≤ 150 ms even at 128³/3000 px. If it still lags, was BALL AND STICK on (now fixed), or does
   it happen while the night run renders? A headed run of `tools/stage-probe.mjs queue` on your session would tell (it prints the backlog).
2. A project file with `espRange` above 50 opens as stored (the knob shows ±80.0); it was the same above 5 before. Clamp on restore?
3. H (the whole interface out) still re-centres the words; the law above covers hide/peek only. Say if H should hold them too.
