import React, { useState, useEffect, useRef, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useApp } from "../context/AppContext";
import { Spinner } from "../components/LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Upload,
  Trash2,
  Settings,
  Users,
  FileText,
  FileEdit,
  Trophy,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  LogOut,
  Database,
  CloudUpload,
  MessageSquare,
  Edit2,
  X,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Search,
  Filter,
  HelpCircle,
  Info,
  Mail,
  Send,
  Check,
  Loader2,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Award,
  Layers,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Star,
  UserPlus,
  UserCheck,
  FileCheck,
  Copy,
  CheckCheck,
  SearchCode
} from "lucide-react";

function getDynamicSessionOptions(bStr, semVal, yStr) {
  const bYear = bStr && !isNaN(parseInt(bStr, 10)) ? parseInt(bStr, 10) : null;
  const yVal = yStr && !isNaN(parseInt(yStr, 10)) ? parseInt(yStr, 10) : null;
  const startY = bYear ? bYear : yVal;
  const sessions = [];

  if (!startY) {
    for (let y = 2018; y <= 2030; y++) {
      sessions.push(`${y}-${String(y + 1).slice(-2)}`);
    }
    return sessions;
  }

  for (let offset = 0; offset < 4; offset++) {
    const y1 = startY + offset;
    sessions.push(`${y1}-${String(y1 + 1).slice(-2)}`);
  }
  return sessions;
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "";
  }
}

/* ════════════════════════════════════════════════════════════════
   1. UPLOAD CARD COMPONENT (Clean Light SaaS Theme)
   ════════════════════════════════════════════════════════════════ */
