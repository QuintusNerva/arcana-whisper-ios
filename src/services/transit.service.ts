/**
 * Transit Detection Engine — "Cosmic Weather for YOU"
 * ────────────────────────────────────────────────────
 * Compares current planetary positions against the user's natal chart
 * to detect active transits (planet-to-natal aspects).
 *
 * - Detects all 5 major aspects (conjunction, sextile, square, trine, opposition)
 * - Scores significance by transit planet weight
 * - Determines applying vs separating (is it getting tighter or pulling away?)
 * - Deduplicates so the same transit isn't re-alerted within its window
 * - Provides 7-day lookahead scanning
 */

import { calculateEphemeris, PlanetPosition, longitudeToSignId, longitudeToDegreeInSign } from './ephemeris';
import { getBirthData, getFullChart, BirthData } from './astrology.service';

// ══════════════════════════════════════
// TYPES
// ══════════════════════════════════════

export interface TransitHit {
    /** The transiting planet (where it is NOW) */
    transitPlanet: {
        id: string;
        name: string;
        glyph: string;
        longitude: number;
        signId: string;
        degreeInSign: number;
    };
    /** The natal planet it's hitting */
    natalPlanet: {
        id: string;
        name: string;
        glyph: string;
        longitude: number;
        signId: string;
        degreeInSign: number;
    };
    /** Aspect details */
    aspect: {
        name: string;
        symbol: string;
        angle: number;
        nature: 'harmonious' | 'challenging' | 'neutral';
    };
    /** Orb — how many degrees from exact */
    orb: number;
    /** Is the transit getting tighter (more potent) or pulling away? */
    isApplying: boolean;
    /** When the transit goes exact (estimated) */
    peakDate: string;
    /** Significance level */
    significance: 'major' | 'moderate' | 'minor';
    /** Is this transit exact today (orb < 1°)? */
    isExactToday: boolean;
    /** Category for feed grouping */
    category: 'active' | 'coming' | 'passed';
}

// ══════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════

/** Significance weights by transiting planet */
const PLANET_WEIGHT: Record<string, { weight: number; significance: TransitHit['significance'] }> = {
    pluto: { weight: 10, significance: 'major' },
    neptune: { weight: 10, significance: 'major' },
    uranus: { weight: 10, significance: 'major' },
    saturn: { weight: 9, significance: 'major' },
    jupiter: { weight: 8, significance: 'moderate' },
    mars: { weight: 7, significance: 'moderate' },
    sun: { weight: 5, significance: 'minor' },
    venus: { weight: 5, significance: 'minor' },
    mercury: { weight: 3, significance: 'minor' },
    // moon skipped in V1
};

/** Aspect definitions with tighter orbs for transit alerts */
const TRANSIT_ASPECTS = [
    { name: 'Conjunction', symbol: '☌', angle: 0, orb: 6, nature: 'neutral' as const },
    { name: 'Sextile', symbol: '⚹', angle: 60, orb: 3, nature: 'harmonious' as const },
    { name: 'Square', symbol: '□', angle: 90, orb: 5, nature: 'challenging' as const },
    { name: 'Trine', symbol: '△', angle: 120, orb: 5, nature: 'harmonious' as const },
    { name: 'Opposition', symbol: '☍', angle: 180, orb: 6, nature: 'challenging' as const },
];

/** Planets to skip as transit sources (Moon is too fast for V1) */
const SKIP_TRANSIT_PLANETS = new Set(['moon']);

// ══════════════════════════════════════
// CORE ENGINE
// ══════════════════════════════════════

function norm360(deg: number): number {
    deg = deg % 360;
    return deg < 0 ? deg + 360 : deg;
}

function getOrbBetween(lon1: number, lon2: number, targetAngle: number): number {
    let diff = Math.abs(lon1 - lon2);
    if (diff > 180) diff = 360 - diff;
    return Math.abs(diff - targetAngle);
}

/**
 * Get planetary positions for a given date.
 */
function getSkyForDate(date: Date): PlanetPosition[] {
    const result = calculateEphemeris({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: 12,
        minute: 0,
        utcOffset: 0,
    });
    return result.planets;
}

/**
 * Detect transits between current sky and natal chart.
 */
