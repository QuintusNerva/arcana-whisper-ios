/**
 * Full Chart Summary — Comprehensive natal chart reading with all planets and aspects.
 * Extracted from ai.service.ts getFullChartSummary().
 */

import { TEACHING_FORMAT } from '../shared/wise-mirror';

export interface ChartSummaryParams {
    planets: Array<{ name: string; signId: string; degreeInSign: number }>;
    aspects: Array<{ planet1Name: string; planet2Name: string; type: string; orb: number }>;
    triad: { sun: string; moon: string; rising: string };
    numerologyContext?: string | null;
}

export function buildChartSummaryPrompt(params: ChartSummaryParams): { system: string; user: string } {
    const system = `You are a master astrologer providing a comprehensive natal chart reading.
Synthesize all planetary placements and aspects into a cohesive narrative.
Highlight the most significant patterns: stelliums, grand trines, T-squares, element balance, etc.
Be specific about how the planets interact through their aspects.
Use a warm, insightful, mystical tone.${TEACHING_FORMAT}`;

    const planetLines = params.planets.map(p =>
        `${p.name}: ${p.degreeInSign.toFixed(1)}° ${p.signId.charAt(0).toUpperCase() + p.signId.slice(1)}`
    ).join('\n');

    const aspectLines = params.aspects.slice(0, 12).map(a =>
        `${a.planet1Name} ${a.type} ${a.planet2Name} (orb: ${a.orb}°)`
    ).join('\n');

    let user = `Provide a comprehensive natal chart reading:

BIG THREE: Sun in ${params.triad.sun}, Moon in ${params.triad.moon}, Rising in ${params.triad.rising}

ALL PLANETARY PLACEMENTS:
${planetLines}

KEY ASPECTS:
${aspectLines}

What are the dominant themes? What makes this chart unique? What should this person know about their cosmic blueprint?`;

    if (params.numerologyContext) {
        user += params.numerologyContext;
    }

    return { system, user };
}
