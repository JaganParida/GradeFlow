import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar as CalendarIcon,
  CalendarCheck,
  TrendingDown,
  TrendingUp,
  Info,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Zap,
  Check,
  X,
  BookOpen,
  Layers,
  ArrowRight,
  Sun,
  MapPin,
  User,
  Compass,
  Target,
} from "lucide-react";
import {
  getDaySchedule,
  resolveSubjectCode,
  cleanSubjectBaseName,
  calculateAttendance,
  estimateTargetReachDate,
  generateDateWiseRecoveryRoadmap,
  TIME_SLOTS,
} from "../utils/timetableHelper";

export default function SmartBunkAnalyzer({
  selectedSection = "CSE-E",
  allSectionSubjects = [],
  overallCalculation = {},
  studentData = null,
  todayDayName = "Monday",
  isMobile = false,
}) {
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Default to today if it's a weekday, else Monday
  const [selectedDay, setSelectedDay] = useState(
    DAYS.includes(todayDayName) ? todayDayName : "Monday"
  );
  const [selectedLeaveDays, setSelectedLeaveDays] = useState([]);
  const [expandedSubjectRoadmaps, setExpandedSubjectRoadmaps] = useState({});
  const [leaveRoadmapTab, setLeaveRoadmapTab] = useState("by_subject"); // "by_subject" | "chronological"

  const toggleSubjectRoadmap = (subName) => {
    setExpandedSubjectRoadmaps((prev) => ({
      ...prev,
      [subName]: !prev[subName],
    }));
  };

  // 1. Weekly Day-by-Day Bunk Safety Intelligence Engine
  const weeklyBunkAnalysis = useMemo(() => {
    const subjectMap = new Map();
    allSectionSubjects.forEach((s) => subjectMap.set(s.subjectName, s));

    const totalOverallAtt = overallCalculation.totalAttended || 0;
    const totalOverallDel = overallCalculation.totalDelivered || 0;
    const currentOverallPct = overallCalculation.percentage || 100;

    const today = new Date();
    const currentDayNum = today.getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
    const dayMap = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

    return DAYS.map((day) => {
      const daySchedule = getDaySchedule(selectedSection, day) || [];
      const scheduledPeriods = daySchedule.filter(
        (p) => !p.isFree && p.subject && p.subject !== "No Class / Free"
      );

      // Compute actual calendar date for this day in current week
      const targetDayNum = dayMap[day];
      const dayDiff = targetDayNum - (currentDayNum === 0 ? 7 : currentDayNum);
      const calendarDate = new Date(today);
      calendarDate.setDate(today.getDate() + dayDiff);
      const dateFormatted = calendarDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });

      // Relative Day State
      let dayRelativeState = "upcoming"; // "past" | "today" | "tomorrow" | "upcoming"
      if (dayDiff < 0) {
        dayRelativeState = "past";
      } else if (dayDiff === 0) {
        dayRelativeState = "today";
      } else if (dayDiff === 1) {
        dayRelativeState = "tomorrow";
      }

      let canBunkAllDay = true;
      let criticalPeriodsCount = 0;

      const periods = scheduledPeriods.map((period, pIdx) => {
        const cleanName = period.cleanName || cleanSubjectBaseName(period.subject);
        const sub = subjectMap.get(cleanName);
        const comps = sub?.components || [
          { type: period.type || "PP", attended: 0, delivered: 0 },
        ];
        const subCode = resolveSubjectCode({ subject: cleanName }, studentData);
        const periodType = (period.type || "PP").toUpperCase();

        // 1. Subject Impact
        const subAtt = comps.reduce((acc, c) => acc + (Number(c.attended) || 0), 0);
        const subDel = comps.reduce((acc, c) => acc + (Number(c.delivered) || 0), 0);
        const subCurrentPct = subDel > 0 ? (subAtt / subDel) * 100 : 100;
        const subSkippedPct = subDel + 1 > 0 ? (subAtt / (subDel + 1)) * 100 : subCurrentPct;
        const subDelta = subSkippedPct - subCurrentPct;

        // 2. Component Impact (PP / PR / TUT)
        const matchedComp = comps.find((c) => c.type.toUpperCase() === periodType) || comps[0];
        const compAtt = Number(matchedComp.attended) || 0;
        const compDel = Number(matchedComp.delivered) || 0;
        const compCurrentPct = compDel > 0 ? (compAtt / compDel) * 100 : 100;
        const compSkippedPct = compDel + 1 > 0 ? (compAtt / (compDel + 1)) * 100 : compCurrentPct;
        const compDelta = compSkippedPct - compCurrentPct;

        // 3. College Semester Aggregate Impact
        const grandAtt = totalOverallAtt;
        const grandDel = totalOverallDel;
        const grandCurrentPct = grandDel > 0 ? (grandAtt / grandDel) * 100 : 100;
        const grandSkippedPct = grandDel + 1 > 0 ? (grandAtt / (grandDel + 1)) * 100 : grandCurrentPct;
        const grandDelta = grandSkippedPct - grandCurrentPct;

        // Safe Bunks for Subject
        const subCalc = calculateAttendance({
          components: comps,
          targetPercentage: 75,
        });

        const isSafeToMiss = subSkippedPct >= 75;
        if (!isSafeToMiss) {
          canBunkAllDay = false;
          criticalPeriodsCount++;
        }

        return {
          periodIndex: pIdx + 1,
          slotNumber: period.slotIndex !== undefined ? period.slotIndex + 1 : pIdx + 1,
          timeSlot:
            period.timeSlot ||
            `${TIME_SLOTS[pIdx]?.startTime || ""} - ${TIME_SLOTS[pIdx]?.endTime || ""}`,
          subjectName: cleanName,
          subCode,
          type: periodType,
          room: period.room,
          faculty: period.faculty,

          compType: matchedComp.type,
          compCurrentPct: Number(compCurrentPct.toFixed(1)),
          compSkippedPct: Number(compSkippedPct.toFixed(1)),
          compDelta: Number(compDelta.toFixed(1)),

          currentPercentage: Number(subCurrentPct.toFixed(1)),
          projectedPercentage: Number(subSkippedPct.toFixed(1)),
          subjectDelta: Number(subDelta.toFixed(1)),

          grandCurrentPct: Number(grandCurrentPct.toFixed(1)),
          grandSkippedPct: Number(grandSkippedPct.toFixed(1)),
          grandDelta: Number(grandDelta.toFixed(1)),

          safeBunks: subCalc.safeBunks,
          isSafeToMiss,
        };
      });

      // Overall Day Impact if student bunks ALL classes on this day
      const dayClassCount = scheduledPeriods.length;
      const simulatedOverallDel = totalOverallDel + dayClassCount;
      const simulatedOverallPct =
        simulatedOverallDel > 0
          ? (totalOverallAtt / simulatedOverallDel) * 100
          : currentOverallPct;
      const isOverallSafeIfAllDayBunked = simulatedOverallPct >= 75;

      let dayStatus = "SAFE";
      if (
        criticalPeriodsCount === scheduledPeriods.length &&
        scheduledPeriods.length > 0
      ) {
        dayStatus = "CRITICAL";
      } else if (criticalPeriodsCount > 0 || !isOverallSafeIfAllDayBunked) {
        dayStatus = "WARNING";
      }

      return {
        day,
        dateFormatted,
        calendarDate: new Date(calendarDate),
        dayRelativeState,
        totalClasses: scheduledPeriods.length,
        periods,
        canBunkAllDay: canBunkAllDay && isOverallSafeIfAllDayBunked,
        criticalPeriodsCount,
        dayStatus,
        simulatedOverallPercentage: Number(simulatedOverallPct.toFixed(2)),
        overallDelta: Number((simulatedOverallPct - currentOverallPct).toFixed(2)),
      };
    });
  }, [selectedSection, allSectionSubjects, overallCalculation, studentData]);

  // Selected Day Data
  const selectedDayData = useMemo(() => {
    return (
      weeklyBunkAnalysis.find((d) => d.day === selectedDay) ||
      weeklyBunkAnalysis[0]
    );
  }, [weeklyBunkAnalysis, selectedDay]);

  // 2. Multi-Day Vacation / Leave Impact Simulator
  const multiDaySimulation = useMemo(() => {
    if (selectedLeaveDays.length === 0) return null;

    let totalMissedPeriods = 0;
    const affectedSubjects = new Map();
    const dayByDayBreakdown = [];
    let maxLeaveDate = null;

    selectedLeaveDays.forEach((dayName) => {
      const dayData = weeklyBunkAnalysis.find((d) => d.day === dayName);
      if (dayData) {
        totalMissedPeriods += dayData.totalClasses;
        if (dayData.calendarDate) {
          if (!maxLeaveDate || dayData.calendarDate > maxLeaveDate) {
            maxLeaveDate = new Date(dayData.calendarDate);
          }
        }
        dayByDayBreakdown.push({
          day: dayName,
          dateFormatted: dayData.dateFormatted,
          calendarDate: dayData.calendarDate,
          totalClasses: dayData.totalClasses,
          periods: dayData.periods,
        });

        dayData.periods.forEach((p) => {
          const prev = affectedSubjects.get(p.subjectName) || {
            missedCount: 0,
            componentsMissed: {},
          };
          prev.missedCount += 1;
          const cType = (p.type || "PP").toUpperCase();
          prev.componentsMissed[cType] = (prev.componentsMissed[cType] || 0) + 1;
          affectedSubjects.set(p.subjectName, prev);
        });
      }
    });

    const totalAtt = overallCalculation.totalAttended || 0;
    const totalDel = overallCalculation.totalDelivered || 0;
    const currentPct = overallCalculation.percentage || 100;

    const simDelivered = totalDel + totalMissedPeriods;
    const simPct =
      simDelivered > 0 ? (totalAtt / simDelivered) * 100 : currentPct;
    const delta = simPct - currentPct;

    // Determine estimated student return date
    const returnDateObj = maxLeaveDate ? new Date(maxLeaveDate) : new Date();
    returnDateObj.setDate(returnDateObj.getDate() + 1);
    if (returnDateObj.getDay() === 0) {
      // If Sunday, resume Monday
      returnDateObj.setDate(returnDateObj.getDate() + 1);
    }
    const returnDateFormatted = returnDateObj.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

    const affectedSubjectBreakdown = [];
    const criticalSubjectList = [];

    affectedSubjects.forEach((info, subName) => {
      const sub = allSectionSubjects.find((s) => s.subjectName === subName);
      if (sub) {
        const sim = calculateAttendance({
          components: sub.components,
          simulateAbsent: info.missedCount,
          targetPercentage: 75,
        });

        const subCode = resolveSubjectCode({ subject: subName }, studentData);
        const subTotAtt = (sub.components || []).reduce((a, c) => a + (Number(c.attended) || 0), 0);
        const subTotDel = (sub.components || []).reduce((a, c) => a + (Number(c.delivered) || 0), 0);
        const subSimDel = subTotDel + info.missedCount;
        
        const currentPct = sim.currentPercentage;
        const projectedPct =
          sim.simulatedAbsent?.projectedPercentage ??
          (subSimDel > 0 ? Number(((subTotAtt / subSimDel) * 100).toFixed(2)) : currentPct);
        const delta =
          sim.simulatedAbsent?.delta ??
          Number((projectedPct - currentPct).toFixed(2));
        const isSafe = projectedPct >= 75;

        // Classes needed to recover to 75% after leave
        let classesToRecover = 0;
        if (!isSafe) {
          const num = 0.75 * subSimDel - subTotAtt;
          classesToRecover = Math.max(0, Math.ceil(num / 0.25));
        }

        // Full Date-Wise Recovery Roadmap strictly mapped to section timetable & calendar
        const recoveryRoadmap = generateDateWiseRecoveryRoadmap({
          subjectName: subName,
          subCode,
          weeklyOccurrences: sub.weeklyOccurrences || [],
          currentAttended: subTotAtt,
          currentDelivered: subTotDel,
          missedCount: info.missedCount,
          leaveEndDate: maxLeaveDate,
          targetPercentage: 75,
          bufferExtraClasses: 2,
          maxSessionsLimit: 25,
        });

        const subjectEntry = {
          subjectName: subName,
          subCode,
          missedCount: info.missedCount,
          componentsMissed: info.componentsMissed,
          currentPct,
          projectedPct,
          delta,
          isSafe,
          classesToRecover,
          recoveryReachDate: recoveryRoadmap.milestoneDate || (classesToRecover > 0 ? "Beyond instruction period" : null),
          recoveryRoadmap,
          components: sub.components || [],
        };

        affectedSubjectBreakdown.push(subjectEntry);

        if (!isSafe) {
          criticalSubjectList.push(subjectEntry);
        }
      }
    });

    // Chronological Master Recovery Timeline across all affected subjects
    const masterRecoveryTimeline = [];
    affectedSubjectBreakdown.forEach((subItem) => {
      if (subItem.recoveryRoadmap?.recoverySessions) {
        subItem.recoveryRoadmap.recoverySessions.forEach((sess) => {
          masterRecoveryTimeline.push({
            ...sess,
            subjectName: subItem.subjectName,
            subCode: subItem.subCode,
            currentPct: subItem.currentPct,
            projectedPct: subItem.projectedPct,
            isSubjectSafe: subItem.isSafe,
          });
        });
      }
    });

    // Sort chronologically by date timestamp, then period slot
    masterRecoveryTimeline.sort((a, b) => {
      const diff = a.date.getTime() - b.date.getTime();
      if (diff !== 0) return diff;
      return (a.timeSlot || "").localeCompare(b.timeSlot || "");
    });

    // Overall Recovery calculation if grand percentage drops below 75%
    let overallClassesToRecover = 0;
    if (simPct < 75) {
      const num = 0.75 * simDelivered - totalAtt;
      overallClassesToRecover = Math.max(0, Math.ceil(num / 0.25));
    }

    return {
      totalDays: selectedLeaveDays.length,
      totalMissedPeriods,
      simulatedPercentage: Number(simPct.toFixed(2)),
      delta: Number(delta.toFixed(2)),
      isSafe: simPct >= 75 && criticalSubjectList.length === 0,
      criticalSubjectList,
      affectedSubjectBreakdown,
      dayByDayBreakdown,
      overallClassesToRecover,
      returnDateFormatted,
      masterRecoveryTimeline,
    };
  }, [
    selectedLeaveDays,
    weeklyBunkAnalysis,
    overallCalculation,
    allSectionSubjects,
    studentData,
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ═══════════════════════════════════════════════════════════════
          HERO INTELLIGENCE BANNER (Clean Modern SaaS Style)
      ═══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 18,
          padding: isMobile ? "16px 14px" : "20px 24px",
          color: "#0f172a",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02), 0 10px 24px -6px rgba(15, 23, 42, 0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11.5,
                fontWeight: 800,
                color: "#2563eb",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              <ShieldCheck size={14} />
              <span>Section {selectedSection} Routine Intelligence</span>
            </div>
            <h2
              style={{
                fontSize: isMobile ? 18 : 22,
                fontWeight: 900,
                margin: "3px 0 0 0",
                color: "#0f172a",
                letterSpacing: "-0.4px",
              }}
            >
              Smart Bunk & Weekly Safe Days Analyzer
            </h2>
          </div>

          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #dbeafe",
              padding: "8px 16px",
              borderRadius: 12,
              textAlign: "right",
            }}
          >
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b" }}>
              Overall Semester Safe Buffer
            </div>
            <div
              style={{
                fontSize: isMobile ? 18 : 22,
                fontWeight: 900,
                letterSpacing: "-0.5px",
                color: "#1d4ed8",
              }}
            >
              {overallCalculation.safeBunks || 0} Classes Safe
            </div>
          </div>
        </div>

        <p
          style={{
            fontSize: 12.5,
            lineHeight: 1.5,
            opacity: 0.9,
            margin: 0,
            maxWidth: 900,
          }}
        >
          This intelligent analyzer calculates whether skipping specific classes or entire days will maintain your attendance above the mandatory 75% cutoff, mapped directly against your section's weekly timetable.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          WEEKLY DAY TABS SELECTOR (Monday through Friday)
      ═══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : `repeat(${Math.max(1, weeklyBunkAnalysis.length)}, minmax(0, 1fr))`,
          gap: isMobile ? 6 : 10,
          width: "100%",
        }}
      >
        {weeklyBunkAnalysis.map((dayData) => {
          const isSelected = selectedDay === dayData.day;
          const isPast = dayData.dayRelativeState === "past";
          const isToday = dayData.dayRelativeState === "today";
          const isTomorrow = dayData.dayRelativeState === "tomorrow";
          const isSafe = dayData.dayStatus === "SAFE";
          const isWarning = dayData.dayStatus === "WARNING";

          return (
            <button
              key={dayData.day}
              type="button"
              onClick={() => setSelectedDay(dayData.day)}
              style={{
                background: isSelected ? "#0f172a" : isPast ? "#f8fafc" : "#ffffff",
                border: isSelected
                  ? "2px solid #0f172a"
                  : isToday
                  ? "2px solid #2563eb"
                  : "1.5px solid #e2e8f0",
                borderRadius: 14,
                padding: isMobile ? "8px 4px" : "12px 14px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                cursor: "pointer",
                transition: "all 0.15s ease",
                opacity: isPast && !isSelected ? 0.8 : 1,
                boxShadow: isSelected
                  ? "0 4px 12px rgba(15, 23, 42, 0.2)"
                  : isToday
                  ? "0 2px 8px rgba(37, 99, 235, 0.12)"
                  : "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span
                  style={{
                    fontSize: isMobile ? 11 : 13,
                    fontWeight: 800,
                    color: isSelected ? "#ffffff" : isPast ? "#64748b" : "#0f172a",
                  }}
                >
                  {isMobile ? dayData.day.slice(0, 3) : dayData.day}
                </span>
                {isToday && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: isSelected ? "#60a5fa" : "#2563eb",
                    }}
                  />
                )}
              </div>

              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: isSelected ? "#94a3b8" : isPast ? "#94a3b8" : "#64748b",
                }}
              >
                {dayData.dateFormatted} &bull; {dayData.totalClasses} Cls
              </span>

              <span
                style={{
                  fontSize: 9,
                  fontWeight: 900,
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: isSelected
                    ? isPast
                      ? "#334155"
                      : isSafe
                      ? "#059669"
                      : isWarning
                      ? "#d97706"
                      : "#dc2626"
                    : isPast
                    ? "#f1f5f9"
                    : isToday
                    ? "#eff6ff"
                    : isSafe
                    ? "#ecfdf5"
                    : isWarning
                    ? "#fffbeb"
                    : "#fef2f2",
                  color: isSelected
                    ? "#ffffff"
                    : isPast
                    ? "#64748b"
                    : isToday
                    ? "#1d4ed8"
                    : isSafe
                    ? "#059669"
                    : isWarning
                    ? "#d97706"
                    : "#dc2626",
                  border: isPast && !isSelected ? "1px solid #cbd5e1" : "none",
                  textTransform: "uppercase",
                }}
              >
                {isPast
                  ? "Completed"
                  : isToday
                  ? "Today"
                  : isTomorrow
                  ? "Tomorrow"
                  : isSafe
                  ? "Safe"
                  : isWarning
                  ? "Caution"
                  : "Critical"}
              </span>
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SELECTED DAY FULL VERDICT & LEAVE IMPACT CARD
      ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {selectedDayData && (
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            {/* Day Hero Verdict Card */}
            <div
              style={{
                background: selectedDayData.canBunkAllDay
                  ? "#f0fdf4"
                  : selectedDayData.dayStatus === "WARNING"
                  ? "#fffbeb"
                  : "#fef2f2",
                border: `1.5px solid ${
                  selectedDayData.canBunkAllDay
                    ? "#86efac"
                    : selectedDayData.dayStatus === "WARNING"
                    ? "#fde68a"
                    : "#fca5a5"
                }`,
              borderRadius: 16,
              padding: isMobile ? "14px 16px" : "18px 22px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {selectedDayData.canBunkAllDay ? (
                  <CheckCircle2 size={18} color="#16a34a" />
                ) : (
                  <AlertTriangle
                    size={18}
                    color={
                      selectedDayData.dayStatus === "WARNING"
                        ? "#d97706"
                        : "#dc2626"
                    }
                  />
                )}
                <h3
                  style={{
                    fontSize: isMobile ? 15 : 17,
                    fontWeight: 800,
                    color: selectedDayData.canBunkAllDay
                      ? "#166534"
                      : selectedDayData.dayStatus === "WARNING"
                      ? "#92400e"
                      : "#991b1b",
                    margin: 0,
                  }}
                >
                  {selectedDayData.canBunkAllDay
                    ? `Full Day Leave is 100% Safe on ${selectedDayData.day}`
                    : `Caution on ${selectedDayData.day} — ${selectedDayData.criticalPeriodsCount} Critical Class(es)`}
                </h3>
              </div>

              <p
                style={{
                  fontSize: 12.5,
                  color: selectedDayData.canBunkAllDay
                    ? "#15803d"
                    : selectedDayData.dayStatus === "WARNING"
                    ? "#b45309"
                    : "#b91c1c",
                  margin: "6px 0 0 0",
                  lineHeight: 1.45,
                }}
              >
                {selectedDayData.canBunkAllDay
                  ? `You can safely miss all ${selectedDayData.totalClasses} classes scheduled on ${selectedDayData.day}. Your overall aggregate will remain at ${selectedDayData.simulatedOverallPercentage}% (well above 75%), and all individual subjects will stay eligible.`
                  : `Skipping the entire day causes ${selectedDayData.criticalPeriodsCount} subject(s) to fall below the 75% cutoff. You can skip the green-badged classes, but you must attend the red-badged classes.`}
              </p>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                padding: "10px 16px",
                borderRadius: 12,
                textAlign: "center",
                minWidth: 140,
              }}
            >
              <span
                style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b" }}
              >
                Aggregate if Day Skipped
              </span>
              <div
                style={{
                  fontSize: isMobile ? 18 : 22,
                  fontWeight: 900,
                  color:
                    selectedDayData.simulatedOverallPercentage >= 75
                      ? "#059669"
                      : "#dc2626",
                  marginTop: 2,
                }}
              >
                {selectedDayData.simulatedOverallPercentage}%
              </div>
              <span
                style={{ fontSize: 10, fontWeight: 800, color: "#64748b" }}
              >
                Delta: {selectedDayData.overallDelta}%
              </span>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              PERIOD-BY-PERIOD SAFETY BREAKDOWN FOR THIS DAY
          ═══════════════════════════════════════════════════════════════ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h4
                style={{
                  fontSize: 14.5,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Clock size={16} color="#2563eb" />
                <span>
                  Period-by-Period Safety Breakdown for {selectedDayData.day}
                </span>
              </h4>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                {selectedDayData.periods.length} Scheduled Classes
              </span>
            </div>

            {selectedDayData.periods.length === 0 ? (
              <div
                style={{
                  background: "#ffffff",
                  padding: 24,
                  borderRadius: 14,
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: 13,
                  border: "1px solid #e2e8f0",
                }}
              >
                No classes scheduled on this day.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile
                    ? "1fr"
                    : "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: 12,
                }}
              >
                {selectedDayData.periods.map((p, pIdx) => (
                  <div
                    key={pIdx}
                    style={{
                      background: "#ffffff",
                      border: `1.5px solid ${
                        p.isSafeToMiss ? "#bbf7d0" : "#fca5a5"
                      }`,
                      borderRadius: 14,
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 10,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: "#475569",
                            fontFamily: "'Space Mono', monospace",
                          }}
                        >
                          P{p.slotNumber} &bull; {p.timeSlot}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 900,
                            background:
                              p.type === "PR"
                                ? "#faf5ff"
                                : p.type === "TUT"
                                ? "#fffbeb"
                                : "#eff6ff",
                            color:
                              p.type === "PR"
                                ? "#7c3aed"
                                : p.type === "TUT"
                                ? "#b45309"
                                : "#1e40af",
                            padding: "2px 6px",
                            borderRadius: 4,
                            border: `1px solid ${
                              p.type === "PR"
                                ? "#ddd6fe"
                                : p.type === "TUT"
                                ? "#fde68a"
                                : "#bfdbfe"}`,
                          }}
                        >
                          {p.type}
                        </span>
                      </div>

                      <div style={{ marginTop: 6 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: "#0f172a",
                            lineHeight: 1.3,
                          }}
                        >
                          {p.subjectName}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            marginTop: 4,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          {p.subCode && (
                            <span
                              style={{
                                fontSize: 10,
                                fontFamily: "'Space Mono', monospace",
                                fontWeight: 800,
                                color: "#2563eb",
                                background: "#eff6ff",
                                padding: "1px 5px",
                                borderRadius: 4,
                              }}
                            >
                              {p.subCode}
                            </span>
                          )}
                          {p.room && (
                            <span
                              style={{
                                fontSize: 10.5,
                                color: "#64748b",
                                fontWeight: 600,
                              }}
                            >
                              Room: {p.room}
                            </span>
                          )}
                          {p.faculty && (
                            <span
                              style={{
                                fontSize: 10.5,
                                color: "#64748b",
                                fontWeight: 600,
                              }}
                            >
                              &bull; {p.faculty}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bunk Safety Prediction Breakdown Card */}
                    <div
                      style={{
                        background: p.isSafeToMiss ? "#f0fdf4" : "#fef2f2",
                        border: `1.5px solid ${
                          p.isSafeToMiss ? "#86efac" : "#fecaca"
                        }`,
                        borderRadius: 12,
                        padding: "10px 12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11.5,
                            fontWeight: 800,
                            color: p.isSafeToMiss ? "#166534" : "#991b1b",
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          {p.isSafeToMiss ? (
                            <CheckCircle2 size={13} color="#16a34a" />
                          ) : (
                            <AlertTriangle size={13} color="#dc2626" />
                          )}
                          <span>
                            {p.isSafeToMiss
                              ? "SAFE TO BUNK"
                              : "CRITICAL • MUST ATTEND"}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 900,
                            color: p.isSafeToMiss ? "#166534" : "#dc2626",
                            background: p.isSafeToMiss ? "#dcfce7" : "#fee2e2",
                            padding: "1px 6px",
                            borderRadius: 4,
                          }}
                        >
                          {p.safeBunks} safe
                        </span>
                      </div>

                      {/* 3-Tier Granular Skip Breakdown */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 3,
                          marginTop: 2,
                          background: "#ffffff",
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: `1px solid ${
                            p.isSafeToMiss ? "#bbf7d0" : "#fca5a5"
                          }`,
                        }}
                      >
                        {/* 1. Component Tier */}
                        <div
                          style={{
                            fontSize: 11,
                            color: "#334155",
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>
                            <strong>{p.type} Component:</strong> {p.compCurrentPct}% &rarr;{" "}
                            <strong>{p.compSkippedPct}%</strong>
                          </span>
                          <span style={{ fontWeight: 700, color: "#dc2626" }}>
                            {p.compDelta}%
                          </span>
                        </div>

                        {/* 2. Subject Tier */}
                        <div
                          style={{
                            fontSize: 11,
                            color: "#334155",
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>
                            <strong>Subject Score:</strong> {p.currentPercentage}% &rarr;{" "}
                            <strong
                              style={{
                                color:
                                  p.projectedPercentage >= 75
                                    ? "#059669"
                                    : "#dc2626",
                              }}
                            >
                              {p.projectedPercentage}%
                            </strong>
                          </span>
                          <span style={{ fontWeight: 700, color: "#dc2626" }}>
                            {p.subjectDelta}%
                          </span>
                        </div>

                        {/* 3. Grand Semester Aggregate Tier */}
                        <div
                          style={{
                            fontSize: 10.5,
                            color: "#64748b",
                            display: "flex",
                            justifyContent: "space-between",
                            borderTop: "1px dashed #e2e8f0",
                            paddingTop: 3,
                            marginTop: 2,
                          }}
                        >
                          <span>
                            <strong>College Aggregate:</strong> {p.grandCurrentPct}% &rarr;{" "}
                            {p.grandSkippedPct}%
                          </span>
                          <span style={{ fontWeight: 600, color: "#64748b" }}>
                            {p.grandDelta}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              MULTI-DAY VACATION / LEAVE IMPACT SIMULATOR
          ═══════════════════════════════════════════════════════════════ */}
          <div
            style={{
              background: "#ffffff",
              border: "1.5px solid #e2e8f0",
              borderRadius: 16,
              padding: isMobile ? "16px 14px" : "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              marginTop: 6,
              boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
            }}
          >
            {/* Header & Description */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h4
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <CalendarIcon size={18} color="#2563eb" />
                  <span>Multi-Day Leave / Vacation Planner</span>
                </h4>
                <p
                  style={{
                    fontSize: 12.5,
                    color: "#64748b",
                    margin: "3px 0 0 0",
                  }}
                >
                  Select multiple days or choose a vacation preset to preview the cumulative attendance impact across all enrolled courses.
                </p>
              </div>

              {/* Quick Presets */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Presets:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedLeaveDays(["Friday", "Saturday"])}
                  style={{
                    padding: "4px 9px",
                    borderRadius: 7,
                    border: "1px solid #cbd5e1",
                    background: selectedLeaveDays.includes("Friday") && selectedLeaveDays.includes("Saturday") && selectedLeaveDays.length === 2 ? "#eff6ff" : "#f8fafc",
                    color: selectedLeaveDays.includes("Friday") && selectedLeaveDays.includes("Saturday") && selectedLeaveDays.length === 2 ? "#2563eb" : "#475569",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Sun size={12} />
                  <span>Long Weekend (Fri+Sat)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLeaveDays(["Thursday", "Friday", "Saturday"])}
                  style={{
                    padding: "4px 9px",
                    borderRadius: 7,
                    border: "1px solid #cbd5e1",
                    background: selectedLeaveDays.length === 3 && selectedLeaveDays.includes("Thursday") ? "#eff6ff" : "#f8fafc",
                    color: selectedLeaveDays.length === 3 && selectedLeaveDays.includes("Thursday") ? "#2563eb" : "#475569",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <CalendarIcon size={12} />
                  <span>3-Day Break (Thu-Sat)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLeaveDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"])}
                  style={{
                    padding: "4px 9px",
                    borderRadius: 7,
                    border: "1px solid #cbd5e1",
                    background: selectedLeaveDays.length === 6 ? "#eff6ff" : "#f8fafc",
                    color: selectedLeaveDays.length === 6 ? "#2563eb" : "#475569",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Clock size={12} />
                  <span>Full Week Off</span>
                </button>
              </div>
            </div>

            {/* Day Checkbox Selector Bar */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {DAYS.map((dName) => {
                const isChecked = selectedLeaveDays.includes(dName);
                const dayAnalysis = weeklyBunkAnalysis.find((d) => d.day === dName);
                const classCount = dayAnalysis?.totalClasses || 0;

                return (
                  <button
                    key={dName}
                    type="button"
                    onClick={() => {
                      setSelectedLeaveDays((prev) =>
                        isChecked
                          ? prev.filter((d) => d !== dName)
                          : [...prev, dName]
                      );
                    }}
                    style={{
                      padding: "7px 12px",
                      borderRadius: 9,
                      border: isChecked
                        ? "1.5px solid #2563eb"
                        : "1px solid #cbd5e1",
                      background: isChecked ? "#eff6ff" : "#ffffff",
                      color: isChecked ? "#1e40af" : "#334155",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span
                      style={{
                        width: 15,
                        height: 15,
                        borderRadius: 4,
                        border: isChecked
                          ? "1.5px solid #2563eb"
                          : "1.5px solid #94a3b8",
                        background: isChecked ? "#2563eb" : "transparent",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ffffff",
                        fontSize: 10,
                        fontWeight: 900,
                      }}
                    >
                      {isChecked ? "•" : ""}
                    </span>
                    <span>{dName}</span>
                    <span
                      style={{
                        fontSize: 10.5,
                        color: isChecked ? "#2563eb" : "#64748b",
                        background: isChecked ? "#dbeafe" : "#f1f5f9",
                        padding: "1px 6px",
                        borderRadius: 4,
                        fontWeight: 700,
                      }}
                    >
                      {classCount} classes
                    </span>
                  </button>
                );
              })}

              {selectedLeaveDays.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedLeaveDays([])}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 9,
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    color: "#dc2626",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <X size={13} />
                  Clear Selection
                </button>
              )}
            </div>

            {/* ── Empty State: When No Days Selected ── */}
            {!multiDaySimulation ? (
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px dashed #cbd5e1",
                  borderRadius: 14,
                  padding: "20px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "#eff6ff",
                      color: "#2563eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <CalendarCheck size={18} />
                  </div>
                  <div>
                    <h5 style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>
                      Plan Single or Multi-Day Absences Safely
                    </h5>
                    <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
                      Select the days you intend to take leave above to see live projected attendance, subjects falling below 75%, and recovery time.
                    </p>
                  </div>
                </div>

                {/* Day-by-Day Quick Safety Indicators */}
                <div style={{ marginTop: 4 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>
                    This Week's Individual Day Leave Risk:
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(6, 1fr)", gap: 8 }}>
                    {weeklyBunkAnalysis.map((d) => (
                      <div
                        key={d.day}
                        onClick={() => setSelectedLeaveDays([d.day])}
                        style={{
                          background: "#ffffff",
                          border: `1px solid ${d.canBunkAllDay ? "#bbf7d0" : "#fed7aa"}`,
                          borderRadius: 9,
                          padding: "8px 10px",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 11.5, fontWeight: 800, color: "#0f172a" }}>{d.day.slice(0, 3)}</span>
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 900,
                              background: d.canBunkAllDay ? "#f0fdf4" : "#fff7ed",
                              color: d.canBunkAllDay ? "#16a34a" : "#ea580c",
                              padding: "1px 4px",
                              borderRadius: 4,
                            }}
                          >
                            {d.canBunkAllDay ? "SAFE" : "RISK"}
                          </span>
                        </div>
                        <div style={{ fontSize: 10.5, color: "#64748b" }}>
                          {d.totalClasses} classes ({d.overallDelta}%)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ── Active Multi-Day Leave Simulation Intelligence Report ── */
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* 1. Top Executive Verdict Banner */}
                <div
                  style={{
                    background: multiDaySimulation.isSafe ? "#f0fdf4" : "#fef2f2",
                    border: `1.5px solid ${multiDaySimulation.isSafe ? "#86efac" : "#fca5a5"}`,
                    borderRadius: 14,
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {multiDaySimulation.isSafe ? (
                        <CheckCircle2 size={22} color="#16a34a" style={{ flexShrink: 0 }} />
                      ) : (
                        <AlertTriangle size={22} color="#dc2626" style={{ flexShrink: 0 }} />
                      )}
                      <div>
                        <h5 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: multiDaySimulation.isSafe ? "#166534" : "#991b1b" }}>
                          {multiDaySimulation.isSafe
                            ? `Taking ${multiDaySimulation.totalDays} Day(s) Leave is Safe!`
                            : `Shortfall Alert: Leave on ${selectedLeaveDays.join(", ")} will breach 75% cutoff!`}
                        </h5>
                        <p style={{ margin: "2px 0 0 0", fontSize: 12, color: multiDaySimulation.isSafe ? "#15803d" : "#b91c1c" }}>
                          {multiDaySimulation.isSafe
                            ? `All individual subjects and grand semester aggregate remain safely at or above 75.0%.`
                            : `${multiDaySimulation.criticalSubjectList.length} subject(s) will drop below the mandatory 75% threshold.`}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          background: "#ffffff",
                          border: `1px solid ${multiDaySimulation.isSafe ? "#bbf7d0" : "#fecaca"}`,
                          padding: "6px 14px",
                          borderRadius: 10,
                          textAlign: "right",
                        }}
                      >
                        <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                          Projected Aggregate
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: multiDaySimulation.isSafe ? "#16a34a" : "#dc2626", fontFamily: "'Space Mono', monospace" }}>
                          {multiDaySimulation.simulatedPercentage}%{" "}
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#dc2626" }}>
                            ({multiDaySimulation.delta > 0 ? "+" : ""}{multiDaySimulation.delta}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4 Micro KPI Badges */}
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 8, marginTop: 2 }}>
                    <div style={{ background: "#ffffff", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Leave Days</span>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{multiDaySimulation.totalDays} Days Selected</div>
                    </div>
                    <div style={{ background: "#ffffff", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Classes Skipped</span>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{multiDaySimulation.totalMissedPeriods} Total Periods</div>
                    </div>
                    <div style={{ background: "#ffffff", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Affected Subjects</span>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{multiDaySimulation.affectedSubjectBreakdown.length} Courses</div>
                    </div>
                    <div style={{ background: "#ffffff", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Safety Margin</span>
                      <div style={{ fontSize: 14, fontWeight: 800, color: multiDaySimulation.simulatedPercentage >= 75 ? "#16a34a" : "#dc2626" }}>
                        {multiDaySimulation.simulatedPercentage >= 75
                          ? `+${(multiDaySimulation.simulatedPercentage - 75).toFixed(1)}% Safe Buffer`
                          : `${(multiDaySimulation.simulatedPercentage - 75).toFixed(1)}% Deficit`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Granular Per-Subject Impact & Date-Wise Recovery Roadmap */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                        <BookOpen size={16} color="#2563eb" />
                        <span>Leave Impact & Date-Wise Recovery Roadmap:</span>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe",
                          padding: "2px 8px",
                          borderRadius: 6,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <CalendarCheck size={12} />
                        Classes Resume: {multiDaySimulation.returnDateFormatted}
                      </span>
                    </div>

                    {/* View Switcher: By Course vs Master Chronological Timeline */}
                    <div style={{ display: "inline-flex", background: "#f1f5f9", padding: 3, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                      <button
                        type="button"
                        onClick={() => setLeaveRoadmapTab("by_subject")}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          border: "none",
                          background: leaveRoadmapTab === "by_subject" ? "#ffffff" : "transparent",
                          color: leaveRoadmapTab === "by_subject" ? "#0f172a" : "#64748b",
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          boxShadow: leaveRoadmapTab === "by_subject" ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
                        }}
                      >
                        <Layers size={12} />
                        <span>By Course ({multiDaySimulation.affectedSubjectBreakdown.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLeaveRoadmapTab("chronological")}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          border: "none",
                          background: leaveRoadmapTab === "chronological" ? "#ffffff" : "transparent",
                          color: leaveRoadmapTab === "chronological" ? "#0f172a" : "#64748b",
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          boxShadow: leaveRoadmapTab === "chronological" ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
                        }}
                      >
                        <CalendarIcon size={12} />
                        <span>Master Schedule ({multiDaySimulation.masterRecoveryTimeline?.length || 0})</span>
                      </button>
                    </div>
                  </div>

                  {/* TAB 1: SUBJECT BY SUBJECT BREAKDOWN WITH EXPANDABLE ROADMAPS */}
                  {leaveRoadmapTab === "by_subject" && (
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(360px, 1fr))", gap: 12 }}>
                      {multiDaySimulation.affectedSubjectBreakdown.map((subItem, sIdx) => {
                        const missedCompKeys = Object.keys(subItem.componentsMissed || {});
                        const isRoadmapOpen = Boolean(expandedSubjectRoadmaps[subItem.subjectName]);
                        const roadmap = subItem.recoveryRoadmap;
                        const sessions = roadmap?.recoverySessions || [];

                        return (
                          <div
                            key={sIdx}
                            style={{
                              background: "#ffffff",
                              border: `1.5px solid ${subItem.isSafe ? "#e2e8f0" : "#fca5a5"}`,
                              borderRadius: 12,
                              padding: "13px 15px",
                              display: "flex",
                              flexDirection: "column",
                              gap: 10,
                              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                  <span style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>
                                    {subItem.subjectName}
                                  </span>
                                  {subItem.subCode && (
                                    <span style={{ fontSize: 10.5, fontFamily: "'Space Mono', monospace", fontWeight: 800, background: "#eff6ff", color: "#2563eb", padding: "1px 5px", borderRadius: 4 }}>
                                      {subItem.subCode}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                                  <span>Missed on Leave: <strong>{subItem.missedCount} class(es)</strong></span>
                                  {missedCompKeys.length > 0 && (
                                    <span style={{ color: "#94a3b8" }}>
                                      ({missedCompKeys.map((k) => `${subItem.componentsMissed[k]}x ${k}`).join(", ")})
                                    </span>
                                  )}
                                </div>
                              </div>

                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 900,
                                  background: subItem.isSafe ? "#f0fdf4" : "#fef2f2",
                                  color: subItem.isSafe ? "#16a34a" : "#dc2626",
                                  border: `1px solid ${subItem.isSafe ? "#bbf7d0" : "#fecaca"}`,
                                  padding: "2px 7px",
                                  borderRadius: 6,
                                  whiteSpace: "nowrap",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                {subItem.isSafe ? (
                                  <>
                                    <CheckCircle2 size={11} color="#16a34a" />
                                    <span>SAFE (&ge;75%)</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle size={11} color="#dc2626" />
                                    <span>SHORTFALL</span>
                                  </>
                                )}
                              </span>
                            </div>

                            {/* Score Progression Bar */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "6px 10px", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                              <span style={{ fontSize: 11.5, color: "#64748b" }}>
                                Current: <strong>{subItem.currentPct}%</strong> &rarr; Projected:{" "}
                                <strong style={{ color: subItem.isSafe ? "#16a34a" : "#dc2626" }}>{subItem.projectedPct}%</strong>
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 800, color: subItem.delta < 0 ? "#dc2626" : "#16a34a" }}>
                                {subItem.delta}%
                              </span>
                            </div>

                            {/* Recovery Intelligence Banner */}
                            {!subItem.isSafe ? (
                              <div style={{ fontSize: 11, background: "#fef2f2", border: "1px solid #fecaca", padding: "8px 10px", borderRadius: 8, color: "#991b1b", display: "flex", flexDirection: "column", gap: 4 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800 }}>
                                  <Zap size={13} color="#dc2626" style={{ flexShrink: 0 }} />
                                  <span>Required Action: Attend {subItem.classesToRecover} consecutive classes</span>
                                </div>
                                <div style={{ fontSize: 10.5, color: "#7f1d1d", marginLeft: 19 }}>
                                  {roadmap?.milestoneDate ? (
                                    <span>Target restored on <strong>{roadmap.milestoneDate}</strong> (Session #{roadmap.milestoneSessionNumber})</span>
                                  ) : (
                                    <span>All scheduled classes after leave must be attended strictly.</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div style={{ fontSize: 11, background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "8px 10px", borderRadius: 8, color: "#166534", display: "flex", flexDirection: "column", gap: 4 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800 }}>
                                  <ShieldCheck size={13} color="#16a34a" style={{ flexShrink: 0 }} />
                                  <span>Safe Buffer Preserved (&ge;75%)</span>
                                </div>
                                <div style={{ fontSize: 10.5, color: "#14532d", marginLeft: 19 }}>
                                  {roadmap?.bufferRestoredDate ? (
                                    <span>Pre-leave buffer restored on <strong>{roadmap.bufferRestoredDate}</strong></span>
                                  ) : (
                                    <span>Attendance stays safely above the university minimum.</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Accordion Trigger Button */}
                            {sessions.length > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleSubjectRoadmap(subItem.subjectName)}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: 7,
                                  border: "1px solid #e2e8f0",
                                  background: isRoadmapOpen ? "#eff6ff" : "#f8fafc",
                                  color: isRoadmapOpen ? "#2563eb" : "#475569",
                                  fontSize: 11,
                                  fontWeight: 800,
                                  cursor: "pointer",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                                  <CalendarIcon size={12} />
                                  <span>{isRoadmapOpen ? "Hide Recovery Schedule" : "View Date-Wise Recovery Roadmap"} ({sessions.length} classes)</span>
                                </span>
                                {isRoadmapOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              </button>
                            )}

                            {/* Expandable Step-by-Step Date-Wise Recovery Schedule */}
                            <AnimatePresence>
                              {isRoadmapOpen && sessions.length > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  style={{ overflow: "hidden" }}
                                >
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 4 }}>
                                    <div style={{ fontSize: 10.5, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                                      Step-by-Step Class Schedule & Attendance Growth:
                                    </div>
                                    {sessions.map((sess, sessIdx) => (
                                      <div
                                        key={sessIdx}
                                        style={{
                                          background: sess.is75Milestone ? "#f0fdf4" : sess.isBufferRestored ? "#eff6ff" : "#f8fafc",
                                          border: `1px solid ${sess.is75Milestone ? "#86efac" : sess.isBufferRestored ? "#bfdbfe" : "#e2e8f0"}`,
                                          borderRadius: 8,
                                          padding: "8px 10px",
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: 4,
                                        }}
                                      >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <span style={{ fontSize: 10, fontWeight: 900, background: "#e2e8f0", color: "#334155", padding: "1px 5px", borderRadius: 4 }}>
                                              #{sess.sessionNumber}
                                            </span>
                                            <span style={{ fontSize: 11.5, fontWeight: 800, color: "#0f172a" }}>
                                              {sess.day}, {sess.dateStr}
                                            </span>
                                          </div>
                                          <span style={{ fontSize: 10.5, fontWeight: 900, color: "#16a34a", background: "#dcfce7", padding: "1px 6px", borderRadius: 4 }}>
                                            +{sess.stepDelta}%
                                          </span>
                                        </div>

                                        <div style={{ fontSize: 10.5, color: "#64748b", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                                          <span>
                                            {sess.timeSlot} &bull; {sess.room} {sess.faculty ? `&bull; ${sess.faculty}` : ""}
                                          </span>
                                          <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                                            {sess.runningAttended}/{sess.runningDelivered} ({sess.pctBefore}% &rarr;{" "}
                                            <strong style={{ color: sess.pctAfter >= 75 ? "#16a34a" : "#dc2626" }}>{sess.pctAfter}%</strong>)
                                          </span>
                                        </div>

                                        {sess.is75Milestone && (
                                          <div style={{ background: "#dcfce7", color: "#15803d", padding: "3px 6px", borderRadius: 5, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                                            <CheckCircle2 size={11} color="#16a34a" />
                                            <span>Milestone: Crosses mandatory 75.0% cutoff on this date!</span>
                                          </div>
                                        )}

                                        {sess.isBufferRestored && (
                                          <div style={{ background: "#dbeafe", color: "#1e40af", padding: "3px 6px", borderRadius: 5, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                                            <ShieldCheck size={11} color="#2563eb" />
                                            <span>Pre-leave buffer level restored ({sess.pctAfter}%)</span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* TAB 2: MASTER UNIFIED CHRONOLOGICAL SCHEDULE ACROSS ALL COURSES */}
                  {leaveRoadmapTab === "chronological" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                        <div style={{ fontSize: 12, color: "#334155" }}>
                          Showing <strong>{multiDaySimulation.masterRecoveryTimeline.length} total upcoming classes</strong> across all affected courses starting from <strong>{multiDaySimulation.returnDateFormatted}</strong>.
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "2px 8px", borderRadius: 6 }}>
                          Chronological Timetable Order
                        </span>
                      </div>

                      {multiDaySimulation.masterRecoveryTimeline.length === 0 ? (
                        <div style={{ padding: "20px", textAlign: "center", color: "#64748b", background: "#ffffff", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                          No upcoming recovery classes found before the end of instruction (31 Oct 2026).
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {multiDaySimulation.masterRecoveryTimeline.map((sess, mIdx) => (
                            <div
                              key={mIdx}
                              style={{
                                background: sess.is75Milestone ? "#f0fdf4" : sess.isBufferRestored ? "#eff6ff" : "#ffffff",
                                border: `1px solid ${sess.is75Milestone ? "#86efac" : sess.isBufferRestored ? "#bfdbfe" : "#e2e8f0"}`,
                                borderRadius: 9,
                                padding: "10px 14px",
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 11, fontWeight: 800, background: "#f1f5f9", color: "#0f172a", padding: "2px 6px", borderRadius: 4 }}>
                                    {sess.day.slice(0, 3)}, {sess.dateStr}
                                  </span>
                                  <span style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a" }}>
                                    {sess.subjectName}
                                  </span>
                                  {sess.subCode && (
                                    <span style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", fontWeight: 700, background: "#eff6ff", color: "#2563eb", padding: "1px 5px", borderRadius: 4 }}>
                                      {sess.subCode}
                                    </span>
                                  )}
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>
                                    {sess.pctBefore}% &rarr;{" "}
                                    <strong style={{ color: sess.pctAfter >= 75 ? "#16a34a" : "#dc2626" }}>{sess.pctAfter}%</strong>
                                  </span>
                                  <span style={{ fontSize: 11, fontWeight: 900, color: "#16a34a", background: "#dcfce7", padding: "1px 6px", borderRadius: 4 }}>
                                    +{sess.stepDelta}%
                                  </span>
                                </div>
                              </div>

                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#64748b", flexWrap: "wrap", gap: 4 }}>
                                <span>
                                  {sess.timeSlot} &bull; {sess.room} {sess.faculty ? `&bull; ${sess.faculty}` : ""} &bull; {sess.type}
                                </span>
                                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10.5 }}>
                                  Attended: {sess.runningAttended} / {sess.runningDelivered}
                                </span>
                              </div>

                              {sess.is75Milestone && (
                                <div style={{ background: "#dcfce7", color: "#15803d", padding: "3px 8px", borderRadius: 5, fontSize: 10.5, fontWeight: 800, display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                                  <CheckCircle2 size={12} color="#16a34a" />
                                  <span>Milestone: Crosses 75.0% threshold for {sess.subjectName}!</span>
                                </div>
                              )}

                              {sess.isBufferRestored && (
                                <div style={{ background: "#dbeafe", color: "#1e40af", padding: "3px 8px", borderRadius: 5, fontSize: 10.5, fontWeight: 800, display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                                  <ShieldCheck size={12} color="#2563eb" />
                                  <span>Pre-leave buffer level restored for {sess.subjectName} ({sess.pctAfter}%)</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Day-by-Day Timeline of Missed Periods */}
                {multiDaySimulation.dayByDayBreakdown.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      <Clock size={15} color="#2563eb" />
                      <span>Timeline of Lectures Being Skipped on Leave:</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {multiDaySimulation.dayByDayBreakdown.map((dayItem, dIdx) => (
                        <div
                          key={dIdx}
                          style={{
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: 10,
                            padding: "10px 14px",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a" }}>
                              {dayItem.day} ({dayItem.dateFormatted})
                            </span>
                            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>
                              {dayItem.totalClasses} classes scheduled
                            </span>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {dayItem.periods.map((p, pIdx) => (
                              <div
                                key={pIdx}
                                style={{
                                  fontSize: 11,
                                  background: "#ffffff",
                                  border: "1px solid #e2e8f0",
                                  padding: "5px 9px",
                                  borderRadius: 6,
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  color: "#334155",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span
                                    style={{
                                      fontSize: 9.5,
                                      fontWeight: 900,
                                      background:
                                        p.type === "PR"
                                          ? "#faf5ff"
                                          : p.type === "TUT"
                                          ? "#fffbeb"
                                          : "#eff6ff",
                                      color:
                                        p.type === "PR"
                                          ? "#7c3aed"
                                          : p.type === "TUT"
                                          ? "#b45309"
                                          : "#1e40af",
                                      border: `1px solid ${
                                        p.type === "PR"
                                          ? "#ddd6fe"
                                          : p.type === "TUT"
                                          ? "#fde68a"
                                          : "#bfdbfe"
                                      }`,
                                      padding: "1px 5px",
                                      borderRadius: 4,
                                    }}
                                  >
                                    {p.type || "PP"}
                                  </span>
                                  <span style={{ fontWeight: 700 }}>{p.cleanName || p.subjectName}</span>
                                </div>
                                <span style={{ color: "#64748b" }}>
                                  {p.timeSlot} &bull; {p.room || "Room"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
