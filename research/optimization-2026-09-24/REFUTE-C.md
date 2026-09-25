# REFUTE C · the cross-refutation from the CSS / compositing / DOM-invalidation lane · 2026-09-24 · Opus 5.5

I read AUDIT-A, B, D, E and F whole. New probes are in `probes/C/refute/`: `fe4-cssom.mjs` (+ `.json` and `-five.json`),
`field-prop.mjs` and `el-busy.mjs`. Nothing under `lab/` or `tests/` was edited. The CSS removals were done on the live
CSSOM, in the page.

## 1. Verdicts

**FE4 · 124 orphan selectors: CONFIRMED (+), with one RISK.**
- **Method.** `fe4-cssom.mjs` removes the 124 selectors from the page's live CSSOM: 124 selectors in 112 rules. Where a
  selector shares a comma list, only that selector is dropped; where it stands alone, the rule is deleted. The probe then
  hashes the full computed style (every property except custom properties) of **all 4 607 elements**. The page is in its
  widest state: every window open, the modulation window open with a macro, played for 1.5 s. It is hashed in 4 states:
  light/disc/frost · dark/disc/frost · dark/connected/frost-off · light/connected/tinted.
- **Result.** An A/A pass measured the noise first (rack chips finishing their transitions). Beyond that noise, **0
  elements differ in 3 states and 1 in the 4th**. That one is `div.ro-val`, a live readout whose class toggles; it moves
  again in an unrelated run, and no removed selector can match `.ro-val`.
- **Why this is expected.** A compound that requires a class no code can put on an element cannot match in any state
  (hover, phone breakpoint, reduced motion included). The matched-rule list of every element is therefore unchanged, and
  so is the cascade order among the rules that remain. I re-checked the tokens by grep over `lab/**/*.js` and
  `index.html`: 0 hits for `mod-x`, `mod-grip`, `mod-card`, `keys-chip`, `ui-hide`, `hint-i`, `seg-lbl`, `pal-preset`,
  `tempo-eyebrow`, `native-tempo-hz`, `km-action-sep`, `fd-/ro-/k-label`. There is no `'mod-' +` concatenation;
  `wave-row-` is built only for rows 0, 1, 2, 3, 4 and 6.
- **RISK.** The `strong` array in `probes/E/css-orphans.json` holds **127** entries: it still contains the three false
  positives E removed by hand (`.nb-view .katex-display`, `.hist-future`, `.hist-future .hist-lbl`). Build from the
  filtered 124, never from the file.
- **Second tier: REFUTED for `.orbit-row`, `.orbit-band`, `.orbit-id`, `.orbit-c.drive` and `.dyn-row`.** They are live:
  orbit.js builds them (the rows at 70–72; `drive` is toggled by the DRIVE switch at 26), and dynamicsview.js builds
  `.dyn-row` at 94. Removing them changed **28 elements** in every state (2 orbit rows and 2 dyn rows were present).
- **Second tier: CONFIRMED neutral (0 elements beyond noise, `fe4-cssom-five.json`).** `.keys-list`, `.dev .keys-list`,
  `.native-clean .grp .grp`, `.native-clean[data-id=observer] .grp` and `…camera-motion .sw`. The `.grp .grp` selector is
  subsumed anyway: it sits in the same rule as `.native-clean .grp`.
- **`.palette-seam …`** (not run): the node lives only between the paletteview constructor and `reworkNative`. Both run
  inside the one synchronous task that follows `await createField`; rack.js has no await in between (checked by grep). So
  that node is never painted, and its rules are neutral to delete.
- **Check for the build:** MIR stylehash, plus `fe4-cssom.mjs`, which needs no edit to lab/.

**FE2 + FD5(a) · the closed modulation window's layout at boot: MERGE, with D's placement preferred. RISK on E's variant B.**
Pixels: the closed window is `display:none`, so no pixel. But modwindow.js `paint()` writes the MODEL: the env-compact
`M.setSource(s.id, { timeScale: want })` in its device loop runs *before* the `g.box.clientWidth` read. E's variant B
("keep only `paintRings()` while `!P.open`") skips that auto-fit. A project saved with the window closed could then carry
a different `timeScale`, so the `serialize()` bytes may change. D's guard (`continue` just before the clientWidth read,
plus skipping only place()'s rect block) keeps the fit. `paintRings` must keep running in both variants, because the
rings live on the house knobs. Check: `__LW.serialize()` bytes of a project with a compact ENV, saved with the window
closed, before and after.

