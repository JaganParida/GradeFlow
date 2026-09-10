import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { parseDeviceDetails } from "./deviceHelper";
import { API_BASE } from "../context/AppContext";

// Special student regNo to strictly NEVER track
const EXCLUDED_STUDENT_REG = "230301120327";

export function useTrafficTracker({ studentSession, studentData, adminToken }) {
  const location = useLocation();

  // Route tracking references for zero-request in-memory aggregation
  const currentRouteRef = useRef(location.pathname);
  const routeStartTimeRef = useRef(Date.now());
  const routeBufferRef = useRef([]); // Accumulates { route, durationSeconds } across student navigation
  const isFlushingRef = useRef(false);

  const isAdminRoute = location.pathname === "/admin" || location.pathname.startsWith("/admin/");
  const isAuthorizedAdmin = Boolean(adminToken) || isAdminRoute;

  // Stable dummy queueState for backwards-compatibility with App.jsx
  const [queueState] = useState({
    inQueue: false,
    position: 0,
    totalInQueue: 0,
    estimatedWaitSecs: 0,
    message: "",
    isAdmitted: true,
  });

  // Resolve student registration number
  const resolveRegNo = () => {
    let storedRegNo = null;
    try {
      storedRegNo = localStorage.getItem("gf_student_reg");
    } catch {}
    const raw = studentSession?.regNo || studentData?.regNo || storedRegNo;
    return raw ? String(raw).toUpperCase().trim() : null;
  };

  // Helper to flush accumulated route buffer in 1 single consolidated batch
  const flushRouteBuffer = (isBeacon = false) => {
    if (isAuthorizedAdmin || isFlushingRef.current) return;

    // Domain check
    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase();
      if (host.includes("grade-flow-navy") || host.includes("gradeflow-navy")) return;
    }

    const regNo = resolveRegNo();
    if (!regNo || regNo === EXCLUDED_STUDENT_REG) return;

    // 1. Add final active route time to buffer if >= 5s
    const now = Date.now();
    const currentDuration = Math.round((now - routeStartTimeRef.current) / 1000);
    if (currentDuration >= 5) {
      routeBufferRef.current.push({
        route: currentRouteRef.current,
        durationSeconds: currentDuration,
      });
      routeStartTimeRef.current = now;
    }

    if (routeBufferRef.current.length === 0) return;

    // 2. Micro-session filter: Skip bounce sessions under 10 seconds total duration
    const totalAccumulatedSecs = routeBufferRef.current.reduce((acc, r) => acc + (r.durationSeconds || 0), 0);
    if (totalAccumulatedSecs < 10) return;

    // 3. Cooldown Guard for periodic in-session flushes (minimum 5 minutes cooldown)
    if (!isBeacon) {
      try {
        const lastFlushStr = sessionStorage.getItem("gf_last_traffic_flush");
        const lastFlushTime = lastFlushStr ? parseInt(lastFlushStr, 10) : 0;
        if (now - lastFlushTime < 5 * 60 * 1000) {
          return;
        }
      } catch {}
    }

    const routesToSend = routeBufferRef.current.slice(-50);
    routeBufferRef.current = []; // Clear in-memory buffer immediately

    try {
      sessionStorage.setItem("gf_last_traffic_flush", String(now));
    } catch {}

    const studentName = studentData?.studentName || studentSession?.studentName || null;
    const branch = studentData?.branch || studentSession?.branch || null;
    const batch = studentData?.batch || studentSession?.batch || null;

    const deviceInfo = parseDeviceDetails({
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      platform: typeof navigator !== "undefined" ? navigator.platform : "",
    });

    const payload = {
      isBatch: true,
      regNo,
      studentName,
      branch,
      batch,
      deviceType: deviceInfo.deviceType,
      os: deviceInfo.os,
      browser: deviceInfo.browser,
      currentRoute: currentRouteRef.current,
      routes: routesToSend,
      isAdmin: false,
    };

    // 4. Dispatch: sendBeacon on tab exit, axios.post for periodic flush
    if (isBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      navigator.sendBeacon(`${API_BASE}/traffic/page-view`, blob);
    } else {
      isFlushingRef.current = true;
      axios
        .post(`${API_BASE}/traffic/page-view`, payload, { withCredentials: true, timeout: 5000 })
        .catch(() => {})
        .finally(() => {
          isFlushingRef.current = false;
        });
    }
  };

  // ─── Zero-Request In-Memory Route Transition Tracking ───
  useEffect(() => {
    if (isAuthorizedAdmin) return;

    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase();
      if (host.includes("grade-flow-navy") || host.includes("gradeflow-navy")) return;
    }

    const regNo = resolveRegNo();
    if (!regNo || regNo === EXCLUDED_STUDENT_REG) return;

    const newRoute = location.pathname;
    const previousRoute = currentRouteRef.current;
    const now = Date.now();
    const timeSpentOnPrevious = Math.round((now - routeStartTimeRef.current) / 1000);

    // If student spent >= 5 seconds on previous page, record it in local memory (0 network requests)
    if (previousRoute !== newRoute && timeSpentOnPrevious >= 5) {
      routeBufferRef.current.push({
        route: previousRoute,
        durationSeconds: timeSpentOnPrevious,
      });
    }

    currentRouteRef.current = newRoute;
    routeStartTimeRef.current = now;
  }, [location.pathname, isAuthorizedAdmin, studentSession?.regNo, studentData?.regNo]);

  // ─── Lifecycle Triggers: Tab Exit & 10-Min Periodic Flush (Zero Tab-Switch Spam) ───
  useEffect(() => {
    if (isAuthorizedAdmin) return;

    const handleExitBeacon = () => {
      flushRouteBuffer(true);
    };

    // Debounced tab switch: Do NOT fire beacon on casual tab switches/minimizes.
    // Only flush if >= 5 minutes elapsed AND student accumulated >= 60s of active engagement.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        const now = Date.now();
        let lastFlushTime = 0;
        try {
          const lastFlushStr = sessionStorage.getItem("gf_last_traffic_flush");
          lastFlushTime = lastFlushStr ? parseInt(lastFlushStr, 10) : 0;
        } catch {}
        const totalSecs = routeBufferRef.current.reduce((acc, r) => acc + (r.durationSeconds || 0), 0);
        if (now - lastFlushTime >= 5 * 60 * 1000 && totalSecs >= 60) {
          flushRouteBuffer(true);
        }
      }
    };

    // Periodic flush every 10 minutes for long continuous study sessions
    const periodicFlushInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        flushRouteBuffer(false);
      }
    }, 10 * 60 * 1000);

    if (typeof window !== "undefined") {
      window.addEventListener("pagehide", handleExitBeacon, { capture: true });
      window.addEventListener("beforeunload", handleExitBeacon);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      clearInterval(periodicFlushInterval);
      if (typeof window !== "undefined") {
        window.removeEventListener("pagehide", handleExitBeacon, { capture: true });
        window.removeEventListener("beforeunload", handleExitBeacon);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [isAuthorizedAdmin, studentSession?.regNo, studentData?.regNo]);

  return {
    queueState,
    leaveQueue: () => {},
    isAuthorizedAdmin,
  };
}
