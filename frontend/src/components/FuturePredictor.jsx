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
} from "lucide-react";
import {
  getSectionScheduleForDate,
  getDateInstructionalContext,
  resolveSubjectCode,
  cleanSubjectBaseName,
  TIME_SLOTS,
  CUTM_SESSION_BOUNDARIES,
} from "../utils/timetableHelper";

// Date key helper (YYYY-MM-DD)
function toDateKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Format friendly date (e.g. "Thu, 10 Sep")
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

  // Today reference (normalized to midnight)
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayKey = useMemo(() => toDateKey(today), [today]);

  // ── State Management ─────────────────────────────────────────────────────
  // Week navigation offset (0 = current week, 1 = next week, etc.)
  const [weekOffset, setWeekOffset] = useState(0);

  // Selected Bunk Dates (Set of 'YYYY-MM-DD' strings)
  const [selectedBunkKeys, setSelectedBunkKeys] = useState([]);

  // Recovery Target Percentage (default 75%, can be 80%, 85%, 90%, or custom)
  const [recoveryTargetPct, setRecoveryTargetPct] = useState(75);
  const [customTargetInput, setCustomTargetInput] = useState("75");
  const [isCustomTargetActive, setIsCustomTargetActive] = useState(false);

  // Active view tabs for post-bunk roadmap
  const [roadmapViewTab, setRoadmapViewTab] = useState("chronological"); // "chronological" | "by_subject"
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
    // Find Monday of the target week
    const currentDay = today.getDay(); // 0 is Sun, 1 is Mon
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    startOfWeek.setDate(today.getDate() + diffToMonday + weekOffset * 7);

    const days = [];
    // Generate Monday through Saturday (6 days per standard academic week)
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

  // ── Quick Presets Handlers ───────────────────────────────────────────────
  const applyPresetTomorrow = () => {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    setSelectedBunkKeys([toDateKey(tomorrow)]);
  };

  const applyPresetWeekend = () => {
    // Select Friday & Saturday of current week view
    const fri = activeWeekDays.find((d) => d.dayName === "Friday");
    const sat = activeWeekDays.find((d) => d.dayName === "Saturday");
    const keys = [];
    if (fri) keys.push(fri.dateKey);
    if (sat) keys.push(sat.dateKey);
    setSelectedBunkKeys(keys);
  };

  const applyPreset3Day = () => {
    const thu = activeWeekDays.find((d) => d.dayName === "Thursday");
    const fri = activeWeekDays.find((d) => d.dayName === "Friday");
    const sat = activeWeekDays.find((d) => d.dayName === "Saturday");
    const keys = [];
    if (thu) keys.push(thu.dateKey);
    if (fri) keys.push(fri.dateKey);
    if (sat) keys.push(sat.dateKey);
    setSelectedBunkKeys(keys);
  };

  const applyPresetFullWeek = () => {
    setSelectedBunkKeys(activeWeekDays.map((d) => d.dateKey));
  };

  const toggleBunkDate = (dateKey) => {
    setSelectedBunkKeys((prev) =>
      prev.includes(dateKey)
        ? prev.filter((k) => k !== dateKey)
        : [...prev, dateKey]
    );
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

    const firstDateKey = toDateKey(firstBunkDate);
    const lastDateKey = toDateKey(lastBunkDate);

    // Map subjects for quick lookup
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
    // If student attends all classes leading up to their planned bunk
    // ─────────────────────────────────────────────────────────────────────────
    let preBunkTotalClasses = 0;
    const preBunkDays = [];

    if (firstBunkDate > today) {
      const scanDate = new Date(today);
      while (scanDate < firstBunkDate) {
        const dKey = toDateKey(scanDate);
        const sched = getSectionScheduleForDate(selectedSection, scanDate);

        if (sched.isInstructional && sched.classes && sched.classes.length > 0) {
          preBunkDays.push({
            date: new Date(scanDate),
            dateKey: dKey,
            dayName: sched.dayName,
            dateFormatted: formatFriendlyDate(scanDate),
            classesCount: sched.classes.length,
            classes: sched.classes,
          });

          sched.classes.forEach((cls) => {
            preBunkTotalClasses++;
            const cleanName = cls.cleanName || cleanSubjectBaseName(cls.subject);
            const subData = subjectMap.get(cleanName);
            if (subData) {
              subData.preBunkAttended += 1;
              subData.preBunkDelivered += 1;
              subData.preBunkClassesAdded += 1;
            }
          });
        }
        scanDate.setDate(scanDate.getDate() + 1);
      }
    }

    // Pre-Bunk Overall Stats (At eve of first bunk date)
    const preBunkOverallAtt = currentOverallAtt + preBunkTotalClasses;
    const preBunkOverallDel = currentOverallDel + preBunkTotalClasses;
    const preBunkOverallPct =
      preBunkOverallDel > 0
        ? Number(((preBunkOverallAtt / preBunkOverallDel) * 100).toFixed(2))
        : currentOverallPct;
    const preBunkGainDelta = Number((preBunkOverallPct - currentOverallPct).toFixed(2));

    // Calculate Pre-Bunk Pct for each subject
    subjectMap.forEach((sub) => {
      sub.preBunkPct =
        sub.preBunkDelivered > 0
          ? Number(((sub.preBunkAttended / sub.preBunkDelivered) * 100).toFixed(2))
          : sub.currentPct;
      sub.preBunkGain = Number((sub.preBunkPct - sub.currentPct).toFixed(2));
      // Base post-bunk starts with pre-bunk state
      sub.postBunkAttended = sub.preBunkAttended;
      sub.postBunkDelivered = sub.preBunkDelivered;
    });

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 2: BUNK DROP SIMULATION (Selected Bunk Dates)
    // Student misses all classes on these specific days
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

      scheduledClasses.forEach((cls) => {
        const cleanName = cls.cleanName || cleanSubjectBaseName(cls.subject);
        const subData = subjectMap.get(cleanName);
        if (subData) {
          subData.bunkMissedCount += 1;
          subData.postBunkDelivered += 1;
        }
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
        classes: scheduledClasses,
        cumulativeMissedSoFar: cumulativeMissedClasses,
        endOfDayOverallPct: dayPostPct,
        dayDelta: Number((dayPostPct - preBunkOverallPct).toFixed(2)),
      });
    });

    // Final Post-Bunk Overall Attendance
    const postBunkOverallAtt = preBunkOverallAtt;
    const postBunkOverallDel = preBunkOverallDel + cumulativeMissedClasses;
    const postBunkOverallPct =
      postBunkOverallDel > 0
        ? Number(((postBunkOverallAtt / postBunkOverallDel) * 100).toFixed(2))
        : preBunkOverallPct;
    const totalBunkDropDelta = Number((postBunkOverallPct - preBunkOverallPct).toFixed(2));
    const netChangeFromCurrent = Number((postBunkOverallPct - currentOverallPct).toFixed(2));

    // Calculate Subject Post-Bunk Stats & Required Classes
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

        // Formula for classes needed to reach targetPct:
        // (postAtt + n) / (postDel + n) >= target / 100
        // => n >= (target * postDel - 100 * postAtt) / (100 - target)
        let classesToTarget = 0;
        if (sub.postBunkPct < targetPct) {
          const numerator = (targetPct / 100) * sub.postBunkDelivered - sub.postBunkAttended;
          const denominator = 1 - targetPct / 100;
          classesToTarget = Math.max(1, Math.ceil(numerator / denominator));
        }
        sub.classesToTarget = classesToTarget;

        const subCode = resolveSubjectCode({ subject: sub.subjectName }, studentData);
        sub.code = subCode;

        affectedSubjectsList.push(sub);
        if (!sub.isSafeAtTarget) {
          criticalSubjectsList.push(sub);
        }
      }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 3: POST-BUNK RECOVERY ROADMAP
    // Strictly starts after lastBunkDate and follows timetable calendar
    // ─────────────────────────────────────────────────────────────────────────
    let overallClassesToTarget = 0;
    if (postBunkOverallPct < targetPct) {
      const num = (targetPct / 100) * postBunkOverallDel - postBunkOverallAtt;
      const den = 1 - targetPct / 100;
      overallClassesToTarget = Math.max(1, Math.ceil(num / den));
    }

    // Chronological Recovery Simulation through Timetable
    const chronologicalRecoveryTimeline = [];
    const scanRecoveryDate = new Date(lastBunkDate);
    const lastSessionDate = new Date(CUTM_SESSION_BOUNDARIES?.lastDateOfInstruction || "2026-10-31T23:59:59");

    let runningRecovAtt = postBunkOverallAtt;
    let runningRecovDel = postBunkOverallDel;
    let milestoneDateReached = null;
    let milestoneSession = null;

    // Track per-subject recovery running state
    const subRunningAttMap = new Map();
    const subRunningDelMap = new Map();
    affectedSubjectsList.forEach((s) => {
      subRunningAttMap.set(s.subjectName, s.postBunkAttended);
      subRunningDelMap.set(s.subjectName, s.postBunkDelivered);
    });

    let safetyGuard = 0;
    const maxRecoverySessionsToSimulate = Math.max(overallClassesToTarget + 6, 20);

    while (
      scanRecoveryDate <= lastSessionDate &&
      chronologicalRecoveryTimeline.length < maxRecoverySessionsToSimulate &&
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
        if (chronologicalRecoveryTimeline.length >= maxRecoverySessionsToSimulate) break;

        const cleanName = cls.cleanName || cleanSubjectBaseName(cls.subject);
        runningRecovAtt += 1;
        runningRecovDel += 1;
        const newOverallPct = Number(((runningRecovAtt / runningRecovDel) * 100).toFixed(2));

        // Update subject state
        let newSubPct = null;
        if (subRunningAttMap.has(cleanName)) {
          const sAtt = subRunningAttMap.get(cleanName) + 1;
          const sDel = subRunningDelMap.get(cleanName) + 1;
          subRunningAttMap.set(cleanName, sAtt);
          subRunningDelMap.set(cleanName, sDel);
          newSubPct = Number(((sAtt / sDel) * 100).toFixed(2));
        }

        const sessionEntry = {
          sessionNumber: chronologicalRecoveryTimeline.length + 1,
          date: new Date(scanRecoveryDate),
          dateFormatted: formatFriendlyDate(scanRecoveryDate),
          dayName: sched.dayName,
          timeSlot: cls.slot?.label || (TIME_SLOTS[cls.slotIndex]?.label || "Slot " + (cls.slotIndex + 1)),
          subjectName: cleanName,
          subCode: resolveSubjectCode({ subject: cleanName }, studentData),
          room: cls.room || "Room TBA",
          faculty: cls.faculty || "Faculty",
          type: cls.type || "PP",
          overallPctAfter: newOverallPct,
          subjectPctAfter: newSubPct,
          isOverallMilestone: false,
        };

        if (!milestoneDateReached && newOverallPct >= targetPct) {
          milestoneDateReached = formatFriendlyDate(scanRecoveryDate, {
            weekday: "long",
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          sessionEntry.isOverallMilestone = true;
          milestoneSession = sessionEntry;
        }

        chronologicalRecoveryTimeline.push(sessionEntry);
      }
    }

    // Next instructional return date
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
      chronologicalRecoveryTimeline,
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", boxSizing: "border-box" }}>
      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER: FUTURE PREDICTOR HERO INTELLIGENCE BANNER
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
              <span>Section {selectedSection} Master Routine Engine</span>
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
              Date-wise bunk impact and timetable attendance recovery planner. Simulates your accumulated attendance up to the chosen leave date, calculates sequential class drops, and maps the exact future classes to recover.
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

        {/* ── Quick Vacation / Leave Presets Bar ── */}
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
              onClick={() => setSelectedBunkKeys([])}
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
          DATE WITH DAY STRIP (FOLLOWS TIMETABLE & ACADEMIC CALENDAR)
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
            <h3 style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", margin: 0 }}>
              Select Planned Bunk Date(s)
            </h3>
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
              (Click days to plan absence)
            </span>
          </div>

          {/* Week Navigation Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev - 1)}
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
              onClick={() => setWeekOffset(0)}
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
              onClick={() => setWeekOffset((prev) => prev + 1)}
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

        {/* ── Day Cards Grid ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(6, 1fr)",
            gap: 8,
          }}
        >
          {activeWeekDays.map((dayItem) => {
            const isSelected = selectedBunkKeys.includes(dayItem.dateKey);
            const isPast = dayItem.isPast;
            const isToday = dayItem.isToday;
            const hasClasses = dayItem.isInstructional && dayItem.totalClasses > 0;

            return (
              <button
                key={dayItem.dateKey}
                type="button"
                onClick={() => toggleBunkDate(dayItem.dateKey)}
                style={{
                  background: isSelected
                    ? "#fef2f2"
                    : isToday
                    ? "#f8fafc"
                    : isPast
                    ? "#fcfcfd"
                    : "#ffffff",
                  border: isSelected
                    ? "2px solid #dc2626"
                    : isToday
                    ? "2px solid #2563eb"
                    : "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: "10px 8px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  opacity: isPast && !isSelected ? 0.75 : 1,
                  boxShadow: isSelected
                    ? "0 4px 12px rgba(220, 38, 38, 0.12)"
                    : isToday
                    ? "0 2px 8px rgba(37, 99, 235, 0.08)"
                    : "0 1px 2px rgba(0,0,0,0.02)",
                  position: "relative",
                }}
              >
                {/* Status Dot / Bunk Checkmark */}
                <div
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    background: isSelected ? "#dc2626" : "transparent",
                    border: isSelected ? "none" : "1px solid #cbd5e1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: 10,
                  }}
                >
                  {isSelected && <Check size={11} strokeWidth={3} />}
                </div>

                {/* Day Name */}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: isSelected ? "#991b1b" : "#0f172a",
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

                {/* Date formatted */}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isSelected ? "#dc2626" : "#64748b",
                  }}
                >
                  {dayItem.dateFormatted}
                </span>

                {/* Timetable Class Badge */}
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    padding: "2px 6px",
                    borderRadius: 5,
                    marginTop: 2,
                    background: isSelected
                      ? "#fee2e2"
                      : dayItem.isHoliday
                      ? "#fffbeb"
                      : dayItem.isExam
                      ? "#eff6ff"
                      : hasClasses
                      ? "#ecfdf5"
                      : "#f1f5f9",
                    color: isSelected
                      ? "#b91c1c"
                      : dayItem.isHoliday
                      ? "#b45309"
                      : dayItem.isExam
                      ? "#1d4ed8"
                      : hasClasses
                      ? "#047857"
                      : "#64748b",
                  }}
                >
                  {isSelected
                    ? "Planned Bunk"
                    : dayItem.isHoliday
                    ? "Holiday"
                    : dayItem.isExam
                    ? "Exams"
                    : hasClasses
                    ? `${dayItem.totalClasses} Classes`
                    : "No Classes"}
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
              Tap any date above (e.g. 10th Sep, or 8, 9, 10, 11 Sep) or pick a preset like <strong>Long Weekend</strong> to simulate your future attendance, sequential drops, and recovery roadmap.
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
              PHASE 1: PRE-BUNK ACCUMULATION BANNER
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

              {/* Pre-Bunk Subject Gain Chips */}
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
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              PHASE 2: BUNK DROP IMPACT CARD
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

            {/* Impact Metric Summary Cards */}
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

            {/* Day-by-Day Sequential Drop Table */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Sequential Day-by-Day Breakdown:
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
                      <span style={{ fontSize: 11, color: "#64748b" }}>Overall drops to:</span>
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

            {/* Subject-Wise Affected Breakdown Accordion */}
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

                      {/* Expandable Details */}
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
              PHASE 3: POST-BUNK RECOVERY ROADMAP
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
                  <span>Phase 3 &bull; Post-Bunk Recovery Roadmap</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                  Timetable Recovery Plan (Starts {simulation.firstReturnDateFormatted})
                </h3>
                <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
                  Select your target percentage below to see the exact upcoming classes needed to recover your attendance.
                </p>
              </div>

              {/* Recovery Target Option Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {[75, 80, 85, 90].map((tVal) => {
                  const isTargetSelected = !isCustomTargetActive && recoveryTargetPct === tVal;
                  return (
                    <button
                      key={tVal}
                      type="button"
                      onClick={() => {
                        setIsCustomTargetActive(false);
                        setRecoveryTargetPct(tVal);
                      }}
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

            {/* ── Celebratory / Recovery Milestone Card ── */}
            <div
              style={{
                background: simulation.isOverallSafeAtTarget
                  ? "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)"
                  : "linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)",
                border: `1px solid ${simulation.isOverallSafeAtTarget ? "#a7f3d0" : "#bfdbfe"}`,
                borderRadius: 14,
                padding: "16px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: simulation.isOverallSafeAtTarget ? "#059669" : "#2563eb",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: simulation.isOverallSafeAtTarget ? "#065f46" : "#1e40af", textTransform: "uppercase" }}>
                    Recovery Milestone
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 900, color: "#0f172a" }}>
                    {simulation.isOverallSafeAtTarget
                      ? `Already Above Target! (${simulation.postBunkOverallPct}% &ge; ${simulation.targetPct}%)`
                      : simulation.milestoneDateReached
                      ? `Recover ${simulation.targetPct}% on: ${simulation.milestoneDateReached}`
                      : `${simulation.overallClassesToTarget} Classes Required for Complete Recovery`}
                  </div>
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
                    {simulation.isOverallSafeAtTarget
                      ? `Your attendance remains safely above your ${simulation.targetPct}% target goal even after taking this planned absence.`
                      : `Attend the next ${simulation.overallClassesToTarget} scheduled classes consecutively starting ${simulation.firstReturnDateFormatted} to reach ${simulation.targetPct}%.`}
                  </div>
                </div>
              </div>

              {simulation.milestoneSession && (
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    padding: "6px 12px",
                    borderRadius: 8,
                    textAlign: "right",
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>Achieved in Session:</span>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: "#2563eb" }}>
                    {simulation.milestoneSession.subjectName}
                  </div>
                </div>
              )}
            </div>

            {/* Roadmap Tab Selector: Chronological vs By Subject */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid #f1f5f9", paddingBottom: 6 }}>
              <button
                type="button"
                onClick={() => setRoadmapViewTab("chronological")}
                style={{
                  padding: "5px 12px",
                  borderRadius: 7,
                  border: "none",
                  background: roadmapViewTab === "chronological" ? "#0f172a" : "#f1f5f9",
                  color: roadmapViewTab === "chronological" ? "#ffffff" : "#475569",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Chronological Timetable Schedule
              </button>
              <button
                type="button"
                onClick={() => setRoadmapViewTab("by_subject")}
                style={{
                  padding: "5px 12px",
                  borderRadius: 7,
                  border: "none",
                  background: roadmapViewTab === "by_subject" ? "#0f172a" : "#f1f5f9",
                  color: roadmapViewTab === "by_subject" ? "#ffffff" : "#475569",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Subject Recovery Roadmap ({simulation.affectedSubjectsList.length})
              </button>
            </div>

            {/* ── Chronological Timetable View ── */}
            {roadmapViewTab === "chronological" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {simulation.chronologicalRecoveryTimeline.slice(0, 10).map((sess) => (
                  <div
                    key={`${sess.dateFormatted}-${sess.sessionNumber}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: 10,
                      background: sess.isOverallMilestone ? "#eff6ff" : "#f8fafc",
                      border: sess.isOverallMilestone ? "1.5px solid #3b82f6" : "1px solid #e2e8f0",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: sess.isOverallMilestone ? "#2563eb" : "#e2e8f0",
                          color: sess.isOverallMilestone ? "#ffffff" : "#334155",
                          fontSize: 11,
                          fontWeight: 800,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        #{sess.sessionNumber}
                      </span>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a" }}>
                          {sess.subjectName}
                        </div>
                        <div style={{ fontSize: 10.5, color: "#64748b" }}>
                          {sess.dateFormatted} ({sess.dayName}) &bull; {sess.timeSlot}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {sess.isOverallMilestone && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 900,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "#2563eb",
                            color: "#ffffff",
                          }}
                        >
                          Target Reached!
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: "#64748b" }}>New Overall:</span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 900,
                          color: sess.overallPctAfter >= simulation.targetPct ? "#059669" : "#0f172a",
                        }}
                      >
                        {sess.overallPctAfter}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Subject-Wise View ── */}
            {roadmapViewTab === "by_subject" && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 10 }}>
                {simulation.affectedSubjectsList.map((sub) => (
                  <div
                    key={sub.subjectName}
                    style={{
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      borderRadius: 12,
                      padding: "12px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                        {sub.subjectName}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: sub.isSafeAtTarget ? "#ecfdf5" : "#fef2f2",
                          color: sub.isSafeAtTarget ? "#059669" : "#dc2626",
                        }}
                      >
                        {sub.isSafeAtTarget ? "Safe" : `${sub.classesToTarget} Needed`}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#64748b" }}>
                      <span>Post-Bunk Pct:</span>
                      <strong>{sub.postBunkPct}%</strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#64748b" }}>
                      <span>Recovery to {simulation.targetPct}%:</span>
                      <strong style={{ color: sub.classesToTarget > 0 ? "#dc2626" : "#059669" }}>
                        {sub.classesToTarget > 0
                          ? `Attend ${sub.classesToTarget} classes`
                          : `Already above ${simulation.targetPct}%`}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
