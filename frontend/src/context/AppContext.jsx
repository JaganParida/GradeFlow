import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
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
  const navigate = useNavigate();
  const [sessionExpiredPopup, setSessionExpiredPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  useEffect(() => {
    socketRef.current = io(API.replace('/api', ''));
    
    socketRef.current.on("stats", (newStats) => {
      setStats(newStats);
    });

    socketRef.current.on("session_expired", (data) => {
      setPopupMessage(data.message || "Your 3-minute session has expired. To give others a chance, you have been returned to the home page.");
      setSessionExpiredPopup(true);
      setIsAdmitted(false);
      setSessionTimeLeft(0);
      navigate("/");
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
      <AnimatePresence>
        {sessionExpiredPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)",
              zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center"
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                background: "var(--card)", border: "1px solid var(--border)",
                padding: 32, borderRadius: 20, maxWidth: 400, width: "90%",
                textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
              }}
            >
              <div style={{ background: "rgba(239, 68, 68, 0.1)", width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <AlertTriangle color="var(--danger)" size={32} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Time's Up!</h2>
              <p style={{ color: "var(--secondary)", fontSize: 15, marginBottom: 24, lineHeight: 1.5 }}>
                {popupMessage}
              </p>
              <button
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "12px" }}
                onClick={() => setSessionExpiredPopup(false)}
              >
                Okay, got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppCtx.Provider>
  );
}

export const useApp = () => useContext(AppCtx);
