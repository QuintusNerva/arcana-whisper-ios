/**
 * Cosmic Notifications Service
 * ─────────────────────────────
 * Uses Capacitor Local Notifications to schedule notifications for:
 *  - Year Ahead key dates (transit exact hits)
 *  - Eclipse activations
 *  - Birthday / Solar Return celebration
 *
 * Designed for iOS via Capacitor. Falls back gracefully
 * to browser Notification API when running in the browser.
 *
 * iOS limit: 64 pending local notifications.
 * Typical usage: ~15 key dates + ~4 eclipses + 1 birthday + 12 monthly = ~32
 */

import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { safeStorage } from './storage.service';
import type { YearAheadReport } from './year-ahead.service';

// ══════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════

const NOTIF_STORAGE_KEY = 'arcana_scheduled_notifs';
const NOTIFICATION_HOUR = 9;  // 9 AM local time
const NOTIFICATION_MINUTE = 0;

/** ID ranges to avoid collision */
const ID_KEY_DATE_START = 10000;
const ID_ECLIPSE_START = 11000;
const ID_BIRTHDAY = 12000;
const ID_MONTHLY_START = 13000;

// ══════════════════════════════════════
// PERMISSION
// ══════════════════════════════════════

/**
 * Request notification permission (iOS requires explicit permission).
 * Returns true if granted.
 */
export async function requestCosmicNotificationPermission(): Promise<boolean> {
    if (!isNativeCapacitor()) {
        // Browser fallback
        if ('Notification' in window) {
            const result = await Notification.requestPermission();
            return result === 'granted';
        }
        return false;
    }

    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
}

/**
 * Check if we have notification permission.
 */
export async function hasNotificationPermission(): Promise<boolean> {
    if (!isNativeCapacitor()) {
        return 'Notification' in window && Notification.permission === 'granted';
    }
    const result = await LocalNotifications.checkPermissions();
    return result.display === 'granted';
}

// ══════════════════════════════════════
// SCHEDULING
// ══════════════════════════════════════

/**
 * Schedule all notifications from a Year Ahead report.
 * Cancels any existing scheduled cosmic notifications first.
 */
export async function scheduleYearAheadNotifications(report: YearAheadReport): Promise<number> {
    const hasPermission = await requestCosmicNotificationPermission();
    if (!hasPermission) return 0;

    // Cancel existing scheduled notifications
    await cancelAllCosmicNotifications();

    const notifications: ScheduleOptions['notifications'] = [];
    const now = new Date();
    let scheduledCount = 0;

    // ── Key Date Notifications ──
    report.keyDates.forEach((kd, i) => {
        const schedDate = createScheduleDate(kd.date);
        if (!schedDate || schedDate <= now) return; // Skip past dates

        notifications.push({
            id: ID_KEY_DATE_START + i,
            title: '⭐ Cosmic Key Date',
            body: kd.description,
            schedule: { at: schedDate, allowWhileIdle: true },
            sound: 'default',
            extra: { type: 'key_date', date: kd.date },
        });
        scheduledCount++;
    });

    // ── Eclipse Notifications ──
    report.eclipses.forEach((eclipse, i) => {
        const schedDate = createScheduleDate(eclipse.date);
        if (!schedDate || schedDate <= now) return;

        const typeLabel = eclipse.type === 'lunar' ? '🌕 Lunar' : '🌑 Solar';
        const signDisplay = eclipse.signId.charAt(0).toUpperCase() + eclipse.signId.slice(1);
        const activations = eclipse.natalAspects.length > 0
            ? ` — activates your ${eclipse.natalAspects.map(a => a.planet).join(', ')}`
            : '';

        notifications.push({
            id: ID_ECLIPSE_START + i,
            title: `${typeLabel} Eclipse in ${signDisplay}`,
            body: `${eclipse.kind.charAt(0).toUpperCase() + eclipse.kind.slice(1)} eclipse energy is heightened today${activations}. Stay aware of what shifts.`,
            schedule: { at: schedDate, allowWhileIdle: true },
            sound: 'default',
            extra: { type: 'eclipse', date: eclipse.date },
        });
        scheduledCount++;
    });

    // ── Monthly Check-in Notifications ──
    report.months.forEach((month, i) => {
        const monthDate = new Date(month.year, month.monthIndex, 1);
        const schedDate = new Date(monthDate);
        schedDate.setHours(NOTIFICATION_HOUR, NOTIFICATION_MINUTE, 0, 0);
        if (schedDate <= now) return;

        const topTransit = month.dominantTransits[0];
        const body = topTransit
            ? `${month.month}'s dominant energy: ${topTransit.transit} ${topTransit.aspect} ${topTransit.natal}. Tap for your full month guidance.`
            : `Your ${month.month} cosmic guidance is ready. Tap to see what the stars have planned.`;

        notifications.push({
            id: ID_MONTHLY_START + i,
            title: `✨ ${month.month} Cosmic Check-in`,
            body,
            schedule: { at: schedDate, allowWhileIdle: true },
            sound: 'default',
            extra: { type: 'monthly', month: month.month },
        });
        scheduledCount++;
    });

    // ── Schedule all ──
    if (notifications.length > 0) {
        if (isNativeCapacitor()) {
            await LocalNotifications.schedule({ notifications });
        }
        // Store IDs for later cancellation
        const ids = notifications.map(n => n.id);
        safeStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(ids));
    }

    return scheduledCount;
}

