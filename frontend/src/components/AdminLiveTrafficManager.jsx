import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
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
  Route,
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
  Loader2,
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

  // ─── Fetch Overview via REST (On-Demand, Zero Polling) ─────────────────────
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
      if (isManual) setErrorMsg("Failed to refresh traffic analytics.");
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
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

  // Helper: Format seconds to clean human-readable duration (e.g. "3m 20s" or "1h 15m")
  const formatDuration = (secs = 0) => {
    if (!secs || secs < 5) return "< 10s";
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m < 60) return `${m}m ${s > 0 ? `${s}s` : ""}`.trim();
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${h}h ${remM > 0 ? `${remM}m` : ""}`.trim();
  };

  // ─── Filtered Active Students List (Strictly Excludes Admin & 230301120327) ──
  const filteredActiveStudents = useMemo(() => {
    const list = liveData.activeStudents || [];
    const query = searchTerm.toLowerCase().trim();

    return list.filter((st) => {
      // 1. Strictly exclude developer/owner special student 230301120327
      if (st.regNo === "230301120327") return false;

      // 2. User type filter
      if (filterUserType === "STUDENTS" && st.isGuest) return false;
      if (filterUserType === "GUESTS" && !st.isGuest) return false;

      // 3. Device filter
      if (filterDevice !== "ALL") {
        const d = String(st.deviceType || "").toLowerCase();
        if (filterDevice === "Mobile" && !d.includes("mobile") && !d.includes("phone")) return false;
        if (filterDevice === "Desktop" && !d.includes("desktop") && !d.includes("laptop")) return false;
        if (filterDevice === "Tablet" && !d.includes("tablet") && !d.includes("ipad")) return false;
      }

      // 4. Search term (RegNo, Name, Route, Most Visited Route, Branch)
      if (query) {
        const nameMatch = (st.studentName || "").toLowerCase().includes(query);
        const regMatch = (st.regNo || "").toLowerCase().includes(query);
        const routeMatch = (st.currentRoute || "").toLowerCase().includes(query);
        const titleMatch = (st.pageTitle || "").toLowerCase().includes(query);
        const mostMatch = (st.mostVisitedPageTitle || st.mostVisitedRoute || "").toLowerCase().includes(query);
        const branchMatch = (st.branch || "").toLowerCase().includes(query);
        if (!nameMatch && !regMatch && !routeMatch && !titleMatch && !mostMatch && !branchMatch) return false;
      }

      return true;
    });
  }, [liveData.activeStudents, searchTerm, filterUserType, filterDevice]);

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
          padding: isMobile ? "14px 14px" : "18px 22px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          gap: isMobile ? 12 : 14,
          boxShadow: "0 2px 10px rgba(15, 23, 42, 0.02)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", gap: 12 }}>
          <div
            style={{
              width: isMobile ? 38 : 44,
              height: isMobile ? 38 : 44,
              borderRadius: 11,
              background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: isMobile ? 1 : 0,
            }}
          >
            <Route size={isMobile ? 20 : 24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h2 style={{ fontSize: isMobile ? 16.5 : 20, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.3px", lineHeight: 1.25 }}>
                Student Route & Device Intelligence
              </h2>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#1d4ed8",
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: 99,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#2563eb",
                    display: "inline-block",
                  }}
                />
                Activity Logged (On-Demand)
              </span>
            </div>
            <p style={{ fontSize: isMobile ? 11.5 : 12.5, color: "#64748b", margin: "4px 0 0 0", lineHeight: 1.4 }}>
              Student device identification, route duration analytics, and top visited pages. Excludes Admin and 230301120327.
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchOverview(true)}
          disabled={refreshing}
          style={{
            padding: isMobile ? "8px 12px" : "8px 16px",
            borderRadius: 10,
            background: "#f8fafc",
            border: "1.5px solid #e2e8f0",
            color: "#334155",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "all 0.15s ease",
            width: isMobile ? "100%" : "auto",
            boxSizing: "border-box",
          }}
        >
          <RefreshCw size={13} className={refreshing ? "spin" : ""} />
          {refreshing ? "Syncing..." : "Refresh Activity"}
        </button>
      </div>

      {/* ── Key Metrics 4-Card Grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
          gap: isMobile ? 10 : 14,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* 1. Tracked Students */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: isMobile ? 14 : 18,
            padding: isMobile ? "12px 11px" : "16px 18px",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.02)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minWidth: 0,
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: isMobile ? 6 : 8, minWidth: 0 }}>
            <span
              style={{
                fontSize: isMobile ? 10.5 : 12,
                fontWeight: 800,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                flex: 1,
                minWidth: 0,
                lineHeight: 1.2,
              }}
              title="Tracked Students"
            >
              Tracked Students
            </span>
            <div
              style={{
                width: isMobile ? 24 : 28,
                height: isMobile ? 24 : 28,
                borderRadius: 7,
                background: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Users size={isMobile ? 13 : 15} color="#2563eb" />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: isMobile ? 5 : 8, flexWrap: "wrap" }}>
            {loading ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, height: isMobile ? 28 : 38 }}>
                <span className="skeleton" style={{ width: 44, maxWidth: "100%", height: isMobile ? 24 : 28, borderRadius: 6, display: "inline-block" }} />
              </div>
            ) : (
              <>
                <span style={{ fontSize: isMobile ? 22 : 32, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.5px", lineHeight: 1 }}>
                  {filteredActiveStudents.length}
                </span>
                <span style={{ fontSize: isMobile ? 10 : 12, fontWeight: 700, color: "#2563eb", whiteSpace: "nowrap" }}>
                  Students Logged
                </span>
              </>
            )}
          </div>
          <div style={{ fontSize: isMobile ? 10 : 11.5, color: "#64748b", marginTop: isMobile ? 4 : 6, minWidth: 0, overflow: "hidden" }}>
            {loading ? (
              <span className="skeleton" style={{ width: "75%", maxWidth: "100%", height: 12, borderRadius: 4, display: "inline-block" }} />
            ) : (
              <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <span>Excludes Admin & 230301120327</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Total Page Views */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: isMobile ? 14 : 18,
            padding: isMobile ? "12px 11px" : "16px 18px",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.02)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minWidth: 0,
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: isMobile ? 6 : 8, minWidth: 0 }}>
            <span
              style={{
                fontSize: isMobile ? 10.5 : 12,
                fontWeight: 800,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                flex: 1,
                minWidth: 0,
                lineHeight: 1.2,
              }}
              title="Total Page Views"
            >
              Total Page Views
            </span>
            <div
              style={{
                width: isMobile ? 24 : 28,
                height: isMobile ? 24 : 28,
                borderRadius: 7,
                background: "#ecfdf5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Eye size={isMobile ? 13 : 15} color="#059669" />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: isMobile ? 5 : 8, flexWrap: "wrap" }}>
            {loading ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, height: isMobile ? 28 : 38 }}>
                <span className="skeleton" style={{ width: 44, maxWidth: "100%", height: isMobile ? 24 : 28, borderRadius: 6, display: "inline-block" }} />
              </div>
            ) : (
              <>
                <span style={{ fontSize: isMobile ? 22 : 32, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.5px", lineHeight: 1 }}>
                  {liveData.analytics?.totalTrackedViews?.toLocaleString() || 0}
                </span>
                <span style={{ fontSize: isMobile ? 10 : 11.5, fontWeight: 700, color: "#059669", whiteSpace: "nowrap" }}>
                  Recorded
                </span>
              </>
            )}
          </div>
          <div style={{ fontSize: isMobile ? 10 : 11.5, color: "#64748b", marginTop: isMobile ? 4 : 6, minWidth: 0, overflow: "hidden" }}>
            {loading ? (
              <span className="skeleton" style={{ width: "75%", maxWidth: "100%", height: 12, borderRadius: 4, display: "inline-block" }} />
            ) : (
              <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <span>Across {liveData.analytics?.allPages?.length || 0} routes</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. Total Time Spent */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: isMobile ? 14 : 18,
            padding: isMobile ? "12px 11px" : "16px 18px",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.02)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minWidth: 0,
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: isMobile ? 6 : 8, minWidth: 0 }}>
            <span
              style={{
                fontSize: isMobile ? 10.5 : 12,
                fontWeight: 800,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                flex: 1,
                minWidth: 0,
                lineHeight: 1.2,
              }}
              title="Total Time Spent"
            >
              Total Time Spent
            </span>
            <div
              style={{
                width: isMobile ? 24 : 28,
                height: isMobile ? 24 : 28,
                borderRadius: 7,
                background: "#fdf4ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Clock size={isMobile ? 13 : 15} color="#c026d3" />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: isMobile ? 5 : 8, flexWrap: "wrap" }}>
            {loading ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, height: isMobile ? 28 : 38 }}>
                <span className="skeleton" style={{ width: 50, maxWidth: "100%", height: isMobile ? 24 : 28, borderRadius: 6, display: "inline-block" }} />
              </div>
            ) : (
              <>
                <span style={{ fontSize: isMobile ? 20 : 28, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.5px", lineHeight: 1 }}>
                  {formatDuration(liveData.analytics?.totalTimeSpentAllStudents || 0)}
                </span>
                <span style={{ fontSize: isMobile ? 10 : 11.5, fontWeight: 700, color: "#c026d3", whiteSpace: "nowrap" }}>
                  Cumulative
                </span>
              </>
            )}
          </div>
          <div style={{ fontSize: isMobile ? 10 : 11.5, color: "#64748b", marginTop: isMobile ? 4 : 6, minWidth: 0, overflow: "hidden" }}>
            {loading ? (
              <span className="skeleton" style={{ width: "75%", maxWidth: "100%", height: 12, borderRadius: 4, display: "inline-block" }} />
            ) : (
              <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <span>Student learning time</span>
              </div>
            )}
          </div>
        </div>

        {/* 4. Most Popular Page */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: isMobile ? 14 : 18,
            padding: isMobile ? "12px 11px" : "16px 18px",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.02)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minWidth: 0,
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: isMobile ? 6 : 8, minWidth: 0 }}>
            <span
              style={{
                fontSize: isMobile ? 10.5 : 12,
                fontWeight: 800,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                flex: 1,
                minWidth: 0,
                lineHeight: 1.2,
              }}
              title="Most Popular Page"
            >
              Most Popular Page
            </span>
            <div
              style={{
                width: isMobile ? 24 : 28,
                height: isMobile ? 24 : 28,
                borderRadius: 7,
                background: "#fff7ed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Flame size={isMobile ? 13 : 15} color="#ea580c" />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: isMobile ? 5 : 8, flexWrap: "wrap" }}>
            {loading ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, height: isMobile ? 28 : 38 }}>
                <span className="skeleton" style={{ width: 56, maxWidth: "100%", height: isMobile ? 24 : 28, borderRadius: 6, display: "inline-block" }} />
              </div>
            ) : (
              <>
                <span style={{ fontSize: isMobile ? 15 : 18, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.3px", lineHeight: 1.2, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {liveData.analytics?.mostVisited?.[0]?.pageTitle || "Student Dashboard"}
                </span>
              </>
            )}
          </div>
          <div style={{ fontSize: isMobile ? 10 : 11.5, color: "#64748b", marginTop: isMobile ? 4 : 6, minWidth: 0, overflow: "hidden" }}>
            {loading ? (
              <span className="skeleton" style={{ width: "75%", maxWidth: "100%", height: 12, borderRadius: 4, display: "inline-block" }} />
            ) : (
              <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <span>{liveData.analytics?.mostVisited?.[0]?.totalViews || 0} Total Page Views</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Student Activity & Route Intelligence Table ── */}
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
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  padding: "6px 14px",
                  borderRadius: 9,
                  color: "#1e40af",
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                <Users size={15} color="#2563eb" />
                <span>Tracked Students ({filteredActiveStudents.length})</span>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: "6px 0 0 0" }}>
              Showing real students with device details, visited routes, time spent, and top pages. Strictly excludes Admin and 230301120327.
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

        {/* Loading Skeleton State */}
        {loading ? (
          isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="skeleton" style={{ width: 130, height: 16, borderRadius: 4, display: "inline-block" }} />
                    <span className="skeleton" style={{ width: 70, height: 20, borderRadius: 6, display: "inline-block" }} />
                  </div>
                  <span className="skeleton" style={{ width: "100%", height: 32, borderRadius: 8, display: "inline-block" }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="skeleton" style={{ width: 90, height: 14, borderRadius: 4, display: "inline-block" }} />
                    <span className="skeleton" style={{ width: 50, height: 14, borderRadius: 4, display: "inline-block" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1.5px solid #e2e8f0", color: "#64748b", fontSize: 11.5, textTransform: "uppercase" }}>
                    <th style={{ padding: "10px 12px" }}>Student</th>
                    <th style={{ padding: "10px 12px" }}>Device & OS</th>
                    <th style={{ padding: "10px 12px" }}>Current / Last Route</th>
                    <th style={{ padding: "10px 12px" }}>Time Spent</th>
                    <th style={{ padding: "10px 12px" }}>Most Visited</th>
                    <th style={{ padding: "10px 12px" }}>Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4].map((n) => (
                    <tr key={n} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span className="skeleton" style={{ width: 32, height: 32, borderRadius: "50%", display: "inline-block" }} />
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <span className="skeleton" style={{ width: 120, height: 14, borderRadius: 4, display: "inline-block" }} />
                            <span className="skeleton" style={{ width: 80, height: 12, borderRadius: 4, display: "inline-block" }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span className="skeleton" style={{ width: 90, height: 14, borderRadius: 4, display: "inline-block" }} />
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span className="skeleton" style={{ width: 140, height: 26, borderRadius: 8, display: "inline-block" }} />
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span className="skeleton" style={{ width: 110, height: 14, borderRadius: 4, display: "inline-block" }} />
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span className="skeleton" style={{ width: 80, height: 14, borderRadius: 4, display: "inline-block" }} />
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span className="skeleton" style={{ width: 60, height: 22, borderRadius: 12, display: "inline-block" }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : filteredActiveStudents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f1f5f9", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <Users size={20} color="#94a3b8" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>
              No Student Activity Logged Yet
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
              {searchTerm || filterDevice !== "ALL"
                ? "No students match your active search filters. Try clearing the search."
                : "When students browse GradeFlow, their device, visited routes, and time spent will appear here."}
            </div>
          </div>
        ) : isMobile ? (
          /* Mobile Card View (Zero Horizontal Scroll) with Rich Activity Details */
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {paginatedStudents.map((st) => (
              <div
                key={st.token || st.regNo}
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
                      <div style={{ fontSize: 11.5, color: "#64748b" }}>Student</div>
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

                {/* Visited Route & Time Spent */}
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: "8px 10px",
                    fontSize: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#64748b", fontWeight: 600 }}>Active Route:</span>
                    <span
                      style={{
                        color: "#0f172a",
                        fontWeight: 700,
                        fontFamily: "monospace",
                        maxWidth: "65%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={st.currentRoute}
                    >
                      {st.currentRoute}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5 }}>
                    <span style={{ color: "#64748b" }}>Time Spent:</span>
                    <span style={{ color: "#059669", fontWeight: 700 }}>
                      {formatDuration(st.timeSpentCurrentRoute || 0)}{" "}
                      <span style={{ color: "#64748b", fontWeight: 500 }}>
                        (Total: {formatDuration(st.totalTimeSpentSeconds || 0)})
                      </span>
                    </span>
                  </div>

                  {st.mostVisitedRoute && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5 }}>
                      <span style={{ color: "#64748b" }}>Most Visited:</span>
                      <span style={{ color: "#c026d3", fontWeight: 700 }}>
                        {st.mostVisitedPageTitle || st.mostVisitedRoute}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#64748b", gap: 6 }}>
                  <span style={{ maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {st.browser} on {st.os}
                  </span>
                  <span style={{ color: "#64748b", fontWeight: 600 }}>
                    {st.lastActiveAt ? new Date(st.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop Table View with Rich Activity Columns */
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid #e2e8f0", color: "#64748b", fontSize: 11.5, textTransform: "uppercase" }}>
                  <th style={{ padding: "10px 12px" }}>Student</th>
                  <th style={{ padding: "10px 12px" }}>Device & Browser</th>
                  <th style={{ padding: "10px 12px" }}>Current / Last Route</th>
                  <th style={{ padding: "10px 12px" }}>Time Spent</th>
                  <th style={{ padding: "10px 12px" }}>Most Visited Route</th>
                  <th style={{ padding: "10px 12px" }}>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((st) => (
                  <tr key={st.token || st.regNo} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: "50%",
                            background: "#eff6ff",
                            color: "#2563eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: 12,
                          }}
                        >
                          {st.studentName ? st.studentName.slice(0, 2).toUpperCase() : "ST"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: "#0f172a" }}>{st.studentName}</div>
                          {st.regNo && (
                            <div style={{ fontSize: 11.5, color: "#2563eb", fontWeight: 700 }}>
                              {st.regNo} · <span style={{ color: "#64748b", fontWeight: 500 }}>{st.branch} ({st.batch})</span>
                            </div>
                          )}
                        </div>
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
                      <div style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ color: "#0f172a", fontWeight: 700, fontSize: 12.5 }}>
                          {st.pageTitle || "Dashboard"}
                        </span>
                        <span style={{ color: "#2563eb", fontWeight: 600, fontFamily: "monospace", fontSize: 11 }}>
                          {st.currentRoute}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ color: "#059669", fontWeight: 800, fontSize: 13 }}>
                          {formatDuration(st.timeSpentCurrentRoute || 0)}
                        </span>
                        <span style={{ fontSize: 11, color: "#64748b" }}>
                          Total: {formatDuration(st.totalTimeSpentSeconds || 0)}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          background: "#faf5ff",
                          border: "1px solid #f3e8ff",
                          color: "#7e22ce",
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: "3px 9px",
                          borderRadius: 6,
                        }}
                      >
                        <Flame size={12} color="#a855f7" />
                        {st.mostVisitedPageTitle || st.mostVisitedRoute || "/"}
                      </span>
                    </td>

                    <td style={{ padding: "12px", color: "#64748b", fontSize: 12 }}>
                      {st.lastActiveAt ? new Date(st.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "Recently"}
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
              <Route size={18} color="#2563eb" /> Page Route Traffic Analytics
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
