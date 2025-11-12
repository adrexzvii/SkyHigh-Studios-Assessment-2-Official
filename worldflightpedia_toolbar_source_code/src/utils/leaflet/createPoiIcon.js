import L from 'leaflet';

/**
 * Creates a Leaflet divIcon for POIs with selectable styling.
 * @param {boolean} isSelected Whether the POI is currently selected.
 * @returns {L.DivIcon} A configured Leaflet DivIcon instance.
 */
export function createPoiIcon(isSelected = false) {
  return L.divIcon({
    className: 'poi-icon',
    html: `
      <svg viewBox="0 0 24 24" width="32" height="32" fill="${isSelected ? '#a80000ff' : '#006b4a'}">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
}
