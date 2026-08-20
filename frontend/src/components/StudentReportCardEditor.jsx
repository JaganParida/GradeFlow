import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  BookOpen,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Award,
  TrendingUp,
  Layers,
  GraduationCap,
  Sparkles,
  Info,
  Calendar,
  User,
  Hash,
  ShieldCheck,
  ChevronRight,
  Calculator,
  RefreshCw,
  Edit3,
} from "lucide-react";
import {
  GRADE_POINTS,
  PASSING_GRADES,
  FAIL_GRADES,
  calculateSemesterMetrics,
  calculateCGPA,
  calculateSGPA,
  normalizeGrade,
  getGradePoint,
} from "../utils/gradeCalculations";

const GRADE_OPTIONS = [
  { grade: "O", point: 10, label: "O (Outstanding - 10 GP)", color: "#059669", bg: "#ecfdf5" },
  { grade: "E", point: 9, label: "E (Excellent - 9 GP)", color: "#2563eb", bg: "#eff6ff" },
  { grade: "A", point: 8, label: "A (Very Good - 8 GP)", color: "#7c3aed", bg: "#f5f3ff" },
  { grade: "B", point: 7, label: "B (Good - 7 GP)", color: "#0284c7", bg: "#f0f9ff" },
  { grade: "C", point: 6, label: "C (Fair - 6 GP)", color: "#d97706", bg: "#fffbeb" },
  { grade: "D", point: 5, label: "D (Pass - 5 GP)", color: "#4b5563", bg: "#f3f4f6" },
  { grade: "F", point: 2, label: "F (Fail - 2 GP / Backlog)", color: "#dc2626", bg: "#fef2f2" },
  { grade: "R", point: 0, label: "R (Re-appear / 0 GP)", color: "#dc2626", bg: "#fef2f2" },
  { grade: "M", point: 0, label: "M (Absent / 0 GP)", color: "#dc2626", bg: "#fef2f2" },
  { grade: "S", point: 0, label: "S (Malpractice / 0 GP)", color: "#dc2626", bg: "#fef2f2" },
];

// Scanned directly from database (SemesterResult distinct types)
const SUBJECT_TYPES = [
  { value: "T+P", label: "T+P (Theory + Practical)" },
  { value: "P+Proj", label: "P+Proj (Practical + Project)" },
  { value: "TPP", label: "TPP (Theory + Practice + Project)" },
  { value: "T+Proj", label: "T+Proj (Theory + Project)" },
  { value: "Project", label: "Project (Project Work)" },
  { value: "Practical", label: "Practical (Lab / Practical)" },
  { value: "Theory", label: "Theory (Classroom Theory)" },
  { value: "Theory+Practice", label: "Theory+Practice" },
  { value: "Practice+Project", label: "Practice+Project" },
  { value: "Theory+Project", label: "Theory+Project" },
];

