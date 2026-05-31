import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useApp } from "../context/AppContext";
import { Spinner } from "../components/LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Trash2, Settings, Users, FileText, FileEdit, Trophy, AlertTriangle, CheckCircle, FileSpreadsheet, LogOut, Database, CloudUpload } from "lucide-react";

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
      extraFields.forEach(f => {
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

  async function handleUpload() {
    if (!file) {
      setErr("Please select a file");
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

    // Simulate upload/processing progress for premium UX
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += Math.random() * 8 + 2; // Add 2-10%
      if (currentProgress > 95) currentProgress = 95;
      setProgress(Math.floor(currentProgress));
    }, 150);

    try {
      const fd = new FormData();
      fd.append("file", file);
      Object.entries(extra).forEach(([k, v]) => fd.append(k, v));
      
      const { data } = await axios.post(`${API}/admin/${endpoint}`, fd, {
        ...authHeaders,
        headers: {
          ...authHeaders.headers,
          "Content-Type": "multipart/form-data",
        }
      });
      
      clearInterval(progressInterval);
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
      clearInterval(progressInterval);
      setErr(e.response?.data?.message || "Upload failed");
      setLoading(false);
      setProgress(0);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ position: "relative", overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 20 }}>{icon}</span>
        <h3 style={{ fontWeight: 700, fontSize: 16 }}>{title}</h3>
      </div>

      {extraFields?.filter(f => !f.hidden).map((f) => (
        <div key={f.key} style={{ marginBottom: 12 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "var(--secondary)",
              marginBottom: 4,
            }}
          >
            {f.label}
          </label>
          {f.type === "select" ? (
            <select
              value={extra[f.key] || ""}
              onChange={(e) => setExtra({ ...extra, [f.key]: e.target.value })}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text-primary)" }}
            >
              <option value="" disabled style={{ background: "#1a1a1a", color: "#fff" }}>Select {f.label.replace(" *", "")}</option>
              {f.options?.map(opt => (
                <option key={opt.value || opt} value={opt.value || opt} style={{ background: "#1a1a1a", color: "#fff" }}>
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
            />
          )}
        </div>
      ))}

      <motion.div
        whileHover={{ scale: 1.01 }}
        style={{
          border: `2px dashed ${file ? "var(--accent)" : "var(--border)"}`,
          borderRadius: 8,
          padding: "24px 16px",
          textAlign: "center",
          marginBottom: 12,
          cursor: "pointer",
          background: file ? "rgba(62,166,255,0.05)" : "transparent",
          transition: "all 0.3s"
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          {file ? <FileSpreadsheet size={28} color="var(--accent)" /> : <CloudUpload size={28} color="var(--secondary)" />}
          <p style={{ color: file ? "var(--accent)" : "var(--secondary)", fontSize: 13, fontWeight: file ? 600 : 400 }}>
            {file ? file.name : "Click or drag Excel file here"}
          </p>
        </div>
      </motion.div>

      <AnimatePresence>
        {err && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ color: "var(--danger)", fontSize: 13, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={14} /> {err}
          </motion.p>
        )}
        {msg && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ color: "var(--success)", fontSize: 13, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle size={14} /> {msg}
          </motion.p>
        )}
      </AnimatePresence>

      <div style={{ position: "relative" }}>
        <button
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={loading}
          style={{ width: "100%", justifyContent: "center", overflow: "hidden", position: "relative" }}
        >
          <span style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 8 }}>
            {loading ? <><Spinner size={14} /> Uploading... {progress}%</> : <><Upload size={16} /> Upload</>}
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
                background: "rgba(255,255,255,0.2)",
                zIndex: 1
              }}
            />
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ── Delete bad/stale record card ──────────────────────────────────────────
function DeleteRecordCard({ authHeaders, API, onSuccess }) {
  const [regNo, setRegNo] = useState("");
  const [semester, setSemester] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function handleDelete() {
    if (!regNo.trim() || !semester) {
      setErr("Both RegNo and Semester are required");
      return;
    }
    if (
      !window.confirm(
        `Delete Sem ${semester} record for ${regNo}? This cannot be undone.`,
      )
    )
      return;
    setLoading(true);
    setMsg("");
    setErr("");
    try {
      const { data } = await axios.delete(
        `${API}/admin/results/${regNo.trim()}/${semester}`,
        authHeaders,
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
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="card"
      style={{ border: "1px solid var(--danger, #ef4444)" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 20 }}><Trash2 color="var(--danger)" /></span>
        <h3 style={{ fontWeight: 700, fontSize: 16 }}>Delete Bad Record</h3>
      </div>
      <p style={{ fontSize: 12, color: "var(--secondary)", marginBottom: 14 }}>
        Remove a stale or incorrectly uploaded semester record from the
        database.
      </p>

      <div style={{ marginBottom: 12 }}>
        <label
          style={{
            display: "block",
            fontSize: 12,
            color: "var(--secondary)",
            marginBottom: 4,
          }}
        >
          Student Reg No
        </label>
        <input
          type="text"
          placeholder="e.g. 230301120327"
          value={regNo}
          onChange={(e) => setRegNo(e.target.value)}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label
          style={{
            display: "block",
            fontSize: 12,
            color: "var(--secondary)",
            marginBottom: 4,
          }}
        >
          Semester Number
        </label>
        <input
          type="number"
          min="1"
          max="12"
          placeholder="e.g. 9"
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
        />
      </div>

      <AnimatePresence>
        {err && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ color: "var(--danger)", fontSize: 13, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={14} /> {err}
          </motion.p>
        )}
        {msg && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ color: "var(--success)", fontSize: 13, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle size={14} /> {msg}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        className="btn btn-danger"
        onClick={handleDelete}
        disabled={loading}
        style={{ width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: 8 }}
      >
        {loading ? "Deleting..." : <><Trash2 size={16} /> Delete Record</>}
      </button>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { adminToken, adminLogout, authHeaders, API } = useApp();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [rankSem, setRankSem] = useState("");
  const [rankMsg, setRankMsg] = useState("");
  const [rankErr, setRankErr] = useState("");
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (!adminToken) {
      navigate("/admin");
      return;
    }
    fetchStats();
  }, [adminToken]);

  async function fetchStats() {
    try {
      const { data } = await axios.get(`${API}/admin/stats`, authHeaders);
      setStats(data);
    } catch {}
  }

  async function generateRankings() {
    if (!rankSem) {
      setRankErr("Enter semester");
      return;
    }
    setRankMsg("");
    setRankErr("");
    try {
      const { data } = await axios.post(
        `${API}/admin/rankings/generate`,
        { semester: rankSem },
        authHeaders,
      );
      setRankMsg(data.message);
    } catch (e) {
      setRankErr(e.response?.data?.message || "Failed");
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="page">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <p style={{ color: "var(--secondary)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <Settings size={14} /> Administration
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Admin Dashboard</h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn btn-danger"
          onClick={() => {
            adminLogout();
            navigate("/admin");
          }}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <LogOut size={16} /> Logout
        </motion.button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid-4" style={{ marginBottom: 28 }}>
          {[
            { label: "Students", value: stats.totalStudents, icon: <Users size={16} /> },
            {
              label: "Semester Results",
              value: stats.totalResults,
              icon: <FileText size={16} />,
            },
            {
              label: "Internal Records",
              value: stats.totalInternal,
              icon: <FileEdit size={16} />,
            },
            { label: "Rankings", value: stats.totalRankings, icon: <Trophy size={16} /> },
          ].map((s, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="stat-card" 
              key={s.label}
            >
              <span className="label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {s.icon} {s.label}
              </span>
              <span className="value" style={{ color: "var(--accent)" }}>
                {s.value?.toLocaleString()}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        {[
          ["overview", "Upload Results", <CloudUpload size={14} key="ov" />],
          ["rankings", "Rankings", <Trophy size={14} key="ra" />],
          ["manage", "Manage Records", <Database size={14} key="ma" />],
        ].map(([t, l, icon]) => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            {icon} {l}
          </button>
        ))}
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
      {/* Upload Tab */}
      {tab === "overview" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
            gap: 20,
          }}
        >
          <UploadCard
            title="Semester Results"
            icon={<FileText color="var(--accent)" size={24} />}
            endpoint="upload/results"
            API={API}
            authHeaders={authHeaders}
            onSuccess={fetchStats}
            extraFields={[
              {
                key: "semester",
                label: "Semester *",
                type: "select",
                options: [1, 2, 3, 4, 5, 6, 7, 8]
              },
              {
                key: "batch",
                label: "Batch",
                type: "select",
                options: ["2020", "2021", "2022", "2023", "2024", "2025", "2026"]
              },
              {
                key: "program",
                label: "Program",
                type: "select",
                options: ["B.Tech", "M.Tech", "BCA", "MCA", "BBA", "MBA", "B.Sc", "M.Sc", "Diploma"]
              },
              {
                key: "session",
                label: "Session",
                type: "select",
                options: ["2023-24", "2024-25", "2025-26", "2026-27", "2027-28"]
              },
            ]}
          />
          <UploadCard
            title="EOD / Backlog Results"
            icon={<FileText color="#a855f7" size={24} />}
            endpoint="upload/results"
            API={API}
            authHeaders={authHeaders}
            onSuccess={fetchStats}
            extraFields={[
              {
                key: "month",
                label: "Month",
                type: "select",
                options: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
              },
              {
                key: "year",
                label: "Year",
                type: "select",
                options: ["2023", "2024", "2025", "2026", "2027", "2028"]
              },
              {
                key: "phase",
                label: "Phase",
                type: "select",
                options: ["1", "2", "3", "4"]
              },
              {
                key: "program",
                label: "Program",
                type: "select",
                options: ["B.Tech", "M.Tech", "BCA", "MCA", "BBA", "MBA", "B.Sc", "M.Sc", "Diploma"]
              },
              {
                key: "uploadType",
                label: "Upload Type (Auto-filled)",
                type: "text",
                value: "eod",
                hidden: true,
              },
            ]}
          />
          <UploadCard
            title="Rechecking Results"
            icon={<FileText color="#f59e0b" size={24} />}
            endpoint="upload/results"
            API={API}
            authHeaders={authHeaders}
            onSuccess={fetchStats}
            extraFields={[
              {
                key: "semester",
                label: "Semester *",
                type: "select",
                options: [1, 2, 3, 4, 5, 6, 7, 8]
              },
              {
                key: "program",
                label: "Program",
                type: "select",
                options: ["B.Tech", "M.Tech", "BCA", "MCA", "BBA", "MBA", "B.Sc", "M.Sc", "Diploma"]
              },
              {
                key: "uploadType",
                label: "Upload Type (Auto-filled)",
                type: "text",
                value: "rechecking",
                hidden: true,
              },
            ]}
          />
          <UploadCard
            title="Internal Marks"
            icon={<FileEdit color="var(--accent)" size={24} />}
            endpoint="upload/internal"
            API={API}
            authHeaders={authHeaders}
            onSuccess={fetchStats}
            extraFields={[
              {
                key: "semester",
                label: "Semester *",
                type: "select",
                options: [1, 2, 3, 4, 5, 6, 7, 8]
              },
              {
                key: "program",
                label: "Program",
                type: "select",
                options: ["B.Tech", "M.Tech", "BCA", "MCA", "BBA", "MBA", "B.Sc", "M.Sc", "Diploma"]
              },
              {
                key: "session",
                label: "Session",
                type: "select",
                options: ["2023-24", "2024-25", "2025-26", "2026-27", "2027-28"]
              },
            ]}
          />
        </div>
      )}

      {/* Rankings Tab */}
      {tab === "rankings" && (
        <div className="card" style={{ maxWidth: 480 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <Trophy size={18} /> Generate Rankings
          </h3>
          <p
            style={{
              color: "var(--secondary)",
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            Generate rankings for all students in a semester based on SGPA.
          </p>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "var(--secondary)",
              marginBottom: 6,
            }}
          >
            Semester Number
          </label>
          <input
            type="number"
            min="1"
            max="12"
            value={rankSem}
            onChange={(e) => setRankSem(e.target.value)}
            placeholder="e.g. 6"
            style={{ marginBottom: 12 }}
          />
          <AnimatePresence>
            {rankErr && (
              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ color: "var(--danger)", fontSize: 13, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={14} /> {rankErr}
              </motion.p>
            )}
            {rankMsg && (
              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ color: "var(--success)", fontSize: 13, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle size={14} /> {rankMsg}
              </motion.p>
            )}
          </AnimatePresence>
          <button className="btn btn-primary" onClick={generateRankings}>
            Generate Rankings
          </button>
        </div>
      )}

      {/* Manage / Delete Tab */}
      {tab === "manage" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 20,
          }}
        >
          <DeleteRecordCard
            authHeaders={authHeaders}
            API={API}
            onSuccess={fetchStats}
          />
        </div>
      )}

      {/* Excel Format Guide */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card" style={{ marginTop: 28 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <FileSpreadsheet size={18} /> Excel Format Guide
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 16,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--accent)",
                marginBottom: 8,
              }}
            >
              Semester Results Columns:
            </p>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                color: "var(--secondary)",
                lineHeight: 2,
                wordWrap: "break-word",
                whiteSpace: "pre-wrap"
              }}
            >
              SI No | Reg_No | Name | Subject_Code | Subject_Name | Type |
              Credits | Grade
            </p>
            <p
              style={{ fontSize: 11, color: "var(--secondary)", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}
            >
              <AlertTriangle size={12} color="var(--warning)" /> Fill Semester, Batch, Branch, Session in the form above — not
              required in Excel.
            </p>
          </div>
          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#a855f7",
                marginBottom: 8,
              }}
            >
              Valid Grade Values:
            </p>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                color: "var(--secondary)",
                lineHeight: 2,
                wordWrap: "break-word",
                whiteSpace: "pre-wrap"
              }}
            >
              O (10) | E (9) | A (8) | B (7) | C (6) | D (5) | F (0) | R-Repeat
              (0) | S-Suppl (0) | M-Malpractice (0)
            </p>
          </div>
        </div>
      </motion.div>
      </motion.div>
    </motion.div>
  );
}
