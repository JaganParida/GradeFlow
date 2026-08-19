import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

// Set axios to send cookies with every request
axios.defaults.withCredentials = true;

const AppCtx = createContext();

export function AppProvider({ children }) {
  // Proactively wipe any legacy sensitive data from localStorage on startup
  useEffect(() => {
    try {
      localStorage.removeItem("gf_student_data");
      localStorage.removeItem("gf_student_session");
      localStorage.removeItem("last_regNo");
      localStorage.removeItem("last_studentName");
      localStorage.removeItem("gf_cache_version");
    } catch {}
  }, []);

  const [studentData, setStudentData] = useState(null);
  const [studentSession, setStudentSession] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
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

  // ─── Check Auth on Startup (Both Admin & Student from HttpOnly Cookie) ─
  useEffect(() => {
    const checkAuth = async () => {
      // 1. Check Admin Auth
      try {
        const resAdmin = await axios.get(`${API_BASE}/auth/me`);
        if (resAdmin.data?.success) {
          setAdminToken(true);
        } else {
          setAdminToken(false);
        }
      } catch {
        setAdminToken(false);
      }

      // 2. Check Student Session (Direct from Server via HttpOnly Cookie)
      try {
        const resStudent = await axios.get(`${API_BASE}/auth/student/me`);
        if (resStudent.data?.success && resStudent.data?.student) {
          setStudentSession(resStudent.data.student);
          fetchStudent(resStudent.data.student.regNo, 2, 500);
        } else {
          setStudentSession(null);
          setStudentData(null);
        }
      } catch (err) {
        setStudentSession(null);
        setStudentData(null);
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

  const studentLogout = async () => {
    setIsLoggingOut(true);

    // 1. Immediately wipe in-memory state for instant UI response
    setStudentSession(null);
    setStudentData(null);
    setError("");

    try {
      localStorage.removeItem("gf_student_data");
      localStorage.removeItem("gf_student_session");
      localStorage.removeItem("last_regNo");
      localStorage.removeItem("last_studentName");
    } catch {}

    // 2. Clear session on server in background
    try {
      await axios.post(`${API_BASE}/auth/student/logout`);
    } catch (err) {
      console.warn("Student logout server sync:", err);
    } finally {
      setIsLoggingOut(false);
      navigate("/");
    }
  };

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
      const res = await axios.get(`${API_BASE}/student/${cleanReg}`);
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

  const hasActiveSession = Boolean(studentData || studentSession);

  return (
    <AppCtx.Provider
      value={{
        studentData,
        studentSession,
        isAuthModalOpen,
        setIsAuthModalOpen,
        openStudentAuthModal: () => setIsAuthModalOpen(true),
        closeStudentAuthModal: () => setIsAuthModalOpen(false),
        sendStudentOtp,
        verifyStudentOtp,
        studentLogout,
        isLoggingOut,
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

