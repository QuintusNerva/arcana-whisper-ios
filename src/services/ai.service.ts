import { safeStorage } from "./storage.service";
/**
 * AI Interpretation Service — OpenRouter Integration
 * Uses Gemini 2.0 Flash via OpenRouter for tarot card interpretations.
 */

import { getMemoryContextForAI } from './memory.service';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.0-flash-001';
const PREMIUM_MODEL = 'anthropic/claude-sonnet-4.6';
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
4. GIVE THEM ONE ACTION — end each section with one specific, practical action they can take TODAY or THIS WEEK. The action MUST be directly justified by the chart insight you just explained. Use the pattern: "Because [specific chart placement/aspect] → try [specific action]." Never give generic advice like "practice gratitude" or "set boundaries." The action should be something ONLY someone with THIS chart would benefit from. Make it concrete: a 5-minute exercise, a specific question to ask themselves, a behavior to try once, or a mindset shift to practice.

STRUCTURE — Follow these four sections exactly, using these headers:

**✦ Who You Are at Your Core** (150-200 words)
Weave Sun sign + Life Path number together. Show how they reinforce or create interesting tension. Ground with a relatable scenario about how they make decisions or move through the world. End with ONE specific action justified by this Sun + Life Path combination.

**✦ The Energies Shaping You** (150-200 words)
Moon, Rising, key planets, and the most important aspects. Explain what these energies feel like from the INSIDE. Use specific "you might notice..." examples — like walking into a room and sensing tension, or the push-pull of getting excited then second-guessing yourself. End with ONE specific action justified by their Moon/Rising dynamic.

**✦ Where You Are Right Now** (100-150 words)
Personal Year number in the context of their chart. Connect it to what they might currently be feeling — restlessness, transition, consolidation, whatever fits. Make them feel seen in their current moment. End with ONE specific action for navigating THIS particular year cycle with their chart.

**✦ The Gift You Don't See Yet** (100-150 words)
Name something in their chart that is likely their greatest strength but that they've probably been told is "too much" or have dismissed about themselves. Prove it with a relatable example, then reframe it powerfully. End with ONE specific way to lean INTO this gift this week — not hold it back.

ACTION FORMATTING:
- Write each action as a bold line starting with **→ Try this:** followed by the specific suggestion.
- The action should feel like it flows naturally from the paragraph above it — not bolted on.
- Actions must reference the specific chart placement that justifies them (e.g., "Because your Mars in Gemini trines your Moon...").

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

Follow the four-section structure. For every insight: name the energy, ground it in a relatable life scenario, then reframe it. Make them feel like you truly see them.

IMPORTANT: You MUST include ALL FOUR sections. Keep each section to 150-200 words max. The total reading should be approximately 600-800 words. Do NOT write long essays — be precise and impactful.`;

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
        const systemPrompt = `You are a warm, mystical relationship astrologer. Write a flowing, second-person ("you and your partner") compatibility reading. Be specific about the sign combinations. Include what draws them together, their emotional dynamic, one growth edge, and name their unique "Couple Superpower."${TEACHING_FORMAT}`;

        const userPrompt = `Write a couple compatibility reading for these two charts:

Person A: Sun in ${userTriad.sun.name} (${userTriad.sun.element}), Moon in ${userTriad.moon.name} (${userTriad.moon.element}), Rising in ${userTriad.rising.name} (${userTriad.rising.element})
Person B: Sun in ${partnerTriad.sun.name} (${partnerTriad.sun.element}), Moon in ${partnerTriad.moon.name} (${partnerTriad.moon.element}), Rising in ${partnerTriad.rising.name} (${partnerTriad.rising.element})

Their compatibility score is ${score}/100 — "${tier}". Weave this naturally into the reading without stating the number.`;

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

        const userPrompt = `Read this couple's synastry chart:

PERSON A: Sun ${userTriad.sun}, Moon ${userTriad.moon}, Rising ${userTriad.rising}
${partnerName.toUpperCase()}: Sun ${partnerTriad.sun}, Moon ${partnerTriad.moon}, Rising ${partnerTriad.rising}

SYNASTRY ASPECTS:
${aspectBlock}

Write a flowing, personal deep dive. For every insight: describe what it FEELS like, ground it in a scenario, then give one growth tip.`;

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

        return this.chat(systemPrompt, userPrompt, 300);
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

Rules:
- Bold all astrological terms (**Scorpio Moon**, **Square**, etc.)
- Frame everything through the lens of a ${data.childAgeLabel} (age ${data.childAge})
- Never be judgmental — validate the parent's experience
- Give specific behavioral examples, not abstract astrology
- Total length: 600-900 words
- Do NOT use code blocks, links, or images${TEACHING_FORMAT}`;

        const aspectSummary = data.synastryHighlights
            .map(a => `Your ${a.planet1} ${a.aspect} their ${a.planet2} (${a.nature}, ${a.category})`)
            .join('\n');

        const userPrompt = `Generate a parent↔child reading.

PARENT: Sun in ${data.parentTriad.sun}, Moon in ${data.parentTriad.moon}, Rising in ${data.parentTriad.rising}
CHILD (${data.childName}): Sun in ${data.childTriad.sun}, Moon in ${data.childTriad.moon}, Rising in ${data.childTriad.rising}
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
        child2Name: string;
        child2Triad: { sun: string; moon: string; rising: string };
        child2Age: number;
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

Rules:
- Bold all astrological terms
- Use age-appropriate examples (ages ${data.child1Age} and ${data.child2Age})
- Be warm and practical
- Total length: 500-700 words${TEACHING_FORMAT}`;

        const aspectSummary = data.synastryHighlights
            .map(a => `${data.child1Name}'s ${a.planet1} ${a.aspect} ${data.child2Name}'s ${a.planet2} (${a.nature})`)
            .join('\n');

        const userPrompt = `Generate a sibling dynamics reading.

${data.child1Name} (age ${data.child1Age}): Sun in ${data.child1Triad.sun}, Moon in ${data.child1Triad.moon}, Rising in ${data.child1Triad.rising}
${data.child2Name} (age ${data.child2Age}): Sun in ${data.child2Triad.sun}, Moon in ${data.child2Triad.moon}, Rising in ${data.child2Triad.rising}

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
For EACH month, write 2-3 sentences with the dominant energy and practical advice. Format as:
**January**: [guidance]
**February**: [guidance]
...and so on for all 12 months.

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
    async chatPremium(systemPrompt: string, userPrompt: string, maxTokens = 3000): Promise<string> {
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
export function canDoReading(subscription: string): boolean {
    if (subscription === 'premium') return true;
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
