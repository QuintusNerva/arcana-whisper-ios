/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_OPENROUTER_API_KEY: string;
    readonly VITE_GOOGLE_API_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

// Google Maps JS SDK — loaded dynamically by geocoding.service.ts
declare var google: any;
