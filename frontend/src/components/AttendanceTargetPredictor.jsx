import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Info,
  Zap,
  Flame,
  ShieldCheck,
  RotateCcw,
  Sliders,
  CalendarCheck,
  CalendarX,
  Compass,
} from "lucide-react";
import {
  calculateAttendance,
  estimateTargetReachDate,
  simulateMissPenalty,
  simulateMultiPhaseAttendance,
  resolveSubjectCode,
  TIME_SLOTS,
} from "../utils/timetableHelper";

export default function AttendanceTargetPredictor({
  activeCatalogItem = null,
  activeCalculation = null,
  targetGoal = 75,
  setTargetGoal = () => {},
  componentInputs = [],
  selectedSection = "CSE-A",
  studentData = null,
  isMobile = false,
}) {
  // Current active subject data
  const subjectName = activeCatalogItem?.subjectName || "Selected Subject";
  const subCode = resolveSubjectCode({ subject: subjectName }, studentData);
  const weeklyOccurrences = activeCatalogItem?.weeklyOccurrences || [];

  // Internal Tabs within the Target Predictor Engine
  const [engineView, setEngineView] = useState("all_schedule"); // "all_schedule" | "penalty_simulator" | "multiphase_planner"

  // 1. All-dates schedule expansion state
  const [showAllDates, setShowAllDates] = useState(false);

  // 2. Interactive Penalty What-If Slider State
  const [simulateMissCount, setSimulateMissCount] = useState(1);

  // 3. Multi-Phase Goal & Post-Target Bunk Planner State
  const [multiPhaseTarget, setMultiPhaseTarget] = useState(80);
  const [plannedBunkCount, setPlannedBunkCount] = useState(6);
  const [recoveryTarget, setRecoveryTarget] = useState(75);

  // Current stats
  const totalAttended = activeCalculation?.totalAttended || 0;
  const totalDelivered = activeCalculation?.totalDelivered || 0;
  const currentPct = activeCalculation?.currentPercentage || 0;
  const isCurrentlySafe = currentPct >= targetGoal;

  // Base calendar projection for current targetGoal
  const baseProjection = useMemo(() => {
    if (!activeCalculation || activeCalculation.classesNeeded <= 0 || weeklyOccurrences.length === 0) {
      return null;
    }
    return estimateTargetReachDate(
      activeCalculation.classesNeeded,
      weeklyOccurrences,
      new Date(),
      totalAttended,
      totalDelivered,
      targetGoal,
      200
    );
  }, [activeCalculation, weeklyOccurrences, totalAttended, totalDelivered, targetGoal]);

  // Safe Bunk projection for current targetGoal (if currently above target)
  const safeBunkProjection = useMemo(() => {
    if (!activeCalculation || activeCalculation.safeBunks <= 0 || weeklyOccurrences.length === 0) {
      return null;
    }
    return estimateTargetReachDate(
      activeCalculation.safeBunks,
      weeklyOccurrences,
      new Date(),
      totalAttended,
      totalDelivered,
      targetGoal,
      200
    );
  }, [activeCalculation, weeklyOccurrences, totalAttended, totalDelivered, targetGoal]);

  // Interactive Miss Penalty Simulation
  const missPenaltyData = useMemo(() => {
    if (weeklyOccurrences.length === 0) return null;
    return simulateMissPenalty({
      currentAttended: totalAttended,
      currentDelivered: totalDelivered,
      targetPercentage: targetGoal,
      missedCount: simulateMissCount,
      weeklyOccurrences,
      startDate: new Date(),
    });
  }, [totalAttended, totalDelivered, targetGoal, simulateMissCount, weeklyOccurrences]);

  // Multi-Phase Attendance & Post-Target Bunk Simulation
  const multiPhaseData = useMemo(() => {
    if (weeklyOccurrences.length === 0) return null;
    return simulateMultiPhaseAttendance({
      currentAttended: totalAttended,
      currentDelivered: totalDelivered,
      targetGoal: multiPhaseTarget,
      plannedBunksAfterTarget: plannedBunkCount,
      recoveryTarget: recoveryTarget,
      weeklyOccurrences,
      startDate: new Date(),
    });
  }, [totalAttended, totalDelivered, multiPhaseTarget, plannedBunkCount, recoveryTarget, weeklyOccurrences]);

  // All required sessions to display
  const allSessions = baseProjection?.requiredSessions || [];
  const visibleSessions = showAllDates ? allSessions : (allSessions.length <= 15 ? allSessions : allSessions.slice(0, 15));

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1.5px solid #e2e8f0",
        borderRadius: 20,
        padding: isMobile ? "16px 14px" : "24px 26px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
        marginTop: 10,
      }}
    >
      {/* ── HEADER & TARGET CONTROLS ────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 14,
          paddingBottom: 16,
          borderBottom: "1.5px solid #f1f5f9",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                fontWeight: 900,
                background: "#f0fdf4",
                color: "#166534",
                border: "1px solid #bbf7d0",
                padding: "3px 9px",
                borderRadius: 8,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              <Activity size={13} color="#16a34a" /> Live Predictive Intelligence
            </span>
            {subCode && (
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "'Space Mono', monospace",
                  fontWeight: 800,
                  color: "#2563eb",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  padding: "3px 8px",
                  borderRadius: 8,
                }}
              >
                {subCode}
              </span>
            )}
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#475569",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                padding: "3px 8px",
                borderRadius: 8,
              }}
            >
              Section {selectedSection} Routine
            </span>
          </div>

          <h3
            style={{
              fontSize: isMobile ? 18 : 22,
              fontWeight: 900,
              color: "#0f172a",
              margin: "8px 0 2px 0",
              lineHeight: 1.2,
            }}
          >
            {subjectName} — Target Predictor &amp; Class Schedule
          </h3>
          <p style={{ fontSize: 12.5, color: "#64748b", margin: 0 }}>
            Exact date-by-date timetable schedule, holiday exclusions, penalty multiplier facts &amp; post-target bunk planning.
          </p>
        </div>

        {/* Target Goal Selector Pills */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: isMobile ? "flex-start" : "flex-end" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
            Target Attendance Goal: <strong style={{ color: "#2563eb", fontSize: 13 }}>{targetGoal}%</strong>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[75, 80, 85, 90].map((goal) => {
              const isSelected = targetGoal === goal;
              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => setTargetGoal(goal)}
                  style={{
                    background: isSelected ? "#2563eb" : "#f8fafc",
                    color: isSelected ? "#ffffff" : "#475569",
                    border: `1.5px solid ${isSelected ? "#2563eb" : "#cbd5e1"}`,
                    padding: "5px 12px",
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: isSelected ? "0 2px 8px rgba(37, 99, 235, 0.25)" : "none",
                  }}
                >
                  {goal}% {goal === 75 ? "Threshold" : goal === 80 ? "Safe" : goal === 85 ? "Distinction" : "Top"}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── TOP KPI SUMMARY CARDS ─────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 12,
        }}
      >
        {/* Metric 1: Current Attendance */}
        <div
          style={{
            background: "#f8fafc",
            border: "1.5px solid #e2e8f0",
            borderRadius: 14,
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
            Current Status
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: currentPct >= targetGoal ? "#059669" : "#dc2626" }}>
            {currentPct}%
          </div>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>
            {totalAttended} / {totalDelivered} classes ({activeCalculation?.safeBunks > 0 ? `${activeCalculation.safeBunks} safe bunks` : `${activeCalculation?.classesNeeded || 0} classes deficit`})
          </div>
        </div>

        {/* Metric 2: Classes Required or Safe Bunks */}
        <div
          style={{
            background: isCurrentlySafe ? "#f0fdf4" : "#fffbeb",
            border: `1.5px solid ${isCurrentlySafe ? "#bbf7d0" : "#fde68a"}`,
            borderRadius: 14,
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: isCurrentlySafe ? "#166534" : "#92400e", textTransform: "uppercase" }}>
            {isCurrentlySafe ? `Buffer Above ${targetGoal}%` : `Sprint Needed for ${targetGoal}%`}
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: isCurrentlySafe ? "#15803d" : "#b45309" }}>
            {isCurrentlySafe
              ? `${activeCalculation?.safeBunks || 0} Safe Bunks`
              : `${activeCalculation?.classesNeeded || 0} Consecutive Classes`}
          </div>
          <div style={{ fontSize: 11, color: isCurrentlySafe ? "#166534" : "#92400e", fontWeight: 700 }}>
            {isCurrentlySafe ? "Can miss without falling below target" : "Must attend 100% without absence"}
          </div>
        </div>

        {/* Metric 3: Target Reach Date */}
        <div
          style={{
            background: "#eff6ff",
            border: "1.5px solid #bfdbfe",
            borderRadius: 14,
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: "#1e40af", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 5 }}>
            <CalendarIcon size={13} />
            {isCurrentlySafe ? `Buffer Spans Through` : `Estimated Reach Date`}
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#1e3a8a" }}>
            {isCurrentlySafe
              ? safeBunkProjection?.estimatedDate || "Safe Buffer Maintained"
              : baseProjection?.estimatedDate || "Goal Already Reached"}
          </div>
          <div style={{ fontSize: 11, color: "#1e40af", fontWeight: 700 }}>
            {baseProjection?.estimatedWeeks
              ? `~${baseProjection.estimatedWeeks} weeks (${weeklyOccurrences.length} classes/week routine)`
              : `${weeklyOccurrences.length} slots/week scheduled`}
          </div>
        </div>

        {/* Metric 4: Semester Attainability */}
        <div
          style={{
            background: "#faf5ff",
            border: "1.5px solid #e9d5ff",
            borderRadius: 14,
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 5 }}>
            <Compass size={13} /> Semester Timeline
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#6b21a8", display: "flex", alignItems: "center", gap: 6 }}>
            {baseProjection?.isAttainable ? (
              <>
                <span>Attainable</span> <CheckCircle2 size={16} color="#16a34a" />
              </>
            ) : (
              <>
                <span>Warning</span> <AlertTriangle size={16} color="#ea580c" />
              </>
            )}
          </div>
          <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700 }}>
            Max attainable: <strong>{baseProjection?.maxAttainablePercentage || 100}%</strong> (End: 31 Oct)
          </div>
        </div>
      </div>

      {/* ── ENGINE NAVIGATION SUB-TABS ─────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 6,
          background: "#f1f5f9",
          padding: 4,
          borderRadius: 12,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => setEngineView("all_schedule")}
          style={{
            flex: 1,
            minWidth: isMobile ? "100%" : "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "9px 14px",
            borderRadius: 9,
            fontSize: 12.5,
            fontWeight: 800,
            background: engineView === "all_schedule" ? "#ffffff" : "transparent",
            color: engineView === "all_schedule" ? "#0f172a" : "#64748b",
            border: "none",
            boxShadow: engineView === "all_schedule" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          <CalendarCheck size={15} color={engineView === "all_schedule" ? "#2563eb" : "#64748b"} />
          1. Complete Class Schedule Dates ({allSessions.length})
        </button>

        <button
          type="button"
          onClick={() => setEngineView("penalty_simulator")}
          style={{
            flex: 1,
            minWidth: isMobile ? "100%" : "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "9px 14px",
            borderRadius: 9,
            fontSize: 12.5,
            fontWeight: 800,
            background: engineView === "penalty_simulator" ? "#ffffff" : "transparent",
            color: engineView === "penalty_simulator" ? "#0f172a" : "#64748b",
            border: "none",
            boxShadow: engineView === "penalty_simulator" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          <Flame size={15} color={engineView === "penalty_simulator" ? "#ea580c" : "#64748b"} />
          2. Miss Penalty &amp; Fact Simulator
        </button>

        <button
          type="button"
          onClick={() => setEngineView("multiphase_planner")}
          style={{
            flex: 1,
            minWidth: isMobile ? "100%" : "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "9px 14px",
            borderRadius: 9,
            fontSize: 12.5,
            fontWeight: 800,
            background: engineView === "multiphase_planner" ? "#ffffff" : "transparent",
            color: engineView === "multiphase_planner" ? "#0f172a" : "#64748b",
            border: "none",
            boxShadow: engineView === "multiphase_planner" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          <Compass size={15} color={engineView === "multiphase_planner" ? "#7c3aed" : "#64748b"} />
          3. Multi-Phase Goal &amp; Post-Bunk Roadmap
        </button>
      </div>

      {/* ── TAB 1: COMPLETE CLASS SCHEDULE DATES ───────────────────────────── */}
      {engineView === "all_schedule" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 7 }}>
                <CalendarCheck size={16} color="#2563eb" />
                All Required Class Sessions to Reach {targetGoal}% ({allSessions.length} total classes)
              </h4>
              <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
                Every single lecture day and time slot based on Section {selectedSection} timetable. Sundays, 2nd Saturdays &amp; Gazetted holidays are excluded.
              </p>
            </div>

            {allSessions.length > 15 && (
              <button
                type="button"
                onClick={() => setShowAllDates(!showAllDates)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  background: "#eff6ff",
                  color: "#2563eb",
                  border: "1px solid #bfdbfe",
                  padding: "5px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {showAllDates ? (
                  <>
                    <ChevronUp size={14} /> Collapse List (Show First 15)
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} /> View All {allSessions.length} Class Dates
                  </>
                )}
              </button>
            )}
          </div>

          {allSessions.length === 0 ? (
            <div
              style={{
                background: "#f0fdf4",
                border: "1.5px solid #bbf7d0",
                borderRadius: 14,
                padding: "20px",
                textAlign: "center",
                color: "#166534",
              }}
            >
              <CheckCircle2 size={32} color="#16a34a" style={{ margin: "0 auto 8px auto" }} />
              <div style={{ fontSize: 16, fontWeight: 900 }}>Attendance Already Above {targetGoal}%!</div>
              <p style={{ fontSize: 12.5, margin: "4px 0 0 0", color: "#15803d" }}>
                You have {activeCalculation?.safeBunks || 0} safe bunks available. No extra sprint classes needed at this moment.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 10,
              }}
            >
              {visibleSessions.map((ses, sIdx) => {
                const isMilestone = ses.isMilestoneTarget;
                return (
                  <div
                    key={sIdx}
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
                    {/* Header: Class # + Date + Milestone */}
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
                          Class #{ses.sessionNumber}
                        </span>
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a" }}>
                          {ses.dateStr}
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
                          <Target size={11} /> {targetGoal}% REACHED!
                        </span>
                      ) : (
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
                      )}
                    </div>

                    {/* Slot & Room */}
                    <div style={{ fontSize: 11, color: "#64748b", display: "flex", justifyContent: "space-between" }}>
                      <span><Clock size={11} style={{ display: "inline", verticalAlign: "middle" }} /> {ses.timeSlot}</span>
                      <span>Room {ses.room}</span>
                    </div>

                    {/* Running Attendance Progress */}
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
                        After this class:
                      </span>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 900,
                          color: ses.runningPercentage >= targetGoal ? "#16a34a" : "#2563eb",
                        }}
                      >
                        {ses.runningAttended}/{ses.runningDelivered} ({ses.runningPercentage}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {allSessions.length > 6 && !showAllDates && (
            <div style={{ textAlign: "center", marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setShowAllDates(true)}
                style={{
                  background: "#f8fafc",
                  border: "1.5px dashed #cbd5e1",
                  color: "#475569",
                  padding: "8px 16px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                + Show remaining {allSessions.length - 6} class dates until target
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: MISS PENALTY & INTERESTING FACT SIMULATOR ───────────────── */}
      {engineView === "penalty_simulator" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Interesting Fact Educational Banner */}
          <div
            style={{
              background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
              border: "1.5px solid #fed7aa",
              borderRadius: 16,
              padding: "16px 18px",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "#ea580c",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Flame size={20} />
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 900, color: "#c2410c", textTransform: "uppercase" }}>
                Crucial Attendance Math Fact: The Recovery Multiplier
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: "#7c2d12", margin: "2px 0 4px 0" }}>
                Target {targetGoal}% requires <span style={{ color: "#ea580c" }}>{missPenaltyData?.recoveryMultiplier || 3}x</span> consecutive classes to recover from every single absence!
              </div>
              <div style={{ fontSize: 12, color: "#9a3412", lineHeight: 1.4 }}>
                Mathematically, to maintain a target of <strong>T%</strong>, missing <strong>1 class</strong> requires attending <strong>T / (100 - T)</strong> consecutive classes without absence.
                <br />
                • At <strong>75% Goal:</strong> 1 missed class = <strong>+3 extra classes</strong> needed.
                <br />
                • At <strong>80% Goal:</strong> 1 missed class = <strong>+4 extra classes</strong> needed.
                <br />
                • At <strong>85% Goal:</strong> 1 missed class = <strong>+5.67 extra classes</strong> needed.
              </div>
            </div>
          </div>

          {/* Interactive What-If Miss Simulator Slider */}
          <div
            style={{
              background: "#ffffff",
              border: "1.5px solid #e2e8f0",
              borderRadius: 14,
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <h5 style={{ fontSize: 14, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                  Simulate Missing Classes During This Sprint
                </h5>
                <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
                  Adjust the slider to see how many extra classes get added and how the target date gets pushed back.
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {[1, 2, 3, 5, 8].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSimulateMissCount(num)}
                    style={{
                      background: simulateMissCount === num ? "#ea580c" : "#f8fafc",
                      color: simulateMissCount === num ? "#ffffff" : "#475569",
                      border: `1px solid ${simulateMissCount === num ? "#ea580c" : "#cbd5e1"}`,
                      padding: "4px 9px",
                      borderRadius: 8,
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    +{num} Missed
                  </button>
                ))}
              </div>
            </div>

            {/* Slider Input */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <input
                type="range"
                min="1"
                max="12"
                value={simulateMissCount}
                onChange={(e) => setSimulateMissCount(parseInt(e.target.value, 10))}
                style={{ flex: 1, accentColor: "#ea580c", height: 6, cursor: "pointer" }}
              />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  color: "#ea580c",
                  background: "#fff7ed",
                  border: "1.5px solid #fed7aa",
                  padding: "4px 12px",
                  borderRadius: 10,
                  minWidth: 90,
                  textAlign: "center",
                }}
              >
                {simulateMissCount} {simulateMissCount === 1 ? "Class" : "Classes"} Missed
              </span>
            </div>

            {/* Impact Calculation Cards */}
            {missPenaltyData && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 10,
                  marginTop: 6,
                }}
              >
                <div style={{ background: "#fff7ed", border: "1px solid #ffedd5", borderRadius: 12, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: "#9a3412", textTransform: "uppercase" }}>Original Requirement</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#c2410c" }}>{missPenaltyData.baseNeeded} Classes</div>
                  <div style={{ fontSize: 11, color: "#9a3412" }}>Date: {missPenaltyData.baseProjection?.estimatedDate || "N/A"}</div>
                </div>

                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: "#991b1b", textTransform: "uppercase" }}>New Requirement After Miss</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#dc2626" }}>{missPenaltyData.newNeeded} Classes (+{missPenaltyData.extraClassesNeeded} extra)</div>
                  <div style={{ fontSize: 11, color: "#991b1b" }}>New Date: {missPenaltyData.delayedProjection?.estimatedDate || "N/A"}</div>
                </div>

                <div style={{ background: "#faf5ff", border: "1px solid #f3e8ff", borderRadius: 12, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: "#6b21a8", textTransform: "uppercase" }}>Calendar Delay</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#7c3aed" }}>+{missPenaltyData.delayInDays} Days Delay</div>
                  <div style={{ fontSize: 11, color: "#6b21a8" }}>Due to holidays &amp; timetable gaps</div>
                </div>
              </div>
            )}

            {/* Appended sessions preview */}
            {missPenaltyData?.appendedSessions && missPenaltyData.appendedSessions.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: "#9a3412", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                  <AlertTriangle size={13} color="#c2410c" /> Additional Class Dates You Will Be Forced to Attend:
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {missPenaltyData.appendedSessions.map((ses, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: "#fff7ed",
                        color: "#c2410c",
                        border: "1px solid #fed7aa",
                        padding: "3px 8px",
                        borderRadius: 6,
                      }}
                    >
                      {ses.dateStr} ({ses.day} {ses.timeSlot})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: MULTI-PHASE GOAL & POST-TARGET BUNK ROADMAP ──────────────── */}
      {engineView === "multiphase_planner" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Header & Inputs */}
          <div
            style={{
              background: "#faf5ff",
              border: "1.5px solid #e9d5ff",
              borderRadius: 16,
              padding: "16px 18px",
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
                  background: "#7c3aed",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Compass size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 900, color: "#4c1d95", margin: 0 }}>
                  Multi-Phase Strategy: Reach Goal → Take Planned Bunks → Post-Bunk Recovery
                </h4>
                <p style={{ fontSize: 12, color: "#6b21a8", margin: "2px 0 0 0" }}>
                  Simulate: "If I reach 80% attendance, and then miss 6 classes (for fest/vacation), how many classes and on which exact dates will I have to attend after that to recover?"
                </p>
              </div>
            </div>

            {/* Controls Bar */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                gap: 12,
                marginTop: 4,
              }}
            >
              {/* Control 1: Primary Target Goal */}
              <div style={{ background: "#ffffff", border: "1px solid #ddd6fe", borderRadius: 12, padding: "10px 12px" }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#6b21a8", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  1. Primary Target Goal
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <select
                    value={multiPhaseTarget}
                    onChange={(e) => setMultiPhaseTarget(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1.5px solid #c084fc",
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#4c1d95",
                      background: "#faf5ff",
                      cursor: "pointer",
                    }}
                  >
                    <option value={75}>75% (Minimum Threshold)</option>
                    <option value={80}>80% (Recommended Buffer)</option>
                    <option value={85}>85% (High Safety)</option>
                    <option value={90}>90% (Top Distinction)</option>
                  </select>
                </div>
              </div>

              {/* Control 2: Planned Bunks Count */}
              <div style={{ background: "#ffffff", border: "1px solid #ddd6fe", borderRadius: 12, padding: "10px 12px" }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#6b21a8", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  2. Planned Absences After Goal
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setPlannedBunkCount(Math.max(1, plannedBunkCount - 1))}
                    style={{
                      background: "#f3e8ff",
                      color: "#6b21a8",
                      border: "none",
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={plannedBunkCount}
                    onChange={(e) => setPlannedBunkCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "4px 8px",
                      borderRadius: 8,
                      border: "1.5px solid #c084fc",
                      fontSize: 13,
                      fontWeight: 900,
                      color: "#4c1d95",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setPlannedBunkCount(plannedBunkCount + 1)}
                    style={{
                      background: "#f3e8ff",
                      color: "#6b21a8",
                      border: "none",
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Control 3: Recovery Target Goal */}
              <div style={{ background: "#ffffff", border: "1px solid #ddd6fe", borderRadius: 12, padding: "10px 12px" }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#6b21a8", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  3. Recovery Target Goal
                </label>
                <select
                  value={recoveryTarget}
                  onChange={(e) => setRecoveryTarget(Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1.5px solid #c084fc",
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#4c1d95",
                    background: "#faf5ff",
                    cursor: "pointer",
                  }}
                >
                  <option value={75}>Recover to 75% (Safe Pass)</option>
                  <option value={80}>Recover to 80% (Buffer Safe)</option>
                  <option value={85}>Recover to 85% (Distinction)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3-Step Strategy Flow Cards */}
          {multiPhaseData && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Step 1: Reach Primary Goal */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 14,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 900, background: "#2563eb", color: "#ffffff", padding: "2px 8px", borderRadius: 6 }}>
                      STEP 1
                    </span>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>
                      Sprint from {currentPct}% to {multiPhaseData.primaryTarget}% Target
                    </span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#2563eb" }}>
                    Reach Date: {multiPhaseData.phase1.reachDateStr}
                  </span>
                </div>

                <div style={{ fontSize: 12, color: "#475569" }}>
                  Attend <strong>{multiPhaseData.phase1.classesNeeded} consecutive classes</strong> without absence.
                  Attendance will reach <strong>{multiPhaseData.phase1.projectedPercentage}%</strong> ({multiPhaseData.phase1.totalAttended}/{multiPhaseData.phase1.totalDelivered}).
                </div>
              </div>

              {/* Step 2: The Planned Absences */}
              <div
                style={{
                  background: multiPhaseData.phase2.isBelow75 ? "#fef2f2" : "#fffbeb",
                  border: `1.5px solid ${multiPhaseData.phase2.isBelow75 ? "#fecaca" : "#fde68a"}`,
                  borderRadius: 14,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 900,
                        background: multiPhaseData.phase2.isBelow75 ? "#dc2626" : "#ea580c",
                        color: "#ffffff",
                        padding: "2px 8px",
                        borderRadius: 6,
                      }}
                    >
                      STEP 2
                    </span>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>
                      Take Planned {multiPhaseData.phase2.bunkCount} Classes Absent
                    </span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: multiPhaseData.phase2.isBelow75 ? "#dc2626" : "#b45309" }}>
                    Spans Through: {multiPhaseData.phase2.lastBunkDateStr}
                  </span>
                </div>

                <div style={{ fontSize: 12, color: "#475569" }}>
                  After missing these {multiPhaseData.phase2.bunkCount} classes, attendance drops by <strong>-{multiPhaseData.phase2.percentageDrop}%</strong> down to:{" "}
                  <strong style={{ color: multiPhaseData.phase2.isBelow75 ? "#dc2626" : "#b45309", fontSize: 13 }}>
                    {multiPhaseData.phase2.postBunkPercentage}% ({multiPhaseData.phase2.postBunkAttended}/{multiPhaseData.phase2.postBunkDelivered})
                  </strong>
                </div>

                {/* Dates of the absent classes */}
                {multiPhaseData.phase2.bunkSessions.length > 0 && (
                  <div style={{ marginTop: 2 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#78350f", marginBottom: 4 }}>
                      Missed Class Sessions Schedule:
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {multiPhaseData.phase2.bunkSessions.map((bunk, bIdx) => (
                        <span
                          key={bIdx}
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            background: "#ffffff",
                            color: "#991b1b",
                            border: "1px solid #fecaca",
                            padding: "2px 7px",
                            borderRadius: 6,
                          }}
                        >
                          #{bunk.bunkNumber}: {bunk.dateStr} ({bunk.day} {bunk.timeSlot})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Post-Bunk Recovery Roadmap */}
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1.5px solid #86efac",
                  borderRadius: 14,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 900, background: "#16a34a", color: "#ffffff", padding: "2px 8px", borderRadius: 6 }}>
                      STEP 3
                    </span>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: "#065f46" }}>
                      Post-Bunk Recovery Roadmap to {multiPhaseData.recoveryTarget}%
                    </span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#16a34a" }}>
                    Recovery Date: {multiPhaseData.phase3.recoveryReachDateStr}
                  </span>
                </div>

                {multiPhaseData.phase3.classesNeeded > 0 ? (
                  <div style={{ fontSize: 12, color: "#166534" }}>
                    Must attend <strong>{multiPhaseData.phase3.classesNeeded} more consecutive classes</strong> post-absence starting from <strong>{multiPhaseData.phase2.lastBunkDateStr}</strong> onwards to recover back to {multiPhaseData.recoveryTarget}%.
                    Final attendance will become <strong>{multiPhaseData.phase3.finalPercentage}%</strong> ({multiPhaseData.phase3.finalAttended}/{multiPhaseData.phase3.finalDelivered}).
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "#166534", display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <CheckCircle2 size={15} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      No extra classes needed! Even after missing {multiPhaseData.phase2.bunkCount} classes, your attendance remains at <strong>{multiPhaseData.phase2.postBunkPercentage}%</strong> which is safely &ge; {multiPhaseData.recoveryTarget}%. You still have <strong>{multiPhaseData.phase3.safeBunksRemaining} additional safe bunks</strong> remaining!
                    </div>
                  </div>
                )}

                {/* List of Recovery Class Dates */}
                {multiPhaseData.phase3.recoverySessions.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#166534", marginBottom: 4 }}>
                      Exact Recovery Class Dates to Attend:
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {multiPhaseData.phase3.recoverySessions.map((rec, rIdx) => (
                        <span
                          key={rIdx}
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            background: "#ffffff",
                            color: "#15803d",
                            border: "1px solid #bbf7d0",
                            padding: "2px 7px",
                            borderRadius: 6,
                          }}
                        >
                          {rec.dateStr} ({rec.day} {rec.timeSlot} • {rec.type})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
