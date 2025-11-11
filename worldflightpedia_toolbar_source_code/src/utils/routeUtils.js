/**
 * routeUtils.js - Utilities for route planning operations
 *
 * Provides helpers for ordering geographic points (POIs) using a nearest-neighbor
 * heuristic (fast greedy path) and normalizing raw POI objects into a consistent
 * internal shape.
 */

import { haversine } from "./haversine";

/**
 * nearestNeighborOrder - Greedy ordering of points by incremental nearest distance
 *
 * Produces an ordered array of POIs starting from the given start coordinate, always
 * choosing the closest remaining point. This is a heuristic (O(n^2)) and does NOT
 * guarantee global optimality (it's not solving TSP exactly) but is fast and works
 * well for small / medium lists typically used in the app.
 *
 * Input points are shallow-cloned to avoid mutating caller data.
 *
 * @param {{lat:number, lon:number}} start - Starting coordinate
 * @param {Array<{lat:number, lon:number}>} points - Array of POI-like objects with lat/lon
 * @returns {Array<{lat:number, lon:number}>} Ordered array of points
 *
 * @example
 * const ordered = nearestNeighborOrder({ lat: 40, lon: -3 }, [
 *   { lat: 41, lon: -3 },
 *   { lat: 39.5, lon: -2.8 },
 * ]);
 */
export function nearestNeighborOrder(start, points) {
  if (!start || !Array.isArray(points)) return [];

  // Clone to avoid in-place modifications of caller array
  const pts = points.map(p => ({ ...p }));
  const order = [];
  let cur = { lat: start.lat, lon: start.lon };

  // Greedy loop: pick nearest remaining point until none left
  while (pts.length) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const d = haversine(cur.lat, cur.lon, p.lat, p.lon);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const next = pts.splice(bestIdx, 1)[0];
    order.push(next);
    cur = { lat: next.lat, lon: next.lon }; // Advance start to newly chosen point
  }

  return order;
}

/**
 * normalizePois - Standardize raw POI objects and filter invalid coordinates
 *
 * Ensures each POI has: id, lat, lon, title. Generates an id fallback using
 * pageid or lat/lon if necessary. Coerces latitude/longitude to numbers and
 * removes entries with NaN coordinates.
 *
 * @param {Array<any>} pois - Raw POI list from external source (e.g., Wikipedia)
 * @returns {Array<{id:string, lat:number, lon:number, title:string}>} Clean POI list
 *
 * @example
 * const cleaned = normalizePois(rawPois);
 */
export function normalizePois(pois) {
  if (!Array.isArray(pois)) return [];
  return pois
    .map(p => ({
      id: p.id ?? (p.pageid ?? `${p.lat}-${p.lon}`),
      lat: typeof p.lat === "number" ? p.lat : Number(p.lat),
      lon: typeof p.lon === "number" ? p.lon : Number(p.lon),
      title: p.title ?? p.name ?? "Unknown POI"
    }))
    .filter(p => !isNaN(p.lat) && !isNaN(p.lon));
}
