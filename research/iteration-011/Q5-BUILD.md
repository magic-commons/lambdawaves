# Q5 · THE BLUR, ONLY WHERE IT BELONGS — build report (iteration 011, branch `it011-blur`, BASE `0afba10`)

> **Josh, 2026-10-19 ≈ 13:20** (screenshot `josh-rogue-blur-2026-10-19.png`: the timeline over biotin, its lanes blurring the
> molecule): "there appears to be a rogue blurring that's on in any of the UI elements, the blur should only apply to the work
> bars, the timeline bar and scrubber and the chips."

## What changed

One rule, last in `lab/skin.css` (lines 803–823), unlayered and `!important`:

```css
:not(:where(.tl-toolbar, .tl-ruler, .m2workbar, #rackToggle, #rackAdd, #rackFav)),
:not(:where(.mir-chip, .crail-chip))::before,
::after { -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }
```

- **Kept, and still governed by the FROST preference** (they blur only under `body.frost`; `frost-hold` stops them; a phone has
  frost OFF so they never blur there): the work bars — the timeline's tool strip `.tl-toolbar` (SLICE · CLIPS · POINTS · SNAP ·
  STEP · SLIDE · ACTIVE) and the modulation window's two `.m2workbar`s (the PRESET bar and the BPM bar; it has them, so they
  keep it); the timeline's bar and scrubber — the ruler `.tl-ruler` (the playhead is a 1.5-px line with no glass of its own; its
  flag rides the ruler); the chips — `.mir-chip::before` (the timeline's rail, the keyboard pane's ×), `.crail-chip::before` (the
  modulation rail) and **my call, for Josh to overrule**: the rack's ◧ + ☆ stack (`#rackToggle`, `#rackAdd`, `#rackFav`), round
  30-px glass buttons that read as chips. Deleting those three ids from the rule drops them.
- **Everything else paints no backdrop**, its fill, sheen, border and shadow untouched. Why one universal rule and not 18 app edits:
  the kit's 38 rules live in `lab/mir/**` (not ours to edit), the app has 18 more, and Josh's word was "rogue" — a blur nobody
  listed. An allow-list catches the next one too. Specificity: `:not(:where(…))` is 0, so any later `!important` beats it; the
  kit has no `!important` blur (grep: every kit `backdrop-filter … !important` is `none`), so nothing layered can re-enable one.
