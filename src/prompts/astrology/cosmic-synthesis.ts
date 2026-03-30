/**
 * Cosmic Synthesis — How elements and planets interact across the natal chart.
 * Extracted from ai.service.ts getCosmicSynthesis().
 */

import { TEACHING_FORMAT } from '../shared/wise-mirror';

export interface CosmicSynthesisParams {
    triad: {
        sun: { name: string; element: string; ruling: string };
        moon: { name: string; element: string; ruling: string };
        rising: { name: string; element: string; ruling: string };
    };
    numerologyContext?: string | null;
}

export function buildCosmicSynthesisPrompt(params: CosmicSynthesisParams): { system: string; user: string } {
    const system = `You are a master astrologer giving a deeply personal reading.
Focus on what makes THIS specific combination of signs rare and special — what unique gifts, contradictions, and superpowers emerge from this exact chart.
Make them feel truly seen. Be specific about how these signs interact in ways that no other combination would.
Use a warm, mystical, empowering tone.${TEACHING_FORMAT}`;

    let user = `Tell this person what makes them cosmically unique based on their natal chart:

Sun: ${params.triad.sun.name} (${params.triad.sun.element}, ruled by ${params.triad.sun.ruling})
Moon: ${params.triad.moon.name} (${params.triad.moon.element}, ruled by ${params.triad.moon.ruling})
Rising: ${params.triad.rising.name} (${params.triad.rising.element}, ruled by ${params.triad.rising.ruling})

What is rare or special about this exact combination? What can they do that almost nobody else can? What hidden tension or superpower lives in the interplay between these three signs? Make them feel like the universe designed them for something specific.`;

    if (params.numerologyContext) {
        user += params.numerologyContext;
    }

    return { system, user };
}
