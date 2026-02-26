/**
 * Year Ahead Service — Annual Blueprint Engine
 *
 * Generates a comprehensive yearly forecast:
 *  - Solar return date (when the Sun returns to natal degree)
 *  - Major transits from outer planets (Saturn, Jupiter, Pluto, Uranus, Neptune)
 *  - Eclipse detection and natal chart impact
 *  - Month-by-month transit snapshots
 *  - Key dates (exact transit hits)
 *  - Numerology personal year integration
 *
 * Uses existing ephemeris.ts + transit.service.ts infrastructure.
 */

import {
    SearchLunarEclipse,
    NextLunarEclipse,
    SearchGlobalSolarEclipse,
    NextGlobalSolarEclipse,
    SunPosition,
    MakeTime,
    Body,
    GeoVector,
    Ecliptic as AstroEcliptic,
} from 'astronomy-engine';

import { PlanetPosition, calculateEphemeris, longitudeToSignId, longitudeToDegreeInSign } from './ephemeris';
import { getBirthData, getFullChart, getPersonalYearNumber, getLifePathNumber, BirthData, FullChartData } from './astrology.service';

// ══════════════════════════════════════
// TYPES
// ══════════════════════════════════════

export interface YearTransit {
    transitPlanet: string;      // e.g. "Saturn"
    transitGlyph: string;
    transitSign: string;        // e.g. "pisces"
    natalPlanet: string;        // e.g. "Moon"
    natalGlyph: string;
    natalSign: string;
    aspectName: string;         // e.g. "Conjunction"
    aspectSymbol: string;
    nature: 'harmonious' | 'challenging' | 'neutral';
    significance: 'major' | 'moderate' | 'minor';
    peakMonth: string;          // e.g. "March 2026"
    orb: number;
}

export interface EclipseHit {
    type: 'lunar' | 'solar';
    kind: string;               // penumbral, partial, annular, total
    date: string;               // ISO date
    formattedDate: string;      // e.g. "March 14, 2026"
    signId: string;             // Zodiac sign the eclipse falls in
    signDegree: number;
    natalAspects: {             // natal planets this eclipse aspects
        planet: string;
        glyph: string;
        aspect: string;
        orb: number;
    }[];
}

export interface MonthSnapshot {
    month: string;              // e.g. "January"
    monthIndex: number;         // 0-11
    year: number;
    dominantTransits: {
        transit: string;
        natal: string;
        aspect: string;
        nature: 'harmonious' | 'challenging' | 'neutral';
    }[];
    eclipseThisMonth: boolean;
}

export interface KeyDate {
    date: string;               // ISO date
    formattedDate: string;
    description: string;        // e.g. "Saturn ☌ conjunct your Moon"
    nature: 'harmonious' | 'challenging' | 'neutral';
    significance: 'major' | 'moderate';
}

export interface YearAheadReport {
    solarYear: { start: string; end: string; startFormatted: string };
    personalYear: number;
    lifePathNumber: number;
    majorTransits: YearTransit[];
    eclipses: EclipseHit[];
    months: MonthSnapshot[];
    keyDates: KeyDate[];
    generatedAt: string;
    year: number;
}

// ══════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════

