# SAB Bogotá (IDIGER) — Android app

Standalone Android build of the SAB web app (React + Leaflet) using Capacitor.
No server is needed: sensor data comes from `app.sab.gov.co` and radar frames from
`evp.sire.gov.co`, both via native HTTP (no CORS). If the sensor API is down the
app falls back to the bundled station data, as before.

## Build the APK

**GitHub Actions (no local setup):** push this folder to a GitHub repo, open
Actions → "Build APK" → Run workflow, then download the `SAB_Bogota_IDIGER-apk`
artifact (`app-debug.apk`, debug-signed, installable).

**Locally** (Node 22, JDK 21, Android SDK):

    npm install
    npm run android:apk
    # → android/app/build/outputs/apk/debug/app-debug.apk

Install on a phone: allow "install unknown apps", then open the APK.

## Changes from the web/AI Studio version
- Removed `server.ts` (Express proxy). Radar list/frames and SAB calls are now direct.
- Live radar is the latest frame from the IDIGER list; falls back to a bundled image.
- Removed the unused AI-diagnosis, PWA-install and old MapView components
  (the diagnosis needed a server-side Gemini key; never ship that key in an APK).
- Leaflet CSS is bundled instead of loaded from unpkg.
