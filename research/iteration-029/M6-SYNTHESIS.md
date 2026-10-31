# 029 M6 — THE OPTIMIZATION SYNTHESIS (Opus, 2026-10-31; measured on Josh's screen, designed, no code under lab/)

Tree: yan-c `3179634e` (R merged), `0.9.9-alpha · Emission Spectra`. The instrument is `tools/perf/mod-profile.mjs`, extended
with `--lever` (one browser for a whole sweep; each lever is a FRESH FIRST-RUN PAGE, the origin's storage cleared, then the
scene, then the lever set through the page's own door, 20 s of CDP trace) and `--swiftshader` (the same, headless, on the
software GPU). The raw summaries are in `.tmp/it029/m6-sweep1.json`, `m6-sweep2.json`, `m6-sweep-b.json` and `m6-sws-*.json`
(not committed). Three headed Chromium windows appeared on Josh's screen, one at a time, each closed by pid: sweep 1
(19 runs, about 21 min), sweep 2 (10 runs, about 11 min) and scene b (2 runs). The SwiftShader runs were headless.
The commands (STAR = the mp3 read in place, never copied; the probe decodes s 36–66 into `.tmp`):
`nice -n 10 node tools/perf/mod-profile.mjs --chromium c --lever default,tinted,solid,blur0,frostoff,still,veil0,nodisc,uilite,uiflat,hidden,fc60,fc30,scale75,scale50,lock60,mod120,steps110,default --secs 20 --audio $STAR`
· `… --chromium c --lever default,still,still+nodisc,still+mod120,uilite+lock60,uiflat+lock60,swift,hidden+lock60,still,default --secs 20 --audio $STAR`
· `… --chromium b --lever default,still --secs 20` · `… --chromium c --swiftshader --lever <one> --secs 60 --audio $STAR`.

**The answer in five lines.**
1. **The stutter is the GPU process's main thread, and it is over budget by 4 %.** On the 120 Hz panel a frame has 8.33 ms.
   Chromium's GPU main thread spends **8.66 ms per frame** in scene c (four default runs: 8.65 · 8.71 · 8.64 · 8.65). It is
   busy 94 % of the wall clock, so frames queue and drop.
2. **5.6 ms of that is the interface's glass over a moving canvas.** With the interface hidden the same thread spends
   3.0 ms. The frost blur (backdrop-filter) alone is about 4.3 ms of the 5.6.
3. **THE EUREKA: FROST · STILL, an option the kit already ships** (MIR OPTIONS › FROST: OFF · STILL · ALWAYS). It holds the
   blur while the picture moves and gives the glass back at rest. In scene c it takes the GPU main thread from 8.66 to
   **4.33 ms per frame**. Present p95 goes **14.3 → 9.7 ms**, dropped frames **265 → 47 in 20 s** (−82 %) and fps 105 → 117.
   Three repeats agree (dropped 50 · 47 · 44, p95 9.7 · 9.7 · 9.6). The stage's pixels do not change, and neither does
   the look at rest.
