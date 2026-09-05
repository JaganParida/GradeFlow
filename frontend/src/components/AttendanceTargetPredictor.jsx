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
  const isPenaltyView = activeSection === "penalty" || engineView === "penalty_simulator";

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
      {/* ── CLEAN HEADER: TITLE & MASTER TARGET ───────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          flexWrap: "wrap",
          gap: 10,
          paddingBottom: 12,
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h3
              style={{
                fontSize: isMobile ? 16 : 18,
                fontWeight: 800,
                color: "#0f172a",
                margin: 0,
                letterSpacing: "-0.3px",
              }}
            >
              {activeSection === "schedule"
                ? "Target Date & Schedule"
                : activeSection === "penalty"
                ? "Miss Penalty & Recovery"
                : activeSection === "roadmap"
                ? "Attendance Roadmap"
                : "Target Predictor & Timetable Simulator"}
            </h3>

            {/* Subtle Tag */}
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: 5,
                background:
                  activeSection === "schedule"
                    ? "#f1f5f9"
                    : activeSection === "penalty"
                    ? "#fff1f2"
                    : "#eff6ff",
                color:
                  activeSection === "schedule"
                    ? "#0f172a"
                    : activeSection === "penalty"
                    ? "#e11d48"
                    : "#2563eb",
                border: `1px solid ${
                  activeSection === "schedule"
                    ? "#e2e8f0"
                    : activeSection === "penalty"
                    ? "#fecdd3"
                    : "#bfdbfe"
                }`,
              }}
            >
              {activeSection === "schedule" && "Target Schedule"}
              {activeSection === "penalty" && "Miss Penalty"}
              {activeSection === "roadmap" && "Roadmap"}
              {activeSection !== "schedule" && activeSection !== "penalty" && activeSection !== "roadmap" && "Predictor"}
            </span>
          </div>

          <p style={{ fontSize: 12, color: "#64748b", margin: "3px 0 0 0", lineHeight: 1.4 }}>
            {activeSection === "schedule" && "Routine timetable projection and date-by-date attendance forecast."}
            {activeSection === "penalty" && "Simulate how missing upcoming classes directly impacts your attendance."}
            {activeSection === "roadmap" && "Step-by-step milestone progression to hit your target goal safely."}
            {activeSection !== "schedule" && activeSection !== "penalty" && activeSection !== "roadmap" && "Timetable projection & date-by-date attendance forecast."}
          </p>
        </div>

        {/* Right side of Header */}
        {!isPenaltyView && (
          /* For schedule or roadmap tabs: Keep clean target badge */
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              padding: isMobile ? "4px 10px" : "5px 12px",
              borderRadius: 8,
              fontSize: isMobile ? 12 : 12.5,
              fontWeight: 800,
              color: "#1d4ed8",
              whiteSpace: "nowrap",
            }}
          >
            <Target size={14} color="#2563eb" />
            <span>Target: <strong>{targetGoal}%</strong></span>
          </div>
        )}
      </div>

      {/* ── ACTIVE SUBJECT & MISSED CLASSES SIMULATOR (ONE LINE WITH SMALL DESC) ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: isMobile ? "12px 14px" : "14px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
        }}
      >
        {/* Small Desc so student understands what this is & what to do here */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            flexDirection: isMobile ? "column" : "row",
            gap: 6,
            paddingBottom: 10,
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                background: isPenaltyView ? "#fff1f2" : "#eff6ff",
                color: isPenaltyView ? "#e11d48" : "#2563eb",
                padding: "2px 7px",
                borderRadius: 5,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {isPenaltyView ? <TrendingDown size={12} /> : <BookOpen size={12} />}
              {isPenaltyView ? "Simulation Controls" : "Active Subject"}
            </span>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.4 }}>
              {isPenaltyView
                ? "Select a subject, then pick or type how many classes you might miss to instantly forecast your attendance drop & recovery."
                : "Choose a subject to examine routine timetable forecast, weekly load, and date milestones."}
            </p>
          </div>

          {isPenaltyView && (
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, whiteSpace: "nowrap" }}>
              Direct type or click presets
            </span>
          )}
        </div>

        {/* ONE LINE: Subject Selector on Left + Miss Selector on Right */}
        <div
          style={{
            display: "flex",
            alignItems: isMobile ? "stretch" : "center",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          {/* Sub Choose (Subject Dropdown) */}
          <div style={{ flex: 1, minWidth: 0 }}>
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
          </div>

          {/* Miss Select (Presets + Stepper) on the SAME LINE */}
          {isPenaltyView && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                justifyContent: isMobile ? "flex-start" : "flex-end",
                flexShrink: 0,
              }}
            >
              {/* Presets */}
              <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 4 : 5 }}>
                {[1, 2, 3, 5, 8].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSimulateMissCount(num)}
                    style={{
                      background: simulateMissCount === num ? "#0f172a" : "#f8fafc",
                      color: simulateMissCount === num ? "#ffffff" : "#475569",
                      border: `1px solid ${simulateMissCount === num ? "#0f172a" : "#cbd5e1"}`,
                      padding: isMobile ? "4px 8px" : "6px 10px",
                      borderRadius: 7,
                      fontSize: isMobile ? 11 : 11.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      whiteSpace: "nowrap",
                    }}
                  >
                    +{num} Miss
                  </button>
                ))}
              </div>

              {/* Direct Type / Stepper Input */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "3px 6px",
                  boxSizing: "border-box",
                }}
              >
                <button
                  type="button"
                  onClick={() => setSimulateMissCount(Math.max(1, simulateMissCount - 1))}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 5,
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    color: "#0f172a",
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
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
                      width: 30,
                      textAlign: "center",
                      border: "none",
                      background: "transparent",
                      fontSize: 13.5,
                      fontWeight: 800,
                      color: "#0f172a",
                      outline: "none",
                      padding: 0,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>
                    {simulateMissCount === 1 ? "Class" : "Classes"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSimulateMissCount(Math.min(50, simulateMissCount + 1))}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 5,
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    color: "#0f172a",
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── HIGH-LEVEL SUMMARY HERO CARDS (CLEAN EXECUTIVE SAAS) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(220px, 1fr))",
          gap: isMobile ? 8 : 12,
        }}
      >
        {/* Card 1: Current Status / Status After Miss */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: isMobile ? "12px 14px" : "15px 18px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 4,
            boxSizing: "border-box",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
          }}
        >
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.4px" }}>
            {isPenaltyView ? "Status After Miss" : "Current Status"}
          </div>
          <div
            style={{
              fontSize: isMobile ? 22 : 24,
              fontWeight: 800,
              color: isPenaltyView
                ? (Number(missPenaltyData?.missedSessions?.[missPenaltyData.missedSessions.length - 1]?.runningPercentage ?? currentPct) >= Number(targetGoal) ? "#059669" : "#dc2626")
                : (isCurrentlySafe ? "#059669" : "#0f172a"),
              lineHeight: 1.15,
            }}
          >
            {isPenaltyView
              ? `${missPenaltyData?.missedSessions?.[missPenaltyData.missedSessions.length - 1]?.runningPercentage ?? currentPct}%`
              : `${currentPct}%`}
          </div>
          {isPenaltyView ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 700, lineHeight: 1.3, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                <span>-{Math.abs(currentPct - (missPenaltyData?.missedSessions?.[missPenaltyData.missedSessions.length - 1]?.runningPercentage ?? currentPct)).toFixed(1)}% drop</span>
                <span style={{ color: "#64748b", fontWeight: 600 }}>(Current: {currentPct}%)</span>
              </div>
              <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 600, lineHeight: 1.2 }}>
                {weeklyOccurrences.length > 0 ? `${weeklyOccurrences.length} classes/week routine` : "Routine timetable"}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.3 }}>
              {totalAttended}/{totalDelivered} classes ({activeCalculation?.deficit || 0} deficit)
            </div>
          )}
        </div>

        {/* Card 2: Sprint Needed / Safe Bunks / Requirement After Miss */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: isMobile ? "12px 14px" : "15px 18px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 4,
            boxSizing: "border-box",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
          }}
        >
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.4px" }}>
            {isPenaltyView
              ? "Requirement After Miss"
              : (isCurrentlySafe ? "Safe Bunks" : `Sprint for ${targetGoal}%`)}
          </div>
          <div style={{ fontSize: isMobile ? 19 : 22, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
            {isPenaltyView
              ? `${missPenaltyData?.newNeeded ?? 0} Classes`
              : (isCurrentlySafe
                  ? `${activeCalculation?.safeBunks || 0} Safe Bunks`
                  : `${activeCalculation?.classesNeeded || 0} Classes`)}
          </div>
          <div style={{ fontSize: 11, color: isPenaltyView ? (missPenaltyData?.extraClassesNeeded > 0 ? "#b45309" : "#16a34a") : "#64748b", lineHeight: 1.3, fontWeight: isPenaltyView ? 600 : 400 }}>
            {isPenaltyView
              ? `+${missPenaltyData?.extraClassesNeeded ?? 0} extra needed (orig: ${missPenaltyData?.baseNeeded ?? 0})`
              : (isCurrentlySafe ? "Can miss safely" : "100% streak needed")}
          </div>
        </div>

        {/* Card 3: Reach Date / New Reach Date */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: isMobile ? "12px 14px" : "15px 18px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 4,
            boxSizing: "border-box",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
          }}
        >
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4, letterSpacing: "0.4px" }}>
            <CalendarIcon size={12} color="#64748b" /> {isPenaltyView ? "New Reach Date" : "Reach Date"}
          </div>
          <div style={{ fontSize: isMobile ? 15.5 : 18, fontWeight: 800, color: "#0f172a", lineHeight: 1.25, wordBreak: "break-word" }}>
            {isPenaltyView
              ? (missPenaltyData?.delayedProjection?.estimatedDate || (missPenaltyData?.delayedProjection?.isAttainable === false ? "Beyond Sem" : (isCurrentlySafe ? "Achieved" : "Exceeds Sem")))
              : (baseProjection?.estimatedDate || (isCurrentlySafe ? "Achieved" : "Exceeds Sem"))}
          </div>
          <div style={{ fontSize: 11, color: isPenaltyView ? (missPenaltyData?.delayedProjection?.isAttainable === false ? "#dc2626" : "#b45309") : "#64748b", lineHeight: 1.3, fontWeight: isPenaltyView ? 600 : 400 }}>
            {isPenaltyView
              ? (missPenaltyData?.delayedProjection?.isAttainable === false
                  ? "Exceeds timetable"
                  : `+${missPenaltyData?.delayInDays ?? 0} days delay (${weeklyOccurrences.length}/wk)`)
              : (baseProjection ? `~${baseProjection.estimatedWeeks} wks (${baseProjection.classesPerWeek}/wk)` : "Timetable active")}
          </div>
        </div>

        {/* Card 4: Semester Attainability */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: isMobile ? "12px 14px" : "15px 18px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 4,
            boxSizing: "border-box",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
          }}
        >
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4, letterSpacing: "0.4px" }}>
            <Activity size={12} color="#64748b" /> {isPenaltyView ? "Attainability" : "Timeline"}
          </div>
          <div
            style={{
              fontSize: isMobile ? 16 : 18,
              fontWeight: 800,
              color: isPenaltyView
                ? (missPenaltyData?.delayedProjection?.isAttainable ? "#059669" : "#dc2626")
                : (baseProjection?.isAttainable ? "#059669" : "#dc2626"),
              lineHeight: 1.2,
            }}
          >
            {isPenaltyView ? (
              missPenaltyData?.delayedProjection?.isAttainable ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  Attainable <CheckCircle2 size={14} color="#059669" />
                </span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  Critical <AlertTriangle size={14} color="#dc2626" />
                </span>
              )
            ) : (
              baseProjection?.isAttainable ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  Attainable <CheckCircle2 size={14} color="#059669" />
                </span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  Critical <AlertTriangle size={14} color="#dc2626" />
                </span>
              )
            )}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.3 }}>
            Max: {isPenaltyView ? (missPenaltyData?.delayedProjection?.maxAttainablePercentage || currentPct) : (baseProjection?.maxAttainablePercentage || currentPct)}% (31 Oct)
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
        {/* ── MISS PENALTY & RECOVERY: 3 CLEAN, NON-BULKY SECTIONS ── */}
        {engineView === "penalty_simulator" && (
          <motion.div
            key="penalty_simulator"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {/* ══════════════════════════════════════════════════════════
                SECTION 1: PLANNED TO BE MISSED CLASSES
            ══════════════════════════════════════════════════════════ */}
            {missPenaltyData?.missedSessions && missPenaltyData.missedSessions.length > 0 && (
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 16,
                  padding: isMobile ? "14px 12px" : "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  boxSizing: "border-box",
                  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
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
                    <h4
                      style={{
                        fontSize: isMobile ? 14.5 : 16,
                        fontWeight: 800,
                        color: "#0f172a",
                        margin: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                      }}
                    >
                      <TrendingDown size={17} color="#dc2626" />
                      Planned to be Missed Classes ({missPenaltyData.missedSessions.length})
                    </h4>
                    <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
                      Upcoming timetable sessions that will be marked absent in this simulation:
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: "#fff1f2",
                        color: "#dc2626",
                        padding: "3px 9px",
                        borderRadius: 6,
                        border: "1px solid #fecaca",
                      }}
                    >
                      Attendance drops to {missPenaltyData.missedSessions[missPenaltyData.missedSessions.length - 1]?.runningPercentage || 0}%
                    </span>

                    {missPenaltyData.missedSessions.length > 15 && (
                      <button
                        type="button"
                        onClick={() => setShowAllDates(!showAllDates)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          background: "#f8fafc",
                          color: "#475569",
                          border: "1px solid #cbd5e1",
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {showAllDates ? <><ChevronUp size={13} /> Show Less</> : <><ChevronDown size={13} /> View All ({missPenaltyData.missedSessions.length})</>}
                      </button>
                    )}
                  </div>
                </div>

                {/* Missed Sessions Grid */}
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
                          background: "#f8fafc",
                          border: `1px solid ${isSafeAfterMiss ? "#e2e8f0" : "#fed7aa"}`,
                          borderRadius: 10,
                          padding: "11px 13px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        {/* Top row: Miss # + Date + Safe/Warning badge */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                background: "#0f172a",
                                color: "#ffffff",
                                padding: "1.5px 6px",
                                borderRadius: 4,
                              }}
                            >
                              Miss #{missSes.missNumber}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>
                              {missSes.dateStr}
                            </span>
                          </div>

                          {isSafeAfterMiss ? (
                            <span
                              style={{
                                fontSize: 9.5,
                                fontWeight: 700,
                                background: "#ecfdf5",
                                color: "#059669",
                                border: "1px solid #a7f3d0",
                                padding: "1px 6px",
                                borderRadius: 4,
                              }}
                            >
                              Safe &ge; {targetGoal}%
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: 9.5,
                                fontWeight: 700,
                                background: "#fff1f2",
                                color: "#dc2626",
                                border: "1px solid #fecaca",
                                padding: "1px 6px",
                                borderRadius: 4,
                              }}
                            >
                              Below {targetGoal}%
                            </span>
                          )}
                        </div>

                        {/* Time slot & Room */}
                        <div style={{ fontSize: 11, color: "#64748b", display: "flex", justifyContent: "space-between" }}>
                          <span><Clock size={11} style={{ display: "inline", verticalAlign: "middle" }} /> {missSes.timeSlot}</span>
                          <span>Room {missSes.room} ({missSes.type})</span>
                        </div>

                        {/* Running count & percentage */}
                        <div
                          style={{
                            marginTop: 2,
                            paddingTop: 5,
                            borderTop: "1px solid #e2e8f0",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: 11,
                          }}
                        >
                          <span style={{ color: "#64748b" }}>Resulting Attendance:</span>
                          <strong style={{ color: isSafeAfterMiss ? "#059669" : "#dc2626" }}>
                            {missSes.runningAttended}/{missSes.runningDelivered} ({missSes.runningPercentage}%)
                          </strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                SECTION 2: RECOVERY SCHEDULE
            ══════════════════════════════════════════════════════════ */}
            {recoverySessions.length > 0 && (
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 16,
                  padding: isMobile ? "14px 12px" : "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  boxSizing: "border-box",
                  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
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
                    <h4
                      style={{
                        fontSize: isMobile ? 14.5 : 16,
                        fontWeight: 800,
                        color: "#0f172a",
                        margin: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                      }}
                    >
                      <CalendarCheck size={17} color="#059669" />
                      Recovery Schedule ({recoverySessions.length} Classes Needed)
                    </h4>
                    <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
                      Consecutive classes you must attend post-absence to restore your {targetGoal}% target:
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
                        background: "#f8fafc",
                        color: "#475569",
                        border: "1px solid #cbd5e1",
                        padding: "5px 12px",
                        borderRadius: 6,
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {showAllRecoveryDates ? (
                        <>
                          <ChevronUp size={13} /> Show Less (15)
                        </>
                      ) : (
                        <>
                          <ChevronDown size={13} /> View All ({recoverySessions.length})
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Recovery Sessions Grid */}
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
                          background: isMilestone ? "#f0fdf4" : "#f8fafc",
                          border: `1px solid ${isMilestone ? "#86efac" : "#e2e8f0"}`,
                          borderRadius: 10,
                          padding: "11px 13px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                background: isMilestone ? "#059669" : "#0f172a",
                                color: "#ffffff",
                                padding: "1.5px 6px",
                                borderRadius: 4,
                              }}
                            >
                              Recovery #{recSes.sessionNumber}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>
                              {recSes.dateStr}
                            </span>
                          </div>

                          {isMilestone ? (
                            <span
                              style={{
                                fontSize: 9.5,
                                fontWeight: 800,
                                background: "#dcfce7",
                                color: "#15803d",
                                border: "1px solid #86efac",
                                padding: "1.5px 6px",
                                borderRadius: 4,
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              <Target size={10} /> {targetGoal}% RESTORED!
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: 9.5,
                                fontWeight: 700,
                                background: "#ffffff",
                                color: "#475569",
                                border: "1px solid #e2e8f0",
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
                            marginTop: 2,
                            paddingTop: 5,
                            borderTop: "1px solid #e2e8f0",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: 11,
                          }}
                        >
                          <span style={{ color: "#64748b" }}>Resulting Attendance:</span>
                          <strong
                            style={{
                              color: recSes.runningPercentage >= targetGoal ? "#059669" : "#2563eb",
                            }}
                          >
                            {recSes.runningAttended}/{recSes.runningDelivered} ({recSes.runningPercentage}%)
                          </strong>
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
                        border: "1px dashed #cbd5e1",
                        color: "#475569",
                        padding: "7px 16px",
                        borderRadius: 8,
                        fontSize: 11.5,
                        fontWeight: 700,
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
