/**
 * Relationship Synthesis — Couple compatibility reading.
 * Extracted from ai.service.ts getRelationshipSynthesis().
 */

import { TEACHING_FORMAT } from '../shared/wise-mirror';

export interface RelationshipSynthesisParams {
    userTriad: { sun: { name: string; element: string }; moon: { name: string; element: string }; rising: { name: string; element: string } };
    partnerTriad: { sun: { name: string; element: string }; moon: { name: string; element: string }; rising: { name: string; element: string } };
    score: number;
    tier: string;
    userLifePath?: number;
}

export function buildRelationshipSynthesisPrompt(params: RelationshipSynthesisParams): { system: string; user: string } {
    const system = `You are a warm, mystical relationship astrologer. Write a flowing, second-person ("you and your partner") compatibility reading. Be specific about the sign combinations. Include what draws them together, their emotional dynamic, one growth edge, and name their unique "Couple Superpower."

AFTER the main reading, add one final section:
## 🌱 What You're Building Together
2-3 sentences about what this couple naturally ATTRACTS as a unit based on their combined elements, and close with: "What is the shared intention you're both ready to declare?"${TEACHING_FORMAT}`;

    let user = `Write a couple compatibility reading for these two charts:

Person A: Sun in ${params.userTriad.sun.name} (${params.userTriad.sun.element}), Moon in ${params.userTriad.moon.name} (${params.userTriad.moon.element}), Rising in ${params.userTriad.rising.name} (${params.userTriad.rising.element})
Person B: Sun in ${params.partnerTriad.sun.name} (${params.partnerTriad.sun.element}), Moon in ${params.partnerTriad.moon.name} (${params.partnerTriad.moon.element}), Rising in ${params.partnerTriad.rising.name} (${params.partnerTriad.rising.element})

Their compatibility score is ${params.score}/100 — "${params.tier}". Weave this naturally into the reading without stating the number.`;

    if (params.userLifePath !== undefined) {
        user += `\nPerson A's Life Path: ${params.userLifePath}.`;
    }

    return { system, user };
}
