# 029 M10 — THE SMOOTH DEFAULT · MEASURE + BUILD (Opus, 2026-10-31)

Tree: yan-c `ab13fe4c` (M10 planned), then one commit on this branch. Josh's word on CALL 1: "Try to get it as close to default as
possible while sacrificing just enough without losing the animations we worked hard for (show em off, and let users turn it off if
they want to)." Read as: the shipped default keeps the live FROST glass and every motion, and trims only what the eye does not see,
by the smallest amount that puts Chromium's GPU main thread under 7.5 ms per frame on the 120 Hz panel.

**The answer in five lines.**
1. **The winner is the canvas at 85 % while playing, glass live.** SMOOTH as built, in the lab (scene c with the Picker closed):
   GPU main **7.35 · 7.39 ms per frame** against FULL's **8.26 · 8.40**; present p95 **10.0 · 9.9** against 13.1 · 13.2; dropped
   **64 · 71** per 20 s against 176 · 206. BALANCED: 4.01 ms, p95 9.6, dropped 30. At rest, in films and in pictures, nothing changes.
2. **The frost blur RADIUS buys nothing.** 22 → 17 px and 22 → 13 px: 8.61 and 8.61 ms against 8.53 · 8.72. Chromium's backdrop
   blur costs the same at any radius here; only holding it (BALANCED) or removing it pays. No kit door is asked for.
3. **DISCONNECTED off while playing is not a candidate**: it merges each window's head into its body (`body.disconnected` lays the
   head out as its own pane, `lab.css:17–23`), so the windows change shape on the play edge. Not measured again (M6: 7.40 ms).
4. **The march at 110 steps is refused** although it pays (7.39 / 7.31 ms) and its still-frame difference is tiny (mean 0.05 LSB,
   max 6): it moves the FIELD's pixels while playing, WAVE DANCER's DITHER is OFF (0 LSB), so "below the dither" cannot hold, and the
   GRID seg owns the steps. SMOOTH changes only how many canvas pixels carry the same picture.
5. **A finding about every 029 probe so far: scene c ran with THE PICKER UP.** The Picker opens at boot (`picker.js:744`) and
   `projects.demo()` does not close it, so M0, M6, M7–M9 and this row's sweep 1 measured the Picker's full-page frost over the playing
   field, not the lab (see the playing shots `picker-*.jpg`). The probe now has a `lab` lever (the Picker's own action, L). With the
   Picker up SMOOTH reads 7.59 ms (FULL 8.71, dropped 69 against 273): under the 8.33 budget, not under 7.5. In the lab, where a
   player plays, it is under 7.5 in every run.

## THE PROBE (headed Chromium 156 on Josh's screen, RTX 3070 on Vulkan, 119.93 Hz, canvas 1865 × 868; scene c = WAVE DANCER + modulation armed + window open + AUDIO live on STAR's drop; 20 s each)

Three windows appeared on Josh's screen, one at a time, each closed by pid (sweep 1, 7 runs ≈ 9 min; sweep 2, 8 runs ≈ 10 min; the
proof, 7 runs ≈ 9 min), plus one 2-run, 3 s capture check. `STAR` = `…/optimization-2026-09-24/media/star.mp3`, read in place.

    nice -n 10 node tools/perf/mod-profile.mjs --chromium c --lever default,scale90,scale85,blur75,blur60,steps110,default --secs 20 --audio $STAR --shots …
    nice -n 10 node tools/perf/mod-profile.mjs --chromium c --lever default,lab,lab+scale90,lab+scale85,lab+steps110,lab+scale85+steps110,lab,default --secs 20 --audio $STAR --shots …
    nice -n 10 node tools/perf/mod-profile.mjs --chromium c --lever lab+full,lab,lab+balanced,lab,lab+full,full,default --secs 20 --audio $STAR --shots …   (the proof, SMOOTH built and the default)