const SIGN_NAMES = [
    'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
    'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

/** Outer planets that produce significant year-long transits */
const OUTER_PLANETS = new Set(['jupiter', 'saturn', 'uranus', 'neptune', 'pluto']);

/** All transit planets (includes Mars for moderate transits) */
const TRANSIT_PLANETS = new Set(['mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']);

const PLANET_GLYPHS: Record<string, string> = {
    sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂',
    jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇',
};

const ASPECT_DEFS = [
    { name: 'Conjunction', symbol: '☌', angle: 0, orb: 8, nature: 'neutral' as const },
    { name: 'Sextile', symbol: '⚹', angle: 60, orb: 4, nature: 'harmonious' as const },
    { name: 'Square', symbol: '□', angle: 90, orb: 6, nature: 'challenging' as const },
    { name: 'Trine', symbol: '△', angle: 120, orb: 6, nature: 'harmonious' as const },
    { name: 'Opposition', symbol: '☍', angle: 180, orb: 7, nature: 'challenging' as const },
];

const PLANET_SIGNIFICANCE: Record<string, 'major' | 'moderate' | 'minor'> = {
    pluto: 'major', neptune: 'major', uranus: 'major',
    saturn: 'major', jupiter: 'moderate', mars: 'minor',
};

// ══════════════════════════════════════
// HELPERS
// ══════════════════════════════════════

function norm360(deg: number): number {
    return ((deg % 360) + 360) % 360;
}

function getOrbBetween(lon1: number, lon2: number, targetAngle: number): number {
    const diff = norm360(lon1 - lon2);
    return Math.min(Math.abs(diff - targetAngle), Math.abs(360 - diff - targetAngle));
}

function getSkyForDate(date: Date): PlanetPosition[] {
    const result = calculateEphemeris({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: 12, minute: 0, utcOffset: 0,
    });
    return result.planets;
}

function getSunLongitude(date: Date): number {
    const sky = getSkyForDate(date);
    const sun = sky.find(p => p.id === 'sun');
    return sun ? sun.longitude : 0;
}

function formatDate(d: Date): string {
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function toISO(d: Date): string {
    return d.toISOString().slice(0, 10);
}

// ══════════════════════════════════════
// SOLAR RETURN
// ══════════════════════════════════════

/**
 * Find the date when the Sun returns to the user's natal Sun degree.
 * Uses binary search over the year for precision.
 */
function findSolarReturn(natalSunLongitude: number, year: number): Date {
    // Start searching from Jan 1 of the given year
    let lo = new Date(Date.UTC(year, 0, 1));
    let hi = new Date(Date.UTC(year, 11, 31));

    // Find the approximate date by scanning day by day
    let bestDate = lo;
    let bestDiff = 999;

    for (let d = new Date(lo); d <= hi; d.setDate(d.getDate() + 1)) {
        const sunLon = getSunLongitude(d);
        const diff = Math.abs(norm360(sunLon - natalSunLongitude));
        const actualDiff = Math.min(diff, 360 - diff);
        if (actualDiff < bestDiff) {
            bestDiff = actualDiff;
            bestDate = new Date(d);
        }
    }

    return bestDate;
}

// ══════════════════════════════════════
// YEARLY TRANSIT SCAN
// ══════════════════════════════════════

/**
 * Scan transits from outer planets to natal chart over the year.
 * Samples every 15 days for a good picture of year-long transits.
 */
function scanYearTransits(
    natalPlanets: PlanetPosition[],
    startDate: Date,
    endDate: Date,
): YearTransit[] {
    const transitMap = new Map<string, YearTransit>();

    const current = new Date(startDate);
    while (current <= endDate) {
        const sky = getSkyForDate(current);

        for (const transitP of sky) {
            if (!TRANSIT_PLANETS.has(transitP.id)) continue;

            for (const natalP of natalPlanets) {
                // Skip same inner planet transiting itself
                if (transitP.id === natalP.id && ['sun', 'mercury', 'venus'].includes(transitP.id)) continue;

                for (const aspect of ASPECT_DEFS) {
                    const orb = getOrbBetween(transitP.longitude, natalP.longitude, aspect.angle);
                    const maxOrb = OUTER_PLANETS.has(transitP.id) ? aspect.orb : aspect.orb - 1;

                    if (orb <= maxOrb) {
                        const key = `${transitP.id}-${natalP.id}-${aspect.name}`;
                        const existing = transitMap.get(key);

                        // Keep the tightest orb for this transit
                        if (!existing || orb < existing.orb) {
                            transitMap.set(key, {
                                transitPlanet: transitP.name,
                                transitGlyph: transitP.glyph,
                                transitSign: transitP.signId,
                                natalPlanet: natalP.name,
                                natalGlyph: natalP.glyph,
                                natalSign: natalP.signId,
                                aspectName: aspect.name,
                                aspectSymbol: aspect.symbol,
                                nature: aspect.nature,
                                significance: PLANET_SIGNIFICANCE[transitP.id] || 'minor',
                                peakMonth: `${MONTH_NAMES[current.getMonth()]} ${current.getFullYear()}`,
                                orb: Math.round(orb * 10) / 10,
                            });
                        }
                        break; // Only closest aspect per pair
                    }
                }
            }
        }

        current.setDate(current.getDate() + 15); // Sample every 15 days
    }

    // Sort by significance, then orb
    const sigOrder = { major: 0, moderate: 1, minor: 2 };
    return Array.from(transitMap.values())
        .sort((a, b) => {
            const sigDiff = sigOrder[a.significance] - sigOrder[b.significance];
            if (sigDiff !== 0) return sigDiff;
            return a.orb - b.orb;
        })
        .slice(0, 12); // Top 12 transits
}

// ══════════════════════════════════════
// ECLIPSE DETECTION
// ══════════════════════════════════════

/**
 * Find all eclipses in the given year range and check
 * which ones aspect the natal chart.
 */
function findEclipses(
    natalPlanets: PlanetPosition[],
    startDate: Date,
    endDate: Date,
): EclipseHit[] {
    const hits: EclipseHit[] = [];
    const endMs = endDate.getTime();

    // Lunar eclipses
    try {
        let lunar = SearchLunarEclipse(startDate);
        while (lunar.peak.date.getTime() < endMs) {
            if (lunar.kind !== 'penumbral') { // Skip penumbral — not astrologically significant
                const eclipseDate = lunar.peak.date;
                // Moon longitude at the eclipse = approximate ecliptic position
                const sky = getSkyForDate(eclipseDate);
                const moonPos = sky.find(p => p.id === 'moon');
                if (moonPos) {
                    const natalAspects = findEclipseNatalAspects(moonPos.longitude, natalPlanets);
                    hits.push({
                        type: 'lunar',
                        kind: lunar.kind,
                        date: toISO(eclipseDate),
                        formattedDate: formatDate(eclipseDate),
                        signId: moonPos.signId,
                        signDegree: moonPos.degreeInSign,
                        natalAspects,
                    });
                }
            }
            lunar = NextLunarEclipse(lunar.peak);
        }
    } catch { /* astronomy-engine may throw for edge cases */ }

    // Solar eclipses
    try {
        let solar = SearchGlobalSolarEclipse(startDate);
        while (solar.peak.date.getTime() < endMs) {
            const eclipseDate = solar.peak.date;
            const sky = getSkyForDate(eclipseDate);
            const sunPos = sky.find(p => p.id === 'sun');
            if (sunPos) {
                const natalAspects = findEclipseNatalAspects(sunPos.longitude, natalPlanets);
                hits.push({
                    type: 'solar',
                    kind: solar.kind,
                    date: toISO(eclipseDate),
                    formattedDate: formatDate(eclipseDate),
                    signId: sunPos.signId,
                    signDegree: sunPos.degreeInSign,
                    natalAspects,
                });
            }
            solar = NextGlobalSolarEclipse(solar.peak);
        }
    } catch { /* */ }

    return hits.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Check which natal planets are aspected by an eclipse at a given longitude.
 */
function findEclipseNatalAspects(
    eclipseLon: number,
    natalPlanets: PlanetPosition[],
): EclipseHit['natalAspects'] {
    const results: EclipseHit['natalAspects'] = [];

    for (const natal of natalPlanets) {
        for (const aspect of ASPECT_DEFS) {
            const orb = getOrbBetween(eclipseLon, natal.longitude, aspect.angle);
            if (orb <= 5) { // Tight 5° orb for eclipse aspects
                results.push({
                    planet: natal.name,
                    glyph: natal.glyph,
                    aspect: aspect.name,
                    orb: Math.round(orb * 10) / 10,
                });
                break;
            }
        }
    }

    return results;
}

// ══════════════════════════════════════
// MONTHLY SNAPSHOTS
// ══════════════════════════════════════

function buildMonthlySnapshots(
    natalPlanets: PlanetPosition[],
    startDate: Date,
    eclipses: EclipseHit[],
): MonthSnapshot[] {
    const months: MonthSnapshot[] = [];

    for (let m = 0; m < 12; m++) {
        const monthDate = new Date(startDate);
        monthDate.setMonth(startDate.getMonth() + m);
        const midMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 15);

        const sky = getSkyForDate(midMonth);
        const dominantTransits: MonthSnapshot['dominantTransits'] = [];

        for (const transitP of sky) {
            if (!TRANSIT_PLANETS.has(transitP.id)) continue;

            for (const natalP of natalPlanets) {
                if (transitP.id === natalP.id && ['sun', 'mercury', 'venus'].includes(transitP.id)) continue;

                for (const aspect of ASPECT_DEFS) {
                    const orb = getOrbBetween(transitP.longitude, natalP.longitude, aspect.angle);
                    if (orb <= aspect.orb) {
                        dominantTransits.push({
                            transit: `${transitP.name} ${transitP.glyph}`,
                            natal: `${natalP.name} ${natalP.glyph}`,
                            aspect: `${aspect.name} ${aspect.symbol}`,
                            nature: aspect.nature,
                        });
                        break;
                    }
                }
            }
        }

        // Check if any eclipse falls in this month
        const monthStr = `${midMonth.getFullYear()}-${String(midMonth.getMonth() + 1).padStart(2, '0')}`;
        const eclipseThisMonth = eclipses.some(e => e.date.startsWith(monthStr));

        months.push({
            month: MONTH_NAMES[midMonth.getMonth()],
            monthIndex: midMonth.getMonth(),
            year: midMonth.getFullYear(),
            dominantTransits: dominantTransits.slice(0, 4), // Top 4 per month
            eclipseThisMonth,
        });
    }

    return months;
}

// ══════════════════════════════════════
// KEY DATES
// ══════════════════════════════════════

function findKeyDates(
    natalPlanets: PlanetPosition[],
    startDate: Date,
    endDate: Date,
): KeyDate[] {
    const dates: KeyDate[] = [];
    const seenKeys = new Set<string>();

    const current = new Date(startDate);
    while (current <= endDate) {
        const sky = getSkyForDate(current);

        for (const transitP of sky) {
            if (!OUTER_PLANETS.has(transitP.id)) continue;

            for (const natalP of natalPlanets) {
                for (const aspect of ASPECT_DEFS) {
                    const orb = getOrbBetween(transitP.longitude, natalP.longitude, aspect.angle);
                    if (orb <= 1.0) { // Very tight orb = exact hit
                        const key = `${transitP.id}-${natalP.id}-${aspect.name}`;
                        if (!seenKeys.has(key)) {
                            seenKeys.add(key);
                            dates.push({
                                date: toISO(current),
                                formattedDate: formatDate(current),
                                description: `${transitP.name} ${transitP.glyph} ${aspect.symbol} ${aspect.name.toLowerCase()} your ${natalP.name} ${natalP.glyph}`,
                                nature: aspect.nature,
                                significance: PLANET_SIGNIFICANCE[transitP.id] === 'major' ? 'major' : 'moderate',
                            });
                        }
                    }
                }
            }
        }

        current.setDate(current.getDate() + 5); // Every 5 days for key dates
    }

    return dates
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 15); // Top 15 key dates
}

// ══════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════

/**
 * Generate the full Year Ahead report.
 * This is computationally intensive (~1s) due to multiple ephemeris calculations.
 */
export function generateYearAheadReport(birthData?: BirthData): YearAheadReport | null {
    const data = birthData || getBirthData();
    if (!data) return null;

    const chart = getFullChart(data);
    if (!chart) return null;

    const now = new Date();
    const currentYear = now.getFullYear();

    // Solar return: find when Sun returns to natal degree this year
    const natalSun = chart.planets.find(p => p.id === 'sun');
    if (!natalSun) return null;

    const solarReturnDate = findSolarReturn(natalSun.longitude, currentYear);
    const solarYearEnd = new Date(solarReturnDate);
    solarYearEnd.setFullYear(solarYearEnd.getFullYear() + 1);

    // Use the solar year range for the report
    const startDate = solarReturnDate;
    const endDate = solarYearEnd;

    // Numerology
    const personalYear = getPersonalYearNumber(data.birthday);
    const lifePathNumber = getLifePathNumber(data.birthday);

    // Major transits
    const majorTransits = scanYearTransits(chart.planets, startDate, endDate);

    // Eclipses
    const eclipses = findEclipses(chart.planets, startDate, endDate);

    // Monthly snapshots
    const months = buildMonthlySnapshots(chart.planets, startDate, eclipses);

    // Key dates
    const keyDates = findKeyDates(chart.planets, startDate, endDate);

    return {
        solarYear: {
            start: toISO(startDate),
            end: toISO(endDate),
            startFormatted: formatDate(startDate),
        },
        personalYear,
        lifePathNumber,
        majorTransits,
        eclipses,
        months,
        keyDates,
        generatedAt: new Date().toISOString(),
        year: currentYear,
    };
}

/**
 * Check if today is the user's birthday (for celebration UI).
 */
export function isBirthdayToday(birthday: string): boolean {
    const bday = new Date(birthday + 'T12:00:00');
    const today = new Date();
    return bday.getMonth() === today.getMonth() && bday.getDate() === today.getDate();
}
