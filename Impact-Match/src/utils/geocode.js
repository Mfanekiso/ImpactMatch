// Turns a typed location ("Soweto, Gauteng") into map coordinates with the free
// Nominatim API (OpenStreetMap). Used when a profile is saved, so the matching
// engine can measure real distance in kilometres.
//
// Nominatim usage policy: max 1 request per second, identify the app, cache results.
// We only call it when a profile is saved, so usage stays tiny.

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const cache = {};

// Returns { latitude, longitude } or null (never throws: a failed lookup must not block saving)
export async function geocodeLocation(location) {
    const q = String(location || "").trim();
    if (!q) return null;
    if (cache[q] !== undefined) return cache[q];

    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 6000) : null;
    try {
        const url = `${NOMINATIM_URL}?format=json&limit=1&countrycodes=za&q=${encodeURIComponent(q)}`;
        const res = await fetch(url, {
            headers: { Accept: "application/json", "User-Agent": "ImpactMatch/1.0 (student project)" },
            signal: controller?.signal,
        });
        if (!res.ok) throw new Error(`Nominatim ${res.status}`);
        const [place] = await res.json();
        const result = place ? { latitude: Number(place.lat), longitude: Number(place.lon) } : null;
        cache[q] = result;
        return result;
    } catch (error) {
        console.log("Geocoding skipped:", error?.message);
        return null;
    } finally {
        if (timer) clearTimeout(timer);
    }
}

// Adds latitude / longitude to a profile update when its location is known.
// If the lookup fails, the update is saved without coordinates and matching
// falls back to comparing place names.
export async function withCoordinates(update) {
    if (!update || !update.location) return update;
    const coords = await geocodeLocation(update.location);
    return coords ? { ...update, ...coords } : update;
}
