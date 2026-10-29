import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

let pending: Promise<void> | null = null;

/**
 * Asks for notification permission (Android 13+) and resolves when the person has
 * answered. Runs once per app start. Other permission prompts (like GPS) should wait
 * for this, because Android can only show one permission dialog at a time.
 */
export function ensureNotificationPermission(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return Promise.resolve();
  if (!pending) {
    const ask = (async () => {
      try {
        const status = await LocalNotifications.checkPermissions();
        if (status.display === 'prompt' || status.display === 'prompt-with-rationale') {
          await LocalNotifications.requestPermissions();
        }
      } catch (e) {
        console.warn('Notification permission request failed', e);
      }
    })();
    // Never block the app for more than a minute.
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 60000));
    pending = Promise.race([ask, timeout]);
  }
  return pending;
}
