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
  RotateCcw,
  Unlock,
  Ban,
  Calendar,
  Filter,
  UserCheck,
  ChevronRight,
  Info,
  Shield,
  Layers,
  ArrowRight,
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
      {/* ── Top Header & KPI Bar ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
          borderRadius: 16,
          padding: isMob ? "16px 14px" : "22px 26px",
          color: "#ffffff",
          boxShadow: "0 10px 25px -5px rgba(49, 46, 129, 0.3)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(239, 68, 68, 0.2)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fca5a5",
                flexShrink: 0,
              }}
            >
              <UserX size={24} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: isMob ? 17 : 20, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em" }}>
                  Student Portal Access & Block Control
                </h2>
                <span
                  style={{
                    background: "rgba(239, 68, 68, 0.25)",
                    border: "1px solid rgba(248, 113, 113, 0.5)",
                    color: "#fecaca",
                    fontSize: 10.5,
                    fontWeight: 800,
                    padding: "2px 7px",
                    borderRadius: 999,
                    textTransform: "uppercase",
                  }}
                >
                  Admin Authority
                </span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: isMob ? 12 : 13, color: "#c7d2fe", maxWidth: 720, lineHeight: 1.45 }}>
                Temporarily (for specified days) or permanently suspend a student’s access to GradeFlow. Blocked students cannot log in or request OTPs (displays "Student not found"), and active sessions are terminated immediately.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              fetchBlockedList();
              if (inspectedStudent?.regNo) handleInspect(inspectedStudent.regNo);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              background: "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#ffffff",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            title="Refresh Block Registry"
          >
            <RefreshCw size={13} className={listLoading ? "spin" : ""} />
            <span>Refresh Registry</span>
          </button>
        </div>

        {/* KPI Counter Pills */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMob ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
            gap: 10,
            marginTop: 18,
          }}
        >
          <div style={{ background: "rgba(255, 255, 255, 0.08)", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255, 255, 255, 0.12)" }}>
            <span style={{ fontSize: 11, color: "#cbd5e1", fontWeight: 600 }}>Total Blocked</span>
            <div style={{ fontSize: 20, fontWeight: 800, color: totalBlocked > 0 ? "#f87171" : "#ffffff", marginTop: 2 }}>{totalBlocked}</div>
          </div>
          <div style={{ background: "rgba(255, 255, 255, 0.08)", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255, 255, 255, 0.12)" }}>
            <span style={{ fontSize: 11, color: "#cbd5e1", fontWeight: 600 }}>Temporary Blocks</span>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#fcd34d", marginTop: 2 }}>{tempBlocked}</div>
          </div>
          <div style={{ background: "rgba(255, 255, 255, 0.08)", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255, 255, 255, 0.12)" }}>
            <span style={{ fontSize: 11, color: "#cbd5e1", fontWeight: 600 }}>Permanent Bans</span>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#ef4444", marginTop: 2 }}>{permBlocked}</div>
          </div>
          <div style={{ background: "rgba(255, 255, 255, 0.08)", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255, 255, 255, 0.12)" }}>
            <span style={{ fontSize: 11, color: "#cbd5e1", fontWeight: 600 }}>Realtime Enforcement</span>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#4ade80", marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
              <span>Active (Ably + DB)</span>
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
            borderRadius: 10,
            padding: "12px 16px",
            color: "#b91c1c",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontWeight: 600 }}>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg("")}
            style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 10,
            padding: "12px 16px",
            color: "#15803d",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <CheckCircle size={18} color="#16a34a" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontWeight: 600 }}>{successMsg}</span>
          <button
            onClick={() => setSuccessMsg("")}
            style={{ background: "none", border: "none", color: "#16a34a", cursor: "pointer", fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── CARD 1: SINGLE STUDENT INSPECTOR & BLOCK MANAGER ── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
          padding: isMob ? "16px" : "22px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Search size={16} color="#4f46e5" />
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
              Inspect & Manage Single Student Access
            </h3>
          </div>
        </div>

        {/* Search Bar Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleInspect(searchReg);
          }}
          style={{
            display: "flex",
            gap: 8,
            flexDirection: isMob ? "column" : "row",
          }}
        >
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              placeholder="Enter Student Registration Number (e.g. 230301120001)..."
              value={searchReg}
              onChange={(e) => setSearchReg(e.target.value.toUpperCase())}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1.5px solid #cbd5e1",
                fontSize: 13,
                fontWeight: 600,
                color: "#1e293b",
                outline: "none",
                boxSizing: "border-box",
                background: "#f8fafc",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={inspectLoading}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: "#4f46e5",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 700,
              cursor: inspectLoading ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
              flexShrink: 0,
            }}
          >
            {inspectLoading ? <RefreshCw size={15} className="spin" /> : <Search size={15} />}
            <span>Inspect Access Status</span>
          </button>
        </form>

        {/* Quick Student Selector Tool */}
        <div
          style={{
            marginTop: 12,
            padding: "10px 12px",
            background: "#f8fafc",
            borderRadius: 10,
            border: "1px dashed #cbd5e1",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", display: "flex", alignItems: "center", gap: 5 }}>
            <Filter size={12} color="#4f46e5" />
            <span>Or Quick Select Registered Student:</span>
          </span>

          <select
            value={inspectedStudent?.regNo || ""}
            onChange={(e) => {
              if (e.target.value) handleInspect(e.target.value);
            }}
            style={{
              flex: 1,
              minWidth: 200,
              padding: "6px 10px",
              borderRadius: 7,
              border: "1px solid #cbd5e1",
              fontSize: 12,
              fontWeight: 600,
              color: "#1e293b",
              background: "#ffffff",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="">
              {accountsLoading
                ? "Loading registered accounts..."
                : `-- Select from ${filteredPickerAccounts.length} students --`}
            </option>
            {filteredPickerAccounts.map((acc) => (
              <option key={acc.regNo} value={acc.regNo}>
                {acc.regNo} — {acc.studentName} {acc.isBlocked ? "(Blocked)" : ""} {acc.isCurrentlyLoggedIn ? "• Online" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Inspected Student Detail Card */}
        {inspectedStudent && (
          <div
            style={{
              marginTop: 18,
              padding: isMob ? "14px" : "18px",
              borderRadius: 12,
              border: inspectedStudent.isBlocked ? "1.5px solid #fca5a5" : "1.5px solid #bbf7d0",
              background: inspectedStudent.isBlocked ? "#fff5f5" : "#f0fdf4",
            }}
          >
            {/* Header: Student Info & Current Block Status Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
                borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
                paddingBottom: 12,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                    {inspectedStudent.studentName}
                  </h4>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 800,
                      fontSize: 13,
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: "#e2e8f0",
                      color: "#1e293b",
                    }}
                  >
                    {inspectedStudent.regNo}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>
                    ({inspectedStudent.branch || "Branch"} {inspectedStudent.section ? `• Sec ${inspectedStudent.section}` : ""}{" "}
                    {inspectedStudent.batch ? `• Batch ${inspectedStudent.batch}` : ""})
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  Registered Password Account:{" "}
                  <strong>{inspectedStudent.hasAccount ? "Yes (Account Active)" : "No (Results Only)"}</strong>
                  {" • "}
                  Active Live Sessions:{" "}
                  <strong style={{ color: inspectedStudent.activeSessionsCount > 0 ? "#16a34a" : "#64748b" }}>
                    {inspectedStudent.activeSessionsCount}
                  </strong>
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
                      padding: "6px 12px",
                      borderRadius: 8,
                      background: inspectedStudent.blockType === "permanent" ? "#dc2626" : "#ea580c",
                      color: "#ffffff",
                      fontSize: 12,
                      fontWeight: 800,
                      boxShadow: "0 2px 6px rgba(220, 38, 38, 0.2)",
                    }}
                  >
                    <Ban size={14} />
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
                      padding: "6px 12px",
                      borderRadius: 8,
                      background: "#16a34a",
                      color: "#ffffff",
                      fontSize: 12,
                      fontWeight: 800,
                      boxShadow: "0 2px 6px rgba(22, 163, 74, 0.2)",
                    }}
                  >
                    <UserCheck size={14} />
                    <span>ACCESS ALLOWED (NORMAL)</span>
                  </div>
                )}
              </div>
            </div>

            {/* If Student is Already Blocked: Display Expiry & Unblock Action */}
            {inspectedStudent.isBlocked ? (
              <div style={{ marginTop: 14 }}>
                <div
                  style={{
                    background: "#ffffff",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "1px solid #fecaca",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    fontSize: 12.5,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#991b1b", fontWeight: 700 }}>
                    <Clock size={14} />
                    <span>
                      Block Duration: {formatExpiration(inspectedStudent.blockedUntil)}
                    </span>
                  </div>
                  <div style={{ color: "#475569" }}>
                    Reason: <strong>{inspectedStudent.blockedReason || "Administrative restriction"}</strong>
                  </div>
                  <div style={{ color: "#64748b", fontSize: 11.5 }}>
                    Blocked By: <strong>{inspectedStudent.blockedBy || "Admin"}</strong> on{" "}
                    {inspectedStudent.blockedAt ? new Date(inspectedStudent.blockedAt).toLocaleString() : "N/A"}
                  </div>
                </div>

                <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
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
                      padding: "9px 18px",
                      borderRadius: 8,
                      border: "none",
                      background: "#16a34a",
                      color: "#ffffff",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)",
                    }}
                  >
                    {actionLoading ? <RefreshCw size={14} className="spin" /> : <Unlock size={14} />}
                    <span>Unblock Student & Restore Access</span>
                  </button>
                </div>
              </div>
            ) : (
              /* If Student is NOT Blocked: Display Block Configuration Form */
              <div style={{ marginTop: 14 }}>
                <h5 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 800, color: "#1e293b" }}>
                  Configure Suspension Parameters:
                </h5>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Block Type Selector */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => setBlockType("temporary")}
                      style={{
                        flex: 1,
                        minWidth: 150,
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: blockType === "temporary" ? "2px solid #ea580c" : "1px solid #cbd5e1",
                        background: blockType === "temporary" ? "#fff7ed" : "#ffffff",
                        color: blockType === "temporary" ? "#c2410c" : "#475569",
                        fontWeight: 700,
                        fontSize: 12.5,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <Clock size={14} />
                      <span>Temporary Block (Days/Hours)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBlockType("permanent")}
                      style={{
                        flex: 1,
                        minWidth: 150,
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: blockType === "permanent" ? "2px solid #dc2626" : "1px solid #cbd5e1",
                        background: blockType === "permanent" ? "#fef2f2" : "#ffffff",
                        color: blockType === "permanent" ? "#b91c1c" : "#475569",
                        fontWeight: 700,
                        fontSize: 12.5,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <Ban size={14} />
                      <span>Permanent Block (Indefinite)</span>
                    </button>
                  </div>

                  {/* Temporary Block Duration Inputs */}
                  {blockType === "temporary" && (
                    <div
                      style={{
                        background: "#ffffff",
                        border: "1px solid #fed7aa",
                        borderRadius: 10,
                        padding: "12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#9a3412" }}>
                          Choose Duration:
                        </span>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
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
                                padding: "3px 8px",
                                borderRadius: 6,
                                border: durationDays === d && !useCustomDate ? "1.5px solid #ea580c" : "1px solid #cbd5e1",
                                background: durationDays === d && !useCustomDate ? "#ffedd5" : "#ffffff",
                                color: durationDays === d && !useCustomDate ? "#c2410c" : "#475569",
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              {d} {d === 1 ? "Day" : "Days"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Manual days & hours or custom date picker */}
                      <div style={{ display: "grid", gridTemplateColumns: isMob ? "1fr" : "1fr 1fr", gap: 10 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Duration in Days</label>
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
                              padding: "7px 10px",
                              borderRadius: 7,
                              border: "1px solid #cbd5e1",
                              fontSize: 12,
                              fontWeight: 600,
                              boxSizing: "border-box",
                              marginTop: 3,
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Or Custom Expiration Date & Time</label>
                          <input
                            type="datetime-local"
                            value={customUntilDate}
                            onChange={(e) => {
                              setCustomUntilDate(e.target.value);
                              setUseCustomDate(true);
                            }}
                            style={{
                              width: "100%",
                              padding: "6px 10px",
                              borderRadius: 7,
                              border: useCustomDate ? "1.5px solid #ea580c" : "1px solid #cbd5e1",
                              fontSize: 12,
                              fontWeight: 600,
                              boxSizing: "border-box",
                              marginTop: 3,
                              background: useCustomDate ? "#fff7ed" : "#ffffff",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Suspension Reason Input */}
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: "#475569" }}>
                      Suspension Reason (Recorded in Security Audit Log):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Disciplinary action, document verification pending, exam malpractice..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: 12.5,
                        fontWeight: 500,
                        color: "#1e293b",
                        boxSizing: "border-box",
                        marginTop: 4,
                      }}
                    />
                  </div>

                  {/* Submit Block Button */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
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
                          title: `Block Access for ${inspectedStudent.regNo}?`,
                          message: `Are you sure you want to ${durationText} suspend student ${inspectedStudent.studentName} (${inspectedStudent.regNo})? All active sessions (${inspectedStudent.activeSessionsCount}) will be terminated immediately. The student will not be able to log in or view grades.`,
                          onConfirm: handleBlockStudent,
                        });
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 22px",
                        borderRadius: 8,
                        border: "none",
                        background: "#dc2626",
                        color: "#ffffff",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: actionLoading ? "not-allowed" : "pointer",
                        boxShadow: "0 2px 8px rgba(220, 38, 38, 0.25)",
                      }}
                    >
                      {actionLoading ? <RefreshCw size={14} className="spin" /> : <Ban size={14} />}
                      <span>Suspend Student Access Now</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CARD 2: DIRECTORY OF CURRENTLY BLOCKED STUDENTS ── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
          padding: isMob ? "16px" : "22px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldAlert size={16} color="#dc2626" />
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
                Currently Blocked Students Registry
              </h3>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
              Live directory of all student accounts whose portal privileges are currently restricted.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* Filter Pills */}
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
                  borderRadius: 7,
                  border: filterType === f.id ? "1.5px solid #dc2626" : "1px solid #cbd5e1",
                  background: filterType === f.id ? "#fef2f2" : "#ffffff",
                  color: filterType === f.id ? "#dc2626" : "#64748b",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {f.label}
              </button>
            ))}

            {/* Table Search Input */}
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Search reg / name..."
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
                style={{
                  padding: "5px 10px 5px 28px",
                  borderRadius: 7,
                  border: "1px solid #cbd5e1",
                  fontSize: 12,
                  outline: "none",
                  width: isMob ? 140 : 180,
                }}
              />
              <Search size={12} color="#94a3b8" style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)" }} />
            </div>
          </div>
        </div>

        {/* Blocked Students Table */}
        {listLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
            <RefreshCw size={24} className="spin" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: 13, fontWeight: 600 }}>Loading blocked students registry...</div>
          </div>
        ) : filteredBlockedList.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              background: "#f8fafc",
              borderRadius: 12,
              border: "1px dashed #cbd5e1",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "#f0fdf4",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <UserCheck size={24} />
            </div>
            <h4 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
              {searchTable ? "No Matching Blocked Students" : "No Students Currently Blocked"}
            </h4>
            <p style={{ margin: 0, fontSize: 12.5, color: "#64748b" }}>
              {searchTable
                ? "Try adjusting your search query or filter selection."
                : "All students have unrestricted access to check semester results and log in."}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", fontWeight: 700, color: "#475569" }}>Student</th>
                  <th style={{ padding: "10px 12px", fontWeight: 700, color: "#475569" }}>Branch & Batch</th>
                  <th style={{ padding: "10px 12px", fontWeight: 700, color: "#475569" }}>Block Type</th>
                  <th style={{ padding: "10px 12px", fontWeight: 700, color: "#475569" }}>Remaining Duration</th>
                  <th style={{ padding: "10px 12px", fontWeight: 700, color: "#475569" }}>Reason</th>
                  <th style={{ padding: "10px 12px", fontWeight: 700, color: "#475569" }}>Blocked By</th>
                  <th style={{ padding: "10px 12px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBlockedList.map((item) => (
                  <tr
                    key={item.regNo}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background 0.15s",
                    }}
                  >
                    {/* Student */}
                    <td style={{ padding: "12px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.studentName}</div>
                      <div style={{ fontFamily: "monospace", fontSize: 11.5, color: "#475569", fontWeight: 600 }}>
                        {item.regNo}
                      </div>
                    </td>

                    {/* Branch & Batch */}
                    <td style={{ padding: "12px", color: "#475569" }}>
                      <div>{item.branch || "CSE"} {item.section ? `• Sec ${item.section}` : ""}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{item.batch ? `Batch ${item.batch}` : "N/A"}</div>
                    </td>

                    {/* Block Type */}
                    <td style={{ padding: "12px" }}>
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
                    </td>

                    {/* Duration */}
                    <td style={{ padding: "12px", color: "#334155", fontWeight: 600, fontSize: 12 }}>
                      {formatExpiration(item.blockedUntil)}
                    </td>

                    {/* Reason */}
                    <td style={{ padding: "12px", color: "#475569", maxWidth: 220 }}>
                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.blockedReason}>
                        {item.blockedReason || "Administrative restriction"}
                      </div>
                    </td>

                    {/* Blocked By */}
                    <td style={{ padding: "12px", color: "#64748b", fontSize: 11.5 }}>
                      <div>{item.blockedBy || "Admin"}</div>
                      <div style={{ fontSize: 10.5, color: "#94a3b8" }}>
                        {item.blockedAt ? new Date(item.blockedAt).toLocaleDateString() : ""}
                      </div>
                    </td>

                    {/* Action */}
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => handleInspect(item.regNo)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            color: "#4338ca",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
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
                            padding: "4px 10px",
                            borderRadius: 6,
                            border: "1px solid #bbf7d0",
                            background: "#f0fdf4",
                            color: "#15803d",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: actionLoading ? "not-allowed" : "pointer",
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

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              maxWidth: 460,
              width: "100%",
              padding: "22px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#fee2e2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1e293b" }}>
                {confirmModal.title}
              </h3>
            </div>

            <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
              {confirmModal.message}
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: null })}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontSize: 12.5,
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
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "none",
                  background: "#dc2626",
                  color: "#ffffff",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {actionLoading && <RefreshCw size={12} className="spin" />}
                <span>Confirm Action</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
