import { safeStorage } from "./storage.service";
/**
 * Dream Journal Service — Local-Only
 * ───────────────────────────────────
 * Log dreams with symbol tags and waking moods.
 * Each dream is silently tagged with active transits.
 * AI interprets dreams through natal chart + transit lens.
 *
 * All data stays on-device (localStorage via safeStorage).
 */

import { getTransitFeed } from './transit.service';

// ══════════════════════════════════════
// TYPES
// ══════════════════════════════════════

export interface DreamEntry {
    id: string;
    date: string;            // ISO date: YYYY-MM-DD
    timestamp: number;       // Date.now() for sorting
    text: string;            // Free-form dream description
    wakingMood?: string;     // Emoji mood on waking
    symbolTags: string[];    // Quick-tap symbol tags (emoji keys)
    /** Silently captured — user never sees these on entry */
    transitSnapshot: DreamTransitSnapshot[];
    /** AI interpretation (cached after first request) */
    interpretation?: string;
}

export interface DreamTransitSnapshot {
    transitPlanet: string;   // e.g. "neptune"
    natalPlanet: string;     // e.g. "moon"
    aspect: string;          // e.g. "Conjunction"
    orb: number;
    significance: string;    // "major" | "moderate" | "minor"
}

// ══════════════════════════════════════
// SYMBOL TAGS
// ══════════════════════════════════════

export const DREAM_SYMBOL_TAGS = [
    { emoji: '💧', label: 'Water' },
    { emoji: '🏠', label: 'Home' },
    { emoji: '✈️', label: 'Flying' },
    { emoji: '👤', label: 'People' },
    { emoji: '🐍', label: 'Animals' },
    { emoji: '🔥', label: 'Fire' },
    { emoji: '🚪', label: 'Doors' },
    { emoji: '⛰️', label: 'Nature' },
    { emoji: '🌊', label: 'Ocean' },
    { emoji: '🏃', label: 'Chase' },
    { emoji: '🌑', label: 'Darkness' },
    { emoji: '✨', label: 'Light' },
    { emoji: '🗝️', label: 'Keys' },
    { emoji: '🪞', label: 'Mirror' },
    { emoji: '💀', label: 'Death' },
];

// ══════════════════════════════════════
// WAKING MOODS
// ══════════════════════════════════════

export const WAKING_MOOD_OPTIONS = [
    { emoji: '😰', label: 'Anxious' },
    { emoji: '😐', label: 'Neutral' },
    { emoji: '😌', label: 'Peaceful' },
    { emoji: '😮', label: 'Surprised' },
    { emoji: '🥹', label: 'Moved' },
    { emoji: '😱', label: 'Frightened' },
    { emoji: '🤔', label: 'Curious' },
];

// ══════════════════════════════════════
// STORAGE KEYS
// ══════════════════════════════════════

const DREAMS_KEY = 'cosmic_dream_entries';

// ══════════════════════════════════════
// CRUD — Dream Entries
// ══════════════════════════════════════

