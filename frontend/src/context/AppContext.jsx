import { createContext, useContext, useState, useEffect, useRef } from "react";
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
  
  const socketRef = useRef(null);
  const [queuePosition, setQueuePosition] = useState(null);
  const [isAdmitted, setIsAdmitted] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);

  useEffect(() => {
    socketRef.current = io(API.replace('/api', ''));
    
    socketRef.current.on("stats", (newStats) => {
      setStats(newStats);
    });

    socketRef.current.on("session_expired", (data) => {
      alert(data.message || "Session expired");
      setIsAdmitted(false);
      setSessionTimeLeft(0);
      window.location.href = "/";
    });

    socketRef.current.on("queue_update", (data) => {
      setQueuePosition(data.position);
    });

    socketRef.current.on("queue_admitted", () => {
      setIsAdmitted(true);
      setQueuePosition(null);
      setSessionTimeLeft(180);
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
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    let timer;
    if (isAdmitted && sessionTimeLeft > 0) {
      timer = setInterval(() => {
        setSessionTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAdmitted, sessionTimeLeft]);

  const leaveSession = () => {
    if (socketRef.current) {
      socketRef.current.emit("leave_session");
      setIsAdmitted(false);
      setSessionTimeLeft(0);
    }
  };

  const joinQueue = (regNo) => {
    return new Promise((resolve) => {
      if (socketRef.current) {
        socketRef.current.emit("join_queue", { regNo }, (response) => {
          if (response.status === "admitted") {
            setIsAdmitted(true);
            setSessionTimeLeft(180);
          } else if (response.status === "queued") {
            setQueuePosition(response.position);
          }
          resolve(response);
        });
      } else {
        resolve({ status: "error" });
      }
    });
  };

  const leaveQueue = () => {
    if (socketRef.current) {
      socketRef.current.emit("leave_queue");
      setQueuePosition(null);
    }
  };

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
        leaveSession,
        sessionTimeLeft,
        queuePosition,
        isAdmitted,
        setIsAdmitted,
        joinQueue,
        leaveQueue,
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
