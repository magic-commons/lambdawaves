# PAL-BUILD · B-PAL's row M12 PALETTE, SHORTER (0.5.3 "Rack Tune", W3)

Builder: Claude Sonnet 5.5 @ high as B-PAL, 2026-10-10, worktree `.claude/worktrees/agent-a4c2781537aefee06`, branch `worktree-agent-a4c2781537aefee06`,
reset to `43df83c` (the integrator's `sos-s0` tip) first. Brief: `BRIEF-PAL.md`. ONE commit, NO push. The tip sha is in the hand-back.
Files: `lab/windows/material.js`, `lab/lab.css`, `lab/skin.css`, `lab/sw.js` (regenerated), `tests/legacy/boot.browser-test.mjs`,
`research/release-0.5.3/MIR-BRIEF-palette.md`, `eye/pal-before.png`, `eye/pal-after.png`. No file under `lab/mir/**` or `lab/fonts/**` was touched.

## §1 · Each re-seat, with file:line (after the edit)
All of it is `lab/windows/material.js`, under `createRampPanel`. The kit builds its rows; λWAVES moves nodes from outside, as the MIR briefs say.
- **INVERT** `:108-109`. `sw({ label: 'INVERT', glyph: 'invertColors', cls: 'pal-invert', … })` is appended to `.mir-ramp-verbs`, so it sits right of ROTATE.
  The kit draws the half disk (`mir/glyph.js:318`; `kit.js:422-425` makes a glyph switch with no lamp, no word). The `rInv` row and its
  old word switch are gone (−3 lines). `ui.invertSw` keeps its name, so `facade.js:198` and `settings.js:116` need no change. The disk turns over when ON
  (`lab.css:480-481`, the same 180° turn as `mir/panels/grade.css:30-31`).
- **RESET** `:107`. `rowOn.appendChild(rv.root.querySelector('.mir-ramp-reset'))`. `rowOn` is the old `palette-enable` row (`:96`, now a named const), so
  RESET sits beside PALETTE ON. The preset stepper (`.mir-ramp-step`) is untouched, and Josh's reference look stays.
- **Ticks** `:100` `ticks: []` (the −π…π text went), and `lab.css:476` `.mir-ramp-ticks:empty { display: none }` collapses the empty row.
- **ARG ψ field** hidden by `lab.css:476` (`.mir-ramp-at { display: none }`), scoped to the palette window. It stays in the DOM (the kit repaints it
  and `labels.at` is kept), so its place is the reader's source.
- **The reader under ROTATE** `:106-107,110` (§2). Its CSS: `lab.css:477-479`.

## §2 · One function, two seats
`ang(u)` (`material.js:97`) is the only function that prints an angle: `((2u − 1)π).toFixed(3) + ' rad'`. It is the ramp's `labels.fmt` (the stops' aria-valuetext)
and the source of both seats. `showArg()` (`:110`) reads the selected stop (`rv.stops()[rv.selected()]`) and writes it twice:
1. a kit `readout` appended inside the ROTATE knob (`:106-107`). CSS hides the knob's own "turn" (`.k > .k-val`, one rule) and the readout's label and sub,
   and drops its box, so it reads as a line of text under the dial (`lab.css:477-479`).
2. a small `<i class="pal-float">` in the strip (`:106`), positioned from its own `--at` (`lab.css:482`), clamped 36 px from either end, aria-hidden.
Both carry a `title` with degrees (`(2u − 1)·180`, one decimal), shown on hover: the reader's always; the float's too (it takes pointer events).

**Deviation from the brief, on purpose.** The brief said "driven by the `ramp.set` callback". `ramp.set` fires only when a stop moves or a preset loads. It does NOT fire
when the hand selects a different stop (`select` → `paintSel`), nor when the app pulls a ramp (an undo, a project open: `pull` → `loadStops`). So the readouts would
go stale. The kit repaints the hidden ARG ψ field on every one of those paths (`paintSel`, `paintNow`), so `showArg` runs from one `MutationObserver` on that field (`:111`).
That is one observer line, and the readers are right after a select, a drag, a preset, an undo and a project open. It is filed as MIR brief 3 (`labels.rotate`).
**Reduced detail, LEAN:** `lab.css:398`'s `.dev.lean .dev-body .ro { display: none }` would hide the reader (it did, in my first screenshot); `lab.css:478` overrides it for this one reader.

