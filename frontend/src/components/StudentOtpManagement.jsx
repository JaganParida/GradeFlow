import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Clock,
  Smartphone,
  Laptop,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  User,
  Info,
  RefreshCw,
  Send,
  Sliders,
  Check,
  X,
  Zap,
  Layers,
  Globe,
  Activity,
  Calendar,
  Monitor,
  Tablet,
  LogOut,
  Trash2,
  KeyRound,
  Filter,
  Users,
  Eye,
  ArrowUpRight,
  Loader2,
  Radio,
  CircleDot,
  Circle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

function getSectionFromRegNo(regNo) {
  if (!regNo) return "A";
  const r = String(regNo).trim();
  if (r === "230301180026") return "I";
  
  if (/^\d{2}0301120/.test(r)) {
     const num = parseInt(r.slice(-3), 10);
     if (num >= 1 && num <= 60) return "A";
     if (num >= 61 && num <= 120) return "B";
     if (num >= 121 && num <= 180) return "C";
     if (num >= 181 && num <= 240) return "D";
     if (num >= 241 && num <= 300) return "E";
     if (num >= 301 && num <= 360) return "F";
     if (num >= 361 && num <= 420) return "G";
     if (num >= 421 && num <= 480) return "H";
     if (num >= 481 && num <= 549) return "I";
  }
  return "A";
}

function getDynamicBranch(regNo, fallbackBranch) {
  if (!regNo) return fallbackBranch || "CSE";
  const r = String(regNo).trim();
  if (r === "230301180026") return "CSE";
  if (["230301120110", "230301120186", "230301120371", "230301120481"].includes(r)) return "ECE";
  if (r === "230301231033") return "AERO";

  const suffix = r.length >= 9 ? r.slice(2) : r;
  if (suffix.startsWith("0301110") || suffix.startsWith("0301111")) return "CIVIL";
  if (suffix.startsWith("0301120") || suffix.startsWith("0301121")) return "CSE";
  if (suffix.startsWith("0301130") || suffix.startsWith("0301131") || suffix.startsWith("0301132")) return "ECE";
  if (suffix.startsWith("0301150") || suffix.startsWith("0301151")) return "EEE";
  if (suffix.startsWith("0301160") || suffix.startsWith("0301161")) return "ME";
  if (suffix.startsWith("0301180")) return "BIO";
  if (suffix.startsWith("0301190") || suffix.startsWith("0301191")) return "MI";
  if (suffix.startsWith("0301230")) return "AERO";

  if (r.startsWith("230301110") || r.startsWith("230301111")) return "CIVIL";
  if (r.startsWith("230301120") || r.startsWith("230301121")) return "CSE";
  if (r.startsWith("230301130") || r.startsWith("230301131") || r.startsWith("230301132")) return "ECE";
  if (r.startsWith("230301150") || r.startsWith("230301151")) return "EEE";
  if (r.startsWith("230301160") || r.startsWith("230301161")) return "ME";
  if (r.startsWith("230301180")) return "BIO";
  if (r.startsWith("230301190") || r.startsWith("230301191")) return "MI";
  if (r.startsWith("230301230")) return "AERO";
  return fallbackBranch || "CSE";
}

function formatISTDate(dateVal) {
  if (!dateVal) return "N/A";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "N/A";
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return "N/A";
  }
}

