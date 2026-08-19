import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useApp } from "../context/AppContext";
import { encodeStudentId, decodeStudentId, isEncryptedToken } from "../utils/studentIdEncoder";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Calendar as CalendarIcon,
  MapPin,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  Sun,
  Coffee,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
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
  Percent,
  Radio,
  FileText,
  Lock,
} from "lucide-react";
import {
  ALL_SECTIONS,
  DAYS_LIST,
  TIME_SLOTS,
  ACADEMIC_HOLIDAYS_2026_27,
  CUTM_ACADEMIC_CALENDAR_2026_27,
  CUTM_OPTIONAL_HOLIDAYS_RULES,
  getDayName,
  getDaySchedule,
  getHolidayInfo,
  getAcademicCalendarDateStatus,
  getLivePeriodStatus,
  getLiveScheduleOverview,
  normalizeSection,
  formatDateKey,
  is2023CSEBatch,
  resolveSubjectCode,
  cleanSubjectBaseName,
} from "../utils/timetableHelper";

export default function Timetable() {
  const { studentId: urlParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    studentData,
    fetchStudent,
    loading: appLoading,
    hasActiveSession,
    adminToken,
    openStudentAuthModal,
  } = useApp();

  // Decode regNo from URL or context
  const decodedParam = urlParam
    ? isEncryptedToken(urlParam)
      ? decodeStudentId(urlParam)
      : urlParam
    : null;

  const currentRegNo =
    decodedParam ||
    studentData?.regNo ||
    studentSession?.regNo ||
    localStorage.getItem("last_regNo") ||
    sessionStorage.getItem("last_regNo") ||
    "";

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
  const [selectedHolidayMonth, setSelectedHolidayMonth] = useState("all");
  const [searchRegInput, setSearchRegInput] = useState("");
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const [inspectedClass, setInspectedClass] = useState(null);

  // Holiday Month Scroll State & Methods
  const holidayMonthsRef = useRef(null);
  const [canScrollHolidayLeft, setCanScrollHolidayLeft] = useState(false);
  const [canScrollHolidayRight, setCanScrollHolidayRight] = useState(true);

  // Mode Switcher Scroll Controls
  const modeSwitcherRef = useRef(null);
  const [canScrollModeLeft, setCanScrollModeLeft] = useState(false);
  const [canScrollModeRight, setCanScrollModeRight] = useState(true);

  // Section Switcher Scroll Controls
  const sectionPillsRef = useRef(null);
  const [canScrollSectionLeft, setCanScrollSectionLeft] = useState(false);
  const [canScrollSectionRight, setCanScrollSectionRight] = useState(true);

  // Day Selector Pills Scroll Controls
  const dayPillsRef = useRef(null);
  const [canScrollDayLeft, setCanScrollDayLeft] = useState(false);
  const [canScrollDayRight, setCanScrollDayRight] = useState(true);

  // Weekly Matrix Mobile Day Tabs Scroll Controls
  const weekMobileDayRef = useRef(null);
  const [canScrollWeekDayLeft, setCanScrollWeekDayLeft] = useState(false);
  const [canScrollWeekDayRight, setCanScrollWeekDayRight] = useState(true);

  const checkHolidayScroll = () => {
    if (holidayMonthsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = holidayMonthsRef.current;
      setCanScrollHolidayLeft(scrollLeft > 5);
      setCanScrollHolidayRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  const scrollHolidayMonths = (direction) => {
    if (holidayMonthsRef.current) {
      const scrollAmount = direction === "left" ? -180 : 180;
      holidayMonthsRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(checkHolidayScroll, 200);
    }
  };

  const checkModeScroll = () => {
    if (modeSwitcherRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = modeSwitcherRef.current;
      setCanScrollModeLeft(scrollLeft > 4);
      setCanScrollModeRight(scrollLeft < scrollWidth - clientWidth - 4);
    }
  };

  const scrollModeSwitcher = (direction) => {
    if (modeSwitcherRef.current) {
      const scrollAmount = direction === "left" ? -160 : 160;
      modeSwitcherRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(checkModeScroll, 200);
    }
  };

  const checkSectionScroll = () => {
    if (sectionPillsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sectionPillsRef.current;
      setCanScrollSectionLeft(scrollLeft > 4);
      setCanScrollSectionRight(scrollLeft < scrollWidth - clientWidth - 4);
    }
  };

  const scrollSectionPills = (direction) => {
    if (sectionPillsRef.current) {
      const scrollAmount = direction === "left" ? -160 : 160;
      sectionPillsRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(checkSectionScroll, 200);
    }
  };

  const checkDayScroll = () => {
    if (dayPillsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = dayPillsRef.current;
      setCanScrollDayLeft(scrollLeft > 4);
      setCanScrollDayRight(scrollLeft < scrollWidth - clientWidth - 4);
    }
  };

  const scrollDayPills = (direction) => {
    if (dayPillsRef.current) {
      const scrollAmount = direction === "left" ? -140 : 140;
      dayPillsRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(checkDayScroll, 200);
    }
  };

  const checkWeekDayScroll = () => {
    if (weekMobileDayRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = weekMobileDayRef.current;
      setCanScrollWeekDayLeft(scrollLeft > 4);
      setCanScrollWeekDayRight(scrollLeft < scrollWidth - clientWidth - 4);
    }
  };

  const scrollWeekMobileDay = (direction) => {
    if (weekMobileDayRef.current) {
      const scrollAmount = direction === "left" ? -140 : 140;
      weekMobileDayRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(checkWeekDayScroll, 200);
    }
  };

  // Responsive listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      checkHolidayScroll();
      checkModeScroll();
      checkSectionScroll();
      checkDayScroll();
      checkWeekDayScroll();
    };
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

  // Dynamic custom schedules from server
  const [dynamicSchedules, setDynamicSchedules] = useState([]);

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || "/api";
    axios
      .get(`${API}/timetable/active-all`)
      .then(({ data }) => {
        if (data?.schedules) setDynamicSchedules(data.schedules);
      })
      .catch(() => {});
  }, []);

  const activeCustomSchedule = useMemo(() => {
    if (!dynamicSchedules.length) return null;
    const reg = String(currentRegNo || "").trim();
    const sBatch = studentData?.batch || (reg.startsWith("23") ? "2023" : reg.length >= 2 ? `20${reg.slice(0, 2)}` : "2023");
    const sBranch = (studentData?.branch || "CSE").toUpperCase();
    const sSec = selectedSection.toUpperCase();

    return (
      dynamicSchedules.find((s) => (s.section === sSec || s.section === "ALL") && (s.batch === sBatch || s.batch === "ALL")) ||
      dynamicSchedules.find((s) => s.section === sSec) ||
      null
    );
  }, [dynamicSchedules, studentData, currentRegNo, selectedSection]);

  // Derived date & routine helpers
  const selectedDayName = useMemo(() => getDayName(selectedDate), [selectedDate]);
  const holidayInfo = useMemo(() => getHolidayInfo(selectedDate), [selectedDate]);
  const academicDateStatus = useMemo(() => getAcademicCalendarDateStatus(selectedDate), [selectedDate]);

  const daySchedule = useMemo(() => {
    if (activeCustomSchedule?.schedule?.[selectedDayName]?.length > 0) {
      return activeCustomSchedule.schedule[selectedDayName];
    }
    return getDaySchedule(selectedSection, selectedDayName);
  }, [activeCustomSchedule, selectedSection, selectedDayName]);

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

  // Available Holiday Months list with counts
  const availableHolidayMonths = useMemo(() => {
    const monthMap = new Map();

    ACADEMIC_HOLIDAYS_2026_27.forEach((h) => {
      const parts = h.date.split("-");
      const monthKey = `${parts[0]}-${parts[1]}`;
      const d = new Date(h.date);
      const label = d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
      const fullLabel = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          key: monthKey,
          label,
          fullLabel,
          count: 0,
        });
      }
      monthMap.get(monthKey).count += 1;
    });

    return Array.from(monthMap.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, []);

  // Enriched holidays list with countdown and dual filtering (type + month)
  const enrichedHolidays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return ACADEMIC_HOLIDAYS_2026_27.map((h) => {
      const hDate = new Date(h.date);
      hDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((hDate - today) / (1000 * 60 * 60 * 24));
      const parts = h.date.split("-");
      const monthKey = `${parts[0]}-${parts[1]}`;

      return {
        ...h,
        monthKey,
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
      if (filterHolidayType !== "all" && h.type !== filterHolidayType) return false;
      if (selectedHolidayMonth !== "all" && h.monthKey !== selectedHolidayMonth) return false;
      return true;
    });
  }, [filterHolidayType, selectedHolidayMonth]);

  const activeStudentName = studentData?.studentName || "";
  const isEligibleBatch = useMemo(() => {
    if (!currentRegNo && !studentData) return true;
    if (is2023CSEBatch(studentData, currentRegNo)) return true;
    if (dynamicSchedules.length > 0) {
      const reg = String(currentRegNo || "").trim();
      const stBatch = studentData?.batch || (reg.length >= 2 ? `20${reg.slice(0, 2)}` : "");
      const stBranch = (studentData?.branch || "").toUpperCase();
      const hasMatch = dynamicSchedules.some(
        (s) =>
          (s.batch === stBatch || s.batch === "ALL") &&
          (stBranch.includes(s.branch) || s.branch === "ALL")
      );
      if (hasMatch) return true;
    }
    return false;
  }, [studentData, currentRegNo, dynamicSchedules]);

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
                    background: "#eff6ff",
                    border: "1.5px solid #2563eb",
                    color: "#1d4ed8",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  <Building size={14} color="#2563eb" />
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
                  <User size={13} color="#2563eb" />
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
                        border: isActive ? "1.5px solid #2563eb" : "1px solid transparent",
                        background: isActive ? "#2563eb" : "transparent",
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
                    transition: "background 0.2s",
                  }}
                >
                  <span>{isSearching ? "Searching..." : "Find"}</span>
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
                <span style={{ fontSize: 12.5, color: "#64748b", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <Lock size={13} color="#64748b" />
                  <span>Log in to view your personalized class timetable.</span>
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

            {/* View Mode Switcher Pills with Arrow Scroll Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, maxWidth: "100%", position: "relative" }}>
              <button
                type="button"
                onClick={() => scrollModeSwitcher("left")}
                disabled={!canScrollModeLeft}
                aria-label="Scroll modes left"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: canScrollModeLeft ? "#0f172a" : "#cbd5e1",
                  cursor: canScrollModeLeft ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ChevronLeft size={14} />
              </button>

              <div
                ref={modeSwitcherRef}
                onScroll={checkModeScroll}
                style={{
                  display: "inline-flex",
                  background: "#f1f5f9",
                  padding: 4,
                  borderRadius: 12,
                  gap: 3,
                  border: "1px solid #e2e8f0",
                  overflowX: "auto",
                  scrollBehavior: "smooth",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
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
                    flexShrink: 0,
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
                    flexShrink: 0,
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
                    flexShrink: 0,
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
                    flexShrink: 0,
                  }}
                >
                  <Sun size={14} />
                  <span>Holidays</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => scrollModeSwitcher("right")}
                disabled={!canScrollModeRight}
                aria-label="Scroll modes right"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: canScrollModeRight ? "#0f172a" : "#cbd5e1",
                  cursor: canScrollModeRight ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ChevronRight size={14} />
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
                  <Radio size={13} color="#16a34a" />
                  <span>ONGOING CLASS ({liveOverview.activeClass.remainingMins} mins remaining)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                    {cleanSubjectBaseName(liveOverview.activeClass.subject) || liveOverview.activeClass.subject}
                  </span>
                  {resolveSubjectCode(liveOverview.activeClass, studentData) && (
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: "'Space Mono', monospace",
                        fontWeight: 800,
                        color: "#15803d",
                        background: "#ffffff",
                        border: "1px solid #86efac",
                        padding: "1px 6px",
                        borderRadius: 6,
                      }}
                    >
                      {resolveSubjectCode(liveOverview.activeClass, studentData)}
                    </span>
                  )}
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
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Clock size={18} color="#7c3aed" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#5b21b6" }}>
                Next Class in {liveOverview.nextClass.startsInMins}m: <strong>{cleanSubjectBaseName(liveOverview.nextClass.subject) || liveOverview.nextClass.subject}</strong>
                {resolveSubjectCode(liveOverview.nextClass, studentData) && (
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 11,
                      fontFamily: "'Space Mono', monospace",
                      fontWeight: 800,
                      color: "#6d28d9",
                      background: "#ffffff",
                      border: "1px solid #ddd6fe",
                      padding: "1px 5px",
                      borderRadius: 5,
                    }}
                  >
                    {resolveSubjectCode(liveOverview.nextClass, studentData)}
                  </span>
                )} ({liveOverview.nextClass.slot.startTime})
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

        {/* Notice for non-2023 CSE students */}
        {!isEligibleBatch && (studentData || currentRegNo) && (viewMode === "day" || viewMode === "week") && (
          <div
            style={{
              background: "#fffbeb",
              border: "1.5px solid #fde68a",
              borderRadius: 18,
              padding: "26px 28px",
              display: "flex",
              alignItems: "flex-start",
              gap: 16,
              boxShadow: "0 2px 8px rgba(245, 158, 11, 0.08)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "#fef3c7",
                color: "#d97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Info size={22} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Notice · 2023 CSE Batch Only
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#92400e", margin: "4px 0 6px 0" }}>
                Class Timetable is Currently Available for 2023 CSE Batch Only
              </h3>
              <p style={{ fontSize: 13.5, color: "#78350f", margin: 0, lineHeight: 1.5 }}>
                The class timetable schedule is currently published specifically for <strong>B.Tech Computer Science &amp; Engineering (2023–2027 Batch)</strong>. Routine data for other batches and departments will be published as soon as released. You can still access the Academic Calendar and University Holidays tabs above.
              </p>
              <div style={{ marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => {
                    if (currentRegNo) {
                      navigate(`/dashboard/${encodeStudentId(currentRegNo)}`);
                    } else {
                      navigate("/");
                    }
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 10,
                    border: "none",
                    background: "#0f172a",
                    color: "#ffffff",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>Back to Dashboard</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ERP Master Schedule Variance Disclaimer Banner ── */}
        <div
          style={{
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
            border: "1px solid #cbd5e1",
            borderRadius: 14,
            padding: isMobile ? "10px 14px" : "12px 18px",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            fontSize: 12,
            color: "#475569",
            lineHeight: 1.5,
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <Info size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong style={{ color: "#0f172a", fontWeight: 800 }}>Schedule Disclaimer: </strong>
            Class routines displayed on GradeFlow reflect the semester master timetable. Daily period schedules or room allocations on the official university ERP may occasionally vary due to day-to-day faculty adjustments, compensatory classes, or university event schedules.
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            MODE 1: DAILY ROUTINE VIEW
        ═══════════════════════════════════════════════════════════════ */}
        {viewMode === "day" && (isEligibleBatch || (!studentData && !currentRegNo)) && (
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

              {/* Quick Jump Day Pills with Arrow Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: 3, maxWidth: "100%" }}>
                {isMobile && (
                  <button
                    type="button"
                    onClick={() => scrollDayPills("left")}
                    disabled={!canScrollDayLeft}
                    aria-label="Scroll days left"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: canScrollDayLeft ? "#0f172a" : "#cbd5e1",
                      cursor: canScrollDayLeft ? "pointer" : "default",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <ChevronLeft size={13} />
                  </button>
                )}

                <div
                  ref={dayPillsRef}
                  onScroll={checkDayScroll}
                  style={{
                    display: "flex",
                    gap: 4,
                    overflowX: "auto",
                    scrollBehavior: "smooth",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    maxWidth: "100%",
                    paddingBottom: isMobile ? 2 : 0,
                  }}
                >
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
                          flexShrink: 0,
                          transition: "all 0.15s ease",
                        }}
                      >
                        {day.substring(0, 3)}
                      </button>
                    );
                  })}
                </div>

                {isMobile && (
                  <button
                    type="button"
                    onClick={() => scrollDayPills("right")}
                    disabled={!canScrollDayRight}
                    aria-label="Scroll days right"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: canScrollDayRight ? "#0f172a" : "#cbd5e1",
                      cursor: canScrollDayRight ? "pointer" : "default",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <ChevronRight size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* 1. Holiday / Weekend Banner */}
            {holidayInfo?.isHoliday ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  background: holidayInfo.bg || "#fef2f2",
                  border: `1.5px solid ${holidayInfo.color || "#dc2626"}30`,
                  borderRadius: 18,
                  padding: isMobile ? "28px 16px" : "38px 24px",
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
            ) : (academicDateStatus?.isOutsideSession || academicDateStatus?.classesSuspended) ? (
              /* 2. Academic Calendar Milestone / Outside Session Notice */
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  background: academicDateStatus.bg || "#f8fafc",
                  border: `1.5px solid ${academicDateStatus.color}35`,
                  borderRadius: 18,
                  padding: isMobile ? "28px 16px" : "38px 24px",
                  textAlign: "center",
                  color: academicDateStatus.color,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 14,
                    background: "#ffffff",
                    color: academicDateStatus.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px auto",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  {academicDateStatus.isExam ? <AlertTriangle size={26} /> : <GraduationCap size={26} />}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: "#0f172a" }}>
                  {academicDateStatus.title}
                </h3>
                <p style={{ fontSize: 13.5, color: "#475569", margin: "8px auto 0 auto", maxWidth: 520, lineHeight: 1.5 }}>
                  {academicDateStatus.message}
                </p>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 16,
                    background: "#ffffff",
                    border: `1px solid ${academicDateStatus.color}40`,
                    padding: "6px 18px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  <CalendarIcon size={13} />
                  <span>{selectedDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
                <div style={{ marginTop: 14 }}>
                  <button
                    type="button"
                    onClick={() => setViewMode("academic")}
                    style={{
                      background: "#0f172a",
                      color: "#ffffff",
                      border: "none",
                      padding: "8px 18px",
                      borderRadius: 10,
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    View Full Academic Calendar
                  </button>
                </div>
              </motion.div>
            ) : (
              /* 3. Regular Scheduled Routine */
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Last Date of Instruction Celebration Banner */}
                {academicDateStatus?.isLastInstruction && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                      border: "1.5px solid #3b82f6",
                      borderRadius: 14,
                      padding: "14px 18px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      color: "#1e40af",
                      boxShadow: "0 2px 8px rgba(59, 130, 246, 0.08)",
                    }}
                  >
                    <GraduationCap size={22} color="#2563eb" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: 13, fontWeight: 700 }}>
                      <strong>🎯 Last Date of Instruction (Odd Semester): </strong>
                      Today (31st October 2026) is the final day of semester teaching. Practical &amp; Theory exams commence next week.
                    </div>
                  </motion.div>
                )}
                {/* Optional Holiday Notice Banner if applicable */}
                {holidayInfo?.isOptional && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: "linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%)",
                      border: "1.5px solid #c084fc",
                      borderRadius: 14,
                      padding: "14px 18px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 12,
                      boxShadow: "0 2px 8px rgba(124, 58, 237, 0.08)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: "#7c3aed",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Info size={18} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          <span>Optional University Holiday · Classes Running as Scheduled</span>
                        </div>
                        <div style={{ fontSize: 14.5, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                          {holidayInfo.title}
                        </div>
                        <div style={{ fontSize: 12, color: "#6b21a8", marginTop: 2 }}>
                          University remains open and instructional classes are conducted as scheduled below. Students and faculty are permitted to avail any 2 optional leaves per academic year.
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, background: "#ede9fe", color: "#6d28d9", padding: "4px 10px", borderRadius: 8, border: "1px solid #ddd6fe" }}>
                        Optional Leave Eligible
                      </span>
                    </div>
                  </motion.div>
                )}

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
                            {cleanSubjectBaseName(period.subject) || period.subject}
                          </span>

                          {!period.isFree && resolveSubjectCode(period, studentData) && (
                            <span
                              style={{
                                fontSize: 11,
                                fontFamily: "'Space Mono', monospace",
                                fontWeight: 800,
                                color: "#2563eb",
                                background: "#eff6ff",
                                border: "1px solid #bfdbfe",
                                padding: "2px 7px",
                                borderRadius: 6,
                                letterSpacing: "0.5px",
                              }}
                            >
                              {resolveSubjectCode(period, studentData)}
                            </span>
                          )}

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
                                gap: 5,
                              }}
                            >
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#ffffff" }} /> LIVE NOW
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
        {viewMode === "week" && (isEligibleBatch || (!studentData && !currentRegNo)) && (
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
                <div style={{ display: "flex", alignItems: "center", gap: 3, maxWidth: "100%" }}>
                  <button
                    type="button"
                    onClick={() => scrollWeekMobileDay("left")}
                    disabled={!canScrollWeekDayLeft}
                    aria-label="Scroll week days left"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: canScrollWeekDayLeft ? "#0f172a" : "#cbd5e1",
                      cursor: canScrollWeekDayLeft ? "pointer" : "default",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <ChevronLeft size={13} />
                  </button>

                  <div
                    ref={weekMobileDayRef}
                    onScroll={checkWeekDayScroll}
                    style={{
                      display: "flex",
                      gap: 4,
                      overflowX: "auto",
                      scrollBehavior: "smooth",
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                      maxWidth: "100%",
                      padding: "2px 0",
                    }}
                  >
                    {DAYS_LIST.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setMobileWeekDay(d)}
                        style={{
                          padding: "5px 9px",
                          borderRadius: 7,
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: "pointer",
                          border: mobileWeekDay === d ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                          background: mobileWeekDay === d ? "#eff6ff" : "#ffffff",
                          color: mobileWeekDay === d ? "#2563eb" : "#64748b",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {d.substring(0, 3)}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => scrollWeekMobileDay("right")}
                    disabled={!canScrollWeekDayRight}
                    aria-label="Scroll week days right"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: canScrollWeekDayRight ? "#0f172a" : "#cbd5e1",
                      cursor: canScrollWeekDayRight ? "pointer" : "default",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <ChevronRight size={13} />
                  </button>
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
                                      title={cleanSubjectBaseName(period.subject) || period.subject}
                                    >
                                      {cleanSubjectBaseName(period.subject) || period.subject}
                                    </div>

                                    {resolveSubjectCode(period, studentData) && (
                                      <div
                                        style={{
                                          fontSize: 9,
                                          fontFamily: "'Space Mono', monospace",
                                          fontWeight: 800,
                                          color: "#2563eb",
                                          marginTop: 2,
                                          letterSpacing: "0.3px",
                                        }}
                                      >
                                        {resolveSubjectCode(period, studentData)}
                                      </div>
                                    )}

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
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: period.isFree ? "#94a3b8" : "#0f172a" }}>
                              {cleanSubjectBaseName(period.subject) || period.subject}
                            </span>
                            {!period.isFree && resolveSubjectCode(period, studentData) && (
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
                                {resolveSubjectCode(period, studentData)}
                              </span>
                            )}
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
                            {statusInfo.status === "ACTIVE" && <CheckCircle2 size={11} />}
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
                            {statusInfo.status === "ACTIVE" && <CheckCircle2 size={11} />}
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

            {/* Interactive Month Filter Tabs with Left/Right Scroll Controls */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: "8px 10px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                position: "relative",
              }}
            >
              {/* Left Scroll Arrow */}
              <button
                type="button"
                onClick={() => scrollHolidayMonths("left")}
                disabled={!canScrollHolidayLeft}
                aria-label="Scroll months left"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: canScrollHolidayLeft ? "1px solid #cbd5e1" : "1px solid #e2e8f0",
                  background: canScrollHolidayLeft ? "#f8fafc" : "#f1f5f9",
                  color: canScrollHolidayLeft ? "#0f172a" : "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: canScrollHolidayLeft ? "pointer" : "default",
                  flexShrink: 0,
                  transition: "all 0.15s ease",
                  opacity: canScrollHolidayLeft ? 1 : 0.45,
                }}
              >
                <ChevronLeft size={16} />
              </button>

              {/* Scrollable Months Track */}
              <div
                ref={holidayMonthsRef}
                onScroll={checkHolidayScroll}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  overflowX: "auto",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  WebkitOverflowScrolling: "touch",
                  flex: 1,
                  padding: "2px 0",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginRight: 4, whiteSpace: "nowrap" }}>
                  Month:
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedHolidayMonth("all")}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    border: selectedHolidayMonth === "all" ? "1.5px solid #dc2626" : "1px solid #e2e8f0",
                    background: selectedHolidayMonth === "all" ? "#dc2626" : "#ffffff",
                    color: selectedHolidayMonth === "all" ? "#ffffff" : "#475569",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  <span>All Months</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 900,
                      background: selectedHolidayMonth === "all" ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                      color: selectedHolidayMonth === "all" ? "#ffffff" : "#64748b",
                      padding: "1px 6px",
                      borderRadius: 99,
                    }}
                  >
                    {ACADEMIC_HOLIDAYS_2026_27.length}
                  </span>
                </button>

                {availableHolidayMonths.map((m) => {
                  const isSelected = selectedHolidayMonth === m.key;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setSelectedHolidayMonth(m.key)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: "pointer",
                        border: isSelected ? "1.5px solid #dc2626" : "1px solid #e2e8f0",
                        background: isSelected ? "#dc2626" : "#ffffff",
                        color: isSelected ? "#ffffff" : "#475569",
                        whiteSpace: "nowrap",
                        transition: "all 0.15s ease",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        flexShrink: 0,
                      }}
                    >
                      <span>{m.label}</span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 900,
                          background: isSelected ? "rgba(255,255,255,0.25)" : "#fef2f2",
                          color: isSelected ? "#ffffff" : "#dc2626",
                          padding: "1px 6px",
                          borderRadius: 99,
                        }}
                      >
                        {m.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right Scroll Arrow */}
              <button
                type="button"
                onClick={() => scrollHolidayMonths("right")}
                disabled={!canScrollHolidayRight}
                aria-label="Scroll months right"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: canScrollHolidayRight ? "1px solid #cbd5e1" : "1px solid #e2e8f0",
                  background: canScrollHolidayRight ? "#f8fafc" : "#f1f5f9",
                  color: canScrollHolidayRight ? "#0f172a" : "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: canScrollHolidayRight ? "pointer" : "default",
                  flexShrink: 0,
                  transition: "all 0.15s ease",
                  opacity: canScrollHolidayRight ? 1 : 0.45,
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* CUTM Optional Holidays & Guidelines Policy Showcase */}
            <div
              style={{
                background: "linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)",
                border: "1.5px solid #d8b4fe",
                borderRadius: 16,
                padding: isMobile ? "14px 14px" : "18px 22px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                boxShadow: "0 2px 8px rgba(147, 51, 234, 0.05)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#7c3aed", fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <FileText size={13} color="#7c3aed" />
                    <span>Official CUTM Circular Guidelines</span>
                  </div>
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "3px 0 0 0" }}>
                    Optional Holidays Policy (Any 2 Can Be Availed)
                  </h4>
                </div>

                <span style={{ fontSize: 11, fontWeight: 800, background: "#ede9fe", color: "#6d28d9", padding: "4px 12px", borderRadius: 999, border: "1px solid #ddd6fe" }}>
                  Max 2 Optional Leaves
                </span>
              </div>

              <p style={{ fontSize: 12.5, color: "#475569", margin: 0, lineHeight: 1.45 }}>
                {CUTM_OPTIONAL_HOLIDAYS_RULES.description} On these dates, the university remains open and instructional classes run as scheduled, but students & staff who choose to take leave are officially excused.
              </p>

              {/* 5 Optional Holidays Pills Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 8,
                  marginTop: 4,
                }}
              >
                {CUTM_OPTIONAL_HOLIDAYS_RULES.optionalList.map((opt) => (
                  <div
                    key={opt.slNo}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e9d5ff",
                      borderRadius: 10,
                      padding: "8px 12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>
                        {opt.slNo}. {opt.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#7c3aed", fontFamily: "'Space Mono', monospace" }}>
                        {opt.date} ({opt.day})
                      </div>
                    </div>
                    <span style={{ fontSize: 9.5, fontWeight: 900, background: "#f5f3ff", color: "#7c3aed", padding: "2px 6px", borderRadius: 4 }}>
                      OPTIONAL
                    </span>
                  </div>
                ))}
              </div>

              {/* Circular Notes */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4, borderTop: "1px solid #f3e8ff", paddingTop: 10, fontSize: 11.5, color: "#6b21a8" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Info size={13} style={{ flexShrink: 0 }} />
                  <span>1. {CUTM_OPTIONAL_HOLIDAYS_RULES.headsOfInstitutesRule}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Info size={13} style={{ flexShrink: 0 }} />
                  <span>2. Note: {CUTM_OPTIONAL_HOLIDAYS_RULES.sundayOverlapNote}</span>
                </div>
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
                      gap: 12,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", wordBreak: "break-word" }}>
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
                            whiteSpace: "nowrap",
                            flexShrink: 0,
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
                    <div style={{ flexShrink: 0, marginLeft: "auto" }}>
                      {h.isToday ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 900,
                            background: "#16a34a",
                            color: "#ffffff",
                            padding: "4px 9px",
                            borderRadius: 6,
                            whiteSpace: "nowrap",
                            display: "inline-block",
                          }}
                        >
                          TODAY
                        </span>
                      ) : h.diffDays > 0 ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            background: "#eff6ff",
                            color: "#2563eb",
                            padding: "4px 9px",
                            borderRadius: 6,
                            whiteSpace: "nowrap",
                            display: "inline-block",
                          }}
                        >
                          In {h.diffDays} days
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 10.5,
                            color: "#94a3b8",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            display: "inline-block",
                          }}
                        >
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
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                      <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        {cleanSubjectBaseName(inspectedClass.subject) || inspectedClass.subject}
                      </h3>
                      {resolveSubjectCode(inspectedClass, studentData) && (
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: "'Space Mono', monospace",
                            fontWeight: 800,
                            color: "#2563eb",
                            background: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            padding: "2px 7px",
                            borderRadius: 6,
                            letterSpacing: "0.5px",
                          }}
                        >
                          {resolveSubjectCode(inspectedClass, studentData)}
                        </span>
                      )}
                    </div>
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
