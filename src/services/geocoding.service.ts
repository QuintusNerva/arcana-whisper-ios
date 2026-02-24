/**
 * Geocoding Service
 *
 * City search: OpenStreetMap Nominatim (free, no key, CORS-friendly)
 * Timezone:    DST-aware via free timeapi.io + JavaScript Intl.DateTimeFormat
 *              Falls back to coordinate-based IANA timezone estimation
 *
 * CRITICAL: The Rising sign moves ~15° per hour, so UTC offset must account
 *           for Daylight Saving Time. A 1-hour error = 1 zodiac sign error.
 */

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// ── Types ──

export interface PlaceSuggestion {
    placeId: string;
    description: string;
    mainText: string;
    secondaryText: string;
    lat: number;
    lng: number;
}

export interface GeocodedLocation {
    name: string;
    latitude: number;
    longitude: number;
    utcOffset: number;
}

// ── Nominatim City Search (OpenStreetMap — free, no API key) ──

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
    if (!query || query.length < 2) return [];

    try {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('q', query);
        url.searchParams.set('format', 'json');
        url.searchParams.set('limit', '5');
        url.searchParams.set('addressdetails', '1');
        url.searchParams.set('featuretype', 'city');

        const res = await fetch(url.toString(), {
            headers: { 'Accept-Language': 'en' },
        });

        if (!res.ok) return [];
        const data = await res.json();

        console.log('[GEO] Nominatim results:', data.length);

        return data.map((item: any) => {
            const parts: string[] = [];
            const addr = item.address || {};

            const city = addr.city || addr.town || addr.village || addr.county || item.name || '';
            const state = addr.state || '';
            const country = addr.country || '';

            if (city) parts.push(city);
            if (state && state !== city) parts.push(state);
            if (country) parts.push(country);

            const description = parts.join(', ') || item.display_name;

            return {
                placeId: String(item.place_id),
                description,
                mainText: city || item.name || query,
                secondaryText: [state, country].filter(Boolean).join(', '),
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
            };
        });
    } catch (err) {
        console.error('[GEO] searchPlaces error:', err);
        return [];
    }
}

// ══════════════════════════════════════════════════════════════
// DST-AWARE TIMEZONE RESOLUTION
// ══════════════════════════════════════════════════════════════
//
// Strategy:
//   1. Get IANA timezone name from coordinates (timeapi.io → coordinate fallback)
//   2. Use JavaScript's Intl.DateTimeFormat to compute the exact UTC offset
//      for the specific birth date. This handles DST correctly because the
//      Intl API uses the full IANA timezone database.
//
// Why this matters:
//   The Rising sign (Ascendant) moves ~15° per hour = 1 zodiac sign / hour.
//   Using EST (-5) instead of EDT (-4) in summer shifts the Ascendant by
//   exactly one sign — that's the bug we're fixing.
// ══════════════════════════════════════════════════════════════

/**
 * Get IANA timezone name from coordinates.
 * Tries timeapi.io first, then falls back to coordinate-based estimation.
 */
async function getIANATimezone(lat: number, lng: number): Promise<string> {
    // Try free API first
    try {
        const res = await fetch(
            `https://timeapi.io/api/timezone/coordinate?latitude=${lat}&longitude=${lng}`,
            { signal: AbortSignal.timeout(5000) }
        );
        if (res.ok) {
            const data = await res.json();
            if (data.timeZone) {
                console.log('[GEO] IANA timezone from API:', data.timeZone);
                return data.timeZone;
            }
        }
    } catch {
        console.warn('[GEO] timeapi.io failed, using coordinate fallback');
    }

    // Fallback: estimate IANA timezone from coordinates
    return estimateIANATimezone(lat, lng);
}

/**
 * Estimate IANA timezone from coordinates.
 * Covers North America, Europe, and major world regions.
 * Returns a real IANA city-based timezone (not Etc/GMT) so DST is applied.
 */
