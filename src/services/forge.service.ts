/**
 * Forge Service — Daily Cosmic Action Engine.
 *
 * Orchestrates the Forge prompt with user data, manages caching,
 * and provides the daily action for each active manifestation.
 *
 * CACHING STRATEGY:
 * - Daily cache per manifestation: one AI call per intention per day
 * - 3-trigger invalidation:
 *   1. New day (automatic — dailyCache handles this)
 *   2. New witness event linked to this manifestation
 *   3. New reading linked to this manifestation
 *
 * The Forge works fully without tarot.
 * Minimum data: intention + Sun sign + Life Path + moon phase.
 */

import { safeStorage } from './storage.service';
import { AIService, dailyCache } from './ai.service';
import {
    getActiveManifestations,
    getManifestationProgress,
    getRecentCompletedActionsWithWorkspace,
    getRecentCoachingReports,
    type ManifestationEntry,
} from './manifestation.service';
import {
    getBirthData,
    getNatalTriad,
    getLifePathNumber,
    getCurrentPersonalYear,
    getSunSign,
} from './astrology.service';
import { getTransitFeed, formatTransitShort } from './transit.service';
import { getWitnessContextForAI, getWitnessEventsForManifestation } from './witness.service';
import {
    buildForgeActionPrompt,
    parseForgeResponse,
    type ForgeContext,
    type ForgeResponse,
    type LinkedReadingContext,
    type ArcPosition,
} from '../prompts/manifest/forge-action';
import {
    buildForgeFollowUpPrompt,
    parseFollowUpResponse,
    type ForgeFollowUpResponse,
} from '../prompts/manifest/forge-followup';

// ── Forge Cache ──

const FORGE_CACHE_PREFIX = 'forge_';
const FORGE_INVALIDATION_KEY = 'forge_invalidation';

interface ForgeCacheEntry {
    date: string;        // YYYY-MM-DD
    response: ForgeResponse;
    witnessCount: number; // witness event count at time of generation
    readingCount: number; // linked reading count at time of generation
}

function getCacheKey(manifestationId: string): string {
    return `${FORGE_CACHE_PREFIX}${manifestationId}`;
}

function getCachedForge(manifestationId: string, currentWitnessCount: number, currentReadingCount: number): ForgeResponse | null {
    const today = new Date().toISOString().slice(0, 10);
    try {
        const raw = safeStorage.getItem(getCacheKey(manifestationId));
        if (!raw) return null;
        const entry: ForgeCacheEntry = JSON.parse(raw);

        // Invalidation trigger 1: new day
        if (entry.date !== today) return null;

        // Invalidation trigger 2: new witness event
        if (entry.witnessCount !== currentWitnessCount) return null;

        // Invalidation trigger 3: new linked reading
        if (entry.readingCount !== currentReadingCount) return null;

        return entry.response;
    } catch { return null; }
}

function setCachedForge(
    manifestationId: string,
    response: ForgeResponse,
    witnessCount: number,
    readingCount: number,
): void {
    const today = new Date().toISOString().slice(0, 10);
    const entry: ForgeCacheEntry = {
        date: today,
        response,
        witnessCount,
        readingCount,
    };
    safeStorage.setItem(getCacheKey(manifestationId), JSON.stringify(entry));
}

/**
 * Manually invalidate the Forge cache for a manifestation.
 * Call this when a new witness event or reading is linked.
 */
export function invalidateForgeCache(manifestationId: string): void {
    safeStorage.removeItem(getCacheKey(manifestationId));
}

// ── Moon Phase (from TransitFeed component logic, centralized here) ──

