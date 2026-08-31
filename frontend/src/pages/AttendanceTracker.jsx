import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useApp } from "../context/AppContext";
import { encodeStudentId, decodeStudentId, isEncryptedToken } from "../utils/studentIdEncoder";
import { motion, AnimatePresence } from "framer-motion";
import {
  Percent,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calculator,
  Clock,
  Calendar as CalendarIcon,
  CalendarCheck,
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
  Camera,
  Activity,
  BarChart3,
  GraduationCap,
  Lock,
  Smartphone,
  Laptop,
  Monitor,
  CloudUpload,
  HelpCircle,
  Upload,
  Edit3,
} from "lucide-react";
import {
  ALL_SECTIONS,
  DAYS_LIST,
  TIME_SLOTS,
  normalizeSection,
  setCustomSchedulesStore,
  getSectionSubjectCatalog,
  getDaySchedule,
  getDayName,
  isSunday,
  resolveSubjectCode,
  cleanSubjectBaseName,
  calculateAttendance,
  estimateTargetReachDate,
} from "../utils/timetableHelper";
import { isMatch } from "../utils/basketLogic";
import SmartBunkAnalyzer from "../components/SmartBunkAnalyzer";
import AttendanceTargetPredictor from "../components/AttendanceTargetPredictor";
import AttendanceScreenshotModal from "../components/AttendanceScreenshotModal";
import { AttendanceSkeleton } from "../components/LoadingSpinner";
import { getDailyScanStatus, MAX_DAILY_SCANS } from "../utils/scanLimitHelper";

// Robust Subject Comparator (Handles aliases, normalized names, course codes, and baskets)
function isSameSubject(a, b) {
  if (!a || !b) return false;
  const nameA = typeof a === "string" ? a : (a.subjectName || a.name || a.subName || "");
  const nameB = typeof b === "string" ? b : (b.subjectName || b.name || b.subName || "");
  const codeA = typeof a === "object" ? (a.code || a.subCode || "") : "";
  const codeB = typeof b === "object" ? (b.code || b.subCode || "") : "";

  if (nameA && nameB && nameA.trim().toLowerCase() === nameB.trim().toLowerCase()) return true;

  const cleanA = cleanSubjectBaseName(nameA).toLowerCase();
  const cleanB = cleanSubjectBaseName(nameB).toLowerCase();
  if (cleanA && cleanB && cleanA === cleanB) return true;

  if (codeA && codeB) {
    const normCodeA = codeA.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const normCodeB = codeB.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (normCodeA && normCodeB && (normCodeA === normCodeB || normCodeA.includes(normCodeB) || normCodeB.includes(normCodeA))) {
      return true;
    }
  }

  if (isMatch({ subName: nameA, subCode: codeA }, { subName: nameB, subCode: codeB })) {
    return true;
  }

  const norm1 = nameA.toLowerCase().replace(/and/g, "").replace(/[^a-z0-9]/g, "");
  const norm2 = nameB.toLowerCase().replace(/and/g, "").replace(/[^a-z0-9]/g, "");
  if (norm1 && norm2 && (norm1 === norm2 || norm1.includes(norm2) || norm2.includes(norm1))) {
    return true;
  }

  return false;
}

const tabTransitionVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.18,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: {
      duration: 0.12,
      ease: "easeIn",
    },
  },
};

