# SteamPipe: uploading a λWAVES build from this Linux box

The syntax comes from https://partner.steamgames.com/doc/sdk/uploading, read 2026-09-24. That page's example command is `steamcmd.exe +login <account_name> <password> +run_app_build ..\scripts\simple_app_build.vdf +quit`. It says the depot scripts can be separate files, as they are here, or inline in the app build. It also says the Steamworks SDK ships a Linux builder in `tools/ContentBuilder/builder_linux/`.

## 1 · steamcmd on Linux, once

**Route A: the SDK's own copy.** This is the one Valve's upload page describes. Download the Steamworks SDK zip from Steamworks ▸ the SDK download link, unzip it anywhere outside the repo, then:

```sh
cd <sdk>/tools/ContentBuilder/builder_linux
chmod +x steamcmd.sh linux32/steamcmd
./steamcmd.sh +quit          # first run self-updates
```

**Route B: the standalone tarball.** The URL answered HTTP 200, 2,428,561 bytes, on 2026-09-24:

```sh
mkdir -p ~/steamcmd && cd ~/steamcmd
curl -sqL "https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz" | tar zxvf -
./steamcmd.sh +quit
```

steamcmd is a 32-bit program. If it fails with a missing `libgcc_s.so.1` or similar, the 32-bit runtime is missing, and installing it needs sudo. On Ubuntu that is `sudo apt install lib32gcc-s1`. **That line was not verified from Valve's wiki**, whose SteamCMD page refused automated reads on 2026-09-24. The apt route (`dpkg --add-architecture i386` plus the `steamcmd` package from multiverse) is Ubuntu's own packaging. On this box `apt-cache policy steamcmd` shows no candidate, so it would need multiverse and i386 enabled first.

## 2 · Every upload

1. Build the host in the main checkout: `cd ~/Documents/LAMBDAWAVES/shells/electron && npm ci && npm run package`. It writes `out/lambdawaves-desktop-win32-x64/` and `out/build-identity.json`.
2. Fill `Desc` in `app_build.vdf` from `build-identity.json` (tag and sha).
3. Do a dry run with `"Preview" "1"`, then a real upload with `"Preview" "0"`:

```sh
cd ~/steamcmd        # or <sdk>/tools/ContentBuilder/builder_linux
./steamcmd.sh +login <steam_build_account> +run_app_build ~/Documents/LAMBDAWAVES/store/steam/steampipe/app_build.vdf +quit
```

Leave the password off the command line and steamcmd asks for it, which keeps it out of shell history. On the first login, Steam Guard mails a code. The upload page says to enter it with `set_steam_guard_code <code>` and log in again.

4. In Steamworks ▸ SteamPipe ▸ Builds, set the uploaded build live on the `default` branch by hand (`SetLive` is left empty on purpose).
5. Launch options, once, in Steamworks ▸ Installation ▸ General: Windows executable `lambdawaves-desktop.exe`, no arguments. Add Linux (`lambdawaves-desktop`) only when the Linux depot is enabled.
