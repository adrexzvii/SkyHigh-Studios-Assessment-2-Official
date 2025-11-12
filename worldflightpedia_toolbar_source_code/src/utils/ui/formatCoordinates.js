/**
 * formatCoordinates - Utility function to format geographic coordinates
 * 
 * Converts latitude and longitude numbers into a human-readable string
 * format with 3 decimal places of precision (~111m accuracy).
 * 
 * @param {number} lat - Latitude in decimal degrees (-90 to 90)
 * @param {number} lon - Longitude in decimal degrees (-180 to 180)
 * @returns {string} Formatted string in format "(lat, lon)" or "(Unknown)" if invalid
 * 
 * @example
 * formatCoordinates(40.7128, -74.0060) // Returns "(40.713, -74.006)"
 * formatCoordinates(null, undefined)   // Returns "(Unknown)"
 */
export function formatCoordinates(lat, lon) {
  // Handle invalid or missing coordinates
  if (!lat || !lon) return "(Unknown)";
  
  // Format with 3 decimal places for ~111m precision
  return `(${lat.toFixed(3)}, ${lon.toFixed(3)})`;
}
