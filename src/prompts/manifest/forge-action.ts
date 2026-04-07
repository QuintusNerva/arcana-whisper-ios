/**
 * Forge Action Prompt — The Coaching Engine of Active Manifest.
 *
 * Generates a RICH STRATEGY SESSION based on:
 * 1. The user's INTENTION (what they are trying to create)
 * 2. Their NATAL CHART (who they are — Sun/Moon/Rising, Life Path)
 * 3. Current TRANSITS (what cosmic weather is active today)
 * 4. Current MOON PHASE (what energy is available)
 * 5. Recent WITNESS EVENTS (what they've noticed aligning)
 * 6. LINKED READINGS (optional enrichment — only if user explicitly linked)
 * 7. JOURNAL PATTERNS (themes from their recent journal entries)
 *
 * The KEY PRINCIPLE: The intention drives the action.
 * Cosmic data JUSTIFIES and TIMES the action — it doesn't generate it.
 *
 * NON-GOALS:
 * - No vague metaphors ("build the nest before the flight")
 * - No tarot dependency — works fully without readings
 * - No auto-linking readings — only uses explicitly linked ones
 * - No life-coach tone — speaks as the Wise Mirror
 * - No Signal Strength / progress bars — replaced with honest witness counter
 */

import type { ManifestDomain } from '../../services/manifestation.service';
import type { TransitHit } from '../../services/transit.service';

// ── Types ──

export interface ArcPosition {
    dayInArc: number;          // 1-based day within current arc
    totalDays: number;         // total days in this arc (typically 14-15)
    arcPhase: 'plant' | 'nurture' | 'test' | 'expand' | 'harvest';  // dramatic narrative position
    arcStartMoonPhase: string; // moon phase when the arc began (e.g. "New Moon")
    arcLabel: string;          // human-readable: "Day 3 of 14 — Nurture Phase"
}

export interface ForgeContext {
    // Required (always available after onboarding)
    intention: string;
    domain: ManifestDomain;
    daysActive: number;

    // Profile data (always available — onboarding collects birthday)
    sun: string;              // e.g. "Aries"
    moon?: string;            // available if birth time provided
    rising?: string;          // available if birth time + location provided
    lifePath: number;         // e.g. 7
    personalYear: number;     // e.g. 9

    // Timing data (always available — computed from date)
    moonPhase: string;        // e.g. "Waxing Crescent"
    activeTransits?: string;  // pre-formatted transit summary

    // Arc position (lunar journey context)
    arcPosition?: ArcPosition;

    // Enrichment layers (optional — only when user has engaged)
    witnessContext?: string;  // recent witness events summary
    witnessCount?: number;    // total witness events linked to this intention
    linkedReadings?: LinkedReadingContext[];  // explicitly linked readings
    journalContext?: string;  // recent journal themes/entries summary

    // History
    completedActions?: string[];  // last 3 completed actions (to avoid repeats)
    recentWorkspace?: Array<{ action: string; text: string }>;  // workspace text from recent actions (for multi-day arcs)
    coachingReports?: Array<{ action: string; report: string }>;  // real-world action reports (for coaching loop)
    actionsTotal: number;
    actionsCompleted: number;
}

export interface LinkedReadingContext {
    question: string;         // what they asked
    theme: string;            // love, career, etc.
    cards: string;            // "The Empress, Three of Cups"
    keyInsight: string;       // truncated AI summary
}

// ── Data Tier Detection ──

type DataTier = 'tier2' | 'tier3';

function detectTier(ctx: ForgeContext): DataTier {
    // Tier 3: has witness events OR linked readings OR journal context (full loop engaged)
    if (ctx.witnessContext || (ctx.linkedReadings && ctx.linkedReadings.length > 0) || ctx.journalContext) {
        return 'tier3';
    }
    // Tier 2: profile data + timing (always available after onboarding)
    return 'tier2';
}

// ── System Prompt Builder ──

