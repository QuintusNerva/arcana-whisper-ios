/**
 * Reading Context Builder — Builds prompt-injectable memory context.
 *
 * STRICT GUARDRAILS:
 * 1. Only activates after 3+ readings stored
 * 2. Only injects same-theme past readings (love→love, career→career)
 * 3. Includes actual question text so the AI can judge if the SITUATION is the same
 *    (e.g., love reading about Person A ≠ love reading about Person B)
 * 4. Recurring cards are always mentioned regardless of theme (a card stalking you is universal)
 * 5. Explicit instruction: if nothing genuinely connects, say nothing about history
 */

import {
    getSnapshotsByTheme,
    getRecurringCards,
    getSnapshotCount,
    type ReadingSnapshot,
} from '../../services/reading-memory.service';

const MEMORY_ACTIVATION_THRESHOLD = 3;

/**
 * Build the reading memory context string for prompt injection.
 *
 * @param currentTheme - The theme of the current reading
 * @param currentQuestion - The user's current question (for AI to compare)
 * @returns Prompt-injectable string, or null if not enough data / no relevant history
 */
export function buildReadingMemoryContext(
    currentTheme: string,
    currentQuestion?: string,
): string | null {
    // Gate: need enough readings for memory to be meaningful
    if (getSnapshotCount() < MEMORY_ACTIVATION_THRESHOLD) return null;

    const parts: string[] = [];

    // ── 1. Same-theme past readings (with question text for AI comparison) ──
    // GUARDRAILS:
    // - Skip "general" theme — too vague, would match unrelated readings
    // - Skip if current reading has no question — can't judge situational relevance
    // - Only include past readings from the last 30 days (staleness filter)
    const isSpecificTheme = currentTheme && currentTheme !== 'general';
    const hasQuestion = !!currentQuestion && currentQuestion.trim().length > 0;

    if (isSpecificTheme && hasQuestion) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoff = thirtyDaysAgo.toISOString();

        const sameThemeReadings = getSnapshotsByTheme(currentTheme, 3)
            .filter(snap => snap.date >= cutoff);       // staleness filter

        if (sameThemeReadings.length > 0) {
            const summaries = sameThemeReadings.map(snap => formatSnapshot(snap)).join('\n');
            parts.push(`SAME-TOPIC PAST READINGS (${currentTheme}):\n${summaries}`);
        }
    }

    // ── 2. Recurring cards (theme-agnostic — a stalker card is always relevant) ──
    const recurring = getRecurringCards(30);

    if (recurring.length > 0) {
        const cardLines = recurring.slice(0, 3).map(rc => {
            const orientations = rc.wasReversed.filter(Boolean).length;
            const totalAppearances = rc.count;
            const reversedNote = orientations > 0
                ? ` (${orientations} of ${totalAppearances} times reversed)`
                : ' (always upright)';
            return `• ${rc.name}: appeared ${rc.count} times in the last 30 days${reversedNote}`;
        });
        parts.push(`RECURRING CARDS:\n${cardLines.join('\n')}`);
    }

    // Nothing relevant found
    if (parts.length === 0) return null;

    // ── Assemble with strict guardrail instructions ──
    const memoryBlock = parts.join('\n\n');

    // Cap total context to ~1500 chars to avoid eating into AI response token budget
    const MAX_CONTEXT_CHARS = 1500;
    const truncatedBlock = memoryBlock.length > MAX_CONTEXT_CHARS
        ? memoryBlock.slice(0, MAX_CONTEXT_CHARS) + '\n[...truncated for brevity]'
        : memoryBlock;

    return `\nREADING MEMORY — USE WITH EXTREME CARE:
${truncatedBlock}

RULES FOR USING THIS MEMORY:
- ONLY reference a past reading if the SITUATION is clearly the same — not just the same topic. A love reading about one person is NOT the same as a love reading about a different person. Compare the actual questions.
- Recurring cards ARE always worth noting — a card appearing 3+ times is significant regardless of topic.
- If nothing from their history genuinely connects to THIS specific reading, DO NOT MENTION THEIR HISTORY AT ALL. A fresh reading that stands on its own is better than a forced callback.
- When you DO reference history, weave it naturally: "This card appeared in your last reading too — its persistence is significant" — NOT "According to my records, on March 15th you drew..."
- Never list dates or statistics. Sound like a mystic who remembers, not a database.`;
}

/**
 * Format a single snapshot for prompt injection.
 * Includes question text so the AI can judge situational relevance.
 */
function formatSnapshot(snap: ReadingSnapshot): string {
    const daysAgo = Math.floor(
        (Date.now() - new Date(snap.date).getTime()) / (1000 * 60 * 60 * 24)
    );
    const timeLabel = daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : `${daysAgo} days ago`;

    const cardList = snap.cards
        .map(c => `${c.name}${c.isReversed ? ' (reversed)' : ''}`)
        .join(', ');

    let line = `• ${timeLabel} (${snap.spreadType}, ${snap.energyScore}): drew ${cardList}`;

    // Include the question so AI can judge if the situation matches
    if (snap.question) {
        const truncated = snap.question.length > 100
            ? snap.question.slice(0, 100) + '...'
            : snap.question;
        line += `\n  Question: "${truncated}"`;
    }

    // Include AI summary if available (most useful piece for continuity)
    if (snap.aiSummary) {
        const truncated = snap.aiSummary.length > 150
            ? snap.aiSummary.slice(0, 150) + '...'
            : snap.aiSummary;
        line += `\n  Key insight: ${truncated}`;
    }

    return line;
}
