import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { parseDeviceDetails } from "./deviceHelper";
import { API_BASE } from "../context/AppContext";

// Special student regNo to strictly NEVER track
const EXCLUDED_STUDENT_REG = "230301120327";

export function useTrafficTracker({ studentSession, studentData, adminToken }) {
  const location = useLocation();

  // Route tracking references for zero-request client-side duration calculation
  const currentRouteRef = useRef(location.pathname);
  const routeStartTimeRef = useRef(Date.now());
  const hasLoggedInitialRouteRef = useRef(false);

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

  useEffect(() => {
    // ─── FILTER 1: NEVER track Admin ───
    if (isAuthorizedAdmin) return;

    // Resolve student registration number
    let storedRegNo = null;
    try {
      storedRegNo = localStorage.getItem("gf_student_reg");
    } catch {}

    const rawRegNo = studentSession?.regNo || studentData?.regNo || storedRegNo;
    const regNo = rawRegNo ? String(rawRegNo).toUpperCase().trim() : null;

    // ─── FILTER 2: NEVER track Special Student 230301120327 ───
    if (!regNo || regNo === EXCLUDED_STUDENT_REG) return;

    const studentName = studentData?.studentName || studentSession?.studentName || null;
    const branch = studentData?.branch || studentSession?.branch || null;
    const batch = studentData?.batch || studentSession?.batch || null;

    const deviceInfo = parseDeviceDetails({
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      platform: typeof navigator !== "undefined" ? navigator.platform : "",
    });

    const newRoute = location.pathname;
    const previousRoute = currentRouteRef.current;
    const now = Date.now();
    const timeSpentOnPrevious = Math.round((now - routeStartTimeRef.current) / 1000);

    // Update refs for the current route
    currentRouteRef.current = newRoute;
    routeStartTimeRef.current = now;

    // Helper to send route activity to backend
    const sendActivityLog = (prevRoute, durationSecs) => {
      axios
        .post(
          `${API_BASE}/traffic/page-view`,
          {
            regNo,
            studentName,
            branch,
            batch,
            route: newRoute,
            previousRoute: prevRoute,
            timeSpentSeconds: durationSecs,
            deviceType: deviceInfo.deviceType,
            os: deviceInfo.os,
            browser: deviceInfo.browser,
            isAdmin: false,
          },
          { withCredentials: true, timeout: 5000 }
        )
        .catch(() => {});
    };

    // Case A: Initial page entry on first visit / reload
    if (!hasLoggedInitialRouteRef.current) {
      hasLoggedInitialRouteRef.current = true;
      sendActivityLog(null, 0);
      return;
    }

    // Case B: Route change — only log duration if stayed on previous route >= 5 seconds (ignore instant bounces)
    if (previousRoute !== newRoute) {
      if (timeSpentOnPrevious >= 5) {
        sendActivityLog(previousRoute, timeSpentOnPrevious);
      }
    }
  }, [location.pathname, isAuthorizedAdmin, studentSession?.regNo, studentData?.regNo]);

  // ─── Final session duration beacon on tab close / leave (Zero Interval) ───
  useEffect(() => {
    if (isAuthorizedAdmin) return;

    let storedRegNo = null;
    try {
      storedRegNo = localStorage.getItem("gf_student_reg");
    } catch {}
    const rawRegNo = studentSession?.regNo || studentData?.regNo || storedRegNo;
    const regNo = rawRegNo ? String(rawRegNo).toUpperCase().trim() : null;

    if (!regNo || regNo === EXCLUDED_STUDENT_REG) return;

    const handleExit = () => {
      const durationSeconds = Math.round((Date.now() - routeStartTimeRef.current) / 1000);
      if (durationSeconds < 5) return; // Ignore accidental micro-visits

      const payload = JSON.stringify({
        regNo,
        currentRoute: currentRouteRef.current,
        durationSeconds,
      });

      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon(`${API_BASE}/traffic/leave`, blob);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("pagehide", handleExit, { capture: true });
      window.addEventListener("beforeunload", handleExit);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("pagehide", handleExit, { capture: true });
        window.removeEventListener("beforeunload", handleExit);
      }
    };
  }, [isAuthorizedAdmin, studentSession?.regNo, studentData?.regNo]);

  return {
    queueState,
    leaveQueue: () => {},
    isAuthorizedAdmin,
  };
}
