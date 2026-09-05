import React, { useState, useMemo } from "react";
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
}) {
  // ── Baseline Attendance ──────────────────────────────────────────────────
  const currentOverallAtt = overallCalculation.totalAttended || 0;
  const currentOverallDel = overallCalculation.totalDelivered || 0;
  const currentOverallPct =
    currentOverallDel > 0
      ? Number(((currentOverallAtt / currentOverallDel) * 100).toFixed(2))
      : (overallCalculation.percentage || 100);

  // Reference Today (Midnight)
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayKey = useMemo(() => toDateKey(today), [today]);

  // ── State Management ─────────────────────────────────────────────────────
  // Week navigation offset (0 = current week, 1 = next week, etc.)
  const [weekOffset, setWeekOffset] = useState(0);

  // Selected Bunk Dates (Array of 'YYYY-MM-DD' strings)
  const [selectedBunkKeys, setSelectedBunkKeys] = useState([]);

  // Non-instructional date notice (e.g. when user clicks on an exam or holiday date)
  const [nonInstructionalNotice, setNonInstructionalNotice] = useState(null);

  // Recovery Target Percentage (default 75%, can be 80%, 85%, 90%)
  const [recoveryTargetPct, setRecoveryTargetPct] = useState(75);

  // Phase 1 Detail Toggle: Summary vs Day-by-Day Detailed Schedule
  const [preBunkViewMode, setPreBunkViewMode] = useState("detailed"); // "detailed" | "summary"

  // Phase 3 view controls
  const [roadmapViewTab, setRoadmapViewTab] = useState("chronological"); // "chronological" | "by_subject"
  const [showAllRecoveryDates, setShowAllRecoveryDates] = useState(false);
  const [expandedSubjects, setExpandedSubjects] = useState({});

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

  // ── Bunk Date Selection Handler (With Exam & Holiday Safeguards) ─────────
  const toggleBunkDate = (dayItem) => {
    if (!dayItem.isInstructional) {
      // Show clean, accurate notice that this date has no regular timetable classes
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
          ? `Examinations are scheduled on ${dayItem.dateFormatted} (${reasonTitle}). Regular theory & practice timetable classes are suspended, so routine attendance cannot be bunked.`
          : dayItem.isHoliday
          ? `University is closed on ${dayItem.dateFormatted} for ${reasonTitle}. No routine classes are conducted.`
          : `University is closed on Sundays. No classes are scheduled.`,
      });
      return;
    }

    // Dismiss notice when clicking an instructional day
    setNonInstructionalNotice(null);
    setSelectedBunkKeys((prev) =>
      prev.includes(dayItem.dateKey)
        ? prev.filter((k) => k !== dayItem.dateKey)
        : [...prev, dayItem.dateKey]
    );
  };

  // ── Quick Presets Handlers (Selects only instructional days) ─────────────
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
  // 3-PHASE MASTER FUTURE PREDICTOR ENGINE
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
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 1: PRE-BUNK ACCUMULATION (Today <= d < firstBunkDate)
    // Tracks day-by-day and subject-by-subject attendance climbing
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

        if (sched.isInstructional && sched.classes && sched.classes.length > 0) {
          const dayClassesWithImpact = [];

          sched.classes.forEach((cls) => {
            preBunkTotalClasses++;
            const cleanName = cls.cleanName || cleanSubjectBaseName(cls.subject);
            const subData = subjectMap.get(cleanName);

            const prevSubAtt = subData ? subData.preBunkAttended : 0;
            const prevSubDel = subData ? subData.preBunkDelivered : 0;
            const prevSubPct = prevSubDel > 0 ? (prevSubAtt / prevSubDel) * 100 : 100;

            if (subData) {
              subData.preBunkAttended += 1;
              subData.preBunkDelivered += 1;
              subData.preBunkClassesAdded += 1;
            }

            const newSubAtt = subData ? subData.preBunkAttended : 0;
            const newSubDel = subData ? subData.preBunkDelivered : 0;
            const newSubPct = newSubDel > 0 ? (newSubAtt / newSubDel) * 100 : 100;
            const subDelta = Number((newSubPct - prevSubPct).toFixed(2));

            runningAccumAtt += 1;
            runningAccumDel += 1;
            const overallPctAfterClass = Number(((runningAccumAtt / runningAccumDel) * 100).toFixed(2));

            dayClassesWithImpact.push({
              slotIndex: cls.slotIndex,
              timeSlot: cls.slot?.label || (TIME_SLOTS[cls.slotIndex]?.label || `Slot ${cls.slotIndex + 1}`),
              subjectName: cleanName,
              subCode: resolveSubjectCode({ subject: cleanName }, studentData),
              type: cls.type || "PP",
              room: cls.room || "Room TBA",
              faculty: cls.faculty || "Faculty",
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
            classesCount: sched.classes.length,
            classes: dayClassesWithImpact,
            dayEndOverallPct: Number(((runningAccumAtt / runningAccumDel) * 100).toFixed(2)),
          });
        }
        scanDate.setDate(scanDate.getDate() + 1);
      }
    }

    // Overall Pre-Bunk Attendance State (Eve of Bunk)
    const preBunkOverallAtt = currentOverallAtt + preBunkTotalClasses;
    const preBunkOverallDel = currentOverallDel + preBunkTotalClasses;
    const preBunkOverallPct =
      preBunkOverallDel > 0
        ? Number(((preBunkOverallAtt / preBunkOverallDel) * 100).toFixed(2))
        : currentOverallPct;
    const preBunkGainDelta = Number((preBunkOverallPct - currentOverallPct).toFixed(2));

    // Calculate final pre-bunk percentage for each subject
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
    // PHASE 2: BUNK DROP SIMULATION (Selected Dates)
    // ─────────────────────────────────────────────────────────────────────────
    const bunkDaysBreakdown = [];
    let cumulativeMissedClasses = 0;
    let runningOverallDelivered = preBunkOverallDel;
    const runningOverallAttended = preBunkOverallAtt;

    sortedBunkDates.forEach((bunkDate, index) => {
      const dKey = toDateKey(bunkDate);
      const sched = getSectionScheduleForDate(selectedSection, bunkDate);
      const scheduledClasses = sched.isInstructional ? sched.classes || [] : [];
      const dayClassesCount = scheduledClasses.length;

      cumulativeMissedClasses += dayClassesCount;
      runningOverallDelivered += dayClassesCount;

      const dayPostPct =
        runningOverallDelivered > 0
          ? Number(((runningOverallAttended / runningOverallDelivered) * 100).toFixed(2))
          : preBunkOverallPct;

      const missedClassesDetail = scheduledClasses.map((cls) => {
        const cleanName = cls.cleanName || cleanSubjectBaseName(cls.subject);
        const subData = subjectMap.get(cleanName);
        if (subData) {
          subData.bunkMissedCount += 1;
          subData.postBunkDelivered += 1;
        }
        return {
          slotIndex: cls.slotIndex,
          timeSlot: cls.slot?.label || (TIME_SLOTS[cls.slotIndex]?.label || `Slot ${cls.slotIndex + 1}`),
          subjectName: cleanName,
          subCode: resolveSubjectCode({ subject: cleanName }, studentData),
          type: cls.type || "PP",
          room: cls.room || "Room TBA",
          faculty: cls.faculty || "Faculty",
        };
      });

      bunkDaysBreakdown.push({
        stepIndex: index + 1,
        date: bunkDate,
        dateKey: dKey,
        dayName: sched.dayName,
        dateFormatted: formatFriendlyDate(bunkDate),
        isInstructional: sched.isInstructional,
        isHoliday: sched.isOfficialHoliday,
        holidayTitle: sched.title,
        isExam: sched.isExam,
        classesCount: dayClassesCount,
        classes: missedClassesDetail,
        cumulativeMissedSoFar: cumulativeMissedClasses,
        endOfDayOverallPct: dayPostPct,
        dayDelta: Number((dayPostPct - preBunkOverallPct).toFixed(2)),
      });
    });

    // Final Post-Bunk Overall Stats
    const postBunkOverallAtt = preBunkOverallAtt;
    const postBunkOverallDel = preBunkOverallDel + cumulativeMissedClasses;
    const postBunkOverallPct =
      postBunkOverallDel > 0
        ? Number(((postBunkOverallAtt / postBunkOverallDel) * 100).toFixed(2))
        : preBunkOverallPct;
    const totalBunkDropDelta = Number((postBunkOverallPct - preBunkOverallPct).toFixed(2));
    const netChangeFromCurrent = Number((postBunkOverallPct - currentOverallPct).toFixed(2));

    // Calculate subject-wise post-bunk percentage and classes needed to reach target
    const targetPct = Number(recoveryTargetPct) || 75;
    const affectedSubjectsList = [];
    const criticalSubjectsList = [];

    subjectMap.forEach((sub) => {
      if (sub.bunkMissedCount > 0 || sub.preBunkClassesAdded > 0) {
        sub.postBunkPct =
          sub.postBunkDelivered > 0
            ? Number(((sub.postBunkAttended / sub.postBunkDelivered) * 100).toFixed(2))
            : sub.preBunkPct;
        sub.bunkDropDelta = Number((sub.postBunkPct - sub.preBunkPct).toFixed(2));
        sub.netChange = Number((sub.postBunkPct - sub.currentPct).toFixed(2));
        sub.isSafeAtTarget = sub.postBunkPct >= targetPct;

        let classesToTarget = 0;
        if (sub.postBunkPct < targetPct) {
          const num = (targetPct / 100) * sub.postBunkDelivered - sub.postBunkAttended;
          const den = 1 - targetPct / 100;
          classesToTarget = Math.max(1, Math.ceil(num / den));
        }
        sub.classesToTarget = classesToTarget;
        sub.code = resolveSubjectCode({ subject: sub.subjectName }, studentData);

        affectedSubjectsList.push(sub);
        if (!sub.isSafeAtTarget) {
          criticalSubjectsList.push(sub);
        }
      }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 3: POST-BUNK RECOVERY SCHEDULE (Strictly matches Image 3 Card Grid)
    // ─────────────────────────────────────────────────────────────────────────
    let overallClassesToTarget = 0;
    if (postBunkOverallPct < targetPct) {
      const num = (targetPct / 100) * postBunkOverallDel - postBunkOverallAtt;
      const den = 1 - targetPct / 100;
      overallClassesToTarget = Math.max(1, Math.ceil(num / den));
    }

    const recoverySessions = [];
    const scanRecoveryDate = new Date(lastBunkDate);
    const lastSessionDate = new Date(CUTM_SESSION_BOUNDARIES?.lastDateOfInstruction || "2026-10-31T23:59:59");

    let runningRecovAtt = postBunkOverallAtt;
    let runningRecovDel = postBunkOverallDel;
    let milestoneDateReached = null;
    let milestoneSession = null;
    let alreadyMarkedMilestone = false;

    let safetyGuard = 0;
    const maxRecoverySessionsToSimulate = Math.max(overallClassesToTarget + 6, 20);

    while (
      scanRecoveryDate <= lastSessionDate &&
      recoverySessions.length < maxRecoverySessionsToSimulate &&
      safetyGuard < 60
    ) {
      scanRecoveryDate.setDate(scanRecoveryDate.getDate() + 1);
      safetyGuard++;

      if (scanRecoveryDate > lastSessionDate) break;

      const sched = getSectionScheduleForDate(selectedSection, scanRecoveryDate);
      if (!sched.isInstructional || !sched.classes || sched.classes.length === 0) {
        continue;
      }

      for (const cls of sched.classes) {
        if (recoverySessions.length >= maxRecoverySessionsToSimulate) break;

        const cleanName = cls.cleanName || cleanSubjectBaseName(cls.subject);
        runningRecovAtt += 1;
        runningRecovDel += 1;
        const newOverallPct = Number(((runningRecovAtt / runningRecovDel) * 100).toFixed(2));

        const isMilestoneTarget = !alreadyMarkedMilestone && newOverallPct >= targetPct;
        if (isMilestoneTarget) {
          alreadyMarkedMilestone = true;
          milestoneDateReached = formatFriendlyDate(scanRecoveryDate, {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          });
        }

        const sessionItem = {
          sessionNumber: recoverySessions.length + 1,
          date: new Date(scanRecoveryDate),
          dateStr: formatFriendlyDate(scanRecoveryDate),
          dayName: sched.dayName,
          timeSlot: cls.slot?.label || (TIME_SLOTS[cls.slotIndex]?.label || `Slot ${cls.slotIndex + 1}`),
          subjectName: cleanName,
          subCode: resolveSubjectCode({ subject: cleanName }, studentData),
          room: cls.room || `CSE-F-AR-${310 + ((cls.slotIndex || 0) % 8)}`,
          faculty: cls.faculty || "Faculty",
          type: cls.type || "PP",
          runningAttended: runningRecovAtt,
          runningDelivered: runningRecovDel,
          runningPercentage: newOverallPct,
          isMilestoneTarget,
        };

        if (isMilestoneTarget) {
          milestoneSession = sessionItem;
        }

        recoverySessions.push(sessionItem);
      }
    }

    // First instructional return date after bunk
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
      affectedSubjectsList,
      criticalSubjectsList,
      overallClassesToTarget,
      milestoneDateReached,
      milestoneSession,
      recoverySessions,
      targetPct,
    };
  }, [
    sortedBunkDates,
    firstBunkDate,
    lastBunkDate,
    today,
    currentOverallAtt,
    currentOverallDel,
    currentOverallPct,
    allSectionSubjects,
    selectedSection,
    studentData,
    recoveryTargetPct,
  ]);

  const visibleRecoverySessions = useMemo(() => {
    if (!simulation?.recoverySessions) return [];
    if (showAllRecoveryDates) return simulation.recoverySessions;
    return simulation.recoverySessions.slice(0, 15);
  }, [simulation?.recoverySessions, showAllRecoveryDates]);

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

        {/* ── Quick Vacation Presets ── */}
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
          DATE WITH DAY SELECTOR (HONORS EXAMS & HOLIDAYS)
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

        {/* ── Notice Banner if week is suspended for Exams / Holidays ── */}
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

        {/* ── Non-Instructional Click Notice ── */}
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

        {/* ── Date Cards Grid (Follows getSectionScheduleForDate) ── */}
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
                {/* Top Right Status: Checkbox (Instructional) or Lock (Non-Instructional) */}
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
                      ? "#ecfdf5"
                      : "#f1f5f9",
                    color: isSelected
                      ? "#b91c1c"
                      : dayItem.isExam
                      ? "#c2410c"
                      : dayItem.isHoliday
                      ? "#b45309"
                      : isInstructional
                      ? "#047857"
                      : "#64748b",
                  }}
                >
                  {isSelected
                    ? "Planned Bunk"
                    : dayItem.isExam
                    ? "Exams (No Class)"
                    : dayItem.isHoliday
                    ? "Holiday (Closed)"
                    : isInstructional
                    ? `${dayItem.totalClasses} Classes`
                    : "No Class"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          EMPTY STATE: WHEN NO DATES ARE SELECTED
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
              PHASE 1: PRE-BUNK ATTENDANCE ACCUMULATION (MATCHES IMAGE 2 + DETAILS)
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
                From today until the day before your planned leave ({formatFriendlyDate(new Date(simulation.firstBunkDate.getTime() - 86400000))}), if you attend all <strong>{simulation.preBunkTotalClasses} scheduled classes</strong> across your timetable, your overall attendance will rise from <strong>{currentOverallPct}%</strong> to <strong>{simulation.preBunkOverallPct}%</strong> before taking leave.
              </p>

              {/* Summary Subject Chips (Exact Image 2) */}
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
                          {pDay.dateFormatted} ({pDay.dayName}) &bull; {pDay.classesCount} Classes Attended
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
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              borderRadius: 8,
                              padding: "6px 8px",
                              display: "flex",
                              flexDirection: "column",
                              gap: 3,
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
                              <strong style={{ color: "#059669" }}>
                                {cls.prevSubPct}% &rarr; {cls.newSubPct}% (+{cls.subDelta}%)
                              </strong>
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
                      ? `Single-Day Absence on ${simulation.firstBunkDateFormatted}`
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
                  background: simulation.isOverallSafeAtTarget
                    ? simulation.criticalSubjectsList.length === 0
                      ? "#ecfdf5"
                      : "#fffbeb"
                    : "#fef2f2",
                  color: simulation.isOverallSafeAtTarget
                    ? simulation.criticalSubjectsList.length === 0
                      ? "#047857"
                      : "#b45309"
                    : "#dc2626",
                  border: `1px solid ${
                    simulation.isOverallSafeAtTarget
                      ? simulation.criticalSubjectsList.length === 0
                        ? "#a7f3d0"
                        : "#fde68a"
                      : "#fecaca"
                  }`,
                }}
              >
                {simulation.isOverallSafeAtTarget ? (
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

            {/* Sequential Bunk Days Breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Sequential Drop After Each Missed Day:
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {simulation.bunkDaysBreakdown.map((bDay) => (
                  <div
                    key={bDay.dateKey}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: 10,
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
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
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a" }}>
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
                        {bDay.isInstructional ? `${bDay.classesCount} Classes Missed` : bDay.holidayTitle || "Holiday (0 Missed)"}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "#64748b" }}>Cumulative Overall:</span>
                      <span style={{ fontSize: 12.5, fontWeight: 900, color: bDay.endOfDayOverallPct >= 75 ? "#0f172a" : "#dc2626" }}>
                        {bDay.endOfDayOverallPct}%
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#dc2626" }}>
                        ({bDay.dayDelta}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Course-Wise Bunk Impact Accordion */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Course-Wise Bunk Impact:
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {simulation.affectedSubjectsList.map((sub) => {
                  const isSafe = sub.isSafeAtTarget;
                  const isExpanded = expandedSubjects[sub.subjectName];

                  return (
                    <div
                      key={sub.subjectName}
                      style={{
                        border: isSafe ? "1px solid #e2e8f0" : "1px solid #fca5a5",
                        background: isSafe ? "#ffffff" : "#fff5f5",
                        borderRadius: 12,
                        padding: "10px 14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                        }}
                        onClick={() => toggleSubjectExpand(sub.subjectName)}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <BookOpen size={16} color={isSafe ? "#2563eb" : "#dc2626"} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                              {sub.subjectName}
                            </div>
                            {sub.code && (
                              <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 700 }}>
                                {sub.code}
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 12, color: "#64748b", textDecoration: "line-through" }}>
                                {sub.preBunkPct}%
                              </span>
                              <ArrowRight size={11} color="#64748b" />
                              <span
                                style={{
                                  fontSize: 13.5,
                                  fontWeight: 900,
                                  color: isSafe ? "#059669" : "#dc2626",
                                }}
                              >
                                {sub.postBunkPct}%
                              </span>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 800, color: "#dc2626" }}>
                              {sub.bunkDropDelta}% ({sub.bunkMissedCount} missed)
                            </span>
                          </div>
                          {isExpanded ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div
                          style={{
                            paddingTop: 8,
                            borderTop: "1px solid #f1f5f9",
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            fontSize: 11.5,
                            color: "#475569",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Pre-Bunk Ratio (At Eve):</span>
                            <strong>{sub.preBunkAttended} / {sub.preBunkDelivered} classes</strong>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Post-Bunk Ratio:</span>
                            <strong>{sub.postBunkAttended} / {sub.postBunkDelivered} classes</strong>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Classes to Recover to {simulation.targetPct}%:</span>
                            <strong style={{ color: sub.classesToTarget > 0 ? "#dc2626" : "#059669" }}>
                              {sub.classesToTarget > 0 ? `${sub.classesToTarget} classes needed` : "Already above target"}
                            </strong>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────────
              PHASE 3: MANDATORY POST-ABSENCE RECOVERY SCHEDULE (IMAGE 3 UI)
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
            {/* Phase 3 Header & Interactive Target Selector */}
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
                  <span>Phase 3 &bull; Timetable Recovery Engine</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                  Attendance Recovery Target & Roadmap
                </h3>
                <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
                  Select your recovery percentage target below to recalculate the exact timetable schedule:
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
                    Mandatory Post-Absence Recovery Schedule ({simulation.recoverySessions.length} total classes)
                  </h5>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
                    Every class you must consecutively attend post-absence to restore your {simulation.targetPct}% attendance goal:
                  </p>
                </div>

                {simulation.recoverySessions.length > 15 && (
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
                        <ChevronDown size={14} /> View All {simulation.recoverySessions.length} Recovery Dates
                      </>
                    )}
                  </button>
                )}
              </div>

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
                  return (
                    <div
                      key={rIdx}
                      style={{
                        background: isMilestone ? "#f0fdf4" : "#ffffff",
                        border: `1.5px solid ${isMilestone ? "#86efac" : "#e2e8f0"}`,
                        borderRadius: 12,
                        padding: "10px 12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        boxShadow: isMilestone ? "0 2px 8px rgba(34, 197, 94, 0.15)" : "0 1px 3px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 900,
                              background: isMilestone ? "#22c55e" : "#0f172a",
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
                          After this recovery class:
                        </span>
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 900,
                            color: recSes.runningPercentage >= simulation.targetPct ? "#16a34a" : "#2563eb",
                          }}
                        >
                          {recSes.runningAttended}/{recSes.runningDelivered} ({recSes.runningPercentage}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {simulation.recoverySessions.length > 15 && !showAllRecoveryDates && (
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
                  + Show remaining {simulation.recoverySessions.length - 15} recovery class dates until target
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
