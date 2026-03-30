/**
 * Placement Insight — Natal chart position interpretation.
 * Extracted from ai.service.ts getPlacementInsight().
 */

export interface PlacementInsightParams {
    position: 'sun' | 'moon' | 'rising';
    sign: { name: string; element: string; ruling: string };
    triadContext?: { sun?: string; moon?: string; rising?: string };
}

const POSITION_DESCRIPTIONS = {
    sun: 'Sun sign (core identity, ego, life purpose)',
    moon: 'Moon sign (emotional nature, inner world, subconscious needs)',
    rising: 'Rising/Ascendant sign (outward persona, first impressions, social mask)',
} as const;

export function buildPlacementInsightPrompt(params: PlacementInsightParams): { system: string; user: string } {
    const system = `You are a master astrologer with deep knowledge of natal chart interpretation.
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

    let user = `Interpret ${params.sign.name} in the ${POSITION_DESCRIPTIONS[params.position]}.
Sign element: ${params.sign.element}
Ruling planet: ${params.sign.ruling}`;

    if (params.triadContext) {
        const parts = [];
        if (params.triadContext.sun) parts.push(`Sun in ${params.triadContext.sun}`);
        if (params.triadContext.moon) parts.push(`Moon in ${params.triadContext.moon}`);
        if (params.triadContext.rising) parts.push(`Rising in ${params.triadContext.rising}`);
        if (parts.length > 1) {
            user += `\n\nFull natal triad for extra context: ${parts.join(', ')}. 
Use this context to make the reading more personalized — how does this placement interact with the rest of their chart?`;
        }
    }

    return { system, user };
}
