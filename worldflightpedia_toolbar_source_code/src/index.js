import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// --- Fix para entornos antiguos (Coherent GT / MSFS) ---
if (typeof globalThis === "undefined") {
  // eslint-disable-next-line no-undef
  window.globalThis = window;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

