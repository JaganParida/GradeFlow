import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { createAblyRealtime, subscribeAdminChannel, closeSharedAdminAbly } from "../services/ablyClient";
import { invalidateAdminCache, AdminCacheScopes } from "../utils/adminRealtimeCache";
import { isOldDomainEnvironment } from "../utils/domainHelper";

export const API_BASE = import.meta.env.VITE_API_URL || "/api";

// Set axios to send cookies with every request
axios.defaults.withCredentials = true;

axios.interceptors.request.use((config) => {
  try {
    config.headers = config.headers || {};
    // Attach CSRF protection header for state-changing browser requests
    config.headers["X-Requested-With"] = "XMLHttpRequest";
  } catch {}
  return config;
});

const AppCtx = createContext();

// Explicit list of obsolete legacy auth/session keys to proactively wipe from browser storage
const OBSOLETE_AUTH_STORAGE_KEYS = [
  "gf_student_jwt",
  "gf_student_session",
  "gf_student_session_cache",
  "gf_student_data",
  "gf_admin_jwt",
  "gf_admin_token",
  "admin_jwt",
  "adminToken",
  "gf_admin_session",
  "gf_admin_active_session",
  "gf_admin_last_session",
  "gf_admin_logged_in",
  "gf_cache_version",
  "jwt",
  "token",
  "accessToken",
  "refreshToken",
  "authToken",
  "isAdmin",
  "isLoggedIn",
];

