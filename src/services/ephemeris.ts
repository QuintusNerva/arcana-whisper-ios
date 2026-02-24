/**
 * Ephemeris Engine — Full natal chart calculations using astronomy-engine.
 *
 * Provides:
 *  - All 10 planetary positions (Sun through Pluto) as ecliptic longitudes
 *  - Moon ecliptic longitude (sub-arcsecond accuracy)
 *  - Ascendant (Rising sign) calculation
 *  - Aspect detection between all planet pairs
 *  - Ecliptic longitude → Zodiac sign mapping
 */

import {
    MakeTime,
    EclipticGeoMoon,
    SiderealTime,
    SunPosition,
    GeoVector,
    Ecliptic as AstroEcliptic,
    Body,
} from 'astronomy-engine';

// ══════════════════════════════════════
// ZODIAC MAPPING
// ══════════════════════════════════════

const SIGN_NAMES = [
    'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
    'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
] as const;

function norm360(deg: number): number {
    deg = deg % 360;
    return deg < 0 ? deg + 360 : deg;
}

function rad(deg: number): number {
    return deg * Math.PI / 180;
}

export function longitudeToSignId(degrees: number): string {
    const normalized = norm360(degrees);
    const index = Math.floor(normalized / 30);
    return SIGN_NAMES[index];
}

export function longitudeToDegreeInSign(degrees: number): number {
    return norm360(degrees) % 30;
}

// ══════════════════════════════════════
// HELPER: Build a UTC Date for astronomy-engine
// ══════════════════════════════════════

function makeUTCDate(
    year: number, month: number, day: number,
    hour: number, minute: number, utcOffset: number
): Date {
    const utcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
    const offsetMs = utcOffset * 60 * 60 * 1000;
    return new Date(utcMs - offsetMs);
}

// ══════════════════════════════════════
// PLANET DEFINITIONS
// ══════════════════════════════════════

export interface PlanetInfo {
    id: string;
    name: string;
    glyph: string;
    body: Body | 'Sun' | 'Moon';
}

export const PLANETS: PlanetInfo[] = [
    { id: 'sun', name: 'Sun', glyph: '☉', body: 'Sun' },
    { id: 'moon', name: 'Moon', glyph: '☽', body: 'Moon' },
    { id: 'mercury', name: 'Mercury', glyph: '☿', body: Body.Mercury },
    { id: 'venus', name: 'Venus', glyph: '♀', body: Body.Venus },
    { id: 'mars', name: 'Mars', glyph: '♂', body: Body.Mars },
    { id: 'jupiter', name: 'Jupiter', glyph: '♃', body: Body.Jupiter },
    { id: 'saturn', name: 'Saturn', glyph: '♄', body: Body.Saturn },
    { id: 'uranus', name: 'Uranus', glyph: '♅', body: Body.Uranus },
    { id: 'neptune', name: 'Neptune', glyph: '♆', body: Body.Neptune },
    { id: 'pluto', name: 'Pluto', glyph: '♇', body: Body.Pluto },
];

// ══════════════════════════════════════
// PLANET ECLIPTIC LONGITUDES
// ══════════════════════════════════════

export interface PlanetPosition {
    id: string;
    name: string;
    glyph: string;
    longitude: number;      // 0-360
    signId: string;         // 'aries', 'taurus', etc.
    degreeInSign: number;   // 0-30
}

function getPlanetLongitude(planet: PlanetInfo, date: Date): number {
    const time = MakeTime(date);

    if (planet.body === 'Sun') {
        const sun = SunPosition(time);
        return norm360(sun.elon);
    }

    if (planet.body === 'Moon') {
        const moon = EclipticGeoMoon(time);
        return norm360(moon.lon);
    }

    // All other planets: geocentric vector → ecliptic conversion
    const geo = GeoVector(planet.body as Body, time, true);
    const ecl = AstroEcliptic(geo);
    return norm360(ecl.elon);
}

function getAllPlanetPositions(date: Date): PlanetPosition[] {
    return PLANETS.map(planet => {
        const longitude = getPlanetLongitude(planet, date);
        return {
            id: planet.id,
            name: planet.name,
            glyph: planet.glyph,
            longitude,
            signId: longitudeToSignId(longitude),
            degreeInSign: Math.round(longitudeToDegreeInSign(longitude) * 10) / 10,
        };
    });
}

// ══════════════════════════════════════
// ASPECT DETECTION
// ══════════════════════════════════════

export interface Aspect {
    planet1: string;      // planet id
    planet1Name: string;
    planet1Glyph: string;
    planet2: string;
    planet2Name: string;
    planet2Glyph: string;
    type: string;         // 'conjunction', 'sextile', etc.
    symbol: string;       // ☌, ⚹, □, △, ☍
    angle: number;        // exact angle between them
    orb: number;          // how far from exact (degrees)
    nature: 'harmonious' | 'challenging' | 'neutral';
}

interface AspectDef {
    name: string;
    symbol: string;
    angle: number;
    orb: number;
    nature: 'harmonious' | 'challenging' | 'neutral';
}

