/**
 * Safe localStorage wrapper.
 * Some browsers (Android private mode, certain WebViews) throw
 * SecurityError when localStorage is accessed. This module silently
 * falls back to an ephemeral in-memory store so the app still loads.
 */

const memoryStore = new Map<string, string>();

function isAvailable(): boolean {
    try {
        const key = '__storage_test__';
        localStorage.setItem(key, '1');
        localStorage.removeItem(key);
        return true;
    } catch {
        return false;
    }
}

const canUse = isAvailable();

export const safeStorage = {
    getItem(key: string): string | null {
        try {
            return canUse ? localStorage.getItem(key) : (memoryStore.get(key) ?? null);
        } catch {
            return memoryStore.get(key) ?? null;
        }
    },

    setItem(key: string, value: string): void {
        try {
            if (canUse) localStorage.setItem(key, value);
        } catch { /* swallow */ }
        memoryStore.set(key, value);
    },

    removeItem(key: string): void {
        try {
            if (canUse) localStorage.removeItem(key);
        } catch { /* swallow */ }
        memoryStore.delete(key);
    },

    clear(): void {
        try {
            if (canUse) localStorage.clear();
        } catch { /* swallow */ }
        memoryStore.clear();
    },
};

export default safeStorage;