The tool (`tools/perf/mod-profile.mjs`) gained: the levers `scale90` `scale85` `scale80` `blur75` `blur60` (and `scale75` `scale50`
`steps110` rewritten to keep what they change), each with its REST (what the build would put back at rest: the scale, the look's blur,
the steps); `lab` (the Picker closed by its action); `full` and `smooth` (SETTINGS' seg pressed); `--shots <dir>`: a JPEG of the
playing picture after the trace, then the paused stage with the interface hidden (H), the modulation and the mic stopped, captured
before and after REST, decoded in node (zlib + the scanline filters) and digested by its pixels; ENV says the glass's filter, the
dither and whether the Picker is up. GPU main = the CrGpuMain thread's busy time (union of its events) ÷ DrawFrame, as M6.

### Sweep 1 — scene c as M0–M9 ran it (THE PICKER UP)

| lever | fps | present p50 / p95 / p99 ms | > 17.5 | dropped / 20 s | GPU main s (ms/frame) | Viz s | canvas while playing |
|---|---|---|---|---|---|---|---|
| default (QUALITY), first | 105.8 | 8.8 / 13.6 / 17.2 | 25 | 257 | 18.6 (**8.53**) | 7.4 | 1865 × 868 |
| canvas 0.90 while playing | 113.5 | 8.5 / 11.3 / 16.1 | 18 | 112 | 18.0 (7.83) | 8.0 | 1679 × 781 |
| canvas 0.85 while playing | 115.7 | 8.4 / 10.3 / 14.7 | 15 | 90 | 17.8 (7.66) | 8.2 | 1585 × 738 |
| frost blur 0.75× (22 → 17 px) | 107.6 | 8.8 / 13.7 / 17.1 | 19 | 252 | 18.6 (8.61) | 6.8 | 1865 × 868 |
| frost blur 0.6× (22 → 13 px) | 107.0 | 8.9 / 13.5 / 17.1 | 24 | 261 | 18.6 (8.61) | 6.6 | 1865 × 868 |
| march 110 steps (WAVE DANCER's 160) | 115.8 | 8.4 / 9.8 / 11.7 | 11 | 61 | 17.4 (7.39) | 8.0 | 1865 × 868 |
| default (QUALITY), last | 106.7 | 8.9 / 13.7 / 17.4 | 26 | 270 | 18.7 (**8.72**) | 7.3 | 1865 × 868 |

Brackets: GPU main 8.53 → 8.72 (2 %), dropped 257 → 270 (5 %). The blur rows: Viz drops 0.6–0.8 s, the GPU main thread not at all.

### Sweep 2 — the lab (THE PICKER CLOSED) against the Picker

| lever | fps | present p50 / p95 / p99 ms | > 17.5 | dropped / 20 s | GPU main s (ms/frame) | Viz s | canvas while playing | the trim on a still frame (max · mean · p99 LSB) |
|---|---|---|---|---|---|---|---|---|
| default, Picker up, first | 103.9 | 8.9 / 14.4 / 17.9 | 33 | 294 | 18.6 (8.65) | 7.5 | 1865 × 868 | — |
| **lab** (QUALITY) | 109.6 | 8.6 / 13.2 / 17.1 | 22 | 193 | 18.6 (**8.35**) | 7.6 | 1865 × 868 | — (drift 3 · 0.038 · 1) |
| lab + canvas 0.90 | 116.4 | 8.4 / 10.1 / 13.2 | 9 | 71 | 17.9 (7.64) | 8.0 | 1679 × 781 | 4 · 0.112 · 1 |
| **lab + canvas 0.85** | 116.8 | 8.4 / **9.9** / 11.6 | 8 | **66** | 17.4 (**7.41**) | 7.9 | 1585 × 738 | 5 · 0.099 · 1 |
| lab + 110 steps ¹ | 116.7 | 8.4 / 9.9 / 12.2 | 12 | 60 | 17.2 (7.31) | 8.1 | 1865 × 868 | 6 · 0.052 · 1 |
| lab + canvas 0.85 + 110 steps | 116.7 | 8.3 / 9.9 / 12.4 | 7 | 48 | 16.9 (7.12) | 8.4 | 1585 × 738 | 6 · 0.108 · 1 |
| **lab** (QUALITY), last | 110.4 | 8.6 / 13.2 / 17.5 | 27 | 174 | 18.7 (**8.34**) | 7.7 | 1865 × 868 | — |
| default, Picker up, last | 104.0 | 9.0 / 14.6 / 18.1 | 38 | 294 | 18.6 (8.77) | 7.6 | 1865 × 868 | — |

¹ The governor stepped once during this run (the canvas read 1399 × 651 at the pause), so its number is not the steps' alone.
"The trim on a still frame": the paused stage (interface hidden) with the trim still on, against the same moment after REST. The
paused stage is not byte-still on its own: the march's jitter seed is `presents % 97` (`field.js:1765`, pinned only under PLAYBACK
LOCK), so every re-present moves a few texels by 1–6 LSB (the drift column, B against B again: mean 0.03–0.04 LSB). The 0.85 canvas
adds about 0.06 LSB of mean difference over that floor: soft volumes upscale almost exactly.

**The pair of the two best** (0.85 + 110 steps, 7.12 ms) is not needed: the canvas alone reaches the target without touching the field's
pixels. 0.90 alone (7.64) does not. So 0.85 is the smallest canvas step that pays, and the winner.

## THE BUILD

| the change | where |
|---|---|
| The seg is **PERFORMANCE · FULL \| SMOOTH \| BALANCED \| LIGHT** (one line in SETTINGS › QUALITY: `M10-shots/settings-performance-seg.jpg`). Ids/values `full` · `smooth` · `balanced` · `light`; M7's saved `quality` is read as `full`; an absent key is `smooth`. FULL is QUALITY renamed (four letters, "nothing trimmed"); SMOOTH says what the default buys. Hints: FULL "Everything as the look says, always" · SMOOTH "Live glass; canvas at 85 % while playing" (both ≤ 60). | `lab/windows/settings-card.js` (`ui.setTier`, the seg) |
| SMOOTH = the live glass + the canvas scale's ceiling 0.85 **while the clock plays**: the loop's one `field.resize` takes `Math.min(scale, PLAY_CAP[tier])` (`PLAY_CAP = { smooth: 0.85, light: 0.5 }`); the pause edge schedules one present, so the still picture repaints full (LIGHT's road). Films and pictures run with the loop stopped and size the canvas themselves. Only BALANCED and LIGHT hold the frost (`look.hold`), and only they count a running modulation as motion. | `lab/rack.js` (the loop, the pause edge) |
| The default: `applySettings`' fallback `s.perfTier \|\| 'smooth'`, and the controller's `perf.tier: 'smooth'`. | `lab/shell/settings.js:93`, `lab/shell/controller.js` |
| METERS: the GOVERNOR readout always starts with the tier's word (`SMOOTH · nominal · …`, `FULL · …`). | `lab/rack.js` `paintGovernor` |
| The FIELD QUALITY note: "SMOOTH, the default, keeps the live glass and every motion and draws the canvas at 85 % while playing (full size at rest, in films and in pictures)". | `lab/windows/settings-card.js` |
| `docs/STATE-SCOPES.md`'s hand-written row names the four values. `tests/official-defaults-palette` reads the seg on a first run: `FULL\|SMOOTH*\|BALANCED\|LIGHT`, the look untouched. | docs, tests |

No stored key, window id, target id or CSS hook moved; `perfTier` stays the PREFERENCE it was. The `app` literal is not extended.
`lab/mir/**` and `lab/fonts/**` are untouched. `lab/sw.js` was rewritten only by `pwa.test --write`. No FOR-MIR line: the blur
radius did not pay, so no `blurScale` door is asked for.

## THE PROOF (SMOOTH built, the same probe)

| run | fps | present p50 / p95 / p99 ms | > 17.5 | dropped / 20 s | GPU main s (ms/frame) | canvas playing → at rest | frost-hold playing |
|---|---|---|---|---|---|---|---|
| lab, FULL, first | 109.8 | 8.6 / 13.1 / 17.2 | 23 | 176 | 18.7 (**8.26**) | 1865 × 868 → 1865 × 868 | no |
| **lab, SMOOTH (the default)** | 116.8 | 8.3 / **10.0** / 12.0 | 8 | **64** | 17.3 (**7.35**) | 1585 × 738 → 1865 × 868 | no |
| lab, BALANCED | 116.8 | 8.3 / 9.6 / 11.0 | 9 | 30 | 9.6 (4.01) | 1865 × 868 → 1865 × 868 | yes |
| **lab, SMOOTH (repeat)** | 116.5 | 8.4 / **9.9** / 12.4 | 7 | **71** | 17.3 (**7.39**) | 1585 × 738 → 1865 × 868 | no |
| lab, FULL, last | 109.5 | 8.7 / 13.2 / 17.5 | 28 | 206 | 18.6 (**8.40**) | 1865 × 868 → 1865 × 868 | no |
| Picker up, FULL | 105.6 | 8.9 / 14.2 / 18.5 | 39 | 273 | 18.6 (8.71) | 1865 × 868 → 1865 × 868 | no |
| Picker up, SMOOTH (the first-run default) | 115.9 | 8.4 / 10.0 / 14.4 | 12 | 69 | 17.8 (7.59) | 1585 × 738 → 1865 × 868 | no |

**SMOOTH lands on the measured winner** (lab + canvas 0.85: 7.41 ms, p95 9.9, dropped 66). Mean of two: 7.37 ms, p95 9.95, dropped 68,
against FULL's 8.33 ms, 13.15, 191 (−12 % GPU, −24 % p95, −64 % dropped). In every run the look store reads `card refractive · frost
always · blur 22 · disconnected`, `body.frost` is on and `frost-hold` is off while playing: the glass is live. FULL's brackets: GPU
8.26 → 8.40 (1.7 %), dropped 176 → 206 (17 %, reported).

**The paused stage.** At rest the canvas is 1865 × 868 in every SMOOTH run (read after the pause edge), so the field draws the same
pixels as FULL at the same moment; the paused digests (`*-paused.png` in `.tmp/it029/m10-shots3`, not committed) differ run to run
only by the march's jitter seed (`presents % 97`), as FULL's do (drift max 2–5, mean 0.03 LSB in both). THE LOCK below is the
byte proof.

**The shots for Josh's eye** (`research/iteration-029/M10-shots/`, JPEG q70 of the whole window while playing): `lab-full-playing`,
`lab-scale90-playing`, `lab-scale85-playing`, `lab-SMOOTH-built-playing`, `lab-steps110-playing`, `lab-scale85-steps110-playing`,
`lab-balanced-playing`, `picker-full-playing`, `picker-blur75-playing`, `picker-blur60-playing`, `settings-performance-seg`.

## THE GATES

- `node tests/pwa.test.mjs --write && ./test.sh node`: **green, RC 0** (`hints-census --check`: over 60, 0; `state-scopes --check`: 32 rows;
  node `render-exact`, `auto-scale` and `new-project` inside).
- THE LOCK on the gate server at 9833 (GD 5833, stopped by pid) with SMOOTH the default: `digest-lock --check --query gastab=0`
  **843 · 0** (0 readback, 0 record-byte differences, page errors 0); `--fixture tests/fixtures/digest-lock-s4a.json` **987 · 0**.
- `node tools/new-project.mjs --check`: in step (16098 B). `node tools/rack-deps.mjs --classes --no-write`: **HOLDS** (persist at 24,
  limit 25; 0 bare writes). dependency-cruiser: **0** app-side circular edges.
- Browser, one at a time on 9833, all **GREEN, rc 0**: `official-defaults-palette` (5 s; the first run reads `FULL|SMOOTH*|BALANCED|LIGHT`,
  the look `refractive · always · 22px`), `hide-reveal` (25 s), `frame-occlusion` (6 s), `film-handover` (88 s; films untouched), `start`
  (3 of 3 scenes), `history` (141 s), `field-law` (10 s; READERS FULL pressed by its label, hydrogen RMS 2.34e-6). `node tools/settings-probe.mjs`:
  **GREEN, 0 of 3 scenes red** (boot 833 B, WAVE DANCER 860 B, NEW 851 B, each byte-identical across the reload).
- One fault found and fixed on the way: `tests/auto-scale.test.mjs` lifts the pause-edge block by its source text, so a name defined
  outside it (`PLAY_CAP`) threw there; the edge line names the two tiers instead.

## WHAT WAS LEFT

- **The Picker-up case** (the first-run front page with the field playing behind it): SMOOTH 7.59 ms, under the panel's 8.33 but not
  under 7.5. The Picker's full-page frost is one big backdrop over the moving canvas; a hold of the Picker's own frost while the field
  plays would be the lever, and it is the Picker's look (picker.md), so it is Josh's call, not built.
- **M0–M9's numbers were taken with the Picker up.** Their conclusions stand (the glass is the cost; the hold pays), but every
  "scene c" number in M0/M6/M789 includes the Picker's frost. The lab's own FULL is 8.26–8.40 ms, not 8.66. The probe's `lab` lever
  is there for the next row; the scene definitions themselves are unchanged.
- Josh's own 002 WAVE DANCER is not in the tree (the bundled demo stands in). A weaker real GPU and a 60 Hz panel are not on this
  machine (M6 § 5).
- The raw summaries: `.tmp/it029/m10-sweep1.json`, `m10-sweep2.json`, `m10-proof.json` and the shot folders (not committed).
