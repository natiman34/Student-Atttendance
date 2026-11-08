import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rollcall.attendance',
  appName: 'RollCall',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
