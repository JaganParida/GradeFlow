import React, { useState, useEffect } from "react";
import OfflinePage from "./OfflinePage";

export default function NetworkStatusListener({ onNetworkRestored }) {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
      ? navigator.onLine
      : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (onNetworkRestored) onNetworkRestored();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [onNetworkRestored]);

  // When offline, render the full-screen Google-style animated runner game page instead of a floating pill badge
  if (!isOnline) {
    return (
      <OfflinePage
        onRetry={() => {
          if (navigator.onLine) {
            setIsOnline(true);
            if (onNetworkRestored) onNetworkRestored();
          } else {
            window.location.reload();
          }
        }}
      />
    );
  }

  return null;
}
