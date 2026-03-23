/**
 * Sacred Script Service — 369 Manifestation Journaling
 * ─────────────────────────────────────────────────────
 * Structured daily ritual practice based on Tesla's 3-6-9 numerology.
 *
 * Morning:   Write affirmation 3 times  ("Set Your Frequency")
 * Afternoon: Script 6 sentences of your future reality  ("Script Your Reality")
 * Evening:   Write 9 gratitude/reflection lines  ("Seal the Day")
 *
 * One active script at a time. 21-day cycle. Moon-phase-aware prompts.
 * Stored in localStorage. Fully private, user-deletable.
 */

import { safeStorage } from './storage.service';

const SCRIPTS_KEY = 'arcana_sacred_scripts';
const ONBOARDING_KEY = 'sacred_script_onboarded';

// ══════════════════════════════════════
// TYPES
// ══════════════════════════════════════

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export interface RitualEntry {
    lines: string[];
    completedAt: string;        // ISO timestamp
}

export interface DayEntry {
    date: string;               // ISO date YYYY-MM-DD
    dayNumber: number;          // 1-21
    morning?: RitualEntry;
    afternoon?: RitualEntry;
    evening?: RitualEntry;
}

export interface SacredScript {
    id: string;
    affirmation: string;        // Core affirmation being repeated
    manifestationId?: string;   // Links to active manifestation
    startDate: string;          // ISO date
    entries: DayEntry[];        // One per day (up to 21)
    status: 'active' | 'completed' | 'abandoned' | 'paused';
    lunarPhaseAtStart: string;  // Moon phase when started
    completedDate?: string;     // ISO date when completed
}

export interface ScriptProgress {
    dayNumber: number;          // Current day (1-21)
    totalDays: number;          // Always 21
    percentage: number;         // 0-100
    ritualsToday: {
        morning: boolean;
        afternoon: boolean;
        evening: boolean;
    };
    todayComplete: boolean;     // All 3 rituals done today
    totalRitualsCompleted: number;
    totalRitualsPossible: number;
}

export interface RitualConfig {
    timeOfDay: TimeOfDay;
    title: string;
    emoji: string;
    lineCount: number;
    placeholder: string;
    description: string;
}

// ══════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════

export const CYCLE_DAYS = 21;

export const RITUAL_CONFIGS: Record<TimeOfDay, RitualConfig> = {
    morning: {
        timeOfDay: 'morning',
        title: 'Set Your Frequency',
        emoji: '☀️',
        lineCount: 3,
        placeholder: 'Write your affirmation...',
        description: 'Write your affirmation 3 times. Repetition imprints it on your subconscious.',
    },
    afternoon: {
        timeOfDay: 'afternoon',
        title: 'Script Your Reality',
        emoji: '🌤️',
        lineCount: 6,
        placeholder: 'Describe your future as if it\'s already here...',
        description: 'Write 6 sentences describing your future as already real. Feel it as you write.',
    },
    evening: {
        timeOfDay: 'evening',
        title: 'Seal the Day',
        emoji: '🌙',
        lineCount: 9,
        placeholder: 'What are you grateful for today?',
        description: 'Write 9 lines of gratitude connecting what you have to what you\'re calling in.',
    },
};

// ══════════════════════════════════════
// INTERNAL HELPERS
// ══════════════════════════════════════

function getScripts(): SacredScript[] {
    try {
        const raw = safeStorage.getItem(SCRIPTS_KEY);
        if (raw) return JSON.parse(raw) as SacredScript[];
    } catch { /* corrupt data */ }
    return [];
}

function saveScripts(data: SacredScript[]): void {
    safeStorage.setItem(SCRIPTS_KEY, JSON.stringify(data));
}

