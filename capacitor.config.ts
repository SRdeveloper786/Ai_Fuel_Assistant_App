import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aifuelassistant.app',
  appName: 'AI Fuel Assistant',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
