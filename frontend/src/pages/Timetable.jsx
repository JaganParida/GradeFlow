import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { encodeStudentId, decodeStudentId, isEncryptedToken } from "../utils/studentIdEncoder";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Calendar as CalendarIcon,
  MapPin,
  User,
  Search,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Sun,
  Coffee,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Grid,
  List,
  Layers,
  Award,
  Filter,
  Info,
  ExternalLink,
  Activity,
  ArrowRight,
  ShieldCheck,
  Building,
  GraduationCap,
  Trophy,
  X,
  Eye,
} from "lucide-react";
import {
  ALL_SECTIONS,
  DAYS_LIST,
  TIME_SLOTS,
  ACADEMIC_HOLIDAYS_2026_27,
  CUTM_ACADEMIC_CALENDAR_2026_27,
  getDayName,
  getDaySchedule,
  getHolidayInfo,
  getLivePeriodStatus,
  getLiveScheduleOverview,
  normalizeSection,
  formatDateKey,
} from "../utils/timetableHelper";

export default function Timetable() {
  const { studentId: urlParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { studentData, fetchStudent, loading: appLoading, hasActiveSession } = useApp();

  // Decode regNo from URL or context
  const decodedParam = urlParam
    ? isEncryptedToken(urlParam)
      ? decodeStudentId(urlParam)
      : urlParam
    : null;

  const currentRegNo = decodedParam || studentData?.regNo || sessionStorage.getItem("last_regNo") || "";

  // UI State
  const [selectedSection, setSelectedSection] = useState(() => {
    if (studentData?.section || studentData?.branch) {
      return normalizeSection(studentData.section || studentData.branch, currentRegNo);
    }
    return normalizeSection("CSE-A", currentRegNo);
  });

  const [viewMode, setViewMode] = useState("day"); // "day" | "week" | "academic" | "holidays"
  const [academicSemFilter, setAcademicSemFilter] = useState("all"); // "all" | "odd" | "even" | "events"
  const [mobileWeekDay, setMobileWeekDay] = useState("Monday");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [filterHolidayType, setFilterHolidayType] = useState("all");
  const [searchRegInput, setSearchRegInput] = useState("");
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const [inspectedClass, setInspectedClass] = useState(null);

  // Responsive listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update clock every 30 seconds for live period tracking
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
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
      navigate(`/timetable/${encodeStudentId(decodedParam)}`, { replace: true });
    }
  }, [decodedParam, urlParam, navigate]);

  const selectedDayName = useMemo(() => getDayName(selectedDate), [selectedDate]);
  const holidayInfo = useMemo(() => getHolidayInfo(selectedDate), [selectedDate]);

  // Day schedule for current section and day
  const daySchedule = useMemo(() => {
    return getDaySchedule(selectedSection, selectedDayName);
  }, [selectedSection, selectedDayName]);

  // Live class overview for today
  const liveOverview = useMemo(() => {
    return getLiveScheduleOverview(selectedSection, currentTime);
  }, [selectedSection, currentTime]);

  // Date Navigation Steppers
  function changeDateByOffset(offset) {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + offset);
      return next;
    });
  }

  function jumpToDay(dayName) {
    const dayIndex = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(dayName);
    setSelectedDate((prev) => {
      const d = new Date(prev);
      const currentDay = d.getDay();
      const diff = dayIndex - currentDay;
      d.setDate(d.getDate() + diff);
      return d;
    });
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
        navigate(`/timetable/${encodeStudentId(cleanReg)}`);
      } else {
        setSearchError(`Registration number "${cleanReg}" not found in university records.`);
      }
    } catch (err) {
      setSearchError("Failed to lookup student. Please check registration number.");
    } finally {
      setIsSearching(false);
    }
  }

  // Academic activity status calculation
  function getActivityStatus(startDateStr, endDateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);

    if (today > end) {
      return { status: "COMPLETED", label: "Completed", color: "#64748b", bg: "#f1f5f9" };
    }
    if (today >= start && today <= end) {
      return { status: "ACTIVE", label: "Active Now", color: "#16a34a", bg: "#dcfce7" };
    }
    const diffDays = Math.ceil((start - today) / (1000 * 60 * 60 * 24));
    return { status: "UPCOMING", label: `In ${diffDays} days`, color: "#2563eb", bg: "#eff6ff" };
  }

  // Enriched holidays list with countdown
  const enrichedHolidays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return ACADEMIC_HOLIDAYS_2026_27.map((h) => {
      const hDate = new Date(h.date);
      hDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((hDate - today) / (1000 * 60 * 60 * 24));

      return {
        ...h,
        diffDays,
        isPast: diffDays < 0,
        isToday: diffDays === 0,
        formattedDisplayDate: hDate.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      };
    }).filter((h) => {
      if (filterHolidayType === "all") return true;
      return h.type === filterHolidayType;
    });
  }, [filterHolidayType]);

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
                  background: "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
                }}
              >
                <Clock size={isMobile ? 22 : 26} />
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#2563eb",
                    fontSize: 11.5,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  <Building size={13} />
                  <span>Centurion University · B.Tech 7th Semester</span>
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
                  Section {selectedSection} Routine & Academic Schedule
                </h1>
              </div>
            </div>

            {/* Right: Section Selector Dropdown & Student Tag */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#64748b" }}>
                Section:
              </span>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: "1.5px solid #2563eb",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  outline: "none",
                  boxShadow: "0 1px 3px rgba(37, 99, 235, 0.1)",
                }}
              >
                {ALL_SECTIONS.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>

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
                  <User size={13} color="#2563eb" />
                  <span>{activeStudentName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Section Switcher Pills for Desktop */}
          {!isMobile && (
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
                Sections:
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
                      border: isActive ? "1.5px solid #2563eb" : "1px solid transparent",
                      background: isActive ? "#2563eb" : "transparent",
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

          {/* Search Bar & View Mode Switcher Row */}
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
            {/* Student Search Form */}
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
                  transition: "background 0.2s",
                }}
              >
                <span>{isSearching ? "Searching..." : "Find"}</span>
                <ArrowRight size={13} />
              </button>
            </form>

            {/* View Mode Switcher Pills */}
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
                onClick={() => setViewMode("day")}
                style={{
                  padding: isMobile ? "6px 10px" : "7px 14px",
                  borderRadius: 9,
                  border: "none",
                  background: viewMode === "day" ? "#ffffff" : "transparent",
                  color: viewMode === "day" ? "#2563eb" : "#64748b",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: viewMode === "day" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  whiteSpace: "nowrap",
                }}
              >
                <Clock size={14} />
                <span>Daily Routine</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("week")}
                style={{
                  padding: isMobile ? "6px 10px" : "7px 14px",
                  borderRadius: 9,
                  border: "none",
                  background: viewMode === "week" ? "#ffffff" : "transparent",
                  color: viewMode === "week" ? "#2563eb" : "#64748b",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: viewMode === "week" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  whiteSpace: "nowrap",
                }}
              >
                <Grid size={14} />
                <span>Weekly Matrix</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("academic")}
                style={{
                  padding: isMobile ? "6px 10px" : "7px 14px",
                  borderRadius: 9,
                  border: "none",
                  background: viewMode === "academic" ? "#ffffff" : "transparent",
                  color: viewMode === "academic" ? "#7c3aed" : "#64748b",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: viewMode === "academic" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  whiteSpace: "nowrap",
                }}
              >
                <CalendarIcon size={14} />
                <span>Academic Calendar</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("holidays")}
                style={{
                  padding: isMobile ? "6px 10px" : "7px 14px",
                  borderRadius: 9,
                  border: "none",
                  background: viewMode === "holidays" ? "#ffffff" : "transparent",
                  color: viewMode === "holidays" ? "#dc2626" : "#64748b",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: viewMode === "holidays" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  whiteSpace: "nowrap",
                }}
              >
                <Sun size={14} />
                <span>Holidays</span>
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
              <AlertCircle size={15} />
              <span>{searchError}</span>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            LIVE STATUS BANNER (If classes are scheduled today)
        ═══════════════════════════════════════════════════════════════ */}
        {liveOverview.activeClass ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
              border: "1.5px solid #86efac",
              borderRadius: 16,
              padding: "14px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              boxShadow: "0 4px 14px rgba(22, 163, 74, 0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: "#16a34a",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Activity size={18} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 800, color: "#16a34a" }}>
                  <Sparkles size={13} />
                  <span>ONGOING CLASS ({liveOverview.activeClass.remainingMins} mins remaining)</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                  {liveOverview.activeClass.subject}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12.5 }}>
              {liveOverview.activeClass.room && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#2563eb", fontWeight: 700, background: "#ffffff", padding: "4px 10px", borderRadius: 8, border: "1px solid #bfdbfe" }}>
                  <MapPin size={13} />
                  <span>Room: {liveOverview.activeClass.room}</span>
                </span>
              )}
              {liveOverview.activeClass.faculty && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#334155", fontWeight: 600, background: "#ffffff", padding: "4px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <User size={13} color="#64748b" />
                  <span>{liveOverview.activeClass.faculty}</span>
                </span>
              )}
            </div>
          </motion.div>
        ) : liveOverview.nextClass ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "linear-gradient(135deg, #f5f3ff 0%, #faf5ff 100%)",
              border: "1.5px solid #ddd6fe",
              borderRadius: 16,
              padding: "12px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Clock size={18} color="#7c3aed" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#5b21b6" }}>
                Next Class in {liveOverview.nextClass.startsInMins}m: <strong>{liveOverview.nextClass.subject}</strong> ({liveOverview.nextClass.slot.startTime})
              </span>
            </div>
            {liveOverview.nextClass.room && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#2563eb", fontSize: 12, fontWeight: 700, background: "#ffffff", padding: "3px 9px", borderRadius: 8, border: "1px solid #e0e7ff" }}>
                <MapPin size={12} />
                <span>Room: {liveOverview.nextClass.room}</span>
              </span>
            )}
          </motion.div>
        ) : null}

        {/* ═══════════════════════════════════════════════════════════════
            MODE 1: DAILY ROUTINE VIEW
        ═══════════════════════════════════════════════════════════════ */}
        {viewMode === "day" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Day / Date Navigation Toolbar */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: isMobile ? "10px 12px" : "12px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              {/* Stepper Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => changeDateByOffset(-1)}
                  style={{
                    padding: 7,
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Previous Day"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date())}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    color: "#0f172a",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() => changeDateByOffset(1)}
                  style={{
                    padding: 7,
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Next Day"
                >
                  <ChevronRight size={16} />
                </button>

                <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginLeft: 4 }}>
                  {selectedDate.toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              {/* Quick Jump Day Pills */}
              <div style={{ display: "flex", gap: 4, overflowX: "auto", maxWidth: "100%", paddingBottom: isMobile ? 4 : 0 }}>
                {DAYS_LIST.map((day) => {
                  const isSelected = selectedDayName === day;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => jumpToDay(day)}
                      style={{
                        padding: isMobile ? "5px 9px" : "6px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: "pointer",
                        border: isSelected ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                        background: isSelected ? "#eff6ff" : "#ffffff",
                        color: isSelected ? "#2563eb" : "#64748b",
                        whiteSpace: "nowrap",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {day.substring(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Holiday / Weekend Banner */}
            {holidayInfo?.isHoliday ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  background: holidayInfo.bg || "#fef2f2",
                  border: `1.5px solid ${holidayInfo.color || "#dc2626"}30`,
                  borderRadius: 18,
                  padding: "38px 24px",
                  textAlign: "center",
                  color: holidayInfo.color || "#dc2626",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 14,
                    background: "#ffffff",
                    color: holidayInfo.color || "#dc2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px auto",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  <Sun size={26} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>
                  {holidayInfo.title}
                </h3>
                <p style={{ fontSize: 13.5, opacity: 0.9, margin: "6px auto 0 auto", maxWidth: 480 }}>
                  {holidayInfo.description}
                </p>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 16,
                    background: "#ffffff",
                    border: `1px solid ${holidayInfo.color}40`,
                    padding: "6px 18px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  <CalendarIcon size={13} />
                  <span>No instructional classes on {selectedDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span>
                </div>
              </motion.div>
            ) : (
              /* Day Period Cards */
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {daySchedule.map((period, idx) => {
                  const slot = TIME_SLOTS[idx] || {};
                  const isToday = formatDateKey(selectedDate) === formatDateKey(currentTime);
                  const liveStatus = isToday ? getLivePeriodStatus(idx, currentTime) : "REGULAR";
                  const isLiveNow = liveStatus === "LIVE_NOW" && !period.isFree;

                  const isLab = period.type === "PR";
                  const isTut = period.type === "TUT";

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      style={{
                        background: isLiveNow
                          ? "#f0fdf4"
                          : period.isFree
                          ? "#f8fafc"
                          : "#ffffff",
                        border: isLiveNow
                          ? "2px solid #16a34a"
                          : "1px solid #e2e8f0",
                        borderRadius: 14,
                        padding: isMobile ? "12px 14px" : "14px 20px",
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "170px 1fr auto",
                        gap: isMobile ? 8 : 16,
                        alignItems: "center",
                        boxShadow: isLiveNow
                          ? "0 4px 14px rgba(22, 163, 74, 0.12)"
                          : "0 1px 3px rgba(0,0,0,0.02)",
                      }}
                    >
                      {/* Period Time Slot */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: isLiveNow
                              ? "#dcfce7"
                              : slot.isBreak
                              ? "#fef3c7"
                              : "#eff6ff",
                            color: isLiveNow
                              ? "#16a34a"
                              : slot.isBreak
                              ? "#d97706"
                              : "#2563eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 13,
                            fontWeight: 900,
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a", fontFamily: "'Space Mono', monospace" }}>
                            {slot.startTime} - {slot.endTime}
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                            {slot.isBreak ? "Lunch Break" : `Period ${idx + 1}`}
                          </div>
                        </div>
                      </div>

                      {/* Course / Subject Details */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: isMobile ? 14 : 15,
                              fontWeight: 800,
                              color: period.isFree ? "#94a3b8" : "#0f172a",
                            }}
                          >
                            {period.subject}
                          </span>

                          {period.type && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 900,
                                background: isLab ? "#f5f3ff" : isTut ? "#fffbeb" : "#ecfdf5",
                                color: isLab ? "#7c3aed" : isTut ? "#b45309" : "#059669",
                                border: `1px solid ${isLab ? "#ddd6fe" : isTut ? "#fde68a" : "#a7f3d0"}`,
                                padding: "2px 7px",
                                borderRadius: 6,
                              }}
                            >
                              {period.type === "PR" ? "PRACTICAL" : period.type === "TUT" ? "TUTORIAL" : period.type}
                            </span>
                          )}

                          {isLiveNow && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 900,
                                background: "#16a34a",
                                color: "#ffffff",
                                padding: "2px 8px",
                                borderRadius: 999,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Sparkles size={10} /> LIVE NOW
                            </span>
                          )}
                        </div>

                        {/* Room & Teacher Sub-row */}
                        {!period.isFree && (
                          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 4, flexWrap: "wrap", fontSize: 12 }}>
                            {period.room && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#2563eb", fontWeight: 700 }}>
                                <MapPin size={12} />
                                {period.room}
                              </span>
                            )}

                            {period.faculty && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#475569", fontWeight: 600 }}>
                                <User size={12} color="#64748b" />
                                {period.faculty}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action / Status on Desktop */}
                      {!isMobile && (
                        <div>
                          {period.isFree ? (
                            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, background: "#f1f5f9", padding: "4px 10px", borderRadius: 8 }}>
                              Free Slot
                            </span>
                          ) : isLiveNow ? (
                            <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 800, background: "#dcfce7", padding: "5px 12px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Activity size={12} /> In Progress
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: "#475569", fontWeight: 700, background: "#f8fafc", border: "1px solid #e2e8f0", padding: "5px 12px", borderRadius: 8 }}>
                              Scheduled
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            MODE 2: WEEKLY TIMETABLE MATRIX (100% Full Width On Desktop)
        ═══════════════════════════════════════════════════════════════ */}
        {viewMode === "week" && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 18,
              overflow: "hidden",
              boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
              width: "100%",
            }}
          >
            {/* Header Toolbar */}
            <div
              style={{
                padding: "16px 22px",
                borderBottom: "1px solid #e2e8f0",
                background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <Grid size={16} color="#2563eb" />
                  Weekly Routine Matrix · Section {selectedSection}
                </h4>
                <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
                  Full 6-day (Monday to Saturday) period matrix fitted across your viewport.
                </p>
              </div>

              {isMobile && (
                <div style={{ display: "flex", gap: 4, overflowX: "auto", maxWidth: "100%" }}>
                  {DAYS_LIST.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setMobileWeekDay(d)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 800,
                        border: mobileWeekDay === d ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                        background: mobileWeekDay === d ? "#eff6ff" : "#ffffff",
                        color: mobileWeekDay === d ? "#2563eb" : "#64748b",
                      }}
                    >
                      {d.substring(0, 3)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop View: 100% Fixed Width Grid without horizontal scroll */}
            {!isMobile ? (
              <div style={{ width: "100%", overflow: "hidden" }}>
                <table
                  style={{
                    width: "100%",
                    tableLayout: "fixed",
                    borderCollapse: "collapse",
                    textAlign: "left",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                      <th
                        style={{
                          width: "9%",
                          padding: "12px 10px",
                          fontWeight: 800,
                          color: "#475569",
                          fontSize: 12,
                          borderRight: "1px solid #e2e8f0",
                        }}
                      >
                        Day
                      </th>
                      {TIME_SLOTS.map((slot, idx) => (
                        <th
                          key={slot.id}
                          style={{
                            width: "11.37%",
                            padding: "10px 8px",
                            fontWeight: 800,
                            color: "#475569",
                            fontSize: 11,
                            borderRight: idx < TIME_SLOTS.length - 1 ? "1px solid #f1f5f9" : "none",
                            textAlign: "center",
                          }}
                        >
                          <div style={{ color: "#0f172a", fontFamily: "'Space Mono', monospace" }}>{slot.startTime} - {slot.endTime}</div>
                          <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>P{idx + 1}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS_LIST.map((day) => {
                      const schedule = getDaySchedule(selectedSection, day);
                      const isCurrentDay = day === getDayName(currentTime);

                      return (
                        <tr
                          key={day}
                          style={{
                            borderBottom: "1px solid #f1f5f9",
                            background: isCurrentDay ? "#f0fdf4" : "#ffffff",
                          }}
                        >
                          {/* Day Column */}
                          <td
                            style={{
                              padding: "12px 10px",
                              fontWeight: 800,
                              color: isCurrentDay ? "#16a34a" : "#0f172a",
                              borderRight: "1px solid #e2e8f0",
                              fontSize: 12,
                            }}
                          >
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                              <span>{day}</span>
                              {isCurrentDay && (
                                <span
                                  style={{
                                    fontSize: 8.5,
                                    fontWeight: 900,
                                    background: "#16a34a",
                                    color: "#ffffff",
                                    padding: "1px 4px",
                                    borderRadius: 4,
                                    alignSelf: "flex-start",
                                  }}
                                >
                                  TODAY
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 8 Periods */}
                          {schedule.map((period, pIdx) => {
                            const isLab = period.type === "PR";
                            const isTut = period.type === "TUT";

                            return (
                              <td
                                key={pIdx}
                                onClick={() => !period.isFree && setInspectedClass({ ...period, slot: TIME_SLOTS[pIdx], day })}
                                style={{
                                  padding: "6px 6px",
                                  verticalAlign: "top",
                                  borderRight: pIdx < schedule.length - 1 ? "1px solid #f1f5f9" : "none",
                                  height: 84,
                                  cursor: period.isFree ? "default" : "pointer",
                                }}
                              >
                                {period.isFree ? (
                                  <div
                                    style={{
                                      height: "100%",
                                      background: "#fafafa",
                                      borderRadius: 8,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "#cbd5e1",
                                      fontSize: 11,
                                      fontWeight: 600,
                                    }}
                                  >
                                    —
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      height: "100%",
                                      background: isLab ? "#faf5ff" : isTut ? "#fffbeb" : "#f8fafc",
                                      border: `1px solid ${isLab ? "#e9d5ff" : isTut ? "#fef3c7" : "#e2e8f0"}`,
                                      borderRadius: 8,
                                      padding: "6px 7px",
                                      display: "flex",
                                      flexDirection: "column",
                                      justifyContent: "space-between",
                                      boxSizing: "border-box",
                                      transition: "transform 0.15s, box-shadow 0.15s",
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontWeight: 800,
                                        color: "#0f172a",
                                        fontSize: 10.5,
                                        lineHeight: 1.25,
                                        overflow: "hidden",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                      }}
                                      title={period.subject}
                                    >
                                      {period.subject}
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, gap: 2 }}>
                                      {period.room ? (
                                        <span style={{ fontSize: 9.5, color: "#2563eb", fontWeight: 800 }}>
                                          {period.room.replace(/CSE-[A-Z]-/, "")}
                                        </span>
                                      ) : (
                                        <span />
                                      )}

                                      {period.type && (
                                        <span
                                          style={{
                                            fontSize: 8.5,
                                            fontWeight: 900,
                                            background: isLab ? "#7c3aed" : isTut ? "#d97706" : "#059669",
                                            color: "#ffffff",
                                            padding: "1px 4px",
                                            borderRadius: 4,
                                          }}
                                        >
                                          {period.type}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Mobile View: Day Routine Cards */
              <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                {getDaySchedule(selectedSection, mobileWeekDay).map((period, idx) => {
                  const slot = TIME_SLOTS[idx] || {};
                  return (
                    <div
                      key={idx}
                      style={{
                        background: period.isFree ? "#f8fafc" : "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 10,
                        padding: "10px 12px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: "#eff6ff",
                            color: "#2563eb",
                            fontSize: 11,
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          P{idx + 1}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: period.isFree ? "#94a3b8" : "#0f172a" }}>
                            {period.subject}
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>
                            {slot.startTime} - {slot.endTime}
                            {period.room && ` · ${period.room}`}
                          </div>
                        </div>
                      </div>

                      {period.type && (
                        <span style={{ fontSize: 10, fontWeight: 900, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>
                          {period.type}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            MODE 3: CUTM ACADEMIC CALENDAR 2026–27 (School of Engineering)
        ═══════════════════════════════════════════════════════════════ */}
        {viewMode === "academic" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Top Academic Scope Card & Filter Toolbar */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 18,
                padding: isMobile ? "14px 14px" : "18px 22px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#7c3aed", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <GraduationCap size={14} />
                  <span>Centurion University of Technology and Management, Odisha</span>
                </div>
                <h3 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: "#0f172a", margin: "2px 0 0 0" }}>
                  Academic Calendar 2026–27 (UG & PG — School of Engineering)
                </h3>
              </div>

              {/* Sub-Filters */}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {[
                  { id: "all", label: "All Schedules" },
                  { id: "odd", label: "Odd Sem (3rd, 5th, 7th)" },
                  { id: "even", label: "Even Sem (4th, 6th, 8th)" },
                  { id: "events", label: "Events & Festivals" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setAcademicSemFilter(f.id)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      border: academicSemFilter === f.id ? "1.5px solid #7c3aed" : "1px solid #e2e8f0",
                      background: academicSemFilter === f.id ? "#f5f3ff" : "#ffffff",
                      color: academicSemFilter === f.id ? "#7c3aed" : "#64748b",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 1. Odd Semester Section */}
            {(academicSemFilter === "all" || academicSemFilter === "odd") && (
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 18,
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <div
                  style={{
                    padding: "16px 20px",
                    background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "#2563eb",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      ODD
                    </div>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        {CUTM_ACADEMIC_CALENDAR_2026_27.oddSemester.title} Activities
                      </h4>
                      <div style={{ fontSize: 11.5, color: "#64748b" }}>
                        Applicable for: <strong>{CUTM_ACADEMIC_CALENDAR_2026_27.oddSemester.semestersLabel}</strong>
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: 11, fontWeight: 800, background: "#dbeafe", color: "#1e40af", padding: "3px 10px", borderRadius: 999 }}>
                    8 Academic Milestones
                  </span>
                </div>

                <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {CUTM_ACADEMIC_CALENDAR_2026_27.oddSemester.activities.map((act) => {
                    const statusInfo = getActivityStatus(act.startDate, act.endDate);
                    const isExam = act.category === "exam";

                    return (
                      <div
                        key={act.slNo}
                        style={{
                          background: statusInfo.status === "ACTIVE" ? "#f0fdf4" : "#ffffff",
                          border: statusInfo.status === "ACTIVE" ? "1.5px solid #16a34a" : "1px solid #e2e8f0",
                          borderRadius: 12,
                          padding: isMobile ? "12px 14px" : "14px 18px",
                          display: "grid",
                          gridTemplateColumns: isMobile ? "1fr" : "40px 1fr auto auto",
                          gap: isMobile ? 8 : 16,
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: isExam ? "#fef3c7" : "#f1f5f9",
                            color: isExam ? "#d97706" : "#475569",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          {act.slNo}
                        </div>

                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>
                            {act.name}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, display: "flex", alignItems: "center", gap: 6, fontFamily: "'Space Mono', monospace" }}>
                            <CalendarIcon size={12} color="#2563eb" />
                            <span>{act.schedule}</span>
                          </div>
                        </div>

                        <div>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 800,
                              background: isExam ? "#fef2f2" : "#f8fafc",
                              color: isExam ? "#dc2626" : "#475569",
                              border: `1px solid ${isExam ? "#fecaca" : "#e2e8f0"}`,
                              padding: "2px 8px",
                              borderRadius: 5,
                              textTransform: "uppercase",
                            }}
                          >
                            {act.category}
                          </span>
                        </div>

                        <div>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              background: statusInfo.bg,
                              color: statusInfo.color,
                              padding: "3px 10px",
                              borderRadius: 6,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            {statusInfo.status === "ACTIVE" && <Sparkles size={11} />}
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Even Semester Section */}
            {(academicSemFilter === "all" || academicSemFilter === "even") && (
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 18,
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <div
                  style={{
                    padding: "16px 20px",
                    background: "linear-gradient(135deg, #faf5ff 0%, #f8fafc 100%)",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "#7c3aed",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      EVEN
                    </div>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        {CUTM_ACADEMIC_CALENDAR_2026_27.evenSemester.title} Activities
                      </h4>
                      <div style={{ fontSize: 11.5, color: "#64748b" }}>
                        Applicable for: <strong>{CUTM_ACADEMIC_CALENDAR_2026_27.evenSemester.semestersLabel}</strong>
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: 11, fontWeight: 800, background: "#ede9fe", color: "#6d28d9", padding: "3px 10px", borderRadius: 999 }}>
                    8 Academic Milestones
                  </span>
                </div>

                <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {CUTM_ACADEMIC_CALENDAR_2026_27.evenSemester.activities.map((act) => {
                    const statusInfo = getActivityStatus(act.startDate, act.endDate);
                    const isExam = act.category === "exam";

                    return (
                      <div
                        key={act.slNo}
                        style={{
                          background: statusInfo.status === "ACTIVE" ? "#f0fdf4" : "#ffffff",
                          border: statusInfo.status === "ACTIVE" ? "1.5px solid #16a34a" : "1px solid #e2e8f0",
                          borderRadius: 12,
                          padding: isMobile ? "12px 14px" : "14px 18px",
                          display: "grid",
                          gridTemplateColumns: isMobile ? "1fr" : "40px 1fr auto auto",
                          gap: isMobile ? 8 : 16,
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: isExam ? "#fef3c7" : "#f1f5f9",
                            color: isExam ? "#d97706" : "#475569",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          {act.slNo}
                        </div>

                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>
                            {act.name}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, display: "flex", alignItems: "center", gap: 6, fontFamily: "'Space Mono', monospace" }}>
                            <CalendarIcon size={12} color="#7c3aed" />
                            <span>{act.schedule}</span>
                          </div>
                        </div>

                        <div>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 800,
                              background: isExam ? "#fef2f2" : "#f8fafc",
                              color: isExam ? "#dc2626" : "#475569",
                              border: `1px solid ${isExam ? "#fecaca" : "#e2e8f0"}`,
                              padding: "2px 8px",
                              borderRadius: 5,
                              textTransform: "uppercase",
                            }}
                          >
                            {act.category}
                          </span>
                        </div>

                        <div>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              background: statusInfo.bg,
                              color: statusInfo.color,
                              padding: "3px 10px",
                              borderRadius: 6,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            {statusInfo.status === "ACTIVE" && <Sparkles size={11} />}
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Lateral Entry Note Callout */}
                  <div
                    style={{
                      marginTop: 6,
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      color: "#92400e",
                      padding: "10px 14px",
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Info size={15} color="#b45309" style={{ flexShrink: 0 }} />
                    <span>{CUTM_ACADEMIC_CALENDAR_2026_27.evenSemester.lateralEntryNote}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Event Window, Sports & Festivals Section */}
            {(academicSemFilter === "all" || academicSemFilter === "events") && (
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 18,
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <div
                  style={{
                    padding: "16px 20px",
                    background: "linear-gradient(135deg, #fff7ed 0%, #f8fafc 100%)",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "#ea580c",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      <Trophy size={16} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        {CUTM_ACADEMIC_CALENDAR_2026_27.events.title}
                      </h4>
                      <div style={{ fontSize: 11.5, color: "#64748b" }}>
                        Sports, Gajajyoti Campus Festivals & Summer Internships
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: 11, fontWeight: 800, background: "#ffedd5", color: "#c2410c", padding: "3px 10px", borderRadius: 999 }}>
                    7 Campus Events
                  </span>
                </div>

                <div
                  style={{
                    padding: "16px 18px",
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(320px, 1fr))",
                    gap: 12,
                  }}
                >
                  {CUTM_ACADEMIC_CALENDAR_2026_27.events.items.map((event) => {
                    const statusInfo = getActivityStatus(event.startDate, event.endDate);
                    const isGajajyoti = event.category === "festival";
                    const isInternship = event.category === "internship";

                    return (
                      <div
                        key={event.slNo}
                        style={{
                          background: statusInfo.status === "ACTIVE" ? "#f0fdf4" : "#ffffff",
                          border: statusInfo.status === "ACTIVE" ? "1.5px solid #16a34a" : "1px solid #e2e8f0",
                          borderRadius: 14,
                          padding: "14px 16px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                              {event.name}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                background: isGajajyoti ? "#fdf2f8" : isInternship ? "#f0fdf4" : "#fff7ed",
                                color: isGajajyoti ? "#db2777" : isInternship ? "#16a34a" : "#ea580c",
                                padding: "2px 6px",
                                borderRadius: 4,
                                textTransform: "uppercase",
                              }}
                            >
                              {event.category}
                            </span>
                          </div>

                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, display: "flex", alignItems: "center", gap: 5, fontFamily: "'Space Mono', monospace" }}>
                            <CalendarIcon size={12} color="#ea580c" />
                            <span>{event.schedule}</span>
                          </div>

                          {event.location && (
                            <div style={{ fontSize: 11, color: "#2563eb", fontWeight: 700, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                              <MapPin size={11} />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              background: statusInfo.bg,
                              color: statusInfo.color,
                              padding: "3px 9px",
                              borderRadius: 6,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            MODE 4: ACADEMIC HOLIDAYS CALENDAR (CUTM 2026-27)
        ═══════════════════════════════════════════════════════════════ */}
        {viewMode === "holidays" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Filter Toolbar */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: "12px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div>
                <h4 style={{ fontSize: 14.5, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <CalendarIcon size={15} color="#dc2626" />
                  CUTM Academic Session 2026–27 Holiday List
                </h4>
                <p style={{ fontSize: 11.5, color: "#64748b", margin: "2px 0 0 0" }}>
                  Official university holidays, observation days, and 2nd Saturday non-instructional breaks.
                </p>
              </div>

              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {["all", "holiday", "observation", "optional"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFilterHolidayType(t)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      border: filterHolidayType === t ? "1.5px solid #dc2626" : "1px solid #e2e8f0",
                      background: filterHolidayType === t ? "#fef2f2" : "#ffffff",
                      color: filterHolidayType === t ? "#dc2626" : "#64748b",
                      textTransform: "capitalize",
                    }}
                  >
                    {t === "all" ? "All Occasions" : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Holiday Cards Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 12,
              }}
            >
              {enrichedHolidays.map((h, idx) => {
                return (
                  <div
                    key={idx}
                    style={{
                      background: "#ffffff",
                      border: h.isToday ? "2px solid #16a34a" : "1px solid #e2e8f0",
                      borderRadius: 14,
                      padding: "14px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                          {h.name}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            background: h.bg || "#f1f5f9",
                            color: h.color || "#475569",
                            padding: "2px 6px",
                            borderRadius: 4,
                            textTransform: "uppercase",
                          }}
                        >
                          {h.type}
                        </span>
                      </div>

                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, fontFamily: "'Space Mono', monospace" }}>
                        {h.formattedDisplayDate} ({h.day})
                      </div>
                    </div>

                    {/* Countdown Pill */}
                    <div>
                      {h.isToday ? (
                        <span style={{ fontSize: 11, fontWeight: 900, background: "#16a34a", color: "#ffffff", padding: "4px 9px", borderRadius: 6 }}>
                          TODAY
                        </span>
                      ) : h.diffDays > 0 ? (
                        <span style={{ fontSize: 11, fontWeight: 800, background: "#eff6ff", color: "#2563eb", padding: "4px 9px", borderRadius: 6 }}>
                          In {h.diffDays} days
                        </span>
                      ) : (
                        <span style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600 }}>
                          Past
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            CLASS DETAIL POPUP MODAL (For Matrix Click on Desktop)
        ═══════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {inspectedClass && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 23, 42, 0.45)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                padding: 16,
              }}
              onClick={() => setInspectedClass(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "#ffffff",
                  borderRadius: 18,
                  padding: "24px 26px",
                  maxWidth: 440,
                  width: "100%",
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {inspectedClass.day} · {inspectedClass.slot?.startTime} - {inspectedClass.slot?.endTime}
                    </span>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "4px 0 0 0" }}>
                      {inspectedClass.subject}
                    </h3>
                  </div>
                  <button
                    onClick={() => setInspectedClass(null)}
                    style={{
                      border: "none",
                      background: "#f1f5f9",
                      borderRadius: 8,
                      padding: 6,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={16} color="#64748b" />
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
                  {inspectedClass.room && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#eff6ff", borderRadius: 10 }}>
                      <MapPin size={16} color="#2563eb" />
                      <div>
                        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Room / Lab Location</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#1d4ed8" }}>{inspectedClass.room}</div>
                      </div>
                    </div>
                  )}

                  {inspectedClass.faculty && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 10 }}>
                      <User size={16} color="#475569" />
                      <div>
                        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Faculty In-Charge</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{inspectedClass.faculty}</div>
                      </div>
                    </div>
                  )}

                  {inspectedClass.type && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 10 }}>
                      <Layers size={16} color="#475569" />
                      <div>
                        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Course Category</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{inspectedClass.type}</div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setInspectedClass(null)}
                  style={{
                    width: "100%",
                    padding: "10px 0",
                    borderRadius: 10,
                    border: "none",
                    background: "#0f172a",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    marginTop: 18,
                  }}
                >
                  Close Details
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