**FE10 · reworkNative: CONFIRMED (not a speed item, ≈3 ms). RISK if folded.** The wrapped setters carry behaviour:
- `ui.styleSeg.set` wraps `syncFinish`, which recomputes which FINISH options are disabled.
- The FRAME and AXES enum segs mirror `mat`.
- The P3 switch mirrors the gamut seg.

Every road that sets these (restore, `hLookWrite`, links, keys) must keep updating them once the wrappers go. The
`wave-row-*` indices are skin-significant (skin.css keys on rows 2, 5 and 6; row 5 is never built). Check: a hash of each
device's subtree at ready, MIR stylehash, and a serialize round trip.

**FD5(d) · set `data-theme` at the top of boot: NARROWED — final pixels identical, boot frames not.**
- **Final state identical:** `setTheme` (rack.js:1556–1574) has no early-out and still runs in full at applySettings.
- **Boot frames change.** Boot is one synchronous task after `await createField`. The frames painted during that await
  (~0.4–0.5 s cold in Firefox) today show the dark stage (#070a0f) with the white wordmark; with (d) they would show the
  light stage (#eef1f6) with the black wordmark. The first-visit dark → light flash gets shorter. Frames before the
  module graph evaluates stay dark (lab.css:4, the theme-color meta).
- **Verdict:** a visible change in the strict sense, but it can only shorten a flash. Accept it explicitly. After FD1
  the await is ~40 ms, so the pixel effect nearly vanishes and the win is the post-ready restyle (16.3 ms).
- **Canvases:** views painted at construction in dark ink are fixed up today by kit `onThemeChange` ('' → 'light'). With
  (d) that flip never fires. This is safe, because each view has a second road: plane-model has its own ResizeObserver
  (plane-model.js:48), graphHover views have the kit's ResizeObserver repaint, and paletteview gets an explicit rAF
  repaint at the end of boot.
- **SYSTEM theme:** resolve it through the same `matchMedia` call.

**FD5(b) · CONFIRMED neutral** (one task, SLICE ships closed, plane-model's RO paints on first sizing).
**FD5(c) · RISK:** the hidden legacy H₂⁺ card must still repaint when a legacy save reveals it (wave 108). Verify that
the reveal road calls `refresh()` (molecular-names.browser-test).

**FB3 · the link-retry repaint: CONFIRMED neutral in pixels.** The window is `display:none`. The only output of
`sync()` → `paint(true)` outside the window is `paintRings` on house knobs, which is idempotent, and a refused,
route-less rack has no rings at all.
*Self-correction for AUDIT-C FC4:* the 1.7 mutations/frame I measured with the UI hidden are FB3's 1 Hz retry, not a
per-play/pause write. After FB3, the UI-hidden path writes no DOM at all.

**FB5 · occlusion while hidden: CONFIRMED, on one condition.** Under `body.ui-hidden` every measured element is
`display:none`, and `#keysheet` does not exist (FE5: a dead id). The burst therefore already returns `[]`, so `out = []`
is exact. But the early path must still call `field.setOcclusion([])` on the first hidden burst: the line pass still
runs under H (slice outline, corner axis), and stale rectangles would punch holes in it.

**FB10 · forced reads in the readers: NARROWED.**
- The `themeInk` cache per `data-theme` is pixel-neutral: `--fg` and `--dim` on body come only from mir/css/skin.css:30
  and :201 and base.css:30, and nothing writes them inline. `themeInk` itself is kit, so cache in the app callers (or
  upstream).
- The ResizeObserver canvas size is **not** neutral on the frame a card unfolds or resizes. RO delivers after layout, and
  the reader runs in rAF before it, so the first paint lands one frame later.
- Steady-state gain ≈ 0: clean reads cost 2 µs, and the 2.6 ms is the same restyle moved earlier, not added.

**FA7 vs my "FRAME costs nothing on the DOM side": MERGE (reconciled).** Both hold. FRAME's DOM side is free (guarded
`dataset` writes, a static corner button). My numbers had a still camera, so the line cache held. FA7's 0.45–0.67 ms is
field.js CPU plus the upload while the camera moves (auto-rotate, a drag). That is the likely source of Josh's "Frame is
expensive", together with lattice's +0.2 ms GPU. FA7 owns it; AUDIT-C's claim narrows to "still camera".
**FA6 · CONFIRMED as a look decision.** It has no DOM side. The phone path applies 110 steps / 0.75 anyway.

**F12 / FB11 · the busy mark: CONFIRMED (+), a stronger mechanism, and one change (MERGE).** The busy state is not free.
- **Mechanism:** the 9 title rects and the 9 busy-mark rects animate `fill`, which the compositor does not drive.
- **Measured** (`el-busy.json`, Electron, playing, busy up vs down): +19 running animations, +1 style recalc (19 elements),
  **+3 paints (0.42 ms) and +1 raster per frame**, task 1.03 → 1.66 ms/frame.
- **Consequence:** the false positive adds per-frame main-thread paint exactly in the GPU-bound scenes where it fires
  86 % of the time.

**FB open question 6 + AUDIT-C FC5 · MERGE.** Guarding the modulation window's `paint()` writes is one change in
modwindow.js. B measured 1.36–1.46 ms per paint in Firefox; my list of the never-changing writes is in FC5. Lane C or B
owns it; the neutrality check is the mutation count plus the modwindow browser suites.

**F §3 "the modulation window's drop is compositor"** and **"every window ≈ −12 fps is compositor": CONFIRMED** by FC2:
+9 backdrop layers cost 2.4 ms (Chromium) and ≈4.9 ms (Gecko); off-screen cards cost 0.

**FE11(b) · the modwindow grip's `place()` per pointermove: CONFIRMED.** It interleaves style writes with ~10 rect reads
on every event. Coalescing per frame with a flush on release is neutral (the final position is the release's).

## 2. Ranking — top 10 across all six audits (measured gain ÷ risk)

1. **FD2 = F1**: `ladder.set` without the synchronous solve on restore. −0.42…−1.4 s per project or link open; proven neutral; S.
2. **FA2**: bit-identical kernel trims. Gas ×2.5, box ×2.2, 91 hydrogen modes −24 %; digest-locked; S.
3. **FD1**: start adapter + device from `<head>`. −363 ms cold headed Firefox, −71 ms warm; digest identical; S.
4. **FB1 = F11**: `gas.stats` factored. 9–17 ms spikes → 0.35 ms (3e-15 relative); S.
5. **FA3**: specialised render pipelines. Present −50 % on cloud, bit-exact on the default; M.
6. **F2**: the CAPTURE hover asks the period worker. −0.46…−1.0 s per hover on the BOX; S–M.
7. **FA1**: the tabulated gas radial. 128³ reconstruct 112.6 → 8.1 ms; M; needs the law-1 acceptance (≤ 1 level on ≤ 0.02 % of pixels).
8. **FB2 = F5**: fix the `perf.median` ring. It is the measuring stick every later claim needs; S, nil risk.
9. **Bug fixes, S each:** FD3 = F6 (the L6 guard) · F8 (export drops a REBUILD) · F16 (a failed restore marked clean) ·
   FD4 (ABOUT size lost) · FE1 (menubar rows broken).
10. **Neutral modulation-window trims, S:** FB3 (the 1 Hz closed repaint) + FC5/B-Q6 (paint write guards) + FE3 (double
   rebuild on open, −15–28 ms per open) + FE2/FD5(a) with D's placement.

## 3. Missing (found by nobody else)

- **Glitch:** the rack's hide/show fade strips the frost from every card for 280 ms. The ancestor opacity makes a backdrop
  root (lab.css:22, 531; `probes/C/br-rack-opacity-099.png`).
- **iPad hitch:** `tablet-motion` flips at every camera-drag start and end, not only play/pause. Each flip is a full-rack
  restyle (6–11 ms) plus a repaint (mir/css/skin.css:234; rack.js:1185–1188).
- **Lane E data file:** the `strong` array in `css-orphans.json` carries the 3 false positives (above).
- **Lane E second tier:** 5 of its 10 selectors are live (above). Nobody had run the check E asked for.
- **Bench profile leak:** the Electron bench profile carried localStorage between runs (FC1). It is fixed now, but every
  Chromium number taken before the fix was measured on leftover settings plus the warning pane.

## 4. Not now

- **Look changes for Josh:** FC3 / J1–J8 (frost OFF without the head colour-matrix, STILL as the default, un-frosted
  chips); FA6 (the first-visit pairing); FA8 (GLASS's gradient); FA4(b/c) (governor policy); FB4 = F10 (probe back-off);
  FB8 (reader stagger).
- **Refactors and kit changes:** FE10 folding and the rack.js seams, window by window, behind the browser gate; FE8
  (`seatLook`); FD8(b) (the MIR shell migration); kit-side dirty checks in `lab/mir/kit.js` (knob `k-val`, readout
  `className`), which are upstream and measured negligible.
- **Architecture:** L12 (lazy windows), L4 (energy-group volumes), the occupancy skip (after FA3).
