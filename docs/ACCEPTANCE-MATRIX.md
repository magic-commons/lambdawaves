# Acceptance matrix

One table for every host and device. A row is evidence; a missing row is an unknown, never a pass. Historical green logs are not evidence for a new commit: every row names the commit it was measured on.

Fields: **date · hardware · OS · runtime · commit/tag · payload (dist sha256[:12], files) · workload · duration · result · limitations · next decision**. Host-specific rows may carry extra fields (the Electron and iOS runbooks list theirs); the eleven above are the minimum.

## Row 0 — baseline gate on the release commit (this Linux box)

| date | hardware | OS | runtime | commit | workload | duration | result | limitations | next |
|---|---|---|---|---|---|---|---|---|---|
| 2026-09-24 09:40 | Ryzen 5 5600G · RTX 3070 8 GB | Ubuntu, Linux 7.0.0-31 | Node 22.22.1 · Firefox 155 headless (geckodriver) | `91c90bc` v0.2.3-alpha.3 | `./test.sh all`: 77 node suites (`tests/*.test.mjs`, pwa last), then 16 browser suites (`tests/*.browser-test.mjs`) on one owned HTTPS server (8701) | not timed (background run) | **PASS** — `node: 0 browser: 0`, exit 0; 920 GREEN lines, 0 RED, 0 `not ok`; log `~/.claude/jobs/80f0a117/tmp/gate-91c90bc.log` | The Firefox rig floors at 500 px, so no phone-width coverage in this row; no iPad/phone/Windows/Mac evidence; the legacy gate (`./test.sh legacy`) was not run | This commit is the M0 baseline for every host row below |

## Rows 1+ — hosts

