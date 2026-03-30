/**
 * Transit Interpretation — Personalized transit reading for the user's chart.
 * Extracted from ai.service.ts getTransitInterpretation().
 */

export interface TransitParams {
    transitPlanet: { name: string; glyph: string; signId: string; degreeInSign: number };
    natalPlanet: { name: string; glyph: string; signId: string; degreeInSign: number };
    aspect: { name: string; symbol: string; nature: string };
    orb: number;
    isApplying: boolean;
    triadContext?: { sun?: string; moon?: string; rising?: string };
    lifePath?: number;
    personalYear?: number;
}

export function buildTransitPrompt(params: TransitParams): { system: string; user: string } {
    const tSign = params.transitPlanet.signId.charAt(0).toUpperCase() + params.transitPlanet.signId.slice(1);
    const nSign = params.natalPlanet.signId.charAt(0).toUpperCase() + params.natalPlanet.signId.slice(1);

    const system = `You are a personal astrologer interpreting a transit for your client.
You speak directly to them ("you"), warm but honest. Be specific and actionable.
No generic astrology — this is about THEIR specific chart activation.
Write 2-3 sentences. No headers, no bullet points, no markdown. Just flowing prose.
Be practical: suggest a specific action, mindset, or thing to watch for TODAY.`;

    const orbDesc = params.orb < 1 ? 'EXACT TODAY — peak intensity'
        : params.isApplying ? `Orb: ${params.orb}° and tightening — building in intensity`
            : `Orb: ${params.orb}° and separating — intensity is fading`;

    let user = `TRANSIT: ${params.transitPlanet.name} (currently at ${tSign} ${params.transitPlanet.degreeInSign}°) is forming a ${params.aspect.name} to their natal ${params.natalPlanet.name} (${nSign} ${params.natalPlanet.degreeInSign}°).
${orbDesc}
NATURE: ${params.aspect.nature}`;

    if (params.triadContext) {
        const parts = [];
        if (params.triadContext.sun) parts.push(`Sun in ${params.triadContext.sun}`);
        if (params.triadContext.moon) parts.push(`Moon in ${params.triadContext.moon}`);
        if (params.triadContext.rising) parts.push(`Rising in ${params.triadContext.rising}`);
        if (parts.length > 0) {
            user += `\n\nTheir natal chart context: ${parts.join(', ')}.`;
        }
    }

    user += `\n\nWrite a personalized 2-3 sentence interpretation. Be specific about what they might FEEL or EXPERIENCE today because of this transit. End with one actionable suggestion.`;

    if (params.lifePath !== undefined) {
        user += `\nNumerology context: Life Path ${params.lifePath}${params.personalYear !== undefined ? `, Personal Year ${params.personalYear}` : ''}.`;
    }

    return { system, user };
}
