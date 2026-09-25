# WEBKIT-FPS-RESEARCH — high, steady frame rates for λWAVES on iPad Safari

Research only, 2026-09-25 (Opus 5.5 research agent). No app code was run or edited. Every claim below carries a URL.
**UNVERIFIED** means I could not confirm it from a primary source. **INFERENCE** means I reasoned it from primary material and nobody states it outright.
"WebKit main" means the WebKit source tree as of 2026-09-25. Main may be ahead of the Safari that ships in iPadOS 26. I say whether a shipping build carries a change only where a source dates it.

Architecture under study: a compute pass that writes a 64³/96³/128³ `rgba16float` volume every frame. Then one full-screen fragment ray-march (110–240 steps, one 3D sample per step, early exit) at DPR ≤ 1.5 on tablets. The loop is driven by `requestAnimationFrame`. Over the canvas sit 18–27 `backdrop-filter: blur(22px)` panels. Target device: M5 iPad Pro on iPadOS 26 Safari.

---

## 1. WebKit / Safari specifics

### 1.1 By default, Safari's rAF runs at about 60 Hz on a ProMotion iPad, not 120 Hz
- WebKit preference `PreferPageRenderingUpdatesNear60FPSEnabled`: its description reads "Prefer page rendering updates near 60 frames per second rather than using the display's refresh rate". The value is `defaultValue: default: true` (false only on visionOS). Source: https://github.com/WebKit/WebKit/blob/main/Source/WTF/Scripts/Preferences/UnifiedWebPreferences.yaml
- When the flag is on, WebKit maps a 120 Hz display to the divisor nearest 60, which is 60 (`framesPerSecondNearestFullSpeed`). Source: https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/graphics/AnimationFrameRate.cpp
- WebKit's explainer gives the reason: "On Apple's 120Hz devices, accelerated animations already run at 120Hz … whereas the rest of the Web page only updates at 60Hz. This … includes script-driven animations using requestAnimationFrame()". The cause was "a significant increase in power usage" plus pages that broke at non-60 Hz. Source: https://github.com/WebKit/explainers/tree/main/animation-frame-rate
- The user can remove the cap: Settings → Apps → Safari → Advanced → Feature Flags → turn "Prefer Page Rendering Updates near 60fps" off. MacRumors, 2026-05-05: https://www.macrumors.com/how-to/enable-smoother-120hz-browsing-in-safari/ . Same finding at iDownloadBlog, 2026-05-04: https://www.idownloadblog.com/2026/05/04/120fps-browsing-safari/ and Birchtree, 2025-12-26, Safari 26.3: https://birchtree.me/blog/how-to-enable-120hz-mode-in-safari-mac-iphone-and-ipad/
- WebKit bug 272165 (2024) is titled "120Hz requestAnimationFrame is not supported on iPhone Pros, it is supported on iPad Pros". That means iPad Pro honours the flag once it is off. Status: RESOLVED FIXED, 278949@main. https://bugs.webkit.org/show_bug.cgi?id=272165
- Bug 272226: until the iOS 26 fix, Home-Screen web apps ignored the flag. Comment 10 says "fixed for iOS and iPadOS, but NOT macOS". https://bugs.webkit.org/show_bug.cgi?id=272226
- Consequence: **120 Hz on stock Safari is a user setting, not something the app can do.** No public API raises the cap. The explainer's `frameRate` proposal has not shipped (same explainer URL).
- Anecdote: an unrelated project's iPad rig sometimes reads an 8 ms beat instead of 17 ms, "the cause is unknown". https://github.com/KyleMit/Splotch/issues/2224 . Measure the beat on the device; do not assume it.

