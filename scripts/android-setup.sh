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
add_perm android.permission.POST_NOTIFICATIONS
grep -q 'screenOrientation' "$MANIFEST" || sed -i 's#<activity#<activity android:screenOrientation="portrait"#' "$MANIFEST"

# Launcher icons: pre-rendered set in assets/android-icons (adaptive XML dropped so icons are used as-is)
RES=android/app/src/main/res
if [ -d assets/android-icons ]; then cp -r assets/android-icons/. "$RES"/; else echo "No custom icons found, using defaults"; fi
rm -rf "$RES"/mipmap-anydpi-v26

# Native code: safe-area padding (camera cutout) + background rain alerts
JAVA_DIR=android/app/src/main/java/com/sabbogota/idiger
mkdir -p "$JAVA_DIR" "$RES/drawable"
cp assets/android-native/*.java "$JAVA_DIR"/
cp assets/android-native/res/drawable/*.xml "$RES/drawable"/

# WorkManager (runs the background rain check even when the app is closed)
GRADLE=android/app/build.gradle
grep -q "androidx.work:work-runtime" "$GRADLE" || \
  sed -i '0,/^dependencies {/s//dependencies {\n    implementation "androidx.work:work-runtime:2.10.0"/' "$GRADLE"
grep -q "androidx.work:work-runtime" "$GRADLE" || { echo "Could not add WorkManager dependency"; exit 1; }

# Fixed signing key in CI so every build is signed the same way and can update the installed app.
# (CI runners otherwise generate a new random debug key each run -> "package conflict" on update.)
if [ "${CI:-}" = "true" ] && [ -f assets/signing/debug.keystore ]; then
  mkdir -p "$HOME/.android"
  cp assets/signing/debug.keystore "$HOME/.android/debug.keystore"
fi

echo "Android project ready in ./android"