export default function StudentReportCardEditor({ authHeaders, API, onSuccess }) {
  // Search & Student Selection State
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedRegNo, setSelectedRegNo] = useState("");
  const [selectedSem, setSelectedSem] = useState(1);

  // Loaded Student Data
  const [studentMeta, setStudentMeta] = useState(null);
  const [allSemestersHistory, setAllSemestersHistory] = useState([]);
  const [originalSubjects, setOriginalSubjects] = useState([]);
  const [editableSubjects, setEditableSubjects] = useState([]);

  // Editable Student Meta Fields
  const [editStudentName, setEditStudentName] = useState("");
  const [editBranch, setEditBranch] = useState("");
  const [editBatch, setEditBatch] = useState("");

  // UI State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 768 : false));

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const searchBoxRef = useRef(null);

  // Debounced search for student auto-suggestions
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);

    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.get(
          `${API}/admin/students/search?q=${encodeURIComponent(searchQuery.trim())}`,
          authHeaders
        );
        setSuggestions(data || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Student search error:", err);
      }
    }, 250);

    setSearchDebounceTimer(timer);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch full student report card record
  async function loadStudentData(regNoToLoad, semToLoad = selectedSem) {
    const regNo = String(regNoToLoad || selectedRegNo || searchQuery).trim();
    if (!regNo) {
      setErrorMsg("Please enter a valid Registration Number or Student Name to search.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const targetSem = Number(semToLoad) || 1;
      const { data } = await axios.get(
        `${API}/admin/student/semester-record/${encodeURIComponent(regNo)}/${targetSem}`,
        authHeaders
      );

      setSelectedRegNo(data.regNo);
      setSearchQuery(data.regNo);
      setSelectedSem(targetSem);

      setStudentMeta({
        regNo: data.regNo,
        studentName: data.studentName,
        branch: data.branch,
        batch: data.batch,
        section: data.section,
        availableSemesters: data.availableSemesters || [],
      });

      setEditStudentName(data.studentName || "");
      setEditBranch(data.branch || "");
      setEditBatch(data.batch || "");
      setAllSemestersHistory(data.allSemesters || []);

      if (data.semesterRecord && Array.isArray(data.semesterRecord.subjects)) {
        const subjectsWithIds = data.semesterRecord.subjects.map((s, idx) => ({
          id: s._id || `sub_${Date.now()}_${idx}`,
          slNo: s.slNo || idx + 1,
          subCode: s.subCode || "",
          subName: s.subName || "",
          type: s.type || "T+P",
          credit: Number(s.credit) || 0,
          grade: normalizeGrade(s.grade) || "O",
          gradePoint: getGradePoint(s.grade) !== undefined ? getGradePoint(s.grade) : 10,
          resultType: s.resultType || "regular",
        }));
        setOriginalSubjects(JSON.parse(JSON.stringify(subjectsWithIds)));
        setEditableSubjects(subjectsWithIds);
      } else {
        // Semester not present yet - create blank starter template
        const defaultEmpty = [
          {
            id: `sub_${Date.now()}_0`,
            slNo: 1,
            subCode: "",
            subName: "",
            type: "T+P",
            credit: 4,
            grade: "O",
            gradePoint: 10,
            resultType: "regular",
          },
        ];
        setOriginalSubjects([]);
        setEditableSubjects(defaultEmpty);
      }
    } catch (err) {
      console.error("Load student data error:", err);
      const msg = err.response?.data?.message || "Student record not found in database.";
      setErrorMsg(msg);
      setStudentMeta(null);
      setOriginalSubjects([]);
      setEditableSubjects([]);
    } finally {
      setLoading(false);
    }
  }

  // When a suggestion is selected from search dropdown
  function handleSelectSuggestion(student) {
    setSelectedRegNo(student.regNo);
    setSearchQuery(student.regNo);
    setShowSuggestions(false);
    loadStudentData(student.regNo, selectedSem);
  }

  // Handle switching semester
  function handleSemesterChange(newSem) {
    const semNum = Number(newSem);
    setSelectedSem(semNum);
    if (selectedRegNo) {
      loadStudentData(selectedRegNo, semNum);
    }
  }

  // Real-time Subject Field Modifier
  function handleSubjectChange(index, field, value) {
    setEditableSubjects((prev) => {
      const updated = [...prev];
      const target = { ...updated[index] };

      if (field === "grade") {
        const norm = normalizeGrade(value);
        target.grade = norm;
        const gp = getGradePoint(norm);
        target.gradePoint = gp !== undefined ? gp : 0;
      } else if (field === "credit") {
        const num = parseFloat(value);
        target.credit = isNaN(num) ? "" : num;
      } else if (field === "subCode") {
        target.subCode = String(value || "").toUpperCase();
      } else {
        target[field] = value;
      }

      updated[index] = target;
      return updated;
    });
  }

  // Add new subject row
  function handleAddSubject() {
    const newId = `sub_${Date.now()}_${editableSubjects.length}`;
    setEditableSubjects((prev) => [
      ...prev,
      {
        id: newId,
        slNo: prev.length + 1,
        subCode: "",
        subName: "",
        type: "T+P",
        credit: 3,
        grade: "O",
        gradePoint: 10,
        resultType: "regular",
      },
    ]);
  }

  // Remove a subject row
  function handleDeleteSubject(index) {
    setEditableSubjects((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((s, idx) => ({ ...s, slNo: idx + 1 }));
    });
  }

  // Reset to loaded original data
  function handleReset() {
    setEditableSubjects(JSON.parse(JSON.stringify(originalSubjects)));
    setErrorMsg("");
    setSuccessMsg("");
  }

  // Real-Time Live Calculations for Target Semester
  const liveMetrics = useMemo(() => {
    if (!editableSubjects || editableSubjects.length === 0) {
      return { totalWeighted: 0, totalCredits: 0, creditsCleared: 0, creditsForDivisor: 0, sgpa: 0, backlogs: 0 };
    }
    const metrics = calculateSemesterMetrics(editableSubjects, selectedSem);
    const backlogsCount = editableSubjects.filter((s) =>
      FAIL_GRADES.includes(normalizeGrade(s.grade))
    ).length;

    return {
      ...metrics,
      backlogs: backlogsCount,
    };
  }, [editableSubjects, selectedSem]);

  // Real-Time Live Cumulative CGPA calculation across all semesters
  const liveCGPA = useMemo(() => {
    if (!studentMeta || !allSemestersHistory) return liveMetrics.sgpa;

    // Create simulated all semesters array
    const simAll = allSemestersHistory.map((s) => {
      if (Number(s.semester) === Number(selectedSem)) {
        return {
          ...s,
          subjects: editableSubjects,
          semester: Number(selectedSem),
        };
      }
      return s;
    });

    // If current sem was not in history, append it
    const exists = simAll.some((s) => Number(s.semester) === Number(selectedSem));
    if (!exists) {
      simAll.push({
        semester: Number(selectedSem),
        subjects: editableSubjects,
      });
    }

    return calculateCGPA(simAll, selectedSem);
  }, [allSemestersHistory, editableSubjects, selectedSem, studentMeta, liveMetrics]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(editableSubjects) !== JSON.stringify(originalSubjects);
  }, [editableSubjects, originalSubjects]);

  // Save / Update Handler
  async function handleSaveSemesterRecord(e) {
    if (e) e.preventDefault();

    if (!selectedRegNo) {
      setErrorMsg("Please load a student record first.");
      return;
    }

    if (!editableSubjects || editableSubjects.length === 0) {
      setErrorMsg("Subjects list cannot be empty. Please add at least 1 subject.");
      return;
    }

    // Validation
    for (let i = 0; i < editableSubjects.length; i++) {
      const s = editableSubjects[i];
      if (!String(s.subCode || "").trim()) {
        setErrorMsg(`Row #${i + 1}: Subject Code cannot be empty.`);
        return;
      }
      if (!String(s.subName || "").trim()) {
        setErrorMsg(`Row #${i + 1}: Subject Name cannot be empty.`);
        return;
      }
      if (isNaN(Number(s.credit)) || Number(s.credit) <= 0) {
        setErrorMsg(`Row #${i + 1} (${s.subName || "Subject"}): Credit must be a valid positive number.`);
        return;
      }
      const normGrade = normalizeGrade(s.grade);
      if (!GRADE_POINTS.hasOwnProperty(normGrade)) {
        setErrorMsg(`Row #${i + 1} (${s.subName}): Invalid grade "${s.grade}". Valid options: O, E, A, B, C, D, F, R, M, S.`);
        return;
      }
    }

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = {
        regNo: selectedRegNo,
        semester: Number(selectedSem),
        studentName: editStudentName.trim() || studentMeta?.studentName,
        branch: editBranch.trim() || studentMeta?.branch,
        batch: editBatch.trim() || studentMeta?.batch,
        subjects: editableSubjects.map((s, idx) => ({
          slNo: idx + 1,
          subCode: String(s.subCode).trim().toUpperCase(),
          subName: String(s.subName).trim(),
          type: s.type || "Theory",
          credit: Number(s.credit),
          grade: normalizeGrade(s.grade),
          gradePoint: getGradePoint(s.grade) !== undefined ? getGradePoint(s.grade) : 10,
          resultType: s.resultType || "regular",
        })),
      };

      const { data } = await axios.post(
        `${API}/admin/student/update-semester-record`,
        payload,
        authHeaders
      );

      setSuccessMsg(data.message || "Academic Report Card updated & synchronized successfully!");

      // Refresh data
      await loadStudentData(selectedRegNo, selectedSem);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Save report card error:", err);
      setErrorMsg(err.response?.data?.message || "Failed to update semester report card.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Search & Filter Control Bar ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: isMobile ? "16px 14px" : "20px 24px",
          boxShadow: "0 2px 10px rgba(15, 23, 42, 0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <BookOpen size={20} color="#2563eb" />
              Student Report Card & Full Academic Record Editor
            </h3>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: "4px 0 0 0" }}>
              Search any student, select a semester, edit subject credits & grades with <strong>real-time live SGPA/CGPA recalculations</strong>, and synchronize the entire database.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Quick Semesters:
            </span>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => {
              const isAvailable = studentMeta?.availableSemesters?.includes(s);
              const isSelected = Number(selectedSem) === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSemesterChange(s)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 8,
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: "pointer",
                    border: isSelected ? "2px solid #2563eb" : "1px solid #e2e8f0",
                    background: isSelected ? "#eff6ff" : isAvailable ? "#f8fafc" : "#ffffff",
                    color: isSelected ? "#2563eb" : isAvailable ? "#0f172a" : "#94a3b8",
                    transition: "all 0.15s ease",
                  }}
                  title={isAvailable ? `Semester ${s} (Record Available)` : `Semester ${s}`}
                >
                  Sem {s}
                  {isAvailable && <span style={{ marginLeft: 3, color: "#10b981", fontSize: 10 }}>●</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Input Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "minmax(240px, 1.8fr) 150px auto",
            gap: 10,
            alignItems: "center",
            width: "100%",
          }}
        >
          {/* RegNo / Name Search Box */}
          <div ref={searchBoxRef} style={{ position: "relative", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", position: "relative", width: "100%" }}>
              <Search
                size={16}
                color="#64748b"
                style={{ position: "absolute", left: 14, pointerEvents: "none" }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setShowSuggestions(false);
                    loadStudentData(searchQuery, selectedSem);
                  }
                }}
                placeholder="Search by Reg No (e.g. 230301120001) or Student Name..."
                style={{
                  width: "100%",
                  padding: "11px 14px 11px 38px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "#0f172a",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSuggestions([]);
                  }}
                  style={{
                    position: "absolute",
                    right: 12,
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  marginTop: 4,
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                  maxHeight: 280,
                  overflowY: "auto",
                  zIndex: 50,
                }}
              >
                {suggestions.map((st) => (
                  <div
                    key={st.regNo}
                    onClick={() => handleSelectSuggestion(st)}
                    style={{
                      padding: "10px 14px",
                      borderBottom: "1px solid #f1f5f9",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{st.studentName}</div>
                      <div style={{ fontSize: 11.5, color: "#64748b", fontFamily: "'Space Mono', monospace" }}>{st.regNo}</div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: 6 }}>
                      {st.branch} · {st.batch}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Semester Selector */}
          <div style={{ width: "100%" }}>
            <select
              value={selectedSem}
              onChange={(e) => handleSemesterChange(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 12px",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                fontSize: 13.5,
                fontWeight: 700,
                color: "#0f172a",
                outline: "none",
                background: "#ffffff",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem} {studentMeta?.availableSemesters?.includes(sem) ? "(Available)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Fetch Button */}
          <button
            type="button"
            onClick={() => loadStudentData(searchQuery, selectedSem)}
            disabled={loading}
            style={{
              padding: isMobile ? "12px 16px" : "11px 20px",
              borderRadius: 10,
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              fontSize: 13.5,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
              whiteSpace: "nowrap",
              width: isMobile ? "100%" : "auto",
              boxSizing: "border-box",
            }}
          >
            {loading ? <RefreshCw size={16} className="spin" /> : <Search size={16} />}
            {loading ? "Fetching..." : "Fetch Academic Record"}
          </button>
        </div>
      </div>

      {/* Error and Success Banners */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              padding: "12px 16px",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#047857",
              padding: "14px 18px",
              borderRadius: 12,
              fontSize: 13.5,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Student Workspace (Rendered when student is loaded) */}
      {studentMeta && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* ── Student Profile Header & Editable Info ── */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: "18px 24px",
              boxShadow: "0 2px 10px rgba(15, 23, 42, 0.03)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 18,
                }}
              >
                {studentMeta.studentName ? studentMeta.studentName[0].toUpperCase() : "S"}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="text"
                    value={editStudentName}
                    onChange={(e) => setEditStudentName(e.target.value)}
                    placeholder="Student Name"
                    style={{
                      fontSize: 17,
                      fontWeight: 800,
                      color: "#0f172a",
                      border: "1px solid transparent",
                      background: "transparent",
                      padding: "2px 6px",
                      borderRadius: 6,
                    }}
                    onFocus={(e) => (e.target.style.border = "1px solid #cbd5e1")}
                    onBlur={(e) => (e.target.style.border = "1px solid transparent")}
                    title="Click to edit student name"
                  />
                  <span
                    style={{
                      background: "#eff6ff",
                      color: "#2563eb",
                      border: "1px solid #bfdbfe",
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    Sem {selectedSem} Selected
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", fontFamily: "'Space Mono', monospace" }}>
                    Reg: {studentMeta.regNo}
                  </span>
                  <span style={{ color: "#cbd5e1" }}>•</span>
                  <span style={{ fontSize: 12.5, color: "#64748b" }}>
                    Branch: <strong>{studentMeta.branch || "CSE"}</strong> (Sec {studentMeta.section || "—"})
                  </span>
                  <span style={{ color: "#cbd5e1" }}>•</span>
                  <span style={{ fontSize: 12.5, color: "#64748b" }}>
                    Batch: <strong>{studentMeta.batch || "2023-27"}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {hasUnsavedChanges && (
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "#d97706",
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    padding: "4px 10px",
                    borderRadius: 999,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  ● Unsaved Real-time Changes
                </span>
              )}

              <button
                type="button"
                onClick={handleReset}
                disabled={!hasUnsavedChanges || saving}
                style={{
                  padding: "8px 14px",
                  borderRadius: 9,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: !hasUnsavedChanges || saving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: !hasUnsavedChanges ? 0.5 : 1,
                }}
              >
                <RotateCcw size={14} />
                Reset
              </button>

              <button
                type="button"
                onClick={handleSaveSemesterRecord}
                disabled={saving}
                style={{
                  padding: "9px 20px",
                  borderRadius: 9,
                  background: "linear-gradient(135deg, #16a34a, #15803d)",
                  color: "#ffffff",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: saving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  boxShadow: "0 2px 8px rgba(22, 163, 74, 0.3)",
                }}
              >
                {saving ? <RefreshCw size={15} className="spin" /> : <Save size={15} />}
                {saving ? "Synchronizing..." : "Save & Synchronize All Data"}
              </button>
            </div>
          </div>

          {/* ── Real-Time Calculated Metrics Cards (Read-only on-the-fly preview) ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            {/* 1. Live SGPA Card */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 14,
                padding: "16px 18px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  Semester SGPA
                </span>
                <span style={{ fontSize: 10, background: "#eff6ff", color: "#2563eb", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                  Live Preview
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#2563eb", fontFamily: "'Space Mono', monospace", lineHeight: 1.1 }}>
                {liveMetrics.sgpa.toFixed(2)}
                <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}> / 10.0</span>
              </div>
              <span style={{ fontSize: 11, color: "#64748b" }}>
                Numerator: {liveMetrics.totalWeighted} / Divisor: {liveMetrics.creditsForDivisor}
              </span>
            </div>

            {/* 2. Live Progressive CGPA Card */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 14,
                padding: "16px 18px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  Progressive CGPA
                </span>
                <span style={{ fontSize: 10, background: "#f5f3ff", color: "#7c3aed", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                  Up to Sem {selectedSem}
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#7c3aed", fontFamily: "'Space Mono', monospace", lineHeight: 1.1 }}>
                {liveCGPA.toFixed(2)}
                <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}> / 10.0</span>
              </div>
              <span style={{ fontSize: 11, color: "#64748b" }}>
                Cumulative score up to Sem {selectedSem}
              </span>
            </div>

            {/* 3. Live Total Credits */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 14,
                padding: "16px 18px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  Total Sem Credits
                </span>
                <span style={{ fontSize: 10, background: "#f0fdf4", color: "#16a34a", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                  {editableSubjects.length} Courses
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", fontFamily: "'Space Mono', monospace", lineHeight: 1.1 }}>
                {liveMetrics.totalCredits}
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}> Credits</span>
              </div>
              <span style={{ fontSize: 11, color: "#64748b" }}>
                Sum of course credits in Sem {selectedSem}
              </span>
            </div>

            {/* 4. Live Credits Cleared */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 14,
                padding: "16px 18px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  Credits Cleared
                </span>
                <span
                  style={{
                    fontSize: 10,
                    background: liveMetrics.creditsCleared === liveMetrics.totalCredits ? "#ecfdf5" : "#fff1f2",
                    color: liveMetrics.creditsCleared === liveMetrics.totalCredits ? "#059669" : "#e11d48",
                    padding: "1px 6px",
                    borderRadius: 4,
                    fontWeight: 700,
                  }}
                >
                  {liveMetrics.creditsCleared === liveMetrics.totalCredits ? "100% Cleared" : "Backlog Present"}
                </span>
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: liveMetrics.creditsCleared === liveMetrics.totalCredits ? "#16a34a" : "#ea580c",
                  fontFamily: "'Space Mono', monospace",
                  lineHeight: 1.1,
                }}
              >
                {liveMetrics.creditsCleared}
                <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}> / {liveMetrics.totalCredits}</span>
              </div>
              <span style={{ fontSize: 11, color: "#64748b" }}>
                Courses passed (O, E, A, B, C, D)
              </span>
            </div>

            {/* 5. Live Backlogs Count */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 14,
                padding: "16px 18px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  Sem Backlogs
                </span>
                <span
                  style={{
                    fontSize: 10,
                    background: liveMetrics.backlogs === 0 ? "#ecfdf5" : "#fef2f2",
                    color: liveMetrics.backlogs === 0 ? "#059669" : "#dc2626",
                    padding: "1px 6px",
                    borderRadius: 4,
                    fontWeight: 700,
                  }}
                >
                  {liveMetrics.backlogs === 0 ? "Clean Standing" : `${liveMetrics.backlogs} Backlog(s)`}
                </span>
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: liveMetrics.backlogs === 0 ? "#16a34a" : "#dc2626",
                  fontFamily: "'Space Mono', monospace",
                  lineHeight: 1.1,
                }}
              >
                {liveMetrics.backlogs}
                <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}> Active</span>
              </div>
              <span style={{ fontSize: 11, color: "#64748b" }}>
                Grades: F, R, M, or S
              </span>
            </div>
          </div>

          {/* ── Interactive Subjects Table Editor ── */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 2px 10px rgba(15, 23, 42, 0.03)",
            }}
          >
            {/* Table Header / Action Strip */}
            <div
              style={{
                padding: "16px 22px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f8fafc",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <Layers size={17} color="#2563eb" />
                  Semester {selectedSem} Subject Grade List ({editableSubjects.length} Courses)
                </h4>
                <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
                  Directly modify Subject Code, Name, Credit, or Grade. SGPA and CGPA recalculate automatically in real-time.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddSubject}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 2px 6px rgba(37, 99, 235, 0.2)",
                }}
              >
                <Plus size={15} />
                Add New Subject
              </button>
            </div>

            {/* Desktop / Tablet Table View */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#475569", fontWeight: 800, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <th style={{ padding: "12px 14px", width: 45, textAlign: "center" }}>#</th>
                    <th style={{ padding: "12px 14px", width: 140 }}>Sub Code</th>
                    <th style={{ padding: "12px 14px", minWidth: 220 }}>Subject Name</th>
                    <th style={{ padding: "12px 14px", width: 120 }}>Type</th>
                    <th style={{ padding: "12px 14px", width: 90, textAlign: "center" }}>Credit</th>
                    <th style={{ padding: "12px 14px", width: 190 }}>Grade (Dropdown)</th>
                    <th style={{ padding: "12px 14px", width: 80, textAlign: "center" }}>GP</th>
                    <th style={{ padding: "12px 14px", width: 95, textAlign: "center" }}>Pts (Cr × GP)</th>
                    <th style={{ padding: "12px 14px", width: 60, textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {editableSubjects.map((sub, idx) => {
                    const normGrade = normalizeGrade(sub.grade);
                    const gradeObj = GRADE_OPTIONS.find((g) => g.grade === normGrade) || { color: "#475569", bg: "#f1f5f9" };
                    const gp = getGradePoint(normGrade);
                    const creditNum = Number(sub.credit) || 0;
                    const points = normGrade === "F" ? creditNum * 2 : !FAIL_GRADES.includes(normGrade) && gp !== undefined ? creditNum * gp : 0;

                    return (
                      <tr
                        key={sub.id || idx}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          background: FAIL_GRADES.includes(normGrade) ? "#fffdfd" : "#ffffff",
                          transition: "background 0.15s ease",
                        }}
                      >
                        {/* 1. Sl No */}
                        <td style={{ padding: "10px 14px", textAlign: "center", color: "#64748b", fontWeight: 700 }}>
                          {idx + 1}
                        </td>

                        {/* 2. Sub Code */}
                        <td style={{ padding: "10px 14px" }}>
                          <input
                            type="text"
                            value={sub.subCode}
                            onChange={(e) => handleSubjectChange(idx, "subCode", e.target.value)}
                            placeholder="e.g. BCSE201"
                            style={{
                              width: "100%",
                              padding: "7px 10px",
                              borderRadius: 7,
                              border: "1px solid #cbd5e1",
                              fontSize: 12.5,
                              fontWeight: 700,
                              fontFamily: "'Space Mono', monospace",
                              color: "#0f172a",
                              outline: "none",
                              boxSizing: "border-box",
                              textTransform: "uppercase",
                            }}
                          />
                        </td>

                        {/* 3. Sub Name */}
                        <td style={{ padding: "10px 14px" }}>
                          <input
                            type="text"
                            value={sub.subName}
                            onChange={(e) => handleSubjectChange(idx, "subName", e.target.value)}
                            placeholder="e.g. Data Structures & Algorithms"
                            style={{
                              width: "100%",
                              padding: "7px 10px",
                              borderRadius: 7,
                              border: "1px solid #cbd5e1",
                              fontSize: 12.5,
                              fontWeight: 600,
                              color: "#0f172a",
                              outline: "none",
                              boxSizing: "border-box",
                            }}
                          />
                        </td>

                        {/* 4. Type */}
                        <td style={{ padding: "10px 14px" }}>
                          <select
                            value={sub.type || "T+P"}
                            onChange={(e) => handleSubjectChange(idx, "type", e.target.value)}
                            style={{
                              width: "100%",
                              padding: "7px 8px",
                              borderRadius: 7,
                              border: "1px solid #cbd5e1",
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#1e293b",
                              outline: "none",
                              background: "#ffffff",
                              cursor: "pointer",
                            }}
                          >
                            {sub.type && !SUBJECT_TYPES.some((t) => t.value.toLowerCase() === String(sub.type).toLowerCase()) && (
                              <option value={sub.type}>{sub.type}</option>
                            )}
                            {SUBJECT_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* 5. Credit */}
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="20"
                            value={sub.credit}
                            onChange={(e) => handleSubjectChange(idx, "credit", e.target.value)}
                            style={{
                              width: 65,
                              padding: "7px 8px",
                              borderRadius: 7,
                              border: "1px solid #cbd5e1",
                              fontSize: 12.5,
                              fontWeight: 800,
                              textAlign: "center",
                              color: "#0f172a",
                              outline: "none",
                              fontFamily: "'Space Mono', monospace",
                              boxSizing: "border-box",
                            }}
                          />
                        </td>

                        {/* 6. Grade Selector */}
                        <td style={{ padding: "10px 14px" }}>
                          <select
                            value={normGrade}
                            onChange={(e) => handleSubjectChange(idx, "grade", e.target.value)}
                            style={{
                              width: "100%",
                              padding: "7px 8px",
                              borderRadius: 7,
                              border: `1.5px solid ${gradeObj.color || "#cbd5e1"}`,
                              background: gradeObj.bg || "#ffffff",
                              color: gradeObj.color || "#0f172a",
                              fontSize: 12,
                              fontWeight: 800,
                              outline: "none",
                              cursor: "pointer",
                            }}
                          >
                            {GRADE_OPTIONS.map((opt) => (
                              <option key={opt.grade} value={opt.grade} style={{ color: "#0f172a", background: "#ffffff", fontWeight: 700 }}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* 7. Grade Point Badge */}
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <span
                            style={{
                              display: "inline-block",
                              minWidth: 26,
                              padding: "3px 6px",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 900,
                              fontFamily: "'Space Mono', monospace",
                              background: gradeObj.bg || "#f1f5f9",
                              color: gradeObj.color || "#475569",
                              border: `1px solid ${gradeObj.color}30`,
                            }}
                          >
                            {gp !== undefined ? gp : "—"}
                          </span>
                        </td>

                        {/* 8. Credit Points */}
                        <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 800, fontFamily: "'Space Mono', monospace", color: points > 0 ? "#0f172a" : "#dc2626" }}>
                          {points.toFixed(1)}
                        </td>

                        {/* 9. Delete Action */}
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubject(idx)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#94a3b8",
                              cursor: "pointer",
                              padding: 6,
                              borderRadius: 6,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "#dc2626";
                              e.currentTarget.style.background = "#fee2e2";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "#94a3b8";
                              e.currentTarget.style.background = "none";
                            }}
                            title={`Delete ${sub.subName || "Subject"}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {editableSubjects.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ padding: "32px 14px", textAlign: "center", color: "#64748b" }}>
                        <AlertTriangle size={24} color="#f59e0b" style={{ margin: "0 auto 8px auto", display: "block" }} />
                        No subjects present for this semester yet. Click <strong>"+ Add New Subject"</strong> to populate.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Table Summary Strip */}
            <div
              style={{
                padding: "14px 22px",
                background: "#f8fafc",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  Total Courses: <strong>{editableSubjects.length}</strong>
                </span>
                <span style={{ color: "#cbd5e1" }}>•</span>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  Total Credits: <strong>{liveMetrics.totalCredits}</strong>
                </span>
                <span style={{ color: "#cbd5e1" }}>•</span>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  Credits Cleared: <strong style={{ color: liveMetrics.creditsCleared === liveMetrics.totalCredits ? "#16a34a" : "#ea580c" }}>{liveMetrics.creditsCleared}</strong>
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  onClick={handleAddSubject}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 7,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#2563eb",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Plus size={13} />
                  Add Row
                </button>

                <button
                  type="button"
                  onClick={handleSaveSemesterRecord}
                  disabled={saving}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 8,
                    background: "#16a34a",
                    color: "#ffffff",
                    border: "none",
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: saving ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: "0 2px 6px rgba(22, 163, 74, 0.2)",
                  }}
                >
                  {saving ? <RefreshCw size={14} className="spin" /> : <Save size={14} />}
                  {saving ? "Saving..." : "Update & Sync All Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
