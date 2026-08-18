import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { encodeStudentId, decodeStudentId, isEncryptedToken } from "../utils/studentIdEncoder";
import { motion, AnimatePresence } from "framer-motion";
import {
  Percent,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calculator,
  Clock,
  Calendar as CalendarIcon,
  BookOpen,
  Layers,
  ShieldCheck,
  User,
  Search,
  ArrowRight,
  Building,
  Plus,
  Minus,
  RotateCcw,
  Save,
  Trash2,
  Sliders,
  Award,
  Info,
  ChevronDown,
  Target,
  Zap,
  Grid,
  Sun,
} from "lucide-react";
import {
  ALL_SECTIONS,
  normalizeSection,
  getSectionSubjectCatalog,
  calculateAttendance,
  estimateTargetReachDate,
} from "../utils/timetableHelper";

export default function AttendanceTracker() {
  const { studentId: urlParam } = useParams();
  const navigate = useNavigate();
  const { studentData, fetchStudent, loading: appLoading } = useApp();

  // Decode regNo from URL or context
  const decodedParam = urlParam
    ? isEncryptedToken(urlParam)
      ? decodeStudentId(urlParam)
      : urlParam
    : null;

  const currentRegNo = decodedParam || studentData?.regNo || sessionStorage.getItem("last_regNo") || "";

  // Section State
  const [selectedSection, setSelectedSection] = useState(() => {
    if (studentData?.section || studentData?.branch) {
      return normalizeSection(studentData.section || studentData.branch, currentRegNo);
    }
    return normalizeSection("CSE-A", currentRegNo);
  });

  // Search State
  const [searchRegInput, setSearchRegInput] = useState("");
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);

  // Responsive listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sync student section when studentData changes
  useEffect(() => {
    if (studentData) {
      const detected = normalizeSection(studentData.section || studentData.branch, studentData.regNo);
      setSelectedSection(detected);
    }
  }, [studentData]);

  // Load student data if URL param provided and not loaded yet
  useEffect(() => {
    if (decodedParam && (!studentData || studentData.regNo !== decodedParam)) {
      fetchStudent(decodedParam);
    }
  }, [decodedParam, studentData, fetchStudent]);

  // Normalize URL token
  useEffect(() => {
    if (decodedParam && urlParam && !isEncryptedToken(urlParam)) {
      navigate(`/attendance/${encodeStudentId(decodedParam)}`, { replace: true });
    }
  }, [decodedParam, urlParam, navigate]);

  // Section Subjects Catalog from Timetable Database
  const sectionCatalog = useMemo(() => {
    return getSectionSubjectCatalog(selectedSection);
  }, [selectedSection]);

  // Active Subject Simulation State
  const [selectedSubjectName, setSelectedSubjectName] = useState("");
  const [componentInputs, setComponentInputs] = useState([]);
  const [targetGoal, setTargetGoal] = useState(75);
  const [simulateMissCount, setSimulateMissCount] = useState(0);
  const [simulateAttendCount, setSimulateAttendCount] = useState(0);

  // Saved Subjects LocalStorage Store
  const storageKey = `gradeflow_attendance_${currentRegNo || selectedSection}`;
  const [savedSubjects, setSavedSubjects] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Save to LocalStorage whenever savedSubjects changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(savedSubjects));
    } catch (e) {
      console.error("Failed to persist attendance data:", e);
    }
  }, [savedSubjects, storageKey]);

  // Set default subject on catalog load
  useEffect(() => {
    if (sectionCatalog.length > 0 && !selectedSubjectName) {
      selectSubjectFromCatalog(sectionCatalog[0]);
    }
  }, [sectionCatalog]);

  // Function to switch active subject from catalog
  function selectSubjectFromCatalog(catalogItem) {
    if (!catalogItem) return;
    setSelectedSubjectName(catalogItem.subjectName);

    // Check if subject already exists in saved list
    const existing = savedSubjects.find((s) => s.subjectName === catalogItem.subjectName);
    if (existing && existing.components) {
      setComponentInputs(existing.components);
    } else {
      // Initialize components based on timetable detection
      const initialComps = catalogItem.components.map((type) => ({
        type,
        attended: 18,
        delivered: 24,
      }));
      setComponentInputs(initialComps.length > 0 ? initialComps : [{ type: "PP", attended: 18, delivered: 24 }]);
    }
    setSimulateMissCount(0);
    setSimulateAttendCount(0);
  }

  // Handle in-page student search
  async function handleSearchStudent(e) {
    e.preventDefault();
    const cleanReg = searchRegInput.trim().toUpperCase();
    if (!cleanReg) return;

    setIsSearching(true);
    setSearchError("");
    try {
      const success = await fetchStudent(cleanReg);
      if (success) {
        setSearchRegInput("");
        const newSec = normalizeSection("CSE-A", cleanReg);
        setSelectedSection(newSec);
        navigate(`/attendance/${encodeStudentId(cleanReg)}`);
      } else {
        setSearchError(`Registration number "${cleanReg}" not found.`);
      }
    } catch {
      setSearchError("Failed to lookup student. Please check registration number.");
    } finally {
      setIsSearching(false);
    }
  }

  // Active Subject Catalog Metadata
  const activeCatalogItem = useMemo(() => {
    return sectionCatalog.find((s) => s.subjectName === selectedSubjectName) || null;
  }, [sectionCatalog, selectedSubjectName]);

  // Calculated Metrics for Active Subject
  const activeCalculation = useMemo(() => {
    return calculateAttendance({
      components: componentInputs,
      targetPercentage: targetGoal,
      simulateAbsent: simulateMissCount,
      simulatePresent: simulateAttendCount,
    });
  }, [componentInputs, targetGoal, simulateMissCount, simulateAttendCount]);

  // Timetable Calendar Date Projection
  const dateProjection = useMemo(() => {
    if (!activeCatalogItem || activeCalculation.classesNeeded <= 0) return null;
    return estimateTargetReachDate(
      activeCalculation.classesNeeded,
      activeCatalogItem.weeklyOccurrences || []
    );
  }, [activeCalculation.classesNeeded, activeCatalogItem]);

  // Update a component's attended or delivered value
  function handleComponentChange(index, field, value) {
    setComponentInputs((prev) => {
      const updated = [...prev];
      const num = Math.max(0, parseInt(value, 10) || 0);
      updated[index] = {
        ...updated[index],
        [field]: num,
      };
      // If attended > delivered, auto-bump delivered
      if (field === "attended" && num > updated[index].delivered) {
        updated[index].delivered = num;
      }
      return updated;
    });
  }

  function adjustComponentCount(index, field, delta) {
    setComponentInputs((prev) => {
      const updated = [...prev];
      const current = updated[index][field] || 0;
      const next = Math.max(0, current + delta);
      updated[index] = {
        ...updated[index],
        [field]: next,
      };
      if (field === "attended" && next > updated[index].delivered) {
        updated[index].delivered = next;
      }
      return updated;
    });
  }

  function addCustomComponent(type = "PR") {
    setComponentInputs((prev) => [
      ...prev,
      { type, attended: 10, delivered: 12 },
    ]);
  }

  function removeComponent(index) {
    if (componentInputs.length <= 1) return;
    setComponentInputs((prev) => prev.filter((_, idx) => idx !== index));
  }

  // Save / Update Subject in My Subjects Dashboard
  function handleSaveActiveSubject() {
    if (!selectedSubjectName) return;

    setSavedSubjects((prev) => {
      const filtered = prev.filter((s) => s.subjectName !== selectedSubjectName);
      return [
        ...filtered,
        {
          subjectName: selectedSubjectName,
          components: componentInputs,
          lastUpdated: new Date().toISOString(),
          section: selectedSection,
          weeklyOccurrences: activeCatalogItem?.weeklyOccurrences || [],
        },
      ];
    });
  }

  function handleDeleteSavedSubject(subjectName) {
    setSavedSubjects((prev) => prev.filter((s) => s.subjectName !== subjectName));
  }

  // Overall Aggregate Attendance across all Saved Subjects
  const overallAggregate = useMemo(() => {
    if (savedSubjects.length === 0) {
      return {
        totalAttended: activeCalculation.totalAttended,
        totalDelivered: activeCalculation.totalDelivered,
        percentage: activeCalculation.currentPercentage,
        subjectsCount: 1,
      };
    }

    let totAtt = 0;
    let totDel = 0;

    savedSubjects.forEach((sub) => {
      (sub.components || []).forEach((c) => {
        totAtt += Number(c.attended) || 0;
        totDel += Number(c.delivered) || 0;
      });
    });

    const percentage = totDel > 0 ? (totAtt / totDel) * 100 : 100;
    return {
      totalAttended: totAtt,
      totalDelivered: totDel,
      percentage: Number(percentage.toFixed(2)),
      subjectsCount: savedSubjects.length,
    };
  }, [savedSubjects, activeCalculation]);

  const activeStudentName = studentData?.studentName || "";

  return (
    <div
      style={{
        background: "#f8fafc",
        minHeight: "100vh",
        color: "#0f172a",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        paddingBottom: 90,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* ── Main Container ── */}
      <div
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          padding: isMobile ? "14px 12px" : "24px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* ═══════════════════════════════════════════════════════════════
            TOP HERO HEADER CARD
        ═══════════════════════════════════════════════════════════════ */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 20,
            padding: isMobile ? "16px 14px" : "22px 26px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04), 0 10px 24px -6px rgba(15, 23, 42, 0.04)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Top Row: Title, Subtitle, and Section Controls */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 14,
            }}
          >
            {/* Left: Branding & Section Title */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: isMobile ? 44 : 50,
                  height: isMobile ? 44 : 50,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.25)",
                }}
              >
                <Percent size={isMobile ? 22 : 26} />
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#059669",
                    fontSize: 11.5,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  <ShieldCheck size={13} />
                  <span>Attendance Intelligence & Predictive Simulator</span>
                </div>
                <h1
                  style={{
                    fontSize: isMobile ? 20 : 24,
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: "2px 0 0 0",
                    letterSpacing: "-0.4px",
                  }}
                >
                  Section {selectedSection} Attendance Tracker
                </h1>
              </div>
            </div>

            {/* Right: Section Badge / Selector & Student Tag */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {activeStudentName || currentRegNo ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    borderRadius: 10,
                    background: "#ecfdf5",
                    border: "1.5px solid #10b981",
                    color: "#047857",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  <Building size={14} color="#059669" />
                  <span>Section {selectedSection}</span>
                </div>
              ) : (
                <>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#64748b" }}>
                    Section:
                  </span>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 10,
                      border: "1.5px solid #10b981",
                      background: "#ecfdf5",
                      color: "#047857",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: "pointer",
                      outline: "none",
                      boxShadow: "0 1px 3px rgba(16, 185, 129, 0.1)",
                    }}
                  >
                    {ALL_SECTIONS.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {activeStudentName && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 12px",
                    borderRadius: 10,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#334155",
                  }}
                >
                  <User size={13} color="#059669" />
                  <span>{activeStudentName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Section Switcher Pills (ONLY in Guest / Generic Mode when no student searched) */}
          {!isMobile && !activeStudentName && !currentRegNo && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                borderRadius: 12,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                overflowX: "auto",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginRight: 4 }}>
                Section:
              </span>
              {ALL_SECTIONS.map((sec) => {
                const isActive = selectedSection === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setSelectedSection(sec)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      border: isActive ? "1.5px solid #059669" : "1px solid transparent",
                      background: isActive ? "#059669" : "transparent",
                      color: isActive ? "#ffffff" : "#475569",
                      transition: "all 0.15s ease",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {sec}
                  </button>
                );
              })}
            </div>
          )}

          {/* Student Search Form */}
          <div
            style={{
              paddingTop: 12,
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <form
              onSubmit={handleSearchStudent}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                maxWidth: 400,
                width: "100%",
              }}
            >
              <div
                style={{
                  position: "relative",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Search
                  size={15}
                  color="#94a3b8"
                  style={{ position: "absolute", left: 12, pointerEvents: "none" }}
                />
                <input
                  type="text"
                  placeholder="Lookup Reg No (e.g. 210301120001)"
                  value={searchRegInput}
                  onChange={(e) => setSearchRegInput(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px 8px 36px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    fontSize: 12.5,
                    color: "#0f172a",
                    fontWeight: 600,
                    outline: "none",
                    background: "#ffffff",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSearching}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: "#0f172a",
                  color: "#ffffff",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: isSearching ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  whiteSpace: "nowrap",
                }}
              >
                <span>{isSearching ? "Searching..." : "Lookup"}</span>
                <ArrowRight size={13} />
              </button>
            </form>

            {/* Mode Switcher Bar */}
            <div
              style={{
                display: "inline-flex",
                background: "#f1f5f9",
                padding: 4,
                borderRadius: 12,
                gap: 3,
                border: "1px solid #e2e8f0",
                overflowX: "auto",
                maxWidth: "100%",
              }}
            >
              <button
                type="button"
                style={{
                  padding: isMobile ? "6px 10px" : "7px 14px",
                  borderRadius: 9,
                  border: "none",
                  background: "#ffffff",
                  color: "#059669",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  whiteSpace: "nowrap",
                }}
              >
                <Percent size={14} />
                <span>Attendance Tracker</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = currentRegNo ? `/timetable/${encodeStudentId(currentRegNo)}` : "/timetable";
                  navigate(target);
                }}
                style={{
                  padding: isMobile ? "6px 10px" : "7px 14px",
                  borderRadius: 9,
                  border: "none",
                  background: "transparent",
                  color: "#2563eb",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                  transition: "background 0.15s ease",
                }}
              >
                <Clock size={14} />
                <span>Class Timetable</span>
              </button>
            </div>
          </div>

          {searchError && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                padding: "9px 14px",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AlertTriangle size={15} />
              <span>{searchError}</span>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            TOP AGGREGATE SUMMARY STRIP
        ═══════════════════════════════════════════════════════════════ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: 12,
          }}
        >
          {/* Card 1: Overall Percentage */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                Aggregate Attendance
              </span>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: overallAggregate.percentage >= 75 ? "#ecfdf5" : "#fef2f2",
                  color: overallAggregate.percentage >= 75 ? "#059669" : "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Percent size={15} />
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: overallAggregate.percentage >= 75 ? "#059669" : "#dc2626",
                  letterSpacing: "-0.5px",
                }}
              >
                {overallAggregate.percentage}%
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                Across {overallAggregate.subjectsCount} semester {overallAggregate.subjectsCount === 1 ? "subject" : "subjects"}
              </div>
            </div>
          </div>

          {/* Card 2: Total Classes Attended / Delivered */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                Attended / Delivered
              </span>
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
                }}
              >
                <CheckCircle2 size={15} />
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.5px" }}>
                {overallAggregate.totalAttended} <span style={{ fontSize: 16, color: "#94a3b8", fontWeight: 600 }}>/ {overallAggregate.totalDelivered}</span>
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                Delivered lectures & labs
              </div>
            </div>
          </div>

          {/* Card 3: Safe Bunk Margin or Deficit */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                {activeCalculation.classesNeeded > 0 ? "Deficit Classes" : "Safe Bunk Margin"}
              </span>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: activeCalculation.classesNeeded > 0 ? "#fef3c7" : "#f0fdf4",
                  color: activeCalculation.classesNeeded > 0 ? "#d97706" : "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Zap size={15} />
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: activeCalculation.classesNeeded > 0 ? "#d97706" : "#16a34a",
                  letterSpacing: "-0.5px",
                }}
              >
                {activeCalculation.classesNeeded > 0
                  ? `${activeCalculation.classesNeeded} Required`
                  : `${activeCalculation.safeBunks} Classes`}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                {activeCalculation.classesNeeded > 0 ? `To reach ${targetGoal}% criteria` : `Can miss & stay >= ${targetGoal}%`}
              </div>
            </div>
          </div>

          {/* Card 4: 75% Compliance Status */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                Exam Eligibility
              </span>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: activeCalculation.currentPercentage >= 75 ? "#ecfdf5" : "#fef2f2",
                  color: activeCalculation.currentPercentage >= 75 ? "#059669" : "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Award size={15} />
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: activeCalculation.currentPercentage >= 75 ? "#059669" : "#dc2626",
                }}
              >
                {activeCalculation.currentPercentage >= 75 ? "ELIGIBLE" : "DEBARRED AT <75%"}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                University Minimum Criteria: 75%
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            MAIN INTERACTIVE ATTENDANCE SIMULATOR STUDIO
        ═══════════════════════════════════════════════════════════════ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: 16,
          }}
        >
          {/* LEFT COLUMN: Subject & Multi-Component Breakdown Manager */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 18,
              padding: isMobile ? "16px 14px" : "22px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            {/* Subject Selector from Timetable Catalog */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                  <BookOpen size={14} color="#059669" />
                  Select Subject from Timetable:
                </label>
                {activeCatalogItem && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "2px 8px", borderRadius: 6 }}>
                    {activeCatalogItem.classesPerWeek} classes / week
                  </span>
                )}
              </div>

              <select
                value={selectedSubjectName}
                onChange={(e) => {
                  const item = sectionCatalog.find((s) => s.subjectName === e.target.value);
                  selectSubjectFromCatalog(item);
                }}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1.5px solid #cbd5e1",
                  background: "#ffffff",
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: "#0f172a",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {sectionCatalog.map((s) => (
                  <option key={s.subjectName} value={s.subjectName}>
                    {s.subjectName} ({s.components.join(" + ")})
                  </option>
                ))}
              </select>
            </div>

            {/* Component Breakdown Card Rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  Components Breakdown (ERP Components)
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => addCustomComponent("PR")}
                    style={{
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      padding: "3px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <Plus size={11} />
                    <span>Add Component</span>
                  </button>
                </div>
              </div>

              {componentInputs.map((comp, idx) => {
                const compPercent =
                  comp.delivered > 0 ? ((comp.attended / comp.delivered) * 100).toFixed(1) : "100.0";

                return (
                  <div
                    key={idx}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 14,
                      padding: "12px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 900,
                            background: comp.type === "PR" ? "#faf5ff" : comp.type === "TUT" ? "#fffbeb" : "#eff6ff",
                            color: comp.type === "PR" ? "#7c3aed" : comp.type === "TUT" ? "#b45309" : "#2563eb",
                            border: `1px solid ${comp.type === "PR" ? "#ddd6fe" : comp.type === "TUT" ? "#fde68a" : "#bfdbfe"}`,
                            padding: "2px 8px",
                            borderRadius: 6,
                          }}
                        >
                          {comp.type === "PR" ? "PR (Practical/Lab)" : comp.type === "TUT" ? "TUT (Tutorial)" : "PP (Lecture/Practice)"}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 900, color: Number(compPercent) >= 75 ? "#059669" : "#dc2626" }}>
                          {compPercent}%
                        </span>
                        {componentInputs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeComponent(idx)}
                            style={{
                              border: "none",
                              background: "transparent",
                              color: "#94a3b8",
                              cursor: "pointer",
                              padding: 2,
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inputs for Attended & Delivered */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                        alignItems: "center",
                      }}
                    >
                      {/* Attended Stepper */}
                      <div>
                        <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>
                          Attended Classes:
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                          <button
                            type="button"
                            onClick={() => adjustComponentCount(idx, "attended", -1)}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Minus size={12} />
                          </button>

                          <input
                            type="number"
                            min="0"
                            value={comp.attended}
                            onChange={(e) => handleComponentChange(idx, "attended", e.target.value)}
                            style={{
                              width: "100%",
                              padding: "4px 8px",
                              borderRadius: 6,
                              border: "1px solid #cbd5e1",
                              textAlign: "center",
                              fontSize: 13,
                              fontWeight: 800,
                              color: "#0f172a",
                            }}
                          />

                          <button
                            type="button"
                            onClick={() => adjustComponentCount(idx, "attended", 1)}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Delivered / Total Stepper */}
                      <div>
                        <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>
                          Total Delivered:
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                          <button
                            type="button"
                            onClick={() => adjustComponentCount(idx, "delivered", -1)}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Minus size={12} />
                          </button>

                          <input
                            type="number"
                            min={comp.attended}
                            value={comp.delivered}
                            onChange={(e) => handleComponentChange(idx, "delivered", e.target.value)}
                            style={{
                              width: "100%",
                              padding: "4px 8px",
                              borderRadius: 6,
                              border: "1px solid #cbd5e1",
                              textAlign: "center",
                              fontSize: 13,
                              fontWeight: 800,
                              color: "#0f172a",
                            }}
                          />

                          <button
                            type="button"
                            onClick={() => adjustComponentCount(idx, "delivered", 1)}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save to My Subjects Button */}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button
                type="button"
                onClick={handleSaveActiveSubject}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "none",
                  background: "#059669",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  boxShadow: "0 2px 6px rgba(5, 150, 105, 0.2)",
                }}
              >
                <Save size={14} />
                <span>Save to Semester Dashboard</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Real-Time What-If Simulator & Target Planner */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 18,
              padding: isMobile ? "16px 14px" : "22px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            {/* Subject Current Overview Pill */}
            <div
              style={{
                background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
                border: "1.5px solid #e2e8f0",
                borderRadius: 16,
                padding: "14px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                  Current Subject Score
                </span>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "2px 0 0 0" }}>
                  {selectedSubjectName}
                </h3>
              </div>

              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color: activeCalculation.currentPercentage >= 75 ? "#059669" : "#dc2626",
                  }}
                >
                  {activeCalculation.currentPercentage}%
                </div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>
                  {activeCalculation.totalAttended} / {activeCalculation.totalDelivered} Total Classes
                </div>
              </div>
            </div>

            {/* 1. "WHAT-IF I MISS X CLASSES TOMORROW" */}
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <TrendingDown size={16} color="#dc2626" />
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#991b1b" }}>
                    What if I miss classes tomorrow?
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setSimulateMissCount((p) => Math.max(0, p - 1))}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: "1px solid #fca5a5",
                      background: "#ffffff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Minus size={11} />
                  </button>

                  <span style={{ fontSize: 13, fontWeight: 900, minWidth: 20, textAlign: "center", color: "#991b1b" }}>
                    {simulateMissCount}
                  </span>

                  <button
                    type="button"
                    onClick={() => setSimulateMissCount((p) => p + 1)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: "1px solid #fca5a5",
                      background: "#ffffff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Plus size={11} />
                  </button>
                </div>
              </div>

              {simulateMissCount > 0 && (
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: 10,
                    padding: "8px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <span style={{ color: "#475569" }}>
                    Projected Percentage after {simulateMissCount} {simulateMissCount === 1 ? "absence" : "absences"}:
                  </span>
                  <span style={{ color: activeCalculation.simulatedAbsent.isBelow75 ? "#dc2626" : "#059669", fontWeight: 900 }}>
                    {activeCalculation.simulatedAbsent.projectedPercentage}% ({activeCalculation.simulatedAbsent.delta}%)
                  </span>
                </div>
              )}
            </div>

            {/* 2. "WHAT-IF I ATTEND NEXT Y CLASSES" */}
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <TrendingUp size={16} color="#16a34a" />
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#166534" }}>
                    What if I attend next classes?
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setSimulateAttendCount((p) => Math.max(0, p - 1))}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: "1px solid #86efac",
                      background: "#ffffff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Minus size={11} />
                  </button>

                  <span style={{ fontSize: 13, fontWeight: 900, minWidth: 20, textAlign: "center", color: "#166534" }}>
                    {simulateAttendCount}
                  </span>

                  <button
                    type="button"
                    onClick={() => setSimulateAttendCount((p) => p + 1)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: "1px solid #86efac",
                      background: "#ffffff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Plus size={11} />
                  </button>
                </div>
              </div>

              {simulateAttendCount > 0 && (
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: 10,
                    padding: "8px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <span style={{ color: "#475569" }}>
                    Projected Percentage after attending {simulateAttendCount} classes:
                  </span>
                  <span style={{ color: "#16a34a", fontWeight: 900 }}>
                    {activeCalculation.simulatedPresent.projectedPercentage}% (+{activeCalculation.simulatedPresent.delta}%)
                  </span>
                </div>
              )}
            </div>

            {/* 3. TARGET ATTENDANCE GOAL PLANNER */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Target size={16} color="#2563eb" />
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                    Target Attendance Goal Planner
                  </span>
                </div>

                <div style={{ display: "flex", gap: 4 }}>
                  {[75, 80, 85, 90].map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => setTargetGoal(goal)}
                      style={{
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: "pointer",
                        border: targetGoal === goal ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                        background: targetGoal === goal ? "#eff6ff" : "#ffffff",
                        color: targetGoal === goal ? "#2563eb" : "#64748b",
                      }}
                    >
                      {goal}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal Outcome Callout */}
              <div
                style={{
                  background: activeCalculation.classesNeeded > 0 ? "#eff6ff" : "#f0fdf4",
                  border: `1.5px solid ${activeCalculation.classesNeeded > 0 ? "#bfdbfe" : "#bbf7d0"}`,
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {activeCalculation.classesNeeded > 0 ? (
                  <>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: "#1e40af" }}>
                      Attend <strong>{activeCalculation.classesNeeded} more classes continuously</strong> to reach {targetGoal}%
                    </div>
                    {dateProjection && (
                      <div style={{ fontSize: 12, color: "#3b82f6", display: "flex", alignItems: "center", gap: 6 }}>
                        <CalendarIcon size={13} />
                        <span>
                          Estimated reach date: <strong>{dateProjection.estimatedDate}</strong> (approx {dateProjection.estimatedWeeks} weeks based on {dateProjection.classesPerWeek} classes/week routine)
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: "#166534" }}>
                      Safe Zone! You can safely miss up to <strong>{activeCalculation.safeBunks} classes</strong> and maintain &ge; {targetGoal}%
                    </div>
                    <div style={{ fontSize: 12, color: "#15803d" }}>
                      Current attendance is well above your {targetGoal}% target goal.
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            MY SEMESTER SUBJECTS MATRIX (SAVED STORE)
        ═══════════════════════════════════════════════════════════════ */}
        {savedSubjects.length > 0 && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 18,
              padding: isMobile ? "16px 14px" : "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <Layers size={16} color="#059669" />
                  My Saved Semester Subjects ({savedSubjects.length})
                </h3>
                <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
                  Saved attendance records for Section {selectedSection}. Click any card to edit or simulate.
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 12,
              }}
            >
              {savedSubjects.map((sub, idx) => {
                const subCalc = calculateAttendance({
                  components: sub.components,
                  targetPercentage: 75,
                });

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedSubjectName(sub.subjectName);
                      setComponentInputs(sub.components || []);
                    }}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 14,
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 10,
                      cursor: "pointer",
                      transition: "transform 0.15s, box-shadow 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                          {sub.subjectName}
                        </h4>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                          {subCalc.totalAttended} / {subCalc.totalDelivered} classes · {(sub.components || []).map((c) => c.type).join("+")}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span
                          style={{
                            fontSize: 16,
                            fontWeight: 900,
                            color: subCalc.currentPercentage >= 75 ? "#059669" : "#dc2626",
                          }}
                        >
                          {subCalc.currentPercentage}%
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0", paddingTop: 8 }}>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          color: subCalc.classesNeeded > 0 ? "#d97706" : "#16a34a",
                        }}
                      >
                        {subCalc.classesNeeded > 0 ? `Need ${subCalc.classesNeeded} classes for 75%` : `Safe: ${subCalc.safeBunks} bunks`}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSavedSubject(sub.subjectName);
                        }}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#94a3b8",
                          cursor: "pointer",
                          padding: 2,
                        }}
                        title="Delete Subject"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
