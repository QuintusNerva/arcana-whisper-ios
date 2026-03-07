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
    plugins: {
        SplashScreen: {
            launchAutoHide: true,
            launchShowDuration: 2000,
            backgroundColor: '#0a0612',
            showSpinner: false,
            androidScaleType: 'CENTER_CROP',
            splashFullScreen: true,
            splashImmersive: true,
        },
    },
};

export default config;
