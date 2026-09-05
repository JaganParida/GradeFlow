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
  Sparkles,
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

  // ── Bunk Date Selection Handler ──────────────────────────────────────────
  const toggleBunkDate = (dayItem) => {
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
      .filter((d) => (d.dayName === "Friday" || d.dayName === "Saturday") && d.isInstructional)
      .map((d) => d.dateKey);

    if (instructionalKeys.length === 0) {
      setNonInstructionalNotice({
        title: "No Weekend Classes This Week",
        message: "Friday and Saturday in the currently viewed week have examinations or holidays. Use 'Next Week >' to plan for a weekend with regular classes.",
      });
      return;
    }
    setNonInstructionalNotice(null);
    setSelectedBunkKeys(instructionalKeys);
  };

  const applyPreset3Day = () => {
    const instructionalKeys = activeWeekDays
      .filter((d) => (d.dayName === "Thursday" || d.dayName === "Friday" || d.dayName === "Saturday") && d.isInstructional)
      .map((d) => d.dateKey);

    if (instructionalKeys.length === 0) {
      setNonInstructionalNotice({
        title: "No Classes This Thu-Sat",
        message: "Thursday through Saturday in this week have examinations or holidays. Use 'Next Week >' to select instructional days.",
      });
      return;
    }
    setNonInstructionalNotice(null);
    setSelectedBunkKeys(instructionalKeys);
  };

  const applyPresetFullWeek = () => {
    const instructionalKeys = activeWeekDays.filter((d) => d.isInstructional).map((d) => d.dateKey);
    if (instructionalKeys.length === 0) {
      setNonInstructionalNotice({
        title: "No Regular Classes This Week",
        message: "This entire week is marked for examinations or holidays. Tap 'Next Week >' to view and plan for regular class weeks.",
      });
      return;
    }
    setNonInstructionalNotice(null);
    setSelectedBunkKeys(instructionalKeys);
  };

  // ── Sorted Selected Bunk Dates ───────────────────────────────────────────
  const sortedBunkDates = useMemo(() => {
    if (selectedBunkKeys.length === 0) return [];
    return [...selectedBunkKeys].sort().map((k) => new Date(k + "T00:00:00"));
  }, [selectedBunkKeys]);

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
    // PHASE 2: BUNK DROP SIMULATION (Tracks exact subjects missed on each date)
    // ─────────────────────────────────────────────────────────────────────────
    const bunkDaysBreakdown = [];
    let cumulativeMissedClasses = 0;
    let runningOverallDelivered = preBunkOverallDel;
    const runningOverallAttended = preBunkOverallAtt;

    sortedBunkDates.forEach((bunkDate, index) => {
      const dKey = toDateKey(bunkDate);
      const isBunkDateToday = dKey === todayKey;
      const sched = getSectionScheduleForDate(selectedSection, bunkDate);
      const scheduledClasses = sched.isInstructional ? sched.classes || [] : [];
      const dateFormatted = formatFriendlyDate(bunkDate);

      // If bunking TODAY: only unmarked remaining classes are missed
      const classesToBunk = isBunkDateToday
        ? scheduledClasses.filter((cls) => !todayLogs[cls.slotIndex])
        : scheduledClasses;

      const alreadyMarkedToday = isBunkDateToday
        ? scheduledClasses.filter((cls) => Boolean(todayLogs[cls.slotIndex]))
        : [];

      const dayMissedCount = classesToBunk.length;
      cumulativeMissedClasses += dayMissedCount;
      runningOverallDelivered += dayMissedCount;

      const dayPostPct =
        runningOverallDelivered > 0
          ? Number(((runningOverallAttended / runningOverallDelivered) * 100).toFixed(2))
          : preBunkOverallPct;

      const classesDetail = scheduledClasses.map((cls) => {
        const cleanName = cls.cleanName || cleanSubjectBaseName(cls.subject);
        const subData = subjectMap.get(cleanName);
        const isClassMarked = isBunkDateToday && Boolean(todayLogs[cls.slotIndex]);
        const classMarkStatus = isClassMarked ? todayLogs[cls.slotIndex] : null;

        if (!isClassMarked) {
          if (subData) {
            subData.bunkMissedCount += 1;
            subData.postBunkDelivered += 1;
            if (!subData.missedDates.includes(dateFormatted)) {
              subData.missedDates.push(dateFormatted);
            }
            subData.missedPeriodsDetail.push({
              dateFormatted,
              dayName: sched.dayName,
              slotIndex: cls.slotIndex,
              timeSlot: cls.slot?.label || (TIME_SLOTS[cls.slotIndex]?.label || `Slot ${cls.slotIndex + 1}`),
              type: cls.type || "PP",
              room: cls.room || "Room TBA",
            });
          }
        }

        return {
          slotIndex: cls.slotIndex,
          timeSlot: cls.slot?.label || (TIME_SLOTS[cls.slotIndex]?.label || `Slot ${cls.slotIndex + 1}`),
          subjectName: cleanName,
          subCode: resolveSubjectCode({ subject: cleanName }, studentData),
          type: cls.type || "PP",
          room: cls.room || "Room TBA",
          faculty: cls.faculty || "Faculty",
          isAlreadyMarked: isClassMarked,
          markStatus: classMarkStatus,
        };
      });

      bunkDaysBreakdown.push({
        stepIndex: index + 1,
        date: bunkDate,
        dateKey: dKey,
        isToday: isBunkDateToday,
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
        cumulativeMissedSoFar: cumulativeMissedClasses,
        endOfDayOverallPct: dayPostPct,
        dayDelta: Number((dayPostPct - preBunkOverallPct).toFixed(2)),
      });
    });

    const postBunkOverallAtt = preBunkOverallAtt;
    const postBunkOverallDel = preBunkOverallDel + cumulativeMissedClasses;
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
      if (sub.bunkMissedCount > 0 || sub.preBunkClassesAdded > 0) {
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
      const upcoming = upcomingSemesterClassesMap.get(sub.subjectName) || [];
      let runningAtt = sub.postBunkAttended;
      let runningDel = sub.postBunkDelivered;
      let milestoneFound = false;
      let milestoneDateStr = null;
      let milestoneTimeSlot = null;

      // Determine how many classes to display:
      // - If impossible: display ALL remaining classes in semester ("jitna tak hoga utna hi dikhayega")
      // - If achievable: display up to classesToTarget + 2 buffer sessions (min 3)
      // - If already safe: display up to 2 buffer sessions
      let sessionLimit = upcoming.length;
      if (!sub.isTargetImpossible) {
        if (sub.isSafeAtTarget) {
          sessionLimit = Math.min(upcoming.length, 3);
        } else {
          sessionLimit = Math.min(upcoming.length, sub.classesToTarget + 2);
        }
      }

      const subSessions = [];

      for (let i = 0; i < sessionLimit; i++) {
        const cls = upcoming[i];
        runningAtt += 1;
        runningDel += 1;
        const runningPercentage = Number(((runningAtt / runningDel) * 100).toFixed(2));

        const isMilestone = !milestoneFound && runningPercentage >= targetPct;
        if (isMilestone) {
          milestoneFound = true;
          milestoneDateStr = cls.dateStr;
          milestoneTimeSlot = cls.timeSlot;
        }

        const isLastAvailable = i === upcoming.length - 1;
        const isMaxPeakSession = sub.isTargetImpossible && isLastAvailable;

        const sessionItem = {
          subjectSessionNumber: i + 1,
          date: cls.date,
          dateStr: cls.dateStr,
          dayName: cls.dayName,
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

    // Flatten and sort chronologically across all missed subjects
    const masterMissedRecoverySessions = [];
    subjectRecoverySessionsMap.forEach((sessions) => {
      masterMissedRecoverySessions.push(...sessions);
    });
    masterMissedRecoverySessions.sort((a, b) => a.date - b.date || a.timeSlot.localeCompare(b.timeSlot));
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", boxSizing: "border-box" }}>
      {/* ═══════════════════════════════════════════════════════════════════════
          HERO BANNER
      ═══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 18,
          padding: isMobile ? "16px 14px" : "20px 24px",
          color: "#0f172a",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02), 0 10px 24px -6px rgba(15, 23, 42, 0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
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
                fontSize: isMobile ? 20 : 24,
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
              Date-wise attendance simulation engine following official CUTM academic calendar & timetable. Simulates pre-bunk attendance accumulation, calculates sequential class drop, and generates exact post-absence recovery schedule.
            </p>
          </div>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              padding: "10px 16px",
              borderRadius: 14,
              display: "flex",
              flexDirection: "column",
              alignItems: isMobile ? "flex-start" : "flex-end",
              gap: 2,
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
          padding: isMobile ? "14px 12px" : "18px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
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
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              type="button"
              onClick={() => {
                setWeekOffset((prev) => prev - 1);
                setNonInstructionalNotice(null);
              }}
              style={{
                padding: "5px 9px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                color: "#334155",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <ChevronLeft size={14} />
              <span>Prev Week</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setWeekOffset(0);
                setNonInstructionalNotice(null);
              }}
              style={{
                padding: "5px 10px",
                borderRadius: 8,
                border: weekOffset === 0 ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                background: weekOffset === 0 ? "#eff6ff" : "#f8fafc",
                color: weekOffset === 0 ? "#2563eb" : "#334155",
                fontSize: 11.5,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => {
                setWeekOffset((prev) => prev + 1);
                setNonInstructionalNotice(null);
              }}
              style={{
                padding: "5px 9px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                color: "#334155",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span>Next Week</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Notice Banner if week is suspended for Exams / Holidays */}
        {weekInstructionalCount === 0 && (
          <div
            style={{
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              borderRadius: 12,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={16} color="#ea580c" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: "#9a3412", lineHeight: 1.4 }}>
                <strong>Examinations / Holidays Scheduled This Week:</strong> Regular timetable classes are suspended during this week per the academic calendar. Routine classes resume on next week (14 Sept onwards).
              </div>
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
                borderRadius: 7,
                padding: "5px 11px",
                fontSize: 11.5,
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                flexShrink: 0,
              }}
            >
              <span>Jump to Class Week (14 Sept)</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}

        {/* Non-Instructional / Today Notice Banner */}
        {nonInstructionalNotice && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 10,
              padding: "9px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              fontSize: 12,
              color: "#991b1b",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Info size={15} color="#dc2626" style={{ flexShrink: 0 }} />
              <span>{nonInstructionalNotice.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNonInstructionalNotice(null)}
              style={{ background: "transparent", border: "none", color: "#991b1b", cursor: "pointer", padding: 0 }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Date Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(6, 1fr)",
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
                onClick={() => toggleBunkDate(dayItem)}
                style={{
                  background: isSelected
                    ? "#fef2f2"
                    : !isInstructional
                    ? "#f8fafc"
                    : isToday
                    ? "#f8fafc"
                    : isPast
                    ? "#fcfcfd"
                    : "#ffffff",
                  border: isSelected
                    ? "2px solid #dc2626"
                    : isToday
                    ? "2px solid #2563eb"
                    : !isInstructional
                    ? "1px dashed #cbd5e1"
                    : "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: "10px 8px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  opacity: !isInstructional ? 0.85 : isPast && !isSelected ? 0.75 : 1,
                  boxShadow: isSelected
                    ? "0 4px 12px rgba(220, 38, 38, 0.12)"
                    : isToday
                    ? "0 2px 8px rgba(37, 99, 235, 0.08)"
                    : "0 1px 2px rgba(0,0,0,0.02)",
                  position: "relative",
                }}
              >
                {/* Top Right Status: Checkbox or Lock */}
                <div
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    background: isSelected ? "#dc2626" : !isInstructional ? "#f1f5f9" : "transparent",
                    border: isSelected ? "none" : !isInstructional ? "none" : "1px solid #cbd5e1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isSelected ? "#ffffff" : "#94a3b8",
                  }}
                >
                  {isSelected ? (
                    <Check size={11} strokeWidth={3} />
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
                      color: isSelected ? "#991b1b" : !isInstructional ? "#64748b" : "#0f172a",
                    }}
                  >
                    {isMobile ? dayItem.dayName.slice(0, 3) : dayItem.dayName}
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
                    color: isSelected ? "#dc2626" : "#64748b",
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
          EMPTY STATE
      ═══════════════════════════════════════════════════════════════════════ */}
      {!simulation && (
        <div
          style={{
            background: "#f8fafc",
            border: "1.5px dashed #cbd5e1",
            borderRadius: 18,
            padding: "36px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              background: "#eff6ff",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CalendarIcon size={26} />
          </div>
          <div style={{ maxWidth: 460 }}>
            <h4 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: "0 0 4px 0" }}>
              No Bunk Date Selected
            </h4>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
              Tap any date above with scheduled classes to simulate your future attendance, sequential class drops, and recovery roadmap. If viewing an examination week, tap <strong>"Next Week &gt;"</strong> to select regular class dates.
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          ACTIVE SIMULATION: 3-PHASE RECOVERY & PREDICTION ENGINE
      ═══════════════════════════════════════════════════════════════════════ */}
      {simulation && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
                padding: isMobile ? "14px 12px" : "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
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
                    }}
                  >
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Phase 1 &bull; Pre-Bunk Attendance Accumulation
                    </span>
                    <h4 style={{ fontSize: 14.5, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                      Attend Scheduled Classes Before Bunking
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
                  }}
                >
                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Eve of Bunk:</span>
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
                    <strong>Today's Activity:</strong> {todayMarkedClasses.length} class(es) were already logged in Daily Hub ({todayPresentCount} present, {todayAbsentCount} absent) and are included in your current baseline. Only the {todayUnmarkedClasses.length} remaining upcoming class(es) today are added to this pre-bunk roadmap.
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
                  Day-by-Day Pre-Bunk Schedule ({simulation.preBunkDays.length} Days):
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
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12.5, fontWeight: 900, color: "#0f172a" }}>
                          {pDay.dateFormatted} ({pDay.dayName}) &bull; {pDay.classesCount} Classes {pDay.isToday ? "(Today)" : "Scheduled"}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#059669" }}>
                          Day-End Overall: {pDay.dayEndOverallPct}%
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: 6 }}>
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
              padding: isMobile ? "16px 14px" : "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                  }}
                >
                  <TrendingDown size={16} />
                </div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Phase 2 &bull; Bunk Drop Simulation
                  </span>
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                    {simulation.bunkDaysBreakdown.length === 1
                      ? `Absence on ${simulation.firstBunkDateFormatted}`
                      : `Multi-Day Absence (${simulation.bunkDaysBreakdown.length} days: ${simulation.firstBunkDateFormatted} to ${simulation.lastBunkDateFormatted})`}
                  </h3>
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
                gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
                gap: 10,
              }}
            >
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Pre-Bunk Eve Pct</span>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", marginTop: 2 }}>
                  {simulation.preBunkOverallPct}%
                </div>
              </div>

              <div style={{ background: "#fef2f2", padding: "12px", borderRadius: 12, border: "1px solid #fee2e2" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#991b1b" }}>Total Classes Missed</span>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#dc2626", marginTop: 2 }}>
                  {simulation.cumulativeMissedClasses} Classes
                </div>
              </div>

              <div style={{ background: "#fff7ed", padding: "12px", borderRadius: 12, border: "1px solid #ffedd5" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#9a3412" }}>Bunk Drop Delta</span>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#ea580c", marginTop: 2 }}>
                  {simulation.totalBunkDropDelta}%
                </div>
              </div>

              <div
                style={{
                  background: simulation.isOverallSafeAtTarget ? "#f0fdf4" : "#fef2f2",
                  padding: "12px",
                  borderRadius: 12,
                  border: `1px solid ${simulation.isOverallSafeAtTarget ? "#bbf7d0" : "#fecaca"}`,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: simulation.isOverallSafeAtTarget ? "#166534" : "#991b1b" }}>
                  Post-Bunk Attendance
                </span>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: simulation.isOverallSafeAtTarget ? "#15803d" : "#dc2626",
                    marginTop: 2,
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
                  {simulation.impossibleSubjectsList.map((s) => `${s.subjectName} (Max: ${s.maxPossiblePct}%)`).join(", ")}. Even with 100% attendance in all scheduled classes until semester end (Oct 31), {simulation.targetPct}% cannot be achieved. See Phase 3 for full recovery roadmap up to maximum achievable ceiling.
                </div>
              </div>
            )}

            {/* Sequential Drop Breakdown per Bunk Date */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Subjects & Classes Missed on Chosen Bunk Dates:
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {simulation.bunkDaysBreakdown.map((bDay) => (
                  <div
                    key={bDay.dateKey}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            background: "#e2e8f0",
                            color: "#334155",
                            fontSize: 11,
                            fontWeight: 800,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
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
                          }}
                        >
                          {bDay.isToday && bDay.alreadyMarkedCount > 0
                            ? `${bDay.classesMissedCount} Remaining Missed (${bDay.alreadyMarkedCount} marked earlier)`
                            : bDay.isInstructional
                            ? `${bDay.classesMissedCount} Classes Missed`
                            : bDay.holidayTitle || "Holiday (0 Missed)"}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: "#64748b" }}>Overall after this day:</span>
                        <span style={{ fontSize: 12.5, fontWeight: 900, color: bDay.endOfDayOverallPct >= 75 ? "#0f172a" : "#dc2626" }}>
                          {bDay.endOfDayOverallPct}%
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#dc2626" }}>
                          ({bDay.dayDelta}%)
                        </span>
                      </div>
                    </div>

                    {/* Classes missed on this specific day */}
                    {bDay.classes.length > 0 && (
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
                    )}
                  </div>
                ))}
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
              padding: isMobile ? "16px 14px" : "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {/* Header & Target Selector */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
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
                    marginBottom: 4,
                  }}
                >
                  <Target size={13} />
                  <span>Phase 3 &bull; Recovery Engine For Missed Subjects</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                  Timetable Recovery Plan (Starts {simulation.firstReturnDateFormatted})
                </h3>
                <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
                  Every upcoming class you must attend to recover attendance in the subjects missed during your leave:
                </p>
              </div>

              {/* Target Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {[75, 80, 85, 90].map((tVal) => {
                  const isTargetSelected = recoveryTargetPct === tVal;
                  return (
                    <button
                      key={tVal}
                      type="button"
                      onClick={() => setRecoveryTargetPct(tVal)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: isTargetSelected ? "2px solid #2563eb" : "1px solid #cbd5e1",
                        background: isTargetSelected ? "#eff6ff" : "#ffffff",
                        color: isTargetSelected ? "#1d4ed8" : "#334155",
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
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
                Target Recovery Milestones for Missed Subjects:
              </span>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(310px, 1fr))",
                  gap: 10,
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
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 900, color: "#0f172a" }}>
                            {sub.subjectName}
                          </div>
                          <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 1 }}>
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
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11 }}>
                        <span style={{ color: "#64748b" }}>Post-Bunk Score:</span>
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
                          gap: 6,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {isImpossible ? (
                            <AlertTriangle size={15} color="#ea580c" style={{ flexShrink: 0 }} />
                          ) : (
                            <Sparkles size={14} color={sub.milestoneDateStr ? "#16a34a" : "#64748b"} style={{ flexShrink: 0 }} />
                          )}
                          <div style={{ fontSize: 11, color: isImpossible ? "#9a3412" : "#0f172a", lineHeight: 1.35 }}>
                            {isImpossible ? (
                              <span>
                                <strong>{simulation.targetPct}% unattainable.</strong> Max achievable is <strong>{sub.maxPossiblePct}%</strong> (Oct 31)
                              </span>
                            ) : sub.milestoneDateStr ? (
                              <span>
                                Recovers {simulation.targetPct}% on: <strong>{sub.milestoneDateStr}</strong>
                              </span>
                            ) : (
                              <span>Attendance remains &ge; {simulation.targetPct}%</span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setRecoverySubjectFilter((prev) => (prev === sub.subjectName ? "ALL" : sub.subjectName))}
                          style={{
                            background: isFiltered ? "#2563eb" : isImpossible ? "#ea580c" : "#ffffff",
                            color: isFiltered || isImpossible ? "#ffffff" : "#2563eb",
                            border: isFiltered ? "1px solid #1d4ed8" : isImpossible ? "1px solid #c2410c" : "1px solid #cbd5e1",
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontSize: 10.5,
                            fontWeight: 800,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {isFiltered ? "Showing" : isImpossible ? "View Max" : "Filter Dates"}
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
                return (
                  <button
                    key={sub.subjectName}
                    type="button"
                    onClick={() => setRecoverySubjectFilter(sub.subjectName)}
                    style={{
                      padding: "4px 9px",
                      borderRadius: 7,
                      border: isSelected
                        ? "1.5px solid #2563eb"
                        : isImpossible
                        ? "1.5px solid #ea580c"
                        : "1px solid #cbd5e1",
                      background: isSelected
                        ? "#eff6ff"
                        : isImpossible
                        ? "#fff7ed"
                        : "#ffffff",
                      color: isSelected
                        ? "#1d4ed8"
                        : isImpossible
                        ? "#c2410c"
                        : "#475569",
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {isImpossible && <AlertTriangle size={11} color="#ea580c" />}
                    <span>{sub.subjectName} ({count})</span>
                    {isImpossible && (
                      <span style={{ fontSize: 9, fontWeight: 900, background: "#ea580c", color: "#ffffff", padding: "1px 4px", borderRadius: 3 }}>
                        Max {sub.maxPossiblePct}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Exact Image 3 Card Grid: Mandatory Post-Absence Recovery Schedule ── */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h5 style={{ fontSize: 14, fontWeight: 900, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                    <CalendarCheck size={16} color="#059669" />
                    Mandatory Post-Absence Recovery Schedule ({filteredRecoverySessions.length} total classes)
                  </h5>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
                    Every class you must consecutively attend post-absence to restore your {simulation.targetPct}% attendance goal:
                  </p>
                </div>

                {filteredRecoverySessions.length > 15 && (
                  <button
                    type="button"
                    onClick={() => setShowAllRecoveryDates(!showAllRecoveryDates)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      background: "#f0fdf4",
                      color: "#16a34a",
                      border: "1px solid #bbf7d0",
                      padding: "5px 12px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
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

              {/* Exact Card Grid from Image 3 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 10,
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
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 900,
                              background: isMilestone ? "#22c55e" : isPeak ? "#d97706" : "#0f172a",
                              color: "#ffffff",
                              padding: "1px 6px",
                              borderRadius: 5,
                            }}
                          >
                            Recovery #{recSes.sessionNumber}
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
                            }}
                          >
                            <Target size={11} /> {simulation.targetPct}% RESTORED!
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
                            }}
                          >
                            <Sparkles size={11} /> Max Peak: {recSes.runningPercentage}%
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
                            }}
                          >
                            {recSes.type}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a" }}>
                        {recSes.subjectName}
                      </div>

                      <div style={{ fontSize: 11, color: "#64748b", display: "flex", justifyContent: "space-between" }}>
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
                        }}
                      >
                        <span style={{ fontSize: 10.5, color: "#64748b", fontWeight: 600 }}>
                          {isPeak ? "Semester peak score:" : "After this recovery class:"}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
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

              {filteredRecoverySessions.length > 15 && !showAllRecoveryDates && (
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
          </motion.div>
        </div>
      )}
    </div>
  );
}