function generateId(): string {
    return 'dream_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Get all dream entries, newest first */
export function getDreamEntries(): DreamEntry[] {
    try {
        const raw = safeStorage.getItem(DREAMS_KEY);
        if (!raw) return [];
        const entries: DreamEntry[] = JSON.parse(raw);
        return entries.sort((a, b) => b.timestamp - a.timestamp);
    } catch {
        return [];
    }
}

/** Get a single dream entry by ID */
export function getDreamEntry(id: string): DreamEntry | null {
    const entries = getDreamEntries();
    return entries.find(e => e.id === id) || null;
}

/** Get total dream count */
export function getDreamCount(): number {
    return getDreamEntries().length;
}

/**
 * Save a new dream entry.
 * Silently captures the current transit snapshot.
 */
export function saveDreamEntry(
    text: string,
    symbolTags: string[],
    wakingMood?: string,
): DreamEntry {
    const entries = getDreamEntries();
    const now = new Date();

    // Silently snapshot current transits
    const transitSnapshot = captureDreamTransitSnapshot();

    const entry: DreamEntry = {
        id: generateId(),
        date: now.toISOString().slice(0, 10),
        timestamp: now.getTime(),
        text: text.trim(),
        wakingMood,
        symbolTags,
        transitSnapshot,
    };

    entries.push(entry);
    safeStorage.setItem(DREAMS_KEY, JSON.stringify(entries));
    return entry;
}

/** Update a dream's cached AI interpretation */
export function updateDreamInterpretation(id: string, interpretation: string): DreamEntry | null {
    const entries = getDreamEntries();
    const idx = entries.findIndex(e => e.id === id);
    if (idx === -1) return null;

    entries[idx].interpretation = interpretation;
    safeStorage.setItem(DREAMS_KEY, JSON.stringify(entries));
    return entries[idx];
}

/** Delete a dream entry */
export function deleteDreamEntry(id: string): boolean {
    const entries = getDreamEntries();
    const filtered = entries.filter(e => e.id !== id);
    if (filtered.length === entries.length) return false;
    safeStorage.setItem(DREAMS_KEY, JSON.stringify(filtered));
    return true;
}

// ══════════════════════════════════════
// SILENT TRANSIT SNAPSHOT
// ══════════════════════════════════════

/**
 * Capture current active transits as a lightweight snapshot.
 * Same pattern as journal.service.ts — user never sees this on entry.
 */
function captureDreamTransitSnapshot(): DreamTransitSnapshot[] {
    try {
        const feed = getTransitFeed();
        if (!feed.hasBirthData) return [];

        return feed.active.map(hit => ({
            transitPlanet: hit.transitPlanet.id,
            natalPlanet: hit.natalPlanet.id,
            aspect: hit.aspect.name,
            orb: hit.orb,
            significance: hit.significance,
        }));
    } catch {
        return [];
    }
}

// ══════════════════════════════════════
// SYMBOL STATS (Pattern Tracking)
// ══════════════════════════════════════

export interface SymbolStat {
    emoji: string;
    label: string;
    count: number;
    percentage: number;  // relative to total dreams
}

/** Get dream symbol frequency stats — sorted by count descending */
export function getDreamSymbolStats(): SymbolStat[] {
    const entries = getDreamEntries();
    if (entries.length === 0) return [];

    const counts: Record<string, number> = {};
    for (const entry of entries) {
        for (const tag of entry.symbolTags) {
            counts[tag] = (counts[tag] || 0) + 1;
        }
    }

    const total = entries.length;
    return Object.entries(counts)
        .map(([emoji, count]) => {
            const tag = DREAM_SYMBOL_TAGS.find(t => t.emoji === emoji);
            return {
                emoji,
                label: tag?.label || emoji,
                count,
                percentage: Math.round((count / total) * 100),
            };
        })
        .sort((a, b) => b.count - a.count);
}

// ══════════════════════════════════════
// CREATIVE NUDGES — Dream-specific
// ══════════════════════════════════════

const DREAM_WELCOME_LINES = [
    "What did you see last night?",
    "The veil was thin last night…",
    "Describe it before it fades.",
    "Even fragments matter. Write what you remember.",
    "The dream chose you. What did it show?",
    "Close your eyes. What image comes back first?",
    "Your subconscious left a message.",
];

const DREAM_NUDGE_PROMPTS = [
    "Start with the strongest image. What did it look like?",
    "Was anyone else there? Who — and how did they make you feel?",
    "What was the mood of the dream? Not yours — the dream's.",
    "Did anything change or transform during the dream?",
    "What's the one detail that won't leave your mind?",
    "If this dream was a movie, what would the title be?",
    "What did you feel the moment before you woke up?",
];

/** Get a random dream welcome line */
export function getDreamWelcomeLine(): string {
    return DREAM_WELCOME_LINES[Math.floor(Math.random() * DREAM_WELCOME_LINES.length)];
}

/** Get a random dream nudge prompt */
export function getDreamNudgePrompt(): string {
    return DREAM_NUDGE_PROMPTS[Math.floor(Math.random() * DREAM_NUDGE_PROMPTS.length)];
}

// ══════════════════════════════════════
// TRANSIT FORMATTING (for AI context)
// ══════════════════════════════════════

/** Format transit snapshot into human-readable string for AI prompts */
export function formatTransitsForAI(transits: DreamTransitSnapshot[]): string {
    if (transits.length === 0) return 'No major transits active.';
    return transits
        .filter(t => t.significance === 'major' || t.significance === 'moderate')
        .slice(0, 5)
        .map(t => `${t.transitPlanet} ${t.aspect} natal ${t.natalPlanet} (orb: ${t.orb.toFixed(1)}°)`)
        .join(', ');
}
