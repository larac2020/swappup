import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.swappup.app',
  appName: 'swappup',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
      backgroundColor: '#0e1116',
    },
  },
};

export default config;
