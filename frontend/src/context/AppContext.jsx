import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const STUDENT_CACHE_KEY = "gf_student_data";

const getCachedStudentData = () => {
  try {
    return JSON.parse(localStorage.getItem(STUDENT_CACHE_KEY)) || null;
  } catch {
    localStorage.removeItem(STUDENT_CACHE_KEY);
    return null;
  }
};

const AppCtx = createContext();

export function AppProvider({ children }) {
  const [studentData, setStudentData] = useState(() => getCachedStudentData());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminToken, setAdminToken] = useState(
    () => localStorage.getItem("gf_token") || "",
  );

  const navigate = useNavigate();

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "gf_token") {
        setAdminToken(e.newValue || "");
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ─── Admin Auth ────────────────────────────────────────────────
  const adminLogin = async (email, password) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      localStorage.setItem("gf_token", res.data.token);
      setAdminToken(res.data.token);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const adminLogout = () => {
    localStorage.removeItem("gf_token");
    setAdminToken("");
    navigate("/admin/login");
  };

  const logoutAdmin = adminLogout;

  const authHeaders = adminToken
    ? { headers: { Authorization: `Bearer ${adminToken}` } }
    : {};

  // ─── Student Fetch with Exponential Backoff ────────────────────
  // Automatically retries on 429 (Too Many Requests) with exponential waits:
  // 1s → 2s → 4s → 8s before giving up, so high traffic is handled transparently.
  const fetchStudent = async (regNo, retries = 4, backoffMs = 1000) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/student/${regNo}`);

      localStorage.setItem(STUDENT_CACHE_KEY, JSON.stringify(res.data));
      localStorage.setItem("last_regNo", regNo);
      setStudentData(res.data);
      setLoading(false);
      return true;
    } catch (err) {
      if (err.response?.status === 429 && retries > 0) {
        // Server is under heavy load — wait and retry transparently
        const waitSec = Math.round(backoffMs / 1000);
        setError(`High traffic detected. Retrying automatically in ${waitSec}s…`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        return fetchStudent(regNo, retries - 1, backoffMs * 2);
      }

      if (err.response?.status === 503 || err.response?.status === 502) {
        if (retries > 0) {
          setError(`Server is restarting. Retrying in ${Math.round(backoffMs / 1000)}s…`);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          return fetchStudent(regNo, retries - 1, backoffMs * 2);
        }
        setError("Server is temporarily unavailable. Please try again in a moment.");
      } else if (err.response?.status === 404) {
        setError("Student not found. Please check your Registration Number.");
      } else if (!err.response) {
        setError("Network error — please check your internet connection.");
      } else {
        setError(err.response?.data?.message || "Failed to fetch student data.");
      }

      setStudentData(null);
      setLoading(false);
      return false;
    }
  };

  const clearStudentData = () => {
    localStorage.removeItem(STUDENT_CACHE_KEY);
    localStorage.removeItem("last_regNo");
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
