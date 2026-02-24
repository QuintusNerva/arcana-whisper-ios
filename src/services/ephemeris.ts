/**
 * Ephemeris Engine — Accurate astronomical calculations for natal charts.
 * Uses the astronomy-engine library (cosinekitty) for sub-arcsecond accuracy.
 *
 * Provides:
 *  - Moon ecliptic longitude → zodiac sign
 *  - Ascendant (Rising sign) calculation
 *  - Ecliptic longitude → Zodiac sign mapping
 */

import {
    MakeTime,
    EclipticGeoMoon,
    SiderealTime,
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

/**
 * Create a JavaScript Date in UTC from local birth time + UTC offset.
 * astronomy-engine's MakeTime() expects a Date object (not year/month/day args).
 */
function makeUTCDate(
    year: number, month: number, day: number,
    hour: number, minute: number, utcOffset: number
): Date {
    // Date.UTC uses 0-indexed months
    const utcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
    // Subtract the UTC offset to convert local → UTC
    // utcOffset is in hours (e.g. -5 for EST), so local + (-offset) = UTC
    // Actually: UTC = local - offset, so we subtract offset*hours in ms
    const offsetMs = utcOffset * 60 * 60 * 1000;
    return new Date(utcMs - offsetMs);
}

// ══════════════════════════════════════
// MOON ECLIPTIC LONGITUDE
// ══════════════════════════════════════

/**
 * Calculate the Moon's ecliptic longitude using astronomy-engine.
 * Accuracy: sub-arcsecond (< 0.001°).
 */
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
// ASCENDANT (RISING SIGN)
// ══════════════════════════════════════

/**
 * Mean obliquity of the ecliptic in degrees.
 */
function getObliquity(time: any): number {
    const T = time.tt / 36525.0;
    return 23.4392911 - 0.0130042 * T - 0.00000016 * T * T + 0.000000504 * T * T * T;
}

/**
 * Calculate the Ascendant (Rising sign) degree on the ecliptic.
 */
export function getAscendant(
    year: number, month: number, day: number,
    hour: number, minute: number, utcOffset: number,
    latitude: number, longitude: number
): number {
    const date = makeUTCDate(year, month, day, hour, minute, utcOffset);
    const time = MakeTime(date);

    // Greenwich Mean Sidereal Time in sidereal hours → convert to degrees
    const gmstHours = SiderealTime(time);
    const gmstDeg = gmstHours * 15.0;

    // Local Sidereal Time
    const lst = norm360(gmstDeg + longitude);

    // Obliquity of the ecliptic
    const obliquity = getObliquity(time);

    // Ascendant formula:
    // ASC = atan2(-cos(LST), sin(LST)*cos(ε) + tan(φ)*sin(ε))
    const lstRad = rad(lst);
    const oblRad = rad(obliquity);
    const latRad = rad(latitude);

    const y = -Math.cos(lstRad);
    const x = Math.sin(lstRad) * Math.cos(oblRad) + Math.tan(latRad) * Math.sin(oblRad);

    const ascendant = norm360(Math.atan2(y, x) * 180 / Math.PI);
    console.log('[EPHEMERIS] Ascendant:', {
        utcDate: date.toISOString(),
        gmstDeg: Math.round(gmstDeg * 100) / 100,
        lstDeg: Math.round(lst * 100) / 100,
        obliquity: Math.round(obliquity * 1000) / 1000,
        ascendantDeg: Math.round(ascendant * 100) / 100,
        sign: SIGN_NAMES[Math.floor(ascendant / 30)],
        degInSign: Math.round((ascendant % 30) * 100) / 100,
    });
    return ascendant;
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
    moonSignId: string;
    moonDegree: number;
    moonLongitude: number;
    risingSignId: string | null;
    risingDegree: number | null;
    risingLongitude: number | null;
}

export function calculateEphemeris(input: EphemerisInput): EphemerisResult {
    const { year, month, day, hour = 12, minute = 0, utcOffset = 0, latitude, longitude } = input;

    // Moon
    const moonLong = getMoonLongitude(year, month, day, hour, minute, utcOffset);
    const moonSignId = longitudeToSignId(moonLong);
    const moonDegree = Math.round(longitudeToDegreeInSign(moonLong) * 10) / 10;

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

    return {
        moonSignId, moonDegree, moonLongitude: moonLong,
        risingSignId, risingDegree, risingLongitude,
    };
}
