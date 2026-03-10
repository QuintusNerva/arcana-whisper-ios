import { extractTopicCategory, getTopicHistory } from './memory.service';

/**
 * Mindful Reading Service — Anti-Confirmation Bias Engine (Phase 2)
 *
 * Detects when a user is repeatedly asking about the same topic in a short window.
 * A gentle, compassionate nudge is shown before their next reading, inviting them
 * to sit with what they already know — without blocking the reading.
 *
 * Threshold: 3+ questions about the same topic within 7 days.
 */

const TOPIC_DISPLAY: Record<string, string> = {
    love: 'love and relationships',
    career: 'career and finances',
    health: 'health and healing',
    family: 'family',
    purpose: 'purpose and spirituality',
    decision: 'a decision you\'re weighing',
};

const WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const REPEAT_THRESHOLD = 3;

export interface MindfulCheck {
    shouldWarn: boolean;
    topicName: string;       // Display name
    topicKey: string;        // Raw key
    occurrences: number;     // Count in window
    daySpan: number;         // Window in days
    message: string;         // Compassionate nudge text
}

const EMPTY_CHECK: MindfulCheck = {
    shouldWarn: false,
    topicName: '',
    topicKey: '',
    occurrences: 0,
    daySpan: 7,
    message: '',
};

/**
 * Check whether the user has repeatedly asked about the same topic this week.
 * @param question - The user's question text (used as fallback for topic extraction)
 * @param theme    - The explicitly selected reading theme ('love', 'career', etc.).
 *                   Takes priority over text extraction.
 * Returns a compassionate warning object if the threshold is met.
 */
export function checkForRepeatedTopic(question: string, theme?: string | null): MindfulCheck {
    const topicKey = theme || extractTopicCategory(question);
    if (!topicKey) return EMPTY_CHECK;

    const history = getTopicHistory(topicKey);
    if (!history || history.dates.length < REPEAT_THRESHOLD) {
        return { ...EMPTY_CHECK, topicKey, occurrences: history?.dates.length ?? 0 };
    }

    // Count occurrences within the rolling window
    const now = Date.now();
    const recentDates = history.dates.filter(d => now - new Date(d).getTime() < WINDOW_MS);

    if (recentDates.length < REPEAT_THRESHOLD) {
        return { ...EMPTY_CHECK, topicKey, occurrences: recentDates.length };
    }

    const displayName = TOPIC_DISPLAY[topicKey] ?? topicKey;

    return {
        shouldWarn: true,
        topicKey,
        topicName: displayName,
        occurrences: recentDates.length,
        daySpan: 7,
        message: buildNudgeMessage(displayName, recentDates.length),
    };
}

function buildNudgeMessage(displayName: string, count: number): string {
    const messages = [
        `You've asked about ${displayName} ${count} times this week. The cards are always here for you — and sometimes, asking the same question is a sign that the answer already lives within you. Would you like to pause and breathe before we continue?`,
        `Your heart has returned to questions about ${displayName} ${count} times recently. This is sacred space, not a judgment. The cards will show you what you need — but the wisdom you're seeking may already be present. Continue when you feel ready.`,
        `The universe notices you've been sitting with ${displayName} (${count} readings this week). That persistence takes courage. Sometimes the cards reflect our fears back to us, not our truth. Trust what you already know.`,
    ];
    return messages[count % messages.length];
}

/**
 * Whether the user has ANY repeated topic warning today (not just the current question).
 * Used to show a subtle indicator on the reading entry screen.
 */
export function hasMindfulWarningToday(): boolean {
    // Lightweight check — just see if any topic has 3+ today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return false; // Placeholder — full implementation below if needed
}
