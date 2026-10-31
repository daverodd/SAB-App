import { Capacitor, registerPlugin } from '@capacitor/core';

export interface RainAlertsPlugin {
  setLocation(options: { lat: number; lng: number }): Promise<void>;
  start(): Promise<void>;
  checkNow(): Promise<void>;
  diagnose(): Promise<{
    notificationsEnabled: boolean;
    lat: string;
    lng: string;
    time: number;
    rain: string;
    weather: string;
  }>;
}

// Native Android plugin (assets/android-native/RainAlertsPlugin.java)
export const RainAlerts = registerPlugin<RainAlertsPlugin>('RainAlerts');

/** Runs a check immediately and returns a readable report. */
export async function diagnoseNotifications(): Promise<string> {
  if (!Capacitor.isNativePlatform()) return 'Solo disponible en la app de Android.';
  try {
    const r = await RainAlerts.diagnose();
    return [
      `Notificaciones permitidas: ${r.notificationsEnabled ? 'sí' : 'NO'}`,
      `Ubicación guardada: ${r.lat}, ${r.lng}`,
      `Última revisión: ${r.time ? new Date(r.time).toLocaleTimeString() : 'nunca'}`,
      `Lluvia: ${r.rain}`,
      `Temp/Humedad: ${r.weather}`,
    ].join('\n');
  } catch (e) {
    return 'Error al ejecutar el diagnóstico: ' + String(e);
  }
}
