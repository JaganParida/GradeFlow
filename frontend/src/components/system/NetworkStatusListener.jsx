import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function NetworkStatusListener({ onNetworkRestored }) {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
      ? navigator.onLine
      : true
  );
  const [showRestoredNotice, setShowRestoredNotice] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestoredNotice(true);
      if (onNetworkRestored) onNetworkRestored();

      const timer = setTimeout(() => {
        setShowRestoredNotice(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestoredNotice(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [onNetworkRestored]);

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      // Fast ping check
      const res = await fetch("/favicon.ico?t=" + Date.now(), { method: "HEAD", cache: "no-store" });
      if (res.ok) {
        setIsOnline(true);
        setShowRestoredNotice(true);
        setTimeout(() => setShowRestoredNotice(false), 3500);
      }
    } catch {
      setIsOnline(false);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 76,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 99999,
        padding: "0 16px",
      }}
    >
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{
              pointerEvents: "auto",
              background: "#0f172a",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              color: "#f8fafc",
              padding: "8px 18px",
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
              fontWeight: 600,
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25), 0 0 1px rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(12px)",
              maxWidth: "92vw",
              boxSizing: "border-box",
            }}
            role="status"
            aria-live="polite"
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#f59e0b",
                boxShadow: "0 0 8px #f59e0b",
                flexShrink: 0,
              }}
            />
            <span style={{ whiteSpace: "nowrap" }}>
              Working offline &bull; Data will sync when reconnected
            </span>
            <button
              type="button"
              onClick={handleManualCheck}
              disabled={isChecking}
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                border: "none",
                color: "#ffffff",
                padding: "3px 9px",
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 700,
                cursor: isChecking ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginLeft: 4,
                outline: "none",
              }}
            >
              <RefreshCw size={11} className={isChecking ? "gf-spin" : ""} />
              <span>{isChecking ? "Checking..." : "Retry"}</span>
            </button>
          </motion.div>
        )}

        {isOnline && showRestoredNotice && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{
              pointerEvents: "auto",
              background: "#0f172a",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#f8fafc",
              padding: "8px 18px",
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
              fontWeight: 600,
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
              backdropFilter: "blur(12px)",
              maxWidth: "92vw",
              boxSizing: "border-box",
            }}
            role="status"
            aria-live="polite"
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#10b981",
                boxShadow: "0 0 8px #10b981",
                flexShrink: 0,
              }}
            />
            <span style={{ whiteSpace: "nowrap" }}>
              Back online &bull; Connection restored
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