4. **Every lever that saves about 1 ms "works" on the RTX, because the default sits just over a cliff**: TINTED, SOLID,
   DISCONNECTED off, AUTO SCALE 0.75, 110 steps. They leave the thread at 7.2–7.8 ms (no headroom), so one more open card
   flips them back. Only the blur levers (STILL · OFF · the kit's QUALITY BALANCED or LIGHT · SWIFT) leave 45–50 % headroom.
5. **The levers that do nothing on this machine**: the FIELD CLOCK cap (30 Hz or 60 Hz: identical to MAX), VEIL 0, and
   Layerize. STILL *raised* Layerize (2.2 → 2.7 s) and still cured the stutter: the main thread at 55 % is not the
   bottleneck. **On the software GPU the opposite holds.** The field's march is the whole frame: half the resolution makes
   frames 3.7× faster, and STILL changes nothing (§ 1b). The two machines need different levers, which is why the
   control in § 2 has two cheaper seats.

## 0 · THE EUREKA TEST

| | present p50 / p95 / p99 ms | dropped / 20 s | GPU main ms per frame | fps |
|---|---|---|---|---|
| default (FROST ALWAYS, 4 runs, mean) | 8.9 / **14.3** / 18.0 | **265** | **8.66** | 105.5 |
| **FROST · STILL** (3 runs, mean) | 8.3 / **9.7** / 10.8 | **47** | **4.33** | 116.6 |
| scene b, no audio, default (the floor: nothing is written) | 8.3 / 9.4 / 10.5 | 58 | 6.64 | 116.6 |
| the interface hidden (H) + PLAYBACK LOCK 60 (the steadiest run) | 16.8 / 17.3 / 17.6 at 60 Hz | 19 | 7.34 per compositor frame (8.8 s / 20 s) | 59.4 |

**The single lever: FROST · STILL → present p95 14.3 → 9.7 ms, dropped 265 → 47.** With it, the audio scene runs as
smoothly as the scene where nothing is written (b: p95 9.4, dropped 58). The best pair adds PLAYBACK LOCK 60 to a hidden
interface: a steady 60 (p99 17.6 ms, 19 dropped), at the price of half the rate. On the RTX, once the glass holds, no 60 Hz
cap is needed: 120 Hz is already steady (p99 10.6 ms).

**On the software GPU** (SwiftShader, headless, the integrated-GPU proxy, ratios only, 60 s windows): scene c presents
once every **15.1 s**, with the GPU main thread 80 % busy and the compositor thread 139 ms in 64 s. STILL presents every
15.4 s (no gain) and LOCK 60 every 14.5 s (a 20 s window; no gain: a 60 Hz grid means nothing when a frame takes 15 s). **Half the
resolution presents every 4.1 s: 3.7× faster for 4× fewer pixels.** There the eureka is the field's resolution while
playing. The governor already owns that lever, but it decides once per 6 presents, which at these rates is 90 s per step;
it had not moved in any run.

## 1 · THE TABLE (headed Chromium 156, RTX 3070 on Vulkan, DISPLAY :0 at 119.93 Hz, canvas 1865 × 868, scene c = WAVE DANCER + modulation armed + window open + AUDIO live on STAR's drop, 20 s each)

Columns: present = the field's present interval (the probe's `field.frame` stamps). Dropped = Chromium's `DroppedFrame`
events. GPU main = CrGpuMain busy (union of its events) in 20 s, then per DrawFrame. Main = the renderer main thread's busy
self time, split scripting · paint/composite · style/layout. Layerize = its share of paint/composite. In flight = the field's
queue depth p95 (PACE caps it at 4).