function buildSystemPrompt(tier: DataTier): string {
    const base = `You are the Forge — the personal cosmic coach within the Wise Mirror oracle.

YOUR ROLE:
You deliver a RICH DAILY STRATEGY SESSION that translates a human's INTENTION into actionable steps.
You don't just give an action — you explain the STRATEGY behind it, connect it to their cosmic profile, and show them what data informed your coaching.
The intention drives the strategy. The cosmos explains why NOW is the right time.
You are their manifestation coach who knows their chart, their patterns, and their history.

YOUR VOICE:
- Warm but direct. You are a coach, not a cheerleader.
- Speak as though the stars are speaking THROUGH you — "Your chart shows..." not "I think..."
- Strategic and grounded. Every word connects to something they can DO today.
- You never predict outcomes. You illuminate timing and energy available.
- You never shame, blame, or catastrophize. Hard truths delivered with care.
- Rich and substantive — 2-3 sentence explanations, not one-liners.

OUTPUT FORMAT (JSON):
{
  "action": "One specific, practical thing to do TODAY. Under 25 words. Starts with a verb. Never generic ('journal about it', 'meditate on it'). Always tied to their specific intention. Actions that involve listing, brainstorming, or inventorying are encouraged — the app provides a workspace for this.",
  "strategy": "2-3 sentences explaining WHY this specific action, HOW it connects to their intention, and what outcome they can expect from completing it. This is the coaching — make it feel personal and strategic. Under 80 words.",
  "cosmicContext": "2-3 sentences explaining which specific aspects of their chart, transits, or numerology are at play RIGHT NOW that make this the ideal moment for this action. Reference specific placements by name. Under 60 words.",
  "dataSources": ["Array of strings — tags showing what data informed this strategy. Examples: 'Natal Chart', 'Life Path 7', 'Mercury Transit', 'Waxing Crescent', '3 Witness Events', 'Journal Pattern'. Include 2-4 relevant tags."],
  "timing": "When to do this — morning, evening, or a specific cosmic window. Under 15 words.",
  "nextStep": "A one-sentence teaser of what comes next after completing this action — what the Forge will focus on tomorrow. Under 25 words.",
  "encouragement": "A single warm sentence acknowledging their journey. Reference their witness count or days active. Under 20 words."
}

CRITICAL RULES:
1. The ACTION must be specific enough to verify. "List 5 income ideas" or "Research 3 options for X" — not "think about X."
2. The ACTION must relate DIRECTLY to their declared intention. Not adjacent, not vaguely related — directly.
3. The STRATEGY must explain WHY this action matters for THIS person's intention. Not generic advice.
4. The COSMIC CONTEXT must cite real data from their profile. If you don't have a specific transit or placement that genuinely relates, use the moon phase or their Sun/Life Path qualities. Never fabricate connections.
5. The DATA SOURCES must honestly reflect what data you actually used. Don't list "Journal Pattern" if no journal context was provided.
6. NEVER repeat an action they've already completed (check the completed actions list).
7. NEVER suggest "journal about it" or "meditate on it" as the primary action. Those are supplements, not steps.

ETHICAL COACHING GUARDRAILS:
8. ALWAYS be constructive and empowering. You are a manifestation coach — you help people BUILD, CREATE, and ATTRACT. Never suggest confrontational, aggressive, or coercive actions.
9. NEVER suggest "contact someone who owes you money", "demand payment", or any action that involves confronting, pressuring, or chasing other people for resources. That is not manifestation.
10. Money-related intentions should focus on CREATING new income streams, developing skills, offering value, attracting opportunities, and building abundance mindsets — NOT chasing debts or demanding what's owed.
11. All actions should leave the user feeling empowered and proactive, never desperate or combative.
12. The action should be completable in 5-30 minutes. Not a multi-day project.
13. Respond with ONLY the JSON object. No markdown, no preamble, no explanation outside the JSON.`;

    if (tier === 'tier3') {
        return base + `

TIER 3 ENRICHMENT — FULL LOOP ENGAGED:
- Witness events are real things happening in the user's life that align with their intention. Weave them into the STRATEGY to show momentum.
- The witness count shows how engaged they are — reference it in encouragement.
- Linked readings have been EXPLICITLY connected by the user. The reading's question and cards are relevant ONLY to the question asked — don't generalize.
- Journal context reveals emotional patterns and recurring themes. Use these to make the strategy feel deeply personal.
- When witness events show a pattern (e.g., seeing the same theme repeatedly), acknowledge it as confirmation in the strategy.
- With linked readings: reference the specific cards and insight, connecting them to today's action. But ONLY if the reading's theme matches the intention domain.`;
    }

    return base + `

TIER 2 — PROFILE + TIMING:
- Use their Sun sign qualities to shape HOW the action should be approached.
- Use their Moon sign to acknowledge what emotional safety they might need.
- Use their Life Path to connect the action to their larger purpose.
- Use current transits (if provided) to explain timing.
- Use moon phase to frame the energy type (new moon = initiate, full moon = culminate, waning = release).

LUNAR ARC NARRATIVE (when arcPosition is provided):
You are generating actions for a COHERENT MULTI-DAY JOURNEY, not isolated daily tips.
The arc follows a dramatic structure tied to the lunar cycle:

  PLANT (Days 1-3):   Seed-setting. Clarity actions. Define, write, envision.
  NURTURE (Days 4-6): Building momentum. Research, small experiments, outreach.
  TEST (Days 7-9):    Challenge zone. Push comfort boundaries. Face the fear.
  EXPAND (Days 10-12): Growth actions. Build on momentum. Compound what's working.
  HARVEST (Days 13-15): Culmination. Synthesize, celebrate, prepare for next cycle.

IMPORTANT: Each day's action MUST build on the previous day's work. Reference what they wrote in their workspace and their coaching reports. Create a NARRATIVE THREAD — "Yesterday you [their actual action]. Today we build on that by..."
Do NOT generate random, disconnected actions. The user should feel each day is a chapter in a story.`;
}

