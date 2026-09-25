# AUDIT C · UI / CSS / COMPOSITING · the glass bill, priced · 2026-09-24 · Opus 5.5

**Headline.** The frost costs a roughly fixed amount of GPU time *per backdrop layer per frame*, because the live canvas
under every glass surface changes every frame. It is not charged per pixel or per blur radius. Measured on the RTX 3070
at DPR 1, in GPU-bound frames: about **0.45 ms per layer in WebRender** (Firefox) and about **0.2 ms per layer in
Chromium**. The shipped default has 18 layers (14 of them on screen), which adds up to **7.4 ms (Gecko) / 3.2 ms
(Chromium)** a frame; the whole interface costs **11.7 / 4.0 ms**.
**I found no change that keeps every pixel and lowers that bill.** Every pixel-neutral CSS lever I tested (off-screen
culling, `content-visibility`, `will-change`, `contain: paint`, hiding the empty overlay canvases) measured zero or worse:
both engines already cull what cannot be seen, and card contents are not re-rastered per frame. So nearly all the
available savings are **look decisions**. §4 prices each one for Josh, and FC3 is the cheapest and largest.
One measurement-hygiene bug turned up and is already fixed by the lead: FC1, the photosensitivity pane was up in every
Electron run.

## 1. What I read, what I ran

