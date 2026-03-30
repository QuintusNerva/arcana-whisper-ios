import { safeStorage } from './storage.service';

/**
 * Reading Memory Service — Structured reading history for cross-session intelligence.
 *
 * Stores AI-digestible reading snapshots after each reading. Provides pattern
 * detection (recurring cards, theme streaks, energy trends) and prompt-injectable
 * context for the AI to reference past readings.
 *
 * GUARDRAIL: Memory context is ONLY injected when the current reading shares
 * the same topic/theme as a past reading, or when a card has appeared 3+ times
 * recently. The AI never forces cross-topic connections.
 *
 * Key: 'reading_snapshots'
 * Privacy: fully local, user-deletable.
 */

const SNAPSHOT_KEY = 'reading_snapshots';
const MAX_SNAPSHOTS = 30;
const RECURRING_CARD_THRESHOLD = 3;
const MEMORY_ACTIVATION_THRESHOLD = 3; // Need at least 3 readings before memory activates

// ── Data Model ──

export interface ReadingSnapshot {
    id: string;
    date: string;                    // ISO date
    spreadType: string;              // 'celtic-cross', 'three-card', etc.
    theme: string;                   // 'love', 'career', 'general', etc.
    question?: string;               // User's original question (truncated to 200 chars)
    cards: Array<{
        name: string;
        position: string;
        isReversed: boolean;
    }>;
    energyScore: 'challenging' | 'affirming' | 'crossroads';
    declaration?: string;            // Declaration of Ambition (if generated)
    aiSummary?: string;              // 2-3 sentence AI reading summary
}

export interface RecurringCard {
    name: string;
    count: number;
    recentThemes: string[];          // Which themes it appeared in
    wasReversed: boolean[];          // Orientation each time
}

export interface EnergyTrend {
    trend: 'increasingly_challenging' | 'increasingly_affirming' | 'mixed' | 'stable';
    recentScores: Array<'challenging' | 'affirming' | 'crossroads'>;
}

// ── Storage ──

function getSnapshots(): ReadingSnapshot[] {
    try {
        const raw = safeStorage.getItem(SNAPSHOT_KEY);
        if (raw) return JSON.parse(raw) as ReadingSnapshot[];
    } catch { /* corrupted — start fresh */ }
    return [];
}

function saveSnapshots(snapshots: ReadingSnapshot[]): void {
    safeStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshots));
}

// ── Public API: Storage ──

/**
 * Save a structured reading snapshot after a reading completes.
 * Deduplicates by reading ID to prevent double-saves when viewing saved readings.
 */
export function saveReadingSnapshot(snapshot: ReadingSnapshot): void {
    const snapshots = getSnapshots();

    // Prevent duplicate snapshots (e.g., viewing a saved reading from history)
    if (snapshots.some(s => s.id === snapshot.id)) return;

    snapshots.unshift(snapshot);

    // Rolling window — keep only the most recent N
    if (snapshots.length > MAX_SNAPSHOTS) {
        snapshots.splice(MAX_SNAPSHOTS);
    }

    saveSnapshots(snapshots);
}

/**
 * Get the most recent N snapshots.
 */
export function getRecentSnapshots(limit = 5): ReadingSnapshot[] {
    return getSnapshots().slice(0, limit);
}

/**
 * Get snapshots filtered by theme (same-topic lookback).
 */
export function getSnapshotsByTheme(theme: string, limit = 3): ReadingSnapshot[] {
    return getSnapshots()
        .filter(s => s.theme === theme)
        .slice(0, limit);
}

/**
 * Total number of stored snapshots.
 */
export function getSnapshotCount(): number {
    return getSnapshots().length;
}

// ── Public API: Pattern Detection ──

/**
 * Find cards that have appeared RECURRING_CARD_THRESHOLD+ times in the last N days.
 */
export function getRecurringCards(days = 30): RecurringCard[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffISO = cutoff.toISOString();

    const snapshots = getSnapshots().filter(s => s.date >= cutoffISO);
    const cardMap = new Map<string, { count: number; themes: string[]; reversed: boolean[] }>();

    for (const snap of snapshots) {
        for (const card of snap.cards) {
            const existing = cardMap.get(card.name);
            if (existing) {
                existing.count += 1;
                if (!existing.themes.includes(snap.theme)) existing.themes.push(snap.theme);
                existing.reversed.push(card.isReversed);
            } else {
                cardMap.set(card.name, {
                    count: 1,
                    themes: [snap.theme],
                    reversed: [card.isReversed],
                });
            }
        }
    }

    const recurring: RecurringCard[] = [];
    for (const [name, data] of cardMap.entries()) {
        if (data.count >= RECURRING_CARD_THRESHOLD) {
            recurring.push({
                name,
                count: data.count,
                recentThemes: data.themes,
                wasReversed: data.reversed,
            });
        }
    }

    // Sort by frequency descending
    return recurring.sort((a, b) => b.count - a.count);
}

/**
 * Determine energy trend from the last N readings.
 */
export function getEnergyTrend(readingCount = 5): EnergyTrend {
    const snapshots = getSnapshots().slice(0, readingCount);
    const scores = snapshots.map(s => s.energyScore);

    if (scores.length < 3) {
        return { trend: 'mixed', recentScores: scores };
    }

    // Check if scores are trending in one direction
    const recentHalf = scores.slice(0, Math.ceil(scores.length / 2));
    const olderHalf = scores.slice(Math.ceil(scores.length / 2));

    const scoreValue = (s: string) => s === 'affirming' ? 1 : s === 'challenging' ? -1 : 0;
    const recentAvg = recentHalf.reduce((sum, s) => sum + scoreValue(s), 0) / recentHalf.length;
    const olderAvg = olderHalf.reduce((sum, s) => sum + scoreValue(s), 0) / olderHalf.length;

    const delta = recentAvg - olderAvg;

    let trend: EnergyTrend['trend'];
    if (delta > 0.4) trend = 'increasingly_affirming';
    else if (delta < -0.4) trend = 'increasingly_challenging';
    else if (Math.abs(recentAvg) < 0.2 && Math.abs(olderAvg) < 0.2) trend = 'stable';
    else trend = 'mixed';

    return { trend, recentScores: scores };
}

/**
 * Check if user is asking about the same theme repeatedly (streak detection).
 */
export function getThemeStreak(currentTheme: string): { isStreak: boolean; count: number; daySpan: number } {
    const snapshots = getSnapshots();
    let count = 0;

    for (const snap of snapshots) {
        if (snap.theme === currentTheme) {
            count++;
        } else {
            break; // Stop at first non-matching theme (consecutive streak)
        }
    }

    if (count < 2) {
        return { isStreak: false, count: 0, daySpan: 0 };
    }

    const newest = new Date(snapshots[0].date);
    const oldest = new Date(snapshots[count - 1].date);
    const daySpan = Math.ceil((newest.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24));

    return { isStreak: true, count, daySpan };
}

// ── Public API: Cleanup ──

/**
 * Clear all reading snapshots. Privacy control.
 */
export function clearReadingSnapshots(): void {
    safeStorage.removeItem(SNAPSHOT_KEY);
}
