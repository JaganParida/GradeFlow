import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  UserX,
  ShieldAlert,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Unlock,
  Ban,
  Calendar,
  Filter,
  UserCheck,
  Shield,
  Layers,
  Sparkles,
  Smartphone,
  Laptop,
  X,
  ChevronDown,
  Info,
  CalendarClock,
  Lock,
  Radio,
} from "lucide-react";

export default function StudentAccessControl({ API, authHeaders, isMobile }) {
  const isMob = typeof isMobile === "boolean" ? isMobile : window.innerWidth < 768;

  // Search & Inspection State
  const [searchReg, setSearchReg] = useState("");
  const [inspectedStudent, setInspectedStudent] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Block Form State
  const [blockType, setBlockType] = useState("temporary"); // 'temporary' | 'permanent'
  const [durationDays, setDurationDays] = useState(3);
  const [durationHours, setDurationHours] = useState(0);
  const [customUntilDate, setCustomUntilDate] = useState("");
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [reason, setReason] = useState("");

  // Directory of Blocked Students
  const [blockedList, setBlockedList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [filterType, setFilterType] = useState("all"); // 'all' | 'temporary' | 'permanent'
  const [searchTable, setSearchTable] = useState("");

  // Quick picker from student accounts
  const [allAccounts, setAllAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedSection, setSelectedSection] = useState("all");

  // Feedback Messages
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  // Fetch blocked list
  const fetchBlockedList = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await axios.get(`${API}/admin/student-access-control/list`, {
        headers: authHeaders,
        withCredentials: true,
      });
      if (res.data?.success) {
        setBlockedList(res.data.blockedStudents || []);
      }
    } catch (err) {
      console.error("Failed to load blocked students list:", err);
    } finally {
      setListLoading(false);
    }
  }, [API, authHeaders]);

  // Fetch student accounts for quick picker
  const fetchAccounts = useCallback(async () => {
    setAccountsLoading(true);
    try {
      const res = await axios.get(`${API}/admin/student-accounts?limit=300`, {
        headers: authHeaders,
        withCredentials: true,
      });
      if (res.data?.success && Array.isArray(res.data.accounts)) {
        setAllAccounts(res.data.accounts);
      }
    } catch (_) {
    } finally {
      setAccountsLoading(false);
    }
  }, [API, authHeaders]);

  useEffect(() => {
    fetchBlockedList();
    fetchAccounts();
  }, [fetchBlockedList, fetchAccounts]);

  // Inspect student by registration number
  const handleInspect = async (reg) => {
    const clean = String(reg || searchReg).trim().toUpperCase();
    if (!clean) {
      setErrorMsg("Please enter a student registration number to inspect.");
      return;
    }

    setInspectLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await axios.get(
        `${API}/admin/student-access-control/inspect/${encodeURIComponent(clean)}`,
        { headers: authHeaders, withCredentials: true }
      );
      if (res.data?.success) {
        setInspectedStudent(res.data);
        setSearchReg(clean);
        // Pre-fill reason if already blocked
        if (res.data.isBlocked) {
          setReason(res.data.blockedReason || "");
        } else {
          setReason("");
        }
      } else {
        setErrorMsg(res.data?.message || "Student not found in university records.");
        setInspectedStudent(null);
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || `Student registration ${clean} not found in university records.`
      );
      setInspectedStudent(null);
    } finally {
      setInspectLoading(false);
    }
  };

  // Block student
  const handleBlockStudent = async () => {
    if (!inspectedStudent?.regNo) return;
    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = {
        regNo: inspectedStudent.regNo,
        blockType,
        reason: reason.trim() || "Portal access suspended by administration",
      };

      if (blockType === "temporary") {
        if (useCustomDate && customUntilDate) {
          payload.customUntilDate = customUntilDate;
        } else {
          payload.durationDays = Number(durationDays) || 0;
          payload.durationHours = Number(durationHours) || 0;
        }
      }

      const res = await axios.post(`${API}/admin/student-access-control/block`, payload, {
        headers: authHeaders,
        withCredentials: true,
      });

      if (res.data?.success) {
        setSuccessMsg(res.data.message || `Student ${inspectedStudent.regNo} has been blocked.`);
        // Re-inspect to refresh status
        await handleInspect(inspectedStudent.regNo);
        // Refresh directory
        fetchBlockedList();
      } else {
        setErrorMsg(res.data?.message || "Failed to block student.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Error blocking student access.");
    } finally {
      setActionLoading(false);
      setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: null });
    }
  };

  // Unblock student
  const handleUnblockStudent = async (regNo) => {
    const clean = String(regNo || inspectedStudent?.regNo || "").trim().toUpperCase();
    if (!clean) return;

    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await axios.post(
        `${API}/admin/student-access-control/unblock/${encodeURIComponent(clean)}`,
        {},
        { headers: authHeaders, withCredentials: true }
      );

      if (res.data?.success) {
        setSuccessMsg(res.data.message || `Student ${clean} unblocked successfully.`);
        if (inspectedStudent?.regNo === clean) {
          await handleInspect(clean);
        }
        fetchBlockedList();
      } else {
        setErrorMsg(res.data?.message || "Failed to unblock student.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Error unblocking student access.");
    } finally {
      setActionLoading(false);
      setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: null });
    }
  };

  // Format countdown or expiration date
  const formatExpiration = (blockedUntil) => {
    if (!blockedUntil) return "Permanent / Indefinite";
    const target = new Date(blockedUntil);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    if (diffMs <= 0) return "Expired (Pending Auto-Refresh)";

    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const mins = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));

    let timeStr = "";
    if (days > 0) timeStr += `${days}d `;
    if (hours > 0 || days > 0) timeStr += `${hours}h `;
    timeStr += `${mins}m left`;

    return `${timeStr} (${target.toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })})`;
  };

  // Quick preset reason tags
  const PRESET_REASONS = [
    "Academic Misconduct",
    "Attendance Shortage Hold",
    "Fee Clearance Pending",
    "Examination Malpractice",
    "Security Policy Violation",
  ];

  // Filtered blocked list for table
  const filteredBlockedList = useMemo(() => {
    return blockedList.filter((item) => {
      if (filterType === "temporary" && item.blockType !== "temporary") return false;
      if (filterType === "permanent" && item.blockType !== "permanent") return false;
      if (searchTable) {
        const q = searchTable.toLowerCase();
        const matchReg = item.regNo.toLowerCase().includes(q);
        const matchName = (item.studentName || "").toLowerCase().includes(q);
        const matchReason = (item.blockedReason || "").toLowerCase().includes(q);
        if (!matchReg && !matchName && !matchReason) return false;
      }
      return true;
    });
  }, [blockedList, filterType, searchTable]);

  // Quick picker filtered students
  const filteredPickerAccounts = useMemo(() => {
    return allAccounts.filter((acc) => {
      const reg = acc.regNo || "";
      let batch = acc.batch;
      if (!batch || batch === "N/A") {
        const prefix = reg.slice(0, 2);
        batch = /^\d{2}$/.test(prefix) ? `20${prefix}` : "2023";
      }
      let branch = acc.branch;
      if (!branch) {
        const code = reg.slice(6, 8);
        branch = code === "01" ? "CSE" : code === "02" ? "CSIT" : code === "03" ? "CST" : "CSE";
      }
      let section = acc.section;
      if (!section) {
        const rollNum = parseInt(reg.slice(-3), 10);
        section = !isNaN(rollNum) && rollNum > 65 ? "B" : "A";
      }

      if (selectedBatch !== "all" && String(batch) !== selectedBatch) return false;
      if (selectedBranch !== "all" && branch !== selectedBranch) return false;
      if (selectedSection !== "all" && section !== selectedSection) return false;
      return true;
    });
  }, [allAccounts, selectedBatch, selectedBranch, selectedSection]);

  const totalBlocked = blockedList.length;
  const tempBlocked = blockedList.filter((b) => b.blockType === "temporary").length;
  const permBlocked = blockedList.filter((b) => b.blockType === "permanent").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── 1. CLEAN EXECUTIVE HERO HEADER ── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 20,
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
          padding: isMob ? "18px 16px" : "24px 28px",
          display: "flex",
          flexDirection: isMob ? "column" : "row",
          alignItems: isMob ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div
            style={{
              width: isMob ? 42 : 48,
              height: isMob ? 42 : 48,
              borderRadius: 14,
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 6px 16px -2px rgba(79, 70, 229, 0.35)",
              flexShrink: 0,
            }}
          >
            <UserX size={isMob ? 22 : 25} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: isMob ? 18 : 22,
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-0.02em",
                }}
              >
                Student Access Control
              </h2>
              <span
                style={{
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: 999,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Main Admin Exclusive
              </span>
            </div>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: isMob ? 12 : 13,
                color: "#64748b",
                maxWidth: 720,
                lineHeight: 1.5,
              }}
            >
              Temporarily or permanently restrict student portal privileges. Blocked students cannot log in or request OTPs (displays "Student not found"), and active sessions are terminated immediately.
            </p>
          </div>
        </div>

        {/* Right Action & Live Status Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: isMob ? "100%" : "auto",
            justifyContent: isMob ? "space-between" : "flex-end",
            borderTop: isMob ? "1px solid #f1f5f9" : "none",
            paddingTop: isMob ? 12 : 0,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 10,
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#15803d",
              fontSize: 11.5,
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#16a34a",
                display: "inline-block",
                boxShadow: "0 0 0 2px rgba(22, 163, 74, 0.2)",
              }}
            />
            <span>Live Realtime Shield</span>
          </div>

          <button
            onClick={() => {
              fetchBlockedList();
              if (inspectedStudent?.regNo) handleInspect(inspectedStudent.regNo);
            }}
            disabled={listLoading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 10,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              color: "#334155",
              fontSize: 12,
              fontWeight: 700,
              cursor: listLoading ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
            title="Refresh Block Registry"
          >
            <RefreshCw size={13} className={listLoading ? "spin" : ""} color="#4f46e5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── 2. TOP ELEVATED KPI METRICS GRID ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMob ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: 12,
        }}
      >
        {/* Metric 1: Total Blocked */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            padding: "16px 18px",
            boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.04)",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: totalBlocked > 0 ? "#fee2e2" : "#f1f5f9",
              color: totalBlocked > 0 ? "#dc2626" : "#64748b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <UserX size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Total Blocked
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: totalBlocked > 0 ? "#dc2626" : "#0f172a", marginTop: 1 }}>
              {totalBlocked}
            </div>
          </div>
        </div>

        {/* Metric 2: Temporary Blocks */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            padding: "16px 18px",
            boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.04)",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#fff7ed",
              color: "#ea580c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Temporary
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#ea580c", marginTop: 1 }}>
              {tempBlocked}
            </div>
          </div>
        </div>

        {/* Metric 3: Permanent Bans */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            padding: "16px 18px",
            boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.04)",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#fef2f2",
              color: "#b91c1c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Ban size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Permanent
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#b91c1c", marginTop: 1 }}>
              {permBlocked}
            </div>
          </div>
        </div>

        {/* Metric 4: Auto-Expiration */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            padding: "16px 18px",
            boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.04)",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#ecfdf5",
              color: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Auto-Expiring
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#059669", marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}>
              <span>Zero-Cron DB Guard</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {errorMsg && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 12,
            padding: "12px 16px",
            color: "#b91c1c",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 2px 6px rgba(220, 38, 38, 0.05)",
          }}
        >
          <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontWeight: 600 }}>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg("")}
            style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontWeight: 800, padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 12,
            padding: "12px 16px",
            color: "#15803d",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 2px 6px rgba(22, 163, 74, 0.05)",
          }}
        >
          <CheckCircle size={18} color="#16a34a" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontWeight: 600 }}>{successMsg}</span>
          <button
            onClick={() => setSuccessMsg("")}
            style={{ background: "none", border: "none", color: "#16a34a", cursor: "pointer", fontWeight: 800, padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── 3. CARD 1: SINGLE STUDENT INSPECTOR & ACTION PANEL ── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 20,
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
          padding: isMob ? "18px 16px" : "24px 26px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: "#eef2ff",
                color: "#4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Search size={16} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                Inspect & Manage Student
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                Verify portal access status, view live active sessions, and execute temporary or permanent suspensions.
              </p>
            </div>
          </div>
        </div>

        {/* Search Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleInspect(searchReg);
          }}
          style={{
            display: "flex",
            gap: 10,
            flexDirection: isMob ? "column" : "row",
            marginTop: 12,
          }}
        >
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={16}
              color="#94a3b8"
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder="Enter Student Reg No (e.g. 230301120001)..."
              value={searchReg}
              onChange={(e) => setSearchReg(e.target.value.toUpperCase())}
              style={{
                width: "100%",
                padding: "12px 14px 12px 42px",
                borderRadius: 12,
                border: "1.5px solid #cbd5e1",
                fontSize: 13.5,
                fontWeight: 600,
                color: "#0f172a",
                outline: "none",
                boxSizing: "border-box",
                background: "#f8fafc",
                transition: "all 0.15s ease",
              }}
            />
            {searchReg && (
              <button
                type="button"
                onClick={() => setSearchReg("")}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={inspectLoading}
            style={{
              padding: "12px 24px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
              color: "#ffffff",
              fontSize: 13.5,
              fontWeight: 700,
              cursor: inspectLoading ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 14px rgba(79, 70, 229, 0.28)",
              flexShrink: 0,
              transition: "transform 0.1s ease",
            }}
          >
            {inspectLoading ? <RefreshCw size={15} className="spin" /> : <Search size={15} />}
            <span>Inspect Access Status</span>
          </button>
        </form>

        {/* Quick Student Selector Tool */}
        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            background: "#f8fafc",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "flex", alignItems: "center", gap: 5 }}>
            <Filter size={13} color="#4f46e5" />
            <span>Quick Select from Directory:</span>
          </span>

          {/* Branch Pill Filter */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {["all", "CSE", "CSIT", "CST"].map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setSelectedBranch(b)}
                style={{
                  padding: "3px 8px",
                  borderRadius: 6,
                  border: selectedBranch === b ? "1px solid #4f46e5" : "1px solid #cbd5e1",
                  background: selectedBranch === b ? "#eef2ff" : "#ffffff",
                  color: selectedBranch === b ? "#4f46e5" : "#64748b",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {b.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Section Pill Filter */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {["all", "A", "B"].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setSelectedSection(sec)}
                style={{
                  padding: "3px 8px",
                  borderRadius: 6,
                  border: selectedSection === sec ? "1px solid #4f46e5" : "1px solid #cbd5e1",
                  background: selectedSection === sec ? "#eef2ff" : "#ffffff",
                  color: selectedSection === sec ? "#4f46e5" : "#64748b",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {sec === "all" ? "All Sec" : `Sec ${sec}`}
              </button>
            ))}
          </div>

          {/* Student Dropdown */}
          <div style={{ flex: 1, minWidth: isMob ? "100%" : 240 }}>
            <select
              value={inspectedStudent?.regNo || ""}
              onChange={(e) => {
                if (e.target.value) handleInspect(e.target.value);
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1.5px solid #cbd5e1",
                fontSize: 12,
                fontWeight: 600,
                color: "#0f172a",
                background: "#ffffff",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="">
                {accountsLoading
                  ? "Loading registered accounts..."
                  : `-- Choose from ${filteredPickerAccounts.length} students --`}
              </option>
              {filteredPickerAccounts.map((acc) => (
                <option key={acc.regNo} value={acc.regNo}>
                  {acc.regNo} — {acc.studentName} {acc.isBlocked ? "⛔ BLOCKED" : ""} {acc.isCurrentlyLoggedIn ? "• Online" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── INSPECTED STUDENT IDENTITY & ACTION CARD ── */}
        {inspectedStudent && (
          <div
            style={{
              marginTop: 20,
              borderRadius: 16,
              border: inspectedStudent.isBlocked ? "1.5px solid #fca5a5" : "1.5px solid #bbf7d0",
              background: inspectedStudent.isBlocked ? "#fff5f5" : "#f0fdf4",
              boxShadow: inspectedStudent.isBlocked
                ? "0 4px 16px rgba(239, 68, 68, 0.08)"
                : "0 4px 16px rgba(22, 163, 74, 0.08)",
              overflow: "hidden",
            }}
          >
            {/* Header: Student Profile Information */}
            <div
              style={{
                padding: isMob ? "16px" : "20px 22px",
                background: inspectedStudent.isBlocked ? "#fffafa" : "#ffffff",
                borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
                display: "flex",
                flexDirection: isMob ? "column" : "row",
                alignItems: isMob ? "flex-start" : "center",
                justifyContent: "space-between",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {/* Initials Avatar */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: inspectedStudent.isBlocked
                      ? "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)"
                      : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 800,
                    boxShadow: inspectedStudent.isBlocked
                      ? "0 4px 12px rgba(220, 38, 38, 0.25)"
                      : "0 4px 12px rgba(16, 185, 129, 0.25)",
                    flexShrink: 0,
                  }}
                >
                  {(inspectedStudent.studentName || "S").charAt(0).toUpperCase()}
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <h4 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                      {inspectedStudent.studentName}
                    </h4>
                    <span
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontWeight: 800,
                        fontSize: 12.5,
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: "#e2e8f0",
                        color: "#1e293b",
                      }}
                    >
                      {inspectedStudent.regNo}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11.5, color: "#64748b", background: "#f1f5f9", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>
                      {inspectedStudent.branch || "Branch"} {inspectedStudent.section ? `• Sec ${inspectedStudent.section}` : ""}{" "}
                      {inspectedStudent.batch ? `• Batch ${inspectedStudent.batch}` : ""}
                    </span>

                    <span style={{ fontSize: 11.5, color: inspectedStudent.hasAccount ? "#059669" : "#64748b", fontWeight: 700 }}>
                      {inspectedStudent.hasAccount ? "• Password Account Registered" : "• Results Only (Unregistered)"}
                    </span>

                    {/* Active Live Device Badge */}
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "1px 7px",
                        borderRadius: 999,
                        background: inspectedStudent.activeSessionsCount > 0 ? "#dcfce7" : "#f1f5f9",
                        color: inspectedStudent.activeSessionsCount > 0 ? "#15803d" : "#64748b",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: inspectedStudent.activeSessionsCount > 0 ? "#16a34a" : "#94a3b8",
                        }}
                      />
                      <span>
                        {inspectedStudent.activeSessionsCount > 0
                          ? `${inspectedStudent.activeSessionsCount} Live Session${inspectedStudent.activeSessionsCount > 1 ? "s" : ""}`
                          : "0 Active Sessions"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {inspectedStudent.isBlocked ? (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 14px",
                      borderRadius: 10,
                      background: inspectedStudent.blockType === "permanent" ? "#dc2626" : "#ea580c",
                      color: "#ffffff",
                      fontSize: 12.5,
                      fontWeight: 800,
                      boxShadow: "0 2px 8px rgba(220, 38, 38, 0.25)",
                    }}
                  >
                    <Ban size={15} />
                    <span>
                      {inspectedStudent.blockType === "permanent"
                        ? "PERMANENTLY BLOCKED"
                        : "TEMPORARILY BLOCKED"}
                    </span>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 14px",
                      borderRadius: 10,
                      background: "#16a34a",
                      color: "#ffffff",
                      fontSize: 12.5,
                      fontWeight: 800,
                      boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)",
                    }}
                  >
                    <UserCheck size={15} />
                    <span>ACCESS ACTIVE (ALLOWED)</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Sub-Panel A: When Student IS ALREADY BLOCKED ── */}
            {inspectedStudent.isBlocked ? (
              <div style={{ padding: isMob ? "16px" : "20px 22px" }}>
                <div
                  style={{
                    background: "#ffffff",
                    padding: "16px",
                    borderRadius: 14,
                    border: "1px solid #fecaca",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#991b1b", fontWeight: 700 }}>
                    <Clock size={16} />
                    <span>
                      Suspension Period: {formatExpiration(inspectedStudent.blockedUntil)}
                    </span>
                  </div>
                  <div style={{ color: "#334155" }}>
                    Reason: <strong>{inspectedStudent.blockedReason || "Administrative restriction"}</strong>
                  </div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>
                    Enforced By: <strong>{inspectedStudent.blockedBy || "Admin"}</strong> on{" "}
                    {inspectedStudent.blockedAt ? new Date(inspectedStudent.blockedAt).toLocaleString() : "N/A"}
                  </div>
                </div>

                <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        title: `Unblock Student ${inspectedStudent.regNo}?`,
                        message: `This will immediately restore full portal access for ${inspectedStudent.studentName} (${inspectedStudent.regNo}). The student will be able to log in and view results again.`,
                        onConfirm: () => handleUnblockStudent(inspectedStudent.regNo),
                      });
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "11px 22px",
                      borderRadius: 10,
                      border: "none",
                      background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                      color: "#ffffff",
                      fontSize: 13.5,
                      fontWeight: 700,
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      boxShadow: "0 4px 12px rgba(22, 163, 74, 0.25)",
                      width: isMob ? "100%" : "auto",
                      justifyContent: "center",
                    }}
                  >
                    {actionLoading ? <RefreshCw size={15} className="spin" /> : <Unlock size={15} />}
                    <span>Unblock Student & Restore Access</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ── Sub-Panel B: When Student IS ACTIVE (Configuration Form) ── */
              <div style={{ padding: isMob ? "16px" : "20px 22px" }}>
                <h5 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                  Configure Suspension Parameters:
                </h5>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Segmented Block Type Switch */}
                  <div style={{ display: "grid", gridTemplateColumns: isMob ? "1fr" : "1fr 1fr", gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setBlockType("temporary")}
                      style={{
                        padding: "12px 16px",
                        borderRadius: 12,
                        border: blockType === "temporary" ? "2px solid #ea580c" : "1.5px solid #e2e8f0",
                        background: blockType === "temporary" ? "#fff7ed" : "#ffffff",
                        color: blockType === "temporary" ? "#c2410c" : "#475569",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <Clock size={16} color={blockType === "temporary" ? "#ea580c" : "#94a3b8"} />
                      <div style={{ textAlign: "left" }}>
                        <div>Temporary Block</div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: "#9a3412" }}>
                          Auto-expires after specified days/hours
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBlockType("permanent")}
                      style={{
                        padding: "12px 16px",
                        borderRadius: 12,
                        border: blockType === "permanent" ? "2px solid #dc2626" : "1.5px solid #e2e8f0",
                        background: blockType === "permanent" ? "#fef2f2" : "#ffffff",
                        color: blockType === "permanent" ? "#b91c1c" : "#475569",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <Ban size={16} color={blockType === "permanent" ? "#dc2626" : "#94a3b8"} />
                      <div style={{ textAlign: "left" }}>
                        <div>Permanent Ban</div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: "#991b1b" }}>
                          Indefinite suspension until manual unblock
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Temporary Block Duration Configuration */}
                  {blockType === "temporary" && (
                    <div
                      style={{
                        background: "#ffffff",
                        border: "1.5px solid #fed7aa",
                        borderRadius: 14,
                        padding: "14px 16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: "#9a3412", display: "flex", alignItems: "center", gap: 6 }}>
                          <CalendarClock size={15} />
                          <span>Quick Duration Presets:</span>
                        </span>

                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {[1, 2, 3, 7, 15, 30].map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => {
                                setDurationDays(d);
                                setDurationHours(0);
                                setUseCustomDate(false);
                              }}
                              style={{
                                padding: "4px 10px",
                                borderRadius: 8,
                                border: durationDays === d && !useCustomDate ? "1.5px solid #ea580c" : "1px solid #cbd5e1",
                                background: durationDays === d && !useCustomDate ? "#ffedd5" : "#ffffff",
                                color: durationDays === d && !useCustomDate ? "#c2410c" : "#475569",
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: "pointer",
                                transition: "all 0.1s ease",
                              }}
                            >
                              {d} {d === 1 ? "Day" : "Days"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Manual days & custom date input */}
                      <div style={{ display: "grid", gridTemplateColumns: isMob ? "1fr" : "1fr 1fr", gap: 12 }}>
                        <div>
                          <label style={{ fontSize: 11.5, fontWeight: 700, color: "#475569" }}>Duration in Days</label>
                          <input
                            type="number"
                            min="0"
                            max="365"
                            value={durationDays}
                            onChange={(e) => {
                              setDurationDays(Math.max(0, parseInt(e.target.value, 10) || 0));
                              setUseCustomDate(false);
                            }}
                            style={{
                              width: "100%",
                              padding: "9px 12px",
                              borderRadius: 8,
                              border: "1.5px solid #cbd5e1",
                              fontSize: 13,
                              fontWeight: 600,
                              boxSizing: "border-box",
                              marginTop: 4,
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 11.5, fontWeight: 700, color: "#475569" }}>Or Custom Expiration Date & Time</label>
                          <input
                            type="datetime-local"
                            value={customUntilDate}
                            onChange={(e) => {
                              setCustomUntilDate(e.target.value);
                              setUseCustomDate(true);
                            }}
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              borderRadius: 8,
                              border: useCustomDate ? "1.5px solid #ea580c" : "1.5px solid #cbd5e1",
                              fontSize: 12.5,
                              fontWeight: 600,
                              boxSizing: "border-box",
                              marginTop: 4,
                              background: useCustomDate ? "#fff7ed" : "#ffffff",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Suspension Reason Input with 1-Click Preset Tags */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                      Suspension Reason (Logged to Security Audit Trail):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Disciplinary action, exam malpractice, fee hold..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1.5px solid #cbd5e1",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#0f172a",
                        boxSizing: "border-box",
                        marginTop: 5,
                      }}
                    />

                    {/* Quick Preset Reason Tags */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", alignSelf: "center" }}>
                        Quick Suggestions:
                      </span>
                      {PRESET_REASONS.map((pr) => (
                        <button
                          key={pr}
                          type="button"
                          onClick={() => setReason(pr)}
                          style={{
                            padding: "3px 8px",
                            borderRadius: 6,
                            border: "1px solid #e2e8f0",
                            background: "#ffffff",
                            color: "#475569",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.1s ease",
                          }}
                        >
                          + {pr}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => {
                        const durationText =
                          blockType === "permanent"
                            ? "permanently"
                            : useCustomDate && customUntilDate
                            ? `temporarily until ${new Date(customUntilDate).toLocaleString()}`
                            : `temporarily for ${durationDays} days`;

                        setConfirmModal({
                          isOpen: true,
                          title: `Suspend Portal Access for ${inspectedStudent.regNo}?`,
                          message: `Are you sure you want to ${durationText} suspend student ${inspectedStudent.studentName} (${inspectedStudent.regNo})? All active sessions (${inspectedStudent.activeSessionsCount}) will be terminated immediately. The student will not be able to log in or view grades (displays "Student not found").`,
                          onConfirm: handleBlockStudent,
                        });
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "12px 24px",
                        borderRadius: 12,
                        border: "none",
                        background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                        color: "#ffffff",
                        fontSize: 13.5,
                        fontWeight: 700,
                        cursor: actionLoading ? "not-allowed" : "pointer",
                        boxShadow: "0 4px 14px rgba(220, 38, 38, 0.28)",
                        width: isMob ? "100%" : "auto",
                        justifyContent: "center",
                      }}
                    >
                      {actionLoading ? <RefreshCw size={15} className="spin" /> : <Ban size={15} />}
                      <span>Suspend Student Access Now</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 4. CARD 2: DIRECTORY OF CURRENTLY BLOCKED STUDENTS ── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 20,
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
          padding: isMob ? "18px 16px" : "24px 26px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: isMob ? "flex-start" : "center",
            justifyContent: "space-between",
            flexDirection: isMob ? "column" : "row",
            gap: 14,
            marginBottom: 18,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: "#fee2e2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShieldAlert size={16} />
              </div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                Currently Blocked Students Registry
              </h3>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
              Live directory of accounts whose portal privileges are currently suspended.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              width: isMob ? "100%" : "auto",
            }}
          >
            {/* Filter Pills */}
            <div
              style={{
                display: "inline-flex",
                background: "#f1f5f9",
                borderRadius: 10,
                padding: 3,
                gap: 2,
              }}
            >
              {[
                { id: "all", label: `All (${totalBlocked})` },
                { id: "temporary", label: `Temporary (${tempBlocked})` },
                { id: "permanent", label: `Permanent (${permBlocked})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 8,
                    border: "none",
                    background: filterType === f.id ? "#ffffff" : "transparent",
                    color: filterType === f.id ? "#dc2626" : "#64748b",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: filterType === f.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Table Search Input */}
            <div style={{ position: "relative", flex: isMob ? 1 : "none" }}>
              <Search
                size={13}
                color="#94a3b8"
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type="text"
                placeholder="Search reg / name..."
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
                style={{
                  padding: "7px 10px 7px 30px",
                  borderRadius: 10,
                  border: "1.5px solid #cbd5e1",
                  fontSize: 12,
                  outline: "none",
                  width: isMob ? "100%" : 180,
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Blocked Registry Content ── */}
        {listLoading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>
            <RefreshCw size={26} className="spin" style={{ margin: "0 auto 10px", color: "#4f46e5" }} />
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>Synchronizing blocked registry...</div>
          </div>
        ) : filteredBlockedList.length === 0 ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              background: "#f8fafc",
              borderRadius: 16,
              border: "1px dashed #cbd5e1",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "#dcfce7",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
                boxShadow: "0 4px 12px rgba(22, 163, 74, 0.15)",
              }}
            >
              <UserCheck size={26} />
            </div>
            <h4 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
              {searchTable ? "No Matching Blocked Students" : "No Students Currently Blocked"}
            </h4>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
              {searchTable
                ? "Try adjusting your search query or filter selection."
                : "All students have unrestricted access to check semester results and log in."}
            </p>
          </div>
        ) : isMob ? (
          /* ── MOBILE VIEW: RESPONSIVE CARDS ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredBlockedList.map((item) => (
              <div
                key={item.regNo}
                style={{
                  background: "#ffffff",
                  borderRadius: 14,
                  border: "1px solid #e2e8f0",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 14.5 }}>
                      {item.studentName}
                    </div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#4f46e5", fontWeight: 700 }}>
                      {item.regNo}
                    </div>
                  </div>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 800,
                      background: item.blockType === "permanent" ? "#fef2f2" : "#fff7ed",
                      color: item.blockType === "permanent" ? "#b91c1c" : "#c2410c",
                      border: item.blockType === "permanent" ? "1px solid #fca5a5" : "1px solid #fed7aa",
                    }}
                  >
                    {item.blockType === "permanent" ? <Ban size={11} /> : <Clock size={11} />}
                    <span>{item.blockType === "permanent" ? "Permanent" : "Temporary"}</span>
                  </span>
                </div>

                <div style={{ fontSize: 12, color: "#475569", background: "#f8fafc", padding: "8px 10px", borderRadius: 8 }}>
                  <div style={{ fontWeight: 700, color: "#9a3412" }}>
                    Remaining: {formatExpiration(item.blockedUntil)}
                  </div>
                  <div style={{ marginTop: 2 }}>
                    Reason: <strong>{item.blockedReason || "Administrative restriction"}</strong>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => handleInspect(item.regNo)}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#4f46e5",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Inspect
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        title: `Unblock ${item.regNo}?`,
                        message: `Are you sure you want to lift the block on ${item.studentName} (${item.regNo})? Portal access will be immediately restored.`,
                        onConfirm: () => handleUnblockStudent(item.regNo),
                      });
                    }}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: 8,
                      border: "1px solid #bbf7d0",
                      background: "#f0fdf4",
                      color: "#15803d",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: actionLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    Unblock
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── DESKTOP VIEW: CLEAN TABULAR DIRECTORY ── */
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", textAlign: "left" }}>
                  <th style={{ padding: "12px 14px", fontWeight: 700, color: "#475569" }}>Student</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700, color: "#475569" }}>Branch & Batch</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700, color: "#475569" }}>Block Type</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700, color: "#475569" }}>Remaining Duration</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700, color: "#475569" }}>Reason</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700, color: "#475569" }}>Blocked By</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBlockedList.map((item) => (
                  <tr
                    key={item.regNo}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background 0.15s ease",
                    }}
                  >
                    {/* Student Identity */}
                    <td style={{ padding: "14px" }}>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>{item.studentName}</div>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11.5, color: "#4f46e5", fontWeight: 700 }}>
                        {item.regNo}
                      </div>
                    </td>

                    {/* Academic Branch & Batch */}
                    <td style={{ padding: "14px", color: "#475569" }}>
                      <div style={{ fontWeight: 600 }}>{item.branch || "CSE"} {item.section ? `• Sec ${item.section}` : ""}</div>
                      <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{item.batch ? `Batch ${item.batch}` : "N/A"}</div>
                    </td>

                    {/* Block Type Badge */}
                    <td style={{ padding: "14px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "3px 9px",
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: 800,
                          background: item.blockType === "permanent" ? "#fef2f2" : "#fff7ed",
                          color: item.blockType === "permanent" ? "#b91c1c" : "#c2410c",
                          border: item.blockType === "permanent" ? "1px solid #fca5a5" : "1px solid #fed7aa",
                        }}
                      >
                        {item.blockType === "permanent" ? <Ban size={12} /> : <Clock size={12} />}
                        <span>{item.blockType === "permanent" ? "Permanent" : "Temporary"}</span>
                      </span>
                    </td>

                    {/* Remaining Time */}
                    <td style={{ padding: "14px", color: "#0f172a", fontWeight: 600, fontSize: 12.5 }}>
                      {formatExpiration(item.blockedUntil)}
                    </td>

                    {/* Reason */}
                    <td style={{ padding: "14px", color: "#475569", maxWidth: 220 }}>
                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.blockedReason}>
                        {item.blockedReason || "Administrative restriction"}
                      </div>
                    </td>

                    {/* Blocked By */}
                    <td style={{ padding: "14px", color: "#64748b", fontSize: 12 }}>
                      <div style={{ fontWeight: 600 }}>{item.blockedBy || "Admin"}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {item.blockedAt ? new Date(item.blockedAt).toLocaleDateString() : ""}
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td style={{ padding: "14px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => handleInspect(item.regNo)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            color: "#4f46e5",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          title="Inspect Student"
                        >
                          Inspect
                        </button>

                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: `Unblock ${item.regNo}?`,
                              message: `Are you sure you want to lift the block on ${item.studentName} (${item.regNo})? Portal access will be immediately restored.`,
                              onConfirm: () => handleUnblockStudent(item.regNo),
                            });
                          }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "1px solid #bbf7d0",
                            background: "#f0fdf4",
                            color: "#15803d",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: actionLoading ? "not-allowed" : "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          Unblock
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 5. CONFIRMATION MODAL ── */}
      {confirmModal.isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 20,
              maxWidth: 480,
              width: "100%",
              padding: "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: "#fee2e2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                  {confirmModal.title}
                </h3>
                <span style={{ fontSize: 12, color: "#64748b" }}>Admin Security Confirmation</span>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: 13.5, color: "#475569", lineHeight: 1.55 }}>
              {confirmModal.message}
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: null })}
                style={{
                  padding: "9px 18px",
                  borderRadius: 10,
                  border: "1.5px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={confirmModal.onConfirm}
                style={{
                  padding: "9px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)",
                }}
              >
                {actionLoading && <RefreshCw size={13} className="spin" />}
                <span>Confirm Action</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
