import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const API = import.meta.env.VITE_API_URL || "/api";
const AppCtx = createContext();

export function AppProvider({ children }) {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminToken, setAdminToken] = useState(
    () => localStorage.getItem("gf_token") || "",
  );
  
  // Real-time queue & cooldown state
  const [stats, setStats] = useState({ activeUsers: 0, activeRequests: 0, maxRequests: 5 });
  const [cooldownExpiry, setCooldownExpiry] = useState(
    () => Number(localStorage.getItem("gf_cooldown")) || 0
  );

  useEffect(() => {
    // Connect to Socket.io backend
    const socket = io(API.replace('/api', ''));
    
    socket.on("stats", (data) => {
      setStats(data);
    });

    const handleStorageChange = (e) => {
      if (e.key === "gf_token") {
        setAdminToken(e.newValue || "");
      } else if (e.key === "gf_cooldown") {
        setCooldownExpiry(Number(e.newValue) || 0);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      socket.disconnect();
    };
  }, []);

  async function fetchStudent(regNo) {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${API}/student/${regNo}`);
      setStudentData(data);
      localStorage.setItem("last_regNo", data.regNo);
      
      // Start cooldown timer (2 mins)
      const expiry = Date.now() + 2 * 60 * 1000;
      localStorage.setItem("gf_cooldown", expiry.toString());
      setCooldownExpiry(expiry);
      
      return data;
    } catch (e) {
      if (e.response?.status === 429) {
        const serverExpiry = e.response.data?.cooldownExpiry;
        if (serverExpiry) {
          localStorage.setItem("gf_cooldown", serverExpiry.toString());
          setCooldownExpiry(serverExpiry);
        }
        setError(e.response.data?.message || "Too many requests. Please slow down and wait a minute.");
      } else if (e.response?.status === 503) {
        setError(e.response.data?.message || "Server is currently full. Please try again in a moment.");
      } else if (e.response?.status >= 500) {
        setError("Server error. Please try again later.");
      } else {
        setError(e.response?.data?.message || "Student not found");
      }
      setStudentData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function adminLogin(email, password) {
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
    setAdminToken(data.token);
    localStorage.setItem("gf_token", data.token);
    return data;
  }

  function adminLogout() {
    setAdminToken("");
    localStorage.removeItem("gf_token");
  }

  const authHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

  return (
    <AppCtx.Provider
      value={{
        studentData,
        loading,
        error,
        fetchStudent,
        adminToken,
        adminLogin,
        adminLogout,
        authHeaders,
        API,
        stats,
        cooldownExpiry,
      }}
    >
      {children}
    </AppCtx.Provider>
  );
}

export const useApp = () => useContext(AppCtx);