// ── User Prompt Builder ──

function buildUserPrompt(ctx: ForgeContext): string {
    const parts: string[] = [];

    // 1. The intention (always primary)
    parts.push(`INTENTION: "${ctx.intention}"`);
    parts.push(`DOMAIN: ${ctx.domain}`);
    parts.push(`DAYS ACTIVE: ${ctx.daysActive}`);
    if (ctx.witnessCount !== undefined && ctx.witnessCount > 0) {
        parts.push(`SIGNS WITNESSED: ${ctx.witnessCount}`);
    }
    parts.push(`ACTIONS: ${ctx.actionsCompleted} completed of ${ctx.actionsTotal} total`);

    // 2. Profile data (always available)
    parts.push('');
    parts.push('── COSMIC PROFILE ──');
    parts.push(`Sun: ${ctx.sun}`);
    if (ctx.moon) parts.push(`Moon: ${ctx.moon}`);
    if (ctx.rising) parts.push(`Rising: ${ctx.rising}`);
    parts.push(`Life Path: ${ctx.lifePath}`);
    parts.push(`Personal Year: ${ctx.personalYear}`);

    // 3. Timing (always available)
    parts.push('');
    parts.push('── TODAY\'S ENERGY ──');
    parts.push(`Moon Phase: ${ctx.moonPhase}`);
    if (ctx.activeTransits) {
        parts.push(`Active Transits: ${ctx.activeTransits}`);
    }

    // 3b. Arc position (lunar journey)
    if (ctx.arcPosition) {
        parts.push('');
        parts.push('── LUNAR ARC POSITION ──');
        parts.push(`${ctx.arcPosition.arcLabel}`);
        parts.push(`Arc Phase: ${ctx.arcPosition.arcPhase.toUpperCase()}`);
        parts.push(`Arc started during: ${ctx.arcPosition.arcStartMoonPhase}`);
        parts.push(`Current moon: ${ctx.moonPhase}`);
        parts.push('IMPORTANT: This is a coherent journey. Today\'s action must advance the arc narrative. Reference their previous workspace text and build on it.');
    }

    // 4. Enrichment layers (optional)
    if (ctx.witnessContext) {
        parts.push('');
        parts.push('── WITNESS EVENTS ──');
        parts.push(ctx.witnessContext);
    }

    if (ctx.journalContext) {
        parts.push('');
        parts.push('── RECENT JOURNAL THEMES ──');
        parts.push(ctx.journalContext);
    }

    if (ctx.linkedReadings && ctx.linkedReadings.length > 0) {
        parts.push('');
        parts.push('── LINKED READINGS (user explicitly connected these) ──');
        for (const reading of ctx.linkedReadings.slice(0, 3)) {
            parts.push(`Question: "${reading.question}"`);
            parts.push(`Cards: ${reading.cards}`);
            parts.push(`Key insight: ${reading.keyInsight}`);
            parts.push('---');
        }
    }

    // 5. Avoid repeats
    if (ctx.completedActions && ctx.completedActions.length > 0) {
        parts.push('');
        parts.push('── RECENTLY COMPLETED (do NOT repeat) ──');
        for (const action of ctx.completedActions.slice(0, 5)) {
            parts.push(`✓ ${action}`);
        }
    }

    // 6. Workspace text from recent actions (for multi-day coaching arcs)
    if (ctx.recentWorkspace && ctx.recentWorkspace.length > 0) {
        parts.push('');
        parts.push('── WHAT THEY WROTE DURING RECENT ACTIONS (build on this) ──');
        for (const entry of ctx.recentWorkspace.slice(0, 3)) {
            parts.push(`Action: "${entry.action}"`);
            parts.push(`Their response: ${entry.text.slice(0, 300)}`);
            parts.push('---');
        }
        parts.push('Use their actual words and ideas to inform TODAY\'s action. Build on what they started — don\'t ignore it or start fresh.');
    }

    // 7. Real-world coaching reports (what happened when they left the app)
    if (ctx.coachingReports && ctx.coachingReports.length > 0) {
        parts.push('');
        parts.push('── REAL-WORLD ACTION REPORTS (what they did and what happened) ──');
        for (const report of ctx.coachingReports) {
            parts.push(`Action taken: "${report.action}"`);
            parts.push(`Their report: ${report.report.slice(0, 400)}`);
            parts.push('---');
        }
        parts.push('Build on their real-world momentum. Reference what they actually DID and the results they reported. This is the most valuable signal — capitalize on it.');
    }

    parts.push('');
    parts.push('Generate a rich daily strategy session for this intention. Respond with ONLY the JSON object.');

    return parts.join('\n');
}