**Read whole:** BRIEF.md (with §8 and §9); `lab/lab.css`, `lab/skin.css`, `lab/mir/css/base.css`, `lab/mir/css/skin.css`,
`lab/mir/modulation/modhost.css` and `lab/mir/modulation/modwindow/modwindow.css` (the compositing properties in full, the
modwindow layout rules skimmed), `lab/index.html`, `lab/native-ui.js`, `lab/mir/kit.js` (knob / fader / readout / device),
`lab/modwindow.js` (paint, paintKnob, paintMinTrace, attr/aria, open/close, ResizeObserver, the API), `lab/keymap.js`
(panel lifecycle).
**Read in `lab/rack.js`:** 100–445 (accent, marks, turn CSS, settings, frost, disconnected), 700–760 (busy mark), 905–960
(corner axis, transitionrun), 1085–1380 (the loop's DOM touches), 3600–3830 (refreshOcclusion, float layer),
4337–4900 (notebook, peek, drags, phone/tablet), 5047–5054 (toggleUI), 5990–6080 (warning).
**History:** REPORT.md "2026-09-10 Senior review pass", "2026-09-11 Second optimisation pass", "Ink stays under glass";
CLAUDE-CODE-HANDOFF "iPad/Safari performance pass".

**Probes** (`research/optimization-2026-09-24/probes/C/`; I edited nothing in `lab/`; candidate CSS was injected as a
`<style id=labC>` at run time):

| probe | engine | what it measures | output |
|---|---|---|---|
| `inv.mjs` + `ff-dom.mjs` | headless FF | computed backdrop-filter inventory per body state (layers, on-screen and rack-visible area), running animations, DOM mutations per frame while playing | `ff-dom.json` |
| `el-layers.mjs` | Electron (Chromium 152, RTX) | CDP LayerTree: composited layers + compositing reasons; `Performance.getMetrics` style/layout per frame; a devtools.timeline trace of Paint / Raster / UpdateLayoutTree per frame | `el-layers.json` (clean re-run: fresh profile, pane dismissed) |
| `ff-headed-gpu.mjs` | **headed FF** (WebRender) | **GPU-bound** scene (style GLASS, 128³, 240 steps, 1920×995), interleaved A/B/A/B ×3, removing one thing at a time to price it | `ff-headed-gpu.json` |
| `el-gpu.mjs`, `el-gpu-cull.mjs` | Electron | the same GPU-bound interleaved pricing in Chromium; the off-screen cull | `el-gpu.json`, `el-gpu-cull.json` |
| `ff-headed-ab.mjs` | headed FF | the neutral candidates at 96³ (cap-bound; drifted under contention); the STILL/ALWAYS play-pause frame gaps | `ff-headed-ab.json` |
| `occl.mjs` | headless FF | rack.js `refreshOcclusion` replicated verbatim (clean vs forced layout); the `tablet-motion` / `frost-hold` class toggles with a forced style flush | `occl-ff.json` |
| `el-backdrop-root.mjs` | Electron | the frost under ancestor opacity (backdrop root), over a striped test backdrop | `br-*.png` |

**Measurement caveat.** Lanes A, B, D and F were driving the same GPU during my runs, and GPU utilisation read 100% for
long stretches. That is why every price comes from **interleaved A/B in GPU-bound frames**, each with an A/A row:
Chromium A/A = ±0.3 ms; Firefox A/A = one noisy row (±2.7 ms from a single outlier), and every other Firefox row agrees
across its 3 reps to within ~1 fps. Scenes limited by the 120 Hz cap drifted by up to 40 fps across a run, and I used
none of them for a price.

## 2. Findings, ranked (impact × confidence ÷ risk)

### FC1 · Every Electron baseline ran with the photosensitivity pane up: one extra full-screen blur over every scene (already fixed by the lead)
WHERE: rack.js 6040–6044 `needed()` (webdriver-gated); `tools/perf/electron-main.cjs` (Electron's shared profile).
MECHANISM: Electron is not a webdriver session, so `?warn=0` is ignored and `#warnPane` shows: 1920×1043,
`backdrop-filter: blur(12px) saturate(.6)`, a fill over the whole screen. Nobody pressed CONTINUE, so `warned` was never
saved. The Electron profile, however, did persist the rest of the settings between runs: my first run booted with
`disc:false`, left over from the bench.
EVIDENCE: the first `el-layers` run lists `div#warnPane 1920x1043 ActiveOpacityAnimation|BackdropFilter` in all 7 scenes,
UI-hidden included. The clean re-run has no such layer.
CHANGE: done by the lead (fresh `LW_PROFILE`, then `__LW.warning.dismiss()`). Every Electron probe here does the same.
NEUTRALITY / RISK: harness only. The old baseline-chromium numbers are pessimistic and must not be compared with the new ones.

### FC2 · The glass bill is charged per LAYER. The price list (for ranking every other finding and every Josh decision)
WHERE: `body.frost .dev, body.frost .glass` (mir/css/skin.css:222); skin.css:144 (refractive veil) and 141 (tinted
transport); disconnected head/body: mir/css/skin.css:251–265; modwindow: modhost.css 1223–1240 (chips, work bars) plus
`.glass` dressing.
INVENTORY (computed styles, 1920×1080, `ff-dom.json`; Chromium composited-layer counts from `el-layers.json` in the last
column):

| body state | backdrop layers | on-screen blurred area | Chromium layers |
|---|---|---|---|
| **shipped default**: disconnected · refractive · frost ALWAYS · light · 8 windows | **18** (8 heads blur+brightness+saturate, 6 bodies, 3 round rack chips, transport); 4 of the 18 (camera, clip) are entirely off-screen | 546 k px = **28.6 %** | 34 |
| connected · frost ALWAYS | 12 | 560 k px | 28 |
| disconnected · **frost OFF** | **8** (the heads' `brightness(1.03) saturate(1.03)`, see FC3) | 55 k px | 24 |
| connected · frost OFF | 0 | 0 | 16 |
| frost STILL, while playing | 0 (the heads too) | 0 | — |
| tinted · frost | 18 (same as refractive) | 546 k px | — |
| modulation window open | 27 (+ rail, 2 devices, 2 work bars, 4 chip `::before` discs) | 908 k px = 47.6 % | 48 |
| notebook open | 19 (+ 640×460 blur+saturate) | 841 k px = 44 % | — |
| every window open | 54, but 36 have zero on-screen area | 548 k px (same as default) | 52 |
| UI hidden | **0**; 10 rendered elements in total | 0 | 7 (4 drawing) |

PRICES (GPU ms per frame saved by removing the item; GPU-bound, interleaved ×3):

| item removed (a look change unless marked) | WebRender (FF headed) | Chromium (Electron) |
|---|---|---|
| the whole UI (UI hidden) | **11.7** (31.5 → 49.9 fps) | **4.0** (39.0 → 46.2) |
| every backdrop-filter (the whole frost bill, 18 layers) | **7.4** (33.6 → 44.7) | **3.2** (39.0 → 44.6) |
| the 8 disconnected heads' blur (bodies kept) | 3.6 | 1.5 |
| the 6 disconnected bodies' blur (heads kept) | 2.5 | — |
| the 3 round rack chips ◧ + ☆ (30 px each) | 1.6 | 0.7 |
| blur radius 22 → 8 | **0.0** (−0.15) | 0.8 |
| frost OFF: the 8 heads' colour-matrix (FC3) | **5.1** (36.9 → 45.4) | 0.3 |
| the modulation window's +9 layers | ≈ 4.9 (noisy) | 2.4 |
| two whole off-screen cards (neutral) | 0 | **0.00** |
| the 5 empty overlay canvases (neutral) | 0.25 (noise) | — |

READING: in WebRender the cost is flat per layer, independent of area and radius. A 30-px chip, a 272×34 head and a
272×1512 body each cost about 0.45 ms. Chromium charges about 0.2 ms per layer plus an area/radius share of roughly a
third. AREA × LAYERS on mobile: a tile-based GPU pays a render-pass break and a readback for every backdrop layer, and
the blur passes are bandwidth-bound. So the per-layer term grows and the area term grows with DPR² (×2.25 on the iPad
cap of 1.5, ×4 at DPR 2). Count matters everywhere; area matters more the smaller and hotter the GPU. Per-frame DOM
invalidation is a separate and much smaller axis (FC5).
CHANGE: none by itself. This table is the evidence for §4. NEUTRALITY: n/a. EFFORT: done.

### FC3 · "FROST OFF" is not backdrop-free in the shipped (disconnected) layout: 8 colour-matrix backdrop layers remain and cost 5.1 ms/frame in Gecko — **for Josh** (a 3 % look change), and the largest single saving in this lane
WHERE: `lab/mir/css/skin.css:251–253`, `body.disconnected:not(.phone) .dev > .dev-head { background: var(--glass-raise);
backdrop-filter: brightness(1.03) saturate(1.03) }`, which no frost class gates. Compare :264–265: under `frost-hold`
(STILL while playing) the same heads drop the filter entirely.
MECHANISM: every head carries a backdrop-filter in all frost states except STILL-while-playing. WebRender charges a
colour-matrix backdrop exactly like a blur, because the fixed cost is the backdrop readback, not the kernel. So OFF pays
8 layers for a 3 % lift of the field behind 34-px strips. The two states that are supposed to be glass-free also
disagree: OFF looks 3 % brighter on the heads than STILL-while-playing.
EVIDENCE: `ff-headed-gpu.json`, "frost OFF · disconnected: heads without the colour-matrix", 36.9 → 45.4 fps. That equals
the "no backdrop at all" 44.7 and nearly the UI-hidden 49.9. Chromium: 0.26 ms (`el-gpu.json`). BRIEF §9 headed
baseline: frost OFF refractive 113 fps (not the cap).
CHANGE (app-side, the kit stays untouched): in `lab/skin.css` add
`body.disconnected:not(.frost):not(.phone) .dev > .dev-head { -webkit-backdrop-filter: none; backdrop-filter: none; }`
so OFF matches frost-hold, or upstream the same gate to MIR.
NEUTRALITY: **not neutral.** The field behind the 8 head strips loses a ×1.03 brightness/saturation lift under OFF.
Josh decides. A blend-mode imitation is not bit-identical and needs the same readback, so it saves nothing (§4 trap 7).
GAIN: Gecko ≈ 5 ms/frame under OFF (at 96³: ~113 fps → the cap); Chromium 0.3 ms. RISK: none functional. Stylehash
would change on 8 elements, which is expected. EFFORT: S.

### FC4 · The UI-hidden path is already clean: nothing in the DOM paints, lays out or animates per frame — refuting "UI hidden isn't blazingly fast" on the DOM side
WHERE: lab.css:462–463, 525, 962 (the `ui-hidden` display:none list); rack.js 5047–5054 (toggleUI also turns FRAME/AXIS off).
EVIDENCE: `ff-dom.json`: UI hidden = 0 backdrop layers, **10 rendered elements**, 0 running animations, **1.7 mutation
records/frame over 178 frames**, all of them the once-per-play/pause `modView.sync()` of the closed window. Chromium
trace (`el-layers.json`): **0 paints, 0 rasters, 0 style recalcs, 0 layouts per frame**; 7 composited layers (root,
#lab, #field, and empty ones). At 96³, UI hidden reaches the display cap in both engines (FF 119, Chromium 113–116). In a
GPU-bound frame, hiding recovers the whole UI cost (FC2: 11.7 / 4.0 ms). What remains is the field itself: present
3.8 / 5.5 ms at 96/128, GLASS style 11 ms, axial gas 50–117 ms (lanes A and B).
CHANGE: none. NEUTRALITY: n/a. Say it plainly in the plan: hiding the UI cannot beat the display cap, and at 128³ gas the
kernel sets the rate.

### FC5 · Per-frame style invalidation is small everywhere; one cheap neutral trim in the modulation window's 30 Hz paint
WHERE: `lab/modwindow.js` paint() 2623–2760, the writes that are not dirty-checked: `transport.tempoNum/tempoHz/sync/cad
.textContent`, `transport.holds[*].setAttribute('aria-pressed')`, `foot.dead.textContent`, and `dev.bus`, `dev.envStage`,
`dev.minOut`, `dev.status.text` (words that change rarely). `attr()` at 1258 already guards the aria writes.
EVIDENCE (default windows, playing; `ff-dom.json`, `el-layers.json`):
- default: **11 mutation records/frame** (3.5 of them no-op attribute writes). Per frame: the one live spectrum phase
  needle (`--turn`, 1.04), its `k-val` text (1.04), its `aria-valuetext` (1.0), formula slots (0.6), transport readouts
  (~1). Chromium: **0.06 style recalcs, 0.11 paints, 0.06 rasters per frame (~0.03 ms)**. Each frosted card is its own
  composited layer (reason `BackdropFilter`), so a canvas frame does **not** re-raster card contents.
- modulation window open: **42 records/frame**. Chromium: **3.5 paints (0.52 ms) + 1.4 rasters (0.14 ms) per frame**,
  0.75 style recalcs, 0.39 layouts.
- every window open: 36.7 records/frame, led by `calculus .calc-row` childList at 6.25/frame (lane B). Chromium
  **scriptMs 4.9 ms/frame** against 0.46 at default (lane B: readers).
- Measured, not asserted: `modView.paint` is not called while the window is closed (rack.js:1344 checks
  `!uiHidden && modView.isOpen`).
CHANGE: wrap the constant writes in the file's existing guard idiom (`if (el.textContent !== s) el.textContent = s;`,
`attr(b, 'aria-pressed', …)`).
NEUTRALITY: identical strings, so the DOM is identical after every paint. Blink already skips identical text; Gecko
rebuilds the text node. Check: the mutation probe (records/frame with the window open should fall by ~10 per paint) and
`tests/current.browser-test.mjs` (modwindow sections).
GAIN: ≤ 0.3 ms/frame main thread with the window open, mostly in Firefox; ~0 elsewhere.
RISK: a guard on a field that the gates read back. `attr()` has the same shape and has shipped since the 09-11 pass.
EFFORT: S.

### FC6 · `body.tablet-motion` is a shipping look change on the iPad, and its own toggle re-styles and re-paints the whole rack at every motion edge — **for Josh**
WHERE: `lab/mir/css/skin.css:234`, `body.tablet-motion .dev * { box-shadow: none !important }`; rack.js 1185–1188
(on at play, drag, camera motion, levelling, modulation, rotation drive; off at the first still frame).
MECHANISM: the rule flattens every nested neumorphic shadow on iPad while anything moves. That is a deliberate pixel
change from the 09-09 iPad pass, and it is flagged here as such. Every flip re-matches `.dev *` (3 205 descendants) and
re-paints every card, because their shadows appear or vanish. On the iPad that happens at play, at pause, and at the
start and end of every camera drag, which is the exact moment a stutter is felt.
EVIDENCE (`occl-ff.json`, desktop Firefox, style flush only, excluding repaint): **6.4 ms** per toggle with 8 windows,
**11.2 ms** with 27. `frost-hold` toggle: 0.7–2.7 ms.
CHANGE (Josh chooses): (a) keep it; (b) remove it and let the full look stay while moving (pixels back to the desktop's);
(c) debounce: flatten only after motion has lasted over ~250 ms, restore after ~400 ms still. Options (b) and (c) change
what the iPad shows and when.
GAIN: removes a 6–11 ms restyle plus a full-rack repaint at every motion edge on the iPad. Must be measured on the device.
EFFORT: S.

### FC7 · The rack's slide fade strips the frost from every card for 280 ms (a glitch, not a cost) — lane F / Josh
WHERE: lab.css:18/22 and 531 (`body.rack-hidden #rack { transform…; opacity: 0 }` with a 0.28 s transition).
MECHANISM: an ancestor with opacity < 1 is a **backdrop root**, so the cards' backdrop-filter samples only the rack's own
(transparent) contents. The glass goes clear for the whole slide, on hide and on peek. A card's *own* opacity (`.dragging`
at .97) does not do this in Chromium.
EVIDENCE: `probes/C/br-normal.png` (frosted, striped test backdrop) vs `br-rack-opacity-099.png` (`#rack` at opacity .99:
the stripes show sharp through every card) vs `br-card-opacity-097.png` (frosted).
CHANGE: fade without ancestor opacity, e.g. slide plus visibility only, or animate each card. That is a motion change, so
Josh decides. NEUTRALITY: changes the transition frames only. EFFORT: S.

### FC8 · A play-start frame gap under frost ALWAYS in Gecko (a lead, low confidence) — lane F
EVIDENCE (`ff-headed-ab.json`, longest rAF gap in the first 12 frames after play, 3 samples each, GPU contended): ALWAYS
**41 / 53 / 21 ms**, STILL 12 / 16 / 10 ms; after pause 20 / 21 / 45 vs 21 / 16 / 16. The mechanism is unconfirmed:
suspects are WebRender rebuilding 18 backdrop render tasks after an idle cache, and `modView.sync()` of the closed window
at the LINKED edge (~30 DOM writes). Needs a quiet GPU and a Gecko profile.

## 3. Leads I refute (with evidence)

- **L10** ("`modView.paint(false)` runs at 60 Hz with the window closed"): the loop checks `modView.isOpen` (rack.js:1344).
  The closed or hidden window shows only once-per-play/pause writes (`ff-dom.json`, UI hidden and default rows).
- **L5** (`refreshOcclusion` as a frame-thread cost): **0.20 ms** per call (disconnected, 11 rects), 0.11 (connected),
  **0.54 ms** with 27 windows plus the modulation window; +30–40 % when it must flush layout. At ≤ 1 call per 300 ms that is
  ≤ 0.003 ms/frame amortised (`occl-ff.json`). Its body-class MutationObserver fires on class *changes* only.
- **"Hiding the UI should be blazingly fast, and isn't"**: on the DOM side it is (FC4). The remaining limits are the display
  cap and the field's GPU time.
- **"Backdrop cost scales with the blur radius / area"**: false in WebRender (22 → 8 px: 0.0 ms; a 30-px chip costs about
  what a 1512-px body costs). Only a third of Chromium's bill is area and radius (FC2).
- **"Clip the blur to the visible part of a scrolled rack" / cull off-screen glass**: both engines already do it. Two
  wholly off-screen cards cost **0.00 ms** in Chromium (`el-gpu-cull.json`) and 0 in Gecko. `content-visibility:auto` on
  every rack card with 27 windows open changed 49.1 → 49.2 fps.
- **"Promote / isolate layers so a canvas frame does not re-rasterise card contents"**: Chromium already composites every
  frosted card (reason `BackdropFilter`) and rasters 0.06 tiles/frame. In WebRender, `will-change: transform` on
  `#rack, #rackL, #transport` measured **slower** (62.2 → 51.3 fps, lower in each interleaved pair).
- **"Avoid the backdrop-filter on the transport when its pane is opaque"**: the pane is never opaque while frosted
  (refractive = .10 veil; tinted + frost thins to .58, mir/css/skin.css:227). The phone has an opaque pane but turns frost
  off (rack.js:4849).
- **"The notebook, menubar and keymap keep blur layers while hidden"**: all three hide through `[hidden]` =
  `display:none !important` (base.css:49), so there is no box and no layer. The same holds for `#graphTip` and the
  pickers; `#warnPane` goes `hidden` after its fade (rack.js:6012).
- **"Something animates while idle"**: at idle, only the boot's one-shot `lw-turn-*` palette turn (1.2 s) and in-flight
  `.k-val` linger transitions appear, and both end. `#busyMark`, `#title .mark.busy` and `.dev-loading .mark` breathe only
  while busy (`#busyMark` is `hidden` otherwise). `@keyframes km-pulse` exists and nothing uses it.
- **The FRAME option's DOM side**: `.corner-axis-hit` is a transparent 88-px button that exists only in corner-axis mode
  and is hidden under H. The `transitionrun` chain runs only for rack transitions in corner mode (500 ms of flag-setting).
  The loop's `dataset.mode` writes are guarded. No measurable DOM cost: headed FF lattice 89 vs off 87, Chromium 117 vs
  119. FRAME's cost is the GPU line pass (lane A).

## 4. Things I would NOT do, and why — plus the priced menu for Josh

**Traps (measured, or pixels would move):**
1. **Merging head and body into one backdrop layer** (a union clip-path on `.dev`): the blur samples across the 7-px gap
   (the radius is 22) and the blur edge treatment at each surface's own bounds changes, so pixels differ at the facing
   edges. The parent's clip would also cut head/body outer shadows.
2. **`content-visibility:auto` / IntersectionObserver culling of cards**: 0 gain (engines cull). It adds paint containment
   that clips DISCONNECTED head/body shadows, guessed scroll heights before first render, and gates that read off-screen
   internals would read nothing.
3. **`will-change` on racks, pill or needles**: slower in WebRender. On a live needle it also changes the AA of the rotated
   edge (not bit-identical), and saves ~0.03 ms of paint.
4. **`contain: paint` on disconnected surfaces**: no gain (52.0 → 48.7, noise), and it clips `.k-val` tooltips and focus
   rings that overflow a body.
5. **Hiding the 1×1 overlay canvases** (their boxes stay full-screen): neutral, but measured ~0 (WebRender 0.25 ms noise;
   in Chromium the empty tiles are skipped). Not worth a diff in lane B's files.
6. **Dropping blur from the near-opaque panes** (`#graphTip` .97, `.mod-pop` .98): 2–3 % of the blur is visible, so pixels
   change, and the panes are transient.
7. **A `color-dodge` fill imitating `brightness(1.03)`**: not bit-identical (an 8-bit dodge factor of 1.028/1.032), does not
   reproduce `saturate`, and needs the same backdrop readback, so it saves nothing.
8. **Editing `lab/mir/**`** (the kit's knob `paint()` rewrites `k-val` text every call; `readout.set` rewrites `className`):
   measured negligible per frame, and a kit change goes upstream.

**The menu for Josh (each is a look change; price = GPU ms/frame at DPR 1 on the RTX 3070, WebRender / Chromium, before
the mobile multiplier):**

| # | option | what changes on screen | saves |
|---|---|---|---|
| J1 | FROST OFF means no backdrop at all: the disconnected head's `brightness·saturate` follows the frost policy, as it already does under STILL (FC3) | the 8 head strips lose a ×1.03 lift under OFF | **5.1 / 0.3** |
| J2 | ship **STILL** as the default policy, or at least on Firefox and the iPad (glass while paused, clear while playing) | frost disappears while the field plays | **7.4 / 3.2** + 4.9 / 2.4 more with the modulation window open |
| J3 | disconnected heads keep their fill but lose their own blur (bodies keep theirs) | the head strips become tinted, not frosted | 3.6 / 1.5 |
| J4 | the three round rack chips ◧ + ☆ tinted instead of frosted | 3 small discs | 1.6 / 0.7 |
| J5 | the modulation window's 4 chip-rail discs tinted instead of frosted | 4 × 48-px discs | ≈ 1.8 / ≈ 0.8 (by the per-layer price) |
| J6 | `tablet-motion` (FC6): keep, remove, or debounce | iPad controls stay raised while moving, or flatten later | a 6–11 ms restyle + full repaint per motion edge (iPad) |
| J7 | consistency: `#menubar .mb-list` (skin.css:571), `#graphTip` (base.css:278), `.mod-pop` (lab.css:834) and `#notebook` (lab.css:43, "real blur" by design) blur even under FROST OFF | transient panes | ≈ 0.45 / 0.2 each while open |
| J8 | the rack slide without ancestor opacity (FC7) | the glass stays frosted during the 280 ms slide | 0 (fixes a glitch) |

On the phone none of J1–J5 matter by default: the phone crossing forces FROST OFF (rack.js:4849), and every disconnected
rule is `:not(.phone)`, so the phone rack carries **zero persistent backdrop layers**. The phone's cost is the field plus
the DOM layers (lanes A and B), unless the user switches frost back on.

## 5. Open questions for the cross-refutation round

1. **Retina and the iPad are unmeasured.** Both desktop monitors are 1920×1080, so a DSF-2 window at full layout size
   cannot exist here (the lead's DSF-2 run was 960 CSS px). Chromium's area share (~1 of its 3.2 ms) should scale ×4 at
   DPR 2; WebRender's per-layer cost should not. WebKit/CoreAnimation (the iPad) prices are unknown: measure on device
   (Safari Web Inspector → Layers + Timelines) before ranking J2–J6 for the iPad.
2. Lane A/B: the GPU-bound UI-hidden frame (49.9 fps WebRender, 46.2 Chromium at GLASS 128³) is the field's own
   ceiling. Is GLASS style's 11 ms at 96³ (BRIEF §7) the real limit Josh feels?
3. Lane B: Chromium `scriptMs` is **4.9 ms/frame** with every window open (0.46 at default), and `calculus` rewrites
   6 rows per frame. Which readers are they?
4. Lane F: the ALWAYS play-start gaps (FC8) and the rack-fade frost loss (FC7). Does an entering card
   (`.dev-enter` opacity keyframes, composited as an active animation) also lose its frost for 220 ms under DISCONNECTED?
5. Everyone: after FC1, recompute any Chromium number taken before the lead's fix. The BRIEF §8 "117 everywhere" figures
   include a full-screen blur.
