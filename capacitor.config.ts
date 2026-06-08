import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.globcom.erp',
  appName: 'GlobCom',
  webDir: 'public', // This is ignored because we are using the live server below
  server: {
    // ⚡ This points the native app directly to your live Next.js build
    url: 'https://www.harjot.ae',
    cleartext: true,
  },
  ios: {
    contentInset: 'always',
  }
};

export default config;