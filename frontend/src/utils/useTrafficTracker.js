import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { parseDeviceDetails } from "./deviceHelper";
import { isOldDomainEnvironment } from "./domainHelper";
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

  // Retrieve or create persistent visitor token
  const getOrCreateVisitorToken = () => {
    try {
      let tok = sessionStorage.getItem("gf_visitor_token");
      if (!tok) {
        tok = `vis_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        sessionStorage.setItem("gf_visitor_token", tok);
      }
      return tok;
    } catch {
      return `vis_${Date.now()}`;
    }
  };

  // Retrieve stored 2-hour admission ticket if still valid
  const getStoredAdmissionTicket = () => {
    try {
      const ticket = sessionStorage.getItem("gf_queue_admitted_ticket");
      if (!ticket) return null;
      const match = ticket.match(/^ticket_(\d+)_/);
      if (match) {
        const time = parseInt(match[1], 10);
        if (Date.now() - time < 2 * 60 * 60 * 1000) {
          return ticket;
        }
      }
      sessionStorage.removeItem("gf_queue_admitted_ticket");
      return null;
    } catch {
      return null;
    }
  };

  // Active virtual waiting queue state
  const [queueState, setQueueState] = useState(() => {
    const validTicket = getStoredAdmissionTicket();
    return {
      inQueue: false,
      position: 0,
      totalInQueue: 0,
      estimatedWaitSecs: 0,
      message: "",
      isAdmitted: Boolean(validTicket) || isAuthorizedAdmin,
    };
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
    if (isOldDomainEnvironment()) return;

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

    if (isOldDomainEnvironment()) return;

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

  // ─── Queue Status Checking & Polling (Zero-Waste CPU & Request Throttling) ───
  const checkQueueStatus = async (isPeriodicWait = false) => {
    if (isAuthorizedAdmin || isOldDomainEnvironment()) return;

    const validTicket = getStoredAdmissionTicket();
    if (validTicket) {
      if (queueState.inQueue) {
        setQueueState((prev) => ({ ...prev, inQueue: false, isAdmitted: true }));
      }
      return;
    }

    // Cooldown check for initial / route checks when queue was recently confirmed inactive (60s)
    if (!isPeriodicWait) {
      try {
        const lastInactiveStr = sessionStorage.getItem("gf_queue_last_inactive");
        const lastInactive = lastInactiveStr ? parseInt(lastInactiveStr, 10) : 0;
        if (Date.now() - lastInactive < 60 * 1000) {
          return;
        }
      } catch {}
    }

    const token = getOrCreateVisitorToken();
    const regNo = resolveRegNo();
    const studentName = studentData?.studentName || studentSession?.studentName || null;
    const branch = studentData?.branch || studentSession?.branch || null;
    const batch = studentData?.batch || studentSession?.batch || null;

    const deviceInfo = parseDeviceDetails({
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      platform: typeof navigator !== "undefined" ? navigator.platform : "",
    });

    try {
      const res = await axios.get(`${API_BASE}/traffic/queue-status`, {
        params: {
          token,
          ticket: validTicket,
          regNo,
          studentName,
          branch,
          batch,
          route: currentRouteRef.current || "/",
          deviceType: deviceInfo.deviceType,
          os: deviceInfo.os,
          browser: deviceInfo.browser,
        },
        timeout: 6000,
      });

      if (res.data) {
        if (res.data.isAdmitted || res.data.admitted) {
          if (res.data.ticket) {
            try {
              sessionStorage.setItem("gf_queue_admitted_ticket", res.data.ticket);
            } catch {}
          }
          try {
            sessionStorage.setItem("gf_queue_last_inactive", String(Date.now()));
          } catch {}
          setQueueState({
            inQueue: false,
            position: 0,
            totalInQueue: 0,
            estimatedWaitSecs: 0,
            message: "",
            isAdmitted: true,
          });
        } else if (res.data.inQueue || res.data.queued) {
          try {
            sessionStorage.removeItem("gf_queue_last_inactive");
          } catch {}
          setQueueState({
            inQueue: true,
            position: res.data.position || 1,
            totalInQueue: res.data.totalInQueue || 1,
            estimatedWaitSecs: res.data.estimatedWaitSecs || 15,
            message: res.data.message || "",
            isAdmitted: false,
          });
        } else {
          // Queue inactive
          try {
            sessionStorage.setItem("gf_queue_last_inactive", String(Date.now()));
          } catch {}
          setQueueState({
            inQueue: false,
            position: 0,
            totalInQueue: 0,
            estimatedWaitSecs: 0,
            message: "",
            isAdmitted: true,
          });
        }
      }
    } catch {
      // Network failure: fail open so students are not locked out
    }
  };

  // Check queue on navigation or initial load (throttled by 60s cooldown when inactive)
  useEffect(() => {
    if (isAuthorizedAdmin || isOldDomainEnvironment()) return;
    checkQueueStatus(false);
  }, [location.pathname, isAuthorizedAdmin]);

  // Gentle 12-second polling ONLY when student is actively held in waiting queue
  useEffect(() => {
    if (!queueState.inQueue || isAuthorizedAdmin) return;

    const interval = setInterval(() => {
      checkQueueStatus(true);
    }, 12000);

    return () => clearInterval(interval);
  }, [queueState.inQueue, isAuthorizedAdmin]);

  const leaveQueue = async () => {
    try {
      const token = getOrCreateVisitorToken();
      await axios.post(`${API_BASE}/traffic/queue-leave`, { token }, { timeout: 4000 });
    } catch {}
    try {
      sessionStorage.removeItem("gf_queue_last_inactive");
    } catch {}
    setQueueState({
      inQueue: false,
      position: 0,
      totalInQueue: 0,
      estimatedWaitSecs: 0,
      message: "",
      isAdmitted: true,
    });
  };

  return {
    queueState,
    leaveQueue,
    isAuthorizedAdmin,
  };
}