function generateId(): string {
    return `ss_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function getToday(): string {
    return new Date().toISOString().slice(0, 10);
}

function daysBetween(dateA: string, dateB: string): number {
    const a = new Date(dateA + 'T00:00:00');
    const b = new Date(dateB + 'T00:00:00');
    return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// ══════════════════════════════════════
// PUBLIC API — CRUD
// ══════════════════════════════════════

/**
 * Create a new 21-day Sacred Script journey.
 * Automatically abandons any existing active script.
 */
export function createSacredScript(
    affirmation: string,
    lunarPhase: string,
    manifestationId?: string,
): SacredScript {
    const all = getScripts();

    // Pause any currently active script (preserve progress)
    for (const s of all) {
        if (s.status === 'active') {
            s.status = 'paused';
        }
    }

    const script: SacredScript = {
        id: generateId(),
        affirmation: affirmation.trim(),
        manifestationId,
        startDate: getToday(),
        entries: [],
        status: 'active',
        lunarPhaseAtStart: lunarPhase,
    };

    all.unshift(script);
    saveScripts(all);
    return script;
}

/**
 * Get the currently active Sacred Script (only 1 at a time).
 */
export function getActiveScript(): SacredScript | null {
    return getScripts().find(s => s.status === 'active') ?? null;
}

/**
 * Get all completed scripts ("Sacred Texts").
 */
export function getCompletedScripts(): SacredScript[] {
    return getScripts().filter(s => s.status === 'completed');
}

/**
 * Abandon the active script.
 */
export function abandonScript(id: string): void {
    const all = getScripts();
    const script = all.find(s => s.id === id);
    if (script) {
        script.status = 'abandoned';
        saveScripts(all);
    }
}

/**
 * Pause a script (freeze day counter, preserve progress).
 */
export function pauseScript(id: string): void {
    const all = getScripts();
    const script = all.find(s => s.id === id);
    if (script && script.status === 'active') {
        script.status = 'paused';
        saveScripts(all);
    }
}

/**
 * Resume a paused script. Pauses any currently active script first.
 * Adjusts the startDate so the day counter continues from where it left off.
 */
export function resumeScript(id: string): void {
    const all = getScripts();
    const script = all.find(s => s.id === id);
    if (!script || script.status !== 'paused') return;

    // Pause any currently active script
    for (const s of all) {
        if (s.status === 'active') {
            s.status = 'paused';
        }
    }

    // Calculate how many PAST days were completed (exclude today's entry)
    // so getScriptProgress returns the correct dayNumber
    const today = getToday();
    const completedDays = script.entries.filter(e => e.date < today).length;
    const newStart = new Date(today + 'T00:00:00');
    newStart.setDate(newStart.getDate() - completedDays);
    script.startDate = newStart.toISOString().slice(0, 10);

    script.status = 'active';
    saveScripts(all);
}

/**
 * Get all paused scripts.
 */
export function getPausedScripts(): SacredScript[] {
    return getScripts().filter(s => s.status === 'paused');
}

/**
 * Find the Sacred Script linked to a specific manifestation ID.
 * Returns the active or paused script (prefers active).
 */
export function getScriptByManifestationId(manifestationId: string): SacredScript | null {
    const scripts = getScripts().filter(s =>
        s.manifestationId === manifestationId && (s.status === 'active' || s.status === 'paused')
    );
    // Prefer active, then paused
    return scripts.find(s => s.status === 'active')
        ?? scripts.find(s => s.status === 'paused')
        ?? null;
}

/**
 * Delete a script permanently.
 */
export function deleteScript(id: string): void {
    const all = getScripts().filter(s => s.id !== id);
    saveScripts(all);
}

// ══════════════════════════════════════
// PUBLIC API — RITUAL ENTRIES
// ══════════════════════════════════════

/**
 * Save a ritual entry for today.
 * Automatically creates the DayEntry if it doesn't exist.
 * Automatically completes the script if day 21 evening is done.
 */
export function saveRitualEntry(
    scriptId: string,
    timeOfDay: TimeOfDay,
    lines: string[],
): DayEntry | null {
    const all = getScripts();
    const script = all.find(s => s.id === scriptId);
    if (!script || script.status !== 'active') return null;

    const today = getToday();
    const dayNumber = daysBetween(script.startDate, today) + 1;

    // Can't go beyond 21 days
    if (dayNumber > CYCLE_DAYS || dayNumber < 1) return null;

    // Find or create today's entry
    let dayEntry = script.entries.find(e => e.date === today);
    if (!dayEntry) {
        dayEntry = { date: today, dayNumber };
        script.entries.push(dayEntry);
    }

    // Save the ritual
    const ritualEntry: RitualEntry = {
        lines: lines.filter(l => l.trim().length > 0),
        completedAt: new Date().toISOString(),
    };
    dayEntry[timeOfDay] = ritualEntry;

    // Check if 21-day cycle is complete (day 21, all 3 rituals done)
    if (dayNumber === CYCLE_DAYS && dayEntry.morning && dayEntry.afternoon && dayEntry.evening) {
        script.status = 'completed';
        script.completedDate = new Date().toISOString();
    }

    saveScripts(all);
    return dayEntry;
}

/**
 * Get today's ritual status for the active script.
 */
export function getTodayRitual(scriptId: string): {
    dayNumber: number;
    entry: DayEntry | null;
    currentTimeOfDay: TimeOfDay;
    isWithinCycle: boolean;
} | null {
    const script = getScripts().find(s => s.id === scriptId);
    if (!script) return null;

    const today = getToday();
    const dayNumber = daysBetween(script.startDate, today) + 1;
    const entry = script.entries.find(e => e.date === today) ?? null;
    const isWithinCycle = dayNumber >= 1 && dayNumber <= CYCLE_DAYS;

    return {
        dayNumber,
        entry,
        currentTimeOfDay: getTimeOfDay(),
        isWithinCycle,
    };
}

// ══════════════════════════════════════
// PUBLIC API — PROGRESS
// ══════════════════════════════════════

/**
 * Get progress summary for a Sacred Script.
 */
export function getScriptProgress(scriptId: string): ScriptProgress | null {
    const script = getScripts().find(s => s.id === scriptId);
    if (!script) return null;

    const today = getToday();
    const dayNumber = Math.min(CYCLE_DAYS, Math.max(1, daysBetween(script.startDate, today) + 1));
    const todayEntry = script.entries.find(e => e.date === today);

    const ritualsToday = {
        morning: !!todayEntry?.morning,
        afternoon: !!todayEntry?.afternoon,
        evening: !!todayEntry?.evening,
    };

    // Count total rituals completed across all days
    let totalRitualsCompleted = 0;
    for (const entry of script.entries) {
        if (entry.morning) totalRitualsCompleted++;
        if (entry.afternoon) totalRitualsCompleted++;
        if (entry.evening) totalRitualsCompleted++;
    }

    const totalRitualsPossible = CYCLE_DAYS * 3; // 21 days × 3 rituals
    const percentage = Math.round((totalRitualsCompleted / totalRitualsPossible) * 100);

    return {
        dayNumber,
        totalDays: CYCLE_DAYS,
        percentage,
        ritualsToday,
        todayComplete: ritualsToday.morning && ritualsToday.afternoon && ritualsToday.evening,
        totalRitualsCompleted,
        totalRitualsPossible,
    };
}

// ══════════════════════════════════════
// TIME-OF-DAY DETECTION
// ══════════════════════════════════════

/**
 * Determine current time of day for ritual selection.
 * Morning: 5am-12pm | Afternoon: 12pm-6pm | Evening: 6pm-5am
 */
export function getTimeOfDay(): TimeOfDay {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'evening';
}

/**
 * Get the next undone ritual for today (for smart auto-selection).
 * Returns the first uncompleted ritual in order: morning → afternoon → evening.
 */
export function getNextRitual(scriptId: string): TimeOfDay | null {
    const ritual = getTodayRitual(scriptId);
    if (!ritual || !ritual.entry) return 'morning';

    const entry = ritual.entry;
    if (!entry.morning) return 'morning';
    if (!entry.afternoon) return 'afternoon';
    if (!entry.evening) return 'evening';
    return null; // All done
}

// ══════════════════════════════════════
// MOON-PHASE-AWARE PROMPTS
// ══════════════════════════════════════

interface MoonPromptSet {
    morning: string;
    afternoon: string;
    evening: string;
}

const MOON_PROMPTS: Record<string, MoonPromptSet> = {
    'New Moon': {
        morning: 'Plant your words as seeds of intention.',
        afternoon: 'Script what you are bringing to life — the universe is listening.',
        evening: 'What are you grateful to be building from scratch?',
    },
    'Waxing Crescent': {
        morning: 'Nurture the seed you planted. Say it with conviction.',
        afternoon: 'Describe the first signs of growth you feel emerging.',
        evening: 'What small blessings appeared today to support your journey?',
    },
    'First Quarter': {
        morning: 'Affirm your courage — obstacles are tests, not walls.',
        afternoon: 'Script yourself moving past the resistance with grace.',
        evening: 'What challenge today actually strengthened your resolve?',
    },
    'Waxing Gibbous': {
        morning: 'Feel the momentum. Your affirmation is becoming reality.',
        afternoon: 'Describe the momentum building in vivid detail.',
        evening: 'What evidence of progress showed up today?',
    },
    'Full Moon': {
        morning: 'Speak your affirmation with full lunar power behind it.',
        afternoon: 'Script your celebration — describe the moment it arrives.',
        evening: 'What are you releasing tonight to make space for what\'s yours?',
    },
    'Waning Gibbous': {
        morning: 'Affirm your trust in the timing of the universe.',
        afternoon: 'Script the gratitude you feel for what\'s already in motion.',
        evening: 'What signs and synchronicities did you notice today?',
    },
    'Last Quarter': {
        morning: 'Release attachment to HOW. Affirm trust in WHAT.',
        afternoon: 'Script the peace of surrendering control to divine timing.',
        evening: 'What have you let go of today that no longer serves your vision?',
    },
    'Waning Crescent': {
        morning: 'Rest in your affirmation. Whisper it gently, like a lullaby.',
        afternoon: 'Script your inner stillness — the calm before a new beginning.',
        evening: 'What quiet wisdom arrived today when you stopped trying so hard?',
    },
};

/**
 * Get moon-phase-aware prompt for a specific ritual time.
 */
export function getMoonPrompt(moonPhaseName: string, timeOfDay: TimeOfDay): string {
    const prompts = MOON_PROMPTS[moonPhaseName];
    if (prompts) return prompts[timeOfDay];
    // Fallback
    return RITUAL_CONFIGS[timeOfDay].description;
}

// ══════════════════════════════════════
// ONBOARDING
// ══════════════════════════════════════

/**
 * Check if user has been onboarded to Sacred Script.
 */
export function hasSeenOnboarding(): boolean {
    return safeStorage.getItem(ONBOARDING_KEY) === 'true';
}

/**
 * Mark onboarding as seen.
 */
export function markOnboardingSeen(): void {
    safeStorage.setItem(ONBOARDING_KEY, 'true');
}