## §3 · The dead rules, with grep proof
Removed: `skin.css` `.pal-ring` from the list at `:20`; `skin.css:325` `.native-clean[data-id="palette"] .pal-nav`; `skin.css:380-381` `.palette-presets` and `.palette-presets .sel`;
`lab.css:475-477` `.pal-wrap`, `.pal-strip`, `.pal-ring`. After the edit,
`git grep -n -E "pal-wrap|pal-strip|pal-ring|palette-presets" -- lab tests tools` returns one line: a COMMENT in `tests/legacy/boot.browser-test.mjs:338` that names `.pal-strip` as the old canvas.
No JS, HTML or test builds a node with any of those classes (the old `paletteview.js` left in 0.5.0 C1).
**Kept, as the brief says:** `lab.css:483` `.pal-color` (live: `settings-card.js:96`, the stage-colour well; also `skin.css:23`).
**`.pal-nav` itself is LIVE** (`chemview.js:85`, the MOLECULES section arrows; `lab.css:469-474`), so only the palette-scoped copy at `skin.css:325` was dead.
**Left for the integrator, not in the five:** `skin.css:326` `.native-clean[data-id="palette"] .palette-action` (no user anywhere in `lab/` or `tests/`) and the scoped
`.native-clean[data-id="palette"] .pal-nav` inside the `(pointer: coarse)` list at `skin.css:369`. Both are dead the same way.

## §4 · The MIR briefs filed
`research/release-0.5.3/MIR-BRIEF-palette.md`: (1) a `verbs` extras slot; (2) a reset seat option; (3) `labels.rotate(rad)` for the knob's "turn"; (4) `labels.float`;
(5) `stepper({ pager: true })` via `ramp.js:122`; plus the empty `ticks` row. Filed, not built.

## §5 · The PNG pair
`eye/pal-before.png` (290 × 473) and `eye/pal-after.png` (290 × 408): the PALETTE window at 1500 × 1000, headless Firefox, light theme, TWILIGHT with the second stop selected.
Both halves come from `.tmp/pal-eye.mjs` and `.tmp/crop.py` (same scene). "Before" is HEAD's three files served; "after" is this commit. The window is 65 px shorter (INVERT's
row and the ticks row are gone; the ARG ψ field no longer pads the swatch row); the half-disk INVERT sits right of ROTATE; "−1.571 rad" is under ROTATE and floats on the strip over the
selected stop. RESET sits beside PALETTE, and the preset stepper is now the full row width, with no other change to its look.

## §6 · Lines
`cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l`: 27,969 → **27,976 (+7)**, against a budget of +15 and a stop at +23. CSS, tests and `tools/` are not counted
(`lab.css` +5 net, `skin.css` −4 lines).

## §7 · Closers
| closer | result |
|---|---|
| `tests/menubar.browser-test.mjs` (:166 INVERT row) | GREEN |
| `tests/history.browser-test.mjs` (:169-170, selectors kept) | 44 PASS, exit 0 |
| `tests/official-defaults-palette.browser-test.mjs` | 3 PASS, exit 0 |
| `tests/legacy/boot.browser-test.mjs` (no `@spec` filter exists, so the whole suite ran once) | 150 GREEN, 2 RED: B67 (fling) and B149 (motion: `tab.after` 4 ≠ 0). **Both are red on HEAD `43df83c` too** (the same suite on HEAD's files: B67, B149 and B69 red). My two re-aimed rows are GREEN: **B77** (:2738) and **B100** (:4162-4165). |
| `node tools/settings-probe.mjs --out` | 0 of 6 scenes red |
| `LW_PORT=8993 node tools/stage-dead-probe.mjs` | 10/10 OK |
| `bash test.sh node` | exit 0 |

**What I could not measure.** (a) MIR's `stylehash` before/after: it launches its own Chromium and could not bring the field up on this shared GPU ("no WebGPU adapter" or "device lost"
after other builders' browsers); three attempts, so the 8-state neutrality hash was not captured. The look change is confined to the palette window by selectors scoped to `[data-id="palette"]`
(and `.pal-float`, which exists only there), and the stage probe and the suites above are green. (b) The boot suite's B67, B149 and B69 are flaky or already red on HEAD under the shared rig,
so I can say only that my edit did not change them. (c) A phone-width look of the window (the float's 36 px clamp at 260 px of strip is a guess) and a touch hover for degrees.
