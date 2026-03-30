/**
 * Horoscope — Daily AI-powered horoscope generation.
 * Extracted from Horoscope.tsx inline prompt.
 */

export interface HoroscopeParams {
    sign: { name: string; element: string; ruling: string };
    dateLabel: string;
    mood: string;
    daily: string;
    triad?: { sun: { name: string }; moon: { name: string }; rising: { name: string } };
    lifePath?: number;
    personalYear?: number;
    activeManifestations?: string[];
}

export function buildHoroscopePrompt(params: HoroscopeParams): { system: string; user: string } {
    const system = `You are a warm, mystical astrologer writing today's horoscope. Write in second person ("you"). Be specific, poetic, and empowering.

You MUST format your response using these rules:
1. Structure into 2-3 sections using ## headers (e.g. ## The Theme, ## The Lesson, ## Your Action Steps).
2. Bold all key terminology using **double asterisks** (e.g. **Sagittarius**, **Mercury retrograde**).
3. End with a section called "## Your Action Steps" containing 2-3 bullet points starting with "- ".
4. Keep paragraphs short (2-3 sentences max).
5. Do NOT use any other markdown like code blocks, links, or images.`;

    let user = `Write today's horoscope for ${params.sign.name} (${params.sign.element} sign, ruled by ${params.sign.ruling}) for ${params.dateLabel}.
Mood seed: "${params.mood}". Theme seed: "${params.daily}".
Expand on that theme with practical guidance, emotional insight, and a sense of what the day holds.`;

    if (params.triad) {
        user += `\n\nThis person's natal chart: Sun in ${params.triad.sun.name}, Moon in ${params.triad.moon.name}, Rising in ${params.triad.rising.name}. Subtly personalize the reading to this configuration without mentioning you're doing so.`;

        if (params.lifePath !== undefined && params.personalYear !== undefined) {
            user += `\nThey are on Life Path ${params.lifePath} in Personal Year ${params.personalYear}. Weave this numerological timing into the day's energy — how their current cycle amplifies or softens today's theme.`;
        }
    }

    if (params.activeManifestations && params.activeManifestations.length > 0) {
        const intentions = params.activeManifestations.slice(0, 2).join('; ');
        user += `\nThey are actively manifesting: ${intentions}. If today's energy genuinely supports or challenges this intention, mention it briefly.`;
    }

    return { system, user };
}
