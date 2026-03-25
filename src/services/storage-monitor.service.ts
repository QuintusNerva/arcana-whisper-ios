/**
 * Storage Monitor — localStorage Quota Awareness
 * ────────────────────────────────────────────────
 * iOS WebViews cap localStorage at 5-10MB.
 * This utility monitors usage and warns before hitting the limit.
 */

import { safeStorage } from './storage.service';

const STORAGE_WARNING_KEY = 'storage_warning_shown';
const WARNING_THRESHOLD_BYTES = 4 * 1024 * 1024; // 4MB — warn at ~80% of 5MB limit

/**
 * Estimate total localStorage usage in bytes.
 */
export function getStorageUsageBytes(): number {
    let total = 0;
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                total += key.length * 2; // UTF-16
                const val = localStorage.getItem(key);
                if (val) total += val.length * 2;
            }
        }
    } catch {
        return -1; // Can't measure
    }
    return total;
}

/**
 * Get human-readable storage usage.
 */
export function getStorageUsage(): { usedMB: string; percentage: number; isWarning: boolean } {
    const bytes = getStorageUsageBytes();
    if (bytes < 0) return { usedMB: 'Unknown', percentage: 0, isWarning: false };

    const usedMB = (bytes / (1024 * 1024)).toFixed(2);
    const percentage = Math.round((bytes / (5 * 1024 * 1024)) * 100); // Assume 5MB limit
    const isWarning = bytes > WARNING_THRESHOLD_BYTES;

    return { usedMB, percentage, isWarning };
}

/**
 * Check storage quota and log warning if approaching limit.
 * Call periodically (e.g., on app init or after saving data).
 */
export function checkStorageQuota(): { ok: boolean; usedMB: string; percentage: number } {
    const usage = getStorageUsage();

    if (usage.isWarning) {
        const alreadyWarned = safeStorage.getItem(STORAGE_WARNING_KEY);
        const today = new Date().toISOString().slice(0, 10);
        if (alreadyWarned !== today) {
            if (import.meta.env.DEV) {
                console.warn(`[STORAGE] Usage at ${usage.usedMB}MB (${usage.percentage}%) — approaching limit`);
            }
            safeStorage.setItem(STORAGE_WARNING_KEY, today);
        }
    }

    return { ok: !usage.isWarning, usedMB: usage.usedMB, percentage: usage.percentage };
}

/**
 * Purge old cached AI interpretations to free space.
 * Removes interpretations older than `daysToKeep` days.
 */
export function purgeOldCaches(daysToKeep = 30): number {
    let freed = 0;
    const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

    // Purge daily cache entries
    try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (!key) continue;
            // Target cached AI responses and daily caches
            if (key.startsWith('daily_cache_') || key.startsWith('energy_interpretation')) {
                const raw = localStorage.getItem(key);
                if (raw) {
                    try {
                        const parsed = JSON.parse(raw);
                        if (parsed.timestamp && parsed.timestamp < cutoff) {
                            localStorage.removeItem(key);
                            freed++;
                        }
                    } catch {
                        // Not JSON — old format, safe to remove
                        localStorage.removeItem(key);
                        freed++;
                    }
                }
            }
        }
    } catch {
        // Storage access error
    }

    return freed;
}