function estimateIANATimezone(lat: number, lng: number): string {
    // ── North America ──
    if (lat > 15 && lat < 75 && lng > -170 && lng < -50) {
        if (lng > -52) return 'America/St_Johns';     // Newfoundland
        if (lng > -67.5) return 'America/Halifax';       // Atlantic
        if (lng > -82.5) return 'America/New_York';      // Eastern
        if (lng > -97.5) return 'America/Chicago';       // Central
        if (lng > -112.5) return 'America/Denver';       // Mountain
        if (lng > -125) return 'America/Los_Angeles';   // Pacific
        if (lng > -145) return 'America/Anchorage';     // Alaska
        return 'Pacific/Honolulu';                        // Hawaii
    }

    // ── Europe ──
    if (lat > 35 && lat < 72 && lng > -15 && lng < 45) {
        if (lng < 0) return 'Europe/London';
        if (lng < 7.5) return 'Europe/Paris';
        if (lng < 15) return 'Europe/Berlin';
        if (lng < 22.5) return 'Europe/Athens';
        if (lng < 30) return 'Europe/Bucharest';
        return 'Europe/Moscow';
    }

    // ── East Asia ──
    if (lat > 20 && lat < 55 && lng > 100 && lng < 150) {
        if (lng < 120) return 'Asia/Shanghai';
        if (lng < 135) return 'Asia/Tokyo';
        return 'Asia/Vladivostok';
    }

    // ── South Asia ──
    if (lat > 5 && lat < 40 && lng > 65 && lng < 100) {
        return 'Asia/Kolkata';
    }

    // ── Australia ──
    if (lat < -10 && lng > 110 && lng < 160) {
        if (lng < 130) return 'Australia/Perth';
        if (lng < 142) return 'Australia/Adelaide';
        return 'Australia/Sydney';
    }

    // ── South America ──
    if (lat < 15 && lng > -82 && lng < -35) {
        if (lng < -65) return 'America/Lima';
        return 'America/Sao_Paulo';
    }

    // ── Africa ──
    if (lat < 35 && lat > -35 && lng > -20 && lng < 55) {
        if (lng < 15) return 'Africa/Lagos';
        if (lng < 30) return 'Africa/Johannesburg';
        return 'Africa/Nairobi';
    }

    // ── Middle East ──
    if (lat > 15 && lat < 40 && lng > 35 && lng < 65) {
        return 'Asia/Dubai';
    }

    // Absolute fallback: use Etc/GMT zones (no DST, but better than nothing)
    const offset = Math.round(lng / 15);
    console.warn('[GEO] Using Etc/GMT fallback for coordinates:', lat, lng);
    if (offset === 0) return 'Etc/UTC';
    // Note: Etc/GMT signs are INVERTED (Etc/GMT-5 = UTC+5)
    return `Etc/GMT${offset > 0 ? '-' : '+'}${Math.abs(offset)}`;
}

/**
 * Compute the exact UTC offset (in hours) for a specific date in a given IANA timezone.
 * This correctly handles DST by using the browser's built-in Intl.DateTimeFormat,
 * which includes historical DST rules from the IANA timezone database.
 *
 * Example:
 *   computeHistoricalUTCOffset('America/New_York', '1972-06-25', '08:56')
 *   → -4  (EDT, summer)
 *
 *   computeHistoricalUTCOffset('America/New_York', '1983-12-14', '17:11')
 *   → -5  (EST, winter)
 */
function computeHistoricalUTCOffset(iana: string, dateStr: string, timeStr?: string): number {
    try {
        const [year, month, day] = dateStr.split('-').map(Number);
        const [hour, minute] = (timeStr || '12:00').split(':').map(Number);

        // Create an approximate UTC Date using a rough longitude-based offset.
        // We need this because we don't know the exact UTC offset yet (that's what we're computing).
        // The rough estimate just needs to be within ±12 hours to get the right DST determination.
        const roughUTC = new Date(Date.UTC(year, month - 1, day, hour + 5, minute)); // ~EST as rough start

        // Format this UTC instant in the target timezone
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: iana,
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: false,
        }).formatToParts(roughUTC);

        const get = (type: string) => {
            const val = parts.find(p => p.type === type)?.value || '0';
            return parseInt(val, 10);
        };

        // Reconstruct the local time as a UTC timestamp (for comparison)
        const localAsUTC = Date.UTC(
            get('year'), get('month') - 1, get('day'),
            get('hour') === 24 ? 0 : get('hour'), // Handle midnight edge case
            get('minute'), get('second')
        );

        // The offset = local_as_utc - actual_utc (in hours)
        const offsetHours = (localAsUTC - roughUTC.getTime()) / (1000 * 60 * 60);

        console.log('[GEO] Historical UTC offset for', iana, dateStr, timeStr, '→', offsetHours, 'hours');
        return offsetHours;
    } catch (err) {
        console.error('[GEO] computeHistoricalUTCOffset error:', err);
        // Emergency fallback: longitude-based (no DST)
        return 0;
    }
}

// ── High-level timezone resolver ──

async function getTimezoneOffset(
    lat: number, lng: number,
    dateStr: string, timeStr?: string
): Promise<number> {
    // Step 1: Get IANA timezone name (DST-aware)
    const iana = await getIANATimezone(lat, lng);

    // Step 2: Compute exact offset for this specific date (handles DST correctly)
    return computeHistoricalUTCOffset(iana, dateStr, timeStr);
}

// ── High-level: resolve a Place selection ──

export async function resolvePlace(
    suggestion: PlaceSuggestion,
    birthDate: string,
    birthTime?: string
): Promise<GeocodedLocation | null> {
    const { lat, lng } = suggestion;
    if (!lat || !lng) return null;

    console.log('[GEO] Resolving:', suggestion.description, lat, lng);

    const utcOffset = await getTimezoneOffset(lat, lng, birthDate, birthTime);

    return {
        name: suggestion.description,
        latitude: lat,
        longitude: lng,
        utcOffset,
    };
}
