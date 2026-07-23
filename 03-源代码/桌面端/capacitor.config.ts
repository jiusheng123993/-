import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.xinghuanhai.app',
  appName: '星寰海',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    buildToolsVersion: '33.0.0',
    minSdkVersion: 22,
    targetSdkVersion: 34,
    useAndroidX: true,
    allowMixedContent: true
  },
  ios: {
    minVersion: '13.0'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: '#1a1a2e',
      splashFullScreen: true,
      splashImmersive: true
    }
  }
}

export default config
