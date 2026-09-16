import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import "./index.css";

document.addEventListener(
  "wheel",
  function (e) {
    if (e.ctrlKey) {
      e.preventDefault();
    }
  },
  { passive: false },
);

document.addEventListener("keydown", function (e) {
  if (
    e.ctrlKey &&
    (e.key === "=" || e.key === "-" || e.key === "+" || e.key === "0")
  ) {
    e.preventDefault();
  }
});

// Prevent iOS Safari double-tap to zoom
let lastTouchEnd = 0;
document.addEventListener(
  "touchend",
  function (event) {
    const now = new Date().getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  },
  false,
);
// Suppress benign WebSocket closure rejections from Ably / background transports
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const msg = event?.reason?.message || String(event?.reason || "");
    if (
      msg.includes("Connection closed") ||
      msg.includes("WebSocket is closed") ||
      msg.includes("Connection failed")
    ) {
      event.preventDefault();
    }
  });
}
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

// Register Service Worker for offline & network unreachable fallback
if (typeof window !== "undefined" && "serviceWorker" in navigator && !window.location.hostname.includes("localhost")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