function detectTransits(
    currentSky: PlanetPosition[],
    tomorrowSky: PlanetPosition[],
    natalPlanets: PlanetPosition[],
    category: TransitHit['category'] = 'active',
    dateLabel?: string,
): TransitHit[] {
    const hits: TransitHit[] = [];

    for (const transit of currentSky) {
        // Skip Moon as transit source
        if (SKIP_TRANSIT_PLANETS.has(transit.id)) continue;

        for (const natal of natalPlanets) {
            // Don't transit a planet against itself (Sun transit Sun = meh)
            // Actually — we DO want this for "returns" (Saturn return, Venus return, etc.)
            // But skip same-planet for inner planets as they're too frequent
            if (transit.id === natal.id && ['sun', 'mercury', 'venus'].includes(transit.id)) continue;

            // Check each aspect type
            for (const aspectDef of TRANSIT_ASPECTS) {
                const orb = getOrbBetween(transit.longitude, natal.longitude, aspectDef.angle);

                if (orb <= aspectDef.orb) {
                    // Determine applying vs separating
                    const tomorrowTransit = tomorrowSky.find(p => p.id === transit.id);
                    let isApplying = false;
                    if (tomorrowTransit) {
                        const tomorrowOrb = getOrbBetween(tomorrowTransit.longitude, natal.longitude, aspectDef.angle);
                        isApplying = tomorrowOrb < orb;
                    }

                    // Estimate peak date
                    const peakDate = dateLabel || new Date().toISOString().slice(0, 10);

                    const planetInfo = PLANET_WEIGHT[transit.id] || { weight: 3, significance: 'minor' as const };

                    hits.push({
                        transitPlanet: {
                            id: transit.id,
                            name: transit.name,
                            glyph: transit.glyph,
                            longitude: transit.longitude,
                            signId: transit.signId,
                            degreeInSign: transit.degreeInSign,
                        },
                        natalPlanet: {
                            id: natal.id,
                            name: natal.name,
                            glyph: natal.glyph,
                            longitude: natal.longitude,
                            signId: natal.signId,
                            degreeInSign: natal.degreeInSign,
                        },
                        aspect: {
                            name: aspectDef.name,
                            symbol: aspectDef.symbol,
                            angle: aspectDef.angle,
                            nature: aspectDef.nature,
                        },
                        orb: Math.round(orb * 10) / 10,
                        isApplying,
                        peakDate,
                        significance: planetInfo.significance,
                        isExactToday: orb < 1,
                        category,
                    });

                    break; // Only match closest aspect per planet pair
                }
            }
        }
    }

    // Sort: exact first, then by planet weight (outer planets more significant)
    return hits.sort((a, b) => {
        // Exact today always first
        if (a.isExactToday && !b.isExactToday) return -1;
        if (!a.isExactToday && b.isExactToday) return 1;

        // Then by significance
        const sigOrder = { major: 0, moderate: 1, minor: 2 };
        const sigDiff = sigOrder[a.significance] - sigOrder[b.significance];
        if (sigDiff !== 0) return sigDiff;

        // Then by tightest orb
        return a.orb - b.orb;
    });
}

// ══════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════

export interface TransitFeedData {
    /** Transits active right now (within orb today) */
    active: TransitHit[];
    /** Transits coming in the next 7 days */
    coming: TransitHit[];
    /** Transits that were active in the past 3 days */
    passed: TransitHit[];
    /** Whether birth data exists */
    hasBirthData: boolean;
    /** Most significant transit for notification */
    topAlert: TransitHit | null;
}

/**
 * Get the full transit feed — active, coming, and recently passed transits.
 */
