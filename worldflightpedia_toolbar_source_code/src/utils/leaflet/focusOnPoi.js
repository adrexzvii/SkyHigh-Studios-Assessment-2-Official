// Utility to focus the Leaflet map on a given POI.
// Keeps the exact behavior from the original MapView implementation.

/**
 * Focus map on POI and disable follow-plane mode.
 *
 * @param {L.Map} map - Leaflet map instance
 * @param {Object} poi - POI object with lat and lon properties
 * @param {Object} options - Additional options
 * @param {Function} options.setFollowPlane - Setter to disable followPlane state
 * @param {React.MutableRefObject} options.followRef - Ref pointing to followPlane boolean
 * @param {React.MutableRefObject} options.updateFollowButtonRef - Ref to follow button updater function
 */
export function focusOnPoiUtil(
  map,
  poi,
  { setFollowPlane, followRef, updateFollowButtonRef }
) {
  if (map && poi?.lat && poi?.lon) {
    // Disable follow plane mode
    if (typeof setFollowPlane === "function") setFollowPlane(false);
    if (followRef) followRef.current = false;

    // Update the follow button UI if the update function exists
    if (updateFollowButtonRef?.current) {
      try {
        updateFollowButtonRef.current();
      } catch (e) {
        // swallow UI update errors to avoid breaking focus behavior
        console.warn("[focusOnPoiUtil] updateFollowButtonRef threw", e);
      }
    }

    // Center map on POI with maximum zoom (18 is Leaflet's default max zoom)
    const maxZoom = map.getMaxZoom?.() || 18;
    map.setView([poi.lat, poi.lon], maxZoom, {
      animate: true,
      duration: 1,
    });
  }
}
