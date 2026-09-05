import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar as CalendarIcon,
  CalendarCheck,
  Info,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Zap,
  Check,
  X,
  BookOpen,
  Layers,
  ArrowRight,
  Sun,
  Target,
  Award,
  Sliders,
  RotateCcw,
  Building,
  GraduationCap,
  Lock,
  Filter,
} from "lucide-react";
import {
  getSectionScheduleForDate,
  getDateInstructionalContext,
  resolveSubjectCode,
  cleanSubjectBaseName,
  TIME_SLOTS,
  CUTM_SESSION_BOUNDARIES,
} from "../utils/timetableHelper";

// Helper: Format Date to YYYY-MM-DD
function toDateKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Helper: Friendly formatted date string (e.g. "Thu, 10 Sept")
function formatFriendlyDate(date, options = { weekday: "short", day: "numeric", month: "short" }) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date + "T00:00:00") : new Date(date);
  return d.toLocaleDateString("en-IN", options);
}

export default function FuturePredictor({
  selectedSection = "CSE-A",
  allSectionSubjects = [],
  overallCalculation = {},
  studentData = null,
  todayDayName = "Monday",
  isMobile = false,
  allDailyLogs = {},
}) {
  // ── Dynamic Responsive Detection ──────────────────────────────────────────
  const [internalIsMobile, setInternalIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const handleResize = () => {
      setInternalIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const effectiveIsMobile = isMobile || internalIsMobile;

  // ── Baseline Attendance ──────────────────────────────────────────────────
  const currentOverallAtt = overallCalculation.totalAttended || 0;
  const currentOverallDel = overallCalculation.totalDelivered || 0;
  const currentOverallPct =
    currentOverallDel > 0
      ? Number(((currentOverallAtt / currentOverallDel) * 100).toFixed(2))
      : (overallCalculation.percentage || 100);

  // Reference Today (Normalized to Midnight)
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayKey = useMemo(() => toDateKey(today), [today]);

  // Today's Daily Check-in Status (From Mongo / Tracker State)
  const todayLogs = useMemo(() => allDailyLogs[todayKey] || {}, [allDailyLogs, todayKey]);
  const todaySchedCtx = useMemo(() => getSectionScheduleForDate(selectedSection, today), [selectedSection, today]);
  const todayClassesList = todaySchedCtx.classes || [];

  const todayMarkedClasses = useMemo(() => {
    return todayClassesList.filter((cls) => Boolean(todayLogs[cls.slotIndex]));
  }, [todayClassesList, todayLogs]);

  const todayUnmarkedClasses = useMemo(() => {
    return todayClassesList.filter((cls) => !todayLogs[cls.slotIndex]);
  }, [todayClassesList, todayLogs]);

  const todayPresentCount = useMemo(() => {
    return todayClassesList.filter((cls) => todayLogs[cls.slotIndex] === "present").length;
  }, [todayClassesList, todayLogs]);

  const todayAbsentCount = useMemo(() => {
    return todayClassesList.filter((cls) => todayLogs[cls.slotIndex] === "absent").length;
  }, [todayClassesList, todayLogs]);

  // ── State Management ─────────────────────────────────────────────────────
  // Week navigation offset (0 = current week, 1 = next week, etc.)
  const [weekOffset, setWeekOffset] = useState(0);

  // Selected Bunk Dates (Array of 'YYYY-MM-DD' strings)
  const [selectedBunkKeys, setSelectedBunkKeys] = useState([]);

  // Non-instructional date notice
  const [nonInstructionalNotice, setNonInstructionalNotice] = useState(null);

  // Recovery Target Percentage (default 75%, can be 80%, 85%, 90%)
  const [recoveryTargetPct, setRecoveryTargetPct] = useState(75);

  // Phase 1 Detail Toggle: Summary vs Day-by-Day Detailed Schedule
  const [preBunkViewMode, setPreBunkViewMode] = useState("detailed"); // "detailed" | "summary"

  // Phase 3 Subject Filter for recovery schedule
  const [recoverySubjectFilter, setRecoverySubjectFilter] = useState("ALL");
  const [showAllRecoveryDates, setShowAllRecoveryDates] = useState(false);
  const [expandedSubjects, setExpandedSubjects] = useState({});

  useEffect(() => {
    setRecoverySubjectFilter("ALL");
  }, [selectedBunkKeys]);

  const toggleSubjectExpand = (subName) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subName]: !prev[subName],
    }));
  };

  // ── Week Window Generator (Mon to Sat for the active weekOffset) ─────────
  const activeWeekDays = useMemo(() => {
    const startOfWeek = new Date(today);
    const currentDay = today.getDay(); // 0: Sun, 1: Mon
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    startOfWeek.setDate(today.getDate() + diffToMonday + weekOffset * 7);

    const days = [];
    for (let i = 0; i < 6; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      const dateKey = toDateKey(dayDate);

      // Query Single Master Routine Engine
      const schedCtx = getSectionScheduleForDate(selectedSection, dayDate);
      const isPast = dateKey < todayKey;
      const isToday = dateKey === todayKey;

      days.push({
        date: dayDate,
        dateKey,
        dayName: schedCtx.dayName,
        dateFormatted: formatFriendlyDate(dayDate),
        isPast,
        isToday,
        schedCtx,
        isInstructional: schedCtx.isInstructional,
        isHoliday: schedCtx.isOfficialHoliday,
        isSunday: schedCtx.isSunday,
        isExam: schedCtx.isExam,
        isOptionalHoliday: schedCtx.isOptionalHoliday,
        holidayTitle: schedCtx.title,
        classes: schedCtx.classes || [],
        totalClasses: (schedCtx.classes || []).length,
      });
    }
    return days;
  }, [today, todayKey, weekOffset, selectedSection]);

  const weekInstructionalCount = useMemo(() => {
    return activeWeekDays.reduce((acc, d) => acc + d.totalClasses, 0);
  }, [activeWeekDays]);

  const weekRangeTitle = useMemo(() => {
    if (activeWeekDays.length === 0) return "";
    return `${activeWeekDays[0].dateFormatted} – ${activeWeekDays[activeWeekDays.length - 1].dateFormatted}`;
  }, [activeWeekDays]);

  const nextInstructionalDateInfo = useMemo(() => {
    if (activeWeekDays.length === 0) return null;
    const lastDayInCurrentWeek = activeWeekDays[activeWeekDays.length - 1].date;
    const scan = new Date(lastDayInCurrentWeek);
    scan.setDate(scan.getDate() + 1);
    let guard = 0;
    while (guard < 60) {
      const sched = getSectionScheduleForDate(selectedSection, scan);
      if (sched.isInstructional && sched.classes && sched.classes.length > 0) {
        return {
          date: new Date(scan),
          dateFormatted: formatFriendlyDate(scan, { day: "numeric", month: "short" }),
          fullFormatted: formatFriendlyDate(scan, { weekday: "short", day: "numeric", month: "short" }),
        };
      }
      scan.setDate(scan.getDate() + 1);
      guard++;
    }
    return null;
  }, [activeWeekDays, selectedSection]);

  // ── Bunk Date Selection Handler ──────────────────────────────────────────
  const toggleBunkDate = (dayItem) => {
    // Past dates cannot be bunked because classes are already completed
    if (dayItem.isPast) {
      setNonInstructionalNotice({
        dateFormatted: dayItem.dateFormatted,
        dayName: dayItem.dayName,
        title: "Past Date (Already Completed)",
        message: `${dayItem.dateFormatted} has already passed. Routine classes on this date are already completed and logged. Future Predictor only plans bunks for today and upcoming dates.`,
      });
      return;
    }

    if (!dayItem.isInstructional) {
      const reasonTitle = dayItem.isExam
        ? (dayItem.schedCtx.calendarStatus?.title || "Mid Semester Examination")
        : dayItem.isHoliday
        ? (dayItem.holidayTitle || "University Holiday")
        : "Weekend (Closed)";

      setNonInstructionalNotice({
        dateFormatted: dayItem.dateFormatted,
        dayName: dayItem.dayName,
        title: reasonTitle,
        isExam: dayItem.isExam,
        isHoliday: dayItem.isHoliday,
        isSunday: dayItem.isSunday,
        message: dayItem.isExam
          ? `Examinations are scheduled on ${dayItem.dateFormatted} (${reasonTitle}). Regular timetable classes are suspended, so routine attendance cannot be bunked.`
          : dayItem.isHoliday
          ? `University is closed on ${dayItem.dateFormatted} for ${reasonTitle}. No routine classes are conducted.`
          : `University is closed on Sundays. No classes are scheduled.`,
      });
      return;
    }

    // Special check for TODAY: If all classes today have already been marked
    if (dayItem.isToday && todayClassesList.length > 0 && todayUnmarkedClasses.length === 0) {
      setNonInstructionalNotice({
        dateFormatted: dayItem.dateFormatted,
        dayName: dayItem.dayName,
        title: "All Classes Marked Today",
        message: `All ${todayClassesList.length} scheduled classes for today have already been marked in your Daily Hub (${todayPresentCount} present, ${todayAbsentCount} absent). There are no remaining unmarked classes to bunk today.`,
      });
      return;
    }

    setNonInstructionalNotice(null);
    setSelectedBunkKeys((prev) =>
      prev.includes(dayItem.dateKey)
        ? prev.filter((k) => k !== dayItem.dateKey)
        : [...prev, dayItem.dateKey]
    );
  };

  // ── Quick Presets Handlers ───────────────────────────────────────────────
  const applyPresetTomorrow = () => {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowKey = toDateKey(tomorrow);
    const sched = getSectionScheduleForDate(selectedSection, tomorrow);
    if (!sched.isInstructional) {
      setNonInstructionalNotice({
        dateFormatted: formatFriendlyDate(tomorrow),
        dayName: sched.dayName,
        title: sched.title,
        message: `Tomorrow (${formatFriendlyDate(tomorrow)}) has no regular classes (${sched.title}). Jump to an instructional week to plan a bunk.`,
      });
      return;
    }
    setNonInstructionalNotice(null);
    setSelectedBunkKeys([tomorrowKey]);
  };

  const applyPresetWeekend = () => {
    const instructionalKeys = activeWeekDays
      .filter((d) => (d.dayName === "Friday" || d.dayName === "Saturday") && d.isInstructional && !d.isPast)
      .map((d) => d.dateKey);

    if (instructionalKeys.length === 0) {
      setNonInstructionalNotice({
        title: "No Available Weekend Classes",
        message: "Friday and Saturday in this week have either already passed or have examinations/holidays. Use 'Next Week >' to plan for upcoming weekend classes.",
      });
      return;
    }
    setNonInstructionalNotice(null);
    setSelectedBunkKeys(instructionalKeys);
  };

  const applyPreset3Day = () => {
    const instructionalKeys = activeWeekDays
      .filter((d) => (d.dayName === "Thursday" || d.dayName === "Friday" || d.dayName === "Saturday") && d.isInstructional && !d.isPast)
      .map((d) => d.dateKey);

    if (instructionalKeys.length === 0) {
      setNonInstructionalNotice({
        title: "No Available Thu-Sat Classes",
        message: "Thursday through Saturday in this week have either already passed or have examinations/holidays. Use 'Next Week >' to select upcoming days.",
      });
      return;
    }
    setNonInstructionalNotice(null);
    setSelectedBunkKeys(instructionalKeys);
  };

  const applyPresetFullWeek = () => {
    const instructionalKeys = activeWeekDays
      .filter((d) => d.isInstructional && !d.isPast)
      .map((d) => d.dateKey);
    if (instructionalKeys.length === 0) {
      setNonInstructionalNotice({
        title: "No Upcoming Classes This Week",
        message: "All remaining class days in this week have already passed or have examinations/holidays. Tap 'Next Week >' to view and plan for upcoming weeks.",
      });
      return;
    }
    setNonInstructionalNotice(null);
    setSelectedBunkKeys(instructionalKeys);
  };

  // ── Sorted Selected Bunk Dates (Guaranteed Today & Future Only) ───────────
  const sortedBunkDates = useMemo(() => {
    if (selectedBunkKeys.length === 0) return [];
    return [...selectedBunkKeys]
      .filter((k) => k >= todayKey)
      .sort()
      .map((k) => new Date(k + "T00:00:00"));
  }, [selectedBunkKeys, todayKey]);

  const firstBunkDate = sortedBunkDates[0] || null;
  const lastBunkDate = sortedBunkDates[sortedBunkDates.length - 1] || null;

  // ═══════════════════════════════════════════════════════════════════════════
  // 3-PHASE MASTER FUTURE PREDICTOR SIMULATION ENGINE
  // ═══════════════════════════════════════════════════════════════════════════
  const simulation = useMemo(() => {
    if (sortedBunkDates.length === 0) return null;

    // Subject data map
    const subjectMap = new Map();
    allSectionSubjects.forEach((sub) => {
      const totAtt = (sub.components || []).reduce((acc, c) => acc + (Number(c.attended) || 0), 0);
      const totDel = (sub.components || []).reduce((acc, c) => acc + (Number(c.delivered) || 0), 0);
      subjectMap.set(sub.subjectName, {
        ...sub,
        currentAttended: totAtt,
        currentDelivered: totDel,
        currentPct: totDel > 0 ? (totAtt / totDel) * 100 : 100,
        preBunkAttended: totAtt,
        preBunkDelivered: totDel,
        preBunkClassesAdded: 0,
        bunkMissedCount: 0,
        postBunkAttended: totAtt,
        postBunkDelivered: totDel,
        missedDates: [],
        missedPeriodsDetail: [],
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 1: PRE-BUNK ACCUMULATION (Today <= d < firstBunkDate)
    // ─────────────────────────────────────────────────────────────────────────
    let preBunkTotalClasses = 0;
    const preBunkDays = [];
    let runningAccumAtt = currentOverallAtt;
    let runningAccumDel = currentOverallDel;

    if (firstBunkDate > today) {
      const scanDate = new Date(today);
      while (scanDate < firstBunkDate) {
        const dKey = toDateKey(scanDate);
        const sched = getSectionScheduleForDate(selectedSection, scanDate);
        const isScanDateToday = dKey === todayKey;

        if (sched.isInstructional && sched.classes && sched.classes.length > 0) {
          const dayClassesWithImpact = [];

          sched.classes.forEach((cls) => {
            const cleanName = cls.cleanName || cleanSubjectBaseName(cls.subject);
            const subData = subjectMap.get(cleanName);

            const isAlreadyMarkedToday = isScanDateToday && Boolean(todayLogs[cls.slotIndex]);
            const markedStatusToday = isAlreadyMarkedToday ? todayLogs[cls.slotIndex] : null;

            const prevSubAtt = subData ? subData.preBunkAttended : 0;
            const prevSubDel = subData ? subData.preBunkDelivered : 0;
            const prevSubPct = prevSubDel > 0 ? (prevSubAtt / prevSubDel) * 100 : 100;

            if (!isAlreadyMarkedToday) {
              preBunkTotalClasses++;
              if (subData) {
                subData.preBunkAttended += 1;
                subData.preBunkDelivered += 1;
                subData.preBunkClassesAdded += 1;
              }
              runningAccumAtt += 1;
              runningAccumDel += 1;
            }

            const newSubAtt = subData ? subData.preBunkAttended : 0;
            const newSubDel = subData ? subData.preBunkDelivered : 0;
            const newSubPct = newSubDel > 0 ? (newSubAtt / newSubDel) * 100 : 100;
            const subDelta = isAlreadyMarkedToday ? 0 : Number((newSubPct - prevSubPct).toFixed(2));
            const overallPctAfterClass = Number(((runningAccumAtt / runningAccumDel) * 100).toFixed(2));

            dayClassesWithImpact.push({
              slotIndex: cls.slotIndex,
              timeSlot: cls.slot?.label || (TIME_SLOTS[cls.slotIndex]?.label || `Slot ${cls.slotIndex + 1}`),
              subjectName: cleanName,
              subCode: resolveSubjectCode({ subject: cleanName }, studentData),
              type: cls.type || "PP",
              room: cls.room || "Room TBA",
              faculty: cls.faculty || "Faculty",
              isAlreadyMarkedToday,
              markedStatusToday,
              prevSubPct: Number(prevSubPct.toFixed(1)),
              newSubPct: Number(newSubPct.toFixed(1)),
              subDelta,
              overallPctAfterClass,
            });
          });

          preBunkDays.push({
            date: new Date(scanDate),
            dateKey: dKey,
            dayName: sched.dayName,
            dateFormatted: formatFriendlyDate(scanDate),
            isToday: isScanDateToday,
            classesCount: sched.classes.length,
            classes: dayClassesWithImpact,
            dayEndOverallPct: Number(((runningAccumAtt / runningAccumDel) * 100).toFixed(2)),
          });
        }
        scanDate.setDate(scanDate.getDate() + 1);
      }
    }

    const preBunkOverallAtt = currentOverallAtt + preBunkTotalClasses;
    const preBunkOverallDel = currentOverallDel + preBunkTotalClasses;
    const preBunkOverallPct =
      preBunkOverallDel > 0
        ? Number(((preBunkOverallAtt / preBunkOverallDel) * 100).toFixed(2))
        : currentOverallPct;
    const preBunkGainDelta = Number((preBunkOverallPct - currentOverallPct).toFixed(2));

    subjectMap.forEach((sub) => {
      sub.preBunkPct =
        sub.preBunkDelivered > 0
          ? Number(((sub.preBunkAttended / sub.preBunkDelivered) * 100).toFixed(2))
          : sub.currentPct;
      sub.preBunkGain = Number((sub.preBunkPct - sub.currentPct).toFixed(2));
      sub.postBunkAttended = sub.preBunkAttended;
      sub.postBunkDelivered = sub.preBunkDelivered;
    });

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 2: BUNK DROP & INTERLEAVED ATTENDANCE SIMULATION
    // Chronologically simulates every day from firstBunkDate to lastBunkDate
    // ─────────────────────────────────────────────────────────────────────────
    const bunkDaysBreakdown = [];
    let cumulativeMissedClasses = 0;
    let cumulativeInterveningAttendedClasses = 0;
    let interveningAttendedDaysCount = 0;
    let bunkDaysCount = 0;

    let runningOverallDelivered = preBunkOverallDel;
    let runningOverallAttended = preBunkOverallAtt;

    // Track sequential simulation running counts per subject across the entire window
    subjectMap.forEach((sub) => {
      sub.simRunningAtt = sub.preBunkAttended;
      sub.simRunningDel = sub.preBunkDelivered;
      sub.interveningAttendedCount = 0;
    });

    const selectedBunkKeySet = new Set(sortedBunkDates.map((d) => toDateKey(d)));
    const simDate = new Date(firstBunkDate);
    let stepNumber = 0;

    while (simDate <= lastBunkDate) {
      stepNumber++;
      const dKey = toDateKey(simDate);
      const isDateBunk = selectedBunkKeySet.has(dKey);
      const isDateToday = dKey === todayKey;
      const sched = getSectionScheduleForDate(selectedSection, simDate);
      const scheduledClasses = sched.isInstructional ? sched.classes || [] : [];
      const dateFormatted = formatFriendlyDate(simDate);

      // Snapshot subject attendance at the start of this specific day
      const dayStartSubjectMap = new Map();
      subjectMap.forEach((sub, name) => {
        const sAtt = sub.simRunningAtt;
        const sDel = sub.simRunningDel;
        const sPct = sDel > 0 ? Number(((sAtt / sDel) * 100).toFixed(2)) : sub.preBunkPct;
        dayStartSubjectMap.set(name, { startAtt: sAtt, startDel: sDel, startPct: sPct });
      });

      const dayStartOverallPct =
        runningOverallDelivered > 0
          ? Number(((runningOverallAttended / runningOverallDelivered) * 100).toFixed(2))
          : preBunkOverallPct;

      if (isDateBunk) {
        // ── CASE A: PLANNED BUNK DAY ──
        bunkDaysCount++;
        const classesToBunk = isDateToday
          ? scheduledClasses.filter((cls) => !todayLogs[cls.slotIndex])
          : scheduledClasses;

        const alreadyMarkedToday = isDateToday
          ? scheduledClasses.filter((cls) => Boolean(todayLogs[cls.slotIndex]))
          : [];

        const dayMissedCount = classesToBunk.length;
        cumulativeMissedClasses += dayMissedCount;
        runningOverallDelivered += dayMissedCount;

        const dayPostPct =
          runningOverallDelivered > 0
            ? Number(((runningOverallAttended / runningOverallDelivered) * 100).toFixed(2))
            : preBunkOverallPct;

        const daySubjectsMap = new Map();

        const classesDetail = scheduledClasses.map((cls) => {
          const cleanName = cls.cleanName || cleanSubjectBaseName(cls.subject);
          const subData = subjectMap.get(cleanName);
          const isClassMarked = isDateToday && Boolean(todayLogs[cls.slotIndex]);
          const classMarkStatus = isClassMarked ? todayLogs[cls.slotIndex] : null;
          const timeSlotLabel = cls.slot?.label || (TIME_SLOTS[cls.slotIndex]?.label || `Slot ${cls.slotIndex + 1}`);

          if (!daySubjectsMap.has(cleanName)) {
            daySubjectsMap.set(cleanName, {
              subjectName: cleanName,
              subCode: resolveSubjectCode({ subject: cleanName }, studentData),
              type: cls.type || "PP",
              room: cls.room || "Room TBA",
              faculty: cls.faculty || "Faculty",
              missedSlots: [],
              alreadyMarkedSlots: [],
              missedCount: 0,
            });
          }

          const group = daySubjectsMap.get(cleanName);

          if (!isClassMarked) {
            group.missedCount += 1;
            group.missedSlots.push({
              slotIndex: cls.slotIndex,
              timeSlot: timeSlotLabel,
              room: cls.room || "Room TBA",
              type: cls.type || "PP",
            });

            if (subData) {
              subData.bunkMissedCount += 1;
              subData.simRunningDel += 1; // Delivered increases on this day (missed)
              if (!subData.missedDates.includes(dateFormatted)) {
                subData.missedDates.push(dateFormatted);
              }
              subData.missedPeriodsDetail.push({
                dateFormatted,
                dayName: sched.dayName,
                slotIndex: cls.slotIndex,
                timeSlot: timeSlotLabel,
                type: cls.type || "PP",
                room: cls.room || "Room TBA",
              });
            }
          } else {
            group.alreadyMarkedSlots.push({
              slotIndex: cls.slotIndex,
              timeSlot: timeSlotLabel,
              room: cls.room || "Room TBA",
              markStatus: classMarkStatus,
            });
          }

          return {
            slotIndex: cls.slotIndex,
            timeSlot: timeSlotLabel,
            subjectName: cleanName,
            subCode: resolveSubjectCode({ subject: cleanName }, studentData),
            type: cls.type || "PP",
            room: cls.room || "Room TBA",
            faculty: cls.faculty || "Faculty",
            isAlreadyMarked: isClassMarked,
            markStatus: classMarkStatus,
          };
        });

        // Compute exact percentage drop for each subject on this day
        const targetPct = Number(recoveryTargetPct) || 75;
        const daySubjectsImpactList = [];
        daySubjectsMap.forEach((grp) => {
          const subData = subjectMap.get(grp.subjectName);
          const startStats = dayStartSubjectMap.get(grp.subjectName) || { startPct: 100, startAtt: 0, startDel: 0 };
          const endAtt = subData ? subData.simRunningAtt : startStats.startAtt;
          const endDel = subData ? subData.simRunningDel : startStats.startDel;
          const endPct = endDel > 0 ? Number(((endAtt / endDel) * 100).toFixed(2)) : startStats.startPct;
          const dayDropDelta = Number((endPct - startStats.startPct).toFixed(2));
          const breachedCutoffToday = startStats.startPct >= targetPct && endPct < targetPct;
          const isSafeAfterDay = endPct >= targetPct;

          daySubjectsImpactList.push({
            ...grp,
            startPct: startStats.startPct,
            endPct,
            dayDropDelta,
            dayDelta: dayDropDelta,
            breachedCutoffToday,
            isSafeAfterDay,
          });
        });

        bunkDaysBreakdown.push({
          stepIndex: stepNumber,
          isBunkDay: true,
          isAttendedDay: false,
          isNonInstructional: false,
          date: new Date(simDate),
          dateKey: dKey,
          isToday: isDateToday,
          dayName: sched.dayName,
          dateFormatted,
          isInstructional: sched.isInstructional,
          isHoliday: sched.isOfficialHoliday,
          holidayTitle: sched.title,
          isExam: sched.isExam,
          totalClassesScheduled: scheduledClasses.length,
          classesMissedCount: dayMissedCount,
          alreadyMarkedCount: alreadyMarkedToday.length,
          classes: classesDetail,
          daySubjectsImpactList,
          cumulativeMissedSoFar: cumulativeMissedClasses,
          startOfDayOverallPct: dayStartOverallPct,
          endOfDayOverallPct: dayPostPct,
          dayDelta: Number((dayPostPct - dayStartOverallPct).toFixed(2)),
        });
      } else if (sched.isInstructional && scheduledClasses.length > 0) {
        // ── CASE B: IN-BETWEEN ATTENDED CLASS DAY ──
        interveningAttendedDaysCount++;
        const daySubjectsGainMap = new Map();
        let dayAttendedCount = 0;

        const classesDetail = scheduledClasses.map((cls) => {
          const cleanName = cls.cleanName || cleanSubjectBaseName(cls.subject);
          const subData = subjectMap.get(cleanName);
          const isClassMarked = isDateToday && Boolean(todayLogs[cls.slotIndex]);
          const classMarkStatus = isClassMarked ? todayLogs[cls.slotIndex] : null;
          const timeSlotLabel = cls.slot?.label || (TIME_SLOTS[cls.slotIndex]?.label || `Slot ${cls.slotIndex + 1}`);

          if (!daySubjectsGainMap.has(cleanName)) {
            daySubjectsGainMap.set(cleanName, {
              subjectName: cleanName,
              subCode: resolveSubjectCode({ subject: cleanName }, studentData),
              type: cls.type || "PP",
              room: cls.room || "Room TBA",
              faculty: cls.faculty || "Faculty",
              attendedSlots: [],
              attendedCount: 0,
            });
          }

          const group = daySubjectsGainMap.get(cleanName);
          const willAttend = !isClassMarked || String(classMarkStatus).toLowerCase() === "present";

          if (willAttend) {
            dayAttendedCount += 1;
            runningOverallAttended += 1;
            runningOverallDelivered += 1;
            cumulativeInterveningAttendedClasses += 1;

            if (subData) {
              subData.simRunningAtt += 1;
              subData.simRunningDel += 1;
              subData.interveningAttendedCount += 1;
            }

            group.attendedCount += 1;
            group.attendedSlots.push({
              slotIndex: cls.slotIndex,
              timeSlot: timeSlotLabel,
              room: cls.room || "Room TBA",
              type: cls.type || "PP",
              faculty: cls.faculty || "Faculty",
            });
          } else {
            // Marked absent earlier today on an attended day
            runningOverallDelivered += 1;
            if (subData) {
              subData.simRunningDel += 1;
            }
          }

          return {
            slotIndex: cls.slotIndex,
            timeSlot: timeSlotLabel,
            subjectName: cleanName,
            subCode: resolveSubjectCode({ subject: cleanName }, studentData),
            type: cls.type || "PP",
            room: cls.room || "Room TBA",
            faculty: cls.faculty || "Faculty",
            isAlreadyMarked: isClassMarked,
            markStatus: classMarkStatus,
          };
        });

        const dayPostPct =
          runningOverallDelivered > 0
            ? Number(((runningOverallAttended / runningOverallDelivered) * 100).toFixed(2))
            : preBunkOverallPct;

        const targetPct = Number(recoveryTargetPct) || 75;
        const daySubjectsGainList = [];
        daySubjectsGainMap.forEach((grp) => {
          const subData = subjectMap.get(grp.subjectName);
          const startStats = dayStartSubjectMap.get(grp.subjectName) || { startPct: 100, startAtt: 0, startDel: 0 };
          const endAtt = subData ? subData.simRunningAtt : startStats.startAtt;
          const endDel = subData ? subData.simRunningDel : startStats.startDel;
          const endPct = endDel > 0 ? Number(((endAtt / endDel) * 100).toFixed(2)) : startStats.startPct;
          const dayGainDelta = Number((endPct - startStats.startPct).toFixed(2));
          const isSafeAfterDay = endPct >= targetPct;

          daySubjectsGainList.push({
            ...grp,
            startPct: startStats.startPct,
            endPct,
            dayGainDelta,
            isSafeAfterDay,
          });
        });

        bunkDaysBreakdown.push({
          stepIndex: stepNumber,
          isBunkDay: false,
          isAttendedDay: true,
          isNonInstructional: false,
          date: new Date(simDate),
          dateKey: dKey,
          isToday: isDateToday,
          dayName: sched.dayName,
          dateFormatted,
          isInstructional: true,
          isHoliday: false,
          totalClassesScheduled: scheduledClasses.length,
          classesAttendedCount: dayAttendedCount,
          classes: classesDetail,
          daySubjectsGainList,
          startOfDayOverallPct: dayStartOverallPct,
          endOfDayOverallPct: dayPostPct,
          dayDelta: Number((dayPostPct - dayStartOverallPct).toFixed(2)),
        });
      } else {
        // ── CASE C: IN-BETWEEN NON-INSTRUCTIONAL / HOLIDAY / SUNDAY ──
        bunkDaysBreakdown.push({
          stepIndex: stepNumber,
          isBunkDay: false,
          isAttendedDay: false,
          isNonInstructional: true,
          date: new Date(simDate),
          dateKey: dKey,
          isToday: isDateToday,
          dayName: sched.dayName,
          dateFormatted,
          isInstructional: false,
          isHoliday: sched.isOfficialHoliday,
          holidayTitle: sched.title || (sched.dayName === "Sunday" ? "Sunday (Weekend)" : "Non-Instructional Day"),
          totalClassesScheduled: 0,
          classes: [],
          startOfDayOverallPct: dayStartOverallPct,
          endOfDayOverallPct: dayStartOverallPct,
          dayDelta: 0,
        });
      }

      // Move to next calendar day in window
      simDate.setDate(simDate.getDate() + 1);
    }

    const postBunkOverallAtt = runningOverallAttended;
    const postBunkOverallDel = runningOverallDelivered;
    const postBunkOverallPct =
      postBunkOverallDel > 0
        ? Number(((postBunkOverallAtt / postBunkOverallDel) * 100).toFixed(2))
        : preBunkOverallPct;
    const totalBunkDropDelta = Number((postBunkOverallPct - preBunkOverallPct).toFixed(2));
    const netChangeFromCurrent = Number((postBunkOverallPct - currentOverallPct).toFixed(2));

    const targetPct = Number(recoveryTargetPct) || 75;

    // ─────────────────────────────────────────────────────────────────────────
    // SCAN REMAINING SEMESTER CLASSES (From day after lastBunkDate to Oct 31, 2026)
    // ─────────────────────────────────────────────────────────────────────────
    const lastSessionDate = new Date(CUTM_SESSION_BOUNDARIES?.lastDateOfInstruction || "2026-10-31T23:59:59");
    const upcomingSemesterClassesMap = new Map();
    allSectionSubjects.forEach((sub) => {
      upcomingSemesterClassesMap.set(sub.subjectName, []);
    });

    let totalUpcomingOverallClasses = 0;
    const semesterScanDate = new Date(lastBunkDate);
    let semesterScanGuard = 0;

    while (semesterScanDate < lastSessionDate && semesterScanGuard < 90) {
      semesterScanDate.setDate(semesterScanDate.getDate() + 1);
      semesterScanGuard++;
      if (semesterScanDate > lastSessionDate) break;

      const sched = getSectionScheduleForDate(selectedSection, semesterScanDate);
      if (sched.isInstructional && sched.classes && sched.classes.length > 0) {
        for (const cls of sched.classes) {
          const cleanName = cls.cleanName || cleanSubjectBaseName(cls.subject);
          totalUpcomingOverallClasses++;
          if (!upcomingSemesterClassesMap.has(cleanName)) {
            upcomingSemesterClassesMap.set(cleanName, []);
          }
          upcomingSemesterClassesMap.get(cleanName).push({
            date: new Date(semesterScanDate),
            dateStr: formatFriendlyDate(semesterScanDate),
            dayName: sched.dayName,
            slotIndex: cls.slotIndex,
            timeSlot: cls.slot?.label || (TIME_SLOTS[cls.slotIndex]?.label || `Slot ${cls.slotIndex + 1}`),
            type: cls.type || "PP",
            room: cls.room || `CSE-F-AR-${310 + ((cls.slotIndex || 0) % 8)}`,
            faculty: cls.faculty || "Faculty",
            cleanName,
          });
        }
      }
    }

    const affectedSubjectsList = [];
    const missedOnlySubjectsList = [];

    subjectMap.forEach((sub) => {
      if (sub.bunkMissedCount > 0 || sub.preBunkClassesAdded > 0 || (sub.interveningAttendedCount || 0) > 0) {
        sub.postBunkAttended = sub.simRunningAtt;
        sub.postBunkDelivered = sub.simRunningDel;
        sub.postBunkPct =
          sub.postBunkDelivered > 0
            ? Number(((sub.postBunkAttended / sub.postBunkDelivered) * 100).toFixed(2))
            : sub.preBunkPct;
        sub.bunkDropDelta = Number((sub.postBunkPct - sub.preBunkPct).toFixed(2));
        sub.netChange = Number((sub.postBunkPct - sub.currentPct).toFixed(2));

        // Feasibility check against remaining semester classes
        const upcomingForSub = upcomingSemesterClassesMap.get(sub.subjectName) || [];
        const totalRemainingInSemester = upcomingForSub.length;
        const maxPossibleAttended = sub.postBunkAttended + totalRemainingInSemester;
        const maxPossibleDelivered = sub.postBunkDelivered + totalRemainingInSemester;
        const maxPossiblePct =
          maxPossibleDelivered > 0
            ? Number(((maxPossibleAttended / maxPossibleDelivered) * 100).toFixed(2))
            : sub.postBunkPct;

        sub.totalRemainingInSemester = totalRemainingInSemester;
        sub.maxPossibleAttended = maxPossibleAttended;
        sub.maxPossibleDelivered = maxPossibleDelivered;
        sub.maxPossiblePct = maxPossiblePct;

        if (sub.postBunkPct >= targetPct) {
          sub.isSafeAtTarget = true;
          sub.isTargetImpossible = false;
          sub.classesToTarget = 0;
        } else {
          sub.isSafeAtTarget = false;
          if (maxPossiblePct < targetPct) {
            // Target is mathematically impossible this semester even with 100% future attendance!
            sub.isTargetImpossible = true;
            const num = (targetPct / 100) * sub.postBunkDelivered - sub.postBunkAttended;
            const den = 1 - targetPct / 100;
            sub.theoreticalClassesNeeded = den > 0 ? Math.max(1, Math.ceil(num / den)) : 999;
            sub.classesToTarget = totalRemainingInSemester; // Show up to maximum possible classes
          } else {
            sub.isTargetImpossible = false;
            const num = (targetPct / 100) * sub.postBunkDelivered - sub.postBunkAttended;
            const den = 1 - targetPct / 100;
            sub.classesToTarget = Math.max(1, Math.ceil(num / den));
          }
        }

        sub.code = resolveSubjectCode({ subject: sub.subjectName }, studentData);

        affectedSubjectsList.push(sub);
        if (sub.bunkMissedCount > 0) {
          missedOnlySubjectsList.push(sub);
        }
      }
    });

    // Overall attendance feasibility check
    const maxPossibleOverallAttended = postBunkOverallAtt + totalUpcomingOverallClasses;
    const maxPossibleOverallDelivered = postBunkOverallDel + totalUpcomingOverallClasses;
    const maxPossibleOverallPct =
      maxPossibleOverallDelivered > 0
        ? Number(((maxPossibleOverallAttended / maxPossibleOverallDelivered) * 100).toFixed(2))
        : postBunkOverallPct;
    const isOverallTargetImpossible = postBunkOverallPct < targetPct && maxPossibleOverallPct < targetPct;

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 3: TIMETABLE RECOVERY ENGINE FOR MISSED SUBJECTS
    // Builds exact recovery roadmap up to target (or up to max possible peak)
    // ─────────────────────────────────────────────────────────────────────────
    const subjectRecoverySessionsMap = new Map();
    missedOnlySubjectsList.forEach((sub) => {
      subjectRecoverySessionsMap.set(sub.subjectName, []);
    });

    missedOnlySubjectsList.forEach((sub) => {
      // 1. If subject is ALREADY safe at or above targetPct:
      // It does NOT need recovery classes! Its attendance remains >= targetPct.
      if (sub.isSafeAtTarget) {
        sub.milestoneDateStr = null;
        sub.milestoneTimeSlot = null;
        sub.classesToTarget = 0;
        sub.recoverySessionsList = [];
        subjectRecoverySessionsMap.set(sub.subjectName, []);
        return;
      }

      // 2. Otherwise, subject dropped below target and NEEDS recovery:
      const rawUpcoming = upcomingSemesterClassesMap.get(sub.subjectName) || [];
      const upcoming = [...rawUpcoming];
      // Sort strictly in chronological order by date and period slot index
      upcoming.sort((a, b) => {
        const dateDiff = a.date.getTime() - b.date.getTime();
        if (dateDiff !== 0) return dateDiff;
        return (a.slotIndex ?? 0) - (b.slotIndex ?? 0);
      });

      let runningAtt = sub.postBunkAttended;
      let runningDel = sub.postBunkDelivered;
      let milestoneFound = false;
      let milestoneDateStr = null;
      let milestoneTimeSlot = null;

      // Determine how many classes to display:
      // - If impossible: display ALL remaining classes in semester
      // - If achievable: display up to classesToTarget + 2 buffer sessions
      let sessionLimit = upcoming.length;
      if (!sub.isTargetImpossible) {
        sessionLimit = Math.min(upcoming.length, sub.classesToTarget + 2);
      }

      const subSessions = [];

      for (let i = 0; i < sessionLimit; i++) {
        const cls = upcoming[i];
        runningAtt += 1;
        runningDel += 1;
        const runningPercentage = Number(((runningAtt / runningDel) * 100).toFixed(2));

        const isTargetRestored = runningPercentage >= targetPct;
        const isMilestone = !milestoneFound && isTargetRestored;
        if (isMilestone) {
          milestoneFound = true;
          milestoneDateStr = cls.dateStr;
          milestoneTimeSlot = cls.timeSlot;
        }

        const isLastAvailable = i === upcoming.length - 1;
        const isMaxPeakSession = sub.isTargetImpossible && isLastAvailable;
        const isBufferSession = sub.classesToTarget > 0 && i >= sub.classesToTarget;
        const bufferIndex = isBufferSession ? i - sub.classesToTarget + 1 : null;

        const sessionItem = {
          subjectSessionNumber: i + 1,
          classesNeededTotal: sub.classesToTarget,
          isBufferSession,
          bufferIndex,
          date: cls.date,
          dateStr: cls.dateStr,
          dayName: cls.dayName,
          slotIndex: cls.slotIndex,
          timeSlot: cls.timeSlot,
          subjectName: sub.subjectName,
          subCode: resolveSubjectCode({ subject: sub.subjectName }, studentData),
          room: cls.room,
          faculty: cls.faculty,
          type: cls.type,
          runningAttended: runningAtt,
          runningDelivered: runningDel,
          runningPercentage,
          isMilestoneTarget: isMilestone,
          isMaxPeakSession,
          isTargetImpossible: sub.isTargetImpossible,
          maxPossiblePct: sub.maxPossiblePct,
          missedOnDates: sub.missedDates,
        };

        subSessions.push(sessionItem);
      }

      sub.milestoneDateStr = milestoneDateStr;
      sub.milestoneTimeSlot = milestoneTimeSlot;
      sub.recoverySessionsList = subSessions;
      subjectRecoverySessionsMap.set(sub.subjectName, subSessions);
    });

    // Flatten and sort chronologically across all missed subjects needing recovery
    const masterMissedRecoverySessions = [];
    subjectRecoverySessionsMap.forEach((sessions) => {
      masterMissedRecoverySessions.push(...sessions);
    });
    masterMissedRecoverySessions.sort((a, b) => {
      const dateDiff = a.date.getTime() - b.date.getTime();
      if (dateDiff !== 0) return dateDiff;
      return (a.slotIndex ?? 0) - (b.slotIndex ?? 0);
    });
    masterMissedRecoverySessions.forEach((ses, idx) => {
      ses.sessionNumber = idx + 1;
    });

    // First instructional return date
    const firstReturnDate = new Date(lastBunkDate);
    firstReturnDate.setDate(firstReturnDate.getDate() + 1);
    let returnGuard = 0;
    while (!getSectionScheduleForDate(selectedSection, firstReturnDate).isInstructional && returnGuard < 40) {
      firstReturnDate.setDate(firstReturnDate.getDate() + 1);
      returnGuard++;
    }

    return {
      firstBunkDate,
      lastBunkDate,
      firstBunkDateFormatted: formatFriendlyDate(firstBunkDate),
      lastBunkDateFormatted: formatFriendlyDate(lastBunkDate),
      firstReturnDateFormatted: formatFriendlyDate(firstReturnDate, { weekday: "short", day: "numeric", month: "short" }),
      preBunkTotalClasses,
      preBunkDays,
      preBunkOverallAtt,
      preBunkOverallDel,
      preBunkOverallPct,
      preBunkGainDelta,
      bunkDaysBreakdown,
      cumulativeMissedClasses,
      cumulativeInterveningAttendedClasses,
      interveningAttendedDaysCount,
      bunkDaysCount,
      postBunkOverallAtt,
      postBunkOverallDel,
      postBunkOverallPct,
      totalBunkDropDelta,
      netChangeFromCurrent,
      isOverallSafeAtTarget: postBunkOverallPct >= targetPct,
      isOverallTargetImpossible,
      maxPossibleOverallPct,
      totalUpcomingOverallClasses,
      affectedSubjectsList,
      missedOnlySubjectsList,
      criticalSubjectsList: affectedSubjectsList.filter((s) => !s.isSafeAtTarget),
      impossibleSubjectsList: affectedSubjectsList.filter((s) => s.isTargetImpossible),
      masterMissedRecoverySessions,
      targetPct,
    };
  }, [
    sortedBunkDates,
    firstBunkDate,
    lastBunkDate,
    today,
    todayKey,
    todayLogs,
    currentOverallAtt,
    currentOverallDel,
    currentOverallPct,
    allSectionSubjects,
    selectedSection,
    studentData,
    recoveryTargetPct,
  ]);

  // Filtered recovery sessions based on selected subject tab
  const filteredRecoverySessions = useMemo(() => {
    if (!simulation?.masterMissedRecoverySessions) return [];
    let list = simulation.masterMissedRecoverySessions;
    if (recoverySubjectFilter !== "ALL") {
      list = list.filter((s) => s.subjectName === recoverySubjectFilter);
    }
    return list;
  }, [simulation?.masterMissedRecoverySessions, recoverySubjectFilter]);

  const visibleRecoverySessions = useMemo(() => {
    if (showAllRecoveryDates) return filteredRecoverySessions;
    return filteredRecoverySessions.slice(0, 15);
  }, [filteredRecoverySessions, showAllRecoveryDates]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
      {/* ═══════════════════════════════════════════════════════════════════════
          HERO BANNER
      ═══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 18,
          padding: effectiveIsMobile ? "14px 12px" : "20px 24px",
          color: "#0f172a",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02), 0 10px 24px -6px rgba(15, 23, 42, 0.04)",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: effectiveIsMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: effectiveIsMobile ? "stretch" : "flex-start",
            gap: 12,
            width: "100%",
          }}
        >
          <div style={{ minWidth: 0, width: "100%" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11.5,
                fontWeight: 800,
                color: "#2563eb",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                background: "#eff6ff",
                padding: "3px 8px",
                borderRadius: 6,
                marginBottom: 6,
              }}
            >
              <Zap size={14} />
              <span>Section {selectedSection} Routine Engine</span>
            </div>
            <h2
              style={{
                fontSize: effectiveIsMobile ? 19 : 24,
                fontWeight: 900,
                margin: 0,
                color: "#0f172a",
                letterSpacing: "-0.5px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <TrendingUp size={22} color="#2563eb" />
              <span>Future Predictor</span>
            </h2>
            <p
              style={{
                fontSize: 12.5,
                color: "#64748b",
                margin: "4px 0 0 0",
                maxWidth: 720,
                lineHeight: 1.45,
              }}
            >
              Plan your leave smartly using your official timetable. See how taking leave will affect your attendance, and get a step-by-step recovery plan to stay above your target.
            </p>
          </div>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              padding: effectiveIsMobile ? "10px 14px" : "10px 16px",
              borderRadius: 14,
              display: "flex",
              flexDirection: effectiveIsMobile ? "row" : "column",
              alignItems: effectiveIsMobile ? "center" : "flex-end",
              justifyContent: effectiveIsMobile ? "space-between" : "flex-start",
              width: effectiveIsMobile ? "100%" : "auto",
              boxSizing: "border-box",
              gap: 4,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Current Baseline</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: currentOverallPct >= 75 ? "#059669" : "#dc2626",
                  letterSpacing: "-0.5px",
                }}
              >
                {currentOverallPct}%
              </span>
              <span style={{ fontSize: 11.5, color: "#64748b", fontWeight: 700 }}>
                ({currentOverallAtt}/{currentOverallDel} classes)
              </span>
            </div>
          </div>
        </div>

        {/* ── Quick Presets ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
            paddingTop: 8,
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Quick Presets:
            </span>
            <button
              type="button"
              onClick={applyPresetTomorrow}
              style={{
                padding: "4px 10px",
                borderRadius: 7,
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                color: "#334155",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Clock size={12} color="#2563eb" />
              <span>Tomorrow Off</span>
            </button>
            <button
              type="button"
              onClick={applyPresetWeekend}
              style={{
                padding: "4px 10px",
                borderRadius: 7,
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                color: "#334155",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Sun size={12} color="#d97706" />
              <span>Long Weekend (Fri+Sat)</span>
            </button>
            <button
              type="button"
              onClick={applyPreset3Day}
              style={{
                padding: "4px 10px",
                borderRadius: 7,
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                color: "#334155",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <CalendarIcon size={12} color="#7c3aed" />
              <span>3-Day Break (Thu-Sat)</span>
            </button>
            <button
              type="button"
              onClick={applyPresetFullWeek}
              style={{
                padding: "4px 10px",
                borderRadius: 7,
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                color: "#334155",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Layers size={12} color="#059669" />
              <span>Full Week Off</span>
            </button>
          </div>

          {selectedBunkKeys.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedBunkKeys([]);
                setNonInstructionalNotice(null);
              }}
              style={{
                padding: "4px 10px",
                borderRadius: 7,
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#dc2626",
                fontSize: 11.5,
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <RotateCcw size={12} />
              <span>Clear ({selectedBunkKeys.length} selected)</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          DATE WITH DAY STRIP
      ═══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 18,
          padding: effectiveIsMobile ? "14px 12px" : "18px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxWidth: "100%",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: effectiveIsMobile ? "column" : "row",
            alignItems: effectiveIsMobile ? "stretch" : "center",
            justifyContent: "space-between",
            gap: 10,
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarCheck size={18} color="#2563eb" />
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                Select Planned Bunk Date(s)
              </h3>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                Week of {weekRangeTitle}
              </span>
            </div>
          </div>

          {/* Week Switcher */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: effectiveIsMobile ? "1fr 1.2fr 1fr" : "auto auto auto",
              gap: 6,
              width: effectiveIsMobile ? "100%" : "auto",
            }}
          >
            <button
              type="button"
              disabled={weekOffset <= 0}
              onClick={() => {
                if (weekOffset <= 0) return;
                setWeekOffset((prev) => Math.max(0, prev - 1));
                setNonInstructionalNotice(null);
              }}
              style={{
                padding: "6px 8px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: weekOffset <= 0 ? "#f1f5f9" : "#f8fafc",
                color: weekOffset <= 0 ? "#94a3b8" : "#334155",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: weekOffset <= 0 ? "not-allowed" : "pointer",
                opacity: weekOffset <= 0 ? 0.45 : 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
              title={weekOffset <= 0 ? "Cannot plan bunks in past completed weeks" : "Previous Week"}
            >
              <ChevronLeft size={14} />
              <span>{effectiveIsMobile ? "Prev" : "Prev Week"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setWeekOffset(0);
                setNonInstructionalNotice(null);
              }}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: weekOffset === 0 ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                background: weekOffset === 0 ? "#eff6ff" : "#f8fafc",
                color: weekOffset === 0 ? "#2563eb" : "#334155",
                fontSize: 11.5,
                fontWeight: 800,
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => {
                setWeekOffset((prev) => Math.min(10, prev + 1));
                setNonInstructionalNotice(null);
              }}
              style={{
                padding: "6px 8px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                color: "#334155",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <span>{effectiveIsMobile ? "Next" : "Next Week"}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Date Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: effectiveIsMobile ? "repeat(2, 1fr)" : "repeat(6, 1fr)",
            gap: 8,
          }}
        >
          {activeWeekDays.map((dayItem) => {
            const isSelected = selectedBunkKeys.includes(dayItem.dateKey);
            const isInstructional = dayItem.isInstructional;
            const isPast = dayItem.isPast;
            const isToday = dayItem.isToday;

            return (
              <button
                key={dayItem.dateKey}
                type="button"
                disabled={isPast}
                onClick={() => toggleBunkDate(dayItem)}
                style={{
                  background: isSelected
                    ? "#fef2f2"
                    : isPast
                    ? "#f8fafc"
                    : !isInstructional
                    ? "#f8fafc"
                    : isToday
                    ? "#f8fafc"
                    : "#ffffff",
                  border: isSelected
                    ? "2px solid #dc2626"
                    : isToday
                    ? "2px solid #2563eb"
                    : isPast
                    ? "1px dashed #cbd5e1"
                    : !isInstructional
                    ? "1px dashed #cbd5e1"
                    : "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: "10px 8px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  cursor: isPast ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease",
                  opacity: isPast ? 0.5 : !isInstructional ? 0.85 : 1,
                  boxShadow: isSelected
                    ? "0 4px 12px rgba(220, 38, 38, 0.12)"
                    : isToday
                    ? "0 2px 8px rgba(37, 99, 235, 0.08)"
                    : "0 1px 2px rgba(0,0,0,0.02)",
                  position: "relative",
                }}
              >
                {/* Top Right Status: Checkbox, Completed Check, or Lock */}
                <div
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    background: isSelected
                      ? "#dc2626"
                      : isPast
                      ? "#e2e8f0"
                      : !isInstructional
                      ? "#f1f5f9"
                      : "transparent",
                    border: isSelected
                      ? "none"
                      : isPast || !isInstructional
                      ? "none"
                      : "1px solid #cbd5e1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isSelected ? "#ffffff" : "#94a3b8",
                  }}
                >
                  {isSelected ? (
                    <Check size={11} strokeWidth={3} />
                  ) : isPast ? (
                    <Check size={10} color="#64748b" strokeWidth={2.5} />
                  ) : !isInstructional ? (
                    <Lock size={10} color="#94a3b8" />
                  ) : null}
                </div>

                {/* Day Name */}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: isSelected ? "#991b1b" : isPast ? "#94a3b8" : !isInstructional ? "#64748b" : "#0f172a",
                    }}
                  >
                    {effectiveIsMobile ? dayItem.dayName.slice(0, 3) : dayItem.dayName}
                  </span>
                  {isToday && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 900,
                        background: "#dbeafe",
                        color: "#1d4ed8",
                        padding: "1px 4px",
                        borderRadius: 4,
                      }}
                    >
                      Today
                    </span>
                  )}
                </div>

                {/* Date String */}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isSelected ? "#dc2626" : isPast ? "#94a3b8" : "#64748b",
                  }}
                >
                  {dayItem.dateFormatted}
                </span>

                {/* Status Badge */}
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    padding: "2px 6px",
                    borderRadius: 5,
                    marginTop: 2,
                    background: isSelected
                      ? "#fee2e2"
                      : isPast
                      ? "#f1f5f9"
                      : dayItem.isExam
                      ? "#fff7ed"
                      : dayItem.isHoliday
                      ? "#fffbeb"
                      : isInstructional
                      ? isToday && todayMarkedClasses.length > 0
                        ? "#eff6ff"
                        : "#ecfdf5"
                      : "#f1f5f9",
                    color: isSelected
                      ? "#b91c1c"
                      : isPast
                      ? "#64748b"
                      : dayItem.isExam
                      ? "#c2410c"
                      : dayItem.isHoliday
                      ? "#b45309"
                      : isInstructional
                      ? isToday && todayMarkedClasses.length > 0
                        ? "#1d4ed8"
                        : "#047857"
                      : "#64748b",
                  }}
                >
                  {isSelected
                    ? isToday && todayMarkedClasses.length > 0
                      ? `Bunk Left (${todayUnmarkedClasses.length})`
                      : "Planned Bunk"
                    : isPast
                    ? "Completed"
                    : dayItem.isExam
                    ? "Exams (No Class)"
                    : dayItem.isHoliday
                    ? "Holiday (Closed)"
                    : isInstructional
                    ? isToday && todayMarkedClasses.length > 0
                      ? `${todayUnmarkedClasses.length} Left (${todayMarkedClasses.length} marked)`
                      : `${dayItem.totalClasses} Classes`
                    : "No Class"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          CENTRAL DISPLAY CONTAINER: NOTICE OVERLAY / EXAM WEEK / EMPTY STATE / ACTIVE SIMULATION
      ═══════════════════════════════════════════════════════════════════════ */}
      <div style={{ width: "100%", maxWidth: "100%", overflow: "hidden", boxSizing: "border-box" }}>
        <AnimatePresence mode="wait">
          {nonInstructionalNotice ? (
            <motion.div
              key={`notice-${nonInstructionalNotice.title}-${nonInstructionalNotice.dateFormatted || "info"}`}
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              style={{
                background: nonInstructionalNotice.isExam
                  ? "linear-gradient(135deg, #fff1f2 0%, #fff7ed 100%)"
                  : nonInstructionalNotice.isHoliday
                  ? "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)"
                  : "#f8fafc",
                border: `1.5px solid ${
                  nonInstructionalNotice.isExam
                    ? "#fecdd3"
                    : nonInstructionalNotice.isHoliday
                    ? "#fde68a"
                    : "#cbd5e1"
                }`,
                borderRadius: 18,
                padding: effectiveIsMobile ? "20px 16px" : "24px 22px",
                minHeight: effectiveIsMobile ? 220 : 230,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                textAlign: "center",
                position: "relative",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
                maxWidth: "100%",
                boxSizing: "border-box",
              }}
            >
              {/* Top Right Close 'X' Button */}
              <button
                type="button"
                onClick={() => setNonInstructionalNotice(null)}
                aria-label="Close Notice"
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: "rgba(0,0,0,0.06)",
                  border: "none",
                  color: "#475569",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <X size={16} />
              </button>

              {/* Visual Icon Badge */}
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: nonInstructionalNotice.isExam
                    ? "#ffe4e6"
                    : nonInstructionalNotice.isHoliday
                    ? "#fef3c7"
                    : "#e2e8f0",
                  color: nonInstructionalNotice.isExam
                    ? "#e11d48"
                    : nonInstructionalNotice.isHoliday
                    ? "#d97706"
                    : "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                }}
              >
                {nonInstructionalNotice.isExam ? (
                  <AlertTriangle size={24} />
                ) : nonInstructionalNotice.isHoliday ? (
                  <Sun size={24} />
                ) : (
                  <Info size={24} />
                )}
              </div>

              <div style={{ maxWidth: 500 }}>
                {nonInstructionalNotice.dateFormatted && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: "rgba(0,0,0,0.05)",
                      color: "#475569",
                      marginBottom: 4,
                    }}
                  >
                    <span>
                      {nonInstructionalNotice.dateFormatted} ({nonInstructionalNotice.dayName})
                    </span>
                  </div>
                )}
                <h4 style={{ fontSize: 15.5, fontWeight: 900, color: "#0f172a", margin: "0 0 3px 0", wordBreak: "break-word" }}>
                  {nonInstructionalNotice.title || "Classes Suspended"}
                </h4>
                <p style={{ fontSize: 12.5, color: "#475569", margin: 0, lineHeight: 1.45, wordBreak: "break-word" }}>
                  {nonInstructionalNotice.message}
                </p>
              </div>

              {/* Action Buttons Row */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center", marginTop: 2 }}>
                {nextInstructionalDateInfo && (
                  <button
                    type="button"
                    onClick={() => {
                      setWeekOffset((prev) => prev + 1);
                      setNonInstructionalNotice(null);
                    }}
                    style={{
                      background: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 8,
                      padding: "6px 13px",
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      boxShadow: "0 2px 6px rgba(37, 99, 235, 0.2)",
                    }}
                  >
                    <span>Jump to Class Week ({nextInstructionalDateInfo.dateFormatted})</span>
                    <ArrowRight size={12} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setNonInstructionalNotice(null)}
                  style={{
                    background: "#ffffff",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <X size={12} />
                  <span>{simulation ? "Return to Simulation" : "Dismiss Notice"}</span>
                </button>
              </div>
            </motion.div>
          ) : !simulation && weekInstructionalCount === 0 ? (
            <motion.div
              key="exam-week-card"
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              style={{
                background: "linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)",
                border: "1.5px solid #fed7aa",
                borderRadius: 18,
                padding: effectiveIsMobile ? "20px 16px" : "24px 22px",
                minHeight: effectiveIsMobile ? 220 : 230,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                textAlign: "center",
                boxShadow: "0 4px 16px rgba(234, 88, 12, 0.06)",
                maxWidth: "100%",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: "#ffedd5",
                  color: "#ea580c",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(234, 88, 12, 0.12)",
                }}
              >
                <AlertTriangle size={24} />
              </div>

              <div style={{ maxWidth: 500 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    background: "#fed7aa",
                    color: "#9a3412",
                    padding: "2px 8px",
                    borderRadius: 6,
                    marginBottom: 4,
                  }}
                >
                  <span>Week of {weekRangeTitle}</span>
                </div>
                <h4 style={{ fontSize: 15.5, fontWeight: 900, color: "#0f172a", margin: "0 0 3px 0", wordBreak: "break-word" }}>
                  Examinations / Holidays Scheduled This Week
                </h4>
                <p style={{ fontSize: 12.5, color: "#7c2d12", margin: 0, lineHeight: 1.45, wordBreak: "break-word" }}>
                  Regular timetable classes are suspended during this week per the academic calendar. Routine classes resume next week {nextInstructionalDateInfo ? `(${nextInstructionalDateInfo.dateFormatted} onwards)` : ""}.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setWeekOffset((prev) => prev + 1);
                  setNonInstructionalNotice(null);
                }}
                style={{
                  background: "#ea580c",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 8,
                  padding: "7px 16px",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  boxShadow: "0 2px 8px rgba(234, 88, 12, 0.2)",
                  transition: "all 0.15s ease",
                  marginTop: 2,
                }}
              >
                <span>Jump to Class Week ({nextInstructionalDateInfo ? nextInstructionalDateInfo.dateFormatted : "Next Week"})</span>
                <ArrowRight size={13} />
              </button>
            </motion.div>
          ) : !simulation ? (
            <motion.div
              key="empty-state-card"
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              style={{
                background: "#f8fafc",
                border: "1.5px dashed #cbd5e1",
                borderRadius: 18,
                padding: effectiveIsMobile ? "20px 16px" : "24px 22px",
                minHeight: effectiveIsMobile ? 220 : 230,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                textAlign: "center",
                maxWidth: "100%",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CalendarIcon size={24} />
              </div>
              <div style={{ maxWidth: 480 }}>
                <h4 style={{ fontSize: 15.5, fontWeight: 900, color: "#0f172a", margin: "0 0 3px 0" }}>
                  No Bunk Date Selected
                </h4>
                <p style={{ fontSize: 12.5, color: "#64748b", margin: 0, lineHeight: 1.45 }}>
                  Tap any date above with scheduled classes to simulate your future attendance, sequential class drops, and recovery roadmap. If viewing an examination week, tap <strong>"Next Week &gt;"</strong> to select regular class dates.
                </p>
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  color: "#64748b",
                  background: "#f1f5f9",
                  padding: "3px 9px",
                  borderRadius: 6,
                  fontWeight: 700,
                  marginTop: 2,
                }}
              >
                <Info size={11} color="#64748b" style={{ flexShrink: 0 }} />
                <span>Tip: Select any date with classes above or use Quick Presets</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="simulation-results"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: "100%", boxSizing: "border-box" }}
            >
          {/* ─────────────────────────────────────────────────────────────────
              PHASE 1: PRE-BUNK ATTENDANCE ACCUMULATION
          ───────────────────────────────────────────────────────────────── */}
          {simulation.preBunkTotalClasses > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)",
                border: "1px solid #bfdbfe",
                borderRadius: 18,
                padding: effectiveIsMobile ? "14px 12px" : "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                maxWidth: "100%",
                boxSizing: "border-box",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: effectiveIsMobile ? "column" : "row",
                  alignItems: effectiveIsMobile ? "flex-start" : "center",
                  justifyContent: "space-between",
                  gap: 8,
                  width: "100%",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: "#2563eb",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Step 1 &bull; Attendance Gain Before Leave
                    </span>
                    <h4 style={{ fontSize: 14.5, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                      Attend Classes Before Your Leave Date
                    </h4>
                  </div>
                </div>

                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #93c5fd",
                    padding: "4px 10px",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    alignSelf: effectiveIsMobile ? "flex-start" : "auto",
                  }}
                >
                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Before Leave:</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: "#059669" }}>
                    {simulation.preBunkOverallPct}%
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#059669" }}>
                    (+{simulation.preBunkGainDelta}%)
                  </span>
                </div>
              </div>

              <p style={{ fontSize: 12.5, color: "#334155", margin: 0, lineHeight: 1.5 }}>
                From today until the day before your planned leave ({formatFriendlyDate(new Date(simulation.firstBunkDate.getTime() - 86400000))}), if you attend all <strong>{simulation.preBunkTotalClasses} upcoming scheduled classes</strong> across your timetable, your overall attendance will rise from <strong>{currentOverallPct}%</strong> to <strong>{simulation.preBunkOverallPct}%</strong> before taking leave.
              </p>

              {/* Same-Day Marked Classes Notice */}
              {todayMarkedClasses.length > 0 && (
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #93c5fd",
                    borderRadius: 8,
                    padding: "6px 10px",
                    fontSize: 11.5,
                    color: "#1e40af",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Info size={14} color="#2563eb" style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Today's Activity:</strong> {todayMarkedClasses.length} class(es) were already logged in Daily Hub ({todayPresentCount} present, {todayAbsentCount} absent) and are included in your current baseline. Only the {todayUnmarkedClasses.length} remaining upcoming class(es) today are added to this pre-leave schedule.
                  </span>
                </div>
              )}

              {/* Summary Subject Chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {simulation.affectedSubjectsList
                  .filter((s) => s.preBunkClassesAdded > 0)
                  .map((sub) => (
                    <div
                      key={sub.subjectName}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        padding: "4px 9px",
                        borderRadius: 7,
                        fontSize: 11,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <span style={{ fontWeight: 800, color: "#0f172a" }}>{sub.subjectName}:</span>
                      <span style={{ color: "#64748b" }}>{sub.currentPct.toFixed(1)}%</span>
                      <ArrowRight size={10} color="#2563eb" />
                      <span style={{ fontWeight: 800, color: "#059669" }}>{sub.preBunkPct}%</span>
                      <span style={{ fontSize: 9.5, color: "#059669", fontWeight: 700 }}>
                        (+{sub.preBunkClassesAdded} cls)
                      </span>
                    </div>
                  ))}
              </div>

              {/* View Toggle: Detailed Day-by-Day Pre-Bunk Breakdown */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Day-by-Day Schedule Before Leave ({simulation.preBunkDays.length} Days):
                </span>
                <button
                  type="button"
                  onClick={() => setPreBunkViewMode((prev) => (prev === "detailed" ? "summary" : "detailed"))}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#2563eb",
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <span>{preBunkViewMode === "detailed" ? "Hide Daily Classes" : "Show Daily Classes"}</span>
                  {preBunkViewMode === "detailed" ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {/* Detailed Day-by-Day Classes List */}
              {preBunkViewMode === "detailed" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 2 }}>
                  {simulation.preBunkDays.map((pDay) => (
                    <div
                      key={pDay.dateKey}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: 12,
                        padding: "10px 12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 900, color: "#0f172a" }}>
                          {pDay.dateFormatted} ({pDay.dayName}) &bull; {pDay.classesCount} Classes {pDay.isToday ? "(Today)" : "Scheduled"}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#059669" }}>
                          Day-End Overall: {pDay.dayEndOverallPct}%
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: effectiveIsMobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: 6, width: "100%", boxSizing: "border-box" }}>
                        {pDay.classes.map((cls, cIdx) => (
                          <div
                            key={cIdx}
                            style={{
                              background: cls.isAlreadyMarkedToday ? "#f1f5f9" : "#f8fafc",
                              border: cls.isAlreadyMarkedToday ? "1px solid #cbd5e1" : "1px solid #e2e8f0",
                              borderRadius: 8,
                              padding: "6px 8px",
                              display: "flex",
                              flexDirection: "column",
                              gap: 3,
                              opacity: cls.isAlreadyMarkedToday ? 0.85 : 1,
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 11.5, fontWeight: 800, color: "#0f172a" }}>
                                {cls.subjectName}
                              </span>
                              <span style={{ fontSize: 9.5, fontWeight: 800, background: "#eff6ff", color: "#2563eb", padding: "1px 4px", borderRadius: 4 }}>
                                {cls.type}
                              </span>
                            </div>
                            <div style={{ fontSize: 10, color: "#64748b" }}>
                              {cls.timeSlot} &bull; Room {cls.room}
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, borderTop: "1px dashed #e2e8f0", paddingTop: 3, marginTop: 2 }}>
                              <span style={{ color: "#64748b" }}>Course %:</span>
                              {cls.isAlreadyMarkedToday ? (
                                <strong style={{ color: cls.markedStatusToday === "present" ? "#059669" : "#dc2626" }}>
                                  Already marked {cls.markedStatusToday} ({cls.prevSubPct}%)
                                </strong>
                              ) : (
                                <strong style={{ color: "#059669" }}>
                                  {cls.prevSubPct}% &rarr; {cls.newSubPct}% (+{cls.subDelta}%)
                                </strong>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              PHASE 2: BUNK DROP SIMULATION
          ───────────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 18,
              padding: effectiveIsMobile ? "14px 12px" : "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              maxWidth: "100%",
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: effectiveIsMobile ? "column" : "row",
                alignItems: effectiveIsMobile ? "flex-start" : "center",
                justifyContent: "space-between",
                gap: 10,
                width: "100%",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, minWidth: 0, width: "100%" }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: simulation.isOverallSafeAtTarget ? "#d97706" : "#dc2626",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <TrendingDown size={16} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Step 2 &bull; Attendance Drop If You Take Leave
                  </span>
                  <h3 style={{ fontSize: effectiveIsMobile ? 14.5 : 16, fontWeight: 900, color: "#0f172a", margin: 0, wordBreak: "break-word", lineHeight: 1.35 }}>
                    {simulation.interveningAttendedDaysCount > 0
                      ? `Attendance Impact (${simulation.bunkDaysCount} Bunk Days, ${simulation.interveningAttendedDaysCount} Attended Days)`
                      : simulation.bunkDaysBreakdown.length === 1
                      ? `Leave on ${simulation.firstBunkDateFormatted}`
                      : `Leave for ${simulation.bunkDaysBreakdown.length} Days (${simulation.firstBunkDateFormatted} to ${simulation.lastBunkDateFormatted})`}
                  </h3>
                  {simulation.interveningAttendedDaysCount > 0 && (
                    <div style={{ fontSize: 11, color: "#059669", fontWeight: 700, marginTop: 4, display: "flex", alignItems: "center", gap: 5, lineHeight: 1.35 }}>
                      <CheckCircle2 size={13} color="#16a34a" style={{ flexShrink: 0 }} />
                      <span>In-between class days are counted as <strong>Attended</strong> — classes attended boost attendance before the next bunk!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 900,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  alignSelf: effectiveIsMobile ? "flex-start" : "auto",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  wordBreak: "break-word",
                  background: simulation.isOverallTargetImpossible
                    ? "#fff7ed"
                    : simulation.isOverallSafeAtTarget
                    ? simulation.criticalSubjectsList.length === 0
                      ? "#ecfdf5"
                      : "#fffbeb"
                    : "#fef2f2",
                  color: simulation.isOverallTargetImpossible
                    ? "#c2410c"
                    : simulation.isOverallSafeAtTarget
                    ? simulation.criticalSubjectsList.length === 0
                      ? "#047857"
                      : "#b45309"
                    : "#dc2626",
                  border: `1px solid ${
                    simulation.isOverallTargetImpossible
                      ? "#fdba74"
                      : simulation.isOverallSafeAtTarget
                      ? simulation.criticalSubjectsList.length === 0
                        ? "#a7f3d0"
                        : "#fde68a"
                      : "#fecaca"
                  }`,
                }}
              >
                {simulation.isOverallTargetImpossible ? (
                  <>
                    <AlertTriangle size={14} color="#ea580c" />
                    <span>Overall {simulation.targetPct}% Unattainable (Max: {simulation.maxPossibleOverallPct}%)</span>
                  </>
                ) : simulation.isOverallSafeAtTarget ? (
                  simulation.criticalSubjectsList.length === 0 ? (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Safe Zone (&ge; {simulation.targetPct}%)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={14} />
                      <span>Warning: {simulation.criticalSubjectsList.length} Subject(s) Breached</span>
                    </>
                  )
                ) : (
                  <>
                    <AlertTriangle size={14} />
                    <span>Cutoff Breached (&lt; {simulation.targetPct}%)</span>
                  </>
                )}
              </div>
            </div>

            {/* Impact Metric Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: effectiveIsMobile
                  ? "repeat(2, 1fr)"
                  : simulation.interveningAttendedDaysCount > 0
                  ? "repeat(5, 1fr)"
                  : "repeat(4, 1fr)",
                gap: effectiveIsMobile ? 8 : 10,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <div style={{ background: "#f8fafc", padding: effectiveIsMobile ? "10px 10px" : "12px", borderRadius: 12, border: "1px solid #e2e8f0", minWidth: 0, boxSizing: "border-box" }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", display: "block", lineHeight: 1.25 }}>Before Leave</span>
                <div style={{ fontSize: effectiveIsMobile ? 16 : 18, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>
                  {simulation.preBunkOverallPct}%
                </div>
              </div>

              <div style={{ background: "#fef2f2", padding: effectiveIsMobile ? "10px 10px" : "12px", borderRadius: 12, border: "1px solid #fee2e2", minWidth: 0, boxSizing: "border-box" }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#991b1b", display: "block", lineHeight: 1.25 }}>Classes Missed</span>
                <div style={{ fontSize: effectiveIsMobile ? 16 : 18, fontWeight: 900, color: "#dc2626", marginTop: 4 }}>
                  {simulation.cumulativeMissedClasses} Classes
                </div>
              </div>

              {simulation.interveningAttendedDaysCount > 0 && (
                <div style={{ background: "#f0fdf4", padding: effectiveIsMobile ? "10px 10px" : "12px", borderRadius: 12, border: "1px solid #bbf7d0", minWidth: 0, boxSizing: "border-box" }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#166534", display: "block", lineHeight: 1.25 }}>Classes Attended</span>
                  <div style={{ fontSize: effectiveIsMobile ? 16 : 18, fontWeight: 900, color: "#15803d", marginTop: 4 }}>
                    +{simulation.cumulativeInterveningAttendedClasses} Classes
                  </div>
                </div>
              )}

              <div style={{ background: "#fff7ed", padding: effectiveIsMobile ? "10px 10px" : "12px", borderRadius: 12, border: "1px solid #ffedd5", minWidth: 0, boxSizing: "border-box" }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#9a3412", display: "block", lineHeight: 1.25 }}>
                  {simulation.interveningAttendedDaysCount > 0 ? "Net Change" : "Expected Drop"}
                </span>
                <div style={{ fontSize: effectiveIsMobile ? 16 : 18, fontWeight: 900, color: simulation.totalBunkDropDelta < 0 ? "#ea580c" : "#15803d", marginTop: 4 }}>
                  {simulation.totalBunkDropDelta >= 0 ? `+${simulation.totalBunkDropDelta}` : simulation.totalBunkDropDelta}%
                </div>
              </div>

              <div
                style={{
                  background: simulation.isOverallSafeAtTarget ? "#f0fdf4" : "#fef2f2",
                  padding: effectiveIsMobile ? "10px 10px" : "12px",
                  borderRadius: 12,
                  border: `1px solid ${simulation.isOverallSafeAtTarget ? "#bbf7d0" : "#fecaca"}`,
                  minWidth: 0,
                  boxSizing: "border-box",
                  gridColumn: effectiveIsMobile && simulation.interveningAttendedDaysCount > 0 ? "span 2" : "auto",
                }}
              >
                <span style={{ fontSize: 10.5, fontWeight: 700, color: simulation.isOverallSafeAtTarget ? "#166534" : "#991b1b", display: "block", lineHeight: 1.25 }}>
                  After Leave
                </span>
                <div
                  style={{
                    fontSize: effectiveIsMobile ? 16 : 18,
                    fontWeight: 900,
                    color: simulation.isOverallSafeAtTarget ? "#15803d" : "#dc2626",
                    marginTop: 4,
                  }}
                >
                  {simulation.postBunkOverallPct}%
                </div>
              </div>
            </div>

            {/* Feasibility Warning Banner if target is mathematically impossible in any subject */}
            {simulation.impossibleSubjectsList.length > 0 && (
              <div
                style={{
                  background: "#fff7ed",
                  border: "1.5px solid #fed7aa",
                  borderRadius: 12,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <AlertTriangle size={18} color="#ea580c" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: "#9a3412", lineHeight: 1.45 }}>
                  <strong>Target {simulation.targetPct}% Unattainable in {simulation.impossibleSubjectsList.length} Subject(s):</strong>{" "}
                  {simulation.impossibleSubjectsList.map((s) => `${s.subjectName} (Max: ${s.maxPossiblePct}%)`).join(", ")}. Even with 100% attendance in all scheduled classes until semester end (Oct 31), {simulation.targetPct}% cannot be achieved. See Step 3 (Recovery Plan) below for full recovery roadmap up to maximum achievable ceiling.
                </div>
              </div>
            )}

            {/* Sequential Schedule Breakdown across the Simulation Window */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {simulation.interveningAttendedDaysCount > 0
                  ? `Day-by-Day Schedule & Attendance Impact (${simulation.bunkDaysCount} Bunk Days, ${simulation.interveningAttendedDaysCount} Attended Days):`
                  : "Day-by-Day Bunk Impact & Missed Classes:"}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {simulation.bunkDaysBreakdown.map((bDay) => {
                  if (bDay.isAttendedDay) {
                    return (
                      <div
                        key={bDay.dateKey}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          padding: effectiveIsMobile ? "10px 10px" : "12px 14px",
                          borderRadius: 12,
                          background: "#f0fdf4",
                          border: "1.5px solid #86efac",
                          boxShadow: "0 2px 6px rgba(22, 163, 74, 0.06)",
                          maxWidth: "100%",
                          boxSizing: "border-box",
                          overflow: "hidden",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, minWidth: 0, flex: 1 }}>
                            <span
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 6,
                                background: "#dcfce7",
                                color: "#166534",
                                fontSize: 11,
                                fontWeight: 800,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {bDay.stepIndex}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 900, color: "#0f172a" }}>
                              {bDay.dateFormatted} ({bDay.dayName})
                            </span>
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 800,
                                padding: "2px 7px",
                                borderRadius: 6,
                                background: "#dcfce7",
                                color: "#15803d",
                                border: "1px solid #bbf7d0",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                wordBreak: "break-word",
                              }}
                            >
                              <CheckCircle2 size={11} style={{ flexShrink: 0 }} />
                              In-Between Attended (+{bDay.classesAttendedCount} Classes)
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                            <span style={{ fontSize: 11, color: "#64748b" }}>Overall:</span>
                            <span style={{ fontSize: 13, fontWeight: 900, color: "#15803d" }}>
                              {bDay.endOfDayOverallPct}%
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 800, color: "#16a34a" }}>
                              (+{bDay.dayDelta}%)
                            </span>
                          </div>
                        </div>

                        {/* Explanatory Guidance Banner */}
                        <div
                          style={{
                            background: "#ecfdf5",
                            border: "1px solid #bbf7d0",
                            borderRadius: 8,
                            padding: "6px 10px",
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: "#166534",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginTop: 2,
                          }}
                        >
                          <CheckCircle2 size={14} color="#16a34a" style={{ flexShrink: 0 }} />
                          <span>
                            <strong>Classes Scheduled & Attended:</strong> Apko ye classes attend karni hain — attendance increase hogi (<strong>+{bDay.dayDelta}%</strong>), jisse agle bunk se pehle buffer badhega!
                          </span>
                        </div>

                        {/* Subject-wise gain details for this day */}
                        {bDay.daySubjectsGainList && bDay.daySubjectsGainList.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: "#166534", textTransform: "uppercase", letterSpacing: "0.5px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                                <TrendingUp size={12} color="#16a34a" />
                                Subject-wise Attendance Gain on {bDay.dayName}:
                              </span>
                              <span style={{ fontSize: 10.5, color: "#15803d", fontWeight: 700 }}>
                                +{bDay.classesAttendedCount} class{bDay.classesAttendedCount > 1 ? "es" : ""} attended across {bDay.daySubjectsGainList.length} subject(s)
                              </span>
                            </div>

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: effectiveIsMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
                                gap: 8,
                                width: "100%",
                                boxSizing: "border-box",
                              }}
                            >
                              {bDay.daySubjectsGainList.map((subGain, gIdx) => (
                                <div
                                  key={gIdx}
                                  style={{
                                    background: "#ffffff",
                                    border: "1.5px solid #bbf7d0",
                                    borderRadius: 10,
                                    padding: "9px 12px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 6,
                                    boxShadow: "0 1px 3px rgba(22, 163, 74, 0.08)",
                                    minWidth: 0,
                                    width: "100%",
                                    boxSizing: "border-box",
                                    overflow: "hidden",
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                      <div style={{ fontSize: 12.5, fontWeight: 900, color: "#0f172a", wordBreak: "break-word", lineHeight: 1.35 }}>
                                        {subGain.subjectName}
                                      </div>
                                      <div style={{ fontSize: 10.5, color: "#15803d", marginTop: 1, fontWeight: 700 }}>
                                        +{subGain.attendedCount} class{subGain.attendedCount > 1 ? "es" : ""} attended ({subGain.type})
                                      </div>
                                      {subGain.attendedSlots && subGain.attendedSlots.length > 0 && (
                                        <div style={{ fontSize: 10, color: "#64748b", marginTop: 2, wordBreak: "break-word", display: "inline-flex", alignItems: "center", gap: 3.5 }}>
                                          <Clock size={10} style={{ flexShrink: 0 }} />
                                          <span>{subGain.attendedSlots.map((s) => s.timeSlot).join(", ")}</span>
                                        </div>
                                      )}
                                    </div>

                                    <span
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 900,
                                        padding: "2px 7px",
                                        borderRadius: 5,
                                        background: "#dcfce7",
                                        color: "#166534",
                                        border: "1px solid #bbf7d0",
                                        whiteSpace: "nowrap",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 3,
                                        flexShrink: 0,
                                      }}
                                    >
                                      <TrendingUp size={11} /> +{subGain.dayGainDelta}%
                                    </span>
                                  </div>

                                  {/* Attendance Before -> After on this Day */}
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      flexWrap: "wrap",
                                      gap: 6,
                                      background: "#f0fdf4",
                                      padding: "5px 8px",
                                      borderRadius: 6,
                                      fontSize: 11,
                                      minWidth: 0,
                                      boxSizing: "border-box",
                                    }}
                                  >
                                    <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                                      <span style={{ color: "#64748b" }}>Pre-Day:</span>
                                      <span style={{ fontWeight: 700, color: "#334155" }}>{subGain.startPct}%</span>
                                      <ArrowRight size={10} color="#64748b" />
                                      <span style={{ color: "#64748b" }}>Post-Day:</span>
                                      <strong style={{ color: "#15803d" }}>{subGain.endPct}%</strong>
                                    </div>

                                    <span
                                      style={{
                                        fontSize: 9.5,
                                        fontWeight: 900,
                                        padding: "1px 5px",
                                        borderRadius: 4,
                                        background: "#dcfce7",
                                        color: "#166534",
                                        flexShrink: 0,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 3,
                                      }}
                                    >
                                      <Check size={10} />
                                      Buffer Boosted
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (bDay.isNonInstructional) {
                    return (
                      <div
                        key={bDay.dateKey}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: 8,
                          padding: "9px 12px",
                          borderRadius: 10,
                          background: "#f8fafc",
                          border: "1px dashed #cbd5e1",
                          maxWidth: "100%",
                          boxSizing: "border-box",
                          overflow: "hidden",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, minWidth: 0, flex: 1 }}>
                          <span
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 6,
                              background: "#e2e8f0",
                              color: "#64748b",
                              fontSize: 11,
                              fontWeight: 800,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {bDay.stepIndex}
                          </span>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#64748b" }}>
                            {bDay.dateFormatted} ({bDay.dayName})
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "1px 6px",
                              borderRadius: 4,
                              background: "#f1f5f9",
                              color: "#64748b",
                              wordBreak: "break-word",
                            }}
                          >
                            {bDay.holidayTitle || "Holiday / Sunday (0 Classes)"}
                          </span>
                        </div>

                        <div style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>
                          Overall: <strong>{bDay.endOfDayOverallPct}%</strong> (No Change)
                        </div>
                      </div>
                    );
                  }

                  // Default: Bunk Day
                  return (
                    <div
                      key={bDay.dateKey}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        padding: effectiveIsMobile ? "10px 10px" : "12px 14px",
                        borderRadius: 10,
                        background: "#f8fafc",
                        border: "1.5px solid #fed7aa",
                        maxWidth: "100%",
                        boxSizing: "border-box",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, minWidth: 0, flex: 1 }}>
                          <span
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 6,
                              background: "#fee2e2",
                              color: "#dc2626",
                              fontSize: 11,
                              fontWeight: 800,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {bDay.stepIndex}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 900, color: "#0f172a" }}>
                            {bDay.dateFormatted} ({bDay.dayName})
                          </span>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: "1px 6px",
                              borderRadius: 4,
                              background: bDay.isInstructional ? "#fee2e2" : "#fffbeb",
                              color: bDay.isInstructional ? "#dc2626" : "#b45309",
                              wordBreak: "break-word",
                            }}
                          >
                            {bDay.isToday && bDay.alreadyMarkedCount > 0
                              ? `${bDay.classesMissedCount} Remaining Missed (${bDay.alreadyMarkedCount} marked earlier)`
                              : bDay.isInstructional
                              ? `${bDay.classesMissedCount} Classes Missed`
                              : bDay.holidayTitle || "Holiday (0 Missed)"}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          <span style={{ fontSize: 11, color: "#64748b" }}>Overall:</span>
                          <span style={{ fontSize: 12.5, fontWeight: 900, color: bDay.endOfDayOverallPct >= 75 ? "#0f172a" : "#dc2626" }}>
                            {bDay.endOfDayOverallPct}%
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#dc2626" }}>
                            ({bDay.dayDelta}%)
                          </span>
                        </div>
                      </div>

                      {/* Subject-wise drop details for this specific day */}
                      {bDay.daySubjectsImpactList && bDay.daySubjectsImpactList.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <TrendingDown size={12} color="#dc2626" />
                              Subject-wise Attendance Drop on {bDay.dayName}:
                            </span>
                            <span style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600 }}>
                              {bDay.classesMissedCount} class{bDay.classesMissedCount > 1 ? "es" : ""} missed across {bDay.daySubjectsImpactList.filter((s) => s.missedCount > 0).length} subject(s)
                            </span>
                          </div>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: effectiveIsMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
                              gap: 8,
                              width: "100%",
                              boxSizing: "border-box",
                            }}
                          >
                            {bDay.daySubjectsImpactList.map((subImp, sIdx) => {
                              const isBreached = subImp.breachedCutoffToday;
                              const isSafe = subImp.isSafeAfterDay;
                              const hasMissed = subImp.missedCount > 0;
                              const hasMarked = subImp.alreadyMarkedSlots && subImp.alreadyMarkedSlots.length > 0;

                              return (
                                <div
                                  key={sIdx}
                                  style={{
                                    background: isBreached ? "#fff5f5" : "#ffffff",
                                    border: `1.5px solid ${isBreached ? "#fca5a5" : "#e2e8f0"}`,
                                    borderRadius: 10,
                                    padding: "9px 12px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 6,
                                    boxShadow: isBreached ? "0 2px 6px rgba(220, 38, 38, 0.08)" : "0 1px 2px rgba(0,0,0,0.02)",
                                    minWidth: 0,
                                    width: "100%",
                                    boxSizing: "border-box",
                                    overflow: "hidden",
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                      <div style={{ fontSize: 12.5, fontWeight: 900, color: "#0f172a", wordBreak: "break-word", lineHeight: 1.35 }}>
                                        {subImp.subjectName}
                                      </div>
                                      <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 1, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                                        <span style={{ fontWeight: 700, color: "#475569" }}>
                                          {hasMissed ? `${subImp.missedCount} class${subImp.missedCount > 1 ? "es" : ""} missed` : "0 missed"} ({subImp.type})
                                        </span>
                                        {hasMarked && (
                                          <span style={{ fontSize: 9.5, fontWeight: 800, background: "#e2e8f0", color: "#475569", padding: "1px 5px", borderRadius: 4 }}>
                                            {subImp.alreadyMarkedSlots.length} logged today
                                          </span>
                                        )}
                                      </div>
                                      {subImp.missedSlots && subImp.missedSlots.length > 0 && (
                                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2, wordBreak: "break-word", display: "inline-flex", alignItems: "center", gap: 3.5 }}>
                                          <Clock size={10} style={{ flexShrink: 0 }} />
                                          <span>{subImp.missedSlots.map((s) => s.timeSlot).join(", ")}</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Subject day drop badge */}
                                    {(() => {
                                      const rawDrop =
                                        subImp.dayDropDelta ??
                                        subImp.dayDelta ??
                                        (typeof subImp.endPct === "number" && typeof subImp.startPct === "number"
                                          ? Number((subImp.endPct - subImp.startPct).toFixed(2))
                                          : 0);
                                      const isNegative = rawDrop < 0;
                                      return (
                                        <span
                                          style={{
                                            fontSize: 11,
                                            fontWeight: 900,
                                            padding: "2px 7px",
                                            borderRadius: 5,
                                            background: isNegative ? "#fef2f2" : "#f8fafc",
                                            color: isNegative ? "#dc2626" : "#64748b",
                                            border: `1px solid ${isNegative ? "#fecaca" : "#e2e8f0"}`,
                                            whiteSpace: "nowrap",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 3,
                                            flexShrink: 0,
                                          }}
                                        >
                                          <TrendingDown size={11} /> {rawDrop}%
                                        </span>
                                      );
                                    })()}
                                  </div>

                                  {/* Attendance Before -> After on this Day */}
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      flexWrap: "wrap",
                                      gap: 6,
                                      background: isBreached ? "#fee2e2" : "#f8fafc",
                                      padding: "5px 8px",
                                      borderRadius: 6,
                                      fontSize: 11,
                                      minWidth: 0,
                                      boxSizing: "border-box",
                                    }}
                                  >
                                    <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                                      <span style={{ color: "#64748b" }}>Before:</span>
                                      <span style={{ fontWeight: 700, color: "#334155" }}>{subImp.startPct}%</span>
                                      <ArrowRight size={10} color="#64748b" />
                                      <span style={{ color: "#64748b" }}>After:</span>
                                      <strong style={{ color: isSafe ? "#059669" : "#dc2626" }}>{subImp.endPct}%</strong>
                                    </div>

                                    <span
                                      style={{
                                        fontSize: 9.5,
                                        fontWeight: 900,
                                        padding: "1px 5px",
                                        borderRadius: 4,
                                        background: isBreached
                                          ? "#dc2626"
                                          : isSafe
                                          ? "#ecfdf5"
                                          : "#fee2e2",
                                        color: isBreached
                                          ? "#ffffff"
                                          : isSafe
                                          ? "#059669"
                                          : "#dc2626",
                                        flexShrink: 0,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 3,
                                      }}
                                    >
                                      {isBreached ? (
                                        <>
                                          <AlertTriangle size={9} />
                                          Drops Below Cutoff!
                                        </>
                                      ) : isSafe ? (
                                        <>
                                          <Check size={9} />
                                          Safe
                                        </>
                                      ) : (
                                        "Cutoff Breached"
                                      )}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : bDay.classes.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
                          {bDay.classes.map((cls, cIdx) => (
                            <span
                              key={cIdx}
                              style={{
                                fontSize: 11,
                                background: cls.isAlreadyMarked ? "#f1f5f9" : "#ffffff",
                                border: cls.isAlreadyMarked ? "1px solid #cbd5e1" : "1px solid #fecaca",
                                color: cls.isAlreadyMarked ? "#64748b" : "#991b1b",
                                padding: "3px 8px",
                                borderRadius: 6,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                wordBreak: "break-word",
                              }}
                            >
                              <strong>{cls.subjectName}</strong>
                              <span style={{ fontSize: 9.5, opacity: 0.8 }}>({cls.timeSlot})</span>
                              {cls.isAlreadyMarked && (
                                <span style={{ fontSize: 9, fontWeight: 800, background: "#e2e8f0", padding: "1px 4px", borderRadius: 3 }}>
                                  Already {cls.markStatus}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────────
              PHASE 3: RECOVERY ROADMAP SPECIFICALLY FOR MISSED SUBJECTS
          ───────────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 18,
              padding: effectiveIsMobile ? "14px 12px" : "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              maxWidth: "100%",
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            {/* Header & Target Selector */}
            <div
              style={{
                display: "flex",
                flexDirection: effectiveIsMobile ? "column" : "row",
                alignItems: effectiveIsMobile ? "stretch" : "flex-start",
                justifyContent: "space-between",
                gap: effectiveIsMobile ? 12 : 14,
                width: "100%",
              }}
            >
              <div style={{ minWidth: 0, width: "100%" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#059669",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    background: "#ecfdf5",
                    padding: "3px 8px",
                    borderRadius: 6,
                    marginBottom: 6,
                  }}
                >
                  <Target size={13} />
                  <span>Step 3 &bull; Attendance Recovery Roadmap</span>
                </div>
                <h3 style={{ fontSize: effectiveIsMobile ? 15 : 16.5, fontWeight: 900, color: "#0f172a", margin: 0, wordBreak: "break-word", lineHeight: 1.35 }}>
                  Classes You Must Attend to Recover Back to {recoveryTargetPct}% Target
                </h3>
                <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0 0", wordBreak: "break-word", lineHeight: 1.45 }}>
                  Starting from {simulation.firstReturnDateFormatted} when regular classes resume, attend these scheduled timetable sessions to recover:
                </p>
              </div>

              {/* Target Buttons */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: effectiveIsMobile ? "repeat(2, 1fr)" : "repeat(4, auto)",
                  gap: 6,
                  width: effectiveIsMobile ? "100%" : "auto",
                  flexShrink: 0,
                }}
              >
                {[75, 80, 85, 90].map((tVal) => {
                  const isTargetSelected = recoveryTargetPct === tVal;
                  return (
                    <button
                      key={tVal}
                      type="button"
                      onClick={() => setRecoveryTargetPct(tVal)}
                      style={{
                        padding: effectiveIsMobile ? "8px 10px" : "6px 12px",
                        borderRadius: 8,
                        border: isTargetSelected ? "2px solid #2563eb" : "1px solid #cbd5e1",
                        background: isTargetSelected ? "#eff6ff" : "#ffffff",
                        color: isTargetSelected ? "#1d4ed8" : "#334155",
                        fontSize: effectiveIsMobile ? 11.5 : 12,
                        fontWeight: 800,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {tVal}% {tVal === 75 ? "(Mandatory)" : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Missed Subjects Summary Cards ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Recovery Milestones for Missed Subjects:
              </span>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: effectiveIsMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 10,
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                {simulation.missedOnlySubjectsList.map((sub) => {
                  const isSafe = sub.isSafeAtTarget;
                  const isImpossible = sub.isTargetImpossible;
                  const isFiltered = recoverySubjectFilter === sub.subjectName;

                  return (
                    <div
                      key={sub.subjectName}
                      style={{
                        background: isFiltered
                          ? "#eff6ff"
                          : isImpossible
                          ? "#fffbeb"
                          : isSafe
                          ? "#ffffff"
                          : "#fff8f8",
                        border: isFiltered
                          ? "2px solid #2563eb"
                          : isImpossible
                          ? "2px solid #ea580c"
                          : isSafe
                          ? "1.5px solid #e2e8f0"
                          : "1.5px solid #fca5a5",
                        borderRadius: 14,
                        padding: "12px 14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        boxShadow: isImpossible
                          ? "0 3px 12px rgba(234, 88, 12, 0.12)"
                          : "0 1px 3px rgba(0,0,0,0.02)",
                        minWidth: 0,
                        width: "100%",
                        boxSizing: "border-box",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: effectiveIsMobile ? "column" : "row",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 6,
                          width: "100%",
                        }}
                      >
                        <div style={{ minWidth: 0, width: "100%" }}>
                          <div style={{ fontSize: 13, fontWeight: 900, color: "#0f172a", wordBreak: "break-word", lineHeight: 1.35 }}>
                            {sub.subjectName}
                          </div>
                          <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 1, wordBreak: "break-word" }}>
                            Missed on: {sub.missedDates.join(", ")} ({sub.bunkMissedCount} class{sub.bunkMissedCount > 1 ? "es" : ""})
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 900,
                            padding: "2px 7px",
                            borderRadius: 5,
                            background: isImpossible ? "#ea580c" : isSafe ? "#ecfdf5" : "#fef2f2",
                            color: isImpossible ? "#ffffff" : isSafe ? "#059669" : "#dc2626",
                            border: `1px solid ${isImpossible ? "#c2410c" : isSafe ? "#a7f3d0" : "#fecaca"}`,
                            whiteSpace: "nowrap",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            flexShrink: 0,
                          }}
                        >
                          {isImpossible ? (
                            <>
                              <AlertTriangle size={10} /> {simulation.targetPct}% Impossible (Max: {sub.maxPossiblePct}%)
                            </>
                          ) : isSafe ? (
                            "Above Target"
                          ) : (
                            `${sub.classesToTarget} Cls Needed`
                          )}
                        </span>
                      </div>

                      {/* Percentage drop */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4, fontSize: 11 }}>
                        <span style={{ color: "#64748b" }}>Attendance After Leave:</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ textDecoration: "line-through", color: "#94a3b8" }}>{sub.preBunkPct}%</span>
                          <ArrowRight size={10} color="#64748b" />
                          <strong style={{ color: isSafe ? "#059669" : "#dc2626" }}>{sub.postBunkPct}%</strong>
                          <span style={{ fontSize: 10, color: "#dc2626", fontWeight: 800 }}>({sub.bunkDropDelta}%)</span>
                        </div>
                      </div>

                      {/* If target is impossible: show the exact ceiling in a highlighted row */}
                      {isImpossible && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 4,
                            fontSize: 11,
                            background: "#fff7ed",
                            border: "1px solid #ffedd5",
                            padding: "4px 8px",
                            borderRadius: 6,
                          }}
                        >
                          <span style={{ color: "#9a3412", fontWeight: 700 }}>Semester Max Ceiling:</span>
                          <strong style={{ color: "#c2410c", fontWeight: 900 }}>
                            {sub.maxPossiblePct}% ({sub.totalRemainingInSemester} classes left)
                          </strong>
                        </div>
                      )}

                      {/* Recovery Milestone Date Box */}
                      <div
                        style={{
                          background: isImpossible ? "#fff7ed" : sub.milestoneDateStr ? "#f0fdf4" : "#f8fafc",
                          border: `1px solid ${isImpossible ? "#fed7aa" : sub.milestoneDateStr ? "#bbf7d0" : "#e2e8f0"}`,
                          borderRadius: 8,
                          padding: "8px 10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: 6,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
                          {isImpossible ? (
                            <AlertTriangle size={16} color="#ea580c" style={{ flexShrink: 0 }} />
                          ) : sub.milestoneDateStr ? (
                            <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                          ) : (
                            <ShieldCheck size={16} color="#059669" style={{ flexShrink: 0 }} />
                          )}
                          <div style={{ fontSize: 11, color: isImpossible ? "#9a3412" : "#0f172a", lineHeight: 1.35, wordBreak: "break-word" }}>
                            {isImpossible ? (
                              <span>
                                <strong>{simulation.targetPct}% unattainable.</strong> Max achievable is <strong>{sub.maxPossiblePct}%</strong> (Oct 31)
                              </span>
                            ) : sub.milestoneDateStr ? (
                              <span>
                                Recovers {simulation.targetPct}% on: <strong>{sub.milestoneDateStr}</strong> ({sub.classesToTarget} class{sub.classesToTarget > 1 ? "es" : ""})
                              </span>
                            ) : (
                              <span>
                                <strong>Safe:</strong> Attendance remains &ge; {simulation.targetPct}% ({sub.postBunkPct}%). No recovery needed!
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setRecoverySubjectFilter((prev) => (prev === sub.subjectName ? "ALL" : sub.subjectName))}
                          style={{
                            background: isFiltered
                              ? "#2563eb"
                              : isImpossible
                              ? "#ea580c"
                              : isSafe
                              ? "#f0fdf4"
                              : "#ffffff",
                            color: isFiltered || isImpossible
                              ? "#ffffff"
                              : isSafe
                              ? "#166534"
                              : "#2563eb",
                            border: isFiltered
                              ? "1px solid #1d4ed8"
                              : isImpossible
                              ? "1px solid #c2410c"
                              : isSafe
                              ? "1px solid #bbf7d0"
                              : "1px solid #cbd5e1",
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontSize: 10.5,
                            fontWeight: 800,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {isFiltered
                            ? "Showing"
                            : isImpossible
                            ? "View Max"
                            : isSafe
                            ? "Safe"
                            : "Filter Dates"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Subject Filter Pills for the Recovery Schedule ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
                <Filter size={12} /> Filter:
              </span>
              <button
                type="button"
                onClick={() => setRecoverySubjectFilter("ALL")}
                style={{
                  padding: "4px 9px",
                  borderRadius: 7,
                  border: recoverySubjectFilter === "ALL" ? "1.5px solid #0f172a" : "1px solid #cbd5e1",
                  background: recoverySubjectFilter === "ALL" ? "#0f172a" : "#ffffff",
                  color: recoverySubjectFilter === "ALL" ? "#ffffff" : "#475569",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                All Missed Subjects ({simulation.masterMissedRecoverySessions.length} classes)
              </button>
              {simulation.missedOnlySubjectsList.map((sub) => {
                const isSelected = recoverySubjectFilter === sub.subjectName;
                const count = sub.recoverySessionsList?.length || 0;
                const isImpossible = sub.isTargetImpossible;
                const isSafe = sub.isSafeAtTarget;

                return (
                  <button
                    key={sub.subjectName}
                    type="button"
                    onClick={() => setRecoverySubjectFilter(sub.subjectName)}
                    style={{
                      padding: "4px 9px",
                      borderRadius: 7,
                      border: isSelected
                        ? isSafe
                          ? "1.5px solid #16a34a"
                          : "1.5px solid #2563eb"
                        : isImpossible
                        ? "1.5px solid #ea580c"
                        : isSafe
                        ? "1px solid #bbf7d0"
                        : "1px solid #cbd5e1",
                      background: isSelected
                        ? isSafe
                          ? "#f0fdf4"
                          : "#eff6ff"
                        : isImpossible
                        ? "#fff7ed"
                        : isSafe
                        ? "#f8fafc"
                        : "#ffffff",
                      color: isSelected
                        ? isSafe
                          ? "#166534"
                          : "#1d4ed8"
                        : isImpossible
                        ? "#c2410c"
                        : isSafe
                        ? "#166534"
                        : "#475569",
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {isSafe ? (
                      <>
                        <ShieldCheck size={11} color={isSelected ? "#166534" : "#059669"} />
                        <span>{sub.subjectName}</span>
                        <span
                          style={{
                            fontSize: 9.5,
                            fontWeight: 800,
                            background: isSelected ? "#16a34a" : "#dcfce7",
                            color: isSelected ? "#ffffff" : "#166534",
                            padding: "1px 5px",
                            borderRadius: 4,
                          }}
                        >
                          Safe
                        </span>
                      </>
                    ) : isImpossible ? (
                      <>
                        <AlertTriangle size={11} color="#ea580c" />
                        <span>{sub.subjectName} ({count})</span>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 900,
                            background: "#ea580c",
                            color: "#ffffff",
                            padding: "1px 4px",
                            borderRadius: 3,
                          }}
                        >
                          Max {sub.maxPossiblePct}%
                        </span>
                      </>
                    ) : (
                      <>
                        <span>{sub.subjectName}</span>
                        <span
                          style={{
                            fontSize: 9.5,
                            fontWeight: 800,
                            background: isSelected ? "#2563eb" : "#f1f5f9",
                            color: isSelected ? "#ffffff" : "#475569",
                            padding: "1px 5px",
                            borderRadius: 4,
                          }}
                        >
                          {sub.classesToTarget} needed
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Exact Image 3 Card Grid: Mandatory Post-Absence Recovery Schedule ── */}
            {(() => {
              const selectedSubjectObj =
                recoverySubjectFilter !== "ALL"
                  ? simulation.missedOnlySubjectsList.find((s) => s.subjectName === recoverySubjectFilter)
                  : null;
              const isSelectedSubjectSafe = selectedSubjectObj?.isSafeAtTarget === true;

              return (
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                    padding: effectiveIsMobile ? "12px 10px" : "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    maxWidth: "100%",
                    boxSizing: "border-box",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: effectiveIsMobile ? "column" : "row",
                      justifyContent: "space-between",
                      alignItems: effectiveIsMobile ? "stretch" : "center",
                      gap: 10,
                      width: "100%",
                    }}
                  >
                    <div style={{ minWidth: 0, width: "100%" }}>
                      {isSelectedSubjectSafe ? (
                        <>
                          <h5 style={{ fontSize: effectiveIsMobile ? 13.5 : 14, fontWeight: 900, color: "#166534", margin: 0, display: "flex", alignItems: "center", gap: 6, wordBreak: "break-word" }}>
                            <ShieldCheck size={18} color="#059669" style={{ flexShrink: 0 }} />
                            {selectedSubjectObj.subjectName} is Safe &bull; 0 Recovery Classes Needed
                          </h5>
                          <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0", wordBreak: "break-word" }}>
                            Attendance remains at {selectedSubjectObj.postBunkPct}% (&ge; {simulation.targetPct}% target). No recovery classes required!
                          </p>
                        </>
                      ) : (
                        <>
                          <h5 style={{ fontSize: effectiveIsMobile ? 13.5 : 14, fontWeight: 900, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 6, wordBreak: "break-word" }}>
                            <CalendarCheck size={16} color="#059669" style={{ flexShrink: 0 }} />
                            {recoverySubjectFilter === "ALL"
                              ? `Classes You Need to Attend for Recovery (${filteredRecoverySessions.length} classes)`
                              : `${recoverySubjectFilter} Recovery Plan (${filteredRecoverySessions.length} classes)`}
                          </h5>
                          <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0", wordBreak: "break-word" }}>
                            {recoverySubjectFilter === "ALL"
                              ? `Attend these scheduled timetable classes consecutively to restore your attendance back to ${simulation.targetPct}%:`
                              : `Attend these scheduled ${recoverySubjectFilter} classes consecutively to restore your attendance back to ${simulation.targetPct}%:`}
                          </p>
                        </>
                      )}
                    </div>

                    {!isSelectedSubjectSafe && filteredRecoverySessions.length > 15 && (
                      <button
                        type="button"
                        onClick={() => setShowAllRecoveryDates(!showAllRecoveryDates)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 5,
                          background: "#f0fdf4",
                          color: "#166534",
                          border: "1px solid #bbf7d0",
                          padding: "6px 12px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: "pointer",
                          width: effectiveIsMobile ? "100%" : "auto",
                        }}
                      >
                        {showAllRecoveryDates ? (
                          <>
                            <ChevronUp size={14} /> Collapse List (Show First 15)
                          </>
                        ) : (
                          <>
                            <ChevronDown size={14} /> View All {filteredRecoverySessions.length} Recovery Dates
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Feasibility Notice if currently viewed subjects cannot reach targetPct */}
                  {(() => {
                    const impossibleInView = simulation.missedOnlySubjectsList.filter(
                      (s) => s.isTargetImpossible && (recoverySubjectFilter === "ALL" || recoverySubjectFilter === s.subjectName)
                    );
                    if (impossibleInView.length === 0) return null;
                    return (
                      <div
                        style={{
                          background: "#fff7ed",
                          border: "1px solid #fed7aa",
                          borderRadius: 10,
                          padding: "9px 12px",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 12,
                          color: "#9a3412",
                          lineHeight: 1.4,
                        }}
                      >
                        <AlertTriangle size={15} color="#ea580c" style={{ flexShrink: 0 }} />
                        <div>
                          <strong>Target {simulation.targetPct}% is mathematically out of reach</strong> for{" "}
                          {impossibleInView.map((s) => `${s.subjectName} (Ceiling: ${s.maxPossiblePct}%)`).join(", ")}.
                          Displaying all available recovery sessions up to your maximum possible ceiling before the semester ends on 31 Oct.
                        </div>
                      </div>
                    );
                  })()}

                  {/* Safe Subject Dedicated Card */}
                  {isSelectedSubjectSafe ? (
                    <div
                      style={{
                        background: "#f0fdf4",
                        border: "1.5px solid #bbf7d0",
                        borderRadius: 12,
                        padding: effectiveIsMobile ? "14px 12px" : "18px 20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <CheckCircle2 size={20} color="#16a34a" />
                        <span style={{ fontSize: 14, fontWeight: 900, color: "#166534" }}>
                          Safe Subject &bull; Attendance Won't Drop Below {simulation.targetPct}%
                        </span>
                      </div>
                      <p style={{ fontSize: 12.5, color: "#166534", margin: 0, lineHeight: 1.5 }}>
                        Even after taking leave on your selected dates ({selectedSubjectObj.bunkMissedCount} class{selectedSubjectObj.bunkMissedCount > 1 ? "es" : ""} missed), your attendance in <strong>{selectedSubjectObj.subjectName}</strong> will remain at <strong>{selectedSubjectObj.postBunkAttended}/{selectedSubjectObj.postBunkDelivered} ({selectedSubjectObj.postBunkPct}%)</strong>, which is comfortably above your <strong>{simulation.targetPct}%</strong> target threshold. You do not need any recovery classes for this subject!
                      </p>
                      <div>
                        <button
                          type="button"
                          onClick={() => setRecoverySubjectFilter("ALL")}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #86efac",
                            color: "#15803d",
                            padding: "6px 12px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <CalendarCheck size={13} /> View All Missed Subjects Needing Recovery ({simulation.masterMissedRecoverySessions.length} classes)
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Exact Card Grid from Image 3 */
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: effectiveIsMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: 10,
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    >
                      {visibleRecoverySessions.map((recSes, rIdx) => {
                        const isMilestone = recSes.isMilestoneTarget;
                        const isPeak = recSes.isMaxPeakSession;
                        const isImpossible = recSes.isTargetImpossible;

                        return (
                          <div
                            key={rIdx}
                            style={{
                              background: isMilestone ? "#f0fdf4" : isPeak ? "#fffbeb" : "#ffffff",
                              border: `1.5px solid ${isMilestone ? "#86efac" : isPeak ? "#f59e0b" : "#e2e8f0"}`,
                              borderRadius: 12,
                              padding: "10px 12px",
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                              boxShadow: isMilestone
                                ? "0 2px 8px rgba(34, 197, 94, 0.15)"
                                : isPeak
                                ? "0 2px 8px rgba(245, 158, 11, 0.2)"
                                : "0 1px 3px rgba(0,0,0,0.02)",
                              minWidth: 0,
                              width: "100%",
                              boxSizing: "border-box",
                              overflow: "hidden",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flexWrap: "wrap" }}>
                                <span
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: 900,
                                    background: isMilestone
                                      ? "#22c55e"
                                      : isPeak
                                      ? "#d97706"
                                      : recSes.isBufferSession
                                      ? "#64748b"
                                      : "#0f172a",
                                    color: "#ffffff",
                                    padding: "1px 6px",
                                    borderRadius: 5,
                                    flexShrink: 0,
                                  }}
                                >
                                  {recSes.isBufferSession
                                    ? `Buffer #${recSes.bufferIndex}`
                                    : recSes.classesNeededTotal > 0
                                    ? `Class ${recSes.subjectSessionNumber} of ${recSes.classesNeededTotal}`
                                    : `Recovery #${recSes.sessionNumber}`}
                                </span>
                                <span style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a" }}>
                                  {recSes.dateStr}
                                </span>
                              </div>

                              {isMilestone ? (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 900,
                                    background: "#dcfce7",
                                    color: "#15803d",
                                    border: "1px solid #86efac",
                                    padding: "1px 6px",
                                    borderRadius: 4,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                    flexShrink: 0,
                                  }}
                                >
                                  <Target size={11} /> {simulation.targetPct}% RESTORED!
                                </span>
                              ) : recSes.isBufferSession ? (
                                <span
                                  style={{
                                    fontSize: 9.5,
                                    fontWeight: 800,
                                    background: "#f1f5f9",
                                    color: "#475569",
                                    border: "1px solid #cbd5e1",
                                    padding: "1px 6px",
                                    borderRadius: 4,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                    flexShrink: 0,
                                  }}
                                >
                                  <ShieldCheck size={11} color="#059669" /> Safe Buffer
                                </span>
                              ) : isPeak ? (
                                <span
                                  style={{
                                    fontSize: 9.5,
                                    fontWeight: 900,
                                    background: "#fef3c7",
                                    color: "#b45309",
                                    border: "1px solid #fcd34d",
                                    padding: "1px 6px",
                                    borderRadius: 4,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                    flexShrink: 0,
                                  }}
                                >
                                  <TrendingUp size={11} /> Max Peak: {recSes.runningPercentage}%
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: 9.5,
                                    fontWeight: 900,
                                    background:
                                      recSes.type === "PR"
                                        ? "#faf5ff"
                                        : recSes.type === "TUT"
                                        ? "#fffbeb"
                                        : "#eff6ff",
                                    color:
                                      recSes.type === "PR"
                                        ? "#7c3aed"
                                        : recSes.type === "TUT"
                                        ? "#b45309"
                                        : "#1e40af",
                                    border: `1px solid ${
                                      recSes.type === "PR"
                                        ? "#ddd6fe"
                                        : recSes.type === "TUT"
                                        ? "#fde68a"
                                        : "#bfdbfe"
                                    }`,
                                    padding: "1px 5px",
                                    borderRadius: 4,
                                    flexShrink: 0,
                                  }}
                                >
                                  {recSes.type}
                                </span>
                              )}
                            </div>

                      <div style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a", wordBreak: "break-word" }}>
                        {recSes.subjectName}
                      </div>

                      <div style={{ fontSize: 11, color: "#64748b", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
                        <span>
                          <Clock size={11} style={{ display: "inline", verticalAlign: "middle" }} /> {recSes.timeSlot}
                        </span>
                        <span>Room {recSes.room}</span>
                      </div>

                      <div
                        style={{
                          marginTop: 4,
                          paddingTop: 6,
                          borderTop: "1px dashed #e2e8f0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 4,
                        }}
                      >
                        <span style={{ fontSize: 10.5, color: "#64748b", fontWeight: 600 }}>
                          {isPeak ? "Semester peak score:" : "After this recovery class:"}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: 11.5,
                              fontWeight: 900,
                              color: recSes.runningPercentage >= simulation.targetPct
                                ? "#16a34a"
                                : isPeak
                                ? "#b45309"
                                : "#2563eb",
                            }}
                          >
                            {recSes.runningAttended}/{recSes.runningDelivered} ({recSes.runningPercentage}%)
                          </span>
                          {isImpossible && !isPeak && (
                            <span style={{ fontSize: 9, color: "#9a3412", fontWeight: 700 }}>
                              (&rarr; max {recSes.maxPossiblePct}%)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!isSelectedSubjectSafe && filteredRecoverySessions.length > 15 && !showAllRecoveryDates && (
              <button
                type="button"
                onClick={() => setShowAllRecoveryDates(true)}
                style={{
                  background: "transparent",
                  border: "1px dashed #cbd5e1",
                  padding: "8px 12px",
                  borderRadius: 8,
                  color: "#2563eb",
                  fontSize: 11.5,
                  fontWeight: 800,
                  cursor: "pointer",
                  textAlign: "center",
                  marginTop: 4,
                }}
              >
                + Show remaining {filteredRecoverySessions.length - 15} recovery class dates until target
              </button>
            )}
          </div>
        );
      })()}
    </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  </div>
  );
}