| lever (door) | fps | present p50 / p95 / p99 | > 17.5 ms | dropped | GPU main s (ms/frame) | Viz s | main s | script · paint · layout | Layerize s | in flight |
|---|---|---|---|---|---|---|---|---|---|---|
| **default, bracket 1 first** | 105.3 | 8.9 / 14.2 / 17.7 | 29 | 278 | 18.7 (8.65) | 7.5 | 11.3 | 5.0 · 3.8 · 2.2 | 2.21 | 3 |
| TINTED (`card`) | 115.7 | 8.3 / 10.2 / 14.4 | 16 | 70 | 18.2 (7.76) | 6.7 | 11.5 | 5.0 · 4.0 · 2.2 | 2.31 | 3 |
| SOLID (`card`) | 115.6 | 8.3 / 10.2 / 13.8 | 17 | 65 | 17.8 (7.56) | 6.0 | 11.6 | 4.9 · 4.2 · 2.2 | 2.63 | 3 |
| FROST, GLASS BLUR 0 (`blur`) | 116.2 | 8.3 / 9.8 / 12.0 | 9 | 61 | 14.8 (6.27) | 4.3 | 11.3 | 4.9 · 3.9 · 2.2 | 2.20 | 3 |
| FROST OFF (`frost`) | 117.2 | 8.3 / 9.7 / 10.6 | 7 | 44 | 12.7 (5.36) | 2.0 | 11.3 | 5.0 · 4.0 · 2.2 | 2.63 | 1 |
| **FROST · STILL** (`frost`) | 116.3 | 8.3 / 9.7 / 11.1 | 13 | 50 | **10.4 (4.41)** | 2.3 | 11.1 | 4.8 · 4.0 · 2.2 | 2.73 | 1 |
| VEIL 0 (`veil`) | 106.2 | 8.9 / 13.7 / 17.3 | 24 | 253 | 18.6 (8.61) | 7.5 | 10.8 | 4.7 · 3.7 · 2.1 | 2.13 | 3 |
| DISCONNECTED off (`disconnected`) | 116.6 | 8.3 / 9.8 / 11.3 | 9 | 56 | 17.4 (7.40) | 5.7 | 11.1 | 4.9 · 3.8 · 2.2 | 2.25 | 2 |
| kit QUALITY BALANCED (`quality` → `data-ui-tier=lite`) | 116.1 | 8.3 / 9.7 / 10.7 | 10 | 61 | **9.9 (4.22)** | 2.3 | 11.2 | 5.0 · 4.0 · 2.1 | 2.76 | 1 |
| kit QUALITY LIGHT (`quality` → `flat`) | 117.5 | 8.3 / 9.7 / 10.4 | 7 | 61 | 11.3 (4.79) | 2.2 | 11.1 | 4.9 · 4.0 · 2.1 | 2.80 | 1 |
| interface HIDDEN (action `hide`, H) | 116.3 | 8.3 / 9.3 / 10.0 | 9 | 65 | **7.1 (3.02)** | 1.6 | **4.3** | 3.5 · 0.3 · 0.4 | 0.01 | 1 |
| FIELD CLOCK cap 60 Hz (`fieldRate.capMs` 16; off the seg) | 107.3 | 8.8 / 14.2 / 17.8 | 31 | 238 | 18.6 (8.55) | 7.6 | 11.1 | 4.9 · 3.8 · 2.1 | 2.21 | 3 |
| FIELD CLOCK cap 30 Hz (the seg's 33 ms) | 105.2 | 8.9 / 14.2 / 17.9 | 34 | 277 | 18.6 (8.70) | 7.5 | 11.0 | 4.8 · 3.8 · 2.1 | 2.16 | 3 |
| AUTO SCALE off, scale 0.75 (canvas 1399 × 651) | 115.8 | 8.3 / 9.9 / 12.2 | 11 | 62 | 16.9 (7.18) | 8.2 | 11.6 | 5.1 · 3.9 · 2.3 | 2.22 | 2 |
| AUTO SCALE off, scale 0.5 (933 × 434) | 117.2 | 8.3 / 9.8 / 11.6 | 7 | 59 | 17.0 (7.19) | 8.1 | 11.9 | 5.3 · 4.0 · 2.3 | 2.25 | 2 |
| PLAYBACK LOCK 60 (the 60 Hz present door) | 58.8 | 16.7 / 17.8 / 19.2 | 116 | 590 ¹ | 10.9 (7.68 ²) | 4.8 | 10.0 | 4.3 · 3.5 · 2.0 | 2.07 | 1 |
| MODULATION 120 Hz (the seg) | 97.5 | 9.8 / 15.2 / 18.3 | 32 | **401** | 18.7 (9.27) | 7.1 | 12.8 | 5.2 · 4.8 · 2.5 | 3.00 | 3 |
| march steps 110 (`mat.steps`; WAVE DANCER's in force: 160) | 115.9 | 8.4 / 10.0 / 12.8 | 7 | 49 | 17.8 (7.50) | 8.2 | 11.5 | 5.0 · 4.0 · 2.3 | 2.23 | 2 |
| **default, bracket 1 last** | 106.1 | 8.9 / 14.0 / 17.8 | 30 | 258 | 18.8 (8.71) | 7.3 | 10.8 | 4.7 · 3.7 · 2.1 | 2.11 | 3 |
| **default, bracket 2 first** | 104.8 | 8.9 / 14.5 / 18.2 | 35 | 281 | 18.6 (8.64) | 7.8 | 11.3 | 5.0 · 3.9 · 2.2 | 2.27 | 3 |
| STILL (repeat 2) | 117.8 | 8.3 / 9.7 / 10.6 | 9 | 47 | 10.3 (4.34) | 2.4 | 11.0 | 4.6 · 4.0 · 2.2 | 2.74 | 1 |
| STILL + DISCONNECTED off | 117.2 | 8.3 / 9.6 / 10.5 | 10 | 61 | 11.2 (4.76) | 2.4 | 11.3 | 4.8 · 4.2 · 2.2 | 2.91 | 1 |
| STILL + MODULATION 120 | 117.2 | 8.3 / 9.3 / 10.4 | 9 | 62 | 11.2 (4.77) | 2.4 | 14.2 | 5.6 · 5.9 · 2.6 | 4.35 | 1 |
| QUALITY BALANCED + LOCK 60 | 59.1 | 16.7 / 17.6 / 18.4 | 86 | 300 ¹ | 7.0 (4.65 ²) | 1.4 | 10.1 | 4.1 · 3.9 · 2.0 | 2.74 | 1 |
| QUALITY LIGHT + LOCK 60 | 59.1 | 16.7 / 17.6 / 18.8 | 77 | 333 ¹ | 6.7 (4.62 ²) | 1.4 | 9.9 | 4.1 · 3.8 · 1.9 | 2.65 | 1 |
| SWIFT (the kit's theme: SOLID, flat, motion off, QUALITY LIGHT) | 117.3 | 8.3 / 9.5 / 10.5 | 6 | 65 | 9.7 (4.11) | 1.6 | 10.9 | 4.6 · 4.1 · 2.1 | 2.88 | 1 |
| HIDDEN + LOCK 60 | 59.4 | 16.8 / 17.3 / 17.6 | 18 | 19 | 8.8 (7.34 ²) | 0.9 | 3.3 | 2.7 · 0.3 · 0.2 | 0.01 | 1 |
| STILL (repeat 3) | 115.7 | 8.3 / 9.6 / 10.6 | 11 | 44 | 10.0 (4.23) | 2.4 | 11.0 | 4.7 · 4.0 · 2.2 | 2.72 | 1 |
| **default, bracket 2 last** | 105.8 | 8.8 / 14.4 / 18.3 | 46 | 242 | 18.8 (8.65) | 7.8 | 11.1 | 4.7 · 3.9 · 2.2 | 2.30 | 3 |
| scene b (no audio) default | 116.6 | 8.3 / 9.4 / 10.5 | 8 | 58 | 15.9 (6.64) | 7.6 | 7.0 | 3.9 · 1.8 · 0.9 | 0.79 | 2 |
| scene b STILL | 116.3 | 8.4 / 9.2 / 10.3 | 9 | 41 | 10.4 (4.38) | 2.2 | 6.1 | 3.6 · 1.6 · 0.9 | 0.94 | 1 |

¹ Under LOCK 60 the compositor still produces the interface at 120 Hz while the canvas changes at 60. With the interface
visible, Chromium books the gaps as dropped frames; with it hidden the count is 19. So the column measures the interface's
frames there, not the stage's. Read the present column instead: p99 18.4–19.2 ms at 60 Hz, with 5 frames over 34 ms (a
missed 60 Hz step), the same as the default's 6.
² Per compositor frame, which is 1,415–1,500 at LOCK 60, not per present. In 20 s: 10.9 s against 18.7 s.

**The brackets.** Bracket 1, first → last: dropped 278 → 258 (7 %), p95 14.2 → 14.0, GPU main 8.65 → 8.71 ms. Bracket 2:
dropped 281 → **242 (14 %, more than 10 %: both reported)**, p95 14.5 → 14.4, GPU main 8.64 → 8.65 ms. Frames over 17.5 ms
went 35 → **46 (31 %, both reported)**. The GPU-thread number, the one the argument rests on, moved by under 1 %.

**What the columns say.**
- **The GPU main thread is the number that decides it.** Every run at or above ~8.5 ms per frame drops 240–400 frames. Every
  run at or below ~7.8 ms drops 44–70.
- **The glass splits into its parts.** Blur off (OFF · STILL · BALANCED · LIGHT · SWIFT): −3.9 to −4.4 ms. Blur at 0 px with
  the refractive panes kept: −2.4 ms. A cheaper card with the blur kept (TINTED −0.9, SOLID −1.1) or fewer islands
  (DISCONNECTED off, −1.3): about −1 ms each. Hidden: −5.6 ms.
- **The field's share on the RTX is small.** Half the resolution saves 1.5 ms. 110 steps instead of 160 save 1.2 ms. The
  FIELD CLOCK cap saves nothing: it skips only the CPU reconstruct of ψ (`rack.js` `due`), never the march or the present.
  The governor never fired in any run (AUTO SCALE stayed at 1). It reads the **median** present interval (8.9 ms, under its
  11.1 ms threshold), and the stutter lives in the tail.
- **The modulation cadence costs on the GPU.** At 120 Hz, under FROST ALWAYS: +0.6 ms per frame and 401 dropped. Under
  STILL the same cadence is absorbed (62 dropped), though the main thread pays +3 s in 20 s.
- **The main thread is not where the stutter is.** Busy 10.8–11.9 s of 20 s (55 %) in every run but the hidden ones, stutter
  or no stutter.

### 1b · The software GPU (SwiftShader under Dawn, headless, 1920 × 937, ratios only)

`node tools/perf/mod-profile.mjs --chromium c --swiftshader --lever <one> --secs 60`, one headless browser per lever.

| lever | presents in 60 s | present p50 / p95 s | GPU main busy / wall s | Viz s | reading |
|---|---|---|---|---|---|
| default (FROST ALWAYS) | 5 | **15.13** / 15.79 | 51.2 / 64.1 | 0.14 | the field's march at 1920 × 937 |
| FROST · STILL | 5 | 15.39 / 16.58 | 52.2 / 63.3 | 0.14 | **no gain**: the glass is not the cost here |
| AUTO SCALE off, scale 0.5 (960 × 469) | 13 | **4.14** / 4.50 (p99 12.75: the first) | 59.2 / 63.2 | 0.34 | **3.7× faster**: the march is the frame |
| FIELD CLOCK cap 30 Hz | 5 | 14.68 / 15.31 | 56.9 / 63.3 | 0.17 | no gain: every frame is due at 0.07 fps |
| PLAYBACK LOCK 60 (20 s window) | 3 | 14.55 | 15.0 / 22.9 | 0.06 | no gain: a 60 Hz grid is moot at 15 s a frame |

The 20 s windows for STILL and hidden read 4.76 s and 4.65 s per present. Each was **one interval**, with the GPU busy only
6.5 s of 22.9 (28 %, unsaturated), so both are discarded. The 60 s STILL run (saturated, 5 presents) is the reading. The
software GPU is about 100× slower than any integrated GPU, so the only transferable number is the split: **field march
≈ the whole frame, glass ≈ 0**. A real iGPU sits between the two machines and pays both bills, the glass at its
compositor and the march at its shader cores.

## 2 · THE PERFORMANCE CONTROL — one honest setting

**Where it sits.** SETTINGS › FIELD QUALITY, the row of AUTO SCALE · GOVERNOR. The seg that holds that seat today is
"PERFORMANCE FULL | 120 Hz". It sets how often the CPU readers update (`perfMode`), so it gets a LABEL rename to **READERS**:
its key, ids and saved values do not change (the rename law). The new seg takes the word:

**PERFORMANCE · QUALITY | BALANCED | LIGHT**: a PREFERENCE, the settings blob's key `perfTier` (`'quality'` by default, absent
= quality). It is not a look key: the tier never writes `mir.gui`, so the user's look, its preset name (FROST stays FROST, not
CUSTOM) and MIR OPTIONS are untouched. `lambdawaves.q0.settings` is already a RECORDS row (PREFERENCE + WORKSPACE). The new
key is PREFERENCE, owned by `saveSettings`, and the generated STATE-SCOPES picks it up through `node tools/state-scopes.mjs`.
A project open never moves it (`settings-probe`).

