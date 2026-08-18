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
} from "lucide-react";
import {
  ALL_SECTIONS,
  DAYS_LIST,
  TIME_SLOTS,
  ACADEMIC_HOLIDAYS_2026_27,
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

  const [viewMode, setViewMode] = useState("day"); // "day" | "week" | "holidays"
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [filterHolidayType, setFilterHolidayType] = useState("all");
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
        background: "#f1f5f9",
        minHeight: "100vh",
        color: "#0f172a",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        paddingBottom: 80,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* ── Main Container ── */}
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: isMobile ? "16px 12px" : "28px 24px",
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? 14 : 20,
        }}
      >
        {/* ═══════════════════════════════════════════════════════════════
            TOP HERO HEADER CARD
        ═══════════════════════════════════════════════════════════════ */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 18,
            padding: isMobile ? "16px 14px" : "22px 26px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05), 0 6px 20px rgba(15, 23, 42, 0.03)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Header Row: Title & Section Controls */}
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
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: isMobile ? 42 : 48,
                  height: isMobile ? 42 : 48,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.22)",
                }}
              >
                <Clock size={isMobile ? 20 : 24} />
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#2563eb", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <Building size={13} />
                  <span>CUTM Academic Timetable · 7th Semester</span>
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
                  Section {selectedSection} Routine
                </h1>
              </div>
            </div>

            {/* Right: Section Selector Dropdown & Quick Switch */}
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

          {/* Student Search Prompt / Search Bar */}
          <div
            style={{
              paddingTop: 14,
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
                maxWidth: 420,
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
                  placeholder="Enter Registration No (e.g. 210301120001)"
                  value={searchRegInput}
                  onChange={(e) => setSearchRegInput(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px 8px 36px",
                    borderRadius: 9,
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
                  borderRadius: 9,
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
                <span>{isSearching ? "Searching..." : "Find Routine"}</span>
                <ArrowRight size={13} />
              </button>
            </form>

            {/* View Mode Switcher Pills */}
            <div
              style={{
                display: "inline-flex",
                background: "#f1f5f9",
                padding: 3,
                borderRadius: 10,
                gap: 2,
                border: "1px solid #e2e8f0",
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode("day")}
                style={{
                  padding: isMobile ? "6px 10px" : "6px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: viewMode === "day" ? "#ffffff" : "transparent",
                  color: viewMode === "day" ? "#2563eb" : "#64748b",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  boxShadow: viewMode === "day" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                <Clock size={13} />
                <span>Daily Routine</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("week")}
                style={{
                  padding: isMobile ? "6px 10px" : "6px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: viewMode === "week" ? "#ffffff" : "transparent",
                  color: viewMode === "week" ? "#2563eb" : "#64748b",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  boxShadow: viewMode === "week" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                <Grid size={13} />
                <span>Weekly Matrix</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("holidays")}
                style={{
                  padding: isMobile ? "6px 10px" : "6px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: viewMode === "holidays" ? "#ffffff" : "transparent",
                  color: viewMode === "holidays" ? "#dc2626" : "#64748b",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  boxShadow: viewMode === "holidays" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                <Sun size={13} />
                <span>Holiday Calendar</span>
              </button>
            </div>
          </div>

          {searchError && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <AlertCircle size={14} />
              <span>{searchError}</span>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            LIVE STATUS BANNER (If classes are today)
        ═══════════════════════════════════════════════════════════════ */}
        {liveOverview.activeClass ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
              border: "1.5px solid #86efac",
              borderRadius: 14,
              padding: "14px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
              boxShadow: "0 2px 8px rgba(22, 163, 74, 0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: "#16a34a",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Activity size={17} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 800, color: "#16a34a" }}>
                  <Sparkles size={13} />
                  <span>ONGOING CLASS ({liveOverview.activeClass.remainingMins} mins remaining)</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                  {liveOverview.activeClass.subject}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12 }}>
              {liveOverview.activeClass.room && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#2563eb", fontWeight: 700 }}>
                  <MapPin size={13} />
                  <span>Room: {liveOverview.activeClass.room}</span>
                </span>
              )}
              {liveOverview.activeClass.faculty && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#475569", fontWeight: 600 }}>
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
              borderRadius: 14,
              padding: "12px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Clock size={18} color="#7c3aed" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#5b21b6" }}>
                Next Class in {liveOverview.nextClass.startsInMins}m: <strong>{liveOverview.nextClass.subject}</strong> ({liveOverview.nextClass.slot.startTime})
              </span>
            </div>
            {liveOverview.nextClass.room && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#2563eb", fontSize: 12, fontWeight: 700 }}>
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
                border: "1px solid #cbd5e1",
                borderRadius: 14,
                padding: isMobile ? "10px 12px" : "12px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              {/* Stepper Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => changeDateByOffset(-1)}
                  style={{
                    padding: 6,
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
                    padding: "5px 12px",
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
                    padding: 6,
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

                <span style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a", marginLeft: 4 }}>
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
                        padding: isMobile ? "4px 8px" : "5px 12px",
                        borderRadius: 8,
                        fontSize: 11.5,
                        fontWeight: 800,
                        cursor: "pointer",
                        border: isSelected ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                        background: isSelected ? "#eff6ff" : "#ffffff",
                        color: isSelected ? "#2563eb" : "#64748b",
                        whiteSpace: "nowrap",
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
                  borderRadius: 16,
                  padding: "36px 20px",
                  textAlign: "center",
                  color: holidayInfo.color || "#dc2626",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: "#ffffff",
                    color: holidayInfo.color || "#dc2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px auto",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                  }}
                >
                  <Sun size={24} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>
                  {holidayInfo.title}
                </h3>
                <p style={{ fontSize: 13.5, opacity: 0.9, margin: "6px auto 0 auto", maxWidth: 460 }}>
                  {holidayInfo.description}
                </p>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 14,
                    background: "#ffffff",
                    border: `1px solid ${holidayInfo.color}40`,
                    padding: "5px 16px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  <CalendarIcon size={13} />
                  <span>No classes scheduled for {selectedDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span>
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
                          : "1px solid #cbd5e1",
                        borderRadius: 14,
                        padding: isMobile ? "12px 14px" : "14px 20px",
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "160px 1fr auto",
                        gap: isMobile ? 8 : 16,
                        alignItems: "center",
                        boxShadow: isLiveNow
                          ? "0 4px 14px rgba(22, 163, 74, 0.15)"
                          : "0 1px 3px rgba(0,0,0,0.03)",
                      }}
                    >
                      {/* Period Time Slot */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
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
                            fontSize: 12.5,
                            fontWeight: 900,
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", fontFamily: "'Space Mono', monospace" }}>
                            {slot.startTime} - {slot.endTime}
                          </div>
                          <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 600 }}>
                            {slot.isBreak ? "Lunch Break" : `Period ${idx + 1}`}
                          </div>
                        </div>
                      </div>

                      {/* Course / Subject Details */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: isMobile ? 13.5 : 14.5,
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
                                fontSize: 9.5,
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
                          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 4, flexWrap: "wrap", fontSize: 11.5 }}>
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
                              Free Period
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
            MODE 2: WEEKLY TIMETABLE MATRIX
        ═══════════════════════════════════════════════════════════════ */}
        {viewMode === "week" && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ padding: "16px 22px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Grid size={16} color="#2563eb" />
                Complete Weekly Routine Matrix · Section {selectedSection}
              </h4>
              <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
                Instructional schedule across Monday to Saturday for all 8 periods.
              </p>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 14px", width: 110, fontWeight: 800, color: "#475569" }}>Day</th>
                    {TIME_SLOTS.map((slot, idx) => (
                      <th key={slot.id} style={{ padding: "12px 10px", minWidth: 140, fontWeight: 800, color: "#475569" }}>
                        <div>{slot.startTime} - {slot.endTime}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>Period {idx + 1}</div>
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
                        <td style={{ padding: "12px 14px", fontWeight: 800, color: isCurrentDay ? "#16a34a" : "#0f172a", borderRight: "1px solid #f1f5f9" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            {day}
                            {isCurrentDay && <span style={{ fontSize: 9, background: "#16a34a", color: "#ffffff", padding: "1px 5px", borderRadius: 4 }}>TODAY</span>}
                          </div>
                        </td>

                        {/* Periods */}
                        {schedule.map((period, pIdx) => (
                          <td
                            key={pIdx}
                            style={{
                              padding: "10px 10px",
                              verticalAlign: "top",
                              borderRight: "1px solid #f1f5f9",
                              background: period.isFree ? "#fafafa" : "transparent",
                            }}
                          >
                            {period.isFree ? (
                              <span style={{ fontSize: 11, color: "#cbd5e1", fontStyle: "italic" }}>— Free —</span>
                            ) : (
                              <div>
                                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 11.5, lineHeight: 1.25 }}>
                                  {period.subject}
                                </div>
                                {period.room && (
                                  <div style={{ fontSize: 10, color: "#2563eb", fontWeight: 700, marginTop: 4, display: "flex", alignItems: "center", gap: 2 }}>
                                    <MapPin size={9} />
                                    <span>{period.room.replace(/CSE-[A-Z]-/, "")}</span>
                                  </div>
                                )}
                                {period.faculty && (
                                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 2, display: "flex", alignItems: "center", gap: 2 }}>
                                    <User size={9} />
                                    <span>{period.faculty.split("(")[0].trim()}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            MODE 3: ACADEMIC HOLIDAYS CALENDAR (CUTM 2026-27)
        ═══════════════════════════════════════════════════════════════ */}
        {viewMode === "holidays" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Filter Toolbar */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 14,
                padding: "12px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
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
                      border: h.isToday ? "2px solid #16a34a" : "1px solid #cbd5e1",
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
      </div>
    </div>
  );
}
