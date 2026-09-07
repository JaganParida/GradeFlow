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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  TrendingUp,
  BarChart2,
  Compass,
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
  const [expandedStudent, setExpandedStudent] = useState(null);

  const toggleExpandStudent = (regNo) => {
    setExpandedStudent((prev) => (prev === regNo ? null : regNo));
  };

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUserType, setFilterUserType] = useState("ALL"); // ALL | STUDENTS | GUESTS
  const [filterDevice, setFilterDevice] = useState("ALL"); // ALL | Mobile | Laptop | Desktop | Tablet
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterUserType, filterDevice]);

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

  // Helper: Format last active date into human-friendly time (e.g. "Just now", "4m ago", "Today, 8:15 PM")
  const formatLastActive = (dateStr) => {
    if (!dateStr) return "Recently";
    const d = new Date(dateStr);
    const now = new Date();
    const diffSecs = Math.floor((now - d) / 1000);

    if (diffSecs < 60) return "Just now";
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) {
      const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return `Today, ${timeStr}`;
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

      // 4. Search term (RegNo, Name, Route, Most Visited Route, Most Time-Spent, Peak Slot, Branch)
      if (query) {
        const nameMatch = (st.studentName || "").toLowerCase().includes(query);
        const regMatch = (st.regNo || "").toLowerCase().includes(query);
        const routeMatch = (st.currentRoute || "").toLowerCase().includes(query);
        const titleMatch = (st.pageTitle || st.lastActivePageTitle || "").toLowerCase().includes(query);
        const mostMatch = (st.mostVisitedPageTitle || st.mostVisitedRoute || "").toLowerCase().includes(query);
        const timeSpentMatch = (st.mostTimeSpentPageTitle || st.mostTimeSpentRoute || "").toLowerCase().includes(query);
        const peakMatch = (st.mostActiveTimeSlot || "").toLowerCase().includes(query);
        const branchMatch = (st.branch || "").toLowerCase().includes(query);
        if (!nameMatch && !regMatch && !routeMatch && !titleMatch && !mostMatch && !timeSpentMatch && !peakMatch && !branchMatch) return false;
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
        ) : (
          /* Route Intelligence Details Renderer & Table/Cards */
          (() => {
            const renderRouteIntelligenceDetails = (st) => {
              const totalSiteSecs = st.totalTimeSpentSeconds || 0;
              const routesList = [...(st.visitedRoutes || [])].sort(
                (a, b) => (b.durationSeconds || 0) - (a.durationSeconds || 0) || (b.visitCount || 0) - (a.visitCount || 0)
              );

              return (
                <div
                  style={{
                    background: "#ffffff",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: 14,
                    padding: isMobile ? "12px 10px" : "16px 18px",
                    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    marginTop: 6,
                  }}
                >
                  {/* Header Ribbon */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 8,
                      borderBottom: "1px solid #f1f5f9",
                      paddingBottom: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: "#eff6ff",
                          color: "#2563eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Route size={16} />
                      </div>
                      <div>
                        <span style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>
                          Deep Route & Page Intelligence for {st.studentName}
                        </span>
                        <span style={{ fontSize: 11.5, color: "#2563eb", fontWeight: 700, marginLeft: 8 }}>
                          ({st.regNo})
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                      <span style={{ color: "#64748b" }}>Overall Time on Site:</span>
                      <span
                        style={{
                          fontWeight: 900,
                          color: "#059669",
                          background: "#ecfdf5",
                          border: "1px solid #a7f3d0",
                          padding: "2px 8px",
                          borderRadius: 6,
                        }}
                      >
                        {formatDuration(totalSiteSecs)}
                      </span>
                    </div>
                  </div>

                  {/* 4 Quick Habit KPI Cards */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: 10,
                    }}
                  >
                    <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10.5, fontWeight: 750, color: "#0284c7", display: "flex", alignItems: "center", gap: 5 }}>
                        <Clock size={12} /> MOST ACTIVE TIME (WEBSITE)
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#0369a1", marginTop: 4 }}>
                        {st.mostActiveTimeSlot || "General"}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Peak engagement slot</div>
                    </div>

                    <div style={{ background: "#fdf4ff", border: "1px solid #f5d0fe", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10.5, fontWeight: 750, color: "#a21caf", display: "flex", alignItems: "center", gap: 5 }}>
                        <Calendar size={12} /> MOST ACTIVE DAY (WEBSITE)
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#86198f", marginTop: 4 }}>
                        {st.mostActiveDay || "Weekdays"}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Peak day of week</div>
                    </div>

                    <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10.5, fontWeight: 750, color: "#047857", display: "flex", alignItems: "center", gap: 5 }}>
                        <TrendingUp size={12} /> VISITS PER DAY & WEEK
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: "#065f46", marginTop: 4 }}>
                        {st.visitsToday || 1} today · {st.visitsThisWeek || st.totalPageViews || 1} this week
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Platform visit velocity</div>
                    </div>

                    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10.5, fontWeight: 750, color: "#b45309", display: "flex", alignItems: "center", gap: 5 }}>
                        <Compass size={12} /> EXPLORED ROUTES
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#92400e", marginTop: 4 }}>
                        {routesList.length} Unique Pages
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Tracked user navigation</div>
                    </div>
                  </div>

                  {/* Route-Wise Detailed Table */}
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                    <div
                      style={{
                        background: "#f8fafc",
                        padding: "9px 12px",
                        borderBottom: "1px solid #e2e8f0",
                        fontSize: 12,
                        fontWeight: 800,
                        color: "#334155",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 6,
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <BarChart2 size={13} color="#2563eb" /> ROUTE-BY-ROUTE DETAILED USAGE BREAKDOWN
                      </span>
                      <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>
                        Ranked by total time spent & visits
                      </span>
                    </div>

                    {routesList.length === 0 ? (
                      <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: 12.5 }}>
                        No individual route visit history recorded for this student yet.
                      </div>
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                          <thead>
                            <tr
                              style={{
                                background: "#ffffff",
                                borderBottom: "1px solid #e2e8f0",
                                color: "#64748b",
                                fontSize: 10.5,
                                textTransform: "uppercase",
                              }}
                            >
                              <th style={{ padding: "8px 12px" }}>Route / Page Name</th>
                              <th style={{ padding: "8px 12px" }}>Total Visits</th>
                              <th style={{ padding: "8px 12px" }}>Visits / Week</th>
                              <th style={{ padding: "8px 12px" }}>Time Spent On Route</th>
                              <th style={{ padding: "8px 12px" }}>Last Active On Route</th>
                              <th style={{ padding: "8px 12px" }}>Peak Active Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {routesList.map((vr, rIdx) => {
                              const sharePercent =
                                totalSiteSecs > 0
                                  ? Math.min(100, Math.round(((vr.durationSeconds || 0) / totalSiteSecs) * 100))
                                  : 0;

                              return (
                                <tr
                                  key={vr.route || rIdx}
                                  style={{
                                    borderBottom: "1px solid #f1f5f9",
                                    background: rIdx % 2 === 0 ? "#ffffff" : "#fcfcfd",
                                  }}
                                >
                                  <td style={{ padding: "10px 12px" }}>
                                    <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 12 }}>
                                      {vr.pageTitle || vr.route}
                                    </div>
                                    <span style={{ fontFamily: "monospace", fontSize: 10.5, color: "#2563eb" }}>
                                      {vr.route}
                                    </span>
                                  </td>

                                  <td style={{ padding: "10px 12px" }}>
                                    <span style={{ fontWeight: 800, color: "#0f172a", fontSize: 12.5 }}>
                                      {vr.visitCount || 1}
                                    </span>
                                    <span style={{ fontSize: 10.5, color: "#64748b", marginLeft: 3 }}>visits</span>
                                  </td>

                                  <td style={{ padding: "10px 12px" }}>
                                    <span
                                      style={{
                                        background: "#eff6ff",
                                        color: "#2563eb",
                                        border: "1px solid #dbeafe",
                                        padding: "2px 7px",
                                        borderRadius: 6,
                                        fontWeight: 700,
                                        fontSize: 11,
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {vr.weeklyVisitCount || Math.min(vr.visitCount || 1, st.visitsThisWeek || 1)} / wk
                                    </span>
                                  </td>

                                  <td style={{ padding: "10px 12px" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                      <span style={{ fontWeight: 800, color: "#059669", fontSize: 12 }}>
                                        {formatDuration(vr.durationSeconds || 0)}
                                      </span>
                                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <div
                                          style={{
                                            width: 65,
                                            height: 5,
                                            borderRadius: 3,
                                            background: "#e2e8f0",
                                            overflow: "hidden",
                                          }}
                                        >
                                          <div
                                            style={{
                                              width: `${sharePercent}%`,
                                              height: "100%",
                                              background: "#10b981",
                                              borderRadius: 3,
                                            }}
                                          />
                                        </div>
                                        <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>
                                          {sharePercent}%
                                        </span>
                                      </div>
                                    </div>
                                  </td>

                                  <td style={{ padding: "10px 12px" }}>
                                    <div style={{ color: "#334155", fontWeight: 600, fontSize: 11.5 }}>
                                      {formatLastActive(vr.lastVisitedAt || st.lastActiveAt)}
                                    </div>
                                    <div style={{ color: "#94a3b8", fontSize: 10 }}>
                                      {vr.lastVisitedAt
                                        ? new Date(vr.lastVisitedAt).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })
                                        : "Recently"}
                                    </div>
                                  </td>

                                  <td style={{ padding: "10px 12px" }}>
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 4,
                                        background: "#f0fdf4",
                                        border: "1px solid #bbf7d0",
                                        color: "#15803d",
                                        fontSize: 11,
                                        fontWeight: 700,
                                        padding: "2px 7px",
                                        borderRadius: 6,
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      <Clock size={11} color="#16a34a" />
                                      {vr.mostActiveTimeSlot || st.mostActiveTimeSlot || "General"}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            };

            return isMobile ? (
              /* Mobile Card View (Zero Horizontal Scroll) with Rich Activity Details */
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {paginatedStudents.map((st) => {
                  const studentKey = st.token || st.regNo;
                  const isExpanded = expandedStudent === studentKey;

                  return (
                    <div
                      key={studentKey}
                      style={{
                        background: isExpanded ? "#f8fafc" : "#ffffff",
                        border: isExpanded ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                        borderRadius: 12,
                        padding: "12px 14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        transition: "all 0.15s ease",
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

                      {/* Visited Route & Time Spent Analytics */}
                      <div
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: 10,
                          padding: "10px 12px",
                          fontSize: 12,
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        {/* 1. Last Active Page & Time */}
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
                            <span style={{ color: "#64748b", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>
                              Last Active Page:
                            </span>
                            <span style={{ color: "#2563eb", fontWeight: 700, fontSize: 11 }}>
                              {formatLastActive(st.lastActiveAt)}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                            <span style={{ color: "#0f172a", fontWeight: 800, fontSize: 12.5 }}>
                              {st.lastActivePageTitle || st.pageTitle || "Dashboard"}
                            </span>
                            <span style={{ color: "#64748b", fontFamily: "monospace", fontSize: 10.5 }}>
                              ({st.lastActiveRoute || st.currentRoute})
                            </span>
                          </div>
                        </div>

                        {/* 2. Most Active Time Slot (Peak Hours) */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4, borderTop: "1px dashed #f1f5f9" }}>
                          <span style={{ color: "#64748b", fontWeight: 600, fontSize: 11.5 }}>Most Active Time:</span>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              background: "#f0f9ff",
                              border: "1px solid #bae6fd",
                              color: "#0369a1",
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: 6,
                            }}
                          >
                            <Clock size={11} color="#0284c7" />
                            {st.mostActiveTimeSlot || "General"}
                          </span>
                        </div>

                        {/* 3. Most Time-Spent Page */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5 }}>
                          <span style={{ color: "#64748b", fontWeight: 600 }}>Most Time-Spent:</span>
                          <span style={{ color: "#059669", fontWeight: 800 }}>
                            {st.mostTimeSpentPageTitle || st.mostVisitedPageTitle || "Dashboard"}{" "}
                            <span style={{ color: "#047857", fontWeight: 700 }}>
                              ({formatDuration(st.mostTimeSpentSeconds || st.totalTimeSpentSeconds || 0)})
                            </span>
                          </span>
                        </div>

                        {/* 4. Top Visited Page */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5 }}>
                          <span style={{ color: "#64748b", fontWeight: 600 }}>Top Visited Page:</span>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              color: "#7e22ce",
                              fontWeight: 700,
                            }}
                          >
                            <Flame size={11} color="#a855f7" />
                            {st.mostVisitedPageTitle || st.mostVisitedRoute || "/"} ({st.mostVisitedCount || 1}v)
                          </span>
                        </div>

                        {/* 5. Frequency Breakdown (Per Day & Per Week) */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#475569", paddingTop: 4, borderTop: "1px dashed #f1f5f9" }}>
                          <span>Platform Visits:</span>
                          <span style={{ fontWeight: 800, color: "#0f172a" }}>
                            {st.visitsToday || 1} today · {st.visitsThisWeek || st.totalPageViews || 1} / wk ({st.mostActiveDay || "Weekdays"})
                          </span>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#64748b" }}>
                          <span>Total Time on Site:</span>
                          <span style={{ fontWeight: 800, color: "#0f172a" }}>
                            {formatDuration(st.totalTimeSpentSeconds || 0)}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#64748b", gap: 6 }}>
                        <span style={{ maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {st.browser} on {st.os}
                        </span>
                        <span style={{ color: "#64748b", fontWeight: 600 }}>
                          {st.lastActiveAt ? new Date(st.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
                        </span>
                      </div>

                      {/* Mobile Expand / Collapse Button */}
                      <button
                        type="button"
                        onClick={() => toggleExpandStudent(studentKey)}
                        style={{
                          marginTop: 4,
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: isExpanded ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                          background: isExpanded ? "#eff6ff" : "#ffffff",
                          color: isExpanded ? "#2563eb" : "#1e293b",
                          fontSize: 12,
                          fontWeight: 750,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <Route size={14} color={isExpanded ? "#2563eb" : "#64748b"} />
                        {isExpanded ? "Hide Route Details" : "View Route Intelligence Details"}
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {/* Mobile Expanded Route Details */}
                      {isExpanded && (
                        <div style={{ marginTop: 6 }}>
                          {renderRouteIntelligenceDetails(st)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Desktop Table View with Rich Activity Columns & Expandable Sub-Rows */
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1.5px solid #e2e8f0", color: "#64748b", fontSize: 11.5, textTransform: "uppercase" }}>
                      <th style={{ padding: "10px 12px" }}>Student</th>
                      <th style={{ padding: "10px 12px" }}>Device & System</th>
                      <th style={{ padding: "10px 12px" }}>Last Active Page & Time</th>
                      <th style={{ padding: "10px 12px" }}>Most Active Time</th>
                      <th style={{ padding: "10px 12px" }}>Most Time-Spent</th>
                      <th style={{ padding: "10px 12px" }}>Top Visited</th>
                      <th style={{ padding: "10px 12px" }}>Visits Frequency</th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>Route Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStudents.map((st) => {
                      const studentKey = st.token || st.regNo;
                      const isExpanded = expandedStudent === studentKey;

                      return (
                        <React.Fragment key={studentKey}>
                          <tr style={{ borderBottom: isExpanded ? "none" : "1px solid #f1f5f9", background: isExpanded ? "#f8fafc" : "transparent" }}>
                            {/* 1. Student */}
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

                            {/* 2. Device & System */}
                            <td style={{ padding: "12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                {renderDeviceIcon(st.deviceType)}
                                <span style={{ fontSize: 12, color: "#334155", fontWeight: 600 }}>
                                  {st.deviceType} · {st.browser}
                                </span>
                              </div>
                              <div style={{ fontSize: 11, color: "#94a3b8" }}>{st.os}</div>
                            </td>

                            {/* 3. Last Active Page & Time */}
                            <td style={{ padding: "12px" }}>
                              <div style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
                                <span style={{ color: "#0f172a", fontWeight: 700, fontSize: 12.5 }}>
                                  {st.lastActivePageTitle || st.pageTitle || "Dashboard"}
                                </span>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ color: "#2563eb", fontWeight: 600, fontFamily: "monospace", fontSize: 11 }}>
                                    {st.lastActiveRoute || st.currentRoute}
                                  </span>
                                  <span style={{ fontSize: 10.5, color: "#64748b", fontWeight: 600 }}>
                                    • {formatLastActive(st.lastActiveAt)}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* 4. Most Active Time (Peak Time Slot) */}
                            <td style={{ padding: "12px" }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 5,
                                  background: "#f0f9ff",
                                  border: "1px solid #bae6fd",
                                  color: "#0369a1",
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  padding: "3px 9px",
                                  borderRadius: 6,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <Clock size={12} color="#0284c7" />
                                {st.mostActiveTimeSlot || "General"}
                              </span>
                            </td>

                            {/* 5. Most Time-Spent Page */}
                            <td style={{ padding: "12px" }}>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ color: "#059669", fontWeight: 800, fontSize: 12.5 }}>
                                  {st.mostTimeSpentPageTitle || st.mostVisitedPageTitle || "Dashboard"}
                                </span>
                                <span style={{ fontSize: 11, color: "#047857", fontWeight: 700 }}>
                                  Spent: {formatDuration(st.mostTimeSpentSeconds || st.totalTimeSpentSeconds || 0)}
                                </span>
                              </div>
                            </td>

                            {/* 6. Top Visited Page */}
                            <td style={{ padding: "12px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
                                    padding: "3px 8px",
                                    borderRadius: 6,
                                    width: "fit-content",
                                  }}
                                >
                                  <Flame size={12} color="#a855f7" />
                                  {st.mostVisitedPageTitle || st.mostVisitedRoute || "/"} ({st.mostVisitedCount || 1}v)
                                </span>
                                <span style={{ fontSize: 11, color: "#64748b" }}>
                                  Total: <strong style={{ color: "#0f172a" }}>{formatDuration(st.totalTimeSpentSeconds || 0)}</strong>
                                </span>
                              </div>
                            </td>

                            {/* 7. Visits Frequency (Per Day & Per Week) */}
                            <td style={{ padding: "12px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <span style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>
                                  {st.visitsToday || 1} today · {st.visitsThisWeek || st.totalPageViews || 1} / wk
                                </span>
                                <span style={{ fontSize: 10.5, color: "#64748b", fontWeight: 600 }}>
                                  Peak: {st.mostActiveDay || "Weekdays"}
                                </span>
                              </div>
                            </td>

                            {/* 8. Action: Expand Route Intelligence */}
                            <td style={{ padding: "12px", textAlign: "right" }}>
                              <button
                                type="button"
                                onClick={() => toggleExpandStudent(studentKey)}
                                style={{
                                  padding: "6px 11px",
                                  borderRadius: 8,
                                  border: isExpanded ? "1.5px solid #2563eb" : "1.5px solid #cbd5e1",
                                  background: isExpanded ? "#eff6ff" : "#ffffff",
                                  color: isExpanded ? "#2563eb" : "#334155",
                                  fontSize: 12,
                                  fontWeight: 750,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 5,
                                  transition: "all 0.15s ease",
                                  boxShadow: isExpanded ? "0 2px 6px rgba(37,99,235,0.12)" : "none",
                                }}
                              >
                                <Route size={13} color={isExpanded ? "#2563eb" : "#64748b"} />
                                {isExpanded ? "Hide Details" : "Route Details"}
                                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Deep Route Intelligence Drawer */}
                          {isExpanded && (
                            <tr key={`${studentKey}-expanded-drawer`} style={{ background: "#f8fafc" }}>
                              <td colSpan={8} style={{ padding: "0 14px 16px 14px" }}>
                                {renderRouteIntelligenceDetails(st)}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()
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
              students (Tracked Route Activity)
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
