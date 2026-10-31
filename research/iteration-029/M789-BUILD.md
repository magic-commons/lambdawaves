# 029 M7 · M8 · M9 — THE PERFORMANCE CONTROL · BUILD (Opus, 2026-10-31)

Tree: yan-c `f25aef54` (M6 merged), then three commits on this branch, one per row. No stored key, window id, target id or CSS hook
moved. The `app` literal is not extended: the tier rides the controller's own `perf` object (`perf.tier`), and the seg's road is
`ui.setTier`, beside `ui.showPlayback` and `ui.showDither`. `lab/mir/**` and `lab/fonts/**` are untouched. `lab/sw.js` was
rewritten only by `pwa.test --write`.

## THE ROWS

| row | commit | the change | files |
|---|---|---|---|
| **M7 · PERFORMANCE · BALANCED** | `c8e60722` | SETTINGS › FIELD QUALITY, the AUTO SCALE · GOVERNOR row: the old seg "PERFORMANCE FULL \| 120 Hz" is now labelled **READERS** (key `perfMode`, ids `full`/`120` and the saved values unchanged). The new seg **PERFORMANCE · QUALITY \| BALANCED \| LIGHT** writes the PREFERENCE key `perfTier` in `lambdawaves.q0.settings` through `saveSettings`; `applySettings` reads it (absent = QUALITY). It never writes `mir.gui`, so FROST stays FROST, not CUSTOM. Under BALANCED or LIGHT, `look.js` holds the frost while the picture moves: the kit's frost row's `run` (`body.frost-hold` when `v === 'still' && c.moving`) is overridden in `createLook`'s schema map to `(v === 'still' \|\| c.hold) && c.moving`, and `look.hold(b)` sets `ctx.hold`. The moving signal is the loop's existing `look.moving(clock.playing)`; under a tier it also counts a running modulation (`modHost.clock.isRunning()`). There is no new blur machinery. METERS: the GOVERNOR readout starts with the tier's word (`BALANCED · …`, `LIGHT · …`) when it is not QUALITY. | `lab/windows/settings-card.js`, `lab/shell/settings.js`, `lab/shell/controller.js` (`perf.tier`), `lab/look.js`, `lab/rack.js` (the moving line, `paintGovernor`), `lab/windows/readouts.js` (the note says READERS); `tests/field-law.browser-test.mjs` (presses READERS FULL), `tests/new-project.test.mjs` (`perfTier` joins the PREFERENCE list a project must never carry), `docs/STATE-SCOPES.md` (the hand-written row); `tools/perf/mod-profile.mjs` (levers `balanced` and `light` press the seg) |
| **M8 · PERFORMANCE · LIGHT** | `6df1f38b` | BALANCED plus: the loop's one `field.resize` takes `Math.min(scale, 0.5)` under LIGHT while the clock plays. On the pause edge (W125-2, the governor's own block) LIGHT schedules one present, so the still picture repaints at full size. No state was added beyond the tier. Films and pictures resize the canvas themselves and run with the loop stopped (`exportLocked`: the loop returns on its first line), so they never take the ceiling. | `lab/rack.js` (two lines) |
| **M9 · the FIELD CLOCK cap's words** | `922157bf` | The seg's title is now "Caps how often ψ is reconstructed; every frame presents" (55 characters). The FIELD QUALITY note now says: "FIELD CLOCK cap limits how often ψ is reconstructed from the register; the picture still presents every frame, so it saves CPU time, not GPU time." The PERFORMANCE / READERS sentences are in the same note. Words only. | `lab/windows/settings-card.js` |

The hints added: QUALITY "The glass as the look says, always" · BALANCED "Hold the frost while the picture moves" · LIGHT "Hold the
frost; half-size canvas while playing" · the cap's title. All are 60 characters or fewer (`hints-census --check`: over 60, 0).

## THE PROBE (headed Chromium 156 on Josh's screen, RTX 3070 on Vulkan, 119.93 Hz, canvas 1865 × 868; scene c = WAVE DANCER + modulation armed + window open + AUDIO live on STAR's drop; 20 s each; the tier pressed on SETTINGS' own seg)

Two windows appeared, one at a time, each closed by pid: a sweep of 5 runs (about 6 min) and a pair (about 2 min). M6's STILL row
is the target: p95 ≈ 9.7 ms, dropped ≈ 47 per 20 s, GPU main ≈ 4.33 ms per frame.

