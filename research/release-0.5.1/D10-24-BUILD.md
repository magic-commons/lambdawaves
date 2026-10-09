# D10-24 BUILD · CURVES, the kit's panel over the picture, screen only (0.5.1 "Informational Update"; Sonnet builder)

Worktree `agent-a41df2f5a03718877`, branch `worktree-agent-a41df2f5a03718877`, base `27eb96a` (yan-c, the 0.5.0-alpha cut), ports 8993 / 5463.
Commits: `5ef0fec` (the card, the PREFERENCE key, pwa, the suite) and the second (this file, REPORT.md, the report-tool line).

## What was built
A **CURVES** card on the right rack, **shipped closed**, listed in + and WINDOW. Inside it the kit's `createCurvesPanel({ parent, canvas: dom.canvas,
project: false })` with **no `history`, no `port`, no `mod`**: MASTER · R · G · B through the kit's one SVG picture filter on the stage canvas `#field`
(the "zero-engine road"). The card carries one line of its own, "Grades the screen only — pictures and films are untouched." The kit's AMOUNT knob is
in the panel but unrouted (no `mod`, so no modulation target and no flash route). Neutral reads `filter: none`.

The grade is **PREFERENCE** (a screen calibration per device): one new record `lambdawaves.q0.curves` (the model's `serialize()` JSON), declared in
`settings-store.js` FAMILIES, restored at boot right after the panel is made (the first filter write is coalesced on the frame, so the first frame is
already graded), written 250 ms after a change, **removed by FORGET** (otherwise a closed card would leave a grade FORGET could not clear). It is never in
the settings blob, a project, a link or a history row.

| file | change |
|---|---|
| `lab/rack.js` | 2 imports (`createCurvesPanel`, `jsonStore`); `curvesStore` beside `modStore`; FORGET also `curvesStore.remove()`; one block after the RENDER registration (`device`, the note, the panel, restore, the debounced save, seat after RENDER, `rk.register({ closed: true, glyph: 'curves' })`, `LW.curves = model`) |
| `lab/settings-store.js` | FAMILIES row `'lambdawaves.q0.curves'` -> `PREFERENCE` |
| `lab/sw.js` | `node tests/pwa.test.mjs --write` (the kit's `curves.js` + `picture-filter.js` are now reached: 2 rows added, rack.js and settings-store.js re-hashed) |
| `docs/STATE-SCOPES.md` | one table row (the key, its scope, its writers) |
| `tests/curves.browser-test.mjs` | new permanent guard, 7 PASS (below) |
| `tools/hit-probe-set.mjs` | two scenes: the CURVES card floated, DISCONNECTED and JOINED |
| `tools/perf/device-report.js` | `curves` in the per-bin state sample, so two posted reports say which was graded |

Nothing in `lab/mir/**` or `lab/fonts/**`; no new colour; no `!important` (the card is the kit's skin and tokens, the note is the existing `.note`).

## Lines
`cat lab/*.js | wc -l`: **27,594 -> 27,613 (+19)**: rack.js +16 (a comment block of 5 lines, 9 of code, 2 imports), settings-store.js +1, sw.js +2 (the two
new precache rows). The brief said about +30.

## THE PRESENTS/S FIGURES (U9; the pair cannot see this)
Method: headless Chromium on the RTX 3070 (`tools/perf/cdp.mjs`, Vulkan/ANGLE, 1600 x 1000, the main-thread tool's launch, warm-up and notice handling), a
fresh browser per run, `?sw=0&warn=0&starter=home`, WAVE DANCER opened (`__LW.projects.demo('wave-dancer')`), the arm applied (`__LW.curves.preset('MASTER',
'S')` or nothing), the canvas filter **asserted** (`none` / `url("#mir-picture-1")`, both at the start and the end of the window), then paused, settled,
`__LW.play()` and `__LW.stats.presents` read over **30 s**. Three pairs, interleaved neutral / S-curve, one browser on the rig at a time
(`.tmp/curves-presents.mjs`, not committed; the recipe is this paragraph).

| run | arm | presents/s | main thread ms/s |
|---|---|---|---|
| 1 | neutral | 15.028 | 90.8 |
| 2 | S-curve on MASTER | 12.224 | 73.5 |
| 3 | neutral | 15.150 | 89.2 |
| 4 | S-curve | 12.092 | 72.8 |
| 5 | neutral | 14.993 | 89.2 |
| 6 | S-curve | 12.178 | 72.8 |

**neutral 15.03 presents/s (14.99 to 15.15); S-curve 12.18 presents/s (12.09 to 12.22): -2.85 presents/s, -19.0 %**, the spreads far inside the
difference. Per frame the main thread is 6.0 ms in both arms, so the loss is not script: it is the filter's own pass (about +16 ms a frame at this canvas
size on this headless rig). **A graded screen is not free; a neutral one is** (`filter: none`, no filter pass: by construction the rate of a tree without the card).
These are the headless Chromium's compositor, not a display's; the iPad and a real GPU compositor may price it differently, which is why the M5 report
is the real answer. The measurement is the reason CURVES ships **closed and neutral**.

### Josh's device report on the M5 (his to run)
The grade is PREFERENCE, so it survives a reload; the report's per-bin state now carries `curves` (`none` or `url(#mir-picture-N)`).
1. Open the lab on the M5 as usual, on the LAN build, with `?report=1&post=1` (CURVES neutral, the default). Let the long play (30 s) finish.
2. Open **WINDOW > CURVES**, step **PRESET** to **S**, reload with the same `?report=1&post=1`, let it finish.
3. **RESET** the card (or FORGET). Compare the two reports' long-play fps and the `curves` field in the bins.

## Acceptance, measured
- **Neutral reads `filter: none`** on the shipped defaults: `tests/curves.browser-test.mjs` asserts `getComputedStyle(#field).filter === 'none'` and that no record
  is written; FORGET returns it to `none`.
- **Screen only, by measurement** (the same test): an S-curve changes the driver's screenshot, and the exported picture (`__LW.capture.picture`) is
  **the same sha-256** graded and neutral. By construction `capture.js`' readback and `frame(i, ctx)` never see a CSS filter; THE LOCK below agrees.
- **Shipped closed** on a fresh profile, in + (`#rackAddList` row) and WINDOW (`CURVES`), on the right rack, with the one line of text.
- **PREFERENCE**: own record; `'curves' in settings blob` false; the serialized project is identical graded and neutral (the `layout.at` stamp aside);
  NEW leaves the record and the filter alone; a reload restores both; no undo row; FORGET removes it. settings-probe proves it for every project open.
- **Suites** (one browser at a time, my tree): `bash test.sh node` exit 0 · `tools/hit-probe-set.mjs` **71 presses through gaps, 0 reached** (both CURVES scenes OK) ·
  `frame-occlusion` **7/7** · `tests/curves.browser-test.mjs` **7 PASS** (it also reads the mask closed / open / floated / folded) · `settings-probe` **0 of 6 red**
  (once the N2 scene hit "animation frames stopped", a rig stall; alone it was green) · `serialize-bytes` **11/11 `edit` shas identical to the base**
  (see below for the full bytes) · `menubar` GREEN · `history` **44/44** · `new-project` **8/8**, `node tools/new-project.mjs --check` in step (16,117 B: the file has no
  layout record, nothing to regenerate), `new-project.test` GREEN · `render-regressions` 2/2 · `node tests/pwa.test.mjs --write` then plain GREEN.
- **THE LOCK, once:** `--check --query gastab=0` **860 values · 0/0**; with the s4a fixture **1004 · 0/0** (page errors 0). The readback is untouched, as construction says.

### The serialize-bytes reading, exactly
The `edit` scope (the undo ring's record) is **identical to `27eb96a` on all 11 readings**. The **full** `serialize()` bytes are **+81 B on all 11**, and 81 B is exactly
the one WORKSPACE card row `{"id":"curves","side":"R","folded":false,"closed":true,"off":false,"float":null},` that `captureLayout` now writes for the new card, as it did
for RENDER. So "nothing of yours in a project" is true of PROJECT keys and false of the WORKSPACE layout record, which lists every card; a reader who wants the full
shas unchanged cannot have a new card. The two ways to see it: the integrator expects 11 new `full` shas (+81 B each), or the layout writer skips a card that is
closed and unmoved (not done: it would change every card's record).

## A bug found on the way, and its fix (so the integrator knows why the card sits where it does)
First placed at the foot of the rack (`rack.appendChild`), the card made **settings-probe 4 of 6 red**: `closed[]` (WORKSPACE) was saved in two orders. A project
open runs the kit's `arrange`, which leaves a card its layout does not list where it stood and appends the listed ones behind it, so `curves` ended **second from the
top** after a demo open, and **last** after a reload (registration order). The fix is one token: the card is seated **right after RENDER**
(`filmCard.card.root.after(wCurves.root)`), the one place both orders agree. The suite proves it (reload byte-identical on all 6 scenes). **A card that ships
closed and that no shipped layout lists must be seated where an unlisted card stays.**

## Findings and brief candidates
1. **A returning browser sees the card open once.** `applySettings` restores `closed[]` "exactly" (rack.js, `s.closed.includes(id)`), and a blob saved before this
   card lists every closed card the browser knew, so a new card is opened for it. Measured on `{ closed: ['shadow','history'] }`: `curves`, `render` and `clip` all open.
   RENDER (0.5.0) behaves the same, so this is a general gap, not this row's; a fresh profile and the first run ship it closed (the suite asserts that). The fix is a
   list of cards the blob has seen, or `ships-closed` ids a blob predating them keeps closed: a small row for the integrator or for 0.5.x. **Josh's own browser will
   show CURVES open on its first load of 0.5.1; × closes it for good.**
2. **The grade covers the field canvas only.** The filter sits on `#field`; the 2-D overlay canvases (VORTEX, KEPLER, PARTICLES, FLOW) and the stage text are above it
   and stay un-graded. That is the right reading of "the picture" for the field's colours but not for the overlays; filtering `#stage` would also grade the title and
   badges. Said in the note's neighbourhood only if Josh wants it; otherwise leave.
3. **The 19 % cost has a cheaper road (kit/engine, not 0.5.1).** The panel's `port: { setTable(channel, table) }` mode hands the 256-entry tables to the app's own
   shader; a grade applied in the present shader would cost a table lookup, not a compositor pass. It touches `field.js` (and so the lock) and must decide whether the
   readback sees the grade (it must not, for the SCREEN-only law): that is R6-M's kind of row, 0.5.x.
4. **AMOUNT under a guard.** Routing AMOUNT is a flash route (a swing of the whole picture's tone). When D10-19's guard exists, a `curves.amount` target in its whitelist
   with its own range would make CURVES modulatable; until then the knob is a hand knob.
5. **A kit `screenOnly` note row.** The one line is plain text in λWAVES' words. A `note:` option on `createCurvesPanel` (or a `screenOnly` flag that prints the kit's
   sentence) would let any app say it the same way.
6. **The panel builds its view even while the card is closed** (`createCurvesPanel({ parent })` builds into `parent` at once), as the CAMERA and RAMP panels do here. The
   kit's `rack: ` registration builds on first open; it would save a few DOM nodes but is a different road (and not in the DEVICES map). Not worth a row.
7. **A headless-Firefox rAF stall** ("animation frames stopped", `stats.frames` 0 after a reload) appears now and then under load on this rig; not this row's, but it is
   why `curves.browser-test` reads the frame mask before its reload step.

## Merge notes for the integrator
- `lab/rack.js` has **four sites**, all small and away from D1's notebook block and the stage text: (1) two imports after the `localStore` import (~line 76); (2) `curvesStore`
  after `saveMod` (~line 468); (3) the FORGET press (~line 1140, one `curvesStore.remove();` before `location.reload()`); (4) the block after the RENDER `rk.register` (~line 4679), which
  depends on `filmCard` and `rk` existing and on `rack.prepend(filmCard.card.root)` above it (the card is seated after RENDER). Nothing else.
- `lab/settings-store.js`: one FAMILIES row before `mir.render.calib`.
- `lab/sw.js`: take OURS (the integrator's) then `node tests/pwa.test.mjs --write`.
- `tests/curves.browser-test.mjs` is new; `tools/hit-probe-set.mjs` and `tools/perf/device-report.js` take one hunk each; `docs/STATE-SCOPES.md` one table row.
- `REPORT.md` gets a wave (210) under a new "0.5.1 · THE INFORMATIONAL UPDATE" heading at the end of the file; **every parallel D10 builder appends there, so expect a textual
  conflict and keep both; renumber the wave** (this builder read 209 as the last).
- After the merge the 11 `serialize-bytes` `full` shas move by the one card row (+81 B each) for ANY tree that carries a new card; the `edit` shas do not move.
- `__LW.curves` is a new member (the model: `points`, `preset`, `set`, `serialize`, `restore`, `filter`); no member was renamed or removed.

## The CLAUDE.md sentence (DRAFTED, not applied; to follow the RENDER/FILM paragraph)
> THE CURVES CARD (0.5.1 D10-24, `lab/rack.js` after the RENDER registration) is MIR's `createCurvesPanel({ parent, canvas: dom.canvas, project: false })` — no `history`, no
> `port`, no `mod` — over the stage canvas: MASTER · R · G · B through the kit's one SVG picture filter, so it grades the SCREEN only (`capture.js`' GPU readback, the film's
> `frame(i, ctx)` and THE LOCK never see a CSS filter) and the card says so in one line. It ships CLOSED on the right rack after RENDER, in + and WINDOW; neutral reads
> `filter: none` and costs nothing, a graded screen costs a compositor pass (WAVE DANCER: 15.0 -> 12.2 presents/s on the headless rig; Josh's M5 report is the real
> figure). AMOUNT is not routed (a flash route outside D10-19's guard). The grade is PREFERENCE, its own record `lambdawaves.q0.curves` (FAMILIES; the model's
> `serialize()`, written 250 ms after a change, removed by FORGET), never a project, link or history row. A card that ships closed and that no layout lists is seated where
> an unlisted card stays (after RENDER), or `closed[]` saves in two orders. `tests/curves.browser-test.mjs` is its guard; `__LW.curves` is the model.

## What Josh will see
A **CURVES** entry in the **+** list and in **WINDOW** (the card is closed; on a browser that already has a saved layout it opens once on the first load and × closes it for good).
Open, the card shows one line, "Grades the screen only — pictures and films are untouched.", then the kit's curves editor: CHANNEL (MASTER R G B), the plot (press to add a point,
drag it, drag a ring to bend, double-tap to remove), AMOUNT, PRESET (LINEAR LIFT S LOG GAMMA INVERT) and RESET. Moving the curve grades the **screen** at once; **CAPTURE IMAGE, ONE PERIOD,
RECORD and EXPORT FRAMES are untouched**. The grade stays on this device across reloads and projects (NEW, a demo, a link do not change it), FORGET clears it, and while it is not neutral the
field draws about a fifth slower on the headless rig (his M5 will say).
