# 0.9.1 H2 THE ROWS RE-MEASURED — the build note (Opus 5.5, 2026-10-16)

Branch `h2-rows`, from the base `c577a04` (H1 THE HOMECOMING's merge on `yan-c`). Nothing pushed, deployed, uploaded or submitted; no store
account touched. Every number below was measured on this machine on 2026-10-16 between 11:26 and 11:38 (CDT). The rows themselves are in
`docs/ACCEPTANCE-MATRIX.md` § "0.9.1 — the rows re-measured on the current cut".

## The line count
`find lab -name '*.js' -not -path 'lab/mir/*' | xargs cat | wc -l` → **30,028 before, 30,028 after.** No file under `lab/` changed.

## This machine, read on the day (never from the September row)
| what | command | reading |
|---|---|---|
| CPU | `lscpu` | AMD Ryzen 5 5600G with Radeon Graphics |
| GPU | `nvidia-smi -L`; `--query-gpu=name,driver_version` | NVIDIA GeForce RTX 3070, driver **595.99.02** (September: 595.91.07) |
| RAM | `free -g` | 30 GB |
| OS | `uname -r`; `/etc/os-release` | Linux **7.0.0-38**-generic (September: -31); Ubuntu 26.04.1 LTS; Wayland session (`WAYLAND_DISPLAY=wayland-0`, `DISPLAY=:0`) |
| Node / npm | `node -v`; `npm -v` | 22.23.3 / 10.9.9 |
| commit | `git rev-parse --short HEAD`; `git describe --tags` | `c577a04` · `v0.9.0-alpha-14-gc577a04` |

## (a) THE LINUX ELECTRON ROW
```
cd tools/platform/electron
npm ci                                   # 0.6 s: Electron 44.4.5, @electron/packager 20.3.0 (the lock's pins); node_modules 315 MB, git-ignored
node node_modules/electron/install.js    # Electron 44 fetches its binary on first use, not in postinstall; it came from ~/.cache/electron (1 s)
node package.mjs                         # 5.4 s: builds dist/ (tools/build-deploy.mjs --quiet → "494 files, 22.57 MiB"), packages linux-x64 AND win32-x64
node smoke-run.mjs --packaged            # 34 s
node smoke-run.mjs                       # the dev tree, 34 s
```
`out/build-identity.json`: `gitSha c577a047…`, `gitTag v0.9.0-alpha-14-gc577a04`, `distSha256 c3f1cd76e54ceaa8…`, `fileCount 494`, `electron 44.4.5`,
`packager 20.3.0`. The payload identity (`dist-hash.mjs`: sha256 over the sorted `path sha256` lines) is the same for the root `dist/` and for
`resources/dist` inside both packages: **`c3f1cd76e54c`, 494 files**.

**The September smoke run did not pass on today's engine, as it stood: RED 3 of 17** (`__LW.ready` never true in 30 s; `sw.mode` stuck at
`boot`; the round trip threw on `document.querySelector('.pj-export')` = null). Both causes are the engine moving, not the host failing: 0.5.0
C6 put the title screen between the boot and `LW.ready` (the host loads `index.html?sw=0&warn=0`, Electron is not a webdriver, so the opener
waits for a pick — the window showed the cover wall), and the project panel's `.pj-export`/`.pj-import` buttons are gone (FOLDERS; the API is
`__LW.projects.download()` / `pick()`). `smoke-run.mjs` now takes the hand's road before its checks — CONTINUE on the photosensitivity notice
(`.mir-dialog-actions [data-kind=primary]`), then NEW (`.mir-opener-home`) — and exports/imports through the two API calls under a user
gesture (5 lines changed; commit `c2e4f54`). Nothing in the host (`main.cjs`, `preload.cjs`) changed, and the package was not rebuilt for it
(`smoke-run.mjs` is excluded from the package).

