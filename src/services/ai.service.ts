import { safeStorage } from "./storage.service";
import {
    buildEmpowermentContext,
    buildManifestationContextString,
    buildCompassionSystemPrefix,
    type EmpowermentContext,
} from './empowerment.service';
import { getActiveManifestations } from './manifestation.service';
import {
    getBirthData, getNatalTriad, getLifePathNumber, getCurrentPersonalYear,
    getDestinyName, getDestinyNumber,
} from './astrology.service';

/**
 * AI Interpretation Service — OpenRouter Integration
 * Uses Claude Haiku 4.5 via OpenRouter for all AI interpretations.
 * Tarot prompts powered by the Wise Mirror framework (src/prompts/).
 */

import { getMemoryContextForAI } from './memory.service';

// Wise Mirror prompt builders
import { TEACHING_FORMAT } from '../prompts/shared/wise-mirror';
import { scoreSpreadEnergy, type DrawnCard } from '../prompts/shared/energy-scorer';
import { buildCardInsightPrompt } from '../prompts/tarot/card-insight';
import { buildSpreadInsightPrompt } from '../prompts/tarot/spread-insight';
import { buildEnergyReadingPrompt } from '../prompts/tarot/energy-reading';
import { buildDeclarationPrompt, type DeclarationParams } from '../prompts/tarot/declaration';
import type { Card } from '../models/card.model';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'anthropic/claude-haiku-4.5';
const PREMIUM_MODEL = 'anthropic/claude-haiku-4.5';
const STORAGE_KEY = 'openrouter_api_key';

/**
 * Daily cache utility — stores a value keyed to today's date.
 * Returns cached value if generated today, otherwise null.
 */
export const dailyCache = {
    get(key: string): string | null {
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const raw = safeStorage.getItem(`daily_${key}`);
        if (!raw) return null;
        try {
            const { date, value } = JSON.parse(raw);
            return date === today ? value : null;
        } catch { return null; }
    },
    set(key: string, value: string): void {
        const today = new Date().toISOString().slice(0, 10);
        safeStorage.setItem(`daily_${key}`, JSON.stringify({ date: today, value }));
    },
};

/**
 * Permanent cache — for readings that only need to generate once
 * (natal chart, career alignment, numerology, family).
 * Keyed to birth data so it auto-invalidates if user changes their info.
 */
export const permanentCache = {
    get(key: string): string | null {
        return safeStorage.getItem(`perm_${key}`) || null;
    },
    set(key: string, value: string): void {
        safeStorage.setItem(`perm_${key}`, value);
    },
    clear(key: string): void {
        safeStorage.removeItem(`perm_${key}`);
    },
};

/** Shared formatting instruction — re-exported from Wise Mirror shared module */


/**
 * Auto-pull chart + numerology context from stored birth data.
 * Returns a prompt-injectable string, or null if no birth data.
 */
function buildChartNumerologyContext(): string | null {
    try {
        const birthData = getBirthData();
        if (!birthData?.birthday) return null;
        const triad = getNatalTriad(birthData);
        const lifePath = getLifePathNumber(birthData.birthday);
        const personalYear = getCurrentPersonalYear(birthData.birthday);
        const destinyName = getDestinyName();
        const destinyNum = destinyName ? getDestinyNumber(destinyName) : null;

        const numerology = destinyNum
            ? `Life Path: ${lifePath} · Personal Year: ${personalYear} · Destiny Number: ${destinyNum}`
            : `Life Path: ${lifePath} · Personal Year: ${personalYear}`;

        return `\n\nSEEKER'S COSMIC PROFILE (weave naturally — do NOT list mechanically):
☀️ Sun: ${triad.sun.name} (${triad.sun.element}) · 🌙 Moon: ${triad.moon.name} (${triad.moon.element}) · ⬆️ Rising: ${triad.rising.name} (${triad.rising.element})
${numerology}
Use this to personalize how the insight lands — which parts of the reading resonate with their chart energy, and how their current numerological cycle colors the timing.`;
    } catch {
        return null;
    }
}

/**
 * Build a manifestation-aware system prompt prefix.
 * Returns empty string when context doesn't warrant it.
 */
/**
 * Build manifestation system guidance.
 * Re-exported from Wise Mirror shared module for non-tarot methods.
 */
function buildManifestationSystemGuidance(ctx: EmpowermentContext): string {
    if (ctx.compassionMode) return '';
    if (ctx.readingContext === 'grief_or_loss' || ctx.readingContext === 'past_processing') return '';

    return `

MANIFESTATION LENS:
After your primary interpretation (which always comes first), weave in the manifestation dimension:
- What is the seeker's energy CALLING IN right now?
- What do they need to RELEASE for it to flow?
- What cosmic energy is SUPPORTING their intention?
This is the second voice in the conversation, not the first. The reading always leads.`;
}

export class AIService {
    private apiKey: string | null = null;

    constructor() {
        // Prefer env var (set in .env), fall back to localStorage
        this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || safeStorage.getItem(STORAGE_KEY) || null;
    }

    /** Check if a valid API key is configured */
    hasApiKey(): boolean {
        return !!this.apiKey && this.apiKey.length > 10;
    }

    /** Get the stored API key */
    getApiKey(): string {
        return this.apiKey || '';
    }

    /**
     * Get a personalized AI insight for a single card.
     * Now powered by Wise Mirror dynamic tone engine.
     */
    async getCardInsight(
        cardName: string,
        cardMeaning: string,
        cardReversed: string,
        context?: { theme?: string; question?: string },
        empowermentCtx?: EmpowermentContext,
        isReversed: boolean = false,
    ): Promise<string> {
        // Build empowerment context if not provided
        const ctx = empowermentCtx ?? buildEmpowermentContext(context?.question, [cardName]);
        const activeManifestations = getActiveManifestations();
        const manifestationCtx = buildManifestationContextString(ctx, activeManifestations);
        const compassionPrefix = ctx.compassionMode ? buildCompassionSystemPrefix() : '';

        // Score energy for tone selection (single card)
        const cardForScoring: Card = { id: '', name: cardName, description: '', image: '', meaning: cardMeaning, reversed: cardReversed, suit: '' };
        const drawnCards: DrawnCard[] = [{ card: cardForScoring, position: 'Present', isReversed }];
        const tone = scoreSpreadEnergy(drawnCards);

        // Build prompts via Wise Mirror
        const { system, user } = buildCardInsightPrompt({
            cardName,
            cardMeaning,
            cardReversed,
            isReversed,
            tone,
            theme: context?.theme,
            question: context?.question,
            empowermentCtx: ctx,
            manifestationCtx,
            compassionPrefix,
            memoryCtx: getMemoryContextForAI(),
            chartCtx: buildChartNumerologyContext(),
        });

        return this.chat(system, user);
    }

    /**
     * Get a deep AI interpretation for a full spread reading.
     * Now powered by Wise Mirror dynamic tone engine.
     */
    async getSpreadInsight(
        cards: Array<{ name: string; meaning: string; reversed?: string; position: string; isReversed?: boolean }>,
        spread: string,
        theme: string,
        question?: string,
        empowermentCtx?: EmpowermentContext,
    ): Promise<string> {
        // Build empowerment context
        const cardNames = cards.map(c => c.name);
        const ctx = empowermentCtx ?? buildEmpowermentContext(question, cardNames);
        const activeManifestations = getActiveManifestations();
        const manifestationCtx = buildManifestationContextString(ctx, activeManifestations);
        const compassionPrefix = ctx.compassionMode ? buildCompassionSystemPrefix() : '';

        // Score spread energy for tone selection
        const drawnCards: DrawnCard[] = cards.map(c => ({
            card: { id: '', name: c.name, description: '', image: '', meaning: c.meaning, reversed: c.reversed || '', suit: '' } as Card,
            position: c.position,
            isReversed: c.isReversed ?? false,
        }));
        const tone = scoreSpreadEnergy(drawnCards);

        // Build prompts via Wise Mirror
        const { system, user } = buildSpreadInsightPrompt({
            cards: cards.map(c => ({
                name: c.name,
                meaning: c.meaning,
                reversed: c.reversed,
                position: c.position,
                isReversed: c.isReversed ?? false,
            })),
            spread,
            theme,
            tone,
            question,
            empowermentCtx: ctx,
            manifestationCtx,
            compassionPrefix,
            memoryCtx: getMemoryContextForAI(),
            chartCtx: buildChartNumerologyContext(),
        });

        // Scale token budget based on spread depth
        // Needs headroom for: card interpretations + manifestation dimension + natal chart + numerology
        const cardCount = cards.length;
        const tokenBudget = cardCount >= 10 ? 3000
            : cardCount >= 7 ? 2500
            : cardCount >= 4 ? 2000
            : cardCount >= 3 ? 1200
            : 600;

        return this.chat(system, user, tokenBudget);
    }

