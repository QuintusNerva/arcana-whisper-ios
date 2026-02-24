/**
 * AI Interpretation Service — OpenRouter Integration
 * Uses Gemini 2.0 Flash via OpenRouter for tarot card interpretations.
 */

import { getMemoryContextForAI } from './memory.service';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.0-flash-001';
const PREMIUM_MODEL = 'google/gemini-2.5-pro-preview-05-06';
const STORAGE_KEY = 'openrouter_api_key';

/**
 * Daily cache utility — stores a value keyed to today's date.
 * Returns cached value if generated today, otherwise null.
 */
export const dailyCache = {
    get(key: string): string | null {
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const raw = localStorage.getItem(`daily_${key}`);
        if (!raw) return null;
        try {
            const { date, value } = JSON.parse(raw);
            return date === today ? value : null;
        } catch { return null; }
    },
    set(key: string, value: string): void {
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem(`daily_${key}`, JSON.stringify({ date: today, value }));
    },
};

/** Shared formatting instruction appended to all AI system prompts */
const TEACHING_FORMAT = `

You MUST format your response using these rules:
1. Structure into 2-3 sections using ## headers (e.g. ## The Theme, ## The Lesson, ## Your Action Steps).
2. Bold all key terminology using **double asterisks** (e.g. **Personal Year 9**, **Virgo Moon**, **The Tower**).
3. End with a section called "## Your Action Steps" containing 2-3 bullet points starting with "- ".
4. Keep paragraphs short (2-3 sentences max).
5. Do NOT use any other markdown like code blocks, links, or images.`;

export class AIService {
    private apiKey: string | null = null;

