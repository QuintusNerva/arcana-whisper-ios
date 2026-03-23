/**
 * Pulse Service — Lightweight Daily Touchpoints for Manifestation Cards
 * ─────────────────────────────────────────────────────────────────────────
 * While Sacred Script provides deep 369 practice for ONE primary intention,
 * Pulse keeps ALL other active manifestations energetically alive with
 * quick daily check-ins.
 *
 * Three pulse types:
 * - Tap Affirm: Re-read your declaration, tap to affirm (3 seconds)
 * - Micro Journal: Write 1 gratitude line about this intention (30 seconds)
 * - Feel It Real: Close eyes, feel it as done, tap ✓ (10 seconds)
 *
 * Stored in localStorage. One pulse per manifestation per day.
 */

import { safeStorage } from './storage.service';

const PULSE_KEY = 'arcana_pulses';

// ══════════════════════════════════════
// TYPES
// ══════════════════════════════════════

export type PulseType = 'affirm' | 'journal' | 'feel';

export interface PulseEntry {
    manifestationId: string;
    date: string;          // ISO date YYYY-MM-DD
    type: PulseType;
    note?: string;         // For journal type
    completedAt: string;   // ISO timestamp
}

export interface PulseConfig {
    type: PulseType;
    emoji: string;
    title: string;
    description: string;
    durationLabel: string;
}

// ══════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════

export const PULSE_CONFIGS: Record<PulseType, PulseConfig> = {
    affirm: {
        type: 'affirm',
        emoji: '🔁',
        title: 'Tap Affirm',
        description: 'Re-read your declaration. Feel it as truth. Tap to affirm.',
        durationLabel: '3 sec',
    },
    journal: {
        type: 'journal',
        emoji: '✍️',
        title: 'Micro Journal',
        description: 'One sentence of gratitude about this intention.',
        durationLabel: '30 sec',
    },
    feel: {
        type: 'feel',
        emoji: '💫',
        title: 'Feel It Real',
        description: 'Close your eyes. Feel it as already done. Tap when ready.',
        durationLabel: '10 sec',
    },
};

// ══════════════════════════════════════
// INTERNAL HELPERS
// ══════════════════════════════════════

function getPulses(): PulseEntry[] {
    try {
        const raw = safeStorage.getItem(PULSE_KEY);
        if (raw) return JSON.parse(raw) as PulseEntry[];
    } catch { /* corrupt data */ }
    return [];
}

function savePulses(data: PulseEntry[]): void {
    safeStorage.setItem(PULSE_KEY, JSON.stringify(data));
}

function getToday(): string {
    return new Date().toISOString().slice(0, 10);
}

// ══════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════

/**
 * Record a pulse check-in for a manifestation.
 */
export function recordPulse(
    manifestationId: string,
    type: PulseType,
    note?: string,
): PulseEntry {
    const entry: PulseEntry = {
        manifestationId,
        date: getToday(),
        type,
        note: note?.trim() || undefined,
        completedAt: new Date().toISOString(),
    };

    const all = getPulses();
    all.unshift(entry);
    savePulses(all);
    return entry;
}

/**
 * Check if a manifestation has been pulsed today.
 */
export function hasPulsedToday(manifestationId: string): boolean {
    const today = getToday();
    return getPulses().some(p => p.manifestationId === manifestationId && p.date === today);
}

/**
 * Get today's pulse for a manifestation (if any).
 */
export function getTodayPulse(manifestationId: string): PulseEntry | null {
    const today = getToday();
    return getPulses().find(p => p.manifestationId === manifestationId && p.date === today) ?? null;
}

/**
 * Get the total pulse count for a manifestation (all time).
 */
export function getPulseCount(manifestationId: string): number {
    return getPulses().filter(p => p.manifestationId === manifestationId).length;
}

/**
 * Get the current streak (consecutive days pulsed) for a manifestation.
 */
export function getPulseStreak(manifestationId: string): number {
    const pulses = getPulses()
        .filter(p => p.manifestationId === manifestationId)
        .map(p => p.date);

    // Deduplicate dates and sort descending
    const uniqueDates = [...new Set(pulses)].sort().reverse();
    if (uniqueDates.length === 0) return 0;

    // Check if today or yesterday was pulsed (streak must be recent)
    const today = getToday();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterdayStr) return 0;

    let streak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
        const prev = new Date(uniqueDates[i - 1] + 'T00:00:00');
        const curr = new Date(uniqueDates[i] + 'T00:00:00');
        const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
}

/**
 * Suggest which pulse type to do today, rotating through the types.
 */
export function suggestPulseType(manifestationId: string): PulseType {
    const count = getPulseCount(manifestationId);
    const types: PulseType[] = ['affirm', 'journal', 'feel'];
    return types[count % 3];
}