_Added by P03 (Electron: dev tree, packaged linux-x64, win32-x64 built-not-run, then Josh's Windows PC) and P04 (WKWebView: iPad M5, iPhone) as their evidence arrives._

### P03 · Electron (desktop) — built and measured 2026-09-24

Host: `shells/electron/` (`main.cjs` policy, `preload.cjs`, `package.mjs`, `smoke-run.mjs`). Payload = `dist/` sha256 `790655d26eeb…`, 217 files, from `91c90bc` (tag v0.2.3-alpha.3 sits one commit earlier, on `ef322ce`). Runtime Electron 44.4.5 / Chromium 152.0.7977.130 / Node 24.21.0, pinned. The builder's runs and Fable's independent re-run agree.

| date | hardware | OS | runtime | commit | workload | duration | result | limitations | next |
|---|---|---|---|---|---|---|---|---|---|
| 2026-09-24 | Ryzen 5 5600G · RTX 3070 8 GB, driver 595.91.07 | Ubuntu 26.04.1, Linux 7.0.0-31, Wayland session | Electron 44.4.5 dev tree, `lambdawaves://app`, **no WebGPU switches**, adapter nvidia/ampere (not fallback), `getGPUFeatureStatus().webgpu` enabled, canvas rgba8unorm, maxTextureDimension2D 16384 | `91c90bc` | `smoke-run.mjs`: protocol policy (MIME, nosniff, `_headers` 404, traversal 403), secure context, boot, first frame, pixels, sw declined, project export→disk→import round trip (19111 B), screenshot, no errors | ~20 s | **PASS** 17/17 · first frame 958 ms · frames 4 · nonBlack 76800 | **sandbox OFF** (SUID helper needs one sudo line, below); first-frame timing "gate concurrent" (a geckodriver from another session was live) | fix the sandbox perms, re-run for the timing |
| 2026-09-24 | same | same | **packaged linux-x64** (290 MB), same adapter/flags | `91c90bc` | same | ~20 s | **PASS** 17/17 · first frame 1084 ms (builder) / 1051 ms (Fable's re-run) · screenshot shows the hydrogen field, rack and transport inside the window | same sandbox note | Josh: 30-minute real use on this box after the sudo line |
| 2026-09-24 | — | Windows x64 | **packaged win32-x64** (374 MB) | `91c90bc` | — | — | **built, not run** | needs Josh's Windows GPU PC | Josh: copy `shells/electron/out/lambdawaves-desktop-win32-x64/`, run the 30-minute checklist, fill a row (GPU name, fps at 96³ from METERS, offline, save/close/relaunch, capture) |

Findings recorded by P03: `?warn=0` is ignored outside automation (`rack.js` `needed()` honours it only under `navigator.webdriver`), so desktop users see the photosensitivity notice like web users do; `getGPUFeatureStatus().webgpu` reads `disabled_off` at did-finish-load and `enabled` once the GPU is up, so the host samples it at capture time; Chromium logs "`--ozone-platform=wayland` is not compatible with Vulkan" yet WebGPU runs. Sudo line for the sandbox (never baked into the host):

```
sudo chown root:root shells/electron/out/lambdawaves-desktop-linux-x64/chrome-sandbox && sudo chmod 4755 shells/electron/out/lambdawaves-desktop-linux-x64/chrome-sandbox
```

(the same two commands on `shells/electron/node_modules/electron/dist/chrome-sandbox` for the dev tree).

### P04 · WKWebView (Apple) — built 2026-09-24, awaiting Josh's device runs

Host: `shells/ios/` (SwiftUI + WKWebView, three load modes behind one constant, probe page). Row template and the per-device checklist: `shells/ios/README.md` §5–§6. The Swift was written on Linux and is not yet compiled; Josh's first ⌘B is the first compile.

| date | hardware | OS | runtime | commit | workload | duration | result | limitations | next |
|---|---|---|---|---|---|---|---|---|---|
| _pending_ | iPad M5 | iPadOS 26.x | WKWebView, load mode `.fileURL` (then `.customScheme`, `.loopback` if needed) | `91c90bc` + shells | README §5 (a)–(g): probe JSON, boot, Wave Dancer fps 64³/96³, 60 s background Δclock.t, export/import, rotate + window third, relaunch | 20–30 min | _pending_ | free Apple ID (7-day install); Swift uncompiled until ⌘B | first mode that boots with WebGPU decides |
| _pending_ | iPhone (model TBD) | iOS 26.x | same | same | same, minus the window-resize item | 20–30 min | _pending_ | same | same |

### P06 · Android, Trusted Web Activity — built 2026-09-24, awaiting Josh's phone run

Host: `shells/android/` (Bubblewrap 1.25.0; `twa-manifest.json`, `build.sh`, `assetlinks.json`; upload keystore local-only). Outputs: `app-release-signed.apk` 1,048,750 B and `app-release-bundle.aab` 1,171,294 B, versionCode 1, minSdk 21 (decision pending: raise to 31 = Android 12, the WebGPU floor, before the store build), targetSdk 36 (meets Play's requirement read 2026-09-24: API 36+ from 2026-08-31). Signing cert SHA-256 `109e4f83…d929` verified by apksigner and equal to `assetlinks.json`. The site must serve `/.well-known/assetlinks.json`; `tools/build-deploy.mjs` now ships it (copied from `shells/android/assetlinks.json`; V1 knows it as deploy-only) and the PWA integrity test still passes. It goes live with the next deploy Josh makes; until then the app shows Chrome's custom-tab bar, which is expected. Row template and checklist: `shells/android/README.md` §5–§6; the Play law in §7 (12 testers × 14 days for a personal account, then production review ≤ 7 days usually).

| date | hardware | OS | runtime | commit | workload | duration | result | limitations | next |
|---|---|---|---|---|---|---|---|---|---|
| 2026-09-24 16:58 | **Google Pixel 10 Pro XL** (Tensor G5, Imagination GPU) | Android 16 (UA frozen as "Android 10; K") | **Chrome 153.0.0.0** via TWA, versionCode 1, installed from the APK sent through Claude Code | `91c90bc` + shells; live site reports 0.2.3-ALPHA.1 (2026-09-23) | README §5 (a)–(c) so far: launch, bar, Wave Dancer, notebook, ABOUT dump | ~5 min | **WebGPU YES**: adapter `img-tec / d-series`, field grid 128, half-extent 46; app boots, rack + modulation window + notebook + ABOUT all render in portrait and landscape; Chrome custom-tab bar present (expected, assetlinks not live) | fps, airplane-mode relaunch, 60 s background Δclock.t, export/import, kill + relaunch not yet measured | finish (c′)–(i); merge + deploy so assetlinks goes live; then Play Console |

Evidence: four phone screenshots (portrait rack with MOLECULES/MO-REGISTRY/SHADOW/SPECTRUM and the modulation window over it; landscape MACROS/LFO/AUDIO; the Wave Dancer notebook; ABOUT) and the COPY DUMP text, received in the session 2026-09-24 16:58. First recorded proof that Chrome 153 enables WebGPU on Imagination (PowerVR D-series) graphics, which Chrome's 121 announcement did not cover.

Verified on this box instead (not a device row): `probe/probe.html` runs to `done: true` in headless Chromium 153 with 0 page errors (SwiftShader adapter, fallback = true); from `file://` it reports workers blocked for origin `null` and fetch failing, as expected for Chromium, which is why WebKit's `file://` behaviour is the first unknown. Observation for M2, not the shell: on a software adapter the app reports `device lost: Device was destroyed` about 4 s after PLAY while frames keep counting and `dispose()` is not called.