function getCurrentMoonPhase(): string {
    const now = new Date();
    const synodicMonth = 29.53058867;
    // Known new moon: Jan 6, 2000 18:14 UTC
    const knownNewMoon = new Date('2000-01-06T18:14:00Z');
    const daysSince = (now.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
    const phase = ((daysSince % synodicMonth) + synodicMonth) % synodicMonth;
    const normalized = phase / synodicMonth;

    if (normalized < 0.0625) return 'New Moon';
    if (normalized < 0.1875) return 'Waxing Crescent';
    if (normalized < 0.3125) return 'First Quarter';
    if (normalized < 0.4375) return 'Waxing Gibbous';
    if (normalized < 0.5625) return 'Full Moon';
    if (normalized < 0.6875) return 'Waning Gibbous';
    if (normalized < 0.8125) return 'Last Quarter';
    if (normalized < 0.9375) return 'Waning Crescent';
    return 'New Moon';
}

/**
 * Compute the lunar arc position for a manifestation.
 * Uses the synodic month (~29.53 days) to create ~14-15 day arcs
 * between key lunar phases (New Moon → Full Moon, Full Moon → New Moon).
 */
function computeArcPosition(intentionCreatedDate: string): ArcPosition {
    const synodicMonth = 29.53058867;
    const halfCycle = synodicMonth / 2; // ~14.77 days per arc
    const knownNewMoon = new Date('2000-01-06T18:14:00Z');
    const now = new Date();

    // Calculate current position in the lunar cycle (0 to ~29.53)
    const daysSinceKnownNewMoon = (now.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
    const currentPhaseDay = ((daysSinceKnownNewMoon % synodicMonth) + synodicMonth) % synodicMonth;

    // Determine which half-cycle we're in and compute arc day
    const inFirstHalf = currentPhaseDay < halfCycle; // New Moon → Full Moon
    const dayInHalf = inFirstHalf ? currentPhaseDay : currentPhaseDay - halfCycle;
    const totalDays = Math.round(halfCycle); // 15 days
    const dayInArc = Math.min(Math.floor(dayInHalf) + 1, totalDays); // 1-based

    // Determine arc narrative phase (5 phases across the arc)
    const progress = dayInArc / totalDays;
    let arcPhase: ArcPosition['arcPhase'];
    if (progress <= 0.2) arcPhase = 'plant';
    else if (progress <= 0.4) arcPhase = 'nurture';
    else if (progress <= 0.6) arcPhase = 'test';
    else if (progress <= 0.8) arcPhase = 'expand';
    else arcPhase = 'harvest';

    const arcStartMoonPhase = inFirstHalf ? 'New Moon' : 'Full Moon';
    const phaseLabels: Record<ArcPosition['arcPhase'], string> = {
        plant: 'Plant',
        nurture: 'Nurture',
        test: 'Test',
        expand: 'Expand',
        harvest: 'Harvest',
    };
    const arcLabel = `Day ${dayInArc} of ${totalDays} — ${phaseLabels[arcPhase]} Phase`;

    return { dayInArc, totalDays, arcPhase, arcStartMoonPhase, arcLabel };
}

// ── Transit Context Builder ──

function buildTransitContext(): string | null {
    try {
        const feed = getTransitFeed();
        if (!feed.hasBirthData || feed.active.length === 0) return null;

        // Take top 3 most significant active transits
        const top = feed.active.slice(0, 3);
        return top.map(hit => {
            const desc = formatTransitShort(hit);
            const nature = hit.aspect.nature === 'harmonious' ? '✨' :
                hit.aspect.nature === 'challenging' ? '🔥' : '⚡';
            return `${nature} ${desc} (${hit.isExactToday ? 'EXACT TODAY' : `orb ${hit.orb}°`})`;
        }).join('\n');
    } catch { return null; }
}

// ── Linked Readings Context Builder ──

function buildLinkedReadingsContext(manifestation: ManifestationEntry): LinkedReadingContext[] {
    if (!manifestation.linkedReadingIds || manifestation.linkedReadingIds.length === 0) return [];

    try {
        // Retrieve reading data from localStorage
        const raw = safeStorage.getItem('tarot_readings');
        if (!raw) return [];

        const readings = JSON.parse(raw) as Array<{
            id: string;
            question?: string;
            theme: string;
            cards?: Array<{ name: string }>;
            aiInterpretation?: string;
        }>;

        const linked: LinkedReadingContext[] = [];
        for (const readingId of manifestation.linkedReadingIds.slice(0, 3)) {
            const reading = readings.find(r => r.id === readingId);
            if (reading) {
                linked.push({
                    question: reading.question || 'No question recorded',
                    theme: reading.theme || 'general',
                    cards: reading.cards?.map(c => c.name).join(', ') || 'Unknown cards',
                    keyInsight: reading.aiInterpretation
                        ? reading.aiInterpretation.slice(0, 150) + '...'
                        : 'No AI interpretation available',
                });
            }
        }
        return linked;
    } catch { return []; }
}

// ── Completed Actions Getter ──

function getRecentCompletedActions(manifestation: ManifestationEntry): string[] {
    return manifestation.actions
        .filter(a => !!a.completedDate)
        .sort((a, b) => (b.completedDate || '').localeCompare(a.completedDate || ''))
        .slice(0, 5)
        .map(a => a.description);
}

/**
 * Get recent workspace text for multi-day arc context.
 */
function getRecentWorkspaceContext(manifestation: ManifestationEntry): Array<{ action: string; text: string }> {
    return manifestation.actions
        .filter(a => !!a.completedDate && !!a.workspaceText && a.workspaceText.trim().length > 0)
        .sort((a, b) => (b.completedDate || '').localeCompare(a.completedDate || ''))
        .slice(0, 3)
        .map(a => ({ action: a.description, text: a.workspaceText! }));
}

// ── Public API ──

export interface ForgeResult {
    response: ForgeResponse;
    tier: 'tier2' | 'tier3';
    fromCache: boolean;
}

/**
 * Get the daily Forge action for a manifestation.
 * Returns cached response if valid, otherwise calls AI.
 */
export async function getDailyForge(manifestationId: string): Promise<ForgeResult | null> {
    // Get manifestation data
    const manifestation = getActiveManifestations().find(m => m.id === manifestationId);
    if (!manifestation) return null;

    const progress = getManifestationProgress(manifestationId);
    if (!progress) return null;

    // Get current witness + reading counts for cache invalidation
    const witnessEvents = getWitnessEventsForManifestation(manifestationId);
    const currentWitnessCount = witnessEvents.length;
    const currentReadingCount = manifestation.linkedReadingIds.length;

    // Check cache first
    const cached = getCachedForge(manifestationId, currentWitnessCount, currentReadingCount);
    if (cached) {
        const witnessCtx = getWitnessContextForAI(manifestationId);
        const linkedReadings = buildLinkedReadingsContext(manifestation);
        const tier = (witnessCtx || linkedReadings.length > 0) ? 'tier3' as const : 'tier2' as const;
        return { response: cached, tier, fromCache: true };
    }

    // Build context
    const birthData = getBirthData();
    if (!birthData?.birthday) return null;

    // Profile data (always available after onboarding)
    const sunSign = getSunSign(birthData.birthday);
    let moon: string | undefined;
    let rising: string | undefined;

    try {
        const triad = getNatalTriad(birthData);
        moon = triad.moon.name;
        rising = triad.rising.name;
    } catch { /* only Sun sign available */ }

    const lifePath = getLifePathNumber(birthData.birthday);
    const personalYear = getCurrentPersonalYear(birthData.birthday);

    // Timing data
    const moonPhase = getCurrentMoonPhase();
    const activeTransits = buildTransitContext() || undefined;

    // Enrichment layers
    const witnessContext = getWitnessContextForAI(manifestationId) || undefined;
    const linkedReadings = buildLinkedReadingsContext(manifestation);

    // Build forge context
    const recentWorkspace = getRecentWorkspaceContext(manifestation);
    const coachingReports = getRecentCoachingReports(manifestationId);
    const arcPosition = computeArcPosition(manifestation.createdDate);
    const forgeCtx: ForgeContext = {
        intention: manifestation.declaration,
        domain: manifestation.domain || 'general',
        daysActive: progress.daysActive,
        sun: sunSign.name,
        moon,
        rising,
        lifePath,
        personalYear,
        moonPhase,
        activeTransits,
        arcPosition,
        witnessContext,
        witnessCount: currentWitnessCount,
        linkedReadings: linkedReadings.length > 0 ? linkedReadings : undefined,
        completedActions: getRecentCompletedActions(manifestation),
        recentWorkspace: recentWorkspace.length > 0 ? recentWorkspace : undefined,
        coachingReports: coachingReports.length > 0 ? coachingReports : undefined,
        actionsTotal: progress.actionsTotal,
        actionsCompleted: progress.actionsCompleted,
    };

    // Build prompt and call AI
    const { system, user, tier } = buildForgeActionPrompt(forgeCtx);

    try {
        const ai = new AIService();
        const raw = await ai.chat(system, user, 600);
        const response = parseForgeResponse(raw);

        if (!response) {
            // Fallback: return a structured response from the raw text
            return {
                response: {
                    action: 'Take one small step toward your intention today.',
                    strategy: raw.slice(0, 200),
                    cosmicContext: '',
                    dataSources: [sunSign.name, `Life Path ${lifePath}`, moonPhase],
                    timing: moonPhase + ' energy is present.',
                    nextStep: '',
                    encouragement: 'You are on your path.',
                },
                tier,
                fromCache: false,
            };
        }

        // Cache the successful response
        setCachedForge(manifestationId, response, currentWitnessCount, currentReadingCount);

        return { response, tier, fromCache: false };
    } catch (error) {
        // Return null on API failure — UI should handle gracefully
        if (import.meta.env.DEV) console.warn('[Forge] AI call failed:', error);
        return null;
    }
}

/**
 * Get Forge actions for ALL active manifestations.
 * Returns a map of manifestationId → ForgeResult.
 */
export async function getAllDailyForges(): Promise<Map<string, ForgeResult>> {
    const results = new Map<string, ForgeResult>();
    const active = getActiveManifestations();

    // Run sequentially to avoid hammering the API
    for (const m of active) {
        try {
            const result = await getDailyForge(m.id);
            if (result) results.set(m.id, result);
        } catch {
            // Skip failed forges, don't block others
        }
    }

    return results;
}

/**
 * Check if the Forge has a cached response for a manifestation.
 * Useful for UI to show loading state vs cached state.
 */
export function hasForgeCache(manifestationId: string): boolean {
    const manifestation = getActiveManifestations().find(m => m.id === manifestationId);
    if (!manifestation) return false;

    const witnessEvents = getWitnessEventsForManifestation(manifestationId);
    const cached = getCachedForge(
        manifestationId,
        witnessEvents.length,
        manifestation.linkedReadingIds.length,
    );
    return cached !== null;
}

/**
 * Get AI follow-up coaching response after the user completes a workspace action.
 * Returns structured { acknowledgment, realWorldAction } or null on failure.
 */
export async function getForgeFollowUp(
    manifestationId: string,
    action: string,
    workspaceText: string,
): Promise<ForgeFollowUpResponse | null> {
    const manifestation = getActiveManifestations().find(m => m.id === manifestationId);
    if (!manifestation) return null;

    // Get chart context for personalization
    const birthData = getBirthData();
    let sun: string | undefined;
    let lifePath: number | undefined;

    if (birthData?.birthday) {
        sun = getSunSign(birthData.birthday).name;
        lifePath = getLifePathNumber(birthData.birthday);
    }

    const { system, user } = buildForgeFollowUpPrompt({
        intention: manifestation.declaration,
        action,
        workspaceText,
        sun,
        lifePath,
    });

    try {
        const ai = new AIService();
        const raw = await ai.chat(system, user, 300);
        if (!raw) return null;
        return parseFollowUpResponse(raw);
    } catch (error) {
        if (import.meta.env.DEV) console.warn('[Forge] Follow-up AI call failed:', error);
        return null;
    }
}
