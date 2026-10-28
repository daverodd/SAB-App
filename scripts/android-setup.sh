#!/usr/bin/env bash
# Generates/refreshes the native Android project from the built web app (dist/).
set -euo pipefail
cd "$(dirname "$0")/.."

[ -d dist ] || { echo "Run 'npm run build' first"; exit 1; }
[ -d android ] || npx cap add android
npx cap sync android

MANIFEST=android/app/src/main/AndroidManifest.xml
add_perm() { grep -q "$1" "$MANIFEST" || sed -i "s#<application#<uses-permission android:name=\"$1\" />\n    <application#" "$MANIFEST"; }
add_perm android.permission.ACCESS_FINE_LOCATION
add_perm android.permission.ACCESS_COARSE_LOCATION
grep -q 'screenOrientation' "$MANIFEST" || sed -i 's#<activity#<activity android:screenOrientation="portrait"#' "$MANIFEST"

# Launcher icons: use the app's own PNG (legacy icons; drop adaptive XML so it isn't cropped)
RES=android/app/src/main/res
for d in mdpi:48 hdpi:72 xhdpi:96 xxhdpi:144 xxxhdpi:192; do
  dir="$RES/mipmap-${d%%:*}"; mkdir -p "$dir"
  cp public/pwa-192x192.png "$dir/ic_launcher.png"
  cp public/pwa-192x192.png "$dir/ic_launcher_round.png"
  cp public/pwa-192x192.png "$dir/ic_launcher_foreground.png"
done
rm -rf "$RES"/mipmap-anydpi-v26
echo "Android project ready in ./android"
