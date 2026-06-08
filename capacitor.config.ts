import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.globcom.erp',
  appName: 'GlobCom',
  webDir: 'public',
  backgroundColor: '#0B0F19', // ⚡ FIX: Paints the raw native Apple/Android background dark
  server: {
    url: 'https://www.harjot.ae',
    cleartext: true,
  }
  // ⚡ FIX: Removed the `ios: { contentInset: 'always' }` block so the app reaches the physical edges
};

export default config;