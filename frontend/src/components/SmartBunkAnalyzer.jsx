import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar as CalendarIcon,
  Sparkles,
  TrendingDown,
  Info,
  ChevronRight,
  Zap,
} from "lucide-react";
import {
  getDaySchedule,
  resolveSubjectCode,
  cleanSubjectBaseName,
  calculateAttendance,
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
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  // Default to today if it's a weekday, else Monday
  const [selectedDay, setSelectedDay] = useState(
    DAYS.includes(todayDayName) ? todayDayName : "Monday"
  );
  const [selectedLeaveDays, setSelectedLeaveDays] = useState([]);

  // 1. Weekly Day-by-Day Bunk Safety Intelligence Engine
  const weeklyBunkAnalysis = useMemo(() => {
    const subjectMap = new Map();
    allSectionSubjects.forEach((s) => subjectMap.set(s.subjectName, s));

    const totalOverallAtt = overallCalculation.totalAttended || 0;
    const totalOverallDel = overallCalculation.totalDelivered || 0;
    const currentOverallPct = overallCalculation.percentage || 100;

    const today = new Date();
    const currentDayNum = today.getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
    const dayMap = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5 };

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
          { type: period.type || "PP", attended: 18, delivered: 24 },
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

    selectedLeaveDays.forEach((dayName) => {
      const dayData = weeklyBunkAnalysis.find((d) => d.day === dayName);
      if (dayData) {
        totalMissedPeriods += dayData.totalClasses;
        dayData.periods.forEach((p) => {
          const count = affectedSubjects.get(p.subjectName) || 0;
          affectedSubjects.set(p.subjectName, count + 1);
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

    const criticalSubjectList = [];
    affectedSubjects.forEach((missedCount, subName) => {
      const sub = allSectionSubjects.find((s) => s.subjectName === subName);
      if (sub) {
        const sim = calculateAttendance({
          components: sub.components,
          simulateAbsent: missedCount,
          targetPercentage: 75,
        });
        if (sim.simulatedPercentage < 75) {
          criticalSubjectList.push({
            subjectName: subName,
            currentPct: sim.currentPercentage,
            projectedPct: sim.simulatedPercentage,
            missedCount,
          });
        }
      }
    });

    return {
      totalDays: selectedLeaveDays.length,
      totalMissedPeriods,
      simulatedPercentage: Number(simPct.toFixed(2)),
      delta: Number(delta.toFixed(2)),
      isSafe: simPct >= 75 && criticalSubjectList.length === 0,
      criticalSubjectList,
    };
  }, [
    selectedLeaveDays,
    weeklyBunkAnalysis,
    overallCalculation,
    allSectionSubjects,
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
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: isMobile ? 6 : 10,
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
      {selectedDayData && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
              gap: 14,
              marginTop: 6,
            }}
          >
            <div>
              <h4
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <CalendarIcon size={16} color="#2563eb" />
                <span>Multi-Day Leave / Vacation Planner</span>
              </h4>
              <p
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  margin: "2px 0 0 0",
                }}
              >
                Select multiple days you plan to take leave to see the combined impact on your semester attendance.
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {DAYS.map((dName) => {
                const isChecked = selectedLeaveDays.includes(dName);
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
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: isChecked
                        ? "1.5px solid #2563eb"
                        : "1px solid #cbd5e1",
                      background: isChecked ? "#eff6ff" : "#ffffff",
                      color: isChecked ? "#1e40af" : "#475569",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        border: isChecked
                          ? "1.5px solid #2563eb"
                          : "1px solid #94a3b8",
                        background: isChecked ? "#2563eb" : "transparent",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ffffff",
                        fontSize: 10,
                        fontWeight: 900,
                      }}
                    >
                      {isChecked ? "✓" : ""}
                    </span>
                    <span>{dName}</span>
                  </button>
                );
              })}

              {selectedLeaveDays.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedLeaveDays([])}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "none",
                    background: "#f1f5f9",
                    color: "#64748b",
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Clear Selection
                </button>
              )}
            </div>

            {multiDaySimulation && (
              <div
                style={{
                  background: multiDaySimulation.isSafe ? "#f0fdf4" : "#fef2f2",
                  border: `1.5px solid ${
                    multiDaySimulation.isSafe ? "#86efac" : "#fca5a5"
                  }`,
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13.5,
                      fontWeight: 800,
                      color: multiDaySimulation.isSafe ? "#166534" : "#991b1b",
                    }}
                  >
                    {multiDaySimulation.isSafe
                      ? `Taking ${multiDaySimulation.totalDays} day(s) leave is Safe!`
                      : `High Risk: Taking leave on ${selectedLeaveDays.join(
                          ", "
                        )} causes attendance shortage!`}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                      color: multiDaySimulation.isSafe ? "#166534" : "#dc2626",
                    }}
                  >
                    Projected Aggregate: {multiDaySimulation.simulatedPercentage}% (
                    {multiDaySimulation.delta}%)
                  </span>
                </div>

                {multiDaySimulation.criticalSubjectList.length > 0 && (
                  <div style={{ fontSize: 12, color: "#991b1b", marginTop: 4 }}>
                    <strong>Subjects that will drop below 75%:</strong>
                    <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                      {multiDaySimulation.criticalSubjectList.map((cs, csIdx) => (
                        <li key={csIdx}>
                          {cs.subjectName}: drops from {cs.currentPct}% &rarr;{" "}
                          <strong style={{ color: "#dc2626" }}>
                            {cs.projectedPct}%
                          </strong>{" "}
                          (after {cs.missedCount} missed classes)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