`nice -n 10 node tools/perf/mod-profile.mjs --chromium c --lever default,balanced,light,balanced,default --secs 20 --audio $STAR`
(this sweep contains `default,balanced,default` and `balanced,light`), then `… --lever balanced,light` with the play-time read
(`envPlay`, added to the tool for this row: the canvas and `frost-hold` 1.5 s into the play, before the trace).

| run | fps | present p50 / p95 / p99 ms | > 17.5 ms | dropped / 20 s | GPU main s (ms per frame) | Viz s | canvas while playing · paused | frost-hold while playing |
|---|---|---|---|---|---|---|---|---|
| default (QUALITY), bracket first | 104.3 | 8.9 / **14.5** / 18.8 | 41 | **290** | 18.6 (**8.67**) | 7.6 | — · 1865 × 868 | — |
| **BALANCED** | 116.9 | 8.3 / **9.7** / 10.4 | 12 | **60** | 11.1 (**4.72**) | 2.3 | — · 1865 × 868 | — |
| LIGHT | 116.8 | 8.3 / 9.6 / 10.7 | 9 | 71 | 11.2 (4.77) | 2.2 | — · 1865 × 868 | — |
| **BALANCED** (repeat) | 116.6 | 8.3 / **9.6** / 10.6 | 9 | **37** | 10.3 (**4.31**) | 2.3 | — · 1865 × 868 | — |
| default (QUALITY), bracket last | 106.3 | 8.9 / **13.9** / 17.7 | 28 | **259** | 18.6 (**8.65**) | 7.5 | — · 1865 × 868 | — |
| BALANCED (pair) | 116.4 | 8.3 / 9.7 / 10.6 | 8 | 80 | 9.6 (4.05) | 2.0 | **1865 × 868** · 1865 × 868 | **yes** |
| LIGHT (pair) | 117.3 | 8.3 / 9.6 / 10.6 | 9 | 59 | 10.7 (4.53) | 2.3 | **933 × 434** · 1865 × 868 | **yes** |

**BALANCED lands on M6's STILL row.** Mean of three runs: p95 9.7 ms (14.2 at QUALITY), dropped 59 per 20 s (275), GPU main 4.36 ms
per frame (8.66). STILL ×3 in M6 was 9.7 / 47 / 4.33. The dropped count spreads 37–80 across the three runs, where M6's STILL spread
44–50. The look is untouched in every run: the store still reads `card refractive · frost always · blur 22`, `body.frost` is set,
the SETTINGS blob holds `perfTier`, and the glass returns at rest (`frost-hold` is false once paused).
The brackets: dropped 290 → 259 (11 %, reported), p95 14.5 → 13.9, GPU main 8.67 → 8.65 ms (0.2 %).

**LIGHT halves the canvas while playing** (933 × 434 against 1865 × 868) **and gives it back on the pause edge** (1865 × 868 paused).
**On the RTX it buys nothing measurable beyond BALANCED**: GPU main 4.77 / 4.53 against 4.72 / 4.05 / 4.31, dropped 71 / 59 against
60 / 80 / 37. Once the glass holds, the field's march is not what the GPU main thread waits on here. M6's −1.5 ms for scale 0.5 was
measured with the blur on. LIGHT is for the weak GPU:

**The software floor** (SwiftShader under Dawn, headless, 1920 × 937, 60 s, ratios only; `--swiftshader --lever <one> --secs 60`,
one headless browser per lever: a two-lever sweep timed out at CDP `Page.navigate` (180 s) on the second page, so LIGHT ran alone):

