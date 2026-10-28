# 023 chain D — THE DOORS (Opus builder, worktree agent-a3a215644db910f0f, branch it023-D, BASE 10d0b6cf)

Kit MIR **1.5.6-alpha.9** on the clone road (kit-1.5.5 d5d8149 → 3ce9bc2, six kit commits; every door additive). Adopted, pinned, `--check` in step.

## D1 BEHIND IS DOTTED (kit e826ec2; λWAVES dcdd6952 = the pictures)
- `mir/panels/camera-rig.js:145–160` `depthOf(p)` (the drawing is seen from above, along −(1,1,1)) and `splitDepth(points)` → `{ front, back }` runs, cut at
  each depth sign change (the cut point shared).
- `mir/panels/camera.js:111–116` the three world rings split into `.cs-ring` / `.cs-ring.back`; `:136` the look line and tip take `.back` when the look
  points behind. `camera.css:54–56` `.back`: dashed (3 3 / 4 4), half the ink, same width.
- `mir/plane-model.js:33–38` (CLIP's plane view is the kit's planeModel, `lab/windows/material.js` → no app line): rings and the normal through one
  `lines()` — behind dashed [4 4] at half alpha. The plane's square and the outer circle stay solid.
- Pictures: `D-shots/D1-camera-behind.jpg` (yaw +180°, pitch −36°: far ring halves and the look dashed), `D1-clip-tilted.jpg`.

## D2 THE FACE TABS WEAR GLYPHS (kit 1f094a5; λWAVES 79959caf)
- `mir/keyboard/keyboard.js:136–138` a face is `{ name, body, icon }`; its rail chip draws `glyph: icon` with the name as label AND hint (else the
  name as text); KEYS wears the new kit glyph `keys` (`mir/glyph.js`, a board of caps; LLM.md's list and docs/ICONS.md row).
- `:118–121` MORE KEYS is the `more` glyph, THE BOARD the `keys` glyph; the word is its aria name and hint (`keyboard.css:62–63` hides the word).
- λWAVES: `lab/icons.js:85` `mapping` (a key cap and its route) and `lab/shell/keys.js:37` passes `icon: 'mapping'`. `D-shots/D2-keyboard-tabs.jpg`.

## D3 THE CHIPS' MOTION (kit e4d00e4; λWAVES 1eecb8d8 = the picture)
- The modulation window's chips are its own chip rail (`.crail-chip`, modwindow.js `buildChipRail`), which had no hover/press motion; TIMELINE's and
  KEYBOARD's rail chips are the kit's `.mir-chip`. `modwindow.css` (:732–745, after the `:active::before` rule): hover a lighter face and 6 % larger,
  press sinks (`--chip-sink`, `--chip-press-scale`, `.press` for a finger), release eases back on `--motion-micro` — the `.mir-chip` rule set's values.
- `window/window.css:37` the chip's values block names `.kwin-chiprail[data-mir-rail="modulation"]` too (and the light rim, :55) — no new token.
- `D-shots/D3-modulation-chips.jpg` (the second chip held). The window's inside buttons (ADD MACRO, the preset bar's `.tbtn`) are unchanged — see Q2.

## D4 ONE NOTCH IS ONE BPM (kit dfd71cb + 3ce9bc2; λWAVES aa50e323, re-adopt + re-pin)
- `mir/shell/transport.js:153–164` `wheelNotches(e, state, now)`: a line/page event or a pixel event ≥ 50 px is ONE notch (`Math.sign`); smaller
  pixels gather to `TRANSPORT.notchPx` 50, a part-notch forgotten after `notchIdle` 300 ms. `:359–366` the wheel lives in `bindTempoField`: 1 BPM a
  notch, Shift 0.1 — the BPM pill uses that field, so its old digit-under-pointer wheel (×10 on the tens) is gone; the drag keeps the digit law.
- **For chain B (the answer):** measured live (dispatched wheel events, 1 notch = deltaY −100, a trackpad 2 × −30): the CSB pill, the TIMELINE's
  own pill and the MODULATION window's own tempo field (`.modtempo`, `modulation/window.js:656` bindTempoField — it had NO wheel before) all step
  exactly 1 BPM a notch and 1 a 60-px trackpad stroke. **λWAVES has no tempo wheel of its own** (`lab/shell/transport.js`: the expander's BPM is a
  readout, no `wheel` listener anywhere in lab/ outside mir/ turns the tempo) → **B5 is not needed.**