- `VIVID` is the accent engine's vividness (`mir/shell/gui.js:110`, `accent.set`), not a glass value: it means what it meant
  everywhere. The frost PREFERENCE default (Q2's) is untouched; only WHERE the blur paints moved.
- CLAUDE.md: the LOOK paragraph's first-run sentence now says where the 22 px frost paints, with Josh's words.

## The inventory (first-run material: light · refractive · ALWAYS frost · 22 px · DISCONNECTED; desktop 1500×950)

Measured, not read: `q5-shots/q5-probe.mjs` walks every painted element and its `::before`/`::after` for a computed
`backdrop-filter ≠ none` in eight scenes (Firefox, `firefox-{before,after}-{light,dark}-{desktop,phone}.json`); the Chromium run
(`q5-chromium.mjs`) repeats it on the real GPU.

| surface (where it blurred from) | before | after | verdict |
|---|---|---|---|
| timeline tool strip `.tl-toolbar.glass` (kit `css/skin.css:534`, app `skin.css:143`) | blur 22 | blur 22 | **WORK BAR — keep** |
| timeline ruler `.tl-ruler.glass` (same) | blur 22 | blur 22 | **BAR + SCRUBBER — keep** |
| timeline rail chips `.mir-chip::before` (kit `window/window.css:163`, `--chip-filter` from `:58`) | blur 22 | blur 22 | **CHIP — keep** |
| modulation `.m2workbar` × 2 (kit `css/skin.css:534`) | blur 22 | blur 22 | **WORK BAR — keep** |
| modulation rail `.crail-chip::before` × 4 (kit `window/window.css:163`) | blur 22 | blur 22 | **CHIP — keep** |
| rack stack `#rackToggle` `#rackAdd` `#rackFav` (`.glass`, kit `:534` / app `:143`) | blur 22 | blur 22 | **CHIP (my call) — keep** |
| keyboard pane's × chips `.mir-chip::before` | blur 22 | blur 22 | **CHIP — keep** |
| timeline WINDOW `.mir-timeline.glass` 836×440 (kit `:534`, app `:143`) | blur 22 | none | Josh's rogue: the whole pane behind the lanes |
| timeline lanes `.tl-pane.glass` × 4 | blur 22 | none | Josh's screenshot |
| rack card heads `.dev > .dev-head` (app `lab.css:17–23`: blur + the C0 brightness/saturate 1.03 lift) | blur 22 + lift | none | the 3 % lift is a backdrop filter too; the head's own fill `--glass-raise` stays |
| rack card bodies `.dev-body` (kit `css/skin.css:578`) | blur 22 | none | |
| `#transport.glass.mini` (app `skin.css:135`, `:143`; kit `shell/transport.css:215`) | blur 22 | none | |
| menus `#menubar .mb-list` (app `skin.css:552`, UNCONDITIONAL) | blur 22 | none | a true rogue: blurred with FROST OFF and on a phone (the phone's opaque law) |
| the Picker `#lwMenu` (app `skin.css:660`) | blur 28 + saturate 1.25 | none | |
| Picker arrows `.mm-arrow` (app `skin.css:702`) | blur 14 + saturate 1.25 | none | part of the Picker, not a chip |
| modulation panes `.m2rail` (MACROS), `.m2dev.lfo`, `.m2dev.env` (kit `:534`) | blur 22 | none | |
| keyboard pane `.km-win.glass` 1080×416 | blur 22 | none | |
| notebook `#notebook` (app `lab.css:65`; kit `shell/shell.css:71`, `:218`, `:222`) | blur 22 + saturate 1.15 | none | |
| photosensitivity notice (kit surface under `:534`) | blur 22 | none | see Open |
| not on screen in the eight scenes, caught by the same rule: `.mod-pop` (`lab.css:678`), the info popovers (kit `info/info.css:124`, already `none !important` in app `skin.css:311`), `.mir-list-add` (kit `controls/colour-controls.css:175`), modhost/modwindow surfaces (kit `modhost.css:306/1030/1475/1493`, `modwindow.css:401/659/1295/2070`), `#mir-toast` (kit `shell/parts.css`) | blur | none | |

Counts (kit's own `census()`, Chromium, light desktop): timeline over benzene **24 → 11** blurred surfaces; rack 13 → 3; menu
14 → 3; Picker 13 → 3; modulation window 22 → 9; keyboard 16 → 5; notebook 14 → 3. Phone (frost OFF): 0 → 0 in every scene but
the menu, **1 → 0** (the `.mb-list` rogue).

## The cost

Same page, same scene (the timeline open over benzene, PLAYING, first-run material), the rule ON (after) and deleted through the
CSSOM (before — the row's only change), interleaved, 120 frames a read, headed Chromium 153 on the real GPU (NVIDIA Ampere,
120 Hz display; `chromium-light-desktop-perf-dsf2.json`):

| | blurred surfaces | rAF fps (mean of 5 reads) | median frame | p90 frame | reads with p90 > 12 ms | loop main-thread ms |
|---|---|---|---|---|---|---|
| devicePixelRatio 2 · before | 31 | **98.7** | 8.38 ms | 16.66 ms | 5 of 5 | 0.32 |
| devicePixelRatio 2 · after | 11 | **108.8** | 8.30 ms | 13.34 ms | 3 of 5 | 0.30 |
| devicePixelRatio 1 · before (3 reads, `chromium-light-desktop-perf-dsf1.log`) | 31 | 107.6 | 8.3 ms | 9.4 ms | — | 0.4 |
| devicePixelRatio 1 · after (3 reads) | 11 | 111.8 | 8.3 ms | 8.6 ms | — | 0.4 |

Plainly: on this GPU the blur is compositor work (the loop's main-thread ms does not move, as it should not), and taking 20 of
31 blurred surfaces off buys **≈ +10 % frames delivered at DPR 2 (98.7 → 108.8 fps; fewer dropped vsyncs)** and ≈ +4 % at DPR 1,
where both sit near the 120 Hz cap. A headed Firefox (`q5-perf.mjs`, its first form, before the rule existed) read the BEFORE at **≈ 35.6 fps (median 25 ms;
five reads 32.8 · 36.6 · 37.0 · 32.6 · 39.2, from the console — the json was not kept)** on this box; its AFTER read
could not be taken fairly in this session (the headed window was hidden — "Not enough memory left / page hidden" — twice), so no
Firefox ratio is claimed. A WebDriver screenshot (Firefox, headless or headed) never renders `backdrop-filter` (measured: rule on
vs off, 0 differing pixels), which is why the proof below is Chromium's.

## The proof — `research/iteration-011/q5-shots/`

`before-*.png` / `after-*.png`, `{light,dark}-{desktop,phone}-{scene}`, Chromium `Page.captureScreenshot` (composited, blur
rendered), the same paused frame per pair. Scenes: **josh** (benzene's orbital lobes, solid style, camera in close, the timeline
open over them — Josh's scene), timeline (density), rack (MOLECULES · SETTINGS · CAMERA unfolded), menu (WINDOW), Picker,
modwin, keyboard, notebook. Desktop: all eight × light × dark. Phone (390×844, first-run frost OFF): josh and menu — every other
phone pair was pixel-identical before and after (nothing blurred there), so it is not kept.

What they show: `before-light-desktop-josh` — the lanes and the timeline's window smear the lobes; `after-…-josh` — the lobes
read through the lanes crisp, and only the tool strip and the ruler frost them (pixel diff 27 380 px light, 38 507 dark).
Picker 16 531 / 13 712 px, notebook 4 817 / 6 197, modwin 2 215 / 4 402, menu 1 119 / 1 367. Phone menu: 974 / 1 694 px (the rogue).

## The gate

Ports 9441 / GD 5441.

| step | result |
|---|---|
| `node tests/pwa.test.mjs --write` | PASS (sw.js: skin.css and lab.css hashes re-stamped) |
| `./test.sh node` | exit 0 — 41 suites, 0 failing |
| `node tools/rack-deps.mjs --classes --no-write` | clean (60 app.state members, 233 crossing names, unchanged shape) |
| `node tools/new-project.mjs --check` | in step (16098 B) |
| frame-occlusion | exit 0, 7 PASS — **the occlusion mask did not move** (it masks painted rects; a filter is not one) |
| render-regressions | exit 0 |
| timeline | exit 0, 15 PASS (T4: its panes and chips masked, its gaps not) |
| menubar | exit 0 |
| official-defaults-palette | **exit 1 — RED on the base too**, `vivid is undefined`: the test looks for a SETTINGS knob labelled `VIVID` (`.k .k-lbl`, test line 11); SETTINGS › DISPLAY's VIVID is now a seg button (IN P3: CONVERT · VIVID), not a knob. Not near this change (it reads labels, not filters); left for its owner |
| current | exit 0, 15 PASS |
| frost-hold / OFF / tinted, read live (Firefox, computed) | ALWAYS: the 7 kept surfaces blur 22, lanes/window/heads/panes none · STILL + playing (`frost-hold`): all none · STILL paused: kept ones blur again · FROST OFF: all none · TINTED + ALWAYS: kept ones blur |
| THE LOCK ×2 | `digest-lock --check --query gastab=0`: **GREEN 843 values, 0 differences**; `--fixture …/digest-lock-s4a.json`: **GREEN 987 values, 0 differences**. (Two earlier attempts on this branch AND one on the base CSS died mid-run with "WebGPU device lost: Out of memory" while another row's Firefox held the GPU — environmental; the green runs are the record.) |

## Open — for Josh

1. **The rack's ◧ + ☆ stack** kept its blur as chips (my reading). One word and the three ids leave the rule.
2. **The Picker and the photosensitivity notice** are big panes whose blur hid the rack behind them; without it the rack shows
   through the Picker's .62 tint (`after-*-desktop-picker.png`) and the stage through the notice. Josh's law says no blur there;
   if either should read quieter, the fix is its TINT (an opacity, one line in `skin.css`), not the blur — not done here, since
   the row says "keeps its tint exactly".
3. The disconnected head's 1.03 brightness/saturate lift (C0 class 6) went with the rest: it is a `backdrop-filter`.
