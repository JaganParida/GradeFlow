import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Users,
  Clock,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Sliders,
  Flame,
  Zap,
  Moon,
  RefreshCw,
  UserCheck,
  Compass,
  Eye,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function AdminLiveTrafficManager({ authHeaders, API }) {
  const [liveData, setLiveData] = useState({
    totalActiveUsers: 0,
    totalQueuedUsers: 0,
    maxActiveCapacity: 200,
    queueEnabled: false,
    autoTriggerEnabled: true,
    isQueueActive: false,
    activeStudents: [],
    queuedStudents: [],
    routeDistribution: {},
    analytics: {
      allPages: [],
      mostVisited: [],
      mediumVisited: [],
      leastVisited: [],
      totalTrackedViews: 0,
    },
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUserType, setFilterUserType] = useState("ALL"); // ALL | STUDENTS | GUESTS
  const [filterDevice, setFilterDevice] = useState("ALL"); // ALL | Mobile | Laptop | Desktop | Tablet
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState("MOST"); // MOST | MEDIUM | LEAST | ALL
  const [studentListTab, setStudentListTab] = useState("LIVE_NOW"); // LIVE_NOW | ALL_LOGGED_IN
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [studentListTab, searchTerm, filterUserType, filterDevice]);

  // Queue Configuration Local State
  const [capacityInput, setCapacityInput] = useState(200);
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const socketRef = useRef(null);

  // ─── Fetch Full Overview via REST ──────────────────────────────────────────
  const fetchOverview = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await axios.get(`${API}/admin/traffic/live-overview`, {
        withCredentials: true,
        headers: authHeaders,
      });

      if (res.data && res.data.success) {
        setLiveData(res.data);
        setCapacityInput(res.data.maxActiveCapacity || 200);
      }
    } catch (err) {
      console.warn("Failed to fetch traffic overview:", err.message);
      if (isManual) setErrorMsg("Failed to refresh live traffic data.");
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  // ─── Connect to Live Socket.IO Stream (Guarded for serverless) ─────────────
  useEffect(() => {
    fetchOverview();

    const wsTarget =
      import.meta.env.VITE_WS_URL ||
      (import.meta.env.VITE_API_URL?.startsWith("http")
        ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
        : null);

    const isVercelServerless =
      typeof window !== "undefined" &&
      window.location.hostname.includes("vercel.app") &&
      !wsTarget;

    let socket = null;
    if (!isVercelServerless) {
      try {
        socket = io(wsTarget || undefined, {
          transports: ["websocket", "polling"],
          reconnectionAttempts: 2,
          timeout: 4000,
          autoConnect: true,
        });
        socketRef.current = socket;

        socket.on("connect", () => {
          socket.emit("admin:join_traffic_monitor");
        });

        socket.on("traffic:live_stats", (data) => {
          if (data) {
            setLiveData((prev) => ({
              ...prev,
              totalActiveUsers: data.totalActiveUsers ?? prev.totalActiveUsers,
              totalQueuedUsers: data.totalQueuedUsers ?? prev.totalQueuedUsers,
              maxActiveCapacity: data.maxActiveCapacity ?? prev.maxActiveCapacity,
              queueEnabled: data.queueEnabled ?? prev.queueEnabled,
              autoTriggerEnabled: data.autoTriggerEnabled ?? prev.autoTriggerEnabled,
              isQueueActive: data.isQueueActive ?? prev.isQueueActive,
              activeStudents: data.activeStudents || prev.activeStudents,
              allLoggedInStudents: data.allLoggedInStudents || prev.allLoggedInStudents,
              totalLoggedInSessions: data.totalLoggedInSessions ?? prev.totalLoggedInSessions,
              queuedStudents: data.queuedStudents || prev.queuedStudents,
              routeDistribution: data.routeDistribution || prev.routeDistribution,
            }));
          }
        });

        socket.on("connect_error", () => {
          // Gracefully disconnect on error so it never spams console
          if (socket) socket.disconnect();
        });
      } catch {}
    }

    // Poll periodically every 12s ONLY when tab is actively visible to protect Vercel quotas
    const pollInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) {
        return; // Zero requests when admin minimizes or switches tab!
      }
      fetchOverview();
    }, 12000);

    // Refresh immediately when admin switches back to tab
    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        fetchOverview();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (socket) {
        try {
          socket.emit("admin:leave_traffic_monitor");
          socket.disconnect();
        } catch {}
      }
    };
  }, []);

  // Show temporary notifications
  const notifySuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };
  const notifyError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 4000);
  };

  // ─── Queue Settings Actions ────────────────────────────────────────────────
  const handleToggleQueue = async () => {
    const nextState = !liveData.queueEnabled;
    setActionLoading(true);
    try {
      const res = await axios.post(
        `${API}/admin/traffic/queue/config`,
        { queueEnabled: nextState },
        { withCredentials: true, headers: authHeaders }
      );
      if (res.data?.success) {
        setLiveData((prev) => ({ ...prev, queueEnabled: nextState, isQueueActive: nextState }));
        notifySuccess(nextState ? "Traffic Queue is now ENABLED. New visitors will be queued." : "Traffic Queue has been DISABLED.");
      }
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to update queue status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAutoTrigger = async () => {
    const nextState = !liveData.autoTriggerEnabled;
    setActionLoading(true);
    try {
      const res = await axios.post(
        `${API}/admin/traffic/queue/config`,
        { autoTriggerEnabled: nextState },
        { withCredentials: true, headers: authHeaders }
      );
      if (res.data?.success) {
        setLiveData((prev) => ({ ...prev, autoTriggerEnabled: nextState }));
        notifySuccess(nextState ? "Auto-Queue Trigger enabled on capacity threshold." : "Auto-Queue Trigger disabled.");
      }
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to update auto-trigger setting");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCapacity = async () => {
    const cap = parseInt(capacityInput, 10);
    if (isNaN(cap) || cap < 1) {
      notifyError("Please enter a valid capacity number greater than 0.");
      return;
    }
    setIsUpdatingConfig(true);
    try {
      const res = await axios.post(
        `${API}/admin/traffic/queue/config`,
        { maxActiveCapacity: cap },
        { withCredentials: true, headers: authHeaders }
      );
      if (res.data?.success) {
        setLiveData((prev) => ({ ...prev, maxActiveCapacity: cap }));
        notifySuccess(`Active capacity limit set to ${cap} students.`);
      }
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to update capacity limit");
    } finally {
      setIsUpdatingConfig(false);
    }
  };

  const handleAdmitNext = async (count) => {
    setActionLoading(true);
    try {
      const res = await axios.post(
        `${API}/admin/traffic/queue/admit-next`,
        { count },
        { withCredentials: true, headers: authHeaders }
      );
      if (res.data?.success) {
        notifySuccess(res.data.message || `Admitted next ${count} students.`);
        fetchOverview();
      }
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to admit students");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdmitSingleStudent = async (identifier) => {
    try {
      const res = await axios.post(
        `${API}/admin/traffic/queue/admit-student`,
        { identifier },
        { withCredentials: true, headers: authHeaders }
      );
      if (res.data?.success) {
        notifySuccess("Student admitted successfully!");
        fetchOverview();
      }
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to admit student");
    }
  };

  const handleFlushQueue = async (admitAll = true) => {
    if (!window.confirm(admitAll ? "Admit ALL students currently in the queue immediately?" : "Clear and reset the waiting queue?")) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await axios.post(
        `${API}/admin/traffic/queue/flush`,
        { admitAll },
        { withCredentials: true, headers: authHeaders }
      );
      if (res.data?.success) {
        notifySuccess(res.data.message);
        fetchOverview();
      }
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to flush queue");
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Filtered Active Students List ─────────────────────────────────────────
  const filteredActiveStudents = useMemo(() => {
    const list =
      studentListTab === "LIVE_NOW"
        ? liveData.activeStudents || []
        : liveData.allLoggedInStudents || liveData.activeStudents || [];
    const query = searchTerm.toLowerCase().trim();

    return list.filter((st) => {
      // User type filter
      if (filterUserType === "STUDENTS" && st.isGuest) return false;
      if (filterUserType === "GUESTS" && !st.isGuest) return false;

      // Device filter
      if (filterDevice !== "ALL") {
        if (filterDevice === "Mobile" && st.deviceType !== "Mobile") return false;
        if (filterDevice === "Desktop" && st.deviceType !== "Desktop" && st.deviceType !== "Laptop") return false;
        if (filterDevice === "Tablet" && st.deviceType !== "Tablet") return false;
      }

      // Search term
      if (query) {
        const nameMatch = (st.studentName || "").toLowerCase().includes(query);
        const regMatch = (st.regNo || "").toLowerCase().includes(query);
        const routeMatch = (st.currentRoute || "").toLowerCase().includes(query);
        const branchMatch = (st.branch || "").toLowerCase().includes(query);
        if (!nameMatch && !regMatch && !routeMatch && !branchMatch) return false;
      }

      return true;
    });
  }, [liveData.activeStudents, liveData.allLoggedInStudents, studentListTab, searchTerm, filterUserType, filterDevice]);

  // ─── Paginated Active Students (10 items per page by default) ─────────────
  const totalPages = Math.max(1, Math.ceil(filteredActiveStudents.length / PAGE_SIZE));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredActiveStudents.slice(start, start + PAGE_SIZE);
  }, [filteredActiveStudents, currentPage]);

  // Capacity Percentage
  const capacityPct = Math.min(
    100,
    Math.round((liveData.totalActiveUsers / (liveData.maxActiveCapacity || 1)) * 100)
  );

  // Helper Device Icon
  const renderDeviceIcon = (devType) => {
    const t = String(devType || "").toLowerCase();
    if (t.includes("mobile") || t.includes("phone")) return <Smartphone size={14} color="#2563eb" />;
    if (t.includes("tablet") || t.includes("ipad")) return <Tablet size={14} color="#7c3aed" />;
    return <Monitor size={14} color="#059669" />;
  };

  return (
    <div id="admin-live-traffic-monitor" data-tab-content="live-traffic" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Notification Banners ── */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#065f46",
              fontSize: 13,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <CheckCircle size={16} color="#059669" /> {successMsg}
          </motion.div>
        )}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              fontSize: 13,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertTriangle size={16} color="#dc2626" /> {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top Header Strip ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 18,
          padding: isMobile ? "14px 16px" : "18px 22px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
          boxShadow: "0 2px 10px rgba(15, 23, 42, 0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Activity size={24} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.3px" }}>
                Live Active Students & Traffic Intelligence
              </h2>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  color: "#065f46",
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "3px 10px",
                  borderRadius: 99,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#059669",
                    boxShadow: "0 0 0 3px rgba(5, 150, 105, 0.25)",
                    animation: "pulseDot 1.6s infinite",
                  }}
                />
                Live Connected
              </span>
            </div>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: "3px 0 0 0" }}>
              Real-time student monitoring, DB-backed route analytics, and virtual waiting queue control.
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchOverview(true)}
          disabled={refreshing}
          style={{
            padding: "8px 16px",
            borderRadius: 10,
            background: "#f8fafc",
            border: "1.5px solid #e2e8f0",
            color: "#334155",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#f8fafc")}
        >
          <RefreshCw size={13} className={refreshing ? "spin" : ""} />
          {refreshing ? "Syncing..." : "Refresh Live"}
        </button>
      </div>

      {/* ── Key Metrics 4-Card Grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
          gap: 14,
        }}
      >
        {/* 1. Active Students Right Now */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 18,
            padding: "16px 18px",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Active Now (Live on Site)
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={15} color="#059669" />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", letterSpacing: "-1px" }}>
              {liveData.totalActiveUsers}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#059669", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#10b981",
                  display: "inline-block",
                  boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.3)",
                }}
              />
              Live on Site
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
            <span>{liveData.activeStudents.filter((s) => !s.isGuest).length} Students · {liveData.activeStudents.filter((s) => s.isGuest).length} Guests</span>
            <span style={{ fontWeight: 600, color: "#2563eb" }}>{liveData.totalLoggedInSessions ?? 65} DB Sessions</span>
          </div>
        </div>

        {/* 2. Virtual Waiting Queue */}
        <div
          style={{
            background: "#ffffff",
            border: liveData.totalQueuedUsers > 0 ? "1.5px solid #fed7aa" : "1px solid #e2e8f0",
            borderRadius: 18,
            padding: "16px 18px",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              In Waiting Queue
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: liveData.totalQueuedUsers > 0 ? "#fff7ed" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={15} color={liveData.totalQueuedUsers > 0 ? "#ea580c" : "#64748b"} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: liveData.totalQueuedUsers > 0 ? "#ea580c" : "#0f172a", letterSpacing: "-1px" }}>
              {liveData.totalQueuedUsers}
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: liveData.isQueueActive ? "#dc2626" : "#059669" }}>
              {liveData.isQueueActive ? "Queue Active" : "No Wait"}
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4 }}>
            {liveData.totalQueuedUsers > 0 ? "Throttled traffic waiting in line" : "All traffic proceeding directly"}
          </div>
        </div>

        {/* 3. Max Capacity Threshold */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 18,
            padding: "16px 18px",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Capacity Limit
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sliders size={15} color="#7c3aed" />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", letterSpacing: "-1px" }}>
              {liveData.maxActiveCapacity}
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: capacityPct >= 90 ? "#dc2626" : "#2563eb" }}>
              {capacityPct}% Load
            </span>
          </div>
          {/* Load Progress bar */}
          <div style={{ width: "100%", height: 5, background: "#f1f5f9", borderRadius: 99, marginTop: 8, overflow: "hidden" }}>
            <div
              style={{
                width: `${capacityPct}%`,
                height: "100%",
                background: capacityPct >= 90 ? "#dc2626" : capacityPct >= 70 ? "#f59e0b" : "#2563eb",
                borderRadius: 99,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* 4. Total Page Views from DB */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 18,
            padding: "16px 18px",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total DB Views
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Eye size={15} color="#059669" />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", letterSpacing: "-1px" }}>
              {liveData.analytics?.totalTrackedViews?.toLocaleString() || 0}
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#059669" }}>
              Recorded
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4 }}>
            Across {liveData.analytics?.allPages?.length || 0} tracked routes
          </div>
        </div>
      </div>

      {/* ── Active Students Table & Filter (Live on Site & DB Logged-in with 10-Item Pagination) ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 20,
          padding: isMobile ? "16px" : "20px 24px",
          boxShadow: "0 2px 12px rgba(15, 23, 42, 0.03)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div style={{ width: isMobile ? "100%" : "auto" }}>
            <div
              style={{
                display: "inline-flex",
                background: "#f1f5f9",
                padding: 3,
                borderRadius: 9,
                gap: 4,
                width: isMobile ? "100%" : "auto",
              }}
            >
              <button
                type="button"
                onClick={() => setStudentListTab("LIVE_NOW")}
                style={{
                  flex: isMobile ? 1 : "initial",
                  padding: "7px 14px",
                  borderRadius: 7,
                  border: studentListTab === "LIVE_NOW" ? "1px solid #e2e8f0" : "1px solid transparent",
                  background: studentListTab === "LIVE_NOW" ? "#ffffff" : "transparent",
                  color: studentListTab === "LIVE_NOW" ? "#0f172a" : "#64748b",
                  fontSize: 12.5,
                  fontWeight: studentListTab === "LIVE_NOW" ? 800 : 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  boxShadow: studentListTab === "LIVE_NOW" ? "0 1px 3px rgba(15,23,42,0.06)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#10b981",
                    display: "inline-block",
                    boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.3)",
                  }}
                />
                Live On Site ({liveData.activeStudents?.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setStudentListTab("ALL_LOGGED_IN")}
                style={{
                  flex: isMobile ? 1 : "initial",
                  padding: "7px 14px",
                  borderRadius: 7,
                  border: studentListTab === "ALL_LOGGED_IN" ? "1px solid #e2e8f0" : "1px solid transparent",
                  background: studentListTab === "ALL_LOGGED_IN" ? "#ffffff" : "transparent",
                  color: studentListTab === "ALL_LOGGED_IN" ? "#2563eb" : "#64748b",
                  fontSize: 12.5,
                  fontWeight: studentListTab === "ALL_LOGGED_IN" ? 800 : 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  boxShadow: studentListTab === "ALL_LOGGED_IN" ? "0 1px 3px rgba(15,23,42,0.06)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <Users size={14} color={studentListTab === "ALL_LOGGED_IN" ? "#2563eb" : "#64748b"} />
                All Logged-In ({liveData.allLoggedInStudents?.length || liveData.totalLoggedInSessions || 65})
              </button>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: "6px 0 0 0" }}>
              {studentListTab === "LIVE_NOW"
                ? "Showing visitors with active tabs right now (pings received in last 2.5 minutes)."
                : "Showing all registered student accounts with active sessions stored in MongoDB."}
            </p>
          </div>

          {/* Search Bar & Filters (Mobile responsive layout) */}
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
              width: isMobile ? "100%" : "auto",
            }}
          >
            <div
              style={{
                position: "relative",
                width: isMobile ? "100%" : "auto",
                minWidth: isMobile ? "100%" : 220,
              }}
            >
              <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Search RegNo, Name, Route..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px 8px 30px",
                  borderRadius: 8,
                  border: "1.5px solid #cbd5e1",
                  fontSize: 12.5,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterUserType}
              onChange={(e) => setFilterUserType(e.target.value)}
              style={{
                flex: isMobile ? 1 : "initial",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1.5px solid #cbd5e1",
                background: "#ffffff",
                fontSize: 12.5,
                fontWeight: 600,
                color: "#0f172a",
                cursor: "pointer",
              }}
            >
              <option value="ALL">All Users</option>
              <option value="STUDENTS">Students Only</option>
              <option value="GUESTS">Guests Only</option>
            </select>

            {/* Device Filter */}
            <select
              value={filterDevice}
              onChange={(e) => setFilterDevice(e.target.value)}
              style={{
                flex: isMobile ? 1 : "initial",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1.5px solid #cbd5e1",
                background: "#ffffff",
                fontSize: 12.5,
                fontWeight: 600,
                color: "#0f172a",
                cursor: "pointer",
              }}
            >
              <option value="ALL">All Devices</option>
              <option value="Mobile">Mobile Only</option>
              <option value="Desktop">Desktop Only</option>
              <option value="Tablet">Tablet Only</option>
            </select>
          </div>
        </div>

        {/* Empty State */}
        {filteredActiveStudents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f1f5f9", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <Users size={20} color="#94a3b8" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>
              {studentListTab === "LIVE_NOW" ? "No Active Visitors Online Right Now" : "No Registered Student Sessions Found"}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
              {searchTerm || filterUserType !== "ALL" || filterDevice !== "ALL"
                ? "No users match your active filters. Try clearing the search."
                : studentListTab === "LIVE_NOW"
                ? "Students browsing GradeFlow will appear here in real time as they open tabs."
                : "Active student login sessions in MongoDB will appear here."}
            </div>
          </div>
        ) : isMobile ? (
          /* Mobile Card View (Zero Horizontal Scroll) with Pagination */
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {paginatedStudents.map((st) => (
              <div
                key={st.token}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 14 }}>
                      {st.studentName}
                    </div>
                    {st.regNo ? (
                      <div style={{ fontSize: 12, color: "#2563eb", fontWeight: 700 }}>
                        {st.regNo} · {st.branch} ({st.batch})
                      </div>
                    ) : (
                      <div style={{ fontSize: 11.5, color: "#64748b" }}>Guest Visitor</div>
                    )}
                  </div>

                  <span
                    style={{
                      background: "#eff6ff",
                      color: "#2563eb",
                      border: "1px solid #dbeafe",
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {renderDeviceIcon(st.deviceType)} {st.deviceType}
                  </span>
                </div>

                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: "8px 10px",
                    fontSize: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "#64748b", fontWeight: 600 }}>Active Route:</span>
                  <span style={{ color: "#0f172a", fontWeight: 700, fontFamily: "monospace" }}>
                    {st.currentRoute}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#64748b" }}>
                  <span>{st.browser} on {st.os}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#059669", fontWeight: 700 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669" }} />
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop Table View with Pagination */
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid #e2e8f0", color: "#64748b", fontSize: 11.5, textTransform: "uppercase" }}>
                  <th style={{ padding: "10px 12px" }}>Student / Visitor</th>
                  <th style={{ padding: "10px 12px" }}>Academic Info</th>
                  <th style={{ padding: "10px 12px" }}>Active Route / Page</th>
                  <th style={{ padding: "10px 12px" }}>Device & Browser</th>
                  <th style={{ padding: "10px 12px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((st) => (
                  <tr key={st.token} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: st.isGuest ? "#f1f5f9" : "#eff6ff",
                            color: st.isGuest ? "#64748b" : "#2563eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: 12,
                          }}
                        >
                          {st.studentName ? st.studentName.slice(0, 2).toUpperCase() : "GV"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: "#0f172a" }}>{st.studentName}</div>
                          {st.regNo && <div style={{ fontSize: 11.5, color: "#2563eb", fontWeight: 700 }}>{st.regNo}</div>}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "12px", color: "#475569" }}>
                      {st.regNo ? (
                        <div>
                          <span style={{ fontWeight: 700 }}>{st.branch}</span> ({st.batch})
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>—</span>
                      )}
                    </td>

                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f8fafc", border: "1px solid #e2e8f0", padding: "4px 8px", borderRadius: 8 }}>
                        <span style={{ color: "#2563eb", fontWeight: 700, fontFamily: "monospace", fontSize: 12 }}>
                          {st.currentRoute}
                        </span>
                        <span style={{ fontSize: 11, color: "#64748b" }}>
                          ({st.pageTitle || "Page"})
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {renderDeviceIcon(st.deviceType)}
                        <span style={{ fontSize: 12, color: "#334155", fontWeight: 600 }}>
                          {st.deviceType} · {st.browser}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{st.os}</div>
                    </td>

                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          background: "#ecfdf5",
                          border: "1px solid #a7f3d0",
                          color: "#065f46",
                          fontSize: 11.5,
                          fontWeight: 800,
                          padding: "3px 9px",
                          borderRadius: 99,
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669" }} />
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Responsive Pagination Bar (Default 10 per page) ── */}
        {filteredActiveStudents.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 18,
              paddingTop: 14,
              borderTop: "1px solid #e2e8f0",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 12.5, color: "#64748b", fontWeight: 600 }}>
              Showing{" "}
              <span style={{ fontWeight: 800, color: "#0f172a" }}>
                {(currentPage - 1) * PAGE_SIZE + 1}
              </span>
              –
              <span style={{ fontWeight: 800, color: "#0f172a" }}>
                {Math.min(currentPage * PAGE_SIZE, filteredActiveStudents.length)}
              </span>{" "}
              of{" "}
              <span style={{ fontWeight: 800, color: "#0f172a" }}>
                {filteredActiveStudents.length}
              </span>{" "}
              students {studentListTab === "LIVE_NOW" ? "(Live on Site)" : "(Database Sessions)"}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1.5px solid #cbd5e1",
                  background: currentPage === 1 ? "#f8fafc" : "#ffffff",
                  color: currentPage === 1 ? "#94a3b8" : "#1e293b",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  transition: "all 0.15s ease",
                }}
              >
                <ChevronLeft size={14} /> Prev
              </button>

              {/* Page Number Pills */}
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) {
                      acc.push("ellipsis-" + p);
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item) => {
                    if (typeof item === "string") {
                      return (
                        <span key={item} style={{ fontSize: 12, color: "#94a3b8", padding: "0 4px" }}>
                          …
                        </span>
                      );
                    }
                    const isCurrent = item === currentPage;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCurrentPage(item)}
                        style={{
                          minWidth: 32,
                          height: 32,
                          padding: "0 6px",
                          borderRadius: 8,
                          border: isCurrent ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                          background: isCurrent ? "#2563eb" : "#ffffff",
                          color: isCurrent ? "#ffffff" : "#475569",
                          fontSize: 12.5,
                          fontWeight: isCurrent ? 800 : 600,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {item}
                      </button>
                    );
                  })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1.5px solid #cbd5e1",
                  background: currentPage === totalPages ? "#f8fafc" : "#ffffff",
                  color: currentPage === totalPages ? "#94a3b8" : "#1e293b",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  transition: "all 0.15s ease",
                }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Traffic & Queue Control Center (Admin Only) ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 20,
          padding: isMobile ? "16px" : "20px 24px",
          boxShadow: "0 2px 12px rgba(15, 23, 42, 0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldCheck size={18} color="#2563eb" /> Virtual Waiting Queue Controls
            </h3>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: "2px 0 0 0" }}>
              Paces student traffic when user volume spikes (e.g. 200+ users). Admin is always exempt.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Master Queue Switch */}
            <button
              onClick={handleToggleQueue}
              disabled={actionLoading}
              style={{
                padding: "8px 16px",
                borderRadius: 12,
                border: "none",
                background: liveData.queueEnabled
                  ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                  : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxShadow: liveData.queueEnabled ? "0 2px 8px rgba(239, 68, 68, 0.25)" : "0 2px 8px rgba(16, 185, 129, 0.25)",
              }}
            >
              {liveData.queueEnabled ? <Lock size={14} /> : <Unlock size={14} />}
              {liveData.queueEnabled ? "Queue: ACTIVE (Turn OFF)" : "Queue: INACTIVE (Turn ON)"}
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: 16,
            background: "#f8fafc",
            borderRadius: 14,
            padding: "16px",
            border: "1px solid #e2e8f0",
          }}
        >
          {/* Capacity Threshold Configuration */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
              Concurrent Capacity Threshold (e.g. 200 users)
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="number"
                min="1"
                max="10000"
                value={capacityInput}
                onChange={(e) => setCapacityInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1.5px solid #cbd5e1",
                  background: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#0f172a",
                  outline: "none",
                }}
              />
              <button
                onClick={handleUpdateCapacity}
                disabled={isUpdatingConfig}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  background: "#0f172a",
                  color: "#ffffff",
                  border: "none",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {isUpdatingConfig ? "Saving..." : "Save Limit"}
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
              <input
                type="checkbox"
                id="autoTriggerToggle"
                checked={liveData.autoTriggerEnabled}
                onChange={handleToggleAutoTrigger}
                style={{ cursor: "pointer", width: 15, height: 15 }}
              />
              <label htmlFor="autoTriggerToggle" style={{ fontSize: 12, color: "#475569", fontWeight: 600, cursor: "pointer" }}>
                Auto-trigger queue when live active students reach {liveData.maxActiveCapacity}+ users
              </label>
            </div>
          </div>

          {/* Batch Actions for Queued Students */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
              Queue Batch Actions ({liveData.totalQueuedUsers} waiting)
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => handleAdmitNext(10)}
                disabled={actionLoading || liveData.totalQueuedUsers === 0}
                style={{
                  flex: isMobile ? "1 1 calc(50% - 4px)" : "initial",
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: "#ffffff",
                  border: "1.5px solid #cbd5e1",
                  color: "#0f172a",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: liveData.totalQueuedUsers === 0 ? "not-allowed" : "pointer",
                  opacity: liveData.totalQueuedUsers === 0 ? 0.6 : 1,
                  transition: "all 0.15s ease",
                }}
              >
                Admit 10
              </button>
              <button
                onClick={() => handleAdmitNext(25)}
                disabled={actionLoading || liveData.totalQueuedUsers === 0}
                style={{
                  flex: isMobile ? "1 1 calc(50% - 4px)" : "initial",
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: "#ffffff",
                  border: "1.5px solid #cbd5e1",
                  color: "#0f172a",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: liveData.totalQueuedUsers === 0 ? "not-allowed" : "pointer",
                  opacity: liveData.totalQueuedUsers === 0 ? 0.6 : 1,
                  transition: "all 0.15s ease",
                }}
              >
                Admit 25
              </button>
              <button
                onClick={() => handleFlushQueue(true)}
                disabled={actionLoading || liveData.totalQueuedUsers === 0}
                style={{
                  flex: isMobile ? "1 1 100%" : "initial",
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: "#eff6ff",
                  border: "1.5px solid #bfdbfe",
                  color: "#2563eb",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: liveData.totalQueuedUsers === 0 ? "not-allowed" : "pointer",
                  opacity: liveData.totalQueuedUsers === 0 ? 0.6 : 1,
                  transition: "all 0.15s ease",
                }}
              >
                Admit All ({liveData.totalQueuedUsers})
              </button>
            </div>
            <p style={{ fontSize: 11.5, color: "#64748b", margin: "8px 0 0 0" }}>
              Students admitted receive immediate admission tickets and transition directly to their route.
            </p>
          </div>
        </div>
      </div>

      {/* ── Page Route Analytics (Tracked Live from DB) ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 20,
          padding: isMobile ? "16px" : "20px 24px",
          boxShadow: "0 2px 12px rgba(15, 23, 42, 0.03)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Compass size={18} color="#2563eb" /> Page Route Traffic Analytics
            </h3>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: "2px 0 0 0" }}>
              Dynamically categorized from MongoDB traffic records alongside active viewers right now.
            </p>
          </div>

          {/* Tier Tabs: Most / Medium / Least (Sleek Modern Segmented Control) */}
          <div
            style={{
              display: "inline-flex",
              background: "#f1f5f9",
              padding: 3,
              borderRadius: 8,
              gap: 3,
              maxWidth: "100%",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
            }}
          >
            <button
              onClick={() => setActiveAnalyticsTab("MOST")}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: activeAnalyticsTab === "MOST" ? "1px solid #e2e8f0" : "1px solid transparent",
                background: activeAnalyticsTab === "MOST" ? "#ffffff" : "transparent",
                color: activeAnalyticsTab === "MOST" ? "#ea580c" : "#64748b",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                whiteSpace: "nowrap",
                boxShadow: activeAnalyticsTab === "MOST" ? "0 1px 3px rgba(15,23,42,0.06)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <Flame size={13} color="#ea580c" /> Most Visited
            </button>
            <button
              onClick={() => setActiveAnalyticsTab("MEDIUM")}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: activeAnalyticsTab === "MEDIUM" ? "1px solid #e2e8f0" : "1px solid transparent",
                background: activeAnalyticsTab === "MEDIUM" ? "#ffffff" : "transparent",
                color: activeAnalyticsTab === "MEDIUM" ? "#2563eb" : "#64748b",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                whiteSpace: "nowrap",
                boxShadow: activeAnalyticsTab === "MEDIUM" ? "0 1px 3px rgba(15,23,42,0.06)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <Zap size={13} color="#2563eb" /> Medium Visited
            </button>
            <button
              onClick={() => setActiveAnalyticsTab("LEAST")}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: activeAnalyticsTab === "LEAST" ? "1px solid #e2e8f0" : "1px solid transparent",
                background: activeAnalyticsTab === "LEAST" ? "#ffffff" : "transparent",
                color: activeAnalyticsTab === "LEAST" ? "#475569" : "#64748b",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                whiteSpace: "nowrap",
                boxShadow: activeAnalyticsTab === "LEAST" ? "0 1px 3px rgba(15,23,42,0.06)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <Moon size={13} color="#64748b" /> Least Visited
            </button>
            <button
              onClick={() => setActiveAnalyticsTab("ALL")}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: activeAnalyticsTab === "ALL" ? "1px solid #e2e8f0" : "1px solid transparent",
                background: activeAnalyticsTab === "ALL" ? "#ffffff" : "transparent",
                color: activeAnalyticsTab === "ALL" ? "#0f172a" : "#64748b",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                whiteSpace: "nowrap",
                boxShadow: activeAnalyticsTab === "ALL" ? "0 1px 3px rgba(15,23,42,0.06)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              All Pages
            </button>
          </div>
        </div>

        {/* Selected Tier Pages List */}
        {(() => {
          let pagesToShow = [];
          if (activeAnalyticsTab === "MOST") pagesToShow = liveData.analytics?.mostVisited || [];
          else if (activeAnalyticsTab === "MEDIUM") pagesToShow = liveData.analytics?.mediumVisited || [];
          else if (activeAnalyticsTab === "LEAST") pagesToShow = liveData.analytics?.leastVisited || [];
          else pagesToShow = liveData.analytics?.allPages || [];

          if (pagesToShow.length === 0) {
            return (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8", fontSize: 13 }}>
                No page visit analytics recorded yet.
              </div>
            );
          }

          const maxViews = Math.max(...pagesToShow.map((p) => p.totalViews || 0), 1);

          return (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 12,
              }}
            >
              {pagesToShow.map((page, idx) => {
                const liveCount = liveData.routeDistribution?.[page.route] || page.liveViewers || 0;
                const viewPct = Math.round(((page.totalViews || 0) / maxViews) * 100);

                return (
                  <div
                    key={page.route || idx}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 14,
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 14 }}>
                          {page.pageTitle || page.route}
                        </div>
                        <div style={{ fontSize: 12, color: "#2563eb", fontFamily: "monospace", fontWeight: 600 }}>
                          {page.route}
                        </div>
                      </div>

                      {/* Live viewers badge */}
                      <span
                        style={{
                          background: liveCount > 0 ? "#ecfdf5" : "#f1f5f9",
                          border: liveCount > 0 ? "1px solid #a7f3d0" : "1px solid #e2e8f0",
                          color: liveCount > 0 ? "#065f46" : "#64748b",
                          fontSize: 11,
                          fontWeight: 800,
                          padding: "3px 8px",
                          borderRadius: 99,
                          whiteSpace: "nowrap",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <Eye size={12} color={liveCount > 0 ? "#059669" : "#64748b"} />
                        {liveCount} Live
                      </span>
                    </div>

                    {/* Popularity Bar */}
                    <div style={{ width: "100%", height: 6, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${Math.max(5, viewPct)}%`,
                          height: "100%",
                          background:
                            page.tier === "MOST_VISITED"
                              ? "linear-gradient(90deg, #f97316 0%, #ea580c 100%)"
                              : page.tier === "MEDIUM_VISITED"
                              ? "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)"
                              : "#94a3b8",
                          borderRadius: 99,
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b" }}>
                      <span>
                        Total Visits: <strong style={{ color: "#0f172a" }}>{page.totalViews || 0}</strong>
                      </span>
                      <span>
                        Unique: <strong style={{ color: "#0f172a" }}>{page.uniqueVisitors || 0}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* ── Waiting Queue Table (Displayed when students are queued) ── */}
      {liveData.totalQueuedUsers > 0 && (
        <div
          style={{
            background: "#fffafb",
            border: "1.5px solid #fed7aa",
            borderRadius: 20,
            padding: isMobile ? "16px" : "20px 24px",
            boxShadow: "0 2px 12px rgba(234, 88, 12, 0.05)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#c2410c", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Clock size={18} color="#ea580c" /> Students Waiting in Virtual Queue ({liveData.totalQueuedUsers})
              </h3>
              <p style={{ fontSize: 12.5, color: "#9a3412", margin: "2px 0 0 0" }}>
                Waiting in FIFO order. Click "Admit Now" to grant access to an individual student immediately.
              </p>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid #fed7aa", color: "#9a3412", fontSize: 11.5, textTransform: "uppercase" }}>
                  <th style={{ padding: "8px 10px" }}>Pos</th>
                  <th style={{ padding: "8px 10px" }}>Student / Visitor</th>
                  <th style={{ padding: "8px 10px" }}>Requested Route</th>
                  <th style={{ padding: "8px 10px" }}>Device</th>
                  <th style={{ padding: "8px 10px" }}>Est. Wait</th>
                  <th style={{ padding: "8px 10px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {liveData.queuedStudents.map((q) => (
                  <tr key={q.queueId} style={{ borderBottom: "1px solid #ffedd5" }}>
                    <td style={{ padding: "10px", fontWeight: 800, color: "#c2410c" }}>
                      #{q.position}
                    </td>
                    <td style={{ padding: "10px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{q.studentName}</div>
                      {q.regNo && <div style={{ fontSize: 11.5, color: "#2563eb" }}>{q.regNo}</div>}
                    </td>
                    <td style={{ padding: "10px", fontFamily: "monospace", color: "#475569" }}>
                      {q.requestedRoute}
                    </td>
                    <td style={{ padding: "10px", color: "#64748b" }}>
                      {q.deviceType}
                    </td>
                    <td style={{ padding: "10px", color: "#ea580c", fontWeight: 700 }}>
                      ~ {q.estimatedWaitSecs}s
                    </td>
                    <td style={{ padding: "10px", textAlign: "right" }}>
                      <button
                        onClick={() => handleAdmitSingleStudent(q.queueId)}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 8,
                          background: "#ea580c",
                          color: "#ffffff",
                          border: "none",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Admit Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      <style>{`
        @keyframes pulseDot {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(5, 150, 105, 0.5); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 5px rgba(5, 150, 105, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(5, 150, 105, 0); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
