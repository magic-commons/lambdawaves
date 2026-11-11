# λWAVES on Steam

For Josh: what to upload, how SteamPipe takes it, and what only you can do. Steam is the store and SteamPipe the uploader, nothing more:
the Steamworks SDK is not linked into the app (GPL; [`LEGAL-PROVENANCE.md`](LEGAL-PROVENANCE.md) §3), so there are no achievements, no
overlay calls, no Steam Cloud API and no DRM wrapper. An agent prepares; you upload and press the buttons.

## 1. Build the two folders

```bash
cd tools/platform/electron
npm ci                                   # once: the pinned Electron 44.10.0 and @electron/packager 20.3.0 (install scripts are off)
node node_modules/electron/install.js    # once, if the Electron binary is missing (install scripts are off)
node package.mjs                         # both; or --platform linux / --platform win32 for one
node smoke-run.mjs --packaged            # the Linux package, 17 checks, one acceptance row
```

The output, in `tools/platform/electron/out/`:

| folder | launch | what is inside |
|---|---|---|
| `lambdawaves-win32-x64/` | `lambdawaves.exe` | Electron, `resources/app.asar` (the host: three files), `resources/dist/` (the app, the same bytes as the site) |
| `lambdawaves-linux-x64/` | `lambdawaves` | the same, for Linux and SteamOS |

Each folder's root holds `COPYING` (λWAVES' GPL-3.0), `NOTICE`, `SOURCE.md` (the tag and commit it was built from), and Electron's own
`LICENSE` and `LICENSES.chromium.html`. They must stay. `out/build-identity.json` names the commit and the `dist/` hash: put the commit in
the build's description on Steam, and attach the source archive to the matching GitHub Release (GPL §6).

Packaging Windows on Linux needs nothing but the Electron zip, which the packager downloads once (about 160 MB from GitHub, checksummed)
into `~/.cache/electron`. The `.exe` is not code-signed: Steam does not need it, and a game started from Steam gets no SmartScreen prompt.

## 2. SteamPipe

In the partner site make two depots: one for Windows (Operating System: Windows) and one for Linux (Linux + SteamOS). Then, beside
SteamPipe's ContentBuilder (`steamcmd`), two small files per depot and one for the app. `<APPID>`, `<DEPOT_WIN>`, `<DEPOT_LINUX>` are the
numbers the partner site gives you; the paths are absolute.

`app_build_<APPID>.vdf`

```
"AppBuild"
{
	"AppID" "<APPID>"
	"Desc" "λWAVES <version> · <commit>"
	"BuildOutput" "/home/<you>/steam-build/output/"
	"SetLive" ""
	"Depots"
	{
		"<DEPOT_WIN>" "depot_build_<DEPOT_WIN>.vdf"
		"<DEPOT_LINUX>" "depot_build_<DEPOT_LINUX>.vdf"
	}
}
```

`depot_build_<DEPOT_WIN>.vdf` (the Linux one is the same with its id and `lambdawaves-linux-x64`)

```
"DepotBuild"
{
	"DepotID" "<DEPOT_WIN>"
	"ContentRoot" "/home/<you>/Documents/LAMBDAWAVES/tools/platform/electron/out/lambdawaves-win32-x64/"
	"FileMapping"
	{
		"LocalPath" "*"
		"DepotPath" "."
		"Recursive" "1"
	}
}
```

Upload: `steamcmd +login <your Steam login> +run_app_build /home/<you>/steam-build/app_build_<APPID>.vdf +quit`. `SetLive` stays empty:
you put the build live on a branch in the partner site after you have run it.

**Launch options** (Installation › General): Windows, executable `lambdawaves.exe`, no arguments. Linux + SteamOS, executable
`lambdawaves`, no arguments, unless the sandbox test of §4 says otherwise.

## 3. Where a player's work lives

The desktop app is served from its own address, `https://lambdawaves.localhost` (answered by the app itself, never the network), and keeps
everything in one folder outside the install folder, so a Steam update never touches it:

| | Windows | Linux / SteamOS |
|---|---|---|
| the folder | `%APPDATA%\lambdawaves` | `~/.config/lambdawaves` |
| settings, projects, FOLDERS, the notebook | `Local Storage/leveldb/` | same |
| the menu's pictures, the 47 records, installed volumes (re-creatable, large) | `Service Worker/CacheStorage/` | same |
| RENDER's films in progress | `File System/` | same |
| the window's size and place | `window.json` | same |

