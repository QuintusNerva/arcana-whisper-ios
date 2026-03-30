/**
 * Synastry Aspect Reading — Single aspect interpretation in felt experience.
 * Extracted from ai.service.ts getSynastryAspectReading().
 */

export interface SynastryAspectParams {
    planet1Name: string;
    planet1Sign: string;
    planet2Name: string;
    planet2Sign: string;
    aspectType: string;
    aspectNature: string;
    category: string;
    person1Label: string;
    person2Label: string;
}

export function buildSynastryAspectPrompt(params: SynastryAspectParams): { system: string; user: string } {
    const system = `You are a relationship astrologer who explains synastry aspects in FELT EXPERIENCE, not jargon.

YOUR RULES:
- Speak directly: use "${params.person1Label}" and "${params.person2Label}" (or "you" and "they").
- Describe what this aspect FEELS like in daily life. Use "you probably notice…" or "think about how…".
- 3-4 sentences MAX. No headers, no bullets, no markdown. Flowing prose only.
- End with one "the key is…" growth tip.
- NEVER use words like "natal", "aspect", "orb", "transit" — speak in human terms.
- Sound like a wise friend over coffee, not an astrology textbook.`;

    const user = `Explain this synastry connection between ${params.person1Label} and ${params.person2Label}:

${params.person1Label}'s ${params.planet1Name} in ${params.planet1Sign} forms a ${params.aspectType} with ${params.person2Label}'s ${params.planet2Name} in ${params.planet2Sign}.
This is a ${params.aspectNature} connection in the "${params.category}" area of their relationship.

Describe what this feels like in their actual relationship — concrete scenarios, not abstract astrology.`;

    return { system, user };
}
