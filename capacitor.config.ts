import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.arcanawhisper.app',
    appName: 'Arcana Whisper',
    webDir: 'dist',
    ios: {
        contentInset: 'never',
        preferredContentMode: 'mobile',
        backgroundColor: '#0a0612',
        allowsLinkPreview: false,
        scrollEnabled: false,
    },
};

export default config;
