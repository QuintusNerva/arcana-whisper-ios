import { safeStorage } from "./storage.service";
/**
 * Personal Memory Agent — localStorage-based user pattern tracking.
 * Learns reading themes, question keywords, and card patterns to
 * progressively personalize the tarot experience.
 *
 * Key: 'arcana_memory'
 * Privacy: fully anonymous, local-only, user-deletable.
 */

const MEMORY_KEY = 'arcana_memory';
const PERSONALIZATION_THRESHOLD = 5;
const MAX_RECENT_CARDS = 20;

// ── Data model ──

export interface UserMemory {
    readingCount: number;
    themes: Record<string, number>;
    keywords: Record<string, number>;
    recentCards: string[];
    lastReading: string;   // ISO date
    firstReading: string;  // ISO date
}

export interface MemoryProfile {
    dominantTheme: string | null;
    dominantPct: number;
    topKeywords: string[];
    readingCount: number;
    recentCards: string[];
}

export interface MemoryStats {
    readingCount: number;
    dominantTheme: string | null;
    dominantPct: number;
    daysSinceFirst: number;
    tier: string;       // 'Stranger' | 'Familiar' | 'Attuned' | 'Bonded'
    tierIcon: string;
}

// ── Stopwords for keyword extraction ──

const STOPWORDS = new Set([
    'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they',
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'can', 'may', 'might', 'shall', 'must', 'to', 'of', 'in',
    'for', 'on', 'with', 'at', 'by', 'from', 'about', 'as', 'into',
    'through', 'during', 'before', 'after', 'above', 'below', 'between',
    'and', 'but', 'or', 'nor', 'not', 'so', 'if', 'then', 'than', 'that',
    'this', 'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how',
    'all', 'each', 'any', 'both', 'few', 'more', 'most', 'some', 'such',
    'no', 'only', 'same', 'too', 'very', 'just', 'also', 'now', 'here',
    'there', 'up', 'out', 'am', 'going', 'get', 'got', 'know', 'think',
    'want', 'need', 'like', 'make', 'go', 'see', 'come', 'take', 'find',
    'give', 'tell', 'say', 'said', 'let', 'keep', 'try', 'ask', 'seem',
    'help', 'show', 'turn', 'move', 'live', 'run', 'feel', 'really',
    'much', 'still', 'even', 'well', 'back', 'thing', 'things', 'way',
    'something', 'anything', 'everything', 'nothing', 'someone',
]);

// ── Theme label mapping ──

const THEME_LABELS: Record<string, string> = {
    love: 'love & relationships',
    career: 'career & purpose',
    growth: 'spiritual growth',
    general: 'general guidance',
};

// ── Core functions ──

function getMemory(): UserMemory {
    try {
        const raw = safeStorage.getItem(MEMORY_KEY);
        if (raw) return JSON.parse(raw) as UserMemory;
    } catch { /* corrupted data — start fresh */ }
    return {
        readingCount: 0,
        themes: {},
        keywords: {},
        recentCards: [],
        lastReading: '',
        firstReading: '',
    };
}

function saveMemory(memory: UserMemory): void {
    safeStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
}

function extractKeywords(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^a-z\s'-]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && !STOPWORDS.has(w));
}

// ── Public API ──

/**
 * Record a completed reading into memory.
 */
export function recordReading(
    theme: string,
    question?: string,
    cards?: Array<{ id: string }>
): void {
    const memory = getMemory();
    const now = new Date().toISOString();

    memory.readingCount += 1;
    memory.lastReading = now;
    if (!memory.firstReading) memory.firstReading = now;

    // Track theme
    if (theme) {
        memory.themes[theme] = (memory.themes[theme] || 0) + 1;
    }

    // Extract and track keywords from question
    if (question) {
        const words = extractKeywords(question);
        for (const word of words) {
            memory.keywords[word] = (memory.keywords[word] || 0) + 1;
        }
    }

    // Track recent cards (keep last N)
    if (cards) {
        const newIds = cards.map(c => c.id);
        memory.recentCards = [...newIds, ...memory.recentCards].slice(0, MAX_RECENT_CARDS);
    }

    saveMemory(memory);
}