| run | result |
|---|---|
| packaged linux-x64, 11:31 | **PASS 17/17** · protocol policy (text/javascript; nosniff; `_headers` 404; traversal 404/404/403) · `navigator.gpu` · secure context · origin `lambdawaves://app` · ready · field.ok · adapter nvidia/ampere, not fallback · frames 5 · nonBlack 76800 · `sw.mode` declined · desktop bridge · export 17,812 B on disk = `exportText()`, removed, re-imported deep-equal · screenshot 320 KB via `capturePage` · `__e` empty · no uncaught exceptions · **first frame 1039 ms** · shot `510b06aa36dc` |
| dev tree, 11:31 | **PASS 17/17** · first frame 1393 ms · shot `d32252ca30f7` |
| host facts (`host.json`) | Electron 44.4.5 / Chromium 152.0.7977.130 / Node 24.21.0 · `getGPUFeatureStatus().webgpu` = enabled · no WebGPU switches · ozone wayland · canvas rgba8unorm · maxTextureDimension2D 16384 |
| package | linux-x64 319,863,598 B, 566 files, tree `74ea729965059b6e`, binary `lambdawaves-desktop` `ee9faf5bb9fe78a7`, `app.asar` `ade11fde8dac8f59` |

The packaged screenshot (looked at): the 1s₀ + 2p₀ field with the stage formula "1s₀ and 2p₀", SHADOW / SPECTRUM on the left, SETTINGS / STATE /
PALETTE / WAVE on the right, the transport at the foot with the toast "Opened — p03-roundtrip". **Sandbox OFF** on both runs: the SUID helper is
not root-owned; the sudo line is the matrix's (P03), with this worktree's path.