### 1.2 Other caps on the rAF rate
| Cap | What happens | Source |
|---|---|---|
| **Low Power Mode** | WebKit halves the page rate. `halfSpeedThrottlingReasons = {LowPowerMode, NonInteractedCrossOriginFrame, VisuallyIdle, AggressiveThermalMitigation}`, so 60 becomes 30 fps. The OS also drops the display: "the system disables faster refresh rates in low power mode or if a device gets hot" | https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/graphics/AnimationFrameRate.cpp · https://bugs.webkit.org/show_bug.cgi?id=168837 (2017, "Throttle requestAnimationFrame to 30fps in low power mode") · https://developer.apple.com/documentation/quartzcore/optimizing-iphone-and-ipad-apps-to-support-promotion-displays |
| **Accessibility → Motion → Limit Frame Rate** | "set[s] the maximum frame rate to 60 frames per second". This has no extra effect while the 60 fps flag is still on. | https://www.howtogeek.com/765524/how-to-limit-promotion-displays-to-60hz-on-iphone-and-ipad/ (2021). I could not read Apple's own support page because it is rendered client-side, so Apple's wording is **UNVERIFIED**. |
| **Heat** | WebKit watches `NSProcessInfoThermalStateSerious` and up. The *halving*, though, is gated on the internal preference `RespondToThermalPressureAggressively`, which defaults to `false`. Separately, the OS "may respond by reducing the frame rate" when hot. | https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/cocoa/ThermalMitigationNotifier.mm · https://github.com/WebKit/WebKit/blob/main/Source/WebCore/page/Page.cpp · the Apple ProMotion document above |
| Page off-screen or tab in background | `OutsideViewport` yields no frames at all (the interval becomes 10 s). A cross-origin iframe runs at half rate until the user touches it. | AnimationFrameRate.cpp above · https://motion.dev/blog/when-browsers-throttle-requestanimationframe |
| Low Power Mode detection | There is no web API for it, and `prefers-reduced-transparency` is **not** supported in Safari (`version_added: false`, webkit.org/b/175497). | https://github.com/mdn/browser-compat-data/blob/main/css/at-rules/media.json |

### 1.3 WebKit's WebGPU frame pacer: new, with a live regression
- Commit **318799@main**, 2026-08-07: "Performance seems slower with attached shader in Safari" (bug 320866). The message describes the older behaviour: a canvas whose GPU work misses one vsync "kept requesting presentation at 60Hz, so frames backed up and were displayed unevenly, making the animation look choppy". The new pacer "picks the highest sustainable rate", and the page's rendering rate "is clamped to the slowest requesting canvas". https://github.com/WebKit/WebKit/commit/186929fd21 · https://commits.webkit.org/318799@main
- The pacer's constants in `WebGPUFramePacer.cpp`:
  - 16-frame window, 8 warm-up frames, rate chosen from the 90th percentile.
  - It steps down after 4 overloaded frames.
  - It steps **up one rung only after 30 consecutive headroom frames**.
  - The rungs are the divisors of the display rate: 120 → 60/40/30/24/20…, or 60 → 30/20/15…
  - Idle reset after 350 ms.
  - Source: https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/graphics/WebGPUFramePacer.cpp