const ASPECT_DEFINITIONS: AspectDef[] = [
    { name: 'Conjunction', symbol: '☌', angle: 0, orb: 8, nature: 'neutral' },
    { name: 'Sextile', symbol: '⚹', angle: 60, orb: 4, nature: 'harmonious' },
    { name: 'Square', symbol: '□', angle: 90, orb: 7, nature: 'challenging' },
    { name: 'Trine', symbol: '△', angle: 120, orb: 7, nature: 'harmonious' },
    { name: 'Opposition', symbol: '☍', angle: 180, orb: 8, nature: 'challenging' },
];

function detectAspects(planets: PlanetPosition[]): Aspect[] {
    const aspects: Aspect[] = [];

    for (let i = 0; i < planets.length; i++) {
        for (let j = i + 1; j < planets.length; j++) {
            const p1 = planets[i];
            const p2 = planets[j];

            // Angular separation (shortest arc)
            let diff = Math.abs(p1.longitude - p2.longitude);
            if (diff > 180) diff = 360 - diff;

            // Check each aspect type
            for (const aspect of ASPECT_DEFINITIONS) {
                const orb = Math.abs(diff - aspect.angle);
                if (orb <= aspect.orb) {
                    aspects.push({
                        planet1: p1.id,
                        planet1Name: p1.name,
                        planet1Glyph: p1.glyph,
                        planet2: p2.id,
                        planet2Name: p2.name,
                        planet2Glyph: p2.glyph,
                        type: aspect.name,
                        symbol: aspect.symbol,
                        angle: Math.round(diff * 10) / 10,
                        orb: Math.round(orb * 10) / 10,
                        nature: aspect.nature,
                    });
                    break; // Only match the first (closest) aspect
                }
            }
        }
    }

    // Sort by tightest orb first (most significant)
    return aspects.sort((a, b) => a.orb - b.orb);
}

// ══════════════════════════════════════
// ASCENDANT (RISING SIGN)
// ══════════════════════════════════════

function getObliquity(time: any): number {
    const T = time.tt / 36525.0;
    return 23.4392911 - 0.0130042 * T - 0.00000016 * T * T + 0.000000504 * T * T * T;
}

export function getAscendant(
    year: number, month: number, day: number,
    hour: number, minute: number, utcOffset: number,
    latitude: number, longitude: number
): number {
    const date = makeUTCDate(year, month, day, hour, minute, utcOffset);
    const time = MakeTime(date);

    const gmstHours = SiderealTime(time);
    const gmstDeg = gmstHours * 15.0;
    const lst = norm360(gmstDeg + longitude);
    const obliquity = getObliquity(time);

    // Ascendant formula (Jean Meeus):
    //   y = cos(RAMC)
    //   x = -(sin(RAMC)*cos(ε) + tan(φ)*sin(ε))
    const lstRad = rad(lst);
    const oblRad = rad(obliquity);
    const latRad = rad(latitude);

    const y = Math.cos(lstRad);
    const x = -(Math.sin(lstRad) * Math.cos(oblRad) + Math.tan(latRad) * Math.sin(oblRad));

    return norm360(Math.atan2(y, x) * 180 / Math.PI);
}

// ══════════════════════════════════════
// MOON ECLIPTIC LONGITUDE (legacy API)
// ══════════════════════════════════════

export function getMoonLongitude(
    year: number, month: number, day: number,
    hour: number = 12, minute: number = 0,
    utcOffset: number = 0
): number {
    const date = makeUTCDate(year, month, day, hour, minute, utcOffset);
    const time = MakeTime(date);
    const moon = EclipticGeoMoon(time);
    return norm360(moon.lon);
}

// ══════════════════════════════════════
// HIGH-LEVEL API
// ══════════════════════════════════════

export interface EphemerisInput {
    year: number;
    month: number;
    day: number;
    hour?: number;
    minute?: number;
    utcOffset?: number;
    latitude?: number;
    longitude?: number;
}

export interface EphemerisResult {
    // Legacy fields (Moon + Rising for Big Three)
    moonSignId: string;
    moonDegree: number;
    moonLongitude: number;
    risingSignId: string | null;
    risingDegree: number | null;
    risingLongitude: number | null;

    // Extended: all planet positions
    planets: PlanetPosition[];

    // Extended: detected aspects
    aspects: Aspect[];
}

export function calculateEphemeris(input: EphemerisInput): EphemerisResult {
    const { year, month, day, hour = 12, minute = 0, utcOffset = 0, latitude, longitude } = input;

    const date = makeUTCDate(year, month, day, hour, minute, utcOffset);

    // All planet positions
    const planets = getAllPlanetPositions(date);

    // Extract Moon from the planet array
    const moonPos = planets.find(p => p.id === 'moon')!;

    // Rising (Ascendant)
    let risingSignId: string | null = null;
    let risingDegree: number | null = null;
    let risingLongitude: number | null = null;

    if (latitude !== undefined && longitude !== undefined) {
        const ascLong = getAscendant(year, month, day, hour, minute, utcOffset, latitude, longitude);
        risingSignId = longitudeToSignId(ascLong);
        risingDegree = Math.round(longitudeToDegreeInSign(ascLong) * 10) / 10;
        risingLongitude = ascLong;
    }

    // Detect aspects between all planets
    const aspects = detectAspects(planets);

    return {
        moonSignId: moonPos.signId,
        moonDegree: moonPos.degreeInSign,
        moonLongitude: moonPos.longitude,
        risingSignId, risingDegree, risingLongitude,
        planets,
        aspects,
    };
}
