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
  const [showAllRecoveryDates, setShowAllRecoveryDates] = useState(false);

  // 3. Multi-Phase Goal & Post-Target Bunk Planner State
  const [multiPhaseTarget, setMultiPhaseTarget] = useState(80);
  const [plannedBunkCount, setPlannedBunkCount] = useState(6);
  const [recoveryTarget, setRecoveryTarget] = useState(75);
  const [showPhase1Dates, setShowPhase1Dates] = useState(false);
  const [showPhase2Dates, setShowPhase2Dates] = useState(true);
  const [showPhase3Dates, setShowPhase3Dates] = useState(false);

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

  // All required sessions to display in Tab 1
  const allSessions = baseProjection?.requiredSessions || [];
  const visibleSessions = showAllDates ? allSessions : (allSessions.length <= 15 ? allSessions : allSessions.slice(0, 15));

  // Sessions to display in Tab 2 Recovery Schedule
  const recoverySessions = missPenaltyData?.recoverySessions || [];
  const visibleRecoverySessions = showAllRecoveryDates ? recoverySessions : (recoverySessions.length <= 15 ? recoverySessions : recoverySessions.slice(0, 15));

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
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          paddingBottom: 16,
          borderBottom: "1.5px solid #f1f5f9",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h3 style={{ fontSize: isMobile ? 16 : 19, fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.3px" }}>
              {subjectName} — Target Predictor &amp; Class Schedule
            </h3>
            {subCode && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  background: "#eff6ff",
                  color: "#2563eb",
                  border: "1px solid #bfdbfe",
                  padding: "2px 8px",
                  borderRadius: 6,
                }}
              >
                {subCode}
              </span>
            )}
          </div>
          <p style={{ fontSize: 12.5, color: "#64748b", margin: "4px 0 0 0" }}>
            Exact date-by-date timetable schedule, holiday exclusions, penalty multiplier facts &amp; post-target bunk planning.
          </p>
        </div>

        {/* Target Goal Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
            Target Goal:
          </span>
          <div
            style={{
              display: "flex",
              gap: 4,
              background: "#f8fafc",
              padding: 3,
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              width: isMobile ? "100%" : "auto",
              boxSizing: "border-box",
            }}
          >
            {[
              { val: 75, label: "75%" },
              { val: 80, label: "80%" },
              { val: 85, label: "85%" },
              { val: 90, label: "90%" },
            ].map(({ val, label }) => (
              <button
                key={val}
                type="button"
                onClick={() => setTargetGoal(val)}
                style={{
                  flex: isMobile ? 1 : "none",
                  background: targetGoal === val ? "#2563eb" : "transparent",
                  color: targetGoal === val ? "#ffffff" : "#475569",
                  border: "none",
                  borderRadius: 7,
                  padding: isMobile ? "6px 4px" : "5px 12px",
                  fontSize: isMobile ? 12 : 12.5,
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: targetGoal === val ? "0 2px 6px rgba(37, 99, 235, 0.22)" : "none",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── HIGH-LEVEL SUMMARY HERO CARDS ─────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(220px, 1fr))",
          gap: isMobile ? 8 : 12,
        }}
      >
        {/* Card 1: Current Status */}
        <div
          style={{
            background: isCurrentlySafe ? "#f0fdf4" : "#fff7ed",
            border: `1.5px solid ${isCurrentlySafe ? "#bbf7d0" : "#fed7aa"}`,
            borderRadius: 14,
            padding: isMobile ? "12px 12px" : "14px 16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 4,
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <div style={{ fontSize: 10.5, fontWeight: 800, color: isCurrentlySafe ? "#166534" : "#9a3412", textTransform: "uppercase", letterSpacing: "0.2px" }}>
            Current Status
          </div>
          <div style={{ fontSize: isMobile ? 22 : 25, fontWeight: 900, color: isCurrentlySafe ? "#15803d" : "#c2410c", lineHeight: 1.15 }}>
            {currentPct}%
          </div>
          <div style={{ fontSize: 11, color: isCurrentlySafe ? "#166534" : "#9a3412", lineHeight: 1.3 }}>
            {totalAttended}/{totalDelivered} classes ({activeCalculation?.deficit || 0} deficit)
          </div>
        </div>

        {/* Card 2: Sprint Needed / Safe Bunks */}
        <div
          style={{
            background: isCurrentlySafe ? "#f0fdfa" : "#fffbeb",
            border: `1.5px solid ${isCurrentlySafe ? "#99f6e4" : "#fde68a"}`,
            borderRadius: 14,
            padding: isMobile ? "12px 12px" : "14px 16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 4,
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <div style={{ fontSize: 10.5, fontWeight: 800, color: isCurrentlySafe ? "#0f766e" : "#b45309", textTransform: "uppercase", letterSpacing: "0.2px" }}>
            {isCurrentlySafe ? `Safe Bunks` : `Sprint for ${targetGoal}%`}
          </div>
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: isCurrentlySafe ? "#0d9488" : "#d97706", lineHeight: 1.2 }}>
            {isCurrentlySafe
              ? `${activeCalculation?.safeBunks || 0} Safe Bunks`
              : `${activeCalculation?.classesNeeded || 0} Classes`}
          </div>
          <div style={{ fontSize: 11, color: isCurrentlySafe ? "#0f766e" : "#b45309", lineHeight: 1.3 }}>
            {isCurrentlySafe ? `Can miss safely` : `100% streak needed`}
          </div>
        </div>

        {/* Card 3: Estimated Reach Date */}
        <div
          style={{
            background: "#eff6ff",
            border: "1.5px solid #bfdbfe",
            borderRadius: 14,
            padding: isMobile ? "12px 12px" : "14px 16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 4,
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <div style={{ fontSize: 10.5, fontWeight: 800, color: "#1e40af", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4, letterSpacing: "0.2px" }}>
            <CalendarIcon size={12} /> Reach Date
          </div>
          <div style={{ fontSize: isMobile ? 15.5 : 19, fontWeight: 900, color: "#1d4ed8", lineHeight: 1.25, wordBreak: "break-word" }}>
            {baseProjection?.estimatedDate || (isCurrentlySafe ? "Achieved" : "Exceeds Sem")}
          </div>
          <div style={{ fontSize: 11, color: "#1e40af", lineHeight: 1.3 }}>
            {baseProjection ? `~${baseProjection.estimatedWeeks} wks (${baseProjection.classesPerWeek}/wk)` : "Timetable active"}
          </div>
        </div>

        {/* Card 4: Semester Attainability */}
        <div
          style={{
            background: "#faf5ff",
            border: "1.5px solid #e9d5ff",
            borderRadius: 14,
            padding: isMobile ? "12px 12px" : "14px 16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 4,
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <div style={{ fontSize: 10.5, fontWeight: 800, color: "#6b21a8", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4, letterSpacing: "0.2px" }}>
            <Activity size={12} /> Timeline
          </div>
          <div style={{ fontSize: isMobile ? 16 : 19, fontWeight: 900, color: baseProjection?.isAttainable ? "#16a34a" : "#dc2626", lineHeight: 1.2 }}>
            {baseProjection?.isAttainable ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                Attainable <CheckCircle2 size={14} color="#16a34a" />
              </span>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                Critical <AlertTriangle size={14} color="#dc2626" />
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: "#6b21a8", lineHeight: 1.3 }}>
            Max: {baseProjection?.maxAttainablePercentage || currentPct}% (31 Oct)
          </div>
        </div>
      </div>

      {/* ── 3-SECTION NAVIGATION TABS ────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          background: "#f1f5f9",
          padding: 4,
          borderRadius: 12,
          gap: 4,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <button
          type="button"
          onClick={() => setEngineView("all_schedule")}
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "center",
            justifyContent: "center",
            gap: isMobile ? 2 : 6,
            padding: isMobile ? "8px 2px" : "9px 14px",
            borderRadius: 9,
            fontSize: isMobile ? 11 : 12.5,
            fontWeight: 800,
            background: engineView === "all_schedule" ? "#ffffff" : "transparent",
            color: engineView === "all_schedule" ? "#0f172a" : "#64748b",
            border: "none",
            boxShadow: engineView === "all_schedule" ? "0 2px 6px rgba(15, 23, 42, 0.08)" : "none",
            cursor: "pointer",
            transition: "all 0.15s ease",
            textAlign: "center",
          }}
        >
          <CalendarCheck size={14} color={engineView === "all_schedule" ? "#2563eb" : "#64748b"} />
          <span>{isMobile ? "1. Schedule" : "1. Complete Schedule"}</span>
        </button>

        <button
          type="button"
          onClick={() => setEngineView("penalty_simulator")}
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "center",
            justifyContent: "center",
            gap: isMobile ? 2 : 6,
            padding: isMobile ? "8px 2px" : "9px 14px",
            borderRadius: 9,
            fontSize: isMobile ? 11 : 12.5,
            fontWeight: 800,
            background: engineView === "penalty_simulator" ? "#ffffff" : "transparent",
            color: engineView === "penalty_simulator" ? "#0f172a" : "#64748b",
            border: "none",
            boxShadow: engineView === "penalty_simulator" ? "0 2px 6px rgba(15, 23, 42, 0.08)" : "none",
            cursor: "pointer",
            transition: "all 0.15s ease",
            textAlign: "center",
          }}
        >
          <Flame size={14} color={engineView === "penalty_simulator" ? "#ea580c" : "#64748b"} />
          <span>{isMobile ? "2. Miss Penalty" : "2. Miss Penalty"}</span>
        </button>

        <button
          type="button"
          onClick={() => setEngineView("multiphase_planner")}
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "center",
            justifyContent: "center",
            gap: isMobile ? 2 : 6,
            padding: isMobile ? "8px 2px" : "9px 14px",
            borderRadius: 9,
            fontSize: isMobile ? 11 : 12.5,
            fontWeight: 800,
            background: engineView === "multiphase_planner" ? "#ffffff" : "transparent",
            color: engineView === "multiphase_planner" ? "#0f172a" : "#64748b",
            border: "none",
            boxShadow: engineView === "multiphase_planner" ? "0 2px 6px rgba(15, 23, 42, 0.08)" : "none",
            cursor: "pointer",
            transition: "all 0.15s ease",
            textAlign: "center",
          }}
        >
          <Compass size={14} color={engineView === "multiphase_planner" ? "#7c3aed" : "#64748b"} />
          <span>{isMobile ? "3. Roadmap" : "3. Multi-Phase Roadmap"}</span>
        </button>
      </div>

      {/* ── TAB VIEWS WITH SMOOTH ANIMATION ─────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {/* ── TAB 1: COMPLETE CLASS SCHEDULE DATES ───────────────────────────── */}
        {engineView === "all_schedule" && (
          <motion.div
            key="all_schedule"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
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

            {allSessions.length > 15 && !showAllDates && (
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
                  + Show remaining {allSessions.length - 15} class dates until target
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB 2: MISS PENALTY & INTERESTING FACT SIMULATOR ───────────────── */}
        {engineView === "penalty_simulator" && (
          <motion.div
            key="penalty_simulator"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
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

            {/* Interactive What-If Miss Simulator Controls */}
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
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", gap: 10 }}>
                <div>
                  <h5 style={{ fontSize: 14, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                    Simulate Missing Classes During This Sprint
                  </h5>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
                    Adjust the slider to see how many extra classes get added and how the target date gets pushed back.
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: isMobile ? 4 : 6,
                    width: isMobile ? "100%" : "auto",
                    boxSizing: "border-box",
                  }}
                >
                  {[1, 2, 3, 5, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSimulateMissCount(num)}
                      style={{
                        background: simulateMissCount === num ? "#ea580c" : "#f8fafc",
                        color: simulateMissCount === num ? "#ffffff" : "#475569",
                        border: `1px solid ${simulateMissCount === num ? "#ea580c" : "#cbd5e1"}`,
                        padding: isMobile ? "6px 2px" : "5px 8px",
                        borderRadius: 8,
                        fontSize: isMobile ? 11 : 11.5,
                        fontWeight: 800,
                        cursor: "pointer",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      +{num} Miss
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual & Slider Input Controls */}
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: isMobile ? "stretch" : "center",
                  gap: 12,
                }}
              >
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={simulateMissCount}
                  onChange={(e) => setSimulateMissCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  style={{
                    flex: 1,
                    width: "100%",
                    accentColor: "#ea580c",
                    height: 6,
                    borderRadius: 999,
                    background: "#fed7aa",
                    cursor: "pointer",
                    outline: "none",
                  }}
                />

                {/* Direct Manual Stepper & Typing Box */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: isMobile ? "center" : "flex-start",
                    gap: 6,
                    background: "#fff7ed",
                    border: "1.5px solid #fed7aa",
                    borderRadius: 12,
                    padding: "4px 10px",
                    boxShadow: "0 1px 3px rgba(234,88,12,0.06)",
                    width: isMobile ? "100%" : "auto",
                    boxSizing: "border-box",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSimulateMissCount(Math.max(1, simulateMissCount - 1))}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      border: "1px solid #fed7aa",
                      background: "#ffedd5",
                      color: "#c2410c",
                      fontSize: 16,
                      fontWeight: 900,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s ease",
                    }}
                    title="Decrease missed count"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={simulateMissCount}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      const val = parseInt(raw, 10);
                      setSimulateMissCount(isNaN(val) ? 1 : Math.max(1, Math.min(50, val)));
                    }}
                    style={{
                      width: 36,
                      textAlign: "center",
                      border: "none",
                      background: "transparent",
                      fontSize: 15,
                      fontWeight: 900,
                      color: "#c2410c",
                      outline: "none",
                      padding: 0,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setSimulateMissCount(Math.min(50, simulateMissCount + 1))}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      border: "1px solid #fed7aa",
                      background: "#ffedd5",
                      color: "#c2410c",
                      fontSize: 16,
                      fontWeight: 900,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s ease",
                    }}
                    title="Increase missed count"
                  >
                    +
                  </button>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: "#9a3412", paddingLeft: 4, paddingRight: 4 }}>
                    {simulateMissCount === 1 ? "Class" : "Classes"} Missed
                  </span>
                </div>
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
                    <div style={{ fontSize: 11, color: "#9a3412", marginTop: 2 }}>
                      Date: <strong>{missPenaltyData.baseProjection?.estimatedDate || "Attainable"}</strong>
                    </div>
                  </div>

                  <div
                    style={{
                      background: missPenaltyData.delayedProjection?.isAttainable === false ? "#fef2f2" : "#fff7ed",
                      border: `1px solid ${missPenaltyData.delayedProjection?.isAttainable === false ? "#fecaca" : "#fed7aa"}`,
                      borderRadius: 12,
                      padding: "10px 12px",
                    }}
                  >
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: "#991b1b", textTransform: "uppercase" }}>New Requirement After Miss</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#dc2626" }}>
                      {missPenaltyData.newNeeded} Classes (+{missPenaltyData.extraClassesNeeded} extra)
                    </div>
                    <div style={{ fontSize: 11, color: "#991b1b", marginTop: 2 }}>
                      {missPenaltyData.delayedProjection?.isAttainable === false ? (
                        <span style={{ color: "#dc2626", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 3 }}>
                          <AlertTriangle size={11} color="#dc2626" /> Exceeds Semester (Max: {missPenaltyData.delayedProjection?.maxAttainablePercentage || 0}%)
                        </span>
                      ) : (
                        <>New Date: <strong>{missPenaltyData.delayedProjection?.estimatedDate || "Attainable"}</strong></>
                      )}
                    </div>
                  </div>

                  <div style={{ background: "#faf5ff", border: "1px solid #f3e8ff", borderRadius: 12, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: "#6b21a8", textTransform: "uppercase" }}>Calendar Delay</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#7c3aed" }}>
                      {missPenaltyData.delayedProjection?.isAttainable === false
                        ? "Beyond 31 Oct"
                        : `+${missPenaltyData.delayInDays} Days Delay`}
                    </div>
                    <div style={{ fontSize: 11, color: "#6b21a8", marginTop: 2 }}>
                      {missPenaltyData.delayedProjection?.isAttainable === false
                        ? `Exceeds ${missPenaltyData.delayedProjection?.totalRemainingSemClasses || 0} remaining classes`
                        : "Due to holidays & timetable gaps"}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── 2A. EXACT DATE-BY-DATE SIMULATED MISSED CLASSES ──────────────── */}
            {missPenaltyData?.missedSessions && missPenaltyData.missedSessions.length > 0 && (
              <div
                style={{
                  background: "#fff1f2",
                  border: "1.5px solid #fecdd3",
                  borderRadius: 16,
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <h5 style={{ fontSize: 14, fontWeight: 900, color: "#9f1239", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                      <TrendingDown size={16} color="#e11d48" />
                      Simulated Missed Classes Breakdown ({missPenaltyData.missedSessions.length} total)
                    </h5>
                    <p style={{ fontSize: 12, color: "#be123c", margin: "2px 0 0 0" }}>
                      Simulating consecutive absences on these exact dates and time slots:
                    </p>
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 800, background: "#ffffff", color: "#e11d48", padding: "3px 9px", borderRadius: 8, border: "1px solid #fda4af" }}>
                    Attendance Drops by -{(currentPct - (missPenaltyData.missedSessions[missPenaltyData.missedSessions.length - 1]?.runningPercentage || 0)).toFixed(2)}%
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: 10,
                  }}
                >
                  {missPenaltyData.missedSessions.map((missSes, mIdx) => (
                    <div
                      key={mIdx}
                      style={{
                        background: "#ffffff",
                        border: "1.5px solid #fecdd3",
                        borderRadius: 12,
                        padding: "10px 12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        boxShadow: "0 1px 4px rgba(225, 29, 72, 0.04)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 900,
                              background: "#e11d48",
                              color: "#ffffff",
                              padding: "1px 6px",
                              borderRadius: 5,
                            }}
                          >
                            Miss #{missSes.missNumber}
                          </span>
                          <span style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a" }}>
                            {missSes.dateStr}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 900,
                            background: "#fff1f2",
                            color: "#be123c",
                            border: "1px solid #fecdd3",
                            padding: "1px 6px",
                            borderRadius: 4,
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <TrendingDown size={11} color="#e11d48" /> -{missSes.percentageDrop}% Drop
                        </span>
                      </div>

                      <div style={{ fontSize: 11, color: "#64748b", display: "flex", justifyContent: "space-between" }}>
                        <span><Clock size={11} style={{ display: "inline", verticalAlign: "middle" }} /> {missSes.timeSlot}</span>
                        <span>Room {missSes.room} ({missSes.type})</span>
                      </div>

                      <div
                        style={{
                          marginTop: 4,
                          paddingTop: 6,
                          borderTop: "1px dashed #fecdd3",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontSize: 10.5, color: "#881337", fontWeight: 600 }}>
                          After this missed class:
                        </span>
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 900,
                            color: missSes.isBelow75 ? "#dc2626" : "#e11d48",
                          }}
                        >
                          {missSes.runningAttended}/{missSes.runningDelivered} ({missSes.runningPercentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 2B. EXACT DATE-BY-DATE MANDATORY RECOVERY CLASS SCHEDULE ────── */}
            {recoverySessions.length > 0 && (
              <div
                style={{
                  background: "#ffffff",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 16,
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
                      Mandatory Post-Absence Recovery Schedule ({recoverySessions.length} total classes)
                    </h5>
                    <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
                      Every class you must consecutively attend post-absence to restore your {targetGoal}% attendance goal:
                    </p>
                  </div>

                  {recoverySessions.length > 15 && (
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
                          <ChevronDown size={14} /> View All {recoverySessions.length} Recovery Dates
                        </>
                      )}
                    </button>
                  )}
                </div>

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
                              <Target size={11} /> {targetGoal}% RESTORED!
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

                        <div style={{ fontSize: 11, color: "#64748b", display: "flex", justifyContent: "space-between" }}>
                          <span><Clock size={11} style={{ display: "inline", verticalAlign: "middle" }} /> {recSes.timeSlot}</span>
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
                              color: recSes.runningPercentage >= targetGoal ? "#16a34a" : "#2563eb",
                            }}
                          >
                            {recSes.runningAttended}/{recSes.runningDelivered} ({recSes.runningPercentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {recoverySessions.length > 15 && !showAllRecoveryDates && (
                  <div style={{ textAlign: "center", marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => setShowAllRecoveryDates(true)}
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
                      + Show remaining {recoverySessions.length - 15} recovery class dates until target
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB 3: MULTI-PHASE GOAL & POST-TARGET BUNK ROADMAP ──────────────── */}
        {engineView === "multiphase_planner" && (
          <motion.div
            key="multiphase_planner"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
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
                    Multi-Phase Strategy: Reach Goal &gt; Take Planned Bunks &gt; Post-Bunk Recovery
                  </h4>
                  <p style={{ fontSize: 12, color: "#6b21a8", margin: "2px 0 0 0" }}>
                    Simulate: "If I reach {multiPhaseTarget}% attendance, and then miss {plannedBunkCount} classes (for fest/vacation), how many classes and on which exact dates will I have to attend after that to recover back to {recoveryTarget}%?"
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
                        border: "1px solid #e9d5ff",
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        fontSize: 16,
                        fontWeight: 900,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s ease",
                      }}
                      title="Decrease planned absences"
                    >
                      -
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={plannedBunkCount}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        const val = parseInt(raw, 10);
                        setPlannedBunkCount(isNaN(val) ? 1 : Math.max(1, Math.min(50, val)));
                      }}
                      style={{
                        flex: 1,
                        textAlign: "center",
                        padding: "4px 8px",
                        borderRadius: 8,
                        border: "1.5px solid #c084fc",
                        fontSize: 14,
                        fontWeight: 900,
                        color: "#4c1d95",
                        background: "#faf5ff",
                        outline: "none",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setPlannedBunkCount(Math.min(50, plannedBunkCount + 1))}
                      style={{
                        background: "#f3e8ff",
                        color: "#6b21a8",
                        border: "1px solid #e9d5ff",
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        fontSize: 16,
                        fontWeight: 900,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s ease",
                      }}
                      title="Increase planned absences"
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
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* ── STEP 1: REACH PRIMARY GOAL ─────────────────────────── */}
                <div
                  style={{
                    background: "#ffffff",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 14,
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 900,
                          background: multiPhaseData.phase1.isAttainable ? "#2563eb" : "#ea580c",
                          color: "#ffffff",
                          padding: "2px 8px",
                          borderRadius: 6,
                        }}
                      >
                        STEP 1
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                        Sprint from {currentPct}% to {multiPhaseData.primaryTarget}% Target
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: multiPhaseData.phase1.isAttainable ? "#2563eb" : "#dc2626",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {multiPhaseData.phase1.isAttainable ? (
                          <>
                            <CheckCircle2 size={13} color="#2563eb" /> Reach Date: {multiPhaseData.phase1.reachDateStr}
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={13} color="#dc2626" /> {multiPhaseData.phase1.reachDateStr}
                          </>
                        )}
                      </span>

                      {multiPhaseData.phase1.sessions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowPhase1Dates(!showPhase1Dates)}
                          style={{
                            background: "#eff6ff",
                            color: "#2563eb",
                            border: "1px solid #bfdbfe",
                            borderRadius: 6,
                            padding: "3px 8px",
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          {showPhase1Dates ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {showPhase1Dates ? "Hide Dates" : `View ${multiPhaseData.phase1.sessions.length} Dates`}
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.45 }}>
                    {multiPhaseData.phase1.isAttainable ? (
                      <>
                        Attend <strong>{multiPhaseData.phase1.classesNeeded} consecutive classes</strong> without absence. Attendance will reach <strong>{multiPhaseData.phase1.projectedPercentage}%</strong> ({multiPhaseData.phase1.totalAttended}/{multiPhaseData.phase1.totalDelivered}).
                      </>
                    ) : (
                      <div style={{ color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", padding: "6px 10px", borderRadius: 8, marginTop: 4 }}>
                        <strong>Teaching Semester Limit Exceeded:</strong> Only <strong>{multiPhaseData.phase1.totalSemesterClassesRemaining} classes</strong> remain before 31 Oct 2026. Attending all remaining classes achieves <strong>{multiPhaseData.phase1.maxAttainablePercentage}%</strong> max.
                      </div>
                    )}
                  </div>

                  {/* Phase 1 Date Cards */}
                  {showPhase1Dates && multiPhaseData.phase1.sessions.length > 0 && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: 8,
                        marginTop: 4,
                      }}
                    >
                      {multiPhaseData.phase1.sessions.map((ses, sIdx) => {
                        const isMilestone = ses.isMilestoneTarget;
                        return (
                          <div
                            key={sIdx}
                            style={{
                              background: isMilestone ? "#f0fdf4" : "#f8fafc",
                              border: `1px solid ${isMilestone ? "#86efac" : "#e2e8f0"}`,
                              borderRadius: 10,
                              padding: "8px 10px",
                              fontSize: 11,
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, color: "#0f172a" }}>
                              <span>Class #{ses.sessionNumber} · {ses.dateStr}</span>
                              <span style={{ color: isMilestone ? "#16a34a" : "#2563eb" }}>
                                {ses.runningAttended}/{ses.runningDelivered} ({ses.runningPercentage}%)
                              </span>
                            </div>
                            <div style={{ color: "#64748b", marginTop: 2, display: "flex", justifyContent: "space-between" }}>
                              <span>{ses.timeSlot}</span>
                              <span>Room {ses.room}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── STEP 2: THE PLANNED ABSENCES ───────────────────────── */}
                <div
                  style={{
                    background: multiPhaseData.phase2.isBelow75 ? "#fef2f2" : "#fffbeb",
                    border: `1.5px solid ${multiPhaseData.phase2.isBelow75 ? "#fecaca" : "#fde68a"}`,
                    borderRadius: 14,
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
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
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                        Take Planned {multiPhaseData.phase2.bunkCount} Classes Absent
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: multiPhaseData.phase2.isBelow75 ? "#dc2626" : "#b45309" }}>
                        Spans Through: {multiPhaseData.phase2.lastBunkDateStr}
                      </span>
                      {multiPhaseData.phase2.bunkSessions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowPhase2Dates(!showPhase2Dates)}
                          style={{
                            background: "#ffffff",
                            color: multiPhaseData.phase2.isBelow75 ? "#dc2626" : "#b45309",
                            border: `1px solid ${multiPhaseData.phase2.isBelow75 ? "#fecaca" : "#fde68a"}`,
                            borderRadius: 6,
                            padding: "3px 8px",
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          {showPhase2Dates ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {showPhase2Dates ? "Hide Dates" : `View ${multiPhaseData.phase2.bunkSessions.length} Dates`}
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: 12.5, color: "#475569" }}>
                    After missing these {multiPhaseData.phase2.bunkCount} classes, attendance drops by <strong>-{multiPhaseData.phase2.percentageDrop}%</strong> down to:{" "}
                    <strong style={{ color: multiPhaseData.phase2.isBelow75 ? "#dc2626" : "#b45309", fontSize: 13.5 }}>
                      {multiPhaseData.phase2.postBunkPercentage}% ({multiPhaseData.phase2.postBunkAttended}/{multiPhaseData.phase2.postBunkDelivered})
                    </strong>
                  </div>

                  {/* Dates of the absent classes */}
                  {showPhase2Dates && multiPhaseData.phase2.bunkSessions.length > 0 && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: 8,
                        marginTop: 4,
                      }}
                    >
                      {multiPhaseData.phase2.bunkSessions.map((bunk, bIdx) => (
                        <div
                          key={bIdx}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #fecaca",
                            borderRadius: 10,
                            padding: "8px 10px",
                            fontSize: 11,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, color: "#0f172a" }}>
                            <span>Bunk #{bunk.bunkNumber} · {bunk.dateStr}</span>
                            <span style={{ color: "#dc2626" }}>
                              {bunk.runningAttended}/{bunk.runningDelivered} ({bunk.runningPercentage}%)
                            </span>
                          </div>
                          <div style={{ color: "#64748b", marginTop: 2, display: "flex", justifyContent: "space-between" }}>
                            <span>{bunk.timeSlot} ({bunk.type})</span>
                            <span style={{ color: "#dc2626", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
                              <TrendingDown size={11} color="#dc2626" /> -{bunk.percentageDrop}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── STEP 3: POST-BUNK RECOVERY ROADMAP ──────────────────── */}
                <div
                  style={{
                    background: multiPhaseData.phase3.isAttainable === false ? "#fff7ed" : "#f0fdf4",
                    border: `1.5px solid ${multiPhaseData.phase3.isAttainable === false ? "#fed7aa" : "#86efac"}`,
                    borderRadius: 14,
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 900,
                          background: multiPhaseData.phase3.isAttainable === false ? "#ea580c" : "#16a34a",
                          color: "#ffffff",
                          padding: "2px 8px",
                          borderRadius: 6,
                        }}
                      >
                        STEP 3
                      </span>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: multiPhaseData.phase3.isAttainable === false ? "#9a3412" : "#065f46",
                        }}
                      >
                        Post-Bunk Recovery Roadmap to {multiPhaseData.recoveryTarget}%
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: multiPhaseData.phase3.isAttainable === false ? "#dc2626" : "#16a34a",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {multiPhaseData.phase3.isAttainable ? (
                          <>
                            <CheckCircle2 size={13} color="#16a34a" /> Recovery Date: {multiPhaseData.phase3.recoveryReachDateStr}
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={13} color="#dc2626" /> {multiPhaseData.phase3.recoveryReachDateStr}
                          </>
                        )}
                      </span>

                      {multiPhaseData.phase3.recoverySessions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowPhase3Dates(!showPhase3Dates)}
                          style={{
                            background: "#ffffff",
                            color: multiPhaseData.phase3.isAttainable ? "#16a34a" : "#ea580c",
                            border: `1px solid ${multiPhaseData.phase3.isAttainable ? "#86efac" : "#fed7aa"}`,
                            borderRadius: 6,
                            padding: "3px 8px",
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          {showPhase3Dates ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {showPhase3Dates ? "Hide Dates" : `View ${multiPhaseData.phase3.recoverySessions.length} Dates`}
                        </button>
                      )}
                    </div>
                  </div>

                  {multiPhaseData.phase3.classesNeeded > 0 ? (
                    multiPhaseData.phase3.isAttainable ? (
                      <div style={{ fontSize: 12.5, color: "#166534", lineHeight: 1.45 }}>
                        Must attend <strong>{multiPhaseData.phase3.classesNeeded} more consecutive classes</strong> post-absence starting from <strong>{multiPhaseData.phase2.lastBunkDateStr}</strong> onwards to recover back to {multiPhaseData.recoveryTarget}%.
                        Final attendance will become <strong>{multiPhaseData.phase3.finalPercentage}%</strong> ({multiPhaseData.phase3.finalAttended}/{multiPhaseData.phase3.finalDelivered}).
                      </div>
                    ) : (
                      <div style={{ fontSize: 12.5, color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", padding: "8px 12px", borderRadius: 8, lineHeight: 1.45 }}>
                        <strong>Teaching Semester Limit Exceeded:</strong> Only <strong>{multiPhaseData.phase3.totalSemesterClassesRemaining} classes</strong> remain before the Last Date of Instruction (31 Oct 2026).
                        Even if you attend 100% of all remaining classes, max possible attendance is <strong>{multiPhaseData.phase3.maxAttainablePercentage}%</strong> (cannot reach {multiPhaseData.recoveryTarget}% without special extra makeup classes).
                      </div>
                    )
                  ) : (
                    <div style={{ fontSize: 12.5, color: "#166534", display: "flex", alignItems: "flex-start", gap: 6 }}>
                      <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        No extra classes needed! Even after missing {multiPhaseData.phase2.bunkCount} classes, your attendance remains at <strong>{multiPhaseData.phase2.postBunkPercentage}%</strong> which is safely &ge; {multiPhaseData.recoveryTarget}%. You still have <strong>{multiPhaseData.phase3.safeBunksRemaining} additional safe bunks</strong> remaining!
                      </div>
                    </div>
                  )}

                  {/* List of Recovery Class Dates */}
                  {showPhase3Dates && multiPhaseData.phase3.recoverySessions.length > 0 && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: 8,
                        marginTop: 4,
                      }}
                    >
                      {multiPhaseData.phase3.recoverySessions.map((rec, rIdx) => {
                        const isMilestone = rec.isMilestoneTarget;
                        return (
                          <div
                            key={rIdx}
                            style={{
                              background: isMilestone ? "#f0fdf4" : "#ffffff",
                              border: `1px solid ${isMilestone ? "#86efac" : "#bbf7d0"}`,
                              borderRadius: 10,
                              padding: "8px 10px",
                              fontSize: 11,
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, color: "#0f172a" }}>
                              <span>Recovery #{rec.sessionNumber} · {rec.dateStr}</span>
                              <span style={{ color: isMilestone ? "#16a34a" : "#2563eb" }}>
                                {rec.runningAttended}/{rec.runningDelivered} ({rec.runningPercentage}%)
                              </span>
                            </div>
                            <div style={{ color: "#64748b", marginTop: 2, display: "flex", justifyContent: "space-between" }}>
                              <span>{rec.timeSlot} ({rec.type})</span>
                              <span>Room {rec.room}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
