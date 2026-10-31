import { useEffect } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { ensureNotificationPermission } from '../services/notifications';

interface RainAlertsPlugin {
  setLocation(options: { lat: number; lng: number }): Promise<void>;
  start(): Promise<void>;
  checkNow(): Promise<void>;
}

// Native Android plugin (assets/android-native/RainAlertsPlugin.java)
const RainAlerts = registerPlugin<RainAlertsPlugin>('RainAlerts');

const FOREGROUND_CHECK_MS = 60000;

/**
 * Rain alerts as system notifications. The check itself runs natively:
 *  - in the background every ~15 minutes, even when the app is closed
 *  - every minute while the app is open
 * It uses the last location the app got from your GPS.
 * Notifies when the nearest station changes to any rain status; never for "Sin lluvia".
 */
export function useRainAlert(userLocation: { lat: number; lng: number } | null) {
  // Ask for notification permission and schedule the background job (once).
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    (async () => {
      try {
        await ensureNotificationPermission();
        await RainAlerts.start();
      } catch (e) {
        console.warn('Rain alerts setup failed', e);
      }
    })();
  }, []);

  // Keep the native side up to date with your location, and check while the app is open.
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !userLocation) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    (async () => {
      try {
        await RainAlerts.setLocation({ lat: userLocation.lat, lng: userLocation.lng });
        await RainAlerts.checkNow();
      } catch (e) {
        console.warn('Rain alerts location failed', e);
      }
      timer = setInterval(() => {
        RainAlerts.checkNow().catch(() => {});
      }, FOREGROUND_CHECK_MS);
    })();
    return () => {
      if (timer) clearInterval(timer);
    };
  // Rounded to ~11 m so small GPS jitter doesn't restart the checks
  }, [userLocation ? userLocation.lat.toFixed(4) : null, userLocation ? userLocation.lng.toFixed(4) : null]);
}
