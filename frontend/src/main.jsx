import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import "./index.css";

// ── STRICT GLOBAL ZOOM BLOCKERS ──
document.addEventListener('wheel', function(e) {
  if (e.ctrlKey) {
    e.preventDefault(); // Block Ctrl + Mouse Wheel zoom
  }
}, { passive: false });

document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && (e.key === '=' || e.key === '-' || e.key === '+' || e.key === '0')) {
    e.preventDefault(); // Block Ctrl + Key zoom
  }
});

// Prevent iOS Safari double-tap to zoom
let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, false);
// ────────────────────────────────

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
