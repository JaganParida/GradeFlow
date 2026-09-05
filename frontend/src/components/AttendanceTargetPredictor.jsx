import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle2,
  Check,
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
  BookOpen,
} from "lucide-react";
import SubjectDropdown from "./SubjectDropdown";
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
  activeSection = "schedule",
  onSectionChange = null,
  sectionCatalog = [],
  onSelectSubject = null,
  savedSubjects = [],
}) {
  // Current active subject data
  const subjectName = activeCatalogItem?.subjectName || "Selected Subject";
  const subCode = resolveSubjectCode({ subject: subjectName }, studentData);
  const weeklyOccurrences = activeCatalogItem?.weeklyOccurrences || [];

  // Internal Tabs within the Target Predictor Engine
  const getInitialView = () => {
    if (activeSection === "schedule") return "all_schedule";
    if (activeSection === "penalty") return "penalty_simulator";
    if (activeSection === "roadmap") return "multiphase_planner";
    return "all_schedule";
  };

  const [engineView, setEngineView] = useState(getInitialView);

  useEffect(() => {
    if (activeSection === "schedule") setEngineView("all_schedule");
    else if (activeSection === "penalty") setEngineView("penalty_simulator");
    else if (activeSection === "roadmap") setEngineView("multiphase_planner");
  }, [activeSection]);

  const setEngineViewSync = (newView) => {
    setEngineView(newView);
    if (onSectionChange) {
      if (newView === "all_schedule") onSectionChange("schedule");
      else if (newView === "penalty_simulator") onSectionChange("penalty");
      else if (newView === "multiphase_planner") onSectionChange("roadmap");
    }
  };

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
      {/* ── HEADER: DYNAMIC SECTION IDENTITY & MASTER TARGET ROW ───────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          flexWrap: "wrap",
          gap: 14,
          paddingBottom: 16,
          borderBottom: "1.5px solid #f1f5f9",
        }}
      >
        <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", gap: 12, minWidth: 0, flex: 1 }}>
          {/* Section Dynamic Themed Icon Badge */}
          <div
            style={{
              width: isMobile ? 38 : 44,
              height: isMobile ? 38 : 44,
              borderRadius: 12,
              background:
                activeSection === "schedule"
                  ? "linear-gradient(135deg, #059669 0%, #10b981 100%)"
                  : activeSection === "penalty"
                  ? "linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)"
                  : activeSection === "roadmap"
                  ? "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)"
                  : "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow:
                activeSection === "schedule"
                  ? "0 3px 10px rgba(5, 150, 105, 0.25)"
                  : activeSection === "penalty"
                  ? "0 3px 10px rgba(225, 29, 72, 0.25)"
                  : activeSection === "roadmap"
                  ? "0 3px 10px rgba(37, 99, 235, 0.25)"
                  : "0 3px 10px rgba(15, 23, 42, 0.2)",
            }}
          >
            {activeSection === "schedule" && <CalendarIcon size={isMobile ? 18 : 22} />}
            {activeSection === "penalty" && <AlertTriangle size={isMobile ? 18 : 22} />}
            {activeSection === "roadmap" && <Compass size={isMobile ? 18 : 22} />}
            {activeSection !== "schedule" && activeSection !== "penalty" && activeSection !== "roadmap" && (
              <Target size={isMobile ? 18 : 22} />
            )}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h3
                style={{
                  fontSize: isMobile ? 17 : 21,
                  fontWeight: 900,
                  color: "#0f172a",
                  margin: 0,
                  letterSpacing: "-0.4px",
                  lineHeight: 1.25,
                }}
              >
                {activeSection === "schedule"
                  ? "Class Schedule & Target Predictor"
                  : activeSection === "penalty"
                  ? "Bunk Impact & Risk Calculator"
                  : activeSection === "roadmap"
                  ? "Attendance Target Roadmap"
                  : "Target Predictor & Timetable Simulator"}
              </h3>

              {/* Status Section Tag */}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: 6,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  background:
                    activeSection === "schedule"
                      ? "#ecfdf5"
                      : activeSection === "penalty"
                      ? "#fff1f2"
                      : activeSection === "roadmap"
                      ? "#eff6ff"
                      : "#f1f5f9",
                  color:
                    activeSection === "schedule"
                      ? "#065f46"
                      : activeSection === "penalty"
                      ? "#e11d48"
                      : activeSection === "roadmap"
                      ? "#2563eb"
                      : "#334155",
                  border: `1px solid ${
                    activeSection === "schedule"
                      ? "#a7f3d0"
                      : activeSection === "penalty"
                      ? "#fecdd3"
                      : activeSection === "roadmap"
                      ? "#bfdbfe"
                      : "#cbd5e1"
                  }`,
                }}
              >
                {activeSection === "schedule" && "📅 Date-by-Date Routine"}
                {activeSection === "penalty" && "⚡ Penalty Multiplier"}
                {activeSection === "roadmap" && "🚀 Milestone Journey"}
                {activeSection !== "schedule" && activeSection !== "penalty" && activeSection !== "roadmap" && "🎯 Simulator"}
              </span>
            </div>

            {/* Clear Student-Friendly Subtitle */}
            <p style={{ fontSize: isMobile ? 12 : 12.5, color: "#64748b", margin: "4px 0 0 0", lineHeight: 1.45 }}>
              {activeSection === "schedule" &&
                "Simulate upcoming class dates from your university routine, exclude holidays, and see when you will reach your target attendance."}
              {activeSection === "penalty" &&
                "Calculate exactly how skipping upcoming classes impacts your percentage and how many extra classes you must attend to recover."}
              {activeSection === "roadmap" &&
                "Step-by-step milestone progression to reach your target safely, with post-target safe bunk cushion planning."}
              {activeSection !== "schedule" &&
                activeSection !== "penalty" &&
                activeSection !== "roadmap" &&
                "Exact date-by-date timetable schedule, holiday exclusions, penalty multiplier facts & post-target bunk planning."}
            </p>
          </div>
        </div>

        {/* Master Target Goal Indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#eff6ff",
            border: "1.5px solid #bfdbfe",
            padding: isMobile ? "6px 12px" : "8px 16px",
            borderRadius: 12,
            boxShadow: "0 2px 6px rgba(37, 99, 235, 0.05)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              flexShrink: 0,
              boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
            }}
          >
            <Target size={17} strokeWidth={2.5} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Target Goal
            </span>
            <span
              style={{
                fontSize: isMobile ? 14 : 15.5,
                fontWeight: 900,
                color: "#1e3a8a",
                lineHeight: 1.1,
              }}
            >
              {targetGoal}% Aim
            </span>
          </div>
        </div>
      </div>

      {/* ── ACTIVE SUBJECT COMMAND BAR & DROPDOWN (FULL-WIDTH, ZERO TRUNCATION) ── */}
      {sectionCatalog && sectionCatalog.length > 0 && onSelectSubject && (
        <SubjectDropdown
          catalog={sectionCatalog}
          selectedSubjectName={subjectName}
          onSelectSubject={onSelectSubject}
          savedSubjects={savedSubjects}
          studentData={studentData}
          targetGoal={targetGoal}
          isMobile={isMobile}
        />
      )}

      {/* ── STUDENT CLARITY INSIGHT BANNER ─────────────────────────────────── */}
      {activeCalculation && (
        <div
          style={{
            background: isCurrentlySafe
              ? "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)"
              : "linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)",
            border: `1.5px solid ${isCurrentlySafe ? "#bbf7d0" : "#fed7aa"}`,
            borderRadius: 14,
            padding: isMobile ? "12px 14px" : "14px 18px",
            display: "flex",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: 12,
            flexDirection: isMobile ? "column" : "row",
            boxShadow: "0 2px 6px -1px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: isCurrentlySafe ? "#059669" : "#d97706",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: isCurrentlySafe
                  ? "0 2px 6px rgba(5, 150, 105, 0.25)"
                  : "0 2px 6px rgba(217, 119, 6, 0.25)",
              }}
            >
              {isCurrentlySafe ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: isMobile ? 13 : 13.5,
                    fontWeight: 800,
                    color: isCurrentlySafe ? "#065f46" : "#92400e",
                  }}
                >
                  {isCurrentlySafe
                    ? `Safe Zone (${currentPct.toFixed(1)}% Current Attendance)`
                    : `Attendance Shortage (${currentPct.toFixed(1)}% Current Attendance)`}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: isCurrentlySafe ? "#dcfce7" : "#fef3c7",
                    color: isCurrentlySafe ? "#15803d" : "#b45309",
                    padding: "1px 7px",
                    borderRadius: 5,
                    border: `1px solid ${isCurrentlySafe ? "#bbf7d0" : "#fde68a"}`,
                  }}
                >
                  {totalAttended} / {totalDelivered} Attended
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: isMobile ? 12 : 12.5,
                  color: isCurrentlySafe ? "#047857" : "#78350f",
                  lineHeight: 1.45,
                  fontWeight: 600,
                }}
              >
                {isCurrentlySafe ? (
                  <>
                    You are currently <strong>above your {targetGoal}% target</strong>. You can safely afford to miss up to{" "}
                    <strong>
                      {activeCalculation?.safeBunks || 0} class
                      {(activeCalculation?.safeBunks || 0) === 1 ? "" : "es"}
                    </strong>{" "}
                    without falling below {targetGoal}%.
                  </>
                ) : (
                  <>
                    To achieve your <strong>{targetGoal}% target</strong>, you need to attend the next{" "}
                    <strong>
                      {activeCalculation?.classesNeeded || 0} consecutive class
                      {(activeCalculation?.classesNeeded || 0) === 1 ? "" : "es"}
                    </strong>{" "}
                    without absence.
                    {baseProjection?.targetDate && (
                      <>
                        {" "}Projected target date:{" "}
                        <strong style={{ textDecoration: "underline" }}>
                          {new Date(baseProjection.targetDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </strong>
                        .
                      </>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* ── ACTIVE SECTION VIEW WITH SMOOTH ANIMATION ───────────────────────────── */}
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
        {/* ── TAB 2: MISS PENALTY & RECOVERY ROADMAP (PHASE-BY-PHASE) ─────────── */}
        {engineView === "penalty_simulator" && (
          <motion.div
            key="penalty_simulator"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {/* ── Student-Friendly Recovery Multiplier Insight (No Formulas) ── */}
            <div
              style={{
                background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
                border: "1.5px solid #fed7aa",
                borderRadius: 16,
                padding: isMobile ? "14px 12px" : "16px 18px",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                boxShadow: "0 2px 10px rgba(234, 88, 12, 0.05)",
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
                  marginTop: 2,
                }}
              >
                <Flame size={20} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: "#c2410c", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Attendance Insight &bull; The Recovery Multiplier
                </div>
                <div style={{ fontSize: isMobile ? 14 : 15.5, fontWeight: 900, color: "#7c2d12", margin: "2px 0 4px 0", lineHeight: 1.35 }}>
                  Target {targetGoal}% requires <span style={{ color: "#ea580c" }}>{missPenaltyData?.recoveryMultiplier || 3}x</span> consecutive classes to recover from every single absence!
                </div>
                <p style={{ fontSize: 12, color: "#9a3412", lineHeight: 1.45, margin: "0 0 8px 0" }}>
                  When you skip a class, total delivered classes increase while your attended count stays frozen. To make up the lost percentage, you have to attend multiple uninterrupted classes in a row.
                </p>

                {/* Benchmark Goal Chips */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      background: targetGoal === 75 ? "#ea580c" : "#ffffff",
                      color: targetGoal === 75 ? "#ffffff" : "#9a3412",
                      padding: "2px 8px",
                      borderRadius: 6,
                      border: "1px solid #fdba74",
                    }}
                  >
                    75% Goal: 1 Miss = +3 Extra Classes
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      background: targetGoal === 80 ? "#ea580c" : "#ffffff",
                      color: targetGoal === 80 ? "#ffffff" : "#9a3412",
                      padding: "2px 8px",
                      borderRadius: 6,
                      border: "1px solid #fdba74",
                    }}
                  >
                    80% Goal: 1 Miss = +4 Extra Classes
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      background: targetGoal === 85 ? "#ea580c" : "#ffffff",
                      color: targetGoal === 85 ? "#ffffff" : "#9a3412",
                      padding: "2px 8px",
                      borderRadius: 6,
                      border: "1px solid #fdba74",
                    }}
                  >
                    85% Goal: 1 Miss = +6 Extra Classes
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      background: targetGoal === 90 ? "#ea580c" : "#ffffff",
                      color: targetGoal === 90 ? "#ffffff" : "#9a3412",
                      padding: "2px 8px",
                      borderRadius: 6,
                      border: "1px solid #fdba74",
                    }}
                  >
                    90% Goal: 1 Miss = +9 Extra Classes
                  </span>
                </div>
              </div>
            </div>

            {/* ── PHASE 1: SIMULATE MISSING CLASSES (SLIDER & CONTROLS) ─────── */}
            <div
              style={{
                background: "#ffffff",
                border: "1.5px solid #e2e8f0",
                borderRadius: 16,
                padding: isMobile ? "14px 12px" : "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  justifyContent: "space-between",
                  alignItems: isMobile ? "flex-start" : "center",
                  gap: 10,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      color: "#ea580c",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: 2,
                    }}
                  >
                    Phase 1 &bull; Simulate Absences
                  </div>
                  <h5 style={{ fontSize: isMobile ? 14 : 15.5, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                    Simulate Missing Classes During Sprint
                  </h5>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
                    Choose how many classes you might miss to see the exact penalty, extra classes needed, and new target reach date.
                  </p>
                </div>

                {/* Quick Preset Buttons */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: isMobile ? 4 : 6,
                    width: isMobile ? "100%" : "auto",
                    boxSizing: "border-box",
                    flexWrap: isMobile ? "wrap" : "nowrap",
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", marginRight: 2 }}>
                    Presets:
                  </span>
                  {[1, 2, 3, 5, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSimulateMissCount(num)}
                      style={{
                        background: simulateMissCount === num ? "#ea580c" : "#f8fafc",
                        color: simulateMissCount === num ? "#ffffff" : "#475569",
                        border: `1.5px solid ${simulateMissCount === num ? "#ea580c" : "#cbd5e1"}`,
                        padding: isMobile ? "5px 9px" : "5px 10px",
                        borderRadius: 8,
                        fontSize: isMobile ? 11 : 12,
                        fontWeight: 800,
                        cursor: "pointer",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        transition: "all 0.15s ease",
                        boxShadow: simulateMissCount === num ? "0 2px 6px rgba(234, 88, 12, 0.25)" : "none",
                        flex: isMobile ? 1 : "none",
                      }}
                    >
                      +{num} Miss
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider & Modern Stepper Row */}
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: "center",
                  gap: 14,
                  background: "#f8fafc",
                  padding: isMobile ? "12px" : "14px 16px",
                  borderRadius: 14,
                  border: "1px solid #e2e8f0",
                }}
              >
                {/* Visual Range Slider */}
                <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, fontWeight: 800, color: "#64748b" }}>
                    <span>1 class</span>
                    <span style={{ color: "#ea580c", fontSize: 12 }}>
                      {simulateMissCount} {simulateMissCount === 1 ? "Class" : "Classes"} Selected
                    </span>
                    <span>20 classes</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={simulateMissCount}
                    onChange={(e) => setSimulateMissCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    style={{
                      width: "100%",
                      accentColor: "#ea580c",
                      height: 8,
                      borderRadius: 999,
                      background: `linear-gradient(to right, #ea580c 0%, #ea580c ${((simulateMissCount - 1) / 19) * 100}%, #fed7aa ${((simulateMissCount - 1) / 19) * 100}%, #fed7aa 100%)`,
                      cursor: "pointer",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Touch-Friendly Stepper */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: isMobile ? "space-between" : "flex-start",
                    gap: 8,
                    background: "#ffffff",
                    border: "1.5px solid #fed7aa",
                    borderRadius: 12,
                    padding: "4px 8px",
                    boxShadow: "0 1px 4px rgba(234, 88, 12, 0.08)",
                    width: isMobile ? "100%" : "auto",
                    boxSizing: "border-box",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSimulateMissCount(Math.max(1, simulateMissCount - 1))}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      border: "1px solid #fdba74",
                      background: "#fff7ed",
                      color: "#c2410c",
                      fontSize: 18,
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

                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
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
                        width: 38,
                        textAlign: "center",
                        border: "none",
                        background: "transparent",
                        fontSize: 16,
                        fontWeight: 900,
                        color: "#c2410c",
                        outline: "none",
                        padding: 0,
                      }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#9a3412" }}>
                      {simulateMissCount === 1 ? "Class" : "Classes"} Missed
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSimulateMissCount(Math.min(50, simulateMissCount + 1))}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      border: "1px solid #fdba74",
                      background: "#fff7ed",
                      color: "#c2410c",
                      fontSize: 18,
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
                </div>
              </div>

              {/* 3 Impact Summary Cards */}
              {missPenaltyData && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                    gap: 10,
                  }}
                >
                  {/* Card 1: Original */}
                  <div
                    style={{
                      background: "#fff7ed",
                      border: "1px solid #ffedd5",
                      borderRadius: 12,
                      padding: "12px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: "#9a3412", textTransform: "uppercase" }}>
                      Original Requirement
                    </div>
                    <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 900, color: "#c2410c" }}>
                      {missPenaltyData.baseNeeded} Classes
                    </div>
                    <div style={{ fontSize: 11.5, color: "#9a3412" }}>
                      Target Date: <strong>{missPenaltyData.baseProjection?.estimatedDate || "Attainable"}</strong>
                    </div>
                  </div>

                  {/* Card 2: After Miss */}
                  <div
                    style={{
                      background: missPenaltyData.delayedProjection?.isAttainable === false ? "#fef2f2" : "#fff7ed",
                      border: `1px solid ${missPenaltyData.delayedProjection?.isAttainable === false ? "#fecaca" : "#fed7aa"}`,
                      borderRadius: 12,
                      padding: "12px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: "#991b1b", textTransform: "uppercase" }}>
                      New Requirement After Miss
                    </div>
                    <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 900, color: "#dc2626" }}>
                      {missPenaltyData.newNeeded} Classes (+{missPenaltyData.extraClassesNeeded} extra)
                    </div>
                    <div style={{ fontSize: 11.5, color: "#991b1b" }}>
                      {missPenaltyData.delayedProjection?.isAttainable === false ? (
                        <span style={{ color: "#dc2626", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 3 }}>
                          <AlertTriangle size={11} color="#dc2626" /> Exceeds Semester (Max: {missPenaltyData.delayedProjection?.maxAttainablePercentage || 0}%)
                        </span>
                      ) : (
                        <>New Target Date: <strong>{missPenaltyData.delayedProjection?.estimatedDate || "Attainable"}</strong></>
                      )}
                    </div>
                  </div>

                  {/* Card 3: Delay */}
                  <div
                    style={{
                      background: "#faf5ff",
                      border: "1px solid #f3e8ff",
                      borderRadius: 12,
                      padding: "12px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: "#6b21a8", textTransform: "uppercase" }}>
                      Calendar Delay
                    </div>
                    <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 900, color: "#7c3aed" }}>
                      {missPenaltyData.delayedProjection?.isAttainable === false
                        ? "Beyond 31 Oct"
                        : `+${missPenaltyData.delayInDays} Days Delay`}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#6b21a8" }}>
                      {missPenaltyData.delayedProjection?.isAttainable === false
                        ? `Exceeds ${missPenaltyData.delayedProjection?.totalRemainingSemClasses || 0} remaining classes`
                        : "Due to holidays & timetable gaps"}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── PHASE 2: SIMULATED MISSED CLASSES BREAKDOWN ─────────────────── */}
            {missPenaltyData?.missedSessions && missPenaltyData.missedSessions.length > 0 && (
              <div
                style={{
                  background: "#fff1f2",
                  border: "1.5px solid #fecdd3",
                  borderRadius: 16,
                  padding: isMobile ? "14px 12px" : "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: isMobile ? "flex-start" : "center",
                    flexDirection: isMobile ? "column" : "row",
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: "#be123c", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>
                      Phase 2 &bull; What Happens When You Miss
                    </div>
                    <h5
                      style={{
                        fontSize: isMobile ? 13.5 : 14.5,
                        fontWeight: 900,
                        color: "#9f1239",
                        margin: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        wordBreak: "break-word",
                      }}
                    >
                      <TrendingDown size={16} color="#e11d48" style={{ flexShrink: 0 }} />
                      Simulated Missed Classes Breakdown ({missPenaltyData.missedSessions.length} total)
                    </h5>
                    <p style={{ fontSize: 12, color: "#be123c", margin: "2px 0 0 0", wordBreak: "break-word" }}>
                      Simulating consecutive absences on these exact dates and time slots:
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 800,
                        background: "#ffffff",
                        color: "#e11d48",
                        padding: "3px 9px",
                        borderRadius: 8,
                        border: "1px solid #fda4af",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Attendance Drops by -{Math.abs(currentPct - (missPenaltyData.missedSessions[missPenaltyData.missedSessions.length - 1]?.runningPercentage || 0)).toFixed(2)}%
                    </span>

                    {missPenaltyData.missedSessions.length > 15 && (
                      <button
                        type="button"
                        onClick={() => setShowAllDates(!showAllDates)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          background: "#ffffff",
                          color: "#e11d48",
                          border: "1px solid #fda4af",
                          padding: "3px 9px",
                          borderRadius: 8,
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {showAllDates ? <><ChevronUp size={13} /> Collapse</> : <><ChevronDown size={13} /> View All ({missPenaltyData.missedSessions.length})</>}
                      </button>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: 10,
                  }}
                >
                  {(showAllDates ? missPenaltyData.missedSessions : missPenaltyData.missedSessions.slice(0, 15)).map((missSes, mIdx) => {
                    const isSafeAfterMiss = Number(missSes.runningPercentage) >= Number(targetGoal);

                    return (
                      <div
                        key={mIdx}
                        style={{
                          background: "#ffffff",
                          border: isSafeAfterMiss ? "1.5px solid #86efac" : "1.5px solid #fecdd3",
                          borderRadius: 12,
                          padding: "10px 12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          boxShadow: isSafeAfterMiss
                            ? "0 1px 4px rgba(34, 197, 94, 0.08)"
                            : "0 1px 4px rgba(225, 29, 72, 0.04)",
                        }}
                      >
                        {/* Top row: Miss # + Date + Safe/Warning badge + Drop badge */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 900,
                                background: isSafeAfterMiss ? "#059669" : "#e11d48",
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
                            {isSafeAfterMiss ? (
                              <span
                                style={{
                                  fontSize: 9.5,
                                  fontWeight: 900,
                                  background: "#dcfce7",
                                  color: "#15803d",
                                  border: "1px solid #86efac",
                                  padding: "1px 6px",
                                  borderRadius: 4,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                              >
                                <Check size={10} /> Safe
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: 9.5,
                                  fontWeight: 900,
                                  background: "#fee2e2",
                                  color: "#dc2626",
                                  border: "1px solid #fca5a5",
                                  padding: "1px 5px",
                                  borderRadius: 4,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 2.5,
                                }}
                              >
                                <AlertTriangle size={9.5} /> Below {targetGoal}%
                              </span>
                            )}
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
                              whiteSpace: "nowrap",
                            }}
                          >
                            <TrendingDown size={11} color="#e11d48" /> -{Math.abs(Number(missSes.percentageDrop || 0)).toFixed(2)}% Drop
                          </span>
                        </div>

                        {/* Subject name */}
                        <div style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a" }}>
                          {subjectName}
                        </div>

                        {/* Time slot & Room */}
                        <div style={{ fontSize: 11, color: "#64748b", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
                          <span>
                            <Clock size={11} style={{ display: "inline", verticalAlign: "middle" }} /> {missSes.timeSlot}
                          </span>
                          <span>Room {missSes.room} ({missSes.type})</span>
                        </div>

                        {/* Footer running stats */}
                        <div
                          style={{
                            marginTop: 4,
                            paddingTop: 6,
                            borderTop: isSafeAfterMiss ? "1px dashed #bbf7d0" : "1px dashed #fecdd3",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 4,
                          }}
                        >
                          <span style={{ fontSize: 10.5, color: isSafeAfterMiss ? "#166534" : "#881337", fontWeight: 600 }}>
                            After this missed class:
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span
                              style={{
                                fontSize: 11.5,
                                fontWeight: 900,
                                color: isSafeAfterMiss ? "#15803d" : "#dc2626",
                              }}
                            >
                              {missSes.runningAttended}/{missSes.runningDelivered} ({missSes.runningPercentage}%)
                            </span>
                            {isSafeAfterMiss && (
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 800,
                                  background: "#ecfdf5",
                                  color: "#047857",
                                  padding: "1px 5px",
                                  borderRadius: 3,
                                  border: "1px solid #a7f3d0",
                                }}
                              >
                                &ge; {targetGoal}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── PHASE 3: MANDATORY POST-ABSENCE RECOVERY SCHEDULE ─────────── */}
            {recoverySessions.length > 0 && (
              <div
                style={{
                  background: "#ffffff",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 16,
                  padding: isMobile ? "14px 12px" : "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  boxSizing: "border-box",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: "#059669", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>
                      Phase 3 &bull; Recovery Roadmap
                    </div>
                    <h5 style={{ fontSize: isMobile ? 13.5 : 14.5, fontWeight: 900, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
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
                        color: "#166534",
                        border: "1px solid #bbf7d0",
                        padding: "5px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
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
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
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

                        <div style={{ fontSize: 11, color: "#64748b", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
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
                            flexWrap: "wrap",
                            gap: 4,
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
            {/* ── Student-Friendly Multi-Phase Strategy Header ── */}
            <div
              style={{
                background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
                border: "1.5px solid #e9d5ff",
                borderRadius: 16,
                padding: isMobile ? "14px 12px" : "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                boxShadow: "0 2px 10px rgba(124, 58, 237, 0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "#7c3aed",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Compass size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 900, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Semester Strategy Planner
                  </div>
                  <h4 style={{ fontSize: isMobile ? 14.5 : 16, fontWeight: 900, color: "#4c1d95", margin: 0 }}>
                    Multi-Phase Strategy: Build Buffer &rarr; Take Planned Leave &rarr; Recover Safely
                  </h4>
                  <p style={{ fontSize: 12, color: "#6b21a8", margin: "2px 0 0 0" }}>
                    Plan ahead in 3 simple phases: First sprint to reach your target goal, then safely take your planned absences (e.g. for fests or travel), and finally follow a dedicated recovery roadmap.
                  </p>
                </div>
              </div>

              {/* ── Visual 3-Phase Attendance Journey Bar ── */}
              {multiPhaseData && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                    gap: 8,
                    background: "#ffffff",
                    padding: isMobile ? "10px" : "12px 14px",
                    borderRadius: 14,
                    border: "1px solid #ddd6fe",
                  }}
                >
                  {/* Step 1 Pill */}
                  <div
                    style={{
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      borderRadius: 10,
                      padding: "8px 10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 900, color: "#1d4ed8", textTransform: "uppercase" }}>
                      Phase 1 &bull; Sprint Goal
                    </span>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "#1e40af" }}>
                      {currentPct}% &rarr; {multiPhaseData.primaryTarget}%
                    </div>
                    <span style={{ fontSize: 10.5, color: "#2563eb" }}>
                      {multiPhaseData.phase1.classesNeeded} classes needed ({multiPhaseData.phase1.reachDateStr})
                    </span>
                  </div>

                  {/* Step 2 Pill */}
                  <div
                    style={{
                      background: multiPhaseData.phase2.isBelowRecoveryTarget ? "#fff1f2" : "#fffbeb",
                      border: `1px solid ${multiPhaseData.phase2.isBelowRecoveryTarget ? "#fecdd3" : "#fde68a"}`,
                      borderRadius: 10,
                      padding: "8px 10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 900, color: multiPhaseData.phase2.isBelowRecoveryTarget ? "#be123c" : "#b45309", textTransform: "uppercase" }}>
                      Phase 2 &bull; Planned Leave
                    </span>
                    <div style={{ fontSize: 13, fontWeight: 900, color: multiPhaseData.phase2.isBelowRecoveryTarget ? "#e11d48" : "#d97706" }}>
                      Miss {multiPhaseData.phase2.bunkCount} Classes (-{Math.abs(multiPhaseData.phase2.percentageDrop).toFixed(2)}%)
                    </div>
                    <span style={{ fontSize: 10.5, color: multiPhaseData.phase2.isBelowRecoveryTarget ? "#be123c" : "#b45309" }}>
                      Drops to {multiPhaseData.phase2.postBunkPercentage}% (by {multiPhaseData.phase2.lastBunkDateStr})
                    </span>
                  </div>

                  {/* Step 3 Pill */}
                  <div
                    style={{
                      background: multiPhaseData.phase3.classesNeeded === 0 ? "#f0fdf4" : "#f5f3ff",
                      border: `1px solid ${multiPhaseData.phase3.classesNeeded === 0 ? "#bbf7d0" : "#ddd6fe"}`,
                      borderRadius: 10,
                      padding: "8px 10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 900, color: multiPhaseData.phase3.classesNeeded === 0 ? "#15803d" : "#6d28d9", textTransform: "uppercase" }}>
                      Phase 3 &bull; Recovery Goal
                    </span>
                    <div style={{ fontSize: 13, fontWeight: 900, color: multiPhaseData.phase3.classesNeeded === 0 ? "#16a34a" : "#7c3aed" }}>
                      {multiPhaseData.phase3.classesNeeded === 0
                        ? `Maintained &ge; ${multiPhaseData.recoveryTarget}% (Safe)`
                        : `Attend ${multiPhaseData.phase3.classesNeeded} Classes`}
                    </div>
                    <span style={{ fontSize: 10.5, color: multiPhaseData.phase3.classesNeeded === 0 ? "#15803d" : "#6d28d9" }}>
                      {multiPhaseData.phase3.classesNeeded === 0
                        ? `${multiPhaseData.phase3.safeBunksRemaining} safe bunks remain`
                        : `Restores to ${multiPhaseData.recoveryTarget}% (${multiPhaseData.phase3.recoveryReachDateStr})`}
                    </span>
                  </div>
                </div>
              )}

              {/* ── Controls Bar ── */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                  gap: 12,
                  marginTop: 2,
                }}
              >
                {/* Control 1: Primary Target Goal */}
                <div style={{ background: "#ffffff", border: "1px solid #ddd6fe", borderRadius: 12, padding: "10px 12px" }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#6b21a8", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                    1. Primary Target Goal
                  </label>
                  <select
                    value={multiPhaseTarget}
                    onChange={(e) => setMultiPhaseTarget(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "7px 10px",
                      borderRadius: 8,
                      border: "1.5px solid #c084fc",
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#4c1d95",
                      background: "#faf5ff",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    <option value={75}>75% (Minimum Threshold)</option>
                    <option value={80}>80% (Recommended Buffer)</option>
                    <option value={85}>85% (High Safety)</option>
                    <option value={90}>90% (Top Distinction)</option>
                  </select>
                </div>

                {/* Control 2: Planned Bunks Count */}
                <div style={{ background: "#ffffff", border: "1px solid #ddd6fe", borderRadius: 12, padding: "10px 12px" }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#6b21a8", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                    2. Planned Absences After Goal
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setPlannedBunkCount(Math.max(1, plannedBunkCount - 1))}
                      style={{
                        background: "#f3e8ff",
                        color: "#6b21a8",
                        border: "1px solid #d8b4fe",
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        fontSize: 18,
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
                        padding: "5px 8px",
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
                        border: "1px solid #d8b4fe",
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        fontSize: 18,
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
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#6b21a8", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                    3. Recovery Target Goal
                  </label>
                  <select
                    value={recoveryTarget}
                    onChange={(e) => setRecoveryTarget(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "7px 10px",
                      borderRadius: 8,
                      border: "1.5px solid #c084fc",
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#4c1d95",
                      background: "#faf5ff",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    <option value={75}>Recover to 75% (Safe Pass)</option>
                    <option value={80}>Recover to 80% (Buffer Safe)</option>
                    <option value={85}>Recover to 85% (Distinction)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── 3 Strategy Phase Cards ── */}
            {multiPhaseData && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* ── PHASE 1 CARD: BUILD BUFFER ───────────────────────── */}
                <div
                  style={{
                    background: "#ffffff",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 16,
                    padding: isMobile ? "14px 12px" : "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    boxShadow: "0 1px 4px rgba(15, 23, 42, 0.03)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 800, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>
                        Phase 1 &bull; Build Target Buffer
                      </div>
                      <h5 style={{ fontSize: isMobile ? 14 : 15, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                        Sprint from {currentPct}% to {multiPhaseData.primaryTarget}% Target Goal
                      </h5>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 800,
                          background: multiPhaseData.phase1.isAttainable ? "#eff6ff" : "#fee2e2",
                          color: multiPhaseData.phase1.isAttainable ? "#1d4ed8" : "#dc2626",
                          border: `1px solid ${multiPhaseData.phase1.isAttainable ? "#bfdbfe" : "#fca5a5"}`,
                          padding: "3px 8px",
                          borderRadius: 6,
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
                            background: "#ffffff",
                            color: "#2563eb",
                            border: "1px solid #bfdbfe",
                            borderRadius: 6,
                            padding: "3px 8px",
                            fontSize: 11.5,
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
                        Attend <strong>{multiPhaseData.phase1.classesNeeded} consecutive scheduled classes</strong> without absence. Attendance will rise from <strong>{currentPct}%</strong> to <strong>{multiPhaseData.phase1.projectedPercentage}%</strong> ({multiPhaseData.phase1.totalAttended}/{multiPhaseData.phase1.totalDelivered}).
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
                              <span>Class #{ses.sessionNumber} &bull; {ses.dateStr}</span>
                              <span style={{ color: isMilestone ? "#16a34a" : "#2563eb" }}>
                                {ses.runningAttended}/{ses.runningDelivered} ({ses.runningPercentage}%)
                              </span>
                            </div>
                            <div style={{ color: "#64748b", marginTop: 2, display: "flex", justifyContent: "space-between" }}>
                              <span>{ses.timeSlot}</span>
                              <span>Room {ses.room} ({ses.type})</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── PHASE 2 CARD: PLANNED ABSENCES ───────────────────── */}
                <div
                  style={{
                    background: multiPhaseData.phase2.isBelowRecoveryTarget ? "#fff1f2" : "#fffbeb",
                    border: `1.5px solid ${multiPhaseData.phase2.isBelowRecoveryTarget ? "#fecdd3" : "#fde68a"}`,
                    borderRadius: 16,
                    padding: isMobile ? "14px 12px" : "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    boxShadow: "0 1px 4px rgba(15, 23, 42, 0.03)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 800, color: multiPhaseData.phase2.isBelowRecoveryTarget ? "#be123c" : "#b45309", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>
                        Phase 2 &bull; Planned Absences
                      </div>
                      <h5 style={{ fontSize: isMobile ? 14 : 15, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                        Take Planned Leave of {multiPhaseData.phase2.bunkCount} Classes
                      </h5>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 800,
                          background: "#ffffff",
                          color: multiPhaseData.phase2.isBelowRecoveryTarget ? "#dc2626" : "#059669",
                          border: `1px solid ${multiPhaseData.phase2.isBelowRecoveryTarget ? "#fca5a5" : "#86efac"}`,
                          padding: "3px 8px",
                          borderRadius: 6,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {multiPhaseData.phase2.isBelowRecoveryTarget ? (
                          <>
                            <AlertTriangle size={12} color="#dc2626" /> Drops Below {multiPhaseData.recoveryTarget}%
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={13} color="#059669" /> Stays Safe (&ge; {multiPhaseData.recoveryTarget}%)
                          </>
                        )}
                      </span>

                      {multiPhaseData.phase2.bunkSessions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowPhase2Dates(!showPhase2Dates)}
                          style={{
                            background: "#ffffff",
                            color: multiPhaseData.phase2.isBelowRecoveryTarget ? "#dc2626" : "#b45309",
                            border: `1px solid ${multiPhaseData.phase2.isBelowRecoveryTarget ? "#fecaca" : "#fde68a"}`,
                            borderRadius: 6,
                            padding: "3px 8px",
                            fontSize: 11.5,
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

                  <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.45 }}>
                    After missing these {multiPhaseData.phase2.bunkCount} classes through <strong>{multiPhaseData.phase2.lastBunkDateStr}</strong>, attendance drops by <strong>-{Math.abs(multiPhaseData.phase2.percentageDrop).toFixed(2)}%</strong> down to:{" "}
                    <strong style={{ color: multiPhaseData.phase2.isBelowRecoveryTarget ? "#dc2626" : "#15803d", fontSize: 13.5 }}>
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
                      {multiPhaseData.phase2.bunkSessions.map((bunk, bIdx) => {
                        const isSafeBunk = Number(bunk.runningPercentage) >= Number(recoveryTarget);

                        return (
                          <div
                            key={bIdx}
                            style={{
                              background: "#ffffff",
                              border: isSafeBunk ? "1px solid #86efac" : "1px solid #fecaca",
                              borderRadius: 10,
                              padding: "8px 10px",
                              fontSize: 11,
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800, color: "#0f172a" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <span>Bunk #{bunk.bunkNumber} &bull; {bunk.dateStr}</span>
                                {isSafeBunk ? (
                                  <span style={{ fontSize: 9, fontWeight: 900, background: "#dcfce7", color: "#15803d", padding: "1px 4px", borderRadius: 4 }}>
                                    Safe
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 9, fontWeight: 900, background: "#fee2e2", color: "#dc2626", padding: "1px 4px", borderRadius: 4 }}>
                                    Below {recoveryTarget}%
                                  </span>
                                )}
                              </div>
                              <span style={{ color: isSafeBunk ? "#15803d" : "#dc2626" }}>
                                {bunk.runningAttended}/{bunk.runningDelivered} ({bunk.runningPercentage}%)
                              </span>
                            </div>
                            <div style={{ color: "#64748b", marginTop: 2, display: "flex", justifyContent: "space-between" }}>
                              <span>{bunk.timeSlot} ({bunk.type})</span>
                              <span style={{ color: "#e11d48", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
                                <TrendingDown size={11} color="#e11d48" /> -{Math.abs(Number(bunk.percentageDrop || 0)).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── PHASE 3 CARD: POST-BUNK RECOVERY ROADMAP ─────────── */}
                <div
                  style={{
                    background: multiPhaseData.phase3.isAttainable === false ? "#fff7ed" : "#f0fdf4",
                    border: `1.5px solid ${multiPhaseData.phase3.isAttainable === false ? "#fed7aa" : "#86efac"}`,
                    borderRadius: 16,
                    padding: isMobile ? "14px 12px" : "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    boxShadow: "0 1px 4px rgba(15, 23, 42, 0.03)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 800, color: "#059669", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>
                        Phase 3 &bull; Recovery Roadmap
                      </div>
                      <h5
                        style={{
                          fontSize: isMobile ? 14 : 15,
                          fontWeight: 900,
                          color: multiPhaseData.phase3.isAttainable === false ? "#9a3412" : "#065f46",
                          margin: 0,
                        }}
                      >
                        Post-Leave Recovery Roadmap to {multiPhaseData.recoveryTarget}%
                      </h5>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 800,
                          background: "#ffffff",
                          color: multiPhaseData.phase3.isAttainable === false ? "#dc2626" : "#16a34a",
                          border: `1px solid ${multiPhaseData.phase3.isAttainable === false ? "#fca5a5" : "#86efac"}`,
                          padding: "3px 8px",
                          borderRadius: 6,
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
                            fontSize: 11.5,
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
                              <span>Recovery #{rec.sessionNumber} &bull; {rec.dateStr}</span>
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
