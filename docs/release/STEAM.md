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
| `lambdawaves-win32-x64/` | `lambdawaves.exe` | Electron, `resources/app.asar` (the host: three files), `resources/dist/` (the app: the site's bytes less the credits strip's files, below) |
| `lambdawaves-linux-x64/` | `lambdawaves` | the same, for Linux and SteamOS |

Each folder's root holds `COPYING` (λWAVES' GPL-3.0), `NOTICE`, `SOURCE.md` (the tag and commit it was built from), and Electron's own
`LICENSE` and `LICENSES.chromium.html`. They must stay. `out/build-identity.json` names the commit and the `dist/` hash: put the commit in
the build's description on Steam, and attach the source archive to the matching GitHub Release (GPL §6).

**No AI marks on the desktop** (044 S1, Josh 11-12: "steam version does not show logo"). The MAIN MENU's credits strip (the three marks of
Claude, Gemini and GPT) is not built when the page runs in the desktop host (`window.lwavesDesktop`, the same signal that hides UPDATE
APP), and `package.mjs` removes `img/ai/` and `img/menu/ai/` (the marks, Google Sans Flex, and OpenAI Sans, which has no licence in the
tree) from each folder's `resources/dist/`. ABOUT still says in words that AI coding agents built the app. The site is unchanged.
The same signal leaves two more things unbuilt on the desktop (044 S5, S7, Josh 11-12): the MIR wordmark in the MAIN MENU's bottom-right
corner, and the tip jar (EXPANSIONS' ko-fi card and the "tip?" sheet before an install); `package.mjs` removes `img/menu/tip-qr.svg` too.

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

- [ ] The publishing identity ([`LEGAL-PROVENANCE.md`](LEGAL-PROVENANCE.md) §5 item 4). Answered 2026-11-12 for the program: the
      `.exe`'s company name is `MAGIC COMMONS` and its copyright line `Copyright 2026 MAGIC COMMONS` (044 S2, S6, `package.mjs`
      `MAKER`). Since 044 R7 (Josh 11-13: "MAGIC COMMONS all.") the `NOTICE` file in the folder, the README's licence line and ABOUT name
      MAGIC COMMONS as the copyright holder too; the author stays a person (`CITATION.cff`, the README's disclosure). Still yours: whether the Steam partner account, the store page's developer and publisher, and the tax and
      bank details are in that name too.
- [ ] The partner site: the app, two depots, the launch options above, the AI disclosure, the store page, the price.
- [ ] The Windows GPU run on your PC. The folder is built (044 S4, 2026-11-12, on Linux; the download you approved is done and
      cached): `out/lambdawaves-win32-x64/`, 495,882,235 B, 1,901 files, rebuilt from commit `69476b0f` (044 S5–S9). Checked here without running it: the
      `.exe` is a 64-bit Windows program whose version resource reads CompanyName `MAGIC COMMONS`, ProductName and FileDescription
      `λWAVES`, version `0.9.9-beta`, LegalCopyright `Copyright 2026 MAGIC COMMONS`; `resources/dist/` is byte-identical to the Linux
      package's (which passes its 17 checks); no AI mark and no OpenAI or Google face is in it. **Never started: no Windows machine
      and no wine here.** On the PC, copy the folder over and: start `lambdawaves.exe` from the folder (right-click › Properties ›
      Details shows MAGIC COMMONS twice), then from Steam; the notice, the loader once, the MAIN MENU with nothing in its two bottom
      corners, EXPANSIONS with no tip jar, the field
      drawing on the GPU, a project saved / quit / relaunched, AUDIO with the microphone, a MIDI controller, a film rendered with the
      window minimised, FOLDERS › EXPORT saving a file, F11 and FULL, the overlay (Shift+Tab) on and off.
- [ ] The Linux install from Steam and the sandbox answer (§4); the Deck (§5).
- [ ] A 30-minute real session on each, then a row in [`ACCEPTANCE-MATRIX.md`](ACCEPTANCE-MATRIX.md).
- [ ] The volumes: VOL. I and II as two free add-ons, VOL. III later (answered 2026-11-12). Still yours: the Steamworks steps of §8.

## 8. The volumes: two free add-ons (VOL. I, VOL. II); VOL. III is held back

Josh, 2026-11-12: "Just release Volume 1 and 2 for now. Vol 3 will be a post release expansion", and, asked how they reach a player,
"As free add-ons". `lab/volumes.js` `HELD = ['vol-3']` keeps VOL. III off the shelf on every host; releasing it is deleting that id.

**Build the folders** (one command, about three minutes):

```bash
node package.mjs --depots -- --shelf ~/Documents/LAMBDAWAVES-VOLUMES/dist/volumes.json --ship vol-1,vol-2
```

| folder in `out/` | what it is | size (2026-11-12) |
|---|---|---|
| `lambdawaves-win32-x64/`, `lambdawaves-linux-x64/` | the game, with no volume in it | 496 MB / 407 MB |
| `lambdawaves-vol-1/` | VOL. I's depot: `resources/dist/volumes/vol-1/` (6,927 molecules) | 14,277 files, 6.06 GB |
| `lambdawaves-vol-2/` | VOL. II's depot: `resources/dist/volumes/vol-2/` (4,616 molecules) | 4,948 files, 5.85 GB |

A volume's folder is the same for Windows and Linux. It carries its own shelf entry (`volume.json`) beside its catalogue, and the
desktop host answers the shelf from the folders that are present (`main.cjs` `shelf()`), so:

- a player without an add-on does not see that volume at all; with none, EXPANSIONS says "No volume is installed. The volumes are free
  add-ons on Steam." A card for a volume that is not there was not built: its only honest button would open the add-on's Steam page,
  and that address does not exist until the add-on does;
- a volume that is there is INSTALLED as it stands: its card reads INSTALLED and has nothing to press, nothing is copied into
  `CacheStorage`, the lookup's search finds its molecules, and MOLECULES' pages and extra rungs read it. Removing it is Steam's
  (untick the add-on); it is gone from the shelf at the next launch.

Without `--depots` the same command leaves the volumes inside both game folders (12 GB each) and they behave the same way.

**In Steamworks** (yours; nothing here can do it):

1. On the game's app page, *All Associated Packages, DLC, Demos and Tools* › *Add New DLC*, twice: "λWAVES — VOL. I" and "VOL. II".
   Set each to Free. Each needs its own small store page (a capsule image and a sentence) and goes through review with the game.
2. *SteamPipe › Depots*: add one depot per add-on, no operating system set (the files are the same for both), and assign each depot
   to its DLC. Then the DLC's package must include its depot.
3. Add the two depots to `app_build_<APPID>.vdf` beside the game's two, each with its own `depot_build_<DEPOT>.vdf` whose `ContentRoot`
   is `…/out/lambdawaves-vol-1/` (or `-vol-2/`) and the same `FileMapping` as §2. The files land in the game's install folder under
   `resources/dist/volumes/vol-N/`, which is where the app looks.
4. Test on the PC: with neither add-on, the shelf's sentence; tick VOL. I in the game's Properties › DLC, let it download (6 GB),
   start: one card, INSTALLED; open it, open a molecule; tick VOL. II; untick one and see it go.

Proved here on the packaged Linux app in three states (ACCEPTANCE-MATRIX, 2026-11-12): no volume folder, VOL. I alone, VOL. I and II.
Not proved: anything on Steam itself, and Windows.

VOL. II's pictures: all six looks and the diagrams were drawn on 11-05/06 as page sheets (47 pages, none missing). The build used to
mark it WIP because its catalogue names no per-molecule picture file; `build-deploy` now counts a molecule's cell in the `density`
sheet as its picture (044 S9), so VOL. II's card has no WIP mark.
