/**
 * index.js - Application Entry Point
 * 
 * Main entry file for the React application.
 * Includes polyfills for older environments (Coherent GT / MSFS).
 * 
 * @file
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Polyfill for older environments (Coherent GT / MSFS)
// Ensures globalThis is available in legacy browsers
if (typeof globalThis === "undefined") {
  // eslint-disable-next-line no-undef
  window.globalThis = window;
}

// Provide a default COUI help image path used by MSFS/CoherentGT.
// When the UI is hosted inside MSFS, assets are often exposed under the
// `coui://html_ui/...` namespace. If the hosting environment (or a bootstrap
// script) already sets `window.__COUI_HELP_IMAGE`, we respect that. Otherwise
// set a sensible default that points to the packaged asset path the project
// uses: `coui://html_ui/InGamePanels/worldflightpedia-toolbar/media/help_worldflightpedia.png`.
try {
  if (typeof window !== 'undefined' && !window.__COUI_HELP_IMAGE) {
    window.__COUI_HELP_IMAGE = 'coui://html_ui/InGamePanels/worldflightpedia-toolbar/media/help_worldflightpedia.png';
  }
} catch (e) {
  // ignore errors in non-browser environments
}

// Create React root and render application
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

