# Acceptance matrix

One table for every host and device. A row is evidence; a missing row is an unknown, never a pass. Historical green logs are not evidence for a new commit: every row names the commit it was measured on.

Fields: **date · hardware · OS · runtime · commit/tag · payload (dist sha256[:12], files) · workload · duration · result · limitations · next decision**. Host-specific rows may carry extra fields (the Electron and iOS runbooks list theirs); the eleven above are the minimum.

## 0.9.9 — what moved since 0.9.1 (2026-10-30, the Linux workstation)

| date | hardware | OS | runtime | commit | payload | workload | duration | result | limitations | next |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-10-30 | Ryzen 5 5600G · RTX 3070 8 GB | Ubuntu 26.04.1, Linux 7.0.0-38, Wayland | **Electron 44.10.0 dev tree** / Chromium 152.0.7977.169 / Node 24.22.1 (from 44.4.5: `npm audit` 2 high → 0) | `568692fd` (chain E's branch) | the `dist/` left on disk — the deploy build failed V2 that day (since fixed); not re-identified | `smoke-run.mjs` | — | **PASS** 17/17 | packaged linux-x64 and win32-x64 not rebuilt on 44.10.0; the packaged rows below are still 44.4.5 | rebuild both packages from the 1.0 tag (`package.mjs` now writes SOURCE.md, COPYING, NOTICE and stamps BUILD_LINE's version) |

The store hosts: the host proofs of 2026-09-24 and 2026-10-16 stand as recorded below; nothing is on Steam, Play or the
App Store. The Android upload keystore is gone with the `worktree-hosts-m0` worktree (the TWA row below says what to do); the Windows package
waits for the maintainer's PC; the iOS shell has never been compiled. No row below is a pass for the 1.0 tree until it is re-measured on it.

## 0.9.1 — the rows re-measured on the current cut (2026-10-16, the Linux workstation)

