import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
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
  ChevronLeft,
  ChevronRight,
  Target,
  Zap,
  Grid,
  Sun,
  Check,
  X,
  Sparkles,
  BarChart3,
  GraduationCap,
} from "lucide-react";
import {
  ALL_SECTIONS,
  DAYS_LIST,
  TIME_SLOTS,
  normalizeSection,
  getSectionSubjectCatalog,
  getDaySchedule,
  resolveSubjectCode,
  cleanSubjectBaseName,
  calculateAttendance,
  estimateTargetReachDate,
} from "../utils/timetableHelper";

export default function AttendanceTracker() {
  const { studentId: urlParam } = useParams();
  const navigate = useNavigate();
  const {
    studentData,
    fetchStudent,
    loading: appLoading,
    API,
    adminToken,
    openStudentAuthModal,
  } = useApp();

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
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 768 : false));

  // Responsive listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Arrow Scroll Controllers for Horizontal Pill Bars
  const subjectPillsRef = useRef(null);
  const [canScrollSubjectLeft, setCanScrollSubjectLeft] = useState(false);
  const [canScrollSubjectRight, setCanScrollSubjectRight] = useState(true);

  const sectionPillsRef = useRef(null);
  const [canScrollSectionLeft, setCanScrollSectionLeft] = useState(false);
  const [canScrollSectionRight, setCanScrollSectionRight] = useState(true);

  function checkSubjectScroll() {
    if (!subjectPillsRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = subjectPillsRef.current;
    setCanScrollSubjectLeft(scrollLeft > 4);
    setCanScrollSubjectRight(scrollLeft < scrollWidth - clientWidth - 4);
  }

  function scrollSubjectPills(direction) {
    if (!subjectPillsRef.current) return;
    const offset = direction === "left" ? -220 : 220;
    subjectPillsRef.current.scrollBy({ left: offset, behavior: "smooth" });
    setTimeout(checkSubjectScroll, 250);
  }

  function checkSectionScroll() {
    if (!sectionPillsRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sectionPillsRef.current;
    setCanScrollSectionLeft(scrollLeft > 4);
    setCanScrollSectionRight(scrollLeft < scrollWidth - clientWidth - 4);
  }

  function scrollSectionPills(direction) {
    if (!sectionPillsRef.current) return;
    const offset = direction === "left" ? -180 : 180;
    sectionPillsRef.current.scrollBy({ left: offset, behavior: "smooth" });
    setTimeout(checkSectionScroll, 250);
  }

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

  // Sync to MongoDB helper
  const syncAttendanceToDb = async (updatedSaved = savedSubjects, updatedDaily = dailyAttendanceLogs, goal = targetGoal) => {
    if (!currentRegNo) return;
    try {
      await axios.post(`${API}/student/${currentRegNo}/attendance`, {
        section: selectedSection,
        targetGoal: goal,
        savedSubjects: updatedSaved,
        dailyLogs: { [todayDateKey]: updatedDaily },
      });
    } catch (err) {
      console.warn("Background attendance sync to MongoDB:", err.message);
    }
  };

  // Load saved Attendance from MongoDB on startup
  useEffect(() => {
    if (!currentRegNo) return;
    let isMounted = true;

    async function loadDbAttendance() {
      try {
        const res = await axios.get(`${API}/student/${currentRegNo}/attendance`);
        if (res.data?.success && res.data.attendance && isMounted) {
          const att = res.data.attendance;
          if (Array.isArray(att.savedSubjects) && att.savedSubjects.length > 0) {
            setSavedSubjects(att.savedSubjects);
          }
          if (att.targetGoal) {
            setTargetGoal(att.targetGoal);
          }
          if (att.dailyLogs && typeof att.dailyLogs === "object") {
            const todayLogs = att.dailyLogs[todayDateKey];
            if (todayLogs) {
              setDailyAttendanceLogs(todayLogs);
            }
          }
        }
      } catch (err) {
        console.warn("Could not load attendance from MongoDB:", err.message);
      }
    }

    loadDbAttendance();
    return () => {
      isMounted = false;
    };
  }, [currentRegNo, API, todayDateKey]);

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
    const existingComps = existing?.components || [];

    // Ensure all detected components (PP, PR, TUT) from timetable catalog are included
    const detectedTypes =
      catalogItem.components && catalogItem.components.length > 0
        ? catalogItem.components
        : ["PP"];

    const mergedComps = detectedTypes.map((type) => {
      const found = existingComps.find(
        (c) => c.type.toUpperCase() === type.toUpperCase()
      );
      return (
        found || {
          type,
          attended: 18,
          delivered: 24,
        }
      );
    });

    // Also include any user-added custom components that weren't in catalog
    existingComps.forEach((c) => {
      if (!detectedTypes.some((t) => t.toUpperCase() === c.type.toUpperCase())) {
        mergedComps.push(c);
      }
    });

    setComponentInputs(mergedComps.length > 0 ? mergedComps : [{ type: "PP", attended: 18, delivered: 24 }]);
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

  // ── Daily Timetable Check-in State ──────────────────────────────
  const todayDateObj = useMemo(() => new Date(), []);
  const todayDateKey = useMemo(() => todayDateObj.toISOString().slice(0, 10), [todayDateObj]);
  const todayDayIndex = todayDateObj.getDay(); // 0 Sun, 1 Mon ... 6 Sat
  const todayDayName = DAYS_LIST[todayDayIndex === 0 ? 0 : todayDayIndex - 1] || "Monday";

  const todayScheduleRaw = useMemo(() => {
    return getDaySchedule(selectedSection, todayDayName);
  }, [selectedSection, todayDayName]);

  const todayClasses = useMemo(() => {
    return (todayScheduleRaw || [])
      .map((period, idx) => ({
        ...period,
        slotIndex: idx,
        slot: TIME_SLOTS[idx],
        cleanName: cleanSubjectBaseName(period.subject),
      }))
      .filter((p) => !p.isFree && p.subject && p.subject !== "No Class / Free");
  }, [todayScheduleRaw]);

  const dailyLogKey = `gradeflow_attendance_log_${currentRegNo || selectedSection}_${todayDateKey}`;
  const [dailyAttendanceLogs, setDailyAttendanceLogs] = useState(() => {
    try {
      const stored = localStorage.getItem(dailyLogKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(dailyLogKey, JSON.stringify(dailyAttendanceLogs));
    } catch (e) {
      console.error("Failed to persist daily attendance log:", e);
    }
  }, [dailyAttendanceLogs, dailyLogKey]);

  // Handler for marking Present on today's classes (simple toggle, zero auto-absent)
  function handleToggleDailyAttendance(period) {
    const slotIdx = period.slotIndex;
    const isCurrentlyPresent = dailyAttendanceLogs[slotIdx] === "present";
    const cleanName = period.cleanName || cleanSubjectBaseName(period.subject);
    const compType = (period.type || "PP").toUpperCase();

    const deltaAttended = isCurrentlyPresent ? -1 : 1;
    const deltaDelivered = isCurrentlyPresent ? -1 : 1;

    // Update dailyAttendanceLogs
    const nextDailyLogs = { ...dailyAttendanceLogs };
    if (!isCurrentlyPresent) {
      nextDailyLogs[slotIdx] = "present";
    } else {
      delete nextDailyLogs[slotIdx];
    }
    setDailyAttendanceLogs(nextDailyLogs);

    // Update savedSubjects store
    let nextSavedList = [...savedSubjects];
    const existingIdx = nextSavedList.findIndex((s) => s.subjectName === cleanName);

    if (existingIdx !== -1) {
      const sub = { ...nextSavedList[existingIdx] };
      let matchedComp = false;
      const components = (sub.components || []).map((c) => {
        if (c.type.toUpperCase() === compType) {
          matchedComp = true;
          return {
            ...c,
            attended: Math.max(0, (c.attended || 0) + deltaAttended),
            delivered: Math.max(0, (c.delivered || 0) + deltaDelivered),
          };
        }
        return c;
      });

      if (!matchedComp) {
        components.push({
          type: compType,
          attended: Math.max(0, 18 + deltaAttended),
          delivered: Math.max(0, 24 + deltaDelivered),
        });
      }

      sub.components = components;
      sub.lastUpdated = new Date().toISOString();
      nextSavedList[existingIdx] = sub;
    } else {
      nextSavedList.push({
        subjectName: cleanName,
        components: [
          {
            type: compType,
            attended: Math.max(0, 18 + deltaAttended),
            delivered: Math.max(0, 24 + deltaDelivered),
          },
        ],
        section: selectedSection,
        lastUpdated: new Date().toISOString(),
        weeklyOccurrences: [],
      });
    }
    setSavedSubjects(nextSavedList);
    syncAttendanceToDb(nextSavedList, nextDailyLogs, targetGoal);

    // If currently inspecting this subject in the studio, update componentInputs in real time
    if (selectedSubjectName === cleanName) {
      setComponentInputs((prev) => {
        let hasType = false;
        const nextComps = prev.map((c) => {
          if (c.type.toUpperCase() === compType) {
            hasType = true;
            return {
              ...c,
              attended: Math.max(0, (c.attended || 0) + deltaAttended),
              delivered: Math.max(0, (c.delivered || 0) + deltaDelivered),
            };
          }
          return c;
        });
        if (!hasType) {
          nextComps.push({
            type: compType,
            attended: Math.max(0, 18 + deltaAttended),
            delivered: Math.max(0, 24 + deltaDelivered),
          });
        }
        return nextComps;
      });
    }
  }

  const [saveSuccessAlert, setSaveSuccessAlert] = useState(false);

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

    const filtered = savedSubjects.filter((s) => s.subjectName !== selectedSubjectName);
    const updatedList = [
      ...filtered,
      {
        subjectName: selectedSubjectName,
        components: componentInputs,
        lastUpdated: new Date().toISOString(),
        section: selectedSection,
        weeklyOccurrences: activeCatalogItem?.weeklyOccurrences || [],
      },
    ];

    setSavedSubjects(updatedList);
    syncAttendanceToDb(updatedList, dailyAttendanceLogs, targetGoal);
    setSaveSuccessAlert(true);
    setTimeout(() => setSaveSuccessAlert(false), 3500);
  }

  function handleDeleteSavedSubject(subjectName) {
    const updatedList = savedSubjects.filter((s) => s.subjectName !== subjectName);
    setSavedSubjects(updatedList);
    syncAttendanceToDb(updatedList, dailyAttendanceLogs, targetGoal);
  }

  // Complete List of Section Subjects with Detected Components & Saved Overrides
  const allSectionSubjects = useMemo(() => {
    const map = new Map();

    sectionCatalog.forEach((catItem) => {
      const saved = savedSubjects.find((s) => s.subjectName === catItem.subjectName);
      const savedComps = saved?.components || [];

      const detectedTypes =
        catItem.components && catItem.components.length > 0 ? catItem.components : ["PP"];

      const components = detectedTypes.map((type) => {
        const found = savedComps.find((c) => c.type.toUpperCase() === type.toUpperCase());
        return found || { type, attended: 18, delivered: 24 };
      });

      savedComps.forEach((c) => {
        if (!detectedTypes.some((t) => t.toUpperCase() === c.type.toUpperCase())) {
          components.push(c);
        }
      });

      map.set(catItem.subjectName, {
        subjectName: catItem.subjectName,
        components,
        classesPerWeek: catItem.classesPerWeek,
        weeklyOccurrences: catItem.weeklyOccurrences,
        isSaved: Boolean(saved),
      });
    });

    savedSubjects.forEach((saved) => {
      if (!map.has(saved.subjectName)) {
        map.set(saved.subjectName, {
          subjectName: saved.subjectName,
          components: saved.components || [{ type: "PP", attended: 18, delivered: 24 }],
          classesPerWeek: (saved.weeklyOccurrences || []).length || 3,
          weeklyOccurrences: saved.weeklyOccurrences || [],
          isSaved: true,
        });
      }
    });

    return Array.from(map.values());
  }, [sectionCatalog, savedSubjects]);

  // Overall Aggregate Attendance across all Semester Subjects
  const overallAggregate = useMemo(() => {
    const list = allSectionSubjects.length > 0 ? allSectionSubjects : savedSubjects;
    if (list.length === 0) {
      return {
        totalAttended: activeCalculation.totalAttended,
        totalDelivered: activeCalculation.totalDelivered,
        percentage: activeCalculation.currentPercentage,
        subjectsCount: 1,
      };
    }

    let totAtt = 0;
    let totDel = 0;

    list.forEach((sub) => {
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
      subjectsCount: list.length,
    };
  }, [allSectionSubjects, savedSubjects, activeCalculation]);

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
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* ── Main Container ── */}
      <div
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          padding: isMobile ? "12px 10px 80px 10px" : "24px 24px 90px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          boxSizing: "border-box",
          width: "100%",
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

          {/* Quick Section Switcher Pills with Arrow Buttons (In Guest / Generic Mode) */}
          {!activeStudentName && !currentRegNo && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, width: "100%", position: "relative" }}>
              <button
                type="button"
                onClick={() => scrollSectionPills("left")}
                disabled={!canScrollSectionLeft}
                aria-label="Scroll sections left"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: canScrollSectionLeft ? "#0f172a" : "#cbd5e1",
                  cursor: canScrollSectionLeft ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ChevronLeft size={14} />
              </button>

              <div
                ref={sectionPillsRef}
                onScroll={checkSectionScroll}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 8px",
                  borderRadius: 10,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  overflowX: "auto",
                  scrollBehavior: "smooth",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  flex: 1,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginRight: 2, flexShrink: 0 }}>
                  Sec:
                </span>
                {ALL_SECTIONS.map((sec) => {
                  const isActive = selectedSection === sec;
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setSelectedSection(sec)}
                      style={{
                        padding: "3px 9px",
                        borderRadius: 7,
                        fontSize: 11.5,
                        fontWeight: 800,
                        cursor: "pointer",
                        border: isActive ? "1.5px solid #059669" : "1px solid transparent",
                        background: isActive ? "#059669" : "transparent",
                        color: isActive ? "#ffffff" : "#475569",
                        transition: "all 0.15s ease",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {sec}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => scrollSectionPills("right")}
                disabled={!canScrollSectionRight}
                aria-label="Scroll sections right"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: canScrollSectionRight ? "#0f172a" : "#cbd5e1",
                  cursor: canScrollSectionRight ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ChevronRight size={14} />
              </button>
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
            {/* Admin Search OR Verified Student Lock Badge */}
            {adminToken ? (
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
                    placeholder="Admin: Lookup Reg No (e.g. 230301120001)"
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
            ) : currentRegNo ? (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 14px",
                  borderRadius: 10,
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#166534",
                  fontSize: 12.5,
                  fontWeight: 700,
                }}
              >
                <ShieldCheck size={16} color="#16a34a" />
                <span>
                  Authorized Student: <strong>{currentRegNo}</strong> &middot; Section <strong>{selectedSection}</strong>
                </span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12.5, color: "#64748b", fontWeight: 600 }}>
                  🔒 Log in to view your personalized attendance and daily routine check-in.
                </span>
                <button
                  type="button"
                  onClick={openStudentAuthModal}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 9,
                    border: "none",
                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    color: "#ffffff",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <GraduationCap size={14} />
                  <span>Student Login</span>
                </button>
              </div>
            )}

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
            gap: isMobile ? 8 : 12,
          }}
        >
          {/* Card 1: Overall Percentage */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: isMobile ? "12px 14px" : "16px 18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, color: "#64748b" }}>
                Aggregate %
              </span>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  background: overallAggregate.percentage >= 75 ? "#ecfdf5" : "#fef2f2",
                  color: overallAggregate.percentage >= 75 ? "#059669" : "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Percent size={14} />
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <div
                style={{
                  fontSize: isMobile ? 22 : 26,
                  fontWeight: 900,
                  color: overallAggregate.percentage >= 75 ? "#059669" : "#dc2626",
                  letterSpacing: "-0.5px",
                }}
              >
                {overallAggregate.percentage}%
              </div>
              <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2 }}>
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
              padding: isMobile ? "12px 14px" : "16px 18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, color: "#64748b" }}>
                Attended / Delivered
              </span>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckCircle2 size={14} />
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.5px" }}>
                {overallAggregate.totalAttended} <span style={{ fontSize: isMobile ? 13 : 15, color: "#94a3b8", fontWeight: 600 }}>/ {overallAggregate.totalDelivered}</span>
              </div>
              <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2 }}>
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
              padding: isMobile ? "12px 14px" : "16px 18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, color: "#64748b" }}>
                {activeCalculation.classesNeeded > 0 ? "Deficit Classes" : "Safe Bunk Margin"}
              </span>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  background: activeCalculation.classesNeeded > 0 ? "#fef3c7" : "#f0fdf4",
                  color: activeCalculation.classesNeeded > 0 ? "#d97706" : "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Zap size={14} />
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <div
                style={{
                  fontSize: isMobile ? 20 : 24,
                  fontWeight: 900,
                  color: activeCalculation.classesNeeded > 0 ? "#d97706" : "#16a34a",
                  letterSpacing: "-0.5px",
                }}
              >
                {activeCalculation.classesNeeded > 0
                  ? `${activeCalculation.classesNeeded} Req`
                  : `${activeCalculation.safeBunks} Classes`}
              </div>
              <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2 }}>
                {activeCalculation.classesNeeded > 0 ? `To reach ${targetGoal}%` : `Can miss & stay >= ${targetGoal}%`}
              </div>
            </div>
          </div>

          {/* Card 4: 75% Compliance Status */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: isMobile ? "12px 14px" : "16px 18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, color: "#64748b" }}>
                Exam Status
              </span>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  background: activeCalculation.currentPercentage >= 75 ? "#ecfdf5" : "#fef2f2",
                  color: activeCalculation.currentPercentage >= 75 ? "#059669" : "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Award size={14} />
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <div
                style={{
                  fontSize: isMobile ? 17 : 20,
                  fontWeight: 900,
                  color: activeCalculation.currentPercentage >= 75 ? "#059669" : "#dc2626",
                }}
              >
                {activeCalculation.currentPercentage >= 75 ? "ELIGIBLE" : "DEBARRED"}
              </div>
              <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2 }}>
                Criteria: 75%
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            TODAY'S DAILY ROUTINE ATTENDANCE CHECK-IN HUB
        ═══════════════════════════════════════════════════════════════ */}
        <div
          style={{
            background: "#ffffff",
            border: "1.5px solid #e2e8f0",
            borderRadius: 18,
            padding: isMobile ? "16px 14px" : "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <CalendarIcon size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: isMobile ? 15 : 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Today's Class Check-in ({todayDayName})
                </h3>
                <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
                  Mark attendance as each class ends to auto-increment your saved records in real time.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: "#059669",
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  padding: "3px 10px",
                  borderRadius: 8,
                }}
              >
                {Object.keys(dailyAttendanceLogs).length} / {todayClasses.length} Logged Today
              </span>
            </div>
          </div>

          {todayClasses.length === 0 ? (
            <div
              style={{
                background: "#f8fafc",
                border: "1px dashed #cbd5e1",
                borderRadius: 12,
                padding: "16px 20px",
                textAlign: "center",
                color: "#64748b",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Info size={16} color="#64748b" />
              <span>No classes scheduled for {todayDayName} (Section {selectedSection}). Enjoy your day.</span>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 10,
              }}
            >
              {todayClasses.map((period) => {
                const isPresent = dailyAttendanceLogs[period.slotIndex] === "present";
                const subCode = resolveSubjectCode(period, studentData);

                return (
                  <div
                    key={period.slotIndex}
                    style={{
                      background: isPresent ? "#f0fdf4" : "#ffffff",
                      border: `1.5px solid ${isPresent ? "#86efac" : "#e2e8f0"}`,
                      borderRadius: 14,
                      padding: "12px 14px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 10,
                      boxShadow: isPresent ? "0 2px 8px rgba(16, 185, 129, 0.08)" : "0 1px 3px rgba(0,0,0,0.02)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 800, color: "#64748b", fontFamily: "'Space Mono', monospace" }}>
                          P{period.slotIndex + 1} · {period.slot?.startTime} - {period.slot?.endTime}
                        </span>
                        <span
                          style={{
                            fontSize: 9.5,
                            fontWeight: 900,
                            background: period.type === "PR" ? "#faf5ff" : period.type === "TUT" ? "#fffbeb" : "#eff6ff",
                            color: period.type === "PR" ? "#7c3aed" : period.type === "TUT" ? "#b45309" : "#2563eb",
                            padding: "2px 6px",
                            borderRadius: 6,
                            border: `1px solid ${period.type === "PR" ? "#ddd6fe" : period.type === "TUT" ? "#fde68a" : "#bfdbfe"}`,
                          }}
                        >
                          {period.type || "PP"}
                        </span>
                      </div>

                      <div style={{ marginTop: 4 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a", lineHeight: 1.3 }}>
                          {period.cleanName}
                        </div>
                        {subCode && (
                          <span
                            style={{
                              fontSize: 10,
                              fontFamily: "'Space Mono', monospace",
                              fontWeight: 800,
                              color: "#2563eb",
                              background: "#eff6ff",
                              border: "1px solid #bfdbfe",
                              padding: "1px 5px",
                              borderRadius: 4,
                              display: "inline-block",
                              marginTop: 3,
                            }}
                          >
                            {subCode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Single Clean Interactive Mark Present Check-in Button */}
                    <div style={{ paddingTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => handleToggleDailyAttendance(period)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: 9,
                          border: isPresent ? "1.5px solid #059669" : "1px solid #cbd5e1",
                          background: isPresent ? "linear-gradient(135deg, #059669 0%, #047857 100%)" : "#ffffff",
                          color: isPresent ? "#ffffff" : "#334155",
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          transition: "all 0.15s ease",
                          boxShadow: isPresent ? "0 2px 6px rgba(5, 150, 105, 0.25)" : "none",
                        }}
                      >
                        {isPresent ? (
                          <>
                            <CheckCircle2 size={14} color="#ffffff" />
                            <span>Attended (Present)</span>
                          </>
                        ) : (
                          <>
                            <Check size={14} color="#64748b" />
                            <span>Mark Present</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            MAIN INTERACTIVE ATTENDANCE SIMULATOR STUDIO
        ═══════════════════════════════════════════════════════════════ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.15fr 0.85fr",
            gap: 16,
            alignItems: "start",
            width: "100%",
            boxSizing: "border-box",
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
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            {/* Routine Quick Subject Selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: isMobile ? 12 : 13.5, fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: 6 }}>
                  <BookOpen size={isMobile ? 14 : 16} color="#059669" />
                  Select Subject from Routine:
                </span>
                {activeCatalogItem && activeCatalogItem.classesPerWeek > 0 && (
                  <span
                    style={{
                      fontSize: isMobile ? 10.5 : 12,
                      fontWeight: 800,
                      color: "#2563eb",
                      background: "#eff6ff",
                      padding: isMobile ? "2px 8px" : "3px 10px",
                      borderRadius: 8,
                      border: "1px solid #bfdbfe",
                    }}
                  >
                    {activeCatalogItem.classesPerWeek} classes / week
                  </span>
                )}
              </div>

              {/* Quick Subject Pills with Arrow Scroll Buttons */}
              {sectionCatalog.length > 0 && (
                <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 6, width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
                  <button
                    type="button"
                    onClick={() => scrollSubjectPills("left")}
                    disabled={!canScrollSubjectLeft}
                    aria-label="Scroll subjects left"
                    style={{
                      width: isMobile ? 30 : 34,
                      height: isMobile ? 30 : 34,
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: canScrollSubjectLeft ? "#0f172a" : "#cbd5e1",
                      cursor: canScrollSubjectLeft ? "pointer" : "default",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      transition: "all 0.15s",
                    }}
                  >
                    <ChevronLeft size={isMobile ? 16 : 18} />
                  </button>

                  <div
                    ref={subjectPillsRef}
                    onScroll={checkSubjectScroll}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      overflowX: "auto",
                      scrollBehavior: "smooth",
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                      padding: "4px 0",
                    }}
                  >
                    {sectionCatalog.map((s) => {
                      const isSelected = selectedSubjectName === s.subjectName;
                      return (
                        <button
                          key={s.subjectName}
                          type="button"
                          onClick={() => selectSubjectFromCatalog(s)}
                          style={{
                            padding: isMobile ? "7px 14px" : "8px 16px",
                            borderRadius: 10,
                            fontSize: isMobile ? 12.5 : 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            border: isSelected ? "1.5px solid #059669" : "1px solid #e2e8f0",
                            background: isSelected ? "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)" : "#ffffff",
                            color: isSelected ? "#065f46" : "#475569",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                            boxShadow: isSelected ? "0 2px 6px rgba(5, 150, 105, 0.15)" : "0 1px 2px rgba(0,0,0,0.02)",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {s.subjectName}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => scrollSubjectPills("right")}
                    disabled={!canScrollSubjectRight}
                    aria-label="Scroll subjects right"
                    style={{
                      width: isMobile ? 30 : 34,
                      height: isMobile ? 30 : 34,
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: canScrollSubjectRight ? "#0f172a" : "#cbd5e1",
                      cursor: canScrollSubjectRight ? "pointer" : "default",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      transition: "all 0.15s",
                    }}
                  >
                    <ChevronRight size={isMobile ? 16 : 18} />
                  </button>
                </div>
              )}
            </div>

            {/* Component Breakdown Card Rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 10 : 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: isMobile ? 12 : 13, fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Components Breakdown (ERP Components)
                </span>
                <button
                  type="button"
                  onClick={() => addCustomComponent("PR")}
                  style={{
                    border: "1.5px solid #cbd5e1",
                    background: "#ffffff",
                    padding: isMobile ? "4px 10px" : "6px 14px",
                    borderRadius: 8,
                    fontSize: isMobile ? 11.5 : 12.5,
                    fontWeight: 700,
                    color: "#334155",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Plus size={isMobile ? 12 : 14} />
                  <span>Add Component</span>
                </button>
              </div>

              {componentInputs.map((comp, idx) => {
                const compPercent =
                  comp.delivered > 0 ? ((comp.attended / comp.delivered) * 100).toFixed(1) : "100.0";
                const isPassing = Number(compPercent) >= 75;

                return (
                  <div
                    key={idx}
                    style={{
                      background: "#ffffff",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: isMobile ? 16 : 18,
                      padding: isMobile ? "12px 12px" : "18px 20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: isMobile ? 10 : 14,
                      boxShadow: isMobile ? "0 1px 3px rgba(0,0,0,0.02)" : "0 2px 8px rgba(0,0,0,0.03)",
                      minWidth: 0,
                    }}
                  >
                    {/* Component Card Top Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            fontSize: isMobile ? 11.5 : 12.5,
                            fontWeight: 800,
                            background: comp.type === "PR" ? "#faf5ff" : comp.type === "TUT" ? "#fffbeb" : "#eff6ff",
                            color: comp.type === "PR" ? "#7c3aed" : comp.type === "TUT" ? "#b45309" : "#2563eb",
                            border: `1.5px solid ${comp.type === "PR" ? "#ddd6fe" : comp.type === "TUT" ? "#fde68a" : "#bfdbfe"}`,
                            padding: isMobile ? "3px 10px" : "4px 12px",
                            borderRadius: 8,
                            letterSpacing: "0.3px",
                          }}
                        >
                          {comp.type === "PR"
                            ? "PR • Practice (Lab)"
                            : comp.type === "TUT"
                            ? "TUT • Tutorial (Project)"
                            : "PP • Theory"}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            fontSize: isMobile ? 12.5 : 13.5,
                            fontWeight: 900,
                            background: isPassing ? "#ecfdf5" : "#fef2f2",
                            color: isPassing ? "#059669" : "#dc2626",
                            border: `1px solid ${isPassing ? "#a7f3d0" : "#fecaca"}`,
                            padding: isMobile ? "3px 10px" : "4px 12px",
                            borderRadius: 8,
                          }}
                        >
                          {compPercent}%
                        </span>
                        {componentInputs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeComponent(idx)}
                            aria-label="Remove component"
                            style={{
                              border: "none",
                              background: "transparent",
                              color: "#94a3b8",
                              cursor: "pointer",
                              padding: 4,
                              display: "flex",
                              alignItems: "center",
                              borderRadius: 6,
                              transition: "color 0.15s ease",
                            }}
                          >
                            <Trash2 size={isMobile ? 14 : 16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Line */}
                    <div style={{ width: "100%", height: 6, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, Number(compPercent)))}%`,
                          height: "100%",
                          background: isPassing ? "linear-gradient(90deg, #10b981, #059669)" : "linear-gradient(90deg, #f87171, #dc2626)",
                          borderRadius: 999,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>

                    {/* Inputs for Attended & Delivered */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: isMobile ? 8 : 14,
                        alignItems: "center",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    >
                      {/* Attended Stepper Box */}
                      <div
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: isMobile ? 12 : 14,
                          padding: isMobile ? "8px 6px" : "12px 14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: isMobile ? 6 : 8,
                          minWidth: 0,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: isMobile ? 11 : 13, color: "#334155", fontWeight: 800 }}>
                            Attended
                          </span>
                          <span
                            style={{
                              fontSize: isMobile ? 10.5 : 11.5,
                              color: "#059669",
                              fontWeight: 800,
                              background: isMobile ? "transparent" : "#ecfdf5",
                              padding: isMobile ? "0" : "2px 8px",
                              borderRadius: 6,
                            }}
                          >
                            {comp.attended} classes
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: isMobile ? "center" : "space-between",
                            gap: isMobile ? 4 : 8,
                            background: "#ffffff",
                            border: "1.5px solid #cbd5e1",
                            borderRadius: isMobile ? 10 : 12,
                            padding: isMobile ? "3px 4px" : "5px 8px",
                            width: "100%",
                            boxSizing: "border-box",
                            boxShadow: isMobile ? "none" : "0 1px 2px rgba(0, 0, 0, 0.02)",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => adjustComponentCount(idx, "attended", -1)}
                            aria-label="Decrease attended"
                            style={{
                              width: isMobile ? 28 : 36,
                              height: isMobile ? 28 : 36,
                              borderRadius: isMobile ? 6 : 8,
                              border: isMobile ? "none" : "1px solid #e2e8f0",
                              background: isMobile ? "#f1f5f9" : "#f8fafc",
                              color: "#334155",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              transition: "all 0.15s ease",
                            }}
                          >
                            <Minus size={isMobile ? 13 : 15} />
                          </button>

                          <input
                            type="number"
                            min="0"
                            value={comp.attended}
                            onChange={(e) => handleComponentChange(idx, "attended", e.target.value)}
                            style={{
                              flex: 1,
                              minWidth: isMobile ? 28 : 45,
                              maxWidth: isMobile ? 54 : "none",
                              height: isMobile ? 28 : 36,
                              border: "none",
                              textAlign: "center",
                              fontSize: isMobile ? 14 : 18,
                              fontWeight: 900,
                              fontFamily: isMobile ? "inherit" : "'Space Grotesk', -apple-system, sans-serif",
                              color: "#0f172a",
                              background: "transparent",
                              outline: "none",
                              padding: 0,
                              MozAppearance: "textfield",
                            }}
                          />

                          <button
                            type="button"
                            onClick={() => adjustComponentCount(idx, "attended", 1)}
                            aria-label="Increase attended"
                            style={{
                              width: isMobile ? 28 : 36,
                              height: isMobile ? 28 : 36,
                              borderRadius: isMobile ? 6 : 8,
                              border: isMobile ? "none" : "1px solid #e2e8f0",
                              background: isMobile ? "#f1f5f9" : "#f8fafc",
                              color: "#334155",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              transition: "all 0.15s ease",
                            }}
                          >
                            <Plus size={isMobile ? 13 : 15} />
                          </button>
                        </div>
                      </div>

                      {/* Total Delivered Stepper Box */}
                      <div
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: isMobile ? 12 : 14,
                          padding: isMobile ? "8px 6px" : "12px 14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: isMobile ? 6 : 8,
                          minWidth: 0,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: isMobile ? 11 : 13, color: "#334155", fontWeight: 800 }}>
                            Conducted
                          </span>
                          <span
                            style={{
                              fontSize: isMobile ? 10.5 : 11.5,
                              color: "#475569",
                              fontWeight: 800,
                              background: isMobile ? "transparent" : "#f1f5f9",
                              padding: isMobile ? "0" : "2px 8px",
                              borderRadius: 6,
                            }}
                          >
                            {comp.delivered} total
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: isMobile ? "center" : "space-between",
                            gap: isMobile ? 4 : 8,
                            background: "#ffffff",
                            border: "1.5px solid #cbd5e1",
                            borderRadius: isMobile ? 10 : 12,
                            padding: isMobile ? "3px 4px" : "5px 8px",
                            width: "100%",
                            boxSizing: "border-box",
                            boxShadow: isMobile ? "none" : "0 1px 2px rgba(0, 0, 0, 0.02)",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => adjustComponentCount(idx, "delivered", -1)}
                            aria-label="Decrease delivered"
                            style={{
                              width: isMobile ? 28 : 36,
                              height: isMobile ? 28 : 36,
                              borderRadius: isMobile ? 6 : 8,
                              border: isMobile ? "none" : "1px solid #e2e8f0",
                              background: isMobile ? "#f1f5f9" : "#f8fafc",
                              color: "#334155",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              transition: "all 0.15s ease",
                            }}
                          >
                            <Minus size={isMobile ? 13 : 15} />
                          </button>

                          <input
                            type="number"
                            min={comp.attended}
                            value={comp.delivered}
                            onChange={(e) => handleComponentChange(idx, "delivered", e.target.value)}
                            style={{
                              flex: 1,
                              minWidth: isMobile ? 28 : 45,
                              maxWidth: isMobile ? 54 : "none",
                              height: isMobile ? 28 : 36,
                              border: "none",
                              textAlign: "center",
                              fontSize: isMobile ? 14 : 18,
                              fontWeight: 900,
                              fontFamily: isMobile ? "inherit" : "'Space Grotesk', -apple-system, sans-serif",
                              color: "#0f172a",
                              background: "transparent",
                              outline: "none",
                              padding: 0,
                              MozAppearance: "textfield",
                            }}
                          />

                          <button
                            type="button"
                            onClick={() => adjustComponentCount(idx, "delivered", 1)}
                            aria-label="Increase delivered"
                            style={{
                              width: isMobile ? 28 : 36,
                              height: isMobile ? 28 : 36,
                              borderRadius: isMobile ? 6 : 8,
                              border: isMobile ? "none" : "1px solid #e2e8f0",
                              background: isMobile ? "#f1f5f9" : "#f8fafc",
                              color: "#334155",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              transition: "all 0.15s ease",
                            }}
                          >
                            <Plus size={isMobile ? 13 : 15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save to My Subjects Button */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              <button
                type="button"
                onClick={handleSaveActiveSubject}
                style={{
                  flex: 1,
                  padding: isMobile ? "10px 14px" : "13px 20px",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  color: "#ffffff",
                  fontSize: isMobile ? 13 : 14.5,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)",
                  transition: "all 0.15s ease",
                }}
              >
                <Save size={isMobile ? 14 : 16} />
                <span>Save to Semester Dashboard</span>
              </button>

              {saveSuccessAlert && (
                <div
                  style={{
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    color: "#065f46",
                    padding: "8px 12px",
                    borderRadius: 10,
                    fontSize: 12.5,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <CheckCircle2 size={15} color="#059669" />
                  <span>Subject "{selectedSubjectName}" saved & updated in your semester matrix!</span>
                </div>
              )}
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
              minWidth: 0,
              overflow: "hidden",
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

              {simulateMissCount > 0 ? (
                <div style={{ background: "#ffffff", padding: "10px 12px", borderRadius: 10, border: "1px solid #fca5a5" }}>
                  <div style={{ fontSize: 12, color: "#7f1d1d" }}>
                    If you miss <strong>{simulateMissCount} class(es)</strong>, your score drops from{" "}
                    <strong>{activeCalculation.currentPercentage}%</strong> to{" "}
                    <strong style={{ color: activeCalculation.simulatedPercentage >= 75 ? "#059669" : "#dc2626" }}>
                      {activeCalculation.simulatedPercentage}%
                    </strong>
                  </div>
                  {activeCalculation.simulatedPercentage < 75 && (
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#dc2626", marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}>
                      <AlertTriangle size={13} color="#dc2626" />
                      <span>Warning: This drop puts you below the mandatory 75% cutoff!</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 11.5, color: "#b91c1c" }}>
                  Test how missing upcoming lectures or labs impacts your 75% cutoff margin.
                </div>
              )}
            </div>

            {/* 2. "WHAT-IF I ATTEND X CLASSES IN A ROW" */}
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
                    What if I attend classes consecutively?
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

              {simulateAttendCount > 0 ? (
                <div style={{ background: "#ffffff", padding: "10px 12px", borderRadius: 10, border: "1px solid #86efac" }}>
                  <div style={{ fontSize: 12, color: "#14532d" }}>
                    Attending <strong>{simulateAttendCount} class(es)</strong> boosts your score from{" "}
                    <strong>{activeCalculation.currentPercentage}%</strong> to{" "}
                    <strong style={{ color: "#059669" }}>
                      {activeCalculation.simulatedPercentage}%
                    </strong>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 11.5, color: "#15803d" }}>
                  See how many points your attendance gains with continuous attendance.
                </div>
              )}
            </div>

            {/* 3. TARGET GOAL PLANNER (75% / 80% / 85% / 90%) */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                  <Target size={15} color="#2563eb" />
                  Target Goal Milestone:
                </span>
                <span style={{ fontSize: 12, fontWeight: 900, color: "#2563eb" }}>{targetGoal}%</span>
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                {[75, 80, 85, 90].map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setTargetGoal(goal)}
                    style={{
                      flex: 1,
                      padding: "6px 0",
                      borderRadius: 8,
                      border: targetGoal === goal ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                      background: targetGoal === goal ? "#2563eb" : "#ffffff",
                      color: targetGoal === goal ? "#ffffff" : "#475569",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {goal}%
                  </button>
                ))}
              </div>

              {/* Requirement or Safe Bunk Result Card */}
              <div
                style={{
                  background: activeCalculation.classesNeeded > 0 ? "#fffbeb" : "#f0fdf4",
                  border: `1px solid ${activeCalculation.classesNeeded > 0 ? "#fde68a" : "#bbf7d0"}`,
                  borderRadius: 10,
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {activeCalculation.classesNeeded > 0 ? (
                  <>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: "#92400e" }}>
                      Need to attend <strong>{activeCalculation.classesNeeded} more classes</strong> without absence to reach {targetGoal}%
                    </div>
                    {dateProjection && (
                      <div style={{ fontSize: 11.5, color: "#b45309", display: "flex", alignItems: "center", gap: 5 }}>
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
                    <div style={{ fontSize: 11.5, color: "#15803d" }}>
                      Current attendance is well above your {targetGoal}% target goal.
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            ALL SEMESTER SUBJECTS MATRIX & TARGET PREDICTOR
        ═══════════════════════════════════════════════════════════════ */}
        {allSectionSubjects.length > 0 && (
          <div
            style={{
              background: "#ffffff",
              border: "1.5px solid #e2e8f0",
              borderRadius: 18,
              padding: isMobile ? "16px 14px" : "22px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <h3 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <Layers size={18} color="#059669" />
                  Semester Subjects Attendance & Target Matrix ({allSectionSubjects.length})
                </h3>
                <p style={{ fontSize: 12, color: "#64748b", margin: "3px 0 0 0" }}>
                  Full multi-component breakdown (theory PP, practical PR, tutorial TUT) with target prediction for Section {selectedSection}.
                </p>
              </div>

              <div
                style={{
                  background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                  border: "1.5px solid #a7f3d0",
                  borderRadius: 12,
                  padding: "8px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: "#065f46", textTransform: "uppercase" }}>Overall Semester Score</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: overallAggregate.percentage >= 75 ? "#059669" : "#dc2626" }}>
                    {overallAggregate.percentage}% <span style={{ fontSize: 12, fontWeight: 700, color: "#065f46" }}>({overallAggregate.totalAttended}/{overallAggregate.totalDelivered})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Cards Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 14,
              }}
            >
              {allSectionSubjects.map((sub, idx) => {
                const subCalc = calculateAttendance({
                  components: sub.components,
                  targetPercentage: 75,
                });
                const subCalc80 = calculateAttendance({
                  components: sub.components,
                  targetPercentage: 80,
                });
                const subCode = resolveSubjectCode({ subject: sub.subjectName }, studentData);
                const isPassing = subCalc.currentPercentage >= 75;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedSubjectName(sub.subjectName);
                      setComponentInputs(sub.components || []);
                      window.scrollTo({ top: 400, behavior: "smooth" });
                    }}
                    style={{
                      background: "#ffffff",
                      border: `1.5px solid ${isPassing ? "#e2e8f0" : "#fecaca"}`,
                      borderRadius: 16,
                      padding: "16px 18px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 12,
                      cursor: "pointer",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                      transition: "transform 0.15s, box-shadow 0.15s, border-color 0.15s",
                    }}
                  >
                    <div>
                      {/* Card Header: Name + Code + Overall % */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                        <div>
                          <h4 style={{ fontSize: 14.5, fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>
                            {sub.subjectName}
                          </h4>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                            {subCode && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontFamily: "'Space Mono', monospace",
                                  fontWeight: 800,
                                  color: "#2563eb",
                                  background: "#eff6ff",
                                  border: "1px solid #bfdbfe",
                                  padding: "1px 5px",
                                  borderRadius: 4,
                                }}
                              >
                                {subCode}
                              </span>
                            )}
                            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>
                              {subCalc.totalAttended} / {subCalc.totalDelivered} classes
                            </span>
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontSize: 18,
                              fontWeight: 900,
                              color: isPassing ? "#059669" : "#dc2626",
                            }}
                          >
                            {subCalc.currentPercentage}%
                          </div>
                          <span
                            style={{
                              fontSize: 9.5,
                              fontWeight: 900,
                              background: isPassing ? "#ecfdf5" : "#fef2f2",
                              color: isPassing ? "#059669" : "#dc2626",
                              padding: "1px 6px",
                              borderRadius: 4,
                            }}
                          >
                            {isPassing ? "ELIGIBLE" : "SHORTAGE"}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ width: "100%", height: 5, background: "#f1f5f9", borderRadius: 999, margin: "10px 0 8px 0", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${Math.min(100, Math.max(0, subCalc.currentPercentage))}%`,
                            height: "100%",
                            background: isPassing ? "linear-gradient(90deg, #10b981, #059669)" : "linear-gradient(90deg, #f87171, #dc2626)",
                            borderRadius: 999,
                          }}
                        />
                      </div>

                      {/* Component breakdown list */}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                        {(sub.components || []).map((c, cIdx) => {
                          const cPct = c.delivered > 0 ? ((c.attended / c.delivered) * 100).toFixed(1) : "100.0";
                          return (
                            <span
                              key={cIdx}
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                background: c.type === "PR" ? "#faf5ff" : c.type === "TUT" ? "#fffbeb" : "#eff6ff",
                                color: c.type === "PR" ? "#7c3aed" : c.type === "TUT" ? "#b45309" : "#1e40af",
                                border: `1px solid ${c.type === "PR" ? "#ddd6fe" : c.type === "TUT" ? "#fde68a" : "#bfdbfe"}`,
                                padding: "2px 8px",
                                borderRadius: 6,
                              }}
                            >
                              {c.type === "PR" ? "PR (Practice)" : c.type === "TUT" ? "TUT (Project)" : "PP (Theory)"}: {c.attended}/{c.delivered} ({cPct}%)
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Smart Target & Safe Bunk Prediction Footer */}
                    <div
                      style={{
                        background: subCalc.classesNeeded > 0 ? "#fffbeb" : "#f0fdf4",
                        border: `1px solid ${subCalc.classesNeeded > 0 ? "#fde68a" : "#bbf7d0"}`,
                        borderRadius: 10,
                        padding: "8px 10px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5 }}>
                        {subCalc.classesNeeded > 0 ? (
                          <>
                            <AlertTriangle size={13} color="#d97706" />
                            <span style={{ fontWeight: 800, color: "#92400e" }}>
                              Need {subCalc.classesNeeded} more classes for 75.0%
                            </span>
                          </>
                        ) : subCalc80.classesNeeded > 0 ? (
                          <>
                            <TrendingUp size={13} color="#2563eb" />
                            <span style={{ fontWeight: 800, color: "#1e40af" }}>
                              Attend {subCalc80.classesNeeded} more classes for 80.0%
                            </span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} color="#16a34a" />
                            <span style={{ fontWeight: 800, color: "#166534" }}>
                              Safe to miss {subCalc.safeBunks} classes
                            </span>
                          </>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubjectName(sub.subjectName);
                            setComponentInputs(sub.components || []);
                            window.scrollTo({ top: 400, behavior: "smooth" });
                          }}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#2563eb",
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: "pointer",
                            padding: "2px 4px",
                          }}
                        >
                          Simulate &rarr;
                        </button>
                        {sub.isSaved && (
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
                            title="Reset Subject to Default"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
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
