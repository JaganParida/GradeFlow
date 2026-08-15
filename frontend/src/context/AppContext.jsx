import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

// Set axios to send cookies with every request
axios.defaults.withCredentials = true;

const STUDENT_CACHE_KEY = "gf_student_data";
// Bump this version whenever the CGPA/SGPA formula or data shape changes
// to automatically invalidate stale cached student data in sessionStorage
const CACHE_VERSION = "v8";
const CACHE_VERSION_KEY = "gf_cache_version";

const getCachedStudentData = () => {
  try {
    // Invalidate cache if version changed (formula/data updates)
    const storedVersion = sessionStorage.getItem(CACHE_VERSION_KEY);
    if (storedVersion !== CACHE_VERSION) {
      sessionStorage.removeItem(STUDENT_CACHE_KEY);
      sessionStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
      return null;
    }
    return JSON.parse(sessionStorage.getItem(STUDENT_CACHE_KEY)) || null;
  } catch {
    try {
      sessionStorage.removeItem(STUDENT_CACHE_KEY);
    } catch (e) {
      // Ignore if sessionStorage is completely disabled
    }
    return null;
  }
};

const AppCtx = createContext();

export function AppProvider({ children }) {
  const [studentData, setStudentData] = useState(() => getCachedStudentData());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminToken, setAdminToken] = useState(false);

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

  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in via cookie on app load
    const checkAuth = async () => {
      try {
        const res = await axios.get(`${API_BASE}/auth/me`);
        if (res.data.success) {
          setAdminToken(true);
        } else {
          setAdminToken(false);
        }
      } catch (err) {
        setAdminToken(false);
      }
    };
    checkAuth();
  }, []);

  // ─── Admin Auth ────────────────────────────────────────────────
  const adminLogin = async (email, password) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      if (res.data?.success || res.status === 200) {
        setAdminToken(true);
        return { success: true };
      }
      const msg = res.data?.message || "Invalid credentials";
      setError(msg);
      return { success: false, error: msg };
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid email or password. Please try again.";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const adminLogout = async () => {
    try {
      await axios.post(`${API_BASE}/auth/logout`);
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setAdminToken(false);
      navigate("/admin");
    }
  };

  const logoutAdmin = adminLogout;

  const authHeaders = {};

  // ─── Student Fetch with Silent Exponential Backoff ────────────────
  // On 429 / 502 / 503 the request is retried silently behind a spinner
  // (1s → 2s → 4s → 8s). Users just see the loading state — no scary error.
  const fetchStudent = async (regNo, retries = 4, backoffMs = 1000, forceRefresh = false) => {
    // Reuse existing in-memory/sessionStorage student data instantly to prevent tab switch loading spinners
    if (!forceRefresh && studentData && studentData.regNo === regNo) {
      setLoading(false);
      return studentData;
    }
    const cached = getCachedStudentData();
    if (!forceRefresh && cached && cached.regNo === regNo) {
      setStudentData(cached);
      setLoading(false);
      return cached;
    }

    // Only set loading on first call (not during a silent retry)
    if (backoffMs === 1000) {
      setLoading(true);
      setError("");
    }
    try {
      const res = await axios.get(`${API_BASE}/student/${regNo}`);

      try {
        sessionStorage.setItem(STUDENT_CACHE_KEY, JSON.stringify(res.data));
        sessionStorage.setItem("last_regNo", regNo);
        if (res.data?.studentName) {
          sessionStorage.setItem("last_studentName", res.data.studentName);
        }
      } catch (storageErr) {
        console.warn("Could not save to sessionStorage. Attempting to clear space...", storageErr);
        try {
          sessionStorage.clear(); // Clear all domain storage to free up max space
          sessionStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION); // Restore version
          sessionStorage.setItem(STUDENT_CACHE_KEY, JSON.stringify(res.data));
          sessionStorage.setItem("last_regNo", regNo);
          if (res.data?.studentName) {
            sessionStorage.setItem("last_studentName", res.data.studentName);
          }
        } catch (retryErr) {
          console.error("Local storage still unavailable after clearing.", retryErr);
        }
      }
      setStudentData(res.data);
      setLoading(false);
      return res.data;
    } catch (err) {
      const status = err.response?.status;

      // Transient server errors — retry silently (spinner stays, no error shown)
      const isTransient = status === 429 || status === 502 || status === 503;
      if (isTransient && retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        return fetchStudent(regNo, retries - 1, backoffMs * 2);
      }

      // After all retries exhausted or non-transient error — show message
      let msg = "Something went wrong. Please try again.";
      if (status === 404)      msg = "Student not found. Please check your Registration Number.";
      else if (status === 429) msg = "Server is very busy right now. Please try again in a few seconds.";
      else if (status === 502 || status === 503) msg = "Server is restarting. Please try again in a moment.";
      else if (!err.response)  msg = "Network error — please check your internet connection.";
      else if (err.response?.data?.message) msg = err.response.data.message;

      setError(msg);
      setStudentData(null);
      setLoading(false);
      return false;
    }
  };

  const clearStudentData = () => {
    try {
      sessionStorage.removeItem(STUDENT_CACHE_KEY);
      sessionStorage.removeItem("last_regNo");
    } catch (err) {
      console.warn("Could not remove from sessionStorage", err);
    }
    setStudentData(null);
    setError("");
  };

  const leaveSession = () => {
    clearStudentData();
    navigate("/");
  };

  const hasActiveSession = Boolean(studentData);

  return (
    <AppCtx.Provider
      value={{
        studentData,
        loading,
        error,
        adminToken,
        adminLogin,
        adminLogout,
        logoutAdmin,
        authHeaders,
        fetchStudent,
        clearStudentData,
        hasActiveSession,
        leaveSession,
        theme,
        toggleTheme,
        // Expose API base for pages that need it
        API: API_BASE,
        // Legacy no-op mocks (nothing breaks if code still references these)
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