**Field law: not run inside the package** — the test's driver (`tools/gate/gatekit.mjs` `open()` → `drv.mjs`) is a geckodriver WebDriver session
on Firefox; it has no CDP or Electron backend, and giving it one is a driver project (Josh's dial, 10-16). The shell's own CDP smoke readback
stands in. The field law WAS run on this machine on this commit in its own browser (Firefox):
```
python3 tools/gate/server.py <worktree> 9571 &     # pid 2352284, stopped by pid after the run
LW_PORT=9571 GD_PORT=5671 node tests/field-law.browser-test.mjs    # 11 s, 0 failing of 9
FIELD LAW · adapter info blank · Firefox/157.0 · c577a04 · hydrogen RMS 2.34e-6 · 99.8 % 1.88e-5 · worst 1.68e-4 · water RMS 8.31e-4 · worst/ρmax 2.86e-4 · GREEN
```
(Firefox 157.0.1 headless, snap geckodriver. The readings equal `docs/PROVENANCE.md`'s line at `dfdd2b8` digit for digit, as they must: `lab/`
is the same bytes.)

## (b) WIN32-X64 — BUILT-NOT-RUN
Built by the same `node package.mjs`: `out/lambdawaves-desktop-win32-x64/`, **408,804,104 B** (September: 374 MB), 567 files, tree
`494e1870d273…`, `lambdawaves-desktop.exe` sha256 **`c8ef35a560c522e10723276a770656c519e4ac9c7ab6feda9f655f410047946a`**, `app.asar`
`ade11fde8dac…` (identical to linux's), `resources/dist` `c3f1cd76e54c` · 494. Not run: this box has no Windows and no Wine (`wine`, `wine64` absent).

## (c) ANDROID
- **P08 bundled WebView — BUILT, NOT RUN.** `ANDROID_HOME` and `ANDROID_SDK_ROOT` are unset, but `build.sh` defaults to the SDK and JDK Bubblewrap
  installed under `~/.bubblewrap` (build-tools 35.0.0 + 36.1.0, platform android-36, JDK 17.0.11), and the Gradle 8.11.1 wrapper and its caches are
  in `~/.gradle`. `tools/platform/android-webview/build.sh` → 13.5 s → `out/lambdawaves-webview-debug.apk`, **18,331,046 B, sha256
  `17a00227314fa979ec74e93930e32955ba96293c11baaeb91f6278b97fbcc4af`**; `aapt2 dump badging`: `com.magiccommons.lambdawaves.webview`, versionCode 1,
  versionName 0.1-proof, minSdk 31, targetSdk 36, INTERNET only. `assets/www` holds 492 files: `dist/`'s 494 less `_headers`/`_redirects` (removed by
  the script) less `.well-known/assetlinks.json` (aapt drops dot directories; harmless, it is the website's file) plus `probe.html`. AGP 8.9.1. One
  javac deprecation note in `MainActivity.java`. `adb devices` (the SDK's platform-tools; daemon started and killed by me): no device.
- **P06 TWA — UNBUILT here.** Its `build.sh` needs `local/upload.keystore` + `local/KEYSTORE-PASSWORD.txt`; they are local-only (git-ignored) and exist
  only in the `worktree-hosts-m0` worktree (`shells/android/local/`). An agent does not copy a signing key. The TWA has no payload — it opens the live
  site, which has not been redeployed since September — so a rebuild today would measure nothing about this cut.

## (d) iOS — "needs a Mac with Xcode — unbuilt here"
`xcodebuild`, `swift`, `swiftc`: absent. The Swift in `tools/platform/ios/` has still never been compiled. The iPad M5 and iPhone rows stay
**UNVERIFIED**, gated on two things this row does not decide: **MIR mobile** (unplanned) and **WebGPU in WKWebView** (unverified).

## Toolchains this machine lacks
Xcode (`xcodebuild`, `swift`, `swiftc`) and any macOS — the iOS shell · Windows or Wine (`wine`, `wine64`) — running the win32 package · an attached
Android device (`adb devices` empty) — running the APK · the TWA upload keystore in this worktree (by design). Present: Node 22.23.3, Python 3,
Firefox 157.0.1 + geckodriver, Electron 44.4.5 (shell-local), JDK 17.0.11 + Android SDK 36 + Gradle 8.11.1 (Bubblewrap's, under `~/.bubblewrap`).

## (e) Rows Josh fills by hand
The LAN server is not started by H2. On this box, from the repo root: `./serve-lan.sh` → prints `λWAVES on the LAN → https://<LAN IP>:8710/lab/`
(today this box is `10.0.0.18`; certificates from `~/mandelbrot/certs`, accept the warning once per device). It serves the checkout's `lab/`, so the
row's commit is the checkout's `git rev-parse --short HEAD`. `?report=1&post=1` runs the device report after CONTINUE and POSTs it into
`research/device-reports/inbox/`; without `post=1`, press COPY on the toast. Add `&only=fingerprint` for the two digests that compare a device with
this box (here: 1s+2pz `4d36a9a5`, H₂O density `386430a4`, `docs/PROVENANCE.md`).

The device-report line (`tools/perf/device-report.js` `summaryLine`), what to paste for a device the field-law driver cannot reach:
```
λWAVES device report · <device> · <vendor architecture> · dpr <dpr> cap <cap> · display <Hz> Hz · <res>³/<steps>/<scale> · paced <…> · long play <fps> fps, <n> presents, <n> held, queue ≤ <ms> · fps <scenes> · gpu ms <grid:ms …> · fp <hash>/<hash> · <n> backdrops · <n> els · restored <…> · <bytes> B
```
The field-law line, where its driver runs (Firefox + geckodriver + Node + Python + a checkout):
```
FIELD LAW · <adapter> · <browser> · <commit> · hydrogen RMS <x> · 99.8 % <x> · worst <x> · water RMS <x> · worst/ρmax <x> · GREEN|RED
```

| device | open | paste |
|---|---|---|
| **iPad M5** | Safari: `https://<LAN IP>:8710/lab/?report=1&post=1` (then once more with `&only=fingerprint`) | the device-report line, prefixed `date · iPad M5 · iPadOS <ver> · Safari <ver> · <commit> ·`. This is a **Safari** row: it does NOT open the P04 gate (WebGPU in WKWebView); that needs the shell built on a Mac, then `tools/platform/ios/README.md` §5–§6's row |
| **iPhone** | the same URL in Safari | the same line. MIR mobile is unplanned: the row is evidence of WebGPU and fps on the phone, not of a usable layout |
| **Windows PC — the package** | copy `tools/platform/electron/out/lambdawaves-desktop-win32-x64/` (408.8 MB; `lambdawaves-desktop.exe` sha256 `c8ef35a5…047946a`) and run the exe; no driver reaches it, so the 30-minute checklist by hand | `date · <GPU name + driver> · Windows <ver> · Electron 44.4.5 packaged win32-x64 · c577a04 · dist c3f1cd76e54c (494) · fps at 96³ (METERS, CLOCKS Hz) <n> · offline <Y/N> · save/close/relaunch <Y/N> · capture <Y/N> · <PASS/FAIL> · <notes>` |
| **Windows PC — the browser** | Chrome or Edge: `https://<LAN IP>:8710/lab/?report=1&post=1` | the device-report line, prefixed as above |
| Windows PC — the field law (optional) | with Node 22+, Python 3, Firefox + geckodriver and a checkout: `python3 tools/gate/server.py . 8704` then `LW_PORT=8704 GD_PORT=5206 node tests/field-law.browser-test.mjs` | the `FIELD LAW · …` line |

## (f) THE SEPTEMBER ROWS — marked HISTORICAL in place
Every September row and section heading in `docs/ACCEPTANCE-MATRIX.md` now carries **HISTORICAL** (Row 0; P03's three rows and its heading; P04's two
rows and heading; P06's row and heading). Nothing was deleted: they are evidence for `91c90bc`. The new section sits above them.

## (g) For Josh: claims a listing makes that the public face does not
Read: every sentence about accuracy, physics, devices or support in `store/steam/COPY.md`, `store/apple/METADATA.md`, `store/play/LISTING.md` and
`store/PRIVACY.md`, against README.md (0.9.0's public face) and `docs/PROVENANCE.md`. **No listing was changed** — the final words are yours.
**21 claims without backing, in 56 sentences** (a claim repeated across the three listings is one row). CONTRADICTED = README, a measured row or the
shipped code says otherwise; UNBACKED = README is silent (the feature may well exist in `lab/`).

| # | claim (where) | verdict | what the public face or the build says |
|---|---|---|---|
| 1 | "a library of **54 small molecules, 52 of them playable**, in STO-3G. **18** are also available in 6-31+G\*" (Steam l.24, l.56; Apple l.33, l.52; Play l.39) | **CONTRADICTED** | README l.159: **98 molecules: 61 solved live** (59 enabled) **and 37 opened from the library** (38 records); 6-31+G\* for H, C, N, O, F molecules up to 46 AOs (23 rows of README's live table carry a 6-31+G\* column) |
| 2 | "restricted Hartree–Fock … **These are closed shells with fixed nuclei, and there is no correlation beyond singles**"; "Closed-shell molecules only, fixed nuclei" (Steam l.24, l.126; Apple l.52; Play l.39) | **CONTRADICTED** | README l.159: RHF **and UHF for the 7 open shells**, **Kohn–Sham LDA** (Slater + VWN5, whose correlation is the functional's); nuclei **move under VIBRATE** |
| 3 | "λWAVES **uses no AI at runtime**" (Steam content survey l.100); "makes **no network requests** of its own" / "no network use" (Apple l.87, l.112; PRIVACY l.41) | **CONTRADICTED by the shipped build** | `lab/ask.js` (0.6.6 G2) is in `dist/`: the transport's ASK strip POSTs the typed text to a Gemma broker (`tools/gemma/broker.py`; default `<page host>:9443/ask`, the URL a PREFERENCE) and runs the reply as verbs and notebook text. README says nothing of ASK — and README's own Privacy sentence "Nothing you do is sent anywhere" misses it too |
| 4 | "Storage **400 MB** (the win32-x64 package is 374 MB)" (Steam l.89) | **CONTRADICTED** | today's win32-x64 package: **408,804,104 B** |
| 5 | "A transport with its own **clocks**" (Steam l.29; Apple l.56; Play l.44) | **CONTRADICTED** | README l.91: "a transport with **one clock**" |
| 6 | "**The same instrument** runs free in a browser at lambdawaves.magic-commons.com" (Steam l.46) | **CONTRADICTED** | the live site has not been deployed since September (`RELEASING.md` l.3: cuts since v0.5.3 are local); it serves the September build |
| 7 | "Everything on this page works in the current build"; "Its own README says 'Status: 0.2.3 alpha'" (Steam l.126, l.112) | **CONTRADICTED / stale** | README l.14: "Status: 0.9.0 alpha"; the Windows package has never run |
| 8 | "**Now on iPad**"; "Requires iPadOS 26 or later, which brings WebGPU … It was **built** and used on an M-series iPad"; review notes "runs offline in WKWebView … with WebGPU (iPadOS 26)" (Apple l.33, l.67, l.110) | **UNBACKED** | README backs Safari 26 / iPadOS 26 and daily use of the *web* app on an iPad; the iPad *app* has never been built and WebGPU in WKWebView is the plan's open gate (P04 UNVERIFIED) |
| 9 | "Needs Chrome with WebGPU … Android 12 or later … measured working on a Pixel 10 Pro XL with Chrome 153" (Play l.52) | **UNBACKED** | README says nothing of Android and "not tested … on a phone in the wild" (l.54); the Pixel row is HISTORICAL (`91c90bc`, live site 0.2.3-alpha.1) |
| 10 | "the **desktop** edition sold on Steam (**Windows and Linux**)"; "the **iPad** edition on the App Store" (PRIVACY l.12–13) | **UNBACKED** | no edition is run-verified except linux-x64 (sandbox OFF); Steam's own COPY l.92 says do not list Linux until the sandbox is solved without sudo |
| 11 | "Nothing is integrated, so nothing drifts" without README's qualifier; "in position **or momentum space**" (Steam l.21, l.55; Apple l.49; Play l.36) | **UNBACKED** | README l.69: "For **field-free** hydrogen nothing is integrated"; momentum space is not in README |
| 12 | the window list naming **SHADOW** and **SLICE** (Steam l.28; Apple l.55; Play l.42) | UNBACKED | README l.90–91 lists STATE, SPECTRUM, ORBIT, PLANE, KEPLER, VORTEX, MOLECULES, MO-REGISTRY, WIGNER, RADIATION (both windows exist in `lab/`) |
| 13 | "**LFOs, envelopes**" in the modulation window (Steam l.13, l.30, l.57; Apple l.57; Play l.43) | UNBACKED | README l.92: "a modulation plug-in with drag-to-patch macros"; AUDIO only in Privacy |
| 14 | "Hold Ctrl and drag to **draw back an impulse**" / "Draw back an impulse" (Steam l.31; Apple l.58) | UNBACKED | not in README (Apple's own note asks to confirm the touch gesture) |
| 15 | "Projects **with folders**" (Steam l.36; Apple l.61; Play l.47) | UNBACKED | README: "projects", "files you export yourself" |
| 16 | "A **Markdown notebook with typeset maths**" (Steam l.37; Apple l.62; Play l.48) | UNBACKED | README names the notebook only (l.114) |
| 17 | "**Picture capture** rendered at high resolution, and **video recording**" (Steam l.38, l.58; Apple l.63; PRIVACY l.28) | UNBACKED | not in README (README's exports are SHAPE and GRID, l.93–95, which no listing mentions) |
| 18 | "Needs a GPU that runs WebGPU (**Direct3D 12** on Windows, **Vulkan** on Linux)" (Steam l.44, l.88) | UNBACKED | README l.97: "a working WebGPU adapter … support varies by OS, GPU and driver" |
| 19 | desktop "**Runs offline**" / iPad "**Works offline**" (Steam l.45; Apple l.68) | UNBACKED | README backs the *PWA* as offline-capable; no host row measures offline (the September "next" columns still ask for it) |
| 20 | "about 3 ms per frame at 96³ and **3.9 ms at 128³ × 16 modes**"; "first frame ≈ 1.0 s (958–1084 ms)" (Steam l.88) | UNBACKED | README: ≈ 3 ms at 96³ (backed); 3.40 ms reconstructing 91 labels at 128³; first frame only in the matrix (today 1039 ms packaged, consistent) |
| 21 | "Measured only on Ubuntu 26.04 with an RTX 3070 (driver **595.91.07**)" (Steam l.92) | stale | today's driver 595.99.02, kernel 7.0.0-38 |

Backed and left alone: 91 exact eigenstates n ≤ 6; RPA/TDA/real-time TDHF and MO-REGISTRY's TD-CIS; WAVE DANCER; share links; no account / no
analytics / microphone only with an AUDIO device and its signal never leaves; the WebGPU banner instead of a lab; GPL-3.0; the AI disclosure; the
photosensitivity notice; tests against closed forms; Cloudflare's server logs.

**The worst three:** (1) the molecule claims (#1, #2) — September's chemistry in all three listings, contradicted on count, method and nuclei;
(2) "no AI at runtime" / "no network" (#3) — a disclosure-form answer the shipped ASK strip contradicts; (3) the iPad edition (#8) — "Now on iPad"
for an app never compiled, whose WebGPU-in-WKWebView gate is open (with #4's 400 MB storage line a close fourth).

## Gates (on `h2-rows`)
| gate | result |
|---|---|
| `./test.sh node` | exit 0, ALL GREEN (2 m 56 s) |
| `node tools/rack-deps.mjs --classes --no-write` | exit 0 |
| `node tools/new-project.mjs --check` | in step (16,117 B) |
| `lab/` line count | 30,028 → 30,028 |
| build outputs in git | none: `dist/`, `tools/platform/electron/{node_modules,out}/`, `tools/platform/android-webview/{out,app/build,app/src/main/assets}/`, `.gradle/` are all ignored by the existing `.gitignore` lines (no line added) |

## What changed in the tree
`tools/platform/electron/smoke-run.mjs` (5 lines: the start by the hand's road; the projects API) · `tools/perf/bench-chromium.mjs` (the
default Electron is now `tools/platform/electron/`'s, resolved from the file's own URL, not the hosts-m0 worktree's absolute path; verified to
resolve to `tools/platform/electron/node_modules/electron/dist/electron`) · `docs/ACCEPTANCE-MATRIX.md` (the new section; HISTORICAL marks) · this note.

## Corrections to the brief
1. `ANDROID_HOME`/`ANDROID_SDK_ROOT` do not resolve in the environment, yet the APK built: `build.sh` defaults to Bubblewrap's SDK and JDK under `~/.bubblewrap`. The condition is "the script's SDK resolves", which it does.
2. The field-law test cannot be pointed at the package: `gatekit.mjs` drives Firefox through geckodriver only. Recorded as "not run inside the package — <why>", with the field law run in Firefox on the same commit beside it.
3. `smoke-run.mjs` did not run as-is on the current engine (RED 3/17: the title screen holds `LW.ready`; `.pj-export` is gone). Re-pointed (5 lines) — not a new gate.
4. `package.mjs` builds `dist/` and packages linux-x64 AND win32-x64 in one run; the brief's (a) and (b) are one command. `npm ci` (the lock exists) in place of `npm install`; Electron 44 downloads its binary on first use, so `install.js` was run once (from the local cache).
5. The matrix also holds P06 (the TWA), which the brief's (c) does not name: UNBUILT here (the signing key is local-only, in hosts-m0's worktree).
6. The payload sha is `dist-hash.mjs`'s (sha256 over sorted `path sha256` lines), the identity the September rows used — not a tarball's.

## For the integrator at the merge
- `tools/perf/bench-chromium.mjs` is already re-pointed to `tools/platform/electron/` (it needs `npm ci` there on the integrating checkout; `node_modules` is not in git).
- Before `worktree-hosts-m0`'s worktree is removed, three local-only things live only there: `shells/android/local/` (the TWA upload keystore and its password — Josh moves it, never an agent), `store/steam/trailer-draft.mp4` (63 MB, git-ignored), `LANDING PAGE VIDEOS/`.
- The packages and APK are in this worktree's ignored `out/` directories; they are build products, not merged. The matrix rows name their sha256s.
- `tools/platform/electron/package.json` still says `"version": "0.2.3-alpha.3"` (H1 listed it); the package's metadata is September's until someone bumps it.
