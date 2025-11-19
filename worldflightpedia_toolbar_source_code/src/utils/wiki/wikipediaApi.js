// Small helper for Wikipedia network calls used by multiple hooks
// Provides geosearch and page summary helpers with consistent error handling

/**
 * Fetch nearby pages using Wikipedia GeoSearch
 * @param {number} lat
 * @param {number} lon
 * @param {number} [radius=10000] radius in meters for search POIs
 * @param {number} [limit=50] limit number of results
 * @returns {Promise<Array>} Array of geosearch results or []
 */
export async function fetchGeoSearch(lat, lon, radius = 10000, limit = 50) {
  if (typeof lat !== "number" || typeof lon !== "number") return [];
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=${radius}&gslimit=${limit}&format=json&origin=*`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Wikipedia API error: ${res.status}`);
    const data = await res.json();
    return data?.query?.geosearch ?? [];
  } catch (err) {
    console.error("[wikipediaApi] fetchGeoSearch error:", err);
    return [];
  }
}

/**
 * Fetch page summary for a given Wikipedia title using REST summary endpoint
 * @param {string} title
 * @returns {Promise<Object|null>} Summary object or null on error
 */
export async function fetchSummary(title) {
  if (!title) return null;
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    title
  )}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Wikipedia summary error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("[wikipediaApi] fetchSummary error:", err);
    return null;
  }
}