| lever | present p50 / p95 s | presents in 60 s | GPU main busy / wall s | canvas |
|---|---|---|---|---|
| default (QUALITY) | **15.18** / 15.76 | 4 intervals | not kept (the sweep's error lost the JSON; console line only) | 1920 × 937 |
| **LIGHT** | **3.92** / 4.86 | 15 | 57.8 / 63.3 | 960 × 469 while playing |

**LIGHT presents 3.9× faster on the software GPU** (15.18 → 3.92 s), matching M6's scale-0.5 lever (4.14 s). On SwiftShader the
first half-size frame lands only after the play's first full-size frame, so the play-time read 1.5 s in still saw 1920 × 937. The
paused read right after the pause saw 960 × 469: the edge's full-size present was queued behind a four-second frame. THE LOCK below
(headless Firefox, a real GPU) reads the full canvas after a LIGHT play and pause.

## THE LOCK (own gate server on 9811, GD 5811, stopped by pid)

| run | values · differences |
|---|---|
| `digest-lock --check --query gastab=0` (QUALITY, the default) | **843 · 0** (0 record-byte differences, page errors 0) |
| `… --fixture tests/fixtures/digest-lock-s4a.json` | **987 · 0** |
| `… --query gastab=0` with **`perfTier` = light** set through the seg (the blob reads `light`), then a 1.5 s play and a pause before the capture | **843 · 0**, paused canvas 1600 × 914 (full), `frost-hold` false |

The LIGHT run used a temporary copy of `digest-lock.mjs` that pressed the seg, played and paused before the helpers. It is not
committed. The canvas is untouched at every tier when still.

## THE GATES AND THE SUITES

- `node tests/pwa.test.mjs --write && ./test.sh node`: green (0 FAIL; `hints-census --check`, `state-scopes --check` inside;
  `state-scopes` regenerates nothing new: the blob is one RECORDS row, and the new key is named in STATE-SCOPES' hand-written table).
- `node tools/settings-probe.mjs`: **GREEN, 0 of 3 scenes red**: boot 834 B, WAVE DANCER 861 B and NEW 852 B, each byte-identical
  across the reload; the opens wrote only WORKSPACE and PROJECT keys. The first run went red once on NEW: "Render did not settle:
  animation frames stopped" (frame-settle.js), which the open threw before any blob comparison. The re-run, alone, was green.
- `node tools/new-project.mjs --check`: in step (16098 B). `node tools/rack-deps.mjs --classes --no-write`: **HOLDS** (persist at 24,
  limit 25; 0 bare writes across scopes). dependency-cruiser: **0** app-side circular edges. `node tests/mir-manifest.test.mjs`: PASS
  (266 adopted files match).
- Browser, one at a time on 9811: all **GREEN / PASS, 0 FAIL**: `official-defaults-palette` (5 s:
  first-run defaults, the look untouched), `hide-reveal` (24 s), `window-switching` (15 s), `frame-occlusion` (6 s, the glass and its
  mask), `film-handover` (87 s: films never resized by LIGHT; the node `render-exact` rows ran green inside `./test.sh node`), `start`
  (3 of 3 scenes), `history` (141 s, the blob's keys), `field-law` (READERS FULL pressed by its new label; hydrogen RMS 2.34e-6 ·
  GREEN), `keyboard-window` (the seg's hints).

## FOR-MIR (pasted into docs/FOR-MIR.md § 029, lines, no door)

- the frost row's hold on a context flag (`c.hold`), so any app can hold the glass on its own motion signal without writing FROST ·
  STILL into the store; λWAVES measured −4.3 ms/frame of GPU main thread at 120 Hz (029 M6). λWAVES does it app-side today.
- for 1.6: QUALITY BALANCED as "hold while moving" would keep a theme's glass at rest for the same cost as lite (4.22 vs 4.33 ms
  measured). It changes an existing enum's meaning, so it is a line, never a door.

## JOSH'S CALL: BALANCED AS THE SHIPPED DEFAULT (not made here)

One word in `lab/shell/settings.js` `applySettings`:

    if (ui.setTier) ui.setTier(s.perfTier || 'quality');   →   if (ui.setTier) ui.setTier(s.perfTier || 'balanced');

and the seg's first paint in `lab/windows/settings-card.js` (`value: 'quality'` → `'balanced'`, cosmetic: `setTier` repaints it at
boot anyway). Because `saveSettings` writes `perfTier` on every save, a browser that has saved since this build keeps its own value.
Only a first run, or a blob older than this build, takes the new default. It moves the interface's pixels while playing, never the
stage's (THE LOCK reads the same). Then `new-project --check` and `official-defaults-palette` again.

## WHAT WAS LEFT

- The probe ran on scene c only. Scene b and a weaker real GPU (an iGPU, the iPad) are not on this machine (M6 § 5).
- LIGHT's RTX gain is not measurable beyond BALANCED (above). The seg says what LIGHT does and does not promise a number.
- "Stage only while playing", a tail-reading governor and a wall-time 60 Hz grid: not built (M6 § 4's list).
- `play-lock-probe` was not run: under PLAYBACK LOCK the governor's scale is held as before, and LIGHT's ceiling applies to the
  live play only (a locked live play under LIGHT runs at half; a film never does).
- The raw probe summaries are in `.tmp/it029/m789-sweep.json`, `m789-sweep2.json`, the SwiftShader default's console line (its JSON was lost to the timeout) and
  `m789-sws-light.json` (not committed).
