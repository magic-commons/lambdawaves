# λWAVES WebView — the Android host proof (P08)

**The question:** can a bundled, browser-free Android app run λWAVES with WebGPU? This app carries the whole
`dist/` bundle inside the APK and draws it in the **Android System WebView** (not Chrome). The bundle is served
from `https://appassets.androidplatform.net/www/` by androidx.webkit's `WebViewAssetLoader`, so the page is a
**secure context** by construction and needs no network. It opens on the host probe (`shells/ios/probe/probe.html`,
copied verbatim), which links to the app.

**What it proves:** whether *this phone's* WebView exposes `navigator.gpu`, what adapter it gives, and whether the
field draws, and at what fps. **What it does not prove:** Play Store acceptance, other phones or WebView versions,
offline service-worker behaviour (the probe opens the app with `?sw=0`), or a finished product (debug-signed,
no update path). The shipped Android product stays the Trusted Web Activity in `shells/android/` unless this
passes.

| file | status |
|---|---|
| `build.gradle`, `settings.gradle`, `gradle.properties`, `gradlew*`, `gradle/wrapper/*` | source (AGP 8.9.1, Gradle 8.11.1: the versions Bubblewrap builds with here) |
| `app/build.gradle`, `app/src/main/AndroidManifest.xml`, `app/src/main/java/…/MainActivity.java`, `app/src/main/res/` | source |
| `build.sh`, `README.md`, `.gitignore` | source |
| `app/src/main/assets/www/` (dist/ + probe.html), `app/build/`, `out/*.apk` | generated, ignored |

## 1 · Build (Linux build host)

```sh
shells/android-webview/build.sh    # builds dist/ if missing, syncs assets/www, assembleDebug
# -> shells/android-webview/out/lambdawaves-webview-debug.apk  (package com.magiccommons.lambdawaves.webview)
```
It uses the JDK 17 and Android SDK Bubblewrap installed under `~/.bubblewrap` (override with `JAVA_HOME`,
`ANDROID_HOME`). Debug-signed: fine for sideloading, not for Play.

## 2 · Install (same as the TWA)

The APK file is sent to the phone (Drive, USB, email). Tap it in Files, allow *Install unknown apps* for Files
when Android asks, then Install. It installs **beside** the TWA as **λWAVES WebView** (a different package id).
By cable instead: `~/.bubblewrap/android_sdk/platform-tools/adb install -r shells/android-webview/out/lambdawaves-webview-debug.apk`.

## 3 · What to read

1. Open **λWAVES WebView**. The probe page appears. Read three rows:
   - **isSecureContext**: must be `true` (it is, by construction; `false` means the loader is broken).
   - **navigator.gpu**: present or absent. This is the answer.
   - **adapter**: vendor / architecture (Chrome on this phone says `img-tec` / `d-series`).
   The **userAgent** is in the JSON block below the table (`env.userAgent`): `Chrome/NNN…` there is the WebView
   version, `; wv)` marks a WebView. Also glance at *module worker*, *fetch*, *page errors*.
2. Tap **copy JSON** (or **download test**: it saves into Downloads; a toast says where) and keep the report.
3. Tap **open the app**. CONTINUE on the photosensitivity pane. WINDOW ▸ NOTEBOOK ▸ ▤ ▸ DEMOS **WAVE DANCER**;
   WINDOW ▸ **METERS** (on the phone first WINDOW ▸ HIDE / SHOW the rack); PLAY if METERS says IDLE.
   **fps** = the first number of **CLOCKS Hz** after about 10 s. Back returns to the probe.
4. Optional console: USB debugging on, then desktop Chrome ▸ `chrome://inspect` ▸ the WebView page ▸ inspect.
   Type `__LW.clock.t`, `__e`. (WebView debugging is always on in this build.)

**If `navigator.gpu` is absent, a second data point (testing only):** Settings ▸ Developer options ▸ **WebView
implementation** shows which package provides WebView (usually Android System WebView, or Chrome). The WebView
DevTools UI opens with `adb shell am start -a com.android.webview.SHOW_DEV_UI` (or its launcher icon, if
enabled); its **Flags** page can toggle `enable-unsafe-webgpu`. Relaunch λWAVES WebView and read the probe
again. This only tells us whether the GPU path *works* when forced: **a shipped app cannot set flags**, so a
flag-only pass counts as absent for the decision. Reset the flag afterwards.

## 4 · The acceptance row

| date | device | Android | WebView provider + version (from userAgent) | isSecureContext | navigator.gpu | adapter | fps | verdict |
|---|---|---|---|---|---|---|---|---|
| 2026-__-__ | Pixel 10 Pro XL | 16 | Android System WebView ___ | | | | | |

## 5 · The decision rule

- `navigator.gpu` present **and** the field draws → a bundled WebView product is possible (offline, no browser).
- `navigator.gpu` absent (or present only with a DevTools flag) → the **Trusted Web Activity stays the Android
  product**.

Host behaviour, for the record: links to other sites open in the system browser; other schemes are blocked;
only the microphone is ever granted (Android asks once); `<input type=file>` opens the system picker; blob
downloads (`<a download>`) are handed to the app through a small JS bridge and written to Downloads.
