/**
 * Geocoding Service
 *
 * Uses OpenStreetMap Nominatim (free, no API key, CORS-friendly) for city search
 * and Google Time Zone API for historical UTC offset resolution.
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
        // Filter to cities/towns/villages only
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

            // Build a clean description
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

// ── Fallback: estimate UTC offset from longitude (±1hr accuracy) ──

function estimateTimezoneFromLng(lng: number): number {
    // Each 15° of longitude ≈ 1 hour of UTC offset
    const offset = Math.round(lng / 15);
    console.log('[GEO] Estimated UTC offset from longitude:', offset, 'hours (lng:', lng, ')');
    return offset;
}

// ── Time Zone API → historical UTC offset (Google REST — supports CORS) ──

async function getTimezoneOffset(
    lat: number, lng: number,
    dateStr: string, timeStr?: string
): Promise<number> {
    if (!GOOGLE_KEY) return estimateTimezoneFromLng(lng);

    try {
        const dt = new Date(`${dateStr}T${timeStr || '12:00'}:00Z`);
        const timestamp = Math.floor(dt.getTime() / 1000);

        const url = new URL('https://maps.googleapis.com/maps/api/timezone/json');
        url.searchParams.set('location', `${lat},${lng}`);
        url.searchParams.set('timestamp', String(timestamp));
        url.searchParams.set('key', GOOGLE_KEY);

        const res = await fetch(url.toString());
        if (!res.ok) return estimateTimezoneFromLng(lng);

        const data = await res.json();
        if (data.status !== 'OK') {
            console.warn('[GEO] Timezone API error, using fallback:', data.status);
            return estimateTimezoneFromLng(lng);
        }

        const totalHours = ((data.rawOffset || 0) + (data.dstOffset || 0)) / 3600;
        console.log('[GEO] UTC offset:', totalHours, 'hours');
        return totalHours;
    } catch (err) {
        console.error('[GEO] Timezone error, using fallback:', err);
        return estimateTimezoneFromLng(lng);
    }
}

// ── High-level: resolve a Place selection ──

export async function resolvePlace(
    suggestion: PlaceSuggestion,
    birthDate: string,
    birthTime?: string
): Promise<GeocodedLocation | null> {
    // Nominatim already gives us lat/lng in the suggestion
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