/**
 * Returns the user's computed memory profile.
 */
export function getMemoryProfile(): MemoryProfile {
    const memory = getMemory();

    // Find dominant theme
    let dominantTheme: string | null = null;
    let dominantCount = 0;
    let totalThemeCount = 0;

    for (const [theme, count] of Object.entries(memory.themes)) {
        totalThemeCount += count;
        if (count > dominantCount) {
            dominantCount = count;
            dominantTheme = theme;
        }
    }

    const dominantPct = totalThemeCount > 0
        ? Math.round((dominantCount / totalThemeCount) * 100)
        : 0;

    // Top keywords (up to 5)
    const topKeywords = Object.entries(memory.keywords)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);

    return {
        dominantTheme,
        dominantPct,
        topKeywords,
        readingCount: memory.readingCount,
        recentCards: memory.recentCards,
    };
}

/**
 * Whether the user has enough readings for personalization.
 */
export function isPersonalized(): boolean {
    return getMemory().readingCount >= PERSONALIZATION_THRESHOLD;
}

/**
 * Generate a personalized prefix for reading results.
 * Returns null if not yet personalized.
 */
export function getPersonalizedPrefix(): string | null {
    if (!isPersonalized()) return null;

    const profile = getMemoryProfile();
    if (!profile.dominantTheme || profile.dominantPct < 30) return null;

    const themeLabel = THEME_LABELS[profile.dominantTheme] || profile.dominantTheme;

    // Select a prefix based on dominant theme strength
    if (profile.dominantPct >= 60) {
        const strong = [
            `Your soul's compass consistently points toward ${themeLabel}.`,
            `The cards have noticed your deep connection with ${themeLabel}.`,
            `${themeLabel.charAt(0).toUpperCase() + themeLabel.slice(1)} echoes through your readings like a heartbeat.`,
        ];
        return strong[profile.readingCount % strong.length];
    }

    const moderate = [
        `Your recent journey has been colored by ${themeLabel}.`,
        `The cards sense ${themeLabel} weighing on your mind.`,
        `A thread of ${themeLabel} weaves through your path.`,
    ];
    return moderate[profile.readingCount % moderate.length];
}

/**
 * Get memory context string for AI prompt injection.
 * Returns null if not personalized.
 */
export function getMemoryContextForAI(): string | null {
    if (!isPersonalized()) return null;

    const profile = getMemoryProfile();
    if (!profile.dominantTheme) return null;

    const themeLabel = THEME_LABELS[profile.dominantTheme] || profile.dominantTheme;
    let context = `The seeker has a recurring focus on ${themeLabel} (${profile.dominantPct}% of their readings).`;

    if (profile.topKeywords.length > 0) {
        context += ` They often ask about: ${profile.topKeywords.join(', ')}.`;
    }

    context += ' Weave this context subtly and naturally into your insight without explicitly mentioning statistics.';
    return context;
}

/**
 * Stats for the profile page display.
 */
export function getMemoryStats(): MemoryStats {
    const memory = getMemory();
    const profile = getMemoryProfile();

    let daysSinceFirst = 0;
    if (memory.firstReading) {
        const first = new Date(memory.firstReading).getTime();
        daysSinceFirst = Math.floor((Date.now() - first) / (1000 * 60 * 60 * 24));
    }

    // Tier system
    let tier = 'Stranger';
    let tierIcon = '🌑';
    if (memory.readingCount >= 30) { tier = 'Bonded'; tierIcon = '🌕'; }
    else if (memory.readingCount >= 15) { tier = 'Attuned'; tierIcon = '🌔'; }
    else if (memory.readingCount >= 5) { tier = 'Familiar'; tierIcon = '🌓'; }

    const themeLabel = profile.dominantTheme
        ? THEME_LABELS[profile.dominantTheme] || profile.dominantTheme
        : null;

    return {
        readingCount: memory.readingCount,
        dominantTheme: themeLabel,
        dominantPct: profile.dominantPct,
        daysSinceFirst,
        tier,
        tierIcon,
    };
}

/**
 * Clear all memory data. Privacy control.
 */
export function clearMemory(): void {
    safeStorage.removeItem(MEMORY_KEY);
}