- Tests re-aimed (never deleted): `tests/transport.browser.mjs` the wheel on the tens is +1 (31, 39.1), the keys row 38.1 → 49.0; `transport.node.mjs`
  four wheelNotches asserts.

## D5 THE CLOCK TILES ARE A CHOICE — no door (the answer for chain B)
- The `T = …` / `t = …` lines are **λWAVES' own**, not the kit's clock tiles: `ui.periodFx = formula({ lines: [['T = 2π / gcd{|ΔE|} …'], ['t = lap · T +
  ph · T']] })` at `lab/shell/transport.js:32–34`, seated under the expander's TRANSPORT section at `:114` (`sec.tr.root.append(ui.periodFx.root)`),
  painted by `paintPeriodFx` `:255–259`, styled `lab/csb.css:130` (`.csb-sec-tr > .fx`) and hidden while asking/echo at `:143`. The kit's tiles (TAP ·
  WALL · cadence · ÷2 ×2 ×4 · HOLD) are moved into the same strip at `:113` and are not the T/t lines. B2 removes the formula seat (and `paintPeriodFx`
  if nothing else reads it; `ui.periodRo` REPEATS stays). The `t  a.u. (lap)` readout `tro` (`:23`, `.ro.time`) is the other app "t"; it is not in the CSB.

## The kit commits (clone `.tmp/kit`, branch kit-1.5.5)
e826ec2 D1 · 1f094a5 D2 · e4d00e4 D3 · dfd71cb D4 · 3c24473 the bump (version sites 3/3: version.js, package.json, tokens.json; CHANGELOG 4 lines;
i18n re-extracted, 1498 strings) · 3ce9bc2 D4's wheel into bindTempoField (CHANGELOG line extended).

**Bundle: `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a3a215644db910f0f/.tmp/kit-1.5.6-alpha.9.bundle`** (kit-1.5.5 @ 3ce9bc2 + v1.5.5; `git bundle verify`: complete history).

## Tests
- Kit `npm test` (MIR_CDP_PORT 9770): token + intent lint, all 79 node files GREEN after `app.node` was re-aimed (LLM.md's glyph list gains `keys`); browser
  files run: audio … info-pages GREEN in the full run; then in the foreground keyboard, keys-table, transport (35/35), transport-placement, modwindow
  (32/32), modulation-stack, window (44), intent, timeline, timeline-smoke GREEN. `widgets.browser` 46/47 — the one red ("fader: disabled does not reset
  on a double-click") is RED at d5d8149 (alpha.8) too, not this chain; the plane-model checks in it pass. The full run was stopped at info-words by
  the integrator's call (no background work); the remaining browser files were not run.
- λWAVES: `tests/mir-manifest.test.mjs` pinned `'1.5.6-alpha.9': ee57f02e…` (D ADOPT pinned 4580a134…, re-pinned in D4); `adopt.mjs . --check` in step;
  `pwa.test --write`; `./test.sh node` exit 0; `rack-deps --classes --no-write` HOLDS (persist 24/25); `keyboard-window.browser-test` GREEN (LW 9781 / GD 5781).
- THE LOCK not run: no file under the stage or field moved (UI drawings and CSS only); no leaf expected to move.

## The CLAUDE.md sentence (for the close)
MIR 1.5.6-alpha.9: behind the view plane is dashed (CAMERA's sphere, CLIP's plane), KEYBOARD's faces wear glyphs (`{ name, body, icon }`; λWAVES' MAPPING
is `mapping`), the modulation rail moves as every chip, and the tempo wheel is 1 BPM a notch (Shift 0.1) on every tempo seat.

## Open questions for Josh
1. "Behind" is read as the isometric drawing seen from above (the far halves of the rings are the upper ones). If the sphere should read from below, it is one sign in `depthOf`.
2. D3 moved the modulation window's chip RAIL. If "chip buttons" also meant the buttons inside the window (ADD MACRO / ADD DEVICE, the preset bar's TAP · SYNC · HOLD), that is one more kit line (the trig's hover lift and press on `.mir-modwindow button`).
3. The plane's square and the camera's film frame stay solid. Should the half of the square behind the view plane be dashed too?