function UploadCard({
  title,
  icon,
  endpoint,
  extraFields,
  authHeaders,
  API,
  onSuccess,
}) {
  const [file, setFile] = useState(null);
  const [extra, setExtra] = useState(() => {
    const init = {};
    if (extraFields) {
      extraFields.forEach((f) => {
        if (f.value !== undefined) init[f.key] = f.value;
      });
    }
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const inputRef = useRef();

  useEffect(() => {
    const hasSessionField = extraFields?.some((f) => f.key === "session");
    if (!hasSessionField) return;

    const bYear = extra.batch && !isNaN(parseInt(extra.batch, 10)) ? parseInt(extra.batch, 10) : null;
    const semNum = extra.semester && !isNaN(parseInt(extra.semester, 10)) ? parseInt(extra.semester, 10) : null;
    const yVal = extra.year && !isNaN(parseInt(extra.year, 10)) ? parseInt(extra.year, 10) : null;

    let targetSession = extra.session;

    if (bYear && semNum && semNum >= 1) {
      const yearOffset = Math.floor((semNum - 1) / 2);
      const calcYear = bYear + yearOffset;
      targetSession = `${calcYear}-${String(calcYear + 1).slice(-2)}`;
    } else if (bYear || yVal) {
      const validSessions = getDynamicSessionOptions(extra.batch, extra.semester, extra.year);
      if (!targetSession || !validSessions.includes(targetSession)) {
        targetSession = validSessions[0];
      }
    }

    if (targetSession && targetSession !== extra.session) {
      setExtra((prev) => ({ ...prev, session: targetSession }));
    }
  }, [extra.batch, extra.semester, extra.year]);

  async function handleUpload() {
    if (!file) {
      setErr("Please select an Excel file to upload");
      return;
    }
    const requiredFields = extraFields?.filter((f) => f.label && f.label.includes("*"));
    const missing = requiredFields?.find((f) => !extra[f.key]);
    if (missing) {
      setErr(`${missing.label.replace(" *", "")} is required`);
      return;
    }

    setLoading(true);
    setProgress(0);
    setMsg("");
    setErr("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      Object.entries(extra).forEach(([k, v]) => fd.append(k, v));

      const { data } = await axios.post(`${API}/admin/${endpoint}`, fd, {
        ...authHeaders,
        headers: {
          ...authHeaders.headers,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(Math.min(90, Math.floor(percentCompleted * 0.9)));
          }
        },
      });

      setProgress(100);

      setTimeout(() => {
        setMsg(data.message);
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
        if (onSuccess) onSuccess();
        setLoading(false);
        setProgress(0);
      }, 500);
    } catch (e) {
      setErr(e.response?.data?.message || "Upload failed");
      setLoading(false);
      setProgress(0);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: "22px 20px",
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.02)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
      }}
    >
      <div>
        {/* Card Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#eff6ff",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <h3 style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", margin: 0, letterSpacing: "-0.3px" }}>
            {title}
          </h3>
        </div>

        {/* Extra Form Fields */}
        {extraFields
          ?.filter((f) => !f.hidden)
          .map((f) => {
            const currentOptions =
              f.key === "session"
                ? getDynamicSessionOptions(extra.batch, extra.semester, extra.year)
                : f.options;

            return (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 11.5,
                    color: "#475569",
                    fontWeight: 700,
                    marginBottom: 5,
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                  }}
                >
                  {f.label}
                </label>
                {f.type === "select" ? (
                  <select
                    value={extra[f.key] || ""}
                    onChange={(e) => setExtra({ ...extra, [f.key]: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 10,
                      border: "1.5px solid #e2e8f0",
                      background: "#f8fafc",
                      color: "#0f172a",
                      fontSize: 13,
                      outline: "none",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    <option value="" disabled>
                      Select {f.label.replace(" *", "")}
                    </option>
                    {currentOptions?.map((opt) => (
                      <option key={opt.value || opt} value={opt.value || opt}>
                        {opt.label || opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type || "text"}
                    placeholder={f.placeholder}
                    value={extra[f.key] || ""}
                    onChange={(e) => setExtra({ ...extra, [f.key]: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 10,
                      border: "1.5px solid #e2e8f0",
                      background: "#f8fafc",
                      color: "#0f172a",
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  />
                )}
              </div>
            );
          })}

        {/* Drag & Drop File Zone */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          style={{
            border: `2px dashed ${file ? "#2563eb" : "#cbd5e1"}`,
            borderRadius: 12,
            padding: "16px 14px",
            textAlign: "center",
            marginBottom: 14,
            cursor: "pointer",
            background: file ? "#eff6ff" : "#f8fafc",
            transition: "all 0.2s ease",
          }}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setFile(e.dataTransfer.files[0]);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files[0])}
          />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            {file ? (
              <FileSpreadsheet size={26} color="#2563eb" />
            ) : (
              <CloudUpload size={26} color="#64748b" />
            )}
            <p
              style={{
                color: file ? "#2563eb" : "#475569",
                fontSize: 12.5,
                fontWeight: file ? 700 : 500,
                margin: 0,
              }}
            >
              {file ? file.name : "Click or drag Excel sheet here"}
            </p>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>Supports .xlsx & .xls</span>
          </div>
        </motion.div>

        {/* Error / Success Banners */}
        <AnimatePresence>
          {err && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                color: "#991b1b",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderLeft: "3.5px solid #ef4444",
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 12,
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <AlertTriangle size={14} color="#ef4444" style={{ flexShrink: 0 }} />
              <span>{err}</span>
            </motion.div>
          )}
          {msg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                color: "#065f46",
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderLeft: "3.5px solid #10b981",
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 12,
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <CheckCircle size={14} color="#10b981" style={{ flexShrink: 0 }} />
              <span>{msg}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upload Action Button */}
      <div style={{ position: "relative" }}>
        <button
          onClick={handleUpload}
          disabled={loading}
          style={{
            width: "100%",
            padding: "11px 16px",
            borderRadius: 10,
            background: "#0f172a",
            color: "#ffffff",
            border: "none",
            fontSize: 13.5,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            overflow: "hidden",
            position: "relative",
            transition: "background 0.2s ease",
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "#1e293b")}
          onMouseLeave={(e) => !loading && (e.currentTarget.style.background = "#0f172a")}
        >
          <span style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 7 }}>
            {loading ? (
              <>
                <Spinner size={14} /> Uploading... {progress}%
              </>
            ) : (
              <>
                <Upload size={15} /> Upload Dataset
              </>
            )}
          </span>
          {loading && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                background: "#2563eb",
                zIndex: 1,
              }}
            />
          )}
        </button>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════
   1.5 MISSING STUDENTS UPLOAD CARD (Filters out existing students, ingests only missing ones)
   ════════════════════════════════════════════════════════════════ */
function MissingUploadCard({
  title,
  icon,
  endpoint,
  typeBadge,
  extraFields,
  authHeaders,
  API,
  onSuccess,
}) {
  const [file, setFile] = useState(null);
  const [extra, setExtra] = useState(() => {
    const init = {};
    if (extraFields) {
      extraFields.forEach((f) => {
        if (f.value !== undefined) init[f.key] = f.value;
      });
    }
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState(null);
  const [err, setErr] = useState("");
  const [copiedAll, setCopiedAll] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    const hasSessionField = extraFields?.some((f) => f.key === "session");
    if (!hasSessionField) return;

    const bYear = extra.batch && !isNaN(parseInt(extra.batch, 10)) ? parseInt(extra.batch, 10) : null;
    const semNum = extra.semester && !isNaN(parseInt(extra.semester, 10)) ? parseInt(extra.semester, 10) : null;
    const yVal = extra.year && !isNaN(parseInt(extra.year, 10)) ? parseInt(extra.year, 10) : null;

    let targetSession = extra.session;

    if (bYear && semNum && semNum >= 1) {
      const yearOffset = Math.floor((semNum - 1) / 2);
      const calcYear = bYear + yearOffset;
      targetSession = `${calcYear}-${String(calcYear + 1).slice(-2)}`;
    } else if (bYear || yVal) {
      const validSessions = getDynamicSessionOptions(extra.batch, extra.semester, extra.year);
      if (!targetSession || !validSessions.includes(targetSession)) {
        targetSession = validSessions[0];
      }
    }

    if (targetSession && targetSession !== extra.session) {
      setExtra((prev) => ({ ...prev, session: targetSession }));
    }
  }, [extra.batch, extra.semester, extra.year]);

  async function handleIngest() {
    if (!file) {
      setErr("Please select an Excel file to upload");
      return;
    }
    const requiredFields = extraFields?.filter((f) => f.label && f.label.includes("*"));
    const missing = requiredFields?.find((f) => !extra[f.key]);
    if (missing) {
      setErr(`${missing.label.replace(" *", "")} is required`);
      return;
    }

    setLoading(true);
    setProgress(0);
    setReport(null);
    setErr("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      Object.entries(extra).forEach(([k, v]) => fd.append(k, v));

      const { data } = await axios.post(`${API}/admin/${endpoint}`, fd, {
        ...authHeaders,
        headers: {
          ...authHeaders.headers,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(Math.min(90, Math.floor(percentCompleted * 0.9)));
          }
        },
      });

      setProgress(100);

      setTimeout(() => {
        setReport(data);
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
        if (onSuccess) onSuccess();
        setLoading(false);
        setProgress(0);
      }, 500);
    } catch (e) {
      setErr(e.response?.data?.message || "Ingestion failed");
      setLoading(false);
      setProgress(0);
    }
  }

  const handleCopyRegs = () => {
    if (!report?.addedStudents?.length) return;
    const list = report.addedStudents.map((s) => s.regNo).join(", ");
    navigator.clipboard.writeText(list);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "#ffffff",
        border: "1.5px solid #e0e7ff",
        borderRadius: 16,
        padding: "22px 20px",
        boxShadow: "0 2px 12px rgba(79, 70, 229, 0.04)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
      }}
    >
      <div>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "#e0e7ff",
                color: "#4338ca",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
            <div>
              <h3 style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", margin: 0, letterSpacing: "-0.3px" }}>
                {title}
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: 11.5, color: "#64748b" }}>
                Filters out existing students; ingests only completely new records.
              </p>
            </div>
          </div>
          {typeBadge && (
            <span
              style={{
                background: "#e0e7ff",
                color: "#4338ca",
                padding: "3px 8px",
                borderRadius: 6,
                fontSize: 10.5,
                fontWeight: 800,
                textTransform: "uppercase",
              }}
            >
              {typeBadge}
            </span>
          )}
        </div>

        {/* Extra Form Fields */}
        {extraFields
          ?.filter((f) => !f.hidden)
          .map((f) => {
            const currentOptions =
              f.key === "session"
                ? getDynamicSessionOptions(extra.batch, extra.semester, extra.year)
                : f.options;

            return (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 11.5,
                    color: "#475569",
                    fontWeight: 700,
                    marginBottom: 5,
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                  }}
                >
                  {f.label}
                </label>
                {f.type === "select" ? (
                  <select
                    value={extra[f.key] || ""}
                    onChange={(e) =>
                      setExtra((prev) => ({ ...prev, [f.key]: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      color: "#1e293b",
                      background: "#ffffff",
                    }}
                  >
                    {currentOptions?.map((opt) => {
                      const val = typeof opt === "object" ? opt.value : opt;
                      const lbl = typeof opt === "object" ? opt.label : opt;
                      return (
                        <option key={val} value={val}>
                          {lbl}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={extra[f.key] || ""}
                    onChange={(e) =>
                      setExtra((prev) => ({ ...prev, [f.key]: e.target.value }))
                    }
                    placeholder={f.placeholder || ""}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      color: "#1e293b",
                      boxSizing: "border-box",
                    }}
                  />
                )}
              </div>
            );
          })}

        {/* File Input */}
        <div style={{ marginTop: 14 }}>
          <label
            style={{
              display: "block",
              fontSize: 11.5,
              color: "#475569",
              fontWeight: 700,
              marginBottom: 5,
              textTransform: "uppercase",
              letterSpacing: "0.4px",
            }}
          >
            Select Excel File (.xlsx, .xls, .csv)
          </label>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setFile(e.target.files[0])}
            style={{
              width: "100%",
              padding: "7px",
              border: "1px dashed #94a3b8",
              borderRadius: 8,
              fontSize: 12,
              color: "#475569",
              background: "#f8fafc",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Progress Bar */}
        {loading && (
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                width: "100%",
                height: 6,
                background: "#e2e8f0",
                borderRadius: 99,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "#4f46e5",
                  transition: "width 0.2s ease",
                }}
              />
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#6366f1",
                textAlign: "right",
                marginTop: 4,
                fontWeight: 600,
              }}
            >
              Filtering database & ingesting... {progress}%
            </div>
          </div>
        )}

        {/* Feedback Messages & Live Ingestion Report */}
        {report && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                padding: "10px 12px",
                background: report.addedCount > 0 ? "#ecfdf5" : "#f0f9ff",
                border: report.addedCount > 0 ? "1px solid #a7f3d0" : "1px solid #bae6fd",
                borderRadius: 10,
                color: report.addedCount > 0 ? "#065f46" : "#0369a1",
                fontSize: 12.5,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <CheckCircle size={16} color={report.addedCount > 0 ? "#059669" : "#0284c7"} />
              <span>{report.message}</span>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "8px 10px", borderRadius: 8, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>In File</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{report.totalInFile}</div>
              </div>
              <div style={{ background: "#fef3c7", border: "1px solid #fde68a", padding: "8px 10px", borderRadius: 8, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#92400e", fontWeight: 700, textTransform: "uppercase" }}>Skipped (In DB)</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#b45309" }}>{report.skippedCount}</div>
              </div>
              <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "8px 10px", borderRadius: 8, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#065f46", fontWeight: 700, textTransform: "uppercase" }}>Newly Ingested</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#059669" }}>{report.addedCount}</div>
              </div>
            </div>

            {/* Added Students Table */}
            {report.addedStudents && report.addedStudents.length > 0 && (
              <div style={{ marginTop: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "#334155" }}>
                    Ingested Students ({report.addedStudents.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyRegs}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#4f46e5",
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {copiedAll ? <CheckCheck size={12} color="#16a34a" /> : <Copy size={12} />}
                    {copiedAll ? "Copied!" : "Copy Reg Nos"}
                  </button>
                </div>
                <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 8 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5, textAlign: "left" }}>
                    <thead style={{ background: "#f8fafc", position: "sticky", top: 0 }}>
                      <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                        <th style={{ padding: "6px 8px" }}>Reg No</th>
                        <th style={{ padding: "6px 8px" }}>Name</th>
                        <th style={{ padding: "6px 8px" }}>Branch</th>
                        {report.addedStudents[0].sgpa !== undefined && (
                          <th style={{ padding: "6px 8px" }}>SGPA</th>
                        )}
                        <th style={{ padding: "6px 8px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.addedStudents.map((st) => (
                        <tr key={st.regNo} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "6px 8px", fontFamily: "monospace", fontWeight: 700 }}>{st.regNo}</td>
                          <td style={{ padding: "6px 8px" }}>{st.studentName}</td>
                          <td style={{ padding: "6px 8px" }}>{st.branch}</td>
                          {st.sgpa !== undefined && (
                            <td style={{ padding: "6px 8px", fontWeight: 800, color: "#2563eb" }}>{st.sgpa}</td>
                          )}
                          <td style={{ padding: "6px 8px" }}>
                            <span style={{ background: "#ecfdf5", color: "#065f46", padding: "2px 5px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                              ✅ Ingested
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {err && (
          <div
            style={{
              marginTop: 12,
              padding: "9px 12px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              color: "#991b1b",
              fontSize: 12.5,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <AlertTriangle size={15} color="#dc2626" />
            <span>{err}</span>
          </div>
        )}
      </div>

      <button
        onClick={handleIngest}
        disabled={loading}
        style={{
          marginTop: 18,
          width: "100%",
          padding: "10px",
          borderRadius: 9,
          background: loading ? "#94a3b8" : "linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)",
          color: "#ffffff",
          border: "none",
          fontSize: 13,
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
        }}
      >
        {loading ? (
          <>
            <Loader2 size={15} className="spin" />
            <span>Scanning Database & Ingesting...</span>
          </>
        ) : (
          <>
            <UserPlus size={15} />
            <span>Ingest Missing Students Only</span>
          </>
        )}
      </button>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════
   2. DELETE RECORD CARD COMPONENT
   ════════════════════════════════════════════════════════════════ */
function DeleteRecordCard({ authHeaders, API, onSuccess }) {
  const [regNo, setRegNo] = useState("");
  const [semester, setSemester] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function handleDelete() {
    if (!regNo.trim() || !semester) {
      setErr("Both Registration Number and Semester are required");
      return;
    }
    if (
      !window.confirm(
        `Delete Sem ${semester} record for ${regNo}? This cannot be undone.`
      )
    )
      return;
    setLoading(true);
    setMsg("");
    setErr("");
    try {
      const { data } = await axios.delete(
        `${API}/admin/results/${regNo.trim()}/${semester}`,
        authHeaders
      );
      setMsg(data.message);
      setRegNo("");
      setSemester("");
      if (onSuccess) onSuccess();
    } catch (e) {
      setErr(e.response?.data?.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "#ffffff",
        border: "1px solid #fecaca",
        borderRadius: 16,
        padding: "22px 20px",
        boxShadow: "0 2px 10px rgba(239, 68, 68, 0.03)",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "#fef2f2",
            color: "#ef4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Trash2 size={18} />
        </div>
        <div>
          <h3 style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", margin: 0 }}>
            Delete Stale Semester Record
          </h3>
          <span style={{ fontSize: 11.5, color: "#64748b" }}>
            Remove an incorrectly uploaded semester result
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: 11.5, color: "#475569", fontWeight: 700, marginBottom: 5 }}>
            Registration No.
          </label>
          <input
            type="text"
            placeholder="e.g. 230301120327"
            value={regNo}
            onChange={(e) => setRegNo(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 10,
              border: "1.5px solid #e2e8f0",
              background: "#f8fafc",
              color: "#0f172a",
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11.5, color: "#475569", fontWeight: 700, marginBottom: 5 }}>
            Semester
          </label>
          <input
            type="number"
            min="1"
            max="12"
            placeholder="e.g. 4"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 10,
              border: "1.5px solid #e2e8f0",
              background: "#f8fafc",
              color: "#0f172a",
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
        </div>
      </div>

      <AnimatePresence>
        {err && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              color: "#991b1b",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 12,
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <AlertTriangle size={14} color="#ef4444" /> {err}
          </motion.div>
        )}
        {msg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              color: "#065f46",
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 12,
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <CheckCircle size={14} color="#10b981" /> {msg}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={handleDelete}
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: 10,
          background: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#ef4444",
          fontSize: 13,
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          transition: "all 0.15s ease",
          fontFamily: "'DM Sans', sans-serif",
        }}
        onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "#fee2e2")}
        onMouseLeave={(e) => !loading && (e.currentTarget.style.background = "#fef2f2")}
      >
        {loading ? "Deleting..." : <><Trash2 size={14} /> Delete Record</>}
      </button>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════
   3. MANUAL GRADE UPDATE CARD
   ════════════════════════════════════════════════════════════════ */
function ManualGradeUpdateCard({ authHeaders, API, onSuccess }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [studentSuggestions, setStudentSuggestions] = useState([]);
  const [selectedRegNo, setSelectedRegNo] = useState("");
  const [studentDetails, setStudentDetails] = useState(null);

  const [selectedSem, setSelectedSem] = useState("");
  const [selectedSubjectCode, setSelectedSubjectCode] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [newGrade, setNewGrade] = useState("O");

  const [loadingStudent, setLoadingStudent] = useState(false);
  const [updatingGrade, setUpdatingGrade] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Search students for dropdown
  useEffect(() => {
    if (!searchQuery.trim()) {
      setStudentSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.get(
          `${API}/admin/students/search?q=${encodeURIComponent(searchQuery)}`,
          authHeaders
        );
        setStudentSuggestions(data || []);
      } catch (e) {
        console.error(e);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch student details by Reg No
  async function fetchStudent(regNoToFetch) {
    const targetRegNo = regNoToFetch || selectedRegNo || searchQuery;
    if (!targetRegNo || !targetRegNo.trim()) {
      setErr("Please enter or select a Registration Number.");
      return;
    }

    setLoadingStudent(true);
    setErr("");
    setMsg("");
    setStudentDetails(null);
    setSelectedSem("");
    setSelectedSubjectCode("");

    try {
      const { data } = await axios.get(
        `${API}/admin/student/details/${encodeURIComponent(targetRegNo.trim())}`,
        authHeaders
      );
      setStudentDetails(data);
      setSelectedRegNo(data.regNo);
      setSearchQuery(data.regNo);
      setStudentSuggestions([]);

      if (data.semesters && data.semesters.length > 0) {
        const latestSem = data.semesters[data.semesters.length - 1].semester;
        setSelectedSem(String(latestSem));
      }
    } catch (e) {
      setErr(e.response?.data?.message || "No data present related to this student");
    } finally {
      setLoadingStudent(false);
    }
  }

  const currentSemRecord = studentDetails?.semesters?.find(
    (s) => String(s.semester) === String(selectedSem)
  );

  const availableSubjects = currentSemRecord?.subjects || [];
  const filteredSubjects = availableSubjects.filter((s) => {
    if (!subjectSearch.trim()) return true;
    const term = subjectSearch.toLowerCase();
    return (
      (s.subCode || "").toLowerCase().includes(term) ||
      (s.subName || "").toLowerCase().includes(term)
    );
  });

  async function handleUpdateGrade(e) {
    e.preventDefault();
    if (!studentDetails || !selectedRegNo) {
      setErr("Please select a valid student first.");
      return;
    }
    if (!selectedSem) {
      setErr("Please select a semester.");
      return;
    }
    if (!selectedSubjectCode) {
      setErr("Please select a subject to update.");
      return;
    }
    if (!newGrade) {
      setErr("Please select a new grade.");
      return;
    }

    setUpdatingGrade(true);
    setErr("");
    setMsg("");

    try {
      const { data } = await axios.post(
        `${API}/admin/student/update-grade`,
        {
          regNo: selectedRegNo,
          semester: Number(selectedSem),
          subCode: selectedSubjectCode,
          newGrade: newGrade,
        },
        authHeaders
      );

      setMsg(data.message);
      await fetchStudent(selectedRegNo);
      if (onSuccess) onSuccess();
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to update grade");
    } finally {
      setUpdatingGrade(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 18,
        padding: "24px 22px",
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.02)",
        gridColumn: "1 / -1",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "#ecfdf5",
            color: "#10b981",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FileEdit size={18} />
        </div>
        <div>
          <h3 style={{ fontWeight: 800, fontSize: 17, color: "#0f172a", margin: 0 }}>
            Manual Student Grade Update & Sync
          </h3>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            Directly update subject grades, recalculating SGPA, CGPA, and ranks instantly.
          </span>
        </div>
      </div>

      <form onSubmit={handleUpdateGrade} style={{ marginTop: 16 }}>
        {/* Search Input with Auto-complete */}
        <div style={{ marginBottom: 16, position: "relative" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
            1. Search / Enter Registration Number or Student Name *
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                type="text"
                placeholder="e.g. 230301120327 or Student Name"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedRegNo(e.target.value);
                }}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1.5px solid #e2e8f0",
                  background: "#f8fafc",
                  color: "#0f172a",
                  fontSize: 13.5,
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
              {studentSuggestions.length > 0 && (
                <ul
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    maxHeight: 200,
                    overflowY: "auto",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    listStyle: "none",
                    padding: "4px 0",
                    margin: "4px 0 0 0",
                  }}
                >
                  {studentSuggestions.map((s) => (
                    <li
                      key={s.regNo}
                      onClick={() => fetchStudent(s.regNo)}
                      style={{
                        padding: "9px 14px",
                        cursor: "pointer",
                        fontSize: 13,
                        borderBottom: "1px solid #f1f5f9",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <strong style={{ color: "#2563eb" }}>{s.regNo}</strong>
                      <span style={{ color: "#475569" }}>
                        {s.studentName} ({s.branch || "CSE"})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              onClick={() => fetchStudent(searchQuery)}
              disabled={loadingStudent}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                background: "#0f172a",
                color: "#ffffff",
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: loadingStudent ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {loadingStudent ? "Searching..." : "Fetch Student"}
            </button>
          </div>
        </div>

        {/* Fetched Student Summary */}
        {studentDetails && (
          <div
            style={{
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 16,
              fontSize: 13,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 14.5, color: "#065f46", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <Users size={15} color="#059669" /> {studentDetails.studentName} ({studentDetails.regNo})
            </div>
            <div style={{ display: "flex", gap: 16, color: "#047857", fontSize: 12.5, flexWrap: "wrap" }}>
              <span>Branch: <strong>{studentDetails.branch}</strong></span>
              <span>Batch: <strong>{studentDetails.batch}</strong></span>
              <span>Total Semesters: <strong>{studentDetails.semesters?.length || 0}</strong></span>
            </div>
          </div>
        )}

        {studentDetails && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  2. Select Semester *
                </label>
                <select
                  value={selectedSem}
                  onChange={(e) => {
                    setSelectedSem(e.target.value);
                    setSelectedSubjectCode("");
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: 10,
                    border: "1.5px solid #e2e8f0",
                    background: "#f8fafc",
                    color: "#0f172a",
                    fontSize: 13,
                    outline: "none",
                  }}
                >
                  <option value="">-- Choose Semester --</option>
                  {studentDetails.semesters?.map((sem) => (
                    <option key={sem.semester} value={sem.semester}>
                      Semester {sem.semester} (SGPA: {sem.sgpa !== undefined ? sem.sgpa : 0}, CGPA: {sem.cgpa !== undefined ? sem.cgpa : 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  3. Select Subject *
                </label>
                <select
                  value={selectedSubjectCode}
                  onChange={(e) => setSelectedSubjectCode(e.target.value)}
                  disabled={!selectedSem}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: 10,
                    border: "1.5px solid #e2e8f0",
                    background: "#f8fafc",
                    color: "#0f172a",
                    fontSize: 13,
                    outline: "none",
                  }}
                >
                  <option value="">-- Choose Subject --</option>
                  {filteredSubjects.map((sub) => (
                    <option key={sub.subCode || sub.subName} value={sub.subCode || sub.subName}>
                      {sub.subCode} - {sub.subName} (Grade: {sub.grade}, Cr: {sub.credit})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedSubjectCode && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 12,
                  alignItems: "end",
                  marginBottom: 16,
                }}
              >
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                    4. Select New Grade *
                  </label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: 10,
                      border: "1.5px solid #e2e8f0",
                      background: "#f8fafc",
                      color: "#0f172a",
                      fontSize: 13,
                      outline: "none",
                    }}
                  >
                    <option value="O">O (10 Grade Points - Outstanding)</option>
                    <option value="E">E (9 Grade Points - Excellent)</option>
                    <option value="A">A (8 Grade Points - Very Good)</option>
                    <option value="B">B (7 Grade Points - Good)</option>
                    <option value="C">C (6 Grade Points - Fair)</option>
                    <option value="D">D (5 Grade Points - Pass)</option>
                    <option value="F">F (2 Grade Points - Fail)</option>
                    <option value="R">R (0 Grade Points - Repeat / Backlog)</option>
                    <option value="M">M (0 Grade Points - Absent)</option>
                    <option value="S">S (0 Grade Points - Satisfactory)</option>
                  </select>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={updatingGrade}
                    style={{
                      width: "100%",
                      padding: "11px 16px",
                      borderRadius: 10,
                      background: "#10b981",
                      color: "#ffffff",
                      border: "none",
                      fontSize: 13.5,
                      fontWeight: 700,
                      cursor: updatingGrade ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    <CheckCircle size={16} />
                    {updatingGrade ? "Updating & Recalculating..." : "Update Grade & Sync Web System"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <AnimatePresence>
          {err && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                color: "#991b1b",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 12.5,
                marginTop: 10,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <AlertTriangle size={14} color="#ef4444" /> {err}
            </motion.div>
          )}
          {msg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                color: "#065f46",
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 12.5,
                marginTop: 10,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <CheckCircle size={14} color="#10b981" /> {msg}
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════
   4. SECTION TOPPERS CARD
   ════════════════════════════════════════════════════════════════ */
function SectionToppersCard({ authHeaders, API }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ totalToppers: 0, students: [] });
  const [batch, setBatch] = useState("2023");
  const [branch, setBranch] = useState("CSE");
  const [section, setSection] = useState("Sec A");
  const [search, setSearch] = useState("");
  const [limit] = useState(10);
  const [selectedStudentForEmail, setSelectedStudentForEmail] = useState(null);
  const [customEmailInput, setCustomEmailInput] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState("");
  const [emailErrorMsg, setEmailErrorMsg] = useState("");
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toppersCacheRef = useRef(new Map());

  function handleOpenEmailModal(st) {
    setSelectedStudentForEmail(st);
    setCustomEmailInput(`${st.regNo}@centurionuniv.edu.in`.toLowerCase());
    setEmailSuccessMsg("");
    setEmailErrorMsg("");
  }

  async function handleConfirmSendEmail(e) {
    e.preventDefault();
    if (!selectedStudentForEmail || sendingEmail) return;

    setSendingEmail(true);
    setEmailSuccessMsg("");
    setEmailErrorMsg("");

    let success = false;
    let resData = null;
    let errMessage = "";

    try {
      const res = await axios.post(
        `${API}/admin/section-toppers/send-email`,
        {
          regNo: selectedStudentForEmail.regNo,
          studentName: selectedStudentForEmail.studentName,
          cgpa: selectedStudentForEmail.cgpa,
          sgpa: selectedStudentForEmail.sgpa,
          sectionCgpaRank: selectedStudentForEmail.sectionCgpaRank,
          sectionSgpaRank: selectedStudentForEmail.sectionSgpaRank,
          universityRank: selectedStudentForEmail.universityRank,
          semester: selectedStudentForEmail.semester,
          batch: selectedStudentForEmail.batch,
          branch: selectedStudentForEmail.branch,
          section: selectedStudentForEmail.section,
          customEmail: customEmailInput,
        },
        { headers: authHeaders?.headers, timeout: 30000 }
      );
      resData = res.data;
      success = true;
    } catch (primaryErr) {
      try {
        const res2 = await axios.post(
          "/api/send-topper-email",
          {
            regNo: selectedStudentForEmail.regNo,
            studentName: selectedStudentForEmail.studentName,
            cgpa: selectedStudentForEmail.cgpa,
            sgpa: selectedStudentForEmail.sgpa,
            sectionCgpaRank: selectedStudentForEmail.sectionCgpaRank,
            sectionSgpaRank: selectedStudentForEmail.sectionSgpaRank,
            universityRank: selectedStudentForEmail.universityRank,
            semester: selectedStudentForEmail.semester,
            batch: selectedStudentForEmail.batch,
            branch: selectedStudentForEmail.branch,
            section: selectedStudentForEmail.section,
            customEmail: customEmailInput,
          },
          { timeout: 30000 }
        );
        resData = res2.data;
        success = true;
      } catch (fallbackErr) {
        errMessage = primaryErr.response?.data?.message || fallbackErr.response?.data?.message || "Failed to send email. Check SMTP setup.";
      }
    }

    setSendingEmail(false);

    if (success && resData) {
      setEmailSuccessMsg(resData.message || `Congratulatory email sent to ${customEmailInput}`);
      axios
        .post(`${API}/admin/section-toppers/topper-email-status`, { regNo: selectedStudentForEmail.regNo, status: "SUCCESS" }, authHeaders)
        .catch(() => {});

      setData((prev) => ({
        ...prev,
        students: prev.students.map((st) => {
          if (st.regNo === selectedStudentForEmail.regNo) {
            return {
              ...st,
              lastTopperEmailStatus: "SUCCESS",
              lastTopperEmailSentAt: new Date().toISOString(),
              lastTopperEmailError: null,
            };
          }
          return st;
        }),
      }));
    } else {
      setEmailErrorMsg(errMessage || "Failed to send email");
      axios
        .post(`${API}/admin/section-toppers/topper-email-status`, { regNo: selectedStudentForEmail.regNo, status: "FAILED", errorMsg: errMessage }, authHeaders)
        .catch(() => {});
    }
  }

  async function fetchSectionToppers(forceRefetch = false, overrideFilters = {}) {
    const activeBatch = overrideFilters.batch !== undefined ? overrideFilters.batch : batch;
    const activeBranch = overrideFilters.branch !== undefined ? overrideFilters.branch : branch;
    const activeSection = overrideFilters.section !== undefined ? overrideFilters.section : section;
    const activeSearch = overrideFilters.search !== undefined ? overrideFilters.search : search;

    const cacheKey = JSON.stringify({
      limit: 10,
      batch: activeBatch,
      branch: activeBranch,
      section: activeSection,
      search: activeSearch,
    });

    if (!forceRefetch && toppersCacheRef.current.has(cacheKey)) {
      setData(toppersCacheRef.current.get(cacheKey));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("limit", "10");
      if (activeBatch) params.append("batch", activeBatch);
      if (activeBranch) params.append("branch", activeBranch);
      if (activeSection) params.append("section", activeSection);
      if (activeSearch) params.append("search", activeSearch);

      const res = await axios.get(`${API}/admin/section-toppers?${params}`, authHeaders);
      const resData = res.data || { totalToppers: 0, students: [] };
      toppersCacheRef.current.set(cacheKey, resData);
      setData(resData);
    } catch (e) {
      console.error(e);
      setData({ totalToppers: 0, students: [] });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSectionToppers(true);
  }, []);

  function handleFilterChange(field, val) {
    let newBatch = batch;
    let newBranch = branch;
    let newSection = section;
    let newSearch = search;

    if (field === "batch") { setBatch(val); newBatch = val; }
    if (field === "branch") { setBranch(val); newBranch = val; }
    if (field === "section") { setSection(val); newSection = val; }
    if (field === "search") { setSearch(val); newSearch = val; }

    fetchSectionToppers(false, {
      batch: newBatch,
      branch: newBranch,
      section: newSection,
      search: newSearch,
    });
  }

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 18,
        padding: isMobile ? "16px 14px" : "24px 20px",
        marginBottom: 28,
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.02)",
      }}
    >
      {/* Card Header Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: "#fffbeb",
            color: "#d97706",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Trophy size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Section Academic Toppers
          </h3>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            Total {data.totalToppers || data.students?.length || 0} Toppers Found
          </span>
        </div>
      </div>

      {/* Dedicated Filter & Search Control Box - Full Width */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          padding: "14px 16px",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "minmax(220px, 1.5fr) repeat(3, minmax(125px, 1fr)) auto",
            gap: 10,
            alignItems: "end",
          }}
        >
          {/* Search Student Input */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Search Student / Reg. No</label>
            <div style={{ position: "relative", width: "100%" }}>
              <Search size={14} color="#64748b" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Search student / RegNo..."
                value={search}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearch(val);
                  if (val === "") {
                    fetchSectionToppers(false, { batch, branch, section, search: "" });
                  }
                }}
                onKeyDown={(e) => e.key === "Enter" && fetchSectionToppers(false, { batch, branch, section, search })}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 32px",
                  borderRadius: 8,
                  border: "1.5px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontSize: 12.5,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Batch */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Batch</label>
            <select
              value={batch}
              onChange={(e) => handleFilterChange("batch", e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1.5px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <option value="">All Batches</option>
              <option value="2024">Batch 2024</option>
              <option value="2023">Batch 2023</option>
              <option value="2022">Batch 2022</option>
              <option value="2021">Batch 2021</option>
              <option value="2020">Batch 2020</option>
            </select>
          </div>

          {/* Branch */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Branch</label>
            <select
              value={branch}
              onChange={(e) => handleFilterChange("branch", e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1.5px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <option value="">All Branches</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="ME">ME</option>
              <option value="CIVIL">CIVIL</option>
              <option value="EEE">EEE</option>
              <option value="AERO">AERO</option>
              <option value="BIO">BIO</option>
              <option value="MI">MI</option>
            </select>
          </div>

          {/* Section (Only A through L) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Section</label>
            <select
              value={section}
              onChange={(e) => handleFilterChange("section", e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1.5px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <option value="">All Sections</option>
              <option value="Sec A">Section A</option>
              <option value="Sec B">Section B</option>
              <option value="Sec C">Section C</option>
              <option value="Sec D">Section D</option>
              <option value="Sec E">Section E</option>
              <option value="Sec F">Section F</option>
              <option value="Sec G">Section G</option>
              <option value="Sec H">Section H</option>
              <option value="Sec I">Section I</option>
              <option value="Sec J">Section J</option>
              <option value="Sec K">Section K</option>
              <option value="Sec L">Section L</option>
            </select>
          </div>

          {/* Search Button */}
          <button
            onClick={() => fetchSectionToppers(false, { batch, branch, section, search })}
            style={{
              width: isMobile ? "100%" : "auto",
              padding: "9px 20px",
              borderRadius: 8,
              background: "#0f172a",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 12.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              cursor: "pointer",
              border: "none",
              whiteSpace: "nowrap",
              height: 38,
            }}
          >
            <Search size={13} /> Search
          </button>
        </div>
      </div>

      {/* Toppers Content */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "30px 0", color: "#64748b" }}>
          <Spinner size={24} /> Loading toppers list...
        </div>
      ) : data.students?.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8", fontSize: 13 }}>
          No section toppers found matching the current filters.
        </div>
      ) : isMobile ? (
        /* Mobile Card View (Zero Horizontal Scrolling) */
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.students.map((st, idx) => (
            <div
              key={st.regNo || idx}
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: idx === 0 ? "#fef3c7" : idx === 1 ? "#eff6ff" : "#f1f5f9",
                      color: idx === 0 ? "#b45309" : idx === 1 ? "#2563eb" : "#475569",
                      fontWeight: 800,
                      fontSize: 13,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    #{idx + 1}
                  </span>
                  <div>
                    <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 14 }}>{st.studentName}</div>
                    <div style={{ fontSize: 12, color: "#2563eb", fontWeight: 600 }}>{st.regNo}</div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenEmailModal(st)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    color: "#059669",
                    fontSize: 12,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    cursor: "pointer",
                  }}
                >
                  <Send size={12} /> {st.lastTopperEmailStatus === "SUCCESS" ? "Resend Email" : "Send Email"}
                </button>
              </div>

              {/* Badges Row */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ background: "#eff6ff", border: "1px solid #dbeafe", color: "#1d4ed8", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>
                  {st.section || section || "Sec A"}
                </span>
                <span style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#475569", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>
                  {st.batch || batch} • {st.branch || branch}
                </span>
                <span style={{ background: "#faf5ff", border: "1px solid #f3e8ff", color: "#7e22ce", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>
                  Sem {st.semester || 6}
                </span>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, background: "#ffffff", padding: "8px 10px", borderRadius: 10, border: "1px solid #f1f5f9", textAlign: "center" }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>CGPA</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#059669" }}>{st.cgpa?.toFixed(2) || "N/A"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>SGPA</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0d9488" }}>{st.sgpa?.toFixed(2) || "N/A"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>SEC RANK</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#d97706" }}>#{st.sectionCgpaRank || idx + 1}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>UNIV RANK</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#7c3aed" }}>#{st.universityRank || "-"}</div>
                </div>
              </div>

              {/* Email Status Indicator */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5 }}>
                <span style={{ color: "#64748b" }}>Email Status:</span>
                {st.lastTopperEmailStatus === "SUCCESS" ? (
                  <span style={{ color: "#059669", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Check size={12} /> Sent {formatTimeAgo(st.lastTopperEmailSentAt)}
                  </span>
                ) : st.lastTopperEmailStatus === "FAILED" ? (
                  <span style={{ color: "#ef4444", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <AlertTriangle size={12} /> Failed
                  </span>
                ) : (
                  <span style={{ color: "#94a3b8", fontWeight: 600 }}>Not Sent Yet</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Desktop Data Table */
        <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                <th style={{ padding: "12px 10px", fontWeight: 700, width: 35 }}>#</th>
                <th style={{ padding: "12px 12px", fontWeight: 700 }}>STUDENT NAME</th>
                <th style={{ padding: "12px 12px", fontWeight: 700 }}>REGISTRATION NO</th>
                <th style={{ padding: "12px 10px", fontWeight: 700 }}>SECTION</th>
                <th style={{ padding: "12px 10px", fontWeight: 700 }}>BATCH • BRANCH</th>
                <th style={{ padding: "12px 8px", fontWeight: 700 }}>SEM</th>
                <th style={{ padding: "12px 10px", fontWeight: 700 }}>CGPA</th>
                <th style={{ padding: "12px 10px", fontWeight: 700 }}>SGPA</th>
                <th style={{ padding: "12px 10px", fontWeight: 700 }}>SEC RANK</th>
                <th style={{ padding: "12px 10px", fontWeight: 700 }}>UNIV RANK</th>
                <th style={{ padding: "12px 12px", fontWeight: 700 }}>EMAIL STATUS</th>
                <th style={{ padding: "12px 12px", fontWeight: 700, textAlign: "center" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {data.students.map((st, idx) => (
                <tr
                  key={st.regNo || idx}
                  style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "12px 10px", fontWeight: 700, color: "#64748b" }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: "12px 12px", fontWeight: 800, color: "#0f172a" }}>
                    {st.studentName}
                  </td>
                  <td style={{ padding: "12px 12px", color: "#2563eb", fontWeight: 600 }}>
                    {st.regNo}
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    <span style={{ background: "#eff6ff", border: "1px solid #dbeafe", color: "#1d4ed8", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>
                      {st.section || section || "Sec A"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 10px", color: "#475569", fontSize: 12 }}>
                    {st.batch || batch} • {st.branch || branch}
                  </td>
                  <td style={{ padding: "12px 8px", color: "#64748b", fontSize: 12, fontWeight: 600 }}>
                    Sem {st.semester || 6}
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    <span style={{ fontWeight: 800, color: "#059669", fontSize: 13 }}>{st.cgpa?.toFixed(2) || "N/A"}</span>
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    <span style={{ fontWeight: 800, color: "#0d9488", fontSize: 13 }}>{st.sgpa?.toFixed(2) || "N/A"}</span>
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    <span style={{ fontWeight: 800, color: "#d97706", fontSize: 13 }}>#{st.sectionCgpaRank || idx + 1}</span>
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    <span style={{ fontWeight: 800, color: "#7c3aed", fontSize: 13 }}>#{st.universityRank || "-"}</span>
                  </td>
                  <td style={{ padding: "12px 12px", fontSize: 11.5 }}>
                    {st.lastTopperEmailStatus === "SUCCESS" ? (
                      <span style={{ color: "#059669", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Check size={12} /> Sent {formatTimeAgo(st.lastTopperEmailSentAt)}
                      </span>
                    ) : st.lastTopperEmailStatus === "FAILED" ? (
                      <span style={{ color: "#ef4444", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <AlertTriangle size={12} /> Failed
                      </span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>Not Sent Yet</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 12px", textAlign: "center" }}>
                    <button
                      onClick={() => handleOpenEmailModal(st)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "6px 12px",
                        borderRadius: 8,
                        background: "#ecfdf5",
                        border: "1px solid #a7f3d0",
                        color: "#059669",
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      <Send size={11} /> {st.lastTopperEmailStatus === "SUCCESS" ? "Resend Email" : "Send Email"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Congratulate Email Modal */}
      <AnimatePresence>
        {selectedStudentForEmail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedStudentForEmail(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.4)",
              backdropFilter: "blur(6px)",
              zIndex: 10000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#ffffff",
                borderRadius: 20,
                padding: "26px 24px",
                maxWidth: 440,
                width: "100%",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                  {selectedStudentForEmail.lastTopperEmailStatus === "SUCCESS" ? "Resend Topper Certificate Email" : "Send Topper Certificate Email"}
                </h3>
                <button
                  onClick={() => setSelectedStudentForEmail(null)}
                  style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 10, marginBottom: 14, fontSize: 13 }}>
                <div>Recipient: <strong>{selectedStudentForEmail.studentName}</strong></div>
                <div style={{ color: "#64748b", fontSize: 12 }}>RegNo: {selectedStudentForEmail.regNo} · CGPA: {selectedStudentForEmail.cgpa}</div>
              </div>

              <form onSubmit={handleConfirmSendEmail}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
                    Student Email Address
                  </label>
                  <input
                    type="email"
                    value={customEmailInput}
                    onChange={(e) => setCustomEmailInput(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 10,
                      border: "1.5px solid #e2e8f0",
                      background: "#ffffff",
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {emailSuccessMsg && (
                  <div style={{ color: "#065f46", background: "#ecfdf5", padding: "8px 12px", borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
                    {emailSuccessMsg}
                  </div>
                )}
                {emailErrorMsg && (
                  <div style={{ color: "#991b1b", background: "#fef2f2", padding: "8px 12px", borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
                    {emailErrorMsg}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedStudentForEmail(null)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: 10,
                      background: "#f1f5f9",
                      color: "#475569",
                      border: "none",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingEmail}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: 10,
                      background: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: sendingEmail ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    {sendingEmail ? <Spinner size={14} /> : <Send size={14} />} {selectedStudentForEmail.lastTopperEmailStatus === "SUCCESS" ? "Resend Email" : "Send Email"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   5. BACKLOG TRACKER CARD
   ════════════════════════════════════════════════════════════════ */
function BacklogTrackerCard({ authHeaders, API }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ totalStudentsWithBacklogs: 0, totalBacklogsCount: 0, students: [], totalPages: 1, page: 1 });
  const [batch, setBatch] = useState("");
  const [branch, setBranch] = useState("");
  const [section, setSection] = useState("");
  const [semester, setSemester] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [expandedRegNo, setExpandedRegNo] = useState(null);
  const [selectedStudentForEmail, setSelectedStudentForEmail] = useState(null);
  const [customEmailInput, setCustomEmailInput] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState("");
  const [emailErrorMsg, setEmailErrorMsg] = useState("");
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const backlogCacheRef = useRef(new Map());

  function handleOpenEmailModal(st) {
    setSelectedStudentForEmail(st);
    setCustomEmailInput(`${st.regNo}@centurionuniv.edu.in`.toLowerCase());
    setEmailSuccessMsg("");
    setEmailErrorMsg("");
  }

  async function handleConfirmSendEmail(e) {
    e.preventDefault();
    if (!selectedStudentForEmail || sendingEmail) return;

    setSendingEmail(true);
    setEmailSuccessMsg("");
    setEmailErrorMsg("");

    let success = false;
    let resData = null;
    let errMessage = "";

    try {
      const res = await axios.post(
        `${API}/admin/backlogs/send-email`,
        {
          regNo: selectedStudentForEmail.regNo,
          customEmail: customEmailInput,
        },
        { headers: authHeaders?.headers, timeout: 30000 }
      );
      resData = res.data;
      success = true;
    } catch (err) {
      try {
        const res2 = await axios.post(
          "/api/send-backlog-email",
          {
            regNo: selectedStudentForEmail.regNo,
            customEmail: customEmailInput,
          },
          { timeout: 30000 }
        );
        resData = res2.data;
        success = true;
      } catch (err2) {
        errMessage = err.response?.data?.message || err2.response?.data?.message || "Failed to send email. Check SMTP setup.";
      }
    } finally {
      setSendingEmail(false);
    }

    if (success && resData) {
      setEmailSuccessMsg(resData.message || `Notification email sent to ${customEmailInput}`);
      axios
        .post(`${API}/admin/backlogs/email-status`, { regNo: selectedStudentForEmail.regNo, status: "SUCCESS" }, authHeaders)
        .catch(() => {});

      setData((prev) => ({
        ...prev,
        students: (prev.students || []).map((st) => {
          if (st.regNo === selectedStudentForEmail.regNo) {
            return {
              ...st,
              lastEmailStatus: "SUCCESS",
              lastEmailSentAt: new Date().toISOString(),
              lastEmailError: null,
            };
          }
          return st;
        }),
      }));
    } else {
      setEmailErrorMsg(errMessage || "Failed to send email");
      axios
        .post(`${API}/admin/backlogs/email-status`, { regNo: selectedStudentForEmail.regNo, status: "FAILED", errorMsg: errMessage }, authHeaders)
        .catch(() => {});
    }
  }

  async function fetchBacklogs(targetPage = page, searchQuery = search, overrideFilters = null, forceRefresh = false) {
    const activeBatch = overrideFilters ? overrideFilters.batch : batch;
    const activeBranch = overrideFilters ? overrideFilters.branch : branch;
    const activeSection = overrideFilters ? overrideFilters.section : section;
    const activeSemester = overrideFilters ? overrideFilters.semester : semester;
    const activeSearch = searchQuery !== undefined ? searchQuery : (overrideFilters ? overrideFilters.search : search);
    const activePage = targetPage || 1;

    const cacheKey = `${activePage}_${activeBatch}_${activeBranch}_${activeSection}_${activeSemester}_${activeSearch}_${limit}`;

    if (!forceRefresh && backlogCacheRef.current.has(cacheKey)) {
      setData(backlogCacheRef.current.get(cacheKey));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeBatch) params.append("batch", activeBatch);
      if (activeBranch) params.append("branch", activeBranch);
      if (activeSection) params.append("section", activeSection);
      if (activeSemester) params.append("semester", activeSemester);
      if (activeSearch) params.append("search", activeSearch);
      params.append("page", activePage);
      params.append("limit", limit);

      const res = await axios.get(`${API}/admin/backlogs?${params}`, authHeaders);
      const resData = res.data || { totalStudentsWithBacklogs: 0, totalBacklogsCount: 0, students: [], totalPages: 1, page: 1 };
      backlogCacheRef.current.set(cacheKey, resData);
      setData(resData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBacklogs(1);
  }, [batch, branch, section, semester, limit]);

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 18,
        padding: isMobile ? "16px 14px" : "24px 20px",
        marginBottom: 28,
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.02)",
      }}
    >
      {/* Header Metric Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 20 }}>
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ fontSize: 11.5, color: "#991b1b", fontWeight: 700, textTransform: "uppercase" }}>
            Students with Backlogs
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#ef4444", marginTop: 4 }}>
            {data.totalStudentsWithBacklogs?.toLocaleString()}
          </div>
        </div>

        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ fontSize: 11.5, color: "#92400e", fontWeight: 700, textTransform: "uppercase" }}>
            Total Backlog Subjects
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#d97706", marginTop: 4 }}>
            {data.totalBacklogsCount?.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Dedicated Filter & Search Control Box */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          padding: "14px 16px",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "minmax(220px, 1.4fr) repeat(4, minmax(115px, 1fr)) auto",
            gap: 10,
            alignItems: "end",
          }}
        >
          {/* Search Input */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Search Records</label>
            <div style={{ position: "relative", width: "100%" }}>
              <Search size={14} color="#64748b" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Search student / RegNo / Subject..."
                value={search}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearch(val);
                  if (val === "") {
                    fetchBacklogs(1, "");
                  }
                }}
                onKeyDown={(e) => e.key === "Enter" && fetchBacklogs(1, search)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 32px",
                  borderRadius: 8,
                  border: "1.5px solid #cbd5e1",
                  background: "#ffffff",
                  fontSize: 12.5,
                  color: "#0f172a",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Batch Select */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Batch</label>
            <select
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1.5px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <option value="">All Batches</option>
              <option value="2024">Batch 2024</option>
              <option value="2023">Batch 2023</option>
              <option value="2022">Batch 2022</option>
              <option value="2021">Batch 2021</option>
              <option value="2020">Batch 2020</option>
            </select>
          </div>

          {/* Branch Select */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Branch</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1.5px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <option value="">All Branches</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="ME">ME</option>
              <option value="CIVIL">CIVIL</option>
              <option value="EEE">EEE</option>
              <option value="AERO">AERO</option>
              <option value="BIO">BIO</option>
              <option value="MI">MI</option>
            </select>
          </div>

          {/* Section Select (Only A through L) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Section</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1.5px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <option value="">All Sections</option>
              <option value="Sec A">Section A</option>
              <option value="Sec B">Section B</option>
              <option value="Sec C">Section C</option>
              <option value="Sec D">Section D</option>
              <option value="Sec E">Section E</option>
              <option value="Sec F">Section F</option>
              <option value="Sec G">Section G</option>
              <option value="Sec H">Section H</option>
              <option value="Sec I">Section I</option>
              <option value="Sec J">Section J</option>
              <option value="Sec K">Section K</option>
              <option value="Sec L">Section L</option>
            </select>
          </div>

          {/* Semester Select */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1.5px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <option value="">All Semesters</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
              <option value="5">Semester 5</option>
              <option value="6">Semester 6</option>
              <option value="7">Semester 7</option>
              <option value="8">Semester 8</option>
            </select>
          </div>

          {/* Search Button */}
          <button
            onClick={() => fetchBacklogs(1, search)}
            style={{
              width: isMobile ? "100%" : "auto",
              padding: "9px 20px",
              borderRadius: 8,
              background: "#0f172a",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 12.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              cursor: "pointer",
              border: "none",
              whiteSpace: "nowrap",
              height: 38,
            }}
          >
            <Search size={13} /> Search
          </button>
        </div>
      </div>

      {/* Backlogs Content */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "30px 0", color: "#64748b" }}>
          <Spinner size={24} /> Loading backlog dataset...
        </div>
      ) : data.students?.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8", fontSize: 13 }}>
          No backlog records found.
        </div>
      ) : isMobile ? (
        /* Mobile Card View (Zero Horizontal Scrolling) */
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.students.map((st, idx) => {
            const isExpanded = expandedRegNo === st.regNo;
            return (
              <div
                key={st.regNo || idx}
                style={{
                  background: "#f8fafc",
                  border: isExpanded ? "1.5px solid #fca5a5" : "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  transition: "border 0.2s",
                }}
              >
                {/* Header Row: Rank, Student Info, Total Backlogs */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "#fee2e2",
                        color: "#dc2626",
                        fontWeight: 800,
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      #{(page - 1) * limit + idx + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 14 }}>{st.studentName}</div>
                      <div style={{ fontSize: 12, color: "#2563eb", fontWeight: 600 }}>{st.regNo}</div>
                    </div>
                  </div>

                  <span style={{ fontWeight: 800, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", padding: "3px 8px", borderRadius: 6, fontSize: 11.5, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <AlertTriangle size={12} color="#dc2626" /> {st.totalBacklogs || st.backlogs?.length || 0} Backlogs
                  </span>
                </div>

                {/* Badges Row */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#475569", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>
                    {st.branch || "CSE"}
                  </span>
                  <span style={{ background: "#eff6ff", border: "1px solid #dbeafe", color: "#1d4ed8", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>
                    BATCH {st.batch || "N/A"}
                  </span>
                  <span style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>
                    SEC {st.section || "N/A"}
                  </span>
                </div>

                {/* Rank & CGPA Metrics */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", padding: "8px 10px", borderRadius: 8, border: "1px solid #f1f5f9", fontSize: 12 }}>
                  <span style={{ color: "#d97706", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Trophy size={13} color="#d97706" /> Uni #{st.rankInfo?.universityRank || st.rankInfo?.cgpaRank || "-"} · Branch #{st.rankInfo?.deptRank || st.rankInfo?.deptCgpaRank || "-"}
                  </span>
                  <span style={{ fontWeight: 800, color: "#0f172a" }}>
                    CGPA: {st.rankInfo?.cgpa?.toFixed(2) || (st.cgpa ? st.cgpa.toFixed(2) : "0.00")}
                  </span>
                </div>

                {/* Semester Breakdown Chips */}
                {st.semBreakdown && Object.keys(st.semBreakdown).length > 0 && (
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                    {Object.entries(st.semBreakdown).map(([sem, count]) => (
                      <span
                        key={sem}
                        style={{
                          background: "#fffbeb",
                          border: "1px solid #fde68a",
                          color: "#b45309",
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 6,
                        }}
                      >
                        Sem {sem}: {count}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons: Email & Toggle Details */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button
                    onClick={() => handleOpenEmailModal(st)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 8,
                      background: "#ecfdf5",
                      border: "1px solid #a7f3d0",
                      color: "#059669",
                      fontSize: 12,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 5,
                      cursor: "pointer",
                    }}
                  >
                    <Mail size={12} /> {st.lastEmailStatus === "SUCCESS" ? "Resend Email" : "Send Email"}
                  </button>

                  <button
                    onClick={() => setExpandedRegNo(isExpanded ? null : st.regNo)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 8,
                      background: isExpanded ? "#0f172a" : "#ffffff",
                      border: "1px solid #cbd5e1",
                      color: isExpanded ? "#ffffff" : "#0f172a",
                      fontSize: 12,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      cursor: "pointer",
                    }}
                  >
                    {isExpanded ? (
                      <><ChevronUp size={12} /> Hide Details</>
                    ) : (
                      <><ChevronDown size={12} /> View Backlogs ({st.totalBacklogs || st.backlogs?.length || 0})</>
                    )}
                  </button>
                </div>

                {/* Email Sent Status Info */}
                {st.lastEmailStatus === "SUCCESS" && (
                  <div style={{ fontSize: 11, color: "#059669", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                    <Check size={12} /> Sent {formatTimeAgo(st.lastEmailSentAt)}
                  </div>
                )}

                {/* Expanded Backlog Subjects Accordion */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: "hidden", marginTop: 4 }}
                    >
                      <div style={{ background: "#ffffff", border: "1px solid #fee2e2", borderRadius: 12, padding: "12px 14px" }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "#dc2626", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                          <BookOpen size={14} color="#dc2626" /> Backlog Subjects for {st.studentName} ({st.regNo}):
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                          {st.backlogs?.map((sub, sIdx) => (
                            <div
                              key={sIdx}
                              style={{
                                background: "#fffafb",
                                border: "1px solid #fee2e2",
                                borderRadius: 8,
                                padding: "8px 10px",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb" }}>Sem {sub.semester || 1}</span>
                                <span style={{ fontSize: 11, fontWeight: 800, color: "#dc2626" }}>Grade: {sub.grade || "F"}</span>
                              </div>
                              <div style={{ fontWeight: 800, fontSize: 12, color: "#0f172a", margin: "4px 0", textTransform: "uppercase" }}>
                                {sub.subName}
                              </div>
                              <div style={{ fontSize: 10.5, color: "#64748b" }}>
                                Code: <strong>{sub.subCode}</strong> · Credits: <strong>{sub.credit || 3}</strong>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      ) : (
        /* Desktop Table with Rich Expandable Rows */
        <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                <th style={{ padding: "12px 10px", fontWeight: 700, width: 35 }}>#</th>
                <th style={{ padding: "12px 12px", fontWeight: 700 }}>REGISTRATION NO & STUDENT NAME</th>
                <th style={{ padding: "12px 10px", fontWeight: 700 }}>BRANCH / BATCH / SECTION</th>
                <th style={{ padding: "12px 10px", fontWeight: 700 }}>LEADERBOARD RANK & CGPA</th>
                <th style={{ padding: "12px 10px", fontWeight: 700 }}>TOTAL BACKLOGS</th>
                <th style={{ padding: "12px 10px", fontWeight: 700 }}>SEMESTER BREAKDOWN</th>
                <th style={{ padding: "12px 12px", fontWeight: 700, textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {data.students.map((st, idx) => {
                const isExpanded = expandedRegNo === st.regNo;
                return (
                  <Fragment key={st.regNo || idx}>
                    <tr
                      style={{
                        borderBottom: isExpanded ? "none" : "1px solid #f1f5f9",
                        background: isExpanded ? "#fffafb" : "transparent",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isExpanded) e.currentTarget.style.background = "#f8fafc";
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <td style={{ padding: "14px 10px", fontWeight: 800, color: "#dc2626" }}>
                        #{(page - 1) * limit + idx + 1}
                      </td>
                      <td style={{ padding: "14px 12px" }}>
                        <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 13 }}>{st.studentName}</div>
                        <div style={{ fontSize: 11.5, color: "#64748b" }}>{st.regNo}</div>
                      </td>
                      <td style={{ padding: "14px 10px" }}>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                          <span style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#475569", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6 }}>
                            {st.branch || "CSE"}
                          </span>
                          <span style={{ background: "#eff6ff", border: "1px solid #dbeafe", color: "#1d4ed8", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6 }}>
                            BATCH {st.batch || "N/A"}
                          </span>
                          <span style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6 }}>
                            SEC {st.section || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 10px" }}>
                        <div style={{ color: "#d97706", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                          <Trophy size={13} color="#d97706" /> Uni #{st.rankInfo?.universityRank || st.rankInfo?.cgpaRank || "-"} · Branch #{st.rankInfo?.deptRank || st.rankInfo?.deptCgpaRank || "-"}
                        </div>
                        <div style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600, marginTop: 2 }}>
                          CGPA: <strong style={{ color: "#0f172a" }}>{st.rankInfo?.cgpa?.toFixed(2) || (st.cgpa ? st.cgpa.toFixed(2) : "0.00")}</strong>
                        </div>
                      </td>
                      <td style={{ padding: "14px 10px" }}>
                        <span style={{ fontWeight: 800, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", padding: "3px 8px", borderRadius: 6, fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <AlertTriangle size={12} color="#dc2626" /> {st.totalBacklogs || st.backlogs?.length || 0} Backlogs
                        </span>
                        {st.lastEmailStatus === "SUCCESS" && (
                          <div style={{ fontSize: 11, color: "#059669", fontWeight: 700, marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}>
                            <Check size={11} /> Sent {formatTimeAgo(st.lastEmailSentAt)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "14px 10px" }}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", maxWidth: 220 }}>
                          {st.semBreakdown && Object.keys(st.semBreakdown).length > 0 ? (
                            Object.entries(st.semBreakdown).map(([sem, count]) => (
                              <span
                                key={sem}
                                style={{
                                  background: "#fffbeb",
                                  border: "1px solid #fde68a",
                                  color: "#b45309",
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  padding: "1px 6px",
                                  borderRadius: 5,
                                }}
                              >
                                Sem {sem}: {count}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>-</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "14px 12px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                          <button
                            onClick={() => handleOpenEmailModal(st)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 8,
                              background: "#ecfdf5",
                              border: "1px solid #a7f3d0",
                              color: "#059669",
                              fontSize: 11.5,
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              cursor: "pointer",
                            }}
                          >
                            <Mail size={11} /> {st.lastEmailStatus === "SUCCESS" ? "Resend Email" : "Send Email"}
                          </button>

                          <button
                            onClick={() => setExpandedRegNo(isExpanded ? null : st.regNo)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 8,
                              background: isExpanded ? "#0f172a" : "#ffffff",
                              border: "1px solid #cbd5e1",
                              color: isExpanded ? "#ffffff" : "#0f172a",
                              fontSize: 11.5,
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              cursor: "pointer",
                            }}
                          >
                            {isExpanded ? <><ChevronUp size={12} /> Hide Details</> : <><ChevronDown size={12} /> View Backlogs</>}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Accordion Row for Backlog Subjects Grid */}
                    {isExpanded && (
                      <tr style={{ background: "#fffafb", borderBottom: "1px solid #fecaca" }}>
                        <td colSpan={7} style={{ padding: "12px 18px 20px" }}>
                          <div style={{ background: "#ffffff", border: "1px solid #fee2e2", borderRadius: 12, padding: "16px 18px" }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#dc2626", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                              <BookOpen size={14} color="#dc2626" /> Backlog Subjects for {st.studentName} ({st.regNo}):
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                              {st.backlogs?.map((sub, sIdx) => (
                                <div
                                  key={sIdx}
                                  style={{
                                    background: "#fffafb",
                                    border: "1px solid #fee2e2",
                                    borderRadius: 10,
                                    padding: "12px 14px",
                                    boxShadow: "0 1px 3px rgba(239,68,68,0.04)",
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "2px 7px", borderRadius: 6 }}>
                                      Sem {sub.semester || 1}
                                    </span>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: "#dc2626" }}>
                                      Grade: {sub.grade || "F"}
                                    </span>
                                  </div>
                                  <div style={{ fontWeight: 800, fontSize: 12.5, color: "#0f172a", margin: "8px 0 6px", textTransform: "uppercase", lineHeight: 1.3 }}>
                                    {sub.subName}
                                  </div>
                                  <div style={{ fontSize: 11, color: "#64748b" }}>
                                    Code: <strong style={{ color: "#334155" }}>{sub.subCode}</strong> · Credits: <strong style={{ color: "#334155" }}>{sub.credit || 3}</strong>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {data.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 12.5, color: "#64748b" }}>
            Showing page <strong>{data.page}</strong> of <strong>{data.totalPages}</strong> ({data.totalStudentsWithBacklogs} total students)
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              disabled={page <= 1}
              onClick={() => {
                const prev = Math.max(1, page - 1);
                setPage(prev);
                fetchBacklogs(prev);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: page <= 1 ? "#f8fafc" : "#ffffff",
                color: page <= 1 ? "#94a3b8" : "#0f172a",
                fontSize: 12,
                fontWeight: 600,
                cursor: page <= 1 ? "not-allowed" : "pointer",
              }}
            >
              Previous
            </button>
            <button
              disabled={page >= data.totalPages}
              onClick={() => {
                const next = page + 1;
                setPage(next);
                fetchBacklogs(next);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: page >= data.totalPages ? "#f8fafc" : "#ffffff",
                color: page >= data.totalPages ? "#94a3b8" : "#0f172a",
                fontSize: 12,
                fontWeight: 600,
                cursor: page >= data.totalPages ? "not-allowed" : "pointer",
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Backlog Notification Email Modal */}
      <AnimatePresence>
        {selectedStudentForEmail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedStudentForEmail(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.4)",
              backdropFilter: "blur(6px)",
              zIndex: 10000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#ffffff",
                borderRadius: 20,
                padding: "26px 24px",
                maxWidth: 440,
                width: "100%",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                  {selectedStudentForEmail.lastEmailStatus === "SUCCESS" ? "Resend Backlog Notification Email" : "Send Backlog Notification Email"}
                </h3>
                <button
                  onClick={() => setSelectedStudentForEmail(null)}
                  style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ background: "#fffafb", border: "1px solid #fee2e2", padding: "10px 14px", borderRadius: 10, marginBottom: 14, fontSize: 13 }}>
                <div>Recipient: <strong>{selectedStudentForEmail.studentName}</strong></div>
                <div style={{ color: "#dc2626", fontSize: 12, fontWeight: 700, marginTop: 2 }}>
                  RegNo: {selectedStudentForEmail.regNo} · Backlogs: {selectedStudentForEmail.backlogCount || selectedStudentForEmail.backlogs?.length || 0} Subject(s)
                </div>
              </div>

              <form onSubmit={handleConfirmSendEmail}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
                    Student Email Address
                  </label>
                  <input
                    type="email"
                    value={customEmailInput}
                    onChange={(e) => setCustomEmailInput(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 10,
                      border: "1.5px solid #e2e8f0",
                      background: "#ffffff",
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {emailSuccessMsg && (
                  <div style={{ color: "#065f46", background: "#ecfdf5", padding: "8px 12px", borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
                    {emailSuccessMsg}
                  </div>
                )}
                {emailErrorMsg && (
                  <div style={{ color: "#991b1b", background: "#fef2f2", padding: "8px 12px", borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
                    {emailErrorMsg}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedStudentForEmail(null)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: 10,
                      background: "#f1f5f9",
                      color: "#475569",
                      border: "none",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingEmail}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: 10,
                      background: "#dc2626",
                      color: "#ffffff",
                      border: "none",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: sendingEmail ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    {sendingEmail ? <Spinner size={14} /> : <Mail size={14} />} {selectedStudentForEmail.lastEmailStatus === "SUCCESS" ? "Resend Email" : "Send Email"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   6. FEEDBACK MANAGER
   ════════════════════════════════════════════════════════════════ */
function FeedbackManager({ authHeaders, API }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const feedbackCacheRef = useRef(null);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  async function fetchFeedbacks(forceRefresh = false) {
    if (!forceRefresh && feedbackCacheRef.current) {
      setFeedbacks(feedbackCacheRef.current);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/feedback`);
      feedbackCacheRef.current = data;
      setFeedbacks(data);
    } catch (e) {
      setErr("Failed to load feedbacks");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this feedback?")) return;
    try {
      await axios.delete(`${API}/feedback/${id}`, authHeaders);
      setMsg("Feedback deleted successfully");
      fetchFeedbacks(true);
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to delete");
    }
  }

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 18,
        padding: "24px 20px",
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.02)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <MessageSquare size={18} />
        </div>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Student Feedback & Reviews
          </h3>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            Total {feedbacks.length} submissions received
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {feedbacks.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: 13 }}>No student feedback submitted yet.</p>
        ) : (
          feedbacks.map((fb) => (
            <div
              key={fb._id}
              style={{
                border: "1px solid #f1f5f9",
                borderRadius: 12,
                padding: "16px",
                background: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <strong style={{ fontSize: 14, color: "#0f172a" }}>{fb.name}</strong>
                  {fb.regNo && <span style={{ color: "#64748b", fontSize: 12, marginLeft: 8 }}>({fb.regNo})</span>}
                </div>
                <button
                  onClick={() => handleDelete(fb._id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 8 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    fill={i < fb.rating ? "#f59e0b" : "none"}
                    color={i < fb.rating ? "#f59e0b" : "#cbd5e1"}
                  />
                ))}
              </div>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, margin: 0 }}>{fb.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   7. MAIN ADMIN DASHBOARD SHELL
   ════════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const { adminToken, adminLogout, API: ctxAPI } = useApp();
  const navigate = useNavigate();
  const API = ctxAPI || import.meta.env.VITE_API_URL || "/api";

  const authHeaders = {
    headers: { Authorization: `Bearer ${adminToken}` },
  };

  const [stats, setStats] = useState(null);
  const [rankSem, setRankSem] = useState("");
  const [rankMsg, setRankMsg] = useState("");
  const [rankErr, setRankErr] = useState("");
  const [regenAllMsg, setRegenAllMsg] = useState("");
  const [regenAllErr, setRegenAllErr] = useState("");
  const [regenAllLoading, setRegenAllLoading] = useState(false);
  const [clearCacheMsg, setClearCacheMsg] = useState("");
  const [clearCacheErr, setClearCacheErr] = useState("");
  const [clearCacheLoading, setClearCacheLoading] = useState(false);
  const [tab, setTab] = useState("overview");
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [selectedBatchFilter, setSelectedBatchFilter] = useState("all");
  const [showBatchPills, setShowBatchPills] = useState(false);
  const [purgeLogs, setPurgeLogs] = useState([]);

  useEffect(() => {
    if (!adminToken) {
      navigate("/admin");
      return;
    }
    fetchStats();
    fetchPurgeLogs();
  }, [adminToken]);

  async function fetchStats() {
    try {
      const { data } = await axios.get(`${API}/admin/stats`, authHeaders);
      setStats(data);
    } catch {}
  }

  async function fetchPurgeLogs() {
    try {
      const { data } = await axios.get(`${API}/admin/purge-logs`, authHeaders);
      setPurgeLogs(data || []);
    } catch {}
  }

  async function regenAllRankings() {
    if (
      !window.confirm(
        "Regenerate ALL rankings for ALL semesters? This recalculates SGPA & CGPA from raw subjects."
      )
    )
      return;
    setRegenAllMsg("");
    setRegenAllErr("");
    setRegenAllLoading(true);
    try {
      const { data } = await axios.post(
        `${API}/admin/rankings/regenerate-all`,
        {},
        authHeaders
      );
      setRegenAllMsg(data.message);
      fetchStats();
    } catch (e) {
      setRegenAllErr(e.response?.data?.message || "Failed");
    } finally {
      setRegenAllLoading(false);
    }
  }

  async function clearServerCache() {
    setClearCacheMsg("");
    setClearCacheErr("");
    setClearCacheLoading(true);
    try {
      const { data } = await axios.post(
        `${API}/admin/cache/clear`,
        {},
        authHeaders
      );
      setClearCacheMsg(data.message);
    } catch (e) {
      setClearCacheErr(e.response?.data?.message || "Failed to clear cache");
    } finally {
      setClearCacheLoading(false);
    }
  }

  const ADMIN_TABS = [
    { id: "overview", label: "Upload Results", icon: <CloudUpload size={15} /> },
    { id: "missing-uploader", label: "Missing Students Ingestion", icon: <UserPlus size={15} /> },
    { id: "toppers", label: "Section Toppers", icon: <Trophy size={15} /> },
    { id: "backlogs", label: "Backlog Tracker", icon: <AlertTriangle size={15} /> },
    { id: "manage", label: "Manage Records", icon: <Database size={15} /> },
    { id: "feedback", label: "Student Feedback", icon: <MessageSquare size={15} /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        background: "#fcfdfe",
        minHeight: "100vh",
        color: "#0f172a",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        padding: isMobile ? "14px 12px 60px 12px" : "24px 20px 80px 20px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 1380, margin: "0 auto" }}>
        {/* ── Admin Top Navigation Header ── */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 18,
            padding: isMobile ? "14px 16px" : "18px 22px",
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            boxShadow: "0 2px 10px rgba(15, 23, 42, 0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.4px" }}>
                  Admin Control Console
                </h1>
                <span style={{ fontSize: 10.5, fontWeight: 700, background: "#ecfdf5", color: "#059669", padding: "2px 8px", borderRadius: 99 }}>
                  Active
                </span>
              </div>
              <p style={{ fontSize: 12.5, color: "#64748b", margin: "2px 0 0 0" }}>
                Manage institutional results, batch rankings, student grades, and server state.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={clearServerCache}
              disabled={clearCacheLoading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 10,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                color: "#0f172a",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
              title="Purge in-memory cache"
            >
              <RefreshCw size={14} className={clearCacheLoading ? "spin" : ""} />
              <span>{clearCacheLoading ? "Purging..." : "Clear Cache"}</span>
            </button>

            <button
              onClick={async () => {
                await adminLogout();
                navigate("/admin");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 10,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#ef4444",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>

        {/* ── 4 Top Metrics Stats Grid ── */}
        {stats && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
              marginBottom: 24,
            }}
          >
            {[
              {
                label: "Total Registered Students",
                value: stats.totalStudents?.toLocaleString(),
                icon: <Users size={18} color="#2563eb" />,
                bg: "#eff6ff",
                border: "#dbeafe",
              },
              {
                label: "Semester Result Records",
                value: stats.totalResults?.toLocaleString(),
                icon: <FileSpreadsheet size={18} color="#10b981" />,
                bg: "#ecfdf5",
                border: "#a7f3d0",
              },
              {
                label: "Active Academic Batches",
                value: stats.batchBreakdown?.length || 4,
                icon: <BookOpen size={18} color="#f59e0b" />,
                bg: "#fffbeb",
                border: "#fde68a",
              },
              {
                label: "Total Generated Rankings",
                value: stats.totalRankings?.toLocaleString() || "Synced",
                icon: <Trophy size={18} color="#8b5cf6" />,
                bg: "#f5f3ff",
                border: "#ede9fe",
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 16,
                  padding: "18px 20px",
                  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.02)",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: stat.bg,
                    border: `1px solid ${stat.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {stat.icon}
                </div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                    {stat.value}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Segmented Navigation Tabs ── */}
        <div
          style={{
            background: "#f1f5f9",
            borderRadius: 14,
            padding: 4,
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 4,
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {ADMIN_TABS.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: isActive ? "#ffffff" : "transparent",
                  color: isActive ? "#0f172a" : "#64748b",
                  fontSize: 13,
                  fontWeight: isActive ? 800 : 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.15s ease",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <span style={{ color: isActive ? "#2563eb" : "#64748b" }}>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: UPLOAD RESULTS & INTERNAL MARKS ── */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 16,
              }}
            >
              {/* Upload Main Results */}
              <UploadCard
                title="Upload Semester Results"
                icon={<CloudUpload size={20} />}
                endpoint="upload"
                API={API}
                authHeaders={authHeaders}
                onSuccess={fetchStats}
                extraFields={[
                  {
                    key: "batch",
                    label: "Batch Year *",
                    type: "select",
                    options: [
                      { label: "Batch 2021", value: "2021" },
                      { label: "Batch 2022", value: "2022" },
                      { label: "Batch 2023", value: "2023" },
                      { label: "Batch 2024", value: "2024" },
                      { label: "Batch 2025", value: "2025" },
                    ],
                  },
                  {
                    key: "semester",
                    label: "Semester Number *",
                    type: "select",
                    options: [
                      { label: "Semester 1", value: "1" },
                      { label: "Semester 2", value: "2" },
                      { label: "Semester 3", value: "3" },
                      { label: "Semester 4", value: "4" },
                      { label: "Semester 5", value: "5" },
                      { label: "Semester 6", value: "6" },
                      { label: "Semester 7", value: "7" },
                      { label: "Semester 8", value: "8" },
                    ],
                  },
                  {
                    key: "session",
                    label: "Academic Session",
                    type: "select",
                    options: ["2023-24", "2024-25", "2025-26"],
                  },
                ]}
              />

              {/* Upload Internal Marks */}
              <UploadCard
                title="Upload Internal Marks"
                icon={<FileEdit size={20} />}
                endpoint="upload-internal"
                API={API}
                authHeaders={authHeaders}
                onSuccess={fetchStats}
                extraFields={[
                  {
                    key: "batch",
                    label: "Batch Year *",
                    type: "select",
                    options: [
                      { label: "Batch 2021", value: "2021" },
                      { label: "Batch 2022", value: "2022" },
                      { label: "Batch 2023", value: "2023" },
                      { label: "Batch 2024", value: "2024" },
                      { label: "Batch 2025", value: "2025" },
                    ],
                  },
                  {
                    key: "semester",
                    label: "Semester Number *",
                    type: "select",
                    options: [
                      { label: "Semester 1", value: "1" },
                      { label: "Semester 2", value: "2" },
                      { label: "Semester 3", value: "3" },
                      { label: "Semester 4", value: "4" },
                      { label: "Semester 5", value: "5" },
                      { label: "Semester 6", value: "6" },
                      { label: "Semester 7", value: "7" },
                      { label: "Semester 8", value: "8" },
                    ],
                  },
                ]}
              />

              {/* Upload Backlog Clearances */}
              <UploadCard
                title="Upload Backlog Clearances"
                icon={<AlertTriangle size={20} />}
                endpoint="upload-backlogs"
                API={API}
                authHeaders={authHeaders}
                onSuccess={fetchStats}
                extraFields={[
                  {
                    key: "batch",
                    label: "Batch Year *",
                    type: "select",
                    options: [
                      { label: "Batch 2021", value: "2021" },
                      { label: "Batch 2022", value: "2022" },
                      { label: "Batch 2023", value: "2023" },
                      { label: "Batch 2024", value: "2024" },
                      { label: "Batch 2025", value: "2025" },
                    ],
                  },
                ]}
              />
            </div>

            {/* Recalculate Rankings Toolbar */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: "20px 22px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 14,
              }}
            >
              <div>
                <h4 style={{ margin: "0 0 4px 0", fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                  University Ranking Engine
                </h4>
                <p style={{ margin: 0, fontSize: 12.5, color: "#64748b" }}>
                  Recalculate SGPA, CGPA, and competition standing across all branches.
                </p>
              </div>

              <button
                onClick={regenAllRankings}
                disabled={regenAllLoading}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: regenAllLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <RefreshCw size={14} className={regenAllLoading ? "spin" : ""} />
                {regenAllLoading ? "Recalculating..." : "Regenerate All Rankings"}
              </button>
            </div>

            {/* ── BATCH-WISE ACTIVE STUDENT & RANKING BREAKDOWN (LIVE FROM BACKEND) ── */}
            {stats && stats.batchBreakdown && stats.batchBreakdown.length > 0 && (
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 18,
                  padding: isMobile ? "16px 14px" : "24px 20px",
                  boxShadow: "0 2px 10px rgba(15, 23, 42, 0.02)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "#eff6ff",
                        color: "#2563eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Layers size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16.5, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        Batch-Wise Active Student & Ranking Breakdown
                      </h3>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
                    Shows Registered vs Active Ranked Students on Leaderboard
                  </span>
                </div>

                {isMobile ? (
                  /* Mobile Card View (Zero Horizontal Scroll) */
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {stats.batchBreakdown.map((b) => (
                      <div
                        key={b.batch}
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: 14,
                          padding: "14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: 99,
                              background: "#eff6ff",
                              border: "1px solid #dbeafe",
                              color: "#2563eb",
                              fontWeight: 800,
                              fontSize: 12.5,
                            }}
                          >
                            Batch {b.batch}
                          </span>
                          <span
                            style={{
                              color: "#d97706",
                              fontWeight: 800,
                              fontSize: 12.5,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Trophy size={13} color="#d97706" /> {b.totalRankedStudents?.toLocaleString()} Active
                          </span>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: 8,
                            background: "#ffffff",
                            padding: "8px 10px",
                            borderRadius: 10,
                            border: "1px solid #f1f5f9",
                            textAlign: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Registered</div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>{b.totalStudents?.toLocaleString()}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Results</div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>{b.totalResults?.toLocaleString()}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Internal</div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>{b.totalInternal?.toLocaleString()}</div>
                          </div>
                        </div>

                        {b.semBreakdown && b.semBreakdown.length > 0 && (
                          <div>
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 5 }}>
                              Semester-Wise Students
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                              {b.semBreakdown.map((s) => (
                                <span
                                  key={s.semester}
                                  style={{
                                    background: "#ffffff",
                                    border: "1px solid #e2e8f0",
                                    padding: "3px 7px",
                                    borderRadius: 6,
                                    fontSize: 11,
                                    color: "#475569",
                                  }}
                                >
                                  Sem {s.semester}: <strong style={{ color: "#0f172a" }}>{s.studentCount}</strong>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Desktop Table View */
                  <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                          <th style={{ padding: "12px 14px", fontWeight: 700 }}>BATCH YEAR</th>
                          <th style={{ padding: "12px 14px", fontWeight: 700 }}>TOTAL REGISTERED STUDENTS</th>
                          <th style={{ padding: "12px 14px", fontWeight: 700 }}>ACTIVE RANKED STUDENTS</th>
                          <th style={{ padding: "12px 14px", fontWeight: 700 }}>SEMESTER-WISE STUDENT COUNT</th>
                          <th style={{ padding: "12px 14px", fontWeight: 700 }}>UPLOADED RESULTS</th>
                          <th style={{ padding: "12px 14px", fontWeight: 700 }}>INTERNAL MARKS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.batchBreakdown.map((b) => (
                          <tr
                            key={b.batch}
                            style={{ borderBottom: "1px solid #f1f5f9" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <td style={{ padding: "12px 14px" }}>
                              <span
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: 99,
                                  background: "#eff6ff",
                                  border: "1px solid #dbeafe",
                                  color: "#2563eb",
                                  fontWeight: 800,
                                  fontSize: 12,
                                }}
                              >
                                Batch {b.batch}
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px", fontWeight: 800, color: "#0f172a" }}>
                              {b.totalStudents?.toLocaleString()}
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <span style={{ color: "#d97706", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                <Trophy size={13} color="#d97706" /> {b.totalRankedStudents?.toLocaleString()} Active
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, maxWidth: 380 }}>
                                {b.semBreakdown?.map((s) => (
                                  <span
                                    key={s.semester}
                                    style={{
                                      background: "#f1f5f9",
                                      border: "1px solid #e2e8f0",
                                      padding: "3px 7px",
                                      borderRadius: 6,
                                      fontSize: 11,
                                      color: "#475569",
                                    }}
                                  >
                                    Sem {s.semester}: <strong style={{ color: "#0f172a" }}>{s.studentCount}</strong>
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td style={{ padding: "12px 14px", color: "#475569" }}>
                              {b.totalResults?.toLocaleString()}
                            </td>
                            <td style={{ padding: "12px 14px", color: "#475569" }}>
                              {b.totalInternal?.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── ADMIN SYSTEM GUIDE: ACTIVE VS REGISTERED & AUTO-SYNC ── */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 18,
                padding: isMobile ? "16px 14px" : "22px 20px",
                boxShadow: "0 2px 10px rgba(15, 23, 42, 0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <HelpCircle size={18} color="#2563eb" />
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                  Admin System Guide: Active vs. Registered Students & Auto-Sync
                </h4>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    background: "#eff6ff",
                    border: "1px solid #dbeafe",
                    borderRadius: 12,
                    padding: "14px 16px",
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 13, color: "#1e40af", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <Trophy size={14} color="#1d4ed8" /> Active Ranked Students (Leaderboard)
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "#3b82f6", lineHeight: 1.5 }}>
                    Students who have official semester results uploaded. They have calculated SGPA/CGPA and appear on University & Branch Leaderboards.
                  </p>
                </div>

                <div
                  style={{
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: 12,
                    padding: "14px 16px",
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 13, color: "#92400e", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <Info size={14} color="#b45309" /> Registered / Inactive Students
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "#b45309", lineHeight: 1.5 }}>
                    Students stored in DB (e.g. from internal marks or roll list) without semester exam results yet. Once their semester results are uploaded, they automatically become Active!
                  </p>
                </div>

                <div
                  style={{
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    borderRadius: 12,
                    padding: "14px 16px",
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 13, color: "#065f46", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <CheckCircle size={14} color="#10b981" /> Live Excel Auto-Update
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "#047857", lineHeight: 1.5 }}>
                    Whenever you upload any Excel file (Results, Internal Marks, or Backlogs), all batch stats, semester breakdowns, leaderboards, and backlog lists update automatically!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 1.5: MISSING & UNREGISTERED STUDENTS INGESTION TAB ── */}
        {tab === "missing-uploader" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Safe Ingestion Explanation Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)",
                border: "1.5px solid #c7d2fe",
                borderRadius: 18,
                padding: isMobile ? "16px 14px" : "20px 22px",
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: "#4f46e5",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 3px 10px rgba(79, 70, 229, 0.25)",
                }}
              >
                <ShieldCheck size={22} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 800, color: "#1e1b4b" }}>
                    Safe Missing Students Ingestion Engine
                  </h3>
                  <span
                    style={{
                      background: "#4338ca",
                      color: "#ffffff",
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: "2px 7px",
                      borderRadius: 6,
                      textTransform: "uppercase",
                    }}
                  >
                    Selective Filter
                  </span>
                </div>
                <p style={{ margin: "5px 0 0 0", fontSize: 13, color: "#3730a3", lineHeight: 1.5 }}>
                  Upload full semester results or internal mark sheets. GradeFlow will automatically scan the database: 
                  <strong> If a student has even 1 record in the database, they are completely SKIPPED</strong> (no overwriting). 
                  <strong> ONLY students who are totally absent from GradeFlow are inserted</strong>, with SGPA, credits, profiles, and rankings calculated automatically.
                </p>
              </div>
            </div>

            {/* Ingestion Upload Cards Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 16,
              }}
            >
              {/* Missing Semester Results Ingestion */}
              <MissingUploadCard
                title="Ingest Missing Semester Results"
                icon={<CloudUpload size={20} />}
                typeBadge="Results Mode"
                endpoint="upload-missing-results"
                API={API}
                authHeaders={authHeaders}
                onSuccess={fetchStats}
                extraFields={[
                  {
                    key: "batch",
                    label: "Batch Year *",
                    type: "select",
                    options: [
                      { label: "Batch 2021", value: "2021" },
                      { label: "Batch 2022", value: "2022" },
                      { label: "Batch 2023", value: "2023" },
                      { label: "Batch 2024", value: "2024" },
                      { label: "Batch 2025", value: "2025" },
                    ],
                  },
                  {
                    key: "semester",
                    label: "Semester Number *",
                    type: "select",
                    options: [
                      { label: "Semester 1", value: "1" },
                      { label: "Semester 2", value: "2" },
                      { label: "Semester 3", value: "3" },
                      { label: "Semester 4", value: "4" },
                      { label: "Semester 5", value: "5" },
                      { label: "Semester 6", value: "6" },
                      { label: "Semester 7", value: "7" },
                      { label: "Semester 8", value: "8" },
                    ],
                  },
                  {
                    key: "session",
                    label: "Academic Session",
                    type: "select",
                    options: ["2023-24", "2024-25", "2025-26"],
                  },
                ]}
              />

              {/* Missing Internal Marks Ingestion */}
              <MissingUploadCard
                title="Ingest Missing Internal Marks"
                icon={<FileEdit size={20} />}
                typeBadge="Internal Mode"
                endpoint="upload-missing-internal"
                API={API}
                authHeaders={authHeaders}
                onSuccess={fetchStats}
                extraFields={[
                  {
                    key: "batch",
                    label: "Batch Year *",
                    type: "select",
                    options: [
                      { label: "Batch 2021", value: "2021" },
                      { label: "Batch 2022", value: "2022" },
                      { label: "Batch 2023", value: "2023" },
                      { label: "Batch 2024", value: "2024" },
                      { label: "Batch 2025", value: "2025" },
                    ],
                  },
                  {
                    key: "semester",
                    label: "Semester Number *",
                    type: "select",
                    options: [
                      { label: "Semester 1", value: "1" },
                      { label: "Semester 2", value: "2" },
                      { label: "Semester 3", value: "3" },
                      { label: "Semester 4", value: "4" },
                      { label: "Semester 5", value: "5" },
                      { label: "Semester 6", value: "6" },
                      { label: "Semester 7", value: "7" },
                      { label: "Semester 8", value: "8" },
                    ],
                  },
                  {
                    key: "session",
                    label: "Academic Session",
                    type: "select",
                    options: ["2023-24", "2024-25", "2025-26"],
                  },
                ]}
              />
            </div>
          </div>
        )}

        {/* ── TAB 2: SECTION TOPPERS ── */}
        {tab === "toppers" && <SectionToppersCard authHeaders={authHeaders} API={API} />}

        {/* ── TAB 3: BACKLOG TRACKER ── */}
        {tab === "backlogs" && <BacklogTrackerCard authHeaders={authHeaders} API={API} />}

        {/* ── TAB 4: MANAGE RECORDS & MANUAL GRADE EDITS ── */}
        {tab === "manage" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
            <ManualGradeUpdateCard authHeaders={authHeaders} API={API} onSuccess={fetchStats} />
            <DeleteRecordCard authHeaders={authHeaders} API={API} onSuccess={fetchStats} />
          </div>
        )}

        {/* ── TAB 5: STUDENT FEEDBACK ── */}
        {tab === "feedback" && <FeedbackManager authHeaders={authHeaders} API={API} />}
      </div>

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </motion.div>
  );
}