    /**
     * Get a brief daily energy interpretation for the Today's Energy cards.
     * Uses the short Wise Mirror format (3-4 sentences max).
     */
    async getEnergyReading(
        cards: Card[],
        positions: string[] = ['Mind', 'Body', 'Spirit'],
    ): Promise<string> {
        const cardData = cards.map((card, i) => ({
            card,
            position: positions[i] || `Position ${i + 1}`,
            isReversed: card.isReversed ?? false,
        }));

        const { system, user } = buildEnergyReadingPrompt({
            cards: cardData,
            chartCtx: buildChartNumerologyContext(),
        });

        return this.chat(system, user);
    }

    /**
     * Generate a Declaration of Ambition from a completed reading.
     * Returns a 1-2 sentence first-person declaration.
     */
    async getDeclaration(
        params: {
            cards: Array<{ name: string; position: string; isReversed?: boolean; meaning?: string; reversed?: string }>;
            spread: string;
            theme: string;
            question?: string;
            readingText: string;
        },
    ): Promise<string> {
        // Score energy for tone
        const drawnCards: DrawnCard[] = params.cards.map(c => ({
            card: { id: '', name: c.name, description: '', image: '', meaning: c.meaning || '', reversed: c.reversed || '', suit: '' } as Card,
            position: c.position,
            isReversed: c.isReversed ?? false,
        }));
        const tone = scoreSpreadEnergy(drawnCards);

        const { system, user } = buildDeclarationPrompt({
            ...params,
            tone,
        });

        return this.chat(system, user);
    }

    /**
     * Generate a contextual follow-up question for the pre-reading ritual.
     * The AI asks ONE short, probing question based on the user's initial question.
     * Returns just the question text — no preamble, no explanation.
     */
    async getRitualFollowUp(userQuestion: string): Promise<string> {
        const systemPrompt = `You are an oracle preparing to give a tarot reading. The seeker has shared their question. Your role is to ask ONE short, deeply perceptive follow-up question that will help the reading be more accurate.

Rules:
- Ask exactly ONE question, nothing else
- Keep it under 30 words
- Be specific to what they shared — do NOT ask generic questions
- Sound mystical but clear — like a wise counselor, not a therapist
- Do NOT start with "I" or refer to yourself
- Do NOT add any preamble like "That's a great question" or "I sense..."
- Just the question itself, as if it appeared written by an invisible hand
- If their question is about a relationship, ask about the nature of the dynamic
- If their question is about career or work specifically, ask about what's driving the change
- If their question is about a purchase, investment, or material goal, ask about the timeline or what obstacles they foresee
- If their question is about change, ask whether this is something chosen or something arriving uninvited

Examples of good follow-ups:
- "Is this about something that has already happened, or something you're afraid might?"
- "When you imagine the answer you're hoping for — what does it look like?"
- "Are you seeking permission to act, or clarity about which direction to move?"`;

        const userPrompt = `The seeker's question: "${userQuestion}"

Generate one follow-up question.`;

        return this.chat(systemPrompt, userPrompt, 80);
    }