| tier | the glass | the field's present | the modulation | the field's resolution | the look | RTX, scene c (measured lever) |
|---|---|---|---|---|---|---|
| **QUALITY** (default, shipped) | as the look says (FROST ALWAYS) | every refresh (120 Hz) | the MODULATION seg (60) | AUTO SCALE as today | the user's | p95 14.3 · dropped 265 · GPU 8.66 ms |
| **BALANCED** | **holds while the picture moves** (FROST behaves as STILL whatever FROST says; at rest the user's glass) | every refresh | the seg | as today | the user's | p95 9.7 · dropped 47 · GPU 4.33 ms (STILL ×3) |
| **LIGHT** | holds while moving (as BALANCED) | every refresh | the seg | **at most half while playing** (a ceiling of 0.5 on the canvas scale; the pause edge gives the full canvas back, as the governor's own edge does) | the user's | RTX: scale 0.5 −1.5 ms on top of the hold (lever measured alone). Software GPU: **3.7× faster frames** (15.1 → 4.1 s) |

**Why this bundle and no other.**
1. **The glass hold is the only lever that is both large and free of pixels on the stage.** −4.3 ms per frame on the RTX, and
   nothing on the canvas moves, so THE LOCK reads the same at every tier: the canvas is not touched. It changes the
   interface's pixels only while the picture moves, which is the user's choice when they pick BALANCED. At rest the look is
   exactly theirs. The kit's QUALITY BALANCED (lite) costs the same (4.22 ms) but changes the look at rest too (no blur ever,
   the tinted fill, one shadow). That is a LOOK, so it stays in MIR OPTIONS where the user chooses looks.
2. **The resolution ceiling is the one lever that scales on a weak GPU** (the march is the whole of SwiftShader's frame,
   § 1b). The governor already lowers the scale, but by the median and one step per 6 presents: 90 s per step at software
   rates, and never, on the RTX, for a tail stutter. LIGHT makes the ceiling the user's, at once, while playing only. It
   moves the field's pixels while the picture moves, which is the user's choice when they pick LIGHT. At rest the canvas is
   full, and THE LOCK digests still frames, so it reads the same.
3. **A 60 Hz present cap is not in the bundle.** Measured: on the RTX it buys headroom only (BALANCED is already steady at
   120; BALANCED + LOCK 60 took the GPU from 9.9 to 7.0 s in 20 s). On the software GPU it buys nothing (14.5 s a frame against
   15.1). Its one real case is a mid GPU that makes 70–110 Hz on a 120 Hz panel, where a steady 60 may feel better than a
   jittery 90. That GPU is not on this machine, and the door already exists: SETTINGS › PLAYBACK › CLOCK LOCKED · CADENCE 60.
   LOCK also locks time (a late frame slows ψ), and that is the honest trade for a user who wants it. A new WALL-time present
   grid would be machinery for an unmeasured case (Josh's dial).
4. **Left out on purpose:** the FIELD CLOCK cap (measured: nothing); VEIL (nothing); the march steps and a forced AUTO SCALE
   (−1.2 / −1.5 ms on the RTX, but they cost the field's pixels; the GRID seg and the governor already own them); a cheaper
   card (a look); the hidden interface (a gesture, H, § 3); the modulation cadence (the seg stays its own control; its title
   should say that 120 Hz costs GPU time under the frost).

**Kit or app.** Everything above is APP: the seg (`lab/windows/settings-card.js`), the key (`lab/shell/settings.js`
`saveSettings`/`applySettings`), the hold (`lab/look.js`: the frost row's `run` overridden in `createLook`'s schema map, the
way HOME_MAPS overrides `map` today, holding when `v === 'still' || ctx.hold`), and the ceiling (`lab/rack.js` `loop`'s one
`field.resize(…)` argument, `Math.min(…, 0.5)` while playing under LIGHT). One **FOR-MIR line, not a door now**: *"the frost row's hold on a context flag (`c.hold`), so any
app can hold the glass on its own motion signal without writing FROST · STILL into the store; λWAVES measured −4.3 ms/frame
of GPU main thread at 120 Hz (029 M6)"*. A second line for 1.6: *"QUALITY BALANCED as 'hold while moving' would keep a
theme's glass at rest for the same cost as lite (4.22 vs 4.33 ms measured)"*. That is a change to an existing enum's meaning,
so it is a line, never a door.

**What METERS says when a tier is on.** The GOVERNOR readout (`ui.govRo`, `rack.js` `statusLine`'s neighbour) states the
tier in its word, as it states PLAYBACK LOCK today: `BALANCED · glass holds while playing`, or `LIGHT · glass holds · canvas ≤ 50 %
while playing`. The sub-line keeps its budget and scale. RENDER SCALE stays as it is. Nothing is added to `__LW` (the facade's names
are gated). A probe reads the tier from the settings blob and `body.frost-hold`.

## 3 · THE HIDDEN-UI ROAD

**What H already gives** (the action `hide`; the stage alone, the frame and axes with it): GPU main 3.0 ms per frame (−65 %),
main thread 4.3 s of 20 (−62 %), p95 9.3, dropped 65. Smoothness on the RTX is no better than BALANCED (9.7 / 47): the
remaining ~50 drops are the floor of the field's own present path (scene b drops 58 with nothing written). What it adds is
the main thread, which matters on a weak CPU and not on this one. With LOCK 60 it is the steadiest run measured (p99 17.6,
19 dropped).

**What "stage only while playing" would add:** BALANCED's glass saving (which it includes), the further −1.3 ms of the panes
themselves, and −6.8 s of main thread in 20 s. The cost: it hides the controls a player is touching while it plays (a knob
turned by hand, the modulation window watched), and it fights the reveal law (the H key, the pointer). **Not worth a mode
now.** H is one key. If Josh wants it later, it is a third member of LIGHT's bundle, gated on "no pointer for N s while playing",
and it is an app row.

## 4 · THE ROWS

Expected gains are from the numbers above (RTX, scene c, ms of GPU main thread per frame, budget 8.33).

| row | the change | side | expected on the RTX | the proof |
|---|---|---|---|---|
| **M7 · PERFORMANCE · BALANCED (the glass holds while the picture moves)** | the seg QUALITY · BALANCED · LIGHT in FIELD QUALITY (READERS the old seg's label); `perfTier` PREFERENCE in the settings blob; look.js holds the frost on `ctx.hold && ctx.moving`; the METERS word | APP (`settings-card.js`, `shell/settings.js`, `look.js`, the govRo line) | **8.66 → ≈ 4.3 ms per frame; p95 14.3 → ≈ 9.7; dropped 265 → ≈ 47 / 20 s** | probe `--chromium c --lever default,balanced,default` (a `balanced` lever through the seg's hook; must match STILL's row within its spread); THE LOCK 843 · 0 / 987 · 0 at QUALITY (no canvas change at all); `settings-probe`, `state-scopes --check`, `new-project --check` (NEW unchanged: QUALITY is the absent value); suites `official-defaults-palette`, `hide-reveal`, `frame-occlusion`, `window-switching`, `keyboard-window` (the seg's hint, `hints-census --check`) |
| **M8 · PERFORMANCE · LIGHT (BALANCED + the canvas at most half while playing)** | under LIGHT, while playing, the loop's `field.resize` takes `Math.min(scale, 0.5)`; the pause edge returns the full canvas (the governor's own edge, `rack.js` W125-2) | APP (`rack.js`, one argument; the seg's third id from M7) | RTX: ≈ −1.5 ms beyond BALANCED (scale 0.5 measured alone: 8.66 → 7.19). **Software GPU: frames 3.7× faster** (15.1 → 4.1 s, 60 s windows) | probe `--chromium c --lever balanced,light` and `--swiftshader --lever default,light --secs 60` (light against the scale50 row); THE LOCK at QUALITY and at LIGHT (still frames: the ceiling acts only while playing); `film-handover` and node `render-exact` (a film never takes the ceiling: it locks its own scale); `play-lock-probe` (LOCK holds the scale in force) |
| **M9 · the FIELD CLOCK cap's words** | its title and the FIELD QUALITY note say what it does: it caps how often ψ is reconstructed; the picture still presents every frame | APP (`settings-card.js:131`, words only) | 0 ms. The seg measured nothing (30 Hz and 60 Hz equal to MAX); the words stop promising a saving | `hints-census --check`, `keyboard-window` |
| *(Josh's call)* **BALANCED as the shipped default** | the absent `perfTier` reads BALANCED | APP (one default) | the eureka for every first run: p95 9.7 instead of 14.3 | the same as M7, plus `new-project --check` and a BUILD note line. It moves the interface's pixels while playing (not the stage's), and the glass is Josh's, so it is his call, never a builder's |

**Not worth a row, by name:** VEIL (no effect: 253 vs 265). The FIELD CLOCK cap as a performance lever (it is a ψ-cadence
lever: M9's words). A forced AUTO SCALE or fewer steps (−1.5 / −1.2 ms, but they cost the field's pixels; the governor and the
GRID seg own them). DISCONNECTED off, TINTED, SOLID (about −1 ms each, no headroom; looks). Main-thread compositing and
Layerize (not the stutter: STILL raised it and cured the stutter). "Stage only while playing" (§ 3). A governor that reads the
tail and steps QUALITY → BALANCED on its own: the governor never saw the 265 drops because it reads the median. A tail-reading
governor would be machinery, the user's seg is the honest road, and METERS saying the tier is enough (Josh's dial). A
WALL-time 60 Hz present grid (§ 2.3: no measured case; LOCK 60 is the door). A kit door now (the FOR-MIR lines in § 2
instead).

**The 60 Hz panel (an inference, not measured).** Most screens run at 60 Hz, where a frame has 16.7 ms. The default's 8.66 ms
fits twice over, so the RTX's FROST ALWAYS would not stutter there. The stutter is a 120 Hz-panel phenomenon on this card,
and a weaker GPU on a 60 Hz panel falls off the same cliff at about twice the work. BALANCED's 4.3 ms is the margin that
keeps both.

## 5 · WHAT COULD NOT BE MEASURED, AND WHY

- **A real integrated GPU** (Intel / AMD iGPU, Apple M-series, the iPad). None is on this machine. SwiftShader is a CPU
  rasteriser, about 100× slower than any iGPU, so its rows are ratios of the field's share, not frame times.
- **The split of the GPU main thread between Dawn's march and Skia's backdrop passes.** Chromium's timeline trace does not
  attribute CrGpuMain's work to a client. The split here is by lever: hidden − default, blur − default. No GPU timestamp
  queries or `nvidia-smi` utilisation series were captured.
- **A 60 Hz panel.** Josh's outputs are both 119.93 Hz; § 4's paragraph is inference.
- **A true 60 Hz present grid on WALL time.** No door exists. The nearest door, PLAYBACK LOCK 60, was measured and is
  reported as such (it also locks time). Nothing was emulated. The case that would justify a grid (a mid GPU making 70–110 Hz
  on a 120 Hz panel) is not on this machine.
- **Forcing the governor's `autoScale` to 0.75 / 0.5.** There is no door to hold it: the controller owns `quality.autoScale`
  and would move it back. The resolution lever was measured through AUTO SCALE off + `quality.scale` (the GRID seg's own
  pairing, the phone road's 0.75): canvas 1399 × 651 and 933 × 434.
- **The FIELD CLOCK cap at 60 Hz** is not on the seg (MAX · 30 · 15 · 5 Hz). It was set through `fieldRate.capMs = 16`.
- **Josh's own 002 WAVE DANCER** is not in the tree. The bundled demo stands in, as in M0 and M4.
- **Headed Firefox.** Not asked for this row; M0's headless-Firefox caveats stand.
- **The compositor's DroppedFrame meaning under LOCK 60** (¹ above) is inferred from the hidden + LOCK 60 run, not read from
  Chromium's source.
