import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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

  const [studentData, setStudentData] = useState(null);
  const [studentSession, setStudentSession] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // In-memory administrative authentication state — NOT persisted in localStorage
  const [adminToken, setAdminToken] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);
  const [adminDeviceCount, setAdminDeviceCount] = useState(0);
  const [isAdminButtonVisible, setIsAdminButtonVisible] = useState(true);

  // Check live admin device occupancy (0 or 1 device -> button visible; 2 devices -> button hidden)
  const checkAdminStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE}/auth/admin/check-status`, {
        withCredentials: true,
        timeout: 3500,
      });
      if (res.data && res.data.success) {
        const count = res.data.activeDeviceCount ?? 0;
        setAdminDeviceCount(count);
        setIsAdminButtonVisible(count < 2);
        return res.data;
      }
    } catch (err) {
      console.warn("Failed to check admin device status:", err.message);
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
  const [maintenanceChecked, setMaintenanceChecked] = useState(false);

  const checkMaintenanceStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE}/system/maintenance?t=${Date.now()}`, {
        headers: { "Cache-Control": "no-cache" },
        timeout: 2500,
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

  const [authChecking, setAuthChecking] = useState(true);
  const navigate = useNavigate();

  // ─── Check Server-Side Auth & Maintenance on Startup (Pure Cookie-Based) ───
  useEffect(() => {
    const checkAuthAndSystem = async () => {
      // 0. Maintenance check & Admin device status check
      const maintenancePromise = checkMaintenanceStatus();
      const adminStatusPromise = checkAdminStatus();

      // 1. Admin Auth Check Promise (HttpOnly Cookie)
      const adminPromise = (async () => {
        try {
          const resAdmin = await axios.get(`${API_BASE}/auth/admin/me`, {
            withCredentials: true,
            timeout: 3500,
          });
          if (resAdmin.data?.success && resAdmin.data?.authenticated) {
            setAdminToken(true);
            setAdminProfile(resAdmin.data);
          } else {
            setAdminToken(false);
            setAdminProfile(null);
          }
        } catch {
          setAdminToken(false);
          setAdminProfile(null);
        }
      })();

      // 2. Student Session Check Promise (HttpOnly Cookie)
      const studentPromise = (async () => {
        try {
          const resStudent = await axios.get(`${API_BASE}/auth/student/me`, {
            withCredentials: true,
            timeout: 4000,
          });
          if (resStudent.data?.success && resStudent.data?.student) {
            setStudentSession(resStudent.data.student);
            await fetchStudent(resStudent.data.student.regNo, 2, 500);
          } else {
            setStudentSession(null);
            setStudentData(null);
          }
        } catch {
          setStudentSession(null);
          setStudentData(null);
        }
      })();

      await Promise.allSettled([maintenancePromise, adminStatusPromise, adminPromise, studentPromise]);
      setAuthChecking(false);
    };

    checkAuthAndSystem();

    // Periodic refresh of admin device occupancy
    const interval = setInterval(checkAdminStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  // ─── Student In-App Notifications & Realtime SSE Stream ──────────
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionRevokedNotice, setSessionRevokedNotice] = useState(null);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_BASE}/notifications/student`, { withCredentials: true });
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {}
  };

  const approveLoginRequest = async (requestId) => {
    try {
      const res = await axios.post(`${API_BASE}/notifications/approve`, { requestId }, { withCredentials: true });
      if (res.data?.success) {
        await fetchNotifications();
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data?.message || "Failed to approve request." };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Failed to approve request." };
    }
  };

  const denyLoginRequest = async (requestId) => {
    try {
      const res = await axios.post(`${API_BASE}/notifications/deny`, { requestId }, { withCredentials: true });
      if (res.data?.success) {
        await fetchNotifications();
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data?.message || "Failed to deny request." };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Failed to deny request." };
    }
  };

  const markNotificationsRead = async () => {
    try {
      await axios.post(`${API_BASE}/notifications/mark-read`, {}, { withCredentials: true });
      setUnreadCount(0);
    } catch {}
  };

  // Realtime SSE stream for active student session
  useEffect(() => {
    if (!studentSession || !studentSession.regNo || !studentSession.sessionId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();

    let eventSource = null;
    try {
      eventSource = new EventSource(`${API_BASE}/notifications/stream`, { withCredentials: true });

      eventSource.addEventListener("notification", () => {
        fetchNotifications();
      });

      eventSource.addEventListener("session_revoked", (e) => {
        try {
          const data = JSON.parse(e.data || "{}");
          setSessionRevokedNotice(
            data.message || "Your session ended because your account was approved on another device."
          );
        } catch {
          setSessionRevokedNotice("Your session ended because your account was approved on another device.");
        }
        setStudentSession(null);
        setStudentData(null);
        navigate("/", { replace: true });
      });

      eventSource.onerror = () => {
        eventSource?.close();
      };
    } catch {}

    const interval = setInterval(fetchNotifications, 20000);
    return () => {
      clearInterval(interval);
      eventSource?.close();
    };
  }, [studentSession?.sessionId, studentSession?.regNo]);

  // ─── Student Authentication Methods ──────────────────────────────
  const sendStudentOtp = async (regNo) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE}/auth/student/send-otp`, { regNo });
      if (res.data?.alreadyLoggedIn && res.data?.student) {
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

  const verifyStudentOtp = async (regNo, otp) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE}/auth/student/verify-otp`, { regNo, otp });
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
          await fetchStudent(regNo, 3, 500, true);
          return { success: true, student: res.data.student };
        }
      }
      return { success: false, error: res.data?.message || "Verification failed." };
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid or expired OTP. Please try again.";
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
      const res = await axios.post(`${API_BASE}/auth/student/login-password`, { regNo, password });
      if (res.data?.step === "APPROVAL_PENDING") {
        return {
          success: true,
          step: "APPROVAL_PENDING",
          requestId: res.data.requestId,
          activeDevice: res.data.activeDevice,
          expiresInSeconds: res.data.expiresInSeconds || 180,
          message: res.data.message,
          student: res.data.student,
        };
      }
      if (res.data?.success && res.data?.student) {
        setStudentSession(res.data.student);
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
      const msg = err.response?.data?.message || "Incorrect password. Please try again.";
      const code = err.response?.data?.code || "AUTH_ERROR";
      const details = err.response?.data || {};
      setError(msg);
      return { success: false, error: msg, code, details };
    } finally {
      setLoading(false);
    }
  };

  const checkApprovalStatus = async (requestId) => {
    try {
      const res = await axios.get(`${API_BASE}/auth/student/approval-status/${requestId}`, {
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

  const cancelApprovalRequest = async (requestId) => {
    try {
      await axios.post(`${API_BASE}/auth/student/cancel-approval`, { requestId });
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
      });
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
      const res = await axios.post(`${API_BASE}/auth/student/transfer-session`, { regNo, password });
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

    // 1. Immediately wipe in-memory state
    setStudentSession(null);
    setStudentData(null);
    setError("");
    setPendingDestination(null);
    setIsAuthModalOpen(false);

    try {
      OBSOLETE_AUTH_STORAGE_KEYS.forEach((k) => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
    } catch {}

    // 2. Clear session on server
    try {
      await axios.post(`${API_BASE}/auth/student/logout`);
    } catch (err) {
      console.warn("Student logout server sync:", err);
    } finally {
      setIsLoggingOut(false);
      navigate("/", { replace: true });
    }
  };

  // ─── Admin Auth Methods ──────────────────────────────────────────
  const adminLoginPassword = async (password) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE}/auth/admin/login-password`, { password }, { withCredentials: true });
      if (res.data?.alreadyLoggedIn) {
        setAdminToken(true);
        setAdminProfile(res.data);
        return { success: true, alreadyLoggedIn: true };
      }
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
      const msg = err.response?.data?.message || "Invalid administrative password. Access denied.";
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
      const res = await axios.post(`${API_BASE}/auth/admin/verify-otp`, { otp }, { withCredentials: true });
      if (res.data?.success && res.data?.authenticated) {
        setAdminToken(true);
        setAdminProfile(res.data);
        return { success: true };
      }
      const msg = res.data?.message || "OTP verification failed.";
      setError(msg);
      return { success: false, error: msg };
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid or expired verification code.";
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
        return { success: true, subAdmin: res.data };
      }
      return { success: false, message: res.data?.message || "Sub-Admin login failed" };
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid Sub-Admin credentials.";
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
        return { success: true, subAdmin: res.data };
      }
      const msg = res.data?.message || "Sub-Admin OTP verification failed.";
      setError(msg);
      return { success: false, error: msg };
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid or expired verification code.";
      const code = err.response?.data?.code || "VERIFY_ERROR";
      const remainingAttempts = err.response?.data?.remainingAttempts;
      setError(msg);
      return { success: false, error: msg, code, remainingAttempts };
    } finally {
      setLoading(false);
    }
  };

  const adminLogout = async () => {
    try {
      OBSOLETE_AUTH_STORAGE_KEYS.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      await axios.post(`${API_BASE}/auth/admin/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.warn("Logout error:", err.message);
    } finally {
      setAdminToken(false);
      setAdminProfile(null);
      navigate("/admin");
    }
  };

  const logoutAdmin = adminLogout;
  const authHeaders = { "X-Requested-With": "XMLHttpRequest" };

  // ─── Student Profile Fetch ───────────────────────────────────────
  const fetchStudent = async (regNo, retries = 4, backoffMs = 1000, forceRefresh = false) => {
    if (!regNo) return null;
    const cleanReg = regNo.trim().toUpperCase();

    if (!forceRefresh && studentData && studentData.regNo === cleanReg) {
      setLoading(false);
      return studentData;
    }

    if (backoffMs === 1000) {
      setLoading(true);
      setError("");
    }
    try {
      const res = await axios.get(`${API_BASE}/student/${cleanReg}`, {
        withCredentials: true,
      });
      setStudentData(res.data);
      setLoading(false);
      return res.data;
    } catch (err) {
      const status = err.response?.status;
      const isTransient = status === 429 || status === 502 || status === 503;
      if (isTransient && retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        return fetchStudent(cleanReg, retries - 1, backoffMs * 2);
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
    }
  };

  const clearStudentData = () => {
    setStudentData(null);
    setError("");
  };

  const leaveSession = () => {
    clearStudentData();
    studentLogout();
  };

  const getAdminAuthHeaders = () => ({ headers: { "X-Requested-With": "XMLHttpRequest" } });
  const hasActiveSession = Boolean(studentSession && studentSession.regNo && studentSession.sessionId);

  return (
    <AppCtx.Provider
      value={{
        studentData,
        studentSession,
        authChecking,
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
        adminDeviceCount,
        isAdminButtonVisible,
        checkAdminStatus,
        notifications,
        unreadCount,
        fetchNotifications,
        approveLoginRequest,
        denyLoginRequest,
        markNotificationsRead,
        checkApprovalStatus,
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
        hasActiveSession,
        leaveSession,
        theme,
        toggleTheme,
        maintenance,
        maintenanceChecked,
        setMaintenance,
        checkMaintenanceStatus,
        API: API_BASE,
        stats: null,
        queuePosition: null,
        sessionTimeLeft: null,
        cooldownRemaining: 0,
        joinQueue: () => {},
        leaveQueue: () => {},
      }}
    >
      {children}
    </AppCtx.Provider>
  );
}

export const useApp = () => useContext(AppCtx);
export const useAppContext = () => useContext(AppCtx);