Commit `c577a04` (described by tags as `v0.9.0-alpha-14-gc577a04`: the v0.9.0-alpha engine, `lab/` 30,028 lines, with H1's platform hosts merged). Payload = `dist/` from `npm run build`'s step (`node tools/build-deploy.mjs --quiet`, run by `package.mjs`): **sha256 `c3f1cd76e54c…`, 494 files**, 22.57 MiB — the same identity inside both Electron packages. Hardware read on the day: AMD Ryzen 5 5600G (`lscpu`), NVIDIA GeForce RTX 3070 driver 595.99.02 (`nvidia-smi`), 30 GB RAM; Ubuntu 26.04.1 LTS, Linux 7.0.0-38-generic, Wayland session; Node 22.23.3. Commands and logs are in the research archive (the 0.9.1 H2 build note). The September rows further down are **HISTORICAL**: evidence for `91c90bc` only.

| date | hardware | OS | runtime | commit | payload | workload | duration | result | limitations | next |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-10-16 11:35 | Ryzen 5 5600G · RTX 3070 8 GB | Ubuntu 26.04.1, Linux 7.0.0-38 | Node 22.23.3 | `c577a04` (gate run on `h2-rows`, `lab/` identical) | — | Row 0, node half: `./test.sh node` | 2 m 56 s | **PASS** — exit 0, ALL GREEN | browser half not run in H2 (the integrator runs THE LOCK ×2 at the merge) | the integrator's merge gate |
| 2026-10-16 11:32 | same, driver 595.99.02 | same | Firefox 157.0.1 headless (snap geckodriver), gate server 9571 | `c577a04` | the served tree, not `dist/` | `tests/field-law.browser-test.mjs` (THE FIELD LAW + the view-invariance gate) | 11 s | **PASS** 9/9 — `FIELD LAW · adapter info blank · Firefox/157.0 · c577a04 · hydrogen RMS 2.34e-6 · 99.8 % 1.88e-5 · worst 1.68e-4 · water RMS 8.31e-4 · worst/ρmax 2.86e-4 · GREEN` | Firefox 157 blanks every adapter-info member (the hardware is this row's); a browser row, not a host row | — |
| 2026-10-16 11:31 | same | same, ozone wayland | **Electron 44.4.5 dev tree** / Chromium 152.0.7977.130 / Node 24.21.0, `lambdawaves://app`, no WebGPU switches, adapter nvidia/ampere (not fallback), `getGPUFeatureStatus().webgpu` enabled, rgba8unorm, maxTex2D 16384 | `c577a04` | `c3f1cd76e54c` · 494 | `smoke-run.mjs` (as of `h2-rows`: notice CONTINUE + title screen NEW first, then September's checks; export/import through `__LW.projects.download()` / `pick()`) | 34 s | **PASS** 17/17 · first frame 1393 ms · frames 5 · nonBlack 76800 · round trip GREEN · shot `d32252ca30f7` · errors 0 | sandbox OFF (the SUID helper is not root-owned; sudo line below); field law not run inside the host (see the packaged row) | Maintainer: the sudo line, then a real session |
| 2026-10-16 11:31 | same | same | **packaged linux-x64** 319,863,598 B, 566 files (tree `74ea72996505`, binary `ee9faf5bb9fe`, `app.asar` `ade11fde8dac`), same runtime and adapter | `c577a04` | `c3f1cd76e54c` · 494 (`resources/dist`) | same | 34 s | **PASS** 17/17 · first frame 1039 ms · frames 5 · nonBlack 76800 · export 17,812 B, round trip GREEN · shot `510b06aa36dc` (the 1s₀ + 2p₀ field, the rack, the transport, "Opened — p03-roundtrip") · errors 0 | sandbox OFF; **field law: not run inside the package** — its driver (`tools/gate/gatekit.mjs` `open()`) is a geckodriver/Firefox WebDriver session with no CDP or Electron backend, so the shell's own CDP smoke readback stands in | Maintainer: 30-minute real use after the sudo line |
| 2026-10-16 11:26 | built on this box | Windows x64 | **packaged win32-x64** 408,804,104 B, 567 files (tree `494e1870d273`, `lambdawaves-desktop.exe` `c8ef35a560c5`, `app.asar` `ade11fde8dac`) | `c577a04` | `c3f1cd76e54c` · 494 | — | — | **BUILT-NOT-RUN** | needs the maintainer's Windows GPU PC | Maintainer: the Windows paste line (`H2-BUILD.md`, "Rows the maintainer fills by hand") |
| 2026-10-16 11:33 | built on this box; no device (`adb devices`: none) | Android ≥ 12 (minSdk 31, targetSdk 36) | P08 bundled System WebView: debug-signed APK `com.magiccommons.lambdawaves.webview` 0.1-proof, 18,331,046 B, sha256 `17a00227314f…`; JDK 17.0.11 + SDK (build-tools 36.1.0, android-36) under `~/.bubblewrap` (no `ANDROID_HOME` set: `build.sh`'s default), AGP 8.9.1, Gradle 8.11.1 | `c577a04` | `c3f1cd76e54c` → 492 files in `assets/www` (`_headers`, `_redirects` removed by `build.sh`; `.well-known/` dropped by aapt as a dot directory; `probe.html` added) | `tools/platform/android-webview/build.sh` (assembleDebug) | 13 s | **BUILT-NOT-RUN** | no phone attached | Maintainer: install on the Pixel, `tools/platform/android-webview/README.md` §3–§4 |
| 2026-10-16 | — | Android (TWA) | P06 Trusted Web Activity | — | none: the TWA opens the live site | — | — | **UNBUILT here** | upload keystore: NONE on this machine (read 2026-10-30: the `worktree-hosts-m0` worktree is gone; its branch survives but `local/` and `*.keystore` were git-ignored, so it holds no key; no upload keystore under ~ to depth 9). Generate one at the first Play upload per `tools/platform/android/README.md`, re-fingerprint `assetlinks.json`, and back it up before any upload; an agent never copies a signing key. The TWA carries no payload: it shows the live site, not redeployed since September | Maintainer: a new upload key at the first Play upload (nothing is on Play, so nothing is lost but the old fingerprint); rebuild after the deploy decision |
| 2026-10-16 | — | iPadOS / iOS | P04 WKWebView shell | — | — | — | — | **UNBUILT here — needs a Mac with Xcode** (`xcodebuild`, `swift`, `swiftc` absent on the Linux workstation); the Swift has never been compiled | iPad M5 and iPhone rows **UNVERIFIED**, gated on (1) MIR mobile (unplanned) and (2) WebGPU in WKWebView (unverified) | Maintainer: ⌘B on a Mac, then `tools/platform/ios/README.md` §5 |

## Row 0 — baseline gate on the release commit (the Linux workstation) — HISTORICAL (`91c90bc`)

| date | hardware | OS | runtime | commit | workload | duration | result | limitations | next |
|---|---|---|---|---|---|---|---|---|---|
| HISTORICAL · 2026-09-24 09:40 | Ryzen 5 5600G · RTX 3070 8 GB | Ubuntu, Linux 7.0.0-31 | Node 22.22.1 · Firefox 155 headless (geckodriver) | `91c90bc` v0.2.3-alpha.3 | `./test.sh all`: 77 node suites (`tests/*.test.mjs`, pwa last), then 16 browser suites (`tests/*.browser-test.mjs`) on one owned HTTPS server (8701) | not timed (background run) | **PASS** — `node: 0 browser: 0`, exit 0; 920 GREEN lines, 0 RED, 0 `not ok`; log `~/.claude/jobs/80f0a117/tmp/gate-91c90bc.log` | The Firefox rig floors at 500 px, so no phone-width coverage in this row; no iPad/phone/Windows/Mac evidence; the legacy gate (`./test.sh legacy`) was not run | This commit is the M0 baseline for every host row below |

## Rows 1+ — hosts

_Added by P03 (Electron: dev tree, packaged linux-x64, win32-x64 built-not-run, then the maintainer's Windows PC) and P04 (WKWebView: iPad M5, iPhone) as their evidence arrives._

### P03 · Electron (desktop) — built and measured 2026-09-24 — HISTORICAL (`91c90bc`; re-measured above)

Host: `tools/platform/electron/` (`main.cjs` policy, `preload.cjs`, `package.mjs`, `smoke-run.mjs`). Payload = `dist/` sha256 `790655d26eeb…`, 217 files, from `91c90bc` (tag v0.2.3-alpha.3 sits one commit earlier, on `ef322ce`). Runtime Electron 44.4.5 / Chromium 152.0.7977.130 / Node 24.21.0, pinned. The builder's runs and an independent re-run agree.

| date | hardware | OS | runtime | commit | workload | duration | result | limitations | next |
|---|---|---|---|---|---|---|---|---|---|
| HISTORICAL · 2026-09-24 | Ryzen 5 5600G · RTX 3070 8 GB, driver 595.91.07 | Ubuntu 26.04.1, Linux 7.0.0-31, Wayland session | Electron 44.4.5 dev tree, `lambdawaves://app`, **no WebGPU switches**, adapter nvidia/ampere (not fallback), `getGPUFeatureStatus().webgpu` enabled, canvas rgba8unorm, maxTextureDimension2D 16384 | `91c90bc` | `smoke-run.mjs`: protocol policy (MIME, nosniff, `_headers` 404, traversal 403), secure context, boot, first frame, pixels, sw declined, project export→disk→import round trip (19111 B), screenshot, no errors | ~20 s | **PASS** 17/17 · first frame 958 ms · frames 4 · nonBlack 76800 | **sandbox OFF** (SUID helper needs one sudo line, below); first-frame timing "gate concurrent" (a geckodriver from another session was live) | fix the sandbox perms, re-run for the timing |
| HISTORICAL · 2026-09-24 | same | same | **packaged linux-x64** (290 MB), same adapter/flags | `91c90bc` | same | ~20 s | **PASS** 17/17 · first frame 1084 ms (builder) / 1051 ms (independent re-run) · screenshot shows the hydrogen field, rack and transport inside the window | same sandbox note | Maintainer: 30-minute real use on this box after the sudo line |
| HISTORICAL · 2026-09-24 | — | Windows x64 | **packaged win32-x64** (374 MB) | `91c90bc` | — | — | **built, not run** | needs the maintainer's Windows GPU PC | Maintainer: copy `tools/platform/electron/out/lambdawaves-desktop-win32-x64/`, run the 30-minute checklist, fill a row (GPU name, fps at 96³ from METERS, offline, save/close/relaunch, capture) |

Findings recorded by P03: `?warn=0` is ignored outside automation (`rack.js` `needed()` honours it only under `navigator.webdriver`), so desktop users see the photosensitivity notice like web users do; `getGPUFeatureStatus().webgpu` reads `disabled_off` at did-finish-load and `enabled` once the GPU is up, so the host samples it at capture time; Chromium logs "`--ozone-platform=wayland` is not compatible with Vulkan" yet WebGPU runs. Sudo line for the sandbox (never baked into the host):

```
sudo chown root:root tools/platform/electron/out/lambdawaves-desktop-linux-x64/chrome-sandbox && sudo chmod 4755 tools/platform/electron/out/lambdawaves-desktop-linux-x64/chrome-sandbox
```

(the same two commands on `tools/platform/electron/node_modules/electron/dist/chrome-sandbox` for the dev tree).

### P04 · WKWebView (Apple) — written 2026-09-24, awaiting the maintainer's device runs — HISTORICAL (`91c90bc`; the current row is above)

Host: `tools/platform/ios/` (SwiftUI + WKWebView, three load modes behind one constant, probe page). Row template and the per-device checklist: `tools/platform/ios/README.md` §5–§6. The Swift was written on Linux and is not yet compiled; the maintainer's first ⌘B is the first compile.

| date | hardware | OS | runtime | commit | workload | duration | result | limitations | next |
|---|---|---|---|---|---|---|---|---|---|
| HISTORICAL · _pending_ | iPad M5 | iPadOS 26.x | WKWebView, load mode `.fileURL` (then `.customScheme`, `.loopback` if needed) | `91c90bc` + shells | README §5 (a)–(g): probe JSON, boot, Wave Dancer fps 64³/96³, 60 s background Δclock.t, export/import, rotate + window third, relaunch | 20–30 min | _pending_ | free Apple ID (7-day install); Swift uncompiled until ⌘B | first mode that boots with WebGPU decides |
| HISTORICAL · _pending_ | iPhone (model TBD) | iOS 26.x | same | same | same, minus the window-resize item | 20–30 min | _pending_ | same | same |

### P06 · Android, Trusted Web Activity — built 2026-09-24, awaiting the maintainer's phone run — HISTORICAL (`91c90bc`)

Host: `tools/platform/android/` (Bubblewrap 1.25.0; `twa-manifest.json`, `build.sh`, `assetlinks.json`; upload keystore local-only). Outputs: `app-release-signed.apk` 1,048,750 B and `app-release-bundle.aab` 1,171,294 B, versionCode 1, minSdk 21 (decision pending: raise to 31 = Android 12, the WebGPU floor, before the store build), targetSdk 36 (meets Play's requirement read 2026-09-24: API 36+ from 2026-08-31). Signing cert SHA-256 `109e4f83…d929` verified by apksigner and equal to `assetlinks.json`. The site must serve `/.well-known/assetlinks.json`; `tools/build-deploy.mjs` now ships it (copied from `tools/platform/android/assetlinks.json`; V1 knows it as deploy-only) and the PWA integrity test still passes. It goes live with the next deploy the maintainer makes; until then the app shows Chrome's custom-tab bar, which is expected. Row template and checklist: `tools/platform/android/README.md` §5–§6; the Play law in §7 (12 testers × 14 days for a personal account, then production review ≤ 7 days usually).

| date | hardware | OS | runtime | commit | workload | duration | result | limitations | next |
|---|---|---|---|---|---|---|---|---|---|
| HISTORICAL · 2026-09-24 16:58 | **Google Pixel 10 Pro XL** (Tensor G5, Imagination GPU) | Android 16 (UA frozen as "Android 10; K") | **Chrome 153.0.0.0** via TWA, versionCode 1, installed from a sideloaded APK | `91c90bc` + shells; live site reports 0.2.3-ALPHA.1 (2026-09-23) | README §5 (a)–(c) so far: launch, bar, Wave Dancer, notebook, ABOUT dump | ~5 min | **WebGPU YES**: adapter `img-tec / d-series`, field grid 128, half-extent 46; app boots, rack + modulation window + notebook + ABOUT all render in portrait and landscape; Chrome custom-tab bar present (expected, assetlinks not live) | fps, airplane-mode relaunch, 60 s background Δclock.t, export/import, kill + relaunch not yet measured | finish (c′)–(i); merge + deploy so assetlinks goes live; then Play Console |

Evidence: four phone screenshots (portrait rack with MOLECULES/MO-REGISTRY/SHADOW/SPECTRUM and the modulation window over it; landscape MACROS/LFO/AUDIO; the Wave Dancer notebook; ABOUT) and the COPY DUMP text, received in the session 2026-09-24 16:58. First recorded proof that Chrome 153 enables WebGPU on Imagination (PowerVR D-series) graphics, which Chrome's 121 announcement did not cover.

Verified on this box instead (not a device row): `probe/probe.html` runs to `done: true` in headless Chromium 153 with 0 page errors (SwiftShader adapter, fallback = true); from `file://` it reports workers blocked for origin `null` and fetch failing, as expected for Chromium, which is why WebKit's `file://` behaviour is the first unknown. Observation for M2, not the shell: on a software adapter the app reports `device lost: Device was destroyed` about 4 s after PLAY while frames keep counting and `dispose()` is not called.
