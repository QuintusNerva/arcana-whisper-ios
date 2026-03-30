/**
 * Spread Insight Prompt Builder
 *
 * Builds the system + user prompts for multi-card tarot spread readings.
 * This is the PRIMARY target for the dynamic tone engine.
 * Extracted from ai.service.ts getSpreadInsight() with Wise Mirror tone engine.
 */

import type { EmpowermentContext } from '../../services/empowerment.service';
import { buildWiseMirrorSystem, type SpreadEnergy } from '../shared/wise-mirror';

// ── Types ──

export interface SpreadCard {
    name: string;
    meaning: string;
    reversed?: string;
    position: string;
    isReversed: boolean;
}

export interface SpreadInsightParams {
    cards: SpreadCard[];
    spread: string;
    theme: string;
    tone: SpreadEnergy;
    question?: string;
    empowermentCtx: EmpowermentContext;
    manifestationCtx: string;
    compassionPrefix: string;
    memoryCtx: string | null;
    readingMemoryCtx: string | null;
    chartCtx: string | null;
}

// ── Builder ──

export function buildSpreadInsightPrompt(params: SpreadInsightParams): {
    system: string;
    user: string;
} {
    const {
        cards, spread, theme, tone, question,
        empowermentCtx, manifestationCtx, compassionPrefix,
        memoryCtx, chartCtx,
    } = params;

    // Build system prompt with Wise Mirror voice + tone variant
    const system = buildWiseMirrorSystem(tone, empowermentCtx, {
        compassionPrefix: empowermentCtx.compassionMode ? compassionPrefix : undefined,
        additionalRules: `
SPREAD READING RULES:
- Synthesize all cards into a COHESIVE NARRATIVE — not isolated card-by-card interpretations.
- Each card should build on the previous one, telling a story across the spread positions.
- If a card is reversed, interpret it as reversed — what's blocked, internalized, or being resisted.
- Always explain what each card means (its core symbolism and teaching) before weaving it into the spread narrative.
- If the seeker's cosmic profile is provided, weave chart and numerological resonance into the narrative — how the cards interact with their natal energies and current life cycle. Integrate naturally, never list mechanically.`,
    });

    // Build user prompt with card layout
    const cardLines = cards.map((c, i) => {
        const orientation = c.isReversed ? '(REVERSED)' : '';
        const meaning = c.isReversed && c.reversed ? c.reversed : c.meaning;
        return `Position ${i + 1} (${c.position}): ${c.name} ${orientation} — ${meaning}`;
    }).join('\n');

    let user = `Interpret this ${spread} tarot spread:\n${cardLines}`;
    user += `\nTheme: ${theme}`;

    if (question) {
        user += `\nThe seeker asks: "${question}"`;
    }
    if (manifestationCtx) {
        user += manifestationCtx;
    }
    if (memoryCtx) {
        user += `\n\n${memoryCtx}`;
    }
    if (params.readingMemoryCtx) {
        user += params.readingMemoryCtx;
    }
    if (chartCtx) {
        user += chartCtx;
    }

    // Spread-specific interpretation guidance
    const spreadGuidance = getSpreadGuidance(spread);
    if (spreadGuidance) {
        user += `\n\n${spreadGuidance}`;
    }

    user += `\n\nProvide a cohesive reading that weaves all cards together. Explain each card's meaning and the story they tell collectively. Focus on insight and the second side of the coin — what is being called in or released.`;

    return { system, user };
}

// ── Spread-Specific Interpretation Guidance ──