export function AppProvider({ children }) {
  // Proactively wipe all obsolete authentication keys on startup
  useEffect(() => {
    try {
      OBSOLETE_AUTH_STORAGE_KEYS.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    } catch {}
  }, []);

  // Browser Presence Cookie Helpers (UI/Optimization Hint Only — Never Authoritative)
  const getAuthPresence = useCallback(() => {
    if (typeof document === "undefined") return false;
    return document.cookie.split(";").some((c) => c.trim().startsWith("gf_auth_present=1"));
  }, []);

  const setAuthPresence = useCallback(() => {
    if (typeof document === "undefined") return;
    const isProd = window.location.protocol === "https:";
    const secureFlag = isProd ? "; Secure" : "";
    document.cookie = `gf_auth_present=1; Path=/; SameSite=Lax${secureFlag}; Max-Age=5184000`;
  }, []);

  const clearAuthPresence = useCallback(() => {
    if (typeof document === "undefined") return;
    const isProd = window.location.protocol === "https:";
    const secureFlag = isProd ? "; Secure" : "";
    document.cookie = `gf_auth_present=; Path=/; SameSite=Lax${secureFlag}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }, []);

  // Detect if running on old retired domain (saves 100% serverless CPU on old Vercel deployment)
  const isOldDomain = isOldDomainEnvironment();

  // ─── Explicit Authentication Lifecycle States ───────────────────
  // authStatus: "BOOTSTRAPPING" | "AUTHENTICATED" | "UNAUTHENTICATED" | "AUTH_ERROR"
  const [authStatus, setAuthStatus] = useState(isOldDomain ? "UNAUTHENTICATED" : "BOOTSTRAPPING");
  const [adminAuthStatus, setAdminAuthStatus] = useState(isOldDomain ? "UNAUTHENTICATED" : "BOOTSTRAPPING");
  const [authChecking, setAuthChecking] = useState(!isOldDomain);

  const [studentData, setStudentData] = useState(null);
  const [studentSession, rawSetStudentSession] = useState(null);

  const setStudentSession = useCallback((studentOrUpdater) => {
    rawSetStudentSession((prev) => {
      const next = typeof studentOrUpdater === "function" ? studentOrUpdater(prev) : studentOrUpdater;
      if (next && next.regNo) {
        try { localStorage.setItem("gf_student_reg", String(next.regNo).trim()); } catch {}
        if (next.sessionId) {
          try { localStorage.setItem("gf_student_session_hint", String(next.sessionId).trim()); } catch {}
        }
      } else if (!next) {
        try { localStorage.removeItem("gf_student_reg"); } catch {}
        try { localStorage.removeItem("gf_student_session_hint"); } catch {}
      }
      return next;
    });
  }, []);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rankingsVersion, setRankingsVersion] = useState(null);
  
  // In-memory administrative authentication state — NOT persisted in localStorage
  const [adminToken, setAdminToken] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);
  const adminProfileRef = useRef(adminProfile);
  useEffect(() => {
    adminProfileRef.current = adminProfile;
  }, [adminProfile]);

  const studentSessionRef = useRef(studentSession);
  useEffect(() => {
    studentSessionRef.current = studentSession;
  }, [studentSession]);

  const adminTokenRef = useRef(adminToken);
  useEffect(() => {
    adminTokenRef.current = adminToken;
  }, [adminToken]);
  const [adminDeviceCount, setAdminDeviceCount] = useState(0);
  const [isAdminButtonVisible, setIsAdminButtonVisible] = useState(true);
  const [adminButtonConfig, setAdminButtonConfig] = useState(() => ({
    mode: "AUTO",
    allowedRoles: {
      mainAdmin: true,
      subAdmin: true,
      specialStudent: true,
      allStudents: false,
      guests: false,
    },
  }));

  // In-flight bootstrap promise ref for 100% request deduplication
  const inFlightBootstrapRef = useRef(null);
  const inFlightStudentFetchRef = useRef({});
  const lastForceRefreshTsRef = useRef(0);
  const lastRevalidateTsRef = useRef(0);
  const lastAttendanceSyncIdRef = useRef(null);
  const lastAttendanceSaveTsRef = useRef(0);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const isRealtimeConnectedRef = useRef(false);
  const navigate = useNavigate();

  const recordAttendanceSave = useCallback((syncId) => {
    lastAttendanceSyncIdRef.current = syncId;
    lastAttendanceSaveTsRef.current = Date.now();
  }, []);

  // Check live admin device occupancy & portal visibility config
  const checkAdminStatus = async () => {
    if (isOldDomain) return null;
    try {
      const headers = {};
      try {
        const hint = localStorage.getItem("gf_admin_session_hint");
        if (hint) headers["x-admin-last-session"] = hint;
      } catch {}
      const res = await axios.get(`${API_BASE}/auth/admin/check-status`, {
        headers,
        withCredentials: true,
        timeout: 4000,
      });
      if (res.data && res.data.success) {
        const count = res.data.activeDeviceCount ?? 0;
        setAdminDeviceCount(count);
        if (res.data.adminButtonConfig) {
          setAdminButtonConfig(res.data.adminButtonConfig);
        }
        if (typeof res.data.isAdminButtonVisible === "boolean") {
          setIsAdminButtonVisible(res.data.isAdminButtonVisible);
        } else {
          setIsAdminButtonVisible(count < 2);
        }
        return res.data;
      }
    } catch (err) {
      console.warn("Failed to check admin device status:", err.message);
    }
    return null;
  };

  const fetchAdminButtonConfig = async () => {
    if (isOldDomain) return null;
    try {
      const res = await axios.get(`${API_BASE}/admin/portal-visibility`, {
        withCredentials: true,
        timeout: 4000,
      });
      if (res.data && res.data.success && res.data.config) {
        setAdminButtonConfig(res.data.config);
        return res.data;
      }
    } catch (err) {
      console.warn("Failed to fetch admin button config:", err.message);
    }
    return null;
  };

  // ─── Theme Management ────────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("gf_theme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("gf_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // ─── Global Maintenance Mode State ───────────────────────────────
  const [maintenance, setMaintenance] = useState(() => {
    try {
      const cached = sessionStorage.getItem("gf_maintenance_cache");
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}
    return {
      enabled: false,
      message: "",
      enabledAt: null,
    };
  });
  const [maintenanceChecked, setMaintenanceChecked] = useState(() => {
    try {
      return Boolean(sessionStorage.getItem("gf_maintenance_cache"));
    } catch {
      return false;
    }
  });

  const checkMaintenanceStatus = async () => {
    if (isOldDomain) {
      setMaintenanceChecked(true);
      return { enabled: false };
    }
    try {
      const res = await axios.get(`${API_BASE}/system/maintenance?t=${Date.now()}`, {
        headers: { "Cache-Control": "no-cache" },
        timeout: 3000,
      });
      if (res.data && typeof res.data.enabled === "boolean") {
        const updated = {
          enabled: res.data.enabled,
          message: res.data.message || "",
          enabledAt: res.data.enabledAt || null,
        };
        setMaintenance(updated);
        try {
          sessionStorage.setItem("gf_maintenance_cache", JSON.stringify(updated));
        } catch {}
        setMaintenanceChecked(true);
        return res.data;
      }
    } catch (err) {
      console.warn("Failed to check maintenance status:", err.message);
    } finally {
      setMaintenanceChecked(true);
    }
    return { enabled: false };
  };

  // ─── Unified, Single-Roundtrip Authentication Bootstrap ──────────
  const bootstrapAuthentication = useCallback(async (isSilent = false) => {
    if (isOldDomain) {
      setAuthChecking(false);
      setAuthStatus("UNAUTHENTICATED");
      setAdminAuthStatus("UNAUTHENTICATED");
      return { success: false, skipped: true };
    }

    if (inFlightBootstrapRef.current) {
      return inFlightBootstrapRef.current;
    }

    if (!isSilent) {
      setAuthStatus((prev) => (prev === "BOOTSTRAPPING" ? prev : "BOOTSTRAPPING"));
      setAuthChecking(true);
    }

    const bootstrapPromise = (async () => {
      try {
        // Clean up any legacy bootstrap cache to guarantee live server-side cookie verification
        try {
          sessionStorage.removeItem("gf_bootstrap_cache");
        } catch (_) {}

        const bootstrapHeaders = {
          "Cache-Control": "no-cache",
        };
        try {
          const adminHint = localStorage.getItem("gf_admin_session_hint");
          if (adminHint) {
            bootstrapHeaders["x-admin-last-session"] = adminHint;
          }
          const studentHint = localStorage.getItem("gf_student_session_hint");
          if (studentHint) {
            bootstrapHeaders["x-student-last-session"] = studentHint;
          }
        } catch (_) {}

        const res = await axios.get(`${API_BASE}/auth/bootstrap`, {
          withCredentials: true,
          // Serverless cold starts and slow mobile networks can take longer than
          // six seconds. Do not mistake an unfinished cookie validation for a
          // logged-out student.
          timeout: 15000,
          headers: bootstrapHeaders,
        });

        if (res.data && res.data.success) {
          const { student, admin, adminDeviceCount: devCount, isAdminButtonVisible: btnVis, adminButtonConfig: btnConfig, maintenance: maint } = res.data;

          // 1. Hydrate Student Session
          if (student && student.regNo && student.sessionId) {
            setStudentSession(student);
            setAuthStatus("AUTHENTICATED");
            try { localStorage.setItem("gf_student_session_hint", String(student.sessionId).trim()); } catch {}
            // Only non-blocking fetch session profile if we are not currently viewing a specific student route
            const path = typeof window !== "undefined" ? window.location.pathname : "";
            const isViewingSpecificRoute =
              path.startsWith("/dashboard/") ||
              path.startsWith("/analytics/") ||
              path.startsWith("/attendance/") ||
              path.startsWith("/timetable/");

            if (!isViewingSpecificRoute) {
              fetchStudent(student.regNo, 2, 500).catch(() => {});
            }
          } else {
            setStudentSession(null);
            setStudentData(null);
            setAuthStatus("UNAUTHENTICATED");
            try { localStorage.removeItem("gf_student_session_hint"); } catch {}
          }

          // 2. Hydrate Admin Session (Pure In-Memory State)
          if (admin && admin.authenticated) {
            setAdminToken(true);
            setAdminProfile(admin);
            setAdminAuthStatus("AUTHENTICATED");
            if (admin.sessionId) {
              try { localStorage.setItem("gf_admin_session_hint", String(admin.sessionId).trim()); } catch {}
            }
          } else {
            setAdminToken(false);
            setAdminProfile(null);
            setAdminAuthStatus("UNAUTHENTICATED");
            try { localStorage.removeItem("gf_admin_session_hint"); } catch {}
          }

          // 3. Hydrate Admin Occupancy & Button Visibility
          if (btnConfig) {
            setAdminButtonConfig(btnConfig);
          }
          if (typeof devCount === "number") {
            setAdminDeviceCount(devCount);
            if (typeof btnVis === "boolean") {
              setIsAdminButtonVisible(btnVis);
            } else {
              setIsAdminButtonVisible(devCount < 2);
            }
          }

          // 4. Hydrate Maintenance State
          if (maint) {
            const maintObj = {
              enabled: Boolean(maint.enabled),
              message: maint.message || "",
              enabledAt: maint.enabledAt || null,
            };
            setMaintenance(maintObj);
            try {
              sessionStorage.setItem("gf_maintenance_cache", JSON.stringify(maintObj));
            } catch {}
            setMaintenanceChecked(true);
          }

          if ((student && student.regNo) || (admin && admin.authenticated)) {
            setAuthPresence();
          } else {
            clearAuthPresence();
          }

          return res.data;
        } else {
          setAuthStatus("UNAUTHENTICATED");
          setAdminAuthStatus("UNAUTHENTICATED");
          clearAuthPresence();
          try {
            localStorage.removeItem("gf_admin_session_hint");
            localStorage.removeItem("gf_student_session_hint");
          } catch {}
        }
      } catch (err) {
        console.warn("Authentication bootstrap could not be resolved:", err.message);
        if (err.response?.status === 401 || err.response?.status === 403) {
          clearAuthPresence();
          try {
            localStorage.removeItem("gf_admin_session_hint");
            localStorage.removeItem("gf_student_session_hint");
          } catch {}
        }
        // A timeout/offline response cannot prove that a cookie is missing.
        // Keep this distinct from an explicit successful unauthenticated
        // response so protected navigation never flashes the login state.
        if (!isSilent) {
          setAuthStatus("AUTH_ERROR");
          setAdminAuthStatus("AUTH_ERROR");
        }
      } finally {
        setAuthChecking(false);
        setMaintenanceChecked(true);
        inFlightBootstrapRef.current = null;
      }
      return null;
    })();

    inFlightBootstrapRef.current = bootstrapPromise;
    return bootstrapPromise;
  }, []);

  // Used by click handlers while the app is still reading HTTP-only cookies.
  // It reuses the current request (rather than reloading the page) and retries
  // a failed network verification on the next protected action.
  const waitForAuthResolution = useCallback(async () => {
    if (authChecking || authStatus === "BOOTSTRAPPING" || authStatus === "AUTH_ERROR") {
      const result = await bootstrapAuthentication();
      return result?.student?.regNo ? result.student : null;
    }
    return studentSession;
  }, [authChecking, authStatus, bootstrapAuthentication, studentSession]);

  // ─── Initial Startup Bootstrap & Lifecycle Listeners ─────────────
  const lastFocusBootstrapRef = useRef(0);

  useEffect(() => {
    bootstrapAuthentication();

    // Passive silent revalidation on tab focus (throttled to 30 minutes to eliminate redundant serverless invocations)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        if (now - lastFocusBootstrapRef.current > 1800000) {
          lastFocusBootstrapRef.current = now;
          bootstrapAuthentication(true);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [bootstrapAuthentication]);

  // Recover automatically from a cold-start/temporary network failure without
  // ever converting the unknown cookie state into a false logged-out state.
  useEffect(() => {
    if (authStatus !== "AUTH_ERROR") return undefined;

    const retryBootstrap = () => bootstrapAuthentication();
    const retryTimer = window.setTimeout(retryBootstrap, 5000);
    window.addEventListener("online", retryBootstrap, { once: true });

    return () => {
      window.clearTimeout(retryTimer);
      window.removeEventListener("online", retryBootstrap);
    };
  }, [authStatus, bootstrapAuthentication]);

  // ─── Admin Logout Handler ─────────────────────────────────────────
  const adminLogout = useCallback(async (shouldNavigate = true) => {
    try {
      OBSOLETE_AUTH_STORAGE_KEYS.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      let activeSessionId = adminProfileRef.current?.sessionId || "";
      if (!activeSessionId) {
        try {
          activeSessionId = localStorage.getItem("gf_admin_session_hint") || "";
        } catch {}
      }

      const res = await axios.post(
        `${API_BASE}/auth/admin/logout`,
        { sessionId: activeSessionId },
        {
          headers: activeSessionId ? { "x-admin-last-session": activeSessionId } : {},
          withCredentials: true,
        }
      );

      if (res?.data) {
        if (typeof res.data.isAdminButtonVisible === "boolean") {
          setIsAdminButtonVisible(res.data.isAdminButtonVisible);
        }
        if (typeof res.data.activeDeviceCount === "number") {
          setAdminDeviceCount(res.data.activeDeviceCount);
        }
      }
    } catch (err) {
      console.warn("Logout error:", err.message);
    } finally {
      try {
        localStorage.removeItem("gf_admin_session_hint");
      } catch {}
      closeSharedAdminAbly();
      setAdminToken(false);
      setAdminProfile(null);
      // Only clear client auth presence cookie if no student session remains active
      if (!studentSessionRef.current) {
        clearAuthPresence();
      }
      if (shouldNavigate || (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"))) {
        navigate("/admin");
      }
    }
  }, [navigate]);

  const logoutAdmin = adminLogout;

  // ─── Active Admin Ably Realtime Event Subscriptions (Zero Polling) ────
  useEffect(() => {
    if (!adminToken) {
      closeSharedAdminAbly();
      return;
    }

    const unsubs = [];

    // Targeted or global session revocation: log out if this session was revoked
    unsubs.push(
      subscribeAdminChannel("admin-control", "session-revoked", (msg) => {
        const mySessionId = adminProfileRef.current?.sessionId;
        const targetRevoked = msg?.data?.sessionId || msg?.data?.revokedSessionId;
        const isRevokeAll = msg?.data?.all === true || targetRevoked === "ALL";
        const exceptSessionId = msg?.data?.exceptSessionId;
        if (isRevokeAll) {
          if (!exceptSessionId || (mySessionId && exceptSessionId !== mySessionId)) {
            console.warn("[AdminAbly] All admin sessions revoked:", msg?.data);
            adminLogout();
          }
        } else if (targetRevoked && mySessionId && targetRevoked === mySessionId) {
          console.warn("[AdminAbly] This device session was revoked:", msg?.data);
          adminLogout();
        }
      })
    );

    // ── Realtime Event-Driven Cache Invalidation Subscriptions ──
    unsubs.push(
      subscribeAdminChannel("admin-control", "attendance-updated", () => {
        invalidateAdminCache(AdminCacheScopes.ATTENDANCE);
      })
    );

    unsubs.push(
      subscribeAdminChannel("admin-control", "timetable-updated", () => {
        invalidateAdminCache(AdminCacheScopes.TIMETABLE);
      })
    );

    unsubs.push(
      subscribeAdminChannel("admin-control", "rankings-updated", () => {
        invalidateAdminCache(AdminCacheScopes.RANKINGS);
        invalidateAdminCache(AdminCacheScopes.STATS);
        invalidateAdminCache(AdminCacheScopes.TOPPERS);
        invalidateAdminCache(AdminCacheScopes.BACKLOGS);
      })
    );

    unsubs.push(
      subscribeAdminChannel("admin-control", "feedback-updated", () => {
        invalidateAdminCache(AdminCacheScopes.FEEDBACK);
      })
    );

    unsubs.push(
      subscribeAdminChannel("admin-control", "otp-updated", () => {
        invalidateAdminCache(AdminCacheScopes.OTP);
      })
    );

    unsubs.push(
      subscribeAdminChannel("admin-control", "admin-cache-invalidate", (msg) => {
        invalidateAdminCache(msg?.data?.scope || AdminCacheScopes.ALL);
      })
    );

    // Also receive broadcast updates via the shared admin connection
    unsubs.push(
      subscribeAdminChannel("broadcasts-all", "admin-availability-updated", (msg) => {
        if (!msg?.data) return;
        const { activeDeviceCount: newDevCount, isAdminButtonVisible: newBtnVis } = msg.data;
        if (typeof newDevCount === "number") {
          setAdminDeviceCount(newDevCount);
        }
        if (typeof newBtnVis === "boolean") {
          setIsAdminButtonVisible(newBtnVis);
        }
      })
    );

    unsubs.push(
      subscribeAdminChannel("broadcasts-all", "timetable-updated", (msg) => {
        try {
          sessionStorage.removeItem("gf_schedules_cache");
        } catch (_) {}
        window.dispatchEvent(new CustomEvent("gradeflow:timetable-updated", { detail: msg?.data }));
      })
    );

    return () => {
      unsubs.forEach((unsub) => {
        if (typeof unsub === "function") unsub();
      });
    };
  }, [adminToken, adminLogout]);

  // ─── Student In-App Notifications & Realtime SSE Stream ──────────
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionRevokedNotice, setSessionRevokedNotice] = useState(null);

  const fetchNotifications = async () => {
    if (!studentSession?.regNo || !studentSession?.sessionId) {
      setNotifications([]);
      setUnreadCount(0);
      return null;
    }
    try {
      const res = await axios.get(`${API_BASE}/notifications/student`, { withCredentials: true });
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
        return res.data;
      }
    } catch (err) {
      if (err.response?.status === 401) {
        // Session terminated or transferred to another device
        setSessionRevokedNotice(
          err.response?.data?.message || "Your session ended because your account was approved on another device."
        );
        setTimeout(() => {
          setStudentSession(null);
          setStudentData(null);
          setAuthStatus("UNAUTHENTICATED");
          navigate("/", { replace: true });
        }, 800);
      }
    }
    return null;
  };

  const handleNotificationAction = async (notificationId, actionType) => {
    if (actionType === "CHECK_NOW") {
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === notificationId ? { ...n, isRead: true, status: "READ" } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } else if (actionType === "UNDERSTOOD" || actionType === "DISMISS") {
      setNotifications((prev) => prev.filter((n) => n.notificationId !== notificationId));
      setUnreadCount((c) => Math.max(0, c - 1));
    }

    try {
      const regNo = studentSession?.regNo || "";
      const ua = navigator?.userAgent || "";
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const os = /Android/i.test(ua)
        ? "Android"
        : /iPhone|iPad|iPod/i.test(ua)
        ? "iOS"
        : /Windows/i.test(ua)
        ? "Windows"
        : /Macintosh|Mac OS/i.test(ua)
        ? "macOS"
        : "Linux";
      const browser = /Edg/i.test(ua)
        ? "Edge"
        : /Chrome/i.test(ua)
        ? "Chrome"
        : /Firefox/i.test(ua)
        ? "Firefox"
        : /Safari/i.test(ua)
        ? "Safari"
        : "Browser";
      const deviceString = `${isMobile ? "Mobile" : "Desktop"} · ${browser} (${os})`;

      const res = await axios.post(
        `${API_BASE}/notifications/action`,
        { notificationId, actionType, regNo, device: deviceString },
        { withCredentials: true }
      );
      if (res.data?.success && res.data?.targetRoute && actionType === "CHECK_NOW") {
        const route = res.data.targetRoute;
        if (route.startsWith("http://") || route.startsWith("https://")) {
          window.open(route, "_blank", "noopener,noreferrer");
        } else {
          navigate(route);
        }
      }
      return res.data;
    } catch (err) {
      console.warn("Notification action error:", err);
      return { success: false };
    }
  };

  const approveLoginRequest = async (requestId) => {
    // 1. Immediate optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.approvalRequestId === requestId ? { ...n, status: "APPROVED" } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      const res = await axios.post(`${API_BASE}/notifications/approve`, { requestId }, { withCredentials: true });
      if (res.data?.success) {
        // Laptop just approved the request and transferred the session to the new device!
        setSessionRevokedNotice(
          "Session Transferred: You approved access from your other device. This session has been transferred."
        );
        // Cleanly wipe in-memory session on this device
        setStudentSession(null);
        setStudentData(null);
        setAuthStatus("UNAUTHENTICATED");
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 1200);
        return { success: true, message: res.data.message };
      }
      // Revert if server failed
      await fetchNotifications().catch(() => {});
      return { success: false, message: res.data?.message || "Failed to approve request." };
    } catch (err) {
      await fetchNotifications().catch(() => {});
      return { success: false, message: err.response?.data?.message || "Failed to approve request." };
    }
  };

  const denyLoginRequest = async (requestId) => {
    // 1. Immediate optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.approvalRequestId === requestId ? { ...n, status: "DENIED" } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      const res = await axios.post(`${API_BASE}/notifications/deny`, { requestId }, { withCredentials: true });
      if (res.data?.success) {
        fetchNotifications().catch(() => {});
        return { success: true, message: res.data.message };
      }
      // Revert if server failed
      await fetchNotifications().catch(() => {});
      return { success: false, message: res.data?.message || "Failed to deny request." };
    } catch (err) {
      await fetchNotifications().catch(() => {});
      return { success: false, message: err.response?.data?.message || "Failed to deny request." };
    }
  };

  const markNotificationsRead = async () => {
    try {
      await axios.post(`${API_BASE}/notifications/mark-read`, {}, { withCredentials: true });
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) =>
          n.status === "UNREAD" || !n.isRead ? { ...n, status: "READ", isRead: true } : n
        )
      );
    } catch {}
  };

  // ─── Global Realtime Broadcasts (Anonymous Visitors & Unauthenticated Guests) ──
  useEffect(() => {
    // Only connect anonymous guest client if user is NOT logged in as admin or student
    if (adminToken || (studentSession && studentSession.regNo)) {
      return;
    }

    let isMounted = true;
    let globalAbly = null;
    let globalBroadcastChannel = null;

    try {
      globalAbly = createAblyRealtime();
      globalBroadcastChannel = globalAbly.channels.get("broadcasts-all");

      globalBroadcastChannel.subscribe("admin-availability-updated", (msg) => {
        if (!isMounted || !msg?.data) return;
        const { activeDeviceCount: newDevCount, isAdminButtonVisible: newBtnVis } = msg.data;
        if (typeof newDevCount === "number") {
          setAdminDeviceCount(newDevCount);
        }
        if (typeof newBtnVis === "boolean") {
          setIsAdminButtonVisible(newBtnVis);
        }
      });

      globalBroadcastChannel.subscribe("timetable-updated", (msg) => {
        if (!isMounted) return;
        try {
          sessionStorage.removeItem("gf_schedules_cache");
        } catch (_) {}
        window.dispatchEvent(new CustomEvent("gradeflow:timetable-updated", { detail: msg?.data }));
      });
    } catch (err) {
      console.warn("[GlobalAbly] Setup warning:", err?.message || err);
    }

    return () => {
      isMounted = false;
      if (globalBroadcastChannel) {
        try {
          globalBroadcastChannel.unsubscribe();
        } catch (_) {}
      }
      if (globalAbly) {
        try {
          const p = globalAbly.close();
          if (p && typeof p.catch === "function") p.catch(() => {});
        } catch (_) {}
      }
    };
  }, [adminToken, studentSession?.regNo]);

  // ─── Dual-Ably Realtime Handover & Notification Sync (0 Polling, 0 Extra CPU) ───
  useEffect(() => {
    if (!studentSession || !studentSession.regNo || !studentSession.sessionId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let isMounted = true;
    const cleanReg = String(studentSession.regNo).trim().toUpperCase();

    // 1. Initial single fetch on mount — with TTL gate to skip if recently fetched.
    //    Ably WebSocket delivers real-time notifications instantly; mount fetch is safety net only.
    const NOTIF_MOUNT_TTL_MS = 2 * 60 * 1000; // 2 minutes
    const notifLastFetchKey = "gf_notif_last_fetch";
    try {
      const lastFetch = sessionStorage.getItem(notifLastFetchKey);
      if (!lastFetch || (Date.now() - Number(lastFetch)) > NOTIF_MOUNT_TTL_MS) {
        fetchNotifications();
        sessionStorage.setItem(notifLastFetchKey, String(Date.now()));
      }
    } catch (_) {
      fetchNotifications(); // Fallback: always fetch if sessionStorage fails
    }

    // 2. Initialize Ably Realtime Client (automatically routes to Key 1 or Key 2)
    let ably = null;
    let studentChannel = null;
    let broadcastChannel = null;

    try {
      ably = createAblyRealtime(cleanReg);
      studentChannel = ably.channels.get(`student-${cleanReg}`);
      broadcastChannel = ably.channels.get("broadcasts-all");

      // Track Ably connection state for Graceful Fallback Mode (Risk 2)
      ably.connection.on((stateChange) => {
        if (!isMounted) return;
        const isConn = stateChange.current === "connected";
        setIsRealtimeConnected(isConn);
        isRealtimeConnectedRef.current = isConn;
        if (isConn) {
          // Reconnection catch-up: silently check if data changed during disconnection
          if (cleanReg) {
            fetchStudent(cleanReg, 1, 500, false).catch(() => {});
          }
        }
      });

      // A. Listen for instant login approval requests on active device (<0.1s)
      studentChannel.subscribe("new-notification", (msg) => {
        if (!isMounted || !msg?.data) return;
        const newNotif = msg.data.notification;
        if (!newNotif) return;

        setNotifications((prev) => {
          const exists = prev.some((n) => n.notificationId === newNotif.notificationId);
          if (exists) return prev;
          return [newNotif, ...prev];
        });
        setUnreadCount((c) => c + 1);
      });

      // B. Listen for approval response updates (APPROVED / DENIED)
      studentChannel.subscribe("notification-updated", (msg) => {
        if (!isMounted || !msg?.data?.requestId) return;
        const { requestId, status } = msg.data;
        setNotifications((prev) =>
          prev.map((n) => (n.approvalRequestId === requestId ? { ...n, status } : n))
        );
      });

      // C. Listen for session revocation (when another device is approved or admin revokes session)
      studentChannel.subscribe("session-revoked", (msg) => {
        if (!isMounted || !msg?.data) return;
        const targetRevokedId = msg.data.revokedSessionId || msg.data.sessionId;
        const currentSessionId = studentSessionRef.current?.sessionId || studentSession?.sessionId;
        if (msg.data.allSessionsRevoked || !targetRevokedId || (currentSessionId && targetRevokedId === currentSessionId)) {
          setSessionRevokedNotice(
            msg.data.message || "Your session ended because your account was approved on another device."
          );
          setStudentSession(null);
          setStudentData(null);
          setAuthStatus("UNAUTHENTICATED");
          navigate("/", { replace: true });
        }
      });

      // D. Listen for real-time admin broadcast announcements across all students
      broadcastChannel.subscribe("new-broadcast", (msg) => {
        if (!isMounted || !msg?.data) return;
        const newBroadcast = msg.data;
        setNotifications((prev) => {
          const exists = prev.some((n) => n.notificationId === newBroadcast.notificationId);
          if (exists) return prev;
          return [newBroadcast, ...prev];
        });
        setUnreadCount((c) => c + 1);
      });

      // E. Listen for real-time ranking & results updates across all active students (<1s)
      broadcastChannel.subscribe("rankings-updated", (msg) => {
        if (!isMounted || !msg?.data) return;
        const newVer = msg.data.version || msg.data.timestamp || Date.now();
        setRankingsVersion(newVer);
        try {
          if (cleanReg) {
            sessionStorage.removeItem(`gf_student_profile_${cleanReg}`);
            Object.keys(sessionStorage).forEach((k) => {
              if (k.startsWith(`gf_sem_${cleanReg}_`)) {
                sessionStorage.removeItem(k);
              }
            });
          }
        } catch (_) {}
        if (cleanReg) {
          fetchStudent(cleanReg, 1, 500, true).catch(() => {});
        }
        window.dispatchEvent(new CustomEvent("gradeflow:rankings-updated", { detail: msg.data }));
      });

      // F. Listen for broadcast announcement deletion in real time
      broadcastChannel.subscribe("delete-broadcast", (msg) => {
        if (!isMounted || !msg?.data?.notificationId) return;
        setNotifications((prev) => prev.filter((n) => n.notificationId !== msg.data.notificationId));
      });

      // F2. Listen for broadcast timetable and schedule updates in real time
      broadcastChannel.subscribe("timetable-updated", (msg) => {
        if (!isMounted) return;
        try {
          sessionStorage.removeItem("gf_schedules_cache");
        } catch (_) {}
        window.dispatchEvent(new CustomEvent("gradeflow:timetable-updated", { detail: msg?.data }));
      });

      // F3. Listen for real-time admin availability updates (<100ms)
      broadcastChannel.subscribe("admin-availability-updated", (msg) => {
        if (!isMounted || !msg?.data) return;
        const { activeDeviceCount: newDevCount, isAdminButtonVisible: newBtnVis } = msg.data;
        if (typeof newDevCount === "number") {
          setAdminDeviceCount(newDevCount);
        }
        if (typeof newBtnVis === "boolean") {
          setIsAdminButtonVisible(newBtnVis);
        }
      });

      // G. Listen for real-time attendance sync across active devices and tabs
      studentChannel.subscribe("attendance-updated", (msg) => {
        if (!isMounted) return;
        const msgSyncId = msg?.data?.syncId;
        const isSelfEcho =
          Boolean(msgSyncId && msgSyncId === lastAttendanceSyncIdRef.current) ||
          (Date.now() - lastAttendanceSaveTsRef.current < 4000);

        if (isSelfEcho) {
          // Suppress redundant self-origin re-fetch; client already has confirmed state
          window.dispatchEvent(
            new CustomEvent("gradeflow:attendance-updated", {
              detail: { ...(msg?.data || {}), isSelfOrigin: true },
            })
          );
          return;
        }

        // Hydrate from live Ably WebSocket payload directly (0 HTTP requests!)
        if (msg?.data?.attendance) {
          updateCachedAttendance(msg.data.attendance);
        } else if (cleanReg) {
          fetchStudent(cleanReg, 1, 500, false).catch(() => {});
        }

        window.dispatchEvent(new CustomEvent("gradeflow:attendance-updated", { detail: msg?.data }));
      });

      // H. Listen for real-time results & grade updates for this student (<1s)
      studentChannel.subscribe("results-updated", (msg) => {
        if (!isMounted) return;
        try {
          if (cleanReg) {
            sessionStorage.removeItem(`gf_student_profile_${cleanReg}`);
            Object.keys(sessionStorage).forEach((k) => {
              if (k.startsWith(`gf_sem_${cleanReg}_`)) {
                sessionStorage.removeItem(k);
              }
            });
          }
        } catch (_) {}
        if (cleanReg) {
          fetchStudent(cleanReg, 1, 500, true).catch(() => {});
        }
        window.dispatchEvent(new CustomEvent("gradeflow:results-updated", { detail: msg?.data }));
      });
    } catch (err) {
      console.warn("[Ably] Realtime connection warning:", err?.message || err);
    }

    // 3. Tab Visibility & Online Recovery: Keep WebSocket alive, auto-sync on tab return or reconnection
    let lastVisibilitySyncTime = Date.now();
    const handleVisibilityOrOnline = () => {
      if (document.visibilityState === "visible") {
        try {
          if (ably && ably.connection.state !== "connected") {
            ably.connection.connect();
          }
        } catch {}

        const now = Date.now();
        const isAblyLive = isRealtimeConnectedRef.current && ably && ably.connection?.state === "connected";
        // If Ably is not connected (limit reached, tunnel, offline) OR user was away > 60 seconds:
        if (!isAblyLive || now - lastVisibilitySyncTime > 60000) {
          lastVisibilitySyncTime = now;
          fetchNotifications();
          if (cleanReg) {
            fetchStudent(cleanReg, 1, 500, false).catch(() => {});
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityOrOnline);
    window.addEventListener("online", handleVisibilityOrOnline);

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityOrOnline);
      window.removeEventListener("online", handleVisibilityOrOnline);
      setIsRealtimeConnected(false);
      isRealtimeConnectedRef.current = false;
      try {
        if (studentChannel) studentChannel.unsubscribe();
        if (broadcastChannel) broadcastChannel.unsubscribe();
        if (ably) {
          try { ably.connection?.off(); } catch (_) {}
          try {
            const p = ably.close();
            if (p && typeof p.catch === "function") p.catch(() => {});
          } catch (_) {}
        }
      } catch {}
    };
  }, [studentSession?.sessionId, studentSession?.regNo]);

  // ─── Student Authentication Methods ──────────────────────────────
  const sendStudentOtp = async (regNo, options = {}) => {
    setLoading(true);
    setError("");
    try {
      const payload = typeof options === "object" ? { regNo, ...options } : { regNo };
      const res = await axios.post(`${API_BASE}/auth/student/send-otp`, payload, { withCredentials: true });
      if (res.data?.alreadyLoggedIn && res.data?.student && res.data?.hasPassword) {
        setStudentSession(res.data.student);
        await fetchStudent(res.data.student.regNo, 3, 500, true);
      }
      return { success: true, data: res.data };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send verification OTP. Please try again.";
      const code = err.response?.data?.code || "UNKNOWN_ERROR";
      const details = err.response?.data || {};
      setError(msg);
      return { success: false, error: msg, code, details };
    } finally {
      setLoading(false);
    }
  };

  const sendHandoverOtp = async (regNo, password = null, requestId = null) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE}/auth/student/send-handover-otp`, {
        regNo,
        password,
        requestId,
      }, { withCredentials: true });
      return { success: true, data: res.data };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send email verification code.";
      const code = err.response?.data?.code || "HANDOVER_OTP_ERROR";
      setError(msg);
      return { success: false, error: msg, code };
    } finally {
      setLoading(false);
    }
  };

  const verifyStudentOtp = async (regNo, otp, options = {}) => {
    setLoading(true);
    setError("");
    try {
      const studentHeaders = {};
      try {
        const hint = localStorage.getItem("gf_student_session_hint");
        if (hint) studentHeaders["x-student-last-session"] = hint;
      } catch (_) {}

      const payload = typeof options === "object" ? { regNo, otp, ...options } : { regNo, otp };
      const res = await axios.post(`${API_BASE}/auth/student/verify-otp`, payload, { withCredentials: true, headers: studentHeaders });
      if (res.data?.success) {
        if (res.data.step === "CREATE_PASSWORD") {
          return {
            success: true,
            step: "CREATE_PASSWORD",
            setupPasswordToken: res.data.setupPasswordToken,
            message: res.data.message,
            student: res.data.student,
          };
        }
        if (res.data.student) {
          setStudentSession(res.data.student);
          if (res.data.student.sessionId) {
            try { localStorage.setItem("gf_student_session_hint", String(res.data.student.sessionId).trim()); } catch (_) {}
          }
          await fetchStudent(regNo, 3, 500, true);
          return { success: true, student: res.data.student };
        }
      }
      return { success: false, error: res.data?.message || "Verification failed." };
    } catch (err) {
      let msg = err.response?.data?.message || "Invalid or expired OTP. Please try again.";
      if (err.response?.status >= 500 || String(msg).toLowerCase().includes("internal server error")) {
        msg = "Authentication service temporarily busy. Please try again.";
      }
      const code = err.response?.data?.code || "VERIFY_ERROR";
      const details = err.response?.data || {};
      setError(msg);
      return { success: false, error: msg, code, details };
    } finally {
      setLoading(false);
    }
  };

  const studentLoginPassword = async (regNo, password) => {
    setLoading(true);
    setError("");
    try {
      const studentHeaders = {};
      try {
        const hint = localStorage.getItem("gf_student_session_hint");
        if (hint) studentHeaders["x-student-last-session"] = hint;
      } catch (_) {}

      const res = await axios.post(`${API_BASE}/auth/student/login-password`, { regNo, password }, { withCredentials: true, headers: studentHeaders });
      if (res.data?.step === "APPROVAL_PENDING") {
        return {
          success: true,
          step: "APPROVAL_PENDING",
          requestId: res.data.requestId,
          activeDevice: res.data.activeDevice,
          expiresInSeconds: res.data.expiresInSeconds || 180,
          exchangeSecret: res.data.exchangeSecret,
          message: res.data.message,
          student: res.data.student,
        };
      }
      if (res.data?.step === "OTP") {
        return {
          success: true,
          step: "OTP",
          otpSent: true,
          isFailedPasswordTransfer: Boolean(res.data.isFailedPasswordTransfer),
          email: res.data.email,
          maskedEmail: res.data.maskedEmail,
          expiresInSeconds: res.data.expiresInSeconds || 300,
          cooldownSeconds: res.data.cooldownSeconds || 300,
          unlockAt: res.data.unlockAt,
          code: res.data.code,
          message: res.data.message,
          student: res.data.student,
        };
      }
      if (res.data?.success && res.data?.student) {
        setStudentSession(res.data.student);
        if (res.data.student.sessionId) {
          try { localStorage.setItem("gf_student_session_hint", String(res.data.student.sessionId).trim()); } catch (_) {}
        }
        await fetchStudent(regNo, 3, 500, true);
        return {
          success: true,
          student: res.data.student,
          sessionReplaced: res.data.sessionReplaced,
          message: res.data.message,
        };
      }
      return { success: false, error: res.data?.message || "Login failed." };
    } catch (err) {
      let msg = err.response?.data?.message || err.response?.data?.error;
      if (!msg || err.response?.status >= 500 || String(msg).toLowerCase().includes("internal server error")) {
        msg = "Authentication service temporarily busy. Please try again.";
      }
      const code = err.response?.data?.code || "AUTH_ERROR";
      const details = err.response?.data || {};
      setError(msg);
      return { success: false, error: msg, code, details };
    } finally {
      setLoading(false);
    }
  };

  const checkApprovalStatus = async (requestId, exchangeSecret = null) => {
    try {
      const params = exchangeSecret ? { exchangeSecret } : {};
      const res = await axios.get(`${API_BASE}/auth/student/approval-status/${requestId}`, {
        params,
        withCredentials: true,
      });
      if (res.data?.success && res.data?.status === "APPROVED" && res.data?.student) {
        setStudentSession(res.data.student);
        await fetchStudent(res.data.student.regNo, 3, 500, true);
        return { success: true, status: "APPROVED", student: res.data.student };
      }
      return res.data;
    } catch (err) {
      return {
        success: false,
        status: "ERROR",
        message: err.response?.data?.message || "Failed to check approval status.",
      };
    }
  };

  const studentCompleteApproval = async (requestId, exchangeSecret) => {
    try {
      const res = await axios.post(
        `${API_BASE}/auth/student/complete-approval`,
        { requestId, exchangeSecret },
        { withCredentials: true }
      );
      if (res.data?.success && res.data?.student) {
        setStudentSession(res.data.student);
        await fetchStudent(res.data.student.regNo, 3, 500, true);
        return { success: true, status: "COMPLETED", student: res.data.student };
      }
      return res.data;
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || "Failed to complete device approval.",
        code: err.response?.data?.code || "COMPLETE_APPROVAL_ERROR",
      };
    }
  };

  const cancelApprovalRequest = async (requestId) => {
    try {
      await axios.post(`${API_BASE}/auth/student/cancel-approval`, { requestId }, { withCredentials: true });
    } catch {}
  };

  const studentCreatePassword = async (regNo, password, setupPasswordToken) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE}/auth/student/create-password`, {
        regNo,
        password,
        setupPasswordToken,
      }, { withCredentials: true });
      if (res.data?.success && res.data?.student) {
        setStudentSession(res.data.student);
        await fetchStudent(regNo, 3, 500, true);
        return { success: true, student: res.data.student, message: res.data.message };
      }
      return { success: false, error: res.data?.message || "Failed to create password." };
    } catch (err) {
      const msg = err.response?.data?.message || "Password creation failed. Please try again.";
      const code = err.response?.data?.code || "CREATE_PASSWORD_ERROR";
      const details = err.response?.data || {};
      setError(msg);
      return { success: false, error: msg, code, details };
    } finally {
      setLoading(false);
    }
  };

  const studentTransferSession = async (regNo, password) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE}/auth/student/transfer-session`, { regNo, password }, { withCredentials: true });
      if (res.data?.success && res.data?.student) {
        setStudentSession(res.data.student);
        await fetchStudent(regNo, 3, 500, true);
        return { success: true, student: res.data.student, message: res.data.message };
      }
      return { success: false, error: res.data?.message || "Failed to transfer session." };
    } catch (err) {
      const msg = err.response?.data?.message || "Session transfer failed.";
      const code = err.response?.data?.code || "TRANSFER_ERROR";
      const details = err.response?.data || {};
      setError(msg);
      return { success: false, error: msg, code, details };
    } finally {
      setLoading(false);
    }
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [pendingDestination, setPendingDestination] = useState(null);

  const studentLogout = async () => {
    setIsLoggingOut(true);

    let activeSessionId = studentSession?.sessionId || "";
    if (!activeSessionId) {
      try {
        activeSessionId = localStorage.getItem("gf_student_session_hint") || "";
      } catch {}
    }
    const reg = studentSession?.regNo || studentData?.regNo || "";

    // 1. Immediately wipe in-memory state for this device
    setStudentSession(null);
    setStudentData(null);
    setNotifications([]);
    setUnreadCount(0);
    setError("");
    setPendingDestination(null);
    setIsAuthModalOpen(false);

    try {
      OBSOLETE_AUTH_STORAGE_KEYS.forEach((k) => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
      localStorage.removeItem("gf_student_session_hint");
      localStorage.removeItem("gf_student_reg");
      setIsRealtimeConnected(false);
      isRealtimeConnectedRef.current = false;

      // Deep purge: completely wipe any student profile, semester, performance, and notification caches from sessionStorage
      const sessionKeysToPurge = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && (k.startsWith("gf_student_profile_") || k.startsWith("gf_sem_") || k.startsWith("gf_perf_") || k.startsWith("gf_notif_"))) {
          sessionKeysToPurge.push(k);
        }
      }
      sessionKeysToPurge.forEach((k) => sessionStorage.removeItem(k));
    } catch {}

    // 2. Clear ONLY this device's session on server
    try {
      await axios.post(
        `${API_BASE}/auth/student/logout`,
        { regNo: reg, sessionId: activeSessionId },
        {
          headers: {
            "x-student-session": activeSessionId,
            "x-student-last-session": activeSessionId,
          },
          withCredentials: true,
        }
      );
    } catch (err) {
      console.warn("Student logout server sync:", err);
    } finally {
      try {
        localStorage.removeItem("gf_student_session_hint");
        localStorage.removeItem("gf_student_reg");
      } catch {}
      // Only clear client auth presence cookie if no admin session remains active
      if (!adminTokenRef.current) {
        clearAuthPresence();
      }
      setIsLoggingOut(false);
      navigate("/", { replace: true });
    }
  };

  // ─── Admin Auth Methods ──────────────────────────────────────────
  const adminLoginPassword = async (password) => {
    setLoading(true);
    setError("");
    try {
      const adminHeaders = {};
      try {
        const hint = localStorage.getItem("gf_admin_session_hint");
        if (hint) adminHeaders["x-admin-last-session"] = hint;
      } catch (_) {}
      const res = await axios.post(`${API_BASE}/auth/admin/login-password`, { password }, { withCredentials: true, headers: adminHeaders });
      if (res.data?.step === "OTP_REQUIRED") {
        return {
          success: true,
          step: "OTP_REQUIRED",
          expiresInSeconds: res.data.expiresInSeconds || 300,
          message: res.data.message,
        };
      }
      return { success: true };
    } catch (err) {
      let msg = err.response?.data?.message || err.response?.data?.error;
      if (!msg || err.response?.status >= 500 || String(msg).toLowerCase().includes("internal server error")) {
        msg = "Authentication service temporarily busy. Please try again.";
      }
      const code = err.response?.data?.code || "AUTH_ERROR";
      const details = err.response?.data || {};
      setError(msg);
      return { success: false, error: msg, code, details };
    } finally {
      setLoading(false);
    }
  };

  const adminVerifyOtp = async (otp) => {
    setLoading(true);
    setError("");
    try {
      const adminHeaders = {};
      try {
        const hint = localStorage.getItem("gf_admin_session_hint");
        if (hint) adminHeaders["x-admin-last-session"] = hint;
      } catch (_) {}
      const res = await axios.post(`${API_BASE}/auth/admin/verify-otp`, { otp }, { withCredentials: true, headers: adminHeaders });
      if (res.data?.success && res.data?.authenticated) {
        setAdminToken(true);
        setAdminProfile(res.data);
        if (res.data.sessionId) {
          try {
            localStorage.setItem("gf_admin_session_hint", String(res.data.sessionId).trim());
          } catch {}
        }
        if (typeof res.data.isAdminButtonVisible === "boolean") {
          setIsAdminButtonVisible(res.data.isAdminButtonVisible);
        } else if (typeof res.data.activeDeviceCount === "number") {
          setIsAdminButtonVisible(res.data.activeDeviceCount < 2);
        }
        if (typeof res.data.activeDeviceCount === "number") {
          setAdminDeviceCount(res.data.activeDeviceCount);
        }
        return { success: true };
      }
      const msg = res.data?.message || "OTP verification failed.";
      setError(msg);
      return { success: false, error: msg };
    } catch (err) {
      let msg = err.response?.data?.message || "Invalid or expired verification code.";
      if (err.response?.status >= 500 || String(msg).toLowerCase().includes("internal server error")) {
        msg = "Authentication service temporarily busy. Please try again.";
      }
      const code = err.response?.data?.code || "VERIFY_ERROR";
      setError(msg);
      return { success: false, error: msg, code };
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (arg1, arg2) => {
    const password = arg2 !== undefined ? arg2 : arg1;
    return adminLoginPassword(password);
  };

  const subAdminLogin = async (password, email = "") => {
    setLoading(true);
    setError("");
    try {
      const payload = email ? { email, password } : { password };
      const res = await axios.post(`${API_BASE}/auth/subadmin/login`, payload, { withCredentials: true });
      if (res.data?.alreadyLoggedIn) {
        setAdminToken(true);
        setAdminProfile(res.data);
        if (res.data.sessionId) {
          try {
            localStorage.setItem("gf_admin_session_hint", String(res.data.sessionId).trim());
          } catch {}
        }
        if (typeof res.data.isAdminButtonVisible === "boolean") {
          setIsAdminButtonVisible(res.data.isAdminButtonVisible);
        } else if (typeof res.data.activeDeviceCount === "number") {
          setIsAdminButtonVisible(res.data.activeDeviceCount < 2);
        }
        if (typeof res.data.activeDeviceCount === "number") {
          setAdminDeviceCount(res.data.activeDeviceCount);
        }
        return { success: true, alreadyLoggedIn: true, subAdmin: res.data };
      }
      if (res.data?.step === "OTP_REQUIRED") {
        return {
          success: true,
          step: "OTP_REQUIRED",
          email: res.data.email,
          maskedEmail: res.data.maskedEmail,
          name: res.data.name,
          expiresInSeconds: res.data.expiresInSeconds || 300,
          message: res.data.message,
        };
      }
      if (res.data?.success && res.data?.authenticated) {
        setAdminToken(true);
        setAdminProfile(res.data);
        if (res.data.sessionId) {
          try {
            localStorage.setItem("gf_admin_session_hint", String(res.data.sessionId).trim());
          } catch {}
        }
        if (typeof res.data.isAdminButtonVisible === "boolean") {
          setIsAdminButtonVisible(res.data.isAdminButtonVisible);
        } else if (typeof res.data.activeDeviceCount === "number") {
          setIsAdminButtonVisible(res.data.activeDeviceCount < 2);
        }
        if (typeof res.data.activeDeviceCount === "number") {
          setAdminDeviceCount(res.data.activeDeviceCount);
        }
        return { success: true, subAdmin: res.data };
      }
      return { success: false, message: res.data?.message || "Sub-Admin login failed" };
    } catch (err) {
      let msg = err.response?.data?.message || err.response?.data?.error;
      if (!msg || err.response?.status >= 500 || String(msg).toLowerCase().includes("internal server error")) {
        msg = "Authentication service temporarily busy. Please try again.";
      }
      const code = err.response?.data?.code || "SUBADMIN_AUTH_ERROR";
      const details = err.response?.data || {};
      setError(msg);
      return { success: false, error: msg, code, details };
    } finally {
      setLoading(false);
    }
  };

  const subAdminVerifyOtp = async (email, otp) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE}/auth/subadmin/verify-otp`, { email, otp }, { withCredentials: true });
      if (res.data?.success && res.data?.authenticated) {
        setAdminToken(true);
        setAdminProfile(res.data);
        if (res.data.sessionId) {
          try {
            localStorage.setItem("gf_admin_session_hint", String(res.data.sessionId).trim());
          } catch {}
        }
        if (typeof res.data.isAdminButtonVisible === "boolean") {
          setIsAdminButtonVisible(res.data.isAdminButtonVisible);
        } else if (typeof res.data.activeDeviceCount === "number") {
          setIsAdminButtonVisible(res.data.activeDeviceCount < 2);
        }
        if (typeof res.data.activeDeviceCount === "number") {
          setAdminDeviceCount(res.data.activeDeviceCount);
        }
        return { success: true, subAdmin: res.data };
      }
      const msg = res.data?.message || "Sub-Admin OTP verification failed.";
      setError(msg);
      return { success: false, error: msg };
    } catch (err) {
      let msg = err.response?.data?.message || "Invalid or expired verification code.";
      if (err.response?.status >= 500 || String(msg).toLowerCase().includes("internal server error")) {
        msg = "Authentication service temporarily busy. Please try again.";
      }
      const code = err.response?.data?.code || "VERIFY_ERROR";
      const remainingAttempts = err.response?.data?.remainingAttempts;
      setError(msg);
      return { success: false, error: msg, code, remainingAttempts };
    } finally {
      setLoading(false);
    }
  };

  const authHeaders = { "X-Requested-With": "XMLHttpRequest" };

  // ─── Student Profile Fetch with SWR (Stale-While-Revalidate & Deduplication) ───
  const fetchStudent = async (regNo, retries = 4, backoffMs = 1000, forceRefresh = false) => {
    if (!regNo) return null;
    const cleanReg = regNo.trim().toUpperCase();
    const profileCacheKey = `gf_student_profile_${cleanReg}`;

    // 1. Instant Cache Hydration (0ms load)
    let cachedData = null;
    let cachedTs = 0;
    let cachedEtag = "";
    let isFromMemory = false;

    if (!forceRefresh) {
      if (studentData && studentData.regNo === cleanReg) {
        cachedData = studentData;
        isFromMemory = true;
        try {
          const cachedRaw = sessionStorage.getItem(profileCacheKey);
          if (cachedRaw) {
            const parsed = JSON.parse(cachedRaw);
            if (parsed?.ts) cachedTs = parsed.ts;
            if (parsed?.etag) cachedEtag = parsed.etag;
          }
        } catch (_) {}
      } else {
        try {
          const cachedRaw = sessionStorage.getItem(profileCacheKey);
          if (cachedRaw) {
            const parsed = JSON.parse(cachedRaw);
            if (parsed?.data && parsed.data.regNo === cleanReg) {
              cachedData = parsed.data;
              cachedTs = parsed.ts || 0;
              cachedEtag = parsed.etag || "";
              setStudentData(parsed.data);
              setLoading(false);
            }
          }
        } catch (_) {}
      }
    }

    const now = Date.now();

    // 2. Intra-Session Optimization:
    // If data is already in memory (student navigating tabs/views during the same active session),
    // and Ably WebSocket is connected: return cachedData immediately (0 HTTP requests, 0ms latency).
    if (!forceRefresh && isFromMemory && cachedData && isRealtimeConnectedRef.current) {
      return cachedData;
    }

    // If data is in memory, but Ably is disconnected (Risk 2: Graceful Fallback Mode):
    // Throttle background ETag revalidations to once every 60 seconds
    if (!forceRefresh && isFromMemory && cachedData && !isRealtimeConnectedRef.current && (now - cachedTs < 60000)) {
      return cachedData;
    }

    // 3. F5 / Hard Reload Cooldown Shield (Safety Net 1):
    // When hydrating from sessionStorage on F5/mount, enforce a 15-second cooldown shield
    // to prevent rapid-fire F5 button mashing from hammering the serverless backend.
    if (!forceRefresh && cachedData && (now - lastRevalidateTsRef.current < 15000)) {
      return cachedData;
    }

    // Explicit force refresh cooldown: 10 seconds
    if (forceRefresh && cachedData && (now - lastForceRefreshTsRef.current < 10000)) {
      return cachedData;
    }
    if (forceRefresh) {
      lastForceRefreshTsRef.current = now;
      try {
        sessionStorage.removeItem(profileCacheKey);
      } catch (_) {}
    }

    // 4. If no cache hit at all (cold initial load), show loading spinner
    if (!cachedData && backoffMs === 1000) {
      setLoading(true);
      setError("");
    }

    // 5. Deduplicate concurrent in-flight fetches for the same student
    if (inFlightStudentFetchRef.current[cleanReg]) {
      return inFlightStudentFetchRef.current[cleanReg];
    }

    // 6. Background / Foreground Revalidation with ETag (304 = 0 DB queries, 0 bytes)
    lastRevalidateTsRef.current = now;

    const fetchPromise = (async () => {
      try {
        const fetchUrl = forceRefresh ? `${API_BASE}/student/${cleanReg}?force=true` : `${API_BASE}/student/${cleanReg}`;
        const fetchHeaders = forceRefresh ? { "Cache-Control": "no-cache", Pragma: "no-cache" } : {};
        if (cachedEtag && !forceRefresh) {
          fetchHeaders["If-None-Match"] = cachedEtag;
        }
        const res = await axios.get(fetchUrl, {
          withCredentials: true,
          headers: fetchHeaders,
          validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
        });

        // 304 Not Modified: Data is identical in DB! ~1ms CPU, 0 DB queries, 0 bytes transferred.
        if (res.status === 304 && cachedData) {
          setLoading(false);
          try {
            sessionStorage.setItem(profileCacheKey, JSON.stringify({ data: cachedData, ts: Date.now(), etag: cachedEtag }));
          } catch (_) {}
          return cachedData;
        }

        // 200 OK: Fresh data returned from server!
        if (res.data) {
          setStudentData(res.data);
          const resEtag = res.headers?.etag || res.headers?.ETag || "";
          try {
            sessionStorage.setItem(profileCacheKey, JSON.stringify({ data: res.data, ts: Date.now(), etag: resEtag }));
          } catch (_) {}
        }
        setLoading(false);
        return res.data;
      } catch (err) {
        const status = err.response?.status;
        const isTransient = status === 429 || status === 502 || status === 503;
        if (isTransient && retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          return fetchStudent(cleanReg, retries - 1, backoffMs * 2, forceRefresh);
        }

        // If we already served cached data, don't wipe it on background network error
        if (cachedData) {
          setLoading(false);
          return cachedData;
        }

        let msg = "Something went wrong. Please try again.";
        if (status === 401) {
          msg = "Session expired or authentication required. Please log in with your registration number.";
          setStudentSession(null);
        } else if (status === 403) {
          msg = "Access Denied: You are only authorized to view your own registered student records.";
        } else if (status === 404) {
          msg = "Student not found. Please check your Registration Number.";
        } else if (status === 429) {
          msg = "Server is very busy right now. Please try again in a few seconds.";
        } else if (status === 502 || status === 503) {
          msg = "Server is restarting. Please try again in a moment.";
        } else if (!err.response) {
          msg = "Network error — please check your internet connection.";
        } else if (err.response?.data?.message) {
          msg = err.response.data.message;
        }

        setError(msg);
        setStudentData(null);
        setLoading(false);
        return false;
      } finally {
        delete inFlightStudentFetchRef.current[cleanReg];
      }
    })();

    inFlightStudentFetchRef.current[cleanReg] = fetchPromise;

    // If cache was available, return cachedData immediately to unblock UI,
    // while the fetchPromise finishes silently in the background
    if (cachedData && !forceRefresh) {
      return cachedData;
    }

    return fetchPromise;
  };

  const clearStudentData = () => {
    try {
      if (studentData?.regNo) {
        sessionStorage.removeItem(`gf_student_profile_${studentData.regNo}`);
      }
    } catch (_) {}
    setStudentData(null);
    setNotifications([]);
    setUnreadCount(0);
    setError("");
  };

  const updateCachedAttendance = useCallback((attendancePayload) => {
    if (!attendancePayload) return;
    setStudentData((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, attendance: attendancePayload };
      try {
        const cleanReg = String(prev.regNo || "").trim().toUpperCase();
        if (cleanReg) {
          sessionStorage.setItem(`gf_student_profile_${cleanReg}`, JSON.stringify({ data: updated, ts: Date.now() }));
        }
      } catch (_) {}
      return updated;
    });
  }, []);

  const leaveSession = () => {
    clearStudentData();
    studentLogout();
  };

  const updateAdminButtonConfig = async (payload) => {
    try {
      const res = await axios.put(`${API_BASE}/admin/portal-visibility`, payload, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      if (res.data && res.data.success) {
        setAdminButtonConfig(res.data.config);
        return res.data;
      }
    } catch (err) {
      console.error("Failed to update portal visibility:", err);
      throw err;
    }
  };

  const getAdminAuthHeaders = () => ({ headers: { "X-Requested-With": "XMLHttpRequest" } });
  const hasActiveSession = Boolean(studentSession && studentSession.regNo && studentSession.sessionId);

  return (
    <AppCtx.Provider
      value={{
        studentData,
        studentSession,
        authStatus,
        adminAuthStatus,
        authChecking,
        bootstrapAuthentication,
        waitForAuthResolution,
        isAuthModalOpen,
        setIsAuthModalOpen,
        openStudentAuthModal: (dest = null) => {
          if (dest) setPendingDestination(dest);
          setIsAuthModalOpen(true);
        },
        closeStudentAuthModal: () => {
          setIsAuthModalOpen(false);
        },
        sendStudentOtp,
        sendHandoverOtp,
        verifyStudentOtp,
        studentLoginPassword,
        studentCreatePassword,
        studentTransferSession,
        studentLogout,
        isLoggingOut,
        pendingDestination,
        setPendingDestination,
        loading,
        error,
        adminToken,
        adminProfile,
        setAdminProfile,
        adminDeviceCount,
        isAdminButtonVisible,
        adminButtonConfig,
        setAdminButtonConfig,
        fetchAdminButtonConfig,
        updateAdminButtonConfig,
        checkAdminStatus,
        notifications,
        unreadCount,
        fetchNotifications,
        approveLoginRequest,
        denyLoginRequest,
        markNotificationsRead,
        handleNotificationAction,
        checkApprovalStatus,
        studentCompleteApproval,
        cancelApprovalRequest,
        sessionRevokedNotice,
        setSessionRevokedNotice,
        adminLogin,
        adminLoginPassword,
        adminVerifyOtp,
        subAdminLogin,
        subAdminVerifyOtp,
        adminLogout,
        logoutAdmin,
        authHeaders,
        getAdminAuthHeaders,
        fetchStudent,
        clearStudentData,
        updateCachedAttendance,
        recordAttendanceSave,
        hasActiveSession,
        leaveSession,
        getAuthPresence,
        setAuthPresence,
        clearAuthPresence,
        theme,
        toggleTheme,
        maintenance,
        maintenanceChecked,
        setMaintenance,
        checkMaintenanceStatus,
        API: API_BASE,
        rankingsVersion,
        setRankingsVersion,
        isRealtimeConnected,
        stats: null,
        queuePosition: null,
        sessionTimeLeft: null,
        cooldownRemaining: 0,
        joinQueue: () => {},
        leaveQueue: () => {},
        isOldDomain,
      }}
    >
      {children}
    </AppCtx.Provider>
  );
}

export const useApp = () => useContext(AppCtx);
export const useAppContext = () => useContext(AppCtx);
