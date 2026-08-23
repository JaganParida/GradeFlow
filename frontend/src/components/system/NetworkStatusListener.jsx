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

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestoredNotice(true);
      if (onNetworkRestored) onNetworkRestored();

      const timer = setTimeout(() => {
        setShowRestoredNotice(false);
      }, 4000);
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

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "fixed",
            top: 72,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 99999,
            background: "#451a03",
            border: "1px solid #b45309",
            color: "#fef3c7",
            padding: "8px 16px",
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12.5,
            fontWeight: 650,
            boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
            boxSizing: "border-box",
            whiteSpace: "nowrap",
          }}
          role="status"
          aria-live="polite"
        >
          <WifiOff size={14} color="#f59e0b" />
          <span>You're offline &bull; Data will sync when reconnected</span>
        </motion.div>
      )}

      {isOnline && showRestoredNotice && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "fixed",
            top: 72,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 99999,
            background: "#064e3b",
            border: "1px solid #059669",
            color: "#d1fae5",
            padding: "8px 16px",
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12.5,
            fontWeight: 650,
            boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
            boxSizing: "border-box",
            whiteSpace: "nowrap",
          }}
          role="status"
          aria-live="polite"
        >
          <Wifi size={14} color="#34d399" />
          <span>Back online &bull; Connection restored</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
