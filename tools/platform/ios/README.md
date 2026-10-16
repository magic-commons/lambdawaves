# λWAVES on iPhone and iPad: the M0 host (P04)

**The question:** can the current λWAVES bundle run inside WKWebView on iOS/iPadOS 26+ with WebGPU?
This folder holds the smallest host that can answer it: one SwiftUI window, one WKWebView, a probe page and this runbook.
It adds nothing native: no bridges, no haptics, no file bridge, no Focus layout.

| file | what it is |
|---|---|
| `LambdaWavesApp.swift` | `@main`: one `WindowGroup` with `WebView()`, full-bleed |
| `WebView.swift` | the WKWebView and its configuration, plus **the one switch** `loadMode` |
| `WebCoordinator.swift` | loads `www/` by that mode; links out to Safari; downloads to Files + share sheet; `alert`/`confirm` |
| `BundleSchemeHandler.swift` | `lambdawaves://app/…` → files in `www/`; the shared MIME table (`WWW`) |
| `LoopbackServer.swift` | GET-only HTTP/1.1 on `127.0.0.1:8765` serving `www/` (Network.framework) |
| `probe/probe.html` | the probe; copied into `www/` beside `index.html` |
| `.gitignore` | keeps `www/` and Xcode user data out of git |

## 1 · Build the bundle (on the Mac, from the repo root; repeat after any change under lab/)

```sh
node tools/build-deploy.mjs
rm -rf tools/platform/ios/www && cp -R dist tools/platform/ios/www
cp tools/platform/ios/probe/probe.html tools/platform/ios/www/probe.html
```

## 2 · Make the Xcode project (once, Xcode 26)