    /**
     * Recommend a spread + theme based on ritual conversation.
     * Returns structured JSON with spreadId, theme, and explanation.
     * 
     * The Oracle always recommends deep readings — never single/yes-no.
     * Default: Celtic Cross for maximum depth.
     */
    async getRitualSpreadRecommendation(
        question: string,
        followUpAnswer?: string,
    ): Promise<{ spreadId: string; theme: string; explanation: string }> {
        const systemPrompt = `You are an oracle selecting the perfect tarot spread for a seeker. This is a DEEP reading — the Oracle never recommends shallow spreads. Choose the spread that will give the most meaningful insight.

Available spreads (ordered by depth):

1. "celtic-cross" (10 cards) — THE DEFAULT. The most iconic and comprehensive spread in tarot. A "360-degree" view of a situation.
   Two parts: The Cross (cards 1-6) focuses on the heart of the matter. The Staff (cards 7-10) explores external influences and potential paths.
   Positions: 1=Present/heart of matter → 2=The Challenge/what crosses you → 3=Conscious goals/aspirations → 4=Unconscious/hidden roots/foundation → 5=Past/recent events → 6=Near Future/immediate developments → 7=Self/personal perspective → 8=External Influences/other people → 9=Hopes and Fears/secret desires or anxieties → 10=Final Outcome/long-term result.
   Best for: General life reviews, in-depth problem solving, big decisions, identifying blocks, complex situations with multiple forces at play, spiritual growth, career crossroads with many variables.
   Use when: The question has depth and the seeker needs to understand all dimensions. This is your go-to unless another spread is a clearly better fit. Avoid for simple yes/no — use open-ended questions.

2. "horseshoe" (7 cards) — The decision-maker's spread. The middle ground between depth and focus.
   Positions: Past → Present → Hidden Influences → The Querent → Influence of Others → Action/Advice → Final Outcome
   Best for: Decision-making, resolving specific complex problems, troubled relationships that need mending, "what should I do?" questions, understanding hidden influences, when you need actionable advice not just description.
   Use when: The question is about a SPECIFIC situation that needs a clear course of action. More focused than Celtic Cross but still deeply revealing.

3. "relationship" (5 cards) — The Relationship Cross. A cross-shaped layout showing how two energies intersect.
   Positions: 1=You (your current state, feelings, what you contribute) → 2=Them (their state, feelings, how they show up) → 3=Foundation (past influences, the root that brought you together) → 4=Present (the heart of the matter, actual health and vibe right now) → 5=Future (likely outcome if current energies continue).
   Layout: Card 4 (Present) at center, Card 1 (You) left, Card 2 (Them) right, Card 3 (Foundation) below, Card 5 (Future) above. The cross shape visualizes how two people meet at the center.
   Best for: Understanding the energy between two people, love check-ins, commitment questions, strengthening bonds, new relationship potential, general romantic guidance.
   Use when: The question is about a relationship but NOT about leaving or staying. For relationship crisis/decisions, use "stay-or-go" instead.

3b. "stay-or-go" (6 cards) — ORACLE EXCLUSIVE. For relationships in crisis.
   Positions: 1=Current Reality (stripped of nostalgia) → 2=Case for Staying (strengths, growth potential remaining) → 3=Case for Leaving (what is truly missing, deal-breakers, toxic patterns) → 4=Path of Staying (likely emotional landscape if committed) → 5=Path of Leaving (likely landscape if walking away) → 6=Core Advice (fundamental truth to embrace).
   Best for: Relationships facing serious trouble, "should I leave?" questions, infidelity aftermath, toxic dynamics, when someone needs to make a hard decision about their relationship.
   Use when: The seeker's language reveals CRISIS energy — words like leave, stay, go, end, divorce, cheating, forgive, can't take it, breaking point. This is NOT for general relationship questions — only when someone is genuinely weighing whether to stay or go.
   Reading tip: Compare cards 4 and 5 — the contrast between the two paths often provides the breakthrough. Card 6 is the North Star. The AI interprets differently for long marriages vs. new relationships based on ritual context.

4. "career" (4 cards) — Focused professional clarity. Concise but actionable.
   Positions: 1=Current Energy (atmosphere of your work situation, how you feel right now) → 2=Potential Growth (hidden opportunities or advancement you might not be seeing) → 3=The Obstacle (specific challenges, fears, or upcoming hurdles to plan for) → 4=Actionable Advice (best way to leverage your skills, the next practical step).
   Best for: Professional growth, navigating job transitions, skill assessment, identifying career gaps, deciding whether to stay or pivot, money/abundance questions.
   Use when: The question is specifically about work, career, or professional life.
   Reading tip: Look for connections between cards — if the Obstacle is self-limitation and Advice is expansion, the message is that mindset is the only blocker.

5. "three-card" (3 cards) — The "Swiss Army Knife" of tarot. Versatile positions adapt to the question.
   Variations (AI picks the best frame based on context):
   - Timeline: Past (roots) → Present (current energy) → Future (likely path)
   - Decision: Option A → Option B → Information needed to decide
   - Problem Solving: The Problem → The Cause → The Solution
   - Self-Check: Mind → Body → Spirit
   - Relationships: You → The Other Person → The Connection
   Best for: Simple direct questions, daily check-ins, clarification, when a focused snapshot is enough.
   Use when: ONLY if the question is genuinely simple and doesn't warrant more cards. The Oracle should rarely recommend this — most seekers who consult the Oracle want depth.
   Reading tip: Look for a storyline — do cards get more positive left to right (progress)? All same suit (focused domain)? Blockage in the middle card (something stopping progress)?

IMPORTANT RULES:
- BIAS TOWARD DEPTH: The Oracle exists for DEEP readings. Celtic Cross should be your recommendation approximately 40-50% of the time.
- Default to "celtic-cross" for: general life questions, spiritual questions, complex multi-layered situations, timing questions ("when will..."), questions about the future, any question that has emotional weight and no clearly better-fit spread.
- NEVER recommend "single" or "yes-no" — those are for the "Draw Your Own" section, not the Oracle.
- "career" is ONLY for questions explicitly about a JOB, PROFESSION, or WORK — NOT for financial purchases, property, investments, or money in general. If someone asks about buying a house, land, or making a purchase, use "celtic-cross" or "horseshoe" depending on complexity.
- If the question is about a relationship IN CRISIS (leaving, staying, cheating, breaking up), use "stay-or-go".
- If the question is about a relationship generally (love, connection, future together), use "relationship".
- If the question requires a specific decision with clear options (non-relationship), use "horseshoe".
- For spiritual, timing, complex, multi-dimensional, or life-path questions — use "celtic-cross".

Available themes:
- "general" — Universal guidance (use this for property, purchases, timing, life situations)
- "love" — Relationships, heart matters
- "career" — Work, job, profession ONLY (not finances in general)
- "growth" — Spiritual, personal development
- "family" — Home, roots, family dynamics
- "health" — Wellness, healing
- "decision" — Crossroads, choices

Respond ONLY in this exact JSON format, nothing else:
{"spreadId":"...","theme":"...","explanation":"..."}

The explanation should be ONE sentence (max 25 words), mystical but clear, explaining what the cards will reveal. Do NOT mention the spread name.

Examples:
- "When will I buy the land I want?" → {"spreadId":"celtic-cross","theme":"general","explanation":"Ten cards will reveal every force — timing, obstacles, hidden allies, and the momentum carrying you toward what is yours."}
- "Am I ready for this career change?" → {"spreadId":"career","theme":"career","explanation":"Four cards will map the forces pulling you forward and what stands between you and the leap."}
- "How can I strengthen my relationship?" → {"spreadId":"relationship","theme":"love","explanation":"Five cards will illuminate the energy between you — what remains unspoken, what is shifting, and what awaits."}
- "I don't know if I should leave my partner" → {"spreadId":"stay-or-go","theme":"love","explanation":"Six cards will mirror both paths — what stays if you hold on, what opens if you let go, and what your deepest truth already knows."}
- "I don't know what to do about my living situation" → {"spreadId":"horseshoe","theme":"decision","explanation":"Seven cards will reveal the hidden forces at play and illuminate the wisest path forward."}
- "What does the universe want me to know right now?" → {"spreadId":"celtic-cross","theme":"growth","explanation":"Ten cards will lay bare every dimension of your journey — past wounds, present power, and destined direction."}
- "Will I be financially stable this year?" → {"spreadId":"celtic-cross","theme":"general","explanation":"Ten cards will reveal the full landscape of your material journey — what is building, what is shifting, and where abundance waits."}`;

        const userPrompt = `Seeker's question: "${question}"${followUpAnswer ? `\nTheir deepening: "${followUpAnswer}"` : ''}

Select the best spread and theme for this Oracle reading.`;

        const raw = await this.chat(systemPrompt, userPrompt, 120);
        try {
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                // Only allow Oracle-appropriate spreads
                const validSpreads = ['three-card', 'career', 'relationship', 'stay-or-go', 'celtic-cross', 'horseshoe'];
                const validThemes = ['general', 'love', 'career', 'growth', 'family', 'health', 'decision'];
                return {
                    spreadId: validSpreads.includes(parsed.spreadId) ? parsed.spreadId : 'celtic-cross',
                    theme: validThemes.includes(parsed.theme) ? parsed.theme : 'general',
                    explanation: parsed.explanation || 'Ten cards will reveal every dimension of your question.',
                };
            }
        } catch {
            // fallback
        }
        return {
            spreadId: 'celtic-cross',
            theme: 'general',
            explanation: 'Ten cards will lay bare the full landscape of your question — every force, every possibility.',
        };
    }

    /**
     * Get an AI-generated interpretation for a natal chart placement.
     * Returns structured insight for a specific sign in a specific position.
     */
    async getPlacementInsight(
        position: 'sun' | 'moon' | 'rising',
        sign: { name: string; element: string; ruling: string },
        triadContext?: { sun?: string; moon?: string; rising?: string }
    ): Promise<{ title: string; overview: string; strengths: string; challenges: string; advice: string }> {
        const positionDescriptions = {
            sun: 'Sun sign (core identity, ego, life purpose)',
            moon: 'Moon sign (emotional nature, inner world, subconscious needs)',
            rising: 'Rising/Ascendant sign (outward persona, first impressions, social mask)',
        };

        const systemPrompt = `You are a master astrologer with deep knowledge of natal chart interpretation.
You provide insightful, personalized, and poetic yet practical astrological readings.
You must respond ONLY with valid JSON in this exact format:
{
  "title": "A short evocative title (2-4 words, like 'The Cosmic Archer')",
  "overview": "A structured interpretation using ## headers (## The Theme, ## The Lesson), **bold key terms**, and ending with ## Your Action Steps with 2-3 bullet points starting with - (150-200 words)",
  "strengths": "3-4 key strengths, comma-separated",
  "challenges": "3-4 key challenges, comma-separated",
  "advice": "One powerful sentence of cosmic guidance"
}
Do not include any text outside the JSON.`;

        let userPrompt = `Interpret ${sign.name} in the ${positionDescriptions[position]}.
Sign element: ${sign.element}
Ruling planet: ${sign.ruling}`;

        if (triadContext) {
            const parts = [];
            if (triadContext.sun) parts.push(`Sun in ${triadContext.sun}`);
            if (triadContext.moon) parts.push(`Moon in ${triadContext.moon}`);
            if (triadContext.rising) parts.push(`Rising in ${triadContext.rising}`);
            if (parts.length > 1) {
                userPrompt += `\n\nFull natal triad for extra context: ${parts.join(', ')}. 
Use this context to make the reading more personalized — how does this placement interact with the rest of their chart?`;
            }
        }
        const raw = await this.chat(systemPrompt, userPrompt);

        try {
            // Strip markdown code fences before extracting JSON
            const cleaned = raw.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '');
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch { /* fall through */ }

        // Fallback: return raw text as overview
        return {
            title: `${sign.name} ${position.charAt(0).toUpperCase() + position.slice(1)}`,
            overview: raw,
            strengths: 'Unique cosmic gifts',
            challenges: 'Growth opportunities',
            advice: 'Trust the wisdom of the stars.',
        };
    }

    /**
     * Get an AI synthesis of the cosmic details — how elements and planets
     * interact across the full natal chart.
     */
    async getCosmicSynthesis(
        triad: { sun: { name: string; element: string; ruling: string }; moon: { name: string; element: string; ruling: string }; rising: { name: string; element: string; ruling: string } }
    ): Promise<string> {
        const systemPrompt = `You are a master astrologer giving a deeply personal reading.
Focus on what makes THIS specific combination of signs rare and special — what unique gifts, contradictions, and superpowers emerge from this exact chart.
Make them feel truly seen. Be specific about how these signs interact in ways that no other combination would.
Use a warm, mystical, empowering tone.${TEACHING_FORMAT}`;

        let userPrompt = `Tell this person what makes them cosmically unique based on their natal chart:

Sun: ${triad.sun.name} (${triad.sun.element}, ruled by ${triad.sun.ruling})
Moon: ${triad.moon.name} (${triad.moon.element}, ruled by ${triad.moon.ruling})
Rising: ${triad.rising.name} (${triad.rising.element}, ruled by ${triad.rising.ruling})

What is rare or special about this exact combination? What can they do that almost nobody else can? What hidden tension or superpower lives in the interplay between these three signs? Make them feel like the universe designed them for something specific.`;

        // Inject numerology context if available
        const numCtx = buildChartNumerologyContext();
        if (numCtx) {
            userPrompt += numCtx;
        }

        return this.chat(systemPrompt, userPrompt);
    }

    /**
     * Get a comprehensive AI summary of the full natal chart.
     */
    async getFullChartSummary(
        planets: Array<{ name: string; signId: string; degreeInSign: number }>,
        aspects: Array<{ planet1Name: string; planet2Name: string; type: string; orb: number }>,
        triad: { sun: string; moon: string; rising: string }
    ): Promise<string> {
        const systemPrompt = `You are a master astrologer providing a comprehensive natal chart reading.
Synthesize all planetary placements and aspects into a cohesive narrative.
Highlight the most significant patterns: stelliums, grand trines, T-squares, element balance, etc.
Be specific about how the planets interact through their aspects.
Use a warm, insightful, mystical tone.${TEACHING_FORMAT}`;

        const planetLines = planets.map(p =>
            `${p.name}: ${p.degreeInSign.toFixed(1)}° ${p.signId.charAt(0).toUpperCase() + p.signId.slice(1)}`
        ).join('\n');

        const aspectLines = aspects.slice(0, 12).map(a =>
            `${a.planet1Name} ${a.type} ${a.planet2Name} (orb: ${a.orb}°)`
        ).join('\n');

        let userPrompt = `Provide a comprehensive natal chart reading:

BIG THREE: Sun in ${triad.sun}, Moon in ${triad.moon}, Rising in ${triad.rising}

ALL PLANETARY PLACEMENTS:
${planetLines}

KEY ASPECTS:
${aspectLines}

What are the dominant themes? What makes this chart unique? What should this person know about their cosmic blueprint?`;

        // Inject numerology context if available
        const numCtx = buildChartNumerologyContext();
        if (numCtx) {
            userPrompt += numCtx;
        }

        return this.chat(systemPrompt, userPrompt);
    }

    /**
     * Cosmic Blueprint — synthesizes natal chart + numerology into a unified life reading.
     */
    async getCosmicBlueprint(
        triad: { sun: string; moon: string; rising: string },
        planets: Array<{ name: string; signId: string; degreeInSign: number }>,
        aspects: Array<{ planet1Name: string; planet2Name: string; type: string; orb: number }>,
        lifePath: { number: number; title: string; desc: string },
        personalYear: { number: number },
    ): Promise<string> {
        const systemPrompt = `You are a gifted spiritual counselor sitting across from someone, reading their chart personally.
You synthesize astrology AND numerology into a single, flowing reading that feels like a conversation.

YOUR VOICE:
- Write as if you're personally reading their chart across a table — warm, knowing, unhurried.
- Use "you/your" throughout. This is THEIR reading.
- Explain astrological and numerological concepts naturally within the reading — don't assume they know what a trine or Life Path number means, but don't define them like a glossary either. Weave the teaching INTO the insight.
- Sound like a wise friend who genuinely sees them, not a textbook or a fortune cookie.

EVERY INSIGHT MUST FOLLOW THIS PATTERN:
1. NAME the energy — teach what the placement or number means in plain language
2. GROUND it in their life — use "you might notice..." or "think about the last time..." to paint a scenario they've already lived. Be specific and relatable.
3. REFRAME it — turn what might feel like confusion into clarity, or weakness into strength.
4. GIVE THEM ONE ACTION — end each section with one specific, practical action they can take TODAY or THIS WEEK. The action MUST be directly justified by the chart insight you just explained. Use the pattern: "Because [specific chart placement/aspect] → try [specific action]." Never give generic advice like "practice gratitude" or "set boundaries." The action should be something ONLY someone with THIS chart would benefit from. Make it concrete: a 5-minute exercise, a specific question to ask themselves, a behavior to try once, or a mindset shift to practice.

STRUCTURE — Follow these four sections exactly, using ## headers (NOT bold text):

## ✦ Who You Are at Your Core
(150-200 words) Weave Sun sign + Life Path number together. Show how they reinforce or create interesting tension. Ground with a relatable scenario about how they make decisions or move through the world. End with ONE specific action justified by this Sun + Life Path combination.

## ✦ The Energies Shaping You
(150-200 words) Moon, Rising, key planets, and the most important aspects. Explain what these energies feel like from the INSIDE. Use specific "you might notice..." examples — like walking into a room and sensing tension, or the push-pull of getting excited then second-guessing yourself. End with ONE specific action justified by their Moon/Rising dynamic.

## ✦ Where You Are Right Now
(100-150 words) Personal Year number in the context of their chart. Connect it to what they might currently be feeling — restlessness, transition, consolidation, whatever fits. Make them feel seen in their current moment. End with ONE specific action for navigating THIS particular year cycle with their chart.

## ✦ The Gift You Don't See Yet
(100-150 words) Name something in their chart that is likely their greatest strength but that they've probably been told is "too much" or have dismissed about themselves. Prove it with a relatable example, then reframe it powerfully. End with ONE specific way to lean INTO this gift this week — not hold it back.

ACTION FORMATTING:
- Write each action as a bold line starting with **→ Try this:** followed by the specific suggestion.
- The action should feel like it flows naturally from the paragraph above it — not bolted on.
- Actions must reference the specific chart placement that justifies them (e.g., "Because your Mars in Gemini trines your Moon...").

FORMATTING RULES (follow strictly):
- ALWAYS use ## for section headers. NEVER use ** bold markers ** for section titles.
- Put each ## header on its OWN line with a blank line BEFORE and AFTER it.
- Break your writing into short paragraphs of 2-3 sentences MAX. Put a blank line between every paragraph.
- NEVER write more than 3 sentences in a row without a paragraph break.
- The reading should breathe — white space is part of the experience.
- Bold key astrology and numerology terms using **double asterisks** (e.g., **Sagittarius Sun**, **Life Path 11**).`;

        const planetLines = planets.slice(0, 10).map(p =>
            `${p.name}: ${p.degreeInSign.toFixed(1)}° ${p.signId.charAt(0).toUpperCase() + p.signId.slice(1)}`
        ).join('\n');

        const aspectLines = aspects.slice(0, 8).map(a =>
            `${a.planet1Name} ${a.type} ${a.planet2Name} (orb: ${a.orb}°)`
        ).join('\n');

        const userPrompt = `Read this person's Cosmic Blueprint — weave their astrology and numerology together into one deeply personal reading.

ASTROLOGY:
Sun: ${triad.sun} | Moon: ${triad.moon} | Rising: ${triad.rising}
${planetLines}

KEY ASPECTS:
${aspectLines}

NUMEROLOGY:
Life Path Number: ${lifePath.number} — "${lifePath.title}"
${lifePath.desc}
Personal Year: ${personalYear.number} (current cycle, year ${new Date().getFullYear()})

Follow the four-section structure. For every insight: name the energy, ground it in a relatable life scenario, then reframe it. Make them feel like you truly see them.

AFTER the four main sections, add one final section using a ## header:
## ✦ How You Manifest
Based on their dominant element (derived from their chart), describe their unique manifestation style in 80-100 words:
- Fire (Aries/Leo/Sag): manifests through bold action, momentum, and declaring intentions publicly
- Earth (Taurus/Virgo/Cap): manifests through patient ritual, consistent daily practice, and tangible steps
- Air (Gemini/Libra/Aquarius): manifests through words, connection, sharing vision with others
- Water (Cancer/Scorpio/Pisces): manifests through emotional alignment, feeling it first, then acting
End with one specific practice matched to their element: "Your soul practice: [specific ritual/exercise]"

IMPORTANT: You MUST include ALL FIVE sections. Keep each section to 150-200 words max. The total reading should be approximately 700-900 words. Do NOT write long essays — be precise and impactful.`;

        return this.chatPremium(systemPrompt, userPrompt);
    }

    /**
     * Get an AI-generated relationship synthesis for a couple compatibility reading.
     * Returns a flowing prose reading about the couple dynamic.
     */
    async getRelationshipSynthesis(
        userTriad: { sun: { name: string; element: string }; moon: { name: string; element: string }; rising: { name: string; element: string } },
        partnerTriad: { sun: { name: string; element: string }; moon: { name: string; element: string }; rising: { name: string; element: string } },
        score: number,
        tier: string
    ): Promise<string> {
        const systemPrompt = `You are a warm, mystical relationship astrologer. Write a flowing, second-person ("you and your partner") compatibility reading. Be specific about the sign combinations. Include what draws them together, their emotional dynamic, one growth edge, and name their unique "Couple Superpower."

AFTER the main reading, add one final section:
## 🌱 What You're Building Together
2-3 sentences about what this couple naturally ATTRACTS as a unit based on their combined elements, and close with: "What is the shared intention you're both ready to declare?"${TEACHING_FORMAT}`;

        let userPrompt = `Write a couple compatibility reading for these two charts:

Person A: Sun in ${userTriad.sun.name} (${userTriad.sun.element}), Moon in ${userTriad.moon.name} (${userTriad.moon.element}), Rising in ${userTriad.rising.name} (${userTriad.rising.element})
Person B: Sun in ${partnerTriad.sun.name} (${partnerTriad.sun.element}), Moon in ${partnerTriad.moon.name} (${partnerTriad.moon.element}), Rising in ${partnerTriad.rising.name} (${partnerTriad.rising.element})

Their compatibility score is ${score}/100 — "${tier}". Weave this naturally into the reading without stating the number.`;

        // Inject numerology context for both people
        try {
            const birthData = getBirthData();
            if (birthData?.birthday) {
                const lp = getLifePathNumber(birthData.birthday);
                userPrompt += `\nPerson A's Life Path: ${lp}.`;
            }
        } catch { /* skip */ }

        return this.chat(systemPrompt, userPrompt);
    }

    /**
     * Get a relatable, scenario-based AI interpretation for a single synastry aspect.
     * Returns 3-4 sentences describing what this aspect feels like in the relationship.
     */
    async getSynastryAspectReading(
        planet1Name: string,
        planet1Sign: string,
        planet2Name: string,
        planet2Sign: string,
        aspectType: string,
        aspectNature: string,
        category: string,
        person1Label: string,
        person2Label: string,
    ): Promise<string> {
        const systemPrompt = `You are a relationship astrologer who explains synastry aspects in FELT EXPERIENCE, not jargon.

YOUR RULES:
- Speak directly: use "${person1Label}" and "${person2Label}" (or "you" and "they").
- Describe what this aspect FEELS like in daily life. Use "you probably notice…" or "think about how…".
- 3-4 sentences MAX. No headers, no bullets, no markdown. Flowing prose only.
- End with one "the key is…" growth tip.
- NEVER use words like "natal", "aspect", "orb", "transit" — speak in human terms.
- Sound like a wise friend over coffee, not an astrology textbook.`;

        const userPrompt = `Explain this synastry connection between ${person1Label} and ${person2Label}:

${person1Label}'s ${planet1Name} in ${planet1Sign} forms a ${aspectType} with ${person2Label}'s ${planet2Name} in ${planet2Sign}.
This is a ${aspectNature} connection in the "${category}" area of their relationship.

Describe what this feels like in their actual relationship — concrete scenarios, not abstract astrology.`;

        return this.chat(systemPrompt, userPrompt, 250);
    }

    /**
     * Full synastry deep dive — comprehensive AI reading covering all aspects of the relationship.
     * Uses premium model for depth and quality.
     */
    async getSynastryDeepDive(
        aspects: Array<{
            planet1Name: string; planet1Sign: string;
            planet2Name: string; planet2Sign: string;
            type: string; nature: string; category: string;
            person1Label: string; person2Label: string;
        }>,
        userTriad: { sun: string; moon: string; rising: string },
        partnerTriad: { sun: string; moon: string; rising: string },
        partnerName: string,
    ): Promise<string> {
        const systemPrompt = `You are a gifted relationship astrologer sitting across from a couple, reading their synastry chart.

YOUR VOICE:
- Warm, knowing, direct. Like a wise friend who truly sees the relationship.
- Use "you" and "${partnerName}" (or "they/them") throughout.
- Explain every astrological concept in FELT EXPERIENCE — "you probably notice how…" "think about the last time…"
- Sound like a therapist who happens to know astrology, not an astrologer pretending to be a therapist.

STRUCTURE — Follow these sections using ** bold headers **:

**🔥 Chemistry & Attraction** (80-120 words)
What draws them together magnetically. Venus-Mars dynamics, what they find irresistible about each other.

**🧲 Emotional Bond** (80-120 words)
How they connect emotionally. Moon aspects, what comfort/safety looks like between them.

**⚡ Friction Points** (80-120 words)
Where they clash. Saturn/Pluto hard aspects. Be honest but compassionate — frame as growth, not doom.

**🌱 Your Couple Superpower** (60-80 words)
Name ONE unique strength that THIS specific combination has. Something no other couple has quite the same way.

FORMATTING:
- Short paragraphs (2-3 sentences max).
- Bold the planet names and signs with **double asterisks**.
- No bullet points, no numbered lists. Flowing prose only.
- Keep total to 350-500 words.`;

        const grouped: Record<string, string[]> = {};
        for (const a of aspects.slice(0, 15)) {
            const cat = a.category;
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(`${a.person1Label}'s ${a.planet1Name} (${a.planet1Sign}) ${a.type} ${a.person2Label}'s ${a.planet2Name} (${a.planet2Sign}) — ${a.nature}`);
        }

        const aspectBlock = Object.entries(grouped).map(([cat, items]) =>
            `${cat.toUpperCase()}:\n${items.join('\n')}`
        ).join('\n\n');

        let userPrompt = `Read this couple's synastry chart:

PERSON A: Sun ${userTriad.sun}, Moon ${userTriad.moon}, Rising ${userTriad.rising}
${partnerName.toUpperCase()}: Sun ${partnerTriad.sun}, Moon ${partnerTriad.moon}, Rising ${partnerTriad.rising}

SYNASTRY ASPECTS:
${aspectBlock}

Write a flowing, personal deep dive. For every insight: describe what it FEELS like, ground it in a scenario, then give one growth tip.`;

        // Inject user's numerology context if available
        const numCtx = buildChartNumerologyContext();
        if (numCtx) {
            userPrompt += numCtx;
        }

        return this.chatPremium(systemPrompt, userPrompt, 1500);
    }

    /**
     * Get an AI-powered transit interpretation — personalized to the user's chart.
     */
    async getTransitInterpretation(
        transitPlanet: { name: string; glyph: string; signId: string; degreeInSign: number },
        natalPlanet: { name: string; glyph: string; signId: string; degreeInSign: number },
        aspect: { name: string; symbol: string; nature: string },
        orb: number,
        isApplying: boolean,
        triadContext?: { sun?: string; moon?: string; rising?: string },
    ): Promise<string> {
        const tSign = transitPlanet.signId.charAt(0).toUpperCase() + transitPlanet.signId.slice(1);
        const nSign = natalPlanet.signId.charAt(0).toUpperCase() + natalPlanet.signId.slice(1);

        const systemPrompt = `You are a personal astrologer interpreting a transit for your client.
You speak directly to them ("you"), warm but honest. Be specific and actionable.
No generic astrology — this is about THEIR specific chart activation.
Write 2-3 sentences. No headers, no bullet points, no markdown. Just flowing prose.
Be practical: suggest a specific action, mindset, or thing to watch for TODAY.`;

        const orbDesc = orb < 1 ? 'EXACT TODAY — peak intensity'
            : isApplying ? `Orb: ${orb}° and tightening — building in intensity`
                : `Orb: ${orb}° and separating — intensity is fading`;

        let userPrompt = `TRANSIT: ${transitPlanet.name} (currently at ${tSign} ${transitPlanet.degreeInSign}°) is forming a ${aspect.name} to their natal ${natalPlanet.name} (${nSign} ${natalPlanet.degreeInSign}°).
${orbDesc}
NATURE: ${aspect.nature}`;

        if (triadContext) {
            const parts = [];
            if (triadContext.sun) parts.push(`Sun in ${triadContext.sun}`);
            if (triadContext.moon) parts.push(`Moon in ${triadContext.moon}`);
            if (triadContext.rising) parts.push(`Rising in ${triadContext.rising}`);
            if (parts.length > 0) {
                userPrompt += `\n\nTheir natal chart context: ${parts.join(', ')}.`;
            }
        }

        userPrompt += `\n\nWrite a personalized 2-3 sentence interpretation. Be specific about what they might FEEL or EXPERIENCE today because of this transit. End with one actionable suggestion.`;

        // Inject numerology context for timing resonance
        try {
            const birthData = getBirthData();
            if (birthData?.birthday) {
                const lp = getLifePathNumber(birthData.birthday);
                const py = getCurrentPersonalYear(birthData.birthday);
                userPrompt += `\nNumerology context: Life Path ${lp}, Personal Year ${py}.`;
            }
        } catch { /* skip */ }

        return this.chat(systemPrompt, userPrompt, 200);
    }

    /**
     * Discover patterns across journal entries grouped by a transiting planet.
     * Empowerment coaching tone — validate, reframe, hand them the wheel.
     */
    async getJournalPatterns(
        planet: string,
        entries: Array<{ text: string; date: string; mood?: string }>,
        triadContext?: { sun?: string; moon?: string; rising?: string },
    ): Promise<string> {
        const systemPrompt = `You are a wise, warm cosmic coach — not a therapist, not a fortune teller.
You've been reading someone's private journal entries alongside watching the sky.
You've noticed a pattern between their writing and when ${planet} was active in their chart.

YOUR TONE:
- Speak directly to them ("you"). Like a wise friend who sees them clearly.
- VALIDATE what they've been feeling — show them their own words reflect something real.
- REFRAME any struggles as growth signals, not problems.
- HAND THEM THE WHEEL — end with a question or invitation, never a prescription.
- Never diagnose. Never pathologize. They are the pilot. You're just showing them the weather map.

FORMAT:
- Write 3-4 short paragraphs (2-3 sentences each).
- Bold the planet name and key themes using **double asterisks**.
- End with one empowering question they can sit with — italicized.
- No headers, no bullet points. Just flowing, warm prose.
- Keep it under 150 words total.`;

        const entrySnippets = entries.slice(0, 6).map((e, i) =>
            `Entry ${i + 1} (${e.date})${e.mood ? ` [mood: ${e.mood}]` : ''}: "${e.text.slice(0, 200)}${e.text.length > 200 ? '...' : ''}"`
        ).join('\n\n');

        let userPrompt = `Here are ${entries.length} journal entries written while ${planet} was active in this person's chart:\n\n${entrySnippets}\n\nDiscover the pattern. What themes keep showing up when ${planet} activates their chart? Validate it, reframe it positively, and end with an empowering question.`;

        if (triadContext) {
            const parts = [];
            if (triadContext.sun) parts.push(`Sun in ${triadContext.sun}`);
            if (triadContext.moon) parts.push(`Moon in ${triadContext.moon}`);
            if (triadContext.rising) parts.push(`Rising in ${triadContext.rising}`);
            if (parts.length > 0) {
                userPrompt += `\n\nTheir natal chart: ${parts.join(', ')}.`;
            }
        }

        // Inject numerology context for pattern depth
        try {
            const birthData = getBirthData();
            if (birthData?.birthday) {
                const lp = getLifePathNumber(birthData.birthday);
                const py = getCurrentPersonalYear(birthData.birthday);
                userPrompt += `\nNumerology: Life Path ${lp}, Personal Year ${py}.`;
            }
        } catch { /* skip */ }

        return this.chat(systemPrompt, userPrompt, 300);
    }

    /**
     * Dream Interpretation — transit-aware, natal-chart-personalized dream reading.
     * Interprets dreams through three lenses: symbolism, active transits, and natal chart.
     */
    async getDreamInterpretation(data: {
        dreamText: string;
        symbolTags: string[];
        wakingMood?: string;
        activeTransits: string;   // formatted transit string
        triad?: { sun?: string; moon?: string; rising?: string };
        lifePath?: number;
    }): Promise<string> {
        const systemPrompt = `You are a wise dream interpreter who reads dreams through the lens of astrology and cosmic timing.
You combine Jungian dream symbolism with astrological transits to offer deeply personalized interpretations.

YOUR VOICE:
- Speak directly to them ("you"). Warm, intuitive, unhurried.
- Never be clinical or diagnostic. You're a mystic, not a therapist.
- Make them feel like their dream was important and meaningful.
- Be specific to THEIR symbols and THEIR chart — no generic dream dictionary entries.

FORMAT — Use these exact sections with ## headers:

## 🔮 The Mirror
2-3 paragraphs interpreting the dream's core symbols through their natal chart lens. What is the dream showing them about themselves? Be specific to the symbols they tagged. Bold key dream symbols and astrological placements.

## ⚡ The Transit Connection
1-2 paragraphs explaining WHY this dream appeared NOW based on the active transits. Connect specific transit energies to specific dream elements. Make them feel like the timing wasn't random.

## 🗝️ The Invitation
1 paragraph of empowering, non-prescriptive guidance. What is the dream asking them to pay attention to? End with one italicized question for them to sit with. Never tell them what to do — offer an invitation.

## 💫 Manifestation Signal
1-2 sentences: What is the dream revealing about what this person is READY to call in or release? If they have an active manifestation, connect the dream symbols to it. If not, gently ask: "What is your subconscious already trying to create?"

Rules:
- Bold key terms with **double asterisks**
- Keep total to 300-400 words
- End with an italicized question
- No bullet points. Flowing, warm prose.
- Be specific about their symbols, not generic.`;

        const symbolList = data.symbolTags.length > 0
            ? `Symbol tags: ${data.symbolTags.join(', ')}`
            : '';

        const moodNote = data.wakingMood
            ? `Waking mood: ${data.wakingMood}`
            : '';

        let userPrompt = `Interpret this dream:

"${data.dreamText.slice(0, 500)}${data.dreamText.length > 500 ? '...' : ''}"

${symbolList}
${moodNote}

ACTIVE TRANSITS: ${data.activeTransits}`;

        if (data.triad) {
            const parts = [];
            if (data.triad.sun) parts.push(`Sun in ${data.triad.sun}`);
            if (data.triad.moon) parts.push(`Moon in ${data.triad.moon}`);
            if (data.triad.rising) parts.push(`Rising in ${data.triad.rising}`);
            if (parts.length > 0) {
                userPrompt += `\n\nNATAL CHART: ${parts.join(', ')}.`;
            }
        }

        if (data.lifePath) {
            userPrompt += `\nLife Path Number: ${data.lifePath}.`;
        }

        userPrompt += `\n\nInterpret this dream through the triple lens of symbolism, transits, and their chart. Be specific to their symbols and timing.`;

        return this.chat(systemPrompt, userPrompt, 500);
    }

    /**
     * Career Alignment — Sun/Moon/Rising + Life Path archetype-based reading.
     * Returns structured JSON with archetype name, work style, environments, and a closing question.
     */
    async getCareerAlignment(data: {
        sun: string;
        moon: string;
        rising: string;
        sunElement: string;
        lifePath: number;
        personalYear?: number;
    }): Promise<string> {
        const systemPrompt = `You are a master career astrologer who interprets charts through archetypal lenses — not job titles. Your readings feel like a trusted mentor who truly knows the person, not a generic horoscope.

CRITICAL: You never say "you should be a [job]." You talk about HOW they work, not WHAT they do.
You are specific, honest, empowering, and occasionally surprising.

You MUST respond ONLY with valid JSON in this EXACT format:
{
  "archetypeName": "2-3 word archetype name (e.g. 'The Sovereign Builder', 'The Catalyst', 'The Hidden Strategist')",
  "archetypeTagline": "One powerful sentence — their professional superpower in plain, gripping language",
  "workStyle": "3-4 sentences about HOW they do their best work. Specific to their Sun/Moon/Rising/Life Path combo — not generic. Include what kind of pace, ownership level, collaboration style, and environment they actually need. Bold 2-3 key phrases with **double asterisks**.",
  "thrive": ["3-4 specific environment/condition descriptors they thrive in — short, punchy, specific (e.g. 'Full ownership of a project', 'Teams who execute without hand-holding')"],
  "struggle": ["3-4 honest, specific conditions that drain them — not clichés (e.g. 'Being managed by someone less competent', 'Work without visible impact')"],
  "blindSpot": "1-2 sentences about their professional blind spot or growth edge — delivered with compassion, not criticism. Bold the core tension.",
  "theQuestion": "One powerful, italicized closing question they should sit with about their career. Non-prescriptive, provocative, empowering."
}
Do not include any text outside the JSON.`;

        const userPrompt = `Give a career alignment reading for this person:

Sun in ${data.sun} (${data.sunElement} element)
Moon in ${data.moon}
Rising in ${data.rising}
Life Path ${data.lifePath}
${data.personalYear ? `Personal Year ${data.personalYear} (${new Date().getFullYear()})` : ''}

Their Sun in ${data.sun} shapes their professional identity — how they want to show up and lead.
Their Moon in ${data.moon} reveals what kind of work environment actually nourishes them emotionally.
Their Rising in ${data.rising} shows how they naturally present in professional contexts.
Life Path ${data.lifePath} is the underlying drive and soul mission woven through everything they do.

Generate their unique career archetype and reading. Be specific to this combination — how does ${data.sun} Sun + ${data.moon} Moon interact professionally? What makes this specific combo stand out? What is the tension point between these placements?
${data.personalYear ? `Also briefly note how Personal Year ${data.personalYear} influences their career timing this year.` : ''}

In the JSON, add a field: "howYouManifestSuccess": "2-3 sentences about how this specific archetype manifests career success — what actions, declarations, or practices are aligned with HOW they naturally create results. Make it specific to their element and Life Path."

Be honest, specific, and empowering. Make them feel deeply seen.`;

        return this.chatPremium(systemPrompt, userPrompt);
    }


    /**
     * Family Reading — parent↔child synastry with age-aware interpretations.
     */
    async getFamilyReading(data: {
        parentTriad: { sun: string; moon: string; rising: string };
        childName: string;
        childTriad: { sun: string; moon: string; rising: string };
        childAge: number;
        childAgeLabel: string;
        relationship: string;
        parentLifePath?: number;
        childLifePath?: number;
        synastryHighlights: Array<{ planet1: string; planet2: string; aspect: string; nature: string; category: string }>;
    }): Promise<string> {
        const systemPrompt = `You are a deeply empathetic, wise astrologer who specializes in family dynamics and conscious parenting through astrology. Your tone is warm, validating, and practical — like a trusted mentor who helps parents UNDERSTAND their children through the stars.

You MUST format your response with these ## headers:

## ☉ Who ${data.childName} Is
2-3 paragraphs about the child's Sun/Moon/Rising and what it means for their personality at their CURRENT AGE (${data.childAge} years old, ${data.childAgeLabel}). Be specific to how these placements manifest at this developmental stage.

## 💫 Your Cosmic Bond
The parent-child synastry — 3-4 key aspects explained through real parenting moments. Frame each one with a specific situation example:
"When they do [behavior], that's [aspect] in action."

## ⚡ The Growth Edges
2-3 friction points from the synastry — framed NOT as problems but as growth opportunities. Help the parent understand WHY certain conflicts happen and give them compassion for both sides.

## 🌱 Parenting Through the Stars
3-4 concrete, actionable parenting tips specifically tailored to this unique parent-child combination. What works best for THIS child given THEIR chart and YOUR chart together.

## 🔢 Your Numbers Together
1-2 paragraphs on how their Life Path numbers interact as parent and child. What does the parent's number teach the child? What does the child's number teach the parent?

Rules:
- Bold all astrological terms (**Scorpio Moon**, **Square**, etc.)
- Frame everything through the lens of a ${data.childAgeLabel} (age ${data.childAge})
- Never be judgmental — validate the parent's experience
- Give specific behavioral examples, not abstract astrology
- Total length: 700-1000 words
- Do NOT use code blocks, links, or images${TEACHING_FORMAT}`;

        const aspectSummary = data.synastryHighlights
            .map(a => `Your ${a.planet1} ${a.aspect} their ${a.planet2} (${a.nature}, ${a.category})`)
            .join('\n');

        const userPrompt = `Generate a parent↔child reading.

PARENT: Sun in ${data.parentTriad.sun}, Moon in ${data.parentTriad.moon}, Rising in ${data.parentTriad.rising}${data.parentLifePath ? `, Life Path ${data.parentLifePath}` : ''}
CHILD (${data.childName}): Sun in ${data.childTriad.sun}, Moon in ${data.childTriad.moon}, Rising in ${data.childTriad.rising}${data.childLifePath ? `, Life Path ${data.childLifePath}` : ''}
RELATIONSHIP: ${data.relationship}
AGE: ${data.childAge} years old (${data.childAgeLabel})

KEY SYNASTRY ASPECTS:
${aspectSummary || 'Basic compatibility only — no exact aspects detected.'}`;

        return this.chatPremium(systemPrompt, userPrompt, 2500);
    }

    /**
     * Sibling Reading — child↔child dynamics.
     */
    async getSiblingReading(data: {
        child1Name: string;
        child1Triad: { sun: string; moon: string; rising: string };
        child1Age: number;
        child1LifePath?: number;
        child2Name: string;
        child2Triad: { sun: string; moon: string; rising: string };
        child2Age: number;
        child2LifePath?: number;
        synastryHighlights: Array<{ planet1: string; planet2: string; aspect: string; nature: string }>;
    }): Promise<string> {
        const systemPrompt = `You are a wise, warm astrologer specializing in sibling dynamics. You help parents understand why their children interact the way they do through the lens of astrological synastry.

You MUST format your response with these ## headers:

## 👫 Their Bond at a Glance
1-2 paragraphs summarizing the overall sibling dynamic. Are they natural allies, competitive rivals, or complementary opposites?

## ✨ Where They Click
2-3 harmonious aspects explained through real sibling moments. "This is why they can play together for hours doing [specific activity]."

## ⚡ Where They Clash
2-3 friction points explained with compassion. "The arguing about [specific thing] is really [aspect] in action."

## 🌱 Helping Them Thrive Together
3-4 actionable tips for parents to nurture this specific sibling relationship.

## 🔢 Their Numbers Side by Side
1 paragraph on how their Life Path numbers interact as siblings. Are they natural allies, rivals, or teacher-student?

Rules:
- Bold all astrological terms
- Use age-appropriate examples (ages ${data.child1Age} and ${data.child2Age})
- Be warm and practical
- Total length: 600-800 words${TEACHING_FORMAT}`;

        const aspectSummary = data.synastryHighlights
            .map(a => `${data.child1Name}'s ${a.planet1} ${a.aspect} ${data.child2Name}'s ${a.planet2} (${a.nature})`)
            .join('\n');

        const userPrompt = `Generate a sibling dynamics reading.

${data.child1Name} (age ${data.child1Age}): Sun in ${data.child1Triad.sun}, Moon in ${data.child1Triad.moon}, Rising in ${data.child1Triad.rising}${data.child1LifePath ? `, Life Path ${data.child1LifePath}` : ''}
${data.child2Name} (age ${data.child2Age}): Sun in ${data.child2Triad.sun}, Moon in ${data.child2Triad.moon}, Rising in ${data.child2Triad.rising}${data.child2LifePath ? `, Life Path ${data.child2LifePath}` : ''}

KEY SYNASTRY ASPECTS:
${aspectSummary || 'Basic compatibility only — no exact aspects detected.'}`;

        return this.chatPremium(systemPrompt, userPrompt, 2000);
    }

    /**
     * Year Ahead Report — comprehensive yearly forecast using transits, eclipses, and numerology.
     */
    async getYearAheadReading(report: {
        solarYear: { start: string; end: string; startFormatted: string };
        personalYear: number;
        lifePathNumber: number;
        majorTransits: Array<{ transitPlanet: string; natalPlanet: string; aspectName: string; nature: string; peakMonth: string; transitSign: string; significance: string }>;
        eclipses: Array<{ type: string; kind: string; formattedDate: string; signId: string; natalAspects: Array<{ planet: string; aspect: string }> }>;
        months: Array<{ month: string; year: number; dominantTransits: Array<{ transit: string; natal: string; aspect: string; nature: string }>; eclipseThisMonth: boolean }>;
        keyDates: Array<{ formattedDate: string; description: string; nature: string }>;
        year: number;
    }, triad?: { sun?: string; moon?: string; rising?: string }): Promise<string> {
        const systemPrompt = `You are a master astrologer writing a deeply personal Year Ahead report. Your style is warm, insightful, and empowering — like a wise mentor revealing the cosmic roadmap for someone's most important year.

You MUST format your response using these exact sections with ## headers:

## 🌟 Your Year Theme
2-3 paragraphs synthesizing the major transits and Personal Year number into a cohesive narrative about what this year is ABOUT for them. Make them feel seen.

## ⚡ Major Cosmic Shifts
For each major transit, write 2-3 sentences about what it means personally. Use their natal planet placements for specificity. Bold the transit names.

## 🌑 Eclipse Activations
What the eclipses stir up in their chart. 1-2 paragraphs. If eclipses aspect natal planets, explain what gets activated.

## 📅 Month-by-Month Guidance
For EACH month: 1-2 sentences on the dominant transit energy + practical guidance. Then on the NEXT LINE add the optimal manifestation intention for that month.

Format EXACTLY as:

**January**: [transit guidance]

✨ *Intention: "I am calling in [what this month's energy supports]."*

**February**: [guidance]

✨ *Intention: "I am calling in [theme]."*

...every month MUST have both the guidance line AND the Intention line.

## ⭐ Key Dates to Watch
List the most important dates with one-line guidance for each.

## 🔮 Year Closing Wisdom
1 paragraph of empowering closing advice for navigating this entire year.

Rules:
- Bold all astrological terms (**Saturn**, **Square**, **Pisces Moon**)
- Be specific to THEIR chart, not generic zodiac horoscopes
- Keep each section focused and impactful
- Total length: 1200-1800 words
- Do NOT use code blocks, links, or images`;

        const transitSummary = report.majorTransits
            .filter(t => t.significance !== 'minor')
            .map(t => `${t.transitPlanet} ${t.aspectName} natal ${t.natalPlanet} (in ${t.transitSign}, peak ~${t.peakMonth}, ${t.nature})`)
            .join('\n');

        const eclipseSummary = report.eclipses
            .map(e => `${e.type} eclipse (${e.kind}) on ${e.formattedDate} in ${e.signId}${e.natalAspects.length > 0 ? ` — aspects: ${e.natalAspects.map(a => `${a.aspect} ${a.planet}`).join(', ')}` : ''}`)
            .join('\n');

        const monthlySummary = report.months
            .map(m => `${m.month} ${m.year}: ${m.dominantTransits.map(t => `${t.transit} ${t.aspect} ${t.natal} (${t.nature})`).join('; ')}${m.eclipseThisMonth ? ' [ECLIPSE MONTH]' : ''}`)
            .join('\n');

        const keyDatesSummary = report.keyDates
            .map(kd => `${kd.formattedDate}: ${kd.description} (${kd.nature})`)
            .join('\n');

        let userPrompt = `Generate a Year Ahead Report for ${report.year}.

SOLAR YEAR: ${report.solarYear.startFormatted} to end
PERSONAL YEAR: ${report.personalYear} (Numerology)
LIFE PATH: ${report.lifePathNumber}

MAJOR TRANSITS:
${transitSummary || 'No major outer planet transits detected.'}

ECLIPSES:
${eclipseSummary || 'No significant eclipses aspecting natal chart.'}

MONTH-BY-MONTH TRANSITS:
${monthlySummary}

KEY DATES:
${keyDatesSummary || 'No exact transit hits detected.'}`;

        if (triad) {
            const parts = [];
            if (triad.sun) parts.push(`Sun in ${triad.sun}`);
            if (triad.moon) parts.push(`Moon in ${triad.moon}`);
            if (triad.rising) parts.push(`Rising in ${triad.rising}`);
            if (parts.length > 0) {
                userPrompt += `\n\nNATAL CHART: ${parts.join(', ')}.`;
            }
        }

        return this.chatPremium(systemPrompt, userPrompt, 4000);
    }

    /**
     * Angel Number Oracle — AI-powered meaning for any number sequence.
     * Gives the universal spiritual meaning, then optionally connects to the user's
     * astro/numerology chart if there is GENUINE resonance (not forced).
     */
    async getAngelNumberMeaning(
        number: string,
        chartContext?: {
            sun?: string;
            moon?: string;
            rising?: string;
            lifePath?: number;
            personalYear?: number;
        },
        whereSpotted?: string,
    ): Promise<string> {
        const systemPrompt = `You are a warm, wise numerology guide with deep knowledge of angel numbers, sacred geometry, repeating number sequences, and spiritual symbolism across traditions (Pythagorean, Kabbalistic, Doreen Virtue system, and ancient numerology). 

YOUR VOICE:
- Speak directly to the person ("you"). Warm, oracle-like, grounded.
- Explain the UNIVERSAL meaning of the number first — its digit composition, what single or master numbers it reduces to, and what that frequency carries spiritually.
- Then touch on the TIMING dimension — why might this number be appearing NOW? What season of life, transition, or inner shift does this energy typically arrive during? Make them feel like seeing this number was not random.
- Use poetic but practical language. Not vague. Not generic.
- Use words like alignment, momentum, and intuition rather than just magic and miracles.
- Use "You may be feeling..." or "This is an invitation to..." rather than "You must do X."
- If chart context is provided: ONLY mention their chart if there is a specific, genuine, interesting resonance between the number's meaning and their placement. If the connection feels forced or is not compelling, DO NOT mention the chart at all.
- If location context is provided ("where they saw it"): weave this in naturally to make the reading feel personal and specific. A number on a clock carries different weight than one on a receipt or license plate.

DIGIT REPETITION NUANCE:
- Triple digits (111, 222) = the energy is ARRIVING — a nudge, a tap on the shoulder.
- Quadruple digits (1111, 2222) = the energy has OPENED A PORTAL — the universe isn't whispering, it's speaking clearly.
- More repetition = qualitatively different, NOT just "the same but louder."
- Ensure distinct readings for 111 vs 1111, 22 vs 222 vs 2222, etc.

FORMAT:
- First line: a short evocative title for this number (2-5 words, NO hashtags or asterisks, just plain text)
- Then a blank line
- Then 3-4 short paragraphs (2-3 sentences each) — the reading (weave the timing/why-now dimension naturally into the body)
- Then an italicized reflection question (use *asterisks*)
- Then a blank line, then on its own line: "✦ [a manifestation seed — one specific, embodied action that channels this number's energy into the user's life, under 15 words. Frame as an intention they can carry forward. E.g. for 444: 'Place both feet on the ground and declare what you are building.' For 555: 'Name one thing you are ready to release — say it out loud, then let it go.' For 888: 'Write down the abundance you are calling in — be specific and bold.']"
- Total: 180-250 words. Tight and powerful. No fluff.
- No markdown headers (##), no bullet points, no bold markers.`;

        let userPrompt = `Angel number seen: ${number}${whereSpotted ? `\nSpotted: ${whereSpotted}` : ''}

Give the universal spiritual meaning of ${number}. Break down its digit composition and what frequency it carries. Touch on why this number might be appearing now — what transition or season does it typically herald? Deliver a warm, personal oracle message, then a reflection question, then a manifestation seed — one embodied action that channels the number's energy into their life.`;

        if (chartContext) {
            const parts: string[] = [];
            if (chartContext.sun) parts.push(`Sun in ${chartContext.sun}`);
            if (chartContext.moon) parts.push(`Moon in ${chartContext.moon}`);
            if (chartContext.rising) parts.push(`Rising in ${chartContext.rising}`);
            if (chartContext.lifePath) parts.push(`Life Path ${chartContext.lifePath}`);
            if (chartContext.personalYear) parts.push(`Personal Year ${chartContext.personalYear}`);
            if (parts.length > 0) {
                userPrompt += `\n\nTheir chart context: ${parts.join(' · ')}. ONLY weave this in if there is a genuinely interesting, specific resonance with the number ${number}. If not clearly relevant, skip it entirely.`;
            }
        }

        return this.chat(systemPrompt, userPrompt, 400);
    }

    async chat(systemPrompt: string, userPrompt: string, maxTokens = 600): Promise<string> {
        if (!this.apiKey) {
            throw new Error('No API key configured. Add your OpenRouter key in Settings.');
        }
        // Offline guard
        if (!navigator.onLine) {
            throw new Error('You appear to be offline. AI insights require an internet connection. Tarot, astrology, and numerology still work offline!');
        }
        // AI consent check — default to disabled on any error (corrupted data, missing key)
        try {
            const raw = safeStorage.getItem('ai_consent');
            if (raw) {
                const consent = JSON.parse(raw);
                if (consent.consented === false) {
                    throw new Error('AI features are disabled. You can enable them in Settings.');
                }
            }
        } catch (e) {
            if (e instanceof Error && e.message.includes('AI features are disabled')) throw e;
            // Corrupted consent data — block AI calls to be safe
            throw new Error('AI features are disabled. You can enable them in Settings.');
        }

        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Arcana Whisper',
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                max_tokens: maxTokens,
                temperature: 0.8,
            }),
            signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) {
            const error = await response.text();
            if (response.status === 401) {
                throw new Error('Invalid API key. Please check your OpenRouter key in Settings.');
            }
            if (response.status === 429) {
                throw new Error('Rate limited. Please wait a moment and try again.');
            }
            throw new Error(`AI service error: ${response.status} — ${error}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error('No response from AI. Please try again.');
        }
        return content.trim();
    }

    /** Premium model chat — uses Claude for deep, once-a-day readings */
    async chatPremium(systemPrompt: string, userPrompt: string, maxTokens = 3000): Promise<string> {
        if (!this.apiKey) {
            throw new Error('No API key configured. Add your OpenRouter key in Settings.');
        }
        // Offline guard
        if (!navigator.onLine) {
            throw new Error('You appear to be offline. AI insights require an internet connection. Tarot, astrology, and numerology still work offline!');
        }

        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Arcana Whisper',
            },
            body: JSON.stringify({
                model: PREMIUM_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                max_tokens: maxTokens,
                temperature: 0.8,
            }),
            signal: AbortSignal.timeout(45000),
        });

        if (!response.ok) {
            const error = await response.text();
            // Fallback to Flash model if premium fails — cap tokens to prevent cost blowup
            if (import.meta.env.DEV) console.warn('[AI] Premium model failed, falling back to Flash:', error);
            return this.chat(systemPrompt, userPrompt, Math.min(maxTokens, 1200));
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error('No response from AI. Please try again.');
        }
        return content.trim();
    }
}

// ── Daily reading limit helpers ──

const DAILY_LIMIT_KEY = 'dailyReadings';
const FREE_DAILY_LIMIT = 3;

interface DailyCount {
    date: string;
    count: number;
}

function getTodayKey(): string {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function getDailyData(): DailyCount {
    try {
        const raw = safeStorage.getItem(DAILY_LIMIT_KEY);
        if (raw) {
            const data = JSON.parse(raw) as DailyCount;
            if (data.date === getTodayKey()) return data;
        }
    } catch { /* ignore */ }
    return { date: getTodayKey(), count: 0 };
}

/** Get remaining readings for free tier today */
export function getRemainingReadings(): number {
    const data = getDailyData();
    return Math.max(0, FREE_DAILY_LIMIT - data.count);
}

/** Check if user can perform another reading (free tier) */
export function canDoReading(isPremium: boolean): boolean {
    if (isPremium) return true;
    return getRemainingReadings() > 0;
}

/** Increment the daily reading counter */
export function incrementReadingCount() {
    const data = getDailyData();
    data.count += 1;
    safeStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify(data));
}

/** Get total readings done today */
export function getTodayReadingCount(): number {
    return getDailyData().count;
}

