/**
 * Journal Patterns — Transit-aware pattern discovery in journal entries.
 * Extracted from ai.service.ts getJournalPatterns().
 */

export interface JournalPatternsParams {
    planet: string;
    entries: Array<{ text: string; date: string; mood?: string }>;
    triadContext?: { sun?: string; moon?: string; rising?: string };
    lifePath?: number;
    personalYear?: number;
}

export function buildJournalPatternsPrompt(params: JournalPatternsParams): { system: string; user: string } {
    const system = `You are a wise, warm cosmic coach — not a therapist, not a fortune teller.
You've been reading someone's private journal entries alongside watching the sky.
You've noticed a pattern between their writing and when ${params.planet} was active in their chart.

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

    const entrySnippets = params.entries.slice(0, 6).map((e, i) =>
        `Entry ${i + 1} (${e.date})${e.mood ? ` [mood: ${e.mood}]` : ''}: "${e.text.slice(0, 200)}${e.text.length > 200 ? '...' : ''}"`
    ).join('\n\n');

    let user = `Here are ${params.entries.length} journal entries written while ${params.planet} was active in this person's chart:\n\n${entrySnippets}\n\nDiscover the pattern. What themes keep showing up when ${params.planet} activates their chart? Validate it, reframe it positively, and end with an empowering question.`;

    if (params.triadContext) {
        const parts = [];
        if (params.triadContext.sun) parts.push(`Sun in ${params.triadContext.sun}`);
        if (params.triadContext.moon) parts.push(`Moon in ${params.triadContext.moon}`);
        if (params.triadContext.rising) parts.push(`Rising in ${params.triadContext.rising}`);
        if (parts.length > 0) {
            user += `\n\nTheir natal chart: ${parts.join(', ')}.`;
        }
    }

    if (params.lifePath !== undefined) {
        user += `\nNumerology: Life Path ${params.lifePath}${params.personalYear !== undefined ? `, Personal Year ${params.personalYear}` : ''}.`;
    }

    return { system, user };
}