That address is the storage key: it must never change after the first build ships. **Steam Cloud** needs no SDK (Auto-Cloud is set by
path in the partner site): root `WinAppDataRoaming` and `LinuxXdgConfigHome`, subdirectory `lambdawaves/Local Storage/leveldb`, pattern
`*`. Leave it off for the first release: LevelDB's files are one set, and syncing them between two machines is untested. FOLDERS' export
(`.lambdawaves.json`) is the backup a player can carry.

## 4. Linux: the sandbox (must be tested on a real Steam install)

Chromium wants a sandbox for its page processes. It has two: a setuid helper (`chrome-sandbox`, which must be owned by root — Steam
installs every file as the player, so it never is) and unprivileged user namespaces. Known: on Ubuntu 24.04 and later AppArmor blocks
unprivileged user namespaces (`kernel.apparmor_restrict_unprivileged_userns = 1`, true on this workstation), so with neither, Chromium
stops at launch with "No usable sandbox!" — every run here used `--no-sandbox`. Not known: whether Steam's own runtime (scout by default;
the "Steam Linux Runtime 3.0 (sniper)" container if you pick it) allows the user-namespace sandbox, and what SteamOS on the Deck does. Test:
install from Steam on Ubuntu and on the Deck, launch; if it does not start, the Linux launch option gets the argument `--no-sandbox` (the
page process then runs unsandboxed; it loads only the app's own files and the https pictures a notebook names).

## 5. Steam Deck

Not yet run on one. What to expect: the Deck runs the Linux depot (do not force Proton). Game Mode shows the window full screen at
1280 × 800. The app reads no gamepad: Steam Input's desktop layout (right trackpad as the mouse, triggers as clicks, Steam + X for the
keyboard) is what drives it, and a published controller layout can bind PLAY (Space), FULL (F) and the rest. Touch works as a pointer.
WebGPU on the Deck's AMD GPU under Chromium 152 is unmeasured. Without it the lab shows the banner "WebGPU unavailable · no WebGPU adapter.
The FIELD needs WebGPU; SPECTRUM, SHADOW and METERS still run on the CPU" (measured here with `--disable-gpu`), not a black window. Check
the UI SCALE at 1280 × 800.

## 6. The store page

The content survey's AI disclosure, as [`LEGAL-PROVENANCE.md`](LEGAL-PROVENANCE.md) §3 requires: **"Pre-generated: artwork and icons
(the mark, the warning sign, icon work) were made with Google's Gemini under the author's direction; the menu's pictures and films are
renders of the app itself. The app generates nothing with AI at run time."** Code assistance is not surveyed content.

## 7. What only you can do

- [ ] Decide the publishing identity before the app record exists ([`LEGAL-PROVENANCE.md`](LEGAL-PROVENANCE.md) §5 item 4). The `.exe`'s
      company name is NOTICE's copyright holder (`Joshua Hosain`); a Magic Commons entity changes that line of NOTICE and nothing else.
- [ ] The partner site: the app, two depots, the launch options above, the AI disclosure, the store page, the price.
- [ ] `node package.mjs --platform win32` (one download), then the Windows GPU run on your PC: start from the folder, then from Steam;
      the notice, the loader once, a project saved / quit / relaunched, AUDIO with the microphone, a MIDI controller, a film rendered with
      the window minimised, FOLDERS › EXPORT saving a file, F11 and FULL, the overlay (Shift+Tab) on and off.
- [ ] The Linux install from Steam and the sandbox answer (§4); the Deck (§5).
- [ ] A 30-minute real session on each, then a row in [`ACCEPTANCE-MATRIX.md`](ACCEPTANCE-MATRIX.md).
- [ ] The volumes: how VOL. I–III reach a Steam player (§8) — your call.

## 8. The volumes (VOL. I–III)

Today the desktop build carries no shelf, so LIBRARY says no volumes are published and has no road to install one. Three ways:

1. **In the base depot.** `node package.mjs -- --shelf ~/Documents/LAMBDAWAVES-VOLUMES/dist/volumes.json --ship vol-1,vol-3` puts VOL. I
   (5.7 GB) and VOL. III (152 MB) in `resources/dist/volumes/`; their molecules then open straight from the disk. INSTALL would copy
   them again into `CacheStorage` (twice the disk), so the app should treat a volume it serves itself as installed (a small change to
   `lab/volumes.js`, not made).
2. **One DLC per volume.** Each volume is its own depot into `resources/dist/volumes/vol-N/`; Steam delivers a DLC's depot only to its
   owners, so no SDK is needed. The shelf (`volumes.json`) must then list only the volumes present: the host can write it from the folders
   it finds (not built yet).
3. **Downloaded.** Refused: the desktop makes no network call of its own, and the site's policy forbids it.
