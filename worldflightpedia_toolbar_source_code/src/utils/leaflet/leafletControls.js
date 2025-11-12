import React from 'react';
import { createRoot } from 'react-dom/client';
import FlightIcon from '@mui/icons-material/Flight';
import SearchIcon from '@mui/icons-material/Search';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import L from 'leaflet';

/**
 * Adds the Follow Plane control to the map.
 * @param {L.Map} map - Leaflet map instance.
 * @param {Object} ctx
 * @param {{dark?:string, accent?:string}} [ctx.palette] - Theme palette for styling.
 * @param {import('react').MutableRefObject<boolean>} ctx.followRef - Ref tracking follow state.
 * @param {(v:boolean)=>void} ctx.setFollowPlane - State setter for follow status.
 * @param {import('react').MutableRefObject<Function>} ctx.updateFollowButtonRef - Ref receiving update callback.
 * @returns {L.Control} The created Leaflet control.
 */
export function addFollowControl(map, { palette, followRef, setFollowPlane, updateFollowButtonRef }) {
  const FollowControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function () {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      const btn = L.DomUtil.create('div', '', container);
      btn.title = 'Follow plane';
      Object.assign(btn.style, {
        width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#fff'
      });
      const root = createRoot(btn);
      const updateButton = () => {
        const isFollowing = followRef.current;
        const iconColor = isFollowing ? (palette?.dark || '#000') : '#000';
        const bgColor = isFollowing ? (palette?.accent || '#00bcd4') : '#fff';
        btn.style.backgroundColor = bgColor;
        root.render(React.createElement(FlightIcon, { style: { fontSize: '18px', color: iconColor, transform: 'rotate(45deg)' } }));
      };
      updateFollowButtonRef.current = updateButton;
      updateButton();
      L.DomEvent.on(btn, 'click', (e) => {
        L.DomEvent.stopPropagation(e); L.DomEvent.preventDefault(e);
        const newVal = !followRef.current;
        setFollowPlane(newVal); followRef.current = newVal; updateButton();
      });
      L.DomEvent.disableClickPropagation(container); L.DomEvent.disableScrollPropagation(container);
      return container;
    }
  });
  return new FollowControl().addTo(map);
}

/**
 * Adds the Fetch Nearby POIs control.
 * @param {L.Map} map - Leaflet map instance.
 * @param {{fetchPoisAroundPlane: Function}} deps - Dependency bundle.
 * @returns {L.Control} The created Leaflet control.
 */
export function addFetchPoisControl(map, { fetchPoisAroundPlane }) {
  const FetchPoisControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function () {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      const button = L.DomUtil.create('div', '', container);
      button.title = 'Search nearby POIs';
      Object.assign(button.style, {
        width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#fff'
      });
      const root = createRoot(button);
      root.render(React.createElement(SearchIcon, { style: { fontSize: '18px', color: '#000' } }));
      L.DomEvent.on(button, 'click', (e) => { L.DomEvent.preventDefault(e); L.DomEvent.stopPropagation(e); fetchPoisAroundPlane(); });
      L.DomEvent.disableClickPropagation(container); L.DomEvent.disableScrollPropagation(container);
      return container;
    }
  });
  return new FetchPoisControl().addTo(map);
}

/**
 * Adds the Pause/Play simulator control.
 * @param {L.Map} map - Leaflet map instance.
 * @param {Object} deps
 * @param {any} deps.SimVar - SimVar global used to toggle pause.
 * @param {import('react').MutableRefObject<boolean>} deps.pauseRef - Pause state ref.
 * @param {import('react').MutableRefObject<Function>} deps.updatePauseButtonRef - Ref receiving UI update callback.
 * @param {import('react').MutableRefObject<any>} deps.pauseBlinkIntervalRef - Interval ref to control blinking.
 * @returns {L.Control} The created Leaflet control.
 */
export function addPausePlayControl(map, { SimVar, pauseRef, updatePauseButtonRef, pauseBlinkIntervalRef }) {
  const PausePlayControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function () {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      const btn = L.DomUtil.create('div', '', container);
      btn.title = 'Pause/Resume simulator';
      Object.assign(btn.style, {
        width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#fff'
      });
      btn.setAttribute('aria-label', 'Pause or resume simulator');
      const root = createRoot(btn);
      const renderIcon = () => {
        const isPaused = pauseRef.current;
        root.render(React.createElement(isPaused ? PlayArrowIcon : PauseIcon, { style: { fontSize: '18px', color: '#000' } }));
        btn.title = isPaused ? 'Resume simulator' : 'Pause simulator';
      };
      const applyBlinking = () => {
        const isPaused = pauseRef.current;
        if (pauseBlinkIntervalRef.current) { try { clearInterval(pauseBlinkIntervalRef.current); } catch (_) {} pauseBlinkIntervalRef.current = null; }
        if (isPaused) {
          let green = true; btn.style.backgroundColor = '#00b050';
          pauseBlinkIntervalRef.current = setInterval(() => { green = !green; btn.style.backgroundColor = green ? '#00b050' : '#fff'; }, 1000);
        } else { btn.style.backgroundColor = '#fff'; }
      };
      const updatePauseUI = () => { renderIcon(); applyBlinking(); };
      updatePauseUI(); updatePauseButtonRef.current = updatePauseUI;
      L.DomEvent.on(btn, 'click', (e) => {
        L.DomEvent.stopPropagation(e); L.DomEvent.preventDefault(e);
        const newPaused = !pauseRef.current;
        try {
          if (typeof SimVar?.SetSimVarValue === 'function') { SimVar.SetSimVarValue('K:PAUSE_SET', 'Bool', newPaused ? 1 : 0); }
          else { console.warn('[MapView] SimVar not available to toggle pause'); }
          pauseRef.current = newPaused; updatePauseUI();
        } catch (err) { console.warn('[MapView] Failed to toggle pause state', err); }
      });
      L.DomEvent.disableClickPropagation(container); L.DomEvent.disableScrollPropagation(container);
      return container;
    }
  });
  return new PausePlayControl().addTo(map);
}
