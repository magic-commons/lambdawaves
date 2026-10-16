# App Store screenshots: λWAVES for iPad

## What Apple requires (read 2026-09-24, https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications)

| Display | Accepted sizes (px), portrait / landscape | Required? |
|---|---|---|
| **13-inch** (iPad Pro M5/M4 and 6th–1st gen, iPad Air M4/M3/M2) | 2064 × 2752 or 2048 × 2732 / **2752 × 2064** or 2732 × 2048 | **Required if the app runs on iPad** |
| 12.9-inch (iPad Pro 2nd gen) | 2048 × 2732 / 2732 × 2048 | scaled from 13-inch if absent |
| 11-inch | 1488 × 2266, 1668 × 2420, 1668 × 2388, 1640 × 2360 (and the landscape pairs) | scaled from 13-inch if absent |
| 10.5-inch, 9.7-inch | 1668 × 2224; 1536 × 2008/2048 (and landscape) | scaled from larger |

- Count: 1 to 10 per display size. Formats: .jpeg, .jpg, .png. "Images can't include alpha channels or transparencies."
- For the iPhone update later, 6.9-inch is required: 1260 × 2736 or 2736 × 1260 (6.5-inch 1284 × 2778 if 6.9 is absent).
- App Review Guideline 2.3.3 (https://developer.apple.com/app-store/review/guidelines/, same day): "Screenshots should show the app in use, and not merely the title art, login page, or splash screen."

## The draft set: `store/apple/screenshots/`, 2752 × 2064 (13-inch, landscape), RGB PNG with no alpha

**These are renders of the same web app at iPad size. They are not captures from an iPad.** `node store/shots.mjs --ipad` produced them on this Linux box on 2026-09-24:

- The **packaged Electron host** serves exactly the `dist/` bytes that the iOS shell bundles as `www/` (`91c90bc` payload).
- The viewport is set to the 13-inch iPad's 1376 × 1032 CSS points at deviceScaleFactor 2, with mobile and touch emulation and an iPadOS 26 Safari user agent.
- The GPU is the RTX 3070 through WebGPU, and the frames are captured over CDP. Nothing is painted over them.

The brief asked for headless Chromium over `python3 -m http.server` on :8731. That was tried first. Snap Chromium on this box offers only a SwiftShader adapter (fallback) under every flag set tried. On that adapter the app shows "the GPU device was lost", which is the software-adapter behaviour already recorded in `docs/ACCEPTANCE-MATRIX.md`. So the Electron host, with the same bytes and a real GPU, made the renders.

| File | What it shows |
|---|---|
| `01-hydrogen-field-and-rack.png` | first run: the 1s + 2p_z dipole beat in phase colour, playing, default rack and transport |
| `02-spectrum-state-superposition.png` | the three-mode "reconnection" superposition in phase view; SPECTRUM lights 3d₊₂, 4p₊₁, 5s; STATE open |
| `03-wave-dancer-demo.png` | the bundled WAVE DANCER performance, dark theme, modulation window open (it runs past the right edge at this width, as the app lays it out) |
| `04-molecules-benzene.png` | MOLECULES ON, benzene ground-state density, STO-3G |
| `05-notebook-and-projects.png` | a saved project's notebook in preview, with typeset maths over the 1s + 2s density |

What differs from a real iPad:

- Safari's WebGPU renders on Apple silicon, not NVIDIA. Colours and anti-aliasing may differ slightly.
- The app's own iPad/phone checks read the real device. Emulation matches the viewport, touch and UA, but not the GPU limits.
- A render has no iPadOS system UI. A real capture shows whatever the app leaves visible, such as the status bar or home indicator.

**Recommendation:** fill App Store Connect with these now. Replace them with real captures from the P04 iPad run if Josh prefers, which also fits 2.3.3's "the app in use" best once the host runs on the device. To capture, press the top button and volume up together, in landscape. A **13-inch** iPad Pro (M5/M4) produces 2752 × 2064 directly. An **11-inch** one produces 2420 × 1668, which is not a 13-inch size, so it can only fill the optional 11-inch slot and the 13-inch set still has to come from here or from a 13-inch device.
