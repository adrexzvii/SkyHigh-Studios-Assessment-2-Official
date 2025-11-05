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

// Create React root and render application
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

