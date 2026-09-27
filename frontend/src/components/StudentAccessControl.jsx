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

function getSectionFromRegNo(regNo) {
  if (!regNo) return "A";
  const str = String(regNo).trim();
  const num = parseInt(str.slice(-3), 10);
  if (!isNaN(num)) {
    if (num >= 1 && num <= 65) return "A";
    if (num >= 66 && num <= 125) return "B";
    if (num >= 126 && num <= 180) return "C";
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

function resolveStudentMeta(acc) {
  if (!acc) return { branch: "CSE", section: "A", batch: "2023" };
  const branch = (acc.branch && acc.branch !== "N/A") ? acc.branch : getDynamicBranch(acc.regNo);
  const section = (acc.section && acc.section !== "N/A")
    ? String(acc.section).replace(/^Sec\s*/i, "").trim().toUpperCase()
    : getSectionFromRegNo(acc.regNo);
  let batch = (acc.batch && acc.batch !== "N/A") ? String(acc.batch).trim() : "";
  if (!batch && acc.regNo && /^\d{2}/.test(String(acc.regNo).trim())) {
    batch = `20${String(acc.regNo).trim().slice(0, 2)}`;
  }
  return {
    branch: branch || "CSE",
    section: section || "A",
    batch: batch || "2023",
  };
}

export default function StudentAccessControl({ API, authHeaders, isMobile }) {
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

  const isMob = isMobileScreen;

  // Search & Inspection State
  const [searchReg, setSearchReg] = useState("");
  const [inspectedStudent, setInspectedStudent] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Block Form State
  const [blockType, setBlockType] = useState("temporary"); // 'temporary' | 'permanent'
  const [tempMode, setTempMode] = useState("preset"); // 'preset' | 'custom'
  const [durationDays, setDurationDays] = useState(0);
  const [durationHours, setDurationHours] = useState(2);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [customUntilDate, setCustomUntilDate] = useState("");
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
        if (tempMode === "custom") {
          if (!customUntilDate) {
            setErrorMsg("Please select an expiration date and time.");
            setActionLoading(false);
            return;
          }
          const target = new Date(customUntilDate);
          if (isNaN(target.getTime()) || target <= new Date()) {
            setErrorMsg("Custom expiration date must be a valid future date and time.");
            setActionLoading(false);
            return;
          }
          // Convert to ISO string so timezone is preserved accurately on Vercel/Node runtime
          payload.customUntilDate = target.toISOString();
        } else {
          const days = Number(durationDays) || 0;
          const hours = Number(durationHours) || 0;
          const mins = Number(durationMinutes) || 0;
          const totalMs = (days * 24 * 60 + hours * 60 + mins) * 60 * 1000;
          if (totalMs <= 0) {
            setErrorMsg("Temporary block duration must be at least 1 minute.");
            setActionLoading(false);
            return;
          }
          payload.durationDays = days;
          payload.durationHours = hours;
          payload.durationMinutes = mins;
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

  // In-memory 1-second reactive ticker for real-time countdowns without network calls
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format countdown or expiration date down to the exact second
  const formatExpiration = (blockedUntil) => {
    if (!blockedUntil) return "Permanent / Indefinite";
    const target = new Date(blockedUntil);
    const diffMs = target.getTime() - nowTick;
    if (diffMs <= 0) return "Auto-Unlocked Just Now";

    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const mins = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
    const secs = Math.floor((diffMs % (60 * 1000)) / 1000);

    let timeStr = "";
    if (days > 0) timeStr += `${days}d `;
    if (hours > 0) timeStr += `${hours}h `;
    if (days === 0 && hours === 0) {
      if (mins > 0) {
        timeStr += `${mins}m ${secs}s left`;
      } else {
        timeStr += `${secs}s left`;
      }
    } else {
      timeStr += `${mins}m left`;
    }

    const now = new Date(nowTick);
    const isToday = target.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = target.toDateString() === tomorrow.toDateString();

    const time12h = target.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
    const dateLabel = isToday ? "Today" : isTomorrow ? "Tomorrow" : target.toLocaleDateString("en-IN", { month: "short", day: "numeric" });

    return `${timeStr} (${dateLabel}, ${time12h})`;
  };

  // Convert JS Date to input datetime-local value (YYYY-MM-DDTHH:mm) in local browser time
  const toLocalDatetimeValue = (date) => {
    const d = new Date(date);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Live computed unlock preview for the admin UI
  const getComputedUnlockPreview = () => {
    if (blockType !== "temporary") {
      return { text: "Indefinite / Permanent (Until manually unblocked by admin)", isNear: false, target: null };
    }
    const now = new Date(nowTick);
    let target = null;
    if (tempMode === "custom") {
      if (!customUntilDate) return { text: "Select a date & time above", isNear: false, target: null };
      target = new Date(customUntilDate);
    } else {
      const totalMinutes = (Number(durationDays) || 0) * 1440 + (Number(durationHours) || 0) * 60 + (Number(durationMinutes) || 0);
      if (totalMinutes <= 0) return { text: "Duration must be at least 1 minute", isNear: false, target: null };
      target = new Date(now.getTime() + totalMinutes * 60 * 1000);
    }

    if (!target || isNaN(target.getTime())) return { text: "Invalid date format", isNear: false, target: null };
    const diffMs = target.getTime() - now.getTime();
    if (diffMs <= 0) return { text: "Selected time is in the past! Please choose a future time.", isNear: false, isError: true, target: null };

    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const mins = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
    const secs = Math.floor((diffMs % (60 * 1000)) / 1000);

    let relativeStr = "";
    if (days > 0) relativeStr += `${days}d `;
    if (hours > 0) relativeStr += `${hours}h `;
    if (days === 0 && hours === 0) {
      if (mins > 0) {
        relativeStr += `${mins}m ${secs}s`;
      } else {
        relativeStr += `${secs}s`;
      }
    } else {
      relativeStr += `${mins}m`;
    }

    const isToday = target.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = target.toDateString() === tomorrow.toDateString();

    const time12h = target.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
    const dateLabel = isToday ? "Today" : isTomorrow ? "Tomorrow" : target.toLocaleDateString("en-IN", { month: "short", day: "numeric" });

    return {
      text: `${dateLabel}, ${time12h} (in ~${relativeStr})`,
      target,
      isNear: diffMs < 3600000,
      isToday,
    };
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

  // Available batches derived from student accounts + defaults
  const availableBatches = useMemo(() => {
    const set = new Set(["2023", "2024", "2022"]);
    allAccounts.forEach((acc) => {
      const meta = resolveStudentMeta(acc);
      if (meta.batch && meta.batch !== "N/A") set.add(meta.batch);
    });
    return Array.from(set).sort();
  }, [allAccounts]);

  // Available branches derived from student accounts + standard university branches
  const availableBranches = useMemo(() => {
    const set = new Set(["CSE", "CSIT", "CST", "ECE", "EEE", "ME", "CIVIL", "AERO"]);
    allAccounts.forEach((acc) => {
      const meta = resolveStudentMeta(acc);
      if (meta.branch) set.add(meta.branch.toUpperCase());
    });
    return Array.from(set).sort();
  }, [allAccounts]);

  // Available sections derived from student accounts + standard sections
  const availableSections = useMemo(() => {
    const set = new Set(["A", "B", "C", "D", "E", "F", "G", "H", "I"]);
    allAccounts.forEach((acc) => {
      const meta = resolveStudentMeta(acc);
      if (meta.section) set.add(meta.section.toUpperCase());
    });
    return Array.from(set).sort();
  }, [allAccounts]);

  // Quick picker filtered students
  const filteredPickerAccounts = useMemo(() => {
    return allAccounts.filter((acc) => {
      const meta = resolveStudentMeta(acc);
      if (selectedBatch !== "all") {
        const normBatch = String(selectedBatch).trim();
        const accBatch = String(meta.batch || "").trim();
        const matchBatch = accBatch.includes(normBatch) || (acc.regNo && acc.regNo.startsWith(normBatch.slice(-2)));
        if (!matchBatch) return false;
      }
      if (selectedBranch !== "all" && meta.branch.toUpperCase() !== selectedBranch.toUpperCase()) return false;
      if (selectedSection !== "all" && meta.section.toUpperCase() !== selectedSection.toUpperCase()) return false;
      return true;
    });
  }, [allAccounts, selectedBatch, selectedBranch, selectedSection]);

  const totalBlocked = blockedList.length;
  const tempBlocked = blockedList.filter((b) => b.blockType === "temporary").length;
  const permBlocked = blockedList.filter((b) => b.blockType === "permanent").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMob ? 14 : 20, width: "100%", boxSizing: "border-box" }}>
      {/* ── 1. COMPACT STATUS RIBBON ON MOBILE vs FULL HERO ON DESKTOP ── */}
      {isMob ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.04)",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 4px 10px -1px rgba(79, 70, 229, 0.3)",
                flexShrink: 0,
              }}
            >
              <UserX size={17} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>
                  Access Shield
                </span>
                <span
                  style={{
                    background: "#fee2e2",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    fontSize: 9.5,
                    fontWeight: 800,
                    padding: "1px 6px",
                    borderRadius: 999,
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                  }}
                >
                  Admin
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 8px",
                borderRadius: 8,
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#15803d",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#16a34a",
                  display: "inline-block",
                  boxShadow: "0 0 0 2px rgba(22, 163, 74, 0.2)",
                }}
              />
              <span>Live Active</span>
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
                gap: 4,
                padding: "5px 10px",
                borderRadius: 8,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                color: "#334155",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: listLoading ? "not-allowed" : "pointer",
              }}
              title="Refresh Block Registry"
            >
              <RefreshCw size={12} className={listLoading ? "spin" : ""} color="#4f46e5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      ) : (
        /* Full Executive Hero on Desktop */
        <div
          style={{
            background: "#ffffff",
            borderRadius: 20,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
            padding: "24px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
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
              <UserX size={25} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 22,
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
                  fontSize: 13,
                  color: "#64748b",
                  maxWidth: 720,
                  lineHeight: 1.5,
                }}
              >
                Temporarily or permanently restrict student portal privileges. Blocked students cannot log in or request OTPs (displays "Student not found"), and active sessions are terminated immediately.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
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
      )}

      {/* ── 2. TOP ELEVATED KPI METRICS GRID ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMob ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: isMob ? 8 : 12,
        }}
      >
        {/* Metric 1: Total Blocked */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: isMob ? 13 : 16,
            border: "1px solid #e2e8f0",
            padding: isMob ? "10px 12px" : "16px 18px",
            boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.04)",
            display: "flex",
            alignItems: "center",
            gap: isMob ? 10 : 14,
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: isMob ? 32 : 44,
              height: isMob ? 32 : 44,
              borderRadius: isMob ? 9 : 12,
              background: totalBlocked > 0 ? "#fee2e2" : "#f1f5f9",
              color: totalBlocked > 0 ? "#dc2626" : "#64748b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <UserX size={isMob ? 16 : 22} />
          </div>
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <div
              style={{
                fontSize: isMob ? 10 : 11.5,
                color: "#64748b",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Total Blocked
            </div>
            <div
              style={{
                fontSize: isMob ? 20 : 24,
                fontWeight: 900,
                color: totalBlocked > 0 ? "#dc2626" : "#0f172a",
                marginTop: 1,
                lineHeight: 1.1,
              }}
            >
              {totalBlocked}
            </div>
          </div>
        </div>

        {/* Metric 2: Temporary Blocks */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: isMob ? 13 : 16,
            border: "1px solid #e2e8f0",
            padding: isMob ? "10px 12px" : "16px 18px",
            boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.04)",
            display: "flex",
            alignItems: "center",
            gap: isMob ? 10 : 14,
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: isMob ? 32 : 44,
              height: isMob ? 32 : 44,
              borderRadius: isMob ? 9 : 12,
              background: "#fff7ed",
              color: "#ea580c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Clock size={isMob ? 16 : 22} />
          </div>
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <div
              style={{
                fontSize: isMob ? 10 : 11.5,
                color: "#64748b",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Temporary
            </div>
            <div
              style={{
                fontSize: isMob ? 20 : 24,
                fontWeight: 900,
                color: "#ea580c",
                marginTop: 1,
                lineHeight: 1.1,
              }}
            >
              {tempBlocked}
            </div>
          </div>
        </div>

        {/* Metric 3: Permanent Bans */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: isMob ? 13 : 16,
            border: "1px solid #e2e8f0",
            padding: isMob ? "10px 12px" : "16px 18px",
            boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.04)",
            display: "flex",
            alignItems: "center",
            gap: isMob ? 10 : 14,
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: isMob ? 32 : 44,
              height: isMob ? 32 : 44,
              borderRadius: isMob ? 9 : 12,
              background: "#fef2f2",
              color: "#b91c1c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Ban size={isMob ? 16 : 22} />
          </div>
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <div
              style={{
                fontSize: isMob ? 10 : 11.5,
                color: "#64748b",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Permanent
            </div>
            <div
              style={{
                fontSize: isMob ? 20 : 24,
                fontWeight: 900,
                color: "#b91c1c",
                marginTop: 1,
                lineHeight: 1.1,
              }}
            >
              {permBlocked}
            </div>
          </div>
        </div>

        {/* Metric 4: Auto-Expiring / Realtime Shield */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: isMob ? 13 : 16,
            border: "1px solid #e2e8f0",
            padding: isMob ? "10px 12px" : "16px 18px",
            boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.04)",
            display: "flex",
            alignItems: "center",
            gap: isMob ? 10 : 14,
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: isMob ? 32 : 44,
              height: isMob ? 32 : 44,
              borderRadius: isMob ? 9 : 12,
              background: "#ecfdf5",
              color: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Shield size={isMob ? 16 : 22} />
          </div>
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <div
              style={{
                fontSize: isMob ? 10 : 11.5,
                color: "#64748b",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Auto Expire
            </div>
            <div
              style={{
                fontSize: isMob ? 12 : 13,
                fontWeight: 800,
                color: "#059669",
                marginTop: isMob ? 3 : 4,
                display: "flex",
                alignItems: "center",
                gap: 4,
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#10b981",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span>{isMob ? "Active" : "Zero-Cron DB Guard"}</span>
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
            padding: "10px 14px",
            color: "#b91c1c",
            fontSize: 12.5,
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 2px 6px rgba(220, 38, 38, 0.05)",
          }}
        >
          <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontWeight: 600 }}>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg("")}
            style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontWeight: 800, padding: 4 }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 12,
            padding: "10px 14px",
            color: "#15803d",
            fontSize: 12.5,
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 2px 6px rgba(22, 163, 74, 0.05)",
          }}
        >
          <CheckCircle size={16} color="#16a34a" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontWeight: 600 }}>{successMsg}</span>
          <button
            onClick={() => setSuccessMsg("")}
            style={{ background: "none", border: "none", color: "#16a34a", cursor: "pointer", fontWeight: 800, padding: 4 }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── 3. CARD 1: SINGLE STUDENT INSPECTOR & ACTION PANEL ── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: isMob ? 16 : 20,
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
          padding: isMob ? "16px 14px" : "24px 26px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMob ? 10 : 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div
              style={{
                width: isMob ? 28 : 32,
                height: isMob ? 28 : 32,
                borderRadius: 8,
                background: "#eef2ff",
                color: "#4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Search size={isMob ? 14 : 16} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: isMob ? 15 : 16, fontWeight: 800, color: "#0f172a" }}>
                Inspect & Manage Student
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: isMob ? 11.5 : 12, color: "#64748b" }}>
                {isMob
                  ? "Check status & configure suspensions."
                  : "Verify portal access status, view live active sessions, and execute temporary or permanent suspensions."}
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
            gap: 8,
            flexDirection: isMob ? "column" : "row",
            marginTop: 10,
          }}
        >
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={16}
              color="#94a3b8"
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder="Enter Student Reg No (e.g. 230301120001)..."
              value={searchReg}
              onChange={(e) => setSearchReg(e.target.value.toUpperCase())}
              style={{
                width: "100%",
                padding: "10px 36px 10px 38px",
                borderRadius: 10,
                border: "1.5px solid #cbd5e1",
                fontSize: 14, // 14px prevents iOS Safari auto-zoom
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
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: 4,
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
              padding: isMob ? "11px 18px" : "12px 24px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 700,
              cursor: inspectLoading ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 14px rgba(79, 70, 229, 0.28)",
              flexShrink: 0,
              width: isMob ? "100%" : "auto",
            }}
          >
            {inspectLoading ? <RefreshCw size={14} className="spin" /> : <Search size={14} />}
            <span>Inspect Access Status</span>
          </button>
        </form>

        {/* Quick Student Selector Tool with Dedicated Dropdowns */}
        <div
          style={{
            marginTop: 12,
            padding: isMob ? "12px 10px" : "14px 16px",
            background: "#f8fafc",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
            <span style={{ fontSize: isMob ? 11.5 : 12.5, fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: 6 }}>
              <Filter size={13} color="#4f46e5" />
              <span>{isMob ? "Filter Students:" : "Filter Directory by Branch, Section & Batch:"}</span>
            </span>

            {(selectedBatch !== "all" || selectedBranch !== "all" || selectedSection !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSelectedBatch("all");
                  setSelectedBranch("all");
                  setSelectedSection("all");
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  fontSize: 10.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <X size={11} />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMob ? "1fr 1fr" : "repeat(3, 140px) 1fr",
              gap: 8,
              alignItems: "flex-end",
            }}
          >
            {/* 1. Branch Dropdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Branch
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                style={{
                  width: "100%",
                  height: 36,
                  padding: "6px 8px",
                  borderRadius: 8,
                  border: selectedBranch !== "all" ? "1.5px solid #4f46e5" : "1.5px solid #cbd5e1",
                  background: selectedBranch !== "all" ? "#f5f3ff" : "#ffffff",
                  color: selectedBranch !== "all" ? "#4338ca" : "#0f172a",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >
                <option value="all">All Branches</option>
                {availableBranches.map((br) => (
                  <option key={br} value={br}>{br}</option>
                ))}
              </select>
            </div>

            {/* 2. Section Dropdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Section
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                style={{
                  width: "100%",
                  height: 36,
                  padding: "6px 8px",
                  borderRadius: 8,
                  border: selectedSection !== "all" ? "1.5px solid #4f46e5" : "1.5px solid #cbd5e1",
                  background: selectedSection !== "all" ? "#f5f3ff" : "#ffffff",
                  color: selectedSection !== "all" ? "#4338ca" : "#0f172a",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >
                <option value="all">All Sections</option>
                {availableSections.map((sec) => (
                  <option key={sec} value={sec}>Section {sec}</option>
                ))}
              </select>
            </div>

            {/* 3. Batch Dropdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3, gridColumn: isMob ? "span 2" : "auto" }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Batch
              </label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                style={{
                  width: "100%",
                  height: 36,
                  padding: "6px 8px",
                  borderRadius: 8,
                  border: selectedBatch !== "all" ? "1.5px solid #4f46e5" : "1.5px solid #cbd5e1",
                  background: selectedBatch !== "all" ? "#f5f3ff" : "#ffffff",
                  color: selectedBatch !== "all" ? "#4338ca" : "#0f172a",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >
                <option value="all">All Batches</option>
                {availableBatches.map((bt) => (
                  <option key={bt} value={bt}>Batch {bt}</option>
                ))}
              </select>
            </div>

            {/* 4. Student Chooser Dropdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3, gridColumn: isMob ? "span 2" : "auto" }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Choose Student ({filteredPickerAccounts.length})
              </label>
              <select
                value={inspectedStudent?.regNo || ""}
                onChange={(e) => {
                  if (e.target.value) handleInspect(e.target.value);
                }}
                style={{
                  width: "100%",
                  height: 36,
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1.5px solid #cbd5e1",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#0f172a",
                  background: "#ffffff",
                  cursor: "pointer",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >
                <option value="">
                  {accountsLoading
                    ? "Loading registered accounts..."
                    : `-- Choose from ${filteredPickerAccounts.length} students --`}
                </option>
                {filteredPickerAccounts.map((acc) => {
                  const meta = resolveStudentMeta(acc);
                  return (
                    <option key={acc.regNo} value={acc.regNo}>
                      {acc.regNo} — {acc.studentName} ({meta.branch} • Sec {meta.section}) {acc.isBlocked ? "[SUSPENDED]" : ""} {acc.isCurrentlyLoggedIn ? "• Online" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* ── INSPECTED STUDENT IDENTITY & ACTION CARD ── */}
        {inspectedStudent && (
          <div
            style={{
              marginTop: 14,
              borderRadius: isMob ? 14 : 16,
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
                padding: isMob ? "14px 12px" : "20px 22px",
                background: inspectedStudent.isBlocked ? "#fffafa" : "#ffffff",
                borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
                display: "flex",
                flexDirection: isMob ? "column" : "row",
                alignItems: isMob ? "stretch" : "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                {/* Initials Avatar */}
                <div
                  style={{
                    width: isMob ? 40 : 48,
                    height: isMob ? 40 : 48,
                    borderRadius: isMob ? 11 : 14,
                    background: inspectedStudent.isBlocked
                      ? "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)"
                      : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: isMob ? 16 : 18,
                    fontWeight: 800,
                    boxShadow: inspectedStudent.isBlocked
                      ? "0 4px 12px rgba(220, 38, 38, 0.25)"
                      : "0 4px 12px rgba(16, 185, 129, 0.25)",
                    flexShrink: 0,
                  }}
                >
                  {(inspectedStudent.studentName || "S").charAt(0).toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <h4 style={{ margin: 0, fontSize: isMob ? 15 : 17, fontWeight: 800, color: "#0f172a" }}>
                      {inspectedStudent.studentName}
                    </h4>
                    <span
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontWeight: 800,
                        fontSize: 11.5,
                        padding: "1px 6px",
                        borderRadius: 5,
                        background: "#e2e8f0",
                        color: "#1e293b",
                      }}
                    >
                      {inspectedStudent.regNo}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: "#64748b", background: "#f1f5f9", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>
                      {inspectedStudent.branch || "Branch"} {inspectedStudent.section ? `• Sec ${inspectedStudent.section}` : ""}{" "}
                      {inspectedStudent.batch ? `• Batch ${inspectedStudent.batch}` : ""}
                    </span>

                    <span style={{ fontSize: 11, color: inspectedStudent.hasAccount ? "#059669" : "#64748b", fontWeight: 700 }}>
                      {inspectedStudent.hasAccount ? "• Registered Account" : "• Unregistered"}
                    </span>

                    {/* Active Live Device Badge */}
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "1px 6px",
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
                          width: 5,
                          height: 5,
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
              <div style={{ width: isMob ? "100%" : "auto" }}>
                {inspectedStudent.isBlocked ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: isMob ? "7px 12px" : "8px 14px",
                      borderRadius: 9,
                      background: inspectedStudent.blockType === "permanent" ? "#dc2626" : "#ea580c",
                      color: "#ffffff",
                      fontSize: 12,
                      fontWeight: 800,
                      boxShadow: "0 2px 8px rgba(220, 38, 38, 0.25)",
                      width: isMob ? "100%" : "auto",
                      boxSizing: "border-box",
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
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: isMob ? "7px 12px" : "8px 14px",
                      borderRadius: 9,
                      background: "#16a34a",
                      color: "#ffffff",
                      fontSize: 12,
                      fontWeight: 800,
                      boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)",
                      width: isMob ? "100%" : "auto",
                      boxSizing: "border-box",
                    }}
                  >
                    <UserCheck size={14} />
                    <span>ACCESS ACTIVE (ALLOWED)</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Sub-Panel A: When Student IS ALREADY BLOCKED ── */}
            {inspectedStudent.isBlocked ? (
              <div style={{ padding: isMob ? "14px 12px" : "20px 22px" }}>
                <div
                  style={{
                    background: "#ffffff",
                    padding: "14px",
                    borderRadius: 12,
                    border: "1px solid #fecaca",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    fontSize: 12.5,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#991b1b", fontWeight: 700 }}>
                    <Clock size={15} />
                    <span>
                      Suspension Period: {formatExpiration(inspectedStudent.blockedUntil)}
                    </span>
                  </div>
                  <div style={{ color: "#334155" }}>
                    Reason: <strong>{inspectedStudent.blockedReason || "Administrative restriction"}</strong>
                  </div>
                  <div style={{ color: "#64748b", fontSize: 11.5 }}>
                    Enforced By: <strong>{inspectedStudent.blockedBy || "Admin"}</strong> on{" "}
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
                      padding: isMob ? "11px 16px" : "11px 22px",
                      borderRadius: 10,
                      border: "none",
                      background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                      color: "#ffffff",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      boxShadow: "0 4px 12px rgba(22, 163, 74, 0.25)",
                      width: isMob ? "100%" : "auto",
                      justifyContent: "center",
                    }}
                  >
                    {actionLoading ? <RefreshCw size={14} className="spin" /> : <Unlock size={14} />}
                    <span>Unblock Student & Restore Access</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ── Sub-Panel B: When Student IS ACTIVE (Configuration Form) ── */
              <div style={{ padding: isMob ? "14px 12px" : "20px 22px" }}>
                <h5 style={{ margin: "0 0 10px", fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>
                  Configure Suspension Parameters:
                </h5>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Segmented Block Type Switch */}
                  <div style={{ display: "grid", gridTemplateColumns: isMob ? "1fr 1fr" : "1fr 1fr", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setBlockType("temporary")}
                      style={{
                        padding: isMob ? "10px 8px" : "12px 16px",
                        borderRadius: 10,
                        border: blockType === "temporary" ? "2px solid #ea580c" : "1.5px solid #e2e8f0",
                        background: blockType === "temporary" ? "#fff7ed" : "#ffffff",
                        color: blockType === "temporary" ? "#c2410c" : "#475569",
                        fontWeight: 700,
                        fontSize: isMob ? 12 : 13,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <Clock size={16} color={blockType === "temporary" ? "#ea580c" : "#94a3b8"} style={{ flexShrink: 0 }} />
                      <div style={{ textAlign: "left" }}>
                        <div>Temporary Block</div>
                        {!isMob && (
                          <div style={{ fontSize: 11, fontWeight: 500, color: "#9a3412" }}>
                            Auto-expires after specified days
                          </div>
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBlockType("permanent")}
                      style={{
                        padding: isMob ? "10px 8px" : "12px 16px",
                        borderRadius: 10,
                        border: blockType === "permanent" ? "2px solid #dc2626" : "1.5px solid #e2e8f0",
                        background: blockType === "permanent" ? "#fef2f2" : "#ffffff",
                        color: blockType === "permanent" ? "#b91c1c" : "#475569",
                        fontWeight: 700,
                        fontSize: isMob ? 12 : 13,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <Ban size={16} color={blockType === "permanent" ? "#dc2626" : "#94a3b8"} style={{ flexShrink: 0 }} />
                      <div style={{ textAlign: "left" }}>
                        <div>Permanent Ban</div>
                        {!isMob && (
                          <div style={{ fontSize: 11, fontWeight: 500, color: "#991b1b" }}>
                            Suspension until manual unblock
                          </div>
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Temporary Block Duration Configuration */}
                  {blockType === "temporary" && (
                    <div
                      style={{
                        background: "#ffffff",
                        border: "1.5px solid #fed7aa",
                        borderRadius: 12,
                        padding: isMob ? "12px 10px" : "14px 16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      {/* Mode Toggle: Quick Presets vs Specific Date & Time */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 6,
                          background: "#f8fafc",
                          padding: 4,
                          borderRadius: 9,
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setTempMode("preset")}
                          style={{
                            padding: "7px 10px",
                            borderRadius: 7,
                            border: "none",
                            background: tempMode === "preset" ? "#ffffff" : "transparent",
                            color: tempMode === "preset" ? "#c2410c" : "#64748b",
                            fontWeight: 800,
                            fontSize: isMob ? 11.5 : 12,
                            cursor: "pointer",
                            boxShadow: tempMode === "preset" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 5,
                            transition: "all 0.15s ease",
                          }}
                        >
                          <Clock size={13} />
                          <span>Quick Duration</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setTempMode("custom");
                            if (!customUntilDate) {
                              setCustomUntilDate(toLocalDatetimeValue(new Date(Date.now() + 60 * 60000)));
                            }
                          }}
                          style={{
                            padding: "7px 10px",
                            borderRadius: 7,
                            border: "none",
                            background: tempMode === "custom" ? "#ffffff" : "transparent",
                            color: tempMode === "custom" ? "#c2410c" : "#64748b",
                            fontWeight: 800,
                            fontSize: isMob ? 11.5 : 12,
                            cursor: "pointer",
                            boxShadow: tempMode === "custom" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 5,
                            transition: "all 0.15s ease",
                          }}
                        >
                          <Calendar size={13} />
                          <span>Specific Date & Time</span>
                        </button>
                      </div>

                      {/* MODE 1: Quick Preset Duration */}
                      {tempMode === "preset" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <div>
                            <span style={{ fontSize: 11, fontWeight: 800, color: "#9a3412", display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                              <CalendarClock size={13} />
                              <span>Select Quick Duration Preset:</span>
                            </span>

                            {/* Short Time Presets (Today / Same-day) */}
                            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 }}>
                              {[
                                { label: "15m", d: 0, h: 0, m: 15 },
                                { label: "30m", d: 0, h: 0, m: 30 },
                                { label: "1h", d: 0, h: 1, m: 0 },
                                { label: "2h", d: 0, h: 2, m: 0 },
                                { label: "4h", d: 0, h: 4, m: 0 },
                                { label: "12h", d: 0, h: 12, m: 0 },
                              ].map((p) => {
                                const isSelected = durationDays === p.d && durationHours === p.h && durationMinutes === p.m;
                                return (
                                  <button
                                    key={p.label}
                                    type="button"
                                    onClick={() => {
                                      setDurationDays(p.d);
                                      setDurationHours(p.h);
                                      setDurationMinutes(p.m);
                                    }}
                                    style={{
                                      padding: "4px 9px",
                                      borderRadius: 6,
                                      border: isSelected ? "1.5px solid #ea580c" : "1px solid #cbd5e1",
                                      background: isSelected ? "#ffedd5" : "#ffffff",
                                      color: isSelected ? "#c2410c" : "#475569",
                                      fontSize: 11,
                                      fontWeight: 800,
                                      cursor: "pointer",
                                      transition: "all 0.1s ease",
                                    }}
                                  >
                                    {p.label}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Multi-Day Presets */}
                            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                              {[
                                { label: "1 Day", d: 1, h: 0, m: 0 },
                                { label: "2 Days", d: 2, h: 0, m: 0 },
                                { label: "3 Days", d: 3, h: 0, m: 0 },
                                { label: "7 Days", d: 7, h: 0, m: 0 },
                                { label: "15 Days", d: 15, h: 0, m: 0 },
                                { label: "30 Days", d: 30, h: 0, m: 0 },
                              ].map((p) => {
                                const isSelected = durationDays === p.d && durationHours === p.h && durationMinutes === p.m;
                                return (
                                  <button
                                    key={p.label}
                                    type="button"
                                    onClick={() => {
                                      setDurationDays(p.d);
                                      setDurationHours(p.h);
                                      setDurationMinutes(p.m);
                                    }}
                                    style={{
                                      padding: "4px 9px",
                                      borderRadius: 6,
                                      border: isSelected ? "1.5px solid #ea580c" : "1px solid #cbd5e1",
                                      background: isSelected ? "#ffedd5" : "#ffffff",
                                      color: isSelected ? "#c2410c" : "#475569",
                                      fontSize: 11,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      transition: "all 0.1s ease",
                                    }}
                                  >
                                    {p.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Fine-tune duration inputs */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 4 }}>
                            <div>
                              <label style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Days</label>
                              <input
                                type="number"
                                min="0"
                                max="365"
                                value={durationDays}
                                onChange={(e) => setDurationDays(Math.max(0, parseInt(e.target.value, 10) || 0))}
                                style={{
                                  width: "100%",
                                  padding: "7px 8px",
                                  borderRadius: 8,
                                  border: "1.5px solid #cbd5e1",
                                  fontSize: 13,
                                  fontWeight: 700,
                                  boxSizing: "border-box",
                                  marginTop: 3,
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Hours</label>
                              <input
                                type="number"
                                min="0"
                                max="23"
                                value={durationHours}
                                onChange={(e) => setDurationHours(Math.max(0, parseInt(e.target.value, 10) || 0))}
                                style={{
                                  width: "100%",
                                  padding: "7px 8px",
                                  borderRadius: 8,
                                  border: "1.5px solid #cbd5e1",
                                  fontSize: 13,
                                  fontWeight: 700,
                                  boxSizing: "border-box",
                                  marginTop: 3,
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Minutes</label>
                              <input
                                type="number"
                                min="0"
                                max="59"
                                value={durationMinutes}
                                onChange={(e) => setDurationMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                                style={{
                                  width: "100%",
                                  padding: "7px 8px",
                                  borderRadius: 8,
                                  border: "1.5px solid #cbd5e1",
                                  fontSize: 13,
                                  fontWeight: 700,
                                  boxSizing: "border-box",
                                  marginTop: 3,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* MODE 2: Specific Date & Time Input */}
                      {tempMode === "custom" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 3 }}>
                              Exact Auto-Unlock Date & Time (Your Local Time):
                            </label>
                            <input
                              type="datetime-local"
                              min={toLocalDatetimeValue(new Date())}
                              value={customUntilDate}
                              onChange={(e) => setCustomUntilDate(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "8px 10px",
                                borderRadius: 8,
                                border: "1.5px solid #ea580c",
                                fontSize: 13,
                                fontWeight: 700,
                                boxSizing: "border-box",
                                background: "#fff7ed",
                                color: "#0f172a",
                                outline: "none",
                              }}
                            />
                          </div>

                          {/* Quick Shortcut Buttons for Datetime Picker */}
                          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: "#9a3412" }}>
                              Set To:
                            </span>
                            {[
                              { label: "+15m", fn: () => new Date(Date.now() + 15 * 60000) },
                              { label: "+30m", fn: () => new Date(Date.now() + 30 * 60000) },
                              { label: "+1h", fn: () => new Date(Date.now() + 60 * 60000) },
                              { label: "+2h", fn: () => new Date(Date.now() + 120 * 60000) },
                              {
                                label: "Tonight 11:59 PM",
                                fn: () => {
                                  const t = new Date();
                                  t.setHours(23, 59, 0, 0);
                                  return t;
                                },
                              },
                              {
                                label: "Tomorrow 9:00 AM",
                                fn: () => {
                                  const t = new Date();
                                  t.setDate(t.getDate() + 1);
                                  t.setHours(9, 0, 0, 0);
                                  return t;
                                },
                              },
                            ].map((sc) => (
                              <button
                                key={sc.label}
                                type="button"
                                onClick={() => setCustomUntilDate(toLocalDatetimeValue(sc.fn()))}
                                style={{
                                  padding: "2px 7px",
                                  borderRadius: 5,
                                  border: "1px solid #fed7aa",
                                  background: "#ffffff",
                                  color: "#c2410c",
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  transition: "all 0.1s ease",
                                }}
                              >
                                {sc.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Dynamic Live Auto-Unlock Preview Box */}
                      {(() => {
                        const preview = getComputedUnlockPreview();
                        return (
                          <div
                            style={{
                              background: preview.isError ? "#fef2f2" : "#f0fdf4",
                              border: preview.isError ? "1.5px solid #fecaca" : "1.5px solid #bbf7d0",
                              borderRadius: 10,
                              padding: "9px 12px",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              fontSize: 12,
                              color: preview.isError ? "#991b1b" : "#15803d",
                              fontWeight: 700,
                            }}
                          >
                            <Clock size={15} style={{ flexShrink: 0 }} />
                            <span>
                              <strong>Scheduled Unlock:</strong> {preview.text}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Suspension Reason Input with 1-Click Preset Tags */}
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: "#334155" }}>
                      Suspension Reason (Logged to Security Audit Trail):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Disciplinary action, exam malpractice, fee hold..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1.5px solid #cbd5e1",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#0f172a",
                        boxSizing: "border-box",
                        marginTop: 4,
                      }}
                    />

                    {/* Quick Preset Reason Tags */}
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 600, color: "#64748b", alignSelf: "center" }}>
                        Presets:
                      </span>
                      {PRESET_REASONS.map((pr) => (
                        <button
                          key={pr}
                          type="button"
                          onClick={() => setReason(pr)}
                          style={{
                            padding: "2px 7px",
                            borderRadius: 6,
                            border: "1px solid #e2e8f0",
                            background: "#ffffff",
                            color: "#475569",
                            fontSize: 10.5,
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
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => {
                        const preview = getComputedUnlockPreview();
                        const durationText =
                          blockType === "permanent"
                            ? "permanently"
                            : `temporarily until ${preview.text}`;

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
                        padding: isMob ? "11px 18px" : "12px 24px",
                        borderRadius: 10,
                        border: "none",
                        background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                        color: "#ffffff",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: actionLoading ? "not-allowed" : "pointer",
                        boxShadow: "0 4px 14px rgba(220, 38, 38, 0.28)",
                        width: isMob ? "100%" : "auto",
                        justifyContent: "center",
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

      {/* ── 4. CARD 2: DIRECTORY OF CURRENTLY BLOCKED STUDENTS ── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: isMob ? 16 : 20,
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
          padding: isMob ? "16px 14px" : "24px 26px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: isMob ? "stretch" : "center",
            justifyContent: "space-between",
            flexDirection: isMob ? "column" : "row",
            gap: 12,
            marginBottom: isMob ? 12 : 18,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: isMob ? 28 : 32,
                  height: isMob ? 28 : 32,
                  borderRadius: 8,
                  background: "#fee2e2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ShieldAlert size={isMob ? 14 : 16} />
              </div>
              <h3 style={{ margin: 0, fontSize: isMob ? 15 : 16, fontWeight: 800, color: "#0f172a" }}>
                Blocked Students Registry
              </h3>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: isMob ? 11.5 : 12, color: "#64748b" }}>
              {isMob
                ? "Live directory of currently suspended accounts."
                : "Live directory of accounts whose portal privileges are currently suspended."}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "stretch",
              gap: 8,
              flexDirection: isMob ? "column" : "row",
              width: isMob ? "100%" : "auto",
            }}
          >
            {/* Filter Pills */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                background: "#f1f5f9",
                borderRadius: 9,
                padding: 3,
                gap: 2,
              }}
            >
              {[
                { id: "all", label: `All (${totalBlocked})` },
                { id: "temporary", label: `Temp (${tempBlocked})` },
                { id: "permanent", label: `Perm (${permBlocked})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  style={{
                    padding: "5px 6px",
                    borderRadius: 7,
                    border: "none",
                    background: filterType === f.id ? "#ffffff" : "transparent",
                    color: filterType === f.id ? "#dc2626" : "#64748b",
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: filterType === f.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap",
                    textAlign: "center",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Table Search Input */}
            <div style={{ position: "relative", width: isMob ? "100%" : 180 }}>
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
                  borderRadius: 9,
                  border: "1.5px solid #cbd5e1",
                  fontSize: 12,
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Blocked Registry Content ── */}
        {listLoading ? (
          <div style={{ padding: 36, textAlign: "center", color: "#64748b" }}>
            <RefreshCw size={24} className="spin" style={{ margin: "0 auto 10px", color: "#4f46e5" }} />
            <div style={{ fontSize: 13, fontWeight: 700 }}>Synchronizing blocked registry...</div>
          </div>
        ) : filteredBlockedList.length === 0 ? (
          <div
            style={{
              padding: isMob ? "32px 16px" : "48px 24px",
              textAlign: "center",
              background: "#f8fafc",
              borderRadius: 14,
              border: "1px dashed #cbd5e1",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "#dcfce7",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
                boxShadow: "0 4px 12px rgba(22, 163, 74, 0.15)",
              }}
            >
              <UserCheck size={22} />
            </div>
            <h4 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
              {searchTable ? "No Matching Blocked Students" : "No Students Currently Blocked"}
            </h4>
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
              {searchTable
                ? "Try adjusting your search query or filter selection."
                : "All students have unrestricted access to check semester results and log in."}
            </p>
          </div>
        ) : isMob ? (
          /* ── MOBILE VIEW: RESPONSIVE CARDS ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredBlockedList.map((item) => (
              <div
                key={item.regNo}
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 14 }}>
                      {item.studentName}
                    </div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11.5, color: "#4f46e5", fontWeight: 700, marginTop: 1 }}>
                      {item.regNo}
                    </div>
                  </div>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "2px 7px",
                      borderRadius: 6,
                      fontSize: 10.5,
                      fontWeight: 800,
                      background: item.blockType === "permanent" ? "#fef2f2" : "#fff7ed",
                      color: item.blockType === "permanent" ? "#b91c1c" : "#c2410c",
                      border: item.blockType === "permanent" ? "1px solid #fca5a5" : "1px solid #fed7aa",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.blockType === "permanent" ? <Ban size={10} /> : <Clock size={10} />}
                    <span>{item.blockType === "permanent" ? "Permanent" : "Temporary"}</span>
                  </span>
                </div>

                <div style={{ fontSize: 11.5, color: "#475569", background: "#f8fafc", padding: "8px 10px", borderRadius: 8 }}>
                  <div style={{ fontWeight: 700, color: "#9a3412" }}>
                    Remaining: {formatExpiration(item.blockedUntil)}
                  </div>
                  <div style={{ marginTop: 2 }}>
                    Reason: <strong>{item.blockedReason || "Administrative restriction"}</strong>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, paddingTop: 2 }}>
                  <button
                    type="button"
                    onClick={() => handleInspect(item.regNo)}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#4f46e5",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "center",
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
                      padding: "8px 0",
                      borderRadius: 8,
                      border: "1px solid #bbf7d0",
                      background: "#f0fdf4",
                      color: "#15803d",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      textAlign: "center",
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
              borderRadius: 18,
              maxWidth: 440,
              width: "100%",
              padding: isMob ? "18px 16px" : "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
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
              <div>
                <h3 style={{ margin: 0, fontSize: isMob ? 15.5 : 17, fontWeight: 800, color: "#0f172a" }}>
                  {confirmModal.title}
                </h3>
                <span style={{ fontSize: 11.5, color: "#64748b" }}>Admin Security Confirmation</span>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
              {confirmModal.message}
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: null })}
                style={{
                  flex: isMob ? 1 : "none",
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1.5px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={confirmModal.onConfirm}
                style={{
                  flex: isMob ? 1 : "none",
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "none",
                  background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                  color: "#ffffff",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)",
                }}
              >
                {actionLoading && <RefreshCw size={12} className="spin" />}
                <span>Confirm</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
