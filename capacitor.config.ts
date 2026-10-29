import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sabbogota.idiger',
  appName: 'SAB Bogotá',
  webDir: 'dist',
  backgroundColor: '#0f2e5a',
  plugins: {
    // Routes fetch()/XHR through native HTTP so SAB / SIRE calls ignore CORS.
    CapacitorHttp: { enabled: true },
  },
};

export default config;
