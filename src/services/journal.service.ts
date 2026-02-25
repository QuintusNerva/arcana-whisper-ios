import { safeStorage } from "./storage.service";
/**
 * Cosmic Journal Service
 * ──────────────────────
 * Freeform journaling with silent transit snapshots.
 * The user just writes — we tag each entry with the active transits,
 * extract mood/themes via AI, and discover patterns over time.
 *
 * Storage: localStorage (V1), designed for easy migration to cloud.
 */

import { getTransitFeed, TransitHit } from './transit.service';

// ══════════════════════════════════════
// TYPES
// ══════════════════════════════════════

export interface JournalEntry {
    id: string;
    date: string;            // ISO date: YYYY-MM-DD
    timestamp: number;       // Date.now() for sorting
    text: string;            // User's freeform text
    mood?: string;           // Optional emoji mood
    /** Silently captured — user never sees these on entry */
    transitSnapshot: TransitSnapshot[];
    /** AI-extracted themes (populated async after save) */
    themes?: string[];
}

export interface TransitSnapshot {
    transitPlanet: string;   // e.g. "mars"
    natalPlanet: string;     // e.g. "saturn"
    aspect: string;          // e.g. "Square"
    orb: number;
    significance: string;    // "major" | "moderate" | "minor"
}

export interface PatternInsight {
    id: string;
    discoveredDate: string;  // ISO date
    planet: string;          // The transiting planet this pattern is about
    title: string;           // e.g. "Your Mars Pattern"
    summary: string;         // AI-generated insight
    entryCount: number;      // How many entries contributed to this pattern
    isNew: boolean;          // Unread by user
}

// ══════════════════════════════════════
// STORAGE KEYS
// ══════════════════════════════════════

const ENTRIES_KEY = 'cosmic_journal_entries';
const PATTERNS_KEY = 'cosmic_journal_patterns';
const REMINDER_KEY = 'cosmic_journal_reminder';
const LAST_ANALYSIS_KEY = 'cosmic_journal_last_analysis';

// ══════════════════════════════════════
// CRUD — Journal Entries
// ══════════════════════════════════════

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Get all journal entries, newest first */
export function getJournalEntries(): JournalEntry[] {
    try {
        const raw = safeStorage.getItem(ENTRIES_KEY);
        if (!raw) return [];
        const entries: JournalEntry[] = JSON.parse(raw);
        return entries.sort((a, b) => b.timestamp - a.timestamp);
    } catch {
        return [];
    }
}

/** Get a single entry by ID */
export function getJournalEntry(id: string): JournalEntry | null {
    const entries = getJournalEntries();
    return entries.find(e => e.id === id) || null;
}

/** Get total entry count */
export function getJournalEntryCount(): number {
    return getJournalEntries().length;
}

/**
 * Save a new journal entry.
 * Silently captures the current transit snapshot.
 */
export function saveJournalEntry(text: string, mood?: string): JournalEntry {
    const entries = getJournalEntries();
    const now = new Date();

    // Silently snapshot current transits
    const transitSnapshot = captureTransitSnapshot();

    const entry: JournalEntry = {
        id: generateId(),
        date: now.toISOString().slice(0, 10),
        timestamp: now.getTime(),
        text: text.trim(),
        mood,
        transitSnapshot,
    };

    entries.push(entry);
    safeStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
    return entry;
}

/** Update an existing entry */
export function updateJournalEntry(id: string, text: string, mood?: string): JournalEntry | null {
    const entries = getJournalEntries();
    const idx = entries.findIndex(e => e.id === id);
    if (idx === -1) return null;

    entries[idx].text = text.trim();
    if (mood !== undefined) entries[idx].mood = mood;
    safeStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
    return entries[idx];
}

/** Delete an entry */
export function deleteJournalEntry(id: string): boolean {
    const entries = getJournalEntries();
    const filtered = entries.filter(e => e.id !== id);
    if (filtered.length === entries.length) return false;
    safeStorage.setItem(ENTRIES_KEY, JSON.stringify(filtered));
    return true;
}

