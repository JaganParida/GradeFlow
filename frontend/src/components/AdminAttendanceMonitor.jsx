import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Clock,
  BookOpen,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Activity,
  Sliders,
  Eye,
  Check,
  Percent,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Target,
} from "lucide-react";

export default function AdminAttendanceMonitor({ API = "/api", authHeaders = {}, isMobile = false }) {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({
    totalTracked: 0,
    activeCount: 0,
    resetCount: 0,
    safeCount: 0,
    criticalCount: 0,
    avgActivePercentage: 0,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 10,
    startIndex: 0,
    endIndex: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // "all" | "active" | "reset" | "critical" | "safe"
  const [branch, setBranch] = useState("ALL");
  const [section, setSection] = useState("ALL");
  const [sortBy, setSortBy] = useState("last-synced"); // "last-synced" | "attendance-high" | "attendance-low" | "regno" | "name"
  const [page, setPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Fetch Attendance Monitor data
  const fetchAttendanceData = async (
    targetPage = page,
    targetFilter = filter,
    targetSearch = search,
    targetBranch = branch,
    targetSection = section,
    targetSortBy = sortBy
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: targetPage,
        limit: 10,
        filter: targetFilter,
        search: targetSearch.trim(),
        branch: targetBranch,
        section: targetSection,
        sortBy: targetSortBy,
      });

      const res = await axios.get(`${API}/admin/attendance-tracker/monitor?${params.toString()}`, {
        ...authHeaders,
        withCredentials: true,
      });
      if (res.data?.success) {
        setStudents(res.data.students || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch attendance monitor data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData(page, filter, search, branch, section, sortBy);
  }, [page, filter, branch, section, sortBy]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    fetchAttendanceData(1, filter, search, branch, section, sortBy);
  };

  const handleClearSearch = () => {
    setSearch("");
    setPage(1);
    fetchAttendanceData(1, filter, "", branch, section, sortBy);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  const handleBranchChange = (newBranch) => {
    setBranch(newBranch);
    setPage(1);
  };

  const handleSectionChange = (newSection) => {
    setSection(newSection);
    setPage(1);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setPage(1);
  };

  // Format date helper
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "N/A";
      const now = new Date();
      const diffMs = now - d;
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) return `${diffDays}d ago`;
      if (diffHours > 0) return `${diffHours}h ago`;
      if (diffMins > 0) return `${diffMins}m ago`;
      return "Just now";
    } catch {
      return "N/A";
    }
  };

  const formatIST = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "N/A";
      return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }).format(d);
    } catch {
      return "N/A";
    }
  };

  // Progress bar color based on percentage
  const getPercentageColor = (pct, isReset) => {
    if (isReset || pct === 0) return { bg: "#f1f5f9", text: "#64748b", bar: "#94a3b8", border: "#cbd5e1" };
    if (pct >= 85) return { bg: "#ecfdf5", text: "#065f46", bar: "#10b981", border: "#a7f3d0" };
    if (pct >= 75) return { bg: "#eff6ff", text: "#1e40af", bar: "#3b82f6", border: "#bfdbfe" };
    if (pct >= 65) return { bg: "#fffbeb", text: "#92400e", bar: "#f59e0b", border: "#fde68a" };
    return { bg: "#fef2f2", text: "#991b1b", bar: "#ef4444", border: "#fecaca" };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ display: "flex", flexDirection: "column", gap: 18, width: "100%", boxSizing: "border-box" }}
    >
      {/* ── 1. Top Section Header ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: 18,
          padding: isMobile ? "16px 14px" : "20px 22px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#eff6ff",
              border: "1.5px solid #bfdbfe",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h2 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.3px" }}>
                Attendance Tracker Usage Monitor
              </h2>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  background: "#eff6ff",
                  color: "#2563eb",
                  border: "1px solid #dbeafe",
                  padding: "2px 8px",
                  borderRadius: 99,
                }}
              >
                Live Sync Directory
              </span>
            </div>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: "3px 0 0 0" }}>
              Real-time administrative visibility into student attendance tracker usage, overall percentage, and active/reset statuses.
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchAttendanceData(page, filter, search, branch, section)}
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 16px",
            borderRadius: 10,
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            color: "#334155",
            fontSize: 13,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
        >
          <RefreshCw size={14} className={loading ? "gf-spin" : ""} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* ── 2. Summary KPI Metric Cards (5 Cards Grid) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {/* Total Tracked */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 14,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Total Tracked</span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569" }}>
              <Users size={15} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a" }}>{summary.totalTracked}</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>Synced student accounts</div>
        </div>

        {/* Active Users (> 0%) */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 14,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#065f46", textTransform: "uppercase" }}>Active Users (&gt;0%)</span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}>
              <CheckCircle2 size={15} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#047857" }}>{summary.activeCount}</div>
          <div style={{ fontSize: 11, color: "#059669" }}>
            {summary.totalTracked > 0 ? `${Math.round((summary.activeCount / summary.totalTracked) * 100)}% active tracking` : "0%"}
          </div>
        </div>

        {/* Average Active Attendance */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 14,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#1e40af", textTransform: "uppercase" }}>Avg Attendance</span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
              <Percent size={15} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#1d4ed8" }}>{summary.avgActivePercentage}%</div>
          <div style={{ fontSize: 11, color: "#3b82f6" }}>Across active students</div>
        </div>

        {/* Reset / Cleared */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 14,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#92400e", textTransform: "uppercase" }}>Reset / Cleared</span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706" }}>
              <RotateCcw size={15} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#b45309" }}>{summary.resetCount}</div>
          <div style={{ fontSize: 11, color: "#d97706" }}>Cleared routine to 0%</div>
        </div>

        {/* Attendance Shortage (< 75%) */}
        <div
          style={{
            gridColumn: isMobile ? "span 2" : "auto",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 14,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#991b1b", textTransform: "uppercase" }}>Shortage (&lt;75%)</span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
              <AlertTriangle size={15} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#b91c1c" }}>{summary.criticalCount}</div>
          <div style={{ fontSize: 11, color: "#dc2626" }}>Below 75% target goal</div>
        </div>
      </div>

      {/* ── 3. Filters & Search Toolbar ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: 16,
          padding: "14px 18px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          gap: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 8, flex: 1, minWidth: isMobile ? "100%" : 280 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Reg No, Name, or Section..."
              style={{
                width: "100%",
                height: 38,
                padding: search ? "0 32px 0 36px" : "0 12px 0 36px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                fontSize: 13,
                color: "#0f172a",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 2,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            type="submit"
            style={{
              height: 38,
              padding: "0 16px",
              borderRadius: 8,
              border: "none",
              background: "#0f172a",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Search
          </button>
        </form>

        {/* Dropdown Filters (Branch & Section) */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {/* Branch Filter */}
          <select
            value={branch}
            onChange={(e) => handleBranchChange(e.target.value)}
            style={{
              height: 38,
              padding: "0 10px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              fontSize: 12.5,
              fontWeight: 600,
              color: "#0f172a",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="ALL">All Branches</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="CIVIL">CIVIL</option>
            <option value="ME">ME</option>
            <option value="EEE">EEE</option>
            <option value="AERO">AERO</option>
            <option value="BIO">BIO</option>
            <option value="MI">MI</option>
          </select>

          {/* Section Filter */}
          <select
            value={section}
            onChange={(e) => handleSectionChange(e.target.value)}
            style={{
              height: 38,
              padding: "0 10px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              fontSize: 12.5,
              fontWeight: 600,
              color: "#0f172a",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="ALL">All Sections</option>
            {["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"].map((sec) => (
              <option key={sec} value={sec}>
                Section {sec}
              </option>
            ))}
          </select>

          {/* Sort By Filter */}
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            style={{
              height: 38,
              padding: "0 10px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              fontSize: 12.5,
              fontWeight: 600,
              color: "#0f172a",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="last-synced">Sort: Last Synced (Newest)</option>
            <option value="attendance-high">Sort: Attendance (High → Low)</option>
            <option value="attendance-low">Sort: Attendance (Low → High)</option>
            <option value="regno">Sort: Roll Number (Ascending)</option>
            <option value="name">Sort: Student Name (A → Z)</option>
          </select>
        </div>
      </div>

      {/* ── 4. Segmented Status Category Tabs ── */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
        {[
          { id: "all", label: "All Students", count: summary.totalTracked },
          { id: "active", label: "Active (> 0%)", count: summary.activeCount },
          { id: "reset", label: "Reset / Cleared", count: summary.resetCount },
          { id: "critical", label: "Shortage (< 75%)", count: summary.criticalCount },
          { id: "safe", label: "Safe (≥ 75%)", count: summary.safeCount },
        ].map((t) => {
          const isActive = filter === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleFilterChange(t.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 99,
                fontSize: 12.5,
                fontWeight: isActive ? 800 : 600,
                border: isActive ? "1px solid #2563eb" : "1px solid #cbd5e1",
                background: isActive ? "#2563eb" : "#ffffff",
                color: isActive ? "#ffffff" : "#475569",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
                boxShadow: isActive ? "0 2px 8px rgba(37,99,235,0.25)" : "none",
              }}
            >
              <span>{t.label}</span>
              <span
                style={{
                  fontSize: 11,
                  padding: "1px 6px",
                  borderRadius: 99,
                  background: isActive ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                  color: isActive ? "#ffffff" : "#64748b",
                  fontWeight: 700,
                }}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 5. Main Content: Table on Desktop, Cards on Mobile (No Endless Scroll) ── */}
      {loading ? (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 16,
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="skeleton" style={{ width: "100%", height: 54, borderRadius: 10 }} />
            ))}
        </div>
      ) : students.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid #cbd5e1",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
            <UserCheck size={24} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>
            No Attendance Tracker Records Found
          </h3>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0, maxWidth: 420 }}>
            No student attendance records matched the current filter or search criteria.
          </p>
          {(search || filter !== "all" || branch !== "ALL" || section !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setFilter("all");
                setBranch("ALL");
                setSection("ALL");
                setPage(1);
              }}
              style={{
                marginTop: 6,
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                fontSize: 12.5,
                fontWeight: 700,
                color: "#2563eb",
                cursor: "pointer",
              }}
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : isMobile ? (
        /* ── Mobile Card View (Zero Horizontal Scroll) ── */
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {students.map((st, index) => {
            const colors = getPercentageColor(st.overallPercentage, st.isReset);
            const displayRank = pagination.startIndex + index;

            return (
              <div
                key={st.regNo}
                style={{
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: 16,
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                {/* Card Header: Rank, Name, RegNo, and Status */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: "#f1f5f9",
                        color: "#475569",
                        fontSize: 12,
                        fontWeight: 900,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      #{displayRank}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {st.studentName}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#64748b", fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                        {st.regNo}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: "3px 8px",
                      borderRadius: 99,
                      background: st.isTrackerActive ? "#ecfdf5" : "#fffbeb",
                      color: st.isTrackerActive ? "#047857" : "#b45309",
                      border: st.isTrackerActive ? "1px solid #a7f3d0" : "1px solid #fde68a",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {st.isTrackerActive ? "Active Tracker" : "Reset / Cleared"}
                  </span>
                </div>

                {/* Overall Attendance Progress Bar */}
                <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 11.5, color: "#64748b", fontWeight: 700 }}>Overall Attendance</span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 900,
                        color: colors.text,
                        fontFamily: "'Space Mono', monospace",
                      }}
                    >
                      {st.overallPercentage}%
                    </span>
                  </div>
                  <div style={{ width: "100%", height: 7, borderRadius: 99, background: "#e2e8f0", overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, st.overallPercentage)}%`, height: "100%", background: colors.bar, borderRadius: 99 }} />
                  </div>
                </div>

                {/* Metadata 3-col Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, textAlign: "center" }}>
                  <div style={{ background: "#f8fafc", padding: "8px 6px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>CLASSES</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                      {st.totalAttended} / {st.totalDelivered}
                    </div>
                  </div>
                  <div style={{ background: "#f8fafc", padding: "8px 6px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>BRANCH/SEC</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                      {st.branch}-{st.section}
                    </div>
                  </div>
                  <div style={{ background: "#f8fafc", padding: "8px 6px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>SUBJECTS</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                      {st.totalSubjects}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>
                    Synced {formatTimeAgo(st.lastSyncedAt)}
                  </span>
                  <button
                    onClick={() => setSelectedStudent(st)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#2563eb",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <Eye size={13} />
                    <span>View Subjects</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Desktop Table View ── */
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                  <th style={{ padding: "12px 14px", fontWeight: 700, width: 45 }}>#</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>STUDENT INFO</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>BRANCH &amp; SEC</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, minWidth: 160 }}>OVERALL ATTENDANCE</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>CLASSES (ATT/DEL)</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>SUBJECTS</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>STATUS</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>LAST SYNCED</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700, textAlign: "right" }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {students.map((st, index) => {
                  const colors = getPercentageColor(st.overallPercentage, st.isReset);
                  const displayRank = pagination.startIndex + index;

                  return (
                    <tr
                      key={st.regNo}
                      style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s ease" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* # */}
                      <td style={{ padding: "13px 14px", color: "#64748b", fontWeight: 700 }}>
                        {displayRank}
                      </td>

                      {/* Student Info */}
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              background: "#f1f5f9",
                              border: "1px solid #e2e8f0",
                              color: "#1e293b",
                              fontWeight: 800,
                              fontSize: 12.5,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {(st.studentName || "S").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 13.5 }}>
                              {st.studentName}
                            </div>
                            <div style={{ fontSize: 11.5, color: "#64748b", fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                              {st.regNo}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Branch & Sec */}
                      <td style={{ padding: "13px 14px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <span style={{ padding: "2px 6px", borderRadius: 6, background: "#eff6ff", border: "1px solid #dbeafe", color: "#2563eb", fontWeight: 700, fontSize: 11.5 }}>
                            {st.branch}
                          </span>
                          <span style={{ padding: "2px 6px", borderRadius: 6, background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#475569", fontWeight: 700, fontSize: 11.5 }}>
                            {st.section}
                          </span>
                        </div>
                      </td>

                      {/* Overall Attendance */}
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 5, maxWidth: 150 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span
                              style={{
                                fontSize: 13.5,
                                fontWeight: 900,
                                color: colors.text,
                                fontFamily: "'Space Mono', monospace",
                              }}
                            >
                              {st.overallPercentage}%
                            </span>
                            <span style={{ fontSize: 10, color: "#94a3b8" }}>Goal: {st.targetGoal}%</span>
                          </div>
                          <div style={{ width: "100%", height: 6, borderRadius: 99, background: "#e2e8f0", overflow: "hidden" }}>
                            <div style={{ width: `${Math.min(100, st.overallPercentage)}%`, height: "100%", background: colors.bar, borderRadius: 99 }} />
                          </div>
                        </div>
                      </td>

                      {/* Classes Att/Del */}
                      <td style={{ padding: "13px 14px", fontWeight: 700, color: "#1e293b", fontFamily: "'Space Mono', monospace" }}>
                        {st.totalAttended} / {st.totalDelivered}
                      </td>

                      {/* Subjects */}
                      <td style={{ padding: "13px 14px", color: "#475569", fontWeight: 600 }}>
                        {st.totalSubjects} subjects
                      </td>

                      {/* Status */}
                      <td style={{ padding: "13px 14px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 11.5,
                            fontWeight: 750,
                            padding: "3px 9px",
                            borderRadius: 99,
                            background: st.isTrackerActive ? "#ecfdf5" : "#fffbeb",
                            color: st.isTrackerActive ? "#047857" : "#b45309",
                            border: st.isTrackerActive ? "1px solid #a7f3d0" : "1px solid #fde68a",
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.isTrackerActive ? "#10b981" : "#d97706" }} />
                          <span>{st.isTrackerActive ? "Active" : "Reset / Cleared"}</span>
                        </span>
                      </td>

                      {/* Last Synced */}
                      <td style={{ padding: "13px 14px", color: "#64748b", fontSize: 12 }} title={formatIST(st.lastSyncedAt)}>
                        {formatTimeAgo(st.lastSyncedAt)}
                      </td>

                      {/* Action */}
                      <td style={{ padding: "13px 14px", textAlign: "right" }}>
                        <button
                          onClick={() => setSelectedStudent(st)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            color: "#2563eb",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#eff6ff";
                            e.currentTarget.style.borderColor = "#93c5fd";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#ffffff";
                            e.currentTarget.style.borderColor = "#cbd5e1";
                          }}
                        >
                          <Eye size={13} />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 6. Pagination Bar (Default 10 per page, Zero Endless Scroll) ── */}
      {pagination.totalRecords > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "center" : "center",
            gap: 12,
            padding: "8px 4px",
          }}
        >
          <div style={{ fontSize: 12.5, color: "#64748b" }}>
            Showing <strong>{pagination.startIndex}</strong> to <strong>{pagination.endIndex}</strong> of{" "}
            <strong>{pagination.totalRecords}</strong> student records
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Previous Page Button */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrevPage}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "7px 12px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: pagination.hasPrevPage ? "#ffffff" : "#f1f5f9",
                color: pagination.hasPrevPage ? "#0f172a" : "#94a3b8",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: pagination.hasPrevPage ? "pointer" : "not-allowed",
              }}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            {/* Page Number Indicators */}
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.currentPage) <= 1)
              .map((p, idx, arr) => (
                <React.Fragment key={p}>
                  {idx > 0 && p - arr[idx - 1] > 1 && (
                    <span style={{ padding: "0 4px", color: "#94a3b8", fontSize: 12 }}>...</span>
                  )}
                  <button
                    onClick={() => setPage(p)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      border: p === pagination.currentPage ? "1px solid #2563eb" : "1px solid #cbd5e1",
                      background: p === pagination.currentPage ? "#2563eb" : "#ffffff",
                      color: p === pagination.currentPage ? "#ffffff" : "#334155",
                      fontSize: 12.5,
                      fontWeight: 750,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}

            {/* Next Page Button */}
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={!pagination.hasNextPage}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "7px 12px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: pagination.hasNextPage ? "#ffffff" : "#f1f5f9",
                color: pagination.hasNextPage ? "#0f172a" : "#94a3b8",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: pagination.hasNextPage ? "pointer" : "not-allowed",
              }}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── 7. Detailed Subject Breakdown Modal ── */}
      <AnimatePresence>
        {selectedStudent && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
              boxSizing: "border-box",
            }}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)}
              style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 680,
                maxHeight: "90vh",
                background: "#ffffff",
                borderRadius: 20,
                border: "1px solid #cbd5e1",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                zIndex: 1,
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: "18px 22px",
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#f8fafc",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "#eff6ff", border: "1.5px solid #bfdbfe", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>
                    {(selectedStudent.studentName || "S").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                      {selectedStudent.studentName}
                    </h3>
                    <div style={{ fontSize: 12, color: "#64748b", fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                      {selectedStudent.regNo} • {selectedStudent.branch}-{selectedStudent.section} (Batch {selectedStudent.batch})
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedStudent(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 6,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#0f172a")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: "20px 22px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Overall Attendance Metric Banner */}
                <div
                  style={{
                    background: selectedStudent.isReset ? "#fffbeb" : "#f8fafc",
                    border: selectedStudent.isReset ? "1px solid #fde68a" : "1px solid #e2e8f0",
                    borderRadius: 14,
                    padding: "14px 18px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      Overall Attendance Score
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: selectedStudent.overallPercentage >= 75 ? "#059669" : selectedStudent.isReset ? "#b45309" : "#dc2626", fontFamily: "'Space Mono', monospace", marginTop: 2 }}>
                      {selectedStudent.overallPercentage}%
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
                      {selectedStudent.totalAttended} attended out of {selectedStudent.totalDelivered} total classes
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: isMobile ? "flex-start" : "flex-end", gap: 4 }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 800,
                        background: selectedStudent.isTrackerActive ? "#ecfdf5" : "#fffbeb",
                        color: selectedStudent.isTrackerActive ? "#047857" : "#b45309",
                        border: selectedStudent.isTrackerActive ? "1px solid #a7f3d0" : "1px solid #fde68a",
                      }}
                    >
                      {selectedStudent.isTrackerActive ? "Active Tracking" : "Reset Routine"}
                    </span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>
                      Target: {selectedStudent.targetGoal}% • Synced: {formatTimeAgo(selectedStudent.lastSyncedAt)}
                    </span>
                  </div>
                </div>

                {/* Subject Breakdown List */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                      Tracked Subjects ({selectedStudent.subjectsBreakdown.length})
                    </span>
                    <span style={{ fontSize: 11.5, color: "#64748b" }}>
                      {selectedStudent.dailyLogsCount} check-in logs recorded
                    </span>
                  </div>

                  {selectedStudent.subjectsBreakdown.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "24px", color: "#94a3b8", fontSize: 13, border: "1px dashed #cbd5e1", borderRadius: 12 }}>
                      No individual subjects currently saved (student has reset their routine to defaults).
                    </div>
                  ) : (
                    selectedStudent.subjectsBreakdown.map((sub, sIdx) => {
                      const colors = getPercentageColor(sub.percentage, sub.delivered === 0);
                      return (
                        <div
                          key={sIdx}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: 12,
                            padding: "12px 14px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 750, color: "#0f172a" }}>
                                {sub.subjectName}
                              </div>
                              {sub.code && (
                                <div style={{ fontSize: 11, color: "#64748b", fontFamily: "'Space Mono', monospace" }}>
                                  {sub.code}
                                </div>
                              )}
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <span style={{ fontSize: 14, fontWeight: 900, color: colors.text, fontFamily: "'Space Mono', monospace" }}>
                                {sub.percentage}%
                              </span>
                              <div style={{ fontSize: 11, color: "#64748b" }}>
                                {sub.attended} / {sub.delivered}
                              </div>
                            </div>
                          </div>

                          {/* Component Pills */}
                          {sub.components && sub.components.length > 0 && (
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingTop: 2 }}>
                              {sub.components.map((comp, cIdx) => (
                                <span
                                  key={cIdx}
                                  style={{
                                    fontSize: 10.5,
                                    padding: "2px 6px",
                                    borderRadius: 6,
                                    background: "#f1f5f9",
                                    color: "#475569",
                                    fontWeight: 700,
                                  }}
                                >
                                  {comp.type}: {comp.attended}/{comp.delivered}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: "14px 22px",
                  borderTop: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#f8fafc",
                }}
              >
                <div style={{ fontSize: 11.5, color: "#64748b" }}>
                  Last DB Update: {formatIST(selectedStudent.lastSyncedAt)}
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 8,
                    border: "none",
                    background: "#0f172a",
                    color: "#ffffff",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