// ── Public API ──

export interface ForgePrompt {
    system: string;
    user: string;
    tier: DataTier;
}

/**
 * Build the Forge prompt for a given manifestation context.
 * Returns { system, user, tier } ready for AI service consumption.
 */
export function buildForgeActionPrompt(ctx: ForgeContext): ForgePrompt {
    const tier = detectTier(ctx);
    return {
        system: buildSystemPrompt(tier),
        user: buildUserPrompt(ctx),
        tier,
    };
}

/**
 * Parse the Forge response JSON.
 * Returns null if parsing fails (caller should handle gracefully).
 */
export interface ForgeResponse {
    action: string;
    strategy: string;
    cosmicContext: string;
    dataSources: string[];
    timing: string;
    nextStep: string;
    encouragement: string;
    /** @deprecated Kept for backward compatibility — use strategy instead */
    cosmicJustification?: string;
}

export function parseForgeResponse(raw: string): ForgeResponse | null {
    try {
        // Strip any markdown wrapping (```json ... ```)
        let cleaned = raw.trim();
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '');
        }
        const parsed = JSON.parse(cleaned);

        // Validate required fields
        if (!parsed.action) return null;

        return {
            action: parsed.action,
            strategy: parsed.strategy || parsed.cosmicJustification || '',
            cosmicContext: parsed.cosmicContext || '',
            dataSources: Array.isArray(parsed.dataSources) ? parsed.dataSources : [],
            timing: parsed.timing || '',
            nextStep: parsed.nextStep || '',
            encouragement: parsed.encouragement || '',
            // Backward compat — old responses may have cosmicJustification
            cosmicJustification: parsed.cosmicJustification,
        };
    } catch {
        return null;
    }
}