export function getTransitFeed(): TransitFeedData {
    const birthData = getBirthData();
    if (!birthData) {
        return { active: [], coming: [], passed: [], hasBirthData: false, topAlert: null };
    }

    const chart = getFullChart(birthData);
    if (!chart) {
        return { active: [], coming: [], passed: [], hasBirthData: false, topAlert: null };
    }

    const natalPlanets = chart.planets;
    const today = new Date();

    // Today's sky + tomorrow for applying/separating
    const todaySky = getSkyForDate(today);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowSky = getSkyForDate(tomorrow);

    // Active transits (today)
    const active = detectTransits(todaySky, tomorrowSky, natalPlanets, 'active');

    // Coming transits (next 7 days)
    const coming: TransitHit[] = [];
    const seenComingKeys = new Set(active.map(h => `${h.transitPlanet.id}-${h.natalPlanet.id}-${h.aspect.name}`));

    for (let d = 2; d <= 7; d++) {
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + d);
        const futureDateNext = new Date(futureDate);
        futureDateNext.setDate(futureDateNext.getDate() + 1);

        const futureSky = getSkyForDate(futureDate);
        const futureNextSky = getSkyForDate(futureDateNext);
        const dateLabel = futureDate.toISOString().slice(0, 10);

        const futureHits = detectTransits(futureSky, futureNextSky, natalPlanets, 'coming', dateLabel);
        for (const hit of futureHits) {
            const key = `${hit.transitPlanet.id}-${hit.natalPlanet.id}-${hit.aspect.name}`;
            if (!seenComingKeys.has(key)) {
                seenComingKeys.add(key);
                coming.push(hit);
            }
        }
    }

    // Recently passed transits (past 3 days)
    const passed: TransitHit[] = [];
    const seenPassedKeys = new Set(active.map(h => `${h.transitPlanet.id}-${h.natalPlanet.id}-${h.aspect.name}`));

    for (let d = 1; d <= 3; d++) {
        const pastDate = new Date(today);
        pastDate.setDate(pastDate.getDate() - d);
        const pastDateNext = new Date(pastDate);
        pastDateNext.setDate(pastDateNext.getDate() + 1);

        const pastSky = getSkyForDate(pastDate);
        const pastNextSky = getSkyForDate(pastDateNext);
        const dateLabel = pastDate.toISOString().slice(0, 10);

        const pastHits = detectTransits(pastSky, pastNextSky, natalPlanets, 'passed', dateLabel);
        for (const hit of pastHits) {
            const key = `${hit.transitPlanet.id}-${hit.natalPlanet.id}-${hit.aspect.name}`;
            if (!seenPassedKeys.has(key)) {
                seenPassedKeys.add(key);
                passed.push(hit);
            }
        }
    }

    // Top alert: most significant active transit (for notifications)
    const topAlert = active.length > 0 ? active[0] : null;

    return { active, coming, passed, hasBirthData: true, topAlert };
}

// ══════════════════════════════════════
// NOTIFICATION
// ══════════════════════════════════════

const TRANSIT_NOTIFIED_KEY = 'arcana_transit_notified';

/**
 * Check if we've already notified for this transit today.
 */
function hasNotifiedTransit(transitKey: string): boolean {
    try {
        const raw = localStorage.getItem(TRANSIT_NOTIFIED_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);
        const today = new Date().toISOString().slice(0, 10);
        return data.date === today && data.keys?.includes(transitKey);
    } catch {
        return false;
    }
}

/**
 * Mark a transit as notified today.
 */
function markTransitNotified(transitKey: string): void {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const raw = localStorage.getItem(TRANSIT_NOTIFIED_KEY);
        let data = raw ? JSON.parse(raw) : { date: today, keys: [] };
        if (data.date !== today) data = { date: today, keys: [] };
        if (!data.keys.includes(transitKey)) data.keys.push(transitKey);
        localStorage.setItem(TRANSIT_NOTIFIED_KEY, JSON.stringify(data));
    } catch { /* */ }
}

/**
 * Fire a browser notification for the top transit alert.
 * Returns the transit that was notified, or null if none.
 */
export function fireTransitNotification(): TransitHit | null {
    const feed = getTransitFeed();
    if (!feed.topAlert) return null;

    const hit = feed.topAlert;
    const key = `${hit.transitPlanet.id}-${hit.natalPlanet.id}-${hit.aspect.name}`;

    if (hasNotifiedTransit(key)) return null;

    // Fire browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
        const title = `${hit.transitPlanet.glyph} ${hit.transitPlanet.name} ${hit.aspect.symbol} your ${hit.natalPlanet.glyph} ${hit.natalPlanet.name}`;
        const orbText = hit.isExactToday ? '⚡ EXACT TODAY' : `Orb: ${hit.orb}°`;
        const natureText = hit.aspect.nature === 'harmonious' ? '✨ Harmonious' : hit.aspect.nature === 'challenging' ? '🔥 Challenging' : '⚡ Powerful';

        new Notification('Cosmic Weather', {
            body: `${title}\n${orbText} · ${natureText}`,
            icon: '/icon.png',
            badge: '/icon.png',
            tag: 'transit-alert',
        });
    }

    markTransitNotified(key);
    return hit;
}

/**
 * Format a transit hit into a human-readable short description.
 */
export function formatTransitShort(hit: TransitHit): string {
    return `${hit.transitPlanet.glyph} ${hit.transitPlanet.name} ${hit.aspect.symbol} your ${hit.natalPlanet.glyph} ${hit.natalPlanet.name}`;
}

/**
 * Format the transit details (sign, degree).
 */
export function formatTransitDetail(hit: TransitHit): string {
    const tSign = hit.transitPlanet.signId.charAt(0).toUpperCase() + hit.transitPlanet.signId.slice(1);
    return `${hit.transitPlanet.name} in ${tSign} ${hit.transitPlanet.degreeInSign}°`;
}