function getSpreadGuidance(spread: string): string | null {
    switch (spread) {
        case 'celtic-cross':
            return `CELTIC CROSS INTERPRETATION GUIDE:
The Cross (positions 1-6) reveals the heart of the matter. The Staff (positions 7-10) reveals external forces and trajectory.
- Position 1 (Present) and 2 (Challenge) form the core tension — what IS vs. what CROSSES.
- Compare Position 3 (Conscious goals) with Position 4 (Unconscious roots) — are they aligned or in conflict? Conflict here reveals self-sabotage.
- Position 5 (Past) flowing into Position 6 (Near Future) shows momentum — is the past releasing or repeating?
- Position 9 (Hopes and Fears) is the most psychologically revealing card — the seeker's secret desire often contains their deepest fear, and vice versa.
- Position 10 (Final Outcome) is NOT fate — it's the likely result if current energies continue unchanged.
- If the same suit dominates, the question lives in one domain: Cups=emotional, Swords=mental, Pentacles=material, Wands=creative/passion.`;

        case 'horseshoe':
            return `HORSESHOE INTERPRETATION GUIDE:
This is the decision-maker's spread. Read it as a journey from past to outcome with hidden forces revealed.
- Position 3 (Hidden Influences) is the most critical card — it shows what the seeker cannot see yet. Give this card extra weight.
- Compare Position 4 (The Querent's attitude) with Position 5 (Influence of Others) — is the seeker's inner state aligned or conflicting with external forces?
- Position 6 (Action/Advice) answers "what should I do?" — make this practical and actionable.
- Position 7 (Final Outcome) should be read in light of Position 6 — the outcome depends on whether the seeker follows the advice.`;

        case 'stay-or-go':
            return `STAY OR GO INTERPRETATION GUIDE:
This spread mirrors both paths so the seeker can choose from clarity, not emotional fog.
- Position 1 (Current Reality) must be brutally honest — strip away nostalgia and "what ifs."
- Compare Position 2 (Case for Staying) with Position 3 (Case for Leaving) directly — which card carries more life force?
- CRITICAL: Compare Position 4 (Path of Staying) with Position 5 (Path of Leaving) side by side. Does one feel heavy and stagnant while the other feels light but scary? This contrast often provides the breakthrough.
- Position 6 (Core Advice) is the North Star — this card doesn't tell the seeker what to do, but what truth they need to embrace to decide for themselves.
- Adjust interpretation based on context: a 20-year marriage vs. a 3-month relationship have very different stakes.`;

        case 'relationship':
            return `RELATIONSHIP CROSS INTERPRETATION GUIDE:
This is a cross-shaped layout — the two people's energies meet at the center (Present).
- Position 1 (You) and Position 2 (Them) sit on opposite sides — compare them directly. Are they in harmony or tension?
- Position 3 (Foundation) reveals the core root that brought them together — this is the "why" of the relationship.
- Position 4 (Present) sits at the center where all energies intersect — this is the actual health of the connection right now.
- Position 5 (Future) shows trajectory IF current energies continue — this is not fixed, it's the most likely path.
- If Position 1 and 2 are the same suit, the two people are energetically aligned. Different suits suggest different wavelengths.`;

        case 'career':
            return `CAREER PATH INTERPRETATION GUIDE:
A focused, action-oriented spread. Look for connections between cards.
- Position 1 (Current Energy) sets the emotional baseline — how the seeker FEELS about their work, not just the facts.
- Position 2 (Potential Growth) reveals what the seeker is NOT seeing — blind spots in their professional landscape.
- Position 3 (The Obstacle) identifies the specific blocker — is it external (company, industry) or internal (self-doubt, fear)?
- CRITICAL: Compare Position 3 (Obstacle) with Position 4 (Advice). If the Obstacle is self-limitation and the Advice is expansion, the message is that mindset is the only thing stopping them.
- Position 4 (Actionable Advice) must be PRACTICAL — give specific guidance, not vague spiritual platitudes.`;

        case 'three-card':
            return `3-CARD INTERPRETATION GUIDE:
Read the three cards as a STORYLINE flowing left to right.
- Do the cards get more positive from card 1 to card 3? (Progress and momentum)
- Do they get heavier? (Growing challenge that needs attention)
- Is there a blockage in the middle card? (Something stopping card 1 from reaching card 3)
- Are all three cards the same suit? The question lives in one domain: Cups=emotional, Swords=mental, Pentacles=material, Wands=creative.
- If this is a Mind/Body/Spirit reading: look for suit-position interconnections. A Sword in Mind + Pentacle in Body may suggest mental anxiety causing physical tension. A Cup in Spirit suggests emotional fulfillment is the path to spiritual connection.`;

        default:
            return null;
    }
}
