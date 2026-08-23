import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_URL || "/api";

// Set axios to send cookies with every request
axios.defaults.withCredentials = true;

axios.interceptors.request.use((config) => {
  try {
    const studentJwt = localStorage.getItem("gf_student_jwt") || sessionStorage.getItem("gf_student_jwt");

    config.headers = config.headers || {};
    // Attach CSRF protection header for state-changing browser requests
    config.headers["X-Requested-With"] = "XMLHttpRequest";

    const url = config.url || "";
    const isStudentAuthUrl = url.includes("/auth/student/") || url.includes("/student/");

    if (isStudentAuthUrl && studentJwt) {
      config.headers["x-student-token"] = studentJwt;
      config.headers.Authorization = `Bearer ${studentJwt}`;
    }
  } catch {}
  return config;
});

const AppCtx = createContext();

// Explicit list of obsolete legacy auth/session keys to clean up from browser storage
const OBSOLETE_AUTH_STORAGE_KEYS = [
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
  // Proactively wipe only confirmed obsolete authentication keys without clearing unrelated application state
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

  // ─── Theme Management ────────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('gf_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gf_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const [authChecking, setAuthChecking] = useState(true);
  const navigate = useNavigate();

  // ─── Check Auth on Startup (Admin via Secure HttpOnly Cookie + Session) ──
  useEffect(() => {
    const checkAuth = async () => {
      // 1. Check Admin Auth (Server-authoritative HttpOnly cookie verification)
      try {
        const resAdmin = await axios.get(`${API_BASE}/auth/admin/me`, { withCredentials: true });
        if (resAdmin.data?.success && resAdmin.data?.authenticated) {
          setAdminToken(true);
          setAdminProfile(resAdmin.data);
        } else {
          setAdminToken(false);
          setAdminProfile(null);
        }
      } catch (err) {
        setAdminToken(false);
        setAdminProfile(null);
      }

      // 2. Check Student Session (Persistent across 7 days)
      try {
        const studentJwt = localStorage.getItem("gf_student_jwt") || sessionStorage.getItem("gf_student_jwt");
        const headers = studentJwt ? { "x-student-token": studentJwt, Authorization: `Bearer ${studentJwt}` } : {};
        const resStudent = await axios.get(`${API_BASE}/auth/student/me`, { headers, withCredentials: true });
        if (resStudent.data?.success && resStudent.data?.student) {
          if (resStudent.data?.token) {
            localStorage.setItem("gf_student_jwt", resStudent.data.token);
          }
          setStudentSession(resStudent.data.student);
          await fetchStudent(resStudent.data.student.regNo, 2, 500);
        } else {
          // Only wipe if server confirmed session expired/terminated
          const code = resStudent.data?.code;
          if (code === "SESSION_TERMINATED" || code === "INACTIVITY_LOGOUT" || code === "SESSION_INACTIVE_EXPIRED") {
            localStorage.removeItem("gf_student_jwt");
            sessionStorage.removeItem("gf_student_jwt");
            setStudentSession(null);
            setStudentData(null);
          }
        }
      } catch (err) {
        const code = err.response?.data?.code;
        if (code === "SESSION_TERMINATED" || code === "INACTIVITY_LOGOUT" || code === "SESSION_INACTIVE_EXPIRED") {
          localStorage.removeItem("gf_student_jwt");
          sessionStorage.removeItem("gf_student_jwt");
          setStudentSession(null);
          setStudentData(null);
        }
      } finally {
        setAuthChecking(false);
      }
    };

    checkAuth();
  }, []);

  // ─── Student OTP Auth Methods ────────────────────────────────────
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
      if (res.data?.success && res.data?.student) {
        if (res.data?.token) {
          localStorage.setItem("gf_student_jwt", res.data.token);
          sessionStorage.setItem("gf_student_jwt", res.data.token);
        }
        setStudentSession(res.data.student);
        // Fetch student profile directly into memory
        await fetchStudent(regNo, 3, 500, true);
        return { success: true, student: res.data.student };
      }
      return { success: false, error: res.data?.message || "Verification failed." };
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid or expired OTP. Please try again.";
      const code = err.response?.data?.code || "VERIFY_ERROR";
      setError(msg);
      return { success: false, error: msg, code };
    } finally {
      setLoading(false);
    }
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [pendingDestination, setPendingDestination] = useState(null);

  const studentLogout = async () => {
    setIsLoggingOut(true);

    // 1. Immediately wipe in-memory state for instant UI response
    setStudentSession(null);
    setStudentData(null);
    setError("");
    setPendingDestination(null);
    setIsAuthModalOpen(false);

    try {
      localStorage.removeItem("gf_student_jwt");
      localStorage.removeItem("gf_student_data");
      localStorage.removeItem("gf_student_session");
      localStorage.removeItem("last_regNo");
      localStorage.removeItem("last_studentName");
      localStorage.removeItem("gf_today_attendance");
      localStorage.removeItem("gf_timetable_cache");
      sessionStorage.removeItem("gf_student_jwt");
    } catch {}

    // 2. Clear session on server in background
    try {
      await axios.post(`${API_BASE}/auth/student/logout`);
    } catch (err) {
      console.warn("Student logout server sync:", err);
    } finally {
      setIsLoggingOut(false);
      navigate("/", { replace: true });
    }
  };

  // ─── Admin Auth (Password-Only Step 1 -> Server OTP -> Step 2) ───
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

  // ─── Student Fetch with Silent Exponential Backoff ────────────────
  const fetchStudent = async (regNo, retries = 4, backoffMs = 1000, forceRefresh = false) => {
    if (!regNo) return null;
    const cleanReg = regNo.trim().toUpperCase();

    // Reuse existing in-memory student data instantly to prevent tab switch loading spinners
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

      // Transient server errors — retry silently
      const isTransient = status === 429 || status === 502 || status === 503;
      if (isTransient && retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        return fetchStudent(cleanReg, retries - 1, backoffMs * 2);
      }

      // After all retries exhausted or non-transient error — show message
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

  const hasActiveSession = Boolean(studentData || studentSession);

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
        studentLogout,
        isLoggingOut,
        pendingDestination,
        setPendingDestination,
        loading,
        error,
        adminToken,
        adminProfile,
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

// Both names are exported so nothing breaks
export const useApp = () => useContext(AppCtx);
export const useAppContext = () => useContext(AppCtx);

