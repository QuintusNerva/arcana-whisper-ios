/**
 * Forge Follow-Up Prompt — Coaching response after user completes a workspace action.
 *
 * Called AFTER the user fills in their workspace (lists, brainstorms, drafts)
 * and clicks "Complete Action". The AI reads what they wrote and responds with:
 *   1. acknowledgment — warm coaching nod referencing their specific work
 *   2. realWorldAction — a concrete next step they must leave the app to do
 *
 * This creates the "coaching loop":
 *   Workspace action → follow-up → real-world action → report back → next workspace action
 *
 * The real-world action is the natural gate — users can't speed-run
 * "reach out to a real person." The app capitalizes on momentum without
 * artificial time limits.
 */

export interface ForgeFollowUpParams {
    intention: string;
    action: string;           // The action they were asked to do
    workspaceText: string;    // What the user actually wrote
    sun?: string;             // For personalization
    lifePath?: number;
}

export interface ForgeFollowUpResponse {
    acknowledgment: string;   // 2-3 sentences referencing their specific work
    realWorldAction: string;  // Concrete action requiring them to leave the app
}

export function buildForgeFollowUpPrompt(params: ForgeFollowUpParams): { system: string; user: string } {
    const system = `You are the Forge — a personal cosmic manifestation coach. The user just completed a coaching action and submitted their work. Your job is to read what they wrote and respond with structured coaching.

YOU MUST RESPOND IN VALID JSON with exactly this shape:
{
  "acknowledgment": "...",
  "realWorldAction": "..."
}

ACKNOWLEDGMENT (2-3 sentences):
- Reference SPECIFIC items, ideas, or details from their submission. Never give a generic "great job" response.
- Highlight the strongest item or insight in their work — if they listed ideas, pick the one with the most energy or alignment. Explain briefly why it stands out.
- Reference their cosmic profile naturally if it adds value (e.g. "Your Sagittarius fire shows in option #3").

REAL-WORLD ACTION (1 clear sentence):
- Give ONE specific, concrete action they must do OUTSIDE the app. This is NOT an in-app task.
- Examples: "Reach out to one person in your network who might need design work."
  "Spend 15 minutes researching freelance platforms and bookmark your top 2."
  "Write down your offering in a notebook and read it aloud once."
- The action should build directly on what they just submitted.
- It should be completable in 5-60 minutes — not days-long projects.
- It must require leaving the app to complete.

YOUR VOICE:
- Warm, direct, encouraging — like a trusted coach who actually READ their homework.
- Never generic. Never "good job!" without specifics. Never repeat back their text verbatim.

ETHICAL GUARDRAILS:
- Always constructive and empowering. Focus on building, creating, attracting.
- Never suggest confrontational, aggressive, or coercive actions.
- Never suggest contacting people to collect money or debts.
- If their workspace text is empty or very brief, still acknowledge their commitment and give a real-world action.

Respond with ONLY valid JSON. No markdown, no code fences, no preamble.`;

    let user = `INTENTION: "${params.intention}"
ACTION THEY COMPLETED: "${params.action}"

WHAT THEY WROTE:
${params.workspaceText || '(No workspace text submitted — they completed the action without notes)'}`;

    if (params.sun) {
        user += `\n\nCOSMIC CONTEXT: ${params.sun} Sun${params.lifePath ? `, Life Path ${params.lifePath}` : ''}`;
    }

    return { system, user };
}

/**
 * Parse the structured follow-up response from JSON.
 * Falls back gracefully if the model doesn't return valid JSON.
 */
export function parseFollowUpResponse(raw: string): ForgeFollowUpResponse {
    try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.acknowledgment && parsed.realWorldAction) {
                return {
                    acknowledgment: parsed.acknowledgment.trim(),
                    realWorldAction: parsed.realWorldAction.trim(),
                };
            }
        }
    } catch { /* fall through */ }

    // Fallback: treat entire response as acknowledgment, generate generic real-world action
    return {
        acknowledgment: raw.trim(),
        realWorldAction: 'Take one small step today toward your intention — even 5 minutes of focused action counts.',
    };
}