export default function AttendanceTracker() {
  const { studentId: urlParam } = useParams();
  const navigate = useNavigate();
  const {
    studentData,
    studentSession,
    fetchStudent,
    loading: appLoading,
    API,
    adminToken,
    openStudentAuthModal,
  } = useApp();

  // Decode regNo from URL, session, or studentData
  const decodedParam = urlParam
    ? isEncryptedToken(urlParam)
      ? decodeStudentId(urlParam)
      : urlParam
    : null;

  const currentRegNo =
    decodedParam ||
    studentSession?.regNo ||
    studentData?.regNo ||
    "";

  // Section State
  const [selectedSection, setSelectedSection] = useState(() => {
    if (studentData?.section || studentData?.branch) {
      return normalizeSection(studentData.section || studentData.branch, currentRegNo);
    }
    return normalizeSection("CSE-A", currentRegNo);
  });

  // Helper for local calendar date key (YYYY-MM-DD in user's local timezone, resets at exact 12:00 AM midnight)
  function getLocalCalendarDateKey(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Friendly date formatter (e.g. "27 Feb 2026")
  function formatFriendlyDate(dateKey) {
    if (!dateKey) return "";
    const parts = dateKey.split("-");
    if (parts.length !== 3) return dateKey;
    const year = parts[0];
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day} ${months[month - 1]} ${year}`;
  }

  // ── Live Timetable Dynamic Sync from MongoDB Cloud ─────────────────────
  const [timetableVersion, setTimetableVersion] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function fetchLiveTimetableSchedules() {
      try {
        const { data } = await axios.get(`${API}/timetable/active-all`);
        if (data && data.success && Array.isArray(data.schedules) && isMounted) {
          setCustomSchedulesStore(data.schedules);
          setTimetableVersion((v) => v + 1);
        }
      } catch (err) {
        console.warn("Could not fetch live timetable schedules:", err.message);
      }
    }
    fetchLiveTimetableSchedules();
    return () => {
      isMounted = false;
    };
  }, [API]);

  // ── Class Attendance Check-in Hub State (Date / History Stepper) ─────────────
  const todayDateObj = useMemo(() => new Date(), []);
  const todayDateKey = useMemo(() => getLocalCalendarDateKey(todayDateObj), [todayDateObj]);
  const yesterdayDateKey = useMemo(() => {
    const y = new Date(todayDateObj.getTime() - 86400000);
    return getLocalCalendarDateKey(y);
  }, [todayDateObj]);

  // Default earliest allowed tracking date (180 days prior to today)
  const defaultMinTrackingDateKey = useMemo(() => {
    const past = new Date(todayDateObj.getTime() - 180 * 86400000);
    return getLocalCalendarDateKey(past);
  }, [todayDateObj]);

  // Selected date for attendance check-in (defaults to Today)
  const [selectedCheckInDateKey, setSelectedCheckInDateKey] = useState(() => todayDateKey);
  // Minimum allowed date (allows historical navigation up to 180 days back)
  const [minTrackingDateKey, setMinTrackingDateKey] = useState(() => defaultMinTrackingDateKey);

  // Computed Date Properties for Selected Check-in Day
  const selectedDateObj = useMemo(() => new Date(selectedCheckInDateKey + "T00:00:00"), [selectedCheckInDateKey]);
  const selectedDayName = useMemo(() => getDayName(selectedDateObj), [selectedDateObj]);
  const isSelectedSunday = useMemo(() => isSunday(selectedDateObj), [selectedDateObj]);
  const isSelectedToday = selectedCheckInDateKey === todayDateKey;
  const isSelectedYesterday = selectedCheckInDateKey === yesterdayDateKey;

  const canGoPrev = selectedCheckInDateKey > minTrackingDateKey;
  const canGoNext = selectedCheckInDateKey < todayDateKey;

  // Selected Day Timetable Schedule
  const selectedDayScheduleRaw = useMemo(() => {
    if (isSelectedSunday) return [];
    return getDaySchedule(selectedSection, selectedDayName);
  }, [selectedSection, selectedDayName, isSelectedSunday, timetableVersion]);

  const selectedDayClasses = useMemo(() => {
    return (selectedDayScheduleRaw || [])
      .map((period, idx) => ({
        ...period,
        slotIndex: idx,
        slot: TIME_SLOTS[idx],
        cleanName: cleanSubjectBaseName(period.subject),
      }))
      .filter((p) => !p.isFree && !p.isBreak && p.subject && p.subject !== "No Class / Free" && !/lunch\s*break|recess/i.test(p.subject));
  }, [selectedDayScheduleRaw]);

  // Backwards compatibility alias for components expecting today classes
  const todayClasses = selectedDayClasses;
  const todayDayName = selectedDayName;
  const isTodaySunday = isSelectedSunday;

  // Full calendar dailyLogs store map (Date -> { slotIndex: "present" | "absent" })
  const [allDailyLogs, setAllDailyLogs] = useState({});
  // Today's specific routine check-ins
  const [dailyAttendanceLogs, setDailyAttendanceLogs] = useState({});

  // Active logs for the currently inspected date
  const activeDateLogs = allDailyLogs[selectedCheckInDateKey] || {};

  // Date Navigation Helpers
  const handlePrevDay = () => {
    if (!canGoPrev) return;
    const d = new Date(selectedCheckInDateKey + "T00:00:00");
    d.setDate(d.getDate() - 1);
    const k = getLocalCalendarDateKey(d);
    if (k >= minTrackingDateKey) {
      setSelectedCheckInDateKey(k);
    }
  };

  const handleNextDay = () => {
    if (!canGoNext) return;
    const d = new Date(selectedCheckInDateKey + "T00:00:00");
    d.setDate(d.getDate() + 1);
    const k = getLocalCalendarDateKey(d);
    if (k <= todayDateKey) {
      setSelectedCheckInDateKey(k);
    }
  };

  const handleSelectDate = (dateKey) => {
    if (!dateKey) return;
    if (dateKey >= minTrackingDateKey && dateKey <= todayDateKey) {
      setSelectedCheckInDateKey(dateKey);
    } else if (dateKey > todayDateKey) {
      setSelectedCheckInDateKey(todayDateKey);
    } else if (dateKey < minTrackingDateKey) {
      setSelectedCheckInDateKey(minTrackingDateKey);
    }
  };

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

  // Normalize URL token if plain regNo was passed in route
  useEffect(() => {
    if (decodedParam && urlParam && !isEncryptedToken(urlParam)) {
      navigate(`/attendance/${encodeStudentId(decodedParam)}`, { replace: true });
    }
  }, [decodedParam, urlParam, navigate]);

  const [searchParams] = useSearchParams();
  const urlTabParam = searchParams.get("tab");

  // Section Subjects Catalog from Timetable Database
  const sectionCatalog = useMemo(() => {
    return getSectionSubjectCatalog(selectedSection);
  }, [selectedSection, timetableVersion]);

  // Active Subject Simulation State
  const [selectedSubjectName, setSelectedSubjectName] = useState("");
  const [componentInputs, setComponentInputs] = useState([]);
  const [targetGoal, setTargetGoal] = useState(75);
  const [simulateMissCount, setSimulateMissCount] = useState(0);
  const [simulateAttendCount, setSimulateAttendCount] = useState(0);

  const getInitialTab = () => {
    if (urlTabParam === "studio" || urlTabParam === "predictor") return "studio";
    if (urlTabParam === "bunk" || urlTabParam === "bunk_analyzer" || urlTabParam === "planner") return "bunk_analyzer";
    if (urlTabParam === "matrix" || urlTabParam === "subjects" || urlTabParam === "subject_matrix") return "matrix";
    if (urlTabParam === "checkin" || urlTabParam === "hub" || urlTabParam === "daily") return "checkin";
    return "checkin";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const hasUserManuallySelectedTabRef = useRef(Boolean(urlTabParam));

  const mobileTabsRef = useRef(null);
  const [canScrollTabsLeft, setCanScrollTabsLeft] = useState(false);
  const [canScrollTabsRight, setCanScrollTabsRight] = useState(false);

  const checkTabsScroll = () => {
    if (!mobileTabsRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = mobileTabsRef.current;
    setCanScrollTabsLeft(scrollLeft > 5);
    setCanScrollTabsRight(scrollLeft < scrollWidth - clientWidth - 5);
  };

  const centerActiveTab = (behavior = "smooth") => {
    if (mobileTabsRef.current) {
      const container = mobileTabsRef.current;
      const activeEl = container.querySelector(`[data-tab-id="${activeTab}"]`);
      if (activeEl) {
        const containerRect = container.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();
        const currentScroll = container.scrollLeft;
        const targetScroll = currentScroll + (activeRect.left - containerRect.left) - (containerRect.width / 2) + (activeRect.width / 2);
        container.scrollTo({
          left: Math.max(0, targetScroll),
          behavior,
        });
        setTimeout(checkTabsScroll, 250);
      }
    }
  };

  const scrollTabs = (direction) => {
    if (mobileTabsRef.current) {
      const scrollAmount = direction === "left" ? -150 : 150;
      mobileTabsRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(checkTabsScroll, 200);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      checkTabsScroll();
      centerActiveTab("auto");
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    centerActiveTab("smooth");
    checkTabsScroll();
  }, [activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      centerActiveTab("auto");
      checkTabsScroll();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleTabClick = (tabKey) => {
    hasUserManuallySelectedTabRef.current = true;
    setActiveTab(tabKey);
  };

  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false);
  const [isVerifiedDisclaimerChecked, setIsVerifiedDisclaimerChecked] = useState(false);

  // Daily AI Screenshot Scan Limit Tracking (2 Scans/day per student, exempt for 230301120327, admin, subadmin)
  const userRole = studentSession?.role || (adminToken ? "admin" : "");
  const isAdmin = Boolean(adminToken);

  const [scanStatus, setScanStatus] = useState(() => getDailyScanStatus(currentRegNo, userRole, isAdmin));
  const [scanLimitWarning, setScanLimitWarning] = useState("");

  useEffect(() => {
    setScanStatus(getDailyScanStatus(currentRegNo, userRole, isAdmin));
    const handleUpdate = () => setScanStatus(getDailyScanStatus(currentRegNo, userRole, isAdmin));
    window.addEventListener("gradeflow_scan_limit_updated", handleUpdate);
    return () => window.removeEventListener("gradeflow_scan_limit_updated", handleUpdate);
  }, [currentRegNo, userRole, isAdmin]);

  const handleOpenScreenshotModal = () => {
    const status = getDailyScanStatus(currentRegNo, userRole, isAdmin);
    if (!status.isExempt && status.isLimitReached) {
      setScanLimitWarning(
        "Daily Screenshot Limit Reached (2/2): You have used all screenshot scans for today. The limit will reset tomorrow after midnight (12:00 AM). Please enter or update your attendance manually."
      );
      setTimeout(() => setScanLimitWarning(""), 7000);
      setIsScreenshotModalOpen(true);
    } else {
      setScanLimitWarning("");
      setIsScreenshotModalOpen(true);
    }
  };

  // Saved Subjects (In-Memory React State, synced direct to MongoDB Atlas)
  const [savedSubjects, setSavedSubjects] = useState([]);

  // Accurate auto-centering for Section and Subject scroll tracks
  const centerActiveSection = (behavior = "smooth") => {
    if (sectionPillsRef.current && selectedSection) {
      const container = sectionPillsRef.current;
      const activeEl = container.querySelector(`[data-section-id="${selectedSection}"]`);
      if (activeEl) {
        const containerRect = container.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();
        const currentScroll = container.scrollLeft;
        const targetScroll = currentScroll + (activeRect.left - containerRect.left) - (containerRect.width / 2) + (activeRect.width / 2);
        container.scrollTo({ left: Math.max(0, targetScroll), behavior });
        setTimeout(checkSectionScroll, 250);
      }
    }
  };

  const centerActiveSubject = (behavior = "smooth") => {
    if (subjectPillsRef.current && selectedSubjectName) {
      const container = subjectPillsRef.current;
      const activeEl = container.querySelector(`[data-subject-id="${selectedSubjectName}"]`);
      if (activeEl) {
        const containerRect = container.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();
        const currentScroll = container.scrollLeft;
        const targetScroll = currentScroll + (activeRect.left - containerRect.left) - (containerRect.width / 2) + (activeRect.width / 2);
        container.scrollTo({ left: Math.max(0, targetScroll), behavior });
        setTimeout(checkSubjectScroll, 250);
      }
    }
  };

  useEffect(() => {
    centerActiveSection("smooth");
    checkSectionScroll();
  }, [selectedSection]);

  useEffect(() => {
    centerActiveSubject("smooth");
    checkSubjectScroll();
  }, [selectedSubjectName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      centerActiveSection("auto");
      centerActiveSubject("auto");
      checkSectionScroll();
      checkSubjectScroll();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Handler for applying OCR extracted subjects with full PP/PR/TUT components
  // Handler for applying OCR extracted subjects with full PP/PR/TUT components
  const handleApplyScreenshotSubjects = (extracted) => {
    if (!Array.isArray(extracted) || extracted.length === 0) return;

    // Filter and map incoming extracted subjects strictly to the section timetable catalog
    const formatted = [];
    extracted.forEach((s) => {
      const catMatch = sectionCatalog.find((c) => isSameSubject(c, s));
      if (catMatch) {
        const cleanName = catMatch.subjectName;
        const subCode = s.code || catMatch.code || resolveSubjectCode({ subject: cleanName }, studentData) || "";

        const comps =
          Array.isArray(s.components) && s.components.length > 0
            ? s.components.map((c) => ({
                type: (c.type || "PP").toUpperCase(),
                attended: Number(c.attended) || 0,
                delivered: Number(c.delivered) || 0,
              }))
            : [
                {
                  type: "PP",
                  attended: Number(s.attendedClasses) || 0,
                  delivered: Number(s.totalClasses) || 0,
                },
              ];

        formatted.push({
          subjectName: cleanName,
          code: subCode,
          components: comps,
          section: selectedSection,
        });
      }
    });

    // Fallback if catalog is still empty on initial load
    if (formatted.length === 0 && sectionCatalog.length === 0) {
      extracted.forEach((s) => {
        const cleanName = cleanSubjectBaseName(s.name) || s.name;
        formatted.push({
          subjectName: cleanName,
          code: s.code || "",
          components: s.components || [{ type: "PP", attended: Number(s.attendedClasses) || 0, delivered: Number(s.totalClasses) || 0 }],
          section: selectedSection,
        });
      });
    }

    // Smart merge: Update matched subjects with latest attendance counts and keep any existing subjects
    // so previous data and records are completely preserved
    const mergedSaved = [...savedSubjects];
    formatted.forEach((newSub) => {
      const existingIdx = mergedSaved.findIndex((s) => isSameSubject(s, newSub));
      if (existingIdx !== -1) {
        mergedSaved[existingIdx] = {
          ...mergedSaved[existingIdx],
          subjectName: newSub.subjectName,
          code: newSub.code || mergedSaved[existingIdx].code || "",
          components: newSub.components,
          section: selectedSection,
          lastUpdated: new Date().toISOString(),
        };
      } else {
        mergedSaved.push(newSub);
      }
    });

    setSavedSubjects(mergedSaved);
    syncAttendanceToDb(mergedSaved, allDailyLogs, targetGoal);

    // Auto-load the first imported subject into the studio
    if (mergedSaved.length > 0) {
      const first = mergedSaved[0];
      setSelectedSubjectName(first.subjectName);
      setComponentInputs(first.components);
    }

    // Direct redirect to Subject-wise Matrix tab upon saving from modal
    hasUserManuallySelectedTabRef.current = true;
    setActiveTab("matrix");
  };

  // Proactively clean legacy attendance localStorage keys on mount for maximum privacy
  useEffect(() => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("gradeflow_attendance")) {
          localStorage.removeItem(key);
        }
      });
    } catch {}
  }, []);

  // Sync to MongoDB helper (Direct Cloud Persistence)
  const syncAttendanceToDb = async (
    updatedSaved = savedSubjects,
    updatedAllLogs = allDailyLogs,
    goal = targetGoal
  ) => {
    const regToSync = currentRegNo || studentSession?.regNo || studentData?.regNo;
    if (!regToSync) return;
    try {
      setAllDailyLogs(updatedAllLogs);
      await axios.post(`${API}/student/${regToSync}/attendance`, {
        section: selectedSection,
        targetGoal: goal,
        savedSubjects: updatedSaved,
        dailyLogs: updatedAllLogs,
      });
    } catch (err) {
      console.warn("Background attendance sync to MongoDB:", err.message);
    }
  };

  // Unified Loading State (Single smooth continuous loader, zero flicker)
  const [pageLoading, setPageLoading] = useState(true);

  // Load student profile & saved Attendance from MongoDB Atlas in one smooth pass
  useEffect(() => {
    const targetReg = decodedParam || studentSession?.regNo || studentData?.regNo;
    if (!targetReg) {
      setPageLoading(false);
      return;
    }
    let isMounted = true;
    setPageLoading(true);

    async function loadAllStudentData() {
      try {
        // 1. Fetch student profile if not already in memory
        let sData = studentData;
        if (!studentData || studentData.regNo !== targetReg) {
          sData = await fetchStudent(targetReg, 2, 800);
        }
        if (sData && isMounted) {
          const detected = normalizeSection(sData.section || sData.branch, sData.regNo);
          setSelectedSection(detected);
        }

        // 2. Fetch saved attendance from MongoDB
        const res = await axios.get(`${API}/student/${targetReg}/attendance`);
        if (res.data?.success && res.data.attendance && isMounted) {
          const att = res.data.attendance;
          const loadedSubs = Array.isArray(att.savedSubjects) ? att.savedSubjects : [];
          setSavedSubjects(loadedSubs);

          // Check if student has actual non-zero saved attendance data in DB
          const hasRealAttendance = loadedSubs.length > 0 && loadedSubs.some((s) =>
            (s.components || []).some((c) => (Number(c.delivered) || 0) > 0)
          );

          // Auto-route default tab based on whether student has attendance data vs needs the guide
          if (!hasUserManuallySelectedTabRef.current && !urlTabParam) {
            if (!hasRealAttendance) {
              // For students where the guide is shown (no saved attendance), default to "studio" (Attendance Predictor tab where Guide is present)
              setActiveTab("studio");
            } else {
              // For students with saved attendance data, default to "checkin" (Daily Check-In Hub)
              setActiveTab("checkin");
            }
          }

          if (att.targetGoal) {
            setTargetGoal(att.targetGoal);
          }
          if (att.dailyLogs && typeof att.dailyLogs === "object") {
            const rawLogs = att.dailyLogs;
            const cleanDailyLogs = {};
            Object.keys(rawLogs).forEach((key) => {
              if (/^\d{4}-\d{2}-\d{2}$/.test(key) && typeof rawLogs[key] === "object") {
                cleanDailyLogs[key] = rawLogs[key];
              }
            });
            setAllDailyLogs(cleanDailyLogs);
            const todayLogs = cleanDailyLogs[todayDateKey];
            if (todayLogs && typeof todayLogs === "object" && Object.keys(todayLogs).length > 0) {
              setDailyAttendanceLogs(todayLogs);
            } else {
              setDailyAttendanceLogs({});
            }

            // Resolve minimum tracking start date from DB createdAt or earliest logged date
            let cKey = null;
            if (att.createdAt) {
              cKey = getLocalCalendarDateKey(new Date(att.createdAt));
            }
            const logDateKeys = Object.keys(cleanDailyLogs).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort();
            const earliestLog = logDateKeys[0];
            const resolvedMin = cKey && earliestLog ? (cKey < earliestLog ? cKey : earliestLog) : (cKey || earliestLog || defaultMinTrackingDateKey);
            setMinTrackingDateKey(resolvedMin < defaultMinTrackingDateKey ? resolvedMin : defaultMinTrackingDateKey);
          } else {
            setAllDailyLogs({});
            setDailyAttendanceLogs({});
            if (att.createdAt) {
              const cKey = getLocalCalendarDateKey(new Date(att.createdAt));
              setMinTrackingDateKey(cKey < defaultMinTrackingDateKey ? cKey : defaultMinTrackingDateKey);
            } else {
              setMinTrackingDateKey(defaultMinTrackingDateKey);
            }
          }
        } else if (isMounted) {
          setSavedSubjects([]);
          if (!hasUserManuallySelectedTabRef.current && !urlTabParam) {
            setActiveTab("studio");
          }
        }
      } catch (err) {
        console.warn("Could not load student attendance:", err.message);
        if (isMounted && !hasUserManuallySelectedTabRef.current && !urlTabParam) {
          setActiveTab("studio");
        }
      } finally {
        if (isMounted) {
          setPageLoading(false);
          setIsSearching(false);
        }
      }
    }

    loadAllStudentData();
    return () => {
      isMounted = false;
    };
  }, [decodedParam, studentSession?.regNo, API, todayDateKey, defaultMinTrackingDateKey]);

  // Synchronize componentInputs whenever savedSubjects loads or updates from MongoDB Atlas
  useEffect(() => {
    if (selectedSubjectName && savedSubjects.length > 0) {
      const found = savedSubjects.find((s) => isSameSubject(s, selectedSubjectName));
      if (found && Array.isArray(found.components) && found.components.length > 0) {
        setComponentInputs(found.components.map((c) => ({ ...c })));
      }
    }
  }, [savedSubjects, selectedSubjectName]);

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
    const existing = savedSubjects.find((s) => isSameSubject(s, catalogItem));
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
        found
          ? { ...found }
          : {
              type,
              attended: 0,
              delivered: 0,
            }
      );
    });

    // Also include any user-added custom components that weren't in catalog
    existingComps.forEach((c) => {
      if (!detectedTypes.some((t) => t.toUpperCase() === c.type.toUpperCase())) {
        mergedComps.push({ ...c });
      }
    });

    setComponentInputs(mergedComps.length > 0 ? mergedComps : [{ type: "PP", attended: 0, delivered: 0 }]);
    setSimulateMissCount(0);
    setSimulateAttendCount(0);
    setIsVerifiedDisclaimerChecked(false);
  }

  // Handle in-page student search (seamless transition)
  async function handleSearchStudent(e) {
    if (e) e.preventDefault();
    const cleanReg = searchRegInput.trim().toUpperCase();
    if (!cleanReg) return;

    setIsSearching(true);
    setSearchError("");
    setSearchRegInput("");
    navigate(`/attendance/${encodeStudentId(cleanReg)}`);
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

  // Timetable Calendar Date Projection (Deficit -> Reach Target Date)
  const dateProjection = useMemo(() => {
    if (!activeCatalogItem || activeCalculation.classesNeeded <= 0) return null;
    return estimateTargetReachDate(
      activeCalculation.classesNeeded,
      activeCatalogItem.weeklyOccurrences || [],
      todayDateObj,
      activeCalculation.totalAttended,
      activeCalculation.totalDelivered,
      targetGoal
    );
  }, [activeCalculation.classesNeeded, activeCalculation.totalAttended, activeCalculation.totalDelivered, activeCatalogItem, todayDateObj, targetGoal]);

  // Timetable Calendar Safe Bunk Date Projection (Safe Zone -> Buffer Date Span)
  const bunkDateProjection = useMemo(() => {
    if (!activeCatalogItem || activeCalculation.safeBunks <= 0) return null;
    return estimateTargetReachDate(
      activeCalculation.safeBunks,
      activeCatalogItem.weeklyOccurrences || [],
      todayDateObj,
      activeCalculation.totalAttended,
      activeCalculation.totalDelivered,
      targetGoal
    );
  }, [activeCalculation.safeBunks, activeCalculation.totalAttended, activeCalculation.totalDelivered, activeCatalogItem, todayDateObj, targetGoal]);

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


  // Dedicated robust handler for marking Present or Absent on classes for the selected date
  function handleMarkDailyAttendance(period, targetStatus) {
    const slotIdx = period.slotIndex;
    const currentDateLogs = allDailyLogs[selectedCheckInDateKey] || {};
    const currentStatus = currentDateLogs[slotIdx]; // "present" | "absent" | undefined
    const cleanName = period.cleanName || cleanSubjectBaseName(period.subject);
    const compType = (period.type || "PP").toUpperCase();

    // Determine state transition and math deltas:
    let nextStatus = targetStatus;
    let deltaAttended = 0;
    let deltaDelivered = 0;

    if (currentStatus === targetStatus) {
      // 1. Toggling off (Un-marking): Revert to unmarked
      nextStatus = undefined;
      if (currentStatus === "present") {
        deltaAttended = -1;
        deltaDelivered = -1;
      } else if (currentStatus === "absent") {
        deltaAttended = 0;
        deltaDelivered = -1;
      }
    } else if (!currentStatus) {
      // 2. Marking fresh from unmarked:
      if (targetStatus === "present") {
        deltaAttended = 1;
        deltaDelivered = 1;
      } else if (targetStatus === "absent") {
        deltaAttended = 0;
        deltaDelivered = 1;
      }
    } else if (currentStatus === "present" && targetStatus === "absent") {
      // 3. Switching from Present to Absent:
      deltaAttended = -1;
      deltaDelivered = 0; // Class was delivered, still delivered
    } else if (currentStatus === "absent" && targetStatus === "present") {
      // 4. Switching from Absent to Present:
      deltaAttended = 1;
      deltaDelivered = 0; // Class was delivered, still delivered
    }

    // Update allDailyLogs for this dateKey
    const nextDateLogs = { ...currentDateLogs };
    if (nextStatus) {
      nextDateLogs[slotIdx] = nextStatus;
    } else {
      delete nextDateLogs[slotIdx];
    }

    const nextAllLogs = { ...allDailyLogs };
    if (Object.keys(nextDateLogs).length > 0) {
      nextAllLogs[selectedCheckInDateKey] = nextDateLogs;
    } else {
      delete nextAllLogs[selectedCheckInDateKey];
    }
    setAllDailyLogs(nextAllLogs);
    if (selectedCheckInDateKey === todayDateKey) {
      setDailyAttendanceLogs(nextDateLogs);
    }

    // Update savedSubjects store
    let nextSavedList = [...savedSubjects];
    const existingIdx = nextSavedList.findIndex((s) => isSameSubject(s, cleanName));

    if (existingIdx !== -1) {
      const sub = { ...nextSavedList[existingIdx] };
      let matchedComp = false;
      const components = (sub.components || []).map((c) => {
        if (c.type.toUpperCase() === compType) {
          matchedComp = true;
          return {
            ...c,
            attended: Math.max(0, (Number(c.attended) || 0) + deltaAttended),
            delivered: Math.max(0, (Number(c.delivered) || 0) + deltaDelivered),
          };
        }
        return { ...c };
      });

      if (!matchedComp) {
        components.push({
          type: compType,
          attended: Math.max(0, deltaAttended > 0 ? deltaAttended : 0),
          delivered: Math.max(0, deltaDelivered > 0 ? deltaDelivered : 0),
        });
      }

      sub.components = components;
      sub.lastUpdated = new Date().toISOString();
      nextSavedList[existingIdx] = sub;
    } else {
      nextSavedList.push({
        subjectName: cleanName,
        code: period.code || period.subCode || resolveSubjectCode(period, studentData) || "",
        components: [
          {
            type: compType,
            attended: Math.max(0, deltaAttended > 0 ? deltaAttended : 0),
            delivered: Math.max(0, deltaDelivered > 0 ? deltaDelivered : 0),
          },
        ],
        section: selectedSection,
        lastUpdated: new Date().toISOString(),
        weeklyOccurrences: [],
      });
    }
    setSavedSubjects(nextSavedList);
    syncAttendanceToDb(nextSavedList, nextAllLogs, targetGoal);

    // If currently inspecting this subject in the studio, update componentInputs in real time
    if (isSameSubject(selectedSubjectName, cleanName)) {
      setComponentInputs((prev) => {
        let hasType = false;
        const nextComps = prev.map((c) => {
          if (c.type.toUpperCase() === compType) {
            hasType = true;
            return {
              ...c,
              attended: Math.max(0, (Number(c.attended) || 0) + deltaAttended),
              delivered: Math.max(0, (Number(c.delivered) || 0) + deltaDelivered),
            };
          }
          return { ...c };
        });
        if (!hasType) {
          nextComps.push({
            type: compType,
            attended: Math.max(0, deltaAttended > 0 ? deltaAttended : 0),
            delivered: Math.max(0, deltaDelivered > 0 ? deltaDelivered : 0),
          });
        }
        return nextComps;
      });
    }
  }

  // Clear all check-ins for the selected date and rollback attended/delivered counts
  function handleResetDateCheckins(dateKey = selectedCheckInDateKey) {
    const dateLogs = allDailyLogs[dateKey];
    if (!dateLogs || Object.keys(dateLogs).length === 0) return;

    const targetDateObj = new Date(dateKey + "T00:00:00");
    const targetDayName = getDayName(targetDateObj);
    const daySchedule = getDaySchedule(selectedSection, targetDayName) || [];
    const dayClasses = daySchedule
      .map((period, idx) => ({
        ...period,
        slotIndex: idx,
        cleanName: cleanSubjectBaseName(period.subject),
      }))
      .filter((p) => !p.isFree && !p.isBreak && p.subject && p.subject !== "No Class / Free" && !/lunch\s*break|recess/i.test(p.subject));

    let nextSavedList = [...savedSubjects];

    dayClasses.forEach((period) => {
      const status = dateLogs[period.slotIndex];
      if (status === "present" || status === "absent") {
        const cleanName = period.cleanName || cleanSubjectBaseName(period.subject);
        const compType = (period.type || "PP").toUpperCase();
        const deltaAttended = status === "present" ? -1 : 0;
        const deltaDelivered = -1;

        const existingIdx = nextSavedList.findIndex((s) => isSameSubject(s, cleanName));
        if (existingIdx !== -1) {
          const sub = { ...nextSavedList[existingIdx] };
          sub.components = (sub.components || []).map((c) => {
            if (c.type.toUpperCase() === compType) {
              return {
                ...c,
                attended: Math.max(0, (Number(c.attended) || 0) + deltaAttended),
                delivered: Math.max(0, (Number(c.delivered) || 0) + deltaDelivered),
              };
            }
            return { ...c };
          });
          sub.lastUpdated = new Date().toISOString();
          nextSavedList[existingIdx] = sub;
        }
      }
    });

    const nextAllLogs = { ...allDailyLogs };
    delete nextAllLogs[dateKey];
    setAllDailyLogs(nextAllLogs);
    if (dateKey === todayDateKey) {
      setDailyAttendanceLogs({});
    }
    setSavedSubjects(nextSavedList);
    syncAttendanceToDb(nextSavedList, nextAllLogs, targetGoal);

    if (selectedSubjectName) {
      const activeSaved = nextSavedList.find((s) => isSameSubject(s, selectedSubjectName));
      if (activeSaved && Array.isArray(activeSaved.components)) {
        setComponentInputs(activeSaved.components.map((c) => ({ ...c })));
      }
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

    const filtered = savedSubjects.filter((s) => !isSameSubject(s, selectedSubjectName));
    const cleanComps = (componentInputs || []).map((c) => ({
      type: (c.type || "PP").toUpperCase(),
      attended: Math.max(0, parseInt(c.attended, 10) || 0),
      delivered: Math.max(0, parseInt(c.delivered, 10) || 0),
    }));

    const updatedList = [
      ...filtered,
      {
        subjectName: selectedSubjectName,
        code: activeCatalogItem?.code || resolveSubjectCode({ subject: selectedSubjectName }, studentData) || "",
        components: cleanComps,
        lastUpdated: new Date().toISOString(),
        section: selectedSection,
        weeklyOccurrences: activeCatalogItem?.weeklyOccurrences || [],
      },
    ];

    setSavedSubjects(updatedList);
    syncAttendanceToDb(updatedList, allDailyLogs, targetGoal);
    setSaveSuccessAlert(true);
    setTimeout(() => setSaveSuccessAlert(false), 3500);
  }

  function handleDeleteSavedSubject(subjectName) {
    const updatedList = savedSubjects.filter((s) => !isSameSubject(s, subjectName));
    setSavedSubjects(updatedList);
    syncAttendanceToDb(updatedList, allDailyLogs, targetGoal);
  }

  // Complete List of Section Subjects with Detected Components & Saved Overrides (Strict Section Timetable Scoped)
  const allSectionSubjects = useMemo(() => {
    const map = new Map();

    sectionCatalog.forEach((catItem) => {
      // Robust match with saved subjects by name, clean base name, code, or aliases
      const saved = savedSubjects.find((s) => isSameSubject(s, catItem));
      const savedComps = saved?.components || [];

      const detectedTypes =
        catItem.components && catItem.components.length > 0 ? catItem.components : ["PP"];

      const components = detectedTypes.map((type) => {
        const found = savedComps.find((c) => c.type.toUpperCase() === type.toUpperCase());
        return found || { type, attended: 0, delivered: 0 };
      });

      savedComps.forEach((c) => {
        if (!detectedTypes.some((t) => t.toUpperCase() === c.type.toUpperCase())) {
          components.push(c);
        }
      });

      const resolvedCode =
        catItem.code || saved?.code || resolveSubjectCode({ subject: catItem.subjectName }, studentData) || "";

      map.set(catItem.subjectName, {
        subjectName: catItem.subjectName,
        code: resolvedCode,
        components,
        classesPerWeek: catItem.classesPerWeek,
        weeklyOccurrences: catItem.weeklyOccurrences,
        isSaved: Boolean(saved),
      });
    });

    return Array.from(map.values());
  }, [sectionCatalog, savedSubjects, studentData]);

  // Check if student has actual non-zero saved attendance data in DB
  const hasSavedAttendance = useMemo(() => {
    return (
      savedSubjects.length > 0 &&
      savedSubjects.some((s) =>
        (s.components || []).some((c) => (Number(c.delivered) || 0) > 0)
      )
    );
  }, [savedSubjects]);

  // Default tab auto-routing:
  // - Students with existing attendance data -> default to "checkin" (Daily Check-In Hub)
  // - First-time students with 0 attendance data -> default to "studio" (Quick Setup Guide page)
  useEffect(() => {
    if (!hasUserManuallySelectedTabRef.current && !urlTabParam) {
      if (hasSavedAttendance) {
        setActiveTab("checkin");
      } else {
        setActiveTab("studio");
      }
    }
  }, [hasSavedAttendance, urlTabParam]);

  // Overall Aggregate Attendance across all Semester Subjects
  const overallCalculation = useMemo(() => {
    const list = allSectionSubjects.length > 0 ? allSectionSubjects : savedSubjects;
    if (list.length === 0) {
      return {
        totalAttended: activeCalculation.totalAttended,
        totalDelivered: activeCalculation.totalDelivered,
        percentage: activeCalculation.currentPercentage,
        classesNeeded: activeCalculation.classesNeeded,
        safeBunks: activeCalculation.safeBunks,
        isEligible: activeCalculation.currentPercentage >= 75,
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

    const percentage = totDel > 0 ? (totAtt / totDel) * 100 : 0;
    const target = Math.min(100, Math.max(1, Number(targetGoal) || 75));

    let classesNeeded = 0;
    let safeBunks = 0;

    if (totDel === 0) {
      classesNeeded = 0;
      safeBunks = 0;
    } else if (percentage < target) {
      const numerator = target * totDel - 100 * totAtt;
      const denominator = 100 - target;
      classesNeeded = Math.ceil(numerator / denominator);
      safeBunks = 0;
    } else {
      classesNeeded = 0;
      const numerator = 100 * totAtt - target * totDel;
      safeBunks = Math.floor(numerator / target);
    }

    return {
      totalAttended: totAtt,
      totalDelivered: totDel,
      percentage: Number(percentage.toFixed(2)),
      classesNeeded: Number.isFinite(classesNeeded) ? classesNeeded : 0,
      safeBunks: Math.max(0, safeBunks),
      isEligible: totDel === 0 ? true : percentage >= 75,
      subjectsCount: list.length,
    };
  }, [allSectionSubjects, savedSubjects, targetGoal, activeCalculation]);

  const overallAggregate = overallCalculation;

  const activeStudentName = studentData?.studentName || "";

  const isSearchAuthorized = Boolean(
    isAdmin ||
    userRole === "admin" ||
    userRole === "subadmin" ||
    userRole === "superadmin" ||
    currentRegNo === "230301120327" ||
    studentSession?.regNo === "230301120327" ||
    studentSession?.registrationNo === "230301120327"
  );

  const shortageSubjects = useMemo(() => {
    return allSectionSubjects.filter((sub) => {
      let totAtt = 0;
      let totDel = 0;
      (sub.components || []).forEach((c) => {
        totAtt += Number(c.attended) || 0;
        totDel += Number(c.delivered) || 0;
      });
      const pct = totDel > 0 ? (totAtt / totDel) * 100 : 0;
      return totDel > 0 && pct < 75;
    });
  }, [allSectionSubjects]);

  const shortageCount = shortageSubjects.length;

  const recoveryAnalysis = useMemo(() => {
    let neededCount = 0;
    let unattainableCount = 0;
    let attainableCount = 0;

    const list = allSectionSubjects.map((sub) => {
      let totAtt = 0;
      let totDel = 0;
      (sub.components || []).forEach((c) => {
        totAtt += Number(c.attended) || 0;
        totDel += Number(c.delivered) || 0;
      });
      const pct = totDel > 0 ? (totAtt / totDel) * 100 : 0;
      const catMatch = sectionCatalog.find((c) => isSameSubject(c, sub));
      const weeklyOccurrences = catMatch?.weeklyOccurrences || [];

      const subCalc = calculateAttendance({
        components: sub.components,
        targetPercentage: targetGoal,
      });

      let dateProj = null;
      if (subCalc.classesNeeded > 0 && weeklyOccurrences.length > 0) {
        dateProj = estimateTargetReachDate(
          subCalc.classesNeeded,
          weeklyOccurrences,
          new Date(),
          subCalc.totalAttended,
          subCalc.totalDelivered,
          targetGoal,
          1
        );
      }

      const isUnattainable = dateProj ? !dateProj.isAttainable : false;
      const needsRecovery = totDel > 0 && pct < targetGoal;

      if (needsRecovery) {
        neededCount++;
        if (isUnattainable) unattainableCount++;
        else attainableCount++;
      }

      return {
        sub,
        subCalc,
        dateProj,
        isUnattainable,
        needsRecovery,
      };
    });

    return {
      list,
      neededCount,
      unattainableCount,
      attainableCount,
    };
  }, [allSectionSubjects, sectionCatalog, targetGoal]);

  const recoverySubjectsCount = recoveryAnalysis.neededCount;
  const unattainableSubjectsCount = recoveryAnalysis.unattainableCount;

  const [isRecoveryHighlightActive, setIsRecoveryHighlightActive] = useState(false);
  const [isShortageHighlightActive, setIsShortageHighlightActive] = useState(false);
  const [isSafeMarginHighlightActive, setIsSafeMarginHighlightActive] = useState(false);
  const highlightTimerRef = useRef(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  const handleHighlightRecoverySubjects = () => {
    if (recoverySubjectsCount <= 0 && overallCalculation.classesNeeded <= 0) return;
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);

    setIsShortageHighlightActive(false);
    setIsSafeMarginHighlightActive(false);
    setIsRecoveryHighlightActive(true);
    handleTabClick("matrix");

    setTimeout(() => {
      const el = document.getElementById("attendance-subject-matrix-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 150);

    // Auto-remove highlight after 4 seconds
    highlightTimerRef.current = setTimeout(() => {
      setIsRecoveryHighlightActive(false);
    }, 4000);
  };

  const handleHighlightShortageSubjects = () => {
    if (shortageCount <= 0) return;
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);

    setIsSafeMarginHighlightActive(false);
    setIsRecoveryHighlightActive(false);
    setIsShortageHighlightActive(true);
    handleTabClick("matrix");

    setTimeout(() => {
      const el = document.getElementById("attendance-subject-matrix-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 150);

    // Auto-remove highlight after 3.5 seconds
    highlightTimerRef.current = setTimeout(() => {
      setIsShortageHighlightActive(false);
    }, 3500);
  };

  const handleHighlightSafeMarginSubjects = () => {
    if (overallCalculation.safeBunks <= 0) return;
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);

    setIsShortageHighlightActive(false);
    setIsRecoveryHighlightActive(false);
    setIsSafeMarginHighlightActive(true);
    handleTabClick("matrix");

    setTimeout(() => {
      const el = document.getElementById("attendance-subject-matrix-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 150);

    // Auto-remove highlight after 3.5 seconds
    highlightTimerRef.current = setTimeout(() => {
      setIsSafeMarginHighlightActive(false);
    }, 3500);
  };

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const navMenuItems = [
    { id: "checkin", label: "Daily Check-In Hub", shortLabel: "Daily Hub", icon: <CalendarCheck size={14} />, badge: "Routine" },
    { id: "matrix", label: "Subject-wise Matrix", shortLabel: "Subjects", icon: <Grid size={14} />, badge: `${allSectionSubjects.length} Subs` },
    { id: "studio", label: "Predictor Studio", shortLabel: "Predictor", icon: <Sliders size={14} />, badge: "Simulate" },
    { id: "bunk_analyzer", label: "Smart Bunk Planner", shortLabel: "Planner", icon: <ShieldCheck size={14} />, badge: "Weekly" },
  ];

  const handleResetAllAttendance = () => {
    setIsResetModalOpen(true);
  };

  if (pageLoading || isSearching) {
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
        <AttendanceSkeleton />
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#f1f5f9",
        minHeight: "100vh",
        color: "#0f172a",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        paddingBottom: 80,
        overflowX: "hidden",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: isMobile ? "8px 8px 80px 8px" : "24px 32px 90px 32px",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "280px minmax(0, 1fr)",
          gap: isMobile ? 10 : 24,
          alignItems: "start",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        {/* ══════════════════════════════════════════════════════════
            LEFT SIDEBAR NAVIGATION (Desktop Only)
        ══════════════════════════════════════════════════════════ */}
        {!isMobile && (
          <aside
            style={{
              position: "sticky",
              top: 20,
              maxHeight: "calc(100vh - 40px)",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              margin: 0,
              padding: 0,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {/* Main Unified Sidebar Card */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                padding: "16px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                boxShadow: "none",
              }}
            >
              {/* 1. Student Profile Header */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 17,
                      fontWeight: 800,
                      flexShrink: 0,
                      boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)",
                    }}
                  >
                    {activeStudentName ? activeStudentName.charAt(0).toUpperCase() : "A"}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3
                      style={{
                        fontSize: 14.5,
                        fontWeight: 800,
                        color: "#0f172a",
                        margin: "0 0 2px 0",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={activeStudentName || `Section ${selectedSection}`}
                    >
                      {activeStudentName || `Section ${selectedSection}`}
                    </h3>
                    {currentRegNo ? (
                      <span
                        style={{
                          fontFamily: "'DM Sans', monospace",
                          fontSize: 11,
                          color: "#475569",
                          fontWeight: 700,
                          background: "#f1f5f9",
                          padding: "2px 6px",
                          borderRadius: 5,
                          border: "1px solid #e2e8f0",
                          display: "inline-block",
                        }}
                      >
                        {currentRegNo}
                      </span>
                    ) : (
                      <span style={{ fontSize: 10.5, color: "#64748b", fontWeight: 600 }}>
                        Section {selectedSection} Routine
                      </span>
                    )}
                  </div>
                </div>

                {/* Student Meta Details */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 4,
                    padding: "6px 8px",
                    background: "#f8fafc",
                    borderRadius: 8,
                    border: "1px solid #f1f5f9",
                    fontSize: 11,
                    textAlign: "center",
                  }}
                >
                  <div>
                    <div style={{ color: "#94a3b8", fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" }}>Branch</div>
                    <strong style={{ color: "#0f172a" }}>CSE</strong>
                  </div>
                  <div>
                    <div style={{ color: "#94a3b8", fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" }}>Sec</div>
                    <strong style={{ color: "#059669" }}>{selectedSection}</strong>
                  </div>
                  <div>
                    <div style={{ color: "#94a3b8", fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" }}>Status</div>
                    <strong style={{ color: overallCalculation.isEligible ? "#059669" : "#dc2626" }}>
                      {overallCalculation.isEligible ? "Eligible" : "Shortage"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Admin / Privileged Student Lookup Search Bar (Only for Admin & 230301120327) */}
              {isSearchAuthorized && (
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: "10px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, fontWeight: 800, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      <ShieldCheck size={12} color="#2563eb" />
                      <span>Lookup Student</span>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 800, background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "1px 5px", borderRadius: 4 }}>
                      Admin Mode
                    </span>
                  </div>

                  <form onSubmit={handleSearchStudent} style={{ display: "flex", gap: 5 }}>
                    <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
                      <Search size={12} color="#64748b" style={{ position: "absolute", left: 8, pointerEvents: "none" }} />
                      <input
                        type="text"
                        placeholder="Reg No (e.g. 230301120001)"
                        value={searchRegInput}
                        onChange={(e) => setSearchRegInput(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "6px 6px 6px 26px",
                          borderRadius: 7,
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          color: "#0f172a",
                          fontSize: 11.5,
                          fontWeight: 600,
                          outline: "none",
                          boxSizing: "border-box",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSearching}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 7,
                        border: "none",
                        background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                        color: "#ffffff",
                        fontSize: 11.5,
                        fontWeight: 800,
                        cursor: isSearching ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        flexShrink: 0,
                        boxShadow: "0 2px 6px rgba(37,99,235,0.25)",
                      }}
                    >
                      <span>{isSearching ? "..." : "Go"}</span>
                      <ArrowRight size={10} />
                    </button>
                  </form>

                  {searchError && (
                    <div style={{ fontSize: 10.5, color: "#dc2626", fontWeight: 600 }}>
                      {searchError}
                    </div>
                  )}
                </div>
              )}

              <div style={{ height: 1, background: "#f1f5f9" }} />

              {/* 2. Enrolled Section (Locked / Assigned) */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Enrolled Section
                  </span>
                  <span style={{ fontSize: 10, color: "#059669", fontWeight: 700, background: "#ecfdf5", padding: "1px 6px", borderRadius: 4 }}>
                    Assigned
                  </span>
                </div>
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #a7f3d0",
                    background: "#ecfdf5",
                    color: "#065f46",
                    fontSize: 12.5,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Building size={14} color="#059669" />
                    <span>Section {selectedSection}</span>
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#059669" }}>Locked</span>
                </div>
              </div>

              <div style={{ height: 1, background: "#f1f5f9" }} />

              {/* 3. Dashboard Navigation Views Menu */}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", paddingLeft: 4, marginBottom: 4 }}>
                  Views
                </div>

                {navMenuItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTabClick(item.id)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "none",
                        background: isActive ? "#ecfdf5" : "transparent",
                        color: isActive ? "#059669" : "#475569",
                        fontSize: 12.5,
                        fontWeight: isActive ? 800 : 500,
                        cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                        transition: "all 0.15s ease",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = "#f8fafc";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <span style={{ color: isActive ? "#059669" : "#64748b" }}>{item.icon}</span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {isActive && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#059669" }} />}
                    </button>
                  );
                })}
              </div>

              <div style={{ height: 1, background: "#f1f5f9" }} />

              {/* 4. Quick Actions / Tools */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", paddingLeft: 4, marginBottom: 2 }}>
                  Tools
                </div>

                <button
                  type="button"
                  onClick={handleOpenScreenshotModal}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 9px",
                    borderRadius: 7,
                    border: "1px solid #bbf7d0",
                    background: "#f0fdf4",
                    color: "#166534",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Camera size={13} color="#059669" />
                  <span style={{ flex: 1, textAlign: "left" }}>Auto-Import Scan</span>
                  <span style={{ fontSize: 9.5, fontWeight: 900, background: "#dcfce7", color: "#15803d", padding: "1px 5px", borderRadius: 4 }}>
                    {scanStatus.isExempt ? "Unlimited" : `${scanStatus.remaining}/${scanStatus.max}`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCheckInDateKey(todayDateKey);
                    handleTabClick("checkin");
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 9px",
                    borderRadius: 7,
                    border: "1px solid #f1f5f9",
                    background: "#f8fafc",
                    color: "#334155",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#f8fafc")}
                >
                  <CalendarIcon size={13} color="#2563eb" />
                  <span style={{ flex: 1, textAlign: "left" }}>Mark Today's Attendance</span>
                  <ArrowRight size={11} color="#94a3b8" />
                </button>

                <button
                  type="button"
                  onClick={() => handleResetAllAttendance()}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 9px",
                    borderRadius: 7,
                    border: "1px solid #fee2e2",
                    background: "#fff1f2",
                    color: "#991b1b",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.15s ease",
                  }}
                >
                  <RotateCcw size={13} color="#dc2626" />
                  <span style={{ flex: 1, textAlign: "left" }}>Reset Attendance Data</span>
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* ══════════════════════════════════════════════════════════
            RIGHT MAIN WORKSPACE PANEL
        ══════════════════════════════════════════════════════════ */}
        <main style={{ display: "flex", flexDirection: "column", gap: isMobile ? 10 : 20, minWidth: 0, width: "100%", boxSizing: "border-box" }}>
          {/* ── MOBILE EXCLUSIVE AUTO-IMPORT CTA ── */}
          {isMobile && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
              <button
                type="button"
                onClick={handleOpenScreenshotModal}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #059669",
                  background: scanStatus.isLimitReached ? "#64748b" : "#059669",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: scanStatus.isLimitReached ? "not-allowed" : "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: "none",
                }}
              >
                <Camera size={15} />
                <span>Auto-Import Screenshot</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "2px 6px",
                    borderRadius: 5,
                    background: "rgba(255,255,255,0.2)",
                    color: "#ffffff",
                    marginLeft: 2,
                  }}
                >
                  {scanStatus.isExempt ? "Unlimited" : `${scanStatus.remaining}/${scanStatus.max} left`}
                </span>
              </button>
            </div>
          )}

          {/* ── VIEWS NAVIGATION HORIZONTAL PILL BAR (Mobile Devices Only) ── */}
          {isMobile && (
            <div
              className="flex md:hidden"
              style={{
                position: "sticky",
                top: 0,
                zIndex: 20,
                background: "#f1f5f9",
                padding: "4px 0 6px 0",
                display: isMobile ? "flex" : "none",
                alignItems: "center",
                gap: 5,
                width: "100%",
              }}
            >
              {/* Left Arrow Button */}
              <button
                type="button"
                onClick={() => scrollTabs("left")}
                disabled={!canScrollTabsLeft}
                aria-label="Scroll views left"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: canScrollTabsLeft ? "1px solid #cbd5e1" : "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: canScrollTabsLeft ? "#059669" : "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: canScrollTabsLeft ? "pointer" : "default",
                  flexShrink: 0,
                  opacity: canScrollTabsLeft ? 1 : 0.4,
                  transition: "all 0.15s ease",
                  padding: 0,
                }}
              >
                <ChevronLeft size={15} />
              </button>

              {/* Scrollable Tabs Track */}
              <div
                ref={mobileTabsRef}
                onScroll={checkTabsScroll}
                style={{
                  display: "flex",
                  gap: 6,
                  overflowX: "auto",
                  width: "100%",
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  scrollBehavior: "smooth",
                }}
              >
                {navMenuItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      data-tab-id={item.id}
                      type="button"
                      onClick={() => handleTabClick(item.id)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "7px 14px",
                        borderRadius: 999,
                        border: isActive ? "1px solid #cbd5e1" : "1px solid #e2e8f0",
                        background: isActive ? "#ffffff" : "#f8fafc",
                        color: isActive ? "#059669" : "#475569",
                        fontSize: 12,
                        fontWeight: isActive ? 800 : 600,
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                        flexShrink: 0,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span style={{ color: isActive ? "#059669" : "#64748b" }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right Arrow Button */}
              <button
                type="button"
                onClick={() => scrollTabs("right")}
                disabled={!canScrollTabsRight}
                aria-label="Scroll views right"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: canScrollTabsRight ? "1px solid #cbd5e1" : "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: canScrollTabsRight ? "#059669" : "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: canScrollTabsRight ? "pointer" : "default",
                  flexShrink: 0,
                  opacity: canScrollTabsRight ? 1 : 0.4,
                  transition: "all 0.15s ease",
                  padding: 0,
                }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}

          {/* On Desktop: Always visible. On Mobile: Visible when on Daily Hub (checkin) or Subject Matrix (matrix) */}
          {(!isMobile || activeTab === "checkin" || activeTab === "matrix") && (
            <>
              {/* Top Academic & Attendance Overview Header Card */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  padding: isMobile ? "12px 14px" : "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: isMobile ? 8 : 12,
                  boxShadow: "none",
                }}
              >
                {/* Header Content */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  {isMobile ? (
                    /* Mobile: Name + Section Badge + Target Selector */
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                      {/* Row 1: Name + Section Badge */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <h2
                            style={{
                              fontSize: 16,
                              fontWeight: 800,
                              color: "#0f172a",
                              margin: 0,
                              letterSpacing: "-0.3px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {activeStudentName || `Section ${selectedSection}`}
                          </h2>
                        </div>

                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4.5,
                            background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                            color: "#047857",
                            padding: "4px 9px",
                            borderRadius: 8,
                            fontSize: 11.5,
                            fontWeight: 750,
                            border: "1px solid #a7f3d0",
                            flexShrink: 0,
                          }}
                        >
                          <Building size={12} />
                          <span>Sec {selectedSection}</span>
                        </span>
                      </div>

                      {/* Row 2: Target Goal Segmented Control */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          background: "#f1f5f9",
                          padding: 3,
                          borderRadius: 10,
                          border: "1px solid #e2e8f0",
                          width: "100%",
                          boxSizing: "border-box",
                        }}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "0 6px 0 8px",
                            fontSize: 11,
                            fontWeight: 800,
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "0.4px",
                            flexShrink: 0,
                          }}
                        >
                          <Target size={12} color="#059669" />
                          <span>Target</span>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            gap: 3,
                            flex: 1,
                          }}
                        >
                          {[75, 80, 85, 90].map((goal) => {
                            const isSelected = targetGoal === goal;
                            return (
                              <button
                                key={goal}
                                type="button"
                                onClick={() => {
                                  setTargetGoal(goal);
                                  syncAttendanceToDb(savedSubjects, allDailyLogs, goal);
                                }}
                                style={{
                                  padding: "6px 0",
                                  borderRadius: 7,
                                  border: "none",
                                  background: isSelected ? "#059669" : "transparent",
                                  color: isSelected ? "#ffffff" : "#475569",
                                  fontSize: 12,
                                  fontWeight: 800,
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                  boxShadow: isSelected
                                    ? "0 2px 6px rgba(5, 150, 105, 0.28)"
                                    : "none",
                                  textAlign: "center",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {goal}%
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Desktop Header with Title & Action Buttons */
                    <>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#059669", fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
                          <Activity size={13} />
                          <span>Attendance Intelligence · Section {selectedSection}</span>
                        </div>
                        <h1
                          style={{
                            fontSize: "clamp(20px, 2.2vw, 26px)",
                            fontWeight: 800,
                            color: "#0f172a",
                            margin: 0,
                            letterSpacing: "-0.4px",
                          }}
                        >
                          {activeStudentName || `Section ${selectedSection} Attendance`}
                        </h1>
                      </div>

                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {/* Target Goal Selector */}
                        <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#f8fafc", padding: "3px 6px", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", marginRight: 2 }}>Target:</span>
                          {[75, 80, 85, 90].map((goal) => {
                            const isSelected = targetGoal === goal;
                            return (
                              <button
                                key={goal}
                                type="button"
                                onClick={() => {
                                  setTargetGoal(goal);
                                  syncAttendanceToDb(savedSubjects, allDailyLogs, goal);
                                }}
                                style={{
                                  padding: "3px 7px",
                                  borderRadius: 5,
                                  border: "none",
                                  background: isSelected ? "#059669" : "transparent",
                                  color: isSelected ? "#ffffff" : "#475569",
                                  fontSize: 11,
                                  fontWeight: 800,
                                  cursor: "pointer",
                                  transition: "all 0.12s ease",
                                }}
                              >
                                {goal}%
                              </button>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={handleOpenScreenshotModal}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "7px 12px",
                            borderRadius: 6,
                            border: "1px solid #059669",
                            background: scanStatus.isLimitReached ? "#64748b" : "#059669",
                            color: "#ffffff",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: scanStatus.isLimitReached ? "not-allowed" : "pointer",
                            fontFamily: "'DM Sans', sans-serif",
                            transition: "all 0.12s",
                            boxShadow: "none",
                          }}
                        >
                          <Camera size={13} />
                          <span>Auto-Import</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 4 Hero Stat Cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: isMobile ? 8 : 12,
                  width: "100%",
                }}
              >
                {/* 1. Overall Score */}
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: 10,
                    padding: isMobile ? "12px 12px" : "16px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: isMobile ? 10.5 : 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Semester Attendance
                    </span>
                    <span style={{ fontSize: 10, background: overallAggregate.percentage >= 75 ? "#ecfdf5" : "#fee2e2", color: overallAggregate.percentage >= 75 ? "#059669" : "#dc2626", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                      {overallAggregate.percentage >= 75 ? "Eligible" : "Shortage"}
                    </span>
                  </div>
                  <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: overallAggregate.percentage >= 75 ? "#059669" : "#dc2626", fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
                    {overallAggregate.percentage}%
                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}> /100</span>
                  </div>
                  <span style={{ fontSize: 10.5, color: "#64748b" }}>Current semester score</span>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "#f1f5f9" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, Math.max(0, overallAggregate.percentage))}%`,
                        background: overallAggregate.percentage >= 75 ? "#059669" : "#dc2626",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>

                {/* 2. Attended / Delivered */}
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: 10,
                    padding: isMobile ? "12px 12px" : "16px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    boxShadow: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: isMobile ? 10.5 : 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Attended Classes
                    </span>
                    <span style={{ fontSize: 10, background: "#f5f3ff", color: "#8b5cf6", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                      {allSectionSubjects.length} Courses
                    </span>
                  </div>
                  <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: "#0f172a", fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
                    {overallAggregate.totalAttended}
                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}> / {overallAggregate.totalDelivered}</span>
                  </div>
                  <span style={{ fontSize: 10.5, color: "#64748b" }}>Delivered across semester</span>
                </div>

                {/* 3. Recovery Needed / Safe Bunk Margin */}
                <div
                  onClick={() => {
                    if (overallCalculation.classesNeeded > 0) {
                      handleHighlightRecoverySubjects();
                    } else if (overallCalculation.safeBunks > 0) {
                      handleHighlightSafeMarginSubjects();
                    }
                  }}
                  style={{
                    background: isRecoveryHighlightActive
                      ? "#fffbeb"
                      : isSafeMarginHighlightActive
                      ? "#f0fdf4"
                      : "#ffffff",
                    border: `1px solid ${
                      isRecoveryHighlightActive
                        ? "#d97706"
                        : isSafeMarginHighlightActive
                        ? "#16a34a"
                        : overallCalculation.classesNeeded > 0
                        ? "#fcd34d"
                        : "#cbd5e1"
                    }`,
                    borderRadius: 10,
                    padding: isMobile ? "12px 12px" : "16px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    cursor: (overallCalculation.classesNeeded > 0 || overallCalculation.safeBunks > 0) ? "pointer" : "default",
                    boxShadow: isRecoveryHighlightActive
                      ? "0 0 0 2px rgba(217, 119, 6, 0.25)"
                      : isSafeMarginHighlightActive
                      ? "0 0 0 2px rgba(22, 163, 74, 0.2)"
                      : "none",
                    transition: "all 0.15s ease",
                  }}
                  title={
                    overallCalculation.classesNeeded > 0
                      ? `Click to highlight ${recoverySubjectsCount} subject(s) needing recovery for ${targetGoal}%${unattainableSubjectsCount > 0 ? ` (${unattainableSubjectsCount} unattainable this semester)` : ""}`
                      : overallCalculation.safeBunks > 0
                      ? `Click to highlight subjects with safe margin for ${targetGoal}%`
                      : undefined
                  }
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: isMobile ? 10.5 : 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {overallCalculation.classesNeeded > 0 ? "Recovery Needed" : "Safe Bunk Margin"}
                    </span>
                    <span style={{ fontSize: 10, background: overallCalculation.classesNeeded > 0 ? "#fef3c7" : "#f8fafc", color: overallCalculation.classesNeeded > 0 ? "#b45309" : "#64748b", border: `1px solid ${overallCalculation.classesNeeded > 0 ? "#fde68a" : "#cbd5e1"}`, padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                      Goal: {targetGoal}%
                    </span>
                  </div>
                  <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: overallCalculation.classesNeeded > 0 ? "#d97706" : "#059669", fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
                    {overallCalculation.classesNeeded > 0 ? `${overallCalculation.classesNeeded}` : `+${overallCalculation.safeBunks}`}
                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}> classes</span>
                  </div>
                  <span style={{ fontSize: 10.5, color: overallCalculation.classesNeeded > 0 ? "#b45309" : "#64748b", fontWeight: overallCalculation.classesNeeded > 0 ? 700 : 500, display: "flex", alignItems: "center", gap: 4 }}>
                    {overallCalculation.classesNeeded > 0 ? (
                      <>
                        <span>
                          Highlight {recoverySubjectsCount} to recover
                          {unattainableSubjectsCount > 0 && (
                            <strong style={{ color: "#dc2626", marginLeft: 4 }}>({unattainableSubjectsCount} unattainable)</strong>
                          )}
                        </span>
                        <ArrowRight size={11} color="#d97706" />
                      </>
                    ) : (
                      <>
                        <span>Buffer to stay ≥ {targetGoal}%</span>
                        {overallCalculation.safeBunks > 0 && <ArrowRight size={11} color="#059669" />}
                      </>
                    )}
                  </span>
                </div>

                {/* 4. Shortage Subjects (Below 75% Attendance) */}
                <div
                  onClick={shortageCount > 0 ? handleHighlightShortageSubjects : undefined}
                  style={{
                    background: isShortageHighlightActive ? "#fff7ed" : "#ffffff",
                    border: `1px solid ${isShortageHighlightActive ? "#f97316" : shortageCount > 0 ? "#fca5a5" : "#cbd5e1"}`,
                    borderRadius: 10,
                    padding: isMobile ? "12px 12px" : "16px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    cursor: shortageCount > 0 ? "pointer" : "default",
                    boxShadow: isShortageHighlightActive ? "0 0 0 2px rgba(249, 115, 22, 0.2)" : "none",
                    transition: "all 0.15s ease",
                  }}
                  title={shortageCount > 0 ? "Click to highlight shortage subjects for 1 minute" : undefined}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: isMobile ? 10.5 : 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Below 75% Criteria
                    </span>
                    <span style={{ fontSize: 10, background: shortageCount > 0 ? "#fee2e2" : "#ecfdf5", color: shortageCount > 0 ? "#dc2626" : "#059669", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                      {shortageCount > 0 ? "Shortage" : "All Safe"}
                    </span>
                  </div>
                  <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: shortageCount > 0 ? "#dc2626" : "#059669", fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
                    {shortageCount}
                    <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}> / {allSectionSubjects.length} Courses</span>
                  </div>
                  <span style={{ fontSize: 10.5, color: shortageCount > 0 ? "#b91c1c" : "#059669", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                    {shortageCount > 0 ? (
                      <>
                        <span>Click to highlight {shortageCount} subject(s)</span>
                        <ArrowRight size={11} />
                      </>
                    ) : (
                      <span>All subjects ≥ 75% (No shortage)</span>
                    )}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              ANIMATED TAB CONTENT SWITCHER (Analytics-Style Smooth Fade Up)
          ═══════════════════════════════════════════════════════════════ */}
          <div style={{ width: "100%" }}>
            <AnimatePresence mode="wait">
              {/* ═══════════════════════════════════════════════════════════════
                  TAB 1: DAILY CLASS ATTENDANCE CHECK-IN HUB
              ═══════════════════════════════════════════════════════════════ */}
              {activeTab === "checkin" && (
                <motion.div
                  key="checkin"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  style={{ display: "flex", flexDirection: "column", gap: isMobile ? 10 : 14, width: "100%" }}
                >

            {/* ── 2. CLASS ATTENDANCE CHECK-IN HUB (Date / History Stepper & Routine Cards) ── */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: isMobile ? "14px 12px" : "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                boxShadow: "none",
                overflow: "hidden",
              }}
            >
          {/* Header & Date Navigation Toolbar */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between",
              alignItems: isMobile ? "flex-start" : "center",
              gap: 12,
              paddingBottom: 12,
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            {/* Title & Info */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: isSelectedToday
                    ? "linear-gradient(135deg, #059669 0%, #10b981 100%)"
                    : isSelectedYesterday
                    ? "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)"
                    : "linear-gradient(135deg, #475569 0%, #64748b 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: isSelectedToday ? "0 2px 8px rgba(16, 185, 129, 0.25)" : "none",
                }}
              >
                <CalendarIcon size={19} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: isMobile ? 15 : 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    {isSelectedToday
                      ? `Today's Class Check-in`
                      : isSelectedYesterday
                      ? `Yesterday's Class Check-in`
                      : `Class Check-in`}
                  </h3>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: isSelectedToday ? "#dcfce7" : isSelectedYesterday ? "#eff6ff" : "#f1f5f9",
                      color: isSelectedToday ? "#15803d" : isSelectedYesterday ? "#1d4ed8" : "#475569",
                      border: `1px solid ${isSelectedToday ? "#bbf7d0" : isSelectedYesterday ? "#bfdbfe" : "#e2e8f0"}`,
                    }}
                  >
                    {selectedDayName}, {formatFriendlyDate(selectedCheckInDateKey)}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
                  {isSelectedSunday
                    ? "Sunday is a scheduled weekend holiday. No academic attendance is recorded."
                    : "Mark or adjust attendance per class to auto-increment and sync your cloud records in real time."}
                </p>
              </div>
            </div>

            {/* Quick Stats & Reset Action */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "space-between" : "flex-end" }}>
              {Object.keys(activeDateLogs).length > 0 && (
                <button
                  type="button"
                  onClick={() => handleResetDateCheckins(selectedCheckInDateKey)}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#dc2626",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    padding: "5px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <RotateCcw size={12} />
                  <span>Reset {isSelectedToday ? "Today" : isSelectedYesterday ? "Yesterday" : "Date"}</span>
                </button>
              )}

              {(() => {
                const presentCount = Object.values(activeDateLogs).filter((v) => v === "present").length;
                const absentCount = Object.values(activeDateLogs).filter((v) => v === "absent").length;
                const totalLogged = presentCount + absentCount;

                if (isSelectedSunday || selectedDayClasses.length === 0) {
                  return (
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 800,
                        color: isSelectedSunday ? "#d97706" : "#64748b",
                        background: isSelectedSunday ? "#fffbeb" : "#f1f5f9",
                        border: `1px solid ${isSelectedSunday ? "#fde68a" : "#e2e8f0"}`,
                        padding: "4px 10px",
                        borderRadius: 8,
                      }}
                    >
                      {isSelectedSunday ? "Weekend · No Classes" : "No Classes"}
                    </span>
                  );
                }

                return (
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 800,
                      color: totalLogged > 0 ? "#0f766e" : "#059669",
                      background: totalLogged > 0 ? "#f0fdfa" : "#ecfdf5",
                      border: `1px solid ${totalLogged > 0 ? "#99f6e4" : "#a7f3d0"}`,
                      padding: "4px 10px",
                      borderRadius: 8,
                    }}
                  >
                    {totalLogged === 0
                      ? `0 / ${selectedDayClasses.length} Logged`
                      : `${presentCount} Present · ${absentCount} Absent (${totalLogged}/${selectedDayClasses.length})`}
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Date Navigation Bar (Prev Day, Date Picker, Next Day, Shortcut Chips) */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {/* Stepper Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {/* Prev Day Button */}
              <button
                type="button"
                onClick={handlePrevDay}
                disabled={!canGoPrev}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: `1px solid ${canGoPrev ? "#cbd5e1" : "#e2e8f0"}`,
                  background: canGoPrev ? "#ffffff" : "#f1f5f9",
                  color: canGoPrev ? "#0f172a" : "#94a3b8",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: canGoPrev ? "pointer" : "not-allowed",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  transition: "all 0.15s ease",
                }}
                title={canGoPrev ? "Go to previous day" : `Initial tracking start date (${formatFriendlyDate(minTrackingDateKey)})`}
              >
                <ChevronLeft size={14} />
                <span>Prev Day</span>
              </button>

              {/* Native / Interactive Date Picker Centerpiece */}
              <label
                style={{
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#0f172a",
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                }}
              >
                <CalendarIcon size={14} color="#2563eb" />
                <span>{formatFriendlyDate(selectedCheckInDateKey)}</span>
                <input
                  type="date"
                  min={minTrackingDateKey}
                  max={todayDateKey}
                  value={selectedCheckInDateKey}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleSelectDate(e.target.value);
                    }
                  }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0,
                    cursor: "pointer",
                    width: "100%",
                    height: "100%",
                  }}
                />
              </label>

              {/* Next Day Button */}
              <button
                type="button"
                onClick={handleNextDay}
                disabled={!canGoNext}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: `1px solid ${canGoNext ? "#cbd5e1" : "#e2e8f0"}`,
                  background: canGoNext ? "#ffffff" : "#f1f5f9",
                  color: canGoNext ? "#0f172a" : "#94a3b8",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: canGoNext ? "pointer" : "not-allowed",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  transition: "all 0.15s ease",
                }}
                title={canGoNext ? "Go to next day" : "Cannot mark future dates beyond today"}
              >
                <span>Next Day</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Quick Date Shortcut Chips */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                type="button"
                onClick={() => setSelectedCheckInDateKey(todayDateKey)}
                style={{
                  padding: "5px 10px",
                  borderRadius: 7,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                  border: isSelectedToday ? "1px solid #86efac" : "1px solid #e2e8f0",
                  background: isSelectedToday ? "#dcfce7" : "#ffffff",
                  color: isSelectedToday ? "#15803d" : "#475569",
                  transition: "all 0.15s ease",
                }}
              >
                Today
              </button>

              {yesterdayDateKey >= minTrackingDateKey && (
                <button
                  type="button"
                  onClick={() => setSelectedCheckInDateKey(yesterdayDateKey)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 7,
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer",
                    border: isSelectedYesterday ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                    background: isSelectedYesterday ? "#eff6ff" : "#ffffff",
                    color: isSelectedYesterday ? "#1d4ed8" : "#475569",
                    transition: "all 0.15s ease",
                  }}
                >
                  Yesterday
                </button>
              )}
            </div>
          </div>

          {selectedDayClasses.length === 0 ? (
            <div
              style={{
                background: isSelectedSunday ? "#fffbeb" : "#f8fafc",
                border: `1.5px dashed ${isSelectedSunday ? "#fde68a" : "#cbd5e1"}`,
                borderRadius: 14,
                padding: "20px 24px",
                textAlign: "center",
                color: isSelectedSunday ? "#92400e" : "#64748b",
                fontSize: 13.5,
                fontWeight: 600,
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <Info size={18} color={isSelectedSunday ? "#d97706" : "#64748b"} />
              <span>
                {isSelectedSunday
                  ? `Sunday is a weekend holiday. No classes are scheduled for Section ${selectedSection}.`
                  : `No academic classes scheduled for ${selectedDayName} (Section ${selectedSection}).`}
              </span>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCheckInDateKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 10,
                }}
              >
                {selectedDayClasses.map((period) => {
                const status = activeDateLogs[period.slotIndex]; // "present" | "absent" | undefined
                const isPresent = status === "present";
                const isAbsent = status === "absent";
                const subCode = resolveSubjectCode(period, studentData);

                return (
                  <div
                    key={`${selectedCheckInDateKey}-p${period.slotIndex}`}
                    style={{
                      background: isPresent ? "#f0fdf4" : isAbsent ? "#fff1f2" : "#ffffff",
                      border: `1px solid ${isPresent ? "#86efac" : isAbsent ? "#fca5a5" : "#e2e8f0"}`,
                      borderRadius: 8,
                      padding: "12px 14px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 10,
                      boxShadow: "none",
                      transition: "background 0.15s ease, border-color 0.15s ease",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 800, color: "#64748b", fontFamily: "'DM Sans', monospace" }}>
                          P{period.slotIndex + 1} · {period.slot?.startTime} - {period.slot?.endTime}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {status && (
                            <span
                              style={{
                                fontSize: 9.5,
                                fontWeight: 900,
                                background: isPresent ? "#dcfce7" : "#fee2e2",
                                color: isPresent ? "#15803d" : "#b91c1c",
                                padding: "2px 6px",
                                borderRadius: 6,
                                border: `1px solid ${isPresent ? "#bbf7d0" : "#fecaca"}`,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              {isPresent ? (
                                <>
                                  <CheckCircle2 size={11} color="#15803d" /> <span>+1 Attended</span>
                                </>
                              ) : (
                                <>
                                  <XCircle size={11} color="#b91c1c" /> <span>+1 Conducted</span>
                                </>
                              )}
                            </span>
                          )}
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
                      </div>

                      <div style={{ marginTop: 4 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a", lineHeight: 1.3 }}>
                          {period.cleanName}
                        </div>
                        {subCode && (
                          <span
                            style={{
                              fontSize: 10,
                              fontFamily: "'DM Sans', monospace",
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

                    {/* Dual Action Buttons: Present & Absent */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, paddingTop: 4 }}>
                      {/* Mark Present Button */}
                      <button
                        type="button"
                        onClick={() => handleMarkDailyAttendance(period, "present")}
                        style={{
                          padding: "7px 10px",
                          borderRadius: 8,
                          border: isPresent ? "1.5px solid #059669" : "1px solid #86efac",
                          background: isPresent ? "linear-gradient(135deg, #059669 0%, #047857 100%)" : "#f0fdf4",
                          color: isPresent ? "#ffffff" : "#166534",
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 5,
                          transition: "all 0.15s ease",
                          boxShadow: isPresent ? "0 2px 6px rgba(5, 150, 105, 0.25)" : "none",
                        }}
                      >
                        <CheckCircle2 size={14} color={isPresent ? "#ffffff" : "#059669"} />
                        <span>Present</span>
                      </button>

                      {/* Mark Absent Button */}
                      <button
                        type="button"
                        onClick={() => handleMarkDailyAttendance(period, "absent")}
                        style={{
                          padding: "7px 10px",
                          borderRadius: 8,
                          border: isAbsent ? "1.5px solid #dc2626" : "1px solid #fca5a5",
                          background: isAbsent ? "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)" : "#fef2f2",
                          color: isAbsent ? "#ffffff" : "#991b1b",
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 5,
                          transition: "all 0.15s ease",
                          boxShadow: isAbsent ? "0 2px 6px rgba(220, 38, 38, 0.25)" : "none",
                        }}
                      >
                        <XCircle size={14} color={isAbsent ? "#ffffff" : "#dc2626"} />
                        <span>Absent</span>
                      </button>
                    </div>
                  </div>
                );
              })}
              </motion.div>
            </AnimatePresence>
          )}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 2: SUBJECT-WISE ATTENDANCE MATRIX ({allSectionSubjects.length})
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "matrix" && (
          <motion.div
            key="matrix"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{ display: "flex", flexDirection: "column", gap: isMobile ? 10 : 14, width: "100%" }}
          >
            {allSectionSubjects.length > 0 && (
              <div
                id="attendance-subject-matrix-section"
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: isMobile ? "14px 12px" : "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  boxShadow: "none",
                }}
              >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <h3 style={{ fontSize: isMobile ? 15.5 : 17, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <Layers size={17} color="#059669" />
                  Semester Subjects Attendance & Target Matrix ({allSectionSubjects.length})
                </h3>
                <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
                  Full multi-component breakdown (theory PP, practical PR, tutorial TUT) with target prediction for Section {selectedSection}.
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div
                  style={{
                    background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                    border: "1px solid #a7f3d0",
                    borderRadius: 8,
                    padding: "6px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#065f46", textTransform: "uppercase" }}>Overall Semester Score</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: overallAggregate.percentage >= 75 ? "#059669" : "#dc2626", fontFamily: "'DM Sans', sans-serif" }}>
                      {overallAggregate.percentage}% <span style={{ fontSize: 11, fontWeight: 700, color: "#065f46" }}>({overallAggregate.totalAttended}/{overallAggregate.totalDelivered})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Cards Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 12,
              }}
            >
              {allSectionSubjects.map((sub, idx) => {
                const catMatch = sectionCatalog.find((c) => isSameSubject(c, sub));
                const weeklyOccurrences = catMatch?.weeklyOccurrences || [];

                const subCalc = calculateAttendance({
                  components: sub.components,
                  targetPercentage: targetGoal,
                });
                const subCode = resolveSubjectCode({ subject: sub.subjectName }, studentData);
                const hasConductedClasses = subCalc.totalDelivered > 0;
                const isPassing75 = hasConductedClasses ? subCalc.currentPercentage >= 75 : true;
                const isPassingTarget = hasConductedClasses ? subCalc.currentPercentage >= targetGoal : true;

                let dateProj = null;
                if (subCalc.classesNeeded > 0 && weeklyOccurrences.length > 0) {
                  dateProj = estimateTargetReachDate(
                    subCalc.classesNeeded,
                    weeklyOccurrences,
                    new Date(),
                    subCalc.totalAttended,
                    subCalc.totalDelivered,
                    targetGoal,
                    1
                  );
                }

                const isUnattainable = Boolean(dateProj && !dateProj.isAttainable);
                const isRecoveryAndHighlighted = isRecoveryHighlightActive && hasConductedClasses && subCalc.classesNeeded > 0;
                const isShortageAndHighlighted = isShortageHighlightActive && hasConductedClasses && !isPassing75;
                const isSafeAndHighlighted = isSafeMarginHighlightActive && hasConductedClasses && subCalc.safeBunks > 0;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedSubjectName(sub.subjectName); setComponentInputs(sub.components || []); handleTabClick("studio"); window.scrollTo({ top: 400, behavior: "smooth" });
                    }}
                    style={{
                      background: isRecoveryAndHighlighted
                        ? (isUnattainable ? "#fff1f2" : "#fffbeb")
                        : isSafeAndHighlighted
                        ? "#f0fdf4"
                        : isShortageAndHighlighted
                        ? "#fff8f8"
                        : "#ffffff",
                      border: isRecoveryAndHighlighted
                        ? (isUnattainable ? "2px solid #e11d48" : "2px solid #d97706")
                        : isSafeAndHighlighted
                        ? "1.5px solid #16a34a"
                        : isShortageAndHighlighted
                        ? "1.5px solid #ef4444"
                        : isUnattainable
                        ? "1.5px solid #fecdd3"
                        : `1px solid ${!hasConductedClasses ? "#e2e8f0" : (isPassing75 ? "#e2e8f0" : "#fca5a5")}`,
                      borderRadius: 8,
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 10,
                      cursor: "pointer",
                      boxShadow: isRecoveryAndHighlighted
                        ? (isUnattainable ? "0 0 0 3px rgba(225, 29, 72, 0.25)" : "0 0 0 3px rgba(217, 119, 6, 0.25)")
                        : isSafeAndHighlighted
                        ? "0 0 0 2px rgba(22, 163, 74, 0.2)"
                        : isShortageAndHighlighted
                        ? "0 0 0 2px rgba(239, 68, 68, 0.15)"
                        : "none",
                      transition: "all 0.35s ease",
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
                                  fontSize: 10.5,
                                  fontFamily: "'DM Sans', monospace",
                                  fontWeight: 800,
                                  color: "#2563eb",
                                  background: "#eff6ff",
                                  border: "1px solid #bfdbfe",
                                  padding: "1px 6px",
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
                              color: !hasConductedClasses ? "#64748b" : (isPassing75 ? "#059669" : "#dc2626"),
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            {hasConductedClasses ? `${subCalc.currentPercentage}%` : "0%"}
                          </div>
                          <span
                            style={{
                              fontSize: 9.5,
                              fontWeight: 900,
                              background: !hasConductedClasses
                                ? "#f1f5f9"
                                : isUnattainable
                                ? "#fff1f2"
                                : (isPassing75 ? "#ecfdf5" : "#fef2f2"),
                              color: !hasConductedClasses
                                ? "#64748b"
                                : isUnattainable
                                ? "#e11d48"
                                : (isPassing75 ? "#059669" : "#dc2626"),
                              border: isUnattainable ? "1px solid #fecdd3" : "none",
                              padding: "1px 6px",
                              borderRadius: 4,
                            }}
                          >
                            {!hasConductedClasses
                              ? "NO CLASSES"
                              : isUnattainable
                              ? `UNATTAINABLE (${targetGoal}%)`
                              : (isPassing75 ? "ELIGIBLE" : "SHORTAGE")}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ width: "100%", height: 5, background: "#f1f5f9", borderRadius: 999, margin: "10px 0 8px 0", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${Math.min(100, Math.max(0, subCalc.currentPercentage))}%`,
                            height: "100%",
                            background: isPassing75 ? "linear-gradient(90deg, #10b981, #059669)" : "linear-gradient(90deg, #f87171, #dc2626)",
                            borderRadius: 999,
                          }}
                        />
                      </div>

                      {/* Component breakdown list */}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                        {(sub.components || []).map((c, cIdx) => {
                          const cPct = c.delivered > 0 ? ((c.attended / c.delivered) * 100).toFixed(1) : "0.0";
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
                        background: isUnattainable
                          ? "#fff1f2"
                          : subCalc.classesNeeded > 0
                          ? "#fffbeb"
                          : "#f0fdf4",
                        border: `1px solid ${
                          isUnattainable
                            ? "#fecdd3"
                            : subCalc.classesNeeded > 0
                            ? "#fde68a"
                            : "#bbf7d0"
                        }`,
                        borderRadius: 10,
                        padding: "8px 10px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5 }}>
                        {isUnattainable && dateProj ? (
                          <>
                            <AlertTriangle size={13} color="#e11d48" />
                            <span style={{ fontWeight: 800, color: "#9f1239" }}>
                              Unattainable for {targetGoal}% &middot; Max possible: <strong>{dateProj.maxAttainablePercentage}%</strong> (only {dateProj.totalRemainingSemClasses} classes left)
                            </span>
                          </>
                        ) : subCalc.classesNeeded > 0 ? (
                          <>
                            <AlertTriangle size={13} color="#d97706" />
                            <span style={{ fontWeight: 800, color: "#92400e" }}>
                              Need {subCalc.classesNeeded} {subCalc.classesNeeded === 1 ? "class" : "classes"} to reach {targetGoal}%
                              {dateProj?.estimatedDate && (
                                <span style={{ fontWeight: 700, color: "#b45309", marginLeft: 4 }}>
                                  (Reach by {dateProj.estimatedDate})
                                </span>
                              )}
                            </span>
                          </>
                        ) : subCalc.safeBunks > 0 ? (
                          <>
                            <ShieldCheck size={13} color="#16a34a" />
                            <span style={{ fontWeight: 800, color: "#166534" }}>
                              Safe buffer: Can miss {subCalc.safeBunks} {subCalc.safeBunks === 1 ? "class" : "classes"} (stays &ge; {targetGoal}%)
                            </span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={13} color="#2563eb" />
                            <span style={{ fontWeight: 800, color: "#1e40af" }}>
                              At {targetGoal}% threshold &mdash; Maintain regular attendance
                            </span>
                          </>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubjectName(sub.subjectName); setComponentInputs(sub.components || []); handleTabClick("studio"); window.scrollTo({ top: 400, behavior: "smooth" });
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
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 3: PREDICTOR STUDIO
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "studio" && (
          <motion.div
            key="studio"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{ display: "flex", flexDirection: "column", gap: isMobile ? 10 : 14, width: "100%" }}
          >
            {/* ═══════════════════════════════════════════════════════════════
                FIRST-TIME STUDENT ONBOARDING & GUIDED SETUP HUB
            ═══════════════════════════════════════════════════════════════ */}
            {!hasSavedAttendance && (
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: isMobile ? "14px 14px" : "20px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  boxShadow: "none",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Top Accent Gradient Bar */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3.5,
                    background: "linear-gradient(90deg, #2563eb 0%, #059669 100%)",
                  }}
                />

                {/* Hero Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: isMobile ? "flex-start" : "center",
                    flexDirection: isMobile ? "column" : "row",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: isMobile ? 38 : 44,
                        height: isMobile ? 38 : 44,
                        borderRadius: 12,
                        background: "linear-gradient(135deg, #059669 0%, #2563eb 100%)",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: "0 2px 8px rgba(5, 150, 105, 0.22)",
                      }}
                    >
                      <Zap size={isMobile ? 18 : 22} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <h3
                          style={{
                            fontSize: isMobile ? 15.5 : 18,
                            fontWeight: 900,
                            color: "#0f172a",
                            margin: 0,
                            letterSpacing: "-0.3px",
                          }}
                        >
                          Attendance Tracker Quick Setup Guide
                        </h3>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            background: "#dcfce7",
                            color: "#15803d",
                            padding: "2px 8px",
                            borderRadius: 999,
                            border: "1px solid #bbf7d0",
                          }}
                        >
                          Fresh Setup (0 / 0)
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: isMobile ? 12 : 13,
                          color: "#475569",
                          margin: "3px 0 0 0",
                          lineHeight: 1.45,
                        }}
                      >
                        All subjects for <strong>Section {selectedSection}</strong> are pre-loaded. Choose a method below to sync your attendance in seconds:
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenScreenshotModal}
                    style={{
                      width: isMobile ? "100%" : "auto",
                      padding: isMobile ? "10px 16px" : "9px 18px",
                      borderRadius: 10,
                      border: "none",
                      background: scanStatus.isLimitReached
                        ? "#64748b"
                        : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                      color: "#ffffff",
                      fontSize: isMobile ? 13 : 13.5,
                      fontWeight: 800,
                      cursor: scanStatus.isLimitReached ? "not-allowed" : "pointer",
                      opacity: scanStatus.isLimitReached ? 0.65 : 1,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: scanStatus.isLimitReached ? "none" : "0 2px 8px rgba(37, 99, 235, 0.25)",
                      transition: "transform 0.15s ease",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      if (!scanStatus.isLimitReached) e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                  >
                    <Camera size={16} />
                    <span>
                      {scanStatus.isExempt
                        ? "Auto-Import via Screenshot (Unlimited)"
                        : scanStatus.isLimitReached
                        ? "Limit Reached (0/2 scans left)"
                        : `Auto-Import via Screenshot (${scanStatus.remaining}/${scanStatus.max})`}
                    </span>
                  </button>
                </div>

                {/* 2 Path Cards Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: isMobile ? 12 : 16,
                  }}
                >
                  {/* Method 1: 1-Click Screenshot Import (Recommended) */}
                  <div
                    style={{
                      background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
                      border: "1.5px solid #bfdbfe",
                      borderRadius: 12,
                      padding: isMobile ? "14px 14px" : "16px 18px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 8,
                              background: "#eff6ff",
                              color: "#2563eb",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid #bfdbfe",
                            }}
                          >
                            <Smartphone size={16} />
                          </div>
                          <span style={{ fontSize: isMobile ? 13.5 : 14.5, fontWeight: 800, color: "#0f172a" }}>
                            Method 1: Screenshot Auto-Import
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 900,
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            padding: "2px 8px",
                            borderRadius: 6,
                            border: "1px solid #bfdbfe",
                            letterSpacing: "0.4px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Zap size={11} /> FASTEST & RECOMMENDED
                        </span>
                      </div>

                      {/* Source Guide Box */}
                      <div
                        style={{
                          background: "#eff6ff",
                          border: "1px solid #dbeafe",
                          borderRadius: 8,
                          padding: "8px 10px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          fontSize: 11.5,
                          color: "#1e40af",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 750 }}>
                          <Monitor size={13} color="#2563eb" style={{ flexShrink: 0 }} />
                          <span><strong>Website ERP:</strong> Academic &rarr; Student Course Wise Attendance</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 750 }}>
                          <Smartphone size={13} color="#2563eb" style={{ flexShrink: 0 }} />
                          <span><strong>Mobile App:</strong> Subject-wise Attendance (Full table screenshot)</span>
                        </div>
                      </div>

                      {/* Numbered Steps */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "#475569" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <span style={{ width: 18, height: 18, borderRadius: 999, background: "#eff6ff", color: "#2563eb", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>1</span>
                          <span>Take a full screenshot of your ERP attendance table or copy the image to clipboard.</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <span style={{ width: 18, height: 18, borderRadius: 999, background: "#eff6ff", color: "#2563eb", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>2</span>
                          <span>Click <strong>Upload / Paste Screenshot</strong> or press <kbd style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: 4, fontSize: 10.5, fontWeight: 800 }}>Ctrl + V</kbd> to paste directly.</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <span style={{ width: 18, height: 18, borderRadius: 999, background: "#eff6ff", color: "#2563eb", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>3</span>
                          <span>Auto-extracts Theory (<strong>PP</strong>), Practice (<strong>PR</strong>), and Tutorial (<strong>TUT</strong>) counts accurately.</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <span style={{ width: 18, height: 18, borderRadius: 999, background: "#eff6ff", color: "#2563eb", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>4</span>
                          <span>Verify with the preview disclaimer and click <strong>Confirm & Save to Cloud</strong>!</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenScreenshotModal}
                      style={{
                        marginTop: 4,
                        padding: "9px 14px",
                        borderRadius: 8,
                        border: `1px solid ${scanStatus.isLimitReached ? "#cbd5e1" : "#bfdbfe"}`,
                        background: scanStatus.isLimitReached ? "#f1f5f9" : "#eff6ff",
                        color: scanStatus.isLimitReached ? "#64748b" : "#1d4ed8",
                        fontSize: 12.5,
                        fontWeight: 800,
                        cursor: scanStatus.isLimitReached ? "not-allowed" : "pointer",
                        opacity: scanStatus.isLimitReached ? 0.65 : 1,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <CloudUpload size={15} />
                      <span>
                        {scanStatus.isExempt
                          ? "Upload / Paste ERP Screenshot Now (Unlimited)"
                          : scanStatus.isLimitReached
                          ? "Daily Limit Reached (0/2 today)"
                          : `Upload / Paste Screenshot Now (${scanStatus.remaining}/${scanStatus.max} left)`}
                      </span>
                    </button>
                  </div>

                  {/* Method 2: Manual Entry & Daily Check-in */}
                  <div
                    style={{
                      background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
                      border: "1.5px solid #bbf7d0",
                      borderRadius: 12,
                      padding: isMobile ? "14px 14px" : "16px 18px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 8,
                              background: "#f0fdf4",
                              color: "#16a34a",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid #bbf7d0",
                            }}
                          >
                            <Sliders size={16} />
                          </div>
                          <span style={{ fontSize: isMobile ? 13.5 : 14.5, fontWeight: 800, color: "#0f172a" }}>
                            Method 2: Manual Subject Entry
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 900,
                            background: "#f0fdf4",
                            color: "#15803d",
                            padding: "2px 8px",
                            borderRadius: 6,
                            border: "1px solid #bbf7d0",
                            letterSpacing: "0.4px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Edit3 size={11} /> MANUAL ENTRY
                        </span>
                      </div>

                      {/* Helper Note Box */}
                      <div
                        style={{
                          background: "#f0fdf4",
                          border: "1px solid #dcfce7",
                          borderRadius: 8,
                          padding: "8px 10px",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 11.5,
                          color: "#166534",
                          fontWeight: 750,
                        }}
                      >
                        <BookOpen size={13} color="#16a34a" style={{ flexShrink: 0 }} />
                        <span>All 7 semester courses are pre-loaded in the editor below.</span>
                      </div>

                      {/* Numbered Steps */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "#475569" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <span style={{ width: 18, height: 18, borderRadius: 999, background: "#f0fdf4", color: "#16a34a", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>1</span>
                          <span>Select each subject pill from the quick subject selector below.</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <span style={{ width: 18, height: 18, borderRadius: 999, background: "#f0fdf4", color: "#16a34a", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>2</span>
                          <span>Enter your current <strong>Attended</strong> and <strong>Conducted</strong> classes for Theory (PP), Lab (PR), and Tutorial (TUT).</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <span style={{ width: 18, height: 18, borderRadius: 999, background: "#f0fdf4", color: "#16a34a", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>3</span>
                          <span>Check the ERP verification box and click <strong>Save to Semester Dashboard</strong>.</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <span style={{ width: 18, height: 18, borderRadius: 999, background: "#f0fdf4", color: "#16a34a", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>4</span>
                          <span>Once saved, use the <strong>Daily Check-In Hub</strong> to mark <strong>Present / Absent</strong> with 1 tap every day!</span>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 4,
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        fontSize: 11.5,
                        color: "#166534",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <CheckCircle2 size={14} color="#16a34a" style={{ flexShrink: 0 }} />
                      <span>Smart Bunk Analyzer & Predictor unlock instantly once saved!</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

              

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
                          data-subject-id={s.subjectName}
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
                const hasCompDelivered = Number(comp.delivered) > 0;
                const compPercent =
                  hasCompDelivered ? ((comp.attended / comp.delivered) * 100).toFixed(1) : "0.0";
                const isPassing = hasCompDelivered ? Number(compPercent) >= 75 : true;

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

            {/* ERP Verification Disclaimer & Checkbox */}
            <div
              style={{
                background: isVerifiedDisclaimerChecked ? "#f0fdf4" : "#fffbeb",
                border: `1.5px solid ${isVerifiedDisclaimerChecked ? "#86efac" : "#fde68a"}`,
                borderRadius: 12,
                padding: "10px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginTop: 4,
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <ShieldCheck
                  size={16}
                  color={isVerifiedDisclaimerChecked ? "#059669" : "#d97706"}
                  style={{ flexShrink: 0, marginTop: 2 }}
                />
                <div style={{ fontSize: 11.5, color: isVerifiedDisclaimerChecked ? "#166534" : "#92400e", lineHeight: 1.45 }}>
                  <strong>ERP Verification Disclaimer:</strong> Please recheck that all Theory (PP), Lab (PR), and Tutorial (TUT) counts match your official ERP portal attendance before saving.
                </div>
              </div>

              <label
                onClick={() => setIsVerifiedDisclaimerChecked(!isVerifiedDisclaimerChecked)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: isVerifiedDisclaimerChecked ? "#15803d" : "#78350f",
                  userSelect: "none",
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    border: `2px solid ${isVerifiedDisclaimerChecked ? "#059669" : "#cbd5e1"}`,
                    background: isVerifiedDisclaimerChecked ? "#059669" : "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                    boxShadow: isVerifiedDisclaimerChecked ? "0 2px 6px rgba(5, 150, 105, 0.35)" : "none",
                  }}
                >
                  {isVerifiedDisclaimerChecked && (
                    <Check size={13} color="#ffffff" strokeWidth={2.5} />
                  )}
                </div>
                <span>I have verified that all component numbers are correct</span>
              </label>
            </div>

            {/* Save to My Subjects Button */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              <button
                type="button"
                onClick={handleSaveActiveSubject}
                disabled={!isVerifiedDisclaimerChecked}
                style={{
                  flex: 1,
                  padding: isMobile ? "10px 14px" : "13px 20px",
                  borderRadius: 12,
                  border: "none",
                  background: isVerifiedDisclaimerChecked ? "linear-gradient(135deg, #059669 0%, #047857 100%)" : "#cbd5e1",
                  color: isVerifiedDisclaimerChecked ? "#ffffff" : "#64748b",
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
                    <strong style={{ color: activeCalculation.simulatedAbsent.projectedPercentage >= 75 ? "#059669" : "#dc2626" }}>
                      {activeCalculation.simulatedAbsent.projectedPercentage}%
                    </strong>{" "}
                    <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 700 }}>
                      ({activeCalculation.simulatedAbsent.delta > 0 ? "+" : ""}{activeCalculation.simulatedAbsent.delta}%)
                    </span>
                  </div>
                  {activeCalculation.simulatedAbsent.isBelow75 && (
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
                      {activeCalculation.simulatedPresent.projectedPercentage}%
                    </strong>{" "}
                    <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>
                      (+{activeCalculation.simulatedPresent.delta}%)
                    </span>
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
              {activeCalculation.classesNeeded > 0 ? (
                dateProjection && !dateProjection.isAttainable ? (
                  <div
                    style={{
                      background: "#fef2f2",
                      border: "1.5px solid #fca5a5",
                      borderRadius: 12,
                      padding: "12px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#991b1b", display: "flex", alignItems: "center", gap: 6 }}>
                      <AlertTriangle size={16} color="#dc2626" />
                      <span>Target {targetGoal}% is Mathematically Unattainable this Semester</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "#7f1d1d", lineHeight: 1.5 }}>
                      Reaching {targetGoal}% requires <strong>{activeCalculation.classesNeeded} classes</strong> without absence, but only <strong>{dateProjection.totalRemainingSemClasses} classes</strong> remain before the Last Date of Instruction ({dateProjection.lastInstructionDateStr}).
                      <br />
                      Max attainable attendance is <strong style={{ color: "#dc2626" }}>{dateProjection.maxAttainablePercentage}%</strong> even if you attend 100% of all remaining classes.
                    </div>

                    {dateProjection.upcomingSessions && dateProjection.upcomingSessions.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#991b1b", marginBottom: 4 }}>
                          Remaining Classes to Maximize Attendance:
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {dateProjection.upcomingSessions.map((ses, sIdx) => (
                            <div
                              key={sIdx}
                              style={{
                                fontSize: 11,
                                background: "#ffffff",
                                padding: "5px 9px",
                                borderRadius: 6,
                                border: "1px solid #fecaca",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                color: "#991b1b",
                                fontWeight: 600,
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span>{ses.dateStr} ({ses.day})</span>
                                <span
                                  style={{
                                    fontSize: 9.5,
                                    fontWeight: 900,
                                    background:
                                      ses.type === "PR"
                                        ? "#faf5ff"
                                        : ses.type === "TUT"
                                        ? "#fffbeb"
                                        : "#eff6ff",
                                    color:
                                      ses.type === "PR"
                                        ? "#7c3aed"
                                        : ses.type === "TUT"
                                        ? "#b45309"
                                        : "#1e40af",
                                    border: `1px solid ${
                                      ses.type === "PR"
                                        ? "#ddd6fe"
                                        : ses.type === "TUT"
                                        ? "#fde68a"
                                        : "#bfdbfe"
                                    }`,
                                    padding: "1px 5px",
                                    borderRadius: 4,
                                  }}
                                >
                                  {ses.type}
                                </span>
                              </div>
                              <span>{ses.timeSlot} &bull; {ses.room}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: 12,
                      padding: "12px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
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
                  </div>
                )
              ) : (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: 12,
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: "#166534" }}>
                    Safe Zone! You can safely miss up to <strong>{activeCalculation.safeBunks} {activeCalculation.safeBunks === 1 ? "class" : "classes"}</strong> and maintain &ge; {targetGoal}%
                  </div>
                  {bunkDateProjection ? (
                    <div style={{ fontSize: 11.5, color: "#15803d", display: "flex", alignItems: "center", gap: 5 }}>
                      <CalendarIcon size={13} />
                      <span>
                        Your {targetGoal}% safe buffer spans through <strong>{bunkDateProjection.estimatedDate}</strong> based on {bunkDateProjection.classesPerWeek} classes/week timetable schedule.
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11.5, color: "#15803d" }}>
                      Current attendance is well above your {targetGoal}% target goal.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Interactive Attendance Target Predictor & Class Calendar */}
        <AttendanceTargetPredictor
          activeCatalogItem={activeCatalogItem}
          activeCalculation={activeCalculation}
          targetGoal={targetGoal}
          setTargetGoal={setTargetGoal}
          componentInputs={componentInputs}
          selectedSection={selectedSection}
          studentData={studentData}
          isMobile={isMobile}
        />
      </motion.div>
    )}

    {/* ═══════════════════════════════════════════════════════════════
        TAB 4: SMART BUNK & WEEKLY SAFE DAYS ANALYZER
    ═══════════════════════════════════════════════════════════════ */}
    {activeTab === "bunk_analyzer" && (
      <motion.div
        key="bunk_analyzer"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        style={{ width: "100%" }}
      >
        <SmartBunkAnalyzer
          selectedSection={selectedSection}
          allSectionSubjects={allSectionSubjects}
          overallCalculation={overallCalculation}
          studentData={studentData}
          todayDayName={todayDayName}
          isMobile={isMobile}
        />
      </motion.div>
    )}
  </AnimatePresence>
</div>

    {/* Floating Scan Limit Warning Toast */}
    {scanLimitWarning && (
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          background: "#fef2f2",
          border: "1px solid #fca5a5",
          borderRadius: 8,
          padding: "12px 16px",
          boxShadow: "0 4px 14px rgba(220, 38, 38, 0.12)",
          maxWidth: 380,
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 12.5, color: "#991b1b", lineHeight: 1.45 }}>
          <strong>Daily Screenshot Limit Reached (2/2)</strong>
          <div style={{ marginTop: 2 }}>
            You have used your 2 screenshot scans for today. The limit will reset tomorrow at midnight (12:00 AM). Please enter or update your attendance manually.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setScanLimitWarning("")}
          style={{
            background: "transparent",
            border: "none",
            color: "#991b1b",
            cursor: "pointer",
            padding: 0,
            marginLeft: "auto",
          }}
        >
          <X size={16} />
        </button>
      </div>
    )}

      {/* AI Screenshot Auto-Importer Modal */}
      <AttendanceScreenshotModal
        isOpen={isScreenshotModalOpen}
        onClose={() => setIsScreenshotModalOpen(false)}
        onApply={handleApplyScreenshotSubjects}
        currentSection={selectedSection}
        studentId={currentRegNo}
        userRole={userRole}
        isAdmin={isAdmin}
        API={API}
      />

      {/* Reset Attendance Data Confirmation Modal */}
      <AnimatePresence>
        {isResetModalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(4px)",
              zIndex: 99999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
            onClick={() => setIsResetModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#ffffff",
                borderRadius: 20,
                padding: "24px 22px",
                maxWidth: 420,
                width: "100%",
                border: "1px solid #e2e8f0",
                boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "#fee2e2",
                    border: "1px solid #fecaca",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <RotateCcw size={22} color="#dc2626" />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.3px" }}>
                    Reset Attendance Data?
                  </h3>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
                    Revert all changes to default section routine
                  </p>
                </div>
              </div>

              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 12,
                  padding: "12px 14px",
                  fontSize: 12.5,
                  color: "#991b1b",
                  lineHeight: 1.45,
                }}
              >
                This will permanently clear all marked daily check-ins, custom subject calculations, and reset to Section <strong>{selectedSection}</strong> default routine values.
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSavedSubjects([]);
                    setAllDailyLogs({});
                    setDailyAttendanceLogs({});
                    if (sectionCatalog.length > 0) {
                      const first = sectionCatalog[0];
                      const detected = first.components || ["PP"];
                      setComponentInputs(detected.map((t) => ({ type: t, attended: 0, delivered: 0 })));
                    } else {
                      setComponentInputs([{ type: "PP", attended: 0, delivered: 0 }]);
                    }
                    localStorage.removeItem("gradeflow_saved_attendance");
                    localStorage.removeItem("gradeflow_daily_attendance_logs");
                    syncAttendanceToDb([], {}, targetGoal);
                    setIsResetModalOpen(false);
                  }}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                    color: "#ffffff",
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(220, 38, 38, 0.3)",
                    transition: "all 0.15s ease",
                  }}
                >
                  Yes, Reset All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
