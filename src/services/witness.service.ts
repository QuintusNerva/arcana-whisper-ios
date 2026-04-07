/**
 * Witness Service — CRUD for real-world alignment events.
 *
 * Witness events are things that ACTUALLY HAPPEN in the user's life:
 * - Angel Numbers (111, 222, etc. seen on clocks, receipts, addresses)
 * - Coincidences (running into the exact person you needed)
 * - Dreams (subconscious symbols related to an intention)
 * - Opportunities (the thing you declared actually appearing)
 *
 * These are NOT tarot symbols spotted IRL.
 * Stored in localStorage. Fully private, user-deletable.
 */

import { safeStorage } from './storage.service';

const WITNESS_KEY = 'arcana_witness_events';
const MAX_EVENTS_PER_MANIFESTATION = 100; // Rolling window cap

// ── Interfaces ──

export type WitnessType = 'angel_number' | 'coincidence' | 'dream' | 'opportunity';

export type WitnessMood = '🔥' | '✨' | '🌿' | '💎' | '🌙';

export interface WitnessEvent {
    id: string;
    type: WitnessType;
    description: string;       // "Saw 111 on a receipt" / "Got the call from the company"
    note?: string;             // Optional user reflection
    timestamp: string;         // ISO
    linkedManifestationId?: string;  // Which intention this relates to
    mood?: WitnessMood;        // Optional daily energy mood

    // Type-specific metadata
    angelNumber?: string;      // The specific number (e.g., "111", "444")
}

// ── Internal helpers ──

function getEvents(): WitnessEvent[] {
    try {
        const raw = safeStorage.getItem(WITNESS_KEY);
        if (raw) return JSON.parse(raw) as WitnessEvent[];
    } catch { /* corrupt data */ }
    return [];
}

function saveEvents(events: WitnessEvent[]): void {
    safeStorage.setItem(WITNESS_KEY, JSON.stringify(events));
}

function generateId(): string {
    return `witness_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── Public API ──

/**
 * Save a new witness event.
 * Enforces rolling window cap per manifestation.
 */
export function saveWitnessEvent(
    event: Omit<WitnessEvent, 'id' | 'timestamp'>,
): WitnessEvent {
    const entry: WitnessEvent = {
        ...event,
        id: generateId(),
        timestamp: new Date().toISOString(),
    };

    let all = getEvents();
    all.unshift(entry);

    // Enforce per-manifestation cap
    if (entry.linkedManifestationId) {
        const forManif = all.filter(e => e.linkedManifestationId === entry.linkedManifestationId);
        if (forManif.length > MAX_EVENTS_PER_MANIFESTATION) {
            // Remove oldest events for this manifestation beyond the cap
            const toRemove = forManif.slice(MAX_EVENTS_PER_MANIFESTATION);
            const removeIds = new Set(toRemove.map(e => e.id));
            all = all.filter(e => !removeIds.has(e.id));
        }
    }

    saveEvents(all);
    return entry;
}

/**
 * Get all witness events, newest first.
 */
export function getWitnessEvents(): WitnessEvent[] {
    return getEvents();
}

/**
 * Get witness events for a specific manifestation.
 */
export function getWitnessEventsForManifestation(manifestationId: string): WitnessEvent[] {
    return getEvents().filter(e => e.linkedManifestationId === manifestationId);
}

/**
 * Get recent witness events (last N days, for Forge context).
 */
export function getRecentWitnessEvents(days: number = 7): WitnessEvent[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffISO = cutoff.toISOString();
    return getEvents().filter(e => e.timestamp >= cutoffISO);
}

/**
 * Get witness events by type (e.g., all angel number sightings).
 */
export function getWitnessEventsByType(type: WitnessType): WitnessEvent[] {
    return getEvents().filter(e => e.type === type);
}

/**
 * Count witness events for a manifestation (for Witness Counter display).
 */
export function getWitnessCountForManifestation(manifestationId: string): number {
    return getEvents().filter(e => e.linkedManifestationId === manifestationId).length;
}

/**
 * Get the most recent witness event for a manifestation (for latest sign display).
 */
export function getLatestWitnessForManifestation(manifestationId: string): WitnessEvent | null {
    const events = getEvents()
        .filter(e => e.linkedManifestationId === manifestationId)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return events[0] || null;
}

/**
 * Delete a specific witness event.
 */
export function deleteWitnessEvent(id: string): void {
    const filtered = getEvents().filter(e => e.id !== id);
    saveEvents(filtered);
}

/**
 * Delete all witness events for a manifestation (cleanup on release).
 */
export function deleteWitnessEventsForManifestation(manifestationId: string): void {
    const filtered = getEvents().filter(e => e.linkedManifestationId !== manifestationId);
    saveEvents(filtered);
}

/**
 * Get angel number frequency map (for Personal Lexicon).
 * Returns { "111": 5, "222": 3, ... } sorted by frequency.
 */
export function getAngelNumberFrequency(): Record<string, number> {
    const angelEvents = getEvents().filter(e => e.type === 'angel_number' && e.angelNumber);
    const freq: Record<string, number> = {};
    for (const event of angelEvents) {
        const num = event.angelNumber!;
        freq[num] = (freq[num] || 0) + 1;
    }
    return freq;
}

/**
 * Format witness events for AI context (Forge prompt injection).
 * Returns a concise summary suitable for prompt context.
 */
export function getWitnessContextForAI(manifestationId: string): string | null {
    const events = getWitnessEventsForManifestation(manifestationId);
    if (events.length === 0) return null;

    // Use last 5 events max for prompt context
    const recent = events.slice(0, 5);
    const lines = recent.map(e => {
        const typeLabel = e.type === 'angel_number' ? `Angel Number ${e.angelNumber || ''}` :
            e.type === 'coincidence' ? 'Coincidence' :
            e.type === 'dream' ? 'Dream' : 'Opportunity';
        return `- ${typeLabel}: ${e.description}`;
    });

    return `Recent witness events (${events.length} total):\n${lines.join('\n')}`;
}
