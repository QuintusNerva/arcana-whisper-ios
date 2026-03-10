/**
 * Empowerment Service — Contextual Intelligence for Manifestation Integration
 *
 * Classifies reading context to determine which side of the coin leads:
 * - GRIEF/LOSS → metaphysical leads, gentle manifestation invitation only
 * - SEEKING_CLARITY → metaphysical leads, then manifestation asks
 * - ACTIVE_DESIRE → both sides fully in dialogue
 *
 * Also detects distress signals to trigger compassion mode in the AI.
 */

export type ReadingContext =
    | 'grief_or_loss'
    | 'illness_other'
    | 'past_processing'
    | 'decision_support'
    | 'desire_forward'
    | 'daily_general';

export interface EmpowermentContext {
    readingContext: ReadingContext;
    isDistressed: boolean;
    hasCrisisCards: boolean;
    crisisCardNames: string[];
    latentIntention: string | null;   // Derived from question if no active manifestation
    compassionMode: boolean;          // True when distress + crisis cards align
}

// ── Distress signal words ──

const GRIEF_WORDS = new Set([
    'died', 'death', 'dead', 'passed', 'passing', 'loss', 'lost', 'grief',
    'grieve', 'grieving', 'mourning', 'mourn', 'funeral', 'heaven', 'afterlife',
    'crossed over', 'gone', 'terminal', 'hospice', 'cancer', 'diagnosis',
    'sick', 'illness', 'hospital', 'dying', 'end of life',
]);

const CRISIS_WORDS = new Set([
    'suicid', 'self-harm', 'hurt myself', 'end it', 'can\'t go on',
    'hopeless', 'worthless', 'no point', 'give up', 'overdose',
]);

const PAST_WORDS = new Set([
    'why did', 'why didn\'t', 'why couldn\'t', 'what happened', 'looking back',
    'in hindsight', 'regret', 'should have', 'could have', 'would have',
]);

// Cards that often appear in difficult readings — not inherently bad, but context matters
const CRISIS_CARDS = new Set([
    'The Tower', 'The Devil', 'Death', 'The Moon',
    'Three of Swords', '3 of Swords',
    'Ten of Swords', '10 of Swords',
    'Five of Cups', '5 of Cups',
    'Nine of Swords', '9 of Swords',
    'Eight of Swords', '8 of Swords',
]);

/**
 * Classify a reading based on the question text.
 * Returns the ReadingContext enum value.
 */
