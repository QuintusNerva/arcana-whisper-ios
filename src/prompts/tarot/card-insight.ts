/**
 * Card Insight Prompt Builder
 *
 * Builds the system + user prompts for single-card tarot readings.
 * Extracted from ai.service.ts getCardInsight() with Wise Mirror tone engine.
 */

import type { EmpowermentContext } from '../../services/empowerment.service';
import { buildWiseMirrorSystem, type SpreadEnergy } from '../shared/wise-mirror';

// ── Types ──

export interface CardInsightParams {
    cardName: string;
    cardMeaning: string;
    cardReversed: string;
    isReversed: boolean;
    tone: SpreadEnergy;
    theme?: string;
    question?: string;
    empowermentCtx: EmpowermentContext;
    manifestationCtx: string;
    compassionPrefix: string;
    memoryCtx: string | null;
    chartCtx: string | null;
}

// ── Builder ──

export function buildCardInsightPrompt(params: CardInsightParams): {
    system: string;
    user: string;
} {
    const {
        cardName, cardMeaning, cardReversed, isReversed,
        tone, theme, question, empowermentCtx,
        manifestationCtx, compassionPrefix, memoryCtx, chartCtx,
    } = params;

    // Build system prompt with Wise Mirror voice + tone
    const system = buildWiseMirrorSystem(tone, empowermentCtx, {
        compassionPrefix: empowermentCtx.compassionMode ? compassionPrefix : undefined,
        additionalRules: `
CARD-SPECIFIC RULES:
- Always explain the card's core symbolism, archetype, and traditional meaning BEFORE offering personal insight.
- If the card is reversed, lead with the reversed interpretation — what's blocked, delayed, or internalized.
- If the seeker's cosmic profile is provided, subtly weave astrological and numerological resonance into the card interpretation. Do NOT list placements mechanically; integrate naturally.`,
    });

    // Build user prompt
    const activeMeaning = isReversed ? cardReversed : cardMeaning;
    const orientation = isReversed ? '(REVERSED)' : '(Upright)';

    let user = `Give a personalized insight for "${cardName}" ${orientation}.
${isReversed ? 'Reversed' : 'Upright'} meaning: ${activeMeaning}
${isReversed ? `Upright meaning (for contrast): ${cardMeaning}` : `Reversed meaning (for contrast): ${cardReversed}`}`;

    if (theme) {
        user += `\nThe seeker's focus area is: ${theme}`;
    }
    if (question) {
        user += `\nTheir question: "${question}"`;
    }
    if (manifestationCtx) {
        user += manifestationCtx;
    }
    if (memoryCtx) {
        user += `\n\n${memoryCtx}`;
    }
    if (chartCtx) {
        user += chartCtx;
    }

    return { system, user };
}
