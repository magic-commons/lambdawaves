#!/usr/bin/env bash
# build.sh — regenerate the TWA Android project from twa-manifest.json, build signed APK + AAB into out/.
set -euo pipefail
cd "$(dirname "$0")"
BW=(npx --yes @bubblewrap/cli@1.25.0)
JDK="$(node -p "require(require('os').homedir()+'/.bubblewrap/config.json').jdkPath")"
KS=local/upload.keystore; ALIAS=lambdawaves-upload
[ -f "$KS" ] || { echo "no $KS — create it once (README §1.2); never regenerate a key Play already knows" >&2; exit 2; }
PW="$(cat local/KEYSTORE-PASSWORD.txt)"
export BUBBLEWRAP_KEYSTORE_PASSWORD="$PW" BUBBLEWRAP_KEY_PASSWORD="$PW"
"${BW[@]}" update --skipVersionUpgrade        # regenerates app/, gradle files, manifest-checksum.txt; no prompts
"${BW[@]}" build                              # checksum matches, passwords from env: no prompts
mkdir -p out && cp -f app-release-signed.apk app-release-bundle.aab out/
FP="$("$JDK/bin/keytool" -list -v -keystore "$KS" -alias "$ALIAS" -storepass "$PW" | sed -n 's/^\s*SHA256: //p')"
grep -q "$FP" assetlinks.json && echo "assetlinks.json matches $FP" || { echo "assetlinks.json does NOT carry $FP" >&2; exit 3; }