1. **File ▸ New ▸ Project… ▸ iOS ▸ App ▸ Next.** Product Name `LambdaWaves`, Team = your Apple ID (Personal Team; add it under Xcode ▸ Settings ▸ Accounts first), Organization Identifier `com.magiccommons`, Interface **SwiftUI**, Language **Swift**, Testing System None, Storage None. Next.
2. Save into `LAMBDAWAVES/tools/platform/ios/` and **untick "Create Git repository on my Mac"**, because the repo already exists. Xcode creates `tools/platform/ios/LambdaWaves/LambdaWaves.xcodeproj`.
3. Target **LambdaWaves ▸ General:**
   - Display Name `λWAVES`
   - Minimum Deployments **iOS 26.0**
   - Supported Destinations: iPhone and iPad for THIS proof (remove the Mac and Vision rows). The 1.0 App Store record will be **iPad-only** (Josh's call, 2026-09-24): before the store submission, remove the iPhone destination; the iPhone joins the same listing in an update once MIR Focus is ready. Apple lets an app add a device family later, never remove one, so start narrow.
4. **Signing & Capabilities:** turn on Automatically manage signing, set Team to *(you)* (Personal Team) and Bundle Identifier to `com.magiccommons.lambdawaves`. If a free team says that ID is taken, append `.josh`. A free Apple ID is enough for this proof: the app runs for 7 days per install.
5. **Replace the template code.** In the navigator, select `ContentView.swift` and `LambdaWavesApp.swift` inside the `LambdaWaves` source folder. Choose Delete ▸ Move to Trash.
   - Drag these five files from `tools/platform/ios/` in Finder onto the top **LambdaWaves** project row: `LambdaWavesApp.swift`, `WebView.swift`, `WebCoordinator.swift`, `BundleSchemeHandler.swift`, `LoopbackServer.swift`.
   - In the dialog choose Action **Reference files in place**, Groups **Create groups**, Target ✓ LambdaWaves. That keeps one copy of each file: the one in git.
   - **Build once now (⌘B), before adding `www`.** The five files were written on Linux without Xcode. If the Issue navigator shows a yellow *"Instance method … nearly matches optional requirement"* warning in `WebCoordinator.swift`, that delegate method is silently never called: copy the warning text into the acceptance row's errors field and tell Fable (the fix is usually removing `@Sendable` from that closure type). No warning = the delegates are wired.
6. **Add `www` as a FOLDER REFERENCE.** Drag `tools/platform/ios/www` onto the project row and choose Action **Reference files in place**, then **Create folder references** (or **Create folders** if that is what the dialog offers), Target ✓ LambdaWaves.
   - Select it and open the File inspector (⌥⌘1). If a **Build Rules** popup is there, set it to **Apply Once to Folder**. Otherwise Xcode 16.4+ copies the folder's *contents* flat and fails with `Multiple commands produce …/LICENSE`.
   - Check: Build Phases ▸ Copy Bundle Resources lists `www` as ONE entry.
   - If the app later says "www/index.html is not inside the app", this is the step to redo.
7. **Info keys.** Go to target ▸ **Info** ▸ Custom iOS Target Properties, hover a row and press **+**:

| key (Xcode's name) | type | value |
|---|---|---|
| `NSMicrophoneUsageDescription` (Privacy - Microphone Usage Description) | String | `λWAVES listens only when you turn on audio input.` |
| `UIFileSharingEnabled` (Application supports iTunes file sharing) | Boolean | YES |
| `LSSupportsOpeningDocumentsInPlace` (Supports opening documents in place) | Boolean | YES |
| `NSAppTransportSecurity` (App Transport Security Settings) | Dictionary | add child `NSAllowsLocalNetworking` (Allow Local Networking), Boolean, YES. Only `.loopback` needs it; the other modes are unaffected. |

Do **not** add `UIRequiresFullScreen`. The iPad window must be able to resize.

## 3 · Install on the iPad and the iPhone

1. Connect the device by cable, unlock it and tap **Trust**. On the device, turn on Settings ▸ Privacy & Security ▸ **Developer Mode**; it only appears after Xcode has seen the device, and the device restarts.
2. In Xcode, pick the device as the run destination and press **Run (⌘R)**. The first time, the device refuses the "Untrusted Developer". Go to Settings ▸ General ▸ **VPN & Device Management** ▸ your Apple ID ▸ Trust, then Run again.
3. *Optional, for exact numbers:*
   - On the device: Settings ▸ Apps ▸ Safari ▸ Advanced ▸ **Web Inspector** on.
   - On the Mac: Safari ▸ Settings ▸ Advanced ▸ *Show features for web developers*.
   - Then Safari ▸ **Develop ▸ (device) ▸ LambdaWaves** opens a console for the page (the shell sets `isInspectable`). Type `__LW.clock.t`, `__LW.background.mark`, `__e`.

## 4 · The three loading mechanisms: ONE constant

`WebView.swift`: `let loadMode: LoadMode = .fileURL`. Change it, then Run.

| mode | the page's URL | what it measures |
|---|---|---|
| `.fileURL` | `file:///…/www/probe.html?sw=0&warn=0` (`loadFileURL`, read access to `www`) | whether `file://` is a secure context and whether it allows module workers and `fetch()` |
| `.customScheme` | `lambdawaves://app/probe.html?sw=0&warn=0` (`BundleSchemeHandler`) | **whether WebKit treats a custom scheme as a secure context**; this mode exists to measure exactly that |
| `.loopback` | `http://127.0.0.1:8765/probe.html?sw=0&warn=0` (`LoopbackServer`) | loopback HTTP, which is a secure context by specification; the fallback of last resort |

**Decision rule: stop at the first mode where the app boots with WebGPU.** That means the probe shows isSecureContext, navigator.gpu, an adapter, both workers "answered" and both fetches 200, and the app then draws the field. Record every mode you tried as its own acceptance row.

- Each mode is its own origin, so storage does not carry between modes: the probe's visit counter starting again at #1 after a switch is not a failure. `8765` is fixed for the same reason.
- `entryPage = "probe.html"` opens the probe at every launch. Set it to `"index.html"` to boot straight into the app once the verdict is in.
- If `.fileURL` shows "load failed", set `appQuery = ""` and write "file URL refused the query" in NOTE. WebKit rejected the query, and under `file://` there is no service worker to decline anyway.
- `?warn=0` is honoured only under automation, so the photosensitivity pane appears once per origin. Tap CONTINUE.

## 5 · The device run: once on the iPad, once on the iPhone, per mode tried

Tick ☐ → ☒. "Menubar" means the app's top bar (FILE · EDIT · VIEW · WINDOW · ABOUT).

| # | do this | look for | iPad | iPhone | NOTE |
|---|---|---|---|---|---|
| a | Launch: the **probe** opens. Wait for `"done": true` at the end of the JSON, then tap **copy JSON** (or **share JSON**) and paste it into a note to yourself | isSecureContext true · navigator.gpu true · adapter not fallback · both workers answered · both fetches 200 | ☐P ☐F | ☐P ☐F | |
| b | Tap **open the app**, then CONTINUE on the photosensitivity pane. Take a screenshot | the field renders; no "boot failed" banner | ☐P ☐F | ☐P ☐F | |
| c | Menubar WINDOW ▸ NOTEBOOK, then the notebook's ▤ (projects) button ▸ DEMOS **WAVE DANCER**. Then WINDOW ▸ **METERS** (on the iPhone first WINDOW ▸ HIDE / SHOW the rack). If METERS says IDLE, press PLAY (EDIT ▸ PLAY / PAUSE) | fps = first number of **CLOCKS Hz** after ~10 s; FIELD CACHE shows the grid in use | ☐P ☐F | ☐P ☐F | fps @64³: |
| c′ | ABOUT ▸ SETTINGS… ▸ FIELD QUALITY ▸ **GRID 96** | fps again. Phone-width layouts force 64³: if GRID snaps back to 64, write "phone forces 64" | ☐P ☐F | ☐P ☐F | fps @96³: |
| d | Relaunch, then on the probe tap **app + readout** (the app with a live readout box). CONTINUE, PLAY, wait for fps > 0. Go to the Home Screen, wait **60 s** by a clock, then come back | the readout line `clock.t at hide … · at return … · Δ …` shows **Δ 0.00** and `away ≈ 60 s`; clock.t climbs again; `field.ok true`. Screenshot the box. A page saying "The web content process ended" on return is a FAIL (iOS killed the page in the background). Without the frame: METERS **t LOGICAL** before and after continues from where it stopped | ☐P ☐F | ☐P ☐F | Δclock.t: |
| e | In the app: FILE ▸ SAVE project AS… (name it) ▸ then FILE ▸ **EXPORT project (.json)** | a **share sheet** appears (Save to Files works); the Files app ▸ On My iPad/iPhone ▸ λWAVES holds `<name>.lambdawaves.json` | ☐P ☐F | ☐P ☐F | |
| e′ | FILE ▸ **IMPORT project (.json)…** and pick that file | the **Files picker** opens; the notebook says `imported <name>`. (The probe's download test and file input test use the same paths) | ☐P ☐F | ☐P ☐F | |
| f | Rotate. On the iPad, use Stage Manager or Split View to resize the window to about **a third** of the screen | layout reflows; nothing hides under the notch or home bar; the app stays usable. A narrow window switches to the phone layout | ☐P ☐F | ☐P ☐F | |
| g | Wait 5 s after saving. Swipe the app away in the app switcher and relaunch | probe: `localStorage visit #N (persisted)` and app settings/projects > 0 B. App: the project is in PROJECTS, GRID and theme are as you left them, and the warning pane does not return | ☐P ☐F | ☐P ☐F | |

Errors: the readout's `errors N · <last>` line, or `__e` in Web Inspector.

## 6 · Acceptance row: one line per device per mode

```
date · device · iOS · Xcode · git sha/tag · dist file count · load mode · isSecureContext · navigator.gpu · adapter description · fallback? · worker ok · fetch ok · storage persisted · download behaviour · file input behaviour · fps default / 96³ · background 60 s: Δclock.t · resize/rotate · errors · verdict
```

- git sha/tag: `git rev-parse --short HEAD; git describe --tags`
- dist file count: `find tools/platform/ios/www -type f | wc -l`

**Verdict:**
- **BOOTS:** WebGPU, workers, fetch and storage all OK, Δclock.t = 0.
- **DEGRADED:** it boots, but one path fails (download, file input, fps < 30, resize).
- **FAILS:** no WebGPU or no boot. Move to the next mode.

## 7 · What the shell does not do (M0, by design)

- ABOUT's LICENSE/NOTICE/OFL links (`target=_blank`, same origin) open nothing, because there is no second window. External links (RETURN HOME, credits) open in Safari.
- There is no service worker (`sw=0`). An exported file is also kept in the app's Documents folder, which Files shows because of the two keys above.
- If iOS takes back the loopback socket while the app is in the background, `.loopback` listens again on the same port.