- **Bug 325095** (reported 2026-09-23, NEW): "WebGPU frame rate permanently drops to integer divisions of refresh rate after a few slow frames". Eight 80 ms frames lock the page at about 12 fps. The listed causes include "all-time maximums" and timing by "kernel scheduling time rather than actual GPU execution time". The fix, PR 74865, was still open on 2026-09-24. https://bugs.webkit.org/show_bug.cgi?id=325095 · https://github.com/WebKit/WebKit/pull/74865
- Is the pacer in iPadOS 26 Safari? **UNVERIFIED, and unlikely**, since it landed on main in August 2026. Safari 27.0 shipped on 2026-09-17 (https://webkit.org/blog/18325/webkit-features-for-safari-27-0/), but its notes do not mention the pacer. It matters in two ways:
  - (a) Without the pacer, iPadOS 26 has the old behaviour: frames that overrun get presented unevenly, which looks like severe lag even when the average fps looks acceptable.
  - (b) With the pacer, the climb back is slow. Recovering 30→60 needs 30 frames at 30 fps, which is 1.0 s. That matches the owner's "~1 s of very low fps" after hiding the UI (INFERENCE from the constants).

### 1.4 In Safari 26, pipeline creation stalls rendering
- Bug **324043**, reported 2026-09-12 against Safari 26: async pipeline creation "blocked existing rendering during compilation". For render pipelines, "substantial compilation work also remains after the async promises resolve, causing another stall on first use". Fixed on main 2026-09-13/14 (PR 73881, which moved to `newLibraryWithSource:…completionHandler:`). The fix is not in shipping iPadOS 26. https://bugs.webkit.org/show_bug.cgi?id=324043 · https://github.com/WebKit/WebKit/pull/73881
- For λWAVES: any pipeline that is built or first *used* when a window or UI toggle opens will stall the frame on Safari 26. Warm every variant at boot with one real dispatch or draw.

### 1.5 Optional features Safari exposes
- **shader-f16: yes, on every Apple GPU.** WebKit appends `WGPUFeatureName_ShaderF16` without conditions (https://github.com/WebKit/WebKit/blob/main/Source/WebGPU/WebGPU/HardwareCapabilities.mm). WWDC25 session 236: f16 values "really help cut down on memory use and boost performance" (https://developer.apple.com/videos/play/wwdc2025/236/). web3dsurvey shows Safari 100% and iOS 100% (https://web3dsurvey.com/webgpu/features/shader-f16).
- **timestamp-query: exposed only if Metal supports `MTLCounterSamplingPointAtStageBoundary`**, which means pass-boundary timestamps (same HardwareCapabilities.mm).
  - History: in May 2024 WebKit removed it as "not so useful on Apple Silicon" (https://www.mail-archive.com/webkit-changes@lists.webkit.org/msg214152.html).
  - In February 2025 an Apple engineer on bug 288076 said it "Works on latest iOS beta" (https://bugs.webkit.org/show_bug.cgi?id=288076).
  - web3dsurvey lists iOS at 100% (https://web3dsurvey.com/webgpu/features/timestamp-query).
  - Treat it as *likely present*: check `adapter.features.has('timestamp-query')` on the iPad.
  - Chrome quantizes timestamps to 100 µs (https://developer.chrome.com/blog/new-in-webgpu-120). WebKit's quantization is **UNVERIFIED**.
- WebKit main also advertises `texture-formats-tier1` and `tier2` on ARM64 (HardwareCapabilities.mm). Tier 1 adds write-only storage for `rg16float` and `r16float` (https://gpuweb.github.io/gpuweb/#texture-formats-tier1). Whether iPadOS 26 has it is **UNVERIFIED**.

### 1.6 Canvas format and alpha mode (already right in λWAVES)
- `getPreferredCanvasFormat()` in WebKit is `return GPUTextureFormat::Bgra8unorm;` on every Apple platform. https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/WebGPU/GPU.cpp
- `alphaMode: 'opaque'` calls `setOpaque(true)` on the canvas layer (https://github.com/WebKit/WebKit/blob/main/Source/WebCore/html/canvas/GPUCanvasContextCocoa.mm). Apple's `CALayer.isOpaque` docs: "Core Animation omits the alpha channel … Doing so can improve the performance of compositing operations." https://developer.apple.com/documentation/quartzcore/calayer/isopaque
- λWAVES already uses the preferred format and `'opaque'`: `lab/field.js:744,763`. Nothing to gain here.
- Traps to avoid:
  - An `rgba16float` canvas with standard tone mapping makes WebKit run an extra **luminanceClamp compute kernel** per present. It also compiles that kernel at configure time.
  - Every reconfigure or resize reallocates the IOSurfaces and copies the old frame across.
  - Source: https://github.com/WebKit/WebKit/blob/main/Source/WebGPU/WebGPU/PresentationContextIOSurface.mm
  - So dynamic resolution should render into an internal target, not resize the canvas. λWAVES resizes the canvas on scale change (`lab/field.js:1585`).
- CSS effects over WebGPU canvases: **no WebKit bug or post found** that is specifically about a WebGPU canvas under `backdrop-filter`, `opacity` or `transform`. This is a negative result.

### 1.7 Apple's TBDR guidance, in Apple's words
- WWDC25-236 (WebGPU): "Command buffer boundaries require synchronization between high-speed on-chip memory and unified on-device memory … use a single command buffer per update loop". Passes "still consume substantial memory bandwidth … use as few as possible". https://developer.apple.com/videos/play/wwdc2025/236/
- WWDC20-10602: "If you don't need any data, don't load anything and clear instead … only store the data that you need". Memoryless targets remove the backing entirely. https://developer.apple.com/videos/play/wwdc2020/10602/
- WWDC20-10632: "the clear load action only operates on tile memory". "Apple GPUs are optimized for 16-bit data types … less registers leading to an increase in shader core occupancy … 16-bit data types use faster arithmetic instructions". https://developer.apple.com/videos/play/wwdc2020/10632/
- WWDC16-606: texture reads "typically take a couple hundred cycles"; "data type conversions are typically free, even between float and half"; "use half for texture reads and interpolates". https://asciiwwdc.com/2016/sessions/606
- For λWAVES, a single-pass ray-march already has the minimum pass count. The TBDR guidance mostly confirms that the cost is fragment ALU plus texture latency plus occupancy, not render-target bandwidth.

## 2. The cost of `backdrop-filter` on iOS/WebKit

**How WebKit implements it.** Each element with `backdrop-filter` gets its own `CABackdropLayer`, and `blur(r)` becomes `kCAFilterGaussianBlur` with `inputRadius = stdDeviation`. Sources: https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/graphics/ca/cocoa/PlatformCALayerCocoa.mm · https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/graphics/ca/cocoa/PlatformCAFiltersCocoa.mm · the original 2014 changeset, "a new m_backdropLayer CALayer that will sit behind the contents layer": https://trac.webkit.org/changeset/175672/webkit
- I found no `groupName` in WebKit, so each panel gets its own capture; nothing is shared (INFERENCE from that absence).
- WebKit caps the page's **total backdrop area**: `cMaxTotalBackdropFilterArea = 1242 * 2208 * 10`, commented "About 10 screens of an iPhone 6 Plus". Past the cap, further panels silently lose their blur. https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/graphics/ca/GraphicsLayerCA.cpp

**Where the work runs.** The blur runs in the render server, on the **same GPU** as WebGPU.
- Apple: the render server "On the GPU … executes the actual rendering". A render hitch is when "the work on the render server doesn't" finish in time. At 120 Hz each stage has 8.3 ms. https://developer.apple.com/documentation/xcode/understanding-hitches-in-your-app
- Visual effects "must copy what's beneath the visual effect view to another texture with an offscreen pass … and copies it back" (Tech Talk 10857, 2021). https://developer.apple.com/videos/play/tech-talks/10857/

**Is it redone every frame?** Apple never says so for `CABackdropLayer` directly. It follows from that mechanism: the backdrop is copied from "what's beneath" when the frame is rendered. A canvas that changes every frame therefore invalidates every panel above it every frame (INFERENCE). A 2026 Android-Chrome measurement on a similar setup agrees:
- Seven `blur(18px)` panels over WebGL cost **3.5 ms/frame** of GPU-process time (8.2 ms against 4.7 ms).
- The share of frames meeting 90 Hz went from 75–80% to 98.9% once the blur was removed.
- Anecdotal and not iPad, but the same architecture: https://github.com/Station-Sciences/bot-crossing/issues/74

**Area versus layer count.** Apple's numbers are old but show both effects.
- WWDC14-419: a full-screen blur is a multi-pass effect: capture, downscale, horizontal blur, vertical blur, upscale and tint.
  - iPad Air: about **14.5 ms**, leaving "about 2ms for UI".
  - iPad (3rd generation): 18.15 ms, so Apple *disabled* the blur on that device.
  - Each pass gap costs "0.1 to 0.2ms", about 0.4–0.8 ms per effect.
  - Advice: "keep the bounds of the view as small as possible".
  - Source: https://asciiwwdc.com/2014/sessions/419
- Apple on Liquid Glass (2025): with `GlassEffectContainer`, "SwiftUI renders the effects together, improving rendering performance". So each separate effect carries overhead that merging removes. https://developer.apple.com/documentation/swiftui/glasseffectcontainer
- Net: **area × radius** drives the blur passes, and **count** adds a fixed cost per layer (pass gaps, captures). **No public WebKit number splits the two for iPad. UNVERIFIED.**
- WebKit itself warned in 2015 that "the nature of this backdrop effect forces the engine to perform more rendering passes, which will have an impact on performance". https://webkit.org/blog/3632/introducing-backdrop-filters/ . web.dev adds: "`backdrop-filter` may harm performance. Test it before deploying." https://web.dev/articles/backdrop-filter

**Standard mitigations, with how good the evidence is:**
- Fewer panels, or merge panels into one surface per window (Apple's GlassEffectContainer principle).
- Smaller blurred area (Apple 2014 and 2021).
- Smaller radius. The claim that cost scales with radius is third-party only; nobody measured it on WebKit (**UNVERIFIED**).
- Remove `will-change: backdrop-filter`. The only evidence is anecdotal: "severe frame rate drops on iOS WebKit devices due to excessive layer allocation" (https://github.com/guitarbeat/personal-website/pull/1072).
- Hide the glass while playing.
- `-webkit-` prefix: needed only before Safari 18, and it brings no speed benefit (no source shows one).
- `isolation`: **no source found** that it helps performance. In the Filter Effects 2 spec, isolation and backdrop roots change *what is blurred*, so it would change pixels.
- Hidden panels: WebKit hides the backdrop layer when the element's contents are not visible (`backdropLayer->setHidden(!m_contentsVisible)`, GraphicsLayerCA.cpp). Whether `opacity:0` removes the cost as `display:none` does is **UNVERIFIED**, so measure both.

## 3. WebGPU performance practice that applies to this app
- **CPU-side advice barely applies.** webgpufundamentals' gains ("40% faster" JS with one big uniform buffer, "2x" with mapped buffers) are CPU-bound many-object cases (https://webgpufundamentals.org/webgpu/lessons/webgpu-optimization.html). toji's series covers uploads, bind groups and render bundles (https://toji.dev/webgpu-best-practices/). λWAVES issues about two passes a frame, so its cost is GPU fill: pixels × steps × (sample latency + ALU).
- **Will Usher's WebGPU raycaster** (https://github.com/Twinklebear/webgpu-volume-raycaster, `src/shaders.wgsl`, `src/volume.js`):
  - Volume stored as `r8unorm`.
  - Step `dt = 1/(256·|dir|)` per axis.
  - `textureSampleLevel(…, 0.0)` inside the loop.
  - Opacity correction `1 − (1−a)^dt_scale`.
  - Early exit at `color.a >= 0.95`.
  - It rasterizes a **cube proxy**, so only covered pixels run the loop.
  - His WebGL2 version: "The sampling rate is dynamically adjusted to maintain an interactive framerate across different devices (desktops, laptops, phones)" (https://www.willusher.io/webgl-volume-raycaster/). The same step and early-exit scheme is in his 2019 post, https://www.willusher.io/webgl/2019/01/13/volume-rendering-with-webgl/
  - He publishes **no Apple or iPad numbers**.
- **GPU Gems ch. 39:** "Empty-space skipping can efficiently balance the available geometry and fragment processing bandwidth". Also "rasterization pressure is reduced by making the viewport smaller, decreasing the sample rate", and "when using fewer slices, the opacity has to be scaled up". https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-39-volume-rendering-techniques
- **Temporal and reduced resolution (Horizon Zero Dawn clouds, SIGGRAPH 2015):**
  - "The approach that I have described so far costs around 20 milliseconds."
  - "Every frame we could use a quarter res buffer … to update 1 out of 16 pixels for each 4x4 pixel block".
  - "10x faster or more when we render this at half res and use filters to upscale it", reaching about 2 ms.
  - Sources: https://www.slideshare.net/slideshow/the-realtime-volumetric-cloudscapes-of-horizon-zero-dawn/51996465 · https://www.guerrilla-games.com/read/the-real-time-volumetric-cloudscapes-of-horizon-zero-dawn
- **f16 numbers:** Chrome saw "28% improvement in prefill speed and a 41% improvement in decoding speed" for an f16 LLM on M1 Pro (https://developer.chrome.com/blog/new-in-webgpu-120). That workload is ALU and bandwidth-bound ML, not a ray-march. **No public f16 ray-march number exists for Apple.**
- **3D sampling cost:** Arm's Mali guide says a trilinear RGBA8 3D access is about 4× a bilinear 2D access. I saw that only as a search snippet, the page did not render, and it is Mali, not Apple (https://developer.arm.com/documentation/101897/v2-2/Buffers-and-textures/Texture-sampling-performance). **Apple's 3D and 64-bit-texel filtering rates are UNVERIFIED.** Apple publishes no TMU rates.
- **Pipelines:** use `create*PipelineAsync` and warm each pipeline with one real use (§1.4).
- **No paper or post found** on volume rendering at 120 Hz on mobile or iPad. Negative result.

## 4. Comparable projects and iPad numbers
- **No public WebGPU-on-iPad-Pro benchmark with numbers found.** Searched three.js, Babylon.js, PlayCanvas, Figma, Google Earth and "WebGPU iPad benchmark". Apple says Babylon.js, Three.js, Unity and PlayCanvas "all work great in Safari 26.0" but gives no figures (https://webkit.org/blog/17333/webkit-features-in-safari-26-0/).
- I rejected one SEO claim, that Safari WebGPU reaches "92% of native Metal": its source also misdates WebGPU to Safari 18 (https://tech-insider.org/safari-vs-chrome-2026/).
- Hardware facts that bound the problem:
  - M5: 10-core GPU; "unified memory bandwidth of 153GB/s"; "up to 30 percent faster" graphics than M4. https://www.apple.com/newsroom/2025/10/apple-unleashes-m5-the-next-big-leap-in-ai-performance-for-apple-silicon/
  - iPad Pro 13″ (M5): "2752-by-2064 … ProMotion … 10Hz to 120Hz". https://support.apple.com/en-us/125407
  - RTX 3070: 448 GB/s (https://www.techspot.com/review/2124-geforce-rtx-3070/). That is about 2.9× the M5's bandwidth, and the desktop does not share its GPU with a blurring compositor.
- My arithmetic, not a measurement:
  - DPR 1.5 on the 13″ is 2064×1548 = **3.2 M px**.
  - 110 steps at 60 fps is **21 G samples/s** before early exit; 240 steps at 120 fps is **92 G samples/s**.
  - The 128³ `rgba16float` volume is 16.8 MB. Writing it at 60 fps is about 1 GB/s, under 1% of 153 GB/s, so **the compute write is not the problem; the ray-march fill is**.

## 5. Ranked levers for this architecture
Pixel key:
- **P0**: pixel-identical.
- **P1**: may differ within tolerance and needs a pixel diff.
- **P2**: visible change, needs Josh's approval.

Numbers are from the cited sources. Where no source gives a number, the row says "none published".

### 5a. User and device settings (the app cannot change these; the app can only detect them)
| # | Lever | Expected iPad effect | Pixels | Measure first |
|---|---|---|---|---|
| U1 | Safari feature flag "Prefer Page Rendering Updates near 60fps" **OFF** | The only way to get a 120 Hz rAF; otherwise the cap is 60 (§1.1) | P0 | Median rAF Δt with the flag on and off (≈16.7 vs 8.3 ms) |
| U2 | **Low Power Mode off**, battery above 20% or charging | LPM halves rAF (60→30) and caps the display at 60 (§1.2) | P0 | rAF Δt with LPM on and off; the app should note a sustained ≈33 ms beat |
| U3 | **Limit Frame Rate off** | Caps at 60 (§1.2) | P0 | Matters only after U1 |
| U4 | Temperature | The OS drops the refresh rate when hot (§1.2) | P0 | A 5-minute soak; rAF Δt over time |

### 5b. The glass is the cost (UI layer; the render server works on the same GPU)
| # | Lever | Expected effect | Pixels | Measure first |
|---|---|---|---|---|
| G1 | **A/B: `backdrop-filter:none` on every panel with the UI still shown** | Isolates the glass cost. The analogous Android case measured −3.5 ms/frame for 7 panels (§2) | P2 as a fix; P0 as a probe | GPU ms per frame and rAF Δt, glass on vs off, same scene |
| G2 | While **playing**, swap the live blur for the same tint without blur, or a frozen blur | Removes N offscreen passes per frame. None published for WebKit | P2 | G1 first |
| G3 | **Merge panels** into one backdrop surface per window; drop blur from panels nested over other glass | Fewer layers, so fewer fixed per-layer costs (Apple GlassEffectContainer; 2014: 0.4–0.8 ms of pass gaps per effect) | P1–P2, since edges re-blur | Count layers in the Web Inspector Layers tab (https://webkit.org/web-inspector/layers-tab/) |
| G4 | **Shrink blurred area**: blur only painted surfaces, never empty layout boxes | Area-driven cost (Apple 2014/2021) | P0 if the box region is fully transparent and unpainted, otherwise P2 | Sum of panel areas in device px |
| G5 | Blur radius 22 px → smaller | Radius scaling is third-party only (**UNVERIFIED** on WebKit) | P2 | Only after G1 shows glass matters |
| G6 | Remove any `will-change: backdrop-filter`; hide with `display:none`, not `opacity:0` | Anecdotal and UNVERIFIED respectively (§2) | P0 | A/B of the two hide methods on the "UI hidden" path |

### 5c. The app can do these (WebGPU side)
| # | Lever | Expected effect | Pixels | Measure first |
|---|---|---|---|---|
| A1 | **Pre-warm every pipeline and variant at boot** (create async, then one real draw or dispatch) | Removes Safari 26 compile stalls on UI toggles (§1.4). Candidate for the "~1 s low fps" | P0 | Frame-time trace across a UI toggle, before and after |
| A2 | **Fixed, even frame cadence.** If GPU ms exceeds the 16.7 ms budget, target 30 or 40 fps on purpose, or cut work. Never let frames back up. | Fixes the old WebKit "frames backed up and were displayed unevenly" judder (§1.3) | P0 (cadence) | GPU ms per frame via `timestamp-query` if exposed, else `onSubmittedWorkDone` latency |
| A3 | **Ray-march resolution below DPR 1.5**, into an internal target plus an upscale pass. Do not resize the canvas (§1.6). | Cost scales with pixels: DPR 1.5→1.0 is 2.25× fewer pixels. HZD: half-res plus filtered upscale gave "10x … or more" | P2 below the native scale; resize→internal target is P0 | GPU ms at scales 1.0/0.75/0.5 |
| A4 | **Empty-space skipping**: the compute pass writes a coarse max-density grid (e.g. 8³ or 16³ bricks); the ray skips empty bricks | GPU Gems 39. None published for this app | P0 if conservative (skip only bricks that contribute exactly zero) | Fraction of steps taken in empty space (count in the shader) |
| A5 | **Cheaper texel.** The march samples only `.rg` of the `rgba16float` volume (`lab/field.js:295,368,404`). If `.ba` are unused, `rg16float` halves bytes per texel (8→4 B). Needs `texture-formats-tier1` for the storage write (§1.5). | Less texture bandwidth and cache pressure. None published | P0 if `.ba` are unused; the fallback path keeps the current format | `adapter.features.has('texture-formats-tier1')` on the iPad; grep for `.ba` users |
| A6 | **`shader-f16` in the march** (accumulator, colour map, step maths) | Apple: fewer registers, higher occupancy, faster 16-bit ALU (§1.7). No ray-march number | P1 (f16 rounding) | Pixel diff plus GPU ms |
| A7 | **Step count and early-exit threshold** (e.g. exit at α≥0.95 as Usher does; adaptive dt) | Proportional to steps. None published | P1–P2 | Mean steps per pixel at exit |
| A8 | **Temporal reprojection or checkerboarding** (1 of 4 or 1 of 16 pixels a frame) | HZD: 20 ms → about 2 ms | P2 (ghosting on a moving field) | Only if A3/A4 are not enough |
| A9 | Hygiene: one command buffer and one `submit` per frame; canvas pass `loadOp:'clear'`; bgra8unorm and `'opaque'` (already done) | Small: TBDR tile traffic (§1.7) | P0 | Code read |

## 6. What to measure first (in this order)
1. **The cap.** Log the median and 95th percentile of rAF Δt with the UI hidden and the scene paused. Record the 60 fps flag state and LPM (U1/U2). If Δt is about 16.7 ms, 120 Hz is off the table until the flag is turned off. If it is about 33 ms, suspect LPM.
2. **GPU time.**
   - Check `adapter.features.has('timestamp-query')`.
   - If present, put `timestampWrites` on the compute and render passes, since Apple exposes pass-boundary timestamps only (§1.5).
   - Otherwise time `queue.onSubmittedWorkDone()`.
   - Compare UI shown, UI hidden, and glass off (G1). **If GPU ms for WebGPU work is unchanged but fps drops with glass, the render server's blur is the cost.**
3. **The Safari build.** Note the iPadOS and Safari version. That decides whether the §1.3 pacer (and its ≈1 s-per-rung climb) or the §1.4 compile stall is in play.
4. **Layers.** Use the Web Inspector Layers tab and Timelines → Rendering Frames, run from a Mac against the iPad (https://webkit.org/blog/3996/introducing-the-rendering-frames-timeline/). Count backdrop layers and their area.
5. Instruments Metal System Trace on the iPad, to see render-server (backboardd) GPU time against Safari's GPU process. I expect this to work but it is **UNVERIFIED** for Safari content.

## 7. Could not verify (open)
- Apple's own wording for Limit Frame Rate and Low Power Mode on its support pages, which render client-side.
- Whether the WebGPU frame pacer (318799@main) or the pipeline-stall fix (PR 73881) is in any shipping Safari.
- Timestamp quantization in WebKit.
- The `CABackdropLayer` blur algorithm: whether it downsamples, and how its cost scales with radius.
- Whether `opacity:0` keeps the backdrop cost.
- Apple TMU rates for 3D and `rgba16float` sampling.
- Any public iPad WebGPU fps number.

## 8. Summary for a busy reader
1. By default, Safari caps rAF at about 60 Hz on ProMotion iPads. 120 Hz needs the user to turn off Feature Flag "Prefer Page Rendering Updates near 60fps" (WebKit default `true`).
2. Low Power Mode halves rAF (60→30) and caps the display at 60; Limit Frame Rate caps at 60; heat lowers the refresh rate. Check these before blaming code.
3. Each `backdrop-filter` panel is its own `CABackdropLayer` Gaussian blur, rendered by the system compositor on the same GPU as WebGPU. It cannot be cached while the canvas beneath changes every frame (INFERENCE).
4. Apple's own numbers: a full-screen blur cost 14.5 ms on an iPad Air (2014), and merging glass effects "improv[es] rendering performance" (2025). A comparable Android case measured 3.5 ms/frame for 7 panels.
5. A/B `backdrop-filter:none` with the UI still shown. If WebGPU GPU-ms stays flat while fps rises, the glass is the cost, and every glass fix is a pixel change for Josh to approve.
6. Safari 26 stalls rendering while pipelines compile, including on first use after the async promise resolves. Pre-warm every pipeline at boot. This is P0 and a candidate for the "~1 s of low fps".
7. Without its new frame pacer, WebKit presents overrunning WebGPU frames unevenly. Hold a deliberate, even cadence (60/40/30) or cut work to fit 16.7 ms.
8. The ray-march fill is the WebGPU cost: 3.2 M px × 110–240 steps. Resolution (into an internal target, never by resizing the canvas), empty-space skipping, and fewer or cheaper samples are the big levers.
9. Pixel-identical wins: pre-warm pipelines, even cadence, conservative empty-space skipping, `rg16float` if `.ba` are unused (needs `texture-formats-tier1`), one submit. The format and `'opaque'` are already right.
10. `shader-f16` is on every Apple GPU and `timestamp-query` is likely available. No public iPad WebGPU benchmark or 120 Hz mobile volume-rendering paper exists, so measure on the device first.
