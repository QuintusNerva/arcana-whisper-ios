/**
 * Declaration of Ambition — Post-Reading Prompt Builder
 * 
 * Generates a first-person "I am..." declaration that bridges
 * the reading insight into an actionable manifestation.
 * 
 * Part of the Wise Mirror framework (src/prompts/).
 */

import { WISE_MIRROR_VOICE } from '../shared/wise-mirror';
import type { SpreadEnergy } from '../shared/wise-mirror';

export interface DeclarationParams {
    /** Cards drawn in the reading */
    cards: Array<{ name: string; position: string; isReversed?: boolean }>;
    /** The spread type used */
    spread: string;
    /** Energy tone of the reading */
    tone: SpreadEnergy;
    /** User's original question (if any) */
    question?: string;
    /** Theme of the reading */
    theme: string;
    /** The AI reading text (to ground the declaration) */
    readingText: string;
}

/**
 * Build the system + user prompt for generating a Declaration of Ambition.
 */
export function buildDeclarationPrompt(params: DeclarationParams): { system: string; user: string } {
    const { cards, spread, tone, question, theme, readingText } = params;

    const toneGuidance = tone === 'challenging'
        ? `The reading revealed difficult truths. The declaration should acknowledge the challenge and claim the strength to face it. Frame it as reclamation — "I am reclaiming..." or "I am choosing to see..." Not toxic positivity. Honest resolve.`
        : tone === 'affirming'
            ? `The reading was affirming. The declaration should amplify what's already working — "I am stepping deeper into..." or "I am expanding..." Celebrate momentum without complacency.`
            : `The reading revealed a crossroads. The declaration should name the choice and claim a direction — "I am choosing..." or "I am moving toward..." Decisive energy, not wishy-washy.`;

    const system = `${WISE_MIRROR_VOICE}

You are generating a Declaration of Ambition — a first-person statement the seeker will carry forward from this reading.

RULES:
1. Exactly 1-2 sentences. No more.
2. Must start with "I am" or "I choose" or "I release" — always first person.
3. Must be SPECIFIC to what the cards revealed. Reference at least one card's energy or teaching (not by name — by what it showed).
4. Must feel like something the seeker would want to say aloud. Powerful. Personal. Not generic.
5. No questions. No hedging. No "I hope" or "I will try." This is a declaration — spoken with conviction.
6. Match the emotional register of the reading. ${toneGuidance}

BAD EXAMPLES (too generic):
- "I am open to the universe's guidance" ← empty
- "I choose to trust the process" ← says nothing specific
- "I am manifesting my best life" ← meaningless

GOOD EXAMPLES (specific to cards/reading):
- "I am dismantling the walls I built to feel safe and stepping into the vulnerability my next chapter demands."
- "I am choosing clarity over comfort — the truth I've been avoiding is the door I need to walk through."
- "I am building the structure my vision has been waiting for, one disciplined day at a time."

Return ONLY the declaration text. No quotes, no preamble, no explanation.`;

    const cardSummary = cards.map(c =>
        `${c.position}: ${c.name}${c.isReversed ? ' (reversed)' : ''}`
    ).join('\n');

    // Truncate reading to ~500 chars to keep prompt lean
    const truncatedReading = readingText.length > 500
        ? readingText.slice(0, 500) + '...'
        : readingText;

    let user = `Generate a Declaration of Ambition based on this ${spread} reading.

CARDS DRAWN:
${cardSummary}

READING ENERGY: ${tone}
THEME: ${theme}`;

    if (question) {
        user += `\nSEEKER'S QUESTION: "${question}"`;
    }

    user += `\n\nREADING SUMMARY (for context — do NOT repeat it):
${truncatedReading}`;

    return { system, user };
}