export function classifyReadingContext(question?: string): ReadingContext {
    if (!question || question.trim().length === 0) return 'daily_general';

    const q = question.toLowerCase();

    // Check grief/loss first (highest priority)
    for (const word of GRIEF_WORDS) {
        if (q.includes(word)) return 'grief_or_loss';
    }

    // Past processing — "why did X happen"
    for (const word of PAST_WORDS) {
        if (q.includes(word)) return 'past_processing';
    }

    // Decision support — conditional/should questions
    if (q.match(/\b(should i|should we|is it right|is this right|do i|would it|is he|is she|will they|are they)\b/)) {
        return 'decision_support';
    }

    // Active desire — "I want", "how do I", "how can I", "I am calling in"
    if (q.match(/\b(i want|i need|i am calling|i\'m calling|how do i|how can i|help me|guide me|what should i do|next step|manifest|attract|create|build|achieve|career|relationship|love|financial|abundance|growth|purpose)\b/)) {
        return 'desire_forward';
    }

    return 'daily_general';
}

/**
 * Detect emotional distress signals in the question text.
 */
export function detectDistress(question?: string): boolean {
    if (!question) return false;
    const q = question.toLowerCase();
    for (const word of CRISIS_WORDS) {
        if (q.includes(word)) return true;
    }
    return false;
}

/**
 * Check drawn cards for crisis/challenge cards.
 */
export function detectCrisisCards(cardNames: string[]): { hasCrisis: boolean; crisisCards: string[] } {
    const found = cardNames.filter(name => CRISIS_CARDS.has(name));
    return {
        hasCrisis: found.length >= 2, // 2+ crisis cards = flag (not just one)
        crisisCards: found,
    };
}

/**
 * Extract a latent intention from the question text.
 * Used when no active manifestation is declared.
 * Returns a short theme string for AI injection.
 */
export function extractLatentIntention(question?: string): string | null {
    if (!question || question.trim().length < 5) return null;

    const q = question.toLowerCase();

    // Common question theme patterns → latent desire
    if (q.match(/partner|relationship|love|marriage|together|back together/)) return 'deeper connection and relationship healing';
    if (q.match(/job|career|work|business|money|financial|abundance|success/)) return 'career success and financial abundance';
    if (q.match(/health|heal|body|wellness|energy|tired/)) return 'physical health and vitality';
    if (q.match(/family|mother|father|parent|child|sibling/)) return 'family harmony and understanding';
    if (q.match(/purpose|path|direction|calling|meant to|destiny/)) return 'clarity on life purpose and direction';
    if (q.match(/move|relocate|travel|change|transition/)) return 'a smooth and aligned transition';
    if (q.match(/friend|friendship|social|community/)) return 'meaningful connection and friendship';
    if (q.match(/confidence|courage|fear|anxiety|worry/)) return 'inner courage and self-trust';
    if (q.match(/creative|art|music|write|create|passion/)) return 'creative expression and flow';
    if (q.match(/spiritual|growth|wisdom|awakening|consciousness/)) return 'spiritual growth and deeper wisdom';

    // Generic fallback — return null so AI derives it organically
    return null;
}

/**
 * Build full empowerment context for a reading.
 * This is the main function called before generating any AI reading.
 */
export function buildEmpowermentContext(
    question?: string,
    cardNames: string[] = [],
): EmpowermentContext {
    const readingContext = classifyReadingContext(question);
    const isDistressed = detectDistress(question);
    const { hasCrisis, crisisCards } = detectCrisisCards(cardNames);
    const latentIntention = extractLatentIntention(question);

    // Compassion mode: explicit distress OR grief context + crisis cards together
    const compassionMode = isDistressed || readingContext === 'grief_or_loss';

    return {
        readingContext,
        isDistressed,
        hasCrisisCards: hasCrisis,
        crisisCardNames: crisisCards,
        latentIntention,
        compassionMode,
    };
}

/**
 * Build the manifestation context injection string for AI prompts.
 * Returns a formatted string to append to the user prompt.
 */
export function buildManifestationContextString(
    ctx: EmpowermentContext,
    activeManifestations: Array<{ declaration: string }> = [],
): string {
    const parts: string[] = [];

    // Active manifestation takes priority
    if (activeManifestations.length > 0) {
        const decl = activeManifestations[0].declaration;
        parts.push(`\n\nThe seeker has an active manifestation: "${decl}". Frame your interpretation through this lens — how do the cards relate to what they're calling in? What should they embrace, what should they release?`);
        return parts.join('');
    }

    // Grief/loss — gentle framing only
    if (ctx.readingContext === 'grief_or_loss') {
        parts.push(`\n\nThis is a grief or loss reading. Lead with deep compassion and space-holding. After providing comfort and clarity, gently close with: "What do you want to carry forward from this love?" — never push manifestation or action.`);
        return parts.join('');
    }

    // Past processing — acknowledgment first
    if (ctx.readingContext === 'past_processing') {
        parts.push(`\n\nThe seeker is processing something that already happened. Focus on acknowledgment, validation, and understanding. At the end, gently invite: "Now that you see this more clearly — what do you want to create from here?"`);
        return parts.join('');
    }

    // Latent intention derived from question
    if (ctx.latentIntention) {
        parts.push(`\n\nNo declared manifestation exists, but this seeker's question reveals a latent intention: "${ctx.latentIntention}". Frame the reading through this lens — what are the cards saying about their ability to call this in? What needs to be released? What's supporting them?`);
        return parts.join('');
    }

    // Daily general — card becomes the discovery
    if (ctx.readingContext === 'daily_general') {
        parts.push(`\n\nNo question or intention was set. After your interpretation, close with: "What does this card make you feel ready to call in or release?"`);
    }

    return parts.join('');
}

/**
 * Build the compassion mode system prompt prefix for distress situations.
 */
export function buildCompassionSystemPrefix(): string {
    return `You are a compassionate, gentle guide. The seeker is going through something difficult and tender.

YOUR APPROACH:
- Lead with warmth, not wisdom. They need to feel HELD before they can hear guidance.
- Before interpreting, open with: "Before we look at what the cards are showing, take a slow breath. Whatever you're carrying right now is real."
- Keep your tone soft, unhurried, and non-prescriptive. No action-pushing.
- If the situation involves illness, loss, or grief: focus on comfort and the love that remains, not on changing outcomes.
- End with human connection, not advice. Something like: "You don't have to figure this out today."
- Include at the very end (subtly, not prominently): "If you're feeling overwhelmed, talking to someone you trust can help. You don't have to carry this alone."

`;
}