export default function StudentOtpManagement({ API, authHeaders, isMobile }) {
  const [isMobileScreen, setIsMobileScreen] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : Boolean(isMobile)
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768 || Boolean(isMobile));
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

  const [searchReg, setSearchReg] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [studentData, setStudentData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);

  // Registered Accounts Directory State
  const [accountsList, setAccountsList] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsStats, setAccountsStats] = useState({ totalRegistered: 0, totalActive: 0, totalOffline: 0 });
  const [directoryFilter, setDirectoryFilter] = useState("all"); // "all" | "active" | "offline"
  const [directorySearch, setDirectorySearch] = useState("");

  // Reset Modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetReason, setResetReason] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Revoke Session Modal state
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState(null); // { isAll: boolean, session: object | null }
  const [revokeReason, setRevokeReason] = useState("");
  const [revokeLoading, setRevokeLoading] = useState(false);

  // Fetch all registered student accounts on mount & when filter changes
  const fetchAccounts = async (search = directorySearch, filter = directoryFilter) => {
    setAccountsLoading(true);
    try {
      const res = await axios.get(
        `${API}/admin/student-accounts?search=${encodeURIComponent(search)}&filter=${filter}`,
        authHeaders
      );
      if (res.data?.success) {
        setAccountsList(res.data.accounts || []);
        setAccountsStats({
          totalRegistered: res.data.totalRegistered || 0,
          totalActive: res.data.totalActive || 0,
          totalOffline: res.data.totalOffline || 0,
        });
      }
    } catch (err) {
      console.warn("Failed to fetch student accounts directory:", err.message);
    } finally {
      setAccountsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts(directorySearch, directoryFilter);
  }, [directoryFilter]);

  const handleDirectorySearchSubmit = (e) => {
    if (e) e.preventDefault();
    fetchAccounts(directorySearch, directoryFilter);
  };

  const handleSearchWithReg = async (targetReg) => {
    const cleanReg = targetReg.trim().toUpperCase();
    if (!cleanReg) return;
    setSearchReg(cleanReg);
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await axios.get(
        `${API}/admin/student-otp-management/history/${cleanReg}`,
        authHeaders
      );
      if (res.data?.success) {
        setStudentData(res.data.studentSummary);
        setTimeline(res.data.historyTimeline || []);
        setHistoryPage(1);
        window.scrollTo({ top: 380, behavior: "smooth" });
      } else {
        setErrorMsg(res.data?.message || "Failed to fetch student OTP details.");
        setStudentData(null);
        setTimeline([]);
      }
    } catch (err) {
      console.error("Student OTP Search Error:", err);
      const msg = err.response?.data?.message || "Student record not found or server error.";
      setErrorMsg(msg);
      setStudentData(null);
      setTimeline([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    handleSearchWithReg(searchReg);
  };

  const handleResetSubmit = async () => {
    if (!studentData?.regNo) return;
    setResetLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await axios.post(
        `${API}/admin/student-otp-management/reset/${studentData.regNo}`,
        { reason: resetReason.trim() },
        authHeaders
      );

      if (res.data?.success) {
        setSuccessMsg(res.data.message || "OTP attempts reset successfully.");
        setShowResetModal(false);
        setResetReason("");
        // Refresh details
        handleSearch();
      } else {
        setErrorMsg(res.data?.message || "Failed to reset OTP attempts.");
      }
    } catch (err) {
      console.error("OTP Reset Error:", err);
      setErrorMsg(err.response?.data?.message || "An error occurred while resetting OTP attempts.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleRevokeSubmit = async () => {
    if (!studentData?.regNo || !revokeTarget) return;
    setRevokeLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      let res;
      if (revokeTarget.isAll) {
        res = await axios.post(
          `${API}/admin/student-otp-management/revoke-all-sessions/${studentData.regNo}`,
          { reason: revokeReason.trim() },
          authHeaders
        );
      } else {
        res = await axios.post(
          `${API}/admin/student-otp-management/revoke-session/${studentData.regNo}`,
          {
            sessionId: revokeTarget.session?.sessionId,
            reason: revokeReason.trim(),
          },
          authHeaders
        );
      }

      if (res.data?.success) {
        setSuccessMsg(res.data.message || "Device session revoked successfully.");
        setShowRevokeModal(false);
        setRevokeTarget(null);
        setRevokeReason("");
        // Instantly reload student session details
        handleSearch();
      } else {
        setErrorMsg(res.data?.message || "Failed to revoke device session.");
      }
    } catch (err) {
      console.error("Session Revoke Error:", err);
      setErrorMsg(err.response?.data?.message || "An error occurred while revoking the device session.");
    } finally {
      setRevokeLoading(false);
    }
  };

  const isMob = isMobileScreen;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMob ? 16 : 22, fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Top Header Banner ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
          borderRadius: isMob ? 16 : 20,
          padding: isMob ? "16px 14px" : "24px 28px",
          color: "#ffffff",
          boxShadow: "0 10px 25px -5px rgba(49, 46, 129, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMob ? 10 : 14 }}>
            <div
              style={{
                width: isMob ? 38 : 44,
                height: isMob ? 38 : 44,
                borderRadius: isMob ? 10 : 12,
                background: "rgba(255, 255, 255, 0.14)",
                backdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                flexShrink: 0,
              }}
            >
              <ShieldAlert size={isMob ? 20 : 24} color="#a5b4fc" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: isMob ? 16.5 : 22, fontWeight: 800, letterSpacing: "-0.5px" }}>
                Student OTP & Session Control
              </h2>
              <span
                style={{
                  background: "#4338ca",
                  color: "#e0e7ff",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: 6,
                  border: "1px solid #6366f1",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              >
                Main Admin
              </span>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: isMob ? 12 : 13, color: "#c7d2fe", maxWidth: 680, lineHeight: 1.45 }}>
            Inspect detailed OTP request history, live authorized device sessions, and reset daily limits with full audit logging.
          </p>
        </div>
      </div>

      {/* ── Registered Accounts & Live Login Monitor Directory ── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: isMob ? 16 : 18,
          border: "1px solid #e2e8f0",
          padding: isMob ? "14px 12px" : "22px 24px",
          boxShadow: "0 2px 10px rgba(15, 23, 42, 0.03)",
          display: "flex",
          flexDirection: "column",
          gap: isMob ? 14 : 18,
        }}
      >
        {/* Top Header with title and refresh button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMob ? "flex-start" : "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Users size={isMob ? 18 : 20} color="#4f46e5" />
              <h3 style={{ margin: 0, fontSize: isMob ? 15 : 16, fontWeight: 800, color: "#0f172a" }}>
                Registered Accounts & Live Monitor
              </h3>
            </div>
            <p style={{ margin: "3px 0 0 0", fontSize: isMob ? 11.5 : 12.5, color: "#64748b" }}>
              Live verified student accounts with active sessions in MongoDB.
            </p>
          </div>
          <button
            onClick={() => fetchAccounts(directorySearch, directoryFilter)}
            disabled={accountsLoading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: isMob ? "6px 11px" : "7px 14px",
              borderRadius: 8,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              color: "#334155",
              fontSize: isMob ? 11.5 : 12.5,
              fontWeight: 700,
              cursor: accountsLoading ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw size={isMob ? 12 : 13} className={accountsLoading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* 3 Summary Mini Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMob ? "repeat(3, 1fr)" : "repeat(auto-fit, minmax(180px, 1fr))",
            gap: isMob ? 8 : 12,
          }}
        >
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: isMob ? 12 : 14,
              padding: isMob ? "10px 8px" : "12px 16px",
              display: "flex",
              flexDirection: isMob ? "column" : "row",
              alignItems: isMob ? "flex-start" : "center",
              gap: isMob ? 6 : 12,
            }}
          >
            <div
              style={{
                width: isMob ? 28 : 36,
                height: isMob ? 28 : 36,
                borderRadius: isMob ? 8 : 10,
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <KeyRound size={isMob ? 14 : 16} color="#2563eb" />
            </div>
            <div>
              <div style={{ fontSize: isMob ? 9.5 : 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.2px" }}>
                Created
              </div>
              <div style={{ fontSize: isMob ? 16 : 18, fontWeight: 800, color: "#0f172a" }}>
                {accountsStats.totalRegistered}
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: isMob ? 12 : 14,
              padding: isMob ? "10px 8px" : "12px 16px",
              display: "flex",
              flexDirection: isMob ? "column" : "row",
              alignItems: isMob ? "flex-start" : "center",
              gap: isMob ? 6 : 12,
            }}
          >
            <div
              style={{
                width: isMob ? 28 : 36,
                height: isMob ? 28 : 36,
                borderRadius: isMob ? 8 : 10,
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Activity size={isMob ? 14 : 16} color="#059669" />
            </div>
            <div>
              <div style={{ fontSize: isMob ? 9.5 : 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.2px" }}>
                Online
              </div>
              <div style={{ fontSize: isMob ? 16 : 18, fontWeight: 800, color: "#059669" }}>
                {accountsStats.totalActive}
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: isMob ? 12 : 14,
              padding: isMob ? "10px 8px" : "12px 16px",
              display: "flex",
              flexDirection: isMob ? "column" : "row",
              alignItems: isMob ? "flex-start" : "center",
              gap: isMob ? 6 : 12,
            }}
          >
            <div
              style={{
                width: isMob ? 28 : 36,
                height: isMob ? 28 : 36,
                borderRadius: isMob ? 8 : 10,
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <User size={isMob ? 14 : 16} color="#64748b" />
            </div>
            <div>
              <div style={{ fontSize: isMob ? 9.5 : 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.2px" }}>
                Offline
              </div>
              <div style={{ fontSize: isMob ? 16 : 18, fontWeight: 800, color: "#64748b" }}>
                {accountsStats.totalOffline}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Pills & Directory Search */}
        <div style={{ display: "flex", flexDirection: isMob ? "column" : "row", justifyContent: "space-between", alignItems: isMob ? "stretch" : "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, overflowX: isMob ? "auto" : "visible", paddingBottom: isMob ? 4 : 0 }}>
            {[
              { id: "all", label: `All (${accountsStats.totalRegistered})`, icon: <Users size={12} /> },
              { id: "active", label: `Online (${accountsStats.totalActive})`, icon: <Activity size={12} color="#16a34a" />, dotColor: "#16a34a" },
              { id: "offline", label: `Offline (${accountsStats.totalOffline})`, icon: <Clock size={12} color="#64748b" />, dotColor: "#94a3b8" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setDirectoryFilter(f.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: isMob ? "5px 10px" : "6px 12px",
                  borderRadius: 8,
                  border: directoryFilter === f.id ? "1.5px solid #4f46e5" : "1px solid #e2e8f0",
                  background: directoryFilter === f.id ? "#eef2ff" : "#ffffff",
                  color: directoryFilter === f.id ? "#4338ca" : "#64748b",
                  fontSize: isMob ? 11.5 : 12,
                  fontWeight: directoryFilter === f.id ? 700 : 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {f.dotColor ? (
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: f.dotColor, display: "inline-block" }} />
                ) : (
                  f.icon
                )}
                <span>{f.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleDirectorySearchSubmit} style={{ display: "flex", gap: 6, width: isMob ? "100%" : "auto" }}>
            <input
              type="text"
              placeholder="Search Reg No or Name..."
              value={directorySearch}
              onChange={(e) => setDirectorySearch(e.target.value)}
              style={{
                flex: isMob ? 1 : "initial",
                width: isMob ? "auto" : 180,
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: 12,
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 12px",
                borderRadius: 8,
                border: "none",
                background: "#4f46e5",
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Filter size={11} />
              <span>Filter</span>
            </button>
          </form>
        </div>

        {/* ── Directory Accounts Content: Responsive (Mobile Cards vs Desktop Table) ── */}
        {isMob ? (
          /* Mobile Sleek Cards List */
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {accountsLoading ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                <Loader2 size={20} className="spin" style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: 12.5 }}>Loading accounts directory...</div>
              </div>
            ) : accountsList.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", background: "#f8fafc", borderRadius: 12, border: "1px dashed #e2e8f0", fontSize: 12.5 }}>
                No student accounts found matching filter.
              </div>
            ) : (
              accountsList.map((acc) => {
                const resolvedBranch = (acc.branch && acc.branch !== "N/A") ? acc.branch : getDynamicBranch(acc.regNo);
                const resolvedSection = (acc.section && acc.section !== "N/A") ? acc.section : getSectionFromRegNo(acc.regNo);

                return (
                  <div
                    key={acc.regNo}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 14,
                      padding: "12px 14px",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {/* Top Row: Avatar + Name/Reg + Inspect Button */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              background: acc.isCurrentlyLoggedIn ? "#dcfce7" : "#f1f5f9",
                              color: acc.isCurrentlyLoggedIn ? "#15803d" : "#475569",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: 13,
                              border: `1px solid ${acc.isCurrentlyLoggedIn ? "#bbf7d0" : "#e2e8f0"}`,
                            }}
                          >
                            {acc.studentName ? acc.studentName.charAt(0).toUpperCase() : "S"}
                          </div>
                          <span
                            style={{
                              position: "absolute",
                              bottom: -2,
                              right: -2,
                              width: 9,
                              height: 9,
                              borderRadius: "50%",
                              background: acc.isCurrentlyLoggedIn ? "#16a34a" : "#94a3b8",
                              border: "1.5px solid #ffffff",
                            }}
                          />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ color: "#0f172a", fontWeight: 800, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {acc.studentName}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
                            <span style={{ fontSize: 11.5, color: "#4f46e5", fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                              {acc.regNo}
                            </span>
                            <span style={{ fontSize: 10.5, color: "#64748b", background: "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>
                              {resolvedBranch} • Sec {resolvedSection}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSearchWithReg(acc.regNo)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "6px 12px",
                          borderRadius: 8,
                          background: "#eef2ff",
                          border: "1px solid #c7d2fe",
                          color: "#4338ca",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        <Eye size={12} />
                        <span>Inspect</span>
                      </button>
                    </div>

                    {/* Bottom Status Row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px dashed #f1f5f9", gap: 6, flexWrap: "wrap" }}>
                      <div>
                        {acc.isCurrentlyLoggedIn ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              background: "#dcfce7",
                              color: "#166534",
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: 6,
                              border: "1px solid #bbf7d0",
                            }}
                          >
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                            <span>Live Online ({acc.activeSessionsCount} dev)</span>
                            {acc.activeSessions?.[0]?.deviceType === "Mobile" ? (
                              <Smartphone size={10.5} />
                            ) : (
                              <Laptop size={10.5} />
                            )}
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              background: "#f1f5f9",
                              color: "#64748b",
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "3px 8px",
                              borderRadius: 6,
                              border: "1px solid #e2e8f0",
                            }}
                          >
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#94a3b8", display: "inline-block" }} />
                            <span>Offline</span>
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: 10.5, color: "#94a3b8" }}>
                        Pwd: {formatISTDate(acc.passwordCreatedAt)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Desktop Pristine Table View */
          <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  <th style={{ padding: "10px 14px", fontWeight: 700 }}>Student / Reg No</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700 }}>Batch / Branch</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700 }}>Password Created</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700 }}>Login Status</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700, textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {accountsLoading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                      <Loader2 size={20} className="spin" style={{ margin: "0 auto 8px" }} />
                      <div>Loading verified accounts directory...</div>
                    </td>
                  </tr>
                ) : accountsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>
                      No registered student accounts found matching filter.
                    </td>
                  </tr>
                ) : (
                  accountsList.map((acc) => {
                    const resolvedBranch = (acc.branch && acc.branch !== "N/A") ? acc.branch : getDynamicBranch(acc.regNo);
                    const resolvedSection = (acc.section && acc.section !== "N/A") ? acc.section : getSectionFromRegNo(acc.regNo);

                    return (
                      <tr key={acc.regNo} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: acc.isCurrentlyLoggedIn ? "#dcfce7" : "#f1f5f9",
                                color: acc.isCurrentlyLoggedIn ? "#15803d" : "#475569",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                fontSize: 12,
                              }}
                            >
                              {acc.studentName ? acc.studentName.charAt(0).toUpperCase() : "S"}
                            </div>
                            <div>
                              <strong style={{ color: "#0f172a", display: "block" }}>{acc.studentName}</strong>
                              <span style={{ fontSize: 11.5, color: "#64748b", fontFamily: "'Space Mono', monospace" }}>
                                {acc.regNo}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#334155" }}>
                          <div style={{ fontWeight: 600 }}>Batch {acc.batch || "2023"}</div>
                          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>
                            {resolvedBranch} (Sec {resolvedSection})
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#64748b", fontSize: 12 }}>
                          {formatISTDate(acc.passwordCreatedAt)}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          {acc.isCurrentlyLoggedIn ? (
                            <div style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  background: "#dcfce7",
                                  color: "#166534",
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  padding: "3px 9px",
                                  borderRadius: 6,
                                  border: "1px solid #bbf7d0",
                                }}
                              >
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                                <span>Live Online ({acc.activeSessionsCount} device)</span>
                              </span>
                              {acc.activeSessions?.[0] && (
                                <span style={{ fontSize: 10.5, color: "#64748b", display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  {acc.activeSessions[0].deviceType === "Mobile" ? (
                                    <Smartphone size={11} color="#64748b" />
                                  ) : (
                                    <Laptop size={11} color="#64748b" />
                                  )}
                                  <span>{acc.activeSessions[0].deviceType} ({acc.activeSessions[0].browser})</span>
                                </span>
                              )}
                            </div>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                background: "#f1f5f9",
                                color: "#64748b",
                                fontSize: 11.5,
                                fontWeight: 600,
                                padding: "3px 9px",
                                borderRadius: 6,
                                border: "1px solid #e2e8f0",
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#94a3b8", display: "inline-block" }} />
                              <span>Offline</span>
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                          <button
                            onClick={() => handleSearchWithReg(acc.regNo)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "6px 12px",
                              borderRadius: 8,
                              background: "#eef2ff",
                              border: "1px solid #c7d2fe",
                              color: "#4338ca",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            <Eye size={13} />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Search Bar Card ── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: isMob ? 14 : 16,
          border: "1px solid #e2e8f0",
          padding: isMob ? "14px 12px" : "20px 24px",
          boxShadow: "0 2px 10px rgba(15, 23, 42, 0.03)",
        }}
      >
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, flexDirection: isMob ? "column" : "row", alignItems: "stretch" }}>
          <div style={{ position: "relative", flex: 1, minWidth: isMob ? "100%" : 280 }}>
            <Search
              size={18}
              color="#94a3b8"
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder={isMob ? "Enter Reg No (e.g., 230301120137)..." : "Enter Student Reg No (e.g., 230301120137)..."}
              value={searchReg}
              onChange={(e) => setSearchReg(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 14px 11px 42px",
                borderRadius: 12,
                border: "1.5px solid #cbd5e1",
                fontSize: 13.5,
                fontWeight: 600,
                color: "#0f172a",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
                maxWidth: "100%",
                fontFamily: "'DM Sans', sans-serif",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
              onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: isMob ? "11px 16px" : "12px 24px",
              borderRadius: 12,
              border: "none",
              background: "#4f46e5",
              color: "#ffffff",
              fontSize: 13.5,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
              transition: "all 0.2s",
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? <RefreshCw size={15} className="spin" /> : <Search size={15} />}
            <span>Search Activity</span>
          </button>
        </form>

        {errorMsg && (
          <div
            style={{
              marginTop: 14,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 10,
              padding: "10px 14px",
              color: "#b91c1c",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertTriangle size={16} color="#dc2626" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              marginTop: 14,
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 10,
              padding: "10px 14px",
              color: "#15803d",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <CheckCircle2 size={16} color="#16a34a" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* ── Student Summary & Timeline (If Student Found) ── */}
      {studentData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          {/* Summary Overview Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMob ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))",
              gap: isMob ? 10 : 14,
            }}
          >
            {/* Student Info Card */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: isMob ? "14px 16px" : "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Student Identity
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                {studentData.studentName}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#4f46e5" }}>
                {studentData.regNo}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                <Mail size={12} /> {studentData.maskedEmail}
              </div>
            </div>

            {/* Today's Usage Card */}
            <div
              style={{
                background: studentData.todayUsage >= studentData.maxDailyLimit ? "#fef2f2" : "#f8fafc",
                border: `1px solid ${studentData.todayUsage >= studentData.maxDailyLimit ? "#fecaca" : "#e2e8f0"}`,
                borderRadius: 14,
                padding: isMob ? "14px 16px" : "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Today's OTP Quota ({studentData.todayDateKey})
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: studentData.todayUsage >= studentData.maxDailyLimit ? "#b91c1c" : "#0f172a" }}>
                {studentData.todayUsage} / {studentData.maxDailyLimit}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: studentData.todayUsage >= studentData.maxDailyLimit ? "#dc2626" : "#16a34a" }}>
                {studentData.todayUsage >= studentData.maxDailyLimit ? "Daily quota exhausted" : `${studentData.remainingDailyAttempts} attempt(s) remaining`}
              </div>
            </div>

            {/* Cooldown State Card */}
            <div
              style={{
                background: studentData.isCooldownActive ? "#fffbeb" : "#f8fafc",
                border: `1px solid ${studentData.isCooldownActive ? "#fde68a" : "#e2e8f0"}`,
                borderRadius: 14,
                padding: isMob ? "14px 16px" : "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                180-Second Cooldown
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: studentData.isCooldownActive ? "#b45309" : "#10b981", display: "flex", alignItems: "center", gap: 6 }}>
                {studentData.isCooldownActive ? (
                  <>
                    <Clock size={18} /> {studentData.cooldownRemainingSeconds}s Active
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} /> Not Active
                  </>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {studentData.isCooldownActive ? "Resend locked temporarily" : "Can send new OTP immediately"}
              </div>
            </div>

            {/* Active Devices Card */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: isMob ? "14px 16px" : "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Active Devices ({studentData.activeDevicesCount} / {studentData.maxAllowedDevices})
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: studentData.activeDevicesCount >= studentData.maxAllowedDevices ? "#b91c1c" : "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                <Smartphone size={18} /> {studentData.activeDevicesCount} Active Device(s)
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {studentData.activeDevicesCount >= studentData.maxAllowedDevices ? "Single-device lock active" : "Device slots available"}
              </div>
            </div>
          </div>

          {/* ── Active Authorized Device Sessions Panel ── */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              padding: isMob ? "14px 12px" : "20px 24px",
              boxShadow: "0 2px 10px rgba(15, 23, 42, 0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: (studentData.activeSessions?.length || 0) > 0 ? "#ecfdf5" : "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Smartphone size={17} color={(studentData.activeSessions?.length || 0) > 0 ? "#059669" : "#64748b"} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: isMob ? 14.5 : 15.5, fontWeight: 800, color: "#0f172a" }}>
                    Active Device Sessions ({studentData.activeDevicesCount} / {studentData.maxAllowedDevices})
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: 11.5, color: "#64748b" }}>
                    Live student sessions currently holding valid authentication tokens in MongoDB.
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {(studentData.activeSessions?.length || 0) > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setRevokeTarget({ isAll: true, session: null });
                      setRevokeReason("");
                      setShowRevokeModal(true);
                    }}
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: "#b91c1c",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      padding: "4px 10px",
                      borderRadius: 8,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#fef2f2"; }}
                  >
                    <Trash2 size={12} color="#dc2626" />
                    Revoke All Devices
                  </button>
                )}
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: (studentData.activeSessions?.length || 0) > 0 ? "#065f46" : "#64748b",
                    background: (studentData.activeSessions?.length || 0) > 0 ? "#d1fae5" : "#f1f5f9",
                    padding: "4px 10px",
                    borderRadius: 8,
                    border: `1px solid ${(studentData.activeSessions?.length || 0) > 0 ? "#a7f3d0" : "#e2e8f0"}`,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  {(studentData.activeSessions?.length || 0) > 0 ? (
                    <>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                      {studentData.activeSessions.length} Active Device{studentData.activeSessions.length > 1 ? "s" : ""}
                    </>
                  ) : (
                    "0 Active Devices (Signed Out)"
                  )}
                </span>
              </div>
            </div>

            {(!studentData.activeSessions || studentData.activeSessions.length === 0) ? (
              <div
                style={{
                  padding: "20px 16px",
                  borderRadius: 12,
                  background: "#f8fafc",
                  border: "1px dashed #cbd5e1",
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: 13,
                }}
              >
                No active device sessions found. Student is signed out on all devices.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: isMob ? "1fr" : "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
                {studentData.activeSessions.map((session, idx) => {
                  const isMobileDev = session.deviceType === "Mobile";
                  const isTab = session.deviceType === "Tablet";
                  return (
                    <div
                      key={session.sessionId || idx}
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        padding: "14px 16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: "#eff6ff",
                              color: "#2563eb",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {isMobileDev ? <Smartphone size={17} /> : isTab ? <Tablet size={17} /> : <Laptop size={17} />}
                          </div>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>
                              {session.platform || "Authorized Device"}
                            </div>
                            <div style={{ fontSize: 11.5, color: "#64748b" }}>
                              Device {session.deviceIndex || idx + 1} of {studentData.maxAllowedDevices}
                            </div>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#059669",
                            background: "#ecfdf5",
                            border: "1px solid #a7f3d0",
                            padding: "3px 8px",
                            borderRadius: 6,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                          ACTIVE
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, paddingTop: 6, borderTop: "1px solid #f1f5f9" }}>
                        <div>
                          <div style={{ color: "#94a3b8", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase" }}>IP Address</div>
                          <div style={{ color: "#334155", fontWeight: 600, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                            <Globe size={12} color="#64748b" /> {session.maskedIp || "Hidden"}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: "#94a3b8", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase" }}>Logged In</div>
                          <div style={{ color: "#334155", fontWeight: 600, marginTop: 2 }}>
                            {formatISTDate(session.loggedInAt)}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: "#94a3b8", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase" }}>Last Active</div>
                          <div style={{ color: "#334155", fontWeight: 600, marginTop: 2 }}>
                            {formatISTDate(session.lastActiveAt)}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: "#94a3b8", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase" }}>Session Expiry</div>
                          <div style={{ color: "#059669", fontWeight: 700, marginTop: 2 }}>
                            Permanent (Until Logout)
                          </div>
                        </div>
                      </div>

                      {/* Revoke Session Button */}
                      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 6, borderTop: "1px dashed #e2e8f0" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setRevokeTarget({ isAll: false, session });
                            setRevokeReason("");
                            setShowRevokeModal(true);
                          }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "1px solid #fecaca",
                            background: "#fff1f2",
                            color: "#be123c",
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#ffe4e6";
                            e.currentTarget.style.borderColor = "#fda4af";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#fff1f2";
                            e.currentTarget.style.borderColor = "#fecaca";
                          }}
                        >
                          <LogOut size={12} color="#e11d48" />
                          Revoke Session
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Chronological OTP History Timeline (Recent First & 5 Items / Page) ── */}
          {(() => {
            const sortedTimeline = [...timeline].sort(
              (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
            );
            const itemsPerPage = 5;
            const totalPages = Math.max(1, Math.ceil(sortedTimeline.length / itemsPerPage));
            const safePage = Math.min(Math.max(1, historyPage), totalPages);
            const startIndex = (safePage - 1) * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, sortedTimeline.length);
            const paginatedTimeline = sortedTimeline.slice(startIndex, endIndex);

            return (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 16,
                  border: "1.5px solid #e2e8f0",
                  padding: isMob ? "16px 12px" : "22px 24px",
                  boxShadow: "0 4px 20px rgba(15, 23, 42, 0.03)",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: isMob ? "flex-start" : "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                    flexDirection: isMob ? "column" : "row",
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Activity size={18} color="#4f46e5" />
                      <h3 style={{ margin: 0, fontSize: isMob ? 15.5 : 16.5, fontWeight: 800, color: "#0f172a" }}>
                        OTP Activity & Delivery History
                      </h3>
                    </div>
                    <p style={{ margin: "4px 0 0 0", fontSize: isMob ? 11.5 : 12.5, color: "#64748b" }}>
                      {sortedTimeline.length > 0
                        ? `Showing events ${startIndex + 1}–${endIndex} of ${sortedTimeline.length} • Recent first (5 per page)`
                        : "No OTP requests recorded for this student."}
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, width: isMob ? "100%" : "auto", justifyContent: isMob ? "space-between" : "flex-end" }}>
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 800,
                        color: "#4f46e5",
                        background: "#eef2ff",
                        border: "1px solid #c7d2fe",
                        padding: "3px 10px",
                        borderRadius: 8,
                      }}
                    >
                      Total Events: {sortedTimeline.length}
                    </span>
                    {totalPages > 1 && (
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: "#475569",
                          background: "#f1f5f9",
                          border: "1px solid #e2e8f0",
                          padding: "3px 10px",
                          borderRadius: 8,
                        }}
                      >
                        Page {safePage} / {totalPages}
                      </span>
                    )}
                  </div>
                </div>

                {/* Timeline Items */}
                {sortedTimeline.length === 0 ? (
                  <div
                    style={{
                      padding: "40px 20px",
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: 13,
                      background: "#f8fafc",
                      borderRadius: 12,
                      border: "1px dashed #cbd5e1",
                    }}
                  >
                    <Clock size={28} color="#94a3b8" style={{ margin: "0 auto 8px" }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>No OTP request history logged for this student yet.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {paginatedTimeline.map((item, idx) => {
                      const isDelivered = item.status === "DELIVERED";
                      const isBlocked = item.status === "BLOCKED";
                      const isFailed = item.status === "FAILED";

                      let badgeBg = "#ecfdf5";
                      let badgeBorder = "#a7f3d0";
                      let badgeColor = "#065f46";
                      let StatusIcon = CheckCircle2;

                      if (isBlocked) {
                        badgeBg = "#fffbeb";
                        badgeBorder = "#fde68a";
                        badgeColor = "#92400e";
                        StatusIcon = AlertTriangle;
                      } else if (isFailed) {
                        badgeBg = "#fef2f2";
                        badgeBorder = "#fecaca";
                        badgeColor = "#991b1b";
                        StatusIcon = XCircle;
                      }

                      return (
                        <div
                          key={item.id || idx}
                          style={{
                            background: "#f8fafc",
                            border: `1px solid ${isFailed ? "#fecaca" : isBlocked ? "#fed7aa" : "#e2e8f0"}`,
                            borderRadius: 14,
                            padding: isMob ? "12px 14px" : "14px 18px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            transition: "all 0.15s ease",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                          }}
                        >
                          {/* Top Row: Status Badge & Time */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              flexWrap: "wrap",
                              gap: 8,
                            }}
                          >
                            <span
                              style={{
                                background: badgeBg,
                                border: `1px solid ${badgeBorder}`,
                                color: badgeColor,
                                fontSize: 11,
                                fontWeight: 800,
                                padding: "3px 8px",
                                borderRadius: 6,
                                textTransform: "uppercase",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                              }}
                            >
                              <StatusIcon size={12} />
                              <span>{item.status}</span>
                            </span>

                            <div
                              style={{
                                fontSize: 11.5,
                                color: "#64748b",
                                fontWeight: 600,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                fontFamily: "'Space Mono', monospace",
                              }}
                            >
                              <Clock size={12} color="#94a3b8" />
                              <span>{item.formattedTime}</span>
                            </div>
                          </div>

                          {/* Middle Row: Reason / Description */}
                          <div style={{ fontSize: isMob ? 13 : 13.5, fontWeight: 700, color: "#0f172a", lineHeight: 1.4 }}>
                            {item.reason}
                          </div>

                          {/* Bottom Row: Provider & Device Metadata Chips */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              flexWrap: "wrap",
                              paddingTop: 2,
                            }}
                          >
                            {/* Provider Chip */}
                            <span
                              style={{
                                background: item.provider === "BREVO" ? "#ecfeff" : item.provider === "GMAIL" ? "#faf5ff" : "#f1f5f9",
                                border: `1px solid ${item.provider === "BREVO" ? "#a5f3fc" : item.provider === "GMAIL" ? "#e9d5ff" : "#cbd5e1"}`,
                                color: item.provider === "BREVO" ? "#0e7490" : item.provider === "GMAIL" ? "#7e22ce" : "#475569",
                                fontSize: 10.5,
                                fontWeight: 700,
                                padding: "2.5px 8px",
                                borderRadius: 6,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Mail size={11} />
                              <span>
                                {item.provider === "BREVO"
                                  ? "Brevo Primary"
                                  : item.provider === "GMAIL"
                                  ? "Gmail Fallback"
                                  : "System Handover"}
                              </span>
                            </span>

                            {/* Device & IP Chip */}
                            <span
                              style={{
                                background: "#ffffff",
                                border: "1px solid #cbd5e1",
                                color: "#334155",
                                fontSize: 10.5,
                                fontWeight: 600,
                                padding: "2.5px 8px",
                                borderRadius: 6,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                              }}
                            >
                              {item.device?.deviceType === "Mobile" ? <Smartphone size={11} /> : <Laptop size={11} />}
                              <span>{item.device?.platform || "Device"} • {item.device?.maskedIp || "Hidden IP"}</span>
                            </span>

                            {item.failoverOccurred && (
                              <span
                                style={{
                                  background: "#fef3c7",
                                  border: "1px solid #fde68a",
                                  color: "#92400e",
                                  fontSize: 10,
                                  fontWeight: 800,
                                  padding: "2px 6px",
                                  borderRadius: 6,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                              >
                                <Zap size={10.5} /> Failover Auto-Switch
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Mobile-Friendly & Desktop Pagination Controls ── */}
                {totalPages > 1 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 12,
                      marginTop: 18,
                      paddingTop: 14,
                      borderTop: "1px solid #e2e8f0",
                    }}
                  >
                    {/* Left: Events summary (Desktop) */}
                    {!isMob && (
                      <span style={{ fontSize: 12.5, color: "#64748b", fontWeight: 600 }}>
                        Showing <strong>{startIndex + 1}–{endIndex}</strong> of <strong>{sortedTimeline.length}</strong> events
                      </span>
                    )}

                    {/* Pagination Buttons Container */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        width: isMob ? "100%" : "auto",
                        justifyContent: isMob ? "space-between" : "flex-end",
                      }}
                    >
                      {/* Previous Page Button */}
                      <button
                        type="button"
                        disabled={safePage <= 1}
                        onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                        style={{
                          flex: isMob ? "1 1 0" : "none",
                          padding: isMob ? "9px 12px" : "7px 14px",
                          borderRadius: 8,
                          border: "1px solid",
                          borderColor: safePage <= 1 ? "#e2e8f0" : "#cbd5e1",
                          background: safePage <= 1 ? "#f8fafc" : "#ffffff",
                          color: safePage <= 1 ? "#94a3b8" : "#1e293b",
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: safePage <= 1 ? "not-allowed" : "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <ChevronLeft size={14} />
                        <span>Previous</span>
                      </button>

                      {/* Numbered Page Buttons */}
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                          const isActive = pageNum === safePage;
                          if (totalPages > 5 && Math.abs(pageNum - safePage) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                            if (pageNum === 2 || pageNum === totalPages - 1) {
                              return <span key={pageNum} style={{ fontSize: 11, color: "#94a3b8", padding: "0 2px" }}>...</span>;
                            }
                            return null;
                          }

                          return (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => setHistoryPage(pageNum)}
                              style={{
                                minWidth: 32,
                                height: 32,
                                padding: "0 6px",
                                borderRadius: 8,
                                border: "1px solid",
                                borderColor: isActive ? "#4f46e5" : "#cbd5e1",
                                background: isActive ? "#4f46e5" : "#ffffff",
                                color: isActive ? "#ffffff" : "#334155",
                                fontSize: 12,
                                fontWeight: 800,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s ease",
                                boxShadow: isActive ? "0 2px 6px rgba(79, 70, 229, 0.25)" : "none",
                              }}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      {/* Next Page Button */}
                      <button
                        type="button"
                        disabled={safePage >= totalPages}
                        onClick={() => setHistoryPage((p) => Math.min(totalPages, p + 1))}
                        style={{
                          flex: isMob ? "1 1 0" : "none",
                          padding: isMob ? "9px 12px" : "7px 14px",
                          borderRadius: 8,
                          border: "1px solid",
                          borderColor: safePage >= totalPages ? "#e2e8f0" : "#cbd5e1",
                          background: safePage >= totalPages ? "#f8fafc" : "#ffffff",
                          color: safePage >= totalPages ? "#94a3b8" : "#1e293b",
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: safePage >= totalPages ? "not-allowed" : "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span>Next</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Separate Administrative Decision Action Card ── */}
          <div
            style={{
              background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
              border: "1.5px solid #cbd5e1",
              borderRadius: 16,
              padding: isMob ? "16px 14px" : "22px 26px",
              display: "flex",
              flexDirection: isMob ? "column" : "row",
              alignItems: isMob ? "flex-start" : "center",
              justifyContent: "space-between",
              gap: 14,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <ShieldCheck size={18} color="#4f46e5" />
                <h4 style={{ margin: 0, fontSize: isMob ? 14.5 : 15, fontWeight: 800, color: "#0f172a" }}>
                  Administrative Action: Reset Today's OTP Attempts
                </h4>
              </div>
              <p style={{ margin: 0, fontSize: isMob ? 12 : 12.5, color: "#64748b", maxWidth: 650, lineHeight: 1.4 }}>
                Resets only today's OTP quota ({studentData.todayDateKey}) for student <strong>{studentData.regNo}</strong> to <strong>0 / {studentData.maxDailyLimit}</strong> and clears active cooldown. Historical activity logs above are permanently retained for audit purposes.
              </p>
            </div>

            <button
              onClick={() => setShowResetModal(true)}
              style={{
                width: isMob ? "100%" : "auto",
                padding: isMob ? "11px 16px" : "12px 20px",
                borderRadius: 12,
                border: "none",
                background: "#dc2626",
                color: "#ffffff",
                fontSize: isMob ? 13 : 13.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              <RotateCcw size={15} />
              Reset Today's OTP Attempts
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Confirmation Modal ── */}
      <AnimatePresence>
        {showResetModal && studentData && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: 16,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: "#ffffff",
                borderRadius: 20,
                maxWidth: 480,
                width: "100%",
                padding: 24,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: "#fee2e2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <RotateCcw size={20} color="#dc2626" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 800, color: "#0f172a" }}>
                      Confirm OTP Quota Reset
                    </h3>
                    <div style={{ fontSize: 12, color: "#64748b" }}>Main Admin Authorization Required</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowResetModal(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* State Preview Box */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "14px 16px",
                  marginBottom: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#64748b" }}>Student Reg No:</span>
                  <strong style={{ color: "#0f172a" }}>{studentData.regNo} ({studentData.studentName})</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#64748b" }}>Today's Usage Change:</span>
                  <strong style={{ color: "#b91c1c" }}>{studentData.todayUsage} / {studentData.maxDailyLimit} &rarr; <span style={{ color: "#16a34a" }}>0 / {studentData.maxDailyLimit}</span></strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#64748b" }}>Cooldown Status:</span>
                  <strong style={{ color: "#16a34a" }}>Cleared to 0s</strong>
                </div>
              </div>

              {/* Optional Reason Input */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Administrative Reason (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., OTP delivery troubleshooting, support ticket #102..."
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  disabled={resetLoading}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetSubmit}
                  disabled={resetLoading}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: "#dc2626",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: resetLoading ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {resetLoading ? <RefreshCw size={14} className="spin" /> : <Check size={14} />}
                  Confirm & Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Revoke Device Session Confirmation Modal ── */}
      <AnimatePresence>
        {showRevokeModal && revokeTarget && studentData && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: 16,
            }}
            onClick={() => !revokeLoading && setShowRevokeModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#ffffff",
                borderRadius: 20,
                maxWidth: 480,
                width: "100%",
                padding: 24,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: "#fee2e2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <LogOut size={20} color="#dc2626" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 800, color: "#0f172a" }}>
                      {revokeTarget.isAll ? "Revoke All Device Sessions" : "Revoke Device Session"}
                    </h3>
                    <div style={{ fontSize: 12, color: "#64748b" }}>Main Admin Authorization Required</div>
                  </div>
                </div>
                <button
                  onClick={() => !revokeLoading && setShowRevokeModal(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* State Preview Box */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "14px 16px",
                  marginBottom: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#64748b" }}>Student Reg No:</span>
                  <strong style={{ color: "#0f172a" }}>{studentData.regNo} ({studentData.studentName})</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#64748b" }}>Target Device:</span>
                  <strong style={{ color: "#be123c" }}>
                    {revokeTarget.isAll ? `All Active Devices (${studentData.activeSessions?.length || 0})` : (revokeTarget.session?.platform || "Authorized Device")}
                  </strong>
                </div>
                {!revokeTarget.isAll && revokeTarget.session && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#64748b" }}>IP Address:</span>
                      <strong style={{ color: "#334155" }}>{revokeTarget.session.maskedIp || "Hidden"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#64748b" }}>Logged In:</span>
                      <strong style={{ color: "#334155" }}>{formatISTDate(revokeTarget.session.loggedInAt)}</strong>
                    </div>
                  </>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#991b1b", marginTop: 4, padding: "8px 10px", background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca", lineHeight: 1.4 }}>
                  <AlertTriangle size={14} color="#dc2626" style={{ flexShrink: 0 }} />
                  <span>This will immediately terminate the session token in MongoDB and free up a device slot for new logins.</span>
                </div>
              </div>

              {/* Optional Reason Input */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Administrative Reason (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Ghost session cleanup, device change, student auto-logout troubleshooting..."
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowRevokeModal(false)}
                  disabled={revokeLoading}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRevokeSubmit}
                  disabled={revokeLoading}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: "#be123c",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: revokeLoading ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {revokeLoading ? <RefreshCw size={14} className="spin" /> : <LogOut size={14} />}
                  {revokeTarget.isAll ? "Confirm & Revoke All" : "Confirm & Revoke"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