// ══════════════════════════════════════
// SILENT TRANSIT SNAPSHOT
// ══════════════════════════════════════

/**
 * Capture current active transits as a lightweight snapshot.
 * The user never sees this — it's tagged to the entry for later pattern analysis.
 */
function captureTransitSnapshot(): TransitSnapshot[] {
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
// PATTERN ANALYSIS
// ══════════════════════════════════════

/** Get stored pattern insights */
export function getPatternInsights(): PatternInsight[] {
    try {
        const raw = safeStorage.getItem(PATTERNS_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

/** Save pattern insights */
export function savePatternInsights(patterns: PatternInsight[]): void {
    safeStorage.setItem(PATTERNS_KEY, JSON.stringify(patterns));
}

/** Mark all patterns as read */
export function markPatternsRead(): void {
    const patterns = getPatternInsights();
    patterns.forEach(p => p.isNew = false);
    savePatternInsights(patterns);
}

/** Check if there are unread patterns */
export function hasUnreadPatterns(): boolean {
    return getPatternInsights().some(p => p.isNew);
}

/** Is it time for a new pattern analysis? (weekly) */
export function isPatternAnalysisDue(): boolean {
    const entries = getJournalEntries();
    if (entries.length < 10) return false;

    try {
        const lastAnalysis = safeStorage.getItem(LAST_ANALYSIS_KEY);
        if (!lastAnalysis) return true;

        const lastDate = new Date(lastAnalysis);
        const now = new Date();
        const daysSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince >= 7;
    } catch {
        return true;
    }
}

/** Mark pattern analysis as completed today */
export function markPatternAnalysisDone(): void {
    safeStorage.setItem(LAST_ANALYSIS_KEY, new Date().toISOString());
}

/**
 * Build pattern analysis data — groups entries by which transiting planets were active.
 * Returns data ready for AI analysis.
 */
export function buildPatternData(): Record<string, { entries: JournalEntry[]; count: number }> {
    const entries = getJournalEntries();
    const planetGroups: Record<string, JournalEntry[]> = {};

    for (const entry of entries) {
        if (!entry.transitSnapshot || entry.transitSnapshot.length === 0) continue;

        const seenPlanets = new Set<string>();
        for (const transit of entry.transitSnapshot) {
            if (!seenPlanets.has(transit.transitPlanet)) {
                seenPlanets.add(transit.transitPlanet);
                if (!planetGroups[transit.transitPlanet]) {
                    planetGroups[transit.transitPlanet] = [];
                }
                planetGroups[transit.transitPlanet].push(entry);
            }
        }
    }

    // Only include planets with 3+ entries for meaningful patterns
    const result: Record<string, { entries: JournalEntry[]; count: number }> = {};
    for (const [planet, planetEntries] of Object.entries(planetGroups)) {
        if (planetEntries.length >= 3) {
            result[planet] = { entries: planetEntries, count: planetEntries.length };
        }
    }
    return result;
}

// ══════════════════════════════════════
// JOURNAL REMINDERS
// ══════════════════════════════════════

export interface JournalReminderSettings {
    enabled: boolean;
    time: string;    // HH:MM format
}

/** Get journal reminder settings */
export function getJournalReminderSettings(): JournalReminderSettings {
    try {
        const raw = safeStorage.getItem(REMINDER_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* */ }
    return { enabled: false, time: '20:00' };
}

/** Save journal reminder settings */
export function saveJournalReminderSettings(settings: JournalReminderSettings): void {
    safeStorage.setItem(REMINDER_KEY, JSON.stringify(settings));
}

// Rotating reminder messages — warm, zero pressure
const REMINDER_MESSAGES = [
    "Hey. How was today, really? Your journal is here when you're ready.",
    "No need to write a novel. Even one sentence counts.",
    "Something happened today that you'll want to remember. Even the quiet stuff matters.",
    "Your journal doesn't judge. It just listens.",
    "30 seconds of honesty. That's all it takes.",
    "A lot happened today. Want to put some of it into words?",
    "You don't need to have it figured out. Just write what's real.",
    "The stars shifted today. How did it land for you?",
];

/** Fire a journal reminder notification if conditions are met */
export function fireJournalReminder(): boolean {
    const settings = getJournalReminderSettings();
    if (!settings.enabled) return false;

    // Check if we already reminded today
    const today = new Date().toISOString().slice(0, 10);
    const lastReminder = safeStorage.getItem('journal_last_reminder');
    if (lastReminder === today) return false;

    // Check if it's past the reminder time
    const now = new Date();
    const [h, m] = settings.time.split(':').map(Number);
    const reminderTime = new Date(now);
    reminderTime.setHours(h, m, 0, 0);

    if (now < reminderTime) return false;

    // Check if they already journaled today
    const entries = getJournalEntries();
    const todayEntry = entries.find(e => e.date === today);
    if (todayEntry) return false; // Already journaled, no need to remind

    // Fire notification
    if ('Notification' in window && Notification.permission === 'granted') {
        const msg = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
        new Notification('Journal', {
            body: msg,
            icon: '/icon.png',
            tag: 'journal-reminder',
        });
    }

    safeStorage.setItem('journal_last_reminder', today);
    return true;
}

// ══════════════════════════════════════
// CREATIVE NUDGES
// ══════════════════════════════════════

const WELCOME_LINES = [
    "No pressure. Just say what's real.",
    "What's weighing on you today?",
    "Speak freely — this is yours.",
    "How did today actually feel?",
    "What would you tell a close friend right now?",
    "Be honest here. That's all that matters.",
    "No one reads this but you.",
];

const NUDGE_PROMPTS = [
    "Try this: finish the sentence 'Right now, I feel...' and keep going.",
    "What's one thing that happened today that stuck with you?",
    "Is there something you've been avoiding thinking about?",
    "What do you wish someone understood about you right now?",
    "If today had a color, what would it be? Why?",
    "What's something small that went right today?",
    "What's the honest answer to 'how are you?'",
];

/** Get a random welcome line for the journal entry page */
export function getWelcomeLine(): string {
    return WELCOME_LINES[Math.floor(Math.random() * WELCOME_LINES.length)];
}

/** Get a random nudge prompt (shown after delay on blank page) */
export function getNudgePrompt(): string {
    return NUDGE_PROMPTS[Math.floor(Math.random() * NUDGE_PROMPTS.length)];
}

// ══════════════════════════════════════
// PROGRESS TRACKING
// ══════════════════════════════════════

const PATTERN_UNLOCK_THRESHOLD = 10;

export interface PatternProgress {
    current: number;
    target: number;
    unlocked: boolean;
    percentage: number;
    message: string;
}

/** Get progress toward pattern unlock */
export function getPatternProgress(): PatternProgress {
    const count = getJournalEntryCount();
    const unlocked = count >= PATTERN_UNLOCK_THRESHOLD;
    const percentage = Math.min(100, Math.round((count / PATTERN_UNLOCK_THRESHOLD) * 100));

    let message: string;
    if (unlocked) {
        message = "Patterns unlocked. We've been reading alongside the stars.";
    } else if (count === 0) {
        message = "Start writing. We'll start watching the sky.";
    } else if (count <= 3) {
        message = "Getting there. The picture is starting to form...";
    } else if (count <= 5) {
        message = "Halfway. We're already seeing threads in your words.";
    } else if (count <= 7) {
        message = "Almost. A few more entries and we unlock something you've never seen.";
    } else if (count === 9) {
        message = "One more entry. We're ready to show you what we found.";
    } else {
        message = `${PATTERN_UNLOCK_THRESHOLD - count} more ${count === PATTERN_UNLOCK_THRESHOLD - 1 ? 'entry' : 'entries'} to unlock patterns.`;
    }

    return { current: count, target: PATTERN_UNLOCK_THRESHOLD, unlocked, percentage, message };
}
