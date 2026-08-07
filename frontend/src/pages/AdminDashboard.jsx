import { useState, useEffect, useRef, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useApp } from "../context/AppContext";
import { Spinner } from "../components/LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Trash2, Settings, Users, FileText, FileEdit, Trophy, AlertTriangle, CheckCircle, FileSpreadsheet, LogOut, Database, CloudUpload, MessageSquare, Edit2, X, ChevronDown, ChevronUp, BookOpen, Search, Filter, HelpCircle, Info } from "lucide-react";

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
            // Cap at 90% to leave room for server processing time
            setProgress(Math.min(90, Math.floor(percentCompleted * 0.9)));
          }
        }
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
          padding: "12px 16px",
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
      className="card"
      style={{ border: "1px solid rgba(16,185,129,0.35)", gridColumn: "1 / -1" }}
    >
      <h3 style={{ fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
        <FileEdit size={18} color="#10b981" /> Manual Student Grade Update
      </h3>
      <p style={{ color: "var(--secondary)", fontSize: 13, marginBottom: 16 }}>
        Select or search for a student by Registration Number or Name. Choose their subject and select the new grade.
        Recalculates SGPA, CGPA, Rankings, and instantly syncs the entire website!
      </p>

      <form onSubmit={handleUpdateGrade}>
        <div style={{ marginBottom: 16, position: "relative" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--secondary)", marginBottom: 6 }}>
            1. Search / Enter Registration Number or Name *
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. 230301120327 or JAGAN PARIDA"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedRegNo(e.target.value);
                }}
                style={{ width: "100%" }}
              />
              {studentSuggestions.length > 0 && (
                <ul
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    background: "var(--card-bg, #1f2937)",
                    border: "1px solid var(--border-color, rgba(255,255,255,0.1))",
                    borderRadius: 8,
                    maxHeight: 180,
                    overflowY: "auto",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                    listStyle: "none",
                    padding: 0,
                    margin: "4px 0 0 0",
                  }}
                >
                  {studentSuggestions.map((s) => (
                    <li
                      key={s.regNo}
                      onClick={() => fetchStudent(s.regNo)}
                      style={{
                        padding: "8px 12px",
                        cursor: "pointer",
                        fontSize: 13,
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(16,185,129,0.15)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <strong style={{ color: "#10b981" }}>{s.regNo}</strong> - {s.studentName} ({s.branch || "CSE"})
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fetchStudent(searchQuery)}
              disabled={loadingStudent}
              style={{ padding: "8px 16px", whiteSpace: "nowrap" }}
            >
              {loadingStudent ? "Searching..." : "Fetch Student"}
            </button>
          </div>
        </div>

        {studentDetails && (
          <div
            style={{
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.25)",
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              fontSize: 13,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14, color: "#10b981", marginBottom: 4 }}>
              👤 {studentDetails.studentName} ({studentDetails.regNo})
            </div>
            <div style={{ display: "flex", gap: 16, color: "var(--secondary)", fontSize: 12, flexWrap: "wrap" }}>
              <span>Branch: <strong>{studentDetails.branch}</strong></span>
              <span>Batch: <strong>{studentDetails.batch}</strong></span>
              <span>Total Semesters Uploaded: <strong>{studentDetails.semesters?.length || 0}</strong></span>
            </div>
          </div>
        )}

        {studentDetails && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--secondary)", marginBottom: 6 }}>
                  2. Select Semester *
                </label>
                <select
                  className="input-field"
                  value={selectedSem}
                  onChange={(e) => {
                    setSelectedSem(e.target.value);
                    setSelectedSubjectCode("");
                  }}
                  style={{ width: "100%" }}
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
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--secondary)", marginBottom: 6 }}>
                  3. Select Subject (Dropdown) *
                </label>
                <select
                  className="input-field"
                  value={selectedSubjectCode}
                  onChange={(e) => setSelectedSubjectCode(e.target.value)}
                  disabled={!selectedSem}
                  style={{ width: "100%" }}
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

            {availableSubjects.length > 3 && (
              <div style={{ marginBottom: 16 }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="🔍 Type to filter subject dropdown by code or name..."
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  style={{ width: "100%", fontSize: 12 }}
                />
              </div>
            )}

            {selectedSubjectCode && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, alignItems: "end", marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--secondary)", marginBottom: 6 }}>
                    4. Select New Grade *
                  </label>
                  <select
                    className="input-field"
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    style={{ width: "100%" }}
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
                    <option value="S">S (0 Grade Points - Satisfactory/0)</option>
                  </select>
                </div>

                <div>
                  <button
                    type="submit"
                    className="btn"
                    disabled={updatingGrade}
                    style={{
                      width: "100%",
                      background: "#10b981",
                      color: "#fff",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
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
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                color: "var(--danger)",
                fontSize: 13,
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(239,68,68,0.1)",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <AlertTriangle size={14} /> {err}
            </motion.p>
          )}
          {msg && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                color: "var(--success)",
                fontSize: 13,
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(16,185,129,0.1)",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid rgba(16,185,129,0.2)",
              }}
            >
              <CheckCircle size={14} /> {msg}
            </motion.p>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
}

function FeedbackManager({ authHeaders, API }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  async function fetchFeedbacks() {
    try {
      const { data } = await axios.get(`${API}/feedback`);
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
      fetchFeedbacks();
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to delete");
    }
  }

  function startEdit(fb) {
    setEditingId(fb._id);
    setEditForm({ name: fb.name, regNo: fb.regNo || "", rating: fb.rating, comment: fb.comment });
  }

  async function handleUpdate(e) {
    e.preventDefault();
    try {
      await axios.put(`${API}/feedback/${editingId}`, editForm, authHeaders);
      setMsg("Feedback updated successfully");
      setEditingId(null);
      fetchFeedbacks();
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to update");
    }
  }

  if (loading) return <div>Loading feedbacks...</div>;

  return (
    <div className="card">
      <h3 style={{ fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <MessageSquare size={18} /> Manage Feedback
      </h3>
      
      <AnimatePresence>
        {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ color: "var(--danger)", fontSize: 13, marginBottom: 10 }}>{err}</motion.p>}
        {msg && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ color: "var(--success)", fontSize: 13, marginBottom: 10 }}>{msg}</motion.p>}
      </AnimatePresence>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {feedbacks.length === 0 ? (
          <p style={{ color: "var(--secondary)", fontSize: 13 }}>No feedback found.</p>
        ) : (
          feedbacks.map(fb => (
            <div key={fb._id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16, background: "var(--bg-secondary)" }}>
              {editingId === fb._id ? (
                <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Name" required />
                  <input type="text" value={editForm.regNo} onChange={e => setEditForm({...editForm, regNo: e.target.value})} placeholder="Reg No" />
                  <input type="number" min="1" max="5" value={editForm.rating} onChange={e => setEditForm({...editForm, rating: e.target.value})} placeholder="Rating (1-5)" required />
                  <textarea value={editForm.comment} onChange={e => setEditForm({...editForm, comment: e.target.value})} placeholder="Comment" required style={{ minHeight: 80, padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text-primary)" }} />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: "8px 16px" }}>Save</button>
                    <button type="button" className="btn" onClick={() => setEditingId(null)} style={{ padding: "8px 16px" }}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <strong style={{ fontSize: 15 }}>{fb.name}</strong>
                      {fb.regNo && <span style={{ color: "var(--secondary)", fontSize: 12, marginLeft: 8 }}>({fb.regNo})</span>}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => startEdit(fb)} style={{ background: "transparent", border: "none", color: "var(--accent)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Edit2 size={14} /> Edit</button>
                      <button onClick={() => handleDelete(fb._id)} style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Trash2 size={14} /> Delete</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} style={{ color: i < fb.rating ? "#f59e0b" : "var(--border)", fontSize: 14 }}>★</span>
                    ))}
                  </div>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5 }}>{fb.comment}</p>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

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
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  useEffect(() => {
    setPage(1);
    fetchBacklogs(1);
  }, [batch, branch, section, semester, limit]);

  async function fetchBacklogs(targetPage = page, searchQuery = search) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (batch) params.append("batch", batch);
      if (branch) params.append("branch", branch);
      if (section) params.append("section", section);
      if (semester) params.append("semester", semester);
      if (searchQuery) params.append("search", searchQuery);
      params.append("page", targetPage);
      params.append("limit", limit);

      const res = await axios.get(`${API}/admin/backlogs?${params}`, authHeaders);
      setData(res.data || { totalStudentsWithBacklogs: 0, totalBacklogsCount: 0, students: [], totalPages: 1, page: 1 });
    } catch (e) {
      console.error("Backlog fetch error:", e);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    fetchBacklogs(1, search);
  }

  return (
    <div style={{ width: "100%" }}>
      {/* Header Summary Cards */}
      {(() => {
        const filterLabels = [];
        if (batch) filterLabels.push(`Batch ${batch}`);
        if (branch) filterLabels.push(`Branch ${branch}`);
        if (semester) filterLabels.push(`Sem ${semester}`);
        if (search) filterLabels.push(`"${search}"`);

        const filterSuffix = filterLabels.length > 0 ? ` (${filterLabels.join(" · ")})` : "";

        return (
          <div className="grid-2" style={{ marginBottom: 20, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            <div className="stat-card" style={{ borderLeft: "4px solid #ef4444" }}>
              <span className="label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={16} color="#ef4444" /> Students With Backlogs{filterSuffix}
              </span>
              <span className="value" style={{ color: "#ef4444" }}>
                {data.totalStudentsWithBacklogs?.toLocaleString()} Students
              </span>
            </div>

            <div className="stat-card" style={{ borderLeft: "4px solid #f59e0b" }}>
              <span className="label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <BookOpen size={16} color="#f59e0b" /> Total Backlog Subjects{filterSuffix}
              </span>
              <span className="value" style={{ color: "#f59e0b" }}>
                {data.totalBacklogsCount?.toLocaleString()} Backlogs
              </span>
            </div>
          </div>
        );
      })()}

      {/* Batch, Branch & Semester Breakdown Quick Filters */}
      {((data.batchBreakdownSummary && data.batchBreakdownSummary.length > 0) || (data.branchBreakdown && data.branchBreakdown.length > 0) || (data.semBreakdownSummary && data.semBreakdownSummary.length > 0)) && (
        <div className="card" style={{ padding: 14, marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Batch Pills */}
          {data.batchBreakdownSummary && data.batchBreakdownSummary.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginRight: 4, textTransform: "uppercase" }}>
                Batch-Wise:
              </span>
              <button
                onClick={() => setBatch("")}
                style={{
                  padding: "3px 10px",
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: !batch ? "1px solid #10b981" : "1px solid var(--border)",
                  background: !batch ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.04)",
                  color: !batch ? "#34d399" : "var(--text-secondary)",
                }}
              >
                All Batches
              </button>
              {data.batchBreakdownSummary.map((bt) => (
                <button
                  key={bt.batch}
                  onClick={() => setBatch(batch === bt.batch ? "" : bt.batch)}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    border: batch === bt.batch ? "1px solid #10b981" : "1px solid var(--border)",
                    background: batch === bt.batch ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.04)",
                    color: batch === bt.batch ? "#34d399" : "var(--text-secondary)",
                  }}
                >
                  Batch {bt.batch} ({bt.studentCount} Std / {bt.backlogCount} Bklg)
                </button>
              ))}
            </div>
          )}

          {/* Branch Pills */}
          {data.branchBreakdown && data.branchBreakdown.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginRight: 4, textTransform: "uppercase" }}>
                Branch-Wise:
              </span>
              <button
                onClick={() => setBranch("")}
                style={{
                  padding: "3px 10px",
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: !branch ? "1px solid var(--accent)" : "1px solid var(--border)",
                  background: !branch ? "rgba(59, 130, 246, 0.2)" : "rgba(255,255,255,0.04)",
                  color: !branch ? "#60a5fa" : "var(--text-secondary)",
                }}
              >
                All Branches
              </button>
              {data.branchBreakdown.map((br) => (
                <button
                  key={br.branch}
                  onClick={() => setBranch(branch === br.branch ? "" : br.branch)}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    border: branch === br.branch ? "1px solid var(--accent)" : "1px solid var(--border)",
                    background: branch === br.branch ? "rgba(59, 130, 246, 0.2)" : "rgba(255,255,255,0.04)",
                    color: branch === br.branch ? "#60a5fa" : "var(--text-secondary)",
                  }}
                >
                  {br.branch} ({br.studentCount} Std / {br.backlogCount} Bklg)
                </button>
              ))}
            </div>
          )}

          {/* Semester Pills */}
          {data.semBreakdownSummary && data.semBreakdownSummary.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginRight: 4, textTransform: "uppercase" }}>
                Semester-Wise:
              </span>
              <button
                onClick={() => setSemester("")}
                style={{
                  padding: "3px 10px",
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: !semester ? "1px solid #f59e0b" : "1px solid var(--border)",
                  background: !semester ? "rgba(245, 158, 11, 0.2)" : "rgba(255,255,255,0.04)",
                  color: !semester ? "#fbbf24" : "var(--text-secondary)",
                }}
              >
                All Semesters
              </button>
              {data.semBreakdownSummary.map((sm) => (
                <button
                  key={sm.semester}
                  onClick={() => setSemester(semester === String(sm.semester) ? "" : String(sm.semester))}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    border: semester === String(sm.semester) ? "1px solid #f59e0b" : "1px solid var(--border)",
                    background: semester === String(sm.semester) ? "rgba(245, 158, 11, 0.2)" : "rgba(255,255,255,0.04)",
                    color: semester === String(sm.semester) ? "#fbbf24" : "var(--text-secondary)",
                  }}
                >
                  Sem {sm.semester} ({sm.studentCount} Std / {sm.backlogCount} Bklg)
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Real-time Backlog Sync Banner */}
      <div style={{ background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 10 }}>
        <Info size={18} color="#60a5fa" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: "#fff" }}>Automatic Live Backlog Sync:</strong> When you upload new Backlog or Rechecking Excel sheets, cleared backlogs are automatically updated and active backlog counts/lists update here in real time!
        </div>
      </div>

      {/* Filter Toggle Button & Collapsible Panel */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "8px 16px" }}
          >
            <Filter size={14} /> Filter Backlogs {(batch || branch || section || semester || search) ? "(Active Filters)" : ""}
          </button>
          {(batch || branch || section || semester || search) && (
            <button
              onClick={() => {
                setBatch("");
                setBranch("");
                setSection("");
                setSemester("");
                setSearch("");
                setPage(1);
              }}
              style={{ background: "transparent", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {showFilterPanel && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
            style={{ padding: 16 }}
          >
            <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
                <input
                  type="text"
                  placeholder="Search Reg No or Student Name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field"
                  style={{ width: "100%", paddingLeft: 32 }}
                />
                <Search size={14} style={{ position: "absolute", left: 10, top: 12, color: "var(--text-muted)" }} />
              </div>

              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="input-field"
                style={{ width: 140 }}
              >
                <option value="">All Batches</option>
                <option value="2024">2024 Batch</option>
                <option value="2023">2023 Batch</option>
                <option value="2022">2022 Batch</option>
                <option value="2021">2021 Batch</option>
                <option value="2020">2020 Batch</option>
              </select>

              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="input-field"
                style={{ width: 140 }}
              >
                <option value="">All Branches</option>
                <option value="CSE">CSE</option>
                <option value="CIVIL">CIVIL</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="ME">ME</option>
                <option value="BIO">BIO</option>
                <option value="MI">MI</option>
                <option value="AERO">AERO</option>
              </select>

              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="input-field"
                style={{ width: 130 }}
              >
                <option value="">All Sections</option>
                <option value="Sec A">Sec A</option>
                <option value="Sec B">Sec B</option>
                <option value="Sec C">Sec C</option>
                <option value="Sec D">Sec D</option>
                <option value="Sec E">Sec E</option>
                <option value="Sec F">Sec F</option>
                <option value="Sec G">Sec G</option>
                <option value="Sec H">Sec H</option>
                <option value="Sec I">Sec I</option>
                <option value="Sec J">Sec J</option>
                <option value="Sec K">Sec K</option>
                <option value="Sec L">Sec L</option>
              </select>

              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="input-field"
                style={{ width: 140 }}
              >
                <option value="">All Semesters</option>
                <option value="1">Sem 1</option>
                <option value="2">Sem 2</option>
                <option value="3">Sem 3</option>
                <option value="4">Sem 4</option>
                <option value="5">Sem 5</option>
                <option value="6">Sem 6</option>
                <option value="7">Sem 7</option>
                <option value="8">Sem 8</option>
              </select>

              <button type="submit" className="btn-primary" style={{ padding: "8px 18px" }}>
                Search
              </button>
            </form>
          </motion.div>
        )}
      </div>

      {/* Backlog Leaderboard Table */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={18} color="#ef4444" /> Backlog Achievers Leaderboard (Highest Backlogs First)
          </h3>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {loading ? "Loading..." : `Showing Top ${data.students?.length || 0} Students`}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <Spinner />
          </div>
        ) : !data.students || data.students.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
            <CheckCircle size={32} color="#10b981" style={{ marginBottom: 8 }} />
            <p>No active backlog records found for this filter!</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 1050 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", color: "var(--text-muted)", width: 50, whiteSpace: "nowrap" }}>#</th>
                  <th style={{ padding: "10px 12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Registration No & Student Name</th>
                  <th style={{ padding: "10px 12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Branch / Batch / Section</th>
                  <th style={{ padding: "10px 12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Leaderboard Rank & CGPA</th>
                  <th style={{ padding: "10px 12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Total Backlogs</th>
                  <th style={{ padding: "10px 12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Semester Breakdown</th>
                  <th style={{ padding: "10px 12px", color: "var(--text-muted)", textAlign: "right", whiteSpace: "nowrap" }}>Backlog Details</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((st, idx) => {
                  const isExpanded = expandedRegNo === st.regNo;
                  return (
                    <Fragment key={st.regNo}>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "12px", fontWeight: 800, color: idx < 3 ? "#ef4444" : "var(--text-muted)", whiteSpace: "nowrap" }}>
                          #{idx + 1}
                        </td>
                        <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                          <div style={{ fontWeight: 700, color: "#fff" }}>{st.studentName}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{st.regNo}</div>
                        </td>
                        <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                          <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                            <span className="badge" style={{ background: "rgba(255,255,255,0.06)", whiteSpace: "nowrap" }}>
                              {st.branch || "N/A"}
                            </span>
                            <span className="badge" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", whiteSpace: "nowrap" }}>
                              Batch {st.batch}
                            </span>
                            <span className="badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399", whiteSpace: "nowrap" }}>
                              {st.section || "Sec A"}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                          {st.rankInfo ? (
                            <div>
                              <div style={{ fontWeight: 700, color: "#3ea6ff", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                                <Trophy size={13} color="#f59e0b" /> Uni #{st.rankInfo.universityRank || "N/A"} &middot; Branch #{st.rankInfo.departmentRank || "N/A"}
                              </div>
                              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                                CGPA: <strong style={{ color: "#fff" }}>{st.rankInfo.cgpa ? st.rankInfo.cgpa.toFixed(2) : "0.00"}</strong>
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Unranked</span>
                          )}
                        </td>
                        <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                          <span
                            style={{
                              background: "rgba(239, 68, 68, 0.15)",
                              color: "#f87171",
                              padding: "4px 10px",
                              borderRadius: 12,
                              fontWeight: 800,
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              display: "inline-block",
                              whiteSpace: "nowrap",
                            }}
                          >
                            ⚠️ {st.totalBacklogs} Backlog{st.totalBacklogs > 1 ? "s" : ""}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minWidth: 320 }}>
                            {Object.entries(st.semBreakdown || {}).map(([semNum, count]) => (
                              <span
                                key={semNum}
                                style={{
                                  background: "rgba(245, 158, 11, 0.15)",
                                  color: "#fbbf24",
                                  padding: "3px 8px",
                                  borderRadius: 6,
                                  fontSize: 11,
                                  border: "1px solid rgba(245, 158, 11, 0.3)",
                                  whiteSpace: "nowrap",
                                  display: "inline-block",
                                }}
                              >
                                Sem {semNum}: <strong>{count}</strong>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: "12px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <button
                            onClick={() => setExpandedRegNo(isExpanded ? null : st.regNo)}
                            className="btn-secondary"
                            style={{ padding: "4px 10px", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}
                          >
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            {isExpanded ? "Hide Details" : "View Subjects"}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Backlog Subject Details Drawer */}
                      {isExpanded && (
                        <tr style={{ background: "rgba(0,0,0,0.25)" }}>
                          <td colSpan={7} style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
                            <div style={{ fontWeight: 700, fontSize: 12, color: "#f87171", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                              <BookOpen size={14} /> Backlog Subjects for {st.studentName} ({st.regNo}):
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                              {st.backlogSubjects?.map((sub, sIdx) => (
                                <div
                                  key={sIdx}
                                  style={{
                                    background: "rgba(255, 255, 255, 0.03)",
                                    border: "1px solid rgba(239, 68, 68, 0.2)",
                                    borderRadius: 8,
                                    padding: 10,
                                    fontSize: 12,
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                    <span style={{ fontWeight: 700, color: "#60a5fa" }}>Sem {sub.semester}</span>
                                    <span style={{ fontWeight: 800, color: "#ef4444" }}>Grade: {sub.grade}</span>
                                  </div>
                                  <div style={{ fontWeight: 600, color: "#fff", marginBottom: 2 }}>{sub.subName}</div>
                                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
                                    Code: {sub.subCode} &middot; Credits: {sub.credit}
                                  </div>
                                </div>
                              ))}
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
        {data.totalPages > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border)", flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Page <strong>{data.page}</strong> of <strong>{data.totalPages}</strong> ({data.totalStudentsWithBacklogs?.toLocaleString()} Total Students With Backlogs)
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={() => {
                  const prev = Math.max(1, page - 1);
                  setPage(prev);
                  fetchBacklogs(prev);
                }}
                disabled={page <= 1 || loading}
                className="btn-secondary"
                style={{ padding: "6px 14px", fontSize: 12, opacity: page <= 1 ? 0.5 : 1, cursor: page <= 1 ? "not-allowed" : "pointer" }}
              >
                Previous
              </button>

              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
                {page} / {data.totalPages}
              </span>

              <button
                onClick={() => {
                  const next = Math.min(data.totalPages, page + 1);
                  setPage(next);
                  fetchBacklogs(next);
                }}
                disabled={page >= data.totalPages || loading}
                className="btn-secondary"
                style={{ padding: "6px 14px", fontSize: 12, opacity: page >= data.totalPages ? 0.5 : 1, cursor: page >= data.totalPages ? "not-allowed" : "pointer" }}
              >
                Next
              </button>

              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="input-field"
                style={{ width: 110, padding: "4px 8px", fontSize: 12 }}
              >
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
                <option value={200}>200 / page</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { adminToken, adminLogout, authHeaders, API } = useApp();
  const navigate = useNavigate();
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

  const [selectedBatchFilter, setSelectedBatchFilter] = useState("all");
  const [showBatchPills, setShowBatchPills] = useState(false);

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

  async function regenAllRankings() {
    if (!window.confirm("Regenerate ALL rankings for ALL semesters? This recalculates SGPA & CGPA from raw subjects and may take a moment.")) return;
    setRegenAllMsg("");
    setRegenAllErr("");
    setRegenAllLoading(true);
    try {
      const { data } = await axios.post(
        `${API}/admin/rankings/regenerate-all`,
        {},
        authHeaders,
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
        authHeaders,
      );
      setClearCacheMsg(data.message);
    } catch (e) {
      setClearCacheErr(e.response?.data?.message || "Failed to clear cache");
    } finally {
      setClearCacheLoading(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, ease: "easeOut" }} className="page">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: "1px solid var(--border)",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <p style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 800, marginBottom: 8, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase", letterSpacing: "1px" }}>
            <Settings size={12} /> Administration
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px" }}>Admin Dashboard</h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="btn btn-danger"
          onClick={() => {
            adminLogout();
            navigate("/admin");
          }}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <LogOut size={15} /> Logout
        </motion.button>
      </div>

      {/* Batch Filter Pills & Stats */}
      {stats && (
        <div style={{ marginBottom: 28 }}>
          {/* Batch Selector Collapsible Filter Bar */}
          {stats.batchBreakdown && stats.batchBreakdown.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                <button
                  onClick={() => setShowBatchPills(!showBatchPills)}
                  className="btn-secondary"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "8px 16px" }}
                >
                  <Filter size={14} /> Filter Stats by Batch {selectedBatchFilter !== "all" ? `(Active: Batch ${selectedBatchFilter})` : ""}
                </button>
                {selectedBatchFilter !== "all" && (
                  <button
                    onClick={() => setSelectedBatchFilter("all")}
                    style={{ background: "transparent", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                  >
                    Show All Batches
                  </button>
                )}
              </div>

              {showBatchPills && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card"
                  style={{ padding: 14, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}
                >
                  <button
                    onClick={() => setSelectedBatchFilter("all")}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      border: selectedBatchFilter === "all" ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: selectedBatchFilter === "all" ? "rgba(59, 130, 246, 0.2)" : "rgba(255,255,255,0.04)",
                      color: selectedBatchFilter === "all" ? "#60a5fa" : "var(--text-secondary)",
                      transition: "all 0.2s",
                    }}
                  >
                    All Batches ({stats.totalStudents?.toLocaleString()})
                  </button>
                  {stats.batchBreakdown.map((b) => (
                    <button
                      key={b.batch}
                      onClick={() => setSelectedBatchFilter(b.batch)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        border: selectedBatchFilter === b.batch ? "1px solid var(--accent)" : "1px solid var(--border)",
                        background: selectedBatchFilter === b.batch ? "rgba(59, 130, 246, 0.2)" : "rgba(255,255,255,0.04)",
                        color: selectedBatchFilter === b.batch ? "#60a5fa" : "var(--text-secondary)",
                        transition: "all 0.2s",
                      }}
                    >
                      Batch {b.batch} ({b.totalStudents} Reg / {b.totalRankedStudents} Active)
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          )}

          {/* Cards */}
          {(() => {
            const activeBatch = stats.batchBreakdown?.find((b) => b.batch === selectedBatchFilter);
            const isFiltered = selectedBatchFilter !== "all" && activeBatch;

            const displayStudents = isFiltered
              ? `${activeBatch.totalStudents} (${activeBatch.totalRankedStudents} Active)`
              : stats.totalStudents?.toLocaleString();

            const displayResults = isFiltered
              ? activeBatch.totalResults?.toLocaleString()
              : stats.totalResults?.toLocaleString();

            const displayInternal = isFiltered
              ? activeBatch.totalInternal?.toLocaleString()
              : stats.totalInternal?.toLocaleString();

            const displayRankings = isFiltered
              ? activeBatch.totalRankings?.toLocaleString()
              : stats.totalRankings?.toLocaleString();

            return (
              <div className="grid-4" style={{ marginBottom: 20 }}>
                {[
                  {
                    label: isFiltered ? `Students (Batch ${selectedBatchFilter})` : "Total Registered Students",
                    value: displayStudents,
                    icon: <Users size={16} />,
                  },
                  {
                    label: isFiltered ? `Results (Batch ${selectedBatchFilter})` : "Semester Results",
                    value: displayResults,
                    icon: <FileText size={16} />,
                  },
                  {
                    label: isFiltered ? `Internal Records (Batch ${selectedBatchFilter})` : "Internal Records",
                    value: displayInternal,
                    icon: <FileEdit size={16} />,
                  },
                  {
                    label: isFiltered ? `Rankings (Batch ${selectedBatchFilter})` : "Generated Rankings",
                    value: displayRankings,
                    icon: <Trophy size={16} />,
                  },
                ].map((s) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    whileHover={{ y: -4 }}
                    className="stat-card"
                    key={s.label}
                  >
                    <span className="label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {s.icon} {s.label}
                    </span>
                    <span className="value" style={{ color: "var(--accent)", fontSize: isFiltered ? 18 : 22 }}>
                      {s.value}
                    </span>
                  </motion.div>
                ))}
              </div>
            );
          })()}

          {/* Batch-wise Breakdown Table Card */}
          {stats.batchBreakdown && stats.batchBreakdown.length > 0 && (
            <div className="card" style={{ padding: 18, marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                  <Users size={16} color="var(--accent)" /> Batch-Wise Active Student & Ranking Breakdown
                </h4>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Shows Registered vs Active Ranked Students on Leaderboard
                </span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 720 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                      <th style={{ padding: "10px 12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Batch Year</th>
                      <th style={{ padding: "10px 12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Total Registered Students</th>
                      <th style={{ padding: "10px 12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Active Ranked Students</th>
                      <th style={{ padding: "10px 12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Semester-Wise Student Count</th>
                      <th style={{ padding: "10px 12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Uploaded Results</th>
                      <th style={{ padding: "10px 12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Internal Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.batchBreakdown.map((b) => (
                      <tr key={b.batch} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "12px 10px", fontWeight: 700, whiteSpace: "nowrap" }}>
                          <span
                            style={{
                              background: "rgba(59, 130, 246, 0.15)",
                              color: "#60a5fa",
                              padding: "4px 10px",
                              borderRadius: 12,
                              fontSize: 11,
                              border: "1px solid rgba(59, 130, 246, 0.3)",
                              display: "inline-block",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Batch {b.batch}
                          </span>
                        </td>
                        <td style={{ padding: "12px 10px", fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                          {b.totalStudents?.toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 10px", fontWeight: 700, color: "#3ea6ff", whiteSpace: "nowrap" }}>
                          🏆 {b.totalRankedStudents?.toLocaleString()} Active
                        </td>
                        <td style={{ padding: "12px 10px" }}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", minWidth: 260 }}>
                            {b.semBreakdown && b.semBreakdown.length > 0 ? (
                              b.semBreakdown.map((sb) => (
                                <span
                                  key={sb.semester}
                                  style={{
                                    background: "rgba(255, 255, 255, 0.05)",
                                    padding: "3px 8px",
                                    borderRadius: 6,
                                    fontSize: 11,
                                    border: "1px solid rgba(255, 255, 255, 0.08)",
                                    color: "var(--text-secondary)",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  Sem {sb.semester}: <strong style={{ color: "#fff" }}>{sb.studentCount}</strong>
                                </span>
                              ))
                            ) : (
                              <span style={{ color: "var(--text-muted)", fontSize: 11 }}>—</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "12px 10px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                          {b.totalResults?.toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 10px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                          {b.totalInternal?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Active vs Inactive Students & System Sync Guide */}
          <div className="card" style={{ padding: 20, marginTop: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8, margin: "0 0 14px 0" }}>
              <HelpCircle size={16} color="var(--accent)" /> Admin System Guide: Active vs. Registered Students & Auto-Sync
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
              <div style={{ background: "rgba(59, 130, 246, 0.06)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: 10, padding: 12 }}>
                <div style={{ fontWeight: 700, color: "#60a5fa", marginBottom: 4, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                  🏆 Active Ranked Students (Leaderboard)
                </div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                  Students who have official semester results uploaded. They have calculated SGPA/CGPA and appear on University & Branch Leaderboards.
                </p>
              </div>

              <div style={{ background: "rgba(245, 158, 11, 0.06)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: 10, padding: 12 }}>
                <div style={{ fontWeight: 700, color: "#fbbf24", marginBottom: 4, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                  ℹ️ Registered / Inactive Students
                </div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                  Students stored in DB (e.g. from internal marks or roll list) without semester exam results yet. Once their semester results are uploaded, they automatically become <strong>Active</strong>!
                </p>
              </div>

              <div style={{ background: "rgba(16, 185, 129, 0.06)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: 10, padding: 12 }}>
                <div style={{ fontWeight: 700, color: "#34d399", marginBottom: 4, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                  ⚡ Live Excel Auto-Update
                </div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                  Whenever you upload any Excel file (Results, Internal Marks, or Backlogs), all batch stats, semester breakdowns, leaderboards, and backlog lists update automatically!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        {[
          ["overview", "Upload Results", <CloudUpload size={14} key="ov" />],
          ["rankings", "Rankings", <Trophy size={14} key="ra" />],
          ["backlogs", "Backlog Tracker", <AlertTriangle size={14} key="bk" />],
          ["manage", "Manage Records", <Database size={14} key="ma" />],
          ["feedback", "Feedback", <MessageSquare size={14} key="fb" />],
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
                options: ["2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026", "2027", "2028", "2029", "2030"]
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
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 520 }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
              <Trophy size={18} /> Generate Rankings — Single Semester
            </h3>
            <p
              style={{
                color: "var(--secondary)",
                fontSize: 13,
                marginBottom: 20,
              }}
            >
              Generate rankings for a specific semester based on live-calculated SGPA & CGPA.
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

          <div className="card" style={{ border: "1px solid rgba(168,85,247,0.3)" }}>
            <h3 style={{ fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
              <Trophy size={18} color="#a855f7" /> Regenerate ALL Rankings
            </h3>
            <p style={{ color: "var(--secondary)", fontSize: 13, marginBottom: 16 }}>
              Recalculates SGPA &amp; CGPA from raw subject data for <strong>all semesters</strong> using the correct formula.
              Use this after a formula fix to sync the Leaderboard with the Report Card.
            </p>
            <AnimatePresence>
              {regenAllErr && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ color: "var(--danger)", fontSize: 13, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertTriangle size={14} /> {regenAllErr}
                </motion.p>
              )}
              {regenAllMsg && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ color: "var(--success)", fontSize: 13, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle size={14} /> {regenAllMsg}
                </motion.p>
              )}
            </AnimatePresence>
            <button
              className="btn"
              onClick={regenAllRankings}
              disabled={regenAllLoading}
              style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)", display: "flex", alignItems: "center", gap: 8 }}
            >
              <Trophy size={16} />
              {regenAllLoading ? "Regenerating... (please wait)" : "Regenerate All Rankings"}
            </button>
          </div>

          <div className="card" style={{ border: "1px solid rgba(62,166,255,0.3)" }}>
            <h3 style={{ fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
              <Database size={18} color="var(--accent)" /> Clear Server Cache
            </h3>
            <p style={{ color: "var(--secondary)", fontSize: 13, marginBottom: 16 }}>
              Clears the in-memory student data cache on the server. Use this after formula changes so <strong>Dashboard, Analytics &amp; Leaderboard</strong> immediately show fresh, correct CGPA values without waiting.
            </p>
            <AnimatePresence>
              {clearCacheErr && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ color: "var(--danger)", fontSize: 13, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertTriangle size={14} /> {clearCacheErr}
                </motion.p>
              )}
              {clearCacheMsg && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ color: "var(--success)", fontSize: 13, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle size={14} /> {clearCacheMsg}
                </motion.p>
              )}
            </AnimatePresence>
            <button
              className="btn"
              onClick={clearServerCache}
              disabled={clearCacheLoading}
              style={{ background: "rgba(62,166,255,0.15)", color: "var(--accent)", border: "1px solid rgba(62,166,255,0.3)", display: "flex", alignItems: "center", gap: 8 }}
            >
              <Database size={16} />
              {clearCacheLoading ? "Clearing..." : "Clear Server Cache"}
            </button>
          </div>
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
          <ManualGradeUpdateCard
            authHeaders={authHeaders}
            API={API}
            onSuccess={fetchStats}
          />
          <DeleteRecordCard
            authHeaders={authHeaders}
            API={API}
            onSuccess={fetchStats}
          />
        </div>
      )}

      {/* Feedback Tab */}
      {tab === "feedback" && (
        <div style={{ maxWidth: 800 }}>
          <FeedbackManager authHeaders={authHeaders} API={API} />
        </div>
      )}

      {/* Backlog Tracker Tab */}
      {tab === "backlogs" && (
        <BacklogTrackerCard authHeaders={authHeaders} API={API} />
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
