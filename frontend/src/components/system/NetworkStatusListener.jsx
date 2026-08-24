import React, { useState, useEffect, useCallback } from "react";
import OfflinePage from "./OfflinePage";

export default function NetworkStatusListener({ onNetworkRestored }) {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
      ? navigator.onLine
      : true
  );

  const checkConnectivity = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOnline(false);
      return;
    }
    try {
      const res = await fetch("/favicon.ico?_t=" + Date.now(), {
        method: "HEAD",
        cache: "no-store",
      });
      if (res.ok) {
        setIsOnline(true);
      }
    } catch {
      // Failed to reach server / network disconnected
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (onNetworkRestored) onNetworkRestored();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleCustomOffline = () => {
      setIsOnline(false);
    };

    const handleCustomOnline = () => {
      setIsOnline(true);
      if (onNetworkRestored) onNetworkRestored();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("gradeflow:offline", handleCustomOffline);
    window.addEventListener("gradeflow:online", handleCustomOnline);
    window.addEventListener("focus", checkConnectivity);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("gradeflow:offline", handleCustomOffline);
      window.removeEventListener("gradeflow:online", handleCustomOnline);
      window.removeEventListener("focus", checkConnectivity);
    };
  }, [onNetworkRestored, checkConnectivity]);

  // When offline, render the full-screen clean GradeFlow satellite reconnection view
  if (!isOnline) {
    return (
      <OfflinePage
        onRetry={async () => {
          if (navigator.onLine) {
            setIsOnline(true);
            if (onNetworkRestored) onNetworkRestored();
          } else {
            await checkConnectivity();
          }
        }}
      />
    );
  }

  return null;
}
