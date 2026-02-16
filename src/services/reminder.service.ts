/*
 * Daily Reminder Service
 * ──────────────────────
 * Uses the Notification API + localStorage to schedule daily tarot reminders.
 * Since web apps can't schedule native alarms, we check on app load
 * whether a reminder is due and fire an in-app + browser notification.
 */

const STORAGE_KEY = 'arcana_daily_reminder';

export interface ReminderSettings {
    enabled: boolean;
    time: string;          // HH:MM (24h format)
    lastNotified: string;  // ISO date string of last notification day
}

const DEFAULT_SETTINGS: ReminderSettings = {
    enabled: false,
    time: '09:00',
    lastNotified: '',
};

export function getReminderSettings(): ReminderSettings {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_SETTINGS;
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export function saveReminderSettings(settings: Partial<ReminderSettings>): ReminderSettings {
    const current = getReminderSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
}

export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    const result = await Notification.requestPermission();
    return result === 'granted';
}

export function isReminderDue(): boolean {
    const settings = getReminderSettings();
    if (!settings.enabled) return false;

    const now = new Date();
    const today = now.toISOString().slice(0, 10); // YYYY-MM-DD

    // Already notified today
    if (settings.lastNotified === today) return false;

    // Check if current time is past the reminder time
    const [hours, minutes] = settings.time.split(':').map(Number);
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);

    return now >= reminderTime;
}

export function fireReminder(): boolean {
    if (!isReminderDue()) return false;

    const today = new Date().toISOString().slice(0, 10);
    saveReminderSettings({ lastNotified: today });

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
        const messages = [
            '✨ The cards await your question, Seeker.',
            '🔮 Your daily reading is ready. What will the Arcana reveal?',
            '🌙 The veil is thin today. Draw your card.',
            '⚜️ A new day, a new spread. The Universe speaks.',
            '✦ The Arcana whispers… are you listening?',
        ];
        const message = messages[Math.floor(Math.random() * messages.length)];

        new Notification('Arcana Whisper', {
            body: message,
            icon: '/icon.png',
            badge: '/icon.png',
            tag: 'daily-reminder',
        });
    }

    return true;
}

// Time options for the picker
export const REMINDER_TIMES = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00',
];

export function formatTime(time24: string): string {
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}
