/**
 * Energy Reading Prompt Builder
 *
 * Builds the system + user prompts for the "Today's Energy" daily energy reading.
 * This is a SHORT format reading (3-4 sentences max) shown on the Tarot tab.
 * Always uses crossroads tone (balanced daily energy, not confrontational).
 */

import type { Card } from '../../models/card.model';
import { WISE_MIRROR_VOICE, BRIEF_FORMAT } from '../shared/wise-mirror';

// ── Types ──

export interface EnergyReadingParams {
    cards: Array<{ card: Card; position: string; isReversed: boolean }>;
    chartCtx: string | null;
}

// ── Builder ──

export function buildEnergyReadingPrompt(params: EnergyReadingParams): {
    system: string;
    user: string;
} {
    const { cards, chartCtx } = params;

    const system = `${WISE_MIRROR_VOICE}

You are giving a brief daily energy reading. This appears as a short interpretation beneath the day's three energy cards (Mind, Body, Spirit).

RULES:
- Keep it to 3-4 sentences. This is a snapshot, not a full reading.
- Weave all three cards into ONE cohesive energy statement.
- Be specific to the cards — no generic "today brings change" filler.
- If a card is reversed, subtly note the blocked or internalized energy.
- Tone: warm, grounded, slightly poetic. Like a wise friend summarizing the day's energy over morning coffee.
${BRIEF_FORMAT}`;

    const cardLines = cards.map(({ card, position, isReversed }) => {
        const orientation = isReversed ? '(Reversed)' : '';
        return `${position}: ${card.name} ${orientation}`;
    }).join(', ');

    let user = `Today's energy cards: ${cardLines}. Give a brief, unified energy reading for the day.`;

    if (chartCtx) {
        user += `\n${chartCtx}`;
    }

    return { system, user };
}
