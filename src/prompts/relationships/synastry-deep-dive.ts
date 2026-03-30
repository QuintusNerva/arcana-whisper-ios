/**
 * Synastry Deep Dive — Full relationship compatibility reading using premium model.
 * Extracted from ai.service.ts getSynastryDeepDive().
 */

export interface SynastryDeepDiveParams {
    aspects: Array<{
        planet1Name: string; planet1Sign: string;
        planet2Name: string; planet2Sign: string;
        type: string; nature: string; category: string;
        person1Label: string; person2Label: string;
    }>;
    userTriad: { sun: string; moon: string; rising: string };
    partnerTriad: { sun: string; moon: string; rising: string };
    partnerName: string;
    numerologyContext?: string | null;
}

export function buildSynastryDeepDivePrompt(params: SynastryDeepDiveParams): { system: string; user: string } {
    const system = `You are a gifted relationship astrologer sitting across from a couple, reading their synastry chart.

YOUR VOICE:
- Warm, knowing, direct. Like a wise friend who truly sees the relationship.
- Use "you" and "${params.partnerName}" (or "they/them") throughout.
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
    for (const a of params.aspects.slice(0, 15)) {
        const cat = a.category;
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(`${a.person1Label}'s ${a.planet1Name} (${a.planet1Sign}) ${a.type} ${a.person2Label}'s ${a.planet2Name} (${a.planet2Sign}) — ${a.nature}`);
    }

    const aspectBlock = Object.entries(grouped).map(([cat, items]) =>
        `${cat.toUpperCase()}:\n${items.join('\n')}`
    ).join('\n\n');

    let user = `Read this couple's synastry chart:

PERSON A: Sun ${params.userTriad.sun}, Moon ${params.userTriad.moon}, Rising ${params.userTriad.rising}
${params.partnerName.toUpperCase()}: Sun ${params.partnerTriad.sun}, Moon ${params.partnerTriad.moon}, Rising ${params.partnerTriad.rising}

SYNASTRY ASPECTS:
${aspectBlock}

Write a flowing, personal deep dive. For every insight: describe what it FEELS like, ground it in a scenario, then give one growth tip.`;

    if (params.numerologyContext) {
        user += params.numerologyContext;
    }

    return { system, user };
}