    constructor() {
        // Prefer env var (set in .env), fall back to localStorage
        this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || localStorage.getItem(STORAGE_KEY) || null;
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
     * Returns the text content or throws on error.
     */
    async getCardInsight(
        cardName: string,
        cardMeaning: string,
        cardReversed: string,
        context?: { theme?: string; question?: string }
    ): Promise<string> {
        const systemPrompt = `You are an expert mystical tarot reader with deep knowledge of the Rider-Waite-Smith deck. 
You give insightful, poetic yet practical readings. 
Use a warm, wise tone — like a compassionate oracle.${TEACHING_FORMAT}`;

        let userPrompt = `Give a personalized insight for "${cardName}".
Upright meaning: ${cardMeaning}
Reversed meaning: ${cardReversed}`;

        if (context?.theme) {
            userPrompt += `\nThe seeker's focus area is: ${context.theme}`;
        }
        if (context?.question) {
            userPrompt += `\nTheir question: "${context.question}"`;
        }

        // Inject memory context for personalization
        const memoryCtx = getMemoryContextForAI();
        if (memoryCtx) {
            userPrompt += `\n\n${memoryCtx}`;
        }

        return this.chat(systemPrompt, userPrompt);
    }

    /**
     * Get a deep AI interpretation for a full spread reading.
     */
    async getSpreadInsight(
        cards: Array<{ name: string; meaning: string; position: string }>,
        spread: string,
        theme: string,
        question?: string
    ): Promise<string> {
        const systemPrompt = `You are an expert mystical tarot reader with deep knowledge of the Rider-Waite-Smith deck.
You synthesize multi-card spreads into cohesive, insightful narratives.
Be specific to the cards drawn and their positions.
Use a warm, wise tone — like a compassionate oracle.${TEACHING_FORMAT}`;

        const cardLines = cards.map((c, i) =>
            `Position ${i + 1} (${c.position}): ${c.name} — ${c.meaning}`
        ).join('\n');

        let userPrompt = `Interpret this ${spread} tarot spread:\n${cardLines}`;
        userPrompt += `\nTheme: ${theme}`;
        if (question) {
            userPrompt += `\nThe seeker asks: "${question}"`;
        }

        // Inject memory context for personalization
        const memoryCtx = getMemoryContextForAI();
        if (memoryCtx) {
            userPrompt += `\n\n${memoryCtx}`;
        }

        userPrompt += `\n\nProvide a cohesive reading that weaves all cards together. Focus on the story they tell and actionable guidance.`;

        return this.chat(systemPrompt, userPrompt);
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

        const userPrompt = `Tell this person what makes them cosmically unique based on their natal chart:

Sun: ${triad.sun.name} (${triad.sun.element}, ruled by ${triad.sun.ruling})
Moon: ${triad.moon.name} (${triad.moon.element}, ruled by ${triad.moon.ruling})
Rising: ${triad.rising.name} (${triad.rising.element}, ruled by ${triad.rising.ruling})

What is rare or special about this exact combination? What can they do that almost nobody else can? What hidden tension or superpower lives in the interplay between these three signs? Make them feel like the universe designed them for something specific.`;

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

        const userPrompt = `Provide a comprehensive natal chart reading:

BIG THREE: Sun in ${triad.sun}, Moon in ${triad.moon}, Rising in ${triad.rising}

ALL PLANETARY PLACEMENTS:
${planetLines}

KEY ASPECTS:
${aspectLines}

What are the dominant themes? What makes this chart unique? What should this person know about their cosmic blueprint?`;

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

Never be leading or prescriptive. You're holding up a mirror so THEY recognize themselves.

STRUCTURE — Follow these four sections exactly, using these headers:

**✦ Who You Are at Your Core**
Weave Sun sign + Life Path number together. Show how they reinforce or create interesting tension. Ground with a relatable scenario about how they make decisions or move through the world.

**✦ The Energies Shaping You**
Moon, Rising, key planets, and the most important aspects. Explain what these energies feel like from the INSIDE. Use specific "you might notice..." examples — like walking into a room and sensing tension, or the push-pull of getting excited then second-guessing yourself.

**✦ Where You Are Right Now**
Personal Year number in the context of their chart. Connect it to what they might currently be feeling — restlessness, transition, consolidation, whatever fits. Make them feel seen in their current moment.

**✦ The Gift You Don't See Yet**
Name something in their chart that is likely their greatest strength but that they've probably been told is "too much" or have dismissed about themselves. Prove it with a relatable example, then reframe it powerfully. End on this high note.

FORMATTING RULES (follow strictly):
- Put each section header on its OWN line with a blank line BEFORE and AFTER it.
- Break your writing into short paragraphs of 2-3 sentences MAX. Put a blank line between every paragraph.
- NEVER write more than 3 sentences in a row without a paragraph break.
- The reading should breathe — white space is part of the experience.`;

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

Follow the four-section structure. For every insight: name the energy, ground it in a relatable life scenario, then reframe it. Make them feel like you truly see them.`;

        return this.chatPremium(systemPrompt, userPrompt, 1200);
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
        const systemPrompt = `You are a warm, mystical relationship astrologer. Write a flowing, second-person ("you and your partner") compatibility reading. Be specific about the sign combinations. Include what draws them together, their emotional dynamic, one growth edge, and name their unique "Couple Superpower."${TEACHING_FORMAT}`;

        const userPrompt = `Write a couple compatibility reading for these two charts:

Person A: Sun in ${userTriad.sun.name} (${userTriad.sun.element}), Moon in ${userTriad.moon.name} (${userTriad.moon.element}), Rising in ${userTriad.rising.name} (${userTriad.rising.element})
Person B: Sun in ${partnerTriad.sun.name} (${partnerTriad.sun.element}), Moon in ${partnerTriad.moon.name} (${partnerTriad.moon.element}), Rising in ${partnerTriad.rising.name} (${partnerTriad.rising.element})

Their compatibility score is ${score}/100 — "${tier}". Weave this naturally into the reading without stating the number.`;

        return this.chat(systemPrompt, userPrompt);
    }

    async chat(systemPrompt: string, userPrompt: string, maxTokens = 600): Promise<string> {
        if (!this.apiKey) {
            throw new Error('No API key configured. Add your OpenRouter key in Settings.');
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

    /** Premium model chat — uses Gemini 2.5 Pro for deep, once-a-day readings */
    async chatPremium(systemPrompt: string, userPrompt: string, maxTokens = 1200): Promise<string> {
        if (!this.apiKey) {
            throw new Error('No API key configured. Add your OpenRouter key in Settings.');
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
        });

        if (!response.ok) {
            const error = await response.text();
            // Fallback to Flash model if premium fails
            console.warn('Premium model failed, falling back to Flash:', error);
            return this.chat(systemPrompt, userPrompt, maxTokens);
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
        const raw = localStorage.getItem(DAILY_LIMIT_KEY);
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
export function canDoReading(subscription: string): boolean {
    if (subscription === 'premium') return true;
    return getRemainingReadings() > 0;
}

/** Increment the daily reading counter */
export function incrementReadingCount() {
    const data = getDailyData();
    data.count += 1;
    localStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify(data));
}

/** Get total readings done today */
export function getTodayReadingCount(): number {
    return getDailyData().count;
}