/**
 * Schedule a birthday / Solar Return notification.
 */
export async function scheduleBirthdayNotification(birthday: string, year: number): Promise<void> {
    const hasPermission = await hasNotificationPermission();
    if (!hasPermission || !isNativeCapacitor()) return;

    const bday = new Date(birthday + 'T12:00:00');
    const schedDate = new Date(year, bday.getMonth(), bday.getDate(), 8, 0, 0); // 8 AM on birthday
    const now = new Date();
    if (schedDate <= now) return;

    await LocalNotifications.schedule({
        notifications: [{
            id: ID_BIRTHDAY,
            title: '🎂 Happy Solar Return!',
            body: 'Your cosmic year begins today. Your personalized Year Ahead Report is ready — see what the stars have planned.',
            schedule: { at: schedDate, allowWhileIdle: true },
            sound: 'default',
            extra: { type: 'birthday' },
        }],
    });
}

/**
 * Cancel all previously scheduled cosmic notifications.
 */
export async function cancelAllCosmicNotifications(): Promise<void> {
    if (!isNativeCapacitor()) return;

    const raw = safeStorage.getItem(NOTIF_STORAGE_KEY);
    if (raw) {
        try {
            const ids: number[] = JSON.parse(raw);
            if (ids.length > 0) {
                await LocalNotifications.cancel({
                    notifications: ids.map(id => ({ id })),
                });
            }
        } catch { /* ignore */ }
    }

    // Also cancel birthday separately
    try {
        await LocalNotifications.cancel({
            notifications: [{ id: ID_BIRTHDAY }],
        });
    } catch { /* ignore */ }

    safeStorage.removeItem(NOTIF_STORAGE_KEY);
}

/**
 * Get count of currently pending notifications.
 */
export async function getPendingNotificationCount(): Promise<number> {
    if (!isNativeCapacitor()) return 0;
    const pending = await LocalNotifications.getPending();
    return pending.notifications.length;
}

// ══════════════════════════════════════
// HELPERS
// ══════════════════════════════════════

function isNativeCapacitor(): boolean {
    return Capacitor.isNativePlatform();
}

/**
 * Create a Date object at NOTIFICATION_HOUR for a given ISO date string.
 */
function createScheduleDate(isoDate: string): Date | null {
    try {
        const [year, month, day] = isoDate.split('-').map(Number);
        return new Date(year, month - 1, day, NOTIFICATION_HOUR, NOTIFICATION_MINUTE, 0, 0);
    } catch {
        return null;
    }
}
