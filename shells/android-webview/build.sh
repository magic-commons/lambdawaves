#!/usr/bin/env bash
# build.sh — P08 WebView host proof: bundle dist/ + the probe into assets/www, build a debug APK into out/.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/../.." && pwd)"
export JAVA_HOME="${JAVA_HOME:-$(ls -d "$HOME"/.bubblewrap/jdk/jdk-17*/ | head -1)}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/.bubblewrap/android_sdk}"
# (a) the bundle: build it only if missing
[ -f "$ROOT/dist/index.html" ] || (cd "$ROOT" && node tools/build-deploy.mjs --quiet)
# (b) generated assets: dist/ + the iOS probe copied verbatim beside index.html
WWW="$HERE/app/src/main/assets/www"
rm -rf "$WWW" && mkdir -p "$WWW"
cp -a "$ROOT/dist/." "$WWW/"
rm -f "$WWW/_headers" "$WWW/_redirects"        # Cloudflare-only files, never served here
cp "$ROOT/shells/ios/probe/probe.html" "$WWW/probe.html"
# (c) debug-signed APK (sideload proof)
cd "$HERE" && ./gradlew --no-daemon -q assembleDebug
mkdir -p out && cp -f app/build/outputs/apk/debug/app-debug.apk out/lambdawaves-webview-debug.apk
ls -l out/lambdawaves-webview-debug.apk
